// landing: the cast, group "Mayflies" (stage 3). docs/build/landing/3-cast-mayflies.md is its log; the plan is
// docs/build/landing/3-cast-plan.md; the family is docs/life/insects.md (makeMayflies).
//
//   4. Mayflies: before the hatch 210 dancing in three swarms (70 by the lamp tuft at (32, -9.5), 90 in the sun's reeds
//      at (36, +12.5), 50 under the right of the bridge at (38.5, +11)) and 600 at rest on the bridge's soffit, struts
//      and piles for d -16 to +16. After the hatch up to 1,800 in the air and up to 300 spent on the water, in three
//      zones of 9.5 m radius at (49, 0), (59, 0), (69, 0).
//  14. The river blooming: this module gives the hatch's CONTROLS (shared.cast.mayflies, below). The staging is stage.js's.
//
// What stands here: one makeMayflies (two draws: the near mesh and the far), in the landing's own light:
//   * the family's rule lit: 'sun' (dull straw at 0.55, on fire only within about 25 degrees of the sun: the page's
//     forward-scatter rule, the director's second law: nothing glitters), following the realm's key light;
//   * under it the area's SHADE (shared.landing.extend with no rim: a rim on a beating wing card twinkles), so a fly in
//     the shade of the reeds or of the door's cloth is tea-brown, and there it also loses most of its fire (M.fireInShade).
//   The family builds its paint itself and takes no `extend` from an area, so it is handed a ctx whose kit adds the
//   area's extension before the family's own and one line after it (wearing(), below). See "Asked of the engine".
//
// shared.cast.mayflies (for the stager; every call returns the handle):
//   flies                   the family's own handle (docs/life/insects.md): object, near, far, uniforms, rule, count
//   swarms, zones           the places: [{ s, d, x, z, count | radius }]
//   release({ from, speed })  the 600 at rest let go in a wave (default: from above the boat, 6 m/s)
//   hatch(i, { ramp, rate })  zone i begins (default: climbing to 9 rings a second over 4 s)
//   spend(n, seconds, { at }) n of those in the air fall spent (the page: 120 over 6 s, then 180 more over 10 s)
//   attend(on, { circle, seats, lift })  twelve gather round the prow lantern's crook and two settle on it;
//                           attend(false) lets them go (seats: points in the boat's frame, above 0.9 m: see the note there)
//   part(x, y, z, radius = 1.2, seconds = 2)   a lane where a swift passes, closing in 2 s (up to eight at once)
//   stir(i = 0)             swarm i swirls up and settles (0: the swarm by the lamp tuft, for the lamp's note)
//   strength(k = 0.6, seconds = 10)   thin the dance to a share of itself (the page: 60 per cent after 90 s)
//   settle(what = 'all', i) the after-state at once, for a cue's settle: 'rest' (the 600 dancing), 'hatch' (zone i, or all)
//   counts()                { resting, air, spent, unborn } now
//   bloom(spent = 0)        everything in the air at once (and that many lying spent): the hatch at its height
//
// Developer switches: &bloom=1 the hatch at its height from the first frame (all 1,800 in the air; the cost is measured
//   so); &bloom=spent the same with 300 lying spent; &bloom=go the wave and the three zones begin as the realm starts
//   (with &t=6 the wave has run and the first rings are standing); &mayattend=1 a dozen at the prow lantern;
//   &maystir=1 the lamp tuft's swarm swirls up; &maydebug=1 prints the perch counts and the sun's agreement.
import * as THREE from 'three';
import { makeMayflies } from '../../engine/life/insects.js';

const QS = new URLSearchParams(typeof location !== 'undefined' ? location.search : '');

// ---- this group's own numbers (the plan's, and what was settled in the picture)
const M = {
  // the dance: [s, d], how many, the swarm's radius, the heights its dancers start their rises from (the family adds a
  // rise of up to 1.75 m and a breath of 0.6 m: the third swarm dances under the deck, whose soffit is at 3.17 m there)
  swarms: [
    { at: [32, -9.5], count: 70, radius: 1.8, height: [0.4, 4.5] },          // by the lamp tuft
    { at: [36, 12.5], count: 90, radius: 2.2, height: [0.6, 4.5] },          // in the sun's reeds
    { at: [38.5, 11], count: 50, radius: 1.4, height: [0.4, 2.0] },          // under the right of the bridge
  ],
  rest: 600, restD: 16,                                                      // at rest on the bridge for |d| < 16
  share: { soffit: 330, face: 80, pile: 110, strut: 80 },                    // where the 600 sit
  to: { radius: 3.4, height: [0.5, 2.4] },                                   // where each dances once released (kept under the deck's soffit)
  zones: [[49, 0], [59, 0], [69, 0]], zoneRadius: 9.5, zoneCount: 330,       // 210 + 600 + 990 = 1,800 in the air
  // the prow lantern (the boat's frame): seats on the crook (its top is the boat's published point; the second is a
  // hand's breadth along its arc toward the lantern, read from the picture), how far above the flame they gather, and
  // the height of the hull's keep-out while they do
  seats: [[0.1969, 1.0816, -2.3076], [0.27, 1.069, -2.304]], attendLift: 0.3, attendHull: 0.8,
  fireInShade: 0.25,                                                         // what a fly in the shade keeps of its fire toward the sun
  underside: 0.42,                                                           // how dark a fly is before a bright ground (the sky seen from below, the door's lit cloth): a share of its straw
};

/**
 * A ctx for a toolkit family, whose paints wear the area's light: every kit.gouache the family makes gets `first`
 * before its own extensions and `last` after them. (The family's `material` option cannot carry an `extend`.)
 */
function wearing(ctx, first, last) {
  const kit = Object.create(ctx.kit);
  kit.gouache = (o = {}) => ctx.kit.gouache({ ...o, extend: [first, ...[].concat(o.extend || []), last].filter(Boolean) });
  const c = Object.create(ctx); c.kit = kit;
  return c;
}

/**
 * Perch points with their normals on the bridge for |d| < M.restD, READ FROM THE MODEL ITSELF: a ray is sent at the
 * bridge's own meshes and the fly sits where it lands, with that face's normal. (The plan's nominal soffit lies inside
 * the model's outer baulks, which are deeper than the plan's: flies put there by the numbers were buried in timber.)
 * From below (whatever the rider under the span sees first: baulks, boards, the raking struts), from either side at
 * the baulks' height (their outer faces), round the piles of the inner towers above the wet band, round the struts.
 */
function bridgePerches(P, br, rnd, stats = {}) {
  const f = br.frame, T = new THREE.Vector3(f.tx, 0, f.tz), out = [], D = M.restD, t0 = performance.now();
  // ---- the bridge's own triangles near its middle, in the realm's space, binned by d (three.js's ray caster tries
  // every triangle of the three files for every ray: 0.7 s for these 680 rays; binned, a ray meets a few hundred)
  const cell = 0.5, lo = -(D + 2.5), nb = Math.ceil(-2 * lo / cell), bins = Array.from({ length: nb }, () => []), tri = [];
  const v = new THREE.Vector3(), q = new Float64Array(9);
  for (const m of Object.values(br.models || {})) {
    const root = m && m.group; if (!root) continue;
    root.updateWorldMatrix(true, true);
    root.traverse((o) => {
      if (!o.isMesh || o.isInstancedMesh || o.isSkinnedMesh || !o.geometry || !o.geometry.attributes.position) return;
      const pos = o.geometry.attributes.position, idx = o.geometry.index, n = idx ? idx.count : pos.count;
      for (let i = 0; i + 2 < n; i += 3) {
        let d0 = 1e9, d1 = -1e9;
        for (let k = 0; k < 3; k++) {
          v.fromBufferAttribute(pos, idx ? idx.getX(i + k) : i + k).applyMatrix4(o.matrixWorld);
          q[k * 3] = v.x; q[k * 3 + 1] = v.y; q[k * 3 + 2] = v.z;
          const d = (v.x - f.x) * f.rx + (v.z - f.z) * f.rz; if (d < d0) d0 = d; if (d > d1) d1 = d;
        }
        if (d1 < lo || d0 > -lo) continue;
        const t = tri.length / 9; for (let k = 0; k < 9; k++) tri.push(q[k]);
        for (let c = Math.max(0, Math.floor((d0 - lo) / cell)); c <= Math.min(nb - 1, Math.floor((d1 - lo) / cell)); c++) bins[c].push(t);
      }
    });
  }
  const a = new THREE.Vector3(), ax = new THREE.Vector3(), u = new THREE.Vector3(), w = new THREE.Vector3(), n = new THREE.Vector3(), from = new THREE.Vector3(), dir = new THREE.Vector3(), hit = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0);
  let rays = 0;
  /** Send a ray (origin, unit direction, reach); keep where it first lands if keep(point, normal) says so. */
  const land = (o, d, far, kind, keep) => {
    rays++;
    const da = (o.x - f.x) * f.rx + (o.z - f.z) * f.rz, db = da + (d.x * f.rx + d.z * f.rz) * far;
    let best = far, bn = null;
    for (let c = Math.max(0, Math.floor((Math.min(da, db) - lo) / cell)); c <= Math.min(nb - 1, Math.floor((Math.max(da, db) - lo) / cell)); c++) {
      for (const t of bins[c]) {
        const i = t * 9, e1x = tri[i + 3] - tri[i], e1y = tri[i + 4] - tri[i + 1], e1z = tri[i + 5] - tri[i + 2], e2x = tri[i + 6] - tri[i], e2y = tri[i + 7] - tri[i + 1], e2z = tri[i + 8] - tri[i + 2];
        const px = d.y * e2z - d.z * e2y, py = d.z * e2x - d.x * e2z, pz = d.x * e2y - d.y * e2x, det = e1x * px + e1y * py + e1z * pz;
        if (det > -1e-10 && det < 1e-10) continue;
        const inv = 1 / det, sx = o.x - tri[i], sy = o.y - tri[i + 1], sz = o.z - tri[i + 2], uu = (sx * px + sy * py + sz * pz) * inv;
        if (uu < 0 || uu > 1) continue;
        const qx = sy * e1z - sz * e1y, qy = sz * e1x - sx * e1z, qz = sx * e1y - sy * e1x, vv = (d.x * qx + d.y * qy + d.z * qz) * inv;
        if (vv < 0 || uu + vv > 1) continue;
        const tt = (e2x * qx + e2y * qy + e2z * qz) * inv;
        if (tt > 1e-4 && tt < best) { best = tt; bn = i; }
      }
    }
    if (bn === null) return false;
    const i = bn;
    n.set((tri[i + 4] - tri[i + 1]) * (tri[i + 8] - tri[i + 2]) - (tri[i + 5] - tri[i + 2]) * (tri[i + 7] - tri[i + 1]),
      (tri[i + 5] - tri[i + 2]) * (tri[i + 6] - tri[i]) - (tri[i + 3] - tri[i]) * (tri[i + 8] - tri[i + 2]),
      (tri[i + 3] - tri[i]) * (tri[i + 7] - tri[i + 1]) - (tri[i + 4] - tri[i + 1]) * (tri[i + 6] - tri[i])).normalize();
    if (n.dot(d) > 0) n.negate();
    hit.copy(o).addScaledVector(d, best);
    if (keep && !keep(hit, n)) return false;
    out.push({ x: hit.x + n.x * 0.002, y: hit.y + n.y * 0.002, z: hit.z + n.z * 0.002, nx: n.x, ny: n.y, nz: n.z, kind });
    return true;
  };
  const fill = (kind, want, one) => { let got = 0; for (let k = 0; k < want * 4 && got < want; k++) if (one(got, k)) got++; stats[kind] = got; };
  // from below: under the baulks and the boards (and the struts of the central span): they hang
  fill('soffit', M.share.soffit, (i) => {
    const d = -D + 2 * D * (i + rnd()) / M.share.soffit;
    return land(from.fromArray(br.pt(d, 1.3, (rnd() - 0.5) * 1.36)), UP, 3.4, 'soffit', (p, nn) => p.y > 2.2 && nn.y < -0.4);
  });
  // from either side at the baulks' height: upright faces, where they sit head up
  fill('face', M.share.face, (i, k) => {
    const d = -D + 2 * D * (i + rnd()) / M.share.face, side = k % 2 ? 1 : -1;
    return land(from.fromArray(br.pt(d, br.soffit(d) - 0.05 + rnd() * 0.3, side * 1.7)), dir.copy(T).multiplyScalar(-side), 1.5, 'face', (p, nn) => Math.abs(nn.y) < 0.5);
  });
  // round the piles of the inner towers, above the wet band
  const piles = (br.piles || []).filter((p) => Math.abs(p.d) < D + 0.9);
  if (piles.length) fill('pile', M.share.pile, (i) => {
    const p = piles[i % piles.length], t = 0.18 + 0.78 * rnd();
    if (t < 0.5) a.lerpVectors(p.at, p.mid, t * 2); else a.lerpVectors(p.mid, p.head, t * 2 - 1);
    if (a.y < 0.8) return false;
    ax.subVectors(p.head, p.at).normalize(); u.crossVectors(ax, T).normalize(); w.crossVectors(ax, u);
    const phi = rnd() * Math.PI * 2;
    dir.copy(u).multiplyScalar(-Math.cos(phi)).addScaledVector(w, -Math.sin(phi));
    return land(from.copy(a).addScaledVector(dir, -0.8), dir, 0.8, 'pile', (q) => q.y > 0.75);
  });
  // round the raking struts of the central span: beneath them and on their sides
  const lines = br.strutLines || [];
  if (lines.length) fill('strut', M.share.strut, (i) => {
    const line = lines[i % lines.length], t = (0.08 + 0.84 * rnd()) * (line.length - 1), k = Math.min(line.length - 2, Math.floor(t));
    a.lerpVectors(line[k], line[k + 1], t - k); ax.subVectors(line[k + 1], line[k]).normalize();
    u.crossVectors(ax, UP).normalize(); w.crossVectors(ax, u); if (w.y > 0) w.negate();           // u: to one side; w: beneath
    const phi = (rnd() - 0.5) * 3.6;
    dir.copy(w).multiplyScalar(-Math.cos(phi)).addScaledVector(u, -Math.sin(phi));
    return land(from.copy(a).addScaledVector(dir, -0.6), dir, 0.6, 'strut');
  });
  stats.rays = rays; stats.triangles = tri.length / 9; stats.ms = Math.round(performance.now() - t0);
  return out;
}

export async function build(ctx, plan, shared) {
  shared.cast = shared.cast || {};
  const L = shared.landing, P = plan, br = shared.bridge, calm = !!ctx.reducedMotion;
  const rnd = ctx.rng(4104);

  // ---- where the 600 rest
  const perchStats = {}, perches = br ? bridgePerches(P, br, rnd, perchStats) : [];

  // ---- the area's light on the family's paint: the shade under the family's rule, and less fire in the shade after it
  // (the last line, after the family's rule: lSun is the area's, 1 in the sun and 0 in the shade; V looks from the fly to the eye.
  //  1. what the rule added toward the sun is mostly taken off again in the shade;
  //  2. VALUE (the director, 8 November: a thing must part from its ground by value). A swarm against the light is
  //     bright before a dark ground and DARK before a bright one. The landing has two bright grounds: the sky (what
  //     the eye sees looking up past the reed tops: a fly seen from below shows its shaded underside) and the door's
  //     lit cloth (the eye's ray through the fly is carried on to the cloth's plane at s 75: if it lands on the nine
  //     bolts, the fly is a dark fleck on the linen and takes no fire). Before reeds, tuft, timber and water it is the
  //     page's straw speck that burns toward the sun. At rest on the bridge, and wherever the eye's ray through it goes
  //     on up into the deck (seen from under the span), it stays pale: its ground there is dark timber.)
  const bf = br ? br.frame : { x: 0, z: 0, tx: 0, tz: 1 }, gf = L.frame(P.gate.s, {});
  const fire = { value: +(QS.get('mayshade') ?? M.fireInShade) }, under = { value: +(QS.get('mayunder') ?? M.underside) };
  const may = await makeMayflies(wearing(ctx, L.extend({ rim: 0, soft: 0.6 }), {
    uniforms: { uLMayFire: fire, uLMayUnder: under, uLMayDeck: { value: new THREE.Vector4(bf.x, bf.z, bf.tx, bf.tz) }, uLMaySoffit: { value: br ? br.soffit(0) - 0.15 : 3.35 },
      uLMayCloth: { value: new THREE.Vector4(gf.x, gf.z, gf.tx, gf.tz) }, uLMayGate: { value: new THREE.Vector2(P.gate.mast, P.gate.line) } },
    // (kind, tau and wRest are the family's own: a fly of the resting or the hatching kind that has not yet let go sits on
    // its timber or stands on the water it came out of. One settled on the lantern's crook is not of these: its ground is
    // whatever lies behind the crook.)
    vertexPars: /* glsl */`varying float vLMayRest;`,
    vertexLocal: /* glsl */`vLMayRest = (kind > 0.5 && tau < 0.3) ? wRest : 0.0;`,
    fragmentPars: /* glsl */`uniform float uLMayFire, uLMayUnder, uLMaySoffit; uniform vec4 uLMayDeck, uLMayCloth; uniform vec2 uLMayGate; varying float vLMayRest;`,
    light: /* glsl */`{
      vec3 lFire = uLitColor * (uLitK.y * pow(max(dot(V, normalize(uLitDir)), 0.0), uLitK.z) * mix(uLitK.w, 1.0, vThin));
      float lTo = (uLMaySoffit - vWPos.y) / max(-V.y, 1e-3);
      float lSoffit = step(0.0, lTo) * step(1e-3, -V.y) * (1.0 - smoothstep(0.7, 0.95, abs(dot(vWPos.xz - V.xz * lTo - uLMayDeck.xy, uLMayDeck.zw))));
      float lAlong = -dot(V.xz, uLMayCloth.zw);
      float lS = dot(uLMayCloth.xy - vWPos.xz, uLMayCloth.zw) / max(lAlong, 1e-4);
      vec3 lHit = vWPos - V * lS;
      float lCloth = step(1e-4, lAlong) * step(0.0, lS) * (1.0 - smoothstep(uLMayGate.x - 1.0, uLMayGate.x + 0.2, abs(dot(lHit.xz - uLMayCloth.xy, vec2(-uLMayCloth.w, uLMayCloth.z)))))
        * smoothstep(0.2, 0.9, lHit.y) * (1.0 - smoothstep(uLMayGate.y - 0.6, uLMayGate.y + 0.2, lHit.y));
      float lBright = max(smoothstep(0.12, 0.3, -V.y), lCloth) * (1.0 - max(vLMayRest, lSoffit));
      c = (c - lFire) * mix(1.0, uLMayUnder, lBright) + lFire * (1.0 - lBright) * (1.0 - (1.0 - lSun) * (1.0 - uLMayFire)); }`,
  }), {
    swarms: M.swarms.map((g) => ({ position: L.at(g.at[0], g.at[1], 0), count: g.count, radius: g.radius, height: g.height })),
    rest: perches.length ? { points: perches, count: Math.min(M.rest, perches.length), to: M.to } : null,
    hatch: M.zones.map(([s, d]) => ({ position: L.at(s, d, 0), radius: M.zoneRadius, count: M.zoneCount })),
    tails: 2, lit: 'sun',
    // crisp: the painter's filter leaves them as drawn (a fly 18 m off is four pixels: the brush wiped the swarm by the lamp tuft out of the mooring's view)
    material: QS.get('maycrisp') === '0' ? {} : { crisp: true },
    // reduced motion: the family halves the rise and the breath; the page also slows them by a third
    cycle: calm ? 3.7 * 1.5 : 3.7, riseTime: calm ? 1.5 * 1.5 : 1.5, rise: 1.4, breathe: 0.6, breathePeriod: calm ? 13.5 : 9,
    seed: 41,
    // a spent fly landing within 4 m of the boat is a tick (its ring is the family's: 0.04 / 0.1; an emergence's 0.12)
    onTouch: (x, z, kind) => { if (kind === 'spent' && Math.hypot(x - ctx.boat.x, z - ctx.boat.z) < 4) ctx.audio.play('tick', { x, z, pitch: 0.3, gain: 0.2 }); },
  });

  // ---- cost: the family draws every instance always (the unborn at no size). The 990 of the three zones stand last in
  // its order, so they are left out of the draw until their zone begins: before the hatch 810 are drawn, not 1,800.
  const zoneN = Math.max(1, Math.round(M.zoneCount * (ctx.quality.density ?? 1)));
  let live = may.count - M.zones.length * zoneN;
  const begin = (i) => { live = Math.max(live, may.count - (M.zones.length - 1 - i) * zoneN); };
  for (const m of [may.near, may.far]) {
    const own = m.onBeforeRender;
    m.onBeforeRender = function (...args) { own.apply(this, args); if (m.geometry.instanceCount > live) m.geometry.instanceCount = live; };
  }

  // ---- the handles
  const _lamp = new THREE.Vector3(), _seat = [0, 1, 2, 3].map(() => new THREE.Vector3()), hull0 = may.shoves.uniforms.uHullK.value.y;
  const boatModel = () => ctx.engine.boat.model;
  const place = ([s, d], extra) => { const v = L.at(s, d, 0); return { s, d, x: v.x, z: v.z, ...extra }; };
  const H = shared.cast.mayflies = {
    flies: may, object: may.object,
    swarms: M.swarms.map((g) => place(g.at, { count: g.count, radius: g.radius })),
    zones: M.zones.map((z) => place(z, { radius: M.zoneRadius, count: M.zoneCount })),
    release(o = {}) { may.release({ from: [ctx.boat.x, ctx.boat.z], speed: 6, ...o }); return H; },
    hatch(i, o = {}) { begin(i); may.hatch(i, { ramp: 4, rate: 9, ...o }); return H; },
    spend(n = 120, seconds = 6, o = {}) { may.spend(n, seconds, o); return H; },
    // (The family keeps its flies out of a capsule along the hull, whole to 0.94 m above the water and fading out by
    // 1.7 m: the hero boat's lantern hangs at 0.77 m and its gunwale is at 0.5 m, so a fly sent to either was pushed a
    // metre to the side and sat on air. While they attend, the capsule is lowered to M.attendHull, the gathering is
    // lifted to the crook's own height, and the seats are on the crook: nothing can settle on the gunwale.)
    attend(on = true, o = {}) {
      const hullK = may.shoves.uniforms.uHullK.value;
      if (!on) { may.attend(null); ctx.stage.tween((v) => { hullK.y = v; }, hullK.y, hull0, 4); return H; }
      const m = boatModel(), seats = (o.seats || M.seats).slice(0, 4), lift = o.lift ?? M.attendLift;
      ctx.stage.tween((v) => { hullK.y = v; }, hullK.y, M.attendHull, 3);
      may.attend(() => { m.light.getWorldPosition(_lamp); _lamp.y += lift; return _lamp; }, { circle: o.circle ?? 12,
        seats: seats.map((q, i) => () => { m.group.updateWorldMatrix(true, false); return _seat[i].fromArray(q).applyMatrix4(m.group.matrixWorld); }) });
      return H;
    },
    part(x, y, z, radius = 1.2, seconds = 2) { may.part(x, y, z, radius, seconds); return H; },
    stir(i = 0, o = {}) { may.stir(i, o); return H; },
    strength(k = 0.6, seconds = 10) { may.strength(k, seconds); return H; },
    settle(what = 'all', i = null) { if (what !== 'rest') begin(i ?? M.zones.length - 1); may.settle(what, i); return H; },
    counts() { return may.counts(); },
    bloom(spent = 0) { H.settle('all'); if (spent) may.spend(spent, 1, { at: ctx.time - 40 }); return H; },
    drawn() { return live; },
  };

  // ---- developer switches (the staging itself is stage.js's)
  const bloom = QS.get('bloom');
  if (bloom === 'go') ctx.stage.after(0.1, () => { H.release(); M.zones.forEach((z, i) => H.hatch(i)); });      // (after the boat has been put in its place)
  else if (bloom === 'spent') H.bloom(300);
  else if (bloom != null) H.bloom(0);
  if (QS.has('mayattend')) ctx.stage.after(+QS.get('mayattend') || 0.1, () => H.attend(true));
  if (QS.has('maystir')) ctx.stage.after(+QS.get('maystir') || 0.1, () => H.stir(0));
  if (QS.has('maydebug')) {
    const ys = perches.filter((p) => p.kind === 'soffit').map((p) => p.y).sort((a, b) => a - b);
    console.error('MAYFLIES ' + JSON.stringify({ count: may.count, perches: perchStats, counts: may.counts(), soffitY: ys.length ? [ys[0], ys[ys.length >> 1], ys[ys.length - 1]].map((y) => +y.toFixed(2)) : null,
      planSoffit: br ? +br.soffit(0).toFixed(2) : null, piles: br ? br.piles.filter((p) => Math.abs(p.d) < M.restD + 0.9).length : 0, struts: br && br.strutLines ? br.strutLines.length : 0 }));
  }
  (shared.counts || (shared.counts = {})).mayflies = { instances: may.count, swarms: M.swarms.map((g) => g.count), rest: perches.length, perches: perchStats, zones: M.zones.length * M.zoneCount };
  return {};
}
