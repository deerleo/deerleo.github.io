// The orchard in snow: the place and its light (stage 1: layout and light).
//   - shared.frame       the page's frame for every module (see the header of plan.js)
//   - shared.light       the area's light (light.js): seen(), the materials, the remembered evening the water shows
//   - the two skies: the winter sky (seen directly) and the remembered dusk (seen only in the water)
//   - the land: the frozen flood, the river's banks (a snow blanket over a dark earth core), the rise the cliff is cut in
//   - the cave we are entered through (our half of the passage from the sea), the far shore, far snow veils, ice fog
//   - the light states of the page's table, driven by where the boat is (never by a clock)
//   - the water: its look, the skin ice and the black road the realm keeps open in it, the pin rings of landing snow
//   - the weather: the snowfall, with the petal that rises in the water to meet each flake (the cast takes this over)
// What later stages need from here is in `shared`: frame, here (the boat in the page's frame), light, seen, inWater, mat,
// memory, states (the look states), snowfall, sky, zFace (the world z of the cliff's face), land (its height).
import * as THREE from 'three';
import { FOG_PARS, NOISE_GLSL } from '../../engine/kit.js';
import { makeFall } from '../../engine/life/falls.js';
import { WATER_GLSL, waterUniforms } from '../../engine/water-final.js';
import { makeLight, LOOK, MIRROR_TINT, TRUTH_TINT } from './light.js';
import { SKY_ART, FAR_ART, SNOW_ART, SKIN_ART } from './art.js';
import { stick, ridge, lobeGeometry, tinted, merge, V, setBlossomTones } from './standins.js';

const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const Q = new URLSearchParams(location.search);

export async function build(ctx, plan, shared) {
  const { kit, engine } = ctx, path = ctx.path, C = plan.chip;
  const col = (c) => new THREE.Color(c);

  // ---------------------------------------------------------------------------------------------- the page's frame
  const tmpL = {};
  const F = shared.frame = {
    /** The page's (s, d, y) as a Vector3 in the realm. Use this for everything: kit.at is the page's frame only before s 58. */
    at: (s, d = 0, y = 0, target = new THREE.Vector3()) => (s < plan.straight ? kit.at(s, d, y, target) : target.set(d, y, -s)),
    /** rotation.y that points an object's -Z down the reference line at s. */
    heading: (s) => (s < plan.straight ? kit.headingAt(s) : 0),
    /** The realm's own (x, z) as the page's { s, d }. */
    locate: (x, z, out = {}) => { if (z <= -plan.straight) { out.s = -z; out.d = x; } else { const l = path.locate(x, z, null, tmpL); out.s = Math.min(plan.straight, l.s); out.d = l.d; } return out; },
    /** The page's (s, d) as { s, d } on the engine's path (a picture's address, a `near` cue). */
    toPath: (s, d = 0) => { if (s < plan.straight) return { s, d }; const l = path.locate(d, -s, null, {}); return { s: l.s, d: l.d }; },
    /** The path's arc length where the composed line reaches the page's s (for stage cues). */
    pathS: (s) => F.toPath(s, plan.lineD(s)).s,
  };
  /** The air, for whoever must go with it: open (0 in the birch river .. 1 once the plain has opened), thaw (0 .. 1 from s 228 to 246). */
  const air = shared.air = { open: 1, thaw: 0 };
  const here = shared.here = { s: 0, d: 0 };                 // the boat in the page's frame, kept up to date every frame
  {                                                          // the plan must stay true to the built path
    const a = path.at(plan.straight), off = Math.hypot(a.x - plan.lineD(plan.straight), a.z + plan.straight), worst = Math.max(...plan.pathS.map(([s, ps]) => Math.abs(F.pathS(s) - ps)));
    if (off > 0.2) console.error(`INVALID_PLAN snow: the path is ${off.toFixed(2)} m from (${plan.lineD(plan.straight)}, -58) at s 58: tune START_Z in plan.js`);
    if (worst > 1.5) console.error(`INVALID_PLAN snow: PATH_S in plan.js is ${worst.toFixed(1)} m off the built path (${plan.pathS.map(([s]) => `[${s}, ${F.pathS(s).toFixed(1)}]`).join(', ')})`);
  }
  const zFace = shared.zFace = kit.at(plan.cliff.s, 0).z, xFace = kit.at(plan.cliff.s, 0).x;      // the cliff's face lies in the plane z = zFace, facing the orchard

  // ---------------------------------------------------------------------------------------------- the light
  const light = shared.light = makeLight(ctx, plan), seen = light.seen, inWater = light.inWater, M = light.mat, memory = light.memory;
  shared.seen = seen; shared.inWater = inWater; shared.mat = M; shared.memory = memory; shared.paint = light.paint; shared.blossom = light.blossom;
  setBlossomTones(light.blossom);                            // (every stand-in lobe made after this is painted as the water is to show it)
  const ST = plan.light.states;
  // ---- the two tiles (fourth holder): `snow` on every snow surface, through the snow's own light; `skin_ice` as the
  // picture of the water's skin (before the light states take their copies of the water's look). &tiles=0 (developer): neither.
  if (Q.get('tiles') !== '0') {
    try {
      if (SNOW_ART) { const t = await ctx.tex(SNOW_ART.url, { repeat: true }); light.snowTile.value = t; light.snowTileLook.value.set(1 / SNOW_ART.metres, SNOW_ART.mean, 2.6, 0.3); }
      if (SKIN_ART && ctx.waterLook.skin) { const t = await ctx.tex(SKIN_ART.url, { repeat: true }); ctx.waterLook.skin.map = t; ctx.waterLook.skin.scale = SKIN_ART.metres; }
    } catch (err) { console.error(`INVALID_ART snow/set: a tile could not be loaded; the snow and the skin are drawn without it (${(err && err.message) || err})`); }
  }

  // ---------------------------------------------------------------------------------------------- the remembered sky
  // Memory: a second dome, drawn only in the water's mirror. The orchard's blue hour in this area's own violet ink:
  // ink at the zenith, indigo below it, a low violet band, five soft dark cloud bars; no stars, no apricot. This is what
  // makes the water black under a white sky from the first metre. In the thaw its colours are eased to the winter sky's.
  const memSky = { top: inWater(plan.light.memory.sky.top), mid: inWater(plan.light.memory.sky.mid), low: inWater(plan.light.memory.sky.low), band: inWater(plan.light.memory.sky.band), bar: inWater('#0F0D1E') };
  const memU = {
    uTop: { value: memSky.top.clone() }, uMid: { value: memSky.mid.clone() }, uLow: { value: memSky.low.clone() }, uBand: { value: memSky.band.clone() }, uBar: { value: memSky.bar.clone() }, uBars: { value: 0.75 },
    uVeilColor: engine.shared.uVeilColor, uVeil: engine.shared.uVeil,
  };
  {
    const dome = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 24), new THREE.ShaderMaterial({
      uniforms: memU, side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false,
      vertexShader: 'varying vec3 vDir; void main() { vDir = normalize(position); vec4 p = projectionMatrix * viewMatrix * vec4(position + cameraPosition, 1.0); gl_Position = p.xyww; }',
      fragmentShader: /* glsl */`
        uniform vec3 uTop, uMid, uLow, uBand, uBar, uVeilColor; uniform float uVeil, uBars; varying vec3 vDir;
        void main() {
          vec3 d = normalize(vDir);
          float e = asin(clamp(d.y, -1.0, 1.0)), az = atan(d.x, -d.z);
          // From an eye 1.1 m up, water 10 m off mirrors the sky 6 degrees up and water 40 m off the sky a degree and a
          // half up: the whole road is the lowest few degrees of this dome. So the violet band is a hair on the horizon
          // (the far end of the road), and by two degrees the sky is already dark.
          vec3 c = mix(uBand, uLow, smoothstep(0.003, 0.035, e));
          c = mix(c, uMid, smoothstep(0.03, 0.17, e));
          c = mix(c, uTop, smoothstep(0.15, 0.62, e));
          // five long level bars of cloud between 5 and 38 degrees, each broken along its length and none the same
          float bars = 0.0;
          for (int i = 0; i < 5; i++) {
            float fi = float(i), h = 0.085 + 0.14 * fi * (0.75 + 0.06 * fi) + 0.018 * sin(az * (1.0 + fi * 0.7) + fi * 2.1), w = 0.014 + 0.012 * fi;
            float along = 0.5 + 0.5 * sin(az * (1.3 + 0.37 * fi) + fi * 1.9 + 0.6 * sin(az * 3.1 + fi));
            bars = max(bars, smoothstep(w, 0.0, abs(e - h)) * smoothstep(0.12, 0.7, along));
          }
          c = mix(c, uBar, bars * uBars);
          gl_FragColor = vec4(mix(c, uVeilColor, uVeil), 1.0);
        }`,
    }));
    dome.name = 'the remembered sky (memory)'; dome.renderOrder = -1000; dome.frustumCulled = false;
    ctx.only(ctx.add(dome), 'mirror');
  }

  // ---------------------------------------------------------------------------------------------- the winter sky
  // Winter: seen directly, never in the water. Pearl at the horizon, lavender-grey above, darker than the ground.
  // The dome is the area's own (not kit.sky): its COLOURS are the page's table, state by state, exactly (a gradient,
  // each stop authored through seen()), and the painted panorama is laid over it as RELIEF only (the picture divided by
  // its own soft mean: cloud bellies in long bands, thin places, hanging streaks of far snow). kit.sky would show the
  // painting's own colours, which cannot follow three light states and whose pearl is only its lowest twentieth.
  // The gradient's middle stop stands 45 degrees up (kit.sky's default is 25): see 1-layout.md, "the sky".
  const skyOf = (st) => ({ top: seen(st.sky.top), mid: seen(st.sky.mid), horizon: seen(st.sky.horizon), below: seen(st.sky.below) });
  const skies = { birch: skyOf(ST.birch), plain: skyOf(ST.plain), thaw: skyOf(ST.thaw) };
  const pano = SKY_ART ? await ctx.tex(SKY_ART.url) : null;
  if (pano) { pano.wrapS = THREE.RepeatWrapping; pano.wrapT = THREE.ClampToEdgeWrapping; pano.needsUpdate = true; }
  const skyU = {
    uTop: { value: skies.plain.top.clone() }, uMid: { value: skies.plain.mid.clone() }, uHorizon: { value: skies.plain.horizon.clone() }, uBelow: { value: skies.plain.below.clone() },
    uMidAt: { value: plan.light.skyMidAt }, uRelief: { value: 1 }, uRotation: { value: SKY_ART ? SKY_ART.rotation : 0 }, uBand: { value: new THREE.Vector2(0, 1) },
    tPano: { value: pano }, uVeilColor: engine.shared.uVeilColor, uVeil: engine.shared.uVeil,
  };
  if (pano) { const lo = Math.atanh(Math.sin((SKY_ART.band[0] || -4) * Math.PI / 180)); skyU.uBand.value.set(lo, lo + 2 * Math.PI / (pano.userData.aspect || 3)); }     // (Mercator heights: the picture keeps its shapes, as kit.sky wraps it)
  const sky = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 24), new THREE.ShaderMaterial({
    uniforms: skyU, side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false,
    vertexShader: 'varying vec3 vDir; void main() { vDir = normalize(position); vec4 p = projectionMatrix * viewMatrix * vec4(position + cameraPosition, 1.0); gl_Position = p.xyww; }',
    fragmentShader: /* glsl */`
      uniform vec3 uTop, uMid, uHorizon, uBelow, uVeilColor; uniform float uVeil, uMidAt, uRelief, uRotation; uniform vec2 uBand; uniform sampler2D tPano;
      varying vec3 vDir;
      void main() {
        vec3 d = normalize(vDir);
        float e = asin(clamp(d.y, -1.0, 1.0)), t = clamp(e / 1.5708, 0.0, 1.0);
        vec3 c = t < uMidAt ? mix(uHorizon, uMid, smoothstep(0.0, uMidAt, t)) : mix(uMid, uTop, smoothstep(uMidAt, 1.0, t));
        c = mix(c, uBelow, smoothstep(0.0, -0.12, e));
        ${pano ? /* glsl */`
        float ua = (atan(d.x, -d.z) + uRotation) / 6.2831853, ub = fract(ua);
        float h = 0.5 * log((1.0 + d.y) / max(1e-5, 1.0 - d.y)), v = (h - uBand.x) / (uBand.y - uBand.x);
        vec2 uvA = vec2(ua + 0.5, v), uvB = vec2(ub + 0.5, v);
        vec2 gx = dFdx(uvA), gy = dFdy(uvA), hx = dFdx(uvB), hy = dFdy(uvB);
        if (dot(hx, hx) + dot(hy, hy) < dot(gx, gx) + dot(gy, gy)) { gx = hx; gy = hy; }       // (the angle jumps a whole turn behind the rider: take the slope from the copy that is smooth here)
        if (v > 0.0 && v < 1.0) {
          vec3 p = textureGrad(tPano, uvA, gx, gy).rgb, mean = textureLod(tPano, uvA, 8.0).rgb;
          // the painting as relief: lighter and darker than its own surroundings, never a colour of its own
          float rel = clamp(dot(p, vec3(0.3, 0.5, 0.2)) / max(dot(mean, vec3(0.3, 0.5, 0.2)), 0.05), 0.6, 1.5);
          // (fourth holder: to the power 2.2 the painting's soft bands came out as dirty blots, a smudged sky over
          // every picture. As painted, a little under: the bellies a breath darker, the thin places a breath lighter)
          rel = 1.0 + (rel - 1.0) * (rel < 1.0 ? 0.8 : 1.25);
          // (it fades out between 34 and 56 degrees up: a strip wrapped round the rider closes into rings about the
          // zenith, and looking up is to be a plain darker sky with snow coming out of it)
          float a = smoothstep(0.0, 0.1, v) * (1.0 - smoothstep(0.59, 0.98, e));
          c *= mix(1.0, rel, a * uRelief);
        }` : ''}
        gl_FragColor = vec4(mix(c, uVeilColor, uVeil), 1.0);
      }`,
  }));
  sky.name = 'the winter sky'; sky.renderOrder = -1000; sky.frustumCulled = false; ctx.only(ctx.add(sky), 'direct');
  shared.sky = sky;

  // ---------------------------------------------------------------------------------------------- the land
  // One snow surface (winter: never in the water) from the rise the cliff is cut in, down the river's banks, and out
  // over the frozen flood to the far shore, with the navigable water cut out of it along the shelf (plan.shelfLeft /
  // shelfRight; before s 58 the river's own edges). Under the river's banks lies their dark earth core (shared: the
  // water shows the banks as they were, without snow).
  const edge = (() => {                                      // the river's two edges as x at a world z (z from the cliff's face to -58)
    const L = [], R = [];
    for (let s = plan.cliff.s - 4; s <= plan.straight + 1; s += 0.5) { const a = path.at(s), hw = plan.band(s); L.push([a.z, a.x - a.rx * hw, a.z - a.rz * hw]); R.push([a.z, a.x + a.rx * hw, a.z + a.rz * hw]); }
    const at = (list, z) => { let k = 0; while (k < list.length - 2 && list[k + 1][2] > z) k++; const a = list[k], b = list[k + 1], f = clamp01((a[2] - z) / Math.max(1e-4, a[2] - b[2])); return a[1] + (b[1] - a[1]) * f; };
    return { left: (z) => at(L, z), right: (z) => at(R, z) };
  })();
  const CLIFF_HALF = plan.cliff.wide / 2 + 1;
  /** Where the water ends on one side (-1 left, +1 right) at a world z; beyond the cliff's face, where its rock ends. */
  const waterEdge = (side, z) => {
    if (z > zFace) return xFace + side * CLIFF_HALF;
    if (z > -plan.straight) return side < 0 ? edge.left(z) : edge.right(z);
    return side < 0 ? -plan.shelfLeft(-z) : plan.shelfRight(-z);
  };
  // (fourth holder) BRACKEN UNDER THE BLANKET (page: "dead bracken makes lumps under the blanket"): humps a stride across
  // on the faces and tops of the river's banks, no two alike. None at the bridge's feet (its gangways are let into the
  // bank there) and none on the plain. They are part of the snow's height, so whatever stands on a bank stands on them.
  const hashI = (i, j, k = 0) => { let n = (Math.imul(i, 374761393) + Math.imul(j, 668265263) + Math.imul(k, 1274126177)) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
  const bridgeZ = kit.at(plan.bridge.s, 0).z;
  const lumps = (x, z, o) => {
    if (o < 0.12 || o > 7) return 0;
    const atBridge = 1 - smooth(3.2, 5, Math.abs(z - bridgeZ)) * 1, clear = 1 - atBridge * smooth(1.6, 2.6, o);      // (none where the bridge's gangways are let into the bank: beyond its face, within 5 m of the bridge)
    if (clear <= 0) return 0;
    let h = 0;
    // two sizes: pillows a stride or two across (a clump of bracken, a stool of birch, bent double under the blanket),
    // and tufts a foot across among them
    for (const [G, keep, r0, r1, a0, a1, seed] of [[1.9, 0.62, 0.55, 0.5, 0.16, 0.24, 3], [0.95, 0.5, 0.24, 0.22, 0.07, 0.11, 7]]) {
      const gx = Math.floor(x / G), gz = Math.floor(z / G);
      for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
        const cx = gx + i, cz = gz + j, q3 = hashI(cx, cz, seed);
        if (q3 > keep) continue;                                                                        // (not every stride has one)
        const q1 = hashI(cx, cz, seed + 1), q2 = hashI(cx, cz, seed + 2), px = (cx + 0.15 + 0.7 * q1) * G, pz = (cz + 0.15 + 0.7 * q2) * G, rad = r0 + r1 * q3 / keep, d2 = ((x - px) * (x - px) + (z - pz) * (z - pz)) / (rad * rad);
        if (d2 < 4) h = Math.max(h, (a0 + a1 * q1) * Math.exp(-1.3 * d2));
      }
    }
    return h * smooth(0.12, 0.6, o) * (1 - smooth(4.5, 7, o)) * clear;
  };
  /** Height of the snow at a place: x, z in the realm; o = metres outward from the water's edge; side = -1 | +1. */
  const snowHeight = (x, z, o, side) => {
    const rim = 0.17 + 0.12 * kit.noise(z * 0.31, side * 3.1, 4);                                        // the shelf stands 0.15 to 0.3 m above the water
    const plain = rim + 0.1 * smooth(0, 0.7, o) + (0.03 + 0.12 * kit.fbm(x * 0.07, z * 0.045, 3, 5)) * smooth(0.8, 7, o);
    const bankness = smooth(-62.5, -53, z);                                                              // the banks sink into the shelf where the birches stop
    const oo = z > zFace ? o + 3 : o;                                                                    // beside the cliff there is no bank edge: the wood's floor
    const bank = 0.55 + 0.75 * smooth(0, 0.45, oo) + (0.45 + 0.95 * kit.fbm(z * 0.11, side * 7.3, 2, 9)) * smooth(0.3, 1.3, oo)
      + 0.9 * (kit.fbm(x * 0.06, z * 0.06, 3, 12) - 0.5) * smooth(2, 10, oo) - 1.5 * smooth(60, 110, oo) + (z > zFace ? 0 : lumps(x, z, o));
    const rise = 13 * smooth(zFace - 4, zFace + 60, z) * (1 - smooth(70, 240, Math.abs(x - xFace)));     // the rise the cliff is the face of
    return plain + bankness * (Math.max(bank, plain) - plain) + rise;
  };
  shared.land = { waterEdge, snowHeight, zFace, xFace };
  // (FOURTH HOLDER: THE BANK IS MADE, NOT CUT OUT. The layout's bank was a white slab with a ruled lip over a ruled dark
  // band. Page: "the cornice curls over a dark undercut where frozen earth and birch roots show". Now, along the river:
  //   - THE CORNICE: the blanket comes down the bank's face and ends in a ROLL that hangs over the water, 0.34 to 0.55 m
  //     out, a quarter to two fifths of a metre thick, its nose drooping in places, never twice alike. Its belly stays
  //     0.6 m over the water under the first 0.32 m (the Margins group hangs its icicles from exactly there: y 0.612).
  //     By the snow's own light (light.js: toned by how far a face looks up) the roll is paper on top, frost on its
  //     shoulder, lavender on its nose and deeper lavender underneath: it is drawn round.
  //   - THE UNDERCUT: the earth's own face under it, lumpy with frozen clods, darkest up under the lip, with pale
  //     roots let out of it here and there, and a thread of rim ice where it meets the water (winter).
  //   - rows every 0.4 m along the river (1.5 m before), and columns close enough for the lumps of bracken.
  // On the plain and at the river's mouth (where the Margins group's shelf stands on the land's rim) the rim is as it
  // was: the cornice comes in only where the bank is whole (bankness above 0.8, s under 55).)
  {
    const rows = [];
    for (let z = 130; z > zFace + 3; z -= 4) rows.push(z);
    for (let z = zFace + 3; z > -56; z -= 0.4) rows.push(z);
    for (let z = -56; z > -64; z -= 0.75) rows.push(z);
    for (let z = -64; z > -186; z -= 1.5) rows.push(z);
    for (let z = -186; z > -198; z -= 0.75) rows.push(z);                                               // (finer round the bay in the pond's rim)
    for (let z = -198; z > -240; z -= 1.5) rows.push(z);
    for (let z = -240; z >= -340; z -= 4) rows.push(z);
    const outs = [0.12, 0.25, 0.4, 0.6, 0.85, 1.1, 1.4, 1.75, 2.1, 2.5, 3.0, 3.6, 4.3, 5.2, 6.4, 8, 10.5, 14, 22, 36, 60, 100, 170, 300, 560];
    const LIP = 7, COLS = LIP + outs.length, FACE = [0, 0.42, 0.65, 0.84, 1], EOUT = [0.5, 1.6, 5, 14], ECOLS = FACE.length + EOUT.length;
    const pos = [], idx = [], epos = [], ecol = [], eidx = [], ipos = [], iidx = [], roots = [];
    const earthA = col(C.earth), earthB = col('#4B4256'), earthC = col('#17131F'), tc = new THREE.Color(), rootRnd = ctx.rng(61);
    for (const side of [-1, 1]) {
      const base = pos.length / 3, ebase = epos.length / 3, ibase = ipos.length / 3;
      let erow = 0, irow = 0;
      rows.forEach((z, r) => {
        const xe = waterEdge(side, z), b = z > zFace ? 0 : smooth(-62.5, -53, z), k = smooth(0.5, 0.97, b);
        const n1 = kit.noise(z * 0.23, side * 5.1, 21), n2 = kit.noise(z * 0.41, side * 2.7, 22), n3 = kit.noise(z * 0.17, side * 9.3, 23), n4 = kit.noise(z * 0.9, side * 1.3, 24);
        const yb = -0.35 + b * 0.95, h0 = snowHeight(xe, z, 0, side);
        // (the roll is never twice alike: it stands out further and thinner, or is a heavy lump close in; here and there it has
        // sagged and its nose hangs a hand lower; and its outline is scalloped where it dripped in the last thaw)
        const n5 = kit.noise(z * 1.6, side * 4.4, 25), n6 = kit.noise(z * 0.55, side * 8.2, 26), sag = smooth(0.62, 0.86, n6);
        const L = 0.32 * b + k * (0.03 + 0.17 * n1 + 0.1 * n4 * n5 - 0.03 * sag), droop = k * (0.02 + 0.1 * n2 * n2 + 0.16 * sag), t = k * (0.2 + 0.16 * n3 + 0.1 * (n5 - 0.5) + 0.06 * sag), top = yb + t;
        // the rim as a line of seven points from under the lip, round its nose and on to its top: the plain's rim (a
        // face from the foot to the snow's edge) eased into the cornice's roll by k
        const plainRim = [[-0.32 * b, yb], [-0.32 * b, yb], [-0.32 * b, yb], [-0.32 * b, yb + (h0 - yb) * 0.33], [-0.32 * b, yb + (h0 - yb) * 0.66], [-0.32 * b, h0], [-0.32 * b + 0.03, h0]];
        const roll = [[0.16, yb], [-0.5 * L, yb - 0.3 * droop], [-L + 0.03, yb - droop], [-L - 0.05, yb - droop + 0.09], [-L - 0.045, yb - droop + 0.2 + 0.4 * (t - 0.24)], [-L + 0.08, top], [-0.45 * L + 0.08, top + 0.05]];
        for (let c = 0; c < LIP; c++) pos.push(xe + side * (plainRim[c][0] + (roll[c][0] - plainRim[c][0]) * k), plainRim[c][1] + (roll[c][1] - plainRim[c][1]) * k, z);
        for (const o of outs) {
          const x = xe + side * o; let y = snowHeight(x, z, o, side);
          if (k > 0 && o < 0.7) y += k * Math.max(0, top + 0.05 - 0.35 * o - y);                         // (the roll's top runs back into the bank's face without a trough)
          pos.push(x, y, z);
        }
        if (r > 0) for (let c = 0; c < COLS - 1; c++) { const a = base + (r - 1) * COLS + c, bb = a + 1, d = a + COLS, e = d + 1; if (side > 0) idx.push(a, bb, d, bb, e, d); else idx.push(a, d, bb, bb, d, e); }
        // the earth core, only where there is a bank: its face under the lip, then its back under the snow
        if (b > 0.02 || (z > zFace && z < zFace + 6)) {
          FACE.forEach((f, c) => {
            const y = -0.6 + (yb + 0.64) * f, clod = kit.noise(z * 1.9 + c * 4.3, side * 3.7 + c, 31), o = c === FACE.length - 1 ? 0.2 : 0.01 + 0.13 * clod * b - 0.02 * c;
            epos.push(xe + side * o, y, z);
            tc.copy(earthA).lerp(earthB, smooth(0.55, 0.9, clod) * 0.8).lerp(earthC, c >= 3 ? 0.65 : c === 0 ? 0.3 : 0); ecol.push(tc.r, tc.g, tc.b);
          });
          for (const o of EOUT) { const x = xe + side * o; epos.push(x, Math.max(-0.3, snowHeight(x, z, o, side) - 0.42 - 0.2 * (1 - b)), z); ecol.push(earthA.r, earthA.g, earthA.b); }
          if (erow > 0) for (let c = 0; c < ECOLS - 1; c++) { const a = ebase + (erow - 1) * ECOLS + c, bb = a + 1, d = a + ECOLS, e = d + 1; if (side > 0) eidx.push(a, bb, d, bb, e, d); else eidx.push(a, d, bb, bb, d, e); }
          erow++;
          // a root let out of the face here and there: it comes out under the lip and goes down into the water, crooked
          if (k > 0.9 && Math.abs(z - bridgeZ) > 2.5 && rootRnd() < 0.085) {
            const o0 = 0.1 + 0.05 * rootRnd(), y0 = yb - 0.02, lean = (rootRnd() - 0.5) * 0.9, out = 0.1 + 0.22 * rootRnd(), rr = 0.018 + 0.03 * rootRnd();
            const A = V(xe + side * o0, y0, z), B = V(xe - side * out * 0.6, y0 - 0.22 - 0.1 * rootRnd(), z + lean * 0.4), Cc = V(xe - side * out, -0.12, z + lean);
            roots.push(stick(A, B, rr * 1.25, rr, 5), stick(B, Cc, rr, rr * 0.7, 5));
          }
        }
        // the rim ice at the bank's foot (winter): a thread of frost where the frozen earth meets the water
        if (k > 0.3) {
          const w = (0.07 + 0.24 * kit.noise(z * 1.3, side * 6.1, 41) + 0.08 * kit.noise(z * 4.7, side * 2.2, 42)) * k;
          ipos.push(xe + side * 0.08, 0.03, z, xe - side * w, 0.022, z);
          if (irow > 0) { const a = ibase + (irow - 1) * 2, bb = a + 1, d = a + 2, e = d + 1; if (side > 0) iidx.push(a, bb, d, bb, e, d); else iidx.push(a, d, bb, bb, d, e); }
          irow++;
        }
      });
    }
    const mesh = (p, i, mat, name, colors) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); if (colors) g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3)); g.setIndex(i); g.computeVertexNormals(); const m = new THREE.Mesh(g, mat); m.name = name; m.frustumCulled = false; return ctx.add(m); };
    ctx.only(mesh(pos, idx, M.snow, 'the frozen flood and the banks (snow)'), 'direct');
    // (the earth is the bank as the water remembers it, so it is shared; it wears the area's dusk like everything else)
    mesh(epos, eidx, light.paint({ color: '#ffffff', vertexColors: true, brush: 0.9 }), 'the banks (earth core)', ecol);
    if (iidx.length) ctx.only(mesh(ipos, iidx, M.frost, 'the banks: rim ice at the foot (winter)'), 'direct');
    if (roots.length) { const rm = new THREE.Mesh(merge(roots.map((g) => tinted(g, '#6A5F68'))), M.wood); rm.name = 'the banks: roots in the undercut'; rm.frustumCulled = false; ctx.add(rm); }
  }

  // ---------------------------------------------------------------------------------------------- the cave (the passage in)
  // Our half of the one basalt cave (the sea builds the other 25 m): 16 m of water, roof 9 to 12 m, one bend at s 12.
  // STAND-IN for the sea's column unit grown along both walls and for `cave_vault`: a faceted tube of basalt, and
  // columns standing along the water's edge. Shared (the water mirrors it); the frozen seep on the last 8 m and the
  // tongue of blown snow on the ledges from s 18 are winter.
  {
    const pp = (s, d, y) => { if (s >= 0) return kit.at(s, d, y); const a = path.at(0); return new THREE.Vector3(a.x + a.tx * s + a.rx * d, y, a.z + a.tz * s + a.rz * d); };
    const prof = [[-8.6, -1.2], [-9.1, 2.6], [-8.3, 6.2], [-5.6, 9.2], [0, 10.6], [5.6, 9.2], [8.3, 6.2], [9.1, 2.6], [8.6, -1.2]];
    const pos = [], colr = [], idx = [], rnd = ctx.rng(26), tints = ['#17142A', '#1a1730', '#141126', '#1d1a33', '#121022'].map(col);
    const ringsS = []; for (let s = -12; s <= plan.cliff.s - 2.4; s += 2) ringsS.push(s);                  // (it stops inside the rock: the cliff's own columns are the mouth's jambs and lip)
    ringsS.forEach((s, r) => {
      const a = path.at(Math.max(0, s)), grow = 1 + 0.12 * smooth(14, 26, s);                           // the roof lifts toward the mouth (9 to 12 m)
      prof.forEach(([d, y], c) => {
        const p = pp(s, d * (1 + 0.05 * (rnd() - 0.5)), y > 0 ? y * grow * (0.94 + 0.12 * rnd()) : y);
        pos.push(p.x, p.y, p.z);
        const t = tints[Math.floor(rnd() * tints.length)]; colr.push(t.r, t.g, t.b);
      });
      if (r > 0) for (let c = 0; c < prof.length - 1; c++) { const A = (r - 1) * prof.length + c, B = A + 1, D = A + prof.length, E = D + 1; idx.push(A, D, B, B, D, E); }
    });
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(colr, 3)); g.setIndex(idx); g.computeVertexNormals();
    // (inside the rock there is no bright air: the cave takes a tenth of the fog, or from the river it is a pale tunnel and not a black door)
    const caveMat = light.paint({ color: '#ffffff', vertexColors: true, brush: 0.7, flat: true, extend: { fog: 'fog *= 0.1;' } });
    const tube = new THREE.Mesh(g, caveMat); tube.name = 'standin:the cave (cave_vault, the sea\'s column unit)'; tube.frustumCulled = false; ctx.add(tube);
    // columns along both walls at the waterline (STAND-IN for the sea's column unit), in one draw
    const unit = tinted(new THREE.CylinderGeometry(0.5, 0.5, 1, 6), '#ffffff'); unit.translate(0, 0.5, 0);
    const cols = [];
    for (let s = -6; s < plan.cliff.s + 2; s += 0.85) for (const side of [-1, 1]) {
      const w = 0.75 + rnd() * 0.5, h = 1.2 + rnd() * rnd() * 5.5, p = pp(s + rnd() * 0.4, side * (8.25 + rnd() * 0.5), -1.2);
      if (p.z < zFace + 0.6) continue;
      cols.push({ position: p, rotation: [0.05 * (rnd() - 0.5), rnd() * 6.283, 0.05 * (rnd() - 0.5)], scale: [w, h + 1.2, w], color: tints[Math.floor(rnd() * tints.length)] });
    }
    kit.instances(unit, caveMat, cols).name = 'standin:cave columns (the sea\'s column unit)';
    // winter: the frozen seep on the last 8 m of both walls, and a tongue of blown snow on the ledges from s 18
    const seep = [];
    for (let i = 0; i < 9; i++) { const s = plan.cliff.s - plan.cave.seep + rnd() * (plan.cave.seep - 1.5), side = i % 2 ? 1 : -1, h = 1.5 + rnd() * 3.5, g2 = new THREE.CylinderGeometry(0.16, 0.5 + rnd() * 0.4, h, 5); g2.translate(0, h / 2, 0); const p = pp(s, side * 8.3, 0); g2.translate(p.x, p.y, p.z); seep.push(tinted(g2, C.frost)); }
    for (let s = plan.cave.snowFrom; s < plan.cliff.s + 1; s += 1.6) for (const side of [-1, 1]) { const w = 0.5 + 1.1 * smooth(plan.cave.snowFrom, plan.cliff.s, s), g2 = new THREE.SphereGeometry(1, 7, 4, 0, 6.283, 0, 1.4); g2.scale(1.0, 0.16 + 0.1 * rnd(), w); const p = pp(s, side * (8.2 - w * 0.4), 0.02); g2.translate(p.x, p.y, p.z); seep.push(tinted(g2, C.paper)); }
    const sm = new THREE.Mesh(merge(seep), M.ice); sm.name = 'standin:cave seep and blown snow (winter)'; sm.frustumCulled = false; ctx.only(ctx.add(sm), 'direct');
    // behind the path's first point the cave is closed by the veil's own colour, unfogged (the dark the rider came out of)
    const dark = new THREE.Mesh(new THREE.PlaneGeometry(22, 16), new THREE.MeshBasicMaterial({ color: col(plan.light.veil), fog: false, side: THREE.DoubleSide }));
    const dp = pp(-11.5, 0, 6), a0 = path.at(0); dark.position.copy(dp); dark.lookAt(dp.x + a0.tx, 6, dp.z + a0.tz); dark.name = 'the dark of the cave'; ctx.add(dark);
  }

  // ---------------------------------------------------------------------------------------------- far things
  // The far shore: a painted ring 480 m off, 26 m tall (page picture 3). Winter above; in the water a dark copy of it
  // closes the remembered evening's horizon.
  if (FAR_ART) {
    const tex = await ctx.tex(FAR_ART.url), FS = plan.farShore, cx = FS.about[1], cz = -FS.about[0], R = FS.radius, n = 180;
    tex.wrapS = THREE.MirroredRepeatWrapping; tex.needsUpdate = true;                                     // every other repeat mirrored: no seam, and no two neighbours alike
    const reps = Math.max(2, Math.round(2 * Math.PI * R / FAR_ART.metres / 2) * 2);
    const ring = (tintHex, layer, name, fog) => {
      const flat = kit.flat(tex, { width: 10, height: 10, position: [0, 0, 0], face: 0, cutout: false, fog, tint: tintHex, uv: [0, FAR_ART.v[0], 1, FAR_ART.v[1]] });
      const pos = [], uv = [], idx = [];
      for (let i = 0; i <= n; i++) { const a = i / n * Math.PI * 2, u = i / n * reps, base = pos.length / 3; pos.push(cx + Math.sin(a) * R, FAR_ART.foot, cz - Math.cos(a) * R, cx + Math.sin(a) * R, FAR_ART.foot + FAR_ART.height, cz - Math.cos(a) * R); uv.push(u, 0, u, 1); if (i < n) idx.push(base, base + 2, base + 1, base + 1, base + 2, base + 3); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeBoundingSphere();
      flat.geometry.dispose(); flat.geometry = g; flat.frustumCulled = false; flat.name = name;
      return ctx.only(flat, layer);
    };
    shared.farShore = { winter: ring('#ffffff', 'direct', 'the far shore (painted, winter)', 0.2), memory: ring(inWater('#34304E'), 'mirror', 'the far shore (painted, memory)', 0.0) };
  }
  // Snow veils: six curtains of far snowfall, 240 to 520 m off to the left and to the right, 300 to 500 m wide and
  // 220 m tall (page cast 18). One mesh of curved sheets, one draw, winter.
  // (FOURTH HOLDER: MADE. The layout's sheets were a noise cut at a threshold: grey blots and smears on the sky of
  // every picture, and the curtain to the left filled the whole of postcard 4. A veil is now what far snowfall is:
  //   - each sheet is TWO OR THREE SHAFTS with clear sky between them, each shaft dense in its middle and feathered at
  //     its sides; it hangs from the cloud (it fades into the sky upward, there is no top edge) and comes down to the
  //     plain, where the ice fog and the far shore take its foot;
  //   - inside a shaft the snow falls in fibres, slanted eight degrees down the wind and stretched twelve to one, and
  //     the fibres fall slowly (4 m/s: at 300 m, a crawl) and lean with the wind's gusts;
  //   - the nearer veils are a step darker than the far ones (wash, chip 4, through 250 to 500 m of air), never
  //     darker than the far orchard: they are the furthest plane but one;
  //   - `shared.veils.material.uniforms.uDrift` (metres) carries the whole pattern west along its sheets: the cast
  //     drives it (0.5 m/s: page cast 18); `uAlpha` is how much of them there is (the light states turn them down
  //     in the river, where the snowfall hides them).)
  {
    const VV = plan.veils, rnd = ctx.rng(18), pos = [], uv = [], aux = [], idx = [], cx = 0, cz = -130;
    const sheets = [[-62, 300, 360], [-104, 420, 470], [-132, 250, 320], [58, 330, 400], [96, 500, 500], [128, 270, 300]];       // [degrees to the right of ahead, metres off, metres wide]
    for (const [deg, r, wide] of sheets) {
      const a0 = deg * Math.PI / 180, half = wide / r / 2, n = 20, seed = rnd() * 50, near = 1 - smooth(250, 500, r);
      for (let i = 0; i <= n; i++) { const a = a0 - half + i / n * half * 2, base = pos.length / 3; pos.push(cx + Math.sin(a) * r, -2, cz - Math.cos(a) * r, cx + Math.sin(a) * r, VV.tall, cz - Math.cos(a) * r); uv.push(i / n, 0, i / n, 1); aux.push(seed, wide, near, seed, wide, near); if (i < n) idx.push(base, base + 2, base + 1, base + 1, base + 2, base + 3); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('aAux', new THREE.Float32BufferAttribute(aux, 3)); g.setIndex(idx);
    const sh = engine.shared, mat = new THREE.ShaderMaterial({
      uniforms: { uTime: sh.uTime, uVeil: sh.uVeil, uVeilColor: sh.uVeilColor, uColor: { value: seen(C.wash) }, uFar: { value: seen(C.washFar) }, uAlpha: { value: 0.42 }, uDrift: { value: 0 }, uTall: { value: VV.tall } },
      transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false,
      vertexShader: `attribute vec3 aAux; varying vec2 vUv; varying vec3 vAux; void main() { vUv = uv; vAux = aAux; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */`${NOISE_GLSL} uniform vec3 uColor, uFar; uniform float uAlpha, uTime, uDrift, uTall, uVeil; varying vec2 vUv; varying vec3 vAux;
        void main() {
          float wide = vAux.y, x = vUv.x * wide + uDrift, y = vUv.y * uTall;      // metres along the sheet and up it
          // the sheet's own breadth, feathered; and in it two or three shafts with clear sky between
          float sides = smoothstep(0.0, 0.22, vUv.x) * (1.0 - smoothstep(0.78, 1.0, vUv.x));
          float shafts = smoothstep(0.34, 0.66, vnoise(vec2(x / 105.0 + vAux.x, 3.7)) * 0.7 + vnoise(vec2(x / 41.0 + vAux.x * 1.7, 9.1)) * 0.3);
          // it hangs from the cloud: nothing at its top, most at a third of its height, and it stands on the plain
          float hang = (1.0 - smoothstep(0.3, 0.92, vUv.y)) * smoothstep(0.0, 0.035, vUv.y);
          // fibres of falling snow: slanted eight degrees down the wind, twelve times as long as they are broad, falling
          float lean = 0.14 + 0.03 * sin(uTime * 0.05 + vAux.x);
          vec2 q = vec2((x + y * lean) / 15.0, (y + uTime * 4.0) / 180.0 + vAux.x);
          float fibre = vnoise(q) * 0.6 + vnoise(q * vec2(2.7, 1.9) + 5.3) * 0.4;
          float body = sides * shafts * hang;
          float a = body * (0.5 + 0.5 * smoothstep(0.25, 0.8, fibre)) * uAlpha * mix(0.62, 1.0, vAux.z) * (1.0 - uVeil);
          if (a < 0.004) discard;
          gl_FragColor = vec4(mix(uFar, uColor, 0.35 + 0.65 * vAux.z), a);
        }`,
    });
    const m = new THREE.Mesh(g, mat); m.name = 'snow veils (cast 18)'; m.frustumCulled = false; m.renderOrder = 1; ctx.only(ctx.add(m), 'direct');
    shared.veils = m;
  }
  // Ice fog: a layer 0.2 to 0.9 m deep over the plain beyond 60 m (page cast 24). One draw, winter.
  // (FOURTH HOLDER: A LAYER, NOT A BANK. kit.mist's cards are 0.42 times as tall as they are wide: set out 34 to 64 m
  // wide over the plain they stood 14 to 27 m tall, and veiled every far thing to its crown: the frieze of the orchard,
  // the pollards and the hedge were grey ghosts, and nothing said where the plain ended. The fog is the page's now: long
  // low banks 50 to 110 m long and a metre and a half deep at most, lying ON the plain from 60 m off, thick at the
  // foot and gone by a man's height; it creeps (0.3 m/s) and breathes. What stands in it loses its feet and seems to
  // float (the far rows, the pollards, the fence's far end, the deer); what stands above it is drawn in ink again.
  // `shared.iceFog` is the mesh, as before; its uniforms: uOpacity, uDrift (m/s).)
  {
    const rnd = ctx.rng(24), n = kit.count(84), off = new Float32Array(n * 4), aux = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const side = i % 2 ? 1 : -1, s = 30 + rnd() * 290, d = side * (62 + rnd() * rnd() * 250);
      off.set([d, 0.12, -s, 50 + rnd() * 60], i * 4); aux.set([rnd() * 100, 0.9 + rnd() * 1.1, rnd() < 0.5 ? -1 : 1], i * 3);      // (aux: seed, how deep it stands in metres, which way it creeps)
    }
    const geo = new THREE.InstancedBufferGeometry(), base = new THREE.PlaneGeometry(1, 1);
    geo.index = base.index; geo.setAttribute('position', base.attributes.position); geo.setAttribute('uv', base.attributes.uv);
    geo.setAttribute('aOffset', new THREE.InstancedBufferAttribute(off, 4)); geo.setAttribute('aAux', new THREE.InstancedBufferAttribute(aux, 3)); geo.instanceCount = n;
    const sh = engine.shared, mat = new THREE.ShaderMaterial({
      uniforms: { uTime: sh.uTime, uFogColor: sh.uFogColor, uFogDensity: sh.uFogDensity, uVeil: sh.uVeil, uVeilColor: sh.uVeilColor, uColor: { value: seen('#EFEAF1') }, uOpacity: { value: 0.3 * Math.sqrt(84 / n) }, uDrift: { value: 0.3 } },
      transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide, forceSinglePass: true,
      vertexShader: /* glsl */`
        attribute vec4 aOffset; attribute vec3 aAux; uniform float uTime, uDrift; varying vec2 vUv; varying float vDist, vSeed;
        void main() {
          vUv = uv; vSeed = aAux.x;
          vec3 c = (modelMatrix * vec4(aOffset.xyz, 1.0)).xyz;
          c.x += (uTime * uDrift * 0.35 * aAux.z + sin(uTime * 0.05 + aAux.x) * 5.0 * uDrift); c.z += cos(uTime * 0.04 + aAux.x * 1.3) * 5.0 * uDrift;
          // a bank stands on the plain: its foot at the snow, its top its own depth above it; broadside to the eye
          vec4 mv = viewMatrix * vec4(c, 1.0);
          vec3 up = (viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz;
          mv.x += position.x * aOffset.w;
          mv.xyz += up * ((position.y + 0.5) * aAux.y);
          vDist = length(mv.xyz);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */`
        uniform vec3 uColor; uniform float uOpacity, uTime; ${FOG_PARS} ${NOISE_GLSL}
        varying vec2 vUv; varying float vDist, vSeed;
        void main() {
          // long and low: feathered at both ends, thickest at the foot, torn along its top
          float ends = smoothstep(0.0, 0.3, vUv.x) * (1.0 - smoothstep(0.7, 1.0, vUv.x));
          float n = vnoise(vec2(vUv.x * 7.0 + vSeed + uTime * 0.01, vSeed * 1.7)), top = 0.55 + 0.45 * n;
          float up = 1.0 - smoothstep(0.1 * top, top, vUv.y);
          float a = ends * up * (0.65 + 0.35 * vnoise(vec2(vUv.x * 19.0 - uTime * 0.02 + vSeed, vUv.y * 2.0))) * uOpacity;
          a *= smoothstep(45.0, 80.0, vDist) * (1.0 - uVeil);
          if (a < 0.003) discard;
          gl_FragColor = vec4(uColor, a);
        }`,
    });
    const m = new THREE.Mesh(geo, mat); m.name = 'ice fog'; m.frustumCulled = false; m.renderOrder = 5; ctx.only(ctx.add(m), 'direct');
    shared.iceFog = m;
  }

  // ---------------------------------------------------------------------------------------------- the light states
  // Exactly the page's table: fog, sky and snowfall by stretch. `cave` is the birch river seen with the eye still
  // adjusted to the dark (exposure 0.62 at s 22, eased to 1.02 by s 32, which is 3.5 s as the boat comes out).
  const fogOf = (st) => ({ color: seen(st.fog.color), density: st.fog.density });
  const W = plan.water, bg = seen(plan.light.background);
  // (fourth holder: `deep`, the cave before its mouth. With the river's pale fog from the first metre, everything far
  // inside the cave was that fog mixed with the veil's dark: a flat grey wall where the way out should be. The cave's
  // own air is the dark the rider came out of, so that what is far is lost in it, the seep and the blown snow are
  // found by the lantern, and the mouth comes up out of the dark as the boat nears it: grey at s 12, pale at s 20,
  // white as the boat passes under the icicle fringe.)
  const L = ctx.lookStates({
    plain: { look: { fog: fogOf(ST.plain), background: bg } },
    deep: { look: { fog: { color: seen('#17151F'), density: ST.birch.fog.density }, background: seen('#17151F'), exposure: 0.62 } },
    cave: { look: { fog: fogOf(ST.birch), background: bg, exposure: 0.62 } },
    birch: { look: { fog: fogOf(ST.birch), background: bg } },
    thaw: { look: { fog: fogOf(ST.thaw), background: bg }, water: { waveHeight: W.thaw.waveHeight, reflectionTint: TRUTH_TINT } },
  });
  shared.states = L;
  const held = Q.has('state') ? Q.get('state') : null;       // &state=deep|cave|birch|plain|thaw: hold one light state wherever the boat is
  const iceFogOpacity = shared.iceFog ? shared.iceFog.material.uniforms.uOpacity.value : 0;

  // ---------------------------------------------------------------------------------------------- the weather
  // (8 November, the cast, group "Falls": THE SNOWFALL IS THE CAST'S NOW. It was made here for the light states to be
  // judged with it; cast.js has taken it over as it stood (the same fall with its twin, minPixels 8.5, farAlpha 0.9 and
  // the sky colour kept), publishes shared.snowfall, and drives its density by light state and the petals' coming and
  // going. The two lines of `update` below that speak to `snowfall` do nothing any more.)
  const snowfall = null;

  // ---------------------------------------------------------------------------------------------- the water
  // The realm's look is in snow.js (plan.water). Here: the black road. The skin ice lies wall to wall, so the open
  // water is a lane the realm keeps open: written into the trace every frame (one cheap batch). Left as ice: the
  // road's margins, the bay at the avenue's mouth (the boat breaks its own road there), the water in among the inner
  // trunks, the pond's outer 3 m.
  const lead = [];
  {
    // the river and the cave: all of it. From s 58 on: plan.openHalf about the reference line.
    for (let s = -4; s < plan.straight; s += 4) { const a = path.at(Math.max(0, s)), b = path.at(Math.min(plan.straight, s + 4.2)); lead.push({ x0: a.x, z0: a.z, x1: b.x, z1: b.z, r: plan.band(s + 2) + 1.5, soft: 0.1 }); }
    // (written as short strokes ACROSS the road, 2 m apart: a stroke along it would round its ends by its own half width, and
    // eat 8 m off either end of the bay)
    for (let s = plan.straight; s < 330; s += 2) { const w = plan.openHalf(s); if (w > 0.8) lead.push({ x0: -(w - 1.0), z0: -s, x1: w - 1.0, z1: -s, r: 1.5, soft: 0.5 }); }
    const P = plan.pondOpen; lead.push({ x0: P.at[1], z0: -P.at[0], x1: P.at[1], z1: -P.at[0], r: P.r, soft: 0.12 });
    for (const b of plan.pond.bays) lead.push({ x0: b.at[1], z0: -b.at[0], x1: b.at[1], z1: -b.at[0] - 0.1, r: b.r - 1.2, soft: 0.4 });
  }
  shared.lead = lead;
  // (about 150 lines of the 512 the water takes in a frame. A lane written at 1 takes most of a minute to close, so the
  // road is written four times a second, not every frame, and at once whenever the realm becomes the current one: the
  // rest of the trace's budget is the cast's. docs/water.md, "Before you start", 2.)
  // (FOURTH HOLDER: THE ROAD IS STANDING WATER NOW. The water keeps what is written once with channel 'bare': it reads
  // exactly as a lane, ice cracks and parts at its ragged edge, and it never closes: "the black road stays open for
  // ever, whatever the ice does". So the road is written ONCE, when the realm becomes the current one, and costs
  // nothing after that frame; the trace's whole budget of lines is the cast's. The hull's own lane through the bay and
  // the margins is still a lane, and closes behind the boat as before. &road=lane (developer): the old way, a lane
  // rewritten four times a second.)
  const roadAsLane = Q.get('road') === 'lane';
  let leadSince = 1, roadStands = false;
  const writeRoad = (w) => {
    const tr = (w || ctx.water).trace; if (!tr || !tr.line) return false;
    for (const l of lead) tr.line(l.x0, l.z0, l.x1, l.z1, { channel: 'bare', radius: l.r, strength: 1, soft: l.soft });
    return true;
  };
  const writeLead = (dt = 1) => {
    const tr = ctx.water.trace; if (!tr || !tr.active) return;
    if (!roadAsLane) { if (!roadStands) roadStands = writeRoad(ctx.water); return; }
    if ((leadSince += dt) < 0.25) return;
    leadSince = 0;
    for (const l of lead) tr.line(l.x0, l.z0, l.x1, l.z1, { radius: l.r, strength: 1, soft: l.soft });
  };
  if (ctx.water.onBind) ctx.water.onBind(ctx.path, (w) => { leadSince = 1; roadStands = roadAsLane ? false : writeRoad(w); });

  // ---------------------------------------------------------------------------------------------- the lamp's stroke on the water
  // "The one warm thing in the area, and it must plainly be a stroke of light on the water" (the director; the layout's
  // was a column six pixels wide standing in the mirror: heroes.js, taken out below by its name). It is the water's own:
  // LIGHT LYING ON THE SURFACE between the lit lamp and whoever looks, where the facets of barely moving water throw
  // the flame at the eye. Its shape is that law's, and the key painting's:
  //   - it starts at the lamp's image, where it is one unbroken light no wider than the lantern, and runs from there
  //     ALL THE WAY TO THE EYE (and a short way back toward the lamp's foot), widening as it comes: under the bow it is
  //     a fourteenth of the picture across. From the plain, 110 m off, it is a broken line of amber down the whole of
  //     the black road;
  //   - it is laid in level DABS OF PAINT, no two alike: each its own length, thickness, lean and place, pointed at
  //     both ends, some rows two dabs, some none; close and merging near the image, further apart and larger toward the
  //     eye (their pitch grows with the slope of the eye's ray, so that on the screen they grow as the key's do);
  //     smaller crumbs of light lie out beyond them. Each comes and goes by itself and the whole drifts slowly;
  //   - pale gold in the middle of a dab near the image, amber its body, ember at its ends and far down the stroke;
  //     and under it all a soft breadth of amber on the water, so that the black round it is warm.
  // The living water breaks it (a ring or the wake leans the facets and the dabs shift), skin ice lets only a breath
  // of it through, pans and the hull cover it (it is drawn on the surface and tested against what stands on it), mist
  // and the veil take it, and it goes with the thaw (memory.amount) and comes with the opening of the plain
  // (air.open). Where the islet stands between lamp and eye there is none. Nothing in it is bright enough to bloom
  // (bloom is laid over the whole picture, and it veiled the hull).
  // One draw, in the direct view only. &stroke=0 hides it (developer); &strokew=0.03,0.07 its two half breadths (radians at the eye).
  const strokeW = (Q.get('strokew') || '').split(',').map(Number);
  const strokeU = {
    ...waterUniforms(engine), uTime: engine.shared.uTime, uFogDensity: engine.shared.uFogDensity, uVeil: engine.shared.uVeil,
    uLamp: { value: F.at(plan.lamp.flame[0], plan.lamp.flame[1], plan.lamp.flame[2]) }, uLevel: { value: 0 },
    // (the chips, a hair under themselves: #FFB45E as SEEN asks for a red of 6 in the picture's own units, which blooms)
    uAmber: { value: seen('#F4AE58') }, uCore: { value: seen('#F9DFA8') }, uEmber: { value: seen('#D9783A') },
    uShape: { value: new THREE.Vector4(strokeW[0] > 0 ? strokeW[0] : 0.05, strokeW[1] > 0 ? strokeW[1] : 0.105, 0.1, 46) },      // half its breadth as an angle at the lamp's image and at the eye's end; how far a facet may lean; rows of dabs (see the shader)
  };
  const stroke = new THREE.Mesh(new THREE.PlaneGeometry(2, 1, 2, 72), new THREE.ShaderMaterial({
    uniforms: strokeU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
    vertexShader: /* glsl */`
      uniform vec3 uLamp; uniform vec4 uShape;
      varying vec4 vS; varying vec3 vW; varying vec3 vAx;
      void main() {
        vec2 E = cameraPosition.xz, ax = uLamp.xz - E; float D = max(length(ax), 0.01); ax /= D;
        float he = max(abs(cameraPosition.y), 0.25), rImg = D * he / (he + uLamp.y);
        float rNear = max(1.0, 0.05 * rImg), rFar = max(rNear + 0.1, min(D - 0.25, rImg + 0.8 * (D - rImg)));
        float r = he / mix(he / rFar, he / rNear, uv.y), u = r / rImg;                    // (spaced evenly on the screen: by the slope below the horizon)
        // the sheet is 2.6 times as broad as the dabs' own reach: the breath of light round them
        // (its breadth is an angle at the eye: broad toward the eye, the lantern's own breadth and a half at the image, a
        // little less on toward the lamp's foot; and from far off, where the lantern is a point, all of it is finer)
        float halfW = 2.6 * r * mix(uShape.y, uShape.x, smoothstep(0.0, 1.0, u)) * (1.0 - 0.4 * smoothstep(1.0, 3.0, u)) * mix(1.0, 0.42, smoothstep(30.0, 110.0, D));
        vec2 p = E + ax * r + vec2(-ax.y, ax.x) * (position.x * halfW);
        vS = vec4(position.x, r, rImg, D); vW = vec3(p.x, 0.006, p.y); vAx = vec3(ax, he);
        gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.0);
      }`,
    fragmentShader: /* glsl */`
      ${WATER_GLSL}
      uniform vec3 uLamp, uAmber, uCore, uEmber; uniform vec4 uShape; uniform float uLevel, uTime, uFogDensity, uVeil;
      varying vec4 vS; varying vec3 vW; varying vec3 vAx;
      float h1(float n) { return fract(sin(n * 127.1) * 43758.5453); }
      float vn1(float x) { float i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f); return mix(h1(i), h1(i + 1.0), f); }
      float h2(vec2 p) { vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
      float vn2(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h2(i), h2(i + vec2(1.0, 0.0)), f.x), mix(h2(i + vec2(0.0, 1.0)), h2(i + vec2(1.0, 1.0)), f.x), f.y); }
      void main() {
        float x = vS.x * 2.6, r = vS.y, rImg = vS.z, D = vS.w, he = vAx.z;      // (x: 1 = the reach of the dabs; the sheet is wider)
        vec2 ax = vAx.xy, sd = vec2(-ax.y, ax.x);
        vec4 rip = waterRipple(vW.xz);
        // how far from the lamp's image, in the eye's own measure (0 at the image, negative toward the eye); the living
        // water shifts it: a ring or the wake leans the facets, and the dabs slide and break
        float lr = log(max(r / rImg, 1e-3)) + dot(rip.xy, ax) * 3.5, away = abs(lr);
        float reach = exp(-lr * lr / (lr < 0.0 ? 5.5 : 0.9));                              // (bright at the image; it runs on to the eye, and a short way back to the lamp's foot)
        float xs = x + dot(rip.xy, sd) * 4.0;
        float apart = smoothstep(0.02, 0.3, away);
        // the stroke wanders as a whole: its middle is not a ruled line
        float slope = he / r;
        xs += (vn1(slope * 7.0 + 1.7) - 0.5) * 0.55 * apart;
        // BROKEN PAINT, not a ladder (third holder): the light is a field of level lozenges, laid where a slow noise,
        // drawn out five to one along the water's level, stands above a mark. The mark is low along the stroke's
        // middle and near the lamp's image (there the lozenges run together into one light) and rises toward its
        // edges and its far ends (there they are few, small and apart). Finer slivers lie among them. Rows are
        // measured by the slope of the eye's ray, so on the screen the lozenges grow toward the eye as paint does.
        float rv = uShape.w * pow(slope, 0.6);
        float drift = uTime * 0.045;
        float big = vn2(vec2(xs * 0.95 + 2.2 * vn1(rv * 0.9), rv * 2.6 + drift));
        float mid = vn2(vec2(xs * 1.9 + 11.3, rv * 5.8 - drift * 1.7));
        float fine = vn2(vec2(xs * 3.7 + 3.1, rv * 12.5 + drift * 2.3));
        float field = big * 0.52 + mid * 0.33 + fine * 0.15;
        float env = exp(-xs * xs * 1.3);                                                     // densest along the middle
        float mark = mix(0.30, 0.49, apart) + 0.30 * (1.0 - env) + 0.15 * (1.0 - reach);
        float edge = 0.02 + 0.03 * apart;
        float dab = smoothstep(mark, mark + edge, field) * (1.0 - smoothstep(0.9, 1.15, abs(xs)));
        float inside = clamp((field - mark) / 0.16, 0.0, 1.0);                               // how deep inside its lozenge: gold in the middle, ember at the rim
        // crumbs of light out beyond the stroke: small, sparse, each coming and going
        float rc = rv * 2.3 + 11.0, ic = floor(rc), fc = fract(rc);
        float cx = (h1(ic + 1.9) - 0.5) * 3.2, cl = 0.06 + 0.1 * h1(ic + 8.3);
        float crumb = (1.0 - smoothstep(0.6, 1.0, length(vec2((xs - cx) / cl, (fc - 0.5) / 0.3)))) * step(0.66, h1(ic + 4.4)) * smoothstep(0.25, 0.42, vn1(ic * 2.9 + uTime * 0.5)) * apart * (0.3 + 0.7 * reach);
        float breath = exp(-xs * xs * 0.7) * (0.25 + 0.75 * reach);                      // a soft breadth of amber under the paint: the black round it is warm
        // the pool of light at the image itself (the lantern in the water is small: this is what is seen of it from far off)
        float head = exp(-xs * xs * 3.2) * exp(-away * away * 70.0), pool = exp(-xs * xs * 1.1 - away * away * 5.0);
        float open = max(waterTrace(vW.xz).a, waterTrace(vW.xz).g), ice = mix(0.16, 1.0, smoothstep(0.3, 0.6, open));       // (skin ice keeps a sixth of a mirror; standing open water is the trace's green)
        float dist = length(vW - cameraPosition), fog = exp(-uFogDensity * uFogDensity * dist * dist);
        float gate = (1.0 - smoothstep(0.86, 1.0, abs(vS.x))) * uLevel * ice * fog * (1.0 - uVeil);
        float lit = dab * (0.5 + 0.5 * reach);
        // (fourth holder) THE SPINE: one unbroken thread of light down the middle of the dabs, from the lamp's image to
        // the eye, wavering in breadth and beaded along its length. Dabs alone, from the plain, were a scatter of thin
        // dashes on the tree's own pink; with the thread through them it is plainly ONE stroke at any distance.
        float spineW = mix(0.13, 0.3, smoothstep(25.0, 110.0, D)) * (0.7 + 0.6 * vn1(rv * 3.1 + uTime * 0.21));
        float spine = exp(-xs * xs / (spineW * spineW)) * (0.3 + 0.7 * reach) * (0.5 + 0.5 * smoothstep(0.2, 0.62, vn1(rv * 8.0 - uTime * 0.55)));
        vec3 body = mix(uEmber, uAmber, clamp(inside * 1.6 * (0.45 + 0.75 * reach), 0.0, 1.0));
        body = mix(body, uCore, clamp(inside * reach * 1.25 - 0.25, 0.0, 0.85));
        vec3 col = body * lit + uAmber * (crumb * 0.8) + mix(uEmber, uAmber, 0.4) * (breath * 0.085 + pool * 0.16) + uCore * (head * 0.45) + mix(uAmber, uCore, 0.45 * reach) * (spine * 0.85);
        col *= gate;
        if (max(col.r, max(col.g, col.b)) < 0.003) discard;
        gl_FragColor = vec4(col, 1.0);
      }`,
  }));
  stroke.name = 'the lamp\'s stroke on the water'; stroke.frustumCulled = false; stroke.renderOrder = 2; ctx.only(ctx.add(stroke), 'direct');
  shared.stroke = stroke;
  const strokeOn = Q.get('stroke') !== '0', treeAt = F.at(plan.tree.at[0], plan.tree.at[1], 0);
  let theirStroke = 0;                                         // (frames spent looking for the column the layout left in heroes.js)

  // &proof=1 (developer): the lying mirror by itself. One bare tree with snow on it above the water, the same tree in
  // blossom in the water, beside the road at (124, +5).
  if (Q.has('proof')) {
    const wood = [], snow = [], lobes = [], top = V(0, 2.6, 0);
    wood.push(tinted(stick(V(0, -1, 0), V(0, 1.8, 0), 0.25, 0.21, 10), C.limewash), tinted(stick(V(0, 1.8, 0), top, 0.21, 0.19, 10), C.barkPaint));
    for (let i = 0; i < 5; i++) { const a = i * 1.257 + 0.3, e = V(Math.cos(a) * 1.6, 4.4, Math.sin(a) * 1.6), f = V(Math.cos(a + 0.2) * 3.6, 5.4 + (i % 2), Math.sin(a + 0.2) * 3.6); wood.push(tinted(stick(top, e, 0.11, 0.08, 6), C.barkPaint), tinted(stick(e, f, 0.08, 0.03, 6), C.barkPaint)); snow.push(ridge(top, e, 0.1), ridge(e, f, 0.05, 0.1)); const g = lobeGeometry(10, 6, i + 1); g.scale(3.4, 3.2, 3.4); g.translate(f.x * 0.8, 4.6 + (i % 2) * 0.5, f.z * 0.8); lobes.push(g); }
    { const g = lobeGeometry(10, 6, 9); g.scale(3.6, 3.4, 3.6); g.translate(0, 6, 0); lobes.push(g); }
    const p = F.at(124, 5, 0), put = (geo, mat, layer) => { const m = new THREE.Mesh(geo, mat); m.position.copy(p); m.frustumCulled = false; ctx.add(m); if (layer) ctx.only(m, layer); return m; };
    put(merge(wood), M.wood, null).name = 'proof: wood (shared)'; put(merge(snow), M.snowPaint, 'direct').name = 'proof: snow (winter)'; put(merge(lobes), M.blossom, 'mirror').name = 'proof: blossom (memory)';
    ctx.addCollider({ x: p.x, z: p.z, r: 0.4 });
  }

  // ---------------------------------------------------------------------------------------------- every frame
  const mixSky = (a, b, k) => { for (const key of ['top', 'mid', 'horizon', 'below']) skyU['u' + key[0].toUpperCase() + key.slice(1)].value.copy(a[key]).lerp(b[key], k); };
  const tmpC = new THREE.Color();
  return {
    update(dt) {
      const boat = ctx.boat;
      if (boat.z <= -plan.straight) { here.s = -boat.z; here.d = boat.x; } else { here.s = Math.min(plan.straight, boat.s); here.d = boat.d; }
      const s = here.s, LS = plan.light;
      // ---- the light states, by where the boat is
      let inCave = 1 - smooth(LS.cave.until, LS.cave.by, s), open = smooth(LS.birch.until, LS.birch.by, s), thaw = smooth(LS.thaw.from, LS.thaw.to, s);
      let deep = 1 - smooth(LS.cave.deepUntil, LS.cave.deepBy, s);
      if (held) { inCave = held === 'cave' || held === 'deep' ? 1 : 0; deep = held === 'deep' ? 1 : 0; open = inCave || held === 'birch' ? 0 : 1; thaw = held === 'thaw' ? 1 : 0; }
      L.set({ deep: inCave * deep, cave: inCave * (1 - deep), birch: (1 - inCave) * (1 - open), plain: (1 - inCave) * open * (1 - thaw), thaw: (1 - inCave) * open * thaw });
      // (the far veils of snow and the ice fog are the plain's: in the river the snowfall hides them)
      if (shared.veils) shared.veils.material.uniforms.uAlpha.value = (0.12 + 0.38 * open) * (1 - 0.3 * thaw);
      if (shared.iceFog) shared.iceFog.material.uniforms.uOpacity.value = iceFogOpacity * open * (1 - 0.5 * thaw);
      // (after L.set, which writes the whole look) the current follows the page's stretches
      ctx.look.current = ctx.look.currentNarrow = plan.currentAt(s);
      // ---- the winter sky follows the states; in the river the painted cloud is lost in the snowfall
      if (open < 1) mixSky(skies.birch, skies.plain, open); else mixSky(skies.plain, skies.thaw, thaw);
      skyU.uRelief.value = (0.25 + 0.75 * open) * (1 - 0.4 * thaw);                                        // (in the river the painted cloud is all but lost in the snowfall)
      // ---- the snowfall: 20,000 in the river, 12,000 on the plain and in the orchard, thinning to 3,000 by s 250
      if (snowfall) snowfall.density = (ST.birch.flakes + (ST.plain.flakes - ST.birch.flakes) * open + (ST.thaw.flakes - ST.plain.flakes) * smooth(LS.thaw.from, 250, s)) / plan.count.flakes
        * (0.02 + 0.98 * smooth(plan.cave.white + 2, plan.cliff.s + 4, s));                                // (in the cave only single flakes drift in; the fall begins under the icicle fringe)
      // ---- the water lets go: from s 228 the remembered evening is eased to the winter's own sky, and the mirror tells the truth again
      const lie = memory.amount = held === 'thaw' ? 0 : 1 - thaw;
      light.blossomSnowBlind.value = 1 - open; air.open = open; air.thaw = thaw;
      light.blossomMemory.value = smooth(0.08, 0.8, lie);                                                // (the blossom thins out and is gone a little before the sky has finished turning)
      { const lp = memory.lamp; light.blossomLamp.value.set(lp.position.x, lp.position.y, lp.position.z, lp.position.y > -50 ? Math.min(1.6, lp.level) * lie : 0); }      // (the lit lamp warms the blossom it hangs under: light.js, `holds`)
      memU.uTop.value.copy(memSky.top).lerp(tmpC.copy(skyU.uTop.value), 1 - lie); memU.uMid.value.copy(memSky.mid).lerp(tmpC.copy(skyU.uMid.value), 1 - lie);
      memU.uLow.value.copy(memSky.low).lerp(tmpC.copy(skyU.uHorizon.value), 1 - lie); memU.uBand.value.copy(memSky.band).lerp(tmpC.copy(skyU.uHorizon.value), 1 - lie); memU.uBars.value = 0.75 * lie;
      if (snowfall && snowfall.twin) snowfall.twin.visible = lie > 0.02 && s > 70;                       // petals rise from s 76 to s 246 (page cast 2)
      writeLead(dt);
      // ---- the lamp's stroke: where the lit lamp is, how brightly it burns (heroes.js keeps memory.lamp), and whether the islet stands between
      {
        if (theirStroke < 240) { theirStroke++; const o = ctx.group.getObjectByName('kept lamp: its stroke on the water (memory)'); if (o && o.parent) { o.parent.remove(o); theirStroke = 1e9; } }      // (the layout's column in the mirror: the stroke is the water's own now)
        const lp = memory.lamp.position.y > -50 ? memory.lamp.position : null, U = strokeU.uLamp.value;
        if (lp) U.copy(lp);
        const cam = engine.shared.uCameraPos.value, ex = cam.x - U.x, ez = cam.z - U.z, D2 = ex * ex + ez * ez, D = Math.sqrt(D2);
        // the islet between lamp and eye: how near the line from one to the other passes the bole
        const t = D2 > 0.01 ? ((treeAt.x - U.x) * ex + (treeAt.z - U.z) * ez) / D2 : 0, off = Math.hypot(U.x + ex * clamp01(t) - treeAt.x, U.z + ez * clamp01(t) - treeAt.z);
        const clear = t > 0 ? smooth(4.5, 8, off) : 1;
        strokeU.uLevel.value = strokeOn ? clamp01(memory.lamp.level) * (1 + 0.5 * Math.max(0, memory.lamp.level - 1)) * lie * open * clear * smooth(1.5, 5, D) * (1 + 0.2 * smooth(40, 125, D)) : 0;      // (fourth holder: from the plain it is a little MORE, not a third less: it lies on the great tree's own pink there)
        stroke.visible = strokeU.uLevel.value > 0.01;
      }
    },
  };
}
