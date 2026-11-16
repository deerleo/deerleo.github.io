// The answering sea: the cast, group "Edge" (stage 3; docs/build/sea/3-cast-edge.md). The close band's life and the
// iron and cork on the left edge of the sound:
//
//   kelp        900 fronds in the twelve beds (shared.rocks.kelpBeds): the ribbons family's `kelp`, rooted on the rock
//               that stands at each bed, thrown over by the water's own swell, lying awash where it reaches the surface,
//               shouldered aside by the hull. Its light is this area's: broken marks along its margins as it whips
//               over, cooling as they age; nothing at rest. The kit's stand-in is taken out here.
//   drips       40 places under the gate's hanging ends: the falls family's `drip`. Each landing near the boat is one
//               ripple, one dab in the water's trace, one pin ring of light, a crown of drops, one event.
//   afloat      the set's bell buoy, floats and dans, answered: broken water running out from each as the swell lifts it
//               in turn (in the sea's own flecks: never a drawn ring), a shiver at the buoy's waterline and an event at
//               every stroke of a hammer, the bell rung on demand, each lit as the rain front's foot reaches it (or on
//               demand), the wake rocking them, the rags lifted.
//   spray       the set's spray (light.js) is not made twice: where a struck foot's sparks fall back near the boat they
//               strike rings; every strike near is told; the wake does the same in small; a rate and a burst for staging.
//               And behind the rain front only, the storm's own water: sheets and arcs thrown at sixty feet (the page's
//               emitters), from the page's 2,400 pooled drops.
//   marks, sparks   the two pooled systems the rest write with: marks lying on the swell (a ring, drawn as the sea's own
//               answer to a raindrop is drawn; a wash, drawn as the set draws surf light), and thrown drops (drawn as
//               the set's spray draws its flecks).
//
// FOR STAGING: everything is under shared.cast.edge, and by its own name under shared.cast (kelp, drips, spray, buoy,
// floats, rags): see the end of build() and the log. This module plays no sound. Every sound has an event:
//   edge.on('drop',   (x, z, { onBoat, distance, gain }) => ...)      a vault drip lands (on the water near the boat, or on the boat)
//   edge.on('bell',   (x, z, { y, gain, note: 57, natural, hammer, distance, tilt }) => ...)      a hammer strikes (the buoy's own roll, or buoy.ring); told at any distance
//   edge.on('splash', (x, z, { strength, distance, pitch: 0.7 }) => ...)      a crest strikes a foot within 30 m (at most one in spray.splashEvery seconds)
//   edge.on('lift',   (x, z, { kind: 'float' | 'dan' | 'buoy', index, strength }) => ...)      the swell lifts one through its level
//   edge.on('lit',    (x, z, { kind, index, strength }) => ...)      the front's foot reaches one (or floats.lightUp / sequence)
//   edge.on('knock',  (x, z, { kind, index }) => ...)      the hull knocks a float or a dan aside
//
// Numbers: EDGE, below (plan.js is being edited by the set's people: this group keeps its numbers here).
// Switches for looking: &edge=kelp,drips,afloat,spray builds some of its parts only; &edgetune=drips.dab.strength:0.5 tries
// another number of EDGE; &edgedebug=1 logs one line of what
// was built, &edgelog=<seconds> one line of what has happened by then (EDGE_PROBE: the picture tool prints it among the
// page errors; it is not one); &edgeprobe=1 writes the places to .shots/sea_e_probe.json; &edgedabs=0 leaves the kelp's
// dabs out of the water's trace. To try what staging will call: &edgeburst, &edgebell, &edgelit, &edgerags, &edgerate
// (see the end of build()).
import * as THREE from 'three';
import { waterUniforms } from '../../engine/water-final.js';
import { removeStandIn } from '../../engine/modules.js';

const EDGE = {
  kelp: {
    // lengths (m), widths (m), olive-black at the holdfast and a little paler toward the frayed tip
    // (fourth holder: the page's chip for kelp and wrack is #0A1A18, a green-black on the cold side. Its tips were typed toward yellow
    // (#1a1c10 ..): under the rider's lantern that was khaki, the one warm leaf in a cold picture)
    len: [3, 6], width: [0.2, 0.36], color: ['#0a1512', '#0b1613', '#09120f', '#0c1611'], tip: ['#111f1a', '#0f1c19', '#131e17'],
    fan: 0.7,                   // radians between the ways two fronds are thrown by one surge (the water at a foot is all eddies: thrown one way to a hair they were a comb)
    segments: 12,               // stretches a frond is built of (the family's 8 show as elbows in a six-metre frond beside the hull)
    lee: 0.85,                  // metres under the surface it keeps in the lee round the kept lamp (the amber stroke lies on that water)
    under: 0.05,                // metres under still water the family lays it along (this module then keeps it under where the swell stands now: it lies awash in the troughs)
    reach: 5.5,                 // metres round a bed's middle in which its fronds may root
    depth: [1.15, 4.4],         // how deep on a wall they root
    back: [0.12, 0.9],          // metres behind its root a frond may be thrown: one on a wall, one on a ledge (the rock is there)
    lamp: [0.26, 0.5], night: 0.9,      // how much of the lantern's and the kept lamp's light it takes (of what stone takes), and the most; how much of the night's own
    taper: [0.14, 0.88, 0.55, 0],      // a strap that keeps its width and ends blunt (the family's blade narrows to a third from three quarters along: a sword)
    glow: 1.6,                  // how bright the marks along a frond that whips over
    hull: 0.9, stir: 0.45,      // the same where the hull parts it (while the boat moves) and where the water over it is stirred
    dab: { radius: 0.4, strength: 0.27, perSecond: 60, within: 34 },      // the tip's dab in the water's trace at each reversal, as an age: old light, a sparse violet glitter gone in a few seconds
  },
  drips: {
    count: 40, per: 2,          // emitters under the gate's hanging ends; instances to an emitter (half of them are out at the ordinary rate: one drop from each place every 3 to 9 s)
    every: [3, 9], over: 10.2,  // seconds between a place's drops; only places within this many metres of the centre line (open water lies under them)
    apart: 2.2,                 // metres one emitter keeps from the next
    // a faint spark: the area's aqua, some of them older light. A drop is a bead a thumb wide with a tail; the family draws it out five times
    // along its fall and never smaller than `minPixels` across (so at 6 a far drop was a glowing spike thirty pixels long, as large far as
    // near, the brightest thing under the gate: an icicle, where the page asks a faint spark)
    // (fourth holder: at 0.036 a drop two metres from the eye, where they fall on a boat left to the current, was a solid aqua icicle
    // 13 pixels wide and 65 long: sea_e4_d01_f10.png. A drop is a streak a finger wide, half clear: the dark behind it shows through)
    size: 0.013, color: ['#3fe0d0', '#7cecdf', '#3fe0d0', '#58e6da', '#2fb9b4'], intensity: 0.9, opacity: 0.62,
    minPixels: 2.3, farAlpha: 0.5,
    within: 15, perSecond: 20,  // landings are found within this of the boat, at most so many a second
    ripple: [0.5, 0.3],         // the page's ripple at each landing (strength, radius)
    // what it leaves where it fell: a patch of specks a forearm across, in the sea's own flecks, that cools and is gone in two seconds
    // (edge.marks.wash, fine). NOT a dab in the water's trace (strength 0: kept as a number for whoever wants it back): light written there
    // lives twenty seconds as a violet disc, and a place drips every three to nine: under each of the forty there stood a violet disc that
    // never went out, and could not be told from the small jellies' glimmer
    dab: { radius: 0.3, strength: 0, patch: { r0: 0.02, r1: 0.22, life: 1.8, gain: 1.0, core: 0.5 } },
    pin: { r0: 0.02, r1: 0.15, life: 1.5, bold: 0.85, gain: 0.85 },   // the pin ring of light: 0.3 m wide, for a second and a half
    crown: 3,                   // drops thrown up where one lands
  },
  floats: {
    // each lift: the page's ripple; broken water running out from its waterline (a wash: r0 its waterline, r1 how far it runs at most, metres;
    // a dan's is four fifths of a float's); and what it leaves in the water's trace, a ring of dabs round it, as an age
    ripple: [0.25, 0.5], wash: { r0: 0.13, r1: 0.5, life: 2.4, gain: 1.7, core: 0.5 },      // (r1 was 1.2: round a cork a hand high that was a doily of dust two and a half metres across, sea_e4_f01_f04.png; broken water hugs what breaks it)
    trace: { n: 4, r: 0.36, radius: 0.4, age: 0 },      // (age 0: nothing is left in the trace at an ordinary lift. Written every swell it stood round each of them as blots of violet that never went out)
    lit: { r0: 0.13, r1: 0.95, life: 3.0, gain: 1.3, core: 1, trace: 0.58 },             // lit on demand, or as the rain front's foot reaches it: it runs out further, white-hot at first, new light round it
    knock: { r0: 0.13, r1: 0.8, life: 1.4, gain: 0.9, core: 0.6 },                       // the hull knocks one aside
    wake: { within: 8, lean: 0.5, hz: 0.9, settle: 2.2 },      // the wake rocks them: metres from the boat, radians at the hull's side, how fast, seconds to settle
  },
  buoy: {
    // each lift (its ripple is its own, heroes_b.js, and the surf light at its waterline the layout's): a little broken water running out
    // past that, and a ring of ember left in the trace
    wash: { r0: 1.2, r1: 2.05, life: 2.8, gain: 0.95, core: 0.2 }, trace: { n: 9, r: 1.5, radius: 0.45, age: 0 },
    lit: { r0: 1.2, r1: 2.7, life: 3.2, gain: 1.15, core: 1, trace: 0.58 },
    strike: { r0: 1.19, r1: 1.62, life: 0.95, gain: 1.3, ripple: [0.15, 0.4] },      // each stroke of a hammer: the iron shivers the water it stands in (specks, tight to the hull)
    gain: [0.6, 1.0], speed: [0.15, 0.6],     // the bell's gain by how hard the hammer came (radians a second)
    gap: 0.62,                  // seconds between two strokes when it is rung on demand
    // (stage 5) seconds between two strokes of the buoy's own that RING (the page: "every 6 to 11 s"). Its four hammers come to the lip far
    // oftener than that (told at 0.6, 0.8, 3.1, 5.9 s at rest; thirteen of its own in fifty seconds of the storm): the ones between are
    // hammers lying back against the bell, and are neither told nor drawn
    own: [6, 11],
  },
  spray: {
    pool: 2400,                 // thrown drops kept (the page's pooled particles)
    // THE STORM'S OWN WATER, behind the rain front only: at most so many feet (the set's own places: those that meet the swell squarely
    // enough, so far apart at least; and `lee` of them on sides turned from it, further apart, so that the wall's own face has some),
    // each throwing a sheet when a crest strikes it (arcs of `per` drops, near and far, rising `high` metres: never above 6 m), and
    // within `smallWithin` metres of the boat smaller ones between crests, each place in its own time (`between` seconds, `small` of a
    // crest's strength); only within `reach` metres of the boat
    // (`body`, `per`: the puffs of a crest's sheet and the drops of each of its gouts, by how far off it is: within 32 m, within 105 m, further;
    // `bodySmall` the same for the small ones between crests)
    storm: { max: 60, weather: 0.84, apart: 6.5, apartLee: 9, reach: 190, lampClear: 9.5, arcs: [4, 7], per: [7, 5, 3], body: [10, 10, 8], bodySmall: [4, 5, 4], high: [3.0, 5.6], between: [1.2, 3.0], small: [0.45, 0.8], smallWithin: 115, side: 0.9, gain: 1.0 },
    within: 26, splashWithin: 30,      // metres from the boat within which a foot's spray strikes rings where it falls back; and within which its strike is told (for the `splash`)
    rings: [3, 8],              // rings to a strike, by how hard (one in five of its 16 to 40 flecks)
    // the wake's small spray on a rock the boat passes with way on: within so many metres; drops; how fast they leave (m/s: they rise 0.15 to 1.4 m);
    // the light its wash leaves along that stretch of waterline (an age in the trace: at ten metres, and so much more beside the hull), each dab's radius, and where along the waterline (m)
    wake: { within: 10, n: [12, 26], up: [2.0, 4.6], speedFrom: 0.7, light: [0.47, 0.12], radius: 0.7, along: [-2.1, -1.4, -0.7, 0, 0.7, 1.4, 2.1], lap: [-2.0, -1.3, -0.65, 0, 0.65, 1.3, 2.0] },      // (lap: where along the waterline its wash breaks, metres; every second one belongs to the second, slighter lap)
  },
};

export async function build(ctx, plan, shared) {
  const cast = shared.cast = shared.cast || {};
  const { kit, path } = ctx, sea = shared.sea, rocks = shared.rocks || {}, P = plan;
  const params = new URLSearchParams(location.search);
  const wantList = (params.get('edge') || '').split(',').filter(Boolean), want = (k) => !wantList.length || wantList.includes(k);
  const debug = params.has('edgedebug') || params.has('edgeprobe') ? {} : null;
  // (&edgetune=drips.dab.strength:0.5,floats.wash.gain:2 tries other numbers of EDGE without editing this file; a list as 1.8/4.9)
  for (const pair of (params.get('edgetune') || '').split(',').filter(Boolean)) {
    const [key, raw] = pair.split(':'), parts = (key || '').split('.'); let o = EDGE;
    while (parts.length > 1 && o) o = o[parts.shift()];
    if (o && raw !== undefined && parts[0] in o) o[parts[0]] = raw.includes('/') ? raw.split('/').map(Number) : (Number.isNaN(+raw) ? raw : +raw);
  }
  const tmp = {};
  const clamp01 = (v) => Math.min(1, Math.max(0, v)), lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };

  // ---- events: every sound this group will ever want has one, and nothing here plays it. edge.on('drop', fn) ...
  const listeners = {};
  const on = (name, fn) => { (listeners[name] || (listeners[name] = [])).push(fn); return edge; };
  const counts = {};                                                                      // (how often each has fired: &edgelog=<seconds> prints them)
  const fire = (name, a, b, c) => { counts[name] = (counts[name] || 0) + 1; const l = listeners[name]; if (l) for (const fn of l) fn(a, b, c); };
  let logAt = Number(params.get('edgelog') || 0);
  const edge = cast.edge = { on, numbers: EDGE };

  // ---- what the sea's light gives a shader of this module: its declarations (uniforms and the functions seaFront,
  // seaLee, seaSwellN, seaAge, seaNoise ...) and its uniforms, asked of shared.sea fresh (never copied from its file)
  const SX = sea ? sea.extend({}) : null;
  const SW = waterUniforms(ctx.engine).uSwell.value;                                     // the swell's three waves: kx, kz, phase, amplitude (the water keeps them)
  // the water's to-and-fro at a place, as the ribbons family has it (ribSurge): -1.25 .. 1.25 along the swell's way
  const surgeAt = (x, z, lag, out) => {
    let sx = 0, sz = 0, sum = 1e-4;
    for (const w of SW) { const kl = Math.hypot(w.x, w.y), a = w.w; if (kl > 1e-5) { const c = a * Math.cos(w.x * x + w.y * z - w.z - lag) / kl; sx += w.x * c; sz += w.y * c; sum += Math.abs(a); } }
    out.x = sx / sum * 1.25; out.z = sz / sum * 1.25; return out;
  };

  // the swell at a place as the sea's light has it (seaSwellN): how high it stands, -1..1 of its greatest height, `ago` seconds ago
  const OM = sea ? sea.uniforms.uSeaOmega.value : new THREE.Vector3(1, 1, 1), omega = [0, 0, 0];
  const swellN = (x, z, ago) => {
    omega[0] = OM.x; omega[1] = OM.y; omega[2] = OM.z;
    let h = 0, a = 1e-4;
    for (let i = 0; i < 3; i++) { const w = SW[i]; h += w.w * Math.cos(w.x * x + w.y * z - w.z + omega[i] * ago); a += w.w; }
    return h / a;
  };
  // how hard a crest was striking a place so many seconds ago: the water high there and still rising (the set's spray is thrown by the same rule)
  const strikeAt = (x, z, ago) => { const h = swellN(x, z, ago), was = swellN(x, z, ago + 0.6); return smooth(0.05, 0.5, h) * smooth(0, 0.2, h - was); };
  // Light written into the water's trace, on the area's own scale: a strength there is an AGE (0.6 new light, about 0.4
  // ember, under 0.3 a dark violet that is nearly gone; it fades evenly over 28 s). The Comets' group keeps the one
  // writer for the whole cast (shared.cast.seaLight: nothing while the sea does not answer, and it counts what the cast
  // asks of the water's 512 marks a frame); when it is not there the trace is written directly, the same way.
  const glowDab = (x, z, radius, age, soft = 0.7) => {
    const sl = cast.seaLight;
    if (sl && sl.dab) { sl.dab(x, z, radius, age, soft); return; }
    const tr = ctx.water.trace, a = sea ? sea.uniforms.uSeaL.value.y : 1;
    if (tr && tr.inject && a > 0.02) tr.inject(x, z, { channel: 'glow', radius: Math.max(0.3, radius), strength: Math.min(0.6, age) * a, soft });
  };
  const sh = ctx.engine.shared, fogU = { uFogColor: sh.uFogColor, uFogDensity: sh.uFogDensity, uVeil: sh.uVeil, uVeilColor: sh.uVeilColor };
  const uNow = { value: 0 };                                                              // the realm's own clock, for this module's shaders (it stops when the ride is paused)
  const hullOn = (x, z, margin = 0.25) => {                                               // is this place on the rider's own boat?
    const b = ctx.boat, fx = -Math.sin(b.heading), fz = -Math.cos(b.heading), qx = x - b.x, qz = z - b.z, t = Math.min(2.0, Math.max(-1.6, qx * fx + qz * fz));
    return Math.hypot(qx - fx * t, qz - fz * t) < 0.45 + margin;
  };

  // ============================================================================================== marks on the water
  // Two kinds of mark, one pooled mesh lying on the swell (one draw call, direct view only):
  //   a ring    as the sea's own answer to a raindrop is drawn (light.js, seaRings): a spark where the thing touched, and
  //             its ring as a broken hairline that cools from core through aqua to ember as it widens, with a slighter
  //             ring inside it; never thinner than the screen can draw (fainter instead). For what is a raindrop's size:
  //             a drip's pin, the ring where a spark of thrown water falls back.
  //   a wash    broken water round a thing that floats, in the sea's own flecks (light.js, surf: the same masks at the
  //             same scales, the same thresholds, the same colours by age), so that it cannot be told from the surf
  //             light the set lays round every foot: it runs out from the waterline, further along one stretch than the
  //             next, glitters, and dies speck by speck through ember and violet. Never a line: a ring of light drawn
  //             round a float or the buoy as a hairline was a hoop, an outline, which this sea's light never is.
  // (the set's readers of its masks, light.js SEA_INK, which it does not hand out: a mark's cover, its own threshold, its own phase;
  // how much of it shows at a cut; and the same in colour, each mark dying through ember and violet as its own threshold is reached)
  const EDGE_INK = /* glsl */`
        vec3 edgeMark(sampler2D t, vec2 uv) { vec4 m = texture2D(t, uv); float c = max(m.g, 0.004); return vec3(m.g, m.r / c, m.b / c); }
        float edgeLit(vec3 m, float cut) { return m.x * smoothstep(cut, cut + 0.14, m.y); }
        vec3 edgeInk(vec3 m, float cut, float a) { float mg = m.y - cut; return seaAge(a * (0.1 + 0.9 * smoothstep(0.02, 0.38, mg)), uSeaCore, uSeaAqua, uSeaEmber, uSeaDying) * (m.x * smoothstep(0.0, 0.14, mg)); }`;
  const marks = (() => {
    if (!SX) return { ring() {}, wash() {}, object: null };
    const N = 256, at = new Float32Array(N * 4), ringA = new Float32Array(N * 4), look = new Float32Array(N * 4);
    const geo = new THREE.InstancedBufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute([-1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1], 3)); geo.setIndex([0, 2, 1, 0, 3, 2]);
    const aAt = new THREE.InstancedBufferAttribute(at, 4), aRing = new THREE.InstancedBufferAttribute(ringA, 4), aLook = new THREE.InstancedBufferAttribute(look, 4);
    for (const a of [aAt, aRing, aLook]) a.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('aAt', aAt); geo.setAttribute('aRing', aRing); geo.setAttribute('aLook', aLook); geo.instanceCount = N;
    for (let i = 0; i < N; i++) at[i * 4 + 2] = -1e6;
    const mat = new THREE.ShaderMaterial({
      uniforms: { ...SX.uniforms, ...fogU, uNow },
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
      vertexShader: /* glsl */`
        uniform vec4 uSwell[3]; uniform float uNow; uniform vec3 uFogColor, uVeilColor; uniform float uFogDensity, uVeil;
        attribute vec4 aAt, aRing, aLook;      // x, z, born, seconds it lasts; radius at first and at last (m), how bold its line, its own number; gain, spark (a wash: how white-hot at first), how many rings, its kind (0 a ring, 1 a wash, 2 a fine wash)
        varying vec2 vP, vXZ; varying vec4 vK, vL; varying float vFog, vKind;
        void main() {
          float ph = (uNow - aAt.z) / max(aAt.w, 1e-3);
          vK = vec4(ph, aRing.x, aRing.y, aRing.z); vL = vec4(aLook.xyz, aRing.w);
          float size = aRing.y * 1.4 + 0.08; vKind = aLook.w;
          vec3 w = vec3(aAt.x + position.x * size, 0.0, aAt.y + position.z * size);
          float h = 0.0;                                     // it lies on the swell, as the water's own sheet does
          for (int i = 0; i < 3; i++) { float q = dot(uSwell[i].xy, w.xz) - uSwell[i].z, a = uSwell[i].w; h += a * cos(q) + 0.5 * length(uSwell[i].xy) * a * a * cos(2.0 * q); }
          w.y = h + 0.045;
          vP = position.xz * size; vXZ = w.xz;
          vec4 mv = viewMatrix * vec4(w, 1.0); float d = length(mv.xyz);
          vFog = (1.0 - (1.0 - exp(-uFogDensity * uFogDensity * d * d))) * (1.0 - uVeil);
          gl_Position = (ph <= 0.0 || ph >= 1.0) ? vec4(2.0, 2.0, 2.0, 1.0) : projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */`
        ${SX.fragmentPars}
        uniform float uNow;
        varying vec2 vP, vXZ; varying vec4 vK, vL; varying float vFog, vKind;
        ${EDGE_INK}
        void main() {
          float ph = vK.x, r = length(vP), bold = vK.w, seed = vL.w;
          vec2 u = vP / max(r, 1e-4), fa = dFdx(vP), fb = dFdy(vP);
          float px = max(length(fa), length(fb));                                        // metres of water under this pixel
          if (vKind > 0.5) {
            // ---- a wash: broken water round a thing that floats
            float r0 = vK.y, r1 = vK.z, fine = step(1.5, vKind);
            // its lip runs out fast and slows, further along one stretch of the waterline than the next (never a circle; read round the
            // circle itself, so that it has no seam)
            float lobes = 0.65 * seaNoise(u * 1.4 + seed * 31.0) + 0.35 * seaNoise(u * 3.6 + vec2(seed * 11.0, ph * 0.9));
            float run = 1.0 - (1.0 - ph) * (1.0 - ph);
            float lip = r0 + (r1 - r0) * (0.25 + 0.75 * run) * mix(0.4 + 1.05 * lobes, 0.75 + 0.4 * lobes, fine);
            float t = clamp((r - r0) / max(lip - r0, 0.03), 0.0, 1.0);
            float band = (1.0 - t) * (1.0 - t);                                          // strongest against the thing
            float inside = smoothstep(r0 - 0.12, r0 + 0.03, r) * (1.0 - smoothstep(0.78, 1.0, t));
            float E = clamp((0.34 + 0.9 * band) * inside * smoothstep(0.0, 0.07, ph) * pow(1.0 - ph, 1.4), 0.0, 1.0);
            if (E < 0.004) discard;
            float fresh = 1.0 - smoothstep(0.0, 0.4, ph);
            // the set's flecks, where the set lays them (the same masks at the same scales: light.js, surf)
            vec3 m1 = edgeMark(tSeaFleck, vXZ * 0.31 + 0.07), st = edgeMark(tSeaStip, vXZ * 0.75), st2 = edgeMark(tSeaStip, vXZ.yx * 0.31 + 0.5);
            float tw = 0.6 + 0.4 * sin(uNow * (1.3 + 3.2 * st.z) + st.z * 47.0), tw2 = 0.7 + 0.3 * sin(uNow * (0.9 + 2.0 * st2.z) + st2.z * 31.0);
            float dens = clamp(E * (0.45 + 1.3 * edgeLit(m1, 1.06 - E * 0.85) * (1.0 - fine)), 0.0, 1.0);
            float a = clamp(0.2 + 0.45 * E + 0.3 * fresh * band, 0.0, 0.92);
            vec3 wcol = edgeInk(st, 1.03 - 0.95 * dens, a) * (tw * (0.8 + 1.2 * E)) + edgeInk(st2, 1.08 - 0.92 * dens, a) * (0.6 * tw2) + edgeInk(m1, 1.06 - E * 0.85, a) * (0.12 * (1.0 - fine));
            wcol += uSeaCore * (vL.y * fresh * band * band * 1.4 * edgeLit(st, 0.45) * tw);
            // too far to tell marks apart: their sum, in a few short dashes with dark between (a soft patch of light is a lamp under the water)
            float dash = smoothstep(0.36, 0.62, seaNoise(vXZ * vec2(2.3, 2.9) + seed * 17.0)) * (0.55 + 0.45 * tw2);
            wcol = mix(wcol, seaAge(a, uSeaCore, uSeaAqua, uSeaEmber, uSeaDying) * (E * (0.12 + 1.25 * dash)), smoothstep(0.03, 0.16, px));
            wcol *= vL.x * vFog * uSeaL.y * seaLee(vXZ);
            if (dot(wcol, vec3(1.0)) < 0.003) discard;
            gl_FragColor = vec4(min(wcol, vec3(4.0)), 1.0);
            return;
          }
          float ang = atan(u.y, u.x);
          float rad = mix(vK.y, vK.z, 1.0 - (1.0 - ph) * (1.0 - ph));                    // it opens fast and slows
          // (a wide ring is never a hoop: it wanders a little in and out, and it is drawn in strokes with dry gaps, more of them the wider it is)
          float wide = smoothstep(0.25, 0.9, rad);
          rad *= 1.0 + wide * (0.035 * sin(3.0 * ang + seed * 50.0) + 0.025 * sin(5.0 * ang + seed * 90.0));
          float dry = mix(1.0, smoothstep(0.4, 0.6, seaNoise(vec2(ang * (1.6 + rad * 1.6) + seed * 31.0, seed * 7.0 + ph * 1.3))) * (0.4 + 0.6 * seaNoise(vec2(ang * 7.0 + seed * 3.0, 2.0))), wide);
          // a ring, not a curl: the whole circle but for one dry gap, a hairline all the way round (measured across the line as the
          // screen sees it), and a slighter ring inside it with its gap elsewhere
          vec2 n1 = vec2(cos(seed * 41.0), sin(seed * 41.0)), n2 = vec2(cos(seed * 97.0 + 1.3), sin(seed * 97.0 + 1.3));
          vec2 u2 = vec2(u.x * u.x - u.y * u.y, 2.0 * u.x * u.y);
          float arc = smoothstep(-1.22, -1.0, 0.7 * dot(u2, n1) + 0.6 * dot(u, n2)), arc2 = smoothstep(-1.22, -0.95, 0.7 * dot(u2, n2) - 0.6 * dot(u, n1));
          float wd = max(0.007 * bold, 0.7 * length(vec2(dot(u, fa), dot(u, fb))));
          float q = (r - rad) / wd, q2 = (r - 0.55 * rad) / wd, q3 = (r - 1.45 * rad) / wd;
          float born = smoothstep(0.0, 0.07, ph);
          float line = exp(-q * q) * arc + 0.55 * exp(-q2 * q2) * arc2 * smoothstep(0.15, 0.4, ph) * (1.0 - 0.75 * wide) + 0.4 * exp(-q3 * q3) * arc2 * step(1.5, vL.z) * smoothstep(0.1, 0.3, ph);
          line *= born * min(1.0, 0.012 * bold / wd) * dry;
          float fresh = line * (1.0 - ph) * (1.0 - ph), old = line * ph * (1.0 - ph) * 3.0;
          float sr = max(0.028 * bold, 1.1 * px);
          float spark = vL.y * (1.0 - smoothstep(0.55 * sr, sr, r)) * (1.0 - smoothstep(0.0, 0.3, ph)) * min(1.0, 0.0016 * bold * bold / (sr * sr));      // (a spark is a dab with an edge, not a glow)
          spark *= 0.5 + 0.5 * smoothstep(0.002, 0.012, px);                              // (beside the hull a spark is a hand across on the screen: white-hot there it is a lamp under the water)
          vec3 col = uSeaCore * (1.5 * spark + 1.0 * fresh) + uSeaAqua * (1.9 * fresh + 0.7 * old) + uSeaEmber * (3.4 * old);
          col *= vL.x * vFog * uSeaL.y * seaLee(vXZ) * (0.5 + 0.5 * smoothstep(0.002, 0.009, px));      // (a ring an arm's length from the eye is a hand wide on the screen: at full strength it and its bloom are a lamp in the water)
          if (dot(col, vec3(1.0)) < 0.003) discard;
          gl_FragColor = vec4(min(col, vec3(4.0)), 1.0);
        }`,
    });
    const mesh = new THREE.Mesh(geo, mat); mesh.name = 'edge marks (rings of light on the water)'; mesh.frustumCulled = false; mesh.renderOrder = 1;
    ctx.add(mesh); ctx.only(mesh, 'direct');
    let next = 0; const mrnd = ctx.rng(811);
    return {
      object: mesh, count: 0,
      /** A ring of light on the water at (x, z). o: r0, r1 (metres: where it starts and how wide it grows), life (s), bold (1 = a raindrop's line), gain, spark (0..1), rings (2: one more outside) */
      ring(x, z, o = {}) {
        const i = next; next = (next + 1) % N; this.count++;
        at.set([x, z, ctx.time + (o.delay || 0), o.life ?? 1.5], i * 4); ringA.set([o.r0 ?? 0.02, o.r1 ?? 0.15, o.bold ?? 1, mrnd()], i * 4); look.set([o.gain ?? 1, o.spark ?? 1, o.rings ?? 1, 0], i * 4);
        aAt.needsUpdate = aRing.needsUpdate = aLook.needsUpdate = true;
      },
      /**
       * Broken water round a thing at (x, z), in the sea's own flecks. o: r0 (metres: the thing's waterline), r1 (how far it runs out
       * at most), life (s), gain, core (0..1: how white-hot against the thing in its first moments), fine (true: specks only, tight
       * to the thing: iron shivering the water it stands in), delay (s)
       */
      wash(x, z, o = {}) {
        const i = next; next = (next + 1) % N; this.washes = (this.washes || 0) + 1;
        at.set([x, z, ctx.time + (o.delay || 0), o.life ?? 2], i * 4); ringA.set([o.r0 ?? 0.15, o.r1 ?? 0.9, 1, mrnd()], i * 4); look.set([o.gain ?? 1, o.core ?? 0.5, 1, o.fine ? 2 : 1], i * 4);
        aAt.needsUpdate = aRing.needsUpdate = aLook.needsUpdate = true;
      },
    };
  })();

  // ============================================================================================== sparks
  // Thrown water, pooled (the page's 2,400): drops a finger wide that rise, hang and fall back into the sea as sparks,
  // drawn as the set's own spray draws its flecks (light.js, spray: the same size rule, the same colours by age, paint
  // and not added light), so that the two cannot be told apart. The set's spray is thrown by every crest at every
  // foot; this pool is for what that does not throw: behind the rain front, the storm's own water at the weather feet,
  // in sheets and arcs (sparks.sheet: its drops keep their width far off, so that a sheet thrown at the Prow carries to
  // the middle of the sound); the wake's small spray on a rock the boat passes; the crown where a drip lands; a float
  // knocked aside; and whatever staging asks for (edge.spray.burst). One in five that falls back near the boat strikes a ring.
  const sparks = (() => {
    if (!SX) return { toss() {}, sheet() {}, object: null, landings: [] };
    const N = EDGE.spray.pool, G = 7.5, org = new Float32Array(N * 4), vel = new Float32Array(N * 4), sd = new Float32Array(N * 4);
    const geo = new THREE.InstancedBufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, 0, 0.5, 0, 0, 0.5, 1, 0, -0.5, 1, 0], 3)); geo.setIndex([0, 1, 2, 0, 2, 3]);
    const aOrg = new THREE.InstancedBufferAttribute(org, 4), aVel = new THREE.InstancedBufferAttribute(vel, 4), aSd = new THREE.InstancedBufferAttribute(sd, 4);
    for (const a of [aOrg, aVel, aSd]) a.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('aOrg', aOrg); geo.setAttribute('aVel', aVel); geo.setAttribute('aSd', aSd); geo.instanceCount = N;
    for (let i = 0; i < N; i++) org[i * 4 + 3] = -1e6;
    const uni = { ...SX.uniforms, ...fogU, uNow, uPixel: { value: 0.0012 }, uSparkG: { value: G } };
    const mat = new THREE.ShaderMaterial({
      uniforms: uni, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false,
      blending: THREE.CustomBlending, blendEquation: THREE.MaxEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
      blendEquationAlpha: THREE.AddEquation, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneFactor,
      vertexShader: /* glsl */`
        uniform vec4 uSwell[3]; uniform float uNow, uPixel, uSparkG; uniform vec3 uFogColor, uVeilColor; uniform float uFogDensity, uVeil;
        attribute vec4 aOrg, aVel, aSd;      // where and when it was thrown; its speed (m/s) and the seconds it lasts at most; its own number, its strength, how well it keeps its width far off (0 a drop .. 1 the storm's), 1 = a puff of a sheet's body
        varying vec2 vUv; varying vec3 vA, vCol; varying float vBody, vAge; varying vec4 vPuff;
        void main() {
          float age = uNow - aOrg.w, life = aVel.w; vAge = age; vCol = vec3(0.0);
          vec3 pos = vec3(aOrg.x + aVel.x * age, aOrg.y + aVel.y * age - 0.5 * uSparkG * age * age, aOrg.z + aVel.z * age);
          float h = 0.0;
          for (int i = 0; i < 3; i++) { float q = dot(uSwell[i].xy, pos.xz) - uSwell[i].z, a = uSwell[i].w; h += a * cos(q) + 0.5 * length(uSwell[i].xy) * a * a * cos(2.0 * q); }
          float alive = step(0.0, age) * step(age, life) * step(h - 0.05, pos.y) * smoothstep(0.0, 0.06, age);
          vec4 mv = viewMatrix * vec4(pos, 1.0);
          vec3 vv = mat3(viewMatrix) * vec3(aVel.x, aVel.y - uSparkG * age, aVel.z);
          vec2 d2 = normalize(vv.xy + vec2(1e-4, 0.0));
          // (a finger's width at most; never thinner than the screen can draw: fainter instead. The storm's water is thrown in gouts: far
          // off each keeps two pixels and most of its strength, so that a sheet of it is a body of thrown water and not a sprinkle of dust)
          // (its own number below nought: a droplet, three to six millimetres: what a drip's crown throws up beside the hull. At a finger's
          // width those were marbles: sea_e4_d01_f11.png)
          float dist = length(mv.xyz), sz = aSd.x < 0.0 ? 0.003 - 0.0035 * aSd.x : 0.012 + 0.022 * aSd.x * aSd.x, wpx = max(sz, mix(1.3, 1.45 + 0.55 * max(aSd.x, 0.0), aSd.z) * dist * uPixel);
          float len = wpx * (1.0 + min(length(vv.xy) * 0.22, 2.4));                      // drawn out along its flight
          float fogK = (1.0 - (1.0 - exp(-uFogDensity * uFogDensity * dist * dist))) * (1.0 - uVeil);
          vBody = step(0.5, aSd.w); vPuff = vec4(0.0);
          vUv = vec2(position.x * 2.0, position.y);
          if (vBody > 0.5) {
            // A TONGUE of a sheet's body (fourth holder; it was a puff, an oval patch of marks that flew up whole: from twenty metres a
            // pale bush standing in the sea, sea_e4_k17_f05.png). Water thrown up a rock's foot stands from the waterline to its head
            // while it climbs, a stride wide where it leaves the sea and wider and torn above; it hangs, and comes apart from its head
            // down as it falls back. So: one upright strip from where the sea stands NOW to the head's own height (thrown, then gravity
            // has it), in the sea's own marks, drawn out along the throw while it climbs. The marks are read at a scale that keeps each
            // a few pixels wherever it is seen from, as before.
            float tUp = max(aVel.y, 0.2) / uSparkG, rise = age / tUp;                        // 0 as it leaves the sea .. 1 at its height .. 2 back in it
            float head = max(aVel.y * age - 0.5 * uSparkG * age * age, 0.0);
            float Wf = (1.25 + 1.35 * aSd.x) * (0.8 + 0.25 * min(rise, 2.0)), colH = head + 0.3 + 0.2 * Wf;
            mv = viewMatrix * vec4(pos.x, h - 0.2, pos.z, 1.0); dist = length(mv.xyz);
            fogK = (1.0 - (1.0 - exp(-uFogDensity * uFogDensity * dist * dist))) * (1.0 - uVeil);
            vec2 q = vec2(position.x * Wf, position.y * colH);
            mv.xy += q;
            vPuff = vec4(q, dist * uPixel, fract(aSd.x * 17.0 + aOrg.w * 0.31) * 9.0);      // (z: metres of it under one pixel)
            vCol = vec3(colH, rise, Wf);
            alive = step(0.0, age) * step(age, life);
            vA = vec3(alive * aSd.y, age / max(life, 1e-3), fogK);
          } else {
            mv.xy += d2 * ((position.y - 0.5) * len * 2.0) + vec2(-d2.y, d2.x) * (position.x * wpx * 2.0);
            vA = vec3(alive * mix(sqrt(sz / wpx), 1.0, 0.75 * aSd.z) * aSd.y, age / max(life, 1e-3), fogK);
          }
          gl_Position = alive < 0.5 ? vec4(2.0, 2.0, 2.0, 1.0) : projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */`
        ${SX.fragmentPars}
        varying vec2 vUv; varying vec3 vA, vCol; varying float vBody, vAge; varying vec4 vPuff;
        ${EDGE_INK}
        void main() {
          vec2 e = vec2(vUv.x, (vUv.y - 0.5) * 2.0);
          if (vBody > 0.5) {
            // a tongue of thrown water in the sea's own marks: crowded where it leaves the sea, single at its head, never an outline;
            // white-hot at its foot while it climbs, aqua above, ember and violet as it falls back, each mark going out in its own time
            // (never above white: no lamp)
            float colH = max(vCol.x, 1e-3), rise = vCol.y, v = clamp(vPuff.y / colH, 0.0, 1.0), x = vPuff.x / (0.5 * vCol.z);
            float n1 = seaNoise(vec2(v * 2.3 + vPuff.w * 3.1, vPuff.w)), n2 = seaNoise(vec2(x * 1.7 + vPuff.w, v * 4.0 - rise * 1.5));
            // (broad where it leaves the sea, so that the tongues of one sheet stand shoulder to shoulder there as one wall of broken water;
            // above, each narrows to a finger of its own, no two alike, each leaning its own way. A row of even columns is a row of fountains)
            float farK = smoothstep(0.035, 0.085, vPuff.z);                                // 0 close to .. 1 from across the sound
            // (from across the sound a finger a forearm wide is lost among the rain, and the sheet is seen at half its height: there it
            // keeps more of its width and of its body to its head)
            float halfW = mix(1.0, mix(0.42, 0.8, farK), smoothstep(0.08, 0.85, v)) * (0.75 + 0.45 * n1);
            float edge = abs(x + (n1 - 0.5) * 0.7 * v) / halfW;
            float body = (1.0 - smoothstep(0.42, 1.0, edge)) * (1.0 - mix(0.65, 0.3, farK) * v) * (1.0 - smoothstep(mix(0.8, 0.9, farK), 1.0, v + 0.3 * (n2 - 0.5)));
            body *= smoothstep(0.0, 0.16, vPuff.y - 0.1 - 0.24 * seaNoise(vec2(vPuff.x * 2.3 + vPuff.w * 5.0, 0.5)));      // (its foot is in the sea: ragged, never a ruled line along the water)
            float fall = smoothstep(1.0, 2.0, rise);                                         // (falling, it comes apart from its head down)
            float dens = body * smoothstep(0.0, 0.1, rise) * (1.0 - 0.8 * fall * (0.35 + 0.65 * v)) * (1.0 - smoothstep(1.6, 2.05, rise)) * smoothstep(0.1, 0.8, vA.x);      // (a slight one is thin: marks standing apart, no heart)
            if (dens < 0.01 || vA.x < 0.01) discard;
            // (its marks drawn out along the throw while it climbs, and carried up with it; drops again as it falls)
            // (a mark keeps a few pixels far off; near the eye it is smaller in the world too, down to a hand: at a forearm each, a sheet ten
            // metres off was a stand of leaves, sea_e4_s14_f04.png)
            vec2 uv = vec2(vPuff.x, (vPuff.y - 0.65 * (colH - 0.3)) * mix(0.36, 0.8, fall)) * (0.56 * clamp(0.05 / max(vPuff.z, 1e-4), 0.0, 2.7)) + vec2(vPuff.w, vPuff.w * 0.618);
            dens = min(1.0, dens * (1.0 + 0.5 * farK));
            vec3 m1 = edgeMark(tSeaFleck, uv), m2 = edgeMark(tSeaStip, uv * 2.4 + 0.37);
            float heat = clamp(1.15 - 0.5 * v - 0.55 * max(rise - 0.8, 0.0), 0.0, 1.0), cut = 1.06 - dens;
            vec3 pc = edgeInk(m1, cut, heat) + edgeInk(m2, cut + 0.1, heat) * 0.7;
            float mk = max(edgeLit(m1, cut), 0.8 * edgeLit(m2, cut + 0.1)), shw = vA.z * uSeaL.y;
            // (at its foot, while it climbs, the marks crowd: two more lays of them, larger and across the first, so that they touch and
            // run together there. Never a filled shape: a tongue filled to an edge of its own is a tent, or a lamp)
            float crowd = smoothstep(0.4, 0.8, dens) * (1.0 - smoothstep(0.9, 1.5, rise));
            if (crowd > 0.01) {
              vec3 m3 = edgeMark(tSeaFleck, uv.yx * 0.63 + 0.61), m4 = edgeMark(tSeaFleck, vec2(uv.x + uv.y, uv.y - uv.x) * 0.93 + 0.23);
              float c3 = 1.0 - 0.95 * crowd;
              pc = max(pc, max(edgeInk(m3, c3, heat), edgeInk(m4, c3 + 0.08, heat)));
              mk = max(mk, max(edgeLit(m3, c3), edgeLit(m4, c3 + 0.08)));
              // (from across the sound a mark is a pixel or two and a hundred of them are lost: there the crowded heart of a new puff is
              // their sum, pale, torn at its edge by the marks themselves; it must carry at seventy metres what the strokes carry at ten)
              float sum = farK * smoothstep(0.35, 0.7, crowd) * smoothstep(0.2, 0.5, max(max(m1.x, m2.x), max(m3.x, m4.x)) + 0.4 * (seaNoise(vPuff.xy / max(vPuff.z, 1e-4) * 0.33 + vPuff.w) - 0.5));
              pc = max(pc, mix(uSeaAqua * 0.95, uSeaCore * 0.9, 0.62 * smoothstep(0.5, 1.0, heat)) * sum); mk = max(mk, sum);
            }
            gl_FragColor = vec4(min(pc, vec3(0.96)) * (vA.x * shw), -15.5 * step(0.3, mk * vA.x) * step(0.3, shw));
            return;
          }
          float shape = 1.0 - smoothstep(0.45, 1.0, length(e));
          float a = clamp(1.0 - vA.y * 1.1, 0.0, 1.0);                                   // new .. spent
          vec3 hot = mix(uSeaAqua * 1.25, uSeaCore * 1.15, smoothstep(0.75, 1.0, a));
          vec3 col = mix(uSeaEmber * 2.4, hot, smoothstep(0.15, 0.5, a)) * (shape * vA.x);
          float show = vA.z * uSeaL.y;
          gl_FragColor = vec4(col * show, -15.5 * step(0.25, shape * vA.x) * step(0.3, show));      // (the painter's own mark for "leave this as drawn", as the set's spray writes it)
        }`,
    });
    const mesh = new THREE.Mesh(geo, mat); mesh.name = 'edge sparks (thrown water, pooled)'; mesh.frustumCulled = false; mesh.renderOrder = 2;
    const size2 = new THREE.Vector2();
    mesh.onBeforeRender = (renderer, scene, camera) => { const rt = renderer.getRenderTarget(), hh = rt ? rt.height : renderer.getDrawingBufferSize(size2).y; uni.uPixel.value = 2 / (camera.projectionMatrix.elements[5] * Math.max(1, hh)); mat.uniformsNeedUpdate = true; };
    ctx.add(mesh); ctx.only(mesh, 'direct');
    let next = 0; const srnd = ctx.rng(907), landings = [];
    return {
      object: mesh, count: 0, landings,
      /**
       * Throw `n` drops from (x, y, z). o: up [lo, hi] m/s, out [lo, hi] m/s along (nx, nz) (default: all round), spread (m/s to
       * either side), gain, ring (the share of them that strike a ring where they fall back: 0.2), level: the height they fall back to
       */
      toss(x, y, z, n, o = {}) {
        const up = o.up || [1.5, 3.5], out = o.out || [0, 0.8], spread = o.spread ?? 0.8, share = o.ring ?? 0.2, level = o.level ?? y, t0 = ctx.time + (o.delay || 0);
        for (let k = 0; k < n; k++) {
          const i = next; next = (next + 1) % N; this.count++;
          const vy = lerp(up[0], up[1], srnd()), vo = lerp(out[0], out[1], srnd()), ang = srnd() * 6.2832, side = (srnd() - 0.5) * 2 * spread;
          let vx, vz;
          if (o.nx != null) { vx = o.nx * vo - o.nz * side; vz = o.nz * vo + o.nx * side; } else { vx = Math.cos(ang) * vo; vz = Math.sin(ang) * vo; }
          const T = (vy + Math.sqrt(Math.max(0, vy * vy + 2 * G * (y - level)))) / G;       // seconds until it is back at the water
          org.set([x, y, z, t0], i * 4); vel.set([vx, vy, vz, T + 0.3], i * 4); sd.set([o.fine ? -(0.2 + 0.8 * srnd()) : srnd(), (o.gain ?? 1) * (0.7 + 0.3 * srnd()), o.big ?? 0, 0], i * 4);      // (fine: droplets, a few millimetres: a crown beside the hull is not a handful of marbles)
          if (srnd() < share) landings.push({ t: t0 + T, x: x + vx * T, z: z + vz * T, k: o.gain ?? 1 });
        }
        aOrg.needsUpdate = aVel.needsUpdate = aSd.needsUpdate = true;
      },
      /**
       * A sheet of thrown water from a stretch of waterline at (x, y, z): `arcs` gouts, each a string of `per` drops thrown one way
       * at different speeds, so that it draws out into an arc as it rises, hangs and falls back. o: nx, nz (the way out from the
       * rock), high [lo, hi] (metres the gouts rise), along (metres of waterline either side), lean (how far a gout may lean along
       * the rock, 0..1), wind [x, z] (m/s: the weather carries it), gain, big (0..1: how well its drops carry far off), ring (the
       * share that strike a ring where they fall back: 0 far from the boat), level (the height they fall back to), delay
       */
      sheet(x, y, z, o = {}) {
        const now = ctx.time; for (let k = 0, n = (o.arcs ?? 5) * (o.per ?? 8) + (o.body ?? 0); k < n; k += 8) { const j = ((next + k) % N) * 4; if (org[j + 3] + vel[j + 3] > now + 0.25 && org[j + 3] > -1e5) this.cut = (this.cut || 0) + 8; }      // (drops this sheet takes back out of the air before they have fallen: the pool is too small if this counts up)
        const arcs = o.arcs ?? 5, per = o.per ?? 8, high = o.high || [2, 4.5], along = o.along ?? 1.6, lean = o.lean ?? 0.45, wind = o.wind || [0, 0];
        const nx = o.nx ?? 0, nz = o.nz ?? 0, level = o.level ?? y, share = o.ring ?? 0, gain = o.gain ?? 1, t0 = ctx.time + (o.delay || 0);
        for (let a = 0; a < arcs; a++) {
          const off = (srnd() - 0.5) * 2 * along, outK = 0.08 + 0.3 * srnd(), tanK = (srnd() - 0.5) * 2 * lean, dl = Math.hypot(1, outK, tanK);
          const dx = (nx * outK - nz * tanK) / dl, dy = 1 / dl, dz = (nz * outK + nx * tanK) / dl;      // the way this gout is thrown
          const top = Math.sqrt(2 * G * lerp(high[0], high[1], srnd())) / dy, when = t0 + 0.25 * srnd(), size = srnd();
          for (let k = 0; k < per; k++) {
            const i = next; next = (next + 1) % N; this.count++;
            // (each drop of a gout at its own speed, most of them slow: thick low down, single at its head; and a little off its line, or it is a ruled row of beads)
            const v = top * (0.3 + 0.7 * Math.pow(srnd(), 0.75)), vx = dx * v + wind[0] + (srnd() - 0.5) * 0.7, vy = dy * v, vz = dz * v + wind[1] + (srnd() - 0.5) * 0.7;
            const T = (vy + Math.sqrt(Math.max(0, vy * vy + 2 * G * (y - level)))) / G;
            org.set([x - nz * off + nx * 0.1, y, z + nx * off + nz * 0.1, when + 0.1 * srnd()], i * 4); vel.set([vx, vy, vz, T + 0.3], i * 4);
            sd.set([0.25 + 0.75 * size * srnd(), gain * (0.65 + 0.35 * srnd()), o.big ?? 1, 0], i * 4);
            if (share > 0 && srnd() < share) landings.push({ t: when + T, x: x - nz * off + vx * T, z: z + nx * off + vz * T, k: gain });
          }
        }
        // (the body of the sheet: puffs of marks that leave the whole stretch while the crest is on it, the first of them the fastest, so
        // that for most of a second new water stands at the waterline under what has already risen; highest in the middle of the
        // stretch; the gouts above are its fingers)
        for (let k = 0, n = o.body ?? 0; k < n; k++) {
          const i = next; next = (next + 1) % N; this.count++;
          // (all along the stretch, one after another as the crest runs down it; most of them thrown low, and those stand at the waterline
          // for a second while the few thrown high rise out of them; highest toward the middle of the stretch)
          // (a tongue stands from the sea to its head: its speed up is its height; it is back in the sea after twice its climb, and gone)
          const u = ((k + srnd()) / n) * 2 - 1, off = u * 1.15 * along, hk = Math.pow(srnd(), 0.6);
          const vy = Math.sqrt(2 * G * lerp(0.55 * high[0], high[1], hk) * (1 - 0.4 * u * u)), vo = 0.1 + 0.5 * srnd(), vt = (srnd() - 0.5) * 0.7;
          const vx = nx * vo - nz * vt + 0.6 * wind[0], vz = nz * vo + nx * vt + 0.6 * wind[1], T = 2.1 * vy / G;
          org.set([x - nz * off + nx * 0.25, y - 0.1, z + nx * off + nz * 0.25, t0 + 0.14 * (u + 1) + 0.2 * srnd()], i * 4); vel.set([vx, vy, vz, T], i * 4);
          sd.set([srnd() * (o.puff ?? 1), (o.thin ?? 1) * gain * (0.75 + 0.25 * srnd()), 1, 1], i * 4);      // (puff: how large its puffs may be, 0..1; thin: how crowded, 0.4 thin .. 1)
        }
        // (and the broken water it rises from: low drops all along that stretch of waterline)
        for (let k = 0, n = o.skirt ?? Math.round(arcs * 2.5); k < n; k++) {
          const i = next; next = (next + 1) % N; this.count++;
          const off = (srnd() - 0.5) * 2.4 * along, vy = Math.sqrt(2 * G * lerp(0.25, 0.3 * high[1] + 0.3, srnd())), vo = 0.2 + 1.3 * srnd(), vt = (srnd() - 0.5) * 1.6;
          const vx = nx * vo - nz * vt + wind[0], vz = nz * vo + nx * vt + wind[1], T = (vy + Math.sqrt(Math.max(0, vy * vy + 2 * G * (y - level)))) / G;
          org.set([x - nz * off + nx * 0.1, y, z + nx * off + nz * 0.1, t0 + 0.4 * srnd()], i * 4); vel.set([vx, vy, vz, T + 0.3], i * 4);
          sd.set([srnd(), gain * (0.6 + 0.4 * srnd()), o.big ?? 1, 0], i * 4);
        }
        aOrg.needsUpdate = aVel.needsUpdate = aSd.needsUpdate = true;
      },
    };
  })();
  // a spark that falls back strikes a ring: one ripple, one small ring of light (never on the rider's own boat)
  const landSparks = (c) => {
    const L = sparks.landings;
    for (let i = L.length - 1; i >= 0; i--) {
      const e = L[i]; if (e.t > c.time) continue;
      L.splice(i, 1);
      if (hullOn(e.x, e.z)) continue;
      c.water.ripple(e.x, e.z, 0.12, 0.14);
      marks.ring(e.x, e.z, { r0: 0.02, r1: 0.1 + 0.08 * Math.min(1, e.k), life: 1.1, bold: 0.9, gain: 0.55 + 0.35 * Math.min(1, e.k), spark: 0.8 });
    }
    if (L.length > 400) L.splice(0, L.length - 400);
  };

  // ============================================================================================== kelp
  // The ribbons family's kelp (docs/life/ribbons.md): a holdfast, a short stalk, a strap of blade with a quarter twist,
  // limp; every surge throws it flat one way and then the other, the tip a fifth of a period late, and the hull parts
  // it. What this module adds to it, at the places where gouache takes an extension (its markers are still in the
  // family's shader text):
  //   - it grows on THIS rock: every frond is rooted on a wall or a ledge that stands at its bed, and is never thrown
  //     behind the wall it grows on (it lies against it);
  //   - its light is the area's: marks of paint (shared.sea.fleck) along its edges at each reversal, each lighting at its
  //     own level and cooling through ember and violet as it goes out; where the hull parts it while the boat moves;
  //     where the water over it is stirred. Nothing at rest, never an outline;
  //   - a frilled edge; and it stands in the night as rock does: dark, lit by the lantern and the kept lamp only.
  let kelp = null;
  if (want('kelp') && sea && rocks.kelpBeds && rocks.kelpBeds.length) {
    const K = EDGE.kelp, rnd = ctx.rng(5231), dens = (ctx.quality && ctx.quality.density) || 1;
    // -- where rock stands at each bed. Each bed is a grid of half-metre cells; every copy of the kit's columns, steps,
    // drums and reefs that stands near it is laid into the grid as a box (its own, turned and leaning as it stands):
    // `thru` is how high the rock stands over a cell where it comes through the troughs, `ledge` the top of rock that
    // ends under them. (Boxes, not triangles: a holdfast a hand off its rock is not seen through dark water; one in open
    // water is.)
    const CELL = 0.5, HALF = Math.ceil((K.reach + 0.95 * K.len[1] + 0.5) / CELL), SIDE = 2 * HALF + 1, NONE = -99;      // (the grid reaches as far as a frond rooted at a bed's rim can be thrown)
    const sw0 = (P.water && P.water.swellDir) || [1, 0], swl = Math.hypot(sw0[0], sw0[1]) || 1, swx = sw0[0] / swl, swz = sw0[1] / swl;      // the way the swell runs: fronds are thrown along it, to and fro
    const beds = rocks.kelpBeds.map(([x, z]) => ({ x, z, thru: new Float32Array(SIDE * SIDE).fill(NONE), ledge: new Float32Array(SIDE * SIDE).fill(NONE), roots: [], boxes: 0 }));
    const isRock = (o) => { for (let p = o; p; p = p.parent) { const n = p.name || ''; if (/^(near:|steps:|reef:|drums:|columns:)/.test(n)) return !/\((from afar|coarse)\)/.test(n); } return false; };
    const M = new THREE.Matrix4(), MW = new THREE.Matrix4(), INV = new THREE.Matrix4(), v = new THREE.Vector3();
    ctx.group.updateMatrixWorld(true);
    const toLocal = new THREE.Matrix4().copy(ctx.group.matrixWorld).invert();
    ctx.group.traverse((o) => {
      if (!o.isInstancedMesh || !o.geometry || !isRock(o)) return;
      if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
      const bb = o.geometry.boundingBox; MW.multiplyMatrices(toLocal, o.matrixWorld);
      for (let i = 0; i < o.count; i++) {
        o.getMatrixAt(i, M); M.premultiply(MW);
        let top = -1e9, x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9, inv = false;
        for (let c = 0; c < 8; c++) { v.set(c & 1 ? bb.max.x : bb.min.x, c & 2 ? bb.max.y : bb.min.y, c & 4 ? bb.max.z : bb.min.z).applyMatrix4(M); top = Math.max(top, v.y); x0 = Math.min(x0, v.x); x1 = Math.max(x1, v.x); z0 = Math.min(z0, v.z); z1 = Math.max(z1, v.z); }
        const thru = top > -1.05, yAt = thru ? -1.0 : top - 0.05;                           // (a leaning column is read where it meets the sea, not at its head)
        for (const b of beds) {
          const G = HALF * CELL;
          if (x1 < b.x - G || x0 > b.x + G || z1 < b.z - G || z0 > b.z + G) continue;
          if (!inv) { INV.copy(M).invert(); inv = true; }
          b.boxes++;
          const i0 = Math.max(0, Math.ceil((x0 - b.x) / CELL) + HALF), i1 = Math.min(SIDE - 1, Math.floor((x1 - b.x) / CELL) + HALF), j0 = Math.max(0, Math.ceil((z0 - b.z) / CELL) + HALF), j1 = Math.min(SIDE - 1, Math.floor((z1 - b.z) / CELL) + HALF);
          for (let j = j0; j <= j1; j++) for (let ii = i0; ii <= i1; ii++) {
            v.set(b.x + (ii - HALF) * CELL, yAt, b.z + (j - HALF) * CELL).applyMatrix4(INV);
            if (v.x < bb.min.x || v.x > bb.max.x || v.z < bb.min.z || v.z > bb.max.z || v.y < bb.min.y || v.y > bb.max.y) continue;
            const g = thru ? b.thru : b.ledge, k = j * SIDE + ii; if (top > g[k]) g[k] = top;
          }
        }
      }
    });
    const skerryBed = shared.heroes && shared.heroes.skerry && shared.heroes.skerry.kelp;
    let total = 0;
    for (const [bi, b] of beds.entries()) {
      const rock = (i, j) => (i < 0 || j < 0 || i >= SIDE || j >= SIDE ? false : b.thru[j * SIDE + i] > NONE);
      // the skerry is one modelled piece (no copies to read): its ledge's edge is the plan's line, and its rock goes down 2.2 m
      const onSkerry = skerryBed && Math.hypot(skerryBed.x - b.x, skerryBed.z - b.z) < 6;
      // (in the lee round the kept lamp its amber stroke lies on this water: weed lying awash there would cut it in pieces, so here it keeps under the surface)
      const lampAt = P.lamp ? kit.at(P.lamp.at[0], P.lamp.at[1]) : null, inLee = !!lampAt && Math.hypot(lampAt.x - b.x, lampAt.z - b.z) < 16;
      const cand = [];                                                                    // [{ x, y, z, nx, nz, wall, deep }]
      if (onSkerry && P.skerry && P.skerry.ledge) {
        const L = P.skerry.ledge;
        for (let s = L.s[0] + 0.3; s < L.s[1]; s += 0.45) { const p = kit.at(s, L.d[0] - 0.06), f = path.at(s, tmp); cand.push({ x: p.x, z: p.z, nx: -f.rx, nz: -f.rz, wall: true, deep: 2.0 }); }
      } else for (let j = 0; j < SIDE; j++) for (let i = 0; i < SIDE; i++) {
        const x = b.x + (i - HALF) * CELL, z = b.z + (j - HALF) * CELL;
        if (Math.hypot(x - b.x, z - b.z) > K.reach || rock(i, j)) continue;
        const h = b.ledge[j * SIDE + i];
        if (h > -6.2 && h < -1.1) { cand.push({ x, y: h + 0.02, z, nx: 0, nz: 0, wall: false }); continue; }      // a ledge under the troughs: a holdfast on its top
        if (h > NONE) continue;
        // open water beside rock that stands through the surface: a holdfast on the wall between them
        let nx = 0, nz = 0, n = 0;
        for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) if (rock(i + di, j + dj)) { nx -= di; nz -= dj; n++; }
        if (!n || (nx === 0 && nz === 0)) continue;
        const l = Math.hypot(nx, nz); nx /= l; nz /= l;
        cand.push({ x: x - nx * 0.3, z: z - nz * 0.3, nx, nz, wall: true, deep: 9 });
      }
      // a ledge's way out to open water: away from the nearest wall cell's rock (so that it is not thrown into what rises behind it)
      const walls = cand.filter((c) => c.wall);
      for (const c of cand) if (!c.wall && walls.length) { let best = null, bd = 1e9; for (const w of walls) { const d = (w.x - c.x) * (w.x - c.x) + (w.z - c.z) * (w.z - c.z); if (d < bd) { bd = d; best = w; } } c.nx = best.nx; c.nz = best.nz; }
      if (!cand.length) { console.warn(`sea/cast_edge: no rock found for kelp bed ${bi} at (${b.x.toFixed(1)}, ${b.z.toFixed(1)}): it is left bare`); continue; }
      // 75 fronds to a bed, in clumps: a holdfast carries one to five fronds
      const per = Math.round(P.kelp.fronds / P.kelp.beds);
      // A frond is thrown flat along the swell's way, one way and then the other (thrown at its own wall it comes back off it), and it
      // knows no rock but that wall: so it grows only where both ways are clear of everything else that stands through the surface (a
      // stump, a fallen drum, the next column's shoulder), or it is cut to the clear water it has. (A frond through a stump is a broken
      // thing, and the gate's left bed stands among nine of them.)
      const clear = (x, z, dx, dz, most) => { for (let t = 0.8; t <= most; t += 0.25) if (rock(Math.round((x + dx * t - b.x) / CELL) + HALF, Math.round((z + dz * t - b.z) / CELL) + HALF)) return t - 0.4; return most; };
      for (let k = 0; k < per; k++) {
        let c = null, len = 0, lie = [0, 0], fan = 0;
        for (let tries = 0; tries < 28; tries++) {
          const c1 = cand[Math.floor(rnd() * cand.length)], want = lerp(K.len[0], K.len[1], rnd());
          let room = want * 0.92;                                                         // (metres it lies out from its root when it is thrown flat)
          // (thrown at its own wall it turns and lies ALONG the foot, the way the water itself turns there: to the side the swell
          // carries it, or, where the wall stands square to the swell, to a side of its own)
          const tx = -c1.nz, tz = c1.nx, inS = -Math.sign(swx * c1.nx + swz * c1.nz) || 1, along = (swx * tx + swz * tz) * inS;
          const side = Math.abs(along) > 0.25 ? Math.sign(along) : (rnd() < 0.5 ? -1 : 1), lie1 = [tx * side, tz * side];
          // (its own way: the surge's, turned a little; and where that way runs at its wall, the way the shader turns it there: along the
          // foot and a little off it. The two lies tried here are the two the frond will be thrown in: KELP_TURN, below)
          const fan1 = (rnd() - 0.5) * K.fan, cf = Math.cos(fan1), sf = Math.sin(fan1);
          for (const sgn of [1, -1]) {
            const dx = (swx * cf - swz * sf) * sgn, dz = (swx * sf + swz * cf) * sgn, into = -(dx * c1.nx + dz * c1.nz);
            if (into > 0 && (c1.nx !== 0 || c1.nz !== 0)) {
              const st = dx * lie1[0] + dz * lie1[1]; let ex = lie1[0] * (st + 0.95 * into) + c1.nx * 0.18 * into, ez = lie1[1] * (st + 0.95 * into) + c1.nz * 0.18 * into; const el = Math.hypot(ex, ez) || 1; ex /= el; ez /= el;
              room = Math.min(room, clear(c1.x + c1.nx * 0.3, c1.z + c1.nz * 0.3, ex, ez, want * 0.92));
            } else room = Math.min(room, clear(c1.x, c1.z, dx, dz, want * 0.92));
          }
          if (room / 0.92 > len) { c = c1; len = room / 0.92; lie = lie1; fan = fan1; }
          if (len >= Math.min(want, K.len[0])) break;
        }
        if (len < 1.2) { b.cut = (b.cut || 0) + 1; continue; }                             // (no clear water for it anywhere it was tried: left out)
        if (len < K.len[0]) b.short = (b.short || 0) + 1;
        const y = c.wall ? -lerp(K.depth[0], Math.min(K.depth[1], c.deep), Math.pow(rnd(), 1.4)) : c.y;
        const out = c.wall ? 0.55 + 0.3 * rnd() : 0.12 + 0.2 * rnd(), jx = (rnd() - 0.5) * 0.3, jz = (rnd() - 0.5) * 0.3, turn = (rnd() - 0.5) * 0.5;      // (the fronds of one holdfast lie nearly one way: it is the same water. Spread a quarter turn they stood out like the leaves of a houseplant)
        const ox = c.nx * Math.cos(turn) - c.nz * Math.sin(turn), oz = c.nx * Math.sin(turn) + c.nz * Math.cos(turn);
        b.roots.push({
          at: [c.x + jx * (c.wall ? 0.4 : 1), y, c.z + jz * (c.wall ? 0.4 : 1)], length: len, width: lerp(K.width[0], K.width[1], rnd()),
          direction: [ox * out, 1, oz * out], color: K.color[Math.floor(rnd() * K.color.length)], tip: K.tip[Math.floor(rnd() * K.tip.length)],
          wall: [c.nx, c.nz, c.wall ? K.back[0] + 0.1 * rnd() : K.back[1] * (0.6 + 0.6 * rnd())], lie, fan, bed: bi, keep: rnd(), keepUnder: inLee ? K.lee * (0.75 + 0.5 * rnd()) : 0,
        });
      }
      total += b.roots.length;
    }
    // -- the fronds (thinned here on lower quality, so that each frond's own numbers stay its own)
    const items = []; for (const b of beds) for (const r of b.roots) if (r.keep < dens + 1e-6 || dens >= 0.999) items.push(r);
    if (params.get('edgemark') === 'roots') {
      // (a developer's look, with &edgeeye: a red point over every holdfast, a yellow one over every cell the grid holds to be rock that stands through the surface, a green one over rock that ends under it)
      const pos = [], col = [];
      for (const b of beds) {
        for (const r of b.roots) { pos.push(r.at[0], 0.9, r.at[2]); col.push(1, 0.1, 0.2); }
        for (let j = 0; j < SIDE; j++) for (let i = 0; i < SIDE; i++) { const k = j * SIDE + i, x = b.x + (i - HALF) * CELL, z = b.z + (j - HALF) * CELL; if (b.thru[k] > NONE) { pos.push(x, 0.9, z); col.push(0.9, 0.8, 0.1); } else if (b.ledge[k] > NONE) { pos.push(x, 0.9, z); col.push(0.1, 0.9, 0.3); } }
        pos.push(b.x, 1.2, b.z); col.push(1, 1, 1);
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      const pm = new THREE.Points(g, new THREE.PointsMaterial({ size: 3, sizeAttenuation: false, vertexColors: true, depthTest: false, fog: false, transparent: true })      /* (transparent: drawn after the water, or the water paints over it) */); pm.frustumCulled = false; pm.renderOrder = 9; pm.name = 'edge: developer marks'; ctx.add(pm); ctx.only(pm, 'direct');
    }
    // (the family is loaded here and not at the top: if it cannot be had, the kelp is left out and the rest of this module stands)
    const rib = items.length ? await import('../../engine/life/ribbons.js').catch((err) => { console.error('INVALID_ sea/cast_edge: the ribbons family could not be loaded: no kelp (' + err + ')'); return null; }) : null;
    if (rib) {
      const { makeWind, makeRibbons } = rib;
      const sd = (P.water && P.water.swellDir) || [1, 0];
      const current = makeWind(ctx, { direction: sd, speed: 0.5, breeze: 1, gustiness: 0.5 });      // the water's own slow coming and going (the swell does the throwing)
      const h = makeRibbons(ctx, { kind: 'kelp', items, wind: current, glow: null, exact: true, ceiling: -K.under, seed: 4409, mottle: 0.55, edge: 0.2, segments: [2, K.segments], taper: K.taper, surge: { use: 'swell' } });
      const mesh = h.object, mat = h.material;
      mesh.name = 'kelp (900 fronds in twelve beds)';
      const wall = new Float32Array(items.length * 4); items.forEach((it, i) => wall.set([it.wall[0], it.wall[1], it.wall[2], it.keepUnder], i * 4));
      mesh.geometry.setAttribute('aKelpWall', new THREE.InstancedBufferAttribute(wall, 4));
      const lieA = new Float32Array(items.length * 4); items.forEach((it, i) => lieA.set([it.lie ? it.lie[0] : 0, it.lie ? it.lie[1] : 0, it.fan || 0, 0], i * 4));
      mesh.geometry.setAttribute('aKelpLie', new THREE.InstancedBufferAttribute(lieA, 4));
      const U = { uKelp: { value: new THREE.Vector4(0, K.glow, K.hull, K.stir) }, uKelpHull: { value: new THREE.Vector4(0, -1, 1.84, -1.5) }, uKelpTone: { value: new THREE.Vector4(K.lamp[0], K.night, K.lamp[1], 0) } };      // (the hull: the way it heads (x, z), its bow and its stern in metres from its middle)
      // the area's light on it, laid in at gouache's own places (the markers stay in the text after the family's extension)
      const vs = mat.vertexShader, fs = mat.fragmentShader;
      const ok = SX && vs.includes('//@vertexPars') && vs.includes('//@vertexWorld') && fs.includes('//@fragmentPars') && fs.includes('//@albedo') && fs.includes('//@light') && vs.includes('ribSurge(') && vs.includes('aAnchor') && vs.includes('uLifeWind') && vs.includes('uLifeWindB') && fs.includes('vRib');
      if (ok) {
        Object.assign(mat.uniforms, SX.uniforms, U);
        // KELP_TURN (fourth holder). The water turns at a wall. The family throws every frond the way the surge runs, one way and then
        // the other; here the surge each stretch of a frond feels is turned first: a little to a side of its own (no two fronds lie one
        // way), and, where it runs AT the rock the frond grows on, along the foot of that rock and a little off it, as the water itself
        // goes there. So a frond streams out from its rock, and when the water comes back it swings round and streams along the foot,
        // root first and tip last: one limp strap all the way, never folded. (Before, the frond was built as if no rock were there
        // and what fell behind the wall was moved in front of it afterwards: a hairpin wherever it crossed, sea_e4_k05_f05.png.)
        // It is laid into the family's own builder at the line where it reads the surge; if that line is ever not found, the old way stands.
        const S_LINE = 'vec2 S = ribSurge(aAnchor.xz, uRibSurge.y * 6.2831853 * sg + ph * 0.35);', turned = vs.includes(S_LINE) && vs.includes('vec3 ribAnchored(');
        const KELP_ATTR = /* glsl */`
          attribute vec4 aKelpWall;      // xy: the way out from the rock at its root (x, z); z: metres behind its root it may be thrown; w: metres it keeps under the surface
          attribute vec4 aKelpLie;       // xy: the way it lies along the foot of its rock when the surge throws it at the wall (x, z); z: radians its own throw is turned from the surge's way
        `;
        const KELP_TURN = /* glsl */`
          {
            float kFc = cos(aKelpLie.z), kFs = sin(aKelpLie.z); S = vec2(S.x * kFc - S.y * kFs, S.x * kFs + S.y * kFc);
            float kHas = step(0.25, dot(aKelpWall.xy, aKelpWall.xy)), kIn = max(0.0, -dot(S, aKelpWall.xy)) * kHas;
            S += aKelpWall.xy * (kIn * 1.18) + aKelpLie.xy * (kIn * 0.95);
            // and it is limp: at slack water it does not stand up. (The family's frond rises as the surge dies and falls over the other
            // way, like grass in a wind; six metres of wet weed lies where it lay and is swung round.) As the surge dies, what a
            // stretch feels turns through the way straight out from its rock, and never falls to nothing
            // (each a way of its own, a sixth of a turn to either side: at a straight wall every frond of a bed swung through one line, a comb)
            vec2 kRest = kHas > 0.5 ? normalize(aKelpWall.xy + aKelpLie.xy * 0.35) : vec2(-uLifeWind.y, uLifeWind.x) * (aKelpLie.z < 0.0 ? -1.0 : 1.0);
            float kRa = aKelpLie.z * 1.7, kRc = cos(kRa), kRs = sin(kRa); kRest = vec2(kRest.x * kRc - kRest.y * kRs, kRest.x * kRs + kRest.y * kRc);
            S += kRest * (0.85 * (1.0 - smoothstep(0.0, 0.85, length(S))));
          }`;
        if (!turned) console.warn('sea/cast_edge: the ribbons family no longer reads the surge where it did: the kelp is turned at its wall the old way (after it is built)');
        const vs1 = turned ? vs.replace('vec3 ribAnchored(', KELP_ATTR + '\n  vec3 ribAnchored(').replace(S_LINE, S_LINE + KELP_TURN) : vs;
        mat.vertexShader = vs1.replace('//@vertexPars', /* glsl */`
          ${turned ? '' : KELP_ATTR}
          uniform vec4 uKelp;            // x: how much way the boat has on (0..1); y, z, w: how bright its marks as it whips over, where the hull parts it, where the water is stirred
          uniform vec4 uKelpHull;        // the hull: the way it heads (x, z), its bow and its stern (metres from its middle)
          varying vec4 vKelp;            // x: how new the light of its last reversal is; y: how much of it; z: the hull's; w: metres under where the water stands now
          //@vertexPars`).replace('//@vertexWorld', /* glsl */`
          {
            float kSig = position.y;
            // it is limp: lying out along the water it snakes a little, a slow bend running out to its tip and a quicker one over it
            // (thrown out ruled straight, six metres of it was a lath)
            vec2 kLie = wp.xz - aAnchor.xz; float kLl = length(kLie);
            // (and no frond lies straight: each keeps a bend of its own, to one side or the other, a stride or more at the tip of a long one)
            if (kLl > 0.3) wp.xz += vec2(-kLie.y, kLie.x) / kLl * (uLifeWindB.z * (0.42 * kSig * kSig * sin(kSig * 6.8 - uLifeWind.w * 0.85 + aShape.y * 31.0) + 0.1 * kSig * sin(kSig * 14.0 - uLifeWind.w * 1.7 + aShape.y * 17.0))
                                                               + (fract(aShape.y * 13.7) - 0.5) * 0.5 * aDir.w * kSig * kSig);
            // it is never behind the wall it grows on. (The surge it feels is turned along the foot before it is built: KELP_TURN. What its
            // own snaking, its slack moment or the current still carries behind the wall's plane is pressed flat against the wall, softly.)
            vec2 kN = aKelpWall.xy;
            if (dot(kN, kN) > 0.25) {
              float kD = dot(wp.xz - aAnchor.xz, kN) + aKelpWall.z, kS = 0.5 * (kD + sqrt(kD * kD + 0.42));      // (kS: the nearest it comes to the wall)
              wp.xz += kN * (kS - kD)${turned ? '' : ' + aKelpLie.xy * ((kS - kD) * 0.9)'};
            }
            // the hull shoulders aside what lies in its way and presses it under its keel (the family parts a frond by where it is rooted;
            // these lie along the surface for metres, and the hull meets their far ends)
            vec2 kQ = wp.xz - uBoat.xz; vec2 kOff = kQ - uKelpHull.xy * clamp(dot(kQ, uKelpHull.xy), uKelpHull.w, uKelpHull.z); float kHd = length(kOff);
            wp.xz += kOff / max(kHd, 0.05) * (0.7 * (1.0 - smoothstep(0.5, 1.2, kHd)));
            // it is limp, and what of it reaches the surface lies on the sea, awash: under where the water stands NOW
            // (the family lays it along under still water; here the water is a swell)
            wp.y = min(wp.y, waterSwell(wp.xz) - 0.035 - aKelpWall.w - 0.42 * (1.0 - smoothstep(0.7, 1.7, kHd)));
            // when the water last turned here (the tip a little late, as the family throws it), and how hard: every
            // moment in the last two seconds at which the surge stood near nothing has left light, which has since died down
            float kLag = uRibSurge.y * 6.2831853 * kSig + aShape.y * 6.2831853 * 0.35, kNew = 0.0, kLit = 0.0, kMost = 0.0;
            for (int i = 0; i < 6; i++) {
              float kBack = float(i) * 0.36, kM = length(ribSurge(aAnchor.xz, kLag + kBack));
              float kW = exp(-kBack * 2.4), kL = (1.0 - smoothstep(0.1, 0.45, kM)) * kW;
              if (kL > kLit) { kLit = kL; kNew = kW; }
              kMost = max(kMost, kM);
            }
            float kTip = smoothstep(0.3, 0.95, kSig);                                      // (the outer half whips: the stalk only leans)
            vec2 kAway = aAnchor.xz - uBoat.xz;
            vKelp = vec4(kNew, kLit * smoothstep(0.2, 0.7, kMost) * kTip,
                         max((1.0 - smoothstep(uRibSurgeDir.z * 0.3, uRibSurgeDir.z, length(kAway))) * kTip, 1.0 - smoothstep(0.8, 1.9, kHd)) * uKelp.x,
                         waterSwell(wp.xz) - wp.y);
          }
          //@vertexWorld`);
        mat.fragmentShader = fs.replace('//@fragmentPars', /* glsl */`
          ${SX.fragmentPars}
          uniform vec4 uKelp; uniform vec4 uKelpTone; varying vec4 vKelp;
          //@fragmentPars`).replace('//@albedo', /* glsl */`
          // a frilled edge: the blade's margin is ruffled, a hand's breadth to a ruffle (kelpRim: where the margin runs here, 0..1 of the half width)
          float kelpFr = ribNoise(vec2(vRib.y * 4.6 + vRib.z * 13.0, sign(vRib.x) * 3.0)) * 0.7 + ribNoise(vec2(vRib.y * 11.0 + vRib.z * 5.0, sign(vRib.x) * 7.0)) * 0.3;
          float kelpRim = 1.0 - 0.3 * kelpFr * smoothstep(0.2, 0.6, vRib.y);
          if (abs(vRib.x) > kelpRim) discard;
          albedo *= 0.75 + 0.5 * smoothstep(0.75, 0.2, abs(vRib.x));                       // the midrib a little paler than the margins
          //@albedo`).replace('//@light', /* glsl */`
          {
            // unlit it is a dark shape in dark water: its own colour, the lantern, the kept lamp. Behind the rain front the
            // burning sea over it lifts what lies just under the surface a little (it is still weed: its paint, never light)
            float kDeep = max(vKelp.w, 0.0);
            float kSeaLit = seaFront(vWPos.xz) * uSeaL.x * seaLee(vWPos.xz);
            // (the lantern and the kept lamp: a quarter of what they give stone, and half way to grey. Wet weed is nearly black and takes
            // a lamp as a dull sheen; given all of a warm lamp its olive was mustard, the palest warm thing in a cold picture. And the
            // lit sea's teal lies on its value, not through its olive: through it, weed was leaf green)
            vec3 kLamp = mix(lamps, vec3(dot(lamps, vec3(0.3, 0.45, 0.25))), 0.55) * uKelpTone.x;
            float kVal = dot(albedo, vec3(0.3, 0.5, 0.2));
            c = mix(albedo, vec3(kVal), 0.25) * (vec3(0.62, 0.7, 0.85) * uKelpTone.y + min(kLamp, vec3(uKelpTone.z))) + (vec3(kVal) * 5.0 + 0.012) * uSeaFillLow * (kSeaLit * exp(-kDeep / 1.2));
            // its light: marks of paint along the blade, most at its margins; each mark lights at its own level and dies through ember and violet
            float kMargin = 0.3 + 0.7 * smoothstep(kelpRim - 0.6, kelpRim - 0.08, abs(vRib.x));
            vec2 kUv = vec2(vRib.y * 0.15, vRib.x * 0.041) + vRib.z * vec2(13.7, 7.3);      // (the marks lie along the blade, a hand to a forearm long)
            vec4 kA = texture2D(tSeaFleck, kUv), kB = texture2D(tSeaStip, kUv * 2.6 + 0.37);
            float kTa = kA.r / max(kA.g, 0.004), kTb = kB.r / max(kB.g, 0.004);
            vec2 kRuv = (vWPos.xz - uRippleRect.xy) / uRippleRect.zw + 0.5;
            float kStir = (kRuv.x > 0.0 && kRuv.x < 1.0 && kRuv.y > 0.0 && kRuv.y < 1.0) ? clamp(texture2D(tRipple, kRuv).a, 0.0, 1.0) : 0.0;
            kStir *= uKelp.w * exp(-kDeep / 0.9) * smoothstep(0.1, 0.5, vRib.y);
            float kWhip = smoothstep(0.0, 0.5, vKelp.y), kHull = vKelp.z * uKelp.z;
            float kK = max(kWhip, max(kHull, kStir));                                      // how much of it is alight
            float kAge = kK < 1e-3 ? 0.0 : 0.9 * (kWhip * vKelp.x + kHull * 0.9 + kStir * 0.62) / (kWhip + kHull + kStir + 1e-4);      // (aqua at its newest: core is the hull's and the surf's)
            float kCut = 1.05 - 0.68 * clamp(kK, 0.0, 1.0) * kMargin;
            float kMa = kA.g * smoothstep(kCut, kCut + 0.14, kTa), kMb = kB.g * smoothstep(kCut - 0.03, kCut + 0.11, kTb);
            vec3 kInk = seaAge(kAge * (0.1 + 0.9 * smoothstep(0.02, 0.38, kTa - kCut)), uSeaCore, uSeaAqua, uSeaEmber, uSeaDying) * kMa
                      + seaAge(kAge * (0.1 + 0.9 * smoothstep(0.02, 0.38, kTb - kCut)), uSeaCore, uSeaAqua, uSeaEmber, uSeaDying) * (kMb * 0.8);
            // (never one large value above white: that is a lamp under the water. And an arm's length from the eye a mark a forearm long is a
            // hundred pixels of it: there it is held to half, sea_e4_k08_f08.png)
            glow += min(kInk * ((0.6 + 0.6 * kK) * uKelp.y), vec3(1.2)) * (uSeaL.y * seaLee(vWPos.xz) * mix(0.42, 1.0, smoothstep(1.2, 5.0, length(vViewPos))));
          }
          //@light`);
        mat.needsUpdate = true;
      } else console.warn('sea/cast_edge: the ribbons family\'s shader has changed (its markers or names were not found): the kelp keeps the family\'s own look, unlit');
      const n0 = removeStandIn(ctx, 'kelp');
      if (debug) debug.kelp = { fronds: items.length, of: total, beds: beds.map((b) => b.roots.length), short: beds.map((b) => b.short || 0), cut: beds.map((b) => b.cut || 0), boxes: beds.map((b) => b.boxes), standinsRemoved: n0, lit: !!ok };
      // -- the tips' dabs of old light in the water's trace: at each reversal of the water at a bed, where its long
      // fronds whip over just under the surface (they are the ones that reach it)
      const kept = new Set(items);
      const tips = beds.map((b) => b.roots.filter((r) => kept.has(r) && r.length > -r.at[1] - K.under + 0.4).map((r) => ({ x: r.at[0] + r.direction[0] * 0.5, z: r.at[2] + r.direction[2] * 0.5, lag: rnd() })));
      const bedState = beds.map(() => ({ was: 0, peak: 0 })), queue = [], S = { x: 0, z: 0 };
      const sl = Math.hypot(sd[0], sd[1]) || 1, dx = sd[0] / sl, dz = sd[1] / sl;
      let budget = 0;
      kelp = {
        ribbons: h, object: mesh, material: mat, current, beds: beds.map((b) => ({ x: b.x, z: b.z, fronds: b.roots.length })), count: items.length,
        glow: K.glow, dabs: params.get('edgedabs') !== '0', dabbed: 0,
        update(dt, c) {
          const boat = c.boat, spd = Math.abs(boat.speed || 0);
          U.uKelp.value.set(smooth(0.25, 1.1, spd), kelp.glow, K.hull, K.stir);
          U.uKelpHull.value.set(-Math.sin(boat.heading), -Math.cos(boat.heading), 1.84, -1.5);
          if (!kelp.dabs) return;
          budget = Math.min(8, budget + dt * K.dab.perSecond);
          const answer = sea.uniforms.uSeaL.value.y;
          for (const [i, b] of beds.entries()) {
            if (!tips[i].length) continue;
            const st = bedState[i]; surgeAt(b.x, b.z, 0.22 * 6.2832, S);
            const along = S.x * dx + S.z * dz;
            st.peak = Math.max(st.peak, Math.abs(along));
            if (st.was !== 0 && Math.sign(along) !== Math.sign(st.was)) {
              // the water has turned: the tips whip over in the next second and a half, each in its own time
              if (st.peak > 0.3 && answer > 0.5 && Math.hypot(b.x - boat.x, b.z - boat.z) < K.dab.within) {
                const share = Math.min(1, 14 / tips[i].length);
                for (const t of tips[i]) if (rnd() < share) queue.push({ t: c.time + 0.15 + 1.5 * t.lag, x: t.x + (rnd() - 0.5) * 0.8, z: t.z + (rnd() - 0.5) * 0.8, k: Math.min(1, st.peak) });
              }
              st.peak = 0;
            }
            if (along !== 0) st.was = along;
          }
          for (let q = queue.length - 1; q >= 0 && budget >= 1; q--) {
            const e = queue[q]; if (e.t > c.time) continue;
            queue.splice(q, 1); budget -= 1;
            glowDab(e.x, e.z, K.dab.radius, K.dab.strength * (0.75 + 0.25 * e.k), 0.7);
            kelp.dabbed++;
          }
          if (queue.length > 240) queue.splice(0, queue.length - 240);
        },
      };
      edge.kelp = cast.kelp = kelp;
    }
  }

  // ============================================================================================== vault drips
  // The falls family's `drip` (docs/life/falls.md): a bead swells at a hanging end, lets go, and falls as water falls,
  // each place in its own time (never a metronome). Forty places under the gate: the vault's own named ones (the lips
  // of its clefts, its lowest tips: shared.heroesB.vault) and the kit's hanging ends (shared.rocks.hang), those over
  // open water only. Each landing near the boat is one ripple (the family's), one dab in the water's trace, one pin ring
  // of light, a crown of two or three drops, and one event ('drop') for the sound; on the rider's own boat only the event
  // and the drops.
  let drips = null;
  if (want('drips') && sea && rocks.gate) {
    const D = EDGE.drips, HB = shared.heroesB || {}, rnd = ctx.rng(6113), gs = P.gate.s;
    const dOf = (x, z) => path.locate(x, z, gs, tmp).d;
    const own = [], hang = [];
    if (HB.vault && HB.vault.points) for (const n of Object.keys(HB.vault.points).sort()) if (n.startsWith('drip_')) { const q = HB.vault.point(n); own.push({ x: q.x, y: q.y, z: q.z, d: dOf(q.x, q.z) }); }
    for (const h of rocks.hang || []) hang.push({ x: h.x, y: h.y - h.len, z: h.z, d: dOf(h.x, h.z) });
    for (let i = hang.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)), t = hang[i]; hang[i] = hang[j]; hang[j] = t; }
    const pts = [];
    const take = (c) => {
      if (pts.length >= D.count || Math.abs(c.d) > D.over || c.y < 5) return false;
      for (const q of pts) if (Math.hypot(q.x - c.x, q.z - c.z) < D.apart) return false;
      pts.push({ x: c.x, y: c.y - 0.05, z: c.z, d: c.d, color: D.color[pts.length % D.color.length] }); return true;
    };
    for (const c of own) take(c);
    let mid = 0; for (const c of hang) if (mid < 6 && Math.abs(c.d) < 3.2 && take(c)) mid++;      // some over the middle of the passage: their drops fall on a boat left to the current
    for (const c of hang) take(c);
    const falls0 = pts.length ? 1 : 0;
    if (falls0) {
      const falls = await import('../../engine/life/falls.js').catch((err) => { console.error('INVALID_ sea/cast_edge: the falls family could not be loaded: no vault drips (' + err + ')'); return null; });
      const makeFall = falls && falls.makeFall;
      const onLand = (x, z, info) => {
        drips.landed++;
        if (info.onBoat) { drips.onBoat++; sparks.toss(x, 0.42, z, 2, { up: [0.5, 1.2], out: [0.2, 0.8], gain: 0.7, ring: 0, fine: true }); fire('drop', x, z, { onBoat: true, distance: info.distance, gain: 1 }); return; }
        const h = ctx.water.heightAt(x, z);
        if (D.dab.strength > 0) glowDab(x, z, D.dab.radius, D.dab.strength, 0.6);
        if (D.dab.patch) marks.wash(x, z, { ...D.dab.patch, fine: true });
        marks.ring(x, z, { r0: D.pin.r0, r1: D.pin.r1, life: D.pin.life, bold: D.pin.bold, gain: D.pin.gain, spark: 1 });
        if (D.crown) sparks.toss(x, h + 0.04, z, D.crown, { up: [0.7, 1.7], out: [0.1, 0.55], gain: 0.8, ring: 0, level: h, fine: true });
        fire('drop', x, z, { onBoat: false, distance: info.distance, gain: 1 });
      };
      const fall = makeFall && makeFall(ctx, { kind: 'drip', points: pts, per: D.per, every: D.every, size: D.size, color: ['#ffffff'], intensity: D.intensity, opacity: D.opacity, minPixels: D.minPixels, farAlpha: D.farAlpha, seed: 613,
        landings: { within: D.within, perSecond: D.perSecond, ring: D.ripple, onLand } });
      if (fall) {
      fall.object.name = 'vault drips (40 places)';
      let rate = 1;
      fall.flow = 0.5;
      drips = {
        fall, object: fall.object, points: pts, landed: 0, onBoat: 0,
        /** 1 = the page's ordinary rate (one drop from each place every 3 to 9 s); to 2. Ease it: a drop in the air when its place is shut goes out like a spark (the family thins places, not time) */
        get rate() { return rate; }, set rate(v) { rate = Math.min(2, Math.max(0, v)); fall.flow = 0.5 * rate; },
      };
      edge.drips = cast.drips = drips;
      if (debug) debug.drips = { places: pts.length, heights: [Math.min(...pts.map((q) => q.y)).toFixed(1), Math.max(...pts.map((q) => q.y)).toFixed(1)], mid: pts.filter((q) => Math.abs(q.d) < 3.2).length };
      }
    }
  }

  // ============================================================================================== the buoy, the floats, the dans
  // They are the set's (heroes_b.js: the bell buoy with its hammers and its chain of light; kit.js: five cork floats and
  // two dans on their line, the rags of the engine's cloth) and ride the swell already. What the cast adds:
  //   - each is ringed with light as the swell lifts it through its level: floats and dans in turn, as the crest runs
  //     down their line; the page's ripple under each (the buoy writes its own);
  //   - every stroke of a hammer shivers a fine ring out of the buoy's waterline, and is told ('bell', with its gain);
  //     the bell can be rung on demand (buoy.ring(2));
  //   - when the rain front's foot reaches one it lights (a wider ring, new light round it): one after another by the
  //     front's own line; or on demand (floats.lightUp(i), floats.sequence());
  //   - the wake rocks the floats and the dans; a float the hull knocks aside throws a few drops and is told ('knock');
  //   - the rags can be lifted and let fall (rags.lift(), rags.fall()): they hang or stream, the cloth never flaps.
  let afloat = null;
  if (want('afloat') && sea) {
    const F = EDGE.floats, B = EDGE.buoy, A = rocks.afloat || null, HB = shared.heroesB || {}, rnd = ctx.rng(7001), stage = ctx.stage;
    const bAt = P.buoy ? kit.at(P.buoy.at[0], P.buoy.at[1]) : null;
    const things = [];
    if (A) A.floats.forEach((f, i) => things.push({ kind: 'float', index: i, f, base: [f.lean[0], f.lean[1]], x: () => f.x + (f.px || 0), z: () => f.z + (f.pz || 0), size: 1 }));
    if (A) A.dans.forEach((dn, i) => things.push({ kind: 'dan', index: i, dn, x: () => dn.x + (dn.px || 0), z: () => dn.z + (dn.pz || 0), size: 0.8 }));      // (px, pz: where the hull has shouldered it to, kit.js)
    if (bAt && HB.buoy) things.push({ kind: 'buoy', index: 0, x: () => bAt.x, z: () => bAt.z, size: 4 });
    for (const t of things) Object.assign(t, { h: 0, first: true, armed: true, behind: -1, rockAt: -1e9, rockAmp: 0, rockDir: [1, 0], lastWake: -1e9, hit: false });
    // broken water round one of them, in the sea's flecks (edge.marks.wash): a dan's a little smaller than a float's, the buoy's its own
    const washOf = (t, cfg, k = 1) => {
      const c = t.kind === 'buoy' ? (cfg === F.lit ? B.lit : cfg === F.knock ? B.wash : B.wash) : cfg, sc = t.kind === 'dan' ? 0.8 : 1;
      return { r0: c.r0 * (t.kind === 'buoy' ? 1 : sc), r1: c.r1 * sc, life: c.life, gain: c.gain * k, core: c.core };
    };
    // a ring of dabs in the water's trace round its waterline, as an age (the sheet draws it in its own marks, and it cools there)
    const traceRing = (x, z, c, age) => { for (let i = 0; i < c.n; i++) { const a = (i + rnd()) / c.n * 6.2832; glowDab(x + Math.cos(a) * c.r, z + Math.sin(a) * c.r, c.radius, age, 0.6); } };
    const lift = (t, vy) => {
      const k = Math.min(1, Math.max(0.35, vy / 0.45)), x = t.x(), z = t.z(), buoy = t.kind === 'buoy';
      marks.wash(x, z, washOf(t, F.wash, 0.6 + 0.4 * k));
      if (!buoy) ctx.water.ripple(x, z, F.ripple[0] * k, F.ripple[1]);                    // (the buoy writes its own: heroes_b.js)
      if ((buoy ? B.trace : F.trace).age > 0) traceRing(x, z, buoy ? B.trace : F.trace, (buoy ? B.trace : F.trace).age);
      afloat.lifts++; fire('lift', x, z, { kind: t.kind, index: t.index, strength: k });
    };
    const lightUp = (t, k = 1) => {
      const x = t.x(), z = t.z(), buoy = t.kind === 'buoy';
      marks.wash(x, z, washOf(t, F.lit, k));
      ctx.water.ripple(x, z, buoy ? 0.6 : 0.4, buoy ? 1.4 : 0.6);
      traceRing(x, z, buoy ? { ...B.trace, n: 10 } : { ...F.trace, n: 6, r: 0.42 }, F.lit.trace * k);
      // (and the gust that comes with the front slaps it: a few drops stand up off it, which is what is seen of it from the composed line, thirty metres off)
      const h = ctx.water.heightAt(x, z);
      // (thrown as the storm's water is: gouts that carry to the composed line, so that five corks and a buoy lighting in turn can be told
      // from the fire of the front's own foot, which reaches them in the same second)
      const n = buoy ? 3 : 1;
      for (let i = 0; i < n; i++) {
        const a = rnd() * 6.2832, nx = Math.cos(a), nz = Math.sin(a), rr = buoy ? 1.2 : 0.12;
        sparks.sheet(x + nx * rr, h + 0.1, z + nz * rr, { arcs: 2, per: buoy ? 8 : 7, skirt: buoy ? 5 : 4, nx, nz, high: buoy ? [1.3, 2.7] : [0.9, 2.2], along: buoy ? 0.5 : 0.15, lean: 0.5, gain: k, big: smooth(12, 30, Math.hypot(x - ctx.boat.x, z - ctx.boat.z)), ring: 0.2, level: h - 0.3 });
      }
      afloat.lit++; fire('lit', x, z, { kind: t.kind, index: t.index, strength: k });
    };
    // the bell
    const mouth = new THREE.Vector3();
    const bell = (speed, natural, hammer) => {
      if (!bAt) return;
      const g = lerp(B.gain[0], B.gain[1], smooth(B.speed[0], B.speed[1], speed)), distance = Math.hypot(bAt.x - ctx.boat.x, bAt.z - ctx.boat.z);
      if (distance < 130) {                                                               // (further off nothing of it is seen: only the event is told, with the distance)
        marks.wash(bAt.x, bAt.z, { r0: B.strike.r0, r1: B.strike.r1, life: B.strike.life, gain: B.strike.gain * (0.5 + 0.5 * g), core: 0.25, fine: true });
        ctx.water.ripple(bAt.x, bAt.z, B.strike.ripple[0], B.strike.ripple[1]);
      }
      if (HB.buoy && HB.buoy.model && HB.buoy.model.points && HB.buoy.model.points.bell_mouth) HB.buoy.model.point('bell_mouth', mouth); else mouth.set(bAt.x, 2.2, bAt.z);
      afloat.bells++; afloat.bellTimes.push(Math.round(ctx.time * 10) / 10); if (afloat.bellTimes.length > 40) afloat.bellTimes.shift();
      fire('bell', mouth.x, mouth.z, { y: mouth.y, gain: g, note: 57, natural, hammer, distance, tilt: HB.buoy ? HB.buoy.tilt : 0 });
    };
    let natural = 0, pushedUntil = -1, ownNext = -1;                                      // strokes of the buoy's own hammers so far; a stroke that was asked for is due until then; the buoy's own may ring again from then
    if (HB.buoy && HB.buoy.onStrike) HB.buoy.onStrike((hammer, speed) => {
      natural++;
      // (stage 5) a stroke that was RUNG and is seen (the set's push threw this hammer) is told as rung: natural false, as the log promised staging
      if (ctx.time <= pushedUntil) { pushedUntil = -1; bell(speed, false, hammer); return; }
      if (ctx.time < ownNext) return;                                                     // the buoy's own: one that rings every 6 to 11 s (B.own)
      ownNext = ctx.time + lerp(B.own[0], B.own[1], rnd());
      bell(speed, true, hammer);
    });
    // One stroke on demand. If the set gives the buoy a push (shared.heroesB.buoy.push(radians a second): asked of it in the log), the
    // push is given and a hammer is SEEN to strike: that stroke is told by onStrike like any other. If there is no push, or no hammer
    // has struck a third of a second after it, the cast tells the stroke itself (the shiver at the waterline, the event), unseen.
    const stroke = (speed) => {
      const was = natural, push = HB.buoy && typeof HB.buoy.push === 'function' ? HB.buoy.push : null;
      if (!push) { bell(speed, false, -1); return; }
      pushedUntil = ctx.time + 0.34;
      try { push.call(HB.buoy, speed, bAt.x, bAt.z); } catch (err) { pushedUntil = -1; bell(speed, false, -1); return; }
      stage.after(0.34, () => { if (natural === was) { pushedUntil = -1; bell(speed, false, -1); } });
    };
    const floatsOf = () => things.filter((t) => t.kind !== 'buoy'), buoyOf = () => things.find((t) => t.kind === 'buoy');
    const ragAt = new THREE.Vector3();
    afloat = {
      things, lifts: 0, lit: 0, bells: 0, bellTimes: [],
      auto: true,                          // a float, a dan and the buoy light as the rain front's foot reaches each (by the front's own line); false: only on demand
      autoBell: 0,                         // strokes of the bell as the front's foot reaches the buoy (0: staging rings it itself: buoy.ring(2))
      update(dt, c) {
        const water = c.water, boat = c.boat, spd = Math.abs(boat.speed || 0), frontOn = sea.T >= 0 && sea.front;
        for (const t of things) {
          const x = t.x(), z = t.z(), h = water.heightAt(x, z), vy = t.first ? 0 : (h - t.h) / Math.max(dt, 1e-3);
          const far = Math.abs(x - boat.x) + Math.abs(z - boat.z) > 130;                  // (too far to be seen or heard: nothing is written)
          if (t.armed && !t.first && !far && t.h < 0 && h >= 0 && vy > 0.05 && vy < 1.5) { t.armed = false; lift(t, vy); } else if (h < -0.05) t.armed = true;
          t.h = h;
          // the rain front's foot reaches it: it lights
          const bh = frontOn ? sea.front.behind(x, z) : -1;
          if (afloat.auto && !t.first && t.behind < 0 && bh >= 0 && bh < 30) { lightUp(t, 1); if (t.kind === 'buoy' && afloat.autoBell > 0 && buoyH) buoyH.ring(afloat.autoBell, { delay: 0.2 }); }
          t.behind = bh; t.first = false;
          if (t.kind === 'buoy') continue;
          // the wake rocks it: a moment after the hull has passed near with way on
          const d = Math.hypot(x - boat.x, z - boat.z);
          if (spd > 0.5 && d < F.wake.within && c.time - t.lastWake > 3.5) {
            t.lastWake = c.time; t.rockAt = c.time + d / 1.7; t.rockAmp = F.wake.lean * (1 - d / F.wake.within) * smooth(0.5, 1.6, spd) * (c.reducedMotion ? 0.5 : 1);
            const l = d || 1; t.rockDir = [(x - boat.x) / l, (z - boat.z) / l];
          }
          const tau = c.time - t.rockAt, rock = tau > 0 && tau < 9 ? t.rockAmp * Math.exp(-tau / F.wake.settle) * Math.sin(6.2832 * F.wake.hz * tau) : 0;
          if (t.kind === 'float') {
            // (the kit lays each float by these numbers every frame: shared.rocks.afloat.floats[i].lean)
            t.f.lean[0] = t.base[0] + rock * t.rockDir[1]; t.f.lean[1] = t.base[1] - rock * t.rockDir[0];
            if (t.f.hit && !t.hit) { marks.wash(x, z, washOf(t, F.knock)); sparks.toss(x, h + 0.1, z, 4, { up: [0.8, 1.8], out: [0.2, 0.9], gain: 0.8 }); fire('knock', x, z, { kind: 'float', index: t.index }); }
            t.hit = !!t.f.hit;
          } else if (t.kind === 'dan' && !!t.dn.hit !== t.hit) {
            if (t.dn.hit) { marks.wash(x, z, washOf(t, F.knock)); sparks.toss(x, h + 0.1, z, 3, { up: [0.8, 1.6], out: [0.2, 0.8], gain: 0.8 }); fire('knock', x, z, { kind: 'dan', index: t.index }); }
            t.hit = !!t.dn.hit;
          }
          if (t.kind === 'dan' && rock !== 0 && t.dn.model && A.rags) {
            // (the kit has stood the dan and tied its rags this frame; the cane is leaned a little more, and its rags tied again where its head now is)
            const g = t.dn.model.group; g.rotation.x += 0.6 * rock * t.rockDir[1]; g.rotation.z -= 0.6 * rock * t.rockDir[0]; g.updateMatrix(); g.updateMatrixWorld(true);
            t.dn.model.point('rag', ragAt); const aPos = A.rags.mesh.geometry.attributes.aPos; for (const k of [0, 1]) aPos.setXYZ(t.index * 2 + k, ragAt.x, ragAt.y, ragAt.z); aPos.needsUpdate = true;
          }
        }
      },
    };
    const buoyH = bAt ? {
      at: bAt, set: HB.buoy || null,
      /** Ring the bell: `times` strokes, about `gap` seconds apart (never even), each as hard as a hammer coming at `speed` radians a second (0.15 soft .. 0.6 hard). Every stroke fires 'bell'. */
      ring(times = 1, o = {}) { for (let k = 0; k < times; k++) stage.after((o.delay || 0) + k * (o.gap ?? B.gap) * (0.88 + 0.3 * rnd()), () => stroke(o.speed ?? (0.38 + 0.2 * rnd()))); return buoyH; },
      /** It lights as if the front's foot had reached it (a wide ring, new light round it). */
      lightUp(k = 1) { const t = buoyOf(); if (t) lightUp(t, k); return buoyH; },
      get strikes() { return afloat.bells; }, get tilt() { return HB.buoy ? HB.buoy.tilt : 0; },
    } : null;
    const floatsH = {
      things: floatsOf(), count: floatsOf().length,
      /** Light one (0..4 the floats down the line from the buoy, then the two dans): a wide ring of light at its waterline, new light round it; fires 'lit'. */
      lightUp(i, k = 1) { const t = floatsOf()[i]; if (t) lightUp(t, k); return floatsH; },
      /** Lift one as a swell does (its ordinary ring and ripple; fires 'lift'): for a swell that is not the sea's own (the whale's). k: 0.35 slight .. 1 */
      lift(i, k = 0.7) { const t = floatsOf()[i]; if (t) lift(t, 0.45 * k); return floatsH; },
      /**
       * One after another down the line from the buoy's end (`reverse`: from the wreck's end; `order: 'front'`: as the rain
       * front's line would reach them), `over` seconds for all. `kind: 'lit'` (default) lights each as the front's foot does;
       * `kind: 'lift'` only lifts each as a passing swell does. The buoy last if `buoy` (then `bell` strokes). Returns the seconds it takes.
       */
      sequence(o = {}) {
        const over = o.over ?? 0.5, list = floatsOf().slice(), lit = o.kind !== 'lift';
        const key = (t) => (o.order === 'front' && sea.front ? -sea.front.behind(t.x(), t.z()) : path.locate(t.x(), t.z(), 150, {}).s * (o.reverse ? -1 : 1));
        list.sort((a, b) => key(a) - key(b));
        list.forEach((t, i) => stage.after((o.delay || 0) + over * i / Math.max(1, list.length - 1), () => (lit ? lightUp(t, o.strength ?? 1) : lift(t, 0.45 * (o.strength ?? 0.7)))));
        const end = (o.delay || 0) + over + (o.pause ?? 0.3);
        if (o.buoy && buoyH) stage.after(end, () => { const b = buoyOf(); if (b) { if (lit) lightUp(b, o.strength ?? 1); else lift(b, 0.45 * (o.strength ?? 0.7)); } if (o.bell) buoyH.ring(o.bell); });
        return end;
      },
      get auto() { return afloat.auto; }, set auto(v) { afloat.auto = !!v; },
      get autoBell() { return afloat.autoBell; }, set autoBell(v) { afloat.autoBell = Math.max(0, Math.round(v)); },
    };
    const ragsH = A && A.rags ? {
      cloth: A.rags, wind: A.rags.wind, lifted: 0,
      /** The wind reaches the dans: their rags lift and stream (0.55: about 40 degrees off the plumb line; 1: nearly level). They are held until fall(). */
      lift(strength = 0.55, o = {}) {
        const w = A.rags.wind, dir = sea.front ? [sea.front.nx, sea.front.nz] : [1, 0], dn = A.dans[0] || { x: 0, z: 0 }, lead = o.lead ?? 12;
        w.front({ from: [dn.x - dir[0] * lead, dn.z - dir[1] * lead], toward: dir, speed: o.speed ?? 8, depth: o.depth ?? 6, strength });
        ragsH.lifted = strength; return ragsH;
      },
      fall(o = {}) { A.rags.wind.release({ speed: o.speed ?? 6 }); ragsH.lifted = 0; return ragsH; },
      /** For a cue's settle: lifted (1) or hanging (0), at once. */
      settle(level = 0) { A.rags.wind.settle(level); ragsH.lifted = level; return ragsH; },
    } : null;
    edge.afloat = afloat; edge.buoy = cast.buoy = buoyH; edge.floats = cast.floats = floatsH; edge.rags = cast.rags = ragsH;
    if (debug) debug.afloat = { things: things.map((t) => t.kind), onStrike: !!(HB.buoy && HB.buoy.onStrike), rags: !!ragsH };
  }

  // ============================================================================================== spray
  // The spray itself is the set's (light.js, thrown by sea.surf at every foot: plumes and flecks timed by the swell's
  // own three waves; mesh 'sea-spray'). It is not made twice. What the cast adds to it, by reading the same swell:
  //   - where a foot within reach of the boat is struck, a handful of its sparks strike rings where they fall back
  //     (one in five: a ripple and a small ring of light each);
  //   - every strike within thirty metres is told ('splash', with its strength and distance), a few a second at most;
  //   - the wake does the same in small: a moment after the boat has passed within ten metres of a foot with way on,
  //     a few drops are thrown there and the foot takes a touch of the boat's own light;
  //   - a rate for staging (spray.rate: above 1 more is thrown at struck feet near the boat; below 1 the set's spray is
  //     dimmed), and spray.burst(x, z) for a place of staging's own choosing.
  let spray = null;
  if (want('spray') && sea) {
    const S = EDGE.spray, rnd = ctx.rng(8101), places = [], setMeshes = [];
    ctx.group.traverse((o) => { if (o.name === 'sea-spray' && o.geometry && o.geometry.attributes && o.geometry.attributes.aOrg && o.geometry.attributes.aKS) setMeshes.push(o); });
    for (const m of setMeshes) {
      const O = m.geometry.attributes.aOrg, KS = m.geometry.attributes.aKS;
      for (let i = 0; i < O.count; i++) if (KS.getX(i) < 0.5) places.push({ x: O.getX(i), z: O.getY(i), nx: O.getZ(i), nz: O.getW(i), str: KS.getY(i) });
    }
    if (!places.length) {
      // (the set's spray was not found: the kit's feet and the skerry's own points stand in, so that the rings, the events and the wake's spray still have places)
      for (const f of rocks.feet || []) places.push({ x: f[0] + f[2] * 0.3, z: f[1] + f[3] * 0.3, nx: f[2], nz: f[3], str: 0.75 });
      const sk = shared.heroes && shared.heroes.skerry;
      if (sk && sk.spray) for (const q of sk.spray) if (q) { const l = path.locate(q.x, q.z, 212, tmp), f = path.at(l.s, {}); places.push({ x: q.x, z: q.z, nx: -f.rx, nz: -f.rz, str: 0.8 }); }
    }
    for (const q of places) Object.assign(q, { was: 0, last: -1e9, near: 1e9, wakeAt: -1e9 });
    // The feet the storm's own water is thrown at (below): every place of the set's that keeps its distance from the last one taken
    // (those that meet the swell first, a few strides apart; then the sides turned from it, further apart: the swell runs along them),
    // the nearest to the water the rider is on while it rains (the sound, under the tower, the wall) first; and the Prow's own face,
    // where the set lays no surf (plan.wall.prow: the buttress stands `out` metres proud of the wall, turned to a rider in the sound).
    // Of all of them the `max` nearest the boat throw at any one time: the page's sixty emitters go with the rider.
    const storm = [];
    {
      const S2 = S.storm, lineD = (q) => { let m = 1e9; for (let ss = 110; ss <= 250; ss += 10) { const a = path.at(ss, tmp); m = Math.min(m, Math.hypot(q.x - a.x, q.z - a.z)); } return m; };
      const own = [], W = P.wall;
      if (W && W.prow && W.s) {
        const pr = W.prow, f = path.at(W.s - pr.out, {});
        // (3.2 m before the buttress's own line: its plinth of stumps stands out to there, and the swell breaks on them first; nearer in, a sheet is thrown behind them and is not seen)
        for (let d = pr.from + 2.4; d <= pr.to - 2; d += 4.6) { const q = kit.at(W.s - pr.out - 3.2, d); own.push({ x: q.x, z: q.z, nx: -f.tx, nz: -f.tz, str: 0.62, was: 0, last: -1e9, near: 1e9, wakeAt: -1e9, own: true }); }
      }
      for (const q of own) storm.push(q);
      const cand = places.map((q) => ({ q, d: lineD(q) })).sort((a, b) => a.d - b.d);
      for (const { q } of cand) if (q.str >= S2.weather && storm.every((e) => Math.hypot(e.x - q.x, e.z - q.z) >= S2.apart)) storm.push(q);
      for (const { q } of cand) if (q.str < S2.weather && storm.every((e) => Math.hypot(e.x - q.x, e.z - q.z) >= S2.apartLee)) storm.push(q);
      // (none where the kept lamp's stroke begins: the water before the door is the calmest of the realm, and the one warm thing stands in it)
      const lampAt = P.lamp ? kit.at(P.lamp.at[0], P.lamp.at[1]) : null;
      for (const q of storm) { q.stormNext = 0; q.stormWas = 0; q.stormOn = false; q.dNow = 1e9; q.calm = !!lampAt && Math.hypot(q.x - lampAt.x, q.z - lampAt.z) < S2.lampClear; }
    }
    let stormPick = -1e9;
    const base = setMeshes.map((m) => (m.material.uniforms.uSpray ? m.material.uniforms.uSpray.value.w : 1));
    const sdir = (P.water && P.water.swellDir) || [1, 0], sl = Math.hypot(sdir[0], sdir[1]) || 1, wx = sdir[0] / sl * 0.9, wz = sdir[1] / sl * 0.9;
    let rate = 1, lastSplash = -1e9;
    // the lee round the kept lamp, as the sea's light has it (seaLee): 1 outside it .. what is left of the sea's light at its middle
    const leeAt = (x, z) => { const L = sea.uniforms.uSeaLee.value; return 1 - L.w * (1 - smooth(L.z * 0.35, L.z, Math.hypot(x - L.x, z - L.y))); };
    // the boat's wash reaches a foot: a few drops stand up off it, and the water along that stretch of waterline takes a touch of
    // the boat's own light (the rock's material reads it there and lets it climb, in small; less in the lamp's lee)
    const washAt = (q, k) => {
      const h = ctx.water.heightAt(q.x, q.z), lee = leeAt(q.x, q.z), n = Math.round(lerp(S.wake.n[0], S.wake.n[1], k) * lee);
      if (n > 0) sparks.toss(q.x + q.nx * 0.25, h + 0.06, q.z + q.nz * 0.25, n, { up: [S.wake.up[0] * (0.7 + 0.3 * k), S.wake.up[1] * (0.6 + 0.4 * k)], out: [0.1, 0.7], nx: q.nx, nz: q.nz, spread: 0.9, gain: 0.9, ring: 0.25, level: h });
      for (const a of S.wake.along) glowDab(q.x + q.nx * 0.25 - q.nz * a, q.z + q.nz * 0.25 + q.nx * a, S.wake.radius, (S.wake.light[0] + S.wake.light[1] * k) * (0.5 + 0.5 * lee), 0.6);
      // (fourth holder: and the lap itself. The light written above climbs the rock only when a crest of the swell is on that foot too, and
      // the drops are a finger wide: from the boat, by then ten metres on, nothing was seen at all: sea_e4_w01.png. The wash laps the foot
      // twice, the second time slighter: broken water in the sea's own flecks along that stretch of waterline, a stride wide, gone in two seconds)
      if (lee > 0.3) S.wake.lap.forEach((a, i) => {
        const second = i % 2 === 1, x = q.x + q.nx * 0.35 - q.nz * a, z = q.z + q.nz * 0.35 + q.nx * a;
        marks.wash(x, z, { r0: 0.03, r1: (0.55 + 0.45 * k) * (second ? 0.7 : 1), life: second ? 1.5 : 2.0, gain: (0.85 + 0.6 * k) * (second ? 0.6 : 1) * lee, core: second ? 0.15 : 0.4, delay: Math.abs(a) * 0.14 + (second ? 1.05 : 0) + 0.1 * rnd() });
        if (!second) ctx.stage.after(Math.abs(a) * 0.14, () => ctx.water.ripple(x, z, 0.14 * (0.5 + 0.5 * k), 0.3));
      });
    };
    // WHERE THE WAKE LAPS (fourth holder). The set's spray places stand on the coarse outlines its surf is laid round: at a stepped foot
    // they lie a stride or two inside the steps, and a lap drawn there is under rock. The kit's own feet (shared.rocks.feet: the shells
    // of the stacks, the fronts of the steps, the gate's jambs) are the waterline itself: the wake laps there, one small wash to a place.
    // (And even those stand where a shaft meets its skirt of steps: the water's edge is a stride or two further out, differently at every
    // foot: sea_e4_w05.png. So the rock that stands through the surface is read once, in half-metre cells, from the kit's own copies of
    // its columns, steps, drums and reefs (boxes, as the kelp reads its beds), and from each foot the way out is walked to the first
    // open water: that is where the wake laps. A foot with no open water within five metres has none.)
    const wakeFeet = [];
    {
      const CELL = 0.5, cells = new Set(), key = (x, z) => (Math.round(x / CELL) + 8192) * 16384 + (Math.round(z / CELL) + 8192);
      const isRock = (o) => { for (let p = o; p; p = p.parent) { const n = p.name || ''; if (/^(near:|steps:|reef:|drums:|columns:)/.test(n)) return !/\((from afar|coarse)\)/.test(n); } return false; };
      const feet = (rocks.feet || []).map((f) => ({ x: f[0], z: f[1], nx: f[2], nz: f[3] }));
      if (feet.length) {
        let fx0 = 1e9, fx1 = -1e9, fz0 = 1e9, fz1 = -1e9; for (const f of feet) { fx0 = Math.min(fx0, f.x); fx1 = Math.max(fx1, f.x); fz0 = Math.min(fz0, f.z); fz1 = Math.max(fz1, f.z); }
        const M = new THREE.Matrix4(), MW = new THREE.Matrix4(), INV = new THREE.Matrix4(), v = new THREE.Vector3();
        ctx.group.updateMatrixWorld(true);
        const toLocal = new THREE.Matrix4().copy(ctx.group.matrixWorld).invert();
        ctx.group.traverse((o) => {
          if (!o.isInstancedMesh || !o.geometry || !isRock(o)) return;
          if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
          const bb = o.geometry.boundingBox; MW.multiplyMatrices(toLocal, o.matrixWorld);
          for (let i = 0; i < o.count; i++) {
            o.getMatrixAt(i, M); M.premultiply(MW);
            let top = -1e9, x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
            for (let c = 0; c < 8; c++) { v.set(c & 1 ? bb.max.x : bb.min.x, c & 2 ? bb.max.y : bb.min.y, c & 4 ? bb.max.z : bb.min.z).applyMatrix4(M); top = Math.max(top, v.y); x0 = Math.min(x0, v.x); x1 = Math.max(x1, v.x); z0 = Math.min(z0, v.z); z1 = Math.max(z1, v.z); }
            if (top < -0.2 || x1 < fx0 - 6 || x0 > fx1 + 6 || z1 < fz0 - 6 || z0 > fz1 + 6) continue;      // (rock that ends under the surface is no waterline: a lap of light round a drum nobody sees is a lap in open water)
            INV.copy(M).invert();
            const yAt = Math.min(-0.1, top - 0.05);
            for (let z = Math.ceil(z0 / CELL) * CELL; z <= z1; z += CELL) for (let x = Math.ceil(x0 / CELL) * CELL; x <= x1; x += CELL) {
              v.set(x, yAt, z).applyMatrix4(INV);
              if (v.x >= bb.min.x && v.x <= bb.max.x && v.z >= bb.min.z && v.z <= bb.max.z && v.y >= bb.min.y && v.y <= bb.max.y) cells.add(key(x, z));
            }
          }
        });
        const rock = (x, z) => cells.has(key(x, z));
        for (const f of feet) {
          let at = -1;
          for (let t = 0; t <= 5; t += 0.25) if (!rock(f.x + f.nx * t, f.z + f.nz * t) && !rock(f.x + f.nx * (t + 0.5), f.z + f.nz * (t + 0.5))) { at = t; break; }
          if (at < 0) continue;
          const x = f.x + f.nx * (at + 0.15), z = f.z + f.nz * (at + 0.15);
          if (wakeFeet.every((e) => Math.abs(e.x - x) + Math.abs(e.z - z) > 1.7)) wakeFeet.push({ x, z, nx: f.nx, nz: f.nz, near: 1e9, wakeAt: -1e9, foot: true });
        }
      }
      if (debug) debug.wake = { feet: wakeFeet.length, of: feet.length, rockCells: cells.size };
    }
    { const sk = shared.heroes && shared.heroes.skerry; if (sk && sk.spray) for (const q of sk.spray) if (q) { const l = path.locate(q.x, q.z, 212, tmp), f = path.at(l.s, {}); wakeFeet.push({ x: q.x, z: q.z, nx: -f.rx, nz: -f.rz, near: 1e9, wakeAt: -1e9, foot: true }); } }
    const lapAt = (q, k) => {
      const x = q.x, z = q.z, h = ctx.water.heightAt(x, z), lee = leeAt(x, z);
      if (params.has('edgewake')) { const l = path.locate(x, z, null, {}); console.error(`EDGE_PROBE (not an error) wake lap at t ${ctx.time.toFixed(1)}: s ${l.s.toFixed(1)} d ${l.d.toFixed(1)}, k ${k.toFixed(2)}, lee ${lee.toFixed(2)}, the sea answers ${sea.uniforms.uSeaL.value.y.toFixed(2)}, boat at s ${ctx.s.toFixed(1)}`); }
      if (lee < 0.3 || hullOn(x, z, 0.6)) return;
      const n = Math.round(lerp(3, 8, k) * lee);
      if (n > 0) sparks.toss(x, h + 0.06, z, n, { up: [S.wake.up[0] * (0.7 + 0.3 * k), S.wake.up[1] * (0.6 + 0.4 * k)], out: [0.1, 0.7], nx: q.nx, nz: q.nz, spread: 0.9, gain: 0.9, ring: 0.25, level: h });
      glowDab(x, z, S.wake.radius, (S.wake.light[0] + S.wake.light[1] * k) * (0.5 + 0.5 * lee), 0.6);
      // (the lap itself, twice, the second slighter: broken water in the sea's own flecks at that stretch of waterline, a stride wide, gone in two seconds)
      marks.wash(x, z, { r0: 0.03, r1: 0.9 + 0.6 * k, life: 2.2, gain: (1.2 + 0.8 * k) * lee, core: 0.4 });
      marks.wash(x, z, { r0: 0.03, r1: 0.65 + 0.4 * k, life: 1.6, gain: (0.7 + 0.5 * k) * lee, core: 0.15, delay: 1.0 + 0.2 * rnd() });
      ctx.water.ripple(x, z, 0.14 * (0.5 + 0.5 * k), 0.3);
    };
    spray = {
      places, set: setMeshes, strikes: 0, wakes: 0, splashEvery: 0.3, wakeFeet,
      /** The storm's own water at the weather feet behind the rain front: 1 as the weather throws it, 0 none (to 2). */
      storm: 1, stormPlaces: storm, sheets: 0,
      /** 1 = as the swell throws it. Above 1 (to 3) more is thrown at struck feet near the boat (the gate's great crests); below 1 the set's spray is dimmed. */
      get rate() { return rate; },
      set rate(v) { rate = Math.min(3, Math.max(0, v)); setMeshes.forEach((m, i) => { if (m.material.uniforms.uSpray) m.material.uniforms.uSpray.value.w = base[i] * Math.min(1, rate); }); },
      /** Throw spray at a place of your own: n drops rising to about `high` metres (never above 6 m outside the gate), one in five striking a ring. */
      burst(x, z, o = {}) {
        const high = Math.min(o.high ?? 3, 6), v = Math.sqrt(2 * 7.5 * high), h = ctx.water.heightAt(x, z);
        sparks.toss(x, h + 0.1, z, o.n ?? 30, { up: [0.45 * v, v], out: o.out || [0.2, 1.4], nx: o.nx, nz: o.nz, spread: o.spread ?? 1.2, gain: o.gain ?? 1, level: h, delay: o.delay });
        return spray;
      },
      update(dt, c) {
        const boat = c.boat, spd = Math.abs(boat.speed || 0), answer = sea.uniforms.uSeaL.value.y, amp = SW[0].w + SW[1].w + SW[2].w, sea01 = Math.min(1.2, amp / 0.7);
        if (answer < 0.05 || amp < 0.02) return;
        for (const q of places) {
          const d = Math.hypot(q.x - boat.x, q.z - boat.z);
          if (d > 44) { q.was = 0; q.near = 1e9; continue; }
          // a crest strikes this foot
          const s = strikeAt(q.x, q.z, 0) * q.str * sea01;
          if (s > 0.3 && q.was <= 0.3 && c.time - q.last > 2.5) {
            q.last = c.time; spray.strikes++;
            if (d < S.splashWithin && c.time - lastSplash > spray.splashEvery) { lastSplash = c.time; fire('splash', q.x, q.z, { strength: Math.min(1, s), distance: d, pitch: 0.7 }); }
            if (d < S.within) {
              const n = Math.round(lerp(S.rings[0], S.rings[1], clamp01((s - 0.3) / 0.6)) * Math.min(1.5, Math.max(0.4, rate)));
              for (let k = 0; k < n; k++) {
                // (where and when the set's flecks fall back: thrown at up to 8.5 m/s under its gentler gravity, carried out from the rock, along it, and down the weather)
                const v0 = 8.5 * (0.3 + 0.7 * rnd()) * Math.sqrt(Math.min(1, s)), T = 2 * v0 / 7.5, out = 0.2 + rnd(), al = (rnd() - 0.5) * 2.2, off = (rnd() - 0.5) * 2.6;
                sparks.landings.push({ t: c.time + 0.1 + T, x: q.x + q.nx * 0.3 - q.nz * off + (q.nx * out - q.nz * al + wx) * T, z: q.z + q.nz * 0.3 + q.nx * off + (q.nz * out + q.nx * al + wz) * T, k: 0.5 + 0.5 * rnd() });
              }
              if (rate > 1.05) { const h = c.water.heightAt(q.x, q.z); sparks.toss(q.x + q.nx * 0.3, h + 0.1, q.z + q.nz * 0.3, Math.round(12 * (rate - 1) * Math.min(1, s)), { up: [3, 7.5], out: [0.2, 1.2], nx: q.nx, nz: q.nz, spread: 1.1, gain: 1, level: h }); }
            }
          }
          q.was = s;
        }
        // the wake: the boat has passed within reach with way on; its wash reaches the foot a moment later (at the kit's own waterline
        // points; if the kit gives none, at the set's places as before)
        for (const q of (wakeFeet.length ? wakeFeet : places)) {
          const dx = q.x - boat.x, dz = q.z - boat.z;
          if (Math.abs(dx) > S.wake.within + 1 || Math.abs(dz) > S.wake.within + 1) { q.near = 1e9; continue; }
          const d = Math.hypot(dx, dz);
          if (d < S.wake.within && spd > S.wake.speedFrom) {
            if (d < q.near) q.near = d;
            else if (d > q.near + 0.35 && c.time - q.wakeAt > 6) {
              q.wakeAt = c.time;
              const far = q.near / S.wake.within, k = (1 - far * far) * smooth(S.wake.speedFrom, 2.2, spd);
              c.stage.after(q.near / 1.8 + (q.foot ? 0.25 * rnd() : 0), () => (q.foot ? lapAt(q, k) : washAt(q, k)));
              spray.wakes++;
            }
          } else if (d > S.wake.within + 1) q.near = 1e9;
        }
        // THE STORM'S OWN WATER. Behind the rain front the weather has come: at the feet that meet it, water is thrown up in sheets
        // (arcs of drops that rise two to five metres, hang, and fall back as sparks) as each crest strikes, and smaller ones between
        // crests, each place in its own time. The set's flecks are still thrown by every crest; this is what makes a shore in the
        // lit sea a shore in a storm. Little in the lamp's lee, none in the cave (the swell dies there), none before the front.
        const front = sea.T >= 0 && sea.front ? sea.front : null, lit = sea.uniforms.uSeaL.value.x, ST = S.storm;
        if (front && lit > 0.05 && spray.storm > 0 && c.time - stormPick > 0.5) {
          // (which of them throw now: the `max` nearest the boat; looked at twice a second, and a place only ever begins or ends between two of its sheets)
          stormPick = c.time;
          for (const q of storm) q.dNow = Math.hypot(q.x - boat.x, q.z - boat.z);
          storm.sort((a, b) => a.dNow - b.dNow);
          for (let i = 0; i < storm.length; i++) storm[i].stormOn = i < ST.max && storm[i].dNow < ST.reach;
        }
        if (params.has('edgeown') && c.time > 27 && !spray._dbg) { spray._dbg = true; console.error('EDGE_PROBE own ' + JSON.stringify(storm.filter((q) => q.own).map((q) => ({ x: +q.x.toFixed(1), z: +q.z.toFixed(1), on: q.stormOn, d: +q.dNow.toFixed(0), crests: q.crests || 0, high: q.lastHigh ? +q.lastHigh.toFixed(1) : 0, bh: front ? +front.behind(q.x, q.z).toFixed(0) : null, lee: +leeAt(q.x, q.z).toFixed(2), st: +strikeAt(q.x, q.z, 0).toFixed(2), sl: path.locate(q.x, q.z, 230, {}) })).map((o) => ({ ...o, sl: [+o.sl.s.toFixed(1), +o.sl.d.toFixed(1)] }))) + ' lit ' + lit.toFixed(2) + ' n ' + storm.length); }
        if (front && lit > 0.05 && spray.storm > 0) for (const q of storm) {
          if (!q.stormOn) continue;
          const d = Math.hypot(q.x - boat.x, q.z - boat.z); if (d > ST.reach) continue;
          const bh = front.behind(q.x, q.z); if (bh < 2) { q.stormWas = 0; continue; }
          const lee = leeAt(q.x, q.z), k0 = Math.min(1, bh / 14) * lit * (0.45 + 0.55 * lee) * sea01 * Math.min(2, spray.storm);
          // (the crest itself, whichever way the foot is turned: the swell runs ALONG the wall's face and the Prow's and breaks along them as
          // it goes. A side it only runs along throws less high; that is all)
          const st = strikeAt(q.x, q.z, 0);
          let k = 0;
          let crest = false;
          if (st > 0.3 && q.stormWas <= 0.3) { k = Math.min(1, 0.55 + 0.6 * st); crest = true; }      // a crest strikes it
          else if (d < ST.smallWithin && c.time > q.stormNext) k = lerp(ST.small[0], ST.small[1], rnd());      // between crests
          q.stormWas = st;
          // (lower in the lamp's lee, the calmest water of the realm; on a side turned from the weather; and with the swell itself: reduced motion leaves a third of it)
          k *= (0.2 + 0.8 * lee) * (ST.side + (1 - ST.side) * smooth(0.55, 0.9, q.str)) * (0.45 + 0.55 * Math.min(1, sea01));
          if (k <= 0 || k0 < 0.08 || q.calm) continue;
          q.stormNext = c.time + lerp(ST.between[0], ST.between[1], rnd());
          const h = c.water.heightAt(q.x, q.z);
          // (a sheet: its body, the dabs that make a mass of it, and its fingers, the gouts that rise out of the mass. Close to, many
          // small drops; from across the sound fewer and each a few pixels, so that the sheet at the wall's foot is still a body)
          const band = d < 32 ? 0 : d < 105 ? 1 : 2;
          // (far off its single drops are dust and are not thrown: the tongues carry it)
          const arcs = crest ? Math.round(lerp(ST.arcs[0], ST.arcs[1], k)) - band * 2 : [2 + (rnd() < 0.5 ? 1 : 0), 2, 1][band];
          // (in the lamp's lee fewer are thrown, and lower: never fainter, for a faint dab is a stain under the painter's brush)
          const body = Math.round((crest ? ST.body[band] * (0.6 + 0.4 * k) : ST.bodySmall[band]) * Math.min(1.25, spray.storm) * (0.3 + 0.7 * lee));
          sparks.sheet(q.x, h + 0.05, q.z, { arcs, per: crest ? ST.per[band] : [6, 4, 3][band], skirt: crest ? arcs * [2, 1, 0][band] : [5, 2, 0][band], body, puff: crest ? 1 : 0.75, thin: crest ? 1 : 0.85, along: crest ? lerp(2.0, 3.2, rnd()) : 1.8, nx: q.nx, nz: q.nz, high: [ST.high[0] * k, Math.min(5.7, ST.high[1] * k)], wind: [wx, wz], gain: ST.gain * Math.min(1, 0.55 + k0), big: smooth(20, 65, d), ring: d < S.within ? 0.2 : 0, level: h - 0.5 });      // (big: its drops keep a few pixels only where they are far off: within a few boat's lengths they are drops, a finger wide, or they are leaves in the air)
          spray.sheets++; if (crest) { spray.crests = (spray.crests || 0) + 1; q.crests = (q.crests || 0) + 1; q.lastHigh = Math.min(5.6, ST.high[1] * k); }
        }
      },
    };
    if (params.get('edgemark') === 'feet') {
      // (a developer's look, with &edgeeye: a yellow point at every place the wake may lap at, a red one over every place of the set's spray, an orange one over every place of the storm's own)
      const pos = [], col = [];
      for (const f of wakeFeet) { pos.push(f.x, 1.0, f.z); col.push(1, 1, 0.2); }
      for (const q of places) { pos.push(q.x, 1.0, q.z); col.push(1, 0.15, 0.2); }
      for (const q of storm) if (q.own) { pos.push(q.x, 1.0, q.z); col.push(1, 0.6, 0.1); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      const pm = new THREE.Points(g, new THREE.PointsMaterial({ size: 4, sizeAttenuation: false, vertexColors: true, depthTest: false, fog: false, transparent: true })      /* (transparent: drawn after the water, or the water paints over it) */); pm.frustumCulled = false; pm.renderOrder = 9; pm.name = 'edge: developer marks (feet)'; ctx.add(pm); ctx.only(pm, 'direct');
    }
    edge.spray = cast.spray = spray;
    if (debug) debug.spray = { places: places.length, fromSet: setMeshes.length, storm: storm.length, stormAt: storm.map((q) => { const l = path.locate(q.x, q.z, null, {}); return [Math.round(l.s), Math.round(l.d), Math.round(q.str * 100) / 100]; }) };
  }

  edge.marks = marks; edge.sparks = sparks;
  // (for staging's sound: how high the swell stands at a place, -1..1 of its greatest height, and how hard a crest is striking it now, 0..1:
  // "in the gate `deep` follows the surge")
  edge.swellAt = (x, z) => swellN(x, z, 0); edge.strikeAt = (x, z) => strikeAt(x, z, 0);

  // ---- developer's switches, to look at what staging will call (seconds are the realm's own; places are s:d):
  //   &edgeburst=<seconds>,<s>,<d>[,<high>]   spray.burst there      &edgebell=<seconds>[,<times>]   buoy.ring
  //   &edgelit=<seconds>                      floats.sequence({ buoy: true, bell: 2 })      &edgerags=<seconds>[,<strength>]   rags.lift
  //   &edgerate=<seconds>,<drips>,<spray>     the two rates      &edgesheet=<seconds>,<s>,<d>[,<high>,<dabs>]   one of the storm's sheets there, thrown up-route
  const tests = [], num = (k) => (params.get(k) || '').split(',').map(Number);
  if (params.has('edgeburst')) { const [at, bs, bd, high] = num('edgeburst'); tests.push({ at, run: () => { const q = kit.at(bs, bd); if (spray) spray.burst(q.x, q.z, { high: high || 3 }); } }); }
  if (params.has('edgesheet')) { const [at, bs, bd, high, body] = num('edgesheet'); tests.push({ at, run: () => { const q = kit.at(bs, bd), f = path.at(bs, {}), h = ctx.water.heightAt(q.x, q.z); sparks.sheet(q.x, h + 0.05, q.z, { arcs: 6, per: 7, skirt: 12, body: body || 8, along: 2, nx: -f.tx, nz: -f.tz, high: [0.45 * (high || 4), high || 4], gain: 1, big: 1, level: h - 0.5 }); } }); }
  if (params.has('edgebell')) { const [at, times] = num('edgebell'); tests.push({ at, run: () => { if (edge.buoy) edge.buoy.ring(times || 1); } }); }
  if (params.has('edgelit')) { const [at] = num('edgelit'); tests.push({ at, run: () => { if (edge.floats) edge.floats.sequence({ buoy: true, bell: 2 }); } }); }
  if (params.has('edgerags')) { const [at, k] = num('edgerags'); tests.push({ at, run: () => { if (edge.rags) edge.rags.lift(k || 0.55); } }); }
  if (params.has('edgerate')) { const [at, dr, sp] = num('edgerate'); tests.push({ at, run: () => { if (drips && dr >= 0) drips.rate = dr; if (spray && sp >= 0) spray.rate = sp; } }); }
  // (&edgeeye=<metres up>[,<metres back>]: a developer's look from above. The rider's eye is lifted so high (and set back) for this
  // picture only, to judge a thing's plan against the rock it stands at: where weed lies, where a drop lands. Put back when the area is left.)
  if (params.has('edgeeye')) {
    const [up, back] = num('edgeeye'), eye = ctx.engine.boat && ctx.engine.boat.eye;
    if (eye && up > 0) { const y0 = eye.position.y, z0 = eye.position.z; eye.position.y = up; if (back) eye.position.z = z0 + back; ctx.onDispose(() => { eye.position.y = y0; eye.position.z = z0; }); }
  }

  if (params.has('edgeprobe')) {
    const where = (x, z) => { const l = path.locate(x, z, null, tmp); return [Math.round(l.s * 10) / 10, Math.round(l.d * 10) / 10]; };
    const out = { debug, beds: (rocks.kelpBeds || []).map(([x, z]) => where(x, z)), drips: drips ? drips.points.map((q) => [...where(q.x, q.z), Math.round(q.y * 10) / 10]) : null, spray: spray ? spray.places.map((q) => [...where(q.x, q.z), Math.round(q.str * 100) / 100]) : null };
    fetch('/__shot/sea_e_probe.json', { method: 'POST', body: JSON.stringify(out) });
  }
  if (debug && params.has('edgedebug')) console.error('EDGE_PROBE (not an error) ' + JSON.stringify(debug));

  return {
    update(dt, c) {
      uNow.value = c.time;
      if (kelp) kelp.update(dt, c);
      if (afloat) afloat.update(dt, c);
      if (spray) spray.update(dt, c);
      landSparks(c);
      for (const t of tests) if (!t.done && c.time >= t.at) { t.done = true; t.run(c); }
      if (logAt > 0 && c.time >= logAt) {
        logAt = -1;
        console.error(`EDGE_PROBE (not an error) after ${c.time.toFixed(1)} s at s ${c.s.toFixed(0)}: rings of light ${marks.count || 0}, sparks thrown ${sparks.count || 0}; kelp dabs ${kelp ? kelp.dabbed : '-'}; drips landed near ${drips ? drips.landed + ' (on the boat ' + drips.onBoat + ')' : '-'}; lifts ${afloat ? afloat.lifts : '-'}, lit ${afloat ? afloat.lit : '-'}, bell strokes ${afloat ? afloat.bells + ' (at ' + afloat.bellTimes.join(' ') + ')' : '-'}; feet struck ${spray ? spray.strikes : '-'}, wake sprays ${spray ? spray.wakes : '-'}, storm sheets ${spray ? spray.sheets + ' (at a crest: ' + (spray.crests || 0) + ') from ' + spray.stormPlaces.length + ' places (drops taken back out of the air: ' + (sparks.cut || 0) + ')' : '-'}; events ${Object.keys(counts).map((k) => k + ' ' + counts[k]).join(', ')}`);
      }
    },
  };
}
