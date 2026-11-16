// The answering sea: the other hero pieces (stage 2b, beside heroes.js, which holds the monument). Its log, kept
// current, says what stands and how to see it: docs/build/sea/2-heroes.md. Its numbers: PLAN.heroesB (plan.js).
//
//   gate_crown + gate_vault (hero, 70 m)   the cap and keystone mass over the gate's opening, and the roof of the passage under it
//   wreck (hero, 21 m)                     the frames of a wooden vessel on a reef awash
//   bellbuoy (hero, 5.8 m)                 rides the swell; its bell and its four hammers move; its mooring chain (grown here)
//                                          takes each heave as a dotted line of light
//   rowboat (hero, 4.2 m)                  on the slip, with its oars, rowlocks, bailer and painter
//
// Each model replaces its stand-in in heroes.js (taken out here with removeStandIn; the stand-in's own lines are
// still in heroes.js and are listed in docs/build/sea/2-heroes.md). Scripts and pictures: source-art/models/sea/;
// files: assets/models/sea/. What this module puts in `shared`: shared.heroesB (see the end of build()).
//
// Switches for looking: &hb=0 leaves this module's models out (the stand-ins stay), &hb=crown,wreck,buoy,rowboat builds
// only those; &hbpaint=0 shows the models in the sea's light without their paint carried into it (to compare);
// &hbsliver=0 with the wash unthinned on faces seen edge-on (the lines of light along arrises that it is there to
// prevent); &hbvault=0 the vault in the rock's own wash, as it was; &hbdebug=1 (or a number of seconds) makes the page
// log one line, HB_PROBE, with the buoy's strikes, its greatest lean, the water under it and the chain's snatches
// (the picture tool prints it among the page's errors: it is not one); &hbvmin=0.15 the speed at which a hammer counts
// as striking; &hbchain=attr shows every link of the mooring chain by its own numbers; &hbpush=12 gives the buoy one
// push (shared.heroesB.buoy.push) twelve seconds in: a hammer is seen to strike; &hbends=0 the vault's hanging ends as
// plain faces again (no painting of broken rock on them, no facets or sheen in their light: to compare).
// (The trial copy heroes_b.next.js and its switch &hbnext=1 went at stage 5: the copy was this file line for line. To work on
// this file without putting a half-made shader into anybody else's picture, make such a copy again and a switch for it in
// src/realms/sea.js, as kit.next.js has.)
import { removeStandIn } from '../../engine/modules.js';

export async function build(ctx, plan, shared) {
  const { THREE, kit } = ctx, P = plan, C = P.colors, sea = shared.sea, path = ctx.path;
  const out = shared.heroesB = {};
  // FOR THE KIT (and anyone with rock under the surface): shared.heroesB.under is a gouache extension that lets all
  // light on a thing die over a metre below the troughs of the swell (0.6 m under still water). The rock's light takes
  // every face near the waterline for a lit foot, under water too: behind the rain front a reef plate then stands in
  // the sea as a glowing slab with a ruled outline (the plates round the wreck do: docs/build/sea/2-heroes.md). Add it
  // LAST to a material's extend list: extend: [...yours, shared.heroesB.under].
  out.under = { light: /* glsl */`{ float hbUnderK = smoothstep(-1.6, -0.6, vWPos.y); c *= 0.12 + 0.88 * hbUnderK; glow *= hbUnderK; }` };
  const params = new URLSearchParams(location.search), pick = params.get('hb');
  // (&hbmodels=vault,wreck loads <file>_next.glb for those models while they are being rebuilt: `gate_crown.py -- next`,
  // `wreck.py -- next` ... write such files. Without the switch nothing changes.)
  const nxList = (params.get('hbmodels') || '').split(','), nx = (name) => (nxList.includes(name) ? '_next' : '');
  const want = (name) => pick === null || pick.split(',').includes(name);

  // ---------------------------------------------------------------------------------------------- a model's paint in the sea's light
  // Everything solid here wears the sea's light (light.js: sea.extend). Two things are laid over it for a MODEL, the
  // same two the kit lays over its columns (kit.js), so that a modelled piece and the columns beside it are one rock:
  //   - a surface painting of the area (assets/art/sea/, the kit's list in plan.kit.art), projected from three sides,
  //     as a change about its own mean: it gives a face its cracks, lichen and salt and never changes its value;
  //   - the sea's light is added light and falls on a surface whatever its paint, while a model's paint carries its
  //     form (the shade in its joints and crevices, pale streaks, wet tips, the black lining of its hollows). So the
  //     light a model takes is weighed by its paint against a reference colour (the square root of its value, like the
  //     kit's, and a little of its hue): where the paint is the reference, nothing changes; a crevice painted dark
  //     stays dark; pure black takes no light.
  const K = P.kit || {}, white = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1); white.needsUpdate = true;
  // (the paintings the kit does not list: their files, mean colours as the shader sees them, and the metres one repeat covers)
  const MINE = { oak: { file: 'tower_oak', mean: [0.0937, 0.0817, 0.17], tile: 0.9 }, boatpaint: { file: 'tower_paint', mean: [0.2016, 0.2821, 0.4496], tile: 1.1 } };
  const painting = async (name, tile) => {
    const a = (K.art && K.art[name]) || MINE[name];
    const tex = a ? await ctx.tex(`art/sea/${a.file}.webp`, { repeat: true }).catch(() => null) : null;
    return tex ? { tex, inv: new THREE.Vector3(1 / a.mean[0], 1 / a.mean[1], 1 / a.mean[2]), tile: tile || a.tile || (K.tile && K.tile[name]) || 4 } : null;
  };
  const painted = params.get('hbpaint') !== '0', sliver = params.get('hbsliver') === null ? 0.8 : Number(params.get('hbsliver'));
  /** The paint extension. o: ref (the colour whose paint takes the light unchanged), art (from painting()), amount (how
   *  much of the painting), show (how much of the paint is carried into the light), stir (metres: weed that hangs below
   *  1.7 m stirs by this much at its ends), dry (0..1: how much of the wash is kept OFF what faces up: the sea's light
   *  takes every low level face for a step awash and rules its draining threads straight across it, which is right
   *  for a reef and wrong for the deck of a buoy), lift (the most that paint paler than `ref` may raise what the thing
   *  shows: 1.6 for rock, whose salt and guano should tell; near 1 for a thing that must stay a silhouette), cast (a
   *  colour laid over everything the thing shows that is not the sea's own light: the night's slate over timber and
   *  iron, whose plum and rust read as warm brown beside this sea's blue), sat (how much of its own hue the thing
   *  keeps at rest: 1 all of it), deep (metres: below the troughs of the swell, 0.6 m under still water, all light on
   *  the thing dies over this depth: the rock's light takes every face near the waterline for a lit foot, under water
   *  too, and a reef seen through the surface then stands in the sea as a glowing slab with a ruled outline), runs
   *  ({ along: [x, z], amount, color }: the paint's fourth channel says how much pale run-off, guano and salt, a point
   *  takes (gate_crown.py, RUNS); here it is drawn as streaks a hand to a forearm wide that run straight down the
   *  face: paint lives on points, and a crown's points are a stride apart). */
  const paint = (o = {}) => ({
    ...(o.stir ? { vertexWorld: `{ float hbS = clamp(1.7 - wp.y, 0.0, 1.6); wp.xz += vec2(sin(uTime * 0.7 + wp.x * 1.3 + wp.z * 0.7), cos(uTime * 0.6 + wp.z * 1.1 - wp.x * 0.5)) * (${Number(o.stir).toFixed(4)} * hbS); }` } : {}),
    uniforms: {
      tHbTex: { value: o.art ? o.art.tex : white }, uHbInv: { value: o.art ? o.art.inv : new THREE.Vector3(1, 1, 1) },
      uHbTex: { value: new THREE.Vector4(o.art ? 1 / o.art.tile : 1, o.art ? (o.amount ?? 0.55) : 0, painted ? (o.show ?? K.show ?? 0.85) : 0, o.sliver ?? sliver) },
      uHbRef: { value: new THREE.Color(o.ref || C.basalt) }, uHbDry: { value: new THREE.Vector3(o.dry ?? 0, o.sat ?? 1, o.deep ?? 0) },
      uHbCast: { value: new THREE.Vector4(...new THREE.Color(o.cast || '#ffffff').toArray(), o.lift ?? 1.6) },
      uHbRuns: { value: new THREE.Vector3(o.runs ? o.runs.along[0] : 1, o.runs ? o.runs.along[1] : 0, o.runs ? (o.runs.amount ?? 0.7) : 0) },
      uHbRunsC: { value: new THREE.Color((o.runs && o.runs.color) || '#59627e') },
      uHbUnder: { value: o.under ?? 0 },
      tHbEnd: { value: o.ends && o.ends.art ? o.ends.art.tex : white }, uHbEndInv: { value: o.ends && o.ends.art ? o.ends.art.inv : new THREE.Vector3(1, 1, 1) },
      uHbEnd: { value: new THREE.Vector4(o.ends && o.ends.art ? 1 / (o.ends.tile || o.ends.art.tile) : 1, o.ends && o.ends.art ? (o.ends.amount ?? 0.9) : 0, o.ends ? (o.ends.steep ?? 0.85) : 0.5, o.ends ? (o.ends.rim ?? 0.5) : 0) },
    },
    fragmentPars: 'uniform sampler2D tHbTex, tHbEnd; uniform vec4 uHbTex, uHbCast, uHbEnd; uniform vec3 uHbInv, uHbRef, uHbDry, uHbRuns, uHbRunsC, uHbEndInv; uniform float uHbUnder; vec3 hbPaint;',
    albedo: /* glsl */`{
      vec3 hbT = tri(tHbTex, vWPos * uHbTex.x, N) * uHbInv;                                  // the painting, as a change about its own mean
      float hbAmt = uHbTex.y, hbExp = 0.5;
      if (uHbEnd.y > 0.0) {
        // (the broken END of a hanging column, a face that looks down, is not the weathered side of a pipe: it is rock broken
        // across, in facets and cracks, two or three to an end. Its own painting, laid from below, and carried into the light
        // more steeply than a side's: a facet that the painting turns from the light stays dark when the sea lights the roof)
        float hbDn = smoothstep(0.3, 0.72, -N.y);
        vec3 hbE = texture2D(tHbEnd, vWPos.xz * uHbEnd.x + vec2(0.37, 0.11)).rgb * uHbEndInv;
        hbT = mix(hbT, hbE, hbDn); hbAmt = mix(hbAmt, uHbEnd.y, hbDn); hbExp = mix(0.5, uHbEnd.z, hbDn);
      }
      albedo *= mix(vec3(1.0), mix(vec3(dot(hbT, vec3(0.25, 0.45, 0.3))), hbT, 0.35), hbAmt);
      if (uHbRuns.z > 0.0) {
        // pale runs: more and wider where the paint says more runs off; each a streak straight down the face, broken along its length
        float hbRs = dot(vWPos.xz, uHbRuns.xy), hbRa = vColor.a;
        float hbRn = 0.62 * seaNoise(vec2(hbRs * 2.7, vWPos.y * 0.17 + 3.0)) + 0.38 * seaNoise(vec2(hbRs * 8.3 + 11.0, vWPos.y * 0.45));
        float hbRc = 1.0 - 0.72 * hbRa;
        albedo = mix(albedo, uHbRunsC, uHbRuns.z * smoothstep(hbRc, hbRc + 0.13, hbRn) * smoothstep(0.02, 0.2, hbRa));
      }
      // (by its value, the square root; by its hue only a little: rust, bronze and weed must not stain the sea's light)
      const vec3 hbW = vec3(0.2126, 0.7152, 0.0722);
      float hbL = dot(albedo, hbW) / dot(uHbRef, hbW);
      vec3 hbHue = pow(clamp(albedo / (uHbRef * max(hbL, 1e-4)), 0.25, 4.0), vec3(0.25));
      hbPaint = mix(vec3(1.0), pow(clamp(hbL, 0.0, 12.0), hbExp) * hbHue * step(0.0002, albedo.r + albedo.g + albedo.b), uHbTex.z);
    }`,
    // (pale paint may stand out in the dark, but it must never draw an outline of light when the sea lights it. And a
    // face seen edge-on is a sliver a pixel or two wide: the sea's light takes it for a far thing and gives it the SUM
    // of its flecks, unbroken, which rules a line of light along every arris and down every column seen from below.
    // Here a sliver, as far as it is one by its angle and not by its distance, takes a fifth of the wash.)
    light: /* glsl */`{
      c *= min(hbPaint, vec3(uHbCast.w));
      c = mix(vec3(dot(c, vec3(0.2126, 0.7152, 0.0722))), c, uHbDry.y) * uHbCast.rgb; glow *= min(hbPaint, vec3(1.2));
      float hbW = length(fwidth(vWPos)), hbCos = clamp(abs(dot(N, V)), 0.0, 1.0);
      glow *= 1.0 - uHbTex.w * (smoothstep(0.025, 0.11, hbW) - smoothstep(0.025, 0.11, hbW * hbCos));
      glow *= 1.0 - uHbDry.x * smoothstep(0.55, 0.9, N.y);
      if (uHbDry.z > 0.0) { float hbUnder = smoothstep(-0.6 - uHbDry.z, -0.6, vWPos.y); c *= 0.12 + 0.88 * hbUnder; glow *= hbUnder; }
      // (under: nothing of the sea's light on the thing below where the water stands NOW. The rock's light starts its wash a metre under
      // the surface and rules its draining threads on down: seen through clear water, timber and stumps had lit feet and plumb lines of light under them)
      if (uHbUnder > 0.0) { float hbNow = vWPos.y - seaSwellN(vWPos.xz, 0.0) * (uSwell[0].w + uSwell[1].w + uSwell[2].w); glow *= mix(1.0, smoothstep(-0.2, -0.03, hbNow), uHbUnder); }
    }`,
  });
  /** Small things are left out of the water's mirror (it is drawn at half size here: nothing under a hand's breadth shows in it): a model's slot, by name. */
  const slotMeshes = (model, slot) => { const list = []; model.group.traverse((o) => { if (o.isMesh && o.userData.slot === slot) list.push(o); }); return list; };
  const directOnly = (model, slot) => { for (const o of slotMeshes(model, slot)) ctx.only(o, 'direct'); };
  /** And from further off than they can be seen they are not drawn at all (every object is drawn twice, three times if
   *  it is in the mirror, and with the whole sound in view the area is over its draw calls): { at, within, objs }. */
  const small = [], smallAt = (x, z, within, objs) => { if (objs.length) small.push({ x, z, within, objs, on: true }); };
  /** And a whole piece is in the water's mirror only from near enough for its reflection to be told from a smudge (the
   *  mirror is drawn at half size here): mirrorAt(x, z, within, model) AFTER its small parts have been given to the
   *  direct view, which they keep. */
  const mirrored = [], mirrorAt = (x, z, within, model) => {
    const objs = []; model.group.traverse((o) => { if (o.isMesh && (o.layers.mask & 1)) objs.push(o); });
    if (objs.length) mirrored.push({ x, z, within, objs, on: true });
  };
  /** Gouache options for a model in the sea's light: o = sea.extend's (rest, top, run, pale, uniform) and paint's (ref, art, amount, show, stir, dry). */
  const rock = (o = {}) => {
    const { ref, art, amount, show, stir, dry, lift, cast, sat, deep, runs, ends, under, sliver: sl, ...s } = o;
    return sea ? { brush: 0.6, extend: [sea.extend(s), paint({ ref, art, amount, show, stir, dry, lift, cast, sat, deep, runs, ends, under, sliver: sl })] } : { brush: 0.6 };
  };

  /** The sea's light for a thing that FLOATS. light.js measures every height from still water and anchors its draining
   *  threads in the world, which is right for rock; a buoy rides 1.4 m of swell and turns on its chain. So here the
   *  light it is handed is read from the thing's OWN waterline (lift: a uniform holding the water's height under it,
   *  kept in update), and the threads, which would be ruled down it and stand still while it turns under them, are
   *  left out. Done on a copy of the text light.js hands over: if that text changes these find nothing and the buoy
   *  simply takes the light as rock does (asked of the light in the log: `level` and `threads` as options). */
  const afloat = (ext, lift) => {
    if (!ext || typeof ext.light !== 'string') return ext;
    const has = (t) => ext.light.includes(t);
    if (!has('float seaY = vWPos.y,')) console.warn('sea/heroes_b: light.js no longer declares "float seaY = vWPos.y,": the bell buoy takes the sea\'s light as fixed rock does (see docs/build/sea/2-heroes.md, "Asked of the light")');
    const light = ext.light
      .replace('float seaY = vWPos.y,', 'float seaY = (vWPos.y - uHbLift) * 2.4,')      // (and a float is a small thing: the light at its waterline dies within a forearm, not within a storey)
      .replace('float seaRise = seaY - seaSwellN(vWPos.xz, 0.0) * seaAmp;', 'float seaRise = seaY;')      // (its own waterline again: it rides the water that light.js would subtract)
      .replace(/seaNear \+= \(uSeaAqua \* [\d.]+ \+ uSeaEmber \* [\d.]+\) \* seaDrain;/, '')
      .replace(' + 0.5 * seaLine * seaDash * seaTr * exp(-max(seaY, 0.0) / 1.5)', '')
      // (and under its own waterline it gives off nothing: light.js starts the wash a metre under the surface, which on
      // rock is seen only at a glance through the mirror; a float is looked DOWN on from a boat's length, and its whole
      // draught stood in the sea as a lit tank each time the swell lifted it)
      // (and the breath of the wash, a glow in flat steps that on rock dies within a storey, is a painted band round a
      // float a pace high: it keeps a fifth of it. What is left is what water running off iron is: broken marks at its waterline)
      .replace(/\(uSeaRim\.w \* [\d.]+ \* seaBreath\)/, '(uSeaRim.w * 0.1 * seaBreath)')
      // (seventh holder: and none of the wash's LARGE dabs, leaf-shaped marks up to half a metre long: on a cliff seen from the channel they
      // are a splash; on a float a pace high seen from a boat's length they were shards of glass standing round its waterline)
      .replace('float seaFl = 0.3 * smoothstep(seaCut + 0.1, seaCut + 0.28, seaFa.r) * seaFa.g + 0.7 *', 'float seaFl = 0.7 *')
      .replace('float seaFlF = 0.3 * smoothstep(seaCutF + 0.1, seaCutF + 0.28, seaFa.r) * seaFa.g + 0.7 *', 'float seaFlF = 0.7 *')
      .replace('glow += seaNear;', 'glow += seaNear * smoothstep(-0.16, 0.0, vWPos.y - uHbLift);')
      .replace('c = seaLoc + seaSky + albedo * lamps + seaFar;', 'c = seaLoc + seaSky + albedo * lamps + seaFar * (0.12 + 0.88 * smoothstep(-0.3, 0.0, vWPos.y - uHbLift));');
    if (!has('float seaFl = 0.3 * smoothstep(seaCut + 0.1, seaCut + 0.28, seaFa.r) * seaFa.g + 0.7 *')) console.warn('sea/heroes_b: light.js no longer lays its large dabs as "float seaFl = 0.3 * smoothstep(seaCut + 0.1, ...": the bell buoy takes them again');
    if (!has('glow += seaNear;') || !has('c = seaLoc + seaSky + albedo * lamps + seaFar;')) console.warn('sea/heroes_b: light.js no longer ends its light with "c = seaLoc + ... + seaFar; glow += seaNear;": the bell buoy glows under its own waterline again');
    return { ...ext, light, uniforms: { ...ext.uniforms, uHbLift: lift }, fragmentPars: (ext.fragmentPars || '') + '\nuniform float uHbLift;' };
  };


  /** The sea's light for a thing that stands CLEAR of the sea (the rowing boat, hauled out on the slip): light.js
   *  counts every height from still water, so a thing a metre up is taken for the foot of a rock and covered with the
   *  flecks of the breaking wave and of the rain. Read as if it stood `m` metres higher it keeps the lit sea's soft
   *  fill and loses the flecks. Done on a copy of the text light.js hands over, like afloat(). */
  const raised = (ext, m) => (!ext || typeof ext.light !== 'string') ? ext
    : { ...ext, light: ext.light.replace('float seaY = vWPos.y,', `float seaY = vWPos.y + ${Number(m).toFixed(2)},`).replace(/seaNear \+= \(uSeaAqua \* [\d.]+ \+ uSeaEmber \* [\d.]+\) \* seaDrain;/, '') };

  /** The rock's light lays, over the marks of each wash, a BREATH of it on the rock itself: ember in flat steps that dies
   *  within a metre or two. On a cliff that is a glow at its foot; on a thing a few metres high made of timbers a hand
   *  wide it is the thing's whole lower half filled flat to a ruled line: a pane of teal glass (the wreck under every
   *  crest, as the fourth and fifth holders found her). thin(ext, k) keeps k of it. On a copy of light.js's text, like
   *  afloat(): if the line goes, nothing changes and a warning is written. */
  const thin = (ext, k) => {
    if (!ext || typeof ext.light !== 'string') return ext;
    const re = /\(uSeaRim\.w \* [\d.]+ \* seaBreath\)/;
    if (!re.test(ext.light)) { console.warn('sea/heroes_b: light.js no longer lays its breath as "(uSeaRim.w * n * seaBreath)": the wreck takes all of it again (docs/build/sea/2-heroes.md, "Asked of the light")'); return ext; }
    return { ...ext, light: ext.light.replace(re, `(uSeaRim.w * ${Number(k).toFixed(3)} * seaBreath)`) };
  };

  // ---------------------------------------------------------------------------------------------- the gate's crown and vault
  let faces = null, roof = null;
  const swaps = [];                                                // { x, z, within, near, far }: a piece and its far copy
  // Two files in the gate's own frame (x = d, front toward the oncoming boat, z up): placed on the centre line at s 96
  // exactly as the stand-in slab was. The crown takes the plain rock's light; the vault a light of its own (below).
  // The crown is an entablature: bundles of thin columns (slot `columns`: the columns' own painting) over rough rock
  // that shows only in the clefts' slots (slot `paint`: the painting of rough uncolumned basalt). Its two faces are
  // the parts `crown_front` and `crown_back`: from the water only one of them can ever be seen (the wall between
  // them is 12 to 20 m thick and the eye is 1.1 m up), so only the one on the eye's side of the gate is drawn. Its
  // paint's fourth channel is the pale run-off under its ledges and perches (the paint extension's `runs`).
  if (want('crown')) {
    const a = path.at(P.gate.s), at = { position: [a.x, 0, a.z], turn: Math.atan2(-a.rz, a.rx) };
    const [rough, side, shaft, broken] = await Promise.all([painting('rough'), painting('side'), painting('face', K.tile && K.tile.side), painting('rough', 1)]);
    const HC = (P.heroesB && P.heroesB.crown) || {}, runs = { along: [a.rx, a.rz], amount: HC.runs ?? 0.7 };
    out.crown = await kit.model('models/sea/gate_crown.glb', { ...at, ...rock({ art: rough, amount: 0.6, runs, rest: HC.rest, pale: HC.pale }), materials: { columns: rock({ art: side, runs, rest: HC.rest, pale: HC.pale }) } });
    faces = { front: out.crown.parts.crown_front, back: out.crown.parts.crown_back, x: a.x, z: a.z, tx: a.tx, tz: a.tz, side: 0 };
    if (!faces.front || !faces.back) faces = null;
    // THE VAULT'S OWN LIGHT. The rock's wash (light.js) is made for faces that stand in the sea: carried to a roof
    // 9 to 22 m up it is a flat sheet with ruled threads down every hanging column. So the vault takes none of it
    // (its `run` is next to nothing) and is lit here, in three parts:
    //   at rest   the night comes in at the two mouths: what looks toward the nearer mouth takes a little of the sky's
    //             slate, so that every hanging end has a paler face and a darker one and none of the roof is black;
    //   the surge each crest that passes under the roof while the boat is in the gate (uSeaL.z, set.js) throws light up
    //             it: on what the water can see (the paint's fourth channel, `reach`: the tips of the hanging ends, not
    //             the recesses between them), most on what faces down. It is laid as marks of paint large enough to be
    //             told apart from the boat (dabs and commas a hand to a forearm long), each coming and going at its own
    //             level, over a low stain in flat steps; aqua while the crest is on it, ember as it drains;
    //   drains    a few threads of old light that creep DOWN the hanging ends to their tips after the crest, in dashes.
    // shared.heroesB.vaultLight is this extension (and .vaultRock the Vector4 that keeps the rock's wash off): the
    // kit's own hanging ends, which hang among these, can wear the same two.
    const G = P.gate, vaultU = { value: new THREE.Vector4(0.38, 0.55, 0.02, 1) };
    const HV = P.heroesB && P.heroesB.vault || {};
    const vaultLight = {
      uniforms: {
        uHbGate: { value: new THREE.Vector4(a.x, a.z, a.tx, a.tz) },                       // the gate's centre on the route; the way down the route
        uHbArch: { value: new THREE.Vector4(340 / 24, G.open + 340 / 24, G.thickAt(0) / 2, HV.breath ?? 0.3) },      // the plan's pointed arch (its two numbers), half the passage's length; how much of a crest's light the roof takes when the boat is not under it
        uHbVault: { value: new THREE.Vector4(HV.mouth ?? 0.42, HV.wash ?? 1.0, HV.stain ?? 1.0, HV.threads ?? 0.4) },      // at rest; the marks; the tones under them; the threads that drain
        uHbVaultB: { value: new THREE.Vector3(HV.sum ?? 1.4, HV.lit ?? 0.4, HV.side ?? 0.8) },      // how much stronger the tones stand where marks cannot be told apart; how much the roof holds of the sea behind the rain front; how much the side of a pipe takes near its tip
        uHbVaultC: { value: new THREE.Color(HV.sky || (P.rock && P.rock.sky) || '#34406A') },
        uHbVaultD: { value: new THREE.Vector3(HV.wet ?? 2.4, HV.age ?? 0.7, 0) },               // how readily a wet end gives back the marks of light on the water it looks at; how far the light cools to the dying violet as it drains
        // (sixth holder) the broken ends: the painting of rough fractured rock, read from below at the scale the vault's own paint lays it
        // (four or five facets to an end), and what the light makes of it. x: repeats a metre; y: how steeply a facet's turn carries into
        // the light (0 a flat fill: a cut gem); z: the sheen on the facets the break left turned to the water; w: the same facets at rest
        tHbFrac: { value: broken ? broken.tex : white }, uHbFracInv: { value: broken ? broken.inv : new THREE.Vector3(1, 1, 1) },
        uHbFrac: { value: new THREE.Vector4(1 / (HV.endTile ?? 1.5), broken && params.get('hbends') !== '0' ? (HV.facet ?? 0.8) : 0, HV.sheen ?? 0.35, HV.facetRest ?? 0.15) },
        // the gleam: how high the swell must stand (from .. to, -1..1 of its greatest) at the place on the water that the eye's ray, turned back by the wet surface, meets; how much it differs from one column to the next; how much of it is aqua while the crest is new (the rest ember)
        uHbSheen: { value: new THREE.Vector4(HV.sheenFrom ?? 0.55, HV.sheenTo ?? 0.9, HV.sheenVary ?? 0.9, HV.sheenAqua ?? 0.6) },
        // (seventh holder) the ends are broken rock in the MODEL now, and are lit facet by facet. x: how much of each triangle's own
        // normal the roof's light reads (0: the smoothed normal, as before); y: how much more a facet takes that leans toward where
        // the crest is, and how much less one that leans away (the light crosses each end as the crest passes under it)
        uHbFacetN: { value: new THREE.Vector2(HV.facetN ?? 0, HV.facetLean ?? 1.4) },
      },
      fragmentPars: 'uniform vec4 uHbGate, uHbArch, uHbVault, uHbFrac, uHbSheen; uniform vec3 uHbVaultC, uHbVaultB, uHbVaultD, uHbFracInv; uniform vec2 uHbFacetN; uniform sampler2D tHbFrac;',
      light: /* glsl */`{
        float vReach = vColor.a;
        // (the face's own normal, from the surface itself: a break is planes, and each plane takes the light whole)
        vec3 vFN = cross(dFdx(vWPos), dFdy(vWPos));
        float vFNl = length(vFN);
        vFN = vFNl > 1e-12 ? vFN / vFNl : N;
        if (dot(vFN, N) < 0.0) vFN = -vFN;
        vec3 vNf = normalize(mix(N, vFN, uHbFacetN.x));
        float vDown = clamp(-vNf.y, 0.0, 1.0);
        vec2 vRel = vWPos.xz - uHbGate.xy;
        float vY = dot(vRel, uHbGate.zw), vX = dot(vRel, vec2(-uHbGate.w, uHbGate.z));      // metres down the route from the centre plane; metres to the right of the line
        // ---- at rest: the two mouths
        float vToFront = max(dot(vNf.xz, -uHbGate.zw), 0.0), vToBack = max(dot(vNf.xz, uHbGate.zw), 0.0);
        float vHalf = uHbArch.z;
        float vMouth = vToFront * mix(1.0, 0.4, smoothstep(-vHalf, vHalf, vY)) + vToBack * mix(0.4, 1.0, smoothstep(-vHalf, vHalf, vY));
        vMouth = vMouth * (0.4 + 0.6 * vReach) + 0.34 * vDown * vReach;
        // (the broken end: its facets, about 1, paler where the break left one turned to the light. The same picture at the same
        // place as the vault's own paint lays it, so paint and light agree; the kit's hanging ends, which wear this light, get it too)
        float vEnd = smoothstep(0.3, 0.72, vDown) * step(0.001, uHbFrac.y);
        // (read twice, the second turned and a little smaller: read once, every facet on the roof leaned the painting's one way,
        // and under a crest the near ends wore a leopard's coat)
        vec2 vFu = vWPos.xz * uHbFrac.x;
        vec3 vFr3 = mix(texture2D(tHbFrac, vFu + vec2(0.37, 0.11)).rgb, texture2D(tHbFrac, mat2(0.39, 0.92, -0.92, 0.39) * vFu * 1.31 + vec2(0.71, 0.53)).rgb, 0.45);
        float vFacet = mix(1.0, dot(vFr3 * uHbFracInv, vec3(0.25, 0.45, 0.3)), vEnd);
        float vFacetK = clamp(pow(max(vFacet, 0.01), uHbFrac.y), 0.45, 1.7);
        c += uHbVaultC * (uHbVault.x * seaSteps(vMouth * mix(1.0, clamp(vFacet, 0.45, 1.7), uHbFrac.w * vEnd), 4.0, 0.08 * stroke)) * min(hbPaint, vec3(1.5));
        // ---- the water's light on the roof (the fifth holder's rework; the fourth's flat tones are kept, their colour
        // and what carries them are not: the lowest tone was the DYING violet, and most of a roof stands at its lowest
        // tone, so the roof was amethyst with teal camouflage; nothing stood on the sides of the pipes and nothing was wet).
        //   how much   what the water under the gate can see (reach). An END takes it by how far it faces down; the SIDE of
        //              a pipe takes it near its tip only (it dies within two or three metres up the shaft), and from where
        //              the crest IS: the faces turned toward the coming crest light first, and as it passes under them the
        //              light crosses to the faces on its far side. That crossing is what the rider sees travel over the roof;
        //   tones      flat steps with dry edges, one column taking more than its neighbour: deep ember, ember, and on the
        //              lowest tips while the crest is on them ember with a little aqua. Never aqua as a fill (a cut gem) and
        //              never violet as a standing colour: violet is what the light turns to as it drains, and then it is gone;
        //   wet        every end that faces down is a dim mirror of the water it looks at: the marks of light ON THE WATER
        //              are read where the eye's ray, turned back by the wet face, meets the sea. So each end holds a few
        //              dabs of its own patch of the crest, no two ends the same patch (each is tilted its own way), and
        //              they slide over the ends as the crest travels and as the boat moves: wet rock, not painted rock;
        //   far off    the marks cannot be told apart and the tones are their sum: they stand a little stronger there,
        //              so that the opening is drawn by its own light from the reveal and from the sound.
        vec2 vSg = seaSurge(vWPos.xz) * uSeaL.y;
        float vNew = vSg.x / max(vSg.y, 0.05);
        float vIn = clamp(uSeaL.z * 1.25, 0.0, 1.0);                                            // the boat is under the roof and a crest is in the gate: the flood
        float vPx = length(fwidth(vWPos)), vFarK = smoothstep(0.03, 0.1, vPx);                  // 0 where single marks can be told apart .. 1 where they cannot
        float vAx = abs(vX) + uHbArch.x, vUp = vWPos.y - sqrt(max(uHbArch.y * uHbArch.y - vAx * vAx, 0.0));      // metres above the plan's arch
        float vLow = mix(1.0, 0.5, smoothstep(9.0, 22.0, vWPos.y));                             // the lowest ends are nearest the water
        vec2 vD = normalize(uSwell[0].xy + vec2(1e-5, 0.0));                                    // the way the swell travels
        float vSl = seaSwellN(vWPos.xz + vD * 3.0, 0.0) - seaSwellN(vWPos.xz - vD * 3.0, 0.0);  // above 0: the crest lies down-swell of here (it has passed); below: it is still coming
        float vNl = length(N.xz);
        float vTurn = 0.5 + 0.5 * dot(N.xz / max(vNl, 1e-3), vD) * clamp(vSl * 2.4, -1.0, 1.0); // how far this side is turned to where the crest is (0.5 with the crest right under it)
        // (the model's reach on a side already dies up the shaft from the pipe's own tip: gate_crown.py, tip_light)
        float vSeeSide = uHbVaultB.z * pow(clamp(vReach * 2.0, 0.0, 1.0), 1.3) * (1.0 - smoothstep(1.0, 4.0, vUp)) * (0.25 + 1.0 * vTurn * vTurn);
        // (an END's facet: one that leans toward where the crest is takes more of it, one that leans away less; a steep facet less)
        float vLean = dot(vNf.xz, vD) * clamp(vSl * 2.4, -1.0, 1.0);
        float vFaceK = clamp(1.0 + uHbFacetN.y * vLean - 0.7 * (1.0 - smoothstep(0.4, 0.95, vDown)), 0.2, 1.8);
        float vSee = mix(vSeeSide, pow(vReach, 1.1) * vFaceK, smoothstep(0.25, 0.7, vDown)) * vLow;
        // (with the boat under it, every crest in the gate; from outside, a breath of every crest that passes under it and
        // nothing between two crests; behind the rain front the sea at both mouths burns all the time and the roof holds some of it)
        float vStand = uHbVaultB.y * seaFront(uHbGate.xy) * uSeaL.x;
        float vPulse = max(vIn * (0.25 + 0.75 * vSg.y), uHbArch.w * uSeaL.y * vSg.y);
        float vGate = max(vPulse, vStand * (0.5 + 0.5 * vSg.y));
        // (as it drains it cools to the dying violet and goes out; the standing light behind the rain front does not age)
        float vOld = (1.0 - vNew) * (1.0 - clamp(vStand * 0.5 / max(vGate, 0.02), 0.0, 1.0));
        float vA = pow(vGate, 0.8) * vSee;
        float vPatch = smoothstep(0.25, 0.7, seaNoise(vWPos.xz * 1.15 + 7.0));                  // one column takes more than its neighbour
        // (and it does not go out evenly: as it drains it breaks into islands a few columns across, which shrink)
        float vIsle = smoothstep(0.3, 0.62, seaNoise(vWPos.xz * 0.42 + vec2(11.0, uTime * 0.07)) + 0.25 * (vSg.y - 0.5));
        // (sixth holder: and within one end its facets take it unevenly: lit as one flat plate, every end was a cut gem)
        // (and down the side of a pipe it lies in streaks a hand wide, as wet runs down a flute: a side lit in level bands was a pane of glass)
        float vAlong = mix(vWPos.x, vWPos.z, step(abs(N.z), abs(N.x)));
        float vStreak = 0.62 + 0.8 * (0.65 * seaNoise(vec2(vAlong * 5.3 + 3.0, vWPos.y * 0.55)) + 0.35 * seaNoise(vec2(vAlong * 13.0, vWPos.y * 1.3 + 7.0)));
        float vT = seaSteps(clamp(vA * (0.6 + 0.7 * vPatch) * mix(1.0, vIsle, 0.85 * vOld) * mix(mix(1.0, vStreak, step(0.001, uHbFrac.y)), vFacetK, vEnd), 0.0, 1.0), 4.0, 0.1 * stroke);
        vec3 vTone = mix(uSeaEmber * 0.95, uSeaEmber * 1.4, smoothstep(0.3, 0.55, vT));
        vTone = mix(vTone, uSeaEmber * 1.55 + uSeaAqua * 0.26, smoothstep(0.6, 1.0, vT) * vNew);
        vTone = mix(vTone, uSeaDying * 1.15, uHbVaultD.y * vOld);
        // ---- wet: the ends as dim mirrors of the lit water
        vec3 vR = reflect(-V, vNf);
        float vRy = max(-vR.y, 0.07);
        vec2 vP = vWPos.xz + vR.xz * min(vWPos.y / vRy, 45.0);                                  // where on the sea this face looks
        vec2 vSgP = seaSurge(vP) * uSeaL.y;
        float vNewP = vSgP.x / max(vSgP.y, 0.05);
        float vGl = max(max(vIn * (0.06 + 0.94 * vSgP.y), uHbArch.w * uSeaL.y * vSgP.y), vStand * (0.5 + 0.5 * vSgP.y));
        float vFres = 0.6 + 0.4 * pow(1.0 - clamp(dot(vNf, V), 0.0, 1.0), 2.0);                 // a wet face gives back more the more it is seen aslant
        float vWetA = vGl * vFres * smoothstep(0.2, 0.6, vDown) * smoothstep(0.3, 0.8, vReach) * step(vR.y, -0.07) * mix(1.0, vLow, 0.5);
        // (sixth holder: the fifth read the marks of light on the water in each end as in a mirror. An end mirrors a patch of sea
        // twice its own width, so it held one comma of the mask, enlarged and cut off by its own edges: shards of foil, slivers of
        // neon along the arrises. What a wet break gives back is a SHEEN: soft, on the facets it left turned to the water, more
        // on one end than the next, in flat steps with dry edges; it comes and goes with the crest the end looks at, and it
        // crosses the roof with it)
        float vShN = 0.6 * seaNoise(vWPos.xz * 2.3 + 5.0) + 0.4 * seaNoise(vWPos.xz * 6.1 + 1.7);
        // (seventh holder: the ends are broken rock in the model now: bowls and planes. A wet bowl turns the light of the crest's TOP
        // toward the eye along a band across itself, and a wet plane turns it whole, for the second in which the crest's top lies
        // where the plane looks: so the gleam is read from the form, where the eye's ray turned back by the surface meets the top of
        // a crest, and it travels over the roof with the crest, one end after another. No painting says where it lies.)
        float vTop = smoothstep(uHbSheen.x, uHbSheen.y, seaSwellN(vP, 0.0));
        float vFk2 = 1.0 + vTop;
        float vShF = vTop * (0.55 + 0.45 * vShN);
        float vSheen = seaSteps(clamp(vWetA * uHbVaultD.x * 0.42 * (1.0 - uHbSheen.z * (1.0 - vPatch)), 0.0, 1.0) * vShF, 3.0, 0.1 * stroke);
        vec3 vCol = mix(uSeaEmber * 2.2, mix(uSeaEmber * 2.2, uSeaAqua * 1.05, uHbSheen.w), vNewP);
        // (core only in the palest facets of the lowest ends, only while the crest is on the water they look at)
        vec3 vMarks = vCol * (uHbFrac.z * vSheen) + uSeaCore * (0.5 * smoothstep(0.7, 1.0, vSgP.x) * vWetA * vWetA * smoothstep(0.75, 1.0, vSheen) * smoothstep(1.5, 2.1, vFk2));
        vec3 vWash = vTone * (uHbVault.z * vT * (1.0 + uHbVaultB.x * vFarK)) + vMarks * (uHbVault.y * (1.0 - 0.85 * vFarK));
        // ---- what drains: threads creeping down the sides of the hanging ends, in dashes, after the crest
        float vAl = mix(vWPos.x, vWPos.z, step(abs(N.z), abs(N.x))), vTc = vAl / 0.55, vTi = floor(vTc), vH = seaHash1(vec2(vTi, 5.3)), vH2 = seaHash1(vec2(vTi, 1.9));
        float vTw = max(0.012 + 0.012 * vH2, 1.1 * vPx);
        float vLine = (1.0 - smoothstep(0.4 * vTw, vTw, abs(fract(vTc) - 0.2 - 0.6 * vH) * 0.55)) * min(1.0, 0.03 / vTw);
        float vDash = smoothstep(0.55, 0.8, seaNoise(vec2(vTi * 7.3, vWPos.y * 1.1 + uTime * (0.5 + 0.8 * vH2))));
        float vDrain = vLine * vDash * (1.0 - vDown) * (1.0 - abs(N.y)) * min(vReach, 0.62) * (1.0 - smoothstep(0.4, 2.8, vUp)) * step(0.72, vH2) * max(vIn, uHbArch.w * uSeaL.y) * max(vSg.y - 0.75 * vSg.x, 0.0);
        vWash += (uSeaAqua * 0.5 + uSeaEmber * 1.6) * (uHbVault.w * vDrain * (1.0 - vFarK));
        // (no single mark above white: one that bloomed was a lamp hung in the roof. And nothing from a face with no
        // normal: the slivers between two ends that broke at one level have none, and where their light was once
        // nothing it came out of the clamp as white dots along every such joint)
        if (vWash.r + vWash.g + vWash.b >= 0.0 && vDown >= 0.0) glow += min(vWash, vec3(1.05)) * min(hbPaint, vec3(1.2));
      }`,
    };
    const own = params.get('hbvault') !== '0' && sea;
    const vaultWear = { ...at, brush: 0.6, extend: sea ? [sea.extend({ uniform: own ? vaultU : sea.gateInner }), paint({ art: shaft || side, ends: params.get('hbends') === '0' ? null : { art: broken, tile: HV.endTile ?? 1.5, amount: HV.endPaint ?? 0.55, steep: HV.endSteep ?? 0.6 } }), ...(own ? [vaultLight] : [])] : [] };
    out.vault = await kit.model(`models/sea/gate_vault${nx('vault')}.glb`, vaultWear);
    out.vaultLight = vaultLight; out.vaultRock = vaultU;
    // (behind the rain front light.js lifts every rock from night to dark slate by the cloud the sea lights, most on what
    // faces down: a roof is all faces that look down, and stood a storey of even blue over the burning sea. update()
    // takes most of that off the roof as the front passes the gate: the roof stays the dark frame of a lit sea, and
    // what it shows of the sea's light is on its tips. The kit's hanging ends wear the same number.)
    if (own) roof = { u: vaultU, x: a.x, z: a.z, pale: vaultU.value.w, dark: HV.dark ?? 0.6 };
    mirrorAt(a.x, a.z, HV.mirror ?? 75, out.vault);
    // (the far copy: the same columns ending at the same heights with plain ends, a third of the triangles; from beyond
    // 110 m, where no end can be told from its neighbour, it stands in for the roof. Never in the mirror. The named
    // points stay the near model's.)
    const far = params.get('hbfar') === '0' ? null : await kit.model(`models/sea/gate_vault_far${nx('vault')}.glb`, vaultWear).catch(() => null);
    if (far) { ctx.only(far.group, 'direct'); far.group.visible = false; swaps.push({ x: a.x, z: a.z, within: HV.far ?? 110, near: out.vault.group, far: far.group, on: true }); }
    mirrorAt(a.x, a.z, HC.mirror ?? 110, out.crown);            // (and the crown's reflection from 110 m off is a dark smudge behind the swell: the wall's own columns make it)
    removeStandIn(ctx, 'gate_crown');
  }

  let chain = null;
  // ---------------------------------------------------------------------------------------------- the wreck
  // The frames of a wooden vessel on the reef at the left edge of the sound: keel from (s 160, d -36) to (s 178, d -47).
  // The model's +X runs from her stern to her stem and its front (her lee, starboard side) is toward the channel.
  // Her reef, its colliders and its surf are the layout's (heroes.js, kit.js); the column tops under her are her own.
  if (want('wreck')) {
    const Wk = P.wreck, a = kit.at(Wk.stern[0], Wk.stern[1]), b = kit.at(Wk.stem[0], Wk.stem[1]), WR = (P.heroesB && P.heroesB.wreck) || {};
    const [oak, tops] = await Promise.all([painting('oak'), painting('tops')]);
    // THE BREATH THROUGH HER RIBS (the page: every swell "pours between the frames, lighting the inside of the hull ...
    // like a breath through ribs"). The water inside her is lit by each crest that sheets through, and its light stands
    // on what looks INTO the hull: the inner faces of her frames and of her planking, from the water up a metre and
    // dying. It follows the crest (seaSurge at each place), so it runs through her from end to end with every swell,
    // seen from outside between the near frames, on the far ones. Marks of paint over a stain in flat steps; aqua
    // while the crest is in her, ember as it drains. Her outer faces and her heads stay dark.
    const breath = {
      uniforms: { uHbKeel: { value: new THREE.Vector4(a.x, a.z, b.x, b.z) }, uHbBreath: { value: Number(params.get('hbbreath') ?? WR.breath ?? 1.0) } },
      fragmentPars: 'uniform vec4 uHbKeel; uniform float uHbBreath;',
      light: /* glsl */`{
        vec2 kD = uHbKeel.zw - uHbKeel.xy;
        float kT = clamp(dot(vWPos.xz - uHbKeel.xy, kD) / dot(kD, kD), 0.0, 1.0);
        vec2 kTo = uHbKeel.xy + kD * kT - vWPos.xz; float kL = length(kTo);
        float kIn = smoothstep(0.15, 0.7, dot(N.xz, kTo / max(kL, 0.01))) * smoothstep(0.25, 0.9, kL);      // it looks toward her keel line (and is not the keelson itself)
        float kAmp = uSwell[0].w + uSwell[1].w + uSwell[2].w;
        float kRise = vWPos.y - seaSwellN(vWPos.xz, 0.0) * kAmp;                                            // metres above the water as it stands here now
        vec2 kSg = seaSurge(vWPos.xz) * uSeaL.y;
        // (marks, and only marks: dense where the water stands against the wood, single a forearm up, none above a metre.
        // The flat stain that lay under them filled the inside of her planking to a ruled line: a pane of glass. What is
        // left between the marks is her wood; far off, where marks cannot be told apart, a thin broken line at her waterline)
        float kB = kIn * exp(-max(kRise, 0.0) / 0.42) * smoothstep(-0.35, 0.05, kRise) * kSg.y;
        vec3 kM = tri(tSeaFleck, vWPos * 0.31 + 0.41, N), kS = tri(tSeaStip, vWPos * 0.9 + 0.23, N);
        float kCut = 1.03 - 0.86 * kB;
        float kFl = 0.9 * kM.g * smoothstep(kCut + 0.04, kCut + 0.2, kM.r / max(kM.g, 0.004)) + 0.7 * kS.g * smoothstep(kCut, kCut + 0.14, kS.r / max(kS.g, 0.004));
        float kPx = length(fwidth(vWPos)), kFar = smoothstep(0.03, 0.1, kPx);
        float kLine = (1.0 - smoothstep(0.08, 0.3, kRise)) * smoothstep(-0.3, 0.0, kRise) * kIn * kSg.y * smoothstep(0.35, 0.7, seaNoise(vWPos.xz * 1.4 + vec2(uTime * 0.3, 3.0)));
        vec3 kCol = mix(uSeaEmber * 2.4, uSeaAqua * 1.2, kSg.x / max(kSg.y, 0.05));
        glow += kCol * (mix(kFl, 0.8 * kLine, kFar) * uHbBreath);
      }`,
    };
    const timber = rock({ ref: C.timber, rest: WR.rest ?? 0.42, top: 1, run: WR.run ?? 0.16, pale: 0.25, art: oak, amount: 0.4, lift: WR.lift ?? 1.15, cast: WR.cast || '#c3cbee', deep: WR.deep ?? 1.0, under: 1 });
    // (seventh holder: SHE IS A DARK THING STANDING IN LIT WATER. The rock's wash is made of marks that are dense for the first
    // half metre over the water: on a cliff that is its lit foot; on timbers a hand wide and planks a forearm deep it covered her
    // whole lower hull, and from the sound every crest laid flat pale blocks between her ribs and took the feet of her frames
    // (sea_h7_w04.png). So her wood keeps `wash` of the sea's own marks, and they climb her a hand: what is bright at her foot
    // is the water, the surf round her reef and the spray, and she stands black in it to her waterline.)
    const washKeep = { light: `glow *= ${Number(WR.wash ?? 0.3).toFixed(3)};` };
    if (timber.extend) { timber.extend[0] = thin(timber.extend[0], WR.glaze ?? 0.08); timber.extend.splice(1, 0, washKeep); timber.extend.push(breath); }
    out.wreck = await kit.model(`models/sea/wreck${nx('wreck')}.glb`, {
      position: [(a.x + b.x) / 2, 0, (a.z + b.z) / 2], turn: Math.atan2(-(b.z - a.z), b.x - a.x),
      // (her timbers stand at most 4 m out of the water: all of her is within the height at which rock takes the lit
      // sea's glow, and lit like rock she is a pale shape, not a wreck. So her wood takes a quarter of it and the wash
      // of each crest climbs her less than a metre: her frames stay black against the fire, and the light is in the
      // water that sheets through her and on the rock she lies on)
      ...timber,
      // (her weed: under the rider's lantern from the reef's edge it was grass green, the most saturated thing in a picture
      // of slate and indigo: it keeps a third of its hue under the night's cast, and takes the flat breath no more than her wood does)
      // (her bed: column tops awash. Level wet tops took the sky's slate whole and stood in a trough as pale paving, the palest
      // things in the picture: they take under half of it now, and stand as dark wet rock with a paler rim where they break)
      materials: { rock: rock({ art: tops, amount: 0.5, deep: WR.deep ?? 1.0, pale: WR.bedPale ?? 0.4, under: 1 }), wrack: (() => { const r = rock({ ref: C.kelp, rest: 0.5, top: 1, run: WR.run ?? 0.16, pale: 0.25, stir: 0.035, lift: 1.15, deep: WR.deep ?? 1.0, sat: WR.weed ?? 0.35, cast: WR.cast || '#c3cbee', under: 1 }); if (r.extend) { r.extend[0] = thin(r.extend[0], WR.glaze ?? 0.08); r.extend.splice(1, 0, washKeep); } return r; })() },
    });
    directOnly(out.wreck, 'wrack'); directOnly(out.wreck, 'rock');      // (her bed lies under the water: nothing of it is mirrored)
    smallAt((a.x + b.x) / 2, (a.z + b.z) / 2, 60, slotMeshes(out.wreck, 'rock'));      // (and from beyond 60 m none of it is seen through the surface)
    mirrorAt((a.x + b.x) / 2, (a.z + b.z) / 2, 70, out.wreck);
    smallAt((a.x + b.x) / 2, (a.z + b.z) / 2, 90, slotMeshes(out.wreck, 'wrack'));
    // (and all of her only from where she can be seen at all: from up-route of the gate she is behind its wall, and
    // from beyond 130 m the air has her)
    smallAt((a.x + b.x) / 2, (a.z + b.z) / 2, 130, [out.wreck.group]);
    // (the length of chain that hangs from her broken stem into the sea is a part of its own, `chain_hang`: each swell
    // that passes drags its lower end and it swings a few degrees about the place where it leaves the timber)
    const hang = out.wreck.parts.chain_hang;
    if (hang) { const w = out.wreck.point('chain_water'); chain = { part: hang, base: hang.quaternion.clone(), x: w.x, z: w.z, h: 0, a: 0, b: 0, va: 0, vb: 0, first: true }; smallAt(w.x, w.z, 70, [hang]); ctx.only(hang, 'direct'); }
    removeStandIn(ctx, 'wreck (frames');
    // (the layout's flat plate for her reef went with her stand-in: the model brings the column tops she lies on, and
    // the kit's reef plates lie round them. The reef's colliders and surf are untouched.)
    removeStandIn(ctx, 'reef x4 (wreck reef)');
  }

  // ---------------------------------------------------------------------------------------------- the bell buoy
  // A riveted iron float with a cage, a bell and four hammers, moored at (s 138, d -29). It rides the swell
  // (heightAt), leans with the water's face to at most 14 degrees and turns 20 degrees either way on its chain in
  // 40 s. The hammers are not animated: each is a pendulum hung from the cage, so that as the buoy rolls the ones on
  // the rising side fall against the bell's lip and strike, and the ones on the dipping side swing out to the stop
  // hoop. Every strike is told to whoever asked (shared.heroesB.buoy.onStrike(fn)): the sound and the ring of light
  // are the cast's and staging's. Its collider and its surf are the layout's (heroes.js).
  let buoy = null;
  if (want('buoy')) {
    const B = P.buoy, at = kit.at(B.at[0], B.at[1]);
    // (like the wreck: a low dark thing against the lit sea, lit only where the water washes it; its deck stays dry of
    // light. Its plum rust and green bronze read as brick red and bottle green beside this sea's blue: the night's cast is laid over them)
    const BU = (P.heroesB && P.heroesB.buoy) || {};
    const iron = { ref: C.iron, rest: BU.rest ?? 0.5, top: 1, run: 0.6, pale: 0.35, dry: 0.92, lift: 1.15, cast: BU.cast || '#b2bdea', sat: BU.sat ?? 0.38, sliver: 1 };      // (sliver 1: where the float's side turns away from the eye it takes none of the wash: that edge stood as a ruled pale bar)
    const lift = { value: 0 }, ride = (o) => { const r = rock(o); if (r.extend) r.extend = [afloat(r.extend[0], lift), ...r.extend.slice(1)]; return r; };
    const m = await kit.model(`models/sea/bellbuoy${nx('buoy')}.glb`, { position: [at.x, 0, at.z], live: true, ...ride(iron), materials: { growth: ride({ ...iron, ref: C.kelp }) } });
    removeStandIn(ctx, 'bellbuoy');
    const hammers = [0, 1, 2, 3].map((k) => m.parts['hammer_' + k]).filter(Boolean), bell = m.parts.bell;
    directOnly(m, 'growth'); for (const h of hammers) ctx.only(h, 'direct');
    smallAt(at.x, at.z, 80, hammers); smallAt(at.x, at.z, 110, slotMeshes(m, 'growth'));       // (a hammer is a pixel wide at 80 m)
    smallAt(at.x, at.z, 150, [m.group]);
    mirrorAt(at.x, at.z, 45, m);
    const listeners = [];
    buoy = {
      model: m, x: at.x, z: at.z, hammers, bell, listeners, lift,
      base: hammers.map((h) => h.quaternion.clone()), bellBase: bell ? bell.quaternion.clone() : null,
      // each hammer's way out from the bell, in the buoy's own axes (the model's quarters +X, +Y, -X, -Y; Blender's y is the ride's -z)
      out: [0, 1, 2, 3].map((k) => new THREE.Vector3(Math.cos(k * Math.PI / 2), 0, -Math.sin(k * Math.PI / 2))),
      a: [0, 0, 0, 0], v: [0, 0, 0, 0], lying: [false, false, false, false], say: [null, null, null, null], tx: 0, tz: 0, vtx: 0, vtz: 0, bx: 0, bz: 0, bvx: 0, bvz: 0, strikes: 0, tilt: 0,
      list: (() => { const sw = P.water.swellDir || [0.9, 0.42], l = Math.hypot(sw[0], sw[1]) || 1, k = Number(params.get('hblist') ?? BU.list ?? 5) * Math.PI / 180; return [sw[0] / l * k, sw[1] / l * k]; })(),
    };
    // push(speed): ONE STROKE ON DEMAND, seen (asked by the cast, docs/build/sea/3-cast-edge.md: a bell rung by staging had no
    // hammer seen to strike). The free hammer nearest the lip is thrown at it so that it meets it within a fifth of a second;
    // the float nods a little the same way. The stroke is then told through onStrike like any other, with the speed that was
    // asked for (radians a second: the cast makes the bell's loudness of it). Returns the hammer's number. x, z are not used.
    // (A hammer is a pendulum that hangs by gravity in the leaning cage: it has to be thrown hard enough to climb from
    // where it hangs to the lip and still arrive with the speed asked for. The first push, thrown at that speed alone,
    // came to rest on the lip without a sound: traced, not guessed.)
    const push = (speed = 0.4) => {
      const b = buoy; if (!b || !b.hammers.length) return -1;
      const sp = Math.max(Math.abs(Number(speed) || 0.4), 2 * VMIN);
      let best = -1, least = 1e9;
      for (let i = 0; i < b.hammers.length; i++) {
        if (b.lying[i]) continue;
        const rest = Math.atan2(down.dot(b.out[i]), -down.y), a0 = b.a[i];
        const climb = HW * HW * Math.max(0, (STRIKE - rest) * (STRIKE - rest) - (a0 - rest) * (a0 - rest));      // what the climb to the lip takes of its speed, squared
        const v0 = Math.max(1.25 * Math.sqrt(sp * sp + climb), 1.3 * (a0 - STRIKE) / 0.26);                    // (a quarter over for what the pivot's friction takes; and it must be there within a quarter of a second)
        if (v0 < least) { least = v0; best = i; }
      }
      if (best < 0) { best = 0; b.lying[0] = false; b.a[0] = STRIKE + 0.1; least = 1.3 * sp; }      // (all four lying on the bell: one is lifted off it first)
      b.v[best] = -least; b.say[best] = sp;
      b.vtx += 0.05 * b.out[best].z; b.vtz -= 0.05 * b.out[best].x;
      return best;
    };
    out.buoy = { model: m, onStrike: (fn) => listeners.push(fn), push, get tilt() { return buoy.tilt; }, get strikes() { return buoy.strikes; } };
    // THE MOORING CHAIN below the bridle, grown in code: 34 oval links leading down and up-weather to an anchor that is
    // never seen. It hangs from the model's point `bridle` and rises and falls with it. At rest it is dark iron in dark
    // water. Each time a crest snatches the buoy upward the strain runs down it as light, link after link (the page:
    // "the chain going down as a dotted line of light with each heave"): every other link takes it, white-aqua at
    // first, ember as it dies. Solid links, so that the water bends and swallows them as it does anything under it.
    if (sea && m.points && m.points.bridle) {
      const N = 34, L = 10.4, sw = P.water.swellDir || [0.9, 0.42], sl = Math.hypot(sw[0], sw[1]) || 1, ux = -sw[0] / sl, uz = -sw[1] / sl;
      const run = (k) => new THREE.Vector3(ux * 3.4 * Math.pow(k, 1.8), -0.25 - L * 0.94 * k, uz * 3.4 * Math.pow(k, 1.8));
      const link = new THREE.TorusGeometry(0.1, 0.03, 4, 8); link.scale(0.72, 1.5, 1);         // an oval link on end: 0.36 m long, of 60 mm bar
      const ak = new Float32Array(N * 2), mesh = new THREE.InstancedMesh(link, kit.gouache({ color: C.iron, brush: 0.6, extend: [sea.extend({ rest: 0.5, top: 1, run: 0.1, pale: 0.2 }), {
        uniforms: { uHbPulse: { value: new THREE.Vector4(99, 0, 99, 0) } },      // seconds since the last two snatches, and how hard each was
        ...(params.get('hbchain') === 'attr' ? { defines: { HB_CHAIN_ATTR: '' } } : {}),
        vertexPars: 'attribute vec2 aHbK; varying vec2 vHbK;', vertexLocal: 'vHbK = aHbK;',
        fragmentPars: 'uniform vec4 uHbPulse; varying vec2 vHbK;',
        light: /* glsl */`{
          float hbLit = 0.0, hbAge = 0.0;
          for (int i = 0; i < 2; i++) {
            float hbT = (i == 0 ? uHbPulse.x : uHbPulse.z) - vHbK.x * 1.6, hbHard = i == 0 ? uHbPulse.y : uHbPulse.w;      // its foot lights a second and a half after its head
            if (hbT > 0.0) { hbLit += hbHard * smoothstep(0.0, 0.12, hbT) * exp(-hbT / 1.8); hbAge = max(hbAge, exp(-hbT / 1.1)); }
          }
          glow += seaAge(hbAge, uSeaCore, uSeaAqua, uSeaEmber, uSeaViolet * 0.4) * (hbLit * mix(0.6, 9.0, vHbK.y) * uSeaL.y);      // (it is seen through three metres of water and more, which takes most of it)
          #ifdef HB_CHAIN_ATTR
            glow = vec3(vHbK.x, vHbK.y, 0.0) * 6.0;      // (a developer's switch, &hbchain=attr: every link shows its own numbers, the pulse ignored)
          #endif
        }`,
      }] }), N);
      const mx = new THREE.Matrix4(), q0 = new THREE.Quaternion(), q1 = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), one = new THREE.Vector3(1, 1, 1);
      for (let i = 0; i < N; i++) {
        const k = i / (N - 1), a = run(k), t = run(Math.max(0, k - 0.02)).sub(run(Math.min(1, k + 0.02))).normalize();
        q0.setFromUnitVectors(up, t).multiply(q1.setFromAxisAngle(up, (i % 2) * Math.PI / 2 + 0.15 * Math.sin(i * 2.7)));      // each link turned a quarter from the last
        mesh.setMatrixAt(i, mx.compose(a, q0, one));
        ak[i * 2] = k; ak[i * 2 + 1] = i % 2 ? 0 : 1;                                             // every other link takes the strain
      }
      link.setAttribute('aHbK', new THREE.InstancedBufferAttribute(ak, 2));
      mesh.instanceMatrix.needsUpdate = true; mesh.frustumCulled = false; mesh.name = 'mooring chain (the bell buoy)';
      const hang = new THREE.Group(); hang.add(mesh); ctx.add(hang); ctx.only(mesh, 'direct');
      smallAt(at.x, at.z, 45, [hang]);
      buoy.chain = { group: hang, pulse: mesh.material.uniforms.uHbPulse.value, h: 0, armed: true, first: true, p: new THREE.Vector3() };
    }
  }

  // ---------------------------------------------------------------------------------------------- the rowing boat
  // The keeper's boat, drawn up on the skerry's slip with her bow inland. The slip is the skerry's (heroes.js), which
  // names its two ends on top of the skids (slip_low, slip_high) and its iron ring (ring): she is laid on those, as
  // high as the slip lets her (her stem at its head), resting on her starboard bilge. The model's origin is the
  // underside of her keel at the transom; its front (her bow) goes up the slip. Without the skerry she is laid where
  // the plan puts the slip. The rain in her bilge takes none of the sea's light: it is the one water here that does
  // not answer. Her painter is led aft over the starboard gunwale and made fast to the ring (the rope is made here;
  // the knot is the model's part `hitch`).
  if (want('rowboat')) {
    const sk = shared.heroes && shared.heroes.skerry, has = (n) => !!(sk && sk.model && sk.model.points && sk.model.points[n]);
    const V3 = THREE.Vector3;
    let low, high, ring = null;
    if (has('slip_low') && has('slip_high')) { low = sk.model.point('slip_low'); high = sk.model.point('slip_high'); if (has('ring')) ring = sk.model.point('ring'); }
    else { const S = P.skerry.slip, tan = Math.tan(S.pitch * Math.PI / 180); low = kit.at(S.s, S.d[0], 0.2); high = kit.at(S.s, S.d[1] + 0.9, 0.2 + (S.d[1] + 0.9 - S.d[0]) * tan); }
    const paintArt = await painting('oak');
    const RB = (P.heroesB && P.heroesB.rowboat) || {};
    const boatLight = { ref: C.boatPaint, rest: RB.rest ?? 0.27, top: 1, run: 0.3, pale: RB.pale ?? 1.0, lift: 1.3 };      // (unlit, her paint is the page's slate, the palest unlit value; it is pale where the lamp finds it)
    // (the kept lamp is 10 m from her: the engine's lamp light has died by there, and the page has it warm her near
    // end. A touch of it is laid on what she turns toward the lamp, falling away along her length)
    const lampTouch = { uniforms: { uHbLamp: { value: RB.lamp ?? 0.42 } }, fragmentPars: 'uniform float uHbLamp;', light: /* glsl */`{
      vec3 lTo = uLampPos - vWPos; float lD = length(lTo), lA = 1.0 - smoothstep(7.6, 12.2, lD);
      c += albedo * uLampColor * (uHbLamp * lA * max(dot(N, lTo / max(lD, 1e-3)) * 0.7 + 0.3, 0.0));
    }` };
    const hull = rock({ ...boatLight, art: paintArt, amount: 0.22 });
    if (hull.extend) hull.extend = [raised(hull.extend[0], RB.raise ?? 2.5), ...hull.extend.slice(1), lampTouch];
    const m = await kit.model(`models/sea/rowboat${nx('rowboat')}.glb`, { position: [low.x, low.y, low.z], ...hull, materials: { pool: { extend: [], brush: 0, shade: 0.25 } } });
    removeStandIn(ctx, 'rowboat');
    directOnly(m, 'pool');
    const fine = slotMeshes(m, 'pool');                                                         // the rain in her, her painter and its knot: not drawn from beyond 50 m
    // lay her on the slip: her bow up the slip, her keel hanging between the skids, her bilges on them
    const d = new V3().subVectors(high, low), slipLen = d.length(); d.normalize();
    const n = new V3(0, 1, 0).addScaledVector(d, -d.y).normalize(), x = new V3().crossVectors(n, d);
    const bilge = m.points.bilge_port ? m.points.bilge_port.position.y : 0.1, len = 4.42, heel = 3 * Math.PI / 180;       // (how far her bilge stands above her keel; her length over all)
    const g = m.group;
    g.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, n, d)).multiply(new THREE.Quaternion().setFromAxisAngle(new V3(0, 0, 1), heel));
    g.position.copy(low).addScaledVector(d, Math.max(0.3, slipLen + 0.3 - len)).addScaledVector(n, -bilge + 0.46 * Math.sin(heel) + 0.01);
    g.updateMatrix(); g.updateMatrixWorld(true);
    out.rowboat = { model: m };
    // the painter: from the ring bolt on her stem, aft inside her starboard side, over the gunwale and down to the ring
    const hitch = m.parts.hitch;
    if (ring && hitch && m.points.painter && m.points.painter_lead) {
      const a = m.point('painter'), lead = m.point('painter_lead'), knot = ring.clone().add(new V3(0, 0.07, 0));
      const back = new V3(lead.x - knot.x, 0, lead.z - knot.z).normalize();            // from the ring toward her quarter, level
      // the knot sits on the ring with its standing part toward the boat
      const qw = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(knot, new V3(knot.x + back.x, knot.y + 0.12, knot.z + back.z), new V3(0, 1, 0)));
      hitch.position.copy(g.worldToLocal(knot.clone()));
      hitch.quaternion.copy(g.quaternion).invert().multiply(qw);
      hitch.updateMatrix(); hitch.updateMatrixWorld(true);
      // the rope: along the inside of her starboard side, over the gunwale at her quarter, down onto the rock at the
      // edge of the slip (the ring's seat is taken to be level with the rock between it and the slip) and to the knot
      const pts = [a, a.clone().add(new V3(0, -0.06, 0)).lerp(m.point('painter_1'), 0.5)];
      for (const nme of ['painter_1', 'painter_2', 'painter_3']) if (m.points[nme]) pts.push(m.point(nme));
      const edge = ring.clone().addScaledVector(back, 0.42).add(new V3(0, 0.03, 0)), start = knot.clone().addScaledVector(back, 0.16).add(new V3(0, 0.03, 0));
      pts.push(lead.clone().addScaledVector(back, 0.03).add(new V3(0, 0.012, 0)), lead.clone().lerp(edge, 0.5).add(new V3(0, Math.min(0, (edge.y - lead.y) * 0.3) - 0.03, 0)), edge, start);
      const rope = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'centripetal'), 64, 0.009, 5, false), sea ? sea.rock({ color: '#5a5448', rest: 0.5, top: 1, run: 0.6, pale: 0.9, crisp: true }) : kit.gouache({ color: '#5a5448', crisp: true }));      // (a rope 18 mm thick: kept out of the painter's filter, which would wipe it out)
      rope.name = 'painter (the rowing boat)'; ctx.add(rope); ctx.only(rope, 'direct'); ctx.only(hitch, 'direct');
      // (the knot wears the rope's own material: in the hull's it took the lamp's touch as the hull does and stood on the ring as
      // a small orange squiggle, the second warm thing in the picture; and it is thin: the painter's filter is kept off it too)
      hitch.traverse((o) => { if (o.isMesh) o.material = rope.material; });
      fine.push(rope, hitch);
    } else if (hitch) hitch.visible = false;
    smallAt(g.position.x, g.position.z, 50, fine);
    smallAt(g.position.x, g.position.z, 125, [g]);
    mirrorAt(g.position.x, g.position.z, 40, m);
  }

  const debug = params.get('hbdebug') ? { lean: 0, hi: -9, lo: 9, times: [], snatch: [], done: false } : null;
  let pushAt = params.get('hbpush') === null ? null : Number(params.get('hbpush'));      // (a switch for looking: &hbpush=12 gives the buoy one push twelve seconds in)
  if (debug && buoy) buoy.listeners.push((i, v) => debug.times.push(ctx.time + v / 1000));
  const slope = { x: 0, z: 0 }, qT = new THREE.Quaternion(), qY = new THREE.Quaternion(), qI = new THREE.Quaternion(), qA = new THREE.Quaternion();
  const eul = new THREE.Euler(), down = new THREE.Vector3(), AX = new THREE.Vector3(1, 0, 0), AY = new THREE.Vector3(0, 1, 0), eye = new THREE.Vector3();
  const STRIKE = -4 * Math.PI / 180, STOP = 17 * Math.PI / 180, CAP = 14 * Math.PI / 180;      // a hammer meets the lip, the stop hoop; the most the buoy leans
  const HW = 4.0;                                                                              // a hammer's own swing, radians a second
  const VMIN = Number(params.get('hbvmin') ?? ((P.heroesB && P.heroesB.buoy && P.heroesB.buoy.vmin) ?? 0.12));                                           // radians a second: slower than this a hammer only comes to rest on the lip
  return {
    update(dt, c) {
      if ((small.length || mirrored.length || faces || swaps.length) && c.engine.camera) {
        c.engine.camera.getWorldPosition(eye); c.group.worldToLocal(eye);
        if (faces) {                                                              // the crown: only the face on the eye's side of the gate
          const side = (eye.x - faces.x) * faces.tx + (eye.z - faces.z) * faces.tz < 0 ? -1 : 1;
          if (side !== faces.side) { faces.side = side; faces.front.visible = side < 0; faces.back.visible = side > 0; }
        }
        for (const f of swaps) {
          const on = (eye.x - f.x) * (eye.x - f.x) + (eye.z - f.z) * (eye.z - f.z) < f.within * f.within;
          if (on !== f.on) { f.on = on; f.near.visible = on; f.far.visible = !on; }
        }
        for (const f of small) {
          const on = (eye.x - f.x) * (eye.x - f.x) + (eye.z - f.z) * (eye.z - f.z) < f.within * f.within;
          if (on !== f.on) { f.on = on; for (const o of f.objs) o.visible = on; }
        }
        for (const f of mirrored) {
          const on = (eye.x - f.x) * (eye.x - f.x) + (eye.z - f.z) * (eye.z - f.z) < f.within * f.within;
          if (on !== f.on) { f.on = on; for (const o of f.objs) o.layers.set(on ? 0 : 1); }
        }
      }
      if (roof && sea && sea.uniforms && sea.uniforms.uSeaFront) {
        const f = sea.uniforms.uSeaFront.value, k = Math.max(0, Math.min(1, (f.z - (f.x * roof.x + f.y * roof.z)) * f.w + 0.5));
        roof.u.value.w = roof.pale * (1 - roof.dark * k * k * (3 - 2 * k) * sea.uniforms.uSeaL.value.x);
      }
      if (chain) {
        // the hanging chain: a damped pendulum, pushed fore and aft by the water's rise and fall at its foot and athwart by a slow drift
        const k = chain, step = Math.min(dt, 0.1), h = c.water.heightAt(k.x, k.z);
        const rise = k.first ? 0 : (h - k.h) / Math.max(step, 1e-3); k.h = h; k.first = false;
        const ta = Math.max(-0.07, Math.min(0.07, rise * 0.09)), tb = 0.025 * Math.sin(c.time * 0.83 + 1.3) * (c.reducedMotion ? 0.4 : 1), w = 2.6;
        k.va += (-w * w * (k.a - ta) - 1.6 * k.va) * step; k.a += k.va * step;
        k.vb += (-w * w * (k.b - tb) - 1.6 * k.vb) * step; k.b += k.vb * step;
        k.part.quaternion.copy(k.base).multiply(qA.setFromEuler(eul.set(k.b, 0, k.a, 'XYZ')));
      }
      if (buoy && debug && !debug.done) {
        debug.lean = Math.max(debug.lean, buoy.tilt); debug.hi = Math.max(debug.hi, c.water.heightAt(buoy.x, buoy.z)); debug.lo = Math.min(debug.lo, c.water.heightAt(buoy.x, buoy.z));
        if (c.time > Number(params.get('hbdebug') === '1' ? 58 : params.get('hbdebug'))) { debug.done = true; console.error(`HB_PROBE (not an error) buoy: ${buoy.strikes} strikes in ${c.time.toFixed(0)} s at (time.speed) ${debug.times.slice(-3).map((t) => t.toFixed(4)).join(' ')}; greatest lean ${(debug.lean * 180 / Math.PI).toFixed(1)} degrees; water under it ${debug.lo.toFixed(2)} to ${debug.hi.toFixed(2)} m; the chain snatched (time/speed/dt) ${debug.snatch.join(' ')}`); }
      }
      if (buoy && pushAt !== null && c.time >= pushAt) { pushAt = null; const k = out.buoy.push(0.45); if (debug) debug.snatch.push(`push:${c.time.toFixed(2)}:hammer${k}:thrown at ${(-buoy.v[k]).toFixed(2)}`); }
      if (buoy) {
        const b = buoy, g = b.model.group, step = Math.min(dt, 0.1);
        // it rides the swell and leans with the water's face, with the weight of two tons of iron
        const h = c.water.heightAt(b.x, b.z);
        if (c.water.slopeAt) c.water.slopeAt(b.x, b.z, slope);
        let tx = slope.z * 1.6, tz = -slope.x * 1.6;
        const lean = Math.hypot(tx, tz);
        if (lean > CAP) { tx *= CAP / lean; tz *= CAP / lean; }
        // (it lies to its mooring: the chain holds its foot up-weather and its head hangs a few degrees down-swell. So the
        // hammer on the weather side rests against the bell and strikes once with every swell as the roll takes it off
        // and brings it back, and the lee side only in the largest: one stroke a swell, two in the great ones, none alike)
        tx += b.list[1]; tz -= b.list[0];
        // (a float this size has a roll of its own, about 2.8 s: the water's face pushes it over and it rocks on a
        // little after every crest, which is what swings the hammers)
        const wr = 2.25, zr = 2 * 0.2 * wr;
        b.vtx += (-wr * wr * (b.tx - tx) - zr * b.vtx) * step; b.tx += b.vtx * step;
        b.vtz += (-wr * wr * (b.tz - tz) - zr * b.vtz) * step; b.tz += b.vtz * step;
        b.tilt = Math.hypot(b.tx, b.tz);
        if (b.tilt > CAP * 1.1) { const q = CAP * 1.1 / b.tilt; b.tx *= q; b.tz *= q; b.tilt = CAP * 1.1; }
        g.position.set(b.x, h - 0.04, b.z); b.lift.value = h;
        if (b.chain) {
          const k = b.chain, was = k.h, vy = k.first ? 0 : (h - was) / Math.max(step, 1e-3); k.h = h; k.first = false;
          k.pulse.x += dt; k.pulse.z += dt;
          if (k.armed && was < 0 && h >= 0 && vy > 0.05 && vy < 1.5) {                       // the swell lifts it through its level, at its fastest: the chain snatches, the strain runs down it, and a ring leaves the float
            k.armed = false; k.pulse.z = k.pulse.x; k.pulse.w = k.pulse.y; k.pulse.x = 0; k.pulse.y = Math.min(1, Math.max(0.35, vy / 0.45));
            if (debug) debug.snatch.push(`${c.time.toFixed(2)}/${vy.toFixed(2)}/${dt.toFixed(3)}`);
            // (the water slaps its sides as it lifts: five small rings from places round its waterline, no two swells
            // the same five, which cross and break one another. One ring from its middle came out as a ruled hoop of light.)
            k.count = (k.count || 0) + 1;
            for (let q = 0; q < 5; q++) { const an = k.count * 2.399 + q * 1.257 + 0.4 * Math.sin(k.count * 1.7 + q); c.water.ripple(b.x + 1.15 * Math.cos(an), b.z + 1.15 * Math.sin(an), 0.3, 0.55 + 0.1 * ((q * 7 + k.count) % 3)); }
          } else if (h < -0.05) k.armed = true;
        }
        qT.setFromEuler(eul.set(b.tx, 0, b.tz, 'XYZ'));
        qY.setFromAxisAngle(AY, (c.reducedMotion ? 8 : 20) * Math.PI / 180 * Math.sin(c.time * Math.PI * 2 / 40));
        g.quaternion.copy(qT).multiply(qY);
        if (b.chain) { g.updateMatrixWorld(true); b.model.point('bridle', b.chain.p); b.chain.group.position.copy(b.chain.p); }
        // which way is down, in the buoy's own axes: the hammers and the bell hang by it
        down.set(0, -1, 0).applyQuaternion(qI.copy(g.quaternion).invert());
        const n = Math.max(1, Math.ceil(step / 0.02)), h2 = step / n, w = HW, damp = 2 * 0.12 * w;
        for (let i = 0; i < b.hammers.length; i++) {
          const rest = Math.atan2(down.dot(b.out[i]), -down.y);
          let a = b.a[i], v = b.v[i];
          for (let q = 0; q < n; q++) {
            v += (-w * w * (a - rest) - damp * v) * h2; a += v * h2;
            // (it strikes when it comes to the lip with some way on it, and then lies against the bell until the roll takes it off again)
            if (a < STRIKE) { if (v < -(c.reducedMotion ? 0.4 * VMIN : VMIN) && !b.lying[i]) { b.strikes++; const told = b.say[i] ?? -v; for (const fn of b.listeners) fn(i, told, b); } b.say[i] = null; b.lying[i] = true; a = STRIKE; v = -0.2 * v; }
            else if (a > STOP) { a = STOP; v = -0.15 * v; }
            else if (a > STRIKE + 0.03) b.lying[i] = false;
          }
          b.a[i] = a; b.v[i] = v;
          b.hammers[i].quaternion.copy(b.base[i]).multiply(qA.setFromAxisAngle(AX, a));
        }
        if (b.bell) {
          // the bell hangs on a stiff shackle: it follows the roll by half, a little late, to five degrees
          const txb = Math.max(-0.09, Math.min(0.09, -0.5 * down.z)), tzb = Math.max(-0.09, Math.min(0.09, 0.5 * down.x)), wb = 3.2;
          b.bvx += (-wb * wb * (b.bx - txb) - 1.3 * b.bvx) * step; b.bx += b.bvx * step;
          b.bvz += (-wb * wb * (b.bz - tzb) - 1.3 * b.bvz) * step; b.bz += b.bvz * step;
          b.bell.quaternion.copy(b.bellBase).multiply(qA.setFromEuler(eul.set(b.bx, 0, b.bz, 'XYZ')));
        }
      }
    },
  };
}
