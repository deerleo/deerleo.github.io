// The orchard in snow: kit pieces, multitudes and the close band. STAGE 1: EVERY THING HERE IS A STAND-IN of the true
// size in the true place, in its local colour, at the count the page plans, so that composition, sight lines and the
// cost of the picture are real from the first day (docs/building-an-area.md). Stage 2c replaces each with its model
// (page section 9) and deletes the stand-in's lines; the comment on each says which model it stands for.
//
// LAYERS (page: winter / memory / shared). Every tree is three things in the same place:
//   wood    SHARED   (the orchard's `apple_A..F`, bare: drawn above the water and in it)
//   snow    WINTER   (this area's `apple_snow_A..F`: ctx.only(obj, 'direct'))
//   lobes   MEMORY   (the orchard's `lobe_01..12`, in blossom: ctx.only(obj, 'mirror'); trees within 40 m of the road)
// The trees stand where src/realms/orchard-plan.js puts them (plan.trees: the flood orchard's plan, 78 m on).
// (shared.orchard, with every twig end, is published by module `trees`: kit_trees.js.)
import * as THREE from 'three';
import { stick, ridge, lobeGeometry, tinted, merge, nameAt, Pile, V } from './standins.js';
import { waterUniforms } from '../../engine/water-final.js';

const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

export async function build(ctx, plan, shared) {
  const { kit } = ctx, F = shared.frame, C = plan.chip, land = shared.land;
  // EVERY STAND-IN HERE WEARS A MATERIAL OF ITS OWN, made fresh by the area's own recipes (light.js, `mat`), never
  // shared.mat's. The groups that hold these pieces take the stand-ins out by name (removeStandIn), which frees a
  // stand-in's material with it: a shared material freed under every other mesh that wears it had the page print
  // twelve GL errors on each picture once enough things wore shared.mat.ice and shared.mat.snow.
  const P = shared.paint, Lt = shared.light;
  const M = {
    get snow() { return P({ color: C.paper, brush: 0.35, steps: 4, extend: Lt.lift }); },
    get ice() { return P({ color: '#ffffff', vertexColors: true, brush: 0.4 }); },
    get frost() { return P({ color: C.frost, brush: 0.3 }); },
    get woodFine() { return P({ color: '#ffffff', vertexColors: true, brush: 0.6, crisp: true, extend: Lt.wet }); },
    get ink() { return P({ color: C.inkPaint, brush: 0.4, crisp: true }); },
    get line() { return P({ color: C.barkPaint, brush: 0.4, crisp: true }); },
    get birch() { return P({ color: '#ffffff', vertexColors: true, brush: 0.6 }); },
  };
  const rnd = ctx.rng(631);
  const tris = (g) => (g ? (g.index ? g.index.count : g.attributes.position.count) / 3 : 0);
  const count = shared.counts = shared.counts || {};
  const put = (geo, mat, list, name, layer) => { if (!geo || !list.length) return null; const m = kit.instances(geo, mat, list); m.name = name; if (layer) ctx.only(m, layer); return m; };

  // ================================================================================================ the orchard's trees
  // THE TREES ARE NO LONGER HERE. The wood of every tree (the flood orchard's own models), the snow on it, the stand-in
  // blossom in the water, the two lost trees, the thirteen crutches under the low boughs and the nine props under the
  // oldest tree are module `trees` (kit_trees.js, built before this one; log: docs/build/snow/2-kit-trees.md), which
  // also publishes shared.orchard (ends, trees, perches ...). What is left here of that section:
  // ---- STAND-IN (the Monument group's: taken out from heroes.js) for the collars of ice on the nine props under the
  // oldest tree and the cap of snow in each fork
  {
    const crutchSnow = [];
    plan.tree.props.forEach(([s, d, h]) => {
      { const g = new THREE.CylinderGeometry(0.34, 0.42, 0.09, 9); const p = F.at(s, d, 0.03); g.translate(p.x, p.y, p.z); crutchSnow.push(tinted(g, C.frost)); }      // its collar of ice
      { const g = new THREE.SphereGeometry(0.2, 6, 4, 0, 6.283, 0, 1.5); g.scale(1.3, 0.6, 1.3); const p = F.at(s, d, h + 0.16); g.translate(p.x, p.y, p.z); crutchSnow.push(tinted(g, C.paper)); }      // a cap of snow in its fork
    });
    const m = new THREE.Mesh(merge(crutchSnow), M.ice); m.name = 'standin:ice collars and snow caps on the crutches (winter)'; m.frustumCulled = false; ctx.only(ctx.add(m), 'direct');
  }

  // (the bare twig sprays and the snow on them are module `trees`: kit_trees.js)

  // (the hedge, bare and laid, with its snow: module `trees`, kit_trees.js)

  // ================================================================================================ the birch wood
  // STAND-IN for `birch_A..E` (220 birches 16 to 26 m tall, 0.2 to 0.45 m thick, leaning a little over the water, both
  // banks from s 26 to 60, from 1 m behind the bank top to 60 m back), their crown sprays of fine drooping twigs from
  // 9 m up (1,300, 60 triangles) with snow, and seven old nests as ink blots.
  {
    const B = plan.birches, trunks = [], sprays = [], nests = [], placed = [];
    // a trunk: chalk white with black branch scars (vertex paint), one unit tall
    const trunk = (() => {
      const g = new THREE.CylinderGeometry(0.32, 0.5, 1, 7, 12); g.translate(0, 0.5, 0);
      const p = g.attributes.position, col = new Float32Array(p.count * 3), white = new THREE.Color(C.birch), dark = new THREE.Color('#2a2533'), grey = new THREE.Color('#c9c2cf'), c = new THREE.Color();
      for (let i = 0; i < p.count; i++) { const y = p.getY(i), k = Math.round(y * 12), a = Math.atan2(p.getZ(i), p.getX(i)); const scar = (k === 2 || k === 5 || k === 9) && Math.sin(a * 2 + k) > 0.55; c.copy(scar ? dark : y < 0.08 ? grey : white); col.set([c.r, c.g, c.b], i * 3); }
      g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.deleteAttribute('uv'); return g;
    })();
    let tries = 0;
    while (trunks.length < kit.count(B.count) && tries++ < 20000) {
      const side = rnd() < 0.5 ? -1 : 1, s = B.from + 1.5 + rnd() * (B.to - B.from - 1.5), back = B.back[0] + Math.pow(rnd(), 1.5) * (B.back[1] - B.back[0]), d = side * back;
      if (s > 56 && rnd() < (s - 56) / 4) continue;                                 // the birches stop
      // NOT THE PAGE'S: on the left bank the wood's western edge slants back from the river (s 60 at the bank, s 33 at its
      // far edge), or it fills the left of postcard 4, which is to be "almost nothing"
      if (side < 0 && (back + 6) * 0.6 > 70 - s) continue;
      const p = F.at(s, d);
      if (p.z > shared.zFace - 1.5 && Math.abs(p.x - land.xFace) < plan.cliff.wide / 2 + 2) continue;      // not inside the cliff
      if (placed.some((o) => Math.hypot(o[0] - p.x, o[1] - p.z) < 2.3)) continue;
      placed.push([p.x, p.z]);
      const tall = B.tall[0] + rnd() * (B.tall[1] - B.tall[0]), thick = B.thick[0] + rnd() * (B.thick[1] - B.thick[0]), toward = -side * (0.02 + rnd() * 0.05) * (back < 22 ? 1.6 : 0.6);
      const y = land.snowHeight(p.x, p.z, back - plan.band(s), side) - 0.3, h = F.heading(s), lean = [Math.cos(h) * (rnd() - 0.5) * 0.05 + Math.sin(h) * toward, Math.cos(h) * toward - Math.sin(h) * (rnd() - 0.5) * 0.05];
      trunks.push({ position: [p.x, y, p.z], rotation: [lean[0], rnd() * 6.283, lean[1]], scale: [thick, tall, thick] });
      // its crown: drooping sprays from 9 m up, more on the taller trees
      const n = Math.round(4 + (tall - 16) * 0.45);
      for (let k = 0; k < n; k++) { const hgt = B.crownFrom + (tall - B.crownFrom) * (0.1 + 0.9 * (k + rnd()) / n), a = rnd() * 6.283, out = 0.6 + rnd() * 1.6; sprays.push({ position: [p.x + lean[1] * hgt * -1 + Math.cos(a) * out, y + hgt, p.z + lean[0] * hgt + Math.sin(a) * out], rotation: [0, a, 0], scale: 0.8 + rnd() * 0.7 }); }
      if (nests.length < B.nests && back < 30 && rnd() < 0.12) nests.push({ position: [p.x + 0.4, y + tall * 0.72, p.z], scale: 0.32 + rnd() * 0.12 });
    }
    put(trunk, M.birch, trunks, 'standin:birch_A..E (shared)');
    const spray = (() => { const parts = []; let q = 5; const r = () => (q = (q * 16807) % 2147483647) / 2147483647; for (let i = 0; i < 5; i++) { const a = i / 5 * 6.283 + r(), l = 1.2 + r() * 1.4; const mid = V(Math.cos(a) * l * 0.6, 0.35, Math.sin(a) * l * 0.6), e = V(Math.cos(a) * l, -0.5 - r() * 1.6, Math.sin(a) * l); parts.push(stick(V(0, 0, 0), mid, 0.02, 0.012, 3), stick(mid, e, 0.012, 0.003, 3)); } return merge(parts); })();
    const sprayN = Math.min(sprays.length, kit.count(B.sprays)), sp = sprays.slice(0, sprayN);
    put(spray, M.ink, sp, 'standin:birch crown sprays (shared)');
    const lump = new THREE.SphereGeometry(0.5, 5, 2, 0, 6.283, 0, 1.5); lump.scale(1.7, 0.45, 1.7); lump.translate(0, 0.32, 0);
    put(lump, M.snow, sp, 'standin:snow on the birch sprays (winter)', 'direct');
    put(new THREE.SphereGeometry(1, 7, 5), M.ink, nests, 'standin:old nests (shared)');
    // the broken birch the owl sits on (page cast 10): a stub 6 m tall leaning over the water at (40, -10)
    { const o = plan.owl.perch, p = F.at(o[0], o[1] - 1.2), y = land.snowHeight(p.x, p.z, 1.2, -1) - 0.3; put(trunk, M.birch, [{ position: [p.x, y, p.z], rotation: [0.03, 1, -0.2], scale: [0.4, o[2] - y - 0.1, 0.4] }], 'standin:the broken birch (the owl\'s perch)'); nameAt(ctx, F, 'the broken birch: the owl\'s perch (cast)', [o[0], o[1], o[2]]); }
    nameAt(ctx, F, `birch_A..E: ${trunks.length} birches, ${sprayN} crown sprays`, [40, 14, 12]);
    count.birches = trunks.length; count.birchSprays = sprayN;
  }

  // ================================================================================================ the plain's furniture
  // ---- STAND-IN for `pollard_A..C`: twelve pollard willows on a buried dyke, a 2.5 m trunk 0.7 m thick with a
  // knuckled head and 20 to 30 upright whips 2 to 3 m long
  {
    const P = plan.pollards, parts = []; let q = 3; const r = () => (q = (q * 16807) % 2147483647) / 2147483647;
    parts.push(stick(V(0, -0.5, 0), V(0.1, P.trunk, 0), P.thick / 2, P.thick / 2 * 0.86, 8));
    { const g = new THREE.SphereGeometry(0.55, 8, 6); g.scale(1, 0.75, 1); g.translate(0.1, P.trunk + 0.15, 0); parts.push(g); }
    for (let i = 0; i < 24; i++) { const a = r() * 6.283, o = 0.15 + r() * 0.3, l = P.whips[0] + r() * (P.whips[1] - P.whips[0]); parts.push(stick(V(0.1 + Math.cos(a) * o, P.trunk + 0.3, Math.sin(a) * o), V(0.1 + Math.cos(a) * (o + 0.5 + r() * 0.9), P.trunk + 0.3 + l, Math.sin(a) * (o + 0.5 + r() * 0.9)), 0.025, 0.006, 3)); }
    const body = tinted(merge(parts), '#3B3445'), snow = new THREE.SphereGeometry(0.62, 8, 4, 0, 6.283, 0, 1.3); snow.scale(1, 0.5, 1); snow.translate(0.1, P.trunk + 0.42, 0);
    const list = [];
    for (let i = 0; i < P.count; i++) { const u = i / (P.count - 1), p = F.at(P.from[0] + (P.to[0] - P.from[0]) * u + (rnd() - 0.5) * 2, P.from[1] + (P.to[1] - P.from[1]) * u + (rnd() - 0.5) * 2); list.push({ position: [p.x, land.snowHeight(p.x, p.z, 50, -1) - 0.1, p.z], rotation: rnd() * 6.283, scale: 0.9 + rnd() * 0.25 }); }
    put(body, M.woodFine, list, 'standin:pollard_A..C (shared)'); put(snow, M.snow, list, 'standin:snow on the pollards (winter)', 'direct');
    nameAt(ctx, F, 'pollard_A..C: 12 pollard willows', [97, -103, 6]);
  }
  // ---- STAND-IN for the fence line: 58 posts 2.7 m apart with 0.6 m showing, each with its cap of snow, one wire heavy
  // with hoar; every eighth post a taller `strainer_post` with a stay
  {
    const Fe = plan.fence, posts = [], caps = [], wire = [], n = Fe.posts, dx = Fe.to[0] - Fe.from[0], dd = Fe.to[1] - Fe.from[1];
    const post = new THREE.CylinderGeometry(0.055, 0.065, 1, 5); post.translate(0, 0.5, 0);
    const cap = new THREE.SphereGeometry(0.1, 6, 4, 0, 6.283, 0, 1.5); cap.scale(1, 0.9, 1);
    let prev = null;
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1), p = F.at(Fe.from[0] + dx * u, Fe.from[1] + dd * u), strain = i % Fe.strainerEvery === 0, y = land.snowHeight(p.x, p.z, 30, -1), h = (strain ? 1.0 : Fe.showing) * (0.9 + rnd() * 0.2);
      posts.push({ position: [p.x, y - 0.3, p.z], rotation: [0.06 * (rnd() - 0.5), 0, 0.06 * (rnd() - 0.5)], scale: [strain ? 1.6 : 1, h + 0.3, strain ? 1.6 : 1] });
      caps.push({ position: [p.x, y + h, p.z], scale: strain ? 1.5 : 1 });
      if (strain && i > 0) wire.push(stick(V(p.x + 0.7, y - 0.1, p.z + 0.45), V(p.x, y + h * 0.8, p.z), 0.03, 0.03, 4));           // the stay
      const top = V(p.x, y + h * 0.82, p.z);
      if (prev) { const mid = prev.clone().lerp(top, 0.5); mid.y -= 0.07; wire.push(stick(prev, mid, 0.012, 0.012, 3), stick(mid, top, 0.012, 0.012, 3)); }      // the wire, sagging, furred with hoar
      prev = top;
    }
    put(post, M.line, posts, 'standin:fence posts and strainer_post (shared)'); put(cap, M.snow, caps, 'standin:fence post caps (winter)', 'direct');
    const w = new THREE.Mesh(tinted(merge(wire), C.frost), M.ice); w.name = 'standin:fence wire under hoar (winter)'; w.frustumCulled = false; ctx.only(ctx.add(w), 'direct');
    nameAt(ctx, F, 'fence: 58 posts, one wire', [70, -26, 2]);
  }

  // ================================================================================================ the water's edge and what lies on the water
  // ---- STAND-IN for the shelf's edge (`shelf_A..D` lofted in code): 0.15 to 0.3 m of ice in three strata (snow, white
  // bubbled ice, clear dark ice), undercut by the water. The snow of the land (set.js) is its top stratum; this is the
  // ice under it, standing a finger proud of it, from s 58 to the mist, both sides and round the pond.
  {
    const pos = [], col = [], idx = [], dark = new THREE.Color('#3A3850'), white = new THREE.Color('#C9CDE2');
    for (const side of [-1, 1]) {
      let prev = -1;
      for (let s = plan.straight; s <= 320; s += 0.75) {
        const z = -s, x = land.waterEdge(side, z) - side * 0.035, top = 0.1 + 0.06 * kit.noise(s * 0.4, side * 5.1, 8), base = pos.length / 3;
        pos.push(x, -0.25, z, x - side * 0.02, 0.035, z, x, top, z);
        col.push(dark.r, dark.g, dark.b, dark.r * 1.3, dark.g * 1.3, dark.b * 1.35, white.r, white.g, white.b);
        if (prev >= 0) for (let c = 0; c < 2; c++) { const a = prev + c, b = a + 1, d = base + c, e = d + 1; if (side > 0) idx.push(a, b, d, b, e, d); else idx.push(a, d, b, b, d, e); }      // (it faces the water)
        prev = base;
      }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
    const m = new THREE.Mesh(g, M.ice); m.name = 'standin:the shelf\'s edge (shelf_A..D; winter)'; m.frustumCulled = false; ctx.only(ctx.add(m), 'direct');
  }
  // ---- STAND-IN for the icicles (600 in all, 24 triangles): a comb of 5 to 20 cm under the shelf's lip, 10 to 30 cm in the
  // river banks' undercut. (The cliff's fringe and the bridge's are with those pieces, in heroes_b.js.)
  {
    const cone = new THREE.ConeGeometry(0.5, 1, 5); cone.rotateX(Math.PI); cone.translate(0, -0.5, 0);
    const list = [], n = kit.count(plan.count.icicles - plan.cliff.icicles - plan.bridge.icicles);
    for (let i = 0; i < n; i++) {
      const side = rnd() < 0.5 ? -1 : 1;
      if (i < n * 0.3) { const s = plan.bank.from + 1 + rnd() * (plan.bank.to - plan.bank.from - 6), p = F.at(s, side * (plan.band(s) - 0.25 + rnd() * 0.1)), l = 0.1 + rnd() * 0.2; list.push({ position: [p.x, 0.52 + rnd() * 0.1, p.z], scale: [0.035 + l * 0.12, l, 0.035 + l * 0.12] }); }
      else { const s = 60 + Math.pow(rnd(), 0.8) * 190, z = -s, x = land.waterEdge(side, z) - side * (0.03 + rnd() * 0.03), l = 0.05 + rnd() * 0.15; list.push({ position: [x, 0.11 + rnd() * 0.05, z], scale: [0.02 + l * 0.14, l, 0.02 + l * 0.14] }); }
    }
    put(cone, M.frost, list, 'standin:icicles (winter)', 'direct');
    count.icicles = list.length;
  }
  // ---- STAND-IN for `pan_A..C` (pancake pans, 0.8 to 2.5 m across, rim raised 6 cm, a slush skirt at the waterline):
  // 60 in the road and the pond, 12 more in the thaw. Still here; the cast drifts and turns them (page cast 11).
  {
    const parts = [new THREE.CylinderGeometry(0.5, 0.52, 0.07, 14), new THREE.TorusGeometry(0.47, 0.035, 4, 14)];
    parts[0].translate(0, 0.0, 0); parts[1].rotateX(Math.PI / 2); parts[1].translate(0, 0.06, 0);
    const top = tinted(parts[0], '#C9CCE0'), rim = tinted(parts[1], C.paper), pan = merge([top, rim]), list = [];
    const tryPan = (s, d) => { if (plan.waterRoom(s, d) < 1.6) return; if (Math.hypot(s - plan.tree.at[0], d) < 9.5) return; const w = plan.pans.across[0] + Math.pow(rnd(), 1.6) * (plan.pans.across[1] - plan.pans.across[0]); if (list.some((o) => Math.hypot(o.position[0] - d, o.position[2] + s) < (o.scale[0] + w) * 0.6)) return; list.push({ position: [d, 0.012, -s], rotation: rnd() * 6.283, scale: [w, 1, w * (0.85 + rnd() * 0.3)] }); };
    let guard = 0;
    while (list.length < plan.pans.road && guard++ < 4000) { const inPond = rnd() < 0.35; if (inPond) { const a = rnd() * 6.283, r = 9 + rnd() * 12; tryPan(plan.tree.at[0] + Math.cos(a) * r, Math.sin(a) * r); } else { const s = 60 + rnd() * 160, d = (rnd() < 0.5 ? -1 : 1) * (2.5 + rnd() * 6.5); if (s > plan.bay.from - 2 && s < plan.bay.to + 2) continue; tryPan(s, d); } }
    guard = 0; while (list.length < plan.pans.road + plan.pans.thaw && guard++ < 2000) tryPan(226 + rnd() * 40, (rnd() * 2 - 1) * 7.5);
    put(pan, M.ice, list, 'standin:pan_A..C (winter)', 'direct');
    count.pans = list.length;
  }

  // ================================================================================================ multitudes of the close band
  {
    const trees = plan.trees.trees, up = (g, y) => { g.translate(0, y, 0); return g; };
    // (cow parsley in winter, with its caps of snow, its rings of ice and its flowers in the water: module `close`, kit_close.js)
    // ---- STAND-IN for the frost flowers (4,000 tufts of 12 triangles, 3 to 6 cm, matte) on the skin ice
    // (a tuft: five thin blades of frost of uneven length fanned from one point, 2 to 5 cm; ten triangles. Not four cones in a ring: from the boat those are little white crowns)
    const tuft = (() => { const pos = []; let q = 23; const r = () => (q = (q * 16807) % 2147483647) / 2147483647; for (let k = 0; k < 5; k++) { const a = k * 1.2566 + r() * 0.6, l = 0.022 + r() * 0.03, lean = 0.25 + r() * 0.5, tip = [Math.cos(a) * l * lean, l, Math.sin(a) * l * lean], w = 0.0045, px = -Math.sin(a) * w, pz = Math.cos(a) * w; pos.push(px, 0, pz, -px, 0, -pz, ...tip, -px, 0, -pz, px, 0, pz, ...tip); } const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals(); return g; })();
    const tufts = [], nf = kit.count(plan.count.frostFlowers);
    let guard = 0;
    while (tufts.length < nf && guard++ < nf * 30) {
      const pond = rnd() < 0.22; let s, d;
      // (only where the realm leaves ice: a metre in from the black road's edge, which is ragged, and out to the shelf)
      if (pond) { const a = rnd() * 6.283, r = plan.pondOpen.r + 1.0 + rnd() * (plan.pond.ice - 1.1); s = plan.tree.at[0] + Math.cos(a) * r; d = Math.sin(a) * r; if (Math.abs(d) < plan.openHalf(s) + 1.0) continue; }
      else { s = 60 + rnd() * 170; const o = plan.openHalf(s), from = o > 0.5 ? o + 1.0 : 0; d = (rnd() < 0.5 ? -1 : 1) * (from + rnd() * Math.max(0, plan.band(s) - 0.2 - from)); if (Math.hypot(s - plan.tree.at[0], d) < plan.pondOpen.r + 1.0) continue; }
      if (plan.waterRoom(s, d) < 0.15) continue;
      tufts.push({ position: [d, 0.0, -s], rotation: rnd() * 6.283, scale: 0.8 + rnd() * 0.9 });
    }
    // They stand only where there is ice NOW: each reads the water's trace where it stands and folds away where the
    // skin has been opened (the black road, a lane the hull has just cut), and comes back as the lane freezes over.
    // (The cast makes them collapse plate by plate, with a tick: page cast 4. Without this they float on open water.)
    const wu = waterUniforms(ctx.engine);
    const onIce = { uniforms: { tTrace: wu.tTrace, uTraceRect: wu.uTraceRect }, vertexPars: 'uniform sampler2D tTrace; uniform vec4 uTraceRect;',
      vertexWorld: `
    #ifdef USE_INSTANCING
      vec3 tuftAt = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
      vec2 tuv = (tuftAt.xz - uTraceRect.xy) / uTraceRect.zw + 0.5;
      float tuftOpen = (tuv.x > 0.0 && tuv.x < 1.0 && tuv.y > 0.0 && tuv.y < 1.0) ? texture2D(tTrace, tuv).a : 0.0;
      wp.xyz = mix(wp.xyz, tuftAt - vec3(0.0, 0.06, 0.0), smoothstep(0.08, 0.24, tuftOpen));
    #endif` };
    put(tuft, shared.paint({ color: C.frost, brush: 0.3, side: THREE.DoubleSide, extend: onIce }), tufts, 'standin:frost flowers (winter)', 'direct');
    // (the apples on the low boughs and the windfalls: module `close`, kit_close.js)
    count.frostFlowers = tufts.length;
  }
  return {};
}
