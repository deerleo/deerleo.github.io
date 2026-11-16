// The town below: the town's plan, grown from plan.js. Plain data (no three.js objects): where the ground lies, every
// house of the 156, every window, every lamp, the far pools of light of the lower town. set.js builds the bed and the
// glow map from it, kit.js the houses and windows, and the people who model the kit place their models at these
// same places (a house record says which model it stands for).
//
//   const town = layout(ctx, plan);
//   town.ground(s, d)     height of the lake bed or the land there (true depth)
//   town.houses           [{ model, row, front, s, d, x, z, yaw, w, dep, floor, eaves, ridge, tone, roofTone, awash }]
//                         yaw = rotation.y; the house's own X runs along its ridge, its Z across (width w, depth dep).
//                         rows: head0, head1 (across the route at the entrance), L1 (the street's left row), RB (right
//                         bank, roofs awash), LB (left bank, roofs awash), LB2, R2, CL, CR (round the church), terrace
//                         (the half-lit mansards of the square), SQ (the square's far side), back (the lower town)
//   town.upper            the upper town on the hill and in its shallows (upper_house_1 .. _4), same shape of record
//   town.windows          [{ x, y, z, yaw, pitch, w, h, tone, rnd, stay, s }]   a quad whose +Z looks out (pitch tips it back: skylights)
//   town.lamps            [{ x, y, z, s, d, foot, kind }]   y = the head; kind: 'row' (the lamp row and the two at the steps), 'street', 'steps', 'stepsDark'
//   town.pools            [{ x, z, r, power, jade, s }]  light that is in the glow map only (far streets, the glass ridge, the nave, the hour ring)
//   town.stacks, .dormers, .gables, .copings, .arcade      what stands on and beside the roofs (see below)
//   town.xz(s, d) -> [x, z];  town.sd(x, z) -> { s, d };  town.hw(s);  town.along(s) = rotation.y that turns +X down the route
import { lerp, smooth, table } from './plan.js';

const cache = new WeakMap();

export function layout(ctx, plan) {
  if (cache.has(ctx.path)) return cache.get(ctx.path);
  const path = ctx.path, rnd = ctx.rng(1907), _a = {}, _l = {};
  const clampS = (s) => Math.min(path.length, Math.max(0, s));
  const xz = (s, d) => { const p = path.at(clampS(s), _a), over = s < 0 ? s : s > path.length ? s - path.length : 0; return [p.x + p.rx * d + p.tx * over, p.z + p.rz * d + p.tz * over]; };
  const sd = (x, z) => { const l = path.locate(x, z, null, _l); return { s: l.s, d: l.d }; };
  const hw = (s) => path.at(clampS(s), _a).halfWidth;
  const along = (s) => { const p = path.at(clampS(s), _a); return Math.atan2(-p.tz, p.tx); };
  const F = plan.floorAt, T = plan.theatre, SQ = plan.square, H = plan.hall, CH = plan.church, ST = plan.street;

  // ---------------------------------------------------------------------------------------------- the ground
  // Where the uphill bank (the right edge of the street, the church yard, the square) steps up to its terrace.
  const rightLine = (s) => (s < 119 ? Math.max(11.5, hw(s) - 0.5) : s < 150 ? hw(s) + 0.5 : s < 206 ? 30 : lerp(30, 21, smooth(206, 222, s)));
  const terrace = (s) => table([[0, -7], [112, -7], [124, -9], [146, -10], [152, -14], [202, -14], [212, -8], [226, -3]], s);
  const shore = (s) => table([[-80, 150], [0, 125], [30, 92], [60, 68], [100, 55], [150, 50], [200, 50], [224, 40], [240, 30], [300, 30]], s);   // d of the right waterline
  const hill = (u) => (u < 40 ? 0.30 * u : u < 110 ? 12 + 0.16 * (u - 40) : 23.2 + 0.06 * (u - 110));     // height u metres inland of the waterline
  // the far shore: beyond it (down the route) the land stands 1.2 m clear. It runs from the theatre's front away to the left.
  const farShore = (d) => (d > -18 ? 225.5 : table([[-260, 268], [-160, 246], [-80, 233], [-18, 225.5]], d));
  function ground(s, d) {
    // the portico and the foyer: the stylobate, a metre down
    if (s > 224 && Math.abs(d) < 18.5) return -1;
    // the poplar road and the theatre steps climb only between the poplars; either side of them the square's floor runs on to the far shore
    const f = s > 204 && Math.abs(d) > 15 ? lerp(F(Math.max(0, s)), SQ.floor, smooth(15, 16.5, Math.abs(d))) : F(Math.max(0, s));
    let y;
    if (d >= 0) {
      const rl = rightLine(s), tu = Math.max(f, terrace(s)), ds = Math.max(rl + 6, shore(s));
      if (d < rl - 0.5) y = f;
      else if (d < rl + 0.5) y = lerp(f, tu, d - rl + 0.5);
      else if (d < ds) y = lerp(tu, 0, Math.pow((d - rl - 0.5) / (ds - rl - 0.5), 1.4));
      else y = hill(d - ds);
    } else {
      const u = -d, flat = s > 148 && s < 226 ? 44 : 13;                     // the square and the hall stand on one floor
      const low = Math.min(f - 4, -19);
      y = lerp(f, low, smooth(flat, flat + 46, u));
      y = lerp(y, -23, smooth(70, 130, u));
    }
    // the street of steps comes down the hill into the lake in a cutting of its own (s 182 to 190, from d +62 to +40)
    if (d > SQ.steps.d0 - 2 && d < SQ.steps.d1 + 2) { const sm = (SQ.steps.s0 + SQ.steps.s1) / 2, k = (1 - smooth(3.2, 5.5, Math.abs(s - sm))) * smooth(SQ.steps.d0 - 2, SQ.steps.d0, d) * (1 - smooth(SQ.steps.d1, SQ.steps.d1 + 2, d)); if (k > 0) y = lerp(y, Math.min(y, 2.9 - (SQ.steps.d1 - d) * 0.582 - 0.75), k); }
    // the far shore beyond the theatre, and the land behind it
    const fs = farShore(d);
    if (s > fs - 1.5 && Math.abs(d) >= 18.5) { const land = 1.2 + Math.min(6, (s - fs) * 0.05) + (d > 0 ? hill(Math.max(0, d - 30)) * smooth(0, 20, s - fs) : 0); y = Math.max(y, lerp(y, land, smooth(fs - 1.5, fs + 0.5, s))); }
    return y;
  }

  // ---------------------------------------------------------------------------------------------- houses and their windows
  const houses = [], upper = [], windows = [], lamps = [], pools = [], stacks = [], dormers = [], gables = [], copings = [], arcade = [];
  const tones = plan.windowTones;
  const pickTone = () => { let r = rnd(), i = 0; for (; i < tones.length - 1; i++) { if (r < tones[i].share) break; r -= tones[i].share; } return i; };
  const win = (x, y, z, yaw, w, h, s, o = {}) => windows.push({ x, y, z, yaw, pitch: o.pitch || 0, w, h, tone: o.tone ?? pickTone(), rnd: o.rnd ?? rnd(), stay: o.stay ?? (rnd() < plan.wake.stay ? 1 : 0), s });
  const MODELS = ['house_a', 'house_b', 'house_c', 'house_d', 'house_e', 'house_f', 'house_g', 'house_h'], BACK = ['back_house_1', 'back_house_2', 'back_house_3', 'back_house_4'], UPPER = ['upper_house_1', 'upper_house_2', 'upper_house_3', 'upper_house_4'];
  const FRONT_ROWS = new Set(['head1', 'L1', 'RB', 'LB', 'R2', 'CR', 'terrace', 'SQ']);
  const STOREY = 2.7;
  /**
   * One house. cs, cd: its centre; w along its ridge, dep across; turn: 0 = ridge down the route, 1 = ridge across it.
   * faces: +1 = its +Z side is the street front, -1 = its -Z side, 0 = both. lit: share of its windows that are lit.
   */
  function house(o) {
    const [x, z] = xz(o.cs, o.cd), yaw = along(o.cs) + (o.turn ? Math.PI / 2 : 0), isUpper = o.row === 'upper', front = FRONT_ROWS.has(o.row);
    const h = { model: o.model || (isUpper ? UPPER[Math.floor(rnd() * 4)] : front ? MODELS[Math.floor(rnd() * 8)] : BACK[Math.floor(rnd() * 4)]), row: o.row, front, s: o.cs, d: o.cd, x, z, yaw,
      w: o.w, dep: o.dep, floor: o.floor, eaves: o.eaves, ridge: o.ridge, tone: Math.floor(rnd() * 3), roofTone: rnd() < 0.6 ? 0 : 1, awash: o.ridge > -0.1, roof: o.roof || 'gable' };
    (isUpper ? upper : houses).push(h);
    const cos = Math.cos(yaw), sin = Math.sin(yaw), W = (lx, lz) => [x + lx * cos + lz * sin, z - lx * sin + lz * cos];
    const lit = o.lit ?? 0.7, back = o.blindBack ? 0 : 0.5;
    const litZ = o.faces >= 0 ? lit : lit * back, litNeg = o.faces <= 0 ? lit : lit * back;
    const storeys = Math.max(1, Math.floor((o.eaves - o.floor - 0.2) / STOREY)), bays = Math.max(1, Math.floor((o.w - 0.8) / 2.0));
    for (let st = 0; st < storeys; st++) {
      const y = o.floor + 1.65 + st * STOREY;
      for (let b = 0; b < bays; b++) {
        const lx = (b - (bays - 1) / 2) * ((o.w - 0.8) / bays);
        if (rnd() < litZ) { const p = W(lx, o.dep / 2 + 0.06); win(p[0], y, p[1], yaw, 0.95, 1.5, o.cs); }
        if (rnd() < litNeg) { const p = W(lx, -o.dep / 2 - 0.06); win(p[0], y, p[1], yaw + Math.PI, 0.95, 1.5, o.cs); }
      }
      for (const e of [1, -1]) for (const lz of [-o.dep / 4, o.dep / 4]) if (o.dep > 5 && rnd() < lit * 0.45) { const p = W(e * (o.w / 2 + 0.06), lz); win(p[0], y, p[1], yaw + e * Math.PI / 2, 0.9, 1.4, o.cs); }
    }
    // roof lights: skylights lying in the slope (the fifth facade is what the rider sees most), and on the front row a dormer or two
    if (!isUpper && o.ridge < 0.0) {
      const rise = o.ridge - o.eaves, half = o.dep / 2 + 0.35, phi = Math.atan2(rise, half), n = front ? 2 + Math.floor(rnd() * 2) : (rnd() < 0.75 ? 1 : 0) + (rnd() < 0.3 ? 1 : 0);
      for (let i = 0; i < n; i++) {
        const side = rnd() < 0.5 ? 1 : -1, t = 0.3 + rnd() * 0.4, lx = (rnd() - 0.5) * (o.w - 2.2), lz = side * half * (1 - t), y = o.eaves + rise * t;
        const p = W(lx, lz + side * 0.07 * Math.sin(phi));
        if (front && rnd() < 0.45) {                                         // a dormer: a small gabled box standing on the slope, its lit face looking out
          const q = W(lx, lz + side * 0.55);
          dormers.push({ x: p[0], z: p[1], y: y - 0.25, yaw: yaw + (side > 0 ? 0 : Math.PI), w: 1.3, h: 1.25, dep: 1.3, s: o.cs });
          win(q[0], y + 0.35, q[1], yaw + (side > 0 ? 0 : Math.PI), 0.8, 0.85, o.cs);
        } else win(p[0], y + 0.09 * Math.cos(phi), p[1], yaw + (side > 0 ? 0 : Math.PI), 0.75, 1.05, o.cs, { pitch: -(Math.PI / 2 - phi) });
      }
    }
    return h;
  }
  /** A row of houses along the route: front wall on the line d = front(s), the houses reaching `side` * depth behind it. */
  function row(o) {
    let s = o.s0, n = 0; const made = [];
    while (s < o.s1 - (o.wMin * 0.6) && (!o.count || n < o.count)) {
      const w = Math.min(o.wMin + rnd() * (o.wMax - o.wMin), o.s1 - s), cs = s + w / 2;
      if (!o.skip || !o.skip(cs)) {
        const fr = o.front(cs), cd = fr + o.side * o.depth / 2, floor = o.floor(cs, cd), ridge = o.ridge(cs, cd), eaves = o.eaves ? o.eaves(cs, ridge, floor) : ridge - 2.4;
        made.push(house({ row: o.row, model: o.model, cs, cd, w: w - (o.gap ?? 0.3), dep: o.depth, floor, eaves: Math.max(eaves, floor + 2.6), ridge: Math.max(ridge, floor + 4.2), faces: -o.side, lit: o.lit, blindBack: o.blindBack }));
        n++;
      }
      s += w;
    }
    return made;
  }
  /** A chimney stack on a house's ridge, lx along it from its middle; top: height of the stack's top; pots: how many. */
  const stackOn = (h, lx, top, pots, o = {}) => { const c = Math.cos(h.yaw), sn = Math.sin(h.yaw), lz = o.lz || 0; const s = { x: h.x + lx * c + lz * sn, z: h.z - lx * sn + lz * c, yaw: h.yaw, y0: Math.min(h.ridge - 1.6, top - 3.0), y1: top, w: 0.6 + 0.25 * pots, dep: 0.62, pots, s: h.s, d: h.d, ...o }; stacks.push(s); return s; };

  // The head of the street: two terraces lying ACROSS the route, their roofs brushing the keel. The route passes over
  // them before the street opens at s 26.
  for (const [cs, ridge, name] of [[2, -1.3, 'head0'], [21, -1.0, 'head1']]) for (let k = -2; k <= 2; k++) {
    const h = house({ row: name, cs, cd: k * 8.8 + (cs === 2 ? 3 : -1), w: 8.6, dep: 9, turn: 1, floor: -9, eaves: -3.9, ridge, faces: 0, lit: 0.75 });
    stackOn(h, (k % 2 ? 2.6 : -2.4), ridge + 0.55, 2);                        // chimney pots 0.3 m under the surface
  }
  // The first windows: three dormers on the up-route slope of the second terrace, 1.25 to 1.4 m under the surface. They
  // stand beside the centre line, not on it (the boat's own bow hides what lies straight ahead and below), so they pass
  // at arm's length on either hand; their lit faces look back up the route at the rider.
  for (const [dd, top] of [[-3.7, -1.25], [4.4, -1.3], [-11.5, -1.35]]) {
    const s = 17.6, [x, z] = xz(s, dd), yaw = along(s) - Math.PI / 2;
    dormers.push({ x, z, y: top - 1.25, yaw, w: 1.5, h: 1.25, dep: 1.7, s, first: true });
    win(x + 0.9 * Math.sin(yaw), top - 0.7, z + 0.9 * Math.cos(yaw), yaw, 1.0, 0.9, s, { tone: 0, rnd: 0.05, stay: 1 });
  }

  // The street's left row (L1): fronts behind the raised walk, ridges 1 m under the keel at first, sinking with the street.
  for (const h of row({ row: 'L1', s0: 27, s1: 118, wMin: 6.2, wMax: 8.6, front: () => ST.walk.d0, side: -1, depth: 5.5, floor: (s) => F(s), ridge: (s) => plan.ridgeAt(s), eaves: (s, r) => r - 2.2, lit: 0.85 }))
    stackOn(h, (rnd() - 0.5) * (h.w - 2), h.ridge + 0.7, 1 + Math.floor(rnd() * 2));
  // The right bank (RB): nine houses beyond the leat on the uphill side, their roofs standing 0.3 to 1.5 m clear (roof_awash).
  const rbRidge = (s) => Math.max(15, hw(s) + 3.6);
  { let i = 0; const clear = [0.6, 1.1, 0.4, 1.5, 0.9, 0.3, 1.2, 0.7, 1.0];
    const rb = row({ row: 'RB', s0: 30, s1: 119.5, wMin: 9.4, wMax: 10.2, count: 9, front: (s) => rbRidge(s) - 4, side: 1, depth: 8, floor: (s) => F(s) + 0.3, ridge: () => clear[i++ % 9], eaves: (s, r) => r - 2.7, lit: 0.9, blindBack: true });
    // seven stacks, 1.0 to 2.5 m clear of the water, two to four pots each; the one at s 62 is the cormorant's
    const tall = [1.6, 2.5, 2.3, 2.1, 1.3, 1.8, 1.0], on = [0, 1, 3, 4, 5, 6, 8];
    on.forEach((k, j) => { const h = rb[k]; if (h) stackOn(h, j === 2 ? 62 - h.s : (j % 2 ? 3.4 : -3.2), tall[j], 2 + (j % 3), { clear: true, perch: j === 2, lz: j === 2 ? -0.5 : 0 }); }); }
  // the skylight propped open 0.6 m under water at s 90 on the right bank's roof, lit (the frame is in kit.js)
  { const s = 90, d = rbRidge(s) - 3.2, [x, z] = xz(s, d); win(x, -0.66, z, along(s) + Math.PI, 0.95, 0.8, s, { pitch: -1.0, tone: 0, rnd: 0.4, stay: 1 }); }
  // The left bank (LB): six taller houses behind L1, their ridges 0.2 to 0.8 m clear as far as s 76; then they go under.
  const lbRidge = (s) => -Math.max(16.5, hw(s) + 3.6);
  { let i = 0; const clear = [0.5, 0.2, 0.8, 0.4, 0.6, 0.3];
    row({ row: 'LB', s0: 30.5, s1: 76.5, wMin: 7.2, wMax: 8.2, count: 6, front: (s) => lbRidge(s) + 3.5, side: -1, depth: 7, floor: (s) => F(s) - 1.5, ridge: () => clear[i++ % 6], eaves: (s, r) => r - 2.5, lit: 0.75 });
    const lb2 = row({ row: 'LB2', s0: 77, s1: 118, wMin: 7.5, wMax: 9.5, front: (s) => lbRidge(s) + 3.5, side: -1, depth: 7, floor: (s) => F(s) - 1.5, ridge: (s) => 0.0 - (s - 76) * 0.13, eaves: (s, r) => r - 2.5, lit: 0.75 });
    // what still reaches the surface on the left once the roofs have gone under: a dovecote cupola (s 88) and a stack with an arrow vane (s 102)
    const near = (s) => lb2.reduce((a, b) => (Math.abs(b.s - s) < Math.abs(a.s - s) ? b : a));
    { const h = near(88); stackOn(h, 88 - h.s, 1.6, 0, { clear: true, cupola: true, w: 1.5, dep: 1.5, lz: 3.0 }); }
    { const h = near(102); stackOn(h, 102 - h.s, 1.5, 2, { clear: true, vane: true, lz: 3.0 }); } }
  // Three gables with attic windows on the left bank, and the fourth of the kit on the right: each a cross wing whose
  // gable looks at the channel, its attic window crossed by the waterline. The one at s 58 is THE half-lit gable.
  for (const [s, d, apex, side] of [[44, -14, 1.3, -1], [58, -14, 1.5, -1], [70, -14.4, 1.2, -1], [109, 0, 1.4, 1]]) {
    const dd = side > 0 ? rbRidge(s) - 4.4 : d, [x, z] = xz(s, dd), yaw = along(s) + (side > 0 ? Math.PI : 0);      // its lit face (+Z of the quad) looks at the channel
    gables.push({ x, z, s, d: dd, side, apex, w: 5.6, dep: 3.4, eaves: apex - 2.4, floor: -6, yawFace: along(s) + (side > 0 ? Math.PI : 0), halfLit: s === 58 });
    const [wx, wz] = xz(s, dd - side * 0.07);
    win(wx, 0.0, wz, yaw, 1.1, 1.5, s, { tone: 0, rnd: 0.3, stay: s === 58 ? 1 : 0 });
  }
  // Houses directly below on the right, where the channel has widened past the leat (R2).
  for (const h of row({ row: 'R2', s0: 100, s1: 119, wMin: 6.5, wMax: 8.5, front: () => 12.2, side: 1, depth: 5.0, floor: (s) => F(s), ridge: (s) => plan.ridgeAt(s), eaves: (s, r) => r - 2.2, lit: 0.85, skip: (s) => hw(s) - 4.5 < 17.4 })) stackOn(h, 1.5, h.ridge + 0.7, 2);
  // Round the church yard: a row beyond each edge, ridges under water (the edge itself is marked by copings).
  row({ row: 'CL', s0: 121, s1: 148, wMin: 7, wMax: 9, front: (s) => -(hw(s) + 2.5), side: -1, depth: 7, floor: (s) => ground(s, -(hw(s) + 6)), ridge: (s) => -2.2 - (s - 121) * 0.12, eaves: (s, r) => r - 2.4, lit: 0.8 });
  { const cr = row({ row: 'CR', s0: 121, s1: 150, wMin: 7.5, wMax: 9.5, front: (s) => hw(s) + 1.2, side: 1, depth: 7.5, floor: (s) => terrace(s), ridge: (s) => -0.9 - (s - 121) * 0.03, eaves: (s, r) => r - 2.6, lit: 0.85, blindBack: true });
    if (cr[1]) stackOn(cr[1], 1.2, 1.4, 3, { clear: true }); }
  // The uphill terrace of the square: five four-storey houses standing in the lake to their attic sills (mansard_1 .. _5).
  // Their wall tops are 0.9 m under water; the mansards above carry nine windows that the waterline cuts in half.
  { const te = SQ.terrace, n = te.houses, len = (te.s1 - te.s0) / n;
    for (let i = 0; i < n; i++) { const h = house({ row: 'terrace', model: 'mansard_' + (i + 1), cs: te.s0 + (i + 0.5) * len, cd: (te.d0 + te.d1) / 2, w: len - 0.25, dep: te.d1 - te.d0, floor: te.floor, eaves: -0.9, ridge: te.roofTop, faces: -1, lit: 0.9, blindBack: true, roof: 'mansard' }); h.awash = true; }
    for (let i = 0; i < te.windows; i++) { const s = te.s0 + (i + 0.5) * (te.s1 - te.s0) / te.windows, [x, z] = xz(s, te.d0 - 0.07); win(x, 0, z, along(s) + Math.PI, 1.15, te.sillTop - te.sill, s, { tone: i % 4 === 2 ? 3 : 0, rnd: 0.2 + 0.05 * i, stay: i % 3 === 0 ? 1 : 0 }); }
    const [sx, sz] = xz(204, 32); stacks.push({ x: sx, z: sz, yaw: along(204), y0: -3, y1: 2.2, w: 1.1, dep: 0.62, pots: 3, s: 204, d: 32, clear: true, perch: true }); }
  // The square's far side: houses on the square's own floor beyond each line of poplars, four storeys, roofs under water.
  for (const side of [-1, 1]) row({ row: 'SQ', s0: 205, s1: 224, wMin: 8.5, wMax: 9.6, front: (s) => side * (hw(s) + 1.6), side, depth: 8, floor: () => SQ.floor, ridge: () => -5.2 - rnd() * 1.5, eaves: (s, r) => r - 2.8, lit: 0.85 });

  // The back rows: the lower town to the left, lane after lane down the slope; the houses behind the market hall; and
  // the uphill side under the water behind the right bank.
  const lane = (s) => lbRidge(s) - 3.5;                                      // the back wall of the left bank row
  for (let k = 0; k < 5; k++) {
    const off = 4.5 + Math.floor(k / 2) * 21 + (k % 2 ? 9.5 : 0), side = k % 2 ? 1 : -1;       // rows back to back in pairs, a lane between pairs
    row({ row: 'back', s0: 4 + k * 3, s1: 147 - k * 5, wMin: 7, wMax: 9.5, gap: 0.5, front: (s) => lane(s) - off - (side > 0 ? 7 : 0), side, depth: 7, floor: (s, cd) => ground(s, cd), ridge: (s, cd) => Math.min(-2.5, ground(s, cd) + 8.4 + (k % 2) * 1.2 + rnd() * 1.2), eaves: (s, r) => r - 2.4, lit: 0.7 });
  }
  for (let k = 0; k < 3; k++) row({ row: 'back', s0: 152 + k * 4, s1: 218 - k * 8, wMin: 7.5, wMax: 10, gap: 0.5, front: () => -(H.width / 2 - H.d + 6 + k * 12), side: -1, depth: 7.5, floor: (s, cd) => ground(s, cd), ridge: (s, cd) => ground(s, cd) + 9.5 + rnd(), eaves: (s, r) => r - 2.5, lit: 0.65 });
  row({ row: 'back', s0: 4, s1: 28, wMin: 7, wMax: 9, front: (s) => 11.5, side: 1, depth: 7, floor: (s, cd) => ground(s, cd), ridge: () => -1.4 - rnd() * 0.6, eaves: (s, r) => r - 2.3, lit: 0.7 });
  row({ row: 'back', s0: 4, s1: 30, wMin: 7, wMax: 9, front: (s) => -13.5, side: -1, depth: 7, floor: (s, cd) => ground(s, cd), ridge: () => -1.5 - rnd() * 0.6, eaves: (s, r) => r - 2.3, lit: 0.7 });

  // The upper town: forty dark houses climbing the hill on the right, the lowest of them standing in the water (their
  // windows are lit only below the waterline, like every window here). Not one window lit above it.
  { let n = 0;
    for (let k = 0; k < 5 && n < 40; k++) for (let s = 36 + k * 7; s < 222 && n < 40; s += 15 + rnd() * 9) {
      const d = Math.max(rbRidge(s) + 9, (s > 150 && s < 204 ? 41 : 0)) + k * 17 + rnd() * 6, g = ground(s, d);
      if (s > 174 && s < 198 && d > 38 && d < 66) continue;                 // the street of steps comes down here
      if (g < -7.5) continue;
      const w = 8 + rnd() * 4, tall = 6.5 + rnd() * 4;
      house({ row: 'upper', cs: s, cd: d, w, dep: 7.5, floor: g - 0.3, eaves: g + tall, ridge: g + tall + 2.6, faces: -1, lit: 0.8, turn: rnd() < 0.3 ? 1 : 0 }); n++;
    } }

  // ---------------------------------------------------------------------------------------------- the raised walk and its arcade
  // A walk a storey above the carriageway on the left of the street, carrying the lamp row; under it, lit shop arches.
  for (let s = 27; s < 134; s += 5.35) {
    const cs = s + 2.675, f = F(cs), [x, z] = xz(cs, (ST.walk.d0 + ST.walk.d1) / 2);
    arcade.push({ x, z, yaw: along(cs), s: cs, len: 5.4, floor: f, top: f + ST.walk.rise });
    if (cs < 119) for (const off of [-1.3, 1.3]) { const [ax, az] = xz(cs + off, ST.walk.d1 + 0.07); win(ax, f + 1.45, az, along(cs), 1.9, 2.3, cs, { tone: rnd() < 0.2 ? 2 : 0 }); }
  }

  // ---------------------------------------------------------------------------------------------- edge marks
  // Wherever the navigable edge has nothing standing at it: a weed-hung coping awash, so the boat never stops against nothing.
  for (const [s, side, len] of [[81, -1, 7], [95.5, -1, 6], [110, -1, 7], [124, -1, 7], [137, -1, 8], [148.5, -1, 5], [201, -1, 8], [214, -1, 7], [221.6, -1, 5],
    [124, 1, 6], [147.5, 1, 5], [207, 1, 7], [217, 1, 7], [223.2, 1, 4]]) { const d = side * (hw(s) + 0.5), [x, z] = xz(s, d); copings.push({ x, z, yaw: along(s), s, d, len }); }

  // ---------------------------------------------------------------------------------------------- lamps
  const R = plan.lampRow;
  R.s.forEach((s, i) => { const [x, z] = xz(s, R.d); lamps.push({ x, y: R.headY[i], z, s, d: R.d, kind: 'row', foot: R.headY[i] - R.height }); });
  // street lamps: along the street's right side, the lower lanes, round the square (sixty in all with the row and the steps)
  const street = (s, d) => { const [x, z] = xz(s, d), g = ground(s, d); lamps.push({ x, y: g + 4.2, z, s, d, kind: 'street', foot: g }); };
  for (let s = 34; s < 118; s += 14) street(s + 6, 4.6);
  for (let s = 10; s < 146; s += 16) { street(s, lane(s) - 2.2); street(s + 8, lane(s) - 23.5); }
  for (let s = 156; s < 204; s += 12) { street(s, 27.5); street(s + 6, -18.5); }
  for (const [s, d] of [[152, -8], [152, 12], [208, -10], [208, 10], [165, 4], [197, 14], [125, 9], [140, 18.5], [128, -16], [142, -19], [12, 6]]) street(s, d);
  // the two last lamp domes at the foot of the theatre steps, on tall plinths (heads 0.4 m under the surface)
  for (const l of T.stepLamps) { const [x, z] = xz(l.s, l.d); lamps.push({ x, y: -0.4, z, s: l.s, d: l.d, kind: 'row', foot: -4.6, plinth: ground(l.s, l.d) }); }
  // the street of steps down the hill into the lake: six standards, 2.1 m of fall apart. Three heads above the waterline, dark;
  // three below it, lit: the rule of the place in one line.
  { const st = SQ.steps, sMid = (st.s0 + st.s1) / 2;
    for (let i = 0; i < st.lamps; i++) { const d = 60 - i * 3.6, foot = 1.74 - i * 2.09, s = sMid + (i % 2 ? 3.4 : -3.4), [x, z] = xz(s, d); lamps.push({ x, y: foot + 4.2, z, s, d, kind: foot + 4.2 > 0 ? 'stepsDark' : 'steps', foot }); } }
  // (added by the kit, stage 2c: one more street lamp, beside the pollarded lime and its round seat in the square, its head just under
  // the tree's whips. It is the LAST of the list, so that no lamp before it changes its number or its kind)
  street(SQ.lime.s - 1.3, SQ.lime.d - 2.1);
  // (added by the kit, stage 2c, taken over a fourth time: two more, on the quay that opens in front of the right bank's houses where
  // the street is deepest: one before the house at s 95, one at the far end of the footbridge, so that the bridge and the leat
  // under it can be found from the boat. AFTER the lime's, so that no lamp before them changes its number or its kind)
  street(91.0, 14.9); street(105.9, 14.4);

  // ---------------------------------------------------------------------------------------------- pools of light (glow map only)
  // the glass ridge of the market hall: the brightest thing at the waterline, jade to turquoise; the hall under it
  for (let s = H.s0; s <= H.s1; s += 2) { const [x, z] = xz(s, H.d); pools.push({ x, z, r: 5, power: 1.3, jade: 1, s }); for (const o of [-7, 7]) { const [x2, z2] = xz(s, H.d + o); pools.push({ x: x2, z: z2, r: 6, power: 0.5, jade: 0.75, s }); } }
  // the nave lights of the church, both flanks
  for (let i = 0; i < CH.lancets.perSide; i++) for (const side of [-1, 1]) { const s = CH.s0 + 2.8 + i * 3.2, [x, z] = xz(s, CH.d + side * (CH.lancets.out + 1.5)); pools.push({ x, z, r: 4, power: 0.8, jade: i % 3 === 2 ? 0.8 : 0, s }); }
  // the hour ring's twelve lanterns and the stalls, as one pool at the foot of the tower; the fountain
  { const [x, z] = xz(plan.tower.s, plan.tower.d); pools.push({ x, z, r: 11, power: 1.6, jade: 0.08, s: plan.tower.s }); const [fx, fz] = xz(plan.fountain.s, plan.fountain.d); pools.push({ x: fx, z: fz, r: 7, power: 0.8, jade: 0, s: plan.fountain.s }); }
  // the lower town beyond the modelled houses: streets of light out to the far water, sparser with distance
  for (let k = 0; k < 9; k++) {
    const d0 = -86 - k * 17 - rnd() * 6;
    for (let s = -30 + rnd() * 10; s < 250; s += 9 + rnd() * 5) {
      if (rnd() < 0.18 + k * 0.05) continue;
      const d = d0 + Math.sin(s * 0.021 + k) * 9, [x, z] = xz(s, d);
      if (ground(s, d) > -3) continue;
      pools.push({ x, z, r: 6 + rnd() * 4, power: (0.5 + rnd() * 0.5) * (1 - k * 0.07), jade: rnd() < 0.1 ? 0.9 : 0, s: clampS(s) });
    }
  }
  // cross lanes of the lower town
  for (let s = 8; s < 240; s += 34 + rnd() * 10) for (let d = -78; d > -210; d -= 8 + rnd() * 5) { if (rnd() < 0.3) continue; const [x, z] = xz(s + (rnd() - 0.5) * 4, d); if (ground(s, d) > -3) continue; pools.push({ x, z, r: 5 + rnd() * 3, power: 0.35 + rnd() * 0.4, jade: 0, s }); }

  const town = { ground, xz, sd, hw, along, rightLine, terrace, shore, farShore, rbRidge, lbRidge, lane, houses, upper, windows, lamps, pools, stacks, dormers, gables, copings, arcade,
    counts: { front: houses.filter((h) => h.front).length, back: houses.filter((h) => !h.front).length, upper: upper.length, windows: windows.length, lamps: lamps.length } };
  cache.set(ctx.path, town);
  return town;
}
