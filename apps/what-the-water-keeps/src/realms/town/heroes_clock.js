// The town below: the clockwork of the monument (stage 2a, clockwork; docs/build/town/2-monument-clockwork.md).
//   clock_movement   the works behind the four dials: three trains in an iron cage (one mesh, one draw call: every
//                    vertex carries its part's number and the vertex shader turns the parts about their own pivots)
//   pendulum         nine metres of rod and a gilt lens bob that kisses the lake every three seconds (gilt: it is LIT, from
//                    below, by the lake, like a moon lit from beneath, and gives off nothing; far off it is kept out of the
//                    painter's filter), and the tower's warm light on the crests of the rings it leaves
//   hour_ring        the iron wheel 16 m across on the square's floor, twelve lanterns on standards, turning once in 96 s;
//                    and the lanterns' light on the square's flags and on the tower's foot (lit stone drawn as stone: the
//                    lake bed's own flags, joints, rail and hour stones; the foot's ashlar), with the wheel's shadow in it
// The models are made by source-art/models/town/clock_movement.py, pendulum.py and hour_ring.py; the numbers every
// part turns by travel beside them (assets/models/town/<name>.json: clockwork_lib.py says what is in it). Nothing here
// copies a coordinate from a script.
//
// ONE PHASE. Everything follows from the realm's time: the pendulum's swing; the escape wheel, let through one tooth a
// swing by the anchor (its motion is the table worked out from the pallets' own geometry: drop, recoil, impulse); the
// going train and the four dials' rods geared to it; the ring's train (steady: second wheel, great wheel, the contrate
// wheel and the shaft that goes down the tower to the crown wheel, the ring and its rollers); and the striking train,
// which stands still until the staging turns it (shared.clock.strike). Nothing is added up frame by frame, so a picture
// taken twice is the same picture and no pair of wheels can drift out of mesh.
//
// FOR THE CAST AND THE STAGING: shared.clock (see the end of build()).
// Developer switches: &cwhold=<seconds> holds the clockwork at that moment (two stills a moment apart prove a motion);
// &cwstrike=<turns> turns the striking train (the fly's turns); &cwspin=<turns a second> runs it; &cwfan=<0..1> shows the
// fly's fan whatever its speed; &cwkiss=0 writes no rings; &cwswell=strength,radius the broad low ring each kiss sends
// out (0: none); &cwring=strength,reach,speed,life,width,lamp the drawn ring of the tower's light that leaves the bob at
// each kiss (0: none); &cww=fill,matte,sheen,lobe,warm,glint,oculus,cap,fail,lake,points,power the works' light (the clock
// room's: works() below); &cwbob=body,sheen,points,power,warm,matte,cap,limb0,limb1 the bob's gilding (gilt() below);
// &cwthin=, &cwthinbob= the distances beyond which rod and bob are kept out of the painter's filter;
// &cwgain=, &cwhalo=, &cwpool= the hour ring's glass, halos and light on the stone, and
// &cwlook=tight,soft,shade,iron,heart,skirt,band,flags,wall,take,takeWall,core the rest of its look (plan.clockwork.ring
// says what each is); &cwfar=, &cwfarring= metres beyond which the works and the ring are not drawn;
// &cwstudy=<turn in degrees>[,<metres ahead>[,<metres up>]] stands a second copy of the movement on the water in front of
// the boat, in the same light and turning with the real one, to be looked at closely (the real one is never nearer than 11 m).
import * as THREE from 'three';
import { removeStandIn } from '../../engine/modules.js';
import { makeEscapement, makeMachine } from '../../engine/life/machines.js';
import { ensureLight } from './light.js';
import { NOISE_GLSL } from '../../engine/kit.js';

const TAU = Math.PI * 2;
const Q = new URLSearchParams(typeof location !== 'undefined' ? location.search : '');
const num = (k, d) => (Q.has(k) && Q.get(k) !== '' && isFinite(+Q.get(k)) ? +Q.get(k) : d);

async function sidecar(name) {
  const r = await fetch(`assets/models/town/${name}.json`);
  if (!r.ok) throw new Error(`clockwork: assets/models/town/${name}.json: ${r.status}`);
  return r.json();
}

/**
 * The parts of one model as the vertex shader turns them. spec: the model's sidecar. Returns
 *   extend            a gouache extension: put it after the area's light in a material's `extend`
 *   set(name, value)  a part's angle (radians, about its own axis) or travel (metres), now
 *   apply(i, v)       a point of part i in the model's own space, carried to where the part has taken it (in place)
 *   members, byName, n
 */
function makeRig(spec) {
  const n = Math.max(...spec.members.map((m) => m.index)) + 1;
  const P = Array.from({ length: n }, () => new THREE.Vector4(0, 0, 0, 0));        // pivot in the model's own space (the ride's axes), parent
  const X = Array.from({ length: n }, () => new THREE.Vector4(0, 1, 0, 0));        // axis, and the angle or travel now
  const K = new Array(n).fill(0);                                                   // 1: it slides along its axis instead of turning
  const byName = {};
  for (const m of spec.members) {
    P[m.index].set(m.pivot[0], m.pivot[2], -m.pivot[1], m.parent || 0);            // Blender (x, y, z) is the ride's (x, z, -y)
    X[m.index].set(m.axis[0], m.axis[2], -m.axis[1], 0);
    K[m.index] = m.kind === 'slide' ? 1 : 0;
    byName[m.name] = m;
  }
  const extend = {
    uniforms: { uCwP: { value: P }, uCwX: { value: X }, uCwK: { value: K } },
    vertexPars: `uniform vec4 uCwP[${n}], uCwX[${n}]; uniform float uCwK[${n}];`,
    // a part turns about its own pivot; a part that rides on another (a roller on the ring) is then carried by it
    vertexLocal: /* glsl */`{
      int ci = int(uv.x + 0.5);
      for (int cs = 0; cs < 2; cs++) {
        if (ci <= 0) break;
        vec4 cp = uCwP[ci], cx = uCwX[ci];
        if (uCwK[ci] > 0.5) transformed += cx.xyz * cx.w;
        else {
          vec3 cr = transformed - cp.xyz; float cc = cos(cx.w), cn = sin(cx.w);
          transformed = cp.xyz + cr * cc + cross(cx.xyz, cr) * cn + cx.xyz * (dot(cx.xyz, cr) * (1.0 - cc));
          objectNormal = objectNormal * cc + cross(cx.xyz, objectNormal) * cn + cx.xyz * (dot(cx.xyz, objectNormal) * (1.0 - cc));
        }
        ci = int(cp.w + 0.5);
      }
    }`,
  };
  const ax = new THREE.Vector3(), pv = new THREE.Vector3();
  const apply = (i, v) => {
    for (let s = 0; s < 2 && i > 0; s++) {
      const p = P[i], x = X[i];
      ax.set(x.x, x.y, x.z);
      if (K[i]) v.addScaledVector(ax, x.w); else { pv.set(p.x, p.y, p.z); v.sub(pv).applyAxisAngle(ax, x.w).add(pv); }
      i = Math.round(p.w);
    }
    return v;
  };
  return { n, extend, members: spec.members, byName, set(name, value) { const m = byName[name]; if (m) X[m.index].w = value; }, value: (name) => (byName[name] ? X[byName[name].index].w : 0), apply };
}

export async function build(ctx, plan, shared) {
  const { kit } = ctx, light = ensureLight(ctx, plan, shared), town = light.town, T = plan.tower, CW = plan.clockwork;
  // the tower's own frame: its axis at the waterline, turned to the route there (every model of the tower is placed so)
  const [tx, tz] = town.xz(T.s, T.d), yaw = town.along(T.s);
  const place = (shared.tower && shared.tower.place) || { position: [tx, 0, tz], rotation: yaw - Math.PI / 2 };
  const ry = typeof place.rotation === 'number' ? place.rotation : place.rotation[1];
  const lightExt = (lit) => (light.extendFor ? light.extendFor(lit) : light.extend);
  const hold = num('cwhold', null);
  const now = () => (hold != null ? hold : ctx.time);
  const tmp = new THREE.Vector3();

  // ---------------------------------------------------------------------------------------------- the phases
  // The pendulum and its two events come from the toolkit's escapement (docs/life/ribbons.md): onPass is the bob at
  // the bottom of its swing, where it kisses the lake. The escape wheel's own motion is not the toolkit's drawing of
  // one but the table that the pallets' geometry gives (clock_movement.json), on the same swing.
  const mv = await sidecar('clock_movement');
  const E = mv.escapement, PERIOD = E.period, AMP = E.amplitude, u0 = CW.swingPhase;
  const esc = makeEscapement(ctx, { period: PERIOD, amplitude: AMP, teeth: E.teeth, phase: u0 });
  const ringTrain = makeMachine(ctx, { period: mv.trains.ring.period, phase: CW.ringPhase });       // the second arbor: one turn in 24 s, steadily
  const table = E.table, NT = table.length - 1;
  const swingAt = (t) => AMP * Math.sin(TAU * (t / PERIOD + u0));
  const goingAt = (t) => { const u = t / PERIOD + u0, w = Math.floor(u), f = (u - w) * NT, i = Math.min(NT - 1, Math.floor(f)); return w * E.tooth + table[i] + (table[i + 1] - table[i]) * (f - i); };
  const strike = { fly: num('cwstrike', CW.flyRest ?? 0) };                      // turns of the fly: the staging turns it. (It does not rest at 0 but at CW.flyRest: there its vanes stand a little askew to the
                                                                                  // dials, and are seen as plates in the round; square-on they were two flat rectangles. The lever's pin is still clear of its tail there.)
  const extra = {};                                                               // radians added to a part by name (the staging's)
  const cam = mv.strike.cam, pinPitch = TAU / mv.strike.pins;
  const leverAt = (flyRad) => { const f = (((Math.abs(mv.strike.great_k) * flyRad) / pinPitch) % 1 + 1) % 1 * (cam.length - 1), i = Math.min(cam.length - 2, Math.floor(f)); return cam[i] + (cam[i + 1] - cam[i]) * (f - i); };

  // ---------------------------------------------------------------------------------------------- the movement
  // Its light: the room is dark, and the area's material gives a thing 10 m up almost nothing of the town's light from
  // below (rightly, for a wall). But the works stand over the open oculus and behind four openings 4 m across: the lit
  // lake shines up into them. So brass and iron here take a share of the light from below of their own (works(),
  // below; the page: the clock's gilt only reflects the underlight). It is the town's own light (its colour and
  // strength are the area's, read every frame): it fails when the square under the tower goes to sleep.
  const uFrom = { value: new THREE.Color(0, 0, 0) };                              // the light from below at the tower, now (filled in every frame from the area's light)
  // METAL. Gouache is matte paint; brass, steel and gilding are not. v of each model's UV says how much of polished metal
  // a corner is (clockwork_lib.metal_of: brass and gilt 1, bright steel 0.5, iron, oak and rope little or none). Nothing
  // here gives off light: the page's "the clock's gilt only reflects the underlight". Two extensions light it, each in
  // its own way and both from uFrom, the town's light from below at the tower (so both fail when the square sleeps):
  // works() for the movement (the light that comes up into the clock room) and gilt() for the pendulum (the lake under
  // the bob). (The first way, one mirror extension for both, showed the lit lake and the lamps in whatever was polished:
  // from the water that was rows of sparks on the works and a bob as bright as a lantern. Its mirror glints live on in
  // works(), for the last twenty metres.) metal(o) is what the two share: the uniforms.
  //   lake               how brightly metal shows the lake where its mirror image of the eye's line looks down (near by only)
  //   points             how brightly it shows the lamps as points; power: how small those points are
  const metal = (o) => ({
    uniforms: { uCwFrom: uFrom, uCwGilt: { value: new THREE.Vector4(o.lake || 0, o.points || 0, o.power || 24, 0) }, uCwMid: { value: o.mid || new THREE.Vector2(tx, tz) } },
    fragmentPars: 'uniform vec3 uCwFrom; uniform vec4 uCwGilt; uniform vec2 uCwMid;' });
  // THE WORKS' OWN LIGHT. The room is dark, and the lake's light comes UP INTO IT THROUGH THE FOUR ROUND OPENINGS (and a
  // little through the oculus). The light is the town's (its colour and strength read every frame: it fails when the
  // square sleeps); brass takes all of it, steel most, iron, oak and rope a fifth; nothing in the works gives off light.
  // (Second look, a fifth time: the light was laid on every face that looked out through an opening, evenly, failing a
  // little with the distance from it; and beyond twelve metres whatever came out brighter than `cap` was scaled down to
  // exactly the cap. Nearly all lit brass was above it: so from every place the ride allows a wheel was ONE saturated
  // orange on every face, flat card, a wheel a metre behind another the same orange, and the model's own painted shade,
  // wear and cavity were thrown away with the light. Now the light is followed as it truly comes:
  //   - IT COMES UP, THROUGH A HOLE IN A WALL 0.9 M THICK. From every point of the works three rays are followed back
  //     toward the lake outside each opening (steep, to the bright water at the tower's foot; middling; shallow, to the far
  //     lake: `shafts`, metres outward for a metre down) and asked whether the opening is there, at the wall's inner face
  //     and at its outer. So the sill shades what stands low behind it and the head of the opening is the brightest place;
  //     what stands deep in the room is lit only where it stands high (the fly under the ceiling, the tops of the far
  //     wheels) and the foot of the room is dark: a wheel rises out of shadow into light, the room has depth, and from
  //     the back a wheel four metres inside is a dim wheel, not a scrap of orange;
  //   - what the light does not reach has the room's own bounce (`amb`), more of it the higher: a dark bronze, never black;
  //   - lit brass is GOLD: its lit colour is drawn from the town's coral toward gold as the dial's own gilding is
  //     (`gold`), so the wheels are of one metal with the hands and a step under them; steel is drawn cool;
  //   - nothing is clamped: above `knee` what the lights give climbs ever more slowly toward `ceil` (far under what
  //     blooms), keeping its order, so light and shade, the painted wear on the tooth points and the cavities all show;
  //   - between `crisp` and `crispTo` metres the works are kept out of the painter's filter (crossings and teeth are finer
  //     than its brush, and it blotted the escapement to a scribble and rubbed the teeth off the wheels); beyond, where a
  //     tooth is smaller than a pixel, it takes them back.)
  //   o: fill (how much of the light), matte (the share iron, oak and rope take), sheen and lobe (the pale answer of metal
  //   turned between the light and the eye, and how broad), warm (the light itself: 0 the town's own orange .. 1 gold),
  //   glint (the mirror glints near by), oculus, knee and ceil (the shoulder), amb, gold, crisp, shafts, was (how much of
  //   the area's own light for things in the open air the works keep), plus metal()'s lake, points and power.
  const works = (o) => {
    const base = metal(o), sh3 = o.shafts || [0.55, 1.2, 2.6], shw = o.shares || [0.45, 0.35, 0.2];
    return {
      uniforms: { ...base.uniforms, uCwFar: o.far || { value: 1 }, uCwRoom: { value: (() => { const r = o.room || new THREE.Vector4(Math.cos(ry), Math.sin(ry), mv.points.dial_front.at[2], 0); r.w = o.was ?? 0.6; return r; })() },
        uCwLit: { value: new THREE.Vector4(o.fill ?? 1.0, o.matte ?? 0.2, o.sheen ?? 0.5, o.lobe ?? 7) }, uCwLit2: { value: new THREE.Vector4(o.warm ?? 0.5, o.glint ?? 1, o.oculus ?? 0.7, 0) },
        uCwTone: { value: new THREE.Vector4(o.knee ?? 0.3, o.ceil ?? 0.62, o.amb ?? 0.1, o.gold ?? 0.6) }, uCwShaft: { value: new THREE.Vector3(sh3[0], sh3[1], sh3[2]) }, uCwShare: { value: new THREE.Vector3(shw[0], shw[1], shw[2]) } },
      // (near: the two distances between which the mirror glints go out and the shoulder comes down. The ride never brings
      // the eye nearer than 11 m: only the study copy is seen closer.)
      defines: { CW_NEAR0: (o.near0 ?? 6).toFixed(1), CW_NEAR1: (o.near1 ?? 12).toFixed(1), CW_WALL_IN: T.shell.inside.toFixed(2), CW_WALL_OUT: (T.side / 2).toFixed(2), CW_OPEN: T.shell.dial.opening.toFixed(2), CW_CRISP: (o.crisp > 0 ? o.crisp : 1e6).toFixed(1), CW_CRISP_OUT0: ((o.crispTo || [26, 36])[0]).toFixed(1), CW_CRISP_OUT1: ((o.crispTo || [26, 36])[1]).toFixed(1) },
      fragmentPars: base.fragmentPars + ' uniform vec4 uCwRoom, uCwLit, uCwLit2, uCwTone; uniform vec3 uCwShaft, uCwShare; uniform float uCwFar;',
      light: /* glsl */`{
        float cwDist = length(vViewPos), cwNearK = 1.0 - smoothstep(CW_NEAR0, CW_NEAR1, cwDist);
        // the fragment, its normal and the way to the eye in the tower's own frame (x and z along its faces, y from the dials' centres)
        vec2 cwD = vWPos.xz - uCwMid;
        vec3 cwP = vec3(cwD.x * uCwRoom.x - cwD.y * uCwRoom.y, vWPos.y - uCwRoom.z, cwD.x * uCwRoom.y + cwD.y * uCwRoom.x);
        vec3 cwNl = vec3(N.x * uCwRoom.x - N.z * uCwRoom.y, N.y, N.x * uCwRoom.y + N.z * uCwRoom.x);
        vec3 cwVl = vec3(V.x * uCwRoom.x - V.z * uCwRoom.y, V.y, V.x * uCwRoom.y + V.z * uCwRoom.x);
        float cwMet = clamp(vUv0.y, 0.0, 1.0), cwBrass = smoothstep(0.6, 0.95, cwMet), cwSteel = smoothstep(0.3, 0.5, cwMet) * (1.0 - cwBrass);
        float cwDif = 0.0, cwSpec = 0.0;
        for (int cwK = 0; cwK < 4; cwK++) {
          vec3 cwO = cwK == 0 ? vec3(1.0, 0.0, 0.0) : cwK == 1 ? vec3(-1.0, 0.0, 0.0) : cwK == 2 ? vec3(0.0, 0.0, 1.0) : vec3(0.0, 0.0, -1.0);
          float cwIn = dot(cwP, cwO), cwU = cwP.z * cwO.x - cwP.x * cwO.z;         // toward that wall, and along it
          float cwG1 = max(CW_WALL_IN - cwIn, 0.0), cwG2 = max(CW_WALL_OUT - cwIn, 0.0), cwSoft = 0.16 + 0.10 * cwG1;
          for (int cwJ = 0; cwJ < 3; cwJ++) {
            float cwA = cwJ == 0 ? uCwShaft.x : cwJ == 1 ? uCwShaft.y : uCwShaft.z;      // metres outward for a metre down
            float cwW = cwJ == 0 ? uCwShare.x : cwJ == 1 ? uCwShare.y : uCwShare.z;      // and its share of the light
            // back along the light to the wall's inner face and to its outer: is the opening there?
            float cwOpen = (1.0 - smoothstep(CW_OPEN - cwSoft, CW_OPEN + cwSoft, length(vec2(cwU, cwP.y - cwG1 / cwA))))
                         * (1.0 - smoothstep(CW_OPEN - cwSoft, CW_OPEN + cwSoft, length(vec2(cwU, cwP.y - cwG2 / cwA))));
            if (cwOpen > 0.0) {
              vec3 cwL = normalize(cwO * cwA - vec3(0.0, 1.0, 0.0));
              cwDif += max(dot(cwNl, cwL), 0.0) * cwOpen * cwW;
              cwSpec += pow(max(dot(cwNl, normalize(cwL + cwVl)), 0.0), uCwLit.w) * cwOpen * cwW;
            }
          }
        }
        cwDif += max(-N.y, 0.0) * (1.0 - smoothstep(0.7, 1.9, length(cwP.xz))) * uCwLit2.z;      // and straight up through the oculus, on what hangs over it
        // the room's own bounce: what the ceiling and the upper works give back, more of it the higher, most on what looks down
        float cwAmb = uCwTone.z * (0.5 + 0.5 * smoothstep(-2.2, 2.6, cwP.y)) * (0.55 + 0.45 * (0.5 - 0.5 * N.y));
        float cwLum = dot(uCwFrom, vec3(0.3, 0.5, 0.2));
        vec3 cwLight = mix(uCwFrom, cwLum * vec3(1.18, 0.86, 0.50), uCwLit2.x);
        float cwTake = mix(uCwLit.y, 1.0, max(cwBrass, cwSteel * 0.8));
        vec3 cwBody = albedo * cwLight * ((cwDif + cwAmb) * uCwLit.x * cwTake);
        vec3 cwAns = mix(cwLum * vec3(1.0, 0.84, 0.58), cwLum * vec3(0.72, 0.74, 1.0), cwSteel) * mix(albedo * 2.4, vec3(1.0), 0.35);
        cwBody += cwAns * (cwSpec * uCwLit.z * (cwBrass + 0.7 * cwSteel));
        // lit brass is gold and lit steel is cool, whatever the town's coral made of them
        { float cwBl = dot(cwBody, vec3(0.3, 0.5, 0.2));
          cwBody = mix(cwBody, cwBl * vec3(1.49, 0.97, 0.35), uCwTone.w * cwBrass);
          cwBody = mix(cwBody, cwBl * vec3(0.88, 0.92, 1.16), 0.6 * cwSteel); }
        vec3 cwWas = c * uCwRoom.w;                                                 // (what the area's own light gave: the lamp, the lantern, a little from below; it is meant for things in the open air)
        c = cwWas + cwBody;
        // near by, polished metal also shows the lake and the lamps as glints (metal(): see above); they go out with distance
        if (cwNearK > 0.0 && cwMet > 0.01) {
          vec3 cwR = reflect(-V, N);
          float cwDown = 1.0 - smoothstep(-0.62, 0.32, cwR.y), cwAlb = dot(albedo, vec3(0.3, 0.5, 0.2)), cwPol = cwMet * smoothstep(0.02, 0.22, cwAlb);
          vec3 cwTint = albedo * 2.6;
          vec3 cwLake = mix(vec3(cwLum), uCwFrom, 0.4) * (cwDown * cwDown * uCwGilt.x);
          vec3 cwLa = uLampPos - vWPos; float cwLd = length(cwLa); cwLa /= max(cwLd, 1e-3);
          vec3 cwPts = uLampColor * (pow(max(dot(reflect(-cwLa, N), V), 0.0), uCwGilt.z) * (1.0 - smoothstep(uLampRadius * 0.5, uLampRadius * 2.5, cwLd)));
          cwLa = uLanternPos - vWPos; cwLd = length(cwLa); cwLa /= max(cwLd, 1e-3);
          cwPts += uLanternColor * (pow(max(dot(reflect(-cwLa, N), V), 0.0), uCwGilt.z) * (1.0 - smoothstep(uLanternRadius * 0.4, uLanternRadius * 1.4, cwLd)));
          c += (cwTint * cwLake + mix(cwTint, vec3(1.0), 0.45) * cwPts * uCwGilt.y) * (cwPol * cwNearK * uCwLit2.y);
        }
        // far off nothing in the works may bloom (a tooth a pixel wide that blooms is a spark). A shoulder, not a clamp:
        // above the knee the light climbs ever more slowly toward the ceiling and keeps its order
        { float cwKnee = mix(uCwTone.x, 1.6, cwNearK), cwCeil = mix(uCwTone.y, 2.4, cwNearK), cwPk = max(c.r, max(c.g, c.b));
          if (cwPk > cwKnee) c *= (cwKnee + (cwCeil - cwKnee) * (1.0 - exp(-(cwPk - cwKnee) / (cwCeil - cwKnee)))) / cwPk; }
        c = max(c, vec3(0.0085, 0.0048, 0.016));                                   // the page: nothing is darker than night plum, no black
        c = mix(vec3(0.0085, 0.0048, 0.016), c, uCwFar);                           // (they come out of the room's dark as the boat nears: see uFar)
      }`,
      // (the painter's filter leaves them as drawn between `crisp` and `crispTo` metres from the eye, and takes them back
      // beyond: from the square, 36 m off, a tooth is a pixel and a half and the small wheels a dozen, and drawn as cut they
      // were a dotted scribble that crawls as the boat moves; painted, the great wheel is a quiet gold wheel and the rest a
      // soft mass, as a painter would put them in at that size. The picture's alpha carries how much: -15 is the engine's
      // mark for wholly crisp (CRISP_ALPHA), and between 0.5 and -1.05 the filter takes a share: src/engine/post.js)
      final: /* glsl */`{ float cwCd = length(vViewPos), cwCk = smoothstep(CW_CRISP, CW_CRISP + 2.0, cwCd) * (1.0 - smoothstep(CW_CRISP_OUT0, CW_CRISP_OUT1, cwCd));
        if (cwCk > 0.98) gl_FragColor.a = -15.0; else if (cwCk > 0.02) gl_FragColor.a = 0.5 - 1.55 * cwCk; }`,
    };
  };
  // THE BOB'S GILDING (second look). Lit as a mirror of the lake the bob was a second lantern: at arm's length a flat bright disc
  // in a halo of bloom, its beads, rivets, bronze band and verdigris burnt out, three metres from the kept lamp, which is
  // to be the only light above the water. It is gilt, and gilt gives off nothing: it is LIT, from below, by the lake.
  //   - all of what looks down takes the lake's light and half of what stands upright, more the lower on the bob a point
  //     hangs (the water under it is the brightest water): the lens is warm at its foot and bronze-dark at its head;
  //   - gilding answers with a pale sheen where it is turned between the lake and the eye: the undersides of the boss and
  //     the beads, the lower lip of the rim: that is what models it. Bronze worn through and verdigris are dull;
  //   - the rider's lantern and the kept lamp show in it as two small points that cross the lens as it swings;
  //   - nothing of it may bloom but those points: a soft shoulder holds the rest under the picture's white. So it reads
  //     as metal at 4 m, a gold disc at 36 m and a glint at 80 m, and never as a lamp.
  //   o: body (how much of the lake's light), sheen, points and power (the lamps in it), warm (0 the town's orange .. 1
  //   gold), matte (how much of its painted light gilding gives up), cap (where the shoulder begins).
  const gilt = (o) => ({
    uniforms: { uCwFrom: uFrom, uCwBob: { value: new THREE.Vector4(o.body ?? 1.5, o.sheen ?? 0.5, o.points ?? 0.5, o.power ?? 48) }, uCwBob2: { value: new THREE.Vector4(o.warm ?? 0.55, o.matte ?? 0.5, o.cap ?? 0.8, 0) } },
    fragmentPars: 'uniform vec3 uCwFrom; uniform vec4 uCwBob, uCwBob2;',
    light: /* glsl */`{
      float cwG = clamp(vUv0.y, 0.0, 1.0);
      if (cwG > 0.01) {
        float cwDist = length(vViewPos), cwNearK = 1.0 - smoothstep(14.0, 40.0, cwDist);
        float cwLum = dot(uCwFrom, vec3(0.3, 0.5, 0.2));
        vec3 cwLight = mix(uCwFrom, cwLum * vec3(1.18, 0.86, 0.50), uCwBob2.x);
        float cwPol = cwG * smoothstep(0.02, 0.22, dot(albedo, vec3(0.3, 0.5, 0.2)));          // bronze worn through and verdigris are dull
        float cwLow = 0.5;
        #ifdef CW_BOB
          if (vUv0.x > 0.5) cwLow = clamp((CW_BOB + 0.55 - vWPos.y) / 1.1, 0.0, 1.0);          // 0 at the bob's head .. 1 at its foot
        #endif
        float cwFarK = smoothstep(10.0, 30.0, cwDist);                                      // (far off it is a glint: a small disc may be brighter than a broad one at arm's length)
        float cwE = (0.5 - 0.5 * N.y) * (0.30 + 0.70 * cwLow);
        vec3 cwBody = albedo * cwLight * (cwE * uCwBob.x * cwG * (1.0 + 0.9 * cwFarK));
        float cwS = pow(max(dot(N, normalize(V + vec3(0.0, -0.85, 0.0))), 0.0), 9.0);
        cwBody += cwLum * vec3(1.0, 0.86, 0.60) * mix(albedo * 2.2, vec3(1.0), 0.3) * (cwS * uCwBob.y * cwPol * (0.25 + 0.75 * cwNearK));
        vec3 cwL = uLampPos - vWPos; float cwD = length(cwL); cwL /= max(cwD, 1e-3);
        vec3 cwPts = uLampColor * (pow(max(dot(reflect(-cwL, N), V), 0.0), uCwBob.w) * (1.0 - smoothstep(uLampRadius * 0.5, uLampRadius * 2.5, cwD)));
        cwL = uLanternPos - vWPos; cwD = length(cwL); cwL /= max(cwD, 1e-3);
        cwPts += uLanternColor * (pow(max(dot(reflect(-cwL, N), V), 0.0), uCwBob.w) * (1.0 - smoothstep(uLanternRadius * 0.4, uLanternRadius * 1.4, cwD)));
        c = c * (1.0 - uCwBob2.y * cwG) + cwBody;
        // (second look, a third time: far off it was a coin of one orange, for the area's own light lies evenly on it. It is
        // a MOON LIT FROM BELOW: its head sinks to bronze and its lower limb takes the lake's light, the more plainly the
        // smaller it is in the picture)
        #ifdef CW_BOB
          if (vUv0.x > 0.5) c *= mix(1.0, CW_LIMB0 + CW_LIMB1 * cwLow * cwLow, cwFarK);
        #endif
        { float cwPk = max(c.r, max(c.g, c.b)), cwC = uCwBob2.z + 0.4 * cwFarK; if (cwPk > cwC) c *= (cwC + (cwPk - cwC) / (1.0 + (cwPk - cwC) / 0.22)) / cwPk; }      // the shoulder: it never blooms
        c += mix(albedo * 2.6, vec3(1.0), 0.45) * cwPts * (uCwBob.z * cwPol * cwNearK);        // but the lamps in it may
      }
      c = max(c, vec3(0.0085, 0.0048, 0.016));
    }` });
  // THIN THINGS. The painter's filter wipes out what is thinner than its brush: from the church passage the rod is a
  // pixel wide and the bob a dozen. Beyond a distance the pendulum is kept out of the filter (u of its UV: 0 the rod,
  // 1 the bob); near, where it is broad, it is painted like everything else.
  // And far off the bob's own small marks (rivets, beads, the worn band) are smaller than a pixel and would only
  // sparkle: its paint is drawn toward one gilt, so that from the church passage it is a clean disc lit from below.
  // (second look: and the boxed deal section, the nearest thing of the clock the rider ever comes to, was a plain tan bar at
  // 4 m: paint lives on points and a board has few. Its grain is drawn here, in the model's own space so that it swings
  // with the rod: long streaks down the boards from the ride's own dry-brush stroke, the summer wood darker.)
  const thin = { final: /* glsl */`if (length(vViewPos) > (vUv0.x < 0.5 ? CW_THIN_ROD : CW_THIN_BOB)) gl_FragColor.a = -15.0;`,
    vertexPars: 'varying vec3 vCwObj;', vertexLocal: 'vCwObj = position;', fragmentPars: 'varying vec3 vCwObj;',
    albedo: /* glsl */`if (vUv0.x > 0.5) albedo = mix(albedo, vec3(0.50, 0.32, 0.10), 0.85 * smoothstep(16.0, 46.0, length(vViewPos)));
      else if (vUv0.y < 0.05) {
        float cwG1 = texture2D(tBrush, vec2(vCwObj.x * 2.6 + vCwObj.z * 1.9, vCwObj.y * 0.085)).r, cwG2 = texture2D(tBrush, vec2(vCwObj.x * 9.0 - vCwObj.z * 7.0 + 0.37, vCwObj.y * 0.3)).r;
        float cwGrain = clamp((cwG1 - 0.52) * 4.5 + (cwG2 - 0.52) * 2.5, -1.0, 1.0) * (1.0 - smoothstep(9.0, 20.0, length(vViewPos)));
        albedo *= (1.0 + 0.34 * cwGrain) * mix(vec3(1.0), vec3(0.62, 0.55, 0.55), smoothstep(0.15, 0.85, -cwGrain) * 0.6);
      }`,
    defines: { CW_THIN_ROD: num('cwthin', CW.thin ? CW.thin.rod : 11).toFixed(1), CW_THIN_BOB: num('cwthinbob', CW.thin ? CW.thin.bob : 26).toFixed(1) } };
  const underCol = new THREE.Color(plan.chip.roseGold);
  const fillNow = () => {
    const U = light.U || {}, u = U.uTownUnder ? U.uTownUnder.value : { x: 1, y: 0.15 };
    const burn = typeof light.at === 'function' ? light.at(tx, tz) : 1;                           // how brightly the town burns under the tower
    uFrom.value.copy(U.uTownUnderCol ? U.uTownUnderCol.value : underCol).multiplyScalar((u.y + (1 - u.y) * Math.min(1, burn * 1.5)) * u.x);
  };
  const rig = makeRig(mv);
  // (second look, a fourth time: the works are not drawn beyond FAR.works metres of the tower, and at that distance they were a
  // scribble of gold that appeared in the dial from one frame to the next. They now come out of the room's dark over the
  // last twenty metres before that: 0 at FAR.works, 1 twenty metres nearer.)
  const uFar = { value: 1 };
  // (the works' light: plan.clockwork.works gives the mirror glints (lake, points, power), plan.clockwork.room the light that
  // comes up into the room: see works() above.)
  const WORKS = { ...(CW.works || {}), ...(CW.room || {}) };
  if (Q.has('cww')) { const v = Q.get('cww').split(',').map((x) => (x === '' ? NaN : Number(x))); ['fill', 'matte', 'sheen', 'lobe', 'warm', 'glint', 'oculus', 'knee', 'ceil', 'amb', 'gold', 'crisp', 'was', 'lake', 'points', 'power'].forEach((k, i) => { if (isFinite(v[i])) WORKS[k] = v[i]; }); }      // (a developer's switch: &cww=fill,matte,sheen,lobe,warm,glint,oculus,knee,ceil,amb,gold,crisp,was,lake,points,power)
  if (Q.has('cwshafts')) { const v = Q.get('cwshafts').split(',').map(Number); if (v.length >= 3 && v.slice(0, 3).every((x) => isFinite(x) && x > 0)) { WORKS.shafts = v.slice(0, 3); if (v.length === 6 && v.every(isFinite)) WORKS.shares = v.slice(3); } }      // (&cwshafts=steep,middling,shallow[,share,share,share]: metres outward for a metre down, and each slope's share of the light)
  const movement = await kit.model('models/town/clock_movement.glb', { ...place, brush: 0.8, extend: [lightExt(1), rig.extend, works({ ...WORKS, far: uFar })] });
  // Parts turn in the vertex shader, each about a pivot inside the model, so a part never leaves the model's own bounds by
  // more than a hand: a mesh keeps its place in the picture's culling with its sphere a little enlarged (it used to be
  // drawn in every pass whether or not the tower was in sight).
  const roomy = (model, k = 1.12) => model.group.traverse((o) => { if (!o.isMesh) return; o.geometry.computeBoundingSphere(); o.geometry.boundingSphere.radius *= k; o.frustumCulled = true; });
  roomy(movement);
  ctx.only(movement.group, 'direct');                                             // the works are 10 m up inside a dark room: the mirror shows the dial and its dark opening without them
  removeStandIn(ctx, /^clock_movement$/);

  let study = null;
  if (Q.has('cwstudy')) {
    const [deg = 0, ahead = 5, up = -7.3] = (Q.get('cwstudy') || '').split(',').filter((v) => v !== '').map(Number);
    study = { mid: new THREE.Vector2(tx, tz), room: new THREE.Vector4(1, 0, mv.points.dial_front.at[2] + up, 0) };      // (its own middle, turn and height: the light of its room goes with it)
    const copy = await kit.model('models/town/clock_movement.glb', { position: [tx, 0, tz], brush: 0.8, live: true, extend: [lightExt(1), rig.extend, works({ ...WORKS, ...(num('cwstudyfill', 0) ? { fill: (WORKS.fill ?? 1) * num('cwstudyfill', 0) } : {}), mid: study.mid, room: study.room })] });
    copy.group.traverse((o) => { if (o.isMesh) o.frustumCulled = false; });
    study = { ...study, copy, deg, ahead, up, placed: false };
  }

  // ---------------------------------------------------------------------------------------------- the pendulum
  // One rigid thing whose own origin is its pivot: it is turned about it. (Blender's Y is the ride's -Z: a swing toward
  // +X in Blender's front view is a turn of +theta about the model's own Z.)
  const pivot = new THREE.Vector3(mv.points.pendulum_pivot.at[0], mv.points.pendulum_pivot.at[2], -mv.points.pendulum_pivot.at[1]).applyMatrix4(movement.group.matrix);   // (in the realm's own space)
  const GILT = { ...(CW.bob || {}) };
  if (Q.has('cwbob')) { const v = Q.get('cwbob').split(',').map(Number); ['body', 'sheen', 'points', 'power', 'warm', 'matte', 'cap', 'limb0', 'limb1'].forEach((k, i) => { if (isFinite(v[i])) GILT[k] = v[i]; }); }      // (a developer's switch: &cwbob=body,sheen,points,power,warm,matte,cap,limb0,limb1)
  const pendulum = await kit.model('models/town/pendulum.glb', { position: [pivot.x, pivot.y, pivot.z], rotation: [0, ry, 0], live: true, brush: 0.8, extend: [lightExt(1), { ...gilt(GILT), defines: { CW_BOB: (mv.points.pendulum_pivot.at[2] - 8.87).toFixed(3), CW_LIMB0: (GILT.limb0 ?? 0.42).toFixed(3), CW_LIMB1: (GILT.limb1 ?? 1.0).toFixed(3) } }, thin] });
  roomy(pendulum, 1.0);                                                           // (one rigid thing turned about its own origin: its bounds go with it)
  removeStandIn(ctx, /^pendulum (rod|bob)$/);
  const swingPendulum = (theta) => pendulum.set({ position: [pivot.x, pivot.y, pivot.z], rotation: [0, ry, theta] });

  // ---------------------------------------------------------------------------------------------- the kiss
  // At the bottom of each swing the bob's rim is 2 cm under the water: one ring, every three seconds, for as long as
  // the realm runs. (Stage 1 found that a ring of 0.45 does not read: CW.kiss holds what does.)
  const kissFns = [], tickFns = [];
  const SWELL = Q.has('cwswell') ? Q.get('cwswell').split(',').map(Number) : [CW.kiss.swell ?? 0.3, CW.kiss.swellRadius ?? 2.4];      // (a developer's switch: &cwswell=strength,radius; 0: none)
  const kissAt = new THREE.Vector3(pivot.x, 0, pivot.z);
  esc.onPass((dir) => {
    if (hold != null) return;
    if (num('cwkiss', 1) !== 0) {
      ctx.water.ripple(kissAt.x, kissAt.z, CW.kiss.strength, CW.kiss.radius);
      // (second look, second time) and a broad low swell with it: the sharp ring is a train of short ripples that the
      // water's own law carries a few metres and no further; a broad dent sends one long low ring that travels at the pace
      // the drawn ring does (below), reaches the hull under the clock and sets the tower's own image trembling as it goes
      if (SWELL[0] > 0) ctx.water.ripple(kissAt.x, kissAt.z, SWELL[0], SWELL[1]);
    }
    for (const fn of kissFns) fn(kissAt.x, kissAt.z, dir);
  });
  // THE KISS SEEN. The ring is written and the water leans with it, but on a mirror of dark sky a ring has nothing to
  // show: from the approach the tower's reflection wavered and no circle left the bob (the first builder, and the director
  // after him: "the pendulum's ring does not read"). What a ring near the tower CAN show is the tower: its lit foot and the
  // gilt bob hang right over that water, and the kept lamp burns three metres off. So the ring carries a fine line of that
  // warm light (the key painting's rings round the tower).
  // (Second look: the line was drawn on the crest of every ripple of the living water within 8.5 m. Second look, second
  // time: those ripples are a metre and a half apart, and from the square (36 m off, an eye 1.1 m up) one pixel covers more
  // than a metre of water toward the tower: they could only be beads, and from there no circle was seen, which is the
  // view of the key painting. And at 4 m they were chalk hairlines of one even width, three to a kiss. Now there is ONE
  // ring to a kiss, as a painter would draw it: it leaves the bob's rim at the kiss and widens steadily at the pace of
  // the long swell the kiss sends out (KISS.speed: the two travel together), a fine line of the tower's light, never
  // thinner than the screen can draw, a little out of true and running in beads as the wavelets take it, paler and
  // softer as it ages, and gone by fifteen metres. Four or five are on the water at once: from the square they are the
  // fine ellipses round the tower's foot; under the clock they pass the hull. When the square sleeps they are lit by
  // the kept lamp alone: fewer, amber, near the pier: "the pendulum still ringing the water".)
  // One sheet on the water round the kiss, after the water, direct view only.
  let kissLight = null;
  const uKissAge = { value: 0 };                                                 // seconds since the last kiss, now
  { const sh = ctx.engine.shared, K = { reach: 13, strength: 3.2, speed: 1.2, life: 9, width: 0.006, lamp: 0.5, ...(CW.kissLight || {}) };
    if (Q.has('cwring')) { const v = Q.get('cwring').split(',').map(Number); ['strength', 'reach', 'speed', 'life', 'width', 'lamp'].forEach((k, i) => { if (isFinite(v[i])) K[k] = v[i]; }); }      // (a developer's switch: &cwring=strength,reach,speed,life,width,lamp; &cwring=0 none)
    if (K.strength > 0) {
      const geo = new THREE.CircleGeometry(K.reach * 1.9, 48); geo.rotateX(-Math.PI / 2);
      const lp = shared.lamp && shared.lamp.position ? shared.lamp.position : null;
      const mat = new THREE.ShaderMaterial({
        uniforms: { uTime: sh.uTime, uCameraPos: sh.uCameraPos, uFogDensity: sh.uFogDensity, uVeil: sh.uVeil, uCwFrom: uFrom, uCwAge: uKissAge,
          uCwKiss: { value: new THREE.Vector4(pivot.x, pivot.z, K.speed, 0.5) }, uCwKissK: { value: new THREE.Vector4(K.strength, K.reach, K.width, 0) },
          uCwKissL: { value: new THREE.Vector4(lp ? lp.x : pivot.x, lp ? lp.z : pivot.z, K.lamp, K.life) }, uCwLampCol: { value: new THREE.Color('#FFB45E') } },
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
        vertexShader: /* glsl */`varying vec3 vW; void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
        fragmentShader: /* glsl */`${NOISE_GLSL}
          uniform vec4 uCwKiss, uCwKissK, uCwKissL; uniform vec3 uCameraPos, uCwFrom, uCwLampCol; uniform float uFogDensity, uVeil, uCwAge, uTime; varying vec3 vW;
          void main() {
            if (uCwKissK.w > 0.5) discard;                                           // (not in the picture the water reads as what lies beneath)
            vec2 p = vW.xz - uCwKiss.xy; float r = length(p), d = distance(uCameraPos, vW);
            float fw = max(fwidth(r), 1e-4), ang = atan(p.y, p.x), sum = 0.0;
            for (int k = 0; k < 6; k++) {
              float age = uCwAge + 3.0 * float(k), R = uCwKiss.w + uCwKiss.z * age, fk = float(k);
              // a little out of true, more as it ages (the water it crosses is not glass); the same ring keeps its own shape
              float id = floor((uTime - age) / 3.0 + 0.5);
              R += (vnoise(vec2(ang * 2.2 + id * 7.31, age * 0.12 + id)) - 0.5) * 0.06 * age + (vnoise(vec2(ang * 9.0 + id * 2.9, age * 0.3)) - 0.5) * 0.012 * age;
              float w = max(uCwKissK.z * (1.0 + 0.5 * age), 0.62 * fw), dr = (r - R) / w;
              float line = exp(-dr * dr);
              // it runs in beads that come and go, more broken the older it is
              float bead = mix(1.0, smoothstep(0.24, 0.66, vnoise(vec2(ang * R * 1.4 + id * 3.7, uTime * 0.35 + id * 5.1))) * (0.55 + 0.45 * vnoise(vec2(ang * R * 5.5 - id, uTime * 0.8))), min(0.45 + 0.07 * age, 0.88));
              sum += line * bead * exp(-age / uCwKissL.w) * smoothstep(0.0, 0.25, age) / sqrt(max(R, 0.5) * 2.0);
            }
            sum *= smoothstep(0.42, 0.62, r);                                        // (none under the bob itself: its own rim is there)
            float under = exp(-r * r / (uCwKissK.y * uCwKissK.y));                   // the tower's light on the water fails with distance from it
            float lampD = distance(vW.xz, uCwKissL.xy), lamp = uCwKissL.z * exp(-lampD * lampD / 36.0);
            float lum = dot(uCwFrom, vec3(0.3, 0.5, 0.2));
            vec3 col = mix(uCwFrom, lum * vec3(1.12, 0.80, 0.50), 0.55) * under + uCwLampCol * lamp;
            float a = sum * exp(-uFogDensity * uFogDensity * d * d) * (1.0 - uVeil) * (1.0 - smoothstep(70.0, 110.0, d));
            if (a < 0.002) discard;
            // (a hair's breadth of line far off must be brighter than a broad one at arm's length to be seen at all; and no
            // ring is ever white: a shoulder holds it under the picture's own)
            a *= uCwKissK.x * mix(0.45, 1.0, smoothstep(4.0, 26.0, d)); a = a / (1.0 + 0.5 * a);
            gl_FragColor = vec4(col * a, 1.0);
          }`,
      });
      const mesh = new THREE.Mesh(geo, mat); mesh.position.set(pivot.x, 0.012, pivot.z); mesh.renderOrder = 2; mesh.name = 'pendulum-kiss-light';
      mesh.updateMatrix(); mesh.matrixAutoUpdate = false;
      mesh.onBeforeRender = (renderer) => { mat.uniforms.uCwKissK.value.w = renderer.getRenderTarget() === ctx.engine.pre ? 1 : 0; mat.uniformsNeedUpdate = true; };
      ctx.add(mesh); ctx.only(mesh, 'direct');
      kissLight = mesh;
    } }
  // the tick: a tooth of the escape wheel lands on a pallet (twice a swing, 0.9 s after each kiss)
  const tickU = E.ticks.map((t) => t[0]); let lastTick = Math.floor(now() / PERIOD + u0 - tickU[0]) + Math.floor(now() / PERIOD + u0 - tickU[1]);

  // ---------------------------------------------------------------------------------------------- the hour ring
  let ring = null, ringRig = null, ringSpec = null;
  try {
    ringSpec = await sidecar('hour_ring');
    ringRig = makeRig(ringSpec);
    const G = ringSpec.light, SH = ringSpec.shadow, wakeHere = `townWake(${T.s.toFixed(1)}, vWPos.xz, -1.0, 0.9)`;
    // the lanterns give off light (v of the UV says how much of it a vertex carries: all of it on the glass, a little on
    // the iron beside it), and wake and sleep with the square: the hour ring's lanterns are the last to go out
    // (the light is the glass's own painted colour, not what the water's hue has made of it)
    const RING = { glass: G.gain, halo: G.halo, pool: G.pool, ...(CW.ring || {}) };      // (plan.clockwork.ring; &cwgain=, &cwhalo=, &cwpool= try others)
    if (Q.has('cwlook')) { const v = Q.get('cwlook').split(',').map(Number); ['tight', 'soft', 'shade', 'iron', 'heart', 'skirt', 'band', 'flags', 'wall', 'take', 'takeWall', 'core'].forEach((k, i) => { if (isFinite(v[i])) RING[k] = v[i]; }); }      // (a developer's switch: &cwlook=tight,soft,shade,iron,heart,skirt,band,flags,wall,take,takeWall,core)
    const dfn = (v) => Number(v).toFixed(4);
    const uRing = { value: new THREE.Vector4(0, 1, 0, 0) };                        // x: where lantern 0 stands now (its angle round the tower's axis, in the realm), y: +1 or -1, the way the lanterns are numbered round it
    const uAxis = { value: new THREE.Vector4(tx, tz, ringSpec.paving, 0) };
    const uWarm = { value: new THREE.Color(...(RING.warm || [1.0, 0.42, 0.12])) }, uJade = { value: new THREE.Color(...(RING.jade || [0.12, 0.62, 0.44])) };
    const LANT_DEFS = { CW_LANT_R: dfn(SH.lantern_r), CW_LANT_H: dfn(SH.lantern_h), CW_PLANE: dfn(SH.plane), CW_JADE: dfn(ringSpec.jade) };
    // THE WHEEL IS LIT BY ITS OWN LANTERNS (second look, second time). It was a dark outline on a lit floor, and nothing
    // said that the lights it carries hang over it: the hoops, the spokes and the standards now take the light of the three
    // nearest lanterns from above (by the angle it falls at, failing with the square of the distance), so the iron is warm
    // on its upper faces under each lantern and fails into the dark between two of them: the wheel is drawn by its own
    // lights, from lantern to lantern, and its turning is the turning of that light. (The glass itself gives off its own.)
    // THE LANTERN ITSELF (second look, a third time). It is never seen from nearer than twenty metres, and from straight
    // above: there it was a pale speck blotched with the dark of its own crown and bars. A lantern seen from far is a hot
    // heart in a body of colour: so everything within a lantern (glass, bars, crown, base alike) gives off its glass's
    // colour, most at its own axis (`core` times as much: the flame, which the picture turns pale gold) and plainly orange
    // (or jade) at its six corners, where the picture keeps the colour. No dark part is left in it to speckle.
    const uLant = { value: new THREE.Vector4(RING.core ?? 2.6, 0, 0, 0) }, uLantCol = { value: new THREE.Color(G.glass || '#F0843E') }, uLantJade = { value: new THREE.Color(G.jade_glass || '#3FB094') };
    const glow = { uniforms: { uCwGlow: { value: num('cwgain', RING.glass) }, uCwRing: uRing, uCwAxis: uAxis, uCwGlass: uWarm, uCwJade: uJade, uCwIron: { value: RING.iron ?? 2.4 }, uCwLant: uLant, uCwLantCol: uLantCol, uCwLantJade: uLantJade },
      defines: LANT_DEFS, fragmentPars: 'uniform float uCwGlow, uCwIron; uniform vec4 uCwRing, uCwAxis, uCwLant; uniform vec3 uCwGlass, uCwJade, uCwLantCol, uCwLantJade;',
      light: /* glsl */`{
        float cwWake = ${wakeHere};
        vec2 cwP = vWPos.xz - uCwAxis.xy; float cwY = vWPos.y - uCwAxis.z;
        float cwK = floor((atan(cwP.y, cwP.x) - uCwRing.x) * uCwRing.y / 0.5236 + 0.5);
        if (vUv0.y < 0.9) {                                                        // (all the iron: the wheel, the crown wheel on the tower's wall, the rollers; not the glass)
          vec3 cwSum = vec3(0.0);
          for (int cwJ = -1; cwJ <= 1; cwJ++) {
            float cwN = cwK + float(cwJ), cwA = uCwRing.x + cwN * 0.5236 * uCwRing.y;
            vec3 cwV = vec3(CW_LANT_R * cos(cwA) - cwP.x, CW_LANT_H - cwY, CW_LANT_R * sin(cwA) - cwP.y);
            float cwD2 = dot(cwV, cwV) + 0.10;
            float cwI = (max(dot(N, cwV) / sqrt(cwD2), 0.0) * 0.85 + 0.15) * min(pow(3.24 / cwD2, 1.5), 1.6);
            cwSum += (abs(mod(cwN, 12.0) - CW_JADE) < 0.5 ? uCwJade : uCwGlass) * cwI;
          }
          c += cwSum * ((dot(vColor.rgb, vec3(0.3, 0.5, 0.2)) + 0.03) * uCwIron * cwWake);
        }
        // within a lantern: from its own axis outward, and from its middle up and down
        float cwA0 = uCwRing.x + cwK * 0.5236 * uCwRing.y, cwRa = distance(cwP, CW_LANT_R * vec2(cos(cwA0), sin(cwA0))), cwDy = cwY - CW_LANT_H;
        float cwIn = (1.0 - smoothstep(0.36, 0.44, cwRa)) * (1.0 - smoothstep(0.42, 0.52, abs(cwDy))) * step(0.5, vUv0.x) * (1.0 - step(1.5, vUv0.x));
        vec3 cwBody = abs(mod(cwK, 12.0) - CW_JADE) < 0.5 ? uCwLantJade : uCwLantCol;
        vec3 cwGive = mix(vColor.rgb * vUv0.y, cwBody * mix(uCwLant.x, 1.0, smoothstep(0.05, 0.25, cwRa)) * mix(0.8, 1.0, step(0.9, vUv0.y)), cwIn);
        glow += cwGive * (uCwGlow * cwWake);
      }` };
    // under the water, added to the picture, swallowed by the water between like everything else: the last word of both lights below
    const through = `{ float wD = max(-vWPos.y, 0.0), wpath = length(vViewPos) * wD / (max(uCameraPos.y, 0.05) + wD); gl_FragColor = vec4(c * (1.0 - fog) * exp(-uTownWater.w * wpath * uTownWater.x), 1.0); }`;
    // the light in the water round each lantern: a ball of it, fading to its rim, riding with the ring
    // (second look: the whole of it is the glass's own colour, a deep orange or the one jade. Second look, second time: it
    // still had a hot heart (a third of it within a hand of the lantern), which with the glass behind it burnt each lantern
    // to a pale blob that could not be told from a street lamp. The lantern is the thing: an orange hexagon on its crook,
    // seen as that from the boat. The halo is the water round it catching its light: broad, soft, strongest in a wide
    // heart (`heart`) that never hides the glass, with a long skirt (`skirt`) out to the ball's rim.)
    const halo = { uniforms: { ...light.U, uCwGlow: { value: num('cwhalo', RING.halo) }, uCwHalo: { value: new THREE.Vector2(RING.heart ?? 0.3, RING.skirt ?? 0.25) } }, fragmentPars: light.GLSL + 'uniform float uCwGlow; uniform vec4 uTownWater; uniform vec2 uCwHalo;',
      light: `{ float cwNV = abs(dot(N, V));
        vec3 cwHue = vColor.r > vColor.g ? vec3(1.0, 0.36, 0.09) : vColor.rgb / max(vColor.g, 1e-3) * vec3(0.9, 0.86, 0.9);      // fire, or the one jade
        c = vec3(0.0); glow = cwHue * (${wakeHere} * uCwGlow * (uCwHalo.y * pow(cwNV, 3.0) + uCwHalo.x * pow(cwNV, 8.0))); }`, final: through };
    ring = await kit.model('models/town/hour_ring.glb', { ...place, brush: 0.8, extend: [lightExt(1), ringRig.extend, glow],
      materials: { halo: { extend: [ringRig.extend, halo], brush: 0, shade: 0, transparent: true } } });
    roomy(ring, 1.06);
    ring.group.traverse((o) => { if (!o.isMesh) return;
      if (o.material === ring.materials.halo) { o.material.blending = THREE.AdditiveBlending; o.material.depthWrite = false; o.renderOrder = -2; } });

    // THE LANTERNS' LIGHT ON THE STONE, AND THE WHEEL'S SHADOW IN IT. Twelve lanterns go round 2.9 m above the paving, and
    // between them and the paving turns the wheel that carries them: its two hoops, its twenty-four spokes, the collar, the
    // plate under every lantern. So each lantern lays a pool of light on the flags with the wheel's own shadow in it, and
    // the pools go round with the ring. Nothing of this is a picture: for every point of the stone the light of the three
    // nearest lanterns is worked out and the ray to each lantern is followed up to the plane of the wheel to see what it
    // meets there. One flat ring on the paving carries it; it is added to the picture, under the water.
    // (Second look, second time. As from bare points in clear air the twelve pools ran together into one sand-orange disc
    // with a hard edge, on which the wheel's shadow was a second, larger wheel drawn in pen; and a band of even light cannot
    // be seen to turn. A lantern under water lights what is near it: each pool is now TIGHT (`tight`: the light fails with
    // a higher power of the distance than the square, as it does through water that swallows it), so twelve pools stand
    // apart on dark stone, hot at the heart and a deeper orange at the rim, and they are seen to go round; and a lantern
    // half a metre across throws SOFT shadows (`soft`: a spoke's is a blur, a hoop's a band, the plate's a dark heart
    // inboard of the lantern's foot), of a depth `shade` that leaves the stone some light under them.)
    // (Second look, a third time. The water had been deepened since, and the wheel had sunk into it: a faint arc with a few
    // specks on it, dimmer than the square's street lamps beside it. What the eye can hold of a thing 21 m down is LIGHT ON
    // STONE, in area: so
    //   - each pool has a hot tight heart AND a broad low skirt (`skirt`): the hearts stand apart and are seen to go round, the
    //     skirts run together into one warm band under the whole wheel, and against that band the hoops, the spokes and the
    //     collar are a dark iron wheel: the thing itself, read at once from the boat;
    //   - lit stone is STONE: the pools show the square's own flags, their joints, the rail the wheel rides on and the twelve
    //     pale hour stones, drawn here by the lake bed's own rule (set.js: rings of flags 2.2 m deep round the tower's axis)
    //     so that they lie exactly on the bed's: firelight on paving, not a sheet of colour;
    //   - the tower's foot takes the light again (four sheets a hand off its faces, as the first second look had them, but
    //     soft and with no shadow drawn): a glow opposite each lantern climbs the lowest courses and glides along the wall as
    //     the wheel turns: it is what joins the wheel to the tower when the rider looks down the wall;
    //   - nothing ends in an edge: the light fails to nothing a metre inside the sheet's rim.)
    const poolExt = {
      uniforms: { ...light.U, uCwRing: uRing, uCwAxis: uAxis, uCwPool: { value: num('cwpool', RING.pool) },
        // what the lantern's light does to stone that the water's own light already shows: where the light falls, most of
        // what the water's light showed there is taken away (`take`; less of it on the wall, whose own courses show through)
        // and the lantern's own put in its place, so lit stone is the lantern's colour and its shadows are the square's own
        // dark teal, and the two never mix to sand.
        uCwGlass: uWarm, uCwJade: uJade, uCwHot: { value: new THREE.Color(...(RING.hot || [1.0, 0.50, 0.18])) }, uCwTake: { value: new THREE.Vector2(RING.take ?? 0.6, RING.takeWall ?? 0.4) },
        uCwShape: { value: new THREE.Vector4(RING.tight ?? 3.0, RING.soft ?? 0.10, RING.shade ?? 0.8, RING.band ?? 0.2) },
        uCwStone: { value: new THREE.Vector4(yaw, T.hourRing.radius - 0.4, RING.flags ?? 1.0, RING.wall ?? 1.0) } },
      defines: { ...LANT_DEFS, CW_HOOP_IN: dfn(SH.hoops[0]), CW_HOOP_OUT: dfn(SH.hoops[1]), CW_HOOP_W: dfn(SH.hoop_w),
        CW_SPOKE_W: dfn(SH.spoke_w), CW_COLLAR: dfn(SH.collar), CW_COLLAR_W: dfn(SH.collar_w), CW_PLATE_IN: dfn(SH.plate[0]), CW_PLATE_OUT: dfn(SH.plate[1]), CW_PLATE_W: dfn(SH.plate[2]) },
      fragmentPars: light.GLSL + /* glsl */`
        uniform vec4 uCwRing, uCwAxis, uTownWater, uCwShape, uCwStone; uniform float uCwPool; uniform vec2 uCwTake; uniform vec3 uCwGlass, uCwJade, uCwHot;
        // what of a lantern's light reaches the stone through the wheel: q is where the ray crosses the wheel's plane
        // (from the tower's axis), spread how far the stone is from the point under the lantern (the shadow's edge softens with it)
        float cwClear(vec2 q, float spread) {
          float rq = length(q), aq = (atan(q.y, q.x) - uCwRing.x) * uCwRing.y, soft = uCwShape.y + 0.04 * spread;
          float d = min(abs(rq - CW_HOOP_IN), abs(rq - CW_HOOP_OUT)) - CW_HOOP_W * 0.5;                           // the two hoops
          d = min(d, abs(rq - CW_COLLAR) - CW_COLLAR_W * 0.5);                                                    // the collar
          float sp = abs(mod(aq + 0.1309, 0.2618) - 0.1309) * rq - CW_SPOKE_W * 0.5;                              // a spoke every fifteen degrees
          d = min(d, max(sp, max(CW_COLLAR - rq, rq - CW_HOOP_OUT)));
          float pl = abs(mod(aq + 0.2618, 0.5236) - 0.2618) * rq - CW_PLATE_W * 0.5;                              // the plate under every lantern
          d = min(d, max(pl, max(CW_PLATE_IN - rq, rq - CW_PLATE_OUT)));
          return smoothstep(-soft, soft, d);
        }
        // the square's flags as the lake bed draws them (the same rule and the same numbers as set.js, so that these lie on
        // those): rings of flags round the tower's axis breaking joint, each flag its own value; the rail; the hour stones
        float cwHash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
        float cwFlags(vec2 q) {
          float px = max(length(dFdx(q)), length(dFdy(q))), soft = max(px, 0.02), hold = 1.0 - smoothstep(0.12, 0.4, px);
          float r = length(q), rg = floor(r / 2.2), n = max(8.0, floor(6.2832 * (rg + 0.5) * 2.2 / 1.7));
          float a = (atan(q.y, q.x) + uCwStone.x) / 6.2832 * n + 0.5 * mod(rg, 2.0), sec = floor(a);
          float dr = min(fract(r / 2.2), 1.0 - fract(r / 2.2)) * 2.2, da = min(fract(a), 1.0 - fract(a)) * 6.2832 / n * r;
          float joint = 1.0 - smoothstep(0.03 - soft, 0.03 + soft, min(dr, da));
          float tone = mix(1.0, 0.86 + 0.28 * cwHash(vec2(rg, sec)), hold);
          float rail = 1.0 - smoothstep(0.11 - soft, 0.11 + soft, abs(r - uCwStone.y));
          float hour = fract((atan(q.y, q.x) + uCwStone.x) / 6.2832 * 12.0);
          float stone = (1.0 - smoothstep(0.32, 0.36, abs(r - (uCwStone.y + 1.9)))) * (1.0 - smoothstep(0.42, 0.46, min(hour, 1.0 - hour) / 12.0 * 6.2832 * r));
          tone = mix(tone, 1.5, stone * (0.5 + 0.5 * hold)); tone = mix(tone, 0.42, rail);
          return tone * (1.0 - 0.5 * joint * hold);
        }
        // the foot's ashlar in that light (u along a face, y above the paving): a base course of half a metre, then courses
        // 0.72 m deep of blocks a metre and a quarter to a metre and three quarters long, breaking joint, each its own value
        float cwAshlar(float u, float y) {
          float px = max(length(vec2(dFdx(u), dFdy(u))), length(vec2(dFdx(y), dFdy(y)))), soft = max(px, 0.02), hold = 1.0 - smoothstep(0.12, 0.4, px);
          float crs = y < 0.5 ? -1.0 : floor((y - 0.5) / 0.72), y0 = y < 0.5 ? 0.0 : 0.5 + crs * 0.72, h = y < 0.5 ? 0.5 : 0.72;
          float len = 1.25 + 0.5 * cwHash(vec2(crs, 3.7)), x = u / len + 0.5 * mod(crs, 2.0) + cwHash(vec2(crs, 9.1));
          float dj = min(min(fract(x), 1.0 - fract(x)) * len, min(y - y0, y0 + h - y));
          float joint = 1.0 - smoothstep(0.03 - soft, 0.03 + soft, dj);
          return mix(1.0, 0.82 + 0.36 * cwHash(vec2(floor(x) + 17.0 * crs, crs)), hold) * (1.0 - 0.55 * joint * hold);
        }`,
      light: /* glsl */`{
        vec2 cwP = vWPos.xz - uCwAxis.xy; float cwY = vWPos.y - uCwAxis.z;        // from the foot of the tower's axis; above the paving
        float cwFloor = step(0.5, abs(N.y));                                        // 1 on the paving, 0 on the tower's wall
        float cwK = floor((atan(cwP.y, cwP.x) - uCwRing.x) * uCwRing.y / 0.5236 + 0.5);
        vec3 cwSum = vec3(0.0);
        for (int cwJ = -1; cwJ <= 1; cwJ++) {
          float cwN = cwK + float(cwJ), cwA = uCwRing.x + cwN * 0.5236 * uCwRing.y;
          vec2 cwL = CW_LANT_R * vec2(cos(cwA), sin(cwA));
          vec3 cwV = vec3(cwL.x - cwP.x, CW_LANT_H - cwY, cwL.y - cwP.y);
          float cwD2 = dot(cwV, cwV), cwQ = CW_LANT_H * CW_LANT_H / cwD2, cwCos = max(dot(N, cwV), 0.0) / sqrt(cwD2), cwI;
          if (cwFloor > 0.5) {
            cwI = cwCos * (pow(cwQ, uCwShape.x) + uCwShape.w * cwQ);               // the tight heart, and the broad skirt
            float cwT = (CW_PLANE - cwY) / max(CW_LANT_H - cwY, 0.05);
            if (cwT > 0.0 && cwT < 1.0) cwI *= mix(1.0, cwClear(cwP + (cwL - cwP) * cwT, length(cwL - cwP) * (1.0 - cwT)), uCwShape.z);
          } else cwI = cwCos * cwQ * uCwStone.w;                                    // the wall: soft, no shadow drawn
          cwSum += (abs(mod(cwN, 12.0) - CW_JADE) < 0.5 ? uCwJade : mix(uCwGlass, uCwHot, smoothstep(0.25, 0.95, cwI))) * cwI;
        }
        if (cwFloor > 0.5) cwSum *= (1.0 + (cwFlags(cwP) - 1.0) * uCwStone.z) * (1.0 - smoothstep(11.0, 13.6, length(cwP)));
        else cwSum *= (1.0 + (cwAshlar(cwP.y * N.x - cwP.x * N.z, cwY) - 1.0) * uCwStone.z) * (1.0 - smoothstep(0.4, 3.4, cwY)) * (1.0 + 0.6 * exp(-cwY / 0.7));      // (strongest at the foot, where the lit flags give it back, and gone by the sill of the lowest slit)
        c = vec3(0.0); glow = cwSum * (uCwPool * ${wakeHere});
      }`,
      // (the last word: what the stone is multiplied by. 1 where no lantern reaches; the water between takes its share)
      final: `{ float wD = max(-vWPos.y, 0.0), wpath = length(vViewPos) * wD / (max(uCameraPos.y, 0.05) + wD);
        float cwThr = (1.0 - fog) * exp(-uTownWater.w * wpath * uTownWater.x * 0.6), cwM = clamp(max(glow.r, max(glow.g, glow.b)) * 2.2, 0.0, 1.0);
        gl_FragColor = vec4(glow * cwThr, 1.0 - mix(uCwTake.y, uCwTake.x, step(0.5, abs(N.y))) * cwM * cwThr); }` };      // rgb: the light put in; alpha: how much of what was there is left
    // (the sheet lies a hand above the paving: over the kit's rail, its radial joints and its hour stones, which stood proud of
    // it at first and stayed unlit: black marks on a lit floor)
    { const y0 = ringSpec.paving + 0.11, r0 = 3.6, r1 = 14.0, NS = 72, pos = [], nor = [], idx = [];
      for (let i = 0; i <= NS; i++) { const a = i / NS * TAU, cs = Math.cos(a), sn = Math.sin(a); pos.push(r0 * cs, y0, r0 * sn, r1 * cs, y0, r1 * sn); nor.push(0, 1, 0, 0, 1, 0); }
      for (let i = 0; i < NS; i++) { const k = i * 2; idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); }
      { const W = T.side / 2 + 0.13, wy0 = ringSpec.paving + 0.05, wy1 = ringSpec.paving + 3.5;      // the four faces of the foot: a sheet a hand's breadth off each, to the sill of the lowest slit
        for (let f = 0; f < 4; f++) {
          const a = f * Math.PI / 2, nx = Math.round(Math.cos(a)), nz = Math.round(Math.sin(a)), ux = -nz, uz = nx;
          // (the up-route face, +z in the tower's own frame, has the door in its middle: its sheet is in two, either side of it)
          for (const [u0, u1] of (f === 1 ? [[-W, -1.12], [1.12, W]] : [[-W, W]])) {
            const b = pos.length / 3;
            for (const [u, y] of [[u0, wy0], [u1, wy0], [u1, wy1], [u0, wy1]]) { pos.push(nx * W + ux * u, y, nz * W + uz * u); nor.push(nx, 0, nz); }
            idx.push(b, b + 2, b + 1, b, b + 3, b + 2);
          }
        } }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); geo.setIndex(idx);
      const mat = kit.gouache({ color: '#ffffff', brush: 0, shade: 0, transparent: true, side: THREE.DoubleSide, extend: [poolExt] });
      mat.blending = THREE.CustomBlending; mat.blendEquation = THREE.AddEquation; mat.blendSrc = THREE.OneFactor; mat.blendDst = THREE.SrcAlphaFactor;      // the light, plus what is left of what was there
      mat.blendSrcAlpha = THREE.ZeroFactor; mat.blendDstAlpha = THREE.OneFactor; mat.depthWrite = false;
      const pool = new THREE.Mesh(geo, mat); pool.name = 'hour-ring-light'; pool.position.set(tx, 0, tz); pool.rotation.y = ry; pool.renderOrder = -2;
      pool.updateMatrix(); pool.matrixAutoUpdate = false;
      ctx.add(pool); ctx.only(pool, 'direct');
      ring.pool = pool; ring.uRing = uRing; }
    ctx.only(ring.group, 'direct');                                               // wholly under the water: not in the mirror
    removeStandIn(ctx, /^hour_ring$/);
    // the stand-in's twelve lanterns and their posts were put into the tower modeller's batches of stand-ins: take just
    // those out (a batch has no names of its own), so that no still lanterns stand in the turning ring
    const want = [];
    for (let i = 0; i < T.hourRing.lanterns; i++) { const a = i / 12 * TAU, c = Math.cos(yaw), s = Math.sin(yaw), ls = Math.cos(a) * T.hourRing.radius, ld = Math.sin(a) * T.hourRing.radius; want.push([tx + ls * c + ld * s, tz - ls * s + ld * c]); }
    const M4 = new THREE.Matrix4(), p3 = new THREE.Vector3(), q4 = new THREE.Quaternion(), s3 = new THREE.Vector3(); let gone = 0;
    ctx.group.traverse((o) => {
      if (!o.isInstancedMesh || !o.name.startsWith('standins:box')) return;
      let hit = false;
      for (let i = 0; i < o.count; i++) {
        o.getMatrixAt(i, M4); M4.decompose(p3, q4, s3);
        if (p3.y > T.hourRing.y - 0.2 && p3.y < T.hourRing.y + T.hourRing.standard && s3.x <= 0.51 && want.some((w) => Math.hypot(w[0] - p3.x, w[1] - p3.z) < 0.05)) { M4.makeScale(0, 0, 0); o.setMatrixAt(i, M4); hit = true; gone++; }
      }
      if (hit) o.instanceMatrix.needsUpdate = true;
    });
    ctx.state.clockworkStandInsGone = gone;
  } catch (err) {
    console.error(`INVALID_MODEL town/heroes_clock: the hour ring is left out (${(err && err.message) || err})`);
  }

  // ---------------------------------------------------------------------------------------------- every frame
  // the angle round the tower's axis (in the realm, from +x toward +z) at which lantern i of the ring stands now
  const ringAngle = (i) => { const p = ringSpec.points[`lantern${i}`]; tmp.set(p.at[0], p.at[2], -p.at[1]); ringRig.apply(p.on || 0, tmp); tmp.applyMatrix4(ring.group.matrix); return Math.atan2(tmp.z - tz, tmp.x - tx); };
  let lastSkim = -1, lastFurrow = -1, fan = null;
  const SPIN = num('cwspin', 0), FAN_K = num('cwfank', 0.28);                     // (&cwfank=: how strong each of the fan's four shells is. It was 0.17: in the works' new, quieter light that was a grey breath)
  const FAR = { works: num('cwfar', 105), ring: num('cwfarring', 82) };           // metres from the tower's axis
  const update = (dt) => {
    const t = now();
    if (SPIN && dt > 0 && hold == null) strike.fly += SPIN * dt;                    // (a developer's switch, &cwspin=<turns a second>: the striking train running, to look at)
    if (fan) {                                                                    // how fast the fly is turning now (turns a second), eased; the fan it makes
      const r = dt > 1e-4 ? Math.abs(strike.fly - fan.last) / dt : 0; fan.last = strike.fly;
      fan.rate += (Math.min(r, 6) - fan.rate) * Math.min(1, (dt || 0) * 6);
      const k = num('cwfan', Math.min(1, Math.max(0, (fan.rate - 0.9) / 1.6)));
      fan.drum.visible = k > 0.01 && movement.group.visible; fan.drum.material.uniforms.uOpacity.value = FAN_K * k * k * (3 - 2 * k);
    }
    { const u = t / PERIOD + u0; uKissAge.value = (u * 2 - Math.floor(u * 2)) * (PERIOD / 2); }      // the bob is at the bottom of its swing whenever u is a whole or a half
    const theta = swingAt(t), going = goingAt(t), ringPhase = hold != null ? TAU * (t / mv.trains.ring.period + CW.ringPhase) : ringTrain.angle, flyRad = strike.fly * TAU;
    const lever = leverAt(flyRad), wire = mv.strike.wire_arm * (Math.sin(mv.strike.wire_rest + lever) - Math.sin(mv.strike.wire_rest));
    const phase = { swing: theta, going, ring: ringPhase, strike: flyRad, lever, wire };
    fillNow();
    for (const m of mv.members) rig.set(m.name, m.k * phase[m.train] + (extra[m.name] || 0));
    swingPendulum(theta);
    if (ringRig) for (const m of ringSpec.members) ringRig.set(m.name, m.k * ringPhase + (extra[m.name] || 0));
    if (ring && ring.uRing) {                                                     // where lantern 0 stands now, and which way the others follow it round: the light on the stone goes by it
      const a0 = ringAngle(0), d = ringAngle(1) - a0;
      ring.uRing.value.x = a0; ring.uRing.value.y = Math.sin(d) >= 0 ? 1 : -1;
    }
    // while the rim is under the water (a second, either side of the bottom of the swing) it draws a short furrow
    if (hold == null && CW.kiss.skim > 0 && num('cwkiss', 1) !== 0 && Math.abs(theta) < 0.075 && t - lastSkim > 0.11) {
      pendulum.point('kiss', tmp);
      if (tmp.y < 0.0) { lastSkim = t; ctx.water.ripple(tmp.x, tmp.z, CW.kiss.skim, 0.22); }
    }
    // (second look) The rating nut hangs 16 cm under the rim: it never leaves the lake at all (it is 11 cm under at the top
    // of the swing and 18 at the bottom), so the rod's foot ploughs a fine furrow to and fro the whole swing through, slack
    // at the turns and quickest at the kiss. (So no drop can fall from the nut, which the first log planned: it is never dry.)
    if (hold == null && (CW.kiss.furrow ?? 0.05) > 0 && num('cwkiss', 1) !== 0 && t - lastFurrow > 0.16 && Math.abs(theta) >= 0.075) {
      const speed = Math.abs(Math.cos(TAU * (t / PERIOD + u0)));                  // 1 at the bottom of the swing, 0 at the turns
      if (speed > 0.25) { lastFurrow = t; pendulum.point('nut', tmp); ctx.water.ripple(tmp.x, tmp.z, (CW.kiss.furrow ?? 0.05) * speed, 0.1); }
    }
    if (hold == null && tickFns.length) { const u = t / PERIOD + u0, k = Math.floor(u - tickU[0]) + Math.floor(u - tickU[1]); if (k !== lastTick) { lastTick = k; for (const fn of tickFns) fn(kissAt.x, kissAt.z); } }
    // far off, the works in their dark room and the wheel under 21 m of water cannot be seen at all: they are not drawn
    // (from the street the tower stands 120 m ahead, in view the whole way)
    if (ctx.boat && isFinite(ctx.boat.x)) {
      const dx = ctx.boat.x - tx, dz = ctx.boat.z - tz, d2 = dx * dx + dz * dz;
      movement.group.visible = d2 < FAR.works * FAR.works;
      { const k = Math.min(1, Math.max(0, (FAR.works - Math.sqrt(d2)) / 20)); uFar.value = k * k * (3 - 2 * k); }
      if (ring) { ring.group.visible = d2 < FAR.ring * FAR.ring; if (ring.pool) ring.pool.visible = ring.group.visible; }
    }
    api.theta = theta;
    if (study && !study.placed && ctx.boat && ctx.time > 0.3) {                   // (the boat has no place until the realm runs)
      const b = ctx.boat, h = b.heading || 0, fx = -Math.sin(h), fz = -Math.cos(h);
      study.copy.set({ position: [b.x + fx * study.ahead, study.up, b.z + fz * study.ahead], rotation: [0, h + study.deg * Math.PI / 180, 0] });
      study.mid.set(b.x + fx * study.ahead, b.z + fz * study.ahead);
      { const a = h + study.deg * Math.PI / 180; study.room.x = Math.cos(a); study.room.y = Math.sin(a); }
      study.placed = true;
    }
  };

  // ---------------------------------------------------------------------------------------------- what the others need
  // A named place of the movement or the ring, where it is NOW in the realm (it rides on its part): the names are in the
  // models' sidecars under `points` (movement: pendulum_pivot, fly, fly_tip, bell_wire_top, lever_far, anchor, escape,
  // winding_square, great_wheel, second_wheel, strike_great_wheel, shaft_foot, dial_front | back | left | right;
  // ring: lantern0..11 (the middle of each glass), hook0..11 (the eye it hangs from), foot0..11 (the paving under it),
  // crown, crown_wall, centre).
  const pointOf = (model, r, spec) => (name, target = new THREE.Vector3()) => {
    const p = spec.points && spec.points[name];
    if (!p) { console.error(`INVALID_MODEL town clockwork has no point "${name}"`); return target.set(tx, 0, tz); }
    target.set(p.at[0], p.at[2], -p.at[1]); r.apply(p.on || 0, target);
    return target.applyMatrix4(model.group.matrix);                               // the model stands in the realm's own space
  };
  const api = {
    period: PERIOD, amplitude: AMP, theta: 0,
    /** the toolkit's escapement on this clock's swing: escapement.onPass(fn) (the bob at the bottom), escapement.swingAt(t) */
    escapement: esc,
    /** the hour ring's train as a machine (docs/life/ribbons.md): ringTrain.ease(factor, seconds), .arrive(p, seconds) */
    ringTrain,
    /** fn(x, z, direction): the bob kisses the lake (every 3.0 s; the ring is already written) */
    onKiss(fn) { kissFns.push(fn); return api; },
    /** fn(x, z): a tooth of the escape wheel lands on a pallet (every 3.0 s, 0.9 s after the kiss) */
    onTick(fn) { tickFns.push(fn); return api; },
    /** where the bob kisses the lake */
    kiss: kissAt, kissRing: CW.kiss,
    /** the sheet that carries the tower's light on the crests of the kiss's rings (a Mesh, or null): its strength is
     *  kissLight.material.uniforms.uCwKissK.value.x (the staging may want it down while the bell's lattice stands) */
    kissLight,
    /** where the bob's middle is now; where the lowest point of its rim is now */
    bob: (target) => pendulum.point('bob', target), rim: (target) => pendulum.point('kiss', target),
    /** radians the minute hands have turned since the realm began, clockwise as seen from outside each dial (they go with
     *  the centre arbor: one turn in 240 s, in the escape wheel's own steps), and the hour hands (a twelfth of that) */
    minuteAngle: () => rig.value('centre'), hourAngle: () => rig.value('centre') / 12,
    /** the striking train: set strike.fly (turns of the fly since it stood still) and every part of it follows in mesh:
     *  the great wheel's pins lift the lever and let it fall once in 6.75 turns of the fly, and the bell wire with it.
     *  strike.lever() is how far the lever is lifted now (radians, 0 at rest), strike.pull() the wire's travel in metres */
    strike: Object.assign(strike, { rate: () => (fan ? fan.rate : 0), turnsPerStroke: 1 / (Math.abs(mv.strike.great_k) * mv.strike.pins), lever: () => -rig.value('strike_lever'), pull: () => -rig.value('bell_wire') }),
    /** add radians to one part by name (clock_movement.json and hour_ring.json list them), on top of its train */
    offset(name, radians) { extra[name] = radians; return api; },
    /** a named place on the movement, now, in the realm */
    point: pointOf(movement, rig, mv),
    movement, pendulum, rig,
    ring: ring && {
      model: ring, rig: ringRig, period: (TAU / Math.abs(ringRig.byName.ring.k)) / (TAU / mv.trains.ring.period),      // 96 s
      lanterns: ringSpec.lanterns, jade: ringSpec.jade, radius: ringSpec.radius, y: ringSpec.y,
      /** radians the ring has turned (about the upright, as the ride sees it: negative is clockwise seen from above) */
      angle: () => ringRig.value('ring'),
      /** where lantern i is now; a named place on the ring, now */
      lantern: (i, target) => api.ring.point(`lantern${i}`, target), point: pointOf(ring, ringRig, ringSpec),
    },
  };
  // THE FLY AS A FAN. When the striking train runs, the fly turns up to three times a second: two vanes drawn sixty times
  // a second would stutter, not blur. So the faster it turns the more of a pale gilt drum is drawn where its vanes sweep
  // (the page's "a blurred gilt fan"); below about one turn a second there is none. It follows strike.fly by itself.
  // (second look, a fourth time: the drum was one open shell, which drawn from below is a hoop: bright where the eye looks
  // along its wall and empty across its middle. Two vanes that reach from the spindle out to their tips sweep the whole
  // of a drum, thickest across its middle: so it is four shells one inside another now, in one mesh, each a quarter as
  // strong: a soft gilt slab, as a spinning coin is. And the fly stands high in the up-route dial now, where the boat
  // that fires the stroke sees it: clock_plan.py.)
  { const fanGeo = new THREE.BufferGeometry();
    { const pos = [], nor = [], uv = [], idx = []; let base = 0;
      for (const r of [0.22, 0.35, 0.48, 0.61]) { const g = new THREE.CylinderGeometry(r, r, 0.30, 28, 1, true);
        pos.push(...g.attributes.position.array); nor.push(...g.attributes.normal.array); for (let i = 0; i < g.attributes.position.count; i++) uv.push(0, 1);      // (v of the UV is how much of polished metal a corner is: the fan is the vanes' own gilding, all of it; it used to carry the shell's height, and the fan was lit as iron in its lower half)
        for (const i of g.index.array) idx.push(i + base); base += g.attributes.position.count; g.dispose(); }
      fanGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); fanGeo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
      fanGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); fanGeo.setIndex(idx); }
    const drum = new THREE.Mesh(fanGeo,
      kit.gouache({ color: '#b8964c', brush: 0, transparent: true, opacity: 0, side: THREE.DoubleSide, extend: [lightExt(1), works({ ...WORKS, glint: 0, sheen: 0, crisp: 0, fill: (WORKS.fill ?? 1) * 1.2 }),      // (crisp: 0: a blended thing cannot carry the painter's mark in its alpha; with it the fan was a black hole in the dial)
        { vertexPars: 'varying float vCwFanH;', vertexLocal: 'vCwFanH = position.y / 0.30 + 0.5;', fragmentPars: 'varying float vCwFanH;',
          albedo: 'alpha *= smoothstep(0.0, 0.45, vCwFanH) * (1.0 - smoothstep(0.55, 1.0, vCwFanH));',      // (soft above and below: a blur has no edge)
          // a spinning vane shows its lit face to every side in turn: the blur is as bright all round as the vanes are where
          // they face the light (a shell's own wall, turned from the opening the light comes in by, was lit a third as much:
          // a brown smudge), and never brighter than the works may be from the water
          light: '{ c *= CW_FAN_GAIN; float cwFk = max(c.r, max(c.g, c.b)); if (cwFk > CW_FAN_CAP) c *= CW_FAN_CAP / cwFk; }',
          defines: { CW_FAN_GAIN: num('cwfangain', 4.0).toFixed(2), CW_FAN_CAP: ((WORKS.knee ?? 0.3) * 1.15).toFixed(3) } }] }));
    api.point('fly', drum.position); drum.material.depthWrite = false; drum.visible = false; drum.name = 'fly-fan';
    drum.updateMatrix(); drum.matrixAutoUpdate = false;
    ctx.add(drum); ctx.only(drum, 'direct');
    fan = { drum, last: strike.fly, rate: 0 }; }
  shared.clock = api;
  shared.pendulum = { model: pendulum, rod: pendulum.group, bob: pendulum.group, pivot: [pivot.x, pivot.y, pivot.z], yaw, kiss: kissAt, clock: api };      // (stage 1's names, kept)
  shared.hourRing = { ...(shared.hourRing || {}), ring: ring ? ring.group : null, centre: [tx, T.hourRing.y, tz], clock: api };
  update();
  // (a developer's switch, &cwcheck=1: asks for every named place the sidecars and the pendulum publish and says, as ONE
  // page error that begins CWCHECK, how many answered and where a few of them are; any that does not answer is an
  // INVALID_MODEL error of its own. For whoever changes a model: the cast and the staging find things by these names.)
  if (Q.has('cwcheck')) {
    const bad = [], v = new THREE.Vector3(), fx = (p) => `${p.x.toFixed(2)},${p.y.toFixed(2)},${p.z.toFixed(2)}`;
    const ask = (label, fn, names) => { let n = 0; for (const nm of names) { const p = fn(nm, v); if (p && isFinite(p.x + p.y + p.z)) n++; else bad.push(`${label}.${nm}`); } return n; };
    const nM = ask('movement', api.point, Object.keys(mv.points || {}));
    const nR = api.ring ? ask('ring', api.ring.point, Object.keys(ringSpec.points || {})) : 0;
    const nP = ask('pendulum', (nm, t) => pendulum.point(nm, t), ['bob', 'kiss', 'crutch', 'nut']);
    console.error(`CWCHECK ${nM} movement points, ${nR} ring points, ${nP} pendulum points answer${bad.length ? '; NOT: ' + bad.join(' ') : ''}. fly ${fx(api.point('fly'))} | going_great_wheel ${fx(api.point('going_great_wheel'))} | winding_square ${fx(api.point('winding_square'))} | bob ${fx(api.bob(v))} | lantern0 ${api.ring ? fx(api.ring.lantern(0)) : '-'} | tower axis ${tx.toFixed(2)},${tz.toFixed(2)} | strike.fly ${strike.fly} turnsPerStroke ${api.strike.turnsPerStroke.toFixed(3)} lever ${api.strike.lever().toFixed(4)} pull ${api.strike.pull().toFixed(4)} | minuteAngle ${api.minuteAngle().toFixed(4)} ring.period ${api.ring ? api.ring.period.toFixed(2) : '-'}`);
  }
  return { update };
}
