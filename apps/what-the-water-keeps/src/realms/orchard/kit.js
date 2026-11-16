// The orchard in flood: kit pieces, multitudes and the close band. STAGE 1: EVERY THING HERE IS A STAND-IN of the true
// size in the true place, in its local colour, at the count the page plans, so that composition, sight lines and the
// cost of the picture are real from the first day (docs/building-an-area.md). Stage 2b replaces each with its model
// (page section 9) and deletes the stand-in's lines. The comment on each says which model it stands for.
// The trees stand where src/realms/orchard-plan.js puts them (plan.trees), which the orchard in snow shares.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { makeCloth } from '../../engine/cloth.js';
import { limb, lobeGeometry, tinted, stick, nameAt, Pile } from './standins.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);

// ------------------------------------------------------------------------------------------------ the avenue trees
// STAND-IN for `apple_A` .. `apple_F` (8.2 to 9.2 m tall, crown 8.6 to 9.8 m, trunk 0.45 m, clear stem 2.6 m,
// limewashed to 1.8 m) and for the dozen `lobe_01` .. `lobe_12` each carries: a pruned standard grown by rule. Returns
// { wood, blossom }: two geometries in the tree's own space (y up, the water at y = 0), vertex-painted.
// low: 'A' | 'B' adds the one long low bough of `apple_low_A` / `apple_low_B`, reaching 5.5 m along the tree's +X at
// 3.2 to 3.8 m up (its underside), with blossom along it.
function appleTree(variant, chip, { low = null, detail = 1 } = {}) {
  let s = 1013 + variant * 97 + (low ? 555 : 0); const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const wood = [], lobes = [], lobe = [lobeGeometry(detail ? 10 : 7, detail ? 6 : 4, variant + 1), lobeGeometry(detail ? 10 : 7, detail ? 6 : 4, variant + 4)];      // about 200 triangles a lobe (the page: 80 to 320)
  const height = 8.2 + (variant % 3) * 0.4 + rnd() * 0.2, spread = 4.3 + ((variant * 5) % 4) * 0.2, fork = 2.6, rad = detail ? 12 : 5;
  // the trunk: 0.45 m thick at the water, limewashed to 1.8 m, bark above; a dark grease band at 1.9 m
  const lean = [(rnd() - 0.5) * 0.16, (rnd() - 0.5) * 0.16];
  const tp = (y) => V(lean[0] * Math.max(0, y) / fork, y, lean[1] * Math.max(0, y) / fork);
  wood.push(tinted(stick(tp(-1.15), tp(1.8), 0.25, 0.212, rad + 2), chip.limewash));
  wood.push(tinted(stick(tp(1.8), tp(1.98), 0.214, 0.214, rad + 2), '#221a22'));
  wood.push(tinted(stick(tp(1.98), tp(fork + 0.15), 0.21, 0.2, rad + 2), chip.bark));
  const top = tp(fork);
  const addLobe = (x, y, z, w, tall = 1) => { const g = lobe[lobes.length % 2].clone(); g.rotateY(rnd() * 6.283); g.scale(w, w * tall, w); g.translate(x, y, z); lobes.push(g); };
  // One cumulus to a tree: a ring of clouds with a level base 4.5 to 5 m above the water, an inner ring above it and a
  // top. Three or four primaries with an elbow each (the habit of a pruned standard) carry the ring; shorter boughs
  // carry the rest. Every bough ends inside a cloud.
  const nB = 3 + (variant % 2), start = rnd() * 6.283, ring = detail ? 6 + (variant % 2) : 4;
  for (let i = 0; i < ring; i++) {
    const az = start + i / ring * 6.283 + (rnd() - 0.5) * 0.35, r = spread * (0.6 + rnd() * 0.14), w = detail ? 3.0 + rnd() * 1.0 : 4.6, base = 4.5 + rnd() * 0.6;
    const end = V(top.x + Math.cos(az) * r, base + 0.25, top.z + Math.sin(az) * r);
    addLobe(end.x, base, end.z, w, 0.85 + rnd() * 0.3);
    if (i % Math.round(ring / nB) === 0 || !detail) {                           // a primary, with its elbow
      const elbow = V(top.x + Math.cos(az - 0.3) * r * 0.42, top.y + (base - top.y) * 0.72, top.z + Math.sin(az - 0.3) * r * 0.42);
      wood.push(tinted(stick(top, elbow, 0.12, 0.09, rad), chip.plum)); wood.push(tinted(stick(elbow, end, 0.09, 0.05, rad), chip.plum));
    } else {                                                                    // a second-order bough off the leader
      const from = tp(fork + 0.9 + rnd() * 0.8); wood.push(tinted(stick(from, end, 0.06, 0.03, Math.max(4, rad - 4)), chip.plum));
    }
  }
  const lead = V(top.x + (rnd() - 0.5) * 0.5, height - 2.6, top.z + (rnd() - 0.5) * 0.5);
  wood.push(tinted(stick(top, lead, 0.12, 0.05, rad), chip.plum));
  if (detail) for (let i = 0; i < 4; i++) {
    const az = start + 0.5 + i / 4 * 6.283, r = 1.1 + rnd() * 0.7, base = 5.7 + rnd() * 0.7;
    addLobe(top.x + Math.cos(az) * r, base, top.z + Math.sin(az) * r, 2.7 + rnd() * 0.7, 0.9 + rnd() * 0.25);
  }
  addLobe(lead.x, height - (detail ? 2.1 : 3.2), lead.z, detail ? 3.2 + rnd() * 0.4 : 4.4, 0.95);
  if (low) {
    // the long low bough: out along +X, sagging between trunk and crutch, to 5.5 m; blossom along it within reach of the eye
    const y0 = low === 'A' ? 3.75 : 3.4, pts = [top.clone(), V(1.6, y0 + 0.35, 0.1), V(3.4, y0 + 0.02, -0.1), V(5.5, y0 + 0.16, 0.05)];
    for (let i = 0; i < 3; i++) wood.push(tinted(stick(pts[i], pts[i + 1], 0.13 - i * 0.03, 0.1 - i * 0.03, rad), chip.plum));
    addLobe(2.3, y0 + 0.2, 0.3, 1.5, 0.75); addLobe(3.9, y0 + 0.05, -0.3, 1.7, 0.7); addLobe(5.3, y0 + 0.1, 0.1, 1.5, 0.75);
  }
  for (const g of wood) g.deleteAttribute('uv');
  for (const g of lobes) g.deleteAttribute('uv');
  const out = { wood: mergeGeometries(wood, false), blossom: mergeGeometries(lobes, false) };
  for (const g of [...wood, ...lobes, ...lobe]) g.dispose();
  return out;
}

export async function build(ctx, plan, shared) {
  const { kit } = ctx, F = shared.frame, M = shared.mat, chip = plan.chip;
  const rnd = ctx.rng(31);
  const tris = (g) => (g.index ? g.index.count : g.attributes.position.count) / 3;

  // ================================================================================================ trees
  // ---- the 110 trees of the six sailable rows: six variants, instanced (2 draws a variant: wood, blossom)
  const tints = ['#ffffff', '#f3f0f6', '#f7f2ee', '#eceaf2'];                      // one of four wear tints
  const place = (t) => ({ position: [t.x, 0, t.z], rotation: [Math.sin(t.leanDir) * t.lean, t.turn, Math.cos(t.leanDir) * t.lean], scale: t.scale, color: tints[t.tint] });
  let treeTris = 0;
  for (let v = 0; v < 6; v++) {
    const list = plan.trees.trees.filter((t) => t.variant === v && !t.low).map(place); if (!list.length) continue;
    const g = appleTree(v, chip); treeTris += (tris(g.wood) + tris(g.blossom)) * list.length;
    kit.instances(g.blossom, M.blossom, list).name = `standin:apple_${'ABCDEF'[v]} (lobes)`;      // (the wood is real now: kit_trees.js)
  }
  // ---- the thirteen with one long low bough toward the centre line, each bough on a crutch (STAND-IN for `apple_low_A`,
  // `apple_low_B` and `crutch_A..C`)
  for (const kind of ['A', 'B']) {
    const lows = plan.trees.trees.filter((t) => t.low === kind); if (!lows.length) continue;
    const g = appleTree(kind === 'A' ? 2 : 4, chip, { low: kind });
    // its +X (the bough) points at the centre line
    const list = lows.map((t) => ({ position: [t.x, 0, t.z], rotation: [0, plan.heading(t.s) + (t.d > 0 ? Math.PI : 0), 0], scale: 1, color: tints[t.tint] }));
    kit.instances(g.blossom, M.blossom, list).name = `standin:apple_low_${kind} (lobes)`;
    treeTris += (tris(g.wood) + tris(g.blossom)) * list.length;
  }
  nameAt(ctx, 'apple_A..F, apple_low_A/B: 110 trees', [30.5, 10, 9]);
  // (the crutches, crutch_A..C, are real now: kit_trees.js)

  // ---- rows +/-37 and +/-46: STAND-IN for `apple_far` (true trees from every side, simplified), in standing growth
  {
    const g = appleTree(1, chip, { detail: 0 }), list = plan.trees.far.map(place);
    kit.instances(g.blossom, M.blossom, list).name = 'standin:apple_far (lobes)';
    treeTris += (tris(g.wood) + tris(g.blossom)) * list.length;
  }
  // ---- rows +/-55, +/-64, +/-73: STAND-IN for `apple_mote` (low models in mist)
  {
    const stem = tinted(stick(V(0, -1, 0), V(0, 4.6, 0), 0.22, 0.14, 5), chip.limewash), l1 = lobeGeometry(8, 5, 2), l2 = lobeGeometry(7, 4, 5);
    l1.scale(7.6, 4.2, 7.6); l1.translate(0, 4.4, 0); l2.scale(5, 3, 5); l2.translate(0.8, 6.2, -0.4);
    for (const g of [stem, l1, l2]) g.deleteAttribute('uv');
    const wood = stem, bl = mergeGeometries([l1, l2], false), list = plan.trees.motes.map(place);
    kit.instances(bl, M.blossom, list).name = 'standin:apple_mote (lobes)';
    treeTris += (tris(wood) + tris(bl)) * list.length;
  }
  shared.treeTriangles = treeTris;
  shared.counts = { ...(shared.counts || {}), trees: { sail: plan.trees.trees.length, far: plan.trees.far.length, motes: plan.trees.motes.length, triangles: Math.round(treeTris), aTree: Math.round(tris(appleTree(0, chip).wood) + tris(appleTree(0, chip).blossom)) } };

  // (the hedge, hawthorn_6m, is real now: kit_trees.js)

  // ================================================================================================ left for the night
  {
    const p = new Pile(), Lf = plan.left, wood = '#6a5c62';
    // ---- STAND-IN for `ladder_4m` (13 rungs) x 2, each with a `basket` on its ninth rung; `ladder_7m` (22 rungs), the
    // pole ladder from the islet to the lamp limb with a basket on its top rung; the ladder fallen from the tree at (174.5, +10)
    const ladder = (foot, topPt, rungs) => {
      const [fs, fd, fy] = foot, [us, ud, uy] = topPt, across = [-(ud - fd), us - fs], al = Math.hypot(across[0], across[1]) || 1, ax = across[0] / al * 0.21, ay = across[1] / al * 0.21;
      for (const side of [-1, 1]) p.limb({ line: [[fs + side * ax, fd + side * ay, fy], [us + side * ax * 0.8, ud + side * ay * 0.8, uy]], thick: 0.055, smooth: false, radial: 5 }, wood);
      for (let i = 1; i <= rungs; i++) { const u = i / (rungs + 1), s = fs + (us - fs) * u, d = fd + (ud - fd) * u, y = fy + (uy - fy) * u; p.limb({ line: [[s - ax, d - ay, y], [s + ax, d + ay, y]], thick: 0.034, smooth: false, radial: 4 }, wood); }
    };
    for (const l of Lf.ladders) {
      const top = [l.tree[0] + (l.foot[0] - l.tree[0]) * 0.22, l.tree[1] + (l.foot[1] - l.tree[1]) * 0.22, 3.5];
      ladder([l.foot[0], l.foot[1], -0.45], top, 13);
      const u = l.basketRung / 14, bs = l.foot[0] + (top[0] - l.foot[0]) * u, bd = l.foot[1] + (top[1] - l.foot[1]) * u;
      p.cyl([bs, bd + 0.3 * Math.sign(l.foot[1]), -0.45 + (3.5 + 0.45) * u - 0.1], [0.5, 0.26, 0.5], '#8a7a66');                     // basket
    }
    { const P = plan.tree.poleLadder, top = [102.6, -0.4, 5.2]; ladder(P.foot, top, 22); p.cyl([top[0] + 0.3, top[1] + 0.3, 4.72], [0.5, 0.26, 0.5], '#8a7a66'); }
    { const Fl = Lf.fallenLadder; ladder([Fl.from[0], Fl.from[1], -0.55], [Fl.to[0], Fl.to[1], Fl.topOut], 13); }
    // ---- STAND-IN for `crate` (0.6 m, afloat at (58, +3)) and the sunk `basket` at (78, +7)
    p.box([Lf.crate[0], Lf.crate[1], -0.12], [0.6, 0.34, 0.42], '#7a6a60', 0.5, [0.05, 0.03]);
    p.cyl([Lf.sunkBasket[0], Lf.sunkBasket[1], -0.98], [0.5, 0.26, 0.5], '#6a6258', 0, [1.1, 0]);
    // two more baskets on the hive stand
    for (const k of [-1.7, 1.9]) p.cyl([Lf.hives.at[0] + k, Lf.hives.at[1] + 0.1, Lf.hives.deck], [0.5, 0.26, 0.5], '#8a7a66');
    // ---- STAND-IN for `plank_span` x 3: duckboards on trestles 0.35 m above the water along d +14.5 from s 154.5 to
    // 214, planks missing from 170 to 176 and 190 to 193, one afloat at (172, +11); it ends at the stone step-stile
    const W = Lf.plankWalk;
    for (let s = W.from; s < W.to - 0.01; s += 3) {
      if (W.missing.some(([a, b]) => s + 1.5 > a && s + 1.5 < b)) { for (const k of [0, 3]) for (const side of [-1, 1]) p.box([s + k, W.d + side * 0.3, -1], [0.08, 1 + W.deck - 0.08, 0.08], '#4a4048'); continue; }
      p.box([s + 1.5, W.d - 0.17, W.deck - 0.05], [0.3, 0.05, 3.02], wood, (rnd() - 0.5) * 0.02); p.box([s + 1.5, W.d + 0.17, W.deck - 0.05 + (rnd() - 0.5) * 0.02], [0.3, 0.05, 3.02], '#75676c', (rnd() - 0.5) * 0.02);
      for (const k of [0, 3]) { for (const side of [-1, 1]) p.box([s + k, W.d + side * 0.3, -1], [0.08, 1 + W.deck - 0.08, 0.08], '#4a4048'); p.box([s + k, W.d, W.deck - 0.14], [0.8, 0.08, 0.1], '#4a4048'); }
    }
    p.box([W.afloat[0], W.afloat[1], -0.03], [0.3, 0.05, 3.0], wood, 0.7);
    p.build(ctx, 'ladder_4m x2, ladder_7m, baskets, crate, plank_span', M.wood);
  }

  // ---- STAND-IN for `wall_6m` x 4: dry stone, 1.2 m showing, coping on edge, hedge to hedge at s 216 with the 17 m gap;
  // one piece carries the step-stile's three through-stones at d +14.5
  {
    const Wl = plan.left.wall, p = new Pile();
    for (const side of [-1, 1]) for (let d = Math.abs(Wl.gap[0]) + Wl.pier.thick; d < 82; d += 6) {
      const len = Math.min(6, 82 - d), h = Wl.showing + (rnd() - 0.5) * 0.12;
      p.box([Wl.s, side * (d + len / 2), -1], [len + 0.02, 1 + h, 0.6], side * d > 14 && rnd() < 0.4 ? '#56626f' : chip.stone);
      p.box([Wl.s, side * (d + len / 2), h], [len, 0.16, 0.34], '#6f7c8a');                                                         // the coping, on edge
    }
    for (let k = 0; k < 3; k++) p.box([Wl.s - 0.55, Wl.stile[1] + (k - 1) * 0.5, 0.25 + k * 0.3], [0.45, 0.09, 0.5], '#8a94a0');     // the step-stile
    p.build(ctx, 'wall_6m (25 pieces), the step-stile', M.wood);
  }

  // ================================================================================================ the loft (our half of the passage in)
  // The cloth loft is the dyers' reach's to model (its page is the master for the section); this is our half of the one
  // shed, as STAND-INS for `loft_bay` (post pair, braces, tie beam, king post) and `louvre_panel`: 16 m of water, the
  // post lines 19.2 m apart, posts 0.35 m square every 5 m at s 1, 6, 11, 16, 21, tie beams at 9 m, ridge at 13 m.
  // Outside, the shed is carried on east past the path's first point, so that from the orchard its roof runs away
  // into the dusk instead of stopping.
  {
    const L = plan.left.loft, p = new Pile(), dark = '#15131a', darker = '#0f0e14', east = -34;
    for (const s of L.postEvery) {
      for (const side of [-1, 1]) {
        p.box([s, side * L.posts, -1], [0.35, L.tie + 1, 0.35], dark);
        p.limb({ line: [[s, side * L.posts, L.tie - 2.2], [s, side * (L.posts - 2.2), L.tie]], thick: 0.2, smooth: false, radial: 4 }, dark);       // brace
        p.limb({ line: [[s, side * (L.posts + 0.2), L.tie], [s, 0, L.ridge]], thick: 0.24, smooth: false, radial: 4 }, dark);                    // rafter
      }
      p.box([s, 0, L.tie - 0.15], [L.posts * 2 + 0.6, 0.3, 0.3], dark);                                                                          // tie beam
      p.box([s, 0, L.tie], [0.25, L.ridge - L.tie, 0.25], dark);                                                                                 // king post
    }
    // the roof, the louvred side walls (the dusk shows through them as teal hairlines: left out here), the gable above the door
    const len = L.door - east, mid = (L.door + east) / 2, slope = Math.atan2(L.ridge - L.tie, L.posts + 0.4), half = Math.hypot(L.ridge - L.tie, L.posts + 0.4);
    for (const side of [-1, 1]) {
      p.box([mid, side * (L.posts + 0.4) / 2, (L.tie + L.ridge) / 2 - 0.06], [half + 0.5, 0.12, len], darker, 0, [0, -side * slope]);
      p.box([mid, side * (L.posts + 0.3), -1], [0.14, L.tie + 1.2, len], darker);
      p.box([L.door - 0.1, side * (L.water / 2 + 0.45 + (L.posts + 0.3 - L.water / 2 - 0.45) / 2), -1], [L.posts + 0.3 - L.water / 2 - 0.45 + 0.2, L.tie + 1.2, 0.16], darker);     // the gable beside the door
    }
    p.box([L.door - 0.1, 0, L.doorHeight + 0.4], [L.posts * 2 + 0.8, L.tie - L.doorHeight + 0.4, 0.16], darker);
    {                                                                                                                                             // the gable's triangle, weatherboarded
      const a = F.at(L.door - 0.1, -(L.posts + 0.4), L.tie + 0.75), b = F.at(L.door - 0.1, L.posts + 0.4, L.tie + 0.75), c = F.at(L.door - 0.1, 0, L.ridge + 0.1), g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute([a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z, b.x, b.y, b.z, a.x, a.y, a.z, c.x, c.y, c.z], 3)); g.computeVertexNormals(); g.setIndex([0, 1, 2, 3, 4, 5]);
      p.geo(g, darker);
    }
    p.build(ctx, 'loft_bay x5, louvre_panel, the gable (the reach\'s model)', M.wood);
    // ---- the indigo bolts (src/engine/cloth.js): 2.4 m wide, hung in rows at s 3.5, 8.5, 13.5, 18.5, 23.5 as dark
    // shapes, leaving 5 m clear over the centre; the last row's hems in the water
    const bolts = [];
    L.bolts.forEach((s, r) => {
      for (const side of [-1, 1]) for (let k = 0; k < 2; k++) {
        const d = side * (L.clearCentre / 2 + L.boltWidth / 2 + 0.15 + k * (L.boltWidth + 0.35)), top = L.tie - 0.2, hem = r === L.bolts.length - 1 ? -0.25 : 0.45 + ((r * 7 + k * 3 + (side > 0 ? 1 : 0)) % 4) * 0.22, pos = F.at(s + (k ? 0.25 : -0.2), d, top);
        bolts.push({ position: [pos.x, pos.y, pos.z], width: L.boltWidth, length: top - hem, turn: plan.heading(s), color: (r + k) % 3 ? '#1b2148' : '#26397a', stiff: 0.55 });
      }
    });
    shared.bolts = makeCloth(ctx.engine, ctx, bolts, { backlight: 0.5, sway: 0.2, speed: 0.35 });
    // The dark of the loft: behind the path's first point the shed is closed by the veil's own colour, unfogged, so that
    // from the orchard its depths are the indigo-black the rider came out of (fog would paint a far wall the colour of dusk).
    const dark2 = new THREE.Mesh(new THREE.PlaneGeometry(L.posts * 2 + 0.6, L.ridge + 2), new THREE.MeshBasicMaterial({ color: shared.seen(plan.light.veil), fog: false, side: THREE.DoubleSide }));
    dark2.position.copy(F.at(-0.7, 0, (L.ridge + 2) / 2 - 1)); dark2.name = 'the dark of the loft'; ctx.add(dark2);
    nameAt(ctx, `${bolts.length} indigo bolts (cloth.js)`, [13.5, 0, 9.4]);
  }

  // ================================================================================================ multitudes of the close band
  // Instanced stand-ins at the page's counts (kit.count thins them on lower qualities), one draw each.
  {
    // (cow parsley, grass tips, narcissus and bluebells are real now: kit_plants.js)
    const trees = plan.trees.trees;
    // ---- STAND-IN for `spray` (a twig with seven five-petalled flowers and three buds, 44 triangles) x 2,400 (the page's
    // starting count; its ceiling is 3,000): they break every edge and underside within reach of the eye. 600 of them on
    // the oldest tree's low limbs, the rest under the avenue crowns nearest the lane.
    const spray = (() => { const parts = []; for (let k = 0; k < 2; k++) { const g = new THREE.SphereGeometry(0.1, 5, 3); g.scale(1, 0.45, 1); g.translate(Math.cos(k * 2.2) * 0.1, Math.sin(k * 1.7) * 0.03, Math.sin(k * 2.2) * 0.1); g.deleteAttribute('uv'); parts.push(g); } return mergeGeometries(parts, false); })();      // (tufts, not points: a spray seen as a point is glitter)
    const sp = [], ns = kit.count(plan.count.sprays), near = trees.filter((t) => Math.abs(t.row) === 10), T = plan.tree;
    const limbs = [T.lampLimb.line, T.arch.line, T.westLimb.line];
    for (let i = 0; i < ns; i++) {
      if (i < ns * 0.25) { const ln = limbs[i % 3], k = Math.floor(rnd() * (ln.length - 1)), u = rnd(), s = ln[k][0] + (ln[k + 1][0] - ln[k][0]) * u, d = ln[k][1] + (ln[k + 1][1] - ln[k][1]) * u, y = ln[k][2] + (ln[k + 1][2] - ln[k][2]) * u, p = plan.xz(s + (rnd() - 0.5) * 1.6, d + (rnd() - 0.5) * 1.6); sp.push({ position: [p[0], Math.max(0.5, y + 0.2 + rnd() * 1.4), p[1]], rotation: [rnd() * 3, rnd() * 6.283, rnd() * 3], scale: 0.8 + rnd() * 0.6 }); }
      else { const t = near[Math.floor(rnd() * near.length)], a = rnd() * 6.283, r = 1.5 + rnd() * 3.4; sp.push({ position: [t.x + Math.cos(a) * r, 4.2 + rnd() * 1.2 - (t.low ? rnd() * 0.9 : 0), t.z + Math.sin(a) * r], rotation: [rnd() * 3, rnd() * 6.283, rnd() * 3], scale: 0.8 + rnd() * 0.6 }); }
    }
    ctx.only(kit.instances(spray, shared.paint({ color: '#cfc8dc', brush: 0.2, shade: 0.7, extend: shared.holdsLight }), sp), 'direct').name = 'standin:spray';
    // ---- STAND-IN for `label` (blank zinc, 6 x 3 cm on 15 cm of wire) x 110: one on the lowest bough of every tree
    const lab = new THREE.BoxGeometry(0.06, 0.03, 0.002);
    ctx.only(kit.instances(lab, shared.paint({ color: '#9aa0a8', brush: 0.1 }), trees.map((t) => ({ position: [t.x + 0.5, 2.55, t.z + 0.3], rotation: rnd() * 6.283, scale: 1 }))), 'direct').name = 'standin:label';
  }
  return {};
}
