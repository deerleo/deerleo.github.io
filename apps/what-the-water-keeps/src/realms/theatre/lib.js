// The theatre of leaves: what its modules share.
//
//   at(ctx, s, d, y)            the page's coordinates as a point of the realm (kit.at, carried on past either end of the route)
//   house(ctx, plan, shared)    THE HOUSE'S LIGHT: the paint every built thing in this area wears (gouache with one extension),
//                               and the uniforms set.js drives. Read "The house's light" below before you dress a model.
//   solid(ctx, shared, {...})   a stand-in made of several plain solids, one draw call (the engine's standIn underneath)
//   many(ctx, shared, {...})    the same stand-in many times, instanced: one draw call
//   passes(mesh, ctx, {...})    how many of an instanced multitude each pass draws (the picture, the water's mirror, the pre-pass)
//
// Developer switches in the address (with ?realm=theatre):
//   &c=27          hold the show clock at 27 s (0 the hour strikes .. 6 the tiers begin .. 27 the full house .. 29 the fall .. 40 after)
//   &ballast=0     stand-ins as plain solids. By default every stand-in carries the triangles its page allowance gives the real thing,
//                  so that the frame time measured on stand-ins is the frame time of the finished area (1-layout.md)
//   &raw=1         the page's light table exactly as written, without the house's own light (to see why it is not enough;
//                  it is also the plainest view of the stand-ins)
//   &labels=1      the name of every stand-in (the engine's switch)
//   &log=n.json&logt=40    where a boat left alone goes: with &drift=1&t=41, writes .shots/n.json (s, d, show clock, speed, once a second)
//   &lampd=6       the kept lamp at another d (the page's 6);  &rainstr=0.4  the rain zone's strength;  &wakebase=1  water-light at full on still water
//   &sitters=1     the sitters with the page's numbers (50 leaves, 0.75 m behind the rail): they do not read from the boat
//   &light=1       the house's light as the first builder left it (the second version, light.js, is what the area wears)
//   &set=house.dark:x0F261F,grade.toe:0,fog.density:0.012   &wset=mirror:0.4     your own numbers over the look / the water (set.js)
//   &next=1        the house's light as it is being worked on (light_next.js instead of light.js);   &round=1  the first round's numbers (plan.js, the end)
//   &cove=0        the first, plain cove;   &skip=air  no glows;   &silk=0  the foyer's walls plain;   &boattone=8A9088  the boat's tone in this room
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { standIn } from '../../engine/modules.js';
import { frontArcAtS, frontD } from './plan.js';
import { lightExtension, lightUniforms, KEEP, KEEP_DEFAULT, DETAIL } from './light.js';

const params = new URLSearchParams(typeof location !== 'undefined' ? location.search : '');
// (&next=1: the house's light as whoever holds stage 2 is working on it, light_next.js, when that file is there; without the switch nothing of it is loaded,
// so a slip in it cannot reach anybody else's pictures. What the area wears is light.js.)
const LIGHT = params.has('next') ? await import('./light_next.js') : { lightExtension, lightUniforms, KEEP, KEEP_DEFAULT, DETAIL };
export const dev = {
  ballast: params.get('ballast') !== '0',
  raw: params.has('raw'),
  clock: params.has('c') && params.get('c') !== '' ? +params.get('c') : null,
  second: params.get('light') !== '1' && !params.has('raw'),      // the house's light, second version (light.js); &light=1 the first
  labels: params.has('labels'),
  has: (k) => params.has(k), get: (k) => params.get(k),
};

const _v = new THREE.Vector3(), _m = new THREE.Matrix4(), _x = new THREE.Vector3(), _y = new THREE.Vector3(), _z = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0);
const f = (n) => Number(n).toFixed(4);

/** The page's coordinates as a point of the realm: s metres along, d metres right, y metres up. Works behind the entrance (s < 0) and past the end. */
export function at(ctx, s, d = 0, y = 0, target = new THREE.Vector3()) {
  const L = ctx.path.length;
  if (s >= 0 && s <= L) return ctx.kit.at(s, d, y, target);
  const e = s < 0 ? 0 : L, p = ctx.path.at(e), k = s - e;
  return target.set(p.x + p.tx * k + p.rx * d, y, p.z + p.tz * k + p.rz * d);
}

// ================================================================================================ the house's light
//
// Everything built in this area wears `paint(...)`: the ride's gouache with ONE extension, the house's light. Since stage 2
// that extension is in light.js (read its header: the room's dark as a colour, the moon reaching the whole house, the wet
// gleam, candle pools lit from where the flames are, water-light), with its numbers in plan.light2 and set.js driving its
// uniforms from look.house every frame. The first version is kept below (`ext`) behind `&light=1`, with the page's own table.
// Why an extension at all: the page's light table by itself cannot make a dark room. The ride's painted ramp shows every
// surface that is side-on to the key light in its full local colour, and a room is all walls (`&raw=1` shows it).
// The fire in the tree, the lustres, the stage moon and the kept lamp are ordinary lights (ctx.light, the engine's lamp):
// the paint takes them too, at the share the light state gives (look.house.lamps).
//
// To dress a model:   kit.model(url, { at: [...], ...H.dress('gilt') })      // H = shared.house
//                     kit.models(url, placements, H.dress('velvet'))
// To make a material: H.paint('gilt')   or   H.paint({ color: '#6F7A76', wake: true, side: THREE.DoubleSide, extend: {...yours} })
// Vertex paint from Blender is the local colour in ordinary light (gilt is #A8843F, not a darkened gilt): the house darkens it.
// Options of paint and dress beside gouache's own (a kind brings its own; give any of them to change it):
//   wake: true        it takes water-light;   wakeH: [4, 12]   how high that climbs on still and on lively water (metres)
//   take: [1,1,1,1]   how much it takes of water-light, the candle rows, the moon, the lit room's bounce
//   keep: [hue, dark, gleam, metal]   how it behaves where no light reaches, and what it gives back (light.js KEEP):
//                     hue 0..1 of its own colour kept in the dark (gilt 0.12: green-black; leaves 0.85: copper stays copper),
//                     dark: how much of the room's dark it takes, gleam: how wet or rubbed (the pearl edge), metal: the glint of a flame
//   detail: true      what the plain building's paints carry on their surface (light.js DETAIL: brick courses, boards, grain, old
//                     plaster). On for paint(kind), off for dress(kind): a model brings its own paint
// The uniform names in shared.house.U are used by other modules (tree.js: uShaft, uShaftLean, uMoonCol; kit_multitudes.js: uShow,
// uShaft, uShaftLean; kit_tiers.js redefines uKeep per fragment): do not rename them.
export function house(ctx, plan, shared) {
  if (shared.house) return shared.house;
  const { kit } = ctx, C = (h) => new THREE.Color(h);
  const A = plan.arc, dEdge = frontD(plan.archWall.face);
  const U = {
    uHouse: { value: dev.raw ? 1 : 0.14 },
    uShow: { value: -1 },                                                  // the show clock c
    uShaft: { value: new THREE.Vector4(0, 0, 10, dev.raw ? 0 : 1) },       // foot of the shaft on the water (x, z), radius, strength
    uShaftLean: { value: new THREE.Vector2(0, 0) },
    uMoonCol: { value: C('#C4D6D0').multiplyScalar(0.9) },
    uCandleCol: { value: C('#FFE8BE').multiplyScalar(dev.raw ? 0 : 1.8) },          // the light of a bracket on what stands by it: gilt #A8843F goes to about #E8B64C beside the flames
    uFillCol: { value: new THREE.Color(0, 0, 0) },
    uWakeCol: { value: C('#CFE3DC') }, uWakeStage: { value: C('#FFC98A') }, uWakeRose: { value: C('#F3A77E') },
    uWakeP: { value: new THREE.Vector4(dev.raw ? 0 : 1.1, 0.2, 0.3, 0.5) },        // strength (the page: 0.9), share on still water, repeats per metre, speed
    tWake: { value: null }, uWakeLen: { value: plan.length }, uStir: { value: 0 },      // the wake as it arrives at the walls (see `wake` below)
  };
  // THE WAKE ARRIVING. The page: "the realm eases each wall segment's caustic height from 4 to 12 m when the water at its foot has
  // been disturbed". The ripple field itself cannot say so: a wake made on the centre line dies within about 5 m of the hull and the
  // fronts are 20 m away (1-layout.md). So the walls keep their own record: for every 0.7 m of the route and each side, how lively
  // the water at the wall's foot is taken to be: it rises over about 3 s when a moving boat is near (nearer walls first and more),
  // sinks back over about 8 s, and breathes where the rain's rings reach it. One 256 by 1 texture, written on the CPU each frame.
  const WN = 256, wake = { data: new Uint8Array(WN * 4), live: new Float32Array(WN * 2), trail: [], stir: 0 };
  wake.tex = new THREE.DataTexture(wake.data, WN, 1, THREE.RGBAFormat); wake.tex.magFilter = wake.tex.minFilter = THREE.LinearFilter; wake.tex.needsUpdate = true;
  U.tWake.value = wake.tex;
  const wallAt = (sv) => (sv < 30 ? plan.foyer.wallAt(sv) : sv <= 90 ? frontD(sv) : sv < 120 ? plan.wings.inner : plan.fly.ropes.d[0] + 0.7);
  const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  wake.update = (dt, time) => {
    const boat = ctx.boat, q = ctx.path.locate(boat.x, boat.z, ctx.s), speed = boat.speed || 0;
    wake.stir += (sm(0.3, 1.5, speed) - wake.stir) * Math.min(1, dt * 1.5);
    // (the boat's trail is kept ten times a second, not every frame: every wall segment searches it, and at sixty entries a second that was
    // a quarter of a million steps a frame)
    if (!wake.trail.length || time - wake.trail[wake.trail.length - 1].t >= 0.1) wake.trail.push({ s: q.s, d: q.d, stir: wake.stir, t: time });
    while (wake.trail.length > 2 && time - wake.trail[0].t > 9) wake.trail.shift();
    const B = plan.beech, R = plan.shaft.rain.radius, T = wake.trail;
    for (let i = 0; i < WN; i++) {
      const sv = i / (WN - 1) * plan.length, w = wallAt(sv);
      for (let k = 0; k < 2; k++) {
        const d = (k ? 1 : -1) * w, r0 = Math.hypot(sv - q.s, d - q.d);
        // the wake travels: what reaches this wall now left the boat r / 6 seconds ago
        let e = T[T.length - 1]; const want = time - r0 / 6; for (let j = T.length - 1; j >= 0; j--) { e = T[j]; if (T[j].t <= want) break; }
        const r = Math.hypot(sv - e.s, d - e.d);
        let target = e.stir * (1 - sm(12, 56, r));
        if (!k && sv > 30 && sv < 90) target = Math.max(target, 0.42 * (1 - sm(R + 0.5, R + 12, Math.hypot(sv - B.s, d - B.d))) * (0.8 + 0.2 * Math.sin(time * 0.7 + sv * 0.45)));      // the left fronts breathe with the rain's rings
        const cur = wake.live[i * 2 + k];
        wake.live[i * 2 + k] = cur + (target - cur) * Math.min(1, dt / (target > cur ? 1.2 : 3.0));
        wake.data[i * 4 + k] = Math.round(255 * Math.min(1, wake.live[i * 2 + k]));
      }
    }
    wake.tex.needsUpdate = true; U.uStir.value = wake.stir;
  };
  // the box-front line and the distance along it from the bracket nearest s 58, as GLSL, from the plan's own points
  const line = plan.boxLine, arcPts = [plan.archWall.face, 33, 37, 43, 50, 58, 62, 72, 80, 84, 90].map((s) => [s, frontArcAtS(s)]);
  const pwGLSL = (name, pts, wrap = (e) => e) => `float ${name}(float s) {\n` + pts.slice(1).map((p, i) =>
    `    if (s < ${f(p[0])}) return ${wrap(`mix(${f(pts[i][1])}, ${f(p[1])}, clamp((s - ${f(pts[i][0])}) / ${f(p[0] - pts[i][0])}, 0.0, 1.0))`)};`).join('\n') + `\n    return ${wrap(f(pts.at(-1)[1]))};\n  }`;
  const ext = (wake) => ({
    defines: wake ? { HOUSE_WAKE: '' } : {},
    fragmentPars: /* glsl */`
  uniform float uHouse, uShow, uWakeLen, uStir; uniform vec4 uShaft, uTake, uWakeP; uniform vec2 uShaftLean, uWakeH; uniform sampler2D tWake;
  uniform vec3 uMoonCol, uCandleCol, uFillCol, uWakeCol, uWakeStage, uWakeRose;
  ${pwGLSL('houseFront', line)}
  ${pwGLSL('houseArc', arcPts)}`,
    light: /* glsl */`
    { // ---- the house's own light (src/realms/theatre/lib.js)
      vec3 hBase = albedo * mix(vec3(1.0), shade, uShade) + albedo * ambient;
      c -= hBase * (1.0 - uHouse);                                         // the room is dark: a share of the general light reaches in
      float hS = -vWPos.z, hD = abs(vWPos.x), hY = vWPos.y;
      // the moon: what stands in the shaft and looks up is lit; a little spills on whatever faces it
      vec2 hQ = vWPos.xz - (uShaft.xy + uShaftLean * hY);
      float hR = length(hQ);
      float hIn = 1.0 - smoothstep(uShaft.z * 0.8, uShaft.z * 1.2, hR);
      float hUp = max(dot(N, -uKeyDir), 0.0);
      float hFace = max(dot(N.xz, -hQ / max(hR, 1e-3)), 0.0);
      float hSpill = (1.0 - smoothstep(uShaft.z, uShaft.z * 3.4, hR)) * (0.3 + 0.7 * max(hFace, -N.y));      // what faces the shaft, or looks down on the lit water
      c += albedo * uMoonCol * (uShaft.w * uTake.z) * (hIn * (0.25 + 0.75 * hUp) + 0.14 * hSpill);
      // candles: a row of three-armed brackets on every tier front, a pool of light round each, caught by an edge of flame
      // that runs both ways from s 58 (the stage boxes and the arch last). The arch wall carries rows only from tier 3 up.
      float hTier = clamp(floor((hY - 1.5) / 3.2 + 0.5), 1.0, 5.0);
      float hRoom = min(houseFront(hS) - hD, hS - ${f(plan.archWall.face)});      // metres into the room from the nearest front; negative: behind it, in a box
      bool hRear = hS < ${f(plan.archWall.face + 0.4)};
      float hAlong = hRear ? ${f(A.rearFace)} - max(${f(dEdge)} - hD, 0.0) : houseArc(hS);     // metres along the front from its rear corner (negative: along the arch wall)
      float hWhen = hS > 84.0 ? 18.0 + 0.3 * hTier : ${f(plan.show.tierStart[1])} + 2.0 * (hTier - 1.0) + abs(hAlong - ${f(A.at58)}) / ${f(plan.show.speed)};
      // the light of one bracket falls off within a couple of metres: tarnish only looks like gold where a flame is near it
      float hDy = hY - (3.2 * hTier + 1.5);
      float hBay = hRear ? hD - ${f(4 * plan.bay)} : hAlong - ${f(A.bay0)};          // metres along the front from a pier
      float hA = hBay - ${f(plan.bay)} * floor(hBay / ${f(plan.bay)} + 0.5);            // ... to the nearest pier, where the bracket is
      float hPool = 1.0 / (1.0 + (hA * hA + hDy * hDy + (hRoom - 0.46) * (hRoom - 0.46)) / 0.7);
      float hOk = step(29.0, hS) * (1.0 - step(91.0, hS)) * ((hRear && hTier < 2.5) ? 0.0 : 1.0);
      // the proscenium's own twelve brackets stand round the opening, from the springing up to the crown
      float hEdge = hY < 11.0 ? abs(hD - 12.4) : abs(length(vec2(hD / 12.4, (hY - 11.0) / 5.4)) - 1.0) * 8.5;
      float hPhi = hY < 11.0 ? (hY - 11.0) / 2.7 : atan((hY - 11.0) / 5.4, hD / 12.4) / 0.29;
      float hAl = (hPhi - floor(hPhi + 0.5)) * 2.7;
      float hArch = 0.7 * step(hD, 15.2) * step(10.0, hY) / (1.0 + (hAl * hAl + hEdge * hEdge + (hS - 88.8) * (hS - 88.8)) / 0.5);
      float hCandle = max(hOk * hPool * smoothstep(0.0, 0.9, uShow - hWhen),
                          hArch * smoothstep(0.0, 0.9, uShow - (18.2 + 1.8 * clamp((hY - 11.0) / 5.0, 0.0, 1.0))));
      c += albedo * uCandleCol * (uTake.y * hCandle);
      // the room's fill once the house is lit
      c += albedo * uFillCol * (uTake.w * smoothstep(27.0, 32.0, hS) * (1.0 - smoothstep(88.0, 95.0, hS)));
      #ifdef HOUSE_WAKE
      { // water-light: the web moving water throws up a wall from the waterline, higher and brighter where the water is lively
        vec2 hUv = (vWPos.xz - uRippleRect.xy) / uRippleRect.zw + 0.5;
        float hE = (hUv.x > 0.0 && hUv.x < 1.0 && hUv.y > 0.0 && hUv.y < 1.0) ? texture2D(tRipple, hUv).a : 0.0;
        // the walls keep a record of the wake arriving (the wake record in lib.js); what stands in the open water answers a moving boat near it
        vec4 hRec = texture2D(tWake, vec2(clamp(hS / uWakeLen, 0.0, 1.0), 0.5));
        bool hWall = hD > ((hS > 30.0 && hS < 90.0) ? 0.55 * houseFront(hS) : 6.0);
        float hBy = uStir * (1.0 - smoothstep(3.0, 13.0, distance(vWPos.xz, uBoat.xz)));
        float hLive = clamp(max(hE * 4.0, hWall ? (vWPos.x < 0.0 ? hRec.r : hRec.g) : hBy), 0.0, 1.0);
        float hBand = smoothstep(mix(uWakeH.x, uWakeH.y, hLive), 0.0, hY) * smoothstep(-2.5, -0.2, hY) * smoothstep(0.55, 0.0, N.y);      // never on low level surfaces
        if (hBand > 0.002) {
          vec3 hCw = pow(abs(N), vec3(4.0)); hCw /= (hCw.x + hCw.y + hCw.z);
          vec3 hCq = vWPos * uWakeP.z; float hCt = uTime * uWakeP.w;
          float hCst = min(causticAt(hCq.zy, hCt) * hCw.x + causticAt(hCq.xz, hCt) * hCw.y + causticAt(hCq.xy, hCt) * hCw.z, 4.0);
          vec3 hWc = mix(uWakeCol, uWakeStage, smoothstep(88.0, 93.0, hS) * (1.0 - smoothstep(118.0, 123.0, hS)));
          hWc = uWakeRose * (1.0 - smoothstep(2.0, 18.0, hS)) + hWc * smoothstep(8.0, 28.0, hS);       // the foyer: the town's rose fails, the house's pearl grows
          c += hWc * hCst * uWakeP.x * hBand * (uWakeP.y + (1.0 - uWakeP.y) * hLive) * (0.35 + 0.65 * albedo) * uTake.x;
        }
      }
      #endif
    }`,
  });
  // THE SECOND VERSION of the house's light is in light.js (the room's dark as a colour, the moon reaching the whole house, the
  // wet gleam, candle pools lit from where the flames are). It is what the area wears; &light=1 shows the first version above
  // (and &raw=1, the page's light table alone, uses the first version too).
  const second = dev.second;
  Object.assign(U, LIGHT.lightUniforms(plan));
  const extCache = new Map();
  const EXT = (wake, detail = 0) => { const key = (second ? 2 : 1) + ':' + (wake ? 1 : 0) + ':' + detail; if (!extCache.has(key)) extCache.set(key, second ? LIGHT.lightExtension(plan, !!wake, detail) : ext(!!wake)); return extCache.get(key); };
  // the area's paints: local colours (mid values; the light does the rest). take: [water-light, candle rows, moon, room fill]
  const KINDS = {
    gilt: { color: '#A8843F', wake: true }, giltHigh: { color: '#A8843F', wake: true, wakeH: [9, 16] },
    velvet: { color: '#1F4A3E', wake: true, take: [0.7, 0.8, 1, 1] }, damask: { color: '#566548', take: [0, 0.8, 1, 1] },
    plaster: { color: '#59625c', wake: true }, ceiling: { color: '#4d5650', wake: true, wakeH: [13, 17] }, stone: { color: '#8E7AA8', wake: true },
    brick: { color: '#4a3b3d', wake: true, take: [0.18, 0, 1, 0] }, dark: { color: '#141a18', take: [0, 0, 0.3, 0.3] },
    boards: { color: '#2c3830', take: [0, 0, 1, 0] }, floor: { color: '#1b2a24', take: [0, 0, 0.3, 0] }, runner: { color: '#8E2F22', take: [0, 0, 1, 0] },
    bark: { color: '#6F7A76', wake: true }, leaf: { color: '#B5522A' }, mound: { color: '#6e5642', wake: true, take: [0.6, 1, 1, 1] },
    pearl: { color: '#C4D6D0' }, sky: { color: '#9fb0b2' }, rose: { color: '#C99AA0', wake: true, take: [0.5, 0, 1, 0] }, canvas: { color: '#8f866f' },
    timber: { color: '#66574a', wake: true, take: [0.6, 0.5, 1, 0.5] }, petrol: { color: '#4f7f80', wake: true }, rope: { color: '#b3a47e' }, iron: { color: '#34363a' },
    brass: { color: '#9a7a44', wake: true }, copper: { color: '#9b5a34', wake: true }, canvasBag: { color: '#a59a80' }, wax: { color: '#e8dcc0' }, card: { color: '#e6dfc8' },
  };
  const opts = (kind, over, withColor) => {
    const base = typeof kind === 'string' ? KINDS[kind] : kind;
    if (typeof kind === 'string' && !base) throw new Error(`theatre: no paint called '${kind}'`);
    const { wake = false, wakeH = [4, 12], take = [1, 1, 1, 1], keep = (typeof kind === 'string' && LIGHT.KEEP[kind]) || LIGHT.KEEP_DEFAULT, detail = withColor, extend = null, color, ...rest } = { ...base, ...(over || {}) };
    // (detail: what the plain building's paints carry on their surface, light.js DETAIL: brick courses, boards, grain, old plaster. On by default
    // for paint(kind), off for dress(kind), whose model brings its own paint; { detail: true | false } says otherwise)
    const what = second && detail && typeof kind === 'string' ? (LIGHT.DETAIL[kind] || 0) : 0;
    const mine = { ...EXT(wake, what), uniforms: { ...U, uTake: { value: new THREE.Vector4(...take) }, uWakeH: { value: new THREE.Vector2(...wakeH) }, uKeep: { value: new THREE.Vector4(...keep) } } };
    return { brush: 0.6, ...(withColor && color ? { color } : {}), ...rest, extend: [mine, ...[].concat(extend || [])] };
  };
  /**
   * A material in the house's light. paint('gilt') gives a kind's own paint; paint({ color, wake, wakeH, take, ...gouache
   * options }) or paint('gilt', { side: THREE.DoubleSide }) makes one of your own. `extend` (yours) is added after the house's.
   *   wake: true      it takes water-light;  wakeH: [4, 12]  how high that climbs on still and on lively water (metres)
   *   take: [1,1,1,1] how much it takes of water-light, the candle rows, the moon, the room's fill
   */
  // (Every call makes a material of its own. They used to be kept and shared, one for each kind; but the engine's removeStandIn
  // frees the material of whatever it takes out, and a stand-in taken out after the first frame took the paint off everything
  // else of its kind for a frame, with a burst of GL errors in every picture. Materials with the same text still share one
  // compiled program, so nothing is lost.)
  const paint = (kind, over = null) => kit.gouache(opts(kind, over, true));
  /**
   * The same as gouache options, for kit.model / kit.models / kit.animated: kit.model(url, { at, ...H.dress('gilt') }).
   * A kind's colour is NOT passed (a model brings its own vertex paint); give { color } yourself to tint one.
   */
  const dress = (kind, over = null) => opts(kind, over, !!(over && over.color));
  shared.house = { U, paint, dress, KINDS, wake };
  return shared.house;
}

// ================================================================================================ stand-ins
const even = (n) => Math.max(1, Math.round(n));
function boxGeo(w, h, l, tris) {
  if (!(tris > 12)) return new THREE.BoxGeometry(w, h, l);
  const rho = Math.sqrt(tris / (4 * (w * h + h * l + w * l)));             // segments per metre: 2 triangles a cell, 2 * (wh + hl + wl) of surface
  return new THREE.BoxGeometry(w, h, l, even(w * rho), even(h * rho), even(l * rho));
}
function tubeGeo(r0, r1, h, tris, radial0 = 14) {
  if (!(tris > radial0 * 4)) return new THREE.CylinderGeometry(r1, r0, h, radial0, 1);
  const circ = Math.PI * (r0 + r1), a = Math.sqrt(2 * circ * h / tris);       // a square cell of side a: 2 * circ * h / a^2 triangles
  return new THREE.CylinderGeometry(r1, r0, h, Math.max(8, Math.min(160, Math.round(circ / a))), even(h / a));
}
function ballGeo(tris, half = false) {
  const hs = Math.max(6, Math.round(Math.sqrt(Math.max(96, tris || 0) / (half ? 2 : 4))));
  return half ? new THREE.SphereGeometry(1, hs * 2, hs, 0, Math.PI * 2, 0, Math.PI / 2) : new THREE.SphereGeometry(1, hs * 2, hs);
}
const areaOf = (p) => {
  if (p.box) return 2 * (p.box[0] * p.box[1] + p.box[1] * p.box[2] + p.box[0] * p.box[2]);
  if (p.cyl) return Math.PI * (p.cyl[0] + p.cyl[1]) * p.cyl[2];
  if (p.ball) return 4 * Math.PI * Math.pow((p.ball[0] * p.ball[1] * p.ball[2]), 2 / 3);
  if (p.dome) return 2 * Math.PI * Math.pow((p.dome[0] * p.dome[1] * p.dome[2]), 2 / 3);
  if (p.cone) return Math.PI * p.cone[0] * Math.hypot(p.cone[0], p.cone[1]);
  if (p.bar || p.pole) { const L = Math.hypot(p.to[0] - p.from[0], p.to[1] - p.from[1], p.to[2] - p.from[2]); return p.bar ? 2 * (p.bar[0] + p.bar[1]) * L : Math.PI * (p.pole[0] + p.pole[1]) * L; }
  return 0;
};
/** Give a geometry of your own the attributes the merged stand-ins carry (position, normal, uv; indexed). */
export function finish(geo) {
  if (!geo.index) { const n = geo.attributes.position.count, idx = new (n > 65535 ? Uint32Array : Uint16Array)(n); for (let i = 0; i < n; i++) idx[i] = i; geo.setIndex(new THREE.BufferAttribute(idx, 1)); }
  if (!geo.attributes.normal) geo.computeVertexNormals();
  if (!geo.attributes.uv) geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(geo.attributes.position.count * 2), 2));
  for (const k of Object.keys(geo.attributes)) if (!['position', 'normal', 'uv'].includes(k)) geo.deleteAttribute(k);
  return geo;
}
/** A surface through rows of points (every row the same length): quads between neighbours. keep(centre) may drop cells. */
export function grid(rows, keep = null) {
  const n = rows[0].length, pos = [], idx = [];
  for (const r of rows) for (const p of r) pos.push(p.x, p.y, p.z);
  const c = new THREE.Vector3();
  for (let j = 0; j < rows.length - 1; j++) for (let i = 0; i < n - 1; i++) {
    const a = j * n + i, b = a + 1, d = a + n, e = d + 1;
    if (keep) { c.copy(rows[j][i]).add(rows[j][i + 1]).add(rows[j + 1][i]).add(rows[j + 1][i + 1]).multiplyScalar(0.25); if (!keep(c)) continue; }
    idx.push(a, d, b, b, d, e);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  return finish(g);
}
/** A flat wall with openings, standing across the route at s (its face toward the entrance at s, `thick` metres deep down the route). */
export function wallAcross(ctx, { s, thick, width, y0, y1, openings = [], holes = [] }) {
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2, y0); shape.lineTo(width / 2, y0); shape.lineTo(width / 2, y1); shape.lineTo(-width / 2, y1); shape.closePath();
  for (const o of openings) {
    const h = new THREE.Path(), r = o.w / 2, base = o.y0 ?? y0 + 0.01;
    if (o.round === false) { h.moveTo(o.d - r, base); h.lineTo(o.d + r, base); h.lineTo(o.d + r, o.h); h.lineTo(o.d - r, o.h); h.closePath(); }
    else { h.moveTo(o.d - r, base); h.lineTo(o.d + r, base); h.lineTo(o.d + r, o.h - r); h.absarc(o.d, o.h - r, r, 0, Math.PI, false); h.lineTo(o.d - r, base); }
    shape.holes.push(h);
  }
  for (const pts of holes) { const h = new THREE.Path(); pts.forEach((p, i) => (i ? h.lineTo(p[0], p[1]) : h.moveTo(p[0], p[1]))); h.closePath(); shape.holes.push(h); }
  const g = new THREE.ExtrudeGeometry(shape, { depth: thick, bevelEnabled: false, curveSegments: 14 });
  // the shape's x is d (to the right), its y is up, and it is extruded toward +z: back up the route. Put its far face at s + thick.
  const p = at(ctx, s + thick, 0, 0);
  g.translate(p.x, 0, p.z);
  return finish(g);
}
/**
 * Plain solids merged into one geometry. Each part is one of
 *   { box: [across, high, along], at: [s, d, y] }          at = the middle of its foot (mid: true = its centre); turn: radians about the vertical
 *   { cyl: [rFoot, rTop, high], at, axis: 'y' | 's' | 'd' } a round post (axis 's': lying along the route, 'd': across it; then `at` is its centre)
 *   { ball: [rAcross, rHigh, rAlong], at }                 at = its centre;      { dome: [rAcross, high, rAlong], at }  at = the middle of its base
 *   { cone: [r, high], at }
 *   { bar: [width, thick], from: [s, d, y], to: [s, d, y] } a beam between two points, its width level
 *   { pole: [r0, r1], from, to }                           a round tapering member between two points
 *   { mesh: geometry }                                     your own, already in the realm's coordinates (see finish)
 * or, for a piece that will be instanced, the same with p: [x, y, z] (and from/to) in the piece's own space: front +Z, right +X, up +Y.
 * `tris` is the triangle allowance of what the solids stand for: with ballast on they are subdivided to carry it.
 */
export function solids(ctx, parts, tris = 0, origin = null) {
  const list = [], total = parts.reduce((a, p) => a + areaOf(p), 0) || 1, ballast = dev.ballast ? tris : 0;
  const P = (q, local) => (local ? new THREE.Vector3(q[0], q[1], q[2]) : at(ctx, q[0], q[1], q[2]));
  for (const p of parts) {
    const local = !!p.p || !!p.local, share = ballast * areaOf(p) / total;
    let g;
    if (p.mesh) { g = finish(p.mesh.clone()); list.push(g); continue; }
    if (p.bar || p.pole) {
      const a = P(p.from, local), b = P(p.to, local), L = a.distanceTo(b);
      g = p.bar ? boxGeo(p.bar[0], L, p.bar[1], share) : tubeGeo(p.pole[0], p.pole[1], L, share, p.radial || 12);
      g.translate(0, L / 2, 0);
      _y.subVectors(b, a).normalize(); _x.crossVectors(_y, UP); if (_x.lengthSq() < 1e-6) _x.set(1, 0, 0); _x.normalize(); _z.crossVectors(_x, _y);
      g.applyMatrix4(_m.makeBasis(_x, _y, _z).setPosition(a));
    } else {
      const c = P(p.p || p.at, local);
      if (p.box) { g = boxGeo(p.box[0], p.box[1], p.box[2], share); if (!p.mid) g.translate(0, p.box[1] / 2, 0); }
      else if (p.cyl) {
        g = tubeGeo(p.cyl[0], p.cyl[1], p.cyl[2], share, p.radial || 16);
        if (p.axis === 's') g.rotateX(Math.PI / 2); else if (p.axis === 'd') g.rotateZ(Math.PI / 2); else g.translate(0, p.cyl[2] / 2, 0);
      } else if (p.ball) { g = ballGeo(share); g.scale(p.ball[0], p.ball[1], p.ball[2]); }
      else if (p.dome) { g = ballGeo(share, true); g.scale(p.dome[0], p.dome[1], p.dome[2]); }
      else if (p.cone) { g = new THREE.ConeGeometry(p.cone[0], p.cone[1], 20, even(Math.sqrt(share / 40))); g.translate(0, p.cone[1] / 2, 0); }
      else throw new Error('theatre: a stand-in part with no shape');
      if (p.tilt) { g.rotateX(p.tilt[0] || 0); g.rotateZ(p.tilt[1] || 0); }
      if (p.turn) g.rotateY(p.turn);
      if (!local) { const q = ctx.path.at(Math.min(ctx.path.length, Math.max(0, (p.at || [0])[0]))); _x.set(q.rx, 0, q.rz); _z.set(-q.tx, 0, -q.tz); g.applyMatrix4(_m.makeBasis(_x, UP, _z)); }
      g.translate(c.x, c.y, c.z);
    }
    list.push(finish(g));
  }
  const merged = list.length === 1 ? list[0] : mergeGeometries(list, false);
  if (list.length > 1) for (const g of list) g.dispose();
  if (origin) merged.translate(-origin.x, -origin.y, -origin.z);
  return merged;
}

/**
 * A stand-in of several solids, as ONE mesh (the engine's standIn underneath, so it is named, labelled with &labels=1
 * and counted like every stand-in of the ride).
 *   name     what it stands for;   parts: see `solids`;   paint: a kind of the house's paint ('gilt') or a material
 *   tris     the page's triangle allowance for the real thing;   collide: radius of a collider at `at`
 *   at       [s, d, y] where its label stands (default: the first part);   only: 'direct' (not in the water's mirror)
 */
export function solid(ctx, shared, o) {
  const H = house(ctx, ctx.state.plan, shared), anchor = o.at || o.parts[0].at || o.parts[0].from || [0, 0, 0];
  const m = standIn(ctx, { name: o.name, position: at(ctx, anchor[0], anchor[1], anchor[2]).toArray(), size: [1, o.high ?? 1, 1], collide: o.collide });
  m.geometry.dispose(); m.material.dispose();
  m.scale.set(1, 1, 1);
  m.geometry = solids(ctx, o.parts, o.tris || 0, m.position);
  m.material = typeof o.paint === 'string' || !o.paint ? H.paint(o.paint || 'plaster') : o.paint;
  if (o.only) ctx.only(m, o.only);
  return m;
}

function label(ctx, text, pos) {
  const cv = document.createElement('canvas'), g = cv.getContext('2d');
  g.font = '600 28px system-ui, sans-serif';
  cv.width = Math.ceil(g.measureText(text).width) + 20; cv.height = 40;
  g.font = '600 28px system-ui, sans-serif';
  g.fillStyle = 'rgba(0,0,0,0.72)'; g.fillRect(0, 0, cv.width, cv.height);
  g.fillStyle = '#fff'; g.textBaseline = 'middle'; g.fillText(text, 10, 21);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, fog: false, sizeAttenuation: false }));
  s.scale.set(0.045 * cv.width / cv.height, 0.045, 1); s.renderOrder = 999; s.position.copy(pos);
  ctx.add(s);
}

/**
 * The same stand-in many times, instanced: one draw call.
 *   name, paint, tris (allowance for ONE)     as for `solid`
 *   parts                                     the piece in its own space (p: [x, y, z]; front +Z, right +X, up +Y)
 *   items: [{ at: [s, d, y], turn, scale: n | [x, y, z], color }]    turn = rotation.y (0: its front looks back up the route, toward +z)
 */
export function many(ctx, shared, o) {
  const H = house(ctx, ctx.state.plan, shared);
  const geo = o.geo || solids(ctx, o.parts.map((p) => ({ ...p, local: true })), o.tris || 0);
  const mesh = ctx.kit.instances(geo, typeof o.paint === 'string' || !o.paint ? H.paint(o.paint || 'plaster') : o.paint,
    o.items.map((it) => ({ position: it.position || at(ctx, it.at[0], it.at[1], it.at[2] || 0), rotation: it.rotation ?? (it.turn || 0), scale: it.scale, color: it.color })));
  mesh.name = 'standin:' + o.name;
  if (o.only) ctx.only(mesh, o.only);
  if (dev.labels && o.items.length) { const it = o.items[0], p = it.position ? (it.position.isVector3 ? it.position.clone() : new THREE.Vector3(...it.position)) : at(ctx, it.at[0], it.at[1], (it.at[2] || 0) + (o.high ?? 1.5)); label(ctx, `${o.name} x ${o.items.length}`, p); }
  return mesh;
}

/**
 * How many of an instanced multitude each pass draws: { mirror: 0.4, pre: 0 } draws 40 % of them in the water's mirror
 * and none in the pre-pass (the picture without the water that the engine takes first). Works for an InstancedMesh and
 * for a Mesh on an InstancedBufferGeometry; the instances are drawn in order, so shuffle them when you make them.
 */
export function passes(mesh, ctx, share = {}) {
  const engine = ctx.engine, geo = mesh.geometry, im = mesh.isInstancedMesh;
  const all = im ? mesh.count : geo.instanceCount;
  mesh.userData.all = all;
  mesh.onBeforeRender = (renderer) => {
    const k = engine.reflecting ? (share.mirror ?? 1) : renderer.getRenderTarget() === engine.pre ? (share.pre ?? 1) : 1, n = Math.round(mesh.userData.all * k);
    if (im) mesh.count = n; else geo.instanceCount = n;
  };
  mesh.onAfterRender = () => { if (im) mesh.count = mesh.userData.all; else geo.instanceCount = mesh.userData.all; };
  return mesh;
}

/**
 * Hanging cloth in the house's light: borders, the backcloth, the fly cloths. (The engine's makeCloth cannot be used here:
 * it takes the realm's general light at full strength, which this room has only a seventh of, it cannot carry one picture
 * across a cloth, and no local light reaches it. This one is gouache with the house's extension, so all of that works.)
 * All the cloths given are ONE mesh, one draw call.
 *   list: [{ at: [s, d, yTop] (the middle of its top edge), width, drop, color, stiff 0..1, tilt (radians: one end lower) }]
 *   opts: paint (a kind, default 'rose'), map (one picture: every cloth's own 0..1 UVs), part (true: hems part round the prow), wake (false: no water-light),
 *         sway (metres the hem stirs, default 0.04), speed, segs [across, down]
 * Returns { mesh, material }. Cloths hang across the route (their faces look up and down it).
 */
export function cloths(ctx, shared, list, opts = {}) {
  const H = house(ctx, ctx.state.plan, shared), o = { paint: 'rose', map: null, part: false, sway: 0.04, speed: 0.2, segs: [28, 14], ...opts };
  const pos = [], uv = [], col = [], aux = [], idx = [], c = new THREE.Color();
  list.forEach((b, bi) => {
    const [nx, ny] = [Math.max(2, Math.round(o.segs[0] * b.width / 26)), o.segs[1]], base = pos.length / 3, top = at(ctx, b.at[0], b.at[1], b.at[2]), q = ctx.path.at(Math.min(ctx.path.length, Math.max(0, b.at[0])));
    c.set(b.color || '#ffffff');
    for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) {
      const u = i / nx, v = j / ny, x = (u - 0.5) * b.width, y = -v * b.drop + (b.tilt ? Math.tan(b.tilt) * x : 0);
      pos.push(top.x + q.rx * x, top.y + y, top.z + q.rz * x); uv.push(u, 1 - v); col.push(c.r, c.g, c.b);
      aux.push(Math.pow(v, 1.4) * (1 - (b.stiff || 0)), bi * 2.39 + u * 3.0, v, b.width);
    }
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const a = base + j * (nx + 1) + i, d = a + nx + 1; idx.push(a, d, a + 1, a + 1, d, d + 1); }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('aCloth', new THREE.Float32BufferAttribute(aux, 4));
  g.setIndex(idx); g.computeVertexNormals();
  const uHead = { value: 0 }, down = ctx.path.at(0);
  const material = H.paint(o.paint, { color: '#ffffff', vertexColors: true, side: THREE.DoubleSide, map: o.map, brush: 0.8, ...(o.wake === undefined ? {} : { wake: o.wake }), extend: {
    defines: o.part ? { CLOTH_PART: '' } : {},
    uniforms: { uClothSway: { value: new THREE.Vector2(o.sway, o.speed) }, uBoatHeading: uHead, uClothAcross: { value: new THREE.Vector2(down.rx, down.rz) } },
    vertexPars: 'attribute vec4 aCloth; uniform vec2 uClothSway, uClothAcross; uniform float uBoatHeading;',
    vertexWorld: /* glsl */`{
      float free = aCloth.x, ph = aCloth.y;
      // slow folds travelling down the cloth and a lazy stir of the hem, along the route; soft pleats that deepen toward the hem
      float fold = sin(uTime * uClothSway.y * 6.3 + ph + aCloth.z * 5.0) * 0.6 + sin(uTime * uClothSway.y * 3.9 + ph * 1.7 + aCloth.z * 2.2) * 0.4;
      vec2 along = vec2(-uClothAcross.y, uClothAcross.x);
      wp.xz += along * (fold * uClothSway.x * free + sin(ph * 7.0 + aCloth.z * 1.5) * 0.05 * (0.3 + 0.7 * aCloth.z));
      #ifdef CLOTH_PART
        // the prow parts whatever hangs in its way: aside from the boat's line, and lifted a little
        vec2 fwd = vec2(-sin(uBoatHeading), -cos(uBoatHeading));
        vec2 rel = wp.xz - uBoat.xz; float ahead = dot(rel, fwd), across = rel.x * fwd.y - rel.y * fwd.x;
        float near = smoothstep(3.6, 0.2, abs(ahead - 0.4)) * smoothstep(1.9, 0.0, abs(across)) * smoothstep(3.4, 1.0, wp.y) * smoothstep(0.0, 0.35, aCloth.z);
        vec2 side = vec2(fwd.y, -fwd.x) * (across >= 0.0 ? 1.0 : -1.0);
        wp.xz += side * near * 1.3; wp.y += near * 0.5;
      #endif
    }` } });
  const mesh = new THREE.Mesh(g, material);
  mesh.name = 'cloths'; mesh.frustumCulled = false;
  ctx.add(mesh);
  ctx.onUpdate(() => { uHead.value = ctx.engine.boat.heading; });
  return { mesh, material };
}
