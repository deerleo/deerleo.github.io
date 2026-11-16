// The dyers' reach: THE MONUMENT. Page: docs/art/reach.md, section 3, "Monument: the great wheel". Log: docs/build/reach/2-monument.md.
//
// A dyers' dipping wheel 30.8 m tall standing broadside across the far end of the lagoon, hub at world (-3, 15.2, -206).
// It lowers each cloth into the river and lifts it into the wind and the sun, over and over, once in two minutes,
// anticlockwise as seen from the lagoon (the right-hand, north side rises), and it has never noticed anything.
//
// Three models, made in Blender (source-art/models/reach/: great_wheel_rotor.py, great_wheel_frames.py, wheel_pier.py,
// with gw.py), and one system:
//   the rotor     one mesh, it turns: two rims of two courses of felloes, 48 floats with their cheeks, twelve pairs of
//                 arms (each two lengths, scarfed, strapped and wedged), two rings of chords, hub, axle, and a peg rail
//                 for every arm in the lane where its cloth hangs; and one part of its own, the loose board
//   the frames    two A-frames of built legs, each on a ground tie laid across two stone footings of the pier; the
//                 bearings astride their apexes, 15.2 m up, each in an eight-sided head block 2.5 m across (the boss of
//                 the rose); on the lagoon frame heavy wet cloth thrown over the ground tie (two bolts and a wrung
//                 length: points drape0, drape1, drape2) and a hoist with a hamper of wet cloth (a part of its own; its rope
//                 and sling are the material slot `line`, drawn crisp)
//   the pier      coursed stone 35 by 10 m, the pit, two sluice arches with their gates and windlasses, steps, weir,
//                 four footings under the frames' feet, and what the dyers put down on it
//   the gores     the engine's makeGores (the cloth is the cloth person's): ten cloths pegged along ten of the twelve
//                 arms, hanging by their own weight in lanes outside the rims. Their dyes follow the rider's progress
// (The boom's baulks are a kit piece: kit.js.)
//
// shared.wheel = {
//   hub, angle (radians now), rotor (the turning group: rotation.z = angle), gores (makeGores' handle), dyes() -> [{ top, hem }]
//   points: { rotor, frames, pier }   the three models (kit.model's result): points.pier.point('arch_north') and so on.
//                                     The names are listed in docs/build/reach/2-monument.md; a rotor point rides on the wheel
//   floatTip(i, out)                  where the tip of float board i (0..47) is NOW, mid-wheel (out: a Vector3)
//   rim(angle, radius, axial, out)    any place on the turning wheel: angle in radians in the wheel's own count (arm i stands
//                                     at i * TAU / 12), radius in metres from the axle, axial in metres toward the lagoon
//   missing: [17, 38], split: 29      float boards that are gone, and one that is split (no drops fall from a missing one)
//   loose: { part, tip(out), pivot(out), wet() }   THE LOOSE BOARD: the broken half of float 29, the rotor's one moving part.
//                                     It hangs plumb while the wheel turns and swings after its foot has trailed through
//                                     the pit; tip(out) is its foot now, wet() is true while that foot is in the water
//   hoist: { part, drip(out), block, push(k) }     THE HOIST on the lagoon frame: a hamper on five metres of rope that sways;
//                                     drip(out) is the lowest corner of the wet cloth that hangs out of it, now; push(k)
//                                     swings it k times wider (a gust)
//   FOR THE CAST AND STAGING (fifth look; nothing here draws or sounds anything by itself):
//   arms: [0, 1, 2, 3, 5, 6, 7, 8, 10, 11]         gore k hangs on arm arms[k] (4 and 9 are bare)
//   dyer: 'progress'                  who dyes the gores. Set it to anything else ('cast') and this file leaves their dyes
//                                     alone from then on: the dip-dye stepping at the pit is then yours
//   setDye(k, top, hem)               dye gore k (colours; either may be null): the cloth AND what dyes() reports, so that the
//                                     sun's cover test still agrees with the picture. Use this, not gores.setDye
//   place(far)                        the evening's place on the dyer's scale at furthest progress `far` (1 saffron .. 5 indigo)
//   dips(k)                           how many times gore k's long end has gone down through the pit since the realm's time 0
//                                     (a whole number that goes up by one as its arm passes straight down: step its hem then)
//   onFloat(fn)                       fn(i, into, point, gone) every time a float board's tip crosses the water in the pit:
//                                     i 0..47, into true going in (the south side: the knock) and false coming out (the north:
//                                     where it starts to shed), point a Vector3 at the water (do not keep it), gone true for
//                                     the two boards that are missing. One every 2.5 s each way. Returns a function that removes fn
//   wet: { leaves, top, enters }      where the rim leaves the water, is at the top and goes in again, as radians of the WORLD's
//                                     angle about the hub (0 = level on the north side, anticlockwise seen from the lagoon):
//                                     the arc the rotor's soaking is laid on (rimWet below), and where its rain belongs
// }
// What moves: the rotor (rotation.z = the angle), the loose board and the hoist, all by the realm's clock and the wheel's
// phase: nothing is started by the boat, and a picture taken twice is the same picture.
// Switches for looking: &wheel=<degrees> holds the wheel (and the loose board hangs plumb, without its swing); &grain=0 the
// models' paint alone, without the painted oak and stone; &grainnear=<stone>,<oak> how much harder the grain is drawn up
// close; &rimwet=0 the rim without its soaking; &stone=<r>,<g>,<b> a multiplier on the stone's paint; &fill=<strength>,
// <from>,<to> the sky's fill on shaded faces near the eye (third look); &wheelpoints=1 writes every named point's place in
// the realm to .shots/reach_wheel_points.json.
import * as THREE from 'three';
import { makeGores } from '../../engine/cloth.js';
import { dyePlace } from './plan.js';

const QS = new URLSearchParams(location.search);
const TAU = Math.PI * 2;

export async function build(ctx, plan, shared) {
  const { kit } = ctx, W = plan.wheel, [hx, hy, hz] = W.hub, sun = shared.sun;
  const fixed = QS.has('wheel') ? +QS.get('wheel') * Math.PI / 180 : null;
  const wheel = { hub: new THREE.Vector3(hx, hy, hz), get angle() { return fixed != null ? fixed : W.phase + TAU * ctx.time / W.period; } };
  shared.wheel = wheel;
  const points = {};                                    // the three models, for their named points: shared.wheel.points
  wheel.points = points;
  wheel.missing = [17, 38]; wheel.split = 29;           // (the rotor's script: floats that are gone, and one that is split)

  // ---- What the monument's models wear: the area's solid material (set.js, shared.mat.solid) as kit.model options (the
  // ride's brush, a thin warm rim against the sun, water-light on the first metre, the dyed bar of light: light.js), and
  // THE GRAIN: the reach's painted `timber` sheet, the same two pictures the dye yards wear (kit_yards.js), laid on by what
  // each piece is made of. A model says that in the ALPHA of its paint (gw.py, KIND): 1 as painted (iron, rope, wicker);
  // 0.6 dressed stone, from three sides; below 0.5 oak, its grain ALONG the timber: 0.10 plumb, 0.15 along the model's x,
  // 0.20 along its z (Blender's y: the axle's way), 0.25 and 0.30 the frames' two leaning legs, 0.35 out from the axle
  // (arms), 0.40 round it (felloes). It is laid in the MODEL's own space (uGwInv: the model's inverse matrix), so it turns
  // with the wheel, and only in the fragment shader, so the sun's mask still counts every timber as solid (light.js).
  // Each picture is divided by its own mean, as in the yards: the paint keeps its value.
  let tStone = null, tOak = null;
  if (QS.get('grain') !== '0') {
    try { [tStone, tOak] = await Promise.all([ctx.tex('art/reach/timber_stone.webp', { repeat: true }), ctx.tex('art/reach/timber_oak.webp', { repeat: true })]); }
    catch (e) { tStone = tOak = null; console.error('reach/heroes: the timber pictures did not load (the monument wears its paint alone): ' + e); }
  }
  const lean = { value: 0.495 };                        // the frames' legs' lean from the plumb line: read from the model below
  // SECOND LOOK: up close the grain is drawn harder. The two pictures are quiet (the oak's light and dark are 14 per cent
  // either side of its mean) and the painter's filter quietens them again: from beside the steps the timbers were
  // smooth card. Within 5 m the pictures' contrast is multiplied (1 + near), easing to as-painted by 18 m.
  // &grainnear=<stone>,<oak> tries other numbers.
  const nearGain = (QS.get('grainnear') || '1.2,2.0').split(',').map(Number);
  // SECOND LOOK: THE RIM IS WET WHERE IT HAS JUST LEFT THE RIVER. The rotor's paint turns with it, so its paint can only be
  // damp all round; the soaking is laid here, by where a timber IS: black-wet as it climbs out of the pit on the rising
  // (north) side, drying as it goes over the top, wet again as it goes in. Each float darkens as it comes up and dries
  // over the next half turn. Only beyond 11.5 m from the axle (what goes through the water), and only on the rotor
  // (uGwWet: the wheel's angle now, the strength; 0 on the frames and the pier). &rimwet=0 switches it off.
  const rimWet = QS.has('rimwet') ? +QS.get('rimwet') : 0.85;
  // THIRD LOOK: two things the reach's light does to a thing that stands broadside to the sun and is looked at from the
  // lagoon. (1) STONE: a face turned from the sun shows a fifth of its paint, and the pier's dusky rose and the wet oak
  // above it came out one dark value: the wheel stood on a slab. &stone=<r>,<g>,<b> multiplies the stone's paint here
  // (for trying values: the paint itself is the pier's script's business). (2) THE FILL: what looks away from the sun
  // is lit by the eastern sky and by the lit cloth of the nave behind the rider, which the ride's ambient (up and down
  // only) cannot say. Near the eye the shaded timber takes that much more of the sky's light on the faces that look at
  // the lagoon and down at the water, so that its paint (stains, rust, the drier heart, stone) can be seen from the boom
  // and from under the rose; beyond `fillFar` metres it is not there, and the wheel stays the dark ring of the stamp.
  // &fill=<strength>,<from>,<to>
  const stoneK = (QS.get('stone') || '1,1,1').split(',').map(Number);
  const fillK = (QS.get('fill') || '0.9,22,60').split(',').map(Number);
  const grain = () => ({
    // uGwTex: stone repeats per metre, oak repeats per metre, the stone's strength, the oak's
    uniforms: { tGwStone: { value: tStone }, tGwOak: { value: tOak }, uGwTex: { value: new THREE.Vector4(1 / 2.4, 1 / 1.7, tStone ? 0.62 : 0, tOak ? 0.7 : 0) }, uGwInv: { value: new THREE.Matrix4() }, uGwLean: lean, uGwNear: { value: new THREE.Vector2(nearGain[0] || 0, nearGain[1] || 0) }, uGwWet: { value: new THREE.Vector2(0, 0) },
      uGwStone: { value: new THREE.Vector3(stoneK[0] || 1, stoneK[1] || stoneK[0] || 1, stoneK[2] || stoneK[0] || 1) }, uGwFill: { value: new THREE.Vector3(Number.isFinite(fillK[0]) ? fillK[0] : 0.9, fillK[1] || 22, fillK[2] || 60) } },
    fragmentPars: 'uniform sampler2D tGwStone, tGwOak; uniform vec4 uGwTex; uniform mat4 uGwInv; uniform float uGwLean; uniform vec2 uGwNear, uGwWet; uniform vec3 uGwStone, uGwFill;',
    albedo: /* glsl */`
      #ifdef USE_COLOR_ALPHA
      { float gk = vColor.a;
        if (gk < 0.8 && uGwTex.z + uGwTex.w > 0.0) {
          vec3 lp = (uGwInv * vec4(vWPos, 1.0)).xyz, ln = normalize(mat3(uGwInv) * N), tx; float share, strength, hard;
          if (gk > 0.5) { tx = tri(tGwStone, lp * uGwTex.x, ln) / vec3(0.392, 0.129, 0.153); share = 0.3; strength = uGwTex.z; hard = uGwNear.x; }
          else {
            vec3 q = lp, m = ln;                        // q.y runs along the grain
            if (gk > 0.325) {                           // on the wheel: out from the axle, or round it
              vec2 xy = vec2(0.9659 * lp.x + 0.2588 * lp.y, -0.2588 * lp.x + 0.9659 * lp.y);      // (turned 15 degrees: the seam of the angle falls between two arms)
              float rr = max(length(lp.xy), 1e-3), th = atan(xy.y, xy.x); vec2 er = lp.xy / rr, et = vec2(-er.y, er.x);
              if (gk > 0.375) { q = vec3(rr, th * rr, lp.z); m = vec3(dot(ln.xy, er), dot(ln.xy, et), ln.z); }
              else { q = vec3(th * rr, rr, lp.z); m = vec3(dot(ln.xy, et), dot(ln.xy, er), ln.z); }
            } else if (gk > 0.225) {                    // a frame's leg, leaning one way or the other in the model's x, y
              float c = cos(uGwLean), sn = sin(uGwLean) * (gk > 0.275 ? -1.0 : 1.0);
              q = vec3(c * lp.x + sn * lp.y, c * lp.y - sn * lp.x, lp.z); m = vec3(c * ln.x + sn * ln.y, c * ln.y - sn * ln.x, ln.z);
            } else if (gk > 0.175) { q = lp.xzy; m = ln.xzy; }
            else if (gk > 0.125) { q = lp.yxz; m = ln.yxz; }
            tx = tri(tGwOak, q * uGwTex.y, m) / vec3(0.179, 0.054, 0.086); share = 0.45; strength = uGwTex.w; hard = uGwNear.y;
          }
          float tl = dot(tx, vec3(0.3333)), far = length(vViewPos);
          strength *= 1.0 - 0.6 * smoothstep(18.0, 55.0, far);                   // the grain is for the near view: from across the lagoon it would only mottle the timber
          vec3 tv = mix(vec3(tl), tx, share);
          tv = 1.0 + (tv - 1.0) * (1.0 + hard * (1.0 - smoothstep(5.0, 18.0, far)));      // and drawn harder up close
          albedo *= clamp(mix(vec3(1.0), tv, strength), 0.3, 2.0);
        }
        if (gk > 0.5 && gk < 0.8) albedo *= uGwStone; }
      #endif
      if (uGwWet.y > 0.0) {                               // the rotor: soaked where it has just left the river (see rimWet above)
        vec3 wq = (uGwInv * vec4(vWPos, 1.0)).xyz;
        float turn = fract((atan(wq.y, wq.x) + uGwWet.x + 1.3445) / 6.2832);      // 0 where the rim leaves the water, 0.46 at the top, 0.93 where it goes in
        float soak = max(1.0 - smoothstep(0.07, 0.5, turn), smoothstep(0.9, 0.93, turn)) * smoothstep(11.5, 13.6, length(wq.xy));
        albedo *= mix(vec3(1.0), vec3(0.54, 0.51, 0.6), soak * uGwWet.y);
      }`,
    // the fill (see fillK above): more of the sky's own light on what looks at the lagoon and down at the water, near the eye only
    light: /* glsl */`
      if (uGwFill.x > 0.0) {
        vec3 gf = normalize(uKeyDir + vec3(0.0, -0.3, 0.0));
        float gfa = clamp(dot(N, gf) * 0.6 + 0.4, 0.0, 1.0);
        c += albedo * uSkyLight * (gfa * gfa * uGwFill.x * (1.0 - smoothstep(uGwFill.y, uGwFill.z, length(vViewPos))));
      }`,
  });
  const wear = () => { const g = grain(); return { opts: { brush: 0.6, rim: { color: '#FFB878', strength: 0.22, power: 4.5, toward: 1 }, caustics: { intensity: 0.3, height: 0.8, scale: 0.4, color: '#FFD2A6' }, extend: sun ? [sun.extend, g] : [g] }, inv: g.uniforms.uGwInv.value, wet: g.uniforms.uGwWet.value }; };
  const still = [];                                     // the models that stand still, and the matrix each one's grain is laid by
  const settle = (model, inv) => { model.group.updateMatrixWorld(true); inv.copy(model.group.matrixWorld).invert(); still.push([model.group, inv]); };

  // ---- THE ROTOR (source-art/models/reach/great_wheel_rotor.py): one mesh, modelled about its own hub with the axle
  // along Blender's Y (-Y the lagoon face), so that placed at the hub with no turn its front looks at the lagoon and
  // rotation.z = the wheel's angle turns it the way the gores turn (anticlockwise seen from the lagoon).
  // shared.wheel.rotor is the model's own group, as it was the stand-in's: whoever sets its rotation.z turns the wheel.
  let rotorInv, rotorWet, loose = null, hoist = null;
  {
    const w = wear();
    rotorWet = w.wet; rotorWet.set(wheel.angle, rimWet);
    const rotor = await kit.model('models/reach/' + (QS.get('gwfiles') || '') + 'great_wheel_rotor.glb', { position: W.hub, live: true, name: 'great wheel', ...w.opts });
    wheel.rotor = rotor.group; wheel.model = rotor; rotorInv = w.inv;
    points.rotor = rotor;
    rotor.group.rotation.z = wheel.angle;               // (turned from the first moment: a point asked for during the build is where it is now)
    // FOURTH LOOK: THE LOOSE BOARD (the rotor's one moving part, `loose_float`: the broken half of float 29, hung by a rope
    // bridle on the old drift bolt of its start, and left). It is modelled hanging straight down with the wheel at angle
    // 0, its pivot on the bolt; turned by MINUS the wheel's angle it hangs plumb all the way round (looseTurn adds its swing).
    loose = rotor.parts.loose_float || null;
    if (!loose) console.error('reach/heroes: the rotor has no part "loose_float" (great_wheel_rotor.py makes it)');
  }
  // How the loose board swings, by the wheel's phase alone (so a picture is the same picture twice). `a`: the wheel's
  // angle; `t`: the realm's clock. Its pivot is at LOOSE.at on the wheel, 14.62 m out: for 8.5 s at the bottom of every
  // turn its foot trails 0.3 m deep through the pit's water, the wheel drags it and it lags behind (`trail`: ten degrees,
  // which is what 0.8 m/s of water does to 44 kg of wet oak hung that way); when the water lets it go it swings as a
  // board 1.25 m long hung 0.3 m above its end swings (`period`), wide at first (it leaves the water trailing), dying
  // away over `settle` seconds, so that it is still swinging as it climbs past the pass and quiet over the top; and at
  // every moment a little (`rest`), because the wheel's own turning never lets it be quite still. With the wheel held
  // (&wheel=) it hangs plumb. A positive turn carries its foot NORTH (the way the rim travels at the bottom).
  const LOOSE = { at: (7.5 * 29 + 3.75) * Math.PI / 180, wet: 0.2217, trail: 0.17, period: 2.07, settle: 22, rest: 0.025, restPeriod: 2.31 };
  const looseTurn = (a, t) => {
    if (fixed != null) return -a;
    const k = ctx.reducedMotion ? 0.5 : 1;
    let d = (LOOSE.at + a - 1.5 * Math.PI) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU;      // the pivot's angle past the bottom of the turn
    let off = LOOSE.rest * Math.sin(TAU * t / LOOSE.restPeriod + 0.7);
    if (Math.abs(d) < LOOSE.wet) { const u = (d + LOOSE.wet) / (2 * LOOSE.wet); off -= k * LOOSE.trail * u * u * (3 - 2 * u); }      // in the water: dragged, trailing more and more
    else { const u = ((d - LOOSE.wet + TAU) % TAU) / TAU * W.period; off -= k * LOOSE.trail * Math.exp(-u / LOOSE.settle) * Math.cos(TAU * u / LOOSE.period); }      // let go: it swings, and settles
    return -a + off;
  };
  if (loose) {
    loose.rotation.z = looseTurn(wheel.angle, ctx.time || 0);
    // for the cast and staging: shared.wheel.loose = { part, tip(out): its foot now (a drip; a ring where it trails through
    // the pit), pivot(out): where it hangs from now, wet(): true while its foot is in the water }
    wheel.loose = { part: loose, tip: (out) => points.rotor.point('loose_tip', out), pivot: (out) => points.rotor.point('loose_pivot', out),
      wet: () => { let d = (LOOSE.at + wheel.angle - 1.5 * Math.PI) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return Math.abs(d) < LOOSE.wet; } };
  }
  // any place on the turning wheel, now (the wheel's own count of angle: arm i stands at i * TAU / 12 when its angle is 0)
  wheel.rim = (angle, radius, axial = 0, out = new THREE.Vector3()) => { const a = angle + wheel.angle; return out.set(hx + Math.cos(a) * radius, hy + Math.sin(a) * radius, hz + axial); };
  wheel.floatTip = (i, out = new THREE.Vector3()) => wheel.rim((i + 0.5) / W.floats.count * TAU, W.floats.reach, 0, out);

  // ---- THE FRAMES (source-art/models/reach/great_wheel_frames.py): two A-frames, one on each wall of the pier, on the
  // pier's stone footings; the axle's journals in the bearings astride their apexes. Modelled about the water under the
  // hub: placed there with no turn.
  {
    const w = wear();
    // (SIXTH LOOK: the hoist's rope and sling are a slot of their own, `line`, drawn crisp: they are thinner than the painter's brush)
    const frames = await kit.model('models/reach/' + (QS.get('gwfiles') || '') + 'great_wheel_frames.glb', { position: [hx, 0, hz], name: 'great wheel frames', ...w.opts, materials: { line: { crisp: true } } });
    points.frames = frames; settle(frames, w.inv);
    const a = frames.point('lean_foot'), b = frames.point('lean_head');          // the legs' lean, from the model itself
    lean.value = Math.atan2(Math.abs(b.x - a.x), b.y - a.y);
    // FOURTH LOOK: THE HOIST (the frames' one moving part, `hoist`: a rope from a gin block at the south end of the lagoon
    // frame's upper tie, a hook, and a basket of wet cloth left hanging half way up). Pivoted at the block; hoistSway below.
    hoist = frames.parts.hoist || null;
    if (!hoist) console.error('reach/heroes: the frames have no part "hoist" (great_wheel_frames.py makes it)');
  }
  // How the hoist sways: five metres of wet rope and a full basket, a pendulum of 4.5 s. Two swings of nearly the same
  // period at right angles (along the pier, and a third as much toward the frame, which it must not touch: it hangs
  // 0.11 m clear of the legs' wedges), so that its path opens and closes slowly, and the basket turning a little on its
  // rope. All by the realm's clock: the same picture twice. `push` (0 at rest) is for staging: a gust swings it wider.
  const HOIST = { along: 0.017, toward: 0.006, periodA: 4.5, periodB: 4.71, twist: 0.3, twistPeriod: 17, push: 0 };
  const hoistSway = (t) => {
    if (!hoist) return;
    const k = (ctx.reducedMotion ? 0.5 : 1) * (1 + HOIST.push);
    hoist.rotation.z = k * HOIST.along * Math.sin(TAU * t / HOIST.periodA + 0.4);
    hoist.rotation.x = Math.min(0.012, k * HOIST.toward) * Math.sin(TAU * t / HOIST.periodB + 1.9);
    hoist.rotation.y = HOIST.twist * Math.sin(TAU * t / HOIST.twistPeriod + 0.8);
  };
  if (hoist) {
    hoistSway(ctx.time || 0);
    // for the cast and staging: shared.wheel.hoist = { part, drip(out): under the basket now, block: where it hangs from,
    // push(k): swing it k times wider (a gust; 0 lets it settle: ease it yourself) }
    wheel.hoist = { part: hoist, drip: (out) => points.frames.point('hoist_drip', out), block: points.frames.point('hoist_block'), push: (k) => { HOIST.push = Math.max(0, +k || 0); } };
  }

  // ---- THE PIER (source-art/models/reach/wheel_pier.py): coursed stone 35 by 10 m with the pit, its two sluice arches,
  // steps and weir. Modelled about the water under the hub. Its north end lies inside the corridor (the boat passes that
  // close): the page's three colliders.
  {
    const w = wear();
    const pier = await kit.model('models/reach/' + (QS.get('gwfiles') || '') + 'wheel_pier.glb', { position: [hx, 0, hz], name: 'wheel pier', ...w.opts });
    points.pier = pier; settle(pier, w.inv);
    for (const [x, z, r] of W.colliders) ctx.addCollider({ x, z, r });
  }

  // &wheelpoints=1: every named point of the three models, where it is in the realm at this moment, to .shots/reach_wheel_points.json
  if (QS.has('wheelpoints')) {
    const out = {};
    for (const [k, m] of Object.entries(points)) { out[k] = {}; for (const name of Object.keys(m.points)) { const v = m.point(name); out[k][name] = [+v.x.toFixed(2), +v.y.toFixed(2), +v.z.toFixed(2)]; } }
    fetch('/__shot/reach_wheel_points.json', { method: 'POST', body: JSON.stringify(out, null, 1) }).catch(() => {});
  }

  // ---- the cloth: ten gores (the engine's makeGores; page: "the shape is exact and needs no simulation")
  const dyes = plan.dyes.map((d) => new THREE.Color(d.color));
  const scale = (place, out) => { const p = Math.min(5, Math.max(0, place)), i = Math.floor(p), f = p - i; return out.copy(dyes[i]).lerp(dyes[Math.min(5, i + 1)], f); };
  const arms = []; for (let i = 0; i < W.arms.pairs; i++) if (!W.arms.bare.includes(i)) arms.push(i);
  const now = arms.map(() => ({ top: new THREE.Color(), hem: new THREE.Color() }));
  const gores = makeGores(ctx, {
    hub: W.hub, axle: W.axle, angle: () => wheel.angle, rail: W.gores.rail, length: W.gores.length, floor: -W.floats.under, sway: W.gores.sway, backlight: 0.9, wind: shared.wind,
    gores: arms.map((i) => ({ arm: i / W.arms.pairs * TAU, lane: W.gores.lanes[Math.floor(i / 2) % 3] * (i % 2 ? -1 : 1), top: plan.colors.cream, hem: plan.colors.saffron })),
  });
  wheel.gores = gores; wheel.dyes = () => now;
  if (sun) sun.gores(gores, wheel.dyes, W.hub);
  // The river dyes it. Layout fixes each gore's two dyes by the rider's furthest progress alone (the page's cut 4):
  // the evening has reached place e of the dyer's scale; a gore's hem is at e, 0.6 of a place ahead of it or 0.6 behind
  // (its lag), and its top 0.4 of a place behind its hem. So at load the wheel wears cream, saffron and a first madder,
  // it never shows more than three neighbouring dyes at once, and no gore goes back up the scale.
  // (The monument's builder makes it step as each gore goes through the pit.)
  // FIFTH LOOK, FOR THE CAST (the header says how each is called). The page's dip-dye stepping ("each time its long end
  // goes through the pit its hem becomes the colour at place floor(e) - lag ... a gore never goes back up the scale") is
  // the cast's to make; until it sets shared.wheel.dyer the gores are dyed here, by progress alone, as layout left them.
  wheel.arms = arms.slice(); wheel.dyer = 'progress';
  wheel.setDye = (k, top, hem) => { const d = now[k]; if (!d) return; if (top) d.top.set(top); if (hem) d.hem.set(hem); gores.setDye(k, top ? d.top : null, hem ? d.hem : null); };
  wheel.place = (far) => dyePlace(far);
  const downs = (a, k) => Math.floor((a + arms[k] / W.arms.pairs * TAU - 1.5 * Math.PI) / TAU);      // whole turns of gore k's arm past straight down
  wheel.dips = (k) => (arms[k] == null ? 0 : downs(wheel.angle, k) - downs(W.phase, k));
  // The floats and the water of the pit. Float i's tip stands at (i + 0.5) * step + the wheel's angle round the hub; the
  // rim's 15.6 m circle cuts the water `cross` radians either side of straight down: in at PI + cross (south), out at
  // -cross (north). Nothing is called unless somebody asked (onFloat), and never while the wheel is held (&wheel=).
  const FL = { step: TAU / W.floats.count, cross: Math.asin(hy / W.floats.reach), fns: [], nIn: null, nOut: null, p: new THREE.Vector3() };
  wheel.wet = { leaves: -FL.cross, top: Math.PI / 2, enters: Math.PI + FL.cross };
  wheel.onFloat = (fn) => { FL.fns.push(fn); return () => { const i = FL.fns.indexOf(fn); if (i >= 0) FL.fns.splice(i, 1); }; };
  const floatsCross = (a) => {
    const nIn = Math.floor((a + 0.5 * FL.step - (Math.PI + FL.cross)) / FL.step), nOut = Math.floor((a + 0.5 * FL.step + FL.cross) / FL.step);
    if (FL.fns.length && FL.nIn != null) {
      for (const [n0, n1, into] of [[FL.nIn, nIn, true], [FL.nOut, nOut, false]]) {
        for (let n = Math.max(n0 + 1, n1 - 3); n <= n1; n++) {                                     // (a long frame: the last four at most)
          const i = ((-n % W.floats.count) + W.floats.count) % W.floats.count;
          FL.p.set(hx + Math.cos(into ? Math.PI + FL.cross : -FL.cross) * W.floats.reach, 0, hz);
          for (const fn of FL.fns.slice()) { try { fn(i, into, FL.p, wheel.missing.includes(i)); } catch (e) { console.error('reach/heroes: an onFloat listener threw: ' + e); } }
        }
      }
    }
    FL.nIn = nIn; FL.nOut = nOut;
  };

  // &wheelhooks=1: a listener of our own, to prove the hooks: the first dozen float boards at the water (which, which way,
  // where, when, the wheel's angle) and every gore's count of dips then, to .shots/reach_wheel_hooks.json
  if (QS.has('wheelhooks')) {
    const seen = []; let sent = false;
    wheel.onFloat((i, into, p, gone) => {
      if (sent) return;
      seen.push({ float: i, into, gone, x: +p.x.toFixed(2), z: +p.z.toFixed(2), t: +ctx.time.toFixed(2), angle: +(wheel.angle * 180 / Math.PI).toFixed(2), tipY: +wheel.floatTip(i).y.toFixed(3) });
      if (seen.length >= 12) { sent = true; fetch('/__shot/reach_wheel_hooks.json', { method: 'POST', body: JSON.stringify({ floats: seen, dips: arms.map((_, k) => wheel.dips(k)), wet: wheel.wet, place: wheel.place(sun ? sun.far : 0) }, null, 1) }).catch(() => {}); }
    });
  }

  let last = -1;
  const dyeBy = (far) => {
    if (wheel.dyer !== 'progress') return;              // the cast has taken the gores' dyes over
    const e = dyePlace(far), P = W.place;
    if (Math.abs(e - last) < 0.01) return;
    last = e;
    arms.forEach((_, k) => { const h = Math.min(5, Math.max(0, e + (1 - P.lags[k]) * P.lag)); scale(h, now[k].hem); scale(Math.max(0, h - P.top), now[k].top); gores.setDye(k, now[k].top, now[k].hem); });
  };
  dyeBy(sun ? sun.far : 0);

  return {
    update() {
      const a = wheel.angle;
      wheel.rotor.rotation.z = a;
      if (loose) loose.rotation.z = looseTurn(a, ctx.time);                                       // the loose board hangs plumb, and swings
      hoistSway(ctx.time);                                                                        // the hoist's basket sways on its rope
      wheel.rotor.updateMatrixWorld(true); rotorInv.copy(wheel.rotor.matrixWorld).invert();      // the grain turns with the timber
      rotorWet.x = wheel.angle;                                                                   // (and the soaking stays where the river is)
      for (const [g, inv] of still) inv.copy(g.matrixWorld).invert();                             // (and stays on the others wherever the engine puts the realm)
      if (fixed == null) floatsCross(a);                                                          // whoever asked is told of each float board at the water
      dyeBy(sun ? sun.far : ctx.s);
    },
  };
}
