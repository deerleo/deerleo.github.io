// The standing sky: THE TOOLS (stage 2, the kit and the close band; one of six groups: docs/build/sky/2-kit-tools.md).
// The salt worker's gear, left where the work stopped, and three things the lake has kept under its surface.
//
//   under the surface (s 60 to 118, in the bow lantern's pool):
//     the drowned plank walk (plank_walk)   34 m of low plank spans on trestles from (s 60, d -14) to (s 84, d +10): the
//                                           hull passes over it at s 74
//     the barrow wheel (wheel_drowned)      half in the sand at s 104, d +9
//     the lost rake (rake_lost)             on its back at s 118, d -12, a comb of crusted teeth just under the mirror
//   on the causeway tops (seen from the boat against the bank at 2 to 4 m):
//     s 168 right   a rake leaning in the Works group's cone, a shovel stuck in its cut
//     s 190 left    the plank run along the trodden path (six planks on odd blocks), a flat barrow standing on it with
//                   a full basket on its bed, three baskets stacked
//     s 214 right   the yoke laid across its two pails, a rake laid down with its teeth up
//   elsewhere (the model list's other tools): the second barrow with a shovel across it and four baskets at the foot of
//     the barrow run; a shovel on the tipping stage; a shovel in the hut's ladder and a rake against one of its legs; a
//     rake left standing in the crust of the left flats.
//
// Every model is made by script in Blender (source-art/models/sky/tl_*.py -> assets/models/sky/*.glb) and painted in
// DAYLIGHT colours; the area's light (shared.sky: light.js) makes the night of them.
//
// HOW THEY ARE DRAWN. Nothing here moves, and there are thirty-odd pieces of sixteen kinds, so they are not sixteen
// instanced draws: every placed piece is written, in its place, into ONE mesh per rule of the night air (BATCHES,
// below): 'near' for what stands on the causeways and the flats' crust, 'far' for what stands by the hut and on the
// ridge (it must be a ghost while they are), one for the drowned timber, one for the shade under it, one for the sand
// that lies on it and one for the little crust that stands out of the water over it. Six draws for all of it; by
// starlight the night air leaves the first two undrawn until the boat is within its reach (light.js, cullAir), and the
// drowned three are drawn only while the boat is near them (plan.tools.drowned.seen). A piece's tint, turn, lean and
// scale are its own. To move a piece change its numbers in plan.tools.
//
// THIN THINGS. The models mark their thin parts (poles, teeth, spokes, ropes) with u = 1 in their UVs. Within
// plan.tools.crisp[0] metres they are painted like everything else; beyond crisp[1] they keep out of the painter's
// filter, so that a rake 23 m off, from mid-channel, is still a rake. (Written before the night air's last word, as
// light.js asks: a thing whose air is closed is blended and cannot carry the mark.)
//
// UNDER THE SURFACE the same u is how much SAND lies on a place: the bed's own paint (shared.sky.BED_PAINT_GLSL) is drawn
// there, and the drifts of sand over the drowned things are veils of it, thinning to nothing at their rims, so they
// have no edge on the bed. The drowned timber is drawn BEFORE the bed (which writes no depth), so the bed covers what
// has sunk into it. All of it is in the direct view only and takes the bed's light: seen where a lamp lights it.
//
// What this module puts in `shared`: shared.tools = { walk: { from, to, ends }, wheel, rake, barrow, yoke, triangles }
// (places in the realm's own metres, for the cast and staging).
// Stand-ins this module takes out (they live in the Works group's kit.js; their lines can be deleted there): every
// rake and rake head, every shovel, both flat barrows, the barrow wheel, the plank run, the baskets, the yoke, the two
// pails, the drowned plank walk and its trestles.
import * as THREE from 'three';
import { removeStandIn } from '../../engine/modules.js';
import { smooth, lerp } from './plan.js';

const RAKE_LENGTH = { rake_a: 2.2, rake_b: 2.12, rake_c: 2.2 };      // grip end to the top of the head (tl_rake.py)
const SHOVEL_LENGTH = 1.3;
const BASKET = { nest: 0.085, rest: 0.161, tip: 76.8 * Math.PI / 180 };      // one nests in another this much higher; lying on its side its axis is this far up, tipped this far (tl_basket.py)
const BARROW = { legs: -0.33, wheel: 0.55, bed: (y) => 0.283 + (y + 0.67) * 0.118 + 0.0535, slope: Math.atan(0.118) };      // in the model's own metres (tl_barrow.py): the legs' line, the wheel, the bed's top at Blender y, its slope

export async function build(ctx, plan, shared) {
  const { kit } = ctx, P = plan, sky = shared.sky, T = P.tools, Wk = P.works || {}, M = 'models/sky/';
  const rnd = ctx.rng(4107);
  const UP = new THREE.Vector3(0, 1, 0);
  const at = (s, d, y = 0) => sky.at(s, d, y);
  /** A level direction of the route ([along, to the right]) at a place, in the realm's own metres. */
  const dirAt = (s, d, v) => at(s + v[0], d + v[1]).sub(at(s, d)).normalize();
  const turned = (v, deg) => v.clone().applyAxisAngle(UP, deg * Math.PI / 180);

  // ---------------------------------------------------------------------------------------------- the models' geometry
  // (the engine's loader, asked for no copies: it fetches and parses the file once and hands back its geometry by slot)
  const files = {}, missing = [];
  const load = async (name) => {
    if (name in files) return files[name];
    try {
      const m = await kit.models(M + name + '.glb', [], {}), out = {};
      for (const mesh of m.meshes) { out[mesh.name.split(':').pop()] = mesh.geometry; if (mesh.material && mesh.material.dispose) mesh.material.dispose(); }
      if (m.group.parent) m.group.parent.remove(m.group);
      files[name] = out;
    } catch (err) {
      console.error(`INVALID_MODEL sky/kit_tools: ${name}.glb did not load and is left out (${(err && err.message) || err})`);
      missing.push(name); files[name] = null;
    }
    return files[name];
  };

  // ---------------------------------------------------------------------------------------------- BATCHES
  const batch = () => ({ pos: [], nor: [], col: [], uv: [], idx: [], n: 0, triangles: 0, pieces: 0 });
  const _v = new THREE.Vector3(), _nm = new THREE.Matrix3(), _c = new THREE.Color();
  /** Write one piece into a batch: its geometry carried by `m`, its paint multiplied by `tint`. */
  const write = (b, geo, m, tint) => {
    if (!geo) return false;
    const p = geo.attributes.position, nr = geo.attributes.normal, cl = geo.attributes.color, uv = geo.attributes.uv, base = b.n;
    _nm.getNormalMatrix(m); _c.set(tint || '#ffffff');
    for (let i = 0; i < p.count; i++) {
      _v.fromBufferAttribute(p, i).applyMatrix4(m); b.pos.push(_v.x, _v.y, _v.z);
      _v.fromBufferAttribute(nr, i).applyMatrix3(_nm).normalize(); b.nor.push(_v.x, _v.y, _v.z);
      if (cl) b.col.push(cl.getX(i) * _c.r, cl.getY(i) * _c.g, cl.getZ(i) * _c.b); else b.col.push(_c.r, _c.g, _c.b);
      b.uv.push(uv ? uv.getX(i) : 0, uv ? uv.getY(i) : 0);
    }
    const ix = geo.index, count = ix ? ix.count : p.count;
    for (let i = 0; i < count; i++) b.idx.push(base + (ix ? ix.getX(i) : i));
    b.n += p.count; b.triangles += count / 3; b.pieces++;
    return true;
  };
  const place = async (b, name, m, tint) => { const f = await load(name); return f ? write(b, f.paint, m, tint) : false; };
  const meshOf = (b, material, name, zeros = []) => {
    if (!b.n) return null;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(b.pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(b.nor, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(b.col, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(b.uv, 2));
    for (const k of zeros) g.setAttribute(k, new THREE.Float32BufferAttribute(new Float32Array(b.n), 1));      // (an attribute somebody else's material asks for: the bed's aEdge)
    g.setIndex(b.n > 65535 ? new THREE.Uint32BufferAttribute(b.idx, 1) : new THREE.Uint16BufferAttribute(b.idx, 1));
    g.computeBoundingBox(); g.computeBoundingSphere();
    const mesh = new THREE.Mesh(g, material); mesh.name = name;
    ctx.add(mesh);
    return mesh;
  };

  // ---------------------------------------------------------------------------------------------- how a piece is put down
  const X = new THREE.Vector3(), Y = new THREE.Vector3(), Z = new THREE.Vector3();
  const mul = (m, ...more) => { for (const q of more) m.multiply(q); return m; };
  const RX = (a) => new THREE.Matrix4().makeRotationX(a), RY = (a) => new THREE.Matrix4().makeRotationY(a), RZ = (a) => new THREE.Matrix4().makeRotationZ(a);
  const TR = (x, y, z) => new THREE.Matrix4().makeTranslation(x, y, z), SC = (k) => new THREE.Matrix4().makeScale(k, k, k);
  /** A thing that stands: its placing point at p, its front (the model's +Z: Blender's -Y) toward the level direction `front`. */
  const stand = (p, front) => { Z.copy(front).setY(0).normalize(); Y.copy(UP); X.crossVectors(Y, Z); return new THREE.Matrix4().makeBasis(X, Y, Z).setPosition(p); };
  /** A long tool held by two points: its own +Y (Blender's +Z: the pole) from a to b, its +Z (teeth, the blade's hollow) turned as near `toward` as that allows. */
  const held = (a, b, toward) => { Y.subVectors(b, a).normalize(); Z.copy(toward).addScaledVector(Y, -toward.dot(Y)).normalize(); X.crossVectors(Y, Z); return new THREE.Matrix4().makeBasis(X, Y, Z).setPosition(a); };
  /** A thing that lies along a line: its own +X along `xdir` (which may slope), its +Y as near up as that allows. */
  const laid = (p, xdir) => { X.copy(xdir).normalize(); Y.copy(UP).addScaledVector(X, -UP.dot(X)).normalize(); Z.crossVectors(X, Y); return new THREE.Matrix4().makeBasis(X, Y, Z).setPosition(p); };
  /** A point given in a model's Blender metres (x, y, z), carried by the model's matrix. */
  const inModel = (m, b) => new THREE.Vector3(b[0], b[2], -b[1]).applyMatrix4(m);

  const near = batch(), far = batch(), under = batch(), drift = batch(), dark = batch(), crust = batch();
  const made = {};                                              // which kinds stand (their stand-ins go only then)
  // THE CAUSEWAY'S TOP (the Works group's causeway.py): 0.30 m, a trodden hollow of 2 to 3 cm along the path's middle, and
  // the whole of it wandering by a finger. bankY(d) is 1.6 cm under its mean there, so that nothing set down on it has air
  // under it anywhere (things sit a little way into the wet salt); topY is the path's middle.
  const walkD = Wk.walk ? Wk.walk.d : 22.7;
  const bankY = (d) => P.causeway.top - 0.024 * Math.exp(-(((Math.abs(d) - walkD) / 0.42) ** 2)) - 0.016;
  const topY = bankY(walkD);
  /** How high the ground stands at the route's (s, d): the ridge's crust skirt (the Monument group's), the flats' crust (the Shallows group's), or `otherwise`. */
  const ground = (s, d, otherwise) => {
    const r = shared.ridge && shared.ridge.heightAt ? shared.ridge.heightAt(s, d) : -1;
    if (r > -0.5) return r;
    const f = shared.flats && shared.flats.heightAtRoute ? shared.flats.heightAtRoute(s, d) : null;
    return f === null || f === undefined ? otherwise : f;
  };
  const TINTS = ['#ffffff', '#f2eff5', '#fbf6ee', '#ebe8f0', '#f6f1ea', '#eeeaf2'];
  const tint = () => TINTS[Math.floor(rnd() * TINTS.length)];

  /** Baskets nested in a stack on the ground at (s, d, y): each a little off true. */
  const stack = async (b, s, d, y, names) => {
    let ok = false;
    for (let k = 0; k < names.length; k++) {
      const m = mul(stand(at(s + (rnd() - 0.5) * 0.02 * k, d + (rnd() - 0.5) * 0.02 * k, y + k * BASKET.nest), turned(dirAt(s, d, [1, 0]), rnd() * 360)), RX((rnd() - 0.5) * 0.07 * Math.min(k, 1)), RZ((rnd() - 0.5) * 0.07 * Math.min(k, 1)));
      ok = (await place(b, names[k], m, TINTS[(k * 2 + names.length) % TINTS.length])) || ok;
    }
    return ok;
  };

  // ---------------------------------------------------------------------------------------------- the drowned things
  // (the first made things the rider sees after the empty first image: under the hull, in the lantern's pool)
  const walk = { from: at(P.plankWalk.from[0], P.plankWalk.from[1]), to: at(P.plankWalk.to[0], P.plankWalk.to[1]), ends: [], stakes: [] };
  let wheelAt = null, rakeAt = null;
  {
    // a drowned model's four slots (tl_drowned.py): its timber, the sand drifted over it, the shade under it, and the
    // little of it that stands out of the water (drawn as the things of the causeways are, in the mirror too, but as a mesh
    // of its own: with it in their mesh the night air could never leave the causeways' things undrawn in the first act)
    const D = T.drowned, sunk = async (name, m) => { const f = await load(name); if (!f) return false; write(under, f.paint, m); if (f.silt) write(drift, f.silt, m); if (f.shade) write(dark, f.shade, m); if (f.dry) write(crust, f.dry, m); return true; };
    // the walk: its +X from the (s 60, d -14) end to the (s 84, d +10) end; with that its -Y edges look up the current
    const mid = walk.from.clone().add(walk.to).multiplyScalar(0.5), along = walk.to.clone().sub(walk.from).normalize(), mw = laid(mid, along);
    made.walk = await sunk('plank_walk', mw);
    // where its planks' ends and its crusted stake heads lie under the surface: the model says (plank_walk.json), for the rings and for the cast
    if (made.walk) {
      try {
        const info = await fetch('assets/models/sky/plank_walk.json').then((r) => r.json());
        for (const e of info.ends || []) walk.ends.push(inModel(mw, e));
        for (const h of info.stakes || []) walk.stakes.push(inModel(mw, h));
      } catch (err) { console.error(`INVALID_MODEL sky/kit_tools: plank_walk.json did not come (${(err && err.message) || err}): the planks lift no rings`); }
    }
    const w = P.drowned.wheel, r = P.drowned.rake;
    wheelAt = at(w[0], w[1]); rakeAt = at(r[0], r[1]);
    made.wheel = await sunk('wheel_drowned', laid(wheelAt, dirAt(w[0], w[1], D.wheelHigh)));
    made.lostRake = await sunk('rake_lost', laid(rakeAt, dirAt(r[0], r[1], D.rakeHead)));
    // the wheel's high rim stands a finger out of the water: shallows, not a wall (the hull slows over it and is eased off)
    if (made.wheel && D.wheelSoft) ctx.addCollider({ x: wheelAt.x, z: wheelAt.z, r: D.wheelSoft[0], soft: D.wheelSoft[1] });
  }

  // ---------------------------------------------------------------------------------------------- group 1: the heap at s 168, right
  // A rake leaning in the Works group's heap and a shovel stuck in the foot of its shovelled bay. The heap is theirs and
  // was remade once under these two (the shovel was left hanging in the air beside a bay that had moved), so nothing here
  // is a number copied from it: the heap's own file is stood where their module stood it (shared.cones.near: its foot,
  // its turn; plan.works.toolCone if that is not there) and FELT with rays: where its foot is, where a rake of this
  // length with its grip end on the path comes to rest on the flank, where the bay's wall stands.
  const DOWNWARD = new THREE.Vector3(0, -1, 0), _o = new THREE.Vector3();
  let toolHeap = null;                                           // (what the rays found: published in shared.tools.heap, for whoever wants to check it)
  /** A model's surface as it stands under the matrix m: hit(from, direction) -> { point, normal } or null; top(x, z) -> its height there (-Infinity off it). */
  const feel = async (name, m) => {
    const f = await load(name); if (!f || !f.paint) return null;
    const mesh = new THREE.Mesh(f.paint, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide })), rc = new THREE.Raycaster(), nm = new THREE.Matrix3().getNormalMatrix(m);
    mesh.matrixAutoUpdate = false; mesh.matrix.copy(m); mesh.matrixWorld.copy(m);
    const first = (from, dir) => { rc.set(from, dir); const h = rc.intersectObject(mesh, false); return h.length ? h[0] : null; };
    return {
      hit(from, dir) { const h = first(from, dir); return h ? { point: h.point.clone(), normal: h.face.normal.clone().applyMatrix3(nm).normalize() } : null; },
      top(x, z) { const h = first(_o.set(x, 60, z), DOWNWARD); return h ? h.point.y : -Infinity; },
    };
  };
  if (Wk.toolCone) {
    const K = Wk.toolCone, S = T.cone, side = K.side;
    const stood = ((shared.cones || {}).near || []).find((c) => c.variant === 'c' && Math.abs(c.s - K.s) < 0.05 && Math.sign(c.d) === side);
    let axis, turn;
    if (stood) { axis = new THREE.Vector3(stood.bx, 0, stood.bz); turn = stood.turn; }
    else { axis = at(K.s, side * K.d, 0); const fw = dirAt(K.s, side * K.d, [K.cut.toward[0], side * K.cut.toward[1]]); turn = Math.atan2(fw.x, fw.z); }
    const loc = ctx.path.locate(axis.x, axis.z, null, {}), d = loc.d, heap = await feel('cone_c', mul(TR(axis.x, 0, axis.z), RY(turn)));
    const round = (v) => dirAt(K.s, d, [v[0], side * v[1]]);
    if (heap) {
      {
        // the rake: its grip end on the path a little beyond the heap's foot, its head come to rest on the flank, its teeth in the salt
        const u = round(S.rake.round), L = RAKE_LENGTH[S.rake.model] - 0.023;
        let foot = 0.6; while (foot < 4 && heap.top(axis.x + u.x * foot, axis.z + u.z * foot) > bankY(d + side * S.rake.round[1] * foot) + 0.04) foot += 0.04;      // where the heap ends on that line
        const R0 = foot + S.rake.out, grip = axis.clone().addScaledVector(u, R0).setY(bankY(d + side * S.rake.round[1] * R0) + 0.012);
        const tipAt = (deg) => grip.clone().addScaledVector(u, -Math.cos(deg * Math.PI / 180) * L).addScaledVector(UP, Math.sin(deg * Math.PI / 180) * L);
        const inside = (deg) => { const p = tipAt(deg); return heap.top(p.x, p.z) > p.y; };
        let lo = 12, hi = 86;                                       // leaned further and further over until its head lies on the salt
        if (inside(lo) && !inside(hi)) for (let i = 0; i < 30; i++) { const mid = (lo + hi) / 2; if (inside(mid)) lo = mid; else hi = mid; }
        else hi = 52;
        // (the pole's end is held a little clear of the salt: the head beam is 4 cm thick and its teeth, 12 cm long, are what goes in)
        const lie = tipAt(hi), on = heap.hit(_o.set(lie.x, 60, lie.z), DOWNWARD), head = on ? on.point.clone().addScaledVector(on.normal, S.rake.clear) : lie;
        made.rake = (await place(near, S.rake.model, held(grip, head, u.clone().negate()), '#ffffff')) || made.rake;
        toolHeap = { axis, turn, foot, rake: { grip, head, degrees: hi } };
      }
      {
        // the shovel: its blade pushed into the foot of the bay's wall where the digging stopped, its shaft standing out and up
        const w = round(S.shovel.round), rise = S.shovel.rise * Math.PI / 180, y = bankY(d) + S.shovel.height;
        const h = heap.hit(axis.clone().addScaledVector(w, 6).setY(y), w.clone().negate());
        if (h) {
          const shaft = w.clone().multiplyScalar(Math.cos(rise)).addScaledVector(UP, Math.sin(rise)), tip = h.point.clone().addScaledVector(shaft, -S.shovel.into);
          made.shovel = (await place(near, S.shovel.model, held(tip, tip.clone().addScaledVector(shaft, SHOVEL_LENGTH), UP), '#fbf6ee')) || made.shovel;
          if (toolHeap) toolHeap.shovel = { tip, wall: h.point, normal: h.normal, fromAxis: Math.hypot(h.point.x - axis.x, h.point.z - axis.z) };
        }
      }
    }
  }

  // ---------------------------------------------------------------------------------------------- group 2: the plank run at s 190, left
  let barrowAt = null;
  {
    const R = T.run, side = -1, line = side * ((Wk.walk ? Wk.walk.d : 22.7) + R.off), ys = [];
    for (let i = 0; i < R.planks.length; i++) {
      const [name, flip, off, yaw, tn] = R.planks[i], s = R.from + R.pitch * (i + 0.5), d = line + off, y = bankY(d) + 0.004 * ((i * 7) % 3);
      const xdir = turned(dirAt(s, d, [flip ? -1 : 1, 0]), yaw);
      made.planks = (await place(near, name, laid(at(s, d, y), xdir), tn)) || made.planks;
      ys.push({ d, y });
    }
    // the barrow: its wheel on a plank's top, its legs either side of the plank on the path, so it is pitched back a little
    const Bw = R.barrow, i = Math.min(R.planks.length - 1, Math.max(0, Math.floor((Bw.s + BARROW.wheel - R.from) / R.pitch))), rest = ys[i] || { d: line, y: topY };
    const legsY = bankY(rest.d + 0.31) + 0.004, front = turned(dirAt(Bw.s, rest.d, [1, 0]), Bw.yaw), lift = rest.y + 0.13 - legsY, pitch = Math.atan(lift / (BARROW.wheel - BARROW.legs));
    const mb = mul(stand(at(Bw.s, rest.d, legsY), front), TR(0, 0, BARROW.legs), RX(-pitch), TR(0, 0, -BARROW.legs));
    made.barrow = (await place(near, Bw.model, mb, '#ffffff')) || made.barrow;
    barrowAt = at(Bw.s, rest.d, topY);
    if (Bw.load) made.baskets = (await place(near, Bw.load, mul(mb.clone(), TR(0.01, BARROW.bed(0.16), -0.16), RX(BARROW.slope), RY(2.2), SC(0.93)), '#f6f1ea')) || made.baskets;
    made.baskets = (await stack(near, R.stack.at[0], R.stack.at[1], bankY(R.stack.at[1]), R.stack.of)) || made.baskets;
  }

  // ---------------------------------------------------------------------------------------------- group 3: the yoke at s 214, right
  let yokeAt = null;
  {
    const Yk = T.yoke, [s, d] = Yk.at, front = dirAt(s, d, [Yk.along[1], -Yk.along[0]]);      // its bails and the neck's cut-out toward the channel
    made.yoke = await place(near, 'yoke', stand(at(s, d, bankY(d) + 0.004), front), '#ffffff');
    yokeAt = at(s, d, topY);
    if (Yk.print) {                                               // where the heap that was carted away stood (tl_print.py): its print on the bank's top
      const [ps, pd] = Yk.print.at;
      await place(near, 'heap_print', stand(at(ps, pd, bankY(pd) + Yk.print.above), dirAt(ps, pd, [0, -Math.sign(pd)])), Yk.print.tint || '#ffffff');
    }
    const Rk = Yk.rake;                                           // the rake laid down beside it, on its back
    made.rake = (await place(near, Rk.model, held(at(Rk.grip[0], Rk.grip[1], bankY(Rk.grip[1]) + 0.03), at(Rk.head[0], Rk.head[1], bankY(Rk.head[1]) + 0.036), UP), '#f2eff5')) || made.rake;
  }

  // ---------------------------------------------------------------------------------------------- elsewhere
  {
    // on the crust of the left flats: a rake left standing, its grip end pushed in (the Shallows group's crust: shared.flats)
    const F = T.flatsRake, flats = shared.flats;
    let [s, d] = F.at, h = flats ? flats.heightAtRoute(s, d) : 0.03;
    for (let k = 0; flats && (h === null || h < 0.015) && k < 16; k++) { d -= 0.5; h = flats.heightAtRoute(s, d); }      // (if the place is a pool, the nearest crust toward the ridge)
    if (h === null || h === undefined) h = 0.03;
    const deg = F.degrees * Math.PI / 180, lean = dirAt(s, d, F.lean).multiplyScalar(Math.sin(deg)).addScaledVector(UP, Math.cos(deg));
    const grip = at(s, d, h - F.sunk), head = grip.clone().addScaledVector(lean, RAKE_LENGTH[F.model]);
    made.rake = (await place(near, F.model, held(grip, head, dirAt(s, d, F.teeth || [-0.5, 0.86])), '#ebe8f0')) || made.rake;
    const collar = await load('collar_b');                         // (the Shallows group's crust collar, small, round its foot)
    if (collar && collar.paint) write(near, collar.paint, mul(stand(at(s, d, h - 0.012), dirAt(s, d, [0.3, 1])), SC(0.36)), '#ffffff');
  }
  {
    // at the foot of the barrow run, on the ridge's crust skirt (three tiers, a hand apart: shared.ridge.heightAt): the second
    // barrow parked on the top tier, a shovel across it, four baskets on the tier below
    const F = T.foot, B = F.barrow, front = dirAt(B.at[0], B.at[1], B.front);
    // (it stands where its legs and its wheel find the ground: pitched if they stand on different tiers)
    const legsAt = [B.at[0] + B.front[0] * BARROW.legs, B.at[1] + B.front[1] * BARROW.legs], wheelAt = [B.at[0] + B.front[0] * BARROW.wheel, B.at[1] + B.front[1] * BARROW.wheel];
    const hL = ground(legsAt[0], legsAt[1], F.y), hW = ground(wheelAt[0], wheelAt[1], F.y), pitch = Math.atan((hW - hL) / (BARROW.wheel - BARROW.legs));
    const mb = mul(stand(at(B.at[0], B.at[1], hL - 0.004), front), TR(0, 0, BARROW.legs), RX(-pitch), TR(0, 0, -BARROW.legs));
    made.barrow = (await place(far, B.model, mb, '#f2eff5')) || made.barrow;
    // the shovel lies from the bed's last slat to over the headboard, its blade out over the wheel (in the barrow's Blender metres)
    made.shovel = (await place(far, 'shovel_b', held(inModel(mb, [0.274, -0.75, 0.636]), inModel(mb, [-0.2, 0.45, 0.488]), UP), '#ffffff')) || made.shovel;
    const FB = F.baskets || { full: 'basket_c', empty: 'basket_a' };      // (the light far form: tl_basket.py, far_basket)
    made.baskets = (await place(far, FB.full, mul(stand(at(F.full[0], F.full[1], ground(F.full[0], F.full[1], F.y) - 0.004), dirAt(F.full[0], F.full[1], [0.4, 1])), SC(0.97)), '#fbf6ee')) || made.baskets;
    made.baskets = (await stack(far, F.stack.at[0], F.stack.at[1], ground(F.stack.at[0], F.stack.at[1], F.y) - 0.004, F.stack.of)) || made.baskets;
    const fa = F.fallen;                                           // one on its side: it rests along its wall
    made.baskets = (await place(far, FB.empty, mul(stand(at(fa.at[0], fa.at[1], ground(fa.at[0], fa.at[1], F.y) + BASKET.rest), dirAt(fa.at[0], fa.at[1], fa.toward)), RX(BASKET.tip), RY(1.1)), '#ebe8f0')) || made.baskets;
  }
  {
    // on the tipping stage's deck (the Timber group's: plan.timber.stage), its grip over the edge
    const S = T.stageShovel, deck = ((P.timber || {}).stage || {}).deck ?? 34.2;
    made.shovel = (await place(far, S.model, held(at(S.blade[0], S.blade[1], deck + S.above), at(S.grip[0], S.grip[1], deck + S.above + 0.012), UP), '#f6f1ea')) || made.shovel;
  }
  if (shared.hut && shared.hut.model && shared.hut.model.group) {
    // by the warden's hut (the Timber group's model, in its own Blender metres): a shovel in the ladder, a rake against a leg
    const g = shared.hut.model.group, H = T.hut; g.updateMatrixWorld(true);
    const toRealm = (b) => ctx.group.worldToLocal(new THREE.Vector3(b[0], b[2], -b[1]).applyMatrix4(g.matrixWorld));
    const hub = toRealm([0, 0, 0]);
    const tip = toRealm(H.shovel.tip), grip = toRealm(H.shovel.grip);
    made.shovel = (await place(far, H.shovel.model, held(tip, grip, UP), '#ebe8f0')) || made.shovel;
    const rg = toRealm(H.rake.grip), rh = toRealm(H.rake.head);
    made.rake = (await place(far, H.rake.model, held(rg, rh, rg.clone().sub(hub).setY(0.4).normalize()), '#e9e5ee')) || made.rake;
  }

  // ---------------------------------------------------------------------------------------------- spilt salt
  // Where salt was handled some of it stayed (tl_clod.py): it is what sits the baskets, the pails and the barrows down.
  if (T.spilt) {
    for (const [name, s, d, deg, k] of T.spilt.near || []) await place(near, name, mul(stand(at(s, d, bankY(d) + 0.014), turned(dirAt(s, d, [1, 0]), deg)), SC(k)), '#ffffff');
    for (const [name, s, d, deg, k] of T.spilt.far || []) await place(far, name, mul(stand(at(s, d, ground(s, d, T.foot.y) - 0.004), turned(dirAt(s, d, [1, 0]), deg)), SC(k)), '#ffffff');
  }

  // ---------------------------------------------------------------------------------------------- the four draws
  // thin parts keep out of the painter's filter beyond a few metres (written before the air's last word: light.js)
  const open = sky.air && sky.air.near && sky.air.near.value.isVector4 ? 'uAir.z' : '1.0';
  const thin = { final: `gl_FragColor.a = mix(gl_FragColor.a, -15.0, step(0.5, vUv0.x) * ${open} * smoothstep(${T.crisp[0].toFixed(1)}, ${T.crisp[1].toFixed(1)}, dist));` };
  const dry = (air, more = []) => kit.gouache({ vertexColors: true, brush: 0.8, extend: [thin, ...sky.extend({ air, timber: { grain: 0.3, bloom: 0.22 }, salt: { kind: 'crust', glints: 0.4 } }), ...more] });
  // The crust that stands out of the water (the wheel's rim, the lost rake's tooth tips) lies a boat's length from the bow
  // lantern, and white crust there was salmon pink: it takes the lantern's light by the square of the distance, as the
  // Shallows group's collars on the stakes do, by their number (plan.kitShallows.lantern; kit_shallows.js, lanternFall).
  const KL = (P.kitShallows || {}).lantern ?? 2.2;
  const lanternFall = { light: `{ vec3 kL = uLanternPos - vWPos; c += albedo * pointLight(uLanternPos, uLanternColor, uLanternRadius, N) * (min(${KL.toFixed(2)} / (1.0 + dot(kL, kL)), 1.0) - 1.0); }` };
  const meshes = {}, mats = { near: dry('near'), far: dry('far'), crust: dry('near', [lanternFall]) };
  for (const [key, name, b, air] of [['near', 'tools: on the causeways and the flats', near, 'near'], ['far', 'tools: by the hut and the ridge', far, 'far'], ['crust', 'tools: crust that stands out of the water', crust, 'near']]) {
    const m = meshes[key] = meshOf(b, mats[key], name);
    if (m) sky.adopt(m, { air });
    if (m && key === 'far') ctx.only(m, 'direct');              // (small things 40 m and more from the channel: their reflections are not worth a third drawing)
  }
  for (const k of ['far', 'crust']) if (!meshes[k]) mats[k].dispose();
  // UNDER THE SURFACE. The timber takes the bed's light (light.js, bed: true, and the bed's own share of a lamp's light)
  // and is drawn BEFORE the bed, which writes no depth: the bed then covers whatever has sunk into it. It is dark, wet
  // wood: what shows of it is its shape against the pale sand, the stars' twins lying in that shape, its worn edges and
  // its grain. The planks, stakes and bearers carry, in their UVs' v, how far across its own grain each place lies: the
  // grain is drawn along each piece from that, however the piece lies, with the ride's dry-brush tile. u is silt lying
  // on a piece: painted in the model, tinted here to the bed's own sand of the hour.
  const uBedLamp = { value: P.light.bed.lantern };
  const bedLamp = { uniforms: { uToolBedLamp: uBedLamp }, fragmentPars: 'uniform float uToolBedLamp;', light: 'c += albedo * lamps * uToolBedLamp;' };
  const bedMesh = ctx.group.getObjectByName('lake bed'), bedOrder = bedMesh ? bedMesh.renderOrder : -6;
  const wdir = walk.to.clone().sub(walk.from).normalize(), D = T.drowned;
  // (the silt on a piece is the bed's own sand: the bed's colour of the hour, the very uniform, and its painted ripple marks by place)
  const bedSand = bedMesh && bedMesh.material && bedMesh.material.uniforms && bedMesh.material.uniforms.uColor ? bedMesh.material.uniforms.uColor.value : new THREE.Color(P.lakeBed.nightSand);
  const likeSand = sky.BED_PAINT_GLSL && sky.bedUniforms;
  const grain = { uniforms: { uToolAlong: { value: new THREE.Vector2(wdir.x, wdir.z) }, uToolSilt: { value: bedSand }, uToolWood: { value: new THREE.Vector4(...D.grain, D.silt) }, ...(likeSand ? sky.bedUniforms : {}) },
    fragmentPars: `uniform vec2 uToolAlong; uniform vec3 uToolSilt; uniform vec4 uToolWood; ${likeSand ? sky.BED_PAINT_GLSL : 'vec3 bedColour(float h, float e) { return vec3(1.0); } float bedPaint(vec2 w, float e) { return 0.5; }'}`,
    albedo: /* glsl */`{ float gv = vUv0.y, ga = dot(vWPos.xz, uToolAlong);
      float w1 = texture2D(tBrush, vec2(ga * 0.31, gv * 2.3)).r - 0.355, w2 = texture2D(tBrush, vec2(ga * 0.83 + 0.37, gv * 6.1 + 0.21)).r - 0.355;      // (the tile, as the shader reads it, runs 0.30 to 0.41)
      // silt lies where the model says, with a ragged edge of its own: the lake's sand, pale on the dark wood
      float sandy = smoothstep(0.2, 0.6, clamp(vUv0.x, 0.0, 1.0) + 2.2 * texture2D(tBrush, vWPos.xz * 1.7).r - 0.78), isT = step(0.02, gv) * (1.0 - sandy);
      float ph = gv * 210.0 + w1 * 110.0 + 3.0 * sin(ga * 2.3 + gv * 17.0);     // ridges a thumb apart, wandering along the piece
      float ridge = sin(ph) * (1.0 - smoothstep(0.5, 1.5, fwidth(ph)));         // (gone as soon as they are finer than the picture can draw)
      albedo *= 1.0 + isT * (uToolWood.x * ridge + uToolWood.y * w1 - uToolWood.z * smoothstep(0.02, 0.045, w2));      // ridges, long streaks, a few open checks
      albedo = mix(albedo, uToolSilt * bedColour(bedPaint(vWPos.xz, 0.0), 0.0) * uToolWood.w, sandy);${new URLSearchParams(typeof location !== 'undefined' ? location.search : '').get('tools') === 'silt' ? ' albedo = mix(albedo, vec3(1.0, 0.1, 0.1), sandy);' : ''} }` };
  const sunkMesh = meshes.under = meshOf(under, kit.gouache({ vertexColors: true, brush: 0.5, extend: [...sky.extend({ bed: true }), bedLamp, grain] }), 'tools: drowned timber');
  if (sunkMesh) { sunkMesh.renderOrder = bedOrder - 1; ctx.only(sunkMesh, 'direct'); }      // (before the bed, which writes no depth: the bed then covers what lies under it)
  if (sunkMesh && new URLSearchParams(typeof location !== 'undefined' ? location.search : '').get('tools') === 'notimber') sunkMesh.visible = false;
  // THE SHADE under what stands clear of the bed, and THE DRIFTS of sand over the drowned things, are both THE BED
  // ITSELF, drawn again: nothing blended is laid on the sand (a blended sheet under the water, dark or pale, came out as
  // a pale smooth band: the first version's veils). `likeBed` is the bed's own paint and light (set.js), sharing its
  // uniforms hour by hour; the shade multiplies it by a darkness painted on the sheet's points, nothing at its rim.
  const likeBed = (opts = {}) => {
    const bm = bedMesh && bedMesh.material, own = bm && bm.uniforms && bm.uniforms.uBedLamp ? bm.uniforms.uBedLamp : uBedLamp;
    if (!sky.BED_PAINT_GLSL || !sky.bedUniforms) return null;
    const m = kit.gouache({ color: P.lakeBed.nightSand, brush: 0.35, extend: [...sky.extend({ bed: true }),
      { uniforms: { uBedLamp: own, ...sky.bedUniforms, ...(opts.uniforms || {}) }, fragmentPars: `uniform float uBedLamp; ${opts.pars || ''} ${sky.BED_PAINT_GLSL}`, albedo: `albedo *= bedColour(bedPaint(vWPos.xz, 0.0), 0.0);${opts.tint || ''}`, light: 'c += albedo * lamps * uBedLamp;' }] });
    if (bm && bm.uniforms && bm.uniforms.uColor) m.uniforms.uColor = bm.uniforms.uColor;      // (the sand's colour of the hour: set.js keeps it)
    m.depthWrite = false;
    return m;
  };
  const shadeMat = likeBed({ uniforms: { uToolShade: { value: D.shade } }, pars: 'uniform float uToolShade;', tint: ' albedo *= 1.0 - uToolShade * vUv0.x;' });
  const show = new URLSearchParams(typeof location !== 'undefined' ? location.search : '').get('tools');      // developer's switches: &tools=drift paints the drifts red, &tools=nodrift / noshade / notimber leave a layer out
  const shadeMesh = meshes.shade = shadeMat && show !== 'noshade' ? meshOf(dark, shadeMat, 'tools: shade under the drowned timber') : null;
  if (shadeMesh) { shadeMesh.renderOrder = bedOrder + 0.5; shadeMesh.frustumCulled = false; ctx.only(shadeMesh, 'direct'); }
  // (the drifts take the bed's own material, the very object, when it is there: after the timber and the bed; like the bed it writes no depth)
  let driftMesh = null;
  if (show !== 'nodrift') {
    if (bedMesh && bedMesh.material && show !== 'drift') driftMesh = meshOf(drift, bedMesh.material, 'tools: sand drifted over the drowned things', ['aEdge']);
    else { const m = likeBed(show === 'drift' ? { tint: ' albedo = vec3(1.0, 0.1, 0.1);' } : {}); driftMesh = m ? meshOf(drift, m, 'tools: sand drifted over the drowned things') : null; }
  }
  meshes.drift = driftMesh;
  if (driftMesh) { driftMesh.renderOrder = bedOrder + 1; driftMesh.frustumCulled = false; ctx.only(driftMesh, 'direct'); }

  // ---------------------------------------------------------------------------------------------- the stand-ins go
  if (made.rake) removeStandIn(ctx, /rake/);                   // every rake and rake head, the lost rake's too
  if (made.shovel) removeStandIn(ctx, /shovel/);
  if (made.barrow) removeStandIn(ctx, /^flat barrow/);
  if (made.wheel) removeStandIn(ctx, 'barrow wheel');
  if (made.planks) removeStandIn(ctx, /^plank run/);
  if (made.baskets) removeStandIn(ctx, 'baskets');
  if (made.yoke) { removeStandIn(ctx, 'yoke'); removeStandIn(ctx, /^pail$/); }
  if (made.walk) removeStandIn(ctx, 'drowned plank walk');

  shared.tools = { walk, wheel: wheelAt, rake: rakeAt, barrow: barrowAt, yoke: yokeAt,
    triangles: { near: near.triangles, far: far.triangles, crust: crust.triangles, under: under.triangles, drift: drift.triangles, shade: dark.triangles }, pieces: near.pieces + far.pieces + under.pieces, missing, meshes, heap: toolHeap };
  // What lies under the surface is seen only within a few metres of a lamp, and under a mirror nothing of it shows from
  // far off: its three meshes are drawn only while the boat is between these distances along (plan.tools.drowned.seen).
  const sunkMeshes = [meshes.under, meshes.shade, meshes.drift].filter((m) => m && m.visible), seen = T.drowned.seen || [20, 175];

  // ---------------------------------------------------------------------------------------------- what moves
  // The planks lie a hand under the mirror: when the boat's rings pass over them each lifts a small ring of its own (the
  // page: "each plank lifts a faint V in passing rings"). A plank's end answers once the boat's ring has had time to
  // reach it, and again every couple of seconds while the boat is by and moving; a still boat on a still mirror gets none.
  const Rg = T.drowned.rings, due = new Float32Array(walk.ends.length);
  let clock = 0;
  return {
    update(dt, c) {
      uBedLamp.value = lerp(P.light.bed.lantern, P.light.bed.lanternDawn, smooth(0.3, 0.8, sky.e || 0));
      clock += dt;
      const on = (c.s ?? 0) > seen[0] && (c.s ?? 0) < seen[1];
      for (const m of sunkMeshes) if (m.visible !== on) m.visible = on;
      const boat = c.boat;
      if (!made.walk || !boat || !c.water || Math.abs(boat.z - walk.from.z) > 60) return;
      const moving = Math.abs(boat.speed || 0) > 0.25, calm = c.reducedMotion ? 2 : 1;
      for (let i = 0; i < walk.ends.length; i++) {
        const e = walk.ends[i], dist = Math.hypot(e.x - boat.x, e.z - boat.z);
        if (dist > Rg.within + 1) { due[i] = 0; continue; }
        if (dist > Rg.within || !moving) continue;
        if (due[i] === 0) due[i] = clock + dist / 2.1 + 0.3 * ((i * 37) % 5) / 5;      // when the boat's ring gets there
        else if (clock >= due[i]) {
          c.water.ripple(e.x, e.z, Rg.strength, Rg.radius);
          due[i] = clock + calm * lerp(Rg.every[0], Rg.every[1], ((i * 53 + Math.floor(clock * 7)) % 11) / 10);
        }
      }
    },
  };
}
