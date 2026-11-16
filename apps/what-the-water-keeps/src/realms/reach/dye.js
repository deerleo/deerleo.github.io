// The dyers' reach: the maps of THE GLAZE, the dye on the water (stage 2, the place's water; docs/build/reach/2-light.md).
//
// The page (section 7) and the key painting ask for water that is "the third picture": broad marbled figures of the two
// dyes with clear water between them, curls rather than lines, slow eddies in the lagoon. The engine's dye film is a
// matte, opaque coat (paint on a floor), and at rest its threads lie along the flow and fan out from the bow. So the dye
// is drawn by this area as a GLAZE (set.js, "THE GLAZE"): a sheet on the water plane that multiplies what the water shows
// by what the dye lets through, its figure worked out PER PIXEL in the shader: fine bands between the levels of a ground,
// in broad figures, with half tones, striae and hairline veins; eddies that turn; far off, the bands' mean. What the
// shader cannot work out for itself it reads from the small maps made here, once:
//   comp    1 m cells, 4 bytes: how rich in dye the place is (carried round by the eddies); whose dye (the wandering seam);
//           how far along the route (for the dyes' colours); and what the place adds by design (the lane beside the
//           composed line, the pools where the postcards look)
//   swirl   0.5 m cells, 4 half floats: where the water of this place lay before the STATIC swirls turned it and the slow
//           warp swung it (as an offset, metres: x, z); and how far the ground's levels bow down the river here
//   bands   what every band is, drawn by lot once: 1024 bands, 8 bytes each (see below)
// and the eddies that TURN are given to the shader as they are (plan.water.glaze.turning).
// (Two earlier ways of drawing the dye stood in this file and are gone: capsules of pigment laid into the engine's film,
// and a whole marbled sheet laid into it. The log tells why.)
//
// Pure functions, no three.js, nothing random that is not seeded: the same figure every visit, and the same code runs in
// node for looking at it from above (scratch reach-light3/gl.py, named in the log).

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const hash2 = (x, y) => { let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
/** Smooth value noise, 0..1. */
export const vnoise = (x, y) => {
  const ix = Math.floor(x), iy = Math.floor(y); let fx = x - ix, fy = y - iy;
  fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
  const a = hash2(ix, iy), b = hash2(ix + 1, iy), c = hash2(ix, iy + 1), d = hash2(ix + 1, iy + 1);
  return a + (b - a) * fx + (c + (d - c) * fx - (a + (b - a) * fx)) * fy;
};
const ramp = (stops, x) => {
  if (x <= stops[0][0]) return stops[0][1];
  for (let i = 1; i < stops.length; i++) if (x <= stops[i][0]) return stops[i - 1][1] + (stops[i][1] - stops[i - 1][1]) * (x - stops[i - 1][0]) / (stops[i][0] - stops[i - 1][0]);
  return stops[stops.length - 1][1];
};
const hashI = (i, k) => hash2(i * 31 + k * 977 + 7, k * 131 + i * 17 + 3);

const _hf = new Float32Array(1), _hi = new Uint32Array(_hf.buffer);
/** A number as a half float (for the swirl map). */
const toHalf = (v) => {
  _hf[0] = v; const x = _hi[0], sgn = (x >>> 16) & 0x8000, e = ((x >>> 23) & 0xff) - 112, m = x & 0x7fffff;
  if (e <= 0) { if (e < -10) return sgn; return sgn | (((m | 0x800000) >> (1 - e)) + 0x1000 >> 13); }
  if (e >= 31) return sgn | 0x7c00;
  return (sgn | (e << 10)) + ((m + 0x1000) >> 13);
};
export const GLAZE_BANDS = 1024;

function* glazeSteps(plan, path, opts) {
  const G = plan.water.glaze, cell = G.cell, wcell = G.warpCell, SM = G.seam, K = G.kinds, RG = G.rich, NR = G.naveRoad;
  // (fifth holder) FIGURE SPACE: the river's length drawn in `kf` times (set.js, levelAt). The swirls are strewn and their map is made in it.
  const FG = (opts && opts.fig) || null, kf = FG ? FG.k : 1;
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  for (let i = 0; i < path.count; i += 2) { const r = path.hw[i] + G.margin; x0 = Math.min(x0, path.x[i] - r); x1 = Math.max(x1, path.x[i] + r); z0 = Math.min(z0, path.z[i] - r); z1 = Math.max(z1, path.z[i] + r); }
  x0 = Math.floor(x0); z0 = Math.floor(z0);
  const W = Math.ceil((x1 - x0) / cell), H = Math.ceil((z1 - z0) / cell), width = W * cell, height = H * cell;
  // the river's own coordinates on a coarse grid (path.locate is the slow part): metres along, metres right, half width
  const C = 2, gw = Math.ceil(width / C) + 3, gh = Math.ceil(height / C) + 3, gx0 = x0 - C, gz0 = z0 - C, grid = new Float32Array(gw * gh * 3), L = {};
  for (let j = 0; j < gh; j++) { if ((j & 7) === 7) yield; for (let i = 0; i < gw; i++) { path.locate(gx0 + i * C, gz0 + j * C, null, L); const k = (j * gw + i) * 3; grid[k] = L.s; grid[k + 1] = L.d; grid[k + 2] = L.halfWidth; } }
  const R = [0, 0, 0];
  const river = (x, z) => {
    const fx = Math.min(gw - 1.001, Math.max(0, (x - gx0) / C)), fz = Math.min(gh - 1.001, Math.max(0, (z - gz0) / C)), i = fx | 0, j = fz | 0, tx = fx - i, tz = fz - j, k = (j * gw + i) * 3, k2 = k + gw * 3;
    for (let c = 0; c < 3; c++) R[c] = (grid[k + c] * (1 - tx) + grid[k + 3 + c] * tx) * (1 - tz) + (grid[k2 + c] * (1 - tx) + grid[k2 + 3 + c] * tx) * tz;
  };
  const P0 = {}, pools = (G.pools || []).map(([ps, pd, r, amount]) => { const p = path.at(ps, P0); return { x: p.x + p.rx * pd, z: p.z + p.rz * pd, iR2: 1 / (r * r), amount }; });
  const masses = (G.masses || []).map(([ps, pd, r, amount]) => { const p = path.at(ps, P0); return { x: p.x + p.rx * pd, z: p.z + p.rz * pd, iR2: 1 / (r * r), amount }; });
  const SR = plan.sunRoad;
  // ---- the composition
  const comp = new Uint8Array(W * H * 4), byte = (v) => Math.max(0, Math.min(255, Math.round(v * 255)));
  for (let j = 0; j < H; j++) {
    if ((j & 15) === 15) yield;
    const z = z0 + (j + 0.5) * cell;
    for (let i = 0; i < W; i++) {
      const x = x0 + (i + 0.5) * cell, k = (j * W + i) * 4;
      river(x, z);
      const s = R[0], d = R[1], hw = Math.max(R[2], 1), ad = Math.abs(d);
      // how much of the water carries dye: broad masses and figures inside them; less in the first bays; fewer down the
      // sun's road in the nave; mostly open along the seam where the lagoon is wide (the composed line and the road run there)
      // (fourth holder: `along` no longer thins the masses, which made every mass of the first bays a ladder of dye and
      // clear water: it moves the masses' threshold, so that there are fewer and smaller masses there, each one whole)
      const shift = (1 - ramp(G.along, s)) * (G.alongShift ?? 0);
      // (and the great masses are PLACED, G.masses: [s, d, metres, how much]: each leans the masses' field toward dye (or,
      // below 0, toward open water) round a place, before the threshold is taken: so a placed mass has the same lobed edge
      // as any other, and the swirls carry it)
      let lean = (G.masses ? RG.banks * (RG.banksAlong ? ramp(RG.banksAlong, s) : 1) * smooth(0.7, 1.15, ad / hw) : 0); for (const q of masses) lean += q.amount * Math.exp(-((x - q.x) * (x - q.x) + (z - q.z) * (z - q.z)) * q.iR2);      // (toward the banks the water is rich: the dye comes from them)
      const mw = G.mass[3] * (G.massAlong ? ramp(G.massAlong, s) : 1);      // (the broad masses' share against the small figures': in the nave the figures are islands, not masses)
      let rich = smooth(G.mass[1] + shift, G.mass[2] + shift, mw * vnoise(x / G.mass[0] + 41.7, z / G.mass[0] - 13.9) + (1 - mw) * vnoise(x / G.figure + 5.3, z / G.figure + 88.1) + lean) * (G.alongShift == null ? ramp(G.along, s) : 1);
      if (s < NR.until) rich *= 1 - NR.thin * (1 - smooth(NR.half, NR.half * 2.4, ad)) * (1 - smooth(NR.until - 14, NR.until, s));
      const right = d / hw + (vnoise(x / SM.size + 71.3, z / SM.size + 29.1) - 0.5) * 2 * SM.wander + (G.seamShift || 0);
      rich *= 1 - SM.open * smooth(SM.narrow[0], SM.narrow[1], hw) * (1 - smooth(SM.meet, SM.width, Math.abs(right)));
      // THE LEAD (fourth holder). The key painting's water is two masses and a lead of bright water between them, down which
      // the sun's road lies. A lead of clear water runs down the composed line: `half` metres either side of it along the
      // route, wandering `wander` metres from side to side over `wanderOver` metres, its edge in lobes ([metres deep, metres
      // across]); it is part of the composition the swirls carry, so tongues of both dyes are drawn into it and curl there.
      if (G.lead) {
        const LD = G.lead, off = (vnoise(s / LD.wanderOver + 9.1, 3.7) - 0.5) * 2 * LD.wander * Math.min(1, hw / 14);
        const lobe = (vnoise(x / LD.lobes[1] + 13.3, z / LD.lobes[1] - 27.1) - 0.5) * 2 * LD.lobes[0] + (vnoise(x / (LD.lobes[1] * 0.37) - 3.3, z / (LD.lobes[1] * 0.37) + 7.1) - 0.5) * LD.lobes[0] * 0.6;
        // (it swells and narrows along its length, `breath`: [least, most, over so many metres], so that here and there the two masses nearly meet across it)
        const half = ramp(LD.half, s) * (LD.breath ? LD.breath[0] + (LD.breath[1] - LD.breath[0]) * vnoise(s / LD.breath[2] + 31.7, 11.9) : 1);
        rich *= 1 - LD.open * (1 - smooth(half, half + LD.soft, Math.abs(d - off) + lobe));
      }
      // the old river beyond the weir carries almost none: "nothing on it but light"
      const keep = 1 - (1 - RG.sunRoad) * smooth(-SR.from + 2, -SR.from + 10, -z) * (1 - smooth(SR.x[1] + 1, SR.x[1] + 6, x));
      // what the place adds by design: a lane of figures either side of the composed line, open water on the line; the pools
      let pool = 0; for (const q of pools) pool += q.amount * Math.exp(-((x - q.x) * (x - q.x) + (z - q.z) * (z - q.z)) * q.iR2);
      const lt = (ad - G.lane.at) / G.lane.wide, lane = G.lane.rich * Math.max(0, 1 - lt * lt) - G.lane.open * (1 - smooth(0, G.lane.road, ad));
      // toward the banks the water is rich: the dye comes from them (and beyond the channel's edge, where the yards stand in the water, it lies thick)
      rich = Math.max(RG.floor || 0, rich * RG.gain) + (G.masses ? 0 : RG.banks * smooth(0.7, 1.15, ad / hw));      // (and nowhere is the water bare: looking down beside the hull there is always a stroke or two)
      comp[k] = byte(rich * keep * (G.fadeIn ? ramp(G.fadeIn, s) : 1));      // (`fadeIn`: inside the veil, under the cream cloth, the water carries next to no dye)
      comp[k + 1] = byte(0.5 + 0.25 * right);                               // whose dye: 0.5 is the seam
      comp[k + 2] = byte(s / path.length);
      comp[k + 3] = byte(0.5 + 0.5 * Math.max(-1, Math.min(1, (pool * RG.pools + lane * RG.lane) * keep)));
    }
  }
  // ---- the swirls: the static ones, in the world, in the order they were made (the last made is the first undone);
  // the three the page asks to TURN (and the others of `turning`) are left out here: the shader turns them
  const P = {}, turning = G.turning.map((e) => { const p = path.at(e.at[0], P), turn = e.turn || (e.at[1] < 0 ? -1 : 1), Rr = e.across / 2; return { x: p.x + p.rx * e.at[1], z: p.z + p.rz * e.at[1], R: Rr, omega: turn * Math.PI * 2 / e.seconds, s: e.at[0], d: e.at[1], seconds: e.seconds }; });
  const isTurning = (e) => G.turning.some((t) => Math.hypot(t.at[0] - e.at[0], t.at[1] - e.at[1]) < 0.6 * Math.max(4, t.across / 2));
  let swirls = G.swirls.filter((e) => !isTurning(e)).map((e) => {
    const p = path.at(e.at[0], P), turn = e.turn || (e.at[1] < 0 ? -1 : 1), Rr = e.across / 2;
    return { x: p.x + p.rx * e.at[1], z: p.z + p.rz * e.at[1], zf: p.z + p.rz * e.at[1], R: Rr, iR2: 1 / (Rr * Rr), angle: turn * (e.turns ?? 0.4) * Math.PI * 2, s: e.at[0], d: e.at[1] };
  });
  if (FG) {
    // in figure space the swirls are strewn by lot (seeded): `count` of them inside the waterway and `beyond` metres past its edge, `size`
    // metres in radius (most of them small: `sizePow`), `turns` whole turns at the middle, either way, no two nearer than `apart` of
    // their radii. On the water each is drawn out `kf` times down the river: a long eye, as a current leaves.
    let seed = FG.seed >>> 0; const rnd = () => { seed = (seed + 0x6D2B79F5) >>> 0; let t = seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const list = [], zf0 = z0 / kf, zf1 = (z0 + height) / kf;
    for (let tries = 0; list.length < FG.count && tries < FG.count * 60; tries++) {
      const x = x0 + rnd() * width, zf = zf0 + rnd() * (zf1 - zf0), Rr = FG.size[0] + (FG.size[1] - FG.size[0]) * Math.pow(rnd(), FG.sizePow), turns = FG.turns[0] + (FG.turns[1] - FG.turns[0]) * rnd(), way = rnd() < 0.5 ? -1 : 1;
      river(x, zf * kf);
      if (Math.abs(R[1]) > R[2] + FG.beyond) continue;
      if (list.some((e) => Math.hypot(e.x - x, e.zf - zf) < FG.apart * (e.R + Rr))) continue;
      list.push({ x, z: zf * kf, zf, R: Rr, iR2: 1 / (Rr * Rr), angle: way * turns * Math.PI * 2, s: R[0], d: R[1] });
    }
    swirls = list;
  }
  const sw = swirls.slice().reverse();
  // (which swirls can reach a place: by squares of 8 m, with room for what the swirls before them moved)
  const B = 8, bw = Math.ceil(width / B), bh = Math.ceil(height / B), bins = Array.from({ length: bw * bh }, () => []);
  // (the bins and the map lie in figure space: zf = z / kf; with kf 1 that is the world)
  const fz0 = z0 / kf, fheight = height / kf;
  sw.forEach((e, q) => { const reach = 2.45 * e.R + 6, i0 = Math.max(0, Math.floor((e.x - reach - x0) / B)), i1 = Math.min(bw - 1, Math.floor((e.x + reach - x0) / B)), j0 = Math.max(0, Math.floor((e.zf - reach - fz0) / B)), j1 = Math.min(bh - 1, Math.floor((e.zf + reach - fz0) / B)); for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) bins[j * bw + i].push(q); });
  const WW = Math.ceil(width / wcell), WH = Math.ceil(fheight / wcell), swirl = new Uint16Array(WW * WH * 4);
  for (let j = 0; j < WH; j++) {
    if ((j & 15) === 15) yield;
    const zc = fz0 + (j + 0.5) * wcell;
    for (let i = 0; i < WW; i++) {
      const xc = x0 + (i + 0.5) * wcell; let x = xc, z = zc;
      const bin = bins[Math.min(bh - 1, Math.floor((zc - fz0) / B)) * bw + Math.min(bw - 1, Math.floor((xc - x0) / B))];
      for (let n = 0; n < bin.length; n++) {
        const e = sw[bin[n]], dx = x - e.x, dz = z - e.zf, qq = (dx * dx + dz * dz) * e.iR2;
        if (qq > 6) continue;
        const a = -e.angle * Math.exp(-qq), c = Math.cos(a), sn = Math.sin(a);
        x = e.x + dx * c - dz * sn; z = e.zf + dx * sn + dz * c;
      }
      // (the slow warp that swings the ground from side to side, so that the bands lie across no view for long, is added by
      // the shader itself since the fourth holder: stored here with the swirls it carried the COMPOSITION with it too, six
      // metres to one side or the other, and neither the lead nor a placed mass lay where it was put)
      river(x, z * kf);
      const u = Math.max(-1.3, Math.min(1.3, R[1] / Math.max(R[2], 1))), k = (j * WW + i) * 4;
      swirl[k] = toHalf(x - xc); swirl[k + 1] = toHalf(z - zc); swirl[k + 2] = toHalf((FG ? FG.bow : G.bow) * R[2] * (1 - u * u)); swirl[k + 3] = toHalf(1);
    }
  }
  // ---- what every band is, drawn by lot once. Row 0: the group's lot (is this group dye or open water?), the band's own
  // lot (is it dye?), its depth (0 pale .. 1 deep), the group's own shift of the seam. Row 1: where the band begins (no two
  // the same width), how much of the other bank's dye it carries, a hairline of clear water along its upstream edge, spare.
  const NB = GLAZE_BANDS, bands = new Uint8Array(NB * 2 * 4), D = K.depths, dsum = D[0] + D[1] + D[2];
  for (let i = 0, start = 0; i < NB; i++) {
    if (hashI(i, 7) < K.cut) start = i;
    const dl = hashI(i, 5) * dsum, depth = dl < D[0] ? 0.16 * dl / D[0] : dl < D[0] + D[1] ? 0.38 + 0.3 * (dl - D[0]) / D[1] : 0.82 + 0.18 * (dl - D[0] - D[1]) / D[2];
    const o = hashI(i, 4), other = o < K.second[0] ? K.second[1] : o < K.second[0] + K.tinge[0] ? K.tinge[1] : 0;
    bands[i * 4] = byte(hashI(start, 1)); bands[i * 4 + 1] = byte(hashI(i, 2)); bands[i * 4 + 2] = byte(depth); bands[i * 4 + 3] = byte(hashI(start, 3));
    const k = (NB + i) * 4;
    bands[k] = byte(hashI(i, 9)); bands[k + 1] = byte(other); bands[k + 2] = hashI(i, 8) < K.vein ? 255 : 0; bands[k + 3] = byte(hashI(start, 6));
  }
  const eddy = ({ x, z, R: Rr, angle, s, d }) => ({ x, z, R: Rr, angle, s, d });
  return { x0, z0, width, height, fig: { k: kf, z0: fz0, height: fheight }, comp: { data: comp, width: W, height: H }, swirl: { data: swirl, width: WW, height: WH }, bands: { data: bands, width: NB, height: 2 }, turning,
    eddies: turning.map((e) => ({ x: e.x, z: e.z, R: e.R, angle: Math.sign(e.omega) * Math.PI, s: e.s, d: e.d, seconds: e.seconds })).concat(swirls.map(eddy)) };
}

/** The glaze's maps, all at once (node). */
export function glazeMaps(plan, path, opts) { const it = glazeSteps(plan, path, opts); let r; while (!(r = it.next()).done); return r.value; }
/** The glaze's maps, a few milliseconds at a time (the ride: the area is built while the one before it is still on screen). */
export async function glazeMapsSlowly(plan, path, budget = 5, opts = null) {
  const it = glazeSteps(plan, path, opts), now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const rest = () => new Promise((done) => { if (typeof MessageChannel === 'undefined') { setTimeout(done, 0); return; } const c = new MessageChannel(); c.port1.onmessage = () => { c.port1.close(); done(); }; c.port2.postMessage(0); });
  let r, t0 = now();
  while (!(r = it.next()).done) if (now() - t0 > budget) { await rest(); t0 = now(); }
  return r.value;
}
