// The town below: the place and its light. The sky and its lit cloud, the far backdrops, the lake bed and the hill,
// fog and mist, the four light states of the page, the far water's glow, the water's character and the current.
// Stage 1 laid it out; stage 2d (the place, its light and its water) made it what it is now: docs/build/town/2-light.md.
//
// Developer switches (address):  &tw=key:value,...  override water look keys   &tl=exposure:1.2,...  override look keys
//                                &sheet=<gain> (0 = no glow sheet)   &cloud=0  no light on the cloud   &mist=0  no mist
//                                &far=0  no backdrops   &reach=<s>  pretend the boat has already been this far
//                                &lean=0  the rider does not lean out   &waterfog=0  no water between (the town in air)   &rings=1  test rings
//                                &tu=uTownSurf.w:0,...  set a component of one of the light's uniforms (x y z w, or r g b)
//                                &tc=uTownDeep:122c3e,...  set one of the light's colours whole (hex without the #)
import * as THREE from 'three';
import { FOG_PARS, NOISE_GLSL } from '../../engine/kit.js';
import { ensureLight, TOWN_GLSL } from './light.js';
import { buildSurface } from './surface.js';

const Q = new URLSearchParams(typeof location !== 'undefined' ? location.search : '');
const overrides = (key) => (Q.get(key) || '').split(',').map((kv) => kv.split(':')).filter((p) => p.length === 2).map(([k, v]) => [k.trim(), /^-?[\d.]+$/.test(v) ? +v : v.trim()]);
const num = (k, d) => (Q.has(k) && Q.get(k) !== '' && !Number.isNaN(+Q.get(k)) ? +Q.get(k) : d);


export async function build(ctx, plan, shared) {
  // (the workbench behind &lv=2 is gone: set2.js, light2.js and surface2.js were, at the end of stage 2, copies of this
  // file, light.js and surface.js to the byte, loaded by nothing else: removed at the critique, 8 November)
  const { kit } = ctx, sh = ctx.engine.shared;
  if (Q.has('wg') && !Number.isNaN(+Q.get('wg'))) plan.gain.window = +Q.get('wg');      // &wg=<gain>: try another gain for the windows (the set builds first; the kit reads plan.gain.window when it builds)
  const light = ensureLight(ctx, plan, shared), town = light.town, U = light.U;
  const col = (c) => new THREE.Color(c);
  const fogU = { uFogColor: sh.uFogColor, uFogDensity: sh.uFogDensity, uVeil: sh.uVeil, uVeilColor: sh.uVeilColor, uCameraPos: sh.uCameraPos, uTime: sh.uTime };

  // ---- the developer's overrides, before the states are made from the look (the look and the water themselves are plan.js's)
  // (a key may be nested: &tw=sheen.still:0.5,sheen.color:%236a6f9a ; a value beginning with # is a colour)
  const setKey = (root, k, v) => { const path = k.split('.'); let o = root; for (let i = 0; i < path.length - 1; i++) { if (!o[path[i]] || typeof o[path[i]] !== 'object' || o[path[i]].isColor) o[path[i]] = {}; o = o[path[i]]; }
    const key = path[path.length - 1]; if (o[key] && o[key].isColor) o[key].set(v); else o[key] = typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v) ? new THREE.Color(v) : v; };
  // (a rider who asked for reduced motion: the standing water bends what lies beneath half as far; the wake's own bending is the look's)
  if (ctx.reducedMotion && typeof ctx.waterLook.tremor === 'number' && ctx.waterLook.tremor > 0) ctx.waterLook.tremor *= 0.5;
  for (const [k, v] of overrides('tw')) setKey(ctx.waterLook, k, v);
  for (const [k, v] of overrides('tl')) setKey(ctx.look, k, v);
  if (Q.get('boattone')) setKey(ctx.look, 'boat.tone', '#' + Q.get('boattone'));      // &boattone=b8b0c4: try another tone for the rider's boat
  let uOver = [], cOver = [];      // (&tu= and &tc=: filled in once the sky's own uniforms exist, so that they can be tried too)

  // (the ride's dry-brush tile: every painted surface wears it and the water's sheen is cut from it; it arrives a moment
  // after the engine starts, so the area waits for it here, or a picture taken at once would be painted with a flat grey)
  try { const t = await ctx.engine.loadTexture('art/shared/drybrush.webp', { repeat: true }); ctx.engine.releaseTexture(t); } catch (err) { /* the flat stand-in stays */ }
  const [skyTex, farTex, farMeta] = await Promise.all([
    ctx.tex('art/town/sky.webp').catch(() => null), ctx.tex('art/town/far.webp').catch(() => null),
    fetch('assets/art/town/far.json').then((r) => r.json()).catch(() => null),
  ]);

  // ---------------------------------------------------------------------------------------------- the sky
  // A low overcast with no light of its own: the darkest thing in the picture. Its colours are the light state's own
  // (top, mid, horizon: the horizon is the air's colour, so no line shows where far water meets sky); the painted
  // panorama (source-art/town/sky.png) gives it its cloud, as lighter bellies and darker furrows over that colour; and
  // the town draws itself on the underside of the cloud at 70 m in soft old rose, brightest over the square: where a
  // ray of sight meets the cloud's underside, the glow map is read (blurred) and lights the painted bellies. Lit, not
  // glowing. Low down a band of violet mist stands in front of it all: the palest thing above the water, and what the
  // far water mirrors.
  const S = plan.tone;
  const skyU = {
    ...U, uVeil: sh.uVeil, uVeilColor: sh.uVeilColor,
    uTop: { value: col(S.arrival.sky.top) }, uMid: { value: col(S.arrival.sky.mid) }, uHorizon: { value: col(S.arrival.sky.horizon) }, uMidAt: { value: 0.1 },
    tPano: { value: skyTex }, uBand: { value: new THREE.Vector2() }, uRotation: { value: 0.51 }, uCloudK: { value: new THREE.Vector4(skyTex ? 0.9 : 0, plan.vista.cloud, Q.get('cloud') === '0' ? 0 : num('cloud', 0.15), 1) },      // (w: how much of the town's flush on the cloud the air lets through: little in the mist at the door)
    uFlush: { value: col('#a65e8c') }, uMistK: { value: 22 },
    uLow: { value: col(S.arrival.sky.low || S.arrival.sky.mid) }, uLowK: { value: new THREE.Vector4(0.115, 0.075, 0, 1.7) },      // the low sky: its colour; x y where the band stands and how wide it is (radians of elevation), z how much of it there is (the light state's), w how strongly the painted cloud is drawn (an exponent)
  };
  const UU = skyU;                                                               // every uniform a developer may override: the light's and the sky's
  uOver = overrides('tu').map(([k, v]) => { const [name, comp] = k.split('.'); return { name, comp, v }; }).filter((o) => UU[o.name]);
  cOver = overrides('tc').filter(([k]) => UU[k] && UU[k].value && UU[k].value.isColor).map(([k, v]) => ({ name: k, c: new THREE.Color('#' + String(v).replace('#', '').padStart(6, '0')) }));      // &tc=uTownDeep:122c3e,... one of the light's colours, whole
  if (skyTex) { const lo = Math.atanh(Math.sin(-4 * Math.PI / 180)); skyU.uBand.value.set(lo, lo + 2 * Math.PI / (skyTex.userData.aspect || 2.58)); skyTex.wrapS = THREE.RepeatWrapping; skyTex.wrapT = THREE.ClampToEdgeWrapping; skyTex.needsUpdate = true; }
  const sky = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 24), new THREE.ShaderMaterial({
    uniforms: skyU, side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false,
    vertexShader: /* glsl */`varying vec3 vDir; void main() { vDir = normalize(position); vec4 p = projectionMatrix * viewMatrix * vec4(position + cameraPosition, 1.0); gl_Position = p.xyww; }`,
    fragmentShader: /* glsl */`
      ${TOWN_GLSL}
      uniform vec3 uTop, uMid, uHorizon, uVeilColor, uFlush, uLow; uniform float uMidAt, uVeil, uRotation, uMistK; uniform vec2 uBand; uniform vec4 uCloudK, uLowK; uniform sampler2D tPano;
      varying vec3 vDir;
      void main() {
        vec3 d = normalize(vDir);
        float e = asin(clamp(d.y, -1.0, 1.0)), t = clamp(e / 1.5708, 0.0, 1.0);
        vec3 c = t < uMidAt ? mix(uHorizon, uMid, smoothstep(0.0, uMidAt, t)) : mix(uMid, uTop, smoothstep(uMidAt, 0.6, t));
        // the low sky: seen at a glance, the overcast is lit from beneath by the whole town at once: a band of plum rose
        // stands above the far hills, which are dark against it (the key painting's sky: its lightest part is its lowest),
        // and the water mirrors it: the plum mirror of the middle lake
        { float lb = (e - uLowK.x) / uLowK.y; c = mix(c, uLow, exp(-lb * lb) * uLowK.z); }
        float belly = 0.5;
        if (uCloudK.x > 0.0) {
          float ua = (atan(d.x, -d.z) + uRotation) / 6.2831853, ub = fract(ua);          // the same angle with its jump behind the rider, and ahead
          float h = 0.5 * log((1.0 + d.y) / max(1e-5, 1.0 - d.y)), v = (h - uBand.x) / (uBand.y - uBand.x);
          vec2 uvA = vec2(ua + 0.5, v), uvB = vec2(ub + 0.5, v);
          vec2 gx = dFdx(uvA), gy = dFdy(uvA), hx = dFdx(uvB), hy = dFdy(uvB);
          if (dot(hx, hx) + dot(hy, hy) < dot(gx, gx) + dot(gy, gy)) { gx = hx; gy = hy; }
          float vv = clamp(v, 0.004, 0.996);
          vec3 p = textureGrad(tPano, vec2(uvA.x, vv), gx, gy).rgb, pb = textureLod(tPano, vec2(uvA.x, vv), 6.5).rgb;
          vec3 ratio = p / max(pb, vec3(0.004));
          float a = uCloudK.x * smoothstep(-0.02, 0.05, v) * (1.0 - smoothstep(0.46, 0.82, v));
          c *= mix(vec3(1.0), pow(ratio, vec3(uLowK.w)), a);
          belly = clamp((dot(ratio, vec3(0.3, 0.5, 0.2)) - 0.72) * 1.5, 0.0, 1.6) * a + 0.5 * (1.0 - a);
        }
        if (uCloudK.z > 0.0 && d.y > 0.015) {                                             // the town's light on the underside of the cloud
          float tt = (uCloudK.y - cameraPosition.y) / d.y;
          vec2 hit = cameraPosition.xz + d.xz * tt;
          vec4 g = mix(townGlowSoft(hit, 6.0), townGlowSoft(hit, 7.5), 0.6);                 // the cloud is far above the lamps: only the town's broad shape reaches it
          // (the cloud answers two seconds behind the windows: the breath that runs down the valley, and the stroke's ring)
          float rr = distance(hit, uTownTower.xy);
          vec2 late = uTownFlare.y > 0.0 ? uTownTower.xy + (hit - uTownTower.xy) * ((rr + 32.0) / max(rr, 1.0)) : hit;
          float lv = g.r * townWake(townS(g) + 12.9, late, -1.0, g.a);
          c += uFlush * (lv * (0.35 + 0.65 * belly) * uCloudK.z * uCloudK.w * 1.8 * exp(-tt * tt * 0.0000045));
        }
        // the mist that stands low all round, in front of the cloud's foot (the air's own colour: far water, mist and sky are one)
        c = mix(c, uHorizon, exp(-max(e, 0.0) * uMistK) * 0.88);
        gl_FragColor = vec4(mix(c, uVeilColor, uVeil), 1.0);
      }`,
  }));
  sky.name = 'town-sky'; sky.renderOrder = -1000; sky.frustumCulled = false; ctx.add(sky); shared.sky = sky;

  // ---------------------------------------------------------------------------------------------- the far backdrops
  // Painted strips on curved rails (source-art/town/far.png): two ranges of hills all round at 600 and 420 m, and on the
  // right the unlit upper town continuing up its hill at 260 m. Each stands in the air of its distance: a constant
  // share of the air's colour, more of it when the air is thick (the arrival's mist hides them all), and more of it
  // toward its foot, where the mist lies on the water. They are cooler AND DARKER than the sky behind them (the key
  // painting's hills are a dark blue violet against a low sky of lit plum: fourth holder; they were paler than the sky,
  // pale shapes in a haze): each range one value step nearer the air.
  if (farTex && farMeta && Q.get('far') !== '0') {
    const cells = [...farMeta.cells].sort((a, b) => a.source_box[1] - b.source_box[1]);       // as painted, top to bottom: far hills, near hills, the town
    const centre = town.xz(130, 0);
    const ring = (cell, { radius, y0, height, repeat, arc, tint, air, order, mist }) => {
      const geo = new THREE.CylinderGeometry(radius, radius, height, arc ? 64 : 128, 1, true, arc ? arc[0] : 0, arc ? arc[1] : Math.PI * 2);
      const mat = new THREE.ShaderMaterial({
        uniforms: { ...fogU, tFar: { value: farTex }, uCell: { value: new THREE.Vector4(cell.uv[0], cell.uv[1], cell.uv[2] - cell.uv[0], cell.uv[3] - cell.uv[1]) }, uRing: { value: new THREE.Vector4(repeat, air, arc ? 1 : 0, mist) }, uTint: { value: col(tint) }, uSpan: { value: new THREE.Vector2(y0, height) } },
        transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false,
        vertexShader: /* glsl */`varying vec2 vUv; varying float vY; void main() { vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vY = w.y; gl_Position = projectionMatrix * viewMatrix * w; }`,
        fragmentShader: /* glsl */`
          uniform sampler2D tFar; uniform vec4 uCell, uRing; uniform vec3 uTint, uFogColor, uVeilColor; uniform vec2 uSpan; uniform float uFogDensity, uVeil; varying vec2 vUv; varying float vY;
          void main() {
            float u = vUv.x * uRing.x, tri = 1.0 - abs(1.0 - fract(u * 0.5) * 2.0);                 // every other repeat mirrored: the ends always meet
            vec4 t = texture2D(tFar, uCell.xy + vec2(mix(0.02, 0.98, tri), clamp(vUv.y, 0.01, 0.99)) * uCell.zw);
            float air = 1.0 - exp(-pow(uFogDensity * uRing.y, 2.0));
            float a = t.a * (1.0 - smoothstep(0.75, 1.0, air)) * (1.0 - uVeil);
            if (uRing.z > 0.5) a *= smoothstep(0.0, 0.08, vUv.x) * (1.0 - smoothstep(0.92, 1.0, vUv.x));
            if (a < 0.004) discard;
            float low = exp(-max(vY - max(uSpan.x, 0.0), 0.0) / uRing.w);                          // the mist that lies at its foot (on the water; or, for the strip that stands on the hill, at its own foot: where it runs out past the hill its lower edge hung in the air as a dark cut band)
            a *= 1.0 - smoothstep(0.6, 1.0, low) * step(1.0, uSpan.x);
            if (a < 0.004) discard;
            gl_FragColor = vec4(mix(t.rgb * uTint, uFogColor, clamp(air + low * 0.75, 0.0, 1.0)), a);
          }`,
      });
      const m = new THREE.Mesh(geo, mat); m.position.set(centre[0], y0 + height / 2, centre[1]); m.renderOrder = order; m.frustumCulled = false; m.name = 'town-backdrop'; ctx.add(m); return m;
    };
    const along130 = town.along(130);                                              // the hill is to the right of the route: +Z of the route's frame there
    const farAir = num('farair', 1), farTint = (Q.get('fartint') || '').split(',').map((h) => (h ? '#' + h : null));      // &farair=<k>, &fartint=hex,hex,hex: try other airs and tints
    shared.backdrops = [
      ring(cells[0], { radius: plan.vista.backdrops.hillsFar, y0: -4, height: 70, repeat: 4, tint: farTint[0] || '#3c3e7c', air: 123 * farAir, order: -960, mist: 16 }),
      ring(cells[1], { radius: plan.vista.backdrops.hillsNear, y0: -4, height: 64, repeat: 4, tint: farTint[1] || '#34367a', air: 98 * farAir, order: -950, mist: 12 }),
      ring(cells[2], { radius: plan.vista.backdrops.town, y0: 13, height: 46, repeat: 2, arc: [along130 - 1.25, 2.5], tint: farTint[2] || '#3a3470', air: 76 * farAir, order: -940, mist: 9 }),
    ];
  }

  // ---------------------------------------------------------------------------------------------- the lake bed and the hill
  // One sheet of ground from the layout's ground(s, d): the streets' floor falling away under the route, the terraces
  // of the uphill side, the hill above the water on the right, the far shore beyond the theatre. Its paving is drawn in
  // its own material, by where a place lies along the route (so it stays with the street as the street turns):
  //   - the square: flags laid in rings round the tower, each a little lighter or darker than its neighbours, with their
  //     joints (the page's "joints of the square's paving radiating from the tower": straight things for the water to
  //     bend); the circular rail the hour ring rides on, let into the paving; twelve pale hour stones outside it;
  //   - the street: kerbs along the carriageway, a drain down its middle, a crossing of larger flags every 14 m.
  // No line under water is thinner than 6 cm, and each melts into the stone when it is too far to hold.
  // (It stands in for `square_paving` and the bed of `leat_and_quay` until the kit's models lie on it; `hillside` is this.)
  {
    const cell = 4, x0 = -340, x1 = 200, z0 = -470, z1 = 190, nx = Math.round((x1 - x0) / cell), nz = Math.round((z1 - z0) / cell);
    const pos = new Float32Array((nx + 1) * (nz + 1) * 3), colr = new Float32Array((nx + 1) * (nz + 1) * 3), sdv = new Float32Array((nx + 1) * (nz + 1) * 2), idx = new Uint32Array(nx * nz * 6);
    const under = col(plan.local.paving), flag = col('#7c6c9a'), yard = col('#5a4e74'), land = col(plan.local.hill), c = new THREE.Color(), SQ = plan.square, ST = plan.street;
    for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) {
      const x = x0 + i * cell, z = z0 + j * cell, q = town.sd(x, z), y = town.ground(q.s, q.d), o = (j * (nx + 1) + i) * 3;
      pos[o] = x; pos[o + 1] = y; pos[o + 2] = z; sdv[(j * (nx + 1) + i) * 2] = q.s; sdv[(j * (nx + 1) + i) * 2 + 1] = q.d;
      const inSquare = q.s > SQ.s0 - 2 && q.s < SQ.s1 + 2 && q.d > SQ.left - 1 && q.d < SQ.right + 1, inStreet = q.s > ST.s0 - 4 && q.s < ST.s1 + 4 && q.d > ST.carriage[0] - 3 && q.d < ST.carriage[1] + 3;
      c.copy(inSquare ? flag : inStreet ? under : yard).lerp(land, Math.min(1, Math.max(0, (y + 0.6) / 1.2)));
      const v = 0.92 + 0.16 * kit.noise(x * 0.07, z * 0.07, 3);
      colr[o] = c.r * v; colr[o + 1] = c.g * v; colr[o + 2] = c.b * v;
    }
    let k = 0;
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const a = j * (nx + 1) + i, b = a + 1, d = a + nx + 1, e = d + 1; idx[k++] = a; idx[k++] = d; idx[k++] = b; idx[k++] = b; idx[k++] = d; idx[k++] = e; }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(colr, 3)); geo.setAttribute('aSD', new THREE.BufferAttribute(sdv, 2)); geo.setIndex(new THREE.BufferAttribute(idx, 1)); geo.computeVertexNormals();
    const tw = town.xz(plan.tower.s, plan.tower.d);
    const paving = {
      uniforms: { uBedTower: { value: new THREE.Vector4(tw[0], tw[1], town.along(plan.tower.s), plan.tower.hourRing.radius - 0.4) }, uBedSquare: { value: new THREE.Vector4(SQ.s0, SQ.s1, SQ.left, SQ.right) }, uBedStreet: { value: new THREE.Vector4(ST.s0, ST.s1 + 2, ST.carriage[0], ST.carriage[1]) } },
      vertexPars: 'attribute vec2 aSD; varying vec2 vSD;', vertexLocal: 'vSD = aSD;',
      fragmentPars: /* glsl */`varying vec2 vSD; uniform vec4 uBedTower, uBedSquare, uBedStreet;
        float bedHash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }`,
      albedo: /* glsl */`{
        float bpx = max(length(dFdx(vWPos.xz)), length(dFdy(vWPos.xz))), bsoft = max(bpx, 0.02), bhold = 1.0 - smoothstep(0.12, 0.4, bpx);      // metres to a pixel here; too far to hold a joint: none
        float bjoint = 0.0, btone = 1.0;
        // the square
        float bsq = smoothstep(uBedSquare.x - 2.0, uBedSquare.x + 2.0, vSD.x) * (1.0 - smoothstep(uBedSquare.y - 2.0, uBedSquare.y + 2.0, vSD.x)) * step(uBedSquare.z, vSD.y) * step(vSD.y, uBedSquare.w) * step(vWPos.y, -20.5);
        if (bsq > 0.0) {
          vec2 bq = vWPos.xz - uBedTower.xy; float br = length(bq), bring = floor(br / 2.2), bn = max(8.0, floor(6.2832 * (bring + 0.5) * 2.2 / 1.7));
          float ba = (atan(bq.y, bq.x) + uBedTower.z) / 6.2832 * bn + 0.5 * mod(bring, 2.0), bsec = floor(ba);
          float bdr = min(fract(br / 2.2), 1.0 - fract(br / 2.2)) * 2.2, bda = min(fract(ba), 1.0 - fract(ba)) * 6.2832 / bn * br;
          bjoint = (1.0 - smoothstep(0.03 - bsoft, 0.03 + bsoft, min(bdr, bda))) * bsq;
          btone = mix(1.0, 0.86 + 0.28 * bedHash(vec2(bring, bsec)), bsq * bhold);
          // the rail the hour ring rides on, and the twelve hour stones outside it
          float brail = (1.0 - smoothstep(0.11 - bsoft, 0.11 + bsoft, abs(br - uBedTower.w))) * bsq;
          float bhour = fract((atan(bq.y, bq.x) + uBedTower.z) / 6.2832 * 12.0), bstone = (1.0 - smoothstep(0.32, 0.36, abs(br - (uBedTower.w + 1.9)))) * (1.0 - smoothstep(0.42, 0.46, min(bhour, 1.0 - bhour) / 12.0 * 6.2832 * br)) * bsq;
          btone = mix(btone, 1.5, bstone * (0.5 + 0.5 * bhold)); btone = mix(btone, 0.42, brail);
        }
        // the street
        float bst = step(uBedStreet.x, vSD.x) * step(vSD.x, uBedStreet.y) * step(vWPos.y, -8.6);
        if (bst > 0.0) {
          float bin = step(uBedStreet.z, vSD.y) * step(vSD.y, uBedStreet.w);
          float bkerb = (1.0 - smoothstep(0.16 - bsoft, 0.16 + bsoft, min(abs(vSD.y - uBedStreet.z), abs(vSD.y - uBedStreet.w)))) * bst;
          float bdrain = (1.0 - smoothstep(0.1 - bsoft, 0.1 + bsoft, abs(vSD.y - 0.5 * (uBedStreet.z + uBedStreet.w)))) * bst * bin;
          float bcross = fract((vSD.x - uBedStreet.x) / 14.0) * 14.0, bband = step(bcross, 1.5) * bin * bst;
          float bcj = (1.0 - smoothstep(0.03 - bsoft, 0.03 + bsoft, min(min(bcross, abs(bcross - 0.75)), min(abs(bcross - 1.5), min(fract(vSD.y / 1.1), 1.0 - fract(vSD.y / 1.1)) * 1.1)))) * bband;
          btone = mix(btone, 1.18, bband * bhold); btone = mix(btone, 1.4, bkerb * bhold); btone = mix(btone, 0.55, bdrain * bhold);
          bjoint = max(bjoint, bcj);
        }
        albedo *= btone * (1.0 - 0.5 * bjoint * bhold);
      }`,
    };
    const bed = new THREE.Mesh(geo, light.mat({ color: '#ffffff', vertexColors: true, lit: 1.15, brush: 1, extend: paving }));      // (lit: the share of a lamp's pool the paving takes; at 1.5 a lit square was a pale sheet)
    bed.name = 'town-bed'; bed.frustumCulled = false; ctx.add(bed);
    shared.bed = bed;
  }

  // ---------------------------------------------------------------------------------------------- light states
  // The page's four states, mixed by the boat's distance along the route (plan.stateWeights). The engine's look carries
  // fog, exposure and the light on what does not wear the area's material (the boat); the sky's colours, the light from
  // below, the water's own light and colour are this area's and are mixed here (plan.tone).
  const FOGK = num('fogk', 1), HFOG = (Q.get('hfog') || '').split(',').map(Number);      // &fogk=<k>: all the states' air thicker or thinner; &hfog=<amount>,<over metres>: the mist on the feet of far things
  const st = (o) => ({ look: { fog: { color: o.fog.color, density: o.fog.density * FOGK }, exposure: o.exposure, light: { shadow: o.hull.shadow, lit: o.hull.lit, keyColor: o.hull.keyColor, sky: o.hull.sky, ground: o.hull.ground,
    heightFog: Number.isFinite(HFOG[0]) && Q.has('hfog') ? HFOG[0] : (o.footMist ? o.footMist[0] : plan.look.light.heightFog), heightFogOver: Number.isFinite(HFOG[1]) ? HFOG[1] : (o.footMist ? o.footMist[1] : plan.look.light.heightFogOver) } } });
  const names = plan.toneNames, W = {};
  const L = ctx.lookStates(Object.fromEntries(names.map((n) => [n, st(S[n])])));
  const pick = (f) => names.map((n) => col(f(S[n])));
  const C = { top: pick((o) => o.sky.top), mid: pick((o) => o.sky.mid), horizon: pick((o) => o.sky.horizon), low: pick((o) => o.sky.low || o.sky.mid), under: pick((o) => o.under.color), night: pick((o) => o.night), cloud: pick((o) => o.cloud),
    shallow: pick((o) => o.shallow), deep: pick((o) => o.deep), top2: pick((o) => o.top), street: pick((o) => o.street), waterA: pick((o) => o.waterA), waterB: pick((o) => o.waterB), waterLit: pick((o) => o.waterLit),
    line: pick((o) => o.line), waterLight: pick((o) => o.waterLight) };
  const mixC = (target, list, gain = 1) => { target.setRGB(0, 0, 0); names.forEach((n, i) => { target.r += list[i].r * W[n] * gain; target.g += list[i].g * W[n] * gain; target.b += list[i].b * W[n] * gain; }); return target; };
  const mixN = (f) => names.reduce((a, n) => a + f(S[n]) * W[n], 0);
  const netCol = col('#9fd0c8');
  shared.states = L;

  // ---------------------------------------------------------------------------------------------- the glow sheet
  // The far water, made by the realm: the plan of everything that burns under the lake, laid on the surface beyond the
  // near water, so that the lake reads to its shores as dark glass with a town burning under it: lines of light for
  // streets, a pool for the square. Near the boat only the true town is seen (it fades in between 10 and 22 m). It lies
  // UNDER the mirror: where the water mirrors the sky it shows less of what burns beneath, as the true town does.
  const sheetGain = num('sheet', 0.5);
  if (sheetGain > 0) {
    const G = plan.glow, geo = new THREE.PlaneGeometry(G.size, G.size); geo.rotateX(-Math.PI / 2);
    const mat = new THREE.ShaderMaterial({
      uniforms: { ...U, ...fogU, uSheet: { value: new THREE.Vector4(num('sheet0', 0.3 * ctx.waterLook.seeDistance), num('sheet1', ctx.waterLook.seeDistance), sheetGain, 1) }, uWarm: { value: col('#F59A52') }, uRose: { value: col('#C8664E') }, uJadeS: { value: col('#5fb8a6') }, tCaustic: sh.tCaustic },
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
      vertexShader: /* glsl */`varying vec3 vW; void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: /* glsl */`
        ${FOG_PARS} ${TOWN_GLSL}
        uniform vec3 uCameraPos, uWarm, uRose, uJadeS; uniform vec4 uSheet; uniform sampler2D tCaustic; uniform float uTime; varying vec3 vW;
        void main() {
          if (uSheet.w < 0.5) discard;
          vec4 g = townGlow(vW.xz);
          float lv = g.r * townWake(townS(g), vW.xz, -1.0, g.a);
          lv = lv * lv * 1.5 / (0.35 + lv);                                      // streets are lines of light and the water between them stays dark: a plan of the town, not a blush
          // seen through water that is never quite still, a far light is a dash that comes and goes (the ride's caustic web,
          // two copies sliding; far off it melts into its own average and the glow is even)
          float tt = uTime * 0.05; vec2 q = vW.xz * 0.19;
          float shim = texture2D(tCaustic, q + vec2(tt * 0.20, tt * 0.124)).r + texture2D(tCaustic, q * 0.73 + vec2(-tt * 0.172, tt * 0.228) + 0.37).r;
          lv *= 0.45 + 1.5 * shim * shim;
          float d = distance(uCameraPos.xz, vW.xz), d3 = distance(uCameraPos, vW);
          float fade = smoothstep(uSheet.x, uSheet.y, d);                        // near the boat only the true town is seen
          float glance = 1.0 - 0.55 * pow(1.0 - clamp(uCameraPos.y / max(d3, 0.1), 0.0, 1.0), 9.0);      // the mirror lies over it
          vec3 c = mix(mix(uRose, uWarm, smoothstep(0.1, 0.6, lv)), uJadeS, clamp(g.g * 1.3, 0.0, 1.0)) * lv;
          gl_FragColor = vec4(c * (uSheet.z * fade * glance * (1.0 - fogAmount(d3)) * (1.0 - uVeil)), 1.0);
        }`,
    });
    const sheet = new THREE.Mesh(geo, mat); sheet.position.set(G.centre[0], -0.05, G.centre[1]); sheet.renderOrder = 1; sheet.frustumCulled = false; sheet.name = 'town-glow-sheet';
    // not in the engine's picture of the scene without the water (the water would count its light twice), nor in the mirror
    sheet.onBeforeRender = (renderer) => { mat.uniforms.uSheet.value.w = renderer.getRenderTarget() === ctx.engine.pre ? 0 : 1; mat.uniformsNeedUpdate = true; };
    ctx.add(sheet); ctx.only(sheet, 'direct');
    shared.sheet = sheet;
  }

  // ---------------------------------------------------------------------------------------------- mist
  // The air in layers, none of it a painted picture, all of it lit and never glowing (old rose where the town burns
  // under it, the air's own violet elsewhere):
  //   - three banks lying on the far water all round, at 185, 250 and 330 m, each with a ragged top that drifts: they
  //     veil the feet of the viaduct, the far shore and the hills, and the water mirrors them;
  //   - low mist over the lake itself: soft cards that face the rider, from the water to about 3 m;
  //   - twelve sheets, 20 to 40 m across, between y 5 and 10, drifting at 0.15 m/s, with holes that open and close (the
  //     page's sheets; they are looked up into, and go faint where they would be seen edge-on as a line);
  //   - the lilac bank where the orchard was.
  if (Q.get('mist') !== '0') {
    const mistOff = (Q.get('mist') || '').split(',');                              // &mist=0 none; &mist=banks,low,sheets leaves those out
    const mistU = { ...U, ...fogU, uAir: skyU.uHorizon, uRoseM: { value: col('#96608c') }, uJadeM: { value: col('#5a9c92') } };
    const lit = /* glsl */`
      vec3 mistColor(vec2 xz, float lod) {                                      // the air's colour, warmed where the town burns beneath
        vec4 g = townGlowSoft(xz, lod);
        float lv = clamp(g.r * townWake(townS(g), xz, -1.0, g.a) * 1.5, 0.0, 1.0);
        return mix(uAir, mix(uRoseM, uJadeM, clamp(g.g * 1.2, 0.0, 1.0) * 0.6), lv * 0.5);
      }`;
    // ---- the far banks
    if (!mistOff.includes('banks')) { const centre = town.xz(130, 0);
      const bank = (radius, height, seed, opacity, order) => {
        const geo = new THREE.CylinderGeometry(radius, radius, height, 128, 1, true);
        const mat = new THREE.ShaderMaterial({
          uniforms: { ...mistU, uBank: { value: new THREE.Vector4(radius, height, seed, opacity) } },
          transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false,
          vertexShader: /* glsl */`varying vec2 vUv; varying vec3 vW; void main() { vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
          fragmentShader: /* glsl */`
            ${FOG_PARS} ${NOISE_GLSL} ${TOWN_GLSL}
            uniform vec3 uCameraPos, uAir, uRoseM, uJadeM; uniform float uTime; uniform vec4 uBank; varying vec2 vUv; varying vec3 vW;
            ${lit}
            void main() {
              float u = vUv.x * uBank.x * 0.02 + uBank.z, y = vW.y / uBank.y;                  // (one unit of noise to 50 m of bank)
              float n = fbm(vec2(u * 2.0 + uTime * 0.004, uBank.z)) * 0.7 + fbm(vec2(u * 7.0 - uTime * 0.007, y * 2.0 + uBank.z)) * 0.3;
              float top = 0.25 + 0.75 * n;                                                    // how high the bank stands here
              float a = (1.0 - smoothstep(top * 0.35, top, y)) * smoothstep(-0.02, 0.06, y) * uBank.w;
              float d = distance(uCameraPos, vW);
              a *= smoothstep(18.0, 60.0, d) * (1.0 - fogAmount(d) * 0.5) * (1.0 - uVeil);
              if (a < 0.004) discard;
              gl_FragColor = vec4(mistColor(vW.xz, 5.0), a);
            }`,
        });
        const m = new THREE.Mesh(geo, mat); m.position.set(centre[0], height / 2 - 0.2, centre[1]); m.renderOrder = order; m.frustumCulled = false; m.name = 'town-mist-bank'; ctx.add(m); return m;
      };
      shared.mistBanks = [bank(330, 26, 3.1, 0.75, -936), bank(250, 18, 7.7, 0.62, -934), bank(185, 12, 1.3, 0.5, -932)]; }
    // ---- low mist over the lake: soft cards facing the rider
    //      (and a plume over each of the brightest waters: the five lamp domes, the glass ridge, the nave's lights: the
    //      page's "plumes over the brightest water"; being lit by what burns under them, they take its colour)
    if (!mistOff.includes('low')) { const plumes = [];
      for (const l of town.lamps) if (l.kind === 'row' && l.y > -1) plumes.push([l.x, l.z]);
      for (const s of [158, 168, 178, 188]) plumes.push(town.xz(s, plan.hall.d + 0.5));
      for (const s of [126, 140]) plumes.push(town.xz(s, plan.church.d));
      const nd = kit.count(40), n = nd + plumes.length, rnd = ctx.rng(31), base = new THREE.PlaneGeometry(1, 1);
      const geo = new THREE.InstancedBufferGeometry(); geo.index = base.index; geo.setAttribute('position', base.attributes.position); geo.setAttribute('uv', base.attributes.uv);
      const off = new Float32Array(n * 4), aux = new Float32Array(n * 3);
      for (let i = 0; i < nd; i++) {
        const s = 34 + rnd() * 196, side = rnd() < 0.5 ? -1 : 1, d = side * (town.hw(s) * (0.2 + rnd() * 1.5) + rnd() * 30), p = town.xz(s, d);
        off.set([p[0], 0.5 + rnd() * 2.4, p[1], 16 + rnd() * 22], i * 4); aux.set([rnd() * 100, 0.6 + rnd() * 0.8, rnd() < 0.5 ? -1 : 1], i * 3);
      }
      plumes.forEach((p, k) => { const i = nd + k; off.set([p[0], 1.3 + rnd() * 0.8, p[1], 9 + rnd() * 4], i * 4); aux.set([rnd() * 100, 0.25, rnd() < 0.5 ? -0.25 : 0.25], i * 3); });
      geo.setAttribute('aOffset', new THREE.InstancedBufferAttribute(off, 4)); geo.setAttribute('aAux', new THREE.InstancedBufferAttribute(aux, 3)); geo.instanceCount = n;
      const mat = new THREE.ShaderMaterial({
        uniforms: { ...mistU, uOpacity: { value: 0.15 * Math.sqrt(40 / nd) } },
        transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide, forceSinglePass: true,
        vertexShader: /* glsl */`
          attribute vec4 aOffset; attribute vec3 aAux; uniform float uTime; varying vec2 vUv; varying float vDist, vSeed; varying vec3 vC;
          void main() {
            vUv = uv; vSeed = aAux.x;
            vec3 c = aOffset.xyz;
            c.x += sin(uTime * 0.05 * aAux.y + aAux.x) * 5.0 * aAux.z; c.z += cos(uTime * 0.04 * aAux.y + aAux.x * 1.3) * 5.0;
            vC = c;
            vec4 mv = viewMatrix * vec4(c, 1.0);
            mv.xy += position.xy * vec2(aOffset.w, aOffset.w * 0.2);                           // long and low: it lies on the water
            vDist = length(mv.xyz);
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: /* glsl */`
          ${FOG_PARS} ${NOISE_GLSL} ${TOWN_GLSL}
          uniform vec3 uAir, uRoseM, uJadeM; uniform float uOpacity, uTime; varying vec2 vUv; varying float vDist, vSeed; varying vec3 vC;
          ${lit}
          void main() {
            vec2 q = vUv - 0.5;
            float shape = smoothstep(0.5, 0.0, length(q * vec2(1.0, 1.15)));
            float n = fbm(vUv * vec2(3.2, 1.4) + vSeed + vec2(uTime * 0.012, 0.0));
            float a = shape * shape * smoothstep(0.2, 0.75, n + shape * 0.35) * uOpacity;
            a *= smoothstep(6.0, 22.0, vDist) * (1.0 - fogAmount(vDist) * 0.85) * (1.0 - uVeil);
            if (a < 0.002) discard;
            gl_FragColor = vec4(mistColor(vC.xz, 4.0), a);
          }`,
      });
      const low = new THREE.Mesh(geo, mat); low.frustumCulled = false; low.renderOrder = 5; low.name = 'town-mist-low'; ctx.add(low); shared.mistLow = low; }
    // ---- the page's twelve sheets, overhead
    if (!mistOff.includes('sheets')) { const n = 12, rnd = ctx.rng(77), base = new THREE.PlaneGeometry(1, 1, 6, 6); base.rotateX(-Math.PI / 2);
      const geo = new THREE.InstancedBufferGeometry(); geo.index = base.index; geo.setAttribute('position', base.attributes.position); geo.setAttribute('uv', base.attributes.uv);
      const off = new Float32Array(n * 4), aux = new Float32Array(n * 4);
      const spots = [[34, -4], [58, 9], [84, -8], [108, 6], [128, -12], [146, 10], [162, -20], [176, 2], [188, -14], [200, 16], [214, -4], [170, 24]];
      for (let i = 0; i < n; i++) { const [s, d] = spots[i], p = town.xz(s, d); off.set([p[0], 5 + rnd() * 5, p[1], 20 + rnd() * 20], i * 4); aux.set([rnd() * 100, rnd() * 6.283, 0.6 + rnd() * 0.8, rnd()], i * 4); }
      geo.setAttribute('aOffset', new THREE.InstancedBufferAttribute(off, 4)); geo.setAttribute('aAux', new THREE.InstancedBufferAttribute(aux, 4)); geo.instanceCount = n;
      const mat = new THREE.ShaderMaterial({
        uniforms: { ...mistU, uMist: { value: new THREE.Vector4(0.26, 0.15, 0, 0) } },
        transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide,
        vertexShader: /* glsl */`
          attribute vec4 aOffset, aAux; uniform float uTime; uniform vec4 uMist; varying vec2 vUv; varying vec3 vW; varying vec4 vAux;
          void main() {
            vUv = uv; vAux = aAux;
            vec2 drift = vec2(cos(aAux.y), sin(aAux.y)) * (uTime * uMist.y * aAux.z);                      // 0.15 m/s, each its own way
            vec3 c = aOffset.xyz; c.xz += mod(drift + 30.0, 60.0) - 30.0;                                   // within 30 m of its place
            vec3 w = c + vec3(position.x * aOffset.w, sin(position.x * 5.0 + aAux.x) * 0.5 + cos(position.z * 4.0 + aAux.x) * 0.4, position.z * aOffset.w);
            vW = w; gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.0);
          }`,
        fragmentShader: /* glsl */`
          ${FOG_PARS} ${NOISE_GLSL} ${TOWN_GLSL}
          uniform vec3 uCameraPos, uAir, uRoseM, uJadeM; uniform float uTime; uniform vec4 uMist; varying vec2 vUv; varying vec3 vW; varying vec4 vAux;
          ${lit}
          void main() {
            vec2 q = vUv - 0.5; float edge = smoothstep(0.5, 0.1, length(q));
            float n = fbm(vUv * 3.1 + vAux.x + vec2(uTime * 0.011, uTime * 0.007)), holes = smoothstep(0.30, 0.62, n + edge * 0.25);
            vec3 v = vW - uCameraPos; float d = length(v);
            float a = edge * edge * holes * uMist.x * smoothstep(2.5, 14.0, d) * (1.0 - fogAmount(d) * 0.8) * (1.0 - uVeil);
            a *= smoothstep(0.04, 0.22, abs(v.y) / max(d, 0.1));                                            // seen edge-on a sheet is a line: let it go
            if (a < 0.003) discard;
            gl_FragColor = vec4(mistColor(vW.xz, 3.5), a);
          }`,
      });
      const mist = new THREE.Mesh(geo, mat); mist.frustumCulled = false; mist.renderOrder = 5; mist.name = 'town-mist-sheets';
      ctx.add(mist); shared.mist = mist; }
    // the lilac bank lying on the water where the orchard was: the palest thing above the surface, seen looking back up the route
    kit.mist({ count: 30, from: 0, to: 26, spread: 70, y: [0.5, 4.5], size: 40, color: '#7c789c', opacity: 0.24, drift: 0.1, seed: 5 });
  }

  // ---------------------------------------------------------------------------------------------- lights that reach across
  // The light from below (in the area's material) is the light of what burns straight under a thing. A few lights
  // burn so near the surface that they reach ACROSS the water as well, and give the things round them a lit side
  // and a dark one: the five lamp domes (three in the row, two at the theatre steps: the page's "last rose from two
  // lamps on the steps" on the portico's columns), the glass ridge (turquoise, along the hull as the boat comes
  // alongside), the nave's lancets. Each wakes and sleeps with the town. They fall on everything built, the boat too.
  const reach = [];
  { const add = (x, y, z, s, color, radius, intensity, stay) => reach.push({ l: ctx.light({ position: [x, y, z], color, radius, intensity: 0 }), x, z, s, intensity, stay });
    for (const l of town.lamps) if (l.kind === 'row' && l.y > -1) add(l.x, 0.35, l.z, l.s, l.s > 200 ? '#E9A690' : '#F2987A', l.s > 200 ? 17 : 11, l.s > 200 ? 0.55 : 1.0, 0.6);
    const H = plan.hall; for (const s of [159, 174, 189]) { const p = town.xz(s, H.d + 2.4); add(p[0], 0.5, p[1], 176, '#7ADCC6', 15, 0.8, 0.6); }
    const C = plan.church; for (const side of [-1, 1]) { const p = town.xz((C.s0 + C.s1) / 2, C.d + side * 4.2); add(p[0], 0.2, p[1], (C.s0 + C.s1) / 2, '#F0A07C', 13, 0.55, 0.5); } }

  // the street lamps' glow in the water round their heads (the light's halos: they wake and sleep with the town; the five
  // heads just under the surface have the kit's domes instead)
  { const list = town.lamps.filter((l) => l.kind !== 'stepsDark' && l.y < -1).map((l) => ({ x: l.x, y: l.y, z: l.z, size: 4.4, color: '#F2A07C', s: l.s, stay: l.kind === 'row' ? 0.6 : 0.25 }));
    if (list.length) { const h = light.halos(list, { gain: 0.42, scale: 1 }); ctx.add(h); shared.lampHalos = h; } }
  // (the pool each lamp lays on the paving at its foot is light ON the paving now: the area's material has it, from a
  // map of the lamps baked in light.js. It was a soft disc of light added over the ground here.)

  // ---------------------------------------------------------------------------------------------- what lies on the water
  // fallen leaves and the dust on the film (surface.js): they tell the eye where the water is
  const surface = Q.get('afloat') === '0' ? null : buildSurface(ctx, plan, shared, light);

  // ---------------------------------------------------------------------------------------------- the lean
  // This is the area that is looked DOWN into, and from the rider's seat the boat's own side hides everything steeper
  // than 48 degrees below the horizon: a square 22 m down could only be seen 20 m away. So here the rider leans out as
  // he looks down over the side: the eye slides up to 0.42 m toward the gunwale he is looking over (never higher: it
  // stays 1.1 m above the water), which opens the view to about 72 degrees. Eased (it follows the look over half a
  // second, and starts and ends softly); a rider who asked for reduced motion does not lean. A work-round inside the
  // area, asked of the engine in the log; &lean=0 switches it off (plan.eye).
  const LEAN = ctx.reducedMotion ? 0 : num('lean', plan.eye.lean), eye = ctx.boat.eye, cam = ctx.engine.camera, sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  let lean = 0, leanV = 0;
  if (!ctx.engine._townLeanHook) { ctx.engine._townLeanHook = true; ctx.engine.on('realm', (inst) => { if (inst.id !== 'town') ctx.engine.boat.eye.position.x = 0; }); }
  ctx.onDispose(() => { if (eye.position.x !== 0 && !(ctx.engine.realms.current && ctx.engine.realms.current.id === 'town')) eye.position.x = 0; });

  // ---------------------------------------------------------------------------------------------- test rings (&rings=1)
  // Not the cast: a developer's switch that writes the pendulum's ring every 3 s at the tower (strength 0.45, radius 0.7)
  // and a pin ring now and then over the first chimney pots, so that the water's rings can be judged before the cast exists.
  if (Q.has('rings')) {
    const tw = town.xz(plan.tower.s, plan.tower.d), pots = town.stacks.filter((s) => !s.clear).slice(0, 14), rr = ctx.rng(3), k = num('rings', 1);
    let tick = 1.5, pin = 0.4;
    ctx.onUpdate((dt) => {
      tick -= dt; pin -= dt;
      if (tick <= 0) { tick += 3.0; ctx.water.ripple(tw[0], tw[1], 0.45 * k, 0.7); }
      if (pin <= 0) { pin += 0.35 + rr() * 0.5; const p = pots[Math.floor(rr() * pots.length)]; if (p) ctx.water.ripple(p.x + (rr() - 0.5) * 0.3, p.z + (rr() - 0.5) * 0.3, 0.15 * k, 0.3); }
    });
  }

  // ---------------------------------------------------------------------------------------------- the mirror's own picture
  // While the water draws its reflection of the scene, the area's material is told so (light.js, "THE MIRROR'S PICTURE":
  // things that stand above the water are mirrored by a gentler curve than the empty sky).
  if (ctx.water && ctx.water.onMirror) ctx.water.onMirror(ctx.path, () => { U.uTownMirror2.value.w = 1; }, () => { U.uTownMirror2.value.w = 0; });

  // ---------------------------------------------------------------------------------------------- the boat at rest
  // (A boat lying still on glass still breathes on it: a slow soft ring leaves the hull every few seconds and widens over
  // the roofs. It was written here by hand; it is the water's own look key `rest` now: plan.js WATER. &tw=rest:0 for none.)

  // ---------------------------------------------------------------------------------------------- every frame
  const reach0 = Q.has('reach') ? +Q.get('reach') : null, WATERFOG = num('waterfog', 1);      // &waterfog=0: the town as the engine's water alone shows it (a town in air)
  let started = false;
  return {
    update(dt, c) {
      const s = c.s;
      if (surface) surface.update(dt, c);
      if (eye && cam) {
        // a critically damped follow: no start, no stop, no overshoot
        const want = -Math.sin(cam.rotation.y) * LEAN * sm(plan.eye.from, plan.eye.full, -cam.rotation.x), w = 4.5, h = Math.min(dt, 0.05);
        leanV += (w * w * (want - lean) - 2 * w * leanV) * h; lean += leanV * h; eye.position.x = lean;
      }
      if (!started) { started = true; light.state.reach = reach0 ?? s; if (eye && cam) { lean = -Math.sin(cam.rotation.y) * LEAN * sm(plan.eye.from, plan.eye.full, -cam.rotation.x); leanV = 0; eye.position.x = lean; } }
      light.setReach(s);
      // the square holds until the boat is at the poplar road, then goes to sleep (stage.js will give this its own clock)
      const sq = plan.wake.square; light.state.square = 1 - Math.min(1, Math.max(0, (light.state.reach - sq.sleepAt) / sq.sleepOver));
      // the four light states by distance
      plan.stateWeights(s, W);
      L.set(W);
      mixC(skyU.uTop.value, C.top); mixC(skyU.uMid.value, C.mid); mixC(skyU.uHorizon.value, C.horizon);
      mixC(skyU.uLow.value, C.low); skyU.uLowK.value.z = mixN((o) => o.sky.lowK ?? 0);
      { const ck = mixN((o) => o.sky.cloudK ?? 1); skyU.uCloudK.value.x = skyTex ? 0.9 * ck : 0; skyU.uCloudK.value.w = 0.3 + 0.7 * ck; }      // (in the mist at the door no cloud is drawn, and a third of the town's flush comes through)
      skyU.uMistK.value = 57.3 / mixN((o) => o.mist);                             // the height of the mist band, degrees
      mixC(U.uTownUnderCol.value, C.under); mixC(U.uTownNight.value, C.night); mixC(U.uTownCloud.value, C.cloud);
      mixC(U.uTownShallow.value, C.shallow); mixC(U.uTownDeep.value, C.deep); mixC(U.uTownTop.value, C.top2); mixC(U.uTownStreet.value, C.street);
      mixC(U.uTownWaterA.value, C.waterA); mixC(U.uTownWaterB.value, C.waterB); mixC(U.uTownWaterLit.value, C.waterLit);
      mixC(U.uTownLine.value, C.line); mixC(U.uTownWaterLight.value, C.waterLight);
      U.uTownNet.value.copy(netCol).multiplyScalar(mixN((o) => o.nets) * 1.5);      // (third holder: 2.5 -> 1.5 with the nets drawn as threads: light.js)
      U.uTownUnder.value.x = mixN((o) => o.under.gain); U.uTownUnder.value.y = mixN((o) => o.under.floor);
      U.uTownWater.value.w = mixN((o) => o.waterFog); U.uTownWater.value.x = WATERFOG;
      { const wl = c.waterLook; U.uTownMirror.value.set(wl.fresnel ?? 4.2, wl.reflectivity ?? 0.92, wl.reflectFloor ?? 0.02, U.uTownMirror.value.w); }      // (the mirror's own curve, for the lights that burn through it)
      for (const o of uOver) { const v = UU[o.name].value; if (o.comp && o.comp in v) v[o.comp] = o.v; else if (!o.comp && typeof v === 'number') UU[o.name].value = o.v; }
      for (const o of cOver) UU[o.name].value.copy(o.c);
      for (const r of reach) r.l.intensity = r.intensity * Math.min(1.3, light.level(r.s, r.x, r.z, -1, r.stay));
      // the underglow reaches the hull: the light from below on the boat fails where the street under it sleeps
      const burn = Math.min(1, light.at(c.boat.x, c.boat.z) * 1.5), fl = U.uTownUnder.value.y, k = (fl + (1 - fl) * burn) * U.uTownUnder.value.x;
      c.look.light.ground.multiplyScalar(k); c.look.light.keyColor.multiplyScalar(0.35 + 0.65 * k);
      // the current: slower over the square, so that a rider left alone gets the whole hour
      c.look.current = c.look.currentNarrow = plan.currentAt(s);
    },
  };
}
