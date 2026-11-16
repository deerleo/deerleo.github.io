// The town below: the street and the square (stage 2, kit and close band: docs/build/town/2-kit-streets.md).
//   - the stonework (town_street.py -> models/town/town_street.glb, town_steps.glb, in the realm's own place): the raised
//     walk with its shop arches, the leat and the basin's quay, the footbridge, the carriageway's setts, the square's
//     paving with its radial joints, the hour ring's rail and the hour stones; the street of steps on the hill;
//   - the lamps (town_lamps.py): sixty standards of three kinds, instanced; their heads burn and wake and sleep with
//     the town; the three on the street of steps that stand above the waterline are dark;
//   - the washing on its ten lines (the engine's cloth, dressed in the area's light);
//   - poplars, the lime, stalls, skiffs, the viaduct, the theatre's bulk.
// It builds after kit_houses.js (whose paint it shares) and before kit.js, which leaves out the stand-ins of what is real
// here (shared.kitStreet, shared.kitLamps, ...).
//
// Developer switches (address):  &ks=stone,lamps,cloth,...  build only these parts
import * as THREE from 'three';
import { ensureLight } from './light.js';
import { bakeInstanced, routeKey, reach } from './kit_bake.js';

const Q = new URLSearchParams(typeof location !== 'undefined' ? location.search : '');
const ONLY = (Q.get('ks') || '').split(',').filter(Boolean);
const want = (part) => !ONLY.length || ONLY.includes(part);

export async function build(ctx, plan, shared) {
  const { kit } = ctx;
  const light = ensureLight(ctx, plan, shared), town = light.town;
  const col = (c) => new THREE.Color(c);
  const K = shared.khKit || {};
  const tPlaster = K.tPlaster || await ctx.tex('art/town/surfaces_plaster.webp', { repeat: true });
  const tPaving = await ctx.tex('art/town/surfaces_paving.webp', { repeat: true });
  const SPILL = K.SPILL || null;
  const tone = K.tone || (() => null);      // values drawn together under the water (kit_houses.js, "Tone"): pale paint was a mint line drawing there
  const updates = [];
  // WEIGHT (taken over a fourth time: kit_bake.js, "within reach of the boat"): what lies under the water is drawn only within
  // REACH metres of the boat along the route; the lamps' halos, which are lights, everywhere.
  const key = routeKey(ctx.path), near = reach(), REACH = Q.get('ksreach') === null ? 70 : +Q.get('ksreach');
  updates.push(() => near.update(ctx.s || 0, REACH));

  // ---------------------------------------------------------------------------------------------- stonework
  // wall: stone in the area's light, with the shop arches' light on their reveals; paving: the painted setts laid on
  // from above, taking more of the street's own lamplight than a wall does (it is what the lamps shine on).
  if (want('stone')) {
    // (the second look: the walk's parapet, four metres under the keel, and every quay and pier were one skin of plaster.
    // The street's stone is laid in COURSES now, drawn where it stands: a foot high, stones two to three feet long breaking
    // joint, each its own tone, a dark joint between; far off the joints melt away instead of crawling.)
    // (taken over a fourth time: what LOOKS UP of the street's stone was one flat tone: the parapet's coping four metres under the
    // keel, the leat's copings, and the leat's bed, a pale band five metres wide down the right of every picture over that side.
    // Copings are laid in stones now, a joint every stride along the street, each stone its own tone; the leat's bed is silt
    // drawn out along the flow, stones lying in it, pale and dark, and weed in dark streaks.)
    const ASHLAR = {
      fragmentPars: /* glsl */`float kaH(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float kaN(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(kaH(i), kaH(i + vec2(1.0, 0.0)), f.x), mix(kaH(i + vec2(0.0, 1.0)), kaH(i + vec2(1.0, 1.0)), f.x), f.y); }`,
      albedo: /* glsl */`{ vec3 kaa = abs(N);
        if (kaa.y < 0.6) { float kau = kaa.x > kaa.z ? vWPos.z : vWPos.x, kav = vWPos.y;
          float kac = floor(kav / 0.31), kah = fract(sin(kac * 12.9898) * 43758.5453), kal = 0.62 + 0.22 * kah;
          float kax = kau / kal + kah * 7.0 + 0.5 * mod(kac, 2.0), kaf = fract(kax), kag = fract(kav / 0.31);
          float kaid = fract(sin(dot(vec2(floor(kax), kac), vec2(127.1, 311.7))) * 43758.5453);
          float kadj = min(min(kaf, 1.0 - kaf) * kal, min(kag, 1.0 - kag) * 0.31);
          float kapx = max(length(vec2(dFdx(kau), dFdy(kau))), length(vec2(dFdx(kav), dFdy(kav))));
          float kafade = 1.0 - smoothstep(0.02, 0.08, kapx);
          albedo *= mix(1.0, 0.80 + 0.40 * kaid, kafade * 0.85);
          albedo *= 1.0 - 0.5 * (1.0 - smoothstep(0.004, 0.012 + kapx, kadj)) * kafade; } }`,
    };
    // (laid on AFTER the stone's values are drawn together under the water, `tone`, or they are drawn in with them: what looks up)
    const UPSTONE = {
      albedo: /* glsl */`if (N.y > 0.6 && vWPos.y > -19.5) { float kupx = max(length(dFdx(vWPos)), length(dFdy(vWPos))), kufade = 1.0 - smoothstep(0.025, 0.1, kupx);
          if (vUv0.y > 0.5) {                                                        // the leat's bed (the model marks it: v of its UV)
            albedo *= 0.66 + 0.68 * kaN(vWPos.xz * vec2(1.3, 0.33) + 7.0);            // silt, drawn out along the flow
            vec2 kpc = vWPos.xz / 0.46, kpi = floor(kpc), kpf = fract(kpc) - 0.5 - (vec2(kaH(kpi + 5.3), kaH(kpi + 9.7)) - 0.5) * 0.4;
            float kpr = 0.15 + 0.25 * kaH(kpi + 3.1), kst = (1.0 - smoothstep(kpr - 0.07, kpr, length(kpf * vec2(1.0, 0.8)))) * step(0.5, kaH(kpi)) * kufade;
            albedo = mix(albedo, albedo * (kaH(kpi + 1.7) > 0.3 ? 0.36 + 0.3 * kaH(kpi + 2.9) : 1.5), kst);      // stones lying in it: most dark and wet, some scoured pale
            float kwd = smoothstep(0.5, 0.74, kaN(vWPos.xz * vec2(2.4, 0.2) + 31.0)) * (0.45 + 0.55 * kaN(vWPos.xz * 0.9 + 3.0));
            albedo = mix(albedo, albedo * vec3(0.2, 0.36, 0.25), kwd * 0.9);        // weed, in dark streaks down the flow
          } else {
            float kcb = floor(vWPos.x * 0.25 + 0.5), kcz = vWPos.z / 0.86 + kcb * 0.37, kcf = fract(kcz);
            albedo *= mix(1.0, 0.72 + 0.56 * kaH(vec2(floor(kcz), kcb)), kufade * 0.85);
            albedo *= 1.0 - 0.55 * (1.0 - smoothstep(0.004, 0.014 + kupx, min(kcf, 1.0 - kcf) * 0.86)) * kufade; } }`,
    };
    // (taken over: the carriageway under the washing, the walk's deck and the quays' tops were featureless slabs: the painted
    // setts are half a metre across and soft. SETTS are drawn where they lie on everything that faces up: rows a hand and a
    // half deep across the street, each sett a little longer or shorter than its neighbour, breaking joint, each its own
    // value (a lamp's pool lies on single stones now), a few worn pale; they melt away with distance and at a glance.)
    // (taken over again: THE SQUARE'S FLOOR was a blank: sixty metres of paving twenty-two metres down with nothing on it that
    // could be seen from the boat. The square is laid in FLAGS in rings round the tower's axis, breaking joint, each flag
    // its own value: the lake bed's own rule and numbers (set.js), which the hour ring's pools of light are drawn by too,
    // so that all three lie on one another. And over them the square's great figure, which is what reads from the boat: a
    // WHEEL of pale stone, twenty-four rays running out from the tower between two pale rings and a rim, each a double row
    // of long pale flags either side of the joint the model lays there: "the joints of the square's paving radiating from
    // the tower", straight things for the water to bend. The bands are laid on AFTER the paving's values are drawn
    // together (`tone`), or they would be drawn in with them. &kswheel=0 the square without its wheel; &kswheel=<how pale>)
    const twq = town.xz(plan.tower.s, plan.tower.d);
    const SETTS = {
      uniforms: { uKsSquare: { value: new THREE.Vector4(twq[0], twq[1], town.along(plan.tower.s), plan.tower.hourRing.radius - 0.4) }, uKsWheel: { value: Q.get('kswheel') === null ? 13.0 : +Q.get('kswheel') } },      // (the water between draws every value together: a pale flag must be painted many times its neighbour to stand a step above it 22 m down)
      fragmentPars: /* glsl */`uniform vec4 uKsSquare; uniform float uKsWheel; float gKsBand;
        float ksqHash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }`,
      albedo: /* glsl */`{ gKsBand = 0.0;
        if (N.y > 0.6) { float kspx = max(length(dFdx(vWPos)), length(dFdy(vWPos)));
          vec2 ksq = vWPos.xz - uKsSquare.xy; float ksqr = length(ksq);
          if (vWPos.y < -20.5 && ksqr < 30.6) {
            float kbring = floor(ksqr / 2.2), kbn = max(8.0, floor(6.2832 * (kbring + 0.5) * 2.2 / 1.7)), kban = atan(ksq.y, ksq.x);
            float kba = (kban + uKsSquare.z) / 6.2832 * kbn + 0.5 * mod(kbring, 2.0);
            float kbdr = min(fract(ksqr / 2.2), 1.0 - fract(ksqr / 2.2)) * 2.2, kbda = min(fract(kba), 1.0 - fract(kba)) * 6.2832 / kbn * ksqr;
            float kbsoft = max(kspx, 0.02), kbhold = 1.0 - smoothstep(0.12, 0.4, kspx);
            albedo *= mix(1.0, 0.78 + 0.44 * ksqHash(vec2(kbring, floor(kba))), kbhold);
            albedo *= 1.0 - 0.5 * (1.0 - smoothstep(0.03 - kbsoft, 0.03 + kbsoft, min(kbdr, kbda))) * kbhold;
            // the wheel: rays (a double row of long flags either side of each radial joint) between the rings at 12 and 19 m and out to the rim
            float kray = abs(fract(kban / 6.2832 * 24.0) - 0.5) / 24.0 * 6.2832 * ksqr;
            float kwb = (1.0 - smoothstep(0.27, 0.27 + kbsoft * 2.0, kray)) * step(12.0, ksqr);
            float kring = min(min(abs(ksqr - 12.0), abs(ksqr - 19.0)), abs(ksqr - 29.7));
            kwb = max(kwb, 1.0 - smoothstep(0.3, 0.3 + kbsoft * 2.0, kring));
            // its flags: each a stride long, cut square across its band, each its own value
            float kalong = kring < 0.5 ? kban * ksqr : ksqr, kcell = floor(kalong / 0.95), kcj = min(fract(kalong / 0.95), 1.0 - fract(kalong / 0.95)) * 0.95;
            gKsBand = kwb * (0.82 + 0.3 * ksqHash(vec2(kcell, floor(kban * 3.82)))) * (1.0 - 0.45 * (1.0 - smoothstep(0.02, 0.03 + kbsoft, kcj)) * kbhold);
          } else {
            float ksr = floor(vWPos.z / 0.17), ksh = fract(sin(ksr * 12.9898) * 43758.5453), ksl = 0.2 + 0.08 * ksh;
            float ksx = vWPos.x / ksl + ksh * 7.0, ksf = fract(ksx), ksg = fract(vWPos.z / 0.17);
            float ksid = fract(sin(dot(vec2(floor(ksx), ksr), vec2(127.1, 311.7))) * 43758.5453);
            float ksdj = min(min(ksf, 1.0 - ksf) * ksl, min(ksg, 1.0 - ksg) * 0.17);
            float ksfade = 1.0 - smoothstep(0.03, 0.11, kspx);
            albedo *= mix(1.0, (0.70 + 0.56 * ksid) * (ksid > 0.93 ? 1.35 : 1.0), ksfade * 0.9);
            albedo *= 1.0 - 0.5 * (1.0 - smoothstep(0.004, 0.014 + kspx, ksdj)) * ksfade; } } }`,
    };
    const WHEEL = { albedo: 'albedo = mix(albedo, albedo * 2.0 + 0.014, gKsBand * uKsWheel);' };
    // The leat lies between the street lamps' pools and the houses that rise from it, and was in the dark: nothing in it could
    // be found. Its bed takes the light of the windows that open on it and of the lamps along its kerb (the town's own map of
    // its lights, soft, asleep and awake with the street): a faintly lit bed, on which what is sunk in the leat lies dark.
    // After the area's light, as its keeper asks. &ksleat=<strength>
    const LEATLIGHT = {
      uniforms: { uKsLeat: { value: col('#F0885C').multiplyScalar(Q.get('ksleat') === null ? 0.2 : +Q.get('ksleat')) } }, fragmentPars: 'uniform vec3 uKsLeat;',
      light: /* glsl */`if (vUv0.y > 0.5 && vWPos.y < -0.5) { vec4 kg2 = townGlow(vWPos.xz); float kl2 = townWake(townS(kg2), vWPos.xz, -1.0, kg2.a);
        glow += uKsLeat * (smoothstep(0.05, 0.5, kg2.r) * smoothstep(0.25, 1.0, kl2) * kl2) * (0.25 + 0.75 * albedo); }`,
    };
    const mats = {
      wall: { map: tPlaster, triplanar: 2.8, brush: 0.9, extend: [ASHLAR, tone('stone', 0.12, 0.045, 0.3), UPSTONE, light.extendFor(0.55), SPILL, LEATLIGHT].filter(Boolean) },
      paving: { map: tPaving, triplanar: 3.2, brush: 0.7, extend: [SETTS, tone('paving', 0.17, 0.13, 0.5), WHEEL, light.extendFor(0.6)].filter(Boolean) },      // (large lit surfaces stay under about 0.6 in this light)
    };
    const street = await kit.model('models/town/town_street.glb', { position: [0, 0, 0], materials: mats });
    ctx.only(street.group, 'direct');
    await kit.model('models/town/town_steps.glb', { position: [0, 0, 0], materials: mats });      // it crosses the surface: the mirror has it
    shared.kitStreet = true;
  }

  // ---------------------------------------------------------------------------------------------- lamps
  // lamp_standard_1, lamp_standard_2, harp_lamp (town_lamps.py): sixty standards where the layout stands its lamps. The
  // lamp row on the raised walk and the two at the theatre steps are harp lamps; the streets' are the two standards by
  // turns; the street of steps has the older post. No two stand alike: each is turned, leans a degree or two, and is a
  // little taller or stouter. A lantern is lit only below the waterline (so the three highest on the street of steps are
  // dark: the rule of the place), and wakes and sleeps with the town. Every standard is shortened a little so that its
  // cap stays under the surface where its lantern burns 0.4 m down: the lamp row is harmless to the hull.
  if (want('lamps')) {
    const rnd = ctx.rng(606), TOP = { harp_lamp: 4.96, lamp_standard_1: 4.84, lamp_standard_2: 4.72 };
    const GLASS = {
      uniforms: { uKsLamp: { value: col('#FFC27A').multiplyScalar(plan.gain.lampHead) }, uKsLampCore: { value: col('#FFE2B8').multiplyScalar(plan.gain.lampHead * 1.3) } },
      fragmentPars: 'uniform vec3 uKsLamp, uKsLampCore;',
      light: /* glsl */`{ float kUnder = 1.0 - smoothstep(-0.012, 0.012, vWPos.y); vec4 kg = townGlow(vWPos.xz); float kl = townWake(townS(kg), vWPos.xz, -1.0, 0.6);
        glow += mix(uKsLamp, uKsLampCore, pow(clamp(dot(N, V), 0.0, 1.0), 2.0)) * (kl * kUnder); }`,
    };
    const sets = {};
    const put = (name, awash, p) => (sets[name + (awash ? '|a' : '')] || (sets[name + (awash ? '|a' : '')] = { name, awash, list: [] })).list.push(p);
    const halo = [];
    town.lamps.forEach((l, i) => {
      if (l.kind === 'row' && l.s > 119 && l.s < 147 && Math.abs(l.d - plan.church.d) < plan.church.width / 2) return;      // (the lamp row's last two, s 120 and 132, would stand inside the church's nave: the page puts the row at d -6 and the ridge at d -5. They are left out; their light stays in the glow map, where the nave burns anyway)
      const name = l.kind === 'row' ? 'harp_lamp' : l.kind === 'street' ? (i % 3 === 1 ? 'lamp_standard_2' : 'lamp_standard_1') : 'lamp_standard_2';
      const h = l.y - l.foot, sy = (h + 0.33) / TOP[name], k = 0.94 + rnd() * 0.14, awash = l.y > -0.9 && l.kind !== 'row';
      put(name, awash, { position: [l.x, l.foot, l.z], rotation: [(rnd() - 0.5) * 0.06, town.along(Math.min(ctx.path.length, Math.max(0, l.s))) + Math.floor(rnd() * 4) * Math.PI / 2 + (rnd() - 0.5) * 0.3, (rnd() - 0.5) * 0.06], scale: [k, sy, k],
        tint: ['#ffffff', '#e9e2f0', '#f0f4ea', '#f6e8e2'][Math.floor(rnd() * 4)] });
      if (l.plinth !== undefined) put('lamp_plinth', false, { position: [l.x, l.plinth, l.z], rotation: [0, town.along(l.s), 0], scale: [1, l.foot - l.plinth, 1] });
      if (l.y < -0.05) halo.push({ x: l.x, y: l.y - 0.15, z: l.z, size: l.kind === 'row' ? 3.4 : 2.6, color: '#FFB86A', s: l.s, rnd: -1, stay: 0.6 });
    });
    const under = [], awash = [];
    for (const set of Object.values(sets)) {
      const m = await kit.models(`models/town/${set.name}.glb`, set.list, { materials: {
        paint: set.name === 'lamp_plinth' ? { brush: 0.6, extend: [light.extendFor(0.6)], map: tPlaster, triplanar: 2.4 } : { brush: 0.6, extend: [light.extendFor(0.2)] },      // (cast iron takes little of the lamplight: at 0.6 a post under its own lantern was a salmon stick)
        glass: { color: '#2a2034', brush: 0, shade: 0, extend: [light.extendFor(0), GLASS] },
      } });
      for (const mesh of m.meshes) mesh.frustumCulled = false;
      if (set.name === 'lamp_plinth') ctx.only(m.group, 'direct'); else (set.awash ? awash : under).push(m);
    }
    // (the three kinds stand still: poured into ONE mesh, iron and glass together: u of a point's UV is 1 on the glass, which
    // gives off the lantern's light; those that reach the surface apart, for the mirror)
    const LAMP1 = { uniforms: GLASS.uniforms, fragmentPars: GLASS.fragmentPars,
      light: /* glsl */`if (vUv0.x > 0.5) { float kUnder = 1.0 - smoothstep(-0.012, 0.012, vWPos.y); vec4 kg = townGlow(vWPos.xz); float kl = townWake(townS(kg), vWPos.xz, -1.0, 0.6);
        glow += mix(uKsLamp, uKsLampCore, pow(clamp(dot(N, V), 0.0, 1.0), 2.0)) * (kl * kUnder); }` };
    const lampMat = () => kit.gouache({ color: '#ffffff', vertexColors: true, brush: 0.6, extend: [light.extendFor(0.2), LAMP1] });
    const lampMerge = () => ({ slots: ['paint', 'glass'], flag: { glass: 1 }, tint: { glass: '#2a2034' }, material: lampMat() });
    // (drawn within TWICE the reach: a lantern's lit glass is a point of light that is seen far through this water, where its iron is not)
    { const lampNear = reach(); updates.push(() => lampNear.update(ctx.s || 0, REACH * 2));
      for (const mesh of bakeInstanced(ctx, under, { name: 'town-lamps', merge: lampMerge() })) { ctx.only(mesh, 'direct'); lampNear.sorted(mesh, key); } }
    if (awash.length) bakeInstanced(ctx, awash, { name: 'town-lamps-awash', merge: lampMerge() });
    if (light.halos && halo.length) ctx.add(light.halos(halo, { gain: 0.7 }));
    shared.kitLamps = true;
  }

  // ---------------------------------------------------------------------------------------------- washing
  // Ten lines of washing: sheets, towels, cloths and one quilt (nothing with the shape of a body), each line slung
  // between two things that are there: a house's wall head and the wall across the street, a wall and a lamp's ladder bar.
  // Three cross the street at s 78, 84 and 92 (the page's washing street).
  // The engine's cloth (src/engine/cloth.js) is its own material and cannot wear an area's light: under this water it would
  // hang lit as in air, crisp at any distance. So the washing is one instanced mesh in the area's material, moved in its
  // vertex shader after the engine's cloth: slow travelling folds (each piece a period of its own, 5 to 9 s), pleats
  // that deepen toward the hem, and the water's own movement (a wake or a ring passing over rocks whatever hangs under it).
  if (want('cloth')) {
    const rnd = ctx.rng(7107), F = plan.floorAt, P = (s, d, y) => { const [x, z] = town.xz(s, d); return new THREE.Vector3(x, y, z); };
    const L1 = town.houses.filter((h) => h.row === 'L1'), eavesAt = (s) => L1.reduce((a, b) => (Math.abs(b.s - s) < Math.abs(a.s - s) ? b : a)).eaves;
    const lampAt = (s, d) => town.lamps.reduce((a, b) => (Math.hypot(b.s - s, b.d - d) < Math.hypot(a.s - s, a.d - d) ? b : a));
    const bar = (l) => new THREE.Vector3(l.x, l.foot + 3.2, l.z);
    const rb = (s) => town.rbRidge(s) - 4.03;
    const lines = [
      [P(78, -7.46, eavesAt(78) - 0.3), P(78.6, rb(78), -3.4)], [P(84, -7.46, eavesAt(84) - 0.3), P(84.4, rb(84), -4.2)], [P(92, -7.46, eavesAt(92) - 0.3), P(91.2, rb(92), -5.0)],
      [P(70, -7.46, eavesAt(70) - 0.25), P(70.5, rb(70), -3.1)],
      [P(41, -7.46, eavesAt(41) - 0.3), bar(lampAt(40, 4.6))], [P(55, -7.46, eavesAt(55) - 0.3), bar(lampAt(54, 4.6))],
      [P(66, -20.04, -5.2), P(66, -24.46, -5.4)], [P(34, -20.04, -4.8), P(34, -24.46, -5.0)],
      [P(112, -7.46, eavesAt(112) - 0.3), bar(lampAt(110, 4.6))], [P(99, rb(99), -9.4), bar(lampAt(96, 4.6))],
    ];
    // (the second look: five pale cloths all came out one mint under the water, a string of flags. Only value and warm against
    // cool show there: linen and ticking pale and cool, worn rose and ochre mid and warm (they go violet), blues and an
    // indigo dark: on any line a pale piece hangs between darker ones)
    const pale = ['#aaa3b6', '#a8737c', '#6d7a92', '#a3835f', '#4d4863', '#8f96a0', '#93606f', '#b8aea6'];
    // (taken over: still a string of flags: every piece about one size, one gap apart. A line is hung as a household hangs
    // it now: a sheet; a pair of towels; a run of small cloths peg to peg; a long runner; then a stretch of bare line. Most
    // of it is white linen in four whites (it is washing), a few pieces dyed and worn, one dark on a line at most. Nothing
    // narrower than 0.56 m: the cast tells a curtain from washing by its width.)
    const LINEN = ['#d6d0cc', '#cdc2ae', '#c2c7d0', '#d8d1c0'], DYED = ['#a8737c', '#a3835f', '#7d8aa2', '#93606f', '#8f96a0'], DARK = ['#4d4863', '#44506e'];
    const pick = (list) => list[Math.floor(rnd() * list.length)];
    const pieces = [], ropes = [];
    lines.forEach(([a, b], li) => {
      const len = a.distanceTo(b), sag = 0.12 + len * 0.022, dir = b.clone().sub(a), yaw = Math.atan2(-dir.z, dir.x);
      const at = (t) => a.clone().lerp(b, t).add(new THREE.Vector3(0, -sag * 4 * t * (1 - t), 0));
      ropes.push({ at, len });
      let x = (len > 6 ? 1.25 : 0.45) + rnd() * 0.5, dark = false, quilt = li !== 1, guard = 0;      // (nothing in the first metre from a wall: a white cloth hard by a lit window was a card of paper at the gunwale)
      const hang = (w, h, color, kind, stiff = 0) => {
        if (x + w > len - (len > 6 ? 1.0 : 0.4)) return false;
        const p = at((x + w / 2) / len);
        pieces.push({ p, yaw, w, h: Math.min(h, p.y - (F(Math.min(ctx.path.length, 100)) + 0.6)), color, kind, second: Math.floor(rnd() * 4), phase: rnd() * 40, stiff });
        x += w; return true;
      };
      while (x < len - 1.0 && guard++ < 14) {
        const r = rnd();
        if (!quilt && x > len * 0.3) { quilt = true; if (!hang(2.0, 1.7, '#8c8190', 4, 0.35)) break; }      // the one quilt: on the line at s 84
        else if (r < 0.28) { if (!hang(1.6 + rnd() * 0.6, 1.25 + rnd() * 0.45, rnd() < 0.85 ? pick(LINEN) : DYED[4], rnd() < 0.2 ? 1 : 0)) break; }      // a sheet
        else if (r < 0.52) { const c = rnd() < 0.6 ? pick(LINEN) : pick(DYED), k = rnd() < 0.7 ? 2 : 0, h = 1.0 + rnd() * 0.3;      // a pair of towels, or one
          if (!hang(0.6 + rnd() * 0.14, h, c, k)) break; if (rnd() < 0.7) { x += 0.07 + rnd() * 0.06; hang(0.6 + rnd() * 0.14, h * (0.92 + rnd() * 0.12), rnd() < 0.7 ? c : pick(DYED), k); } }
        else if (r < 0.84) { const n = 2 + Math.floor(rnd() * 3);                                              // a run of small cloths, peg to peg
          for (let k = 0; k < n; k++) { const d = !dark && rnd() < 0.16; if (d) dark = true;
            if (!hang(0.56 + rnd() * 0.16, 0.56 + rnd() * 0.22, d ? pick(DARK) : rnd() < 0.5 ? pick(LINEN) : pick(DYED), rnd() < 0.45 ? 3 : rnd() < 0.3 ? 1 : 0)) break; x += 0.05 + rnd() * 0.08; } }
        else { if (!hang(0.58 + rnd() * 0.1, 1.5 + rnd() * 0.4, pick(LINEN), 1)) break; }                       // a long runner in ticking
        x += 0.35 + rnd() * 0.7 + (rnd() < 0.22 ? 1.0 + rnd() * 1.4 : 0);
      }
    });
    // and twenty-four curtains drawn out of open windows by the water (the page's cloth list): a narrow pale cloth hanging
    // outside the head of a lit window on the street's fronts, to one side of the opening
    { const W = town.windows, near = shared.kitHouses || new Set(), cand = [];
      for (const h of town.houses) { if (!near.has(h) || !h.front) continue; const c = Math.cos(h.yaw), sn = Math.sin(h.yaw);
        for (const w of W) { if (w.pitch || w.h !== 1.5 || w.y > -1.6) continue; const dx = w.x - h.x, dz = w.z - h.z, lx = dx * c - dz * sn, lz = dx * sn + dz * c;
          if (Math.abs(lx) < h.w / 2 - 0.6 && Math.abs(Math.abs(lz) - (h.dep / 2 + 0.06)) < 0.02 && w.y > h.floor + 3) cand.push(w); } }
      for (let k = 0; k < 24 && cand.length; k++) {
        const w = cand.splice(Math.floor(rnd() * cand.length), 1)[0], side = rnd() < 0.5 ? -1 : 1, ox = Math.cos(w.yaw), oz = -Math.sin(w.yaw), nx = Math.sin(w.yaw), nz = Math.cos(w.yaw);
        pieces.push({ p: new THREE.Vector3(w.x + ox * side * 0.26 + nx * 0.05, w.y + 0.72, w.z + oz * side * 0.26 + nz * 0.05), yaw: w.yaw, w: 0.42 + rnd() * 0.12, h: 1.0 + rnd() * 0.5, color: ['#6f5a66', '#7a4f58', '#5b6274', '#7c6a52', '#66506a', '#566a66'][Math.floor(rnd() * 6)], kind: rnd() < 0.3 ? 1 : 0, second: Math.floor(rnd() * 4), phase: rnd() * 40, stiff: 0 });      // (a curtain is heavier stuff than washing, dyed and dark: pale, beside its own lit window, it was a sheet of cream paper)
      } }
    // the cloth: a sheet hanging from y = 0, eight by twelve
    const geo = new THREE.PlaneGeometry(1, 1, 8, 12); geo.translate(0, -0.5, 0);
    geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(geo.attributes.position.count * 3).fill(1), 3));
    const n = pieces.length, aCloth = new Float32Array(n * 4);
    const sway = { value: new THREE.Vector2(ctx.reducedMotion ? 0.5 : 1.0, ctx.reducedMotion ? 0.3 : 0.9) };
    const CLOTH = {
      uniforms: { uKsSway: sway, uKsSecond: { value: ['#C76C8C', '#4AA391', '#7850A6', '#C9936F'].map(col) } },
      vertexPars: 'attribute vec4 aCloth; varying vec4 vCloth; varying vec2 vClothUv, vClothSize; varying vec3 vClothT; uniform sampler2D tRipple; uniform vec4 uRippleRect; uniform vec2 uKsSway;',
      vertexLocal: /* glsl */`vCloth = aCloth; vClothUv = vec2(position.x + 0.5, -position.y);
        float kDown = -position.y, kFree = pow(kDown, 1.3) * (1.0 - aCloth.z), kPh = aCloth.x, kW = 1.0, kL = 1.0;
        vec3 kN = vec3(0.0, 0.0, 1.0), kT = vec3(1.0, 0.0, 0.0);
        #ifdef USE_INSTANCING
          kN = normalize(mat3(modelMatrix) * instanceMatrix[2].xyz); kT = normalize(mat3(modelMatrix) * instanceMatrix[0].xyz);
          kW = length(instanceMatrix[0].xyz); kL = length(instanceMatrix[1].xyz);
        #endif
        vClothSize = vec2(kW, kL); vClothT = kT;`,
      vertexWorld: /* glsl */`{
        float kt = uTime * 6.2832 / mix(5.0, 9.0, fract(kPh * 0.37)), kx = position.x * kW;
        float kfold = sin(kt + kPh + kDown * kL * 2.6 + kx * 1.7) * 0.6 + sin(kt * 0.61 + kPh * 1.7 + kDown * kL * 1.4) * 0.4;
        float kpl = (sin(kx * 7.5 + kPh * 3.0) * 0.05 + sin(kx * 17.0 + kPh * 1.3 + kDown * 1.5) * 0.018) * (0.35 + 0.65 * kFree);
        float kamp = uKsSway.x * mix(0.25, 0.6, fract(kPh * 0.71)) * kFree;
        vec2 kuv = (wp.xz - uRippleRect.xy) / uRippleRect.zw + 0.5;
        vec4 krp = (kuv.x > 0.0 && kuv.x < 1.0 && kuv.y > 0.0 && kuv.y < 1.0) ? texture2D(tRipple, kuv) : vec4(0.0);
        float kdeep = exp(min(wp.y, 0.0) / 5.0);
        wp.xyz += kN * (kfold * kamp + kpl) + kT * (sin(kt * 0.8 + kPh * 0.6 + kDown * 3.0) * kamp * 0.25);
        wp.xz += krp.xy * (uKsSway.y * kFree * kdeep);
        wp.y += abs(kfold) * kamp * 0.12 + length(krp.xy) * uKsSway.y * 0.2 * kFree * kdeep;
        float kdf = cos(kt + kPh + kDown * kL * 2.6 + kx * 1.7) * 1.02 * kamp + (cos(kx * 7.5 + kPh * 3.0) * 0.375 + cos(kx * 17.0 + kPh * 1.3 + kDown * 1.5) * 0.306) * (0.35 + 0.65 * kFree);
        wn = normalize(kN - kT * kdf);
      }`,
      fragmentPars: 'varying vec4 vCloth; varying vec2 vClothUv, vClothSize; varying vec3 vClothT; uniform vec3 uKsSecond[4]; vec3 gKsCloth; float gKsWr;',
      albedo: /* glsl */`{
        vec2 km = vClothUv * vClothSize; float kk = floor(vCloth.y + 0.5); int ks = int(vCloth.w + 0.5);
        vec3 k2 = ks == 0 ? uKsSecond[0] : ks == 1 ? uKsSecond[1] : ks == 2 ? uKsSecond[2] : uKsSecond[3];
        k2 = mix(vec3(1.0), k2 * 1.5, 0.85);                                     // (a second colour is a second VALUE here: stripes, bands and checks about half as light as their cloth)
        if (kk > 0.5 && kk < 1.5) { float kts = fract(km.x / 0.13); albedo *= mix(vec3(1.0), k2, (step(0.56, kts) - step(0.66, kts)) + (step(0.80, kts) - step(0.97, kts))); }      // ticking: a thin line and a broader one, a hand apart (half and half it was a deck chair)
        else if (kk < 2.5 && kk > 1.5) { float ke = min(km.y, vClothSize.y - km.y); albedo *= mix(vec3(1.0), k2, step(0.08, ke) - step(0.22, ke)); }   // a towel's bands
        else if (kk < 3.5 && kk > 2.5) albedo *= mix(vec3(1.0), k2, (step(0.5, fract(km.x / 0.22)) + step(0.5, fract(km.y / 0.22))) * 0.42);            // a check
        else if (kk > 3.5) { vec2 kc = floor(km / 0.34); float kh = fract(sin(dot(kc, vec2(12.9898, 78.233))) * 43758.5453);
          albedo *= mix(vec3(1.0), mix(k2, vec3(0.72, 0.92, 0.84), step(0.5, kh)), 0.3 + 0.6 * fract(kh * 7.0));
          vec2 kq = abs(fract(km / 0.34) - 0.5); albedo *= 1.0 - 0.25 * step(0.46, max(kq.x, kq.y)); }                         // the quilt's patches and its seams
        albedo *= 1.0 - 0.22 * (1.0 - smoothstep(0.0, 0.05, min(min(km.x, vClothSize.x - km.x), vClothSize.y - km.y)));         // hems
        albedo *= 0.9 + 0.2 * fract(sin(dot(floor(km * 3.0), vec2(4.1, 7.3))) * 91.7);
        // form (the second look): this water's light has no side, and hanging cloth was a flat card. Its folds get a light
        // side and a dark one, as from the lit fronts down the street; it is heavier and darker toward its hem
        albedo *= 1.0 + clamp(dot(N, normalize(vClothT)) * 2.2, -0.45, 0.38);     // each fold: the side that turns one way along the line is lit, the other in shade
        albedo *= 1.0 - 0.3 * smoothstep(0.35, 1.0, vClothUv.y);
        // a sheet was folded in the press: the creases still show, one down its middle and two across
        if (kk < 0.5 && vClothSize.x > 1.2) { float kcr = min(abs(vClothUv.x - 0.5) * vClothSize.x, min(abs(vClothUv.y - 0.34), abs(vClothUv.y - 0.67)) * vClothSize.y); albedo *= 1.0 - 0.14 * (1.0 - smoothstep(0.0, 0.03, kcr)); }
        // wet linen is never smooth: long soft wrinkles run down it from its pegs, finer ones across them (drawn: the mesh is eight by twelve)
        { vec2 kw = km * vec2(5.5, 1.3) + vCloth.x; vec2 kwi = floor(kw), kwf = fract(kw); kwf = kwf * kwf * (3.0 - 2.0 * kwf);
          float kwa = fract(sin(dot(kwi, vec2(127.1, 311.7))) * 43758.5453), kwb = fract(sin(dot(kwi + vec2(1.0, 0.0), vec2(127.1, 311.7))) * 43758.5453), kwc = fract(sin(dot(kwi + vec2(0.0, 1.0), vec2(127.1, 311.7))) * 43758.5453), kwd = fract(sin(dot(kwi + vec2(1.0, 1.0), vec2(127.1, 311.7))) * 43758.5453);
          float kwn = mix(mix(kwa, kwb, kwf.x), mix(kwc, kwd, kwf.x), kwf.y);
          gKsWr = 0.60 + 0.62 * kwn + 0.12 * sin(km.x * 23.0 + kwn * 6.0 + vCloth.x * 3.0); }      // (laid on after the water has repainted the cloth: its values are drawn together before that, and the wrinkles with them)
        // (taken over a fourth time: seen from the boat a piece was still a flat pale card with ruled edges: nothing said it was HUNG.
        // A piece of washing hangs OVER its line: its first quarter or third is double, the under flap's hem showing through as a
        // line across it; it is held by wooden pegs, two to four of them, dark against the cloth; and it lies in long soft
        // billows down its length, a lit flank and a shaded one, broader than its wrinkles. A curtain has none of these.)
        if (vClothSize.x > 0.545) {
          float kfl = (0.2 + 0.16 * fract(vCloth.x * 0.73)) * vClothSize.y;                      // how far down the under flap hangs
          albedo *= mix(1.0, 0.8, 1.0 - smoothstep(kfl - 0.015, kfl + 0.015, km.y));           // two layers: less of the street's light comes through
          albedo *= 1.0 - 0.34 * (1.0 - smoothstep(0.006, 0.03, abs(km.y - kfl)));             // the under flap's hem
          float kpn = max(2.0, floor(vClothSize.x / 0.42 + 0.5)), kpu = abs(fract(vClothUv.x * kpn) - 0.5) * vClothSize.x / kpn;
          float kpeg = (1.0 - smoothstep(0.011, 0.017, kpu)) * (1.0 - smoothstep(0.07, 0.08, km.y));
          albedo = mix(albedo, vec3(0.17, 0.14, 0.13), kpeg);                                   // a peg
        }
        { vec2 kb = vec2(km.x * 2.1 + vCloth.x * 1.7, km.y * 0.55 + vCloth.x * 0.3); vec2 kbi = floor(kb), kbf = fract(kb); kbf = kbf * kbf * (3.0 - 2.0 * kbf);
          float kba = fract(sin(dot(kbi, vec2(41.3, 289.1))) * 43758.5453), kbb = fract(sin(dot(kbi + vec2(1.0, 0.0), vec2(41.3, 289.1))) * 43758.5453), kbc = fract(sin(dot(kbi + vec2(0.0, 1.0), vec2(41.3, 289.1))) * 43758.5453), kbd = fract(sin(dot(kbi + vec2(1.0, 1.0), vec2(41.3, 289.1))) * 43758.5453);
          gKsWr *= 0.70 + 0.62 * mix(mix(kba, kbb, kbf.x), mix(kbc, kbd, kbf.x), kbf.y); }      // the billows
        gKsCloth = albedo;                                                      // (its own paint, before the water repaints it: what the street's light shows through it)
      }`,
    };
    // (taken over) Washing is thin: it lets the street's light THROUGH. A face-up cloth above its street's lamps took none
    // of their light (the area's light gives lamplight to what faces it: right for a roof), and lay there in the water's one
    // teal: a flag. Now what burns under a cloth shows through it, warm, in the cloth's own colour, more where the street is
    // brighter, and the cloth keeps less of the water's hue than a wall does (linen is sea-grey there, not teal). Laid in
    // after the area's light, as its keeper asks. &kscloth=<light through>,<how grey> tries other numbers.
    const cq = (Q.get('kscloth') || '2.4,0.5').split(',').map(Number);
    const THRU = {
      uniforms: { uKsThru: { value: new THREE.Vector2(cq[0], cq[1] ?? 0.5) } }, fragmentPars: 'uniform vec2 uKsThru;',
      albedo: 'if (vWPos.y < 0.0) { float ktl = dot(albedo, vec3(0.3, 0.5, 0.2)); albedo = mix(albedo, ktl * vec3(1.03, 0.97, 1.02), uKsThru.y * smoothstep(0.0, 0.25, -vWPos.y)); } albedo *= gKsWr; gKsCloth *= gKsWr;',
      light: /* glsl */`if (vWPos.y < 0.0) { float kth = min(townLamp(vWPos, -N, gTownL), 0.55);
        // (a curtain hangs out of its own lit window: it took all of that and was a sheet of cream paper. It takes a third.)
        float kthL = smoothstep(0.04, 0.5, kth) * kth * uKsThru.x * mix(1.0, 0.3, step(vClothSize.x, 0.545)) * smoothstep(0.0, 0.25, -vWPos.y);
        // (eased toward a ceiling: beside a lit window a white cloth was a card of cream paper. Taken over again: it is the LIGHT that
        // is eased now, not the lit cloth: easing the product pressed the cloth's own folds and wrinkles flat with it, and a sheet
        // over the lamp row was still a sheet of paper lying on the walk)
        kthL = kthL / (1.0 + kthL / 0.4);
        c += gKsCloth * mix(uTownStreet, uTownJade, clamp(gTown.g * 1.4, 0.0, 1.0)) * kthL; }`,
    };
    const mesh = new THREE.InstancedMesh(geo, kit.gouache({ color: '#ffffff', vertexColors: true, side: THREE.DoubleSide, brush: 0.8, extend: [CLOTH, tone('cloth', 0.2, 0.17, 0.5), light.extendFor(+(Q.get('ksclothlit') || 0.34)), THRU].filter(Boolean) }), n);      // (pale linen takes a third of a lamp's pool: at 0.7 a white cloth beside a lit window was a sheet of cream paper)
    const M = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sc = new THREE.Vector3(), c = new THREE.Color();
    pieces.forEach((pc, i) => {
      M.compose(pc.p, q.setFromEuler(e.set(0, pc.yaw, 0)), sc.set(pc.w, Math.max(0.4, pc.h), 1)); mesh.setMatrixAt(i, M); mesh.setColorAt(i, c.set(pc.color));
      aCloth.set([pc.phase, pc.kind, pc.stiff, pc.second], i * 4);
    });
    geo.setAttribute('aCloth', new THREE.InstancedBufferAttribute(aCloth, 4));
    mesh.frustumCulled = false; mesh.name = 'town-washing'; ctx.add(mesh); ctx.only(mesh, 'direct');
    // the lines themselves: one mesh of thin four-sided rope, sagging under its load
    { const pos = [], idx = [], seg = 12, r = 0.022;
      for (const { at } of ropes) for (let k = 0; k <= seg; k++) {
        const p = at(k / seg), base = pos.length / 3;
        for (const [dy, dz] of [[r, 0], [0, r], [-r, 0], [0, -r]]) pos.push(p.x, p.y + dy, p.z + dz);
        if (k < seg) for (let j = 0; j < 4; j++) { const a = base + j, b = base + (j + 1) % 4; idx.push(a, a + 4, b, b, a + 4, b + 4); }
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
      const rope = new THREE.Mesh(g, light.mat({ color: '#4f4658', lit: 0.6, side: THREE.DoubleSide })); rope.frustumCulled = false; rope.name = 'town-washing-lines'; ctx.add(rope); ctx.only(rope, 'direct'); }
    shared.kitCloth = { mesh, pieces: pieces.map((pc) => ({ x: pc.p.x, y: pc.p.y, z: pc.p.z, w: pc.w, h: pc.h })), sway };
  }

  // ---------------------------------------------------------------------------------------------- weed on the eaves
  // The multitude "weed fringes on eaves": where a gutter has stood full for years, a fringe of weed hangs from it: six
  // tapering ribbons a metre long, streaming a little with the water's own slow swing and rocked by a wake passing over.
  // Forty-eight fringes on the eaves of the houses under and beside the route (never on the roofs awash: those are
  // kit_roofs.js's), and forty-two on the copings awash. Green, not teal: the water gives it its hue.
  if (want('weed')) {
    const rnd = ctx.rng(4949), near = shared.kitHouses || new Set(), spots = [];
    for (const h of town.houses) {
      if (!near.has(h) || h.awash || h.roof === 'mansard' || h.ridge > -0.4 || h.ridge < -9) continue;
      const c = Math.cos(h.yaw), sn = Math.sin(h.yaw), half = h.dep / 2 + 0.35;
      for (let k = 0; k < 2; k++) { if (rnd() > 0.55) continue; const lx = (rnd() - 0.5) * (h.w - 1.8), side = rnd() < 0.5 ? 1 : -1, lz = side * (half + 0.03);
        spots.push({ x: h.x + lx * c + lz * sn, y: h.eaves - 0.1, z: h.z - lx * sn + lz * c, yaw: h.yaw + (side > 0 ? 0 : Math.PI), w: 1.1 + rnd() * 0.9, len: 0.7 + rnd() * 0.8 }); }
    }
    while (spots.length > 48) spots.splice(Math.floor(rnd() * spots.length), 1);
    // and the copings awash are weed-hung (the page's first paragraph): three fringes a run, just under the surface, on either face
    for (const cp of town.copings) {
      const c = Math.cos(cp.yaw), sn = Math.sin(cp.yaw);
      for (let k = 0; k < 3; k++) { const lx = (k - 1 + (rnd() - 0.5) * 0.6) * cp.len * 0.3, side = rnd() < 0.5 ? 1 : -1, lz = side * 0.31;
        spots.push({ x: cp.x + lx * c + lz * sn, y: -0.07 - rnd() * 0.1, z: cp.z - lx * sn + lz * c, yaw: cp.yaw + (side > 0 ? 0 : Math.PI), w: 0.9 + rnd() * 0.8, len: 0.5 + rnd() * 0.6 }); }
    }
    // one fringe: fourteen strands of weed over a metre, no two the same length or width, each five segments, tapering to a
    // point and wandering a little as it hangs; v of its UV = how far down a strand, in metres. (The second look: six broad
    // even ribbons, pale, read as a row of pennants: bunting on the eaves. These are thin, ragged and dark.)
    const pos = [], uv = [], idx = [], colr = [], fr = ctx.rng(909);
    for (let r = 0; r < 14; r++) {
      const x0 = -0.5 + (r + 0.15 + 0.7 * fr()) / 14, wd = 0.028 + 0.05 * fr() * fr(), ln = (r % 5 === 2 ? 0.75 + 0.3 * fr() : 0.22 + 0.5 * fr()), base = pos.length / 3;
      const tone = 0.5 + 0.5 * fr(), bend = (fr() - 0.5) * 0.16, wig = fr() * 6.283, zoff = (fr() - 0.5) * 0.05;
      for (let k = 0; k <= 5; k++) { const t = k / 5, hw = wd * 0.5 * (1 - 0.9 * t * t), xo = bend * t * t + 0.018 * Math.sin(wig + t * 5.0), tn = tone * (0.72 + 0.4 * t);
        pos.push(x0 + xo - hw, -t * ln, zoff + 0.012 * Math.sin(r + k * 1.3), x0 + xo + hw, -t * ln, zoff + 0.012 * Math.sin(r + k * 1.3)); uv.push(0, t * ln, 1, t * ln); colr.push(tn, tn, tn * 0.92, tn, tn, tn * 0.92);
        if (k < 5) { const a = base + k * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); } }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setAttribute('color', new THREE.Float32BufferAttribute(colr, 3)); g.setIndex(idx); g.computeVertexNormals();
    const WEED = {
      uniforms: { uKsWeed: { value: ctx.reducedMotion ? 0.4 : 1.0 } },
      vertexPars: 'attribute float aWeed; uniform float uKsWeed; uniform sampler2D tRipple; uniform vec4 uRippleRect;',
      vertexLocal: /* glsl */`float kwDown = uv.y, kwPh = aWeed; vec3 kwN = vec3(0.0, 0.0, 1.0), kwT = vec3(1.0, 0.0, 0.0);
        #ifdef USE_INSTANCING
          kwN = normalize(mat3(modelMatrix) * instanceMatrix[2].xyz); kwT = normalize(mat3(modelMatrix) * instanceMatrix[0].xyz);
        #endif`,
      vertexWorld: /* glsl */`{ float kt = uTime * 0.7, kf = kwDown * kwDown * uKsWeed;
        vec2 kuv = (wp.xz - uRippleRect.xy) / uRippleRect.zw + 0.5;
        vec4 krp = (kuv.x > 0.0 && kuv.x < 1.0 && kuv.y > 0.0 && kuv.y < 1.0) ? texture2D(tRipple, kuv) : vec4(0.0);
        wp.xyz += kwN * (kf * (0.22 * sin(kt + kwPh + kwDown * 2.4 + position.x * 5.0) + 0.1 * sin(kt * 1.7 + kwPh * 2.0 + position.x * 9.0)) + 0.12 * kwDown)
                + kwT * (kf * 0.1 * sin(kt * 0.8 + kwPh * 1.3 + position.x * 7.0));
        wp.xz += krp.xy * (0.8 * kf * exp(min(wp.y, 0.0) / 5.0)); }`,
    };
    const mesh = new THREE.InstancedMesh(g, kit.gouache({ color: '#44704a', vertexColors: true, side: THREE.DoubleSide, brush: 0.5, extend: [WEED, tone('weed', 0.07, 0.06, 0.4), light.extendFor(0.4)].filter(Boolean) }), spots.length);
    const M = new THREE.Matrix4(), Qn = new THREE.Quaternion(), E = new THREE.Euler(), V = new THREE.Vector3(), S = new THREE.Vector3(), aw = new Float32Array(spots.length);
    spots.forEach((sp, i) => { M.compose(V.set(sp.x, sp.y, sp.z), Qn.setFromEuler(E.set(0, sp.yaw, 0)), S.set(sp.w, sp.len / 0.8, 1)); mesh.setMatrixAt(i, M); aw[i] = rnd() * 40; });
    g.setAttribute('aWeed', new THREE.InstancedBufferAttribute(aw, 1));
    mesh.frustumCulled = false; mesh.name = 'town-weed-fringes'; ctx.add(mesh); ctx.only(mesh, 'direct');
    shared.kitFringe = { mesh, count: spots.length };
  }

  const fract2 = (v) => v - Math.floor(v);
  const frameAt = (s, d) => { const [x, z] = town.xz(s, d), yaw = town.along(s), c = Math.cos(yaw), sn = Math.sin(yaw); return { x, z, yaw, at: (ls, y, ld) => [x + ls * c + ld * sn, y, z - ls * sn + ld * c] }; };
  const calm = ctx.reducedMotion ? 0.4 : 1.0;
  // a small lantern's glass: lit only below the waterline, waking and sleeping with the town
  const lampGlass = (gain) => ({
    uniforms: { uKsLamp2: { value: col('#FFC27A').multiplyScalar(gain) } }, fragmentPars: 'uniform vec3 uKsLamp2;',
    light: /* glsl */`{ float kUnder = 1.0 - smoothstep(-0.012, 0.012, vWPos.y); vec4 kg = townGlow(vWPos.xz); glow += uKsLamp2 * (townWake(townS(kg), vWPos.xz, -1.0, 0.6) * kUnder); }`,
  });

  // ---------------------------------------------------------------------------------------------- the poplar road
  // poplar_tip_1 .. _3 (town_square.py): twelve Lombardy poplars, six a side, each stretched to its own height so that 3 to
  // 6 m of it stand clear of the water; no two turned or leaning alike. Their leaves are the multitude "poplar leaves":
  // sprays of small folded leaves hung on the skins of the tree's masses of foliage, dark above and lilac beneath, which
  // tremble (1.5 Hz, a few degrees, each on its own clock) where they are in air and hang still where they are in water.
  // (Each card is a spray of three leaves, 700 sprays a tree: 25,200 leaves in 8,400 cards.) Trunks, masses and leaves
  // stir together, very slightly: the only things here that say there is air. (Colliders and shared.poplars stay in kit.js.)
  if (want('poplars')) {
    const Pp = plan.poplars, F = plan.floorAt, rnd = ctx.rng(2203), sets = { 1: [], 2: [], 3: [] }, trees = [];
    const sway = { strength: 0.02 * calm, speed: 0.35, from: 0.2, to: 6 };
    for (let i = 0; i < Pp.count; i++) for (const side of [-1, 1]) {
      const s = Pp.s0 + i * Pp.step, d = side * Pp.d, tip = Pp.clear[0] + ((i * 5 + (side > 0 ? 2 : 0)) % 7) * 0.5, floor = Math.min(F(s), -15), [x, z] = town.xz(s, d);
      const H = tip - floor, k = 0.95 + rnd() * 0.35, kind = 1 + (i * 2 + (side > 0 ? 1 : 0)) % 3;
      const place = { position: [x, floor, z], rotation: [(rnd() - 0.5) * 0.05, rnd() * 6.283, (rnd() - 0.5) * 0.05], scale: [k, H / 24, k], tint: ['#ffffff', '#efe6f4', '#f4efe6'][Math.floor(rnd() * 3)] };
      sets[kind].push(place); trees.push({ kind, place });
    }
    // the wood and the masses of foliage it carries (town_square.py: flame-shaped bodies on the leader and on every bough that
    // reaches the top seven metres; dark above, lilac beneath)
    const made = [];
    // (the masses are mottled in the shader: clumps of leaf, darker hollows, at the size of a hand: a model's paint lives on its points)
    const TUFT = {
      fragmentPars: /* glsl */`float kpH(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
        float kpN(vec3 p) { vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
          return mix(mix(mix(kpH(i), kpH(i + vec3(1.0, 0.0, 0.0)), f.x), mix(kpH(i + vec3(0.0, 1.0, 0.0)), kpH(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
                     mix(mix(kpH(i + vec3(0.0, 0.0, 1.0)), kpH(i + vec3(1.0, 0.0, 1.0)), f.x), mix(kpH(i + vec3(0.0, 1.0, 1.0)), kpH(i + vec3(1.0, 1.0, 1.0)), f.x), f.y), f.z); }`,
      albedo: /* glsl */`{ float kleaf = kpN(vWPos * vec3(7.0, 4.0, 7.0)) * 0.6 + kpN(vWPos * vec3(17.0, 9.0, 17.0) + 5.0) * 0.4;
        albedo *= 0.62 + 0.8 * smoothstep(0.3, 0.75, kleaf); }`,
    };
    for (const k of [1, 2, 3]) made.push(await kit.models(`models/town/poplar_tip_${k}.glb`, sets[k], { brush: 0.8, sway, extend: [TUFT, light.extendFor(0.5)] }));
    // (the mirror has them only while the boat is within 90 m of the poplar road: from the street their image was 20,000 triangles a frame for nothing)
    { const pm = Pp.s0 + (Pp.count - 1) * Pp.step / 2; for (const mesh of bakeInstanced(ctx, made, { name: 'town-poplars' })) near.near(mesh, pm, 90, (on) => mesh.layers.set(on ? 0 : 1)); }
    // the leaves (remade in the second look: 8,400 cards of three hand-sized kites round faceted lumps read as confetti on
    // stalagmites). Now SPRAYS: each card is a twig a good half metre long with eleven poplar leaves on their long stalks, its
    // picture drawn here by rule (never a photograph or a generated image): a deltoid blade drawn to a point, a midrib, a
    // stalk. The sprays stand on anchors the model publishes (poplar_leaves.json: 1,500 a tree, out beyond the masses'
    // skins, carried here by each tree's own place, turn and stretch), twig upward and outward as a Lombardy poplar grows,
    // so that the tree's OUTLINE is leaf and the masses are only the dark of its heart. Each spray shivers on its twig
    // (1.5 Hz, a few degrees, on its own clock) and each leaf turns on its stalk, now its dark face, now its paler
    // underside; under the lake they hang still. Far off a spray fills in to a soft dab, so the tips stay dark flames.
    const anchors = await fetch('assets/models/town/poplar_leaves.json').then((r) => (r.ok ? r.json() : null)).catch(() => null);
    if (!anchors) console.error('INVALID_MODEL assets/models/town/poplar_leaves.json is missing: run source-art/models/town/town_square.py');
    const per = kit.count(+(Q.get('ksleaves') || 1400)), leaves = [];
    const TM = new THREE.Matrix4(), TQ = new THREE.Quaternion(), TE = new THREE.Euler(), TP = new THREE.Vector3(), TS = new THREE.Vector3(), NM = new THREE.Matrix3(), a3 = new THREE.Vector3(), n3 = new THREE.Vector3();
    for (const t of trees) {
      const list = anchors ? anchors.anchors[`poplar_tip_${t.kind}`] : [], pl = t.place;
      TM.compose(TP.fromArray(pl.position), TQ.setFromEuler(TE.set(pl.rotation[0], pl.rotation[1], pl.rotation[2], 'YXZ')), TS.fromArray(pl.scale)); NM.getNormalMatrix(TM);
      for (let n = 0; n < Math.min(per, list.length); n++) {
        const q = list[n]; a3.set(q[0], q[1], q[2]).applyMatrix4(TM); n3.set(q[3], q[4], q[5]).applyMatrix3(NM).normalize();
        leaves.push(a3.x, a3.y, a3.z, n3.x, n3.y, n3.z, rnd(), rnd());
      }
    }
    // the card's picture. R: the leaf's own tone (its midrib a little darker), G: 1 on a blade, 0 on wood, B: which leaf it is
    // (each has its own clock), A: cover. Every texel outside a shape carries the nearest shape's paint, so that the smaller
    // copies of the picture do not darken at the edges.
    const CW = 288, CH = 384;      // (taken over a fourth time: half as fine again, for the eye that comes within arm's length: the hull can touch these trees)
    const leafCard = () => {
      const data = new Uint8Array(CW * CH * 4), lr = ctx.rng(4711), asp = CW / CH, shapes = [];
      const twig = (t) => [0.045 * Math.sin(t * 2.6 + 0.4) - 0.02, 0.015 + 0.9 * t];      // (x, y) in units of the card's height; x from its middle
      for (let i = 0; i < 11; i++) {
        const t = 0.08 + 0.9 * i / 10, [tx, ty] = twig(t), side = i % 2 ? 1 : -1, last = i === 10;
        const stalk = last ? 0.015 : 0.05 + 0.045 * lr(), ang = last ? (lr() - 0.5) * 0.4 : side * (0.7 + 0.5 * lr());
        const bx = tx + Math.sin(ang) * stalk, by = ty + Math.cos(ang) * stalk;
        const la = ang + (last ? 0 : side * (0.15 + 0.55 * lr())), L = (0.15 + 0.05 * lr()) * (1 - 0.22 * t), Wd = L * (0.72 + 0.12 * lr());
        shapes.push({ tx, ty, bx, by, dx: Math.sin(la), dy: Math.cos(la), L, Wd, tone: 0.5 + 0.5 * lr(), id: (i + 0.5) / 11 });
      }
      const seg = (px, py, ax, ay, bx, by) => { const vx = bx - ax, vy = by - ay, t = Math.max(0, Math.min(1, ((px - ax) * vx + (py - ay) * vy) / (vx * vx + vy * vy || 1))); return [Math.hypot(px - ax - vx * t, py - ay - vy * t), t]; };
      for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) {
        const px = ((x + 0.5) / CW - 0.5) * asp, py = (y + 0.5) / CH;
        let best = 1e9, r = 0.5, g = 0, b = 0;
        // the twig, tapering
        for (let k = 0; k < 8; k++) { const [ax, ay] = twig(k / 8), [bx, by] = twig((k + 1) / 8), [d, t] = seg(px, py, ax, ay, bx, by), dd = d - 0.011 * (1 - 0.75 * (k + t) / 8) - 0.002; if (dd < best) { best = dd; r = 0.5; g = 0; b = 0; } }
        for (const s of shapes) {
          const [ds] = seg(px, py, s.tx, s.ty, s.bx, s.by), d0 = ds - 0.0045;                 // its stalk
          if (d0 < best) { best = d0; r = 0.55; g = 0; b = s.id; }
          const qx = px - s.bx, qy = py - s.by, v = (qx * s.dx + qy * s.dy) / s.L, u = (qx * s.dy - qy * s.dx) / s.Wd;
          const vv = Math.max(0, Math.min(1, v)), f = vv < 0.26 ? Math.sqrt(vv / 0.26) : Math.pow(1 - (vv - 0.26) / 0.74, 1.15);      // (a black poplar's leaf: nearly as broad as it is long, widest a quarter of the way up, drawn out to a point)
          const d1 = Math.max((Math.abs(u) - f * 0.5) * s.Wd, (v - 1) * s.L, -v * s.L);          // the blade: broad at the stalk, drawn to a point
          // (a leaf is folded a little along its midrib: one half takes the light, the other is a step darker; its veins leave the
          // midrib at half a right angle, six a side; its margin is a shade darker, which parts it from the leaf behind. At arm's
          // length the leaves were flat shapes of one mauve)
          if (d1 < best) { best = d1; const hu = u / Math.max(f * 0.5, 1e-3);
            let vein = 1; for (let k = 0; k < 6; k++) vein = Math.min(vein, Math.abs((vv - (0.1 + 0.135 * k)) - Math.abs(hu) * 0.2));
            const edge = Math.min(1, Math.max(0, -d1 / 0.008));
            r = s.tone * (Math.abs(u) < 0.045 ? 0.62 : vein < 0.011 && Math.abs(hu) < 0.9 ? 0.8 : 1.0) * (hu > 0 ? 1.0 : 0.8) * (0.8 + 0.2 * edge) * (0.86 + 0.2 * vv); g = 1; b = s.id; }
        }
        const o = (y * CW + x) * 4, aa = 0.6 / CH;
        data[o] = Math.round(255 * Math.min(1, r)); data[o + 1] = Math.round(255 * g); data[o + 2] = Math.round(255 * b);
        data[o + 3] = Math.round(255 * Math.max(0, Math.min(1, 0.5 - best / (2 * aa))));
      }
      const tex = new THREE.DataTexture(data, CW, CH, THREE.RGBAFormat); tex.generateMipmaps = true; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.magFilter = THREE.LinearFilter;
      tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping; tex.anisotropy = 4; tex.needsUpdate = true;
      return tex;
    };
    const lg = new THREE.PlaneGeometry(1, 1); lg.translate(0, 0.5, 0);                // a card standing on its twig's foot
    const LEAF = {
      uniforms: { tKsLeaf: { value: leafCard() }, uKsLeafA: { value: col(Q.get('ksleafa') ? '#' + Q.get('ksleafa') : '#1e1c36') }, uKsLeafB: { value: col(Q.get('ksleafb') ? '#' + Q.get('ksleafb') : '#544d82') }, uKsWood: { value: col('#3a3048') },
        uKsLeafT: { value: new THREE.Vector2(0.12 * calm, calm) } },
      vertexPars: 'attribute vec2 aLeaf; uniform vec2 uKsLeafT; varying vec2 vKsLeaf;',
      vertexLocal: /* glsl */`vKsLeaf = aLeaf;
        #ifdef USE_INSTANCING
        { float ky = (modelMatrix * instanceMatrix[3]).y;
          float kth = uKsLeafT.x * step(0.05, ky) * sin(uTime * 9.42 + aLeaf.x * 6.283) * (0.55 + 0.45 * sin(uTime * 0.83 + aLeaf.y * 11.0));
          float kc = cos(kth), ks = sin(kth);
          transformed.xz = vec2(kc * transformed.x - ks * transformed.z, ks * transformed.x + kc * transformed.z);
          objectNormal.xz = vec2(kc * objectNormal.x - ks * objectNormal.z, ks * objectNormal.x + kc * objectNormal.z); }
        #endif`,
      fragmentPars: 'uniform sampler2D tKsLeaf; uniform vec3 uKsLeafA, uKsLeafB, uKsWood; uniform vec2 uKsLeafT; varying vec2 vKsLeaf;',
      albedo: /* glsl */`{
        float kd = length(vWPos - uCameraPos);
        vec4 kt = texture2D(tKsLeaf, vUv0, -0.6);
        vec2 ke = (vUv0 - vec2(0.5, 0.52)) * vec2(2.15, 2.0); float kblob = 1.0 - smoothstep(0.55, 1.0, dot(ke, ke));
        alpha = mix(kt.a, max(kt.a, kblob), smoothstep(14.0, 38.0, kd));              // far off: a dab of leaf
        float kph = kt.b * 23.0 + vKsLeaf.x * 6.283, kair = step(0.02, vWPos.y) * uKsLeafT.y;
        float kturn = smoothstep(0.15, 0.85, 0.5 + 0.5 * sin(uTime * (3.2 + 3.4 * fract(kph * 0.37)) * kair + kph * 5.0) * (0.35 + 0.65 * fract(kph * 1.7)));
        vec3 kleaf = mix(uKsLeafA, uKsLeafB, kturn * (gl_FrontFacing ? 0.5 : 1.0));
        albedo *= mix(uKsWood, kleaf, mix(kt.g, 1.0, smoothstep(14.0, 38.0, kd))) * kt.r * (0.78 + 0.44 * fract(vKsLeaf.y * 7.3));
      }`,
    };
    const n = leaves.length / 8, lm = new THREE.InstancedMesh(lg, kit.gouache({ color: '#ffffff', side: THREE.DoubleSide, cutout: true, brush: 0.3, sway, extend: [LEAF, light.extendFor(0.6)] }), Math.max(1, n));
    const M = new THREE.Matrix4(), S = new THREE.Vector3(), aLeaf = new Float32Array(Math.max(1, n) * 2), ax = new THREE.Vector3(), ay = new THREE.Vector3(), az = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), P3 = new THREE.Vector3(), QT = new THREE.Quaternion();
    // (weight: the sprays are laid in a shuffled order, so that any first part of them is every tree thinned evenly; far from the
    // poplar road, where a spray is a dab a few pixels across, only that part is drawn: see the update below)
    const order = Array.from({ length: n }, (_, i) => i); { const sr = ctx.rng(8642); for (let i = n - 1; i > 0; i--) { const j = Math.floor(sr() * (i + 1)), t = order[i]; order[i] = order[j]; order[j] = t; } }
    for (let k = 0; k < n; k++) {
      const o = order[k] * 8, r1 = leaves[o + 6], r2 = leaves[o + 7], h = 0.5 + 0.42 * r2 * r2 + 0.1 * r1;
      // the twig goes up and a little out from the skin (a poplar's wood all ascends); the card's face looks out, turned its own way about the twig
      n3.set(leaves[o + 3], leaves[o + 4], leaves[o + 5]);
      ay.copy(up).multiplyScalar(0.8 + 0.5 * r1).addScaledVector(n3, 0.25 + 0.5 * r2).add(a3.set(Math.sin(r1 * 40) * 0.3, 0, Math.cos(r2 * 40) * 0.3)).normalize();
      az.copy(n3).addScaledVector(ay, -n3.dot(ay)); if (az.lengthSq() < 1e-4) az.set(1, 0, 0); az.normalize();
      az.applyQuaternion(QT.setFromAxisAngle(ay, (fract2(r1 * 13.7 + r2 * 5.1) - 0.5) * 2.4));
      ax.crossVectors(ay, az).normalize();
      P3.set(leaves[o], leaves[o + 1], leaves[o + 2]).addScaledVector(ay, -0.22 * h);
      M.makeBasis(ax, ay, az).scale(S.set(h * CW / CH, h, 1)).setPosition(P3); lm.setMatrixAt(k, M);
      aLeaf.set([r1, r2], k * 2);
    }
    lg.setAttribute('aLeaf', new THREE.InstancedBufferAttribute(aLeaf, 2));
    lm.name = 'town-poplar-leaves'; lm.computeBoundingSphere(); if (lm.boundingSphere) lm.boundingSphere.radius += 1.5; ctx.add(lm);      // (left to the frustum: the poplar road is out of sight for most of the ride)
    shared.kitPoplars = { leaves: lm, sprays: n };
    // all of them within 34 m of the middle of the poplar road, fewer with distance, three in ten from 113 m (the square's
    // near end and everything before it): 16,800 cards in three passes were a hundred thousand triangles a frame for a
    // far row of dark flames. &ksleaflod=0 draws them all everywhere
    if (Q.get('ksleaflod') !== '0' && n > 1) { const [px, pz] = town.xz(Pp.s0 + (Pp.count - 1) * Pp.step / 2, 0);
      updates.push(() => { const bt = ctx.boat; if (!bt) return; lm.count = Math.max(1, Math.round(n * Math.min(1, Math.max(0.3, 34 / Math.max(1, Math.hypot(bt.x - px, bt.z - pz)))))); }); }
  }

  // ---------------------------------------------------------------------------------------------- the square
  // lime_tree: the pollarded lime at s 198, d -6, on the square's floor (the fry hang in its crown: shared.kitLime says where)
  if (want('lime')) {
    const li = plan.square.lime, f = frameAt(li.s, li.d), fl = plan.square.floor;
    const m = await kit.model('models/town/lime_tree.glb', { position: [f.x, fl, f.z], rotation: [0, 1.1, 0], brush: 0.7, extend: [light.extendFor(0.5)] });
    ctx.only(m.group, 'direct'); near.near(m.group, li.s, REACH + 10);
    shared.kitLime = { x: f.x, z: f.z, foot: fl, crown: [fl + 4.6, fl + 7.4], radius: 2.3 };
  }
  // stall_1 .. _3: twelve market stalls in two rows between the fountain and the tower, each turned a little its own way.
  // Their awnings are cloth (slot `cloth`: u of its UV says how freely a point moves) and breathe with one slow wave;
  // each has a hanging lamp that burns and sleeps with the square.
  if (want('stalls')) {
    const st = plan.square.stalls, fl = plan.square.floor, rnd = ctx.rng(1212), sets = { 1: [], 2: [], 3: [] }, halo = [];
    for (let r = 0; r < st.rows; r++) for (let i = 0; i < st.perRow; i++) {
      // (stage 1's rows ran on into the hour ring and the tower's own shaft: each row is drawn back toward the fountain so that its
      // last stall stands 10 m from the tower's middle, clear of the turning ring)
      const t = (r ? -0.4 : -0.05) + (r ? 0.84 : 0.85) * i / (st.perRow - 1), s = st.from[0] + (st.to[0] - st.from[0]) * t + r * 1.6, d = st.from[1] + (st.to[1] - st.from[1]) * t + (r ? 5.2 : 0), f = frameAt(s, d);
      const kind = (i + r) % 3 === 0 ? 2 : (i + r) % 2 ? 1 : 3, yaw = f.yaw + 0.5 + (rnd() - 0.5) * 0.35 + (r ? Math.PI : 0);
      sets[kind].push({ position: [f.x, fl + 0.02, f.z], rotation: [0, yaw, 0], scale: [0.96 + rnd() * 0.1, 0.96 + rnd() * 0.08, 0.96 + rnd() * 0.1], tint: ['#ffffff', '#f2e8ee', '#ece8f4', '#f6efe4'][Math.floor(rnd() * 4)] });
      halo.push({ x: f.x, y: fl + 2.05, z: f.z, size: 2.2, color: '#FFB86A', s: 176, rnd: -1, stay: 0.6 });
    }
    // and the market hall's own: twenty-four stalls in three rows on its floor, under the glass (seen from alongside the glass
    // ridge, straight down through the panes: the page's postcard 11). The outer rows face the middle aisle; no two turned alike.
    { const Hl = plan.hall, len = Hl.s1 - Hl.s0, hf = frameAt((Hl.s0 + Hl.s1) / 2, Hl.d), tints = ['#ffffff', '#f2e8ee', '#ece8f4', '#f6efe4', '#e8f0ea'];
      for (let r = -1; r <= 1; r++) for (let i = 0; i < 8; i++) {
        const p = hf.at(-len / 2 + 4 + i * 5.1 + (rnd() - 0.5) * 0.5, Hl.floor + 0.02, r * 6.2 + (rnd() - 0.5) * 0.4);
        const kind = 1 + ((i * 2 + r + 4) % 3), yaw = hf.yaw + (r > 0 ? Math.PI : r < 0 ? 0 : (i % 2 ? Math.PI : 0)) + (rnd() - 0.5) * 0.22;
        sets[kind].push({ position: p, rotation: [0, yaw, 0], scale: [0.96 + rnd() * 0.1, 0.96 + rnd() * 0.08, 0.96 + rnd() * 0.1], tint: tints[Math.floor(rnd() * tints.length)] });
        halo.push({ x: p[0], y: Hl.floor + 2.05, z: p[2], size: 2.0, color: '#FFB86A', s: 176, rnd: -1, stay: 0.6 });
      }
      // stage 1's stand-ins for them (plain boxes, roofs and lamp balls in heroes.js's batches, which have no names): taken out by where they stand
      const Mz = new THREE.Matrix4(), ZERO = new THREE.Matrix4().makeScale(0, 0, 0), c = Math.cos(hf.yaw), sn = Math.sin(hf.yaw);
      ctx.group.traverse((o) => {
        if (!o.isInstancedMesh || !o.name || !o.name.startsWith('standins:')) return;
        let hit = false;
        for (let i = 0; i < o.count; i++) {
          o.getMatrixAt(i, Mz); const e = Mz.elements;
          if (e[0] === 0 && e[5] === 0 && e[10] === 0) continue;
          const dx = e[12] - hf.x, dz = e[14] - hf.z, ls = dx * c - dz * sn, ld = dx * sn + dz * c;
          if (Math.abs(ls) < 22.7 && Math.abs(ld) < 11.7 && e[13] < -18 && Math.hypot(e[4], e[5], e[6]) < 2) { o.setMatrixAt(i, ZERO); hit = true; }
        }
        if (hit) o.instanceMatrix.needsUpdate = true;
      });
    }
    const AWN = { uniforms: { uKsAwn: { value: calm } }, vertexPars: 'uniform float uKsAwn;',
      vertexWorld: /* glsl */`{ float kf = uv.x * uKsAwn, kt = uTime * 0.85;
        wp.y += kf * 0.07 * sin(kt + wp.x * 1.3 + wp.z * 1.1); wp.xz += kf * 0.04 * vec2(sin(kt * 0.7 + wp.z * 0.9), cos(kt * 0.6 + wp.x * 0.8)); }`,
      fragmentPars: 'vec3 gKsAwn;', albedo: 'gKsAwn = albedo;' };      // (its own paint, kept before the water repaints it: what its lamp shows through it)
    // (taken over again: from the boat a stall is seen from above, 22 m down: the TOP of its awning, which its own lamp, hanging
    // under it, never lit: thirty-six blue slabs. Awning cloth is thin: the lamp under it shows THROUGH it, in the cloth's own
    // stripes, rose and pale, jade and pale: each stall a small lit tent on the dark square, asleep and awake with it.
    // Well under a window's light. &ksawn=<strength>)
    const AWNGLOW = { uniforms: { uKsAwnLamp: { value: col('#FFAE6E').multiplyScalar(+(Q.get('ksawn') || 0.5)) } }, fragmentPars: 'uniform vec3 uKsAwnLamp;',
      light: /* glsl */`{ float kUnder = 1.0 - smoothstep(-0.012, 0.012, vWPos.y); vec4 kg = townGlow(vWPos.xz);
        glow += gKsAwn * uKsAwnLamp * (townWake(townS(kg), vWPos.xz, -1.0, 0.6) * kUnder * (0.5 + 0.5 * clamp(N.y, 0.0, 1.0))); }` };
    const made = [];
    for (const k of [1, 2, 3]) {
      if (!sets[k].length) continue;
      made.push(await kit.models(`models/town/stall_${k}.glb`, sets[k], { materials: {
        paint: { brush: 0.7, extend: [light.extendFor(0.6)] },
        cloth: { brush: 0.8, side: THREE.DoubleSide, extend: [AWN, light.extendFor(0.7), AWNGLOW] },
        glass: { color: '#2a2034', brush: 0, shade: 0, extend: [light.extendFor(0), lampGlass(3)] },
      } }));
    }
    // (timber and lamp glass poured into one mesh, as the street lamps are; the awnings' cloth is its own: it is two-sided and it moves)
    const G3 = lampGlass(3), STALL1 = { uniforms: G3.uniforms, fragmentPars: G3.fragmentPars,
      light: /* glsl */`if (vUv0.x > 0.5) { float kUnder = 1.0 - smoothstep(-0.012, 0.012, vWPos.y); vec4 kg = townGlow(vWPos.xz); glow += uKsLamp2 * (townWake(townS(kg), vWPos.xz, -1.0, 0.6) * kUnder); }` };
    const stallMat = kit.gouache({ color: '#ffffff', vertexColors: true, brush: 0.7, extend: [light.extendFor(0.6), STALL1] });
    for (const mesh of bakeInstanced(ctx, made, { name: 'town-stalls', merge: { slots: ['paint', 'glass'], flag: { glass: 1 }, tint: { glass: '#2a2034' }, material: stallMat } })) { ctx.only(mesh, 'direct'); if (!mesh.name.endsWith(':cloth')) near.sorted(mesh, key); }      // (the awnings' cloth is left whole and as it was poured: the cast reads it)
    if (light.halos) ctx.add(light.halos(halo, { gain: 0.5 }));
    shared.kitStalls = true;
  }

  // ---------------------------------------------------------------------------------------------- the skiffs
  // skiff_1, skiff_2: seven skiffs hanging over the boat basin where stage 1 hung them (the same places: kit.js still leaves
  // them in shared.skiffs), bows up-current and a little raised, each on a taut painter made fast to a mooring stone on the
  // basin's floor. They are instanced: shared.kitSkiffs[i] = { api, index, at, ring, place(position, rotation) } moves one
  // (the cast sways them and re-fits their painters; shared.kitSkiffPainters is the still line to hide when it does).
  if (want('skiffs')) {
    const B = plan.street.basin, mid = frameAt((B.s0 + B.s1) / 2, (B.d0 + B.d1) / 2), fl = plan.floorAt(138), r4 = ctx.rng(4242), rnd = ctx.rng(77);
    const sets = { 1: [], 2: [] }, list = [], pos = [], idx = [], M = new THREE.Matrix4(), Qn = new THREE.Quaternion(), E = new THREE.Euler(), V = new THREE.Vector3();
    const tube = (a, b, r) => { const base = pos.length / 3; for (const p of [a, b]) for (const [dx, dz] of [[r, 0], [0, r], [-r, 0], [0, -r]]) pos.push(p[0] + dx, p[1], p[2] + dz);
      for (let j = 0; j < 4; j++) { const q = base + j, w = base + (j + 1) % 4; idx.push(q, q + 4, w, w, q + 4, w + 4); } };
    const blockAt = (p, w, h) => { const base = pos.length / 3; for (const y of [p[1] - h, p[1]]) for (const [dx, dz] of [[-w, -w], [w, -w], [w, w], [-w, w]]) pos.push(p[0] + dx, y, p[2] + dz);
      for (let j = 0; j < 4; j++) { const q = base + j, w2 = base + (j + 1) % 4; idx.push(q, w2, q + 4, w2, w2 + 4, q + 4); } idx.push(base + 4, base + 5, base + 6, base + 4, base + 6, base + 7); };
    for (let i = 0; i < plan.street.skiffs; i++) {
      const ls = -6.5 + i * 2.1 + (r4() - 0.5), ld = -4.5 + ((i * 5) % 7) * 1.5, y = -3 - (i % 4) * 0.95, at = mid.at(ls, y, ld), ring = mid.at(ls + 3 + r4() * 2, fl + 1.0, ld + (r4() - 0.5) * 2);
      const kind = i % 3 === 1 ? 2 : 1, rot = [-0.1 - rnd() * 0.12, mid.yaw - Math.PI / 2 + (rnd() - 0.5) * 0.5, -0.2 + (rnd() - 0.5) * 0.3];
      sets[kind].push({ position: at, rotation: rot, tint: ['#ffffff', '#ece4ee', '#e6ecf0'][i % 3] });
      list.push({ kind, index: sets[kind].length - 1, at, ring, rot });
      // the painter: from the ring bolt in the stem to the mooring stone
      V.set(0, 0.62, 1.87).applyMatrix4(M.compose(new THREE.Vector3(...at), Qn.setFromEuler(E.set(rot[0], rot[1], rot[2], 'YXZ')), new THREE.Vector3(1, 1, 1)));
      tube([V.x, V.y, V.z], ring, 0.02); blockAt(ring, 0.17, 1.05);
    }
    const apis = {};
    for (const k of [1, 2]) { apis[k] = await kit.models(`models/town/skiff_${k}.glb`, sets[k], { brush: 0.7, extend: [tone('skiff', 0.07, 0.04, 0.3, 0.6), light.extendFor(0.6)].filter(Boolean) }); for (const mesh of apis[k].meshes) mesh.frustumCulled = false; ctx.only(apis[k].group, 'direct'); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    const lines = new THREE.Mesh(g, light.mat({ color: '#4f4658', lit: 0.6, side: THREE.DoubleSide })); lines.frustumCulled = false; lines.name = 'town-skiff-painters'; ctx.add(lines); ctx.only(lines, 'direct');
    shared.kitSkiffs = list.map((o) => ({ ...o, api: apis[o.kind], place: (position, rotation) => apis[o.kind].place(o.index, { position, rotation }) }));
    shared.kitSkiffPainters = lines;
  }

  // ---------------------------------------------------------------------------------------------- the vista
  // viaduct_arch: eleven bays striding across the lake into mist, five more carrying its near end away, one to close its
  // last pier; theatre_bulk: the body of the theatre behind its portico, one near-black silhouette (in the realm's own place).
  if (want('vista')) {
    const Vd = plan.vista.viaduct, a = town.xz(Vd.from[0], Vd.from[1]), c = town.xz(Vd.to[0], Vd.to[1]), len = Math.hypot(c[0] - a[0], c[1] - a[1]), ux = (c[0] - a[0]) / len, uz = (c[1] - a[1]) / len;
    const bay = Vd.span + Vd.pier, total = Vd.arches * bay, start = (len - total) / 2, yaw = Math.atan2(-uz, ux), places = [];
    for (let i = 0; i <= Vd.arches; i++) { const t = start + (i + 0.5) * bay; places.push({ position: [a[0] + ux * t, 0, a[1] + uz * t], rotation: [0, yaw, 0], tint: ['#ffffff', '#f0eaf6', '#f6f0ea'][i % 3] }); }
    // (taken over a fourth time) BOTH ENDS RUN ON UNTIL THE AIR HAS THEM. The near end turned TOWARD the route (five bays at 0.19:
    // its last pier 95 m from the street's left bank, where the page has the viaduct never nearer than 165 m) and stopped there
    // in mid-air: a stub of deck and half an arch against the lit low sky, in every picture that looks left from the street
    // or the church passage. It curves AWAY now, up the valley (a tenth of a radian a bay for twelve bays, then straight),
    // and the far end runs straight on: both until they have passed the ring of the near hills (set.js: 420 m from the
    // middle of the route), where the air has long since had them. Each end is closed by a pier (a bay turned about, lying
    // on the last one: its pier stands where the next bay's would).
    const vt = ['#ffffff', '#f0eaf6', '#f6f0ea'], vc = town.xz(130, 0), gone = (x, z) => Math.hypot(x - vc[0], z - vc[1]) > plan.vista.backdrops.hillsNear + 20;
    { let px = a[0] + ux * start, pz = a[1] + uz * start, ang = yaw + Math.PI;
      for (let i = 0; i < 40; i++) { if (i < 12) ang -= 0.1; const dx = Math.cos(ang), dz = -Math.sin(ang), cx = px + dx * bay / 2, cz = pz + dz * bay / 2;
        places.push({ position: [cx, 0, cz], rotation: [0, ang, 0], tint: vt[(i + 1) % 3] }); px += dx * bay; pz += dz * bay;
        if (gone(cx, cz) || i === 39) { places.push({ position: [cx, 0, cz], rotation: [0, ang + Math.PI, 0] }); break; } } }
    { let px = a[0] + ux * (start + (Vd.arches + 1) * bay), pz = a[1] + uz * (start + (Vd.arches + 1) * bay);
      for (let i = 0; i < 40; i++) { const cx = px + ux * bay / 2, cz = pz + uz * bay / 2;
        places.push({ position: [cx, 0, cz], rotation: [0, yaw, 0], tint: vt[i % 3] }); px += ux * bay; pz += uz * bay;
        if (gone(cx, cz) || i === 39) { places.push({ position: [cx, 0, cz], rotation: [0, yaw + Math.PI, 0] }); break; } } }
    // (the second look, for the draw calls: the viaduct, the theatre's bulk and the upper town's houses are three still, unlit
    // things of one stone in one light, all above the water and so drawn in all three passes: they are poured into ONE
    // mesh, three draw calls a frame where there were nine)
    const far = { map: tPlaster, triplanar: 4.2, brush: 0.9, extend: [light.extendFor(0.4)] };
    const via = await kit.models('models/town/viaduct_arch.glb', places, far);
    const bulk = await kit.models('models/town/theatre_bulk.glb', [{ position: [0, 0, 0] }], far);
    const vista = bakeInstanced(ctx, [via, bulk], { name: 'town-vista' })[0];
    const upper = ctx.group.getObjectByName('town-upper:paint');
    if (vista && upper && upper.isMesh && upper.geometry.index && vista.geometry.index && Q.get('ksjoin') !== '0') {
      const parts = [upper, vista], G = new THREE.BufferGeometry(); let nv = 0, ni = 0;
      for (const m of parts) { nv += m.geometry.attributes.position.count; ni += m.geometry.index.count; }
      const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), colr = new Float32Array(nv * 3), uvs = new Float32Array(nv * 2), idx = new Uint32Array(ni); let vo = 0, io = 0;
      for (const m of parts) { const g = m.geometry, n = g.attributes.position.count, I = g.index.array;
        pos.set(g.attributes.position.array, vo * 3); nor.set(g.attributes.normal.array, vo * 3); colr.set(g.attributes.color.array, vo * 3); if (g.attributes.uv) uvs.set(g.attributes.uv.array, vo * 2);
        for (let i = 0; i < I.length; i++) idx[io + i] = I[i] + vo;
        vo += n; io += I.length; }
      G.setAttribute('position', new THREE.BufferAttribute(pos, 3)); G.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); G.setAttribute('color', new THREE.BufferAttribute(colr, 3));
      G.setAttribute('uv', new THREE.BufferAttribute(uvs, 2)); G.setIndex(new THREE.BufferAttribute(idx, 1)); G.computeBoundingSphere();
      const one = new THREE.Mesh(G, upper.material); one.name = 'town-far-town'; one.frustumCulled = false; one.matrixAutoUpdate = false; ctx.add(one);
      for (const m of parts) { if (m.parent) m.parent.remove(m); m.geometry.dispose(); }
      if (vista.material !== upper.material) vista.material.dispose();
    }
    shared.kitViaduct = true;
    shared.kitBulk = true;
  }

  // ---------------------------------------------------------------------------------------------- things left on the raised walk
  // The close band's small things (town_props.py): what a rider who stops over the street's left side and looks down finds
  // on the raised walk, four to eight metres under the keel, each left where it was last used: a handcart by the first lamp,
  // crates against the area rail, a ladder up to a first-floor window, benches with their backs to the houses, barrels, the
  // street pump and its trough. Fourteen things of six kinds, no two turned alike, poured into one still mesh.
  if (want('props')) {
    const rnd = ctx.rng(3131), A = town.arcade, deck = (s) => A.reduce((a, b) => (Math.abs(b.s - s) < Math.abs(a.s - s) ? b : a)).top;
    // [model, s, d, turn from the route]: a thing's front (+Z) looks at the street when its turn is 0
    const list = [['prop_handcart', 40.4, -5.75, Math.PI / 2 + 0.22], ['prop_crates', 45.0, -6.95, 0.3], ['prop_ladder', 46.9, -6.36, 0.0], ['prop_bench', 51.1, -6.98, 0.0],
      ['prop_barrels', 56.4, -6.9, 1.2], ['prop_pump', 62.0, -6.75, 0.0], ['prop_bench', 67.1, -6.98, 0.04], ['prop_crates', 72.9, -5.25, 2.0], ['prop_handcart', 77.8, -6.1, -0.5],
      ['prop_barrels', 83.4, -6.95, -0.7], ['prop_bench', 88.5, -6.98, -0.05], ['prop_ladder', 93.9, -6.38, 0.05], ['prop_crates', 99.2, -6.9, 0.9], ['prop_pump', 104.6, -6.75, 0.0]];
    const sets = {}, tints = ['#ffffff', '#efe6ee', '#e8eef0', '#f4ece2'];
    for (const [name, s, d, turn] of list) {
      const [x, z] = town.xz(s, d), k = 0.96 + rnd() * 0.08;
      (sets[name] || (sets[name] = [])).push({ position: [x, deck(s) + 0.004, z], rotation: [0, town.along(s) + turn, 0], scale: [k, k, k], tint: tints[Math.floor(rnd() * tints.length)] });
    }
    // (taken over a fourth time) THE RIGHT OF THE STREET: the kerb, the leat and the quay beyond it. Over the right side the rider
    // looks down past the street lamps (d 4.6) into the leat and at the houses that rise from it: nine to fifteen metres of water,
    // and nothing lay there. What is found now, each thing in a lamp's pool or under lit windows so that it can be seen: milk
    // churns and a pail at the kerb by the first lamp, one churn on its side; crates off a cart; the cart itself, down on its
    // shafts, and a wheel off another lying by it; barrels; a skiff sunk in the leat under the houses' windows, heeled against
    // the wall, and a second lower down; mooring posts along the leat's coping, each with its ring to the water; a bench and
    // barrels on the quay by the footbridge. [model, s, d, turn from the route, where it stands, pitch, roll]
    const F = plan.floorAt, cope = (sv) => F(sv) + 0.9, road = (sv) => F(sv) + 0.06, bed = (sv) => F(sv) + 0.04;
    const lodged = [['prop_churns', 41.7, 3.75, -0.5, road], ['prop_crates', 55.5, 3.9, 2.3, road], ['prop_handcart', 69.4, 3.5, Math.PI / 2 - 0.35, road, 0, 0], ['prop_wheel', 71.6, 4.7, 0.8, road],
      ['prop_barrels', 83.6, 3.9, 2.6, road], ['prop_wheel', 85.9, 8.9, 2.1, bed, 0.05, 0.0], ['prop_crates', 97.4, 4.0, 0.4, road], ['prop_handcart', 102.3, 4.9, Math.PI + 0.5, road],
      ['skiff_2', 57.4, 9.6, Math.PI / 2 + 0.12, bed, 0.05, -0.34], ['skiff_1', 79.2, 7.5, -Math.PI / 2 + 0.2, bed, -0.04, -0.5], ['prop_churns', 66.3, 8.3, 1.9, bed],
      ['prop_bench', 95.6, 15.2, Math.PI, (sv) => town.ground(sv, 15.2) + 0.02], ['prop_barrels', 108.2, 16.4, 0.9, (sv) => town.ground(sv, 16.4) + 0.02], ['prop_churns', 90.2, 13.3, -1.2, (sv) => town.ground(sv, 13.3) + 0.02],
      ...[44.6, 58.4, 72.6, 86.5, 100.4].map((sv, i) => ['prop_bollard', sv, 6.0, (i % 2 ? 0.2 : -0.15), cope]), ...[51.5, 79.5, 93.5].map((sv, i) => ['prop_bollard', sv, 11.0, Math.PI + (i % 2 ? 0.2 : -0.1), cope])];
    for (const [name, sv, d, turn, at, pitch = 0, roll = 0] of lodged) {
      const [x, z] = town.xz(sv, d), k = name.startsWith('skiff') ? 1 : 0.96 + rnd() * 0.08;
      (sets[name] || (sets[name] = [])).push({ position: [x, at(sv) + 0.004, z], rotation: [pitch, town.along(sv) + turn, roll], scale: [k, k, k], tint: tints[Math.floor(rnd() * tints.length)] });
    }
    const made = [];
    for (const [name, places] of Object.entries(sets)) made.push(await kit.models(`models/town/${name}.glb`, places, { brush: 0.7, extend: [tone('props', 0.07, 0.04, 0.3, 0.6), light.extendFor(0.55)].filter(Boolean) }));
    for (const mesh of bakeInstanced(ctx, made, { name: 'town-props' })) { ctx.only(mesh, 'direct'); near.sorted(mesh, key); }
    shared.kitProps = [...list.map(([name, s, d]) => ({ name, s, d, y: deck(s) })), ...lodged.map(([name, sv, d, , at]) => ({ name, s: sv, d, y: at(sv) }))];
  }

  // ---------------------------------------------------------------------------------------------- the hillside
  // hillside (town_square.py: hill_tree_1 .. _3, hill_wall): the unlit hill the upper town stands on, between and behind its
  // houses: garden trees (yew spires, broad old trees, orchard trees) and garden walls below the houses that stand on dry
  // land. Dark, no light of their own, silhouettes against the mist and the far strips; more of them low down, where the
  // town's light from below still reaches. Sixty-four trees and the walls, poured into one still mesh.
  if (want('hill')) {
    const rnd = ctx.rng(5050), sets = { hill_tree_1: [], hill_tree_2: [], hill_tree_3: [], hill_wall: [], hill_tree_1f: [], hill_tree_2f: [], hill_tree_3f: [], hill_wall_f: [] }, ST = plan.square.steps;
    // (weight, taken over a fourth time: a tree or a wall that stands more than forty metres from the boat's water wears the far
    // copy of its model, a third of the triangles: `f`. Sixty-four trees and forty-three walls were 45,700 triangles of dark on dark.)
    const off = (s, d) => d - town.hw(Math.min(ctx.path.length, Math.max(0, s))), far = (name, s, d) => (off(s, d) > 40 && Q.get('kshillfar') !== '0' ? name + 'f' : name);
    const clearOf = (x, z, r) => town.upper.every((h) => Math.hypot(h.x - x, h.z - z) > Math.max(h.w, h.dep) / 2 + r);
    const tints = ['#ffffff', '#ece6f2', '#f2ece6', '#e2e2ee'], count = () => sets.hill_tree_1.length + sets.hill_tree_2.length + sets.hill_tree_3.length + sets.hill_tree_1f.length + sets.hill_tree_2f.length + sets.hill_tree_3f.length;
    for (let tries = 0; count() < 64 && tries < 3000; tries++) {
      const s = 24 + rnd() * 216, d = town.shore(s) + 2 + Math.pow(rnd(), 1.4) * 80, g = town.ground(s, d);
      if (g < 0.4 || (s > ST.s0 - 3 && s < ST.s1 + 3 && d > ST.d0 - 3 && d < ST.d1 + 4)) continue;      // (not in the water; not on the street of steps)
      const [x, z] = town.xz(s, d);
      if (!clearOf(x, z, 2.5)) continue;
      const q = rnd(), kind = q < 0.3 ? 'hill_tree_1' : q < 0.62 ? 'hill_tree_2' : 'hill_tree_3', k = 0.8 + rnd() * 0.5;
      sets[far(kind, s, d)].push({ position: [x, g, z], rotation: [(rnd() - 0.5) * 0.06, rnd() * 6.283, (rnd() - 0.5) * 0.06], scale: [k * (0.9 + rnd() * 0.2), k * (0.9 + rnd() * 0.3), k * (0.9 + rnd() * 0.2)], tint: tints[Math.floor(rnd() * tints.length)] });
    }
    for (const h of town.upper) {                                              // a garden wall below each house that stands on dry land (three in four of them)
      if (h.floor < 0.2 || rnd() < 0.25) continue;
      const q = town.sd(h.x, h.z), dd = q.d - h.dep / 2 - 2.5 - rnd() * 2, n = Math.max(1, Math.round((h.w + 3) / 6));
      if (town.ground(q.s, dd) < 0.3) continue;
      for (let i = 0; i < n; i++) { const so = q.s + (i - (n - 1) / 2) * 6.02, [wx, wz] = town.xz(so, dd);
        sets[off(so, dd) > 40 && Q.get('kshillfar') !== '0' ? 'hill_wall_f' : 'hill_wall'].push({ position: [wx, town.ground(so, dd), wz], rotation: [0, town.along(Math.min(ctx.path.length, Math.max(0, so))) + (rnd() < 0.5 ? Math.PI : 0), 0], scale: [1, 0.85 + rnd() * 0.35, 1], tint: tints[Math.floor(rnd() * tints.length)] }); }
    }
    // (taken over again) Garden trees behind the walls at the lake's edge (the walls themselves: "copings awash", below), where the
    // boat comes within 30 m of the right shore: beside the church yard and at the poplar road. Each stands where a garden
    // would have it: a yew by a gate, a broad old tree over a wall, an orchard tree in a corner; one stands in the water
    // itself, in a garden the lake has taken. [model, s, metres inland of the waterline (negative: in the lake), size]
    for (const [name, s, inland, k] of [['hill_tree_1', 126.2, 2.4, 1.0], ['hill_tree_2', 133.4, 3.2, 1.05], ['hill_tree_3', 146.3, 2.0, 0.95], ['hill_tree_3', 139.5, 4.5, 0.8],
      ['hill_tree_2', 207.4, 2.8, 1.1], ['hill_tree_1', 215.8, 2.2, 0.92], ['hill_tree_3', 221.6, 3.0, 1.0], ['hill_tree_3', 223.4, -3.2, 1.15], ['hill_tree_1', 203.0, 4.0, 1.15]]) {
      const d = town.shore(s) + inland, [x, z] = town.xz(s, d);
      sets[name].push({ position: [x, town.ground(s, d), z], rotation: [(rnd() - 0.5) * 0.05, rnd() * 6.283, (rnd() - 0.5) * 0.05], scale: [k, k * (0.95 + rnd() * 0.15), k], tint: tints[Math.floor(rnd() * tints.length)] });
    }
    const made = [];
    for (const [name, places] of Object.entries(sets)) if (places.length) made.push(await kit.models(`models/town/${name}.glb`, places, { brush: 0.8, extend: [light.extendFor(0.3)] }));
    for (const mesh of bakeInstanced(ctx, made, { name: 'town-hillside' })) ctx.only(mesh, 'direct');      // (dark trees on a dark hill 60 m and more away: their mirror image is not missed, and it would be 36,000 triangles a frame)
    shared.kitHill = { trees: count(), walls: sets.hill_wall.length + sets.hill_wall_f.length };
  }

  // ---------------------------------------------------------------------------------------------- copings awash
  // Wherever the navigable edge has nothing standing at it (fourteen places): the head of a garden wall just breaking the
  // surface (town_square.py: coping_a, _b, _c, coping_pier). Long weathered coping stones laid flat on a battered rubble wall
  // that goes down into the dark: what the rider meets is the stones' TOPS, which take a quarter of the town's light from
  // below and stay the plum of the night; only their upright edge, a hand high at the water, is warm. (Three makings
  // before this stood faces to the eye within a hand of the water, and were rows of orange lumps: mattresses, loaves,
  // toast.) No two runs alike: three heads (one stone gone, one slipped, one cracked; b carries a length of leaning iron
  // railing with three bars gone; c is breached, its stones tumbled in the gap under the water), each stretched to its
  // place's length and turned either way; five of them end in a gate pier with a stone ball, its iron gate hung open on the
  // garden side, only its spear heads out of the water. Stone and iron are poured into ONE mesh (u of a point's UV says
  // it is iron, which is kept out of the painter's filter: a railing is thinner than the brush).
  if (want('copings')) {
    const rnd = ctx.rng(1414), sets = { a: [], b: [], c: [], pier: [] }, runs = [];
    const HEADS = ['a', 'b', 'c', 'a', 'b', 'c', 'a', 'b', 'c', 'b', 'a', 'c', 'a', 'b'], tints = ['#ffffff', '#efe8f2', '#f4efe8'];
    town.copings.forEach((cp, i) => {
      const head = HEADS[i % HEADS.length], left = cp.d < 0, r = rnd();
      // (b's railing leans in over the garden, away from the channel: the model leans to the route's left as it lies)
      const flip = head === 'b' ? (left ? 0 : Math.PI) : (r < 0.5 ? Math.PI : 0);
      sets[head].push({ position: [cp.x, 0, cp.z], rotation: [0, cp.yaw + flip, (rnd() - 0.5) * 0.012], scale: [cp.len / 6.2, 1, 1], tint: tints[i % 3] });
      const run = { s: cp.s, d: cp.d, x: cp.x, z: cp.z, yaw: cp.yaw, len: cp.len, head, pier: null };
      if (head === 'a') {      // its gate pier: at the up-route end on the left of the route, at the down-route end on the right, so that the gate swings in over the garden
        const end = left ? -1 : 1, off = end * (cp.len / 2 + 0.28), px = cp.x + Math.cos(cp.yaw) * off, pz = cp.z - Math.sin(cp.yaw) * off;
        sets.pier.push({ position: [px, 0, pz], rotation: [0, cp.yaw + (end > 0 ? Math.PI : 0), 0], tint: tints[(i + 1) % 3] });
        run.pier = { x: px, z: pz, top: 1.16 };
      }
      runs.push(run);
    });
    // The stone's own marks, drawn where it stands (a model's paint lives on its points): grain and pits at the scale of a
    // hand; the wall under the coping laid in courses of rubble, the pier in courses of one stone; wet a hand above the
    // water; lichen as small ragged crusts on what looks up, quiet. The iron: rust in its own grain.
    const kc = +(Q.get('kscope') || 1);
    const COPE = {
      uniforms: { uKsCope: { value: kc }, uKsCopeFade: { value: +(Q.get('kscopefade') || 0) } },
      fragmentPars: /* glsl */`uniform float uKsCope, uKsCopeFade;
        float ksH(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float ksN(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(ksH(i), ksH(i + vec2(1.0, 0.0)), f.x), mix(ksH(i + vec2(0.0, 1.0)), ksH(i + vec2(1.0, 1.0)), f.x), f.y); }`,
      albedo: /* glsl */`{ vec2 kq = vWPos.xz * 2.3 + vec2(vWPos.y * 1.9, -vWPos.y * 1.3); float kg = ksN(kq * 27.0 + 1.0), kf = ksN(kq * 9.0 + 3.0);
        if (vUv0.x > 0.5) { albedo *= 0.75 + 0.6 * kg; }
        else {
          float kair = smoothstep(0.0, 0.04, vWPos.y), kup = smoothstep(0.35, 0.8, N.y);
          albedo *= uKsCope * (0.9 + 0.2 * ksN(kq * 0.6 + 11.0));                                                 // cloud
          albedo *= 0.86 + 0.28 * kg;                                                                             // grain
          albedo *= 1.0 - 0.26 * smoothstep(0.8, 0.9, ksN(kq * 53.0 + 5.0));                                      // pits
          if (abs(N.y) < 0.6) {                                                                                   // what stands: courses
            vec3 kaa = abs(N); float kau = kaa.x > kaa.z ? vWPos.z : vWPos.x, kav = vWPos.y + 4.0;
            float kac = floor(kav / 0.3), kah = fract(sin(kac * 12.9898) * 43758.5453), kal = 0.36 + 0.3 * kah;
            float kax = kau / kal + kah * 7.0 + 0.5 * mod(kac, 2.0), kaf = fract(kax), kag = fract(kav / 0.3);
            float kaid = fract(sin(dot(vec2(floor(kax), kac), vec2(127.1, 311.7))) * 43758.5453);
            float krub = 1.0 - smoothstep(-0.06, -0.035, vWPos.y);                                                // (rubble only under the coping's bed: a coping stone's edge and a pier's course are one stone)
            float kadj = min(mix(9.0, min(kaf, 1.0 - kaf) * kal, krub), min(kag, 1.0 - kag) * 0.3);
            float kapx = max(length(vec2(dFdx(kau), dFdy(kau))), length(vec2(dFdx(kav), dFdy(kav))));
            float kafade = 1.0 - smoothstep(0.02, 0.08, kapx);
            albedo *= mix(1.0, 0.78 + 0.44 * kaid, kafade * 0.85 * krub);
            albedo *= 1.0 - 0.5 * (1.0 - smoothstep(0.004, 0.013 + kapx, kadj)) * kafade; }
          albedo *= mix(1.0, mix(0.66, 1.0, smoothstep(0.015, 0.085, vWPos.y)), kair);                            // wet a hand above the water
          float klich = smoothstep(0.66, 0.72, ksN(kq * 7.3 + 3.0) * 0.6 + kf * 0.3 + 0.1 * kg) * kair * kup * smoothstep(0.05, 0.1, vWPos.y);
          albedo = mix(albedo, (albedo * 1.5 + vec3(0.012, 0.016, 0.014)) * (0.8 + 0.4 * kg), klich * 0.5);      // (a crust is a step paler than its stone, in the stone's own hue: pale grey-green blots on brown were camouflage)
          float kmoss = (1.0 - smoothstep(0.2, 0.42, ksN(kq * 1.7 + 31.0) + 0.2 * kf)) * (1.0 - 0.7 * kup) * kair * (1.0 - smoothstep(0.0, 0.14, vWPos.y));
          albedo = mix(albedo, vec3(0.07, 0.115, 0.08) * (0.7 + 0.6 * kf), kmoss * 0.7); } }`,
      // the iron stays out of the painter's filter (a bar is thinner than its brush). (&kscopefade=0.9 loses the wall in the
      // water's own dark colour from a stride under the surface: tried against the slab that hangs under each coping when it
      // is seen from across lit water, and left off: the dark was the fault. The wall is painted the value of lit water now,
      // paler as it goes down, and its foot is ragged.)
      final: /* glsl */`if (vUv0.x > 0.5) gl_FragColor.a = -15.0;
        if (vWPos.y < -0.8 && uKsCopeFade > 0.0) { float kD = -vWPos.y; vec3 kwc = mix(uTownWaterA, uTownWaterB, smoothstep(uTownWater.y, uTownWater.z, kD + 2.0));
          kwc = mix(kwc, uTownWaterLit, smoothstep(0.2, 0.8, gTownL) * uTownBurn.z * 0.5);
          gl_FragColor.rgb = mix(gl_FragColor.rgb, kwc, smoothstep(0.8, 3.0, kD) * uKsCopeFade); }`,
    };
    const made = [];
    for (const k of ['a', 'b', 'c', 'pier']) if (sets[k].length) made.push(await kit.models(`models/town/coping_${k}.glb`, sets[k], { brush: 0.9 }));
    // GARDEN WALLS AT THE LAKE'S EDGE (the hillside's stepped, coped wall: hill_wall, town_square.py), where the boat comes
    // within 30 m of the right shore: beside the church yard and at the poplar road. There the hill met the water in a
    // ruled line with a bare bank behind it. A garden's wall stands in the lake's edge now, its foot in the water, a
    // man's height clear, three lengths together and then the gap a lane came down through: it carries the light from
    // below along its foot, doubles in the water, and the gardens' trees stand over it (the hillside, above). Poured
    // into the copings' mesh: the same stone, the same marks, no draw call added, and the mirror has them.
    { const shoreWalls = [], wt = ['#c9c2d6', '#bdb6cc', '#c4bccc'];
      for (const [s, k] of [[124.0, 1.0], [130.1, 0.9], [136.2, 1.06], [145.4, 0.93], [206.2, 1.0], [212.3, 1.08], [218.4, 0.95]]) {
        const d = town.shore(s) - 0.6, [x, z] = town.xz(s, d);
        shoreWalls.push({ position: [x, -0.05 - 0.2 * rnd(), z], rotation: [0, town.along(s) + (rnd() < 0.5 ? Math.PI : 0), 0], scale: [1, k, 1], tint: wt[shoreWalls.length % 3] });
      }
      // and along the far shore either side of the theatre's front, where the land beyond the square stood as a bare bank a man's
      // height clear, ten to twenty metres from the boat's water at the poplar road: the same wall holds that bank, three lengths
      // to the right of the portico and four to the left (the shore slants away there), each a little higher or lower than the last
      for (const [d, k] of [[21.6, 1.02], [27.7, 0.94], [33.8, 1.08], [-21.6, 0.96], [-27.7, 1.06], [-33.8, 0.92], [-39.9, 1.0]]) {
        const sf = town.farShore(d) - 0.95, [x, z] = town.xz(sf, d), slant = d < -18 ? Math.atan2(town.farShore(d - 3) - town.farShore(d + 3), 6) : 0;
        shoreWalls.push({ position: [x, -0.1 - 0.15 * rnd(), z], rotation: [0, town.along(Math.min(ctx.path.length, sf)) + Math.PI / 2 + slant + (rnd() < 0.5 ? Math.PI : 0), 0], scale: [1, k, 1], tint: wt[shoreWalls.length % 3] });
      }
      made.push(await kit.models('models/town/hill_wall.glb', shoreWalls, { brush: 0.9 })); }
    const copeMat = kit.gouache({ color: '#ffffff', vertexColors: true, map: tPlaster, triplanar: 2.2, brush: 0.9, extend: [{ uniforms: COPE.uniforms, fragmentPars: COPE.fragmentPars, albedo: COPE.albedo }, light.extendFor(0.5), K.DRESS, { final: COPE.final }].filter(Boolean) });      // (K.DRESS: above the water the gate piers, the copings and the garden walls are the terrace's dressed stone: weathered in blotches and runs, lichened, lilac under the lantern: kit_houses.js)
    bakeInstanced(ctx, made, { name: 'town-copings', merge: { slots: ['paint', 'iron'], flag: { iron: 1 }, material: copeMat } });
    shared.kitCopings = { runs };      // each { s, d, x, z, yaw, len, head, pier: null | { x, z, top } }: a gate pier's ball is a place to stand
  }

  // &kslog=tris (measuring only): once the area has run a few frames, every mesh of the realm with its triangles a frame over
  // the passes it is drawn in (3 everywhere, 2 direct view only, 1 mirror only), heaviest first, as notes in the page errors
  if (Q.get('kslog') === 'tris') { let frames = 0;
    updates.push(() => { if (++frames !== 6) return; const rows = [];
      ctx.group.traverse((o) => { if (!(o.isMesh || o.isPoints) || !o.geometry) return; let vis = true; for (let p = o; p; p = p.parent) if (!p.visible) vis = false; if (!vis) return;
        const g = o.geometry, all = g.index ? g.index.count : g.attributes.position ? g.attributes.position.count : 0, n = Math.min(all, g.drawRange.count) / 3, inst = o.isInstancedMesh ? o.count : 1, passes = o.layers.mask === 2 ? 2 : o.layers.mask === 4 ? 1 : 3;      // (what is drawn: a draw range may leave part of a mesh out)
        rows.push([Math.round(n * inst * passes), o.name || (o.parent && o.parent.name) || o.type, Math.round(n), inst, passes]); });
      rows.sort((a, b) => b[0] - a[0]); const total = rows.reduce((a, r) => a + r[0], 0);
      console.error(`INVALID_ note (kit_street, &kslog=tris): ${rows.length} meshes, ${total} triangles a frame over the passes`);
      for (let i = 0; i < Math.min(rows.length, +(Q.get('kslogn') || 45)); i += 30) console.error('INVALID_ note ' + rows.slice(i, i + 30).map((r) => `${r[1]} ${r[0]} (${r[2]}x${r[3]}x${r[4]})`).join(' | ')); }); }

  return { update(dt) { for (const f of updates) f(dt); } };
}
