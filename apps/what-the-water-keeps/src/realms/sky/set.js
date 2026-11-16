// The standing sky: the place and its light. The sky (one sphere: the night's gradient, the Milky Way on end, the
// stars, the aurora, the painted horizon band, the mist line, then first light), the lake bed, the three light
// states and the dawn clock that drives them, the sunline, the water's character and the wind front, the current.
// Everything here is what docs/art/sky.md sections 2, 3 (vista, canopy) and 7 ask for.
//
// What this module puts in `shared` for the others:
//   shared.sky             the area's light (light.js): sky.paint(opts), sky.extend(), sky.adopt(obj), sky.standIn(o),
//                          sky.dabs(list, opts), sky.hairlines(segments, opts), sky.uniforms (uSunline ...)
//   shared.sky.e           0..1: the dawn's progress where the boat is (the page's `e`; by distance, never by the clock)
//   shared.sky.aurora      0..1: how much of the false dawn stands (it unrolls over 12 s from the cue at s 96, fails from s 170)
//   shared.sky.sunlineY    metres: the height of the sunline now
//   shared.sky.T           the showstopper's clock in seconds (-1 before the cue 'lettinggo' at s 216): hang every beat on it
//   shared.sky.wind        0..1: how far the wind front has passed the boat (0 an exact mirror, 1 ordinary water)
//   shared.sky.front       { z }: the wind front's line (it lies across the route; water east of it, z < front.z, is blown)
//
// THE EXACT MIRROR (the page's first rule). Above and below the seam must be one picture:
//   - the dome and the stars are drawn the same way into the view and into the water's mirror, at sizes given as angles;
//   - what the water does to its far reach (it fades into the fog colour with distance) the dome does to its own low
//     sky, by the same formula, in the direct view only; so the seam is a soft line of mist, the same above and below;
//   - the mirror's grade is nothing until s 170, the painter's filter is off until the mirror is let go, and the mirror
//     runs as fine as the engine allows; a star is drawn a little softer above to match its twin below (light.js).
// Light states (ctx.lookStates): star, aurora, dawn. Driven from update() by the boat's distance along and by cues.
import { makeSkyLight } from './light.js';
import { NOISE_GLSL, FOG_PARS } from '../../engine/kit.js';
import { smooth, lerp, clamp01 } from './plan.js';

export async function build(ctx, plan, shared) {
  const { THREE, kit, stage, engine } = ctx, sh = engine.shared, P = plan, C = P.colors;
  const sky = shared.sky = makeSkyLight(ctx, plan);
  const col = (c) => new THREE.Color(c), linc = (o) => new THREE.Color().setRGB(o.lin[0], o.lin[1], o.lin[2]), rad = Math.PI / 180;
  const params = new URLSearchParams(location.search);

  // ------------------------------------------------------------------------------------------ painted art
  const tryTex = (have, url) => (have ? ctx.tex(url).catch(() => null) : Promise.resolve(null));
  const [texMW, texNA, texNB, texDA, texDB] = await Promise.all([
    tryTex(P.art.milkyway, 'art/sky/milkyway.webp'),
    tryTex(P.art.horizonNight, 'art/sky/horizon_night_a.webp'), tryTex(P.art.horizonNight, 'art/sky/horizon_night_b.webp'),
    tryTex(P.art.horizonDawn, 'art/sky/horizon_dawn_a.webp'), tryTex(P.art.horizonDawn, 'art/sky/horizon_dawn_b.webp'),
  ]);
  for (const t of [texMW, texNA, texNB, texDA, texDB]) if (t) { t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.needsUpdate = true; }
  // the area's three texture tiles (source-art/sky/pack_salt.py): each channel is the height of the paint of one swatch,
  // 0 in a hollow .. 1 on a crest; the colours are put back by the shaders (light.js "THE SALT"; the lake bed, below).
  //   salt.webp      R raked salt   G old slumped salt   B crust lobes
  //   lakebed.webp   R fine ripple marks   G ripples round scour hollows   B pebbles and grit
  //   crust.webp     R flat crust pan   G the bed crazed under a skin of salt   B a slow cloud (patches, strata)
  const tile = (url) => ctx.tex(url, { repeat: true, data: true }).catch(() => null);
  const [texSalt, texBed, texCrust] = await Promise.all([tile('art/sky/salt.webp'), tile('art/sky/lakebed.webp'), tile('art/sky/crust.webp')]);
  if (texSalt) sky.tiles.tSalt.value = texSalt;
  if (texCrust) sky.tiles.tCrust.value = texCrust;
  // (second pass) the landing's `timber` tile: one picture for both areas (docs/art/README.md); the sky wears it tinted (light.js)
  if (P.timberPaint.tile && P.timberPaint.tile.strength > 0) { const texTimber = await ctx.tex('art/landing/timber.webp', { repeat: true }).catch(() => null); if (texTimber) sky.tiles.tTimber.value = texTimber; }
  const haveNight = !!(texNA && texNB), haveDawn = !!(texDA && texDB);

  // ------------------------------------------------------------------------------------------ the Milky Way's great circle
  // It rises from the horizon `rise` degrees left of dead ahead, passes `lean` degrees north of the zenith, sets behind.
  const M = P.sky.milkyway;
  const mwA = new THREE.Vector3(-Math.sin(M.rise * rad), 0, -Math.cos(M.rise * rad));                 // where it rises
  const mwB = new THREE.Vector3(Math.cos(M.rise * rad), 0, -Math.sin(M.rise * rad));                  // level, square to that, toward the south
  const mwZ = new THREE.Vector3(0, Math.cos(M.lean * rad), 0).addScaledVector(mwB, -Math.sin(M.lean * rad));   // its highest point
  const mwN = new THREE.Vector3().crossVectors(mwA, mwZ).normalize();                                 // its pole
  shared.sky.milkyway = { A: mwA, Z: mwZ, N: mwN, dir: (alongDeg, latDeg = 0) => { const a = alongDeg * rad, l = latDeg * rad; return new THREE.Vector3().addScaledVector(mwA, Math.cos(a) * Math.cos(l)).addScaledVector(mwZ, Math.sin(a) * Math.cos(l)).addScaledVector(mwN, Math.sin(l)); } };

  // ------------------------------------------------------------------------------------------ the sky: one sphere
  // how much of a direction is the snow cloud's wall (behind the boat): its sides stand at 28 degrees either side of dead
  // behind and spread to 41 at its foot; its top is a straight edge `top` degrees up. It hides what is behind it: the
  // stars, and the Milky Way where it sets.
  const WALL_GLSL = /* glsl */`
      float wallAt(vec3 d, float el, float top) {
        float az = degrees(abs(atan(-d.x, d.z))), side = mix(41.0, 28.0, clamp(el / max(top, 0.1), 0.0, 1.0));
        return (1.0 - smoothstep(side - 2.5, side + 2.5, az)) * (1.0 - smoothstep(top * 0.9, top * 1.0, el));
      }`;
  const S = P.sky;
  const skyU = {
    uVeil: sh.uVeil, uVeilColor: sh.uVeilColor, uFogColor: sh.uFogColor, uFogDensity: sh.uFogDensity, uTime: sh.uTime,
    uTopN: { value: col(S.night.top) }, uMidN: { value: col(S.night.mid) }, uHorN: { value: col(S.night.horizon) },
    uTopD: { value: linc(S.dawn.top) }, uMidD: { value: linc(S.dawn.mid) }, uMidDB: { value: linc(S.dawn.midBehind) }, uHorDA: { value: linc(S.dawn.horizonAhead) }, uHorDB: { value: linc(S.dawn.horizonBehind) },
    uHair: { value: linc(S.dawn.hairline) }, uBleed: { value: linc(S.dawn.bleed) }, uLilac: { value: linc(S.dawn.lilac) }, uSeam: { value: new THREE.Vector2(S.dawn.seam[0], S.dawn.seam[1]) },
    uLag: { value: new THREE.Vector4(S.dawn.early, S.dawn.high, S.dawn.west, S.dawn.latest) }, uTakes: { value: new THREE.Vector2(S.dawn.takes, S.dawn.by) },
    uWestBelt: { value: linc(S.dawn.westBars.belt) }, uWestShade: { value: linc(S.dawn.westBars.shade) }, uWest: { value: new THREE.Vector4(S.dawn.westBars.at, S.dawn.westBars.below, S.dawn.westBars.above, S.dawn.westBars.under) }, uWestK: { value: new THREE.Vector4(S.dawn.westBars.strength[0], S.dawn.westBars.strength[1], S.dawn.westBars.from[0], S.dawn.westBars.from[1]) },
    uMirrorLift: { value: new THREE.Vector2(0, S.dawn.mirrorLift) }, uMidAt: { value: S.midAt }, uDawn: { value: 0 }, uSeamIn: { value: 0 }, uDirect: { value: 1 }, uEyeY: { value: 1.12 }, uTear: { value: S.veilTear }, uAlpha: { value: 1 },
    uMist: { value: new THREE.Vector3(S.mist.top, S.mist.night, 0) }, uWestCirrus: { value: S.band.westCirrus ?? 0 },
    uMWA: { value: mwA }, uMWZ: { value: mwZ }, uMWN: { value: mwN }, uMWMap: { value: new THREE.Vector4(M.from * rad, M.span * rad, M.width * rad, M.gain) }, uMWGround: { value: col(M.ground) }, uMWFoot: { value: new THREE.Vector2(M.foot[0], M.foot[1]) }, uMWTint: { value: new THREE.Vector3(M.tint[0], M.tint[1], M.tint[2]) },
    uViolet: { value: col(C.violet) }, uRose: { value: col(C.rose) }, uJade: { value: col(S.aurora.color) }, uJadeCore: { value: col(S.aurora.coreColor) }, uFringe: { value: new THREE.Vector3(...S.aurora.fringe) },
    uAur: { value: new THREE.Vector4(0, 0, 0, 1) }, uAurBox: { value: new THREE.Vector4(S.aurora.az[0], S.aurora.az[1], S.aurora.roseAbove, S.aurora.core) }, uAurMove: { value: new THREE.Vector2(S.aurora.drift, S.aurora.travel) },
    uBand: { value: new THREE.Vector4(S.band.top, S.band.night, S.band.dawn, 1) }, uWall: { value: 9 }, uBandTurn: { value: 0 }, uBandFade: { value: new THREE.Vector3(S.band.fade[0], S.band.fade[1], S.band.wall[0]) }, uBandDawn: { value: new THREE.Vector3(S.band.fadeDawn[0], S.band.fadeDawn[1], S.band.cirrus) },
    tMW: { value: texMW }, tNA: { value: texNA }, tNB: { value: texNB }, tDA: { value: texDA }, tDB: { value: texDB },
  };
  const skyMat = new THREE.ShaderMaterial({
    uniforms: skyU, side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false,
    defines: { ...(texMW ? { MW_ART: '' } : {}), ...(haveNight ? { NIGHT_ART: '' } : {}), ...(haveDawn ? { DAWN_ART: '' } : {}) },
    vertexShader: /* glsl */`varying vec3 vDir; void main() { vDir = normalize(position); vec4 p = projectionMatrix * viewMatrix * vec4(position + cameraPosition, 1.0); gl_Position = p.xyww; }`,
    fragmentShader: /* glsl */`
      uniform vec3 uTopN, uMidN, uHorN, uTopD, uMidD, uMidDB, uHorDA, uHorDB, uHair, uBleed, uLilac, uVeilColor, uFogColor, uMWGround, uViolet, uRose, uJade, uJadeCore, uFringe, uWestBelt, uWestShade;
      uniform vec4 uWest, uWestK;
      uniform vec2 uSeam, uTakes, uMirrorLift; uniform vec4 uLag; uniform vec3 uBandFade, uBandDawn;
      uniform vec3 uMWA, uMWZ, uMWN, uMist, uMWTint; uniform vec4 uMWMap, uAur, uAurBox, uBand; uniform vec2 uAurMove, uMWFoot;
      uniform float uMidAt, uDawn, uSeamIn, uDirect, uEyeY, uTear, uVeil, uFogDensity, uTime, uWall, uBandTurn, uAlpha, uWestCirrus;
      uniform sampler2D tMW, tNA, tNB, tDA, tDB;
      varying vec3 vDir;
      ${NOISE_GLSL}
      float n1(float x) { float i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f); return mix(hash11(i), hash11(i + 1.0), f); }

      // the false dawn: one curtain with two folds in the north, and a fainter arc behind it
      vec3 aurora(vec3 d, float el) {
        float az = degrees(atan(-d.x, -d.z));                                  // 0 dead ahead, +90 north
        // (third pass) THE CURTAIN'S EAST END, which now stands in the forward view beside the Milky Way. It faded evenly over
        // twenty degrees and still ended as a wall: strokes of full height side by side, then none. A curtain thins out
        // into single rays: toward the end fewer and fewer strokes are there at all (each has its own number), those
        // that are stand shorter (the loop below) and fainter, and the last ones stand apart on the night.
        float eastK = smoothstep(uAurBox.x - 12.0, uAurBox.x + 16.0, az);
        float endF = fract(az * 2.7), endSide = smoothstep(0.0, 0.3, endF) * (1.0 - smoothstep(0.7, 1.0, endF));      // (a ray that stands alone has soft sides)
        float win = smoothstep(0.0, 0.14, eastK - 0.8 * hash11(floor(az * 2.7) * 1.37 + 3.1)) * mix(endSide, 1.0, eastK * eastK) * (0.25 + 0.75 * eastK) * (1.0 - smoothstep(uAurBox.y - 12.0, uAurBox.y + 8.0, az));
        if (win <= 0.0 || uAur.x <= 0.0) return vec3(0.0);
        float a01 = (az - uAurBox.x) / (uAurBox.y - uAurBox.x), un = uAur.y * 1.22;
        win *= smoothstep(1.0 - un, 1.0 - un + 0.12, a01 - 0.07 * hash11(floor(az * 2.7) * 1.37));      // it unrolls from the west (stroke by stroke: its leading edge is the brush's, not a ruled upright)
        float t = uAur.z, sum = 0.0, cap = 0.0;
        for (int j = 0; j < 2; j++) {
          float fj = float(j), q = az + uAurMove.x * t * (1.0 - 0.3 * fj);     // the folds drift east
          // (second pass) THE CURTAIN'S FOOT. It was a saw: noise a degree or two wide and three high gave it teeth, a range
          // of mountains hung upside down, the crudest thing in the night sky (postcards 3, 15, 16). The key painting's is
          // one long sweep with slow folds in it, drawn in upright brush strokes, each ending at a height of its own: a
          // COMB. So: the sweep and its folds (slow, they drift east); then every stroke (a third of a degree wide, and
          // hairs a third of that; they stand still in the sky) keeps one foot across its whole width.
          float base = 9.0 + 5.0 * fj + 4.5 * sin(radians(q * 3.1 + 40.0 * fj)) + 2.0 * sin(radians(q * 7.3 + 90.0 * fj)) + 2.6 * (n1(q * 0.12 + 17.0 * fj) - 0.5);
          float st = az * 2.7 + 31.0 * fj, sid = floor(st), sf = fract(st), sk = smoothstep(0.72, 1.0, sf);
          float st2 = az * 8.3 + 7.0 * fj, sid2 = floor(st2), sk2 = smoothstep(0.6, 1.0, fract(st2));
          float own = mix(hash11(sid * 1.37 + 5.0 * fj), hash11((sid + 1.0) * 1.37 + 5.0 * fj), sk);            // this stroke's own number (it gives way to its neighbour only at its edge)
          float hair = mix(hash11(sid2 * 2.11 + 3.0 * fj), hash11((sid2 + 1.0) * 2.11 + 3.0 * fj), sk2);
          base += 1.7 * (own - 0.5) + 0.7 * (hair - 0.5);
          float high = (25.0 - 7.0 * fj) * (0.78 + 0.22 * sin(radians(q * 4.7 + 60.0 * fj)));
          // (third pass) THE VALUES OF THE CURTAIN. Every stroke was as tall as its neighbours and died evenly up its whole
          // height: a sheet of frosted glass, where the key painting has a bright foot, a dark body and ragged tops. Each
          // stroke now has a length of its own (0.62 to 1.38 of the fold's), and its light is a bright band at the foot
          // that dies in the first fifth of its height, over a much fainter body: the green lies low, the body is the
          // night's blue showing through, and the rose of the fringe stands apart over it.
          float tall = mix(hash11(sid * 3.71 + 9.0 * fj), hash11((sid + 1.0) * 3.71 + 9.0 * fj), sk);
          high *= (0.62 + 0.76 * tall) * (0.45 + 0.55 * eastK);
          float y = (el - base) / high;
          float prof = smoothstep(-0.05, 0.025, y) * (0.56 * exp(-7.0 * max(y, 0.0)) + 0.6 * exp(-2.7 * max(y, 0.0))) * (1.0 - smoothstep(0.75, 1.25, y));
          // (and under the foot a few strokes run on downward, thin and faint, where the brush was dragged out)
          prof += 0.22 * step(0.62, hair) * smoothstep(-0.16 - 0.2 * own, -0.03, y) * (1.0 - smoothstep(-0.03, 0.02, y));
          float rays = n1(q * 0.55 + 11.0 * fj) * 0.6 + n1(q * 1.9 + 3.0 * fj) * 0.4;
          rays = 0.09 + 0.91 * smoothstep(0.25, 0.8, rays) * (0.4 + 0.6 * n1(q * 3.3 + 7.0 * fj));      // rays in dry-brush widths, upright      // (third pass: the dark between two rays is darker, 0.16 -> 0.09)
          rays *= (0.56 + 0.88 * own) * (0.8 + 0.4 * hair);                                              // (each stroke with its own load of paint)      // (third pass: 0.72..1.28 -> 0.56..1.44)
          sum += prof * rays * (1.0 - 0.4 * fj);
          cap += smoothstep(0.5, 0.9, y) * (1.0 - smoothstep(1.0, 1.45, y)) * mix(rays, 0.5, 0.45) * (1.0 - 0.4 * fj);   // the rays' upper ends      // (third pass: softer than the rays below them, or the fringe is a bar code)
        }
        float arc = 0.2 * exp(-pow((el - 15.0) / 4.5, 2.0)) * (0.65 + 0.35 * n1(az * 0.21 + 5.0));
        float wave = 0.78 + 0.22 * sin(radians((az - uAurMove.y * t) * 3.6));   // a brightness travels along the curtain
        float I = (sum + arc) * wave * win * uAur.x * uAur.w * smoothstep(4.0, 7.5, el);
        // a rose fringe, only above 30 degrees: the rays' upper ends, where the jade has thinned to nothing, are given a
        // dusty rose light of their own (the key painting's fringe is seen as #745686: rose and nebula violet, about a
        // quarter of each), and it ends with the curtain at 42 degrees
        float fringe = smoothstep(uAurBox.z - 4.0, uAurBox.z + 3.0, el) * (1.0 - smoothstep(38.0, 43.0, el));
        vec3 c = mix(uJade, uJadeCore, smoothstep(0.5, 1.05, I)) * I * uAurBox.w;
        return c + uFringe * (cap * fringe * wave * win * uAur.x * uAur.w);
      }

      ${WALL_GLSL}
      float gSeam = 0.0;                                                       // (how much of this pixel is the first hairline: it is spared the mist)
      // the sky itself, as a function of direction: the same function is drawn into the water's mirror
      vec3 skyAt(vec3 d) {
        float el = degrees(asin(clamp(d.y, 0.0, 1.0)));
        float ahead = smoothstep(-0.35, 0.9, -d.z / max(length(d.xz), 1e-4));  // 1 dead ahead (east), 0 behind
        // ---- night
        vec3 n = el < uMidAt ? mix(uHorN, uMidN, smoothstep(0.0, uMidAt, el)) : mix(uMidN, uTopN, smoothstep(uMidAt, 90.0, el));
        // ---- first light, as the page's table gives it: ultramarine overhead, periwinkle at 25 degrees, and under that a
        // bar of greyed lilac (ahead) or the lilac-grey of the west (behind) down to the seam: a sky in bars, each melting
        // into the next. Ahead the seam is apricot under a hairline of green-gold. (The painted band, below, is the lowest
        // sky: the far ranges, the mist, the glow, the cloud's wall; above it only its cirrus is kept.)
        vec3 midD = mix(uMidDB, uMidD, pow(ahead, 1.5)), lowD = mix(uHorDB, uLilac, ahead);      // (the sky at 25 degrees is palest toward the light and holds its depth to the north and west: the white ridge stands against it)
        // (BEHIND THE WIND the water is no longer one level mirror: every wavelet leans, and what the lake gives back is the
        // sky a hand higher than the mirror's angle says. So in the water's picture of the sky, and only once the wind has
        // let the mirror go, the low sky's bar of greyed lilac is read as the periwinkle above it: the lake is blue, and
        // the apricot keeps to the seam and its own reflection. A level mirror of the lilac bar made the whole lake mauve.)
        float elG = mix(el, max(el, uMirrorLift.y), uMirrorLift.x * (1.0 - uDirect));
        vec3 dn = elG < uMidAt ? mix(lowD, midD, smoothstep(5.0, uMidAt, elG)) : mix(midD, uTopD, smoothstep(uMidAt, 90.0, elG));
        // (third pass) THE WEST IN BARS: the earth's shadow on the horizon, a band of slate blue, and over it the belt of
        // rose-lilac (plan.sky.dawn.westBars). Only away from the light, and last of all the dawn's colours. In the water's
        // picture it is read with elG as the rest is: an exact mirror gives it back, the wind's water does not.
        { float backW = smoothstep(0.1, 0.9, d.z / max(length(d.xz), 1e-4)) * smoothstep(uWestK.z, uWestK.w, uDawn);
          float wb = (elG - uWest.x) / (elG < uWest.x ? uWest.y : uWest.z);
          dn = mix(dn, uWestShade, (1.0 - smoothstep(uWest.w * 0.6, uWest.w * 1.6, elG)) * backW * uWestK.y);
          dn = mix(dn, uWestBelt, exp(-wb * wb) * backW * uWestK.x); }
        float seamTop = mix(uSeam.x, uSeam.y, smoothstep(0.2, 1.0, uDawn));     // it is a hairline first
        float seamWide = pow(ahead, mix(6.0, 2.5, smoothstep(0.1, 0.6, uDawn)));      // first only the 50 degrees either side of dead ahead; never round to the north and south
        float seamMask = seamWide * (1.0 - smoothstep(seamTop * 0.7, seamTop * 1.9, el));
        vec3 seamCol = mix(vec3(1.0, 0.44, 0.16), uHorDA, smoothstep(0.35, 1.0, uDawn));      // (the seam is typed for the dawn's exposure: under the night's it is a red-hot wire, so it starts as plain apricot)
        // (between apricot and lilac lies the hairline of pale green-gold: without it the two mix to pink;
        // and a pale chalk warmth that thins upward into the lilac over ten degrees: neither pink nor a rainbow)
        float warm = smoothstep(0.3, 0.75, uDawn);
        dn = mix(dn, uBleed, 0.55 * seamWide * (1.0 - smoothstep(seamTop * 0.9, 1.0 + seamTop * 3.6, el)) * warm * (1.0 - 0.85 * uMirrorLift.x * (1.0 - uDirect)));      // (not in the ruffled water's picture: there the warmth keeps to the seam)
        dn = mix(dn, uHair, 0.7 * seamWide * exp(-pow((el - seamTop * 1.3) / (0.1 + 0.1 * seamTop), 2.0)) * warm);
        dn = mix(dn, seamCol, seamMask);
        // first light does not come to the whole sky at once: the low east first, the zenith and the west last. How late a
        // part of the sky turns rises SMOOTHLY with its height (to 75 degrees), so the light climbs the sky without an edge
        // (a step at 14 degrees made a dark lid over a bright band)
        // (and away from the light there is no "low first": the west turns late and all of a piece, its horizon last of all)
        float startE = uLag.x + uLag.y * (0.75 * pow(smoothstep(0.0, uTakes.y, el), 0.6) + 0.25 * pow(smoothstep(uTakes.y, 60.0, el), 0.4)), startW = mix(uLag.x + uLag.z, uLag.x + uLag.y, smoothstep(8.0, 60.0, el));
        float start = min(mix(startW, startE, ahead), uLag.w);
        float de = smoothstep(start, min(start + uTakes.x, 1.0), uDawn);
        // the seam comes before the rest of the dawn: at s 170 the hairline of apricot is there on a sky still night (by
        // distance, plan.seamIn: the dawn clock has hardly started there), the first horizon of the area
        float seam = seamMask * uSeamIn;
        vec3 c = pow(mix(sqrt(n), sqrt(dn), de), vec3(2.0));                  // (mixed as the eye weighs light, or a tenth of the dawn already doubles the night)
        // ---- the painted horizon band: a full circle from the seam to 30 degrees, in two halves (ahead, behind)
        float azA = atan(d.x, -d.z), azB = atan(-d.x, d.z);                    // from dead ahead (its jump is behind), from dead behind (its jump is ahead)
        float behind = 1.0 - smoothstep(0.55, 0.85, abs(azB) / 3.14159265 * 2.0);      // 1 within about 50 degrees of dead behind
        float wallK = mix(1.0, uWall / uBandFade.z, behind);                   // the snow cloud's wall sinks as the boat goes on
        float bv = el / (uBand.x * wallK);
        // (the painted cloud's top is one ruled line eighty degrees long; a trailing edge is straight, not ruled: behind the
        // boat the band is read with a slow lift and fall of a few tenths of a degree)
        // (stage 2d: more of it, in three sizes: the wall's top heaves in long swells and small ones, as a bank of cloud does;
        // at a tenth and a twentieth it was still a slab with a ruled edge, the weakest picture of the night)
        bv *= 1.0 + behind * (0.24 * (n1(degrees(azB) * 0.075 + 3.0) - 0.5) + 0.12 * (n1(degrees(azB) * 0.27 + 1.7) - 0.5) + 0.05 * (n1(degrees(azB) * 0.9 + 6.1) - 0.5));
        float wallSoft = 4.0 * behind * exp(-pow((bv - 0.293) / 0.034, 2.0));      // (0.293: where the cloud's top lies in the painting, measured)      // (and its ruled top line is read from a softer copy of the painting: an edge of cloud, not a wire)
        vec2 ua = vec2(azA / 3.14159265 + 0.5, bv), ub = vec2(azB / 3.14159265 + 0.5, bv);
        #if defined(NIGHT_ART) || defined(DAWN_ART)
          float bmask = (1.0 - smoothstep(uBandFade.x, uBandFade.y, bv)) * step(bv, 1.0);
          // The dawn's painting is the sky only as high as its far ranges and its mist; toward the light, where it holds the
          // glow, to 3 degrees and gone by 7; behind, as high as the cloud's wall. The two paintings cross over by ONE clock
          // for the whole circle (between e 0.12 and 0.55), so the far ranges are never between two pictures; the page's own
          // sky (which turns part by part) shows above them.
          float gc = pow(ahead, 3.0), cross = smoothstep(0.12, 0.55, uDawn);
          float bmaskD = (1.0 - smoothstep(mix(mix(uBandDawn.x, 0.10, gc), 0.34, behind), mix(mix(uBandDawn.y, 0.23, gc), 0.52, behind), bv)) * step(bv, 1.0);
          float dawnW = bmaskD * cross;
        #endif
        #ifdef NIGHT_ART
          vec3 bnA = texture2D(tNA, ua).rgb, bnB = texture2D(tNB, ub, wallSoft).rgb, bn = d.z < 0.0 ? bnA : bnB;      // (both read outside the choice: each has its jump where the other is used)
        #else
          // (until the painting is in: the snow cloud's trailing edge, a pale straight-edged wall across 70 degrees of the west)
          float wallW = 1.0 - smoothstep(30.0, 37.0, degrees(abs(azB)));
          float wall = wallW * (1.0 - smoothstep(uWall - 0.5, uWall + 0.25, el + 0.5 * n1(degrees(azB) * 0.4)));
        #endif
        #ifdef DAWN_ART
          vec3 bdA = texture2D(tDA, ua).rgb, bdB = texture2D(tDB, ub, wallSoft).rgb, bd = d.z < 0.0 ? bdA : bdB;
        #endif
        #ifdef NIGHT_ART
          c = mix(c, bn * uBand.y, bmask * (1.0 - cross));
          // (the snow cloud's own modelling, its lit billows, laid once more over the wall: what is left of the painting when
          // a very soft copy of it is taken away. A wall of cloud with towers in it, not a pane of pale glass)
          c += max(bnB - textureLod(tNB, ub, 5.0).rgb, 0.0) * (uBand.y * 1.1 * behind * bmask * (1.0 - cross) * step(0.0, d.z));
        #else
          c = mix(c, mix(uHorN * 1.5 + vec3(0.012, 0.014, 0.03), uHorDB * 0.92, de), wall * 0.8);
        #endif
        #ifdef DAWN_ART
          // (behind, the painting's own sky is a dusk blue far deeper than the page's: there only what is LIGHTER than the sky
          // is taken from it, which is the cloud's wall and the mist under it)
          float lighter = smoothstep(-0.09, -0.01, dot(bd * uBand.z - c, vec3(0.3, 0.55, 0.15)));
          bd = mix(bd, mix(vec3(dot(bd, vec3(0.3, 0.55, 0.15))), bd, 0.45), behind);      // (and its rose rim greyed to lavender: at full strength it is neon)
          c = mix(c, bd * uBand.z, dawnW * mix(1.0, lighter, behind));
          // (the dawn's band comes in under the night's exposure, and a little apricot laid over ultramarine is magenta: from
          // s 200 to s 212 the first band was a coral pink. While the glow is young its blue is held under its green, so the
          // first band is an ember of the apricot it becomes, never a rose)
          { float young = clamp(2.5 * dawnW * (1.0 - smoothstep(0.3, 0.62, uDawn)), 0.0, 1.0) * (1.0 - behind) * smoothstep(0.0, 0.2, bd.r - bd.b);
            c.b = mix(c.b, min(c.b, c.g * 0.8), young); }
          // above its own low sky the painting gives only its cirrus: what is left of it when its smooth sky is taken away
          // (the picture less a very soft copy of itself), laid over the page's colours at a part of its strength
          vec3 softA = textureLod(tDA, ua, 6.0).rgb, softB = textureLod(tDB, ub, 6.0).rgb, soft = d.z < 0.0 ? softA : softB;
          vec3 cirrus = bd - soft; cirrus = mix(vec3(dot(cirrus, vec3(0.3, 0.55, 0.15))), cirrus, 0.55);      // (greyed: feathers lit dusty pink, not pink paint)
          c = max(c + cirrus * (uBand.z * uBandDawn.z * de * (1.0 - bmaskD) * (1.0 - smoothstep(0.75, 1.0, bv)) * step(bv, 1.0)), 0.0);
          // (second pass) THE WEST HAS FEATHERS OF ITS OWN. The painting's western half is bare above its cloud, and the last
          // picture of the ride (the lamp you lit, looking back) had an empty sky over it. High cirrus in the west is the
          // first thing the sun finds: the eastern half's feathers, turned over into the west, greyed further toward
          // lavender and fainter, between 9 and 28 degrees; none at the north and south points, where the two halves meet.
          if (d.z > 0.0 && uWestCirrus > 0.0) {
            vec2 um = vec2(1.0 - ub.x, el / uBand.x);
            vec3 cw = texture2D(tDA, um).rgb - textureLod(tDA, um, 6.0).rgb; cw = mix(vec3(dot(cw, vec3(0.3, 0.55, 0.15))), cw, 0.4);
            c = max(c + cw * (uBand.z * uWestCirrus * de * smoothstep(0.05, 0.6, d.z / max(length(d.xz), 1e-4)) * smoothstep(0.3, 0.5, um.y) * (1.0 - smoothstep(0.78, 0.95, um.y))), 0.0);
          }
        #endif
        gSeam = seam * (1.0 - de);
        c = mix(c, seamCol, gSeam);                                // the first hairline lies over the night's band (the dawn's band brings its own)
        // ---- the Milky Way, on end: additive, along its great circle
        vec3 m = vec3(dot(d, uMWA), dot(d, uMWZ), dot(d, uMWN));
        float along = atan(m.y, m.x), lat = asin(clamp(m.z, -1.0, 1.0));
        vec2 uv = vec2((along - uMWMap.x) / uMWMap.y, 0.5 + lat / uMWMap.z);
        float mwFade = (1.0 - de) * (1.0 - smoothstep(0.45, 0.9, uDawn));
        if (uv.x > 0.0 && uv.x < 1.0 && uv.y > 0.0 && uv.y < 1.0 && mwFade > 0.0) {
          float edge = smoothstep(0.0, 0.05, uv.x) * (1.0 - smoothstep(0.9, 1.0, uv.x)) * smoothstep(0.0, 0.14, uv.y) * (1.0 - smoothstep(0.86, 1.0, uv.y));
          #ifdef MW_ART
            vec3 mw = max(texture2D(tMW, uv).rgb - uMWGround, 0.0) * uMWTint;
          #else
            // (until the painting is in: cloud in violet with knots of rose and a dark lane, so that the picture can be judged)
            float w = exp(-pow((uv.y - 0.5) / 0.2, 2.0)), cl = fbm(vec2(uv.x * 9.0, uv.y * 3.0) + 3.0), kn = fbm(vec2(uv.x * 23.0, uv.y * 8.0) + 11.0);
            float lane = 1.0 - 0.8 * exp(-pow((uv.y - 0.47 - 0.05 * sin(uv.x * 12.0)) / 0.045, 2.0)) * smoothstep(0.25, 0.6, fbm(vec2(uv.x * 6.0, 1.0)));
            vec3 mw = (uViolet * (0.25 + 0.75 * smoothstep(0.3, 0.75, cl)) + uRose * 0.5 * smoothstep(0.55, 0.8, kn)) * w * lane * 0.42 * (0.55 + 0.6 * exp(-pow((uv.x - 0.33) / 0.22, 2.0)));
          #endif
          c += mw * edge * uMWMap.w * mwFade * smoothstep(uMWFoot.x, uMWFoot.y, el) * (1.0 - 0.9 * wallAt(d, el, uWall));      // (it sets behind the cloud, not in front of it)
        }
        // ---- the false dawn
        c += aurora(d, el) * (1.0 - de);
        // ---- a line of mist all round, a degree high: the same in the air and in the water
        c = mix(c, uFogColor, uMist.y * (1.0 - smoothstep(0.0, uMist.x, el)) * (1.0 - 0.85 * gSeam));      // (the first hairline shows through the mist line: it is the one thing on the seam)
        return c;
      }
      void main() {
        vec3 d = normalize(vDir);
        d.y = abs(d.y);                                                        // under the horizon: the same sky (only ever seen through the water)
        vec3 c = skyAt(d);
        // the water fades into the fog colour with distance; the low sky does the same, by the same formula, so that the
        // seam is one soft line of mist with the same picture above and below it. Not in the mirror: the water adds it there.
        float far = uEyeY / max(d.y, 1e-4);
        c = mix(c, uFogColor, uDirect * (1.0 - exp(-uFogDensity * uFogDensity * far * far)) * (1.0 - 0.85 * gSeam));
        // the entry mist tears from the top down
        float veil = clamp(uVeil - uTear * d.y * (1.0 - uVeil), 0.0, 1.0);     // (on the seam exactly the veil the far water and far things take, or they stand dark in it; higher up it lets go sooner)
        // (third pass) THE MIST HAS NO HORIZON. The far water inside the veil is the fog's colour (which the engine brings
        // most of the way to the veil's, never all of it); the sky over it was the veil's own colour, a shade paler, and the
        // seam stood in the mist as a ruled line for the six seconds before the image whose whole point is that there
        // is no horizon. On the seam the sky goes to the fog's colour as the water does, and to the veil's a hand higher.
        gl_FragColor = vec4(mix(c, mix(uFogColor, uVeilColor, smoothstep(0.0, 0.14, d.y)), veil), uAlpha);              // (alpha: the crisp sky's mark, below)
      }`,
  });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 24), skyMat);
  dome.name = 'sky-dome'; dome.renderOrder = -1000; dome.frustumCulled = false;
  // THE CRISP SKY. The painter's filter runs over the picture and never over the water, so a filtered sky and its
  // reflection are two pictures (faint stars lose half their light above and none below). While the mirror must be exact
  // the sky marks itself in the picture's alpha as the engine's thin things do (CRISP_ALPHA, src/engine/gouache.js) and the
  // filter leaves it as drawn: the page's `paint` 0.5 can then run over everything built. When the wind lets the mirror
  // go the mark is eased off and the sky is painted like the rest. Only in the picture itself: not in the mirror, nor in
  // the engine's picture of the scene without the water.
  let skyMark = -15;
  dome.onBeforeRender = (renderer, scene, camera) => {
    skyU.uDirect.value = engine.reflecting ? 0 : 1; if (!engine.reflecting) skyU.uEyeY.value = Math.max(0.2, camera.matrixWorld.elements[13]);
    skyU.uAlpha.value = engine.reflecting || renderer.getRenderTarget() === engine.pre ? 1 : skyMark;
    skyMat.uniformsNeedUpdate = true;
  };
  ctx.add(dome);

  // ------------------------------------------------------------------------------------------ the stars
  // 2,600 in four sizes, twice as dense in the Milky Way; they scintillate slowly, one in twelve breathes toward jade
  // or rose, and at dawn the faintest go first. Drawn as angles, so the water holds the same stars (cast row 1).
  {
    const St = S.stars, rnd = ctx.rng(St.seed), list = [], total = St.sizes.reduce((a, g) => a + g.n, 0);
    const inBand = (M.density - 1) * 0.37 / (1 + (M.density - 1) * 0.37), lowY = Math.sin(St.low * rad), gauss = () => (rnd() + rnd() + rnd() - 1.5) * 1.15;
    let k = 0;
    for (const g of St.sizes) for (let i = 0; i < g.n; i++, k++) {
      let d;
      for (let tries = 0; tries < 40; tries++) {
        if (rnd() < inBand) d = shared.sky.milkyway.dir(rnd() * 180, gauss() * 13);
        else { const y = lowY + (1 - lowY) * rnd(), r = Math.sqrt(1 - y * y), a = rnd() * Math.PI * 2; d = new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r); }
        if (d.y > lowY) break;
      }
      const breathes = rnd() < St.breathers ? (rnd() < 0.5 ? 1 : 2) : 0;
      list.push({ dir: [d.x, d.y, d.z], size: g.px * (0.92 + 0.16 * rnd()), light: lerp(g.light[0], g.light[1], rnd() * rnd()), halo: g.halo ? 0.6 + 0.4 * rnd() : 0, rank: clamp01((k + (rnd() - 0.5) * 240) / total),
        phase: rnd(), rate: lerp(St.rate[0], St.rate[1], rnd()), color: St.colors[Math.floor(rnd() * St.colors.length)], tintTo: breathes });
    }
    const stars = sky.dabs(list, { sky: true, twinkle: St.twinkle, fade: St.fade, low: St.low, veilTear: S.veilTear, seed: St.seed + 1,
      extend: { uniforms: { uMist: skyU.uMist, uEyeY: skyU.uEyeY, uWall: skyU.uWall, uJadeT: { value: col(C.jade).lerp(col(C.starWhite), 0.35) }, uRoseT: { value: col(C.rose).lerp(col(C.starWhite), 0.35) } },
        pars: `uniform vec3 uMist, uJadeT, uRoseT; uniform float uEyeY, uWall; ${WALL_GLSL}`,
        vertex: /* glsl */`
          if (aDabB.w > 0.5) tint = mix(tint, aDabB.w > 1.5 ? uRoseT : uJadeT, 0.4 + 0.4 * sin(uTime * 0.23 + aDabB.x * 40.0));
          { float el = degrees(asin(clamp(p.y, 0.0, 1.0))), far = uEyeY / max(p.y, 1e-4);
            light *= 1.0 - uMist.y * (1.0 - smoothstep(0.0, uMist.x, el));                       // the mist line swallows the lowest stars
            light *= 1.0 - 0.95 * wallAt(p, el, uWall);                                          // and the snow cloud's wall hides those behind it
            light *= 1.0 - uPass.z * (1.0 - exp(-uFogDensity * uFogDensity * far * far)); }      // and the air above the seam, as the water's does below it` } });
    stars.points.name = 'stars';
    sky.stars = stars;
  }

  // ------------------------------------------------------------------------------------------ the lake bed
  const uBedLamp = { value: P.light.bed.lantern };      // how many times over the sand takes a lamp's light (update: by night several, by first light once)
  // Pale rippled sand a hand under the surface (a finger at the soft edges), painted: the `lakebed` picture's swatches on
  // the bed's mesh. Along the line fine ripple marks, their crests across the current, 8 cm apart, with patches where
  // they break up round scour hollows and patches of pebbles; toward the soft edges the sand lies under a skin of salt,
  // crazed, then hard crust, and a NET OF CRUST POLYGONS rises from it until its ridges break the surface as hairlines
  // across the reflected stars (the page's close band, "the last 10 m before each edge"). At night the sand takes almost
  // no light from the sky (uBedLight): it shows in the lantern's pool and round a fallen star. From dawn progress 0.35
  // caustic nets lie on it wherever the water moves (the boat's rings; everywhere once the wind has come).
  // Nothing of the bed writes depth and none of it is in the mirror: the lights on the bed are points a hand above it,
  // drawn after the water, and a bed that wrote depth would cut each one in half along its middle.
  const LB = P.lakeBed, bedState = {};
  {
    const flat = new THREE.DataTexture(new Uint8Array([128, 128, 128, 255]), 1, 1); flat.needsUpdate = true;
    const T = LB.tile, bedU = sky.bedUniforms = {
      tBed: { value: texBed || flat }, tBedCrust: sky.tiles.tCrust, uBedTrough: { value: col(LB.trough) }, uBedCrest: { value: LB.crest[0] },      // (uBedCrest: how far over the sand's own colour a crest is painted: by night, in a lamp's pool, well over; by day hardly)
      uBedTile: { value: new THREE.Vector4(1 / T.ripple, 1 / T.hollows, 1 / T.pebbles, 1 / T.crazed) },
    };
    // (the bed's paint as a function of place, published so that whatever lights the sand can draw the same sand: the cast's
    // pools round the fallen stars should use this with sky.bedUniforms spread into their material's uniforms)
    const BED_PAINT_GLSL = sky.BED_PAINT_GLSL = /* glsl */`
      uniform sampler2D tBed, tBedCrust; uniform vec4 uBedTile; uniform vec3 uBedTrough; uniform float uBedCrest;
      // the height of the bed's paint at a place (0 in a trough .. 1 on a crest). edge: 0 along the line .. 1 at the soft edges
      float bedPaint(vec2 w, float edge) {
        // (the slow cloud, read blurred: only its broad shapes, metres across. Read sharp, its finest grain switched the two
        // layings of the ripples every hand's breadth and the bed was a maze of worms)
        float c1 = texture2D(tBedCrust, w * 0.019 + vec2(0.37, 0.61), 2.0).b, c2 = texture2D(tBedCrust, w * 0.023 + vec2(0.83, 0.19), 2.0).b, c3 = texture2D(tBedCrust, w * 0.05 + vec2(0.5, 0.27), 3.5).b;
        // the crests waver over tens of metres (the cloud read very blurred: any grain in it finer than a metre moves a crest
        // by its own width and the ripple marks become a contour map)
        vec2 q = w + 0.9 * (vec2(texture2D(tBedCrust, w * 0.006 + vec2(0.11, 0.73), 7.0).b, texture2D(tBedCrust, w * 0.006 + vec2(0.57, 0.29), 7.0).b) - 0.5);
        // (two layings of the one swatch, changing over in patches, so that no fork in the ripples is seen twice)
        float rip = mix(texture2D(tBed, q * uBedTile.x).r, texture2D(tBed, (q + vec2(5.3, 2.9)) * (uBedTile.x * 1.13)).r, smoothstep(0.4, 0.6, c3));
        // (scour hollows in a few small patches only, laid two ways: the one swatch repeated over a wide patch was a tray of
        // dimples; pebbles in patches a little larger)
        float mH = smoothstep(0.7, 0.8, c1) * smoothstep(0.35, 0.6, c3), mP = smoothstep(0.64, 0.76, c2) * (1.0 - mH);
        float hol = mix(texture2D(tBed, (w + 3.7) * uBedTile.y).g, texture2D(tBed, (w.yx * vec2(1.0, -1.0) + 9.1) * (uBedTile.y * 0.81)).g, smoothstep(0.45, 0.55, c2));
        float h = mix(mix(rip, mix(rip, hol, 0.8), mH), texture2D(tBed, (w.yx + 1.3) * uBedTile.z).b, mP);
        // (second pass: the big shapes before the fine ones. Across the current lie long low bars of firmer sand where the
        // marks stand crisp; between them, hollows a pace wide where silt has settled, the marks soft and the sand a shade
        // deeper. One even sheet of marks from the hull to the mirror was corduroy; plan.lakeBed.bars)
        float bar = smoothstep(0.36, 0.64, texture2D(tBedCrust, vec2(w.x * ${LB.bars.along.toFixed(4)} + 0.31, w.y * ${LB.bars.across.toFixed(4)} + 0.07), 1.5).b + 0.3 * (c3 - 0.5));
        h = mix(0.5 + (h - 0.5) * ${LB.bars.keep.toFixed(3)} - ${LB.bars.deeper.toFixed(3)}, h, bar);
        float e1 = smoothstep(0.2, 0.75, edge + (c3 - 0.5) * 0.35), e2 = smoothstep(0.8, 1.05, edge + (c3 - 0.5) * 0.3);
        h = mix(h, texture2D(tBedCrust, w * uBedTile.w).g, e1);                // under a skin of salt: crazed
        return mix(h, texture2D(tBedCrust, w * (uBedTile.w * 0.7) + 0.4).r, e2);      // then hard crust
      }
      // the bed's colour as a multiple of pale sand: lilac-blue shade in the troughs, the sand itself on the crests; paler under salt
      vec3 bedColour(float h, float edge) {
        vec3 c = mix(uBedTrough, vec3(uBedTile.w > 0.0 ? uBedCrest : 1.0), smoothstep(0.08, 0.92, h));
        return mix(c, mix(vec3(0.62, 0.62, 0.9), vec3(uBedCrest * 1.08), h), smoothstep(0.25, 0.8, edge));
      }`;
    // (the old ripple marks, kept for whoever still draws with them: the cast's stand-in pools. They now lie as the painting's
    // do, crests across the current, so a pool and the bed under it agree until the cast draws its pools with bedPaint)
    const BED_MARKS_GLSL = sky.BED_MARKS_GLSL = /* glsl */`
      float bedMarks(vec2 w) {
        vec2 q = w + 0.35 * vec2(sin(w.y * 0.9 + w.x * 0.31), sin(w.x * 0.7 - w.y * 0.23));
        float ph = (q.x * 0.07 + q.y * 0.998) * 78.5 + 1.6 * sin(q.x * 3.1 + q.y * 1.7);
        return sin(ph) * (1.0 - smoothstep(0.5, 1.6, fwidth(ph)));      // the marks go as soon as they are finer than the picture can draw (or they beat into bands)
      }`;
    const depthAt = (s, d) => lerp(P.depth.line, P.depth.edge, s < 150 ? smooth(24, 36, Math.abs(d)) : s > 232 ? smooth(20, 32, Math.abs(d)) : 0);      // the water thins from a hand to a finger at the soft edges
    const W = 300, L = 420, nx = 60, nz = 84, geo = new THREE.PlaneGeometry(W, L, nx, nz), pos = geo.attributes.position, tmp = {}, edges = new Float32Array(pos.count);
    geo.rotateX(-Math.PI / 2);
    const mid = kit.at(165, 0);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i) + mid.x, z = pos.getZ(i) + mid.z, loc = ctx.path.locate(x, z, null, tmp), s = loc.s, d = Math.abs(loc.d);
      edges[i] = s < 150 ? smooth(24, 36, d) : s > 232 ? smooth(20, 32, d) : 0;
      pos.setXYZ(i, x, -depthAt(s, d), z);
    }
    geo.setAttribute('aEdge', new THREE.BufferAttribute(edges, 1));
    geo.computeVertexNormals();
    const Ca = LB.caustics, uBedCaustic = bedState.caustic = { value: new THREE.Vector4(0, Ca.speed, 0, 1 / Ca.size) };
    const bed = new THREE.Mesh(geo, sky.paint({ color: C.sand, brush: 0.35, bed: true, extend: {
      uniforms: { uBedLamp, ...bedU, uBedCaustic, uBedCausticColor: { value: col(Ca.color) } },
      vertexPars: 'attribute float aEdge; varying float vBedEdge;', vertexLocal: 'vBedEdge = aEdge;',
      fragmentPars: `uniform float uBedLamp; uniform vec4 uBedCaustic; uniform vec3 uBedCausticColor; varying float vBedEdge; ${BED_PAINT_GLSL}`,
      albedo: 'albedo *= bedColour(bedPaint(vWPos.xz, vBedEdge), vBedEdge);',
      // (the water over the sand is a mirror: 14 parts in a hundred of the bed come through it looking straight down, 3 at
      // five metres. For the lantern's pool to be pale rippled sand and not a violet haze the sand takes the lantern's
      // light several times over)
      light: /* glsl */`c += albedo * lamps * uBedLamp;
        if (uBedCaustic.x > 0.001) {      // caustic nets: where the water moves (uBedCaustic.z: everywhere, once the wind has come)
          vec2 ruv = (vWPos.xz - uRippleRect.xy) / uRippleRect.zw + 0.5;
          float moved = (ruv.x > 0.0 && ruv.x < 1.0 && ruv.y > 0.0 && ruv.y < 1.0) ? clamp(texture2D(tRipple, ruv).a * 3.0, 0.0, 1.0) : 0.0;
          c += uBedCausticColor * (min(causticAt(vWPos.xz * uBedCaustic.w, uTime * uBedCaustic.y), 4.0) * uBedCaustic.x * mix(moved, 1.0, uBedCaustic.z)) * (0.35 + 0.65 * albedo);
        }` } }));
    bed.name = 'lake bed'; bed.frustumCulled = false; bed.renderOrder = -6;
    bedState.color = bed.material.uniforms.uColor.value; bedState.night = col(LB.nightSand); bedState.day = col(LB.dawnSand);
    bed.material.depthWrite = false;
    ctx.only(bed, 'direct');                                                   // nothing under the surface is in the mirror
    ctx.add(bed);

    // ---- the net of crust polygons (cells 0.6 to 1.4 m): the cells of a scattered grid, edge by edge
    const N = LB.net, g = N.cell;
    const hash2 = (i, j, k) => { let h = (i * 374761393 + j * 668265263 + k * 1274126177 + N.seed * 974711) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
    const site = (i, j) => [(i + 0.5 + (hash2(i, j, 1) - 0.5) * N.jitter) * g, (j + 0.5 + (hash2(i, j, 2) - 0.5) * N.jitter) * g];      // [s, d]
    const trap = (v, t) => (v <= t[0] || v >= t[3] ? 0 : v < t[1] ? (v - t[0]) / (t[1] - t[0]) : v <= t[2] ? 1 : (t[3] - v) / (t[3] - t[2]));
    // how far a ridge has risen at a place: 0 none, 1 breaking the surface
    const risen = (s, d) => {
      const a = Math.abs(d);
      let k = trap(a, N.mirror.d) * smooth(N.mirror.s[0], N.mirror.s[0] + N.ends, s) * (1 - smooth(N.mirror.s[1] - N.ends, N.mirror.s[1], s));
      if (d > 0) k = Math.max(k, trap(a, N.flats.d) * smooth(N.flats.s[0], N.flats.s[0] + N.ends, s));
      else k = Math.max(k, trap(a, N.flatsLeft.d) * smooth(N.flats.s[0], N.flats.s[0] + N.ends, s));      // (beyond d -22 the crust terraces are the Shallows group's)
      return k;
    };
    // The net is grown a few milliseconds a frame, after the area is built (bedState.job; update() steps it): 32,000 edges
    // of 12,000 cells cut one by one took a tenth of a second in one piece, a stutter in the entry mist. Nothing of it is
    // nearer than 14 m to the line nor before s 22, and it stands within half a second.
    bedState.job = (function* growNet() {
      let sliceT0 = performance.now(), busy = 0;
      let netMs = 0; const netT0 = performance.now();
      const segs = [], RING = []; for (let r = 1; r <= 2; r++) for (let di = -r; di <= r; di++) for (let dj = -r; dj <= r; dj++) if (Math.max(Math.abs(di), Math.abs(dj)) === r) RING.push([di, dj]);
      const cellRange = (s0, s1, d0, d1) => { const out = []; for (let i = Math.floor(s0 / g); i <= Math.ceil(s1 / g); i++) for (let j = Math.floor(d0 / g); j <= Math.ceil(d1 / g); j++) out.push([i, j]); return out; };
      const cells = [...cellRange(N.mirror.s[0], N.mirror.s[1], N.mirror.d[0], N.mirror.d[3]), ...cellRange(N.mirror.s[0], N.mirror.s[1], -N.mirror.d[3], -N.mirror.d[0]),
        ...cellRange(N.flats.s[0], N.flats.s[1], N.flats.d[0], N.flats.d[3]), ...cellRange(N.flats.s[0], N.flats.s[1], -N.flatsLeft.d[3], -N.flatsLeft.d[0])];
      for (const [i, j] of cells) {
        if ((++busy & 31) === 0 && performance.now() - sliceT0 > 5) { yield; sliceT0 = performance.now(); }
        const [cs, cd] = site(i, j);
        if (risen(cs, cd) <= 0) continue;
        // the cell: a square cut down by the bisector to each neighbour; every corner remembers which neighbour its edge is shared with
        let poly = [[cs - 2 * g, cd - 2 * g, null], [cs + 2 * g, cd - 2 * g, null], [cs + 2 * g, cd + 2 * g, null], [cs - 2 * g, cd + 2 * g, null]];
        // (the eight nearest neighbours first; of the sixteen beyond them only those near enough to cut what is left)
        for (const [di, dj] of RING) {
          if (!poly.length) break;
          const [ns, nd] = site(i + di, j + dj), mx = (cs + ns) / 2, my = (cd + nd) / 2, nx2 = ns - cs, ny2 = nd - cd, out = [];
          if (Math.abs(di) === 2 || Math.abs(dj) === 2) { let far = 0; for (const v of poly) far = Math.max(far, (v[0] - cs) * (v[0] - cs) + (v[1] - cd) * (v[1] - cd)); if ((nx2 * nx2 + ny2 * ny2) / 4 > far) continue; }
          for (let k = 0; k < poly.length; k++) {
            const p = poly[k], q = poly[(k + 1) % poly.length], fp = (p[0] - mx) * nx2 + (p[1] - my) * ny2, fq = (q[0] - mx) * nx2 + (q[1] - my) * ny2;
            if (fp <= 0) out.push(p);
            if ((fp <= 0) !== (fq <= 0)) { const t = fp / (fp - fq), x = [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, fp <= 0 ? [i + di, j + dj] : p[2]]; out.push(x); }
          }
          poly = out;
        }
        for (let k = 0; k < poly.length; k++) {
          const p = poly[k], q = poly[(k + 1) % poly.length], nb = p[2];
          if (!nb || nb[0] < i || (nb[0] === i && nb[1] < j)) continue;          // each edge once: by the cell with the smaller name
          if (Math.hypot(q[0] - p[0], q[1] - p[1]) < 0.05) continue;
          const r = 0.5 + 0.65 * hash2(i * 7 + nb[0], j * 7 + nb[1], 3), ka = Math.min(1, risen(p[0], p[1]) * r), kb = Math.min(1, risen(q[0], q[1]) * r);
          if (Math.max(ka, kb) < 0.06) continue;
          segs.push([p[0], p[1], q[0], q[1], ka, kb]);
        }
      }
      // (in the order they lie along the route: each of the two draws below then draws only the stretch near the boat, by a
      // range that moves with it; the whole net was 150,000 triangles a frame, most of them a hundred metres off under a mirror)
      segs.sort((u, v) => (u[0] + u[2]) - (v[0] + v[2]));
      const rangeOf = (mids, lo, hi) => { let i0 = 0, i1 = mids.length, m; let a0 = 0, b0 = mids.length; while (a0 < b0) { m = (a0 + b0) >> 1; if (mids[m] < lo) a0 = m + 1; else b0 = m; } i0 = a0; a0 = i0; b0 = mids.length; while (a0 < b0) { m = (a0 + b0) >> 1; if (mids[m] <= hi) a0 = m + 1; else b0 = m; } i1 = a0; return [i0, i1 - i0]; };
      // each ridge as it lies: under the water a soft pale strip on the sand (it widens as it sinks), and where it breaks the
      // surface a hairline (below). Tops: metres above still water (negative: under it).
      const topAt = (s, d, k) => -depthAt(s, d) + Math.min(N.tall, depthAt(s, d) + N.above) * Math.pow(k, 1.3);
      {
        const n = segs.length, P3 = new Float32Array(n * 12), UV = new Float32Array(n * 8), IX = new Uint32Array(n * 6), a = new THREE.Vector3(), b = new THREE.Vector3();
        segs.forEach((sg, i) => {
          const ta = Math.min(-0.004, topAt(sg[0], sg[1], sg[4])), tb = Math.min(-0.004, topAt(sg[2], sg[3], sg[5]));
          sky.at(sg[0], sg[1], ta, a); sky.at(sg[2], sg[3], tb, b);
          const dx = b.x - a.x, dz = b.z - a.z, len = Math.hypot(dx, dz) || 1, px = -dz / len, pz = dx / len;
          const wa = lerp(N.width[0], N.width[1], sg[4]) * 0.5, wb = lerp(N.width[0], N.width[1], sg[5]) * 0.5;
          P3.set([a.x - px * wa, a.y, a.z - pz * wa, a.x + px * wa, a.y, a.z + pz * wa, b.x - px * wb, b.y, b.z - pz * wb, b.x + px * wb, b.y, b.z + pz * wb], i * 12);
          UV.set([0, 0, 0, 1, len, 0, len, 1], i * 8);
          IX.set([i * 4, i * 4 + 1, i * 4 + 2, i * 4 + 2, i * 4 + 1, i * 4 + 3], i * 6);      // (counter-clockwise seen from above: with (px, pz) = (-dz, dx) the +side lies to the right of a -> b looking down)
        });
        const ng = new THREE.BufferGeometry();
        ng.setAttribute('position', new THREE.BufferAttribute(P3, 3)); ng.setAttribute('uv', new THREE.BufferAttribute(UV, 2)); ng.setIndex(new THREE.BufferAttribute(IX, 1));
        const nrm = new Float32Array(n * 12); for (let i = 1; i < nrm.length; i += 3) nrm[i] = 1; ng.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
        const net = new THREE.Mesh(ng, sky.paint({ color: N.color, salt: { kind: 'crust', glints: 0, strength: 0.7 }, brush: 0.3, bed: true, transparent: true, extend: {
          uniforms: { uBedLamp }, fragmentPars: 'uniform float uBedLamp;',
          albedo: 'alpha *= 1.0 - smoothstep(0.25, 1.0, abs(vUv0.y * 2.0 - 1.0));',      // a soft strip, not a ruled one
          light: 'c += albedo * lamps * uBedLamp;' } }));
        net.name = 'lake bed: crust polygons'; net.frustumCulled = false; net.renderOrder = -2; net.material.depthWrite = false;
        ctx.only(net, 'direct'); ctx.add(net);
        bedState.strips = { geo: ng, mids: segs.map((sg) => (sg[0] + sg[2]) / 2) };
      }
      // ---- where the ridges break the surface: hairlines across the reflected stars. Drawn after the water, never thinner
      // than the picture can draw (far off they go faint instead), lit as salt lying level is lit; not in the mirror.
      {
        const up = segs.map((sg) => [sg, topAt(sg[0], sg[1], sg[4]), topAt(sg[2], sg[3], sg[5])]).filter((e) => Math.max(e[1], e[2]) > 0.001);
        const n = up.length, A3 = new Float32Array(n * 3), B3 = new Float32Array(n * 3), R = new Float32Array(n * 3), a = new THREE.Vector3(), b = new THREE.Vector3();
        up.forEach(([sg, ta, tb], i) => { sky.at(sg[0], sg[1], Math.max(ta, 0.001), a); sky.at(sg[2], sg[3], Math.max(tb, 0.001), b); A3.set([a.x, a.y, a.z], i * 3); B3.set([b.x, b.y, b.z], i * 3); R.set([ta, tb, hash2(i, 7, 5)], i * 3); });
        // (four corners a ridge, in a plain geometry and not as instances: a range of instances cannot be drawn from its middle)
        const rep = (src) => { const out = new Float32Array(n * 12); for (let i = 0; i < n; i++) for (let k = 0; k < 4; k++) out.set(src.subarray(i * 3, i * 3 + 3), (i * 4 + k) * 3); return out; };
        const corners = new Float32Array(n * 12), hix = new Uint32Array(n * 6);
        for (let i = 0; i < n; i++) { corners.set([0, -1, 0, 1, -1, 0, 0, 1, 0, 1, 1, 0], i * 12); hix.set([i * 4, i * 4 + 1, i * 4 + 2, i * 4 + 2, i * 4 + 1, i * 4 + 3], i * 6); }
        const hg = new THREE.BufferGeometry();
        hg.setAttribute('position', new THREE.BufferAttribute(corners, 3)); hg.setIndex(new THREE.BufferAttribute(hix, 1));
        hg.setAttribute('aA', new THREE.BufferAttribute(rep(A3), 3)); hg.setAttribute('aB', new THREE.BufferAttribute(rep(B3), 3)); hg.setAttribute('aRise', new THREE.BufferAttribute(rep(R), 3));
        bedState.lines = { geo: hg, mids: up.map(([sg]) => (sg[0] + sg[2]) / 2) };
        bedState.rangeOf = rangeOf;
        const U = sky.uniforms, hm = new THREE.ShaderMaterial({
          uniforms: { ...U, uFogColor: sh.uFogColor, uFogDensity: sh.uFogDensity, uTime: sh.uTime, uLanternPos: sh.uLanternPos, uLanternColor: sh.uLanternColor, uLanternRadius: sh.uLanternRadius, uLampPos: sh.uLampPos, uLampColor: sh.uLampColor, uLampRadius: sh.uLampRadius,
            uAir: sky.air.near, uChalk: { value: col(N.color) }, uCrust: { value: new THREE.Vector4(N.above, N.crest, N.minPx, N.reach) } },
          transparent: true, depthWrite: false, depthTest: true, fog: false, side: THREE.DoubleSide,
          vertexShader: /* glsl */`
            attribute vec3 aA, aB, aRise;
            uniform vec4 uPass, uCrust, uAir, uNightFar; uniform vec2 uPassSize; uniform float uFogDensity, uLanternRadius, uLampRadius;
            uniform vec3 uSkyAmb, uFillAmb, uFootLight, uChalk, uLanternPos, uLanternColor, uLampPos, uLampColor, uFogColor;
            varying vec3 vCol; varying vec3 vShape; varying vec2 vAlong;
            vec3 lampOn(vec3 p, vec3 pos, vec3 color, float radius) { vec3 d = pos - p; float dist = length(d), att = 1.0 - smoothstep(radius * 0.25, radius, dist); return color * att * att * max(d.y / max(dist, 1e-3) * 0.6 + 0.4, 0.0); }
            void main() {
              vec4 va = viewMatrix * vec4(aA, 1.0), vb = viewMatrix * vec4(aB, 1.0);
              float near = 0.12;                                                   // keep both ends in front of the eye
              if (va.z > -near && vb.z < -near) va = mix(vb, va, (-near - vb.z) / (va.z - vb.z));
              if (vb.z > -near && va.z < -near) vb = mix(va, vb, (-near - va.z) / (vb.z - va.z));
              vec4 ca = projectionMatrix * va, cb = projectionMatrix * vb;
              vec2 dir = (cb.xy / max(cb.w, 1e-4) - ca.xy / max(ca.w, 1e-4)) * uPassSize;
              dir = dot(dir, dir) > 1e-8 ? normalize(dir) : vec2(1.0, 0.0);
              vec3 wp = mix(aA, aB, position.x); float top = mix(aRise.x, aRise.y, position.x);
              float dist = max(distance(wp, cameraPosition), 0.3), down = clamp((cameraPosition.y - wp.y) / dist, 0.0, 1.0);
              // how thick the ridge really is on the picture: its height above the water seen along it, its width seen from above
              float truePx = (max(top, 0.0) * sqrt(1.0 - down * down) + uCrust.y * down * smoothstep(0.0, 0.006, top)) / dist * uPass.x;
              float px = max(truePx, uCrust.z), there = min(1.0, truePx / uCrust.z);
              there *= 1.0 - smoothstep(uCrust.w * 0.5, uCrust.w, dist);          // far off there is nothing to draw
              there *= 1.0 - smoothstep(uAir.x, uAir.y, dist);                    // the night air, as for everything built
              vec4 p = mix(ca, cb, position.x);
              float halfW = 0.5 * px + 0.8;
              p.xy += vec2(-dir.y, dir.x) * position.y * halfW * 2.0 / uPassSize * p.w;
              gl_Position = (va.z > -near && vb.z > -near) || there < 0.01 ? vec4(2.0, 2.0, 2.0, 1.0) : p;
              vec3 amb = uSkyAmb + uFillAmb * mix(1.0, uNightFar.z, smoothstep(uNightFar.x, uNightFar.y, dist)) + uFootLight;
              vec3 c = uChalk * (0.86 + 0.28 * aRise.z) * (amb + 0.45 * (lampOn(wp, uLanternPos, uLanternColor, uLanternRadius) + lampOn(wp, uLampPos, uLampColor, uLampRadius)));      // (wet crust at the water's own level: it takes less of a lamp than a wall would, or the nearest ridges are bars of pink light)
              vCol = mix(c, uFogColor, 1.0 - exp(-uFogDensity * uFogDensity * dist * dist)); vShape = vec3(position.y * halfW, 0.5 * px, there);
              vAlong = vec2(position.x * distance(aA, aB), aRise.z);
            }`,
          fragmentShader: /* glsl */`
            varying vec3 vCol; varying vec3 vShape; varying vec2 vAlong;
            void main() {
              // a ridge is not a ruled line: it stands a little higher here, dips under there (beads of crust, a hand or two long)
              float bead = 0.5 + 0.5 * sin(vAlong.x * 23.0 + vAlong.y * 40.0) * sin(vAlong.x * 9.1 + vAlong.y * 17.0 + 1.3);
              float thick = vShape.y * (0.45 + 0.75 * bead);
              float a = vShape.z * smoothstep(0.12, 0.42, bead) * (1.0 - smoothstep(max(thick - 0.6, 0.0), thick + 0.6, abs(vShape.x)));
              if (a < 0.004) discard;
              gl_FragColor = vec4(vCol * (0.8 + 0.3 * bead), a);
            }`,
        });
        const lines = new THREE.Mesh(hg, hm); lines.name = 'lake bed: crust hairlines'; lines.frustumCulled = false; lines.renderOrder = 1;
        lines.onBeforeRender = (renderer, scene, camera) => sky.pass(renderer, camera, hm);
        ctx.only(lines, 'direct'); ctx.add(lines);
        bedState.net = { segments: segs.length, breaking: n, ms: Math.round(performance.now() - netT0) };
      }
    })();
  }

  // ------------------------------------------------------------------------------------------ &swatch=1: the area's paints
  // For looking, and for whoever wears them: salt of each kind, timber, the two together and the waterline, standing in
  // the lake 9 m ahead of where the picture is taken (`&s=`), under whatever light that place has. &swatch=2 adds a heap
  // of the ridge's height 120 m off to the left (how salt reads far off, in the night air's 'far' rule).
  if (params.has('swatch')) {
    const s0 = (+params.get('s') || 60) + 9, d0 = +params.get('d') || 0;
    const put = (geo, mat, ds, dd, y = 0) => { const m = new THREE.Mesh(geo, mat); m.position.copy(sky.at(s0 + ds, d0 + dd, y)); m.name = 'swatch'; ctx.add(m); return m; };
    const lump = (r, seed) => { const g = new THREE.IcosahedronGeometry(r, 4), p = g.attributes.position, rnd = ctx.rng(seed), k = [rnd() * 9, rnd() * 9, rnd() * 9];
      for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), f = 1 + 0.22 * Math.sin(x * 9 / r + k[0]) * Math.sin(z * 8 / r + k[1]) + 0.12 * Math.sin(y * 13 / r + k[2]); p.setXYZ(i, x * f, y * f * 0.7, z * f); }
      g.computeVertexNormals(); return g; };
    put(new THREE.ConeGeometry(1.15, 2.1, 48, 10), sky.paint({ salt: 'raked', waterline: true }), 0, -6.4, 1.0);
    put(new THREE.ConeGeometry(1.25, 1.7, 48, 10), sky.paint({ salt: 'old', waterline: true }), 1, -3.6, 0.8);
    put(lump(0.34, 5), sky.paint({ salt: 'crust' }), -1.5, -1.6, 0.05);
    put(new THREE.BoxGeometry(2.0, 0.16, 1.5), sky.paint({ salt: 'pan' }), 0, 0.4, 0.0);
    put(new THREE.CylinderGeometry(0.09, 0.1, 1.9, 14), sky.paint({ timber: true, waterline: true }), -1.5, 2.4, 0.6);
    put(new THREE.BoxGeometry(2.4, 0.07, 1.3), sky.paint({ timber: true }), 0.5, 4.2, 0.55);
    for (const e of [-1, 1]) for (const f of [-1, 1]) put(new THREE.CylinderGeometry(0.06, 0.07, 1.0, 10), sky.paint({ timber: true, waterline: true }), 0.5 + f * 0.5, 4.2 + e * 1.0, 0.1);
    // (the two together: one thing painted chalk above and timber grey below; the paint's own paleness decides which it is)
    { const g = new THREE.CylinderGeometry(0.13, 0.13, 1.5, 16, 12), p = g.attributes.position, cols = new Float32Array(p.count * 3), a = new THREE.Color(C.timber), b = new THREE.Color(C.chalk);
      for (let i = 0; i < p.count; i++) { const cc = p.getY(i) < -0.35 ? b : a; cols.set([cc.r, cc.g, cc.b], i * 3); }
      g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
      put(g, sky.paint({ salt: 'crust', timber: true, vertexColors: true, color: '#ffffff' }), -1, 6.6, 0.55); }
    if (params.get('swatch') === '2') { const heap = new THREE.Mesh(new THREE.ConeGeometry(48, 34, 6, 8), sky.paint({ salt: 'raked', air: 'far' })); heap.position.copy(sky.at(s0 + 90, d0 - 90, 17)); heap.scale.set(1, 1, 1.6); heap.name = 'swatch heap'; heap.frustumCulled = false; ctx.add(heap); }
  }

  // ------------------------------------------------------------------------------------------ the air at first light
  // Low banks of mist on the lake, far off (plan.mist): depth in layers behind the cone rows and at the ridge's foot.
  // (third pass) The area's own banks, not kit.mist: each LIES ON THE LAKE in a place that was chosen (plan.mist.banks),
  // an upright card that turns to the eye about its own foot, thickest a metre above the water and gone at the water
  // itself; it has gone before the eye is near it; and where it meets anything solid (the ridge's face, a causeway, the
  // crust, the hull) it thins away, read from the engine's picture of the scene's depth. (A kit card is a tall ellipse
  // hung over the water by chance: one lay where the boat goes and cut the crust terraces in a ruled line.)
  const Mi = P.mist, mistFull = Mi.opacity;
  const mist = (() => {
    const rnd = ctx.rng(Mi.seed), cards = [], v = new THREE.Vector3();
    for (const [s0, s1, d0, d1, n] of Mi.banks) for (let i = 0; i < n; i++) {
      sky.at(lerp(s0, s1, (i + 0.15 + 0.7 * rnd()) / n), lerp(d0, d1, rnd()), 0, v);
      cards.push([v.x, v.z, lerp(Mi.long[0], Mi.long[1], rnd()), lerp(Mi.high[0], Mi.high[1], rnd()), rnd() * 100, 0.6 + rnd() * 0.8, rnd() < 0.5 ? -1 : 1]);
    }
    const n = cards.length, off = new Float32Array(n * 4), aux = new Float32Array(n * 3);
    cards.forEach((c, i) => { off.set(c.slice(0, 4), i * 4); aux.set(c.slice(4), i * 3); });
    const geo = new THREE.InstancedBufferGeometry(), base = new THREE.PlaneGeometry(1, 1);
    geo.index = base.index; geo.setAttribute('position', base.attributes.position);
    geo.setAttribute('aOffset', new THREE.InstancedBufferAttribute(off, 4)); geo.setAttribute('aAux', new THREE.InstancedBufferAttribute(aux, 3));
    geo.instanceCount = n;
    const zEast = kit.at(0, 0).z - Mi.range[1];                                 // (the route runs toward -z: the east end of the banks' range)
    const mat = new THREE.ShaderMaterial({
      uniforms: { uTime: sh.uTime, uFogColor: sh.uFogColor, uFogDensity: sh.uFogDensity, uVeil: sh.uVeil, uVeilColor: sh.uVeilColor,
        uColor: { value: col(Mi.color) }, uOpacity: { value: 0 }, uDrift: { value: Mi.drift }, uShift: { value: 0 }, uRange: { value: new THREE.Vector2(zEast, Mi.range[1] - Mi.range[0]) },
        uNear: { value: new THREE.Vector2(Mi.near[0], Mi.near[1]) }, uSoft: { value: new THREE.Vector4(0, Mi.soft, 0.1, 1000) }, uRes: { value: new THREE.Vector2(1600, 900) }, tDepth: { value: null } },
      transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide, forceSinglePass: true,
      vertexShader: /* glsl */`
        attribute vec4 aOffset; attribute vec3 aAux; uniform float uTime, uDrift, uShift; uniform vec2 uRange;
        varying vec2 vQ; varying vec3 vW; varying vec3 vBank;
        void main() {
          vec3 c = vec3(aOffset.x, 0.0, aOffset.y);
          c.x += sin(uTime * 0.07 * aAux.y + aAux.x) * 6.0 * uDrift * aAux.z; c.z += cos(uTime * 0.05 * aAux.y + aAux.x * 1.3) * 6.0 * uDrift;
          float zz = mod(c.z - uRange.x + uShift, uRange.y);                  // the wind carries them west, round and round the range
          c.z = uRange.x + zz;
          c = (modelMatrix * vec4(c, 1.0)).xyz;
          vec2 to = normalize(cameraPosition.xz - c.xz + vec2(1e-4)); vec3 right = vec3(to.y, 0.0, -to.x);
          vec3 wp = c + right * (position.x * aOffset.z) + vec3(0.0, (position.y + 0.5) * (aOffset.w + 1.0) - 1.0, 0.0);
          vQ = vec2(position.x * 2.0, position.y + 0.5); vW = wp;
          vec4 mv = viewMatrix * vec4(wp, 1.0);
          vBank = vec3(aAux.x, -mv.z, smoothstep(0.0, 30.0, zz) * (1.0 - smoothstep(uRange.y - 30.0, uRange.y, zz)));
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */`
        uniform vec3 uColor; uniform float uOpacity, uTime; uniform vec4 uSoft; uniform vec2 uRes, uNear; uniform sampler2D tDepth;
        ${FOG_PARS} ${NOISE_GLSL}
        varying vec2 vQ; varying vec3 vW; varying vec3 vBank;
        void main() {
          float up = smoothstep(-0.05, 0.9, vW.y) * (1.0 - smoothstep(0.16, 1.0, vQ.y));      // it lies on the lake: thickest a metre up, thinning to its top
          float along = 1.0 - smoothstep(0.3, 1.0, abs(vQ.x));
          float n = fbm(vec2(vQ.x * 2.4 + vBank.x, vQ.y * 1.2 + vBank.x * 0.37) + vec2(uTime * 0.012, 0.0));
          float a = up * along * along * smoothstep(0.18, 0.7, n + along * 0.3) * uOpacity * vBank.z;
          float dist = length(vW - cameraPosition);
          a *= smoothstep(uNear.x, uNear.y, dist) * (1.0 - fogAmount(dist) * 0.85) * (1.0 - uVeil);
          if (uSoft.x > 0.5) {      // where it meets something solid it thins away (the scene's depth, as the engine drew it without the water)
            float d = texture2D(tDepth, gl_FragCoord.xy / uRes).r, zs = (uSoft.z * uSoft.w) / (uSoft.w - d * (uSoft.w - uSoft.z));
            a *= smoothstep(0.0, uSoft.y, zs - vBank.y);
          }
          if (a < 0.002) discard;
          gl_FragColor = vec4(mix(uColor, uFogColor, fogAmount(dist) * 0.5), a);
        }`,
    });
    const mesh = new THREE.Mesh(geo, mat); mesh.name = 'mist'; mesh.frustumCulled = false; mesh.renderOrder = 5; mesh.visible = false;
    const size = new THREE.Vector2();
    mesh.onBeforeRender = (renderer, scene, camera) => {
      const rt = renderer.getRenderTarget(), u = mat.uniforms, depth = engine.pre && engine.pre.depthTexture;
      if (rt) u.uRes.value.set(rt.width, rt.height); else u.uRes.value.copy(renderer.getDrawingBufferSize(size));
      u.tDepth.value = depth || null; u.uSoft.value.set(depth && !engine.reflecting ? 1 : 0, Mi.soft, camera.near, camera.far);      // (not in the mirror: that picture has another eye)
      mat.uniformsNeedUpdate = true;
    };
    ctx.add(mesh);
    return mesh;
  })();
  let mistShift = 0;

  // (light for the ride's FIRST boat, `&boat=boat-model`, which is not painted in gouache: a little sky light so that its
  // hull is a dark colour and not a hole. The ride's boat takes look.light and look.boat.tone, and ignores this.)
  const hemi = kit.hemi('#3a4fb0', '#1c2c7c', 0.3);

  // ------------------------------------------------------------------------------------------ the edge of the reachable water
  // Open water: nothing stops the boat at the half width. The engine's own lean grows with the square of how far out the
  // boat is and cannot be beaten at about 1.4 half widths; these shallows (the water thins to a finger) slow it first.
  {
    const sw = P.shallows, add = (s, d, r, k) => { const p = kit.at(s, d); ctx.addCollider({ x: p.x, z: p.z, r, soft: k }); };
    for (let s = sw.from; s <= sw.to; s += sw.step) for (const side of [-1, 1]) add(s, side * (kit.halfWidth(s) + sw.centre), sw.r, sw.strength);
    for (let s = 240; s <= 322; s += 18) { add(s, 60, 28, 0.6); add(s, -48, 26, 1.2); }      // the flats: open shallows to the right, crust terraces to the left
  }

  // ------------------------------------------------------------------------------------------ light states and what drives them
  const LS = ctx.lookStates({ star: {}, aurora: { look: P.look.aurora }, dawn: { look: P.look.dawn, water: P.water.dawn } });
  stage.cue('reveal', { s: P.cues.reveal, settle() {} }, () => {});               // the first image: the eye opens (exposure 0.8 to 1.15 over 4 s)
  stage.cue('falsedawn', { s: P.cues.falsedawn, settle() {} }, () => {});         // the aurora unrolls in the north over 12 s
  stage.cue(P.show.cue, { s: P.show.s, settle() {} }, () => {});                  // the letting go: staging hangs its beats on shared.sky.T

  const L0 = P.light, amb = { sky0: col(L0.star.sky), g0: col(L0.star.ground), sky1: col(L0.dawn.sky), g1: col(L0.dawn.ground), aur: col(L0.aurora.color), fill: col(L0.aurora.fill), sun: col(L0.sun.color).multiply(col(L0.sun.lit)), t: col('#000000') };
  const hemi0 = { sky: col('#3a4fb0'), ground: col('#1c2c7c') }, hemi1 = { sky: col('#cfd3ee'), ground: col('#b9a9b4') };
  const foot = { star: col(L0.foot.star), aurora: col(L0.foot.aurora), dawn: col(L0.foot.dawn), glitter: col(L0.foot.glitter) }, rimDawn = col(L0.rim.dawn), rimAur = col(L0.rim.aurora);
  const fogStar = col(P.look.star.fog.color), fogAur = col(P.look.aurora.fog.color), fogDawn = col(P.look.dawn.fog.color);
  const fogWest = col(P.look.dawn.fogWest), fogNow = col('#000000'), viewDir = new THREE.Vector3(), bedStar = col(LB.starlight.color);
  const sheenEast = col(P.water.windSheen.east), sheenWest = col(P.water.windSheen.west), sheenNight = col(P.water.nightRings.color), sheenNow = col('#000000');
  const W0 = P.water.night, wind = P.show.wind, level = (ctx.quality && ctx.quality.level) || 'high';
  const fineMirror = level === 'high' ? P.water.mirrorScale.exact : level === 'medium' ? 1.25 : 1;
  const tuneBlur = params.get('blur'); if (tuneBlur !== null && tuneBlur !== '') sky.tune.blur = +tuneBlur;      // &blur=0: stars as sharp above as the view can draw them (to see what the matching does)
  const blur0 = sky.tune.blur;                                                 // how much of the matching softness stars take while the mirror is exact (update eases it away behind the wind)
  const noAurora = params.get('aurora') === '0';                               // &aurora=0: the curtain is not drawn (its light on things stays): for timing the sky with and without it
  const levelView = params.has('level');                                       // &level=1: the boat holds dead level (for the mirror test: only then is the water's picture the sky's picture turned over, pixel for pixel)
  sky.front = { z: -1e5 };
  // &dbg=name.json: where the boat went (for checking the drift line, the lean at the edges, the colliders): .shots/<name>
  const dbgName = params.get('dbg'), dbg = dbgName ? { next: 0, rows: [] } : null;

  return {
    update(dt, c) {
      const s = c.s, boat = c.boat, calm = stage.calm, look = c.look, W = c.waterLook, U = sky.uniforms;
      // ---- the dawn clock: by distance only. A rider who stops holds the dawn where it is.
      const e = sky.e = P.dawn(s);
      const unroll = stage.ramp('falsedawn', S.aurora.unroll, (t) => t), au = sky.aurora = smooth(0, 1, unroll) * P.auroraOut(s);
      const breathe = 1 + L0.aurora.depth * Math.sin(c.time * 2 * Math.PI / L0.aurora.breathe);
      LS.set({ star: (1 - e) * (1 - au), aurora: (1 - e) * au, dawn: e });
      // ---- the night air (light.js): by starlight nothing built is there beyond about 85 m; the false dawn finds the near
      // things in its first six seconds and makes ghosts of the far ones; first light makes those solid
      { const A = P.air, kn = smooth(0, A.find / S.aurora.unroll, unroll), kf = smooth(0, 1, unroll), op = smooth(A.dawn[0], A.dawn[1], e);
        sky.setAir('near', lerp(A.star[0], A.open[0], kn * kn), lerp(A.star[1], A.open[1], kn * kn));
        sky.setAir('far', lerp(lerp(A.star[0], A.aurora[0], kf), A.open[0], op * op), lerp(lerp(A.star[1], A.aurora[1], kf), A.open[1], op * op), lerp(A.ghost.share, 1, op));      // (by night a far thing is a ghost: light.js)
        sky.cullAir(sh.uCameraPos.value); }
      // ---- what the states do not carry (set after LS.set, which writes the whole look)
      look.exposure *= lerp(P.look.star.exposureAtReveal / P.look.star.exposure, 1, stage.ramp('reveal', 4));
      // the fog's colour holds the night's until e 0.4: before that, far water in a warming fog draws a warm line right
      // round the horizon, and behind the boat that reads as a dawn in the west
      // (and at first light the mist is not one colour all round: pale chalk toward the light, the west's own lavender away
      // from it. The engine has one fog colour, so it follows where the rider LOOKS: with the chalk all round, the western
      // horizon was the brightest thing in the west, a glowing band behind the lamp the rider has just lit)
      engine.camera.getWorldDirection(viewDir);
      const west = clamp01(0.5 + 0.5 * viewDir.z / Math.max(1e-3, Math.hypot(viewDir.x, viewDir.z)));
      fogNow.copy(fogDawn).lerp(fogWest, smooth(0.25, 0.9, west));
      look.fog.color.copy(fogStar).lerp(fogAur, au * (1 - e)).lerp(fogNow, smooth(P.water.fogDawnFrom, 1, e));
      if (levelView) { boat.tilt.rotation.set(0, 0, 0); boat.tilt.position.y = 0; }
      look.current = look.currentNarrow = sky.state.still ? 0 : P.current(s);      // (after the ending, for "Stay a while", staging sets shared.sky.state.still)
      // ---- the showstopper's clock and the wind front: a line across the route that comes from the east
      const T = sky.T = stage.clock(P.show.cue, P.show.by);
      const speed = calm ? wind.calmSpeed : wind.ahead / (wind.reach - wind.from), width = wind.width * (calm ? 3 : 1);      // 26 m/s: from 260 m ahead to the boat in 10 s
      const fz = T < 0 ? -1e5 : T < wind.from ? boat.z - wind.ahead - 400 * (1 - smooth(wind.from - 8, wind.from, T)) : boat.z - wind.ahead + Math.min(1e4, speed * (T - wind.from));
      sky.front.z = fz;
      const w = sky.wind = T < 0 ? 0 : smooth(-width * 0.5, width * 0.5, fz - boat.z);
      W.front.normal[0] = 0; W.front.normal[1] = 1; W.front.offset = fz; W.front.width = width; W.front.calm = 1;
      W.mirrorDarken = lerp(0.15, P.water.windDarken, w) * P.mirrorGrade(s); W.mirrorSaturate = lerp(0.10, P.water.windSaturate, w) * P.mirrorGrade(s);      // (behind the wind the water is a darker, richer copy of its sky: the lake holds the pale picture down)
      // (third pass) THE MIST HAS NO HORIZON (see the dome's shader). Inside the veil the water is half a mirror, and the other
      // half was its own body, the night's ink: under a pale mist the lake lay as a darker plane with a ruled far edge. The
      // body takes the fog's colour with the veil, so mist above and mist below are one blindness until the stars come.
      { const kv = sh.uVeil.value; if (kv > 0.001) { W.deep.lerp(sh.uFogColor.value, kv); W.shallow.lerp(sh.uFogColor.value, kv); } }
      W.sun.strength = P.water.glitter * w * smooth(0.15, 0.5, e);
      W.reflectivity = lerp(1, P.water.windReflectivity, w); W.fresnel = lerp(W0.fresnel, P.water.windFresnel, w);
      W.reflectFloor = lerp(W.reflectFloor, P.water.windFloor, w); W.seeDistance = lerp(W.seeDistance, P.water.windSee, w); W.streak = lerp(W0.streak, P.water.windStreak, w);      // (after LS.set, which writes the states' own values every frame)
      // (second pass) sky-light on leaning water (the water's `sheen`): by night on the rings alone, fine pale arcs on the mirror;
      // behind the wind on every fine crest, in the colour of the low sky the rider looks toward: the ruffled lake, the glitter
      { const sn = W.sheen, WS = P.water.windSheen, NR = P.water.nightRings, k = w * smooth(WS.from[0], WS.from[1], e);
        if (sn && sn.color && sn.color.isColor) {
          sheenNow.copy(sheenEast).lerp(sheenWest, smooth(0.25, 0.9, west));
          sn.color.copy(sheenNight).lerp(sheenNow, Math.max(k, smooth(0.25, 0.7, e)));
          sn.rings = NR.rings; sn.still = WS.still * k; sn.glance = WS.glance * k; sn.hide = WS.hide * k; } }
      look.mirrorScale = w > 0.6 ? P.water.mirrorScale.wind : fineMirror;
      // (third pass) A star above is drawn as soft as its twin below (light.js, uPass) while the mirror is exact. Behind the wind
      // there are no twins, and the mirror is drawn three times coarser: matched to THAT, the last stars of the night were
      // soft blots on the paling sky (2.2 pixels squared of blur on a dab half a pixel across). The matching goes with the
      // mirror, before the mirror's scale changes: the last stars are points.
      sky.tune.blur = blur0 * (1 - smooth(0.1, 0.55, w));
      skyMark = w > 0.2 && S.paintAfterWind > 0 ? lerp(-1.05, lerp(-1.05, 1, S.paintAfterWind), smooth(0.2, 0.9, w)) : -15;              // the crisp sky's mark, eased off as the mirror is let go
      // ---- the sunline and the area's light (light.js)
      const sunY = sky.sunlineY = P.sunline(s), first = smooth(196, 216, s);
      U.uSunline.value.set(sunY, P.sunlineSoft, first, e);
      amb.t.copy(amb.fill).multiplyScalar(au * breathe * (1 - e));
      // (the light on built things LEADS the dawn's clock: the low sky they stand against turns early, and by e they were
      // dark shapes on a pale sky half way through the dawn. And it must take over from the false dawn's fill as that
      // fails (s 170 to 200), or between s 196 and 216 everything built falls back to starlight, the colour of the sky
      // behind it, exactly where the page finds the sleepers: "pale ovals on stalks that were taken for salt cones".
      // So: a third of the dawn's light by s 200 (e 0.16), half by s 208, nine tenths by s 226.)
      const ea = Math.pow(smooth(0, P.light.dawnLead, e), 0.6);
      U.uSkyAmb.value.copy(amb.sky0).lerp(amb.sky1, ea).multiplyScalar(lerp(L0.star.gain, L0.dawn.gain, ea));
      U.uGroundAmb.value.copy(amb.g0).lerp(amb.g1, ea).multiplyScalar(lerp(L0.star.gain, L0.dawn.gain, ea));
      U.uFillAmb.value.copy(amb.t);                                              // the false dawn's glow, apart: it dies with distance (light.js, "THE NIGHT'S DEPTH")
      // what the lake gives back at the foot of things; the rim on forms against first light (light.js)
      { const f = U.uFootLight.value, k0 = (1 - au) * (1 - ea), k1 = au * breathe * (1 - e), k2 = ea, k3 = w * smooth(0.15, 0.5, e);
        f.setRGB(foot.star.r * k0 + foot.aurora.r * k1 + foot.dawn.r * k2 + foot.glitter.r * k3, foot.star.g * k0 + foot.aurora.g * k1 + foot.dawn.g * k2 + foot.glitter.g * k3, foot.star.b * k0 + foot.aurora.b * k1 + foot.dawn.b * k2 + foot.glitter.b * k3); }
      U.uRimLight.value.copy(rimDawn).multiplyScalar(L0.rim.gain * smooth(0.2, 0.7, e));
      U.uRimAur.value.copy(rimAur).multiplyScalar(L0.rim.auroraGain * au * breathe * (1 - e));      // against the false dawn: a jade edge (light.js)
      U.uAerial.value.z = L0.depth.aerial[2] * (1 - smooth(L0.depth.aerialUntil[0], L0.depth.aerialUntil[1], e));      // far things take the night air's colour; first light takes that away
      U.uAurKey.value.copy(amb.aur).multiplyScalar(L0.aurora.gain * au * breathe * (1 - e));
      U.uSunKey.value.copy(amb.sun).multiplyScalar(L0.sun.gain * first);
      // (second pass) THE FIRST IMAGE IS THE MIRROR AND NOTHING ELSE: the bed comes to be seen by starlight between two
      // distances along (plan.lakeBed.comesIn). Before the first the water is the stars' twins to the bottom edge of the
      // picture and only the lantern's stain lies on the sand; then the window round the boat opens and the lake is a hand deep.
      const bedIn = smooth(LB.comesIn.s[0], LB.comesIn.s[1], s);
      W.clearFloor = lerp(1, W0.clearFloor, bedIn);
      U.uBedLight.value = lerp(lerp(lerp(LB.comesIn.before, L0.bed.star, bedIn), L0.bed.dawn, e), L0.bed.wind, w);      // (behind the wind the sand is under ruffled water: dimmer, not a white zebra)
      U.uBedStar.value.copy(bedStar).multiplyScalar(LB.starlight.gain * bedIn * (1 - smooth(LB.starlight.until[0], LB.starlight.until[1], e)));      // the stars' own white light on the sand (light.js, SKY_BED)
      U.uBedPool.value.set(LB.pool.radius, LB.pool.gain * (1 - smooth(LB.pool.until[0], LB.pool.until[1], e)), LB.pool.pale, 0);      // the bow lantern's pale core on the sand
      if (bedState.job && bedState.job.next().done) bedState.job = null;
      if (bedState.strips && bedState.lines) { const st = bedState.strips, ln = bedState.lines, Rl = LB.net.reach + 2, Rs = Math.min(LB.net.draw, W.seeDistance + 4);      // the net: only the stretch near the boat is drawn (the strips as far as the bed is seen, the hairlines as far as they reach)
        const [a0, n0] = bedState.rangeOf(st.mids, s - Rs, s + Rs), [a1, n1] = bedState.rangeOf(ln.mids, s - Rl, s + Rl);
        st.geo.setDrawRange(a0 * 6, n0 * 6); ln.geo.setDrawRange(a1 * 6, n1 * 6); }
      sky.bedUniforms.uBedCrest.value = lerp(LB.crest[0], LB.crest[1], Math.max(smooth(0.3, 0.9, e), w));
      bedState.color.copy(bedState.night).lerp(bedState.day, Math.max(0.6 * smooth(0.3, 0.9, e), w));      // the sand cools as the sky pales (warm sand under a periwinkle sky is a mauve lake)
      { const Ca = LB.caustics, cu = bedState.caustic.value; cu.x = Ca.gain * smooth(Ca.from[0], Ca.from[1], e); cu.y = Ca.speed * (1 + w); cu.z = Math.max(Ca.still, w); }      // caustic nets from dawn progress 0.35: where the water moves; twice as quick, and everywhere, once the wind has come
      uBedLamp.value = lerp(L0.bed.lantern, L0.bed.lanternDawn, smooth(0.3, 0.8, e));      // (by first light the bow lantern's amber on sand that the sky already lights is a pink stain round the boat)
      hemi.color.copy(hemi0.sky).lerp(hemi1.sky, e); hemi.groundColor.copy(hemi0.ground).lerp(hemi1.ground, e); hemi.intensity = lerp(0.3, 1.5, e);
      // ---- the sky
      { const k = smooth(Mi.from[0], Mi.from[1], e); mist.visible = k > 0.01; mist.material.uniforms.uOpacity.value = mistFull * k;
        mistShift += dt * Mi.wind * w * (calm ? 0.5 : 1); mist.material.uniforms.uShift.value = mistShift; }      // the lake's mist comes with first light
      skyU.uDawn.value = e; skyU.uSeamIn.value = P.seamIn(s); skyU.uMirrorLift.value.x = smooth(0.15, 0.85, w);
      skyU.uAur.value.set(noAurora ? 0 : P.auroraOut(s), unroll, calm ? c.time * 0.5 : c.time, breathe);
      skyU.uWall.value = P.cloudWall(s);
      skyU.uMist.value.y = lerp(S.mist.night, S.mist.dawn, e);
      if (dbg && c.time >= dbg.next) {
        dbg.next = c.time + 0.5;
        dbg.rows.push({ t: +c.time.toFixed(2), s: +boat.s.toFixed(2), d: +boat.d.toFixed(2), speed: +boat.speed.toFixed(2), heading: +(boat.heading * 180 / Math.PI).toFixed(1), bumped: +boat.bumped.toFixed(2), e: +e.toFixed(3), T: +Math.min(T, 9999).toFixed(1), wind: +w.toFixed(2), net: bedState.net });
        clearTimeout(dbg.timer); dbg.timer = setTimeout(() => fetch('/__shot/' + dbgName.replace(/[^\w.-]/g, '_'), { method: 'POST', body: JSON.stringify(dbg.rows) }).catch(() => {}), 0);      // (once the frame loop pauses: one write, whole)
      }
    },
  };
}
