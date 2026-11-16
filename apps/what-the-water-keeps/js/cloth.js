// Hanging cloth: bolts of dyed cloth on drying lines, a veil across the water, a backcloth, a curtain.
//
//   makeCloth(ctx, bolts, opts)     every bolt is an opaque strip pinned along its top edge; all of them are one draw
//                                   call. They move in the vertex shader: slow travelling folds, hems that part round
//                                   the boat's prow, hems that trail in the water, and a wind front that lifts every
//                                   bolt in turn and HOLDS it up until the wind drops (the area's shared wind:
//                                   src/engine/life/ribbons.js, makeWind)
//   makeFestoon(ctx, opts)          a festoon curtain: one great cloth drawn up on its lines into swags
//   makeSwags(ctx, swags, opts)     cloth slung between two points: vault ribs of silk, the swags of a box front
//   makeGores(ctx, opts)            cloth pegged along the arms of a turning wheel, hanging by its own weight
//
// They are painted like everything else (flat colour, dry-brush strokes, the realm's light, lantern, kept lamp and
// local lights) and glow when they hang between the eye and the light. The page is docs/life/ribbons.md.
import * as THREE from 'three';
import { gouacheShared, makeGouache, MAX_LIGHTS } from './gouache.js';
import { WIND_GLSL, sharedWind, lifeClock, thin } from './life/ribbons.js';
import { WATER_GLSL, waterUniforms } from './water-final.js';
import { CATENARY_GLSL, catenary, catenaryPoint } from './life/ropes.js';

const col = (c) => (c && c.isColor ? c : new THREE.Color(c ?? 0xffffff));
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const inOut = (t) => t * t * (3 - 2 * t);
const fract = (v) => v - Math.floor(v);

// ------------------------------------------------------------------------------------------------ a wind front on hanging cloth
// What a front (makeWind's) does to cloth that hangs from a line: bolts and the gores of a wheel share it. It is built
// on three facts (docs/life/ribbons.md, "Hanging cloth in a wind"):
//   - nothing swings faster than the wind can carry it. A point r metres down a cloth has r times its angle to travel,
//     so the top of a bolt answers the front at once and the hem of a long one comes up a second or two later, runs on
//     past its place and comes back (the whip is the weight);
//   - held cloth is the liveliest thing in the picture: it heaves with every cat's-paw that runs down the wind, ripples
//     run down it toward the hem, growing, and its hem is never quite level;
//   - when the wind drops it only falls: slowly at first, ballooning, a long bolt later than a short one, and it swings
//     past the plumb line once or twice before it hangs.
// The cloth is built from its pin outward, one stretch after another (CLOTH_STEPS of them), each leaning as the front
// asks at that moment: so it keeps its length whatever the front does to it.
// Needs WIND_GLSL, and CLOTH_STEPS defined (the number of rows the mesh has down its length).
export const CLOTH_FRONT_GLSL = /* glsl */`
  // 1 held .. 0 down, and after that the small swing it settles with (x); how hard it is falling, 0..1 (y)
  vec2 clothFall(float rel, float L) {
    if (rel <= 0.0) return vec2(1.0, 0.0);
    float depth = uLifeFrontB.z * clamp(0.45 + 0.55 * sqrt(L / 10.0), 0.6, 1.5), x = rel / depth, s = 0.3;
    if (x < 1.0) return vec2(1.0 - ((3.0 - s) * x * x + (s - 2.0) * x * x * x), 4.0 * x * (1.0 - x));
    float sp = max(uLifeFrontC.y, 0.5), om = sqrt(19.62 / max(L, 0.5)), tau = (rel - depth) / sp;
    return vec2(-s * sp / (depth * om) * exp(-tau * om / 7.0) * sin(om * tau), 0.0);
  }
  // how far a point that has 'arc' metres to travel has swung up: 0..1 and a little over, then back
  float clothRise(float lead, float arc) {
    float depth = max(uLifeFrontB.x, arc / 0.7), up = smoothstep(0.0, depth, lead);
    return up * (1.0 + uLifeFrontB.w * exp(-max(lead - depth, 0.0) / (depth * 1.5 + 0.01)));
  }
  // is a front (or its drop, or the swing after it) on a cloth L metres long at this spot?
  bool clothFrontOn(vec2 xz, float L) {
    float q = dot(uLifeFront.xy, xz);
    return uLifeFront.z - q > 0.0 && uLifeFrontB.y - q < uLifeFrontB.z * 1.5 + max(uLifeFrontC.y, 0.5) * 30.0 / sqrt(19.62 / max(L, 0.5));
  }
  // Where the point at the share 'frac' of the length of a cloth L metres long is while the front has it: metres
  // downwind and metres up from its pin. qx: -0.5..0.5 across it; xz: where the front finds it; Phi: the angle from the
  // plumb line it takes when held; r0: the metres over which it curves away from its pin; amp: metres of ripple at
  // its hem; ph: its own phase. tang: the way the cloth runs there; lift: how far it is lifted (0..1 and a little over).
  vec2 clothArc(float qx, float frac, float L, float r0, float Phi, vec2 xz, float ph, float amp, out vec2 tang, out float lift) {
    float t = uLifeWind.w, q = dot(uLifeFront.xy, xz), lead = uLifeFront.z - q;
    vec2 fall = clothFall(uLifeFrontB.y - q, L);
    float along = q - 0.6 * max(uLifeFrontC.x, 12.0) * t;                                  // cat's-paws run down the wind
    float heave = 1.0 + 0.10 * sin(along * 0.21 + ph) + 0.06 * sin(along * 0.083 + ph * 2.3 + 1.1);
    float tilt = 1.0 + 2.0 * qx * (0.035 * sin(t * 0.8 + ph * 3.1) + 0.02 * sin(t * 1.7 + ph));      // a hem is never quite level
    float k = 6.2831853 / max(L * 0.45, 2.6), om = min(5.5 * k, 7.9);                      // ripples run toward the hem
    amp *= uLifeWindB.z;                                                                    // (halved for a rider who asked for calm)
    float ds = L / float(CLOTH_STEPS), want = frac * float(CLOTH_STEPS), th = 0.0;
    vec2 P = vec2(0.0); lift = 0.0;
    for (int i = 0; i < CLOTH_STEPS; i++) {
      float w = min(1.0, want - float(i)); if (w <= 0.0) break;
      float r = (float(i) + 0.5 * w) * ds, sg = r / L, shape = min(r / r0, 1.0);
      lift = clothRise(lead, r * Phi * 0.8) * fall.x;
      float rip = amp * pow(sg, 1.3) * k * clamp(lift, 0.0, 1.0) * (0.7 * cos(k * r - om * t + ph * 5.0 + qx * 1.2) + 0.3 * cos(1.7 * k * r - 1.45 * om * t + ph * 2.0 - qx * 1.7));
      th = clamp(Phi * shape * lift * heave * tilt + Phi * 0.16 * sin(3.14159265 * sg) * fall.y + rip, -0.6, 1.7);
      P += vec2(sin(th), -cos(th)) * (ds * w);
    }
    tang = vec2(sin(th), -cos(th));
    P += tang * max(want - float(CLOTH_STEPS), 0.0) * ds;                                  // (a point asked for just past the hem)
    return P;
  }
`;
// The same on the script's side, for a whole cloth L metres long at (x, z): how far its hem is lifted now, 0 at rest ..
// 1 held (and a little over, or a little under zero while it settles). `F` is a wind's state, `t` the realm's time.
function clothLiftNow(F, t, x, z, L, Phi) {
  if (!(F.strength > 0)) return 0;
  const q = F.nx * x + F.nz * z, lead = F.q0 + F.speed * (t - F.t0) - q;
  if (lead <= 0) return 0;
  const rel = t >= F.relT ? F.relQ0 + F.relSpeed * (t - F.relT) - q : -1;
  const depth = Math.max(F.depth, L * Phi * 0.8 / 0.7), u = clamp01(lead / depth), up = u * u * (3 - 2 * u);
  const rise = up * (1 + 0.18 * Math.exp(-Math.max(lead - depth, 0) / (depth * 1.5 + 0.01)));
  if (rel <= 0) return rise;
  const fd = F.relDepth * Math.min(1.5, Math.max(0.6, 0.45 + 0.55 * Math.sqrt(L / 10))), xx = rel / fd, s = 0.3;
  if (xx < 1) return rise * (1 - ((3 - s) * xx * xx + (s - 2) * xx * xx * xx));
  const sp = Math.max(F.relSpeed, 0.5), om = Math.sqrt(19.62 / Math.max(L, 0.5)), tau = (rel - fd) / sp;
  return rise * (-s * sp / (fd * om) * Math.exp(-tau * om / 7) * Math.sin(om * tau));
}

// ------------------------------------------------------------------------------------------------ draped cloth
// A draped bolt (makeCloth's `drape`) is cut fuller than the line it hangs on, and the folds its fullness falls into
// are FIXED TO THE CLOTH. They are laid out by arc length: across the cloth the weave is turned through an angle
// A sin(psi), and the place of every thread follows from that angle in closed form (a sine inside a sine sums to
// Bessel functions), so the cloth keeps its width whatever its folds do: a bolt that hangs a quarter narrower than it
// is wide has a quarter of its width in its folds, and a deeper fold is more cloth. Broad folds stand one between each
// pair of pegs, no two the same width; finer folds ride on them (along their normal) and grow toward the hem. Between
// two pegs the top edge sags, and the cloth under a sag hangs lower. A corner that has come off its pegs hangs from
// the last peg that holds. A cloth thrown over its line rolls over it and hangs double as far as its short end reaches.
// Its hem is torn: cut on the slant, bitten, tattered, frayed, with a rent: cut IN THE MESH (rows beyond the hem close up
// onto it), so the cloth stays wholly opaque: nothing is blended and no fragment is thrown away.
// SECOND LOOK (7 November): a bolt may be SWEPT ASIDE AND TIED (`tie`): every thread runs from its peg to the tie, the
// far edge taut and the near ones slack, and below the tie the cloth hangs from it in a tail whose hem is cut on the
// slant by what the sweep took of each thread. Its hem may hang IN RAGS (`rag`): torn away, leaving narrow strips. And
// wet cloth clings to itself in narrow PLEATS (`pleat`): painted, twenty streaks of light and dark across a bolt, more
// where it is gathered: the light behind a cloth comes through its open stretches and stops in its pleats.
// THIRD LOOK (7 November): a bolt's folds may be CREASED AT ITS PEGS (`crease`): between two pegs the cloth hangs out in
// one broad lobe, and two lobes meet in a sharp valley on the peg's own line (the weave is turned through A cos(psi / 2)
// from one peg to the next: the same Bessel sums lay it out, so it still keeps its width). A lobe faces the light
// squarely at its middle and turns from it toward both creases: against the light a creased bolt shows ONE dark rib a
// fold, on the peg's line (the round fold shows two, one on each flank: stripes). From its torn hem hangs a FRINGE
// (`fringe`): tatters and threads, thin strips of the mesh that hang and move with the cloth. And the form of every fold
// is PAINTED as a painter models drapery (`form`): light on the lobe, the dark gathered into the valley, deeper in the
// cloth's own colour before it is darker.
// FIFTH LOOK (7 November): a dip BLEEDS (`bleed`): the second dye of a bolt does not begin at a line: the two run into one
// another over metres, in runs and fingers. A tied bolt's tail hangs as wide as its tie says (`tie.tail`).
const DRAPE_DEFAULTS = { full: 0.2, pegs: 4, sag: 0.5, fine: 0.5, over: 0, drop: 0, tear: 0, skew: 0, taper: 0.06, gather: 0, band: 0.5, face: 0, mark: null, rows: 0.09, heading: 0.35, line: 0.05, lineAt: null, tie: null, rag: 0, pleats: 1, crease: 0, fringe: 0, uneven: 0 };
const bj0inv = (c) => { const d = 1 - Math.min(1, Math.max(0.24, c)); let s = d * (1 + 0.3 * d); for (let i = 0; i < 2; i++) { const f = 1 - s + s * s * (0.25 - s / 36) - (1 - d); s -= f / (-1 + s * (0.5 - s / 12)); } return 2 * Math.sqrt(Math.max(s, 0)); };
const tri = (x) => Math.abs(fract(x) - 0.5) * 2;
const sstep = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
/**
 * How far short of its full length a torn hem ends, U metres across (from the middle) a cloth W wide and L long;
 * tear 0..1, skew -1..1, sd the bolt's own number (its phase). The same function the shader cuts the hem by (it is
 * made of sines and saw teeth only, so that both sides find the same hem): for drips, for anything caught on a hem.
 * (The shader cuts at its columns: between two of them the hem runs straight.)
 * rag 0..1: the hem hangs in rags: it is torn away by up to a metre; what is left hangs to its old length in flaps.
 */
export function clothTorn(U, W, L, tear, skew, sd, rag = 0) {
  const u = U / W + 0.5, x = U + sd * 7.31;
  const cut = Math.abs(skew) * 0.08 * L * (skew > 0 ? u : 1 - u);
  const bite = Math.pow(0.5 + 0.5 * Math.sin(x * 1.9 + sd * 3) * Math.sin(x * 0.83 + sd * 5), 3);
  const teeth = tri(x * 2.6 + 0.35 * Math.sin(x * 1.7 + sd)) * (0.55 + 0.45 * Math.sin(x * 4.3 + sd * 2));
  const fray = tri(x * 11 + 0.5 * Math.sin(x * 5.3)) * (0.5 + 0.5 * Math.sin(x * 23 + sd * 9));
  const rent = Math.max(0, 1 - Math.abs(U - W * (fract(sd * 0.618) - 0.5) * 0.8) / (0.05 + 0.1 * tear)) * (tear >= 0.45 ? 1 : 0) * (0.6 + 1.6 * fract(sd * 1.37));
  // in rags: the hem torn away by up to a metre; what is left hangs to its old length in flaps of every width, each its own length
  const flap = rag > 0 ? sstep(0.5, 0.62, 0.5 + 0.5 * Math.sin(x * 5.3 + sd * 2.3 + 1.5 * Math.sin(x * 1.7 + sd))) * (0.4 + 0.3 * (1 + Math.sin(x * 2.9 + sd * 4.1))) : 0;
  return cut + tear * (bite * Math.min(0.9, 0.3 + 0.05 * L) + teeth * 0.22 + fray * 0.05 + rent) + rag * Math.min(1.1, 0.25 + 0.06 * L) * (1 - flap);
}
/**
 * Where the thread at t (0..1 across) of a TIED bolt lies r metres down it, in the bolt's own frame (x along its line, y
 * up from its pegs): [x, y, the share of its width the cloth has there, how far it bellies out of its plane]. T: its tie
 * ({ at, side, out, tight, slack }: hangOf's), W the width it hangs to, Lf its length, g its gather. The shader's twin.
 */
function tiedPoint(T, W, Lf, g, t, r) {
  const hT = T.at * Lf, wT = T.tight * W, xTc = T.side * (0.5 * W + T.out - 0.5 * wT);
  const x0 = W * (t - 0.5 + g * (t * t - t)), xT = xTc + (t - 0.5) * wT;
  const D = Math.hypot(xT - x0, hT), Dfar = Math.hypot(xTc - T.side * 0.5 * wT + T.side * 0.5 * W, hT), rT = D + T.slack * (Dfar - D), rr = Math.max(r, 0);
  if (rr < rT) {
    const u = rr / rT, dip = Math.sqrt(Math.max(0.375 * D * (rT - D), 0)) * 4 * u * (1 - u);
    const ex = (xT - x0) / D, ey = -hT / D; let bx = T.side * ey * 0.55, by = -T.side * ex * 0.55 - 0.45; const bl = Math.hypot(bx, by) || 1; bx /= bl; by /= bl;
    return [x0 + u * (xT - x0) + bx * dip * 0.8, -u * hT + by * dip * 0.8, 1 + (T.tight - 1) * u * u * (3 - 2 * u), 0.45 * dip];
  }
  const rb = rr - rT, wB = W * (T.tight + (Math.max(T.tail ?? 0.62, T.tight) - T.tight) * sstep(0, 2.6, rb));
  return [xTc - T.side * 0.35 * (wB - wT) + (t - 0.5) * wB, -hT - rb, wB / W, 0];
}
/** How one bolt of a draped cloth hangs: its own values, or the cloth's (makeCloth's `drape`). */
function hangOf(b, D, ph, wet, rods) {
  const pick = (k) => b[k] ?? D[k];
  const c0 = 1 - Math.min(0.72, Math.max(0.02, pick('full')));
  const over = Math.min(0.45, Math.max(0, pick('over'))), drop = over > 0 ? 0 : Math.min(0.88, Math.max(-0.88, pick('drop')));
  let g = Math.min(1, Math.max(-1, pick('gather'))) * 0.6;
  g = Math.sign(g) * Math.max(0, Math.min(Math.abs(g), 0.985 / c0 - 1, 1 - 0.26 / c0));
  return {
    ph, c0, n1: Math.max(1, Math.round(pick('pegs')) - 1), sag: pick('sag'), fine: pick('fine'), over, drop, g,
    tear: pick('tear'), skew: pick('skew'), taper: pick('taper'), wet: b.wet ?? wet, stiff: b.stiff || 0,
    face: pick('face') || (fract(ph * 7.77) < 0.5 ? -1 : 1), rod: !!(rods && (b.rod ?? D.rod)),
    band: b.hem != null ? pick('band') : 2, hem: col(b.hem ?? b.color ?? '#ffffff').clone(), mark: b.mark ?? D.mark,
    Wc: b.width / c0, V0: b.length * over / (1 - over),
    // (second look) swept aside and tied; a hem in rags; how much of the cloth's pleats this bolt shows
    tie: (() => { const T = over > 0 || drop !== 0 ? null : (b.tie ?? D.tie); return T ? { at: Math.min(0.9, Math.max(0.12, T.at ?? 0.5)), side: (T.side ?? 1) < 0 ? -1 : 1, out: T.out ?? 0.3, tight: Math.min(0.7, Math.max(0.12, T.tight ?? 0.22)), slack: Math.min(1, Math.max(0, T.slack ?? 0.3)), tail: T.tail != null ? Math.min(1, Math.max(0.12, T.tail)) : null } : null; })(),
    rag: clamp01(pick('rag') || 0), pleats: Math.max(0, pick('pleats') ?? 1),
    // (third look) how far its folds are creased at the pegs; how much fringe hangs from its hem
    crease: clamp01(pick('crease') || 0), fringe: clamp01(pick('fringe') || 0), uneven: clamp01(pick('uneven') || 0),
  };
}
/** A grid hanging down from y = 0 whose rows stand where `rows` says (0 at the top .. 1 at the hem). */
function hangingGrid(ax, rows) {
  const n = rows.length, pos = new Float32Array((ax + 1) * n * 3), uv = new Float32Array((ax + 1) * n * 2), idx = [];
  for (let j = 0; j < n; j++) for (let i = 0; i <= ax; i++) { const k = j * (ax + 1) + i; pos.set([i / ax - 0.5, -rows[j], 0], k * 3); uv.set([i / ax, 1 - rows[j]], k * 2); }
  for (let j = 0; j < n - 1; j++) for (let i = 0; i < ax; i++) { const a = j * (ax + 1) + i, b = a + ax + 1, c = b + 1, d = a + 1; idx.push(a, b, d, b, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(idx);
  return g;
}
/** Rows for a draped cloth: the first few for its heading (or its short end), the rest closer together at the top and at the hem. */
function drapeRows(n, d0) {
  const k0 = Math.max(2, Math.round(n * 0.18)), rows = [];
  for (let i = 0; i <= n; i++) { if (i <= k0) rows.push(d0 * i / k0); else { const s = (i - k0) / (n - k0); rows.push(d0 + (1 - d0) * (s - 0.7 * Math.sin(2 * Math.PI * s) / (2 * Math.PI))); } }
  return rows;
}
/** Where a draped bolt's hem hangs at rest: its `n` lowest tips in the realm's coordinates, lowest first. */
function drapeHem(b, h, n, D) {
  const Lf = b.length, Lc = Lf + h.V0, Wc = h.Wc, s1 = fract(h.ph * 0.731), s2 = fract(h.ph * 1.913), T = Math.PI * 2, N = 48, pts = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N, U = (t - 0.5) * Wc, r = Lf - clothTorn(U, Wc, Lc, h.tear, h.skew, h.ph, h.rag), v = clamp01(r / Lf);
    const narrow = (1 - h.taper * sstep(0.15, 1, v)) * (1 + Math.min(0.07, 1.2 * h.taper) * Math.sin(v * 3.7 + fract(h.ph * 3.377) * T) * sstep(0, 0.3, v)), spread = h.rod ? sstep(0.7, 1, v) : 0, cl = h.c0 * (1 + h.g * (2 * t - 1));
    const tw = t + (0.35 * (Math.sin(T * (t + s1)) - Math.sin(T * s1)) + 0.1 * (Math.sin(2 * T * (t + s2)) - Math.sin(2 * T * s2))) / T, dtw = 1 + 0.35 * Math.cos(T * (t + s1)) + 0.2 * Math.cos(2 * T * (t + s2));
    const e = Math.max(h.drop ? (h.drop < 0 ? -h.drop - t : t - (1 - h.drop)) : 0, 0) * Wc, am = 0.85 + 0.4 * Math.abs(h.drop), e0 = 0.3 * Math.abs(h.drop) * Wc + 0.12, ea = am * Math.min(e, e0) / e0;
    const fallX = e - (e0 / am * Math.sin(ea) + Math.max(e - e0, 0) * Math.cos(am)), fallY = e0 / am * (1 - Math.cos(ea)) + Math.max(e - e0, 0) * Math.sin(am);
    const dpeg = cl * Wc / (h.n1 * dtw), sagS = h.over > 0 ? 0 : h.sag * dpeg * Math.sqrt(Math.max(1 / cl - 1, 0)) * (1 - sstep(0, 0.1, e));
    const s4 = fract(h.ph * 5.119), lean = 1.5 * v * Math.sin(v * 2.6 + s2 * T) + 0.9 * v * v * (s4 - 0.5);
    const sagY = sagS * Math.pow(Math.abs(Math.sin(0.5 * (T * h.n1 * tw + lean))), 0.85) * (1 + (0.45 * (1 - spread) - 1) * sstep(0, 2.5 * dpeg, r));
    const x = Wc * h.c0 * (t - 0.5 + h.g * (t * t - t)) * narrow + (h.drop < 0 ? 1 : -1) * cl * fallX;
    if (h.tie) { const q = tiedPoint(h.tie, b.width, Lf, h.g, t, r); pts.push({ x: q[0], y: q[1] - sagY, t }); continue; }      // swept aside and tied: its hem hangs under the tie
    pts.push({ x, y: -r - sagY - fallY + (h.over > 0 ? 1.5708 * D.line + (D.lineAt ?? -D.line) : 0), t });
  }
  // the lowest tips, no two closer than a share of the width
  const order = pts.map((_, i) => i).sort((a, c) => pts[a].y - pts[c].y), gap = N / (n + 1), taken = [];
  for (const i of order) { if (taken.length >= n) break; if (taken.every((j) => Math.abs(j - i) >= gap)) taken.push(i); }
  const th = b.turn ?? 0, cs = Math.cos(th), sn = Math.sin(th);
  return taken.map((i) => ({ x: b.position[0] + pts[i].x * cs, y: b.position[1] + pts[i].y, z: b.position[2] - pts[i].x * sn, across: pts[i].t }));
}
const DRAPE_VERT_GLSL = /* glsl */`
  attribute vec4 aDrape, aHang, aDress, aDye2, aMark, aTie, aMore;      // aMore.w: how far its folds are creased at the pegs
  #if defined(CREASE) || defined(FRINGE) || defined(TAIL)
    attribute vec4 aForm;                                      // aForm.x: how much fringe hangs from its hem; aForm.y: how uneven its folds are (deep here, shallow there); aForm.z: the share of its width a tied bolt's tail hangs to
    uniform vec4 uFringe;                                      // the fringe: (unused), metres its longest thread hangs, metres wide a thread leaves the hem, how many a bolt may carry
  #endif
  #ifdef FRINGE
    varying float vFringe;                                     // 0 on the cloth and where a tatter leaves the hem .. 1 at its tip
  #endif
  // aTie: how far down it is tied (a share of its length; 0: not tied), which side, metres beyond its edge, the share of its width left at the tie; aMore: rag, pleats, the tie's slack
  uniform vec4 uRows;                                          // the share of the mesh's rows given to the heading; metres of heading on a pegged cloth; the radius of its line; how high the line's middle is above the bolt's place
  varying vec4 vCloth, vFold, vTorn, vMark, vDye2;
  vec4 gCloth, gFold; float gToHem;                            // what the last call of drapeHang found, for the painter
  float bj0(float x) { float y = x * x; return 1.0 + y * (-0.25 + y * (0.015625 + y * (-0.00043403 + y * 0.0000067817))); }
  float bj1(float x) { float y = x * x; return x * (0.5 + y * (-0.0625 + y * (0.0026042 + y * -0.000054253))); }
  float bj2(float x) { float y = x * x; return y * (0.125 + y * (-0.010417 + y * 0.00032552)); }
  float bj3(float x) { float y = x * x; return x * y * (0.020833 + y * (-0.0013021 + y * 0.000032552)); }
  // the angle whose folds leave the share c of a cloth's width: J0(A) = c
  float bj0inv(float c) {
    float d = 1.0 - clamp(c, 0.24, 1.0), s = d * (1.0 + 0.3 * d);
    for (int i = 0; i < 2; i++) { float f = 1.0 - s + s * s * (0.25 - s / 36.0) - (1.0 - d); s -= f / (-1.0 + s * (0.5 - s / 12.0)); }
    return 2.0 * sqrt(max(s, 0.0));
  }
  float clothTri(float x) { return abs(fract(x) - 0.5) * 2.0; }
  // how far short of its full length a torn hem ends (clothTorn on the script's side: keep the two alike)
  float clothTorn(float U, float W, float L, float tear, float skew, float sd) {
    float u = U / W + 0.5, x = U + sd * 7.31, rag = aMore.x;
    // in rags: the hem torn away by up to a metre; what is left hangs to its old length in flaps of every width, each its own length
    float flap = rag > 0.0 ? smoothstep(0.5, 0.62, 0.5 + 0.5 * sin(x * 5.3 + sd * 2.3 + 1.5 * sin(x * 1.7 + sd))) * (0.4 + 0.3 * (1.0 + sin(x * 2.9 + sd * 4.1))) : 0.0;
    float cut = abs(skew) * 0.08 * L * (skew > 0.0 ? u : 1.0 - u);                                         // cut on the slant: one side hangs longer
    float bite = pow(0.5 + 0.5 * sin(x * 1.9 + sd * 3.0) * sin(x * 0.83 + sd * 5.0), 3.0);                // a few wide bites
    float teeth = clothTri(x * 2.6 + 0.35 * sin(x * 1.7 + sd)) * (0.55 + 0.45 * sin(x * 4.3 + sd * 2.0)); // tatters
    float fray = clothTri(x * 11.0 + 0.5 * sin(x * 5.3)) * (0.5 + 0.5 * sin(x * 23.0 + sd * 9.0));        // fray
    float rent = max(0.0, 1.0 - abs(U - W * (fract(sd * 0.618) - 0.5) * 0.8) / (0.05 + 0.1 * tear)) * step(0.45, tear) * (0.6 + 1.6 * fract(sd * 1.37));      // one rent running up from the hem
    return cut + tear * (bite * min(0.9, 0.3 + 0.05 * L) + teeth * 0.22 + fray * 0.05 + rent) + rag * min(1.1, 0.25 + 0.06 * L) * (1.0 - flap);
  }
  // THE HEM IS CUT IN THE MESH (no fragment is thrown away: the cloth stays wholly opaque, and what is behind it costs
  // nothing): the mesh's own way down (0..1) at which the cloth ends in the column q.x: its torn hem, and for a cloth
  // thrown over its line its short end too. Rows beyond close up onto it. toHem: metres of cloth left below this point.
  float drapeEnds(vec2 q, float ph, out float toHem) {
    float hx = aHang.x, over = hx > 1.0 ? hx - 1.0 : 0.0, Lf = aSize.y, V0 = Lf * over / (1.0 - over), Lc = Lf + V0;
    float head = over > 0.0 ? V0 : min(uRows.y, 0.1 * Lf), m = -q.y, Wc = aSize.x / aDrape.x, U = q.x * Wc;
    float V = m < uRows.x ? head * m / uRows.x : head + (Lc - head) * (m - uRows.x) / (1.0 - uRows.x);
    float hem = Lc - clothTorn(U, Wc, Lc, aHang.z, aHang.w, ph), top = over > 0.0 ? 0.5 * clothTorn(U, Wc, Lc, aHang.z, -aHang.w, ph + 3.7) : -1.0;
    V = clamp(V, top, hem);
    toHem = over > 0.0 ? min(hem - V, V - top) : hem - V;
    return V < head ? uRows.x * V / head : uRows.x + (V - head) * (1.0 - uRows.x) / (Lc - head);
  }
  // How a draped cloth hangs: where the point q of the mesh lies in the bolt's own frame (x along its line, y up from
  // its pegs, z out of its plane). down: 0 at its line .. 1 at its full length (the short end of a cloth thrown over
  // its line counts back from the line).
  vec3 drapeHang(vec2 q, float ph, float stiff, out float down) {
    float t = q.x + 0.5, m = -q.y;
    float hx = aHang.x, over = hx > 1.0 ? hx - 1.0 : 0.0, drop = hx > 1.0 ? 0.0 : hx;
    float Lf = aSize.y, V0 = Lf * over / (1.0 - over), Lc = Lf + V0;
    // the first rows of the mesh are the heading of a pegged cloth, or the short end of a cloth thrown over its line
    float head = over > 0.0 ? V0 : min(uRows.y, 0.1 * Lf);
    float V = m < uRows.x ? head * m / uRows.x : head + (Lc - head) * (m - uRows.x) / (1.0 - uRows.x);
    float r = V - V0;                                          // metres along the cloth from its line (negative: its short end, behind the line)
    down = abs(r) / Lf;
    float v = clamp(r / Lf, 0.0, 1.0), free = pow(down, 1.4) * (1.0 - stiff);
    float c0 = aDrape.x, n1 = aDrape.y, wet = aDress.x, g = aDye2.w;
    float face = aDress.z < 0.0 ? -1.0 : 1.0, rod = step(1.5, abs(aDress.z));
    float s1 = fract(ph * 0.731), s2 = fract(ph * 1.913), s3 = fract(ph * 3.377), s4 = fract(ph * 5.119);
    float held = clamp(lifeFront(aPos.xz) * (1.0 - stiff) * uLifeWindB.z, 0.0, 1.0);      // a wind front pulls its folds half out
    // it hangs a little narrower toward the hem (wet cloth clings); a rod in the hem presses its folds flat there
    float narrow = (1.0 - aDress.y * smoothstep(0.15, 1.0, v)) * (1.0 + min(0.07, 1.2 * aDress.y) * sin(v * 3.7 + s3 * 6.2831853) * smoothstep(0.0, 0.3, v)), spread = rod * smoothstep(0.7, 1.0, v);      // (and no edge of heavy cloth is a ruled line; taper 0 keeps a curtain's edges true)
    float Wc = aSize.x / c0;                                   // the cloth's own width
    // SWEPT ASIDE AND TIED: every thread runs from its peg to the tie: the far edge taut, the near ones slack and sagging
    // (they belly out of the cloth's plane too); below the tie the cloth hangs from it in a tail, a little spread again,
    // its hem cut on the slant by what the sweep took of each thread. The cloth is gathered as its threads converge.
    vec2 tied = vec2(0.0); float tieOn = 0.0, tieZ = 0.0;
    if (aTie.x > 0.0) {
      float sideT = aTie.y < 0.0 ? -1.0 : 1.0, hT = aTie.x * Lf, wT = aTie.w * aSize.x, xTc = sideT * (0.5 * aSize.x + aTie.z - 0.5 * wT);
      vec2 P0 = vec2(aSize.x * (t - 0.5 + g * (t * t - t)), 0.0), PT = vec2(xTc + (t - 0.5) * wT, -hT);
      float D = length(PT - P0), Dfar = length(vec2(xTc - sideT * 0.5 * wT + sideT * 0.5 * aSize.x, hT));
      float rT = D + aMore.z * (Dfar - D), rr = max(r, 0.0);
      if (rr < rT) {
        float u = rr / rT, dip = sqrt(max(0.375 * D * (rT - D), 0.0)) * 4.0 * u * (1.0 - u);
        vec2 e = (PT - P0) / D, bdir = normalize(vec2(sideT * e.y * 0.55, -sideT * e.x * 0.55 - 0.45));
        tied = P0 + u * (PT - P0) + bdir * dip * 0.8; tieZ = 0.45 * dip;
        narrow *= mix(1.0, aTie.w, u * u * (3.0 - 2.0 * u));
      } else {
        #ifdef TAIL
        float rb = rr - rT, wB = aSize.x * mix(aTie.w, max(aForm.z, aTie.w), smoothstep(0.0, 2.6, rb));      // (tie.tail: how wide its tail hangs under the tie)
        #else
        float rb = rr - rT, wB = aSize.x * mix(aTie.w, max(0.62, aTie.w), smoothstep(0.0, 2.6, rb));
        #endif
        tied = vec2(xTc - sideT * 0.35 * (wB - wT) + (t - 0.5) * wB, -hT - rb);
        narrow = wB / aSize.x;
      }
      tieOn = 1.0;
    }
    float cl = c0 * (1.0 + g * (2.0 * t - 1.0));               // gathered toward one side: the share its folds leave changes across it
    float cv = cl * narrow;
    float xm = mix(Wc * c0 * (t - 0.5 + g * (t * t - t)) * narrow, tied.x, tieOn);
    // broad folds, one between each pair of pegs, no two the same width; finer folds that grow toward the hem
    float tw = t + (0.35 * (sin(6.2831853 * (t + s1)) - sin(6.2831853 * s1)) + 0.1 * (sin(12.5663706 * (t + s2)) - sin(12.5663706 * s2))) / 6.2831853;
    float dtw = 1.0 + 0.35 * cos(6.2831853 * (t + s1)) + 0.2 * cos(12.5663706 * (t + s2));
    float tv = t + 0.3 * (sin(6.2831853 * (t + s4)) - sin(6.2831853 * s4)) / 6.2831853, dtv = 1.0 + 0.3 * cos(6.2831853 * (t + s4));
    float n2 = n1 * (1.55 + 0.9 * s3) + 0.37, breath = uTime * uSway.y, alive = uLifeWindB.z * (1.0 - stiff);
    float lean = 1.5 * v * sin(v * 2.6 + s2 * 6.2831853) + 0.9 * v * v * (s4 - 0.5);          // no fold runs plumb: each wanders on its way down
    float ps1 = 6.2831853 * n1 * tw + lean + 0.10 * sin(breath * 0.9 + ph - v * 3.0) * alive;       // and the folds work a little as it breathes
    float ps2 = 6.2831853 * (n2 * tv + s2) - 1.7 * lean + 0.22 * sin(breath * 1.3 + ph * 2.0 - v * 5.0) * alive;
    float k1 = 6.2831853 * n1 * dtw / Wc, k2 = 6.2831853 * n2 * dtv / Wc;
    // the finer folds come and go across the cloth: here two run into one, there one opens into two
    float patchy = 0.5 + 0.5 * sin(t * 5.3 + s1 * 6.2831853 + v * 1.9) * sin(t * 2.9 + s4 * 6.2831853 - v * 0.8);
    float A2 = aDrape.w * 0.75 * smoothstep(0.02, 0.5, v) * patchy * (1.0 - spread);
    A2 = min(A2, 0.8 * bj0inv(cv));
    float A1 = bj0inv(cv / bj0(A2)), unfold = 1.0 - 0.5 * held;
    A1 *= unfold; A2 *= unfold;
    // UNEVEN (third look): no fold is as deep as its neighbour, nor as deep at the hem as under its pegs: every second fold
    // is the deeper one here and the shallower one two metres further down (a row of even flutes is a column, not a cloth)
    #ifdef CREASE
    if (aForm.y > 0.0) A1 = clamp(A1 * (1.0 + aForm.y * (0.55 * sin(3.14159265 * n1 * tw + (2.0 + 2.5 * s3) * v * Lf / 6.0 + s1 * 6.2831853) + 0.3 * sin(t * 4.4 + v * Lf * 0.55 + s4 * 6.2831853))), 0.04, 1.9);
    #endif
    float th1 = face * A1 * sin(ps1), j02 = bj0(A2);
    float z1 = -face * (2.0 * bj1(A1) * cos(ps1) + 0.6667 * bj3(A1) * cos(3.0 * ps1)) / k1 * j02;
    float x1 = bj2(A1) * sin(2.0 * ps1) / k1 * j02;
    #ifdef CREASE
    float lobe = -cos(ps1);                                    // -1 on a peg's line .. 1 midway between two pegs
    if (aMore.w > 0.0) {
      // CREASED AT ITS PEGS: from one peg to the next the weave is turned through A cos(psi / 2): it leaves the peg's line
      // steeply, lies square to the line midway, and comes back to the next peg as steeply the other way: one broad lobe,
      // and a sharp valley where two lobes meet. Laid out by arc length (the cosine of a cosine sums to the same Bessel
      // functions: the share it leaves is J0(A) again), as deep from valley to crest as the round fold of the same fullness
      float hp = 0.5 * mod(ps1, 6.2831853), cj1 = bj1(A1), cj3 = bj3(A1);
      float thC = face * A1 * cos(hp);
      float zC = face * (4.0 * (cj1 * sin(hp) - 0.3333 * cj3 * sin(3.0 * hp)) - 2.0 * (cj1 + 0.3333 * cj3)) / k1 * j02;
      float xC = -2.0 * bj2(A1) * sin(ps1) / k1 * j02;
      th1 = mix(th1, thC, aMore.w); z1 = mix(z1, zC, aMore.w); x1 = mix(x1, xC, aMore.w); lobe = mix(lobe, 2.0 * sin(hp) - 1.0, aMore.w);
    }
    #endif
    float fd = -face * 2.0 * bj1(A2) * cos(ps2) / k2;         // the finer folds ride on the broad ones, along their normal
    float xf = x1 - sin(th1) * fd, zf = z1 + cos(th1) * fd;
    // one corner off its pegs: the cloth beyond the last peg that holds hangs from it, its top edge falling away
    float e = max((drop < 0.0 ? -drop - t : t - (1.0 - drop)) * step(0.001, abs(drop)), 0.0) * Wc;
    float am = 0.85 + 0.4 * abs(drop), e0 = 0.3 * abs(drop) * Wc + 0.12, ea = am * min(e, e0) / e0;
    float fallX = e - (e0 / am * sin(ea) + max(e - e0, 0.0) * cos(am)), fallY = e0 / am * (1.0 - cos(ea)) + max(e - e0, 0.0) * sin(am);
    // pegs stand at the back of each broad fold: between two of them the top edge sags, and the cloth under a sag hangs lower
    float dpeg = cl * Wc / (n1 * dtw);
    float sagS = aDrape.z * dpeg * sqrt(max(1.0 / cl - 1.0, 0.0)) * step(over, 0.0) * (1.0 - smoothstep(0.0, 0.1, e));
    float bow = pow(abs(sin(0.5 * ps1)), 0.85);
    float sagY = sagS * bow * mix(1.0, 0.45 * (1.0 - spread), smoothstep(0.0, 2.5 * dpeg, r));
    float pouch = face * 0.4 * sagS * bow * (max(r, 0.0) / dpeg) * exp(1.0 - max(r, 0.0) / dpeg);
    // thrown over its line: it rolls over the line and its short end hangs behind
    float rho = uRows.z, yl = mix(-r, tied.y, tieOn), zr = face * tieZ, press = 1.0;
    if (over > 0.0) {
      float a = clamp(r / rho, -1.5708, 1.5708);
      yl = rho * cos(a) + uRows.w - max(abs(r) - 1.5708 * rho, 0.0); zr = rho * sin(a);
      press = mix(0.3, 1.0, smoothstep(0.0, 0.45, abs(r)));      // pressed flat where it lies on the line
    }
    float xl = xm + xf * press + (drop < 0.0 ? 1.0 : -1.0) * cl * fallX;
    float zl = zf * press * (1.0 - 0.75 * spread) + pouch + zr;
    yl -= sagY + fallY;
    // it breathes: slow folds travel down it and the whole hem swings lazily (wet cloth half as far)
    float swing = uSway.x * uLifeWindB.z * (1.0 - 0.5 * wet);
    #ifdef BREEZE
      swing *= lifeBreeze(aPos.xz);
    #endif
    float sway = sin(uTime * uSway.y * 2.1 + ph + down * 5.0 + q.x * 2.4) * 0.5 + sin(uTime * uSway.y * 1.3 + ph * 1.7 + down * 2.2) * 0.5;
    zl += sway * swing * free;
    xl += sin(uTime * uSway.y * 0.8 + ph * 0.6 + down * 3.0) * swing * 0.25 * free;
    gCloth = vec4((t - 0.5) * Wc, V, Lc, Wc);
    #ifdef CREASE
      gFold = vec4(r, face * lobe * min(A1, 1.0), V0, ph);
    #else
    gFold = vec4(r, -face * cos(ps1) * min(A1, 1.0), V0, ph);
    #endif
    return vec3(xl, yl, zl);
  }
`;
const DRAPE_FRAG_GLSL = /* glsl */`
  varying vec4 vCloth, vFold, vTorn, vMark, vDye2;
  #ifdef FORM
  uniform vec4 uForm, uFormB;
  #endif
  // uForm, uFormB: the form of a fold, painted: how dark its valley, how light its lobe, how much of the dark is depth of colour, how much less light a valley lets through; how much more comes through the frayed edge of the hem, through a tatter, and through the middle of a lobe
  #ifdef FRINGE
    varying float vFringe;
  #endif
  uniform sampler2D tResist, tWeave, tWet; uniform vec4 uResist, uWeave, uWetMap, uPleat; uniform vec3 uResistColor;      // uPleat: how strong its pleats; their picture's repeats in a metre across the cloth; how wide a pleat's edge; how much more light soaked cloth lets through
  #ifdef BLEED
    uniform vec4 uBleed;                                       // (bleed) metres over which a dip bleeds; how long its runs and fingers beside that; how deep the stain where the two dyes lie over one another
  #endif
  #ifdef RESIST_LIFT
    uniform vec4 uResistB;                                     // (resist.lift, soft, thru) a mark is at most this many times as light as the cloth beside it; how soft it is read (levels of its picture); how much more light comes through it
  #endif
  float clothTide(float d, float w) { float t = max(1.0 - d * d / (w * w), 0.0); return t * t; }      // a tide mark: a soft line w metres to either side
  float clothMot(vec2 uv) { return clamp((texture2D(tWeave, uv).b - 0.62) * 2.6 + 0.5, 0.0, 1.0); }      // the painted mottle as noise, 0..1
`;

/**
 * makeCloth(ctx, bolts, opts)   (the older form makeCloth(engine, ctx, bolts, opts) still works)
 * bolts: [{ position: [x, y, z] (the middle of the top edge), width, length, turn (rotation about the vertical axis; 0 = the cloth
 *           faces along z), color, phase?, stiff? (0..1, 1 = hardly moves) }]
 * opts:
 *   map              a painted cloth texture (tileable); uvScale = metres per repeat
 *   backlight        0..1 how strongly cloth glows when it is between the eye and the key light (default 0.9)
 *   sway             metres the hem swings (default 0.35), speed (default 0.5)
 *   part             true (default): hems lift and part round the boat's prow
 *   segments         [across, down] (default [10, 24])
 *   wind             the area's wind (makeWind). With one, the cloth's sway follows its breeze and its fronts lift the
 *                    cloth; without, the realm's shared wind is used for fronts only and the sway is as it always was
 *   lift             { angle: 1.3, bend: 0.6, flutter: 0.25, belly: 0.05 }: how a front holds a bolt up. angle: radians
 *                    from the plumb line at full strength (1.3 = streaming nearly level); bend: the share of its length
 *                    over which it curves away from its line before running straight; flutter: metres of ripple at the
 *                    hem while it is held; belly: how far the middle of its width fills, as a share of the width
 *   water            { current: [x, z], strength: 0.25, wake: 0.6, float: 0.5 }: hems that hang into the water stream
 *                    with the current (metres sideways per metre of depth), sway with the wake and half float
 *   wet              0..1: the cloth is darker and wetter toward the hem (default 0); hem: true draws a rolled hem
 *   rod              true or { color: '#3a2a30', thick: 0.045, past: 0.06 }: a rod in the hem: the hem hangs straight (its
 *                    pleats die out above it) and the rod's ends show past both edges
 *   heading          rings a bolt hangs by (10): its top edge dips a little between each pair; 0 = a plain straight edge
 *   selvedge         0..1: a darker woven edge down both sides (default 0)
 *   mirror           true (default) | 'half' (the water mirrors every second bolt: a second draw call) | false
 *   drape            true or an object of defaults: THE CLOTH IS DRAPED (see "draped cloth" above): every bolt is cut fuller
 *                    than its line and hangs in deep folds fixed to the cloth, sagging between its pegs, its hem torn.
 *                    Without it nothing below applies and the cloth is the flat strip it always was. Each of these may
 *                    be given for the whole cloth (in `drape`) and again on any bolt, so that no two neighbours are alike:
 *                      full    0.2   the share of its own width its folds take up (0.02 nearly flat .. 0.7 gathered to a
 *                                    third). `width` stays the width it hangs to on its line: a fuller bolt is more cloth
 *                      pegs    4     pegs that hold it (2..9): a broad fold between each pair
 *                      sag     0.5   how far its top edge sags between two pegs (0 a taut heading .. 1 deep scallops)
 *                      fine    0.5   the finer folds that ride on the broad ones and grow toward the hem (0..1)
 *                      gather  0     -1..1: gathered toward its left or right side (deep folds there, spread flat at the other)
 *                      over    0     0..0.45: it is thrown over its line, not pegged: this share of it hangs behind
 *                      drop    0     -0.88..0.88: a top corner has come off its pegs: the last peg that holds is this share
 *                                    of its width in from the left (negative) or right edge; the corner hangs from it
 *                                    (0.3: a corner; 0.8: it hangs by one end, its top edge falling away like a limp flag)
 *                      tear    0     0..1: how torn its hem is (tatters, bites, fray; from 0.45 a rent runs up it)
 *                      skew    0     -1..1: its hem is cut on the slant (which side hangs longer)
 *                      taper   0.06  how much narrower it hangs at the hem (wet cloth clings); with it its edges wander a
 *                                    little. 0 for a curtain that must close against its neighbour
 *                      wet           its own wetness (default: `wet` above): a water line with a tide mark, darker below
 *                      hem, band     a second dye toward its hem (a colour) and where it begins (0..1 down it, default
 *                                    0.5): the line where it stood in the vat, bled and wicked, with its tide mark
 *                      mark          { cell, at: [across, down] (0..1), size (metres), flip }: a resist mark from `resist`
 *                      rod           false: this bolt has no rod although the cloth has (`rod` above)
 *                      face          1 | -1: which way its folds stand out (default: by its phase)
 *                      stiff         0..1 as before; on a draped cloth it works (see the note in docs/life/ribbons.md)
 *                      tie           { at: 0.5, side: 1, out: 0.3, tight: 0.22, slack: 0.3 }: SWEPT ASIDE AND TIED: `at` this
 *                                    share of its length below its line and `out` metres beyond its left (-1) or right
 *                                    (1) edge it is gathered to `tight` of its width and tied (to a mast, a post); its
 *                                    threads run from their pegs to the tie, the far edge taut, the near ones `slack`
 *                                    (0 all taut .. 1 sagging deep); below the tie it hangs in a tail. Not with over or drop.
 *                                    `tail` (0.62): the share of its width that tail spreads to again (0.3: a bunch)
 *                      rag     0     0..1: its hem hangs in rags: torn away by up to a metre, flaps of every width left hanging
 *                      pleats  1     how much of the cloth's `pleat` this bolt shows (0: none; a wet bolt 1.3)
 *                      crease  0     0..1: its folds are CREASED AT THE PEGS: a broad lobe between each pair of pegs, a sharp
 *                                    valley on each peg's line (0: the round fold; 1: wholly creased). Against the light a
 *                                    creased bolt shows one dark rib a fold, a round one two
 *                      fringe  0     0..1: how much of the cloth's `fringe` hangs from this bolt's hem (0: a clean hem)
 *                      uneven  0     0..1: its folds are uneven: every second one deeper here and shallower further down
 *                    For the whole cloth only: heading (0.35: metres at the top that get the first rows of the mesh),
 *                    line (0.05: the radius of the line a thrown cloth rolls over), lineAt (how high the middle of that
 *                    line is above the bolt's `position`; default -line: the top of the roll is at `position`),
 *                    rows (0.09: the share of rows there)
 *   steps            how many stretches a wind front builds a bolt from (default: segments[1])
 *   mirrorSegments   [across, down] for the mesh the water mirrors (with mirror: 'half' on a draped cloth): a soft mirror
 *                    needs no folds finer than a few columns can give
 *   resist           { map, grid: [3, 3], color: '#F3DDB0', strength: 0.85, tint: 0.25, lift, soft, thru }: a sheet of resist marks (white
 *                    where the cloth was bound and took no dye), cells counted from 1 in reading order; laid on bolts with
 *                    `mark`. tint: how much of the bolt's own dye a mark keeps (0: bare cloth .. 1: only paler).
 *                    lift (off unless given): A MARK IS PALER CLOTH, NOT PAINT: it is never lighter than `lift` times the
 *                    cloth beside it (1.9: on indigo a pale ring of indigo, not a white one); soft (0): how soft it is
 *                    read (levels of its picture: 1.5 blurs a hard line into a bled one); thru (0): how much more of
 *                    the light behind the cloth comes through a mark (0.5: against the light the ring glows)
 *   weave            { map, fine: 0.35, broad: 3.6, strength: 0.6, mottle: 1 }: a painted cloth tile for a draped cloth, read twice:
 *                    its red and green are two weaves (a bolt wears one or the other), repeating every `fine` metres;
 *                    its blue is the dyer's mottle, repeating every `broad` metres. Mean 0.62 (it is multiplied by 1.6)
 *   wetMap           { map, width: 2.4, height: 2.4, line: 0.6 }: a painted water line for a draped cloth: white where the
 *                    cloth is soaked, its line at `line` of the picture's height from the top, repeating sideways only
 *   pleat            { amount: 0.8, every: 1.1, edge: 0.07 }: a draped cloth clings to itself in narrow pleats, painted
 *                    (streaks of light and dark down it: it lies double in a pleat, darker, and lets less light through):
 *                    how strong; metres across the cloth in which their picture repeats; how wide a pleat's dark edge
 *                    (0..0.5). Off unless given: a draped cloth made without it is painted as it was
 *   thru             0.25: how much more of the light behind it soaked cloth lets through (a draped cloth's `clothThru`)
 *   form             { dark: 0.9, lobe: 0.12, deep: 0.9, thru: 0.45, lobeThru: 0.25, hem: 0.5, tatter: 0.6 }: the form of a draped cloth's folds
 *                    painted as a painter models drapery: a light on every lobe (`lobe`), a dark gathered into the valley and
 *                    where the weave turns from the eye (`dark`), which is deeper in the cloth's own colour before it is darker
 *                    (`deep`: the shade of gold cloth is orange, then red, never brown); a valley lets less of the light behind
 *                    it through (`thru`), the middle of a lobe more (`lobeThru`), the frayed edge of the hem more (`hem`), a tatter more (`tatter`). Off unless given
 *   fringe           true or { count: 14, length: 0.6, width: 0.045 }: a draped cloth's torn hems carry a FRINGE: up to `count`
 *                    tatters and threads a bolt (thin strips of the mesh: two triangles each), the longest `length` metres,
 *                    `width` metres wide where they leave the hem; most end in a point, some are strips of the cloth itself.
 *                    They hang the way the cloth falls there, stir, stream with it in a wind, and are kept out of the painter's
 *                    filter. Each bolt says how much of it its hem carries (`fringe` on the bolt). Not in the water's mirror
 *   bleed            true or { width: 1.5, runs: 1, stain: 0.15 }: a draped cloth's dips BLED: a bolt's second dye (`hem`, `band`)
 *                    begins over `width` metres, not at a line, the upper dye coming down in runs and the lower wicked up in
 *                    fingers `runs` times that long, with a `stain` where the two lie over one another. Off unless given
 * Returns { object, mesh, material, wind, gust(position, strength, width), setColor(i, color), setHem(i, color),
 *   hung (draped: how each bolt hangs), hemPoints(i, n) -> the n lowest tips of bolt i's hem at rest [{ x, y, z, across }],
 *   coarse(segments) -> the same bolts on a coarser mesh (for a mask) }.
 *   gust: `position` is a point (THREE.Vector3 or [x, y, z]) where the wind is now; cloth near it lifts. Move it every frame.
 *   For a front that runs the length of a nave and holds the cloth up, use the wind: wind.front({ from: { s: 30 }, speed: 17 }).
 */
export function makeCloth(a0, a1, a2, a3) {
  const old = !!(a0 && a0.renderer && a0.scene);                 // makeCloth(engine, ctx, bolts, opts)
  const ctx = old ? a1 : a0, engine = old ? a0 : a0.engine, bolts = old ? a2 : a1, opts = (old ? a3 : a2) || {};
  const o = { map: null, uvScale: 3, backlight: 0.9, sway: 0.35, speed: 0.5, part: true, segments: [10, 24], brush: 0.8, wind: null, lift: null, water: null, wet: 0, hem: false, rod: null, heading: 0, selvedge: 0, mirror: true, drape: null, steps: null, resist: null, weave: null, wetMap: null, mirrorSegments: null, pleat: null, thru: 0.25, form: null, fringe: null, bleed: null, ...opts };
  const rod = o.rod ? { color: '#3a2a30', thick: 0.045, past: 0.06, ...(o.rod === true ? {} : o.rod) } : null;
  const lift = { angle: 1.3, bend: 0.6, flutter: 0.25, belly: 0.09, ...(o.lift || {}) };
  const wind = o.wind || sharedWind(ctx);
  const clock = lifeClock(ctx);
  const S = gouacheShared(engine), n = bolts.length;
  // each bolt's own phase (it also carries how stiff it is), the same number on the script's side and in the shader
  const phaseOf = (b, i) => (b.phase ?? ((Math.sin(i * 127.1 + b.position[0] * 311.7 + b.position[2] * 74.7) * 43758.5453) % 1 + 1) % 1 * 20);
  // a draped cloth: how each bolt hangs, worked out once (the shader gets the same numbers as attributes); a mesh whose
  // rows stand closer at the top and at the hem; on low quality, fewer columns
  const D0 = o.drape ? { ...DRAPE_DEFAULTS, rod: !!rod, ...(o.drape === true ? {} : o.drape) } : null;
  const hung = D0 ? bolts.map((b, i) => hangOf(b, D0, Math.fround(phaseOf(b, i)), o.wet, !!rod)) : null;
  const segs = D0 && clock.density < 0.7 ? [Math.max(8, Math.round(o.segments[0] * 0.6)), o.segments[1]] : o.segments;
  const base = D0 ? hangingGrid(segs[0], drapeRows(segs[1], D0.rows)) : new THREE.PlaneGeometry(1, 1, o.segments[0], o.segments[1]);
  if (!D0) base.translate(0, -0.5, 0);   // hangs down from y = 0
  if (rod) {
    // the rod in the hem: one more strip, told apart by its y (-2 along its top, -3 along its bottom); the shader hangs it from the hem
    const ax = segs[0], bp = base.attributes.position, n0 = bp.count, pos = new Float32Array((n0 + (ax + 1) * 2) * 3), uv = new Float32Array((n0 + (ax + 1) * 2) * 2), idx = Array.from(base.index.array);
    pos.set(bp.array); uv.set(base.attributes.uv.array);
    for (let j = 0; j < 2; j++) for (let i = 0; i <= ax; i++) { const k = n0 + j * (ax + 1) + i; pos.set([i / ax - 0.5, -2 - j, 0], k * 3); uv.set([i / ax, 0], k * 2); }
    for (let i = 0; i < ax; i++) { const a = n0 + i, b = a + 1, c = a + ax + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
    base.setAttribute('position', new THREE.BufferAttribute(pos, 3)); base.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); base.setIndex(idx);
  }
  // (third look) THE FRINGE of a draped cloth: `count` thin strips more, each of four vertices told apart by their y (-4:
  // where a tatter leaves the hem; -5: its tip). x: where along the hem it hangs (the shader moves each bolt's about); uv:
  // which strip it is, and which of its two edges this vertex is on. Dead strips (a bolt with little fringe) close to nothing
  const fringe = D0 && o.fringe ? { count: 14, length: 0.6, width: 0.045, ...(o.fringe === true ? {} : o.fringe) } : null;
  if (fringe) {
    const N = Math.max(1, Math.round(fringe.count)), bp = base.attributes.position, n0 = bp.count, pos = new Float32Array((n0 + N * 4) * 3), uv = new Float32Array((n0 + N * 4) * 2), idx = Array.from(base.index.array);
    pos.set(bp.array); uv.set(base.attributes.uv.array);
    for (let k = 0; k < N; k++) for (let j = 0; j < 4; j++) { const v = n0 + k * 4 + j; pos.set([(k + 0.5) / N - 0.5, j < 2 ? -4 : -5, 0], v * 3); uv.set([k + 1, j % 2 ? 1 : -1], v * 2); }
    for (let k = 0; k < N; k++) { const a = n0 + k * 4; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    base.setAttribute('position', new THREE.BufferAttribute(pos, 3)); base.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); base.setIndex(idx);
    fringe.count = N;
  }
  const colors = [];
  const instances = (list, grid = base) => {
    const geo = new THREE.InstancedBufferGeometry(), m = list.length;
    geo.index = grid.index; geo.setAttribute('position', grid.attributes.position); geo.setAttribute('uv', grid.attributes.uv);
    const aPos = new Float32Array(m * 3), aSize = new Float32Array(m * 4), aColor = new Float32Array(m * 3);
    list.forEach((i, j) => {
      const b = bolts[i];
      aPos.set(b.position, j * 3); aSize.set([b.width, b.length, b.turn ?? 0, phaseOf(b, i) + (b.stiff && !D0 ? 1000 * b.stiff : 0)], j * 4);
      const c = col(b.color ?? '#ffffff'); aColor.set([c.r, c.g, c.b], j * 3);
    });
    const posAttr = new THREE.InstancedBufferAttribute(aPos, 3);
    geo.setAttribute('aPos', posAttr); geo.setAttribute('aSize', new THREE.InstancedBufferAttribute(aSize, 4));
    const colorAttr = new THREE.InstancedBufferAttribute(aColor, 3); geo.setAttribute('aColor', colorAttr);
    geo.instanceCount = m;
    colors.push({ attr: colorAttr, pos: posAttr, at: new Map(list.map((i, j) => [i, j])) });
    if (D0) {
      const aDrape = new Float32Array(m * 4), aHang = new Float32Array(m * 4), aDress = new Float32Array(m * 4), aDye2 = new Float32Array(m * 4), aMark = new Float32Array(m * 4), aTie = new Float32Array(m * 4), aMore = new Float32Array(m * 4), aForm = new Float32Array(m * 4);
      list.forEach((i, j) => {
        const h = hung[i], mk = h.mark;
        aDrape.set([h.c0, h.n1, h.sag, h.fine], j * 4); aHang.set([h.over > 0 ? 1 + h.over : h.drop, h.stiff, h.tear, h.skew], j * 4);
        aDress.set([h.wet, h.taper, h.face * (h.rod ? 2 : 1), h.band], j * 4); aDye2.set([h.hem.r, h.hem.g, h.hem.b, h.g], j * 4);
        aMark.set(mk ? [mk.cell || 0, mk.at ? mk.at[0] : 0.5, mk.at ? mk.at[1] : 0.4, (mk.size ?? 1.6) * (mk.flip ? -1 : 1)] : [0, 0.5, 0.5, 1], j * 4);
        const T = h.tie; aTie.set(T ? [T.at, T.side, T.out, T.tight] : [0, 1, 0, 1], j * 4); aMore.set([h.rag, h.pleats, T ? T.slack : 0, h.crease], j * 4); aForm.set([h.fringe, h.uneven, T && T.tail != null ? T.tail : 0.62, 0], j * 4);
      });
      const dyeAttr = new THREE.InstancedBufferAttribute(aDye2, 4);
      geo.setAttribute('aDrape', new THREE.InstancedBufferAttribute(aDrape, 4)); geo.setAttribute('aHang', new THREE.InstancedBufferAttribute(aHang, 4));
      geo.setAttribute('aDress', new THREE.InstancedBufferAttribute(aDress, 4)); geo.setAttribute('aDye2', dyeAttr); geo.setAttribute('aMark', new THREE.InstancedBufferAttribute(aMark, 4));
      geo.setAttribute('aTie', new THREE.InstancedBufferAttribute(aTie, 4)); geo.setAttribute('aMore', new THREE.InstancedBufferAttribute(aMore, 4)); geo.setAttribute('aForm', new THREE.InstancedBufferAttribute(aForm, 4));
      colors[colors.length - 1].dye2 = dyeAttr;
    }
    return geo;
  };
  if (o.map) { o.map.wrapS = o.map.wrapT = THREE.RepeatWrapping; o.map.needsUpdate = true; }
  const wc = o.water ? { current: [0, -1], strength: 0.25, wake: 0.6, float: 0.5, ...o.water } : null;
  const mat = new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    defines: { CLOTH_STEPS: Math.max(2, Math.round(o.steps ?? o.segments[1])), ...(D0 ? { DRAPE: '' } : {}), ...(D0 && o.resist && o.resist.map ? { RESIST: '' } : {}), ...(D0 && o.resist && o.resist.map && o.resist.lift != null ? { RESIST_LIFT: '' } : {}), ...(D0 && o.weave && o.weave.map ? { WEAVE: '' } : {}), ...(D0 && o.wetMap && o.wetMap.map ? { WETMAP: '' } : {}), ...(D0 && o.pleat ? { PLEAT: '' } : {}), ...(D0 && o.form ? { FORM: '' } : {}), ...(fringe ? { FRINGE: '' } : {}), ...(D0 && hung.some((h) => h.crease > 0 || h.uneven > 0) ? { CREASE: '' } : {}), ...(D0 && hung.some((h) => h.tie && h.tie.tail != null) ? { TAIL: '' } : {}), ...(D0 && o.bleed ? { BLEED: '' } : {}), ...(o.map ? { USE_MAP: '' } : {}), ...(o.part ? { PART: '' } : {}), ...(wc ? { TRAIL: '' } : {}), ...(o.wind ? { BREEZE: '' } : {}), ...(o.hem ? { HEM: '' } : {}), ...(rod ? { ROD: '' } : {}) },
    uniforms: {
      uTime: S.uTime, uFogColor: S.uFogColor, uFogDensity: S.uFogDensity, uCameraPos: S.uCameraPos, uBoat: S.uBoat,
      uKeyDir: S.uKeyDir, uKeyColor: S.uKeyColor, uRampShadow: S.uRampShadow, uRampLight: S.uRampLight, uSkyLight: S.uSkyLight, uGroundLight: S.uGroundLight,
      uLanternPos: S.uLanternPos, uLanternColor: S.uLanternColor, uLanternRadius: S.uLanternRadius, uLampPos: S.uLampPos, uLampColor: S.uLampColor, uLampRadius: S.uLampRadius,
      uLights: S.uLights, uLightColors: S.uLightColors, uLightCount: S.uLightCount,
      tBrush: S.tBrush, tMap: { value: o.map }, uUvScale: { value: 1 / o.uvScale }, uBrush: { value: o.brush },
      uSway: { value: new THREE.Vector2(o.sway, o.speed) }, uBack: { value: o.backlight },
      uGust: { value: new THREE.Vector4(0, -1000, 0, 0) }, uGustWidth: { value: 14 }, uBoatHeading: { value: 0 },
      ...wind.uniforms, ...waterUniforms(engine),
      uLift: { value: new THREE.Vector4(lift.angle, lift.bend, lift.flutter, lift.belly) },
      uTrail: { value: wc ? new THREE.Vector4(wc.current[0] * wc.strength, wc.current[1] * wc.strength, wc.wake, wc.float) : new THREE.Vector4() },
      uWet: { value: o.wet },
      uRod: { value: new THREE.Vector4(rod ? rod.past : 0, rod ? rod.thick : 0, rod ? 1 : 0, o.selvedge) }, uRodColor: { value: col(rod ? rod.color : '#3a2a30').clone() },
      uHead: { value: new THREE.Vector2(o.heading ? 0.05 : 0, o.heading || 10) },
      ...(D0 ? {
        uRows: { value: new THREE.Vector4(D0.rows, D0.heading, D0.line, D0.lineAt ?? -D0.line) },
        tResist: { value: o.resist && o.resist.map ? o.resist.map : null },
        uResist: { value: new THREE.Vector4(o.resist && o.resist.grid ? o.resist.grid[0] : 3, o.resist && o.resist.grid ? o.resist.grid[1] : 3, (o.resist && o.resist.strength) ?? 0.85, (o.resist && o.resist.tint) ?? 0.25) },
        uResistColor: { value: col((o.resist && o.resist.color) || '#F3DDB0').clone() },
        uResistB: { value: new THREE.Vector4((o.resist && o.resist.lift) ?? 0, (o.resist && o.resist.soft) ?? 0, (o.resist && o.resist.thru) ?? 0, 0) },
        tWeave: { value: o.weave && o.weave.map ? o.weave.map : null },
        uWeave: { value: new THREE.Vector4(1 / ((o.weave && o.weave.fine) || 0.35), 1 / ((o.weave && o.weave.broad) || 3.6), (o.weave && o.weave.strength) ?? 0.6, (o.weave && o.weave.mottle) ?? 1) },
        tWet: { value: o.wetMap && o.wetMap.map ? o.wetMap.map : null },
        uWetMap: { value: new THREE.Vector4(1 / ((o.wetMap && o.wetMap.width) || 2.4), 1 / ((o.wetMap && o.wetMap.height) || 2.4), (o.wetMap && o.wetMap.line) ?? 0.6, 0) },
        uPleat: { value: new THREE.Vector4(o.pleat ? (o.pleat.amount ?? 0.8) : 0, 1 / ((o.pleat && o.pleat.every) || 1.1), (o.pleat && o.pleat.edge) ?? 0.07, o.thru ?? 0.25) },
        uForm: { value: new THREE.Vector4((o.form && o.form.dark) ?? 0.9, (o.form && o.form.lobe) ?? 0.12, (o.form && o.form.deep) ?? 0.9, (o.form && o.form.thru) ?? 0.45) },
        uFormB: { value: new THREE.Vector4((o.form && o.form.hem) ?? 0.5, (o.form && o.form.tatter) ?? 0.6, (o.form && o.form.lobeThru) ?? 0.25, 0) },
        uFringe: { value: new THREE.Vector4(0, fringe ? fringe.length : 0, fringe ? fringe.width : 0, fringe ? fringe.count : 1) },
        uBleed: { value: new THREE.Vector4((o.bleed && o.bleed.width) ?? 1.5, (o.bleed && o.bleed.runs) ?? 1, (o.bleed && o.bleed.stain) ?? 0.15, 0) },
      } : {}),
    },
    vertexShader: /* glsl */`
      attribute vec3 aPos, aColor; attribute vec4 aSize;
      uniform float uTime, uGustWidth, uBoatHeading; uniform vec2 uSway, uHead; uniform vec4 uGust, uLift, uTrail, uRod; uniform vec3 uBoat;
      varying vec3 vWPos, vWNormal, vColor, vViewPos; varying vec2 vUv2; varying float vDown, vHang, vRod, vAcross;
      ${WIND_GLSL}
      ${CLOTH_FRONT_GLSL}
      ${D0 ? DRAPE_VERT_GLSL : ''}
      #ifdef TRAIL
        ${WATER_GLSL}
      #endif
      vec3 place(vec2 q, out float down) {
        float stiff = floor(aSize.w / 1000.0) > 0.5 ? fract(aSize.w / 1000.0) : 0.0; float ph = mod(aSize.w, 1000.0);
        #ifdef DRAPE
          stiff = aHang.y;
          vec3 p = drapeHang(q, ph, stiff, down);              // fuller than its line: deep fixed folds, a sag between pegs, a torn hem
          float free = pow(down, 1.4) * (1.0 - stiff);
        #else
        down = -q.y;                                           // 0 at the pinned top .. 1 at the hem
        float free = pow(down, 1.4) * (1.0 - stiff);
        vec3 p = vec3(q.x * aSize.x, q.y * aSize.y, 0.0);
        float swing = uSway.x * uLifeWindB.z;                  // halved for a rider who asked for calm
        #ifdef BREEZE
          swing *= lifeBreeze(aPos.xz);                        // the area's air: it comes and goes
        #endif
        // slow folds travelling down the cloth, and a lazy swing of the whole hem
        float fold = sin(uTime * uSway.y * 2.1 + ph + down * 5.0 + q.x * 2.4) * 0.5 + sin(uTime * uSway.y * 1.3 + ph * 1.7 + down * 2.2) * 0.5;
        p.z += fold * swing * free;
        // pleats: cloth hung from a line gathers into soft vertical folds, deeper toward the hem (a rod in the hem pulls them out again)
        p.z += (sin(q.x * 8.5 + ph * 3.0) * 0.045 + sin(q.x * 19.0 + ph * 1.3 + down * 1.5) * 0.016) * aSize.x * (0.35 + 0.65 * free) * (1.0 - uRod.z * smoothstep(0.78, 1.0, down));
        // hung by rings: the top edge dips a little between each pair
        p.y -= uHead.x * abs(sin(3.14159265 * uHead.y * (q.x + 0.5))) * pow(max(1.0 - down, 0.0), 14.0);
        p.x += sin(uTime * uSway.y * 0.8 + ph * 0.6 + down * 3.0) * swing * 0.25 * free;
        #endif
        float cs = cos(aSize.z), sn = sin(aSize.z);
        vec3 w = vec3(p.x * cs + p.z * sn, p.y, -p.x * sn + p.z * cs) + aPos;
        // a gust passing: the cloth lifts and streams away from the wind
        vec3 gd = w - uGust.xyz; float g = exp(-dot(gd.xz, gd.xz) / (uGustWidth * uGustWidth)) * uGust.w * free;
        w.y += g * aSize.y * 0.22; w.x += g * sin(ph) * 0.6 + g * 1.2; w.z += g * cos(ph * 1.3) * 0.6;
        // a wind front: every thread of the cloth swings downwind on an arc, keeping its length, and stays there for as
        // long as the wind holds (CLOTH_FRONT_GLSL above: the hem of a long bolt comes up last and runs on past its place;
        // held, it heaves and ripples; when the wind drops it falls, ballooning, and swings before it hangs). Each bolt
        // takes the front a moment early or late, so a rank never lifts like a ruled line.
        float S = uLifeFront.w * (1.0 - stiff) * uLifeWindB.z;
        if (S > 0.002) {
          vec2 fxz = aPos.xz + uLifeFront.xy * (fract(ph * 0.618) - 0.5) * 3.0;
          float L = aSize.y;
          if (clothFrontOn(fxz, L)) {
            vec2 tang; float lifted;
            float Phi = uLift.x * min(S, 1.3) * (0.82 + 0.3 * fract(ph * 7.31));
            vec2 P = clothArc(q.x, down, L, max(L * uLift.y, 0.4), Phi, fxz, ph, uLift.z * clamp(L / 5.5, 0.5, 2.0), tang, lifted);
            // its middle fills like a sail, more as each gust crosses it; the rod keeps its hem straight
            float belly = uLift.w * clamp(lifted, 0.0, 1.0) * sin(3.14159 * clamp(q.x + 0.5, 0.0, 1.0)) * sin(3.14159 * min(down * 1.15, 1.0)) * aSize.x;
            P += vec2(-tang.y, tang.x) * belly;
            w += vec3(uLifeFront.x, 0.0, uLifeFront.y) * P.x + vec3(0.0, P.y + down * L, 0.0);
          }
        }
        #ifdef PART
          // the prow parts whatever hangs in its way: push sideways from the boat's line and lift a little
          vec2 fwd = vec2(-sin(uBoatHeading), -cos(uBoatHeading));
          vec2 rel = w.xz - uBoat.xz; float along = dot(rel, fwd), across = rel.x * fwd.y - rel.y * fwd.x;
          float near = smoothstep(3.4, 0.2, abs(along - 0.4)) * smoothstep(1.7, 0.0, abs(across)) * smoothstep(3.0, 1.0, w.y) * free;
          vec2 side = vec2(fwd.y, -fwd.x) * (across >= 0.0 ? 1.0 : -1.0);
          w.xz += side * near * 1.25; w.y += near * 0.55;
        #endif
        #ifdef TRAIL
          // what trails in the water streams with the current, half floats, and sways with every ring that passes
          float under = clamp(-w.y, 0.0, 4.0), wash = smoothstep(1.4, 0.0, w.y) * free;
          vec2 slope = waterRipple(w.xz).xy;
          w.xz += uTrail.xy * under * (0.75 + 0.25 * sin(uTime * 0.6 + ph + q.x * 2.0)) + slope * uTrail.z * wash;
          w.y += under * uTrail.w;
        #endif
        return w;
      }
      void main() {
        float down, d2;
        vec2 q = position.xy; vRod = 0.0;
        #ifdef FRINGE
          // THE FRINGE: tatters and threads that hang from the torn hem. Each strip of the mesh finds its own place along this
          // bolt's hem, its own length and width (most are short; most end in a point, some are strips of the cloth itself);
          // a bolt with little fringe shows few of them (the rest close to nothing). Where it leaves the cloth it is set a
          // few centimetres INTO it, on the cloth's own surface, so that no thread hangs in the air under a torn hem.
          vFringe = 0.0;
          float fOn = step(q.y, -3.5), fTip = step(q.y, -4.5), fLen = 0.0, fCurl = 0.0, fH = 0.0;
          if (fOn > 0.5) {
            float fph = mod(aSize.w, 1000.0);
            fH = fract(sin(uv.x * 12.9898 + fph * 4.1414) * 43758.5453);
            float fh2 = fract(fH * 17.31 + 0.37), fh3 = fract(fH * 131.7 + 0.11), fh4 = fract(fH * 977.3 + 0.71);
            float fAlive = step(fh2, aForm.x), fStrip = step(0.74, fh4), fWc = aSize.x / aDrape.x;
            float fW = uFringe.z * (0.35 + 0.65 * fh4) * (1.0 + 1.8 * fStrip) * fAlive;
            fLen = uFringe.y * (0.08 + 0.92 * fh3 * fh3 * fh3) * (0.5 + 0.9 * aForm.x) * (1.0 - 0.4 * fStrip) * fAlive;
            fCurl = (fract(fH * 5.77) - 0.5) * 0.4;
            float fSide = uv.y * mix(1.0, 0.6 * fStrip, fTip);              // a thread ends in a point, a strip in a narrower end
            q = vec2(clamp(q.x + (fH - 0.5) * 0.8 / uFringe.w, -0.485, 0.485) + fSide * 0.5 * fW / fWc, -1.0);
          }
        #endif
        #ifdef ROD
          // the rod: its strip sits at the hem, stands out past both edges, and hangs below along the cloth's own fall
          vRod = step(q.y, -1.5);
          float low = step(q.y, -2.5);
          if (vRod > 0.5) q = vec2(q.x * (1.0 + 2.0 * uRod.x / aSize.x), -1.0);
          #ifdef DRAPE
            if (vRod > 0.5 && abs(aDress.z) < 1.5) q.x = 0.0;      // this bolt has no rod: its strip closes to nothing
          #endif
        #endif
        #ifdef DRAPE
          q.y = -drapeEnds(q, mod(aSize.w, 1000.0), gToHem);       // its torn hem is cut in the mesh: rows beyond it close up onto it
          #ifdef FRINGE
            if (fOn > 0.5 && fTip < 0.5) {                         // where a tatter leaves the cloth: 5 cm up from the hem, in the cloth
              float fo = aHang.x > 1.0 ? aHang.x - 1.0 : 0.0, fV0 = aSize.y * fo / (1.0 - fo), fHead = fo > 0.0 ? fV0 : min(uRows.y, 0.1 * aSize.y);
              q.y += 0.05 * (1.0 - uRows.x) / max(aSize.y + fV0 - fHead, 0.5); gToHem = 0.05;
            }
          #endif
        #endif
        vec3 w = place(q, down);
        #ifdef DRAPE
          // what the painter needs of a draped cloth: where this is in the cloth itself, and whether a fold stands toward the eye
          vCloth = gCloth; vFold = gFold; vTorn = vec4(aHang.z, gToHem, aDress.x, aDress.w); vDye2 = vec4(aDye2.rgb, aMore.y); vMark = aMark;
          vFold.y *= dot(cameraPosition - aPos, vec3(sin(aSize.z), 0.0, cos(aSize.z))) < 0.0 ? -1.0 : 1.0;
          vec3 wx = place(q + vec2(0.004, 0.0), d2), wy = place(q + vec2(0.0, -0.004), d2);
        #else
        vec3 wx = place(q + vec2(0.02, 0.0), d2), wy = place(q + vec2(0.0, -0.02), d2);
        #endif
        vWNormal = normalize(cross(wx - w, wy - w));
        #ifdef FRINGE
          if (fOn > 0.5) {
            // its tip hangs the way the cloth itself falls there (with its sway, and with the wind when a front holds it), a
            // little aside, and stirs; a hem in the water shows none
            vec3 fFall = normalize(wy - w), fAcross = normalize(wx - w);
            fLen *= smoothstep(0.05, 0.3, w.y);
            w += fTip * (fFall * fLen + fAcross * fLen * (fCurl + 0.06 * sin(uTime * (1.1 + fH) + fH * 40.0) * uLifeWindB.z));
            vFringe = fTip;
          }
        #endif
        #ifdef ROD
          if (vRod > 0.5) w += normalize(wy - w) * (uRod.y * low) - vWNormal * 0.004;
        #endif
        vAcross = q.x;
        vWPos = w; vColor = aColor; vUv2 = vec2(q.x * aSize.x, q.y * aSize.y) + mod(aSize.w, 1000.0) * 3.7; vDown = down * aSize.y; vHang = down;
        #ifdef DRAPE
          vUv2 = vec2(vCloth.x, -vCloth.y) + mod(aSize.w, 1000.0) * 3.7;      // the paint lies in the cloth, not on its line
        #endif
        vec4 mv = viewMatrix * vec4(w, 1.0); vViewPos = mv.xyz;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uFogColor, uKeyDir, uKeyColor, uRampShadow, uRampLight, uSkyLight, uGroundLight, uLanternPos, uLanternColor, uLampPos, uLampColor, uCameraPos;
      uniform float uFogDensity, uLanternRadius, uLampRadius, uBrush, uUvScale, uBack, uWet; uniform vec4 uRod; uniform vec3 uRodColor;
      uniform vec4 uLights[${MAX_LIGHTS}]; uniform vec3 uLightColors[${MAX_LIGHTS}]; uniform int uLightCount;
      uniform sampler2D tBrush, tMap;
      varying vec3 vWPos, vWNormal, vColor, vViewPos; varying vec2 vUv2; varying float vDown, vHang, vRod, vAcross;
      float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); vec2 h = vec2(127.1, 311.7);
        float a = fract(sin(dot(i, h)) * 43758.5), b = fract(sin(dot(i + vec2(1.0, 0.0), h)) * 43758.5), c = fract(sin(dot(i + vec2(0.0, 1.0), h)) * 43758.5), d = fract(sin(dot(i + vec2(1.0, 1.0), h)) * 43758.5);
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y); }
      vec3 pointLight(vec3 pos, vec3 color, float radius, vec3 N) { vec3 d = pos - vWPos; float dist = length(d); float att = 1.0 - smoothstep(radius * 0.25, radius, dist); att *= att; return color * att * (abs(dot(N, d / max(dist, 1e-3))) * 0.6 + 0.4); }
      ${D0 ? DRAPE_FRAG_GLSL : ''}
      void main() {
        vec3 N = normalize(vWNormal); vec3 V = normalize(uCameraPos - vWPos);
        if (dot(N, V) < 0.0) N = -N;
        vec3 albedo = vColor;
        #ifdef DRAPE
          // a draped cloth: a second dye toward the hem, in the line where it stood in the vat (level, bled, wicked up in
          // fingers, with its tide mark); the bands of every dip; the runs of the dye. (Its torn hem is cut in the mesh.)
          float cU = vCloth.x, cV = vCloth.y, cL = vCloth.z, cW = vCloth.w, cR = vFold.x, cV0 = vFold.z, sd = vFold.w, lenF = cL - cV0;
          float toHem = vTorn.y;                                               // metres of cloth below this point
          float clothThru = 1.0, hang = clamp(cR / lenF, 0.0, 1.0);
          #ifdef FORM
            float clothShade = 0.0;                                           // (form) how far this place is modelled dark, 0..1: for an area's own light (the reach tints its shade toward the next dye)
          #endif
          vec2 cq = vec2(cU, cV) + sd * 3.7;
          #ifdef WEAVE
            // (its unevenness is read from the painted mottle: four looks at a picture cost far less than eight runs of the hash)
            float nA = clothMot(cq * vec2(0.19, 0.08)), nB = clothMot(cq * vec2(0.85, 0.28) + 0.31), nC = clothMot(vec2(cq.x * 0.55, sd * 0.137)), nD = 1.0 - nA;
            float nRun = 0.78 + 0.44 * clothMot(cq * vec2(0.4, 0.02) + 0.6);
          #else
            float nA = vn(cq * vec2(1.1, 0.45)), nB = vn(cq * vec2(5.0, 1.7)), nC = vn(vec2(cq.x * 3.3, sd)), nD = vn(cq * vec2(0.8, 0.5) + 9.0);
            float nRun = (0.84 + 0.3 * vn(vec2(cq.x * 2.2, cq.y * 0.12))) * (0.9 + 0.2 * vn(vec2(cq.x * 9.0, cq.y * 0.3)));
          #endif
          float twoDyes = step(vTorn.w, 1.2), dB = cR - vTorn.w * lenF + 0.4 * (nA - 0.5) + 0.12 * (nB - 0.5) + 0.5 * nC * nC * nC * nC;
          #ifdef BLEED
            // (fifth look) THE DIP BLED. The second dye does not begin at a line: where the cloth stood in the vat the two run into
            // one another over metres, the upper dye coming down in long runs and the lower wicked up in fingers (the dyer's
            // mottle drawn out along the cloth), and where they lie over one another the cloth is a little deeper: a stain, not a rule
            #ifdef WEAVE
              float bA = clothMot(vec2(cq.x * 0.9, cq.y * 0.03 + 0.2)), bB = clothMot(vec2(cq.x * 2.3 + 0.4, cq.y * 0.05));
            #else
              float bA = vn(vec2(cq.x * 5.0, cq.y * 0.2)), bB = vn(vec2(cq.x * 13.0 + 4.0, cq.y * 0.3));
            #endif
            float bW = uBleed.x * (0.35 + 0.5 * nA), bM = smoothstep(-bW, bW, dB + uBleed.x * uBleed.y * (2.0 * (bA - 0.5) + (bB - 0.5)));
            albedo = mix(albedo, vDye2.rgb, bM * twoDyes);
            albedo *= 1.0 - uBleed.z * 4.0 * bM * (1.0 - bM) * twoDyes;
          #else
          albedo = mix(albedo, vDye2.rgb, smoothstep(-0.2, 0.2, dB) * twoDyes);
          albedo *= 1.0 - 0.22 * clothTide(dB, 0.11) * twoDyes;
          #endif
          float l1 = (0.24 + 0.22 * fract(sd * 0.37)) * lenF, l2 = (0.58 + 0.2 * fract(sd * 0.91)) * lenF;
          float dD1 = cR - l1 + 0.3 * (nA - 0.5) + 0.08 * (nB - 0.5), dD2 = cR - l2 + 0.3 * (nD - 0.5) + 0.08 * (nB - 0.5);
          albedo *= 1.07 - 0.10 * smoothstep(-0.15, 0.15, dD1) - 0.10 * smoothstep(-0.15, 0.15, dD2) - 0.07 * clothTide(dD1, 0.1) - 0.07 * clothTide(dD2, 0.1);
          albedo *= nRun;
          #ifdef WEAVE
            // its weave, painted (one of two, by the bolt), and the dyer's mottle
            vec3 wv = texture2D(tWeave, vUv2 * uWeave.x).rgb;
            albedo *= mix(1.0, mix(wv.r, wv.g, step(0.5, fract(sd * 1.7))) * 1.6, uWeave.z) * mix(1.0, texture2D(tWeave, vUv2 * uWeave.y + 0.37).b * 1.6, uWeave.w);
          #endif
        #endif
        #ifdef USE_MAP
          albedo *= texture2D(tMap, vUv2 * uUvScale).rgb * 1.6;
        #endif
        float stroke = clamp((texture2D(tBrush, vUv2 * 0.31).r - 0.52) * 5.0, -1.0, 1.0);
        albedo *= 1.0 + stroke * 0.14 * uBrush;
        #if !(defined(DRAPE) && defined(WEAVE))
        albedo *= 0.86 + 0.26 * vn(vUv2 * vec2(0.9, 0.35));                      // dye never takes quite evenly
        #endif
        // wet cloth is darker toward the hem, in an uneven band; a rolled hem is a darker line along the bottom
        #ifdef DRAPE
          // wet: a water line with its tide mark, darker below it and letting more light through; the hem wet, frayed, darker
          float wetK = vTorn.z;
          #ifdef WETMAP
            // the water line as painted: blooms where it wicked, runs above it
            float wv_ = clamp(uWetMap.z + (cR - lenF * (1.0 - 0.62 * wetK)) * uWetMap.y, 0.01, 0.99);
            float soaked = texture2D(tWet, vec2(cU * uWetMap.x + sd * 0.37, 1.0 - wv_)).r * smoothstep(0.0, 0.3, wv_) * step(0.02, wetK), tideW = 0.0;
          #else
            float dW = cR - lenF * (1.0 - 0.62 * wetK) + 0.45 * (nD - 0.5) + 0.1 * (nB - 0.5);
            float soaked = smoothstep(-0.1, 0.12, dW) * step(0.02, wetK), tideW = 0.1 * clothTide(dW, 0.115) * step(0.02, wetK);
          #endif
          albedo *= 1.0 - wetK * 0.2 * smoothstep(0.3, 1.0, hang) - 0.28 * soaked - tideW;
          clothThru *= 1.0 + uPleat.w * soaked;
          albedo *= 1.0 - 0.32 * (1.0 - smoothstep(0.0, 0.05 + 0.04 * vTorn.x, toHem)) * (1.0 - vRod);
          // thrown over its line it hangs double as far as its short end reaches: half the light comes through
          float dbl = cV0 > 0.0 ? (cR < 0.0 ? 1.0 : 1.0 - smoothstep(cV0 - 0.1, cV0 + 0.05, cR + 0.3 * (nA - 0.5))) : 0.0;
          clothThru *= 1.0 - 0.55 * dbl; albedo *= 1.0 - 0.1 * dbl;
          // (resist marks lie IN the cloth: they are laid before its folds are modelled, so that a fold's shade crosses a mark)
          #ifdef RESIST
            // resist marks: where the cloth was bound the dye never reached
            vec2 mc = vec2((vMark.y - 0.5) * cW, cV0 + vMark.z * lenF), mp = (vec2(cU, cV) - mc) / abs(vMark.w);
            float ma = (fract(sd * 2.71) - 0.5) * 1.2, mca = cos(ma), msa = sin(ma);
            mp = vec2(mp.x * mca - mp.y * msa, mp.x * msa + mp.y * mca) * vec2(sign(vMark.w), 1.0) + 0.5;
            float mcell = floor(vMark.x + 0.5) - 1.0, mIn = step(0.5, vMark.x) * smoothstep(0.0, 0.1, min(min(mp.x, 1.0 - mp.x), min(mp.y, 1.0 - mp.y)));
            vec2 muv = (vec2(mod(mcell, uResist.x), floor(mcell / uResist.x)) + clamp(mp, 0.02, 0.98)) / uResist.xy;
            #ifdef RESIST_LIFT
              // (resist.lift, soft, thru) A MARK IS PALER CLOTH, NOT PAINT: where it was bound the cloth took less dye. It is read
              // soft (a coarser level of its picture); it is never lighter than lift times the cloth beside it (on a dark dye
              // a pale ring of that dye, not a white one); and more of the light behind the cloth comes through it
              float mk = texture2D(tResist, vec2(muv.x, 1.0 - muv.y), uResistB.y).r * mIn * uResist.z;
              vec3 mBare = uResistColor * (0.92 + 0.16 * nB) * mix(vec3(1.0), albedo / max(max(albedo.r, albedo.g), max(albedo.b, 1e-3)), uResist.w);
              albedo = mix(albedo, mBare * min(1.0, max(max(albedo.r, albedo.g), max(albedo.b, 1e-3)) * uResistB.x / max(max(mBare.r, mBare.g), max(mBare.b, 1e-3))), mk);
              clothThru *= 1.0 + uResistB.z * mk;
            #else
            float mk = texture2D(tResist, vec2(muv.x, 1.0 - muv.y)).r * mIn * uResist.z;
            albedo = mix(albedo, uResistColor * (0.92 + 0.16 * nB) * mix(vec3(1.0), albedo / max(max(albedo.r, albedo.g), max(albedo.b, 1e-3)), uResist.w), mk);
            #endif
          #endif
          // the form of its folds, in any light: deeper in a valley, lighter on a crest, darker where the weave turns from the eye
          #ifdef FORM
            // PAINTED AS A PAINTER MODELS DRAPERY: a broad light on every lobe; a dark that gathers into the valley and lies where
            // the weave turns from the eye; and the dark is DEEPER IN THE CLOTH'S OWN COLOUR before it is darker (the shade of a
            // gold cloth is orange, then red: never brown). A valley stands in its neighbours' shade: less of the light behind
            // the cloth comes through it. The frayed edge of the hem is thin: more comes through it.
            float fTurn = pow(abs(dot(N, normalize(vec3(V.x, 0.0, V.z) + 1e-4))), 1.5);
            float fIn = smoothstep(0.0, 1.0, -vFold.y), fOut = smoothstep(0.1, 1.0, vFold.y);
            float fDark = clamp(uForm.x * (0.6 * fIn * fIn + 0.4 * (1.0 - fTurn)), 0.0, 1.0), fMax = max(albedo.r, max(albedo.g, albedo.b));
            clothShade = fDark;
            albedo = pow(max(albedo, vec3(1e-4)), vec3(1.0 + uForm.z * fDark * fMax)) * (1.0 - 0.45 * fDark * (1.0 - 0.5 * uForm.z * fMax)) * (1.0 + uForm.y * fOut);
            clothThru *= (1.0 - uForm.w * fIn * fIn) * (1.0 + uFormB.z * fOut) * (1.0 + uFormB.x * (1.0 - smoothstep(0.0, 0.14, toHem)));
            #ifdef FRINGE
              clothThru *= 1.0 + uFormB.y * vFringe;
            #endif
          #else
          albedo *= (0.55 + 0.52 * pow(abs(dot(N, normalize(vec3(V.x, 0.0, V.z) + 1e-4))), 1.5)) * (1.0 - 0.3 * smoothstep(0.1, 1.0, -vFold.y)) * (1.0 + 0.1 * smoothstep(0.2, 1.0, vFold.y));
          #endif
          #ifdef PLEAT
            // WET CLOTH CLINGS TO ITSELF: narrow pleats run down it from its pegs, wander, die out and begin again (they are
            // painted: read from the dyer's mottle drawn out along the cloth). In a pleat the cloth lies double: darker from
            // the front, and less of the light behind it comes through. More of them where the cloth is gathered: in the
            // valley of a fold, and where it has been swept aside; none at arm's length beyond what can be told apart.
            #ifdef WEAVE
              float pw = cq.x + 0.03 * sin(cq.y * 0.5 + sd * 5.0);       // (a pleat hangs plumb, or nearly: wavy streaks are the grain of a plank)
              float pA = texture2D(tWeave, vec2(pw * uPleat.y + 0.17, cq.y * 0.04)).b, pB = texture2D(tWeave, vec2(pw * uPleat.y * 2.7 + 0.5, cq.y * 0.07 + 0.3)).b;
              pA = clamp((pA - 0.62) * 2.6 + 0.5, 0.0, 1.0); pB = clamp((pB - 0.62) * 2.6 + 0.5, 0.0, 1.0);
            #else
              float pw = cq.x + 0.03 * sin(cq.y * 0.5 + sd * 5.0);
              float pA = vn(vec2(pw * uPleat.y * 7.0, cq.y * 0.3)), pB = vn(vec2(pw * uPleat.y * 17.0, cq.y * 0.5 + 3.0));
            #endif
            float pTold = 1.0 - smoothstep(0.12, 0.4, fwidth(cq.x * uPleat.y) * 8.0);      // can its pleats be told apart from here?
            float pOpen = smoothstep(0.2, 0.8, 0.58 * pA + 0.42 * pB), pEdge = (1.0 - smoothstep(0.0, uPleat.z, abs(pA - 0.5))) * pTold;
            float pl = pOpen * (1.0 - 0.35 * pEdge), pk = clamp(uPleat.x * vDye2.a * (0.7 + 0.3 * smoothstep(-0.2, 0.8, -vFold.y)), 0.0, 1.0);
            albedo = pow(max(albedo, vec3(1e-4)), vec3(1.0 + 0.28 * (1.0 - pl) * pk)) * mix(1.0, 0.92 + 0.1 * pl, pk);      // (deeper in its own colour, hardly darker: light comes through the layers of a pleat: pale cloth turns gold in its pleats, not brown)
            clothThru *= mix(1.0, 0.3 + 1.0 * pl, pk);
          #endif
        #else
        albedo *= 1.0 - uWet * 0.45 * smoothstep(0.45 + 0.2 * vn(vUv2 * vec2(1.7, 0.2)), 1.0, vHang);
        #endif
        #if defined(HEM) && !defined(DRAPE)
          albedo *= 1.0 - 0.3 * smoothstep(0.045, 0.02, vDown / max(vHang, 1e-3) * (1.0 - vHang));
        #endif
        albedo *= 1.0 - uRod.w * 0.3 * smoothstep(0.468, 0.495, abs(vAcross));     // the selvedge: a closer, darker weave down both edges
        float through = pow(max(dot(V, uKeyDir), 0.0), 2.0) * (0.25 + 0.75 * pow(abs(dot(N, uKeyDir)), 1.5));
        #ifdef DRAPE
          through *= clothThru;
        #endif
        if (vRod > 0.5) { albedo = uRodColor * (0.85 + 0.3 * stroke); through = 0.0; }                // the rod is timber: no light comes through it
        float w = clamp(dot(N, -uKeyDir) * 0.5 + 0.5 + stroke * 0.08, 0.0, 1.0);
        vec3 shade = w < 0.5 ? mix(uRampShadow, vec3(1.0), smoothstep(0.0, 0.5, w)) : mix(vec3(1.0), uRampLight * uKeyColor, smoothstep(0.5, 1.0, w));
        vec3 c = albedo * shade * 0.85 + albedo * mix(uGroundLight, uSkyLight, N.y * 0.5 + 0.5) * 0.8;
        // lit from behind: the light comes through the weave and the cloth becomes the brightest colour in the picture
        // the folds show: where the weave turns edge-on to the light less comes through
        c += albedo * uRampLight * uKeyColor * through * uBack * 1.7;
        vec3 lamps = pointLight(uLanternPos, uLanternColor, uLanternRadius, N) + pointLight(uLampPos, uLampColor, uLampRadius, N);
        for (int i = 0; i < ${MAX_LIGHTS}; i++) { if (i >= uLightCount) break; lamps += pointLight(uLights[i].xyz, uLightColors[i], uLights[i].w, N); }
        c += albedo * lamps;
        float dist = length(vViewPos); float fog = 1.0 - exp(-uFogDensity * uFogDensity * dist * dist);
        gl_FragColor = vec4(mix(c, uFogColor, fog), 1.0);
        #if defined(DRAPE) && defined(FRINGE)
          if (vFringe > 0.04) gl_FragColor.a = -15.0;                // a tatter is thin: the painter's filter leaves it as drawn (CRISP_ALPHA, gouache.js)
        #endif
      }`,
  });
  const all = bolts.map((_, i) => i);
  const mesh = new THREE.Mesh(instances(all), mat);
  mesh.name = 'cloth'; mesh.frustumCulled = false;
  ctx.add(mesh);
  if (o.mirror === 'half' && n > 1) {                              // the water mirrors every second bolt: half the work in that pass
    ctx.only(mesh, 'direct');
    // (a draped cloth may give the mirror a coarser mesh: `mirrorSegments`)
    const m2 = new THREE.Mesh(instances(all.filter((i) => i % 2 === 0), D0 && o.mirrorSegments ? hangingGrid(o.mirrorSegments[0], drapeRows(o.mirrorSegments[1], D0.rows)) : base), mat); m2.name = 'cloth-mirror'; m2.frustumCulled = false;
    ctx.add(m2); ctx.only(m2, 'mirror');
  } else if (o.mirror === false) ctx.only(mesh, 'direct');
  ctx.onUpdate(() => { mat.uniforms.uBoatHeading.value = engine.boat.heading; });
  return {
    object: mesh, mesh, material: mat, wind, count: n,
    gust(position, strength = 1, width = 14) { const p = position.isVector3 ? position : new THREE.Vector3(position[0], position[1], position[2]); mat.uniforms.uGust.value.set(p.x, p.y, p.z, strength); mat.uniforms.uGustWidth.value = width; },
    setColor(i, color) { const c = col(color); for (const set of colors) { const j = set.at.get(i); if (j !== undefined) { set.attr.setXYZ(j, c.r, c.g, c.b); set.attr.needsUpdate = true; } } },
    /** A draped cloth: how each bolt hangs (its fullness, pegs, tear ...: read only), or null. */
    hung,
    /**
     * The same bolts on a coarser mesh: a geometry that shares every bolt's attributes with the cloth's own (so it moves
     * and hangs with it) but has `segments` columns and rows. For a pass that needs the cloth's shape and not its
     * folds (a mask, a shadow): draw it with the cloth's material or one made from its vertex shader. Draped cloth only.
     */
    coarse(segments = [12, 10]) {
      if (!D0) return mesh.geometry;
      const grid = hangingGrid(segments[0], drapeRows(segments[1], D0.rows)), g = new THREE.InstancedBufferGeometry(), src = mesh.geometry;
      g.index = grid.index; g.setAttribute('position', grid.attributes.position); g.setAttribute('uv', grid.attributes.uv);
      for (const name of Object.keys(src.attributes)) if (name !== 'position' && name !== 'uv') g.setAttribute(name, src.attributes[name]);
      g.instanceCount = src.instanceCount;
      return g;
    },
    /** The second dye of bolt i (a draped cloth's `hem`). */
    setHem(i, color) { const c = col(color); for (const set of colors) { const j = set.at.get(i); if (j !== undefined && set.dye2) { set.dye2.setXYZ(j, c.r, c.g, c.b); set.dye2.needsUpdate = true; } } },
    /**
     * Where bolt i's hem hangs at rest: its n lowest tips in the realm's coordinates, lowest first, [{ x, y, z, across }]
     * (across: 0..1 along the hem). A draped cloth's torn hem is found by the same function the shader cuts it by: drips
     * fall from these, and a thing caught on a hem hangs here. (At rest: the sway and the wind are not in it.)
     */
    hemPoints(i, n = 3) {
      const b = bolts[i]; if (!b) return [];
      if (hung) return drapeHem(b, hung[i], n, D0);
      const th = b.turn ?? 0, cs = Math.cos(th), sn = Math.sin(th);
      return Array.from({ length: n }, (_, k) => { const x = ((k + 0.5) / n - 0.5) * b.width; return { x: b.position[0] + x * cs, y: b.position[1] - b.length, z: b.position[2] - x * sn, across: (k + 0.5) / n }; });
    },
    /** Move bolt i: the middle of its top edge goes to [x, y, z] (a fly cloth that travels: call it every frame it moves). */
    setPosition(i, p) {
      const b = bolts[i]; if (!b) return;
      b.position[0] = p[0]; b.position[1] = p[1]; b.position[2] = p[2];
      for (const set of colors) { const j = set.at.get(i); if (j !== undefined) { set.pos.setXYZ(j, p[0], p[1], p[2]); set.pos.needsUpdate = true; } }
    },
    /**
     * How far the wind's front has bolt i lifted now: 0 hanging .. about 1 held at full strength (times the front's
     * strength and what the bolt's `stiff` leaves of it; a little over 1 as it runs on past its place, a little under 0
     * as it swings after the drop). The same number the shader lifts its hem by: 1.3 x this is its angle from the plumb
     * line in radians. For light and sound that must agree with the picture.
     */
    held(i) {
      const b = bolts[i]; if (!b) return 0;
      const F = wind.state, ph = phaseOf(b, i), calm = clock.calm ? 0.5 : 1, s = Math.min(1.3, F.strength) * (1 - (b.stiff || 0)) * calm;
      if (s <= 0.002) return 0;
      const off = (fract(ph * 0.618) - 0.5) * 3;
      return s * clothLiftNow(F, ctx.time, b.position[0] + F.nx * off, b.position[2] + F.nz * off, b.length, lift.angle * s * (0.82 + 0.3 * fract(ph * 7.31)));
    },
  };
}

// ------------------------------------------------------------------------------------------------ the festoon curtain
/**
 * A festoon curtain: one great cloth, sewn with rings down its back, drawn up by lines that run through them. As the
 * lines come in, the hem rises at each line and hangs in a scallop between each pair; the cloth below each ring is
 * gathered ring upon ring into deep swags, and the cloth above hangs undisturbed in its pleats. Nothing stretches:
 * the folds are fixed to the cloth, and the cloth's own fullness is what the swags are made of. opts:
 *   at: [x, y, z]     the middle of its top edge (the realm's coordinates); turn: radians about the vertical (0 = it faces +z)
 *   width, height     metres (the theatre's: 25 by 14.5)
 *   lines             how many lines draw it up (9), the outermost `margin` metres in from each side (default 0: a line
 *                     in each side hem; with a margin, the cloth beyond the outermost line hangs from it as a soft tail)
 *   travel            metres the lines can be drawn up (11); rise: metres they are drawn up to begin with
 *   sag: [down, up]   how deep each scallop hangs between its lines when the curtain is down and when it is up ([0.3, 1.6])
 *   color, trim       its colour, and the colour of a band along its hem (null for none); backlight (0: velvet lets nothing through)
 *   rings             metres between the rings on a line (0.55); pack: how much of its height gathered cloth keeps (0.2)
 *   pleat             metres of fullness in its hanging pleats (0.13); stir: metres it stirs in still air (0.03)
 *   segments          [across, down] (default [96, 56])
 *   wind              the area's wind: a front streams the swags
 *   material          more kit.gouache options (caustics for water-light on its foot)
 * Returns {
 *   object, material
 *   rise(to, seconds, { lag, catchAt, hold })   draw the lines up (or let them down) to `to` metres over `seconds`, eased;
 *                         lag: the last line starts this many seconds after the first; catchAt: metres at which it catches
 *                         for `hold` seconds (default 0.5) and goes on. The swags swing twice after it stops. Returns the
 *                         seconds the whole movement takes
 *   set(metres)           at once (a cue's settle)
 *   line(i)               metres line i is drawn up now; lines: how many
 *   hemAt(across)         the height above the water of the hem, `across` metres from the middle (what it has uncovered)
 *   moving                true while it travels
 * }
 */
export function makeFestoon(ctx, opts = {}) {
  const { kit } = ctx, clock = lifeClock(ctx);
  const o = { at: [0, 14, 0], turn: 0, width: 25, height: 14.5, lines: 9, margin: null, travel: 11, rise: 0, sag: [0.3, 1.6], color: '#1f4a3e', trim: '#8a6c34', backlight: 0, rings: 0.55, pack: 0.2, pleat: 0.13, stir: 0.03,
    segments: [96, 56], wind: null, material: {}, parent: null, ...opts };
  const wind = o.wind || sharedWind(ctx);
  const N = Math.max(2, Math.min(16, o.lines)), gap = (o.width - 2 * Math.max(0, o.margin ?? 0)) / (N - 1);
  let [sx, sy] = o.segments; if (clock.density < 0.7) { sx = Math.round(sx * 0.6); sy = Math.round(sy * 0.7); }
  const geo = new THREE.PlaneGeometry(1, 1, sx, sy); geo.translate(0, -0.5, 0);
  const lines = new Float32Array(16).fill(o.rise);
  const U = {
    ...wind.uniforms,
    uFestLines: { value: lines }, uFest: { value: new THREE.Vector4(o.width, o.height, N, gap) },
    uFestB: { value: new THREE.Vector4(o.sag[0], o.sag[1], o.travel, o.pack) }, uFestC: { value: new THREE.Vector4(o.rings, o.pleat, 0, o.stir) },
    uFestPos: { value: new THREE.Vector4(o.at[0], o.at[1], o.at[2], o.turn) }, uFestTrim: { value: col(o.trim || o.color).clone() }, uFestTrimOn: { value: o.trim ? 1 : 0 },
  };
  const mat = kit.gouache({ color: o.color, side: THREE.DoubleSide, brush: 0, backlight: o.backlight, ...o.material, extend: {
    uniforms: U,
    vertexPars: /* glsl */`
      uniform float uFestLines[16]; uniform vec4 uFest, uFestB, uFestC, uFestPos;
      varying vec4 vFest;
      ${WIND_GLSL}
      // where a point of the cloth is: q.x -0.5..0.5 across, q.y 0 at the top edge .. 1 at the hem. Returns its place in
      // the curtain's own frame (x across, y up from the top edge, z toward the house) and what the painter needs.
      vec3 festPoint(vec2 q, out vec4 info) {
        float W = uFest.x, H = uFest.y, n = uFest.z, gap = uFest.w, t = uLifeWind.w;
        float x = q.x * W, h0 = (1.0 - q.y) * H;                                   // metres above the hem, measured in the cloth
        float fx = (x + 0.5 * gap * (n - 1.0)) / gap, k = clamp(floor(fx), 0.0, n - 2.0), u = fx - k;
        float uc = clamp(u, 0.0, 1.0), us = uc * uc * (3.0 - 2.0 * uc);
        float lift = mix(uFestLines[int(k)], uFestLines[int(k) + 1], us);
        // beyond the outermost line the cloth has nothing to hold it up: it hangs from that line as a tail
        // (it droops no more than its own width lets it: a narrow margin is a soft corner, never a spike)
        float out_ = max(max(-u, u - 1.0), 0.0) * gap, tail = smoothstep(0.0, 1.0, out_ / max(0.5 * (W - gap * (n - 1.0)), 0.05));
        lift -= min(0.15 * lift * tail, 0.7 * out_);
        float S = mix(uFestB.x, uFestB.y, clamp(lift / max(uFestB.z, 0.01), 0.0, 1.0));   // how deep the scallops hang now
        float scal = 4.0 * uc * (1.0 - uc);                                         // 0 at a line, 1 midway between two
        float Lm = lift + uFestB.x * (1.0 - tail);                                  // how high the rings on the line have been drawn
        float c = uFestB.w, G = Lm / (1.0 - c);                                     // all the cloth below this (in its own length) is gathered
        float f = clamp(h0 / max(G, 1e-3), 0.0, 1.0), gathered = 1.0 - step(G, h0);
        float y = h0, z = 0.0, fold = 0.0;
        // hanging pleats: the cloth is cut fuller than its track; where a swag hangs, its fullness has been drawn out into the swag
        float drawn = gathered * scal * (1.0 - f) * clamp(S / max(uFestB.y, 0.01), 0.0, 1.0);
        float pl = sin(x * 13.96 + 1.3 * sin(x * 2.1)) * 0.75 + sin(x * 31.0 + 2.0) * 0.25;
        z += uFestC.y * pl * (0.55 + 0.45 * q.y) * (1.0 - 0.85 * drawn);
        if (gathered > 0.5) {
          y = Lm + c * G * f - S * scal * pow(1.0 - f, 1.3);
          // ring upon ring: between each pair of rings the cloth hangs out as a rounded fold, deepest midway between the lines
          float ph = h0 / uFestC.x, loop = 0.5 - 0.5 * cos(6.2831853 * ph);
          float env = (1.0 - smoothstep(0.72, 1.0, f)) * smoothstep(0.0, 0.6, G / uFestC.x);
          float depth = 0.42 * uFestC.x * sqrt(max(1.0 - c * c, 0.0));
          z += depth * loop * env * (0.45 + 0.55 * scal);
          y -= 0.22 * depth * sin(6.2831853 * ph) * env;                            // each fold droops over the one below
          z += 0.3 * S * scal * (1.0 - f) * env;                                     // and the whole swag bellies toward the house
          z += uFestC.z * scal * (1.0 - f);                                          // it swings when the lines stop
          fold = (1.0 - loop) * env;                                                // how deep in a fold's valley this is
        }
        // it is never quite still, and a wind front streams what is gathered
        z += uFestC.w * sin(t * 0.95 + x * 0.27) * (0.3 + 0.7 * q.y) * uLifeWindB.z * lifeBreeze(uFestPos.xz);
        info = vec4(x, h0, fold, gathered * (1.0 - f));
        return vec3(x, y - H, z);
      }`,
    vertexWorld: /* glsl */`{
      vec2 q = vec2(position.x, -position.y);
      vec4 info, i2; vec3 p = festPoint(q, info), px = festPoint(q + vec2(0.004, 0.0), i2), py = festPoint(q + vec2(0.0, 0.004), i2);
      float gust = lifeFront(uFestPos.xz) * uLifeWindB.z;
      float cs = cos(uFestPos.w), sn = sin(uFestPos.w);
      vec3 nl = normalize(cross(px - p, p - py));
      vec3 w3 = vec3(p.x * cs + p.z * sn, p.y, -p.x * sn + p.z * cs) + uFestPos.xyz;
      w3 += vec3(uLifeFront.x, 0.0, uLifeFront.y) * gust * (0.25 + 0.9 * info.w) * (1.0 + 0.3 * sin(uLifeWind.w * 2.3 + info.x)) * q.y;
      wp.xyz = w3; wn = vec3(nl.x * cs + nl.z * sn, nl.y, -nl.x * sn + nl.z * cs);
      vFest = info;
    }`,
    fragmentPars: /* glsl */`varying vec4 vFest; uniform vec3 uFestTrim; uniform float uFestTrimOn;
      float festN(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); vec2 h = vec2(127.1, 311.7);
        float a = fract(sin(dot(i, h)) * 43758.5), b = fract(sin(dot(i + vec2(1.0, 0.0), h)) * 43758.5), c = fract(sin(dot(i + vec2(0.0, 1.0), h)) * 43758.5), d = fract(sin(dot(i + vec2(1.0, 1.0), h)) * 43758.5);
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y); }`,
    albedo: /* glsl */`{
      // the nap of velvet, fixed to the cloth so it never slides or stretches; deeper where a fold turns under
      float nap = festN(vFest.xy * vec2(2.2, 0.55)) * 0.6 + festN(vFest.xy * vec2(9.0, 1.7)) * 0.4;
      albedo *= 0.82 + 0.3 * nap;
      albedo *= 1.0 - 0.32 * vFest.z;
      float band = (1.0 - smoothstep(0.1, 0.16, vFest.y)) * uFestTrimOn;
      albedo = mix(albedo, uFestTrim * (0.8 + 0.3 * festN(vFest.xy * vec2(40.0, 3.0))), band);
    }`,
  } });
  const mesh = new THREE.Mesh(geo, mat); mesh.name = 'festoon'; mesh.frustumCulled = false;
  (o.parent || ctx.group).add(mesh);
  // each line's travel: from, to, start, seconds, and one catch on the way
  const L = Array.from({ length: N }, () => ({ from: o.rise, to: o.rise, t0: -1e9, dur: 1, catchAt: null, hold: 0 }));
  let stopAt = -1e9, kickAmp = 0, moving = false;
  const lineAt = (l, t) => {
    const tau = t - l.t0;
    if (tau <= 0) return l.from; if (tau >= l.dur + l.hold) return l.to;
    if (l.catchAt == null) return l.from + (l.to - l.from) * inOut(clamp01(tau / l.dur));
    // two eased stretches with a catch between them: it slows, hangs for a moment, and goes on
    const pc = clamp01((l.catchAt - l.from) / ((l.to - l.from) || 1)), d1 = l.dur * (0.25 + 0.5 * pc), d2 = l.dur - d1;
    if (tau < d1) return l.from + (l.catchAt - l.from) * inOut(tau / d1);
    if (tau < d1 + l.hold) return l.catchAt;
    return l.catchAt + (l.to - l.catchAt) * inOut(clamp01((tau - d1 - l.hold) / d2));
  };
  const api = {
    object: mesh, material: mat, lines: N, wind,
    get moving() { return moving; },
    rise(to, seconds = 14, r = {}) {
      const t = ctx.time, lag = r.lag ?? 0, hold = r.catchAt != null ? (r.hold ?? 0.5) : 0;
      to = Math.max(0, Math.min(o.travel, to));
      L.forEach((l, i) => { const now = lineAt(l, t); l.from = now; l.to = to; l.t0 = t + lag * (N > 1 ? i / (N - 1) : 0); l.dur = Math.max(0.05, seconds); l.hold = hold;
        l.catchAt = r.catchAt != null && (r.catchAt - now) * (to - r.catchAt) > 0 ? r.catchAt : null; if (l.catchAt == null) l.hold = 0; });
      moving = true; kickAmp = Math.min(0.3, Math.abs(to - lineAt(L[0], t)) / Math.max(seconds, 0.1) * 0.25);
      stopAt = t + seconds + lag + hold;
      return seconds + lag + hold;
    },
    set(m) { m = Math.max(0, Math.min(o.travel, m)); for (const l of L) { l.from = l.to = m; l.t0 = -1e9; } lines.fill(m); moving = false; kickAmp = 0; U.uFestC.value.z = 0; return api; },
    line(i) { return lineAt(L[Math.max(0, Math.min(N - 1, i))], ctx.time); },
    hemAt(across) {
      const fx = (across + 0.5 * gap * (N - 1)) / gap, k = Math.max(0, Math.min(N - 2, Math.floor(fx))), u = clamp01(fx - k), us = u * u * (3 - 2 * u);
      const lift = lines[k] + (lines[k + 1] - lines[k]) * us, S = o.sag[0] + (o.sag[1] - o.sag[0]) * clamp01(lift / o.travel);
      return o.at[1] - o.height + lift + o.sag[0] - S * 4 * u * (1 - u);
    },
  };
  ctx.onUpdate(() => {
    const t = ctx.time;
    if (moving || t - stopAt < 8) {
      for (let i = 0; i < N; i++) lines[i] = lineAt(L[i], t);
      if (moving && t >= stopAt) moving = false;
      // the swags swing twice after the lines stop, and are still
      const since = t - stopAt;
      U.uFestC.value.z = since > 0 && since < 8 ? kickAmp * Math.exp(-since / 1.5) * Math.sin(since * Math.PI * 2 / 2.4) * (clock.calm ? 0.5 : 1) : 0;
    }
  });
  return api;
}

// ------------------------------------------------------------------------------------------------ gores on a turning wheel
/**
 * Cloth pegged along the arms of a great wheel (the dyers' dipping wheel). Each cloth is a gore: pegged along a rail on
 * its arm, short at the hub end and long at the rim end, and every thread of it hangs straight down from its own peg.
 * So as the arm turns the gore opens into a wide pane when the arm is level, shears, furls into a hanging bundle when
 * the arm stands upright, and opens again; at the bottom of its round its long end goes into the water. The shape is
 * exact: nothing is simulated. A wind front swings every gore out of the wheel's plane and holds it there. opts:
 *   hub: [x, y, z]     the middle of the axle;  axle: [x, z] the way the axle lies (the wheel's plane is square to it)
 *   angle              () => radians the wheel has turned (a machine's: () => wheel.angle), anticlockwise seen along -axle
 *   gores              [{ arm: radians (where its arm stands when the wheel's angle is 0), lane: metres along the axle
 *                         from the wheel's mid-plane (signed: which face, and which lane on it), top, hem: its two dyes }]
 *   rail: [4.5, 14]    metres from the hub at which the pegs begin and end
 *   length: [2.6, 12]  metres of cloth at the hub end and at the rim end
 *   floor              the height its hem is stopped at (default -0.4: in the water)
 *   sway (0.2 m), pleat (0.1 m: how deep it folds when furled), backlight (0.9), wind, segments ([20, 10])
 * Returns { object, material, setDye(i, top, hem), look({ tear, ribs }) (heavy wet cloth: ribs from the pegs, runs, a
 *   torn hem), covers(point, toward) -> the gore index a ray passes through, or -1 }.
 */
export function makeGores(ctx, opts = {}) {
  const { kit } = ctx;
  const o = { hub: [0, 15, 0], axle: [0, 1], angle: () => 0, gores: [], rail: [4.5, 14], length: [2.6, 12], floor: -0.4, sway: 0.2, pleat: 0.1, backlight: 0.9, wind: null, segments: [20, 10], material: {}, parent: null, ...opts };
  const wind = o.wind || sharedWind(ctx), n = o.gores.length, [ax, dn] = o.segments;
  const a2 = new THREE.Vector2(o.axle[0], o.axle[1]).normalize();
  const pos = new Float32Array((ax + 1) * (dn + 1) * 3), idx = [];
  for (let j = 0; j <= dn; j++) for (let i = 0; i <= ax; i++) pos.set([i / ax, j / dn, 0], (j * (ax + 1) + i) * 3);
  for (let j = 0; j < dn; j++) for (let i = 0; i < ax; i++) { const a = j * (ax + 1) + i, b = a + 1, c = a + ax + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
  const geo = new THREE.InstancedBufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setIndex(idx);
  const aArm = new Float32Array(n * 4), aTop = new Float32Array(n * 3), aHem = new Float32Array(n * 3);
  o.gores.forEach((g, i) => { aArm.set([g.arm ?? 0, g.lane ?? 0, (i * 0.618) % 1, 0], i * 4); const t = col(g.top ?? '#f3ddb0'), h = col(g.hem ?? g.top ?? '#f3ddb0'); aTop.set([t.r, t.g, t.b], i * 3); aHem.set([h.r, h.g, h.b], i * 3); });
  geo.setAttribute('aGore', new THREE.InstancedBufferAttribute(aArm, 4));
  const topAttr = new THREE.InstancedBufferAttribute(aTop, 3), hemAttr = new THREE.InstancedBufferAttribute(aHem, 3); geo.setAttribute('aGoreTop', topAttr); geo.setAttribute('aGoreHem', hemAttr);
  geo.instanceCount = n;
  const U = { ...wind.uniforms, uGoreHub: { value: new THREE.Vector3(o.hub[0], o.hub[1], o.hub[2]) }, uGoreAxle: { value: new THREE.Vector4(a2.x, a2.y, 0, o.floor) },
    uGoreRail: { value: new THREE.Vector4(o.rail[0], o.rail[1], o.length[0], o.length[1]) }, uGoreMore: { value: new THREE.Vector4(o.sway, o.pleat, 1.25, 0) },
    uGoreLook: { value: new THREE.Vector4(0, 0, o.rail[1] - o.rail[0], 0) }, uGoreLookB: { value: new THREE.Vector4(1.05, 0, 0, 0) }, uGoreLookC: { value: new THREE.Vector4(0, 0, 0, 0) },
    uGoreLookD: { value: new THREE.Vector4(0, 0, 0, 0) }, uGoreLookE: { value: new THREE.Vector4(0, 0.6, 0, 0) } };      // (look) runs, deep, strips, bleed; lobe, lobeVary, fine, (free)
  const mat = kit.gouache({ color: '#ffffff', side: THREE.DoubleSide, brush: 0, backlight: o.backlight, ...o.material, extend: {
    uniforms: U, defines: { CLOTH_STEPS: Math.max(2, dn) },
    vertexPars: /* glsl */`
      attribute vec4 aGore; attribute vec3 aGoreTop, aGoreHem; uniform vec3 uGoreHub; uniform vec4 uGoreAxle, uGoreRail, uGoreMore;
      varying vec4 vGore; varying vec3 vGoreTop, vGoreHem;
      ${WIND_GLSL}
      ${CLOTH_FRONT_GLSL}
      #ifdef GORE_LOOK
        uniform vec4 uGoreLookB;                                // (look) pegs to a metre of rail, metres its top edge sags between two pegs, metres its hem hangs ragged, how soaked
        uniform vec4 uGoreLookC;                                // (look) how uneven its folds and creases are
        uniform vec4 uGoreLookE;                                // (look) metres its lobes stand out between the pegs; how much they vary lower down; metres of finer folds on them
        float gorePeg(float gu, float sd) { return gu * uGoreLookB.x + 0.3 * sin(gu * 0.83 + sd * 2.0) + 0.17 * sin(gu * 2.1 + sd * 5.0); }      // whole numbers at its pegs: no two the same distance apart
        float goreBite(float gu, float sd) { return pow(0.5 + 0.5 * sin(gu * 1.3 + sd * 3.0) * sin(gu * 0.57 + sd * 5.0), 3.0) + 0.3 * abs(fract(gu * 0.37 + sd) - 0.5); }      // how far short its hem hangs here: broad bites, one end longer
      #endif
      vec3 gorePoint(vec2 q) {
        float a = aGore.x + uGoreAxle.z, t = uLifeWind.w, sd = aGore.z * 6.2831853;
        vec3 axd = vec3(uGoreAxle.x, 0.0, uGoreAxle.y), e1 = vec3(axd.z, 0.0, -axd.x);            // along the axle; across the wheel, on the level
        float R = mix(uGoreRail.x, uGoreRail.y, q.x), len = mix(uGoreRail.z, uGoreRail.w, q.x);
        // a cloth cut by hand: its hem is not a ruled line
        len *= 1.0 + 0.014 * sin(q.x * 17.0 + sd * 3.0) + 0.008 * sin(q.x * 7.0 + sd);
        vec3 peg = uGoreHub + (e1 * cos(a) + vec3(0.0, sin(a), 0.0)) * R + axd * aGore.y;
        float r = q.y * len, span = uGoreRail.y - uGoreRail.x;
        #ifdef GORE_LOOK
          // (look) pegged along its rail: between two pegs the top edge sags, and the cloth under a sag hangs lower by as
          // much; its hem hangs ragged (bitten in broad bites: the same sum the painter cuts its tatters from)
          float gu = q.x * span + sd, gpk = gorePeg(gu, sd);
          float gSag = uGoreLookB.y * pow(abs(sin(3.14159265 * gpk)), 0.75) * (0.55 + 0.45 * fract(sin(floor(gpk) * 12.9898 + sd) * 43758.5453));
          r = q.y * max(len - uGoreLookB.z * goreBite(gu, sd), 0.3 * len) + gSag;
        #endif
        // cloth hung from pegs falls in soft folds even when the pane is open; when the arm stands up the pane closes
        // and its whole width gathers into them, as deep as the lanes allow
        float shut = 1.0 - abs(cos(a)), grow = smoothstep(0.0, 0.2, q.y);
        float fold = uGoreMore.y * grow * ((0.25 + 0.5 * shut) * sin(q.x * span * 2.9 + sd * 3.2) + (0.15 + 0.1 * shut) * sin(q.x * span * 6.3 + sd * 1.7 + q.y * 1.4));
        #ifdef GORE_LOOK
          // (look({ uneven })) no fold as deep as its neighbour, nor as deep at the hem as under its pegs: here the wet cloth
          // clings flat, there it is gathered (a row of even flutes is a sheet of iron)
          fold *= mix(1.0, (0.1 + 1.7 * (0.5 + 0.5 * sin(gu * 0.41 + sd * 4.0 + 1.7 * sin(q.y * 2.1 + gu * 0.13)))) * (0.45 + 0.55 * sin(gu * 0.17 - q.y * 1.3 + sd * 9.0)), uGoreLookC.x);
          // (look({ lobe })) HEAVY WET CLOTH HANGS OUT BETWEEN ITS PEGS: from one peg to the next it stands out of the gore's
          // plane in a lobe (outward only: its neighbours on this face hang in lanes a hand's breadth off), drawn back to the
          // rail on each peg's line; no two lobes as deep, and lower down they run into one another and part again; finer
          // folds ride on them (fine), closer together where the pane is half shut
          if (uGoreLookE.x > 0.0) {
            float lb = 0.5 - 0.5 * cos(6.2831853 * gpk), lown = fract(sin(floor(gpk) * 78.233 + sd) * 43758.5453);
            float lw = 0.5 + 0.5 * sin(gu * 0.9 + q.y * 3.1 + sd * 7.0);
            float lobes = uGoreLookE.x * (0.5 + 0.5 * lown) * pow(lb, 0.8) * mix(1.0, 0.3 + 0.7 * lw, uGoreLookE.y * smoothstep(0.1, 0.7, q.y));
            float lfine = uGoreLookE.z * (0.5 + 0.5 * sin(gu * 7.9 + 1.3 * sin(gu * 1.7 + sd * 3.0) + q.y * 2.3)) * (0.4 + 0.6 * lw) * smoothstep(0.15, 0.6, q.y);
            fold = clamp(fold + (lobes + lfine) * smoothstep(0.0, 0.14, q.y), -0.05, uGoreLookE.x + uGoreLookE.z + 0.02);
          }
        #endif
        // the gores of a face sway together (their lanes are close), each a little in its own time, and a slow wave runs down each
        float sway = uGoreMore.x * q.y * (0.6 * sin(t * 0.6 + sign(aGore.y) * 1.3) + 0.25 * sin(t * 0.41 + sd) + 0.15 * sin(q.y * 4.0 - t * 1.1 + sd * 2.0 + q.x * 2.0)) * uLifeWindB.z;
        vec3 p = peg - vec3(0.0, r, 0.0) + axd * (fold + sway) * sign(aGore.y + 1e-4);
        // a wind front: every thread swings out of the wheel's plane on an arc and is held there. Each peg takes the
        // front as it reaches it, and a long thread comes up later than a short one: the rose opens from its heart outward
        float S = uLifeFront.w * uLifeWindB.z;
        if (S > 0.002 && clothFrontOn(peg.xz, len)) {
          vec2 tang; float lifted;
          vec2 P = clothArc(q.x - 0.5, q.y, len, max(len * 0.55, 0.4), uGoreMore.z * min(S, 1.3) * (0.9 + 0.2 * aGore.z), peg.xz, sd * 5.0, 0.3 * clamp(len / 5.5, 0.5, 2.0), tang, lifted);
          p += vec3(uLifeFront.x, 0.0, uLifeFront.y) * P.x + vec3(0.0, P.y + r, 0.0);
        }
        p.y = max(p.y, uGoreAxle.w);                                                              // stopped at the water
        return p;
      }`,
    vertexWorld: /* glsl */`{
      vec2 q = position.xy; vec3 p = gorePoint(q), px = gorePoint(q + vec2(0.01, 0.0)), py = gorePoint(q + vec2(0.0, 0.01));
      wp.xyz = p; wn = normalize(cross(px - p, py - p) + vec3(uGoreAxle.x, 0.0, uGoreAxle.y) * 1e-4);
      vGore = vec4(q, aGore.z, max(p.y, 0.0)); vGoreTop = aGoreTop; vGoreHem = aGoreHem;
    }`,
    fragmentPars: /* glsl */`varying vec4 vGore; varying vec3 vGoreTop, vGoreHem;
      float goreN(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); vec2 h = vec2(127.1, 311.7);
        float a = fract(sin(dot(i, h)) * 43758.5), b = fract(sin(dot(i + vec2(1.0, 0.0), h)) * 43758.5), c = fract(sin(dot(i + vec2(0.0, 1.0), h)) * 43758.5), d = fract(sin(dot(i + vec2(1.0, 1.0), h)) * 43758.5);
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y); }
      #ifdef GORE_LOOK
        uniform vec4 uGoreLook, uGoreRail, uGoreLookB, uGoreLookC, uGoreLookD;          // (uGoreLookD: how strong its runs of dye, how deep it glows, metres its hem hangs in strips, how far its dip bled)
        // how torn its hem, how deep its ribs, metres of rail, how strong its pleats; the rail and the lengths; pegs to a metre, sag, ragged hem, how soaked; how uneven its creases
        float goreTri(float x) { return abs(fract(x) - 0.5) * 2.0; }
        float gorePeg(float gu, float sd) { return gu * uGoreLookB.x + 0.3 * sin(gu * 0.83 + sd * 2.0) + 0.17 * sin(gu * 2.1 + sd * 5.0); }      // whole numbers at its pegs: no two the same distance apart
        float goreBite(float gu, float sd) { return pow(0.5 + 0.5 * sin(gu * 1.3 + sd * 3.0) * sin(gu * 0.57 + sd * 5.0), 3.0) + 0.3 * abs(fract(gu * 0.37 + sd) - 0.5); }      // how far short its hem hangs here: broad bites, one end longer
        float gGoreThru = 1.0;                                  // how much of the light behind it this place of the gore lets through beside its neighbours
        float gGoreThin = 0.0;                                  // 1 on a thread of its hem and at a flap's ragged end: kept out of the painter's filter
        #define CLOTH_THRU gGoreThru
      #endif`,
    albedo: /* glsl */`{
      // dip-dyed: one dye above, another below, meeting in a soft uneven line near the middle; darker and wetter toward the hem
      // (the line is where the cloth stood in the vat: level, a little uneven, and bled: never a row of teeth)
      float edge = vGore.y + 0.16 * (goreN(vec2(vGore.x * 3.4 + vGore.z * 17.0, vGore.y * 1.1)) - 0.5) + 0.05 * (goreN(vec2(vGore.x * 11.0 + vGore.z * 5.0, vGore.y * 2.0)) - 0.5);
      albedo = mix(vGoreTop, vGoreHem, smoothstep(0.36, 0.66, edge)) * (0.84 + 0.3 * goreN(vec2(vGore.x * 14.0, vGore.y * 5.0 + vGore.z * 9.0)));
      albedo *= 1.0 - 0.35 * smoothstep(0.55, 1.0, vGore.y);
      #ifdef GORE_LOOK
        // HEAVY WET CLOTH (handle.look). Pegged along its rail, it hangs from every peg in a crease: sharp under the peg,
        // broad and soft lower down, wandering; between two pegs a wide lobe; lower down it gathers in folds of its own, here
        // and there. Its long end has been through the river: soaked to a tide line (level in the cloth, bled, wicked up in
        // fingers), darker and deeper in its dye below it. The dye has run down it. Its hem is torn: bitten (in the mesh),
        // tattered and frayed (here: cut, never blended).
        // (look({ bleed })) THE DIP BLED: the two dyes of a gore run into one another over metres, not at a line: the upper
        // comes down in runs, the lower has wicked up in fingers, and where they lie over one another the cloth is deeper
        if (uGoreLookD.w > 0.0) {
          float bA = goreN(vec2(vGore.x * 33.0 + vGore.z * 17.0, vGore.y * 1.3)), bB = goreN(vec2(vGore.x * 90.0 + vGore.z * 5.0, vGore.y * 2.1 + 3.0));
          float bM = smoothstep(0.36 - 0.24 * uGoreLookD.w, 0.66 + 0.22 * uGoreLookD.w, edge + uGoreLookD.w * (0.34 * (bA - 0.5) + 0.14 * (bB - 0.5)));
          albedo = mix(vGoreTop, vGoreHem, bM) * (0.84 + 0.3 * goreN(vec2(vGore.x * 14.0, vGore.y * 5.0 + vGore.z * 9.0))) * (1.0 - 0.35 * smoothstep(0.55, 1.0, vGore.y)) * (1.0 - 0.5 * bM * (1.0 - bM));
        }
        float gSd = vGore.z * 6.2831853, gU = vGore.x * uGoreLook.z, gu = gU + gSd, gs = vGore.z * 37.0, gx = gU + gs;
        float gLen0 = mix(uGoreRail.z, uGoreRail.w, vGore.x), gLen = max(gLen0 - uGoreLookB.z * goreBite(gu, gSd), 0.3 * gLen0), gD = vGore.y * gLen, gHem = gLen - gD;
        float gTorn = uGoreLook.x * (0.3 * goreTri(gx * 2.6 + 0.35 * sin(gx * 1.7)) * (0.55 + 0.45 * sin(gx * 4.3)) + 0.55 * pow(goreTri(gx * 1.9 + 0.3 * sin(gx * 0.7)), 6.0) + 0.06 * goreTri(gx * 11.0));
        if (gHem < gTorn) discard;
        // (look({ strips })) ITS HEM HANGS IN STRIPS: the last stretch of the gore is slit into flaps, each its own width and
        // length, its end cut on the slant and ragged; the slits open downward; and here and there a thread hangs on below
        // (cut, never blended; the threads and the flaps' ends are kept out of the painter's filter: gGoreThin)
        if (uGoreLookD.z > 0.0) {
          float sMax = uGoreLookD.z * min(1.0, 0.16 * gLen0), sDown = sMax - (gHem - gTorn);      // metres below the line where the tearing begins
          if (sDown > 0.0) {
            float sc1 = gx * 1.9 + 0.7 * sin(gx * 0.8 + gs), sc2 = gx * 11.0 + 1.3 * sin(gx * 2.3);      // flaps a forearm wide, threads a finger wide
            float sh1 = fract(sin(floor(sc1) * 12.9898 + gs) * 43758.5453), sh1b = fract(sh1 * 17.31 + 0.37), sh2 = fract(sin(floor(sc2) * 78.233 + gs) * 43758.5453), sh2b = fract(sh2 * 31.7 + 0.11);
            float sf1 = fract(sc1), sl1 = sMax * (0.2 + 0.8 * sh1);
            float sSlit = 0.03 + 0.2 * (sDown / sMax) * (0.4 + 0.6 * sh1b);                                       // half the slit beside it, in shares of the flap
            float sEnd = sl1 * (0.68 + 0.32 * (sh1b < 0.5 ? sf1 : 1.0 - sf1)) - 0.07 * goreTri(gx * 8.0 + gs) * (0.5 + 0.5 * sin(gx * 3.1 + gs));      // its end: on the slant, and ragged
            float sFlap = min(1.0 - 2.0 * sSlit - abs(2.0 * sf1 - 1.0), (sEnd - sDown) * 4.0);                    // above 0: on the flap
            float sl2 = sMax * (0.3 + 0.9 * sh2b) * step(0.62, sh2);
            float sThread = min(0.26 * pow(max(1.0 - sDown / max(sl2, 1e-3), 0.0), 0.5) - abs(2.0 * fract(sc2) - 1.0), sl2 - sDown);      // above 0: on a thread
            if (sFlap <= 0.0 && sThread <= 0.0) discard;
            gGoreThin = max(step(sFlap, 0.0), 1.0 - smoothstep(0.0, 0.25, sFlap));
          }
        }
        // the crease under each peg, each its own depth
        float gpk = gorePeg(gu, gSd), gNear = abs(fract(gpk + 0.5) - 0.5), gOwn = fract(sin(floor(gpk + 0.5) * 12.9898 + gSd) * 43758.5453);
        float gW = 0.045 + 0.14 * smoothstep(0.2, 7.0, gD);
        float gCrease = (1.0 - smoothstep(0.0, gW, abs(gNear + 0.05 * sin(gD * 0.5 + gOwn * 40.0) * smoothstep(0.5, 5.0, gD)))) * (0.4 + 0.6 * gOwn) * (1.0 - 0.6 * (1.0 - gOwn) * smoothstep(0.5 * gLen, gLen, gD));
        // (look({ uneven })) a crease is not a rule from peg to hem: most are faint, each dies out at its own depth, one in
        // four runs the whole length and is deep
        float gOwn2 = fract(gOwn * 17.31 + 0.37), gDie = gLen * (0.18 + 0.9 * gOwn2);
        gCrease *= mix(1.0, (0.2 + 1.3 * gOwn * gOwn) * (1.0 - smoothstep(0.65 * gDie, gDie, gD)), uGoreLookC.x);
        // folds of its own lower down: here and there, and only as near as they can be told apart
        float gFp = gu * 2.6 + 1.8 * goreN(vec2(gu * 0.9 + gs, gD * 0.1));
        float gFineOn = smoothstep(0.15, 0.6, gD / gLen) * smoothstep(0.35, 0.65, goreN(vec2(gu * 0.45 + gs * 3.0, gD * 0.07))) * (1.0 - smoothstep(0.05, 0.16, fwidth(gFp)));
        float gFold = clamp(gCrease + 0.55 * gFineOn * (1.0 - pow(abs(sin(3.14159265 * gFp)), 0.6)), 0.0, 1.0);      // how deep in a fold this place lies
        albedo *= mix(1.0, 0.38, uGoreLook.y * gFold) * (1.0 + 0.1 * uGoreLook.y * (1.0 - gFold) * smoothstep(0.1, 0.4, gNear));
        // soaked below its tide line
        float gTide = gHem - (0.28 + 0.34 * fract(vGore.z * 7.31)) * gLen - 0.5 * (goreN(vec2(gu * 1.1 + gs, 2.0)) - 0.5) - 0.7 * pow(goreN(vec2(gu * 3.3 + gs, 7.0)), 4.0);
        float gSoak = (1.0 - smoothstep(-0.14, 0.14, gTide)) * uGoreLookB.w;
        albedo = pow(max(albedo, vec3(1e-4)), vec3(1.0 + 0.3 * gSoak)) * (1.0 - 0.22 * gSoak) * (1.0 - 0.2 * uGoreLookB.w * exp(-gTide * gTide / 0.012));
        // the dye has run down it, never quite evenly; the hem wet, frayed, darker
        albedo *= (0.84 + 0.3 * goreN(vec2(gU * 2.2, gD * 0.11 + gs))) * (0.92 + 0.16 * goreN(vec2(gU * 9.0, gD * 0.3 + gs)));
        albedo *= 1.0 - 0.3 * (1.0 - smoothstep(0.0, 0.1, gHem - gTorn));
        if (uGoreLook.w > 0.0) {
          // (look({ pleat })) wet cloth clings to itself in narrow pleats that run down the gore from its pegs, wandering;
          // what comes THROUGH it comes in its creases and its pleats, and more in its wet length. A cloth's light (an
          // area's own, made on the gouache hooks) multiplies what it sends through by CLOTH_THRU
          float gw = gU + 0.16 * sin(gD * 0.6 + gs) + 0.07 * sin(gD * 1.7 + gs * 3.0);
          float gA = mix(0.5, goreN(vec2(gw * 4.6 + gs, gD * 0.09)), 1.0 - smoothstep(0.2, 0.6, fwidth(gw * 4.6)));
          float gB = mix(0.5, goreN(vec2(gw * 12.0, gD * 0.15 + gs)), 1.0 - smoothstep(0.2, 0.6, fwidth(gw * 12.0)));
          float gOpen = smoothstep(0.22, 0.78, 0.6 * gA + 0.4 * gB);
          albedo *= mix(1.0, 0.88 + 0.16 * gOpen, uGoreLook.w);
          gGoreThru = mix(1.0, 0.45 + 0.8 * gOpen, uGoreLook.w);
        }
        gGoreThru *= (1.0 - 0.62 * uGoreLook.y * gFold) * (1.0 + 0.5 * gSoak);
        // (look({ runs, deep })) THE DYE HAS RUN DOWN IT IN STREAKS of three widths (an arm, a hand, a finger), each wandering a
        // little, dying out and beginning again: in a run the cloth is deeper in its dye and lets less of the light behind
        // it through (the finest only as near as they can be told apart). And the whole gore is heavy with dye (deep):
        // against the light it glows deep, not pale
        if (uGoreLookD.x > 0.0) {
          float rx = gU + gs * 1.7 + 0.1 * sin(gD * 0.35 + gs);
          float rA = goreN(vec2(rx * 1.05, gD * 0.05 + gs)), rB = goreN(vec2(rx * 3.7 + 5.0, gD * 0.08 + 2.0 * gs));
          float rC = mix(0.5, goreN(vec2(rx * 12.5, gD * 0.13 + gs)), 1.0 - smoothstep(0.25, 0.7, fwidth(rx * 12.5)));
          float rOpen = smoothstep(0.2, 0.8, 0.42 * rA + 0.36 * rB + 0.22 * rC);
          albedo = pow(max(albedo, vec3(1e-4)), vec3(1.0 + 0.55 * uGoreLookD.x * (1.0 - rOpen))) * (1.0 - 0.2 * uGoreLookD.x * (1.0 - rOpen));
          gGoreThru *= mix(1.0, 0.2 + 0.8 * rOpen, uGoreLookD.x);
        }
        vec3 gDye = 0.5 * (vGoreTop + vGoreHem);
        gGoreThru *= 1.0 - uGoreLookD.y * smoothstep(0.12, 0.34, max(gDye.r, max(gDye.g, gDye.b)));      // (by its dyes: the dark ones let little through as it is)
      #endif
    }`,
    final: /* glsl */`
      #ifdef GORE_LOOK
        if (gGoreThin > 0.5) gl_FragColor.a = -15.0;            // a thread, a flap's ragged end: the painter's filter leaves it as drawn (CRISP_ALPHA)
      #endif`,
  } });
  const mesh = new THREE.Mesh(geo, mat); mesh.name = 'gores'; mesh.frustumCulled = false;
  (o.parent || ctx.group).add(mesh);
  ctx.onUpdate(() => { U.uGoreAxle.value.z = o.angle(); });
  U.uGoreAxle.value.z = o.angle();
  const hub = new THREE.Vector3(o.hub[0], o.hub[1], o.hub[2]), _d = new THREE.Vector3();
  return {
    object: mesh, material: mat, count: n, wind,
    /**
     * Heavy wet cloth: look({ tear: 0.6, ribs: 0.8 }) hangs every gore in a crease from each peg (sharp under the peg,
     * broad lower down; of deeper colour, and of less light when the sun is behind it), lets the dye run down it and
     * tears its hem (cut, never blended). pegs (1.05 to a metre of rail, no two the same distance apart); sag (0: metres
     * its top edge sags between two pegs, and the cloth under a sag hangs lower); ragged (0: metres its hem is bitten
     * short in broad bites); wet (0..1: soaked below a tide line); segments ([across, down]: a finer mesh for the sag
     * and the bites: [48, 12]).
     * pleat (0..1, default 0): it clings to itself in narrow pleats, and what comes through it comes in ribs and pleats
     * (the fragment shader then defines CLOTH_THRU: a light of the area's own multiplies its glow by it).
     * uneven (0..1, default 0): its creases die out, each at its own depth, most of them faint; its folds are of every
     * depth, flat here and gathered there (0: a crease from every peg to the hem, folds as even as flutes).
     * (sixth look) runs (0..1, default 0): the dye has run down it in streaks of three widths: deeper colour, less light
     * through; deep (0..0.8, default 0): the whole gore is heavy with dye: it lets that much less through (against the
     * light it glows deep and saturated, not pale); strips (0: metres of its hem that hang in flaps and threads, each
     * its own width and length); bleed (0..1, default 0): its two dyes run into one another over metres, in runs and
     * fingers; lobe (0: metres the cloth stands out of the gore's plane between each pair of pegs, outward only; keep
     * it under half the distance between two lanes), lobeVary (0.6: how much the lobes run into one another lower
     * down), fine (0: metres of finer folds riding on them). The lobes and the bites need a fine mesh (`segments`).
     * Off until called: a wheel made without it is drawn as it always was.
     */
    look(l = {}) {
      mat.defines = { ...(mat.defines || {}), GORE_LOOK: '' }; U.uGoreLook.value.x = l.tear ?? 0.6; U.uGoreLook.value.y = l.ribs ?? 0.8; U.uGoreLook.value.w = l.pleat ?? 0;
      U.uGoreLookB.value.set(l.pegs ?? 1.05, l.sag ?? 0, l.ragged ?? 0, l.wet ?? 0); U.uGoreLookC.value.x = l.uneven ?? 0;
      U.uGoreLookD.value.set(l.runs ?? 0, l.deep ?? 0, l.strips ?? 0, l.bleed ?? 0); U.uGoreLookE.value.set(l.lobe ?? 0, l.lobeVary ?? 0.6, l.fine ?? 0, 0);
      if (l.segments) {                                             // a finer mesh: the sag between pegs and the bitten hem are cut in it
        const [ax2, dn2] = l.segments, pos2 = new Float32Array((ax2 + 1) * (dn2 + 1) * 3), idx2 = [];
        for (let j = 0; j <= dn2; j++) for (let i = 0; i <= ax2; i++) pos2.set([i / ax2, j / dn2, 0], (j * (ax2 + 1) + i) * 3);
        for (let j = 0; j < dn2; j++) for (let i = 0; i < ax2; i++) { const a = j * (ax2 + 1) + i, b = a + 1, c = a + ax2 + 1, d = c + 1; idx2.push(a, c, b, b, c, d); }
        geo.setAttribute('position', new THREE.BufferAttribute(pos2, 3)); geo.setIndex(idx2);
      }
      mat.needsUpdate = true; return this;
    },
    setDye(i, top, hem) { if (top) { const c = col(top); topAttr.setXYZ(i, c.r, c.g, c.b); topAttr.needsUpdate = true; } if (hem) { const c = col(hem); hemAttr.setXYZ(i, c.r, c.g, c.b); hemAttr.needsUpdate = true; } },
    /**
     * Which gore a line of sight passes through: from `point` (a Vector3, the eye) in the direction `toward` (a unit
     * Vector3: to the sun). Returns { gore, v } (v: 0 at its pegs .. 1 at its hem: which of its two dyes), or null. For
     * the reach's dyed light: the cloth and the picture then agree, because this is the same shape the shader draws
     * (at rest: while a wind front holds the gores out, nothing covers the sun and this returns null).
     */
    covers(point, toward) {
      if (wind.frontAt(hub.x, hub.z) > 0.3) return null;
      const ang = o.angle(), e1x = a2.y, e1z = -a2.x; let best = null, bestT = Infinity;
      for (let i = 0; i < n; i++) {
        const g = o.gores[i], lane = g.lane ?? 0, a = (g.arm ?? 0) + ang;
        // where the ray crosses this gore's lane (a plane square to the axle)
        const den = toward.x * a2.x + toward.z * a2.y; if (Math.abs(den) < 1e-5) continue;
        const t = ((hub.x - point.x) * a2.x + (hub.z - point.z) * a2.y + lane) / den; if (t <= 0 || t >= bestT) continue;
        _d.copy(point).addScaledVector(toward, t);
        const along = (_d.x - hub.x) * e1x + (_d.z - hub.z) * e1z, c = Math.cos(a); if (Math.abs(c) < 1e-3) continue;
        const R = along / c, u = (R - o.rail[0]) / (o.rail[1] - o.rail[0]); if (u < 0 || u > 1) continue;
        const pegY = hub.y + Math.sin(a) * R, len = o.length[0] + (o.length[1] - o.length[0]) * u, v = (pegY - _d.y) / len;
        if (v < 0 || v > 1 || _d.y < o.floor) continue;
        best = { gore: i, v }; bestT = t;
      }
      return best;
    },
  };
}

// ------------------------------------------------------------------------------------------------ swags
/**
 * Cloth slung between two points: a silk from one mast head to another, the velvet swag of a box front. Each hangs
 * in a true catenary of fixed length, gathered where it is tied and full between, swings slowly about the line
 * between its ties, and is blown out to leeward and held there by a wind front. One draw call. opts:
 *   swags      [{ from: [x, y, z], to: [x, y, z]   where it is tied
 *                 sag                                 metres its lowest point hangs below the lower tie (or length: metres of cloth)
 *                 width, color, tip, phase }]
 *   width (1.2), gather (0.12: the share of its width left where it is tied), cup (0.25: how far its edges curl up)
 *   swing (0.05 rad in still air), lean (1.0 rad to leeward in a full wind), backlight (0.9; 0 for velvet), fold (0.035 m)
 *   segments ([4, 28]), wind, material: more kit.gouache options, exact
 * Returns { object, material, count, setColor(i, color), look({ pleat, wet }) (heavy wet silk: pleats along it, a dark belly) }.
 */
export function makeSwags(ctx, swags, opts = {}) {
  const { kit } = ctx, clock = lifeClock(ctx);
  const o = { width: 1.2, gather: 0.12, cup: 0.25, swing: 0.05, lean: 1.0, backlight: 0.9, fold: 0.035, segments: [4, 28], wind: null, material: {}, exact: true, parent: null, ...opts };
  const wind = o.wind || sharedWind(ctx);
  const items = thin(ctx, swags, o.exact), n = items.length, [ax, segs] = o.segments;
  const pos = new Float32Array((ax + 1) * (segs + 1) * 3), idx = [];
  for (let j = 0; j <= segs; j++) for (let i = 0; i <= ax; i++) pos.set([i / ax * 2 - 1, j / segs, 0], (j * (ax + 1) + i) * 3);
  for (let j = 0; j < segs; j++) for (let i = 0; i < ax; i++) { const a = j * (ax + 1) + i, b = a + 1, c = a + ax + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
  const geo = new THREE.InstancedBufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setIndex(idx);
  const aFrom = new Float32Array(n * 3), aChord = new Float32Array(n * 4), aCat = new Float32Array(n * 4), aLook = new Float32Array(n * 4), aColor = new Float32Array(n * 3), aTip = new Float32Array(n * 3);
  items.forEach((it, i) => {
    const A = it.from, B = it.to, dx = B[0] - A[0], dy = B[1] - A[1], dz = B[2] - A[2], D = Math.max(Math.hypot(dx, dz), 1e-3), chord = Math.hypot(D, dy);
    let L = it.length;
    if (L == null) { const sag = it.sag ?? chord * 0.12; L = Math.max(chord * 1.002, Math.sqrt(D * D + (16 / 3) * sag * sag) + Math.abs(dy) * 0.5); }
    const c = catenary(D, dy, L), mid = catenaryPoint(c, c.L * 0.5), drop = Math.max(0.05, dy * 0.5 - mid[1]);
    aFrom.set(A, i * 3); aChord.set([dx / D, dz / D, D, dy], i * 4); aCat.set([c.a, c.s0, c.L, it.width ?? o.width], i * 4);
    aLook.set([it.phase ?? ((i * 0.618) % 1), Math.sqrt(9.81 / (0.8 * drop)), 0, 0], i * 4);
    const c1 = col(it.color ?? '#ffffff'), c2 = col(it.tip ?? it.color ?? '#ffffff'); aColor.set([c1.r, c1.g, c1.b], i * 3); aTip.set([c2.r, c2.g, c2.b], i * 3);
  });
  const attr = (name, arr, size) => { const a = new THREE.InstancedBufferAttribute(arr, size); geo.setAttribute(name, a); return a; };
  const swagB = { value: new THREE.Vector4(o.fold, 0, 0, 0) };      // its folds across; (look) how strong its pleats, how wet its belly
  const swagC = { value: new THREE.Vector4(0, 0, 0, 0) };           // (look) turns it makes about its own length from tie to tie; how much it bunches and spreads along its length
  attr('aSwFrom', aFrom, 3); attr('aSwChord', aChord, 4); attr('aSwCat', aCat, 4); attr('aSwLook', aLook, 4); const colorAttr = attr('aSwColor', aColor, 3); attr('aSwTip', aTip, 3);
  geo.instanceCount = n;
  const mat = kit.gouache({ color: '#ffffff', side: THREE.DoubleSide, brush: 0, backlight: o.backlight, ...o.material, extend: {
    uniforms: { ...wind.uniforms, uSwag: { value: new THREE.Vector4(o.gather, o.cup, o.swing, o.lean) }, uSwagB: swagB, uSwagC: swagC },
    vertexPars: /* glsl */`
      attribute vec3 aSwFrom, aSwColor, aSwTip; attribute vec4 aSwChord, aSwCat, aSwLook;
      uniform vec4 uSwag, uSwagB; varying vec4 vSwag; varying vec3 vSwagColor;
      #ifdef SWAG_LOOK
        uniform vec4 uSwagC;
      #endif
      ${WIND_GLSL}
      ${CATENARY_GLSL}`,
    vertexWorld: /* glsl */`{
      float sig = position.y, v = position.x, L = aSwCat.z, t = uLifeWind.w, ph = aSwLook.x * 6.2831853;
      vec3 hd = vec3(aSwChord.x, 0.0, aSwChord.y);
      vec2 c = catPoint(aSwCat.x, aSwCat.y, sig * L), ct = catTangent(aSwCat.x, aSwCat.y, sig * L);
      vec3 p = hd * c.x + vec3(0.0, c.y, 0.0), T = hd * ct.x + vec3(0.0, ct.y, 0.0);
      vec3 Wd = vec3(hd.z, 0.0, -hd.x);                                             // across the line between its ties, on the level
      vec3 ax = normalize(hd * aSwChord.z + vec3(0.0, aSwChord.w, 0.0));
      // it swings about the line between its ties: a little in still air, and out to leeward for as long as a wind holds
      vec3 midp = aSwFrom + hd * (aSwChord.z * 0.5);
      float held = lifeFront(midp.xz + uLifeFront.xy * (aSwLook.x - 0.5) * 3.0) * uLifeWindB.z;
      float th = uSwag.z * lifeBreeze(midp.xz) * uLifeWindB.z * (sin(t * aSwLook.y + ph) + 0.4 * sin(t * aSwLook.y * 0.37 + ph * 2.0))
        + uSwag.w * min(held, 1.25) * dot(vec3(uLifeFront.x, 0.0, uLifeFront.y), Wd) * (1.0 + 0.08 * sin(t * 2.1 + ph * 3.0));
      float cs = cos(th), sn = sin(th);
      p = p * cs + cross(ax, p) * sn + ax * dot(ax, p) * (1.0 - cs);
      T = T * cs + cross(ax, T) * sn + ax * dot(ax, T) * (1.0 - cs);
      Wd = Wd * cs + cross(ax, Wd) * sn + ax * dot(ax, Wd) * (1.0 - cs);
      vec3 Nn = normalize(cross(T, Wd));                                            // the face of the cloth that looks up (to windward, once it is blown out)
      // gathered where it is tied, full between; its edges curl up a little, and its fullness lies in folds along it
      #ifdef SWAG_LOOK
        // (look({ twist })) a long slung silk turns over as it hangs: each its own way and by its own amount, about its own
        // length; a wind that fills it lays it flat again
        float swT = uSwagC.x * 6.2831853 * (aSwLook.x < 0.5 ? -1.0 : 1.0) * (0.55 + 0.9 * fract(aSwLook.x * 7.31)) * (sig - 0.5 + 0.1 * sin(sig * 9.0 + ph)) * (1.0 - 0.8 * min(held, 1.0));
        float swC = cos(swT), swS = sin(swT); vec3 swW = Wd * swC + Nn * swS; Nn = Nn * swC - Wd * swS; Wd = swW;
      #endif
      float full = pow(max(sin(3.14159265 * sig), 0.0), 0.6), hw = 0.5 * aSwCat.w * mix(uSwag.x, 1.0, full);
      #ifdef SWAG_LOOK
        // (look({ taper })) a long wet silk pulls itself narrow toward its ties: a rope there, a cloth only in its belly
        if (uSwagC.z > 0.0) { full = pow(full, 1.0 + uSwagC.z); hw = 0.5 * aSwCat.w * mix(uSwag.x, 1.0, full); }
        hw *= 1.0 + uSwagC.y * (0.6 * sin(sig * 11.0 + ph * 3.0) + 0.4 * sin(sig * 23.0 + ph * 5.0));      // (look({ bunch })) it bunches here and spreads there
      #endif
      float fold = uSwagB.x * sin(v * 7.0 + ph) * (1.0 - 0.7 * full), dfold = uSwagB.x * 7.0 * cos(v * 7.0 + ph) * (1.0 - 0.7 * full);
      #ifdef SWAG_LOOK
        // (look({ folds })) its fullness lies along it in folds from tie to tie, wandering across it, as deep in its belly
        // as at its ties (without it the belly of a slung silk is a smooth band: a tape), with finer ones between
        if (uSwagC.w > 0.0) {
          float fk = mix(1.0 - 0.7 * full, 0.8 + 0.2 * sin(sig * 13.0 + ph * 2.0), uSwagC.w);
          float f1 = v * 7.0 + ph + 0.9 * sin(sig * 5.0 + ph * 3.0), f2 = v * 12.5 + ph * 1.7 + 2.2 * sin(sig * 7.0 + ph);
          fold = uSwagB.x * fk * (sin(f1) + 0.4 * uSwagC.w * sin(f2));
          dfold = uSwagB.x * fk * (7.0 * cos(f1) + 5.0 * uSwagC.w * cos(f2));
        }
      #endif
      float cup = uSwag.y * hw * v * v - min(held, 1.0) * 0.5 * hw * (1.0 - v * v) * full;      // its edges curl up; a wind fills its middle
      wp.xyz = aSwFrom + p + Wd * (v * hw) + Nn * (cup + fold);
      wn = normalize(Nn - Wd * ((2.0 * uSwag.y * v * hw + dfold) / max(hw, 0.02)));
      vSwag = vec4(v, sig * L, aSwLook.x, full);
      vSwagColor = mix(aSwColor, aSwTip, smoothstep(0.25, 0.75, sig));
    }`,
    fragmentPars: /* glsl */`varying vec4 vSwag; varying vec3 vSwagColor;
      #ifdef SWAG_LOOK
        uniform vec4 uSwagB;                                    // (fold), how strong its pleats, how wet its belly
        float gSwagThru = 1.0;
        #define CLOTH_THRU gSwagThru
      #endif
      float swN(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); vec2 h = vec2(127.1, 311.7);
        float a = fract(sin(dot(i, h)) * 43758.5), b = fract(sin(dot(i + vec2(1.0, 0.0), h)) * 43758.5), c = fract(sin(dot(i + vec2(0.0, 1.0), h)) * 43758.5), d = fract(sin(dot(i + vec2(1.0, 1.0), h)) * 43758.5);
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y); }`,
    albedo: /* glsl */`{ albedo = vSwagColor * (0.84 + 0.3 * swN(vec2(vSwag.x * 1.4 + vSwag.z * 31.0, vSwag.y * 0.3))) * (1.0 - 0.2 * smoothstep(0.82, 0.98, abs(vSwag.x)));
      #ifdef SWAG_LOOK
        // (look({ pleat, wet })) slung silk heavy with water: its fullness lies along it in narrow pleats that run from tie
        // to tie; darker and wetter where it hangs lowest; and the light behind it comes through its open stretches
        float sw = vSwag.x * 2.4 + 0.3 * sin(vSwag.y * 0.45 + vSwag.z * 20.0), sv = vSwag.y;
        float sA = mix(0.5, swN(vec2(sw * 1.9 + vSwag.z * 31.0, sv * 0.06)), 1.0 - smoothstep(0.2, 0.6, fwidth(sw * 1.9)));
        float sB = mix(0.5, swN(vec2(sw * 5.0, sv * 0.1 + vSwag.z * 17.0)), 1.0 - smoothstep(0.2, 0.6, fwidth(sw * 5.0)));
        float sOpen = smoothstep(0.22, 0.78, 0.6 * sA + 0.4 * sB), sWet = uSwagB.z * smoothstep(0.55, 1.0, vSwag.w) * (0.6 + 0.4 * swN(vec2(sv * 0.5, vSwag.z * 9.0)));
        albedo *= mix(1.0, 0.82 + 0.26 * sOpen, uSwagB.y) * (1.0 - 0.3 * sWet);
        gSwagThru = mix(1.0, 0.3 + 1.0 * sOpen, uSwagB.y) * (1.0 + 0.5 * sWet);
        gSwagThru *= 1.0 - uSwagB.w;                             // (look({ deep })) heavy with dye: it lets less of the light through, and glows deep, not pale
      #endif
    }`,
  } });
  const mesh = new THREE.Mesh(geo, mat); mesh.name = 'swags'; mesh.frustumCulled = false;
  (o.parent || ctx.group).add(mesh);
  return { object: mesh, material: mat, count: n, wind, setColor(i, color) { const c = col(color); colorAttr.setXYZ(i, c.r, c.g, c.b); colorAttr.needsUpdate = true; },
    /**
     * (twist: 0: turns a long silk makes about its own length from tie to tie, each its own way: from under it narrows
     * to a line and opens again; bunch: 0..0.4: it bunches here and spreads there along its length.)
     * Slung silk heavy with water: look({ pleat: 0.8, wet: 0.6 }) lays its fullness along it in narrow pleats (streaks of
     * deeper colour; the light behind it comes through between them: CLOTH_THRU, as the gores') and darkens its belly.
     * (sixth look) taper (0: a long wet silk pulls itself narrow toward its ties: 1 = a rope for its first and last
     * quarter, a cloth in its belly); folds (0..1, default 0: its fullness lies along it in folds as deep in its belly as
     * at its ties, wandering, with finer ones between: without it the belly is a smooth band; needs about 20 columns);
     * deep (0..0.8, default 0): heavy with dye: it lets that much less light through and glows deep, not pale.
     * Off until called: a swag made without it is drawn as it always was.
     */
    look(l = {}) { mat.defines = { ...(mat.defines || {}), SWAG_LOOK: '' }; swagB.value.y = l.pleat ?? 0.8; swagB.value.z = l.wet ?? 0.6; swagB.value.w = l.deep ?? 0; swagC.value.set(l.twist ?? 0, l.bunch ?? 0, l.taper ?? 0, l.folds ?? 0); mat.needsUpdate = true; return this; },
  };
}
