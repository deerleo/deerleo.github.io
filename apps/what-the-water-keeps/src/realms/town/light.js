// The town below: the area's light. Everything here burns under the water, so the area's light is one field: a map,
// seen from above, of every window, lamp and glass roof (the glow map), and one function that says how awake a light
// is (waking ahead of the boat, sleeping behind it). The same map and the same function light:
//   - the windows themselves and their halos in the water,
//   - the streets and walls under the water (their own light),
//   - the underlight on everything that stands above the water (warm along its lower edge, plum above),
//   - the far water (the glow sheet), the mist and the cloud (set.js).
// So a roof's warm edge fails when the street under it goes to sleep, and the lake dims where the town does.
//
// And it is the area's water as far as built things are concerned (stage 2d): everything that wears this material
//   - changes plainly at the surface: plum night and the town's warm light above it; below it the water's own light,
//     green-teal in the top metres and violet in the deep, and a drying-wet step at the line itself;
//   - carries a thin line of light exactly where the water meets it (never thinner than the screen can draw);
//   - is netted with slow moving light where it faces up within a few metres of the surface (livelier under the wake);
//   - takes water-light on its first six metres above the surface, where a town burns beneath it, brighter where the
//     water is disturbed (the rider's wake and the pendulum's rings crawl up the stone);
//   - dissolves, under the surface, into the water's own colour with the distance sight travels through water.
// None of this is asked for: light.mat() and light.extend give it to everything.
//
//   const light = ensureLight(ctx, plan, shared);        // any module may call it; it is made once
//   light.mat({ color, lit, water, ...gouache options })  THE material for everything built in this area, above the water or
//                                                         below it: gouache, with the town's light in place of the key light.
//                                                         lit: how much of the street's light it takes under water (roofs 0.3)
//                                                         water: accepted and no longer needed (the water-light is built in)
//   light.extend                                          the same as a gouache `extend`, for kit.model(url, { extend: light.extend })
//   light.extendFor(lit)                                  the same with another share of the street's light
//   light.windows(list, opts)                             the instanced windows (lit only below the waterline: the rule of the
//                                                         place), with their halos in the water. opts.halo: false for none
//   light.halos(list, opts)                               halos alone, for lights that are not windows: [{ x, y, z, size, color, s, rnd, stay }]
//   light.emissive(color, gain, opts)                     a plain thing that gives off light and wakes and sleeps with the town
//   light.U                                               the shared uniforms (uTownWake: farthest s reached, time, how awake the
//                                                         square is, gain; uTownFlare: the stroke's ring; the state colours)
//   light.GLSL                                            townGlow(xz), townS(g), townWake(s, xz, rnd, stay), townThrough(worldPos, eye, perMetre) for your own shaders
//   light.level(s, x, z, rnd, stay)                       the same function on the CPU (for sound, cues, things that follow the light)
//   light.at(x, z)                                        the light of the town beneath a place, now
//   light.setReach(s), light.state, light.tone            set.js drives these
import * as THREE from 'three';
import { layout } from './layout.js';
import { standIn } from '../../engine/modules.js';

/** GLSL: the glow map and the waking function. Needs the uniforms in light.U. */
export const TOWN_GLSL = /* glsl */`
  uniform sampler2D tTownGlow; uniform vec4 uTownRect, uTownWake, uTownTower, uTownFlare;
  // the glow map at a place: r = light, g = share of jade, b = distance along the route (see townS), a = share that stays on
  vec4 townGlow(vec2 xz) { vec2 uv = (xz - uTownRect.xy) * uTownRect.zw + 0.5, e = min(uv, 1.0 - uv); return texture2D(tTownGlow, clamp(uv, 0.0, 1.0)) * step(0.0, min(e.x, e.y)); }
  vec4 townGlowSoft(vec2 xz, float lod) { vec2 uv = (xz - uTownRect.xy) * uTownRect.zw + 0.5, e = min(uv, 1.0 - uv); return textureLod(tTownGlow, clamp(uv, 0.0, 1.0), lod) * smoothstep(0.0, 0.06, min(e.x, e.y)); }
  float townS(vec4 g) { return g.b * 400.0 - 100.0; }
  // How awake a light is. s: its distance along the route; xz: its place; rnd: its own random number 0..1 (below 0: the
  // average of many lights); stay: 1 if it is one of the few that stay on when the street sleeps.
  //   ahead of the boat the town drowses at 60 per cent and comes up to full 70 to 40 m ahead;
  //   30 to 60 m behind it goes out, one light in five staying on; the square holds until the boat is at the poplar road,
  //   then sleeps in rings closing on the tower; over everything a slow breath runs down the valley.
  float townWake(float s, vec2 xz, float rnd, float stay) {
    float ahead = s - uTownWake.x, up, on;
    if (rnd < 0.0) { up = 1.0 - smoothstep(40.0, 70.0, ahead); on = 1.0 - smoothstep(30.0, 60.0, -ahead); }
    else { float a = 40.0 + 30.0 * rnd, b = 30.0 + 30.0 * fract(rnd * 7.31 + 0.17); up = 1.0 - smoothstep(a - 2.5, a + 2.5, ahead); on = 1.0 - smoothstep(b - 2.5, b + 2.5, -ahead); }
    float sq = smoothstep(144.0, 152.0, s) * (1.0 - smoothstep(208.0, 216.0, s));
    float r = distance(xz, uTownTower.xy), k = 1.0 - uTownWake.z;
    float sqOn = 1.0 - smoothstep(0.0, 0.12, k * 1.12 - (1.0 - clamp(r / 75.0, 0.0, 1.0)));
    on = mix(on, sqOn, sq);
    float lvl = mix(0.6, 1.0, up) * mix(stay * 0.85, 1.0, on);
    lvl *= 1.0 + 0.12 * sin(6.2832 * (s / 90.0 - uTownWake.y / 14.0));
    lvl *= 1.0 + uTownFlare.y * (1.0 - smoothstep(uTownFlare.x - uTownFlare.z, uTownFlare.x, r));     // inside the stroke's ring of waking light
    return lvl * uTownWake.w;
  }
  // How much of a thing under the surface comes through the water between it and the eye (1 near .. 0 far away): for your
  // own translucent or additive things under water, so that they dissolve as everything built here does. perMetre is
  // light.U.uTownWater.value.w (pass the uniform uTownWater and give its w).
  float townThrough(vec3 worldPos, vec3 eye, float perMetre) { float D = max(-worldPos.y, 0.0); return exp(-perMetre * distance(worldPos, eye) * D / (max(eye.y, 0.05) + D)); }
`;

// (The light of the four states, TONE below, and what the windows burn with, WINDOW, are the plan's: plan.tone and
// plan.windowLight, in plan.js under "light". docs/build/town/2-light.md says how they were found.)
const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

/**
 * The nets of light (sixth holder of stage 2d): a tile of TRUE caustics, made once in code. A sheet of rays is sent
 * down through a rippled surface (fourteen waves whose lengths divide the tile, so it repeats without a seam), each ray
 * bent by the slope it passes through and gathered where it lands a little way down: where the rays crowd, the light is
 * a thread; where they part, there is none. That is the web moving water throws on a roof a metre under it: closed
 * meshes of fine bright threads with a spark where three meet. (The ride's shared caustic tile is a smoke of soft
 * wisps: cut to threads it gave torn pale blots, and nobody could see a net on any roof.) R: the light, 0..1, with a
 * soft shoulder. `focus`: how near the surface's lens is to focusing at that depth (0.8: threads, no folds yet).
 */
function netTile(seed = 907, focus = 0.8, n = 256) {
  let a = seed >>> 0; const rnd = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const ss = 3, N = n * ss, K = 6, nw = 14, wk = new Int8Array(nw * 2), wa = new Float32Array(nw * 3); let curv = 0, m = 0;
  while (m < nw) { const kx = Math.floor(rnd() * (2 * K + 1)) - K, ky = Math.floor(rnd() * (2 * K + 1)) - K, k = Math.hypot(kx, ky); if (k < 2 || k > K) continue;
    const amp = 1 / Math.pow(k, 1.6), ph = rnd() * 6.2832; wk[m * 2] = kx; wk[m * 2 + 1] = ky; wa[m * 3] = amp; wa[m * 3 + 1] = Math.cos(ph); wa[m * 3 + 2] = Math.sin(ph); curv += (amp * k * k) ** 2; m++; }
  const s = focus / (Math.sqrt(curv / 2) * 6.2832);
  const S = new Float32Array((2 * K + 1) * N), C = new Float32Array((2 * K + 1) * N);
  for (let k = -K; k <= K; k++) for (let i = 0; i < N; i++) { const t = 6.283185307 * k * i / N; S[(k + K) * N + i] = Math.sin(t); C[(k + K) * N + i] = Math.cos(t); }
  const acc = new Float32Array(n * n), gx = new Float32Array(N), gy = new Float32Array(N);
  for (let j = 0; j < N; j++) {
    gx.fill(0); gy.fill(0);
    for (let w = 0; w < nw; w++) {                       // sin(X + Y + ph) = sin X (cos Y cos ph - sin Y sin ph) + cos X (sin Y cos ph + cos Y sin ph)
      const kx = wk[w * 2], ky = wk[w * 2 + 1], sy = S[(ky + K) * N + j], cy = C[(ky + K) * N + j], cp = wa[w * 3 + 1], sp = wa[w * 3 + 2];
      const p = cy * cp - sy * sp, q = sy * cp + cy * sp, ax = wa[w * 3] * kx, ay = wa[w * 3] * ky, so = (kx + K) * N;
      for (let i = 0; i < N; i++) { const sn = S[so + i] * p + C[so + i] * q; gx[i] -= ax * sn; gy[i] -= ay * sn; }
    }
    for (let i = 0; i < N; i++) {
      const u = (i / N + gx[i] * s) * n - 0.5, v = (j / N + gy[i] * s) * n - 0.5, x0 = Math.floor(u), y0 = Math.floor(v), tx = u - x0, ty = v - y0;
      const xa = ((x0 % n) + n) % n, xb = (xa + 1) % n, ya = ((y0 % n) + n) % n, yb = (ya + 1) % n;
      acc[ya * n + xa] += (1 - tx) * (1 - ty); acc[ya * n + xb] += tx * (1 - ty); acc[yb * n + xa] += (1 - tx) * ty; acc[yb * n + xb] += tx * ty;
    }
  }
  const data = new Uint8Array(n * n), inv = 1 / (ss * ss);
  for (let o = 0; o < n * n; o++) data[o] = Math.round(255 * Math.pow(Math.min(1, Math.max(0, (acc[o] * inv - 0.55) / 3)), 0.8));
  const tex = new THREE.DataTexture(data, n, n, THREE.RedFormat);
  tex.colorSpace = THREE.NoColorSpace; tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.generateMipmaps = true; tex.anisotropy = 4; tex.needsUpdate = true;
  return tex;
}

const QL = new URLSearchParams(typeof location !== 'undefined' ? location.search : '');
const Q_HALO = (QL.get('halo') || '').split(',').map(Number).concat([NaN, NaN]).slice(0, 2).map((v, i) => (Number.isFinite(v) && v > 0 ? v : [2.8, 0.8][i]));      // &halo=<gain>,<scale>: try other strengths and sizes for every halo
export function ensureLight(ctx, plan, shared) {
  if (shared.light) return shared.light;
  const { kit } = ctx, town = layout(ctx, plan), G = plan.glow, sh = ctx.engine.shared, TONE = plan.tone, WINDOW = plan.windowLight;
  const col = (c) => new THREE.Color(c);

  // ---------------------------------------------------------------------------------------------- the glow map
  // Every light is laid into it as a soft spot (windows about 3 m, lamps wider). Channels: R the light, G the share of
  // it that is jade, B the distance along the route of that place, A the share of it that stays on when the street sleeps.
  const N = G.pixels, size = G.size, m = size / N, x0 = G.centre[0] - size / 2, z0 = G.centre[1] - size / 2;
  const L = new Float32Array(N * N), J = new Float32Array(N * N), K = new Float32Array(N * N), Hy = new Float32Array(N * N);
  const splat = (x, z, r, power, jade, stay, y = -6) => {
    const ci = (x - x0) / m, cj = (z - z0) / m, rp = r / m, i0 = Math.max(0, Math.floor(ci - rp * 2)), i1 = Math.min(N - 1, Math.ceil(ci + rp * 2)), j0 = Math.max(0, Math.floor(cj - rp * 2)), j1 = Math.min(N - 1, Math.ceil(cj + rp * 2));
    const inv = 1 / (rp * rp);
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const dx = i + 0.5 - ci, dz = j + 0.5 - cj, w = Math.exp(-(dx * dx + dz * dz) * inv) * power; if (w < 0.002) continue; const o = j * N + i; L[o] += w; J[o] += w * jade; K[o] += w * stay; Hy[o] += w * y; }
  };
  const tones = plan.windowTones;
  for (const w of town.windows) splat(w.x, w.z, 3.0, 0.16 * (0.6 + 0.4 * Math.min(1, w.w * w.h)), tones[w.tone].jade, w.stay, Math.min(w.y, -0.3));
  for (const l of town.lamps) if (l.kind !== 'stepsDark') splat(l.x, l.z, l.kind === 'row' ? 3.2 : 4.2, l.kind === 'row' ? 0.9 : 0.55, 0, l.kind === 'row' ? 0.6 : 0.25, l.y);
  // (a pool is light that is in the map only: it burns at lamp height over its ground; the hall's is its glass roof, the nave's its lancets)
  { const H = plan.hall, CH = plan.church;
    for (const p of town.pools) { const q = town.sd(p.x, p.z); let y = Math.min(-0.5, town.ground(q.s, q.d) + 3.6);
      if (q.s > H.s0 - 1 && q.s < H.s1 + 1 && Math.abs(q.d - H.d) < 9) y = Math.abs(q.d - H.d) < 2 ? -0.6 : -7;
      else if (q.s > CH.s0 && q.s < CH.s1 && Math.abs(q.d - CH.d) < 6) y = -2;
      splat(p.x, p.z, p.r, p.power * 0.5, p.jade, 0.2, y); } }
  const data = new Uint8Array(N * N * 4);
  // the distance along the route, from a coarse grid of the path's own answer (it is smooth; lights take the s of their place)
  const C = 64, sg = new Float32Array((C + 1) * (C + 1));
  for (let j = 0; j <= C; j++) for (let i = 0; i <= C; i++) sg[j * (C + 1) + i] = town.sd(x0 + i / C * size, z0 + j / C * size).s;
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const o = j * N + i, l = L[o];
    const fi = (i + 0.5) / N * C, fj = (j + 0.5) / N * C, a = Math.min(C - 1, Math.floor(fi)), b = Math.min(C - 1, Math.floor(fj)), u = fi - a, v = fj - b, q = b * (C + 1) + a;
    const s = (sg[q] * (1 - u) + sg[q + 1] * u) * (1 - v) + (sg[q + C + 1] * (1 - u) + sg[q + C + 2] * u) * v;
    data[o * 4] = Math.min(255, Math.round(255 * (1 - Math.exp(-l * 1.6))));               // a soft shoulder: a crowded square does not clip
    data[o * 4 + 1] = l > 1e-4 ? Math.round(255 * Math.min(1, J[o] / l)) : 0;
    data[o * 4 + 2] = Math.round(255 * Math.min(1, Math.max(0, (s - G.sMin) / (G.sMax - G.sMin))));
    data[o * 4 + 3] = l > 1e-4 ? Math.round(255 * Math.min(1, K[o] / l)) : 51;
  }
  // the height of the lights at each place (their mean, y -26 .. 0 in a byte), at a quarter of the map's fineness: under
  // the water a lamp's light dies upward, so that a thing is warm at the height of its windows and the water's colour above
  const NH = N / 4, hdata = new Uint8Array(NH * NH);
  for (let j = 0; j < NH; j++) for (let i = 0; i < NH; i++) {
    let sw = 0, sy = 0;
    for (let b = 0; b < 4; b++) for (let a = 0; a < 4; a++) { const o = (j * 4 + b) * N + i * 4 + a; sw += L[o]; sy += Hy[o]; }
    hdata[j * NH + i] = sw > 1e-4 ? Math.round(255 * Math.min(1, Math.max(0, (sy / sw + 26) / 26))) : 196;
  }
  // ... and, in the same texture, THE ROOFLINE (fifth holder of stage 2d): for every place, the mean height of the roofs
  // that stand within about seven metres of it (G) and how much of that neighbourhood is under a roof (B). Under the
  // water the little light there is comes down from the surface: a street between two rows of houses, the foot of a
  // wall, a yard behind a terrace lie in the shade of the roofs round them, and are dark (and a step toward violet),
  // while the roofs themselves, and an open square, take what light the water lets down. Without it every unlit thing
  // under the water stood in one even light, roofs, walls and paving alike: a mist, not a town. (The lamps' and
  // windows' own light is not shaded by it: that is what the streets are lit by.)
  const roofH = new Float32Array(NH * NH), roofW = new Float32Array(NH * NH), mh = size / NH;
  { const put = (cx, cz, yaw, halfW, halfD, eaves, ridge) => {
      const c = Math.cos(yaw), sn = Math.sin(yaw), r = Math.hypot(halfW, halfD) + mh;
      const i0 = Math.max(0, Math.floor((cx - r - x0) / mh)), i1 = Math.min(NH - 1, Math.ceil((cx + r - x0) / mh)), j0 = Math.max(0, Math.floor((cz - r - z0) / mh)), j1 = Math.min(NH - 1, Math.ceil((cz + r - z0) / mh));
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
        const dx = x0 + (i + 0.5) * mh - cx, dz = z0 + (j + 0.5) * mh - cz, lx = dx * c - dz * sn, lz = dx * sn + dz * c;      // into the house's own axes (X along its ridge)
        if (Math.abs(lx) > halfW + mh * 0.5 || Math.abs(lz) > halfD + mh * 0.5) continue;
        const y = eaves + (ridge - eaves) * Math.max(0, 1 - Math.abs(lz) / Math.max(halfD, 0.1)), o = j * NH + i;
        if (roofW[o] === 0 || y > roofH[o]) roofH[o] = y; roofW[o] = 1;
      } };
    for (const h of town.houses) if (h.eaves < 1) put(h.x, h.z, h.yaw, h.w / 2, h.dep / 2, Math.min(h.eaves, 0), Math.min(h.ridge, 0));
    const CH = plan.church; for (let cs = CH.s0 + 2; cs < CH.s1; cs += 4) { const q = town.xz(cs, CH.d); put(q[0], q[1], town.along(cs), 2.4, CH.width / 2, -6, 0); }      // the nave
    // (sixth holder: and the theatre's portico and foyer, a roof far ABOVE the water: the stylobate and the foyer's floor, a
    // metre down under it, were lit as open lake is, a luminous slab in a dark hall. Height 4 is the map's ceiling and
    // means "a roof overhead": whatever lies under it is in full shade and takes no nets.)
    { const TP = plan.theatre; for (let cs = TP.portico.s + 1.5; cs < TP.foyer.s1 + 6; cs += 4) { const q = town.xz(cs, 0); put(q[0], q[1], town.along(cs), 2.4, cs < TP.wall.s ? 18 : TP.foyer.width / 2 + 1, 4, 4); } }
    // blurred twice by a box of nine cells (about seven metres either way): height weighted by where there is a roof
    const blur = (src) => { const tmp = new Float32Array(NH * NH), out = new Float32Array(NH * NH), R = 4;
      for (let j = 0; j < NH; j++) { let acc = 0; for (let i = -R; i <= R; i++) acc += src[j * NH + Math.min(NH - 1, Math.max(0, i))];
        for (let i = 0; i < NH; i++) { tmp[j * NH + i] = acc / (2 * R + 1); acc += src[j * NH + Math.min(NH - 1, i + R + 1)] - src[j * NH + Math.max(0, i - R)]; } }
      for (let i = 0; i < NH; i++) { let acc = 0; for (let j = -R; j <= R; j++) acc += tmp[Math.min(NH - 1, Math.max(0, j)) * NH + i];
        for (let j = 0; j < NH; j++) { out[j * NH + i] = acc / (2 * R + 1); acc += tmp[Math.min(NH - 1, j + R + 1) * NH + i] - tmp[Math.max(0, j - R) * NH + i]; } }
      return out; };
    const hw = new Float32Array(NH * NH); for (let o = 0; o < NH * NH; o++) hw[o] = roofH[o] * roofW[o];
    const bw = blur(blur(roofW)), bh = blur(blur(hw));
    for (let o = 0; o < NH * NH; o++) { roofW[o] = bw[o]; roofH[o] = bw[o] > 1e-3 ? bh[o] / bw[o] : -26; } }
  // ... and THE LAMPS' POOLS (A): the light each street lamp lays on the ground at its foot, as a point of light a lamp's
  // height above flat ground lays it (full under the lamp, a third at the lamp's own height away, a tenth at twice
  // that). The area's material lights whatever lies under a lamp with it: the paving shows its joints in it, a kerb its
  // edge, as lit stone does. (Until the fifth holder a lamp's pool was a soft disc of light added over the ground: sixty
  // of them made a pink fog of every street seen from above.)
  const poolL = new Float32Array(NH * NH);
  for (const l of town.lamps) { if (l.kind === 'stepsDark') continue;
    const hgt = Math.max(2.5, l.y - (l.plinth ?? l.foot)), k = (l.kind === 'row' ? 1.0 : 0.85) * Math.min(1, (4.4 / hgt) * (4.4 / hgt)), R = Math.min(14, hgt * 2.6);      // (a lamp twice as high lays a pool twice as wide and a quarter as bright)
    const i0 = Math.max(0, Math.floor((l.x - R - x0) / mh)), i1 = Math.min(NH - 1, Math.ceil((l.x + R - x0) / mh)), j0 = Math.max(0, Math.floor((l.z - R - z0) / mh)), j1 = Math.min(NH - 1, Math.ceil((l.z + R - z0) / mh));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const dx = x0 + (i + 0.5) * mh - l.x, dz = z0 + (j + 0.5) * mh - l.z, q = (dx * dx + dz * dz) / (hgt * hgt);
      poolL[j * NH + i] += k * Math.pow(1 + q, -1.5) * Math.max(0, 1 - Math.sqrt(dx * dx + dz * dz) / R); } }
  const hdata4 = new Uint8Array(NH * NH * 4);
  for (let o = 0; o < NH * NH; o++) { hdata4[o * 4] = hdata[o]; hdata4[o * 4 + 1] = Math.round(255 * Math.min(1, Math.max(0, (roofH[o] + 26) / 30))); hdata4[o * 4 + 2] = Math.round(255 * Math.min(1, roofW[o])); hdata4[o * 4 + 3] = Math.round(255 * (1 - Math.exp(-poolL[o] * 1.4))); }
  const htex = new THREE.DataTexture(hdata4, NH, NH, THREE.RGBAFormat);
  htex.colorSpace = THREE.NoColorSpace; htex.wrapS = htex.wrapT = THREE.ClampToEdgeWrapping; htex.magFilter = htex.minFilter = THREE.LinearFilter; htex.generateMipmaps = false; htex.needsUpdate = true;
  const tex = new THREE.DataTexture(data, N, N, THREE.RGBAFormat);
  tex.colorSpace = THREE.NoColorSpace; tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping; tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.generateMipmaps = true; tex.needsUpdate = true;

  // ---------------------------------------------------------------------------------------------- shared uniforms
  const tw = town.xz(plan.tower.s, plan.tower.d), T0 = TONE.arrival;
  const U = {
    tTownGlow: { value: tex }, tTownHeight: { value: htex }, tTownNetT: { value: netTile(907, 0.8) }, uTownRect: { value: new THREE.Vector4(G.centre[0], G.centre[1], 1 / size, 1 / size) },
    uTownWake: { value: new THREE.Vector4(0, 0, 1, 1) },                      // farthest s reached, time, how awake the square is (1..0), gain
    uTownTower: { value: new THREE.Vector4(tw[0], tw[1], 0, 0) },
    uTownFlare: { value: new THREE.Vector4(0, 0, 19, 0) },                    // radius of the stroke's ring of waking light, how much brighter inside it, width of its front
    // the light state of the moment (set.js mixes these from TONE)
    uTownNight: { value: col(T0.night) }, uTownCloud: { value: col(T0.cloud) },                             // above the water: what things sink to; what the lit cloud gives back
    uTownUnderCol: { value: col(T0.under.color) }, uTownUnder: { value: new THREE.Vector4(T0.under.gain, T0.under.floor, 0, 0) },   // the light from below: colour; x strength, y how much of it there is where nothing burns beneath
    uTownJade: { value: col('#7ADCC6') },
    uTownShallow: { value: col(T0.shallow) }, uTownDeep: { value: col(T0.deep) }, uTownTop: { value: col(T0.top) }, uTownStreet: { value: col(T0.street) },   // under the water
    uTownWaterA: { value: col(T0.waterA) }, uTownWaterB: { value: col(T0.waterB) }, uTownWaterLit: { value: col(T0.waterLit) },   // the water between: its own colour in the shallows and in the deep, and what it adds where the town burns under it
    uTownWater: { value: new THREE.Vector4(1, 2, 18, T0.waterFog) },        // x how much of the water between there is (a developer's switch), y z the depths over which shallow turns to deep, w how fast it swallows what is seen through it, per metre
    uTownLine: { value: col(T0.line) }, uTownNet: { value: col('#9fd0c8').multiplyScalar(T0.nets * 1.5) }, uTownWaterLight: { value: col(T0.waterLight) },
    uTownSurf: { value: new THREE.Vector4(0.27, 0.22, 6, 0.25) },      // (w: the area's own line of light where the water meets a thing. Sixth holder: 0.7 -> 0.25: the water draws the line itself now, plan.js WATER.waterline; this is the warm breath under it where the town burns)
    uTownSide: { value: new THREE.Vector4(0.6, 0.07, 1.3, 0.25) },      // (sixth holder: z 2.1 -> 1.3: the key painting's stack is orange in its lowest three courses and mauve above)                    // above the water: x the light that reaches across from what burns in front of a wall; y the cool edge on forms against the sky; z the height in metres over which the light from below falls to a third; w how much of it a face that looks up takes
    uTownSurf3: { value: new THREE.Vector4(0.6, 0, 0, 0) },                           // x: how much less the water swallows under the market hall's glass, where it is lit through (sixth holder)
    uTownSide2: { value: new THREE.Vector4(0.15, 2.6, 0, 0) },                        // the light that reaches across (sixth holder): x y the heights above the line from and to which it fails (it is a pool at the foot of a thing, not a wash up its face)
    uTownSurf2: { value: new THREE.Vector4(0.75, 0.08, 0.7, 1.1) },                  // x: how far a warm thing goes to violet under water (the other note of the roofs); y: how fast the lit water's glow gathers along a sight line, per metre of water; z: how far a PALE thing loses the water's hue (pale cloth and stone go sea-grey, never mint); w: the strength of the water-light's weave on what stands above the water (sixth holder)
    // (third holder: the water's hue was (0.40, 1.19, 1.16) and the water's own light a second teal on top of it: every unlit
    // thing came out at saturation 0.6, hue 186, one mint; the key painting's water is hue 195 at saturation 0.4. Bluer and
    // quieter here, and the light's colours in plan.js likewise: saturation is kept for the windows.)
    uTownHue: { value: new THREE.Vector4(0.56, 1.15, 1.11, 0.9) },      // (fourth holder: a step greener than the third holder's 0.62, 1.09, 1.18, under the plum mirror; and a pale thing loses more of the hue, 0.5 -> 0.7 in uTownSurf2.z)               // the water's hue (of luminance 1) that things take under it in the top metres, and how far they take it where no lamp shows them their own
    uTownHueDeep: { value: new THREE.Vector4(0.70, 0.98, 1.34, 0.0) },            // the same in the deep: bluer; w: how much of its own colour a thing keeps in good lamplight (0 = all of it)
    uTownPool: { value: new THREE.Vector4(3.4, 0.34, 0.9, 0.012) },                   // lamplight under water as pools: x its strength; y z the light of a place from and to which it tells (below y: none, so a pool has an edge and the street between two lamps is dark); w: how fast the water swallows with depth itself, per metre (third holder: 0.035 -> 0.012: the square 22 m down is to be SEEN, dark where it is dark and lit where it is lit, not laid under a haze)
    uTownVeil: { value: new THREE.Vector4(0.56, 0.54, 0.66, 0) },                     // the veil between areas, as the engine has it this frame: its colour, and how thick it is (0..1). Under the water the veil is in the water too (see waterFinal)
    uTownNetK: { value: new THREE.Vector4(1.0, 0.10, 0.25, 1.6) },                     // the nets (sixth holder: the true web): x how fine the web is (1 = half a metre to a mesh); y how fast its meshes widen with depth, per metre; z the share a wall takes of what a roof takes; w how much brighter the wake makes them
    uTownMon: { value: new THREE.Vector4(7.0, 1.5, 5.5, 8.0) },                       // the monument's share of the light from below (see the `light` hook)
    uTownMon3: { value: new THREE.Vector4(0.5, 1.4, 0, 0) },                          // the monument's pool (sixth holder): x the share of the light from below that dies at its foot, y over how many metres (the rest falls over uTownMon.x)
    uTownMon2: { value: new THREE.Vector4(0.02, 0.07, 0.03, 0.10) },                  // how much of the light from below is left far up: x on the monument, y on everything else (fourth holder: it was 0.12 on both, and with the monument's share on top the tower was pale pink to its roof: above the water it is night); z w: the same for the light that reaches across, on the monument and on everything else
    uTownWall: { value: new THREE.Vector4(0.5, 0.75, 1.3, 0) },      // (sixth holder: 0.36, 0.62, 1.7 -> 0.5, 0.75, 1.3: a wall away from its windows sinks into the water's own teal, as the key painting's walls do; the kit's spill and the halos warm it round each window)                      // a WALL in a lit street takes its windows' light sooner than paving and roofs do: x y what its pool's two thresholds are multiplied by; z how much stronger it is (the key painting's walls round lit windows are coral; with one threshold for everything they stayed the water's colour)
    uTownMirror: { value: new THREE.Vector4(plan.water.fresnel ?? 4.2, plan.water.reflectivity ?? 0.92, plan.water.reflectFloor ?? 0.02, 3.0) },      // the water's own mirror curve (exponent, cap, floor: set.js keeps them the look's), and w: the most a light is given back of what the mirror takes
    uTownMirror2: { value: new THREE.Vector4(2.6, 2.4, 0, 0) },                       // THINGS in the mirror (sixth holder): x the exponent of the curve by which things that stand above the water are mirrored (lower than the water's own: the tower, a stack, a gable lie on the water nearer the boat than the empty sky does); y the most a thing is strengthened in the mirror's picture for it; w: 1 while the mirror's picture is being drawn (set.js)
    uTownBurn2: { value: new THREE.Vector4(0.8, 26, 46, 0) },                           // x: how far lights burn through the mirror (0 = they are dimmed by it like everything else)
    uTownOcc: { value: new THREE.Vector4(1.6, 0.75, 0.62, 9.0) },                     // the shade of the roofs under water (fifth holder): x how soon a roofed neighbourhood counts as shade; y how far the light in that shade turns to uTownShade's hue; z how much darker it is; w the metres under the roofline over which it deepens
    uTownShade: { value: new THREE.Vector3(0.80, 0.78, 1.55) },                       // the hue (of luminance 1) of the light in that shade: a blue violet, the key painting's darks under water
    uTownPale: { value: new THREE.Vector4(0.33, 3.0, 0.3, 4.0) },                     // a pale thing under water (the theatre's steps, washing, a white sill): x the value its paint is held to from y metres down; z how much of what it has above that it keeps (under water nothing unlit is paler than the water round it); w (sixth holder): how many times the water's own light a lit thing may be before distance takes its paleness from it
    uTownFoot: { value: new THREE.Vector4(2.6, 0.0, 2.4, 0) },                          // the street lamps' pools on the ground (fifth holder): x their strength; y how far the roofs' shade dims them (none: a lamp stands IN the street); z how much of it follows the value of what it falls on                       // a pale thing under water (the theatre's steps, washing, a white sill): x the value its paint is held to from y metres down; z how much of what it has above that it keeps. Under water nothing unlit is paler than the water round it
    uTownBurn: { value: new THREE.Vector4(0.6, 1.6, 0.25, 0.45) },      // (sixth holder: z 0.15 -> 0.25: the key painting's lit street is a rose glow between dark roofs)                // lights burn through the water between: x y the brightness from and to which a thing counts as a light (third holder: from 0.35 and 1.2: lit treads and paving forty metres off came through the water as rows of dashes; only what truly burns does now); z how much of the lit water's own glow there is (0.8 -> 0.42, and the glow darker: it lay over the square as a pale violet haze) (fifth holder: 0.42 -> 0.15: a breath; the streets are lit by their lamps' pools and their windows now, as light ON things, and any more of this was a mauve mist between the houses); w how far a warm light is lifted as it is pushed to orange (0.12 -> 0.45: the windows are to be the brightest things in the picture)
  };
  const state = { reach: 0, time: 0, square: 1, gain: 1 };

  // ---------------------------------------------------------------------------------------------- the water between
  // The engine's water swallows light by DEPTH alone, so a street 9 m down would show as clearly at 150 m as under the
  // keel, and the town would read as a town in air. Here everything under the surface also dissolves into the water's
  // own colour with the DISTANCE the sight travels through water: the street runs away into it, the far town becomes a
  // glow (and the glow sheet takes over from there). The water's colour is green-teal where the sight ends in the top
  // metres and violet where it ends in the deep (the key painting's water, and the page's "colour of depth"), and it
  // is not dark: where the town burns under it the water itself is lit, so what a far street dissolves into is a glow,
  // and the lower half of the picture is the brighter half. And at the line itself there is a plain step: a thing is
  // wet and cooler from its first centimetre under the surface.
  // (the area's material reads the glow map once, in its `albedo` hook, and keeps it in gTown / gTownL for its light and for this)
  const waterFinal = (read) => /* glsl */`
    if (vWPos.y < 0.0) {
      float wD = -vWPos.y, wpath = length(vViewPos) * wD / (max(uCameraPos.y, 0.05) + wD);
      ${read ? 'vec4 gTown = townGlow(vWPos.xz); float gTownL = gTown.r * townWake(townS(gTown), vWPos.xz, -1.0, gTown.a);' : ''}
      float wdk = smoothstep(uTownWater.y, uTownWater.z, wD);
      // what a sight line ends in: the water's own colour, DARKER and bluer where it ends in the deep (depth darkens,
      // it never whitens). But where the town burns, the water it burns in is lit: a sight that ends LOW in a lit street,
      // at the height of its lamps and windows or under them, ends in an ember glow (the key painting's streets glow
      // between their dark roofs), more of it the more lit water it has passed through. A roof above its own windows
      // lies in dark water and stays a dark shape in front of that glow: that is what keeps it from being a haze.
      vec3 wcol = mix(uTownWaterA, uTownWaterB, wdk);
      ${read ? '' : `float wlow = 1.0 - smoothstep(-1.0, 3.5, gTownDy);
      float wglow = smoothstep(0.2, 0.8, gTownL) * uTownBurn.z * (1.0 - exp(-wpath * uTownSurf2.y)) * wlow;
      // (ember in the upper streets; where the sight ends deep, in the square, the glow has turned violet: the page's "what
      // light becomes below 14 m". Ember laid over deep teal made a grey; violet over teal makes a slate blue)
      vec3 wember = mix(uTownWaterLit, vec3(0.060, 0.034, 0.120), smoothstep(8.0, 20.0, wD));
      wcol = mix(wcol, mix(wember, vec3(0.06, 0.26, 0.22), clamp(gTown.g * 1.3, 0.0, 1.0) * 0.85), wglow);`}
      float wf = 1.0 - exp(-uTownWater.w * wpath - uTownPool.w * wD);                // by the distance sight travels through water, and by depth itself: the deep is dark
      // (in the veil between areas the mist stands in the water too: what lies under it dissolves within a few metres into
      // the veil's own colour, a step darker, and only what burns comes through, as a blur that sharpens as the boat comes
      // on: the page's first window. Without it the arrival was every roof for thirty metres seen through a lilac film.)
      { float wv = uTownVeil.w * uTownVeil.w, wvf = 1.0 - exp(-wv * 0.5 * wpath);
        wcol = mix(wcol, uTownVeil.rgb * 0.42, wv * 0.85); wf = 1.0 - (1.0 - wf) * (1.0 - wvf); }
      // (sixth holder) Under the market hall's glass the water is lit through and through (the map's jade: the hall's own
      // lamps and its glass): it swallows less there, so that the hall is looked INTO, to its stalls and its floor
      // twenty-two metres down, as the page's postcard has it; it was one mint film over a teal blur.
      wf *= 1.0 - uTownSurf3.x * smoothstep(0.35, 0.8, gTown.g) * smoothstep(0.15, 0.6, gTownL);
      wf = max(wf, 0.10 * smoothstep(0.0, 0.05, wD)) * uTownWater.x;                 // the step at the line
      // a light burns through water that a wall is lost in: what gives off light is swallowed far less
      // (fifth holder: it is what the thing GIVES OFF that counts, the material's own glow, not how bright it stands: a pale
      // flight of steps in strong lamplight counted as a light, burned through forty metres of water and was pushed to
      // orange: a milky slab. What is merely lit dissolves like any wall; windows, lamps, lanterns and the light that
      // spills from them burn through)
      float wfire = smoothstep(uTownBurn.x, uTownBurn.y, max(glow.r, max(glow.g, glow.b)));
      wf *= 1.0 - 0.8 * wfire;
      gl_FragColor.rgb = mix(gl_FragColor.rgb, wcol, wf);
      // (sixth holder) What is only LIT, and much paler than the water it stands in, goes out sooner with distance than a
      // dark thing does: forty metres off, through water seen at a glance, a pale flight of steps in lamplight lay under
      // the tower's reflection as a ruled page. What gives off light is spared; within a few metres nothing changes.
      { float wl = dot(gl_FragColor.rgb, vec3(0.3, 0.5, 0.2)), wover = max(wl - max(dot(wcol, vec3(0.3, 0.5, 0.2)) * uTownPale.w, 0.11), 0.0) * (1.0 - wfire);
        gl_FragColor.rgb *= 1.0 - (1.0 - exp(-wpath * 0.06)) * wover / max(wl, 1e-3); }
      // ... and through the MIRROR that lies on the water (fifth holder). At a glance the lake is three quarters mirror: the
      // tower and the dark of the sky lie on it, and whatever is under it comes through at a quarter of itself. A wall may
      // be lost under the sky's reflection; a lit window may not: the town BURNS under the glass, and its lights are the
      // brightest things in the picture at thirty metres as at three. So what gives off light is given back what the
      // mirror will take from it (the water's own curve, by the angle of the sight; never more than uTownMirror.w times).
      { float mF = clamp(uTownMirror.z + (uTownMirror.y - uTownMirror.z) * pow(1.0 - clamp(V.y, 0.0, 1.0), uTownMirror.x), 0.0, 0.95) * (1.0 - 0.55 * uTownVeil.w);
        gl_FragColor.rgb *= mix(1.0, min(1.0 / (1.0 - mF), uTownMirror.w), wfire * uTownBurn2.x * (1.0 - smoothstep(uTownBurn2.y, uTownBurn2.z, length(vViewPos)))); }      // (sixth holder: within uTownBurn2.y metres, and not beyond .z: further off the far water's own glow carries the town, and a lit flight of steps forty metres away came up through the mirror as a ruled page)
      // and it keeps its fire: a warm light seen through water is orange, never pink (jade and pale lights keep their hue)
      { vec3 fc = gl_FragColor.rgb; float fpk = max(fc.r, max(fc.g, fc.b)), fwarm = smoothstep(0.0, 0.22, (fc.r - max(fc.g, fc.b)) / max(fpk, 1e-3)) * wfire;
        gl_FragColor.rgb = mix(fc, fpk * vec3(1.0, 0.25, 0.07), 0.85 * fwarm) * (1.0 + uTownBurn.w * fwarm); }      // (third holder: the target was (1, 0.37, 0.10), which the tone curve shows as a pale peach; the key painting's windows are hue 21 at saturation 0.5)
    } else if (uTownMirror2.w > 0.5) {
      // THE MIRROR'S PICTURE (sixth holder). The water is a clear window near the boat and a mirror toward the horizon (the
      // water's own curve: plan.js WATER). By that curve alone the empty sky and the things that stand in the lake are
      // mirrored alike, and from an eye a metre up the image of anything tall falls within a few metres of the hull, where
      // the water is a window: the tower was not doubled. A painter leaves the dark sky out of clear water and lays the
      // tower's image on it all the same. So a THING is strengthened in the mirror's picture by the share its own, gentler
      // curve has over the water's, at the angle its image is seen at: its reflection lies on the water where the sky's
      // has already let the town through.
      float mc = clamp((vWPos.y + uCameraPos.y) / max(length(vec3(vWPos.xz - uCameraPos.xz, vWPos.y + uCameraPos.y)), 0.01), 0.0, 1.0);      // the sine of the angle under the horizon at which this point's image lies
      float mw = uTownMirror.z + (uTownMirror.y - uTownMirror.z) * pow(1.0 - mc, uTownMirror.x), mt = uTownMirror.z + (uTownMirror.y - uTownMirror.z) * pow(1.0 - mc, min(uTownMirror2.x, uTownMirror.x));
      gl_FragColor.rgb *= min(mt / max(mw, 0.02), uTownMirror2.y);
    }`;
  const WATER_FINAL = waterFinal(true);
  const WATER_PARS = 'uniform vec3 uTownWaterA, uTownWaterB, uTownWaterLit; uniform vec4 uTownWater, uTownBurn, uTownBurn2, uTownMirror, uTownMirror2, uTownPool, uTownSurf2, uTownSurf3, uTownVeil, uTownPale;';
  // Nothing under the surface takes the AIR's fog (gouache fogs every fragment by its distance, and the height fog lies
  // thickest at y 0: the drowned town stood in the lilac of the mist like a town in air, and paled with distance). The
  // surface over it carries the air's fog (the engine's water fogs itself by the distance to the surface), and the
  // water between does its own swallowing, into the dark.
  const WATER_FOG = 'if (vWPos.y < 0.0) fog *= 1.0 - smoothstep(0.0, 0.25, -vWPos.y);';

  // ---------------------------------------------------------------------------------------------- the material
  const extend = (lit = 1) => ({
    uniforms: { ...U, uTownLit: { value: lit } },
    fragmentPars: TOWN_GLSL + /* glsl */`
      uniform vec3 uTownNight, uTownCloud, uTownUnderCol, uTownJade, uTownShallow, uTownDeep, uTownTop, uTownStreet, uTownLine, uTownNet, uTownWaterLight;
      uniform vec4 uTownUnder, uTownSurf, uTownHue, uTownHueDeep, uTownSide, uTownSide2, uTownWall, uTownMon, uTownMon2, uTownMon3, uTownNetK, uTownOcc, uTownFoot; uniform vec3 uTownShade; ${WATER_PARS} uniform float uTownLit; uniform sampler2D tTownHeight; vec4 gTown; float gTownL, gTownLamp, gTownDy, gTownPy, gTownPz, gTownWl, gTownOcc, gTownFoot, gTownRoof;
      // How much of the street's own lamplight reaches a thing under the water: the light of the place, dying upward from
      // the height its lamps and windows burn at (and more slowly downward), on the faces that look toward it: a roof
      // above its own windows takes none, the paving under a lamp takes all.
      float townLamp(vec3 p, vec3 n, float l) {
        vec2 uv = (p.xz - uTownRect.xy) * uTownRect.zw + 0.5;
        vec4 th = texture2D(tTownHeight, clamp(uv, 0.0, 1.0));
        float dy = p.y - (th.r * 26.0 - 26.0);
        gTownDy = dy;                                                                 // (kept: how far above the lights of its place a thing is)
        float trl = th.g * 30.0 - 26.0;
        gTownRoof = clamp(th.b * uTownOcc.x, 0.0, 1.0) * smoothstep(2.5, 3.8, trl);                               // (kept: under a roof that stands above the water, the theatre's)
        gTownOcc = max(clamp(th.b * uTownOcc.x, 0.0, 1.0) * smoothstep(0.5, uTownOcc.w, trl - p.y), gTownRoof);      // (kept: how deep in the shade of the roofs round it a thing lies)
        // (kept: the street lamps' own pool here, on what lies under the lamp's head and looks up at it: all of it on the
        // ground, half on a wall's foot, none on what stands above the lamp or looks down)
        gTownFoot = -log(max(1.0 - th.a, 0.004)) / 1.4 * (1.0 - smoothstep(-1.0, 1.5, dy)) * exp(min(dy + 5.0, 0.0) / 6.0) * clamp(0.5 + 0.7 * n.y, 0.0, 1.0);
        float fall = dy > 0.0 ? exp(-dy / 4.5) : exp(dy / 10.0);
        float face = clamp(0.62 - 0.8 * n.y * clamp(dy / 1.5, -1.0, 1.0), 0.0, 1.0);
        return min(l, 1.4) * fall * face;
      }
      // the nets of light at a place in the plane they lie in (metres), now: the true caustic web (netTile, above), which
      // wriggles as the water over it breathes, with a second, fainter copy sliding across it the other way: threads form,
      // cross and let go, and no repeat shows. About half a metre to a mesh.
      uniform sampler2D tTownNetT;
      float townNet(vec2 p, float t) {
        vec2 wr = vec2(sin(p.y * 1.7 + t * 0.9) + sin(p.x * 0.9 - t * 0.6), cos(p.x * 1.5 - t * 0.8) + cos(p.y * 1.1 + t * 0.5)) * 0.07;
        float na = texture2D(tTownNetT, (p + wr) * 0.38 + vec2(t * 0.021, t * 0.013)).r;
        float nb = texture2D(tTownNetT, vec2(p.y, -p.x) * 0.29 + wr.yx * 0.2 + vec2(-t * 0.017, t * 0.024) + 0.37).r;
        return max(na, nb * 0.7) + na * nb * 1.5;
      }
      // ... and the same web out of focus and twice the size: water-light thrown UP on a wall or a soffit is soft, a slow
      // weave of pale bands, never a crackle of hard veins (the ride's caustic tile drew the portico's columns as cracked marble)
      float townNetSoft(vec2 p, float t) {
        vec2 wr = vec2(sin(p.y * 0.9 + t * 0.7) + sin(p.x * 0.5 - t * 0.4), cos(p.x * 0.8 - t * 0.6) + cos(p.y * 0.6 + t * 0.3)) * 0.10;
        float na = texture2D(tTownNetT, (p + wr) * 0.21 + vec2(t * 0.016, t * 0.022), 2.5).r;
        float nb = texture2D(tTownNetT, vec2(p.y, -p.x) * 0.15 + wr.yx * 0.3 + vec2(-t * 0.02, t * 0.012) + 0.37, 2.5).r;
        return 0.10 + na + nb * 0.8 + na * nb * 2.0;                                  // (a breath of even light under the weave: light, not a drawing on the stone)
      }
      // the living water at a place (the engine's ripple field round the boat; nothing outside it): xy its slope, w how disturbed it is
      vec4 townRipple(vec2 xz) { vec2 uv = (xz - uRippleRect.xy) / uRippleRect.zw + 0.5, e = min(uv, 1.0 - uv); return min(e.x, e.y) > 0.0 ? texture2D(tRipple, uv) * smoothstep(0.0, 0.08, min(e.x, e.y)) : vec4(0.0); }
    `,
    // (under water a thing is painted in the water's hue, green-teal in the top metres and bluer in the deep, as a painter
    // would paint it: not the mud that red paint and green light make. Only in good lamplight does it show its own colour.)
    albedo: /* glsl */`gTown = townGlow(vWPos.xz); gTownL = gTown.r * townWake(townS(gTown), vWPos.xz, -1.0, gTown.a);
      gTownLamp = 0.0; gTownDy = 30.0; gTownPy = uTownPool.y; gTownPz = uTownPool.z; gTownWl = 0.0; gTownOcc = 0.0; gTownFoot = 0.0; gTownRoof = 0.0;
      if (vWPos.y < 0.0) {
        gTownLamp = townLamp(vWPos, N, gTownL);
        // (a wall takes its windows' light sooner than paving or a roof does: the light of a window lies on the wall round it)
        gTownWl = 1.0 - smoothstep(0.25, 0.6, abs(N.y));
        gTownPy = uTownPool.y * mix(1.0, uTownWall.x, gTownWl); gTownPz = uTownPool.z * mix(1.0, uTownWall.y, gTownWl);
        float tshow = smoothstep(gTownPy, gTownPz, gTownLamp) * min(uTownLit * 1.5, 1.0) * (1.0 - uTownHueDeep.w);
        vec3 thue = mix(uTownHue.rgb, uTownHueDeep.rgb, smoothstep(uTownWater.y, uTownWater.z, -vWPos.y));
        // (two notes, as the key painting has them: what is warm in itself, tile, brick, rose plaster, goes to a dark violet
        // under the water; what is cool or green, moss, slate, stone, to the water's green-teal: roofs are violet and green)
        float twarm = clamp((albedo.r - albedo.g) / max(albedo.r + albedo.g + albedo.b, 1e-3) * 3.0, 0.0, 1.0);
        thue = mix(thue, vec3(1.02, 0.70, 1.20), twarm * uTownSurf2.x);
        float tlum = dot(albedo, vec3(0.3, 0.5, 0.2));
        // (and a pale thing, washing, a stone sill, a white frame, keeps less of the water's hue: it goes sea-grey, where it was mint)
        thue = mix(thue, vec3(0.94, 1.01, 1.06), smoothstep(0.16, 0.55, tlum) * uTownSurf2.z);
        albedo = mix(albedo, thue * (tlum + 0.015), uTownHue.w * (1.0 - tshow) * smoothstep(0.0, 0.25, -vWPos.y));
        // (and nothing unlit under water is paler than the water round it: the theatre's steps, a sheet on a line, a white
        // sill were the palest things in every picture that looks down. Their paint is held to a middle value from a few
        // metres down; in a lamp's pool they are as pale as they are)
        { float tcap = mix(1.0, uTownPale.x, smoothstep(0.2, uTownPale.y, -vWPos.y) * (1.0 - 0.7 * tshow)), tl2 = dot(albedo, vec3(0.3, 0.5, 0.2));
          if (tl2 > tcap) albedo *= (tcap + (tl2 - tcap) * uTownPale.z) / tl2; }
      }`,
    fog: WATER_FOG,
    final: waterFinal(false),
    light: /* glsl */`{
      float tl = gTownL, tj = clamp(gTown.g * 1.4, 0.0, 1.0), tup = N.y * 0.5 + 0.5, ty = vWPos.y, tdist = length(vViewPos);
      vec3 tbase = albedo * mix(vec3(1.0), shade, uShade) + albedo * ambient;      // what the plain material's key light gave: the town's light replaces it
      vec3 trest = c - tbase;                                                        // the lantern, the kept lamp, local lights, rim: kept
      vec3 tfrom = mix(uTownUnderCol, uTownJade, tj);                                // the colour of the light from below, here
      float tburn = mix(uTownUnder.y, 1.0, min(tl * 1.5, 1.0));                      // how much of it there is: the brightness of the town beneath this spot
      // ---- above the water: the plum night, and the town's light from below, failing with height (full at the line, 15
      // per cent at 9 m; faces that look down keep 35 per cent at any height)
      // (the monument: the tower stands in the middle of the widest and brightest water of the town, and the light of sixty
      // metres of lit lake climbs it further than a street's climbs a gable: its lowest third is rose-gold, fading up into
      // plum, as the page has it from 80 m. uTownMon: x the height over which it falls to a third there, y how much stronger,
      // z w the distance from the tower's axis within which a thing is the tower)
      float tmon = 1.0 - smoothstep(uTownMon.z, uTownMon.w, distance(vWPos.xz, uTownTower.xy));
      // (sixth holder: on the monument the light from below is a POOL AND A GLOW: a share of it dies in the first metre and a
      // half, as at the foot of any wall, and the rest climbs the lowest third. One slow fall alone left the loggia an even
      // salmon from the line to the vault at arm's length, where the eye sees four metres of it and no more)
      float thh = max(ty - 0.4, 0.0), thm = uTownMon3.x * exp(-thh / uTownMon3.y) + (1.0 - uTownMon3.x) * exp(-thh / uTownMon.x);
      float th = mix(mix(uTownMon2.y, uTownMon2.x, tmon), 1.0, mix(exp(-thh / uTownSide.z), thm, tmon)) * mix(1.0, uTownMon.y, tmon);         // (warm along the lower edge, plum above: 0.8 at 1 m, a third at 4 m, 0.15 from 9 m up. The page's even fall to 9 m lit whole house fronts across the water, and the town above the surface must stay a dark shape)
      th = max(th, 0.35 * smoothstep(-0.2, -0.75, N.y));
      float tk = th * tburn * uTownUnder.x;
      tk *= mix(1.0, uTownSide.w, smoothstep(0.15, 0.7, N.y));                       // (it comes from BELOW: what faces up, a roof, a sill, a coping, takes a quarter of it, and stays the plum of the night with a warm edge)
      vec3 above = albedo * (uTownNight * (0.82 + 0.18 * tup) + uTownCloud * (tup * tup)) + albedo * tfrom * ((0.10 + 0.90 * w) * tk * 0.8);
      // light that reaches ACROSS the water: a wall is lit by what burns under the water IN FRONT of it (read from the
      // glow map 8 and 22 m out along the way the wall looks, blurred), so a house on the square has a lit face and a
      // dark one, a column a lit side, and the form of a thing shows. It comes low and wide: full on the lowest metres,
      // a tenth by 8 m (warm along the lower edge, plum above: the rule of every form here). It sleeps with the water it comes from.
      if (ty > -0.05 && uTownSide.x > 0.0) { vec2 tnh = N.xz; float tnl = length(tnh);
        if (tnl > 0.25) { tnh /= tnl;
          vec2 tpa = vWPos.xz + tnh * 8.0, tpb = vWPos.xz + tnh * 22.0; vec4 tga = townGlowSoft(tpa, 3.5), tgb = townGlowSoft(tpb, 5.0);
          float tside = (tga.r * townWake(townS(tga), tpa, -1.0, tga.a) * 0.55 + tgb.r * townWake(townS(tgb), tpb, -1.0, tgb.a) * 0.75) * smoothstep(0.25, 0.8, tnl);
          above += albedo * mix(uTownUnderCol, uTownJade, clamp(tgb.g * 1.3, 0.0, 1.0) * 0.7) * (tside * mix(1.0, mix(uTownMon2.w, uTownMon2.z, tmon), smoothstep(mix(uTownSide2.x, 0.8, tmon), mix(uTownSide2.y, 8.0, tmon), ty)) * uTownUnder.x * uTownSide.x); } }      // (sixth holder: away from the monument it fails within uTownSide2 metres of the line. It failed over eight, and a gable three metres tall was orange to its apex: the brightest, warmest thing in the picture stood ABOVE the water)
      // an edge of that light on forms that stand against the dark (it wraps round from below); and a cooler, fainter edge
      // from the lit mist behind them, all the way up: what stands against the sky is round
      float tedge = pow(1.0 - clamp(abs(dot(N, V)), 0.0, 1.0), 3.0);
      above += tfrom * (tedge * tk * 0.20) * (0.3 + 0.7 * albedo);
      above += uTownLine * (tedge * uTownSide.y) * (0.3 + 0.7 * albedo);
      // water-light on the first metres above the surface: only where a town burns beneath, livelier where the water is disturbed
      // (what looks down on the water, a soffit, a vault, the mouth of a bell, takes it at any height when the water is stirred)
      float tsoffit = smoothstep(-0.4, -0.8, N.y);
      if (ty > -0.05 && tdist < 90.0 && (ty < uTownSurf.z || tsoffit > 0.0)) {
        vec3 an = abs(N);
        vec2 cu = an.y > 0.62 ? vWPos.xz : (an.x > an.z ? vec2(vWPos.z, vWPos.y * 0.6) : vec2(vWPos.x, vWPos.y * 0.6));      // (on a wall the weave is drawn out upward, as light thrown up from the water is)
        float tstir = clamp(townRipple(vWPos.xz).w * 4.0, 0.0, 1.0), tlive = 0.5 + 0.5 * tstir;
        float tband = (1.0 - smoothstep(0.0, uTownSurf.z, ty)) * exp(-max(ty, 0.0) / 1.1);       // (sixth holder: strong in the first metre, a seventh at two, gone by six: light thrown up from water dies quickly up a wall)
        tband *= 1.0 - smoothstep(0.0, 0.35, N.y);                                             // (and it comes from BELOW: none on the top of a roof, a sill, a coping; it was drawn over whole roofs as loops)
        float tc = townNetSoft(cu * 2.6, uTime) * uTownSurf2.w;
        float tw = max(tband * tlive, tsoffit * exp(-ty / 12.0) * (0.10 + 0.6 * tstir));
        above += uTownWaterLight * (tc * tw * (0.4 + 0.6 * tburn) * 0.42 * (1.0 - smoothstep(55.0, 90.0, tdist))) * (0.35 + 0.65 * albedo);
      }
      // ---- under the water: the water's own light (green-teal in the top metres, violet in the deep), a paler light on
      // what faces up (roofs are the fifth facade), and the light of the street itself: a thing in good lamplight shows
      // its local colour, a thing far from any light sinks into the water's
      float td = max(-ty, 0.0), tdk = smoothstep(uTownWater.y, uTownWater.z, td);
      vec3 tamb = mix(uTownShallow, uTownDeep, tdk) * (0.45 + 0.55 * tup) + uTownTop * (tup * tup * (1.0 - 0.65 * tdk));
      // (the shade of the roofs: in a street, at the foot of a wall, the light from the surface is shut out: darker, and a blue violet)
      tamb = mix(tamb, dot(tamb, vec3(0.3, 0.5, 0.2)) * uTownShade, gTownOcc * uTownOcc.y) * (1.0 - gTownOcc * uTownOcc.z);
      vec3 below = albedo * (tamb + vec3(0.030, 0.008, 0.040));      // (and a breath of violet: what is red in itself goes dark plum under green water, not dead)
      // (lamplight is a POOL: strong at the height and the foot of what burns, failing quickly away from it; between the
      // pools a wall sinks into the water's own colour. A rose wash over every wall of a lit street read as air.)
      float tpool = smoothstep(gTownPy, gTownPz, gTownLamp) * gTownLamp * uTownLit * uTownPool.x * mix(1.0, uTownWall.z, gTownWl);
      below += albedo * mix(uTownStreet, uTownJade, tj) * tpool;
      // (and the pool each street lamp lays at its own foot: it wakes and sleeps with the lights of its place)
      // It is laid on as LIT STONE in the lamp's own colour, orange at the rim and paler at the heart, by the value of what it
      // falls on (so the joints of the paving, a kerb, a drain show in it), whatever hue the water has given that thing:
      // orange light on teal paint is mud, and a lamp's pool is the one place in a street where the stone is seen)
      { float tf = gTownFoot * min(gTownL / max(gTown.r, 0.02), 1.3); tf = tf * tf / (tf + 0.25);
        // (it is given as light the stone gives off, so that the water between treats it as it treats a window: its heart
        // burns through, its rim is lost; as paint it was swallowed to a mauve mud twenty metres down)
        glow += mix(vec3(1.0, 0.19, 0.035), vec3(1.0, 0.31, 0.07), smoothstep(0.25, 1.0, tf)) * (tf * uTownFoot.x * (0.3 + uTownFoot.z * dot(albedo, vec3(0.3, 0.5, 0.2))) * (1.0 - gTownOcc * uTownFoot.y) * (1.0 - smoothstep(-0.05, 0.0, ty))); }
      // nets of slow moving light on what lies within a few metres of the surface; the wake sets them racing
      // (sixth holder: the true caustic web, townNet above. It lies in the plan on whatever faces up, and runs DOWN a wall,
      // drawn out along the fall of the light; its meshes widen a little with depth; it comes into focus a hand's breadth
      // down, is strongest in the first two metres and gone by nine; a wall takes a quarter of what a roof takes. The
      // light is the net's own, on top of what the thing is: on a dark roof a pale jade thread, on pale stone a paler one.)
      if (td < 9.0 && N.y > -0.35 && tdist < 70.0) {
        vec4 trp = townRipple(vWPos.xz);
        vec2 tnp = N.y > 0.45 ? vWPos.xz : (abs(N.x) > abs(N.z) ? vec2(vWPos.z, vWPos.y * 0.45) : vec2(vWPos.x, vWPos.y * 0.45));
        float tn = townNet(tnp * (uTownNetK.x / (1.0 + uTownNetK.y * td)) + trp.xy * 1.2, uTime);
        float tnf = smoothstep(0.04, 0.5, td) * (0.85 * exp(-td * 0.42) + 0.5 * exp(-td * 1.5));
        float tnface = mix(uTownNetK.z, 1.0, smoothstep(0.1, 0.6, N.y)) * smoothstep(-0.35, 0.0, N.y);
        tnface *= smoothstep(0.03, 0.4, abs(dot(N, V))) * (1.0 - gTownRoof);                             // (seen at a glance along a roof the web is a hatching of streaks: let it go)
        below += uTownNet * (tn * tnf * tnface * (0.8 + uTownNetK.w * clamp(trp.w * 3.0, 0.0, 1.0)) * (1.0 - smoothstep(40.0, 70.0, tdist)) * (1.0 - uTownVeil.w)) * (0.35 + 1.3 * albedo);
      }
      c = mix(below + trest * exp(-td * 0.7), above + trest, smoothstep(-0.03, 0.03, ty));
      // ---- the line where the water meets the thing: sky-light on the meniscus, warm where the town burns beneath.
      // Never thinner than the screen can draw (far off it is drawn a pixel and a half wide and fainter).
#ifndef TOWN_AFLOAT
            float tlw = max(0.008, 0.0013 * tdist);
      float tline = (1.0 - smoothstep(tlw * 0.5, tlw * 1.5, abs(ty - tlw * 0.5))) * min(1.0, 0.008 / tlw + 0.3) * (1.0 - smoothstep(22.0, 60.0, tdist));      // (far off the mirror and the mist say where the water is; a line there was a string of orange dashes on the horizon)
      c += mix(uTownLine, tfrom, 0.55 * min(tl * 1.3, 1.0)) * (tline * uTownSurf.w * (0.55 + 0.45 * tburn));
      #endif
    }`,
  });
  // (kept for those who pass it as a gouache `caustics` option: the water-light is built into the material now, so this adds nothing)
  const WATERLIGHT = { ripple: true, base: 0.3, intensity: 0, scale: 0.3, speed: 0.3, height: 6, color: '#C76C8C' };
  /** The area's material: gouache with the town's light. opts: any gouache option, plus lit (0..1). (water: true is accepted and no longer needed.) */
  const mat = (opts = {}) => { const { lit = 1, water = false, extend: more, ...rest } = opts; return kit.gouache({ brush: 0.8, ...rest, extend: [extend(lit), ...[].concat(more || [])] }); };

  // ---------------------------------------------------------------------------------------------- halos
  // Light in the water round a thing that shines: a soft glow standing a hand's breadth in front of each window, parallel
  // to its wall (so it never cuts into the wall, and lies on sill and plaster as spilled light does), or round a lamp,
  // facing the rider. It wakes and sleeps with its light, is swallowed by the water between like everything else, and
  // stops exactly at the surface (nothing is lit above the waterline). One draw call for all of them; under the water
  // only; before the water, so the surface bends it.
  //   list: [{ x, y, z, size, tone | color, s, rnd, stay, out: [x, y, z] }]   size: metres across; out: the way a window
  //   looks (its glow lies parallel to the wall); without `out` the glow faces the rider (a lamp)
  // (how much stronger and wider every halo is than its caller asked: one place to tune all of them, the kit's too. The key
  // painting's windows glow on to the wall round them for about their own width: a tenth of its water is that warm light.
  // Third holder: 2.2 and 1.35 -> 2.8 and 1.2: stronger and closer round its light; at 1.5 a street lamp's was a fog.)
  const HALO = new THREE.Vector2(Q_HALO[0], Q_HALO[1]);
  const halos = (list, opts = {}) => {
    const n = list.length, base = new THREE.PlaneGeometry(1, 1), geo = new THREE.InstancedBufferGeometry();
    geo.index = base.index; geo.setAttribute('position', base.attributes.position); geo.setAttribute('uv', base.attributes.uv);
    const aHalo = new Float32Array(n * 4), aWin = new Float32Array(n * 4), aOut = new Float32Array(n * 3), aCol = new Float32Array(n * 3), c = new THREE.Color();
    list.forEach((h, i) => {
      aHalo.set([h.x, h.y, h.z, h.size ?? 2.6], i * 4); aWin.set([0, h.rnd ?? -1, h.stay ?? 0, h.s ?? -1000], i * 4);
      const o = h.out || [0, 0, 0]; aOut.set(o, i * 3);
      c.set(h.color ?? WINDOW.tones[h.tone ?? 0]); if (!h.color && (h.tone ?? 0) !== 2) { c.g *= 0.64; c.b *= 0.42; } aCol.set([c.r, c.g, c.b], i * 3);
    });
    geo.setAttribute('aHalo', new THREE.InstancedBufferAttribute(aHalo, 4)); geo.setAttribute('aWin', new THREE.InstancedBufferAttribute(aWin, 4));
    geo.setAttribute('aOut', new THREE.InstancedBufferAttribute(aOut, 3)); geo.setAttribute('aCol', new THREE.InstancedBufferAttribute(aCol, 3)); geo.instanceCount = n;
    const material = new THREE.ShaderMaterial({
      uniforms: { ...U, uFogColor: sh.uFogColor, uFogDensity: sh.uFogDensity, uVeil: sh.uVeil, uVeilColor: sh.uVeilColor, uCameraPos: sh.uCameraPos, uHalo: { value: new THREE.Vector4((opts.gain ?? 0.42) * HALO.x, opts.push ?? 0.3, (opts.scale ?? 0.78) * HALO.y, 0) } },
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, side: THREE.DoubleSide,
      vertexShader: /* glsl */`
        ${TOWN_GLSL}
        attribute vec4 aHalo, aWin; attribute vec3 aOut, aCol; uniform vec3 uCameraPos; uniform vec4 uHalo, uTownWater, uTownVeil;
        varying vec2 vQ; varying vec3 vCol; varying float vDist, vY;
        void main() {
          bool wall = dot(aOut, aOut) > 0.01;
          vec3 c = aHalo.xyz + aOut * uHalo.y;                                     // the light stands in the water in front of the glass
          vec3 toCam = uCameraPos - c; float d = length(toCam); toCam /= max(d, 1e-3);
          // (in the veil between areas a window's glow is a round blur in the mist, turned to the rider, not a plane lying on
          // its wall: seen from above through the arrival's mist the planes were long orange smears beside each dormer)
          float hveil = clamp(uTownVeil.w * 1.5, 0.0, 1.0);
          vec3 n = wall ? normalize(mix(aOut, toCam, hveil)) : toCam;
          c += toCam * (1.1 * hveil);                                              // (and it stands in the misted water between the window and the eye, not in the roof beside it)
          vec3 right = abs(n.y) > 0.98 ? vec3(1.0, 0.0, 0.0) : normalize(cross(vec3(0.0, 1.0, 0.0), n)), up = cross(n, right);
          vec3 wp = c + (right * position.x + up * position.y) * (aHalo.w * uHalo.z * (1.0 + 0.9 * uTownVeil.w));      // (in the veil between areas a light is a wide blur: it draws in as the veil thins)
          float s = aWin.w > -999.0 ? aWin.w : townS(townGlow(c.xz));
          float lv = townWake(s, c.xz, aWin.y, aWin.z);
          float facing = wall ? mix(smoothstep(0.02, 0.3, dot(aOut, toCam)), smoothstep(-0.5, 0.2, dot(aOut, toCam)), hveil) : 1.0;     // seen edge-on a wall's glow is a line: let it go
          float depth = max(-c.y, 0.0), path = d * depth / (max(uCameraPos.y, 0.05) + depth);
          float through = exp(-uTownWater.w * path * 0.8);                         // the water between swallows it
          float hnear = mix(0.42, 1.0, smoothstep(0.7, 2.6, d / max(aHalo.w * uHalo.z, 0.1)));      // (a glow at arm's length is seen from all but inside it: thinner, or a lamp dome beside the hull burns a corner of the picture out to pale yellow)
          vCol = aCol * (uHalo.x * smoothstep(0.25, 1.0, lv) * lv * facing * through * hnear);
          vQ = position.xy * 2.0; vDist = d; vY = wp.y;
          gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);
        }`,
      fragmentShader: /* glsl */`
        uniform float uFogDensity, uVeil; varying vec2 vQ; varying vec3 vCol; varying float vDist, vY;
        void main() {
          float r = length(vQ), a = max(0.0, 1.0 - r); a = a * a * mix(1.0, a, 0.5) * smoothstep(0.0, -0.12, vY);      // close round its light, with a skirt that lies on sill and wall; it stops at the surface
          if (a < 0.003) discard;
          gl_FragColor = vec4(vCol * (a * exp(-uFogDensity * uFogDensity * vDist * vDist) * (1.0 - 0.55 * uVeil) * (1.0 - smoothstep(0.75, 1.0, uVeil))), 1.0);      // (it lives on some way into the veil, as a blur in the mist; at the veil's thickest it is gone)
        }`,
    });
    const mesh = new THREE.Mesh(geo, material); mesh.frustumCulled = false; mesh.renderOrder = -2; mesh.name = 'town-halos'; mesh.layers.set(1);      // (direct view only: nothing under the surface is in the mirror)
    return mesh;
  };

  // ---------------------------------------------------------------------------------------------- windows
  /**
   * The windows: one instanced mesh of quads, each lit by how awake it is, from dark glass through embers to its own
   * colour and a pale core. A window is lit only below the waterline: one that the surface crosses is lit below the
   * line and dark glass above it, exactly. Each is a sash with glazing bars, a lamp somewhere in the room behind it
   * (brighter there, deeper toward the corners), and now and then a curtain half drawn or a blind half down, so that
   * no two are alike and none is a flat square. list: layout's windows. Their halos in the water come with them
   * (a child of the mesh returned; opts.halo: false for none).
   */
  const windows = (list, opts = {}) => {
    const geo = new THREE.PlaneGeometry(1, 1), n = list.length;
    const mesh = new THREE.InstancedMesh(geo, null, n), aWin = new Float32Array(n * 4);
    const M = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), sc = new THREE.Vector3(), out = new THREE.Vector3();
    const glow = [];
    list.forEach((w, i) => {
      M.compose(p.set(w.x, w.y, w.z), q.setFromEuler(e.set(w.pitch || 0, w.yaw, 0, 'YXZ')), sc.set(w.w, w.h, 1)); mesh.setMatrixAt(i, M); aWin.set([w.tone, w.rnd, w.stay, w.s], i * 4);
      // its halo: round the part of it that is under the water, larger for a larger light
      const top = Math.min(w.y + w.h / 2, 0), bottom = w.y - w.h / 2;
      if (top - bottom > 0.12) { out.set(0, 0, 1).applyQuaternion(q); glow.push({ x: w.x, y: (top + bottom) / 2, z: w.z, size: 1.5 + 1.1 * Math.sqrt(w.w * (top - bottom)), tone: w.tone, s: w.s, rnd: w.rnd, stay: w.stay, out: [out.x, out.y, out.z] }); }
    });
    geo.setAttribute('aWin', new THREE.InstancedBufferAttribute(aWin, 4));
    mesh.material = kit.gouache({ color: '#000000', brush: 0, shade: 0, extend: {
      uniforms: { ...U, uWinTone: { value: WINDOW.tones.map((t) => col(t)) }, uWinDark: { value: col(WINDOW.dark) }, uWinCore: { value: col(WINDOW.core) }, uWinGain: { value: plan.gain.window } },
      vertexPars: 'attribute vec4 aWin; varying vec4 vWin; varying vec2 vWinSize;',
      vertexLocal: /* glsl */`vWin = aWin;
        #ifdef USE_INSTANCING
          vWinSize = vec2(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz));
        #else
          vWinSize = vec2(1.0, 1.4);
        #endif`,
      fragmentPars: TOWN_GLSL + 'varying vec4 vWin; varying vec2 vWinSize; uniform vec3 uWinTone[4]; uniform vec3 uWinDark, uWinCore, uTownCloud; uniform float uWinGain; ' + WATER_PARS, final: WATER_FINAL, fog: WATER_FOG,
      light: /* glsl */`{
        int ti = int(vWin.x + 0.5);
        vec3 tone = ti == 0 ? uWinTone[0] : ti == 1 ? uWinTone[1] : ti == 2 ? uWinTone[2] : uWinTone[3];
        float lv = townWake(vWin.w, vWPos.xz, vWin.y, vWin.z);
        // asleep to flaring: dark glass, a low ember (a warm light reddens as it dies; jade and pale gold keep their hue), its own colour, the pale core
        vec3 ember = ti == 2 ? tone * 0.45 : tone * vec3(0.62, 0.34, 0.28), drowse = ti == 2 ? tone * 0.8 : tone * vec3(0.92, 0.74, 0.66);
        vec3 ramp = lv < 0.35 ? mix(uWinDark, ember, lv / 0.35) : lv < 0.6 ? mix(ember, drowse, (lv - 0.35) / 0.25) : lv < 1.0 ? mix(drowse, tone, (lv - 0.6) / 0.4) : mix(tone, uWinCore, clamp((lv - 1.0) / 0.4, 0.0, 1.0));
        // the window itself, in metres from its lower left corner
        vec2 wm = vUv0 * vWinSize, wpx = vec2(length(dFdx(wm)), length(dFdy(wm))); float px = max(wpx.x, wpx.y);
        float r1 = fract(vWin.y * 7.13 + 0.31), r2 = fract(vWin.y * 13.7 + 0.57), r3 = fract(vWin.y * 29.3 + 0.11);
        // frame and glazing bars, 6 cm (nothing under water is drawn thinner); far off they melt into the pane instead of crawling
        float cols = vWinSize.x > 1.5 ? 3.0 : vWinSize.x > 0.62 ? 2.0 : 1.0, rows = vWinSize.y > 1.15 ? 2.0 : 1.0;
        vec2 cell = vWinSize / vec2(cols, rows), g = abs(mod(wm + cell * 0.5, cell) - cell * 0.5);          // distance to the nearest bar
        vec2 edge = min(wm, vWinSize - wm);
        float bw = 0.03, soft = max(px, 0.008);
        float bars = max(1.0 - smoothstep(bw - soft, bw + soft, min(g.x, g.y)), 1.0 - smoothstep(0.045 - soft, 0.045 + soft, min(edge.x, edge.y)));
        bars *= 1.0 - smoothstep(0.03, 0.09, px);                                                            // too far to hold a bar: none
        // the room: a lamp somewhere low in it, light falling off toward the corners
        vec2 lampAt = vec2(mix(0.22, 0.78, r1), mix(0.18, 0.5, r2)) * vWinSize;
        float room = exp(-dot(wm - lampAt, wm - lampAt) / (0.22 * vWinSize.x * vWinSize.y + 0.05));
        float fall = 0.40 + 0.60 * room;
        // a curtain half drawn (one window in three), a blind half down (one in six)
        float curtain = r3 < 0.33 ? smoothstep(0.0, 0.05, (r1 < 0.5 ? wm.x : vWinSize.x - wm.x) - vWinSize.x * mix(0.22, 0.42, r2)) : 1.0;
        float blind = r3 > 0.84 ? smoothstep(0.0, 0.04, vWinSize.y * mix(0.55, 0.75, r1) - wm.y) : 1.0;
        float cloth = mix(0.42, 1.0, curtain) * mix(0.5, 1.0, blind);
        float under = 1.0 - smoothstep(-0.012, 0.012, vWPos.y);                      // the rule of the place: nothing is lit above the waterline
        vec3 lit = max(ramp - uWinDark * 0.5, 0.0) * (fall * cloth) + uWinCore * (room * room * room * 0.3 * cloth * smoothstep(0.6, 1.0, lv));
        lit *= mix(1.0, 0.10, bars);
        // dark glass (above the line, or asleep): it holds a little of the sky
        c = uWinDark * 0.5 + uTownCloud * (0.25 * (1.0 - under));
        glow = lit * (uWinGain * under * smoothstep(0.0, 0.3, lv));
      }`,
    } });
    mesh.frustumCulled = false; mesh.name = 'town-windows';
    if (opts.halo !== false && glow.length) mesh.add(halos(glow, opts));
    return mesh;
  };

  /** A plain material for a thing that gives off light and wakes and sleeps with the town (a lamp head, a pane of the glass roof). */
  const emissive = (color, gain = 1, opts = {}) => kit.gouache({ color: opts.body || '#1a1024', brush: 0, shade: 0, ...opts.gouache, extend: {
    uniforms: { ...U, uEmCol: { value: col(color).multiplyScalar(gain) }, uEmTop: { value: col(opts.top || color).multiplyScalar(opts.topGain ?? gain) }, uEmS: { value: opts.s ?? -1000 }, uEmSpan: { value: new THREE.Vector2(opts.y0 ?? -1e4, opts.y1 ?? 1e4) } },
    fragmentPars: TOWN_GLSL + 'uniform vec3 uEmCol, uEmTop; uniform float uEmS; uniform vec2 uEmSpan; ' + WATER_PARS, final: WATER_FINAL, fog: WATER_FOG,
    light: /* glsl */`{
      vec4 eg = townGlow(vWPos.xz);
      float es = uEmS > -999.0 ? uEmS : townS(eg);
      float ev = townWake(es, vWPos.xz, -1.0, 0.6);
      glow = mix(uEmCol, uEmTop, smoothstep(uEmSpan.x, uEmSpan.y, vWPos.y)) * ev;
    }`,
  } });

  /** The same function as the shader's, on the CPU. */
  const level = (s, x, z, rnd = -1, stay = 0) => {
    const W = U.uTownWake.value, ahead = s - W.x; let up, on;
    if (rnd < 0) { up = 1 - sm(40, 70, ahead); on = 1 - sm(30, 60, -ahead); }
    else { const a = 40 + 30 * rnd, b = 30 + 30 * ((rnd * 7.31 + 0.17) % 1); up = 1 - sm(a - 2.5, a + 2.5, ahead); on = 1 - sm(b - 2.5, b + 2.5, -ahead); }
    const sq = sm(144, 152, s) * (1 - sm(208, 216, s)), r = Math.hypot(x - tw[0], z - tw[1]), k = 1 - W.z;
    const sqOn = 1 - sm(0, 0.12, k * 1.12 - (1 - Math.min(1, r / 75)));
    on = on + (sqOn - on) * sq;
    let lvl = (0.6 + 0.4 * up) * (stay * 0.85 + (1 - stay * 0.85) * on);
    lvl *= 1 + 0.12 * Math.sin(6.2832 * (s / 90 - W.y / 14));
    const Fl = U.uTownFlare.value; lvl *= 1 + Fl.y * (1 - sm(Fl.x - Fl.z, Fl.x, r));
    return lvl * W.w;
  };
  /** The light of the town beneath a place (0..1 or so), now: the glow map times the waking function. */
  const at = (x, z) => {
    const i = Math.min(N - 1, Math.max(0, Math.floor((x - x0) / m))), j = Math.min(N - 1, Math.max(0, Math.floor((z - z0) / m))), o = (j * N + i) * 4;
    return data[o] / 255 * level(data[o + 2] / 255 * 400 - 100, x, z, -1, data[o + 3] / 255);
  };

  /**
   * A stand-in in the town's light: engine's standIn (true size, true place, a name for &labels=1) wearing light.mat.
   * o: as for standIn (name, at | position, size, shape, color, turn, collide), plus lit, water (see mat) and emissive
   * (a colour: the thing gives off light, and wakes and sleeps with the town; gain multiplies it).
   */
  const stand = (o) => {
    const mesh = standIn(ctx, o), old = mesh.material;
    mesh.material = o.emissive ? emissive(o.emissive, o.gain ?? 1, { top: o.emissiveTop, topGain: o.topGain, y0: o.y0, y1: o.y1, s: o.wakeS }) : mat({ color: o.color || '#8a8494', lit: o.lit ?? 1, water: !!o.water, side: o.side ?? THREE.FrontSide });
    old.dispose();
    return mesh;
  };

  const light = { town, U, GLSL: TOWN_GLSL, glow: tex, state, tone: TONE, mat, stand, extend: extend(1), extendFor: extend, windows, halos, emissive, level, at, WATERLIGHT,
    /** The farthest s the boat has reached (the town wakes ahead of it and sleeps behind it). */
    setReach(s) { state.reach = Math.max(state.reach, s); },
  };
  ctx.onUpdate((dt, c) => {
    state.time = c.time;
    U.uTownWake.value.set(state.reach, state.time, state.square, state.gain);
    const vc = sh.uVeilColor.value; U.uTownVeil.value.set(vc.r, vc.g, vc.b, sh.uVeil.value);
  });
  shared.light = light;
  return light;
}
