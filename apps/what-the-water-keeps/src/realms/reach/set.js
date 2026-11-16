// The dyers' reach: the place, its light and its water. Page: docs/art/reach.md, sections 2, 3 (vista) and 7.
// (Stage 1 laid it out; stage 2, docs/build/reach/2-light.md, made the picture: what is marked "stage 2" below.)
//
//   the wind         one for the whole reach (shared.wind): cloth, silks, steam and lint all read it
//   the sun          src/realms/reach/light.js (shared.sun): the disc, the coin through cloth, the dyed light. Here:
//                    the SUN IN THE WATER (stage 2), a molten sun that only the water's mirror sees, in place of the disc
//   the light        two states, `start` (s 28) and `end` (s 240), mixed by the rider's FURTHEST progress, never by the
//                    clock and never backwards: stop and the evening stops, go back and it does not grow lighter
//   the sky          the gradient on the kit's dome; over it the painted panorama (art/reach/sky.webp) as a layer of
//                    this area's own, veiled and tinted with the evening; stage 2: its clouds graded mauve by height
//                    (plan.sky.cool) and, above the painting, high mare's tails drawn in code (plan.sky.wisps)
//   the land         banks that follow the channel with the page's steps; the low grounds, whose edges on open water are
//                    shores (stage 2); the land's paint, worked out in the fragment shader: mottle, wet, tide marks of
//                    dye, puddles, coursed stone on every upright face (stage 2); the far band of painted hills and works
//   the air          haze on the lagoon; stage 2: a thin warm haze between the nave's arches, lint round the rider (plan.air)
//   the water        its two looks; the wheel's rain; and THE DYE ON THE WATER, drawn by this area (the take-over of the
//                    second look): THE GLAZE, a sheet on the water plane that multiplies what the water shows by what
//                    the dye lets through, its figure worked out per pixel (maps: dye.js), with eddies that turn; THE
//                    STIR, a field of this area's own by which the hull's wake curls that figure; THE MOLTEN ROAD, the
//                    sun's path as gold dabs; the engine's film is kept out of sight as the carrier of the swirl and of
//                    what the cast pours; the sun's path dimmed under a covered sun; the water's own dusk
//   second look      also here: the light shafts in the nave; the far band's own material; the sun's core by its height
//
// shared (for the other modules):  shared.wind, shared.sun, shared.mat.solid / .land (what stand-ins and models wear),
//   shared.reach = { far (furthest s), k (0 start .. 1 end light), bank(side, s) -> { out: [a1, a2, a3], y: [h1, h2, h3] }, L },
//   shared.dye = { eddies: [{ x, z, R, angle, s, d, seconds? }] (where the water turns: the ten that TURN first, with
//   `seconds` to a turn, then the static swirls: an eddy's middle is a place for foam to gather), turning (the ten, with
//   omega in radians a second), figures and sheet (earlier holders' names, kept, empty) }
//
// Developer switches: &far=<s> the evening as if the rider had been as far as s; &gust=1 every cloth held up by the wind
// (the unpegging's held state, for postcards 6 and 8 until staging exists); &sky=0 the plain gradient; &sunmask=1;
// &nofig=1 no dye on the water at all (clear water); &dyeonly=1 what the dye lets through, by itself; &nostir=1 the wake
// does not curl the dye; &noroad=1 no gold dabs; &mirrorsun=1 the sun's own disc in the water's mirror again (the pale road).
import * as THREE from 'three';
import { makeWind } from '../../engine/life/ribbons.js';
import { makeSun } from './light.js';
import { lightAt, ramp } from './plan.js';
import { glazeMapsSlowly, GLAZE_BANDS } from './dye.js';
import { waterUniforms } from '../../engine/water-final.js';

const QS = new URLSearchParams(location.search);
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;

export async function build(ctx, plan, shared) {
  const { kit, path } = ctx, C = plan.colors;

  // ================================================================================================ wind and sun
  const wind = makeWind(ctx, plan.wind);
  shared.wind = wind;
  if (QS.has('gust')) wind.settle(+QS.get('gust') || 1);
  const sun = makeSun(ctx);
  shared.sun = sun;
  // The sun's road on the water is the water's own (look.water.sun: molten, the colour of the dyed light, as wide as the
  // page says). Left in the water's mirror the disc lays a second road over it, as pale as its own core (#FFF0C0 times
  // 4.5, drawn out into a cream column 12 degrees wide): so the mirror does not take the disc. Cloth with the sun's coin
  // in it is still mirrored, and lays its own coloured stroke.
  if (sun.disc && !QS.has('mirrorsun')) ctx.only(sun.disc, 'direct');
  // In its place the mirror takes a sun of the water's own: the same disc in the same place, hidden by the same solid
  // things, but MOLTEN (the bare sun's colour pulled toward red, plan.water.road), so that the long column the water
  // draws out of it is the page's gold, orange and red and never cream.
  const RD = plan.water.road, mirrorSun = (() => {
    const u = { uDir: { value: sun.dir }, uRight: { value: new THREE.Vector3(1, 0, 0) }, uUp: { value: new THREE.Vector3(0, 1, 0) }, uColor: { value: new THREE.Color() },
      uSize: { value: new THREE.Vector3(0.025, 1, 4) }, uHalo: { value: RD.halo }, uVeil: ctx.engine.shared.uVeil };
    const mat = new THREE.ShaderMaterial({
      uniforms: u, transparent: true, depthWrite: false, depthTest: true, blending: THREE.AdditiveBlending, fog: false,
      vertexShader: /* glsl */`uniform vec3 uDir, uRight, uUp, uSize; varying vec2 vQ;
        void main() { vQ = position.xy * uSize.z; vec3 ray = uDir + (uRight * vQ.x + uUp * vQ.y) * uSize.x; vec4 p = projectionMatrix * viewMatrix * vec4(cameraPosition + ray * 400.0, 1.0); gl_Position = p.xyww; }`,
      fragmentShader: /* glsl */`uniform vec3 uColor, uSize; uniform float uVeil, uHalo; varying vec2 vQ;
        void main() { float r = length(vec2(vQ.x, vQ.y / uSize.y)); float disc = 1.0 - smoothstep(0.9, 1.08, r); gl_FragColor = vec4(uColor * (disc + uHalo * exp(-r * r * 0.7)) * (1.0 - uVeil), 1.0); }`,
    });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
    m.name = 'sun in the water'; m.frustumCulled = false; m.renderOrder = -998;
    ctx.add(m); ctx.only(m, 'mirror');
    if (sun.solid) sun.solid(m, false);
    return { mesh: m, u };
  })();

  // ================================================================================================ materials
  // What every solid thing wears until it is modelled (and after: kit.model takes the same options): matte plum in the
  // shade, a thin warm rim against the sun, water-light at its foot; and `sun.extend`, so that the dyed light falls on it
  // only inside the bar (light.js). A model: kit.model(url, { rim: ..., caustics: ..., extend: shared.sun.extend }).
  shared.mat = {
    solid: kit.gouache({ color: '#ffffff', vertexColors: true, brush: 0.6, rim: { color: '#FFB878', strength: 0.22, power: 4.5, toward: 1 }, caustics: { intensity: 0.3, height: 0.8, scale: 0.4, color: '#FFD2A6' }, extend: sun.extend }),
    land: null,
  };
  // The land's paint (stage 2). The ground is seen from 1.1 m, mostly as edges and as far planes, and it has few
  // vertices: so what it looks like before the light falls on it is worked out in the fragment shader, from where a
  // point is. Nothing underfoot is one colour (a broad mottle, a finer one on level ground); toward the water it is
  // wet and dark; at the waterline lie the tide marks of the bank's own dye (indigo left of the route, madder right);
  // and on level ground near the works stand puddles of spent dye.
  const landPaint = {
    fragmentPars: /* glsl */`
      float landHash(vec2 p) { p = fract(p * vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.y); }
      float landNoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(landHash(i), landHash(i + vec2(1.0, 0.0)), f.x), mix(landHash(i + vec2(0.0, 1.0)), landHash(i + vec2(1.0, 1.0)), f.x), f.y); }
    `,
    albedo: /* glsl */`
      { vec2 lp = vWPos.xz;
        float n1 = landNoise(lp * 0.09), n2 = landNoise(lp * 0.37 + 7.3), n3 = landNoise(lp * 1.9 + 3.1);
        vec3 Ng = normalize(cross(dFdx(vWPos), dFdy(vWPos)));                      // the face's own normal (the land's vertices are shared between a step and its riser)
        float level = smoothstep(0.55, 0.9, abs(Ng.y));
        albedo *= 0.8 + 0.3 * n1 + 0.16 * n2 * level + 0.08 * n3;
        // an upright face is coursed stone: courses a foot high, blocks of uneven length and tone, dark joints
        { float up = 1.0 - smoothstep(0.25, 0.6, abs(Ng.y));
          vec2 q = vec2(dot(lp, normalize(vec2(Ng.z, -Ng.x) + 1e-5)), vWPos.y);
          float row = floor(q.y / 0.36), run = q.x / 0.95 + mod(row, 2.0) * 0.5 + landHash(vec2(row, 3.0)) * 0.35, id = floor(run);
          float tone = landHash(vec2(id, row)), jy = fract(q.y / 0.36), jx = fract(run);
          float joint = smoothstep(0.0, 0.1, jy) * smoothstep(0.0, 0.05, jx);
          albedo *= mix(1.0, (0.62 + 0.58 * tone) * (0.42 + 0.58 * joint), up);
          // (take-over) a wall of the works is stained: runs of the bank's dye come down it from the top, broad and narrow,
          // darker where they began; and a stone here and there has been set in new, paler
          float runs = smoothstep(0.52, 0.8, landNoise(vec2(q.x * 1.1 + 3.7, q.y * 0.12 + 1.3))) * (0.45 + 0.55 * landNoise(vec2(q.x * 4.3, q.y * 0.5 + 9.1)));
          vec3 stain = lp.x < (lp.y > -92.0 ? 0.0 : lp.y > -205.0 ? (-92.0 - lp.y) * 0.2124 : 24.0 + (-205.0 - lp.y) * 0.32) ? vec3(0.05, 0.06, 0.17) : vec3(0.2, 0.045, 0.055);
          albedo = mix(albedo, stain * (0.6 + 0.4 * tone), up * 0.55 * runs);
          albedo *= mix(1.0, 1.0 + 0.25 * step(0.9, landHash(vec2(id + 7.0, row * 3.0 + 1.0))), up); }
        float wet = 1.0 - smoothstep(0.05, 0.3 + 0.12 * n2, vWPos.y);
        float cx = lp.y > -92.0 ? 0.0 : lp.y > -205.0 ? (-92.0 - lp.y) * 0.2124 : 24.0 + (-205.0 - lp.y) * 0.32;
        vec3 dye = lp.x < cx ? vec3(0.045, 0.055, 0.16) : vec3(0.21, 0.04, 0.05);      // (take-over: these were (0.16, 0.2, 0.5) and (0.55, 0.14, 0.16): in linear light that is paler than the stone, and every tide mark stood as a pale stripe)
        float tide = smoothstep(0.02, 0.1, vWPos.y) * (1.0 - smoothstep(0.16 + 0.1 * n3, 0.3 + 0.12 * n2, vWPos.y));
        albedo = mix(albedo * (1.0 - 0.42 * wet), dye * (0.5 + 0.5 * n3), 0.5 * tide);
        float pud = smoothstep(0.66, 0.74, landNoise(lp * 0.23 + 19.0)) * level * (1.0 - smoothstep(0.0, 4.0, vWPos.y)) * (1.0 - smoothstep(60.0, 110.0, abs(lp.x - cx)));
        albedo = mix(albedo, dye * 0.8, 0.45 * pud); }
    `,
  };
  shared.mat.land = kit.gouache({ color: '#ffffff', vertexColors: true, brush: 0.8, caustics: { intensity: 0.22, height: 0.6, scale: 0.35, color: '#FFD2A6' }, extend: [sun.extend, landPaint] });

  // ================================================================================================ the sky
  // The kit's dome carries the gradient (and tells the kit's mist what colour the low sky is); the painted panorama lies
  // over it as a layer of this area's own, so that it can be veiled, greyed and tinted with the evening (plan.sky).
  const SK = plan.sky;
  const sky = kit.sky({ ...SK.start, midAt: SK.midAt });
  const skyU = sky.material.uniforms, skyFrom = {}, skyTo = {};
  for (const [u, k] of [['uTop', 'top'], ['uMid', 'mid'], ['uHorizon', 'horizon'], ['uBelow', 'below']]) { skyFrom[u] = new THREE.Color(SK.start[k]); skyTo[u] = new THREE.Color(SK.end[k]); }
  let pano = null, panoU = null;
  if (plan.art.sky && QS.get('sky') !== '0') { try { pano = await ctx.tex('art/reach/sky.webp'); } catch (e) { pano = null; } }
  if (pano) {
    pano.wrapS = THREE.RepeatWrapping; pano.wrapT = THREE.ClampToEdgeWrapping; pano.needsUpdate = true;
    const rad = Math.PI / 180;
    panoU = { tPano: { value: pano }, uBand: { value: new THREE.Vector2(SK.band[0] * rad, SK.band[1] * rad) }, uRotation: { value: SK.turn }, uFade: { value: new THREE.Vector2(SK.fade[0], SK.fade[1]) },
      uAlpha: { value: SK.alpha[0] }, uSat: { value: SK.saturation[0] }, uTint: { value: new THREE.Color(SK.tint[0]) }, uVeil: ctx.engine.shared.uVeil,
      uCool: { value: new THREE.Vector4(SK.cool.from, SK.cool.to, SK.cool.dark[0], SK.cool.dark[1]) }, uCoolTint: { value: new THREE.Color(SK.cool.tint) }, uCoolAmt: { value: SK.cool.amount[0] },
      uWisp: { value: SK.wisps.amount[0] }, uWispLow: { value: new THREE.Color(SK.wisps.low[0]) }, uWispHigh: { value: new THREE.Color(SK.wisps.high[0]) },
      uEast: { value: new THREE.Color(SK.east.tint) }, uEastAmt: { value: new THREE.Vector3(SK.east.amount[0], SK.east.from, SK.east.to) } };
    const mat = new THREE.ShaderMaterial({
      // (not `transparent`: it must be drawn with the sky, before everything solid; custom blending still blends it)
      uniforms: panoU, side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false, transparent: false,
      blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.SrcAlphaFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
      vertexShader: /* glsl */`varying vec3 vDir; void main() { vDir = normalize(position); vec4 p = projectionMatrix * viewMatrix * vec4(position + cameraPosition, 1.0); gl_Position = p.xyww; }`,
      fragmentShader: /* glsl */`
        uniform sampler2D tPano; uniform vec2 uBand, uFade; uniform vec3 uTint, uCoolTint, uWispLow, uWispHigh, uEast, uEastAmt; uniform vec4 uCool; uniform float uRotation, uAlpha, uSat, uVeil, uCoolAmt, uWisp; varying vec3 vDir;
        float skyHash(vec2 p) { p = fract(p * vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.y); }
        float skyNoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(skyHash(i), skyHash(i + vec2(1.0, 0.0)), f.x), mix(skyHash(i + vec2(0.0, 1.0)), skyHash(i + vec2(1.0, 1.0)), f.x), f.y); }
        float skyFbm(vec2 p) { return 0.5 * skyNoise(p) + 0.28 * skyNoise(p * 2.07 + 11.3) + 0.15 * skyNoise(p * 4.3 + 5.1) + 0.07 * skyNoise(p * 8.9 + 2.2); }
        void main() {
          vec3 d = normalize(vDir);
          float e = asin(clamp(d.y, -1.0, 1.0)), v = (e - uBand.x) / (uBand.y - uBand.x);
          // Above the painting the sky was one flat violet (postcards 2 and 7 look straight up into it). High mare's tails
          // are drawn there in code: long wisps laid along the evening wind, gold where they are low and toward the sun,
          // rose and then lost in the violet overhead. (v > 1 is above the painting's band; they begin inside its faded top.)
          if (v <= 0.0) discard;
          // (take-over) away from the sun the sky cools and darkens: behind the rider it is the evening's other half, mauve
          // and slate over a rose foot (the foot keeps the fog's colour all round, or the far water would end in a line)
          float east = uEastAmt.x * (1.0 - smoothstep(-0.85, 0.25, -d.z / max(length(d.xz), 1e-3))) * smoothstep(uEastAmt.y, uEastAmt.z, v);
          if (v >= 1.0 - uFade.y) {
            vec2 sp = d.xz / max(d.y, 0.12);                                  // the sky as a ceiling
            vec2 q = vec2(sp.x * 0.55 + 0.35 * sin(sp.y * 0.7), sp.y * 0.11);  // drawn out along the wind (the way to the sun)
            float n = skyFbm(q * 2.3 + 3.7), n2 = skyFbm(q * 6.1 - 1.9);
            float wisp = smoothstep(0.4, 0.72, n + 0.22 * n2) * smoothstep(1.0 - uFade.y, 1.0, v) * (1.0 - smoothstep(0.9, 0.998, d.y));
            float low = 1.0 - smoothstep(0.55, 0.95, d.y), toward = smoothstep(-0.2, 0.9, -d.z / max(length(d.xz), 1e-3));
            vec3 wc = mix(uWispHigh, uWispLow, low * (0.35 + 0.65 * toward)); wc = mix(wc, wc * uEast, east);
            if (v >= 1.0) { gl_FragColor = vec4(wc, uWisp * wisp * (1.0 - uVeil)); return; }
            // (inside the painting's faded top the wisps are mixed in under it, below)
            vec4 keep = vec4(wc, uWisp * wisp);
            float ua0 = (atan(d.x, -d.z) + uRotation) / 6.2831853;
            vec3 c0 = texture2D(tPano, vec2(fract(ua0) + 0.5, v)).rgb;
            float lum0 = dot(c0, vec3(0.2126, 0.7152, 0.0722));
            c0 = mix(c0, c0 * uCoolTint, uCoolAmt * smoothstep(uCool.x, uCool.y, v) * (0.4 + 0.6 * (1.0 - smoothstep(uCool.z, uCool.w, lum0))));
            c0 = mix(vec3(dot(c0, vec3(0.2126, 0.7152, 0.0722))), c0, uSat) * uTint;
            c0 = mix(c0, c0 * uEast, east);
            float a0 = uAlpha * (1.0 - smoothstep(1.0 - max(1e-4, uFade.y), 1.0, v));
            float at = a0 + keep.a * (1.0 - a0);
            gl_FragColor = vec4((c0 * a0 + keep.rgb * keep.a * (1.0 - a0)) / max(at, 1e-4), at * (1.0 - uVeil)); return;
          }
          // the angle jumps by a whole turn behind the rider: take the picture's slope from whichever copy is smooth here
          float ua = (atan(d.x, -d.z) + uRotation) / 6.2831853, ub = fract(ua);
          vec2 uvA = vec2(ua + 0.5, v), uvB = vec2(ub + 0.5, v), gx = dFdx(uvA), gy = dFdy(uvA), hx = dFdx(uvB), hy = dFdy(uvB);
          if (dot(hx, hx) + dot(hy, hy) < dot(gx, gx) + dot(gy, gy)) { gx = hx; gy = hy; }
          vec3 c = textureGrad(tPano, uvA, gx, gy).rgb;
          // violet into the clouds by height: their shaded parts go mauve, their lit undersides stay gold
          float lum = dot(c, vec3(0.2126, 0.7152, 0.0722));
          c = mix(c, c * uCoolTint, uCoolAmt * smoothstep(uCool.x, uCool.y, v) * (0.4 + 0.6 * (1.0 - smoothstep(uCool.z, uCool.w, lum))));
          c = mix(vec3(dot(c, vec3(0.2126, 0.7152, 0.0722))), c, uSat) * uTint;
          c = mix(c, c * uEast, east);
          float a = uAlpha * smoothstep(0.0, max(1e-4, uFade.x), v) * (1.0 - smoothstep(1.0 - max(1e-4, uFade.y), 1.0, v)) * (1.0 - uVeil);
          gl_FragColor = vec4(c, a);
        }`,
    });
    const dome = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 24), mat);
    dome.name = 'sky painting'; dome.renderOrder = -999.5; dome.frustumCulled = false;
    ctx.add(dome);
  }
  const tintFrom = new THREE.Color(SK.tint[0]), tintTo = new THREE.Color(SK.tint[1]);
  const wispLow = SK.wisps.low.map((c) => new THREE.Color(c)), wispHigh = SK.wisps.high.map((c) => new THREE.Color(c));

  // ================================================================================================ the light states
  const L = ctx.lookStates({ start: {}, end: { look: plan.light.end, water: plan.water.end } });

  // ================================================================================================ the land
  // The banks follow the channel's edge. Their cross-section is the page's: a ford under shallow water, then steps.
  // bank(side, s) gives where the three risers stand (metres outside the channel edge) and how high each step is.
  const N = plan.nave.terraces, M = plan.madderSteps, R = plan.rightTerrace;
  const sections = {
    right: [
      [-600, { out: N.out, y: N.height }], [90, { out: N.out, y: N.height }],
      [98, { out: M.out, y: M.height }], [128, { out: M.out, y: M.height }],
      [136, { out: [7, 10, 13], y: [1.2, 2.0, 3.0] }], [180, { out: [7, 10, 13], y: [1.2, 2.0, 3.0] }],      // behind the wringing gallery, which stands in the water
      [198, { out: [2.2, 6, 11], y: [0.9, 1.9, 3.0] }], [212, { out: R.out, y: R.height }], [236, { out: R.out, y: R.height }],
      [242, { out: [1.7, 3.4, 3.6], y: [0.6, 0.6, 3.0] }], [600, { out: [1.7, 3.4, 3.6], y: [0.6, 0.6, 3.0] }],      // the loft: its plank walk, then the ground its wall stands against
    ],
    left: [
      [-600, { out: N.out, y: N.height }], [90, { out: N.out, y: N.height }],
      [100, { out: [3, 8, 14], y: [0.8, 1.9, 3.0] }], [106, { out: [3, 18, 22], y: [0.8, 1.9, 3.0] }],        // the indigo quay: one level at 0.8 m under the house
      [140, { out: [3, 18, 22], y: [0.8, 1.9, 3.0] }],
    ],
  };
  const bank = (side, s) => {
    const list = sections[side > 0 ? 'right' : 'left'];
    let i = 0; while (i < list.length - 2 && s > list[i + 1][0]) i++;
    const a = list[i], b = list[i + 1], t = smooth(a[0], b[0], s);
    return { out: a[1].out.map((v, k) => lerp(v, b[1].out[k], t)), y: a[1].y.map((v, k) => lerp(v, b[1].y[k], t)) };
  };
  const stone = new THREE.Color(C.stoneLocal), setts = new THREE.Color(C.setts), silt = new THREE.Color(C.silt), field = new THREE.Color(C.field), fieldFar = new THREE.Color(C.fieldFar), bed = new THREE.Color('#5C4250');      // (take-over: the bed was #8A6A6C: through the thin water at every shore it stood as a pale line)
  // one ribbon of land along one side, from s0 to s1 (it may run on straight behind the start and beyond the end)
  const ribbon = (side, s0, s1, step, cap = false) => {
    const pos = [], colr = [], idx = [], P = {}, Q = {};
    const row = (s) => {
      const sc = Math.min(path.length, Math.max(0, s)), p = path.at(sc, P), over = s - sc, hw = p.halfWidth, b = bank(side, s);
      const ox = p.x + p.tx * over, oz = p.z + p.tz * over;
      const prof = [
        [-2.5, -1.7, bed], [0, -0.9, bed], [b.out[0] - 0.4, -0.55, setts], [b.out[0], -0.35, setts],
        [b.out[0] + 0.03, b.y[0], stone], [b.out[1], b.y[0], setts], [b.out[1] + 0.03, b.y[1], stone], [b.out[2], b.y[1], setts], [b.out[2] + 0.03, b.y[2], stone],
        [b.out[2] + 30, b.y[2], silt], [b.out[2] + 110, b.y[2] + 0.1, field], [260, b.y[2] + 0.3, fieldFar], [760, b.y[2] + 1.5, fieldFar],
      ];
      for (const [out, y, c] of prof) {
        // far from the water the land follows the broad sweep of the waterway (as kit.bank does), so that it never folds
        let ax = p.rx, az = p.rz;
        if (out > 6) {
          ax = 0; az = 0;
          for (let j = -4; j <= 4; j++) { const q = path.at(Math.min(path.length, Math.max(0, sc + out * 1.5 * j / 4)), Q); ax += q.rx; az += q.rz; }
          const l = Math.hypot(ax, az) || 1; ax /= l; az /= l;
          const k = smooth(6, 30, out); ax = lerp(p.rx, ax, k); az = lerp(p.rz, az, k);
        }
        pos.push(ox + side * (p.rx * hw + ax * out), y, oz + side * (p.rz * hw + az * out)); colr.push(c.r, c.g, c.b);
      }
      return prof.length;
    };
    let rows = 0, cols = 0;
    for (let s = s0; s <= s1 + 1e-6; s += (s < -40 || s > path.length + 20 ? 60 : step)) { cols = row(s); rows++; }
    for (let r = 0; r < rows - 1; r++) for (let c = 0; c < cols - 1; c++) { const a = r * cols + c, b2 = a + 1, d = a + cols, e = d + 1; if (side > 0) idx.push(a, b2, d, b2, e, d); else idx.push(a, d, b2, b2, d, e); }
    if (cap) {                                                       // the steps end in a return wall: close the last cross-section down to the bed
      const base = (rows - 1) * cols, n0 = pos.length / 3;
      for (let c = 0; c < cols; c++) { const i = (base + c) * 3; pos.push(pos[i], pos[i + 1], pos[i + 2], pos[i], -1.7, pos[i + 2]); colr.push(stone.r, stone.g, stone.b, stone.r, stone.g, stone.b); }
      for (let c = 0; c < cols - 1; c++) { const a = n0 + c * 2, b2 = a + 1, d = a + 2, e = a + 3; if (side > 0) idx.push(a, d, b2, b2, d, e); else idx.push(a, b2, d, b2, e, d); }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(colr, 3)); geo.setIndex(idx); geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, shared.mat.land); m.name = 'land'; m.frustumCulled = false; ctx.add(m);
    sun.solid(m, false);                                             // the ground hides the sun's disc by itself; it does not cut the coin in a cloth
    return m;
  };
  ribbon(1, -640, path.length + 60, 2);
  ribbon(-1, -640, 140, 2, true);

  // The low grounds, given by their outlines in the world (x, z): the south-west ground behind the blue yard and along
  // the forebay and the sun road's south bank, and the ground north of the sun road with the causeway.
  // (Stage 2: they were flat slabs with knife edges. Now every edge that meets open water is a SHORE: the ground comes
  // down to the water over a couple of metres, unevenly, and goes on under it; an edge that a wall of the kit faces
  // stays upright, exactly where it was; the tops are where they were, so that what stands on them still stands.)
  {
    const at = (s, d) => { const v = kit.at(s, d); return [v.x, v.z]; }, hw = (s) => kit.halfWidth(s);
    const wetSilt = silt.clone().multiplyScalar(0.72), noise = (x, z) => kit.noise(x * 0.31 + 5.1, z * 0.31 - 2.7);
    // outline: [x, z, kind, reach]: `kind` of the edge that leaves this corner: 'shore' (it reaches `reach` metres into the water), 'wall', or nothing
    const ground = (outline, top) => {
      const n = outline.length; let area = 0;
      for (let i = 0; i < n; i++) { const a = outline[i], b2 = outline[(i + 1) % n]; area += a[0] * b2[1] - b2[0] * a[1]; }
      const turn = area > 0 ? 1 : -1, pos = [], colr = [], idx = [];
      const put = (x, y, z, c) => { pos.push(x, y, z); colr.push(c.r, c.g, c.b); return pos.length / 3 - 1; };
      const tri = (i, j, k, wx, wy, wz) => {                              // a triangle whose face looks toward (wx, wy, wz)
        const ax = pos[j * 3] - pos[i * 3], ay = pos[j * 3 + 1] - pos[i * 3 + 1], az = pos[j * 3 + 2] - pos[i * 3 + 2], bx = pos[k * 3] - pos[i * 3], by = pos[k * 3 + 1] - pos[i * 3 + 1], bz = pos[k * 3 + 2] - pos[i * 3 + 2];
        if ((ay * bz - az * by) * wx + (az * bx - ax * bz) * wy + (ax * by - ay * bx) * wz >= 0) idx.push(i, j, k); else idx.push(i, k, j);
      };
      // the edge of the top, cut finely where it is a shore and near enough to be seen
      const rim = [];
      for (let i = 0; i < n; i++) {
        const a = outline[i], b2 = outline[(i + 1) % n], kind = a[2] || null, len = Math.hypot(b2[0] - a[0], b2[1] - a[1]), dx = (b2[0] - a[0]) / len, dz = (b2[1] - a[1]) / len;
        const nx = dz * turn, nz = -dx * turn;                             // out of the ground, toward the water
        let t = 0;
        while (t < len - 1e-6) {
          const x = a[0] + dx * t, z = a[1] + dz * t;
          rim.push({ x, z, nx, nz, kind, reach: a[3] || 2, corner: t === 0 });
          t += kind === 'shore' ? (Math.abs(x) < 160 && z > -330 ? 2.6 : 14) : len;
        }
      }
      // corners between two shores look both ways
      for (let i = 0; i < rim.length; i++) { const r = rim[i], q = rim[(i + rim.length - 1) % rim.length]; if (r.corner && r.kind === 'shore' && q.kind === 'shore') { const mx = r.nx + q.nx, mz = r.nz + q.nz, l = Math.hypot(mx, mz) || 1; r.cx = mx / l; r.cz = mz / l; } }
      const topIdx = [], contour = [];
      for (const r of rim) {
        const shore = r.kind === 'shore', q = shore ? noise(r.x, r.z) : 0, ox = r.cx ?? r.nx, oz = r.cz ?? r.nz;
        r.tx = r.x - ox * 0.35 * q * (shore ? 1 : 0); r.tz = r.z - oz * 0.35 * q * (shore ? 1 : 0);      // (the top's edge wanders inward a little, never outward)
        r.top = put(r.tx, top, r.tz, silt); topIdx.push(r.top); contour.push(new THREE.Vector2(r.tx, r.tz));
      }
      for (const f of THREE.ShapeUtils.triangulateShape(contour, [])) tri(topIdx[f[0]], topIdx[f[1]], topIdx[f[2]], 0, 1, 0);
      // the skirts
      const m = rim.length;
      for (let i = 0; i < m; i++) {
        const r = rim[i], q = rim[(i + 1) % m];
        if (r.kind === 'shore') {
          for (const e of [r, q]) if (e.rows === undefined) {
            const mine = e.kind === 'shore', ox = mine ? (e.cx ?? e.nx) : r.nx, oz = mine ? (e.cz ?? e.nz) : r.nz, R = mine ? e.reach : r.reach, n1 = noise(e.x * 1.7 + 9, e.z * 1.7), n2 = noise(e.x * 0.6 - 4, e.z * 0.6 + 8);
            e.rows = [
              put(e.tx + ox * R * (0.3 + 0.25 * n1), top * 0.52, e.tz + oz * R * (0.3 + 0.25 * n1), silt),
              put(e.tx + ox * R * (0.72 + 0.3 * n2), 0.04, e.tz + oz * R * (0.72 + 0.3 * n2), wetSilt),
              put(e.tx + ox * (R * 1.25 + 0.7), -0.9, e.tz + oz * (R * 1.25 + 0.7), bed),
            ];
          }
          const A = [r.top, ...r.rows], B = [q.top, ...q.rows], wx = r.nx, wz = r.nz;
          for (let k = 0; k < 3; k++) { tri(A[k], B[k], A[k + 1], wx, 2, wz); tri(B[k], B[k + 1], A[k + 1], wx, 2, wz); }
        } else if (r.kind === 'wall') {
          const a0 = put(r.tx, top, r.tz, stone), a1 = put(q.tx ?? q.x, top, q.tz ?? q.z, stone), b0 = put(r.tx, -1.6, r.tz, stone), b1 = put(q.tx ?? q.x, -1.6, q.tz ?? q.z, stone);
          tri(a0, a1, b0, r.nx, 0, r.nz); tri(a1, b1, b0, r.nx, 0, r.nz);
        }
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(colr, 3)); geo.setIndex(idx); geo.computeVertexNormals();
      const mesh = new THREE.Mesh(geo, shared.mat.land); mesh.name = 'land low'; mesh.frustumCulled = false; ctx.add(mesh); sun.solid(mesh, false);
      return mesh;
    };
    // south-west: behind the blue yard (a steep little bank under its south wall's hems), the weir's bank, the sun road's south bank
    ground([
      [...at(140, -50.2), 'shore', 1.2], [...at(150, -50.2), 'shore', 1.2], [...at(158, -50.2), 'shore', 1.2], [...at(166, -50.2), 'shore', 2.2], [-36, -197, 'shore', 2.4], [plan.sunRoad.x[0], -216, 'shore', 2.4],
      [plan.sunRoad.x[0], -900], [-760, -900], at(140, -(hw(140) + 760)),
    ], 0.6);
    // north of the sun road: its north bank (a shore), then the causeway and the loft's south side (upright: the kit's stone faces them)
    const nw = [[plan.sunRoad.x[1], -900, 'shore', 2.4], [plan.sunRoad.x[1], -212.5, 'wall'], [14.6, -212.5, 'wall']];
    for (let s = 209; s <= 240; s += 2) nw.push([...at(s, -(hw(s) + 0.35)), 'wall']);
    const lw = plan.loft.wall;
    nw.push([...at(241, -lw), 'wall'], [...at(260.4, -lw), 'wall'], [36.5 - lw, -285, 'wall'], [36.5 + lw, -285], [36.5 + lw, -290], [760, -290], [760, -900]);
    ground(nw, plan.causeway.top);
  }

  // ================================================================================================ the far band
  // Painted hills, poplars and the far edge of the works, standing on rails all round (plan.farBand), never nearer than
  // 150 m to water the boat can reach. Each strip is ONE object: a ribbon that follows its rail, the picture repeated
  // along it, lower toward its two ends, which stand either side of the sun road so that the west stays open.
  shared.farBand = [];
  if (plan.art.farbank) {
    let tex = null;
    try { tex = await ctx.tex('art/reach/farbank.webp'); } catch (e) { tex = null; }
    if (tex) for (const st of plan.farBand.strips) {
      // the rail as a line of points 6 m apart, its corners rounded
      const R = st.rail.map(([x, z]) => new THREE.Vector2(x, z)), line = [R[0].clone()];
      for (let i = 1; i < R.length; i++) {
        const a = R[i - 1], b2 = R[i], c = R[i + 1];
        if (!c) { line.push(b2.clone()); break; }
        const d0 = b2.clone().sub(a).normalize(), d1 = c.clone().sub(b2).normalize(), p0 = b2.clone().addScaledVector(d0, -st.corner), p1 = b2.clone().addScaledVector(d1, st.corner);
        line.push(p0);
        for (let k = 1; k < 10; k++) { const t = k / 10; line.push(p0.clone().multiplyScalar((1 - t) * (1 - t)).addScaledVector(b2, 2 * t * (1 - t)).addScaledVector(p1, t * t)); }
        line.push(p1);
      }
      const pts = [line[0]];
      for (let i = 1; i < line.length; i++) { const a = pts[pts.length - 1], b2 = line[i], n = Math.max(1, Math.round(a.distanceTo(b2) / 30)); for (let k = 1; k <= n; k++) pts.push(a.clone().lerp(b2, k / n)); }
      let total = 0; const at = [0];
      for (let i = 1; i < pts.length; i++) { total += pts[i].distanceTo(pts[i - 1]); at.push(total); }
      const W = st.height * st.aspect, pos = [], uv = [], idx = [];
      for (let i = 0; i < pts.length - 1; i++) {
        // (each piece carries its own stretch of the picture, so that the picture can begin again without a wrapping texture)
        let d0 = at[i], d1 = at[i + 1];
        while (d0 < d1 - 1e-3) {
          const end = Math.min(d1, (Math.floor(d0 / W + 1e-6) + 1) * W), f0 = (d0 - at[i]) / (at[i + 1] - at[i]), f1 = (end - at[i]) / (at[i + 1] - at[i]);
          const p0 = pts[i].clone().lerp(pts[i + 1], f0), p1 = pts[i].clone().lerp(pts[i + 1], f1);
          const h0 = st.height * smooth(0, st.taper, Math.min(d0, total - d0)), h1 = st.height * smooth(0, st.taper, Math.min(end, total - end));
          const u0 = (d0 / W) % 1, u1 = u0 + (end - d0) / W, n0 = pos.length / 3;
          pos.push(p0.x, st.base, p0.y, p1.x, st.base, p1.y, p1.x, st.base + h1, p1.y, p0.x, st.base + h0, p0.y);
          uv.push(u0, 0, u1, 0, u1, 1, u0, 1); idx.push(n0, n0 + 1, n0 + 2, n0, n0 + 2, n0 + 3);
          d0 = end;
        }
      }
      // The strip's own material (second look). It was the kit's flat: a cut-out taken where the picture is half opaque.
      // But the painting's shapes carry a pale glow round them, and the works' strip has grey-white mist painted among its
      // flags: cut at half opaque, both stood along every crest as a white ragged line, like snow on the far hills. Here
      // the cut is taken where the picture is nearly solid (plan.farBand.edge), what is pale AND grey in it is left out
      // (`pale`), and the rest is drawn as the kit does it: tinted, in fog at plan.farBand.fog, hidden by the veil.
      const sh = ctx.engine.shared, FB = plan.farBand;
      const mat = new THREE.ShaderMaterial({
        uniforms: { map: { value: tex }, uTint: { value: new THREE.Color(st.tint || '#ffffff') }, uRows: { value: new THREE.Vector2(st.v[0], st.v[1]) }, uEdge: { value: FB.edge }, uPale: { value: new THREE.Vector4(...FB.pale) }, uFogAmount: { value: FB.fog },
          uFogColor: sh.uFogColor, uFogDensity: sh.uFogDensity, uVeilColor: sh.uVeilColor, uVeil: sh.uVeil },
        side: THREE.DoubleSide, fog: false,
        vertexShader: /* glsl */`uniform vec2 uRows; varying vec2 vUv; varying float vDist;
          void main() { vUv = vec2(uv.x, mix(uRows.x, uRows.y, uv.y)); vec4 mv = modelViewMatrix * vec4(position, 1.0); vDist = length(mv.xyz); gl_Position = projectionMatrix * mv; }`,
        fragmentShader: /* glsl */`uniform sampler2D map; uniform vec3 uTint, uFogColor, uVeilColor; uniform vec4 uPale; uniform float uEdge, uFogAmount, uFogDensity, uVeil; varying vec2 vUv; varying float vDist;
          void main() {
            vec4 t = texture2D(map, vUv);
            float mx = max(t.r, max(t.g, t.b)), mn = min(t.r, min(t.g, t.b)), sat = (mx - mn) / max(mx, 1e-3);
            float a = t.a * (1.0 - smoothstep(uPale.x, uPale.y, mx) * (1.0 - smoothstep(uPale.z, uPale.w, sat)));
            if (a < uEdge) discard;
            float f = (1.0 - exp(-uFogDensity * uFogDensity * vDist * vDist)) * uFogAmount, fa2 = uFogAmount * uFogAmount, fa4 = fa2 * fa2, vl = uVeil * (1.0 - fa4 * fa4);
            gl_FragColor = vec4(mix(mix(t.rgb * uTint, uFogColor, f), uVeilColor, vl), 1.0);
          }`,
      });
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx);
      const m = new THREE.Mesh(geo, mat); m.name = st.name; m.frustumCulled = false;
      ctx.add(m);
      shared.farBand.push(m);
    }
  }

  // ================================================================================================ haze on the water
  // (critique: THE STEP IN THE NAVE'S LIGHT. The engine's mist fades a card by how far each point of it is from the eye, but a card is
  // cut off whole, in one frame, when its middle passes behind the eye. These cards lie on the route (the nave's within 9 m of the
  // line, 13 to 33 m wide), so the boat rides through them: as the eye passed s 55.5 the whole picture lost 2.1 per cent of its
  // light in one frame and 0.5 per cent three frames later (the film's "step when the sun passes behind a bolt, boat at 64 m": its
  // camera was 8 m behind the boat). It was never the sun's cover or the shade line. Here a card also fades by its own depth in
  // front of the eye: whole at 9 m, gone at a metre and a half. kit.mist itself is the engine's: docs/build/reach/5-critique.md.)
  const offEye = (mesh) => { const m = mesh && mesh.material, a = 'vDist = length(mv.xyz);'; if (m && m.vertexShader && m.vertexShader.includes(a)) { m.vertexShader = m.vertexShader.replace(a, 'vDist = min(length(mv.xyz), -mv.z * 1.3);'); m.needsUpdate = true; } return mesh; };
  offEye(kit.mist({ count: 16, from: 100, to: 236, spread: 60, y: [0.4, 2.6], size: 46, opacity: 0.035, drift: 0.2, seed: 5 }));
  // (stage 2) the air has layers: a thin warm haze between the arches of the nave, so that each rank of cloth stands a
  // step further into the light than the one before it; and lint, which is the air made visible: fine motes that drift
  // west on the evening wind round the rider, bright only against what is dark (they add their light: against the sky
  // they are nothing).
  const A = plan.air;
  offEye(kit.mist({ count: A.nave.count, from: A.nave.from, to: A.nave.to, spread: A.nave.spread, y: A.nave.y, size: A.nave.size, opacity: A.nave.opacity, color: A.nave.color, drift: 0.15, seed: 11 }));
  const lint = kit.particles({ count: A.lint.count, box: A.lint.box, y: A.lint.y, velocity: A.lint.velocity, sway: 0.3, swaySpeed: 0.35, size: A.lint.size, color: A.lint.color, shape: 'mote', additive: true, opacity: A.lint.opacity, twinkle: 0.5, intensity: 1, fadeNear: 1.6, seed: 23 });
  ctx.only(lint, 'direct');                                              // too small for the water's mirror

  // (second look) THE SHAFTS. Light that has come under a rank's hems lies in the nave's dusty air as long low beams,
  // sloping down toward the rider as the sun does, each from the edge of a hem that explains it (plan.air.shafts). The
  // kit's shafts draw nothing seen end-on, and from the composed line every beam of this sun is nearly end-on: so these
  // are ribbons of the area's own, turned about their length to face the eye, bright across their middle, dusty along
  // their length, and fading out as the eye comes into their line (a beam looked straight down is a glare, not a beam).
  // They add the DYED light (light.js), a little of it: this is a bright realm.
  const shaftMat = (() => {
    const SF = A.shafts;
    if (!SF || !SF.at || !SF.at.length) return null;
    const pos = [], aStart = [], aPar = [], idx = [], K = 10;
    SF.at.forEach(([sAt, d, y, len, wide], n) => {
      const p0 = kit.at(sAt, d, y), base = pos.length / 3;
      for (let k = 0; k <= K; k++) for (const side of [-1, 1]) { pos.push(k / K, side, 0); aStart.push(p0.x, p0.y, p0.z); aPar.push(len, wide, n * 7.13 + 1.7); }
      for (let k = 0; k < K; k++) { const a = base + k * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('aStart', new THREE.Float32BufferAttribute(aStart, 3)); geo.setAttribute('aPar', new THREE.Float32BufferAttribute(aPar, 3)); geo.setIndex(idx);
    const sh = ctx.engine.shared;
    const mat = new THREE.ShaderMaterial({
      uniforms: { uWay: { value: new THREE.Vector3(0, -0.08, 1) }, uColor: { value: new THREE.Color(1, 0.7, 0.4) }, uTime: sh.uTime, uFogDensity: sh.uFogDensity, uVeil: sh.uVeil },
      transparent: true, depthWrite: false, depthTest: true, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
      vertexShader: /* glsl */`attribute vec3 aStart, aPar; uniform vec3 uWay; uniform float uTime; varying vec3 vQ; varying float vFade, vDist;
        void main() {
          float t = position.x; vec3 way = normalize(uWay);
          vec3 P = aStart + way * (t * aPar.x); P.x += 0.5 * sin(uTime * 0.21 + aPar.z);       // (it drifts a hand sideways as the cloth breathes)
          vec3 toEye = cameraPosition - P; float dist = length(toEye); toEye /= max(dist, 1e-3);
          vec3 across = cross(way, toEye); float sl = length(across);                       // sl: the sine of the angle between the beam and the line of sight
          P += (across / max(sl, 1e-3)) * (position.y * aPar.y * (0.55 + 0.45 * t));
          // (and it is not drawn for an eye that looks steeply up at it: against the open sky overhead a beam is a pale stripe with nothing to explain it)
          vQ = vec3(t, position.y, aPar.z); vFade = smoothstep(0.06, 0.2, sl) * smoothstep(2.0, 7.0, dist) * (1.0 - smoothstep(0.26, 0.6, -toEye.y)); vDist = dist;
          gl_Position = projectionMatrix * viewMatrix * vec4(P, 1.0);
        }`,
      fragmentShader: /* glsl */`uniform vec3 uColor; uniform float uTime, uFogDensity, uVeil; varying vec3 vQ; varying float vFade, vDist;
        float sHash(float n) { return fract(sin(n * 127.1) * 43758.5453); }
        float sNoise(float x) { float i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f); return mix(sHash(i), sHash(i + 1.0), f); }
        void main() {
          float across = exp(-vQ.y * vQ.y * 3.2) * (1.0 - smoothstep(0.75, 1.0, abs(vQ.y)));
          float along = smoothstep(0.0, 0.05, vQ.x) * (1.0 - smoothstep(0.35, 1.0, vQ.x));
          float dust = 0.62 + 0.38 * sNoise(vQ.x * 9.0 + vQ.z + uTime * 0.03) + 0.12 * (sNoise(vQ.x * 31.0 - vQ.z * 3.0 - uTime * 0.07) - 0.5);
          float fog = 1.0 - exp(-uFogDensity * uFogDensity * vDist * vDist);
          gl_FragColor = vec4(uColor * (across * along * dust * vFade * (1.0 - fog) * (1.0 - uVeil)), 1.0);
        }`,
    });
    const m = new THREE.Mesh(geo, mat); m.name = 'light shafts'; m.frustumCulled = false; m.renderOrder = 6;
    ctx.add(m); ctx.only(m, 'direct');
    return mat;
  })();

  // ================================================================================================ the water
  // The wheel's rain: rings along both faces of the pier, and a drift over the left of the pass (page section 7).
  ctx.water.onBind(ctx.path, (w) => {
    const W = plan.wheel, x0 = W.hub[0] - 15, x1 = W.hub[0] + 15;
    w.rainZone({ x: x0, z: W.pier.z[0] + 1.2, x2: x1, z2: W.pier.z[0] + 1.2, radius: 1.5, rate: 14, strength: 0.8 });
    w.rainZone({ x: x0, z: W.pier.z[1] - 1.2, x2: x1, z2: W.pier.z[1] - 1.2, radius: 1.5, rate: 14, strength: 0.8 });
    const dft = kit.at(202, -3);
    w.rainZone({ x: dft.x, z: dft.z, radius: 8, rate: 3, strength: 0.6, soft: 0.6 });
  });

  // THE GLAZE (take-over of the second look; docs/build/reach/2-light.md). THE DYE ON THE WATER, drawn by this area.
  // The engine's dye film is a matte, opaque coat: where it lies the mirror, the sun's road and every reflection are
  // gone, and a figure is a flat patch. Dye in water does the opposite: it takes light away and leaves the water wet.
  // So the dye is ONE SHEET on the water plane, drawn after the water, blended as
  //     picture = (picture + a little of the dye's own body) x what the dye lets through
  // and the mirror, the road, the wake's foam and every ring stay in it. Its figure is worked out per pixel:
  //   - the water of a place is followed back to where it lay at rest: the ripples bend it a little; the EDDIES THAT TURN
  //     (plan.water.glaze.turning: the page's three and seven more) have wound it, in two phases half a cycle apart that
  //     are mixed by their weights, so that the water turns for ever and never winds to a blur; the static swirls and the
  //     slow warp are read from a map (dye.js, glazeMaps);
  //   - there the GROUND gives a level (down the river, bowed in mid-stream, two swells), and the fine BANDS lie between
  //     its levels: no two the same width, each drawn by lot once: dye or clear water, pale or deep, a tinge of the other
  //     bank's dye, a hairline of clear water along its edge. Whether a group of bands is dye at all goes by how RICH the
  //     place is (broad masses, the lane beside the composed line, the pools where the postcards look);
  //   - what a dye lets through is read by where along the route the place is (saffron and madder in the first bays,
  //     indigo against crimson in the lagoon, violet at the door, indigo in the loft): the whole river shows it at once
  //     (the film used to change colour round the boat);
  //   - where the bands are finer than a pixel the sheet goes over into their mean: the far field in broad masses;
  //   - at a grazing angle the water is a mirror and shows less of what is in it (`glance`).
  // The engine's film is kept, out of sight (its amount is next to nothing), as the carrier: the hull's swirl lives in it,
  // and what the cast pours on the water (trace.inject, channels 'a' and 'b': the left bank's dye and the right's) is
  // carried, curled by the wake and read here as more dye; it is forgotten over `forget` seconds (the multiply below: the
  // engine would relax it toward a pattern of its own).
  const GZ = plan.water.glaze;
  // FIFTH HOLDER: THE DYE IS COLOUR IN THE WATER (plan.water.glaze.inwater; the glaze's shader, `DYE_IN`). The fourth holder's film is
  // matte: it hides the mirror where it lies, and a light dye (the nave's saffron) lay on the water as a carpet. A dye takes
  // light away hue by hue and gives a little of its own colour back: the picture is MULTIPLIED by what the dye lets through
  // (the mirror, the cloth, the wheel and the road stay in it, coloured) and takes the dye's own body by its depth. One draw,
  // one blend: out = picture x S + S x a. (&dye=film: the fourth holder's film; &dye=in: this; unsaid: plan.water.glaze.inwater.on)
  const DYE_IN = !!GZ.inwater && (QS.has('dye') ? QS.get('dye') === 'in' : !!GZ.inwater.on), IW = DYE_IN ? GZ.inwater : null;
  // (and its figure is worked out in FIGURE SPACE, the river's length drawn in IW.fig.k times: see levelAt in the glaze's shader; GF: the ground's numbers there)
  const FIG = IW && IW.fig && IW.fig.k > 1 ? IW.fig : null, GF = FIG ? { ...GZ, ...FIG } : GZ;
  const maps = QS.has('nofig') ? null : await glazeMapsSlowly(plan, path, 5, FIG ? { fig: FIG } : null);
  const glaze = (() => {
    if (!maps) return null;
    const K = GZ.kinds, NE = Math.max(1, Math.min(12, maps.turning.length)), sh = ctx.engine.shared, WU = waterUniforms(ctx.engine);
    const tex = (d, w, h, type, nearest) => { const t = new THREE.DataTexture(d, w, h, THREE.RGBAFormat, type); t.minFilter = t.magFilter = nearest ? THREE.NearestFilter : THREE.LinearFilter; t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.generateMipmaps = false; t.colorSpace = THREE.NoColorSpace; t.unpackAlignment = 1; t.needsUpdate = true; return t; };
    const tComp = tex(maps.comp.data, maps.comp.width, maps.comp.height, THREE.UnsignedByteType), tSwirl = tex(maps.swirl.data, maps.swirl.width, maps.swirl.height, THREE.HalfFloatType), tBands = tex(maps.bands.data, maps.bands.width, maps.bands.height, THREE.UnsignedByteType, true);
    // what the dyes let through, along the route: three rows (the left bank's dye, the right bank's, both together)
    const NL = 64, lut = new Uint8Array(NL * 4 * 4), at3 = (stops, x) => { const o = [0, 0, 0]; for (let c = 0; c < 3; c++) o[c] = ramp(stops.map(([sx, v]) => [sx, v[c]]), x); return o; };
    [(IW || GZ).left, (IW || GZ).right, (IW || GZ).mix].forEach((stops, row) => { for (let i = 0; i < NL; i++) { const v = at3(stops, (i + 0.5) / NL * path.length), k = (row * NL + i) * 4; for (let c = 0; c < 3; c++) lut[k + c] = Math.max(5, Math.min(255, Math.round(v[c] * 255))); lut[k + 3] = 255; } });
    // (fourth row, fourth holder: THE LIGHT ON THE FILM along the route, GZ.film.light: what a film that took no light away
    // would show, in linear light. Under the nave's cloth it is gold; in the open lagoon the rose of the sky.)
    // (its alpha: how deep the dye lies along the route, GZ.film.depth: in the first bays it is a wash the mirror shows through)
    { const FLs = GZ.film.light; for (let i = 0; i < NL; i++) { const sAt = (i + 0.5) / NL * path.length, v = IW ? Array(3).fill(ramp(IW.body, sAt) / 4) : at3(FLs, sAt), k = (3 * NL + i) * 4; for (let c = 0; c < 3; c++) lut[k + c] = Math.max(0, Math.min(255, Math.round(v[c] * 255))); lut[k + 3] = Math.max(0, Math.min(255, Math.round(ramp((IW || GZ.film).depth, sAt) * 255))); } }
    const tLut = tex(lut, NL, 4, THREE.UnsignedByteType);
    // (the mean of the bands' lots, for the far field)
    let depth = 0, other = 0; for (let i = 0; i < GLAZE_BANDS; i++) { depth += maps.bands.data[i * 4 + 2] / 255; other += maps.bands.data[(GLAZE_BANDS + i) * 4 + 1] / 255; }
    depth /= GLAZE_BANDS; other /= GLAZE_BANDS;
    const eddies = []; for (let i = 0; i < NE; i++) { const e = maps.turning[i]; eddies.push(e ? new THREE.Vector4(e.x, e.z, 1 / (e.R * e.R), e.omega * (ctx.reducedMotion ? 0.5 : 1)) : new THREE.Vector4(0, 0, 1e6, 0)); }
    const u = {
      tComp: { value: tComp }, tSwirl: { value: tSwirl }, tBands: { value: tBands }, tLut: { value: tLut }, tTrace: WU.tTrace, tRipple: WU.tRipple, uTraceRect: WU.uTraceRect, uRippleRect: WU.uRippleRect,
      uRect: { value: new THREE.Vector4(maps.x0, maps.z0, 1 / maps.width, 1 / maps.height) }, uSwirlSize: { value: new THREE.Vector2(maps.swirl.width, maps.swirl.height) },
      uGround: { value: new THREE.Vector4(1 / GF.tilt, GF.lean, 1 / GF.ground[0][0], GF.ground[0][1]) }, uGroundB: { value: new THREE.Vector4(1 / GF.ground[1][0], GF.ground[1][1], 1 / GF.stretch, GF.uneven) }, uGroundC: { value: new THREE.Vector2(1 / GF.ground[2][0], GF.ground[2][1]) },
      tStir: { value: null }, uStirSize: { value: new THREE.Vector2(1, 1) }, uStirOn: { value: 0 }, uRichDepth: { value: new THREE.Vector2(GZ.rich.depth[0], GZ.rich.depth[1]) },
      uKinds: { value: new THREE.Vector4(K.rich[0], K.rich[1], K.lotSoft, GZ.soft) }, uKindsB: { value: new THREE.Vector4(K.body, K.thread, K.pale, K.deep) },
      uKindsC: { value: new THREE.Vector4(K.veinWide, GZ.seam.meet, GZ.seam.lot, GZ.pour) }, uView: { value: new THREE.Vector4((IW || GZ).glance, (IW || GZ).glancePow, 1, GZ.wobble) },
      uMean: { value: new THREE.Vector4(K.pale + (K.deep - K.pale) * depth, 1, other, K.cut) },      // (.w: one group in so many bands: 1 / the bands to a group)
      uStroke: { value: new THREE.Vector4(GZ.strokes.amount, GZ.strokes.turns, GZ.strokes.depth, GZ.strokes.taper) }, uStriae: { value: new THREE.Vector4(GZ.striae.amount, GZ.striae.fine, GZ.carry, 1 / GZ.strokes.length) },
      uViolet: { value: new THREE.Vector4(GZ.violet[0], GZ.violet[1], GZ.violet[2], GZ.carrySeam) }, uPhase: { value: new THREE.Vector4(0, 1, 0, 0) }, uEddy: { value: eddies },
      uFogDensity: sh.uFogDensity, uVeil: sh.uVeil, uTraceOn: { value: 0 }, uMap: { value: new THREE.Vector4(0, 0, 30, 9 / 16) }, uFig: { value: new THREE.Vector2(1 / maps.fig.k, 0) }, uFigRect: { value: new THREE.Vector4(maps.x0, maps.fig.z0, 1 / maps.width, 1 / maps.fig.height) },
      uFilmK: { value: IW ? new THREE.Vector4(IW.cover, IW.most, 0, IW.bodyGain) : new THREE.Vector4(GZ.film.cover, GZ.film.most, GZ.film.sheenFar, 0) }, uGroup: { value: new THREE.Vector4(...(IW ? IW.group : [1, 1, 0, 1])) }, uNearDeep: { value: new THREE.Vector3(...(IW ? IW.near : [1, 2, 0])) }, uWater: { value: new THREE.Color(1, 1, 1) }, uWarp: { value: new THREE.Vector2(GF.warp[0], 1 / GF.warp[1]) }, uLoft: { value: new THREE.Vector3(GZ.loft.from / path.length, GZ.loft.to / path.length, GZ.loft.most) }, uLoftCol: { value: new THREE.Color().setRGB(GZ.loft.color[0], GZ.loft.color[1], GZ.loft.color[2]) },
    };
    const mat = new THREE.ShaderMaterial({
      uniforms: u, transparent: true, depthWrite: false, depthTest: true, fog: false, side: THREE.DoubleSide,
      // FOURTH HOLDER: THE DYE IS A MATTE FILM THAT LIES ON THE WATER (the page's own word for it, and what a marbler's
      // colour is). The third holder's sheet multiplied the whole water, mirror included, by what the dye let through: dye
      // as tinted glass over a weak mirror, which gave neither a mirror nor a figure of its own colour. Now the clear
      // water is a real mirror (plan.water.start) and the film hides it: picture = film + picture x (1 - cover), the film
      // in its own colour (what it lets through, times the light on it, GZ.film.light), premultiplied. The figure's
      // machinery is the third holder's, untouched. The picture's alpha (the painter's marks) is left as it is.
      // (fifth holder, DYE_IN: out = S x a + picture x S: the source's alpha times the source, the source's colour times the picture)
      defines: DYE_IN ? { DYE_IN: 1 } : {},
      blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: DYE_IN ? THREE.SrcAlphaFactor : THREE.OneFactor, blendDst: DYE_IN ? THREE.SrcColorFactor : THREE.OneMinusSrcAlphaFactor, blendEquationAlpha: THREE.AddEquation, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
      // (developer, &dyemap=x,z,metres: the dye from straight above as a map filling the picture, x and z its middle in the realm,
      // metres across; the route runs up the picture. It is the real shader, so what the map shows is what lies on the water.)
      vertexShader: /* glsl */`varying vec3 vWorld; uniform vec4 uRect, uMap;
        void main() {
          #ifdef DYE_MAP
            vec2 n = ((position.xz - uRect.xy) * uRect.zw) * 2.0 - 1.0; vWorld = vec3(uMap.x + n.x * uMap.z, position.y, uMap.y + n.y * uMap.z * uMap.w); gl_Position = vec4(n.x, -n.y, 0.0, 1.0);
          #else
            vec4 w = modelMatrix * vec4(position, 1.0); vWorld = w.xyz; gl_Position = projectionMatrix * viewMatrix * w;
          #endif
        }`,
      fragmentShader: /* glsl */`
        #define NE ${NE}
        uniform sampler2D tComp, tSwirl, tBands, tLut, tTrace, tRipple, tStir;
        uniform vec4 uRect, uTraceRect, uRippleRect, uGround, uGroundB, uKinds, uKindsB, uKindsC, uView, uPhase, uMean, uStroke, uStriae, uViolet;
        uniform vec2 uSwirlSize, uStirSize, uGroundC, uRichDepth; uniform vec4 uEddy[NE]; uniform float uFogDensity, uVeil, uTraceOn, uStirOn;
        uniform vec4 uFilmK, uGroup, uFigRect; uniform vec3 uWater, uLoft, uLoftCol, uNearDeep; uniform vec2 uWarp, uFig;
        varying vec3 vWorld;
        // a film of dye this deep, in the colour T lets through: its colour (premultiplied) and how much of the water it hides
        float gDepth = 1.0;      // (how deep the dye lies here along the route: set in main)
        #ifdef DYE_IN
          // (fifth holder) THE DYE IS COLOUR IN THE WATER. A dye this deep, in the colour T lets through: what it TAKES from the light that
          // passes it, hue by hue (rgb: 0 nothing .. 1 all of it), and how much of its own colour it gives back (a: its body)
          // (its body goes by the most it takes of any hue: a pale dye gives next to nothing back, or it would lie on the water as milk)
          vec4 film4(vec3 T, float den) { den = max(den, 0.0) * gDepth; vec3 E = 1.0 - pow(T, vec3(den)); return vec4(E, pow(max(E.r, max(E.g, E.b)), uFilmK.x)); }
          vec4 over4(vec4 a, vec4 b) { return vec4(a.rgb + b.rgb * (1.0 - a.rgb), a.a + b.a * (1.0 - a.a)); }      // one dye over another: what both let through is the product
        #else
          vec4 film4(vec3 T, float den) { den = max(den, 0.0) * gDepth; float o = 1.0 - exp(-uFilmK.x * den); return vec4(pow(T, vec3(den)) * o, o); }
          vec4 over4(vec4 a, vec4 b) { return a + b * (1.0 - a.a); }
        #endif
        // (fifth holder) THE RIBBONS. A group of bands is deep, middling or pale, and a few are clear water, each by its own lot (uGroup: the
        // shallowest and the deepest, of the place's own depth; the share that is clear; the lots' curve): so that a mass of dye is ribbons of
        // related values at the distances where the fine bands can no longer be told apart
        float groupDepth(float lot) { return lot < uGroup.z ? 0.0 : mix(uGroup.x, uGroup.y, pow((lot - uGroup.z) / max(1.0 - uGroup.z, 1e-3), uGroup.w)); }
        float gHash(vec2 p) { p = fract(p * vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.y); }
        float gNoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
          return mix(mix(gHash(i), gHash(i + vec2(1.0, 0.0)), f.x), mix(gHash(i + vec2(0.0, 1.0)), gHash(i + vec2(1.0, 1.0)), f.x), f.y); }
        // a smooth read of the swirl map (a cubic in four taps): its own cells must not show as kinks in a band
        vec4 smoothRead(sampler2D t, vec2 uv, vec2 size) {
          vec2 st = uv * size - 0.5, i = floor(st), f = st - i, f2 = f * f, f3 = f2 * f;
          vec2 w0 = (1.0 - 3.0 * f + 3.0 * f2 - f3) / 6.0, w1 = (4.0 - 6.0 * f2 + 3.0 * f3) / 6.0, w3 = f3 / 6.0, w2 = 1.0 - w0 - w1 - w3;
          vec2 g0 = w0 + w1, g1 = w2 + w3, h0 = (i - 0.5 + w1 / g0) / size, h1 = (i + 1.5 + w3 / g1) / size;
          return (textureLod(t, vec2(h0.x, h0.y), 0.0) * g0.x + textureLod(t, vec2(h1.x, h0.y), 0.0) * g1.x) * g0.y + (textureLod(t, vec2(h0.x, h1.y), 0.0) * g0.x + textureLod(t, vec2(h1.x, h1.y), 0.0) * g1.x) * g1.y;
        }
        // where the water of this place lay before the eddies turned it for tau seconds
        vec2 unwind(vec2 m, float tau) {
          for (int i = 0; i < NE; i++) {
            vec4 e = uEddy[i]; vec2 d = m - e.xy; float g = exp(-dot(d, d) * e.z);
            if (g > 0.002) { float a = -e.w * tau * g, c = cos(a), s = sin(a); m = e.xy + vec2(d.x * c - d.y * s, d.x * s + d.y * c); }
          }
          return m;
        }
        // the ground's level at a place (of the water at rest)
        float levelAt(vec2 m, out vec2 off) {
          // (fifth holder) THE FIGURE IS DRAWN OUT DOWN THE RIVER. From an eye 1.1 m up, a metre of water that lies away from the eye
          // is a seventh as tall on the screen as a metre that lies across it (at 8 m; a fourteenth at 16 m): a round curl is a
          // level streak. So the figure is worked out in a space in which the river's length is drawn in by uFig.x (figure space),
          // and lies on the water drawn out that many times down the river, as a current draws dye out: from the boat its curls
          // are curls. (The composition, the eddies that turn and the wake stay in the world's own metres.)
          vec2 f = vec2(m.x, m.y * uFig.x);
          vec4 sw = smoothRead(tSwirl, (f - uFigRect.xy) * uFigRect.zw, uSwirlSize);
          vec2 w = f + sw.xy; off = vec2(sw.x, sw.y / uFig.x);
          w += uWarp.x * (vec2(gNoise(w * uWarp.y + vec2(3.1, -7.7)), gNoise(w * uWarp.y + vec2(-11.3, 5.9))) - 0.5) * 2.0;      // the slow warp of the ground (the bands' alone: the composition stays where it was put)
          float g = gNoise(vec2(w.x, w.y * uGroundB.z) * uGround.z + vec2(17.3, -4.1)) * uGround.w + gNoise(vec2(w.x, w.y * uGroundB.z) * uGroundB.x + vec2(-9.7, 23.5)) * uGroundB.y + gNoise(w * uGroundC.x + vec2(41.9, 7.7)) * uGroundC.y;
          return (-w.y * uGround.y - sw.z) * uGround.x + g + 64.0;
        }
        float jitter(float i) { return (texelFetch(tBands, ivec2(int(i) & 1023, 1), 0).r - 0.5) * 2.0 * uGroundB.w; }
        float n1(float x) { float i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f); return mix(gHash(vec2(i, 7.3)), gHash(vec2(i + 1.0, 7.3)), f); }
        // What band i lets through, in a place this rich, on this side of the seam. A band of dye is a STROKE: it begins
        // and ends along its length (nal: a slow noise over the water, read by every band at its own phase), widest in
        // its middle and coming to a point at each end; its depth changes along it; and fine STRIAE run down it, as a
        // brush leaves them. f: where in the band's width the place lies (below 0: seen from the next band, across the edge).
        vec4 bandGain(int i, float rich, float right, vec3 Ta, vec3 Tb, vec3 Tm, float nal, float ph, float fw, float f, float e) {
          vec4 a = texelFetch(tBands, ivec2(i & 1023, 0), 0), b = texelFetch(tBands, ivec2(i & 1023, 1), 0);
          float share = mix(uKinds.x, uKinds.y, rich);
          float isRich = 1.0 - smoothstep(share - uKinds.z, share + uKinds.z, a.r);
          float pr = mix(uKindsB.y * min(1.0, rich * 2.0), uKindsB.x, isRich);
          float own = mix(a.g, 0.5 + 0.5 * sin(6.2832 * (nal * uStroke.y + b.a * 7.0 + a.g * 3.0)), uStroke.x);
          float dep = clamp(a.b + uStroke.z * sin(6.2832 * (nal * uStroke.y * 0.7 + a.a * 5.0 + a.b * 3.0)), 0.0, 1.0);
          float on = 1.0 - smoothstep(pr - uStroke.w, pr + uStroke.w, own), wdt = sqrt(on);
          float cover = f < 0.0 ? smoothstep(0.85, 1.0, wdt) : smoothstep(-0.5 * e, 0.5 * e, 0.5 * wdt - abs(f - 0.5) + (wdt > 0.999 ? 0.5 * e : 0.0)) * step(0.001, on);
          float den = mix(uKindsB.z, uKindsB.w, dep) * cover * mix(uRichDepth.x, uRichDepth.y, rich) * groupDepth(b.a);      // (and where the place is rich the dye lies deeper; and by its group's lot)
          float amp = uStriae.x * (1.0 - smoothstep(0.3, 0.8, fw * uStriae.y));
          if (amp > 0.0) den *= 1.0 + amp * (2.0 * (0.6 * n1(ph * uStriae.y + a.g * 57.0) + 0.4 * n1(ph * uStriae.y * 2.7 + a.b * 91.0)) - 1.0);
          float rr = right + (a.a - 0.5) * 2.0 * uKindsC.z, r = smoothstep(-uKindsC.y, uKindsC.y, rr), l = 1.0 - r;
          float oth = max(b.g, uViolet.x * (1.0 - smoothstep(uViolet.y, uViolet.z, abs(rr))));      // near the seam the bands carry both dyes: violet
          float wa = l + oth * r, wb = r + oth * l, tot = wa + wb, shr = wb / tot, meet = 4.0 * wa * wb / (tot * tot);
          vec3 T = mix(mix(Ta, Tb, smoothstep(0.12, 0.88, shr)), Tm, smoothstep(0.2, 0.9, meet));
          return film4(T, den);
        }
        // The figure of one layer: what it lets through where the level is ph (fw: levels to a pixel), for water that lay
        // at m before the turning eddies wound it (mo: how far the static swirls carried it before that).
        vec4 figure(float ph, float fw, vec2 m, vec2 mo, vec4 cp, vec3 Ta, vec3 Tb, vec3 Tm) {
          // (how rich the place is and whose dye it carries are read where the water lay before the swirls turned it, most of the way: the swirls carry tongues of one bank's dye into the other's; the seam is carried less far than the masses: on the composed line the left bank's dye stays to the left)
          vec4 cm = textureLod(tComp, (m + uStriae.z * mo - uRect.xy) * uRect.zw, 0.0);
          float side = textureLod(tComp, (m + uViolet.w * mo - uRect.xy) * uRect.zw, 0.0).g;
          float nal = gNoise((m + uStriae.z * mo) * uStriae.w + vec2(3.3, -8.1));
          float rich = clamp(cm.r + (cp.a - 0.5) * 2.0, 0.0, 1.0), right = (side - 0.5) * 4.0;
          // Far off the bands are finer than a pixel. First the fine bands go over into their GROUP (a broad band of the
          // figure: dye, or open water: the group's own lot is still told apart at two or three times the distance), then the
          // groups go over into the mean of the place: the far field in broad masses.
          float fine = smoothstep(0.35, 1.0, fw), fineG = smoothstep(0.35, 1.0, fw * uMean.w);
          float share = mix(uKinds.x, uKinds.y, rich), rs = smoothstep(-uKindsC.y, uKindsC.y, right), deepen = mix(uRichDepth.x, uRichDepth.y, rich);
          vec3 Tside = mix(mix(Ta, Tb, rs), Tm, clamp(4.0 * rs * (1.0 - rs) + uMean.z, 0.0, 1.0)); float dm0 = uMean.x * deepen;
          vec4 full = 0.25 * (film4(Tside, dm0 * groupDepth(0.125)) + film4(Tside, dm0 * groupDepth(0.375)) + film4(Tside, dm0 * groupDepth(0.625)) + film4(Tside, dm0 * groupDepth(0.875)));      // (the mean over the groups' lots)
          vec4 mean = full * (share * uKindsB.x + (1.0 - share) * uKindsB.y * min(1.0, rich * 2.0));
          if (fineG >= 1.0) return mean;
          // the band this level lies in (no two the same width), and its neighbour across the nearer edge
          float bi = floor(ph), j0 = jitter(bi), j1 = jitter(bi + 1.0);
          if (ph < bi + j0) { bi -= 1.0; j1 = j0; j0 = jitter(bi); } else if (ph >= bi + 1.0 + j1) { bi += 1.0; j0 = j1; j1 = jitter(bi + 1.0); }
          float wide = 1.0 + j1 - j0, f = (ph - bi - j0) / wide, e = clamp(0.5 * uKinds.w + 0.75 * fw / wide, 0.02, 0.5);
          int ib = int(bi);
          vec4 gain = vec4(0.0);
          if (fine > 0.0) {      // the group's own mean
            float isRich = 1.0 - smoothstep(share - uKinds.z, share + uKinds.z, texelFetch(tBands, ivec2(ib & 1023, 0), 0).r);
            gain = film4(Tside, dm0 * groupDepth(texelFetch(tBands, ivec2(ib & 1023, 1), 0).a)) * mix(uKindsB.y * min(1.0, rich * 2.0), uKindsB.x, isRich);
          }
          if (fine < 1.0) {
            vec4 g = bandGain(ib, rich, right, Ta, Tb, Tm, nal, ph, fw, f, e);
            if (f < e) g = mix(bandGain(ib - 1, rich, right, Ta, Tb, Tm, nal, ph, fw, -1.0, e), g, 0.5 + 0.5 * smoothstep(0.0, 1.0, f / e));
            else if (f > 1.0 - e) g = mix(g, bandGain(ib + 1, rich, right, Ta, Tb, Tm, nal, ph, fw, -1.0, e), 0.5 * smoothstep(0.0, 1.0, (f - 1.0 + e) / e));
            // a hairline of clear water along the upstream edge of some bands
            float dm = min(f, 1.0 - f) * wide;
            float vein = texelFetch(tBands, ivec2((f < 0.5 ? ib : ib + 1) & 1023, 1), 0).b * (1.0 - smoothstep(uKindsC.x * 0.5, uKindsC.x + fw, dm)) * (1.0 - smoothstep(0.15, 0.5, fw));
            g *= 1.0 - 0.85 * vein;
            gain = mix(g, gain, fine);
          }
          return mix(gain, mean, fineG);
        }
        void main() {
          vec2 p = vWorld.xz;
          vec3 toEye = cameraPosition - vWorld; float dist = length(toEye), ndv = clamp(toEye.y / max(dist, 1e-3), 0.0, 1.0);
          float fogF = 1.0 - exp(-uFogDensity * uFogDensity * dist * dist);
          #ifdef DYE_MAP
            dist = 6.0; ndv = 1.0; fogF = 0.0;
          #endif
          vec2 ruvw = (p - uRect.xy) * uRect.zw, rim = min(ruvw, 1.0 - ruvw);
          float show = (1.0 - uView.x * pow(1.0 - ndv, uView.y)) * (1.0 - fogF) * (1.0 - uVeil) * smoothstep(0.0, 0.03, min(rim.x, rim.y));      // (and it thins out toward the rim of its own sheet)
          vec4 cp = textureLod(tComp, (p - uRect.xy) * uRect.zw, 0.0);
          float loftK = smoothstep(uLoft.x, uLoft.y, cp.b) * uLoft.z * smoothstep(0.0, 0.03, min(rim.x, rim.y));
          if (show < 0.004 && loftK < 0.004) discard;
          // where the hull's wake (and whatever else stirs the water) has carried it from; and the ripples bend what lies on the water a little
          vec2 q = p, ruv = (p - uRippleRect.xy) / uRippleRect.zw + 0.5, re = min(ruv, 1.0 - ruv);
          if (uStirOn > 0.5) { vec2 suv = (p - uTraceRect.xy) / uTraceRect.zw + 0.5, se = min(suv, 1.0 - suv); if (min(se.x, se.y) > 0.0) q += textureLod(tStir, suv, 0.0).rg * smoothstep(0.0, 0.02, min(se.x, se.y)); }
          if (min(re.x, re.y) > 0.0) q += textureLod(tRipple, ruv, 0.0).xy * (uView.w * smoothstep(0.0, 0.08, min(re.x, re.y)));
          // The eddies that turn, in two phases half a cycle apart: two layers of the same figure, each wound by its own
          // seconds of turning, laid one over the other by their weights (a layer's depth goes by its weight). Each turns
          // steadily, as water does; at the moment a layer is wound furthest it is not there, and comes in unwound.
          float near = 0.0;
          for (int i = 0; i < NE; i++) { vec2 d = q - uEddy[i].xy; near += exp(-dot(d, d) * uEddy[i].z); }
          bool near2 = near > 0.003, two = near2 && uPhase.y > 0.004 && uPhase.w > 0.004;      // (most of the time one layer is the whole figure: the other is not worked out)
          vec2 ma = q, mb = q, oa, ob; float pha, phb;
          if (two) { ma = unwind(q, uPhase.x); mb = unwind(q, uPhase.z); pha = levelAt(ma, oa); phb = levelAt(mb, ob); }
          else { if (near2) ma = unwind(q, uPhase.y > 0.5 ? uPhase.x : uPhase.z); pha = levelAt(ma, oa); phb = pha; mb = ma; ob = oa; }
          float fwa = fwidth(pha), fwb = fwidth(phb);                          // (taken here, where every pixel passes)
          vec4 Wl = textureLod(tLut, vec2(cp.b, 0.875), 0.0); gDepth = Wl.a * (1.0 + uNearDeep.z * (1.0 - smoothstep(uNearDeep.x, uNearDeep.y, dist)));      // the light on the film here along the route; how deep the dye lies
          vec3 Ta = textureLod(tLut, vec2(cp.b, 0.125), 0.0).rgb, Tb = textureLod(tLut, vec2(cp.b, 0.375), 0.0).rgb, Tm = textureLod(tLut, vec2(cp.b, 0.625), 0.0).rgb;
          vec4 fl;      // the film here: its colour (premultiplied, before the light on it) and how much of the water it hides
          if (two) fl = figure(pha, fwa, ma, oa, cp, Ta, Tb, Tm) * uPhase.y + figure(phb, fwb, mb, ob, cp, Ta, Tb, Tm) * uPhase.w;
          else fl = figure(pha, fwa, ma, oa, cp, Ta, Tb, Tm);
          // what the cast has poured on the water lies over it
          if (uTraceOn > 0.5) {
            vec2 tuv = (p - uTraceRect.xy) / uTraceRect.zw + 0.5, te = min(tuv, 1.0 - tuv);
            if (min(te.x, te.y) > 0.0) { vec2 den = min(max(textureLod(tTrace, tuv, 0.0).rg, 0.0), 3.0) * uKindsC.w; vec4 pa = film4(Ta, den.x), pb = film4(Tb, den.y); pa = over4(pa, pb); fl = over4(pa, fl); }
          }
          fl *= show * uFilmK.y;
          vec3 W = Wl.rgb * uWater * (1.0 - 0.72 * smoothstep(uLoft.x, uLoft.y, cp.b));      // the light on the film, here along the route and now (little of it under the loft's roof)
          #ifdef DYE_IN
            // (fifth holder) the picture is multiplied by what the dye lets through (S), and the dye gives back its own colour by its body:
            // out = picture x S + S x a, in one blend. W.r: the level of light the body answers to, along the route and now (a quarter of it).
            vec3 S = 1.0 - fl.rgb; float body = fl.a * uFilmK.w * W.r * 4.0;
            S = mix(S, uLoftCol * 2.0, loftK); body = mix(body, 0.5, loftK);      // under the loft's roof the water is night (see below): it does not thin with the veil
            gl_FragColor = vec4(S, body);
          #else
          gl_FragColor = vec4(W * fl.rgb, fl.a);
          // (fourth holder) UNDER THE LOFT'S ROOF THE WATER IS NIGHT. The engine takes the water toward the FOG's colour as the
          // veil between areas thickens: rose water under indigo cloth, in the very place of postcard 11. Inside the loft a
          // shade lies on the water under the film, dark indigo, and it does not thin with the veil: the water goes into the
          // orchard's dark as the cloth does.
          gl_FragColor += vec4(uLoftCol * loftK, loftK) * (1.0 - gl_FragColor.a);
          #endif
          #ifdef DYE_ONLY
            #ifdef DYE_IN
              gl_FragColor = vec4(gl_FragColor.rgb * (vec3(0.5, 0.2, 0.25) + gl_FragColor.a), 1.0);      // (as on a plain rose water)
            #else
              gl_FragColor = vec4(W * fl.rgb + vec3(0.25) * (1.0 - fl.a), 1.0);
            #endif
            if (DYE_ONLY > 1) { vec4 cmd = textureLod(tComp, (ma + uStriae.z * oa - uRect.xy) * uRect.zw, 0.0); gl_FragColor = vec4(clamp(cmd.r + (cp.a - 0.5) * 2.0, 0.0, 1.0) * 0.8, cmd.g * 0.8, cp.a * 0.8, 1.0); }      // (2: how rich, whose dye, what the place adds)
          #endif
        }`,
    });
    const geo = new THREE.BufferGeometry(), xa = maps.x0, xb = maps.x0 + maps.width, za = maps.z0, zb = maps.z0 + maps.height;
    geo.setAttribute('position', new THREE.Float32BufferAttribute([xa, GZ.y, za, xb, GZ.y, za, xb, GZ.y, zb, xa, GZ.y, zb], 3)); geo.setIndex([0, 2, 1, 0, 3, 2]);
    if (QS.has('dyeonly')) { mat.defines.DYE_ONLY = +QS.get('dyeonly') || 1; mat.blending = THREE.NoBlending; }      // (developer: what the dye lets through, by itself, as a picture)
    const mesh = new THREE.Mesh(geo, mat); mesh.name = 'dye glaze'; mesh.frustumCulled = false; mesh.renderOrder = -0.5;      // straight after the water (-1), before the sun's haze, the glows and the mist
    if (QS.has('dyemap')) { const v = QS.get('dyemap').split(',').map(Number); mat.defines.DYE_MAP = 1; mat.defines.DYE_ONLY = mat.defines.DYE_ONLY || 1; mat.blending = THREE.NoBlending; mat.depthTest = false; u.uMap.value.set(v[0] || 0, v[1] || 0, (v[2] || 60) / 2, 9 / 16); mesh.renderOrder = 60; }
    ctx.add(mesh); ctx.only(mesh, 'direct');
    if (sun.solid) sun.solid(mesh, false);
    // what the cast pours is forgotten: every `every` seconds the film's two pigments are multiplied down (at once, to
    // nothing, when the trace has just been laid: the engine lays its own resting pattern there)
    const fadeMat = new THREE.RawShaderMaterial({
      glslVersion: THREE.GLSL3, depthTest: false, depthWrite: false, transparent: true,
      vertexShader: /* glsl */`precision highp float; in vec3 position; void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }`,
      fragmentShader: /* glsl */`precision highp float; out vec4 oColor; void main() { oColor = vec4(0.0); }`,
      blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.ZeroFactor, blendDst: THREE.ConstantColorFactor, blendEquationAlpha: THREE.AddEquation, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
    });
    const tri = new THREE.BufferGeometry(); tri.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
    const fadeMesh = new THREE.Mesh(tri, fadeMat); fadeMesh.frustumCulled = false;
    const fadeScene = new THREE.Scene(), fadeCam = new THREE.Camera(); fadeScene.add(fadeMesh);
    ctx.onDispose(() => { fadeMat.dispose(); tri.dispose(); });
    // THE STIR. The engine carries its film's pigments along the swirl the hull leaves (a pair of vortices at the stern,
    // one shed every metre or so; a paddle stroke; whatever the cast injects as 'swirl'): velocity = the curl of the
    // trace's third channel. The glaze's figure is not pigment in that film, so it is given the same carrying by a small
    // field of this area's own, laid over the same rectangle at half the trace's cells: for every place, HOW FAR the
    // water now there has been carried from where it lay (metres, x and z). Each frame, with the engine's own rule,
    //     offset(p) = (offset(p - u dt) - u dt) x keep        (u: metres a second; keep: it comes back over `forget` seconds)
    // and the glaze looks its figure up at p + offset(p): the wake curls the dye and it re-forms in about a minute.
    const stirMat = new THREE.RawShaderMaterial({
      glslVersion: THREE.GLSL3, depthTest: false, depthWrite: false, blending: THREE.NoBlending,
      uniforms: { tPrev: { value: null }, tTrace: { value: null }, uSize: { value: new THREE.Vector2(1, 1) }, uStep: { value: new THREE.Vector3(0, 1, 0.2) } },
      vertexShader: /* glsl */`precision highp float; in vec3 position; out vec2 vUv; void main() { vUv = position.xy * 0.5 + 0.5; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
      fragmentShader: /* glsl */`precision highp float; precision highp sampler2D;
        uniform sampler2D tPrev, tTrace; uniform vec2 uSize; uniform vec3 uStep;      // uSize: the trace's rectangle, metres; uStep: seconds, keep, the trace's cell in metres
        in vec2 vUv; out vec4 oColor;
        void main() {
          vec2 px = vec2(uStep.z) / uSize;
          float pl = textureLod(tTrace, vUv - vec2(px.x, 0.0), 0.0).b, pr = textureLod(tTrace, vUv + vec2(px.x, 0.0), 0.0).b, pd = textureLod(tTrace, vUv - vec2(0.0, px.y), 0.0).b, pu = textureLod(tTrace, vUv + vec2(0.0, px.y), 0.0).b;
          vec2 d = clamp(vec2(pu - pd, pl - pr) * (0.5 * uStep.x), vec2(-3.0), vec2(3.0)) * uStep.z;      // metres this frame (the engine: cells of swirl a cell, at most three cells a frame)
          vec2 prev = textureLod(tPrev, vUv - d / uSize, 0.0).rg;
          oColor = vec4(clamp((prev - d) * uStep.y, vec2(-40.0), vec2(40.0)), 0.0, 1.0);
        }`,
    });
    const stirMesh = new THREE.Mesh(tri, stirMat); stirMesh.frustumCulled = false;
    const stirScene = new THREE.Scene(); stirScene.add(stirMesh);
    let stirA = null, stirB = null;
    const stirTarget = (w, h) => { const t = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, format: THREE.RGBAFormat, colorSpace: THREE.NoColorSpace, depthBuffer: false, stencilBuffer: false, generateMipmaps: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter }); t.texture.wrapS = t.texture.wrapT = THREE.ClampToEdgeWrapping; return t; };
    const stirStep = (dt, tr, first) => {
      const r = ctx.engine.renderer, w = Math.max(8, Math.round(tr.width / 2)), h = Math.max(8, Math.round(tr.height / 2));
      if (!r.extensions.has('EXT_color_buffer_float') && !r.extensions.has('EXT_color_buffer_half_float')) { u.uStirOn.value = 0; return; }
      const prev = r.getRenderTarget(), auto = r.autoClear, cc = r.getClearColor(new THREE.Color()), ca = r.getClearAlpha();
      if (!stirA || stirA.width !== w || stirA.height !== h || first) {
        if (!stirA || stirA.width !== w || stirA.height !== h) { if (stirA) { stirA.dispose(); stirB.dispose(); } stirA = stirTarget(w, h); stirB = stirTarget(w, h); }
        r.setClearColor(0x000000, 0); for (const t of [stirA, stirB]) { r.setRenderTarget(t); r.clear(true, false, false); } r.setClearColor(cc, ca);
      }
      const su = stirMat.uniforms;
      su.tPrev.value = stirA.texture; su.tTrace.value = tr.texture; su.uSize.value.set(tr.rect.z, tr.rect.w); su.uStep.value.set(dt, Math.exp(-dt / GZ.forget), tr.cell);
      r.autoClear = false; r.setRenderTarget(stirB); r.render(stirScene, fadeCam); r.setRenderTarget(prev); r.autoClear = auto;
      const t = stirA; stirA = stirB; stirB = t;
      u.tStir.value = stirA.texture; u.uStirSize.value.set(w, h); u.uStirOn.value = 1;
    };
    ctx.onDispose(() => { stirMat.dispose(); if (stirA) { stirA.dispose(); stirB.dispose(); } });
    let since = 0, last = null;
    return {
      mat, mesh, u,
      fresh() { last = null; },
      step(dt) {
        const tr = ctx.water.trace, live = !!(tr && tr.active && tr.float && tr.target && tr.path === ctx.path);
        u.uTraceOn.value = live ? 1 : 0;
        if (!live) { u.uStirOn.value = 0; return; }
        const first = tr.target !== last;
        if (dt > 0 && !QS.has('nostir')) stirStep(dt, tr, first);
        since += dt;
        if (!first && since < 0.13) return;
        const k = first ? 0 : Math.exp(-since / GZ.forget), r = ctx.engine.renderer, prev = r.getRenderTarget(), auto = r.autoClear;
        last = tr.target; since = 0;
        fadeMat.blendColor.setRGB(k, k, 1);
        r.autoClear = false; r.setRenderTarget(tr.target); r.render(fadeScene, fadeCam); r.setRenderTarget(prev); r.autoClear = auto;
      },
    };
  })();
  ctx.water.onBind(ctx.path, () => { if (glaze) glaze.fresh(); });

  // THE MOLTEN ROAD (take-over). The key painting's road is the brightest thing in its lower half: gold dabs lying flat on
  // the water, one above the other, from the wheel's foot to the bottom of the frame. The engine's own path is a smooth
  // glow with pin sequins, and at any strength that reaches the bow it clips to pale peach. So the dabs are drawn here,
  // over the glaze (light off the surface is not dyed by what lies in the water): a fan of water between the eye and the
  // sun, on which every DAB is a facet of the water with a lean of its own that wanders in time; it lights when its
  // lean is the one that throws the sun into the eye (the engine's own law for its path), in three sizes, each seen at
  // the distance where it is a brushmark and not a speck. The ripple field tilts them: a wake or a ring breaks the road
  // and it re-forms. Its colour is the dyed light's (light.js), so a cloth across the sun dyes the road as it dyes the air.
  const RG = plan.water.gold, road = (() => {
    if (!RG || QS.has('noroad')) return null;
    const sh = ctx.engine.shared, WU = waterUniforms(ctx.engine);
    const u = { uSunDir: { value: sun.dir }, uColor: { value: new THREE.Color(1, 0.5, 0.2) }, uCore: { value: new THREE.Color(RG.core) }, uEdge: { value: new THREE.Color(RG.edge) }, uTrack: { value: new THREE.Color(RG.trough) },
      uDab: { value: new THREE.Vector4(RG.dab[0], RG.dab[1], RG.dab[2], RG.bend) }, uShape: { value: new THREE.Vector4(RG.far, RG.half[0], RG.half[1], RG.under) }, uRoad: { value: new THREE.Vector4(RG.reach, RG.least, RG.sigma, RG.nearDens) }, uDens: { value: 1 },
      uTime: sh.uTime, uFogDensity: sh.uFogDensity, uVeil: sh.uVeil, uWidth: { value: 0.08 }, uCover: { value: RG.cover ?? 1 }, uNear: { value: new THREE.Vector2(RG.near[0], RG.near[1]) }, tRipple: WU.tRipple, uRippleRect: WU.uRippleRect };
    const mat = new THREE.ShaderMaterial({
      // (fourth holder: the dabs are PAINT, laid over the water in their own colour (premultiplied), not light added to it: added to
      // water that is already a bright mirror they clipped to pale peach and threw a veil of bloom over the bow; laid over it a dab is
      // gold at its heart and red at its edge whatever lies under it. The picture's alpha is left as it is.)
      uniforms: u, transparent: true, depthWrite: false, depthTest: true, fog: false, side: THREE.DoubleSide,
      blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendEquationAlpha: THREE.AddEquation, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
      // (a fan on the water from under the eye toward the sun, which stands on world -z)
      vertexShader: /* glsl */`uniform vec4 uShape; varying vec3 vWorld;
        void main() { float t = position.y; vWorld = vec3(cameraPosition.x + position.x * mix(uShape.y, uShape.z, t), ${plan.water.glaze.y.toFixed(3)} + 0.006, cameraPosition.z - 0.5 - t * uShape.x); gl_Position = projectionMatrix * viewMatrix * vec4(vWorld, 1.0); }`,
      // (FOURTH HOLDER: the dabs made again. They were facets of three fixed sizes on the water, lit by the lean the sun needs:
      // true, and from an eye 1.1 m up a hairline each, most of them not drawn at all. A painter's road is a LADDER OF BRUSHMARKS
      // that are about as large on the canvas wherever they lie, smaller toward the horizon: so the dabs lie in rows that are
      // uniform in the LOGARITHM of the distance toward the sun (a row is uRoad-deep on the water in proportion to how far off it
      // is: a hand's breadth of the screen near the bow, a dash far off), each dab about uDab.x metres wide. The rows are counted
      // from the eye, as glitter is (the road goes with the rider; the water runs through it); each dab comes and goes on its own
      // clock; more of them are lit on the sun's own line than beside it, and fewer toward the bow; rings and the wake bend them.)
      fragmentShader: /* glsl */`
        uniform vec3 uSunDir, uColor, uCore, uEdge, uTrack; uniform vec4 uDab, uRoad, uShape, uRippleRect; uniform float uTime, uFogDensity, uVeil, uWidth, uCover, uDens; uniform vec2 uNear; uniform sampler2D tRipple;
        varying vec3 vWorld;
        float rHash(vec2 p) { p = fract(p * vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.y); }
        float rNoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(rHash(i), rHash(i + vec2(1.0, 0.0)), f.x), mix(rHash(i + vec2(0.0, 1.0)), rHash(i + vec2(1.0, 1.0)), f.x), f.y); }
        void main() {
          vec2 rel = vWorld.xz - cameraPosition.xz, sunAz = normalize(uSunDir.xz);
          float D = dot(rel, sunAz), X = rel.x * sunAz.y - rel.y * sunAz.x;      // metres toward the sun; metres to the side of the sun's line
          if (D < 1.0) discard;
          float dist = length(cameraPosition - vWorld);
          vec2 ruv = (vWorld.xz - uRippleRect.xy) / uRippleRect.zw + 0.5, re = min(ruv, 1.0 - ruv), rp = vec2(0.0);
          if (min(re.x, re.y) > 0.0) rp = textureLod(tRipple, ruv, 0.0).xy * smoothstep(0.0, 0.08, min(re.x, re.y));
          float v = log(D) / uDab.y + dot(rp, sunAz) * uDab.w, row = floor(v), fy = fract(v) - 0.5;
          float wide = uDab.x * pow(D / 8.0, uDab.z);
          float u = X / wide + 37.0 * rHash(vec2(row, 5.1)) + (rp.x * sunAz.y - rp.y * sunAz.x) * uDab.w;
          // how many of the dabs here are lit: most on the sun's own line, fewer beside it (the road's breadth), fewer toward the bow
          float sig = max(D * uWidth * uRoad.z, uRoad.y), lat = exp(-X * X / (2.0 * sig * sig));
          float dens = uDens * lat * mix(uRoad.w, 1.0, smoothstep(3.0, uRoad.x, D));
          // a row is a line of DASHES of no two lengths: where a slow noise along it, drifting in time, stands above the level
          // the density leaves; each is a level lens, thick at its middle
          float lvl = 0.6 * rNoise(vec2(u, uTime * 0.33 + row * 3.7)) + 0.4 * rNoise(vec2(u * 0.37 + 11.0, uTime * 0.19 + row * 9.1));
          float thr = mix(1.1, 0.3, sqrt(dens)), on = smoothstep(thr - 0.035, thr + 0.035, lvl);
          float thick = 0.5 * (0.55 + 0.45 * rNoise(vec2(u * 0.7 + 3.0, row * 5.3))) * (0.55 + 0.45 * smoothstep(thr, thr + 0.15, lvl));
          float lens = 1.0 - smoothstep(thick * 0.55, thick, abs(fy));
          float heart = smoothstep(0.0, 0.12, lvl - thr) * (1.0 - smoothstep(thick * 0.3, thick, abs(fy)));
          // far off a row is finer than the screen can draw: the dabs go over into the mean of themselves
          float px = D * uDab.y / max(length(vec2(dFdx(D), dFdy(D))), 1e-5), fine = smoothstep(1.3, 3.5, px);
          float fog = 1.0 - exp(-uFogDensity * uFogDensity * dist * dist);
          float fade = smoothstep(uNear.x, uNear.y, dist) * (1.0 - fog) * (1.0 - uVeil);      // (not under the bow: the boat is worn wood, not a lamp)
          // the water of the road itself lies a little deeper and redder than the mirror beside it (the key painting's road is
          // gold on red-orange); over it the mean of the dabs too fine to draw; over that the dabs
          float tr = uShape.w * lat * min(uDens, 1.0) * fade, far = (1.0 - fine) * lat * min(uDens, 1.0) * 0.55 * fade, kd = on * lens * fine * fade;
          vec4 o = vec4(uTrack * uColor * tr, tr);
          o = vec4(mix(uEdge, uCore, 0.4) * uColor * far, far * uCover) + o * (1.0 - far * uCover);
          o = vec4(mix(uEdge, uCore, heart) * uColor * kd, kd * uCover) + o * (1.0 - kd * uCover);
          gl_FragColor = o;
        }`,
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute([-1, 0, 0, 1, 0, 0, 1, 1, 0, -1, 1, 0], 3)); geo.setIndex([0, 1, 2, 0, 2, 3]);
    const mesh = new THREE.Mesh(geo, mat); mesh.name = 'molten road'; mesh.frustumCulled = false; mesh.renderOrder = -0.4;      // over the glaze, under the sun's haze
    ctx.add(mesh); ctx.only(mesh, 'direct');
    if (sun.solid) sun.solid(mesh, false);
    return { mesh, u };
  })();
  // (shared.dye.figures is the first holder's list of capsules: kept by name, empty. `eddies` is where the water turns.)
  shared.dye = { figures: { segs: new Float32Array(0), count: 0 }, eddies: maps ? maps.eddies : [], sheet: null, turning: maps ? maps.turning : [] };

  const coreHigh = new THREE.Color(plan.sun.core).multiplyScalar(plan.sun.coreGain), coreLow = new THREE.Color(plan.light.sunCore.low).multiplyScalar(plan.light.sunCore.gain);
  const duskDeep = new THREE.Color(plan.water.dusk.deep), duskShallow = new THREE.Color(plan.water.dusk.shallow), duskTint = new THREE.Color(plan.water.dusk.tint);
  shared.reach = { far: 0, k: 0, bank, L };
  return {
    update(dt) {
      // ---- how far the evening has got: by the rider's furthest progress
      sun.far = Math.max(sun.far, ctx.s);
      const k = smooth(0, 1, lightAt(sun.far));
      shared.reach.far = sun.far; shared.reach.k = k;
      L.set({ start: 1 - k, end: k });
      ctx.look.current = plan.current.wide; ctx.look.currentNarrow = plan.current.narrow;
      // ---- the sun, the mask, the dyed light (writes the key light and the water's sun path over what L.set laid down)
      sun.update(dt);
      { // The sun's own core, by its height (second look). light.js draws the disc with one cream core (plan.sun.core times
        // 4.5) at every height: right while it stands at 4 degrees, but at the end of the route, bare in the open door and
        // over the causeway, it was a white ball in a cream glare where the page has it "red, low, alone". Below
        // `from` degrees the core goes over into a red-gold of its own. (This writes a uniform of light.js's disc from
        // outside: shared.sun.disc.material.uniforms.uCore. If the disc's shader ever changes, this does nothing.)
        const SC = plan.light.sunCore, uc = sun.disc && sun.disc.material && sun.disc.material.uniforms && sun.disc.material.uniforms.uCore;
        if (uc && uc.value && uc.value.isColor) { const t = 1 - smooth(SC.to, SC.from, sun.elevation); uc.value.copy(coreHigh).lerp(coreLow, t); } }
      { // the sun in the water: where the sun is, as large, as flat; molten
        const u = mirrorSun.u, d = sun.dir, e = sun.elevation, F = plan.sun.flatten, fk = Math.min(1, Math.max(0, (F.from - e) / (F.from - F.below)));
        u.uRight.value.set(-d.z, 0, d.x).normalize(); u.uUp.value.crossVectors(u.uRight.value, d).normalize();
        u.uSize.value.set(Math.tan(sun.size * 0.5 * Math.PI / 180), 1 + (F.to - 1) * fk * fk * (3 - 2 * fk), 4);
        u.uColor.value.copy(sun.bare); u.uColor.value.g *= RD.green; u.uColor.value.b *= RD.blue; u.uColor.value.multiplyScalar(lerp(RD.gain[0], RD.gain[1], k));
        // and the water's own path (the dyed light, light.js): redder still, so that its glitter is molten too. (Second
        // look: the path is the sun's own glitter, and a sun behind cloth has little: through saffron it is nearly whole,
        // through indigo a dim coloured glimmer. Without this the path, now strong enough to reach the bow, stood pink
        // and bright in the dusk at the west door, where the page has it "the dim blue of light through indigo" and the
        // kept lamp's amber stroke as the one warm thing on the water.)
        const W = ctx.waterLook.sun; if (W) { W.color.g *= RD.pathGreen; const f = Math.min(1, Math.max(0, (sun.strength - RD.dimFrom) / (1 - RD.dimFrom))); W.strength *= RD.dimTo + (1 - RD.dimTo) * Math.pow(f, RD.dimCurve); } }
      // ---- the molten road: the dyed light, molten; dimmer under a covered sun (as the water's own path), gone with the dusk
      if (road) {
        const f = Math.min(1, Math.max(0, (sun.strength - RD.dimFrom) / (1 - RD.dimFrom))), dim = RD.dimTo + (1 - RD.dimTo) * Math.pow(f, RD.dimCurve);
        // (fourth holder: a covered sun dims the dabs a little and puts most of them out: `dens`; the colour is the dyed light's, made a
        // level so that the paint is as bright under a red sun as under a gold one)
        const sl = sun.light, top = Math.max(sl.r, sl.g, sl.b, 1e-3);
        road.u.uColor.value.copy(sl).multiplyScalar(lerp(RG.gain[0], RG.gain[1], k) * (0.45 + 0.55 * dim) / top);
        road.u.uDens.value = RG.dens * (0.25 + 0.75 * dim);
        road.u.uWidth.value = lerp(RG.wide[0], RG.wide[1], k) * 0.5 * Math.PI / 180;
        road.mesh.visible = sun.dir.y > 0.001;
      }
      // ---- the shafts: they lie the way the light travels, and take its colour (the dyed light, eased by light.js)
      if (shaftMat) { const u = shaftMat.uniforms; u.uWay.value.copy(sun.dir).multiplyScalar(-1); u.uColor.value.copy(sun.light).multiplyScalar(A.shafts.gain * (0.35 + 0.65 * sun.strength) * (1 - 0.6 * k)); }
      // ---- the dusk on the water (second look). When staging widens the dyed bar to the whole reach (sun.spread toward
      // 400: the showstopper's dusk, postcard 6) light.js dims the sky's and the ground's light; the water must go with
      // them, or it lies rose and bright under a mauve world: its body and its mirror cool toward plan.water.dusk by how
      // wide the bar is and how much of the sun is covered.
      { const DK = plan.water.dusk, wide = Math.min(1, Math.max(0, (sun.spread - 60) / 240)), dusk = wide * sun.cover * DK.amount, WL = ctx.waterLook;
        if (dusk > 0.003) { WL.deep.lerp(duskDeep, dusk); WL.shallow.lerp(duskShallow, dusk); if (WL.reflectionTint && WL.reflectionTint.isColor) WL.reflectionTint.lerp(duskTint, dusk);
          if (DK.mirror != null && typeof WL.reflectivity === 'number') { WL.reflectivity = lerp(WL.reflectivity, DK.mirror, dusk); WL.reflectFloor = lerp(WL.reflectFloor, DK.mirror * 0.2, dusk); } } }      // (fourth holder: and in the dusk the water is less of a mirror: a multiplied tint cannot make blue water of an orange sky)
      // ---- (fourth holder) lights in the mirror keep their own colour where the kept lamp stands (plan.water.spare, by where the
      // boat is): its stroke must be amber on the blue water, the one warm thing there; up the reach the same sparing made a pale
      // column of the sun's coin in the wheel's cloth, so there the mirror's own tint holds
      { const SP = plan.water.spare; if (SP && typeof ctx.waterLook.spareLights === 'number') ctx.waterLook.spareLights = ramp(SP.by, ctx.s); }
      // ---- the glaze: its two phases of winding (seconds either side of the figure at rest, and the weight of each); the
      // dye's own body goes with the light of the sky; what was poured is forgotten
      if (glaze) {
        // (one layer is whole for most of its turn about the figure at rest; the two change places over a fifth of the cycle)
        const C = GZ.cycle, t = ctx.time, ta = ((t % C) + C) % C, tb = (ta + C / 2) % C, wa = smooth(0.4, 0.6, 1 - Math.abs(2 * ta / C - 1));
        glaze.u.uPhase.value.set(ta - C / 2, wa, tb - C / 2, 1 - wa);
        // (fourth holder) the light on the film: by the evening's two states, and cooled by the showstopper's dusk as the water's body is
        { const FS = (IW || GZ.film).state, wide = Math.min(1, Math.max(0, (sun.spread - 60) / 240)), dusk = wide * sun.cover, w = glaze.u.uWater.value;
          w.setRGB(lerp(FS.start[0], FS.end[0], k), lerp(FS.start[1], FS.end[1], k), lerp(FS.start[2], FS.end[2], k));
          if (dusk > 0.003) w.setRGB(lerp(w.r, w.r * FS.dusk[0], dusk), lerp(w.g, w.g * FS.dusk[1], dusk), lerp(w.b, w.b * FS.dusk[2], dusk)); }
        glaze.step(dt);
      }
      // ---- the sky follows: the gradient by the two states, the painting darker and redder with the light
      for (const u in skyFrom) skyU[u].value.copy(skyFrom[u]).lerp(skyTo[u], k);
      if (panoU) { panoU.uWisp.value = lerp(SK.wisps.amount[0], SK.wisps.amount[1], k); panoU.uWispLow.value.copy(wispLow[0]).lerp(wispLow[1], k); panoU.uWispHigh.value.copy(wispHigh[0]).lerp(wispHigh[1], k);
        panoU.uCoolAmt.value = lerp(SK.cool.amount[0], SK.cool.amount[1], k); panoU.uEastAmt.value.x = lerp(SK.east.amount[0], SK.east.amount[1], k); panoU.uAlpha.value = lerp(SK.alpha[0], SK.alpha[1], k); panoU.uSat.value = lerp(SK.saturation[0], SK.saturation[1], k); panoU.uTint.value.copy(tintFrom).lerp(tintTo, k).multiplyScalar(lerp(SK.glow[0], SK.glow[1], k)); }
    },
  };
}
