// The orchard in snow, MARGINS: the shelf's edge and its comb of icicles (fourth making; log: docs/build/snow/2-kit-margins.md).
// Loaded by kit_margins.js (pieces "shelf" and "icicles"); nothing else imports it.
//
// Page: "0.15 to 0.3 m of ice in three strata (snow, white bubbled ice, clear dark ice), undercut by the water, with a
// comb of icicles 5 to 20 cm under the lip and a rounded cornice of snow 10 to 25 cm on top. Lofted in code ... no two
// metres alike." The director: "the pools are cut out of the snow with a hard white line. In the key the snow rounds
// over into the water, with a rim of ice, icicles under the lip".
//
// WHAT THE FIRST THREE MAKINGS GOT WRONG, AND WHAT THIS ONE IS (read with the key painting open):
//   - A BERM. The cornice stood a quarter of a metre ABOVE the plain behind it: a bolster lying along the water. In the
//     key the snow is level to its edge and only rounds over there. Now the snow on the ice is as thick as the plain
//     is high (8 to 17 cm at the lip, the ice's top a little under the land's own rim), its top runs level into the
//     land's snow, and its edge is a soft brow a hand high.
//   - A LETTERBOX. The ice's face was only its upper half, over a black slot as tall again. Now the face goes down to a
//     hand above the water, clear and dark at its foot, white and bubbled above, and the water has eaten only a low
//     notch under it: "its dark line on the water".
//   - RULED BANDS. The strata are a ragged gradient in the paint, crossed by upright things: frozen runs that come down
//     from the lip and stop, flutes, hairline fractures; and the comb hangs in front of the face, from the snow's own
//     belly where it stands out over the ice and from the ice's top edge where the snow stands back.
//   - A TUBE. The snow's edge is no longer one section drawn out: it stands out over the ice here and back from it
//     there (a ledge of bare ice), sags where it dripped, has NOTCHES where a piece has broken away and DROOPS where
//     it has crept down over the face; and near the boat it is lofted every 5 cm (a window that goes with the boat),
//     so that those things are sculpted and not faceted.
//   - SHARK'S TEETH. The comb's icicles are slender and many, in runs with gaps, a few long among many short; they are
//     kept sorted along the edge and only those near the boat are drawn (a pool), so the comb can be as thick as it likes.
//
//   THE ICE   plates of half a metre to two and a half, each a run of flat fracture facets (drawn flat); twelve points
//             to a ring: rim ice (its edge, its inner side), the notch the water has eaten (wall foot, wall top, roof),
//             the face's lower lip, three points up the face, its top edge (a finger proud: what the comb hangs from),
//             the top, and the top going back under the snow. Joints: a crack that goes back into the shelf, or a step.
//   THE SNOW  nine points to a ring: a foot tucked into the ice, the belly (its lowest point: in front of the face
//             where it overhangs), the lower face, the nose, the shoulder, the crown, two on the top, and the back, which
//             dives under the land's own snow 0.95 m behind the line. One function of the metres along the edge
//             (snowSection): the far mesh samples it every 26 cm and the near window every 5.
// How far it stands out: as the third making found. The hull's side, pressed against the line it is stopped at, is
// 0.27 m off it at the gunwale: a plate's face stands 5 to 24 cm beyond the line, the snow's nose within 20, rim ice
// within half a metre; what stands further out is a TONGUE with a collider of its own.
import * as THREE from 'three';

export async function buildShelf(ctx, plan, shared, K) {
  const { kit } = ctx, land = shared.land, light = shared.light, seen = light.seen;
  const { Q, smooth, clamp, hash1, noise1, KM_NOISE, zeroLines, stations, centroidPaint, winter, col } = K;
  const iceTex = await ctx.tex('art/snow/clear_ice.webp', { repeat: true });
  const room = (x, z) => plan.waterRoom(-z, x);
  const S0 = plan.straight, S1 = 300, STEP = 0.24, UP = 4, PULL = 0.6;
  const lines = zeroLines(room, -32, 32, -S1, -S0, 0.25).filter((l) => l.length > 400);
  if (lines.length !== 2) throw new Error(`the water's edge came out as ${lines.length} long lines, not two`);
  const hold = { A: 'lip', B: 'step', C: 'heavy', D: 'calved' }[Q.get('kmshelf')];
  const bankness = (z) => smooth(-62.5, -53, z);
  const fadeAt = (s) => smooth(S0 - UP + 0.1, S0 - 0.7, s) * (1 - smooth(S1 - 14, S1 - 2, s));
  const NI = 12, NS = 9;

  // ================================================================================================ the two sides
  const sides = lines.map((line0, li) => {
    if (line0[0][1] < line0[line0.length - 1][1]) line0.reverse();      // from the river's mouth (z = -58) toward the mist
    const side0 = line0[Math.floor(line0.length / 2)][0] > 0 ? 1 : -1, pre = [];
    // it BEGINS 4 m up the river, along the land's own rim (the land's snow overhangs the river by a third of a metre there)
    for (let z = -(S0 - UP); z > line0[0][1] + 0.12; z -= 0.25) pre.push([land.waterEdge(side0, z), z]);
    const line = pre.concat(line0).map(([x, z]) => [x - side0 * 0.32 * bankness(z), z]);
    const st = stations(line, STEP, room), side = st[Math.floor(st.length / 2)].x > 0 ? 1 : -1, offT = li * 517.3, total = st[st.length - 1].t, nSt = st.length - 1;
    /** The edge at t metres along it, written into `o`: place, the way to the water, how sharply it turns. */
    const at = (t, o = {}) => {
      const f = clamp(t / total, 0, 1) * nSt, i = Math.min(nSt - 1, Math.floor(f)), u = f - i, a = st[i], b = st[i + 1];
      const nx = a.nx + (b.nx - a.nx) * u, nz = a.nz + (b.nz - a.nz) * u, l = Math.hypot(nx, nz) || 1;
      o.x = a.x + (b.x - a.x) * u; o.z = a.z + (b.z - a.z) * u; o.nx = nx / l; o.nz = nz / l; o.t = t; o.tight = a.tight + (b.tight - a.tight) * u;
      return o;
    };
    // ---- tongues: [metres along, half length, how far out], one every 6 to 17 m, none at a sharp turn of the edge
    const tongues = [];
    { let a0 = 11 + 7 * hash1(li, 5);
      while (a0 < total - 20) { const q = st[Math.min(nSt, Math.round(a0 / STEP))]; if (q.tight < 0.2 && -q.z < 262) tongues.push([a0, 1.3 + 1.7 * hash1(tongues.length + li * 40, 7), 0.32 + 0.6 * hash1(tongues.length + li * 40, 9)]); a0 += 6 + 11 * hash1(tongues.length + li * 40 + 3, 13); } }
    const tongueRaw = (t) => { let v = 0; for (const [a0, half, h] of tongues) { const u = Math.abs(t - a0) / half; if (u < 1) { const c = 0.5 + 0.5 * Math.cos(Math.PI * u); v = Math.max(v, h * Math.pow(c, 1.6)); } } return v; };
    const tongueAt = (t, s) => tongueRaw(t) * smooth(S0 + 3, S0 + 8, s);
    // ---- what has happened to the snow's edge: NOTCHES (a piece has broken away: the edge stands back for a foot or
    // two, its sides sharp) and DROOPS (it has crept out and down over the ice's face), every few metres, sorted
    const rf = ctx.rng(5531 + li * 97), feats = [];
    { let a0 = 2 + 4 * rf();
      while (a0 < total - 4) {
        const r = rf();
        feats.push(r < 0.58 ? { notch: 1, c: a0, w: 0.16 + 0.34 * rf(), depth: 0.14 + 0.2 * rf(), skew: (rf() - 0.5) * 1.2 } : { notch: 0, c: a0, w: 0.22 + 0.42 * rf(), depth: 0.7 + 0.3 * rf() });
        a0 += 2.2 + 6.5 * rf() * rf() + 1.2 * rf();
      } }
    let fi = 0;                                                    // (features are asked for along the edge in runs: the search starts where the last one ended)
    const featAt = (t, o) => {
      o.notch = 0; o.droop = 0;
      while (fi > 0 && feats[fi].c - 1.2 > t) fi--;
      while (fi < feats.length - 1 && feats[fi + 1].c - 1.2 <= t) fi++;
      for (let k = Math.max(0, fi - 2); k <= Math.min(feats.length - 1, fi + 2); k++) {
        const f = feats[k], d = Math.abs(t - f.c);
        if (d > f.w + 0.1) continue;
        if (f.notch) { const u = clamp((t - f.c) / f.w, -1, 1), v = (u + f.skew * (1 - u * u) * 0.5); o.notch = Math.max(o.notch, f.depth * Math.pow(Math.max(0, 1 - v * v), 0.7) * (1 - smooth(0.8, 1, Math.abs(u)))); }      // (a bite: deepest off its middle, its two sides unlike)
        else o.droop = Math.max(o.droop, f.depth * Math.pow(0.5 + 0.5 * Math.cos(Math.PI * Math.min(1, d / f.w)), 0.75));
      }
      return o;
    };
    // ---- the plates of this side
    const rs = ctx.rng(7001 + li * 131), plates = [], P0 = {};
    for (let t = 0; t < total - 0.05;) {
      const tightHere = at(t + 0.4, P0).tight, roll = rs();
      const kind = hold || (roll < 0.1 ? 'calved' : roll < 0.2 ? 'step' : roll < 0.42 ? 'heavy' : 'lip');
      let L = kind === 'calved' ? 0.5 + 0.9 * rs() : 0.45 + 2.1 * Math.pow(rs(), 1.5);
      if (tightHere > 0.25) L = Math.min(L, 0.55 + 0.45 * rs());
      if (total - (t + L) < 0.6) L = total - t;
      const tm = t + L / 2 + offT, lobe = clamp(0.5 + 1.0 * (noise1(tm * 0.19, 41) - 0.5) + 0.6 * (noise1(tm * 0.55, 43) - 0.5), 0, 1);
      const base = kind === 'calved' ? 0.13 + 0.09 * rs() : kind === 'step' ? 0.05 + 0.05 * rs() : clamp(0.06 + 0.13 * lobe + (rs() - 0.5) * 0.12, 0.05, 0.22);
      const skew = (rs() - 0.5) * 0.2 * Math.min(1, L / 1.2), crack = plates.length > 0 && rs() < 0.42 && tightHere < 0.5;
      const eaten = kind !== 'step' && rs() < (kind === 'calved' ? 0.5 : 0.86);
      plates.push({
        t0: t, L, kind,
        lip0: clamp(base - skew / 2, 0.045, 0.24), lip1: clamp(base + skew / 2, 0.045, 0.24),      // how far its face stands beyond the line, at its two ends (straight between: a fracture)
        hK: 0.88 + 0.12 * rs(), tilt: (rs() - 0.5) * 0.05,                                            // the ice's top against the land's own rim, and how it lies
        und: eaten ? 0.04 + 0.1 * rs() : 0, yU: 0.035 + 0.055 * rs(),                               // the notch the water has eaten under it: how deep, how tall
        rim: kind === 'step' ? 0.2 + 0.14 * rs() : rs() < 0.45 ? 0.08 + 0.2 * rs() : 0, rimH: kind === 'step' ? 0.024 : 0.012,      // rim ice lying out on the water from under it (the step: a foot of clear ice, awash)
        clear: 0.18 + 0.24 * rs(), white: 0.5 + 0.26 * rs(),                                        // where the clear ice ends and where the white ice ends, up the face
        comb: rs() < 0.86 ? 16 + 30 * Math.pow(rs(), 1.3) : 0, grow: 0.45 + 0.55 * rs(),            // icicles a metre, and how long they have grown
        crack, depth: crack ? 0.06 + 0.2 * rs() : 0, e: crack ? 0.022 + 0.035 * rs() : 0,           // the joint at its START: a crack's depth and half its width (else a step)
        lump: kind === 'calved' ? rs() < 0.75 : rs() < 0.06,
      });
      t += L;
    }
    const plateAt = (t) => { let a = 0, b = plates.length - 1; while (a < b) { const m = (a + b + 1) >> 1; if (plates[m].t0 <= t) a = m; else b = m - 1; } return a; };
    const lipIn = (pl, t) => pl.lip0 + (pl.lip1 - pl.lip0) * clamp((t - pl.t0) / pl.L, 0, 1);
    return { li, side, st, total, nSt, offT, at, tongues, tongueAt, feats, featAt, plates, plateAt, lipIn, rings: [], iNear: 0 };
  });

  // ================================================================================================ THE ICE
  // paint AS IT IS TO BE SEEN (the ice lays its own tones: `iceExt.light`)
  const C_RIM = seen('#2E2C4A'), C_INK = seen('#16131F'), C_ROOF = seen('#2C2A46'), C_LIP = seen('#4A4F84'), C_TOP = seen('#D5DAEE'), C_TOPB = seen('#DDE0EE'), C_CRACK = seen('#1B1829');
  const C_WALL = ['#3A3D66', '#4A4F80', '#5A6094'].map((h) => seen(h));         // where nothing is eaten out the face goes down into the water: clear and dark at the waterline
  const ice = { pos: [], col: [], k: [], ref: [], str: [], idx: [] };
  const tmpC = new THREE.Color(), P1 = {}, ZB = [0, 0, 0];
  const lumps = [];
  for (const S of sides) {
    const { plates, lipIn, offT, side } = S, rj = ctx.rng(9101 + S.li * 71), rings = S.rings;
    plates.forEach((pl, k) => {
      const prev = plates[k - 1], next = plates[k + 1], u0 = pl.crack ? pl.e : 0, u1 = pl.L - (next && next.crack ? next.e : 0);
      if (pl.crack) {                                           // the crack's bottom: two rings a finger apart, back in the shelf
        const bottom = Math.max(0.025, Math.min(prev.lip1, pl.lip0) - pl.depth);
        rings.push({ pl: prev, t: pl.t0 - pl.e * 0.3, lip: bottom, dark: 1, joint: true, dH: -0.02, jag: 0.5, b: ZB }, { pl, t: pl.t0 + pl.e * 0.3, lip: bottom, dark: 1, joint: true, dH: -0.02, jag: 0.5, b: ZB });
      }
      const us = [u0]; let u = u0;
      while (u1 - u > 0.6) { u += 0.2 + 0.38 * rj(); us.push(u); }
      us.push(u1);
      us.forEach((uu, j) => {
        const end = j === 0 || j === us.length - 1;             // (a plate's two ends are true to its own line; between them every facet is a little in or out, up or down)
        rings.push({ pl, t: pl.t0 + uu, lip: clamp(lipIn(pl, pl.t0 + uu) + (end ? 0 : (rj() - 0.5) * 0.07), 0.04, 0.245), dark: end && ((j === 0 && pl.crack) || (j > 0 && next && next.crack)) ? 0.35 : 0, joint: false, end, dH: end ? 0 : (rj() - 0.5) * 0.02, jag: rj(),
          b: [-0.004 - 0.018 * rj(), -0.004 - 0.016 * rj(), -0.002 - 0.01 * rj()] });      // the face stands back under its top edge, each facet by its own measure
      });
    });
    const base = ice.pos.length / 3, O = new Float64Array(NI), U = new Float64Array(NI);
    for (const r of rings) {
      const pl = r.pl, p = S.at(r.t, P1), s = -p.z, tt = r.t + offT, fade = fadeAt(s), uu = clamp((r.t - pl.t0) / pl.L, 0, 1);
      const R = land.snowHeight(p.x, p.z, 0, side), H = clamp(R * pl.hK + pl.tilt * (uu - 0.5) + r.dH, 0.1, R + 0.004);
      const lip = r.lip + S.tongueAt(r.t, s);
      const und = r.joint ? 0 : pl.und * (0.45 + 0.55 * Math.sin(Math.PI * uu)), eaten = und > 0.02;
      const yU = eaten ? Math.min(H * 0.5, pl.yU * (0.55 + 0.9 * noise1(tt * 1.7, 59))) : 0.012, wall = Math.max(0.02, lip - und - 0.01);
      const ext = pl.rim > 0 && !r.joint && !r.end ? Math.min(0.3, pl.rim * (0.45 + 0.9 * noise1(tt * 0.9, 53)) + 0.09 * (r.jag - 0.5)) * Math.min(1, 0.35 + 3 * Math.min(uu, 1 - uu)) : 0, rimmed = ext > 0.03;      // (it runs out to nothing at a plate's ends)
      if (rimmed) { O[0] = lip + ext; U[0] = pl.rimH; O[1] = Math.max(wall + 0.02, lip - 0.05); U[1] = pl.rimH + 0.002; } else { O[0] = wall + 0.03; U[0] = 0.012; O[1] = wall + 0.016; U[1] = 0.012; }
      O[2] = wall; U[2] = -0.08;
      if (eaten) { O[3] = wall + 0.004; U[3] = yU * 0.5; O[4] = wall + 0.55 * (lip - 0.008 - wall); U[4] = yU * 0.92; }
      else { O[3] = wall + 0.003; U[3] = 0.004; O[4] = wall + 0.006; U[4] = 0.009; }
      O[5] = lip - 0.008; U[5] = yU;
      O[6] = lip + r.b[0]; U[6] = yU + 0.012;
      O[7] = lip + r.b[1]; U[7] = yU + 0.34 * (H - yU);
      O[8] = lip + r.b[2]; U[8] = yU + 0.68 * (H - yU);
      O[9] = lip + 0.008; U[9] = H - 0.008;                     // the top edge, a finger proud of the face: the comb hangs from it
      O[10] = lip - 0.014; U[10] = H;
      O[11] = Math.min(lip - 0.2, -0.03); U[11] = H - 0.02;     // back under the snow, and under the land's own rim
      r.H = H; r.lipAt = lip; r.yU = yU; r.x = p.x; r.z = p.z; r.nx = p.nx; r.nz = p.nz; r.fade = fade; r.und = und; r.rimmed = rimmed; r.rimOut = O[0];
      const mott = 0.95 + 0.1 * noise1(tt * 0.9, 71);
      for (let i = 0; i < NI; i++) {
        const o = O[i] - (1 - fade) * PULL, x = p.x + p.nx * o, z = p.z + p.nz * o, mm = mott * (0.96 + 0.08 * noise1(tt * 2.3 + i * 7.7, 73 + i));
        const face = i >= 6 && i <= 9, hollow = i >= 2 && i <= 4;
        const c = face ? tmpC.setRGB(1, 1, 1) : i <= 1 ? tmpC.copy(C_RIM) : hollow ? (eaten ? tmpC.copy(i === 4 ? C_ROOF : C_INK) : tmpC.copy(C_WALL[i - 2])) : i === 5 ? tmpC.copy(eaten ? C_LIP : C_WALL[2]) : tmpC.copy(i === 10 ? C_TOP : C_TOPB);
        if (i >= 2) c.lerp(C_CRACK, r.dark * (i <= 5 ? 0.9 : 0.78));
        ice.pos.push(x, U[i], z); ice.col.push(c.r * mm, c.g * mm, c.b * mm);
        // aK: on the face; rim ice (1 at its inner side, 2 at its rimed outer edge); the eaten notch; how far up the face
        ice.k.push(face ? 1 : 0, i === 0 ? (rimmed ? 2 : 1) : i === 1 ? 1 : 0, hollow && eaten ? 1 : i === 5 && eaten ? 0.5 : 0, face ? (i - 6) / 3 : i === 10 ? 1 : i === 11 ? 2 : 0);
        ice.ref.push(p.nx, p.nz, tt);
        ice.str.push(pl.clear, pl.white);
      }
    }
    // a block of ice lying in the water where a plate has calved, hard against the foot of its face
    for (const pl of plates) {
      if (!pl.lump) continue;
      const t = pl.t0 + pl.L * (0.3 + 0.4 * noise1(pl.t0, 99)), p = S.at(t, P1), s = -p.z;
      if (fadeAt(s) < 0.9 || p.tight > 0.3) continue;
      const o = lipIn(pl, t) + S.tongueAt(t, s) + 0.05 + 0.08 * noise1(pl.t0 * 1.3, 103), rr = 0.07 + 0.08 * noise1(pl.t0 * 3.1, 101);
      lumps.push({ x: p.x + p.nx * o, z: p.z + p.nz * o, nx: p.nx, nz: p.nz, r: rr, t: t + offT });
    }
    // faces: found facing the water once, then laid the same way all along
    let k0 = Math.floor(rings.length / 2); while (k0 < rings.length - 2 && (rings[k0].joint || rings[k0 + 1].joint || rings[k0 + 1].t - rings[k0].t < 0.05)) k0++;
    const g = (q, j) => ice.pos[q * 3 + j], a = base + k0 * NI + 7, b = base + (k0 + 1) * NI + 7, c = b + 1;
    const ux = g(b, 0) - g(a, 0), uy = g(b, 1) - g(a, 1), uz = g(b, 2) - g(a, 2), vx = g(c, 0) - g(a, 0), vy = g(c, 1) - g(a, 1), vz = g(c, 2) - g(a, 2);
    const toward = (uy * vz - uz * vy) * rings[k0].nx + (ux * vy - uy * vx) * rings[k0].nz > 0;
    S.flip = !toward;
    for (let k = 0; k < rings.length - 1; k++) for (let i = 0; i < NI - 1; i++) { const A = base + k * NI + i, B = base + (k + 1) * NI + i, Cc = B + 1, D = A + 1; if (S.flip) ice.idx.push(A, D, Cc, A, Cc, B); else ice.idx.push(A, B, Cc, A, Cc, D); }
  }
  // ---- the calved blocks: a broken piece of the shelf lying awash at its foot, tipped, with a chip or two beside it
  // (third holder's): three rings of five corners (clear ice at the water, white above, frost on its top), no two alike
  { const rl = ctx.rng(3301), tones = [seen('#565C90'), seen('#AEB6DC'), seen('#D3D9EE')];
    const block = (cx0, cz0, r, nx, nz, t) => {
      const base = ice.pos.length / 3, n = 5, turn = rl() * 6.283, h = r * (0.35 + 0.5 * rl()), tipA = rl() * 6.283, tip = 0.25 + 0.5 * rl(), corners = [];
      for (let i = 0; i < n; i++) { const a = turn + (i + (rl() - 0.5) * 0.55) / n * 6.283, rr = r * (0.6 + 0.6 * rl()); corners.push([Math.cos(a) * rr, Math.sin(a) * rr, 0.75 + 0.2 * rl()]); }
      [[-0.07, 1.08], [0.4, 1.0], [1.0, 0]].forEach(([yk, k], ring) => {
        corners.forEach(([x0, z0, topK]) => {
          const kk = ring === 2 ? topK : k, x = x0 * kk, z = z0 * kk, lean = (x * Math.cos(tipA) + z * Math.sin(tipA)) / r;
          const y = ring === 0 ? yk : Math.max(0.012, h * yk * (1 + tip * lean)), c = tones[ring];
          ice.pos.push(cx0 + x, y, cz0 + z); ice.col.push(c.r, c.g, c.b); ice.k.push(0, 0, 0, ring * 0.5); ice.ref.push(nx, nz, t); ice.str.push(0.3, 0.7);
        });
      });
      for (let ring = 0; ring < 2; ring++) for (let i = 0; i < n; i++) { const a0 = base + ring * n + i, a1 = base + ring * n + (i + 1) % n, b0 = a0 + n, b1 = a1 + n; ice.idx.push(a0, b0, b1, a0, b1, a1); }
      for (let i = 1; i < n - 1; i++) ice.idx.push(base + 2 * n, base + 2 * n + i + 1, base + 2 * n + i);
    };
    for (const L of lumps) {
      block(L.x, L.z, L.r, L.nx, L.nz, L.t);
      const chips = Math.floor(rl() * 3);
      for (let q = 0; q < chips; q++) { const a = rl() * 6.283, d = L.r * (1.3 + 1.2 * rl()); block(L.x + Math.cos(a) * d * 0.9 + L.nx * 0.04, L.z + Math.sin(a) * d * 0.9 + L.nz * 0.04, L.r * (0.3 + 0.3 * rl()), L.nx, L.nz, L.t); }
    } }
  // THE ICE'S OWN PAINT. aK: x = on the face, y = rim ice (1) to its rimed edge (2), z = the eaten notch, w = how far up
  // the face. aRef: the edge's own facing (x, z) and the metres along it. aStr: where the clear ice ends and where the
  // white ice ends, up the face. The ice lays its own tones (its paint is authored as seen): every fracture facet its
  // own tone by how far it is turned from the edge's facing, what looks down sunk toward violet; the lantern warms it.
  const iceExt = {
    uniforms: { tClearIce: { value: iceTex }, uKmStrata: { value: [seen('#454A80'), seen('#5C639A'), seen('#8F99C6'), seen('#A3ADD6'), seen('#B9C1E2')] }, uKmRime: { value: seen('#D6DDF0') }, uKmInk: { value: seen('#15121E') } },
    vertexPars: 'attribute vec4 aK; attribute vec3 aRef; attribute vec2 aStr; centroid varying vec4 vK; centroid varying vec3 vRef; centroid varying vec2 vStr;',
    vertexLocal: 'vK = aK; vRef = aRef; vStr = aStr;',
    fragmentPars: `uniform sampler2D tClearIce; uniform vec3 uKmStrata[5]; uniform vec3 uKmRime, uKmInk; centroid varying vec4 vK; centroid varying vec3 vRef; centroid varying vec2 vStr; ${KM_NOISE}`,
    albedo: /* glsl */`{
      // the clear-ice picture (bubbles in strings, fracture planes, a frozen-in leaf): from above on what lies level
      // (the rim ice), from the side on the face. Laid at two sizes and two turns that change places over a stride or
      // two, so that no string of bubbles comes round again in step; its leaves are let through only here and there
      vec3 q2 = vec3(vWPos.x * 0.8 + vWPos.z * 0.6, vWPos.y, vWPos.z * 0.8 - vWPos.x * 0.6);
      vec3 pa = tri(tClearIce, vWPos * 1.55, N), pb = tri(tClearIce, q2 * 1.02 + 3.7, N);
      vec3 pic = mix(pa, pb, smoothstep(0.42, 0.58, kmN(vWPos.xz * 0.9 + 2.3)));
      float leaf = smoothstep(0.74, 0.82, pic.r / max(pic.b, 0.01)) * (1.0 - smoothstep(0.80, 0.88, kmN(vWPos.xz * 0.55 + 11.0)));
      pic = mix(pic, vec3(0.145, 0.137, 0.235), leaf);
      float along = vRef.z, onFace = vK.x, up = min(vK.w, 1.0), kmBack = clamp(vK.w - 1.0, 0.0, 1.0);
      // THE FACE'S STRATA: clear dark ice at its foot, white bubbled ice, compact snow-ice under the snow. A ragged
      // gradient, never a ruled line: the two boundaries climb and sink by a hand along the edge
      float sv = up + 0.16 * (kmN(vec2(along * 5.0, vWPos.y * 17.0)) - 0.5) + 0.08 * (kmN(vec2(along * 23.0, vWPos.y * 9.0)) - 0.5);
      float kmWhite = smoothstep(vStr.x - 0.12, vStr.x + 0.12, sv), kmSnowIce = smoothstep(vStr.y - 0.12, vStr.y + 0.12, sv);
      vec3 strat = mix(mix(uKmStrata[0], uKmStrata[1], clamp(sv / max(vStr.x, 0.05), 0.0, 1.0)), mix(uKmStrata[2], uKmStrata[3], clamp((sv - vStr.x) / max(vStr.y - vStr.x, 0.05), 0.0, 1.0)), kmWhite);
      strat = mix(strat, uKmStrata[4], kmSnowIce);
      // FLUTES: the face is runnelled, a hand apart, each runnel its own depth of tone from top to foot
      float fl = kmN(vec2(along * 17.0, vWPos.y * 1.3 + 3.0)) * 0.6 + kmN(vec2(along * 43.0, vWPos.y * 3.0)) * 0.4;
      strat *= 0.86 + 0.28 * fl;
      // FROZEN RUNS: pale threads of ice that come down from the lip and stop, each at its own depth, thinning as they go
      float ri = along * 27.0, rc = floor(ri), rh = kmH(vec2(rc, 5.3)), rlen = 0.25 + 0.7 * kmH(vec2(rc, 9.1));
      float rx = abs(fract(ri) - 0.5 - 0.3 * (kmH(vec2(rc, 2.2)) - 0.5)), rdown = clamp((1.0 - up) / rlen, 0.0, 1.0);
      float run = step(0.42, rh) * (1.0 - smoothstep(0.05 + 0.13 * (1.0 - rdown), 0.1 + 0.16 * (1.0 - rdown), rx)) * (1.0 - smoothstep(0.75, 1.0, rdown));
      strat = mix(strat, uKmRime, 0.62 * run);
      albedo = mix(albedo, albedo * strat, onFace);
      float kmClear = (1.0 - kmWhite) * onFace, kmBub = kmWhite * (1.0 - 0.65 * kmSnowIce) * onFace * (1.0 - run);
      // THE LEDGE: the ice's own top where the snow stands back from its edge: milky ice, a clearer bluer patch here and
      // there, and a dusting of snow that thickens toward the snow behind it
      float kmTop = (1.0 - onFace) * smoothstep(0.5, 1.0, up) * (1.0 - clamp(vK.y, 0.0, 1.0));
      float lc = kmN(vWPos.xz * 3.7 + 5.0), ld = kmN(vWPos.xz * 8.0 + 1.3) * 0.6 + kmN(vWPos.xz * 21.0) * 0.4;
      albedo = mix(albedo, uKmStrata[2] * (0.85 + 0.45 * dot(pic, vec3(0.33))), kmTop * smoothstep(0.55, 0.8, lc) * 0.75);
      albedo = mix(albedo, uKmRime * 1.04, kmTop * smoothstep(0.25, 0.75, kmBack * 1.6 + 0.5 * (ld - 0.5)));
      // RIM ICE lying on the water: clear and dark with the picture's bubbles in it; frost has crept out on to it from
      // the shelf in feathers; only its outer edge is rimed pale
      float rimK = clamp(vK.y, 0.0, 1.0), rimOut = clamp(vK.y - 1.0, 0.0, 1.0);
      float kmEdge = smoothstep(0.66 + 0.22 * kmN(vec2(along * 5.0, 2.7)), 0.97, rimOut) * rimK;
      float feather = (1.0 - smoothstep(0.0, 0.5 + 0.35 * kmN(vec2(along * 3.1, 7.7)), rimOut)) * (0.45 + 0.55 * kmN(vWPos.xz * 6.0 + 2.0));
      albedo = mix(albedo, pic * 1.15 + albedo * 0.3, rimK * (1.0 - kmEdge));
      albedo = mix(albedo, uKmRime * 0.86, 0.6 * feather * rimK * (1.0 - kmEdge));
      albedo = mix(albedo, uKmRime * (0.9 + 0.2 * kmN(vWPos.xz * 37.0)), kmEdge);
      // the notch the water has eaten: ink, a little of the picture's planes in it
      albedo = mix(albedo, uKmInk * (0.8 + 0.6 * pic.b), 0.85 * clamp(vK.z, 0.0, 1.0));
      // the clear stratum is varied by the picture (its bubbles and planes stand in it)
      albedo *= mix(1.0, 0.72 + 1.15 * dot(pic, vec3(0.3, 0.4, 0.3)), kmClear);
      // the white stratum's own bubbles: flat specks lying in level strings
      float kb = kmN(vec2(along * 46.0, vWPos.y * 190.0)), kl = kmN(vec2(along * 3.0, vWPos.y * 95.0));
      albedo *= 1.0 + kmBub * (0.11 * smoothstep(0.62, 0.82, kb) - 0.08 * (1.0 - smoothstep(0.2, 0.45, kb)) + 0.08 * (kl - 0.5));
      // HAIRLINE FRACTURES: one in most strides of the face, leaning as it climbs, dark with a pale bruise beside it
      float cw = 0.47, cx = along / cw, ci = floor(cx), h1 = kmH(vec2(ci, 3.7)), h2 = kmH(vec2(ci, 9.1));
      float xc = 0.2 + 0.6 * h1 + (vWPos.y - 0.12) * (h2 - 0.5) * 1.6;
      float dcr = abs(fract(cx) - xc) * cw, has = step(0.62, h2 + h1 * 0.5);
      albedo = mix(albedo, albedo * vec3(0.5, 0.5, 0.64), has * (1.0 - smoothstep(0.002, 0.006, dcr)) * onFace);
      albedo *= 1.0 + 0.07 * has * smoothstep(0.006, 0.01, dcr) * (1.0 - smoothstep(0.01, 0.04, dcr)) * onFace;
    }`,
    light: /* glsl */`{
      float kmTurn = N.x * (-vRef.y) + N.z * vRef.x;                                  // how far this facet is turned from the edge's own facing
      float kmUp2 = 1.0 - abs(N.y);
      vec3 kmForm = vec3(1.0 + clamp(1.7 * kmTurn, -0.22, 0.22) * kmUp2 + stroke * 0.03);
      kmForm *= mix(vec3(0.66, 0.66, 0.82), vec3(1.0), smoothstep(-0.85, -0.15, N.y));     // what looks down sinks toward violet
      kmForm *= 1.0 + 0.07 * smoothstep(0.3, 0.9, N.y);                                // what looks up takes the sky
      c = albedo * kmForm + albedo * lamps * 0.8;
    }`,
  };
  const iceGeo = new THREE.BufferGeometry();
  iceGeo.setAttribute('position', new THREE.Float32BufferAttribute(ice.pos, 3)); iceGeo.setAttribute('color', new THREE.Float32BufferAttribute(ice.col, 3));
  iceGeo.setAttribute('aK', new THREE.Float32BufferAttribute(ice.k, 4)); iceGeo.setAttribute('aRef', new THREE.Float32BufferAttribute(ice.ref, 3)); iceGeo.setAttribute('aStr', new THREE.Float32BufferAttribute(ice.str, 2));
  iceGeo.setIndex(ice.idx); iceGeo.computeVertexNormals();
  const iceMesh = new THREE.Mesh(iceGeo, kit.gouache({ color: '#ffffff', vertexColors: true, brush: 0.4, flat: true, extend: [centroidPaint, iceExt] }));
  iceMesh.name = 'the shelf: ice in plates, three strata, the notch under it, rim ice and calved blocks (winter)'; iceMesh.frustumCulled = false; winter(ctx.add(iceMesh));

  // ================================================================================================ THE SNOW
  // One function of the metres along the edge: the nine points of the snow's section at t, as [out, up] pairs in O and
  // U, and what hangs from it in `info`. Everything in it is a smooth function of t (plates are heard only through a
  // foot of smoothing: snow does not know where one plate ends), so the far mesh and the near window agree.
  const PAPER = col('#F3ECE8'), FOOT = col('#B6BBDC'), LOW = col('#D0D2E8'), SNOW_SHADE = col('#8F88B8');
  const TAPS = [[-0.17, 0.25], [0, 0.5], [0.17, 0.25]], F0 = {}, PS = {};
  const snowSection = (S, t, O, U, info) => {
    const { plates, plateAt, lipIn, offT, side, total } = S, p = S.at(t, PS), s = -p.z, tt = t + offT;
    let lipS = 0, hK = 0, tilt = 0, heavy = 0;
    for (const [dt, wt] of TAPS) {
      const tq = clamp(t + dt, 0, total - 1e-3), pl = plates[plateAt(tq)];
      lipS += wt * lipIn(pl, tq); hK += wt * pl.hK; tilt += wt * pl.tilt * (clamp((tq - pl.t0) / pl.L, 0, 1) - 0.5); if (pl.kind === 'heavy') heavy += wt;
    }
    // a crack between two plates: the snow dips into it and bridges it; a calved plate: the snow stands back from its edge
    const kp = plateAt(clamp(t, 0, total - 1e-3)), pl0 = plates[kp], pl1 = plates[kp + 1];
    let dip = 0, depth = 0;
    if (pl0.crack) { const d = 1 - smooth(0, 0.3, t - pl0.t0); if (d > dip) { dip = d; depth = pl0.depth; } }
    if (pl1 && pl1.crack) { const d = 1 - smooth(0, 0.3, pl1.t0 - t); if (d > dip) { dip = d; depth = pl1.depth; } }
    const calved = pl0.kind === 'calved' ? smooth(0, 0.2, t - pl0.t0) * smooth(0, 0.2, pl0.t0 + pl0.L - t) : 0;
    const f = S.featAt(t, F0), droop = f.droop * (1 - calved);
    const R = land.snowHeight(p.x, p.z, 0, side), Hs = clamp(R * hK + tilt, 0.1, R + 0.004) - 0.03 * dip * Math.min(1, depth / 0.15);
    const tongue = S.tongueAt(t, s), L = lipS + tongue;
    // the snow's own lengths: pillows a stride or less, thick and thin; where it stands out over the ice and where it
    // stands back from it (a ledge of bare ice); where it sags, having dripped
    const lobes = smooth(0.1, 0.46, noise1(tt * 1.55, 37));
    const T = (0.1 + 0.075 * noise1(tt * 0.23, 39) + 0.035 * lobes) * (1 - 0.3 * dip) + 0.03 * droop;      // 10 to 21 cm: it lies in drifts, thick for some strides and thin for others
    let ov = -0.04 + 0.09 * noise1(tt * 1.1, 47) + 0.034 * (noise1(tt * 3.3, 49) - 0.5) + 0.04 * heavy + 0.045 * droop - 0.4 * Math.min(depth, 0.12) * dip;
    ov -= f.notch;
    ov += (-(0.2 + 0.12 * noise1(tt * 2.1, 51)) - ov) * calved;
    const N0 = Math.min(L + ov, 0.2 + tongue), over = N0 - L;
    const out = smooth(0.006, 0.03, over);                       // 1 where the snow stands out over the ice's face
    let sag = out * (0.012 + 0.05 * Math.max(0, noise1(tt * 3.7, 113) - 0.3) / 0.7);
    sag = Math.max(sag, droop * out * Math.max(0, Hs - 0.085));  // a droop comes down the face to a hand above the water
    const belly = Hs + 0.004 - sag, crown = Hs + T, back = 1 - 0.78 * p.tight;
    O[0] = N0 - 0.06; U[0] = Hs - 0.014 - 0.4 * sag;
    O[1] = N0 - 0.014; U[1] = belly;
    O[2] = N0 + 0.003 + 0.012 * droop; U[2] = belly + 0.028 + 0.12 * sag;
    O[3] = N0 + 0.009 + 0.02 * droop; U[3] = Math.max(U[2] + 0.018, Hs + 0.42 * T - 0.25 * sag);
    O[4] = N0 - 0.02; U[4] = Hs + 0.8 * T;
    O[5] = N0 - 0.085; U[5] = crown;
    O[6] = N0 - 0.27; U[6] = crown - 0.008 - 0.012 * lobes;
    O[7] = Math.min(N0 - 0.5, -0.42); U[7] = 0;
    O[8] = -0.95; U[8] = 0;
    // behind the line the land's own snow lies under it: never below that before its end, and its back dives under
    const reach = 0.95 * back, landBack = land.snowHeight(p.x - p.nx * reach, p.z - p.nz * reach, reach, side);
    U[7] = landBack + (crown - landBack) * 0.45;
    for (let i = 4; i < NS - 1; i++) if (O[i] < 0) { O[i] *= back; U[i] = Math.max(U[i], land.snowHeight(p.x + p.nx * O[i], p.z + p.nz * O[i], -O[i], side) + 0.02 + 0.015 * (1 - smooth(0.4, 0.9, -O[i]))); }
    O[8] = -reach; U[8] = landBack - 0.035;
    if (info) { info.x = p.x; info.z = p.z; info.nx = p.nx; info.nz = p.nz; info.s = s; info.tt = tt; info.fade = fadeAt(s); info.dip = dip; info.depth = depth; info.over = over; info.N0 = N0; info.L = L; info.belly = belly; info.Hs = Hs; info.droop = droop; info.notch = f.notch; info.calved = calved; info.pl = pl0; }
    return info;
  };
  /** Write one ring of snow (positions and colours) at t into arrays, from index v (points). */
  const SO = new Float64Array(NS), SU = new Float64Array(NS), SI = {};
  const snowRing = (S, t, pos, colr, v) => {
    const q = snowSection(S, t, SO, SU, SI), dark = 0.55 * q.dip * Math.min(1, q.depth / 0.12) + 0.3 * smooth(0.02, 0.12, q.notch);
    for (let i = 0; i < NS; i++) {
      const o = SO[i] - (1 - q.fade) * PULL * smooth(-0.7, -0.1, SO[i]), j = (v + i) * 3;
      pos[j] = q.x + q.nx * o; pos[j + 1] = SU[i]; pos[j + 2] = q.z + q.nz * o;
      const c = tmpC.copy(i <= 1 ? FOOT : i === 2 ? LOW : PAPER); if (i <= 4) c.lerp(SNOW_SHADE, Math.min(1, dark * (i <= 2 ? 1 : 0.6)));
      colr[j] = c.r; colr[j + 1] = c.g; colr[j + 2] = c.b;
    }
    return q;
  };
  // ---- the far snow: the whole edge, a ring every 26 cm (13 where the edge turns sharply)
  const snow = { pos: [], col: [], t: [], idx: [] };
  for (const S of sides) {
    const base = snow.pos.length / 3, ts = [];
    for (let t = 0; t < S.total;) { ts.push(t); t += S.at(t, P1).tight > 0.2 ? 0.13 : 0.26; }
    ts.push(S.total);
    const pos = new Float32Array(ts.length * NS * 3), colr = new Float32Array(ts.length * NS * 3);
    ts.forEach((t, k) => { snowRing(S, t, pos, colr, k * NS); for (let i = 0; i < NS; i++) snow.t.push(t + S.offT); });
    for (let i = 0; i < pos.length; i++) { snow.pos.push(pos[i]); snow.col.push(colr[i]); }
    for (let k = 0; k < ts.length - 1; k++) for (let i = 0; i < NS - 1; i++) { const A = base + k * NS + i, B = base + (k + 1) * NS + i, Cc = B + 1, D = A + 1; if (S.flip) snow.idx.push(A, D, Cc, A, Cc, B); else snow.idx.push(A, B, Cc, A, Cc, D); }
  }
  // (the far snow is not drawn where the near window stands: uKmWin holds, for each side, the metres along it that the
  // window covers, as that side's own metres plus its offset)
  const uWin = { value: [new THREE.Vector2(-1, -1), new THREE.Vector2(-1, -1)] };
  const winCut = {
    uniforms: { uKmWin: uWin }, vertexPars: 'attribute float aT; varying float vKmT;', vertexLocal: 'vKmT = aT;',
    fragmentPars: 'uniform vec2 uKmWin[2]; varying float vKmT;',
    albedo: 'if ((vKmT > uKmWin[0].x && vKmT < uKmWin[0].y) || (vKmT > uKmWin[1].x && vKmT < uKmWin[1].y)) discard;',
  };
  const snowGeo = new THREE.BufferGeometry();
  snowGeo.setAttribute('position', new THREE.Float32BufferAttribute(snow.pos, 3)); snowGeo.setAttribute('color', new THREE.Float32BufferAttribute(snow.col, 3)); snowGeo.setAttribute('aT', new THREE.Float32BufferAttribute(snow.t, 1));
  snowGeo.setIndex(snow.idx); snowGeo.computeVertexNormals();
  const snowMat = (extra) => kit.gouache({ color: '#ffffff', vertexColors: true, brush: 0.35, steps: 4, extend: [centroidPaint, light.lift].concat(extra || []) });      // (the land's own snow, shared.mat.snowPaint, with its paint taken at the centroid)
  const snowMesh = new THREE.Mesh(snowGeo, snowMat(winCut));
  snowMesh.name = 'the shelf: its snow, far (winter)'; snowMesh.frustumCulled = false; winter(ctx.add(snowMesh));

  // ---- THE NEAR WINDOW: the snow's edge within 15 m of the boat, a ring every 5 cm, in chunks of 3 m that are made as
  // the boat comes up to them and given up behind it (ten to a side at the most; one chunk is 61 rings, made in a
  // fraction of a millisecond). The far snow is not drawn where the window stands.
  const CH = 3, NR = 61, SLOTS = 10, VPC = NR * NS, nearN = 2 * SLOTS * VPC;
  const nPos = new Float32Array(nearN * 3), nCol = new Float32Array(nearN * 3), nNor = new Float32Array(nearN * 3), nIdx = [];
  for (let sl = 0; sl < 2 * SLOTS; sl++) for (let k = 0; k < NR - 1; k++) for (let i = 0; i < NS - 1; i++) {
    const A = sl * VPC + k * NS + i, B = A + NS, Cc = B + 1, D = A + 1, flip = sides[sl < SLOTS ? 0 : 1].flip;
    if (flip) nIdx.push(A, D, Cc, A, Cc, B); else nIdx.push(A, B, Cc, A, Cc, D);
  }
  const nearGeo = new THREE.BufferGeometry();
  const aPos = new THREE.BufferAttribute(nPos, 3), aCol = new THREE.BufferAttribute(nCol, 3), aNor = new THREE.BufferAttribute(nNor, 3);
  for (const a of [aPos, aCol, aNor]) a.setUsage(THREE.DynamicDrawUsage);
  nearGeo.setAttribute('position', aPos); nearGeo.setAttribute('color', aCol); nearGeo.setAttribute('normal', aNor); nearGeo.setIndex(nIdx);
  const nearMesh = new THREE.Mesh(nearGeo, snowMat());
  nearMesh.name = 'the shelf: its snow, near the boat (winter)'; nearMesh.frustumCulled = false; winter(ctx.add(nearMesh));
  // one chunk: rings at t0 .. t0 + CH (and one beyond each end, for the slope along the edge), with smooth normals
  const tmpP = new Float32Array((NR + 2) * NS * 3), tmpK = new Float32Array((NR + 2) * NS * 3);
  const fillChunk = (S, slot, c) => {
    const t0 = c * CH, dt = CH / (NR - 1), v0 = (S.li * SLOTS + slot) * VPC, sgn = S.flip ? -1 : 1;
    for (let k = -1; k <= NR; k++) snowRing(S, clamp(t0 + k * dt, 0, S.total), tmpP, tmpK, (k + 1) * NS);
    for (let k = 0; k < NR; k++) for (let i = 0; i < NS; i++) {
      const a = ((k + 1) * NS + i) * 3, b = (k * NS + i) * 3, d = ((k + 2) * NS + i) * 3, lo = ((k + 1) * NS + Math.max(0, i - 1)) * 3, hi = ((k + 1) * NS + Math.min(NS - 1, i + 1)) * 3, j = (v0 + k * NS + i) * 3;
      nPos[j] = tmpP[a]; nPos[j + 1] = tmpP[a + 1]; nPos[j + 2] = tmpP[a + 2]; nCol[j] = tmpK[a]; nCol[j + 1] = tmpK[a + 1]; nCol[j + 2] = tmpK[a + 2];
      const ax = tmpP[d] - tmpP[b], ay = tmpP[d + 1] - tmpP[b + 1], az = tmpP[d + 2] - tmpP[b + 2], bx = tmpP[hi] - tmpP[lo], by = tmpP[hi + 1] - tmpP[lo + 1], bz = tmpP[hi + 2] - tmpP[lo + 2];
      let nx = (ay * bz - az * by) * sgn, ny = (az * bx - ax * bz) * sgn, nz = (ax * by - ay * bx) * sgn; const l = Math.hypot(nx, ny, nz) || 1;
      nNor[j] = nx / l; nNor[j + 1] = ny / l; nNor[j + 2] = nz / l;
    }
    for (const a of [aPos, aCol, aNor]) { a.addUpdateRange(v0 * 3, VPC * 3); a.needsUpdate = true; }
  };
  const hideChunk = (S, slot) => { const v0 = (S.li * SLOTS + slot) * VPC; nPos.fill(0, v0 * 3, (v0 + VPC) * 3); aPos.addUpdateRange(v0 * 3, VPC * 3); aPos.needsUpdate = true; };
  for (const S of sides) { S.slots = new Array(SLOTS).fill(-1); S.nChunks = Math.floor(S.total / CH); }
  // the boat along each side: the nearest station (searched from the last one), its metres along, how far off it is
  const nearest = (S, bx, bz, far) => {
    const st = S.st, d2 = (i) => (st[i].x - bx) * (st[i].x - bx) + (st[i].z - bz) * (st[i].z - bz);
    let i = S.iNear, best = d2(i);
    if (far) { for (let k = 0; k < st.length; k += 8) { const d = d2(k); if (d < best) { best = d; i = k; } } }
    for (let moved = true, guard = 0; moved && guard < 400; guard++) { moved = false; for (const k of [i - 1, i + 1, i - 6, i + 6]) if (k >= 0 && k < st.length) { const d = d2(k); if (d < best) { best = d; i = k; moved = true; } } }
    S.iNear = i; S.tNear = st[i].t; S.dNear = Math.sqrt(best);
  };
  let first = true, frame = 0;
  const NEAR = 13.5;
  const updateNear = () => {
    const b = ctx.boat; frame++;
    for (const S of sides) {
      nearest(S, b.x, b.z, first || frame % 90 === 0);
      // the chunks wanted: those whose middle is within NEAR metres of the boat along the edge, if the edge is that near at all
      const want = S.dNear < 16 ? [Math.max(0, Math.floor((S.tNear - NEAR) / CH + 0.5)), Math.min(S.nChunks - 1, Math.floor((S.tNear + NEAR) / CH - 0.5))] : [1, 0];
      let made = 0, lo = 1e9, hi = -1e9;
      for (let sl = 0; sl < SLOTS; sl++) { const c = S.slots[sl]; if (c >= 0 && (c < want[0] || c > want[1])) { S.slots[sl] = -1; hideChunk(S, sl); } }
      // (made outward from the boat, so that what stands is always one run; all at once the first time, then one a frame)
      const mid = Math.round(S.tNear / CH - 0.5), order = [];
      for (let c = want[0]; c <= want[1]; c++) order.push(c);
      order.sort((x, y) => Math.abs(x - mid) - Math.abs(y - mid));
      for (const c of order) {
        if (S.slots.includes(c)) continue;
        if (!first && made >= 1) break;
        const sl = S.slots.indexOf(-1); if (sl < 0) break;
        fillChunk(S, sl, c); S.slots[sl] = c; made++;
      }
      // the run that stands (chunks side by side from the one nearest the boat)
      const have = S.slots.filter((c) => c >= 0).sort((x, y) => x - y);
      if (have.length) {
        let k = have.indexOf(have.reduce((m, c) => (Math.abs(c - mid) < Math.abs(m - mid) ? c : m), have[0])), a = k, z = k;
        while (a > 0 && have[a - 1] === have[a] - 1) a--;
        while (z < have.length - 1 && have[z + 1] === have[z] + 1) z++;
        lo = have[a] * CH; hi = (have[z] + 1) * CH;
        // (a chunk that stands apart from the run would be drawn twice with the far snow: give it up)
        for (let sl = 0; sl < SLOTS; sl++) { const c = S.slots[sl]; if (c >= 0 && (c < have[a] || c > have[z])) { S.slots[sl] = -1; hideChunk(S, sl); } }
      }
      uWin.value[S.li].set(hi > lo ? lo + S.offT + 0.004 : -1, hi > lo ? hi + S.offT - 0.004 : -1);
    }
    first = false;
  };

  // a tongue stops the hull as the line does: one circle through its tip and its two ends
  for (const S of sides) for (const [a0, half, h] of S.tongues) { const q = S.st[Math.min(S.st.length - 1, Math.round(a0 / STEP))], R = (half * half * 0.72 + h * h) / (2 * h), o = 0.06 + h - R; ctx.addCollider({ x: q.x + q.nx * o, z: q.z + q.nz * o, r: Math.max(0.3, R - 0.1) }); }

  // ================================================================================================ what hangs from it
  /** The ice's own top edge at t (between two facets' rings): where it is, how high, how far the water is below. */
  const iceEdge = (S, t, o) => {
    const rings = S.rings; let a = 0, b = rings.length - 1;
    while (a < b) { const m = (a + b + 1) >> 1; if (rings[m].t <= t) a = m; else b = m - 1; }
    const r0 = rings[a], r1 = rings[Math.min(rings.length - 1, a + 1)];
    if (r0.joint || r1.joint || r1.t - r0.t < 0.02) return null;
    const u = clamp((t - r0.t) / (r1.t - r0.t), 0, 1), mx = (k) => r0[k] + (r1[k] - r0[k]) * u;
    o.x = mx('x'); o.z = mx('z'); o.nx = r0.nx; o.nz = r0.nz; o.lip = mx('lipAt'); o.H = mx('H'); o.yU = mx('yU'); o.und = mx('und'); o.fade = mx('fade'); o.pl = r0.pl; o.rimmed = r0.rimmed && r1.rimmed; o.rimOut = mx('rimOut');
    return o;
  };
  const HO = new Float64Array(NS), HU = new Float64Array(NS), HI = {}, IE = {};
  /**
   * Where an icicle (or a drop) hangs at t metres along a side: from the snow's own belly where it stands out over the
   * ice's face, else from the ice's top edge. Returns null in a crack, a notch's side or at the shelf's ends; else
   * { x, y, z, nx, nz, room (metres of air under it), eave (true: it hangs from the snow), pl (the plate), droop }.
   */
  const hang = (S, t, o = {}) => {
    const q = snowSection(S, t, HO, HU, HI);
    if (q.fade < 0.9 || q.dip > 0.35) return null;
    const e = iceEdge(S, t, IE); if (!e) return null;
    const floor = e.rimmed ? e.pl.rimH + 0.012 : 0.02;
    o.nx = q.nx; o.nz = q.nz; o.pl = q.pl; o.droop = q.droop; o.tt = q.tt; o.und = e.und; o.yU = e.yU; o.lip = e.lip; o.ex = e.x; o.ez = e.z; o.calved = q.calved;
    if (q.over > 0.01) { const out = HO[1] - 0.002; o.x = q.x + q.nx * out; o.z = q.z + q.nz * out; o.y = q.belly + 0.004; o.eave = true; }
    else { const out = e.lip + 0.006; o.x = e.x + e.nx * out; o.z = e.z + e.nz * out; o.y = e.H - 0.01; o.eave = false; }
    o.room = o.y - floor;
    return o;
  };

  const api = {
    ice: iceMesh, snow: snowMesh, near: nearMesh, sides, lumps, hang,
    stations: sides.map((S) => S.st), slabs: sides.map((S) => S.plates), tongues: sides.map((S) => S.tongues), features: sides.map((S) => S.feats),
    update: updateNear, nearest,
    counts: { iceRings: sides.reduce((n, S) => n + S.rings.length, 0), plates: sides.reduce((n, S) => n + S.plates.length, 0), kinds: sides.flatMap((S) => S.plates).reduce((o, q) => { o[q.kind] = (o[q.kind] || 0) + 1; return o; }, {}),
      metres: Math.round(sides.reduce((n, S) => n + S.total, 0)), iceTriangles: ice.idx.length / 3, farSnowTriangles: snow.idx.length / 3, nearSnowTriangles: nIdx.length / 3, tongues: sides.reduce((n, S) => n + S.tongues.length, 0), lumps: lumps.length, notchesAndDroops: sides.reduce((n, S) => n + S.feats.length, 0) },
  };
  return api;
}

// ==================================================================================================== icicles
// Page: "600 in all, 24 triangles each": the comb of 5 to 20 cm under the shelf's lip, and 10 to 30 cm in the river
// banks' undercut. A comb of 600 along 516 m of shelf is one in most metres; a comb is twenty to forty a metre for a
// stride and none for the next. So they are MANY (every one has its place along the edge, made once) and FEW ARE
// DRAWN: each model keeps its icicles sorted along each side, the long ones apart from the short, and a pool of
// instances is filled with those near the boat (the long ones within 40 m, the rest within 18). One draw call a model.
export async function buildIcicles(ctx, plan, shared, K, shelf) {
  const { kit } = ctx, { DIR, smooth, clamp, noise1, centroidPaint, winter, hairy, uHair } = K;
  const F = shared.frame, rnd = ctx.rng(4409), KEYS = ['A', 'B', 'C', 'D'];
  // lists[key][run][tier]: run 0, 1 = the shelf's two sides (sorted by metres along), run 2 = the river's banks (by the page's s)
  const lists = {}; for (const k of KEYS) lists[k] = [[[], []], [[], []], [[], []]];
  const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), e3 = new THREE.Euler(), p3 = new THREE.Vector3(), s3 = new THREE.Vector3();
  const put = (run, at, x, y, z, len, k, far) => {
    const v = rnd(), key = len > 0.1 && v < 0.2 ? 'D' : v < 0.5 ? 'A' : v < 0.8 ? 'B' : 'C', thick = (0.75 + 0.7 * len / 0.2) * (0.8 + 0.45 * rnd()) * k;
    m4.compose(p3.set(x, y, z), q4.setFromEuler(e3.set((rnd() - 0.5) * 0.09, rnd() * 6.283, (rnd() - 0.5) * 0.09, 'YXZ')), s3.set(thick, len / 0.1, thick));
    lists[key][run][far ? 0 : 1].push({ at, m: m4.toArray() });
  };
  let onEaves = 0, onLip = 0, under = 0, onBanks = 0;
  if (shelf) {
    const H = {};
    for (const S of shelf.sides) {
      for (let t = 0.3; t < S.total - 0.3;) {
        const h = shelf.hang(S, t, H);
        if (!h || h.pl.comb <= 0) { t += 0.06; continue; }
        // a comb is thick for a stride and gone for the next; where the snow has drooped over the face only its tip drips
        const tt = h.tt, run = smooth(0.34, 0.6, noise1(tt * 1.7, 61) * 0.7 + noise1(tt * 5.3, 67) * 0.3), dens = h.pl.comb * run * (h.eave ? 1 : 0.75) * (1 - 0.8 * h.droop) * (1 - 0.6 * h.calved);
        if (dens < 1.5) { t += 0.05; continue; }
        // longest where the comb is thick, a few long ones among many short; a curtain here and there (all long); none reaches the water
        const curtain = smooth(0.7, 0.85, noise1(tt * 0.9, 69)), most = Math.min(0.24, h.room - 0.012) * (0.55 + 0.45 * h.pl.grow) * (0.6 + 0.4 * run);
        const len = 0.025 + Math.max(0, most - 0.025) * Math.pow(rnd(), 1.35 - 0.95 * curtain);
        if (len >= 0.03 && h.room > 0.045) {
          const j = (rnd() - 0.5) * 0.012;
          put(S.li, t, h.x - h.nx * (0.002 + 0.006 * rnd()) + h.nz * j, h.y, h.z - h.nz * (0.002 + 0.006 * rnd()) - h.nx * j, len, 1, len > 0.085 || rnd() < 0.12);
          if (h.eave) onEaves++; else onLip++;
        }
        // ... and a short one now and then under the face's own lower lip, in the notch the water has eaten
        if (h.und > 0.05 && h.yU > 0.045 && rnd() < 0.25) { const o = h.lip - 0.012 - 0.02 * rnd(); put(S.li, t, h.ex + h.nx * o, h.yU + 0.003, h.ez + h.nz * o, Math.min(h.yU - 0.016, 0.02 + 0.03 * rnd()), 0.8, false); under++; }
        t += (0.45 + 1.1 * rnd()) / dens;
      }
    }
  }
  // the river banks' undercut: under the snow's lip, which overhangs the water a foot (set.js: the land's rim on the
  // river). In runs, as on the shelf: a comb for a stride or two, a few long among many short, then none
  const B = plan.bank;
  for (const side of [-1, 1]) for (let s = B.from + 1.5; s < B.to - 5.5;) {
    const run = smooth(0.4, 0.66, noise1(s * 0.8 + side * 40, 81) * 0.65 + noise1(s * 2.9 + side * 9, 83) * 0.35);
    if (run < 0.05) { s += 0.1; continue; }
    const lipOut = 0.24 + 0.07 * rnd(), p = F.at(s, side * (plan.band(s) - lipOut)), bank = smooth(-62.5, -53, p.z), y = -0.35 + bank * 0.95 + 0.012;
    if (bank >= 0.9) { const len = 0.06 + 0.26 * run * Math.pow(rnd(), 1.5); put(2, s, p.x, y, p.z, len, 1.25, len > 0.12 || rnd() < 0.2); onBanks++; }
    s += (0.5 + 1.0 * rnd()) / (5 + 13 * run);
  }
  // never thinner than a pixel and a third at its root (from mid-road a comb is a row of fine ticks, as the key paints it)
  const ext = {
    uniforms: { uKmHair: uHair }, vertexPars: 'uniform vec2 uKmHair;',
    vertexWorld: /* glsl */`{
      vec3 kmAx = (modelMatrix * instanceMatrix * vec4(0.0, position.y, 0.0, 1.0)).xyz;
      vec3 kmRad = wp.xyz - kmAx; float kmR = length(kmRad);
      float kmNeed = 0.7 * uKmHair.y * uKmHair.x * length(wp.xyz - uCameraPos) * clamp(1.0 + position.y * 8.5, 0.0, 1.0);
      if (kmR > 1e-6) wp.xyz = kmAx + kmRad * max(1.0, kmNeed / kmR);
    }`,
  };
  const CAP = 1800, sets = [];
  for (const key of KEYS) {
    const packed = lists[key].map((run) => run.map((tier) => { tier.sort((a, b) => a.at - b.at); const at = new Float32Array(tier.length), m = new Float32Array(tier.length * 16); tier.forEach((o, i) => { at[i] = o.at; m.set(o.m, i * 16); }); return { at, m, n: tier.length }; }));
    const pool = await kit.models(DIR + `comb_icicle_${key}.glb`, new Array(CAP).fill({ position: [0, -50, 0] }), { crisp: true, brush: 0.15, extend: [centroidPaint, ext] });
    pool.group.name = `comb_icicle_${key}: a pool of ${CAP} for ${packed.reduce((n, run) => n + run[0].n + run[1].n, 0)} (winter)`; winter(pool.group);
    for (const mesh of pool.meshes) { mesh.frustumCulled = false; mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); mesh.count = 0; hairy(mesh); }
    sets.push({ key, packed, pool });
  }
  const lower = (a, v) => { let lo = 0, hi = a.length; while (lo < hi) { const m = (lo + hi) >> 1; if (a[m] < v) lo = m + 1; else hi = m; } return lo; };
  const last = [-1e9, -1e9, -1e9], REACH = [40, 18];
  const update = () => {
    const here = shared.here, at = [shelf ? shelf.sides[0].tNear : 0, shelf ? shelf.sides[1].tNear : 0, here.s];
    const off = [shelf ? shelf.sides[0].dNear : 1e9, shelf ? shelf.sides[1].dNear : 1e9, here.s < B.to + 30 ? 0 : 1e9];
    if (Math.abs(at[0] - last[0]) < 1.5 && Math.abs(at[1] - last[1]) < 1.5 && Math.abs(at[2] - last[2]) < 1.5) return;
    last[0] = at[0]; last[1] = at[1]; last[2] = at[2];
    for (const set of sets) {
      let n = 0; const arr = set.pool.meshes[0].instanceMatrix.array;
      for (let run = 0; run < 3; run++) for (let tier = 0; tier < 2; tier++) {
        const reach = REACH[tier] + 2 - off[run] * 0.6; if (reach <= 0) continue;
        const pk = set.packed[run][tier], lo = lower(pk.at, at[run] - reach), hi = Math.min(lower(pk.at, at[run] + reach), lo + CAP - n);
        if (hi > lo) { arr.set(pk.m.subarray(lo * 16, hi * 16), n * 16); n += hi - lo; }
      }
      for (const mesh of set.pool.meshes) { if (mesh.instanceMatrix.array !== arr) mesh.instanceMatrix.array.set(arr.subarray(0, n * 16)); mesh.count = n; mesh.instanceMatrix.clearUpdateRanges(); mesh.instanceMatrix.addUpdateRange(0, Math.max(16, n * 16)); mesh.instanceMatrix.needsUpdate = true; }
      set.drawn = n;
    }
  };
  const total = sets.reduce((n, s) => n + s.packed.reduce((q, run) => q + run[0].n + run[1].n, 0), 0);
  return { meshes: sets.map((s) => s.pool), sets, onEaves, onLip, under, onBanks, total, update, drawn: () => sets.reduce((n, s) => n + (s.drawn || 0), 0) };
}
