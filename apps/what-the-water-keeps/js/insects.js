// Insects and other small wanderers: the family's front door. docs/life/insects.md is its page.
//
// The swarms (stateless fields on the GPU: mayflies, midges, moths, sedge flies, motes and lint, bubbles) are in
// swarm.js and re-exported here. This file adds the WATCHED AGENTS: the few that a rider studies from a boat's
// length away, each a small state machine on the CPU, drawn instanced with wings on hinges:
//
//   makeDragonflies   hawkers that patrol a beat (straight legs, dead stops, hovers, pivots), perchers that sally
//                     and come back, perch on a thing and take its transform (the cold prow lantern), dab the water;
//                     with species: 'damselfly', the blue needles that flit from stem to stem, alone or in tandem
//   makePondSkaters   flotillas that row in single strokes, with the dimples under their feet drawn on the water,
//                     their shadows on the bed, and two pin rings a stroke
//   makePearlMoths    a few large pale moths on long crossings between perches, that rest flat
//   makeBees          bees coming home heavy to a hive, walking in; bees working blossom
import * as THREE from 'three';
import { INSECT_GLSL, STIPPLE_GLSL, loadInsectParts, buildInsectGeometry, instanced, litRule, codePart, pixelOnScreen } from './swarm.js';
export * from './swarm.js';

const TAU = Math.PI * 2, DEG = Math.PI / 180;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const col = (c) => (c && c.isColor ? c : new THREE.Color(c ?? '#ffffff'));
const _v = new THREE.Vector3(), _w = new THREE.Vector3(), _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _e = new THREE.Euler(0, 0, 0, 'YXZ'), _m = new THREE.Matrix4();
const wrapPi = (a) => { a = (a + Math.PI) % TAU; return (a < 0 ? a + TAU : a) - Math.PI; };
const count = (ctx, n, exact) => (exact ? Math.round(n) : Math.max(n > 0 ? 1 : 0, Math.round(n * (ctx.quality.density ?? 1))));

// ------------------------------------------------------------------------------------------------ the instanced body
/**
 * One instanced draw for a handful of agents. Each instance carries where it is (aPos: xyz, scale), how it is turned
 * (aQuat), four numbers of state that the species' shader reads (aState) and a tint (aTint: rgb, on). `pose` is GLSL
 * that turns each part about its pivot: it may change `p` (the vertex, relative to its pivot), `nn` (its normal),
 * `off` (a shift in the body's own frame) and `cover` (how much of a thin sheet is drawn, 0..1).
 */
function agentMesh(ctx, geo, n, { pose, pars = '', uniforms = {}, material = {}, lit = null, name = 'insects', tintBlue = false, keepOut = 0.75, minPixels = 0, maxGrow = 2, length = 0.02 }) {
  const S = ctx.engine.shared;
  const aPos = new Float32Array(n * 4), aQuat = new Float32Array(n * 4), aState = new Float32Array(n * 4), aTint = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) { aQuat[i * 4 + 3] = 1; aPos[i * 4 + 1] = -1000; aPos[i * 4 + 3] = 1; aTint.set([1, 1, 1, 0], i * 4); }
  const A = { pos: instanced(geo, 'aPos', aPos, 4, true), quat: instanced(geo, 'aQuat', aQuat, 4, true), state: instanced(geo, 'aState', aState, 4, true), tint: instanced(geo, 'aTint', aTint, 4) };
  geo.instanceCount = n;
  const rule = litRule(ctx, lit);
  const U = { uFlick: { value: 0 }, uKeep: { value: keepOut }, uPx: { value: 0.001 }, uMin: { value: new THREE.Vector3(minPixels, length, maxGrow) }, uPale: { value: new THREE.Vector2(0.14, 0.34) }, ...uniforms };
  const ext = {
    uniforms: U,
    vertexPars: /* glsl */`attribute vec3 aPivot; attribute float aPart, aMem; attribute vec4 aPos, aQuat, aState, aTint; uniform float uFlick, uKeep, uPx; uniform vec3 uMin;
      varying float vThin, vCover; varying vec4 vTint; ${INSECT_GLSL} ${pars}`,
    vertexLocal: /* glsl */`
      vec3 p = transformed, nn = objectNormal, off = vec3(0.0); float cover = 0.62, show = 1.0;
      // the size of one pixel where this creature is, in its own units: thin parts never fall below it. But a creature is drawn up no more
      // than uMin.z times (far off it is a speck, not a giant): beyond the distance where that is reached, it and its thin parts shrink together
      float px = min(uPx * distance(aPos.xyz, cameraPosition) / max(aPos.w, 1e-4), uMin.x > 0.0 ? uMin.z * uMin.y / uMin.x : 1e3);
      ${pose}
      p += aPivot + off;
      vec3 centre = liKeepOut(aPos.xyz, uCameraPos, uKeep);
      float grow = max(1.0, uMin.x * px / uMin.y);                                    // a mote too small for the painter's brush is drawn up to it
      transformed = centre + liQuat(aQuat, p * (aPos.w * show * grow)); objectNormal = liQuat(aQuat, nn);
      vThin = aMem; vCover = cover; vTint = aTint;`,
    fragmentPars: /* glsl */`varying float vThin, vCover; varying vec4 vTint; uniform vec2 uPale; ${STIPPLE_GLSL}`,
    albedo: /* glsl */`${tintBlue ? `{ float cool = clamp((max(albedo.g, albedo.b) - albedo.r) * 3.5, 0.0, 1.0);           // the model's blue (and green) parts take the instance's own colour
        albedo = mix(albedo, vTint.rgb * (dot(albedo, vec3(0.25, 0.45, 0.3)) * 1.7 + 0.08), cool * vTint.a); }` : 'albedo *= mix(vec3(1.0), vTint.rgb, vTint.a);'}
      if (vThin > 0.5) { float pale = smoothstep(uPale.x, uPale.y, dot(albedo, vec3(0.299, 0.587, 0.114)));
        if (liBayer4(gl_FragCoord.xy) + 0.03 > mix(1.0, vCover, pale)) discard; }`,
  };
  const mat = ctx.kit.gouache({ vertexColors: true, side: THREE.DoubleSide, brush: 0.1, ...material, extend: [ext, { ...rule.ext, vertexWorld: 'vLit = liLit(wp.xyz);' }] });
  const mesh = new THREE.Mesh(geo, mat); mesh.name = name; mesh.frustumCulled = false;
  mesh.onBeforeRender = (renderer, scene, camera) => { U.uPx.value = pixelOnScreen(renderer, camera); mat.uniformsNeedUpdate = true; };
  const api = {
    mesh, uniforms: U, rule, aPos, aQuat, aState, aTint,
    /** Write instance i: position, quaternion, scale and its four state numbers. */
    set(i, pos, quat, scale, s0 = 0, s1 = 0, s2 = 0, s3 = 0) {
      aPos[i * 4] = pos.x; aPos[i * 4 + 1] = pos.y; aPos[i * 4 + 2] = pos.z; aPos[i * 4 + 3] = scale;
      aQuat[i * 4] = quat.x; aQuat[i * 4 + 1] = quat.y; aQuat[i * 4 + 2] = quat.z; aQuat[i * 4 + 3] = quat.w;
      aState[i * 4] = s0; aState[i * 4 + 1] = s1; aState[i * 4 + 2] = s2; aState[i * 4 + 3] = s3;
    },
    tint(i, color) { if (color == null) { aTint[i * 4 + 3] = 0; } else { const c = col(color); aTint.set([c.r, c.g, c.b, 1], i * 4); } A.tint.needsUpdate = true; },
    flush() { A.pos.needsUpdate = true; A.quat.needsUpdate = true; A.state.needsUpdate = true; },
  };
  return api;
}

/**
 * A perch: where a creature sits. Any of
 *   { x, y, z }                      a point in the realm (the top of a post, a point on a stem)
 *   { object, offset: [x, y, z] }    a point on a thing, in that thing's own space (an array or a Vector3): the creature
 *                                    TAKES ITS TRANSFORM every frame (the crook of the boat's lantern: object =
 *                                    engine.boat.model.group); for a moth, `normal: [x, y, z]` in the same space is the way
 *                                    the surface faces there (without it the perch is taken to be level)
 *   { at: () => Vector3 }            anything else that moves
 * plus  yaw (radians: which way it faces; default: its back to the realm's light, as dragonflies sit),
 *       pitch (radians nose-up: 1.05 for a damselfly on an upright stem), water: true (a pad on the water).
 */
function perchPoint(p, out) {
  if (p.object) { if (p.offset && p.offset.isVector3) out.copy(p.offset); else out.fromArray(p.offset || [0, 0, 0]); p.object.updateWorldMatrix(true, false); return out.applyMatrix4(p.object.matrixWorld); }
  if (p.at) return out.copy(p.at());
  return out.set(p.x, p.y, p.z);
}
function perchYaw(p, fallback) {
  if (p.object) { _m.extractRotation(p.object.matrixWorld); _e.setFromRotationMatrix(_m, 'YXZ'); return _e.y + (p.yaw ?? 0) + Math.PI; }     // (the boat's nose is its -Z)
  return p.yaw ?? fallback;
}

// keep a point out of the hull (a capsule from stern to bow) and away from the eye
function clearOfBoat(ctx, p, margin = 0.6, eyeKeep = 1.1) {
  const boat = ctx.boat, fx = -Math.sin(boat.heading), fz = -Math.cos(boat.heading);
  const dx = p.x - boat.x, dz = p.z - boat.z, t = clamp(dx * fx + dz * fz, -1.7, 2.6), qx = dx - fx * t, qz = dz - fz * t, d = Math.hypot(qx, qz) || 1e-4, r = 0.75 + margin;
  if (d < r && p.y < 1.9) { p.x += qx / d * (r - d); p.z += qz / d * (r - d); }
  const eye = ctx.engine.shared.uCameraPos.value, ex = p.x - eye.x, ey = p.y - eye.y, ez = p.z - eye.z, de = Math.hypot(ex, ey, ez) || 1e-4;
  if (de < eyeKeep) { p.x += ex / de * (eyeKeep - de); p.y += ey / de * (eyeKeep - de); p.z += ez / de * (eyeKeep - de); }
  return p;
}
// keep a point out of a sphere round the rider's eye (a creature on its way somewhere goes round the rider's head, not through it)
function clearOfEye(ctx, p, keep = 1.0) {
  const eye = ctx.engine.shared.uCameraPos.value, ex = p.x - eye.x, ey = p.y - eye.y, ez = p.z - eye.z, de = Math.hypot(ex, ey, ez) || 1e-4;
  if (de < keep) { p.x += ex / de * (keep - de); p.y += ey / de * (keep - de); p.z += ez / de * (keep - de); }
  return p;
}
const boatDistance = (ctx, x, z) => { const boat = ctx.boat, fx = -Math.sin(boat.heading), fz = -Math.cos(boat.heading), dx = x - boat.x, dz = z - boat.z, t = clamp(dx * fx + dz * fz, -1.7, 2.6); return Math.hypot(dx - fx * t, dz - fz * t); };

// ================================================================================================ dragonflies and damselflies
const ODONATA = {
  hawker: {
    file: 'models/life/dragonfly.glb', length: 0.11, ghosts: 3, beatHz: 11, legs: true,
    // (flap, sweep, twist) in degrees: perched, and the two ends of the stroke, for the fore and the hind wings
    perchF: [-9, -9, 4], perchH: [-7, -4, 3], loF: [-30, 8, -10], hiF: [40, -6, 12], loH: [-30, 6, -10], hiH: [40, -4, 12],
    axisY: 0.0134, bodyR: 0.0065, abR: 0.0031, legR: 0.0006, minPixels: 12, maxGrow: 1.5, keepOut: 0.78,
    cruise: [3, 6], leg: [1, 6], hover: [0.5, 2.5], sally: [15, 70], sallyLength: [2, 4], flick: [9, 15], flush: 2.5, height: 1.2, tint: null,
  },
  damselfly: {
    file: 'models/life/damselfly.glb', length: 0.07, ghosts: 2, beatHz: 9, legs: false,
    perchF: [84, 80, 0], perchH: [86, 83, 0], loF: [-38, 6, -12], hiF: [48, -4, 14], loH: [-38, 6, -12], hiH: [48, -4, 14],
    axisY: 0.0078, bodyR: 0.0028, abR: 0.0012, legR: 0.0004, minPixels: 9, maxGrow: 1.5, keepOut: 0.75,
    cruise: [0.5, 0.8], leg: [1, 3], hover: [0.3, 0.9], sally: [6, 20], sallyLength: [0, 0], flick: [1e9, 1e9], flush: 2.5, height: 0.5, tint: null,
  },
};
const PERCH = 0, TAKEOFF = 1, HOVER = 2, DART = 3, LAND = 4, GONE = 5, DAB = 6;
/**
 * Dragonflies and damselflies: watched agents.
 *
 *   const hawkers = await makeDragonflies(ctx, {
 *     fliers:   [{ beat: [[x, y, z], [x, y, z]], width: 1.5 },                       // patrols the reed edge
 *                { beat: [...], tint: '#b9853a', dab: true }],                      // the tawny female: dabs the water
 *     perchers: [{ perch: { object: ctx.engine.boat.model.group, offset: [0.21, 1.42, -2.34] } },    // the prow lantern's crook
 *                { perch: { x, y, z } }],                                            // the top of a post
 *   });
 *   hawkers.leave(2);                                                                // it goes, and does not come back
 *
 *   const damsels = await makeDragonflies(ctx, { species: 'damselfly', count: 24, perches: [{ x, y, z, pitch: 1.05 }, ...], tandem: 3 });
 *
 * options
 *   species    'hawker' (default: drawn 11 cm) | 'damselfly' (drawn 7 cm)
 *   fliers     [{ beat: [[x, y, z], ...] (a line it patrols end to end; two points or more), width = 1.2 (how far it
 *              strays to either side), tint, dab: false | true (hovers low and dabs the water 3 to 5 times) }]
 *   perchers   [{ perch, tint, sally: [15, 70] seconds between sallies }]   each sits, sallies out and comes back to
 *              the SAME perch; lifts when the bow comes within `flush` metres and resettles when it has passed
 *   count, perches     (damselflies) how many, and the perches they share: each keeps to perches within `range` = 3 m
 *              of its first; tandem: how many PAIRS fly and perch joined (the male ahead, clasping; the female behind)
 *   size       1 = the drawn size above (0.7 is life size for the hawker, 0.46 for the damselfly); minPixels: as it
 *              recedes it is drawn no shorter than this on the screen (hawker 12, damselfly 9: the painter's filter
 *              flattens anything much smaller), and its abdomen, legs and veins never thinner than a pixel or two;
 *              maxGrow 1.5: but never drawn up more than this (beyond about 10 m it shrinks to a speck, as it should)
 *   tint       the colour that takes the place of the model's blue on every one (the model's own blue if not given)
 *   cruise     [3, 6] m/s on a leg (damselfly [0.5, 0.8]); leg: [1, 6] metres a leg; hover: [0.5, 2.5] seconds between
 *              legs; flick: [9, 15] seconds between a perched hawker's wing-flicks
 *   flush      2.5 m; keepOut 0.78 (hawker) or 0.75: its middle from the lens, so no wing tip comes within 0.7 m; ripples true (a dab is ctx.water.ripple(x, z, 0.06, 0.1)); onTouch(x, z, 'dab')
 *   lit        a lit rule (wings rimmed against the sun: 'sun'); material: extra kit.gouache options; mirror: true
 *              (false leaves them out of the water's reflection); seed; parent
 * returns { object, count, agents, leave(i), flushAll(), state(i) -> 'perch' | 'hover' | 'dart' | ..., position(i, out) }
 */
export async function makeDragonflies(ctx, opts = {}) {
  const spc = ODONATA[opts.species || 'hawker'];
  const o = { species: 'hawker', fliers: [], perchers: [], count: 0, perches: [], tandem: 0, range: 3, size: 1, tint: null, keepOut: 0.7, ripples: true, onTouch: null, lit: null, material: {}, mirror: true, seed: 51, ...spc, ...opts };
  const rnd = ctx.rng(o.seed), calm = !!ctx.reducedMotion;
  const parts = await loadInsectParts(ctx, o.file);
  const wingId = { wing_fl: 1, wing_fr: 2, wing_hl: 3, wing_hr: 4 };
  const ids = (name) => (wingId[name] ? [wingId[name]].concat(Array.from({ length: o.ghosts }, (_, g) => wingId[name] + 10 * (g + 1))) : name === 'abdomen' ? 5 : name === 'legs' ? 6 : 0);
  const geo = buildInsectGeometry(parts, ids, { membraneOnly: [11, 12, 13, 14, 21, 22, 23, 24, 31, 32, 33, 34] });
  const ab = parts.find((p) => p.name === 'abdomen'); ab.geometry.computeBoundingBox();
  const abLen = -ab.geometry.boundingBox.min.z;
  // ---- who there is
  const agents = [];
  const key = ctx.engine.shared.uKeyDir.value, sunYaw = Math.atan2(-key.x, -key.z);            // facing the light: its back to whoever comes from behind it
  const mk = (extra) => ({ pos: new THREE.Vector3(0, -50, 0), yaw: 0, pitch: 0, roll: 0, fly: 0, state: PERCH, t: rnd() * 5, phase: rnd(), curl: 0, flick: 0, flickT: lerp(o.flick[0], o.flick[1], rnd()), from: new THREE.Vector3(), to: new THREE.Vector3(),
    dur: 1, wantYaw: 0, perch: null, home: null, beat: null, width: 1.2, dab: false, dabs: 0, follower: null, leader: null, tint: o.tint, speed: 0, away: false, after: HOVER, bob: rnd() * 10, ...extra });
  for (const f of o.fliers) agents.push(mk({ beat: f.beat.map((q) => new THREE.Vector3(...q)), width: f.width ?? 1.2, dab: !!f.dab, tint: f.tint ?? o.tint, state: HOVER, fly: 1, along: rnd(), dir: 1, fresh: true }));
  for (const p of o.perchers) agents.push(mk({ perch: p.perch, home: p.perch, tint: p.tint ?? o.tint, sally: p.sally || o.sally, nextSally: lerp((p.sally || o.sally)[0], (p.sally || o.sally)[1], rnd()) * 0.6 }));
  const nShared = o.species === 'damselfly' || o.count ? count(ctx, o.count, opts.exact || o.count <= 30) : 0;
  const taken = new Set();
  for (let i = 0; i < nShared && o.perches.length; i++) {
    let pi = Math.floor(rnd() * o.perches.length), tries = 0; while (taken.has(pi) && tries++ < 20) pi = Math.floor(rnd() * o.perches.length);
    taken.add(pi);
    agents.push(mk({ perch: o.perches[pi], home: o.perches[pi], shared: true, nextSally: lerp(o.sally[0], o.sally[1], rnd()) }));
  }
  for (let k = 0, made = 0; k < agents.length && made < o.tandem; k++) {                         // pairs: a female joined behind a male
    const a = agents[k]; if (!a.shared || a.follower) continue;
    const f = mk({ leader: a, tint: '#8fa08a' }); a.follower = f; agents.push(f); made++;
  }
  const n = agents.length;
  const r3 = (a) => new THREE.Vector3(a[0] * DEG, a[1] * DEG, a[2] * DEG);
  const body = agentMesh(ctx, geo, n, {
    name: o.species === 'damselfly' ? 'damselflies' : 'dragonflies', lit: o.lit, material: o.material, tintBlue: true, keepOut: o.keepOut, minPixels: o.minPixels, maxGrow: o.maxGrow, length: o.length,
    uniforms: { uPerchF: { value: r3(o.perchF) }, uPerchH: { value: r3(o.perchH) }, uLoF: { value: r3(o.loF) }, uHiF: { value: r3(o.hiF) }, uLoH: { value: r3(o.loH) }, uHiH: { value: r3(o.hiH) },
      uAbLen: { value: abLen }, uGhosts: { value: o.ghosts }, uLegs: { value: new THREE.Vector3(0, 0.00127, -0.00085) }, uThin: { value: new THREE.Vector4(o.axisY, o.bodyR, o.abR, o.legR) } },
    pars: 'uniform vec3 uPerchF, uPerchH, uLoF, uHiF, uLoH, uHiH, uLegs; uniform float uAbLen, uGhosts; uniform vec4 uThin;',
    // aState: x = on the wing (0 perched .. 1 flying), y = this one's own place in the wingbeat, z = how far the abdomen curls down, w = a wing-flick while perched
    pose: /* glsl */`
      float fly = aState.x, wingPart = mod(aPart, 10.0), ghost = floor(aPart / 10.0 + 0.01);
      if (aPart > 0.5 && wingPart > 0.5 && wingPart < 4.5) {
        float side = (wingPart < 1.5 || (wingPart > 2.5 && wingPart < 3.5)) ? 1.0 : -1.0, hindW = step(2.5, wingPart);
        // the crisp wing flicks between the two ends of its stroke; fore and hind beat against each other; the ghosts hang between: a hashed fan
        float s = step(0.5, fract(uFlick + aState.y + hindW * 0.5));
        float f = ghost < 0.5 ? s : fract(s + ghost / (uGhosts + 1.0));
        vec3 lo = mix(uLoF, uLoH, hindW), hi = mix(uHiF, uHiH, hindW), perched = mix(uPerchF, uPerchH, hindW);
        perched += vec3(0.21, -0.1, 0.0) * aState.w * (1.0 - step(1.0, perched.x));          // a flick: the wings lift and settle (not for wings folded over the back)
        vec3 ang = mix(perched, mix(lo, hi, f), smoothstep(0.0, 1.0, fly));
        if (aMem < 0.5) p += nn * max(0.0, 0.42 * px - 0.0003);                                // a vein never thinner than a pixel
        mat3 Hm = liHingeM(side, ang.x, ang.y, ang.z); p = Hm * p; nn = Hm * nn;
        if (ghost > 0.5) { show = step(0.5, fly); cover = 0.14; } else cover = mix(0.27, 0.3, fly);      // (a wing is glass with dark veins: folded along a damselfly's back it must not hide the blue needle under it)
      } else if (aPart < 0.5) {
        float kB = max(1.0, 1.5 * px / uThin.y); p.x *= kB; p.y = uThin.x + (p.y - uThin.x) * kB;                  // far off, the body keeps a pixel and a half of girth
      } else if (aPart > 4.5 && aPart < 5.5) {
        p.xy *= max(1.0, 1.4 * px / uThin.z);                                                  // and the abdomen its three pixels: under the painter's brush a two-pixel needle loses its blue to whatever is behind it
        float along = clamp(-p.z / uAbLen, 0.0, 1.0); mat3 Cm = liRx(-aState.z * along); p = Cm * p; nn = Cm * nn;      // the abdomen curls down from its base
      } else if (aPart > 5.5 && aPart < 6.5) {
        p += nn * max(0.0, 0.4 * px - uThin.w);
        mat3 Lm = liRx(-1.22 * fly); p = Lm * p * (1.0 - 0.45 * fly); nn = Lm * nn; off = uLegs * fly;                    // the basket of legs folds up in flight
      }`,
  });
  const object = body.mesh; (o.parent || ctx.group).add(object);
  if (o.mirror === false) ctx.only(object, 'direct');
  agents.forEach((a, i) => { if (a.tint) body.tint(i, a.tint); });

  // ---- behaviour
  const scale = o.size;
  const beatPoint = (a, out) => {                           // a point on its beat `along` (0..1), strayed a little to the side
    const pts = a.beat, segs = pts.length - 1, x = clamp(a.along, 0, 1) * segs, i = Math.min(segs - 1, Math.floor(x)), u = x - i;
    out.lerpVectors(pts[i], pts[i + 1], u);
    const dx = pts[i + 1].x - pts[i].x, dz = pts[i + 1].z - pts[i].z, l = Math.hypot(dx, dz) || 1, side = (rnd() * 2 - 1) * a.width;
    out.x += -dz / l * side; out.z += dx / l * side; out.y += (rnd() - 0.5) * 0.5;
    return out;
  };
  const beatLength = (a) => { let L = 0; for (let i = 0; i < a.beat.length - 1; i++) L += a.beat[i].distanceTo(a.beat[i + 1]); return L; };
  const dartTo = (a, target, speed, after = HOVER) => {
    clearOfBoat(ctx, target, 0.5, 1.3); target.y = Math.max(target.y, 0.12);
    a.from.copy(a.pos); a.to.copy(target); const L = a.from.distanceTo(a.to);
    a.dur = Math.max(0.12, L / Math.max(0.1, speed) + 0.12); a.t = 0; a.state = DART; a.after = after; a.speed = speed;
    if (L > 0.02) a.wantYaw = Math.atan2(a.to.x - a.from.x, a.to.z - a.from.z);
  };
  // the profile of a dart: a hard start, a steady run, a dead stop (a trapezoid of speed: a fifth of the time getting away, an eighth stopping)
  const dartEase = (x) => { const a = 0.2, d = 0.12, v = 1 / (1 - a / 2 - d / 2); return x < a ? v * x * x / (2 * a) : x < 1 - d ? v * (a / 2 + (x - a)) : 1 - v * (1 - x) * (1 - x) / (2 * d); };
  const nearPerch = (a) => { const home = a.home, list = []; perchPoint(home, _v); for (const p of o.perches) { perchPoint(p, _w); const d = _w.distanceTo(_v); if (d < o.range && p !== a.perch) list.push(p); } return list; };
  const perchBusy = (p, self) => agents.some((b) => b !== self && b.perch === p && !b.away);
  const startHover = (a, seconds) => { a.state = HOVER; a.t = 0; a.dur = seconds; };
  for (const a of agents) if (a.fresh) { beatPoint(a, a.pos); a.to.copy(a.pos); a.yaw = a.wantYaw = rnd() * TAU; a.dur = 0.4 + rnd() * 1.5; a.t = 0; }
  const step = (a, dt) => {
    if (a.leader) return;                                   // (a female in tandem is carried by her male: see below)
    a.t += dt;
    const bowNear = (p) => boatDistance(ctx, p.x, p.z) < o.flush - 0.75;
    switch (a.state) {
      case PERCH: {
        perchPoint(a.perch, a.pos);
        a.yaw = perchYaw(a.perch, sunYaw); a.pitch = a.perch.pitch ?? 0; a.roll = 0;
        if (a.perch.object) { _m.extractRotation(a.perch.object.matrixWorld); _e.setFromRotationMatrix(_m, 'YXZ'); a.pitch += -_e.x; a.roll = _e.z; }
        a.fly = Math.max(0, a.fly - dt * 5);
        a.flickT -= dt; if (a.flickT < 0) { a.flickT = lerp(o.flick[0], o.flick[1], rnd()); a.flick = 1; }
        a.flick = Math.max(0, a.flick - dt * 2.2);
        if (a.nextSally != null) a.nextSally -= dt;
        const flushed = !a.perch.object && bowNear(a.pos);
        if (flushed || a.leaving || (a.nextSally != null && a.nextSally < 0)) {
          a.state = TAKEOFF; a.t = 0; a.flushed = flushed; a.from.copy(a.pos);
          a.nextSally = a.sally ? lerp(a.sally[0], a.sally[1], rnd()) : lerp(o.sally[0], o.sally[1], rnd());
        }
        break;
      }
      case TAKEOFF: {                                       // a quarter of a second: the wings take it, it lifts back and up off the perch
        const x = clamp(a.t / 0.25, 0, 1); a.fly = x;
        a.pos.copy(a.from); a.pos.y += 0.06 * x * x * scale + 0.02 * x; a.pos.x -= Math.sin(a.yaw) * 0.03 * x; a.pos.z -= Math.cos(a.yaw) * 0.03 * x;
        if (x >= 1) {
          if (a.leaving) { a.away = true; _v.set(a.pos.x + Math.sin(a.yaw + 2.2) * 30, a.pos.y + 9, a.pos.z + Math.cos(a.yaw + 2.2) * 30); dartTo(a, _v, 7, GONE); break; }
          a.legs = a.shared ? 1 : 2 + Math.floor(rnd() * 2);
          if (a.shared) {                                   // a damselfly flits to a neighbouring perch (or back to its own): never to one the hull is beside
            const clear = (p) => { perchPoint(p, _w); return boatDistance(ctx, _w.x, _w.z) > o.flush - 0.4; };
            let list = nearPerch(a).filter((p) => !perchBusy(p, a) && clear(p));
            if (!list.length && a.flushed) {                // none near home is clear of the boat: the nearest three that are, wherever they stand
              list = o.perches.filter((p) => !perchBusy(p, a) && clear(p)).map((p) => [perchPoint(p, _w).distanceToSquared(a.pos), p]).sort((p, q) => p[0] - q[0]).slice(0, 3).map((q) => q[1]);
            }
            if (list.length) { a.perch = list[Math.floor(rnd() * list.length)]; }
            perchPoint(a.perch, _v); _v.y += 0.05; dartTo(a, _v, lerp(o.cruise[0], o.cruise[1], rnd()), LAND);
          } else {
            const ang = rnd() * TAU, d = 0.8 + rnd() * 1.6; _v.set(a.pos.x + Math.sin(ang) * d, a.pos.y + 0.3 + rnd() * 0.8, a.pos.z + Math.cos(ang) * d);
            dartTo(a, _v, lerp(o.cruise[0], o.cruise[1], rnd()), HOVER);
          }
        }
        break;
      }
      case HOVER: {
        a.fly = 1;
        const yd = wrapPi(a.wantYaw - a.yaw); a.yaw += clamp(yd, -9 * dt, 9 * dt); a.roll += (clamp(yd, -1, 1) * -0.3 - a.roll) * Math.min(1, dt * 8);     // it pivots on the spot
        a.pitch += (0 - a.pitch) * Math.min(1, dt * 6);
        a.bob += dt; a.pos.y += Math.sin(a.bob * 2.3) * 0.004 * dt * 10; a.pos.x += Math.sin(a.bob * 1.7 + 2) * 0.003 * dt * 10; a.pos.z += Math.cos(a.bob * 1.3) * 0.003 * dt * 10;
        clearOfBoat(ctx, a.pos, 0.35, 0.95);
        if (a.t > a.dur - 0.25 && !a.aimed) {              // near the end of the hover it has chosen where to go, and turns to face it
          a.aimed = true;
          if (a.beat) {
            const L = beatLength(a), leg = lerp(o.leg[0], o.leg[1], rnd() * rnd() + 0.15);
            a.along += a.dir * leg / Math.max(L, 0.1); if (a.along > 1) { a.along = 1 - rnd() * 0.1; a.dir = -1; } else if (a.along < 0) { a.along = rnd() * 0.1; a.dir = 1; }
            if (rnd() < 0.18) a.dir = -a.dir;
            beatPoint(a, a.to);
            if (a.dab && rnd() < 0.3) { a.to.y = 0.09; a.wantDab = true; }
          } else if (a.home) {
            perchPoint(a.home, _w); const leave = !a.flushed || (boatDistance(ctx, _w.x, _w.z) > o.flush + 1.2 && a.t > 0.3);
            if (a.flushed && !leave) { const ang = rnd() * TAU; perchPoint(a.home, _v); a.to.set(_v.x + Math.sin(ang) * 2.2, _v.y + 0.9 + rnd() * 0.9, _v.z + Math.cos(ang) * 2.2); }     // it circles until the boat has passed
            else if (--a.legs > 0 && !a.flushed) { const ang = rnd() * TAU, d = 0.8 + rnd() * 1.4; perchPoint(a.home, _v); a.to.set(_v.x + Math.sin(ang) * d, _v.y + 0.3 + rnd() * 0.7, _v.z + Math.cos(ang) * d); }
            else { perchPoint(a.perch, a.to); a.to.y += 0.07; a.landing = true; a.flushed = false; }
          }
          a.wantYaw = Math.atan2(a.to.x - a.pos.x, a.to.z - a.pos.z);
        }
        if (a.t >= a.dur) {
          a.aimed = false;
          const after = a.wantDab ? DAB : a.landing ? LAND : HOVER; a.wantDab = false; a.landing = false;
          _v.copy(a.to); dartTo(a, _v, lerp(o.cruise[0], o.cruise[1], rnd()), after);
        }
        break;
      }
      case DART: {
        a.fly = 1;
        const x = clamp(a.t / a.dur, 0, 1), e = a.shared ? smooth(0, 1, x) : dartEase(x);
        a.pos.lerpVectors(a.from, a.to, e); clearOfEye(ctx, a.pos, 1.0);
        if (a.shared) a.pos.y += Math.sin(a.t * 19) * 0.012 * Math.sin(Math.PI * x);              // a damselfly's weak flight bobs
        const yd = wrapPi(a.wantYaw - a.yaw); a.yaw += clamp(yd, -12 * dt, 12 * dt);
        a.pitch += ((x < 0.3 ? -0.14 : x > 0.8 ? 0.16 : -0.04) - a.pitch) * Math.min(1, dt * 10);    // nose down as it goes, up as it brakes
        a.roll += (0 - a.roll) * Math.min(1, dt * 6);
        if (x >= 1) {
          if (a.after === GONE) { a.state = GONE; a.pos.y = -50; break; }
          if (a.after === LAND) { a.state = LAND; a.t = 0; a.from.copy(a.pos); break; }
          if (a.after === DAB) { a.state = DAB; a.t = 0; a.dabs = 3 + Math.floor(rnd() * 3); a.from.copy(a.pos); break; }
          startHover(a, a.home && !a.beat && !a.flushed ? lerp(0.25, 0.8, rnd()) : lerp(o.hover[0], o.hover[1], rnd()));      // a percher's sally is short: two to four seconds in all
        }
        break;
      }
      case DAB: {                                           // low over the water: the tip of the abdomen dips, three to five times, 0.6 s apart
        const k = a.t / 0.6, i = Math.floor(k), u = k - i, dip = Math.sin(Math.PI * clamp(u / 0.45, 0, 1));
        a.pos.copy(a.from); a.pos.y = a.from.y - 0.045 * dip; a.curl = 0.42 * dip; a.pitch = 0.2 * dip;
        if (i !== a.lastDab && u > 0.2) { a.lastDab = i; const tx = a.pos.x - Math.sin(a.yaw) * 0.07 * scale, tz = a.pos.z - Math.cos(a.yaw) * 0.07 * scale; if (o.ripples) ctx.water.ripple(tx, tz, 0.06, 0.1); if (o.onTouch) o.onTouch(tx, tz, 'dab'); }
        if (i >= a.dabs) { a.curl = 0; a.lastDab = -1; startHover(a, 0.4 + rnd() * 0.6); a.to.copy(a.pos); a.to.y = lerp(0.5, 1.4, rnd()); a.wantYaw = a.yaw; }
        break;
      }
      case LAND: {                                          // down onto the perch: a third of a second, the wings still going until its feet have it
        const x = clamp(a.t / 0.32, 0, 1); perchPoint(a.perch, _v);
        a.pos.lerpVectors(a.from, _v, smooth(0, 1, x));
        const want = perchYaw(a.perch, sunYaw), yd = wrapPi(want - a.yaw); a.yaw += yd * Math.min(1, dt * 12);
        a.pitch += ((a.perch.pitch ?? 0) - a.pitch) * Math.min(1, dt * 12);
        a.fly = 1 - smooth(0.7, 1, x);
        if (x >= 1) { a.state = PERCH; a.t = 0; }
        break;
      }
      default: break;
    }
  };
  // a wing-flick: up in under a tenth of a second, settling over a third (a.flick runs from 1 to 0 as it happens)
  const flickShape = (f) => { const x = 1 - f; return f <= 0 ? 0 : x < 0.2 ? smooth(0, 0.2, x) : 1 - smooth(0.2, 1, x); };
  const place = (a, i) => {
    _e.set(-a.pitch, a.yaw, a.roll, 'YXZ'); _q.setFromEuler(_e);
    const going = a.state === DART && a.after === GONE ? 1 - smooth(0.75, 1, a.t / a.dur) : 1;      // one that leaves for good dwindles over the last of its way: it does not blink out
    body.set(i, a.pos, _q, a.state === GONE ? 0 : scale * going, a.fly, a.phase, a.curl, flickShape(a.flick));
  };
  const api = {
    object, count: n, agents, uniforms: body.uniforms,
    /** Agent i takes off and goes for good (the dragonfly on the lantern, a second before the flame sets out). */
    leave(i) { const a = agents[i]; if (a && !a.away) { a.leaving = true; if (a.state !== PERCH) { a.away = true; _v.set(a.pos.x + 20, a.pos.y + 8, a.pos.z - 20); dartTo(a, _v, 7, GONE); } } return api; },
    /** Every perched one lifts now (a pad rocked, a gust). */
    flushAll(filter = null) { for (const a of agents) if (a.state === PERCH && !a.leader && (!filter || filter(a))) a.nextSally = -1; return api; },
    state: (i) => ['perch', 'takeoff', 'hover', 'dart', 'land', 'gone', 'dab'][agents[i].state],
    position: (i, out = new THREE.Vector3()) => out.copy(agents[i].pos),
  };
  ctx.onUpdate((dt) => {
    body.uniforms.uFlick.value = (ctx.time * o.beatHz * (calm ? 0.8 : 1)) % 1;
    const d = calm ? dt * 0.8 : dt;
    for (let i = 0; i < n; i++) { const a = agents[i]; if (a.state !== GONE) step(a, d); }
    for (let i = 0; i < n; i++) {
      const a = agents[i];
      if (a.leader) {                                       // in tandem: the female hangs from the male's claspers, in line behind him
        const m = a.leader, L = o.length * scale * 0.84;
        _e.set(-m.pitch, m.yaw, m.roll, 'YXZ'); _q.setFromEuler(_e); _v.set(0, -0.004 * scale, -L).applyQuaternion(_q);
        a.pos.copy(m.pos).add(_v); a.yaw = m.yaw; a.pitch = m.pitch; a.roll = m.roll; a.fly = m.fly; a.state = m.state;
        a.curl = m.state === PERCH && m.perch && m.perch.water ? 0.62 : 0;      // on a pad she curls her abdomen to the water
      }
      place(a, i);
    }
    body.flush();
  });
  return api;
}
/** Damselflies: makeDragonflies with species 'damselfly'. */
export const makeDamselflies = (ctx, opts = {}) => makeDragonflies(ctx, { ...opts, species: 'damselfly' });

// ================================================================================================ pond skaters
const REST = 0, STROKE = 1, GLIDE = 2;
// where its six feet rest on the water, in the model's own space at drawn size (x = left, z = forward): [x, z, the
// direction the foot lies along (radians from forward), half its length, kind]; kind 0 = fore, 1 = oar, 3 = hind
const SKATER_FEET = [[0.0042, 0.0272, 0.1, 0.0032, 0], [-0.0042, 0.0272, -0.1, 0.0032, 0], [0.0457, 0.0175, 1.45, 0.0058, 1], [-0.0457, 0.0175, -1.45, 0.0058, 2], [0.0275, -0.0377, 2.85, 0.0056, 3], [-0.0275, -0.0377, -2.85, 0.0056, 3]];
const SKATER_HIP = [0.00283, 0.00433];                     // the oar's hip (x, z)
/**
 * Pond skaters: flotillas that row. Each rests on the water on six feet, rows ONE stroke with its long middle legs
 * (both together: 8 to 12 cm in under a tenth of a second), glides, stops, rests; it turns only with a stroke. The
 * four long dimples under its middle and hind feet, and the two small ones under its fore feet, are drawn on the
 * water; over a shallow bed each casts the skater's shadow: dark ovals with bright rims. Every stroke writes two pin
 * rings.
 *
 *   const skaters = await makePondSkaters(ctx, {
 *     flotillas: [{ at: [14, -8.6], count: 30, radius: 1.4, shadow: true }, { at: [28, 6], count: 35, radius: 2.5 }],
 *     shadows: { y: -0.35 },
 *   });
 *
 * options
 *   flotillas  [{ at: [s, d] | position: [x, z], count = 30, radius = 1.8, shadow: true | false }]
 *   size       1 = drawn with a 3 cm body, 10 cm across the oars (0.3 is life size); minPixels 7 (as it recedes it
 *              is drawn no smaller than this across), maxGrow 2.5 (but never drawn up more than this: beyond about
 *              28 m it shrinks away)
 *   stroke     [0.08, 0.12] metres a stroke; rest: [1, 4] seconds between strokes
 *   scatterAt  3 m: when a hull UNDER WAY (faster than 0.25 m/s) is this near they row away, 4 to 6 quick strokes, each
 *              stopping where its own nerve lets it (up to 1.6 m further: never a row of them along a line that is not
 *              there), and go back to their own places over `regroup` = 8 s. A hull that has lain still two or three
 *              seconds is a log to them: they rest right beside it (1.15 m from its centre line), never under it
 *   dimples    true; shadows: null | { y: the bed's height (below 0), strength = 0.62, rim = 0.45 }
 *   ripples    true: a stroke within `ripplesWithin` = 12 m of the boat writes two rings (0.05, 0.12), at most
 *              `ripplesPerSecond` = 20 in all; onTouch(x, z, 'stroke')
 *   mirror     false: so small and so close to the water that their reflection lies under them; true draws it
 *   lit, material, seed, exact, parent
 * returns { object, dimples, shadows, count, agents, scatter(x, z, r) }
 */
export async function makePondSkaters(ctx, opts = {}) {
  const o = { flotillas: [], size: 1, minPixels: 7, maxGrow: 2.5, stroke: [0.08, 0.12], rest: [1, 4], scatterAt: 3, regroup: 8, dimples: true, shadows: null, ripples: true, ripplesWithin: 12, ripplesPerSecond: 20, onTouch: null,
    lit: null, material: {}, mirror: false, seed: 61, exact: false, ...opts };
  const { kit } = ctx, rnd = ctx.rng(o.seed), S = ctx.engine.shared, calm = !!ctx.reducedMotion;
  const parts = await loadInsectParts(ctx, 'models/life/pond_skater.glb');
  const geo = buildInsectGeometry(parts, (nm) => (nm === 'oar_l' ? 1 : nm === 'oar_r' ? 2 : 0));
  const fl = o.flotillas.map((g) => { const p = g.position ? new THREE.Vector3(g.position[0], 0, g.position[g.position.length - 1]) : kit.at(g.at[0], g.at[1] ?? 0, 0); return { x: p.x, z: p.z, radius: g.radius ?? 1.8, n: count(ctx, g.count ?? 30, o.exact), shadow: g.shadow ?? true }; });
  const agents = [];
  for (const f of fl) for (let j = 0; j < f.n; j++) { const a = rnd() * TAU, r = Math.sqrt(rnd()) * f.radius, x = f.x + Math.cos(a) * r, z = f.z + Math.sin(a) * r;
    agents.push({ f, x, z, hx: x, hz: z, nerve: rnd() * rnd() * 1.6, yaw: rnd() * TAU, v: 0, state: REST, t: 0, wait: rnd() * o.rest[1], oar: -0.2, lift: 0, flash: 0, turn: 0, quick: 0, regroup: 0 }); }      // (hx, hz: its own place in the flotilla; nerve: how much sooner than its neighbours it gives way to a moving hull)
  const n = agents.length;
  const body = agentMesh(ctx, geo, n, {
    name: 'pond skaters', lit: o.lit, material: { brush: 0, ...o.material }, minPixels: o.minPixels, maxGrow: o.maxGrow, length: 0.1,
    // aState: x = the oars' sweep (radians: positive carries the feet backward), y = how far they are lifted on the way forward again
    pose: /* glsl */`float thin = step(0.0018, abs(p.x + aPivot.x));                              // legs (everything out from the body's own width): never thinner than a pixel
      p += nn * thin * max(0.0, 0.45 * px - 0.0006);
      if (aPart > 0.5) { mat3 Hm = liHingeM(aPart < 1.5 ? 1.0 : -1.0, aState.y * 0.1, aState.x, 0.0); p = Hm * p; nn = Hm * nn; }
      else if (thin < 0.5) { float kB = max(1.0, 1.1 * px / 0.003); p.x *= kB; p.y = 0.0073 + (p.y - 0.0073) * kB; }`,
  });
  const object = new THREE.Group(); object.name = 'pond skaters'; object.add(body.mesh); (o.parent || ctx.group).add(object);
  if (!o.mirror) ctx.only(body.mesh, 'direct');
  // ---- the dimples on the water, and their shadows on the bed: six small quads a skater, sharing its instance data
  const feet = (withBody) => {
    const g = new THREE.InstancedBufferGeometry(), pos = [], foot = [], kind = [], idx = [];
    const list = SKATER_FEET.concat(withBody ? [[0, -0.002, 0, 0.016, 4]] : []);
    list.forEach((f, i) => { for (const c of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { pos.push(c[0], c[1], 0); foot.push(f[0], f[1], f[2], f[3]); kind.push(f[4]); } idx.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3); });
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aFoot', new THREE.Float32BufferAttribute(foot, 4)); g.setAttribute('aKind', new THREE.Float32BufferAttribute(kind, 1)); g.setIndex(idx);
    for (const k of ['aPos', 'aQuat', 'aState']) g.setAttribute(k, geo.attributes[k]);
    g.instanceCount = n; return g;
  };
  const aShade = new Float32Array(n); agents.forEach((a, i) => { aShade[i] = a.f.shadow ? 1 : 0; });
  const grow = new THREE.Vector4(o.minPixels, 0.1, 0.001, o.maxGrow);          // min pixels, the length they are measured on, the size of a pixel at one metre (set per pass), the most it is drawn up
  const dimpleMat = (shadow) => {
    const sh = { y: -0.35, strength: 0.62, rim: 0.45, ...(o.shadows || {}) };
    return new THREE.ShaderMaterial({
      uniforms: { uFogColor: S.uFogColor, uFogDensity: S.uFogDensity, uVeil: S.uVeil, uKeyDir: S.uKeyDir, uHip: { value: new THREE.Vector2(SKATER_HIP[0], SKATER_HIP[1]) }, uBed: { value: new THREE.Vector4(sh.y, sh.strength, sh.rim, 0) }, uHide: { value: 0 },
        uRim: { value: col(o.rimColor ?? '#fff1d0').clone() }, uGrow: { value: grow } },
      transparent: true, depthWrite: false, fog: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
      vertexShader: /* glsl */`${INSECT_GLSL} attribute vec4 aFoot, aPos, aQuat, aState; attribute float aKind${shadow ? ', aShade' : ''}; uniform vec2 uHip; uniform vec4 uBed, uGrow; uniform vec3 uKeyDir; uniform float uHide;
        varying vec2 vQ, vDirW; varying float vDist, vK, vBody;
        void main() {
          float side = aFoot.x >= 0.0 ? 1.0 : -1.0, oar = step(0.5, aKind) * step(aKind, 2.5);
          vec3 f = vec3(aFoot.x, 0.0, aFoot.y); float ang = aFoot.z;
          if (oar > 0.5) { vec3 hip = vec3(side * uHip.x, 0.0, uHip.y); f = hip + liRy(side * aState.x) * (f - hip); ang += aState.x * side; }      // the oars' feet travel with the stroke
          vec3 along = vec3(sin(ang), 0.0, cos(ang)), across = vec3(along.z, 0.0, -along.x);
          float hl = aFoot.w * ${shadow ? '1.9' : '1.5'}, hw = (aKind > 3.5 ? 0.0045 : aFoot.w * 0.62) * ${shadow ? '1.9' : '1.5'};
          vec3 local = f + along * (position.x * hl) + across * (position.y * hw);
          float grow = clamp(uGrow.x * uGrow.z * distance(aPos.xyz, cameraPosition) / (uGrow.y * max(aPos.w, 1e-4)), 1.0, uGrow.w);       // (as the skater itself is drawn up, far off)
          vec3 w = aPos.xyz + liQuat(aQuat, local * aPos.w * grow);
          vDirW = liQuat(aQuat, along * position.x * 0.6 + across * position.y).xz;
          vK = (1.0 - oar * aState.y) * step(uHide, 0.5)${shadow ? ' * aShade' : ''}; vBody = step(3.5, aKind);
          ${shadow ? 'vec3 L = normalize(uKeyDir); float depth = max(0.0, aPos.y - uBed.x); w.xz += L.xz / max(0.35, -L.y) * depth; w.y = uBed.x + 0.012; ' : 'w.y = aPos.y + 0.0015;'}
          vQ = position.xy; vec4 mv = viewMatrix * vec4(w, 1.0); vDist = length(mv.xyz); gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */`uniform vec3 uFogColor, uRim, uKeyDir; uniform float uFogDensity, uVeil; uniform vec4 uBed; varying vec2 vQ, vDirW; varying float vDist, vK, vBody;
        void main() {
          float r = length(vQ); if (r > 1.0 || vK < 0.01) discard;
          // a dimple bends the light away from its middle and piles it up at its rim: a dark oval with a bright edge
          float core = (1.0 - smoothstep(${shadow ? '0.4, 0.78' : '0.12, 0.8'}, r)) * ${shadow ? 'uBed.y' : '0.34'};
          float rim = smoothstep(${shadow ? '0.68, 0.84' : '0.52, 0.76'}, r) * (1.0 - smoothstep(${shadow ? '0.9' : '0.84'}, 1.0, r)) * (1.0 - vBody);
          ${shadow ? 'rim *= uBed.z;' : 'rim *= 0.16 + 0.5 * max(0.0, dot(normalize(vDirW + 1e-5), -normalize(uKeyDir.xz + 1e-5)));'}
          float fog = (1.0 - (1.0 - exp(-uFogDensity * uFogDensity * vDist * vDist))) * (1.0 - uVeil) * vK;
          gl_FragColor = vec4(uRim * rim * fog, core * fog);
        }`,
    });
  };
  let dimples = null, shadows = null;
  const prePass = (mesh, hide) => { mesh.onBeforeRender = (r, sc, cam) => { grow.z = pixelOnScreen(r, cam); mesh.material.uniforms.uHide.value = hide && r.getRenderTarget() === ctx.engine.pre ? 1 : 0; mesh.material.uniformsNeedUpdate = true; }; };
  if (o.dimples) { dimples = new THREE.Mesh(feet(false), dimpleMat(false)); dimples.name = 'skater dimples'; dimples.frustumCulled = false; dimples.renderOrder = 0; ctx.only(dimples, 'direct'); prePass(dimples, true); object.add(dimples); }
  if (o.shadows) { const g = feet(true); instanced(g, 'aShade', aShade, 1); shadows = new THREE.Mesh(g, dimpleMat(true)); shadows.name = 'skater shadows'; shadows.frustumCulled = false; shadows.renderOrder = -2; ctx.only(shadows, 'direct'); prePass(shadows, false); object.add(shadows); }

  // ---- behaviour
  const scale = o.size, TAU_GLIDE = 0.24;
  let ringBudget = 0, under = 0;                            // under: 0 the hull lies still (they take it for a log), 1 it is under way (they keep clear of it)
  const forced = [];
  const HULL = 1.15;                                        // a still hull: they rest right beside it, never under it
  // How near the hull a skater lets it come. Under way: `scatterAt`, and a little more for each skater (its own nerve), so that
  // the ones that have rowed clear stop at different distances and never stand in a row along a line that is not there.
  const shy = (a) => HULL + (o.scatterAt - 0.75 + a.nerve - HULL) * under;
  const chooseStroke = (a) => {
    const boat = ctx.boat, hd = boatDistance(ctx, a.x, a.z), dx = a.x - a.hx, dz = a.z - a.hz, out = Math.hypot(dx, dz);
    let want;
    const fz = forced.find((q) => Math.hypot(a.x - q.x, a.z - q.z) < q.r);
    const home = boatDistance(ctx, a.hx, a.hz) > shy(a) + 0.3;      // is its own place in the flotilla clear of the hull?
    if (hd < shy(a) || fz) {                                // the hull (or something else large) is near: away from it
      const ox = fz ? fz.x : boat.x, oz = fz ? fz.z : boat.z;
      if (fz || under > 0.5) {                              // under way: quickly, 4 to 6 strokes
        want = Math.atan2(a.x - ox, a.z - oz) + (rnd() - 0.5) * 0.9;
        if (a.quick <= 0) a.quick = 4 + Math.floor(rnd() * 3);
      } else {                                              // lying still: one unhurried stroke out from under its side
        const fx = -Math.sin(boat.heading), fzz = -Math.cos(boat.heading), t = clamp((a.x - boat.x) * fx + (a.z - boat.z) * fzz, -1.7, 2.6);
        want = Math.atan2(a.x - (boat.x + fx * t), a.z - (boat.z + fzz * t)) + (rnd() - 0.5) * 1.2;
      }
      a.regroup = o.regroup;
    } else if (!home) want = a.yaw + (rnd() - 0.5) * 2.4;                    // the hull is where it lives: it idles where it is until the hull has gone
    else if (out > 0.35 + 0.25 * a.f.radius || a.regroup > 0) want = Math.atan2(-dx, -dz) + (rnd() - 0.5) * (a.regroup > 0 ? 0.7 : 1.2);      // back toward its own place in the flotilla
    else want = a.yaw + (rnd() - 0.5) * 2.4;
    if (!fz && hd >= shy(a)) {                              // never a stroke that would carry it in under the hull's side
      const len = o.stroke[1] * scale * 1.6, nx = a.x + Math.sin(want) * len, nz = a.z + Math.cos(want) * len;
      if (boatDistance(ctx, nx, nz) < shy(a)) want += Math.PI * (0.5 + rnd() * 0.5) * (rnd() < 0.5 ? -1 : 1);
    }
    for (const b of agents) {                               // not onto a neighbour: they keep a hand's breadth apart
      if (b === a || b.f !== a.f) continue;
      const bx = b.x - a.x, bz = b.z - a.z, d = Math.hypot(bx, bz);
      if (d < 0.14 * scale + 0.04 && Math.cos(Math.atan2(bx, bz) - want) > 0.3) want = Math.atan2(-bx, -bz) + (rnd() - 0.5) * 0.8;
    }
    a.turn = wrapPi(want - a.yaw); if (Math.abs(a.turn) > 1.4) a.turn = Math.sign(a.turn) * 1.4;         // it turns with the stroke, never without one
    a.len = lerp(o.stroke[0], o.stroke[1], rnd()) * scale * (a.quick > 0 ? 1.5 : 1);
    a.state = STROKE; a.t = 0; a.yaw0 = a.yaw;
    if (ringBudget >= 1 && (o.ripples || o.onTouch) && Math.hypot(a.x - boat.x, a.z - boat.z) < o.ripplesWithin) {
      ringBudget -= 1;
      const c = Math.cos(a.yaw), s = Math.sin(a.yaw);
      for (const sx of [-1, 1]) { const lx = sx * 0.0457 * scale, lz = 0.0175 * scale, x = a.x + lx * c + lz * s, z = a.z - lx * s + lz * c; if (o.ripples) ctx.water.ripple(x, z, 0.05, 0.12); if (o.onTouch) o.onTouch(x, z, 'stroke'); }
    }
  };
  const api = {
    object, body: body.mesh, dimples, shadows, count: n, agents,
    /** Something large at (x, z): those within r row away from it now. */
    scatter(x, z, r = 3, seconds = 1.5) { forced.push({ x, z, r, t: seconds }); for (const a of agents) if (Math.hypot(a.x - x, a.z - z) < r && a.state === REST) a.wait = Math.min(a.wait, rnd() * 0.25); return api; },
  };
  ctx.onUpdate((dt) => {
    ringBudget = Math.min(4, ringBudget + dt * o.ripplesPerSecond * 0.5);
    for (let i = forced.length - 1; i >= 0; i--) if ((forced[i].t -= dt) <= 0) forced.splice(i, 1);
    { const sp = ctx.boat.speed || 0, to = sp > 0.25 ? 1 : sp < 0.1 ? 0 : under; under += clamp(to - under, -dt / 2.5, dt / 0.6); }      // a hull under way alarms them within half a second; one that has stopped is a log after two and a half
    const d = calm ? dt * 0.8 : dt;
    for (let i = 0; i < n; i++) {
      const a = agents[i]; a.t += d; a.regroup = Math.max(0, a.regroup - d); a.flash = Math.max(0, a.flash - d * 3);
      if (a.state === REST) {
        a.v *= Math.exp(-d / 0.1); a.oar += (-0.2 - a.oar) * Math.min(1, d * 6); a.lift = Math.max(0, a.lift - d * 4);
        const hd = boatDistance(ctx, a.x, a.z);
        if (a.t >= a.wait || (hd < shy(a) && a.t > (under > 0.5 ? 0.12 : 0.5))) chooseStroke(a);
      } else if (a.state === STROKE) {                      // the power stroke: under a tenth of a second
        const x = clamp(a.t / 0.085, 0, 1), e = smooth(0, 1, x);
        a.oar = lerp(-0.2, 0.86, e); a.lift = 0; a.yaw = a.yaw0 + a.turn * e; a.v = (a.len / TAU_GLIDE) * e; a.flash = 1;
        if (x >= 1) { a.state = GLIDE; a.t = 0; }
      } else {                                              // the glide: it runs on, slowing; the oars come forward again, lifted clear
        a.v *= Math.exp(-d / TAU_GLIDE);
        const x = clamp((a.t - 0.08) / 0.4, 0, 1); a.oar = lerp(0.86, -0.2, smooth(0, 1, x)); a.lift = Math.sin(Math.PI * x);
        if (a.v < 0.025 * scale + 0.01 && x >= 1) { a.state = REST; a.t = 0; a.quick -= 1; a.wait = a.quick > 0 ? 0.06 + rnd() * 0.12 : a.regroup > 0 ? 0.3 + rnd() * 0.7 : lerp(o.rest[0], o.rest[1], rnd()); }
        else if (a.quick > 0 && a.t > 0.2) { a.quick -= 1; chooseStroke(a); }
      }
      a.x += Math.sin(a.yaw) * a.v * d; a.z += Math.cos(a.yaw) * a.v * d;
      const hd = boatDistance(ctx, a.x, a.z);              // never under the hull
      if (hd < 0.95) { const boat = ctx.boat, fx = -Math.sin(boat.heading), fz = -Math.cos(boat.heading), dx = a.x - boat.x, dz = a.z - boat.z, t = clamp(dx * fx + dz * fz, -1.7, 2.6), qx = dx - fx * t, qz = dz - fz * t, q = Math.hypot(qx, qz) || 1e-4; a.x += qx / q * (0.95 - hd); a.z += qz / q * (0.95 - hd); }
      _v.set(a.x, ctx.water.heightAt(a.x, a.z), a.z); _e.set(0, a.yaw, 0, 'YXZ'); _q.setFromEuler(_e);
      body.set(i, _v, _q, scale, a.oar, a.lift, a.flash, 1);
    }
    body.flush();
  });
  return api;
}

// ================================================================================================ pearl moths
/**
 * Pearl moths: a few large pale moths that make long crossings between perches, the body rising and dipping with
 * every slow wingbeat, and rest flat and open for a long while where they land.
 *
 *   const pearls = await makePearlMoths(ctx, { count: 9, perches: [{ x, y, z, nx, ny, nz }, ...],
 *     lantern: { object: ctx.engine.boat.model.group, offset: [0.21, 1.42, -2.34] } });
 *
 * options
 *   count      9; perches: [{ x, y, z, nx, ny, nz } | { object, offset, normal }]   (the normal of what they rest on; up if
 *              not given: on an upright face the moth lies against it head up, and is seen whole; lying on top of a
 *              thing above the rider's eye it is seen edge-on, as a line)
 *   size       1 = 8 cm across the spread wings; minPixels 10 (as it recedes it is drawn no smaller than this across:
 *              it must be seen on a crossing 30 m off), maxGrow 5 (but never drawn up more than this);
 *              color: '#c4d6d0' multiplies its pearl paint
 *   speed      1.5 m/s; beat: 7 a second; dip: 0.06 m the body rises and falls a beat; crossing: [20, 40] metres
 *              (the perch it chooses next is that far away if there is one); rest: [20, 60] seconds
 *   lantern    a perch on the boat: when the boat has held still for `stillFor` = 5 s with a moth within `within` =
 *              25 m, one comes and lands on it, wings flat, and stays until the boat makes way. Give the side of the
 *              crook's stem that faces the rider, with its normal: { object, offset: [0.004, 1.1, -2.345], normal: [0, 0, 1] }
 *   keepOut    0.75; mirror: true; lit; material; seed
 * returns { object, count, agents, send(i, perchIndex), state(i) }
 */
export async function makePearlMoths(ctx, opts = {}) {
  const o = { count: 9, perches: [], size: 1, minPixels: 10, maxGrow: 5, color: '#c4d6d0', speed: 1.5, beat: 7, dip: 0.06, crossing: [20, 40], rest: [20, 60], lantern: null, stillFor: 5, within: 25, keepOut: 0.75, lit: null, material: {}, mirror: true, seed: 71, ...opts };
  const rnd = ctx.rng(o.seed), calm = !!ctx.reducedMotion;
  const parts = await loadInsectParts(ctx, 'models/life/moth.glb');
  const geo = buildInsectGeometry(parts, (nm) => ({ wing_fl: 1, wing_fr: 2, wing_hl: 3, wing_hr: 4 }[nm] ?? 0));
  const n = Math.min(o.count, Math.max(1, o.perches.length));
  const body = agentMesh(ctx, geo, n, {
    name: 'pearl moths', lit: o.lit, material: { color: o.color, brush: 0, ...o.material }, keepOut: o.keepOut, minPixels: o.minPixels, maxGrow: o.maxGrow, length: 0.08,
    uniforms: { uPale: { value: new THREE.Vector2(2, 3) } },
    // aState: x = on the wing (0 at rest, flat and open .. 1), y = the wings' angle now (radians above level), z = the body's dip
    pose: /* glsl */`float fly = aState.x;
      if (aPart > 0.5) { float side = (aPart < 1.5 || (aPart > 2.5 && aPart < 3.5)) ? 1.0 : -1.0, hindW = step(2.5, aPart);
        mat3 Hm = liHingeM(side, fly * aState.y, mix(mix(0.35, 0.105, hindW), 0.03, fly), fly * 0.12 * cos(aState.y * 1.4)); p = Hm * p; nn = Hm * nn; }
      off = vec3(0.0, aState.z, 0.0);`,
  });
  const object = body.mesh; (o.parent || ctx.group).add(object);
  if (o.mirror === false) ctx.only(object, 'direct');
  const agents = [], used = new Set();
  for (let i = 0; i < n; i++) { let pi = Math.floor(rnd() * o.perches.length), tries = 0; while (used.has(pi) && tries++ < 30) pi = Math.floor(rnd() * o.perches.length); used.add(pi);
    agents.push({ pos: new THREE.Vector3(), perch: pi, state: 0, t: rnd() * 10, wait: lerp(o.rest[0], o.rest[1], rnd()) * rnd(), fly: 0, from: new THREE.Vector3(), to: new THREE.Vector3(), dur: 1, yaw: rnd() * TAU, pitch: 0, roll: 0, phase: rnd() * TAU, seed: rnd() * 100, restYaw: rnd() * TAU, visiting: false, prev: new THREE.Vector3(), up: null, upv: new THREE.Vector3() }); }
  const perch = (a) => (a.visiting ? o.lantern : o.perches[a.perch]);
  const perchUp = (a, P) => {                              // the way the thing it rests on faces there (null: it is level)
    if (P.object) { if (!P.normal) return (a.up = null); _m.extractRotation(P.object.matrixWorld); return (a.up = a.upv.fromArray(P.normal).applyMatrix4(_m).normalize()); }
    return (a.up = P.nx != null ? a.upv.set(P.nx, P.ny, P.nz) : null);
  };
  const depart = (a, pi, visit = false) => {
    a.from.copy(a.pos); a.visiting = visit; if (!visit) a.perch = pi;
    perchPoint(perch(a), a.to); a.dur = Math.max(1.5, a.from.distanceTo(a.to) / (o.speed * (calm ? 0.8 : 1))); a.state = 1; a.t = 0;
  };
  const nextPerch = (a) => {
    const here = a.pos, cand = [], other = [];
    o.perches.forEach((p, i) => { if (i === a.perch || agents.some((b) => b !== a && b.perch === i && !b.visiting)) return; perchPoint(p, _w); const d = _w.distanceTo(here); (d >= o.crossing[0] && d <= o.crossing[1] ? cand : other).push([d, i]); });
    const list = cand.length ? cand : other.sort((p, q) => q[0] - p[0]).slice(0, 3);
    return list.length ? list[Math.floor(rnd() * list.length)][1] : a.perch;
  };
  let still = 0;
  const api = { object, count: n, agents, send(i, pi) { depart(agents[i], pi); return api; }, state: (i) => ['rest', 'crossing', 'landing'][agents[i].state] };
  ctx.onUpdate((dt) => {
    const boat = ctx.boat; still = boat.speed < 0.15 ? still + dt : 0;
    const visitor = agents.find((a) => a.visiting);
    if (o.lantern && !visitor && still > o.stillFor) {        // the boat is holding still: one comes to its lantern
      perchPoint(o.lantern, _w); let best = null, bd = o.within;
      for (const a of agents) { const d = a.pos.distanceTo(_w); if (d < bd && a.state === 0) { bd = d; best = a; } }
      if (best) depart(best, best.perch, true);
    }
    for (let i = 0; i < n; i++) {
      const a = agents[i]; a.t += dt; a.prev.copy(a.pos);
      const P = perch(a);
      if (a.state === 0) {                                  // at rest, flat and open
        perchPoint(P, a.pos); a.fly = Math.max(0, a.fly - dt / 0.3); perchUp(a, P);
        a.yaw = P.object && !P.normal ? perchYaw(P, 0) + a.restYaw * 0.15 : a.restYaw;
        if (a.visiting ? boat.speed > 0.3 : a.t > a.wait) { a.t = 0; a.state = 3; }
      } else if (a.state === 3) {                           // a third of a second of flutter before it lets go
        a.fly = Math.min(1, a.fly + dt / 0.3); perchPoint(P, a.pos); perchUp(a, P);
        if (a.up) a.pos.addScaledVector(a.up, 0.04 * a.fly); else a.pos.y += 0.04 * a.fly;
        if (a.fly >= 1) depart(a, nextPerch(a));
      } else if (a.state === 1) {                           // the crossing: never straight, the body rising and dipping
        a.fly = 1; perchPoint(P, a.to); a.up = null;
        const u = clamp(a.t / a.dur, 0, 1), e = smooth(0, 1, u), L = a.from.distanceTo(a.to), arc = Math.sin(Math.PI * u);
        const dx = a.to.x - a.from.x, dz = a.to.z - a.from.z, l = Math.hypot(dx, dz) || 1, s = e * L;
        const side = (Math.sin(s * 0.42 + a.seed) * 1.3 + Math.sin(s * 1.1 + a.seed * 1.7) * 0.5) * arc;
        a.pos.lerpVectors(a.from, a.to, e); a.pos.x += -dz / l * side; a.pos.z += dx / l * side;
        a.pos.y += arc * Math.min(2.2, 0.4 + L * 0.05) + Math.sin(s * 0.7 + a.seed * 2.3) * 0.35 * arc;
        clearOfBoat(ctx, a.pos, 0.3, 1.0); a.pos.y = Math.max(a.pos.y, 0.35 * arc + 0.02);
        if (u >= 1) { a.state = 2; a.t = 0; a.from.copy(a.pos); }
      } else {                                              // landing: the wings still going until it has hold
        const u = clamp(a.t / 0.3, 0, 1); perchPoint(P, _w); a.pos.lerpVectors(a.from, _w, u); a.fly = 1 - smooth(0.5, 1, u); perchUp(a, P);
        if (u >= 1) { a.state = 0; a.t = 0; a.wait = lerp(o.rest[0], o.rest[1], rnd()); a.restYaw = rnd() * TAU; }
      }
      // heading follows velocity, with a bank into the turn; at rest it lies on its perch
      if (a.state === 1) {
        const vx = a.pos.x - a.prev.x, vz = a.pos.z - a.prev.z, want = Math.atan2(vx, vz);
        if (Math.hypot(vx, vz) > 1e-5) { const yd = wrapPi(want - a.yaw); a.yaw += clamp(yd, -4 * dt, 4 * dt); a.roll += (clamp(yd * 2.5, -0.6, 0.6) - a.roll) * Math.min(1, dt * 5); }
        a.pitch += (0.3 - a.pitch) * Math.min(1, dt * 5);
      } else { a.roll *= 1 - Math.min(1, dt * 8); a.pitch *= 1 - Math.min(1, dt * 8); }
      a.phase += dt * o.beat * TAU * (calm ? 0.8 : 1);
      const wing = 1.08 * Math.sin(a.phase), dip = a.fly * (-0.5 * o.dip * Math.sin(a.phase - 0.9) - 0.006);
      _e.set(-a.pitch, a.yaw, -a.roll, 'YXZ'); _q.setFromEuler(_e);
      if (a.up && Math.abs(a.up.y) < 0.75 && a.fly < 1) {     // on an upright face: head up; it turns onto it as its feet take hold
        _v.set(0, 1, 0).addScaledVector(a.up, -a.up.y).normalize(); _w.crossVectors(a.up, _v).normalize();
        _m.makeBasis(_w, a.up, _v); _q2.setFromRotationMatrix(_m); _q.slerp(_q2, 1 - a.fly);
      }
      body.set(i, a.pos, _q, o.size, a.fly, wing, dip, 0);
    }
    body.flush();
  });
  return api;
}

// ================================================================================================ bees
/**
 * Bees: dark motes that come home heavy to a hive in the last of the light, land on the board and walk in; or that
 * work blossom, flower to flower. No stripes, no loops, and they stop.
 *
 *   const bees = makeBees(ctx, { hives: [{ entrance: [x, y, z], face: [0, 1] }], homing: 40, walkers: 12, from: [60, 3, 0] });
 *   ctx.stage.cue('night', { s: 170 }, () => bees.stop());
 *   const workers = makeBees(ctx, { flowers: [{ x, y, z }, ...], foragers: 8 });
 *
 * options
 *   hives      [{ entrance: [x, y, z] (the slot, at the level of its landing board), face: [x, z] (the way it looks),
 *              board: [0.4, 0.12] (width and depth of the landing board) }]
 *   homing     how many are on their way home at once (40); every: seconds between arrivals (1.5); from: [x, y, z]
 *              a point far off that they come from (they are first seen `far` = 45 m out); speed: [1.5, 2.5] m/s
 *   walkers    how many are on the boards (12), walking in
 *   flowers    [{ x, y, z }] and foragers: how many work them: a few seconds on each, a short hop to the next
 *   size       1 = drawn 2 cm (life is 1.3); minPixels 5.5: as it recedes a bee is drawn up to this many pixels long, a
 *              dark mote (the painter's filter flattens anything smaller), maxGrow 6 (but no more than six times: beyond
 *              about 17 m it fades to nothing); color '#2a2218'; keepOut 0.75; mirror: true; lit; material; seed
 * returns { object, count, stop(), start(), agents }
 */
export function makeBees(ctx, opts = {}) {
  const o = { hives: [], homing: 0, every: 1.5, from: null, far: 45, speed: [1.5, 2.5], walkers: 0, flowers: [], foragers: 0, size: 1, minPixels: 5.5, maxGrow: 6, color: '#2a2218', keepOut: 0.75, lit: null, material: {}, mirror: true, seed: 81, exact: false, ...opts };
  const rnd = ctx.rng(o.seed), calm = !!ctx.reducedMotion;
  const D = o.color, Wg = '#b9b4a4';
  const parts = [
    codePart('body', [0, 0, 0], [[0, 0, 0.009], [0.0032, -0.0008, 0.001], [-0.0032, -0.0008, 0.001], [0, 0.0034, 0.001], [0, -0.001, -0.0095], [0.0026, -0.001, -0.004], [-0.0026, -0.001, -0.004], [0, 0.0026, -0.004]],
      [[0, 1, 3], [0, 3, 2], [0, 2, 1], [1, 5, 7], [1, 7, 3], [2, 3, 7], [2, 7, 6], [1, 2, 6], [1, 6, 5], [4, 7, 5], [4, 6, 7], [4, 5, 6]], D),
    codePart('legs', [0, 0, 0], [[0.0012, -0.001, -0.001], [-0.0012, -0.001, -0.001], [0.002, -0.007, -0.005], [-0.002, -0.007, -0.005]], [[0, 2, 1], [1, 2, 3]], D, 'membrane'),
    codePart('wing_l', [0.0012, 0.003, 0.002], [[0.0012, 0.003, 0.002], [0.0125, 0.0036, 0.0005], [0.011, 0.0036, -0.0055], [0.002, 0.003, -0.002]], [[0, 1, 2], [0, 2, 3]], Wg, 'membrane'),
    codePart('wing_r', [-0.0012, 0.003, 0.002], [[-0.0012, 0.003, 0.002], [-0.0125, 0.0036, 0.0005], [-0.011, 0.0036, -0.0055], [-0.002, 0.003, -0.002]], [[0, 2, 1], [0, 3, 2]], Wg, 'membrane'),
  ];
  const geo = buildInsectGeometry(parts, (nm) => ({ wing_l: 1, wing_r: 2, legs: 6 }[nm] ?? 0));
  const nHome = count(ctx, o.homing, o.exact), nWalk = o.hives.length ? count(ctx, o.walkers, o.exact || o.walkers <= 12) : 0, nFor = o.flowers.length ? count(ctx, o.foragers, o.exact || o.foragers <= 12) : 0, n = nHome + nWalk + nFor;
  const body = agentMesh(ctx, geo, Math.max(1, n), {
    name: 'bees', lit: o.lit, material: { brush: 0, ...o.material }, keepOut: o.keepOut, minPixels: o.minPixels, maxGrow: o.maxGrow, length: 0.019,
    uniforms: { uPale: { value: new THREE.Vector2(0.3, 0.55) } },
    // aState: x = on the wing (the wings a blur) or walking (folded back along the body)
    pose: /* glsl */`float fly = aState.x;
      if (aPart > 0.5 && aPart < 2.5) { float side = aPart < 1.5 ? 1.0 : -1.0, s = step(0.5, fract(uFlick + aPos.x * 3.0 + aPos.z * 7.0));
        mat3 Hm = liHingeM(side, fly * mix(-0.5, 0.9, s), mix(1.25, 0.0, fly), 0.0); p = Hm * p; nn = Hm * nn; cover = mix(1.0, 0.4, fly); }
      else if (aPart > 5.5) { p.y *= mix(0.45, 1.0, fly); }`,
  });
  const object = body.mesh; (o.parent || ctx.group).add(object);
  if (o.mirror === false) ctx.only(object, 'direct');
  const hives = o.hives.map((h) => { const e = new THREE.Vector3(...h.entrance), f = h.face || [0, 1], l = Math.hypot(f[0], f[1]) || 1; return { e, fx: f[0] / l, fz: f[1] / l, w: (h.board || [0.4, 0.12])[0], d: (h.board || [0.4, 0.12])[1] }; });
  const from = o.from ? new THREE.Vector3(...o.from) : null;
  const agents = [];
  let running = true;
  const board = (h, u, v, out) => out.set(h.e.x + h.fx * v * h.d - h.fz * u * h.w, h.e.y, h.e.z + h.fz * v * h.d + h.fx * u * h.w);     // u across the board, v out from the slot
  const cycle = Math.max(1, nHome) * o.every;                // one bee's whole round, most of it beyond sight
  const launch = (a) => {                                  // a bee comes into sight, `far` metres out, on its line home
    const sp = lerp(o.speed[0], o.speed[1], rnd()), h = a.hive; board(h, (rnd() - 0.5) * 0.8, 0.5 + rnd() * 0.4, a.to);
    if (from) { _v.copy(from).sub(a.to); _v.y = 0; _v.normalize(); } else _v.set(h.fx, 0, h.fz);
    a.from.copy(a.to).addScaledVector(_v, o.far).add(_w.set((rnd() - 0.5) * 8, 2.2 + rnd() * 3.5, (rnd() - 0.5) * 8));
    a.dur = o.far / sp; a.state = 0; a.t = 0;
  };
  for (let i = 0; i < nHome; i++) {                         // they are met mid-evening: some already on their way in
    const a = { kind: 0, pos: new THREE.Vector3(0, -50, 0), t: 0, state: -1, hive: hives[i % Math.max(1, hives.length)], from: new THREE.Vector3(), to: new THREE.Vector3(), dur: 1, yaw: 0, fly: 1, seed: rnd() * 100, u: 0, v: 0 };
    const ph = rnd() * cycle; agents.push(a);
    if (a.hive && ph < o.far / 2) { launch(a); a.t = ph * (a.dur / (o.far / 2)); } else a.t = -(cycle - ph);
  }
  for (let i = 0; i < nWalk; i++) agents.push({ kind: 1, pos: new THREE.Vector3(), t: rnd() * 5, state: 0, hive: hives[i % hives.length], u: (rnd() - 0.5), v: rnd(), tu: (rnd() - 0.5), tv: rnd(), yaw: rnd() * TAU, fly: 0, seed: rnd() * 100, hidden: 0 });
  for (let i = 0; i < nFor; i++) { const f = o.flowers[Math.floor(rnd() * o.flowers.length)]; agents.push({ kind: 2, pos: new THREE.Vector3(f.x, f.y, f.z), t: rnd() * 4, state: 0, flower: f, wait: 2 + rnd() * 5, from: new THREE.Vector3(), to: new THREE.Vector3(), dur: 1, yaw: rnd() * TAU, fly: 0, seed: rnd() * 100 }); }
  const api = { object, count: n, agents, stop() { running = false; return api; }, start() { running = true; return api; } };
  ctx.onUpdate((dt) => {
    body.uniforms.uFlick.value = (ctx.time * 13) % 1;
    const d = calm ? dt * 0.8 : dt;
    for (let i = 0; i < agents.length; i++) {
      const a = agents[i]; a.t += d; let scale = o.size, pitch = 0;
      if (a.kind === 0) {
        if (a.state === -1) {                               // beyond sight
          scale = 0;
          if (a.t >= 0 && running && a.hive) launch(a);
        } else if (a.state === 0) {                         // the heavy, slightly sinking line home, slowing over the last metres
          const u = clamp(a.t / a.dur, 0, 1), e = 1 - Math.pow(1 - u, 1.6);
          a.pos.lerpVectors(a.from, a.to, e); a.pos.y = lerp(a.from.y, a.to.y, Math.pow(e, 1.5)) + 0.25 * Math.sin(Math.PI * Math.min(1, (1 - e) * 6)) * (1 - e);
          const wob = (1 - e) * 0.18; a.pos.x += Math.sin(a.t * 2.1 + a.seed) * wob; a.pos.z += Math.cos(a.t * 1.7 + a.seed) * wob; clearOfEye(ctx, a.pos, 1.0);
          a.yaw = Math.atan2(a.to.x - a.from.x, a.to.z - a.from.z); a.fly = 1; pitch = 0.3;
          if (u >= 1) { a.state = 1; a.t = 0; a.fly = 0; a.u = 0; }
        } else {                                            // on the board: it walks in
          const h = a.hive, k = clamp(a.t / 3.2, 0, 1); a.pos.lerpVectors(a.to, _v.copy(h.e), k); a.yaw = Math.atan2(h.e.x - a.to.x, h.e.z - a.to.z); a.fly = 0;
          if (k >= 1) { a.state = -1; a.t = -Math.max(0.5, cycle - o.far / 2 - 3.2) * (0.8 + 0.4 * rnd()); a.pos.y = -50; }
        }
      } else if (a.kind === 1) {                            // a bee on the landing board: a few steps, a pause, sometimes in at the slot and out again
        const h = a.hive; a.hidden = Math.max(0, a.hidden - d);
        const du = a.tu - a.u, dv = a.tv - a.v, l = Math.hypot(du * h.w, dv * h.d);
        if (l < 0.004) { if (a.t > a.pause) { if (!running && rnd() < 0.5) { a.tu = 0; a.tv = 0; a.leaving = true; } else if (a.v < 0.02) { a.hidden = a.leaving ? 1e9 : 2 + rnd() * 6; a.tu = (rnd() - 0.5) * 0.9; a.tv = 0.3 + rnd() * 0.7; } else { a.tu = rnd() < 0.2 ? 0 : (rnd() - 0.5) * 0.9; a.tv = a.tu === 0 ? 0 : rnd(); } a.t = 0; a.pause = 0.4 + rnd() * 2.5; } }
        else { const stepLen = Math.min(l, 0.035 * d * (0.6 + 0.4 * Math.sin(a.t * 9 + a.seed))); a.u += du * h.w / l * stepLen / h.w; a.v += dv * h.d / l * stepLen / h.d; a.yaw = Math.atan2(h.fx * dv * h.d - h.fz * du * h.w, h.fz * dv * h.d + h.fx * du * h.w); }
        board(h, a.u, a.v, a.pos); if (a.hidden > 0) scale = 0;
      } else {                                              // working blossom: a while on a flower, a short hop to another
        if (a.state === 0) { a.fly = Math.max(0, a.fly - d * 6); a.pos.set(a.flower.x + Math.sin(a.t * 1.3 + a.seed) * 0.006, a.flower.y, a.flower.z + Math.cos(a.t * 1.1 + a.seed) * 0.006); a.yaw += Math.sin(a.t * 0.9 + a.seed) * d * 1.5;
          if (a.t > a.wait) { let best = a.flower, tries = 0; while (tries++ < 8) { const f = o.flowers[Math.floor(rnd() * o.flowers.length)]; if (f !== a.flower && Math.hypot(f.x - a.pos.x, f.y - a.pos.y, f.z - a.pos.z) < 2.2) { best = f; break; } }
            a.from.copy(a.pos); a.flower = best; a.to.set(best.x, best.y, best.z); a.dur = Math.max(0.5, a.from.distanceTo(a.to) / lerp(0.5, 1.1, rnd())) + 0.4; a.state = 1; a.t = 0; } }
        else { a.fly = Math.min(1, a.fly + d * 8); const u = clamp(a.t / a.dur, 0, 1), e = smooth(0, 1, u), arc = Math.sin(Math.PI * u);
          a.pos.lerpVectors(a.from, a.to, e); a.pos.y += arc * 0.12; a.pos.x += Math.sin(a.t * 6 + a.seed) * 0.03 * arc; a.pos.z += Math.cos(a.t * 5 + a.seed) * 0.03 * arc; clearOfEye(ctx, a.pos, 1.0);
          if (u < 0.9) a.yaw = Math.atan2(a.to.x - a.from.x, a.to.z - a.from.z); pitch = 0.3;
          if (u >= 1) { a.state = 0; a.t = 0; a.wait = 2 + rnd() * 6; } }
      }
      _e.set(-pitch * a.fly, a.yaw, 0, 'YXZ'); _q.setFromEuler(_e);
      body.set(i, a.pos, _q, scale, a.fly, 0, 0, 0);
    }
    body.flush();
  });
  return api;
}
