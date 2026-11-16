// reach: the cast, group "Falls" (stage 3; docs/build/reach/3-cast-plan.md, log: docs/build/reach/3-cast-falls.md).
// The colour running into the river. Everything here is the creature toolkit's (docs/life/falls.md, docs/life/ribbons.md):
//
//   falling dye   ONE makePours for every rope and sheet of liquid: the 26 spouts (shared.spouts: pour and land), the
//                 gallery's five gutters (shared.machines.wringers[].gutterLip), the slipway's three lips (shared.machines
//                 .copper.lips: sheets that swell while the copper pours) and the pit's two arches (shared.wheel.points.pier:
//                 sheets the colour of the gore that was last in the pit). Each rings the water where it lands, raises a
//                 little mist there (one draw of soft points), and WRITES ITS DYE INTO THE WATER every frame: a head under
//                 the fall and a tongue that wanders 1 to 3 m downstream of it (ctx.water.trace.inject: channel 'a' is
//                 indigo, 'b' the right bank's red; violet is both; saffron is 'b' at a third). set.js's glaze reads it
//                 as more dye and forgets it in 65 s.
//   drips         ONE makeFall of kind 'drip' from every hem tip (shared.cloth.drips), every hank (shared.hankDrips), the
//                 launder's seams, the gallery's floor and hanks, the indigo house: a bead with a tail in its cloth's dye,
//                 lit against the sun. The nearest landings ring the water, leave a grain of their dye and call `drop`.
//                 The narthex's hems (s under 27) are a second fall of their own, dark beads, so that staging has them apart.
//   afloat        dye foam at the feet of the spouts, along the indigo quay and against the boom (makeFloaters, kind 'foam':
//                 pink where the water is red, blue where it is indigo; matte); three lost hanks (makeDrifters: they bob,
//                 turn and are pushed by the hull); twelve foam rafts turning once in 30 s on the liquor of the indigo
//                 tubs, vats and pans. The boom's baulks are the set's (kit_frames.js: they ride the water already).
//
// shared.cast.falls (for staging; the log says what each does): pours, groups, flow(), thread(), open(), openTerrace(),
//   drips, narthex, onDrop, shake(), foam, hanks, rafts, sources, dyeRate.
// Developer switches: &fallsoff=pours,dye,stir,mist,drips,foam,hanks,rafts leaves kinds out; &fallstir=<strength>; &fallsdebug=1 writes what was made and
//   where the pours stand to .shots/reach_falls_debug.json; &fallstest=1 calls the staging handles (see the end of the file).
import * as THREE from 'three';
import { makePours } from '../../engine/life/ribbons.js';
import { makeFall } from '../../engine/life/falls.js';
import { makeFloaters, makeDrifters, foamGeometry } from '../../engine/life/floaters.js';

const QS = new URLSearchParams(typeof location !== 'undefined' ? location.search : '');
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const col = (c) => new THREE.Color(c);
const hex = (c) => '#' + c.getHexString();

export async function build(ctx, plan, shared) {
  const { kit, path } = ctx, D = plan.dye, DYES = plan.dyes;
  const cast = (shared.cast = shared.cast || {});
  const OFF = (QS.get('fallsoff') || '').split(','), off = (name) => OFF.includes(name);
  const rnd = ctx.rng(6113);
  const falls = (cast.falls = { pours: null, groups: {}, sources: [], dyeRate: 1, drips: null, narthex: null, onDrop: null, foam: [], hanks: null, rafts: null });
  const said = {};

  // ---- colours. A liquor is its dye a little toward what the dye is lit from behind (the reach is seen against the sun);
  // what a dye writes into the film: [indigo, red].
  const liquor = (i) => col(DYES[i].color).lerp(col(DYES[i].back), i === D.INDIGO || i === D.VIOLET ? 0.08 : 0.42);      // (the blue dyes stay deep: nearer their lit colour they fell as pale water)
  const INK = { [D.CREAM]: [0, 0], [D.SAFFRON]: [0, 0.33], [D.MADDER]: [0, 1], [D.CRIMSON]: [0, 1], [D.VIOLET]: [0.8, 0.8], [D.INDIGO]: [1, 0] };
  /** What any colour writes into the film: blue goes to 'a', red to 'b', violet to both, gold to a third of 'b'. */
  const inkOf = (c, out = [0, 0]) => {
    // (by the colour's own hue: what is left when its white is taken out. A pale colour, cream cloth, writes nothing)
    const lo = Math.min(c.r, c.g, c.b), hi = Math.max(c.r, c.g, c.b, 1e-4), r = c.r - lo, g = c.g - lo, b = c.b - lo, m = Math.max(r, g, b, 1e-4);
    const t = (b - r) / m, gold = smooth(0.18, 0.36, g / m) * (1 - smooth(-0.2, 0.2, t)), dyed = 1 - smooth(0.3, 0.45, lo / hi);
    out[0] = smooth(-0.3, 0.5, t) * dyed; out[1] = (1 - smooth(0.3, 0.9, t)) * (1 - 0.67 * gold) * dyed;
    return out;
  };
  const L0 = {}, A0 = {};
  const riverAt = (x, z) => { path.locate(x, z, null, L0); path.at(L0.s, A0); return { s: L0.s, d: L0.d, hw: L0.halfWidth, tx: A0.tx, tz: A0.tz, rx: A0.rx, rz: A0.rz }; };

  // ================================================================================================ falling dye
  // Every pour: { at, toward, speed, thick, wide, to, color, dye (0..5 or null), kind, s }. A rope thins as it gathers speed
  // (to four tenths at the foot of a metre's fall), so the lips are given at the thick end of the page's 0.05 to 0.3 m.
  const P = [], G = falls.groups;
  const group = (name, i) => (G[name] = G[name] || []).push(i);
  for (const sp of shared.spouts || []) {
    const dx = sp.land[0] - sp.pour[0], dz = sp.land[2] - sp.pour[2], len = Math.hypot(dx, dz) || 1;
    const long = sp.part === 'spout_e', low = sp.part === 'spout_a', sheet = sp.part === 'spout_d';
    const i = P.length;
    P.push({ at: sp.pour.slice(), toward: [dx / len, dz / len], speed: long ? 1.3 : low ? 0.6 : 0.85 + 0.3 * rnd(), thick: long ? 0.34 : low ? 0.1 : sheet ? 0.09 : 0.22 + 0.1 * rnd(),
      wide: sheet ? 0.42 : low ? 0.3 : undefined, to: sp.land[1], color: liquor(sp.dye), dye: sp.dye, kind: 'spout', s: sp.s, period: 6 + 5 * rnd() });
    group('spouts', i);
    if (sp.s > 208 && sp.side > 0) group('terrace', i);
    if (sp.s > 208 && sp.side < 0) group('causeway', i);
  }
  // the gallery's five gutters: each spills from its wringer's gutter lip toward the lagoon
  for (const w of ((shared.machines && shared.machines.wringers) || []).filter((q) => q.gutterLip && q.s > 134 && q.s < 182).slice(0, 5)) {
    const g = w.gutterLip, r = riverAt(g.x, g.z), sg = r.d > 0 ? -1 : 1;
    group('gutters', P.length);
    P.push({ at: [g.x, g.y, g.z], toward: [r.rx * sg, r.rz * sg], speed: 0.7 + 0.2 * rnd(), thick: 0.16 + 0.05 * rnd(), to: 0, color: liquor(D.MADDER), dye: D.MADDER, kind: 'gutter', s: r.s, period: 7 + 4 * rnd() });
  }
  // the slipway's three lips: a sheet from each, falling to the tread below it (the last one to the lagoon). A dribble
  // most of the time; while the copper stands tipped they run full, one after another down the slip
  const copper = shared.machines && shared.machines.copper, lips = [];
  if (copper && copper.lips && copper.toward) copper.lips.forEach((lp, k) => {
    const next = k < copper.lips.length - 1 ? copper.lips[k + 1].y : 0;
    lips.push(P.length); group('slipway', P.length);
    P.push({ at: [lp.x, lp.y, lp.z], toward: [copper.toward.x, copper.toward.z], speed: 0.9, thick: 0.06, wide: 1.7, to: Math.max(0, next), color: liquor(D.MADDER), dye: D.MADDER, kind: 'lip', s: plan.copper.tub[0], flow: 0.25, period: 5 + 2 * k });
  });
  // the pit's two arches: the outflow of the wheel's pit, a low broad sheet over each sill, in the dye last dipped
  const pier = shared.wheel && shared.wheel.points && shared.wheel.points.pier, arches = [];
  if (pier && pier.point) for (const [name, way] of [['arch_north', 1], ['arch_south', -1]]) {
    let q = null; try { q = pier.point(name); } catch (e) { q = null; }
    if (!q) continue;
    arches.push(P.length); group('arches', P.length);
    // (FIRST LOOK: the mouths are at the water, under the pier's ends: there is no sill for anything to fall from, and a
    // sheet put there hung in the air beside the pier like a rag. So an arch is a SOURCE: its dye is written into the
    // water and it rings; its pour is kept shut (flow 0, nothing drawn) for the day a sill is modelled: flow('arches', 1).)
    P.push({ at: [q.x - way * 0.25, Math.max(q.y, 0) + 0.3, q.z], toward: [way, 0], speed: 1.5, thick: 0.05, wide: 1.2, to: 0, color: liquor(D.MADDER), dye: null, kind: 'arch', s: 203, period: 8, flow: 0 });
  }
  said.pours = P.length; said.groups = Object.fromEntries(Object.entries(G).map(([k, v]) => [k, v.length]));

  let pours = null, bodyAttr = null, colAttr = null;
  if (P.length && !off('pours')) {
    pours = makePours(ctx, { pours: P, exact: true, glow: 0.6, rings: true, seed: 211 });      // (at the toolkit's 0.9 a blue sheet seen toward the sun was a white shard)
    bodyAttr = pours.object.geometry.attributes.aBody; colAttr = pours.object.geometry.attributes.aCol;
    pours.object.name = 'falling dye';
    falls.pours = pours;
  }
  const flowOf = (i) => (bodyAttr ? bodyAttr.array[i * 4 + 2] : (P[i].flow ?? 1));
  /** Open or shut pours: `which` a group's name ('spouts', 'terrace', 'causeway', 'gutters', 'slipway', 'arches'), an index or a list. */
  falls.flow = (which, amount, seconds = 2) => { if (!pours) return; for (const i of (typeof which === 'string' ? (G[which] || []) : [].concat(which))) pours.flow(i, amount, seconds); };
  /** At once, with no show: a group as thin threads (0.12), for a cue that will open them later (and for its `settle`: amount 1). */
  falls.thread = (which, amount = 0.12) => falls.flow(which, amount, 0.01);
  /** One after another, `gap` seconds apart, each a thread that thickens to a rope over `seconds`. */
  const later = [];
  falls.open = (which, { gap = 1.6, seconds = 2.6, amount = 1, delay = 0 } = {}) => { const list = typeof which === 'string' ? (G[which] || []) : [].concat(which); list.forEach((i, n) => later.push({ t: ctx.time + delay + n * gap, fn: () => pours && pours.flow(i, amount, seconds) })); };
  /** The page's s 212: the right terrace's six one after another 1.6 s apart, the causeway's five answering more thinly. */
  falls.openTerrace = (o = {}) => { falls.open('terrace', { gap: 1.6, seconds: 2.6, ...o }); falls.open('causeway', { gap: 1.6, seconds: 3.2, amount: 0.7, delay: 2.4, ...o }); };

  // where each pour meets the water, and what it writes there
  const land = P.map((p) => { const fall = Math.max(0.05, p.at[1] - p.to), T = Math.sqrt(2 * fall / 9.81); return { x: p.at[0] + p.toward[0] * p.speed * T, z: p.at[2] + p.toward[1] * p.speed * T, y: p.to }; });
  const sources = falls.sources;
  P.forEach((p, i) => {
    if (p.to > 0.06) return;                                             // it lands on stone
    const q = land[i], r = riverAt(q.x, q.z), inward = r.d > 0 ? -1 : 1;
    let dx = r.tx + 0.4 * inward * r.rx, dz = r.tz + 0.4 * inward * r.rz; const n = Math.hypot(dx, dz) || 1; dx /= n; dz /= n;
    const ink = p.dye == null ? [0, 0] : INK[p.dye].slice();
    sources.push({ i, x: q.x, z: q.z, s: r.s, dx, dz, cx: -dz, cz: dx, ink, arch: p.kind === 'arch', size: p.wide ? 0.8 : 0.5, reach: 1.6 + 1.6 * rnd(), ph: rnd() * 40, k: p.kind === 'lip' ? 0.5 : 1 });
  });
  said.sources = sources.length;

  // the mist at each foot: three soft puffs that rise a hand or two and thin, the liquor's colour gone pale. One draw.
  let mist = null;
  if (pours && !off('mist')) {
    const N = sources.length * 3, pos = new Float32Array(N * 3), seed = new Float32Array(N * 4), tint = new Float32Array(N * 3), pale = col('#F2D8C4');
    sources.forEach((s, n) => { const c = P[s.i].color.clone().lerp(pale, 0.55); for (let k = 0; k < 3; k++) { const j = n * 3 + k; pos.set([s.x, 0.04, s.z], j * 3); seed.set([rnd(), rnd(), s.i, s.size], j * 4); tint.set([c.r, c.g, c.b], j * 3); } });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4)); geo.setAttribute('aTint', new THREE.BufferAttribute(tint, 3));
    const flowTex = { value: new Float32Array(64) };
    const mat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uFlow: flowTex, uPx: { value: 900 }, uKey: ctx.engine.shared.uKeyColor || { value: new THREE.Color(1, 1, 1) }, uVeil: ctx.engine.shared.uVeil },
      transparent: true, depthWrite: false, fog: false,
      vertexShader: /* glsl */`attribute vec4 aSeed; attribute vec3 aTint; uniform float uTime, uPx; uniform float uFlow[64]; varying vec4 vC;
        void main() {
          float life = 1.3 + 0.9 * aSeed.x, t = fract(uTime / life + aSeed.y), flow = uFlow[int(aSeed.z)];
          vec3 p = position; float a = aSeed.y * 6.2831853 + floor(uTime / life + aSeed.y) * 2.4;
          p.xz += vec2(cos(a), sin(a)) * (0.1 + 0.35 * t) * aSeed.w * 2.0; p.y += 0.12 + 0.5 * t * (0.6 + 0.4 * aSeed.x);
          vec4 mv = viewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = min(90.0, uPx * (0.5 + 0.9 * t) * aSeed.w * 1.3 / max(-mv.z, 0.7));
          vC = vec4(aTint, 0.34 * smoothstep(0.0, 0.15, t) * (1.0 - t) * min(1.0, flow * 1.4) * smoothstep(0.7, 1.6, -mv.z));
        }`,
      fragmentShader: /* glsl */`uniform vec3 uKey; uniform float uVeil; varying vec4 vC;
        void main() { vec2 q = gl_PointCoord * 2.0 - 1.0; float a = vC.a * exp(-dot(q, q) * 2.6) * (1.0 - uVeil); if (a < 0.004) discard; gl_FragColor = vec4(vC.rgb * (uKey * 0.85 + 0.15), a); }`,
    });
    mist = new THREE.Points(geo, mat); mist.name = 'falling dye: mist'; mist.frustumCulled = false; mist.renderOrder = 3;
    ctx.add(mist); ctx.only(mist, 'direct');
    mist.userData.flow = flowTex.value;
    const size = new THREE.Vector2();
    mist.onBeforeRender = (renderer) => { const rt = renderer.getRenderTarget(); mat.uniforms.uPx.value = rt ? rt.height : renderer.getDrawingBufferSize(size).y; };
  }

  // ================================================================================================ drips
  // A place: { x, y, z, color }. The colour is the cloth's own dye, a little toward its lit-from-behind colour: a bead
  // covers with it and is lit in it against the sun (the family's scatter).
  // (FIRST LOOK: beads of the cloth's own value were red on red cloth and gold on a gold sky: nothing was seen. A drop of
  // dye liquor is DARK: the dye at its deepest. It stands dark against lit cloth and sky, and only the family's scatter
  // lights it, where it hangs between the eye and the sun.)
  const bead = (c) => { const k = col(c), m = Math.max(k.r, k.g, k.b, 1e-3); return hex(k.multiplyScalar(Math.min(1.2, 0.2 / m)).lerp(col('#2A1420'), 0.25)); };
  const beadOf = (dye) => (dye == null || dye === D.CREAM ? '#4A3A38' : bead(col(DYES[dye].color)));
  const DRIP = { size: QS.has('dripsize') ? +QS.get('dripsize') : 0.13, vary: 0.3, minPixels: 5.5, opacity: 0.96, scatter: { color: null, gain: 1.1, power: 6 } };      // (&dripsize=0.5: to find them)
  const places = [], dark = [], hemTips = (shared.cloth && shared.cloth.drips) || [];
  hemTips.forEach((q, n) => {
    if ((q.wet ?? 0.5) < 0.15) return;
    path.locate(q.x, q.z, null, L0);
    if (L0.s < 27) { dark.push({ x: q.x, y: q.y - 0.03, z: q.z, color: bead(q.color) }); return; }
    places.push({ x: q.x, y: q.y - 0.03, z: q.z, color: bead(q.color) });
    if ((q.wet ?? 0.5) > 0.7) places.push({ x: q.x + (rnd() - 0.5) * 0.5, y: q.y - 0.02, z: q.z + (rnd() - 0.5) * 0.5, color: bead(q.color) });      // (the wettest hems drip from two places)
    const o = hemTips[n + 1];                                            // (and from somewhere between a bolt's two tips: the page's 900)
    if (o && o.bolt === q.bolt && !o.loft === !q.loft) { const u = 0.3 + 0.4 * rnd(); places.push({ x: q.x + (o.x - q.x) * u, y: Math.max(q.y, o.y) + 0.02, z: q.z + (o.z - q.z) * u, color: bead(q.color) }); }
  });
  said.hems = places.length; said.narthex = dark.length;
  for (const q of shared.hankDrips || []) places.push({ x: q.x, y: q.y - 0.02, z: q.z, color: beadOf(q.dye) });
  for (const q of (shared.launder && shared.launder.drips) || []) places.push({ x: q[0], y: q[1] - 0.02, z: q[2], color: '#4A3A38' });
  { const g = shared.machines && shared.machines.gallery;
    if (g) { for (const q of g.drips || []) places.push({ x: q.x, y: q.y - 0.02, z: q.z, color: beadOf(D.MADDER) }); for (const q of g.hanks || []) places.push({ x: q.x, y: q.y - 0.02, z: q.z, color: beadOf(q.dye) }); } }
  for (const q of (shared.indigoHouse && shared.indigoHouse.drips) || []) if (q) places.push({ x: q.x, y: q.y - 0.02, z: q.z, color: beadOf(D.INDIGO) });
  for (const sp of shared.spouts || []) places.push({ x: sp.pour[0] + (rnd() - 0.5) * 0.2, y: sp.pour[1] - 0.06, z: sp.pour[2] + (rnd() - 0.5) * 0.2, color: beadOf(sp.dye) });      // (the lip's own drip beside its rope)
  said.places = places.length;

  let dropAt = 0;
  const ink2 = [0, 0], inkCol = new THREE.Color();
  const stain = (x, z, color, amount, radius) => {
    const tr = ctx.water.trace; if (!tr || !tr.inject || !color) return;
    inkCol.set(color); inkOf(inkCol, ink2);
    if (ink2[0] > 0.05) tr.inject(x, z, { channel: 'a', radius, strength: amount * ink2[0] });
    if (ink2[1] > 0.05) tr.inject(x, z, { channel: 'b', radius, strength: amount * ink2[1] });
  };
  const onLand = (x, z, info) => {
    if (info.onBoat) return;
    stain(x, z, info.color, 0.5, 0.22);                                 // a grain of its cloth's dye
    if (falls.onDrop && ctx.time >= dropAt) { dropAt = ctx.time + 1 / 6; falls.onDrop(x, z, info); }      // `drop`: six a second at most
  };
  if (places.length && !off('drips')) {
    falls.drips = makeFall(ctx, { kind: 'drip', points: places, per: 1, every: [2, 9], seed: 733, ...DRIP, landings: { within: 16, perSecond: 12, onLand } });
    if (falls.drips.object) falls.drips.object.name = 'drips';
  }
  if (dark.length && !off('drips')) {
    falls.narthex = makeFall(ctx, { kind: 'drip', points: dark, per: 1, every: [2, 9], seed: 739, ...DRIP, scatter: { color: null, gain: 0.5, power: 6 }, landings: { within: 14, perSecond: 8, onLand } });
    if (falls.narthex.object) falls.narthex.object.name = 'drips: narthex';
  }
  /** Shaken drops: a line of rings on the water from `from` to `to` ([x, z] or { s, d }), `count` of them over `over` seconds
   *  (the first breath shakes a rank's hems a moment before it lifts them). Each is a ring, a grain of `color` and a `drop`. */
  falls.shake = ({ from, to, count = 18, over = 1.2, color = null, ring = [0.3, 0.3] } = {}) => {
    const pt = (q) => { if (Array.isArray(q)) return { x: q[0], z: q[1] }; const w = path.point(q.s, q.d || 0, 0); return { x: w.x, z: w.z }; }, a = pt(from), b = pt(to), r2 = ctx.rng(Math.floor(ctx.time * 10) + 5);
    for (let i = 0; i < count; i++) {
      const u = (i + r2()) / count, x = a.x + (b.x - a.x) * u + (r2() - 0.5) * 0.5, z = a.z + (b.z - a.z) * u + (r2() - 0.5) * 0.5;
      later.push({ t: ctx.time + over * (0.25 * u + 0.75 * r2()), fn: () => { ctx.water.ripple(x, z, ring[0], ring[1]); if (color) stain(x, z, color, 0.5, 0.22); if (falls.onDrop && ctx.time >= dropAt) { dropAt = ctx.time + 1 / 6; falls.onDrop(x, z, { distance: Math.hypot(x - ctx.boat.x, z - ctx.boat.z), kind: 'drip', color }); } } });
    }
  };

  // ================================================================================================ afloat
  // Dye foam: matte clumps, pink on red water and blue on indigo, lying where a fall churns the river and where the
  // current leaves it: at the feet of the spouts that fall into the water, along the indigo quay, against the boom.
  if (!off('foam')) {
    const pink = [], blue = [];
    const put = (list, x, z, size) => list.push({ x, z, size, turn: rnd() * 6.283 });
    for (const s of sources) {
      const p = P[s.i]; if (p.kind !== 'spout' && p.kind !== 'gutter') continue;
      if (p.kind === 'gutter' || rnd() > 0.72) continue;                 // (about thirty clumps in all, the page's number)
      const list = p.dye === D.INDIGO || p.dye === D.VIOLET ? blue : pink, n = 1;
      for (let k = 0; k < n; k++) { const far = 0.7 + 0.9 * k + 0.5 * rnd(), side = (rnd() - 0.5) * 0.9; put(list, s.x + s.dx * far + s.cx * side, s.z + s.dz * far + s.cz * side, 0.5 + 0.5 * rnd()); }
    }
    const Q = plan.indigoHouse.quay;                                      // the quay: four in its lee, a little out from the wall
    for (let k = 0; k < 4; k++) { const s = Q.from + 4 + (Q.to - Q.from - 8) * (k + 0.2 + 0.6 * rnd()) / 4, q = path.point(s, -(kit.halfWidth(s) - 0.6 - 1.4 * rnd()), 0); put(blue, q.x, q.z, 0.6 + 0.5 * rnd()); }
    const B = plan.wheel.boom;                                            // against the boom, on the lagoon's side of it: what the current brings
    for (let k = 0; k < 6; k++) {
      const j = 1 + Math.floor(rnd() * (B.length - 2)), u = rnd(), x = B[j][0] + (B[j + 1][0] - B[j][0]) * u, z = B[j][1] + (B[j + 1][1] - B[j][1]) * u;
      const nx = -(B[j + 1][1] - B[j][1]), nz = B[j + 1][0] - B[j][0], nl = Math.hypot(nx, nz) || 1, out = (nz > 0 ? 1 : -1) * (0.75 + 0.5 * rnd());      // (the lagoon lies toward +z of the boom)
      put(k % 3 === 0 ? pink : blue, x + nx / nl * out, z + nz / nl * out, 0.5 + 0.6 * rnd());
    }
    if (pink.length) falls.foam.push(makeFloaters(ctx, { kind: 'foam', items: pink, exact: true, seed: 811, top: ['#9A4A62', '#8A3E58', '#A6566A'], under: ['#6A3648'], glare: 0.36, tone: 0.5 }));      // (matte and deep: at the family's tone it was pale pink, nearly white, on dark water)
    if (blue.length) falls.foam.push(makeFloaters(ctx, { kind: 'foam', items: blue, exact: true, seed: 813, top: ['#4A5696', '#3E4A8C', '#56609C'], under: ['#39406C'], glare: 0.36, tone: 0.5 }));
    said.foam = [pink.length, blue.length];
  }

  // Three lost hanks: a skein of yarn come off a rack, low in the water, turning in an eddy. One piece, one draw.
  if (!off('hanks')) {
    const curve = new THREE.Curve();
    // (a hank is a long loop of yarn twisted on itself: a narrow figure of eight whose two eyes are closed by the yarn's own
    // thickness, lying low and sodden. Looked at as a plain oval it was a red ring on the water, a toy)
    curve.getPoint = (t, out = new THREE.Vector3()) => { const a = t * Math.PI * 2; return out.set(0.47 * Math.cos(a) + 0.03 * Math.sin(3 * a + 0.4), -0.022 + 0.022 * Math.cos(2 * a) * Math.sign(Math.sin(a) || 1), 0.05 * Math.sin(2 * a) + 0.018 * Math.sin(a)); };
    const geo = new THREE.TubeGeometry(curve, 48, 0.062, 6, true), n = geo.attributes.position.count, cols = new Float32Array(n * 3);
    const c0 = col(DYES[D.CRIMSON].color), c1 = col(DYES[D.MADDER].color), c = new THREE.Color();
    for (let i = 0; i < n; i++) { const strand = 0.7 + 0.3 * Math.sin(i * 2.399), x = geo.attributes.position.getX(i); c.copy(c0).lerp(c1, smooth(-0.2, 0.35, x)).multiplyScalar(strand * 0.3); cols.set([c.r, c.g, c.b], i * 3); }      // (sodden and dark: it lies on light water)
    geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    const E = (shared.dye && shared.dye.eddies) || [];
    const near = (s, d) => { const q = path.point(s, d, 0); let best = null, bd = 9; for (const e of E) { const dd = Math.hypot(e.x - q.x, e.z - q.z); if (dd < bd) { bd = dd; best = e; } } return best ? { x: best.x + 0.6, z: best.z + 0.4 } : { x: q.x, z: q.z }; };
    const items = [[72, 3.4], [118, -7.5], [156, 5.5]].map(([s, d], i) => ({ ...near(s, d), radius: 0.15, length: 0.62, turn: 0.7 + i * 2.1, home: true }));
    falls.hanks = makeDrifters(ctx, { items, geometry: geo, material: { vertexColors: true, brush: 0.4, shade: 0.7 }, drift: 0, spin: [34, 60], tether: 0.5, ride: { size: 0.9, tip: 0.9, most: 0.1, bob: 0.012, period: 3.1 }, seed: 91, exact: true });
    if (falls.hanks.object) falls.hanks.object.name = 'lost hanks';
    said.hanks = items.map((q) => [Math.round(q.x), Math.round(q.z)]);
  }

  // Twelve foam rafts on standing liquor: the indigo house's two tubs in the ford, the causeway's seven pans, the three
  // indigo vats nearest the water. Each turns once in 30 s. One draw.
  let rafts = null;
  if (!off('rafts')) {
    const at = [];
    for (const t of (shared.indigoHouse && shared.indigoHouse.tubs) || []) if (t && t.x != null) at.push({ x: t.x, y: t.y, z: t.z, size: 0.5 * t.across });
    const V = shared.vats || [];
    for (const v of V.filter((q) => q.pan)) at.push({ x: v.steam[0] + (rnd() - 0.5) * 0.9, y: v.steam[1], z: v.steam[2] + (rnd() - 0.5) * 0.9, size: 0.9 + 0.5 * rnd() });
    for (const v of V.filter((q) => !q.pan && q.dye === D.INDIGO).sort((a, b) => Math.abs(a.d) - Math.abs(b.d)).slice(0, Math.max(0, 12 - at.length))) at.push({ x: v.steam[0], y: v.steam[1], z: v.steam[2], size: 0.42 * v.across });
    if (at.length) {
      const geo = foamGeometry(); if (!geo.attributes.normal) geo.computeVertexNormals();
      rafts = new THREE.InstancedMesh(geo, kit.gouache({ color: '#3A457E', brush: 0.6, shade: 0.75, extend: shared.sun && shared.sun.extend }), at.length);
      rafts.name = 'foam rafts'; rafts.frustumCulled = false; rafts.userData.at = at.map((q, i) => ({ ...q, ph: rnd() * 6.283, way: i % 2 ? -1 : 1 }));
      ctx.add(rafts); ctx.only(rafts, 'direct');
      falls.rafts = rafts;
    }
    said.rafts = at.length;
  }

  // ================================================================================================ every frame
  const M = new THREE.Matrix4(), Qt = new THREE.Quaternion(), Up = new THREE.Vector3(0, 1, 0), Sc = new THREE.Vector3(), Ps = new THREE.Vector3();
  const archCol = new THREE.Color(), archTo = new THREE.Color(), archInk = [0, 0];
  let pouring = false, frame = 0, archSet = false, warm = 0, archRing = 1, stirIn = 0; const WARM = 3.5, STIR = QS.has('fallstir') ? +QS.get('fallstir') : 0;      // (the eddy under each fall: OFF. Tried at 0.18: no difference could be seen in the water. &fallstir=0.18 to try again)
  ctx.water.onBind(ctx.path, () => { warm = 0; });                    // (the film is laid bare again every time the reach becomes current)
  const lastDye = (out) => {
    const w = shared.wheel; if (!w) return false;
    if (w.last) { out.set(w.last.color || w.last.hem || w.last); return true; }
    const dyes = w.dyes ? w.dyes() : null; if (!dyes || !dyes.length) return false;
    // the gore that hangs nearest straight down is the one in the pit (arm i stands at i / 12 of a turn in the wheel's own count)
    let best = 0, bd = 9; const arms = w.arms || dyes.map((_, i) => i);
    for (let k = 0; k < dyes.length; k++) { let a = (arms[k] / 12) * Math.PI * 2 + (w.angle || 0) + Math.PI / 2; a = Math.abs(Math.atan2(Math.sin(a), Math.cos(a))); if (a < bd) { bd = a; best = k; } }
    out.set(dyes[best].hem || dyes[best].top); return true;
  };
  ctx.onUpdate((dt) => {
    const t = ctx.time; frame++;
    for (let i = later.length - 1; i >= 0; i--) if (t >= later[i].t) { const e = later[i]; later.splice(i, 1); e.fn(); }
    // the slipway follows the copper: full while it stands tipped, a dribble after, each lip a little after the one above
    if (pours && copper && lips.length) {
      const now = (copper.tilt ? copper.tilt() : 0) > 46;
      if (now !== pouring) { pouring = now; lips.forEach((i, k) => later.push({ t: t + 0.5 + k * 0.7, fn: () => pours.flow(i, now ? 1 : 0.25, now ? 1.4 : 6) })); }
    }
    // the arches take the dye last dipped, eased
    if (pours && arches.length && lastDye(archTo)) {
      if (!archSet) { archCol.copy(archTo); archSet = true; } else archCol.lerp(archTo, 1 - Math.exp(-dt * 0.4));
      const c = archCol.clone().multiplyScalar(0.7);
      for (const i of arches) colAttr.array.set([c.r, c.g, c.b], i * 3);
      colAttr.needsUpdate = true; inkOf(archCol, archInk);
    }
    // the dye in the water: under each fall a head, and a tongue that wanders downstream of it (one of its two places a frame)
    const tr = ctx.water.trace;
    if (tr && tr.inject && !off('dye')) {
      // (when the reach has just been entered its film is bare: for the first seconds every source writes twelve times as
      // fast and its tongue sweeps its whole range, so that the dye is standing in the water before the rider is near)
      warm += dt; const hot = warm < WARM, tq = hot ? t * 14 : t;
      const bx = ctx.boat.x, bz = ctx.boat.z, rate = falls.dyeRate * Math.min(dt, 0.05) * (hot ? 12 : 1);
      for (const s of sources) {
        if (!hot && Math.abs(s.x - bx) + Math.abs(s.z - bz) > 150) continue;
        const f = s.arch ? 1 : flowOf(s.i) * s.k; if (f < 0.03) continue;
        const ink = s.arch ? archInk : s.ink, a = ink[0], b = ink[1];
        const which = (frame + s.i) & 1, far = (which ? 0.45 : 0.85) * s.reach * (0.75 + 0.25 * Math.sin(tq * 0.21 + s.ph)), side = (which ? 0.5 : 1.1) * Math.sin(tq * (which ? 0.37 : 0.23) + s.ph * (which ? 1.7 : 1));
        const x2 = s.x + s.dx * far + s.cx * side, z2 = s.z + s.dz * far + s.cz * side, r2 = s.size * (which ? 1.3 : 1.9);
        if (a > 0.02) { tr.inject(s.x, s.z, { channel: 'a', radius: s.size, strength: 0.09 * rate * f * a }); tr.inject(x2, z2, { channel: 'a', radius: r2, strength: 0.07 * rate * f * a }); }
        if (b > 0.02) { tr.inject(s.x, s.z, { channel: 'b', radius: s.size, strength: 0.09 * rate * f * b }); tr.inject(x2, z2, { channel: 'b', radius: r2, strength: 0.07 * rate * f * b }); }
      }
      // and the fall turns the water under it: a slow eddy a metre across just downstream of each foot (the film's swirl:
      // the dye written above is carried round it, and set.js's stir curls its figure). It turns one way for some twenty
      // seconds and then back, each fall on its own time, so that the water is curled and never wound to a blur
      if (STIR > 0 && !off('stir') && (stirIn -= dt) <= 0) {
        stirIn = 0.4;
        for (const s of sources) {
          if (Math.abs(s.x - bx) + Math.abs(s.z - bz) > 90) continue;
          const f = s.arch ? 1 : flowOf(s.i) * s.k; if (f < 0.03) continue;
          const far = 0.5 * s.reach;
          tr.inject(s.x + s.dx * far, s.z + s.dz * far, { channel: 'swirl', radius: 1.1, strength: STIR * f * Math.sin(t * (6.2831853 / (36 + 14 * ((s.ph * 0.37) % 1))) + s.ph) });
        }
      }
    }
    if (arches.length && (archRing -= dt) <= 0) { archRing = 0.7 + 0.6 * rnd(); for (const s of sources) if (s.arch) ctx.water.ripple(s.x + (rnd() - 0.5) * 0.8, s.z + (rnd() - 0.5) * 0.8, 0.3, 0.6); }
    if (mist) { const m = mist.material.uniforms, fl = mist.userData.flow; m.uTime.value = t; for (let i = 0; i < P.length && i < 64; i++) fl[i] = flowOf(i); }
    if (rafts) {
      const list = rafts.userData.at;
      for (let i = 0; i < list.length; i++) { const q = list[i]; Qt.setFromAxisAngle(Up, q.ph + q.way * t * (Math.PI * 2 / 30)); Ps.set(q.x, q.y + 0.012, q.z); Sc.set(q.size, 1, q.size); M.compose(Ps, Qt, Sc); rafts.setMatrixAt(i, M); }
      rafts.instanceMatrix.needsUpdate = true;
    }
  });

  // &fallstest=1: the handles as staging will call them (the terrace as threads at 1.5 s, opened at 3 s; a line of shaken
  // drops across the channel 6 m ahead at 3 s); what happened is written to .shots/reach_falls_test.json at 14 s
  if (QS.has('fallstest')) {
    let step = 0, drops = 0, err = null; falls.onDrop = () => { drops++; };
    ctx.onUpdate(() => {
      try {
        if (step === 0 && ctx.time > 1.5) { step = 1; falls.thread('terrace'); falls.thread('causeway'); }
        if (step === 1 && ctx.time > 3) { step = 2; falls.openTerrace(); path.locate(ctx.boat.x, ctx.boat.z, null, L0); falls.shake({ from: { s: L0.s + 6, d: -5 }, to: { s: L0.s + 6, d: 5 }, color: DYES[D.VIOLET].color }); }
      } catch (e) { err = String(e && e.stack || e); }
      if (step === 2 && ctx.time > 14) { step = 3; fetch('/__shot/reach_falls_test.json', { method: 'POST', body: JSON.stringify({ drops, err, later: later.length, flows: (G.terrace || []).concat(G.causeway || []).map((i) => +flowOf(i).toFixed(2)) }) }).catch(() => {}); }
    });
  }
  if (QS.has('fallsdebug')) fetch('/__shot/reach_falls_debug.json', { method: 'POST', body: JSON.stringify({ ...said, land: land.map((q, i) => [P[i].kind, +q.x.toFixed(1), +P[i].at[1].toFixed(2), +q.z.toFixed(1), +P[i].to.toFixed(2), +(P[i].s || 0).toFixed(0)]) }) }).catch(() => {});
  return {};
}
