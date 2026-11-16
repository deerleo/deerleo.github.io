// The orchard in snow: the area's own light. set.js builds it first and publishes it as shared.light (and its parts as
// shared.seen, shared.mat, shared.memory), so that every module paints in one hand.
//
//   LOOK                 the realm's look (snow.js spreads it): exposure, bloom, grade, the winter light on paint
//   makeLight(ctx, plan) -> {
//     seen(hex)          a colour as it must be DRAWN so that the chip `hex` is what arrives on the screen (sky, fog, mist,
//                        particles, anything that shows its own colour; not for paint, which the light already puts right)
//     inWater(hex)       the same for things that exist only in the water's reflection and show their own colour
//     mat                the area's painted materials (snow, ice, wood, timber, basalt, earth, blossom ...)
//     paint(opts)        kit.gouache, for a material of your own
//     memory             the remembered evening: { amount (1 = the water lies .. 0 = it tells the truth), fog, light,
//                        lamp: { position, color, radius, level }, sky (uniforms of the second dome) }
//   }
//
// THE LYING MIRROR, and how it is lit. Whatever is drawn only in the water (ctx.only(obj, 'mirror')) belongs to another
// evening, and so does everything the water shows of the things that are in both (trunks, the bridge, the boat). So
// while the water's mirror is being drawn, and only then, the whole realm is given the remembered evening's light:
// its fog, its light on paint (look.light), and the kept lamp alight. Everything built with kit.gouache takes it
// without knowing (models, creatures, the boat); nothing needs a material of its own. It is done in the two functions
// the water calls round its own mirror pass (ctx.water.onMirror; before 8 November: a hook on the scene's render).
// The water then lays the whole mirror down a little darker and more violet (water.reflectionTint, set.js).
import * as THREE from 'three';

const col = (c) => new THREE.Color(c);
const QS = new URLSearchParams(location.search), DBG = +(QS.get('lampgain') || 1);
/** &bl=key:value,... (developer): the blossom's light in the water, for one picture: dusk, most, from, lr, lg, lb (metres), base, lamp, belly */
const BL = Object.fromEntries((QS.get('bl') || '').split(',').filter(Boolean).map((kv) => { const [k, v] = kv.split(':'); return [k, +v]; }));
const bl = (k, d) => (Number.isFinite(BL[k]) ? BL[k] : d);
const clamp01 = (x) => Math.min(1, Math.max(0, x));

// ------------------------------------------------------------------------------------------------ the look
// The page's block (section 2), with three things changed and one added (1-layout.md says why):
//   bloom.threshold  0.93 -> 2.0   paper white on the screen is 1.5 in the picture's own units: at 0.93 all snow would bloom
//   grade.contrast   1.05 -> 1.0   over a lift, 1.05 presses every dark under #2B to pure black: the water, the ink, the remembered sky
//   grade.toe        (new) 1       dark colours are shown as typed
//   mirrorScale      0.75 -> 1     0.75 is a coarser mirror than the ride's usual one, without multisampling; the page meant the sharpest
// The light on paint is not the page's either: as written (sky #C9C5DC, ground #F1EAEA, gain 0.5) upright faces come out
// brightest, tops darkest and lilac, undersides as light as tops. These are worked back from the chips: on white
// paint a face that looks up is paper (#F3ECE8), an upright one a shade under it, one that looks down lavender (#B4AED0).
export const WINTER_LIGHT = {
  key: [0.0, -1, 0.0], keyColor: '#FFFFFF', gain: 1.52,
  lit: '#FFFBE7', shadow: '#9E9FC4', sky: '#7B7B94', ground: '#3F3F50',
  lanternRadius: 7, heightFog: 0.05, heightFogOver: 4,           // (the page: 0.2 over 6 m, which whitens every trunk beyond 40 m: the ink is lost)
};
export const LOOK = {
  exposure: 1.02,
  bloom: { strength: 0.26, radius: 0.6, threshold: 2.0 },
  grade: { tint: '#FBF8FF', saturation: 0.97, contrast: 1.0, lift: '#0E0B16', vignette: 0.16, grain: 0.03, toe: 1 },
  paint: 0.6, paintRadius: 3.2,
  lantern: 2.6,
  light: WINTER_LIGHT,
  mirrorScale: 1,
  // The boat in snow light: DARK WORN WOOD (the director, 7 November). The remodelled boat follows the area's light, and
  // this area's light is the brightest of the ride: left alone its blue-grey paint and its planking were the palest
  // thing in the lower half of every picture. Every family is repainted as old dark wood greyed toward plum (the paint
  // gone to a slate bloom on the two top strakes), and `tone` brings the whole of it down once more, so that the only
  // warm things above the water are its lantern and the apples. (docs/life/boat.md, "Colours")
  boat: { hull: '#3d3a43', hullAlt: '#27252c', inside: '#3a3133', rib: '#2f2729', rim: '#4b4142', floor: '#352d2d', thwart: '#443a38', oar: '#4d4642', rope: '#857b72', brass: '#6b5a3a', tone: '#a79ea4' },
};
/**
 * The remembered evening has a mist of its own: what is far in the water sinks into the dusk (the mirror pass's fog
 * density). It is the page's own figure for the plain's air (0.0042 to 0.005): from the plain, 125 m off, the tree in
 * the water is still a pale mass (a quarter of it lost), where a dusk as thick as 0.0095 leaves a dark lump.
 */
export const MEMORY_FOG_DENSITY = 0.005;
/** The remembered evening's light on paint (the mirror pass only), before the water's own tint. */
export const MEMORY_LIGHT = { keyColor: '#FFFFFF', lit: '#DDD6E6', shadow: '#8D86A6', sky: '#524E6C', ground: '#2A2940', heightFog: 0.3 };
/** What paint's own colour is multiplied by while the mirror is drawn (see `dusk` in makeLight). */
export const DUSK_ON_PAINT = 0.62;
/** What the water multiplies its whole mirror by: the remembered evening is a dusk. (water.reflectionTint) */
export const MIRROR_TINT = '#CCC8CE';
/** ... and when it tells the truth again, in the thaw (page section 7). */
export const TRUTH_TINT = '#E8E6F2';

// ------------------------------------------------------------------------------------------------ colours as they are seen
// The ride's last pass (src/engine/post.js): exposure, a filmic curve, the grade. A colour typed as a chip does not
// arrive as that chip: mid tones come out lighter and whites are held under paper. seen(hex) runs the pass backwards.
function makeSeen(look) {
  const g = look.grade, tint = col(g.tint), lift = col(g.lift), ex = look.exposure, toe = clamp01(g.toe || 0);
  const sm = (x) => { const t = clamp01(x / 0.25); return t * t * (3 - 2 * t); };
  const curve = (x) => (x * (2.51 * x + 0.03 + 0.11 * toe * (1 - sm(x)))) / (x * (2.43 * x + 0.59) + 0.14);
  const display = (c) => {
    const v = [Math.max(0, c[0] * ex * tint.r), Math.max(0, c[1] * ex * tint.g), Math.max(0, c[2] * ex * tint.b)], peak = Math.max(v[0], v[1], v[2], 1e-5), cp = curve(peak);
    let o = v.map((x) => clamp01(0.45 * cp * x / peak + 0.55 * curve(x)));
    const l = 0.2126 * o[0] + 0.7152 * o[1] + 0.0722 * o[2];
    o = o.map((x) => ((l + (x - l) * g.saturation) - 0.5) * g.contrast + 0.5);
    return [o[0] + lift.r * (1 - o[0]), o[1] + lift.g * (1 - o[1]), o[2] + lift.b * (1 - o[2])];
  };
  const seen = (hex) => {
    const t = col(hex), want = [t.r, t.g, t.b]; let x = [...want];
    for (let i = 0; i < 160; i++) { const d = display(x); x = x.map((v, k) => Math.max(1e-5, v + 0.7 * (want[k] - d[k]))); }
    return new THREE.Color().setRGB(x[0], x[1], x[2]);
  };
  seen.display = (c) => { const d = display([c.r, c.g, c.b]); return new THREE.Color().setRGB(clamp01(d[0]), clamp01(d[1]), clamp01(d[2])); };
  return seen;
}

export function makeLight(ctx, plan) {
  const { kit, engine } = ctx, S = engine.shared, C = plan.chip;
  const seen = makeSeen(LOOK);
  const tint = col(MIRROR_TINT);
  /** A chip that only the water shows, as it must be drawn in the mirror: the water will lay it down darker by its tint. */
  const inWater = (hex) => { const c = seen(hex); return c.setRGB(c.r / tint.r, c.g / tint.g, c.b / tint.b); };

  // ---------------------------------------------------------------------------------------------- the remembered evening
  const M = plan.light.memory;
  const memory = {
    /** 1 = the water lies (the remembered evening), 0 = it tells the truth (the thaw). set.js drives it by where the boat is. */
    amount: 1,
    fog: inWater(M.fog), fogDensity: MEMORY_FOG_DENSITY,
    light: { keyColor: col(MEMORY_LIGHT.keyColor), lit: col(MEMORY_LIGHT.lit), shadow: col(MEMORY_LIGHT.shadow), sky: col(MEMORY_LIGHT.sky), ground: col(MEMORY_LIGHT.ground), heightFog: MEMORY_LIGHT.heightFog },
    /** The kept lamp as the water has it: alight. heroes.js keeps position and level up to date; it lights paint in the mirror only. */
    lamp: { position: new THREE.Vector3(0, -100, 0), color: col(C.lamp).multiplyScalar(1.7), radius: plan.lamp.reach, level: 0 },
    tint, truth: col(TRUTH_TINT),
  };

  // While the mirror is drawn: the remembered evening's fog, light and lamp, eased toward the truth by 1 - amount.
  const scene = engine.scene, water = engine.water;
  const keep = { fog: new THREE.Color(), sceneFog: new THREE.Color(), keyColor: new THREE.Color(), lit: new THREE.Color(), shadow: new THREE.Color(), sky: new THREE.Color(), ground: new THREE.Color(), lampPos: new THREE.Vector3(), lampColor: new THREE.Color(), lampRadius: 0, heightFog: 0, density: 0, sceneDensity: 0, hemi: 0 };
  // The boat is not gouache (the engine's boat takes three.js lights, and in most areas only its own lantern's): under a
  // snow sky it needs the sky's light, or it is a black hull with an orange nose. One soft light for it alone, the
  // ground brighter than the sky; in the mirror it is let down to the dusk.
  const hemi = kit.hemi('#B9B6CC', '#E6E0E4', 1.25); hemi.name = 'snow light on the boat';
  const hemiDusk = 0.32;
  const tmp = new THREE.Color();
  let swapped = false;
  // (fourth holder: the water gives the place for this now, ctx.water.onMirror: two functions it calls round its own
  // mirror pass while this realm is the current one. The remembered evening is put on in the first and taken off in the
  // second, exactly as before; nothing leans on water.virtualCamera or on the scene's render hooks any more. A water
  // without onMirror (&water=water, the first plain water) still gets the old hook on the scene.)
  const putOn = () => {
    if (!ctx.active || !S.uRampLight || swapped) return;
    const k = clamp01(memory.amount), veil = clamp01(S.uVeil.value);
    keep.fog.copy(S.uFogColor.value); if (scene.fog) keep.sceneFog.copy(scene.fog.color);
    keep.keyColor.copy(S.uKeyColor.value); keep.lit.copy(S.uRampLight.value); keep.shadow.copy(S.uRampShadow.value); keep.sky.copy(S.uSkyLight.value); keep.ground.copy(S.uGroundLight.value);
    keep.lampPos.copy(S.uLampPos.value); keep.lampColor.copy(S.uLampColor.value); keep.lampRadius = S.uLampRadius.value; keep.heightFog = S.uHeightFog.value.x;
    keep.density = S.uFogDensity.value; if (scene.fog) keep.sceneDensity = scene.fog.density; keep.hemi = hemi.intensity;
    // (a veil thicker than the remembered mist stays as thick as it is)
    const dens = Math.max(keep.density, keep.density + (memory.fogDensity - keep.density) * k);
    S.uFogDensity.value = dens; if (scene.fog) scene.fog.density = dens;
    hemi.intensity = keep.hemi + (hemiDusk - keep.hemi) * k;
    // (the fog of the moment already carries the veil: the remembered fog goes into the same veil)
    tmp.copy(memory.fog).lerp(S.uVeilColor.value, veil);
    S.uFogColor.value.lerp(tmp, k); if (scene.fog) scene.fog.color.lerp(tmp, k);
    S.uKeyColor.value.lerp(memory.light.keyColor, k); S.uRampLight.value.lerp(memory.light.lit, k); S.uRampShadow.value.lerp(memory.light.shadow, k);
    S.uSkyLight.value.lerp(memory.light.sky, k); S.uGroundLight.value.lerp(memory.light.ground, k);
    S.uHeightFog.value.x += (memory.light.heightFog - S.uHeightFog.value.x) * k;
    S.uLampPos.value.copy(memory.lamp.position); S.uLampRadius.value = memory.lamp.radius; S.uLampColor.value.copy(memory.lamp.color).multiplyScalar(memory.lamp.level * k * DBG);
    if (memory.duskUniform) memory.duskUniform.value = 1 + (DUSK_ON_PAINT - 1) * k;
    swapped = true;
  };
  const takeOff = () => {
    if (!swapped) return;
    S.uFogColor.value.copy(keep.fog); if (scene.fog) scene.fog.color.copy(keep.sceneFog);
    S.uKeyColor.value.copy(keep.keyColor); S.uRampLight.value.copy(keep.lit); S.uRampShadow.value.copy(keep.shadow); S.uSkyLight.value.copy(keep.sky); S.uGroundLight.value.copy(keep.ground);
    S.uLampPos.value.copy(keep.lampPos); S.uLampColor.value.copy(keep.lampColor); S.uLampRadius.value = keep.lampRadius; S.uHeightFog.value.x = keep.heightFog;
    S.uFogDensity.value = keep.density; if (scene.fog) scene.fog.density = keep.sceneDensity; hemi.intensity = keep.hemi;
    if (memory.duskUniform) memory.duskUniform.value = 1;
    swapped = false;
  };
  if (water && typeof water.onMirror === 'function') water.onMirror(ctx.path, putOn, takeOff);
  else {
    const before = scene.onBeforeRender, after = scene.onAfterRender;
    scene.onBeforeRender = function (renderer, sc, camera, target) { before.call(this, renderer, sc, camera, target); if (water && camera === water.virtualCamera) putOn(); };
    scene.onAfterRender = function (renderer, sc, camera) { takeOff(); after.call(this, renderer, sc, camera); };
    ctx.onDispose(() => { scene.onBeforeRender = before; scene.onAfterRender = after; });
  }
  // Above the water the kept lamp is cold: it lights nothing there, neither paint nor the skin ice (the water reads the
  // lamp's light once a frame, after the realm's updates). Whoever makes the kept lamp calls this AFTER making it, so
  // that whatever the lamp wrote this frame is put out again; memory.lamp is given the lit lamp's place and level, and
  // the hook above lights it in the mirror.
  memory.keepLampCold = () => ctx.onUpdate(() => { S.uLampColor.value.setRGB(0, 0, 0); });

  // ---------------------------------------------------------------------------------------------- materials
  // Local colours are the page's chips. Stand-ins and models alike wear these.
  // THE DUSK ON PAINT. The ride's paint has no hour: a face that is neither lit nor in shadow shows its own colour at
  // full strength whatever the light is (an upright limewashed trunk is as white at night as at noon), so the
  // remembered evening's dim light (above) cannot make the trunks in the water sink to dusk by itself. Every material
  // of this area therefore carries `dusk`: its own colour is multiplied by uSnowDusk, which is 1 in the direct view and
  // DUSK_ON_PAINT while the mirror is drawn. With the water's tint that lays shared things down at about 0.47 of the
  // world's brightness, the page's figure. MODELS MUST TAKE IT TOO: kit.model(url, { extend: [shared.light.dusk, shared.light.wet] }).
  const uSnowDusk = { value: 1 };
  const dusk = { uniforms: { uSnowDusk }, fragmentPars: 'uniform float uSnowDusk;', albedo: 'albedo *= uSnowDusk;' };
  memory.duskUniform = uSnowDusk;
  /** kit.gouache with the area's dusk on it. `own: true` for a memory thing that gives its own light (blossom): no dusk. */
  const paint = (o) => { const { own, ...rest } = o; return kit.gouache(own ? rest : { ...rest, extend: [dusk, ...[].concat(rest.extend || [])] }); };
  // THE SNOW'S OWN LIGHT (2-light.md, "colour"). The director: "everything above the water is one lilac white. The key
  // has warm cream where snow is lit and blue-violet in its shadows." The ride's ramp cannot do that here: with a light
  // that has no direction it steps only where a face is steeper than forty degrees, so a field, a bank's back and a
  // drift are all one flat white. Snow therefore lays its own tones, and every snow surface of the area takes them by
  // wearing this (it is `shared.light.lift`, the name snow has always worn; mat.snow and mat.snowPaint carry it):
  //   - FOUR TONES, as they are to be SEEN (chips, through seen()): warm paper where it looks up at the brighter
  //     quarter of the sky; frost, the cold white, on a slope that leans away from it; lavender, the only shadow, on
  //     what is steep or turned away; a deeper lavender underneath. The steps between them are dry-brushed.
  //   - THE BRIGHTER QUARTER is ahead and to the left (south-west: the cloud's edge the thaw rides out under). It is a
  //     lean, not a sun: nothing casts a shadow, and the ride's own key light stays straight overhead for wood and ice.
  //     Looking down the road and out over the left plain the rider sees the shaded side of every form.
  //   - WIND-PACKED SNOW on whatever lies level (page: "low ridges 5 to 15 cm"): crust in long plates stepping down the
  //     wind (from the north-west), each flat, with a short scarp at its lee edge, and broad drifts under them. It is
  //     laid in the paint (the surface's normal is leaned, nothing is moved: shared.land.snowHeight is as it was), it
  //     never shimmers (a scarp is never drawn thinner than the screen can hold: it goes soft, then flat), and far off
  //     the plain is two temperatures lying in long bands down the wind.
  //   - a surface's own paint (vertex paint from Blender, the snow tile, the brush) is kept as a variation about paper.
  // Snow no longer needs the breath of its own light the page gave it (0.08 of chip 1): its tones are authored as seen.
  // (FOURTH HOLDER: THE LEAN IS GONE. Toned by a "brighter quarter", every form that leaned away from it was lavender ON
  // TOP: the river's left bank a blue wedge, the ridge on every bough of the great tree lilac where the key painting
  // has it white. The page: "the light has no direction"; the director: "warm cream where snow is lit and blue-violet
  // in its shadows". So A FORM IS TONED BY HOW FAR IT LOOKS UP, and by nothing else: paper on what looks up, frost on
  // its shoulders, lavender on what stands upright, a deeper lavender underneath. A ridge of snow on a bough is then a
  // round thing from every side and it is the same thing from every side. ONLY THE WIND'S OWN RELIEF HAS A SIDE: the
  // lee scarp of every plate of crust on level snow is a cool line, frost then lavender as it steepens, its windward
  // edge stays paper: the plain is drawn in long low strokes down the wind and is never one flat white.)
  const uSnow = {
    uSnowWarm: { value: seen('#F2EAE1') }, uSnowFrost: { value: seen(C.frost) }, uSnowShade: { value: seen(C.lavender) }, uSnowDeep: { value: seen('#9790BC') },
    uSnowPaper: { value: col(C.paper) },
    uSnowSun: { value: new THREE.Vector3(0, 1, 0) },                            // (kept for whoever declared it: straight up. Snow has no brighter quarter any more)
    uSnowWind: { value: new THREE.Vector4(-0.75, 0.66, 1, 1) },                 // xy: the way the wind blows (x, z); z: how hard the plates lean the normal; w: the cold bands
    // the painted snow (`snow`, art.js): set.js puts the picture in once it has loaded; until then a white point (nothing)
    tSnowTile: { value: (() => { const t = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1); t.needsUpdate = true; return t; })() },
    uSnowTile: { value: new THREE.Vector4(1 / 3.2, 1, 0, 0.3) },                // x: repeats to a metre; y: the picture's mean luminance; z: how far one of its hollows lets the tone down (0 until the picture is in); w: how much of its tooth the paint keeps
    uSnowLee: { value: new THREE.Vector4(2.6, 0.05, 1, 0) },                    // x: how far a lee scarp is let down the tones for its lean; y: how far the brush moves a border; z: how strongly the wind ridges are drawn on the flood
  };
  { const w = uSnow.uSnowWind.value, l = Math.hypot(w.x, w.y); w.x /= l; w.y /= l; }
  const snowForm = {
    uniforms: uSnow,
    fragmentPars: /* glsl */`
      uniform vec3 uSnowWarm, uSnowFrost, uSnowShade, uSnowDeep, uSnowPaper, uSnowSun; uniform vec4 uSnowWind, uSnowLee, uSnowTile; uniform sampler2D tSnowTile;
      float gSnowUp; vec2 gSnowLean;
      float snowH(vec2 p) { vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
      float snowN(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(snowH(i), snowH(i + vec2(1.0, 0.0)), f.x), mix(snowH(i + vec2(0.0, 1.0)), snowH(i + vec2(1.0, 1.0)), f.x), f.y); }
      // crust in plates: flats, and a short scarp where one steps down to the next (soft: half the scarp's share of a step)
      float snowPlates(vec2 q, float soft) { float n = snowN(q) * 0.62 + snowN(q * 2.3 + 7.3) * 0.38, x = n * 5.0, f = fract(x); return (floor(x) + smoothstep(0.5 - soft, 0.5 + soft, f)) * 0.2; }
      // metres of wind-packed snow at a place (fw: metres a pixel covers there)
      float snowLie(vec2 p, float fw) {
        vec2 q = vec2(dot(p, uSnowWind.xy), dot(p, vec2(-uSnowWind.y, uSnowWind.x)));
        return 0.40 * snowPlates(q * vec2(0.035, 0.13), clamp(0.06 + 0.5 * fw, 0.06, 0.5)) + 0.9 * snowPlates(q * vec2(0.009, 0.031) + 11.7, clamp(0.05 + 0.12 * fw, 0.05, 0.5));
      }
      // ONE WIND RIDGE AS A PAINTER DRAWS IT (fourth holder): a short crest and the long cool tail in its lee, tapering
      // down the wind. q: metres down the wind and across it; rows rowW apart, one ridge at most to every len metres
      // of a row; fa: metres across the wind that a pixel covers (a ridge thinner than the screen can hold goes faint,
      // then is not drawn: seen broadside from the boat the far ones go, seen end-on they run to the horizon as lines)
      float snowStroke(vec2 q, float rowW, float len, float fa, float seed) {
        float j = floor(q.y / rowW), fy = fract(q.y / rowW);
        float u = q.x / len + snowH(vec2(j, seed)) * 7.31, iu = floor(u), fu = fract(u);
        vec2 id = vec2(iu, j + seed * 17.0);
        float r1 = snowH(id), r2 = snowH(id + 5.3), r3 = snowH(id + 11.7);
        float l = 0.25 + 0.6 * r3, t = (fu - (0.08 + 0.3 * r2)) / l, tc = clamp(t, 0.0, 1.0);
        float wide = rowW * (0.07 + 0.16 * r3) * (1.0 - 0.8 * tc);
        float d = abs(fy - (0.5 + 0.3 * (r2 - 0.5))) * rowW, e = max(fa * 0.75, 0.01), eu = e / (l * len);
        float body = (1.0 - smoothstep(wide - e, wide + e, d)) * smoothstep(-eu, eu, t) * (1.0 - smoothstep(0.5, 1.0, t));
        return step(r1, 0.62) * body * clamp(wide * 2.4 / max(fa, 1e-3) - 0.2, 0.0, 1.0);
      }`,
    albedo: /* glsl */`{
      gSnowUp = N.y; gSnowLean = vec2(0.0);
      vec2 sp = vWPos.xz; float sfw = max(length(dFdx(sp)), length(dFdy(sp))), se = max(0.05, sfw * 0.75);
      float level = smoothstep(0.72, 0.96, N.y) * uSnowWind.z;
      if (level > 0.0) {
        float h0 = snowLie(sp, sfw);
        gSnowLean = level * vec2(h0 - snowLie(sp + vec2(se, 0.0), sfw), h0 - snowLie(sp + vec2(0.0, se), sfw)) / se;      // the way the crust falls away here (downhill), as a slope
        N = normalize(N + vec3(gSnowLean.x, 0.0, gSnowLean.y));
      }
    }`,
    light: /* glsl */`{
      // how far the FORM looks up; and, on level snow, how far the crust falls away down the wind (a lee scarp)
      float lee = max(dot(gSnowLean, uSnowWind.xy), 0.0);
      float ss = gSnowUp - uSnowLee.x * lee + stroke * uSnowLee.y;
      vec2 bq = vec2(dot(vWPos.xz, uSnowWind.xy), dot(vWPos.xz, vec2(-uSnowWind.y, uSnowWind.x)));
      // THE PAINTED SNOW (the tile called snow: pillows and scallops of wind-packed snow, their crests lying across the wind):
      // laid from above on what lies, from the side on what stands, twice (a stride and three strides) so that no repeat
      // shows; where the painting has a hollow the tone is let down toward frost and lavender, and a breath of its tooth
      // is kept in the paint. Far off it is its own mean and says nothing.
      float painted = 1.0;
      if (uSnowTile.z > 0.0) {
        vec3 an = abs(N);
        vec2 tq = an.y > 0.55 ? vec2(bq.y, bq.x) : (an.x > an.z ? vWPos.zy : vWPos.xy);
        tq *= uSnowTile.x;
        painted = (0.6 * dot(texture2D(tSnowTile, tq).rgb, vec3(0.2126, 0.7152, 0.0722)) + 0.4 * dot(texture2D(tSnowTile, tq * 0.29 + 0.37).rgb, vec3(0.2126, 0.7152, 0.0722))) / uSnowTile.y;
        ss += (painted - 1.0) * uSnowTile.z;
      }
      float cold = smoothstep(0.42, 0.72, snowN(bq * vec2(0.006, 0.045) + 3.7) * 0.6 + snowN(bq * vec2(0.017, 0.11)) * 0.4) * uSnowWind.w * smoothstep(0.8, 0.98, gSnowUp);
      vec3 lit = mix(uSnowWarm, uSnowFrost, 0.55 * cold);
      vec3 tone = mix(uSnowDeep, uSnowShade, smoothstep(-0.62, -0.12, ss));
      tone = mix(tone, uSnowFrost, smoothstep(0.22, 0.5, ss));
      tone = mix(tone, lit, smoothstep(0.66, 0.84, ss));
      // the flood's own drawing: wind ridges, fine ones and long low drifts, on level snow that lies low (the plain, the
      // shelf's back, the islet's skirts: not the ridge on a bough, not a bank's top)
      float ground = smoothstep(0.86, 0.97, gSnowUp) * (1.0 - smoothstep(0.75, 1.15, vWPos.y)) * uSnowLee.z;
      if (ground > 0.01) {
        float fa = max(fwidth(bq.y), 1e-3);
        float fine = snowStroke(bq, 0.85, 9.0, fa, 1.0) + 0.8 * snowStroke(bq + vec2(4.1, 0.37), 1.3, 14.0, fa, 2.0);
        float drift = snowStroke(bq + vec2(11.0, 0.9), 3.1, 31.0, fa, 3.0);
        tone = mix(tone, mix(uSnowFrost, uSnowShade, 0.7), ground * clamp(0.8 * fine + 0.42 * drift, 0.0, 0.85));
      }
      c = tone * mix(vec3(1.0), albedo / uSnowPaper, 0.6) * mix(1.0, clamp(painted, 0.8, 1.06), uSnowTile.w) + albedo * lamps;
    }`,
  };
  const lift = snowForm;
  // BLOSSOM IN THE WATER, AND WHAT LIGHTS IT (third holder; 2-light.md, "the lie: what lights the blossom").
  // The director: "the lie is a pink fog ... the blossom must be bright against dark water, never a wash over it".
  // The masses are the flood orchard's real ones now, and an orchard in flower seen from the water IS a bank of
  // blossom from hedge to hedge: with every crown giving its own light at one strength, two fifths of the water was
  // pink (the key painting: a fifth; the page: an eighth, with a quarter indigo and violet). So blossom no longer
  // burns of itself everywhere. Its paint still carries its colours AS THEY ARE TO BE SEEN IN THE WATER (inWater(hex):
  // shared.blossom has the three tones), and FOUR LIGHTS fall on it, added:
  //   1. THE DUSK (uBlossomDuskE): the remembered evening's own light, dim and violet. Blossom that nothing else
  //      lights is a soft violet mass on ink water: the page's "quarter indigo and violet". It is still plainly a
  //      crown in flower where the bare tree stands above: the lie can be read, and it does not shout.
  //   2. THE GREAT TREE IS LIT FROM WITHIN (uBlossomHome, uBlossomSelfE): the page's "the same wood in full blossom,
  //      lit from within". Within 24 m of the bole (gone by 36) blossom carries its pink. What stands HIGHER lies
  //      DEEPER in the water and keeps less of it (uBlossomDeep: from 6 m, to a third in 22 m): the keel hangs over a
  //      vault whose low garlands burn and whose top goes down into the dark; from the plain it is the one pale tree
  //      in the black road, as the key painting has it.
  //   3. THE KEPT LAMP, alight in the water (uBlossomLamp; set.js keeps it from memory.lamp): "warmer and brighter
  //      within 14 m of the lamp". Amber-rose, and it lights the bellies it hangs under.
  //   4. THE BOW LANTERN: the rider carries a light, and in the water it wakes the blossom it passes: a pool of rose
  //      travels with the boat (13 m), the avenue's crowns light as the bow comes up to them and sink to violet
  //      astern, and beside the hull, at arm's length, the lie is pink. (It is an answer to the boat, and the picture
  //      is never still.)
  // uBlossom is how brightly the blossom burns of itself: 1 = as above. The staging raises it when the fireflies' front
  // passes (every crown then takes the tree's own light, by 1.2 for each 1 above 1), and set.js lets it go with the thaw.
  // IT GOES WITH THE THAW. From s 228 to 246 the water lets go: every memory thing is to fade by memory.amount. Paint is
  // opaque, so blossom is thinned out grain by grain (uMemory: 1 whole .. 0 gone; the mirror is multisampled and the
  // water softens it, so in the water it simply pales away). set.js drives it with the rest of the letting go.
  // AND IT IS SNOWED OUT IN THE BIRCH RIVER (uSnowBlind: 1 in the river, 0 once the plain has opened).
  // AND THE DUSK TAKES WHAT IS FAR AND UNLIT (uBlossomDusk.x: a density, about twice the mist's own; .y: how much of
  // it at most): rank behind rank of violet goes down into the evening. What a lamp lights is seen through that mist
  // as a flame is: it takes only the remembered evening's ordinary fog.
  // &bl=key:value,... tries other numbers for one picture: dusk, most (the mist); from, deep (m); home0, home1 (m);
  // lampr, boatr (m); lampk, boatk, selfk, duskk (how much of each light); belly.
  const LIE_OLD = QS.get('lie') === 'old';                     // (developer: the fourth holder's light on blossom and its numbers, to compare)
  const uBlossom = { value: 1 }, uMemory = { value: 1 }, uSnowBlind = { value: 0 }, uBlossomDusk = { value: new THREE.Vector2(bl('dusk', 0.0085), bl('most', 0.94)) };
  const uBlossomDeep = { value: new THREE.Vector4(bl('from', LIE_OLD ? 5 : 3), 1 / bl('deep', LIE_OLD ? 6.5 : 5.5), bl('far0', LIE_OLD ? 45 : 25), bl('far1', LIE_OLD ? 110 : 70)) };      // .zw: metres from the eye between which the great tree's own light comes up
  const uBlossomLamp = { value: new THREE.Vector4(0, -100, 0, 0) };      // the lit lamp's flame (the realm's own place) and how brightly it burns: set.js
  const uBlossomHome = { value: new THREE.Vector4(plan.tree.at[1], -plan.tree.at[0], bl('home0', LIE_OLD ? 24 : 27), bl('home1', LIE_OLD ? 36 : 36)) };
  const uBlossomReach = { value: new THREE.Vector4(bl('lampr', 12), bl('boatr', LIE_OLD ? 8 : 9), bl('lampk', LIE_OLD ? 2.6 : 1.0), bl('boatk', LIE_OLD ? 5 : 0.45)) };      // (fourth holder: the two lamps' light on blossom, four and five times what it was. Measured beside the key painting, whose blossom is #D9A0B4 in its lights and #C48EA6 in its middle: ours stood at #7B4E5F, a brick rose at a third of the brightness. At 5 the pool beside the hull is #CE8B99 with #DE9EB0 in its lights: pink, never white)
  // (the dusk's tone is a COLOUR, authored as it is to be seen in the water: a violet a step above the water's ink. A
  // pink paint under a dim light does not get there: the picture's last pass lifts every dark, and blossom at a
  // quarter of its strength was still a plum sheet from bank to bank. uBlossomRef: the paint's middle tone, so that
  // the dabs and the form of a mass are kept, at less than their strength, inside the dusk.)
  const uBlossomDuskE = { value: inWater(QS.get('duskc') ? '#' + QS.get('duskc') : '#474268').multiplyScalar(bl('duskk', 1)) }, uBlossomSelfE = { value: new THREE.Color(0.74, 0.6, 0.86).multiplyScalar(bl('selfk', 0.55)) }, uBlossomFrontE = { value: new THREE.Color(1.0, 0.94, 0.98) };
  const uBlossomRef = { value: inWater(C.blossom) };
  // (and the dusk has DEPTH of its own: what stands low is a rose-violet, what stands high, deep in the water, an
  // indigo near the water's own ink. Without it the vault under the great tree is one flat violet.)
  const uBlossomDuskHi = { value: inWater(QS.get('duskh') ? '#' + QS.get('duskh') : '#2C2B4E').multiplyScalar(bl('duskk', 1)) };
  const uBlossomWarmE = { value: LIE_OLD ? new THREE.Color(1.5, 1.14, 0.94) : new THREE.Color(1.3, 1.02, 0.84) }, uBlossomBoatE = { value: LIE_OLD ? new THREE.Color(1.12, 1.0, 1.0) : new THREE.Color(1.1, 1.0, 0.96) };      // (fourth holder: a hair of the flame's warmth only. At 1.22, 1, 0.92 the pool of blossom beside the hull was salmon; chip 7 is a cool pink)
  const uBlossomForm = { value: new THREE.Vector4(bl('form', 1), bl('flat', 0.5), bl('afar', 1.8), bl('cards', 0.42)) };      // .z: how brightly the great tree stands in the water from afar; .w: what a spray planted on a mass's underside keeps of its tone      // .x: how much of a mass's own form (its light caps and dark bellies) the dusk keeps; .y: how much of it a lamp's light keeps
  // ---- the fourth holder's light on blossom, kept for comparing (&lie=old): four lights on two paints
  const holdsLightOld = `{
      vec3 Vm = normalize(cameraPosition - vWPos);
      float edge = 1.0 - abs(dot(N, Vm)); edge *= edge;
      float opn = max(smoothstep(-0.8, 0.1, N.y), edge * 0.9);
      vec3 body = mix(uBlossomShade, vec3(1.0), opn) * (1.0 + 0.2 * edge);
      float deepB = exp(-max(vWPos.y - uBlossomDeep.x, 0.0) * uBlossomDeep.y);
      // (the great tree. From far off it is ONE thing and it is pale: the whole crown carries its pink, a little less
      // with height. Under it, it is a VAULT, and a vault lit evenly is a pink lid on the pond: within 45 m of the eye
      // its own light has gone down to a breath of lilac on the low garlands, and the lamps do the lighting.)
      float eyeD = length(cameraPosition - vWPos), farE = smoothstep(uBlossomDeep.z, uBlossomDeep.w, eyeD);
      float homeR = 1.0 - smoothstep(uBlossomHome.z, uBlossomHome.w, length(vWPos.xz - uBlossomHome.xy));
      float homeB = homeR * deepB * (1.0 - farE), homeF = homeR * exp(-max(vWPos.y - 6.0, 0.0) / 26.0) * farE;
      // (fourth holder: near, the tree's own light is for the eye that LOOKS DOWN. Beside the hull the keel hangs over a
      // vault of lit blossom, pink in its low garlands and going down through violet into the dark; across the pond,
      // where the water is seen at a glance and shows every low skirt side by side, it stays the dusk's, and the
      // lamps make their pools in it. Lit evenly it was a lid from rim to rim.)
      homeB *= smoothstep(0.12, 0.5, -Vm.y);
      // (the kept lamp: the side of a mass that is turned to it, and, where a mass hangs between the eye and the lamp, its
      // edge lit through: so every mass near the lamp is drawn round, pink toward the flame and dusk behind, and the
      // nearer ones stand dark against the glow with a rim of light. Seen from far off the lamp's reach reads wider,
      // as a flame's does through mist: from the plain the tree's heart is rose, and it draws in as the boat comes on.)
      vec3 dK = uBlossomLamp.xyz - vWPos; float rK = length(dK); vec3 LK = dK / max(rK, 0.01);
      float reachK = uBlossomReach.x * (1.0 + 0.6 * smoothstep(30.0, 120.0, eyeD));
      float aK = uBlossomLamp.w * uBlossomReach.z * exp(-rK * rK / (reachK * reachK)) * (clamp(0.22 + 0.78 * dot(N, LK), 0.0, 1.0) + 0.9 * edge * pow(max(dot(-Vm, LK), 0.0), 2.0));
      // (the bow lantern: what hangs over the hull and beside it)
      vec3 dB = uLanternPos - vWPos; float rB = length(dB);
      float aB = uBlossomReach.w * exp(-rB * rB / (uBlossomReach.y * uBlossomReach.y)) * clamp(0.7 + 0.3 * dot(N, dB / max(rB, 0.01)), 0.0, 1.0);
      float frontB = max(uBlossom - 1.0, 0.0) * (0.35 + 0.65 * deepB) + uBlossomForm.z * homeF * min(uBlossom, 1.0);
      gBlossomLit = clamp(0.4 * homeB * uBlossom + frontB + aK + aB, 0.0, 1.0);
      // (fourth holder) WHAT THE SKY LIGHTS AND WHAT A LAMP LIGHTS ARE TWO PAINTS. The mass's own paint (albedo) is laid
      // by its form as the sky sees it: pale caps, pink flanks, bellies gone down to plum. That is what the dusk and
      // the tree's own light fall on: a crown in the water is then SEPARATE MASSES, each a pale cap over the dark,
      // with the water's ink between them, and never a sheet. But a lamp hangs UNDER the blossom and lights its
      // bellies: what the kept lamp and the bow lantern reach is the blossom's own pink (flatB: a breath of its dabs
      // left in), drawn round by where the flame is.
      vec3 flatB = uBlossomRef * mix(vec3(1.0), albedo / max(uBlossomRef, vec3(1e-3)), uBlossomForm.y);
      // (a lamp's light on blossom has a ceiling: an arm's length from the flame it is still pink, never white)
      aK = 2.2 * (1.0 - exp(-aK / 2.2)); aB = 2.0 * (1.0 - exp(-aB / 2.0));
      c = body * (mix(uBlossomDuskHi, uBlossomDuskE, exp(-max(vWPos.y - 4.0, 0.0) / 9.0)) * mix(vec3(1.0), albedo / uBlossomRef, uBlossomForm.x) + albedo * (uBlossomSelfE * (homeB * min(uBlossom, 1.0)) + uBlossomFrontE * frontB) + flatB * (uBlossomWarmE * aK + uBlossomBoatE * aB));
    }`;
  // ---- THE LIGHT ON BLOSSOM (fifth holder; 2-light.md, "the lie: one paint, three levels").
  // As found, unlit blossom was a flat violet laid by the mass's form over a plum belly that was nearly the water's own
  // dark, and pink only inside hand-set regions (near a lamp, low down, where the eye looks steeply): from the second
  // avenue the great tree in the water was a brick-rose slab with a ruled edge and black cracks, and the avenue a
  // mottle of violet on plum. The key painting's water is the opposite: ONE crisp, pale, luminous tree, its shade a
  // violet that is still a colour, on water that is the dusk sky's smooth aubergine.
  // So: BLOSSOM IS ONE PAINT (the flood orchard's own tones by its own form, in this area's three colours: a pale pink,
  // the chip, and a violet SHADE, never a dark), and it gives ITS OWN LIGHT AT A LEVEL, smoothly:
  //   - THE DUSK (uBlossomLevel.x): what every crown keeps. Dim, and drawn toward the dusk's violet (uBlossomTint).
  //   - WHAT IS NEAR THE EYE (.y; uBlossomNear.xy metres): the rider's own light wakes the blossom round the boat: the
  //     crowns come up to pink as the bow nears them and sink to the dusk astern.
  //   - THE GREAT TREE (.z; uBlossomHome): lit from within, from any distance: the one pale tree in the water.
  //   - WHAT STANDS HIGH LIES DEEP (.w; uBlossomDeep): its light goes down with its height to .w of itself, less so seen
  //     from afar (there the tree is one thing): under the keel the low garlands are pink and the vault goes down
  //     through violet into the sky's own dark.
  //   - the two LAMPS add to it: the kept lamp alight (amber-rose, the side of a mass turned to the flame and the rim
  //     of one that hangs before it) and the bow lantern (a breath, beside the hull). With a ceiling: pink, never white.
  // What is far and dim goes into the dusk's mist (the `fog` chunk above), so the far ranks of the avenue are the
  // water's own smooth aubergine and not a mottle.
  const holdsLight = `{
      vec3 Vm = normalize(cameraPosition - vWPos);
      float eyeD = length(cameraPosition - vWPos);
      float edge = 1.0 - abs(dot(N, Vm)); edge *= edge;
      float opn = max(smoothstep(-0.8, 0.1, N.y), edge * 0.9);
      vec3 body = mix(uBlossomShade, vec3(1.0), opn) * (1.0 + 0.2 * edge);
      float farE = smoothstep(uBlossomDeep.z, uBlossomDeep.w, eyeD);
      float deepB = exp(-max(vWPos.y - uBlossomDeep.x, 0.0) * uBlossomDeep.y * mix(1.0, 0.3, farE));
      float homeR = 1.0 - smoothstep(uBlossomHome.z, uBlossomHome.w, length(vWPos.xz - uBlossomHome.xy));
      float nearE = 1.0 - smoothstep(uBlossomNear.x, uBlossomNear.y, eyeD);
      float own = max(uBlossomLevel.x, max(uBlossomLevel.y * nearE, mix(uBlossomLevel.w, uBlossomLevel.z, farE) * homeR)) * mix(uBlossomHigh, 1.0, deepB) * min(uBlossom, 1.0);
      float frontB = max(uBlossom - 1.0, 0.0) * (0.35 + 0.65 * deepB);
      vec3 dK = uBlossomLamp.xyz - vWPos; float rK = length(dK); vec3 LK = dK / max(rK, 0.01);
      float reachK = uBlossomReach.x * (1.0 + 0.6 * smoothstep(30.0, 120.0, eyeD));
      float aK = uBlossomLamp.w * uBlossomReach.z * exp(-rK * rK / (reachK * reachK)) * (clamp(0.35 + 0.65 * dot(N, LK), 0.0, 1.0) + 0.9 * edge * pow(max(dot(-Vm, LK), 0.0), 2.0));
      vec3 dB = uLanternPos - vWPos; float rB = length(dB);
      float aB = uBlossomReach.w * exp(-rB * rB / (uBlossomReach.y * uBlossomReach.y)) * clamp(0.7 + 0.3 * dot(N, dB / max(rB, 0.01)), 0.0, 1.0);
      float lit = own + frontB;
      vec3 hue = mix(uBlossomTint, vec3(1.0), smoothstep(uBlossomNear.z, uBlossomNear.w, lit + aK + aB));
      gBlossomLit = clamp((lit - uBlossomLevel.x) * 1.6 + aK + aB, 0.0, 1.0);
      vec3 Lb = hue * lit + uBlossomWarmE * aK + uBlossomBoatE * aB;
      float peakB = max(Lb.r, max(Lb.g, Lb.b));
      Lb *= 1.3 * (1.0 - exp(-peakB / 1.3)) / max(peakB, 1e-3);
      // THE MASSES' OWN GRAIN. The flood orchard draws a mass in a mirror as a smooth pale cushion (its water shows what the
      // air already shows in flowers). Here the water is the only place the blossom is: a mass is laid in CLUSTERS OF
      // FLOWERS, each its own tone, with a crease of shade between two, the size of a few pixels at any distance; and a
      // near mass is OPEN in patches along the clusters' own outlines: one looks through it at boughs, at the far wall
      // of the crown in its shade, at the dusk. Not the sprays (cut cards), nor single flowers and cow parsley (low down).
      float grainB = 1.0;
      #ifndef USE_MAP_UV
      { float massK = smoothstep(2.4, 3.2, vWPos.y);
        if (massK > 0.0) {
          vec3 anB = abs(N); vec2 qB = anB.y >= anB.x && anB.y >= anB.z ? vWPos.xz : (anB.x >= anB.z ? vWPos.zy : vWPos.xy + 3.7);
          float lodB2 = log2(max(eyeD / 10.0, 1.0)), l0B = floor(lodB2), kB = uBlossomGrain.x * exp2(-l0B);
          float bigB = step(0.15 + 0.7 * snowBlN(qB * 0.9 * exp2(-l0B) + 3.1), lodB2 - l0B);
          vec3 cellB = snowBlCell(qB * kB * (1.0 - 0.5 * bigB) + 11.3 * (l0B + bigB));
          grainB = (1.0 + uBlossomGrain.z * (cellB.z - 0.5) * 2.0) * mix(1.0 - uBlossomGrain.y, 1.0, smoothstep(0.0, 0.16, cellB.y));
          float slowB = snowBlN(qB * 0.13 + 5.3) * 0.5 + snowBlN(qB * 0.36 + 2.6) * 0.32 + snowBlN(qB * 0.83 + 1.9) * 0.18;      // (windows a few metres across, and smaller ones in what is left)
          float openB = uBlossomGrain.w * (1.0 - smoothstep(34.0, 70.0, eyeD)) * massK;
          if (slowB + 0.14 * (cellB.z - 0.5) < openB * 1.9 - 0.02 && openB > 0.01) discard;
          grainB = mix(1.0, grainB, massK * (1.0 - uBlossomForm.x * smoothstep(18.0, 45.0, eyeD)));
        } }
      #endif
      c = albedo * body * Lb * grainB;
    }`;
  // (FIFTH HOLDER: THE LIGHT IS ONE PAINT AGAIN, AND IT HAS LEVELS. See the note above `holdsLight` below.)
  const uBlossomLevel = { value: new THREE.Vector4(bl('lvdusk', 0.2), bl('lvnear', 0.5), bl('lvhome', 1.15), bl('lvhomen', 1.1)) };      // how brightly blossom stands in the water: all of it (the dusk); what is near the eye; the great tree seen from afar, and from under it
  const uBlossomHigh = { value: bl('lvhigh', 0.08) };
  const uBlossomGrain = { value: new THREE.Vector4(bl('cells', 3.2), bl('crease', 0.2), bl('chance', 0.14), bl('gaps', 0.22)) };      // the masses' own grain: clusters to a metre (within 10 m; beyond, they keep their size on the screen); how dark the crease between two; how far one cluster's tone stands from the next; how much of a near mass is open (one looks through it at the dusk)          // how much of its light is left to what stands highest (deepest in the water)
  const uBlossomNear = { value: new THREE.Vector4(bl('near0', 8), bl('near1', 38), bl('hue0', 0.15), bl('hue1', 0.6)) };      // metres from the eye between which the near light goes down to the dusk's; the light below which blossom is the dusk's violet, and above which it is its own pink
  const uBlossomTint = { value: new THREE.Color(bl('tr', 0.62), bl('tg', 0.62), bl('tb', 1.0)) };      // what dim blossom is multiplied by: the dusk's violet
  const holdsOf = (uBlossomShade) => ({ uniforms: { uBlossom, uMemory, uSnowBlind, uBlossomDusk, uBlossomDeep, uBlossomLamp, uBlossomHome, uBlossomReach, uBlossomDuskE, uBlossomDuskHi, uBlossomSelfE, uBlossomFrontE, uBlossomWarmE, uBlossomBoatE, uBlossomRef, uBlossomShade, uBlossomForm, uBlossomLevel, uBlossomNear, uBlossomTint, uBlossomHigh, uBlossomGrain },
    fragmentPars: `uniform float uBlossom, uMemory, uSnowBlind; uniform vec2 uBlossomDusk; uniform vec4 uBlossomDeep, uBlossomLamp, uBlossomHome, uBlossomReach, uBlossomForm; uniform vec3 uBlossomShade, uBlossomDuskE, uBlossomDuskHi, uBlossomSelfE, uBlossomFrontE, uBlossomWarmE, uBlossomBoatE, uBlossomRef, uBlossomTint; uniform vec4 uBlossomLevel, uBlossomNear, uBlossomGrain; uniform float uBlossomHigh; float gBlossomLit;
      vec2 snowBlH2(vec2 p) { vec3 q = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973)); q += dot(q, q.yzx + 33.33); return fract((q.xx + q.yz) * q.zy); }
      float snowBlN(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(snowBlH2(i).x, snowBlH2(i + vec2(1.0, 0.0)).x, f.x), mix(snowBlH2(i + vec2(0.0, 1.0)).x, snowBlH2(i + vec2(1.0, 1.0)).x, f.x), f.y); }
      // clusters of flowers: x how far from the nearest cluster's middle, y how far inside its own border (0 in the crease between two), z the cluster's own chance
      vec3 snowBlCell(vec2 p) { vec2 i = floor(p), f = fract(p); float d1 = 9.0, d2 = 9.0, id = 0.0;
        for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) { vec2 o = vec2(float(x), float(y)), h = snowBlH2(i + o), d = o + 0.15 + 0.7 * h - f; float dd = dot(d, d) * (0.8 + 0.5 * h.y); if (dd < d1) { d2 = d1; d1 = dd; id = h.x; } else if (dd < d2) d2 = dd; }
        return vec3(sqrt(d1), sqrt(d2) - sqrt(d1), id); }`,
    fog: 'fog = mix(fog, 1.0, uSnowBlind * smoothstep(14.0, 52.0, dist)); fog = max(fog, (1.0 - 0.8 * gBlossomLit) * uBlossomDusk.y * (1.0 - exp(-uBlossomDusk.x * uBlossomDusk.x * dist * dist)));',
    // (and by where it STANDS: the blossom is thinner down the route from s 240 and there is none beyond s 262, so that
    // from the second avenue the road ahead is seen to turn pale before the boat is there: page, moment s 224)
    // (fourth holder: THE SPRAYS GO BY THE FORM TOO. The flood orchard's sprays are cut cards whose tone is written into
    // them when they are planted, by that area's own rule; the masses' rule is set from here (memory.js, FORM). Left
    // alone the sprays stood a tone lighter than the mass they grow on, on every side of it: a pale skin over all, and
    // the water was a sheet again. A spray that grows on a mass's flank is let down toward the mass's own shade, one
    // beneath it further: USE_MAP_UV is true of the cards and of nothing else that wears this.)
    albedo: `float snowMem = min(uMemory, 1.0 - smoothstep(240.0, 262.0, -vWPos.z)); if (snowMem < 0.999 && fract(sin(dot(floor(gl_FragCoord.xy), vec2(12.9898, 78.233))) * 43758.5453) > snowMem) discard;
      #ifdef USE_MAP_UV
        albedo *= mix(uBlossomForm.w, 1.0, smoothstep(-0.5, 0.85, N.y));
      #endif`,
    // ITS FORM: what looks DOWN is in the mass's own shade; what looks out sideways or up carries its colour; and the
    // edge that turns from the eye is the palest (thin petals), so that every mass is drawn round against the next one
    // and against the dark between them. The eye is the camera that is drawing: in the water, the mirror's.
    light: LIE_OLD ? holdsLightOld : holdsLight });
  // What a mass's belly is multiplied by. TWO WEARINGS of the one light:
  //   holds      for blossom that brings its own form (the flood orchard's masses and sprays, which lay their three tones
  //              by each clump's round: memory.js, heroes.js; single flowers; cow parsley in flower): its belly is only
  //              drawn a little toward the dusk, or the form is shaded twice and a crown seen from below is a violet lid
  //   holdsPuff  for a plain mass in one pink (the stand-in puffs: shared.mat.blossom): its belly goes to a dusk mauve,
  //              between rose and the page's periwinkle shade (#8E8AA8)
  const holds = holdsOf({ value: new THREE.Color(1, 1, 1).lerp(new THREE.Color(0.42, 0.5, 0.74), bl('belly', 0.35)) }), holdsPuff = holdsOf({ value: new THREE.Color(0.42, 0.5, 0.74) });
  /**
   * The three tones of blossom as the water is to show them (page chip 7: pink, never white; its shade the page's
   * #8E8AA8). From a boat the water shows every crown from below: what is seen is mostly the shade, with the pink as
   * the lit rims and the far sides. That keeps it a dusk and not a sweet: a vault of lilac with rose light in it.
   */
  // (2-light.md: the three stand closer than they did, pale, the chip, a rose under it: the dusk of a mass's belly is
  // laid by `holds` from its round, on whatever paint it wears, so it is no longer painted in here as well.)
  // (second holder: measured in the water beside the key painting, whose lit blossom is #E7B7C0 and whose middle tone is
  // #B991A6. With #F4DDDF on top the lit dabs landed at #DCBFC8, a lilac white: "pink, never white, or it is snow". The
  // top is now a pale pink that stays pink, the body the chip, and under it a deeper rose.)
  // (fourth holder: &btop= &bside= &bunder= try other tones for one picture, as hex without the #)
  const hexQ = (k, d) => (/^[0-9a-fA-F]{6}$/.test(QS.get(k) || '') ? '#' + QS.get(k) : d);
  const blossom = { top: inWater(hexQ('btop', '#F6D3D6')), side: inWater(hexQ('bside', C.blossom)), under: inWater(hexQ('bunder', LIE_OLD ? '#4A3358' : '#8A7FA8')) };
  // WOOD IS WET UNDERNEATH (page chip 5: "ink: the wet underside of every bough, near twigs"). From a boat nearly all of
  // a tree is seen from below, so this is what makes the orchard ink line and not plum: the side of a bough keeps its
  // bark plum, its belly goes to ink. Models take it with kit.model(url, { extend: shared.light.wet }).
  const wet = { albedo: 'albedo *= mix(0.4, 1.0, smoothstep(-0.6, 0.3, N.y));' };
  const mat = {
    /** every snow surface (winter): paper white; lavender wherever it looks down */
    snow: paint({ color: C.paper, brush: 0.35, steps: 4, extend: lift }),
    /** snow carried as vertex paint (ridges with lavender bellies) */
    snowPaint: paint({ color: '#ffffff', vertexColors: true, brush: 0.35, steps: 4, extend: lift }),
    /** ice: the shelf's strata, icicles, pans, frost (vertex paint carries frost, bubbled white and clear dark ice) */
    ice: paint({ color: '#ffffff', vertexColors: true, brush: 0.4 }),
    frost: paint({ color: C.frost, brush: 0.3 }),
    /** trunks, boughs, twigs: vertex paint carries limewash, bark plum and ink (shared: the water shows it at dusk) */
    wood: paint({ color: '#ffffff', vertexColors: true, brush: 0.8, extend: wet }),
    /** the same paint for THIN wood (the avenue's trees seen as a frieze, far rows, whips): the painter's filter leaves it as drawn, or it is wiped to a grey haze */
    woodFine: paint({ color: '#ffffff', vertexColors: true, brush: 0.6, crisp: true, extend: wet }),
    /** twigs and sprays: ink lines (crisp: thinner than the painter's brush) */
    ink: paint({ color: C.inkPaint, brush: 0.4, crisp: true }),
    bark: paint({ color: C.bark, brush: 0.8 }),
    /** posts, stalks, wire: thin dark things on the white (crisp) */
    line: paint({ color: C.barkPaint, brush: 0.4, crisp: true }),
    birch: paint({ color: '#ffffff', vertexColors: true, brush: 0.6 }),
    timber: paint({ color: '#ffffff', vertexColors: true, brush: 0.9 }),
    basalt: paint({ color: '#ffffff', vertexColors: true, brush: 0.7, flat: true }),
    earth: paint({ color: C.earth, brush: 0.7 }),
    apple: paint({ color: '#8A2126', brush: 0.4, shade: 0.8 }),      // (chip 6 is #A8242A as SEEN: the snow light lifts paint by about a third)
    wash: paint({ color: C.wash, brush: 0.3, shade: 0.5 }),
    /** memory: blossom masses, vertex-painted in shared.blossom's tones (pink above, lilac shade below); they give their own light */
    blossom: paint({ color: '#ffffff', vertexColors: true, brush: 0.9, steps: 2, shade: 0, extend: holdsPuff, own: true }),
  };

  return { seen, inWater, mat, paint, memory, lift, snowTile: uSnow.tSnowTile, snowTileLook: uSnow.uSnowTile, holds, holdsPuff, wet, dusk, blossom, blossomGlow: uBlossom, blossomMemory: uMemory, blossomSnowBlind: uSnowBlind, blossomDusk: uBlossomDusk, blossomDeep: uBlossomDeep, blossomLamp: uBlossomLamp, blossomHome: uBlossomHome, blossomReach: uBlossomReach, tint };
}
