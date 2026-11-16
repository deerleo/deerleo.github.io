// Jellies: two animals whose motion must never be mixed (docs/art/README.md, "Devices that recur").
//
//   makeCombJellies   the town's lantern-jellies. COMB JELLIES (ctenophores): a ribbed, upright, soft lantern that
//                     glides by its eight comb rows alone. No bell, no pulse, no arms, no strings. A shimmer runs down
//                     the ribs; the body flexes and its lip trails; they roost under eaves and, let go by a front, climb
//                     in loose spirals to lie under the surface, and sink away again
//   makeMedusae       the sea's small bells. MEDUSAE: a bell that contracts, glides and relaxes, each on its own clock,
//                     four short arms following late; they hang where they are, sway on the swell, and contract and
//                     flare when the hull or a great swimmer comes near
//   makeGreatMedusae  the sea's nine great ones, metres across: a lobed bell, frilled arms, long tentacles down which
//                     light runs after each pulse
//
// All are instanced, one draw call a kind, each animal on its own clock; grown in code, vertex by vertex, as real
// geometry dressed in the ride's gouache material (so they take its fog and veil); drawn as solid things under the
// water, so the water itself bends them with every ripple, tints them and swallows them with depth (docs/water.md:
// give the realm's water `clarity`, `absorb` and `absorbDepth`); and never drawn in the mirror.
// The notes on the real animals, every option and the pictures are in docs/life/lights.md.
import * as THREE from 'three';
import { WATER_GLSL, waterUniforms } from '../water-final.js';

const _size = new THREE.Vector2();
const col = (c) => (c && c.isColor ? c.clone() : new THREE.Color(c ?? '#ffffff'));
const f32 = Math.fround;
function flat(points) {
  if (points instanceof Float32Array) return points;
  const out = new Float32Array(points.length * 3);
  points.forEach((p, i) => { if (Array.isArray(p)) out.set([p[0], p[1], p[2]], i * 3); else out.set([p.x, p.y, p.z], i * 3); });
  return out;
}
// pixels a metre covers at one metre from the eye, for the pass in progress (hairlines keep a least width in pixels)
function perPass(obj, mat) {
  obj.onBeforeRender = (renderer, scene, camera) => {
    const rt = renderer.getRenderTarget(), h = rt ? rt.height : renderer.getDrawingBufferSize(_size).y;
    mat.uniforms.uJPx.value = h * 0.5 * camera.projectionMatrix.elements[5]; mat.uniformsNeedUpdate = true;
  };
}
// distance from a point to the boat's keel line (stern to bow, just under the surface)
function hullDistance(boat, x, y, z) {
  const fx = -Math.sin(boat.heading), fz = -Math.cos(boat.heading);
  const al = Math.max(-1.5, Math.min(2.2, (x - boat.x) * fx + (z - boat.z) * fz));
  return Math.hypot(x - (boat.x + fx * al), y + 0.15, z - (boat.z + fz * al));
}

// ================================================================================================= comb jellies
// The lantern: a surface of revolution, crown up, mouth down. u runs from the crown (0) to the lip (1).
// [u, radius as a share of the half width, height above the lip as a share of the height]
// A soft oval: an egg with its blunt end up, widest a little above its middle (y 0.61), rounding in below to a mouth
// little more than half as wide, with a short soft lip. Both halves are arcs of ellipses: no straight taper (a cone
// below a dome is a balloon), and no flat foot (the first build's mouth was four fifths of the body and cut straight
// across: a barrel, which is a paper lantern's outline, not an animal's).
const COMB_PROFILE = [[0.06, 0.17, 0.987], [0.15, 0.47, 0.955], [0.27, 0.74, 0.875], [0.40, 0.93, 0.755], [0.53, 1.0, 0.61], [0.66, 0.975, 0.455], [0.78, 0.90, 0.30], [0.88, 0.775, 0.165], [0.95, 0.63, 0.065], [1.0, 0.56, 0.0]];
const COMB_PROFILE_LOW = [[0.08, 0.22, 0.985], [0.25, 0.66, 0.90], [0.45, 0.97, 0.70], [0.63, 0.99, 0.48], [0.84, 0.83, 0.21], [1.0, 0.56, 0.0]];
// 16 meridians (every comb row lies on a meridian of its own, so it runs straight) and 10 rings: 320 triangles, round
// at arm's length; 6 rings (192) on low quality
function combGeometry(low) {
  const pos = [], nrm = [], body = [], idx = [];
  const P = low ? COMB_PROFILE_LOW : COMB_PROFILE, rings = P.length, COMB_COLS = 16;
  const push = (r, y, th, u, part, nr, ny) => { pos.push(r * Math.cos(th), y, r * Math.sin(th)); const l = Math.hypot(nr, ny) || 1; nrm.push(nr / l * Math.cos(th), ny / l, nr / l * Math.sin(th)); body.push(u, th / (Math.PI * 2), part); return pos.length / 3 - 1; };
  // the crown's dimple: one point a little below the rim round it (the animal's sense organ sits in it)
  const crown = push(0, 0.958, 0, 0, 0, 0, 1);
  const ring = [];
  for (let j = 0; j < rings; j++) {
    const [u, r, y] = P[j], a = P[Math.max(0, j - 1)], b = P[Math.min(rings - 1, j + 1)];
    const dr = b[1] - a[1], dy = b[2] - a[2];                                  // the profile's direction here (down the body)
    ring.push([]);
    for (let i = 0; i <= COMB_COLS; i++) ring[j].push(push(r, y, i / COMB_COLS * Math.PI * 2, u, 0, -dy * 0.42 / 0.17, dr));   // outward normal, for the body's own proportions
  }
  for (let i = 0; i < COMB_COLS; i++) idx.push(crown, ring[0][i + 1], ring[0][i]);
  for (let j = 0; j < rings - 1; j++) for (let i = 0; i < COMB_COLS; i++) { const a = ring[j][i], b = ring[j][i + 1], c = ring[j + 1][i], d = ring[j + 1][i + 1]; idx.push(a, b, c, b, d, c); }
  // the mouth: the lip turned in and up to a dark throat, so that the form is closed and has thickness at its edge
  const lip = [], [, rl] = P[rings - 1];
  for (let i = 0; i <= COMB_COLS; i++) lip.push(push(rl * 0.93, 0.0, i / COMB_COLS * Math.PI * 2, 1, 1, -0.3, -1));
  const throat = push(0, 0.30, 0, 0.7, 1, 0, -1);
  for (let i = 0; i < COMB_COLS; i++) idx.push(throat, lip[i], lip[i + 1]);
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
  g.setAttribute('aBody', new THREE.Float32BufferAttribute(body, 3)); g.setIndex(idx);
  return g;
}

// Where a lantern's middle is. The same lines in GLSL (the vertex shader) and in JavaScript (to know which ones the hull
// has come near): change both or neither.
//   home xyz;  seed (a, b, c, d);  way (x reach, z reach, turns a second, y reach);  times (let go at, startled at, stays extra, spiral reach)
//   rise (climb m/s, ceiling y, seconds under the surface, sink m/s);  sink (the clock time at which those that have
//   risen are told to sink away, and the share of each one's own lateness that then applies);  t the realm's time;  T the show clock
const COMB_CENTRE_GLSL = /* glsl */`
  vec3 combCentre(vec4 home, vec4 seed, vec4 way, vec4 times, vec4 rise, vec2 sink, float t, float T) {
    float sd = seed.x * 6.2831853;
    vec3 p = home.xyz + vec3(way.x * sin(t * way.z + sd), way.w * sin(t * way.z * 0.61 + sd * 1.7), way.y * sin(t * way.z * 0.83 + sd * 2.3));
    float tau = T - times.x;
    float top = rise.y - 0.22 * home.w;                                             // its crown never comes nearer the surface than the ceiling
    if (tau > 0.0) {
      float gap = max(top - home.y, 0.0);
      float climb = rise.x * (tau - 1.2 * (1.0 - exp(-tau / 1.2)));                 // off the roost gently, then at its pace
      float up = -log(exp(-2.2 * climb) + exp(-2.2 * gap)) / 2.2;                   // and gently to rest under the surface
      float tc = 1.2 + gap / max(rise.x, 0.01);                                     // seconds from letting go to arriving
      float ts = max(max(tau - tc - rise.z - times.z, T - sink.x - times.z * sink.y), 0.0);      // seconds since it began to sink away (its stay is over, or it was told to)
      float down = rise.w * (ts - 2.5 * (1.0 - exp(-ts / 2.5)));
      down = -log(exp(-1.5 * down) + exp(-1.5 * gap)) / 1.5;
      float turn = (seed.y < 0.5 ? -1.0 : 1.0) * (0.20 + 0.16 * seed.z);            // radians a second round the place it left
      float ang = sd + turn * (min(tau, tc) + 0.25 * max(tau - tc, 0.0));
      float rho = times.w * (1.0 - exp(-tau / 5.0)) * (1.0 + 0.25 * sin(tau * 0.7 + sd * 3.0)) + 0.014 * max(tau - tc, 0.0);
      p += vec3(cos(ang) * rho, up - down, sin(ang) * rho);
    }
    p.y = min(p.y, top);
    float a = t - times.y;                                                          // startled: it sinks a metre over three seconds, and comes back much later
    p.y -= smoothstep(0.0, 3.0, a) * (1.0 - smoothstep(10.0, 24.0, a));
    return p;
  }`;
const _smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
function combCentre(out, home, seed, way, times, o, rise, sink, t, T) {
  const sd = seed[o] * 6.2831853, hx = home[o], hy = home[o + 1], hz = home[o + 2], wz = way[o + 2];
  let x = hx + way[o] * Math.sin(t * wz + sd), y = hy + way[o + 3] * Math.sin(t * wz * 0.61 + sd * 1.7), z = hz + way[o + 1] * Math.sin(t * wz * 0.83 + sd * 2.3);
  const tau = T - times[o], top = rise.y - 0.22 * home[o + 3];
  if (tau > 0) {
    const gap = Math.max(top - hy, 0), climb = rise.x * (tau - 1.2 * (1 - Math.exp(-tau / 1.2)));
    const up = -Math.log(Math.exp(-2.2 * climb) + Math.exp(-2.2 * gap)) / 2.2;
    const tc = 1.2 + gap / Math.max(rise.x, 0.01), ts = Math.max(tau - tc - rise.z - times[o + 2], T - sink.x - times[o + 2] * sink.y, 0);
    let down = rise.w * (ts - 2.5 * (1 - Math.exp(-ts / 2.5)));
    down = -Math.log(Math.exp(-1.5 * down) + Math.exp(-1.5 * gap)) / 1.5;
    const turn = (seed[o + 1] < 0.5 ? -1 : 1) * (0.20 + 0.16 * seed[o + 2]);
    const ang = sd + turn * (Math.min(tau, tc) + 0.25 * Math.max(tau - tc, 0));
    const rho = times[o + 3] * (1 - Math.exp(-tau / 5)) * (1 + 0.25 * Math.sin(tau * 0.7 + sd * 3)) + 0.014 * Math.max(tau - tc, 0);
    x += Math.cos(ang) * rho; y += up - down; z += Math.sin(ang) * rho;
  }
  y = Math.min(y, top);
  const a = t - times[o + 1];
  y -= _smooth(0, 3, a) * (1 - _smooth(10, 24, a));
  out.x = x; out.y = y; out.z = z;
  return out;
}

/**
 * Lantern-jellies: comb jellies. Upright ribbed lanterns that glide; no bell, no pulse, no arms, nothing like a paper
 * lantern. Some drift about their own streets (`residents`); the rest hang at `roosts` (under eaves, awnings, lamp
 * brackets) until they are let go, climb in loose spirals to lie just under the surface, stay, and sink away.
 *
 *   const lanterns = makeCombJellies(ctx, { residents: streetPoints, roosts: eavePoints });
 *   // the bell's letting go: a ring from the tower at 10 m/s, three seconds behind the light, ragged by a second
 *   stage.cue('stroke', { s: 176 }, () => lanterns.release((x, y, z) => 6 + Math.hypot(x - tower.x, z - tower.z) / 10, 1));
 *   // in update(): lanterns.tick(stage.clock('stroke'));
 *
 * opts:
 *   residents      [[x, y, z], ...] where the wandering ones live (y is below the water: -4 to -16 in the town)
 *   roosts         [[x, y, z], ...] where the others hang until `release`
 *   size           [0.85, 1.15]: each animal's own scale. At 1 it is 0.42 m tall and 0.34 m across
 *   body, rim, rib   colours: the rose-gold light inside ('#f3a77e'), the jade of its edge ('#4aa391') and of its ribs ('#7adcc6')
 *   glow           brightness of the body (1.4: never brighter than a window at 1.6); ribGlow: of a comb row at rest
 *                  (0.9); shimmer: what the travelling shimmer adds to a row where it passes (1.3)
 *   glass          true (default): the body is clear, what is behind it shows through, with the animal's light laid
 *                  over; false: the same light painted on a dark body that hides what is behind it
 *   behind         12 metres: the water taken to lie between an animal and the ground seen through it (what shows
 *                  through a clear body is tinted and dimmed by that much of the realm's water, as the water tints
 *                  the ground round it): the depth of your streets below where the animals lie
 *   roam           [2, 6] metres a resident strays from its place, at `drift` [0.05, 0.15] m/s
 *   shimmerEvery   [3, 5] seconds between shimmers (each animal its own), 1.2 s from crown to lip
 *   turnEvery      [20, 40] seconds for one turn about its own axis
 *   rise           0.55 m/s in the release;  ceiling: -0.6 (the nearest they come to the surface);
 *   stay           90 seconds under the surface, then they sink away over the next `stayRag` (45) seconds at `sink` (0.12 m/s)
 *   spiral         [0.7, 1.7] metres: how far out each one's spiral swings
 *   near           2.5 metres: inside this distance of the hull, or of anything in `disturb`, an animal flares once,
 *                  draws in by a tenth and sinks a metre over three seconds; it stays down while that thing stays over
 *                  the place it left, and comes back up over a quarter of a minute once it has gone (0: tame)
 *   disturb        [{ position: Vector3 (yours to move), radius }] great swimmers; they also shoulder the animals aside
 *   count          thinned by the quality setting unless `exact`;  seed, parent
 * Returns { object, count, residents, roosts,
 *   tick(T)                    the show clock (releases are timed on it)
 *   release(when, rag)         when: a clock time, or (x, y, z, i) => clock time for each roosting animal (a front's
 *                              arrival: (x, y, z) => front.arrival(x, y, z)); rag: each lets go up to this many seconds late (1)
 *   releaseAll(T)              all at once at T (a realm entered part-way: releaseAll(-1e4) leaves them long sunk away;
 *                              releaseAll(-30) leaves them lying under the surface)
 *   sink(when, rag)            those that have risen sink away from clock time `when` (default now), each up to `rag`
 *                              seconds later (20): the square going to sleep, whatever is left of their `stay`
 *   hold()                     back on their roosts, at once (before the show, or under the veil)
 *   positionOf(i, out)         where animal i is now (a Vector3): the residents first, then the roosting ones
 *   nearSurface(depth, fn)     calls fn(x, y, z, i) for every animal shallower than `depth` (for insects that gather over them)
 *   onStartle                  set it to (x, y, z, i) => {} to hear an animal flare }
 */
export function makeCombJellies(ctx, opts = {}) {
  const o = { residents: [], roosts: [], size: [0.85, 1.15], body: '#f3a77e', rim: '#4aa391', rib: '#7adcc6', glow: 1.4, ribGlow: 0.9, shimmer: 1.3, glass: true, behind: 12,
    roam: [2, 6], drift: [0.05, 0.15], shimmerEvery: [3, 5], turnEvery: [20, 40], rise: 0.55, ceiling: -0.6, stay: 90, stayRag: 45, sink: 0.12, spiral: [0.7, 1.7],
    near: 2.5, disturb: [], exact: false, seed: 77, parent: null, ...opts };
  const engine = ctx.engine, rnd = ctx.rng(o.seed), density = o.exact ? 1 : (ctx.quality.density || 1);
  const thin = (pts) => { const a = flat(pts), n = a.length / 3, keepN = Math.max(n ? 1 : 0, Math.round(n * density)); return { a, n: keepN, step: n / Math.max(1, keepN) }; };
  const R = thin(o.residents), Q = thin(o.roosts), n = R.n + Q.n;
  const home = new Float32Array(n * 4), seed = new Float32Array(n * 4), way = new Float32Array(n * 4), times = new Float32Array(n * 4);
  let w = 0;
  const add = (src, i, resident) => {
    const k = Math.min(src.a.length / 3 - 1, Math.floor(i * src.step)) * 3;
    const sc = o.size[0] + (o.size[1] - o.size[0]) * rnd();
    home.set([src.a[k], Math.min(src.a[k + 1], o.ceiling - 0.25 * sc), src.a[k + 2], sc], w * 4);
    seed.set([rnd(), rnd(), rnd(), rnd()], w * 4);
    if (resident) {
      const reach = o.roam[0] + (o.roam[1] - o.roam[0]) * rnd(), speed = o.drift[0] + (o.drift[1] - o.drift[0]) * rnd(), aspect = 0.55 + 0.45 * rnd();
      way.set([reach, reach * aspect, speed / reach, 0.25 + 0.5 * rnd()], w * 4);
    } else way.set([0.05 + 0.05 * rnd(), 0.05 + 0.05 * rnd(), 0.12 + 0.1 * rnd(), 0.025], w * 4);       // on its roost it only stirs
    times.set([1e9, -1e9, o.stayRag * rnd(), o.spiral[0] + (o.spiral[1] - o.spiral[0]) * rnd()], w * 4);
    w++;
  };
  for (let i = 0; i < R.n; i++) add(R, i, true);
  for (let i = 0; i < Q.n; i++) add(Q, i, false);

  const geo = combGeometry(ctx.quality.level === 'low');
  const aTimes = new THREE.InstancedBufferAttribute(times, 4); aTimes.setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute('aHome', new THREE.InstancedBufferAttribute(home, 4)); geo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seed, 4));
  geo.setAttribute('aWay', new THREE.InstancedBufferAttribute(way, 4)); geo.setAttribute('aTimes', aTimes);
  geo.instanceCount = n;
  const rise = new THREE.Vector4(o.rise * (ctx.reducedMotion ? 0.7 : 1), o.ceiling, o.stay, o.sink);      // reduced motion: a slower climb
  const DIS = 4, dis = Array.from({ length: DIS }, () => new THREE.Vector4(0, -1000, 0, 0)), sinkJ = new THREE.Vector2(1e9, 0);
  const uniforms = {
    ...waterUniforms(engine), uClockJ: { value: -1 }, uRiseJ: { value: rise }, uSinkJ: { value: sinkJ }, uDisJ: { value: dis },
    uBodyJ: { value: col(o.body).multiplyScalar(o.glow) }, uRimJ: { value: col(o.rim).multiplyScalar(o.glow) }, uRibJ: { value: col(o.rib) },
    uGlowJ: { value: new THREE.Vector4(o.ribGlow, o.shimmer, o.shimmerEvery[0], o.shimmerEvery[1] - o.shimmerEvery[0]) },
    uTurnJ: { value: new THREE.Vector2(o.turnEvery[0], o.turnEvery[1] - o.turnEvery[0]) },
    // (the water's own colours, live from the realm's look, and how much of them the water behind an animal adds)
    uDeepJ: { value: ctx.waterLook && ctx.waterLook.deep && ctx.waterLook.deep.isColor ? ctx.waterLook.deep : new THREE.Color(0, 0, 0) },
    uShallowJ: { value: ctx.waterLook && ctx.waterLook.shallow && ctx.waterLook.shallow.isColor ? ctx.waterLook.shallow : new THREE.Color(0, 0, 0) },
    uBehindJ: { value: 0 },
  };
  // The body is clear jelly with light in it. With `glass` (the default) what is behind it shows through it, with the
  // animal's light laid over (see `final` below). glass: false paints the same light on a dark body that hides what
  // is behind it (the first build's way).
  const glass = o.glass !== false;
  const material = ctx.kit.gouache({ color: glass ? '#000000' : '#1c1420', shade: 0, brush: glass ? 0 : 0.25, extend: {
    uniforms,
    vertexPars: /* glsl */`
      attribute vec3 aBody; attribute vec4 aHome, aSeed, aWay, aTimes;
      uniform float uClockJ; uniform vec4 uRiseJ, uDisJ[${DIS}]; uniform vec2 uTurnJ, uSinkJ; uniform vec4 uGlowJ;
      varying vec4 vJ; varying vec3 vJ2, vJP; varying vec2 vJS;
      ${WATER_GLSL}
      ${COMB_CENTRE_GLSL}`,
    vertexLocal: /* glsl */`
      {
        float u = aBody.x, sd = aSeed.x * 6.2831853, sc = aHome.w, tJ = uTime;
        // where it is, and where it was a quarter of a second ago: the lip follows late, so a moving animal leans into its travel
        vec3 cNow = combCentre(aHome, aSeed, aWay, aTimes, uRiseJ, uSinkJ, tJ, uClockJ);
        vec3 cWas = combCentre(aHome, aSeed, aWay, aTimes, uRiseJ, uSinkJ, tJ - 0.25, uClockJ - 0.25);
        vec3 vel = (cNow - cWas) * 4.0;
        // great swimmers shoulder it aside
        for (int i = 0; i < ${DIS}; i++) { vec4 dz = uDisJ[i]; if (dz.w > 0.0) { vec3 dd = cNow - dz.xyz; float dl = max(length(dd), 0.05); cNow += dd / dl * dz.w * 0.7 * (1.0 - smoothstep(dz.w * 0.5, dz.w * 2.2, dl)); } }
        // the water's own rings, where it is near enough to the surface to feel them
        vec4 rip = waterRipple(cNow.xz); float shallow = exp(min(cNow.y, 0.0) * 0.55);
        // startled (the hull, a great swimmer): the ribs flare once and the body draws in by a tenth
        float aS = tJ - aTimes.y;
        float flare = smoothstep(0.0, 0.5, aS) * (1.0 - smoothstep(0.7, 2.2, aS));
        float drawn = 0.10 * max(smoothstep(0.0, 0.6, aS) * (1.0 - smoothstep(4.0, 9.0, aS)), smoothstep(0.06, 0.4, rip.w) * shallow);
        float climbing = clamp(vel.y / max(uRiseJ.x, 0.01), 0.0, 1.0);
        // ---- the soft body: a slow swell passes down its length, its mouth opens and closes a little, and it sways
        float girth = 1.0 + 0.045 * sin(tJ * 0.8 + sd - 3.0 * u) - drawn - 0.06 * climbing;
        girth += 0.07 * sin(tJ * 0.5 + sd * 2.0) * u * u * u;
        float tall = 1.0 + 0.07 * climbing + 0.5 * drawn;
        float th = aBody.y * 6.2831853;
        vec3 q = vec3(transformed.x * 0.17 * girth, (transformed.y - 0.5) * 0.42 * tall, transformed.z * 0.17 * girth) * sc;
        // the lip: a thin soft edge drawn out a little between the comb rows (eight shallow scallops), rippling slowly round
        float lipw = pow(u, 4.0), frill = cos(8.0 * th);
        q.y += sc * lipw * (0.005 * sin(3.0 * th + tJ * 0.9 + sd) + 0.003 * frill);   // (kept small: a deeper ripple notched the outline of the mouth like a cloven foot)
        q.xz *= 1.0 + lipw * (0.035 * sin(3.0 * th + tJ * 0.9 + sd + 1.3) - 0.028 * frill);
        q.xz += 0.035 * sc * u * vec2(sin(tJ * 0.45 + sd - 2.0 * u), cos(tJ * 0.37 + sd * 1.3 - 2.0 * u));
        // one slow turn about its own axis
        float spin = tJ * 6.2831853 / (uTurnJ.x + uTurnJ.y * aSeed.w) * (aSeed.z < 0.5 ? 1.0 : -1.0) + sd;
        float cs = cos(spin), sn = sin(spin);
        q.xz = vec2(q.x * cs - q.z * sn, q.x * sn + q.z * cs);
        vec3 nJ = normalize(vec3(objectNormal.x / 0.17, objectNormal.y / 0.42, objectNormal.z / 0.17));
        nJ.xz = vec2(nJ.x * cs - nJ.z * sn, nJ.x * sn + nJ.z * cs);
        // the lip trails what the crown does (a quarter of a second at the lip); a passing ring rocks the whole animal,
        // gently: a few degrees, however steep the ripple
        float lag = pow(u, 1.5);
        vec2 trail = vel.xz * 0.25; trail *= min(1.0, 0.11 * sc / max(length(trail), 1e-4));      // (it leans fifteen degrees at most)
        q.xz -= trail * lag; q.y -= vel.y * 0.25 * 0.3 * lag;
        vec2 rock = rip.xy * shallow; rock *= min(1.0, 0.2 / max(length(rock), 1e-4));
        q.xz += rock * 0.6 * (0.5 - u) * 0.42 * sc;
        transformed = cNow + q; objectNormal = nJ;
        // ---- light: a shimmer runs from crown to lip in 1.2 s, each animal on its own clock
        float every = uGlowJ.z + uGlowJ.w * aSeed.y;
        float ph = mod(tJ + aSeed.w * every, every) / 1.2;
        vJ = vec4(u, aBody.y, aBody.z, ph);
        vJ2 = vec3(flare, sd, shallow);
        vJP = vec3(position.x, position.y * 2.0 - 1.0, position.z);               // the place on the body, as on a ball of radius one
        vJS = vec2(cs, sn);
      }`,
    fragmentPars: /* glsl */`
      uniform vec3 uBodyJ, uRimJ, uRibJ, uDeepJ, uShallowJ; uniform vec4 uGlowJ; uniform float uBehindJ;
      varying vec4 vJ; varying vec3 vJ2, vJP; varying vec2 vJS;
      // a comb row at this place on the body: 1 on the row, 0 between two. th: the way round (0..1), aa: how much of a
      // row's spacing one pixel covers (far away the rows melt into an even share of their light). A row is a
      // centimetre wide on a body 34 cm across: a line, not a stripe
      float combRow(float th, float aa) {
        float c8 = abs(fract(th * 8.0 + 0.5) - 0.5) * 2.0;
        return mix(1.0 - smoothstep(0.04, 0.10 + aa, c8), 0.085, smoothstep(0.25, 0.9, aa));
      }
      // the combs themselves: a ladder of short plates down the row, twenty-six of them, with dark between
      float combBars(float u, float aa) { return mix(0.30 + 0.70 * smoothstep(-0.3, 0.45, sin(u * 163.4)), 0.70, smoothstep(0.15, 0.6, aa)); }
      // the shimmer: its head is at ph (0 the crown .. 1 the lip), keen ahead, with a glimmer dying away behind it; each
      // row runs a little out of step with its neighbours (k: which row), as the beating of real combs does
      float combShimmer(float u, float ph, float k, float sd) {
        float d = u - ph - 0.09 * sin(k * 2.4 + sd);
        float head = exp(-d * d / 0.011), tail = d < 0.0 ? 0.5 * exp(d / 0.2) : 0.0;
        return max(head, tail) * (1.0 - smoothstep(1.0, 1.4, ph));
      }`,
    light: /* glsl */`
      {
        float u = vJ.x;
        // The animal is clear jelly with light in it. Follow the eye's ray through the body (taken as a ball in its own
        // frame): how much jelly it crosses says how much of the inner light is seen, and where it comes out on the far
        // side says which of the far comb rows show through. Seeing all eight rows at once is what a comb jelly looks like.
        vec3 Vd = -V;
        vec3 dl = normalize(vec3(Vd.x * vJS.x + Vd.z * vJS.y, Vd.y, -Vd.x * vJS.y + Vd.z * vJS.x) / vec3(0.17, 0.21, 0.17));
        float rad = max(length(vJP), 1e-3), b = dot(vJP, dl);
        float thick = clamp(-b / rad, 0.0, 1.0);                                   // 0 at the silhouette .. 1 straight through the middle
        vec3 pFar = vJP + dl * max(-2.0 * b, 0.0);
        float thFar = atan(pFar.z, pFar.x) / 6.2831853, uFar = pow(clamp(0.5 - pFar.y * 0.5, 0.0, 1.0), 0.6);
        float aaT = fwidth(vJ.y * 8.0) * 2.0, aaU = fwidth(u * 26.0);
        float cloud = 0.8 + 0.2 * sin(vJ.y * 6.2831853 * 3.0 + vJ2.y) * sin(u * 7.0 + vJ2.y * 2.0);
        // the light it carries: small and warm, deep inside along its axis (where the eye's ray passes nearest the axis),
        // with a wider, much fainter warmth round it; the wall itself holds almost nothing
        float sAx = max(-dot(vJP.xz, dl.xz) / max(dot(dl.xz, dl.xz), 1e-4), 0.0);
        float rAx = length(vJP.xz + dl.xz * sAx), yAx = vJP.y + dl.y * sAx;
        float core = exp(-rAx * rAx / 0.075 - (yAx - 0.14) * (yAx - 0.14) / 0.20) * (0.85 + 0.15 * sin(yAx * 9.0 + vJ2.y * 3.0));
        float halo = exp(-rAx * rAx / 0.42 - (yAx - 0.06) * (yAx - 0.06) / 0.8);
        // (far off, where the body is a few pixels, its light is spread over the whole of it: a small rose light, not a lost spark)
        float farK = smoothstep(0.15, 0.8, aaT);
        vec3 lit = uBodyJ * ((0.004 + 0.012 * pow(thick, 1.5)) * cloud + (0.035 + 0.20 * farK) * halo + 0.40 * core);
        // its wall seen on its side: a fine cool edge, which is what draws its outline
        float edge = 1.0 - thick;
        lit += uRimJ * (0.012 + 0.30 * edge * edge * edge * edge * (1.0 - 0.55 * smoothstep(0.82, 1.0, u)));
        lit += uBodyJ * 0.07 * (1.0 - smoothstep(0.0, 0.08, u));                   // the sense organ in the crown's dimple
        // the comb rows, near side and far side: fine beaded lines of jade, and the shimmer on its way down them
        float ends = smoothstep(0.07, 0.17, u) * (1.0 - smoothstep(0.86, 0.96, u));
        float endsFar = smoothstep(0.07, 0.17, uFar) * (1.0 - smoothstep(0.86, 0.96, uFar));
        float kN = floor(vJ.y * 8.0 + 0.5), kF = floor(thFar * 8.0 + 0.5);
        float bandN = combShimmer(u, vJ.w, kN, vJ2.y), bandF = combShimmer(uFar, vJ.w, kF, vJ2.y);
        float rowN = combRow(vJ.y, aaT) * combBars(u, aaU) * ends, rowF = combRow(thFar, aaT * 1.5 + 0.04) * combBars(uFar, aaU * 1.5) * endsFar;
        vec3 ribN = uRimJ * (0.32 * uGlowJ.x) + uRibJ * (0.36 * (uGlowJ.y * bandN + 1.2 * vJ2.x));
        vec3 ribF = uRimJ * (0.32 * uGlowJ.x) + uRibJ * (0.36 * (uGlowJ.y * bandF + 1.2 * vJ2.x));
        lit += ribN * rowN * (0.55 + 0.45 * thick) + ribF * rowF * 0.4 * smoothstep(0.08, 0.5, thick);
        if (vJ.z > 0.5) lit = uBodyJ * 0.04 * (0.4 + 0.6 * u);                     // the throat, seen only from below
        glow += lit;
      }`,
    // glass: the body is a clear thing with light in it: its light is ADDED to what is behind it.
    // One thing has to be put right for that. The body writes its depth, so that the water above tints and swallows
    // the animal by its own depth; the water then treats the street BEHIND the body as if it too lay only that deep:
    // untinted, and up to several times as bright as the street round it. Over lit paving every lantern was a pale
    // milky egg. So what shows through the body is multiplied, colour by colour, by what the water would have taken
    // from it over the metres that lie behind the animal (`behind`: the blend's constant colour, kept up to date from
    // the realm's water below): then the body is as clear as the water round it. One number serves every animal, so
    // it is right for one depth of ground only: a little pale over deeper ground, a little dark over nearer.
    // And the water that lies behind the animal has a colour of its own, which the water above no longer adds there
    // (it takes the ground to be as near as the animal): the body gives that back too, or over dark ground every
    // lantern is a darker, redder egg than the water round it.
    final: glass ? `vec3 waterJ = mix(uDeepJ, uShallowJ, pow(max(V.y, 0.0), 1.5) * (1.0 - smoothstep(4.0, 70.0, length(vViewPos)))) * uBehindJ;
      gl_FragColor = vec4((max(glow, 0.0) + waterJ) * (1.0 - fog), 1.0);` : '',
  } });
  if (glass) {
    material.transparent = true; material.depthWrite = true;
    material.blending = THREE.CustomBlending; material.blendEquation = THREE.AddEquation;
    material.blendSrc = THREE.OneFactor; material.blendDst = THREE.ConstantColorFactor;            // picture = its light + what is behind x the water's own toll
    material.blendSrcAlpha = THREE.OneFactor; material.blendDstAlpha = THREE.OneFactor;
    material.blendColor = new THREE.Color(0.6, 0.6, 0.6);
  }
  const mesh = new THREE.Mesh(geo, material);
  mesh.name = 'comb-jellies'; mesh.frustumCulled = false;
  if (glass) mesh.renderOrder = -2;                                    // light under the water: drawn before it, so the water lies over them
  mesh.layers.set(1);                                                  // under the water: never in the mirror
  (o.parent || ctx.group).add(mesh);

  const _p = new THREE.Vector3(), sharedT = engine.shared.uTime;
  const api = {
    object: mesh, count: n, residents: R.n, roosts: Q.n, onStartle: null,
    tick(T) { uniforms.uClockJ.value = T; return api; },
    release(when, rag = 1) {
      for (let i = R.n; i < n; i++) {
        const t0 = typeof when === 'function' ? when(home[i * 4], home[i * 4 + 1], home[i * 4 + 2], i) : when;
        times[i * 4] = t0 + rag * seed[i * 4 + 3];                     // each lets go up to `rag` seconds after its turn comes
      }
      sinkJ.x = 1e9; aTimes.needsUpdate = true; return api;
    },
    releaseAll(T) { for (let i = R.n; i < n; i++) times[i * 4] = T; sinkJ.x = 1e9; aTimes.needsUpdate = true; return api; },
    /** Those that have risen sink away from clock time `when` (default now), each up to `rag` seconds later (20), whatever is left of their stay. */
    sink(when = uniforms.uClockJ.value, rag = 20) { sinkJ.set(when, Math.max(0, rag) / Math.max(o.stayRag, 1e-3)); return api; },
    hold() { for (let i = R.n; i < n; i++) times[i * 4] = 1e9; sinkJ.x = 1e9; aTimes.needsUpdate = true; return api; },
    positionOf(i, out = new THREE.Vector3()) { return combCentre(out, home, seed, way, times, i * 4, rise, sinkJ, f32(sharedT.value), uniforms.uClockJ.value); },
    nearSurface(depth, fn) { for (let i = 0; i < n; i++) { api.positionOf(i, _p); if (_p.y > -depth) fn(_p.x, _p.y, _p.z, i); } },
  };
  // which animals has the hull (or a great swimmer) come near? A bounded pass on the CPU: one position each, a few compares
  ctx.onUpdate(() => {
    const t = sharedT.value, boat = ctx.boat; let changed = false;
    if (glass) {
      // what the realm's water takes, colour by colour, from a thing `behind` metres further down (the water's own
      // numbers: src/engine/water-final.js: clarity or opacity, absorb, absorbDepth; 1.15: the ray's slant in the water)
      const W = ctx.waterLook || {}, sigma = W.clarity > 0 ? 1.1 / W.clarity : -Math.log(1 - Math.min(0.9995, W.opacity ?? 0.94));
      const k = Math.exp(-Math.min(sigma, 20) * o.behind * 1.15), e = o.behind / Math.max(0.05, W.absorbDepth ?? 4), a = W.absorb && W.absorb.isColor ? W.absorb : null;
      material.blendColor.setRGB(k * (a ? Math.pow(Math.max(a.r, 1e-3), e) : 1), k * (a ? Math.pow(Math.max(a.g, 1e-3), e) : 1), k * (a ? Math.pow(Math.max(a.b, 1e-3), e) : 1));
      uniforms.uBehindJ.value = 1 - k;
    }
    for (let i = 0; i < DIS; i++) { const d = o.disturb[i]; if (d && d.radius > 0 && d.position) dis[i].set(d.position.x, d.position.y, d.position.z, d.radius); else dis[i].w = 0; }
    for (let i = 0; i < n; i++) {
      // Startled, an animal flares once, draws in and sinks a metre over three seconds (a < 4.5: left alone). While
      // whatever startled it stays over the place it left, it stays down and drawn in (it is held at a = 4: no second
      // flare, no movement). Once that has gone it comes back up (a from 10 to 24) and only then can be startled anew.
      // (The first build asked again after nine seconds, a metre down: an animal beside a hull at rest was set back to
      // the top of its sink, a jump of a metre in one frame, every nine seconds.)
      const a = t - times[i * 4 + 1];
      if (a < 4.5 || (a >= 10 && a < 24)) continue;
      const hy = home[i * 4 + 1];
      if (hy < -6 && times[i * 4] > 1e8) {                             // deep and not released: only a great swimmer can reach it
        let any = false; for (let k = 0; k < DIS; k++) if (dis[k].w > 0) any = true;
        if (!any) continue;
      }
      api.positionOf(i, _p);
      const sunk = a < 10 ? 1 : 0;                                     // metres it lies below the place it left (judge that place, not where it has sunk to)
      let hit = _p.y + sunk > -4 && hullDistance(boat, _p.x, _p.y + sunk, _p.z) < o.near;
      for (let k = 0; k < DIS && !hit; k++) if (dis[k].w > 0 && Math.hypot(_p.x - dis[k].x, _p.y + sunk - dis[k].y, _p.z - dis[k].z) < dis[k].w + o.near * 0.5) hit = true;
      if (!hit) continue;
      if (a < 10) times[i * 4 + 1] = t - 4;                            // still there: stay down
      else { times[i * 4 + 1] = t; if (api.onStartle) api.onStartle(_p.x, _p.y, _p.z, i); }
      changed = true;
    }
    if (changed) aTimes.needsUpdate = true;
  });
  return api;
}

// ================================================================================================= medusae
// One shader serves the small bells and the great ones: every vertex carries its relaxed place, its contracted place,
// how late it follows the bell (seconds) and how far it sways, so bell, lobes, arms and tentacles differ only in data.
// Units: the bell's margin radius, relaxed, is 1; y is up from the plane of the margin.
// part: 0 bell, 1 lobe (lappet), 2 oral arm, 3 tentacle (a hairline that faces the eye)

// [u, r relaxed, y relaxed, r contracted, y contracted] from the apex (u 0) to the margin (u 1)
const SMALL_BELL = [[0.4, 0.50, 0.82, 0.45, 0.95], [0.75, 0.87, 0.50, 0.75, 0.62], [1.0, 1.0, 0.0, 0.80, -0.05]];
const SMALL_APEX = [0.92, 1.04];
const GREAT_BELL = [[0.12, 0.17, 0.73, 0.155, 0.85], [0.26, 0.36, 0.70, 0.33, 0.815], [0.42, 0.57, 0.62, 0.51, 0.74], [0.58, 0.76, 0.50, 0.66, 0.62],
  [0.72, 0.89, 0.36, 0.755, 0.47], [0.84, 0.97, 0.21, 0.79, 0.30], [0.93, 1.0, 0.09, 0.775, 0.15], [1.0, 1.0, 0.0, 0.74, 0.03]];
const GREAT_APEX = [0.74, 0.86];

function medusaBuilder() {
  const pos = [], con = [], nrm = [], body = [], flex = [], idx = [];
  const v = (p, c, n, b, f) => { pos.push(p[0], p[1], p[2]); con.push(c[0], c[1], c[2]); const l = Math.hypot(n[0], n[1], n[2]) || 1; nrm.push(n[0] / l, n[1] / l, n[2] / l); body.push(b[0], b[1], b[2], b[3]); flex.push(f[0], f[1], f[2], f[3]); return pos.length / 3 - 1; };
  const done = () => {
    const g = new THREE.InstancedBufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aCon', new THREE.Float32BufferAttribute(con, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
    g.setAttribute('aBody', new THREE.Float32BufferAttribute(body, 4)); g.setAttribute('aFlex', new THREE.Float32BufferAttribute(flex, 4)); g.setIndex(idx);
    return g;
  };
  return { v, idx, done, count: () => pos.length / 3 };
}
// the bell: a dome of `cols` meridians through the rings of a profile; its margin follows its crown late
function addBell(B, profile, apex, cols, marginLag, lobes = 0) {
  const TAU = Math.PI * 2;
  const top = B.v([0, apex[0], 0], [0, apex[1], 0], [0, 1, 0], [0, 0, 0, 0], [0, 0, 0, 0]);
  const rings = profile.map(([u, r, y, rc, yc], j) => {
    const a = profile[Math.max(0, j - 1)], b = profile[Math.min(profile.length - 1, j + 1)], dr = b[1] - a[1], dy = b[2] - a[2], out = [], last = j === profile.length - 1;
    for (let i = 0; i <= cols; i++) {
      const th = i / cols * TAU, cx = Math.cos(th), sz = Math.sin(th);
      // lobes: the margin drawn out and down a little between its notches (a small medusa's lappets)
      const lobe = last && lobes ? 0.5 + 0.5 * Math.cos(th * lobes) : 0, k = 1 + 0.045 * lobe, dip = -0.05 * lobe;
      out.push(B.v([r * k * cx, y + dip, r * k * sz], [rc * k * cx, yc + dip, rc * k * sz], [-dy * cx, dr, -dy * sz], [u, i / cols, 0, marginLag * u], [0, 0, 0, 0]));
    }
    return out;
  });
  for (let i = 0; i < cols; i++) B.idx.push(top, rings[0][i + 1], rings[0][i]);
  for (let j = 0; j < rings.length - 1; j++) for (let i = 0; i < cols; i++) { const a = rings[j][i], b = rings[j][i + 1], c = rings[j + 1][i], d = rings[j + 1][i + 1]; B.idx.push(a, b, c, b, d, c); }
}

/**
 * The small bell, in three weights:
 *   'full'   a dome of sixteen meridians whose margin is drawn into eight shallow lobes, four short arms of two pieces: 96 triangles
 *   'plain'  twelve meridians, a plain margin: 76 triangles (what low quality uses for the near ones)
 *   'far'    ten meridians, a plain margin, arms of one piece: 58 triangles. For the bells that hang deep, which are
 *            never within six metres of the eye: there a ten-sided bell cannot be told from a round one, and the
 *            law allows a thing instanced in its thousands no more than sixty triangles (docs/art-direction.md, "Budget")
 */
function smallMedusaGeometry(weight = 'full') {
  const B = medusaBuilder(), TAU = Math.PI * 2, armRows = weight === 'far' ? 1 : 2;
  addBell(B, SMALL_BELL, SMALL_APEX, weight === 'full' ? 16 : weight === 'plain' ? 12 : 10, 0.10, weight === 'full' ? 8 : 0);
  for (let a = 0; a < 4; a++) {                                        // four oral arms: tapering ribbons from under the middle of the bell
    const th = (a + 0.5) / 4 * TAU, cx = Math.cos(th), sz = Math.sin(th), tx = -sz, tz = cx, rows = [];
    for (let j = 0; j <= armRows; j++) {
      const t = j / armRows, y = 0.42 - 1.55 * t, r = 0.13 + 0.10 * Math.sin(t * Math.PI), w = 0.11 * (1 - 0.8 * t), rc = r * (0.7 + 0.3 * t);
      const row = [];
      for (const side of [-1, 1]) row.push(B.v([r * cx + tx * w * side, y, r * sz + tz * w * side], [rc * cx + tx * w * side * 0.8, y + 0.10 * (1 - t), rc * sz + tz * w * side * 0.8], [cx, 0.2, sz], [t, (a + 0.5) / 4, 2, 0.2 + 0.7 * t], [0.05 + 0.22 * t, side, a * 1.7, 0]));
      rows.push(row);
    }
    for (let j = 0; j < armRows; j++) B.idx.push(rows[j][0], rows[j][1], rows[j + 1][0], rows[j][1], rows[j + 1][1], rows[j + 1][0]);
  }
  return B.done();
}

/**
 * A great one: a bell of 32 meridians, lobes round its margin, four frilled oral arms folded like curtains, and fine
 * tentacles from the notches between the lobes. With the defaults (32 lobes, 24 tentacles) about 3,000 triangles.
 * Three tentacles and one sense organ to each eighth of the margin, a notch for each: that is why a medusa with 24
 * tentacles has 32 lobes (the sea nettles, Chrysaora). `lobes: 16, tentacles: 8` is the other true pattern (Pelagia).
 */
function greatMedusaGeometry({ lobes = 32, tentacles = 24, armSegs = 54, tentSegs = 26, armLength = 2.8, tentLength = 8.6 } = {}) {
  const B = medusaBuilder(), TAU = Math.PI * 2, cols = 32;
  addBell(B, GREAT_BELL, GREAT_APEX, cols, 0.22);
  // ---- lobes (lappets): soft tongues hanging from the margin, which curl in under the bell as it closes, a moment late
  for (let k = 0; k < lobes; k++) {
    const th0 = (k + 0.5) / lobes * TAU, half = TAU / lobes * 0.47, at = (th, r, y) => [r * Math.cos(th), y, r * Math.sin(th)];
    const n = [Math.cos(th0), -0.2, Math.sin(th0)], lag = (s) => 0.22 + 0.16 * s;
    // a rounded tongue: [how far down it (0..1), share of its width, r and y open, r and y closed]
    const rows = [[0, 1.0, 1.0, 0.0, 0.74, 0.03], [0.55, 0.94, 1.022, -0.075, 0.705, -0.04], [0.88, 0.62, 1.027, -0.122, 0.668, -0.074]].map(([s, w, r, y, rc, yc]) => [-1, 1].map((side) =>
      B.v(at(th0 + side * half * w, r, y), at(th0 + side * half * w, rc, yc), n, [1 + 0.25 * s, th0 / TAU + side * 0.5 / lobes * w * 0.94, 1, lag(s)], [0.012 * s, 0, k, 0])));
    const tip = B.v(at(th0, 1.028, -0.14), at(th0, 0.655, -0.085), n, [1.25, th0 / TAU, 1, lag(1)], [0.02, 0, k, 0]);
    for (let j = 0; j < 2; j++) B.idx.push(rows[j][0], rows[j][1], rows[j + 1][0], rows[j][1], rows[j + 1][1], rows[j + 1][0]);
    B.idx.push(rows[2][0], rows[2][1], tip);
  }
  // ---- the mouth tube under the middle of the bell, from which the four arms hang
  {
    const ringAt = (y, r, yc, t) => { const out = []; for (let i = 0; i <= 8; i++) { const th = i / 8 * TAU, cx = Math.cos(th), sz = Math.sin(th); out.push(B.v([r * cx, y, r * sz], [r * 0.9 * cx, yc, r * 0.9 * sz], [cx, 0, sz], [t, i / 8, 2, 0.15 + 0.2 * t], [0.01 * t, 0, 0, 0])); } return out; };
    const r0 = ringAt(0.52, 0.17, 0.62, 0), r1 = ringAt(0.05, 0.13, 0.14, 0.5), r2 = ringAt(-0.22, 0.10, -0.14, 1);
    for (const [p, q] of [[r0, r1], [r1, r2]]) for (let i = 0; i < 8; i++) B.idx.push(p[i], p[i + 1], q[i], p[i + 1], q[i + 1], q[i]);
  }
  // ---- four oral arms: each a curtain folded along its spine (a V in section), its two edges gathered into frills
  for (let a = 0; a < 4; a++) {
    const th = (a + 0.5) / 4 * TAU, cx = Math.cos(th), sz = Math.sin(th), tx = -sz, tz = cx, rows = [];
    for (let j = 0; j <= armSegs; j++) {
      const t = j / armSegs, y = -0.18 - armLength * t;
      const r = 0.10 + 0.16 * Math.sin(Math.min(1, t * 2.2) * Math.PI * 0.5) * (1 - 0.55 * t);          // out from the tube, then hanging
      const w = (0.10 + 0.17 * Math.sin(Math.min(1, t * 3) * Math.PI * 0.5)) * Math.pow(1 - t, 0.65) + 0.012;   // widest a quarter of the way down
      const squeeze = 0.72 + 0.28 * Math.min(1, t * 2.5), lag = 0.35 + 1.8 * t, sway = 0.035 + 0.26 * t, ph = a * 1.9;
      const frill = (side) => 0.085 * (w / 0.27) * Math.sin(j * TAU / 6 + a * 1.3 + (side > 0 ? 1.4 : 0)) * (0.4 + 0.6 * Math.min(1, t * 6));      // a ruffle to every six pieces
      const row = [];
      for (const side of [-1, 0, 1]) {
        // the wings open about 70 degrees: outward along the radius and to either side
        const ox = cx * Math.abs(side) * w * 0.55 + tx * side * w * 0.82, oz = sz * Math.abs(side) * w * 0.55 + tz * side * w * 0.82, f = side ? frill(side) : 0;
        const px = r * cx + ox + cx * f, pz = r * sz + oz + sz * f, py = y + (side ? 0.03 * Math.sin(j * 1.7 + side) : 0);      // the frill gathers the edge in and out
        const rr = r * squeeze;
        row.push(B.v([px, py, pz], [rr * cx + ox * 0.9 + cx * f, py + 0.12 * (1 - t), rr * sz + oz * 0.9 + sz * f], [cx * 0.6 + tx * side, 0.15, sz * 0.6 + tz * side], [t, (a + 0.5) / 4, 2, lag], [sway, side, ph, 0]));
      }
      rows.push(row);
    }
    for (let j = 0; j < armSegs; j++) for (let s = 0; s < 2; s++) B.idx.push(rows[j][s], rows[j][s + 1], rows[j + 1][s], rows[j][s + 1], rows[j + 1][s + 1], rows[j + 1][s]);
  }
  // ---- tentacles: from the notches between the lobes, three to each eighth of the margin when there are 24 of them
  const perEighth = tentacles / 8;
  for (let k = 0; k < tentacles; k++) {
    // the notches of one eighth: lobes / 8 of them, the first kept for the sense organ
    const notches = lobes / 8, e = Math.floor(k / perEighth), i = k % perEighth, slot = notches > perEighth ? 1 + i : i + 0.5;
    const th = (e * notches + slot) / lobes * TAU, cx = Math.cos(th), sz = Math.sin(th), len = tentLength * (0.72 + 0.28 * (((k * 7919) % 13) / 12)), ph = k * 2.399;
    let prev = null;
    for (let j = 0; j <= tentSegs; j++) {
      const t = j / tentSegs, y = -len * t, r = 1.0 + 0.07 * Math.sin(Math.min(1, t * 12) * Math.PI * 0.5) - 0.10 * t;
      const rc = 0.74 + (r - 0.74) * Math.min(1, t * 3.5), yc = y + 0.03 * (1 - Math.min(1, t * 4));
      const lag = 0.24 + 2.9 * t, sway = 0.015 + 0.6 * Math.pow(t, 1.3), wd = 0.020 * (1 - 0.62 * t);
      const row = [-1, 1].map((side) => B.v([r * cx, y, r * sz], [rc * cx, yc, rc * sz], [cx, 0, sz], [t, th / TAU, 3, lag], [sway, side, ph, wd]));
      if (prev) B.idx.push(prev[0], prev[1], row[0], prev[1], row[1], row[0]);
      prev = row;
    }
  }
  return B.done();
}

const MEDUSA_VERT_PARS = /* glsl */`
  attribute vec3 aCon; attribute vec4 aBody, aFlex, aHome, aSeed, aLife;
  uniform vec4 uCycleM; uniform vec3 uMoveM; uniform float uJPx;
  varying vec4 vM; varying vec4 vM2; varying vec2 vMq;
  ${WATER_GLSL}
  // one pulse: contraction, glide, relaxation, a short pause. f is the share of the period gone (0..1).
  // A medusa has no muscle that holds its bell shut: the ring of muscle tightens, lets go, and the jelly's own spring
  // opens the bell again, at once and slowly. So there is no held clench: the bell closes quickly, gives back a
  // third of its closing while the animal still glides, and the rest as it relaxes: one unbroken easing from shut to
  // open over glide and relaxation together, with no corner in it. (The first build held it shut through the glide.)
  float medusaClose(float f) {
    float a = uCycleM.x, c = a + uCycleM.y + uCycleM.z;
    if (f < a) return smoothstep(0.0, 1.0, f / a);
    return 1.0 - smoothstep(0.0, 1.0, clamp((f - a) / max(c - a, 1e-4), 0.0, 1.0));
  }
  // how far the pulse has carried it up its own axis (0..1): up through contraction and glide, sinking back as it opens
  float medusaHop(float f) {
    float b = uCycleM.x + uCycleM.y;
    if (f < b) return smoothstep(0.0, 1.0, pow(f / b, 0.7));
    return 1.0 - smoothstep(0.0, 1.0, (f - b) / (1.0 - b));
  }
  // disturbed (the hull, a great swimmer): it closes at once, holds, and opens slowly
  float medusaWake(float a) { return smoothstep(0.0, 0.45, a) * (1.0 - smoothstep(1.6, 4.4, a)); }
`;
// in: position/aCon (unit bell), aBody (u, theta, part, lag), aFlex (sway, side, phase, half width), aHome (xyz, diameter),
// aSeed, aLife (period, woken at, tilt, wander)
const MEDUSA_VERT = /* glsl */`
  {
    float R = aHome.w * 0.5, sd = aSeed.x * 6.2831853, part = aBody.z, along = aBody.x;
    float tl = uTime - aBody.w * uMoveM.z;                                  // this point lives a little in the past: it follows late
    float f = fract(tl / aLife.x + aSeed.y);
    float aw = tl - aLife.y;
    float closed = max(medusaClose(f), medusaWake(aw));
    // ---- the animal's middle at that time: a slow wander, a slow lean, and the hop of each pulse along its own axis
    vec3 c0 = aHome.xyz + aLife.w * vec3(sin(tl * 0.11 + sd), 0.25 * sin(tl * 0.07 + sd * 2.1), cos(tl * 0.09 + sd * 1.7));
    vec2 lean = aLife.z * vec2(sin(tl * 0.071 + sd * 3.0), cos(tl * 0.063 + sd * 5.0));
    vec3 axis = normalize(vec3(lean.x, 1.0, lean.y));
    c0 += axis * (medusaHop(f) + 0.5 * medusaWake(aw)) * uMoveM.x * R;
    // ---- its own shape: between open and closed, then leaned over
    vec3 q = mix(position, aCon, closed) * R;
    q = q + vec3(lean.x, 0.0, lean.y) * q.y - vec3(0.0, dot(lean, q.xz), 0.0);       // a small rotation toward the lean
    vec3 w = c0 + q;
    // ---- arms and tentacles sway: slow waves that travel down them and grow toward the tip
    float sw = aFlex.x * R, ph = aFlex.z + sd;
    w.x += sw * (sin(uTime * 0.42 + ph - 2.6 * along) + 0.5 * sin(uTime * 0.90 + ph * 1.7 - 5.0 * along));
    w.z += sw * (cos(uTime * 0.37 + ph * 1.3 - 2.2 * along) + 0.5 * sin(uTime * 0.80 + ph * 0.6 - 4.4 * along));
    // ---- the swell: every point of the animal rides the orbit of the water at its own depth
    for (int i = 0; i < 3; i++) {
      vec4 sv = uSwell[i]; float kk = length(sv.xy);
      if (kk > 1e-5) { float phs = dot(sv.xy, w.xz) - sv.z, e = sv.w * exp(kk * min(w.y, 0.0)) * uMoveM.y; w.y += e * cos(phs); w.xz -= sv.xy / kk * e * sin(phs); }
    }
    vec3 nM = normalize(mix(objectNormal, vec3(objectNormal.x, objectNormal.y * 0.7, objectNormal.z), closed));
    if (part > 2.5) {                                                       // a tentacle: a hairline turned to face the eye, never thinner than a pixel and a half
      vec3 toEye = uCameraPos - w; float dist = max(length(toEye), 0.1);
      vec3 side = cross(vec3(0.0, 1.0, 0.0), toEye / dist); float sl = length(side);
      side = sl > 0.05 ? side / sl : vec3(cos(aBody.y * 6.2831853), 0.0, sin(aBody.y * 6.2831853));
      float halfW = max(aFlex.w * R, 0.75 * dist / max(uJPx, 1.0));
      w += side * aFlex.y * halfW; nM = toEye / dist;
      vM2.w = clamp(aFlex.w * R / halfW, 0.0, 1.0);                         // widened to stay visible: fainter by as much
    } else vM2.w = 1.0;
    transformed = w; objectNormal = nM;
    // ---- light: the glow of the pulse, the flare of a disturbed one, and for tentacles the light that runs down after each pulse
    float f0 = fract(uTime / aLife.x + aSeed.y), a0 = uTime - aLife.y;
    float pulse = smoothstep(0.0, uCycleM.x, f0) * (1.0 - smoothstep(uCycleM.x, uCycleM.x + uCycleM.y + 0.3 * uCycleM.z, f0));
    float flare = smoothstep(0.0, 0.4, a0) * (1.0 - smoothstep(1.2, 5.0, a0));
    float since = (f0 - uCycleM.x) * aLife.x; if (since < 0.0) since += aLife.x;     // seconds since this pulse's contraction ended
    float run = min(since, a0 > 0.45 ? a0 - 0.45 : 1e3) / uCycleM.w;                 // the light has run this share of the way down
    vM = vec4(along, aBody.y, part, max(pulse, flare));
    vM2.xyz = vec3(flare, run, aFlex.y);
    vMq = position.xz;                                                      // the place on the open bell, seen from above
  }`;
const MEDUSA_FRAG_PARS = /* glsl */`
  uniform vec3 uBodyM, uRimM, uHotM; uniform vec4 uGlowM; uniform float uCanalsM;
  varying vec4 vM; varying vec4 vM2; varying vec2 vMq;`;
const MEDUSA_LIGHT = /* glsl */`
  {
    float along = vM.x, part = vM.z, pulse = vM.w, flare = vM2.x, facing = clamp(abs(dot(N, V)), 0.0, 1.0);
    float level = mix(uGlowM.x, uGlowM.y, pulse) * (1.0 + (uGlowM.z - 1.0) * flare);
    vec3 lit;
    if (part < 1.5) {
      // the bell (and its lobes): a thin clear dome. Seen on its side its wall holds more light, so it is edged; its
      // middle is dim; the canals run from the stomach to the margin; at the pulse the margin turns to the cold colour
      float u = min(along, 1.0);
      float wall = 0.09 + 0.50 * pow(1.0 - facing, 1.6) + 0.30 * smoothstep(0.55, 1.0, u);
      float th = atan(vMq.y, vMq.x);                                                       // the way round, from the place itself (no seam, no twist at the crown)
      float canal = smoothstep(0.80, 0.97, cos(th * uCanalsM));                            // the canals: soft lines from the stomach to the margin
      wall += 0.26 * canal * smoothstep(0.22, 0.4, u) * (1.0 - smoothstep(0.9, 1.0, u));
      float lobes4 = 0.5 + 0.5 * cos(th * 4.0);                                            // the four-lobed stomach under the crown
      wall += 0.42 * (1.0 - smoothstep(0.14, 0.34, u)) * (0.45 + 0.55 * lobes4) * (0.6 + 0.4 * facing);
      float rim = smoothstep(0.62, 1.0, along) * pulse;
      lit = mix(uBodyM, uRimM, rim) * wall * level;
      lit += uHotM * 0.5 * flare * smoothstep(0.7, 1.05, along);
    } else if (part < 2.5) {
      // an oral arm: a folded curtain, brighter along its frilled edges, dimmer down its length; the light of each
      // pulse sinks slowly into it
      float edge = abs(vM2.z);
      float sink = exp(-pow((along - vM2.y * 0.7) / 0.30, 2.0)) * step(vM2.y, 1.6);
      lit = mix(uBodyM, uRimM, 0.2 * pulse + 0.35 * sink) * (0.16 + 0.26 * edge + 0.22 * (1.0 - facing)) * (1.0 - 0.6 * along) * (level + 0.5 * uGlowM.y * sink);
    } else {
      // a tentacle: a dim thread, and after each pulse a light that runs down it
      float band = exp(-pow((along - vM2.y) / 0.10, 2.0)) * (1.0 - 0.55 * along) * step(vM2.y, 1.15);
      lit = (uBodyM * 0.20 * (1.0 - 0.5 * along) + uRimM * 1.25 * band) * uGlowM.x * vM2.w * (1.0 + (uGlowM.z - 1.0) * flare * 0.5);
    }
    glow += lit;
  }`;

// `geo`: one geometry, or [{ geometry, take(y) }, ...]: several weights of one kind, each animal drawn with the first
// whose take(its depth) is true (the small bells: the full mesh for those that hang near the surface, a lighter one
// for the deep ones). The animals keep the order in which their places were given, whichever mesh draws them.
function medusaSystem(ctx, o, geo, name, canals, kind) {
  const engine = ctx.engine, rnd = ctx.rng(o.seed), density = o.exact ? 1 : (ctx.quality.density || 1);
  const src = flat(o.points || []), have = src.length / 3, n = Math.max(have ? 1 : 0, Math.round(have * density)), step = have / Math.max(1, n);
  const home = new Float32Array(n * 4), seed = new Float32Array(n * 4), life = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
    const k = Math.min(have - 1, Math.floor(i * step)) * 3, d = (o.sizes && o.sizes[Math.floor(i * step)]) || o.size[0] + (o.size[1] - o.size[0]) * rnd();
    // never within `clear` metres of the surface, even at the top of its hop
    home.set([src[k], Math.min(src[k + 1], -(o.clear + d * (kind === 'great' ? 0.55 : 0.75))), src[k + 2], d], i * 4);
    seed.set([rnd(), rnd(), rnd(), rnd()], i * 4);
    life.set([o.period[0] + (o.period[1] - o.period[0]) * rnd(), -1e9, o.lean * (0.5 + 0.5 * rnd()), o.wander * (0.6 + 0.4 * rnd())], i * 4);
  }
  const [fc, fg, fr] = o.cycle;
  const uniforms = {
    ...waterUniforms(engine), uJPx: { value: 800 },
    uCycleM: { value: new THREE.Vector4(fc, fg, fr, o.run) }, uMoveM: { value: new THREE.Vector3(o.hop * (ctx.reducedMotion ? 0.5 : 1), o.sway * (ctx.reducedMotion ? 0.5 : 1), 1) },      // reduced motion: half the hop, half the swell
    uBodyM: { value: col(o.body) }, uRimM: { value: col(o.rim) }, uHotM: { value: col(o.hot) }, uGlowM: { value: new THREE.Vector4(o.glow[0], o.glow[1], o.flare, 0) }, uCanalsM: { value: canals },
  };
  // A tentacle is a clear thread with light in it, not a dark wire: where one hangs in front of the lit arms or the
  // bell its light is laid over them (the first build drew every dim tentacle as a near-black line across whatever was
  // behind it). Bell, lobes and arms stay solid. Only the great ones have tentacles, so only they are drawn this way:
  // blended, but still writing their depth, and before the water, so that the water tints and swallows them by depth.
  const threads = kind === 'great';
  const material = ctx.kit.gouache({ color: '#0e0c1c', shade: 0, brush: 0.2, side: THREE.DoubleSide, extend: {
    uniforms, vertexPars: MEDUSA_VERT_PARS, vertexLocal: MEDUSA_VERT, fragmentPars: MEDUSA_FRAG_PARS, light: MEDUSA_LIGHT,
    final: threads ? 'if (vM.z > 2.5) gl_FragColor = vec4(max(glow, 0.0) * (1.0 - fog), 0.0);' : '' } });
  if (threads) { material.transparent = true; material.premultipliedAlpha = true; material.depthWrite = true; material.forceSinglePass = true; }
  // each weight of the mesh draws its own animals: their numbers are gathered out of the shared lists for it
  const parts = Array.isArray(geo) ? geo : [{ geometry: geo, take: () => true }];
  const group = new THREE.Group(); group.name = name;
  const part = new Int8Array(n), slot = new Int32Array(n), lives = [];
  parts.forEach((q, pi) => {
    const idx = [];
    for (let i = 0; i < n; i++) if (part[i] === pi) { if (pi === parts.length - 1 || q.take(home[i * 4 + 1])) idx.push(i); else part[i] = pi + 1; }
    if (!idx.length) { lives.push(null); return; }
    const m = idx.length, gHome = new Float32Array(m * 4), gSeed = new Float32Array(m * 4), gLife = new Float32Array(m * 4);
    idx.forEach((i, k) => { gHome.set(home.subarray(i * 4, i * 4 + 4), k * 4); gSeed.set(seed.subarray(i * 4, i * 4 + 4), k * 4); gLife.set(life.subarray(i * 4, i * 4 + 4), k * 4); slot[i] = k; });
    const aLife = new THREE.InstancedBufferAttribute(gLife, 4); aLife.setUsage(THREE.DynamicDrawUsage);
    const g = q.geometry;
    g.setAttribute('aHome', new THREE.InstancedBufferAttribute(gHome, 4)); g.setAttribute('aSeed', new THREE.InstancedBufferAttribute(gSeed, 4)); g.setAttribute('aLife', aLife);
    g.instanceCount = m;
    const mesh = new THREE.Mesh(g, material);
    mesh.name = name; mesh.frustumCulled = false; mesh.layers.set(1);   // under the water: never in the mirror
    if (threads) mesh.renderOrder = -2;                                  // (a see-through thing under the water is drawn before it)
    perPass(mesh, material);
    group.add(mesh); lives.push({ array: gLife, attr: aLife });
  });
  (o.parent || ctx.group).add(group);
  const sharedT = engine.shared.uTime, DIS = 8, inside = new Uint8Array(n);
  // animal i was woken at t: said to the shared list (which the script reads) and to the mesh that draws it
  const woke = (i, t) => { life[i * 4 + 1] = t; const L = lives[part[i]]; L.array[slot[i] * 4 + 1] = t; L.attr.needsUpdate = true; };
  const api = {
    object: group, count: n, onWake: null, disturb: o.disturb,
    /** Wake animal i now: it contracts at once and flares. */
    wake(i) { if (i >= 0 && i < n) woke(i, sharedT.value); return api; },
    /** Where animal i hangs (its place; it wanders `wander` metres about it and rides the swell). */
    positionOf(i, out = new THREE.Vector3()) { return out.set(home[i * 4], home[i * 4 + 1], home[i * 4 + 2]); },
  };
  // The hull and the great swimmers wake the bells they come near: one pass over the places, a few compares each.
  // A bell is woken when something COMES within its reach, once; while that thing stays beside it the bell goes back to
  // its own pulse (a rider who stops to look is not answered with a flinch every few seconds), and it can be woken
  // again when something comes near anew, `again` seconds or more after the last time.
  ctx.onUpdate(() => {
    const t = sharedT.value, boat = ctx.boat, near = o.near;
    for (let i = 0; i < n; i++) {
      const x = home[i * 4], y = home[i * 4 + 1], z = home[i * 4 + 2], reach = near + home[i * 4 + 3] * 0.5;
      let hit = Math.abs(x - boat.x) < reach + 3 && Math.abs(z - boat.z) < reach + 3 && hullDistance(boat, x, y, z) < reach;
      for (let k = 0; k < DIS && !hit; k++) { const d = o.disturb[k]; if (d && d.radius > 0 && d.position) { const dx = x - d.position.x, dy = y - d.position.y, dz = z - d.position.z; hit = dx * dx + dy * dy + dz * dz < (d.radius + reach) * (d.radius + reach); } }
      if (hit && !inside[i] && t - life[i * 4 + 1] >= o.again) { woke(i, t); if (api.onWake) api.onWake(x, y, z, i); }
      inside[i] = hit ? 1 : 0;
    }
  });
  return api;
}

/**
 * The sea's small bells: medusae. A dome that contracts, glides and relaxes, each on its own clock, with four short
 * arms that follow late. They hang where they are (they never rise), sway together on the swell, and one that the hull
 * or a great swimmer comes near contracts at once and flares.
 *
 *   const bells = makeMedusae(ctx, { points: scatter(ctx, { count: 2600, volumes: [{ s: [106, 196], d: [-30, 30], y: [-22, -1.6] }] }) });
 *
 * opts:
 *   points         [[x, y, z], ...] where they hang (y below the water)
 *   size           [0.25, 0.45] metres across the bell
 *   period         [3.2, 5.5] seconds a pulse (each its own); cycle: [0.15, 0.33, 0.47] the shares of contraction,
 *                  glide and relaxation in it (the rest is a pause)
 *   body, rim, hot   '#6f55e6' the violet of the bell, '#3fe0d0' the cold colour its margin takes at the pulse, '#d2fbf2'
 *   glow           [0.42, 0.9]: brightness at rest and at the pulse;  flare: 2.5 times brighter when disturbed
 *   near           5 metres: the hull or anything in `disturb` wakes a bell that it COMES within this of, once; while it
 *                  stays there the bell goes back to its own pulse;  again: 4.5 s before it can be woken again
 *   disturb        [{ position: Vector3 (yours to move), radius }] dolphins, the whale (up to eight)
 *   hop            how far a pulse lifts it, in bell radii (0.4);  sway: how much of the swell's orbit it rides (1)
 *   lean, wander   radians it leans (0.18) and metres it wanders about its place (0.3)
 *   clear          1.2 metres: the nearest any part of it comes to the surface
 *   sides          16 (96 triangles a bell, its margin in eight lobes) or 12 (76 triangles, a plain margin: what low
 *                  quality uses): the mesh of the bells that hang within `nearDepth` of the surface
 *   nearDepth      5 metres: bells that hang deeper are never within six metres of the eye, and are drawn with a
 *                  lighter mesh of 58 triangles (ten sides, arms of one piece). Two draw calls for the kind
 *   exact, seed, parent
 * Returns { object (a group: one mesh for each weight), count, wake(i), positionOf(i, out), onWake: set to
 *   (x, y, z, i) => {} to hear one wake, disturb }. Animal i is the i-th place given (thinned by quality), whichever mesh draws it.
 */
export function makeMedusae(ctx, opts = {}) {
  const o = { points: [], size: [0.25, 0.45], period: [3.2, 5.5], cycle: [0.15, 0.33, 0.47], body: '#6f55e6', rim: '#3fe0d0', hot: '#d2fbf2', glow: [0.42, 0.9], flare: 2.5,
    near: 5, again: 4.5, disturb: [], hop: 0.4, sway: 1, lean: 0.18, wander: 0.3, clear: 1.2, run: 1.5, sides: 16, nearDepth: 5, exact: false, seed: 51, parent: null, ...opts };
  // those that hang within `nearDepth` metres of the surface are seen at arm's length and get the full mesh; the deep
  // ones (most of them) the light one
  const fine = ctx.quality.level === 'low' || o.sides === 12 ? 'plain' : 'full';
  return medusaSystem(ctx, o, [{ geometry: smallMedusaGeometry(fine), take: (y) => y > -o.nearDepth }, { geometry: smallMedusaGeometry('far'), take: () => true }], 'medusae', 8, 'small');
}

/**
 * The sea's great medusae: bells a metre and a half to two metres across with lobed margins, a mass of frilled arms
 * and long fine tentacles. Contraction 0.9 s, glide 2 s, relaxation 3 s; arms and tentacles follow late; after each
 * pulse light runs down the tentacles over three seconds.
 *
 *   const great = makeGreatMedusae(ctx, { points: nine.map(([s, d, depth]) => kit.at(s, d, -depth)), sizes: [1.6, 2.0, 1.5, ...] });
 *
 * opts: as makeMedusae, and
 *   size           [1.4, 2.0] metres across the bell (or `sizes`: one for each place)
 *   period         [6, 7];  cycle: [0.14, 0.31, 0.47]
 *   lobes, tentacles   32 and 24 (the true pattern of a sea nettle); 16 and 8 is the other (the mauve stinger)
 *   armLength      2.8 bell radii (2 to 3 m);  tentLength: 8.6 bell radii (6 to 9 m)
 *   run            3 seconds for the light to run down a tentacle
 *   wander         1.5 metres
 */
export function makeGreatMedusae(ctx, opts = {}) {
  const o = { points: [], size: [1.4, 2.0], sizes: null, period: [6, 7], cycle: [0.14, 0.31, 0.47], body: '#6f55e6', rim: '#3fe0d0', hot: '#d2fbf2', glow: [0.42, 0.9], flare: 2.5,
    near: 5, again: 6, disturb: [], hop: 0.3, sway: 1, lean: 0.14, wander: 1.5, clear: 1.2, run: 3, lobes: 32, tentacles: 24, armLength: 2.8, tentLength: 8.6, exact: true, seed: 52, parent: null, ...opts };
  return medusaSystem(ctx, o, greatMedusaGeometry(o), 'great-medusae', 16, 'great');
}
