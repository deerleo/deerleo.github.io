// The town below: the other hero pieces (stage 2b): the church, the market hall, the theatre front, the fountain.
// Each is one of a kind, modelled in Blender (source-art/models/town/<name>.py -> assets/models/town/<name>.glb) and
// stood here where stage 1's stand-in stood. The stand-ins themselves are in heroes.js (the monument's module): this
// module takes each out once its model is in (the named ones with removeStandIn, the batched ones by where they
// stand), so nothing here edits that file. docs/build/town/2-heroes.md is the log.
//
// Developer switches (address):  &hb=church,hall,theatre,fountain   build only these of mine (default: all)
//                                &hbkeep=1                           leave the stand-ins standing too (to compare sizes)
//                                &hbvane=<degrees>                   hold the weathercock at an angle
//                                &hbmap=0                            without the kit's painted plaster on stone and lead
// and levels, each a number: church  &hblancet (the lancets' light on their stone) &hbglass &hbquarry (metres) &hbhalo &hbnave (the nave lamps' glows)
//                                    &hbcold (how far its stone takes the town's light as light, not colour, above the water)
//                            hall    &hbfilm &hbsquare (the glass film under the water) &hbtop &hbtopfar &hbcover (the lantern's panes above it: their
//                                    light, how much brighter from across the square, how much they hide) &hbcrest &hbcrestfar &hblit &hbiron &hbbar
//                                    &hblamp (halos) &hbfloor (the lamps' pools)
//                            theatre &hbport (its whole light) &hbp=lamp,cool,water,pale,lampHeight,waterHeight,soffit,tileOverhead (metres),climb (m/s)  &hbpw=rrggbb (the water-light where two bands cross)
//                                    &hbpn=floor,gain,focus,tile (the weave of the water-light: its floor, its gain, how far out of focus, metres to a tile)
//                                    &hbpr=rrggbb,rrggbb (under the roof: the lamps' light; the water-light's bloom)
//                            fountain  &hbfountain (its light) &hbfountainglow (the glow in the water round it)
import * as THREE from 'three';
import { removeStandIn } from '../../engine/modules.js';
import { ensureLight } from './light.js';

const Q = new URLSearchParams(typeof location !== 'undefined' ? location.search : '');
const PICK = (Q.get('hb') || '').split(',').map((v) => v.trim()).filter(Boolean);
const want = (name) => !PICK.length || PICK.includes(name);
const KEEP = Q.has('hbkeep');
const num = (k, d) => (Q.has(k) && Q.get(k) !== '' && !Number.isNaN(+Q.get(k)) ? +Q.get(k) : d);

/** A window's own clock for the town's waking function (rnd, stay): the same numbers the shaders work out from its number. */
const WINDOW_CLOCK = (win) => ({ rnd: (win * 0.618034) % 1, stay: (win * 0.754877) % 1 > 0.78 ? 1 : 0 });

/**
 * Leaded lights: the glass of the church (and anything else that carries the slot 'glass'). The model gives each
 * window its tone as vertex colour and its UVs in METRES (across from the window's middle, up from its sill, plus 8
 * for every window, so that each has a number); this draws the quarries: diamonds of hand-made glass, each its own
 * colour and brightness, brighter at its middle, in dark lead. Far off the leading becomes a tone, never a moire.
 * A window wakes and sleeps with the town, each on its own clock (the town's waking function). Window 0 is plain
 * light with no leading (the lit inside of a room seen through an opening).
 */
function leadedLights(o = {}) {
  const col = (c) => new THREE.Color(c);
  return {
    uniforms: {
      uHbLead: { value: new THREE.Vector4(o.w ?? 0.2, o.h ?? 0.3, o.came ?? 0.016, o.gain ?? 1.2) },
      // (second pass: amber and orange, an ember for the deep quarries, and for the jade windows a deep bottle jade with a
      // pale jade, never turquoise: the director keeps turquoise for the glass ridge alone)
      uHbRose: { value: col(o.warm ?? '#F08C44') }, uHbOld: { value: col(o.deep ?? '#D4502A') }, uHbJade: { value: col(o.jade ?? '#2F8C68') }, uHbTurq: { value: col(o.paleJade ?? '#7FCDA6') }, uHbPale: { value: col(o.pale ?? '#FFC07A') },
      uHbOther: { value: o.other ?? 0.035 },
    },
    fragmentPars: /* glsl */`
      uniform vec4 uHbLead; uniform vec3 uHbRose, uHbOld, uHbJade, uHbTurq, uHbPale; uniform float uHbOther;
      float hbHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }`,
    light: /* glsl */`{
      float win = floor(vUv0.x / 8.0 + 0.5);
      vec2 q = vec2(vUv0.x - win * 8.0, vUv0.y);
      vec4 hg = townGlow(vWPos.xz);
      float lv = townWake(townS(hg), vWPos.xz, fract(win * 0.618034), step(0.78, fract(win * 0.754877)));          // (each window's own clock: WINDOW_CLOCK below is the same in script)
      vec3 paint = vColor.rgb * (1.0 + stroke * 0.16 * uBrush);                         // the model's own paint (the area's material re-hues albedo under water: light must not go through that)
      bool warm = paint.r > paint.g * 1.15;
      float lum = dot(paint, vec3(0.4, 0.4, 0.2));
      vec3 tone = warm ? uHbRose * (lum / 0.42) : uHbJade * (lum / 0.29 * 0.5);      // the window's own tone (the model's paint says warm or jade, and how bright; a jade window is the dimmer: the amber ones burn)
      float pat = 0.36;
      if (win > 0.5) {
        vec2 g = q / uHbLead.xy, dg = vec2(g.x + g.y, g.x - g.y), id = floor(dg), f = fract(dg);
        float edge = min(min(f.x, 1.0 - f.x), min(f.y, 1.0 - f.y));                    // 0 on the lead .. 0.5 in the middle of a quarry
        float fw = max(fwidth(dg.x), fwidth(dg.y)), wc = uHbLead.z / uHbLead.x * 1.3;
        float came = smoothstep(wc - fw * 0.8, wc + fw * 0.8, edge);
        float h = hbHash(id + win * 17.3), h2 = hbHash(id * 1.31 + win * 5.7 + 2.0);
        // (second look: ONE glass a window, a tone apart quarry by quarry, a deeper and a paler one here and there and now and
        // then a quarry of old dark glass, ruby in an amber window and bottle in a jade one. Stray quarries of the other family,
        // green in amber and orange in jade, with every quarry a quarter brighter or darker than the next, were a harlequin.)
        vec3 deep = warm ? uHbOld : uHbJade * 0.62, pale = warm ? uHbPale : uHbTurq, dark = warm ? uHbOld * 0.34 : uHbJade * 0.3;
        vec3 one = h < uHbOther ? dark : h < 0.27 ? mix(tone, deep, 0.55) : h > 0.92 ? mix(tone, pale, 0.6) : tone;
        float near = came * (0.84 + 0.28 * h2) * (0.8 + 0.36 * smoothstep(0.0, 0.5, edge));
        float far = smoothstep(0.25, 0.7, fw), cover = (1.0 - 2.0 * wc) * (1.0 - 2.0 * wc);
        tone = mix(one, mix(tone, deep, 0.16), far);
        pat = mix(near, cover * 0.94, far);
        // a lamp burns somewhere low behind the glass: the window is brightest a little above its sill and falls away to its head and its jambs
        pat *= 0.6 + 0.62 * exp(-(q.x * q.x * 1.5 + (q.y - 0.85) * (q.y - 0.85) * 0.42));
      }
      c *= 0.1;
      glow += tone * (pat * uHbLead.w * smoothstep(0.0, 0.3, lv) * (0.3 + 0.7 * min(lv, 1.5)));
    }`,
  };
}

/**
 * The light the church's lancets throw on what stands round them: on their own sills and gables, on the lead of the
 * aisle roofs under them, on the slates either side. Worked out in the church's own frame (the lancets stand every
 * 3.2 m), so that all sixteen shine at once and each goes to sleep with its own window (the same clock as its glass).
 * frame: { x, z, yaw } of the model. Goes after light.extend and leadedLights' pars are not needed (it brings its own).
 */
function lancetLight(frame, gain = 1.0) {
  const col = (c) => new THREE.Color(c);
  return {
    uniforms: { uHbChurch: { value: new THREE.Vector4(frame.x, frame.z, Math.cos(frame.yaw), Math.sin(frame.yaw)) }, uHbLancet: { value: gain }, uHbRoseL: { value: col('#F28C4A') }, uHbJadeL: { value: col('#3C9C82') } },
    fragmentPars: /* glsl */`
      uniform vec4 uHbChurch; uniform float uHbLancet; uniform vec3 uHbRoseL, uHbJadeL;`,
    light: /* glsl */`if (vWPos.y < 0.0 && vWPos.y > -9.0) {
      vec2 rel = vWPos.xz - uHbChurch.xy;
      vec3 lp = vec3(rel.x * uHbChurch.z - rel.y * uHbChurch.w, vWPos.y, rel.x * uHbChurch.w + rel.y * uHbChurch.z);      // down the nave, up, to the route's right
      vec3 ln = vec3(N.x * uHbChurch.z - N.z * uHbChurch.w, N.y, N.x * uHbChurch.w + N.z * uHbChurch.z);
      float li = clamp(floor((lp.x + 11.2) / 3.2 + 0.5), 0.0, 7.0), lside = lp.z > 0.0 ? 1.0 : -1.0;
      vec3 ld = vec3(-11.2 + 3.2 * li, -2.45, lside * 3.5) - lp; float ldist = length(ld);
      float latt = 1.0 - smoothstep(0.25, 3.1, ldist); latt *= latt;
      float lwin = li + (lside > 0.0 ? 8.0 : 0.0) + 1.0;
      float llv = townWake(townS(townGlow(vWPos.xz)), vWPos.xz, fract(lwin * 0.618034), step(0.78, fract(lwin * 0.754877)));
      vec3 ltone = mod(li, 3.0) > 1.5 ? uHbJadeL : uHbRoseL;
      c += mix(albedo, vColor.rgb, 0.65) * ltone * (latt * max(dot(ln, ld / max(ldist, 1e-3)) * 0.6 + 0.4, 0.0) * uHbLancet * smoothstep(0.0, 0.3, llv) * min(llv, 1.5));      // (mostly on the model's own paint: the area's material has already turned albedo to the water's hue, and amber on teal is mud)
    }`,
  };
}

/**
 * Stone and lead above the water, in the town's light from below. The area's light there is a coral, and on violet-grey
 * paint it is salmon: right for brick and warm plaster, but the church's gable heads stood as two pink pyramids at the
 * ends of a plum roof, and its lead was brown. This takes the town's light on a thing as light and less as colour:
 * above the water what the area's material gives is drawn part of the way to the grey-lilac of cold stone (the bow
 * lantern's own light is left as it is). k: how far (0..1). Goes after light.extend.
 */
function coldStone(k = 0.5, tint = [1.04, 0.9, 1.16], ends = null) {
  // (sixth look) ends: { frame, from, k }: beyond `from` metres along the model's own length the share is k instead. The
  // church's lead and its stone are one slot; in the area's light since 01:40 (the light from below is short, and what
  // faces up takes a quarter) the gable heads want almost none of this (cold, they were the palest things of the church,
  // with the water-light on them turned to white wisps), and the lead wants all of it (without, it is brown).
  const at = ends ? new THREE.Vector4(ends.frame.x, ends.frame.z, Math.cos(ends.frame.yaw), Math.sin(ends.frame.yaw)) : new THREE.Vector4(0, 0, 1, 0);
  return { uniforms: { uHbCold: { value: new THREE.Vector4(tint[0], tint[1], tint[2], k) }, uHbColdAt: { value: at }, uHbColdEnds: { value: new THREE.Vector2(ends ? ends.from : -1, ends ? ends.k : k) } },
    fragmentPars: /* glsl */`uniform vec4 uHbCold, uHbColdAt; uniform vec2 uHbColdEnds;`,
    light: /* glsl */`{ vec3 ckeep = albedo * pointLight(uLanternPos, uLanternColor, uLanternRadius, N); vec3 cc = c - ckeep;
      float ck = uHbCold.w;
      if (uHbColdEnds.x > 0.0) { vec2 crel = vWPos.xz - uHbColdAt.xy; ck = mix(ck, uHbColdEnds.y, smoothstep(uHbColdEnds.x - 0.12, uHbColdEnds.x + 0.12, abs(crel.x * uHbColdAt.z - crel.y * uHbColdAt.w))); }
      c = ckeep + mix(cc, dot(cc, vec3(0.3, 0.5, 0.2)) * uHbCold.rgb, ck * smoothstep(-0.04, 0.04, vWPos.y)); }` };
}

/**
 * A slate's own face (sixth look). The church's slates are each their own piece, with four points of paint: dark at the
 * head, pale at the tail, and nothing between: at arm's length a field of flat cards, and from the hands-off line
 * courses that would not part (a lap is a centimetre of shadow, thinner than the painter's brush). The models now say,
 * in the paint's fourth channel, how far down its own length each point of a slate lies (0 at its head, under the tail
 * of the course above; 1 at its tail: hb_lib.py, Soup.put_alpha). With that the ride lays on every slate
 *   - the shade and the damp of the course above on its head (what makes a course read, above the water and through it),
 *   - a worn line along its tail,
 * and, within a few metres of the eye (o.near), what a slate is when it is looked at: clouds of tone a hand across,
 * lichen in flat round crusts a thumb to a palm wide, in colonies, paler than the slate; moss dark in the laps where
 * the water reaches. o.lap, o.tail: how strong the first two are. Goes after light.extend.
 */
function slateFace(o = {}) {
  return {
    uniforms: { uHbSlate: { value: new THREE.Vector4(o.lap ?? 0.5, o.tail ?? 0.14, o.near ?? 0, o.lichen ?? 0.6) } },
    fragmentPars: /* glsl */`uniform vec4 uHbSlate;
      float hbSlHash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
      float hbSlNoise(vec3 x) { vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(mix(hbSlHash(i), hbSlHash(i + vec3(1.0, 0.0, 0.0)), f.x), mix(hbSlHash(i + vec3(0.0, 1.0, 0.0)), hbSlHash(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
                   mix(mix(hbSlHash(i + vec3(0.0, 0.0, 1.0)), hbSlHash(i + vec3(1.0, 0.0, 1.0)), f.x), mix(hbSlHash(i + vec3(0.0, 1.0, 1.0)), hbSlHash(i + vec3(1.0, 1.0, 1.0)), f.x), f.y), f.z); }
      vec2 hbSlH2(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973)); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.xx + p3.yz) * p3.zy); }`,
    albedo: /* glsl */`
      #ifdef USE_COLOR_ALPHA
      { float sa = vColor.a, sd = length(vViewPos), sfar = 1.0 - smoothstep(30.0, 70.0, sd);      // (far off a slate is a pixel or two: the laps close up into the roof's own tone)
        // the shade of the course above: hard under its tail, gone a hand further down; and the slate's own worn tail
        albedo *= (1.0 - uHbSlate.x * (0.75 * (1.0 - smoothstep(0.03, 0.13, sa)) + 0.25 * (1.0 - smoothstep(0.05, 0.4, sa))) * sfar) * (1.0 + uHbSlate.y * smoothstep(0.88, 0.98, sa) * sfar);
        float snear = (1.0 - smoothstep(5.0, 14.0, sd)) * uHbSlate.z;
        if (snear > 0.0 && vWPos.y > -0.5 && N.y > 0.2 && N.y < 0.95) {
          vec3 sdn = normalize(vec3(N.x * N.y, N.y * N.y - 1.0, N.z * N.y)), sac = normalize(cross(N, sdn));      // down the slope; across it
          vec2 sq = vec2(dot(vWPos, sac), dot(vWPos, sdn));
          // the riven face: a cloud of tone a hand across, and the grain of the cleft running down the slope
          float sgr = hbSlNoise(vec3(sq.x * 46.0, sq.y * 6.0, 1.7)) - 0.5;
          albedo *= 1.0 + (0.26 * (hbSlNoise(vWPos * 6.0 + 3.1) - 0.5) + 0.18 * sgr) * snear;
          // lichen: flat grey crusts with ragged edges, a thumb to a palm across, in colonies a metre or two apart (drawn as
          // round crusts with a pale rim they were polka dots: the one cute thing on the roof)
          float lcol = smoothstep(0.50, 0.74, hbSlNoise(vWPos * 0.9 + 21.0));
          float ln = hbSlNoise(vWPos * 13.0 + 5.0) + 0.45 * (hbSlNoise(vWPos * 41.0 + 9.0) - 0.5);
          float ll = smoothstep(0.66, 0.72, ln) * lcol * smoothstep(0.25, 0.5, vWPos.y) * smoothstep(0.1, 0.3, sa);
          albedo = mix(albedo, albedo * 0.55 + vec3(0.062, 0.068, 0.072), ll * uHbSlate.w * snear);
          // moss, dark, in the laps of the courses the wake wets
          float smoss = (1.0 - smoothstep(0.0, 0.3, sa)) * smoothstep(0.42, 0.66, hbSlNoise(vec3(sq.x * 2.3, sq.y * 0.7, 9.0))) * (1.0 - smoothstep(0.25, 0.95, vWPos.y));
          albedo = mix(albedo, vec3(0.016, 0.040, 0.030), smoss * 0.7 * snear);
        }
      }
      #endif`,
  };
}

/**
 * The water's mark on what stands in it (third look), drawn by where a thing is, so that it is exact at the surface and
 * crosses from one slate or stone to the next without a seam: the page's "dark wet band 15 cm high, a thread of jade
 * weed and a paler tide line at y 0.6", and a film of algae on everything from the first centimetre down. (It was
 * painted on the models' points, which on a slate roof are a course apart and on a coping a whole stone apart: on the
 * church's ridge strip, five metres from the eye, there was no mark at all.) The same marks, by the same rules, as the
 * kit's roofs along the street wear (kit_roofs.js), so that the church's roof and the roofs beside it are one water's.
 * It also takes over the line of light where the water meets the thing (the area draws it by height alone, and on a
 * roof's slope that is a cord laid along the slates): here it is as wide on the surface on a slope as on a wall, and
 * on what slopes into the water it comes and goes along its length as the water breathes.
 * o.mark: how plainly the tide mark's own line shows (stone 1, slate and lead about 0.5); o.weed: how much weed.
 * o.weather (0 by default): what weather does to dressed stone, drawn by place as the kit's masonry wears it: the rain's
 * dark runs down every upright face, slow blooms a metre across, the damp that stands in a wall's first metre over the
 * water (green where it stays), hair cracks. A column passed at arm's length was an airbrushed cylinder without it.
 * o.slate (0 by default; fourth look): what a slate is at arm's length, for the church's ridge strip, which the hull can
 * come within a metre and a half of: its riven grain, fine streaks down the slope, and lichen in dots, in colonies; both
 * melt away between four and eleven metres. A slate was one flat tone from edge to edge: a model's.
 * Goes after light.extend (it reads the area's gTown).
 */
function waterMark(o = {}) {
  const col = (c) => new THREE.Color(c);
  return {
    defines: { TOWN_AFLOAT: '' },
    uniforms: { uHbWmWet: { value: col(o.wetColor ?? '#8a7a86') }, uHbWmTide: { value: col(o.tideColor ?? '#c9c2cf') }, uHbWmWeed: { value: col(o.weedColor ?? '#33705c') },
      uHbWm: { value: new THREE.Vector4(o.height ?? 0.6, o.mark ?? 1, o.line ?? 0.8, o.weed ?? 0.7) }, uHbWmWeather: { value: o.weather ?? 0 }, uHbWmSlate: { value: o.slate ?? 0 } },
    fragmentPars: /* glsl */`uniform vec3 uHbWmWet, uHbWmTide, uHbWmWeed; uniform vec4 uHbWm; uniform float uHbWmWeather, uHbWmSlate;
      float hbWmHash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
      float hbWmNoise(vec3 x) { vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(mix(hbWmHash(i), hbWmHash(i + vec3(1.0, 0.0, 0.0)), f.x), mix(hbWmHash(i + vec3(0.0, 1.0, 0.0)), hbWmHash(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
                   mix(mix(hbWmHash(i + vec3(0.0, 0.0, 1.0)), hbWmHash(i + vec3(1.0, 0.0, 1.0)), f.x), mix(hbWmHash(i + vec3(0.0, 1.0, 1.0)), hbWmHash(i + vec3(1.0, 1.0, 1.0)), f.x), f.y), f.z); }`,
    albedo: /* glsl */`{
      float wy = vWPos.y;
      if (uHbWmSlate > 0.0 && wy > -0.6) {
        float snear = (1.0 - smoothstep(4.0, 11.0, length(vViewPos))) * uHbWmSlate;
        if (snear > 0.0 && N.y > 0.2 && N.y < 0.95) {
          vec3 sdn = normalize(vec3(N.x * N.y, N.y * N.y - 1.0, N.z * N.y)), sac = normalize(cross(N, sdn));      // down the slope; across it
          float su = dot(vWPos, sac), sv = dot(vWPos, sdn);
          float sgrain = hbWmNoise(vec3(su * 34.0, sv * 5.0, 1.7)) - 0.5 + 0.6 * (hbWmNoise(vec3(su * 9.0, sv * 2.2, 5.3)) - 0.5);
          albedo *= 1.0 + 0.30 * sgrain * snear;
          float scol = smoothstep(0.56, 0.76, hbWmNoise(vWPos * 1.7 + 7.0)), sdot = smoothstep(0.80, 0.86, hbWmNoise(vWPos * 37.0 + 3.0));
          albedo = mix(albedo, albedo * 0.45 + vec3(0.055, 0.062, 0.070) * (0.7 + 0.6 * hbWmNoise(vWPos * 5.0)), sdot * scol * 0.55 * snear * smoothstep(0.1, 0.3, wy));      // (lichen: grey crusts a tone paler than the slate; olive, they were spatter)
        }
      }
      if (uHbWmWeather > 0.0 && wy > 0.0) {
        float xwall = 1.0 - smoothstep(0.35, 0.75, abs(N.y)), xn = hbWmNoise(vWPos * vec3(1.3, 0.5, 1.3));
        float xrun = smoothstep(0.50, 0.80, hbWmNoise(vec3(vWPos.x * 9.0, vWPos.y * 0.5, vWPos.z * 9.0) + 3.0));
        float xbloom = hbWmNoise(vWPos * vec3(0.9, 0.7, 0.9) + 11.0);
        float xdamp = 1.0 - smoothstep(0.08, 0.7 + 0.7 * xn, wy);
        float xcr = abs(hbWmNoise(vWPos * vec3(3.1, 1.6, 3.1) + 23.0) - 0.5), xcrack = (1.0 - smoothstep(0.0015, 0.0055, xcr)) * smoothstep(0.52, 0.7, hbWmNoise(vWPos * 1.3 + 41.0)) * step(0.05, wy);
        float xw = uHbWmWeather * xwall;
        albedo *= (1.0 - 0.42 * xrun * xw) * (1.0 - 0.30 * xdamp * xw) * mix(1.0, 0.72 + 0.44 * xbloom, uHbWmWeather) * (1.0 - 0.45 * xcrack * xw);
        albedo = mix(albedo, albedo * vec3(0.78, 0.98, 0.84), 0.5 * xdamp * xw * smoothstep(0.45, 0.7, xbloom));
      }
      if (wy < 1.2 && wy > -3.0) {
        float wn = hbWmNoise(vWPos * vec3(1.3, 0.5, 1.3)), wf = hbWmNoise(vWPos * 7.0 + 3.0);
        vec2 wuv = (vWPos.xz - uRippleRect.xy) / uRippleRect.zw + 0.5, we = min(wuv, 1.0 - wuv);
        float wrip = min(we.x, we.y) > 0.0 ? clamp(texture2D(tRipple, wuv).a * 4.0, 0.0, 1.0) * smoothstep(0.0, 0.08, min(we.x, we.y)) : 0.0;
        // the wet band: dark from the surface to a hand and a half above it, higher where the wake laps
        float wwet = 0.13 + 0.06 * (wn - 0.5) + 0.07 * wrip;
        float wband = (1.0 - smoothstep(wwet * 0.6, wwet, wy)) * step(-0.02, wy);
        albedo *= mix(vec3(1.0), uHbWmWet, wband * 0.8);
        // the tide mark at 0.6 m: scoured a little paler below it; on the mark itself the lime the water left, a band two
        // fingers deep, hard along its top and dying downward, broken wherever the surface is rough
        float wtide = uHbWm.x + 0.09 * (wn - 0.5) + 0.02 * (wf - 0.5);
        float wscour = (1.0 - smoothstep(wtide - 0.04, wtide, wy)) * smoothstep(wwet, wwet + 0.12, wy);
        albedo = mix(albedo, albedo * 1.07 + uHbWmTide * 0.04, wscour * 0.5);
        float wbrk = hbWmNoise(vWPos * vec3(9.0, 3.0, 9.0) + 11.0);
        float wmark = smoothstep(wtide - 0.055, wtide - 0.008, wy) * (1.0 - smoothstep(wtide - 0.004, wtide + 0.005, wy)) * smoothstep(0.30, 0.62, wbrk * 0.65 + wf * 0.5);
        albedo = mix(albedo, albedo * 0.55 + uHbWmTide * 0.45, wmark * 0.6 * uHbWm.y);
        // a thread of jade weed on the line itself, broken (as broad ON the surface it grows on, on a slope as on a wall)
        float wslope = clamp(sqrt(max(0.0, 1.0 - N.y * N.y)), 0.3, 1.0);
        float wweed = (1.0 - smoothstep(0.0, (0.035 + 0.035 * wf) * wslope, abs(wy + 0.012 * wslope))) * smoothstep(0.30, 0.55, wn + 0.3 * wf);
        albedo = mix(albedo, uHbWmWeed * (0.7 + 0.5 * wf), wweed * uHbWm.w);
        // under the surface: a film of algae from the first centimetre
        albedo = mix(albedo, albedo * vec3(0.80, 0.97, 0.92), (1.0 - smoothstep(-0.07, -0.01, wy)) * 0.6);
      }
    }`,
    light: /* glsl */`{
      float wd = length(vViewPos), ww0 = max(0.008, 0.0013 * wd), wlw = ww0 * clamp(sqrt(max(0.0, 1.0 - N.y * N.y)), 0.3, 1.0);
      float wln = (1.0 - smoothstep(wlw * 0.5, wlw * 1.5, abs(vWPos.y - wlw * 0.5))) * min(1.0, 0.008 / ww0 + 0.3) * (1.0 - smoothstep(60.0, 120.0, wd));
      wln *= mix(1.0, 0.06 + 0.66 * smoothstep(0.46, 0.72, hbWmNoise(vec3(vWPos.x * 2.6, uTime * 0.18, vWPos.z * 2.6))), smoothstep(0.15, 0.5, N.y));
      vec3 wfrom = mix(uTownUnderCol, uTownJade, clamp(gTown.g * 1.4, 0.0, 1.0));
      c += mix(uTownLine, wfrom, 0.55 * min(gTownL * 1.3, 1.0)) * (wln * uTownSurf.w * (0.55 + 0.45 * mix(uTownUnder.y, 1.0, min(gTownL * 1.5, 1.0))) * uHbWm.z);
    }`,
  };
}

/**
 * Coursed stone, drawn: a joint round every block and a tone of its own for each, on faces that stand upright. Courses
 * are level; the blocks of each course are set out along the wall whichever way it runs (worked out in the model's
 * own frame), each course with blocks of its own length and its own start, so that joints break. A joint is never
 * drawn thinner than the screen can hold: far off it is drawn wider and fainter, and then not at all.
 * frame: { x, z, yaw } of the model. o: course, block (metres), joint (metres), depth (how dark a joint is, 0..1),
 * vary (how far one block's tone is from the next's), top (no courses above this height), arches: up to five rings
 * of modelled voussoirs that keep their own joints: [[metres along the wall, springing height, inner radius, outer radius], ...].
 */
function ashlar(frame, o = {}) {
  const rings = Array.from({ length: 5 }, (_, i) => new THREE.Vector4(...((o.arches || [])[i] || [0, 0, 0, 0])));
  return {
    uniforms: { uHbAshFrame: { value: new THREE.Vector4(frame.x, frame.z, Math.cos(frame.yaw), Math.sin(frame.yaw)) }, uHbAsh: { value: new THREE.Vector4(o.course ?? 0.3, o.block ?? 0.62, o.joint ?? 0.012, o.depth ?? 0.45) },
      uHbAshVary: { value: new THREE.Vector2(o.vary ?? 0.1, o.top ?? 1e4) }, uHbAshRing: { value: rings } },
    fragmentPars: /* glsl */`
      uniform vec4 uHbAshFrame, uHbAsh; uniform vec2 uHbAshVary; uniform vec4 uHbAshRing[5];
      float hbAshHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }`,
    albedo: /* glsl */`{
      float aup = (1.0 - smoothstep(0.35, 0.6, abs(N.y))) * (1.0 - step(uHbAshVary.y, vWPos.y));
      if (aup > 0.0) {
        vec2 arel = vWPos.xz - uHbAshFrame.xy;
        vec3 alp = vec3(arel.x * uHbAshFrame.z - arel.y * uHbAshFrame.w, vWPos.y, arel.x * uHbAshFrame.w + arel.y * uHbAshFrame.z);
        float anx = N.x * uHbAshFrame.z - N.z * uHbAshFrame.w, anz = N.x * uHbAshFrame.w + N.z * uHbAshFrame.z;
        float au = abs(anx) > abs(anz) ? alp.z : alp.x;                               // metres along the wall
        for (int ai = 0; ai < 5; ai++) { vec2 aq = vec2(au - uHbAshRing[ai].x, alp.y - uHbAshRing[ai].y); float ar = length(aq);
          if (aq.y > -0.05 && ar > uHbAshRing[ai].z && ar < uHbAshRing[ai].w) aup = 0.0; }
        float arow = floor(alp.y / uHbAsh.x), afy = fract(alp.y / uHbAsh.x);
        float ablk = uHbAsh.y * (0.8 + 0.5 * hbAshHash(vec2(arow, 3.0)));
        float ax = au / ablk + hbAshHash(vec2(arow, 7.0)), acol = floor(ax), afx = fract(ax);
        float adist = length(vViewPos), ajw = max(uHbAsh.z, 0.0014 * adist);
        float ajd = min(min(afy, 1.0 - afy) * uHbAsh.x, min(afx, 1.0 - afx) * ablk);
        float aj = (1.0 - smoothstep(ajw * 0.5, ajw * 1.25, ajd)) * min(1.0, uHbAsh.z / ajw * 1.6);
        float atone = hbAshHash(vec2(arow * 13.0 + acol, acol * 7.0 + 1.0));
        albedo *= mix(1.0, (1.0 + (atone - 0.5) * 2.0 * uHbAshVary.x) * (1.0 - uHbAsh.w * aj), aup);
      }
    }`,
  };
}

/**
 * Glass that is looked through: a film of light, never a wall. The market hall's roof slopes and its lantern's panes
 * are sheets that ADD their own glow (jade at the eaves, turquoise by the ridge: the model's paint) over what is seen
 * through them: the trusses, the lamps, the stalls, the floor. A sheet shows more of its own light at a glancing angle
 * than square on, as dirty glass does. Where the model's UV.y is under 50 the sheet is a whole roof slope, and the
 * panes are drawn here (UVs in metres: along the hall, up from the eaves): each pane its own brightness, a few gone,
 * a darker line at every lap. It wakes and sleeps with the town. Under the water it fails with the water it is seen
 * through (waterFade: the realm keeps it in step with the area's water).
 * The material that wears this is additive: it sets the whole of gl_FragColor itself.
 */
function glassFilm(light, o = {}) {
  const u = { ...light.U, uHbFilm: { value: new THREE.Vector4(o.gain ?? 0.6, o.s ?? 176, o.under ? 1 : 0, 0.02) }, uHbPane: { value: new THREE.Vector2(o.paneW ?? 0.6027, o.paneH ?? 1.4) }, uHbFilmSq: { value: o.square ?? 0.4 } };
  return {
    uniforms: u, waterFade(k) { u.uHbFilm.value.w = k; },
    fragmentPars: light.GLSL + /* glsl */`
      uniform vec4 uHbFilm; uniform vec2 uHbPane; uniform float uHbFilmSq; vec3 hbFilm;
      float hbHashF(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }`,
    light: /* glsl */`{
      float flv = townWake(uHbFilm.y, vWPos.xz, -1.0, 0.6);
      float fk = 1.0;
      if (vUv0.y < 50.0) {
        vec2 fg = vUv0 / uHbPane, fid = floor(fg), ff = fract(fg);
        float fh = hbHashF(fid), fh2 = hbHashF(fid + 31.7);
        float ffw = fwidth(fg.y);
        float lap = mix(smoothstep(0.0, 0.06 + ffw, ff.y), 0.94, smoothstep(0.2, 0.6, ffw));          // the lap of one pane over the next
        float cloud = 0.75 + 0.25 * sin(vUv0.x * 0.9 + sin(vUv0.y * 0.7) * 1.7) * sin(vUv0.y * 0.53 + 1.3);
        fk = (0.5 + 0.5 * fh) * (1.0 - step(0.972, fh2)) * mix(0.5, 1.0, lap) * cloud;
      }
      float fgraze = 1.0 - abs(dot(N, V));
      fk *= uHbFilmSq + 1.1 * fgraze * fgraze;                 // (second pass: looked through squarely a pane adds almost nothing, so that the hall is seen through it; it is at a glancing angle that glass is a sheet of light)
      hbFilm = albedo * (fk * uHbFilm.x * flv);
    }`,
    final: /* glsl */`{
      float fwf = 1.0;
      if (uHbFilm.z > 0.5) { float fD = max(-vWPos.y, 0.0); fwf = exp(-uHbFilm.w * length(vViewPos) * fD / (max(uCameraPos.y, 0.05) + fD)); }
      gl_FragColor = vec4(hbFilm * ((1.0 - fog) * fwf), 1.0);
    }`,
  };
}

/**
 * The lantern's panes above the water (the model's slot 'glass_top'): lit glass at the gunwale. (Second look: as an
 * additive film these could hardly be seen from alongside, where a pane is looked at almost squarely, and "the one
 * turquoise light of the area" was the thin crest line alone.) Each pane is a sheet of old glass lit from within:
 * it gives off its own jade and turquoise (the model's paint: turquoise under the ridge, jade at the water, every
 * pane its own brightness) and it HIDES part of what is behind it, most where grime and weed have taken it (clouds a
 * hand to a forearm across, thickest toward its foot at the water), least under the ridge. So the near slope reads as
 * glass, pane by pane between its bars, with the far slope and the hall dimly through it, and a missing pane is a
 * hole. Far off it is brighter (it must be the brightest thing at the waterline from across the square, and must not
 * white the picture out from alongside). The material that wears this is blended with premultiplied alpha: it sets the
 * whole of gl_FragColor itself. It wakes and sleeps with the hall.
 */
function lanternGlass(light, o = {}) {
  return {
    uniforms: { ...light.U, uHbTop: { value: new THREE.Vector4(o.gain ?? 0.5, o.s ?? 176, o.far ?? 2.2, o.cover ?? 0.6) }, uHbTop2: { value: new THREE.Vector2(o.tide ?? 1, o.sheets ?? 1) },
      uHbTopAt: { value: o.frame ? new THREE.Vector4(o.frame.x, o.frame.z, Math.cos(o.frame.yaw), Math.sin(o.frame.yaw)) : new THREE.Vector4(0, 0, 1, 0) }, uTownLineT: light.U.uTownLine },
    fragmentPars: light.GLSL + /* glsl */`
      uniform vec4 uHbTop, uHbTopAt; uniform vec2 uHbTop2; uniform vec3 uTownLineT; vec4 hbTop;
      float hbHashT(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float hbNoiseT(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(hbHashT(i), hbHashT(i + vec2(1.0, 0.0)), f.x), mix(hbHashT(i + vec2(0.0, 1.0)), hbHashT(i + vec2(1.0, 1.0)), f.x), f.y); }`,
    light: /* glsl */`{
      float tlv = townWake(uHbTop.y, vWPos.xz, -1.0, 0.6);
      float tg = hbNoiseT(vWPos.xz * 3.3 + vWPos.y * 2.0) * 0.6 + hbNoiseT(vWPos.xz * 10.0 + 7.3) * 0.4;       // grime, in clouds
      float tfoot = 1.0 - smoothstep(0.0, 0.7, vWPos.y);                                                    // 1 at the water .. 0 under the ridge
      float tdirt = clamp(0.2 + 0.55 * tg + 0.4 * tfoot, 0.0, 1.0);
      float tgraze = 1.0 - abs(dot(N, V)), tdist = length(vViewPos);
      float tfar = mix(1.0, uHbTop.z, smoothstep(7.0, 28.0, tdist));
      vec3 tcol = albedo * (uHbTop.x * (0.25 + 0.75 * tlv) * tfar * (0.5 + 0.85 * tg) * (0.8 + 0.7 * tgraze * tgraze));
      tcol = mix(tcol, dot(tcol, vec3(0.3, 0.5, 0.2)) * vec3(0.62, 1.0, 0.72), 0.5 * tdirt * tfoot);          // (weed has taken the foot of every pane: greener and duller there)
      float talpha = uHbTop.w * (0.4 + 0.95 * tdirt);
      // (fifth look) A PANE IS THREE SHEETS OF GLASS, LAPPED LIKE SLATES, as a glasshouse is glazed: each its own
      // tint; at every lap a line of old dirt held under the upper sheet's edge, and that edge itself bright (the
      // edge of lit glass shines). Down each pane the runs of the years, in streaks. And the hall's lamps hang
      // every 4.4 m under the ridge: the bar of light is brighter over each, by a breath. (At the gunwale a pane
      // was one flat milky sheet between two straps: a diagram of a roof.) The laps melt away between 9 and 22 m.
      { vec2 trel = vWPos.xz - uHbTopAt.xy; float thx = trel.x * uHbTopAt.z - trel.y * uHbTopAt.w;                 // metres along the hall
        float tbay = floor((thx + 22.0) / 0.6027), tq = (0.9 - vWPos.y) / 0.672;                                  // which pane; metres down its slope from the ridge
        float tlq = (tq + 0.16 * hbHashT(vec2(tbay, 3.0))) / 0.47, tsheet = floor(tlq), tlf = fract(tlq);
        float tnear = (1.0 - smoothstep(9.0, 22.0, tdist)) * uHbTop2.y;
        float tone = 0.8 + 0.4 * hbHashT(vec2(tbay * 1.7 + 0.3, tsheet + 5.0));                                    // each sheet its own glass
        float tw = max(0.016, 0.0032 * tdist) / 0.47;
        float tgrime = (1.0 - smoothstep(tw * 0.6, tw * 2.4, tlf)) * step(0.5, tsheet);                           // the dirt under a lap
        float tedge = smoothstep(1.0 - tw * 1.2, 1.0 - tw * 0.3, tlf);                                              // the upper sheet's lower edge
        float trun = hbNoiseT(vec2(thx * 17.0, tq * 1.1 + tbay * 0.37));                                           // runs down the glass
        float tlampk = 0.9 + 0.18 * cos(thx * 6.2832 / 4.4);
        tcol *= mix(1.0, tone, tnear) * tlampk * (1.0 - 0.28 * tnear * smoothstep(0.55, 0.9, trun));
        tcol = mix(tcol, tcol * 0.38, tgrime * 0.85 * tnear);
        tcol += albedo * (uHbTop.x * 0.9 * tedge * tnear * (0.25 + 0.75 * tlv));
        talpha = clamp(talpha + (0.5 * tgrime + 0.25 * tedge + 0.22 * smoothstep(0.55, 0.9, trun)) * tnear, 0.0, 1.0);
      }
      // ... and the water's own line where it meets the glass: sky-light on the meniscus, pane after pane (the bars wore
      // it as beads; between them the glass went into the water without a mark)
      { float tlw = max(0.01, 0.0016 * tdist), tln = (1.0 - smoothstep(tlw * 0.5, tlw * 1.6, abs(vWPos.y - tlw * 0.6))) * (1.0 - smoothstep(30.0, 70.0, tdist));
        tcol += uTownLineT * (tln * 0.55); talpha = max(talpha, tln * 0.55); }
      // (third look) THE WATER'S MARK ON THE GLASS, as on everything that stands in this lake: the old tide line at 0.6 m,
      // where the water stood for a season and left its lime, a pale band two fingers deep, hard along its top and
      // broken; under it the glass is scoured cleaner than above it, where the dust of the years lies undisturbed. At
      // the gunwale a pane has three weathers down its length where it had none.
      float tnn = hbNoiseT(vWPos.xz * 1.3 + 4.7), tide = 0.6 + 0.08 * (tnn - 0.5);
      float tdust = smoothstep(tide - 0.01, tide + 0.05, vWPos.y);
      float tmark = smoothstep(tide - 0.06, tide - 0.01, vWPos.y) * (1.0 - smoothstep(tide - 0.004, tide + 0.006, vWPos.y)) * smoothstep(0.22, 0.6, hbNoiseT(vWPos.xz * 9.0 + 3.0) * 0.7 + tg * 0.4);
      talpha += 0.2 * tdust;
      tcol *= 1.0 - 0.22 * tdust;
      tcol = mix(tcol, tcol * 0.55 + vec3(0.30, 0.38, 0.36), tmark * 0.8 * uHbTop2.x);                         // (lime on lit glass is a milky band, paler than the pane)
      talpha = max(talpha, tmark * 0.8 * uHbTop2.x);
      hbTop = vec4(tcol, clamp(talpha, 0.12, 0.94));
    }`,
    final: /* glsl */`gl_FragColor = vec4(hbTop.rgb * (1.0 - fog) + uFogColor * (fog * hbTop.a), hbTop.a);`,
  };
}

/** Glass and lamps that are simply lit (the model's slot 'lit'): UV.x says how strongly each gives off light; all
 *  wake and sleep with the town as one. Goes after light.extend.
 *  (Fifth look) EVERY PANE OF THE MODEL IS A FRAME OF SMALL PANES: the hall's wall screens and gable ends were cells of
 *  flat teal a metre by two (over cells of flat tan), a diagram of a glass wall whenever the boat was over them. A
 *  market hall is glazed in panes two feet across in light iron: here each of the model's panes is divided, by where
 *  it stands, into panes about 0.52 by 0.74 m (in the gables' fans: rings 0.8 m apart, a ray every five degrees), each
 *  its own brightness, one in twenty dark, with a glazing bar between (6 cm: the page's least line under water; far
 *  off the bars melt into a tone). The lamps' globes (UV.x above 1.5) are left plain. frame: { x, z, yaw } of the model. */
function litGlass(s = 176, gain = 1, frame = null) {
  return {
    uniforms: { uHbLitS: { value: s }, uHbLitGain: { value: gain }, uHbLitAt: { value: frame ? new THREE.Vector4(frame.x, frame.z, Math.cos(frame.yaw), Math.sin(frame.yaw)) : new THREE.Vector4(0, 0, 1, 0) }, uHbLitPanes: { value: frame ? 1 : 0 } },
    fragmentPars: /* glsl */`uniform float uHbLitS, uHbLitGain, uHbLitPanes; uniform vec4 uHbLitAt;
      float hbHashL(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }`,
    light: /* glsl */`{ c *= 0.12;
      float lk = 1.0;
      if (uHbLitPanes > 0.5 && vUv0.x < 1.5) {
        vec2 lrel = vWPos.xz - uHbLitAt.xy; float lhx = lrel.x * uHbLitAt.z - lrel.y * uHbLitAt.w, lhz = lrel.x * uHbLitAt.w + lrel.y * uHbLitAt.z;      // along the hall; across it
        bool lgable = abs(N.x * uHbLitAt.z - N.z * uHbLitAt.w) > 0.7;
        vec2 lg, lbw;                                                                    // the place, in panes; a bar's half width, in panes
        if (lgable && vWPos.y > -12.0) { float lr = max(length(vec2(lhz, vWPos.y + 12.0)), 0.3); lg = vec2(lr / 0.8, atan(vWPos.y + 12.0, lhz) / 0.0873); lbw = vec2(0.03 / 0.8, 0.03 / (lr * 0.0873)); }
        else { lg = vec2((lgable ? lhz : lhx) / 0.52, vWPos.y / 0.74); lbw = vec2(0.03 / 0.52, 0.03 / 0.74); }
        vec2 lid = floor(lg), lf = fract(lg), lfw = fwidth(lg), le = min(lf, 1.0 - lf);
        float lh = hbHashL(lid + (lgable ? 17.0 : 0.0)), lh2 = hbHashL(lid * 1.7 + 5.3);
        float lbar = 1.0 - min(smoothstep(lbw.x, lbw.x + max(lfw.x, 0.02), le.x), smoothstep(lbw.y, lbw.y + max(lfw.y, 0.02), le.y));
        float lfar = smoothstep(0.3, 0.8, max(lfw.x, lfw.y));                            // so far off that a pane is a pixel or two: the bars and the panes' own tones melt into one
        float lpane = (0.6 + 0.6 * lh) * (1.0 - 0.8 * step(0.95, lh2)) * (0.78 + 0.3 * lf.y);      // each small pane its own glass, one in twenty dark, grime at its foot
        lk = mix(lpane * (1.0 - 0.8 * lbar), 0.78, lfar);
      }
      glow += vColor.rgb * ((1.0 + stroke * 0.16 * uBrush) * vUv0.x * uHbLitGain * lk * townWake(uHbLitS, vWPos.xz, -1.0, 0.6)); }`,
  };
}

/** A plain light (gouache `emissive`) that wakes and sleeps with the town as one, like the hall's glass. Goes after light.extend. */
function wakeGlow(s = 176, far = 1) {
  return { uniforms: { uHbWakeS: { value: new THREE.Vector2(s, far) } }, fragmentPars: /* glsl */`uniform vec2 uHbWakeS;`,
    light: /* glsl */`glow *= townWake(uHbWakeS.x, vWPos.xz, -1.0, 0.6) * mix(1.0, uHbWakeS.y, smoothstep(7.0, 28.0, length(vViewPos)));` };      // far: how much brighter it is from across the water than from alongside
}

/** The bright line of glass under the ridge roll (the model's slot 'crest'), pane by pane: each pane's share of the line
 *  has its own brightness, and the line is a breath brighter over each of the hall's lamps (fifth look: one even band
 *  44 m long was a tube of neon laid along the roof). frame: { x, z, yaw } of the model. Goes after wakeGlow. */
function crestBays(frame) {
  return { uniforms: { uHbCrestAt: { value: new THREE.Vector4(frame.x, frame.z, Math.cos(frame.yaw), Math.sin(frame.yaw)) } },
    fragmentPars: /* glsl */`uniform vec4 uHbCrestAt; float hbHashC(float p) { return fract(sin(p * 127.1 + 3.7) * 43758.5453); }`,
    light: /* glsl */`{ vec2 crel = vWPos.xz - uHbCrestAt.xy; float chx = crel.x * uHbCrestAt.z - crel.y * uHbCrestAt.w, cbay = floor((chx + 22.0) / 0.6027);
      float cfar = smoothstep(9.0, 26.0, length(vViewPos));
      glow *= mix(0.58 + 0.66 * hbHashC(cbay), 1.0, cfar * 0.7) * (0.9 + 0.18 * cos(chx * 6.2832 / 4.4)); }` };
}

/**
 * The market hall's hanging lamps as lights (second pass): eighteen warm flames 11 m down, every 4.4 m along the hall
 * and 4.2 m either side of its axis. Each throws a pool of warm light on the flags, the stalls, the columns and the
 * undersides of the trusses round it (the nearest lamp to each place, worked out in the hall's own frame), and they
 * wake and sleep with the hall. So that what is seen down through the glass is a deep room with lamps in it and a lit
 * floor, not jade all the way down. frame: { x, z, yaw } of the model. Goes after light.extend.
 */
function hallLamps(frame, color = '#F2A45C', gain = 1.0, glass = 0.95) {
  return {
    uniforms: { uHbHall: { value: new THREE.Vector4(frame.x, frame.z, Math.cos(frame.yaw), Math.sin(frame.yaw)) }, uHbHallLamp: { value: new THREE.Color(color).multiplyScalar(gain) },
      uHbHallGlass: { value: new THREE.Color('#5ad6bc').multiplyScalar(glass) } },
    fragmentPars: /* glsl */`uniform vec4 uHbHall; uniform vec3 uHbHallLamp, uHbHallGlass;`,
    light: /* glsl */`if (vWPos.y < 0.0) {
      vec2 hrel = vWPos.xz - uHbHall.xy;
      vec3 hp = vec3(hrel.x * uHbHall.z - hrel.y * uHbHall.w, vWPos.y, hrel.x * uHbHall.w + hrel.y * uHbHall.z);        // along the hall, up, across it
      if (abs(hp.x) < 22.6 && abs(hp.z) < 11.6) {
        float hwake = townWake(176.0, vWPos.xz, -1.0, 0.6);
        if (hp.y < -8.0) {                                                              // the hanging lamps, on what stands under and round them
          vec3 hn = vec3(N.x * uHbHall.z - N.z * uHbHall.w, N.y, N.x * uHbHall.w + N.z * uHbHall.z);
          vec3 hl = vec3(clamp(floor(hp.x / 4.4 + 0.5), -4.0, 4.0) * 4.4, -11.4, hp.z > 0.0 ? 4.2 : -4.2) - hp; float hd = length(hl);
          float hk = max(dot(hn, hl / max(hd, 1e-3)) * 0.7 + 0.3, 0.0) / (1.0 + hd * hd / 34.0);
          c += vColor.rgb * uHbHallLamp * (hk * hwake);
        }
        // the lantern's own glass lights the iron that carries it: the gutter, the louvre boards and the curb just under the
        // water show their rust and their silt in its green light (alongside the ridge they were a black band across the picture)
        c += vColor.rgb * uHbHallGlass * (smoothstep(-3.4, -1.4, hp.y) * (1.0 - smoothstep(1.9, 3.0, abs(hp.z))) * hwake);
      }
    }`,
  };
}

/** Iron under the water stays dark against lit glass: the area's nets of light fall on whatever faces up, and on
 *  glazing bars that turns a glass roof into a white net. This takes the light back off what the model painted dark
 *  (iron and rust), and leaves stone, putty and silt alone. Goes after light.extend. */
function darkIron(k = 0.45, line = 0.5, frame = null) {
  return {
    uniforms: { uHbIronK: { value: new THREE.Vector2(k, line) }, uHbIronAt: { value: frame ? new THREE.Vector4(frame.x, frame.z, Math.cos(frame.yaw), Math.sin(frame.yaw)) : new THREE.Vector4(0, 0, 1, 0) }, uHbIronZone: { value: frame ? 1 : 0 } },
    fragmentPars: /* glsl */`uniform vec2 uHbIronK; uniform vec4 uHbIronAt; uniform float uHbIronZone; float hbIron;`,
    // (second look: not the lantern's louvred sides, its gutter and its curb, in the first two metres under the water, 1.3 to
    // 2.1 m either side of the ridge line: those are broad boards and beams, not bars, and kept dark they were one black band
    // across everything seen over the gunwale. They take the water's light and the lantern's jade like anything else.)
    light: /* glsl */`{ vec2 irel = vWPos.xz - uHbIronAt.xy; float iz = abs(irel.x * uHbIronAt.w + irel.y * uHbIronAt.z);
      float ilouvre = uHbIronZone * smoothstep(1.2, 1.4, iz) * (1.0 - smoothstep(2.1, 2.4, iz)) * smoothstep(-2.3, -1.9, vWPos.y);
      hbIron = (1.0 - smoothstep(0.09, 0.16, dot(vColor.rgb, vec3(0.3, 0.5, 0.2)))) * smoothstep(0.0, 0.4, -vWPos.y) * (1.0 - 0.9 * ilouvre); c *= mix(1.0, uHbIronK.x, hbIron); }`,
    // ... and it stays a dark line through the water in front of it too (the area's water would otherwise lift every bar
    // to the water's own colour, paler than the glass behind it), until there is so much water between that it is lost
    final: /* glsl */`{
      float iD = max(-vWPos.y, 0.0), iveil = 1.0 - exp(-uTownWater.w * length(vViewPos) * iD / (max(uCameraPos.y, 0.05) + iD));
      gl_FragColor.rgb *= mix(1.0, mix(uHbIronK.y, 1.0, smoothstep(0.6, 0.97, iveil)), hbIron);
    }`,
  };
}

/**
 * A column's stone, at arm's length (sixth look). The six columns are one lathed model, 2,768 triangles, painted on rings
 * 0.3 to 0.9 m apart: from the boat, which passes 3.7 m from two of them, an airbrushed cylinder with a line every 1.75 m.
 * What a stone column shows at that distance is drawn here by place, each column its own (they are told apart by where
 * they stand), all of it broader than the painter's brush and with hard edges where stone has hard edges:
 *   - every drum a tone of its own, and its bed a hard dark line with the arris above it catching a little light;
 *   - SPALLS at the arrises: two or three to a joint, a hand to a forearm wide, where a drum's edge has come away: a scoop
 *     of cleaner stone under a dark lip, ragged;
 *   - the runs of dirty water from every joint: dark stripes two to three fingers wide, hard where they start and
 *     dying a metre down;
 *   - lichen in ragged crusts, grey-green and a dull ochre, in colonies, mostly on the side turned to the lake;
 *   - the stone's own grain: pits and clouds a hand across.
 * It melts away between 16 and 34 m (far off the vertex paint's clouds are enough, and nothing may shimmer).
 * at: [x, z] the column line's middle; into: [x, z] unit vector into the building. Goes after light.extend.
 */
function columnStone(at, into, k = 1) {
  return {
    uniforms: { uHbColAt: { value: new THREE.Vector4(at[0], at[1], into[0], into[1]) }, uHbColK: { value: k } },
    fragmentPars: /* glsl */`uniform vec4 uHbColAt; uniform float uHbColK;
      float hbCoH(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
      float hbCoHash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
      float hbCoNoise(vec3 x) { vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(mix(hbCoHash(i), hbCoHash(i + vec3(1.0, 0.0, 0.0)), f.x), mix(hbCoHash(i + vec3(0.0, 1.0, 0.0)), hbCoHash(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
                   mix(mix(hbCoHash(i + vec3(0.0, 0.0, 1.0)), hbCoHash(i + vec3(1.0, 0.0, 1.0)), f.x), mix(hbCoHash(i + vec3(0.0, 1.0, 1.0)), hbCoHash(i + vec3(1.0, 1.0, 1.0)), f.x), f.y), f.z); }`,
    albedo: /* glsl */`{
      float cdist = length(vViewPos), cnear = (1.0 - smoothstep(16.0, 34.0, cdist)) * uHbColK;
      float cy = vWPos.y;
      if (cnear > 0.0 && cy > -0.45 && cy < 12.05 && abs(N.y) < 0.5) {
        vec2 crel = vWPos.xz - uHbColAt.xy;
        float cpx = crel.x * uHbColAt.w - crel.y * uHbColAt.z;                               // metres across the front
        float cid = floor((cpx + 20.0) / 6.25 + 0.5);                                         // which column (a number of its own for each of the six)
        float cang = atan(N.x * uHbColAt.w - N.z * uHbColAt.z, -dot(N.xz, uHbColAt.zw));      // round its axis: 0 on the side turned to the lake
        float cu = cang * 0.78;                                                               // metres round the shaft
        float cjf = (cy + 0.42) / 1.75, cjk = floor(cjf + 0.5), cjy = cjk * 1.75 - 0.42;      // the nearest bed (they lie every 1.75 m from 0.42 m under the water)
        float cdrum = floor(cjf);
        bool cbed = cjk > 0.5 && cjk < 7.5;
        float cw = max(0.011, 0.0022 * cdist);                                                 // half a bed's drawn width (never thinner than the painter's brush)
        // ---- every drum its own tone
        albedo *= 1.0 + (hbCoH(vec2(cid * 3.1 + 0.7, cdrum)) - 0.5) * 0.3 * cnear;
        // ---- the stone's grain: clouds a hand across, pits
        float cg = hbCoNoise(vec3(cu * 9.0, cy * 9.0, cid * 5.0)), cg2 = hbCoNoise(vec3(cu * 27.0, cy * 21.0, cid * 9.0 + 3.0));
        albedo *= 1.0 + (0.26 * (cg - 0.5) - 0.34 * smoothstep(0.80, 0.86, cg2)) * cnear * (1.0 - smoothstep(6.0, 14.0, cdist));      // (few pits: many were a leopard's coat)
        if (cbed) {
          float cdy = cy - cjy;
          // ---- runs from the bed: dirty water has come out of every joint for a century
          float cc = cu / 0.11, cci = floor(cc), ccf = fract(cc);
          float ch1 = hbCoH(vec2(cci + cid * 17.0, cjk * 7.0 + 1.0)), ch2 = hbCoH(vec2(cci * 1.7 + cid * 5.0, cjk * 3.0 + 9.0));
          float clen = 0.25 + 1.1 * ch2, cwid = 0.22 + 0.25 * fract(ch1 * 13.7);
          float crun = step(0.66, ch1) * (1.0 - smoothstep(cwid, cwid + 0.12, abs(ccf - 0.5))) * step(cdy, 0.0) * (1.0 - smoothstep(0.0, clen, -cdy));
          crun *= 0.6 + 0.4 * hbCoNoise(vec3(cu * 30.0, cy * 3.0, 4.0));
          albedo *= 1.0 - min(0.62 * crun * cnear, 0.8);
          // ---- spalls: scoops out of the arris, above or below the bed
          float csp = 0.0, cspd = 0.0;
          for (int ci = 0; ci < 3; ci++) {
            float fi = float(ci), sh1 = hbCoH(vec2(cjk * 5.0 + fi * 2.3, cid * 11.0 + 0.3)), sh2 = hbCoH(vec2(cjk * 1.3 + fi * 7.1, cid * 3.0 + 4.1)), sh3 = hbCoH(vec2(cjk + fi * 3.7, cid * 7.0 + 8.9));
            float sa0 = (sh1 * 2.0 - 1.0) * 3.1416, sw = 0.10 + 0.24 * sh2, sht = 0.04 + 0.11 * sh3, sdir = sh2 > 0.5 ? -1.0 : 1.0;      // where; half its width; its height; below the bed or above it
            float sda = abs(mod(cang - sa0 + 3.1416, 6.2832) - 3.1416) * 0.78 / sw;
            float sdv = cdy * sdir / sht;                                                    // 0 at the bed .. 1 at the scoop's far edge
            float sr = sda * sda + sdv * sdv + 0.18 * (hbCoNoise(vec3(cu * 23.0, cy * 23.0, 7.0)) - 0.5);
            float sin_ = (1.0 - smoothstep(0.86, 1.0, sr)) * step(0.0, sdv) * step(0.25, sh3 + sh1 * 0.5);
            if (sin_ > csp) { csp = sin_; cspd = sdv; }
          }
          // (a scoop is cleaner, paler stone; under the lip it is cut from, the dark of the break; at its far edge a thin pale rim)
          albedo = mix(albedo, albedo * mix(0.36, 1.3, smoothstep(0.12, 0.42, cspd)) + vec3(0.03, 0.026, 0.045) * smoothstep(0.2, 0.8, cspd), min(csp * cnear, 1.0));
          // ---- the bed itself
          float cline = 1.0 - smoothstep(cw * 0.6, cw * 1.4, abs(cdy));
          albedo *= 1.0 - 0.55 * cline * cnear * min(1.0, 0.011 / cw * 1.6);
          albedo *= 1.0 + 0.10 * (1.0 - smoothstep(cw * 1.4, cw * 4.0, abs(cdy - cw * 2.6))) * cnear;      // the arris over it, worn pale
        }
        // ---- lichen: ragged crusts in colonies, above the old tide line, mostly on the side turned to the lake
        float lcol = smoothstep(0.50, 0.72, hbCoNoise(vec3(cu * 0.9 + cid * 3.0, cy * 0.7, cid * 2.0 + 11.0))) * (0.45 + 0.55 * cos(cang * 0.5) * cos(cang * 0.5));
        float lnn = hbCoNoise(vec3(cu * 11.0, cy * 11.0, cid + 21.0)) + 0.4 * (hbCoNoise(vec3(cu * 37.0, cy * 37.0, cid + 5.0)) - 0.5);
        float lich = smoothstep(0.64, 0.70, lnn) * lcol * smoothstep(0.7, 1.4, cy);
        // (PALER than the stone, as crusts on old limestone are: a patch that differed from it in hue alone was lost in the town's light)
        vec3 lkind = mix(vec3(0.50, 0.56, 0.52), vec3(0.60, 0.50, 0.36), step(0.6, hbCoNoise(vec3(cu * 1.7, cy * 1.1, cid + 31.0))));      // a pale grey-green, or a dull ochre
        albedo = mix(albedo, albedo * 0.45 + lkind * 0.55, min(lich * 0.75 * cnear, 1.0));
      }
    }`,
  };
}

/**
 * The portico's own light. Three things the area's material cannot know about this building:
 *   - the roof's shade. No sky reaches under a soffit thirteen metres deep, nor into the foyer: the door wall and all
 *     that stands under the roof are dark, and each column is dark on the side it turns to the building. So the six
 *     columns stand pale against the dark behind them from any distance, and from inside they are dark against the lake;
 *   - the two lamps that burn just under the water at the foot of the steps (the page's "last rose from two lamps on
 *     the steps"): rose-gold on what faces them, strongest at the foot of the stone and failing upward (they burn
 *     UNDER the water: their light leaves it low and wide), and on the treads under them;
 *   - water-light: nets of rose-gold thrown up from the lit water crawl on the first nine metres of every upright
 *     thing and on everything that looks down (the coffers, the undersides of the cornices, the foyer's ceiling),
 *     livelier where the water is stirred, failing with depth into the foyer (the gouache caustics stop 6 m up).
 * And (the second look): THE STONE IS PALE. This is the palest stone of the area (the page's lilac: "the pale stone of
 * the theatre front"), and in the town's coral light from below, with an orange lamp on top, it stood as six
 * terracotta cylinders from waterline to capital. Here the town's light is taken on it as light and not as colour
 * (what the area's material gives is drawn toward lilac above the water), the lamps are rose-gold and die within a
 * few metres of the water, and what faces the lake keeps a cool lilac from the lit mist over it all the way up: a
 * column is rose at its foot, lilac above, plum on the side it turns to the building.
 * All of it follows one level, which the realm sets from the light of the two lamps: it goes with them.
 * at: [x, z] of the column line's middle; into: [x, z] unit vector into the building; lamps: two [x, y, z];
 * o.k: a developer's numbers (&hbp=lamp,cool,water,pale,lampHeight,waterHeight,soffit,tileOverhead,climb).
 * .ext({ column, shade, lamp, water, cool, pale, far: [metres, share] }) is the extension for one material (far: from that distance
 * from the eye the lamps' light on it falls, over twenty metres, to that share); .level(k) sets the level for all.
 */
function porticoLight(at, into, lamps, o = {}) {
  const K = o.k || [], k = (i, d) => (K[i] !== undefined && K[i] !== '' && Number.isFinite(+K[i]) ? +K[i] : d);
  const shared = { uHbPort: { value: new THREE.Vector4(at[0], at[1], into[0], into[1]) }, uHbPortLevel: { value: 0 },
    uHbPortLampA: { value: new THREE.Vector3(...lamps[0]) }, uHbPortLampB: { value: new THREE.Vector3(...lamps[1]) },
    uHbPortCol: { value: new THREE.Color(o.color ?? '#FFB48E').multiplyScalar(k(0, 4.0)) },        // the two lamps: rose-gold
    uHbPortCool: { value: new THREE.Color(o.cool ?? '#A99ED6').multiplyScalar(k(1, 0.4)) },        // the lit mist over the lake, on what faces it
    uHbPortWater: { value: new THREE.Color(Q.get('hbpw') ? '#' + Q.get('hbpw') : (o.water ?? '#F2987E')).multiplyScalar(k(2, 1.5)) },      // water-light: rose-gold threads (third look: a peach, #FFB896, was brown on plum plaster, and a pink, #F291A6 at 3.4 as a blur, made the whole front pink; fourth look: as a NET it is threads of light with the stone's own lilac between them. &hbpw=rrggbb tries another)
    uHbPortTune: { value: new THREE.Vector4(k(3, 0.6), k(4, 3.0), k(5, 6.5), k(6, 0.2)) },       // x how far the town's light is drawn to lilac on this stone; y metres over which the lamps' light falls to a third; z the height the water-light climbs to (the page: 6 m); w the soffit's share of it
    uHbPortCeil: { value: new THREE.Vector2(k(7, 5.5), k(8, 0.10)) },                            // the weave overhead: the size of a tile of it in metres; and how fast the weave climbs what stands upright, metres a second
    uHbPortNet: { value: new THREE.Vector4(...[0.3, 1.25, 2.2, 2.3].map((d, i) => { const v = (Q.get('hbpn') || '').split(',')[i]; return v !== undefined && v !== '' && Number.isFinite(+v) ? +v : d; })) },      // the weave (sixth look): x its floor, taken off so that the stone shows between the bands; y its gain; z how far out of focus the tile is read at the least (which of its smaller pictures: 2 is a quarter of its sharpness); w a tile of it in metres on what stands upright (&hbpn=floor,gain,focus,tile)
    // (fifth look: UNDER THE ROOF THE STONE WAS BROWN. Rose-gold on lilac stone in the dark is brown, and brown is not this
    // area's: plum, violet, rose. Under the roof the lamps' light arrives as old rose (the page's chip for water-light and
    // for plaster in light), and a thread of water-light has a rose-gold core in an old-rose bloom: between the threads
    // the stone is plum. &hbpr=rrggbb,rrggbb tries other colours for the two.)
    uHbPortColIn: { value: new THREE.Color('#' + ((Q.get('hbpr') || '').split(',')[0] || 'F0909E')).multiplyScalar(k(0, 4.0) * 0.85) },
    uHbPortWaterLow: { value: new THREE.Color('#' + ((Q.get('hbpr') || '').split(',')[1] || 'C86A84')).multiplyScalar(k(2, 1.5)) } };
  return {
    level(v) { shared.uHbPortLevel.value = v; },
    ext(m = {}) {
      return {
        uniforms: { ...shared, uHbPortK: { value: new THREE.Vector4(m.lamp ?? 1, m.shade ?? 0.72, m.column ? 1 : 0, m.water ?? 1) }, uHbPortK2: { value: new THREE.Vector4(m.cool ?? 1, m.pale ?? 1, m.far ? m.far[0] : 0, m.far ? m.far[1] : 1) } },
        fragmentPars: /* glsl */`uniform vec4 uHbPort, uHbPortK, uHbPortK2, uHbPortTune, uHbPortNet; uniform vec2 uHbPortCeil; uniform float uHbPortLevel; uniform vec3 uHbPortLampA, uHbPortLampB, uHbPortCol, uHbPortCool, uHbPortWater, uHbPortColIn, uHbPortWaterLow;
          // (sixth look) WATER-LIGHT IS THE AREA'S OWN WEB, OUT OF FOCUS. The tower's piers wear the area's water-light (light.js,
          // townNetSoft: its true caustic tile read soft, broad pale bands that weave), and it says water. This front wore
          // threads drawn here, a metre to a mesh with a bright core (fourth look): on a column at arm's length pink marble
          // with glowing veins, on the piers lava in the cracks of a wall, on the coffers gold veining; and two kinds of
          // water-light in one lake. So the same tile is read here: twice, the second copy finer and sliding the other
          // way, soft (bias: how far out of focus), its floor taken off so that between the bands the stone is its own.
          // p, q: the place in TILES for the two copies (round a column the caller gives each a whole number of tiles, so
          // the weave closes round it); wr: a slow wriggle. The tile's own smaller pictures keep it from shimmering far off,
          // where it closes up into an even glow at the foot of the stone.
          // (bias is the SMALLEST picture of the tile that is read: at arm's length the tile is enlarged, and a bias on top of
          // that changes nothing: the web stayed a net of thin lines. Read no sharper than 2, a thread is a band three fingers
          // across with soft edges, as water-light is.)
          float hbTile(vec2 uv, float soft) {
            vec2 tx = uv * 256.0, ta = dFdx(tx), tb = dFdy(tx);
            return textureLod(tTownNetT, uv, max(0.5 * log2(max(max(dot(ta, ta), dot(tb, tb)), 1e-8)), soft)).r;
          }
          float hbWeave(vec2 p, vec2 q, vec2 wr, float t, float bias) {
            float na = hbTile(p + wr + vec2(t * 0.016, 0.0), bias);
            float nb = hbTile(q + wr.yx * 0.6 + vec2(-t * 0.021, 0.0), bias);
            return na + nb * 0.8 + na * nb * 2.5;
          }`,
        light: /* glsl */`{
          vec2 prel = vWPos.xz - uHbPort.xy;
          float py = dot(prel, uHbPort.zw), px = prel.x * uHbPort.w - prel.y * uHbPort.z;      // metres into the building from the column line; metres across
          float pup = smoothstep(-0.04, 0.04, vWPos.y);
          vec3 ppaint = mix(albedo, vColor.rgb, 0.5);
          vec3 pkeep = albedo * pointLight(uLanternPos, uLanternColor, uLanternRadius, N);     // the bow lantern's own light: neither shaded nor re-hued
          vec3 pc = c - pkeep;
          // ---- pale stone: above the water the town's light is taken as light, not as colour
          pc = mix(pc, dot(pc, vec3(0.3, 0.5, 0.2)) * vec3(1.06, 0.87, 1.24), uHbPortTune.x * uHbPortK2.y * pup);
          // ---- the roof's shade
          float proof = 1.0 - smoothstep(13.7, 14.3, vWPos.y);
          float pin = max(smoothstep(-0.6, 7.5, py) * smoothstep(0.0, 6.5, 17.9 - abs(px)), smoothstep(12.4, 13.4, py)) * proof;
          float pinto = dot(N.xz, uHbPort.zw);                                                  // 1 turned to the building .. -1 to the lake
          float pturn = smoothstep(-0.35, 0.75, pinto);                                         // a column: the side it turns to the building
          pc *= 1.0 - min(mix(pin, pturn, uHbPortK.z) * uHbPortK.y * mix(1.25, 1.0, pup), 0.93);            // (under the water too, and more: the area lights what faces up under water like open lake, and the stylobate under the soffit and the foyer's floor were a lit pool in a dark hall)
          // ---- the two lamps at the foot of the steps
          float plamp = 0.0;
          for (int pi = 0; pi < 2; pi++) {
            vec3 pl = (pi == 0 ? uHbPortLampA : uHbPortLampB) - vWPos; float pd = length(pl);
            float patt = (1.0 - smoothstep(30.0, 52.0, pd)) / (1.0 + pd * pd / 55.0);
            patt *= mix(exp(-0.09 * pd), 1.0, pup);                                              // under the water it does not carry far
            plamp += patt * max(dot(N, pl / max(pd, 1e-3)) * 0.7 + 0.3, 0.0);
          }
          plamp *= 1.0 - 0.8 * smoothstep(12.2, 14.6, py);                                      // little of it passes the door wall
          plamp *= 1.0 - 0.78 * pturn * uHbPortK.z;                                              // (sixth look) ... and little of it comes round a column to the side it turns to the building: from inside the six were red-brown marble, where they are dark shapes against the lake
          if (uHbPortK2.z > 0.0) plamp *= mix(1.0, uHbPortK2.w, smoothstep(uHbPortK2.z, uHbPortK2.z + 20.0, length(vViewPos)));      // (sixth look) what is asked to (the great stair) loses this light far off: from across the square its lit treads lay under the tower's reflection as a ruled page (the light's log)
          plamp *= mix(1.0, 0.12 + 0.88 * exp(-max(vWPos.y - 0.5, 0.0) / uHbPortTune.y), pup);  // warm at the foot of the stone, failing upward
          pc += ppaint * mix(uHbPortCol, uHbPortColIn, pin * (1.0 - uHbPortK.z)) * (plamp * uHbPortLevel * uHbPortK.x);      // (rose-gold in the open and on the columns; old rose on what stands under the roof)
          pc += ppaint * vec3(0.022, 0.013, 0.046) * (pin * pup * (0.4 + 0.6 * min(uHbPortLevel, 1.0)));                       // (and the shade is plum, not black: a breath of the violet night comes in under the roof)
          // ---- the cool of the lit mist over the lake, on what faces it, all the way up (it sinks with the lamps, not to nothing)
          float pface = (1.0 - smoothstep(-0.85, 0.2, pinto)) * (1.0 - abs(N.y));
          pc += ppaint * uHbPortCool * (pface * (1.0 - pin * (1.0 - uHbPortK.z)) * pup * (0.3 + 0.7 * min(uHbPortLevel, 1.0)) * mix(1.0, 0.3, smoothstep(6.0, 16.0, vWPos.y)) * uHbPortK2.x);      // (little of it on the pediment: above the water it is night, and from across the square the front must not outshine the tower)
          // ---- water-light
          float pdown = 1.0 - smoothstep(-0.5, 0.1, N.y);
          float pband = 1.0 - smoothstep(0.0, uHbPortTune.z, vWPos.y); pband *= pband * (1.0 - pdown);
          if (pup > 0.0 && (pdown + pband) > 0.012 && uHbPortLevel > 0.001) {
            float pt = uTime, pn; vec3 pan = abs(N);
            vec4 prp = townRipple(vWPos.xz);                                                    // the living water at its foot: a passing ring bends the weave and sets it racing
            float pstir = clamp(prp.w * 4.0, 0.0, 1.0), pclimb = uTime * uHbPortCeil.y;
            if (pan.y > 0.6) {                                                                  // overhead (a soffit, a ceiling): a larger weave, slower and softer: the light has come further
              vec2 pp = vWPos.xz / uHbPortCeil.x + prp.xy * 0.04;
              vec2 pwr = 0.03 * vec2(sin(pp.y * 5.0 + pt * 0.45) + sin(pp.x * 3.1 - pt * 0.3), cos(pp.x * 4.4 - pt * 0.4) + cos(pp.y * 2.7 + pt * 0.2));
              pn = hbWeave(pp, vec2(pp.y, -pp.x) * 0.71 + 0.37, pwr, pt * 0.6, uHbPortNet.z + 0.6);
            } else if (uHbPortK.z > 0.5) {                                                      // round a column: two tiles round it and three of the second copy, so the weave is closed (no seam); it climbs, drawn out upward as light thrown from below is
              float pang = atan(N.x * uHbPort.w - N.z * uHbPort.z, -pinto), pv = (vWPos.y - pclimb) * 0.6 / uHbPortNet.w;
              vec2 pwr = 0.03 * vec2(sin(pv * 9.0 + pt * 0.7) + sin(pang * 3.0 - pt * 0.4), cos(pang * 2.0 - pt * 0.6) + cos(pv * 6.0 + pt * 0.3)) + prp.xy * 0.05;
              pn = hbWeave(vec2(pang * 0.31831, pv), vec2(0.37 - pang * 0.47746, pv * 0.83 + 0.5), pwr, pt, uHbPortNet.z);
            } else {                                                                            // a wall, a pier: the same
              float pu = pan.x > pan.z ? vWPos.z : vWPos.x;
              vec2 pp = vec2(pu, (vWPos.y - pclimb) * 0.6) / uHbPortNet.w;
              vec2 pwr = 0.03 * vec2(sin(pp.y * 9.0 + pt * 0.7) + sin(pp.x * 5.3 - pt * 0.4), cos(pp.x * 7.1 - pt * 0.6) + cos(pp.y * 6.0 + pt * 0.3)) + prp.xy * 0.05;
              pn = hbWeave(pp, vec2(0.37 - pp.x * 1.37, pp.y * 0.83 + 0.5), pwr, pt, uHbPortNet.z);
            }
            pn = max(pn - uHbPortNet.x, 0.0) * uHbPortNet.y;                                    // (the floor taken off: between the bands the stone keeps its own lilac)
            float pfar = 1.0 - smoothstep(11.0, 38.0, py);
            pdown *= mix(1.0, 0.35, smoothstep(10.5, 19.0, vWPos.y));                             // (the cornices far overhead take little of it)
            float pside = mix(1.0, 0.04 + 0.96 * (1.0 - smoothstep(-0.6, 0.5, pinto)), uHbPortK.z);      // a column takes nearly all of it on the side it turns to the lake (seen from inside, in its own shade, it was dark marble veined with fire: from there the six are plain dark shapes against the lake)
            float pdeep = mix(1.0, 0.4, smoothstep(0.0, 13.0, py));                              // under the roof it fails toward the door wall
            pband *= mix(1.0, 0.42, smoothstep(2.0, 13.0, py) * (1.0 - uHbPortK.z));               // ... on the door wall too (the six columns are the lit things; the wall behind them keeps to the dark)
            pband *= 1.0 - smoothstep(13.6, 18.5, py);                                           // (fifth look: and none on the foyer's walls beyond the first bays. Light thrown up from the lake behind falls on a ceiling, not on the foot of a wall twenty metres inside; and threads dying upward on a dark wall were flames licking it)
            // (old rose, the page's chip for water-light, with rose-gold only where two bands cross on what stands upright;
            // overhead it is old rose alone, over an even breath of the same: orange on a plum soffit was gold leaf)
            vec3 pwc = mix(uHbPortWaterLow, uHbPortWater, smoothstep(0.9, 2.2, pn) * (1.0 - pdown) * (1.0 - pin * (1.0 - uHbPortK.z)));      // (and none of the rose-gold under the roof: on the foyer's dark plaster it was fire in the arches)
            vec3 ptake = mix(ppaint, vec3(dot(ppaint, vec3(0.3, 0.5, 0.2))) * vec3(1.05, 0.95, 1.1), max(pdown, pin * (1.0 - uHbPortK.z)));      // (under the roof it falls on the VALUE of the paint: the coffers' warm panels turned it to red veins)
            pc += pwc * (min(pn, 2.6) * pband * pside + (min(pn, 1.8) + 0.3) * pdown * uHbPortTune.w * pdeep) * ((0.7 + 0.5 * pstir) * pfar * uHbPortLevel * uHbPortK.w) * (0.42 + 0.58 * ptake);
          }
          c = pkeep + pc;
        }`,
      };
    },
  };
}

export async function build(ctx, plan, shared) {
  const { kit } = ctx;
  const light = ensureLight(ctx, plan, shared), town = light.town;
  const ext = (lit) => (light.extendFor ? light.extendFor(lit) : light.extend);
  // a frame standing at (s, d), turned to the route there: at(ls, y, ld) is ls metres further down the route and ld
  // metres further right; local(x, z) is the other way round. A model placed with rotation.y = yaw has its own +X down
  // the route and its front (+Z; Blender's -Y) to the route's right.
  const frameAt = (s, d) => {
    const [x, z] = town.xz(s, d), yaw = town.along(s), c = Math.cos(yaw), sn = Math.sin(yaw);
    return { x, z, yaw, at: (ls, y, ld) => [x + ls * c + ld * sn, y, z - ls * sn + ld * c], local: (px, pz) => [(px - x) * c - (pz - z) * sn, (px - x) * sn + (pz - z) * c] };
  };
  // Stage 1's stand-ins for these pieces are partly named meshes (removeStandIn takes those) and partly instances in
  // the stand-in batches of heroes.js, which have no names: those are taken out by where they stand.
  const M = new THREE.Matrix4(), ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
  const clearBatch = (inside) => {
    let n = 0;
    if (KEEP) return n;
    ctx.group.traverse((o) => {
      if (!o.isInstancedMesh || !o.name || !o.name.startsWith('standins:')) return;
      let hit = false;
      for (let i = 0; i < o.count; i++) {
        o.getMatrixAt(i, M); const e = M.elements;
        if (e[0] === 0 && e[5] === 0 && e[10] === 0) continue;
        if (inside(e[12], e[13], e[14], e)) { o.setMatrixAt(i, ZERO); hit = true; n++; }
      }
      if (hit) o.instanceMatrix.needsUpdate = true;
    });
    return n;
  };
  const updates = [];
  // the kit's painted plaster (already loaded for the houses and the tower): laid on stone and lead from three sides, it
  // gives a flat-painted face its cloud and its hairline cracks
  const plaster = Q.get('hbmap') === '0' ? null : await ctx.tex('art/town/surfaces_plaster.webp', { repeat: true }).catch(() => null);
  const clouded = (metres) => (plaster ? { map: plaster, triplanar: metres } : {});

  // ---------------------------------------------------------------------------------------------- the church
  // Nave 30 by 12 m, 18.2 m to the ridge. Its ridge stands 1.2 m clear along d -5 from s 119 to 147: a lead roll with
  // iron cresting, slates diving under at 52 degrees; sixteen lancets in gabled lucarnes just under the surface, leaded
  // in rose-gold and jade; lead aisle roofs under the keel; a lead fleche with a weathercock; an apse whose stone
  // finial lies awash. (The log says why the lancets stand in gables of their own.)
  if (want('church')) {
    const C = plan.church, f = frameAt((C.s0 + C.s1) / 2, C.d), place = { position: [f.x, 0, f.z], rotation: f.yaw };
    const ridge = []; for (let x = -13.6; x <= 13.61; x += 1.36) ridge.push([x, 0, 1.12]);          // the ridge is solid at the waterline: the hull slides along it
    // (second pass: the paint is a step deeper, so the lancets' own light on the stone round them is stronger: a lit sill
    // and gable in a dark roof. The stone has a slot of its own: it wears the plaster's cloud and drawn courses; the lead
    // and the iron wear the cloud alone.)
    const LG = num('hblancet', 2.2);
    const CK = num('hbcold', 0.5);
    // (third look: TWO FILES. church_top.glb is everything of it that stands above the water or within half a metre under
    // it: the ridge strip's slates, the lead ridge, the fleche, the gable heads, the apse's finial, the cresting, the cock.
    // It is in the mirror and wears the water's mark. church.glb is the rest, all of it under water: the direct view only.)
    // (sixth look: a slate's own face, slateFace: the laps' shade above the water and under it; near the eye, on the ridge
    // strip, its clouds, its lichen and the moss in its laps. waterMark's own slate grain is off: thinner than the painter's brush.)
    const slate = (mark) => ({ map: null, extend: [ext(0.25), lancetLight(f, LG * 0.75), slateFace({ lap: num('hblap', mark ? 0.5 : 0.42), tail: 0.14, near: mark ? num('hbslate', 1) : 0 }), ...(mark ? [waterMark({ mark: 0.5, slate: 0 })] : [])], brush: 0.9 });
    const church = await kit.model('models/town/church.glb', { ...place, brush: 0.8, ...clouded(3.1), extend: [ext(0.3), lancetLight(f, LG), coldStone(CK)],
      materials: { stone: { ...clouded(2.3), brush: 0.85, extend: [ext(0.5), lancetLight(f, LG), ashlar(f, { course: 0.3, block: 0.66, joint: 0.014, depth: 0.5, vary: 0.11 }), coldStone(CK)] },
        slate: slate(false) },
      collide: [...ridge, [15.2, 0, 0.5]] });                                                          // ... and the apse's finial awash
    ctx.only(church.group, 'direct');
    const top = await kit.model('models/town/church_top.glb', { ...place, brush: 0.8, ...clouded(2.3), extend: [ext(0.4), lancetLight(f, LG), coldStone(CK, undefined, { frame: f, from: 13.25, k: num('hbcoldstone', 0.3) }), waterMark({ mark: num('hbmark', 0.8), weather: 0.7 })],
      materials: { slate: slate(true),
        thin: { map: null, triplanar: 0, brush: 0.3, crisp: true, extend: [ext(0.3), coldStone(CK)] } } });      // the iron cresting and the weathercock: thin things, kept out of the painter's filter
    church.parts.vane = top.parts.vane;
    for (const n of ['perch', 'finial', 'fleche_foot', 'vane_top']) if (top.points && top.points[n] && church.points && !church.points[n]) church.points[n] = top.points[n];
    const glass = await kit.model('models/town/church_glass.glb', { ...place, brush: 0.5, shade: 0, extend: [ext(0), leadedLights({ w: num('hbquarry', 0.115), h: num('hbquarry', 0.115) * 1.47, came: 0.0075, gain: num('hbglass', 1.12) })] });      // (second look: quarries a hand across in cames a finger wide; they were a hand and a half in lead as thick as a thumb)
    ctx.only(glass.group, 'direct');
    if (!KEEP) removeStandIn(ctx, 'church (nave 30 by 12 m)');
    clearBatch((x, y, z) => { const [ls, ld] = f.local(x, z); return ls > -15.6 && ls < 21.5 && Math.abs(ld) < 7.6; });
    // the weathercock wanders 25 degrees either way over 17 s, in air that has no wind
    const vane = church.parts.vane, hold = Q.has('hbvane') ? +Q.get('hbvane') * Math.PI / 180 : null;
    updates.push((dt, c) => { if (vane) vane.rotation.y = hold ?? (0.15 + 0.44 * (0.62 * Math.sin(c.time * 2 * Math.PI / 17) + 0.38 * Math.sin(c.time * 2 * Math.PI / 29.3 + 1.3))); });
    const pt = (n) => church.point(n);
    const lancets = ['s', 'n'].flatMap((k) => [0, 1, 2, 3, 4, 5, 6, 7].map((i) => ({ name: k + i, at: pt(`lancet_${k}${i}`), win: i + (k === 's' ? 8 : 0) + 1, jade: i % 3 === 2, side: k })));
    // light in the water round each lancet (the area's halos), each on its own window's clock
    if (light.halos) {
      const out = (k) => { const sg = k === 's' ? 1 : -1; return [sg * Math.sin(f.yaw), 0, sg * Math.cos(f.yaw)]; };      // 's' is the route's side
      // ... and round the lamps left burning in the nave (seen through the lights that have lost their glass: a flame with its
      // glow says "a room"), in the same mesh
      const nk = num('hbnave', 1.2), nc = new THREE.Color('#FFB868').multiplyScalar(nk), nl = [];
      for (let i = 0; i < 17; i++) { const p = church.points && church.points['nave_lamp_' + i] ? pt('nave_lamp_' + i) : null; if (p) nl.push({ x: p.x, y: p.y, z: p.z, size: 1.5, color: nc, s: (C.s0 + C.s1) / 2, stay: 0.4 }); }
      const h = light.halos([...lancets.map((l) => ({ x: l.at.x, y: l.at.y, z: l.at.z, size: 3.6, ...(l.jade ? { color: '#3C9C82' } : { color: '#F0843E' }), ...WINDOW_CLOCK(l.win), out: out(l.side) })), ...nl], { gain: num('hbhalo', 0.42) });
      h.name = 'church lancet halos'; ctx.add(h);
    }
    shared.church = { ...(shared.church || {}), frame: f, model: church, glass, vane, perch: pt('perch'), finial: pt('finial'), lancets,
      open: ['s2', 's5', 'n4'].map((n) => ({ name: n, at: pt(`open_${n}`) })) };
  }

  // ---------------------------------------------------------------------------------------------- the market hall
  // Iron and glass, 44 by 22 m, on the left of the square; its floor 22 m down. The ridge of its lantern roof stands
  // 0.9 m clear for 44 m: the glass ridge, the one turquoise light of the area, lit from within. Its glass is a film of
  // light, not a wall: alongside, the rider looks down through the lantern and the great slope at the trusses, the
  // lamps and the stalls. (The stalls and their lamps inside are the kit's: their stand-ins stay.)
  if (want('hall')) {
    const H = plan.hall, f = frameAt((H.s0 + H.s1) / 2, H.d), place = { position: [f.x, 0, f.z], rotation: f.yaw };
    const ridge = []; for (let x = -21.4; x <= 21.41; x += 1.53) ridge.push([x, 0, 1.15]);
    // (second look: the film under the water at 0.9, was 2.0: at 2.0 the whole roof was a milky sheet over the hall, glass and
    // water one pale teal. Depth darkens: the hall is a dark room with lamps in it under a grid of iron, and its glass shows as
    // glints at a glancing angle. The panes above the water are no film: lanternGlass.)
    const under = glassFilm(light, { gain: num('hbfilm', 0.9), s: 176, under: true, square: num('hbsquare', 0.12) }), above = lanternGlass(light, { gain: num('hbtop', 0.5), s: 176, far: num('hbtopfar', 2.2), cover: num('hbcover', 0.6), frame: f, sheets: num('hbsheets', 1) });
    const film = { transparent: true, side: THREE.DoubleSide, brush: 0.6 };
    // (third look: the iron wears the water's mark too, and with it the area's line of light at the surface is this module's:
    // by height alone every glazing bar wore a white bead where it crosses the water, a row of staples along the lantern)
    const hall = await kit.model('models/town/market_hall.glb', { ...place, brush: 0.8, extend: [ext(0.3), darkIron(num('hbiron', 0.34), num('hbbar', 0.5), f), hallLamps(f, '#F2A45C', num('hbfloor', 2.6), num('hbrim', 0.95)), waterMark({ mark: 0.5, line: num('hbbead', 0.22), weed: 0.5 }), coldStone(num('hbironcold', 0.7), [0.84, 1.0, 1.04])],      // (and above the water its iron takes the town's coral as light, not colour: dark green-grey bars, as the key painting's, where they were brown)
      materials: { glass_top: { ...film, extend: above },
        thin: { brush: 0.3, crisp: true, extend: [ext(0.3)] },                                         // the ridge roll and its spear finials
        crest: { color: '#16302c', brush: 0, shade: 0, emissive: '#7ADCC6', emissiveIntensity: num('hbcrest', 1.4), extend: [ext(0), wakeGlow(176, num('hbcrestfar', 1.7)), crestBays(f)] } }, collide: ridge });
    const glass = await kit.model('models/town/market_hall_glass.glb', { ...place,
      materials: { lit: { extend: [ext(0), litGlass(176, num('hblit', 1.3), Q.get('hbpanes') === '0' ? null : f)], brush: 0.4, shade: 0 }, film: { ...film, extend: under } } });
    for (const [model, slot, order, add] of [[glass, 'film', -2, true], [hall, 'glass_top', 3, false]]) {              // the film under the water adds its light, before the water; the lantern's panes above it are blended (premultiplied: they give off light and hide part of what is behind), after the water
      const m = model.materials[slot]; if (!m) continue;
      if (add) m.blending = THREE.AdditiveBlending; else { m.blending = THREE.NormalBlending; m.premultipliedAlpha = true; }
      m.depthWrite = false; m.needsUpdate = true;
      model.group.traverse((o) => { if (o.isMesh && o.material === m) o.renderOrder = order; });
    }
    ctx.only(glass.group, 'direct');
    if (!KEEP) { removeStandIn(ctx, 'the glass ridge'); removeStandIn(ctx, 'market hall glass'); }
    // everything of the stand-in inside the hall's walls goes, except the stalls and their lamps on its floor (the kit's)
    clearBatch((x, y, z, e) => { const [ls, ld] = f.local(x, z); if (Math.abs(ls) > 22.7 || Math.abs(ld) > 11.7) return false; return !(y < -18 && Math.hypot(e[4], e[5], e[6]) < 2); });
    updates.push(() => { const w = light.U.uTownWater; under.waterFade(w && w.value ? w.value.w : 0.02); });
    const gaps = [], lamps = []; for (let i = 0; i < 9; i++) gaps.push(hall.point('gap_' + i)); for (let i = 0; i < 18; i++) lamps.push(hall.point('lamp_' + i));
    if (light.halos) {                                                                                 // light in the water round the hanging lamps
      const HG = num('hblamp', 0.7), list = lamps.map((p) => ({ x: p.x, y: p.y, z: p.z, size: 5.2, color: '#F2A45C', s: 176, stay: 0.6 }));      // (second pass: warm flames in the jade)
      if (want('fountain')) {                                                                        // ... and, in the same mesh, the lamplit water round the fountain: one soft glow, so that the eye finds it from 25 m
        const Fo = plan.fountain, [fx, fz] = town.xz(Fo.s, Fo.d);
        list.push({ x: fx, y: Fo.floor + 1.6, z: fz, size: 11, color: new THREE.Color('#F0A070').multiplyScalar(num('hbfountainglow', 0.16) / HG), s: 176, stay: 0.6 });
      }
      const h = light.halos(list, { gain: HG });
      h.name = 'market hall lamp halos'; ctx.add(h);
    }
    shared.glassRidge = { position: new THREE.Vector3(...f.at(0, 0.45, 0)), frame: f, length: 44, width: 2.0, clear: H.clear, model: hall, glass, gaps, lamps, ends: [hall.point('ridge_w'), hall.point('ridge_e')] };
  }

  // ---------------------------------------------------------------------------------------------- the theatre front (the passage out)
  // Six unfluted columns 14 m tall on a stylobate a metre down, an entablature, a coffered soffit 13 m deep, a pediment
  // with one blind oculus; thirteen metres behind, the wall of three arches into the foyer, of which 12 m are the
  // model's (the theatre of leaves stands the same files at its own s -14 and goes on from there); in front, the stair
  // that rises under the keel. One column model, stood six times, each a quarter turn from its neighbour.
  if (want('theatre')) {
    const T = plan.theatre, Po = T.portico, f = frameAt(Po.s, 0), turn = f.yaw - Math.PI / 2;      // the models' fronts look back up the route (kit: face 'back')
    const here = (bx, by, y = 0) => f.at(by, y, bx);                                                // a place of the model (its own x across, y into the building)
    const into = [Math.cos(f.yaw), -Math.sin(f.yaw)];
    // the two lamps that burn just under the water at the foot of the steps (the layout's; the plan's places if it has none there)
    let lamps = town.lamps.filter((l) => l.kind === 'row' && l.s > 200).slice(0, 2).map((l) => ({ x: l.x, y: Math.max(l.y, -0.6), z: l.z, s: l.s }));
    if (lamps.length < 2) lamps = T.stepLamps.map((l) => { const [x, z] = town.xz(l.s, l.d); return { x, y: -0.4, z, s: l.s }; });
    const PL = porticoLight([f.x, f.z], into, lamps.map((l) => [l.x, l.y, l.z]), { k: (Q.get('hbp') || '').split(',') });
    // drawn courses on the door wall and everything else that stands upright under the capitals (half-metre courses, as the
    // jambs are modelled); the five rings of modelled voussoirs keep their own joints
    const rings = [[-7.5, 4.5, 2.44, 3.3], [0, 4.5, 3.44, 4.5], [7.5, 4.5, 2.44, 3.3], [-14.2, 4.5, 1.64, 2.16], [14.2, 4.5, 1.64, 2.16]];
    const walling = ashlar(f, { course: 0.5, block: 1.3, joint: 0.018, depth: 0.24, vary: 0.12, top: 12.45, arches: rings });
    const WK = num('hbweather', 1);                                                                 // (third look: the stone wears its weather and the water's mark, drawn by place: waterMark)
    const front = await kit.model('models/town/theatre_front.glb', { position: [f.x, 0, f.z], rotation: turn, brush: 0.8, ...clouded(2.7), extend: [ext(1.0), walling, PL.ext(), waterMark({ mark: 1, weather: WK })],
      materials: { foyer: { color: '#8a7496', ...clouded(3.3), extend: [ext(0.7), PL.ext({ shade: 0.86, lamp: 0.7, water: 1.3 }), waterMark({ mark: 1, weather: WK * 0.6 })], brush: 0.9 } } });          // the foyer: dark plaster (the model's greys, tinted plum here)
    const tints = ['#ffffff', '#f3eef8', '#fbf3f1', '#f0f0f8', '#fdf8f4', '#f5eff6'];
    const cols = await kit.models('models/town/theatre_column.glb', Po.columns.map((d, i) => ({ position: here(d, 0), rotation: turn + (i * 3 % 4) * Math.PI / 2, tint: tints[i] })),
      { brush: 0.8, ...clouded(2.7), extend: [ext(1.0), columnStone([f.x, f.z], into, num('hbcolumn', 1)), PL.ext({ column: true, shade: 0.66 }), waterMark({ mark: 1, weather: WK })] });      // (sixth look: columnStone, a column's stone at arm's length)
    const steps = await kit.model('models/town/theatre_steps.glb', { position: [f.x, 0, f.z], rotation: turn, brush: 0.9, ...clouded(3.1), extend: [ext(1.3), PL.ext({ lamp: 3.0, far: [24, num('hbstepfar', 0.22)] })] });
    ctx.only(steps.group, 'direct');
    for (const d of Po.columns) { const [x, , z] = here(d, 0); ctx.addCollider({ x, z, r: Po.base / 2 + 0.3 }); }
    for (const n of ['pier_l', 'pier_r']) { const p = front.point(n); ctx.addCollider({ x: p.x, z: p.z, r: T.wall.pier / 2 + 0.3 }); }
    // Beyond the model's 12 m the foyer runs on to the end of the water, so that no opening shows in the veil: the same
    // hall, plainer (two walls, the ceiling, an end; pilasters every 6 m and beams every 5.3 m where the model's own
    // rhythm puts the next ones), darkening to the veil's own colour with depth: what is seen through the arches is a hall
    // going on into the dark. One mesh.
    { const s0 = T.foyer.s1, s1 = 263, len = s1 - s0, W = T.foyer.width / 2, y0 = -1.0, y1 = T.foyer.height;
      const P = [], Nn = [], Cc = [], near = new THREE.Color('#57495f'), far = new THREE.Color('#140f18'), cc = new THREE.Color();
      const shadeAt = (x, k) => { cc.copy(near).lerp(far, Math.pow(Math.min(1, Math.max(0, x / len)), 0.6)).multiplyScalar(k); return [cc.r, cc.g, cc.b]; };
      const quad = (a, b, c2, d, n, k = 1) => { for (const v of [a, b, c2, a, c2, d]) { P.push(...v); Nn.push(...n); Cc.push(...shadeAt(v[0], k)); } };
      const box = (x0, x1, ya, yb, z0, z1, k = 1) => {                                            // a block (local: x down the hall from the model's end, y up, z to the right)
        quad([x0, ya, z0], [x0, ya, z1], [x0, yb, z1], [x0, yb, z0], [-1, 0, 0], k); quad([x1, ya, z1], [x1, ya, z0], [x1, yb, z0], [x1, yb, z1], [1, 0, 0], k);
        quad([x0, ya, z1], [x1, ya, z1], [x1, yb, z1], [x0, yb, z1], [0, 0, 1], k); quad([x1, ya, z0], [x0, ya, z0], [x0, yb, z0], [x1, yb, z0], [0, 0, -1], k);
        quad([x0, ya, z0], [x1, ya, z0], [x1, ya, z1], [x0, ya, z1], [0, -1, 0], k * 0.8);
      };
      const N = 6;
      for (let i = 0; i < N; i++) { const a = len * i / N, b = len * (i + 1) / N;                // the shell, in lengths so that it darkens evenly
        quad([a, y0, -W], [b, y0, -W], [b, y1, -W], [a, y1, -W], [0, 0, 1]); quad([b, y0, W], [a, y0, W], [a, y1, W], [b, y1, W], [0, 0, -1]);
        quad([a, y1, -W], [b, y1, -W], [b, y1, W], [a, y1, W], [0, -1, 0], 0.8); }
      quad([len, y0, -W], [len, y0, W], [len, y1, W], [len, y1, -W], [-1, 0, 0]);
      for (let i = 0; i < N; i++) { const a = len * i / N, b = len * (i + 1) / N;                // its floor, a hand above the lake's bed (which the area lights like open water: inside a hall it is dark)
        quad([a, -0.955, W], [b, -0.955, W], [b, -0.955, -W], [a, -0.955, -W], [0, 1, 0], 0.9); }
      for (const sp of [254, 260]) for (const sg of [-1, 1]) { const x = sp - s0, z0 = sg > 0 ? W - 0.26 : -W, z1 = sg > 0 ? W : -W + 0.26; box(x - 0.45, x + 0.45, y0, 8.75, z0, z1, 1.18); box(x - 0.55, x + 0.55, 8.75, 9.3, sg > 0 ? W - 0.36 : -W, sg > 0 ? W : -W + 0.36, 1.3); }
      for (const sg of [-1, 1]) { const z0 = sg > 0 ? W - 0.1 : -W, z1 = sg > 0 ? W : -W + 0.1; box(0, len, 1.3, 1.48, z0, z1, 1.25); box(0, len, 9.3, 9.98, sg > 0 ? W - 0.42 : -W, sg > 0 ? W : -W + 0.42, 1.2); }
      for (const sb of [254.7, 260.0]) box(sb - s0 - 0.275, sb - s0 + 0.275, y1 - 0.45, y1, -W, W, 1.15);              // beams across the hall
      for (const zb of [-3.33, 3.33]) box(0, len, y1 - 0.45, y1, zb - 0.275, zb + 0.275, 1.15);                        // ... and along it
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(Nn, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(Cc, 3));
      const hall = new THREE.Mesh(geo, light.mat({ color: '#ffffff', vertexColors: true, lit: 0.5, extend: PL.ext({ shade: 0.86, lamp: 0.5, water: 1.3 }) }));
      const o = f.at(s0 - Po.s, 0, 0); hall.position.set(o[0], 0, o[2]); hall.rotation.y = f.yaw; hall.name = 'foyer beyond the model'; ctx.add(hall); }
    if (!KEEP) removeStandIn(ctx, 'portico columns (theatre_front)');
    clearBatch((x, y, z) => { const [ls, ld] = f.local(x, z); return ls > -15.5 && ls < 37.5 && Math.abs(ld) < 18.45; });      // (the far shore's quay either side stays: it is not the theatre's)
    // the portico's light goes with its two lamps (they wake and sleep with the town)
    const PK = num('hbport', 1);
    const portLight = { hold: null, level: 0 };                                                    // (staging may hold the level: shared.portico.light.hold = 0..1.4; null gives it back to the lamps)
    updates.push(() => { portLight.level = portLight.hold ?? Math.min(1.4, 0.5 * (light.level(lamps[0].s, lamps[0].x, lamps[0].z, -1, 0.6) + light.level(lamps[1].s, lamps[1].x, lamps[1].z, -1, 0.6))); PL.level(PK * portLight.level); });
    shared.portico = { ...(shared.portico || {}), frame: f, front, columns: Po.columns.map((d) => { const p = here(d, 0); return [p[0], p[2]]; }), steps,
      arches: ['arch_l', 'arch_c', 'arch_r'].map((n) => front.point(n)), foyerEnd: front.point('foyer_end'), lamps, light: portLight };
  }

  // ---------------------------------------------------------------------------------------------- the fountain
  // Three stone tiers, a basin 6 m across, 4.5 m tall, on the square's floor 22 m down at s 170, d -13. It still plays:
  // the cast sends a column of silver bubbles up from its spout (shared.fountain.spout) to boil at the surface.
  if (want('fountain')) {
    const Fo = plan.fountain, f = frameAt(Fo.s, Fo.d);
    // (second pass) In the area's deeper water the fountain stood in the dark, 22 m down with no lamp near it. What lights it
    // is the market hall, eighteen metres off on the route's left: the warm of its lowest panes on the fountain's foot, the
    // jade of its upper glass on the bowls, on the side that is turned to the hall. It goes to sleep with the hall.
    const toHall = [-Math.sin(f.yaw), -Math.cos(f.yaw)];                                             // the route's left, where the hall stands
    // (second look) ... and it could not be seen: the area's water takes two thirds of anything 22 m down that is not itself a
    // light, and what the hall gave the fountain was a tenth of what gets through. It stands in the lamplight of the square
    // (the kit's standards are a few metres off: no lamp is added here): rose-gold on everything that faces up, rims, copings,
    // caps and steps, so that its three rings and its eight piers are drawn in light from above; and the hall's jade still on
    // the bowls, on the side turned to it. Strong enough to arrive (&hbfountain=).
    const hallOn = { uniforms: { uHbFtn: { value: new THREE.Vector4(toHall[0], toHall[1], Fo.floor, num('hbfountain', 2.8)) } }, fragmentPars: /* glsl */`uniform vec4 uHbFtn;`,
      light: /* glsl */`{
        float fhall = max(dot(N, normalize(vec3(uHbFtn.x, 0.35, uHbFtn.y))) * 0.62 + 0.38, 0.0);
        float fup = smoothstep(0.15, 0.85, N.y), fh = smoothstep(uHbFtn.z + 0.8, uHbFtn.z + 3.4, vWPos.y);
        vec3 fl = vec3(1.0, 0.60, 0.34) * ((0.3 + 0.5 * fup) * (1.0 - 0.45 * fh)) + vec3(0.30, 0.80, 0.66) * (fhall * (0.14 + 0.5 * fh));
        fl *= 1.0 - 0.45 * smoothstep(0.42, 0.6, dot(vColor.rgb, vec3(0.3, 0.5, 0.2)));          // (the palest paint, the piers' weathered caps, takes less: at full they burned like eight lamps)
        c += vColor.rgb * fl * (uHbFtn.w * townWake(176.0, vWPos.xz, -1.0, 0.6));
      }` };
    const fountain = await kit.model('models/town/fountain.glb', { position: [f.x, Fo.floor, f.z], rotation: f.yaw, brush: 0.9, ...clouded(2.1), extend: [ext(1.0), hallOn] });
    ctx.only(fountain.group, 'direct');
    if (!KEEP) removeStandIn(ctx, 'fountain');
    clearBatch((x, y, z) => y < -16 && Math.hypot(x - f.x, z - f.z) < 3.4);
    if (light.halos && !want('hall')) {                                                              // the lamplit water round it (it rides in the hall's lamp halos when the hall is built: one mesh)
      const hf = light.halos([{ x: f.x, y: Fo.floor + 1.6, z: f.z, size: 11, color: '#F0A070', s: 176, stay: 0.6 }], { gain: num('hbfountainglow', 0.16) });
      hf.name = 'fountain glow'; ctx.add(hf);
    }
    shared.fountain = { ...(shared.fountain || {}), x: f.x, z: f.z, top: Fo.floor + Fo.height, model: fountain, spout: fountain.point('spout') };
  }

  return { update(dt, c) { for (const u of updates) u(dt, c); } };
}
