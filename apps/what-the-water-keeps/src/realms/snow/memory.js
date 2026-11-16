// The orchard in snow: WHAT ONLY THE WATER SHOWS OF THE AVENUE (module `memory`, built after `trees`; the Light
// group's: docs/build/snow/2-light.md, "the lie").
//
// The director: "the blossom in the water must be the flood orchard's real blossom (its sprays and masses, as that
// area now builds them), mirrored crisply, bright against dark water, never a wash over it."
//
//   - THE BLOSSOM of every tree within 40 m of the road (plan.trees: `memory`), and of the two lost trees that stand
//     only in the water, is the flood orchard's own module (src/realms/orchard/kit_blossom.js), built here a second
//     time (heroes.js builds it for the oldest tree): its masses gathered from each tree's own twig ends, its sprays on
//     the twigs, drawn in the water's mirror ONLY, on the wood the Trees group stands (shared.orchard: the same designs,
//     the same matrices). It wears this area's blossom light (light.js, `holds`: it gives its own light, it goes with
//     the thaw, it is snowed out in the birch river) and this area's tones (shared.light.blossom: pink as the water
//     is to show it).
//   - the layout's stand-in puffs (kit_trees.js: 'standin:apple_X lobes (memory)') are taken out here, by name.
//
// That module is another area's and is still being worked on. If it cannot be built here, the stand-in puffs stay
// and the page errors say so.
//
// shared.avenueBlossom (for the cast and the staging) = the flood orchard's `shared.blossom` for these trees:
//   objects, show(on), uniforms, crowns (discs petals are shed from), trees, shake(x, z), front(z), gust(k).
// Developer switches: &blossom=pads keeps the stand-in puffs (to compare); the flood orchard's own (&sprays=, &lobes=0,
//   &cards=0, &clumps=) work here too.
import * as THREE from 'three';

const Q = new URLSearchParams(location.search);

export async function build(ctx, plan, shared) {
  const O = shared.orchard, LT = shared.light, F = shared.frame;
  if (!O || !O.models || !LT) { console.error('INVALID_MODULE snow/memory: the Trees group\'s wood (shared.orchard) is not there to hang blossom on; the stand-in puffs stay'); return null; }
  if (Q.get('blossom') === 'pads') return null;

  const mod = await import('../orchard/kit_blossom.js');
  const holds = LT.holds || {};
  // (that module's light speaks of `ownColour`: the flood orchard's dusk declares it; here this area's `holds` stands in its place)
  const ownLight = { ...holds, albedo: 'vec3 ownColour = albedo;\n' + (holds.albedo || '') };
  const remembered = (list) => list.filter((t) => t.memory);
  // the wood's own stir (kit_trees.js: winter's stillness): the blossom in the water must lie on the wood the water shows
  const stir = O.stir && O.stir.uniforms, blow = stir ? stir.uBlow.value : null, more = stir ? stir.uBlowMore.value : null;
  const sway = blow ? { strength: blow.z, speed: blow.w, from: more.x, to: more.y, dir: [blow.x, blow.y] } : { strength: 0.055, speed: 0.45, from: 3, to: 9.5, dir: [1, 0.3] };
  // ---- THE OUTLIER carries the same blossom (the Outlier group's wood: assets/models/snow/outlier.json gives its twig
  // ends, crown and low bough, in the model's own space; the model stands at F.at(85, 12.5, 0) with no turn). To the
  // flood orchard's module it is two more trees of designs of their own: its crown, and the bough across the road (a
  // garland nine metres long, the blossom the rider sees beside the hull as the boat passes under).
  const extra = new Map(), models = { ...O.models }, outlierTrees = [];
  try {
    const r = await fetch('assets/models/snow/outlier.json');
    if (r.ok) {
      const info = await r.json(), at = F.at(plan.outlier.foot[0], plan.outlier.foot[1], 0), matrix = new THREE.Matrix4().makeTranslation(at.x, at.y, at.z);
      for (const part of ['crown', 'bough']) {
        const pts = (info.ends && info.ends[part]) || [], masses = (info.masses && info.masses[part]) || [];
        if (pts.length < 12) continue;
        // (a twig end's way is not written: it points out of the mass it belongs to, and a little up)
        const ends = [];
        for (const p of pts) {
          let best = null, bd = 1e9;
          for (const m of masses) { const d = Math.hypot(p[0] - m.x, p[1] - m.y, p[2] - m.z); if (d < bd) { bd = d; best = m; } }
          let dx = best ? p[0] - best.x : 0, dy = (best ? p[1] - best.y : 0) + 0.35, dz = best ? p[2] - best.z : 0; const l = Math.hypot(dx, dy, dz) || 1;
          ends.push(p[0], p[1], p[2], dx / l, dy / l, dz / l);
        }
        const name = 'outlier_' + part, t = { x: at.x, z: at.z, s: plan.outlier.foot[0], d: plan.outlier.foot[1], tint: part === 'crown' ? 2 : 0, variant: 0, low: null, memory: true, outlier: part };
        models[name] = { ends, spurs: [] };
        extra.set(t, { t, kind: 'sail', model: name, matrix, tint: '#ffffff', level: 0 });
        outlierTrees.push(t);
      }
    }
  } catch (err) { console.error(`INVALID_MODEL snow/memory: the outlier's numbers (assets/models/snow/outlier.json) could not be read: its stand-in blossom stays (${(err && err.message) || err})`); }

  const theirPlan = {
    trees: { trees: [...remembered(plan.trees.trees), ...outlierTrees], far: remembered(plan.trees.far), motes: [] },
    tree: plan.tree, chip: { white: '#ffffff', apricot: '#000000' }, heading: () => 0,
  };
  const theirs = {
    frame: F, wood: { models, of: (t) => extra.get(t) || O.of(t) }, tree: { bare: true },      // (bare: the oldest tree's blossom is the Monument group's)
    dusk: ownLight, blossomSelf: { value: new THREE.Color(0, 0, 0) }, sway, blossomLayer: 'mirror', hour: 0, counts: {},
  };
  const built = await mod.build(ctx, theirPlan, theirs);
  const blossom = theirs.blossom;
  if (!blossom || !blossom.objects || !blossom.objects.length) throw new Error('the flood orchard\'s blossom built nothing for the avenue');
  for (const o of blossom.objects) o.name = `the avenue in the water: ${o.name} (the flood orchard's blossom; MEMORY)`;

  // ---- its tones are this area's (light.js: `blossom`, as the water is to show them), kept every frame: the flood
  // orchard's own update lays its dusk colours on them
  const U = blossom.uniforms || {};
  // ---- THE MASSES ARE THE FLOOD ORCHARD'S, AS IT DRAWS THEM IN A MIRROR (fifth holder, 8 November 01:40). Until
  // 01:22 this module opened the masses from further off and re-set their form (tone, heaps, hollows, holes, how the
  // sprays thin and grow): all of it against a pink lid, and all of it for that area's earlier way of drawing blossom.
  // The flood orchard's module is in its sixth making now: in a mirror it draws a crown as whole pale masses with soft
  // borders and no chance from dab to dab, exactly because a mirror has a coarser grain. Those overrides, laid on the
  // new way, were a camouflage. They are gone: the form is theirs, the tones and the light are this area's (light.js:
  // `blossom`, `holds`), and what keeps the water from being a lid is the light's own levels (the dusk, the near, the
  // great tree, the depth) and the dusk's mist. The address's switches are that module's own and still work
  // (&tone= &toneo= &heap= &hollow= &nearwear= &nearold= &holes= &lod= ...).
  const open = (u) => {
    if (!u) return;
    // (the flood orchard's blossom takes back half of the ride's lamp light after its own hour's light (its uLampB). Here
    // the light on blossom is this area's alone (`holds`), which has none of the ride's lamp light in it: left on,
    // blossom went DARK round the bow lantern and round the kept lamp)
    if (u.uLampB) u.uLampB.value = 0;
  };
  const tones = () => {
    const B = LT.blossom || {};
    if (U.uDeepB && B.under) U.uDeepB.value.copy(B.under); if (U.uShadeLoB && B.side) U.uShadeLoB.value.copy(B.side); if (U.uShadeHiB && B.top) U.uShadeHiB.value.copy(B.top);
    if (U.uPinkB && B.pink) U.uPinkB.value.copy(B.pink);
    if (stir) for (const k of ['uBlow', 'uBlowMore', 'uFrontB', 'uShakeB', 'uShiverB']) if (U[k] && stir[k]) U[k].value.copy(stir[k].value);
    open(U);
    open(shared.tree && shared.tree.blossom && shared.tree.blossom.uniforms);      // (the oldest tree's blossom is built by heroes.js from the same module: one look for all the blossom the water shows)
  };
  tones();

  // ---- the stand-in puffs go (they are the Trees group's objects: taken out of the picture, not disposed: their
  // material is shared.mat.blossom, which others wear, and kit_trees.js still sorts them every frame, harmlessly)
  let gone = 0;
  const puffs = [];
  ctx.group.traverse((o) => {
    if (!o.name || !o.name.startsWith('standin:')) return;
    if (/lobes \((memory|MEMORY)\)/.test(o.name) || (outlierTrees.length && o.name.startsWith('standin:outlier: blossom'))) puffs.push(o);
  });
  for (const o of puffs) { if (o.parent) o.parent.remove(o); if (o.geometry) o.geometry.dispose(); gone++; }

  shared.avenueBlossom = blossom;
  shared.counts = { ...(shared.counts || {}), avenueBlossom: { ...(theirs.counts && theirs.counts.blossom), standInsRemoved: gone } };
  return { update(dt) { if (built && built.update) built.update(dt); tones(); } };
}
