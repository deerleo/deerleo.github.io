// The dyers' reach: THE FRAMES. The timber the cloth hangs from, and the ropes that hold it (stage 2, kit and close band).
// Page: docs/art/reach.md, sections 3 ("Set pieces", "Close band") and 9 ("Kit pieces"). Log: docs/build/reach/2-kit-frames.md.
//
//   the nave          twelve masts (three variants, instanced) standing in the ford, the six yards their ranks hang
//                     from, the wall plates at 15 m for the aisle walls, lashings where they cross, lifts and ties as ropes
//   veil and narthex  three sawn frames, pale and new
//   every other rail  a rail under every bolt of cloth that has none (peeled poles end to end), with its masts and posts:
//                     outer aisles, the indigo house, the blue yard, the red yard, the terrace line, the loft
//   rope rings        all along every rail, where cloth hangs
//   the silk masts    four on the lagoon's banks, six on the tenter grounds
//   in the water      rinsing posts (two clusters, in the channel), the boom (baulks riding the water, chain, posts)
//   far off           the tenter fences
//
// HOW THE TIMBER FINDS THE CLOTH. Nothing here moves a bolt. Every rail is built at run time from shared.cloth.bolts
// (kit.js: `position` = the middle of a bolt's top edge, `width`, `turn`): bolts that hang in one plane on one line are
// one rail, and THE RAIL'S AXIS LIES IN THE CLOTH'S OWN PLANE AT THE HEIGHT OF ITS TOP EDGE (a little above), so the top
// edge is inside the rail and the cloth comes out of its belly. If a bolt is moved in kit.js its rail follows.
//
// WHERE THE NAVE'S MASTS STAND, AND WHY NOT WHERE THE PLAN SAYS. The plan puts a mast at half width + 1.6 in its rank's
// own plane, and the rank's outermost bolt (d 10.8, 2.6 m wide) reaches d 12.1: at four frames of six that bolt hung
// through its mast, and the aisle wall's cloth hangs in the masts' own line 0.6 m from each. So a mast stands INSIDE the
// aisle wall (0.56 m nearer the channel than the plan's point) and UP-ROUTE of its rank (0.75 m), where no cloth can
// reach it even in a wind (cloth blows down-route), and leans 1.7 degrees into its work: down-route until it touches the
// yard, outward until it touches the wall plate at 15 m. Both are lashed to it where they touch (plan.frames.nave).
//
// shared.frames = { heads: [{ x, y, z, s, side, kind }]   every mast head of mine with a ring a silk can be tied to
//                   masts: [{ s, side, foot, axis, height, variant, point(name) }]   the nave's twelve
//                   rails: [{ a, b, radius, kind }]        every rail's axis
//                   rinsing: [{ ties: [Vector3 x 3], perches: [Vector3 x 3] }]   where each streaming bolt begins; pile heads
//                   boom: { posts: [Vector3] (their heads: perches), baulks: [{ a, b }] }
//                   hangEnds: [Vector3]                    the free ends of the ropes left hanging (a forearm above the water: they drip)
//                   wetFeet: [{ p, r, s }]                 every timber of mine that stands in the water (rings, drips, foam gather there)
//                   tieBacks: [{ from, to, s, side }]      the slack ropes from six masts' strops to rings in the quay wall (a row of swallows; a drip)
//                   counts }
import * as THREE from 'three';
import { removeStandIn } from '../../engine/modules.js';
import { makeRopes } from '../../engine/life/ropes.js';
import { floatRide } from '../../engine/life/floaters.js';

const QS = new URLSearchParams(location.search);
const UP = new THREE.Vector3(0, 1, 0);

// ---------------------------------------------------------------------------------------------- the marks the dye bath leaves
// Timber (and rope) that stands in the river carries three tide lines, in the dyes of the place where it stands: the
// lowest today's, the two above it older. Drawn by where a thing stands, so one model serves every bay and both banks.
// (Page: indigo lowest, then violet, then madder on the left bank, reversed on the right; weld yellow in bays 1 and 2.)
const stain = (hex, k = 1) => { const c = new THREE.Color(hex).multiplyScalar(k); return `vec3(${c.r.toFixed(4)}, ${c.g.toFixed(4)}, ${c.b.toFixed(4)})`; };
// (SECOND LOOK: the lines stood at 0.36, 0.56 and 0.80 m as three even stripes, like socks. They stand higher now, over
// the rope at the butt (0.44, 0.64, 0.88: the eye is 1.1 m up); today's is the strong one, the two older ones are faint
// and missing for stretches; rope and iron take a third of what timber takes.)
const DYE_PARS = {
  fragmentPars: /* glsl */`
    vec3 kfDye(int i) {      // the six dyes as they lie on wet timber: cream (the scum of weld), saffron, madder, crimson, violet, indigo
      return i == 0 ? ${stain('#8E7E5C')} : i == 1 ? ${stain('#A8782A')} : i == 2 ? ${stain('#93402C')} : i == 3 ? ${stain('#7E2238')} : i == 4 ? ${stain('#5E3A7C')} : ${stain('#34427C')};
    }
    float kfN(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); vec2 h = vec2(127.1, 311.7);
      float a = fract(sin(dot(i, h)) * 43758.5453), b = fract(sin(dot(i + vec2(1.0, 0.0), h)) * 43758.5453), c = fract(sin(dot(i + vec2(0.0, 1.0), h)) * 43758.5453), d = fract(sin(dot(i + vec2(1.0, 1.0), h)) * 43758.5453);
      return mix(mix(a, b, f.x), mix(c, d, f.x), f.y); }
    ivec3 kfZone(vec3 p) {   // the three dyes at a place: x the lowest line (today's), y and z the older ones above it
      float z = p.z;
      float cx = z > -92.0 ? 0.0 : z > -122.0 ? mix(0.0, 4.0, (-92.0 - z) / 30.0) : z > -152.0 ? mix(4.0, 11.0, (-122.0 - z) / 30.0) : z > -180.0 ? mix(11.0, 18.5, (-152.0 - z) / 28.0)
        : z > -205.0 ? mix(18.5, 24.0, (-180.0 - z) / 25.0) : z > -233.0 ? mix(24.0, 35.5, (-205.0 - z) / 28.0) : 36.5;
      bool left = p.x < cx;
      if (z > -48.0) return ivec3(1, 0, 1);
      if (z > -70.0) return left ? ivec3(1, 2, 1) : ivec3(2, 1, 2);
      if (z > -100.0) return left ? ivec3(5, 4, 2) : ivec3(2, 4, 5);
      if (z > -200.0) return left ? ivec3(5, 4, 5) : ivec3(2, 3, 2);
      return left ? ivec3(5, 4, 5) : ivec3(4, 5, 4);
    }
    float kfWoodAt(float a) { return 1.0 - smoothstep(0.3, 0.5, a); }      // what a point is made of travels in its paint's alpha: 0.2 timber, 0.6 cloth or yarn, 1 rope and iron (f_lib.py)
    float kfMarkAt(float a) { return mix(0.35 * smoothstep(0.65, 0.75, a), 1.0, kfWoodAt(a)); }      // how much of the water's dye marks it takes: timber all, rope and iron a third, cloth none
    float kfRopeAt(float a) { return smoothstep(0.72, 0.78, a) * (1.0 - smoothstep(0.82, 0.88, a)); }      // 0.8: rope wound round a timber, turn on turn (f_lib.rope_band)`,
};
const DYE_MARKS = {
  albedo: /* glsl */`
    if (vWPos.y < 1.25 && vWPos.y > -0.7) {
      #ifdef USE_COLOR_ALPHA
        float kT = kfMarkAt(vColor.a);
      #else
        float kT = 1.0;
      #endif
      ivec3 kz = kfZone(vWPos);
      // a line wanders as the water lay against the thing that day, wicks up the grain in fingers, and is broken where the
      // timber was dry or rubbed
      vec2 kq = vec2(vWPos.x + vWPos.z * 0.7, vWPos.z - vWPos.x * 0.7);
      float kw = 0.15 * (kfN(kq * 2.3) - 0.5) + 0.05 * (kfN(kq * 7.0 + 3.1) - 0.5);
      float kf = kfN(kq * 31.0) * kfN(kq * 13.0 + 5.0);                            // the fingers: fine, along the surface
      float kb = 0.4 + 0.6 * smoothstep(0.25, 0.7, kfN(kq * 4.1 + vec2(0.0, vWPos.y * 3.0)));
      float kg2 = smoothstep(0.2, 0.45, kfN(kq * 1.3 + 11.0)), kg3 = smoothstep(0.32, 0.52, kfN(kq * 1.1 + 23.0));      // the older lines are there for a stretch and gone for a stretch (sixth look: there on more timbers than not: in the first bays a mast showed one yellowish glaze and no line above it)
      float kh = vWPos.y + kw - 0.04 * kf;
      // each line is drawn along its top (where the bath's scum dried: a dark thread) and fades downward over a hand: where
      // the bath stood longest it bit deepest. (FOURTH PAIR OF EYES: the fingers stood a hand tall and the field under the
      // lowest line was the dye's own body at half strength: a saw edge over pale yellow, like peeling paint. The fingers
      // are a thumb tall now, the field a glaze, and each line has its dark thread.)
      float h3 = kh, h2 = kh + kw * 0.6, h1 = kh - kw * 0.5;
      float k3 = (1.0 - smoothstep(0.865, 0.900, h3)) * smoothstep(0.76, 0.88, h3);
      float k2 = (1.0 - smoothstep(0.625, 0.660, h2)) * smoothstep(0.50, 0.64, h2);
      float k1 = (1.0 - smoothstep(0.420, 0.465, h1)) * smoothstep(0.22, 0.44, h1);
      float t3 = exp(-pow((h3 - 0.878) / 0.011, 2.0)), t2 = exp(-pow((h2 - 0.640) / 0.011, 2.0)), t1 = exp(-pow((h1 - 0.440) / 0.013, 2.0));
      // (a dye on dark wet timber is a glaze: the timber shows through, deeper and tinted, and only where the bath dried is it the dye's own body)
      vec3 kd1 = kfDye(kz.x), kd2 = kfDye(kz.y), kd3 = kfDye(kz.z);
      albedo = mix(albedo, mix(albedo * (0.4 + 1.6 * kd3), kd3, 0.4), k3 * 0.52 * kb * kg3 * kT);
      albedo = mix(albedo, mix(albedo * (0.4 + 1.6 * kd2), kd2, 0.42), k2 * 0.6 * kb * kg2 * kT);
      albedo = mix(albedo, mix(albedo * (0.4 + 1.8 * kd1), kd1, 0.24), k1 * 0.5 * (0.5 + 0.5 * kb) * kT);
      albedo *= 1.0 - kT * (0.42 * t1 * (0.4 + 0.6 * kb) + 0.4 * t2 * kb * kg2 + 0.36 * t3 * kb * kg3);      // (sixth look: the two older lines' threads a little stronger: they are what says LINE)
      albedo = mix(albedo, albedo * (0.5 + 1.4 * kd1), 0.42 * kT * (1.0 - smoothstep(0.08, 0.44, kh)));      // what the water still reaches is stained with today's dye
    }`,
};
// THE TIMBER'S OWN PAINT (second look). The first holder drew a grain in the shader; in the ride it did not show, and the
// masts read as painted pipes. Now: the reach's painted oak tile (assets/art/reach/timber_oak.webp: the yards made it and
// wear it) laid on everything of mine that is TIMBER (the paint's alpha says which points are: f_lib.wood), its light
// and dark in full and a share of its colour, so that the adze marks, the checks and the warm strokes of the key
// painting's masts are on mine. `lie`: for a timber that lies (a yard, a pole, a baulk) the tile is laid in the model's
// own space with its grain along the model's X, and each copy takes its own piece of it; upright timber takes it from
// the world, grain up. On upright timber also: the place's dye in runs down from where wet cloth hangs against it aloft.
const timberPaint = (oak, o = {}) => ({
  uniforms: { tKfOak: { value: oak }, uKfOak: { value: new THREE.Vector4(1 / (o.across || 1.9), oak ? (o.strength ?? 1) : 0, o.colour ?? 0.6, o.runs ?? 0.7) } },
  // (A lying timber needs its own space, so its material has a line of vertex code. UPRIGHT timber must have NONE: the
  // sun's mask draws only things whose vertex shader is the plain one (light.js, sweep), and the nave's masts must stand
  // in it: a mast behind a glowing cloth has to cut the sun's coin, or the sun shows through timber. Yards, poles and
  // baulks never stand on the sun's line.)
  defines: o.lie ? { KF_LIE: '' } : {},
  ...(o.lie ? { vertexPars: 'varying vec3 vKfP; varying vec3 vKfN;',
    vertexLocal: /* glsl */`vKfP = transformed; vKfN = objectNormal;
    #ifdef USE_INSTANCING
      vKfP += fract(instanceMatrix[3].xyz * vec3(0.173, 0.291, 0.137)) * 5.0;
    #endif` } : {}),
  fragmentPars: 'uniform sampler2D tKfOak; uniform vec4 uKfOak;' + (o.lie ? ' varying vec3 vKfP; varying vec3 vKfN;' : ''),
  albedo: /* glsl */`
    {
      #ifdef USE_COLOR_ALPHA
        float kfWood = kfWoodAt(vColor.a);
      #else
        float kfWood = 0.0;
      #endif
      if (kfWood > 0.01) {
        #ifdef KF_LIE
          vec3 kn = pow(abs(normalize(vKfN)), vec3(4.0)); kn /= (kn.x + kn.y + kn.z);
          vec3 kq = vKfP * uKfOak.x;
          vec3 tx = texture2D(tKfOak, kq.zx).rgb * kn.y + texture2D(tKfOak, kq.yx).rgb * kn.z + texture2D(tKfOak, kq.yz).rgb * kn.x;
        #else
          vec3 tx = tri(tKfOak, vWPos * uKfOak.x, N);
        #endif
        tx /= vec3(0.179, 0.054, 0.086);                              // the tile's own mean: it changes the paint's light and dark, not its value
        vec3 km = mix(vec3(dot(tx, vec3(0.3333))), tx, uKfOak.z);
        albedo *= mix(vec3(1.0), clamp(km, 0.3, 2.2), uKfOak.y * kfWood);
        // CHECKS (third pair of eyes): old timber opens along its grain as it dries. Long dark lines that wander a little, begin
        // and end, a finger wide at most: along a lying timber's length, up a standing one. Near the eye only.
        {
          float kcNear = 1.0 - smoothstep(4.0, 15.0, length(vViewPos));
          if (kcNear > 0.01) {
            #ifdef KF_LIE
              vec2 kc = vec2(atan(vKfP.y, vKfP.z) * 2.6, vKfP.x * 0.3);
            #else
              vec2 kc = vec2(dot(vWPos.xz, vec2(-N.z, N.x)) * 7.0 + atan(N.z, N.x) * 3.0, vWPos.y * 0.3);
            #endif
            float kcn = kfN(kc + vec2(0.0, 0.25 * kfN(kc * vec2(0.6, 4.0))));
            float kcw = 0.02 + 0.03 * kfN(kc * vec2(0.5, 1.7) + 9.0);                                          // no two as wide
            float kcl = (1.0 - smoothstep(0.0, kcw, abs(kcn - 0.5))) * smoothstep(0.38, 0.62, kfN(kc * vec2(0.7, 2.3) + 31.0));
            albedo *= 1.0 - 0.62 * kcl * kcNear * kfWood;
          }
        }
        #ifndef KF_LIE
          // runs of the place's dye down the timber from where wet cloth hangs against it (the wall plate at 15 m, the yard
          // above): broad at the top, thinning to threads, gone by a man's reach
          float ry = vWPos.y, rtop = smoothstep(2.4, 9.5, ry) * (1.0 - smoothstep(16.5, 19.5, ry));
          if (rtop > 0.01) {
            vec3 rw = pow(abs(N), vec3(4.0)); float rk = rw.x / max(rw.x + rw.z, 1e-4);
            vec2 ra = vec2(vWPos.z, ry), rb = vec2(vWPos.x, ry);
            float rn = mix(kfN(rb * vec2(11.0, 0.13) + 2.2), kfN(ra * vec2(11.0, 0.13) + 2.2), rk);
            float rn2 = mix(kfN(rb * vec2(29.0, 0.6) + 7.7), kfN(ra * vec2(29.0, 0.6) + 7.7), rk);
            float run = smoothstep(0.86 - 0.34 * rtop, 0.96 - 0.3 * rtop, rn + 0.2 * (rn2 - 0.5));
            albedo = mix(albedo, albedo * 0.45 + kfDye(kfZone(vWPos).x) * 0.8, uKfOak.w * run * kfWood);
          }
        #endif
      }
      // THE LAY OF THE ROPE (third pair of eyes). Rope wound round a timber, turn on turn, was a ribbed sleeve: even rings
      // with nothing across them, a screw thread. Its strands are drawn across the turns here, on upright timber: a stripe
      // for every strand's crest, slanting across each turn, by the angle round the timber (from the normal) and the height.
      // Near the eye only: beyond a dozen metres a rope's lay is finer than the painter's brush.
      #ifdef USE_COLOR_ALPHA
      #ifndef KF_LIE
        float kfRope = kfRopeAt(vColor.a);
        if (kfRope > 0.01) {
          float kfNear = 1.0 - smoothstep(5.0, 13.0, length(vViewPos));
          float kfLay = sin(atan(N.z, N.x) * 34.0 + vWPos.y * 118.0 + 2.6 * kfN(vWPos.xz * 9.0 + vWPos.y * 40.0));
          albedo *= mix(1.0, 0.6 + 0.6 * smoothstep(-0.6, 0.6, kfLay), kfRope * kfNear);
        }
        // ROPE THAT HANGS (fifth pair of eyes): a coil on a peg, the turns on a cleat, a rope's end, a fall. A thumb-thick rope
        // two metres off with nothing across it is a leather strap. Its lay is drawn by height (a rope that hangs runs mostly
        // up and down), slanting across it by the way its surface faces: f_lib.hung marks such rope 0.9 in the paint's alpha.
        float kfHung = smoothstep(0.86, 0.89, vColor.a) * (1.0 - smoothstep(0.92, 0.95, vColor.a));
        if (kfHung > 0.01) {
          float kfNearH = 1.0 - smoothstep(4.0, 10.0, length(vViewPos));
          // (each rope of a coil has its own tone in the paint: it shifts the lay, so that the turns' strands do not line up into bands across the bundle)
          float kfLayH = sin(vWPos.y * 165.0 + atan(N.z, N.x) * 4.5 + dot(vWPos.xz, vec2(37.0, 23.0)) + vColor.r * 70.0 + 1.2 * kfN(vWPos.xz * 50.0 + vWPos.y * 30.0));
          albedo *= mix(1.0, 0.76 + 0.4 * smoothstep(-0.55, 0.55, kfLayH), kfHung * kfNearH);
        }
      #endif
      #endif
    }`,
});
// Thin timber and the painter's filter: anything narrower than the brush is wiped out, so a far mast, a rail, a ring are
// kept out of it BY DISTANCE (near, they are broad surfaces and stay painted): the mark in the picture's alpha eases from
// "paint me" (0.5) to "leave me" (-1.05) between two distances (src/engine/post.js reads it as a share).
const farCrisp = (from, to) => ({
  defines: { KF_CRISP0: from.toFixed(1), KF_CRISP1: to.toFixed(1) },
  final: 'gl_FragColor.a = 0.5 - 1.55 * smoothstep(KF_CRISP0, KF_CRISP1, length(vViewPos));',
});

export async function build(ctx, plan, shared) {
  const { kit, path } = ctx, FR = plan.frames, N = plan.nave;
  const rnd = ctx.rng(4217);
  const sun = shared.sun;
  const hw = (s) => kit.halfWidth(s);
  const P = {}, frameAt = (s) => { const a = path.at(s, P); return { t: new THREE.Vector3(a.tx, 0, a.tz), r: new THREE.Vector3(a.rx, 0, a.rz) }; };
  const locate = (p) => path.locate(p.x, p.z, null, {});
  const points = await fetch('assets/models/reach/f_points.json').then((r) => r.json());
  const counts = {};
  // Where the land stands at (s, d): the level of the step that point is on (set.js lays the banks; as kit.js reads them)
  const ground = (s, d) => {
    if (!shared.reach) return 0;
    // (the left bank's stepped land ends in a return wall at s 140: beyond it there is water as far as the low ground that
    // begins 50.2 m left of the line: set.js, "the low grounds". The blue yard stands in that water.)
    if (d < 0 && s > 140.2) return d < -50.2 ? 0.6 : -0.4;
    const side = d < 0 ? -1 : 1, b = shared.reach.bank(side, Math.min(s, side < 0 ? 139 : 400)), out = Math.abs(d) - hw(s);
    return out > b.out[2] ? b.y[2] : out > b.out[1] ? b.y[1] : out > b.out[0] ? b.y[0] : -0.4;
  };

  // what every timber of mine wears: the area's solid paint (rim against the sun, water-light at the foot, the dyed
  // light only inside its bar), the dye's tide lines, and crispness by distance
  // (the painted oak: &kfoak=0 leaves it off; &kfoak=0.5 half strength)
  let oak = null;
  if (QS.get('kfoak') !== '0') { try { oak = await ctx.tex('art/reach/timber_oak.webp', { repeat: true }); } catch (e) { console.error('reach/kit_frames: the oak tile did not load: ' + e); } }
  const oakK = QS.has('kfoak') ? +QS.get('kfoak') : 1;
  const timber = (crisp0, crisp1, more = {}) => {
    const { grain, lie, extra, ...rest } = more;                       // grain: upright timber (the tile from the world); lie: a lying timber (the tile along its own length)
    return {
      brush: 0.6, rim: { color: '#FFB878', strength: 0.22, power: 4.5, toward: 1 }, caustics: { intensity: 0.3, height: 0.8, scale: 0.4, color: '#FFD2A6' },
      extend: [sun && sun.extend, DYE_PARS, (grain || lie) && timberPaint(oak, { lie, strength: oakK }), DYE_MARKS, extra, farCrisp(crisp0, crisp1)].filter(Boolean), ...rest,
    };
  };

  // ---- small geometry: a frame of three axes at a place, as a kit.models placement
  const _m = new THREE.Matrix4(), _e = new THREE.Euler(), _x = new THREE.Vector3(), _y = new THREE.Vector3(), _z = new THREE.Vector3();
  /** A placement whose model X, Y, Z axes lie along ex, ey, ez (ey is kept, ez squared to it, ex made from both). */
  const posed = (origin, ey, ez, scale = 1, tint) => {
    _y.copy(ey).normalize(); _z.copy(ez).addScaledVector(_y, -ez.dot(_y)).normalize(); _x.crossVectors(_y, _z);
    _e.setFromRotationMatrix(_m.makeBasis(_x, _y, _z), 'YXZ');
    return { position: [origin.x, origin.y, origin.z], rotation: [_e.x, _e.y, _e.z], scale, tint: tint || '#ffffff' };
  };
  /** A rail-like model (its axis along its own X) laid from a to b; `roll` turns it about its own length. */
  const laid = (a, b, modelLength, thick = 1, tint, roll = 0) => {
    const u = new THREE.Vector3().subVectors(b, a), len = u.length(); u.normalize();
    const v = new THREE.Vector3().copy(UP).addScaledVector(u, -UP.dot(u)).normalize(), w = new THREE.Vector3().crossVectors(u, v);
    if (roll) { const c = Math.cos(roll), s = Math.sin(roll), v2 = v.clone().multiplyScalar(c).addScaledVector(w, s); w.multiplyScalar(c).addScaledVector(v, -s); v.copy(v2); }
    _e.setFromRotationMatrix(_m.makeBasis(u, v, w), 'YXZ');
    const mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
    return { position: [mid.x, mid.y, mid.z], rotation: [_e.x, _e.y, _e.z], scale: [len / modelLength, thick, thick], tint: tint || '#ffffff' };
  };
  /** The matrix of a placement (to find a model's own points in the realm). */
  const matrixOf = (pl) => { const sc = typeof pl.scale === 'number' ? [pl.scale, pl.scale, pl.scale] : pl.scale; return new THREE.Matrix4().compose(new THREE.Vector3(...pl.position), new THREE.Quaternion().setFromEuler(new THREE.Euler(pl.rotation[0], pl.rotation[1], pl.rotation[2], 'YXZ')), new THREE.Vector3(...sc)); };
  const TINTS = ['#ffffff', '#f2e6e2', '#e6dfe8', '#fff3ea', '#ece4dc', '#f6eaf0'];
  const tintOf = () => TINTS[Math.floor(rnd() * TINTS.length)];
  const V = (x, y, z) => new THREE.Vector3(x, y, z);

  // ================================================================================================ the cloth, read
  // Every bolt as a segment: its top edge from a to b at height y, in a plane whose normal is n.
  const bolts = [];
  // (`hung`: how the draped cloth hangs this bolt: src/engine/cloth.js, hangOf: its pegs, a corner off them, thrown over the line)
  if (shared.cloth) for (const [list, loft, handle] of [[shared.cloth.bolts, false, shared.cloth.handle], [shared.cloth.loftBolts, true, shared.cloth.loft]]) {
    (list || []).forEach((b, i) => {
      const t = b.turn || 0, e = V(Math.cos(t), 0, -Math.sin(t)), p = V(b.position[0], b.position[1], b.position[2]);
      const loc = locate(p);
      bolts.push({ p, e, n: V(Math.sin(t), 0, Math.cos(t)), w: b.width, len: b.length, s: loc.s, d: loc.d, loft, used: false, hung: (handle && handle.hung && handle.hung[i]) || null });
    });
  }
  // WHERE A BOLT'S PEGS ARE (second look). The draped cloth hangs from pegs and sags between them; the first holder strewed
  // rope rings along every rail every 0.27 m, wherever the pegs were. A ring now stands AT EACH PEG: the same sum the
  // cloth's shader places its pegs by (cloth.js, drapeHang: a peg wherever n1 * tw(t) is whole), so every scallop of a
  // top edge rises to a ring with its toggle. Metres from the bolt's middle along its line; `held`: false where a corner
  // has come off (the ring hangs empty). A bolt thrown over its line has none.
  const fract = (x) => x - Math.floor(x);
  const pegsOf = (b) => {
    const h = b && b.hung; if (!h) return null;
    if (h.over > 0) return [];
    const T = Math.PI * 2, s1 = fract(h.ph * 0.731), s2 = fract(h.ph * 1.913), out = [];
    const tw = (t) => t + (0.35 * (Math.sin(T * (t + s1)) - Math.sin(T * s1)) + 0.1 * (Math.sin(2 * T * (t + s2)) - Math.sin(2 * T * s2))) / T;
    for (let k = 0; k <= h.n1; k++) {
      let lo = 0, hi = 1; const want = k / h.n1;
      for (let j = 0; j < 22; j++) { const m = (lo + hi) / 2; if (tw(m) < want) lo = m; else hi = m; }
      const t = (lo + hi) / 2, x = b.w * (t - 0.5 + h.g * (t * t - t));
      out.push({ x: Math.max(-b.w / 2 + 0.04, Math.min(b.w / 2 - 0.04, x)), held: !(h.drop < 0 ? t < -h.drop : h.drop > 0 ? t > 1 - h.drop : false) });
    }
    return out;
  };

  const rails = [];                                                    // every rail: { a, b (axis ends), radius, kind }
  const rings = [];                                                    // every rope ring: { p, u (the rail's way), r }
  const lashes = [];                                                   // every lashing: { mast: point on the mast's axis, rail: point on the rail's, up: the mast's way }
  const ropes = [];                                                    // every rope: makeRopes items
  const poles = [];                                                    // every pole's placement (f_pole.glb)
  const posts = { a: [], b: [], c: [], d: [] };                        // aisle masts and posts by variant
  const heads = [], masts = [];
  const wetFeet = [];                                                  // every timber of mine that stands in the water: { p, r (its radius at the waterline), s }
  const ROPE_DARK = '#3A2A32', ROPE_PALE = '#6E5846', ROPE_OLD = '#514038';      // (ROPE_OLD: a line that lives out of doors, slack: the tie-backs and the ropes left hanging were pale tusks and rods in ROPE_PALE)
  const PO = points.f_pole, POST = { a: points.f_post_a, b: points.f_post_b, c: points.f_post_c, d: points.f_post_d };
  const rope = (a, b, radius = 0.016, color = ROPE_DARK, slack = 1.002) => ropes.push({ from: [a.x, a.y, a.z], to: [b.x, b.y, b.z], length: a.distanceTo(b) * slack, radius, color });

  /** Rope rings along a rail's axis from a to b where a bolt hangs: one at each of its pegs; if the cloth does not say how
   *  it hangs (the plain cloth, or none), about every `every` metres, none evenly placed. */
  const ringsAlong = (a, b, radius, every = FR.ring, bolt = null) => {
    const len = a.distanceTo(b), n = Math.max(2, Math.round(len / every)), u = new THREE.Vector3().subVectors(b, a).normalize();
    const pegs = pegsOf(bolt);
    if (pegs) {
      for (const pg of pegs) {
        const P = bolt.p.clone().addScaledVector(bolt.e, pg.x), t = Math.min(1, Math.max(0, P.sub(a).dot(u) / Math.max(len, 1e-6)));
        rings.push({ p: new THREE.Vector3().lerpVectors(a, b, t), u, r: typeof radius === 'function' ? radius(t) : radius, held: pg.held });
      }
      return;
    }
    for (let i = 0; i <= n; i++) {
      const t = Math.min(1, Math.max(0, (i + (rnd() - 0.5) * 0.36) / n));
      rings.push({ p: new THREE.Vector3().lerpVectors(a, b, t), u, r: typeof radius === 'function' ? radius(t) : radius });
    }
  };
  /** A rail of poles from a to b: peeled poles end to end, lapped a hand and bound where they meet. */
  const poleRail = (a, b, radius, kind, more = {}) => {
    const L = a.distanceTo(b), n = Math.max(1, Math.ceil(L / 6.7)), u = new THREE.Vector3().subVectors(b, a).normalize();
    for (let i = 0; i < n; i++) {
      const t0 = i / n, t1 = (i + 1) / n, p0 = new THREE.Vector3().lerpVectors(a, b, t0).addScaledVector(u, i ? -0.16 : 0), p1 = new THREE.Vector3().lerpVectors(a, b, t1).addScaledVector(u, i < n - 1 ? 0.16 : 0);
      if (i % 2) poles.push(laid(p1, p0, PO.half * 2, radius / PO.radius, tintOf(), rnd() * 6.28)); else poles.push(laid(p0, p1, PO.half * 2, radius / PO.radius, tintOf(), rnd() * 6.28));
      if (i) for (const k of [-0.09, 0.09]) rings.push({ p: new THREE.Vector3().lerpVectors(a, b, t0).addScaledVector(u, k), u, r: radius * 1.1 });
    }
    const rail = { a, b, radius, kind, ...more };
    rails.push(rail);
    return rail;
  };
  /** A mast or post of the aisles' kit standing at `foot`: variant a | b | c | d; its top (or its fork) brought to the height `to`. */
  const stand = (key, foot, to, front, o = {}) => {
    const m = POST[key], ref = key === 'c' ? m.fork[1] : m.height, hs = (to - foot.y) / ref, thick = o.thick || Math.min(1.35, Math.max(0.85, hs));
    const axis = o.axis || V((rnd() - 0.5) * 0.02, 1, (rnd() - 0.5) * 0.02);
    const pl = posed(foot, axis, front, [thick, hs, thick], tintOf());
    posts[key].push(pl);
    const mat = matrixOf(pl);
    return { key, foot, hs, thick, point: (name, out = new THREE.Vector3()) => out.fromArray(m[name]).applyMatrix4(mat), radius: (y) => (m.foot_radius + (m.head_radius - m.foot_radius) * Math.min(1, Math.max(0, (y - foot.y) / (ref * hs)))) * thick };
  };

  // ================================================================================================ the nave
  const F = FR.nave, pm = { a: points.f_nave_mast_a, b: points.f_nave_mast_b, c: points.f_nave_mast_c }, py = points.f_yard;
  const mastPlace = { a: [], b: [], c: [] };
  const yardPlace = [];
  const variantOf = (h) => (h < 19.9 ? 'a' : h < 20.6 ? 'b' : 'c');
  const mastRadius = (m, y) => m.foot_radius + (m.head_radius - m.foot_radius) * Math.max(0, y) / m.height;
  // (FOURTH LOOK: the yard as modelled is 0.32 m at the slings for 26 m of span and nine wet bolts: from the boat a curtain rod.
  // It is laid a quarter thicker (0.40 m at the slings, 0.26 at the arms), and everything that touches it follows.)
  const YK = 1.25;
  const yardRadius = (x) => YK * (py.radius_mid - (py.radius_mid - py.radius_arm) * Math.pow(Math.min(1, Math.abs(x) / py.half), 1.5));
  // THE KNEES (fourth look). Without its cloth a frame was two poles and a stick across, a wire to each end: nothing said how
  // a mast holds its yard. Each mast now carries a grown knee (f_knee.glb: a crooked limb, squared on two faces) from its
  // channel side, `drop` below the yard, to the yard's up-route face `reach` in from the mast: the top corner of every frame
  // is the springing of an arch. It lies in the MAST'S plane, a forearm up-route of the cloth's (cloth blows down-route,
  // clear of it), and is lashed at both ends.
  const KN = points.f_knee ? { drop: 2.9, reach: 2.5, half: points.f_knee.half, thick: points.f_knee.thick } : null;
  const kneePlace = [];

  N.frames.forEach((f, fi) => {
    const fr = frameAt(f.s), dPlan = hw(f.s) + N.mast.out, key0 = variantOf(f.mast);
    // ---- the rank's line, from its bolts (the plan's if the cloth is not there): height y0 at the centre line, rising k a metre to the right
    const rank = bolts.filter((b) => !b.loft && Math.abs(b.s - f.s) < 0.4 && Math.abs(b.d) < 13.5 && Math.abs(b.n.dot(fr.t)) > 0.9 && b.p.y > 15.5);
    let y0 = f.line, k = 0, reach = N.d[N.d.length - 1] + N.width / 2;
    if (rank.length >= 2) {
      let sd = 0, sy = 0, sdd = 0, sdy = 0;
      for (const b of rank) { sd += b.d; sy += b.p.y; sdd += b.d * b.d; sdy += b.d * b.p.y; b.used = true; }
      const n = rank.length, den = n * sdd - sd * sd;
      k = Math.abs(den) > 1e-6 ? (n * sdy - sd * sy) / den : 0; y0 = (sy - k * sd) / n;
      reach = Math.max(...rank.map((b) => Math.abs(b.d) + b.w / 2));
    }
    const lineY = (d) => y0 + k * d + F.rise;                         // the yard's axis: a little above the top edges
    // ---- the two masts
    const feet = [];
    for (const side of [-1, 1]) {
      // (second look) the two masts of a frame are not the same mast twice: the right bank's is the variant of the frame's
      // own height, the left bank's the NEXT variant, stretched in height by a few per cent to the frame's (so its head
      // stands where the plan has it). Along a bank they run a, b, c; across the nave no two are alike.
      const key = side < 0 ? { a: 'b', b: 'c', c: 'a' }[key0] : key0, m = pm[key], kY = f.mast / m.height;
      const yY = lineY(side * (dPlan - F.inYard));                     // where the yard crosses this mast
      const rY = mastRadius(m, yY / kY) + yardRadius(py.half * 0.92) + 0.012, rP = mastRadius(m, N.aisle.plate / kY) + F.plate + 0.012;
      const jit = (rnd() - 0.5) * 0.06;
      // its axis, in (s, d) by height: at the water F.back up-route and F.inside nearer the channel than the plan's point;
      // touching the yard's up-route side at the yard's height, and the wall plate's channel side at the plate's
      const s0 = f.s - F.back, sY = f.s - rY, d0 = dPlan - F.inside, dP = dPlan - rP + jit;
      const at = (y) => kit.at(s0 + (sY - s0) * y / yY, side * (d0 + (dP - d0) * y / N.aisle.plate), y);
      const foot = at(0), axis = at(10).sub(foot).normalize();
      const front = fr.r.clone().multiplyScalar(-side).applyAxisAngle(UP, (rnd() - 0.5) * 0.7 + (side > 0 ? 0.25 : -0.25));      // its ring and cleat toward the channel, a little up-route
      const pl = posed(foot, axis, front, [1, kY, 1], tintOf());
      mastPlace[key].push(pl);
      const mat = matrixOf(pl), point = (name, out = new THREE.Vector3()) => out.fromArray(m[name]).applyMatrix4(mat);
      const mast = { s: f.s, side, foot, axis, height: m.height * kY, variant: key, point, onAxis: (y) => foot.clone().addScaledVector(axis, y / axis.y), radius: (y) => mastRadius(m, y / kY), frame: fi };
      masts.push(mast); feet.push(mast);
      wetFeet.push({ p: foot, r: 0.31, s: f.s, side, kind: 'mast' });
      const h = point('head');
      heads.push({ x: h.x, y: h.y, z: h.z, s: f.s, side, kind: 'nave' });
    }
    // ---- the yard: from beyond one mast to beyond the other, through the rank's top edges
    const half = Math.max(reach + 0.25, dPlan - F.inYard + 0.55);
    const ya = kit.at(f.s, -half, lineY(-half)), yb = kit.at(f.s, half, lineY(half));
    yardPlace.push(laid(ya, yb, py.half * 2, YK, tintOf(), (rnd() - 0.5) * 0.5));
    const sc = half / py.half;
    rails.push({ a: ya, b: yb, radius: yardRadius(0), kind: 'yard', frame: fi });
    if (rank.length) for (const b of rank) ringsAlong(kit.at(f.s, b.d - b.w / 2, lineY(b.d - b.w / 2)), kit.at(f.s, b.d + b.w / 2, lineY(b.d + b.w / 2)), yardRadius(b.d / sc), FR.ring, b);
    else ringsAlong(kit.at(f.s, -reach, lineY(-reach)), kit.at(f.s, reach, lineY(reach)), (t) => yardRadius((t * 2 - 1) * reach / sc));
    // ---- where yard and mast touch: a lashing; and the lift from the mast's block to the yard's strop
    for (const mast of feet) {
      const dM = mast.side * (dPlan - F.inYard), yY = lineY(dM), onYard = kit.at(f.s, dM, yY), onMast = mast.onAxis(yY);
      lashes.push({ mast: onMast, rail: onYard, up: mast.axis });
      const dL = mast.side * py.lift * sc, strop = kit.at(f.s, dL, lineY(dL) + yardRadius(py.lift) + 0.02 - 0.035 * Math.pow(py.lift / py.half, 2));
      rope(mast.point('sheave'), strop, 0.019, ROPE_DARK, 1.0015);
      if (KN) {
        const inb = fr.r.clone().multiplyScalar(-mast.side);          // toward the channel
        const yA = yY - KN.drop * (0.94 + rnd() * 0.12), A = mast.onAxis(yA).addScaledVector(inb, mast.radius(yA) + 0.03);
        const dB = dM - mast.side * KN.reach * (0.94 + rnd() * 0.12), B = kit.at(f.s - (yardRadius(dB / sc) + KN.thick + 0.012), dB, lineY(dB) - 0.03);
        const way = new THREE.Vector3().subVectors(B, A).normalize();
        kneePlace.push(laid(A, B, KN.half * 2, 0.95 + rnd() * 0.14, tintOf(), 0));
        const low = A.clone().addScaledVector(way, 0.15);              // lashed to the mast a hand above its heel
        lashes.push({ mast: mast.onAxis(low.y), rail: low, up: mast.axis });
        const top = B.clone().addScaledVector(way, -0.24), dT = dB + mast.side * 0.24 * KN.reach / A.distanceTo(B);      // and alongside the yard a forearm short of its head
        lashes.push({ mast: kit.at(f.s, dT, lineY(dT)), rail: top, up: inb });
      }
    }
  });

  // ---- the wall plates: along each side at 15 m from mast to mast, through the aisle walls' top edges; the last runs to the west front's mast
  {
    const WF = plan.westFront, stations = N.frames.map((f) => f.s).concat([WF.s]);
    // the west front's two masts as the houses built them (heroes_b.js: 23 m, 0.6 m at the foot to 0.28 m at the head), by side
    const wfMast = {};
    if (shared.westFront && shared.westFront.feet && shared.westFront.heads) for (let k = 0; k < 2; k++) {
      const foot = shared.westFront.feet[k], head = shared.westFront.heads[k]; if (!foot || !head) continue;
      const sd = Math.sign(locate(foot).d) || 1, axis = new THREE.Vector3().subVectors(head, foot).normalize(), H = head.y - foot.y;
      wfMast[sd] = { axis, at: (y) => new THREE.Vector3().lerpVectors(foot, head, (y - foot.y) / H), radius: (y) => 0.3 - 0.16 * Math.min(1, Math.max(0, (y - foot.y) / H)) };
    }
    for (const side of [-1, 1]) for (let i = 0; i < stations.length - 1; i++) {
      const s0 = stations[i], s1 = stations[i + 1], last = i === stations.length - 2;
      // its line: the plan's (half width + 1.6), or the bay's own cloth where there is some
      const wall = bolts.filter((b) => !b.loft && !b.used && b.s > s0 && b.s < s1 && Math.sign(b.d) === side && Math.abs(Math.abs(b.d) - (hw(b.s) + N.mast.out)) < 0.5 && Math.abs(b.n.dot(frameAt(b.s).r)) > 0.9);
      const yP = (wall.length ? wall.reduce((a, b) => a + b.p.y, 0) / wall.length : N.aisle.plate) + F.rise;
      const dAt = (s) => side * (last && s >= s1 - 0.5 ? WF.mast.d : hw(s) + N.mast.out);
      const cuts = [s0 - 0.25, (s0 + s1) / 2 + (rnd() - 0.5) * 0.8, s1 + (last ? -0.32 : 0.25)];      // two poles a bay, lapped mid bay
      for (let j = 0; j < 2; j++) {
        const a = kit.at(cuts[j] - (j ? 0.2 : 0), dAt(cuts[j]), yP), b = kit.at(cuts[j + 1] + (j ? 0 : 0.2), dAt(cuts[j + 1]), yP);
        // SIXTH PAIR OF EYES: THE LAST PLATE LANDS ON THE WEST FRONT'S MAST. It ended in the air a forearm short of the plan's point,
        // 0.12 m off the mast's face (the houses' log lists it too). The houses' masts stand now (shared.westFront: feet and
        // heads): the last pole runs to the mast's own outer side at the plate's height and is lashed to it there; it stops a
        // thumb short of the front's own plane, where the wing cloth hangs.
        if (last && j === 1 && wfMast[side]) {
          const m = wfMast[side], on = m.at(yP), lo = locate(on), R = m.radius(yP);
          b.copy(kit.at(lo.s - 0.03, lo.d + side * (R + F.plate + 0.012), yP));
          const beside = kit.at(lo.s - 0.12, lo.d + side * (R + F.plate + 0.012), yP);
          lashes.push({ mast: m.at(yP).addScaledVector(frameAt(lo.s).t, -0.12), rail: beside, up: m.axis });
        }
        poles.push(laid(a, b, PO.half * 2, F.plate / PO.radius, tintOf(), rnd() * 6.28));
        rails.push({ a, b, radius: F.plate, kind: 'plate', side });
      }
      const mid = kit.at(cuts[1], dAt(cuts[1]), yP), tm = frameAt(cuts[1]).t;
      rings.push({ p: mid.clone().addScaledVector(tm, 0.1), u: tm, r: F.plate * 1.12 }, { p: mid.clone().addScaledVector(tm, -0.1), u: tm, r: F.plate * 1.12 });
      for (const b of wall) { b.used = true; ringsAlong(b.p.clone().addScaledVector(b.e, -b.w / 2).setY(yP), b.p.clone().addScaledVector(b.e, b.w / 2).setY(yP), F.plate, FR.ring, b); }
      // lashed to the mast it passes
      const mast = masts.find((q) => q.s === s0 && q.side === side);
      if (mast) { const onMast = mast.onAxis(yP), sM = locate(onMast).s; lashes.push({ mast: onMast, rail: kit.at(sM, dAt(sM), yP), up: mast.axis }); }
    }
  }
  // ---- ties: the swags' ends stand on the plan's axis (kit.js); each is tied to its mast's head band by a short rope
  for (const mast of masts) {
    const f = N.frames[mast.frame], band = mast.point('band'), swag = kit.at(f.s, mast.side * (hw(f.s) + N.mast.out), f.mast - 0.4);
    if (band.distanceTo(swag) > 0.12) rope(band, swag, 0.016, ROPE_PALE, 1.01);
  }

  // ---- THE TIE-BACKS (second look: the key painting's masts carry a heavy rope wound round at a man's reach with a line
  // going off). Each mast's strop (modelled: f_nave_mast.py, point `tie`, on its bank side) is led to an iron ring let
  // into the quay wall under the coping, 3 m away across the ford: the masts are stayed to the bank, and the side aisle
  // has a line across its foreground. ONLY WHERE THE FORD IS CLEAR: the first three frames (s 26, 37, 48). At frames 4
  // and 5 a skein rack stands in the ford between mast and wall, at frame 6 the stairs into the ford, a spout and the
  // left aisle's wringer post (plan.yards.racks, .stairs, .spouts; plan.machines): there the strop keeps its hanging end.
  const wallRings = [], tieBacks = [];
  if (shared.reach) for (const mast of masts) {
    if (mast.frame > 2 || !pm[mast.variant].tie) continue;
    const tie = mast.point('tie'), loc = locate(tie);
    const sW = loc.s + (rnd() - 0.5) * 0.8, b = shared.reach.bank(mast.side, sW);
    const ring = kit.at(sW, mast.side * (hw(sW) + b.out[0] - 0.135), b.y[0] - 0.27 - rnd() * 0.06);      // (the yards' wall stones stand 0.1 m in front of the land's riser: walls.py)
    // (FIFTH PAIR OF EYES: the rope ran into a bare ring and stopped. The ring is a model now, f_wallring.glb: an iron ring on its
    // staple with the rope made fast to it, a round turn and two half hitches, its end hanging; the ride's rope ends where the
    // model's standing part begins, its point `lead`, and the model is turned to look along the rope at its mast.)
    const into = frameAt(sW).r.clone().multiplyScalar(mast.side), WR = points.f_wallring;
    let to = ring.clone().setY(ring.y - 0.06), drip = null;
    if (WR) {
      const look = new THREE.Vector3(tie.x - ring.x, 0, tie.z - ring.z).normalize();
      const pl = posed(ring.clone().addScaledVector(into, 0.03), UP, look, 1, tintOf());
      wallRings.push(pl);
      const mat = matrixOf(pl); to = new THREE.Vector3().fromArray(WR.lead).applyMatrix4(mat); drip = new THREE.Vector3().fromArray(WR.drip).applyMatrix4(mat);
    }
    rope(tie, to, 0.021, ROPE_OLD, 1.012 + rnd() * 0.012);
    tieBacks.push({ from: tie.clone(), to: to.clone(), drip, s: mast.s, side: mast.side });
  }

  // ---- CLOTH TIED BACK TO A MAST (second look, 20:40). The cloth's second holder sweeps some bolts aside and gathers them
  // to a tie beside "their mast" (kit.js: the rank's outermost bolt, half the aisle walls' cloth; cloth.js, hangOf: `tie`).
  // The cloth is gathered to a waist in its own plane; my mast stands half a metre up-route and inside of it. So each
  // tied bolt whose waist is within reach of one of the nave's masts gets its cord: a turn of rope on the mast, and two
  // lines from it that pass either side of the gathered cloth and meet at its far edge. (At the west front and the door
  // the houses' masts stand IN the waist: no cord wanted.) Read from the cloth at build: if it ties none, none are made.
  let clothTies = 0;
  for (const b of bolts) {
    const T = b.hung && b.hung.tie; if (!T || b.loft) continue;
    const W = b.w, y = b.p.y - T.at * b.len, wT = T.tight * W;
    const edge = b.p.clone().addScaledVector(b.e, T.side * (0.5 * W + T.out)).setY(y);                // the waist's outer edge: where it is made fast
    const mid = b.p.clone().addScaledVector(b.e, T.side * (0.5 * W + T.out - 0.5 * wT)).setY(y);      // its middle
    const far = b.p.clone().addScaledVector(b.e, T.side * (0.5 * W + T.out - wT)).setY(y);            // its inner edge
    let best = null, bd = 1.7;
    for (const m of masts) { if (y > m.height - 1.5 || y < 1.2) continue; const A = m.onAxis(y), dd = Math.hypot(A.x - edge.x, A.z - edge.z); if (dd < bd) { bd = dd; best = { m, A }; } }
    if (!best || bd < 0.3) continue;
    const out = new THREE.Vector3(edge.x - best.A.x, 0, edge.z - best.A.z).normalize(), R = best.m.radius(y);
    const on = best.A.clone().addScaledVector(out, R + 0.012);
    for (const k of [-1, 1]) {                                         // one line each side of the cloth, a hand apart on the mast
      const from = on.clone().setY(y + k * 0.05).addScaledVector(b.n, k * 0.03), by = mid.clone().addScaledVector(b.n, k * 0.11).setY(y + k * 0.03);
      rope(from, by, 0.017, ROPE_PALE, 1.004); rope(by, far.clone().setY(y - 0.01), 0.017, ROPE_PALE, 1.004);
    }
    rings.push({ p: best.A.clone().setY(y), u: best.m.axis, r: R * 0.9, held: true });               // the turn of rope on the mast
    clothTies++;
  }
  if (clothTies) counts['cloth tied to a mast'] = clothTies;

  // ================================================================================================ veil and narthex: three sawn frames
  const framePlace = [];
  {
    const NF = points.f_narthex_frame, stations = [{ s: plan.veil.s, veil: true }].concat(plan.narthex.frames.map((f) => ({ s: f.s, line: f.line })));
    for (const st of stations) {
      const fr = frameAt(st.s), list = bolts.filter((b) => !b.loft && !b.used && Math.abs(b.s - st.s) < 0.4 && Math.abs(b.n.dot(fr.t)) > 0.9 && b.p.y < 14);
      const top = list.length ? list.reduce((a, b) => a + b.p.y, 0) / list.length : st.veil ? plan.veil.top : st.line;
      const reach = list.length ? Math.max(...list.map((b) => Math.abs(b.d) + b.w / 2)) : 8.3;
      const sx = Math.max(1, (reach + 0.55) / NF.span), sy = (top + FR.rise) / NF.tie[1];
      framePlace.push(posed(kit.at(st.s, 0, 0), UP, fr.t.clone().negate(), [sx, sy, 1], tintOf()));
      for (const side of [-1, 1]) wetFeet.push({ p: kit.at(st.s, side * NF.span * sx, 0), r: 0.21, s: st.s, side, kind: 'frame' });
      rails.push({ a: kit.at(st.s, -NF.tie_half * sx, top + FR.rise), b: kit.at(st.s, NF.tie_half * sx, top + FR.rise), radius: 0.135, kind: st.veil ? 'veil' : 'narthex' });
      for (const b of list) { b.used = true; ringsAlong(kit.at(st.s, b.d - b.w / 2, top + FR.rise), kit.at(st.s, b.d + b.w / 2, top + FR.rise), 0.166, FR.ring, b); }
    }
  }

  // ================================================================================================ every other rail
  // Bolts that hang in one plane on one line, with no more than `gap` metres between them, are one rail.
  const cluster = (list, gap) => {
    const planes = [];
    for (const b of list) {
      let n = b.n, e = b.e;
      if (n.x < -1e-6 || (Math.abs(n.x) < 1e-6 && n.z < 0)) { n = n.clone().negate(); e = e.clone().negate(); }
      const off = n.dot(b.p);
      let g = planes.find((q) => q.n.dot(n) > 0.9993 && Math.abs(q.off - off) < 0.14);
      if (!g) { g = { n, e, off, items: [] }; planes.push(g); }
      g.items.push({ b, t: g.e.dot(b.p) });
    }
    const out = [];
    for (const g of planes) {
      g.items.sort((p, q) => p.t - q.t);
      let cur = null;
      for (const it of g.items) {
        const lo = it.t - it.b.w / 2, hi = it.t + it.b.w / 2;
        if (cur && lo - cur.hi <= gap && Math.abs(it.b.p.y - cur.lastY) <= 0.12 * Math.abs(it.t - cur.lastT) + 0.03) { cur.items.push(it); cur.hi = hi; cur.lastY = it.b.p.y; cur.lastT = it.t; }
        else { cur = { items: [it], lo, hi, lastY: it.b.p.y, lastT: it.t, n: g.n, e: g.e, off: g.off }; out.push(cur); }
      }
    }
    for (const c of out) {                                             // its line: height by place along it (least squares), and a point on it
      const n = c.items.length; let st = 0, sy = 0, stt = 0, sty = 0;
      for (const it of c.items) { st += it.t; sy += it.b.p.y; stt += it.t * it.t; sty += it.t * it.b.p.y; }
      const den = n * stt - st * st, k = n > 1 && Math.abs(den) > 1e-6 ? (n * sty - st * sy) / den : 0, y0 = (sy - k * st) / n;
      c.at = (t, lift = FR.rise) => V(c.e.x * t + c.n.x * c.off, y0 + k * t + lift, c.e.z * t + c.n.z * c.off);
      c.mid = c.at((c.lo + c.hi) / 2); const loc = locate(c.mid); c.s = loc.s; c.d = loc.d; c.y = c.mid.y; c.loft = c.items[0].b.loft;
    }
    return out;
  };
  const rest = () => bolts.filter((b) => !b.used);
  const take = (c) => { for (const it of c.items) it.b.used = true; };
  const ringBolts = (c, radius) => { for (const it of c.items) ringsAlong(c.at(it.t - it.b.w / 2), c.at(it.t + it.b.w / 2), radius, FR.ring, it.b); };
  const WIND = V(plan.wind.direction[0], 0, plan.wind.direction[1]).normalize();
  /** The side of a cloth's plane its masts stand on: upwind where the cloth hangs across the wind (it blows clear of them); else the channel's side. */
  const mastSide = (c) => {
    if (Math.abs(c.n.dot(WIND)) > 0.6) return c.n.clone().multiplyScalar(c.n.dot(WIND) > 0 ? -1 : 1);
    const toC = kit.at(c.s, 0, 0).sub(c.mid); return c.n.clone().multiplyScalar(c.n.dot(toC) > 0 ? 1 : -1);
  };

  // ---- outer aisles: at each station a mast at d 20 and a forked post at d 29, AND ONE LONG SPAR SLOPING FROM THE MAST'S
  // HEAD DOWN INTO THE POST'S FORK: the rafter of the aisle's lean-to (as a church's aisle roof leans on its nave). The
  // cloth hangs level, so each bolt has a level batten under the spar: its downhill end lashed where it crosses the spar,
  // its uphill end hung from the spar by a rope. Spar and mast stand a hand up-route of the cloth's plane (cloth blows
  // down-route, clear of them); the spar passes above every top edge for the whole of its cloth's width.
  // (How it came here. The layout: one sloping line, which cannot carry level cloth. The first holder: stepping battens
  // hung from one another. The second: two yards lashed across the mast like a ship's. THIRD PAIR OF EYES: a thin pole
  // with a cross-tree at its head, two cross-arms and wires is a TELEGRAPH POLE, and a row of them stood against the sky
  // above the terraces. No member crosses a mast now: the page's "cross-arm" is this spar.)
  {
    const O = N.outer, SPAR_R = 0.11, BAT_R = 0.085, OFF = SPAR_R + BAT_R + 0.015, slope0 = (O.mast.height - O.post.height) / (O.post.d - O.mast.d);
    O.stations.forEach((st, si) => {
      for (const side of [-1, 1]) {
        const fr = frameAt(st), list = rest().filter((b) => !b.loft && Math.abs(b.s - st) < 0.4 && Math.sign(b.d) === side && Math.abs(b.d) > O.mast.d - 0.5 && Math.abs(b.n.dot(fr.t)) > 0.9).sort((p, q) => Math.abs(p.d) - Math.abs(q.d));
        const key = (si + (side > 0 ? 1 : 0)) % 2 ? 'd' : 'a';
        // the spar's line, height by |d|: over the outer corner of the first and of the last cloth's top edge (so it is above
        // every top edge for the whole of its width); with one cloth or none, the plan's own slope
        const corner = (b) => [Math.abs(b.d) + b.w / 2 + 0.16, b.p.y + FR.rise];
        let d1 = O.mast.d, y1 = O.mast.height + 0.03, m = slope0;
        if (list.length) { [d1, y1] = corner(list[0]); if (list.length > 1) { const [d2, y2] = corner(list[list.length - 1]); if (d2 - d1 > 1) m = Math.max(0.2, (y1 - y2) / (d2 - d1)); } }
        const yAt = (d) => y1 - m * (d - d1), sparAt = (d) => kit.at(st - OFF, side * d, yAt(d));
        const tilt = (rnd() - 0.5) * 0.02, dTop = O.mast.d + tilt * 14, yM = yAt(dTop);
        // the mast: up-route of the spar, touching it where it is lashed on, a hand under its head; it leans a little along the aisle's line only
        const gm = ground(st, side * O.mast.d), thickM = 1.2 + rnd() * 0.25, rHead = POST[key].head_radius * thickM * 1.04;
        const axis = UP.clone().addScaledVector(fr.r, side * tilt).normalize();
        // (fourth look: six stations a bank were one silhouette six times. No two masts now stand to the same height above their
        // spar (a hand to an arm and a half), no two spars run the same length past mast and post, and the posts lean.)
        const over = 0.2 + rnd() * rnd() * 1.5;
        const mast = stand(key, kit.at(st - OFF - SPAR_R - rHead - 0.012, side * O.mast.d, gm), yM + over, fr.r.clone().multiplyScalar(-side).applyAxisAngle(UP, (rnd() - 0.5) * 0.8), { thick: thickM, axis });
        const head = mast.point('head'); heads.push({ x: head.x, y: head.y, z: head.z, s: st, side, kind: 'outer aisle' });
        const onMast = mast.foot.clone().addScaledVector(axis, (yM - gm) / axis.y);
        // the spar: one long pole, its butt at the mast, its tip a forearm beyond the post
        const sa = sparAt(O.mast.d - 0.3 - rnd() * 0.9), sb = sparAt(O.post.d + 0.4 + rnd() * rnd() * 1.6), sdir = new THREE.Vector3().subVectors(sb, sa).normalize();
        poles.push(laid(sa, sb, PO.half * 2, SPAR_R / PO.radius, tintOf(), rnd() * 6.28));
        rails.push({ a: sa, b: sb, radius: SPAR_R, kind: 'outer aisle spar' });
        lashes.push({ mast: onMast, rail: sparAt(dTop), up: axis });
        // the post: its fork holds the spar
        const gp = ground(st, side * O.post.d);
        stand('c', kit.at(st - OFF, side * O.post.d, gp), yAt(O.post.d), fr.r.clone().multiplyScalar(side), { axis: V((rnd() - 0.5) * 0.07, 1, 0), thick: 1.15 + rnd() * 0.3 });
        for (const k of [-0.2, 0.2]) rings.push({ p: sparAt(O.post.d + k), u: sdir, r: SPAR_R * 1.12 });
        // the battens, one to a cloth
        for (const b of list) {
          const y = b.p.y + FR.rise, d0 = Math.abs(b.d) - b.w / 2, dX = Math.max(d1 + (y1 - y) / m, Math.abs(b.d) + b.w / 2 + 0.1);      // dX: where the spar comes down through the batten's level
          const ba = kit.at(st, side * (d0 - 0.3 - rnd() * 0.2), y), be = kit.at(st, side * (dX + 0.26 + rnd() * 0.2), y);
          poles.push(laid(be, ba, PO.half * 2, BAT_R / PO.radius, tintOf(), rnd() * 6.28));                                            // (its butt downhill, where it is lashed)
          rails.push({ a: ba, b: be, radius: BAT_R, kind: 'outer aisle' });
          ringsAlong(kit.at(st, side * d0, y), kit.at(st, side * (d0 + b.w), y), BAT_R, FR.ring, b);
          lashes.push({ mast: sparAt(dX), rail: kit.at(st, side * dX, y), up: sdir.clone().negate() });                               // (the lashing's thumb cleat sits on the spar's downhill side: it stops the batten sliding)
          const dH = d0 - 0.12, top = sparAt(dH), bot = kit.at(st, side * dH, y);                                                      // the hanger at its uphill end
          rope(top.clone().setY(top.y - SPAR_R * 0.6), bot.clone().setY(y + BAT_R * 0.6), 0.02, ROPE_PALE, 1.0);
          rings.push({ p: top, u: sdir, r: SPAR_R * 1.08 }, { p: bot, u: fr.r, r: BAT_R * 1.1 });
          b.used = true;
        }
      }
    });
  }

  // ---- the rest, by the place they hang in
  const others = cluster(rest().filter((b) => !b.loft), 0.6).concat(cluster(rest().filter((b) => b.loft), 0.6));
  const kindOf = (c) => {
    const acrossRoute = Math.abs(c.n.dot(frameAt(c.s).t)) > 0.7;
    if (c.loft) return 'loft';
    if (Math.abs(c.s - plan.westFront.s) < 0.7 && c.y > 18.5 && acrossRoute) return 'west front';
    if (Math.abs(c.mid.z - plan.westDoor.z) < 0.6 && c.mid.x > 12 && c.mid.x < 37 && c.y > 16) return 'west door';
    if (c.s > 106 && c.s < 142 && c.d < -27 && c.d > -47 && c.y < 9.5) return 'indigo house';
    if (c.s > 146 && c.s < 170 && c.d < -30) return 'blue yard';
    if (c.d > 39 && c.s > 134 && c.s < 182) return 'red yard';
    if (c.s > 208 && c.s < 242 && c.d > 16) return 'terrace';
    return 'other';
  };
  const merged = (list, gap) => cluster(list.flatMap((c) => c.items.map((it) => it.b)), gap);
  const byKind = {};
  for (const c of others) (byKind[kindOf(c)] || (byKind[kindOf(c)] = [])).push(c);

  // Rails that the houses' own models provide (heroes_b.js): the indigo house's drying poles, the loft's cloth rails.
  // Cloth that hangs on one of them gets its rings from me, on THEIR rail, and no rail of mine.
  const foreign = [];
  const v3 = (p) => V(p.x, p.y, p.z);
  if (shared.indigoHouse && shared.indigoHouse.poles) for (const p of shared.indigoHouse.poles) if (p && p.front && p.back) foreign.push({ a: v3(p.back), b: v3(p.front), r: 0.057 });
  if (shared.loft && shared.loft.rails) for (const p of shared.loft.rails) if (p && p.left && p.right) foreign.push({ a: v3(p.left), b: v3(p.right), r: 0.067 });
  /** The foreign rail a cluster of bolts hangs on, if there is one within reach of it (and running its way). */
  const foreignOf = (c) => {
    for (const f of foreign) {
      const u = new THREE.Vector3().subVectors(f.b, f.a).normalize(), w = new THREE.Vector3().subVectors(c.mid, f.a), perp = w.clone().addScaledVector(u, -w.dot(u));
      if (perp.length() < 0.6 && Math.abs(u.x * c.e.x + u.z * c.e.z) > 0.95) return { f, u };
    }
    return null;
  };
  const ringForeign = (c, hit) => {
    take(c);
    const on = (p) => hit.f.a.clone().addScaledVector(hit.u, new THREE.Vector3().subVectors(p, hit.f.a).dot(hit.u));
    for (const it of c.items) ringsAlong(on(c.at(it.t - it.b.w / 2, 0)), on(c.at(it.t + it.b.w / 2, 0)), hit.f.r, FR.ring, it.b);
  };

  // the west front and the west door hang from the houses' own timber (heroes_b.js): rings only
  for (const c of byKind['west front'] || []) { take(c); ringBolts(c, 0.17); }
  for (const c of byKind['west door'] || []) { take(c); ringBolts(c, 0.115); }

  // the indigo house: four rails from wall to wall under its roof (they want the house's wall plates under their ends)
  {
    const H = plan.indigoHouse;
    for (const c of merged(byKind['indigo house'] || [], 4.5)) {
      const hit = foreignOf(c);
      if (hit) { ringForeign(c, hit); continue; }                      // the house's own drying poles carry them
      take(c);
      const d0 = H.at[1] - H.size[1] / 2 - 0.3, d1 = H.at[1] + H.size[1] / 2 + 0.3, a = kit.at(c.s, d0, c.y), b = kit.at(c.s, d1, c.y);
      poleRail(a, b, 0.085, 'indigo house');
      ringBolts(c, 0.085);
    }
  }
  // the blue yard: masts standing in the water beside the cloth, upwind of it, a rail lashed to them
  const placed = [];                                                   // feet of masts beside rails, so that two walls share their corner mast
  const besideRail = (c, key, every, railR, kind) => {
    take(c);
    const a = c.at(c.lo - 0.25), b = c.at(c.hi + 0.25), L = a.distanceTo(b), n = Math.max(1, Math.round(L / every)), sideN = mastSide(c);
    const u = new THREE.Vector3().subVectors(b, a).normalize();
    poleRail(a, b, railR, kind);
    ringBolts(c, railR);
    // (FIFTH PAIR OF EYES: the yard's masts were one thin pole eleven times: one girth, one height above the rail, all plumb.
    // No two now stand to the same height above their rail (a forearm to a man's height), no two are the same girth, each
    // leans a little its own way ALONG the wall (it still touches the rail where it is lashed), and each wall's free end is
    // held by a raking shore: a pole from the water, in the wall's own line beyond its end, up to the end mast.)
    for (let i = 0; i <= n; i++) {
      const on = new THREE.Vector3().lerpVectors(a, b, Math.min(0.985, Math.max(0.015, i / n))), loc = locate(on), g = Math.max(0, ground(loc.s, loc.d));
      const thick = 0.92 + rnd() * 0.42, R = 0.118 * thick, touch = on.clone().addScaledVector(sideN, R + railR + 0.012);
      const axis = UP.clone().addScaledVector(u, (rnd() - 0.5) * 0.045).normalize();
      const foot = touch.clone().addScaledVector(axis, -(on.y - g) / axis.y);
      if (placed.some((q) => q.distanceTo(foot) < 1.1)) continue;
      placed.push(foot);
      if (g <= 0.01) wetFeet.push({ p: foot, r: 0.16 * thick, s: loc.s, side: Math.sign(loc.d), kind: 'post' });
      const mast = stand(key, foot, on.y + 0.3 + rnd() * rnd() * 1.5, sideN.clone().negate().applyAxisAngle(UP, (rnd() - 0.5) * 1.2), { thick, axis });
      lashes.push({ mast: touch.clone().addScaledVector(sideN, -(railR + 0.012)), rail: on, up: axis });
      if (POST[key].head) { const h = mast.point('head'); heads.push({ x: h.x, y: h.y, z: h.z, s: loc.s, side: Math.sign(loc.d), kind }); }
      if (i === 0 || i === n) {                                        // a shore at each end, where it does not stand in the boat's water
        const out = u.clone().multiplyScalar(i === 0 ? -1 : 1), yT = Math.min(on.y - 1.2, 3.0 + rnd() * 1.2);
        const top = foot.clone().addScaledVector(axis, (yT - g) / axis.y).addScaledVector(out, R + 0.075);
        const base = foot.clone().addScaledVector(out, 1.7 + rnd() * 0.7).setY(g - 0.7);
        const lb = locate(base);
        if (Math.abs(lb.d) > hw(lb.s) + 0.8 && !placed.some((q) => q !== foot && q.distanceTo(base) < 1.6)) {
          poles.push(laid(base, top.clone().addScaledVector(new THREE.Vector3().subVectors(top, base).normalize(), 0.35), PO.half * 2, 0.07 / PO.radius, tintOf(), rnd() * 6.28));
          lashes.push({ mast: foot.clone().addScaledVector(axis, (yT - g) / axis.y), rail: top, up: axis });
          wetFeet.push({ p: base.clone().setY(0).addScaledVector(out, -0.5), r: 0.08, s: lb.s, side: Math.sign(lb.d), kind: 'frame' });
        }
      }
    }
  };
  for (const c of byKind['blue yard'] || []) besideRail(c, 'b', 5.4, 0.08, 'blue yard');
  // the red yard and the terrace line: a rail lying in the forks of posts that stand in the cloth's own plane, between two bolts
  const forked = (c, railR, kind, over) => {
    take(c);
    const a = c.at(c.lo - over), b = c.at(c.hi + over), u = new THREE.Vector3().subVectors(b, a).normalize();
    poleRail(a, b, railR, kind);
    ringBolts(c, railR);
    const ts = [c.lo - over + 0.5];                                    // a post near each end, and one in every gap between bolts that is wide enough
    for (let i = 0; i < c.items.length - 1; i++) { const g0 = c.items[i].t + c.items[i].b.w / 2, g1 = c.items[i + 1].t - c.items[i + 1].b.w / 2; if (g1 - g0 > 1.2 && (g0 + g1) / 2 - ts[ts.length - 1] > 5.5) ts.push((g0 + g1) / 2 + (rnd() - 0.5) * Math.min(0.8, (g1 - g0) * 0.3)); }
    if (c.hi + over - 0.5 - ts[ts.length - 1] < 3 && ts.length > 1) ts.pop();
    ts.push(c.hi + over - 0.5);
    for (const t of ts) {
      const on = c.at(t), loc = locate(on), g = ground(loc.s, loc.d);
      stand('c', V(on.x, g, on.z), on.y, u.clone().multiplyScalar(rnd() < 0.5 ? 1 : -1), { axis: V((rnd() - 0.5) * 0.03, 1, (rnd() - 0.5) * 0.03) });
      rings.push({ p: on.clone().addScaledVector(u, 0.17), u, r: railR * 1.15 }, { p: on.clone().addScaledVector(u, -0.17), u, r: railR * 1.15 });
    }
  };
  for (const c of merged(byKind['red yard'] || [], 8)) forked(c, 0.085, 'red yard', 2.2);
  for (const c of merged(byKind.terrace || [], 3)) forked(c, 0.08, 'terrace', 1.1);
  // the loft: a rail under each rank, hung by ropes from the roof over it (plan.loft: the master section)
  {
    const T = plan.loft, roofY = (d) => T.ridge - (T.ridge - T.eaves) * Math.abs(d) / T.wall - 0.22;
    for (const c of byKind.loft || []) {
      const hit = foreignOf(c);
      if (hit) { ringForeign(c, hit); continue; }                      // the loft's own cloth rails carry them
      take(c);
      const a = c.at(c.lo - 0.2), b = c.at(c.hi + 0.2);
      poleRail(a, b, 0.085, 'loft');
      ringBolts(c, 0.085);
      for (const d of [-4.9, -1.7, 1.5, 4.7]) { const on = kit.at(c.s, d, c.y + 0.085), up = roofY(d); if (up - on.y > 0.5) rope(V(on.x, up, on.z), on, 0.014, ROPE_PALE, 1.0); }
    }
  }
  // anything else that hangs: a rail and nothing more (say so, so that it gets its posts)
  for (const c of byKind.other || []) { take(c); poleRail(c.at(c.lo - 0.3), c.at(c.hi + 0.3), 0.085, 'other'); ringBolts(c, 0.085); }
  counts['rails with no frame (cloth hung where none is planned)'] = (byKind.other || []).length;
  if ((byKind.other || []).length) console.warn(`[reach/kit_frames] ${byKind.other.length} rail(s) of cloth hang where no frame is planned: given a rail, no posts`);

  // ================================================================================================ the masts that fly a silk
  for (const [s, d, h] of plan.silkMasts) {                            // four on the lagoon's banks, 20 to 22 m
    // (the left bank's land ends at s 140: the mast by the blue yard stands in the water, like the yard's own)
    const wet = d < 0 && s > 140.5, g = wet ? 0 : Math.max(0, ground(s, d)), side = Math.sign(d), fr = frameAt(s), key = wet ? 'b' : rnd() < 0.5 ? 'a' : 'd';
    const mast = stand(key, kit.at(s, d, g), h - 0.13 * ((h - g) / POST[key].height), fr.r.clone().multiplyScalar(-side).applyAxisAngle(UP, (rnd() - 0.5)), { thick: 1.55 });
    const hd = mast.point('head'); heads.push({ x: hd.x, y: hd.y, z: hd.z, s, side, kind: 'bank' });
  }
  for (const [x, z] of plan.tenter.masts) {                            // six on the tenter grounds, 16 m
    const mast = stand(rnd() < 0.5 ? 'a' : 'd', V(x, plan.causeway.top, z), plan.tenter.mast - 0.14, V(0, 0, 1).applyAxisAngle(UP, rnd() * 6.28), { thick: 1.3 });
    const hd = mast.point('head'); heads.push({ x: hd.x, y: hd.y, z: hd.z, s: 300, side: Math.sign(x), kind: 'tenter' });
  }
  // the flying silks' ties stand on the plan's points (kit.js): each is tied to the nearest head of mine by a short tether
  if (shared.silkTies) for (const tie of shared.silkTies) {
    const q = V(...tie.at);
    let best = null, bd = 1.6;
    for (const h of heads) { const dd = Math.hypot(h.x - q.x, h.y - q.y, h.z - q.z); if (dd < bd) { bd = dd; best = h; } }
    if (best && bd > 0.1) rope(V(best.x, best.y, best.z), q, 0.012, ROPE_PALE, 1.02);
  }

  // ================================================================================================ into the ride
  // (What it costs: every separate thing is drawn in the scene's pre-pass, the mirror and the picture, and whatever counts
  // as solid once more in the sun's mask. So: only the nave's masts and yards stand in the sun's mask (they are what can
  // cross its coin in a cloth); rails, rings, lashings and ropes are left out of the water's mirror, which here is the
  // softest of the ride and shows a rail 15 m up as nothing.)
  const noMask = (h) => { if (sun) for (const mesh of h.meshes || [h]) sun.solid(mesh, false); return h; };
  const noMirror = (h) => { for (const mesh of h.meshes || [h]) ctx.only(mesh, 'direct'); return h; };
  for (const key of ['a', 'b', 'c']) if (mastPlace[key].length) noMirror(await kit.models(`models/reach/f_nave_mast_${key}.glb`, mastPlace[key], timber(38, 70, { grain: true })));
  // (second look) IN THE WATER'S MIRROR each nave mast is a plain tapered pole of its own colour: this water is the least
  // mirror-like of the ride (a mast's reflection is a soft dark smear, never a copy), and twelve masts of 7,000
  // triangles drawn a third time were 82,000 triangles a frame for nothing the eye can tell.
  if (masts.length) {
    const g = new THREE.CylinderGeometry(0.19, 0.3, 1, 8, 1, true); g.translate(0, 0.5, 0);
    const mesh = new THREE.InstancedMesh(g, kit.gouache({ color: '#4C2E32', brush: 0.5, extend: [sun && sun.extend].filter(Boolean) }), masts.length), q = new THREE.Quaternion();
    masts.forEach((m, i) => { q.setFromUnitVectors(UP, m.axis); mesh.setMatrixAt(i, _m.compose(m.foot.clone().addScaledVector(m.axis, -0.6), q, V(1, m.height / m.axis.y + 0.7, 1))); });
    mesh.instanceMatrix.needsUpdate = true; mesh.computeBoundingSphere(); mesh.name = 'frames: masts in the mirror';
    ctx.add(mesh); ctx.only(mesh, 'mirror');
  }
  counts['nave masts'] = masts.length;
  if (yardPlace.length) noMirror(await kit.models('models/reach/f_yard.glb', yardPlace, timber(22, 45, { lie: true })));
  if (kneePlace.length) { noMask(noMirror(await kit.models('models/reach/f_knee.glb', kneePlace, timber(22, 45, { lie: true })))); counts.knees = kneePlace.length; }
  // (SIXTH PAIR OF EYES: hardly any water-light on the narthex's and the veil's posts. They stand in the veil, on water the veil
  // has washed cream: the water-light painted their wet feet as pale as that water and a post 2 m from the boat ended in
  // a hard line on nothing, .shots/reach_kf6_37.png. Their feet stay wet and dark down to the water now.)
  if (framePlace.length) noMask(await kit.models('models/reach/f_narthex_frame.glb', framePlace, timber(30, 60, { grain: true, caustics: { intensity: 0.06, height: 0.4, scale: 0.4, color: '#FFD2A6' } })));
  if (poles.length) noMask(noMirror(await kit.models('models/reach/f_pole.glb', poles, timber(12, 26, { lie: true }))));
  for (const key of ['a', 'b', 'c', 'd']) if (posts[key].length) { const h = noMask(await kit.models(`models/reach/f_post_${key}.glb`, posts[key], timber(22, 46, { grain: true }))); if (key !== 'b') noMirror(h); }      // (b stands in the water: its reflection is seen)
  counts.yards = yardPlace.length; counts['narthex frames'] = framePlace.length; counts.poles = poles.length;
  counts['aisle masts and posts'] = posts.a.length + posts.b.length + posts.c.length + posts.d.length;
  // lashings: the model's mast stands at -R on its own Z, its rail at +r; scaled so that both axes fall on the real ones
  if (lashes.length) {
    const L = points.f_lash, pl = lashes.map((q) => {
      const n = new THREE.Vector3().subVectors(q.rail, q.mast), dist = n.length(), k = dist / (L.mast_radius + L.rail_radius);
      return posed(q.mast.clone().addScaledVector(n.normalize(), L.mast_radius * k), q.up, n, k);
    });
    noMask(noMirror(await kit.models('models/reach/f_lash.glb', pl, timber(14, 30))));
    counts.lashings = pl.length;
  }
  // rope rings: one small band, instanced
  if (rings.length) {
    // a turn of rope round the rail (one unit = the rail's radius), and the end of its knot hanging a hand below, to one side
    const band = new THREE.CylinderGeometry(1.15, 1.15, 0.42, 8, 1, true); band.rotateZ(Math.PI / 2);
    const g = new THREE.BufferGeometry(), bp = band.attributes.position, bn = band.attributes.normal, P3 = [], N3 = [], I3 = [];
    for (let i = 0; i < bp.count; i++) { P3.push(bp.getX(i), bp.getY(i), bp.getZ(i)); N3.push(bn.getX(i), bn.getY(i), bn.getZ(i)); }
    for (let i = 0; i < band.index.count; i++) I3.push(band.index.getX(i));
    const t0 = bp.count; P3.push(-0.13, -1.0, 0.62, 0.13, -1.0, 0.62, 0.07, -2.5, 0.78, -0.05, -2.7, 0.7); N3.push(0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1); I3.push(t0, t0 + 2, t0 + 1, t0, t0 + 3, t0 + 2);
    // the toggle: a wooden peg hung from the ring under the rail, through the cloth's heading (a four-sided stick, tapering)
    { const k = P3.length / 3, top = -0.95, bot = -2.05, w0 = 0.16, w1 = 0.09;
      for (const [x, z, nx, nz] of [[-1, -1, -0.7, -0.7], [1, -1, 0.7, -0.7], [1, 1, 0.7, 0.7], [-1, 1, -0.7, 0.7]]) { P3.push(x * w0, top, z * w0 * 0.8, x * w1, bot, z * w1 * 0.8); N3.push(nx, 0, nz, nx, 0, nz); }
      for (let q = 0; q < 4; q++) { const a = k + q * 2, b = k + ((q + 1) % 4) * 2; I3.push(a, a + 1, b + 1, a, b + 1, b); } }
    g.setAttribute('position', new THREE.Float32BufferAttribute(P3, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N3, 3)); g.setIndex(I3); band.dispose();
    // (a white paint on every point, and `vertexColors`: three.js gives an instanced mesh with instance colours USE_COLOR in its
    // fragment shader only, and the engine's gouache declares a varying under USE_COLOR: without this the pair does not link)
    g.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(P3.length).fill(1), 3));
    const mat = kit.gouache({ color: '#ffffff', ...timber(9, 20), brush: 0.3, caustics: null, side: THREE.DoubleSide, vertexColors: true });
    const mesh = new THREE.InstancedMesh(g, mat, rings.length), q = new THREE.Quaternion(), X = V(1, 0, 0), col = new THREE.Color(), s = new THREE.Vector3();
    rings.forEach((r, i) => {
      q.setFromUnitVectors(X, r.u); s.set(r.r * (0.9 + rnd() * 0.5), r.r * (0.85 + rnd() * 0.3), r.r * (rnd() < 0.5 ? 1 : -1));
      mesh.setMatrixAt(i, _m.compose(r.p, q, s));
      mesh.setColorAt(i, col.set(ROPE_PALE).multiplyScalar(0.8 + rnd() * 0.45));
    });
    mesh.instanceMatrix.needsUpdate = true; mesh.instanceColor.needsUpdate = true; mesh.computeBoundingSphere(); mesh.name = 'frames: rope rings';
    ctx.add(mesh); ctx.only(mesh, 'direct');
    if (sun) sun.solid(mesh, false);
    counts.rings = rings.length;
  }
  if (wallRings.length) {                                             // the tie-backs' ends: an iron ring on its staple in the quay wall, the rope made fast to it (f_small.py)
    noMask(noMirror(await kit.models('models/reach/f_wallring.glb', wallRings, timber(12, 28, { grain: true }))));
    counts['tie-backs'] = wallRings.length;
  }
  if (ropes.length) {
    const r = makeRopes(ctx, { ropes, radius: 0.016, color: ROPE_DARK, hull: false, rings: false, wetLine: -1, idle: 0.012, exact: true });      // (idle: the slack tie-backs stir in the breeze; a taut lift hardly moves)
    if (r && r.object) { r.object.name = 'frames: ropes'; if (sun) sun.solid(r.object, false); ctx.only(r.object, 'direct'); }
    counts.ropes = ropes.length;
  }

  // ================================================================================================ in the water
  // ---- the rinsing posts: two clusters of three piles in the channel, laid in the world without a turn (kit.js makes the
  // streaming bolts fast 0.3 m down-route of each pile: the models' lines go down to exactly there)
  const rinsing = [];
  for (let i = 0; i < plan.rinsing.length; i++) {
    const R = plan.rinsing[i], c = kit.at(R.at[0], R.at[1]);
    const m = await kit.model(`models/reach/f_rinsing_${i % 2 ? 'b' : 'a'}.glb`, { position: [c.x, 0, c.z], ...timber(40, 80, { grain: true }) });
    if (sun) sun.solid(m.group, false);
    ctx.addCollider({ x: c.x, z: c.z + 0.3, r: R.collide });
    // (`feet`: where each pile stands AT THE WATERLINE and its radius there: the piles lean, their heads are a hand or more off their feet)
    const RP = points['f_rinsing_' + (i % 2 ? 'b' : 'a')] || {};
    rinsing.push({ ties: [0, 1, 2].map((k) => m.point('tie' + k)), perches: [0, 1, 2].map((k) => m.point('perch' + k)), feet: [0, 1, 2].map((k) => ({ p: m.points && m.points['foot' + k] ? m.point('foot' + k) : m.point('perch' + k).setY(0), r: RP['foot_r' + k] || 0.17 })), model: m });
  }
  counts['rinsing posts'] = rinsing.length;
  // ---- the boom: baulks riding the water between its joints, chain across each joint, a post at every second one
  const boom = { posts: [], baulks: [] }, hangEnds = [];
  {
    const B = plan.wheel.boom, W0 = plan.wheel.hub, ride = floatRide(ctx, { size: 4.5, tip: 0.7, most: 0.09, bob: 0.03, period: 3.4 });
    // (FIFTH PAIR OF EYES: no water-light on what floats. `caustics` adds its own pale colour to whatever stands within 0.8 m of
    // the water, whatever its paint: on a mast's foot that is light playing on timber, on a thing that LIES at the waterline
    // it was a coat of milk, and the baulks were pale olive bolsters. A whisper of it is left, low on their flanks.)
    // (And hardly any rim: a baulk's back is seen at a glancing angle from a boat, where the rim against the sun is at its full
    // strength over the whole face: a sheen of pale gold on dark wet timber.)
    const float = timber(40, 80, { extra: ride, lie: true, caustics: { intensity: 0.05, height: 0.12, scale: 0.4, color: '#FFD2A6' }, rim: { color: '#FFB878', strength: 0.05, power: 5.0, toward: 1 } });
    const bk = { a: [], b: [], c: [] }, chains = [], postPl = [];
    for (let i = 0; i < B.length - 1; i++) {
      const a = V(B[i][0], 0, B[i][1]), b = V(B[i + 1][0], 0, B[i + 1][1]), d = new THREE.Vector3().subVectors(b, a), len = d.length(); d.normalize();
      const key = 'abc'[i % 3], L = points['f_baulk_' + key].length, p0 = a.clone().addScaledVector(d, 0.42), p1 = b.clone().addScaledVector(d, -0.42);
      const flip = i % 2 === 1;
      bk[key].push(laid(flip ? p1 : p0, flip ? p0 : p1, L, 1, tintOf(), (rnd() - 0.5) * 0.24));
      boom.baulks.push({ a: p0, b: p1 });
      // (the layout's colliders, again here so that they do not go with its stand-in's lines: one every 3 m, 1.3 m behind the boom on the wheel's side)
      const nx = d.z, nz = -d.x, sign = (nx * (W0[0] - a.x) + nz * (W0[2] - a.z)) > 0 ? 1 : -1;
      for (let t = 0; t < len; t += 3) ctx.addCollider({ x: a.x + d.x * t + nx * sign * 1.3, z: a.z + d.z * t + nz * sign * 1.3, r: 1.6 });
      if (i > 0) {                                                     // the chain across the joint at a
        const prev = V(B[i - 1][0], 0, B[i - 1][1]), dp = new THREE.Vector3().subVectors(a, prev).normalize(), u = dp.clone().add(d).normalize();
        chains.push(posed(a.clone().setY(0.03), UP, new THREE.Vector3().crossVectors(u, UP), [1.65, 1, 1]));
      }
      if (i % 2 === 0) {                                               // a post at every second joint (the swallows' perches), a hand toward the wheel
        const at = b.clone().add(V(nx * sign * 0.3, 0, nz * sign * 0.3));
        postPl.push(posed(at, V((rnd() - 0.5) * 0.06, 1, (rnd() - 0.5) * 0.06), V(-nx * sign, 0, -nz * sign).applyAxisAngle(UP, (rnd() - 0.5)), 1, tintOf()));
        boom.posts.push(at.clone().setY(points.f_boom_post.height));
      }
    }
    for (const key of ['a', 'b', 'c']) if (bk[key].length) { const h = await kit.models(`models/reach/f_baulk_${key}.glb`, bk[key], float); for (const mesh of h.meshes) { mesh.frustumCulled = false; if (sun) sun.solid(mesh, false); } }
    if (chains.length) { const h = await kit.models('models/reach/f_boom_chain.glb', chains, float); for (const mesh of h.meshes) { mesh.frustumCulled = false; if (sun) sun.solid(mesh, false); } }
    if (postPl.length) noMask(await kit.models('models/reach/f_boom_post.glb', postPl, timber(40, 80, { grain: true })));
    counts['boom baulks'] = boom.baulks.length; counts['boom posts'] = postPl.length;
  }

  // ================================================================================================ the close band at the feet
  // What has grown and lodged where timber stands in the stream (page: "a hand of green weed under the surface"): weed
  // rooted on the down-stream side of every foot, streaming with the current, a wave running down each frond, leaning out
  // of the hull's way; and here and there a rag of the day's cloth caught round a foot and trailing on the surface.
  for (const R of rinsing) for (const q of R.feet) wetFeet.push({ p: V(q.p.x, 0, q.p.z), r: q.r, s: locate(q.p).s, side: 0, kind: 'pile' });      // (sixth look: they were taken from the piles' HEADS, and the piles lean: the weed lay on the water a hand off its pile)
  for (const q of boom.posts) wetFeet.push({ p: V(q.x, 0, q.z), r: 0.15, s: locate(q).s, side: -1, kind: 'pile' });
  {
    const stream = /* glsl */`
      vec3 kO = (modelMatrix * vec4(instanceMatrix[3].xyz, 1.0)).xyz;
      vec3 kZ = normalize(mat3(modelMatrix) * (mat3(instanceMatrix) * vec3(0.0, 0.0, 1.0)));
      float kA = aStream.x, kP = aStream.y + kO.x * 3.1 + kO.z * 1.7;
      wp.xyz += kZ * (uStream.x * kA * kA * sin(uTime * 1.25 - kA * 5.0 + kP) + uStream.y * kA * sin(uTime * 0.43 + kP * 1.7));
      wp.y += uStream.z * kA * sin(uTime * 0.9 + kP * 0.6);
      vec2 kB = wp.xz - uBoat.xz; float kD = length(kB);
      wp.xz += kB / max(kD, 0.05) * kA * 0.32 * (1.0 - smoothstep(1.3, 3.4, kD));`;
    const streaming = (sway, more = {}) => kit.gouache({ color: '#ffffff', vertexColors: true, side: THREE.DoubleSide, brush: 0.4, ...more,
      extend: [sun && sun.extend, { uniforms: { uStream: { value: new THREE.Vector3(sway[0], sway[1], sway[2]) } }, vertexPars: 'attribute vec2 aStream; uniform vec3 uStream;', vertexWorld: stream }].filter(Boolean) });
    /** Ribbons as one geometry: each { line: [[x, y, z], ...], width(u), roll(u) (0 = lying flat), wave(u) (0..1 how freely it waves), phase, color(u) }. */
    const ribbons = (list) => {
      const pos = [], col = [], att = [], idx = [], c = new THREE.Color();
      for (const rb of list) {
        const n = rb.line.length, base = pos.length / 3;
        for (let i = 0; i < n; i++) {
          const u = i / (n - 1), p = rb.line[i], q = rb.line[Math.min(n - 1, i + 1)], o = rb.line[Math.max(0, i - 1)];
          const t = V(q[0] - o[0], q[1] - o[1], q[2] - o[2]).normalize(), side = new THREE.Vector3().crossVectors(UP, t).normalize(), a = rb.roll ? rb.roll(u) : 0;
          const w = side.multiplyScalar(Math.cos(a)).addScaledVector(UP, Math.sin(a)).multiplyScalar(rb.width(u) / 2);
          pos.push(p[0] - w.x, p[1] - w.y, p[2] - w.z, p[0] + w.x, p[1] + w.y, p[2] + w.z);
          c.set(rb.color(u)); col.push(c.r, c.g, c.b, c.r, c.g, c.b);
          const wv = rb.wave ? rb.wave(u) : u; att.push(wv, rb.phase, wv, rb.phase);
          if (i < n - 1) { const k = base + i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
        }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('aStream', new THREE.Float32BufferAttribute(att, 2));
      g.setIndex(idx); g.computeVertexNormals();
      return g;
    };
    /** Strips of cloth or weed as one geometry, THREE POINTS ACROSS (a strip has a fold down its middle: it is never a flat card), for
     *  strips that hang or stand as well as lie: each { line: [[x, y, z], ...], across(u) -> [x, y, z] (which way its width lies), width(u),
     *  fold(u) (metres its middle stands off), wave(u) (0..1 how freely it moves), phase, color(u) }. */
    const strips = (list) => {
      const pos = [], col = [], att = [], idx = [], c = new THREE.Color(), A = new THREE.Vector3(), T = new THREE.Vector3(), Nn = new THREE.Vector3();
      for (const sp of list) {
        const n = sp.line.length, base = pos.length / 3;
        for (let i = 0; i < n; i++) {
          const u = i / (n - 1), p = sp.line[i], q = sp.line[Math.min(n - 1, i + 1)], o = sp.line[Math.max(0, i - 1)];
          T.set(q[0] - o[0], q[1] - o[1], q[2] - o[2]).normalize();
          A.fromArray(sp.across(u)); A.addScaledVector(T, -A.dot(T)).normalize(); Nn.crossVectors(T, A).normalize();
          const w = sp.width(u) / 2, f = sp.fold ? sp.fold(u) : 0;
          pos.push(p[0] - A.x * w, p[1] - A.y * w, p[2] - A.z * w, p[0] + Nn.x * f, p[1] + Nn.y * f, p[2] + Nn.z * f, p[0] + A.x * w, p[1] + A.y * w, p[2] + A.z * w);
          c.set(sp.color(u)); for (let k = 0; k < 3; k++) col.push(c.r, c.g, c.b);
          const wv = sp.wave ? sp.wave(u) : u; for (let k = 0; k < 3; k++) att.push(wv, sp.phase || 0);
          if (i < n - 1) { const k = base + i * 3; idx.push(k, k + 1, k + 3, k + 1, k + 4, k + 3, k + 1, k + 2, k + 4, k + 2, k + 5, k + 4); }
        }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('aStream', new THREE.Float32BufferAttribute(att, 2));
      g.setIndex(idx); g.computeVertexNormals();
      return g;
    };
    const lay = (geo, mat, items, name) => {                          // items: { p, dir (down-stream), scale, color } (never shallower than modelled: a thin foot's weed must still lie UNDER the water)
      const mesh = new THREE.InstancedMesh(geo, mat, items.length), q = new THREE.Quaternion(), X = V(1, 0, 0), sc = new THREE.Vector3(), c = new THREE.Color();
      items.forEach((it, i) => { q.setFromUnitVectors(X, it.dir); sc.setScalar(it.scale); sc.y = Math.max(it.scale, 0.95); if (it.flip) sc.z = -sc.z; mesh.setMatrixAt(i, _m.compose(it.p, q, sc)); mesh.setColorAt(i, c.set(it.color)); });      // (flip: the thing mirrored, for the other bank: local +Z is the route's right)
      mesh.instanceMatrix.needsUpdate = true; mesh.instanceColor.needsUpdate = true; mesh.frustumCulled = false; mesh.name = name;
      ctx.add(mesh); ctx.only(mesh, 'direct');
      return mesh;
    };
    // ---- a hand of weed, for a foot 0.31 m in radius (scaled to the others). (How it came here: the first holder's was
    // eleven flat dark ribbons a hand under the surface, scribbles ON the water; the second's fifteen broad fronds rooted at
    // the waterline with a fringe of hair weed on the surface: from 2 m, looking down, a feather laid on the water. The
    // water thins to nothing in its first 6 cm (the realm's `edge`), so whatever lies shallower than that is ON it.)
    // THIRD LOOK: thirty thin strands, a finger wide and less, rooted round the down-stream half of the foot from a hand
    // to a forearm UNDER the water and streaming away below the surface, each on its own wandering line, so the water
    // tints them, bends them with its ripples and takes the long ones altogether: weed seen through water.
    // FIFTH PAIR OF EYES: the third's strands lay a hand to a forearm under an opaque river and showed as a few straight black
    // hairlines a metre long, like scratches on the picture; the fourth's fringe of tufts at the waterline showed as green and
    // black specks. A TRESS now: some forty strands rooted just under the surface round the down-stream half of the foot, lying
    // IN the water's clear first hand's breadth and sinking out of it toward their ends, the middle ones long and the side ones
    // short, so the whole is one dark soft tongue of weed a forearm wide that streams down the current and thins to threads;
    // strands lie on strands (no two at one depth), dark olive at the foot, near black where the dye takes them. What clings
    // to the timber itself at the waterline is painted on the models (the tarred rope's weed).
    // SIXTH PAIR OF EYES: the tress of eighteen broad strands, all leaving the foot together and lying on one another, showed as
    // ONE flat dark green wedge on the water: a leaf, or a flag, laid at the foot (.shots/reach_kf6_33_crop.png). (This river
    // wears an opaque film of dye: nothing a hand under it is ever seen, so a weed here is either on the timber, where the
    // models paint it, or lying in the surface itself.) RIBBON WEED now: nine separate blades to a foot, two or three fingers
    // wide at their widest and running out to a point, no two a length (a hand to more than a metre), rooted in three loose
    // clumps round the down-stream half of the foot, each leaving the timber and turned down the stream within a hand,
    // each turning on itself as it lies (a ribbon shows its edge and its face by turns) and wandering; water between them.
    const wr = ctx.rng(733), fronds = [];
    const WEED_ROOT = new THREE.Color('#2C3A1D'), WEED_MID = new THREE.Color('#24311A'), WEED_DEEP = new THREE.Color('#141D15');      // (in this red-gold light, under the lantern, a livelier green shows emerald)
    // [where it is rooted (radians round the foot from straight down-stream), length (m), width (m)]
    const BLADES = [[-0.78, 0.44, 0.05], [-0.52, 0.98, 0.062], [-0.14, 0.3, 0.046], [0.07, 0.72, 0.054], [0.31, 1.18, 0.066], [0.62, 0.36, 0.046], [0.86, 0.62, 0.054], [-0.33, 0.17, 0.046], [0.48, 0.15, 0.042]];      // (tried first two fingers wide and rolling more: grass and hairlines, .shots/reach_kf6_50_crop.png)
    for (const [th0, L0, w0] of BLADES) {
      const th = th0 + (wr() - 0.5) * 0.12, R = 0.3, L = L0 * (0.85 + 0.3 * wr()), ph = wr() * 6.28, curl = (wr() - 0.5) * 0.24, y0 = -0.003 - 0.004 * wr(), line = [];
      for (let k = 0; k <= 10; k++) {
        const u = k / 10, off = 0.05 * (1 - Math.exp(-u * 8));                                             // it stands a little off the timber, then lies down the stream
        line.push([(R + off) * Math.cos(th) * (1 - 0.25 * u) + L * u, y0 - 0.012 * u - 0.05 * Math.pow(u, 4) + 0.003 * Math.sin(u * 7 + ph),
          (R + off) * Math.sin(th) * (1 - 0.55 * u) + curl * u * u + 0.035 * Math.sin(u * 5.5 + ph) * u]);
      }
      const lush = 0.8 + 0.4 * wr();
      fronds.push({ line, width: (u) => w0 * (0.5 + 0.5 * Math.min(1, u / 0.2)) * (1 - Math.pow(u, 2.2)) + 0.008, roll: (u) => 0.3 * Math.sin(u * 4.2 + ph),
        phase: ph, color: (u) => (u < 0.3 ? WEED_ROOT.clone().multiplyScalar(lush).lerp(WEED_MID, u / 0.3) : WEED_MID.clone().multiplyScalar(0.6 + 0.4 * lush).lerp(WEED_DEEP, (u - 0.3) / 0.7)) });
    }
    // (not on the narthex's and the veil's frames: the youngest timber in the works has grown nothing yet)
    const weedAt = wetFeet.filter((f) => f.kind !== 'frame').map((f) => ({ p: f.p.clone().setY(0), dir: frameAt(f.s).t.clone().applyAxisAngle(UP, (rnd() - 0.5) * 0.5), scale: (f.r / 0.31) * (0.85 + rnd() * 0.4), color: ['#ffffff', '#e6f0d8', '#d8e0c8', '#f0e8d0'][Math.floor(rnd() * 4)] }));
    if (weedAt.length && QS.get('kfweed') !== '0') lay(ribbons(fronds), streaming([0.07, 0.04, 0.004]), weedAt, 'frames: weed');
    counts['hands of weed'] = weedAt.length;
    // ---- A STRIP OF THE DAY'S CLOTH ON THE MOORING RING. (How it came here: a rag caught on a foot. The first lay down-stream of
    // its foot, dark, and could not be found; the second's two tails lay ON the water: a banana skin; the third's streamed
    // UNDER the surface of a river that is opaque a hand down; the fourth knotted a strip through the mooring ring, as a dyer
    // does who tries the bath with a strip of the cloth and ties it where the next hand will find it: the right thing in the
    // right place, but built in the ride as flat strips, and at 2.3 m it was a paper cut-out of one flat colour with two pale
    // leaves where it met the water.) FIFTH PAIR OF EYES: it is modelled now (f_small.py, f_rag.glb): a strip a hand wide,
    // cow-hitched on the ring's lower arc, two ends hanging down the timber, wet cloth with a thickness, folded on itself,
    // turning as it hangs, deeper where the bath stood longest; it ends a hand above the tarred rope, nothing of it in the
    // water. On five of the twelve masts, each in the dye of its place (the model is painted in values: the dye is its tint).
    // It stirs a little in the realm's wind, its free ends most.
    {
      const tr = ctx.rng(517);
      const D = plan.dyes, zone = (s, side) => (s < 48 ? 1 : s < 70 ? (side < 0 ? 1 : 2) : s < 100 ? (side < 0 ? 5 : 3) : side < 0 ? 5 : 2);
      const air = { uniforms: { uRagAir: { value: new THREE.Vector3(WIND.x, WIND.z, 0.035) } }, vertexPars: 'uniform vec3 uRagAir;',
        vertexWorld: /* glsl */`
          #ifdef USE_INSTANCING
            vec3 kO = (modelMatrix * vec4(instanceMatrix[3].xyz, 1.0)).xyz;
            float kH = clamp((kO.y - wp.y) / 0.56, 0.0, 1.0); kH *= kH;
            float kP = kO.x * 3.1 + kO.z * 1.7;
            float kS = 0.45 + 0.35 * sin(uTime * 0.8 + kP) + 0.2 * sin(uTime * 1.9 + kP * 1.7 - kH * 2.5);
            wp.xz += uRagAir.xy * (uRagAir.z * kH * kS);
          #endif` };
      // (not on a `c` mast: its ring carries a mooring line already, and a rag twisted round a rope is a tangle)
      const free = masts.filter((m) => m.variant !== 'c' && pm[m.variant].ring_low), c = new THREE.Color(), WETC = new THREE.Color('#5A2A30');
      const picks = free.filter((m, i) => [0, 2, 3, 5, 7].includes(i));
      const rags = picks.map((m) => {
        const low = m.point('ring_low'), ax = m.onAxis(low.y), outw = new THREE.Vector3(low.x - ax.x, 0, low.z - ax.z).normalize();
        c.set(D[zone(m.s, m.side)].color).lerp(WETC, 0.16).multiplyScalar(0.5 + 0.14 * tr());            // (wet cloth is deeper than the bolts drying overhead; sixth look: deeper still, and a little toward the wet's own plum: it was the most saturated thing on the mast)
        return posed(low, m.axis, outw.applyAxisAngle(UP, (tr() - 0.5) * 0.3), [1, 0.86 + 0.24 * tr(), 1], '#' + c.getHexString());
      });
      if (rags.length) noMask(noMirror(await kit.models('models/reach/f_rag.glb', rags, { brush: 0.5, rim: { color: '#FFB878', strength: 0.08, power: 4.0, toward: 1 }, extend: [sun && sun.extend, air].filter(Boolean) })));
      counts['strips on the rings'] = rags.length;
    }
    // ---- ropes left hanging: a line from the empty cleat of every `b` mast, its end a forearm above the water. They swing in
    // the air, lean in a wind, and the boat's wake sets them going. (Second look: the four long "halyard tails" that hung
    // 15 m from the wall plates to just above the water are gone: each read as a rigid rod that stopped in mid-air.)
    const hang = [];
    for (const mast of masts) if (pm[mast.variant].tail) { const a = mast.point('tail'); hang.push({ from: [a.x, a.y, a.z], length: a.y - 0.13, radius: 0.015, color: ROPE_OLD, wet: [0.55, 1] }); }
    hangEnds.push(...hang.map((h) => V(h.from[0], h.from[1] - h.length, h.from[2])));
    // SIXTH PAIR OF EYES: THE MOORING LINE LEFT ON A `c` MAST'S RING. It was modelled with the mast, a thin tube "with the kinks
    // of its old coils": in the ride a dark squiggle like bent wire down to the water. A wet rope hangs plumb. The model keeps
    // the bowline; the line is one of these ropes now, hung from the model's point `moor`: it hangs true, goes a forearm into
    // the water (wet and dark from just under the knot), swings when the wake reaches it and rings the water where it enters.
    // (Tried first hanging plumb into the water: beside an upright mast a straight line is a rod, .shots/reach_kf6_47_crop.png. A
    // line whose end lies in a current is drawn down-stream by it: so it is slung from the knot to its own wet end, which
    // trails half a metre down the stream a hand under the surface, with slack enough to belly: it leaves the ring nearly
    // plumb, curves, and goes into the water at a slant. No two the same length or lead.)
    const mr = ctx.rng(911);
    let moored = 0;
    for (const mast of masts) if (pm[mast.variant].moor) {
      const a = mast.point('moor'), t = frameAt(mast.s).t, ax = mast.onAxis(a.y), outw = new THREE.Vector3(a.x - ax.x, 0, a.z - ax.z).normalize();
      const end = a.clone().addScaledVector(t, 0.55 + mr() * 0.3).addScaledVector(outw, 0.06 + mr() * 0.1).setY(-0.3);      // (its end a forearm down: at a hand's depth it still showed, cut off square on the surface)
      hang.push({ from: [a.x, a.y, a.z], to: [end.x, end.y, end.z], length: a.distanceTo(end) * (1.07 + mr() * 0.05), radius: 0.02, color: '#4E3E36', wet: [0.35, 1], settle: 12 });
      moored++;
    }
    if (hang.length) { const r = makeRopes(ctx, { ropes: hang, radius: 0.015, color: ROPE_PALE, hull: true, rings: true, idle: 0.014, settle: 26, exact: true }); if (r && r.object) { r.object.name = 'frames: hanging ropes'; if (sun) sun.solid(r.object, false); ctx.only(r.object, 'direct'); } }
    counts['hanging ropes'] = hang.length - moored; counts['mooring lines'] = moored;
  }

  // ================================================================================================ far off: the tenter fences
  // (places as the layout's: rows every 16 m both sides of the sun road; north of it only far off and short of the loft's
  // line, so that the sun's line from the terraces and the loft stays open: plan.tenter.north)
  {
    const T = plan.tenter, R = plan.sunRoad, D = plan.dyes, { SAFFRON, MADDER, VIOLET, CRIMSON } = plan.dye, TF = points.f_tenter, pl = [];
    const c = new THREE.Color(), c2 = new THREE.Color();
    for (let i = 0; i < T.rows; i++) {
      const z = T.from - i * T.every;
      for (const side of [-1, 1]) {
        const x0 = side < 0 ? R.x[0] - T.gap : R.x[1] + T.gap; let x1 = x0 + side * T.length;
        if (side > 0) { if (z > T.north.from) continue; x1 = Math.min(x1, T.north.to); }
        if (Math.abs(x1 - x0) < 6) continue;
        const h = side < 0 ? T.height : T.heightNorth, y0 = side < 0 ? 0.6 : plan.causeway.top, dye = [SAFFRON, MADDER, VIOLET, MADDER, SAFFRON, CRIMSON][(i + (side > 0 ? 2 : 0)) % 6];
        c.set(D[dye].color).lerp(c2.set(D[Math.min(5, dye + 1)].color), 0.1 * rnd()).multiplyScalar(0.84 + 0.2 * rnd());
        pl.push({ position: [(x0 + x1) / 2, y0, z + (rnd() - 0.5) * 0.6], rotation: [0, (rnd() - 0.5) * 0.05 + (rnd() < 0.5 ? Math.PI : 0), 0], scale: [Math.abs(x1 - x0) / (TF.half * 2), h / TF.height, 1], tint: '#' + c.getHexString() });
      }
    }
    if (pl.length) {
      const h = await kit.models('models/reach/f_tenter.glb', pl, { ...timber(40, 90), materials: { cloth: { brush: 0.5, backlight: 0.9, side: THREE.DoubleSide, rim: null, caustics: null, extend: null } } });
      for (const mesh of h.meshes) {
        if (mesh.name.endsWith(':cloth')) { if (sun) sun.drape({ material: mesh.material, object: mesh }); }
        else { for (let i = 0; i < pl.length; i++) mesh.setColorAt(i, c.set('#ffffff')); mesh.instanceColor.needsUpdate = true; if (sun) sun.solid(mesh, false); }      // the timber keeps its own paint
      }
      counts['tenter fences'] = pl.length;
    }
  }

  // ---- the layout's stand-ins that these replace (kit.js)
  for (const name of ['nave frames', 'narthex frames', 'aisle masts and posts', 'rinsing posts', 'boom', 'tenter posts and silk masts', 'tenter fences']) removeStandIn(ctx, name);

  counts['bolts read'] = bolts.length; counts['bolts with nothing to hang from'] = bolts.filter((b) => !b.used).length;
  shared.frames = { heads, masts, rails, rinsing, boom, hangEnds, wetFeet, tieBacks, counts };
  if (QS.has('counts')) fetch('/__shot/reach_kf_counts.json', { method: 'POST', body: JSON.stringify(counts, null, 1) }).catch(() => {});      // &counts=1: what was grown, to .shots/reach_kf_counts.json
  return {};
}
