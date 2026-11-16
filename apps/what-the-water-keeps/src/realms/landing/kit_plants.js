// The landing: the plants of the margins and of the water's surface (stage 2, the Plants group).
// docs/art/landing.md, section 3 (the close band) and section 9 (kit pieces); log: docs/build/landing/2-kit-plants.md.
//
//   reedmace       166 clumps of three models (reedmace_a, _b, _c) in nine stands at the layout's places (PLAN.reedmace):
//                  brown velvet heads, one in four bursting into down, last year's leaves broken among this year's
//   the lamp tuft  twenty clumps of its own dark, broad-leaved model (reedmace_tuft) by PLAN.tuft: what the kept lamp is
//                  seen against by day. No backlight, no rim, not lit by the lamp or the sun. Not to be made prettier
//   yellow flag    22 clumps of two models (iris_a, _b): along the right margin in the shallow water before the reeds,
//                  at the staithe's ends, at the jetty's root: fans of sword leaves, a few low yellow flowers
//   water lilies   260 pads in three rafts (A 190, B 40, C 30), three modelled leaves (lily_pad_a, _b, _c), each on its
//                  own stalk, which rises to it from its plant's crown on the bed like a slack rope; 14 buds, 4 flowers
//                  shutting for the evening; young leaves still rolled, under the surface. The pads ARE the ride's
//                  floaters (src/engine/life/floaters.js): they rock on every ring, make way for the hull and close in
//                  behind it over six seconds; their stalks make way with them (the same lane, the same numbers); buds
//                  and flowers nod on the same rings. A leaf's paint is HERE and not in its model (leafPaint3, sheen3:
//                  forked veins, the leaf's age, and the sky it gives back as a leathery thing lying on the water does)
//
// Models: source-art/models/landing/{reedmace,iris,lily}.py -> assets/models/landing/*.glb. No textures: vertex paint
// under the area's own light (shared.landing: the shade of the reeds and the cloth, the rim, the wind).
// Motion that belongs to standing things is here: the wind (L.plant's), leaning from the hull, a shiver when a wake
// reaches the foot (awayFromHull, below), the pads on the ripple field (the floaters'), the stalks' slow sway.
//
// The stand-ins of all of these were in kit.js (the Reeds group's): they are taken out from here, once the real things
// stand, with removeStandIn ('reedmace', 'lamp tuft', 'iris', 'lily') (the Reeds group has since deleted their blocks:
// the calls find nothing now and are harmless), and shared.kit.reedmace, .stands, .tuft, .iris, .pads { meshes, rafts }
// and .buds are set in the same shapes, with more in them (the log lists all of it).
//
// Developer switches: &lane=1 lays the turned lane (eighteen pads of raft B bronze side up; &lane=0.8 also sets them
// rocking); &padlook=2 shows the pads in their earlier paint (to compare); &plantsonly=reedmace,iris,lily builds some
// of it; &plantsdebug=1 prints where the buds, flowers and young leaves stand; &skip=kit_plants leaves all of it out.
import * as THREE from 'three';
import { removeStandIn } from '../../engine/modules.js';

const TAU = Math.PI * 2;
const lerp = (a, b, t) => a + (b - a) * t;
const QS = new URLSearchParams(typeof location !== 'undefined' ? location.search : '');

// ---- the group's own numbers (PLAN.plants in plan.js, if it is there, has the last word)
const NUMBERS = {
  reedmace: {
    // a stand is an oval of clumps: `along` and `across` are its half lengths, metres. On the right bank it stands in
    // the reeds' foot and a metre out into the water (`out`: how far its middle lies inside the channel's edge); the
    // boat is kept off it by a row of circles (colliders). On the left it stands 0.85 m OUTSIDE the edge, as the
    // layout put it, so that the stand of s 45 leaves the heron's sight line open.
    along: 2.3, across: 0.85, out: 0.15, leftOut: 0.85, apart: 0.46,
    collide: { at: [-1.5, 0, 1.5], inside: 0.25, r: 0.85 },
    lean: 0.075,                               // radians a clump may lean
    fringe: 0.17,                              // radians more a clump at a stand's fringe leans out of it (its neighbours' leaves cross)
    backlight: 0.3,                            // the page: reedmace heads 0.3
    tints: ['#ffffff', '#f4ecd6', '#e9e2c2', '#fff4dc', '#ded8be', '#f2e4c4'],
  },
  iris: {
    // along the right bank: how many, and how far outside the channel's edge they stand. The reeds' outermost stems stand
    // at -0.3: as first placed (-0.15 to 0.3) every iris stood INSIDE the reeds' front rank and could not be found;
    // they stand in the shallow water before it now, where flag iris grows (the hull's side reaches -0.2: they lean from it)
    margin: 17, e: [-0.62, -0.32],
    // the page's others: both ends of the staithe, the jetty root (and the layout's two at the head of the backwater).
    // [s, d]. (The layout stood the one at the staithe's lower end at (20.0, -9.7), under the gangway's plank, and the
    // one at the jetty's root at (29.3, -15.3), in the middle of its end: here they stand beside those timbers.)
    at: [[7.6, -9.5], [20.45, -10.45], [29.98, -15.3], [0.4, -8.9], [1.6, -9.1]],
    backlight: 0.5,                            // the page: iris leaves 0.5
    tall: 0.6,
    tints: ['#ffffff', '#f2ecd8', '#e6e6cc', '#fff6e0', '#e0dcc4'],
  },
  // what stands near the hull leans away from it. room: clear room beyond the hull's half width AT THE WATERLINE (the
  // toolkit's number, 0.42 m: the gunwale is 0.35 m wider than that, and the stem rakes forward of it); reach: how far
  // out the leaning is still felt; shiver: metres a wake at its foot makes its top shiver
  hull: { room: 0.42, reach: 0.9, shiver: 0.014 },
  lily: {
    // raft C is the page's (s 1 to 8, d -8 to -2), and runs on down the water to the rider's right hand at the mooring
    // (the director's note): most of its thirty pads lie there, in groups. A group is { s, d (its bounds), crowns:
    // [[s, d], ...] (its plants), reach, and either pads: n (strewn round the crowns) or set: [[s, d, size, variant],
    // ...] (leaves put down one by one) }. buds: [[s, d, size], ...]. PLAN.plants.lily.tailC has the composed list: the
    // foot of the title view is laid out leaf by leaf there.
    tailC: { reach: [0.3, 1.15], groups: [{ s: [11.4, 19.4], d: [-5.9, -2.3], pads: 16, crowns: [[13.3, -4.6], [16.4, -4.95], [18.3, -3.5]] }], buds: [[16.95, -5.5], [15.55, -4.15]] },
    crown: 9,                                  // pads to a plant, about
    reach: [0.32, 1.5],                        // metres a leaf lies from its plant's crown
    stroke: 0.7,                               // metres of clear water kept either side of the line from the mooring's eye to the kept lamp
    buds: { A: 7, B: 3, C: 4 }, flowers: { A: 2, B: 1, C: 1 },
    tone: 0.74,                                // how light the pads' paint is drawn (0.9 as first made: a raft of one fresh green, lighter than the water it lay on)
    sheen: ['#CC9C4A', 3.0, 0.62, '#8C8058'],   // (the second look's, kept for &padlook=2) the sky a level leaf gives back at a glancing angle: its colour toward the sun, how glancing, how much, its colour away from the sun (the putty east)
    // THE SKY ON THE LEAVES (the third look: the leaves' own light, laid on after the area's). Nearly all of this water
    // lies in shade under a bright sky, and a leaf lying flat there is lit by that sky and gives it back:
    //   gloss   what a leaf's own leathery face gives back: [seen from straight above, added at a glancing angle, how glancing (a power)]
    //   film    the same for the FILM OF WATER that lies in a leaf's hollows (round the stalk's join, along the cleft, in a
    //           dip or two): it gives the sky back as the water round the leaf does, so a leaf seen against the light is
    //           olive with pieces of the gold water lying on it, and never one flat green
    //   wet     [share of the leaves with a pool at the stalk, share with a dip or two elsewhere]
    //   sky     [the low western sky as a multiple of the fog's colour (which is the sky's at the horizon), the western sky
    //           higher up, the east], typed so as to be SHOWN as the sky is (docs/build/landing/display.py)
    //   vein    [how broad the veins are drawn (1 = the second look's hairs, which the painter's filter wiped a metre off), how plainly]
    //   pucker  a leaf is not a sheet of glass: [it stands up a little along every vein and sags between, so each panel
    //           between two veins gives back its own piece of sky: the fan of a leaf seen against the light; and the whole
    //           leaf lies in two or three slow swells of its own, so that one part of it is gold and another olive] (radians of tilt)
    gloss: [0.04, 0.7, 3.0], film: [0.1, 0.9, 3.0], wet: [0.0, 0.3], sky: ['#AC6C24', '#B98B48', '#736C51'], vein: [2.0, 0.9], pucker: [0.14, 0.22],
    top: { a: ['#ffffff', '#f4f0da', '#e8eed0', '#fff6e0', '#ece6c8'], b: ['#fff2dc', '#f6e8cc', '#ffeed4', '#efe2c2'], c: ['#f4ecd0', '#e9e2c2', '#fbf2d6', '#ddd6b6'] },
    // bronze beneath. The page's chip is #7A4424: typed so, the area's warm light and its final pass SHOW it as a bright
    // rust (#B95B22, measured on the turned lane). As typed here they are shown as #6A3A1E to #7C4220 on the turned lane
    // in the backwater's shade (the second holder's, a step darker, came out #512915 to #733D1C after the light's last changes)
    under: ['#5E3A2A', '#533224', '#66442E'],
    shootDepth: [0.04, 0.2],                  // metres under the surface the tips of the young leaves stand
    shutIn: 120,                               // seconds after load in which the four flowers finish closing (the page)
    nod: [5.0, 0.32],                          // a bud or a flower on a ring: how many times the water's slope it leans, and the most (rise per metre)
    cream: '#E6DAC2',                          // over the flowers' paint: cream, never paper white (they are the palest things on the water)
    lane: 18,                                  // the pads of the turned lane (the cast's and the staging's to turn: shared.kit.pads.lane)
  },
};

// ---- adding to a gouache material after it has been made (the floaters make their own, and so does L.plant): the
// same thing kit.gouache's `extend` does, at the same marks, which gouache leaves in its shaders
const HOOKS_V = ['vertexPars', 'vertexLocal', 'vertexWorld'], HOOKS_F = ['fragmentPars', 'albedo', 'light', 'fog', 'final'];
function extendMaterial(mat, ...exts) {
  for (const ex of exts.flat()) {
    if (!ex) continue;
    for (const h of HOOKS_V) if (ex[h]) { if (!mat.vertexShader.includes(`//@${h}`)) throw new Error(`kit_plants: gouache has no mark ${h}`); mat.vertexShader = mat.vertexShader.replace(`//@${h}`, `${ex[h]}\n    //@${h}`); }
    for (const h of HOOKS_F) if (ex[h]) { if (!mat.fragmentShader.includes(`//@${h}`)) throw new Error(`kit_plants: gouache has no mark ${h}`); mat.fragmentShader = mat.fragmentShader.replace(`//@${h}`, `${ex[h]}\n    //@${h}`); }
    if (ex.defines) Object.assign(mat.defines, ex.defines);
    if (ex.uniforms) Object.assign(mat.uniforms, ex.uniforms);
  }
  mat.needsUpdate = true;
  return mat;
}

export async function build(ctx, plan, shared) {
  const { path, kit } = ctx, P = plan, L = shared.landing;
  if (!L) throw new Error('kit_plants needs shared.landing (light.js)');
  const K = shared.kit || (shared.kit = {});
  const over = P.plants || {};
  const N = { reedmace: { ...NUMBERS.reedmace, ...(over.reedmace || {}) }, iris: { ...NUMBERS.iris, ...(over.iris || {}) }, hull: { ...NUMBERS.hull, ...(over.hull || {}) }, lily: { ...NUMBERS.lily, ...(over.lily || {}) } };
  const counts = shared.counts || (shared.counts = {});
  const A = (s, d, y = 0) => P.at(path, s, d, y);
  const loc = {}, gq = {}, fr = {};
  const where = (x, z) => path.locate(x, z, null, loc);
  const groundY = (x, z) => P.ground(path, x, z, gq).y;
  const hw = (s) => L.frame(s, fr).halfWidth;
  /** The geometry of a modelled piece (its file is fetched once, counted and freed with the realm, like any model). */
  const piece = async (name) => {
    const m = await kit.model(`models/landing/${name}.glb`, {});
    m.group.removeFromParent();
    for (const mat of Object.values(m.materials)) mat.dispose();
    return m.body.geometry;
  };
  const made = [], updates = [];                                 // everything this module adds; what it does every frame

  // ---- many copies of one modelled piece, each with its own place, turn, lean, size and tint: one draw call
  const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3(), _s = new THREE.Vector3(), _c = new THREE.Color();
  const grow = (name, geometry, material, list, o = {}) => {
    const mesh = new THREE.InstancedMesh(geometry, material, list.length);
    list.forEach((it, i) => {
      const sc = it.scale ?? 1, sx = Array.isArray(sc) ? sc : [sc, sc, sc];
      _e.set(it.tiltX ?? 0, it.turn ?? 0, it.tiltZ ?? 0, 'YXZ'); _q.setFromEuler(_e);
      if (it.lean) _q.premultiply(_q2.setFromAxisAngle(_v.set(it.lean[1], 0, -it.lean[0]).normalize(), it.lean[2]));      // lean: [x, z, radians]: it leans that way by so much, whatever its turn
      mesh.setMatrixAt(i, _m.compose(_v.set(it.x, it.y ?? 0, it.z), _q, _s.set(sx[0], sx[1], sx[2])));
      mesh.setColorAt(i, _c.set(it.color ?? '#ffffff'));
    });
    mesh.instanceMatrix.needsUpdate = true; mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere(); mesh.boundingSphere.radius += o.margin ?? 1.2;
    mesh.name = name;
    if (o.mirror === false) ctx.only(mesh, 'direct');
    ctx.add(mesh); made.push(mesh);
    counts[name] = { count: list.length, triangles: Math.round(list.length * geometry.index.count / 3) };
    return mesh;
  };
  const top = (geometry) => { if (!geometry.boundingBox) geometry.computeBoundingBox(); return geometry.boundingBox.max.y; };

  // ---- what stands near the hull leans away from it, and shivers when a wake reaches its foot (the page, cast row 10
  // and 12). The hull is the toolkit's (lifeHull: a line from stern to stem and a half width, as the water has it).
  // Everything within `reach` of the hull's room is drawn outward, the more the higher it stands above the water, so
  // that nothing is ever inside the boat and nothing is pressed flat against it.
  let hull = null;
  try { hull = (await import('../../engine/life/falls.js')).lifeHull(ctx); } catch (err) { console.error('landing/kit_plants: the hull is not known (src/engine/life/falls.js): plants will not lean from it: ' + ((err && err.message) || err)); }
  const awayFromHull = (o = {}) => (hull ? {
    uniforms: { uLifeHull: hull.uniforms.uLifeHull, uLifeHullB: hull.uniforms.uLifeHullB, uPlHull: { value: new THREE.Vector4(o.room ?? N.hull.room, o.reach ?? N.hull.reach, o.shiver ?? N.hull.shiver, o.from ?? 0.08) } },
    // (plFloat: a point that floats. A model's dead leaf lying on the water has its floating points at y = 0.012
    // exactly (reedmace.py): they stay on the water however the clump is leant and stretched, and make way whole)
    vertexPars: /* glsl */`uniform vec4 uLifeHull, uLifeHullB, uPlHull; uniform sampler2D tRipple; uniform vec4 uRippleRect; float plFloat;`,
    vertexLocal: /* glsl */`plFloat = 1.0 - step(0.0006, abs(position.y - 0.012));`,
    vertexWorld: /* glsl */`
      { wp.y = mix(wp.y, 0.012, plFloat);
        vec2 hA = uLifeHull.xy, hAB = uLifeHull.zw - uLifeHull.xy;
        float hT = clamp(dot(wp.xz - hA, hAB) / max(dot(hAB, hAB), 1.0e-4), -0.1, 1.25);
        vec2 hD = wp.xz - (hA + hAB * hT); float hLen = length(hD), hR = uLifeHullB.x + uPlHull.x, hOut = hR + uPlHull.y;
        float hUp = max(smoothstep(-0.3, uPlHull.w, wp.y), plFloat);
        if (hLen < hOut) wp.xz += (hLen > 1.0e-3 ? hD / hLen : normalize(vec2(hAB.y, -hAB.x) + vec2(1.0e-5, 0.0))) * (hR * (1.0 - hLen / hOut) * hUp);
        // a wake at its foot: the stem is rocked, and its top shivers
        #ifdef USE_INSTANCING
          vec2 hRoot = (modelMatrix * vec4(instanceMatrix[3].xyz, 1.0)).xz;
        #else
          vec2 hRoot = modelMatrix[3].xz;
        #endif
        vec2 hUv = (hRoot - uRippleRect.xy) / uRippleRect.zw + 0.5, hE = min(hUv, 1.0 - hUv);
        if (min(hE.x, hE.y) > 0.0) {
          vec4 hW = texture2D(tRipple, hUv) * smoothstep(0.0, 0.08, min(hE.x, hE.y));
          float hTall = smoothstep(0.0, 0.9, wp.y) * (1.0 - plFloat);
          float hJ = fract(sin(dot(hRoot, vec2(41.3, 17.9))) * 9631.7), hK = clamp(hW.a * 1.5, 0.0, 1.0) * hTall;
          wp.xz += clamp(hW.xy, -0.3, 0.3) * (0.22 * hTall) + vec2(sin(uTime * 11.3 + hJ * 50.0), cos(uTime * 9.7 + hJ * 37.0)) * (uPlHull.z * hK);
        } }`,
  } : null);

  // ============================================================================================ reedmace
  // (&plantsonly=reedmace,iris,lily: a developer's switch, for measuring what each costs)
  const ONLY = QS.get('plantsonly'), want = (k) => !ONLY || ONLY.split(',').includes(k);
  const stands = want('reedmace') ? await reedmace() : [];

  async function reedmace() {
    const M = P.reedmace, T = P.tuft, R = N.reedmace, rnd = ctx.rng(186);
    const geo = { a: await piece('reedmace_a'), b: await piece('reedmace_b'), c: await piece('reedmace_c'), tuft: await piece('reedmace_tuft') };
    const lists = { a: [], b: [], c: [] }, stands = [], all = [];
    const spots = [...M.right.map((s) => [s, 1]), ...M.left.map((s) => [s, -1])], per = Math.round((M.total - T.clumps) / spots.length);
    // how many clumps to a stand: 12 to 24, no two stands alike, the page's 186 in all with the tuft's twenty
    const sizes = spots.map(() => Math.max(M.clumps[0], Math.min(M.clumps[1], per + Math.round((rnd() - 0.5) * 8))));
    for (let k = 0, want = M.total - T.clumps; k < 200 && sizes.reduce((a, b) => a + b, 0) !== want; k++) { const i = (k * 4) % sizes.length, up = sizes.reduce((a, b) => a + b, 0) < want; if (up ? sizes[i] < M.clumps[1] : sizes[i] > M.clumps[0]) sizes[i] += up ? 1 : -1; }
    for (const [j, [s, side]] of spots.entries()) {
      // (the left stands grow just outside the channel's edge: a stand on the edge at s 45 hides the heron from the mooring)
      const d0 = side > 0 ? hw(s) - R.out : s < 2 ? -8.6 : -(hw(s) + R.leftOut), n = sizes[j];
      const mine = [], [cx, , cz] = A(s, d0);
      for (let i = 0, tries = 0; i < n && tries < n * 200; tries++) {
        const a = rnd() * TAU, r = Math.sqrt(rnd()), ds = Math.cos(a) * r * R.along, dd = Math.sin(a) * r * R.across, [x, , z] = A(s + ds, d0 + dd);
        if (mine.some((c) => Math.hypot(c.x - x, c.z - z) < (tries < n * 120 ? R.apart : R.apart * 0.8))) continue;
        if (P.inLead(path, x, z)) continue;
        // the tallest stand in the middle and toward the bank, the short ones at the fringe and out in the water
        const inner = 1 - r, toBank = side > 0 ? dd / R.across : -dd / R.across, k = Math.min(1, Math.max(0, 0.25 + 0.55 * inner + 0.2 * toBank + (rnd() - 0.5) * 0.4));
        const height = lerp(M.height[0], M.height[1], k);
        // no two neighbours share a model and a turn: the nearest clump's model is never taken again
        let near = null, nd = 1e9; for (const c of mine) { const dist = Math.hypot(c.x - x, c.z - z); if (dist < nd) { nd = dist; near = c; } }
        const order = ['a', 'b', 'c', 'a', 'c', 'b'], variant = order.map((v, j) => order[(i + j) % 6]).find((v) => !near || v !== near.variant);
        const sy = height / top(geo[variant]), sxz = sy * (0.86 + 0.3 * rnd());
        // (a stand is not a comb: besides its own small tilt, a clump leans OUT of the stand, the more the nearer the
        // fringe it stands, each by its own amount, so that neighbours' leaves cross; the amount comes from the
        // clump's place and not from the random source, so that nothing else of the stand has moved)
        const oh = Math.abs(Math.sin(x * 12.9898 + z * 78.233) * 43758.5453) % 1, ox = x - cx, oz = z - cz, ol = Math.hypot(ox, oz) || 1;
        const it = { x, y: 0, z, turn: rnd() * TAU, tiltX: (rnd() - 0.5) * 2 * R.lean, tiltZ: (rnd() - 0.5) * 2 * R.lean, scale: [sxz, sy, sxz * (0.9 + 0.2 * rnd())], color: R.tints[Math.floor(rnd() * R.tints.length)], variant, height, stand: stands.length,
          lean: [ox / ol, oz / ol, R.fringe * r * (0.25 + 0.75 * oh)] };
        mine.push(it); lists[variant].push(it); all.push(it); i++;
      }
      const stand = { s, d: d0, n: mine.length, side, x: cx, z: cz, top: [cx, 2.2, cz], clumps: mine };
      stands.push(stand);
      // the boat is kept off a stand that reaches into its water
      if (side > 0 && s > 2) for (const off of R.collide.at) { const [x, , z] = A(s + off, hw(s + off) - R.collide.inside); ctx.addCollider({ x, z, r: R.collide.r }); }
    }
    const paint = extendMaterial(L.plant({ tall: 2.6, backlight: R.backlight }), awayFromHull());
    const meshes = ['a', 'b', 'c'].map((v) => grow(`reedmace ${v}`, geo[v], paint, lists[v]));

    // ---- the lamp tuft: the one dark thing in the open water, directly behind the lamp as the mooring sees it. It is
    // what the kept lamp is seen AGAINST by day (the page, section 2; 1-layout.md, A): it must be DARK and it must be
    // WHOLE where the line of sight through the lantern crosses it, 2.45 m up. So it is grown 3.0 to 3.4 m (PLAN.tuft),
    // of its own model (broad dark leaves, thirty-five to a clump), with no backlight and no rim; the kept lamp does
    // not light it (lampless) and neither does the sun (shaded). Nothing here is to be made prettier.
    const tuft = [];
    for (let i = 0; i < T.clumps; i++) {
      const a = i * 2.39996, r = Math.sqrt((i + 0.5) / T.clumps), [x, , z] = A(T.at[0] + Math.cos(a) * r * T.along / 2, T.at[1] + Math.sin(a) * r * T.across / 2);
      const k = lerp(T.tone[0], T.tone[1], rnd()), sy = lerp(T.height[0], T.height[1], rnd()) / top(geo.tuft), sxz = sy * (0.92 + 0.2 * rnd());
      // (the outer clumps lean out a little, so that the tuft's outline is a clump's and not a brush's; its middle stands)
      const [mx, , mz] = A(T.at[0], T.at[1]), ox = x - mx, oz = z - mz, ol = Math.hypot(ox, oz) || 1;
      tuft.push({ x, y: 0, z, turn: rnd() * TAU, lean: [ox / ol, oz / ol, 0.02 + 0.11 * r * r + 0.03 * rnd()], scale: [sxz, sy, sxz], color: new THREE.Color(k, k * (0.96 + 0.06 * rnd()), k * (0.9 + 0.12 * rnd())) });
    }
    const dark = extendMaterial(L.plant({ tall: 3.2, backlight: 0, rim: T.rim, lampless: true, shaded: true }), awayFromHull());
    const tuftMesh = grow('lamp tuft', geo.tuft, dark, tuft);

    removeStandIn(ctx, 'reedmace');                               // kit.js: 'reedmace a', 'reedmace b'
    removeStandIn(ctx, 'lamp tuft');
    counts.reedmace = { count: all.length + tuft.length, stands: stands.map((st) => st.n) };
    // for the cast (seed down leaves the stands in puffs; mayflies dance by the tuft): the same shapes kit.js gave
    K.reedmace = [...meshes, tuftMesh];
    K.stands = stands;                                           // { s, d, n, side, x, z, top: [x, y, z], clumps: [{ x, z, height, variant, ... }] }
    K.tuft = { at: A(T.at[0], T.at[1], 0), list: tuft, mesh: tuftMesh };
    return stands;
  }

  // ============================================================================================ yellow flag iris
  if (want('iris')) await iris();

  async function iris() {
    const I = P.iris, R = N.iris, rnd = ctx.rng(22);
    const geo = { a: await piece('iris_a'), b: await piece('iris_b') }, lists = { a: [], b: [] }, all = [];
    const clumps = stands.flatMap((st) => st.clumps);
    const put = (s, d, i) => {
      let [x, , z] = A(s, d);
      // never in a reedmace clump: step along the bank until it stands free
      for (let k = 0; k < 8 && clumps.some((c) => Math.hypot(c.x - x, c.z - z) < 0.42); k++) { s += 0.45; [x, , z] = A(s, d); }
      const variant = i % 2 ? 'b' : 'a', sy = lerp(I.height[0], I.height[1], rnd()) / top(geo[variant]), sxz = sy * (0.9 + 0.25 * rnd());
      const it = { x, y: Math.min(0, Math.max(-0.12, groundY(x, z) + 0.2)), z, s, d, turn: rnd() * TAU, tiltX: (rnd() - 0.5) * 0.12, tiltZ: (rnd() - 0.5) * 0.12, scale: [sxz, sy, sxz], color: R.tints[Math.floor(rnd() * R.tints.length)], variant };
      lists[variant].push(it); all.push(it);
    };
    for (let i = 0; i < R.margin; i++) { const s = I.s[0] + (I.s[1] - I.s[0]) * (i + rnd() * 0.8) / R.margin; put(s, hw(s) + lerp(R.e[0], R.e[1], rnd()), i); }
    R.at.slice(0, Math.max(0, I.count - R.margin)).forEach(([s, d], i) => put(s, d, R.margin + i));
    // (tall: the height over which the area's plant paint lightens a plant from its dark foot: a flag's foot is its lowest hand, not its lower half)
    const paint = extendMaterial(L.plant({ tall: R.tall, backlight: R.backlight }), awayFromHull());
    const meshes = ['a', 'b'].map((v) => grow(`iris ${v}`, geo[v], paint, lists[v], { margin: 0.6 }));
    removeStandIn(ctx, 'iris');                                   // kit.js: 'iris'
    delete counts.iris;                                           // (the stand-in's entry)
    K.iris = meshes; K.irisList = all;
  }

  // ============================================================================================ water lilies
  // (if the toolkit that floats them cannot be loaded, the margins above still stand and kit.js's stand-in lilies stay)
  if (want('lily')) try { await lilies(); } catch (err) { console.error('INVALID_MODULE landing/kit_plants: the water lilies could not be made and the stand-ins are left: ' + ((err && err.stack) || err)); }

  async function lilies() {
    const Y = N.lily, Pd = P.pads, rnd = ctx.rng(260);
    // ---- the toolkit that floats them (loaded here and not at the top of the file, so that the day it does not
    // load the margins still stand)
    const { makeFloaters, LANE_GLSL, PAD_HUB } = await import('../../engine/life/floaters.js');
    if (!hull) throw new Error('the hull is not known (src/engine/life/falls.js)');

    // ---- where the rafts lie. A raft is a few plants; a plant is a crown on the bed and the leaves that have
    // risen from it, each lying within a stalk's length of it with its notch turned back toward it.
    const eye = A(P.title.s - 0.45, P.title.d), lamp = A(P.lamp.at[0], P.lamp.at[1]);
    const nearStroke = (x, z, r) => {                             // the lamp's stroke lies from the jetty to the bow: keep it clear
      const ax = lamp[0] - eye[0], az = lamp[2] - eye[2], t = Math.min(1, Math.max(0, ((x - eye[0]) * ax + (z - eye[2]) * az) / (ax * ax + az * az)));
      return Math.hypot(x - eye[0] - ax * t, z - eye[2] - az * t) < Y.stroke + r;
    };
    const tuft = P.tuft;
    const blocked = (x, z, r) => {
      if (nearStroke(x, z, r)) return true;
      const q = where(x, z);
      for (const st of stands) if (((q.s - st.s) / (N.reedmace.along + 0.3 + r)) ** 2 + ((q.d - st.d) / (N.reedmace.across + 0.35 + r)) ** 2 < 1) return true;       // a reedmace stand
      if (Math.abs(q.s - tuft.at[0]) < tuft.along / 2 + 0.5 + r && Math.abs(q.d - tuft.at[1]) < tuft.across / 2 + 0.5 + r) return true;   // the lamp tuft
      return false;
    };
    const tailGroups = Y.tailC.groups || [], tailPads = tailGroups.reduce((n, g) => n + (g.set ? g.set.length : g.pads), 0);
    const regions = {
      A: [{ s: Pd.A.s, d: (s) => [Pd.A.d[0], hw(s) - 0.7], pads: Pd.A.count, crowns: Math.round(Pd.A.count / Y.crown) }],
      B: [{ s: Pd.B.s, d: () => Pd.B.d, pads: Pd.B.count, crowns: Math.round(Pd.B.count / Y.crown) }],
      C: [{ s: Pd.C.s, d: () => Pd.C.d, pads: Pd.C.count - tailPads, crowns: Math.max(1, Math.round((Pd.C.count - tailPads) / Y.crown)) },
        ...tailGroups.map((g) => ({ s: g.s, d: () => g.d, pads: g.set ? g.set.length : g.pads, crowns: g.crowns, reach: g.reach || Y.tailC.reach, set: g.set || null }))],
    };
    const crowns = [], pads = [], blooms = [], rafts = { A: [], B: [], C: [] };
    // (raft B's plants stand along the line the boat before this one took from M2 toward the bridge's wide span: the
    // turned lane crosses the raft, so that is where its leaves are thickest)
    const M2 = P.staithe.M2, laneLine = { a: A(M2[0] + 0.6, M2[1] + 1.9), b: A(P.bridge.s, 0) };
    const onLane = (x, z) => { const ax = laneLine.b[0] - laneLine.a[0], az = laneLine.b[2] - laneLine.a[2], t = ((x - laneLine.a[0]) * ax + (z - laneLine.a[2]) * az) / (ax * ax + az * az); return { t, off: Math.hypot(x - laneLine.a[0] - ax * t, z - laneLine.a[2] - az * t) }; };
    for (const name of ['A', 'B', 'C']) for (const reg of regions[name]) {
      const mine = [];
      if (Array.isArray(reg.crowns)) {                              // plants put down by hand
        for (const [s, d] of reg.crowns) { const [x, , z] = A(s, d), c = { x, z, s, d, raft: name, reg, bed: Math.min(-0.3, groundY(x, z)), pads: [] }; crowns.push(c); mine.push(c); }
      } else for (let tries = 0; mine.length < reg.crowns && tries < 3000; tries++) {
        const s = lerp(reg.s[0] + 0.5, reg.s[1] - 0.5, rnd()), dd = reg.d(s), d = lerp(dd[0] + 0.5, dd[1] - 0.5, rnd()), [x, , z] = A(s, d);
        if (name === 'B' && mine.length < 3 && onLane(x, z).off > 0.5) continue;
        if (blocked(x, z, 0.3)) continue;
        if (crowns.some((c) => Math.hypot(c.x - x, c.z - z) < (tries < 1500 ? 1.7 : 1.1))) continue;
        const c = { x, z, s, d, raft: name, reg, bed: Math.min(-0.3, groundY(x, z)), pads: [] };
        crowns.push(c); mine.push(c);
      }
      reg.mine = mine;
    }
    // ---- buds and flowers stand close by their crowns, in water kept open for them
    const bloom = (kind, raft, n) => {
      const cs = crowns.filter((c) => c.raft === raft);
      for (let i = 0, tries = 0; i < n && tries < 400 && cs.length; tries++) {
        const c = cs[(i * 2 + tries) % cs.length], a = rnd() * TAU, r = 0.16 + 0.42 * rnd(), x = c.x + Math.cos(a) * r, z = c.z + Math.sin(a) * r;
        if (blocked(x, z, 0.15) || blooms.some((b) => Math.hypot(b.x - x, b.z - z) < 0.55)) continue;
        const q = where(x, z), dd = c.reg.d(q.s);
        if (q.d < dd[0] || q.d > dd[1]) continue;
        blooms.push({ kind, raft, x, z, turn: rnd() * TAU, size: kind === 'bud' ? 0.82 + 0.4 * rnd() : 0.92 + 0.22 * rnd(), crown: c }); i++;
      }
    };
    for (const [s, d, size] of Y.tailC.buds) { const [x, , z] = A(s, d), c = crowns.filter((k) => k.raft === 'C').sort((a, b) => Math.hypot(a.x - x, a.z - z) - Math.hypot(b.x - x, b.z - z))[0]; blooms.push({ kind: 'bud', raft: 'C', x, z, turn: rnd() * TAU, size: (size ?? 0.95) + 0.25 * rnd() * (size ? 0 : 1), crown: c }); }
    for (const raft of ['A', 'B', 'C']) { bloom('flower', raft, Y.flowers[raft]); bloom('bud', raft, Y.buds[raft] - (raft === 'C' ? Y.tailC.buds.length : 0)); }
    // ---- the leaves: young ones (b: small, bronze-flushed, the rim still curled) close to the crown, last year's
    // (c: large, bitten) at the outside. No two neighbours share a leaf and a turn.
    for (const name of ['A', 'B', 'C']) for (const reg of regions[name]) {
      const cs = reg.mine; if (!cs.length) continue;
      // leaves put down one by one (the foot of the title view): each on the stalk of the nearest of its group's plants
      for (const [s, d, size, variant] of reg.set || []) {
        const [x, , z] = A(s, d), c = cs.slice().sort((a, b) => Math.hypot(a.x - x, a.z - z) - Math.hypot(b.x - x, b.z - z))[0];
        const it = { x, y: 0, z, turn: Math.atan2(c.x - x, c.z - z) + (rnd() - 0.5) * 1.3, size, scale: [size, 1, size], variant, raft: name, crown: c, s, d, placed: true };
        pads.push(it); rafts[name].push(it); c.pads.push(it);
      }
      for (let i = reg.set ? reg.set.length : 0, tries = 0; i < reg.pads && tries < reg.pads * 300; tries++) {
        const c = cs[(i + Math.floor(tries / 7)) % cs.length], a = rnd() * TAU, u = rnd(), reach = reg.reach || Y.reach, r = lerp(reach[0], reach[1], Math.sqrt(u)), x = c.x + Math.cos(a) * r, z = c.z + Math.sin(a) * r;
        const q = where(x, z), dd = reg.d(q.s);
        if (q.s < reg.s[0] || q.s > reg.s[1] || q.d < dd[0] || q.d > dd[1]) continue;
        const k = rnd(), variant = u < 0.22 ? (k < 0.7 ? 'b' : 'a') : u > 0.6 ? (k < 0.45 ? 'c' : k < 0.85 ? 'a' : 'b') : (k < 0.55 ? 'a' : k < 0.8 ? 'b' : 'c');
        const sz = variant === 'b' ? [0.28, 0.37] : variant === 'c' ? [0.36, 0.46] : [0.31, 0.46], size = lerp(sz[0], sz[1], rnd());
        if (blocked(x, z, size / 2)) continue;
        if (blooms.some((b) => Math.hypot(b.x - x, b.z - z) < size / 2 + (b.kind === 'bud' ? 0.05 : 0.13))) continue;
        let near = null, nd = 1e9;
        for (const p of pads) { const dist = Math.hypot(p.x - x, p.z - z); if (dist < nd) { nd = dist; near = p; } if (dist < (p.size + size) * 0.47) { near = false; break; } }
        if (near === false) continue;
        // the notch looks back toward the crown, give or take
        const turn = Math.atan2(c.x - x, c.z - z) + (rnd() - 0.5) * 1.5;
        const it = { x, y: 0, z, turn, size, scale: [size, 1, size], variant: near && nd < 0.6 && near.variant === variant && tries % 3 ? (variant === 'a' ? 'c' : 'a') : variant, raft: name, crown: c, s: q.s, d: q.d };
        pads.push(it); rafts[name].push(it); c.pads.push(it); i++;
      }
    }

    // ---- the pads: three leaves, three sets of the ride's floaters (one draw each, in the direct view only)
    // A leathery leaf lying flat gives back the sky at a glancing angle: beside the hull it is an olive leaf, ten
    // metres off a pale warm one (as the key painting has them), and never a dark hole in the gold water.
    const sheenColor = new THREE.Color(Y.sheen[0]);
    const sheen = {
      uniforms: { uPlSheen: { value: new THREE.Vector4(sheenColor.r, sheenColor.g, sheenColor.b, Y.sheen[1]) }, uPlSheenK: { value: Y.sheen[2] }, uPlSheenB: { value: new THREE.Color(Y.sheen[3] || Y.sheen[0]) } },
      fragmentPars: /* glsl */`uniform vec4 uPlSheen; uniform float uPlSheenK; uniform vec3 uPlSheenB;`,
      // WHICH sky: what a leaf gives back is the sky beyond it as the eye sees it, the gold west when the rider looks
      // toward the sun and the putty east when he looks away (the area's rule: everything is seen against the light
      // and wears it), and a lifted margin gives back a different piece of sky than the flat of the leaf.
      // (the film of water that lies in a leaf's hollows gives the sky back more than the dry leaf does, and a vein
      // standing out of it less: so the gold lies on a leaf in patches, broken by its veins, and is never a glaze)
      light: /* glsl */`
        { vec3 pR = reflect(-V, N);
          float pT = smoothstep(-0.35, 0.9, dot(normalize(pR.xz + vec2(1.0e-4, 0.0)), normalize(-uKeyDir.xz)));
          float pG = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), uPlSheen.w) * smoothstep(0.4, 0.8, N.y) * (gl_FrontFacing ? 1.0 : 0.0);
          pG *= (0.72 + 0.5 * plWet) * (1.0 - 0.5 * plVein);
          c = mix(c, mix(uPlSheenB, uPlSheen.rgb, pT), clamp(uPlSheenK * pG, 0.0, 1.0)); }`,
    };
    // ---- a leaf's own painting (in place of the floaters' star of thirteen straight veins: veins: false). In the
    // leaf's own space (one unit across, the stalk at PAD_HUB toward the notch), so it lies on the leaf however it is
    // turned, sized and rocked. What is painted: thirteen to seventeen veins from the stalk, no one ruled, each
    // forking twice on its way to the margin, the midrib (away from the notch) the stoutest, all gone before the
    // margin; every panel between two veins its own tone; cloud; the wet, darker margin; and what the leaf's age has
    // done to it (uPlLeaf.x: 0 just up, bronze-flushed .. 1 last year's, yellowing from the margin in, browned in
    // spots; .y: how far the leaves of one set differ in age; .z: how plainly the veins show). The veins are a
    // centimetre wide at the stalk and half that further out: beside the hull the painter's filter keeps them, five
    // metres off it lets them go, as a painter would.
    const leafPaint = (age, spread, veins) => ({
      uniforms: { uPlLeaf: { value: new THREE.Vector4(age, spread, veins, 0) } },
      // A leaf lies ON the water: it is never under it. The floaters tip a pad about its middle by six times the water's
      // slope, which puts its downhill half up to four centimetres under the flat sheet the water is drawn as; since
      // the area's water draws a hair of light wherever it meets a thing (PLAN.water.waterline), every rocking pad
      // had a white crack across it (.shots/landing_p2_g_hull_f02.png). So the leaf's upper face is kept a hand's
      // thickness of paper above the sheet; only the dark edge that hangs from its margin (below 0 in the model) goes in.
      vertexWorld: /* glsl */`if (position.y > 0.0) wp.y = max(wp.y, 0.004);`,
      fragmentPars: /* glsl */`uniform vec4 uPlLeaf;
        float plHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float plNoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(plHash(i), plHash(i + vec2(1.0, 0.0)), f.x), mix(plHash(i + vec2(0.0, 1.0)), plHash(i + vec2(1.0, 1.0)), f.x), f.y); }`,
      albedo: /* glsl */`
        float plVein = 0.0, plWet = 0.0;
        { vec2 pp = vFloPiece.xy; float pseed = vFloPiece.z;
          vec2 pq = pp - vec2(0.0, ${PAD_HUB.toFixed(3)}); float pl = length(pq), pr = length(pp) * 2.0;
          float pn = 13.0 + 2.0 * floor(fract(pseed * 7.13) * 2.99);
          float pa = atan(pq.x, -pq.y) / 6.2831853 * pn, pc = floor(pa + 0.5), pd = pa - pc;      // which vein (0: the midrib), and how far round from it
          float ph = plHash(vec2(pc, floor(pseed * 911.0)));
          pd += 0.07 * sin(pl * 11.0 + ph * 6.2831853) * smoothstep(0.05, 0.3, pl);
          float pf1 = 0.17 + 0.09 * ph, pf2 = pf1 + 0.13 + 0.05 * ph;                           // where it forks, and forks again
          float ps1 = 0.22 * smoothstep(pf1, pf1 + 0.2, pl), ps2 = 0.11 * smoothstep(pf2, pf2 + 0.16, pl);
          float pv = abs(abs(abs(pd) - ps1) - ps2) / pn * 6.2831853 * pl;                       // how far to the nearest branch (in a leaf one unit across)
          float pw = mix(0.013, 0.0055, smoothstep(0.04, 0.4, pl)) * (pc == 0.0 ? 1.5 : 0.8 + 0.5 * ph);
          plVein = (1.0 - smoothstep(pw * 0.35, pw, pv)) * smoothstep(0.015, 0.05, pl) * (1.0 - smoothstep(0.72, 0.97, pr));
          float pm = plNoise(pp * 8.0 + pseed * 37.0), pm2 = plNoise(pp * 21.0 + pseed * 19.0);
          float pAge = clamp(uPlLeaf.x + (fract(pseed * 5.71) - 0.5) * uPlLeaf.y, 0.0, 1.0);
          if (gl_FrontFacing) {
            albedo *= 0.9 + 0.2 * plHash(vec2(pc + 3.0, floor(pseed * 577.0)));                 // every panel between two veins its own tone
            albedo *= 0.84 + 0.32 * pm;
            albedo = mix(albedo, albedo * vec3(1.34, 0.74, 0.5), (1.0 - smoothstep(0.0, 0.45, pAge)) * (0.55 + 0.4 * pm));      // just up: bronze-flushed
            float pY = smoothstep(0.5, 1.0, pAge) * smoothstep(0.35, 0.95, pr + 0.55 * (pm - 0.5));
            albedo = mix(albedo, albedo * vec3(1.6, 1.16, 0.45), 0.7 * pY);                     // last year's: yellowing from the margin in
            float pSpot = smoothstep(0.74, 0.82, pm2) * smoothstep(0.35, 1.0, pAge) * smoothstep(0.25, 0.8, pr);
            albedo = mix(albedo, vec3(0.105, 0.062, 0.03), 0.75 * pSpot);                       // and browned in spots
            albedo = mix(albedo, albedo * vec3(1.32, 1.26, 0.9) + 0.012, plVein * uPlLeaf.z);
            albedo *= 1.0 - 0.3 * smoothstep(0.84, 1.0, pr + 0.06 * (pm2 - 0.5));               // the wet, darker margin
            plWet = smoothstep(0.5, 0.72, plNoise(pp * 4.3 + pseed * 71.0)) * (1.0 - plVein);
            albedo *= 1.0 - 0.14 * plWet;
          } else albedo *= 1.0 - 0.3 * plVein;                                                 // beneath, the veins stand proud and dark
        }`,
    });
    // ---- THE THIRD LOOK (&padlook=2 shows the second). What the second look left: beside the hull and in the foot of
    // the title view the leaves were dull olive ovals, formless two metres off: no vein survived the painter's filter
    // and nothing on a leaf caught the light. Now:
    //   - the leaf's face gives the sky back as a leathery thing does (a little everywhere, much at a glancing angle),
    //     and A FILM OF WATER LIES IN ITS HOLLOWS (a pool where the stalk joins, running out along the cleft; a dip or
    //     two elsewhere; never on a lifted margin) and gives the sky back as the water round it does: seen against the
    //     light a leaf is olive with pieces of the gold water lying on it. Which sky: the one beyond the leaf as the
    //     eye sees it (the gold west toward the sun, low and bright near the horizon; the putty east looking away)
    //   - a lifted margin leans, so its near lip is seen at a more glancing angle than the flat of the leaf and takes
    //     more of the sky: a line of light above the dark edge (the area's rule: everything wears the light's edge)
    //   - veins broad enough for the painter to keep on a leaf two or three metres off (uPlLeaf.w)
    const sheen3 = {
      uniforms: { uPlGloss: { value: new THREE.Vector3(...Y.gloss) }, uPlFilm: { value: new THREE.Vector3(...Y.film) }, uPlSkyL: { value: new THREE.Color(Y.sky[0]) }, uPlSkyW: { value: new THREE.Color(Y.sky[1]) }, uPlSkyE: { value: new THREE.Color(Y.sky[2]) } },
      fragmentPars: /* glsl */`uniform vec3 uPlGloss, uPlFilm, uPlSkyL, uPlSkyW, uPlSkyE;`,
      // (plN: the leaf's face as it puckers between its veins, from its paint below: the sky it gives back is read off
      // that, the light that falls on it off the plain face, so that the pucker shows only in what the leaf mirrors)
      light: /* glsl */`
        { float pNV = clamp(dot(plN, V), 0.0, 1.0), pG = 1.0 - pNV;
          vec3 pR = reflect(-V, plN);
          float pT = smoothstep(-0.35, 0.9, dot(normalize(pR.xz + vec2(1.0e-4, 0.0)), normalize(-uKeyDir.xz)));
          vec3 pSky = mix(uPlSkyE, mix(uPlSkyL, uPlSkyW, smoothstep(0.1, 0.55, clamp(pR.y, 0.0, 1.0))), pT);
          float pDry = (uPlGloss.x + uPlGloss.y * pow(pG, uPlGloss.z)) * (1.0 - 0.5 * plVein);
          float pWater = uPlFilm.x + uPlFilm.y * pow(1.0 - clamp(dot(N, V), 0.0, 1.0), uPlFilm.z);
          float pK = mix(pDry, pWater, plWet) * smoothstep(0.35, 0.75, N.y) * (gl_FrontFacing ? 1.0 : 0.0);
          c = mix(c, pSky, clamp(pK, 0.0, 0.92)); }`,
    };
    const leafPaint3 = (age, spread, veins) => {
      const old = leafPaint(age, spread, veins);
      return {
        uniforms: { uPlLeaf: { value: new THREE.Vector4(age, spread, veins * Y.vein[1], Y.vein[0]) }, uPlWet: { value: new THREE.Vector3(Y.wet[0], Y.wet[1], Y.pucker[0]) }, uPlSwell: { value: Y.pucker[1] } },
        vertexPars: /* glsl */`varying float vPlLift;`,
        vertexLocal: /* glsl */`vPlLift = position.y;`,
        vertexWorld: old.vertexWorld,
        fragmentPars: old.fragmentPars + /* glsl */` uniform vec3 uPlWet; uniform float uPlSwell; varying float vPlLift;`,
        albedo: /* glsl */`
        float plVein = 0.0, plWet = 0.0; vec3 plN = N;
        { vec2 pp = vFloPiece.xy; float pseed = vFloPiece.z;
          vec2 pq = pp - vec2(0.0, ${PAD_HUB.toFixed(3)}); float pl = length(pq), pr = length(pp) * 2.0;
          float pn = 13.0 + 2.0 * floor(fract(pseed * 7.13) * 2.99);
          float pa = atan(pq.x, -pq.y) / 6.2831853 * pn, pc = floor(pa + 0.5), pd = pa - pc;      // which vein (0: the midrib), and how far round from it
          float ph = plHash(vec2(pc, floor(pseed * 911.0)));
          pd += 0.07 * sin(pl * 11.0 + ph * 6.2831853) * smoothstep(0.05, 0.3, pl);
          float pf1 = 0.17 + 0.09 * ph, pf2 = pf1 + 0.13 + 0.05 * ph;                           // where it forks, and forks again
          float ps1 = 0.22 * smoothstep(pf1, pf1 + 0.2, pl), ps2 = 0.11 * smoothstep(pf2, pf2 + 0.16, pl);
          float pv = abs(abs(abs(pd) - ps1) - ps2) / pn * 6.2831853 * pl;                       // how far to the nearest branch (in a leaf one unit across)
          float pw = mix(0.013, 0.0055, smoothstep(0.04, 0.4, pl)) * (pc == 0.0 ? 1.5 : 0.8 + 0.5 * ph) * uPlLeaf.w;
          plVein = (1.0 - smoothstep(pw * 0.35, pw, pv)) * smoothstep(0.015, 0.05, pl) * (1.0 - smoothstep(0.72, 0.97, pr));
          float pm = plNoise(pp * 8.0 + pseed * 37.0), pm2 = plNoise(pp * 21.0 + pseed * 19.0);
          float pAge = clamp(uPlLeaf.x + (fract(pseed * 5.71) - 0.5) * uPlLeaf.y, 0.0, 1.0);
          if (gl_FrontFacing) {
            albedo *= 0.88 + 0.24 * plHash(vec2(pc + 3.0, floor(pseed * 577.0)));               // every panel between two veins its own tone
            albedo *= 0.84 + 0.32 * pm;
            albedo = mix(albedo, albedo * vec3(1.34, 0.74, 0.5), (1.0 - smoothstep(0.0, 0.45, pAge)) * (0.55 + 0.4 * pm));      // just up: bronze-flushed
            float pY = smoothstep(0.5, 1.0, pAge) * smoothstep(0.35, 0.95, pr + 0.55 * (pm - 0.5));
            albedo = mix(albedo, albedo * vec3(1.6, 1.16, 0.45), 0.7 * pY);                     // last year's: yellowing from the margin in
            float pSpot = smoothstep(0.74, 0.82, pm2) * smoothstep(0.35, 1.0, pAge) * smoothstep(0.25, 0.8, pr);
            albedo = mix(albedo, vec3(0.105, 0.062, 0.03), 0.75 * pSpot);                       // and browned in spots
            albedo = mix(albedo, albedo * vec3(1.5, 1.42, 0.95) + 0.014, plVein * uPlLeaf.z);
            albedo *= 1.0 - 0.3 * smoothstep(0.84, 1.0, pr + 0.06 * (pm2 - 0.5));               // the wet, darker margin
            // the film of water: a pool where the stalk joins (the lowest place of a leaf), running out along the
            // cleft; a dip or two elsewhere; nothing on what has lifted clear, nothing at the very margin
            float pk1 = fract(pseed * 3.71), pk2 = fract(pseed * 9.13);
            vec2 pe = pq * vec2(1.0, pq.y > 0.0 ? 0.55 : 1.0);                                  // (drawn out toward the notch)
            float pPool = (1.0 - smoothstep(0.07 + 0.09 * pk2, 0.1 + 0.11 * pk2, length(pe) + 0.07 * (pm - 0.5))) * step(pk1, uPlWet.x);
            float pDip = smoothstep(0.6, 0.66, plNoise(pp * 3.3 + pseed * 71.0)) * step(pk2, uPlWet.y) * (1.0 - smoothstep(0.7, 0.86, pr));
            plWet = max(pPool, pDip) * (1.0 - smoothstep(0.007, 0.016, vPlLift));
            albedo *= 1.0 - 0.16 * plWet;
            // the pucker: the leaf stands up along every vein and sags between (its tilt, round the stalk, turned from
            // the leaf's own space into the world's by the two spaces' rates of change across the screen)
            mat2 pM = mat2(dFdx(pp), dFdy(pp)); float pDet = pM[0][0] * pM[1][1] - pM[0][1] * pM[1][0];
            if (abs(pDet) > 1.0e-12) {
              vec2 pTh = vec2(-pq.y, pq.x) / max(pl, 1.0e-3);                                   // the way round the stalk, in the leaf's space
              // (and the whole leaf lies in two or three slow swells, each its own: uPlSwell)
              vec2 pG2 = (vec2(plNoise(pp * 2.6 + pseed * 53.0), plNoise(pp * 2.6 + pseed * 53.0 + 17.3)) - 0.5) * 2.0 * uPlSwell;
              vec2 pTl = pTh * (uPlWet.z * sin(pd * 6.2831853) * smoothstep(0.04, 0.16, pl) * (1.0 - smoothstep(0.8, 1.0, pr))) + pG2;
              vec2 pTw = mat2(dFdx(vWPos.xz), dFdy(vWPos.xz)) * (inverse(pM) * pTl);            // the same in the world
              plN = normalize(N - vec3(pTw.x, 0.0, pTw.y) / max(length(pTw), 1.0e-6) * (length(pTl) * (1.0 - plWet)));
            }
          } else albedo *= 1.0 - 0.3 * plVein;                                                 // beneath, the veins stand proud and dark
        }`,
      };
    };
    const LOOK = QS.get('padlook') === '2' ? 2 : 3;
    const AGE = { a: [0.5, 0.75, 0.62], b: [0.1, 0.34, 0.52], c: [0.88, 0.4, 0.7] };
    const sets = [];
    for (const [i, v] of ['a', 'b', 'c'].entries()) {
      const items = pads.filter((p) => p.variant === v);
      items.forEach((p, n) => { p.set = i; p.n = n; });
      const geometry = await piece(`lily_pad_${v}`);
      const fl = makeFloaters(ctx, { kind: 'pad', geometry, items: items.map((p) => ({ x: p.x, z: p.z, size: p.size, turn: p.turn })), seed: 261 + i,
        tone: Y.tone, top: Y.top[v], under: Y.under, curl: v === 'b' ? 0.06 : 0.16, veins: false });      // (curl: the floaters' own lifted arc, on top of the margins the models now lift themselves)
      // the area's own light on them: the shade of the reeds and the cloth (nearly all of this water lies in it), the rim
      extendMaterial(fl.object.material, L.extend({ rim: 0.5, soft: 0.5 }), LOOK === 3 ? leafPaint3(...AGE[v]) : leafPaint(...AGE[v]), LOOK === 3 ? sheen3 : sheen);
      fl.object.name = `lily pads ${v}`;
      sets.push({ v, fl, items, geometry }); made.push(fl.object);
      counts[`lily_pad_${v}`] = { count: items.length, triangles: items.length * geometry.index.count / 3 };
    }

    // ---- what makes way with the pads: their stalks, the buds, the flowers (the same lane and the same numbers as
    // the floaters': LANE_GLSL and lifeHull are theirs)
    const laneUniforms = (v4) => ({ ...hull.uniforms, uPlLane: { value: v4 } });
    const FB = sets[0].fl.uniforms.uFloB.value;                  // the pads' aside, within, close, tether
    const instanced = (geometry, n, attrs) => {
      const g = new THREE.InstancedBufferGeometry();
      g.index = geometry.index; for (const k of ['position', 'normal', 'color']) g.setAttribute(k, geometry.attributes[k]);
      for (const [k, [arr, size]] of Object.entries(attrs)) g.setAttribute(k, new THREE.InstancedBufferAttribute(arr, size));
      g.instanceCount = n;
      return g;
    };
    { // the stalks: one to every pad, from its plant's crown on the bed. As modelled (lily.py) a stalk hangs one metre
      // deep from the origin along x = 0.34 f(k), f = k k (3 - 2 k), k = depth 0..1: here each is stretched to its own
      // depth and its own crown, its thickness left alone; its top goes where the hull pushes its pad, its foot stays
      const n = pads.length, seat = new Float32Array(n * 4), seed = new Float32Array(n * 4), stem = new Float32Array(n * 4);
      pads.forEach((p, i) => {
        const S = sets[p.set].fl.object.geometry.attributes.aSeed.array, c = p.crown;
        const hx = p.x + p.size * PAD_HUB * Math.sin(p.turn), hz = p.z + p.size * PAD_HUB * Math.cos(p.turn);
        // its root: at the crown, a hand's breadth from its neighbours'
        const ra = rnd() * TAU, rr = 0.05 + 0.1 * rnd(), rx = c.x + Math.cos(ra) * rr - hx, rz = c.z + Math.sin(ra) * rr - hz, run = Math.hypot(rx, rz);
        seat.set([p.x, p.z, p.size, p.turn], i * 4); seed.set([S[p.n * 4], S[p.n * 4 + 1], rnd(), rnd()], i * 4);
        stem.set([Math.max(0.25, -c.bed - 0.03), Math.atan2(-rz, rx), run / 0.34, 0], i * 4);
        p.root = [hx + rx, c.bed, hz + rz];
      });
      const g = instanced(await piece('lily_stem'), n, { aPlSeat: [seat, 4], aPlSeed: [seed, 4], aPlStem: [stem, 4] });
      const mat = kit.gouache({ color: '#ffffff', vertexColors: true, brush: 0.4, extend: [L.extend({ rim: 0, sun: 0 }), {
        uniforms: laneUniforms(new THREE.Vector4(FB.x, FB.y, FB.z, 0.004)),
        vertexPars: /* glsl */`${LANE_GLSL}
          attribute vec4 aPlSeat, aPlSeed, aPlStem; uniform vec4 uPlLane;`,
        vertexLocal: /* glsl */`
          { vec2 pPush = lanePush(aPlSeat.xy, uPlLane.x + 0.42 * aPlSeat.z, uPlLane.y, uPlLane.z, aPlSeed.y);      // its pad's own way, to the number
            float pTurn = aPlSeat.w + length(pPush) * (aPlSeed.x - 0.5) * 2.4;
            vec2 pRest = aPlSeat.xy + aPlSeat.z * ${PAD_HUB.toFixed(4)} * vec2(sin(aPlSeat.w), cos(aPlSeat.w));
            vec2 pNow = aPlSeat.xy + pPush + aPlSeat.z * ${PAD_HUB.toFixed(4)} * vec2(sin(pTurn), cos(pTurn));
            float pK = clamp(-position.y, 0.0, 1.0), pF = pK * pK * (3.0 - 2.0 * pK);
            vec2 pL = vec2(0.34 * pF * aPlStem.z + (position.x - 0.34 * pF), position.z);
            float pc = cos(aPlStem.y), ps = sin(aPlStem.y);
            vec2 pR = vec2(pc * pL.x + ps * pL.y, -ps * pL.x + pc * pL.y);
            // a slack rope in slow water moves most at its middle
            pR += vec2(sin(uTime * 0.61 + aPlSeed.z * 40.0), cos(uTime * 0.47 + aPlSeed.w * 31.0)) * (0.035 * sin(pK * 3.1416));
            vec2 pAt = pRest + pR + (pNow - pRest) * (1.0 - pF);
            transformed = vec3(pAt.x, uPlLane.w - pK * aPlStem.x, pAt.y);
            objectNormal = vec3(pc * normal.x + ps * normal.z, normal.y, -ps * normal.x + pc * normal.z); }`,
      }] });
      const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.name = 'lily stalks';
      ctx.only(mesh, 'direct'); ctx.add(mesh); made.push(mesh);
      K.padStalks = mesh;
      counts.lily_stem = { count: n, triangles: n * g.index.count / 3 };
    }
    // (the page, cast row 10: "the four flowers finish closing in the first two minutes after load")
    const shut = { value: 0 };
    updates.push(() => { const k = Math.min(1, Math.max(0, ctx.time / Y.shutIn)); shut.value = k * k * (3 - 2 * k); });
    const FU = sets[0].fl.uniforms;                               // (the floaters' own: the water's fine ripple window among them)
    const blooming = async (kind, file, tall, under = false) => {
      const list = blooms.filter((b) => b.kind === kind), n = list.length;
      const seat = new Float32Array(n * 4), seed = new Float32Array(n * 4);
      list.forEach((b, i) => { seat.set([b.x, b.z, b.size, b.turn], i * 4); seed.set([rnd(), rnd(), rnd(), b.depth || 0], i * 4); });
      const g = instanced(await piece(file), n, { aPlSeat: [seat, 4], aPlSeed: [seed, 4] });
      // (a bud stands a hand above the water, where the hull is fuller than at its waterline and its stem rakes
      // forward: the floaters' lane, which is the hull AT the waterline, left a bud standing inside the bow. So a
      // standing thing keeps clear of the whole boat: a line from stern to beyond the stem, the gunwale's half width)
      // (what stands in the air wears the area's plant paint; what is wholly under the water is out of the sun, as the stalks are)
      const mat = extendMaterial(under ? kit.gouache({ color: '#ffffff', vertexColors: true, brush: 0.4, extend: L.extend({ rim: 0, sun: 0 }) })
        : L.plant({ tall, backlight: 0.45, rim: 0.9, wind: false, brush: 0.4, color: kind === 'flower' ? Y.cream : '#ffffff' }), {
        // (uPlNod: a bud or a flower NODS on a ring. It stands on a slack stalk and floats at the water's skin, so it
        // leans with the water's slope where it stands, as its leaves tip: how many times the slope (the floaters
        // tip a pad six times: Y.nod[0]), the most it leans (rise per metre: Y.nod[1]). The water's two ripple
        // windows are the floaters' own uniforms: the fine one is kept fresh by the pads' meshes)
        uniforms: { uLifeHull: hull.uniforms.uLifeHull, uLifeHullB: hull.uniforms.uLifeHullB, uPlLane: { value: new THREE.Vector4(N.hull.room + 0.06, 0.6, 0, 0) }, uPlShut: kind === 'flower' ? shut : { value: 0 },
          tLifeFine: FU.tLifeFine, uLifeFine: FU.uLifeFine, uPlNod: { value: new THREE.Vector2(Y.nod[0] * (ctx.reducedMotion ? 0.6 : 1), Y.nod[1]) } },
        vertexPars: /* glsl */`uniform vec4 uLifeHull, uLifeHullB, uPlLane; uniform float uPlShut; attribute vec4 aPlSeat, aPlSeed;
          uniform sampler2D tRipple, tLifeFine; uniform vec4 uRippleRect, uLifeFine; uniform vec2 uPlNod;`,
        vertexLocal: /* glsl */`
          { // a flower shutting for the night: its petals are drawn up and in, the more the higher they stand (each flower a little behind or ahead of the others)
            float bShut = clamp(uPlShut * (0.8 + 0.4 * aPlSeed.x), 0.0, 1.0) * smoothstep(0.016, 0.1, position.y);
            vec3 bQ = vec3(position.x * (1.0 - 0.5 * bShut), position.y + 0.014 * bShut, position.z * (1.0 - 0.5 * bShut));
            vec2 bA = uLifeHull.xy, bAB = uLifeHull.zw - uLifeHull.xy;
            float bT = clamp(dot(aPlSeat.xy - bA, bAB) / max(dot(bAB, bAB), 1.0e-4), -0.1, 1.25);
            vec2 bD = aPlSeat.xy - (bA + bAB * bT); float bLen = length(bD), bR = uLifeHullB.x + uPlLane.x, bOut = bR + uPlLane.y;
            vec2 bPush = bLen < bOut ? (bLen > 1.0e-3 ? bD / bLen : normalize(vec2(bAB.y, -bAB.x) + vec2(1.0e-5, 0.0)) * (aPlSeed.y < 0.5 ? -1.0 : 1.0)) * (bR * (1.0 - bLen / bOut)) : vec2(0.0);
            float bc = cos(aPlSeat.w), bs = sin(aPlSeat.w);
            vec3 bP = bQ * aPlSeat.z;
            float bW = smoothstep(-0.4 * aPlSeat.z, -0.02, bP.y);                // under the water its stalk stays rooted and leans after it
            // a ring passing under it: what stands above the water leans with the slope there, the more the higher
            vec2 bSl = vec2(0.0), bUv = (aPlSeat.xy + bPush - uRippleRect.xy) / uRippleRect.zw + 0.5, bE = min(bUv, 1.0 - bUv);
            if (min(bE.x, bE.y) > 0.0) bSl = textureLod(tRipple, bUv, 0.0).xy * smoothstep(0.0, 0.08, min(bE.x, bE.y));
            if (uLifeFine.z > 0.0) { bUv = (aPlSeat.xy + bPush - uLifeFine.xy) / uLifeFine.z + 0.5; bE = min(bUv, 1.0 - bUv);
              if (min(bE.x, bE.y) > 0.0) bSl += textureLod(tLifeFine, bUv, 1.0).xy * smoothstep(0.0, 0.08, min(bE.x, bE.y)); }
            vec2 bNod = -clamp(bSl * uPlNod.x, -uPlNod.y, uPlNod.y) * max(bP.y - aPlSeed.w, 0.0);
            transformed = vec3(aPlSeat.x + bc * bP.x + bs * bP.z + bPush.x * bW + bNod.x, bP.y - aPlSeed.w, aPlSeat.y - bs * bP.x + bc * bP.z + bPush.y * bW + bNod.y);
            objectNormal = vec3(bc * normal.x + bs * normal.z, normal.y, -bs * normal.x + bc * normal.z); }`,
      });
      const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.name = `lily ${kind}s`;
      if (under) ctx.only(mesh, 'direct');
      ctx.add(mesh); made.push(mesh);
      counts[file] = { count: n, triangles: n * g.index.count / 3 };
      return mesh;
    };
    // young leaves not yet up: bronze scrolls on their stalks a hand or two under the surface, close by each crown
    for (const c of crowns) for (let k = 0, n = 1 + Math.floor(rnd() * 2.4); k < n; k++) {
      const a = rnd() * TAU, r = 0.14 + 0.5 * rnd(), x = c.x + Math.cos(a) * r, z = c.z + Math.sin(a) * r, depth = Math.min(Y.shootDepth[0] + (Y.shootDepth[1] - Y.shootDepth[0]) * rnd(), -c.bed - 0.45);
      if (depth < 0.05) continue;
      blooms.push({ kind: 'shoot', raft: c.raft, x, z, turn: rnd() * TAU, size: 0.85 + 0.5 * rnd(), depth, crown: c });
    }
    // (tall: the height over which the area's plant paint lightens a plant from its dark foot. A flower lies ON the
    // water under the whole sky: with the rule spread over its twelve centimetres its petals were the water's own
    // tan from the side, a dark wine glass (.shots/landing_p3_n2_flower_side.png); a bud is dark only at the water)
    const buds = await blooming('bud', 'lily_bud', 0.1), flowers = await blooming('flower', 'lily_flower', 0.035), shoots = await blooming('shoot', 'lily_shoot', 0.2, true);

    // ---- the real things stand: the stand-ins go (kit.js: 'lily pads', 'lily buds', 'lily flowers')
    removeStandIn(ctx, 'lily');
    delete counts['lily pads']; delete counts['lily buds and flowers'];      // (the stand-ins' entries)

    // ---- for the cast and the staging (the same shapes kit.js gave, with more in them)
    //   pads.meshes     the three sets of floaters' meshes
    //   pads.rafts      { A, B, C }: every pad { x, y, z, turn, size, scale, variant, raft, s, d, crown, root, set, n }
    //   pads.floaters   the three handles of makeFloaters (docs/life/falls.md)
    //   pads.crowns     the plants: { x, z, s, d, raft, bed, pads }
    //   pads.lane       eighteen pads of raft B along the line from M2 toward the bridge's wide span, in order
    //   pads.turn(list, { flip, rock })   lay these pads wrong side up (bronze) and/or set them rocking (0..1), or back
    const lane = rafts.B.map((p) => ({ p, ...onLane(p.x, p.z) })).sort((a, b) => a.off - b.off).slice(0, Y.lane).sort((a, b) => a.t - b.t).map((o) => o.p);
    K.pads = {
      meshes: sets.map((s) => s.fl.object), rafts, floaters: sets.map((s) => s.fl), crowns, lane, stalks: K.padStalks,
      turn(list, { flip, rock } = {}) {
        for (const p of list) {
          const a = sets[p.set].fl.object.geometry.attributes.aLife;
          if (rock != null) a.array[p.n * 4 + 1] = rock;
          if (flip != null) a.array[p.n * 4 + 2] = flip ? 1 : 0;
          a.needsUpdate = true;
        }
      },
    };
    K.buds = [buds, flowers];
    K.blooms = blooms;                                           // every bud, flower and young leaf: { kind: 'bud' | 'flower' | 'shoot', raft, x, z, turn, size, crown, depth }
    K.padShoots = shoots;
    if (QS.has('plantsdebug')) console.error('PLANTS blooms ' + JSON.stringify(blooms.map((b) => { const q = where(b.x, b.z); return [b.kind, b.raft, +q.s.toFixed(2), +q.d.toFixed(2)]; })) + ' hull half ' + hull.half + ' bow ' + hull.bow + ' stern ' + hull.stern);
    if (QS.has('lane')) K.pads.turn(lane, { flip: true, rock: +QS.get('lane') || 0 });      // (&lane=1: the turned lane, to look at)
  }
  if (hull) updates.push(() => hull.update(ctx));

  return { update(dt) { for (const f of updates) f(dt); } };
}
