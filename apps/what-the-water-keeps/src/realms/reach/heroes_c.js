// The dyers' reach: THE MACHINES (stage 2, the other hero pieces: everything at work except the monument).
// Page: docs/art/reach.md, sections 5 ("Machines"), 3 and 9. Log: docs/build/reach/2-heroes-machines.md.
// Models: source-art/models/reach/m_*.py (m_parts.py is their library), assets/models/reach/m_*.glb. Places and cycles:
// plan.machines (src/realms/reach/plan.js, under "the machines").
//
//   the wringers           nine great hand wheels on trestles, each wringing a skein of dyed yarn out over the water
//   the undershot wheels   two on the right terrace, each with its crown wheel of 48 pegs and lantern pinion of 12 staves
//                          in mesh; five small ones far down the sun road
//   the dipping beams      six well-sweeps for cloth: four in the water by the indigo quay and the blue yard, two on the terrace
//   the wringing gallery   40 m of timber gallery on piles in the lagoon, its line shaft, pulleys and rope belts turning
//   the tipping copper     a stave tub on trunnions on the top terrace, and its stone slipway down three lips to the lagoon
//   the lifting wheel      a noria 9 m across with sixteen bucket boxes, and the header trough they empty into
//
// SECOND LOOK (docs/build/reach/2-heroes-machines.md, "Second look"): every model here was remade or reworked heavier (the first
// were thin lines against the sky); the gallery is a building with a roof toward the water and a boarded back; the terrace's
// wheels have their low shed and its two dipping beams are geared to them.
//
// THIRD LOOK (same log, "Third look"): the skein is six cords of yarn that the shader winds into a laid rope; the gallery has its
// wrung hanks hung under the eaves (m_hank, one draw call), a boarded undercroft and roof vents; the copper's tub is painted
// inside; the river's dipping cloths go down into the water.
//
// THE LAW FOR MACHINES (page section 5). Nothing here starts: every machine is a clock, turned by PHASE with the creature
// toolkit's makeMachine / makeWaterWheel (docs/life/ribbons.md, "Old machinery"), already in the middle of its work when
// it is first seen, each on a phase of its own. A cue may only set a phase or ask a machine to ARRIVE at one
// (machine.arrive(p, seconds)); nothing speeds up, bounces or stops dead.
//
// HOW THEY ARE DRAWN. A kit machine stands in several places, and its parts move. kit.models would merge the moving parts
// where they stand, and nine kit.model copies would be a hundred draw calls a frame: `copies` below draws every copy of
// a model in ONE draw call for its body and one for each moving part, and still moves each part of each copy by itself.
// Where the toolkit wants an Object3D to turn (makeWaterWheel, gear().turn), `holder` gives it one for a copy's part.
//
// shared.machines (for the cast and staging):
//   .wringers[i] = { name, s, d, dye (0..5), machine (the toolkit's: .value = turns of twist now, .at, .arrive(p, seconds), .setPhase),
//                    twist() 0..1, hub: Vector3, gutterLip: Vector3 (where its gutter spills: a pour for the cast),
//                    hookA(target), hookB(target) (the skein's two ends NOW: its drops fall along the line between them),
//                    tail(target) (the end of its tail, under the post's hook: where it drips), drip: { a, b } }
//   .undershot[i] = { name, s, drive (the take-off drum in its low shed: a rope runs from it to the beam it works), wheel (the toolkit's water wheel: .at, .angle, .period, .every(p, fn), .object = its drops),
//                     pinion (the lantern's shaft), centre, waterIn, waterOut (where the float tips cut the water), mesh
//                     (where pegs meet staves), axleEnd: Vector3s; fly(target): the fly's hub now }
//   .farWheels[i] = { wheel, centre }
//   .copper = { model, machine (.value = degrees of tilt now, 0 .. 55; a 48 s cycle: it pours while it stands at 55), tilt(),
//               lip(target): the middle of its pouring lip NOW, head: where the pour lands, lips: [Vector3 x 3]: the slipway's three
//               lips (a sheet of dye falls from each), foot: where the last fall meets the lagoon, fill, toward: the way it runs }
//   .liftingWheel = { model, wheel (the toolkit's: one turn in 20 s; wheel.every(k / 16, fn) is a bucket coming over), centre, tip
//                     (where a bucket empties into the header), spill (the spill board's lip), headerOut (where the header gives into
//                     the launder), leaks: [Vector3], waterIn, waterOut, bucket(i, target): the mouth of bucket i NOW, buckets: 16 }
//   .gallery = { model (kit.model: .point('drip0'..'drip9'), 'counter0..4', 'wringer0..4', 'shaft_end', 'ladder_foot', 'tub0..2', 'door0..1'), tubs, doors, line (the line
//                shaft's machine), floor, frame(u, v, y), drips: [Vector3] (where the floor drips), keep: [{ u, v: [from, to], half }],
//                hanks: [{ x, y, z, dye }] (the lowest point of each wrung hank hung under the eaves: where it drips), vents: [Vector3 x 2]
//                (the two roof vents over the dye tubs: steam leaves there) }
//   .dippers[i] = { name, s, d, dye, machine (.value 0 down in the dye .. 1 held up; .at; a 40 s cycle; the terrace's two are GEARED:
//                   .geared, .wheel: their cycle is 2.5 turns of the terrace wheel beside them, and only that wheel can be cued), lifted(), turned (0 fresh
//                   from the dye .. 1 its own colour), level (the liquor's surface), pin, dipAt: Vector3 (where the cloth goes in),
//                   tip(target), hem(target): the beam's tip and the middle of the cloth's hem NOW (its drops fall from the hem) }
// Stand-ins taken out here (they are made in kit.js, after this module is built: so they are taken out in the first updates):
//   'wringers', 'skeins', 'undershot wheels', 'far wheels', 'dipping beams', 'dipping cloths'; and heroes_b.js's 'wringing gallery', 'lifting wheel', 'tipping copper'.
// Developer switches: &wring=<turns> holds every wringer at that twist (0 .. 3.5), for stills; &grain=0 the models' paint
// alone, without the painted oak and stone; &mcount=1 says (as a page error, so that the picture tool prints it) how many hanks hang.
import * as THREE from 'three';
import { removeStandIn } from '../../engine/modules.js';
import { makeMachine, makeWaterWheel, makeRotors } from '../../engine/life/machines.js';
import { makeRopes } from '../../engine/life/ropes.js';

const TAU = Math.PI * 2;
const QS = new URLSearchParams(typeof location !== 'undefined' ? location.search : '');
const clamp01 = (v) => Math.min(1, Math.max(0, v));

export async function build(ctx, plan, shared) {
  const { kit, path } = ctx, M = plan.machines, D = plan.dyes, sun = shared.sun;
  const out = (shared.machines = shared.machines || {});
  // What every machine wears: the reach's solid material (set.js: matte, a thin warm rim against the sun, water-light at
  // its foot, the dyed light only inside the bar), and THE GRAIN: the reach's painted `timber` sheet, the same two
  // pictures the monument and the dye yards wear (heroes.js, kit_yards.js), laid on by what each piece is made of. A
  // model of mine says that in its UVs (source-art/models/reach/m_parts.py, "the grain"): u < 0.05 as painted (iron,
  // rope, copper) or, with v > 0.95, dressed stone; otherwise oak, and (u, v) is the way ITS OWN grain runs: a post's up
  // the post, a brace's along the brace, a felloe's along its chord. It is laid in each part's own space (the point as
  // modelled), so it turns with a wheel and rides on a beam, and only in the fragment shader, so the sun's mask still
  // counts every timber as solid (light.js). Each picture is divided by its own mean: the paint keeps its value.
  let tStone = null, tOak = null;
  if (QS.get('grain') !== '0') {
    try { [tStone, tOak] = await Promise.all([ctx.tex('art/reach/timber_stone.webp', { repeat: true }), ctx.tex('art/reach/timber_oak.webp', { repeat: true })]); }
    catch (e) { tStone = tOak = null; console.error('reach/heroes_c: the timber pictures did not load (the machines wear their paint alone): ' + e); }
  }
  const GRAIN = {
    // uMgTex: stone repeats per metre, oak repeats per metre, the stone's strength, the oak's
    uniforms: { tMgStone: { value: tStone }, tMgOak: { value: tOak }, uMgTex: { value: new THREE.Vector4(1 / 2.4, 1 / 1.7, tStone ? 0.62 : 0, tOak ? 0.7 : 0) } },
    // aMgCopy: a number of its own for each copy of a kit machine (0 where there is one), so that no two wear the same boards
    vertexPars: 'attribute float aMgCopy; varying vec3 vMgP; varying vec3 vMgN;',
    vertexLocal: 'vMgP = position + aMgCopy * vec3(0.37, 0.11, 0.53); vMgN = normal;',
    fragmentPars: 'uniform sampler2D tMgStone, tMgOak; uniform vec4 uMgTex; varying vec3 vMgP; varying vec3 vMgN;',
    albedo: /* glsl */`{
      vec2 gk = vUv0; vec3 ln = normalize(vMgN);
      float near = 1.0 - 0.6 * smoothstep(18.0, 55.0, length(vViewPos));      // the grain is for the near view: from across the lagoon it would only mottle the timber
      if (gk.x > 0.05) {
        if (uMgTex.w > 0.0) {
          vec2 g2 = (gk - 0.5) / 0.4;
          vec3 ax = normalize(vec3(g2.x, sqrt(max(1.0 - dot(g2, g2), 0.0)), -g2.y));      // Blender's (x, y, z) is the ride's (x, z, -y)
          vec3 e1 = normalize(cross(ax, abs(ax.y) < 0.9 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0))), e2 = cross(e1, ax);
          vec3 q = vec3(dot(vMgP, e1), dot(vMgP, ax), dot(vMgP, e2)), m = vec3(dot(ln, e1), dot(ln, ax), dot(ln, e2));      // q.y runs along the grain
          vec3 tx = tri(tMgOak, q * uMgTex.y, m) / vec3(0.179, 0.054, 0.086);
          albedo *= clamp(mix(vec3(1.0), mix(vec3(dot(tx, vec3(0.3333))), tx, 0.45), uMgTex.w * near), 0.3, 2.0);
        }
      } else if (gk.y > 0.95 && uMgTex.z > 0.0) {
        vec3 tx = tri(tMgStone, vMgP * uMgTex.x, ln) / vec3(0.392, 0.129, 0.153);
        albedo *= clamp(mix(vec3(1.0), mix(vec3(dot(tx, vec3(0.3333))), tx, 0.3), uMgTex.z * near), 0.3, 2.0);
      }
    }`,
  };
  const TIMBER = { brush: 0.6, rim: { color: '#FFB878', strength: 0.22, power: 4.5, toward: 1 }, caustics: { intensity: 0.3, height: 0.8, scale: 0.4, color: '#FFD2A6' }, extend: sun ? [sun.extend, GRAIN] : [GRAIN] };

  // ================================================================================================ copies of a machine
  const _q = new THREE.Quaternion(), _e = new THREE.Euler(), _s = new THREE.Vector3();
  // the wringing gallery's own frame (it is a straight building: plan.gallery.at is its middle, its long side lies along the
  // route there): (u along it, v toward its back, y) -> the realm's coordinates. heroes_b.js's stand-in used the same.
  const G = plan.gallery, gAt = path.at(G.at[0], {}), gO = kit.at(G.at[0], G.at[1]);
  const gallery = (u, v, y = 0, target = new THREE.Vector3()) => target.set(gO.x + gAt.tx * u + gAt.rx * v, y, gO.z + gAt.tz * u + gAt.rz * v);
  const galleryFace = kit.faceAngle('channel', G.at[0], G.at[1]);
  /** The matrix of a placement: { at: [s, d], y, turn (added to facing the channel), tilt: [x, z], scale } or { position, turn } or { gallery: [u, v] }. */
  const placed = (p) => {
    const pos = p.position ? new THREE.Vector3(p.position[0], p.position[1], p.position[2]) : p.gallery ? gallery(p.gallery[0], p.gallery[1], p.y ?? G.floor) : kit.at(p.at[0], p.at[1], p.y ?? 0);
    const ry = (p.at ? kit.faceAngle('channel', p.at[0], p.at[1]) : p.gallery ? galleryFace : 0) + (p.turn || 0);
    _q.setFromEuler(_e.set(p.tilt ? p.tilt[0] : 0, ry, p.tilt ? p.tilt[1] : 0, 'YXZ'));
    return new THREE.Matrix4().compose(pos, _q, Array.isArray(p.scale) ? _s.set(p.scale[0], p.scale[1], p.scale[2]) : _s.setScalar(p.scale ?? 1));
  };
  /**
   * Every copy of one model in one draw call a mesh, its moving parts still moving. `list`: placements (each may carry
   * `tint`); `mats`: gouache options by mesh name { wheel: {...} } (a mesh may be given a ready material).
   * Returns { n, base[i], meshes: { name: InstancedMesh }, rest: { name: Matrix4 }, move(name, i, matrix): set a part's
   * motion in its own space (about its pivot), put(name, i, matrix): set its whole matrix, flush(),
   * point(name, i, target): where a named point of the model is now }.
   */
  const copies = async (url, list, mats = {}) => {
    const t = await kit.model(url, { position: [0, 0, 0], ...TIMBER });
    ctx.group.remove(t.group); t.group.updateMatrixWorld(true);         // the template is read, never drawn
    const stem = url.split('/').pop().replace(/\.glb$/, ''), n = list.length, base = list.map(placed);
    const group = new THREE.Group(); group.name = stem + ' x' + n;
    const meshes = {}, rest = {}, now = {}, dirty = new Set(), c = new THREE.Color();
    t.group.traverse((o) => {
      if (!o.isMesh) return;
      const name = o.name === stem ? 'body' : o.name, given = mats[name];
      const mat = given && given.isMaterial ? given : given ? kit.gouache({ vertexColors: true, ...TIMBER, ...given }) : o.material;
      const im = new THREE.InstancedMesh(o.geometry, mat, n);
      im.name = stem + ':' + name; im.frustumCulled = false;
      rest[name] = o.matrixWorld.clone(); now[name] = base.map((b) => new THREE.Matrix4().multiplyMatrices(b, rest[name]));
      for (let i = 0; i < n; i++) im.setMatrixAt(i, now[name][i]);
      if (list.some((p) => p.tint)) { list.forEach((p, i) => im.setColorAt(i, c.set(p.tint || '#ffffff'))); im.instanceColor.needsUpdate = true; }
      if (name !== 'body') im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      if (!o.geometry.attributes.aMgCopy) o.geometry.setAttribute('aMgCopy', new THREE.InstancedBufferAttribute(Float32Array.from({ length: n }, (_, i) => i * 0.618 + 0.3), 1));      // (GRAIN)
      meshes[name] = im; group.add(im);
    });
    const points = {};
    for (const k in t.points) { const p = t.points[k], on = p.parent && p.parent.isMesh ? (p.parent.name === stem ? 'body' : p.parent.name) : null; points[k] = { on, local: on ? p.position.clone() : new THREE.Vector3().setFromMatrixPosition(p.matrixWorld) }; }
    ctx.add(group);
    return {
      n, base, meshes, body: meshes.body, rest, now, group,
      move(name, i, motion) { now[name][i].multiplyMatrices(base[i], rest[name]).multiply(motion); meshes[name].setMatrixAt(i, now[name][i]); dirty.add(name); },
      put(name, i, matrix) { now[name][i].copy(matrix); meshes[name].setMatrixAt(i, matrix); dirty.add(name); },
      flush() { for (const name of dirty) meshes[name].instanceMatrix.needsUpdate = true; dirty.clear(); },
      point(name, i, target = new THREE.Vector3()) { const p = points[name]; return p ? target.copy(p.local).applyMatrix4(p.on ? now[p.on][i] : base[i]) : target.setFromMatrixPosition(base[i]); },
    };
  };
  /** An Object3D that stands where a copy's part stands: the toolkit turns it, and every frame the copy takes its matrix. */
  const holders = [];
  const holder = (set, name, i) => {
    const o = new THREE.Object3D(); o.name = `holder:${name}`;
    set.now[name][i].decompose(o.position, o.quaternion, o.scale);
    ctx.add(o); o.updateMatrixWorld(true);
    holders.push({ o, set, name, i });
    return o;
  };

  // ================================================================================================ the wringers
  // A skein is wrung in the vertex shader about the line between its two hooks (the model's skein hangs slack between
  // them: source-art/models/reach/m_wringer.py: six cords of yarn round one middle line, stray turns looped under them).
  // aWring: the twist at the wheel's end (radians), how far through the wringing (0 slack .. 1 wrung), nothing. Every
  // cord is WOUND ROUND THE HANK'S OWN MIDDLE LINE (third look: it was turned about the straight line between the hooks
  // while it still sagged, a skipping rope for its first turn) and drawn in toward it: whatever hangs out of the bundle,
  // however far, ends inside a rope `rope` metres thick, the outermost still outermost: a laid rope of six. The sag goes
  // out of the middle line in the first turn; it shortens as the square of the twist (an eighth at full twist), and the
  // post it hangs on leans in with it. The end in the post's hook does not turn: its tail hangs.
  const W = M.wring;
  const WRING = {
    defines: { SKEIN_L: W.length.toFixed(3), SKEIN_SAG: W.sag.toFixed(3), SKEIN_ROPE: W.rope.toFixed(3), SKEIN_SHORT: W.shorten.toFixed(4) },
    vertexPars: /* glsl */`attribute vec3 aWring; varying float vWrung;`,
    vertexLocal: /* glsl */`{
      float u = clamp(transformed.z / SKEIN_L, 0.0, 1.0), k = aWring.y;
      float bell = sin(3.14159265 * u), grip = smoothstep(0.0, 0.16, u) * (1.0 - smoothstep(0.84, 1.0, u)), tight = pow(k, 0.7) * grip;
      // the hank's middle line as it was modelled, and the point's place round it
      vec2 c = vec2(0.0, -SKEIN_SAG * pow(bell, 0.9)), o = transformed.xy - c;
      c.y *= 1.0 - smoothstep(0.0, 0.3, k);                                     // the slack is taken up first
      float r = max(length(o), 1.0e-4), rw = SKEIN_ROPE * tanh(r / SKEIN_ROPE * 0.85);
      o *= mix(1.0, rw / r, tight);                                             // then it is wrung thin: all of it into the rope
      float a = aWring.x * (1.0 - u), ca = cos(a), sa = sin(a);                 // the wheel's end turns, the post's end is held
      transformed.xy = c + vec2(ca * o.x - sa * o.y, sa * o.x + ca * o.y);
      transformed.z *= 1.0 - SKEIN_SHORT * k * k;
      objectNormal.xy = vec2(ca * objectNormal.x - sa * objectNormal.y, sa * objectNormal.x + ca * objectNormal.y);
      vWrung = k * grip;
    }`,
    fragmentPars: /* glsl */`varying float vWrung;`,
    albedo: /* glsl */`albedo *= mix(1.0, 0.72, vWrung);`,                      // wrung yarn is darker: the dye is pressed to its surface
  };
  const hold = QS.has('wring') ? Math.max(0, Math.min(W.turns, +QS.get('wring'))) : null;
  const wringers = [], sets = [];
  for (const file of [...new Set(M.wringers.map((w) => w.file))]) {
    const list = M.wringers.filter((w) => w.file === file);
    const skeinMat = kit.gouache({ vertexColors: true, brush: 0.45, backlight: 0.5, backColor: '#ffd9b4', rim: TIMBER.rim, extend: [sun ? sun.extend : null, WRING] });
    const set = await copies(`models/reach/m_wringer_${file}.glb`, list, { skein: skeinMat });
    // the skein: its own instanced state, and each one the colour of the dye it carries
    const src = set.meshes.skein.geometry, g = new THREE.BufferGeometry();
    for (const k in src.attributes) g.setAttribute(k, src.attributes[k]);
    g.setIndex(src.index);
    const aWring = new THREE.InstancedBufferAttribute(new Float32Array(list.length * 3), 3); aWring.setUsage(THREE.DynamicDrawUsage);
    g.setAttribute('aWring', aWring); set.meshes.skein.geometry = g;
    if (sun) sun.solid(set.meshes.skein, false);
    const c = new THREE.Color();
    list.forEach((w, i) => { set.meshes.skein.setColorAt(i, c.set(D[w.dye].color).multiplyScalar(1.12)); });
    set.meshes.skein.instanceColor.needsUpdate = true;
    sets.push({ set, list, aWring });
    list.forEach((w, i) => {
      const machine = makeMachine(ctx, { steps: W.steps, phase: w.phase });
      const lever = set.point('hook_b', i).y - new THREE.Vector3().setFromMatrixPosition(set.now.post[i]).y;      // the hook above the post's foot
      const here = path.locate(set.base[i].elements[12], set.base[i].elements[14], null, {});
      const me = {
        name: w.name, s: here.s, d: here.d, dye: w.dye, machine, lever, way: w.way || 1,
        twist: () => clamp01((hold ?? machine.value) / W.turns),
        hub: set.point('hub', i), gutterLip: set.point('gutter_lip', i),
        hookA: (target) => set.point('hook_a', i, target), hookB: (target) => set.point('hook_b', i, target),
        tail: (target) => set.point('tail', i, target),          // the end of the skein's tail, under the post's hook: where it drips
      };
      me.drip = { a: me.hookA(new THREE.Vector3()), b: me.hookB(new THREE.Vector3()) };
      if (w.collide) ctx.addCollider({ x: me.drip.b.x, z: me.drip.b.z, r: w.collide });      // its post stands in the boat's water
      wringers.push(me);
    });
  }
  out.wringers = wringers;

  // ================================================================================================ the undershot wheels
  // Two on the right terrace, in the 1.6 m of water between the terrace's wall and the channel: the toolkit's water wheel
  // turns each by the water under it (its floats shed drops that ring the water), and gear() keeps the lantern's staves
  // between the crown wheel's pegs (models/reach/m_undershot.glb is arranged exactly as models/life/gear_pair.glb).
  const U = M.undershot;
  {
    const list = U.near.map((u) => ({ at: [u.s, kit.halfWidth(u.s) + U.wall], y: 0, turn: 0 }));
    const set = await copies('models/reach/m_undershot.glb', list);
    out.undershot = U.near.map((u, i) => {
      const rotor = holder(set, 'rotor', i), lantern = holder(set, 'lantern', i);
      const wheel = makeWaterWheel(ctx, { object: rotor, radius: U.radius, width: U.width, floats: U.floats, flow: U.flow, slip: u.slip ?? U.slip, phase: u.phase, drips: U.drips, dripColor: U.dripColor, seed: 31 + i * 7 });
      // the crown wheel is on the wheel's own axle: its angle as it was modelled (about the part's own z) is the wheel's
      // angle, or its negative when the placed part's axis points the other way along the axle
      const z = new THREE.Vector3(0, 0, 1).transformDirection(rotor.matrixWorld), sign = z.x * wheel.axle.x + z.z * wheel.axle.y >= 0 ? 1 : -1;
      const pinion = wheel.with(sign).gear({ teeth: U.teeth, at: Math.PI / 2, atOther: Math.PI / 2, sign: 1 });
      pinion.turn(lantern, { axis: 'y' });
      return { name: u.name, s: u.s, wheel, pinion, centre: wheel.centre.clone(), waterIn: set.point('water_in', i), waterOut: set.point('water_out', i), mesh: set.point('mesh', i), axleEnd: set.point('axle_end', i), drive: set.point('drive', i), fly: (target) => set.point('fly', i, target) };
    });
  }
  // ---- the five far wheels down the sun road: the same wheel in 700 triangles, each turned a little toward the lagoon
  {
    const F = U.far, k = Math.sin(F.turn * Math.PI / 180), q = Math.cos(F.turn * Math.PI / 180);
    const fronts = plan.farWheels.map(([x]) => [(x < plan.sunRoad.x[0] + 12 ? 1 : -1) * q, k]);        // toward the road's middle, and back toward the lagoon
    const list = plan.farWheels.map(([x, z, across], i) => ({ position: [x, 0, z], turn: Math.atan2(fronts[i][0], fronts[i][1]), scale: across / (U.radius * 2), tint: F.tint[i] }));
    const set = await copies('models/reach/m_undershot_far.glb', list);
    out.farWheels = plan.farWheels.map(([x, z, across], i) => {
      const rotor = holder(set, 'rotor', i), R = across / 2;
      const wheel = makeWaterWheel(ctx, { object: rotor, radius: R, width: U.width * R / U.radius, floats: U.floats, flow: 1, slip: TAU * R / F.periods[i], flowDir: [0, -1], axle: fronts[i], phase: F.phases[i], drips: 0, rings: false });
      return { wheel, centre: wheel.centre.clone() };
    });
  }

  // ================================================================================================ the wringing gallery
  let hankWind = null;                                                           // (third look) the wind on the gallery's hung hanks: set below, eased every frame
  // One model (kit.model: it stands once). Its line shaft turns by the toolkit's makeMachine; the five counter pulleys
  // behind the wringers' axles are the toolkit's makeRotors (one geometry, five places, one draw call), turning by the belt.
  {
    const gal = await kit.model('models/reach/m_gallery.glb', { at: [G.at[0], G.at[1], 0], face: 'channel', ...TIMBER, materials: { thin: { crisp: true } } });
    removeStandIn(ctx, 'wringing gallery');                                    // heroes_b.js's stand-in (it is built before this module)
    const line = makeMachine(ctx, { period: M.gallery.shaft, phase: 0.2 });
    line.turn(gal.parts.shaft, { axis: 'x' });
    const cp = gal.parts.counter, front = new THREE.Vector3(0, 0, 1).transformDirection(gal.group.matrixWorld);      // the wringers' axles lie along the gallery's front
    cp.visible = false;
    const counters = makeRotors(ctx, { geometry: cp.geometry, material: { ...TIMBER, crisp: true, extend: null }, turnsAbout: 'z',
      items: [0, 1, 2, 3, 4].map((i) => ({ at: gal.point('counter' + i).toArray(), axle: [front.x, 0, front.z], period: M.gallery.shaft * M.gallery.counter / M.gallery.drive * (i % 2 ? -1 : 1), phase: i * 0.23 })) });
    // ---- (third look) THE GALLERY'S HANKS. Under its eaves, between the wheels, five poles hang out over the water (the model's
    // `hpole<i>a/b`), and on them the hanks that have been wrung, left to drip into the lagoon: the red that the key painting's
    // right bank is hung with. One small model (m_hank: a loop of yarn with a turn and a half in it) hung about thirty times in
    // ONE draw call, each its own length, girth, turn and shade of its dye. Each swings a little by itself (a pendulum of its own
    // period: nothing in step with its neighbour), and a FRONT of the reach's wind (set.js: shared.wind: the first breath, the
    // great gust) leans them all downwind and holds them there until the wind drops, like the cloth round them.
    const HK = M.gallery.hanks, rnd = ctx.rng(HK.seed), hlist = [], hankDrips = [], hc = new THREE.Color();
    for (let i = 0; i < HK.poles; i++) {
      const a = gal.point('hpole' + i + 'a'), b = gal.point('hpole' + i + 'b'), n = Math.max(2, Math.round(a.distanceTo(b) / HK.every));
      // they hang in BUNCHES, shoulder to shoulder, as they were thrown over the pole: a bunch of one dye and nearly one length,
      // then a bare stretch of pole (evenly spaced, one by one, they read as red ticks on a rail)
      let k = Math.floor(rnd() * 2);
      while (k < n) {
        const run = HK.bunch[0] + Math.floor(rnd() * (HK.bunch[1] - HK.bunch[0] + 1)), dye = HK.dyes[Math.floor(rnd() * HK.dyes.length) % HK.dyes.length];
        const long0 = HK.long[0] + (HK.long[1] - HK.long[0]) * rnd(), tone0 = HK.tone[0] + (HK.tone[1] - HK.tone[0]) * rnd();
        for (let j = 0; j < run && k < n; j++, k++) {
          const v = rnd(), w = rnd(), x = rnd();
          const p = a.clone().lerp(b, (k + 0.5 + (v - 0.5) * 0.5) / n), long = long0 * (0.9 + 0.2 * w), fat = HK.fat[0] + (HK.fat[1] - HK.fat[0]) * x;
          hlist.push({ position: [p.x, p.y, p.z], turn: galleryFace + (w - 0.5) * 1.5, scale: [fat, long, fat], tint: '#' + hc.set(D[dye].color).multiplyScalar(tone0 * (0.92 + 0.16 * v)).getHexString() });
          hankDrips.push({ x: p.x, y: p.y - HK.drip * long, z: p.z, dye });     // its lowest point: where it drips (for the cast)
        }
        k += HK.bare[0] + Math.floor(rnd() * (HK.bare[1] - HK.bare[0] + 1));
      }
    }
    const uHankWind = { value: new THREE.Vector3(0, -1, 0) };                    // xy: the way the wind blows TO (x, z); z: how hard a front holds them now
    const HANG = {
      uniforms: { uHankWind, uHankCalm: { value: ctx.reducedMotion ? 0.5 : 1 } },
      vertexPars: 'uniform vec3 uHankWind; uniform float uHankCalm; float hkDepth;',
      vertexLocal: /* glsl */`{
        hkDepth = max(0.0, -transformed.y);                                     // metres below the pole it hangs on
        float ph = aMgCopy * 2.399, w0 = 2.1 + 0.9 * fract(aMgCopy * 0.37);
        float sw = uHankCalm * (0.03 * sin(uTime * w0 + ph) + 0.012 * sin(uTime * w0 * 1.83 + ph * 1.7)) * hkDepth;      // (GRAIN gives every copy its own number: aMgCopy)
        transformed.x += sw; transformed.z += 0.6 * sw * cos(ph * 0.7);
      }`,
      vertexWorld: /* glsl */`{
        float g = uHankWind.z * (0.75 + 0.25 * sin(uTime * 2.7 + wp.x * 0.9 + wp.z * 0.7)) * uHankCalm;
        wp.xz += uHankWind.xy * g * 0.62 * hkDepth; wp.y += g * g * 0.2 * hkDepth;      // held downwind, a little lifted: wet yarn is heavy
      }`,
    };
    try {
      const hankSet = hlist.length ? await copies('models/reach/m_hank.glb', hlist, { body: { brush: 0.45, backlight: 0.4, backColor: '#ffd9b4', caustics: null, extend: [sun ? sun.extend : null, GRAIN, HANG].filter(Boolean) } }) : null;
      if (hankSet && sun) sun.solid(hankSet.body, false);                          // (it moves in a shader of its own: it is not counted as hiding the sun)
    } catch (e) { hankDrips.length = 0; console.error('reach/heroes_c: the gallery\'s hanks were not hung (the machines stand without them): ' + (e && e.message || e)); }      // (the hanks are dress: nothing else of the machines may fall with them)
    if (QS.has('mcount')) console.error(`reach/heroes_c (asked with &mcount): ${hlist.length} hanks hang on the gallery's ${HK.poles} poles`);
    hankWind = { u: uHankWind, at: gO.clone(), held: 0 };
    out.gallery = { model: gal, line, counters, floor: G.floor, frame: gallery, drips: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => gal.point('drip' + i)), ladderFoot: gal.point('ladder_foot'),
      hanks: hankDrips, vents: [0, 1].map((i) => gal.point('vent' + i)),        // (third look) where each hung hank drips; the two roof vents over the tubs (steam leaves there)
      tubs: [0, 1, 2].map((i) => gal.point('tub' + i)), doors: [0, 1].map((i) => gal.point('door' + i)),      // the liquor in its three dye tubs (steam); its two doorways at the floor
      // for whoever stands things on its floor: the wringers' trestles (u along it from its middle, v toward its back; each 3 m wide, from v -2.3 to 1.0), their counter posts behind them (v 0.5 to 1.3)
      keep: M.wringers.filter((w) => w.gallery).map((w) => ({ u: w.gallery[0], v: [-2.4, 1.4], half: 1.6 })) };
  }

  // ================================================================================================ the tipping copper and its slipway
  // The tub tips on its trunnions by the toolkit's cycle (55 degrees in 6 s, held 4, back in 8, standing 30); the rope from
  // the windlass to the ring on its back rim always reaches (turned and stretched).
  {
    const K = M.copper, _P = {}, _Q = {};
    // a place on the bank as the LAND is laid (set.js, `ribbon`): far from the water it follows the broad sweep of the route
    const land = (s, out, target = new THREE.Vector3()) => {
      const p = path.at(s, _P); let ax = p.rx, az = p.rz;
      if (out > 6) {
        let sx = 0, sz = 0;
        for (let j = -4; j <= 4; j++) { const q = path.at(Math.min(path.length, Math.max(0, s + out * 1.5 * j / 4)), _Q); sx += q.rx; sz += q.rz; }
        const l = Math.hypot(sx, sz) || 1, t = Math.min(1, Math.max(0, (out - 6) / 24)), k = t * t * (3 - 2 * t);
        ax = p.rx + (sx / l - p.rx) * k; az = p.rz + (sz / l - p.rz) * k;
      }
      return target.set(p.x + p.rx * p.halfWidth + ax * out, 0, p.z + p.rz * p.halfWidth + az * out);
    };
    const tubAt = land(K.s, K.out), footAt = land(K.s, K.foot), front = footAt.clone().sub(tubAt).normalize();      // its slipway runs straight down the steps to the water
    const cu = await kit.model('models/reach/m_copper.glb', { position: [tubAt.x, 0, tubAt.z], rotation: Math.atan2(front.x, front.z), ...TIMBER });
    removeStandIn(ctx, 'tipping copper');
    const machine = makeMachine(ctx, { steps: K.steps, phase: K.phase }), tub = cu.parts.tub, rope = cu.parts.rope, RAD = Math.PI / 180;
    // (second look: tipped, the tub's back swings across the straight line from the windlass to the ring, and the first rope
    // ran through the tub: a pale line down its red inside. The rope now goes to the foot of the tub's back and lies up the
    // back from there: a second length of the same rope, shown only while it is wrapped.)
    const rope2 = rope.clone(); rope2.name = 'rope_on_tub'; rope2.visible = false; rope.parent.add(rope2);
    machine.drive(() => {
      const th = machine.value * RAD, cs = Math.cos(th), sn = Math.sin(th);
      tub.rotation.x = th;                                                       // a positive turn about its own x tips its lip toward the water
      // the ring on its back rim and the foot of its back, in the model's own side view (behind the trunnions, above the water)
      const ry = K.ring[0] * cs - K.ring[1] * sn, rz = K.trunnion + K.ring[0] * sn + K.ring[1] * cs;
      const cy = K.chine[0] * cs - K.chine[1] * sn, cz = K.trunnion + K.chine[0] * sn + K.chine[1] * cs;
      const wrapped = (ry - K.drum[0]) * (cz - K.drum[1]) - (rz - K.drum[1]) * (cy - K.drum[0]) < 0;      // the tub's foot has crossed the line from drum to ring
      const ey = wrapped ? cy : ry, ez = wrapped ? cz : rz, dy = ez - K.drum[1], dz = K.drum[0] - ey;
      rope.rotation.x = Math.atan2(dz, dy); rope.scale.y = Math.hypot(dy, dz);
      rope2.visible = wrapped;
      if (wrapped) { rope2.position.set(rope.position.x, rope.position.y + cz - K.drum[1], rope.position.z - (cy - K.drum[0])); rope2.rotation.x = Math.atan2(cy - ry, rz - cz); rope2.scale.y = Math.hypot(rz - cz, cy - ry); }
    });
    out.copper = { model: cu, machine, tilt: () => machine.value, lip: (target) => cu.point('lip', target), head: cu.point('head'), lips: [cu.point('lip1'), cu.point('lip2'), cu.point('lip3')], foot: cu.point('foot'), fill: cu.point('fill'), toward: front };
  }

  // ================================================================================================ the lifting wheel and its header
  // A noria: the river turns it (the toolkit's water wheel) and its sixteen bucket boxes lift the river to the header trough.
  {
    const LW = M.liftingWheel, e0 = kit.at(LW.along[0], kit.halfWidth(LW.along[0]) + LW.out), e1 = kit.at(LW.along[1], kit.halfWidth(LW.along[1]) + LW.out);
    const up = e0.clone().sub(e1).normalize(), at = kit.at(LW.s, kit.halfWidth(LW.s) + LW.out);       // it lies along the channel's edge: its +X is upstream
    const lw = await kit.model('models/reach/m_liftwheel.glb', { position: [at.x, 0, at.z], rotation: Math.atan2(-up.z, up.x), ...TIMBER });
    removeStandIn(ctx, 'lifting wheel');
    const wheel = makeWaterWheel(ctx, { object: lw.parts.rotor, radius: LW.radius, width: LW.width, floats: LW.floats, flow: LW.flow, slip: LW.slip, flowDir: [-up.x, -up.z], phase: LW.phase, drips: LW.drips, dripColor: LW.dripColor, seed: 91 });
    out.liftingWheel = { model: lw, wheel, centre: wheel.centre.clone(), tip: lw.point('tip'), spill: lw.point('spill'), headerOut: lw.point('header_out'), waterIn: lw.point('water_in'), waterOut: lw.point('water_out'),
      leaks: [0, 1, 2].map((i) => lw.point('leak' + i)), bucket: (i, target) => lw.point('bucket' + i, target), buckets: LW.buckets };
  }

  // ================================================================================================ the dipping beams
  // A beam rocks on its pin; the cradle and its cloth hang from the tip and swing a little; a rope from the butt is wound
  // on the windlass, whose crank turns as it winds (the motions are linked: the rope always reaches the butt). The cloth is
  // dyed in the shader: green-gold as it leaves the liquor, then teal, then its own dye, from the top down; what is below
  // the liquor's surface is laid out just under it in a vat and goes down into the river (aDip: the surface's height, how far it has turned 0..1, river or vat).
  const DP = M.dip;
  const DIP = {
    defines: { DIP_TOP: DP.clothTop.toFixed(3), DIP_LEN: DP.cloth.toFixed(3) },
    uniforms: { uDipFresh: { value: new THREE.Color(DP.fresh) }, uDipTeal: { value: new THREE.Color(DP.teal) } },
    vertexPars: /* glsl */`attribute vec3 aDip; attribute vec3 aDye; varying vec3 vDip; varying vec3 vDye;`,
    vertexLocal: /* glsl */`vDip = vec3(clamp((-DIP_TOP - transformed.y) / DIP_LEN, 0.0, 1.0), aDip.y, 0.0); vDye = aDye;`,
    vertexWorld: /* glsl */`{
      float under = aDip.x - wp.y;
      if (under > 0.0) {
        // in the liquor. In a VAT (aDip.z 0) there is no depth for it: it spreads just under the surface. In the RIVER (aDip.z 1;
        // third look) it goes DOWN: it was laid out a hand under the surface there too, and lay on the lagoon like a mat. It
        // hangs on into the dyed water, billowing a little, and the water takes it within a metre.
        vec2 h = normalize(wn.xz + vec2(1.0e-4));
        wp.xz += h * min(under, 1.6) * mix(0.28, 0.1, aDip.z); wp.y = aDip.x - 0.02 - min(under, 2.5) * mix(0.17, 0.74, aDip.z);
      }
      vDip.z = step(0.0, under);
    }`,
    fragmentPars: /* glsl */`uniform vec3 uDipFresh, uDipTeal; varying vec3 vDip; varying vec3 vDye;`,
    albedo: /* glsl */`{
      float t = clamp(vDip.y * 1.7 - vDip.x * 0.7, 0.0, 1.0);                  // the top turns first
      vec3 dye = mix(uDipFresh, uDipTeal, smoothstep(0.0, 0.5, t)); dye = mix(dye, vDye, smoothstep(0.4, 1.0, t));
      albedo *= dye * mix(0.82, 1.0, t);                                       // (wet from the dye it is a little darker)
    }`,
  };
  const dippers = [], dipSets = [];
  for (const land of [false, true]) {
    const mine = DP.beams.filter((b) => !!b.land === land);
    if (!mine.length) continue;
    const list = mine.map((b) => {
      const vs = b.vat ? b.vat[0] : b.s, a = path.at(vs, {}), dir = [a.tx * b.toward, a.tz * b.toward];
      const p = kit.at(vs, b.bank * (kit.halfWidth(vs) + (b.vat ? b.vat[1] : b.out)), b.y);
      if (b.vat) { p.x -= dir[0] * b.reach; p.z -= dir[1] * b.reach; }       // the post stands a beam's reach from the vat it serves
      else {
        // in the water it lies along the channel's EDGE, its tip as far outside the edge as its post: the lagoon widens by
        // a metre in two here, and a beam laid along the centre line swung its tip in over the quay (or out into the channel)
        const s2 = vs + b.toward * DP.arm, q = kit.at(s2, b.bank * (kit.halfWidth(s2) + b.out), b.y), l = Math.hypot(q.x - p.x, q.z - p.z) || 1;
        dir[0] = (q.x - p.x) / l; dir[1] = (q.z - p.z) / l;
      }
      return { position: [p.x, p.y, p.z], turn: Math.atan2(-dir[1], dir[0]) };
    });
    const clothMat = kit.gouache({ vertexColors: true, side: THREE.DoubleSide, brush: 0.5, backlight: 0.55, backColor: '#ffe0b8', extend: [sun ? sun.extend : null, DIP] });
    const set = await copies(`models/reach/m_dipbeam${land ? '_land' : ''}.glb`, list, { cloth: clothMat, rope: { crisp: true }, cradle: { crisp: true } });
    const src = set.meshes.cloth.geometry, g = new THREE.BufferGeometry();
    for (const k in src.attributes) g.setAttribute(k, src.attributes[k]);
    g.setIndex(src.index);
    const aDip = new THREE.InstancedBufferAttribute(new Float32Array(mine.length * 3), 3); aDip.setUsage(THREE.DynamicDrawUsage);      // the liquor's surface, how far its dye has turned, 1 in the river (0 in a vat)
    const aDye = new THREE.InstancedBufferAttribute(new Float32Array(mine.length * 3), 3), c = new THREE.Color();
    mine.forEach((b, i) => { c.set(D[b.dye].color).multiplyScalar(1.15); aDye.setXYZ(i, c.r, c.g, c.b); });
    g.setAttribute('aDip', aDip); g.setAttribute('aDye', aDye); set.meshes.cloth.geometry = g;
    if (sun) sun.solid(set.meshes.cloth, false);
    dipSets.push({ set, mine, aDip });
    mine.forEach((b, i) => {
      const here = path.locate(set.base[i].elements[12], set.base[i].elements[14], null, {});
      let machine = makeMachine(ctx, { steps: DP.steps, phase: b.phase });
      if (b.vat && out.undershot && out.undershot.length) {
        // THE TERRACE'S TWO ARE GEARED TO THE TERRACE'S WHEELS (the page: "an undershot wheel ... geared to two dipping beams"):
        // such a beam has no clock of its own. Where it is in its cycle is where the wheel beside it is in its turning,
        // DP.geared turns to a cycle (the wheel's low shed holds the gears); it cannot drift, be set or be cued apart from
        // its wheel (to shift it, shift the wheel: machine.wheel.arrive(...)).
        const near = out.undershot.reduce((a, u) => (Math.abs(u.s - here.s) < Math.abs(a.s - here.s) ? u : a)), w = near.wheel, cyc = machine, marks = [];
        machine = {
          geared: true, wheel: w, shed: near, period: w.period * DP.geared, valueAt: cyc.valueAt,
          get phase() { return w.phase / DP.geared + b.phase; },
          get at() { const f = this.phase; return f - Math.floor(f); },
          get value() { return cyc.valueAt(this.phase); },
          setPhase() { return this; }, arrive() { return 0; },
          every(at, fn) { marks.push({ at, fn, last: Math.floor(this.phase - at) }); return this; },
          tick() { if (marks.length) { const f = this.phase; for (const k of marks) { const n = Math.floor(f - k.at); if (n !== k.last) { k.last = n; k.fn(this); } } } },
        };
      }
      const me = {
        name: b.name, s: here.s, d: here.d, dye: b.dye, machine, level: b.level, deep: b.vat ? 0 : 1, up: b.up * Math.PI / 180, down: b.down * Math.PI / 180, turned: 1,
        lifted: () => machine.value,                                           // 0 down in the dye .. 1 held up
        pin: set.point('pin', i), drum: set.point('drum', i), tip: (target) => set.point('tip', i, target), hem: (target) => set.point('hem', i, target),
      };
      me.dipAt = me.tip(new THREE.Vector3()); me.dipAt.y = b.level;            // where its cloth goes into the liquor (a ring for the cast)
      dippers.push(me);
    });
  }
  out.dippers = dippers;
  // the terrace's two are worked by the terrace's wheels: a rope from the take-off drum in each wheel's shed to its beam's windlass
  {
    const geared = dippers.filter((b) => b.machine.geared && b.machine.shed.drive);
    if (geared.length) out.driveRopes = makeRopes(ctx, { ropes: geared.map((b) => ({ from: b.machine.shed.drive.toArray(), to: [b.drum.x, b.drum.y - 0.1, b.drum.z], sag: 0.3 })), radius: 0.028, color: '#806650', hull: false, rings: false, wetLine: -1 });
  }

  // ================================================================================================ every frame
  const _r = new THREE.Matrix4(), _t = new THREE.Matrix4(), _sc = new THREE.Vector3(), standIns = ['wringers', 'skeins', 'undershot wheels', 'far wheels', 'dipping beams', 'dipping cloths'];
  const cycle = DP.steps.reduce((sum, st) => sum + st[0], 0), len0 = Math.hypot(DP.butt[0] - DP.drum[0], DP.pin + DP.butt[1] - DP.drum[1]);
  let cleared = 0;
  return {
    update(dt) {
      // the stand-ins of these machines are made in kit.js, which is built after this module: take them out once they exist
      if (cleared < 3) { cleared++; for (const name of standIns) removeStandIn(ctx, name); }
      // ---- the wringers: the wheel turns, the skein is wrung and shortens, the post leans in
      let j = 0;
      for (const { set, list, aWring } of sets) {
        for (let i = 0; i < list.length; i++, j++) {
          const w = wringers[j], turns = hold ?? w.machine.value, k = clamp01(turns / W.turns), a = w.way * turns * TAU;
          set.move('wheel', i, _r.makeRotationZ(a));
          set.move('post', i, _r.makeRotationX(-(W.lean * k * k) / w.lever));
          aWring.setXYZ(i, a, k, 0);
          w.hookB(w.drip.b);
        }
        aWring.needsUpdate = true; set.flush();
      }
      // ---- the dipping beams: the beam rocks, the cradle and cloth hang from its tip, the rope reaches the butt, the crank winds
      let n = 0;
      for (const { set, mine, aDip } of dipSets) {
        for (let i = 0; i < mine.length; i++, n++) {
          const b = dippers[n];
          if (b.machine.tick) b.machine.tick();
          const v = b.machine.value, th = b.down + (b.up - b.down) * v, cs = Math.cos(th), sn = Math.sin(th);
          set.move('beam', i, _r.makeRotationZ(th));
          // the cradle hangs from the tip: it goes where the tip goes and swings, more just after the beam has stopped
          const sec = b.machine.at * cycle, since = sec - 19, sw = DP.swing;
          const amp = sw.rest + (since > 0 ? sw.after * Math.exp(-since / 5) : 0) * (v > 0.5 ? 1 : 0);
          const swing = amp * Math.sin(ctx.time * TAU / sw.period + n * 1.7);
          _t.makeTranslation(DP.arm * (cs - 1), DP.arm * sn, 0).multiply(_r.makeRotationZ(swing));
          set.move('cradle', i, _t); set.move('cloth', i, _t);
          // the rope from the windlass to the butt, and the crank that has wound what is not in the air
          const bx = DP.butt[0] * cs - DP.butt[1] * sn, by = DP.pin + DP.butt[0] * sn + DP.butt[1] * cs, dx = bx - DP.drum[0], dy = by - DP.drum[1], len = Math.hypot(dx, dy);
          _t.makeRotationZ(Math.atan2(-dx, dy)).scale(_sc.set(1, len, 1));
          set.move('rope', i, _t);
          set.move('crank', i, _r.makeRotationZ((len - len0) / DP.drumRadius));
          // how far its dye has turned: fresh while it soaks, then twenty seconds from the moment it leaves the liquor
          // (while it soaks, what still shows above the liquor takes the fresh colour slowly: nothing changes at a stroke)
          b.turned = sec < 4.5 ? 1 : sec < 12 ? 1 - (sec - 4.5) / 7.5 : sec < 15.5 ? 0 : clamp01((sec - 15.5) / DP.turns);
          aDip.setXYZ(i, b.level, b.turned, b.deep);
        }
        aDip.needsUpdate = true; set.flush();
      }
      // ---- the gallery's hanks answer the reach's wind: a front throws them downwind in a third of a second and lets them fall in a second and a half
      const hw = hankWind;
      if (hw) {
        const w = shared.wind, f = w && w.frontAt ? Math.min(1.2, Math.max(0, w.frontAt(hw.at.x, hw.at.z))) : 0, step = Math.min(0.1, Math.max(0, dt || 0.016));
        hw.held += (f - hw.held) * (1 - Math.exp(-step / (f > hw.held ? 0.35 : 1.5)));
        if (w && w.direction) hw.u.value.set(w.direction.x, w.direction.y, hw.held); else hw.u.value.z = hw.held;
      }
      // ---- everything the toolkit turns: each copy's part takes its holder's matrix
      const touched = new Set();
      for (const h of holders) { h.o.updateMatrix(); h.set.put(h.name, h.i, h.o.matrix); touched.add(h.set); }
      for (const set of touched) set.flush();
    },
  };
}
