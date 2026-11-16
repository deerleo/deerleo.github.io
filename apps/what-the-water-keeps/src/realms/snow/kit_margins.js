// The orchard in snow: the kit and the close band, MARGINS (stage 2c; log: docs/build/snow/2-kit-margins.md).
// What stands at the edges: the shelf with its strata, its cornice and its comb of icicles; the pans; the frost flowers
// on the skin ice; the birch wood of the river; the fence and the pollards of the plain.
//
//   the shelf        lofted here along the water's REAL edge (the zero line of plan.waterRoom, found by marching over it,
//                    so the pond's rim, its small bay and every corner are followed; and 4 m up the river along the
//                    land's own rim). THE ICE in short plates of four kinds (the four Blender profiles of
//                    assets/models/snow/shelf.json, made by source-art/models/snow/shelf.py), flat fracture facets, a brow
//                    over an ink hollow, three strata laid in the paint, rim ice and calved blocks; THE SNOW over it,
//                    lofted a hand apart as pillows. Tongues with colliders of their own. WINTER.
//   icicles          comb_icicle_A..C, instanced, hung in the hollow from the ice's lip and from the snow's own lip, and
//                    in the river banks' undercut. WINTER.
//   pans             pan_A..C, instanced, set down still; they ride the rings (the life toolkit's floatRide), and the hull
//                    shoulders them aside until the cast drifts them: shared.margins.pans. WINTER.
//   frost flowers    frost_tuft_A..C: a pool that goes with the boat (the page: "4,000 instanced near the boat"), each tuft
//                    at a place of its own in the world, standing only where there is skin ice NOW (it reads the water's
//                    trace) and never on the shelf or the open road. WINTER.
//   the birch wood   birch_A..E and three lighter ones, crown sprays with their snow, nests, the broken birch (the owl's
//                    perch): shared.margins.birches, .owlPerch. SHARED, their snow winter.
//   the plain        pollard_A..C, fence posts and strainers, the wire under hoar: shared.margins.pollards, .fence.
//
// Every piece is built in its own guard: one that fails is reported (INVALID_PIECE) and its stand-in stays standing.
// The stand-ins live in kit.js (the Trees group's) and are taken out from here with removeStandIn as each thing stands.
//
// Developer switches: &km=shelf,pans,frost,...   build only these pieces of this module;   &kmoff=frost,...   all but these
//                     &kmshelf=A|B|C|D            the whole shelf in one profile (to look at each)
import * as THREE from 'three';
import { removeStandIn } from '../../engine/modules.js';
import { waterUniforms } from '../../engine/water-final.js';
import { floatRide } from '../../engine/life/floaters.js';
import { GLARE_GLSL, GLARE_PARS, glareUniforms } from '../../engine/life/falls.js';
import { buildShelf, buildIcicles } from './kit_margins_shelf.js';

const DIR = 'models/snow/';
const Q = new URLSearchParams(location.search);
const pick = (k) => (Q.get(k) || '').split(',').map((v) => v.trim()).filter(Boolean);
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const hash1 = (i, seed) => { const x = Math.sin(i * 127.1 + seed * 311.7) * 43758.5453; return x - Math.floor(x); };
const noise1 = (x, seed) => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return hash1(i, seed) * (1 - u) + hash1(i + 1, seed) * u; };
// GLSL: a small noise with names of its own (an extension may not use names another extension has taken)
const KM_NOISE = /* glsl */`
  float kmH(vec2 p) { vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
  float kmN(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(kmH(i), kmH(i + vec2(1.0, 0.0)), f.x), mix(kmH(i + vec2(0.0, 1.0)), kmH(i + vec2(1.0, 1.0)), f.x), f.y); }`;

// ------------------------------------------------------------------------------------------------ the water's edge
// The zero line of room(x, z) (positive on the water) inside a rectangle, by marching squares: lines of [x, z].
function zeroLines(room, x0, x1, z0, z1, h) {
  const nx = Math.round((x1 - x0) / h), nz = Math.round((z1 - z0) / h), W = nx + 1;
  const v = new Float32Array(W * (nz + 1));
  for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) v[j * W + i] = room(x0 + i * h, z0 + j * h);
  const pts = new Map(), adj = new Map();
  const cross = (id, ax, az, bx, bz, va, vb) => { if (!pts.has(id)) { const t = va / (va - vb); pts.set(id, [ax + (bx - ax) * t, az + (bz - az) * t]); } return id; };
  const link = (a, b) => { (adj.get(a) || adj.set(a, []).get(a)).push(b); (adj.get(b) || adj.set(b, []).get(b)).push(a); };
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const a = v[j * W + i], b = v[j * W + i + 1], c = v[(j + 1) * W + i + 1], d = v[(j + 1) * W + i];
    const sa = a > 0, sb = b > 0, sc = c > 0, sd = d > 0;
    if (sa === sb && sb === sc && sc === sd) continue;
    const X = x0 + i * h, Z = z0 + j * h, e = [];
    if (sa !== sb) e.push(cross(2 * (j * W + i), X, Z, X + h, Z, a, b));                       // the cell's four edges: low z, high x, high z, low x
    if (sb !== sc) e.push(cross(2 * (j * W + i + 1) + 1, X + h, Z, X + h, Z + h, b, c));
    if (sd !== sc) e.push(cross(2 * ((j + 1) * W + i), X, Z + h, X + h, Z + h, d, c));
    if (sa !== sd) e.push(cross(2 * (j * W + i) + 1, X, Z, X, Z + h, a, d));
    if (e.length === 2) link(e[0], e[1]); else if (e.length === 4) { link(e[0], e[1]); link(e[2], e[3]); }
  }
  const seen = new Set(), lines = [];
  const walk = (start) => { const line = []; let at = start, from = -1; while (at != null && !seen.has(at)) { seen.add(at); line.push(pts.get(at)); const nb = adj.get(at) || []; const next = nb.find((q) => q !== from && !seen.has(q)); from = at; at = next; } return line; };
  for (const [id, nb] of adj) if (nb.length === 1 && !seen.has(id)) lines.push(walk(id));     // open lines first, from an end
  for (const id of adj.keys()) if (!seen.has(id)) lines.push(walk(id));
  return lines;
}
// A line of [x, z] as stations a fixed distance apart: { x, z, nx, nz (unit, toward the water), t (metres along), tight (0..1: how sharply the edge turns here) }.
function stations(line, step, room) {
  const acc = [0];
  for (let i = 1; i < line.length; i++) acc.push(acc[i - 1] + Math.hypot(line[i][0] - line[i - 1][0], line[i][1] - line[i - 1][1]));
  const total = acc[acc.length - 1], n = Math.max(2, Math.round(total / step)), out = [];
  let k = 0;
  for (let i = 0; i <= n; i++) {
    const t = total * i / n;
    while (k < acc.length - 2 && acc[k + 1] < t) k++;
    const f = (t - acc[k]) / Math.max(1e-6, acc[k + 1] - acc[k]);
    out.push({ x: line[k][0] + (line[k + 1][0] - line[k][0]) * f, z: line[k][1] + (line[k + 1][1] - line[k][1]) * f, t });
  }
  const raw = out.map((p, i) => { const a = out[Math.max(0, i - 1)], b = out[Math.min(n, i + 1)]; let tx = b.x - a.x, tz = b.z - a.z; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l; let nx = -tz, nz = tx; if (room(p.x + nx * 0.15, p.z + nz * 0.15) < room(p.x - nx * 0.15, p.z - nz * 0.15)) { nx = -nx; nz = -nz; } return [nx, nz, tx, tz]; });
  out.forEach((p, i) => {
    // (the normal is shared over a metre, so that a corner of the edge is turned over several stations and not in one)
    let nx = 0, nz = 0; for (let q = -3; q <= 3; q++) { const r = raw[clamp(i + q, 0, n)], w = 4 - Math.abs(q); nx += r[0] * w; nz += r[1] * w; }
    const l = Math.hypot(nx, nz) || 1; p.nx = nx / l; p.nz = nz / l;
    const a = raw[clamp(i - 4, 0, n)], b = raw[clamp(i + 4, 0, n)];
    p.tight = smooth(0.3, 1.1, Math.acos(clamp(a[2] * b[2] + a[3] * b[3], -1, 1)));
  });
  return out;
}

export async function build(ctx, plan, shared) {
  const { kit } = ctx, M = shared.mat, C = plan.chip, land = shared.land, light = shared.light;
  const only = pick('km'), off = pick('kmoff');
  const margins = shared.margins = {};
  const count = shared.counts = shared.counts || {};
  const updates = [];
  const piece = async (name, fn) => {
    if ((only.length && !only.includes(name)) || off.includes(name)) return;
    try { await fn(); } catch (err) { console.error(`INVALID_PIECE snow/kit_margins: "${name}" failed to build; its stand-in stays: ${(err && err.stack) || err}`); }
  };
  const col = (c) => new THREE.Color(c);
  const winter = (obj) => ctx.only(obj, 'direct');
  /** The geometry of a modelled piece (the file is fetched once and counted like any model). */
  // PAINT ON THE POINTS, TAKEN AT THE CENTROID (third holder). The picture is multisampled, and a varying is read at the
  // pixel's centre even where the centre lies outside a sliver of a triangle: there the points' paint is run on BEYOND
  // its two colours. From white through a pale frost blue that gives a saturated blue with red and green below nothing:
  // electric blue specks strung along the shelf's lip from mid-road, and on far frost. Every material of this module that
  // wears vertex paint on thin or small things takes its colour through this instead (clamped, and never extrapolated).
  const centroidPaint = {
    vertexPars: 'centroid varying vec3 vKmCol;',
    vertexLocal: '\n  vKmCol = vec3(1.0);\n#ifdef USE_COLOR\n  vKmCol *= color.rgb;\n#endif\n#ifdef USE_INSTANCING_COLOR\n  vKmCol *= instanceColor.xyz;\n#endif\n',
    fragmentPars: 'centroid varying vec3 vKmCol;',
    albedo: 'albedo = uColor * clamp(vKmCol, 0.0, 8.0);',
  };
  const geometryOf = async (file) => { const m = await kit.model(DIR + file, {}); m.group.removeFromParent(); return m.body.geometry; };
  /** What kit_margins_shelf.js needs of this module (the hair's floor is defined just below). */
  const SHELF_KIT = () => ({ Q, DIR, smooth, clamp, hash1, noise1, KM_NOISE, zeroLines, stations, centroidPaint, winter, col, hairy, uHair });

  // ================================================================================================ thin wood
  // A HAIR IS NEVER DRAWN THINNER THAN A PIXEL. Limbs, sprays, whips and wire are modelled at their true thickness (a
  // birch's hanging twig is 4 mm) and drawn crisp; at 20 m such a twig is a fifth of a pixel wide and is seen as a
  // grey haze or not at all. The models' `twig` slot carries every point's own radius in UV.x, and here each point is
  // pushed out along its normal until the tube is `uKmHair.y` pixels across in the picture being drawn (the mirror's
  // picture is a different size: the figure is set for every pass).
  const uHair = { value: new THREE.Vector2(0.001, 0.95) };
  const hair = {
    uniforms: { uKmHair: uHair }, vertexPars: 'uniform vec2 uKmHair;',
    vertexWorld: /* glsl */`{
      #ifdef USE_INSTANCING
        float kmS = length((modelMatrix * instanceMatrix)[0].xyz);
      #else
        float kmS = length(modelMatrix[0].xyz);
      #endif
      float kmNeed = 0.5 * uKmHair.y * uKmHair.x * length(wp.xyz - uCameraPos);
      wp.xyz += normalize(wn) * max(0.0, kmNeed - uv.x * kmS);
    }`,
  };
  const _size = new THREE.Vector2();
  const hairy = (mesh) => {                                       // call on every mesh that wears `hair`
    const before = mesh.onBeforeRender;
    mesh.onBeforeRender = function (renderer, scene, camera, geometry, material, group) {
      const rt = renderer.getRenderTarget(), h = rt ? rt.height : renderer.getDrawingBufferSize(_size).y;
      uHair.value.x = 1 / (h * 0.5 * camera.projectionMatrix.elements[5]); material.uniformsNeedUpdate = true;
      if (before) before.call(this, renderer, scene, camera, geometry, material, group);
    };
    return mesh;
  };
  const hairyAll = (m) => { for (const mesh of m.meshes) if (mesh.name.endsWith(':twig')) hairy(mesh); return m; };
  const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p3 = new THREE.Vector3(), _s3 = new THREE.Vector3();
  /** The matrix kit.models gives a placement { position, rotation: [x, y, z], scale: [x, y, z] } (heading first). */
  const matrixOf = (pl) => new THREE.Matrix4().compose(_p3.set(...pl.position), _q.setFromEuler(_e.set(pl.rotation[0], pl.rotation[1], pl.rotation[2], 'YXZ')), _s3.set(...pl.scale));
  /** A lean of `angle` radians toward the world direction (dx, dz), for a thing that is first turned by `turn` about the vertical: the rotation kit.models takes. */
  const leanTurn = (dx, dz, angle, turn, more = [0, 0]) => { const ax = angle * dz + more[0], az = -angle * dx + more[1], c = Math.cos(turn), sn = Math.sin(turn); return [ax * c - az * sn, turn, ax * sn + az * c]; };

  // ================================================================================================ the shelf's edge, and its comb
  // The shelf and the icicles are made in kit_margins_shelf.js (fourth making: read its header). In short: the ice in
  // plates of flat fracture facets, its face down to a hand above the water with the three strata as a ragged gradient
  // in the paint and only a low notch eaten under it; the snow level with the plain behind it, rounding over at its
  // edge, standing out over the ice here and back from it there, with notches where a piece has broken away and
  // droops where it has crept down the face; near the boat the snow's edge is lofted every 5 cm (a window of chunks
  // that goes with the boat). The comb's icicles are slender and many, sorted along the edge, and only those near the
  // boat are drawn (a pool for each of four models).
  await piece('shelf', async () => {
    const shelf = await buildShelf(ctx, plan, shared, SHELF_KIT());
    removeStandIn(ctx, 'the shelf');
    margins.shelf = shelf;
    count.shelf = shelf.counts;
    updates.push(() => shelf.update());
  });
  await piece('icicles', async () => {
    const ic = await buildIcicles(ctx, plan, shared, SHELF_KIT(), margins.shelf);
    removeStandIn(ctx, /^icicles \(winter\)$/);
    margins.icicles = ic;
    count.iciclesMargins = { all: ic.total, eaves: ic.onEaves, lip: ic.onLip, under: ic.under, banks: ic.onBanks };
    updates.push(() => { ic.update(); count.iciclesMargins.drawn = ic.drawn(); });
  });

  // ================================================================================================ pans
  // Page (cast 11): "60 discs 0.8 to 2.5 m across in the road and the pond; 12 more in the thaw ... uneven outline, rim
  // raised 6 cm, slush skirt at the waterline". Set down still (their drift is the cast's); they ride the rings of the
  // water where they lie (tip to a wake, bob a hair): the life toolkit's floatRide. No two alike: three models, each
  // turned, stretched a little out of round and tinted by instance.
  await piece('pans', async () => {
    const rnd = ctx.rng(1187), items = [];
    const tryPan = (s, d) => {
      const r = (plan.pans.across[0] + Math.pow(rnd(), 1.6) * (plan.pans.across[1] - plan.pans.across[0])) / 2;
      if (plan.waterRoom(s, d) < r + 0.9) return;
      if (Math.hypot(s - plan.tree.at[0], d - plan.tree.at[1]) < plan.tree.islet.collide + r + 1.2) return;
      for (const c of ctx.state.colliders || []) if (Math.hypot(c.x - d, c.z + s) < c.r + r + 0.5) return;        // not round a trunk, a prop, a limb in the water
      if (items.some((o) => Math.hypot(o.x - d, o.z + s) < (o.radius + r) * 1.15 + 0.3)) return;
      items.push({ x: d, z: -s, radius: r, turn: rnd() * 6.283, variant: ((v) => (v < 0.42 ? 'A' : v < 0.84 ? 'B' : 'C'))(rnd()), squash: 0.9 + 0.2 * rnd(), tint: ['#ffffff', '#f4f1f8', '#fbf6f2', '#eeeef8'][Math.floor(rnd() * 4) % 4] });
    };
    let guard = 0;
    while (items.length < plan.pans.road && guard++ < 6000) {
      if (rnd() < 0.35) { const a = rnd() * 6.283, r = 9 + rnd() * 12; tryPan(plan.tree.at[0] + Math.cos(a) * r, Math.sin(a) * r); }
      else { const s = 60 + rnd() * 160, d = (rnd() < 0.5 ? -1 : 1) * (2.5 + rnd() * 6.5); if (s > plan.bay.from - 2 && s < plan.bay.to + 2) continue; tryPan(s, d); }
    }
    guard = 0; while (items.length < plan.pans.road + plan.pans.thaw && guard++ < 3000) tryPan(226 + rnd() * 40, (rnd() * 2 - 1) * 7.5);
    const ride = floatRide(ctx, { size: 1.6, tip: 0.9, most: 0.075, bob: 0.004 });
    const cap = { uniforms: glareUniforms(ctx, 0.88), fragmentPars: GLARE_PARS, light: GLARE_GLSL };      // pale paint stays paint beside the lantern (the toolkit's own pan wears the same)
    // A pan is pieces frozen together: seams across its plate, a finger wide, darker where the pieces meet and a hair of
    // frost beside them. Drawn in the pan's own space (so they turn and drift with it), each pan its own (by its size,
    // which the cast does not change). Seen from the hull; further off the painter's brush takes them, as it should.
    const seams = {
      vertexPars: 'varying vec3 vKmPan;',
      vertexLocal: '\n  vKmPan = transformed;\n#ifdef USE_INSTANCING\n  vKmPan.xz += 17.0 * fract(vec2(length(instanceMatrix[0].xyz) * 7.31, length(instanceMatrix[2].xyz) * 3.17));\n#endif\n',
      fragmentPars: /* glsl */`varying vec3 vKmPan; ${KM_NOISE}
        float kmVoro(vec2 p) { vec2 n = floor(p), f = fract(p); float f1 = 8.0, f2 = 8.0;
          for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) { vec2 g = vec2(float(i), float(j)); float d = length(g + vec2(kmH(n + g), kmH(n + g + 31.7)) - f); if (d < f1) { f2 = f1; f1 = d; } else if (d < f2) f2 = d; }
          return f2 - f1; }`,
      albedo: /* glsl */`{
        float onPlate = (1.0 - smoothstep(0.037, 0.05, vKmPan.y)) * smoothstep(0.02, 0.03, vKmPan.y) * smoothstep(0.7, 0.9, N.y);
        float v = kmVoro(vKmPan.xz * 0.95 + 3.3), seam = 1.0 - smoothstep(0.006, 0.022, v), frost = smoothstep(0.022, 0.04, v) * (1.0 - smoothstep(0.04, 0.1, v));
        // the plate's own paint, by PLACE (the model's 73 points cannot hold it): wetter and darker in patches, and a
        // dusting of snow lying on it in drifts
        float kw = kmN(vKmPan.xz * 1.3 + 9.7), kd = kmN(vKmPan.xz * 2.3 + 5.1) * 0.65 + kmN(vKmPan.xz * 6.1) * 0.35;
        albedo = mix(albedo, albedo * vec3(0.8, 0.8, 0.92), smoothstep(0.5, 0.75, kw) * 0.7 * onPlate);
        albedo = mix(albedo, vec3(0.78, 0.78, 0.89), smoothstep(0.46, 0.7, kd) * 0.65 * onPlate);
        // the rim is crumbs, not a rolled edge: lavender pits between its white grains, coarse and fine
        float onRim = smoothstep(0.042, 0.058, vKmPan.y), kr = kmN(vKmPan.xz * 19.0 + 3.0) * 0.6 + kmN(vKmPan.xz * 47.0) * 0.4;
        albedo = mix(albedo, albedo * vec3(0.7, 0.7, 0.86), onRim * (1.0 - smoothstep(0.32, 0.52, kr)) * 0.85);
        albedo = mix(albedo, albedo * vec3(0.7, 0.7, 0.84), seam * 0.6 * onPlate);
        albedo = mix(albedo, vec3(0.86, 0.87, 0.95), frost * 0.12 * onPlate);
      }`,
    };
    const sets = {}, geometry = {};
    for (const key of ['A', 'B', 'C']) {
      const mine = items.filter((it) => it.variant === key);
      mine.forEach((it, i) => { it.slot = i; });
      const m = await kit.models(DIR + `pan_${key}.glb`, mine.map((it) => ({ position: [it.x, 0, it.z], rotation: it.turn, scale: [it.radius * it.squash, 1, it.radius / it.squash], tint: it.tint })), { brush: 0.3, extend: [centroidPaint, ride, cap, seams], tintable: true });
      m.group.name = `pan_${key} x${m.count} (winter)`; winter(m.group);
      for (const mesh of m.meshes) { mesh.frustumCulled = false; mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); geometry[key] = mesh.geometry; }
      sets[key] = m;
    }
    removeStandIn(ctx, 'pan_A..C');
    // FOR THE CAST: every pan as { x, z, radius, turn, variant }; set(i, x, z, turn) moves one (its place is kept in `items`).
    margins.pans = {
      items, geometry, ride,
      set(i, x, z, turn) { const it = items[i]; if (!it) return; it.x = x; it.z = z; if (turn != null) it.turn = turn; sets[it.variant].place(it.slot, { position: [x, 0, z], rotation: it.turn, scale: [it.radius * it.squash, 1, it.radius / it.squash], tint: it.tint }); },
    };
    // UNTIL THE CAST DRIFTS THEM the hull shoulders a pan aside (third holder: a pan the boat sat on stood up through its
    // bottom boards, and twelve lie in the thaw's fairway). Plain and silent: a pan that the hull's waterline would
    // cover is moved straight out from the boat's long axis, a few metres a second, no further than its water goes.
    // The cast's own circle physics (pans that drift, turn, nudge one another and knock) replaces it: set
    // shared.margins.pans.shoulder = false.
    margins.pans.shoulder = true;
    updates.push((dt) => {
      if (!margins.pans.shoulder) return;
      const b = ctx.boat, fx = -Math.sin(b.heading), fz = -Math.cos(b.heading);      // the way the bow points
      for (let i = 0; i < items.length; i++) {
        const it = items[i], rx = it.x - b.x, rz = it.z - b.z;
        if (Math.abs(rx) + Math.abs(rz) > 6) continue;
        const along = clamp(rx * fx + rz * fz, -1.55, 1.95), px = rx - fx * along, pz = rz - fz * along, d = Math.hypot(px, pz), need = 0.5 + it.radius * 0.97;
        if (d >= need) continue;
        const nx = d > 1e-3 ? px / d : -fz, nz = d > 1e-3 ? pz / d : fx, step = Math.min(need - d, 4 * dt + 0.02);
        const x = it.x + nx * step, z = it.z + nz * step;
        if (plan.waterRoom(-z, x) < it.radius * 0.5) continue;
        margins.pans.set(i, x, z);
      }
    });
    count.pansMargins = { n: items.length, some: items.slice(0, 14).map((it) => [+(-it.z).toFixed(1), +it.x.toFixed(1), +it.radius.toFixed(2), it.variant]) };
  });

  // ================================================================================================ frost flowers
  // Page: "frost flowers (tufts 3 to 6 cm, matte, 4,000 instanced near the boat)"; the director: only on skin ice, never
  // on the open road; halved on medium quality. A POOL THAT GOES WITH THE BOAT: every tuft has a place of its own in a
  // tile 12 m square that repeats over the world, and is drawn at whichever copy of its place is nearest the boat, so
  // wherever the boat lies the ice within five metres of it carries about twenty tufts a square metre, in clumps, each
  // always where it was. (The first making spread them over a tile of 24 m, seven a square metre and thinned by half:
  // a tuft 5 cm tall, white on white ice, one every half metre, could not be found in any picture. They are a thing
  // for the eye beside the hull: close, many, and each standing in its own small hollow of darker ice.) A tuft
  // stands only where the water's trace says there is skin NOW (it folds away where the road is kept open and where a
  // hull has just broken its lane, and comes back as the lane freezes over), a hand clear of the shelf, off the islet,
  // and in patches: frost flowers grow in fields with bare ice between, thickest along the shelf's foot.
  await piece('frost', async () => {
    const n = ctx.quality.density >= 1 ? plan.count.frostFlowers : Math.round(plan.count.frostFlowers / 2), TILE = 12;
    const wu = waterUniforms(ctx.engine), rnd = ctx.rng(5231);
    // how far the water reaches to the left and to the right of the reference line, every quarter metre of the page's s
    const S0 = 56, LEN = 256, W = 1024, edge = new Float32Array(W * 4);
    for (let i = 0; i < W; i++) { const s = S0 + (i + 0.5) / W * LEN; edge[i * 4] = s < plan.straight ? 0 : plan.shelfLeft(s); edge[i * 4 + 1] = s < plan.straight ? 0 : plan.shelfRight(s); }
    const edgeTex = new THREE.DataTexture(edge, W, 1, THREE.RGBAFormat, THREE.FloatType); edgeTex.minFilter = edgeTex.magFilter = THREE.NearestFilter; edgeTex.needsUpdate = true;
    const uFrost = { value: new THREE.Vector4(TILE, TILE * 0.36, TILE * 0.47, 1) };       // tile, where they begin to thin with distance, where there are none, how many stand (the cast: 0 folds them all)
    const ext = {
      uniforms: { tTrace: wu.tTrace, uTraceRect: wu.uTraceRect, tKmEdge: { value: edgeTex }, uKmFrost: uFrost, uKmIslet: { value: new THREE.Vector3(plan.tree.at[1], -plan.tree.at[0], plan.tree.islet.across / 2 + 1.6) } },
      vertexPars: `attribute vec4 aHome; uniform sampler2D tTrace, tKmEdge; uniform vec4 uTraceRect, uKmFrost; uniform vec3 uKmIslet; ${KM_NOISE}`,
      vertexLocal: /* glsl */`{ float ca = cos(aHome.z), sa = sin(aHome.z);
        transformed = vec3(ca * transformed.x + sa * transformed.z, transformed.y, ca * transformed.z - sa * transformed.x) * aHome.w;
        objectNormal = vec3(ca * objectNormal.x + sa * objectNormal.z, objectNormal.y, ca * objectNormal.z - sa * objectNormal.x); }`,
      vertexWorld: /* glsl */`{
        vec2 rel = mod(aHome.xy - uBoat.xz + uKmFrost.x * 0.5, uKmFrost.x) - uKmFrost.x * 0.5, at = uBoat.xz + rel;
        float fs = -at.y;
        vec2 fe = texture2D(tKmEdge, vec2((fs - ${S0.toFixed(1)}) / ${LEN.toFixed(1)}, 0.5)).rg;
        float room = min(at.x + fe.x, fe.y - at.x);
        vec2 tuv = (at - uTraceRect.xy) / uTraceRect.zw + 0.5;
        vec4 ktr = texture2D(tTrace, tuv);
        float open = (tuv.x > 0.0 && tuv.x < 1.0 && tuv.y > 0.0 && tuv.y < 1.0) ? max(ktr.a, ktr.g) : 1.0;      // what passed lately (a lane), and the water the realm keeps open (the black road), as the water itself reads them
        float field = kmN(at * 0.42) * 0.62 + kmN(at * 1.35 + 9.1) * 0.38 + 0.3 * (1.0 - smoothstep(0.7, 2.2, room));
        ${Q.has('kmfrostall') ? 'open = 0.0;' : ''}
        float alive = (1.0 - smoothstep(0.06, 0.22, open)) * smoothstep(0.5, 0.8, room) * step(${(plan.straight + 0.5).toFixed(1)}, fs)
          * (1.0 - smoothstep(uKmFrost.y, uKmFrost.z, length(rel))) * smoothstep(0.2, 0.36, field) * step(uKmIslet.z, length(at - uKmIslet.xy)) * uKmFrost.w;
        wp.xyz = vec3(at.x, 0.004, at.y) + wp.xyz * alive;
      }`,
    };
    const mat = kit.gouache({ color: '#ffffff', vertexColors: true, brush: 0.2, side: THREE.DoubleSide, crisp: true, extend: [centroidPaint, ext] });
    const meshes = [], one = new THREE.Matrix4();
    // they grow in clumps: a hundred or so homes in the tile, each a patch half a metre to a metre across
    const clumps = []; for (let c = 0; c < 110; c++) clumps.push([rnd() * TILE, rnd() * TILE, 0.35 + 0.75 * rnd()]);
    for (let k = 0; k < 3; k++) {
      const g = (await geometryOf(`frost_tuft_${'ABC'[k]}.glb`)).clone(), m = Math.floor(n / 3), home = new Float32Array(m * 4);
      for (let i = 0; i < m; i++) {
        const [cx, cz, cr] = clumps[Math.floor(rnd() * clumps.length) % clumps.length], a = rnd() * 6.283, rr = cr * Math.pow(rnd(), 0.6);
        home[i * 4] = (cx + Math.cos(a) * rr + TILE) % TILE; home[i * 4 + 1] = (cz + Math.sin(a) * rr + TILE) % TILE; home[i * 4 + 2] = rnd() * 6.283; home[i * 4 + 3] = 0.9 + 0.55 * rnd();
      }
      g.setAttribute('aHome', new THREE.InstancedBufferAttribute(home, 4));
      const mesh = new THREE.InstancedMesh(g, mat, m);
      for (let i = 0; i < m; i++) mesh.setMatrixAt(i, one);
      mesh.instanceMatrix.needsUpdate = true; mesh.frustumCulled = false; mesh.name = `frost_tuft_${'ABC'[k]} x${m} (winter)`;
      winter(ctx.add(mesh)); meshes.push(mesh);
    }
    ctx.onDispose(() => edgeTex.dispose());
    removeStandIn(ctx, 'frost flowers');
    // FOR THE CAST: `standing.value.w` is how many stand (1 all .. 0 none: a plate that breaks takes its flowers with it by the trace already)
    margins.frost = { meshes, standing: uFrost, tile: TILE };
    // (in the birch river every flower is folded: the river is kept open from bank to bank. Not drawn there.)
    updates.push(() => { const on = shared.here.s > 54; for (const m of meshes) m.visible = on; });
    count.frostMargins = Math.floor(n / 3) * 3;
  });

  // ================================================================================================ the birch wood
  // Page: "220 birches 16 to 26 m tall, 0.2 to 0.45 m thick, leaning a little over the water; crowns of fine drooping
  // twigs from 9 m up, laden; seven old nests as ink blots"; the close band: "birch trunks rise straight out of the snow
  // 1 m behind [the bank's top], white with ink marks, close enough to see the curls of bark". Both banks, s 26 to 60,
  // to 60 m back. KEPT FROM THE LAYOUT: the left bank's western edge slants back from the river (or the wood fills
  // postcard 4), no birch stands in the cliff, the broken birch stands at (40, -10) for the owl.
  // Five modelled trees for the front of the wood (to 30 m from the line: paper curls, scars, snags, twelve to fifteen
  // limbs) and three lighter ones of the same stems for the back of it, in the river's fog. Each is turned, leaned
  // toward the water (more in the front row), scaled within the page's heights, and tinted. The white bark's fine
  // marks are the painted tile `birch` on the trunk's own UVs, each tree taking its own place on the tile.
  await piece('birches', async () => {
    const B = plan.birches, F = shared.frame, rnd = ctx.rng(733), hairGroups = [];
    const info = await fetch('assets/' + DIR + 'birch.json').then((r) => { if (!r.ok) throw new Error('birch.json: ' + r.status); return r.json(); });
    const tex = await ctx.tex('art/snow/birch.webp', { repeat: true });
    const owl = plan.owl.perch;
    const RANGE = { A: [0.8, 1.08], B: [0.88, 1.14], C: [0.95, 1.2], D: [0.8, 1.0], E: [0.86, 1.2], A_far: [0.8, 1.08], B_far: [0.88, 1.14], C_far: [0.95, 1.25] };
    const tints = ['#ffffff', '#f6f2f6', '#fbf7f0', '#eeeaf2', '#f2f0ea'];
    const trees = [], placed = [], want = kit.count(B.count);
    let tries = 0;
    while (trees.length < want && tries++ < 40000) {
      const side = rnd() < 0.5 ? -1 : 1, s = B.from + 1.5 + rnd() * (B.to - B.from - 1.5), back = B.back[0] + Math.pow(rnd(), 1.5) * (B.back[1] - B.back[0]), d = side * back;
      if (s > 56 && rnd() < (s - 56) / 4) continue;                                 // the birches stop
      if (side < 0 && (back + 6) * 0.6 > 70 - s) continue;                          // (the layout's: the left bank's western edge slants back, for postcard 4)
      const p = F.at(s, d);
      if (p.z > shared.zFace - 1.5 && Math.abs(p.x - land.xFace) < plan.cliff.wide / 2 + 2) continue;      // not inside the cliff
      if (side < 0 && Math.abs(s - owl[0]) < 3.4 && back > 9.5 && back < 21) continue;                      // the broken birch and its fallen top lie here
      if (placed.some((o) => Math.hypot(o[0] - p.x, o[1] - p.z) < 2.3)) continue;
      placed.push([p.x, p.z]);
      const near = back < 30, v = rnd();
      const key = near ? (v < 0.24 ? 'A' : v < 0.38 ? 'B' : v < 0.62 ? 'C' : v < 0.8 ? 'D' : 'E') : (v < 0.45 ? 'A_far' : v < 0.65 ? 'B_far' : 'C_far');
      const k = RANGE[key][0] + rnd() * (RANGE[key][1] - RANGE[key][0]), girth = k * (0.94 + 0.12 * rnd());
      const a = ctx.path.at(Math.min(s, plan.straight)), toward = (0.02 + rnd() * 0.05) * (back < 22 ? 1.6 : 0.6), turn = rnd() * 6.283;
      const y = land.snowHeight(p.x, p.z, back - plan.band(s), side) - 0.12;
      const pl = { position: [p.x, y, p.z], rotation: leanTurn(-side * a.rx, -side * a.rz, toward, turn, [(rnd() - 0.5) * 0.05, (rnd() - 0.5) * 0.05]), scale: [girth, k, girth], tint: tints[Math.floor(rnd() * tints.length) % tints.length] };
      trees.push({ key, near, back, side, s, k, pl, m: matrixOf(pl) });
    }
    const sway = { strength: ctx.reducedMotion ? 0.02 : 0.05, speed: 0.45, from: 7, to: 27, dir: [0.8, 0.5] };      // the crowns move a hand's breadth, all together, slowly
    // THE BIRCH'S INK (page: "white with ink marks"; "a hall of birch trunks with ink marks"). The painted tile's own
    // dashes are true to a birch and four millimetres thick on the stem: a third of a pixel from the river, where the
    // trunks were plain white poles. So the paint draws three things over the model's own colours:
    //   - the tile's fine marks, taken from its lilac to ink (for an arm's length);
    //   - BROAD DASHES, a hand to two hands long and two fingers thick, lens-shaped, laid in the stem's own UVs (once
    //     round the stem, by its girth along it: a thick stem carries larger marks), which is what is seen from a boat;
    //   - THE FOOT: where the model paints the rough dark bark (a soft tone, because paint lives on points) the dark is
    //     broken into upright fissures and diamonds that climb into the white, hard-edged, as ink is.
    // Each tree takes its own place on the tile and in the marks. Paper curls, patches and scars (one UV for a whole
    // piece) keep the model's own paint.
    const barkExt = {
      vertexPars: 'varying float vKmUp;',
      vertexLocal: '\n  vKmUp = transformed.y;\n#ifdef USE_INSTANCING\n  vUv0 += fract(vec2(instanceMatrix[3].x * 0.173 + instanceMatrix[3].z * 0.311, instanceMatrix[3].z * 0.127 + instanceMatrix[3].x * 0.219));\n#endif\n',
      fragmentPars: /* glsl */`varying float vKmUp; ${KM_NOISE}
        // value noise that comes round again after per cells of x (the stem's seam must not show)
        float kmNp(vec2 p, float per) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); float x0 = mod(i.x, per), x1 = mod(i.x + 1.0, per);
          return mix(mix(kmH(vec2(x0, i.y)), kmH(vec2(x1, i.y)), f.x), mix(kmH(vec2(x0, i.y + 1.0)), kmH(vec2(x1, i.y + 1.0)), f.x), f.y); }
        // broad dashes: cells a quarter of the girth wide and a ninth of it tall, four in ten of them carrying one mark
        float kmDash(vec2 uv) {
          vec2 g = vec2(uv.x * 4.0, uv.y * 9.0), c = floor(g); float m = 0.0;
          for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
            vec2 cell = c + vec2(float(i), float(j)), key = vec2(mod(cell.x, 4.0), cell.y);
            float h = kmH(key + 17.0);
            if (h > 0.4) continue;
            vec2 d = g - (cell + vec2(0.2 + 0.6 * kmH(key * 1.7 + 3.1), 0.25 + 0.5 * kmH(key * 2.3 + 9.7)));
            float halfLen = 0.22 + 0.5 * kmH(key + 5.5), halfTh = 0.05 + 0.1 * kmH(key + 8.8), lens = 1.0 - d.x * d.x / (halfLen * halfLen);
            if (lens <= 0.0) continue;
            float th = halfTh * (0.25 + 0.75 * lens);
            m = max(m, 1.0 - smoothstep(th * 0.55, th, abs(d.y + 0.07 * sin(d.x * 5.0 + h * 40.0))));
          }
          return m;
        }`,
      albedo: /* glsl */`{
        vec3 t0 = texture2D(tMap, vUv0).rgb, own = albedo / max(t0, vec3(0.04));
        float onStem = step(1e-6, fwidth(vUv0.x) + fwidth(vUv0.y));                       // a piece with one UV all over (a curl, a patch, a scar) is not the stem
        if (onStem < 0.5) albedo = own;
        else {
          float tl = dot(t0, vec3(0.3333)), ol = dot(own, vec3(0.3333));
          vec2 q = vec2(fract(vUv0.x), vUv0.y);
          // THE FOOT (third holder). Where the model paints its rough dark bark, the dark is laid here as FISSURES: narrow
          // and tall (a thumb to three fingers wide, a forearm long), nine parts in ten of the bark at the snow, with
          // slivers of white between them, thinning upward into single strokes and gone by a man's chest. (As broad teeth
          // a third of the girth wide and a metre tall, solid below, every foot was a torn black skirt.)
          float footZone = (1.0 - smoothstep(0.32, 0.8, ol)) * (1.0 - smoothstep(1.7, 2.6, vKmUp)), foot = footZone * (1.0 - smoothstep(0.2, 1.45, vKmUp));
          float white = max(smoothstep(0.5, 0.75, ol), footZone);                            // (the dark upper stem carries no marks)
          vec3 paper = mix(own, vec3(0.95, 0.94, 0.955), smoothstep(0.0, 0.2, footZone)) * clamp(t0 * vec3(1.032, 1.06, 1.016), 0.0, 1.0);
          float ink = max(1.0 - smoothstep(0.62, 0.8, tl), 0.94 * kmDash(q)) * white;
          float fis = kmNp(vec2(q.x * 22.0, q.y * 2.2), 22.0) * 0.6 + kmNp(vec2(q.x * 46.0 + 3.0, q.y * 6.5), 46.0) * 0.4;
          float pn = clamp((fis - 0.27) * 2.2, 0.0, 1.0), dens = foot * 0.92;
          float rough = (1.0 - smoothstep(dens - 0.035, dens + 0.035, pn)) * smoothstep(0.0, 0.04, foot);
          albedo = mix(paper, vec3(0.105, 0.088, 0.135), ink);
          albedo = mix(albedo, vec3(0.17, 0.14, 0.19) * (0.7 + 0.6 * fis), rough);
        }
      }`,
    };
    const opts = { map: tex, brush: 0.5, sway, extend: [light.dusk, barkExt], materials: { twig: { map: null, crisp: true, brush: 0.3, extend: [light.dusk, light.wet, hair] } } };
    const groups = [];
    for (const key of Object.keys(RANGE)) {
      const mine = trees.filter((t) => t.key === key);
      if (!mine.length) continue;
      const m = hairyAll(await kit.models(DIR + `birch_${key}.glb`, mine.map((t) => t.pl), opts));
      m.group.name = `birch_${key} x${m.count} (shared)`; groups.push(m.group);
    }
    removeStandIn(ctx, 'birch_A..E');

    // ---- the crown sprays (shared) and the snow on them (winter): hung on the limbs' own ends (birch.json), nine or
    // so on a tree of the front of the wood, two or three on one at the back
    const budget = kit.count(B.sprays), nearN = trees.filter((t) => t.near).length, farN = trees.length - nearN;
    const perNear = Math.min(12, Math.max(4, Math.floor((budget - farN * 2.6) / Math.max(1, nearN)))), lists = { A: [], B: [], C: [] }, sprayAt = [];
    const v3 = new THREE.Vector3(), d3 = new THREE.Vector3();
    for (const t of trees) {
      const anchors = info[`birch_${t.key}`].anchors, n = Math.min(anchors.length, t.near ? perNear + Math.floor(rnd() * 3) - 1 : 2 + Math.floor(rnd() * 2));
      const order = anchors.map((_, i) => i).sort((i, j) => hash1(i + t.s * 31, 3) - hash1(j + t.s * 31, 3));
      for (let q = 0; q < n; q++) {
        const [ax, ay, az, dx, dz, size] = anchors[order[q]];
        v3.set(ax, ay, az).applyMatrix4(t.m); d3.set(dx, 0, dz).transformDirection(t.m);
        const kk = size * (0.85 + 0.4 * rnd()) * t.k, key = 'ABC'[Math.floor(rnd() * 3) % 3];
        lists[key].push({ position: [v3.x, v3.y, v3.z], rotation: [(rnd() - 0.5) * 0.2, Math.atan2(-d3.z, d3.x) + (rnd() - 0.5) * 0.6, (rnd() - 0.5) * 0.16], scale: [kk, kk * (0.9 + 0.3 * rnd()), kk] });
        sprayAt.push([v3.x, v3.y, v3.z]);
      }
    }
    for (const key of ['A', 'B', 'C']) {
      const m = hairyAll(await kit.models(DIR + `birch_spray_${key}.glb`, lists[key], { crisp: true, brush: 0.3, sway, extend: [light.dusk, hair] }));
      m.group.name = `birch_spray_${key} x${m.count} (shared)`; groups.push(m.group); hairGroups.push(m.group);
      const sn = await kit.models(DIR + `birch_spray_snow_${key}.glb`, lists[key], { brush: 0.35, steps: 4, sway, extend: light.lift });
      sn.group.name = `birch_spray_snow_${key} x${sn.count} (winter)`; winter(sn.group); groups.push(sn.group); hairGroups.push(sn.group);
    }
    removeStandIn(ctx, 'birch crown sprays'); removeStandIn(ctx, 'snow on the birch sprays');

    // ---- seven old nests, as ink blots: each in a fork two thirds up a tree of the front rows
    const nests = [];
    for (const t of trees) {
      if (nests.length >= B.nests) break;
      if (!t.near || t.back > 26 || hash1(t.s * 17.3, 9) > 0.16) continue;
      const nq = info[`birch_${t.key}`].nest; v3.set(nq[0], nq[1], nq[2]).applyMatrix4(t.m);
      nests.push({ position: [v3.x, v3.y, v3.z], rotation: [0, rnd() * 6.283, 0], scale: [0.9 + 0.5 * rnd(), 0.9 + 0.4 * rnd(), 0.9 + 0.5 * rnd()] });
    }
    if (nests.length) {
      const m = hairyAll(await kit.models(DIR + 'nest.glb', nests, { crisp: true, brush: 0.3, sway, extend: [light.dusk, hair] }));
      m.group.name = `nest x${m.count} (shared)`; groups.push(m.group);
      const sn = await kit.models(DIR + 'nest_snow.glb', nests, { brush: 0.35, steps: 4, sway, extend: light.lift });
      sn.group.name = `nest_snow x${sn.count} (winter)`; winter(sn.group); groups.push(sn.group);
    }
    removeStandIn(ctx, 'old nests');

    // ---- the broken birch at (40, -10): the owl's perch, 5.5 m up. Its break is put exactly on the plan's point.
    {
      const pr = info.birch_broken.perch, ry = kit.faceAngle('channel', owl[0], owl[1] - 1.2), target = F.at(owl[0], owl[1], owl[2]);
      const off = v3.set(pr[0], 0, pr[2]).applyAxisAngle(new THREE.Vector3(0, 1, 0), ry);
      const position = [target.x - off.x, owl[2] - pr[1], target.z - off.z];
      const stub = await kit.model(DIR + 'birch_broken.glb', { position, rotation: [0, ry, 0], map: tex, brush: 0.5, extend: [light.dusk, barkExt], materials: { twig: { map: null, crisp: true, brush: 0.3, extend: [light.dusk, light.wet, hair] } } });
      stub.group.traverse((o) => { if (o.isMesh && o.material && o.material.defines && o.material.defines.CRISP !== undefined) hairy(o); });
      const sn = await kit.model(DIR + 'birch_broken_snow.glb', { position, rotation: [0, ry, 0], brush: 0.35, steps: 4, extend: light.lift });
      winter(sn.group); groups.push(stub.group, sn.group);
      removeStandIn(ctx, 'the broken birch');
      margins.owlPerch = stub.point('perch');
    }
    // the birch wood is not drawn beyond s 140 (page, section 9)
    // ... nor its sprays from further than 70 m (the wood's near edge is at s 58)
    updates.push(() => { const on = shared.here.s < 140, hair = shared.here.s < 128; for (const g of groups) g.visible = on && (hair || !hairGroups.includes(g)); });
    // FOR THE CAST: where every tree stands and how tall, every spray (powder sifts from them), the nests, the owl's perch
    margins.birches = { trees: trees.map((t) => ({ x: t.pl.position[0], y: t.pl.position[1], z: t.pl.position[2], key: t.key, near: t.near, top: t.pl.position[1] + info[`birch_${t.key}`].top * t.k })), sprays: sprayAt, nests: nests.map((n) => n.position), groups };
    count.birchesMargins = { trees: trees.length, near: nearN, sprays: sprayAt.length, nests: nests.length };
  });

  // ================================================================================================ the plain's furniture
  // Page (postcard 4, "the emptiest picture in the ride"): "a dotted line of fence posts running out, twelve pollards
  // ... in one tone of ink wash". Their silhouettes matter and their detail does not: both are drawn crisp, their thin
  // wood never thinner than a pixel. But the fence BEGINS 2.8 m behind the shelf at s 62: its first posts are the close band.
  // (third holder) The plain's furniture is drawn only while it can be seen: the fence from the cave's mouth (its first
  // post is 23 m from the bridge), the pollards from the bridge (s 44: 65 m off, through the wood and the river's
  // snowfall), both to the far side of the oldest tree (s 196: more than 160 m astern behind the orchard's rows).
  // About forty draw calls a frame less in the cave and from the pond on, eighteen in the river.
  const plainThings = [], fenceThings = [];
  updates.push(() => { const s = shared.here.s, on = s > 44 && s < 196, onF = s > 26 && s < 196; for (const g of plainThings) g.visible = on; for (const g of fenceThings) g.visible = onF; });
  await piece('pollards', async () => {
    const Pp = plan.pollards, F = shared.frame, rnd = ctx.rng(907), order = 'ABCBACCABACB', lists = { A: [], B: [], C: [] };
    const tints = ['#ffffff', '#ece8f0', '#f6f0ee', '#e6e2ee'], all = [];
    for (let i = 0; i < Pp.count; i++) {
      const u = i / (Pp.count - 1), s = Pp.from[0] + (Pp.to[0] - Pp.from[0]) * u + (rnd() - 0.5) * 2, d = Pp.from[1] + (Pp.to[1] - Pp.from[1]) * u + (rnd() - 0.5) * 2;
      // (second holder: each its own height, girth and lean. Twelve of three models, all plumb and within a seventh of one
      // size, were twelve of one drawing; an old pollard leans, and no two were lopped at the same height)
      const p = F.at(s, d), k = 0.78 + 0.5 * rnd(), wide = 0.85 + 0.4 * rnd();
      const pl = { position: [p.x, land.snowHeight(p.x, p.z, 50, -1) - 0.08 - 0.25 * (k < 0.9 ? 1 : 0), p.z], rotation: [(rnd() - 0.5) * 0.24, rnd() * 6.283, (rnd() - 0.5) * 0.24], scale: [wide * (0.9 + 0.2 * rnd()), k, wide * (0.9 + 0.2 * rnd())], tint: tints[i % tints.length] };
      lists[order[i % order.length]].push(pl); all.push(pl.position);
    }
    for (const key of ['A', 'B', 'C']) {
      const m = hairyAll(await kit.models(DIR + `pollard_${key}.glb`, lists[key], { crisp: true, brush: 0.5, extend: [light.dusk, light.wet], materials: { twig: { crisp: true, brush: 0.3, extend: [light.dusk, hair] } } }));
      m.group.name = `pollard_${key} x${m.count} (shared)`; plainThings.push(m.group);
      const sn = await kit.models(DIR + `pollard_${key}_snow.glb`, lists[key], { brush: 0.35, steps: 4, extend: light.lift });
      sn.group.name = `pollard_${key}_snow x${sn.count} (winter)`; winter(sn.group); plainThings.push(sn.group);
    }
    removeStandIn(ctx, 'pollard_A..C'); removeStandIn(ctx, 'snow on the pollards');
    margins.pollards = all;
  });

  await piece('fence', async () => {
    const Fe = plan.fence, F = shared.frame, rnd = ctx.rng(389), n = Fe.posts;
    const wireAt = await fetch('assets/' + DIR + 'plain.json').then((r) => { if (!r.ok) throw new Error('plain.json: ' + r.status); return r.json(); });
    const a0 = F.at(Fe.from[0], Fe.from[1]), a1 = F.at(Fe.to[0], Fe.to[1]), dir = new THREE.Vector3().subVectors(a1, a0).normalize(), along = Math.atan2(-dir.z, dir.x);
    const lists = { A: [], B: [], C: [], S: [] }, order = 'ABCBACABCACB', pass = [], v3 = new THREE.Vector3();      // (second holder: the first order, read with a stride of seven, never came to C: every post was A or B)
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1), s = Fe.from[0] + (Fe.to[0] - Fe.from[0]) * u, d = Fe.from[1] + (Fe.to[1] - Fe.from[1]) * u, p = F.at(s, d);
      const strain = i % Fe.strainerEvery === 0, key = strain ? 'S' : order[i % order.length];
      const y = land.snowHeight(p.x, p.z, Math.max(0.4, -d - plan.shelfLeft(s)), -1) - (strain ? 0.02 : 0.03 * rnd());
      // a strainer's stay runs along the fence, toward the posts it holds (the last one's runs back)
      const ry = strain ? along + (i >= n - 3 ? Math.PI : 0) : along + (rnd() - 0.5) * 0.4, k = 0.92 + 0.18 * rnd();
      const pl = { position: [p.x, y, p.z], rotation: [(rnd() - 0.5) * (strain ? 0.05 : 0.12), ry, (rnd() - 0.5) * (strain ? 0.05 : 0.12)], scale: [strain ? 1 : 0.9 + 0.25 * rnd(), strain ? 0.95 + 0.1 * rnd() : k, strain ? 1 : 0.9 + 0.25 * rnd()], tint: ['#ffffff', '#ebe6ee', '#f4efec'][i % 3] };
      lists[key].push(pl);
      const w = wireAt[strain ? 'strainer_post' : `fence_post_${key}`].wire;
      pass.push(v3.set(w[0], w[1], strain && i >= n - 3 ? w[2] : w[2]).applyMatrix4(matrixOf(pl)).clone());
    }
    const post = { crisp: true, brush: 0.5, extend: [light.dusk, hair] }, snowOpt = { brush: 0.35, steps: 4, extend: light.lift };
    for (const key of ['A', 'B', 'C']) {
      const m = await kit.models(DIR + `fence_post_${key}.glb`, lists[key], post); m.meshes.forEach(hairy); m.group.name = `fence_post_${key} x${m.count} (shared)`; fenceThings.push(m.group);
      const c = await kit.models(DIR + `fence_cap_${key}.glb`, lists[key], snowOpt); c.group.name = `fence_cap_${key} x${c.count} (winter)`; winter(c.group); fenceThings.push(c.group);
    }
    { const m = await kit.models(DIR + 'strainer_post.glb', lists.S, post); m.meshes.forEach(hairy); m.group.name = `strainer_post x${m.count} (shared)`; fenceThings.push(m.group);
      const c = await kit.models(DIR + 'strainer_snow.glb', lists.S, snowOpt); c.group.name = `strainer_snow x${c.count} (winter)`; winter(c.group); fenceThings.push(c.group); }
    // ---- the wire: one strand through every staple, sagging between them (it carries the hoar's weight), drawn as an
    // ink hair (shared); and the hoar on it (winter): lumps of rime strung along it, so that the line is dotted pale and dark
    const wire = { pos: [], nor: [], uv: [], idx: [] }, hoar = { pos: [], nor: [], uv: [], col: [], idx: [] };
    const tube = (t, pts, rad, sides, colr) => {
      const up = new THREE.Vector3(0, 1, 0), T = new THREE.Vector3(), N = new THREE.Vector3(), Bn = new THREE.Vector3(), base = t.pos.length / 3;
      pts.forEach((p, i) => {
        T.subVectors(pts[Math.min(pts.length - 1, i + 1)], pts[Math.max(0, i - 1)]).normalize(); N.crossVectors(up, T).normalize(); Bn.crossVectors(T, N);
        const r = typeof rad === 'number' ? rad : rad[i];
        for (let k = 0; k < sides; k++) { const a = k / sides * 6.2832, cx = Math.cos(a), sx = Math.sin(a); t.pos.push(p.x + (N.x * cx + Bn.x * sx) * r, p.y + (N.y * cx + Bn.y * sx) * r, p.z + (N.z * cx + Bn.z * sx) * r); t.nor.push(N.x * cx + Bn.x * sx, N.y * cx + Bn.y * sx, N.z * cx + Bn.z * sx); t.uv.push(r, 0); if (colr) t.col.push(colr[0] * (sx < -0.3 ? 0.86 : 1), colr[1] * (sx < -0.3 ? 0.86 : 1), colr[2]); }
        if (i) for (let k = 0; k < sides; k++) { const k2 = (k + 1) % sides, A = base + (i - 1) * sides + k, B = base + (i - 1) * sides + k2, Cc = base + i * sides + k2, D = base + i * sides + k; t.idx.push(A, B, Cc, A, Cc, D); }
      });
    };
    const frost = col(C.frost);
    for (let i = 0; i < n - 1; i++) {
      const A = pass[i], B = pass[i + 1], sag = 0.03 + 0.045 * rnd(), pts = [];      // (third holder: a strained wire under hoar sags a hand at the most; at 7 to 14 cm it hung in garlands)
      for (let j = 0; j <= 6; j++) { const t = j / 6; pts.push(new THREE.Vector3().lerpVectors(A, B, t).add(v3.set(0, -sag * 4 * t * (1 - t), 0))); }
      tube(wire, pts, 0.003, 3, null);
      let t = 0.04 + 0.1 * rnd();
      while (t < 0.94) {                                                    // rime: lumps a hand long, thickest in their middle, hanging a little under the wire
        const len = (0.07 + 0.12 * rnd()) / A.distanceTo(B), tm = t + len / 2, t1 = Math.min(0.97, t + len), thick = 0.012 + 0.014 * rnd();
        const at = (q) => new THREE.Vector3().lerpVectors(A, B, q).add(v3.set(0, -sag * 4 * q * (1 - q) - 0.006, 0));
        tube(hoar, [at(t), at(tm), at(t1)], [0.004, thick, 0.004], 4, [frost.r, frost.g, frost.b]);
        t = t1 + (0.03 + 0.2 * rnd() * rnd()) / A.distanceTo(B) * 2.7;
      }
    }
    const geo = (t) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(t.pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(t.nor, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(t.uv, 2)); if (t.col) g.setAttribute('color', new THREE.Float32BufferAttribute(t.col, 3)); g.setIndex(t.idx); return g; };
    const wireMesh = hairy(new THREE.Mesh(geo(wire), kit.gouache({ color: C.inkPaint, brush: 0.2, crisp: true, extend: [light.dusk, hair] })));
    wireMesh.name = 'the fence wire (shared)'; wireMesh.frustumCulled = false; ctx.add(wireMesh); fenceThings.push(wireMesh);
    const hoarMesh = hairy(new THREE.Mesh(geo(hoar), kit.gouache({ color: '#ffffff', vertexColors: true, brush: 0.2, crisp: true, extend: hair })));
    hoarMesh.name = 'hoar on the fence wire (winter)'; hoarMesh.frustumCulled = false; winter(ctx.add(hoarMesh)); fenceThings.push(hoarMesh);
    removeStandIn(ctx, 'fence posts and strainer_post'); removeStandIn(ctx, 'fence post caps'); removeStandIn(ctx, 'fence wire under hoar');
    margins.fence = { posts: pass };
    count.fenceMargins = { posts: n, wire: wire.idx.length / 3, hoar: hoar.idx.length / 3 };
  });

  return { update(dt) { for (const u of updates) u(dt); } };
}
