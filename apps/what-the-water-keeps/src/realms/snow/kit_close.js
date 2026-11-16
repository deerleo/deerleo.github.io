// The orchard in snow: THE AVENUE'S CLOSE BAND (module `close`, built after `trees`). Its log: docs/build/snow/2-kit-trees.md.
// Small things at the foot of the trees and on their low boughs, within fifteen metres of water the boat can reach:
//
//   - COW PARSLEY IN WINTER: the dead stems of the heads that flowered here in spring, in clumps round the foot of every
//     avenue trunk and in drifts along the margins, each umbel carrying a cushion of snow (umbel_winter_a .. d, each in
//     three weights: stems and caps in one file, WINTER), each clump that stands in the skin ice ringed by ice (ice_ring: WINTER). In the water
//     the same heads are in flower: a STAND-IN (the flood orchard's umbel in flower), on each clump's own cups.
//     Stems lean away from the hull, shiver when a wake reaches them and stir a finger's breadth in the air.
//   - THE LAST APPLES the kit hangs (the Outlier group's apple.glb, apple_pecked.glb, apple_cap.glb): nine under the
//     low bough at (216.5, +10), two or three under each other low bough, each on a spur of the bough's own design;
//     five windfalls frozen into the ice. WINTER. They sway with their bough.
//   - WHERE A TRUNK MEETS THE ICE OR THE SNOW: a collar of clear ice round every trunk standing in the skin ice (ice_collar_a/b:
//     a lobed ring of black ice level with the skin, cracks and bubbles in it, a bead of frost at its edge, the snow that
//     has fallen from the bole's plaster banked on its weather side); the snow drifted
//     against the foot of every trunk standing in the snowed-over flood (foot_drift_a/b); and on the thirteen crutches
//     under the low boughs the Monument group's snow and ice, as that group wears it on the oldest tree's nine. WINTER.
//   - THE ZINC LABEL on its wire from the lowest bough of every avenue tree (the flood orchard's label.glb, as it is:
//     SHARED), furred with hoar (label_hoar: WINTER).
//
// Models: source-art/models/snow/umbel_winter.py, close_band.py. Developer switches: &umbels=<stems>, &umbel=near | mid | far
// (every clump in one weight), &umbelr=<m> (where the near weight ends), &close=0 (none of it).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { nameAt } from './standins.js';

const Q = new URLSearchParams(location.search);
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _v = new THREE.Vector3();

export async function build(ctx, plan, shared) {
  if (Q.get('close') === '0') return {};
  const { kit } = ctx, F = shared.frame, L = shared.light, land = shared.land, O = shared.orchard;
  if (!O || !O.trees) { console.warn('snow/close: the trees (module `trees`, shared.orchard) are not there: nothing of the close band is built'); return {}; }
  const count = shared.counts = shared.counts || {};
  const weather = plan.weather || { x: 0.33, z: 0.944 };
  // (a lamp on snow is gold on white, never rose: kit_trees.js, `lampOnSnow`; worn after the area's snow light by every snow thing here)
  const gold = O.lampOnSnow || null;
  // (thin things that stand above the water are left out of the frame's pre picture: kit_trees.js, `notInPre`)
  const notInPre = O.notInPre || ((m) => m);
  // small things far off: kept out of the painter's filter beyond `m` metres (it wipes out what is thinner than its brush)
  const farCrisp = (m) => ({ final: `if (length(vViewPos) > ${m.toFixed(1)}) gl_FragColor.a = -15.0;` });
  // THE HULL, as a length and not a point (the flood orchard's way, src/realms/orchard/kit_plants.js): x, z, and the sine
  // and cosine of the boat's heading, kept every frame. hullGap(xz): metres from a place to the hull's own plan (0.72 m
  // to either side amidships, drawn in to nothing at the stem and a little at the transom); negative inside it.
  const uSnowHull = { value: new THREE.Vector4(0, 1e4, 0, 1) };
  const HULL_GLSL = /* glsl */`uniform vec4 uSnowHull;
      float hullGap(vec2 xz) {
        vec2 fwd = vec2(-uSnowHull.z, -uSnowHull.w), rel = xz - uSnowHull.xy;
        float along = clamp(dot(rel, fwd), -1.7, 2.3);
        float beam = 0.72 * (1.0 - pow(clamp((along - 0.1) / 2.25, 0.0, 1.0), 1.7)) * mix(0.74, 1.0, smoothstep(-1.7, -0.5, along));
        return length(rel - fwd * along) - beam;
      }`;
  ctx.onUpdate(() => { const b = ctx.boat; uSnowHull.value.set(b.x, b.z, Math.sin(b.heading), Math.cos(b.heading)); });
  // CLEAR ICE (the models mark what is ice, UV v = -2; everything else on them is snow or rime and takes the area's
  // snow light, which lays snow's tones over whatever wears it). Clear ice is GLASS:
  //   - it shows its own dark paint as it is, and takes almost nothing of a lamp or of the sky's light (their light goes
  //     through it into the water). The third making gave it the ride's plain light: inside the bow lantern's reach its
  //     near-black paint came out a pale lavender, and with the raised white bead round its lobed outline every inner
  //     trunk stood in an enamel tray;
  //   - it gives the sky back where the eye meets it at a glance: from the lane a dull pewter stroke under each white foot;
  //   - IT HAS NO RIM. Its edge is where the skin ice's frost has grown in over it: the model is a flat sheet that reaches
  //     a third further out than the window does (UV u: 0 at the bark .. 1 where the window ends on average .. 1.3), and
  //     here that edge is eaten back raggedly, in fingers that point at the bole, each collar its own way (by its own
  //     place), with a line of rime along it. No straight side is ever seen;
  //   - and where the hull lies over it, it is gone: the boat has broken it (hullGap).
  // &ice=gain:0.8,lamp:0.1,sky:0.3,rag:0.7 (developer) tries other numbers for one picture.
  const ICE = Object.fromEntries((Q.get('ice') || '').split(',').filter(Boolean).map((kv) => { const [k, v] = kv.split(':'); return [k, +v]; }));
  const iceNum = (k, d) => (Number.isFinite(ICE[k]) ? ICE[k] : d);
  const iceIn = {
    uniforms: { uIceSky: { value: L.seen ? L.seen('#C9C5DC') : new THREE.Color('#C9C5DC') }, uSnowHull, uIceLook: { value: new THREE.Vector4(iceNum('gain', 0.8), iceNum('lamp', 0.1), iceNum('sky', 0.3), iceNum('rag', 0.7)) } },
    vertexPars: 'varying vec2 vIceRel; varying vec2 vIceSeed;',
    vertexWorld: /* glsl */`
      {
        #ifdef USE_INSTANCING
          vec3 iceFoot = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
        #else
          vec3 iceFoot = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
        #endif
        vIceRel = wp.xz - iceFoot.xz; vIceSeed = iceFoot.xz;
      }`,
    fragmentPars: /* glsl */`uniform vec3 uIceSky; uniform vec4 uIceLook; varying vec2 vIceRel; varying vec2 vIceSeed; float gIceFrost;
      ${HULL_GLSL}
      float iceH(vec2 p) { vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
      float iceN(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(iceH(i), iceH(i + vec2(1.0, 0.0)), f.x), mix(iceH(i + vec2(0.0, 1.0)), iceH(i + vec2(1.0, 1.0)), f.x), f.y); }`,
    albedo: /* glsl */`gIceFrost = 0.0;
      if (vUv0.y < -1.5 && vUv0.x > 0.001) {
        // which way from the bole this place lies: the frost's fingers go by that (a noise read on the unit circle has no seam)
        vec2 dir = normalize(vIceRel + vec2(1e-4)), sd = vIceSeed * 0.731;
        float finger = iceN(dir * 3.1 + sd) * 0.5 + iceN(dir * 8.7 - sd.yx) * 0.26 + iceN(vWPos.xz * 15.0) * 0.24;
        float barb = iceN(vWPos.xz * 46.0) * 0.6 + iceN(vWPos.xz * 131.0) * 0.4;
        float edge = vUv0.x + (finger - 0.5) * uIceLook.w + (barb - 0.5) * 0.12 + (1.0 - smoothstep(0.02, 0.4, hullGap(vWPos.xz))) * 2.0;
        if (edge > 1.0) discard;
        // rime along the edge, granular, never an unbroken line; and here and there a feather of it reaching further in
        gIceFrost = max(smoothstep(0.9, 1.0, edge) * (0.5 + 0.5 * barb), smoothstep(0.8, 0.86, iceN(dir * 29.0 + sd.yx)) * smoothstep(0.7, 0.92, edge) * (0.35 + 0.65 * barb));
      }`,
    light: /* glsl */`if (vUv0.y < -1.5) {
        vec3 ice = albedo * uIceLook.x + albedo * lamps * uIceLook.y;
        float graze = 1.0 - clamp(dot(N, V), 0.0, 1.0);
        ice = mix(ice, uIceSky, uIceLook.z * graze * graze * graze * smoothstep(0.7, 0.97, N.y));
        vec3 rime = mix(uSnowFrost, uSnowWarm, 0.4) * (0.94 + 0.06 * stroke) + vec3(0.8, 0.82, 0.86) * lamps * 0.45;
        float rk = clamp(max(lamps.r, max(lamps.g, lamps.b)) * 1.6, 0.0, 1.0); rime.b = mix(rime.b, min(rime.b, rime.g * 0.94), rk);
        c = mix(ice, rime, gIceFrost);
      }` };
  // metres outward from the water's edge (0 on the water) and the height of whatever a thing stands on there
  const ground = (x, z) => { const room = plan.waterRoom(-z, x); return room >= 0 ? { y: 0, wet: true, room } : { y: land.snowHeight(x, z, -room, Math.sign(x) || 1), wet: false, room }; };

  // ================================================================================================ cow parsley in winter
  {
    // A stem bends from its foot (little low down, most at its head): away from the hull when it comes within reach; in
    // a shiver when a wake's rings reach a stem that stands in the water (the ripple field's own energy at its foot);
    // and a finger's breadth in the air, always. The caps, the rings and the flowers in the water take the same words,
    // so that a cushion never leaves its umbel.
    // (FOURTH HOLDER: A STEM LEANS FROM THE HULL'S WHOLE LENGTH, AND WHAT THE HULL RIDES OVER GOES UNDER IT. It leaned from
    // the boat's middle only: a stem a stride ahead of the stem post or beside the transom stood straight and came up
    // through the planking. As in the flood orchard now: a clump whose foot lies inside the hull's own plan is laid
    // down under the keel, all of it, and comes up again when the boat has passed.)
    const bend = {
      uniforms: { uSnowHull },
      vertexPars: `uniform sampler2D tRipple; uniform vec4 uRippleRect; ${HULL_GLSL}`,
      vertexWorld: /* glsl */`
      {
        #ifdef USE_INSTANCING
          vec3 foot = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
        #else
          vec3 foot = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
        #endif
        float hgt = max(wp.y - foot.y, 0.0), lever = hgt * hgt / (hgt + 0.6);
        vec2 hfwd = vec2(-uSnowHull.z, -uSnowHull.w), hrel = foot.xz - uSnowHull.xy;
        vec2 away = hrel - hfwd * clamp(dot(hrel, hfwd), -1.7, 2.3); float off = length(away), gap = hullGap(foot.xz);
        wp.xz += away / max(off, 0.05) * lever * 0.75 * (1.0 - smoothstep(0.1, 1.5, gap));
        wp.y = mix(wp.y, min(wp.y, -0.27), 1.0 - smoothstep(0.03, 0.3, gap));
        vec2 ruv = (foot.xz - uRippleRect.xy) / uRippleRect.zw + 0.5;
        float wake = (ruv.x > 0.0 && ruv.x < 1.0 && ruv.y > 0.0 && ruv.y < 1.0) ? texture2D(tRipple, ruv).a : 0.0;
        float ph = foot.x * 7.3 + foot.z * 5.1;
        wp.xz += vec2(sin(uTime * 11.0 + ph), cos(uTime * 13.0 + ph * 1.3)) * lever * 0.035 * clamp(wake * 4.0, 0.0, 1.0) * (1.0 - step(0.06, foot.y));
        wp.xz += vec2(sin(uTime * 0.9 + ph), cos(uTime * 0.7 + ph * 0.6)) * lever * ${ctx.reducedMotion ? '0.004' : '0.012'};
      }` };
    // Four clumps (source-art/models/snow/umbel_winter.py: a, five stems; b, four, one broken over; c, three, one
    // snapped; d, a tall one and a seedling), each in three weights from one skeleton: every ray and spray within
    // seven metres of the boat, a plainer one to 24 m, threads and specks to 55 m. No two neighbours alike: each its
    // own turn, tilt, size and tone.
    const table = (await (await fetch('assets/models/snow/umbel_winter.json')).json()).clumps;
    const DES = Object.keys(table).filter((k) => table[k].cups), lists = Object.fromEntries(DES.map((k) => [k, []])), rings = [];
    const want = kit.count(Q.has('umbels') ? +Q.get('umbels') : plan.umbels.stems), ru = ctx.rng(5519);
    const tones = ['#ffffff', '#f6efe9', '#eeecf3', '#fbf3ee', '#e9e2e0'];
    const pondOpen = plan.pondOpen;
    let stems = 0;
    const put = (x, z, v, size = 1) => {
      const g = ground(x, z);
      if (g.wet && ((plan.openHalf(-z) > 0.5 && Math.abs(x) < plan.openHalf(-z) + 0.4) || Math.hypot(-z - pondOpen.at[0], x - pondOpen.at[1]) < pondOpen.r + 0.4)) return false;      // never in the black road itself, nor in the pond's open water
      const it = { position: [x, g.y - 0.02, z], rotation: [(ru() - 0.5) * 0.16, ru() * 6.283, (ru() - 0.5) * 0.16], scale: size * (0.68 + ru() * 0.32), tint: tones[Math.floor(ru() * tones.length)] };
      lists[v].push(it); stems += table[v].stems;
      if (g.wet) rings.push({ position: [x, 0.0, z], rotation: ru() * 6.283, scale: (0.5 + 0.14 * table[v].stems) * (0.8 + ru() * 0.4) });
      return true;
    };
    const pick = (odds) => { let u = ru(); for (const [k, w] of odds) { if ((u -= w) < 0) return k; } return odds[odds.length - 1][0]; };
    // ---- AT THE FOOT OF EVERY AVENUE TRUNK, where the scythe never reached: one full clump close against the bole, and
    // most often a lesser one or two a step away (the page: three to eight heads at the foot of every trunk)
    for (const e of O.trees) {
      if (e.kind !== 'sail') continue;
      const a0 = ru() * 6.283, r0 = 0.4 + ru() * 0.22;
      put(e.t.x + Math.cos(a0) * r0, e.t.z + Math.sin(a0) * r0, pick([['a', 0.5], ['b', 0.5]]));
      if (ru() < 0.7) { const a = a0 + 1.9 + ru() * 2.4, r = 0.5 + ru() * 0.6; put(e.t.x + Math.cos(a) * r, e.t.z + Math.sin(a) * r, pick([['c', 0.55], ['d', 0.45]]), 0.9); }
      if (ru() < 0.3) { const a = a0 - 1.2 - ru() * 1.5, r = 0.8 + ru() * 0.7; put(e.t.x + Math.cos(a) * r, e.t.z + Math.sin(a) * r, 'd', 0.8); }
    }
    // ---- ALONG THE MARGINS, on the shelf's snow within a boat's length of the water: in drifts with bare stretches
    // between, most of them hard by the edge; one in eight stands out in the skin ice, ringed
    let guard = 0;
    while (stems < want && guard++ < want * 12) {
      const s = plan.umbels.from + ru() * (plan.umbels.to - plan.umbels.from), side = ru() < 0.5 ? -1 : 1, z = -s;
      if (kit.noise(s * 0.11, side * 3.7, 21) < 0.42) continue;                                          // (drifts: bare stretches between)
      const out = ru() < 0.125 ? -(0.25 + ru() * 0.9) : 0.22 + Math.pow(ru(), 1.8) * plan.umbels.margin;
      const x = land.waterEdge(side, z) + side * out;
      if (!put(x, z, pick([['a', 0.2], ['b', 0.25], ['c', 0.3], ['d', 0.25]]))) continue;
      if (ru() < 0.4) put(x + (ru() - 0.5) * 0.9, z + (ru() - 0.5) * 0.9, pick([['c', 0.5], ['d', 0.5]]), 0.85);
    }
    let tris = 0, clumps = 0;
    // WHICH WEIGHT A CLUMP WEARS goes by how far the boat is from it (a cushion of snow nine centimetres across is two
    // pixels at sixty metres; the sprays at the ends of the rays are a pixel at seven): each weight of each clump is
    // one batch, refilled whenever the boat has moved a metre, with a metre of slack so that nothing flickers.
    const REACH = [+(Q.get('umbelr') || 7.5), 24, 55], SLACK = 1, FLOWERS = 30, forced = ['near', 'mid', 'far'].indexOf(Q.get('umbel'));
    const weightAt = (d) => (d < REACH[0] ? 0 : d < REACH[1] ? 1 : d < REACH[2] ? 2 : 3);
    const sets = [], _c = new THREE.Color();
    // (the caps wear the area's snow light, as every snow surface does: shared.light.lift, which lays snow's tones over
    // whatever wears it; the models mark their stalks, UV v = -2, and those are given back the ride's plain light)
    const stalksIn = { light: 'if (vUv0.y < -1.5) c = albedo * mix(vec3(1.0), shade, uShade) + albedo * ambient + albedo * lamps;' };
    const flowerPaint = shared.paint({ color: shared.inWater('#D6CBD6'), brush: 0.2, shade: 0, side: THREE.DoubleSide, extend: [L.holds, bend], own: true });
    for (const v of DES) {
      const list = lists[v]; if (!list.length) continue;
      const mats = list.map((it) => new THREE.Matrix4().compose(_p.set(...it.position), _q.setFromEuler(_e.set(it.rotation[0], it.rotation[1], it.rotation[2], 'YXZ')), _s.setScalar(it.scale)));
      const cols = list.map((it) => new THREE.Color(it.tint));
      // umbel_winter_X: the clump's dead stems and their caps of snow in one file, one draw (WINTER: what the water shows
      // is the same plant in flower; a dead grey stalk under it is a thread the mirror cannot draw). Thin: kept out of
      // the painter's filter.
      const meshes = [];
      for (const w of ['', '_mid', '_far']) {
        const st = await kit.models(`models/snow/umbel_winter_${v}${w}.glb`, list, { brush: 0.35, steps: 4, crisp: true, name: `umbel_winter_${v}${w}`, extend: [L.dusk, L.lift, bend, stalksIn, gold].filter(Boolean) });
        const m = st.meshes[0]; m.name = `umbel_winter_${v}${w} x${list.length} (winter)`; ctx.only(st.group, 'direct');
        m.frustumCulled = false; m.count = 0; m.userData.tris = st.triangles / list.length; meshes.push(notInPre(m));
      }
      clumps += list.length;
      // STAND-IN for the flood orchard's umbel in flower (MEMORY): a flat pale head on every cup of this clump, in the water only
      const head = new THREE.CircleGeometry(1, 6); head.rotateX(Math.PI / 2); head.deleteAttribute('uv');
      const parts = table[v].cups.map(([x, y, z, r]) => { const g = head.clone(); g.scale(r * 1.7, 1, r * 1.7); g.translate(x, y, z); return g; });
      const heads = mergeGeometries(parts, false); for (const g of parts) g.dispose(); head.dispose();
      const fl = kit.instances(heads, flowerPaint, list.map((it) => ({ ...it, tint: undefined })));
      fl.name = `standin:umbels in flower (memory) ${v} x${list.length}`; ctx.only(fl, 'mirror'); fl.frustumCulled = false; fl.count = 0;      // (placed exactly as the model is: heading first)
      sets.push({ list, mats, cols, meshes, fl, level: new Int8Array(list.length).fill(9) });
    }
    if (rings.length) {
      const ir = await kit.models('models/snow/ice_ring.glb', rings, { brush: 0.4, steps: 4, name: 'ice_ring', extend: [L.dusk, L.lift, iceIn, gold, farCrisp(12)].filter(Boolean) });
      ir.meshes[0].name = `ice_ring x${rings.length} (winter)`; ctx.only(ir.group, 'direct'); tris += ir.triangles;
    }
    count.umbels = { stems, clumps, inIce: rings.length, triangles: tris };
    let at = null;
    ctx.onUpdate(() => {
      const bx = ctx.boat.x, bz = ctx.boat.z;
      if (at && Math.hypot(bx - at[0], bz - at[1]) < 1) return;
      at = [bx, bz];
      let drawn = 0;
      for (const w of sets) {
        const k = [0, 0, 0]; let kf = 0;
        for (let i = 0; i < w.list.length; i++) {
          const p = w.list[i].position, d = Math.hypot(p[0] - bx, p[2] - bz), was = w.level[i];
          const now = forced >= 0 ? (d < REACH[2] ? forced : 3) : was <= 3 && was >= weightAt(d - SLACK) && was <= weightAt(d + SLACK) ? was : weightAt(d);
          w.level[i] = now;
          if (now < 3) { const m = w.meshes[now]; m.setMatrixAt(k[now], w.mats[i]); m.setColorAt(k[now]++, w.cols[i]); }
          if (d < FLOWERS) w.fl.setMatrixAt(kf++, w.mats[i]);
        }
        for (let n = 0; n < 3; n++) { const m = w.meshes[n]; m.count = k[n]; m.visible = k[n] > 0; m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; drawn += k[n] * m.userData.tris; }
        w.fl.count = kf; w.fl.visible = kf > 0; w.fl.instanceMatrix.needsUpdate = true;
      }
      count.umbels.drawn = Math.round(drawn);
    });
    nameAt(ctx, F, `cow parsley in winter: ${stems} stems in ${count.umbels.clumps} clumps`, [112, 12, 1.5]);
  }

  // ================================================================================================ the last apples the kit hangs
  {
    const ra = ctx.rng(7103), K = plan.kitApples, hung = [];
    for (const e of O.trees) {
      const design = O.models[e.model], low = design.limbs.find((l) => l.k === 'low');
      if (!low || e.t.s > 262) continue;
      // the bough's own line, and the spurs that stand on its flanks and hang under it (the design's own: nothing is placed by a typed number)
      const P = []; for (let i = 0; i < low.p.length; i += 4) P.push([low.p[i], low.p[i + 1], low.p[i + 2], low.p[i + 3]]);
      const nearLine = (x, y, z) => { let best = 9, by = 0; for (const q of P) { const d = Math.hypot(q[0] - x, q[1] - y, q[2] - z); if (d < best) { best = d; by = q[1]; } } return [best, by]; };
      const cand = [];
      // (a bough that will let its snow go and spring up, plan.slides, carries its apples on its inner half only: they
      // do not ride with the spring, and beyond three metres out the bough moves a hand or more)
      const sliding = (plan.slides || []).some(([ss, dd]) => Math.abs(e.t.s - ss) < 1 && Math.abs(e.t.d - dd) < 1), reach = sliding ? 3.1 : 5.4;
      for (let i = 0; i < design.spurs.length; i += 6) {
        const x = design.spurs[i], y = design.spurs[i + 1], z = design.spurs[i + 2];
        if (x < 1.3 || x > reach) continue;
        const [d, by] = nearLine(x, y, z);
        if (d < 0.26 && y < by + 0.035) cand.push([x, y, z]);
      }
      const most = Math.abs(e.t.s - K.most[0]) < 0.5 && Math.abs(e.t.d - K.most[1]) < 0.5, n = most ? K.mostCount : 2 + Math.floor(ra() * 2);
      // spread along the bough: never two within a hand of each other
      const picked = [];
      for (let tries = 0; tries < 400 && picked.length < n && cand.length; tries++) {
        const c = cand[Math.floor(ra() * cand.length)];
        if (picked.some((p) => Math.hypot(p[0] - c[0], p[2] - c[2]) < (most ? 0.22 : 0.5))) continue;
        picked.push(c);
      }
      // (each hangs from the top of its stalk, the model's origin: turned about the vertical and leaned a few degrees its own way)
      for (const c of picked) { const p = O.toRealm(e.t, c, new THREE.Vector3()); hung.push({ position: [p.x, p.y - 0.004, p.z], rotation: [(ra() - 0.5) * 0.34, ra() * 6.283, (ra() - 0.5) * 0.34], scale: 0.92 + ra() * 0.2 }); }
    }
    // windfalls: lying on their cheeks, half sunk in the skin ice at the margins
    const fallen = K.windfalls.map(([s, d]) => ({ position: [d, 0.038, -s], rotation: [1.25 + ra() * 0.5, ra() * 6.283, (ra() - 0.5) * 0.6], scale: 0.95 + ra() * 0.15 }));
    // (FOURTH HOLDER: THE HUNG APPLES ARE THE NEAR ONES, AND THEY DO NOT GLOW. A low bough passes two and a half metres
    // over a rider who sails in under it, and the nine at (216.5, +10) are the ones to study: the Outlier group's
    // apple_near*.glb (ten-sided, ribbed round the eye, a stalk that bends; one in three with a waxwing's work in its
    // cheek; a slumped cap), as on the outlier's own bough, and that group's two rules with them: beyond five metres an
    // apple is kept out of the painter's filter (it is nine pixels across), nearer it is painted; and three quarters of
    // what the bow lantern lays on an apple is taken off again (the page: "apples do not glow": at two metres they were
    // orange). The five windfalls keep the multitude's apple.)
    const stir = O.stir, far5 = farCrisp(5), matte = { light: 'c -= albedo * lamps * 0.75;' };
    const appleOpts = (ex) => ({ brush: 0.5, shade: 0.9, extend: [L.dusk, matte, ...ex].filter(Boolean) });
    const whole = hung.filter((_, i) => i % 3), pecked = hung.filter((_, i) => i % 3 === 0);
    const sets = [];
    if (whole.length) sets.push(await kit.models('models/snow/apple_near.glb', whole, { ...appleOpts([far5, stir]), name: 'apples on the low boughs' }));
    if (pecked.length) sets.push(await kit.models('models/snow/apple_near_pecked.glb', pecked, { ...appleOpts([far5, stir]), name: 'apples on the low boughs, pecked' }));
    if (hung.length) sets.push(await kit.models('models/snow/apple_near_cap.glb', hung, { brush: 0.35, steps: 4, name: 'apple caps (low boughs)', extend: [L.dusk, L.lift, stir, gold, far5].filter(Boolean) }));
    if (fallen.length) sets.push(await kit.models('models/snow/apple.glb', fallen, { ...appleOpts([farCrisp(3)]), name: 'windfalls in the ice' }));
    for (const set of sets) { ctx.only(set.group, 'direct'); set.meshes[0].name = set.group.name + ' (winter)'; notInPre(set.meshes[0]); }
    count.kitApples = { hung: hung.length, windfalls: fallen.length };
    shared.orchard.apples = hung.map((h) => new THREE.Vector3(...h.position));                           // (for the cast: where a bird feeds, where a crumb falls from)
  }

  // ================================================================================================ where a trunk meets the ice or the snow
  // (source-art/models/snow/close_band.py. The models mark what is ice, UV v = -2: `iceIn`, above.)
  const iceAndSnow = (extra = []) => ({ brush: 0.4, steps: 4, extend: [L.dusk, L.lift, iceIn, gold, ...extra].filter(Boolean) });
  {
    const rc = ctx.rng(8821), collars = { a: [], b: [] }, drifts = { a: [], b: [] };
    const lee = Math.atan2(-weather.x, -weather.z);                                                      // the turn that points a model's banked side (its -Z in the ride) into the weather
    for (const e of O.trees) {
      if (e.kind === 'mote') continue;
      const g = ground(e.t.x, e.t.z), k = (e.kind === 'sail' && e.t.low ? 1 : e.t.scale) || 1, v = rc() < 0.5 ? 'a' : 'b';
      // a trunk standing in the skin ice: the collar of ice (the old plate, the young one, its clear dark edge), with the
      // drift banked against the bole's weather side. Sized to its own trunk
      if (g.room > -0.25) { if (e.kind === 'sail') collars[v].push({ position: [e.t.x, 0.0, e.t.z], rotation: lee + (rc() - 0.5) * 0.7, scale: [k * (0.96 + rc() * 0.2), 0.9 + rc() * 0.25, k * (0.96 + rc() * 0.2)] }); }
      // a trunk standing in the snowed-over flood: the snow banked against its foot
      else drifts[v].push({ position: [e.t.x, g.y - 0.035, e.t.z], rotation: lee + (rc() - 0.5) * 0.7, scale: [k * (0.9 + rc() * 0.3), 0.8 + rc() * 0.5, k * (0.9 + rc() * 0.3)] });
    }
    let nc = 0, nd = 0;
    for (const v of ['a', 'b']) {
      if (collars[v].length) { const m = await kit.models(`models/snow/ice_collar_${v}.glb`, collars[v], { ...iceAndSnow(), name: `ice_collar_${v}` }); m.meshes[0].name = `ice_collar_${v} x${collars[v].length} (winter)`; ctx.only(m.group, 'direct'); nc += collars[v].length; }
      if (drifts[v].length) { const m = await kit.models(`models/snow/foot_drift_${v}.glb`, drifts[v], { ...iceAndSnow(), name: `foot_drift_${v}` }); m.meshes[0].name = `foot_drift_${v} x${drifts[v].length} (winter)`; ctx.only(m.group, 'direct'); nd += drifts[v].length; }
    }
    count.trunkFeet = { collars: nc, drifts: nd };
  }

  // ================================================================================================ the thirteen crutches' winter
  // The crutches under the avenue's long low boughs stand in the black road. Their winter is the Monument group's own
  // making, worn here exactly as heroes.js wears it on the nine under the oldest tree, so that every crutch of the
  // area is one kind of thing: crutch_snow.json (source-art/models/snow/crutch_snow.py, read from the flood orchard's
  // own crutch files) says where each design's poles run and whether it has a snow file; crutch_<X>_snow (the pillows
  // on a forked pole's prongs) takes its crutch's own matrix; crutch_ice (a collar of ice) is laid on the water round
  // every pole exactly where that pole goes through, at the pole's own thickness, its rime leaning as the pole leans.
  if (shared.crutches && shared.crutches.some((q) => !q.prop)) {
    let table = null;
    try { const r = await fetch('assets/models/snow/crutch_snow.json'); if (r.ok) table = (await r.json()).designs; } catch (err) { /* the Monument group's table is not there */ }
    if (!table) console.warn('snow/close: assets/models/snow/crutch_snow.json is not there: the thirteen crutches stand without their snow and their ice');
    else {
      const mine = shared.crutches.filter((q) => !q.prop), caps = {}, rings = [], lay = new THREE.Matrix4();
      const through = (leg, m) => {                                // where a pole goes through the water: followed ring by ring down from its head (heroes.js)
        let above = null, ra = 0;
        for (const ring of leg) {
          const q = _v.set(ring[1], -ring[0], ring[2]).applyMatrix4(m).clone();
          if (above && above.y > 0 && q.y <= 0) {
            const u = above.y / (above.y - q.y), rise = Math.max(0.05, above.y - q.y);
            return { x: above.x + (q.x - above.x) * u, z: above.z + (q.z - above.z) * u, r: ra + (ring[3] - ra) * u, lx: (above.x - q.x) / rise, lz: (above.z - q.z) / rise };
          }
          above = q; ra = ring[3];
        }
        return null;
      };
      for (const cr of mine) {
        const d = table[cr.name]; if (!d) continue;
        if (d.snow) (caps[cr.name] || (caps[cr.name] = [])).push(cr.matrix);
        for (const leg of d.legs || []) {
          const w = through(leg, cr.matrix);
          if (!w || plan.waterRoom(-w.z, w.x) <= 0) continue;
          const ci = rings.length, r = Math.min(0.16, Math.max(0.07, w.r)), lx = Math.max(-0.5, Math.min(0.5, w.lx)), lz = Math.max(-0.5, Math.min(0.5, w.lz));
          const k = r / 0.1 * (0.98 + 0.2 * ((ci * 0.618 + 0.3) % 1)), kz = k * (0.9 + 0.25 * ((ci * 0.37 + 0.6) % 1)), t = ci * 2.4 + 1.1, cs = Math.cos(t), sn = Math.sin(t);
          rings.push(new THREE.Matrix4().set(cs * k, lx, sn * kz, w.x, 0, 1, 0, 0.004, -sn * k, lz, cs * kz, w.z, 0, 0, 0, 1));
        }
      }
      const held = async (file, mats, material, name) => {
        try {
          const m = await kit.models(`models/snow/${file}`, mats.map(() => ({ position: [0, -60, 0] })), { brush: 0.4, name });
          const mesh = m.meshes[0]; mesh.material = material; mesh.name = name; mesh.frustumCulled = false;
          mats.forEach((mm, i) => mesh.setMatrixAt(i, mm)); mesh.instanceMatrix.needsUpdate = true;
          ctx.only(m.group, 'direct');
        } catch (err) { console.error(`INVALID_MODEL snow/close: ${file} did not load (${(err && err.message) || err})`); }
      };
      for (const [name, mats] of Object.entries(caps)) await held(`${name}_snow.glb`, mats, shared.mat.snowPaint, `${name}_snow x${mats.length}: the snow on the avenue's crutches (winter)`);
      if (rings.length) await held('crutch_ice.glb', rings, shared.mat.ice, `crutch_ice x${rings.length}: collars of ice round the avenue's crutch poles (winter)`);
      count.crutchWinter = { capped: Object.values(caps).reduce((n, v) => n + v.length, 0), collars: rings.length };
    }
  }

  // ================================================================================================ the zinc labels, furred with hoar
  {
    const rl = ctx.rng(9377), places = [];
    const face = Math.atan2(weather.x, weather.z);                                                       // (the hoar stands out on the label's own -Y in Blender: the ride's +Z before any turn; turned into the weather)
    for (const e of O.trees) {
      if (e.kind !== 'sail') continue;
      const lab = O.models[e.model].label; if (!lab) continue;
      const p = O.toRealm(e.t, lab, new THREE.Vector3());
      places.push({ position: [p.x, p.y, p.z], rotation: [0, face + (rl() - 0.5) * 1.1, 0], scale: 1 });
    }
    if (places.length) {
      const stir = O.stir;
      const lab = await kit.models('models/orchard/label.glb', places, { brush: 0.3, crisp: true, name: 'label', extend: [L.dusk, stir].filter(Boolean) });
      lab.meshes[0].name = `label x${places.length} (the flood orchard's, shared)`; notInPre(lab.meshes[0]);
      const hoar = await kit.models('models/snow/label_hoar.glb', places, { brush: 0.2, crisp: true, name: 'label_hoar', extend: [L.dusk, L.lift, stir, gold].filter(Boolean) });
      hoar.meshes[0].name = `label_hoar x${places.length} (winter)`; ctx.only(hoar.group, 'direct'); notInPre(hoar.meshes[0]);
    }
    count.labels = places.length;
    shared.orchard.labels = places.map((q) => q.position);
  }
  return {};
}
