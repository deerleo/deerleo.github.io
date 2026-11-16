// The theatre of leaves: THE LEAVES. Stage 3, the cast, group "Leaves": the falling leaves and the floating leaves
// (docs/art/theatre.md, section 5, the first two rows of the cast table). How it was made, how to see it, what it
// costs and what is still to do: docs/build/theatre/3-cast-leaves.md (the second half, "Second look", describes the
// module as it is now). Its numbers: plan.js, "the cast: leaves".
//
// The leaf itself is the toolkit's (docs/life/falls.md): makeFall's beech leaf, which tumbles, hangs when it comes flat,
// dives edge-on and swings half a metre either way all the way down; makeFloaters' leaf afloat, its edges curled up like a
// small boat, which rocks on every ring, makes way for the hull and closes in behind it. What is this module's own is
// everything that makes them belong to THIS room:
//
//   THE HOUSE'S LIGHT. The family takes no material, and a leaf in its own paint would stand in this dark room like a
//   cut-out in daylight. So the family is given a ctx whose kit.gouache dresses whatever it asks for in the house's
//   paint for a leaf (lib.js, H.paint('leaf')), with small extensions of this module's: the lit house on a leaf in its
//   air and the moon on its pale face (the same two terms the presences' leaves take: cast_presences.js), and the light
//   that comes THROUGH a leaf (copper with the moon behind it in the shaft, vermilion between the eye and the fire in
//   the tree).
//
//   EVERY LEAF HAS A LIFE. It lets go from a place of the set (under one of the crown's masses, shared.tree.masses; a
//   tuft of the great limb; the velvet of a tier's rail, where it lies first and then slips out into the room). The
//   family makes it fall in still air over that place; this module's vertex extension then gives it the room's air:
//   the column round the trunk (each leaf goes round at ITS OWN rate: the page's turn in 14 s by the trunk, slower
//   further out, so that nothing streams past the boat and nothing goes round like a carousel), a lift for a quarter of
//   them (up for 3 to 5 s, then down no faster than one and a half times their own fall), the draught toward the stage
//   on top of both, a level of its own to land on (the mound's litter), and the air round the rider's boat and eye,
//   which eases a leaf aside so that it lands beside the hull and never in the lens. Nothing of the family collides
//   with anything, so no leaf is let go unless the whole of its way down is clear: the same arithmetic in script
//   (`aim`, `where`: the family's fall, copied, and this module's on top) is walked through a model of what is solid
//   (the trunk, limbs and chandelier and what lies on the mound as voxels taken from their own models; the fronts,
//   boxes, brackets and lustres, the arch, the stage, the fly tower, from the plan), every 0.2 s and every 0.06 s near
//   anything solid, in the draught as it is and in every place the draught could carry it to (it turns at the hour,
//   strengthens for the fall and drops again). A leaf whose way is not clear is not let go; another is tried. The air
//   is kept at the page's 2,000 by letting one go for each that lands, and is full before the first frame.
//
//   IT LANDS, FLOATS, GATHERS AND GOES UNDER. Where a leaf comes down a ring opens (near the boat), the staging's
//   `onLand` is called (the tick), and the leaf STAYS: the floating leaf that takes its place lies where it fell, turned
//   as it was, the same side up, in its own colour and size, and darkens as it takes up water. The leaves on the water
//   are one population (the family's pool of floating leaves, every slot written by this module): each drifts toward the
//   stage on the draught at its own pace and a little its own way, comes to rest against whatever stands in its way (the
//   mound's shore, a root, a music stand, a wave roller, the narrowing box fronts, the backcloth's hem: the leaves gather
//   there as they arrive), and after a few minutes soaks and goes under, rocking. Those that had gathered before the
//   rider came are laid by hand and stay. When the house lets go, the cover rises with what comes down.
//
// What the staging drives is shared.cast.leaves (the list is at the end of build()). Left alone the module keeps the
// page's times on the show clock by itself (the draught and the drift from c 0, the stronger draught and the crown's
// 600 through the fall, the water covered after it, the 60 that come through the backcloth with the boat); each of
// those can be switched off (shared.cast.leaves.auto). It plays no sound and places no cue.
//
// Developer switches (with ?realm=theatre): &leaves=0 the first builder's stand-in instead;  &lvwind=0.6 the draught held;
// &lvcover=1 the water as after the fall;  &lvgust=3 the gust's 400 from the crown, three seconds in;  &lvfall=3 the crown's
// 600;  &lvtier=4,3 a burst from tier 4's rail at 3 s;  &lvat=s,d,y,t a burst of 60 from a point;  &lvlog=name.json what the
// module counts, and where every leaf in the air is (.shots/name.json; &lvlogt=8 when);  &lvtrace=24 the way down this
// module foresaw for the next 24 leaves, drawn as lines (the leaves must ride them);  &lvbig=1,2.9,3.8  &lvlow=1,1.4,6,16
// sizes;  &lvair=a,b,c,d  &lvfloat=a,b,c,d  the house's `take` for a leaf in the air and afloat (&lvkeep=a,b,c,d its `keep` afloat);  &lvk=moon,fire light through
// a leaf;  &lvtone=0.6 how dark a wet leaf is;  &lvn=0.5 a share of everything;  &lvmirror=1 all of them in the water's mirror (0: none);  &lvkite=0 the thirteen-triangle leaf in the air;
// &lvturn=14,2.9 the column's turn (seconds, at how many metres);  &lvstudy=2 ten leaves by the bow (&lvhigh= &lvahead= &lvside=);  &lvrail=1 only the tiers' leaves in the air.
import * as THREE from 'three';
import { makeFall, cardGeometry, lifeHull } from '../../engine/life/falls.js';
import { makeFloaters } from '../../engine/life/floaters.js';
import { at, house, dev } from './lib.js';

const TAU = Math.PI * 2;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const S = (x) => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
const smooth = (a, b, x) => S((x - a) / (b - a));
const fract = (x) => x - Math.floor(x);
const pause = () => new Promise((r) => setTimeout(r, 0));

// The four random numbers of one of the family's instances (falls.js rand4: the integer hash its shader and its script share).
const hash32 = (x) => { x ^= x >>> 16; x = Math.imul(x, 0x7feb352d); x ^= x >>> 15; x = Math.imul(x, 0x846ca68b); x ^= x >>> 16; return x >>> 0; };
function rand4(id, n, out) {
  const a = hash32((Math.imul(id, 0x9E3779B9) ^ (Math.imul(n, 0x85EBCA6B) + 0x27D4EB2F)) >>> 0), b = hash32((a ^ 0x68E31DA4) >>> 0);
  out[0] = (a & 0xffff) / 65536; out[1] = (a >>> 16) / 65536; out[2] = (b & 0xffff) / 65536; out[3] = (b >>> 16) / 65536;
  return out;
}
/** A heap of whole numbers, the least first (the slots that are free: the lowest is taken, so that those in use stay together at the front and only they are drawn). */
function makeHeap(n) {
  const a = new Int32Array(Math.max(1, n)); let m = 0;
  return {
    get n() { return m; }, peek: () => a[0],
    push(v) { let i = m++; while (i > 0) { const p = (i - 1) >> 1; if (a[p] <= v) break; a[i] = a[p]; i = p; } a[i] = v; },
    pop() { const top = a[0], v = a[--m]; let i = 0; for (;;) { let c = 2 * i + 1; if (c >= m) break; if (c + 1 < m && a[c + 1] < a[c]) c++; if (a[c] >= v) break; a[i] = a[c]; i = c; } a[i] = v; return top; },
    fill(k) { for (let i = 0; i < k; i++) a[i] = i; m = k; },
  };
}
/** Send what changed in a few instanced attributes: the slots one by one while they are few, or one stretch from the first to the last. */
function makeDirt(attrs) {
  // (the slots written in one frame lie in a few runs: the lowest free slot is taken, so new leaves fill the holes the old ones left.
  // They are sent as those runs: at most twelve stretches for each attribute, never one small upload a slot and never the whole pool)
  const few = new Int32Array(512), runs = new Int32Array(24); let n = 0, lo = 1e9, hi = -1;
  return {
    mark(i) { if (n < few.length) few[n] = i; n++; if (i < lo) lo = i; if (i > hi) hi = i; },
    all() { n = 0; lo = 1e9; hi = -1; for (const a of attrs) { a.clearUpdateRanges(); a.needsUpdate = true; } },
    flush() {
      if (!n) return;
      let r = 0;
      if (n <= few.length) {
        const m = few.subarray(0, n); m.sort();
        // join neighbours: first whatever is within 48 slots, and if that leaves more than twelve runs, within ever more
        for (let gap = 48; ; gap *= 4) {
          r = 0; let a = m[0], b = m[0];
          for (let i = 1; i < n && r < 12; i++) { if (m[i] - b <= gap) b = m[i]; else { runs[r * 2] = a; runs[r * 2 + 1] = b; r++; a = b = m[i]; } }
          if (r < 12) { runs[r * 2] = a; runs[r * 2 + 1] = b; r++; break; }
        }
      } else { runs[0] = lo; runs[1] = hi; r = 1; }
      for (const a of attrs) {
        const k = a.itemSize;
        for (let i = 0; i < r; i++) a.addUpdateRange(runs[i * 2] * k, (runs[i * 2 + 1] - runs[i * 2] + 1) * k);
        a.needsUpdate = true;
      }
      n = 0; lo = 1e9; hi = -1;
    },
  };
}

// The leaves' colours are the crown's own (assets/models/theatre/beech_sprays.json: copper, russet, bronze, old gold, purple-bronze
// and two ambers between; the tree's builder measured them on the key painting, where the page's chips came out one red-orange under
// candlelight). The under face is paler and greyer. A leaf on the water is wet: darker (the mound's litter is painted the same way:
// tree.js). The eight wet colours stand in the same order as the eight dry ones, so that a leaf that lands keeps its own.
// Vermilion is never paint: it is a leaf with a flame behind it.
const CROWN = ['#B8632E', '#B8632E', '#9E4E27', '#804428', '#CC943F', '#64302E', '#D07F32', '#B06C30'];
const LITTER = ['#B66C3A', '#B66C3A', '#99562E', '#7C4A30', '#CC9C52', '#603836', '#C4803C', '#A86C36'];
const shade = (list, k, grey = 0) => list.map((h) => { const c = new THREE.Color(h), l = 0.3 * c.r + 0.55 * c.g + 0.15 * c.b; return c.lerp(new THREE.Color(l * 1.25, l * 1.12, l * 0.95), grey).multiplyScalar(k); });
const TOP = shade(CROWN, 1), UNDER = shade(CROWN, 0.92, 0.3);
const WET8 = (tone) => shade(LITTER, tone * 0.95), WETU8 = (tone) => shade(LITTER, tone * 0.83, 0.3);
const WET = (tone) => [...shade(LITTER, tone * 0.72), ...shade(LITTER, tone * 1.18)];       // (the kettledrums' few)

export async function build(ctx, plan, shared) {
  shared.cast = shared.cast || {};
  const P = plan.castLeaves;
  if (!P || !P.on) return {};                                               // (&leaves=0: the first builder's stand-in stands instead)
  const H = house(ctx, plan, shared), show = shared.show || { c: -1, k: 0 }, T = shared.tree || null;
  const calm = !!ctx.reducedMotion, calmK = calm ? 0.5 : 1;
  const num = (k, d) => (dev.has(k) && dev.get(k) !== '' && Number.isFinite(+dev.get(k)) ? +dev.get(k) : d);
  const nums = (k, d) => { if (!dev.has(k)) return d; const q = dev.get(k).split(',').map(Number); return q.length === d.length && q.every(Number.isFinite) ? q : d; };
  const want = clamp(num('lvn', 1), 0.02, 1);                               // (&lvn=0.5: half of everything, to look at them thinned)
  const B = plan.beech, C = P.column, LF = P.leaf, A = P.afloat, LV = P.leave;
  // the route is one straight line down the axis of the building: x = d and z = -s (plan.js). Everything solid below is in the
  // page's coordinates (s along, d to the right, y up); a leaf's place is the realm's (x, y, z).
  const axis = at(ctx, B.s, B.d, 0);
  const rnd = ctx.rng(1402), rs = ctx.rng(2603), rw = ctx.rng(2605);
  const toStage = new THREE.Vector2(at(ctx, 51, 0).x - at(ctx, 50, 0).x, at(ctx, 51, 0).z - at(ctx, 50, 0).z);      // a metre toward the stage, in the realm's x and z
  const toRight = new THREE.Vector2(at(ctx, 50, 1).x - at(ctx, 50, 0).x, at(ctx, 50, 1).z - at(ctx, 50, 0).z);      // a metre to the right of the route
  const hull = lifeHull(ctx);

  // ============================================================================================ what is solid
  // ---- the box-front line, as a table (plan.frontD walks a curve of four hundred points at every call)
  const FT0 = 30, FTN = 601, frontTab = new Float32Array(FTN), frontInv = new Float32Array(FTN);
  for (let i = 0; i < FTN; i++) frontTab[i] = plan.frontD(FT0 + i * 0.1);
  for (let i = 0; i < FTN; i++) { const a = Math.max(0, i - 3), b = Math.min(FTN - 1, i + 3), slope = (frontTab[b] - frontTab[a]) / ((b - a) * 0.1); frontInv[i] = 1 / Math.sqrt(1 + slope * slope); }
  const fIdx = (s) => clamp(Math.round((s - FT0) * 10), 0, FTN - 1);
  /** Metres into the room from the parterre's box line, measured square to it (negative: behind it, in a box). */
  const into = (s, ad) => { const i = fIdx(s); return (frontTab[i] - ad) * frontInv[i]; };

  // ---- the tree, the chandelier it carries and what lies on the mound: voxels, taken from the models themselves
  const VX = { c: 0.4, nx: 68, ny: 88, nz: 68, x0: axis.x - 13.6, z0: axis.z - 13.6 };
  const occ = new Uint8Array(VX.nx * VX.ny * VX.nz), hung = new Uint8Array(occ.length), blk = new Uint8Array(occ.length);      // wood and what lies about; the chandelier; the chandelier a cell wider all round
  let into3 = occ;
  const mark = (x, y, z) => {
    const i = Math.floor((x - VX.x0) / VX.c), j = Math.floor(y / VX.c), k = Math.floor((z - VX.z0) / VX.c);
    if (i >= 0 && j >= 0 && k >= 0 && i < VX.nx && j < VX.ny && k < VX.nz) into3[(j * VX.nz + k) * VX.nx + i] = 1;
  };
  // (and, a hand's breadth to the cell, a plan of what stands IN THE WATER'S SURFACE round the mound: the lifted seats' backs, the
  // roots, the fallen pieces. The voxels' own plan, a cell wider all round, closed 0.4 to 0.8 m round every seat: nothing could
  // float between the lifted rows or come to the mound's shore, and the water at the tree's foot was bare for two metres.)
  const FN = { c: 0.1, n: Math.round(VX.nx * VX.c / 0.1) }, fine = new Uint8Array(FN.n * FN.n);
  const markFine = (x, z) => { const i = Math.floor((x - VX.x0) / FN.c), k = Math.floor((z - VX.z0) / FN.c); if (i >= 0 && k >= 0 && i < FN.n && k < FN.n) fine[k * FN.n + i] = 1; };
  const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3();
  let voxTris = 0;
  const voxelise = (root) => {
    if (!root) return;
    root.updateWorldMatrix(true, true);
    root.traverse((o) => {
      if (!o.isMesh || o.isInstancedMesh || !o.geometry || o.geometry.isInstancedBufferGeometry || !o.geometry.attributes.position) return;
      const pos = o.geometry.attributes.position, idx = o.geometry.index, n = idx ? idx.count : pos.count, m = o.matrixWorld;
      for (let t = 0; t + 2 < n; t += 3) {
        _a.fromBufferAttribute(pos, idx ? idx.getX(t) : t).applyMatrix4(m); _b.fromBufferAttribute(pos, idx ? idx.getX(t + 1) : t + 1).applyMatrix4(m); _c.fromBufferAttribute(pos, idx ? idx.getX(t + 2) : t + 2).applyMatrix4(m);
        const e = Math.max(_a.distanceTo(_b), _b.distanceTo(_c), _c.distanceTo(_a)), q = Math.min(12, Math.ceil(e / 0.28));
        if (q <= 1) { mark(_a.x, _a.y, _a.z); mark(_b.x, _b.y, _b.z); mark(_c.x, _c.y, _c.z); }
        else for (let i = 0; i <= q; i++) for (let j = 0; i + j <= q; j++) { const u = i / q, v = j / q, w = 1 - u - v; mark(_a.x * u + _b.x * v + _c.x * w, _a.y * u + _b.y * v + _c.y * w, _a.z * u + _b.z * v + _c.z * w); }
        // (where it crosses the water's surface, between a hand under it and a foot over it: finely, for the plan above)
        if (Math.min(_a.y, _b.y, _c.y) < 0.3 && Math.max(_a.y, _b.y, _c.y) > -0.08 && e < 4) {
          const qf = Math.max(1, Math.ceil(e / 0.06));
          for (let i = 0; i <= qf; i++) for (let j = 0; i + j <= qf; j++) { const u = i / qf, v = j / qf, w = 1 - u - v, y = _a.y * u + _b.y * v + _c.y * w; if (y > -0.08 && y < 0.3) markFine(_a.x * u + _b.x * v + _c.x * w, _a.z * u + _b.z * v + _c.z * w); }
        }
        voxTris++;
      }
    });
  };
  if (T) {
    for (const part of [T.trunk, T.limbs, T.fallen, T.rubble]) voxelise(part && part.group);      // (the rubble too: its joists and lath panels stand out of the heap)
    into3 = hung; voxelise(T.chandelier && T.chandelier.frame); into3 = occ;      // (its frame and its spare chain; its beads and drops hang a hand below, and it swings a degree: it is given a whole cell all round, below)
  }
  // the rows the roots have lifted (kit_floor.js): each seat's back stands out of the water; and the two pieces of painted sky that lean on box fronts
  const K = shared.kitFloor || null;
  if (K && K.heavedSeats) for (const q of K.heavedSeats) {
    const p = q.position; if (!p || !(q.top > 0.03)) continue;
    for (let y = 0.1; y < q.top + 0.2; y += 0.3) for (const [dx, dz] of [[0, 0], [0.25, 0], [-0.25, 0], [0, 0.25], [0, -0.25]]) mark(p.x + dx, y, p.z + dz);
    for (let dx = -0.3; dx <= 0.301; dx += 0.1) for (let dz = -0.3; dz <= 0.301; dz += 0.1) if (dx * dx + dz * dz < 0.1) markFine(p.x + dx, p.z + dz);      // (its back and its seat, as a round of 0.3 m in the fine plan)
  }
  const leaning = (K && K.leaningSky ? K.leaningSky : []).map((q) => q.at).filter(Boolean).map((p) => ({ s: -p.z, d: p.x }));
  for (let j = 0; j < VX.ny; j++) for (let k = 0; k < VX.nz; k++) for (let i = 0; i < VX.nx; i++) {
    if (!hung[(j * VX.nz + k) * VX.nx + i]) continue;
    for (let dj = -1; dj <= 1; dj++) for (let dk = -1; dk <= 1; dk++) for (let di = -1; di <= 1; di++) {
      const a = i + di, b = j + dj, c = k + dk;
      if (a >= 0 && b >= 0 && c >= 0 && a < VX.nx && b < VX.ny && c < VX.nz) blk[(b * VX.nz + c) * VX.nx + a] = 1;
    }
  }
  // what stands in the water itself (a root, a lifted seat's back, a piece of the ceiling): a plan of it, a cell wider all round
  const low = new Uint8Array(VX.nx * VX.nz);
  for (let k = 0; k < VX.nz; k++) for (let i = 0; i < VX.nx; i++) if (occ[k * VX.nx + i] || occ[(VX.nz + k) * VX.nx + i]) for (let dk = -1; dk <= 1; dk++) for (let di = -1; di <= 1; di++) { const a = i + di, c = k + dk; if (a >= 0 && c >= 0 && a < VX.nx && c < VX.nz) low[c * VX.nx + a] = 1; }
  // (a leaf lies no nearer such a thing than its own half length: the fine plan, a cell wider all round)
  const fineD = new Uint8Array(fine.length);
  for (let k = 1; k + 1 < FN.n; k++) for (let i = 1; i + 1 < FN.n; i++) if (fine[k * FN.n + i]) for (let dk = -1; dk <= 1; dk++) for (let di = -1; di <= 1; di++) fineD[(k + dk) * FN.n + i + di] = 1;
  const lowAt = (x, z) => { const i = Math.floor((x - VX.x0) / FN.c), k = Math.floor((z - VX.z0) / FN.c); return i >= 0 && k >= 0 && i < FN.n && k < FN.n && fineD[k * FN.n + i] === 1; };
  const voxAt = (grid, x, y, z) => { const i = Math.floor((x - VX.x0) / VX.c), j = Math.floor(y / VX.c), k = Math.floor((z - VX.z0) / VX.c); return i >= 0 && j >= 0 && k >= 0 && i < VX.nx && j < VX.ny && k < VX.nz && grid[(j * VX.nz + k) * VX.nx + i] === 1; };
  // (and two cells all round the lot, below the crown: where a leaf's way is walked in finer steps)
  const nearby = new Uint8Array(occ.length);
  { const a = new Uint8Array(occ.length), jTop = Math.ceil(17.5 / VX.c);
    for (let i = 0; i < occ.length; i++) a[i] = occ[i] | hung[i];
    const spread = (src, dst, step, n, lim) => { for (let i = 0; i < src.length; i++) { if (!src[i]) continue; const q = Math.floor(i / step) % n; for (let k = -2; k <= 2; k++) if (q + k >= 0 && q + k < n) dst[i + k * step] = 1; } };
    const b2 = new Uint8Array(occ.length), c2 = new Uint8Array(occ.length);
    spread(a, b2, 1, VX.nx); spread(b2, c2, VX.nx, VX.nz); spread(c2, nearby, VX.nx * VX.nz, VX.ny);
    for (let j = jTop; j < VX.ny; j++) nearby.fill(0, j * VX.nz * VX.nx, (j + 1) * VX.nz * VX.nx); }
  // (the stout wood: cells that stand in a block of two by two by two, which a leader or a heavy bough fills and a branch thinner
  // than a thigh does not)
  const stout = new Uint8Array(occ.length);
  { const sx = 1, sz = VX.nx, sy = VX.nx * VX.nz;
    for (let j = 0; j + 1 < VX.ny; j++) for (let k = 0; k + 1 < VX.nz; k++) for (let i = 0; i + 1 < VX.nx; i++) {
      const c = (j * VX.nz + k) * VX.nx + i;
      if (occ[c] && occ[c + sx] && occ[c + sz] && occ[c + sz + sx] && occ[c + sy] && occ[c + sy + sx] && occ[c + sy + sz] && occ[c + sy + sz + sx]) stout[c] = stout[c + sx] = stout[c + sz] = stout[c + sz + sx] = stout[c + sy] = stout[c + sy + sx] = stout[c + sy + sz] = stout[c + sy + sz + sx] = 1;
    } }
  /** Wood, or something lying on the mound, at (x, y, z)? Below the crown, where the wood is bare and near: within a hand's breadth of it
   *  (a leaf's own half length). Up among the leaves and the boughs that carry them: only the STOUT wood, the leaders and the heavy
   *  limbs. A leaf comes down through a crown among its branches, as leaves do, and twenty metres up no eye can tell one that goes
   *  behind a branch from one that brushes it; but every cell a six-centimetre twig touched used to stand in its way, so that
   *  nothing at all came down within six metres of the trunk: the crown's leaves fell in a ring, none on the mound that is heaped
   *  with them, and the page's helix round the trunk had nothing in it. */
  const HAND = 0.22, BARE = 16.5;
  const wood = (x, y, z) => (y < BARE
    ? voxAt(occ, x, y, z) || voxAt(occ, x + HAND, y, z) || voxAt(occ, x - HAND, y, z) || voxAt(occ, x, y + HAND, z) || voxAt(occ, x, y - HAND, z) || voxAt(occ, x, y, z + HAND) || voxAt(occ, x, y, z - HAND)
    : voxAt(stout, x, y, z));

  // ---- the mound's ground (the tree's own arithmetic if the tree is there; the same formula if it is not)
  const moundH = T && T.moundHeight ? T.moundHeight : (sv, dv) => {
    const x = dv - B.d, y = sv - B.s, r = Math.hypot(x, y), a = Math.atan2(y, x), shore = 5.0 + 0.45 * Math.sin(2 * a + 0.6) + 0.28 * Math.sin(3 * a - 1.1) + 0.18 * Math.sin(5 * a + 2.0);
    if (r <= shore) { const t = Math.max(0, (r - 1.1) / (shore - 1.1)); return 1.86 * (1 - Math.pow(t, 1.25)); }
    return -1.52 * Math.pow(Math.min(1, (r - shore) / (9.0 - shore)), 0.85);
  };
  const byMound = (s, d) => Math.abs(s - B.s) < 9.5 && Math.abs(d - B.d) < 9.5;

  // ---- the lustres (each on its bracket from a tier-3 pier), the pit's instruments, the kept lamp
  const lustres = plan.lustresAt().map((L) => ({ s: L.centre.s, d: L.centre.d, ps: L.s, pd: L.d, hs: L.hook.s, hd: L.hook.d }));
  const O = plan.orchestra, pit = [[O.harp[0], O.harp[1], 0.75, 1.0, 0.45], [O.bass[0], O.bass[1], 0.7, 1.5, 0.4], [O.timpani[0], O.timpani[1], 1.25, 0.75, 0.95], ...O.stands.map(([s, d]) => [s, d, 0.35, 0.4, 0.1])];      // s, d, the room a falling leaf gives it, how high it stands out of the water, how near a floating leaf lies to its middle
  const lampD = dev.has('lampd') ? +dev.get('lampd') : plan.lamp.d;
  const seg2 = (s, d, as, ad, bs, bd) => { const vs = bs - as, vd = bd - ad, t = clamp(((s - as) * vs + (d - ad) * vd) / Math.max(vs * vs + vd * vd, 1e-6), 0, 1); return (s - as - vs * t) ** 2 + (d - ad - vd * t) ** 2; };
  let hemNow = plan.curtainHem(show.c);                                     // the house curtain's hem, now (a leaf carried through the arch passes under it)

  /** What solid thing is at (s, d, y)? 0: nothing (a leaf may be there). 1 the arch wall and the rear fronts, 2 a front or a box, 3 a lustre,
   *  4 the tree's wood or something lying on the mound, 5 the chandelier, 6 something standing in the water, 7 the arch and the curtain, 8 the stage, 9 the fly tower. */
  const solid = (s, d, y) => {
    const ad = Math.abs(d);
    if (s < 31.7) return 1;                                                 // the arch wall: nothing of this goes back into the foyer through the air
    if (s < 90.9) {
      if (s - 31.2 < (y > 8.8 ? 1.6 : 0.5)) return 1;                       // the rear fronts of tiers 3 to 5, the royal box's canopy
      const o = into(s, ad);
      if (y < 3.0) { if (o < 0.5) return 2; }                               // the parterre boxes: rail, pilasters, pelmets
      else if (y < 19.35) {
        // tier t's front, its belly, its brackets and their flames (to 1.85 m above its floor line); then the open box above its rail
        const t = clamp(Math.floor((y + 0.25) / 3.2), 1, 5), rel = y - 3.2 * t;
        if (o + 0.25 * t < (rel < 1.85 ? 0.75 : 0.2)) return 2;
      } else if (o + 1.25 < 0.9 + 0.9 * (y - 19.35)) return 2;              // the cornice, and the cove leaning in above it
      if (y > 6.4 && y < 10.8) for (const L of lustres) { if ((s - L.s) ** 2 + (d - L.d) ** 2 < 1.1) return 3; if (y > 9.9 && seg2(s, d, L.ps, L.pd, L.hs, L.hd) < 0.16) return 3; }
      if (voxAt(blk, d, y, -s)) return 5;                                   // the chandelier
      if (wood(d, y, -s)) return 4;                                         // the trunk, the limbs, what lies on the mound, the lifted seats
      if (y < 1.9) for (const q of leaning) if ((s - q.s) ** 2 + (d - q.d) ** 2 < 2.0) return 6;
      if (s > 78 && y < 1.6) for (const q of pit) if (y < q[3] && (s - q[0]) ** 2 + (d - q[1]) ** 2 < q[2] * q[2]) return 6;
      if (s > 88.7 && (ad > 11.0 || y > Math.min(plan.archHead(d) - 0.8, hemNow - 0.9))) return 7;      // the proscenium; the curtain
      return 0;
    }
    if (s < 91.5) return ad > 11.0 || y > Math.min(plan.archHead(d) - 0.8, hemNow - 0.9) ? 7 : 0;
    if (s < 119.3) {
      if (ad > 9.9) return 8;                                               // the wings, the rollers
      if (s > 95.2 && y > 9.0) return 8;                                    // the borders
      if (s > 103.0 && s < 105.2 && d > -11.8 && d < -0.6 && y > 3.7) return 8;        // cloud car A, wherever it is on its way
      if (s > 114.0 && s < 116.1 && d > -10.2 && d < 1.2 && y > 6.0) return 8;         // cloud car C
      if (s > 115.8 && s < 118.2 && d < -1.0 && y > 0.8) return 8;                      // the stage moon on its wire
      if (y < 3.3 && (s - plan.lamp.s) ** 2 + (d - lampD) ** 2 < 0.64) return 8;        // the kept lamp
      return 0;
    }
    if (s < 120.4) return 8;                                                // the backcloth
    if (ad > 9.4 || (ad > 7.4 && y > 1.8) || s > 162) return 9;             // the fly tower: rope walls, bags and pin rails, its ragged end
    for (const c of plan.fly.cloths) if (Math.abs(s - c.s) < 0.6 && (y > 3.0 || (c.s > 145 && d < -5))) return 9;      // the three old cloths (the third trails a corner in the water)
    return 0;
  };
  /** Is (s, d, y) within a step or two of something solid? (There a leaf's way is walked finely.) */
  const closeTo = (s, d, y) => {
    if (s > 90.9) return s < 92 || (s > 119 && s < 121) || Math.abs(d) > 9 || (y < 3.6 && (s - plan.lamp.s) ** 2 + (d - lampD) ** 2 < 3);
    if (voxAt(nearby, d, y, -s)) return true;
    const ad = Math.abs(d);
    if (s - 31.2 < (y > 8.8 ? 2.3 : 1.2) || s > 88) return true;
    const o = into(s, ad);
    if (y < 3.0) { if (o < 1.15) return true; }
    else if (y < 19.35) { const t = clamp(Math.floor((y + 0.25) / 3.2), 1, 5); if (o + 0.25 * t < (y - 3.2 * t < 1.85 ? 1.4 : 0.85)) return true; }
    else return true;
    if (y > 5.8 && y < 11.4) for (const L of lustres) if ((s - L.s) ** 2 + (d - L.d) ** 2 < 4.4) return true;
    if (y < 2.4) { for (const q of leaning) if ((s - q.s) ** 2 + (d - q.d) ** 2 < 6) return true; if (s > 77 && ad > 8.6) return true; if (byMound(s, d)) return true; }
    return false;
  };
  /** May a leaf lie on the water at (s, d)? (Open water of the house or the stage: not a box, not the mound, not under something that stands in it.) */
  const onWater = (s, d) => {
    const ad = Math.abs(d);
    if (s > 120.5) return s < 160 && ad < 9.2;                             // the fly tower's water, between its rope walls
    if (s < 19 || s > 119.6) return false;
    if (s < 28.3) return ad < (s < 24 ? 7.3 : plan.foyer.wallAt(s) - 0.7);
    if (s < 31.7) return ad < 3.2 || (ad > 5.8 && ad < 12.2);               // through the three arches, between their piers
    if (s < 90.9) {
      if (into(s, ad) < 0.55) return false;
      if (byMound(s, d) && moundH(s, d) > -0.03) return false;
      if (lowAt(d, -s)) return false;
      for (const q of leaning) if ((s - q.s) ** 2 + (d - q.d) ** 2 < 1.7) return false;
      if (s > 78) for (const q of pit) if ((s - q[0]) ** 2 + (d - q[1]) ** 2 < q[4] * q[4]) return false;
      return s < 88.9 || ad < 11.6;
    }
    return ad < 10.3 && !((s - plan.lamp.s) ** 2 + (d - lampD) ** 2 < 0.09);
  };

  // ============================================================================================ the house's light on a leaf
  const UL = {
    uLvRoom: { value: new THREE.Color(0, 0, 0) }, uLvMoon: { value: new THREE.Color(0, 0, 0) },      // the lit house on a leaf in its air; the moon on its pale face before that (set every frame)
    uLvFire: { value: new THREE.Vector4(0, 17.6, 0, 0) },                   // the middle of the chandelier's flames; w: the share of them alight
    uLvBack: { value: new THREE.Color('#E0492B').multiplyScalar(1.8) },     // a leaf between the eye and a flame: the page's vermilion, times 1.8
    uLvThru: { value: new THREE.Color('#FFE9D2') },                         // the moon's light as it comes through a leaf
    uLvK: { value: new THREE.Vector4(...nums('lvk', [0.9, 1.0]), 0, 0) },   // how strongly: the moon through a leaf, the fire through a leaf
    uLvBig: { value: new THREE.Vector4(...nums('lvbig', P.big), 0) },
    uLvLow: { value: new THREE.Vector4(...nums('lvlow', P.low)) },
    uLvSee: { value: new THREE.Vector3(...nums('lvsee', A.rake ?? [0.16, 4, 12])) },      // a leaf afloat far off is tipped toward the eye: rise to a metre, from how far, in full from how far
    uLvPass: { value: new THREE.Vector4(0, num('lvmirror', P.mirror), 0, 0) },               // the pass being drawn (0 the picture, 1 the picture without the water, 2 the mirror); the mirror's share
    uLvCol: { value: new THREE.Vector4(axis.x, axis.z, (C.inward && C.inward.from) || 13, 0) },      // the trunk's axis (x, z); the height below which the column draws leaves in toward it
    uLvCarry: { value: new THREE.Vector2(0, 0) },                           // how far the draught has carried things so far (x, z)
    uLvEye: { value: new THREE.Vector4(calm ? 1.6 : 0.9, 0.78, 0.6, 2.2) }, // metres kept clear round the rider's eye; round the boat's middle line; below and above which heights a leaf is eased aside from the boat
    uLvDry: { value: 1.55 },                                                // how much lighter a leaf is at the moment it lands than when it has taken up water
    uLvDeep: { value: A.deep },                                             // metres a leaf that has soaked goes down before it is lost in the water's dark
    uLvWet: { value: new THREE.Vector4(...nums('lvwet', A.wet)) },          // a wet leaf on the water: its middle's tone, its curled edge's, how hard its lit colour is held in, the share of the kept lamp it takes
  };
  { const f = at(ctx, plan.chandelier.s, plan.chandelier.d, 17.6); UL.uLvFire.value.set(f.x, f.y, f.z, 0); }
  // (before the family's own extension, so that the family's cap on paint holds this light in too: copper stays copper)
  // `level`: the share of the lit room that a leaf lying LEVEL takes. In the air 0.22: a leaf turned upright takes the flames at the
  // walls broadside and a leaf lying level shows its face to the dark dome, so it glints and goes dark as it turns over. On the
  // water it is more (plan: afloat.level): the flames stand in rings from 4.6 to 17 m up all round the house, and a level thing
  // in the middle of the floor has every one of them 13 to 40 degrees above its horizon, where an upright one has half of them.
  // At 0.22 a leaf afloat in the lit house was a dark red sliver on black water and the fall left the water looking bare.
  const litOf = (level) => ({
    uniforms: UL,
    fragmentPars: 'uniform vec3 uLvRoom, uLvMoon, uLvBack, uLvThru; uniform vec4 uLvFire, uLvK;',
    light: /* glsl */`
    { // ---- a leaf in the room's air (src/realms/theatre/cast.js; the presences' leaves take the same two: cast_presences.js)
      // the lit house: its hundreds of flames stand at the walls, so a leaf turned upright takes them broadside and a leaf lying
      // level takes a share of them
      float lvHouse = smoothstep(27.0, 31.0, -vWPos.z) * (1.0 - 0.6 * smoothstep(89.0, 100.0, -vWPos.z)) * (1.0 - 0.85 * smoothstep(119.0, 123.0, -vWPos.z));      // (behind the painting: the lantern's)
      c += albedo * uLvRoom * (lvHouse * (${level.toFixed(3)} + ${(1 - level).toFixed(3)} * (1.0 - N.y * N.y)));
      // before the house is lit, a leaf shows a pale face to the moon as it turns
      float lvFace = abs(dot(N, V));
      c += (0.22 + albedo) * uLvMoon * (lvFace * lvFace);
    }`,
  });
  const lit = litOf(0.22), litSea = litOf(clamp(num('lvlevel', A.level ?? 0.5), 0, 1));
  // (after the family's: what the room does to a leaf's way, its size, its share of the mirror; and the light that comes THROUGH a leaf, which is not paint and is not capped)
  const afterAir = {
    uniforms: UL,
    vertexPars: /* glsl */`
    attribute vec4 aLvA, aLvB, aLvC;         // (cast.js) its rate round the trunk, the share of its distance from the trunk that the column draws it in, the draught's carrying when it was let go (x, z);  the slip from where it lay (x, y, z) and its seconds;  the lift: when, how far, seconds up, seconds down
    uniform vec4 uLvBig, uLvPass, uLvCol, uLvEye; uniform vec2 uLvCarry;
    float lvBump(float t, float up, float down) { return t < up ? smoothstep(0.0, up, t) : 1.0 - smoothstep(0.0, down, t - up); }
    // the mound's ground under the realm's (x, z), in metres above the water: tree.js moundHeight, to the letter (-1: open water)
    float lvMound(vec2 p) {
      float x = p.x - uLvCol.x, y = uLvCol.y - p.y, r = length(vec2(x, y));
      if (r > 5.95) return -1.0;
      if (r < 0.05) return 1.86;
      float a = atan(y, x), shore = 5.0 + 0.45 * sin(2.0 * a + 0.6) + 0.28 * sin(3.0 * a - 1.1) + 0.18 * sin(5.0 * a + 2.0);
      if (r > shore) return -1.0;
      float t = max(0.0, (r - 1.1) / (shore - 1.1));
      return 1.86 * (1.0 - pow(t, 1.25)) + 0.10 * sin(1.7 * x + 0.3) * sin(1.3 * y - 0.8) * min(1.0, t * 3.0);
    }`,
    vertexLocal: /* glsl */`
    { // (src/realms/theatre/cast.js) What the family has made is a leaf falling in still air over the place it was let go, tumbling and
      // swinging as a beech leaf does: its middle is fF.pos, the card about it is transformed - fF.pos. What follows is this room's.
      vec3 lvC = fF.pos, lvCard = transformed - fF.pos;
      float lvT = fF.tau;
      // (1) it leaves the place where it lay (a rail's velvet): a slip out into the room, level at first, and then the fall
      if (aLvB.w > 0.0) { float lvU = 1.0 - clamp(lvT / aLvB.w, 0.0, 1.0); lvC += aLvB.xyz * (lvU * lvU); }
      // (2) lifted for a few seconds on the way: up, then down over the rest of its fall, never much faster than it fell
      if (aLvC.y > 0.0 && lvT > aLvC.x) lvC.y += aLvC.y * lvBump(lvT - aLvC.x, aLvC.z, aLvC.w);
      // (3) the column of turning air round the trunk: each goes round at its own rate, and below the boughs the column draws some of
      // them in toward the trunk as they come down (aLvA.y: by what share of their distance from it); the draught carries each on
      // toward the stage on top of that
      float lvAng = aLvA.x * lvT, lvCa = cos(lvAng), lvSa = sin(lvAng);
      vec2 lvQ = (lvC.xz - uLvCol.xy) * (1.0 - aLvA.y * (1.0 - smoothstep(0.0, uLvCol.z, lvC.y))), lvN = objectNormal.xz;
      lvC.xz = uLvCol.xy + vec2(lvQ.x * lvCa - lvQ.y * lvSa, lvQ.x * lvSa + lvQ.y * lvCa) + (uLvCarry - aLvA.zw);
      lvCard.xz = vec2(lvCard.x * lvCa - lvCard.z * lvSa, lvCard.x * lvSa + lvCard.z * lvCa);
      objectNormal.xz = vec2(lvN.x * lvCa - lvN.y * lvSa, lvN.x * lvSa + lvN.y * lvCa);
      // (4) over the mound it comes down ON the heap of leaves that lies there, wherever the draught has carried it: at that ground it
      // is one more leaf of the heap, and none is drawn below it
      float lvG = lvMound(lvC.xz), lvHeap = lvG > 0.005 ? smoothstep(lvG - 0.01, lvG + 0.05, lvC.y) : 1.0;
      // (5) the rider's boat: a leaf coming down over it is eased aside by the air the hull pushes before it, and lands beside it
      vec2 lvHb = uLifeHull.zw - uLifeHull.xy, lvHp = lvC.xz - uLifeHull.xy;
      vec2 lvHx = lvHp - lvHb * clamp(dot(lvHp, lvHb) / max(dot(lvHb, lvHb), 1.0e-4), -0.12, 1.3);
      float lvHd = length(lvHx), lvReach = max(uLifeHullB.x + 0.36, uLvEye.y), lvLow = 1.0 - smoothstep(uLvEye.z, uLvEye.w, lvC.y);
      if (lvHd < lvReach && lvLow > 0.0) lvC.xz += (lvHd > 1.0e-3 ? lvHx / lvHd : normalize(vec2(-lvHb.y, lvHb.x) + 1.0e-5)) * ((lvReach - lvHd) * lvLow);
      // (6) nothing comes within a step of the rider's eye: it is eased round, never switched off (the family's own rule, taken
      // here because the leaf has been moved since the family placed it)
      float lvShow = 1.0;
      vec3 lvE = lvC - uCameraPos; float lvD2 = dot(lvE, lvE), lvR = uLvEye.x;
      if (lvD2 < 16.0 * lvR * lvR) {
        float lvD = sqrt(lvD2), lvKk = 1.0 - smoothstep(0.0, 4.0 * lvR, lvD);
        lvC = uCameraPos + lvE * (sqrt(lvD2 + lvR * lvR * lvKk * lvKk) / max(lvD, 1.0e-3));
        lvShow = smoothstep(0.0, 0.25 * lvR, lvD);
      }
      // (7) a leaf in the air is drawn larger the further off it is, as the crown's own are: life size beside the hull, about three
      // times across the stalls; and only a share of them stand in the water's mirror
      float lvDist = length(lvC - uCameraPos);
      float lvK = mix(mix(uLvBig.x, uLvBig.y, smoothstep(2.0, 22.0, lvDist)), uLvBig.z, smoothstep(34.0, 70.0, lvDist));
      transformed = lvC + lvCard * (lvK * lvShow * lvHeap);
      if (uLvPass.x > 1.5 && fract(aSeed.w * 97.13 + aSeed.x * 3.71) > uLvPass.y) transformed = vec3(0.0, -60.0, 0.0);
    }`,
    light: /* glsl */`
    { // ---- light through a leaf (src/realms/theatre/cast.js). N is the side the eye sees.
      // the moon, inside the shaft: the eye under the leaf, the light coming down on its other face: copper, glowing
      vec2 lvQ = vWPos.xz - (uShaft.xy + uShaftLean * vWPos.y);
      float lvIn = 1.0 - smoothstep(uShaft.z * 0.8, uShaft.z * 1.25, length(lvQ));
      vec3 lvWarm = mix(albedo, vec3(1.0, 0.56, 0.20) * (dot(albedo, vec3(0.3, 0.55, 0.15)) * 1.7), 0.38);      // (as the crown's own leaves: copper pales toward amber as light comes through it)
      glow += lvWarm * uLvThru * (uShaft.w * lvIn * max(dot(N, uKeyDir), 0.0) * uLvK.x);
      // the fire in the tree: a leaf that hangs between the eye and the flames is vermilion glass
      vec3 lvF = uLvFire.xyz - vWPos; float lvD2 = dot(lvF, lvF); lvF *= inversesqrt(max(lvD2, 1.0e-4));
      float lvT = max(dot(-V, lvF), 0.0); lvT *= lvT * lvT;
      glow += uLvBack * (albedo.r + 0.1) * (uLvFire.w * lvT * uLvK.y / (1.0 + lvD2 / 90.0));
    }`,
  };
  const afterAfloat = {
    uniforms: UL,
    vertexPars: 'attribute vec2 aLvF; uniform vec4 uLvLow, uLvBig; uniform vec3 uLvSee; uniform float uLvDeep; varying vec3 vLvF;',      // (cast.js) when it landed; how dark this one is
    vertexLocal: /* glsl */`
    { // (src/realms/theatre/cast.js) A leaf afloat is the size it was in the air, at every distance (plan: low is big's first knee):
      // life size beside the hull, larger far off as every leaf of this house is drawn. It was life size to six metres and 1.4 times
      // at sixteen: a leaf that landed far off shrank by almost half as it touched the water, and beyond five metres the leaves
      // on the water were slivers a pixel high.
      vec3 lvC = vec3(fC.x, fY, fC.y);
      float lvD = length(lvC - uCameraPos), lvAge = uLifeNow - aLvF.x, lvNew = 1.0 - smoothstep(0.0, 2.5, lvAge);
      float lvAir = mix(mix(uLvBig.x, uLvBig.y, smoothstep(2.0, 22.0, lvD)), uLvBig.z, smoothstep(34.0, 70.0, lvD));
      float lvK = mix(mix(mix(uLvLow.x, uLvLow.y, smoothstep(uLvLow.z, uLvLow.w, lvD)), uLvBig.z, smoothstep(34.0, 70.0, lvD)), lvAir, lvNew);
      vec3 lvV = (transformed - lvC) * lvK;
      // Far off it is tipped a little toward the eye, its far edge a finger higher (a stage's rake): seen from a metre above the
      // water a level leaf ten metres away is a line, and with the rake it is two or three pixels of copper.
      { vec2 lvAway = lvC.xz - uCameraPos.xz; float lvAl = length(lvAway), lvRake = uLvSee.x * smoothstep(uLvSee.y, uLvSee.z, lvAl);
        lvAway /= max(lvAl, 1.0e-3);
        lvV.y += dot(lvV.xz, lvAway) * lvRake;
        objectNormal = normalize(objectNormal - vec3(lvAway.x, 0.0, lvAway.y) * lvRake); }
      // It rides a ring with its low edge ON the water, never under it: the family tips it about its middle, so its middle is
      // lifted by as much as its low edge would have gone under (under the water the ripples saw an edge into teeth).
      lvC.y += length(fSv) * 0.5 * aSeat.z * lvK;
      // At the end of its time it has taken up water: one edge goes under, and it slides down on its own plane, to and fro and
      // pitched the way it is going, as a leaf goes down through water; it is lost in the dark of the water before the family
      // takes it away (it leaves by sinking, never by shrinking).
      float lvLeft = uFloD.z - (uLifeNow - aLife.x), lvS = 1.0 - smoothstep(4.5, 12.0, lvLeft);
      if (lvS > 0.0) {
        float lvA = aSeed.y * 6.2831853, lvPh = 2.5 * (12.0 - lvLeft) + aSeed.x * 6.2831853, lvIn = smoothstep(0.0, 0.22, lvS);
        vec2 lvE = vec2(cos(lvA), sin(lvA));                                 // the way it slides
        float lvTh = -0.8 * lvIn * cos(lvPh), lvCs = cos(lvTh), lvSn = sin(lvTh);
        float lvAl = dot(lvV.xz, lvE); vec2 lvAc = lvV.xz - lvE * lvAl;
        lvV = vec3(lvAc + lvE * (lvAl * lvCs - lvV.y * lvSn), lvAl * lvSn + lvV.y * lvCs).xzy;
        lvC.xz += lvE * (0.11 * lvIn * sin(lvPh));
        lvC.y -= uLvDeep * lvS * lvS + 0.035 * lvIn * (1.0 - lvS);           // (its middle goes a finger under as it tips: the leaf is half in, half out)
      }
      transformed = lvC + lvV;
      vLvF = vec3(smoothstep(0.0, 5.0, lvAge), aLvF.y, lvS);
    }`,
    fragmentPars: 'varying vec3 vLvF; uniform float uLvDry; uniform vec4 uLvWet;',
    // (it darkens over five seconds as it takes up water. Wet, it is darkest in its middle, where the water stands in it; its
    // curled edges are clear of the water and lighter: without that a floating leaf is a flat sticker)
    albedo: /* glsl */`albedo *= vLvF.y * mix(uLvDry, 1.0, vLvF.x);
      { float lvR = length(vFloPiece.xy * vec2(2.9, 1.9)); albedo *= mix(1.0, mix(uLvWet.x, uLvWet.y, smoothstep(0.25, 1.0, lvR)), vLvF.x); }`,
    // (a wet leaf lying on black water takes a lamp as the water's own skin does: richly, never as a light. Its lit colour is
    // held in, hue kept: beside the lantern it was yellow paper, lighter than the lamp-lit boat)
    // The kept lamp stands on a post seven or ten metres off and a leaf lies level: the paint's wrapped light gives it half the lamp,
    // the true angle a quarter, and the stage counts its lamp twice over (light.js): a share of it is taken off again.
    light: /* glsl */`{
      float lvSt = smoothstep(91.0, 94.0, -vWPos.z) * (1.0 - smoothstep(119.3, 121.0, -vWPos.z));
      c -= albedo * pointLight(uLampPos, uLampColor, uLampRadius, N) * ((1.0 + lvSt * uLampMore) * (1.0 - uLvWet.w));
      c = max(c, vec3(0.0));
      float lvM = max(c.r, max(c.g, c.b)); c *= 1.0 / (1.0 + uLvWet.z * lvM * lvM); }`,
  };
  // The family is given the realm's own ctx (its clock, the rider's hull and the track the hull has left are kept by ctx: a ctx of this
  // module's own made the boat's track start afresh at every frame, whichever module asked for the hull second). So, for the moment
  // one of its factories runs, the kit's gouache is this module's: what the family asks for is dressed in the house's paint for a
  // leaf (lib.js), with this module's extensions before and after the family's own.
  const dressed = (over, before, after, make) => {
    const kit = ctx.kit, was = kit.gouache;
    const mine = (o = {}) => { kit.gouache = was; try { return H.paint('leaf', { ...o, ...over, extend: [...before, ...[].concat(o.extend || []), ...after] }); } finally { kit.gouache = mine; } };
    kit.gouache = mine;
    try { return make(); } finally { kit.gouache = was; }
  };

  // ============================================================================================ the leaves in the air
  const stats = { letGo: 0, refused: 0, waited: 0, landed: 0, rings: 0, kept: 0, onMound: 0, born: [0, 0, 0, 0], inTheWay: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], timed: dev.has('lvlog'), ms: 0, msMost: 0, frames: 0, steps: 0, msCheck: 0, checks: 0, stepsAtStart: 0, checksAtStart: 0, msCheckAtStart: 0 };
  const api = shared.cast.leaves = { onLand: null };
  // The family's leaf, let go one by one. The family is asked for nothing but the leaf and its fall in still air: no column, no
  // wind, no landings, no room kept round the eye and no deck (all of those are this module's, above and below).
  const fall = dressed({ take: nums('lvair', P.take.air), keep: P.keep.air, brush: 0.3 }, [lit], [afterAir], () => makeFall(ctx, {
    kind: 'leaf', count: 0, pool: P.air.pool * want, shape: dev.get('lvkite') === '0' ? 'leaf' : LF.shape, size: LF.size, speed: LF.speed, sway: LF.sway, swings: LF.swings,
    stall: LF.stall, rock: LF.rock, turns: LF.turns, spread: LF.spread, spreadOver: LF.spreadOver, far: [12, 1], backlight: 0, inside: TOP, outside: UNDER,
    mirror: true, wind: [0, 0], landings: false, keepOut: 0, deck: 0, seed: 1401,
  }));
  const airMesh = fall.object.children[0], airGeo = airMesh.geometry, POOL = fall.pool;
  const seeds = airGeo.attributes.aSeed.array, aBirth = airGeo.attributes.aBirth, birth = aBirth.array;
  const aA = new THREE.InstancedBufferAttribute(new Float32Array(POOL * 4), 4), aB = new THREE.InstancedBufferAttribute(new Float32Array(POOL * 4), 4), aC = new THREE.InstancedBufferAttribute(new Float32Array(POOL * 4), 4);
  for (const a of [aA, aB, aC]) a.setUsage(THREE.DynamicDrawUsage);
  airGeo.setAttribute('aLvA', aA); airGeo.setAttribute('aLvB', aB); airGeo.setAttribute('aLvC', aC);
  const airDirt = makeDirt([aBirth, aA, aB, aC]);
  let hw = 0;                                                               // one more than the highest slot in use: only so many are drawn
  // which pass draws how many: those in use in the picture, the mirror's share of them in the mirror (chosen in the shader: a
  // fair sample however the slots stand), none in the picture the water reads as what lies beneath
  { const fam = airMesh.onBeforeRender;
    airMesh.onBeforeRender = (renderer, scene, camera, geometry, material) => {
      const pass = ctx.engine.reflecting ? 2 : renderer.getRenderTarget() === ctx.engine.pre ? 1 : 0;
      UL.uLvPass.value.x = pass; airGeo.instanceCount = pass === 1 ? 0 : hw;
      fam(renderer, scene, camera, geometry, material);
    };
    airMesh.onAfterRender = () => { airGeo.instanceCount = hw; }; }
  airMesh.name = `leaves in the air (${POOL} slots)`;
  airGeo.instanceCount = 0;

  // ---- where a leaf is, `tm` seconds after it was let go. THE FAMILY'S OWN ARITHMETIC for the fall in still air, copied (falls.js:
  // fallAt, a burst; fallMove, the tumble), and this module's on top, as in the vertex extension above: if the family changes how a
  // leaf falls, the first half of `where` must follow, or leaves will be let go on ways that are no longer theirs (&lvtrace=24 is
  // the test: the leaves must ride the lines).
  const rc = [0, 0, 0, 0];
  const VT = TAU * (dev.has('lvturn') ? nums('lvturn', [C.seconds, C.core])[1] : C.core) / (dev.has('lvturn') ? nums('lvturn', [C.seconds, C.core])[0] : C.seconds);      // metres a second round the trunk
  const Lf = { bx: 0, by: 0, bz: 0, g: 0, v: 1, Pm: 1, thr: 0, tx: 0, tz: 0, A: 0, dx: 0, dz: 0, w: 0, ph: 0, Wt: 1, b0: 0, half: 0, om: 0, inw: 0, sx: 0, sy: 0, sz: 0, sT: 0, l1: 0, lA: 0, lU: 1, lD: 1 };
  const IN = C.inward || { share: 0, by: [0, 0], from: 13 };                // the column draws a share of the crown's leaves in toward the trunk below the boughs
  /** Make `Lf` the leaf of slot `slot`: let go at (bx, bz), the family letting it fall `by` metres to a level `g` of its own. */
  const aim = (slot, bx, by, bz, g) => {
    const i4 = slot * 4, s0 = seeds[i4], s2 = seeds[i4 + 2];
    rand4(slot, 7, rc);
    Lf.bx = bx; Lf.by = by; Lf.bz = bz; Lf.g = g;
    Lf.v = lerp(LF.speed[0], LF.speed[1], s0); Lf.Pm = Math.max(by, 0.05) / Lf.v;
    Lf.thr = LF.spread * Math.sqrt(rc[1]); Lf.tx = Math.cos(rc[0] * TAU); Lf.tz = Math.sin(rc[0] * TAU);
    Lf.A = LF.sway * (0.6 + 0.8 * fract(s2 * 3.17)) * calmK; Lf.dx = Math.cos(rc[3] * TAU); Lf.dz = Math.sin(rc[3] * TAU);
    Lf.w = TAU * lerp(LF.swings[0], LF.swings[1], s2); Lf.ph = rc[2] * TAU;
    const r = lerp(LF.turns[0], LF.turns[1], fract(s2 * 7.31)) * lerp(0.5, 1, calmK);
    Lf.half = Math.max(1, Math.floor(2 * Lf.Pm * r + 0.5)) + (rc[2] < 0.5 ? 0 : 1);      // half turns over itself by the time it lands (odd: it lands the other side up)
    Lf.Wt = Math.PI * Math.max(1, Math.floor(2 * Lf.Pm * r + 0.5)) / Lf.Pm; Lf.b0 = rc[2] < 0.5 ? 0 : Math.PI;
    return Lf.Pm;
  };
  const bump = (t, up, down) => (t < up ? S(t / up) : 1 - S((t - up) / down));
  const where = (tm, cx, cz, out) => {
    // the family's: over the place it was let go, wandering a little apart, swinging round an oval, hanging and diving as it turns over
    const thrown = Lf.thr * (1 - Math.exp(-Math.max(tm, 0) / LF.spreadOver));
    const x = Lf.w * tm + Lf.ph, sn = Lf.A * Math.sin(x), cs = 0.45 * Lf.A * Math.cos(x), env = smooth(0, 1.2, tm) * smooth(0, 1.2, Lf.Pm - tm);
    const prog = tm - LF.stall / (2 * Lf.Wt) * Math.sin(2 * (Lf.Wt * tm + Lf.b0));
    let px = Lf.bx + Lf.tx * thrown + (Lf.dx * sn - Lf.dz * cs) * env, py = Lf.v * (Lf.Pm - prog), pz = Lf.bz + Lf.tz * thrown + (Lf.dz * sn + Lf.dx * cs) * env;
    // this module's: the slip from where it lay, the lift, the turn round the trunk and the column's draw toward it, the draught's carrying
    if (Lf.sT > 0) { const u = 1 - clamp(tm / Lf.sT, 0, 1), k = u * u; px += Lf.sx * k; py += Lf.sy * k; pz += Lf.sz * k; }
    if (Lf.lA > 0 && tm > Lf.l1) py += Lf.lA * bump(tm - Lf.l1, Lf.lU, Lf.lD);
    const draw = Lf.inw > 0 ? 1 - Lf.inw * (1 - S(py / IN.from)) : 1;
    const ang = Lf.om * tm, ca = Math.cos(ang), sa = Math.sin(ang), rx = (px - axis.x) * draw, rz = (pz - axis.z) * draw;
    px = axis.x + rx * ca - rz * sa + cx; pz = axis.z + rx * sa + rz * ca + cz;
    out.x = px; out.y = py; out.z = pz;
    return out;
  };
  const aimSlot = (i) => {
    const i4 = i * 4;
    aim(i, birth[i4], birth[i4 + 1], birth[i4 + 2], 0);
    Lf.om = aA.array[i4]; Lf.inw = aA.array[i4 + 1]; Lf.sx = aB.array[i4]; Lf.sy = aB.array[i4 + 1]; Lf.sz = aB.array[i4 + 2]; Lf.sT = aB.array[i4 + 3];
    Lf.l1 = aC.array[i4]; Lf.lA = aC.array[i4 + 1]; Lf.lU = aC.array[i4 + 2]; Lf.lD = aC.array[i4 + 3];
    return Lf.Pm;
  };
  const pt = { x: 0, y: 0, z: 0 };
  /** What stands in a leaf's way at the realm's (x, y, z)? 0: nothing. -2: it has come down on the mound's heap of leaves, where its way
   *  ends (the vertex extension draws no leaf below that ground: lvMound). It never comes down on what lies on the mound. */
  const HEAP = 0.005;                                                       // (the mound's ground counts as a heap to land on wherever it stands above the water)
  const meets = (x, y, z) => {
    const s = -z, d = x;
    if (y < 2.6 && byMound(s, d)) {
      const m = moundH(s, d);
      if (m > HEAP) {
        if (y < m + 0.01) return -2;
        // (within two hands of the heap: what lies on it is asked about cell by cell, not a hand's breadth round every cell, or
        // nothing could come down between a root and a slab; in the cell of a root, a seat or a piece of the ceiling nothing lands)
        if (y < m + 0.45) return voxAt(occ, d, y, z) || voxAt(occ, d, Math.max(y, m + 0.2), z) ? 4 : 0;
      } else if (m > -0.02 && y < m + 0.45) return wood(d, y, z) ? 4 : 0;
    }
    return solid(s, d, y);
  };
  /** A leaf that leaves the rail at `q`: is (s, d, y) in the air it leaves through? (Over the velvet, or clear of the front's belly, and well away from the pier and its bracket.) */
  const leaving = (q, s, d, y) => {
    const out = (s - q.s) * q.ns + (d - q.d) * q.nd, along = (d - q.d) * q.ns - (s - q.s) * q.nd, rel = y - plan.tiers[q.t].floor;
    return Math.abs(along) < LV.pier - 0.15 && out > 0.03 && (rel >= 1.085 || (out >= 0.46 && rel > -0.4));
  };

  // ---- the draught, as far as a leaf's way is concerned. The wind is taken as it is now; but it turns at the hour, strengthens for
  // the fall and drops again, and the staging may drive it. `devHi(t)` and `devLo(t)`: how many metres further toward the stage, or
  // short of it, the draught may have carried a leaf t seconds from now than the wind as it is would; every place between is asked.
  const sAtC = (cv) => { const tb = plan.show.table; for (let i = 1; i < tb.length; i++) if (tb[i][1] >= cv) return tb[i - 1][0] + (tb[i][0] - tb[i - 1][0]) * (cv - tb[i - 1][1]) / Math.max(1e-6, tb[i][1] - tb[i - 1][1]); return tb[tb.length - 1][0]; };
  const fallAtS = sAtC(P.wind.from), dropAtS = sAtC(P.wind.to), BOAT = 4.6;      // where the boat's own progress pushes the clock to the fall and to its end; the boat's best speed in the house
  const DEV = { tH: 1e9, eH: 0, tF: 1e9, eF: 0, fLen: 0, tD: 1e9, eD: 0 };
  let windNow = 0;
  const auto = { wind: !dev.has('lvwind'), drift: true, cover: !dev.has('lvcover'), crown: true, through: true };
  const setDev = () => {
    const w = windNow, c = show.c;
    if (!auto.wind) { DEV.tH = dev.has('lvwind') ? 1e9 : 0; DEV.eH = Math.max(0, P.wind.fall - w); DEV.tF = 1e9; DEV.eF = 0; DEV.fLen = 0; DEV.tD = dev.has('lvwind') ? 1e9 : 0; DEV.eD = Math.max(0, w); return; }
    DEV.eH = Math.max(0, P.wind.hour - w); DEV.tH = c >= 0 ? 0 : Math.max(0, (plan.show.cueAt - ctx.s) / BOAT);
    if (c > P.wind.to + 3) { DEV.tF = 1e9; DEV.eF = 0; } else { const byWay = (fallAtS - ctx.s) / BOAT; DEV.tF = Math.max(0, c >= 0 ? Math.min(P.wind.from - c, byWay) : byWay); DEV.eF = Math.max(0, P.wind.fall - Math.max(w, P.wind.hour)); }
    DEV.fLen = P.wind.to - P.wind.from + 3;
    DEV.eD = Math.max(0, w - P.wind.hour); DEV.tD = DEV.eD > 0 ? Math.max(0, Math.min(P.wind.to - c, (dropAtS - ctx.s) / BOAT)) : 1e9;
  };
  const devHi = (t) => DEV.eH * Math.max(0, t - DEV.tH) + DEV.eF * clamp(t - DEV.tF, 0, DEV.fLen);
  const devLo = (t) => -DEV.eD * Math.max(0, t - DEV.tD);

  /**
   * Is the whole way down clear for the leaf `Lf`, already `age` seconds on its way? `rail`: the place on a rail it leaves, if it
   * does. Returns 0 if the way is clear, or what is in it (see `solid`).
   */
  const fW = { x: 0, z: 0 };                                                // the wind as it is, in the realm's x and z
  /** What is in the leaf's way at `tm` if the draught has carried it `e` metres further than the wind as it is would (0: nothing; -1: nothing, but something is near). */
  const ask = (tm, e, rail) => {
    where(tm, fW.x * tm + toStage.x * e, fW.z * tm + toStage.y * e, pt); stats.steps++;
    let what = meets(pt.x, pt.y, pt.z);
    if (what === 2 && rail && tm < 2.4 && leaving(rail, -pt.z, pt.x, pt.y)) what = 0;
    return what || (closeTo(-pt.z, pt.x, pt.y) ? -1 : 0);
  };
  const clearWay = (age, rail) => {
    const Pm = Lf.Pm, from = Math.max(0.08, age - 0.05);
    // (1) the way as the wind is now. Where it comes down, first (the dearest refusal is the one found at the end of the way)
    for (let tm = Pm - 0.02; tm > Pm - 2.3 && tm > from; tm -= 0.45) { const what = ask(tm, 0, rail); if (what > 0) return what; }
    // (a leaf that has come down on the mound's heap is not drawn below that ground: from there to the end of its time it must stay
    // under it, or it would come up out of the heap again)
    let heaped = false;
    for (let tm = from; tm < Pm - 0.02;) { const what = ask(tm, 0, rail); if (what > 0) return what; if (what === -2) heaped = true; else if (heaped) return 4; tm += what === -1 ? 0.06 : heaped ? 0.1 : 0.2; }
    // (2) and if the draught may change on its way: the same way again, in every place it could be carried to (a pace apart at most)
    const left = Pm - age;
    if (devHi(left) - devLo(left) < 0.06) return 0;
    for (let tm = Math.max(from, age + Math.min(DEV.tH, DEV.tF, DEV.tD)); tm < Pm - 0.01;) {
      const since = tm - age, lo = devLo(since), hi = devHi(since), n = Math.max(1, Math.ceil((hi - lo) / 0.9));
      let near = false;
      for (let k = 0; k <= n; k++) { const e = lo + (hi - lo) * k / n; if (Math.abs(e) < 0.02) continue; const what = ask(tm, e, rail); if (what > 0) return what; if (what < 0) near = true; }
      tm = tm + (near ? 0.08 : 0.25) > Pm - 0.01 && tm < Pm - 0.03 ? Pm - 0.02 : tm + (near ? 0.08 : 0.25);
    }
    return 0;
  };

  // ---- the slots, as this module keeps count of them. Every leaf in the air has one; the lowest free one is taken.
  const freeA = makeHeap(POOL); freeA.fill(POOL);
  const endAt = new Float64Array(POOL).fill(-1e9), kindOf = new Uint8Array(POOL), bornAt = new Float64Array(POOL);
  const inAir = [0, 0, 0, 0];                                               // 1: from the crown; 2: from the tiers and the great limb; 3: let go by the staging
  const carried = new THREE.Vector2(0, 0);                                  // how far the draught has carried things so far (the realm's x, z)
  let tracing = Math.round(num('lvtrace', 0)), traceLines = null;
  let refusedBy = 0;                                                        // (what stood in the way of the last leaf that was not let go)
  /**
   * Let one leaf go from b (the realm's x, y, z: where it IS when it lets go; b.rail: the place on a rail it lies on, with b.slideX,
   * b.slideZ, b.slideT: then (b.x, b.z) is the column of air it falls in), already `age` seconds into its fall.
   * 1: it went; 0: its way was not clear; -1: no slot is free.
   */
  const letGo = (b, kind, age = 0, check = true) => {
    const now = ctx.time;
    if (!freeA.n) { stats.waited++; return -1; }
    if (!(b.y > 0.3)) return 0;
    const slot = freeA.peek(), i4 = slot * 4, v = lerp(LF.speed[0], LF.speed[1], seeds[i4]), s3 = seeds[i4 + 3];
    // leaving a rail: it lies on the velvet, and the family's fall begins that much higher that the slip holds it level at first
    let sx = 0, sy = 0, sz = 0, sT = 0, by = b.y;
    if (b.rail) { sT = b.slideT; sx = b.slideX; sz = b.slideZ; sy = -0.55 * v * sT / 2; by = b.y - sy; }
    // the column: its own rate round the trunk (the same pace along a longer way round further out)
    const r0 = Math.hypot(b.x - axis.x, b.z - axis.z), inCol = 1 - smooth(0.75 * C.radius, C.radius, r0);
    const om = VT / Math.max(r0, C.core) * inCol * (0.8 + 0.4 * fract(s3 * 5.3)) * calmK;
    // (the column draws a share of the crown's leaves in toward the trunk as they come down below the boughs: those come down round
    // the trunk and on the mound's heap, where no way leads straight down through the tree's heavy wood)
    const inw = kind !== 2 && !b.rail && inCol > 0.5 && fract(s3 * 41.7) < IN.share ? lerp(IN.by[0], IN.by[1], fract(s3 * 67.1)) : 0;
    // (it has no level of its own to land on any more: over the mound it comes down on the heap wherever the draught takes it, and
    // the vertex extension draws no leaf below that ground. With a level of its own no leaf could be let go over the mound while
    // the draught might still change on its way, which is the whole time before the hour.)
    let l1 = 0, lA = 0, lU = 1, lD = 1;
    const Pm = aim(slot, b.x, by, b.z, 0);
    if (age > Pm - 0.3) return 0;
    // the lift: up for three to five seconds, then down over the rest of the fall
    if (inCol > 0.5 && fract(s3 * 13.7) < C.share) {
      lU = lerp(C.up[0], C.up[1], fract(s3 * 29.3)); const room = Pm - lU - 2;
      if (room > 6.5) { l1 = 1 + fract(seeds[i4 + 2] * 17.3) * (room - 6.5); lD = Pm - 1 - l1 - lU; lA = Math.min(1.35 * v * lU, (C.fast - 1) * v * lD / 1.5) * calmK; }
    }
    Lf.om = om; Lf.inw = inw; Lf.sx = sx; Lf.sy = sy; Lf.sz = sz; Lf.sT = sT; Lf.l1 = l1; Lf.lA = lA; Lf.lU = lU; Lf.lD = lD;
    const tA = stats.timed ? performance.now() : 0;
    if (check) {
      let what = age > 0.1 && ask(age, 0, null) === -2 ? 4 : 0;             // (the air filled before the first frame: not one that would already lie on the heap)
      if (!what) what = clearWay(age, b.rail || null);
      if (stats.timed) { stats.msCheck += performance.now() - tA; stats.checks++; }
      if (what) { stats.refused++; stats.inTheWay[what]++; refusedBy = what; return 0; }
    }
    freeA.pop();
    birth[i4] = b.x; birth[i4 + 1] = by; birth[i4 + 2] = b.z; birth[i4 + 3] = now - age;
    aA.array[i4] = om; aA.array[i4 + 1] = inw; aA.array[i4 + 2] = carried.x - fW.x * age; aA.array[i4 + 3] = carried.y - fW.z * age;
    aB.array[i4] = sx; aB.array[i4 + 1] = sy; aB.array[i4 + 2] = sz; aB.array[i4 + 3] = sT;
    aC.array[i4] = l1; aC.array[i4 + 1] = lA; aC.array[i4 + 2] = lU; aC.array[i4 + 3] = lD;
    airDirt.mark(slot);
    endAt[slot] = now - age + Pm; kindOf[slot] = kind; bornAt[slot] = now - age;
    if (slot + 1 > hw) hw = slot + 1;
    if (tracing > 0 && traceLines && (kind === 3 || !dev.has('lvstudy'))) { tracing--; traceLines.add(slot); }
    inAir[kind]++; stats.letGo++; stats.born[kind]++;
    return 1;
  };

  // ---- where they let go
  // the crown: under one of its masses (shared.tree.masses: rings 1 to 4, and the two tufts on the great limb), anywhere on
  // the lower half of the mass, where its sprays hang
  const masses = (T && T.masses ? T.masses : []).filter((m) => m.ring <= 4 && m.name !== 'gbox' && m.at && m.r > 0);
  const massW = [], ringW = [1.2, 1.0, 0.8, 0.55, 0.4];
  { let sum = 0; for (const m of masses) { sum += m.r * m.r * ringW[m.ring]; massW.push(sum); } }
  const fromCrown = (b, outer = false) => {
    b.rail = null;
    if (!masses.length) { const a = rnd() * TAU, r = 3 + 7.5 * Math.sqrt(rnd()); b.x = axis.x + Math.cos(a) * r; b.y = 14.6; b.z = axis.z + Math.sin(a) * r; return b; }      // (no tree: from the height of its skirt)
    let m;
    do { const u = rnd() * massW[massW.length - 1]; let i = 0; while (massW[i] < u) i++; m = masses[i]; } while (outer && m.ring > 2 && rnd() < 0.7);
    const th = rnd() * TAU, cz = 0.25 + 0.75 * rnd(), sn = Math.sqrt(1 - cz * cz), r = 0.9 * m.r;
    b.x = m.at.x + sn * Math.cos(th) * r; b.y = m.at.y - cz * r; b.z = m.at.z + sn * Math.sin(th) * r;
    return b;
  };
  const tufts = masses.filter((m) => m.ring === 0);
  // the tiers: a leaf lies on a rail's velvet (the royal box's canopy and the stage boxes are left out), well away from a pier and
  // its bracket of three flames, and slips out into the room
  const pierOf = [[], [], [], [], [], []];
  for (const p of plan.piers()) if (pierOf[p.tier]) pierOf[p.tier].push(p);
  const rails = [], railOf = [[], [], [], [], [], []];
  for (let t = 1; t <= 5; t++) for (const line of plan.tierLine(t, 0.3)) for (const q of line) {
    if (q.rear ? Math.abs(q.d) < 4.4 || Math.abs(q.d) > 12 : q.s < 33.0 || q.s > 83.4) continue;
    let near = 1e9; for (const p of pierOf[t]) near = Math.min(near, Math.hypot(p.s - q.s, p.d - q.d));
    if (near < LV.pier) continue;
    if (t >= 3 && !q.rear && lustres.some((L) => Math.sign(L.d) === Math.sign(q.d) && Math.abs(L.s - q.s) < 2.0)) continue;      // (a lustre hangs below, out in the room)
    railOf[t].push(rails.length); rails.push({ s: q.s, d: q.d, ns: q.ns, nd: q.nd, t });
  }
  const fromRail = (b, q) => {
    // (how far out it must fall to pass the fronts below it, each of which stands a hand further out than the one above: by its own swing)
    const swing = LF.sway * (0.6 + 0.8 * fract(seeds[freeA.peek() * 4 + 2] * 3.17)) * calmK;
    const on = lerp(LV.on[0], LV.on[1], rnd()), out = Math.max(LV.out[0], (q.t > 1 ? 0.25 * (q.t - 1) + 0.75 : 0.5) + swing + 0.4) + (LV.out[1] - LV.out[0]) * Math.pow(rnd(), 1.6), far = out - on;
    b.x = q.d + q.nd * out; b.y = plan.tiers[q.t].rail + 0.035; b.z = -(q.s + q.ns * out);
    b.rail = q; b.slideX = -q.nd * far; b.slideZ = q.ns * far; b.slideT = clamp(far / 0.55, LV.over[0], LV.over[1]);
    return b;
  };
  let railNow = null, railTries = 0;                                        // (a place on a rail is tried a few times before another is taken: so every stretch of every rail lets go alike)
  const fromTiers = (b) => {
    if (railTries > 0 && railNow && refusedBy === 2) { railTries--; return fromRail(b, railNow); }      // (a front below was in its way: further out, then; anything else: another place)
    if (tufts.length && rnd() < 0.07) { const m = tufts[Math.floor(rnd() * tufts.length)], th = rnd() * TAU, r = 0.8 * m.r * Math.sqrt(rnd()); b.rail = null; b.x = m.at.x + Math.cos(th) * r; b.y = m.at.y - 0.6 * m.r; b.z = m.at.z + Math.sin(th) * r; return b; }
    if (!rails.length) return fromCrown(b);
    railNow = rails[Math.floor(rnd() * rails.length)]; railTries = 4;
    return fromRail(b, railNow);
  };

  // ---- the wind toward the stage (metres a second), and what else follows the show clock when the module is left alone
  const windAt = (c) => P.wind.still + (P.wind.hour - P.wind.still) * S(c / 3) + (P.wind.fall - P.wind.hour) * S((c - P.wind.from) / 3) * (1 - S((c - P.wind.to) / 3));
  const driftAt = (c) => lerp(A.drift[0], A.drift[1], S(c / 3));
  const REST = A.rest / A.full;
  const coverAt = (c) => lerp(REST, 1, S((c - (P.wind.from + 2)) / 16));
  let windEase = null;
  windNow = dev.has('lvwind') ? num('lvwind', 0) : windAt(show.c);
  fW.x = toStage.x * windNow; fW.z = toStage.y * windNow;
  setDev();

  // ---- let go by the staging (and by the clock): a list of leaves each with its moment
  const queue = [];
  const share = POOL / P.air.pool;                                          // what the quality setting and reduced motion have left of every count
  const b0 = { x: 0, y: 0, z: 0, rail: null, slideX: 0, slideZ: 0, slideT: 0 };
  // How much checking of ways one frame may do: counted in places asked about (about five thousand to the millisecond on the laptop this
  // was made on), NOT read off the clock on the wall. It was a millisecond by the clock: then a busy machine let other leaves go than a
  // quiet one, and a picture taken twice was not the same picture. What is left over is let go in the next frame.
  const CAP = P.steps || 6000;
  const due = (now, since = -1) => {                                      // (since: the count of steps when the frame began; -1: no limit, before the first frame)
    let w = 0, over = false;
    for (let i = 0; i < queue.length; i++) {
      const q = queue[i];
      if (q.t > now || over) { queue[w++] = q; continue; }
      let r = 0;
      for (let tries = 0; tries < 6 && r === 0; tries++) { r = letGo(q.from(b0), 3, now - q.t, q.check !== false); if (r === 0 && since >= 0 && stats.steps - since > 0.6 * CAP) { over = true; break; } }
      if ((r < 0 || (r === 0 && over)) && now - q.t < 4) queue[w++] = q;      // no slot is free just now, or the frame's share is spent: it lets go a moment later
      if (since >= 0 && stats.steps - since > 0.6 * CAP) over = true;       // (the staging's leaves may take six tenths of the frame's share; the rest keeps the air full)
    }
    queue.length = w;
  };
  /** The crown lets `count` leaves go over `over` seconds (the gust: 400; the fall: 600). Returns how many are to go. */
  const burstCrown = ({ count = P.crown.gust, over = 4, delay = 0, exact = false } = {}) => {
    const n = Math.round(exact ? count : count * share);
    for (let i = 0; i < n; i++) queue.push({ t: ctx.time + delay + over * rnd(), from: (b) => fromCrown(b, true) });
    return n;
  };
  /** Tier `tier`'s rail lets `count` leaves go over `over` seconds; `side`: -1 the left, +1 the right, 0 both; from, to: the stretch of the house (s). */
  const burstTier = (tier, { count = 200, over = 3, delay = 0, side = 0, from = 33, to = 83.4, exact = false } = {}) => {
    const ids = (railOf[clamp(Math.round(tier), 1, 5)] || []).filter((i) => { const q = rails[i]; return q.s >= from && q.s <= to && (!side || Math.sign(q.d) === Math.sign(side)); });
    if (!ids.length) return 0;
    const n = Math.round(exact ? count : count * share);
    for (let i = 0; i < n; i++) { const q = rails[ids[Math.floor(rnd() * ids.length)]]; queue.push({ t: ctx.time + delay + over * rnd(), from: (b) => fromRail(b, q) }); }
    return n;
  };
  /** `count` leaves let go round a point: a THREE.Vector3 of the realm, or [s, d, y] (a cloud car's bench; the backcloth's seam as the boat goes through). */
  const burstAt = (p, { count = 30, radius = 0.6, height = 0.4, over = 2, delay = 0, check = true, exact = false } = {}) => {
    const c = p && p.isVector3 ? p.clone() : at(ctx, p[0], p[1], p[2]);
    const n = Math.round(exact ? count : count * share);
    for (let i = 0; i < n; i++) queue.push({ t: ctx.time + delay + over * rnd(), check, from: (b) => { const a = rnd() * TAU, r = radius * Math.sqrt(rnd()); b.rail = null; b.x = c.x + Math.cos(a) * r; b.y = c.y + (rnd() - 0.5) * height; b.z = c.z + Math.sin(a) * r; return b; } });
    return n;
  };

  /**
   * The leaves that come through the painting with the boat (the page: about 60). The draught that parts the cloth carries them on
   * ahead: over the next `reach` metres of the fly tower's water each comes down out of the dark and hangs at the lantern's height
   * as the prow comes up to it, lands beside the hull a second later, and lies there. `boat`: the boat's speed (as measured, if
   * not given). Those nearest the cloth are already on their way down when the rider's eye comes through it.
   */
  let boatV = 2.4, sWas = null;                                             // (the boat's speed along the route, metres a second, as measured frame by frame)
  const through = ({ count = P.crown.through, reach = 22, boat = Math.max(0.8, boatV) } = {}) => {
    const n = Math.round(count * share), q = ctx.path.locate(ctx.boat.x, ctx.boat.z, ctx.s), s0 = q.s, d0 = clamp(q.d, -5, 5);
    for (let i = 0; i < n; i++) {
      const sv = Math.max(121.4, s0 + 3 + (reach - 3) * (i + rnd()) / n), dv = d0 + (rnd() < 0.5 ? -1 : 1) * (0.25 + 2.6 * Math.pow(rnd(), 1.3));
      const tLow = Math.max(0, sv - s0 - (3.4 + 2.2 * rnd())) / boat;       // when the lantern is that near it, it hangs at the lantern's height
      const lowC = plan.fly.cloths.some((c) => Math.abs(sv - c.s) < 1.5), y = 2.5 + (lowC ? 0.3 : 2.4) * rnd(), p = at(ctx, sv, dv, y);      // (under an old cloth: from below its hem)
      queue.push({ t: ctx.time + tLow - (y - 1.4) / 1.05, from: (b2) => { b2.rail = null; b2.x = p.x + 0.4 * (rnd() - 0.5); b2.y = y; b2.z = p.z + 0.4 * (rnd() - 0.5); return b2; } });
    }
    return n;
  };

  // ============================================================================================ the leaves on the water
  const tone = num('lvtone', 0.6);
  // ---- where a leaf may lie: the open water of the house and of the stage, as a plan of 0.2 m cells (what stands in a leaf's way
  // as it drifts is whatever is not open water)
  const G0 = 19, G1 = 121, GD = 23, GC = 0.2, GNS = Math.round((G1 - G0) / GC), GND = Math.round(2 * GD / GC), open = new Uint8Array(GNS * GND);
  { let t0 = performance.now();
    for (let i = 0; i < GNS; i++) {
      const s = G0 + (i + 0.5) * GC; if (s > 119.6) break;
      for (let j = 0; j < GND; j++) open[i * GND + j] = onWater(s, -GD + (j + 0.5) * GC) ? 1 : 0;
      if ((i & 31) === 31 && performance.now() - t0 > 6) { await pause(); t0 = performance.now(); }
    } }
  const isOpen = (s, d) => { const i = Math.floor((s - G0) / GC), j = Math.floor((d + GD) / GC); return i >= 0 && j >= 0 && i < GNS && j < GND && open[i * GND + j] === 1; };
  /** Metres a leaf at (s, d) can drift the way (ds, dd) before something stands in its way (asked about `most` metres at most). */
  const room = (s, d, ds, dd, most = 112) => { let t = 0; while (t < most) { t += GC; if (!isOpen(s + ds * t, d + dd * t)) return t - GC; } return t; };
  /** Floating leaves to the square metre at (s, d), once the house has let its leaves go (a quarter of them lie there before): the page's 4 by the mound and 0.3 at the walls, before. */
  const thick = (s, d) => { const r = Math.hypot(s - B.s, d - B.d); return (s < 31.5 ? 0.6 : s < 90 ? 1.3 : 1.0) + (s < 92 ? 15.7 * Math.exp(-Math.pow(Math.max(0, r - 5) / 6.5, 2)) : 0); };
  const DMAX = 17, sp = { s: 0, d: 0 };
  const sample = (out) => { for (let tries = 0; tries < 300; tries++) { const s = 19.1 + 100.4 * rs(), d = -22.4 + 44.8 * rs(); if (rs() * DMAX < thick(s, d) && isOpen(s, d)) { out.s = s; out.d = d; return true; } } return false; };
  /**
   * WHERE THE HOUSE'S FALL LEAVES ITS LEAVES (the page: about 11,000 lie after it, where 2,600 lay; it lands between s 60 and 112, on a
   * draught toward the stage). `fallOn(s, d)`: how many of this module's leaves float on for each leaf of the house's fall that
   * comes down at (s, d): two down the middle of the house from the tree to the arch (where the draught funnels them to the stage's
   * opening, and where the rider is), fewer toward the box fronts and above the tree. One map for the rider who was carried through
   * the fall and for the realm entered after it with the clock held: the first holder's map put the 11,000 round the mound, seventeen
   * to the square metre, and about one everywhere else, while the fall itself (the Presences') lands evenly from s 40 to 100.
   */
  const FALL = A.fall || { from: [48, 60], band: [9, 19], walls: 0.3, most: 2, stage: [102, 112], end: 0.12 };
  const fallOn = (s, d) => FALL.most * smooth(FALL.from[0], FALL.from[1], s) * lerp(1, FALL.walls, smooth(FALL.band[0], FALL.band[1], Math.abs(d)));
  /** The same, for the water strewn at once (the clock held past the fall): times how thickly the house's fall comes down along the house (evenly to the arch, thinning over the stage). */
  const fallLaid = (s, d) => (s < 40 || s > 118 ? 0 : fallOn(s, d) * lerp(1, FALL.end, smooth(FALL.stage[0], FALL.stage[1], s)) * (1 - smooth(114, 118, s)));
  const sampleFall = (out) => { for (let tries = 0; tries < 300; tries++) { const s = 40 + 78 * rs(), d = -22.4 + 44.8 * rs(); if (rs() * FALL.most < fallLaid(s, d) && isOpen(s, d)) { out.s = s; out.d = d; return true; } } return false; };

  // ---- the family's floating leaf: a pool, every slot of it written here (where it lies, how it lies, the way it drifts and how
  // far, when it will have soaked). No leaf of it shuttles, none is strewn by the family, and its cover is always whole.
  const LMAX = 4000;                                                        // (seconds: longer than any leaf floats; the family takes a leaf away this long after the time written for it)
  const POOLK = 1.16, TAIL = 12;                                            // (room in the pool beyond the water covered: those that are going under; seconds from the moment a leaf begins to go under until the family takes it away, 7.5 of them in sight)
  const afloat = dressed({ take: nums('lvfloat', P.take.afloat), keep: nums('lvkeep', P.keep.afloat), brush: 0.3 }, [litSea], [afterAfloat], () =>
    makeFloaters(ctx, { kind: 'leaf', pool: A.full * POOLK * want, landed: LMAX, cover: 1, drift: A.drift[0], shuttle: 0, backlight: 0, top: WET8(tone), under: WETU8(tone), tone: 1, seed: 2601,
      tip: num('lvtip', A.tip), most: num('lvmost', A.most), lift: A.lift }));
  const fg = afloat.object.geometry, NFS = afloat.pool, fSeat = fg.attributes.aSeat, fLife = fg.attributes.aLife, fSeed = fg.attributes.aSeed, fWay = fg.attributes.aWay;
  fSeed.setUsage(THREE.DynamicDrawUsage); fWay.setUsage(THREE.DynamicDrawUsage);
  const fMine = new THREE.InstancedBufferAttribute(new Float32Array(NFS * 2), 2); fMine.setUsage(THREE.DynamicDrawUsage); fg.setAttribute('aLvF', fMine);
  const seaDirt = makeDirt([fSeat, fLife, fSeed, fWay, fMine]);
  const turning = afloat.uniforms.uFloC.value.z, FULL = NFS / POOLK;      // (how fast the family turns a floating leaf; how many lie when the water is covered)
  const freeF = makeHeap(NFS); freeF.fill(NFS);
  const deathAt = new Float64Array(NFS).fill(-1e9), aliveF = new Uint8Array(NFS);      // (aliveF: 1 a leaf that floats on, 2 one that goes under within seconds)
  let aliveN = 0, longN = 0, hwF = 0, sweepAt = 0, sweepTop = -1;
  afloat.object.name = `leaves afloat (${NFS} slots)`; fg.instanceCount = 0;
  if (dev.has('lvnotrace')) { const famF = afloat.object.onBeforeRender; afloat.object.onBeforeRender = (...q) => { famF(...q); afloat.uniforms.uFloTrace.value.x = 0; }; }
  /** How long a leaf that floats on lies on the water, if it comes down at s now (seconds; its going under is counted in). */
  const lifeAt = (s, c) => { const L = s < 32 || s > 90 ? A.quiet : c >= P.wind.from + 2 ? A.after : A.lives; return lerp(L[0], L[1], rw()) + TAIL; };
  /** How long one lies that goes under within seconds (most of them go at once). */
  const briefLife = () => lerp(A.brief[0], A.brief[1], rw() * rw()) + TAIL;
  /**
   * Put a leaf down on the water at the realm's (x, z). o: { laid (it had gathered there before the rider came: it lies still and
   * does not sink), life (seconds it floats, its going under counted in), brief (it is one of those that go under within seconds),
   * turn, flip (the other side up), size, k (which of the eight colours), born (when it landed: it is still dry and the size it
   * was in the air) }. Returns its slot, or -1 if none is free.
   */
  const put = (x, z, o) => {
    if (!freeF.n) return -1;
    const j = freeF.pop(), j4 = j * 4, now = ctx.time, sd = fSeed.array, s = -z, d = x;
    let wx = 0, wz = 0, stop = 0;
    if (!o.laid) {
      // it drifts toward the stage at its own pace and a little its own way, until something stands in its way: there it stays,
      // against the thing or against those that came before it
      const pace = lerp(A.pace[0], A.pace[1], rw()), a = (rw() - 0.5) * 0.14, ds = Math.cos(a), dd = Math.sin(a);
      const far = s > 120.5 ? 0.3 + 2.5 * rw() : Math.max(0, room(s, d, ds, dd, o.brief ? 0.25 * o.life + 0.6 : 112) - 0.06 - (o.brief ? 0 : A.heap * rw() * rw()));
      wx = (toStage.x * ds + toRight.x * dd) * pace; wz = (toStage.y * ds + toRight.y * dd) * pace; stop = far / pace;
    }
    const k = o.k ?? Math.floor(rw() * 8), zf = sd[j4 + 2], dies = now + (o.laid ? LMAX - 1 : o.life);
    fSeat.array[j4] = x; fSeat.array[j4 + 1] = z; fSeat.array[j4 + 2] = o.size || lerp(0.075, 0.1, rw()); fSeat.array[j4 + 3] = (o.turn ?? rw() * TAU) - now * turning * (sd[j4 + 3] * 2 - 1);
    fLife.array[j4] = dies - LMAX; fLife.array[j4 + 1] = 0; fLife.array[j4 + 2] = o.flip ? 1 : 0; fLife.array[j4 + 3] = afloat.uniforms.uFloC.value.x;
    fWay.array[j * 3] = wx; fWay.array[j * 3 + 1] = wz; fWay.array[j * 3 + 2] = stop;
    sd[j4] = fract((k + 0.5) / 8 - zf * 5.37 + 16); sd[j4 + 1] = fract((k + 0.5) / 8 - zf * 3.91 + 16);      // (the family picks a floating leaf's two colours from these: its own, top and under)
    fMine.array[j * 2] = o.born ?? -100; fMine.array[j * 2 + 1] = 0.8 + 0.42 * rw();
    deathAt[j] = dies; aliveF[j] = o.brief ? 2 : 1; aliveN++; if (!o.brief) longN++;
    if (j + 1 > hwF) hwF = j + 1; if (j > sweepTop) sweepTop = j;
    seaDirt.mark(j);
    return j;
  };
  /** How many leaves should lie on the water now (those that float on: the ones about to go under are over and above). */
  let coverNow = dev.has('lvcover') ? clamp(num('lvcover', 1), 0, 1) : coverAt(show.c), coverEase = null, driftNow = driftAt(show.c), driftEase = null;
  const target = () => Math.round(coverNow * FULL);
  /** The share of what comes down that floats on: the page's share while as many lie as should, more while fewer do, fewer while more do. */
  const stays = () => { const want = Math.max(1, target()); return clamp(A.stays * (1 + 4 * (want - longN) / want), 0.15 * A.stays, 5 * A.stays); };
  /**
   * Something has come down on the water at (x, z): it lies there. WHICH LEAF FLOATS ON HAS NOTHING TO DO WITH THE RIDER: a share of
   * all that comes down, anywhere, floats on for minutes; the others lie a few seconds and go under (in the column the rain presses
   * them under; what lay on a rail was sodden before it fell). One of those is put down only where the rider could see it go.
   */
  const keepLanding = (x, z, o) => {
    const s = -z, d = x;
    if (!(s > 120.5 ? onWater(s, d) : isOpen(s, d))) return false;
    o.laid = false;
    if (s > 120.5 || rw() < stays()) { o.life = lifeAt(s, show.c); o.brief = false; }      // (what came through the painting with the boat lies in the lantern's light: it stays)
    else {
      const dist = Math.hypot(x - ctx.boat.x, z - ctx.boat.z);
      if (dist > A.sight[1] || (dist > A.sight[0] && rw() * (A.sight[1] - A.sight[0]) > A.sight[1] - dist)) return false;
      o.life = briefLife(); o.brief = true;
    }
    if (put(x, z, o) < 0) return false;
    stats.kept++;
    return true;
  };
  const keep = (x, z, p = {}) => keepLanding(x, z, { turn: p.turn, flip: p.flip ?? rw() < 0.3, size: p.size, born: ctx.time });
  // (what is published as the leaves on the water: the family's handle, but whoever calls its `add` puts a leaf down through this module)
  const floaters = Object.create(afloat); floaters.add = (x, z, p = {}) => { keep(x, z, p); };
  // ---- the house's fall. The presences' leaves come down in their own shader (cast_presences.js), whose script knows each landing
  // and hands it here (sitters.settleOn, asked for on the first frames): as many as the water still wants are put down exactly
  // where one of theirs has just come down, a hand's breadth beside it, wherever the rider is. (Theirs lies a quarter of a minute
  // and goes under; of two neighbours one floats on.) Without that module the fall's leaves are laid by the page's map, below.
  let handedAt = -1e9, hooked = 0;
  const taker = { add(x, z) {
    handedAt = ctx.time;
    if (longN >= target()) return;
    // (as many as the map gives for this place: the first a hand's breadth beside the one that has just come down, a second within
    // a pace of it: in the thick of the fall nobody can say which leaf it was. Beside the hull only the first.)
    const m = fallOn(-z, x), near = (x - ctx.boat.x) ** 2 + (z - ctx.boat.z) ** 2 < 16;
    let n = Math.floor(m) + (rw() < m - Math.floor(m) ? 1 : 0);
    if (near && n > 1) n = 1;
    for (let i = 0; i < n; i++) {
      const a = rw() * TAU, r = i ? 0.25 + 0.5 * rw() : 0.05 + 0.09 * rw(), px = x + Math.cos(a) * r, pz = z + Math.sin(a) * r;
      if (!(pz < -120.5 ? onWater(-pz, px) : isOpen(-pz, px))) continue;
      put(px, pz, { life: lifeAt(-pz, show.c), flip: rw() < 0.3, born: ctx.time });
    }
  } };

  // ---- the leaves that had gathered before the rider came: laid by hand, lying still
  const dens = ctx.quality.density * want, R = A.laid;
  const lay = (s, d, check = true) => { if (rs() > dens || (check && !onWater(s, d))) return; put(d, -s, { laid: true, flip: rs() < 0.3 }); };
  // (1) the mound's up-current shore, and a thinner fringe all round it
  for (let i = 0; i < R.shore; i++) {
    let a; do { a = rs() * TAU; } while (rs() > 0.25 + 0.75 * Math.pow(Math.max(0, -Math.cos(a)), 0.6));      // (the arches' side: the draught goes toward the stage)
    let r = 3.5; while (r < 9 && moundH(B.s + Math.cos(a) * r, B.d + Math.sin(a) * r) > -0.03) r += 0.05;
    r += 0.1 + 1.3 * rs() * rs();
    lay(B.s + Math.cos(a) * r, B.d + Math.sin(a) * r);
  }
  // (2) each music stand and each of the pit's instruments: a crescent on the side the draught comes from
  for (const q of pit) { const n = q[4] > 0.3 ? R.instrument : R.stand; for (let i = 0; i < n; i++) { const a = Math.PI + (rs() - 0.5) * 2.6, r = q[4] + 0.04 + 0.5 * rs() * rs(); lay(q[0] + Math.cos(a) * r, q[1] + Math.sin(a) * r * 0.85, false); } }
  // (3) each wave roller: along its flank toward the house, thickest at its inner end
  for (const sr of plan.rollers.s) for (const side of [-1, 1]) for (let i = 0; i < R.roller; i++) lay(sr - plan.rollers.across / 2 - 0.06 - 0.5 * rs() * rs(), side * (plan.rollers.d[0] + 0.05 + 3.6 * rs() * rs()), false);
  // (4) the backcloth's hem: heaped against it, most at its middle seam
  // (a heap lies AGAINST the cloth, a hand deep and a pace wide, thickest by the middle seam, where the draught goes through; before it a
  // looser fringe of those still arriving. It was one even sprinkle two paces deep.)
  { const hemN = Array.isArray(R.hem) ? R.hem : [R.hem, 0], across = () => (rs() < 0.45 ? 3.6 * (rs() + rs() - 1) : 10.4 * (rs() * 2 - 1));
    for (let i = 0; i < hemN[0]; i++) lay(119.82 - 0.36 * rs() * rs(), across(), false);
    for (let i = 0; i < hemN[1]; i++) lay(119.45 - 1.5 * rs() * rs(), across(), false); }
  // (5) the box fronts where the house narrows toward the stage: the draught presses a thin line of them against the foot of the fronts
  for (let i = 0; i < R.fronts; i++) { const s = 62 + 21.4 * Math.sqrt(rs()), side = rs() < 0.5 ? -1 : 1; lay(s, side * (frontTab[fIdx(s)] - (0.58 + 0.75 * rs() * rs()) / frontInv[fIdx(s)])); }
  const laidN = aliveN;
  // ---- and those that lie on the open water when the rider arrives: strewn as thickly as the page has them, each somewhere in its time.
  // Those that lay before the house let go (the page's 2,600, the laid ones among them) lie by the mound; what the fall has brought
  // down since, if the realm is entered after it, lies where the fall leaves it (`fallLaid`).
  { const n = target() - aliveN, before = Math.min(n, Math.max(0, Math.round(REST * FULL) - aliveN)); let t0 = performance.now();
    for (let i = 0; i < n; i++) {
      if (!(i < before ? sample(sp) : sampleFall(sp))) break;
      put(sp.d, -sp.s, { life: Math.max(25, lifeAt(sp.s, show.c) * (0.12 + 0.88 * rs())), flip: rs() < 0.3 });
      if ((i & 255) === 255 && performance.now() - t0 > 6) { await pause(); t0 = performance.now(); }
    } }
  seaDirt.all(); fg.instanceCount = hwF;

  // ============================================================================================ the leaves in the kettledrums
  // The pit's two kettledrums stand brim-full, their rims a finger above the room's water (heroes_stage.js; the model names the middle
  // of the water in each: bowl_a, bowl_b). A few leaves lie in each and go slowly round, as leaves in a brimming bowl do: the page's
  // "leaves turning in them". The family's floaters cannot go round a point, so these few are a mesh of this module's own: the
  // family's leaf card, curled the same way, in the same paint.
  const drums = shared.stageRig && shared.stageRig.timpani && shared.stageRig.timpani.points ? shared.stageRig.timpani : null;
  let bowls = null;
  if (drums && drums.points.bowl_a && drums.points.bowl_b) {
    const card = cardGeometry('leafkite'), g = new THREE.InstancedBufferGeometry(), rb = ctx.rng(2604), A1 = [], A2 = [], A3 = [], wet = WET(tone);
    g.index = card.index; for (const name of ['position', 'normal', 'color']) g.setAttribute(name, card.attributes[name]);
    ['bowl_a', 'bowl_b'].forEach((name, bi) => {
      const c = drums.point(name), n = bi ? 3 : 4, way = bi ? -1 : 1, round = TAU / (52 + 30 * rb()) * way, a0 = rb() * TAU;
      for (let i = 0; i < n; i++) {
        const tint = wet[Math.floor(rb() * wet.length)];
        A1.push(c.x, c.z, 0.055 + 0.19 * (i + 0.6 * rb()) / n, a0 + i * TAU / n * (0.8 + 0.4 * rb()));      // the bowl's middle; how far out it lies; where round it
        A2.push(round * (0.92 + 0.16 * rb()), 0.078 + 0.02 * rb(), rb() * TAU, 0.03 * (rb() * 2 - 1));       // how fast it goes round; its length; how it lies; how fast it turns of itself
        A3.push(tint.r, tint.g, tint.b);
      }
    });
    g.setAttribute('aBowl', new THREE.InstancedBufferAttribute(new Float32Array(A1), 4)); g.setAttribute('aBowlB', new THREE.InstancedBufferAttribute(new Float32Array(A2), 4));
    g.setAttribute('aBowlTint', new THREE.InstancedBufferAttribute(new Float32Array(A3), 3)); g.instanceCount = A3.length / 3;
    const mat = H.paint('leaf', { color: '#ffffff', vertexColors: true, side: THREE.DoubleSide, flat: true, crisp: true, brush: 0.3, take: P.take.afloat, keep: P.keep.afloat, extend: [litSea, {
      vertexPars: 'attribute vec4 aBowl, aBowlB; attribute vec3 aBowlTint; varying vec3 vBowlTint;',
      vertexLocal: /* glsl */`
      { // (src/realms/theatre/cast.js) a leaf in a brimming kettledrum: curled like a small boat, turning slowly round the bowl's middle
        float lbA = aBowl.w + uTime * aBowlB.x, lbT = aBowlB.z + uTime * aBowlB.w, lbC = cos(lbT), lbS = sin(lbT);
        vec3 lbP = position; lbP.y += 0.9 * (0.16 * abs(lbP.x) + 0.12 * lbP.z * lbP.z);
        lbP = vec3(lbC * lbP.x + lbS * lbP.z, lbP.y, -lbS * lbP.x + lbC * lbP.z) * aBowlB.y;
        transformed = lbP + vec3(aBowl.x + cos(lbA) * aBowl.z, 0.006 + 0.002 * sin(uTime * 1.3 + aBowl.w * 7.0), aBowl.y + sin(lbA) * aBowl.z);
        objectNormal = vec3(lbC * normal.x + lbS * normal.z, normal.y, -lbS * normal.x + lbC * normal.z);
        vBowlTint = aBowlTint;
      }`,
      fragmentPars: 'varying vec3 vBowlTint;', albedo: 'albedo *= vBowlTint;',
    }] });
    bowls = new THREE.Mesh(g, mat); bowls.name = 'leaves in the kettledrums x ' + g.instanceCount; bowls.frustumCulled = false;
    ctx.add(bowls); ctx.only(bowls, 'direct');
  }

  // ============================================================================================ to look at it (developer switches)
  if (tracing > 0) {
    // the way down this module foresaw for a leaf, as a line: the leaf must ride it
    const N = tracing, SEG = 90, posA = new Float32Array(N * SEG * 6), g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(posA, 3));
    const lines = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: '#7dffb0', fog: false })); lines.frustumCulled = false; lines.name = 'debug: foreseen ways down';
    ctx.add(lines); ctx.only(lines, 'direct');
    let used = 0; const q = { x: 0, y: 0, z: 0 };
    traceLines = { add(slot) {
      const o = used++ * SEG * 6, Pm = aimSlot(slot);
      where(0.001, 0, 0, q); let px = q.x, py = q.y, pz = q.z;
      for (let i = 0; i < SEG; i++) { const t = Pm * (i + 1) / SEG; where(Math.min(t, Pm - 0.01), fW.x * t, fW.z * t, q); posA.set([px, py, pz, q.x, q.y, q.z], o + i * 6); px = q.x; py = q.y; pz = q.z; }
      g.attributes.position.needsUpdate = true;
    } };
  }
  const once = (key, fn) => { if (!dev.has(key)) return null; const v = dev.get(key).split(',').map(Number); let done = false; return () => { if (!done && ctx.time >= (v[v.length - 1] || 0)) { done = true; fn(v); } }; };
  const tests = [
    once('lvgust', () => burstCrown({ count: P.crown.gust, over: 4 })),
    once('lvfall', () => burstCrown({ count: P.crown.fall, over: 5 })),
    once('lvtier', (v) => burstTier(v.length > 1 ? v[0] : 4, { count: 300, over: 3 })),
    once('lvat', (v) => burstAt(v.length >= 3 ? [v[0], v[1], v[2]] : [104, -3.5, 5], { count: 60, radius: 1.2, height: 1, over: 2 })),
    // (&lvstudy=2: ten let go 3.2 m ahead of the bow, 2.6 m up, two seconds in: to look at a leaf closely; &lvhigh= &lvahead= &lvside= move them)
    once('lvstudy', () => { const bt = ctx.boat, f = [-Math.sin(bt.heading), -Math.cos(bt.heading)], a = num('lvahead', 3.2), sd = num('lvside', 0);
      burstAt(new THREE.Vector3(bt.x + f[0] * a - f[1] * sd, num('lvhigh', 2.6), bt.z + f[1] * a + f[0] * sd), { count: 10, radius: 0.7, height: 0.3, over: 0.4, exact: true, check: false }); }),
  ].filter(Boolean);
  let logged = false;
  const writeLog = () => {
    const now = ctx.time, air = [], q = { x: 0, y: 0, z: 0 };
    const stuck = [], inSolid = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];                      // how many leaves stand in something solid at this moment, by what it is (there should be none)
    let turning2 = 0, lifted = 0, onRail = 0, heaped = 0;
    for (let i = 0; i < hw; i++) if (kindOf[i] && endAt[i] > now) {
      const tm = now - bornAt[i], i4 = i * 4; aimSlot(i);
      where(tm, carried.x - aA.array[i4 + 2], carried.y - aA.array[i4 + 3], q);
      air.push([+(-q.z).toFixed(2), +q.x.toFixed(2), +q.y.toFixed(2), kindOf[i], +(Lf.om * 57.2958).toFixed(1)]);
      if (Lf.om !== 0) turning2++; if (Lf.lA > 0) lifted++; if (Lf.sT > 0) onRail++;
      if (tm > 0.3) {
        let what = meets(q.x, q.y, q.z);
        if (what === -2) { heaped++; what = 0; }                            // (come down on the mound's heap: not drawn)
        if (what === 2 && Lf.sT > 0 && tm < 2.4) what = 0;                  // (a leaf leaving its rail: its way through the air above the velvet was asked about when it was let go)
        inSolid[what]++; if (what && stuck.length < 40) stuck.push([+(-q.z).toFixed(2), +q.x.toFixed(2), +q.y.toFixed(2), kindOf[i], what, +tm.toFixed(2), +(endAt[i] - bornAt[i]).toFixed(2)]);
      }
    }
    const lie = [];
    for (let j = 0; j < hwF; j++) if (aliveF[j]) { const j4 = j * 4, go = Math.min(afloat.uniforms.uFloC.value.x - fLife.array[j4 + 3], fWay.array[j * 3 + 2]); lie.push([+(-(fSeat.array[j4 + 1] + fWay.array[j * 3 + 1] * go)).toFixed(2), +(fSeat.array[j4] + fWay.array[j * 3] * go).toFixed(2), go >= fWay.array[j * 3 + 2] ? 1 : 0, aliveF[j], +(deathAt[j] - now).toFixed(1)]); }
    const body = { time: now, c: show.c, slots: POOL, drawn: hw, inAir, inSolid, stuck, stats, queue: queue.length, wind: windNow, drift: driftNow, cover: coverNow, turning: turning2, lifted, onRail, heaped,
      afloat: { slots: NFS, drawn: hwF, lying: aliveN, floatOn: longN, brief: aliveN - longN, laid: laidN, target: target(), stays: stays(), handed: hooked, along: afloat.uniforms.uFloC.value.x, one: [1000, 1001, 2000].map((j) => [fSeat.array[j * 4], fSeat.array[j * 4 + 1], fLife.array[j * 4], fLife.array[j * 4 + 3], fWay.array[j * 3], fWay.array[j * 3 + 1], fWay.array[j * 3 + 2]]) },
      voxels: { triangles: voxTris, cells: occ.reduce((a2, v) => a2 + v, 0) }, masses: masses.length, rails: rails.length, air, lie,
      // (the set, for a drawing of the leaves against it: tools of my own in the scratch folder)
      set: { front: Array.from({ length: 61 }, (_, i) => [30 + i, +frontTab[i * 10].toFixed(2)]), tree: [B.s, B.d], chandelier: [plan.chandelier.s, plan.chandelier.d, plan.chandelier.y[0], plan.chandelier.y[1], plan.chandelier.across / 2],
        lustres: lustres.map((L) => [L.s, L.d]), shore: Array.from({ length: 72 }, (_, i) => { const a = i / 72 * TAU; let r = 3.5; while (r < 9 && moundH(B.s + Math.cos(a) * r, B.d + Math.sin(a) * r) > -0.03) r += 0.05; return [+(B.s + Math.cos(a) * r).toFixed(2), +(B.d + Math.sin(a) * r).toFixed(2)]; }),
        solid: (() => { const out = []; for (let j = 0; j < VX.ny; j++) for (let k = 0; k < VX.nz; k++) for (let i = 0; i < VX.nx; i++) if (occ[(j * VX.nz + k) * VX.nx + i] || hung[(j * VX.nz + k) * VX.nx + i]) out.push([+(-(VX.z0 + (k + 0.5) * VX.c)).toFixed(1), +(VX.x0 + (i + 0.5) * VX.c).toFixed(1), +((j + 0.5) * VX.c).toFixed(1)]); return out; })(),
        masses: masses.map((m) => [+(-m.at.z).toFixed(1), +m.at.x.toFixed(1), +m.at.y.toFixed(1), m.r, m.ring]), tiers: [1, 2, 3, 4, 5].map((t) => plan.tiers[t].rail) } };
    fetch('/__shot/' + dev.get('lvlog'), { method: 'POST', body: JSON.stringify(body) }).catch(() => {});
  };

  // ============================================================================================ before the first frame
  // The air is full when the rider arrives: as many leaves as the page gives it, each somewhere on its way down (a leaf with a
  // long way to fall is the likelier to be found in the air: they are drawn so), every way checked like any other.
  const onlyRails = dev.has('lvrail');
  const targets = [0, onlyRails ? 0 : P.air.tree * share, P.air.tiers * share, 0];
  const fill = async (kind, from, PmMax) => {
    let n = Math.round(targets[kind]), tries = 0, t0 = performance.now();
    while (n > 0 && tries++ < targets[kind] * 80 + 200) {
      from(b0);
      const Pm = (b0.rail ? b0.y + 0.3 * b0.slideT : b0.y) / lerp(LF.speed[0], LF.speed[1], seeds[freeA.peek() * 4]);
      if (rnd() * PmMax > Pm) continue;
      const r = letGo(b0, kind, rnd() * Pm);
      if (r < 0) break;
      if (r) { n--; railTries = 0; }
      if (performance.now() - t0 > 6) { await pause(); t0 = performance.now(); }
    }
  };
  await fill(1, (b) => fromCrown(b), 31 / LF.speed[0]);
  await fill(2, fromTiers, 19.5 / LF.speed[0]);
  // (and, if the realm is entered with the fall already under way, the crown's 600 are in the air too)
  let crownDone = !(show.c < P.wind.from + 40);
  if (show.c > P.wind.from && !crownDone) { crownDone = true; const n = Math.round(P.crown.fall * share * (calm ? 0.67 : 1)); for (let i = 0; i < n; i++) queue.push({ t: -(show.c - P.wind.from) + 5 * rnd(), from: (b) => fromCrown(b, true) }); due(0); }
  airDirt.all();                                                            // (one upload of every slot, not two thousand small ones)
  stats.stepsAtStart = stats.steps; stats.checksAtStart = stats.checks; stats.msCheckAtStart = stats.msCheck;      // (what filling the air cost, before the first frame)
  let throughDone = null;                                                   // (decided on the first frame: a realm entered beyond the painting has had them long since)

  // ============================================================================================ what the staging drives
  // shared.cast.leaves (nothing here plays a sound or places a cue):
  Object.assign(api, {
    fall, afloat: floaters, landed: floaters, bowls,                        // the family's handles (the leaf in the air; the leaves on the water, with `add` going through `keep` below: every slot of that pool is this module's to write; `landed` is the same, kept for those who knew two); the kettledrums' few leaves (a mesh)
    burstCrown, burstTier, burstAt, through,                                // leaves let go at once: the crown (the gust's 400, the fall's 600), a tier's rail, a point; the 60 that come through the painting with the boat
    /** The draught: `speed` metres a second toward the stage, reached over `seconds` (the hour: 0.15; the fall: 0.6). The module stops following the clock for it. */
    draught(speed, seconds = 3) { auto.wind = false; windEase = { from: windNow, to: speed, t0: ctx.time, T: Math.max(0.01, seconds) }; return api; },
    /** How fast what floats drifts toward the stage (0.03; 0.15 from the hour), reached over `seconds`. */
    driftTo(speed, seconds = 3) { auto.drift = false; driftEase = { from: driftNow, to: speed, t0: ctx.time, T: Math.max(0.01, seconds) }; return api; },
    /** How many leaves lie on the water (2,600 to 11,000), reached over `seconds`: more come down where it is to be thicker; where it is to be thinner, those that go under are not replaced. */
    coverTo(leaves, seconds = 14) { auto.cover = false; coverEase = { from: coverNow, to: clamp(leaves / A.full, 0, 1), t0: ctx.time, T: Math.max(0.01, seconds) }; return api; },
    /** What the module does by itself on the show clock: set any of these false to drive it from the staging instead. */
    auto,
    /** Put a leaf down on the water (something of another group's has just landed there): true if it was kept. p: { turn, flip, size }. */
    keep,
    /** Is (s, d) open water a leaf may lie on? Is there something solid at (s, d, y)? */
    onWater, solid,
    /** To read: how many are in the air (from the crown, from the tiers, let go by the staging), how many lie on the water. */
    get inAir() { return { crown: inAir[1], tiers: inAir[2], staged: inAir[3] }; },
    get lying() { return aliveN; }, get floatingOn() { return longN; },
    get wind() { return windNow; }, get drift() { return driftNow; }, get cover() { return coverNow; },
    stats,
  });

  // ---- a leaf has come down
  const info = { distance: 0, onBoat: false, turn: 0, index: 0, color: null, kind: 'leaf', level: 0 }, landing = { x: 0, y: 0, z: 0 }, kept = { turn: 0, flip: false, size: 0, k: 0, born: 0, life: 0, laid: false };
  let ringsLeft = 0, landBudget = 0;
  /** Out of the rider's boat: a leaf comes down beside the hull (the same easing as in the vertex extension, at the water). */
  const aside = (p) => {
    const Hu = hull.uniforms.uLifeHull.value, half = hull.uniforms.uLifeHullB.value.x, bx = Hu.z - Hu.x, bz = Hu.w - Hu.y, px = p.x - Hu.x, pz = p.z - Hu.y;
    const k = clamp((px * bx + pz * bz) / Math.max(bx * bx + bz * bz, 1e-4), -0.12, 1.3), reach = Math.max(half + 0.36, UL.uLvEye.value.y);
    let hx = px - bx * k, hz = pz - bz * k; const hd = Math.hypot(hx, hz);
    if (hd >= reach) return p;
    if (hd > 1e-3) { hx /= hd; hz /= hd; } else { const l = Math.hypot(bx, bz) || 1; hx = -bz / l; hz = bx / l; }
    p.x += hx * (reach - hd); p.z += hz * (reach - hd);
    return p;
  };
  const landed = (i) => {
    const i4 = i * 4, Pm = aimSlot(i);
    where(Pm - 0.004, carried.x - aA.array[i4 + 2], carried.y - aA.array[i4 + 3], landing);
    aside(landing);
    inAir[kindOf[i]]--; kindOf[i] = 0; freeA.push(i);
    stats.landed++;
    const x = landing.x, z = landing.z, dist = Math.hypot(x - ctx.boat.x, z - ctx.boat.z);
    if (byMound(-z, x) && moundH(-z, x) > HEAP) stats.onMound++;            // (on the mound's heap: it is one more leaf of it; the water gets none, the staging its tick)
    const wet = z < -120.5 ? onWater(-z, x) : isOpen(-z, x);
    // how it lies as it lands (the family's attitude at the end of its fall, turned as the column has turned it), and which side up
    const turn = seeds[i4 + 3] * 40 + TAU * 0.09 * (seeds[i4] - 0.5) * Pm + 0.5 * Math.sin(Lf.w * Pm + Lf.ph) - Lf.om * Pm;
    if (wet) {
      kept.turn = turn; kept.flip = (Lf.half & 1) === 1; kept.size = LF.size * (1 + 0.2 * (seeds[i4 + 1] * 2 - 1)); kept.k = Math.floor(fract(seeds[i4 + 2] * 5.37 + seeds[i4]) * 8); kept.born = endAt[i];
      keepLanding(x, z, kept);
    }
    if (dist > P.landings.within || landBudget < 1) return;
    landBudget -= 1;
    if (wet && ringsLeft > 0) { ctx.water.ripple(x, z, P.landings.ring[0] * (0.7 + 0.6 * rs()), P.landings.ring[1]); ringsLeft--; stats.rings++; }
    const cb = api.onLand;
    if (cb) { info.distance = dist; info.onBoat = false; info.turn = turn; info.index = i; cb(x, z, info); }
  };

  const topUp = (kind, from, since) => {
    let n = Math.min(10, Math.round(targets[kind]) - inAir[kind]), tries = 0;
    while (n > 0 && tries++ < 40) {
      const r = letGo(from(b0), kind); if (r < 0) break; if (r) { n--; railTries = 0; }
      if (stats.steps - since > CAP) break;
    }
  };
  let turn = 0;
  const fireOn = T && T.uniforms && T.uniforms.uLfFireOn ? T.uniforms.uLfFireOn : null;
  const roomCol = new THREE.Color('#FFE6C4'), moonCol = new THREE.Color('#C4D6D0');
  const ease = (e, now) => lerp(e.from, e.to, S((now - e.t0) / e.T));
  return {
    update(dt) {
      const now = ctx.time, c = show.c, k = show.k || 0;
      hemNow = plan.curtainHem(c);
      hull.update(ctx);
      // ---- the light
      UL.uLvRoom.value.copy(roomCol).multiplyScalar(0.9 * k);
      UL.uLvMoon.value.copy(moonCol).multiplyScalar(0.16 * (ctx.look.house ? ctx.look.house.moon : 0) * (1 - 0.8 * k));
      UL.uLvFire.value.w = fireOn ? fireOn.value : smooth(1, 6, c);
      // ---- the draught, the drift, the cover (what the draught has carried so far is summed with the wind as it was this frame)
      carried.x += fW.x * dt; carried.y += fW.z * dt; UL.uLvCarry.value.copy(carried);
      if (auto.wind) windNow = windAt(c); else if (windEase) { windNow = ease(windEase, now); if (now - windEase.t0 >= windEase.T) windEase = null; }
      fW.x = toStage.x * windNow; fW.z = toStage.y * windNow;
      if (auto.drift) driftNow = driftAt(c); else if (driftEase) { driftNow = ease(driftEase, now); if (now - driftEase.t0 >= driftEase.T) driftEase = null; }
      afloat.drift = driftNow;
      let rising = false;
      if (auto.cover) { const cv = coverAt(c); rising = cv > coverNow + 1e-5; coverNow = Math.max(coverNow, cv); }
      else if (coverEase) { const cv = ease(coverEase, now); rising = cv > coverNow; coverNow = cv; if (now - coverEase.t0 >= coverEase.T) coverEase = null; }
      setDev();
      // ---- who has landed: a ring, the staging's callback, and the leaf stays on the water (at most forty rings and callbacks a frame)
      ringsLeft = 40; landBudget = Math.min(landBudget + P.landings.perSecond * dt, Math.max(2, P.landings.perSecond * 0.25));
      let top = -1;
      for (let i = 0; i < hw; i++) { if (!kindOf[i]) continue; if (endAt[i] <= now + 0.018) landed(i); else top = i; }
      hw = top + 1;
      // ---- the fall, by the clock: the crown lets its 600 go (a third of them with reduced motion)
      if (auto.crown && !crownDone && c >= P.wind.from) { crownDone = true; burstCrown({ count: P.crown.fall * (calm ? 0.67 : 1), over: 5 }); }
      // ---- through the painting: the leaves that come with the boat (once, the first time its prow is past the cloth)
      if (sWas !== null && dt > 1e-4) boatV += (clamp((ctx.s - sWas) / dt, 0, 6) - boatV) * Math.min(1, dt * 3);
      sWas = ctx.s;
      if (throughDone === null) throughDone = ctx.s > 121.6;
      if (auto.through && !throughDone && ctx.s > 120.6) { throughDone = true; through(); }
      for (const f of tests) f();
      const t0 = performance.now(), steps0 = stats.steps;
      due(now, steps0);
      // ---- one let go for each that has landed: the air keeps its two thousand (the two kinds take turns to go first)
      if (turn ^= 1) { topUp(1, fromCrown, steps0); topUp(2, fromTiers, steps0); } else { topUp(2, fromTiers, steps0); topUp(1, fromCrown, steps0); }
      // ---- the water: who has gone under (their slots are free again); and while the cover is rising, what the fall brings down
      // beyond this module's own leaves (the presences' thousands land in their own shader): put down where they come down, away from the boat
      { const n = Math.min(hwF, Math.max(48, Math.ceil(NFS / 90)));
        for (let q = 0; q < n; q++) {
          const j = sweepAt;
          if (aliveF[j]) { if (deathAt[j] <= now) { if (aliveF[j] === 1) longN--; aliveF[j] = 0; aliveN--; freeF.push(j); } else if (j > sweepTop) sweepTop = j; }
          if (++sweepAt >= hwF) { sweepAt = 0; hwF = sweepTop + 1; sweepTop = -1; }
        } }
      // (the presences' script is asked, once it is there, to hand over where each leaf of the house's fall comes down)
      if (!hooked) {
        const PR = shared.cast.presences, sit = PR && PR.sitters;
        if (sit && typeof sit.settleOn === 'function' && !dev.has('lvnohand')) { try { sit.settleOn(taker, 1e5); hooked = 1; } catch (err) { hooked = -1; } }
        else if (now > 1.5) hooked = -1;
      }
      // (and if nobody hands them over, or they have stopped coming while the water still wants leaves, the fall's leaves are laid by
      // the page's map of where it comes down, away from the boat: there a leaf appearing with none arriving would be seen)
      if ((rising || dev.has('lvcover')) && (hooked !== 1 || now - handedAt > 3)) {
        let n = Math.min(60, target() - longN);
        while (n-- > 0 && sampleFall(sp)) { if ((sp.d - ctx.boat.x) ** 2 + (-sp.s - ctx.boat.z) ** 2 < 30) continue; if (put(sp.d, -sp.s, { life: lifeAt(sp.s, c), flip: rs() < 0.3, born: now }) < 0) break; }
      }
      fg.instanceCount = hwF;
      airDirt.flush(); seaDirt.flush();
      if (stats.timed) { const ms = performance.now() - t0; stats.ms += ms; stats.frames++; if (ms > stats.msMost) stats.msMost = ms; }
      if (dev.has('lvlog') && !logged && now >= num('lvlogt', 6)) { logged = true; writeLog(); }
    },
  };
}
