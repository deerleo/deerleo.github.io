// The standing sky: THE SHALLOWS (stage 2, the kit and the close band; one of six groups: docs/build/sky/2-kit-shallows.md).
// The nearest made things on the ride, and what lies in a hand of water round them.
//
//   mooring stakes (stake_a .. stake_d)   nine at plan.stakes (3 m left of the line, every 11 m from s 138), each turned,
//                                         leaned 0 to 6 degrees, scaled and tinted by itself; no two neighbours alike
//   crust collars (collar_a .. collar_c)  one round every stake's foot and each pile of the far jetty; a sock of crust
//                 (collar_lamp)           round the kept lamp's post and the far lamp's
//   the kept lamp's iron mooring ring     (lamp_ring) on the channel side of its post
//   the crust terraces of the left flats  (terraces, terraces_brine; terraces.json), with the shoal at the far jetty's
//                                         root (shoal), THE BROKEN EDGE (crust rafts, grown here) and SHED FEATHERS (grown here)
//   fallen-star pebbles and their hollows (pebble_a .. c, hollow): laid for the cast, shared.pebbles
//   sedge                                 ninety tufts in thirty groups, grown here; still (its bend is the cast's)
//
// What is modelled is modelled in Blender (source-art/models/sky/*.py -> assets/models/sky/*.glb) and instanced (one
// draw a kind); all of it is dressed in the area's light and its night air (shared.sky: light.js) and painted in
// DAYLIGHT colours.
//
// What this module puts in `shared` (docs/build/sky/2-kit-shallows.md, "For the people who bring the area to life"):
//   shared.stakes      [{ x, z, top, lean, tern, variant }]: the real stake heads (the terns' perches), in kit.js's shape
//   shared.shallows    { crisp }: see below
//   shared.flats       the terraces: heightAt, heightAtRoute, shore, pools, levels; rafts; feathers
//   shared.shoal, shared.pebbles, shared.sedge
// Stand-ins this module takes out (they live in kit.js and heroes_b.js; their lines can be deleted there):
//   'mooring stakes', 'mooring stake: crust collars', 'kept lamp: crust collar', 'kept lamp: iron mooring ring',
//   'sedge tufts', 'crust terrace' (three), 'rose brine in the steps'
// The stakes' colliders stay kit.js's (it leaves them in place); the lamp post's is heroes_b.js's.
//
// THIN THINGS AND THE PAINTER. A stake 30 m off is thinner than the painter's brush and would be wiped out; a stake 3 m
// off is a broad thing and should be painted like the rest. The engine's `crisp: true` is all or nothing, and it cannot
// be used with the area's night air at all (the air's alpha test discards a crisp pixel: light.js, AIR_FINAL). So the
// kit marks itself for the filter by DISTANCE, in its own last word on the pixel: painted near, crisp far
// (shared.shallows.crisp(from, to) is that extension, for anyone's thin things in this area).
import * as THREE from 'three';
import { removeStandIn } from '../../engine/modules.js';
import { smooth, lerp } from './plan.js';

export async function build(ctx, plan, shared) {
  const { kit } = ctx, P = plan, C = P.colors, sky = shared.sky, K = P.kitShallows;
  const M = 'models/sky/';

  // ---------------------------------------------------------------------------------------------- crisp by distance
  // 1 while the near air is open (its materials are then opaque: a blended material cannot carry the mark)
  const uCrisp = { value: 0 };
  const crisp = (from = K.crisp[0], to = K.crisp[1]) => ({
    uniforms: { uCrispOn: uCrisp }, fragmentPars: 'uniform float uCrispOn;',
    final: `gl_FragColor.a = mix(gl_FragColor.a, -15.0, uCrispOn * smoothstep(${from.toFixed(1)}, ${to.toFixed(1)}, dist));`,
  });
  // THE KEPT LAMP'S LIGHT ON WHAT STANDS BY IT. The ride's lamp does not fall away at all within a quarter of its reach
  // (3 m here): the bare stake 2 m from it, and the crust on its own post, were lit as if they hung in the lantern, a
  // salmon stick and a pink flower, where the engine's own post keeps the dusk at its foot (lamp-hero.js, HOLDER_LIGHT:
  // the lamp's light thins along the post with the square of the distance). The kit takes the lamp's light by the same
  // law, a shade stronger: its head is warmed, its foot keeps the night.
  const lampFall = { light: `{ vec3 kTo = uLampPos - vWPos; float kD2 = dot(kTo, kTo); c += albedo * pointLight(uLampPos, uLampColor, uLampRadius, N) * (${K.lamp.toFixed(2)} / (1.0 + kD2) - 1.0); }` };
  // THE BOW LANTERN'S LIGHT ON THE KIT. The same holds for the rider's own lantern: the ride's lantern lights a thing 3 m
  // off at three quarters of its full strength, and pale timber there is a salmon stick in a blue picture (the stakes pass
  // at 3 m for ninety metres). The kit takes the lantern's light by the square of the distance as well: at arm's length
  // a stake is warmed on the side the boat is on, at 3 m it keeps a breath of it, and it stands as the key painting has
  // it: a dark shape with a pale foot against the mirror.
  const lanternFall = { light: `{ vec3 kL = uLanternPos - vWPos; c += albedo * pointLight(uLanternPos, uLanternColor, uLanternRadius, N) * (min(${K.lantern.toFixed(2)} / (1.0 + dot(kL, kL)), 1.0) - 1.0); }` };
  // a kit piece in the area's light and night air: kit.models, then enrolled (light.js: extend, then adopt)
  // (`wear` goes to sky.extend with the air: { timber: true } and { salt: 'crust' } are the Light group's painted grain and
  // salt, light.js; an option that file does not know yet is simply not worn)
  const pieces = async (file, list, opts = {}) => {
    const air = opts.air ?? 'near', { wear, thin, extend: more, ...rest } = opts;
    const m = await kit.models(M + file, list, { brush: 0.8, ...rest, extend: [...sky.extend({ air, ...(wear || {}) }), lampFall, lanternFall, ...(thin === false ? [] : [crisp()]), ...[].concat(more || [])] });
    sky.adopt(m.group, { air });
    return m;
  };
  // the sand under a hand of water takes a lamp's light several times over, as the bed does (set.js: uBedLamp; the same
  // numbers of the plan drive this one)
  const uBedLamp = { value: P.light.bed.lantern };
  const bedLamp = { uniforms: { uBedLampK: uBedLamp }, fragmentPars: 'uniform float uBedLampK;', light: 'c += albedo * lamps * uBedLampK;' };
  shared.shallows = { crisp };
  // things drawn only while the boat is within sight of them (a collar on the far jetty is under a pixel from the gate, and
  // was a thousand triangles three times a frame there): [{ o: object, s: [from, to] metres of the route }]
  const farThings = [];

  // ---------------------------------------------------------------------------------------------- mooring stakes
  // Nine, driven by hand along a line that is not quite a line. The page: 1.0 to 1.3 m above the water, 16 to 20 cm
  // thick, chamfered or split heads, a rope groove, one iron band, one ring, leaning 0 to 6 degrees.
  const stakes = [];
  {
    const rnd = ctx.rng(K.stakes.seed), by = { a: [], b: [], c: [], d: [] }, e = new THREE.Euler(), v = new THREE.Vector3();
    const tints = ['#ffffff', '#f0ecf3', '#f7f1ec', '#e8e5ee'];
    P.stakes.s.forEach((s, i) => {
      const variant = K.stakes.variants[i % K.stakes.variants.length];
      const at = kit.at(s, P.stakes.d + (rnd() - 0.5) * K.stakes.scatter);
      const lean = lerp(K.stakes.lean[0], K.stakes.lean[1], Math.pow(rnd(), 1.5)) * Math.PI / 180, way = rnd() * Math.PI * 2;      // most nearly upright, one or two well over
      // the one with the ring turns it to the channel, where a boat would tie up; the rest stand as they were driven
      // (and the split one turns the hand of sky between its halves to the boat: the split's line lies 2.07 radians round from
      // the model's front (stake.py, split 0.5), and seen across it one half hides the other and the head is a plain block)
      const turn = variant === 'c' ? kit.faceAngle('channel', s, P.stakes.d) + (rnd() - 0.5) * 0.9
        : variant === 'b' ? kit.faceAngle('channel', s, P.stakes.d) - 2.07 + (rnd() - 0.5) * 0.8 : rnd() * Math.PI * 2;
      const wide = 0.94 + 0.13 * rnd(), high = 0.97 + 0.06 * rnd();
      const rotation = [Math.cos(way) * lean, turn, Math.sin(way) * lean];
      by[variant].push({ position: [at.x, 0, at.z], rotation, scale: [wide, high, wide * (0.96 + 0.08 * rnd())], tint: [tints[Math.floor(rnd() * tints.length)], K.stakes.first][i === 0 ? 1 : 0], i });      // (the first, 2 m from the kept lamp, a shade darker: nothing by the lamp competes with the lamp)
      stakes.push({ at, variant, rotation, high, lean, wide });
    });
    const tops = {}, girth = {};
    for (const k of Object.keys(by)) {
      if (!by[k].length) continue;
      const m = await pieces(`stake_${k}.glb`, by[k], { wear: { timber: true } });
      m.group.name = 'mooring stakes: ' + k;
      // read off the model itself, never copied from its script: the head's height, and how thick it is at the water
      const g = m.meshes[0].geometry, p = g.attributes.position; let sum = 0, n = 0;
      for (let i = 0; i < p.count; i++) if (Math.abs(p.getY(i) - 0.04) < 0.09) { sum += Math.hypot(p.getX(i), p.getZ(i)); n++; }
      tops[k] = g.boundingBox.max.y; girth[k] = n ? sum / n : 0.09;
    }
    for (const st of stakes) st.radius = girth[st.variant] * st.wide;
    // the heads, for the terns: where the top of each leaned stake is now
    shared.stakes = stakes.map((st, i) => {
      v.set(0, tops[st.variant] * st.high, 0).applyEuler(e.set(st.rotation[0], st.rotation[1], st.rotation[2], 'YXZ'));
      return { x: st.at.x + v.x, z: st.at.z + v.z, top: v.y - (st.variant === 'b' ? 0.03 : 0.006), lean: st.lean, tern: P.stakes.terns.includes(i), variant: st.variant };
    });
    removeStandIn(ctx, /^mooring stake/);                                         // kit.js's posts and their collars
  }

  // ---------------------------------------------------------------------------------------------- crust collars
  // Round the foot of everything that stands in the lake: lobed like cauliflower, never a clean ring, 25 to 40 cm.
  {
    const rnd = ctx.rng(K.stakes.seed + 5), by = { a: [], b: [], c: [], lamp: [] }, byFar = { a: [], b: [], c: [], lamp: [] }, Kc = K.collars;
    let into = by;      // (the far jetty's collars go in meshes of their own: they are drawn only when the boat is within sight of them)
    const put = (variant, x, z, scale, high = 1, turn = rnd() * Math.PI * 2, tint = '#ffffff') => into[variant].push({ position: [x, 0, z], rotation: turn, scale: [scale, high, scale * (0.94 + 0.12 * rnd())], tint });
    // (each collar is scaled to its post: its sleeve of crust ends just inside a post of 8.5 cm radius: collar.py)
    // (a collar has no hole for its post: the post stands through it. It is scaled a little with its post, never to it)
    stakes.forEach((st, i) => put(Kc.variants[i % Kc.variants.length], st.at.x, st.at.z, Math.sqrt(st.radius / Kc.fits) * lerp(Kc.scale[0], Kc.scale[1], rnd()), i === 0 ? 0.8 : 0.85 + 0.4 * rnd()));      // (the first stake's is low: nothing by the lamp competes with the lamp's own)
    // the kept lamp's: a sock of crust 25 cm high at its waterline (collar_lamp: the engine's post is 14 cm thick there),
    // its high side toward the line, where the boat passes
    const foot = kit.at(P.lamp.at[0], P.lamp.at[1]);
    put('lamp', foot.x, foot.z, Kc.lamp.scale, Kc.lamp.high, Kc.lamp.turn);
    // the far lamp's post and the far jetty's piles (the director's point 4: the place the ride arrives at). The piles'
    // places are the Timber group's: shared.jetty.piles = [{ x, z }] if they publish them (the landing's jetty.glb, when
    // it comes), else where the stand-in's eight piles stand (plan.jetty, as heroes_b.js sets them out)
    const far = kit.at(P.farLamp.at[0], P.farLamp.at[1]);
    into = byFar;
    put('lamp', far.x, far.z, Kc.lamp.scale, Kc.lamp.high * 0.82, Kc.lamp.turn + 2.4, '#f4f0f6');
    const J = P.jetty, piles = (shared.jetty && shared.jetty.piles) || (() => { const out = [], len = J.root - J.head; for (let i = 0; i < 4; i++) for (const side of [-1, 1]) { const q = kit.at(J.s + side * (J.width / 2 - 0.1), J.head + 0.25 + i * (len - 0.5) / 3); out.push({ x: q.x, z: q.z }); } return out; })();
    piles.forEach((q, i) => put('ca'[(i + (i >> 2)) % 2], q.x, q.z, Math.sqrt((q.r || 0.09) / Kc.fits) * lerp(Kc.scale[0], Kc.scale[1], rnd()), 0.75 + 0.45 * rnd()));
    // (third version: every lump is modelled and its crease painted. The Light group's painted crust is worn thin over it: at
    // full strength its lilac lay over lilac and the collar was a violet thing darker than the water round it, where the
    // key painting's stakes have PALE feet; its glints by night are kept)
    for (const [set, name] of [[by, 'crust collars: '], [byFar, 'far jetty: crust collars: ']]) for (const k of Object.keys(set)) if (set[k].length) {
      const m = await pieces(`collar_${k}.glb`, set[k], { brush: 0.5, thin: false, wear: { salt: { kind: 'crust', strength: Kc.dress } } }); m.group.name = name + k;
      if (set === byFar) farThings.push({ o: m.group, s: [P.jetty.s - K.sight, 1e9] });
    }
    removeStandIn(ctx, 'kept lamp: crust collar');
  }

  // ---------------------------------------------------------------------------------------------- the kept lamp's iron mooring ring
  // A ring bolt on the channel side of the engine's post, 0.62 m up. The model is made in the post's own frame
  // (source-art/models/sky/lamp_ring.py reads the post's line from the post's script): it is placed as the lamp's holder is.
  {
    const holder = shared.lamp && shared.lamp.holder, foot = kit.at(P.lamp.at[0], P.lamp.at[1]);
    const at = holder ? holder.position : foot, ry = holder ? holder.rotation.y : 0, rz = holder ? holder.rotation.z : 0;
    const ring = await kit.model(M + 'lamp_ring.glb', { position: [at.x, at.y, at.z], rotation: [0, ry, rz], brush: 0.6, extend: [...sky.extend({ air: 'near' }), lampFall, lanternFall, crisp(8, 24)] });
    ring.group.name = "kept lamp: iron mooring ring";
    sky.adopt(ring.group, { air: 'near' });
    removeStandIn(ctx, 'kept lamp: iron mooring ring');
  }

  // ---------------------------------------------------------------------------------------------- the crust terraces of the left flats
  // s 232 to 352, d -22 to -44.8: four steps of salt crust 2 to 8.5 cm out of the water behind scalloped rims, pools of
  // the lake's own water over rose floors, lines of three-toed prints (terraces.py). Two slots: `paint` the crust (in the
  // mirror, under the night air), `under` what lies wholly under the water (before the water, lit as the bed, never in
  // the mirror). The net of polygon ridges on the dry crust is drawn here, in the material: a hand high they are
  // nothing to model and everything to see.
  let brineU = null, brineSkin = null, landForms = null;
  {
    const T = K.terraces, info = await fetch('assets/models/sky/terraces.json').then((r) => r.json());
    // THE CRUST'S OWN PAINTING (fourth holder: the terraces, the rafts and the shoal all wear it). In this area's light
    // nothing below the sunline casts a shade, so every rise of the crust has to be painted or it is not there; and what
    // stood here was one smooth pale sheet with ruled lines on it. Three things are painted now, largest first:
    //   the plates    a net of cells a pace or more across: each plate its own age (chalk, a greyer older one, here and
    //                 there one stained with the brine's rose), a shade darker toward its middle where it has sunk
    //   the welts     where two plates meet the salt is squeezed up: a crumbled white ridge two fingers to a hand wide,
    //                 never ruled, with its shade lying beside it on the side away from first light
    //   the crazing   the Light group's own painted salt (crust.webp, G: "the bed crazed under a skin of salt"): small
    //                 plates with dark cracks and patches of white lace, laid at its true size near the boat and broader,
    //                 octave by octave, further off, so that it is on the picture at every distance
    // and at every water's edge: a white rim of crystals over the dark wet foot, the tide's lines on the banks of the
    // pools, and the face of the crust's own lip in shade (it stands a thumb high over the water: a dark line under a
    // white one is what makes it a plate of salt and not a kerb).
    const Tp = T.paint;
    const net = {
      fragmentPars: /* glsl */`
        vec2 kHash2(vec2 p) { p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3))); return fract(sin(p) * 43758.5453); }
        // a net of cells one unit across. x: how far a place is from the nearest wall; yz: which way that wall lies (from
        // this cell toward the neighbour beyond it); id: this cell's own number
        vec3 kNet(vec2 x, out vec2 id) {
          vec2 n = floor(x), f = fract(x), mg = vec2(0.0), mr = vec2(0.0), dir = vec2(1.0, 0.0); float md = 8.0;
          for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) { vec2 g = vec2(float(i), float(j)), r = g + kHash2(n + g) - f; float d = dot(r, r); if (d < md) { md = d; mr = r; mg = g; } }
          md = 8.0;
          for (int j = -2; j <= 2; j++) for (int i = -2; i <= 2; i++) { vec2 g = mg + vec2(float(i), float(j)), r = g + kHash2(n + g) - f; if (dot(mr - r, mr - r) > 0.00001) { vec2 e = normalize(r - mr); float d = dot(0.5 * (mr + r), e); if (d < md) { md = d; dir = e; } } }
          id = n + mg;
          return vec3(md, dir);
        }`,
      albedo: /* glsl */`{
        float cell = ${T.cell.toFixed(2)}; vec2 kP = vWPos.xz; float kDist = max(length(vViewPos), 0.5);
        vec2 fx = dFdx(kP), fy = dFdy(kP); float fine = min(length(fx), length(fy)), coarse = max(length(fx), length(fy));
        float dry = smoothstep(0.008, 0.02, vWPos.y), level = smoothstep(0.7, 0.93, N.y), top = dry * level;      // the crust's own top: not its wet margins, not its lip
        // ---- the crazing (octave by octave: the same strokes broader further off)
        float lod = max(log2(kDist / ${Tp.trueWithin.toFixed(1)}), 0.0), l0 = floor(lod), k0 = exp2(-l0) / ${Tp.craze.toFixed(2)};
        vec2 kW = 0.09 * vec2(sin(kP.y * 0.23 + 1.1), sin(kP.x * 0.19));
        vec3 tA = texture2D(tCrust, kP * k0 + kW + 0.37 * mod(l0, 2.0)).rgb, tB = texture2D(tCrust, kP * (k0 * 0.5) + kW + 0.37 * mod(l0 + 1.0, 2.0)).rgb;
        vec3 tC = mix(tA, tB, smoothstep(0.2, 0.8, lod - l0)); float g = tC.g;
        float crack = 1.0 - smoothstep(0.10, 0.27, g), lace = smoothstep(0.60, 0.84, g), body = smoothstep(0.2, 0.62, g);
        // ---- the plates and their welts (the cells are pulled about so that no two are alike)
        vec2 q = kP / cell; q += 0.42 * vec2(sin(q.y * 1.3 + 0.7 * sin(q.x * 0.6)), sin(q.x * 1.1 + 1.9 + 0.8 * sin(q.y * 0.5)));
        vec2 cid; vec3 nt = kNet(q, cid); float dW = nt.x * cell; vec2 ch = kHash2(cid * 1.7 + 3.1);
        // (strong in one place, slight in another; whole cells or none: lengths left standing by the half metre were scattered Y's,
        // each a giant bird's foot pressed in the crust)
        float strong = mix(0.4, 1.0, smoothstep(-0.35, 0.5, sin(kP.x * 0.23 + 1.7 * sin(kP.y * 0.11)) + 0.6 * sin(kP.y * 0.37 + kP.x * 0.19)));
        float there = top * (1.0 - smoothstep(0.3 * cell, 0.75 * cell, coarse));      // gone where a cell is no wider than the picture can draw
        float wide = (0.02 + 0.05 * (0.5 + 0.5 * sin(kP.x * 2.1 + 1.3 * sin(kP.y * 1.7)) * sin(kP.y * 2.6 + kP.x * 0.9))) * (0.5 + 1.0 * tC.r) * mix(0.6, 1.0, strong);
        float ridge = 1.0 - smoothstep(wide * 0.4, wide + fine, dW);
        float side = dot(nt.yz, vec2(${Tp.light[0].toFixed(3)}, ${Tp.light[1].toFixed(3)}));      // above 0: the welt stands between this place and first light
        float beside = (1.0 - smoothstep(wide, wide + 0.04 + 0.11 * clamp(side, 0.0, 1.0), dW)) * (1.0 - ridge);
        float inner = smoothstep(0.1, 0.55, dW / (0.5 * cell));
        vec3 plate = mix(vec3(0.86, 0.845, 0.915), vec3(0.985, 0.975, 0.955), ch.x);
        plate = mix(plate, vec3(0.97, 0.85, 0.83), 0.85 * smoothstep(0.7, 0.95, ch.y));
        albedo *= mix(vec3(1.0), plate * mix(1.0, 0.93, inner), there * ${Tp.plates.toFixed(2)});
        albedo *= mix(vec3(1.0), mix(vec3(0.78, 0.76, 0.92), vec3(1.05, 1.04, 1.02), body), ${Tp.crazing.toFixed(2)} * top);
        albedo *= mix(vec3(1.0), vec3(0.56, 0.54, 0.8), 0.85 * crack * top);
        albedo = mix(albedo, vec3(1.03, 1.01, 0.96), 0.8 * lace * top);
        albedo *= mix(vec3(1.0), mix(vec3(1.0, 0.99, 1.0), vec3(0.6, 0.58, 0.84), smoothstep(-0.25, 0.45, side)), 0.9 * there * beside * strong);
        albedo = mix(albedo, vec3(1.05, 1.03, 0.97), 0.95 * ridge * there * strong);
        // ---- at every water's edge. The tide's lines: on the bank of a pool the brine has stood at this height and that,
        // and left a line of salt at each (they follow the pool's own outline, a few fingers apart)
        float bank = (1.0 - smoothstep(0.02, 0.05, coarse)) * (1.0 - level * 0.5);
        float tide = smoothstep(0.35, 0.9, sin(vWPos.y * ${(6.2832 / Tp.tide).toFixed(1)} + 2.0 * tC.b)) * smoothstep(0.006, 0.012, vWPos.y) * (1.0 - smoothstep(0.03, 0.05, vWPos.y));
        albedo = mix(albedo, vec3(1.02, 1.0, 0.96), 0.55 * tide * bank);
        // the white rim of crystals over the dark wet foot
        float rimY = smoothstep(0.003, 0.007, vWPos.y) * (1.0 - smoothstep(0.010, 0.018, vWPos.y));
        albedo = mix(albedo, vec3(1.04, 1.02, 0.97), ${Tp.rim.toFixed(2)} * rimY * (0.45 + 0.9 * tC.r));
        // the face of the lip, in shade under its own white edge
        float steep = (1.0 - smoothstep(0.35, 0.8, N.y)) * step(-0.002, vWPos.y);
        albedo *= mix(vec3(1.0), vec3(${Tp.face.map((v) => v.toFixed(2)).join(', ')}), steep); }`,
    };
    // (three slots: `paint` the crust; `under` the lake's apron, which wears the bed's own painting so that the two are one
    // where it goes under the bed; `pool` the pools' rose floors. The last two lie wholly under the water)
    const lineX = kit.at(info.origin.s, 0).x, bedPaint = sky.BED_PAINT_GLSL && sky.bedUniforms, bedOrder0 = ((ctx.group.getObjectByName('lake bed') || {}).renderOrder) ?? -6;
    const bedWear = bedPaint ? { uniforms: { ...sky.bedUniforms }, vertexPars: 'varying float vKEdge;', vertexWorld: `vKEdge = smoothstep(20.0, 32.0, abs(wp.x - (${lineX.toFixed(3)})));`,
      fragmentPars: `varying float vKEdge; ${sky.BED_PAINT_GLSL}`,
      // (the bed's painting is laid from above: down the steep of the crust's own lip it was drawn out into ribs, a kerb of cast
      // concrete. The steeper the face the less of it: the lip is plain wet crust, and the sand at its foot is the bed's)
      albedo: 'albedo *= mix(vec3(0.86, 0.84, 0.98), bedColour(bedPaint(vWPos.xz, vKEdge), vKEdge), smoothstep(0.72, 0.97, N.y));' } : null;
    // (two forms of the one land, fourth holder: `terraces.glb` with every scallop of its edge and every print, for when the boat is
    // by it; `terraces_far.glb`, a sixth of its triangles, for when the nearest of it is 40 m off and more: update() changes over)
    const landForm = async (file, name) => {
      const m = await kit.model(M + file, { at: [info.origin.s, info.origin.d, 0], rotation: kit.headingAt(info.origin.s), name,
        brush: 0.9, extend: [...sky.extend({ air: 'near', salt: 'pan' }), lampFall, lanternFall, net, crisp(T.crisp[0], T.crisp[1])],
        // (the crust's lip under the water faces the boat, and took the lantern at 3 m as a tan kerb: it keeps a breath of it)
        materials: { under: { brush: 0.35, extend: [...sky.extend({ bed: true }), { light: 'c -= albedo * pointLight(uLanternPos, uLanternColor, uLanternRadius, N) * 0.85;' }, bedWear].filter(Boolean) }, pool: { brush: 0.6, extend: [...sky.extend({ bed: true }), bedLamp] } } });
      m.group.traverse((o) => {
        if (!o.isMesh) return;
        // (BEFORE the bed, which writes no depth: where the bed lies over them, the bed is seen. The first version drew them
        // after it, at -1, and the whole apron showed through the bed: a band with a ragged edge all along the shore)
        if (o.material === m.materials.under || o.material === m.materials.pool) { ctx.only(o, 'direct'); o.renderOrder = bedOrder0 - 1; }
        else sky.adopt(o, { air: 'near' });
      });
      return m;
    };
    const terr = await landForm('terraces.glb', 'crust terraces'), terrFar = await landForm('terraces_far.glb', 'crust terraces: far form');
    landForms = { near: terr.group, far: terrFar.group };
    // THE ROSE OF THE BRINE (terraces_brine.glb: a skin of the brine's own colour a finger over every pool's water). The
    // pools' water is the engine's: it mirrors the sky, and from the boat every pool was sky blue. As on the Works
    // group's pans the skin lies only from first light (by night the pools are part of the exact mirror), is drawn after
    // the water in the direct view only, thins to nothing at each shore, and where the eye looks along it gives way to
    // the low sky it mirrors (the Monument's brine does the same on the ridge's skirt, which these meet at d -44).
    {
      const uBrine = { value: new THREE.Vector3(T.brine.dense, T.brine.sheen, 0) };      // how thick the skin lies; how much of it gives way to the mirror at a grazing eye; the dawn (update)
      // (fourth holder: each skin also wears the area's painted `brine` (assets/art/sky/brine.webp, the Works group's pans' own
      // picture: rose and rust with rims and islands of white salt lace): a pool is a small pan, and a flat rose oval was plain)
      const brineArt = await ctx.tex('art/sky/brine.webp', { repeat: true }).catch(() => null);
      const skin = await kit.model(M + 'terraces_brine.glb', { at: [info.origin.s, info.origin.d, 0], rotation: kit.headingAt(info.origin.s), name: 'crust terraces: brine',
        transparent: true, brush: 0.25, extend: [...sky.extend({ air: false }), {
          uniforms: { uBrine, ...(brineArt ? { tBrineArt: { value: brineArt } } : {}) }, fragmentPars: `uniform vec3 uBrine; ${brineArt ? 'uniform sampler2D tBrineArt;' : ''}`,
          albedo: `alpha *= smoothstep(0.0, 1.0, vUv0.x) * uBrine.x * uBrine.z; ${brineArt ? `{ vec3 kArt = texture2D(tBrineArt, vWPos.xz / ${T.brine.tile.toFixed(2)} + 0.31).rgb; float kLum = dot(albedo, vec3(0.3, 0.5, 0.2)); albedo = mix(albedo, kArt * (0.5 + 1.1 * kLum), ${T.brine.art.toFixed(2)}); alpha = min(1.0, alpha * (1.0 + 0.5 * smoothstep(0.45, 0.75, dot(kArt, vec3(0.3, 0.5, 0.2))))); }` : ''}`,
          final: 'gl_FragColor.a *= 1.0 - uBrine.y * pow(1.0 - clamp(V.y, 0.0, 1.0), 4.0);' }] });
      skin.group.traverse((o) => { if (o.isMesh) { o.material.depthWrite = false; o.renderOrder = 1; o.frustumCulled = false; ctx.only(o, 'direct'); } });
      brineU = uBrine; brineSkin = skin.group;
    }
    // the crust is land: the hull stops at its edge (set.js keeps soft shallows over it as well: they slow the boat first)
    const shore = info.shore;
    for (let i = 1; i < shore.length; i += 2) { const q = sky.at(shore[i][0], shore[i][1] - T.collide + 0.3); if (shore[i][0] <= P.end + 14) ctx.addCollider({ x: q.x, z: q.z, r: T.collide }); }
    // how high the crust stands anywhere on it, for whatever stands there (the flock): metres above still water,
    // negative in a pool; null off the terraces
    const G = info.grid, end = ctx.path.at(ctx.path.length), loc = {};
    const route = (x, z) => { const l = ctx.path.locate(x, z, null, loc); if (l.s < ctx.path.length - 0.01) return [l.s, l.d]; const dx = x - end.x, dz = z - end.z; return [ctx.path.length + dx * end.tx + dz * end.tz, dx * end.rx + dz * end.rz]; };
    const heightAtRoute = (sr, d) => {
      const fi = (sr - G.s0) / G.step, fj = (d - G.d0) / G.step;
      if (fi < 0 || fj < 0 || fi > G.ns - 1 || fj > G.nd - 1) return null;
      const i = Math.min(G.ns - 2, Math.floor(fi)), j = Math.min(G.nd - 2, Math.floor(fj)), a = fi - i, b = fj - j, h = (ii, jj) => G.h[ii * G.nd + jj];
      return 0.001 * (lerp(lerp(h(i, j), h(i, j + 1), b), lerp(h(i + 1, j), h(i + 1, j + 1), b), a));
    };
    shared.flats = { heightAtRoute, heightAt: (x, z) => { const r = route(x, z); return heightAtRoute(r[0], r[1]); }, shore, pools: info.pools, levels: info.levels, model: terr };
    removeStandIn(ctx, /^crust terrace/); removeStandIn(ctx, 'rose brine in the steps');

    // ---- THE SHOAL AT THE FAR JETTY'S ROOT (shoal.glb; the director's fourth point: the place the last picture of the ride
    // stands in). The page's jetty stands in open water and leads from nowhere to nowhere; a jetty has a root. The lake's
    // crust has grown out to meet its last pair of piles: a scalloped shoal a hand's breadth out of the water, and a drift
    // of crust plates thinning away from it across the shallows toward the pans. The same crust as the terraces, in the
    // same paint. The shoal is solid (the hull stops at it); the larger plates are shallows (the hull is slowed and eased off).
    {
      const sh = await fetch('assets/models/sky/shoal.json').then((r) => r.json()), o = sh.origin;
      const shoal = await kit.model(M + 'shoal.glb', { at: [o.s, o.d, 0], rotation: kit.headingAt(o.s), name: 'far jetty: crust shoal',
        brush: 0.9, extend: [...sky.extend({ air: 'near', salt: 'pan' }), lampFall, lanternFall, net, crisp(T.crisp[0], T.crisp[1])] });
      sky.adopt(shoal.group, { air: 'near' });
      sh.plates.forEach(([ps, pd, r], i) => {
        if (i === 0) { for (const k of [-0.42, 0.42]) { const q = sky.at(ps, pd + k * r); ctx.addCollider({ x: q.x, z: q.z, r: 0.62 * r }); } }
        else if (r > 0.3) { const q = sky.at(ps, pd); ctx.addCollider({ x: q.x, z: q.z, r, soft: true }); }
      });
      shared.shoal = { model: shoal, origin: o, plates: sh.plates };
    }

    // ---- THE BROKEN EDGE: CRUST RAFTS (grown here by rule, every one its own; a mesh to each stretch of the shore, drawn only
    // within sight). The crust does not end in a kerb. (Fourth holder: remade. What stood were smooth pads, a guitar pick and
    // a bar of soap: seven-cornered outlines with a rounded edge and a plain top. Three kinds lie here now, each a thin PLATE
    // with a level top that wears the crust's own painting, a plumb edge a thumb high with its crease kept, and a dark foot
    // in the water.)
    //   the piece that left   where a lobe of the shore has lost its point (terraces.py cuts the lobe off at a straight break and
    //                         lists the outline of what went: terraces.json, `breaks`), that very piece lies a hand off the
    //                         break in the water, split across into two or three, each slid and turned a little by itself,
    //                         its lake side going under: the rider can fit it back with his eye. Crumbs lie in the gap.
    //   new crust             in the lap between two lobes, where the water lies stillest: two to four small thin plates,
    //                         scalloped all round, a finger out of the water, whiter than the old crust
    //   drifters              a few further out, awash (the hull is eased round those); and the same round the shoal
    {
      const R = K.rafts, rnd = ctx.rng(R.seed), parts = new Map(), list = [];
      let part = null;
      // (in stretches of the route, each its own mesh, drawn only while the boat is within sight of it)
      const into = (key, from, to) => { if (!parts.has(key)) parts.set(key, { pos: [], nor: [], col: [], idx: [], s: [from, to] }); part = parts.get(key); };
      const stretch = (s) => { const k = Math.floor((s - R.reach[0]) / R.stretch); into('shore ' + k, R.reach[0] + k * R.stretch - K.sight * 0.6, R.reach[0] + (k + 1) * R.stretch + K.sight * 0.6); };
      const cTop = new THREE.Color('#F2E8D8'), cNew = new THREE.Color('#FBF4E6'), cBreak = new THREE.Color('#FFFAEE'), cFace = new THREE.Color('#D6CBD6'), cWet = new THREE.Color('#6A6290'), w = new THREE.Color();
      // one plate. outline: [x, z] round it in the realm's own metres (either way round); fresh[i]: that corner lies on a
      // fresh break; top: how high its top stands; tilt, tiltDir: how it is tipped (metres a metre, toward which way)
      const plate = (outline, o = {}) => {
        const n = outline.length; if (n < 3) return;
        const top = o.top ?? 0.016, foot = o.foot ?? -0.008, tilt = o.tilt || 0, tx = Math.cos(o.tiltDir || 0), tz = Math.sin(o.tiltDir || 0), tone = o.tone ?? (0.95 + 0.08 * rnd()), fresh = o.fresh || [];      // (foot: how far its edge goes down into the water: a thin plate of new crust hardly at all: drawn a hand deep it was a bar of soap)
        let cx = 0, cz = 0, area = 0; for (let i = 0; i < n; i++) { const p = outline[i], q = outline[(i + 1) % n]; cx += p[0]; cz += p[1]; area += p[0] * q[1] - q[0] * p[1]; } cx /= n; cz /= n;
        const yAt = (x, z) => Math.max(top + tilt * ((x - cx) * tx + (z - cz) * tz), 0.004);      // (a corner that would go under lies awash)
        const { pos, nor, col, idx } = part, base = pos.length / 3;
        for (let i = 0; i < n; i++) {
          const [x, z] = outline[i]; pos.push(x, yAt(x, z), z); nor.push(-tilt * tx, 1, -tilt * tz);
          w.copy(fresh[i] ? cBreak : o.young ? cNew : cTop).multiplyScalar(tone); col.push(w.r, w.g, w.b);
        }
        for (const [a, b, c] of THREE.ShapeUtils.triangulateShape(outline.map((p) => new THREE.Vector2(p[0], p[1])), [])) {
          const ax = outline[b][0] - outline[a][0], az = outline[b][1] - outline[a][1], bx = outline[c][0] - outline[a][0], bz = outline[c][1] - outline[a][1];
          if (az * bx - ax * bz > 0) idx.push(base + a, base + b, base + c); else idx.push(base + a, base + c, base + b);      // every face looks up
        }
        // its edge: plumb, from the top down into the water, its own faces (the crease between top and edge is kept)
        const b2 = pos.length / 3, sgn = area > 0 ? 1 : -1; let far = 0;
        for (let i = 0; i < n; i++) {
          const p = outline[i], q = outline[(i + 1) % n], ex = q[0] - p[0], ez = q[1] - p[1], L = Math.hypot(ex, ez) || 1e-9, nx = sgn * ez / L, nz = -sgn * ex / L;
          const broke = fresh[i] && fresh[(i + 1) % n];
          for (const pt of [p, q]) {
            pos.push(pt[0], yAt(pt[0], pt[1]), pt[1], pt[0], foot, pt[1]); nor.push(nx, 0.12, nz, nx, 0.12, nz);
            w.copy(broke ? cBreak : cFace).multiplyScalar(tone); col.push(w.r, w.g, w.b, cWet.r, cWet.g, cWet.b);
          }
          const k = b2 + i * 4;                                                    // p's top, p's foot, q's top, q's foot
          if (sgn > 0) idx.push(k, k + 2, k + 1, k + 2, k + 3, k + 1); else idx.push(k, k + 1, k + 2, k + 2, k + 1, k + 3);
          far = Math.max(far, Math.hypot(p[0] - cx, p[1] - cz));
        }
        list.push({ x: cx, z: cz, r: far, top });
      };
      // an outline as salt grows it: a few discs run together (scallops with cusps between them), cut by straight breaks
      // (cuts: [direction, how far from the middle as a share of the radius]). Kept only as fine as it needs: a closed
      // Douglas-Peucker. Returns its corners [x, z] and which of them lie on a break.
      const grown = (x, z, size, turn, cuts = []) => {
        const discs = [[0, 0, 0.6]], nl = 2 + Math.floor(rnd() * 3);
        for (let i = 0; i < nl; i++) { const a = rnd() * 6.283, d = 0.28 + 0.34 * rnd(); discs.push([Math.cos(a) * d, Math.sin(a) * d, 0.26 + 0.3 * rnd()]); }
        const M = 96, rr = new Float32Array(M), broken = new Uint8Array(M);
        for (let k = 0; k < M; k++) {
          const th = k / M * 6.2832, ux = Math.cos(th), uz = Math.sin(th); let r = 0;
          for (const [dx, dz, dr] of discs) { const b = ux * dx + uz * dz, disc = dr * dr - dx * dx - dz * dz + b * b; if (disc >= 0) r = Math.max(r, b + Math.sqrt(disc)); }
          for (const [ca, cd] of cuts) { const cs = Math.cos(th - ca); if (cs > 0.05 && cd / cs < r) { r = cd / cs; broken[k] = 1; } }
          rr[k] = r;
        }
        const at = (k) => { const q = ((k % M) + M) % M, th = q / M * 6.2832; return [rr[q] * Math.cos(th), rr[q] * Math.sin(th)]; };
        const keep = new Set([0, 24, 48, 72]);
        const split = (i, j) => {
          if (j - i < 2) return;
          const a = at(i), b = at(j), dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz) || 1e-9; let m = -1, far = R.tol;
          for (let k = i + 1; k < j; k++) { const q = at(k), off = Math.abs((q[0] - a[0]) * dz - (q[1] - a[1]) * dx) / L; if (off > far) { far = off; m = k; } }
          if (m >= 0) { keep.add(m % M); split(i, m); split(m, j); }
        };
        for (let q = 0; q < 4; q++) split(q * 24, q * 24 + 24);
        const ks = [...keep].sort((a, b) => a - b), ct = Math.cos(turn), st = Math.sin(turn), half = size * 0.5;
        return { pts: ks.map((k) => { const q = at(k), lx = q[0] * half, lz = q[1] * half; return [x + lx * ct - lz * st, z + lx * st + lz * ct]; }), fresh: ks.map((k) => broken[k] === 1) };
      };
      const raft = (x, z, size, turn, o = {}) => { const g = grown(x, z, size, turn, o.cuts || []); plate(g.pts, { ...o, fresh: g.fresh }); };
      const dirOf = (s, d) => { const a = sky.at(s, d), b = sky.at(s, d + 1); return Math.atan2(b.z - a.z, b.x - a.x); };      // the world direction of "toward the line" (+d) there
      const Sf = info.shoreFine, shoreD = (s) => { const f = (s - Sf.s0) / Sf.step, i = Math.max(0, Math.min(Sf.d.length - 2, Math.floor(f))); return lerp(Sf.d[i], Sf.d[i + 1], Math.max(0, Math.min(1, f - i))); };
      // the nearest the shore comes to a raft of radius r at (s, d): it must lie in the water, never on the crust
      const clear = (s, d, r) => { let m = 1e9; for (let ds = -r - 0.3; ds <= r + 0.3; ds += 0.05) m = Math.min(m, Math.hypot(ds, d - shoreD(s + ds)) * Math.sign(d - shoreD(s + ds))); return m - r; };
      if (Sf) {
        // 1. THE PIECE THAT LEFT, at every break
        for (const b of info.breaks || []) {
          if (b.s[1] < R.reach[0] || b.s[0] > R.reach[1]) continue;
          const arc = b.arc, len = b.s[1] - b.s[0];
          const edge = b.edge || [[b.s[0], b.d[0]], [b.s[1], b.d[1]]];              // the break's own edge on the shore: the piece's inner edge is the same line
          const chordD = (s) => { for (let i = 1; i < edge.length; i++) if (s <= edge[i][0]) return lerp(edge[i - 1][1], edge[i][1], (s - edge[i - 1][0]) / Math.max(1e-6, edge[i][0] - edge[i - 1][0])); return edge[edge.length - 1][1]; };
          const arcD = (s) => { for (let i = 1; i < arc.length; i++) if (s <= arc[i][0]) return lerp(arc[i - 1][1], arc[i][1], (s - arc[i - 1][0]) / Math.max(1e-6, arc[i][0] - arc[i - 1][0])); return arc[arc.length - 1][1]; };
          // it rarely leaves whole: split across into two to four
          const pieces = len > 3.6 ? 3 + (rnd() < 0.4 ? 1 : 0) : len > 2.4 ? 2 + (rnd() < 0.5 ? 1 : 0) : 1 + (rnd() < 0.6 ? 1 : 0), bounds = [b.s[0]];
          for (let i = 1; i < pieces; i++) bounds.push(b.s[0] + len * (i + (rnd() - 0.5) * 0.5) / pieces);
          bounds.push(b.s[1]);
          const drift = 0.05 + 0.1 * rnd();                                        // how far the whole lot has moved off, metres
          stretch(0.5 * (b.s[0] + b.s[1]));
          for (let i = 0; i < pieces; i++) {
            const s0 = bounds[i], s1 = bounds[i + 1], slant = (rnd() - 0.5) * 0.24;
            // round it in route metres [s, d]: along the grown edge from s0 to s1, then back along the break
            const poly = [], fresh = [];
            const add = (s, d, f) => { const q = poly[poly.length - 1]; if (!q || Math.hypot(q[0] - s, q[1] - d) > 0.012) { poly.push([s, d]); fresh.push(f); } };
            add(s0 + (i ? slant : 0), arcD(s0 + (i ? slant : 0)), i > 0);
            for (const [as, ad] of arc) if (as > s0 + 0.14 && as < s1 - 0.14) add(as, ad, false);
            add(s1 - (i < pieces - 1 ? slant : 0), arcD(s1 - (i < pieces - 1 ? slant : 0)), i < pieces - 1);
            add(s1, chordD(s1), true);
            for (let k = edge.length - 1; k >= 0; k--) if (edge[k][0] > s0 + 0.05 && edge[k][0] < s1 - 0.05) add(edge[k][0], edge[k][1], true);      // back along the break, crooked as it broke
            add(s0, chordD(s0), true);
            if (poly.length > 3 && Math.hypot(poly[0][0] - poly[poly.length - 1][0], poly[0][1] - poly[poly.length - 1][1]) < 0.012) { poly.pop(); fresh.pop(); }
            let wide = 0; for (const [ps, pd] of poly) wide = Math.max(wide, pd - chordD(ps));
            if (poly.length < 3 || wide < 0.07) continue;                          // a sliver: gone to crumbs
            // slid off and turned a little, each by itself
            let cs = 0, cd = 0; for (const q of poly) { cs += q[0]; cd += q[1]; } cs /= poly.length; cd /= poly.length;
            const ang = (rnd() - 0.5) * 0.16, ca = Math.cos(ang), sa = Math.sin(ang), os = (rnd() - 0.5) * 0.14, od = drift + 0.04 + 0.1 * rnd() + 0.25 * Math.abs(sa) * (s1 - s0);
            const out = poly.map(([ps, pd]) => { const q = sky.at(cs + (ps - cs) * ca - (pd - cd) * sa + os, cd + (ps - cs) * sa + (pd - cd) * ca + od); return [q.x, q.z]; });
            plate(out, { fresh, top: 0.022 + 0.008 * rnd(), foot: -0.03, tilt: -(0.012 + 0.03 * rnd()), tiltDir: dirOf(cs, cd) });      // (a piece of the old plate: as thick as the shore it left, sunk a finger)
            // crumbs in the gap and off its lake side
            for (let k = 0, nk = Math.floor(rnd() * 3); k < nk; k++) {
              const ks = s0 + (s1 - s0) * rnd(), size = 0.1 + 0.16 * rnd(), kd = rnd() < 0.5 ? chordD(ks) + 0.05 + 0.5 * size : arcD(ks) + od + 0.1 + 0.5 * size + 0.25 * rnd(), q = sky.at(ks, kd);
              if (clear(ks, kd, size * 0.5) < 0.01) continue;
              raft(q.x, q.z, size, rnd() * 6.283, { cuts: [[rnd() * 6.283, 0.35 + 0.2 * rnd()], [rnd() * 6.283, 0.45]], top: 0.006 + 0.008 * rnd(), tilt: (rnd() - 0.5) * 0.06, tiltDir: rnd() * 6.283 });
            }
          }
        }
        // 2. new crust in the laps: the cusps of the shore
        for (const [cs, cd] of info.cusps) {
          if (cs < R.reach[0] || cs > R.reach[1] || rnd() > R.cusp) continue;
          const n = 2 + Math.floor(rnd() * 3);
          for (let i = 0; i < n; i++) {
            const size = (i === 0 ? 0.36 + 0.3 * rnd() : 0.16 + 0.22 * rnd()), s = cs + (rnd() - 0.5) * (i === 0 ? 0.5 : 1.6); let d = shoreD(s) + size * 0.5 + 0.03 + 0.22 * rnd() * rnd();
            for (let t = 0; t < 8 && clear(s, d, size * 0.5) < 0.02; t++) d += 0.05;
            if (clear(s, d, size * 0.5) < 0.0) continue;
            stretch(s); const q = sky.at(s, d); raft(q.x, q.z, size, rnd() * 6.283, { young: true, top: 0.008 + 0.008 * rnd(), cuts: rnd() < 0.5 ? [[rnd() * 6.283, 0.35 + 0.25 * rnd()]] : [] });
          }
        }
        // 3. drifters, awash: the hull is eased round them
        for (let s = R.reach[0] + 4 + 6 * rnd(); s < Math.min(R.reach[1], P.end + 4); s += lerp(R.drift[0], R.drift[1], rnd())) {
          const size = 0.26 + 0.3 * rnd(), d = shoreD(s) + 0.9 + 1.4 * rnd(), q = sky.at(s, d);
          stretch(s); raft(q.x, q.z, size, rnd() * 6.283, { top: 0.006 + 0.006 * rnd(), cuts: [[rnd() * 6.283, 0.3 + 0.3 * rnd()], ...(rnd() < 0.6 ? [[rnd() * 6.283, 0.45]] : [])], tilt: (rnd() - 0.5) * 0.04, tiltDir: rnd() * 6.283 });
          ctx.addCollider({ x: q.x, z: q.z, r: size * 0.5 + 0.15, soft: 0.4 });
        }
      }
      // 4. round the shoal at the far jetty's root: pieces off the shoal's own rim and between its plates
      if (shared.shoal) shared.shoal.plates.forEach(([ps, pd, pr], i) => {
        into('shoal', P.jetty.s - K.sight * 0.7, 1e9);
        const n = i === 0 ? 7 : pr > 0.5 ? 2 : rnd() < 0.5 ? 1 : 0;
        for (let k = 0; k < n; k++) {
          const a = rnd() * 6.283, size = i === 0 ? 0.3 + 0.5 * rnd() : 0.16 + 0.22 * rnd(), off = pr * (i === 0 ? 1.0 : 1.05) + size * 0.5 + 0.06 + 0.25 * rnd();
          const s = ps + Math.sin(a) * off * (i === 0 ? 0.66 : 1), d = pd + Math.cos(a) * off;
          if (shared.shoal.plates.some(([qs, qd, qr], j) => j !== i && Math.hypot(qs - s, qd - d) < qr + size * 0.5 + 0.04)) continue;
          const q = sky.at(s, d), toward = Math.atan2(sky.at(ps, pd).z - q.z, sky.at(ps, pd).x - q.x);
          raft(q.x, q.z, size, 0, { cuts: rnd() < 0.7 ? [[toward + (rnd() - 0.5) * 0.6, 0.3 + 0.3 * rnd()]] : [], young: rnd() < 0.4, top: 0.006 + 0.012 * rnd(), tilt: (rnd() - 0.5) * 0.05, tiltDir: rnd() * 6.283 });
        }
      });
      {
        const mat = sky.paint({ vertexColors: true, air: 'near', salt: 'pan', brush: 0.6, extend: [lampFall, lanternFall, net, crisp(T.crisp[0], T.crisp[1])] });
        const group = new THREE.Group(); group.name = 'crust rafts'; let triangles = 0;
        for (const [key, q] of parts) {
          if (!q.idx.length) continue;
          const geo = new THREE.BufferGeometry();
          geo.setAttribute('position', new THREE.Float32BufferAttribute(q.pos, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(q.nor, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(q.col, 3)); geo.setIndex(q.idx); geo.normalizeNormals();
          const mesh = new THREE.Mesh(geo, mat); mesh.name = 'crust rafts: ' + key; group.add(mesh); farThings.push({ o: mesh, s: q.s }); triangles += q.idx.length / 3;
        }
        ctx.add(group);
        shared.flats.rafts = { group, list, triangles };
      }
    }

    // ---- SHED FEATHERS AT THE WATERLINE (the page's close band, "the flats, left"). The flock stands here every night: what
    // it has dropped lies where the still water of the laps has carried it, afloat against the crust's edge, and on the
    // crust beside the lines of prints. Each a small cupped blade, one vane narrower than the other, downy and grey at
    // its foot; a bird's plumage out of the sun (the page: no pink below the sunline), two with the ink of a flight
    // feather, one covert's crimson gone dusty. Still: the ones that fall and float and are moved by the bow are the cast's.
    {
      const Fk = K.feathers, rnd = ctx.rng(Fk.seed), pos = [], col = [], idx = [], c = new THREE.Color(), places = [];
      const plume = new THREE.Color(C.plumage), rose = new THREE.Color('#E6C4CC'), ink = new THREE.Color('#2E2634'), crimson = new THREE.Color('#B4586C'), down = new THREE.Color('#CFC8D6');
      const shade = new THREE.Color('#9D94BC');
      const feather = (x, y, z, len, turn, kind, onCrust = false) => {
        const n = 6, ct = Math.cos(turn), st = Math.sin(turn), bend = (rnd() - 0.5) * 0.6, cup = 0.006 + 0.012 * rnd(), body = kind === 'crimson' ? crimson : c.copy(plume).lerp(rose, 0.2 + 0.5 * rnd()).clone();
        // (on pale crust a pale feather is nothing: the shade it lies on is laid first, a little wider than itself)
        if (onCrust) { const b0 = pos.length / 3; for (let i = 0; i <= n; i++) { const t = i / n, along = (t * 1.1 - 0.05) * len, side = bend * len * t * t + 0.012, wide = 0.5 * len * 0.3 * Math.pow(Math.sin(Math.PI * Math.min(1, t * 0.9 + 0.1)), 0.7);
          for (const e of [-1, 1]) { const lz = side + e * wide; pos.push(x + along * ct - lz * st, y - 0.002, z + along * st + lz * ct); col.push(shade.r, shade.g, shade.b); }
          if (i) { const a = b0 + (i - 1) * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); } } }
        const base = pos.length / 3;
        for (let i = 0; i <= n; i++) {
          const t = i / n, along = t * len, side = bend * len * t * t;
          const wide = 0.5 * len * 0.23 * Math.pow(Math.sin(Math.PI * Math.min(1, t * 0.9 + 0.1)), 0.7) * (1 - 0.25 * t);
          const lift = cup * Math.sin(Math.PI * t) + 0.02 * len * t * t * 4;      // it lies cupped, its tip a little off the ground
          for (const e of [-1, 1]) {
            const lz = side + e * wide * (e < 0 ? 0.75 : 1.15);                  // one vane narrower than the other
            pos.push(x + along * ct - lz * st, y + lift + 0.5 * wide * 0.5, z + along * st + lz * ct);
            c.copy(body).lerp(down, 1 - smooth(0.0, 0.3, t));                     // downy and grey at its foot
            if (kind === 'ink') c.lerp(ink, smooth(0.45, 0.75, t));               // a flight feather: its outer half ink
            c.multiplyScalar(e < 0 ? 0.9 : 1.0); col.push(c.r, c.g, c.b);
          }
          if (i) { const a = base + (i - 1) * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
        }
        places.push({ x, z });
      };
      const Sf = info.shoreFine, shoreD = (s) => { const f = (s - Sf.s0) / Sf.step, i = Math.max(0, Math.min(Sf.d.length - 2, Math.floor(f))); return lerp(Sf.d[i], Sf.d[i + 1], Math.max(0, Math.min(1, f - i))); };
      const kinds = ['ink', 'crimson', 'ink']; let made = 0;
      const kindOf = () => (made++ % 6 === 2 && kinds.length ? kinds.shift() : 'plume');
      if (Sf) {
        // afloat in the laps, against the crust (the hull cannot come here)
        for (const [cs] of info.cusps) {
          if (cs < Fk.reach[0] || cs > Fk.reach[1] || rnd() > Fk.laps) continue;
          for (let k = 0; k < (rnd() < 0.35 ? 2 : 1); k++) {
            // (afloat in open water between the rafts of the lap: a pale thing on dark water)
            let q = null;
            for (let t = 0; t < 8 && !q; t++) {
              const s = cs + (rnd() - 0.5) * 1.6, d = shoreD(s) + 0.1 + 0.4 * rnd(), p = sky.at(s, d);
              if (!shared.flats.rafts || !shared.flats.rafts.list.some((r) => Math.hypot(r.x - p.x, r.z - p.z) < r.r + 0.1)) q = p;
            }
            if (q) feather(q.x, 0.003, q.z, lerp(Fk.length[0], Fk.length[1], rnd()), rnd() * 6.283, kindOf());
          }
        }
        // on the crust, beside where a line of prints leaves the water
        for (const [ts, td] of info.trails) {
          if (ts < Fk.reach[0] || ts > Fk.reach[1] || rnd() > Fk.trails) continue;
          const s = ts + (rnd() - 0.5) * 1.2, d = td - 0.25 - 0.9 * rnd(), h = heightAtRoute(s, d);
          if (h === null || h < 0.02) continue;
          const q = sky.at(s, d); feather(q.x, h + 0.005, q.z, lerp(Fk.length[0], Fk.length[1], rnd()), rnd() * 6.283, kindOf(), true);
        }
      }
      if (idx.length) {
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); geo.setIndex(idx); geo.computeVertexNormals();
        const mesh = new THREE.Mesh(geo, sky.paint({ vertexColors: true, side: THREE.DoubleSide, air: 'near', brush: 0.15, extend: [lampFall, lanternFall, crisp(Fk.crisp[0], Fk.crisp[1])] }));
        mesh.name = 'shed feathers'; ctx.add(mesh); farThings.push({ o: mesh, s: [Fk.reach[0] - K.sight * 0.6, 1e9] });
        shared.flats.feathers = { mesh, places, count: places.length };
      }
    }
  }

  // ---------------------------------------------------------------------------------------------- fallen-star pebbles and their scour hollows
  // The body of a fallen star and the place it lies in (the page's kit table and cast row 2: "within 15 m each is a
  // faceted pebble 6 to 9 cm (3 variants, 24 triangles) in a scour hollow"). Three pebbles and one hollow, modelled
  // (pebble.py), and a way of laying them: shared.pebbles.lay(list). THE LIGHTS, THEIR PLACES AND THEIR RISING ARE THE
  // CAST'S: this module lays pebbles under whatever lights it finds in shared.fallen on its first frame (the layout's
  // stand-in lights, today), and stands back if the cast has called lay() itself. See "FOR THE CAST" in the log.
  //   pebbles   three instanced draws (one a variant), opaque, a hand under the water, in the direct view only. A pebble
  //             gives off its own cold light (its paint is its light: each face keeps its own value), breathes with its
  //             star's own phase, brightens beside the prow lantern, lifts with its star on the show's clock and goes out
  //             at the sunline. Beyond `near` metres from the eye it is not drawn (the cast's dab is all there is to see).
  //   hollows   one instanced draw, laid over the bed (which writes no depth) and faded out at its rim, so it has no edge
  //             on the sand; it wears the bed's own painting, rubbed smooth where the water scoured, takes the lantern
  //             as the bed does, and is lit from its middle by its own star until the star has gone.
  {
    const Kp = K.pebbles, tmp = {}, clock = { value: -1 };
    const take = async (file) => { const m = await kit.models(M + file, [{ position: [0, -40, 0] }], {}); const g = m.meshes[0].geometry.clone(); g.computeBoundingBox(); m.group.removeFromParent(); for (const me of m.meshes) me.material.dispose(); return g; };
    const geo = { a: await take('pebble_a.glb'), b: await take('pebble_b.glb'), c: await take('pebble_c.glb'), hollow: await take('hollow.glb') };
    const long = {}; for (const k of 'abc') { const b = geo[k].boundingBox; long[k] = Math.max(b.max.x - b.min.x, b.max.y - b.min.y, b.max.z - b.min.z); }
    const deep = -geo.hollow.boundingBox.min.y;                                  // how far the hollow dips, read off the model
    const bedAt = (sr, d) => -lerp(P.depth.line, P.depth.edge, sr < 150 ? smooth(24, 36, Math.abs(d)) : sr > 232 ? smooth(20, 32, Math.abs(d)) : 0);      // (set.js: depthAt)
    const edgeAt = (sr, d) => (sr < 150 ? smooth(24, 36, Math.abs(d)) : sr > 232 ? smooth(20, 32, Math.abs(d)) : 0);
    const bedOrder = ((ctx.group.getObjectByName('lake bed') || {}).renderOrder) ?? -6;
    const glowU = { value: new THREE.Vector3(Kp.glow, Kp.pool, Kp.lantern) };      // the pebble's own light; how much of it lies in its hollow; how much more beside the prow lantern
    // the star's life, as the layout's lights have it (cast.js): the time it lifts on the show's clock, then straight up
    // at walking pace and gaining, drifting west; it goes out as it crosses the sunline. kLift is what the cast replaces.
    const RISE = 'if (kTau > 0.0) kLift = vec3(0.0, 0.5 * kTau + 0.11 * kTau * kTau, 0.2 * kTau);';
    const life = (rise) => /* glsl */`
      vec3 kC = instanceMatrix[3].xyz, kLift = vec3(0.0); float kTau = uStarClock - aStar.x;
      ${rise}
      float kLit = 1.0 - smoothstep(uSunline.x - 0.5 * uSunline.y, uSunline.x + 0.5 * uSunline.y, kC.y + kLift.y);
      float kSeen = 1.0 - smoothstep(${Kp.near[0].toFixed(1)}, ${Kp.near[1].toFixed(1)}, distance(kC + kLift, uCameraPos));
      float kBreath = 0.8 + 0.2 * sin(6.2832 * (uTime * aStar.z + aStar.y));`;
    const lay = (list, o = {}) => {
      // (in stretches of the route, `stretch` metres each: only the stretches round the boat are drawn. Laid as four meshes
      // for the whole lake, seven hundred pebbles and hollows were a hundred thousand triangles a frame, nearly all of
      // them scaled to nothing by the vertex shader)
      const rnd = ctx.rng(o.seed ?? Kp.seed), stretches = new Map(), laid = [], c = new THREE.Color();
      const stretch = (sr) => { const k = Math.floor(sr / Kp.stretch); if (!stretches.has(k)) stretches.set(k, { k, by: { a: [], b: [], c: [] }, starA: { a: [], b: [], c: [] }, hol: [], holStar: [], holTint: [], meshes: [] }); return stretches.get(k); };
      const uClock = o.clock || clock, rise = o.rise || RISE;
      list.forEach((st, i) => {
        const l = ctx.path.locate(st.x, st.z, null, tmp), sr = l.s, d = l.d;
        if (!o.all && Math.abs(d) > kit.halfWidth(sr) + Kp.within) return;         // never within 15 m of water the boat can reach: a light is all it is
        const k = 'abc'[Math.floor(rnd() * 3) % 3], bed = bedAt(sr, d), hs = lerp(Kp.hollow[0], Kp.hollow[1], rnd()), size = lerp(Kp.size[0], Kp.size[1], rnd()) / long[k];
        const { by, starA, hol, holStar, holTint } = stretch(sr);
        // (half sunk in the sand as it fell, its waist at the bed's own level; the scour has bared its upstream flank. Its top
        // is then 3 cm over the bed: a light the cast hangs "a hand above the bed" sits on it and not beyond it)
        const y = bed - 0.006, star = [st.t0 ?? 1e9, st.phase ?? rnd(), st.rate ?? 0.09, st.light ?? 1];
        by[k].push({ position: [st.x, y, st.z], rotation: [(rnd() - 0.5) * 0.5, rnd() * 6.283, (rnd() - 0.5) * 0.5], scale: size, color: st.color || C.starWhite });
        starA[k].push(...star);
        // the hollow: its crescent up the route (the current runs down it), never quite square to it, no two the same size
        hol.push({ position: [st.x, bed + 0.0015, st.z], rotation: kit.headingAt(Math.min(sr, ctx.path.length)) + (rnd() - 0.5) * 0.7, scale: [hs * (0.9 + 0.25 * rnd()), hs, hs * (0.9 + 0.3 * rnd())] });
        holStar.push(...star); c.set(st.color || C.starWhite); holTint.push(c.r, c.g, c.b, edgeAt(sr, d));
        laid.push({ i, x: st.x, y, z: st.z, variant: k });
      });
      const group = new THREE.Group(); group.name = 'fallen-star pebbles and hollows';
      const meshes = [], hollowMeshes = [];
      for (const st of stretches.values()) {
      const { by, starA, hol, holStar, holTint } = st;
      for (const k of 'abc') {
        if (!by[k].length) continue;
        const g = geo[k].clone(); g.setAttribute('aStar', new THREE.InstancedBufferAttribute(new Float32Array(starA[k]), 4));
        // (crisp: a pebble is fifteen pixels wide at 3 m and its faces five: the painter's filter made one pale blot of it)
        const m = kit.instances(g, sky.paint({ vertexColors: true, flat: true, bed: true, brush: 0.2, shade: 0, crisp: true, extend: [{
          uniforms: { uStarClock: uClock, uStarGlow: glowU, ...(o.uniforms || {}) },
          vertexPars: `attribute vec4 aStar; uniform float uStarClock; uniform vec4 uSunline; varying vec2 vStar; ${o.pars || ''}`,
          vertexLocal: `${life(rise)} transformed *= kSeen * step(0.02, kLit); vStar = vec2(kLit * kBreath * aStar.w, smoothstep(0.0, 1.5, kLift.y));`,
          vertexWorld: 'wp.xyz += kLift;',
          fragmentPars: 'varying vec2 vStar; uniform vec3 uStarGlow;',
          // (it is a light, not a lit thing: the lamps' amber is taken off it again, and those within 3 m of the prow lantern
          // brighten by half and stay pale: the page's rule 7 for the kept lamp)
          light: 'c -= albedo * lamps; glow += albedo * (uStarGlow.x * vStar.x * (1.0 + uStarGlow.z * (1.0 - smoothstep(1.5, 3.5, distance(vWPos.xz, uLanternPos.xz))) * (1.0 - vStar.y)));',
        }] }), by[k]);
        m.name = 'fallen-star pebbles: ' + k + ' ' + st.k; m.renderOrder = bedOrder + 1; ctx.only(m, 'direct'); group.add(m); meshes.push(m); st.meshes.push(m);
      }
      if (hol.length) {
        const g = geo.hollow.clone();
        g.setAttribute('aStar', new THREE.InstancedBufferAttribute(new Float32Array(holStar), 4)); g.setAttribute('aHollow', new THREE.InstancedBufferAttribute(new Float32Array(holTint), 4));
        const bedPaint = sky.BED_PAINT_GLSL && sky.bedUniforms;                 // the Light group's painted bed (set.js); plain sand without it
        const mat = sky.paint({ vertexColors: true, bed: true, transparent: true, brush: 0.35, extend: [bedLamp, {
          uniforms: { uStarClock: uClock, uStarGlow: glowU, ...(bedPaint ? sky.bedUniforms : {}), ...(o.uniforms || {}) },
          vertexPars: `attribute vec4 aStar, aHollow; uniform float uStarClock; uniform vec4 uSunline; varying vec4 vHollow; varying vec4 vHollowC; varying vec2 vHollowS; ${o.pars || ''}`,
          vertexLocal: `${life(rise)} transformed *= step(0.004, kSeen); vHollow = aHollow; vHollowC = vec4(kC, kSeen); vHollowS = vec2((1.0 - smoothstep(0.0, 1.2, kTau)) * kLit * kBreath * aStar.w, 0.0);`,
          fragmentPars: `varying vec4 vHollow; varying vec4 vHollowC; varying vec2 vHollowS; uniform vec3 uStarGlow; ${bedPaint ? sky.BED_PAINT_GLSL : ''}`,
          albedo: /* glsl */`{ float kIn = vUv0.x;                                 // 1 inside .. 0 on its outer ring
            ${bedPaint ? 'albedo *= bedColour(mix(bedPaint(vWPos.xz, vHollow.w), 0.4, 0.6 * smoothstep(0.3, 0.95, kIn)), vHollow.w);' : ''}      // the bed's own painting runs in over the rim and is rubbed smooth in the scour
            alpha *= smoothstep(0.0, 0.85, kIn) * vHollowC.w; }`,
          // its own star lights it from its middle: the walls that face the star, and the tail behind it
          light: /* glsl */`{ vec3 kTo = vHollowC.xyz + vec3(0.0, 0.035, 0.0) - vWPos; float kD = length(kTo);
            c += albedo * vHollow.rgb * (uStarGlow.x * uStarGlow.y * vHollowS.x * clamp(dot(N, kTo / max(kD, 1e-3)) * 0.6 + 0.5, 0.0, 1.0) / (1.0 + 260.0 * kD * kD)); }`,
        }] });
        mat.depthWrite = false;
        const hollows = kit.instances(g, mat, hol);
        hollows.name = 'scour hollows ' + st.k; hollows.renderOrder = -3; ctx.only(hollows, 'direct'); group.add(hollows); hollowMeshes.push(hollows); st.meshes.push(hollows);
      }
      }
      ctx.add(group);
      // which stretches are drawn: those within sight of the boat (call it every frame with the boat's distance along)
      const show = (s) => { for (const st of stretches.values()) { const on = s > st.k * Kp.stretch - Kp.near[1] - 2 && s < (st.k + 1) * Kp.stretch + Kp.near[1] + 2; for (const m of st.meshes) m.visible = on; } };
      const out = { group, meshes, hollows: hollowMeshes, laid, show, count: laid.length, clock: uClock, triangles: laid.length * (24 + geo.hollow.index.count / 3) };
      shared.pebbles.laid = out;
      return out;
    };
    shared.pebbles = { files: ['pebble_a', 'pebble_b', 'pebble_c', 'hollow'].map((f) => M + f + '.glb'), geometry: geo, lay, clock, glow: glowU, laid: null, deep };
  }

  // ---------------------------------------------------------------------------------------------- sedge
  // Ninety tufts in thirty groups (the page: twelve groups a side marking the open mirror's soft edges at d 35 to 38,
  // six more at the causeway ends and across the flats), 0.8 m blades, 240 triangles a tuft, grown here blade by blade:
  // every tuft is its own (one mesh for all ninety, one draw). A tuft is a crown of twenty-four blades, the inner ones
  // tall and nearly plumb, the outer ones shorter and laid over, a third of them dead and broken at a kink; six thin
  // stems stand above them, each with its small spike. Salt-dried and pale (#8E9484: dark tufts every 25 m along the
  // seam draw a horizon the first image must not have), a white crust on every blade where it leaves the water, and
  // thin things go into the mist first (2.2 times their distance).
  // A BLADE IS NEVER THINNER THAN THE PICTURE CAN DRAW. A blade is a centimetre wide: 8 m off it is a pixel, 35 m off
  // (from the line) a quarter of one, and the first version's tufts were a few dotted wires. Each blade is a ribbon
  // whose two edges are set out from its middle line in the vertex shader, never nearer together than 1.3 pixels of
  // whatever picture is being drawn (the view, the mirror): far off a tuft keeps its body and its fan of hairs.
  // STILL: the bow to the wind and to the hull is the cast's; shared.sedge.wind is ready for it (see the vertex code).
  {
    // (four meshes of one material, each skipped when it is out of the picture: the mirror's left edge, its right edge,
    // the left of the flats, the right. As one mesh the ninety tufts were drawn three times a frame wherever the boat was)
    const parts = {}, part = (key) => parts[key] || (parts[key] = { pos: [], nor: [], col: [], side: [], att: [], idx: [] });
    let pos, nor, col, side, att, idx;
    const into = (key) => { ({ pos, nor, col, side, att, idx } = part(key)); };
    const Sd = K.sedge, rnd = ctx.rng(Sd.seed), c = new THREE.Color(), c2 = new THREE.Color();
    const green = new THREE.Color(C.sedge), straw = new THREE.Color('#B3AC90'), grey = new THREE.Color('#878C80'), crustC = new THREE.Color('#EAE2D6'), wet = new THREE.Color('#5E625C'), headC = new THREE.Color('#7C7366');
    // one ribbon: stations from the root up: [t along it, half its width]; it stands in the plane (outward, up) and
    // bends in it (lean: how far its tip is laid over from the plumb; kink: where a dead one is broken, and by how much)
    const ribbon = (root, ang, H, lean, stations, tone, o = {}) => {
      const base = pos.length / 3, phase = rnd() * 6.283, twist = (rnd() - 0.5) * 1.2;
      const ox = Math.cos(ang), oz = Math.sin(ang);
      let px = 0, py = 0, prevT = 0, slope = 0;
      stations.forEach(([t, half], k) => {
        const L = H * (t - prevT); prevT = t;
        if (k) { px += Math.sin(slope) * L; py += Math.cos(slope) * L; }
        slope = lean * Math.pow(t, 1.4) + (o.droop || 0) * smooth(0.55, 1, t) + (o.kink && t >= o.kink.at ? o.kink.by : 0);
        const x = root.x + ox * px, y = root.y + py, z = root.z + oz * px;
        // the ribbon's own width lies across its plane, turned a little about its length (no two catch the light alike)
        const ta = twist * t, sx = -oz * Math.cos(ta) + ox * Math.sin(ta) * Math.cos(slope), sy = -Math.sin(ta) * Math.sin(slope), sz = ox * Math.cos(ta) + oz * Math.sin(ta) * Math.cos(slope);
        const sl = Math.hypot(sx, sy, sz) || 1;
        // its face looks outward and up
        const nx = ox * Math.cos(slope), ny = Math.sin(slope) * 0.6 + 0.25, nz = oz * Math.cos(slope), nl = Math.hypot(nx, ny, nz) || 1;
        // colour up the blade: wet at the water, a white crust above it, then its own tone paling to the tip
        c.copy(tone).lerp(straw, 0.4 * t);
        if (o.head && k >= stations.length - 2) c.copy(headC);
        if (y < 0.012) c.copy(wet); else if (y < 0.14) c.lerp(crustC, Math.min(1, 0.95 * (1 - (y - 0.012) / 0.128) + 0.08));
        for (const e of [-1, 1]) {
          pos.push(x, y, z); nor.push(nx / nl, ny / nl, nz / nl); side.push(sx / sl, sy / sl, sz / sl, e * half);
          c2.copy(c).multiplyScalar(e < 0 ? 0.9 : 1.0); col.push(c2.r, c2.g, c2.b);
          att.push(root.x, root.z, t, phase);
        }
        if (k) { const a = base + (k - 1) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
      });
    };
    const BLADE = [[0, 1], [0.22, 0.95], [0.5, 0.74], [0.8, 0.42], [1, 0.1]], STEM = [[0, 1], [0.5, 0.8], [0.86, 0.7], [0.94, 2.9], [1, 0.3]];
    const tuft = (x, y, z, size) => {
      const r0 = 0.045 + 0.06 * size;
      for (let i = 0; i < 24; i++) {                                                     // twenty-four blades: 192 triangles
        const ang = rnd() * 6.283, q = Math.sqrt(rnd()), rr = r0 * q, dead = rnd() < 0.3;
        const H = Sd.height * size * (dead ? 0.5 + 0.3 * rnd() : (1.02 - 0.5 * q * q) * (0.8 + 0.25 * rnd()));
        const tone = c.copy(green).lerp(dead ? straw : grey, dead ? 0.55 + 0.4 * rnd() : 0.6 * rnd()).clone();
        const w = (0.0075 + 0.0045 * rnd()) * (0.75 + 0.35 * size);      // (third holder: a sedge's blade is a finger wide at its foot; at half that a tuft was a few wires)
        ribbon({ x: x + Math.cos(ang) * rr, y, z: z + Math.sin(ang) * rr }, ang + (rnd() - 0.5) * 0.8, H, 0.1 + 0.95 * Math.pow(q, 1.3) + 0.25 * rnd() * rnd(),
          BLADE.map(([t, k]) => [t, w * k]), tone, { droop: 0.25 + 0.5 * rnd(), kink: dead && rnd() < 0.7 ? { at: 0.5, by: 0.9 + 1.2 * rnd() } : null });
      }
      for (let i = 0; i < 6; i++) {                                                      // six stems, each with its spike: 48 triangles
        const ang = rnd() * 6.283, rr = r0 * 0.6 * Math.sqrt(rnd());
        ribbon({ x: x + Math.cos(ang) * rr, y, z: z + Math.sin(ang) * rr }, ang, Sd.height * size * (i < 4 ? 1.0 + 0.28 * rnd() : 0.6 + 0.3 * rnd()), 0.04 + 0.28 * rnd() * rnd(),
          STEM.map(([t, k]) => [t, 0.0021 * k]), c.copy(green).lerp(straw, 0.4 + 0.5 * rnd()).clone(), { head: true, droop: 0.12 * rnd() });
      }
    };
    // where the groups stand: twelve a side along the open mirror's soft edges, never evenly; then the page's six
    const groups = [], floor = (sr, d) => { const h = shared.flats ? shared.flats.heightAtRoute(sr, d) : null; return h !== null && h > -0.02 ? h : -lerp(P.depth.line, P.depth.edge, sr < 150 ? smooth(24, 36, Math.abs(d)) : sr > 232 ? smooth(20, 32, Math.abs(d)) : 0); };
    for (const sd of [-1, 1]) { let sg = Sd.from + 5 * rnd(); for (let i = 0; i < 12; i++) { groups.push([sg, sd * (Sd.d[0] + (Sd.d[1] - Sd.d[0]) * rnd())]); sg += (Sd.to - Sd.from) / 12 * (0.55 + 0.9 * rnd()); } }
    for (const g of Sd.more) groups.push(g);
    const places = [];
    for (const [gs, gd] of groups) {
      const n = Sd.tufts, lead = rnd() * 6.283;
      into((gs < 190 ? 'mirror' : 'flats') + (gd < 0 ? ' left' : ' right'));
      for (let i = 0; i < n; i++) {
        const a = lead + i * 2.2 + rnd(), r = i ? 0.5 + 0.85 * rnd() : 0, sr = gs + Math.cos(a) * r, d = gd + Math.sin(a) * r * 0.8, q = sky.at(sr, d, 0);
        tuft(q.x, floor(sr, d) - 0.01, q.z, i ? 0.55 + 0.4 * rnd() : 0.95 + 0.3 * rnd());      // one tall tuft and two lesser beside it
        places.push({ x: q.x, z: q.z, s: sr, d });
      }
    }
    // THE BEND, ready for the cast and still until it is used. shared.sedge.wind.value = (bow, shiver, front z, hull):
    //   bow     how far a blade's tip is carried west once the wind front has passed its tuft, as a share of its height
    //           (the page: each group bows 25 degrees in turn: 0.45), eased in over the 5 m behind the front
    //   shiver  the share of its height it trembles by at 1.2 Hz behind the front (the page: 6 degrees: 0.1)
    //   front z kept by this module from shared.sky.front.z every frame
    //   hull    how far a blade leans away from the hull when the boat is within 2.5 m, as a share of its height
    const uWind = { value: new THREE.Vector4(0, 0, -1e5, 0) };
    const bend = { uniforms: { uSedgeWind: uWind, uSedgePx: { value: Sd.px } }, vertexPars: 'attribute vec4 aSedge, aSide; uniform vec4 uSedgeWind, uPass; uniform float uSedgePx;',
      // (the two edges, set out from the middle line: never nearer than uSedgePx pixels of the picture being drawn)
      vertexLocal: /* glsl */`{ float kD = length((modelViewMatrix * vec4(position, 1.0)).xyz);
        transformed = position + aSide.xyz * (sign(aSide.w) * max(abs(aSide.w), uSedgePx * kD / max(uPass.x, 1.0))); }`,
      vertexWorld: /* glsl */`{
        float t = aSedge.z, k = t * t, blown = 1.0 - smoothstep(0.0, 5.0, aSedge.y - uSedgeWind.z);      // (the wind is on the water east of the front: z below it)
        float bow = (uSedgeWind.x + uSedgeWind.y * sin(uTime * 7.54 + aSedge.w)) * blown;
        vec2 away = aSedge.xy - uBoat.xz; float near = uSedgeWind.w * (1.0 - smoothstep(1.2, 2.5, length(away)));
        vec2 push = vec2(0.0, bow) + normalize(away + vec2(1e-4)) * near;
        float h = max(wp.y, 0.0); wp.xz += push * k * 0.8; wp.y -= h * min(dot(push, push), 1.0) * k * 0.35; }`,
      // (thin things go into the mist first)
      fog: `fog = 1.0 - pow(1.0 - fog, ${(P.sedge.thin * P.sedge.thin).toFixed(2)});` };
    const mat = sky.paint({ vertexColors: true, side: THREE.DoubleSide, brush: 0.3, air: 'near', extend: [bend, lampFall, lanternFall, crisp(0, 1)] });
    const group = new THREE.Group(), meshes = []; group.name = 'sedge (90 tufts)';
    let triangles = 0;
    for (const [key, q] of Object.entries(parts)) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(q.pos, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(q.nor, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(q.col, 3));
      geo.setAttribute('aSide', new THREE.Float32BufferAttribute(q.side, 4)); geo.setAttribute('aSedge', new THREE.Float32BufferAttribute(q.att, 4));
      geo.setIndex(q.idx); geo.computeBoundingSphere(); geo.boundingSphere.radius += 1.5;      // (room for the bow to the wind)
      const mesh = new THREE.Mesh(geo, mat); mesh.name = 'sedge: ' + key;
      mesh.onBeforeRender = (renderer, scene, camera, geometry, material) => sky.pass(renderer, camera, material);      // (uPass: the pixels of THIS picture, the view's or the mirror's)
      group.add(mesh); meshes.push(mesh); triangles += q.idx.length / 3;
    }
    ctx.add(group);
    shared.sedge = { count: places.length, tufts: places, groups, mesh: group, meshes, wind: uWind, triangles };
    removeStandIn(ctx, 'sedge tufts');
  }

  // &shallows=dump: where everything of this module stands, in route metres, to .shots/sky_sh_dump.json (for finding views)
  const dump = () => {
    if (new URLSearchParams(location.search).get('shallows') !== 'dump') return;
    const loc = {}, rd = (x, z) => { const l = ctx.path.locate(x, z, null, loc); return [+l.s.toFixed(1), +l.d.toFixed(1)]; };
    const out = { stakes: (shared.stakes || []).map((st) => [...rd(st.x, st.z), +st.top.toFixed(2), st.variant]), sedge: shared.sedge ? shared.sedge.groups.map((g) => [+g[0].toFixed(1), +g[1].toFixed(1)]) : [],
      pebbles: shared.pebbles && shared.pebbles.laid ? shared.pebbles.laid.laid.map((q) => [...rd(q.x, q.z), q.variant]) : [], pebbleCount: shared.pebbles && shared.pebbles.laid ? shared.pebbles.laid.count : 0, fallen: shared.fallen ? shared.fallen.length : 0,
      feathers: shared.flats && shared.flats.feathers ? shared.flats.feathers.places.map((q) => rd(q.x, q.z)) : [], rafts: shared.flats && shared.flats.rafts ? { count: shared.flats.rafts.list.length, triangles: shared.flats.rafts.triangles } : null };
    fetch('/__shot/sky_sh_dump.json', { method: 'POST', body: JSON.stringify(out) }).catch(() => {});
  };
  return {
    update() {
      // the pebbles: under the layout's lights until the cast lays them itself (it then drives its own clock)
      if (shared.pebbles && !shared.pebbles.laid && shared.fallen) { shared.pebbles.lay(shared.fallen); dump(); }
      if (shared.pebbles) { shared.pebbles.clock.value = sky.T; if (shared.pebbles.laid) shared.pebbles.laid.show(ctx.s); }
      if (shared.sedge && shared.sedge.wind && sky.front) shared.sedge.wind.value.z = sky.front.z;
      if (brineU) { brineU.value.z = smooth(K.terraces.brine.dawn[0], K.terraces.brine.dawn[1], sky.e); if (brineSkin) brineSkin.visible = brineU.value.z > 0.002; }
      if (landForms) { const near = ctx.s > K.terraces.far; landForms.near.visible = near; landForms.far.visible = !near; }
      for (const f of farThings) f.o.visible = ctx.s > f.s[0] && ctx.s < f.s[1];
      uCrisp.value = sky.air.near.value.x >= P.air.open[0] - 1 ? 1 : 0;
      uBedLamp.value = lerp(P.light.bed.lantern, P.light.bed.lanternDawn, smooth(0.3, 0.8, sky.e));
    },
  };
}
