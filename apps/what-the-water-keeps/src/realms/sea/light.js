// The answering sea: how solid things and the water round their feet take the sea's light. One place for it, so that
// rock, timber, the tower, the buoy and the rowing boat all answer the same swell, the same rain front and the same
// number `L` (docs/art/sea.md, "How solids take the water's light").
//
//   const sea = makeSeaLight(ctx, plan);          // set.js makes it and puts it in shared.sea; set.js drives its uniforms
//   sea.rock({ color: '#17142A' })                // the `seaRock` material: gouache, lit only by the water (see below)
//   sea.extend({ run, pale })                     // the same as a gouache `extend`, for kit.model(url, { extend })
//   sea.surf(outlines)                            // one mesh of surf light round the feet of things (one draw call)
//   sea.standIn({ name, at, size, shape, color })  // the engine's stand-in (src/engine/modules.js), wearing the seaRock material
//   sea.sheet()                                   // the sea's own light on the water (set.js makes the one there is)
//
// What the material does that plain gouache does not (and nothing else: fog, veil, brushwork, the lantern and the
// kept lamp stay the ride's):
//   rest       a thing here is a silhouette: its local colour sunk toward the night, darkest at its top. The realm's
//              global light (look.light) is NOT used on it, because the sea's light is local: a rock is lit when
//              the rain front has passed THAT rock, not when it has passed the boat.
//   far term   behind the rain front, times `L`: light from the whole lit sea, 0.6 at the foot falling to 0.15 at
//              45 m, strongest on faces that look down or outward, cooling from aqua through ember to violet.
//   near term  the wave that breaks at the foot: light climbs the rock with each crest of the swell (the water's own
//              three waves, read from the uniforms the water shares) and drains over three seconds; and the boat's
//              own light (the water's trace, sampled under the surface point) does the same in small.
// It is not the caustic option of kit.gouache: there are no nets of light anywhere in this realm.
import * as THREE from 'three';
import { WATER_GLSL, waterUniforms } from '../../engine/water-final.js';
import { FOG_PARS } from '../../engine/kit.js';
import { standIn } from '../../engine/modules.js';

/** GLSL shared by everything that answers the sea: the swell as light, and the rain front. (SEA_CORE is the same without the declaration of uSwell, for a shader that also includes the water's WATER_GLSL.) */
export const SEA_CORE = /* glsl */`
  uniform vec3 uSeaOmega;        // radians a second of each of the swell's three waves
  uniform vec4 uSeaFront;        // the rain front: normal x, z; offset; 1 / soft width. A place is behind it when dot(normal, xz) < offset
  uniform vec4 uSeaLee;          // the lee round the kept lamp: x, z, radius, how much of the sea's light it takes away
  uniform vec4 uSeaL;            // x: the sea's light behind the front (the page's L by the boat's distance along), y: how much the water answers at all
                                 // (0 in the first dark and deep in the cave), z: the gate's great swells (0..1), w: how far the show has run (0..1, the sky uses it)
  // how high the swell stands at a place, -1..1 of its greatest height, \`ago\` seconds ago
  float seaSwellN(vec2 xz, float ago) {
    float h = 0.0, a = 1e-4;
    for (int i = 0; i < 3; i++) { h += uSwell[i].w * cos(dot(uSwell[i].xy, xz) - uSwell[i].z + uSeaOmega[i] * ago); a += uSwell[i].w; }
    return h / a;
  }
  // the light of a wave breaking at a place. x: new light (it rises with the crest), y: all of it (it drains over three seconds)
  vec2 seaSurge(vec2 xz) {
    float f0 = smoothstep(0.06, 0.55, seaSwellN(xz, 0.0)), f1 = smoothstep(0.06, 0.55, seaSwellN(xz, 1.2)), f2 = smoothstep(0.06, 0.55, seaSwellN(xz, 2.5));
    return vec2(f0, max(f0, max(0.6 * f1, 0.3 * f2)));
  }
  // 0 ahead of the rain front .. 1 behind it
  float seaFront(vec2 xz) { float f = clamp((uSeaFront.z - dot(uSeaFront.xy, xz)) * uSeaFront.w + 0.5, 0.0, 1.0); return f * f * (3.0 - 2.0 * f); }
  // the lee of the skerry, round the kept lamp: the calmest water of the realm, where the sea's light is held down so that the amber stroke survives it
  float seaLee(vec2 xz) { return 1.0 - uSeaLee.w * (1.0 - smoothstep(uSeaLee.z * 0.35, uSeaLee.z, distance(xz, uSeaLee.xy))); }
  // light cools as it ages: the first second and a half is core, then aqua, ember, and a dark violet as it dies (a: 1 new .. 0 gone)
  vec3 seaAge(float a, vec3 core, vec3 aqua, vec3 ember, vec3 dying) {
    vec3 c = mix(dying * 1.6, ember * 2.3, smoothstep(0.06, 0.26, a));
    c = mix(c, aqua * 1.1, smoothstep(0.34, 0.6, a));
    return mix(c, core * 1.2, smoothstep(0.93, 1.0, a));
  }
  float seaHash1(vec2 p) { p = fract(p * vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.y); }
  float seaNoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(seaHash1(i), seaHash1(i + vec2(1.0, 0.0)), f.x), mix(seaHash1(i + vec2(0.0, 1.0)), seaHash1(i + vec2(1.0, 1.0)), f.x), f.y); }
  vec3 seaHash3(vec2 p) { vec3 q = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973)); q += dot(q, q.yxz + 33.33); return fract((q.xxy + q.yzz) * q.zyx); }
  // Flecks too far off to tell apart: soft points of light that come and go, about as many near as far (the water's own
  // way, water-final.js). toPx: metres on the water to pixels; foot: metres of water under a pixel; chance: the share of cells lit.
  float seaSparks(vec2 p, mat2 toPx, float foot, float chance, float seed, float time) {
    float lv = max(log2(foot * 62.0), 0.0), l0 = floor(lv), fr = lv - l0, sum = 0.0;
    for (int i = 0; i < 2; i++) {
      float cell = 0.09 * exp2(l0 + float(i));
      vec2 id = floor(p / cell);
      vec3 h = seaHash3(id + seed + (l0 + float(i)) * 17.0);
      float cyc = time * (0.55 + 0.7 * h.z) + h.x * 7.0, ph = fract(cyc);
      vec3 k = seaHash3(id + floor(cyc) * 3.7 + seed + 5.0);
      vec2 dpx = toPx * (p - (id + 0.25 + 0.5 * k.xy) * cell);
      float b = sin(3.14159 * ph);
      sum += (i == 0 ? 1.0 - fr : fr) * step(k.z, chance) * (1.0 - smoothstep(0.4, 1.8, length(dpx))) * b * b;
    }
    return sum;
  }
`;
// (the swell: wave vector x, z; phase; amplitude of its three waves, kept up to date by the water)
export const SEA_GLSL = /* glsl */`uniform vec4 uSwell[3];` + SEA_CORE;
// Marks of paint, for the shaders that draw light with them (after the declarations of tSeaFleck / tSeaStip and of uSeaCore, uSeaAqua, uSeaEmber, uSeaDying):
//   seaMark   a mark read from a mask: x its cover here, y its own threshold, z its own phase (the mask holds the last two
//             times the cover, so that they survive being seen small)
//   seaLit    how much of it shows when the cut stands at `cut` (marks come and go one by one, each at its own level)
//   seaInk    the same in colour: a mark is the age (a) of the light it belongs to, but as its own threshold is reached it
//             dies through ember and violet, so that among new marks there are always a few going out
const SEA_INK = /* glsl */`
  vec3 seaMark(sampler2D t, vec2 uv) { vec4 m = texture2D(t, uv); float c = max(m.g, 0.004); return vec3(m.g, m.r / c, m.b / c); }
  float seaLit(vec3 m, float cut) { return m.x * smoothstep(cut, cut + 0.14, m.y); }
  vec3 seaAged(float a) { return seaAge(a, uSeaCore, uSeaAqua, uSeaEmber, uSeaDying); }
  vec3 seaInk(vec3 m, float cut, float a) { float mg = m.y - cut; return seaAged(a * (0.1 + 0.9 * smoothstep(0.02, 0.38, mg))) * (m.x * smoothstep(0.0, 0.14, mg)); }
`;

/**
 * The marks that every light in the realm is broken by (the page's `flecks`), made by rule in code: nothing is generated.
 *   dabs      1024 px: comma dabs with a head and a tail, short dashes and round dabs, all leaning one way, dry-brushed
 *   stipple   512 px: fine specks and ticks in clumps, as a dry brush leaves them
 * In both, green is a mark's cover, red its own threshold times its cover (each mark lights and goes out at its own
 * level: they come and go one by one, never as a wash) and blue its own phase times its cover (each glitters in its
 * own time). The largest dabs have the lowest thresholds: first to light, last to go. Both tile.
 */
function makeMarks() {
  const mk = (size, draw) => {
    const c = document.createElement('canvas'); c.width = c.height = size;
    const g = c.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, size, size);
    draw(g, size);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.NoColorSpace; t.anisotropy = 8;
    t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter; t.generateMipmaps = true;
    return t;
  };
  let seed = 271828; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  // (every mark is drawn again wherever it crosses an edge, so that the picture tiles)
  const wrap = (g, size, x, y, reach, fn) => { for (let ox = -size; ox <= size; ox += size) for (let oy = -size; oy <= size; oy += size) { if (x + ox < -reach || x + ox > size + reach || y + oy < -reach || y + oy > size + reach) continue; g.save(); g.translate(x + ox, y + oy); fn(); g.restore(); } };
  const ink = (thr, ph) => `rgb(${Math.round(255 * thr)},255,${Math.round(255 * ph)})`;
  const lean = -0.42;
  const dabs = mk(1024, (g, size) => {
    for (let i = 0; i < 860; i++) {
      const x = rnd() * size, y = rnd() * size, big = Math.pow(rnd(), 2.6), r = 2.4 + 13 * big, kind = rnd();
      const rot = lean + (rnd() - 0.5) * 0.7 + (rnd() < 0.14 ? (rnd() - 0.5) * 3 : 0);
      const thr = Math.min(1, 0.1 + 0.9 * rnd() * (1 - 0.35 * big)), ph = rnd();
      const len = r * (2.2 + 3.2 * rnd()), bend = (rnd() - 0.5) * 0.7 * len;
      wrap(g, size, x, y, r + len + 4, () => {
        g.rotate(rot); g.fillStyle = ink(thr, ph); g.beginPath();
        if (kind < 0.62) {            // a comma: a round head and a tail drawn out to a point, a little bent
          g.arc(0, 0, r, Math.PI * 0.5, Math.PI * 1.5);
          g.quadraticCurveTo(len * 0.45, -r * 0.9 + bend * 0.3, len, bend);
          g.quadraticCurveTo(len * 0.45, r * 0.75 + bend * 0.3, 0, r);
        } else if (kind < 0.86) {     // a dash: a short stroke, one end blunter than the other
          const w = r * 0.42, l = len * 0.7;
          g.moveTo(-l / 2, -w); g.quadraticCurveTo(0, -w * 1.3, l / 2, -w * 0.6); g.arc(l / 2, 0, w * 0.6, -Math.PI / 2, Math.PI / 2);
          g.quadraticCurveTo(0, w * 1.2, -l / 2, w); g.arc(-l / 2, 0, w, Math.PI / 2, Math.PI * 1.5);
        } else g.ellipse(0, 0, r * 1.15, r * 0.8, 0, 0, Math.PI * 2);      // a dab
        g.fill();
      });
    }
    // dry brush: the paint misses the paper along the stroke (fine scratches through every mark)
    g.lineCap = 'round';
    for (let i = 0; i < 1500; i++) {
      const x = rnd() * size, y = rnd() * size, l = 10 + rnd() * 46, a = lean + (rnd() - 0.5) * 0.3, dy = (rnd() - 0.5) * 2;
      g.strokeStyle = `rgba(0,0,0,${(0.25 + 0.5 * rnd()).toFixed(3)})`; g.lineWidth = 0.6 + rnd() * 1.4;
      wrap(g, size, x, y, l, () => { g.rotate(a); g.beginPath(); g.moveTo(-l / 2, 0); g.lineTo(l / 2, dy); g.stroke(); });
    }
  });
  const stipple = mk(512, (g, size) => {
    const clumps = []; for (let i = 0; i < 34; i++) clumps.push([rnd() * size, rnd() * size, 14 + rnd() * 40]);
    const gauss = () => (rnd() + rnd() + rnd() - 1.5) * 1.2;
    for (let i = 0; i < 5200; i++) {
      let x, y;
      if (rnd() < 0.72) { const c = clumps[Math.floor(rnd() * clumps.length)]; x = ((c[0] + gauss() * c[2]) % size + size) % size; y = ((c[1] + gauss() * c[2]) % size + size) % size; } else { x = rnd() * size; y = rnd() * size; }
      const u = rnd(), r = 0.6 + 1.7 * u * u, thr = 0.08 + 0.92 * rnd(), ph = rnd(), tick = rnd() < 0.13, l = 3 + rnd() * 5, a = lean + (rnd() - 0.5) * 0.5;
      wrap(g, size, x, y, 10, () => {
        g.fillStyle = ink(thr, ph); g.beginPath();
        if (tick) { g.rotate(a); g.ellipse(0, 0, l, 0.5 + r * 0.45, 0, 0, Math.PI * 2); } else g.arc(0, 0, r, 0, Math.PI * 2);
        g.fill();
      });
    }
  });
  return { dabs, stipple };
}

export function makeSeaLight(ctx, plan) {
  const engine = ctx.engine, W = waterUniforms(engine), C = plan.colors, R = plan.rock;
  const marks = makeMarks(), fleck = marks.dabs;      // the marks every light here is broken by (the page's `flecks`: made in code, nothing generated)
  const U = {
    uSwell: W.uSwell, tTrace: W.tTrace, uTraceRect: W.uTraceRect,
    uSeaOmega: { value: new THREE.Vector3(1, 1, 1) },
    uSeaFront: { value: new THREE.Vector4(1, 0, -1e5, 1 / 30) },
    uSeaL: { value: new THREE.Vector4(1, 1, 0, 0) }, uSeaLee: { value: new THREE.Vector4(0, 0, 1, 0) },
    tSeaFleck: { value: fleck }, tSeaStip: { value: marks.stipple },
    uSeaAqua: { value: new THREE.Color(C.aqua) }, uSeaEmber: { value: new THREE.Color(C.ember) }, uSeaViolet: { value: new THREE.Color(C.violet) }, uSeaCore: { value: new THREE.Color(C.core) },
    uSeaDying: { value: new THREE.Color(C.dyingEmber) },
    // how rock stands in the light: what the sky gives its tops and edges (at rest, lit), and what the lit sea and its cloud give the whole mass (one storey up, high up)
    uSeaSky0: { value: new THREE.Color(R.sky) }, uSeaSky1: { value: new THREE.Color(R.skyLit) }, uSeaFillLow: { value: new THREE.Color(R.fillLow) }, uSeaFillHigh: { value: new THREE.Color(R.fillHigh) },
    uSeaKey: { value: new THREE.Vector4(-1, 0, 0, 0) },      // x, z: the way (level) to the palest sky, the open sea the front comes from (set.js gives it)
    // rim: how much sky a face seen edge-on takes; how much more a wet face gives back than a dry one; metres over which the lit sea's glow dies up a rock; the gain of all light at a foot
    uSeaRim: { value: new THREE.Vector4(...(R.rim || [0.3, 0.7, 3.5, 1])) },
    // cast: what local colour is multiplied by at rest (the basalt's plum), and how much of it there is
    uSeaCast: { value: (() => { const k = new THREE.Color(R.cast || '#ffffff'); return new THREE.Vector4(k.r, k.g, k.b, R.local ?? 1); })() },
    // the cleft and its cave: little sky reaches rock inside it. x, z of the middle of its mouth; x, z of the way in (set.js gives them); and (uSeaCaveB) half its width, metres over
    // which the sky dies going in, how much of the sky is lost inside, how much further the surge's light runs up the walls there
    uSeaCave: { value: new THREE.Vector4(0, 1e6, 0, -1) }, uSeaCaveB: { value: new THREE.Vector4(14, 9, 0.6, 1.0) },
    // the low land one can walk on (the skerry): its waterline as a polygon of up to 12 points (x, z), their count, and (uSeaLandC) the middle and radius of a
    // circle that holds it and the metres over which the sea's light dies going inland. The sea lights a SHORE: a rock four metres high and thirty across
    // is not lit all over because all of it is low (set.js gives the outline; with none, nothing changes)
    uSeaLand: { value: Array.from({ length: 12 }, () => new THREE.Vector2()) }, uSeaLandN: { value: 0 }, uSeaLandC: { value: new THREE.Vector4(0, 0, 0, 3.6) },
  };

  /**
   * The seaRock extension for kit.gouache / kit.model. opts:
   *   rest   how much of its local colour an unlit thing keeps (default 0.38; the tower's granite a little more)
   *   top    and what is left of that at 28 m up (0.55): darkest at the top
   *   run    metres the breaking wave's light climbs before it has fallen to a third (2)
   *   pale   how readily it takes the lit sea's light (1 basalt; 1.3 granite; 1.6 the rowing boat's paint)
   *   uniform  pass your own { value: Vector4(rest, top, run, pale) } to drive them later (the gate's inner walls)
   */
  const extend = (o = {}) => ({
    uniforms: { ...U, uSeaRock: o.uniform || { value: new THREE.Vector4(o.rest ?? 0.38, o.top ?? 0.55, o.run ?? 2.0, o.pale ?? 1) } },
    fragmentPars: /* glsl */`${SEA_GLSL}
      uniform sampler2D tTrace, tSeaFleck, tSeaStip; uniform vec4 uTraceRect, uSeaRock; uniform vec3 uSeaAqua, uSeaEmber, uSeaViolet, uSeaCore, uSeaDying, uSeaSky0, uSeaSky1, uSeaFillLow, uSeaFillHigh; uniform vec4 uSeaKey, uSeaRim, uSeaCast, uSeaCave, uSeaCaveB;
      uniform vec2 uSeaLand[12]; uniform int uSeaLandN; uniform vec4 uSeaLandC;
      // paint is laid in flat steps with dry edges: n steps, the edge broken by k
      float seaSteps(float g, float n, float k) { g = clamp(g + k, 0.0, 1.0) * n; return (floor(g) + smoothstep(0.4, 0.6, fract(g))) / n; }
      // metres inside the waterline of the low land: 0 at its edge and everywhere outside it
      float seaInland(vec2 p) {
        if (uSeaLandN < 3 || distance(p, uSeaLandC.xy) > uSeaLandC.z) return 0.0;
        float d = 1e9, sgn = 1.0;
        for (int i = 0; i < 12; i++) {
          if (i >= uSeaLandN) break;
          int j = i == 0 ? uSeaLandN - 1 : i - 1;
          vec2 e = uSeaLand[j] - uSeaLand[i], w = p - uSeaLand[i];
          vec2 b = w - e * clamp(dot(w, e) / max(dot(e, e), 1e-6), 0.0, 1.0);
          d = min(d, dot(b, b));
          bvec3 c = bvec3(p.y >= uSeaLand[i].y, p.y < uSeaLand[j].y, e.x * w.y > e.y * w.x);
          if (all(c) || all(not(c))) sgn = -sgn;
        }
        return sgn < 0.0 ? sqrt(d) : 0.0;
      }`,
    light: /* glsl */`{
      float seaY = vWPos.y, seaPale = uSeaRock.w;
      // every light on rock is broken: wide patches (one pipe takes more light than its neighbour), a ragged lip, threads in the flutes, dabs of paint
      float seaAlong = mix(vWPos.x, vWPos.z, step(abs(N.z), abs(N.x)));                       // along the face, level
      float seaBroad = seaNoise(vec2(seaAlong * 0.9, seaY * 0.07));
      float seaUpF = clamp(N.y, 0.0, 1.0), seaEdge = pow(1.0 - clamp(abs(dot(N, V)), 0.0, 1.0), 2.5);
      float seaPx = length(fwidth(vWPos)), seaFarK = smoothstep(0.025, 0.11, seaPx);          // metres of rock under a pixel; 0 where single marks can be told apart .. 1 where they cannot
      float seaAmp = uSwell[0].w + uSwell[1].w + uSwell[2].w;                                 // how high the largest crest stands over still water, metres
      float seaRise = seaY - seaSwellN(vWPos.xz, 0.0) * seaAmp;                               // metres above where the water stands at this rock NOW
      // (each pipe's face is a cell of its own along the waterline, with its own number and its own time)
      float seaCell = floor(seaAlong / 0.85), seaCh = seaHash1(vec2(seaCell, 5.3)), seaCh2 = seaHash1(vec2(seaCell, 11.9));
      float seaBeat = 0.5 + 0.5 * sin(uTime * (0.7 + 1.1 * seaCh2) + seaCh * 40.0);
      float seaWashZ = smoothstep(-1.0, -0.12, seaRise);                                      // the wash zone starts under the surface
      float seaShore = 1.0 - smoothstep(0.6, 0.6 + uSeaLandC.w, seaInland(vWPos.xz));       // 1 at a shore .. 0 inland on the low land (the skerry): the sea's light is at the waterline
      // ---- at rest: a dark form against a sky one step lighter than it. Local colour sunk toward the night (with the
      // plum the page gives basalt), darkest at the top; a wet band above the water, to a ragged tide line, darker in
      // itself but quicker to give back the sky; and the sky's own slate on tops (most), on the side turned to the open
      // sea (where the sky is palest), and a little on faces seen edge-on, so that every pipe can be read
      float seaDry = smoothstep(0.7, 2.3, seaY + 0.9 * (seaBroad - 0.5) + 0.3 * stroke);
      vec3 seaLoc = albedo * uSeaCast.rgb * (uSeaRock.x * uSeaCast.w * mix(1.0, uSeaRock.y, smoothstep(0.0, 28.0, seaY)) * mix(0.6, 1.0, seaDry));
      float seaLf = seaFront(vWPos.xz) * uSeaL.x * mix(1.0, seaLee(vWPos.xz), 0.45);      // how lit the sea is HERE (rock keeps more of its light in the lee than the water does)
      float seaSide = 0.5 + 0.5 * dot(N.xz, uSeaKey.xy);
      float seaSkyW = 0.75 * seaUpF * seaUpF + (0.03 + 0.26 * seaSide * seaSide + uSeaRim.x * seaEdge) * (1.0 - 0.6 * seaUpF);
      seaSkyW = seaSteps(seaSkyW * mix(uSeaRim.y, 1.0, seaDry), 5.0, 0.07 * stroke);
      // (inside the cleft and its cave no sky reaches the rock: there it is known by the sea's light at its foot and by the lantern)
      vec2 seaCq = vWPos.xz - uSeaCave.xy;
      float seaIn = smoothstep(-1.0, uSeaCaveB.y, dot(seaCq, uSeaCave.zw)) * (1.0 - smoothstep(uSeaCaveB.x, uSeaCaveB.x + 5.0, abs(dot(seaCq, vec2(-uSeaCave.w, uSeaCave.z)))));
      float seaOpen = 1.0 - uSeaCaveB.z * seaIn;                                              // (a breath of the night comes in behind the boat: dark is the idea, black is not)
      vec3 seaSky = mix(uSeaSky0, uSeaSky1, seaLf) * (seaSkyW * seaPale * seaOpen);
      // ---- behind the rain front. The light stands at the feet of things: a glow that climbs from the lit water and dies
      // within a few metres (uSeaFillLow, over uSeaRim.z metres), broken from pipe to pipe; the mass above stays dark
      // against the lit water, lifted only from night to dark slate by the cloud the sea lights (uSeaFillHigh)
      float seaFace = clamp(0.85 - 0.45 * N.y, 0.25, 1.2);                                    // from below: tops stay dark
      // (the glow itself: what looks down or outward takes it, a top takes next to none: a top is the sky's, and the sea's only where the sea is ON it)
      float seaFaceFill = clamp(0.8 - 0.74 * max(N.y, 0.0) - 0.4 * min(N.y, 0.0), 0.06, 1.2);
      // only the first storey over where the water stands NOW, and nothing under it (lit under the surface, a low rock is a block of glass);
      // and not every pipe alike: flat planes of light on the pipes that take it, their neighbours left dark
      float seaClimb = exp(-max(seaRise, 0.0) / uSeaRim.z) * smoothstep(-0.9, 0.0, seaRise);
      // (on the low land a face takes it by how far it is turned to the open water round it: a block has a lit front, dark flanks and a top the sky owns)
      vec2 seaLc = vWPos.xz - uSeaLandC.xy;
      float seaOnLand = uSeaLandN > 2 ? 1.0 - smoothstep(uSeaLandC.z - 2.0, uSeaLandC.z, length(seaLc)) : 0.0;
      float seaOut = 0.5 + 0.5 * dot(normalize(N.xz + vec2(1e-5, 0.0)), normalize(seaLc + vec2(1e-5, 0.0)));
      // (it lies in level bands, higher along one stretch of a foot and lower along the next; from pipe to pipe it differs only a little:
      // lit pipe by pipe, a colonnade's foot is a row of upright blades)
      float seaReach = 0.45 + 0.9 * seaNoise(vec2(seaAlong * 0.11 + 5.0, 1.7));
      float seaTake = mix(seaReach * (0.8 + 0.3 * seaCh), smoothstep(0.2, 0.8, 0.5 * seaCh + 0.3 * seaBroad + 0.5 * (seaOut - 0.3)) * 1.3, seaOnLand);
      float seaFillK = clamp(seaClimb * seaTake + 0.08 * stroke, 0.0, 1.0) * 4.0;
      seaFillK = (floor(seaFillK) + smoothstep(0.42, 0.58, fract(seaFillK))) / 4.0;             // four flat steps, their edges dry
      // (it is the SUM of the marks at a foot, for where they are too far off to tell apart: near the eye the marks speak and the rock between them stays rock)
      // (aqua only in its lowest step: above that it is ember, the colour of old light, deeper and greener, so that a storey of glow is never a storey of ice)
      vec3 seaFill = mix(uSeaEmber * 1.35, uSeaFillLow, smoothstep(0.5, 0.95, seaFillK)) * (seaFillK * seaFaceFill * seaShore * mix(0.15, 1.0, seaFarK))
                   + uSeaFillHigh * ((0.7 + 0.6 * seaBroad) * mix(1.0, 0.6, smoothstep(10.0, 45.0, seaY)) * seaFace * mix(0.35, 1.0, seaOpen));
      // flecks of paint at two sizes, each with its own threshold (they come and go one by one): what every light at a foot is made of
      vec3 seaFa = tri(tSeaFleck, vWPos * 0.13 + 0.31, N), seaFb = tri(tSeaFleck, vWPos * 0.47 + vec3(0.63, 0.21, 0.47), N);
      // (on what faces up the light is water sheeting over stone: a fine glitter of specks, never dabs)
      vec3 seaSt = tri(tSeaStip, vWPos * 0.85 + 0.17, N); seaSt.r /= max(seaSt.g, 0.004);
      float seaFlat = seaUpF * seaUpF, seaTw = 0.6 + 0.4 * sin(uTime * (1.3 + 3.0 * seaSt.b / max(seaSt.g, 0.004)) + seaSt.r * 40.0);
      seaFa *= 1.0 - seaFlat; seaFb *= 1.0 - 0.92 * seaFlat;
      float seaWet = smoothstep(-1.1, -0.15, seaRise) * seaShore;                             // (light on rock from just under where the water stands, upward: lit deeper, rock seen through clear water is glass; and at a shore only)
      // dense at the waterline, single dabs a storey up, none above; and on what faces up only where the sea itself reaches
      // (rain on bare rock lights nothing: the light is the sea's)
      float seaDenF = mix(exp(-max(seaRise, 0.0) / 0.75) * (0.55 + 0.8 * seaBroad), 0.8 * (1.0 - smoothstep(0.02, 0.4, seaRise)), seaFlat) * seaWet;      // (a top is lit only while the water is on it or has just left it)
      float seaCutF = 1.02 - clamp(seaDenF, 0.0, 1.0) * 0.82;
      float seaFlF = 0.3 * smoothstep(seaCutF + 0.1, seaCutF + 0.28, seaFa.r) * seaFa.g + 0.7 * smoothstep(seaCutF + 0.05, seaCutF + 0.25, seaFb.r) * seaFb.g
                   + (0.9 + 0.7 * seaFlat) * seaSt.g * smoothstep(seaCutF, seaCutF + 0.14, seaSt.r) * seaTw;
      // too far to tell flecks apart: what is left is the waterline itself, a band of broken water lying along the foot,
      // brighter on one pipe than the next and each in its own time (never a line of light round a rock; never upright)
      // (how high the wash stands on the rock here, now: knee to waist, more along one stretch and less along the next, never the same for long. Taller, and
      // bright, it turned the feet of things to blocks of ice: what stands higher than this at a lit foot is thrown water, in front of the rock, which is the spray's)
      float seaSurfH = 0.3 + (0.3 + 0.9 * seaNoise(vec2(seaAlong * 0.45 + 3.0, uTime * 0.35))) * (0.45 + 0.55 * seaNoise(vec2(seaAlong * 1.7, uTime * 0.9)));
      float seaBandL = seaWashZ * (1.0 - smoothstep(0.6 * seaSurfH, seaSurfH, seaRise + 0.3 * (stroke - 0.5))) * (0.45 + 0.55 * smoothstep(0.2, 0.6, seaCh2) + 0.3 * seaCh * seaBeat);
      seaFlF = mix(seaFlF, mix(seaBandL, 0.18 * clamp(seaDenF, 0.0, 1.0) * (0.3 + 1.4 * seaNoise(vWPos.xz * 2.3 + 1.0) * seaNoise(vWPos.zx * 0.6 + 4.0)), seaFlat), seaFarK);
      // (the surf at a lit foot: white-hot only in the few dashes where it breaks hardest, aqua over it, ember where it thins.
      // Never one large value above white: that is a lamp standing on the water, not surf)
      float seaHot = seaWashZ * (1.0 - smoothstep(0.15, 0.5 + 0.5 * seaCh2, seaRise)) * (1.0 - seaFlat) * smoothstep(0.45, 0.8, seaCh2);
      vec3 seaFoot = (mix(uSeaEmber * 2.6, uSeaAqua * 1.15, smoothstep(0.25, 0.8, seaDenF) * (1.0 - 0.8 * smoothstep(0.2, 0.9, seaRise))) + uSeaCore * (0.7 * seaHot * (0.4 + 0.6 * seaBeat))) * (min(seaFlF, 1.1) * seaFace * uSeaRim.w);
      vec3 seaFar = (seaFill + seaFoot) * (seaLf * seaPale);
      // ---- the wave that breaks at the foot: surge (here) and spray (thrown by sea.surf). With each crest the wash is
      // thrown up the rock: dense at the waterline and single at its lip, white-hot only where it breaks hardest and only
      // while the crest is on it, then ember as it drains; light pooling on the dished tops of the steps; a few threads
      // that run down the flutes for three seconds after; and over it all a breath of that light on the rock itself, dying
      // within a metre or two. Inside the gate, during its three great swells, to the roof. Never a sheet, never an outline
      // (x: new light, it rises with the crest; y: all of it, it drains over three seconds. In the lee round the kept lamp, the calmest water of the realm, the surge is slight)
      vec2 seaSg = seaSurge(vWPos.xz) * (uSeaL.y * mix(1.0, seaLee(vWPos.xz), 0.75) * seaShore);
      float seaNew = seaSg.x / max(seaSg.y, 0.05);
      float seaRun = uSeaRock.z * (1.0 + 7.8 * uSeaL.z) * (1.0 + uSeaCaveB.w * seaIn);       // (in the cleft the surge is squeezed between two walls and its light races up both)
      // the lip of the run-up: how far up the rock the wash stands here, in wide low tongues that climb with the crest and fall
      // back as it drains (read from the place and not from the face, so that neighbouring pipes share one tongue)
      float seaTongue = 0.3 + 0.7 * seaNoise(vWPos.xz * 0.31 + vec2(3.0, uTime * 0.12));
      float seaLip = max(seaRun * (0.1 + 0.9 * seaSg.y) * seaTongue, 0.06);
      float seaRel = clamp(max(seaRise, 0.0) / seaLip, 0.0, 1.0);                             // 0 at the water .. 1 at the lip
      float seaCame = seaAmp * (0.15 + 0.85 * seaSg.y);                                       // how high the water itself has come here lately: what faces up is lit only where it was awash
      float seaTop = 1.0 - smoothstep(seaCame + 0.1, seaCame + 0.5, seaY);
      float seaDen = mix(1.0 - pow(seaRel, 1.6), seaTop, seaFlat) * seaWet;
      float seaCut = 1.02 - seaDen * (0.4 + 0.55 * seaSg.y);
      // (a glitter of specks everywhere, small commas among them, and now and then one large splash)
      float seaFl = 0.3 * smoothstep(seaCut + 0.1, seaCut + 0.28, seaFa.r) * seaFa.g + 0.7 * smoothstep(seaCut + 0.05, seaCut + 0.25, seaFb.r) * seaFb.g
                  + (0.9 + 0.7 * seaFlat) * seaSt.g * smoothstep(seaCut, seaCut + 0.14, seaSt.r) * seaTw;
      // too far to tell flecks apart, two things are left. The wash: three flat steps of light that thin toward the lip,
      // broken by gaps that lie level along the rock (a run-up that climbs and falls, never a fringe standing up the rock).
      // And under it the waterline: a bright broken line, in dashes a pipe or two long that light as the crest reaches
      // them and go out one by one as it drains, with dark stretches between
      float seaStreak = seaNoise(vec2(dot(vWPos.xz, vec2(0.62, 0.78)) * 0.75 + 9.0, seaRise * 4.5 - uTime * 0.3));
      float seaWashF = seaSteps((1.0 - seaRel) * (0.25 + 1.0 * seaStreak), 3.0, 0.1 * stroke) * (1.0 - step(0.999, seaRel)) * seaWashZ;
      float seaFrac = 0.1 + 0.8 * seaSg.y;
      float seaOn = 1.0 - smoothstep(seaFrac - 0.1, seaFrac + 0.1, 0.72 * seaCh + 0.28 * seaBeat);
      float seaGaps = mix(1.0, smoothstep(0.3, 0.62, seaNoise(vec2(seaAlong * 0.06 + 2.0, uTime * 0.04))), smoothstep(0.06, 0.3, seaPx));
      float seaBand = seaWashZ * (1.0 - smoothstep(0.1, 0.24 + (0.3 + 0.3 * seaCh2) * seaSg.x * (1.0 + 2.0 * uSeaL.z), seaRise)) * seaOn * (0.6 + 0.6 * seaCh2) * seaGaps;
      // (what faces up is seen at a glance from a boat: there the sum is a thin glitter, broken both ways)
      seaFl = mix(seaFl, mix(max(seaBand, 0.75 * seaWashF), seaDen * (0.4 + 0.55 * seaSg.y) * 0.16 * (0.3 + 1.4 * seaNoise(vWPos.xz * 2.3 + 1.0) * seaNoise(vWPos.zx * 0.6 + 4.0)), seaFlat), seaFarK);
      // (aqua where the wash is new and low, ember where it is old or high. Core is rationed: near, only the few flecks with the highest
      // thresholds, only while the crest is on them, only at the waterline; far off, only the brightest dashes of the waterline)
      vec3 seaNear = mix(uSeaEmber * 2.8, uSeaAqua * 1.4, seaNew * mix(1.0, 1.0 - 0.75 * seaRel, seaFarK)) * (min(seaFl, 1.2) * seaSg.y);
      seaNear += uSeaCore * (smoothstep(0.6, 1.0, seaSg.x) * seaSg.y * mix(2.2 * seaDen * seaDen * smoothstep(0.72, 0.9, seaFa.r) * seaFl, 0.6 * seaBand * smoothstep(0.75, 0.97, seaCh2) * (1.0 - seaFlat), seaFarK));
      // the breath of the wash on the rock over it: ember in flat steps, strongest where the crest stands, gone within a metre or two (and to the roof in the gate's great swells)
      // (in patches with ragged edges that run down the face, bare rock between them: a film of light over the whole foot is glass, not rock)
      float seaRunN = seaNoise(vec2(seaAlong * 1.7 + 3.0, seaY * 0.9 - uTime * 0.22)) * 0.6 + seaNoise(vec2(seaAlong * 5.1, seaY * 2.3 - uTime * 0.5)) * 0.4;
      float seaBreath = seaSteps(exp(-max(seaRise, 0.0) / (0.5 + 0.45 * seaLip)) * seaSg.y, 3.0, 0.1 * stroke) * smoothstep(0.5, 0.58, seaRunN + 0.22 * (seaSg.y - 0.5)) * seaWashZ * (1.0 - seaFlat);
      seaNear += mix(uSeaDying * 1.2, uSeaEmber * 1.5, seaNew) * (uSeaRim.w * 0.55 * seaBreath);
      float seaPoolCut = 1.0 - 0.8 * seaSg.y;
      seaNear += (uSeaAqua * 0.9 + uSeaEmber * 1.6) * (seaFlat * seaTop * seaWet * seaSg.y * (1.5 * seaSt.g * smoothstep(seaPoolCut, seaPoolCut + 0.14, seaSt.r) * seaTw + 0.5 * seaFb.g * smoothstep(seaPoolCut, seaPoolCut + 0.2, seaFb.r)));       // pools on the steps: a glitter filling the dished tops
      // threads that drain down the flutes: few, a finger wide, beaded, and only where they can be told apart (far off they would add up to a fringe)
      float seaTc = seaAlong / 0.42, seaTi = floor(seaTc), seaTh = seaHash1(vec2(seaTi, 3.7)), seaTh2 = seaHash1(vec2(seaTi, 9.1));
      float seaTw2 = max(0.006 + 0.008 * seaTh2, 0.7 * seaPx);
      float seaLine = (1.0 - smoothstep(0.4 * seaTw2, seaTw2, abs(fract(seaTc) - 0.2 - 0.6 * seaTh) * 0.42)) * min(1.0, 0.016 / seaTw2);
      float seaDash = smoothstep(0.42, 0.7, seaNoise(vec2(seaTi * 7.3, seaY * 1.6 + uTime * (0.5 + 0.9 * seaTh2))));
      float seaDrain = seaLine * seaDash * (1.0 - smoothstep(0.0, seaRun * (0.3 + 0.9 * seaTh), max(seaRise, 0.0))) * seaWet * max(seaSg.y - 0.6 * seaSg.x, 0.0) * step(0.62, seaTh2 + 0.3 * seaBroad) * (1.0 - seaFarK);
      seaNear += (uSeaAqua * 0.7 + uSeaEmber * 2.0) * seaDrain;
      // the boat's own light, held in the water's trace under this point of the rock
      vec2 seaUv = (vWPos.xz - uTraceRect.xy) / uTraceRect.zw + 0.5, seaE = min(seaUv, 1.0 - seaUv);
      float seaTr = min(seaE.x, seaE.y) > 0.0 ? texture2D(tTrace, seaUv).b : 0.0;
      float seaCutT = 1.02 - seaTr * exp(-max(seaY, 0.0) / 1.5) * 0.8;
      seaNear += uSeaAqua * (1.1 * uSeaL.y * seaWet * step(0.02, seaTr) * (smoothstep(seaCutT, seaCutT + 0.18, seaFa.r) * seaFa.g + 0.8 * smoothstep(seaCutT + 0.05, seaCutT + 0.25, seaFb.r) * seaFb.g + 0.5 * seaLine * seaDash * seaTr * exp(-max(seaY, 0.0) / 1.5) * (1.0 - seaFarK)));
      c = seaLoc + seaSky + albedo * lamps + seaFar;
      glow += seaNear;
    }`,
  });

  /** The seaRock material: kit.gouache with the extension above. opts: any gouache option, and rest / top / run / pale / uniform. */
  const rock = (o = {}) => {
    const { rest, top, run, pale, uniform, ...g } = o;
    return ctx.kit.gouache({ color: C.basalt, brush: 0.6, ...g, extend: extend({ rest, top, run, pale, uniform }) });
  };

  /**
   * Surf light round the feet of things: one mesh of strips lying on the water (they ride the swell), lit by the
   * breaking wave and, behind the rain front, by the rain. It stands in for what the water's trace cannot do here:
   * the trace has one decay time (the wake's 22 s), and surf must pulse with the 7 s swell; and half the rocks stand
   * outside the trace's bounds.
   *   outlines: [{ pts: [[x, z], ...], closed: true, width: 3.2, inset: 0.6, flip: false }]
   *     pts     the waterline of the thing, in the realm's own x, z. Closed outlines may run either way round; an
   *             open one has the water on its left as it runs (flip: true = on its right)
   *     width   metres of water outside the waterline that light; inset: metres it reaches in under the thing's edge
   * Returns the Mesh (already added, kept out of the mirror).
   */
  const surf = (outlines, { gain = 1 } = {}) => {
    const pos = [], edge = [], idx = [];
    const rows = [0, 0.3, 0.62, 1];
    for (const o of outlines) {
      const pts = o.pts, n = pts.length, closed = o.closed !== false, width = o.width ?? 3.2, inset = o.inset ?? 0.6;
      if (n < 2) continue;
      let sign = o.flip ? -1 : 1;
      if (closed) { let area = 0; for (let i = 0; i < n; i++) { const a = pts[i], b = pts[(i + 1) % n]; area += a[0] * b[1] - b[0] * a[1]; } sign = area > 0 ? 1 : -1; }
      const base = pos.length / 3;
      for (let i = 0; i < n; i++) {
        const a = pts[closed ? (i - 1 + n) % n : Math.max(0, i - 1)], b = pts[closed ? (i + 1) % n : Math.min(n - 1, i + 1)];
        let tx = b[0] - a[0], tz = b[1] - a[1]; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
        const nx = tz * sign, nz = -tx * sign;              // outward: to the right of travel for a counter-clockwise outline (x, z)
        for (const r of rows) { const off = -inset + (width + inset) * r; pos.push(pts[i][0] + nx * off, 0, pts[i][1] + nz * off); edge.push(r); }
      }
      const m = rows.length, segs = closed ? n : n - 1;
      for (let i = 0; i < segs; i++) for (let k = 0; k < m - 1; k++) {
        const a = base + i * m + k, b = base + ((i + 1) % n) * m + k;
        idx.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('aEdge', new THREE.Float32BufferAttribute(edge, 1)); geo.setIndex(idx);
    const sh = engine.shared;
    const mat = new THREE.ShaderMaterial({
      uniforms: { ...U, uGain: { value: gain }, uTime: sh.uTime, uFogColor: sh.uFogColor, uFogDensity: sh.uFogDensity, uVeil: sh.uVeil, uVeilColor: sh.uVeilColor },
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
      vertexShader: /* glsl */`${SEA_GLSL} ${FOG_PARS}
        attribute float aEdge; varying vec2 vXZ; varying float vEdge, vFogDist;
        void main() {
          vec4 world = modelMatrix * vec4(position, 1.0);
          float h = 0.0;                                     // ride the swell, as the water's own sheet does
          for (int i = 0; i < 3; i++) { float ph = dot(uSwell[i].xy, world.xz) - uSwell[i].z, a = uSwell[i].w; h += a * cos(ph) + 0.5 * length(uSwell[i].xy) * a * a * cos(2.0 * ph); }
          world.y += h * (1.0 - smoothstep(120.0, 260.0, distance(world.xz, cameraPosition.xz))) + 0.05;
          vXZ = world.xz; vEdge = aEdge;
          vec4 mv = viewMatrix * world; vFogDist = fogDistance(mv);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */`${SEA_GLSL} ${FOG_PARS}
        uniform sampler2D tSeaFleck, tSeaStip; uniform vec3 uSeaAqua, uSeaEmber, uSeaDying, uSeaCore; uniform float uGain, uTime;
        ${SEA_INK}
        varying vec2 vXZ; varying float vEdge, vFogDist;
        void main() {
          vec2 sg = seaSurge(vXZ) * (uSeaL.y * mix(1.0, seaLee(vXZ), 0.75));
          float lf = seaFront(vXZ) * uSeaL.x * uSeaL.y * seaLee(vXZ);
          float band = 1.0 - vEdge; band *= band;                                  // strongest against the rock
          float soft = smoothstep(0.0, 0.1, vEdge) * (1.0 - smoothstep(0.8, 1.0, vEdge));
          float E = clamp(max(sg.y, 0.9 * lf) * (0.2 + 1.0 * band), 0.0, 1.0) * soft;
          if (E < 0.004) discard;
          // the broken water at a foot: a glitter of specks, dense in the dabs; white-hot against the rock while the crest is on it,
          // then cooling as it spreads and drains
          vec3 m1 = seaMark(tSeaFleck, vXZ * 0.31 + 0.07), st = seaMark(tSeaStip, vXZ * 0.75), st2 = seaMark(tSeaStip, vXZ.yx * 0.31 + 0.5);
          float tw = 0.6 + 0.4 * sin(uTime * (1.3 + 3.2 * st.z) + st.z * 47.0), tw2 = 0.7 + 0.3 * sin(uTime * (0.9 + 2.0 * st2.z) + st2.z * 31.0);
          float dens = clamp(E * (0.45 + 1.3 * seaLit(m1, 1.06 - E * 0.85)), 0.0, 1.0);
          float a = clamp(0.28 + 0.4 * E + 0.3 * clamp(sg.x * 1.2 + lf * 0.6, 0.0, 1.0) * band, 0.0, 0.9);
          vec3 col = seaInk(st, 1.03 - 0.95 * dens, a) * (tw * (0.8 + 1.2 * E)) + seaInk(st2, 1.08 - 0.92 * dens, a) * (0.6 * tw2) + seaInk(m1, 1.06 - E * 0.85, a) * 0.12;
          col += uSeaCore * (sg.x * band * band * 1.4 * seaLit(st, 0.45) * tw);
          // too far to tell marks apart: their sum, in dashes with long gaps between (never a line of light round a rock or along a coast)
          float px = max(fwidth(vXZ.x), fwidth(vXZ.y));                             // metres of water to a pixel
          float dashes = smoothstep(0.42, 0.78, seaNoise(vXZ * 0.85 + seaNoise(vXZ * 0.23) * 3.0)) * smoothstep(0.34, 0.62, seaNoise(vXZ * 0.075 + 11.0)) * mix(1.0, smoothstep(0.3, 0.62, seaNoise(vXZ * 0.045 + 5.0 + uTime * 0.03)), smoothstep(0.1, 0.4, px));
          // (a bright broken line at the waterline: behind the rain front, where the sea at the foot is alight all the time, it is the
          // brightest thing in the picture, white-hot in its dashes)
          col = mix(col, seaAged(a) * (E * (0.25 * E + 1.0 * dashes)) + uSeaCore * (0.7 * lf * band * dashes * dashes), smoothstep(0.03, 0.16, px));
          col *= uGain * (1.0 - fogAmount(vFogDist)) * (1.0 - uVeil);
          gl_FragColor = vec4(col, 1.0);
        }`,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = 'sea-surf'; mesh.frustumCulled = false; mesh.renderOrder = 1;
    ctx.add(mesh); ctx.only(mesh, 'direct');
    const thrown = spray(outlines, gain);                 // the spray thrown at these feet (below); mesh.userData.spray is its Mesh
    if (thrown) mesh.userData.spray = thrown;
    return mesh;
  };

  /**
   * Spray. Where a crest strikes a foot, broken water is thrown up: a plume of marks that stands on the waterline, rises
   * while the water is rising there and falls back as it drains, and flecks flung clear of it that rise, hang and fall
   * as sparks. Most where a rock turns to the weather (the swell's own direction); none where the water is quiet (the
   * lee round the kept lamp, the cave). Timed by the swell's own three waves at each place, so the bursts walk through
   * the rocks at the swell's pace and no two places go off together. One mesh for all the outlines of one call (one draw
   * call, not in the mirror). plan.spray: every (metres of waterline to a place), max (places), flecks (to a place),
   * high (metres a plume may stand), throw (m/s), gravity, gain.
   */
  const spray = (outlines, gain = 1) => {
    const S = plan.spray || {}, every = S.every ?? 4.5, most = S.max ?? 110, F = S.flecks ?? 16;
    if (most <= 0) return null;
    const dir = (plan.water && plan.water.swellDir) || [1, 0], dl = Math.hypot(dir[0], dir[1]) || 1, sx = dir[0] / dl, sz = dir[1] / dl;
    const rnd = ctx.rng(4177), sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
    const em = [];
    for (const o of outlines) {
      const pts = o.pts, n = pts.length, closed = o.closed !== false, width = o.width ?? 3.2;
      if (n < 2 || width < (S.minWidth ?? 2.4) || o.spray === false) continue;      // (floats, dans and pools throw none)
      let sign = o.flip ? -1 : 1;
      if (closed) { let area = 0; for (let i = 0; i < n; i++) { const a = pts[i], b = pts[(i + 1) % n]; area += a[0] * b[1] - b[0] * a[1]; } sign = area > 0 ? 1 : -1; }
      const segs = closed ? n : n - 1;
      let acc = rnd() * every;
      for (let i = 0; i < segs; i++) {
        const a = pts[i], b = pts[(i + 1) % n]; let tx = b[0] - a[0], tz = b[1] - a[1]; const len = Math.hypot(tx, tz);
        if (len < 1e-4) continue;
        tx /= len; tz /= len;
        const nx = tz * sign, nz = -tx * sign, weather = -(nx * sx + nz * sz);      // outward, as the strips above; 1 = square to the weather
        acc += len;
        while (acc >= every) { acc -= every; const t = Math.min(1, Math.max(0, 1 - acc / len)); em.push({ x: a[0] + (b[0] - a[0]) * t, z: a[1] + (b[1] - a[1]) * t, nx, nz, weather, r: rnd() }); }
      }
    }
    if (!em.length) return null;
    // the nearer the route and the more squarely a place meets the weather, the sooner it is given spray
    const route = []; for (let d = 0; d <= ctx.path.length; d += 6) { const a = ctx.path.at(d); route.push([a.x, a.z]); }
    // (and a place turned to the route before one turned away from it: the rider must see the spray of the feet he passes)
    for (const e of em) {
      let d2 = 1e12, near = route[0]; for (const q of route) { const dd = (e.x - q[0]) * (e.x - q[0]) + (e.z - q[1]) * (e.z - q[1]); if (dd < d2) { d2 = dd; near = q; } }
      const dist = Math.sqrt(d2), faces = dist > 1e-3 ? (e.nx * (near[0] - e.x) + e.nz * (near[1] - e.z)) / dist : 1;
      e.str = 0.55 + 0.45 * sm(-0.3, 0.75, e.weather);
      e.score = e.str * (1 - sm(70, 190, dist)) * (0.35 + 0.65 * sm(-0.3, 0.5, faces)) * (0.7 + 0.3 * e.r);
    }
    em.sort((a, b) => b.score - a.score); em.length = Math.min(em.length, most);
    const count = em.length * (1 + F), org = new Float32Array(count * 4), seed = new Float32Array(count * 4), ks = new Float32Array(count * 2);
    let k = 0;
    for (const e of em) for (let j = 0; j <= F; j++) {
      org.set([e.x + e.nx * 0.3, e.z + e.nz * 0.3, e.nx, e.nz], k * 4); seed.set([rnd(), rnd(), rnd(), rnd()], k * 4); ks.set([j === 0 ? 0 : 1, e.str], k * 2); k++;
    }
    const geo = new THREE.InstancedBufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, 0, 0.5, 0, 0, 0.5, 1, 0, -0.5, 1, 0], 3)); geo.setIndex([0, 1, 2, 0, 2, 3]);
    geo.setAttribute('aOrg', new THREE.InstancedBufferAttribute(org, 4)); geo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seed, 4)); geo.setAttribute('aKS', new THREE.InstancedBufferAttribute(ks, 2));
    geo.instanceCount = count;
    const sh = engine.shared;
    const uni = {
      ...U, uTime: sh.uTime, uFogColor: sh.uFogColor, uFogDensity: sh.uFogDensity, uVeil: sh.uVeil, uVeilColor: sh.uVeilColor, uPixel: { value: 0.0012 },
      uSpray: { value: new THREE.Vector4(S.high ?? 4.2, S.throw ?? 8.5, S.gravity ?? 7.5, (S.gain ?? 1) * gain) },
      uSprayWind: { value: new THREE.Vector2(sx * (S.wind ?? 0.9), sz * (S.wind ?? 0.9)) },      // the weather carries it back over the rock
    };
    // (Paint, not added light: the brighter of the stroke and what is behind it stands (two plumes that overlap do not add up to a lamp).
    // And into the picture's alpha goes the painter's own mark for "leave this as drawn" (gouache's crisp: -15), added: thrown water
    // is strokes and drops a hand wide, which the painter's filter would wash into a stain)
    const mat = new THREE.ShaderMaterial({
      uniforms: uni, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false,
      blending: THREE.CustomBlending, blendEquation: THREE.MaxEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
      blendEquationAlpha: THREE.AddEquation, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneFactor,
      vertexShader: /* glsl */`${SEA_GLSL} ${FOG_PARS}
        attribute vec4 aOrg, aSeed; attribute vec2 aKS;
        uniform float uTime, uPixel; uniform vec4 uSpray; uniform vec2 uSprayWind;
        varying vec2 vUv, vSize; varying vec4 vA; varying float vFogDist, vKind;
        // how hard a crest was striking a place, so many seconds ago: the water high there and still rising
        float seaStrike(vec2 xz, float ago) { float h = seaSwellN(xz, ago), was = seaSwellN(xz, ago + 0.6); return smoothstep(0.05, 0.5, h) * smoothstep(0.0, 0.2, h - was); }
        void main() {
          vec2 o = aOrg.xy, nrm = aOrg.zw, tng = vec2(-nrm.y, nrm.x);
          float amp = uSwell[0].w + uSwell[1].w + uSwell[2].w;                         // metres a crest stands over still water (less with reduced motion, none in the cave)
          float str = aKS.y * uSeaL.y * mix(1.0, seaLee(o), 0.85) * clamp(amp / 0.7, 0.0, 1.2) * (1.0 + 0.5 * seaFront(o) * uSeaL.x);      // (more of it behind the rain front: the weather has come)
          vKind = aKS.x; vSize = vec2(1.0); vUv = vec2(position.x * 2.0, position.y);
          vec4 mv;
          if (aKS.x < 0.5) {
            // the plume: a fan of marks standing on the waterline, upright, turned to the eye
            // (thrown while the water is rising there, standing a moment, fallen back within a second: what drains after that is on the rock and on the water, not in the air)
            float e = max(max(seaStrike(o, 0.1), 0.85 * seaStrike(o, 0.45)), 0.4 * seaStrike(o, 0.85)) * str;                            // how high it stands now
            float b = max(max(seaStrike(o, 0.0), 0.8 * seaStrike(o, 0.4)), 0.45 * seaStrike(o, 0.8)) * str;                               // how much of it is alight
            // (behind the rain front the weather has come: along a shore that meets it broken water stands all the time, now higher, now lower, each place in its own time)
            float standing = seaFront(o) * uSeaL.x * uSeaL.y * mix(1.0, seaLee(o), 0.85) * (0.45 + 0.55 * aKS.y) * clamp(amp / 0.7, 0.0, 1.0) * (0.45 + 0.95 * seaNoise(vec2(uTime * 0.55 + aSeed.w * 37.0, aSeed.x * 9.0)));
            e = max(e, standing); b = max(b, standing);
            float w = 1.3 + 1.5 * aSeed.x, H = uSpray.x * 0.5 * (0.55 + 0.45 * aSeed.z) * (1.0 + 0.7 * seaFront(o) * uSeaL.x);      // (the heap is low: what flies higher is drops. Taller behind the rain front: the weather has come)
            vec3 base = vec3(o.x, seaSwellN(o, 0.0) * amp - 0.2, o.y);
            vec3 toEye = cameraPosition - base; vec3 right = normalize(vec3(toEye.z, 0.0, -toEye.x) + vec3(1e-5, 0.0, 0.0));
            vec3 wp = base + right * (position.x * w * 2.0) + vec3(0.0, position.y * H, 0.0);
            vSize = vec2(w, H); vA = vec4(e, b, max(seaStrike(o, 0.0) * str, 0.85 * standing) / max(b, 0.05), aSeed.w);
            mv = viewMatrix * vec4(wp, 1.0);
            gl_Position = b < 0.012 ? vec4(2.0, 2.0, 2.0, 1.0) : projectionMatrix * mv;
          } else {
            // a fleck: thrown when a crest struck its place, it rises, hangs and falls back into the sea
            float life = 1.4 + 0.9 * aSeed.x, age = fract(uTime / life + aSeed.y) * life;
            vec2 o2 = o + tng * ((fract(aSeed.y * 13.7) - 0.5) * 2.6);
            float s0 = max(seaStrike(o2, age) * str, 0.45 * seaFront(o2) * uSeaL.x * uSeaL.y * mix(1.0, seaLee(o2), 0.85) * aKS.y * step(0.5, fract(aSeed.w * 5.3 + floor(uTime / life + aSeed.y) * 0.37)));
            float v0 = uSpray.y * (0.3 + 0.7 * aSeed.z) * sqrt(max(s0, 0.0)), g = uSpray.z;
            vec2 vh = nrm * (0.2 + 1.0 * aSeed.w) + tng * ((fract(aSeed.w * 7.13) - 0.5) * 2.2) + uSprayWind;
            vec3 pos = vec3(o2.x + vh.x * age, seaSwellN(o2, age) * amp + 0.1 + v0 * age - 0.5 * g * age * age, o2.y + vh.y * age);
            float alive = step(0.03, s0) * step(seaSwellN(pos.xz, 0.0) * amp - 0.05, pos.y) * smoothstep(0.0, 0.07, age);
            mv = viewMatrix * vec4(pos, 1.0);
            vec3 vv = mat3(viewMatrix) * vec3(vh.x, v0 - g * age, vh.y);
            vec2 d2 = normalize(vv.xy + vec2(1e-4, 0.0));
            float dist = length(mv.xyz), sz = 0.012 + 0.022 * aSeed.x * aSeed.x, wpx = max(sz, 1.3 * dist * uPixel);      // (drops: a finger's width at most. Larger, they are orbs when the boat is near)      // never thinner than the screen can draw: fainter instead
            float len = wpx * (1.0 + min(length(vv.xy) * 0.22, 2.4));                 // drawn out along its flight
            mv.xy += d2 * ((position.y - 0.5) * len * 2.0) + vec2(-d2.y, d2.x) * (position.x * wpx * 2.0);
            vA = vec4(alive * sqrt(sz / wpx) * min(1.0, s0 * 3.0), age / life, 0.0, aSeed.w);
            gl_Position = alive < 0.5 ? vec4(2.0, 2.0, 2.0, 1.0) : projectionMatrix * mv;
          }
          vFogDist = fogDistance(mv);
        }`,
      fragmentShader: /* glsl */`${SEA_GLSL} ${FOG_PARS}
        uniform sampler2D tSeaFleck, tSeaStip; uniform vec3 uSeaAqua, uSeaEmber, uSeaDying, uSeaCore; uniform float uTime; uniform vec4 uSpray;
        ${SEA_INK}
        varying vec2 vUv, vSize; varying vec4 vA; varying float vFogDist, vKind;
        void main() {
          vec3 col; float crisp = 0.0;
          if (vKind < 0.5) {
            vec2 q = vec2(vUv.x * vSize.x, vUv.y * vSize.y);                           // metres across the plume and up it
            // Its outline: a heap of thrown water, higher here than there, leaning with the weather, never the same twice; the plumes
            // of neighbouring places run into one broken band along a shore
            float xs = q.x - 0.3 * q.y;
            float n1 = seaNoise(vec2(xs * 1.6 + vA.w * 31.0, uTime * 0.7 + vA.w * 9.0)), n2 = seaNoise(vec2(xs * 4.3 + vA.w * 17.0, uTime * 1.5 + vA.w * 3.0));
            float teeth = seaNoise(vec2(xs * 7.5 + vA.w * 5.0, q.y * 1.3 - uTime * 2.2));
            float crest = 0.22 + 0.78 * n1 * (0.55 + 0.6 * n2);                         // the share of its height it reaches here
            float top = vSize.y * 0.9 * min(vA.x, 1.15) * crest * (1.0 - pow(min(abs(vUv.x), 1.0), 3.0));      // metres
            float edge = q.y / max(top, 0.02);                                         // 0 at the water .. 1 where the last of it flies
            // (the quad starts a hand under the water, which hides nothing drawn after it: the plume begins at a ragged waterline of its own)
            float foot = smoothstep(0.1, 0.34, q.y + 0.16 * teeth);
            if (edge >= 1.3 || top < 0.03 || foot < 0.01) discard;
            // Thrown water, in paint: dabs and short strokes, each leaning with the weather and travelling upward. Low down they
            // crowd into one lumpy mass whose edge is the edges of the dabs; higher they stand apart; the last fly single. Flat
            // colour, hard edges, dark between (never a glow: one large value above white and the bloom makes a lamp of it).
            // Aqua while the crest is on it, white-hot only low in the mass, ember as it falls back.
            float heat = vA.y * (0.45 + 0.55 * vA.z);                                 // alight and new: 1 .. draining: 0
            float fade = smoothstep(0.02, 0.16, vA.y);
            float d = clamp(1.0 - edge / 1.3, 0.0, 1.0);                               // 1 at the water .. 0 where the last of it flies
            vec3 mA = seaMark(tSeaFleck, vec2(q.y * 0.19 - uTime * 0.07, xs * 0.19) + vA.w * vec2(5.3, 2.9));
            vec3 mB = seaMark(tSeaFleck, vec2(q.y * 0.43 - uTime * 0.13, xs * 0.43) + vA.w * vec2(1.7, 7.1));
            float cut = 1.04 - (0.22 + 0.95 * pow(d, 0.85)) * (0.5 + 0.5 * heat);
            float mk = max(seaLit(mA, cut), 0.9 * seaLit(mB, cut + 0.06));
            mk = max(mk, smoothstep(0.86, 0.93, d + 0.12 * (teeth - 0.5)));             // (only at the very waterline do they run into one: a heap with an outline of its own is a tent, or a flame)
            vec3 paint = mix(uSeaEmber * 2.4, uSeaAqua * 0.85, smoothstep(0.15, 0.6, heat) * (0.3 + 0.7 * smoothstep(0.0, 0.6, d)));
            paint = mix(paint, uSeaCore * 0.82, smoothstep(0.8, 0.94, d + 0.12 * (n2 - 0.5)) * smoothstep(0.5, 0.95, heat));
            // (far off, where a dab is a pixel or two, the heap is paler and its lower half white-hot: it must carry at seventy metres what a hundred strokes carry at ten)
            float farP = smoothstep(0.03, 0.09, max(fwidth(q.x), fwidth(q.y)));
            paint = mix(paint, mix(uSeaAqua * 1.0, uSeaCore * 0.9, smoothstep(0.35, 0.75, d)), 0.6 * farP * smoothstep(0.3, 0.7, heat));
            mk *= fade * foot;
            col = paint * mk; crisp = step(0.4, mk);
          } else {
            vec2 e = vec2(vUv.x, (vUv.y - 0.5) * 2.0);
            float shape = 1.0 - smoothstep(0.45, 1.0, length(e));
            float a = clamp(1.0 - vA.y * 1.1, 0.0, 1.0);                              // new .. spent
            col = mix(uSeaEmber * 2.4, mix(uSeaAqua * 1.25, uSeaCore * 1.15, smoothstep(0.75, 1.0, a)), smoothstep(0.15, 0.5, a)) * (shape * vA.x);
            crisp = step(0.25, shape * vA.x);
          }
          float show = uSpray.w * (1.0 - fogAmount(vFogDist)) * (1.0 - uVeil);
          gl_FragColor = vec4(col * show, -15.5 * crisp * step(0.3, show));
        }`,
    });
    const m = new THREE.Mesh(geo, mat);
    m.name = 'sea-spray'; m.frustumCulled = false; m.renderOrder = 2;
    const size2 = new THREE.Vector2();
    m.onBeforeRender = (renderer, scene, camera) => { const rt = renderer.getRenderTarget(), h = rt ? rt.height : renderer.getDrawingBufferSize(size2).y; uni.uPixel.value = 2 / (camera.projectionMatrix.elements[5] * Math.max(1, h)); mat.uniformsNeedUpdate = true; };
    ctx.add(m); ctx.only(m, 'direct');
    return m;
  };

  /**
   * The sea's light on the water itself: one sheet that lies exactly on the water's surface (the same grid, the same
   * swell, the same well round the hull) and draws every mark of light there is, in place of the water's own
   * one-colour `touch` (whose amount the realm keeps next to nothing, so that the water still lays and feeds its
   * trace but draws no flecks of its own). What it draws, each in marks of paint that cool as they age (core, aqua,
   * ember, a dark violet, gone):
   *   the road     wherever the hull or anything else wrote into the water's trace ('glow' channel): a dense glitter
   *                of specks, each in its own time, over comma dabs, over a few large soft patches; white-hot where
   *                the hull is churning the water now; folded by the swell
   *   the rain     behind the rain front: every drop a spark with its ring as a broken hairline (the water's own rings,
   *                so that the light lies on the ring the water bends), a few heavy drops with wide rings that last;
   *                streaks of light lying along the crests of the swell; soft patches of old light between; and too
   *                far to tell marks apart, points that come and go, bands on the crests, and one band of light
   *                gathered under the horizon
   *   the front    eight metres of fire along the foot of the rain front
   * Driven by `sheet.uniforms.uSheet` (x: how readily the wake lights it, y: the rain's share, z: half the front's
   * soft width, w: how strong the rain's light is) and by the shared sea uniforms. One draw call, not in the mirror.
   *
   * THE VERTEX SHADER AND THE GRID ARE COPIES of the water's own (water-final.js: VERT, makeSwellGrid, SWELL_GRID,
   * TUNE.swellNear / swellFar, and the rule that moves the grid by whole cells): if those change, change these, or the
   * light floats off the water. docs/build/sea/2-light.md says what the engine should export instead.
   */
  const sheet = () => {
    const level = (engine.quality && engine.quality.level) || 'high';
    const g = { high: { cell: 1, flat: 48 }, medium: { cell: 1.5, flat: 32 }, low: { cell: 2, flat: 24 } }[level] || { cell: 1, flat: 48 };      // = SWELL_GRID
    // the water's own grid (makeSwellGrid): square cells round the rider, growing with distance. (It reaches 1300 m; this one
    // stops at 520, where the air has long hidden every light: the cells it does have are the water's own.)
    const steps = [0]; for (let i = 1; i <= g.flat; i++) steps.push(i * g.cell);
    let d = g.cell; while (steps[steps.length - 1] < 520) { d *= 1.1; steps.push(steps[steps.length - 1] + d); }
    const m = steps.length - 1, side = 2 * m + 1, at = (i) => (i < m ? -steps[m - i] : steps[i - m]);
    const pos = new Float32Array(side * side * 3);
    for (let j = 0; j < side; j++) for (let i = 0; i < side; i++) { const o = (j * side + i) * 3; pos[o] = at(i); pos[o + 1] = 0; pos[o + 2] = at(j); }
    const idx = new Uint32Array((side - 1) * (side - 1) * 6);
    let k = 0;
    for (let j = 0; j < side - 1; j++) for (let i = 0; i < side - 1; i++) { const a = j * side + i, b = a + 1, c = a + side, e = c + 1; idx[k++] = a; idx[k++] = c; idx[k++] = b; idx[k++] = b; idx[k++] = c; idx[k++] = e; }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setIndex(new THREE.BufferAttribute(idx, 1));
    const sh = engine.shared;
    // The water's own numbers, where the engine lets them be reached (its material's uniform objects, shared by reference
    // so that nothing is a frame late): whether the swell is up and how far it lifts, the well round the hull, the rain's
    // clock and the front as the water itself has them. Without them (another water) the sheet's own copies stand in.
    const WU = (engine.water && engine.water.material && engine.water.material.uniforms) || {};
    const own = { uSwellOn: { value: new THREE.Vector4(0, 120, 260, 0) }, uWell: { value: new THREE.Vector4(0, 0, 0, -1) }, uWellB: { value: new THREE.Vector4() }, uRain: { value: new THREE.Vector4(0, 0, 0.3, 1) }, uFront: { value: new THREE.Vector4(1, 0, -1e5, 0.1) } };
    const shares = !!(WU.uSwellOn && WU.uWell && WU.uWellB && WU.uRain && WU.uFront);
    const uni = {
      ...W, uSeaOmega: U.uSeaOmega, uSeaFront: U.uSeaFront, uSeaL: U.uSeaL, uSeaLee: U.uSeaLee, tSeaFleck: U.tSeaFleck, tSeaStip: U.tSeaStip,
      uSeaAqua: U.uSeaAqua, uSeaEmber: U.uSeaEmber, uSeaCore: U.uSeaCore, uSeaDying: U.uSeaDying,
      uSheet: { value: new THREE.Vector4(0.5, 0, 7, 0.5) }, uFleck: { value: new THREE.Vector4(0.37, 0.16, 0.047, 0.35) },
      uSheetTime: sh.uTime, uSkip: { value: 0 }, uSwellDir: { value: new THREE.Vector4(1, 0, 0, 0) },
      uSheen: { value: new THREE.Vector4(0, 0, 0, 0) },      // the sky on the backs of the swell: its colour, and how much (set.js)
      uSheenB: { value: new THREE.Vector4(0.26, 0.7, 0, 0) },      // how squarely a back may be met and still shine (radians); how much less of it far off
      uRidge: { value: new THREE.Vector4(0.3, 1, 1, 0) },      // the ridge lines of the swell: half their width in metres, how strongly the sky draws them (at rest), how strongly the sea's light does (lit)
      uGlint: { value: new THREE.Vector4(0.0012, 1, 1, 1) },   // the far dashes: radians to a pixel (set as it is drawn), how bright, how many, how bright the band under the horizon
      uChop: { value: new THREE.Vector4(0, 0.8, 0.3, 0.45) },   // the short sea: its clock (set.js runs it; slower with reduced motion), its share in where light gathers, its height in metres (for the sheen), and the long swell's share
      uSwellOn: shares ? WU.uSwellOn : own.uSwellOn, uWell: shares ? WU.uWell : own.uWell, uWellB: shares ? WU.uWellB : own.uWellB,
      uRainW: shares ? WU.uRain : own.uRain, uFrontW: shares ? WU.uFront : own.uFront,
      uFogColor: sh.uFogColor, uFogDensity: sh.uFogDensity, uVeil: sh.uVeil, uVeilColor: sh.uVeilColor,
    };
    const mat = new THREE.ShaderMaterial({
      uniforms: uni, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
      vertexShader: /* glsl */`${WATER_GLSL} ${FOG_PARS}
        uniform vec4 uSwellOn, uWell, uWellB;
        varying vec3 vWorld; varying float vFogDist;
        void main() {
          vec4 world = modelMatrix * vec4(position, 1.0);
          if (uSwellOn.x > 0.5) {                            // exactly what the water's own sheet does (water-final.js, VERT; waterSwell is its swellHeight)
            float h = waterSwell(world.xz) * (1.0 - smoothstep(uSwellOn.y, uSwellOn.z, distance(world.xz, cameraPosition.xz)));
            vec2 q = world.xz - uWell.xy;
            float ahead = dot(q, uWell.zw), side = dot(q, vec2(-uWell.w, uWell.z));
            float d = length(vec2(side, ahead - clamp(ahead, -1.7, 2.0)));
            world.y += mix(h, uWellB.x + ahead * uWellB.y + side * uWellB.z, 1.0 - smoothstep(0.9, 3.4, d));
          }
          vWorld = world.xyz;
          vec4 mv = viewMatrix * world; vFogDist = fogDistance(mv);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */`${WATER_GLSL} ${SEA_CORE} ${FOG_PARS}
        uniform sampler2D tSeaFleck, tSeaStip; uniform vec3 uSeaAqua, uSeaEmber, uSeaCore, uSeaDying;
        uniform vec4 uSheet, uFleck, uRainW, uFrontW, uSwellDir, uSheen, uSheenB, uChop, uGlint, uRidge; uniform float uSheetTime, uSkip;
        varying vec3 vWorld; varying float vFogDist;
        ${SEA_INK}
        // The water's own rain rings (water-final.js, rainRings: the same cells, seeds and clock, so that the light lies on
        // the very ring the water bends), read as light. x: the ring as a broken hairline while it is new, y: the same grown
        // old, z: the spark where the drop landed, w: how hard the ring stirs the water it is crossing. bold: a wider line
        vec4 seaRings(vec2 p, float cell, float seed, float t, float prob, float foot, float bold, vec2 fa, vec2 fb) {
          vec2 g = p / cell, id = floor(g), f = g - id, base = id - step(f, vec2(0.5));
          vec4 acc = vec4(0.0);
          for (int j = 0; j < 2; j++) for (int i = 0; i < 2; i++) {
            vec2 cid = base + vec2(float(i), float(j));
            vec3 h = seaHash3(cid + seed);
            float cyc = t + h.z, n = floor(cyc), ph = cyc - n;
            vec3 k = seaHash3(cid + seed + n * 17.37);
            if (k.z > prob) continue;
            vec2 d = p - (cid + 0.25 + 0.5 * k.xy) * cell;
            float heavy = fract(k.z * 91.7), size = 0.5 + 0.5 * fract(k.z * 37.3);
            float r = length(d), gap = r - (0.04 + 0.66 * ph * size) * cell, x = gap / 0.065;
            float born = smoothstep(0.0, 0.07, ph);
            vec2 u = d / max(r, 1e-3);
            heavy = 0.2 + 0.8 * heavy * heavy;
            vec2 n1 = normalize(h.xy - 0.5 + 1e-4), n2 = normalize(k.yx - 0.5 + 1e-4);
            // (a ring, not a curl: the whole circle but for one dry gap; a hairline all the way round, measured across the line as the
            // screen sees it, so that its sides are as thin as its front and back; and a second, slighter ring inside the first, its
            // own gap elsewhere: with their gaps in one place the two read as a swirl drawn with a brush)
            vec2 u2 = vec2(u.x * u.x - u.y * u.y, 2.0 * u.x * u.y);
            float arc = smoothstep(-1.22, -1.0, 0.7 * dot(u2, n1) + 0.6 * dot(u, n2)), arc2 = smoothstep(-1.22, -0.95, 0.7 * dot(u2, n2) - 0.6 * dot(u, n1));
            float wd = max(0.007 * bold, 0.7 * length(vec2(dot(u, fa), dot(u, fb)))), q = gap / wd;
            float q2 = (r - 0.55 * (0.04 + 0.66 * ph * size) * cell) / wd;
            float line = (exp(-q * q) * arc + 0.55 * exp(-q2 * q2) * arc2 * smoothstep(0.15, 0.4, ph)) * heavy * heavy * born * min(1.0, 0.012 * bold / wd);
            acc.x += line * (1.0 - ph) * (1.0 - ph);
            acc.y += line * ph * (1.0 - ph) * 3.0;
            float sr = max(0.028 * bold, 1.1 * foot);
            acc.z += heavy * (1.0 - smoothstep(0.55 * sr, sr, r)) * (1.0 - smoothstep(0.0, 0.3, ph)) * min(1.0, 0.0016 * bold * bold / (sr * sr));      // (a spark is a dab with an edge, not a glow)
            acc.w += heavy * exp(-x * x * 0.7) * (1.0 - ph) * born * (0.45 + 0.55 * arc);
          }
          return acc;
        }
        // The short sea that rides the swell: four waves 5.5 to 13 m long, fanned about the swell's own way, each at its own
        // pace. x: height, -1 .. 1; yz: its slope along x and z for a sea one metre high. (It is drawn in light only: the
        // surface itself is lifted by the swell alone, which the water owns.)
        vec3 seaChop(vec2 p) {
          vec2 d = uSwellDir.xy, n = vec2(-d.y, d.x), k; float ph; vec3 acc = vec3(0.0);
          k = (d * 0.94 + n * 0.34) * 0.483; ph = dot(k, p) - uChop.x * 1.25;       acc += 0.34 * vec3(cos(ph), -sin(ph) * k);
          k = (d * 0.87 - n * 0.50) * 0.698; ph = dot(k, p) - uChop.x * 1.50 + 1.7; acc += 0.28 * vec3(cos(ph), -sin(ph) * k);
          k = (d * 0.77 + n * 0.64) * 0.966; ph = dot(k, p) - uChop.x * 1.77 + 4.1; acc += 0.22 * vec3(cos(ph), -sin(ph) * k);
          k = (d * 0.98 - n * 0.17) * 1.142; ph = dot(k, p) - uChop.x * 1.92 + 2.9; acc += 0.16 * vec3(cos(ph), -sin(ph) * k);
          return acc;
        }
        // Light on water too far off to tell marks apart, as the eye has it from low down: short level dashes that come and go.
        // They are laid out by the direction they are seen in (ang: bearing, and how far under the horizon, in radians), so
        // that they are the same size on the screen near and far, lie level whatever way the eye is turned, and close up into a
        // band under the horizon by themselves; how many there are is decided by the water each lies on (dens 0..1: the share
        // of cells that hold one). cell: radians across and down. Returns x: light, y: how hot (0..1, each dash its own).
        vec2 seaGlints(vec2 ang, vec2 cell, float dens, float seed, float time) {
          vec2 g = ang / cell, id = floor(g), f = g - id;
          vec3 h = seaHash3(id + seed);
          float cyc = time * (0.45 + 0.8 * h.z) + h.x * 9.0, n = floor(cyc), ph = cyc - n;
          vec3 k = seaHash3(id + seed + n * 7.13 + 3.0);
          if (k.z > dens) return vec2(0.0);
          vec2 dq = (f - vec2(0.22 + 0.56 * k.x, 0.28 + 0.44 * k.y)) * cell;
          float halfLen = cell.x * (0.12 + 0.28 * h.y), th = cell.y * (0.18 + 0.16 * k.x), thPx = max(th, 0.55 * uGlint.x);      // never thinner than the screen can draw: fainter instead
          float r = length(vec2(dq.x / halfLen, dq.y / thPx));
          float life = sin(3.14159 * ph);
          return vec2((1.0 - smoothstep(0.55, 1.0, r)) * life * life * min(1.0, th / thPx), fract(k.z * 53.7 + h.y));
        }
        void main() {
          if (uSkip > 0.5) discard;                                                      // (not in the engine's picture of what lies under the water)
          vec2 p = vWorld.xz;
          vec3 V = normalize(cameraPosition - vWorld);
          vec4 tr = waterTrace(p), rp = waterRipple(p);
          vec2 fa = dFdx(p), fb = dFdy(p);                                               // metres of water under this pixel, across and up the screen
          float px = max(length(fa), length(fb)), det = fa.x * fb.y - fa.y * fb.x;
          mat2 toPx = mat2(fb.y, -fa.y, -fb.x, fa.x) / (abs(det) > 1e-12 ? det : 1e-12);
          float near = 1.0 - smoothstep(0.1, 0.45, px), far = smoothstep(0.05, 0.26, px);   // where single marks can be told apart; where they cannot
          float dist = length(cameraPosition - vWorld);
          vec2 qv = p - cameraPosition.xz; float dH = max(length(qv), 0.5);
          vec2 ang = vec2(atan(qv.x, -qv.y), (cameraPosition.y - vWorld.y) / dH);         // the way this place is seen: its bearing, and how far under the horizon
          // ---- the sea's shape here: the long swell (the water's own, which lifts the surface) and the short sea that rides it
          // (drawn in light alone: it is what gives every stretch of water backs and troughs). A wave the eye can no longer take
          // apart counts as what the eye sees of it from low down: mostly its crest
          float sw = seaSwellN(p, 0.0);
          vec3 ch = seaChop(p);
          float seeCh = 1.0 - smoothstep(0.9, 2.2, px), seeSw = 1.0 - smoothstep(3.0, 7.5, px);
          float hgt = uChop.w * mix(0.32, sw, seeSw) + uChop.y * mix(0.26, ch.x, seeCh);       // about -1 trough .. 1 crest (the short sea counts for more than the swell: there are always lit backs and dark troughs near the eye, and the swell carries the whole pattern up and down)
          float crest = smoothstep(0.02, 0.62, hgt);                                        // where light gathers
          // ---- what is lit: the trace (1 new .. 0 gone), and what the hull is touching now
          float live = clamp(rp.w, 0.0, 1.5), wash = clamp(rp.z, 0.0, 1.5);
          float fresh = clamp(smoothstep(0.8, 1.02, wash) + live * live * 0.08, 0.0, 1.0) * uSheet.x * uSeaL.y;
          float E = clamp(tr.b / 0.6, 0.0, 1.0) * uSeaL.y;                                  // (the trace is written at 0.6 at most: the rest of its range is the hull's own churn, above)
          // ---- the rain front: 0 ahead of it .. 1 behind, and its foot
          // (the front is a squall, not a ruled line: its edge bulges and hangs back along its length, a stone's throw either way.
          // The water's own rain and the rock keep the straight line: the difference is inside the front's soft width)
          vec2 frAlong = vec2(-uSeaFront.y, uSeaFront.x);
          float frA = dot(p, frAlong);
          float sd = uSeaFront.z - dot(uSeaFront.xy, p) + (seaNoise(vec2(frA * 0.017, 3.0)) - 0.5) * 34.0 + (seaNoise(vec2(frA * 0.075, 9.0)) - 0.5) * 9.0;      // metres behind the front
          float wet = smoothstep(-uSheet.z, uSheet.z, sd) * uSheet.y * uSheet.w * seaLee(p) * uSeaL.y;
          // its foot: eight metres of fire; too far off to hold eight metres in three pixels it is drawn three pixels deep
          // (far off a line on the sea is level whatever its shape, so its shape is in its weight: five pixels deep where the rain is heaviest, one where it is
          // light, and now and then all but nothing: a squall's foot, thick here and thin there, never a ruled bar)
          float frN = seaNoise(vec2(frA * 0.021, 5.0 + uSheetTime * 0.02)), frN2 = seaNoise(vec2(frA * 0.006, 2.0));
          float footD = max(9.5, (1.0 + 5.5 * frN * frN) * length(vec2(dot(uSeaFront.xy, fa), dot(uSeaFront.xy, fb))));
          float foot = smoothstep(-1.5, 1.5, sd) * (1.0 - smoothstep(0.3 * footD, footD, sd)) * step(0.01, uSheet.y) * uSeaL.y;
          vec3 col = vec3(0.0);
          vec2 sD = uSwellDir.xy, sC = vec2(-sD.y, sD.x);
          // ---- the ridges of the swell: the line along each back where the water stands highest (the surface is level there
          // across the way the swell travels). A sea is drawn by these lines: the sky lies along them at night, and the sea's
          // own light gathers on them. Each a stride wide, never thinner than the screen can draw (fainter instead), broken
          // along its length. The eye reads the heave from them: they run to one point on the horizon, and each hides the next
          vec2 slS = waterSwellSlope(p);
          float ampS = uSwell[0].w + uSwell[1].w + uSwell[2].w, curv = 1e-5;
          for (int i = 0; i < 3; i++) curv += uSwell[i].w * dot(uSwell[i].xy, uSwell[i].xy);
          float ridgeW = max(uRidge.x, 0.75 * length(vec2(dot(sD, fa), dot(sD, fb))));
          // (the short sea that rides the swell shifts the line to and fro, so that it is never ruled; and it is drawn in strokes with gaps, thick here and thin there)
          float ridgeS = dot(slS + ch.yz * (uChop.z * 0.5 * seeCh), sD) / curv;                 // metres to the nearest ridge line, signed
          float ridgeN = seaNoise(vec2(dot(p, sC) * 0.23 + 3.0, dot(p, sD) * 0.05 + uChop.x * 0.03)), ridgeN2 = seaNoise(vec2(dot(p, sC) * 0.9 + 11.0, uChop.x * 0.2));
          float ridgeH = ridgeW * (0.45 + 0.9 * ridgeN2);
          float ridge = (1.0 - smoothstep(0.45 * ridgeH, ridgeH, abs(ridgeS))) * smoothstep(0.1, 0.42, sw) * min(1.0, uRidge.x / ridgeW + 0.5) * smoothstep(0.03, 0.12, ampS);
          ridge *= smoothstep(0.34, 0.52, ridgeN);
          // ---- the sky on the backs of the sea. At night the water is known by this: a back that falls away from the eye is
          // met at a glance and gives back the sky's slate; a face turned to the eye is looked into, and stays dark (the
          // water's own mirror does this where it mirrors sky; in front of dark rock it has only rock to mirror, and there
          // the heave could not be read). Broken by the wind's streaks along the crests; and the sky lies along every
          // ridge line. Less far off, where the water's own mirror already has the low sky
          if (uSheen.w > 0.001) {
            vec2 sl = slS * seeSw + ch.yz * (uChop.z * 0.45 * seeCh), toP = qv / dH;      // (the long swell first: its backs are long; the short sea only roughens them)
            float meet = V.y + dot(sl, toP);                                               // how squarely the eye meets the water here: about 0 on a back seen edge-on .. 0.3 on a face turned to it
            float shine = clamp(1.0 - meet / uSheenB.x, 0.0, 1.0); shine *= shine;
            // (broken by the wind in dabs that lie along the crests, a few strides long: drawn out into streaks a ship's length long they ran to
            // the horizon like the lines of a ruled page wherever the eye looked along the swell)
            float lines = seaNoise(vec2(dot(p, sC) * 0.4, dot(p, sD) * 0.5) + uChop.x * vec2(0.02, 0.09)) * 0.65 + seaNoise(vec2(dot(p, sC) * 1.1, dot(p, sD) * 1.5) - uChop.x * vec2(0.03, 0.16)) * 0.35;
            lines = mix(smoothstep(0.28, 0.72, lines), 0.5, smoothstep(0.12, 0.6, px));       // (too far to tell the dabs apart: their mean)
            // And by its height: a back stands up into the sky's light from every side, a trough lies between two walls of water and
            // has only a strip of it. So the long backs are slate and the troughs dark whichever way the eye looks, also along the
            // swell, where no back falls away from it (there the sea was a floor)
            float back = smoothstep(-0.05, 0.85, 0.8 * sw * seeSw + 0.3 * ch.x * seeCh);
            // (not laid in flat steps: a mirrored sky is the one soft thing on this sea, and in steps it read as plates of ice)
            // (none looking down into the water beside the boat; and little in the lee round the kept lamp, the calmest water of the realm: there the
            // amber stroke wants a dark mirror under it, and over the skerry's drowned steps a sheet of sky on the water is milk)
            float lv = (uSheenB.z * shine + uSheenB.w * back * back * mix(1.0, seaLee(p), 0.9)) * (0.5 + 0.75 * lines) * (1.0 - smoothstep(0.16, 0.42, V.y));
            float farK = 1.0 - uSheenB.y * smoothstep(30.0, 160.0, dist);
            col += uSheen.rgb * (uSheen.w * farK * (0.8 * lv + uRidge.y * ridge * (0.35 + 0.65 * shine)));
          }
          if (E + fresh + wet + foot > 0.004) {
            // marks at three sizes and the stipple; every speck of the stipple glitters in its own time
            vec2 flow = rp.xy * 0.2;
            vec3 m1 = seaMark(tSeaFleck, p * uFleck.x + flow), m2 = seaMark(tSeaFleck, p.yx * uFleck.y + 0.37), m3 = seaMark(tSeaFleck, p * uFleck.z + 0.71);
            vec3 st = seaMark(tSeaStip, p * uFleck.w + flow), st2 = seaMark(tSeaStip, p.yx * uFleck.w * 0.37 + 0.5);
            float tw = 0.6 + 0.4 * sin(uSheetTime * (1.3 + 3.2 * st.z) + st.z * 47.0), tw2 = 0.7 + 0.3 * sin(uSheetTime * (0.9 + 2.0 * st2.z) + st2.z * 31.0);
            float fold = 0.55 + 0.75 * crest;                                              // light rides the crests
            // ---- the road: a glitter of specks, dense inside the dabs and thin between them, over a few small solid
            // commas, over large soft patches of old light; each mark cooling as it goes out. New light is aqua for six
            // seconds, ember by sixteen, violet after twenty: a road that cools along its length
            if (E + fresh > 0.004) {
              // (the hull writes its lane at the top of the trace's range (0.6), and it fades evenly: gone after 27 s. New light is
              // white-aqua for three seconds, ember from five to eight, violet from ten until it is gone. At the current's pace:
              // aqua to six metres astern, ember to fifteen, violet to forty-five: a road that cools along its length)
              float aE = 0.03 + 0.93 * pow(clamp((E - 0.55) / 0.42, 0.0, 1.0), 2.2);
              float dab1 = seaLit(m1, 1.06 - E * 0.85), dab2 = seaLit(m2, 1.14 - E * 0.8);
              float softB = texture2D(tSeaFleck, p * uFleck.z + 0.71, 4.0).g + 0.5 * texture2D(tSeaFleck, p.yx * uFleck.y + 0.37, 4.5).g;      // (read small: only the soft sum of the marks is left)
              float dens = clamp(E * (0.36 + 1.2 * dab1 + 1.0 * dab2 + 1.6 * softB) + fresh * 0.7, 0.0, 1.0);      // the glitter is dense in the dabs and in large soft patches, thin between
              vec3 gl = seaInk(st, 1.03 - 0.95 * dens, aE) * tw + 0.8 * seaInk(st2, 1.08 - 0.92 * dens, aE) * tw2;
              vec3 road = gl * (0.75 + 1.4 * E) + seaInk(m1, 1.06 - E * 0.85, aE) * 0.22 + seaAged(clamp(aE * 0.6, 0.0, 0.4)) * (softB * E * 0.4);
              // what the hull is churning now, the bow wave: white-hot, in specks
              road += uSeaCore * (fresh * (1.2 * seaLit(st, 0.25) * tw + 0.9 * seaLit(st2, 0.3) * tw2 + 0.25 * dab1));
              // too far to tell marks apart: points that come and go, over the sum of the marks in its own colour (a lane that
              // cools from aqua through ember to violet as it runs back, broken by the patches the marks lay in)
              vec2 gr = seaGlints(ang, vec2(0.024, 0.005), clamp(E * (0.5 + 1.1 * softB) * uGlint.z, 0.0, 0.9), 23.0, uSheetTime);
              // (dashes only: with a body of old light under them the far road was a pale wedge lying on the sea)
              vec2 gr2 = seaGlints(ang + vec2(0.41, 0.0019), vec2(0.015, 0.0033), clamp(E * (0.6 + 1.0 * softB) * uGlint.z, 0.0, 0.9), 29.0, uSheetTime * 1.2);
              vec3 roadFar = seaAged(clamp(aE + 0.25 * (gr.y - 0.6), 0.03, 0.97)) * (gr.x * 1.6 * uGlint.y) + seaAged(clamp(aE - 0.05, 0.02, 0.97)) * (gr2.x * 1.5 * uGlint.y) + seaAged(aE) * (E * 0.05 * softB);
              col += mix(road, roadFar, far) * fold;
            }
            // ---- the rain: the sea answers every drop
            if (wet > 0.004) {
              vec3 rain = vec3(0.0);
              // streaks of light lying along the crests (marks drawn out along the crest line, lit as each crest passes over them): small ones near the eye, long ones further off
              vec3 ms = seaMark(tSeaFleck, vec2(dot(p, sC) * 0.13, dot(p, sD) * 0.5) + 0.19), ms2 = seaMark(tSeaFleck, vec2(dot(p, sC) * 0.035, dot(p, sD) * 0.17) + 0.57);
              float longer = smoothstep(0.01, 0.045, px), lull = 0.12 + 0.88 * crest;        // (the troughs keep little light: the sea is dark between its lit backs)
              float streak = (1.0 - 0.7 * longer) * seaLit(ms, 1.1 - wet * (0.1 + 0.95 * crest)) + longer * seaLit(ms2, 1.14 - wet * (0.1 + 0.95 * crest));
              float top = smoothstep(0.5, 0.82, hgt);                                        // the very top of a crest: where the light is thickest
              float litB = smoothstep(-0.08, 0.34, hgt);                                     // the lit backs of the sea: 0 in the troughs, which stay dark .. 1
              float stir = 0.0;
              if (near > 0.0) {
                float fw = clamp((uFrontW.z - dot(uFrontW.xy, p)) * uFrontW.w + 0.5, 0.0, 1.0); fw = fw * fw * (3.0 - 2.0 * fw);
                float rate = uRainW.x * mix(1.0, fw, uRainW.w);                            // the water's own count of rings here
                vec4 r1 = seaRings(p, 0.5, 3.1, uRainW.y, rate * 0.14, px, 1.0, fa, fb), r2 = seaRings(p + 7.3, 0.72, 9.7, uRainW.y * 0.83 + 0.4, rate * 0.18, px, 1.3, fa, fb);
                vec4 r3 = seaRings(p + 3.7, 0.95, 21.3, uRainW.y * 0.42 + 0.7, 0.4 * fw * uSheet.y, px, 1.8, fa, fb);      // the few heavy drops: wider rings that last (never wider than a stride: a ring metres across is a brush swirl, not a raindrop)
                vec4 rr = r1 + r2 + 1.6 * r3;
                stir = clamp(rr.w, 0.0, 1.5);
                // each drop: a white-hot spark, and its ring a broken hairline that cools as it widens
                // (not every ring alike: bright on the backs and where the rain is heavy, faint in the troughs and in lighter rain)
                float ringK = (0.3 + 0.8 * litB) * (0.8 + 0.8 * smoothstep(0.3, 0.7, seaNoise(p * 0.085 + 2.0))) * near;
                rain += (uSeaCore * (2.3 * rr.z + 1.0 * rr.x) + uSeaAqua * (1.9 * rr.x + 0.7 * rr.y) + uSeaEmber * (3.4 * rr.y)) * ringK;
              }
              // the glitter between the drops: thin on open water, dense along the streaks, in the dabs and in large soft patches, and flaring where a ring is crossing it
              float softR = texture2D(tSeaFleck, p * uFleck.z + 0.71, 4.0).g + 0.5 * texture2D(tSeaFleck, p.yx * uFleck.y + 0.37, 4.5).g;
              float dabR = seaLit(m1, 1.16 - wet * 0.5 - 0.5 * stir) + 0.7 * seaLit(m2, 1.22 - wet * 0.5 - 0.4 * stir);
              float densR = clamp(wet * (0.03 + 0.97 * litB) * lull * (0.5 + 0.9 * streak + 0.6 * dabR + 1.2 * softR + 0.7 * top) + 0.75 * stir * (0.15 + 0.85 * litB) + 0.6 * wet * ridge, 0.0, 1.0);
              float aR = 0.6 + 0.3 * stir + 0.1 * crest;
              rain += (seaInk(st, 1.04 - 0.95 * densR, aR) * tw + 0.8 * seaInk(st2, 1.08 - 0.92 * densR, aR) * tw2) * (0.8 + 0.9 * stir + 0.5 * streak + 0.5 * top);
              rain += (uSeaAqua * 0.22 + uSeaCore * (0.1 * crest * crest)) * (streak * lull) + seaInk(m1, 1.2 - wet * 0.45 - 0.5 * stir, aR) * 0.3;
              rain += (uSeaAqua * 0.9 + uSeaCore * 0.35) * (wet * ridge * uRidge.z * (0.06 + 0.9 * seaLit(st, 0.3) * tw + 0.7 * seaLit(ms, 0.5) + 0.5 * seaLit(m1, 0.5)));      // the ridge of each back: a broken line of glitter (never a bar: seen broadside from close it is a stride wide)
              // under them, the body of a lit back: old light under the surface, ember, thicker toward the crest, its edge broken by the
              // long marks that lie along the crests. The troughs keep none: between its lit backs the sea is dark
              // (soft, and one colour: laid in flat steps with a violet edge it read as a sheet of ice lying on the water)
              float toneN = smoothstep(0.12, 0.75, litB * (0.55 + 0.75 * seaLit(ms2, 0.45)));
              rain += uSeaEmber * (wet * toneN * 0.62);
              // and on it the dabs: short strokes of new light lying on every lit back, the larger ones first (seen from the boat they lie level)
              rain += (seaInk(m2, 1.2 - 0.72 * litB * wet, aR) * 0.8 + seaInk(m1, 1.12 - 0.66 * litB * wet, aR) * 0.95) * (0.12 + 0.88 * litB);
              // too far to tell marks apart, the sea is drawn as the eye has it from low down: level dashes that come and go,
              // close together on every crest and few in the troughs (rows of them, crest behind crest), over a thin flat tone
              // that lies on the backs only; and at the last, where the rows close up, one band of light under the horizon,
              // heavier here than there as the rain is. Never a wash: between the dashes the water stays dark
              float heavyHere = 0.45 + 2.2 * seaNoise(p * 0.021 + 9.0) * seaNoise(p.yx * 0.0083 + 3.0);      // (great patches of heavier rain)
              float dnsF = clamp(wet * (0.08 + 0.6 * crest + 0.9 * ridge) * (0.55 + 0.45 * heavyHere) * uGlint.z, 0.0, 0.95);
              vec2 g1 = seaGlints(ang, vec2(0.030, 0.0062), dnsF, 41.0, uSheetTime), g2 = seaGlints(ang + vec2(0.37, 0.0021), vec2(0.019, 0.0042), dnsF * 0.9, 87.0, uSheetTime * 1.13);
              vec2 g3 = seaGlints(ang + vec2(0.71, 0.0013), vec2(0.011, 0.0027), dnsF * 0.8, 131.0, uSheetTime * 1.31);      // (the fine sparkle between them)
              vec2 g0 = seaGlints(ang + vec2(1.13, 0.0037), vec2(0.052, 0.0085), dnsF * 0.7 * (1.0 - smoothstep(30.0, 90.0, dist)), 17.0, uSheetTime * 0.8);      // (and in the middle distance the rings themselves, seen flat: long dashes)
              vec3 dashes = mix(uSeaAqua * 1.25, uSeaCore * 1.5, smoothstep(0.72, 0.95, g1.y) * top) * g1.x + mix(uSeaEmber * 3.2, uSeaAqua * 1.25, smoothstep(0.25, 0.6, g2.y)) * g2.x
                          + mix(uSeaEmber * 3.0, uSeaAqua * 1.1, smoothstep(0.4, 0.8, g3.y)) * g3.x + mix(uSeaAqua * 1.2, uSeaCore * 1.3, smoothstep(0.8, 0.97, g0.y)) * g0.x;
              // the tone on the backs: flat, in two steps, its edge broken by long marks that lie along the crests
              vec3 mf = seaMark(tSeaFleck, vec2(dot(p, sC) * 0.012, dot(p, sD) * 0.045) + 0.83);
              float tone = floor(clamp(crest * (0.55 + 0.9 * seaLit(mf, 0.5)), 0.0, 0.999) * 3.0) * 0.5;
              float heavyK = smoothstep(0.5, 1.6, heavyHere);                                // 0 where the rain is light .. 1 in its heavy patches
              // (and by the way it is seen: under the horizon every patch of heavy rain from here to the sky's edge lies in the same few pixels, one over
              // another, and their sum is a ruled line. So the band is also heavier along one bearing than the next, as far rain is: bright knots, dim
              // stretches, and here and there all but out)
              float bearK = 0.22 + 0.78 * smoothstep(0.3, 0.66, seaNoise(vec2(ang.x * 11.0 + 2.0, 1.5)) * 0.65 + seaNoise(vec2(ang.x * 37.0, 7.5)) * 0.35);
              float band = (1.0 - smoothstep(0.0045, 0.017, ang.y)) * (0.14 + 0.86 * heavyK) * (0.55 + 0.45 * seaLit(mf, 0.45)) * bearK;      // (bright in the heavy patches, all but out between them: a band that is broken along its length, never a ruled bar)
              // (and the body of the lit sea: every mark too small to see adds up to old light, more of it the further off: a field, not a scatter)
              float gatherF = smoothstep(12.0, 140.0, dist);
              vec3 rainFar = dashes * (uGlint.y * mix(1.0, 0.35 + 0.65 * bearK, gatherF)) + mix(uSeaDying * 1.4, uSeaEmber * 2.0, crest) * (wet * 0.42 * tone) + (uSeaAqua * 0.8 + uSeaCore * 0.14) * (wet * band * uGlint.w)
                           + uSeaEmber * (wet * gatherF * mix(1.0, bearK, gatherF) * (0.5 + 0.9 * crest) * (0.35 + 0.9 * heavyK) * 1.25)
                           + (uSeaAqua * 0.75 + uSeaCore * 0.3) * (wet * ridge * uRidge.z * (0.5 + 0.5 * seaLit(mf, 0.4)));
              col += mix(rain, rainFar, far);
            }
            // ---- the foot of the front: eight metres of fire
            if (foot > 0.0) {
              // near: marks of core and aqua, crowded, on dark water (never a carpet of white: at twelve metres a second it
              // crosses the water round the boat in under a second, and a white field that size is a flash)
              // (a crowd of small marks and glitter, few large ones: metre-long dabs of white round the hull were the front's foot as spilt paint)
              float fl = 0.75 * seaLit(m1, 0.45) + 0.5 * seaLit(m2, 0.55) + 1.3 * seaLit(st, 0.38) * tw + 0.6 * seaLit(st2, 0.42) * tw2 + 0.15 * seaLit(m3, 0.6);
              // far off: a ragged line of dashes, thick here and thin there, heavier where the rain is; never a bar
              float heavyF = 0.3 + 0.7 * smoothstep(0.3, 0.7, seaNoise(vec2(frA * 0.03, uSheetTime * 0.04)));
              vec2 gf = seaGlints(ang, vec2(0.016, 0.0036), 0.9 * heavyF, 59.0, uSheetTime * 1.7), gf2 = seaGlints(ang + vec2(0.23, 0.0017), vec2(0.027, 0.005), 0.7 * heavyF, 61.0, uSheetTime * 1.3);
              col += (uSeaCore * 1.0 + uSeaAqua * 0.6) * (foot * mix(min(fl, 1.3), (1.25 * (gf.x + gf2.x) + 0.07 * heavyF) * (0.15 + 1.5 * frN) * smoothstep(0.18, 0.5, frN2 + 0.5 * frN), far));
            }
          }
          col = min(col, vec3(4.0)) * ((1.0 - fogAmount(vFogDist)) * (1.0 - uVeil));
          gl_FragColor = vec4(col, 1.0);
        }`,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = 'sea-sheet'; mesh.frustumCulled = false; mesh.renderOrder = 0;      // after the water (-1), before everything else that is transparent
    const size2 = new THREE.Vector2();
    mesh.onBeforeRender = (renderer, scene, camera) => {       // the grid follows the eye by whole cells, as the water's does
      const c = sh.uCameraPos.value;
      mesh.position.set(Math.round(c.x / g.cell) * g.cell, 0, Math.round(c.z / g.cell) * g.cell); mesh.updateMatrixWorld();
      const skip = engine.pre && renderer.getRenderTarget() === engine.pre ? 1 : 0;      // the light lies ON the water: it is not part of what the water looks down into
      const rt = renderer.getRenderTarget(), hgt = rt ? rt.height : renderer.getDrawingBufferSize(size2).y, pix = 2 / (camera.projectionMatrix.elements[5] * Math.max(1, hgt));
      if (uni.uSkip.value !== skip || uni.uGlint.value.x !== pix) { uni.uSkip.value = skip; uni.uGlint.value.x = pix; mat.uniformsNeedUpdate = true; }
    };
    ctx.add(mesh); ctx.only(mesh, 'direct');
    /** Once a frame (set.js): the well round the hull, and whether the swell is up (only used when the water's own numbers cannot be reached). */
    const update = (boat, swellUp) => {
      if (shares) return;
      own.uSwellOn.value.x = swellUp ? 1 : 0;
      if (boat.tilt) {
        own.uWell.value.set(boat.x, boat.z, -Math.sin(boat.heading), -Math.cos(boat.heading));
        own.uWellB.value.set(boat.tilt.position.y, Math.sin(boat.tilt.rotation.x), Math.sin(boat.tilt.rotation.z), 0);
      }
    };
    return { mesh, uniforms: uni, update };
  };

  /** A stand-in (src/engine/modules.js) that takes the sea's light like everything else here. `rock`: options for the material (rest, top, run, pale). */
  const seaStandIn = (o) => {
    const m = standIn(ctx, o);
    if (!o.emissive) { m.material.dispose(); m.material = rock({ color: o.color || C.basalt, ...(o.rock || {}) }); }
    return m;
  };
  // the gate's inner walls and vault share one set of numbers: the surge climbs further there (and to the roof in its three great swells)
  const gateInner = { value: new THREE.Vector4(0.38, 0.55, 3.6, 1) };

  return { uniforms: U, fleck, extend, rock, surf, sheet, standIn: seaStandIn, gateInner, L: 0, T: -1, state: {} };
}

/** An ellipse as an outline for sea.surf: centre, half axes along (tx, tz) and across it, in the realm's x, z. */
export function ellipseOutline(cx, cz, tx, tz, a, b, n = 36) {
  const pts = [];
  for (let i = 0; i < n; i++) { const t = i / n * Math.PI * 2, u = Math.cos(t) * a, v = Math.sin(t) * b; pts.push([cx + tx * u - tz * v, cz + tz * u + tx * v]); }
  return pts;
}
