// The answering sea: the cast, group "Weather" (stage 3; docs/build/sea/3-cast-weather.md). The vast things. Most of
// them stand in the set already (the swell is the water's; the rain round the eye, its rings' crowns, the far curtains
// and the wall of the front are air.js; the front's line, L and the cloud ceiling are set.js; the lens, the vane and
// the shutter are the lighthouse's own parts, turned by heroes.js). This module adds what was missing, gives the
// lighthouse's parts weight and a wind to answer, and gives staging the controls:
//
//   cat's-paws    six patches of the wind's touch running over the far sea to the left at 8 m/s once the weather has
//                 turned (s 144), drawn on the water in the sheet's own far marks (level dashes that come and go; new
//                 light under the gust, ember and violet where it has passed); they die when the wind drops
//   the beams     two spokes of lit rain from the lens through its two bullseyes, turning with it once in 28 s: every
//                 pixel of a beam is the falling rain in it. Pale and cold. What stands in the light cuts it direction by
//                 direction (the cliff, the Prow, the gate's crest, the far pipes); toward tall rock it thins away, and
//                 the eye's own ray is stopped by the rock it really meets (the depth of the engine's scene picture)
//   first drops   three single drops near the boat before the front: a streak, a strike the sea answers, a ring, a crown
//   the planks    rain striking the rider's own boat: a tick of thrown water on thwart, gunwale, boards and oars
//   the parts     the shutter comes against its stay and knocks; the vane hunts, backs with the wind and comes round
//                 with the front; the lens's filling can be taken over (its turn stays heroes.js's)
//
// Everything this module gives staging is under shared.cast.weather: see the end of build(). It plays no sound: every
// sound has an event (weather.on('drop' | 'tick' | 'knock' | 'lens', fn)). It places no cue: what must happen at a
// place follows the weather's own state (the turn at s 144, the show clock shared.sea.T, the rain shared.sea.rain),
// and every part can be taken out of its own rule by its control and given back with auto().
//
// Numbers: WX, below (plan.js is being edited by the set's people: this group keeps its numbers here).
// Switches for looking: &wx=paws,beams,drops,planks,parts builds some of its parts only; &wxpaws=1 holds the
// cat's-paws at that level wherever the boat is and &wxshow=1 paints where each lies; &wxbeams=1 lets the beams out
// whatever the show clock says (&wxbeamdbg=1 paints what they read of the scene's depth, &wxnodepth=1 draws them without
// it); &wxdrops=2 lets the three first drops fall that many seconds after the picture begins;
// &wxplanks=30 strikes the planks that many times a second; &wxvane=40 backs the vane; &wxfull=1 moves the parts at
// their full swing under &calm=1 (a camera that does not heave); &wxdebug=1 logs one line of what it found
// (WX_PROBE, not an error); &wxtune=paws.band:0.2,beams.glow:0.3 tries other numbers of WX without editing this file.
import * as THREE from 'three';
import { SEA_CORE } from './light.js';
import { WATER_GLSL, WATER_SURFACE_GLSL, waterUniforms } from '../../engine/water-final.js';
import { FOG_PARS } from '../../engine/kit.js';
import { makeGuard } from '../../engine/life/fronts.js';
import { smooth, lerp, clamp01 } from './plan.js';

const WX = {
  // the weather's turn (the page's moment 8): the distance along at which the wind gets up, the seconds it takes, and
  // how far back the boat must go for it to lie down again. The wind's strength 0..1 as the page's sound has it:
  // at rest, once it has turned, in the breath of stillness (the show's first two seconds), and with the front
  turn: { s: 144, seconds: 6, back: 8, wind: [0.28, 0.55, 0.3, 0.6] },
  paws: {
    count: 6, speed: 8,                    // patches alive at once; metres a second, down the wind
    // metres to the left of the route at which a patch's leading edge is born, and at which it has died (the page: 80 to 250 m. From an eye 1.1 m
    // up a patch 40 m deep is four pixels deep at 100 m: all six lay in the same few rows under the horizon and added up to one ruled line of light.
    // They run on in to the float line, where one is a patch: two dozen pixels deep, a third of the view wide, its fingers beginning to show)
    from: 250, to: 30,
    // metres along the route (of the straight line through s 150) between which they start; they end 59 m further up it. Wide apart (from the boat each must stand clear
    // of the next), and in two stretches: those that die on the line of the buoy and the floats, abeam and astern of a boat at the weather's turn, and those that die on
    // the open water ahead and to the left, short of the far pipes. None ends on the wreck's reef (its frames stand against fire only when the front comes)
    lanes: [[118, 204], [252, 334]],
    along: [30, 48], across: [30, 52],     // a patch's size down the wind and across it (the page: 30 to 60 m across)
    rise: 0.36, fall: 0.935,               // the shares of its run over which it gathers, and from which it dies (in its last 14 m, from 44 m off the route: a gust dies quickly)
    air: 0.55,                             // how much of the air's dimming they take (sparkle is points of light: it carries through a murk that swallows a tone)
    grid: 4,                               // metres to a cell of the sheet they are drawn on (it rides the swell)
    reach: [52, 348, -300, -28],           // that sheet, in the straight frame at s 150: metres along from .. to, metres to the right from .. to
    // SPARKLE, not a stroke: how bright a dash (the sheet's own far dashes stand at 1.35: the wind's touch is slighter than a hull's); how many of the dashes under a gust are
    // alight (many), and the most that ever are (cap: with nearly all of them alight a patch was a line of neon); how much quicker than the sheet's they come and go; the
    // share of them white-hot under the gust itself
    bright: 1.0, many: 1.15, cap: 0.6, quick: 1.7, hot: 0.14,
    crest: 0.75,                           // how much the wind keeps to the backs of the swell (a gust touches the crests; the troughs lie in their lee): a patch is drawn in the sea's own forms, row behind row
    tail: 20,                              // metres behind a gust over which the light it left dies (two and a half seconds)
    band: 0.1, body: 0.22,                  // far off, what is too fine to draw: a breath of the stroke a patch's marks add up to, and the old light under it
    fine: 1.0,                             // and the two finer layers of dashes that give a far patch its depth
    gain: 1.0,
  },
  beams: {
    length: 220, half: 3.5, skirt: 8.5,    // metres; degrees off its axis at which a beam is half as bright (the page's half-angle); degrees at which nothing is left of it
    start: 2.3,                            // metres from the lens's centre at which it begins (outside the lantern's glass)
    // the lens's filling above which it lets its light out (heroes.js: its lowest prisms hold a glimmer of 0.16 from t 16, and it fills from t 30 to 36: the beams
    // follow the lens's own filling); the show clock's seconds for the same, used only if the lens has no filling to read; the least seconds any change of level takes
    glimmer: 0.16, appear: [30, 36], ease: 2,
    // seconds the lens's store lags L; how the store shows; what is left of a beam where the rain has all but stopped. (The page makes a beam L times the rain,
    // and with its own numbers that is a fiftieth at the cleft's mouth, where its ninth postcard has "the beams thinning": as found, at 0.5 and 0.5, no beam could
    // be told there in a whole turn of the lens, sea_wx_q24.png. They thin to about half, and are thin by having few streaks in them: sea_wx_q26.png)
    lag: 6, gamma: 0.35, dry: 0.75,
    // pale and COLD; the page's 0.25 (a large area: far under 1). Light is added to what is behind it, and behind a beam is a violet cloud: the sea's own
    // aqua (#9CE8E2) came out sage green on it, and from under the tower a green band across a violet sky is an aurora (sea_wx_q06.png). A paler, bluer
    // tint, between the page's core and its slate, comes out as paler rain (sea_wx_q07.png)
    // (0.2, was the page's 0.25, and far less of it mist: see `mist`. And bluer again than #A4D8F0: seen from under the lantern, along its length against the
    // dark of the cloud's hollow, the shaft still read grey-green beside the violet ring, sea_wx_s30_f01.png; in #9EC6F6 it is pale and cold there, sea_wx_s31.png,
    // and in the key view, sea_wx_s32_crop.png)
    color: '#9EC6F6', glow: 0.2,
    fade: 45,                              // metres from the lens at which a beam seen from the side is half as bright as beside it
    // of a beam's light: the share of the mist the rain raises, and how strongly the streaks in it are drawn. A beam is the RAIN in it. As found (mist 0.3,
    // streaks 1.9 of 1.3 m) a beam lying across the cliff in the key view was a bar of pale paint with a grain in it, 1.7 to 2 stops over the rock behind it and
    // brighter than the lit sea's own mean, where the key painting has "slightly paler rain" and the page wants ours fainter than the painting's
    // (sea_wx_s02_f01.png). With the strokes twice as long (a far streak must be a stroke, not a speck: the earlier look at 0.24 found "a sprinkle of specks with
    // no shaft to carry them") and a little further apart, the strokes carry the shaft themselves and the mist can be a breath: sea_wx_s16b_crop.png (the key
    // view), sea_wx_s17_f00.png (under the tower), sea_wx_s18_f01.png (from 30 m)
    // `drizzle`: how many times that share of mist where the rain has all but stopped. Easing rain is finer rain: fewer strokes and more haze. With the mist
    // thinning as the strokes do, the beams from the cleft's mouth were two dozen strokes hanging in the sky with nothing to say where they came from (sea_wx_s20.png)
    mist: 0.14, streaks: 2.4, drizzle: 2.4,
    cap: 2.0, capMist: 1.1,                // the most lit air a ray may add up (beside the lantern, where the beam is narrow and dense: at 2.5 its first metres were a smooth bar, a lamp switched on); and the most of it that is mist (looked along from under the lantern the shaft was a smooth pale wedge with its rain only at its edges)
    hatch: { across: 0.6, down: 3.2, len: 2.6 },      // the rain in a beam: metres from one streak to the next beside it and below it, and a streak's length (as found 0.45 and 1.3)
    // What stands in the light. The cone is cut DIRECTION BY DIRECTION from the lens (so many directions across it), and where the light meets rock taller than itself
    // it THINS AWAY toward it: over `thin[0]` of its run there, never under thin[1] nor over thin[2] metres, ending `into` metres past the plan's outline (which is a ruled
    // line at the waterline; the eye's own ray is stopped by the rock it really meets: the depth of the engine's picture of the scene). As found a beam was cut whole
    // where its AXIS met the plan's outline: lit rain lights no rock, so a beam that reached the cliff behind the tower was a paddle of pale paint with a blunt bright
    // end standing in the dark (sea_wx_s02_crop.png, sea_wx_s14_f02.png), and as the axis crossed the Prow's corner 220 m of beam became 60 m between two frames.
    // `tail`: the share of its length from which a free beam thins away
    bins: 24, thin: [0.45, 7, 28], into: 3, tail: 0.68,
  },
  drops: {
    at: [[4.6, 16], [3.5, -26], [5.8, 4]],            // the three first drops: metres from the boat's middle, degrees to the left of where the rider is looking
    gaps: [1.5, 2.4],                                 // seconds from the first to the second and to the third (never a beat)
    fall: 0.42, streak: 0.55,                         // seconds it falls; its streak's length (m)
    // the falling drop itself: the page's slate and how bright (a lone drop in the dark is all but unseen: one pale stroke against the cloud is a falling star, which this sky
    // may never have); metres over the water between which it comes out of the dark
    color: '#2A3552', dim: 1.5, low: [0.5, 1.9],
    ring: { life: 1.5, r0: 0.05, r1: 0.5, bold: 1.5 },      // the sea's answer: a ring half a metre across that lasts a second and a half (the page)
    crown: { tall: 0.1, life: 0.32, core: 1.2, aqua: 1.5 },      // and its crown: a tick of thrown water a hand tall (on a dark sea the air's own crown, 0.16 m of white-hot core, bloomed into a white flower)
    spark: 1.6,                                       // the spark where it landed, in the ring's own shader
    ripple: [0.35, 0.3], dab: [0.45, 0.5],            // the water's own ring (strength, radius); the light left in its trace (radius in m, strength: 0.6 is new light)
    then: [0.9, 2.3, 3.1],                            // seconds after the third at which the first drops strike the planks
  },
  planks: {
    spots: 260,                                       // places on the boat where a drop may strike
    // a tick of thrown water: metres tall; seconds it and the wet it leaves are seen; the share of that for which the tick itself stands (a fifth of a second); how
    // much of the wet mark is drawn. (With every mark gone in half a second the planks under full rain held two or three at a time and looked dry beside a sea
    // that keeps each drop's ring a second and a half: a strike now leaves a wet fleck that the sea's light lies on for two or three seconds)
    // (As found the ticks were 3 to 7 cm of dim slate: under the full rain the sea round the hull stood thick with rings and crowns and the boat between
    // them looked roofed over, two specks to be found in it: sea_wx_q12_f03.png. A tick is now 5 to 12 cm, stands a third of a second, and under the lit
    // sea it takes the sea's light as any thrown water would: still short of the sea's own crowns, which are the sea answering)
    size: [0.05, 0.12], life: [1.8, 3.0], up: 0.13, wet: 0.3,      // (the wet a strike leaves is a glint, not a mark: at 0.65 and over, pale lenses lay on the boards like sequins: sea_wx_q13_f03.png)
    sparse: 0.7, full: 30,                            // drops a second on the boat before the rain, and under it at its heaviest (the page's 9 on every square metre a second, on 3.4 square metres of boat)
    every: 0.25,                                      // seconds between two 'tick' events at least (the page: at most four a second)
    // rainwater on wood does not glow: slate; how bright; how much of the bow lantern it takes; and what the lit sea round the boat lends it (so much more of its slate, so much of the sea's aqua)
    color: '#59627E', gain: 0.6, lantern: 0.5, sea: 1.5, seaAqua: 0.5,
  },
  parts: {
    wallward: 1,                                      // which way the shutter's own turn takes it toward the wall (the model's hinge: +1 or -1)
    soft: 0.25,                                       // the share of the shutter's swings too soft to reach its stay (no knock)
    back: 40,                                         // degrees the vane backs when the weather turns (the page)
    swing: [1.9, 0.38],                               // the vane as a weighted thing: how quick it comes round (radians a second) and how soon it settles (it swings past once)
    calm: 0.6,                                        // with reduced motion: what is left of the shutter's swing and of the vane's hunting
    told: 0.2,                                        // the lens's filling at which its filling is told (the 'lens' event: the page's breath at t 30)
  },
};

const params = new URLSearchParams(typeof location !== 'undefined' ? location.search : '');
{ // &wxtune=paws.band:0.2,beams.glow:0.3,paws.lanes.0:180 tries other numbers of WX without editing this file (colours as %23rrggbb)
  for (const pair of (params.get('wxtune') || '').split(',')) {
    const [key, raw] = pair.split(':'), parts = (key || '').split('.');
    if (raw === undefined || !parts[0]) continue;
    let o = WX; while (parts.length > 1 && o) o = o[parts.shift()];
    if (o && parts[0] in o) o[parts[0]] = raw !== '' && !Number.isNaN(+raw) ? +raw : raw; else console.error(`cast_weather: &wxtune has no number '${key}'`);
  }
}
const want = (() => { const v = (params.get('wx') || '').split(',').map((s) => s.trim()).filter(Boolean); return (name) => !v.length || v.includes(name); })();
const num = (key) => (params.has(key) && params.get(key) !== '' && !Number.isNaN(+params.get(key)) ? +params.get(key) : null);
const hash1 = (a, b = 0) => { const s = Math.sin(a * 127.1 + b * 311.7 + 17.3) * 43758.5453; return s - Math.floor(s); };

// Marks of paint, as the sheet reads them (light.js, SEA_INK and seaGlints: copied, because that file does not export
// them; if the sheet's far marks change there, change these). seaGlints: light on water too far off to tell marks
// apart, as level dashes that come and go, laid out by the direction they are seen in.
const WX_INK = /* glsl */`
  vec3 wxMark(sampler2D t, vec2 uv) { vec4 m = texture2D(t, uv); float c = max(m.g, 0.004); return vec3(m.g, m.r / c, m.b / c); }
  vec3 wxAged(float a) { return seaAge(a, uSeaCore, uSeaAqua, uSeaEmber, uSeaDying); }
  vec3 wxInk(vec3 m, float cut, float a) { float mg = m.y - cut; return wxAged(a * (0.1 + 0.9 * smoothstep(0.02, 0.38, mg))) * (m.x * smoothstep(0.0, 0.14, mg)); }
  vec2 wxGlints(vec2 ang, vec2 cell, float dens, float seed, float time, float pix) {
    vec2 g = ang / cell, id = floor(g), f = g - id;
    vec3 h = seaHash3(id + seed);
    float cyc = time * (0.45 + 0.8 * h.z) + h.x * 9.0, n = floor(cyc), ph = cyc - n;
    vec3 k = seaHash3(id + seed + n * 7.13 + 3.0);
    if (k.z > dens) return vec2(0.0);
    vec2 dq = (f - vec2(0.22 + 0.56 * k.x, 0.28 + 0.44 * k.y)) * cell;
    float halfLen = cell.x * (0.12 + 0.28 * h.y), th = cell.y * (0.18 + 0.16 * k.x), thPx = max(th, 0.55 * pix);
    float r = length(vec2(dq.x / halfLen, dq.y / thPx));
    float life = sin(3.14159 * ph);
    return vec2((1.0 - smoothstep(0.55, 1.0, r)) * life * life * min(1.0, th / thPx), fract(k.z * 53.7 + h.y));
  }
`;

export async function build(ctx, plan, shared) {
  const { kit } = ctx, engine = ctx.engine, sh = engine.shared, sea = shared.sea, P = plan;
  const cast = shared.cast = shared.cast || {};
  const listeners = {};
  const fire = (name, ...args) => { const l = listeners[name]; if (l) for (const fn of l) { try { fn(...args); } catch (err) { console.error(`cast_weather: a listener of '${name}' threw: ${(err && err.message) || err}`); } } };
  const weather = cast.weather = {
    /** weather.on('drop' | 'tick' | 'knock' | 'lens', fn): the sounds' hooks (this module plays none itself). Every listener is called fn(x, y, z, o): the place of the thing
     *  that made the sound, in the realm's own space, and what the page gives the sound (o.pitch, o.gain; a drop also has o.index 0..2). Returns a function that takes the listener off again. */
    on(name, fn) { (listeners[name] || (listeners[name] = [])).push(fn); return () => { const l = listeners[name], i = l.indexOf(fn); if (i >= 0) l.splice(i, 1); }; },
    numbers: WX,
  };
  if (!sea || !sea.front) return {};                       // (the light did not build: there is no sea to write on)
  const U = sea.uniforms, restOnly = params.has('rest'), debug = params.has('wxdebug');
  const fogU = { uFogColor: sh.uFogColor, uFogDensity: sh.uFogDensity, uVeil: sh.uVeil, uVeilColor: sh.uVeilColor };
  const size2 = new THREE.Vector2();
  const pixelOf = (renderer, camera) => { const rt = renderer.getRenderTarget(), h = rt ? rt.height : renderer.getDrawingBufferSize(size2).y; return 2 / (camera.projectionMatrix.elements[5] * Math.max(1, h)); };      // radians to a pixel

  // ---- the straight frame at the trigger point (s 150): metres along the route and metres to its right, for things
  // that lie too far out for the path's own curve to mean anything (kit.at bends with the path and stops at its end)
  const a0 = ctx.path.at(P.front.trigger[0]), fr = { x: a0.x, z: a0.z, tx: a0.tx, tz: a0.tz, rx: a0.rx, rz: a0.rz, s: P.front.trigger[0] };
  const flat = (s, d) => ({ x: fr.x + fr.tx * (s - fr.s) + fr.rx * d, z: fr.z + fr.tz * (s - fr.s) + fr.rz * d });
  const wind = { x: sea.front.nx, z: sea.front.nz };                                 // the way the weather travels: to the right and 15 degrees up the route

  // ============================================================================================== the weather's state
  // One wind for this group (the cat's-paws, the vane, the shutter) and for whoever asks (weather.wind): it gets up
  // when the weather turns, drops in the breath of stillness, and comes back with the front.
  const state = { turn: 0, wind: WX.turn.wind[0], gust: 0, first: true };
  const turnGuard = makeGuard(WX.turn.seconds, 0);
  const windNow = (s, T, dt) => {
    const Tn = WX.turn, target = restOnly ? 0 : s >= Tn.s ? 1 : s < Tn.s - Tn.back ? 0 : state.turn > 0.5 ? 1 : 0;
    if (state.first) turnGuard.set(target && (T > 0 || s > Tn.s + 3) ? 1 : 0);      // (a realm entered beyond the turn: the weather has turned already)
    state.turn = turnGuard(target, dt);
    const k = state.turn * state.turn * (3 - 2 * state.turn), w = Tn.wind;
    let v = lerp(w[0], w[1], k);
    if (T >= 0) v = T < 2 ? lerp(v, w[2], smooth(0, 2, T)) : lerp(w[2], w[3], smooth(2, 7, T));
    state.wind = v * lerp(1, 0.17, smooth(232, 240, s));                             // (inside the cleft the wind is left outside)
    return state.wind;
  };

  // ============================================================================================== cat's-paws
  // Where a gust comes down on the sea it touches it, and this sea answers touch: a patch of sparkle 30 to 60 m
  // across that runs down the wind at 8 m/s, new light along its leading edge, ember and then violet behind it as
  // the light it left grows old. Six of them, far out to the left (80 to 250 m), each born in the murk, gathering as
  // it comes and dying 80 m off as a gust dies; then another, somewhere else. They lie outside the water's trace, so
  // they are drawn here: on a sheet that rides the swell as the water does, in the SHEET'S OWN far marks (light.js,
  // sheet(), the road seen far off: the same level dashes, the same two layers, cells, seeds, clock and colours by
  // age), broken by the area's own marks (shared.sea.fleck), so that a cat's-paw and a stretch of the boat's own road
  // seen at the same distance are the same paint. Ahead of the rain front only: behind it the sea answers the rain.
  let paws = null;
  if (want('paws')) {
    const W = WX.paws, R = W.reach, nx = Math.round((R[1] - R[0]) / W.grid), nz = Math.round((R[3] - R[2]) / W.grid);
    const pos = new Float32Array((nx + 1) * (nz + 1) * 3), idx = new Uint16Array(nx * nz * 6);
    for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) { const p = flat(R[0] + (R[1] - R[0]) * i / nx, R[2] + (R[3] - R[2]) * j / nz), o = (j * (nx + 1) + i) * 3; pos[o] = p.x; pos[o + 1] = 0; pos[o + 2] = p.z; }
    let k = 0;
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, e = c + 1; idx[k++] = a; idx[k++] = c; idx[k++] = b; idx[k++] = b; idx[k++] = c; idx[k++] = e; }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setIndex(new THREE.BufferAttribute(idx, 1));
    const fleckAt = (P.seaLight && P.seaLight.fleck) || [0.37, 0.16, 0.047, 0.75];
    const uni = {
      ...waterUniforms(engine), ...fogU, uSeaOmega: U.uSeaOmega, uSeaFront: U.uSeaFront, uSeaL: U.uSeaL, uSeaLee: U.uSeaLee,
      tSeaFleck: U.tSeaFleck, tSeaStip: U.tSeaStip, uSeaAqua: U.uSeaAqua, uSeaEmber: U.uSeaEmber, uSeaCore: U.uSeaCore, uSeaDying: U.uSeaDying,
      uTime: sh.uTime, uPix: { value: 0.0012 },
      uPaw: { value: Array.from({ length: W.count }, () => new THREE.Vector4(0, 0, 30, 40)) },      // where its leading edge's middle is (x, z), how deep it is down the wind, how wide across it
      uPawB: { value: Array.from({ length: W.count }, () => new THREE.Vector4(0, 0, 0, 0)) },       // how much of it there is (0..1), its own number, -, -
      uWind: { value: new THREE.Vector4(wind.x, wind.z, W.speed, W.tail) },
      uFleck: { value: new THREE.Vector4(...fleckAt) }, uGlint: { value: new THREE.Vector4(W.bright, W.many, W.gain, W.air) }, uBand: { value: new THREE.Vector3(W.band, W.body, W.fine) },
      uSpark: { value: new THREE.Vector4(W.cap, W.quick, W.hot, W.crest) },
    };
    const mat = new THREE.ShaderMaterial({
      uniforms: uni, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
      defines: { PAWS: W.count },
      vertexShader: /* glsl */`${WATER_GLSL} ${WATER_SURFACE_GLSL} ${FOG_PARS}
        varying vec3 vWorld; varying float vFogDist;
        void main() {
          vec4 world = modelMatrix * vec4(position, 1.0);
          // it lies on the water as the water has it there (the water's own function: the swell, let go of far from the eye, and the well round the hull)
          world.xyz = waterSurface(world.xyz);
          world.y += 0.03;
          vWorld = world.xyz;
          vec4 mv = viewMatrix * world; vFogDist = fogDistance(mv);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */`${WATER_GLSL} ${SEA_CORE} ${FOG_PARS}
        uniform sampler2D tSeaFleck, tSeaStip; uniform vec3 uSeaAqua, uSeaEmber, uSeaCore, uSeaDying;
        uniform vec4 uPaw[PAWS], uPawB[PAWS], uWind, uFleck, uGlint; uniform vec3 uBand; uniform vec4 uSpark; uniform float uTime, uPix;
        varying vec3 vWorld; varying float vFogDist;
        ${WX_INK}
        void main() {
          vec2 p = vWorld.xz, w = uWind.xy, c = vec2(-w.y, w.x);
          float along = dot(p, w), across = dot(p, c);
          // ---- which gust is touching this water or has just left it: how much of its light is here, and how old that light is.
          // A gust is a patch of wind, not an edge: all the water under it is being touched NOW; behind it the light it left dies
          float dens = 0.0, age = 0.0, now = 0.0;
          for (int i = 0; i < PAWS; i++) {
            float amount = uPawB[i].x; if (amount < 0.002) continue;
            float seed = uPawB[i].y, deep = uPaw[i].z, wide = uPaw[i].w;
            vec2 q = p - uPaw[i].xy; float v = dot(q, c);
            // its leading edge is ragged: tongues a few strides long run ahead of it and bays hang back
            float lead = (seaNoise(vec2(across * 0.09, seed * 13.0)) - 0.5) * 0.36 * deep + (seaNoise(vec2(across * 0.31, seed * 29.0 + 4.0)) - 0.5) * 5.0;
            float back = lead - dot(q, w);                                              // metres behind its edge
            float tail = max(back - 0.8 * deep, 0.0);                                    // metres behind the gust itself
            float under = smoothstep(0.0, 1.6, back) * (1.0 - smoothstep(0.8 * deep, deep, back));
            float left = smoothstep(0.7 * deep, deep, back) * (1.0 - smoothstep(0.0, uWind.w, tail));      // what it leaves: gone by uWind.w metres
            // across the wind it thins to nothing in fingers, never along a ruled side
            float sideN = 0.72 + 0.56 * seaNoise(vec2(along * 0.07 + seed * 7.0, across * 0.045));
            float side = 1.0 - smoothstep(0.24 * wide * sideN, 0.5 * wide * sideN, abs(v));
            // and it is torn: the wind touches the water in streaks that lie down the wind, with untouched water between them
            float torn = smoothstep(0.26, 0.6, 0.6 * seaNoise(vec2(across * 0.21 + seed * 3.0, along * 0.035)) + 0.4 * seaNoise(vec2(across * 0.055, along * 0.05 + seed * 11.0)));
            float here = amount * side * (0.22 + 0.78 * torn) * max(under, 0.55 * left);
            if (here > dens) { dens = here; age = tail / uWind.z; now = under; }
          }
          dens *= (1.0 - seaFront(p)) * uSeaL.y;
          // the wind touches the backs of the swell and passes over the troughs
          dens *= mix(1.0, smoothstep(-0.12, 0.5, seaSwellN(p, 0.0)), uSpark.w);
          if (dens < 0.004) discard;
          // ---- as the sheet draws its own light far off (light.js, sheet()): light by its age, on the sheet's own clock. Under the gust it is
          // new (aqua, and a few of its dashes white-hot, as any first touch is); what the gust leaves is ember after two seconds, violet after four
          float E = 1.0 - (age + 2.4) / 27.0, aE = 0.03 + 0.93 * pow(clamp((E - 0.55) / 0.42, 0.0, 1.0), 2.2);
          vec2 fa = dFdx(p), fb = dFdy(p);
          float px = max(length(fa), length(fb)), far = smoothstep(0.05, 0.26, px);
          vec2 qv = p - cameraPosition.xz; float dH = max(length(qv), 0.5);
          vec2 ang = vec2(atan(qv.x, -qv.y), (cameraPosition.y - vWorld.y) / dH);         // the way this place is seen: its bearing, and how far under the horizon
          float softB = texture2D(tSeaFleck, p * uFleck.z + 0.71, 4.0).g + 0.5 * texture2D(tSeaFleck, p.yx * uFleck.y + 0.37, 4.5).g;      // the marks, read small: only their soft sum is left
          // (the three layers of dashes the sheet lays where the sea answers the rain far off: the same cells, seeds and clock, so that when the front
          // crosses this water the dashes a gust had lit are the very ones the rain lights. Here they stand close: a gust's footprint is small, and from
          // a boat it is a few pixels deep: it reads as a patch only if nearly every dash in it is alight; and two finer layers of the same dash
          // give it its depth)
          float dn = clamp(dens * (0.5 + 0.9 * softB) * uGlint.y, 0.0, uSpark.x), hot = uSpark.z * now, tq = uTime * uSpark.y;
          vec2 g1 = wxGlints(ang, vec2(0.030, 0.0062), dn, 41.0, tq, uPix), g2 = wxGlints(ang + vec2(0.37, 0.0021), vec2(0.019, 0.0042), dn, 87.0, tq * 1.13, uPix);
          vec2 g3 = wxGlints(ang + vec2(0.71, 0.0013), vec2(0.011, 0.0027), dn, 131.0, tq * 1.31, uPix);
          vec2 g4 = wxGlints(ang + vec2(0.13, 0.0007), vec2(0.012, 0.0016), dn, 171.0, tq * 1.5, uPix), g5 = wxGlints(ang + vec2(0.57, 0.0004), vec2(0.0075, 0.0012), dn * 0.9, 211.0, tq * 1.7, uPix);
          vec3 col = (wxAged(clamp(aE + 0.2 * (g1.y - 0.5), 0.03, 0.9)) * g1.x + wxAged(clamp(aE + 0.2 * (g2.y - 0.6), 0.03, 0.9)) * g2.x
                    + wxAged(clamp(aE + 0.25 * (g3.y - 0.6) + hot * smoothstep(0.86, 0.97, g3.y), 0.03, 0.99)) * (0.9 * g3.x)) * (1.15 * uGlint.x)
                   + (wxAged(clamp(aE + 0.25 * (g4.y - 0.6) + hot * smoothstep(0.88, 0.97, g4.y), 0.03, 0.99)) * g4.x + wxAged(clamp(aE + 0.25 * (g5.y - 0.6), 0.03, 0.9)) * g5.x) * (uBand.z * uGlint.x);
          // And, as on the sheet, what is too fine to draw: far off every mark of a patch lies in the same few pixels, and their sum is one
          // stroke of its light (the sheet's band under the horizon), broken along its length by the long marks; with the old light
          // under it, a breath of ember, more of it the further off
          vec3 mf = wxMark(tSeaFleck, vec2(across * 0.012, along * 0.045) + 0.83);
          float bandK = 1.0 - smoothstep(0.012, 0.03, ang.y), gather = smoothstep(12.0, 140.0, length(cameraPosition - vWorld));
          col += wxAged(min(aE, 0.72)) * (dens * bandK * uBand.x * (0.12 + 0.88 * mf.x * smoothstep(0.45, 0.59, mf.y))) + wxAged(min(aE, 0.28)) * (dens * gather * uBand.y * (0.4 + softB));
          // near enough to tell marks apart (a rider who has gone out to the edge of the reachable sea): the sheet's glitter of specks
          if (far < 0.999) {
            vec3 st = wxMark(tSeaStip, p * uFleck.w), st2 = wxMark(tSeaStip, p.yx * uFleck.w * 0.37 + 0.5);
            float tw = 0.6 + 0.4 * sin(uTime * (1.3 + 3.2 * st.z) + st.z * 47.0), tw2 = 0.7 + 0.3 * sin(uTime * (0.9 + 2.0 * st2.z) + st2.z * 31.0);
            float dnn = clamp(dens * (0.36 + 1.6 * softB), 0.0, 1.0);
            vec3 near = (wxInk(st, 1.03 - 0.95 * dnn, aE) * tw + 0.8 * wxInk(st2, 1.08 - 0.92 * dnn, aE) * tw2) * (0.75 + 1.4 * dens);
            col = mix(near, col, far);
          }
          col = min(col * (1.06 * uGlint.z), vec3(4.0)) * (pow(1.0 - fogAmount(vFogDist), uGlint.w) * (1.0 - uVeil));
          #ifdef WXSHOW
            col = vec3(0.5, 0.1, 0.1) * dens + vec3(0.0, 0.0, 0.3) * step(0.5, fract(age)) + vec3(0.0, 0.3, 0.0) * now;      // (for looking: where each patch lies, where it is touching now, the age of what it left)
          #endif
          gl_FragColor = vec4(col, 1.0);
        }`,
    });
    if (params.has('wxshow')) mat.defines.WXSHOW = '';
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = "sea-catspaws"; mesh.frustumCulled = false; mesh.renderOrder = 0.5; mesh.visible = false;      // after the sheet (0), before the rain
    mesh.onBeforeRender = (renderer, scene, camera) => { const pix = pixelOf(renderer, camera); if (uni.uPix.value !== pix) { uni.uPix.value = pix; mat.uniformsNeedUpdate = true; } };
    ctx.add(mesh); ctx.only(mesh, 'direct');

    // each patch, by the realm's own clock alone (a picture taken twice is the same picture): its run from `from` to `to`
    // metres off the route, in a lane of its own, begun at its own moment; the next one of that number takes another lane
    const run = (W.from - W.to) / (W.speed * Math.cos(P.front.turn * Math.PI / 180)), sin15 = Math.sin(P.front.turn * Math.PI / 180), cos15 = Math.cos(P.front.turn * Math.PI / 180);
    const guard = makeGuard(2.5, 0);
    const manual = { on: num('wxpaws') !== null, level: num('wxpaws') ?? 0 };
    paws = {
      object: mesh, level: 0, patches: Array.from({ length: W.count }, () => ({ x: 0, z: 0, s: 0, d: 0, amount: 0 })),
      /** The wind gets up: the cat's-paws run (over `seconds`, never under half a second). Staging: moment 8, s 144. */
      start(seconds = 2.5) { manual.on = true; manual.level = 1; manual.seconds = seconds; return paws; },
      /** The wind drops: they die where they are (the show's first two seconds). */
      stop(seconds = 2) { manual.on = true; manual.level = 0; manual.seconds = seconds; return paws; },
      /** Back to their own rule: they run from the weather's turn until the wind drops. */
      auto() { manual.on = false; return paws; },
      update(dt, time, s, T, calm) {
        uni.uSpark.value.y = W.quick * (calm ? 0.6 : 1);                                    // (reduced motion: the sparkle comes and goes at the sheet's own pace)
        const own = restOnly ? 0 : Math.min(1, 4 * state.turn) * (T < 0 ? 1 : 1 - smooth(0, 2, T));      // (they are out in a second and a half: a rider left to the current has five between the turn and the show)
        const lv = paws.level = manual.on ? guardTo(guard, manual.level, dt, manual.seconds || 2.5) : guardTo(guard, own, dt, T < 0 ? 1.5 : 2);
        mesh.visible = lv > 0.002 && U.uSeaL.value.y > 0.01;
        if (!mesh.visible) return;
        for (let i = 0; i < W.count; i++) {
          const ph = time / run + i / W.count + 0.37 * hash1(i, 3), n = Math.floor(ph), u = ph - n, seed = hash1(i, n) * 0.98 + 0.01;
          const lh = hash1(n * 7 + i, 5) * W.lanes.length, band = W.lanes[Math.min(W.lanes.length - 1, Math.floor(lh))], lane = lerp(band[0], band[1], lh - Math.floor(lh)), deep = lerp(W.along[0], W.along[1], hash1(i, n + 11)), wide = lerp(W.across[0], W.across[1], hash1(i, n + 23));
          const d = -lerp(W.from, W.to, u), sAt = lane - (W.from + d) * sin15 / cos15;      // it travels to the right and 15 degrees up the route
          const at = flat(sAt, d), amount = lv * smooth(0, W.rise, u) * (1 - smooth(W.fall, 1, u));
          uni.uPaw.value[i].set(at.x, at.z, deep, wide); uni.uPawB.value[i].set(amount, seed, 0, 0);
          const pt = paws.patches[i]; pt.x = at.x; pt.z = at.z; pt.s = sAt; pt.d = d; pt.amount = amount;
        }
      },
    };
  }
  function guardTo(g, target, dt, seconds) { const v = g.get(), m = Math.max(0, dt) / Math.max(0.5, seconds); g.set(v + Math.max(-m, Math.min(m, target - v))); return g.get(); }

  // ============================================================================================== the beams
  // The great lamp is dead and stays dead. But when the lens has filled with the sea's light it throws that light out
  // through its two bullseyes, and where it passes through rain the rain is lit: two pale spokes that turn with the
  // lens once in 28 s, each made of nothing but falling rain. So they are drawn as rain: every pixel of a beam is the
  // light of the streaks in it (they fall in the world, slanted as the air's rain is, and the turning beam finds new
  // ones), over a breath of the mist the rain raises; never a smooth cone, never an outline. Their brightness is the
  // lens's store of the sea's light (L, lagged 6 s) times how much rain there is to light. What stands in the light
  // cuts it, direction by direction from the lens (the plan's outlines: the cliff, the Prow and the coast end it; the
  // gate's crest and the far pipes throw their shadows into it), and what stands in the eye's way stops the eye (the
  // depth of the engine's picture of the scene). One draw call for both; not in the mirror (the kept lamp's stroke
  // is the only reflection of a light in this sea).
  let beams = null;
  const tower = shared.tower;
  if (want('beams') && tower && tower.lens && tower.beam && tower.parts && tower.parts.lens) {
    const Bm = WX.beams, lens = tower.parts.lens, apex = tower.lens.clone(), rad = Math.PI / 180;
    // where each bullseye looks, for the lens as it stands now; from then on its own turn says where (no matrix is read: nothing is a frame late)
    lens.updateWorldMatrix(true, false);
    const at0 = lens.rotation.y, look0 = [0, 1].map((i) => { const p = tower.beam(i, new THREE.Vector3()); return Math.atan2(p.x - apex.x, p.z - apex.z); });
    const sides = 20, vp = [], vb = [], vi = [];
    for (let b = 0; b < 2; b++) {
      const o = vp.length / 3;
      for (let k = 0; k < 2; k++) for (let i = 0; i < sides; i++) { const a = i / sides * Math.PI * 2; vp.push(Math.cos(a), Math.sin(a), k); vb.push(b); }
      vp.push(0, 0, 0, 0, 0, 1); vb.push(b, b);
      for (let i = 0; i < sides; i++) { const j = (i + 1) % sides; vi.push(o + i, o + sides + i, o + j, o + j, o + sides + i, o + sides + j, o + 2 * sides, o + i, o + j, o + 2 * sides + 1, o + sides + j, o + sides + i); }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(vp, 3)); geo.setAttribute('aBeam', new THREE.Float32BufferAttribute(vb, 1)); geo.setIndex(vi);
    const RA = P.rainAir || { speed: 9, slant: 12 }, sl = RA.slant * rad;
    const fall = new THREE.Vector3(wind.x * Math.sin(sl), -Math.cos(sl), wind.z * Math.sin(sl)).normalize();      // the way the rain falls (air.js: slanted down the wind)
    const e1 = new THREE.Vector3(wind.x, 0, wind.z).addScaledVector(fall, -(wind.x * fall.x + wind.z * fall.z)).normalize(), e2 = new THREE.Vector3().crossVectors(fall, e1).normalize();
    const NB = Math.max(4, Math.round(Bm.bins)), span = Bm.skirt * 1.1 * rad, occ = new Float32Array(2 * NB * 3);      // for each beam, direction by direction across it: metres the light runs free; metres to a lower thing in its way and the slope over which the light clears it
    for (let i = 0; i < 2 * NB; i++) { occ[i * 3] = Bm.length; occ[i * 3 + 1] = 1e5; occ[i * 3 + 2] = -1e3; }
    const uni = {
      ...fogU, uTime: sh.uTime, uApex: { value: apex },
      uAxis: { value: [new THREE.Vector3(1, 0, 0), new THREE.Vector3(-1, 0, 0)] },
      uBeam: { value: [new THREE.Vector4(Bm.length, 0, Bm.tail * Bm.length, Bm.length), new THREE.Vector4(Bm.length, 0, Bm.tail * Bm.length, Bm.length)] },      // the length drawn (m), how bright, metres from which and at which a free beam has thinned away
      uOcc: { value: occ }, uSpan: { value: span }, uThin: { value: new THREE.Vector4(Bm.thin[0], Bm.thin[1], Bm.thin[2], Bm.length - 1) },
      // the engine's picture of the scene without the water, with its depth (engine.js: the pre-pass): where the eye's ray is stopped. 1 / the size of what is being drawn, the camera's near and far
      tDepth: { value: (engine.pre && engine.pre.depthTexture) || null }, uScreen: { value: new THREE.Vector4(1 / 1600, 1 / 900, 0.08, 1800) }, uSeen: { value: 0 },
      uCone: { value: new THREE.Vector4(Math.tan(Bm.half * rad), Math.cos(Bm.skirt * rad) ** 2, Bm.start, Math.tan(Bm.skirt * rad)) },
      uShape: { value: new THREE.Vector4(Bm.fade, Bm.mist, Bm.streaks, 1) },                                     // metres at which a beam seen from the side is half as bright; the mist's share; the streaks'; how much rain (0..1)
      uRain: { value: new THREE.Vector4(fall.x, fall.y, fall.z, RA.speed) }, uRainE1: { value: e1 }, uRainE2: { value: e2 },
      uHatch: { value: new THREE.Vector4(Bm.hatch.across, Bm.hatch.down, Bm.hatch.len, 0.0012) },               // metres between streaks, metres from one to the next below it, a streak's length; radians to a pixel
      uColor: { value: new THREE.Color(Bm.color).multiplyScalar(Bm.glow) }, uCap: { value: Bm.cap }, uCapMist: { value: Bm.capMist },
    };
    const mat = new THREE.ShaderMaterial({
      uniforms: uni, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, side: THREE.DoubleSide,
      defines: { NB },
      vertexShader: /* glsl */`
        attribute float aBeam; uniform vec3 uApex, uAxis[2]; uniform vec4 uBeam[2], uCone;
        varying vec3 vWorld; varying float vB;
        void main() {
          int b = int(aBeam + 0.5);
          vec3 ax = uAxis[b], side = normalize(cross(ax, vec3(0.0, 1.0, 0.0))), up = cross(side, ax);
          float z = mix(uCone.z, uBeam[b].x, position.z), r = z * uCone.w * 1.04;      // (a little wider than the light: the hull is twenty-sided)
          vWorld = uApex + ax * z + (side * position.x + up * position.y) * r; vB = aBeam;
          gl_Position = projectionMatrix * viewMatrix * vec4(vWorld, 1.0);
        }`,
      fragmentShader: /* glsl */`${FOG_PARS}
        uniform vec3 uApex, uAxis[2], uRainE1, uRainE2, uColor; uniform vec4 uBeam[2], uCone, uShape, uRain, uHatch; uniform float uTime, uCap, uCapMist;
        uniform sampler2D tDepth; uniform vec4 uScreen, uThin; uniform float uSeen, uSpan; uniform vec3 uOcc[2 * NB];
        varying vec3 vWorld; varying float vB;
        float wxH(float n) { return fract(sin(n * 127.1 + 3.7) * 43758.5453); }
        float wxH2(vec2 p) { p = fract(p * vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.y); }
        // Rain at D metres from the eye, as the eye has it: streaks that all point at one place in the sky (the way the rain
        // comes from) and fall away from it. psi: the bearing round that place; lam: the log of the tangent of half the angle
        // from it, in which a falling drop moves at an even pace and keeps its length. sinX: the sine of that angle.
        float wxStreaks(float psi, float lam, float sinX, float D, float seed, float many) {
          float cw = uHatch.x / D, ch = uHatch.y / D;
          float gx = psi / cw, col = floor(gx), fx = gx - col, h = wxH(col + seed);
          float gy = lam / ch - uTime * uRain.w / uHatch.y * (0.85 + 0.3 * h) + h * 17.0, row = floor(gy), fy = gy - row;
          float k = wxH2(vec2(col + seed, row));
          float len = uHatch.z / uHatch.y * (0.7 + 0.6 * fract(k * 53.0));
          float along = smoothstep(0.0, 0.06, fy) * (1.0 - smoothstep(len - 0.08, len, fy)) * (0.4 + 0.6 * fy / len);      // brightest at its foot
          float w = max(0.012 / D, 0.9 * uHatch.w) / max(sinX, 0.08);                  // never thinner than the screen can draw
          float x = (fx - 0.2 - 0.6 * fract(k * 37.0)) * cw / w;
          return step(k, many * min(1.0, 1.25 * sinX * sinX)) * along * exp(-3.0 * x * x);
        }
        void main() {
          int b = int(vB + 0.5);
          vec3 ax = uAxis[b], ro = cameraPosition, rd = normalize(vWorld - ro), co = ro - uApex;
          float len = uBeam[b].x, level = uBeam[b].y;
          if (level < 0.0005) discard;
          // ---- where this ray is inside the light: a cone about the beam's axis, between the lantern's glass and the beam's end
          float rdd = dot(rd, ax), cod = dot(co, ax), c2 = uCone.y;
          float A = rdd * rdd - c2, B = 2.0 * (rdd * cod - dot(rd, co) * c2), C = cod * cod - dot(co, co) * c2;
          A = abs(A) < 1e-6 ? (A < 0.0 ? -1e-6 : 1e-6) : A;
          float disc = B * B - 4.0 * A * C;
          if (disc < 0.0) discard;
          float sq = sqrt(disc), t1 = (-B - sq) / (2.0 * A), t2 = (-B + sq) / (2.0 * A), tIn, tOut;
          if (t1 > t2) { float tt = t1; t1 = t2; t2 = tt; }
          if (A < 0.0) { tIn = t1; tOut = t2; if (cod + rdd * 0.5 * (t1 + t2) < 0.0) discard; }
          else { if (rdd <= 0.0) discard; tIn = t2; tOut = 1e5; }
          if (abs(rdd) > 1e-5) { float ta = (uCone.z - cod) / rdd, tb = (len - cod) / rdd; tIn = max(tIn, min(ta, tb)); tOut = min(tOut, max(ta, tb)); }
          else if (cod < uCone.z || cod > len) discard;
          // one fragment to a pixel: the nearer wall of the hull (an eye that is itself in the light has only the farther one)
          bool within = cod > uCone.z && cod < len && length(co - ax * cod) < cod * uCone.w * 1.027;
          tIn = max(tIn, 0.0);
          if (tOut <= tIn) discard;
          if (!within && length(vWorld - ro) > 0.5 * (tIn + tOut)) discard;
          // ---- what stands in the EYE'S way: the rock this ray really meets (the engine's picture of the scene without the water, with its depth: the nearest of four
          // readings, so that no light is laid over a rock's edge), and the sea. A beam that reaches the cliff ends ON its columns
          if (uSeen > 0.5) {
            vec2 uv = gl_FragCoord.xy * uScreen.xy, e = 0.667 * uScreen.xy;
            float dp = min(min(texture2D(tDepth, uv + e).r, texture2D(tDepth, uv - e).r), min(texture2D(tDepth, uv + vec2(e.x, -e.y)).r, texture2D(tDepth, uv + vec2(-e.x, e.y)).r));
            float vz = uScreen.z * uScreen.w / (uScreen.w - dp * (uScreen.w - uScreen.z));
            tOut = min(tOut, vz / max(dot(rd, -vec3(viewMatrix[0].z, viewMatrix[1].z, viewMatrix[2].z)), 0.05));
            #ifdef WXDBG
              gl_FragColor = vec4(fract(vz / 20.0), dp > 0.99999 ? 1.0 : 0.0, tOut <= tIn ? 1.0 : 0.0, 1.0) * 0.5; return;
            #endif
          }
          if (rd.y < -1e-4) tOut = min(tOut, -ro.y / rd.y);
          if (tOut <= tIn) discard;
          // ---- how much lit rain the ray passes through. Seen from the side a beam is brightest by the lantern and thins as
          // it widens (what it lights is spread over more air), half as bright at uShape.x metres
          float jit = wxH2(gl_FragCoord.xy), dt = (tOut - tIn) / 8.0, sum = 0.0, tc = 0.0;
          vec3 sd = vec3(ax.z, 0.0, -ax.x); int o = b * NB;
          for (int i = 0; i < 8; i++) {
            float t = tIn + (float(i) + jit) * dt;
            vec3 q = co + rd * t; float z = dot(q, ax), r = length(q - ax * z), x = r / max(z * uCone.x, 1e-3);
            float d = exp(-0.69 * x * x) * smoothstep(uCone.z, uCone.z + 2.5, z) * (1.0 - smoothstep(uBeam[b].z, uBeam[b].w, z)) / (z * 0.13 * (1.0 + z / uShape.x));
            // what stands in the LIGHT'S way, in this place's own direction from the lens: rock taller than the beam (the cliff, the Prow, the coast) ends it; a lower
            // thing (the gate's crest, a far pipe) throws its shadow into it, and the light that clears its top goes on
            float sl = dot(q, sd), hd = max(length(vec2(z, sl)), 1e-3), u = clamp(atan(sl, z) / uSpan * 0.5 + 0.5, 0.0, 1.0) * float(NB - 1);
            int i0 = int(u), i1 = min(i0 + 1, NB - 1); float f = u - float(i0);
            vec3 oa = uOcc[o + i0], ob = uOcc[o + i1], lo = f < 0.5 ? oa : ob;
            float run = mix(oa.x, ob.x, f);                                              // (lit rain lights no rock: a beam that ended sharp on the cliff ended in the air)
            if (run < uThin.w) d *= 1.0 - smoothstep(run - clamp(uThin.x * run, uThin.y, uThin.z), run, hd);
            if (hd > lo.y) d *= smoothstep(lo.z - 0.008, lo.z + 0.008, q.y / hd);
            sum += d; tc += d * t;
          }
          tc /= max(sum, 1e-6);
          float column = min(sum * dt, uCap);
          // ---- the rain in it: streaks at the distance at which this ray is in the light, in two sizes that hand over to one
          // another so that near streaks are long and far ones a fine hatching
          vec3 up = -uRain.xyz;
          float cx = clamp(dot(rd, up), -0.999, 0.999), sinX = sqrt(1.0 - cx * cx), lam = log(sinX / (1.0 + cx)), psi = atan(dot(rd, uRainE2), dot(rd, uRainE1));
          float lv = log2(max(tc, 6.0) / 6.0), l0 = floor(lv), fr = lv - l0, D0 = 6.0 * exp2(l0);
          float many = uShape.w * 0.75;
          float st = mix(wxStreaks(psi, lam, sinX, D0, l0 * 31.0 + 1.0, many), wxStreaks(psi, lam, sinX, 2.0 * D0, l0 * 31.0 + 32.0, many), fr)
                   + 0.7 * mix(wxStreaks(psi + 1.7, lam, sinX, D0 * 1.4, l0 * 31.0 + 11.0, many), wxStreaks(psi + 1.7, lam, sinX, 2.8 * D0, l0 * 31.0 + 42.0, many), fr);
          float v = level * (uShape.y * min(column, uCapMist) + uShape.z * st * column);
          gl_FragColor = vec4(uColor * (v * (1.0 - fogAmount(tc)) * (1.0 - uVeil)), 1.0);
        }`,
    });
    if (params.has('wxbeamdbg')) mat.defines.WXDBG = '';
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = 'sea-beams'; mesh.frustumCulled = false; mesh.renderOrder = 6; mesh.visible = false;
    mesh.onBeforeRender = (renderer, scene, camera) => {
      const pix = pixelOf(renderer, camera), rt = renderer.getRenderTarget(), sc = uni.uScreen.value;
      if (rt) size2.set(rt.width, rt.height); else renderer.getDrawingBufferSize(size2);
      // (the engine draws its picture of the scene without the water whenever the water looks into itself or the painter's filter is on: both, in this sea)
      const seen = engine.pre && engine.pre.depthTexture && engine.pre.width > 8 && ((engine.water && engine.water.needsScene) || engine.paintAmount > 0) && !params.has('wxnodepth') ? 1 : 0;
      uni.uHatch.value.w = pix; sc.set(1 / Math.max(1, size2.x), 1 / Math.max(1, size2.y), camera.near, camera.far); uni.uSeen.value = seen;
      mat.uniformsNeedUpdate = true;
    };
    ctx.add(mesh); ctx.only(mesh, 'direct');

    // ---- what stands in the light's way, as the plan has it. TALL: the cliff's face, the Prow and the coast beyond it (45 m and more: no part of a beam clears them).
    // LOW: the gate, by its crest (36 m over the opening, 16 m at its ends: the upper part of a beam goes on over it), and the three far pipes (20 to 30 m)
    const tall = [], lows = [], pipes = P.farPipes.map((p) => ({ x: p.x, z: p.z, r: 0.5 * p.w, h: p.h }));
    {
      const w0 = ctx.path.at(P.wall.s), wp = (d, z) => ({ x: w0.x + w0.rx * d + w0.tx * z, z: w0.z + w0.rz * d + w0.tz * z }), face = P.wall.face.map(([d, z]) => wp(d, z));
      for (let i = 0; i + 1 < face.length; i++) tall.push([face[i], face[i + 1]]);
      const pr = P.wall.prow, c0 = wp(pr.from, -pr.out), coast = [wp(pr.to, -pr.out), c0, { x: pr.coast[0], z: pr.coast[1] }, ...pr.beyond.map(([x, z]) => ({ x, z }))];
      for (let i = 0; i + 1 < coast.length; i++) tall.push([coast[i], coast[i + 1]]);
      const g = P.gate, gs = g.s + 0.5 * g.thickAt(0) - 1, step = 4;
      for (let d = g.from; d < g.to; d += step) { const d1 = Math.min(g.to, d + step); lows.push({ a: kit.at(gs, d), b: kit.at(gs, d1), ha: g.crestAt(d), hb: g.crestAt(d1) }); }
    }
    let hitMu = 0;
    const hitSeg = (a, b, dx, dz) => {                                                  // metres from the lens along (dx, dz) to the segment a..b (0: it misses); hitMu: where along the segment
      const ex = b.x - a.x, ez = b.z - a.z, den = dx * ez - dz * ex; if (Math.abs(den) < 1e-6) return 0;
      const px = a.x - apex.x, pz = a.z - apex.z, lam = (px * ez - pz * ex) / den, mu = (px * dz - pz * dx) / den;
      if (lam > 0 && mu >= 0 && mu <= 1) { hitMu = mu; return lam; }
      return 0;
    };
    const way = [0, 0, 0];
    const cast3 = (dx, dz) => {                                                         // along (dx, dz) from the lens: metres the light runs free of tall rock; metres to a lower thing, and the slope over which the light clears it
      let L = Bm.length, ld = 1e5, lk = -1e3;
      for (const [a, b] of tall) { const lam = hitSeg(a, b, dx, dz); if (lam && lam < L) L = lam; }
      if (L < Bm.length) L = Math.min(Bm.length, L + Bm.into);                          // (the plan's outline is a ruled line and the cliff is columns: the light runs on a little, and the rock itself stops the eye)
      for (const g of lows) { const lam = hitSeg(g.a, g.b, dx, dz); if (lam && lam < ld) { ld = lam; lk = (lerp(g.ha, g.hb, hitMu) - apex.y) / lam; } }
      for (const p of pipes) {
        const px = p.x - apex.x, pz = p.z - apex.z, al = px * dx + pz * dz, off2 = px * px + pz * pz - al * al;
        if (al > 0 && off2 < p.r * p.r) { const lam = al - Math.sqrt(p.r * p.r - off2); if (lam > 0 && lam < ld) { ld = lam; lk = (p.h - apex.y) / lam; } }
      }
      way[0] = L; way[1] = ld; way[2] = lk; return way;
    };
    // with reduced motion the lens stands still, its beams one out to sea and a little up the route (it crosses the channel: the rider passes under it), one over the skerry to the cliff
    const t216 = ctx.path.at(P.tower.at[0]), standing = Math.atan2(-(t216.tx + 1.6 * t216.rx), -(t216.tz + 1.6 * t216.rz));
    const gate = makeGuard(Bm.ease, 0), manual = { on: num('wxbeams') !== null, level: num('wxbeams') ?? 0, seconds: Bm.ease };
    let store = -1;
    beams = {
      object: mesh, value: 0, store: 0, dirs: [new THREE.Vector3(), new THREE.Vector3()], lengths: [0, 0], apex,
      /** How much of the lens's light is let out, 0..1, over `seconds` (never under half a second). Staging: the showstopper, t 30 to 36. What the beams then show is this times the lens's store of the sea's light times the rain. */
      level(v, seconds = Bm.ease) { manual.on = true; manual.level = clamp01(v); manual.seconds = seconds; return beams; },
      /** Back to their own rule: they come out as the lens fills (heroes.js fills it by the show clock, t 30 to 36; staging may fill it with weather.lens.fill) and stay. */
      auto() { manual.on = false; return beams; },
      update(dt, c, s, T, calm) {
        // the lens's store: L where the boat is, lagged 6 s (it is slow to fill and slow to empty)
        const L = sea.L || 0;
        // (a realm entered further on: the store is what a boat left to the current would have brought here, L as it was `lag` seconds up the route)
        const store0 = store < 0;
        if (store0) store = T > Bm.appear[1] ? Math.max(L, P.lightBy(Math.max(0, s - Bm.lag * (P.currentBy(s).wide || 1.6)))) : 0;
        else store += (L - store) * (1 - Math.exp(-dt / Bm.lag));
        beams.store = store;
        // their own rule: they come out as the lens fills, whoever fills it (heroes.js by the show clock, t 30 to 36, or staging through weather.lens.fill): the
        // lens's filling above the cold glimmer its lowest prisms hold from t 16 (0.16), as a share of what the sea lets it hold where the boat is
        const LU = tower.lensLight && tower.lensLight.value, held = Math.max(0.25, P.lightBy(s));
        const own = restOnly ? 0 : LU ? clamp01((LU.x / held - Bm.glimmer) / (1 - Bm.glimmer)) : T < 0 ? 0 : smooth(Bm.appear[0], Bm.appear[1], T);
        if (store0) gate.set(own);                                                       // (a realm entered with the lens full: they stand already)
        const g = manual.on ? guardTo(gate, manual.level, dt, manual.seconds) : guardTo(gate, own, dt, Bm.ease);
        const rain = s < P.wall.s ? P.rainBy(s) : P.rainBy(P.wall.s - 0.5);            // the rain OUTSIDE (in the cleft none falls on the boat, but it still falls on the tower)
        const v = beams.value = g * Math.pow(clamp01(store), Bm.gamma) * (Bm.dry + (1 - Bm.dry) * rain) * (1 - c.veil);
        mesh.visible = v > 0.002;
        if (calm) lens.rotation.y = at0 + (standing - look0[0]);                        // (this module's update runs after heroes.js has turned the lens)
        if (!mesh.visible) return;
        const turn = lens.rotation.y - at0;
        for (let i = 0; i < 2; i++) {
          const a = look0[i] + turn, dx = Math.sin(a), dz = Math.cos(a);
          const free = cast3(dx, dz)[0];
          uni.uAxis.value[i].set(dx, 0, dz); beams.dirs[i].set(dx, 0, dz); beams.lengths[i] = free < Bm.length ? free - Bm.into : free;      // (to the plan's outline of the rock its middle meets)
          // direction by direction across the cone: what stands in the light's way (a beam breaks on the Prow as its edge comes round to it, not all at once)
          let far = 0;
          for (let k = 0; k < NB; k++) {
            const phi = (k / (NB - 1) * 2 - 1) * span, w3 = cast3(Math.sin(a + phi), Math.cos(a + phi)), o = (i * NB + k) * 3;
            occ[o] = w3[0]; occ[o + 1] = w3[1]; occ[o + 2] = w3[2]; if (w3[0] > far) far = w3[0];
          }
          uni.uBeam.value[i].set(Math.min(Bm.length, far + 1), v, Bm.tail * Bm.length, Bm.length);
        }
        uni.uShape.value.w = clamp01(0.25 + 0.75 * rain); uni.uShape.value.y = Bm.mist * lerp(Bm.drizzle, 1, clamp01(rain));
        uni.uRain.value.w = RA.speed * (calm ? 0.667 : 1);
      },
    };
  }

  // ============================================================================================== rain's small things
  // What the air's rain does not do. (Its streaks, its rings and their crowns are air.js and the water's own, behind
  // the front.) Before the front, when the weather turns: THREE SINGLE DROPS near the boat, each a streak that falls,
  // a strike the sea answers (a spark, a ring of light half a metre across that lasts a second and a half, a crown,
  // a real ring on the water, a dab of light left in its trace), and an event for its sound; then drops on the
  // rider's own PLANKS: a tick of thrown water where each strikes wood, on thwart, gunwale, bottom boards and oars
  // (places found on the boat's own model), a few at first and then, under the rain, as many as fall on that much
  // sea. Rainwater on wood does not glow (only the sea answers): a tick is slate, with what the bow lantern and the
  // lit sea lend it. Two draw calls (the rings lie on the water; everything that stands or falls is one mesh).
  let small = null;
  if (want('drops') || want('planks')) {
    const D = WX.drops, K = WX.planks, boat = engine.boat, uNow = { value: 0 };
    const seaU = { ...waterUniforms(engine), ...fogU, uSeaOmega: U.uSeaOmega, uSeaFront: U.uSeaFront, uSeaL: U.uSeaL, uSeaLee: U.uSeaLee, uSeaAqua: U.uSeaAqua, uSeaEmber: U.uSeaEmber, uSeaCore: U.uSeaCore,
      uNow };
    // the water's surface where a thing lies on it: the water's own function (water-final.js, WATER_SURFACE_GLSL: the swell, and the well round the hull)
    const SURFACE = WATER_SURFACE_GLSL;
    // ---- rings of light on the water: the sea's own answer to a raindrop (light.js, seaRings: a spark where it landed, its
    // ring a broken hairline that cools from core through aqua to ember as it widens, a slighter ring inside it)
    const NR = 8, rAt = new Float32Array(NR * 4), rLook = new Float32Array(NR * 4);
    for (let i = 0; i < NR; i++) rAt[i * 4 + 2] = -1e6;
    const rGeo = new THREE.InstancedBufferGeometry();
    rGeo.setAttribute('position', new THREE.Float32BufferAttribute([-1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1], 3)); rGeo.setIndex([0, 2, 1, 0, 3, 2]);
    const aRAt = new THREE.InstancedBufferAttribute(rAt, 4), aRLook = new THREE.InstancedBufferAttribute(rLook, 4);
    aRAt.setUsage(THREE.DynamicDrawUsage); aRLook.setUsage(THREE.DynamicDrawUsage);
    rGeo.setAttribute('aAt', aRAt); rGeo.setAttribute('aLook', aRLook); rGeo.instanceCount = NR;
    const rMat = new THREE.ShaderMaterial({
      uniforms: { ...seaU, uSpark: { value: D.spark } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
      vertexShader: /* glsl */`${WATER_GLSL} ${FOG_PARS} ${SURFACE}
        uniform float uNow; attribute vec4 aAt, aLook;      // x, z, born, seconds it lasts; metres across at first and at last, how bold its line, its own number
        varying vec2 vP, vXZ; varying vec4 vK; varying float vFog;
        void main() {
          float ph = (uNow - aAt.z) / max(aAt.w, 1e-3), size = 0.5 * aLook.y * 1.3 + 0.08;
          vec3 w = vec3(aAt.x + position.x * size, 0.0, aAt.y + position.z * size);
          w.y = waterHeight(w.xz) + 0.04;
          vP = position.xz * size; vXZ = w.xz; vK = vec4(ph, 0.5 * aLook.x, 0.5 * aLook.y, aLook.z);
          vec4 mv = viewMatrix * vec4(w, 1.0); vFog = (1.0 - fogAmount(fogDistance(mv))) * (1.0 - uVeil);
          gl_Position = (ph <= 0.0 || ph >= 1.0) ? vec4(2.0, 2.0, 2.0, 1.0) : projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */`uniform vec4 uSwell[3]; ${SEA_CORE}
        uniform vec3 uSeaAqua, uSeaEmber, uSeaCore; uniform float uSpark;
        varying vec2 vP, vXZ; varying vec4 vK; varying float vFog;
        void main() {
          float ph = vK.x, r = length(vP), bold = vK.w, seed = fract(vXZ.x * 0.37 + vXZ.y * 0.61 - vP.x * 0.37 - vP.y * 0.61);
          vec2 u = vP / max(r, 1e-4), fa = dFdx(vP), fb = dFdy(vP);
          float px = max(length(fa), length(fb));
          float rad = mix(vK.y, vK.z, 1.0 - (1.0 - ph) * (1.0 - ph));                    // it opens fast and slows
          // a ring, not a curl: the whole circle but for one dry gap, a hairline all the way round (measured across the line as the
          // screen sees it), and a slighter ring inside it with its gap elsewhere
          vec2 n1 = vec2(cos(seed * 41.0), sin(seed * 41.0)), n2 = vec2(cos(seed * 97.0 + 1.3), sin(seed * 97.0 + 1.3));
          vec2 u2 = vec2(u.x * u.x - u.y * u.y, 2.0 * u.x * u.y);
          float arc = smoothstep(-1.22, -1.0, 0.7 * dot(u2, n1) + 0.6 * dot(u, n2)), arc2 = smoothstep(-1.22, -0.95, 0.7 * dot(u2, n2) - 0.6 * dot(u, n1));
          float wd = max(0.007 * bold, 0.7 * length(vec2(dot(u, fa), dot(u, fb))));
          float q = (r - rad) / wd, q2 = (r - 0.55 * rad) / wd;
          float born = smoothstep(0.0, 0.07, ph);
          float line = (exp(-q * q) * arc + 0.55 * exp(-q2 * q2) * arc2 * smoothstep(0.15, 0.4, ph)) * born * min(1.0, 0.012 * bold / wd);
          float fresh = line * (1.0 - ph) * (1.0 - ph), old = line * ph * (1.0 - ph) * 3.0;
          float sr = max(0.028 * bold, 1.1 * px);
          float spark = (1.0 - smoothstep(0.55 * sr, sr, r)) * (1.0 - smoothstep(0.0, 0.3, ph)) * min(1.0, 0.0016 * bold * bold / (sr * sr));      // (a spark is a dab with an edge, not a glow)
          vec3 col = uSeaCore * (uSpark * spark + 1.0 * fresh) + uSeaAqua * (1.9 * fresh + 0.7 * old) + uSeaEmber * (3.4 * old);
          col *= vFog * uSeaL.y * seaLee(vXZ);
          if (dot(col, vec3(1.0)) < 0.003) discard;
          gl_FragColor = vec4(min(col, vec3(4.0)), 1.0);
        }`,
    });
    const rings = new THREE.Mesh(rGeo, rMat); rings.name = 'sea-first-drops (rings)'; rings.frustumCulled = false; rings.renderOrder = 1; rings.visible = false;
    ctx.add(rings); ctx.only(rings, 'direct');
    let rNext = 0, ringsUntil = -1;
    const ring = (x, z, o) => { const i = rNext; rNext = (rNext + 1) % NR; rAt.set([x, z, o.at, o.life], i * 4); rLook.set([o.r0, o.r1, o.bold, 0], i * 4); aRAt.needsUpdate = aRLook.needsUpdate = true; ringsUntil = Math.max(ringsUntil, o.at + o.life); };

    // ---- everything that stands or falls: a falling drop's streak (kind 0), the crown where it strikes the sea (1), a tick
    // of thrown water on the rider's planks (2: its place is in the boat's own frame, and it rides with the boat)
    const NT = 144, tA = new Float32Array(NT * 4), tB = new Float32Array(NT * 4);
    for (let i = 0; i < NT; i++) tA[i * 4 + 3] = -1e6;
    const tGeo = new THREE.InstancedBufferGeometry();
    tGeo.setAttribute('position', new THREE.Float32BufferAttribute([-1, 0, 0, 1, 0, 0, 1, 1, 0, -1, 1, 0], 3)); tGeo.setIndex([0, 1, 2, 0, 2, 3]);
    const aTA = new THREE.InstancedBufferAttribute(tA, 4), aTB = new THREE.InstancedBufferAttribute(tB, 4);
    aTA.setUsage(THREE.DynamicDrawUsage); aTB.setUsage(THREE.DynamicDrawUsage);
    tGeo.setAttribute('aA', aTA); tGeo.setAttribute('aB', aTB); tGeo.instanceCount = NT;
    const RA = P.rainAir || { speed: 9, slant: 12 }, sl = RA.slant * Math.PI / 180, vel = new THREE.Vector3(wind.x * Math.sin(sl), -Math.cos(sl), wind.z * Math.sin(sl)).multiplyScalar(RA.speed);
    const tUni = {
      ...fogU, uNow, uBoatM: { value: new THREE.Matrix4() }, uBoatInv: { value: new THREE.Matrix4() }, uLid: { value: -1e3 }, uVel: { value: vel }, uPix: { value: 0.0012 },
      uLanternPos: sh.uLanternPos || { value: new THREE.Vector3(0, -100, 0) }, uLanternColor: sh.uLanternColor || { value: new THREE.Color(0, 0, 0) },
      uSlate: { value: new THREE.Color(K.color) }, uAqua: U.uSeaAqua, uCore: U.uSeaCore, uSeaL: U.uSeaL,
      uTickUp: { value: new THREE.Vector2(K.up, K.wet) }, uDrop: { value: new THREE.Color(D.color).multiplyScalar(D.dim) }, uDropLow: { value: new THREE.Vector2(D.low[0], D.low[1]) }, uCrown: { value: new THREE.Vector2(D.crown.core, D.crown.aqua) },
      uTick: { value: new THREE.Vector4(K.gain, K.lantern, K.sea, 0) }, uTickAqua: { value: K.seaAqua },      // how bright a tick on wood; how much of the bow lantern it takes; how much of the lit sea; L where the boat is. And how much of the sea's aqua
    };
    const tMat = new THREE.ShaderMaterial({
      uniforms: tUni, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
      vertexShader: /* glsl */`${FOG_PARS}
        uniform float uNow, uPix, uLid; uniform mat4 uBoatM, uBoatInv; uniform vec3 uVel, uLanternPos; uniform vec2 uDropLow, uTickUp;
        attribute vec4 aA, aB;      // x, y, z (kind 2: in the boat's frame), born; kind, seconds it lasts, size (m), its own number
        varying vec2 vUv; varying vec4 vK; varying float vFog, vLamp;
        void main() {
          float age = uNow - aA.w, ph = age / max(aB.y, 1e-3), kind = aB.x;
          vec3 base = kind > 1.5 ? (uBoatM * vec4(aA.xyz, 1.0)).xyz : aA.xyz;
          vec3 up = vec3(0.0, 1.0, 0.0); float wide = aB.z, tall = aB.z;
          if (kind < 0.5) { base += uVel * age; up = -normalize(uVel); tall = aB.z; }      // a falling drop: its foot is where the drop is, its streak stands up the way it came
          vec3 toEye = cameraPosition - base; float dist = length(toEye);
          vec3 right = normalize(cross(up, toEye));
          if (kind < 0.5) wide = max(0.006, 0.65 * dist * uPix);
          else { float pt = kind > 1.5 ? ph / uTickUp.x : ph, rise = sin(3.14159 * clamp(pt, 0.0, 1.0)); tall *= (0.3 + 0.7 * rise); wide *= 0.6 + 0.4 * min(pt, 1.0); }      // thrown water rises and falls back, spreading (on wood its spat stays a moment after)
          vec3 wp = base + right * (position.x * wide) + up * (position.y * tall);
          // (a falling drop comes out of the dark only in its last two metres over the sea: -uVel.y * (aB.y - age) is how high it still is)
          vUv = vec2(position.x, position.y); vK = vec4(kind, ph, aB.w, kind < 0.5 ? min(1.0, 0.006 / wide) * (1.0 - smoothstep(uDropLow.x, uDropLow.y, -uVel.y * (aB.y - age))) : 1.0);
          vec4 mv = viewMatrix * vec4(wp, 1.0); vFog = (1.0 - fogAmount(fogDistance(mv))) * (1.0 - uVeil);
          vec3 tl = uLanternPos - base; vLamp = 1.0 / (1.0 + dot(tl, tl) / 0.5);
          vec4 clip = projectionMatrix * mv;
          // The rider's boat keeps the sea out of itself with a lid that writes depth only, a hand above the waterline (boat-hero.js): whatever is drawn
          // later and lies under it (the bottom boards are under the waterline) is hidden as the water is. A tick on wood under the lid takes the depth of
          // the place where the eye's ray comes through the lid: it shows, and a thwart or a gunwale in front of it still hides it
          if (kind > 1.5 && uLid > -100.0) {
            vec3 camL = (uBoatInv * vec4(cameraPosition, 1.0)).xyz, pL = (uBoatInv * vec4(wp, 1.0)).xyz;
            if (pL.y < uLid + 0.012 && camL.y > uLid + 0.03) {
              vec4 cq = projectionMatrix * viewMatrix * (uBoatM * vec4(mix(camL, pL, (camL.y - (uLid + 0.012)) / (camL.y - pL.y)), 1.0));
              clip.z = cq.z / cq.w * clip.w;
            }
          }
          gl_Position = (ph <= 0.0 || ph >= 1.0) ? vec4(2.0, 2.0, 2.0, 1.0) : clip;
        }`,
      fragmentShader: /* glsl */`
        uniform vec3 uSlate, uAqua, uCore, uLanternColor, uDrop; uniform vec4 uTick, uSeaL; uniform vec2 uCrown, uTickUp; uniform float uTickAqua;
        varying vec2 vUv; varying vec4 vK; varying float vFog, vLamp;
        void main() {
          float kind = vK.x, ph = vK.y, x = vUv.x, y = vUv.y; vec3 col;
          if (kind < 0.5) {
            // a single falling drop before any rain: slate, brightest at its foot (the sea under it is not lit yet)
            float body = (1.0 - smoothstep(0.35, 1.0, abs(x))) * smoothstep(0.0, 0.05, y) * (1.0 - y) * (1.0 - y);
            col = uDrop * (body * vK.w);
          } else {
            // thrown water, as the air draws a crown under the rain: a tick broad at its foot and drawn to a point; a bead or two thrown clear of it; a spat at its foot
            float seed = vK.z, up = kind > 1.5 ? 1.0 - smoothstep(0.76 * uTickUp.x, uTickUp.x, ph) : 1.0 - smoothstep(0.6, 1.0, ph);
            float mid = (1.0 - smoothstep(0.07, 0.4, abs(x) * (1.0 + 4.0 * y))) * (1.0 - smoothstep(0.7, 1.0, y));
            vec2 b1 = vec2(-0.4 - 0.3 * fract(seed * 7.0), 0.4 + 0.4 * fract(seed * 11.0)), b2 = vec2(0.3 + 0.4 * fract(seed * 13.0), 0.3 + 0.35 * fract(seed * 17.0));
            float beads = (1.0 - smoothstep(0.05, 0.11, length((vec2(x, y) - b1) * vec2(1.0, 1.7)))) + (1.0 - smoothstep(0.04, 0.1, length((vec2(x, y) - b2) * vec2(1.0, 1.7)))) * step(0.35, fract(seed * 19.0));
            float spat = (1.0 - smoothstep(0.4, 0.9, abs(x))) * (1.0 - smoothstep(0.0, 0.1, y));
            if (kind < 1.5) col = mix(uCore * uCrown.x, uAqua * uCrown.y, smoothstep(0.1, 0.6, y)) * (clamp(mid + 0.8 * beads + 0.6 * spat, 0.0, 1.3) * up * uSeaL.y);      // the sea's own crown
            else {
              // rainwater on wood does not glow. The tick stands a fifth of a second; the wet it leaves is a fleck a thumb wide that the sea's light lies on for a second
              float wet = (1.0 - smoothstep(0.06, 0.44, length(vec2(x, (y - 0.5) * 0.9)))) * smoothstep(0.5 * uTickUp.x, uTickUp.x, ph) * pow(1.0 - ph, 1.3);
              col = (uSlate * (1.0 + uTick.z * uTick.w) + uAqua * (uTickAqua * uTick.w) + uLanternColor * (uTick.y * vLamp))
                     * (uTick.x * ((clamp(mid + 0.8 * beads, 0.0, 1.2) + 0.55 * spat) * up + uTickUp.y * wet));
            }      // rainwater on wood: it does not glow, and its spat stays wet a moment
          }
          col *= vFog;
          if (dot(col, vec3(1.0)) < 0.002) discard;
          gl_FragColor = vec4(col, 1.0);
        }`,
    });
    const ticks = new THREE.Mesh(tGeo, tMat); ticks.name = 'sea-first-drops (streaks, crowns) and rain on the planks'; ticks.frustumCulled = false; ticks.renderOrder = 6; ticks.visible = false;
    ticks.onBeforeRender = (renderer, scene, camera) => {
      const g = boat && boat.model && boat.model.group;
      if (g) {
        tUni.uBoatM.value.copy(g.matrixWorld); tUni.uBoatInv.value.copy(g.matrixWorld).invert();
        if (tUni.uLid.value < -100) { const lid = g.getObjectByName('boat-lid'), lp = lid && lid.geometry && lid.geometry.attributes.position; if (lp && lp.count) tUni.uLid.value = lp.getY(0); }      // (the lid's height, in the boat's own frame)
      }
      tUni.uPix.value = pixelOf(renderer, camera); tMat.uniformsNeedUpdate = true;
    };
    ctx.add(ticks); ctx.only(ticks, 'direct');
    let tNext = 0, ticksUntil = -1;
    const put = (x, y, z, at, kind, life, size, seed) => { const i = tNext; tNext = (tNext + 1) % NT; tA.set([x, y, z, at], i * 4); tB.set([kind, life, size, seed], i * 4); aTA.needsUpdate = aTB.needsUpdate = true; ticksUntil = Math.max(ticksUntil, at + life); };

    // ---- where rain can strike the rider's boat: places on what looks up on the boat's own model (thwarts, gunwale, bottom
    // boards, oars, the foredeck), found once from its triangles, weighed by their area
    const rnd = ctx.rng(4409), spots = [];
    const findSpots = () => {
      const body = boat && boat.model && boat.model.group && boat.model.group.getObjectByName('boat-body'), g = body && body.geometry, pa = g && g.attributes.position;
      if (!pa) {                                           // (another boat: the three thwarts and the gunwale by the boat's page's own measures)
        for (let i = 0; i < K.spots; i++) { const k = rnd(), z = k < 0.3 ? -0.99 + 0.2 * rnd() : k < 0.5 ? 1.15 + 0.35 * rnd() : -1.8 + 3.2 * rnd(), edge = k >= 0.5; spots.push(edge ? (rnd() < 0.5 ? -1 : 1) * (0.66 - 0.12 * Math.abs(z)) : (rnd() - 0.5) * 1.0, edge ? 0.42 : 0.25, z); }
        return;
      }
      const ix = g.index, n = ix ? ix.count / 3 : pa.count / 3, a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), ab = new THREE.Vector3(), ac = new THREE.Vector3(), nn = new THREE.Vector3();
      const tri = [], cum = []; let total = 0;
      for (let t = 0; t < n; t++) {
        const i0 = ix ? ix.getX(t * 3) : t * 3, i1 = ix ? ix.getX(t * 3 + 1) : t * 3 + 1, i2 = ix ? ix.getX(t * 3 + 2) : t * 3 + 2;
        a.fromBufferAttribute(pa, i0); b.fromBufferAttribute(pa, i1); c.fromBufferAttribute(pa, i2);
        nn.crossVectors(ab.subVectors(b, a), ac.subVectors(c, a)); const area = 0.5 * nn.length(); if (area < 1e-7) continue;
        const up = Math.abs(nn.y) / (2 * area), y = (a.y + b.y + c.y) / 3, z = (a.z + b.z + c.z) / 3, x = (a.x + b.x + c.x) / 3;
        if (up < 0.82 || y < -0.03 || y > 0.72 || Math.abs(x) > 0.74) continue;
        // (not what a thwart shelters: the bottom boards and timbers right under one)
        if (y < 0.16 && ((z > -1.02 && z < -0.76) || (z > 0.36 && z < 0.64) || z > 1.12)) continue;
        total += area * up; tri.push(i0, i1, i2); cum.push(total);
      }
      if (!total) return;
      for (let k = 0; k < K.spots; k++) {
        const r = rnd() * total; let lo = 0, hi = cum.length - 1; while (lo < hi) { const m = (lo + hi) >> 1; if (cum[m] < r) lo = m + 1; else hi = m; }
        a.fromBufferAttribute(pa, tri[lo * 3]); b.fromBufferAttribute(pa, tri[lo * 3 + 1]); c.fromBufferAttribute(pa, tri[lo * 3 + 2]);
        let u = rnd(), v = rnd(); if (u + v > 1) { u = 1 - u; v = 1 - v; }
        spots.push(a.x + (b.x - a.x) * u + (c.x - a.x) * v, a.y + (b.y - a.y) * u + (c.y - a.y) * v + 0.004, a.z + (b.z - a.z) * u + (c.z - a.z) * v);
      }
    };
    let spotsTried = false;
    const hullOn = (x, z, margin) => { const fx = -Math.sin(boat.heading), fz = -Math.cos(boat.heading), qx = x - boat.x, qz = z - boat.z, t = Math.min(2.3, Math.max(-1.7, qx * fx + qz * fz)); return Math.hypot(qx - fx * t, qz - fz * t) < 0.55 + margin; };
    const view = new THREE.Vector3(), mW = new THREE.Vector3();
    let lastTick = -1e6, acc = 0, need = 1, volley = null, fired = false, wasS = null;
    const manualRate = { on: num('wxplanks') !== null, rate: num('wxplanks') ?? 0 };
    const strike = (time, forward) => {                                                // one drop on the planks
      if (!spotsTried) { spotsTried = true; try { findSpots(); } catch (err) { console.error('cast_weather: no places on the boat for the rain to strike: ' + ((err && err.message) || err)); } }
      const ns = spots.length / 3; if (!ns) return;
      let i = Math.floor(rnd() * ns); if (forward) for (let k = 0; k < 12 && !(spots[i * 3 + 2] < -0.3 && spots[i * 3 + 2] > -1.9); k++) i = Math.floor(rnd() * ns);      // (the first few where the rider is looking: ahead of the thwart)
      const x = spots[i * 3], y = spots[i * 3 + 1], z = spots[i * 3 + 2], size = lerp(K.size[0], K.size[1], rnd() * rnd());
      put(x, y, z, time, 2, lerp(K.life[0], K.life[1], rnd()), size, rnd());
      if (time - lastTick >= K.every * (0.8 + 0.6 * rnd())) {
        lastTick = time; const g = boat.model && boat.model.group;
        if (g) { mW.set(x, y, z).applyMatrix4(g.matrixWorld); fire('tick', mW.x, mW.y, mW.z, { pitch: 0.5, gain: 0.3 * (0.7 + 0.6 * size / K.size[1]) }); } else fire('tick', boat.x, 0.3, boat.z, { pitch: 0.5, gain: 0.3 });
      }
    };
    small = {
      rings, object: ticks, spots, falling: false,
      /** The three first drops, now (staging: moment 8; by itself the first time the boat passes the weather's turn). o.gaps: seconds from the first to the second and to the third. Does nothing while three are already falling. */
      fire(o = {}) {
        if (volley) return false;
        fired = true; volley = { t0: ctx.time + (o.delay ?? 0.4), gaps: o.gaps || D.gaps, next: 0, hits: [], ticks: D.then.slice(), done: false };
        return true;
      },
      /** false: the three drops wait for fire() (they then no longer fall by themselves at the weather's turn). */
      auto: true,
      planks: {
        /** Drops a second on the rider's planks (null: their own rule again: a few once the three first drops have fallen, then with the rain: 9 on every square metre a second at its heaviest). */
        rate(perSecond) { manualRate.on = perSecond !== null && perSecond !== undefined; manualRate.rate = perSecond || 0; return small.planks; },
        value: 0,
      },
      update(dt, c, s, T) {
        const time = c.time; uNow.value = time;
        // ---- the three first drops: by themselves as the boat first passes the weather's turn (not with &rest=1, not once the show runs)
        if (small.auto && !fired && !restOnly && T < 0 && wasS !== null && wasS < WX.turn.s && s >= WX.turn.s) small.fire();
        if (wasS === null && num('wxdrops') !== null) small.fire({ delay: num('wxdrops') });
        else if (wasS === null && s > WX.turn.s + 1) fired = true;                       // (a realm entered beyond the turn: they have fallen)
        wasS = s;
        if (volley) {
          const V = volley;
          while (V.next < 3 && time >= V.t0 + (V.next ? V.gaps[V.next - 1] : 0) - D.fall) {
            // where it will strike: in the water the rider is looking at, a few metres off, never on the boat
            engine.camera.getWorldDirection(view); const hd = Math.hypot(view.x, view.z) || 1, ang = Math.atan2(view.x / hd, view.z / hd);
            let x = 0, z = 0;
            for (let k = 0; k < 8; k++) { const a = ang + (D.at[V.next][1] + (k ? (rnd() - 0.5) * 50 : 0)) * Math.PI / 180, r = D.at[V.next][0] + k * 0.5; x = boat.x + Math.sin(a) * r; z = boat.z + Math.cos(a) * r; if (!hullOn(x, z, 1.1)) break; }
            const at = V.t0 + (V.next ? V.gaps[V.next - 1] : 0), y = c.water.heightAt(x, z);
            put(x - vel.x * D.fall, y - vel.y * D.fall, z - vel.z * D.fall, at - D.fall, 0, D.fall, D.streak, rnd());      // its streak: it comes down the way the rain will
            V.hits.push({ x, z, at, i: V.next, done: false }); V.next++;
          }
          for (const h of V.hits) if (!h.done && time >= h.at) {
            h.done = true;
            const y = c.water.heightAt(h.x, h.z);
            c.water.ripple(h.x, h.z, D.ripple[0], D.ripple[1]);
            if (c.water.trace) c.water.trace.inject(h.x, h.z, { channel: 'glow', radius: D.dab[0], strength: D.dab[1], soft: 0.7 });
            ring(h.x, h.z, { at: h.at, life: D.ring.life, r0: D.ring.r0, r1: D.ring.r1, bold: D.ring.bold });
            put(h.x, y + 0.02, h.z, h.at, 1, D.crown.life, D.crown.tall, rnd());
            fire('drop', h.x, y, h.z, { index: h.i, pitch: 1.2 });
          }
          // and then the first drops on the planks, one at a time, where the rider is looking
          const end = V.t0 + V.gaps[1];
          while (V.ticks.length && V.hits.length === 3 && time >= end + V.ticks[0]) { V.ticks.shift(); strike(time, true); }
          if (!V.ticks.length && V.hits.length === 3 && V.hits.every((h) => h.done)) volley = null;
        }
        small.falling = !!volley;
        // ---- rain on the planks: a few a second once the first drops have fallen and until the rain comes; then with the rain
        const rain = sea.rain || 0, before = fired && !volley && T < 14 && rain < 0.02 && !restOnly ? K.sparse * state.turn : 0;
        const rate = manualRate.on ? manualRate.rate : Math.max(before, K.full * Math.pow(rain, 0.8)) * (c.reducedMotion ? 0.6 : 1);
        small.planks.value = rate;
        acc += rate * dt;
        let guardN = 0; while (acc >= need && guardN++ < 8) { acc -= need; need = 0.3 + 1.4 * rnd(); strike(time - rnd() * dt, false); }      // (never a beat: each drop waits its own while)
        if (acc > 8) acc = 0;
        tUni.uTick.value.w = sea.L || 0;
        rings.visible = time < ringsUntil + 0.1; ticks.visible = time < ticksUntil + 0.1;
        if (debug && !small.told && time > 3) { small.told = true; let alive = 0; for (let i = 0; i < NT; i++) if (time - tA[i * 4 + 3] < tB[i * 4 + 1]) alive++; const hy = {}, hz = {}; for (let i = 0; i < spots.length; i += 3) { const ky = (Math.floor(spots[i + 1] * 10) / 10).toFixed(1), kz = (Math.floor(spots[i + 2] * 2) / 2).toFixed(1); hy[ky] = (hy[ky] || 0) + 1; hz[kz] = (hz[kz] || 0) + 1; } console.error('WX_PROBE ' + JSON.stringify({ planks: { rate, rain, places: spots.length / 3, alive, dt, lid: tUni.uLid.value, byHeight: hy, byLength: hz } })); }
      },
    };
  }

  // ============================================================================================== the lighthouse's moving parts
  // The lens, the vane and the fourth window's shutter are the lighthouse's own parts, and heroes.js turns them by phase
  // (the lens once in 28 s; a vane that sways; a shutter that eases to and fro). This module's update runs after that
  // one, and takes two of them over so that they answer this group's wind and can be heard:
  //   the shutter   hangs square to the wall on its stay. The wind shoves it wall-ward until the stay stops it dead (the
  //                 KNOCK: an event, at the tower), it shivers there while the wind holds it, and comes away slowly as
  //                 the wind lets go; no two swings alike, some too soft to reach the stay at all. 25 degrees, 5 s
  //   the vane      hunts about the weather's quarter, more the harder it blows; backs 40 degrees when the weather turns
  //                 (it swings past and comes back, as a vane does) and comes round again when the front reaches the tower
  //   the lens      keeps heroes.js's turn and filling; staging may set the filling here, and its filling is told (an event)
  let parts = null;
  if (want('parts') && tower && tower.parts) {
    const Q = WX.parts, Mo = P.monument || {}, rad = Math.PI / 180, shutter = tower.parts.shutter, vane = tower.parts.vane;
    const sw = (Mo.shutter && Mo.shutter.swing) || 25, period = (Mo.shutter && Mo.shutter.period) || 5, vn = Mo.vane || { from: -18, veer: 9, shiver: 4 };
    // one swing of the shutter, by its own number n: when in it the stay stops the shutter (as a share of the swing), how hard, and where it has drifted back to by the end
    const swing = (n) => ({ at: 0.3 + 0.12 * hash1(n, 7), hard: hash1(n, 13), end: -(0.45 + 0.55 * hash1(n, 19)) });
    const ease = (x) => x * x * (3 - 2 * x);
    // (its swings are not of one length: the wind that shoves it comes and goes, so a swing lasts four to seven seconds, five on the whole; with every swing
    // five seconds long, four knocks running were a clock striking)
    const warp = (time) => time / period + 0.15 * Math.sin(time * 0.37 + 1.3 * Math.sin(time * 0.11));
    const shutterAt = (time) => {
      const w = warp(time), n = Math.floor(w), ph = w - n, S = swing(n), from = swing(n - 1).end;
      let a;
      if (S.hard < Q.soft) {                                   // a soft one: the wind only leans on it, and it never reaches its stay
        const top = 0.35 + 0.5 * S.hard / Q.soft, up = S.at + 0.12;
        a = ph < up ? lerp(from, top, ease(ph / up)) : lerp(top, S.end, ease((ph - up) / (1 - up)));
      } else {
        const bounce = 0.075, held = 0.1 + 0.16 * hash1(n, 29), go = S.at + bounce + held;
        if (ph < S.at) a = lerp(from, 1, Math.pow(ph / S.at, 1.9));                    // shoved: slow off, quick on to the stay
        else if (ph < S.at + bounce) a = 1 - (0.1 + 0.1 * S.hard) * Math.sin(Math.PI * (ph - S.at) / bounce);      // it jumps back off the stay and is put back against it
        else if (ph < go) a = 1 - 0.018 * (1 + Math.sin(time * 21 + n)) * (1 - (ph - S.at - bounce) / held);       // held there, shivering
        else a = lerp(1, S.end, ease((ph - go) / (1 - go)));                           // and comes away as the wind lets go
      }
      return { a, n, ph, S };
    };
    const vb = { x: 0, v: 0, manual: null, seconds: 3 }, fill = { manual: null, guard: makeGuard(1, 0), told: false };
    let knocked = -1, first = true;
    const frontAtTower = () => (sea.front ? sea.front.behind(tower.x, tower.z) : -1);
    parts = {
      shutter: { angle: 0, knocks: 0 },
      vane: {
        angle: 0,
        /** Back the vane by so many degrees over about `seconds` (it swings past and settles). Staging: moment 8, 40 degrees. null: its own rule again (40 when the weather turns, round again when the front reaches the tower). */
        back(deg, seconds = 3) { vb.manual = deg; vb.seconds = seconds; return parts.vane; },
        auto() { vb.manual = null; return parts.vane; },
      },
      lens: {
        value: 0,
        /** How full of the sea's light the lens is, 0..1, over `seconds` (heroes.js fills it by the show clock: 0.16 by t 26, 1 by t 36; null gives it back). */
        fill(v, seconds = 2) { fill.manual = v === null || v === undefined ? null : clamp01(v); fill.seconds = seconds; return parts.lens; },
        auto() { fill.manual = null; return parts.lens; },
      },
      update(dt, c, s, T, calm) {
        const time = c.time, k = calm && !params.has('wxfull') ? Q.calm : 1, wnd = state.wind;      // (&wxfull=1: the parts as they move without reduced motion, for looking at them from a camera that does not heave)
        // ---- the shutter
        if (shutter) {
          const m = shutterAt(time), blow = 0.6 + 0.4 * smooth(0.25, 0.58, wnd);
          parts.shutter.angle = m.a * 0.5 * sw * k * blow;
          shutter.rotation.y = Q.wallward * parts.shutter.angle * rad;
          if (m.S.hard >= Q.soft && m.ph >= m.S.at && knocked !== m.n) {
            knocked = m.n;
            if (!first && m.ph < m.S.at + 0.2) { parts.shutter.knocks++; const at = tower.shutterAt || tower.lens; fire('knock', at.x, at.y, at.z, { gain: 0.3 * (0.55 + 0.45 * m.S.hard) * blow }); }
          }
        }
        // ---- the vane: where the wind has gone, and how hard it blows
        if (vane) {
          const own = restOnly ? 0 : frontAtTower() > 0 ? 0 : Q.back * state.turn;
          // (the monument's own control, shared.tower.vaneBack, still works: the vane backs by the greater of it and this rule, never by their sum)
          const tb = tower.vaneBack || 0, target = vb.manual === null ? (Math.abs(tb) > Math.abs(own) ? tb : own) : vb.manual;
          if (first) { vb.x = target; vb.v = 0; if (num('wxvane') !== null) vb.manual = num('wxvane'); }      // (&wxvane=40: it backs by that much from the first frame, for looking)
          const w0 = Q.swing[0] * 3 / Math.max(1, vb.manual === null ? 3 : vb.seconds), n = Math.max(1, Math.ceil(dt / 0.02)), h = dt / n;      // (a weighted vane: it comes round in about three seconds and swings past once)
          for (let i = 0; i < n; i++) { vb.v += (w0 * w0 * (target - vb.x) - 2 * Q.swing[1] * w0 * vb.v) * h; vb.x += vb.v * h; }
          const gust = 0.55 + 0.45 * Math.sin(time * 0.37 + 1.3 * Math.sin(time * 0.11)), blow = 0.25 + 1.3 * wnd;
          const hunt = vn.veer * (0.7 * Math.sin(time * 0.13 + 1.0) + 0.3 * Math.sin(time * 0.31 + 4.0)) + vn.shiver * blow * gust * (0.5 * Math.sin(time * 2.9) + 0.3 * Math.sin(time * 6.7 + 2.0) + 0.2 * Math.sin(time * 10.3 + 0.7));
          parts.vane.angle = vn.from + vb.x + k * hunt;
          vane.rotation.y = parts.vane.angle * rad;
        }
        // ---- the lens's filling: heroes.js's, unless staging has taken it; and its filling is told once
        if (tower.lensLight) {
          const L = tower.lensLight.value;
          if (fill.manual !== null) L.x = guardTo(fill.guard, fill.manual, dt, fill.seconds || 2); else fill.guard.set(L.x);      // (taken over, it goes on from where heroes.js had it)
          parts.lens.value = L.x;
          if (L.x < Q.told * 0.6) fill.told = false;
          if (!fill.told && L.x >= Q.told) { fill.told = true; if (!first) fire('lens', tower.lens.x, tower.lens.y, tower.lens.z, { pitch: 1.2, gain: 0.9 }); }
        }
        first = false;
      },
    };
  }

  // ============================================================================================== what staging is given
  Object.assign(weather, {
    /** The wind as this group has it: level 0..1 (the page's sound: 0.28 at rest, 0.55 once the weather has turned, 0.3 in the breath of stillness, 0.6 with the front), turn 0..1, dir the way it blows to. */
    wind: { get level() { return state.wind; }, get turn() { return state.turn; }, dir: [wind.x, wind.z] },
    catspaws: paws,
    beams,
    drops: small,
    lens: parts && parts.lens, vane: parts && parts.vane, shutter: parts && parts.shutter,
  });
  cast.catspaws = paws; cast.beams = beams;

  if (debug) {                                             // (several short lines: the picture tool cuts a long one off)
    // (and every event as it is told, as one line once the realm has run &wxdebug=<seconds>: what staging will hear. k knock, d drop, t tick, l lens, each with the realm's time)
    const heard = [], at = num('wxdebug') || 0; let said = false;
    for (const name of ['drop', 'tick', 'knock', 'lens']) weather.on(name, (x, y, z, o) => heard.push(name[0] + ctx.time.toFixed(1) + (name === 'knock' || name === 'tick' ? '/' + ((o && o.gain) || 0).toFixed(2) : '')));
    if (at > 0) ctx.onUpdate(() => { if (!said && ctx.time >= at) { said = true; console.error(`WX_PROBE heard by t=${ctx.time.toFixed(1)} (T=${(sea.T ?? -1).toFixed(1)}, s=${ctx.s.toFixed(0)}): ` + (() => { let nt = 0; const out = heard.filter((h) => h[0] !== 't' || ++nt <= 12); return out.join(' ').slice(0, 700) + (nt > 12 ? ` (+${nt - 12} more ticks)` : ''); })() + ` | knocks ${parts ? parts.shutter.knocks : '-'}, vane ${parts ? parts.vane.angle.toFixed(1) : '-'}, wind ${state.wind.toFixed(2)}, turn ${state.turn.toFixed(2)}, paws ${paws ? paws.level.toFixed(2) : '-'}, beams ${beams ? beams.value.toFixed(2) : '-'}, lens ${parts ? parts.lens.value.toFixed(2) : '-'}`); } });
    const r2 = (v) => (v && v.x !== undefined ? [v.x, v.y, v.z].map((n) => +n.toFixed(2)) : v);
    console.error('WX_PROBE ' + JSON.stringify({ wind: [wind.x, wind.z].map((n) => +n.toFixed(3)), paws: paws ? { triangles: paws.object.geometry.index.count / 3 } : null }));
    if (tower) {
      console.error('WX_PROBE ' + JSON.stringify({ lens: r2(tower.lens), beamA: r2(tower.beam(0, new THREE.Vector3())), beamB: r2(tower.beam(1, new THREE.Vector3())), lensTurn: tower.parts.lens && +tower.parts.lens.rotation.y.toFixed(3) }));
      console.error('WX_PROBE ' + JSON.stringify({ shutterAt: r2(tower.shutterAt), vaneAt: r2(tower.vaneAt), tower: [+tower.x.toFixed(2), +tower.z.toFixed(2)], shutterTurn: tower.parts.shutter && tower.parts.shutter.rotation.toArray().slice(0, 3).map((n) => +n.toFixed(3)), vaneTurn: tower.parts.vane && +tower.parts.vane.rotation.y.toFixed(3) }));
    }
  }

  return {
    update(dt, c) {
      const s = c.s, T = sea.T ?? -1, time = c.time;
      windNow(s, T, dt);
      if (paws) paws.update(dt, time, s, T, !!c.reducedMotion);
      if (parts) parts.update(dt, c, s, T, !!c.reducedMotion);
      if (beams) beams.update(dt, c, s, T, !!c.reducedMotion);
      if (small) small.update(dt, c, s, T);
      state.first = false;
    },
  };
}
