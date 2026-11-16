// The standing sky: THE CAST (docs/art/sky.md, section 5). Group "Lights" of the cast is whole here (8 November:
// docs/build/sky/3-cast-lights.md); the three bird blocks below it are still the layout's STAND-INS, which their own
// groups take out by name from their own modules (cast_flock.js, cast_sleepers.js):
//
//   the lights (rows 2, 3 and 16)           the lights family (docs/life/lights.md): 1,400 fallen stars on the bed with 24
//                                           spares, falling stars and their embers, the shared pool of rings, the lift
//                                           front. The family keeps the instances, the clocks, the rings and the handles
//                                           (shared.bed, shared.falls, shared.rings, shared.cast.lights); the picture is
//                                           drawn by the area's own dabs and hairlines (light.js), as soft above as their
//                                           twins below. They breathe, those within 3 m of the prow lantern brighten, a
//                                           landing lights a new one; told to rise they lift, ring the water and go out at
//                                           the sunline. The showstopper's beats are staging's: only the wave goes by itself.
//   the flock (row 8)                       3,000 birds asleep on one leg, 54 triangles each, one instanced draw; on the
//                                           clock they lift with the wind front and turn from lilac-grey to pink as they
//                                           climb through the sunline (again a first look, not the cast's flight)
//   the sleepers (row 7)                    36, at 2,400 triangles (the cost of the real ones); the four in the channel are soft colliders
//   the terns (row 6)                       6 teardrops on stakes 2, 3, 5, 6, 8 and 9
//
// THE CAST TABLE, and where each row stands after stage 1:
//    1 stars and their reflections (V)      BUILT (set.js: 2,600 in four sizes, twinkle, breathers, the dawn's fade)
//    2 fallen stars (S)                     BUILT here (shared.bed); their pebbles and scour hollows are the kit's (shared.pebbles), laid from here
//    3 falling stars (M)                    BUILT here (shared.falls): ambient from s 46; the three scripted landings (s 46, 66, 100) are staging's
//    4 brine shrimp (S)                     none: 6,000 in a box 14 m square that follows the boat (the `fish` family)
//    5 moths (S)                            the engine's: 3 at the kept lamp; 3 at the far lamp, which come when it is lit
//    6 terns (M)                            stand-in here; perches in shared.stakes (tern: true)
//    7 the sleepers (M)                     stand-in here; places in plan.sleepers
//    8 the flock (M to V)                   stand-in here; areas in plan.flock; three ribbons R1, R2, R3
//    9 feathers (S)                         none: 40 under R1 at t 34 to 40
//   10 the ring of standers (V)             stand-in in heroes.js (the monument's kin)
//   11 the skein (V)                        stand-in in heroes.js
//   12 the great wader (V)                  stand-in in heroes.js: three poses for ten clips
//   13 the aurora (V)                       BUILT as a base (set.js: a function of direction in the sky's shader; it drives the key light)
//   14 weathervane, pail, shutter (M)       still stand-ins on the hut (heroes_b.js)
//   15 sedge and salt dust (S)              sedge stands (kit.js), still; dust: none
//   16 the rising (V)                       its controls, here (shared.bed, shared.cast.lights.wave and .lift); the wave goes by itself until staging takes it
//   17 the wind front (V)                   BUILT as a base (set.js: shared.sky.front, shared.sky.wind; the water's front)
//   18 caustic nets (S)                     none (the water's caustics on the sand from e 0.35)
//   19 first light and the sunline (V)      BUILT (set.js and light.js: by distance only)
import { smooth, lerp, clamp01 } from './plan.js';
import { makeBedLights, makeFallingStars, makeRings, makeFront } from '../../engine/life/lights.js';

export async function build(ctx, plan, shared) {
  const { THREE, kit } = ctx, P = plan, C = P.colors, sky = shared.sky, path = ctx.path, sh = ctx.engine.shared, tmp = {};
  const uShow = { value: -1 };                                                   // the showstopper's clock, for the bird stand-ins' first look at the lift

  // ---------------------------------------------------------------------------------------------- the lights that fall, lie and rise
  // Cast rows 2, 3 and 16 (group "Lights": docs/build/sky/3-cast-lights.md), all from the lights family:
  //   shared.rings   makeRings: the pool of 64 drawn rings for everyone (rings.touch(x, z, { ripple, radius }) is a real
  //                  ripple inside the water's window round the boat and a drawn ring outside it)
  //   shared.bed     makeBedLights, after the water: the fallen stars on the layout's own placement list. The family's
  //                  handle as it is (tick, rise, riseWith, riseAll, hold, settle, nearest, within, take, place, bear,
  //                  spare, level, positionOf, sunline, count) and bed.onRise = (x, z, i, near) => {} for sound
  //   shared.falls   makeFallingStars: fall({ to, seconds, from }), fall({ az, el }), set({ every, landOne, landAt }),
  //                  level; falls.onLand = (x, z, near) => {} for sound. A landing lights a spare on the bed.
  //   shared.cast.lights   { bed, falls, rings, lift (the front: a line from the east at 30 m/s, ragged by 0.8 s),
  //                  wave({ at, reach, origin, dir }) sends the lift front and has every light not yet told rise with it,
  //                  auto (true: the wave goes by itself at t 5 of the show clock; staging sets it false and sends its own),
  //                  ambient (true: falls by where the boat is; false: staging's own), list (the placement list),
  //                  stones(on) (the family's own stones in place of the kit's pebbles), pools }
  // What is the area's own here, and why: the far ones are thinned at the seam (below), the pools of lit sand are the
  // layout's (the family's halo lies on the mirror as a dash), the bodies are the kit's modelled pebbles in their
  // hollows (shared.pebbles, kit_shallows.js), kept in step with whatever the handle is told.
  // Looking: &fall=az,el,at sends a plain streak (ending az degrees right of dead ahead, el up) `at` seconds in;
  // &land=ahead,right,at,seconds an ember that lands that many metres ahead and to the right of the boat;
  // &lights=raw the family untouched (no thinning at the seam, its own halo and stones); &lights=stones its stones.
  const lights = (() => {
    const F = P.fallen, rnd = ctx.rng(23), list = [], lampAt = kit.at(P.lamp.at[0], P.lamp.at[1] + 0.7), R = P.ridge, Cw = P.causeway;
    const query = new URLSearchParams(location.search), dev = (query.get('lights') || '').split(','), raw = dev.includes('raw');
    const bedAt = (s, d) => -lerp(P.depth.line, P.depth.edge, s < 150 ? smooth(24, 36, Math.abs(d)) : s > 232 ? smooth(20, 32, Math.abs(d)) : 0);      // (set.js: depthAt)
    const ok = (x, z) => {
      const l = path.locate(x, z, null, tmp), s = l.s, d = l.d;
      if (s < P.lamp.at[0] && Math.abs(x - lampAt.x) < P.lamp.lane / 2 && s > 20) return false;                 // the lamp's lane: its stroke lies unbroken
      if (Math.hypot(x - lampAt.x, z - lampAt.z) < 1.4) return false;
      if (s > Cw.from - 1 && s < Cw.to + 1 && Math.abs(d) > Cw.inner - 0.6 && Math.abs(d) < Cw.inner + Cw.width + 0.6) return false;      // not under the causeways
      if (s > R.s[0] - R.skirt && d < R.d[1] + R.skirt && d > R.d[0] - R.skirt) return false;                    // nor under the ridge
      if (s > 232 && d < -23) return false;                                                                       // nor under the crust terraces
      return true;
    };
    // (the layout's list, number for number: the same seeded draws in the same order, so every light lies where the
    // set's pictures were judged; t0 is now never, the rising is told through the handle)
    const add = (x, z, far) => {
      const l = path.locate(x, z, null, tmp), tint = rnd() < 1 / 9 ? (rnd() < 0.5 ? '#bfe9d8' : '#e6c4d8') : C.starWhite;
      rnd();                                                                     // (the layout's own lift time was drawn here)
      list.push({ x, y: bedAt(l.s, l.d), z, s: l.s, d: l.d, size: 0.075 + 0.03 * rnd(), light: 1.7 + 1.3 * rnd() * rnd(), color: tint, phase: rnd(), rate: 1 / (9 + 5 * rnd()), t0: 1e9, far });
    };
    // close to the line one to every 5 by 5 m, then one to every 8 by 8 m out to 40 m; never in rows
    for (let s = 10; s < P.end + 4; s += F.inner.cell) for (let d = -F.inner.half; d < F.inner.half; d += F.inner.cell) { const p = kit.at(s + rnd() * F.inner.cell, d + rnd() * F.inner.cell); if (ok(p.x, p.z)) add(p.x, p.z, false); }
    for (let s = 10; s < P.end + 4; s += F.near.cell) for (const side of [-1, 1]) for (let d = F.inner.half; d < F.near.half; d += F.near.cell) { const p = kit.at(s + rnd() * F.near.cell, side * (d + rnd() * F.near.cell)); if (ok(p.x, p.z)) add(p.x, p.z, false); }
    for (const [ds, dd] of [[-2.6, 1.9], [1.8, -2.8], [3.1, 2.2]]) { const p = kit.at(P.lamp.at[0] + ds, P.lamp.at[1] + 0.7 + dd); add(p.x, p.z, false); }      // three within 4 m of the kept lamp
    // the rest thin out to 250 m (the far ones are what a lower quality gives up)
    const want = Math.max(list.length, kit.count(F.count));
    for (let tries = 0; list.length < want && tries < 20000; tries++) { const s = -60 + rnd() * 440, d = (rnd() < 0.5 ? -1 : 1) * (F.near.half + (F.reach - F.near.half) * Math.pow(rnd(), 1.7)), p = kit.at(Math.max(0, Math.min(322, s)), d); p.z -= s < 0 ? s : s > 322 ? s - 322 : 0; if (ok(p.x, p.z)) add(p.x, p.z, true); }
    shared.fallen = list;
    if (dev.includes('off')) return { update() {} };                             // (&lights=off: none of this group, for measuring; the kit then lays its pebbles itself)

    // ---- the family's three systems
    const SPARES = 24, L = { auto: true, ambient: true, waved: false, waveAt: 5, dawn: [0.3, 0.75], list };
    const rings = makeRings(ctx, { pool: 64, color: C.starWhite, intensity: 1.2, grow: 2, life: 6 });
    const bed = makeBedLights(ctx, { points: list.map((st) => [st.x, st.y, st.z]), after: true, exact: true, rings, spares: SPARES, seed: 29,
      color: C.starWhite, tinted: 0, intensity: 1.7, size: [0.075, 0.105], breathe: 0.2, breatheEvery: [9, 14], lantern: { reach: 3, gain: 0.5 },
      halo: 0.6, haloLevel: raw ? 0.16 : 0,                                      // (its light on the sand is the layout's pools, below)
      speed: 0.5, gain: 0.22, drift: [0, 0.2],                                   // straight up, gaining; west is +z here (the route runs down -z)
      sunline: sky.sunlineY, sunlineSoft: P.sunlineSoft, ring: { ripple: 0.35, radius: 0.6 },
      onRise: (x, z, i, near) => { if (bed.onRise) bed.onRise(x, z, i, near); } });
    const falls = makeFallingStars(ctx, { rings, every: null, landOne: 4, landAt: [60, 250], color: C.starWhite, tail: C.violet, intensity: 2.0, arc: [12, 28], streak: [0.9, 1.6], sink: 3.5, seed: 81,
      onLand: (x, z, near) => {
        // a new fallen star lights where it came down (not on the hull's own place, the causeways or the ridge)
        const i = ok(x, z) && Math.hypot(x - ctx.boat.x, z - ctx.boat.z) > 2.5 ? bed.spare() : -1;
        if (i >= 0) { const l = path.locate(x, z, null, tmp); bed.place(i, x, z); aBed.setY(i, bedAt(l.s, l.d)); aBed.needsUpdate = true; bed.bear(i); }
        if (falls.onLand) falls.onLand(x, z, near);
      } });
    // the lift front: only ever asked WHEN (each light's lift-off is its arrival); a line from the east, toward +z
    const lift = makeFront(ctx, { name: 'lift', shape: 'line', speed: 30, rag: 0.8, rise: 0.5, dir: [0, 0, 1], clock: () => sky.T });
    const meet = kit.at(P.show.s + 11.6 * 1.1, 0);                               // where the carried boat is 11.6 s in: the wave passes it then
    L.wave = (o = {}) => { const k = lift.launch({ at: o.at ?? L.waveAt, dir: o.dir ?? [0, 0, 1], ...(o.origin ? { origin: o.origin } : { reach: o.reach ?? { x: meet.x, y: 0, z: meet.z, at: 11.6 } }) }); bed.riseWith(lift, k); L.waved = true; return k; };

    // ---- the draw: the area's own dabs on the family's instances
    // The family draws a light as a hard disc kept to two pixels, with a stone for its body near the eye. Here that was
    // wrong three ways (.shots/sky_lights_p1_a_look.png, the first try): far lights are lifted clear of the sand, so each
    // stood ABOVE the water with a twin in the mirror, a row of lamps along the seam; a hard dot beside the mirror's soft
    // stars is glitter; and within 15 m the point gives way to the stone, which here is the kit's pebble under the water,
    // so the nearest lights were the dimmest. So the family keeps everything but the picture: its instances (place, lift
    // time, birth), its clock, its level, its rings, its spares. The points are drawn by the area's dabs (light.js): round,
    // soft, as soft above as their twins below once they have risen, and never in the mirror while they lie.
    const bedMesh = bed.object.children[0], stoneMesh = bed.object.children[1], G = bedMesh.geometry, aBed = G.attributes.aBed, aStar = G.attributes.aStar, bedMat = bedMesh.material, total = aBed.count;
    // (HANG: each light hangs on its pebble's top, 2.4 cm over the bed, as the kit's log asks; the layout hung it 4.5 cm up)
    // light is ADDED and the picture's own alpha left alone (the sky marks itself there for the painter's filter: light.js)
    for (const m of [bedMat, rings.object.material, falls.object.material]) { Object.assign(m, sky.ADD); m.needsUpdate = true; }
    bed.object.name = 'fallen stars (the family\'s own draw: hidden)'; rings.object.name = 'rings on the water (the shared pool)'; falls.object.name = 'falling stars';
    const HANG = 0.024, born = new Float32Array(total).fill(-1e9), dabList = [];
    for (let i = 0; i < total; i++) { const st = list[i] || { x: 0, y: -0.13, z: 0, size: 0.09, light: 2.2, color: C.starWhite, phase: rnd(), rate: 1 / (9 + 5 * rnd()), far: false }; if (i >= list.length) born[i] = 1e9;
      dabList.push({ x: st.x, y: st.y + HANG, z: st.z, size: st.size, light: st.light, halo: 1.25, color: st.color, phase: st.phase, rate: st.rate, t0: 1e9, rank: st.far ? 0 : 1 }); }
    const dabs = sky.dabs(dabList, { metres: true, maxPx: 5, twinkle: 0.2, fog: 1, after: true, gain: 1, seed: 29,
      extend: { uniforms: { uClock: bedMat.uniforms.uClock, uRise: bedMat.uniforms.uRise, uBedLevel: bedMat.uniforms.uLevel, uLanternPos: sh.uLanternPos },
        pars: 'attribute float aBorn; uniform float uClock, uBedLevel; uniform vec4 uRise; uniform vec3 uLanternPos;',
        vertex: /* glsl */`
          float tau = uClock - aDabB.z, risen = 0.0;
          if (tau > 0.0) { p += vec3(uRise.z * tau, uRise.x * tau + 0.5 * uRise.y * tau * tau, uRise.w * tau); risen = smoothstep(0.0, 1.5, p.y); }      // straight up at walking pace and gaining, drifting west (the family's own numbers)
          // (drawn a hand nearer the eye along the eye's own line, which moves nothing on the picture: the light is one
          // point in depth, and the near half of its own pebble stood in front of it, a dark pupil in the middle of the glow)
          p += normalize(cameraPosition - p) * 0.09;
          { vec3 dc = p - cameraPosition; float dn = max(length(dc), 1e-3); p += dc / dn * max(0.0, 0.7 - dn); }             // it passes the eye at arm's length, never nearer
          light *= uBedLevel * smoothstep(0.0, 2.0, uTime - aBorn);                                                           // all of them (first light); one that has just landed comes alight over two seconds
          light *= 1.0 - smoothstep(uSunline.x - 0.5 * uSunline.y, uSunline.x + 0.5 * uSunline.y, p.y);                      // it goes out as it crosses the sunline
          light *= 1.0 + 0.5 * (1.0 - smoothstep(1.5, 3.5, distance(p.xz, uLanternPos.xz))) * (1.0 - risen);                 // those within 3 m of the prow lantern brighten by half
          { // on the bed, far ones sink into the mist line as the low stars do above it, and thin with distance; in the air they are stars
            float dd = distance(p, cameraPosition), down = degrees(asin(clamp((cameraPosition.y - p.y) / max(dd, 1e-3), 0.0, 1.0)));
            light *= mix((0.05 + 0.95 * smoothstep(0.0, 2.2, down)) * exp(-dd / 55.0), 1.0, risen); }` } });
    dabs.geometry.setAttribute('aBorn', new THREE.BufferAttribute(born, 1));
    dabs.points.name = 'fallen stars (lights on the bed)';
    bedMesh.visible = raw; stoneMesh.visible = raw || dev.includes('stones'); dabs.points.visible = !raw;
    L.stones = (on) => { stoneMesh.visible = !!on; if (L.pebbles) L.pebbles.group.visible = !on; };      // the family's own stones in place of the kit's pebbles
    L.dabs = dabs;

    // ---- the falling stars' picture: the area's hairlines and dabs on the family's own flights
    // The family's streak is a hair one to two pixels wide with a hard edge, the same in both pictures; the water's
    // mirror is read back softer, so the train that showed in the sky was lost in the water and the head was a different
    // line above and below (.shots/sky_lights_mirror_a_flip.png: the sky, the water turned over, and their difference).
    // The family keeps the flights (when, where from, where to, the ember's fall, the landing, its ring, never two in one
    // quarter of the sky); each is drawn here from its own numbers: the streak as fourteen hairs of light end to end, white
    // at the head thinning to violet, the ember as one round dab. Both are light.js's, as soft above as below.
    const fGeo = falls.object.geometry, fA = fGeo.attributes.aA.array, fB = fGeo.attributes.aB.array, fC = fGeo.attributes.aC.array, fU = falls.object.material.uniforms;
    const POOL = fGeo.attributes.aA.count, SEG = 14, FAR = 700, headC = new THREE.Color(C.starWhite).multiplyScalar(2.0), tailC = new THREE.Color(C.violet).multiplyScalar(1.2);
    const streaks = sky.hairlines(Array.from({ length: POOL * SEG }, (_, n) => ({ a: [0, -50, 0], b: [0, -50, 0], light: 0, width: 1.7 })), { short: 0, fog: 0 });      // (one width: stouter at the head, the joints showed as steps; the light alone thins it)
    const embers = sky.dabs(Array.from({ length: POOL }, () => ({ x: 0, y: -50, z: 0, size: 0.11, light: 0, halo: 1, phase: 0, rate: 0, rank: 1 })), { metres: true, maxPx: 5, twinkle: 0, fog: 0.8, after: true, seed: 83 });
    streaks.mesh.name = 'falling stars (streaks)'; embers.points.name = 'falling stars (embers)';
    falls.object.visible = raw; streaks.mesh.visible = embers.points.visible = !raw;
    const hairC = streaks.geometry.attributes.aHair, lit = new Uint8Array(POOL * SEG), glowing = new Uint8Array(POOL), va = [0, 0, 0], vb = [0, 0, 0], eye = sh.uCameraPos.value;
    const toward = (i4, u, out) => { const x = fA[i4] + (fB[i4] - fA[i4]) * u, y = fA[i4 + 1] + (fB[i4 + 1] - fA[i4 + 1]) * u, z = fA[i4 + 2] + (fB[i4 + 2] - fA[i4 + 2]) * u, l = FAR / (Math.hypot(x, y, z) || 1); out[0] = eye.x + x * l; out[1] = eye.y + y * l; out[2] = eye.z + z * l; return out; };
    const drawFalls = () => {
      const now = sh.uTime.value, level = fU.uLevel.value, sink = fU.uSink.value;
      let dirty = false;
      for (let i = 0; i < POOL; i++) {
        // (the family's own law, number for number: a plain streak crosses at a nearly even pace and burns out over the last
        // third of its way, its train hanging a moment; one that comes on down slows to where its ember begins and is drawn up into it)
        const i4 = i * 4, age = now - fA[i4 + 3], dur = Math.max(fB[i4 + 3], 0.05), t01 = age / dur, lands = fC[i4 + 2] >= 0.01, after = Math.max(age - dur, 0);
        let e = clamp01(t01); e = lands ? 1 - (1 - e) * (1 - e) : e * (1 - 0.2 * e) / 0.8;
        const len = age < 0 ? 0 : 0.55 * smooth(0, 0.25, t01) * (lands ? 1 - smooth(0, 0.5, after) : 1), live = len > 0.001 && (lands ? after < 0.5 : t01 < 1.3);
        for (let k = 0; k < SEG; k++) {
          const n = i * SEG + k;
          if (!live) { if (lit[n]) { hairC.setXYZ(n, 0, 0, 0); lit[n] = 0; dirty = true; } continue; }
          const x0 = k / SEG, x1 = (k + 1) / SEG, xm = (x0 + x1) / 2;
          streaks.set(n, toward(i4, e - x0 * len, va), toward(i4, e - x1 * len, vb));
          const alight = lands ? 1 - smooth(0.1, 0.5, after) : 1 - smooth(0.66 + 0.24 * xm, 1.0 + 0.3 * xm, t01);
          // brightest a little behind its tip, as a meteor is, and never a ball
          const f = smooth(0, 0.08, age) * alight * (1 - xm) * (0.55 + 0.45 * smooth(0, 0.06, xm)) * level, m = smooth(0, 0.45, xm);
          hairC.setXYZ(n, lerp(headC.r, tailC.r, m) * f, lerp(headC.g, tailC.g, m) * f, lerp(headC.b, tailC.b, m) * f); lit[n] = 1; dirty = true;
        }
        // the ember: a point that comes on down where the streak ended, swaying a little, and lands
        const tf = age - dur * 0.85, secs = fC[i4 + 2];
        if (lands && tf >= 0 && tf <= secs) {
          const h = fC[i4 + 3] - sink * tf, sway = 0.35 * h / Math.max(fC[i4 + 3], 1);
          let x = fC[i4] + sway * Math.sin(tf * 0.9 + fC[i4]), y = h, z = fC[i4 + 1] + sway * Math.cos(tf * 0.7 + fC[i4 + 1]);
          const dx = x - eye.x, dy = y - eye.y, dz = z - eye.z, dn = Math.max(Math.hypot(dx, dy, dz), 1e-3), push = Math.max(0, 0.7 - dn) / dn;      // never nearer the eye than arm's length
          x += dx * push; y += dy * push; z += dz * push;
          embers.set(i, x, y, z); embers.setLight(i, 1.5 * smooth(0, 0.4, tf) * (1 - smooth(secs - 0.15, secs, tf)) * level); glowing[i] = 1;
        } else if (glowing[i]) { embers.setLight(i, 0); glowing[i] = 0; }
      }
      if (dirty) hairC.needsUpdate = true;
    };

    // ---- the pool of lit sand round each: the key painting's bottom edge (fallen stars on rippled sand). The layout's,
    // kept: drawn after the water like the lights themselves, so a passing ring does not move it, and only where the
    // eye looks down on it (see below). It reads the family's own instances, so a light that is placed, taken, born or
    // told to rise takes its pool with it. One draw.
    {
      const Pl = F.pool, painted = !!(sky.BED_PAINT_GLSL && sky.bedUniforms);
      const geo = new THREE.InstancedBufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, 0, -1, 1, 0, -1, -1, 0, 1, 1, 0, 1]), 3)); geo.setIndex([0, 2, 1, 1, 2, 3]);
      geo.setAttribute('aBed', aBed); geo.setAttribute('aStar', aStar);
      geo.instanceCount = aBed.count;
      const mat = new THREE.ShaderMaterial({
        uniforms: { uClock: bedMat.uniforms.uClock, uLevel: bedMat.uniforms.uLevel, uSunline: sky.uniforms.uSunline, uVeil: sh.uVeil, uTime: sh.uTime, uColor: { value: new THREE.Color(Pl.color) }, uGain: { value: Pl.light },
          uReach: { value: Pl.reach }, uRad: { value: new THREE.Vector2(Pl.radius[0], Pl.radius[1]) }, ...(painted ? sky.bedUniforms : {}) },
        transparent: true, depthWrite: false, depthTest: true, fog: false, ...sky.ADD,      // (tested against what is solid: with no depth test a pool the boat passed over lay ON the foredeck, sand ripples and all)
        vertexShader: /* glsl */`attribute vec4 aBed, aStar; uniform float uClock, uLevel, uVeil, uReach, uTime; uniform vec4 uSunline; uniform vec2 uRad;
          varying vec2 vQ, vW; varying float vL;
          void main() { float sd = aStar.y; vec3 p = aBed.xyz + position * mix(uRad.x, uRad.y, fract(sd * 17.3)); vQ = position.xz; vW = p.xz;
            float dd = distance(p, cameraPosition);
            // it goes as its star lifts and comes as a new one is born; far off it is not drawn; first light drowns it
            vL = (0.75 + 0.5 * fract(sd * 31.7)) * uLevel * (1.0 - smoothstep(0.0, 1.2, uClock - aStar.x)) * smoothstep(0.0, 2.0, uTime - aStar.w) * (1.0 - smoothstep(uReach * 0.45, uReach, dd)) * (1.0 - uVeil) * (1.0 - smoothstep(0.3, 0.7, uSunline.w));
            vL *= 0.85 + 0.15 * sin(uTime * 0.5 + sd * 44.0);
            // The water over the sand is a mirror, and the more so the lower the eye looks along it: straight down 14 parts in
            // a hundred of the bed come through, at eight degrees 2. Drawn after the water, a pool knows nothing of that, and
            // from the boat every pool further than a few metres lay on the mirror as a pale smear with no sand in it (the
            // first image had a dozen). So a pool is all there looking down on it and gone below about three degrees.
            vL *= smoothstep(1.5, 16.0, degrees(asin(clamp((cameraPosition.y - p.y) / max(dd, 1e-3), 0.0, 1.0))));
            gl_Position = vL < 0.004 ? vec4(2.0, 2.0, 2.0, 1.0) : projectionMatrix * viewMatrix * vec4(p, 1.0); }`,
        fragmentShader: /* glsl */`uniform vec3 uColor; uniform float uGain; varying vec2 vQ, vW; varying float vL;
          ${painted ? sky.BED_PAINT_GLSL : sky.BED_MARKS_GLSL || 'float bedMarks(vec2 w) { return 0.0; }'}
          void main() { float r2 = dot(vQ, vQ), fall = exp(-r2 * 3.2) * (1.0 - smoothstep(0.8, 1.0, sqrt(r2)));
            float marks = ${painted ? '2.0 * bedPaint(vW, 0.0) - 1.0' : 'bedMarks(vW)'};      // the bed's own sand under it: crests lit, troughs in shade
            gl_FragColor = vec4(clamp(uColor * (uGain * vL * fall * (0.62 + 0.38 * marks)), 0.0, 30.0), 1.0); }`,
      });
      const pools = new THREE.Mesh(geo, mat); pools.frustumCulled = false; pools.renderOrder = 2; pools.name = 'fallen stars (pools of lit sand)';
      ctx.only(pools, 'direct'); ctx.add(pools); L.pools = pools;
      if (raw) pools.visible = false;
    }

    // ---- the bodies: the kit's modelled pebbles in their scour hollows, under the same list (kit_shallows.js drives
    // their clock at shared.sky.T and shows the stretches round the boat). Each pebble's lift time is its light's:
    // read back from the family's instances whenever anyone has told the handle anything.
    const slots = [];
    let vStar = -1, vBed = -1;
    if (shared.pebbles && shared.pebbles.lay && !raw) {
      try {
        const laid = L.pebbles = shared.pebbles.lay(list), stretch = (P.kitShallows && P.kitShallows.pebbles && P.kitShallows.pebbles.stretch) || 44;
        const byName = new Map(); for (const m of [...laid.meshes, ...laid.hollows]) byName.set(m.name, { attr: m.geometry.attributes.aStar, n: 0 });
        for (const q of laid.laid) {
          const k = Math.floor(path.locate(q.x, q.z, null, tmp).s / stretch), a = byName.get('fallen-star pebbles: ' + q.variant + ' ' + k), b = byName.get('scour hollows ' + k);
          slots.push({ i: q.i, x: q.x, z: q.z, a: a ? a.attr : null, an: a ? a.n++ : 0, b: b ? b.attr : null, bn: b ? b.n++ : 0, was: 1e9 });
        }
      } catch (err) { console.warn('sky lights: the pebbles were not laid', err); }
    }
    // everything that reads the family's instances is brought up to date whenever anyone has told the handle anything
    const dPos = dabs.geometry.attributes.position, dB = dabs.geometry.attributes.aDabB, dBorn = dabs.geometry.attributes.aBorn;
    const sync = () => {
      vStar = aStar.version; vBed = aBed.version;
      const st = aStar.array, bd = aBed.array;
      for (let i = 0; i < total; i++) { const i4 = i * 4; dPos.setXYZ(i, bd[i4], bd[i4 + 1] + HANG, bd[i4 + 2]); dB.setZ(i, st[i4]); born[i] = st[i4 + 3]; }
      dPos.needsUpdate = dB.needsUpdate = dBorn.needsUpdate = true;
      for (const q of slots) {
        const i4 = q.i * 4, gone = st[i4 + 3] > 1e8 || Math.abs(bd[i4] - q.x) > 0.01 || Math.abs(bd[i4 + 2] - q.z) > 0.01;      // taken, or moved from its pebble: the pebble is not there
        const t = gone ? -1e5 : st[i4];
        if (t === q.was) continue;
        q.was = t;
        if (q.a && q.an * 4 < q.a.array.length) { q.a.array[q.an * 4] = t; q.a.needsUpdate = true; }
        if (q.b && q.bn * 4 < q.b.array.length) { q.b.array[q.bn * 4] = t; q.b.needsUpdate = true; }
      }
    };

    // ---- looking (developer switches)
    const nums = (k) => (query.get(k) || '').split(',').map((v) => (v === '' ? NaN : +v));
    let devFall = query.has('fall') ? nums('fall') : null, devLand = query.has('land') ? nums('land') : null;

    let mode = -2, lvWas = -1;
    L.bed = bed; L.falls = falls; L.rings = rings; L.lift = lift;
    L.lying = (i) => i >= 0 && i < total && aStar.array[i * 4 + 3] < 1e8 && aStar.array[i * 4] > bedMat.uniforms.uClock.value;      // is light i on the bed now (born, not taken, not yet told to lift)? For the Shallows group's shrimp
    L.update = (dt, c) => {
      const T = sky.T, e = sky.e, s = ctx.s;
      bed.tick(T); bed.sunline = sky.sunlineY;
      // first light: everything additive to a third of its night strength (by distance: the boat eases it)
      const lv = L.dawn ? 1 - (2 / 3) * smooth(L.dawn[0], L.dawn[1], e) : 1;      // (not before the rising is under way: at s 226, e 0.47, they are still at four fifths)
      if (Math.abs(lv - lvWas) > 0.004) { lvWas = lv; bed.level(lv, 0.5); falls.level(lv, 0.5); rings.level(lv); }
      // the ordinary falls, by where the boat is: none in the mist, one somewhere every 5 to 8 s from s 46 (one in four
      // comes down, 60 to 250 m off), between s 110 and s 200 one in six comes down 20 to 40 m from the boat; none once
      // the stars have gone
      const m = !L.ambient ? -1 : s < 46 || e > 0.6 ? 0 : s >= 110 && s < 200 ? 2 : 1;
      if (m !== mode) { mode = m; if (m >= 0) falls.set(m === 0 ? { every: null } : m === 1 ? { every: [5, 8], landOne: 4, landAt: [60, 250] } : { every: [5, 8], landOne: 6, landAt: [20, 40] }); }
      // the wave of the letting go, until staging sends its own: from the east at t 5, passing the carried boat at t 11.6
      if (L.auto && !L.waved && T >= L.waveAt) L.wave();
      if (aStar.version !== vStar || aBed.version !== vBed) sync();
      if (!raw) drawFalls();
      if (devFall && ctx.time >= (devFall[2] || 3)) { falls.fall({ az: devFall[0] || 0, el: devFall[1] || 16 }); devFall = null; }
      if (devLand && ctx.time >= (devLand[2] || 1)) { const b = path.locate(ctx.boat.x, ctx.boat.z, null, tmp); const to = kit.at(b.s + (devLand[0] || 10), b.d + (devLand[1] || 0)); falls.fall({ to, seconds: devLand[3] || 8 }); devLand = null; }
    };
    shared.rings = rings; shared.bed = bed; shared.falls = falls;
    shared.cast = shared.cast || {}; shared.cast.lights = L;
    return L;
  })();

  // ---------------------------------------------------------------------------------------------- birds that stand
  // One low form for the flock (54 triangles), the same form finer for the sleepers (2,400), a teardrop for the terns.
  const asleep = (seg, rings, legSides) => {                                    // a flamingo asleep on one leg: an egg tilted tail-down, the neck laid back, one leg plumb under it
    const body = new THREE.SphereGeometry(1, seg, rings); body.scale(0.17, 0.15, 0.27); body.rotateX(0.35); body.translate(0, 0.72, 0);
    const neck = new THREE.SphereGeometry(1, Math.max(4, seg >> 1), Math.max(2, rings >> 1)); neck.scale(0.06, 0.05, 0.13); neck.translate(0, 0.86, -0.06);
    const leg = new THREE.CylinderGeometry(0.009, 0.009, 0.72, legSides, 1, true); leg.translate(0, 0.3, 0.02);
    const pos = [], idx = []; let base = 0;
    for (const g of [body, neck, leg]) { const p = g.attributes.position, ix = g.index; for (let i = 0; i < p.count; i++) pos.push(p.getX(i), p.getY(i), p.getZ(i)); for (let i = 0; i < ix.count; i++) idx.push(base + ix.getX(i)); base += p.count; }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
    return geo;
  };
  const birdPaint = (air) => sky.paint({ color: '#ffffff', brush: 0.4, air, extend: {
    // (plumage out of the sun is nearly white: the area's light makes it the page's lilac-grey #9A93B8, as it makes salt #8E86B0; so a
    // sleeper is taken for a salt cone until it is near. In the sun it is the page's flamingo pink.)
    uniforms: { uShow, uPink: { value: new THREE.Color(C.flamingo) }, uGrey: { value: new THREE.Color(C.plumage) } },
    vertexPars: 'attribute vec4 aBird; uniform float uShow; varying float vLift;',
    // (in the air the stand-in is a dash, not an egg on a stalk: the leg is drawn up, the body lies along its way)
    vertexLocal: 'float tauL = uShow - aBird.x, air = (tauL > 0.0 && aBird.w < 0.5) ? smoothstep(0.8, 2.6, tauL) : 0.0; transformed.y = mix(transformed.y, 0.74 + (transformed.y - 0.74) * 0.3, air); transformed.z *= 1.0 + 2.2 * air; transformed.x *= 1.0 + 0.6 * air;',
    // (a first look at the lift: when the wind front reaches a bird it runs 5 m into the wind and climbs at 3 m/s along its ribbon)
    vertexWorld: /* glsl */`{ float tau = uShow - aBird.x; vLift = 0.0;
      if (tau > 0.0 && aBird.w < 0.5) { float fl = max(tau - 1.3, 0.0); vLift = smoothstep(0.0, 2.5, tau);
        wp.xz += vec2(0.0, -1.0) * 5.0 * smoothstep(0.0, 1.3, tau) + aBird.yz * fl; wp.y += 3.0 * fl; } }`,
    fragmentPars: 'uniform vec3 uPink, uGrey; varying float vLift;',
    albedo: 'albedo *= mix(uGrey, uPink, skySunlit(vWPos.y));',                // lilac-grey until the sun reaches the bird
    // (first light is from dead ahead and the flock rises to the LEFT of the boat: the rider sees the birds' shadow sides,
    // and a light that goes by the facing leaves them dark mauve above the sunline. Feathers let light through: above the
    // sunline a bird takes first light all round. The real birds' shader must do the same: docs/build/sky/1-layout.md)
    light: 'c += albedo * uSunKey * (0.32 * skySunlit(vWPos.y));',
  } });
  const flockList = [], flockAttr = [], rnd = ctx.rng(57);
  const place = (s, d, stay, ribbon) => {
    const p = sky.at(s, d, 0), sc = 0.9 + 0.25 * rnd();      // (sky.at: the flock along the ridge's foot runs on past the path's end)
    flockList.push({ position: [p.x, -0.02, p.z], rotation: (rnd() - 0.5) * 1.2, scale: sc });
    // when the wind front reaches it (it comes from 260 m ahead of the boat at t 22, at 26 m/s), plus 0 to 1.4 s
    const t0 = 22 + (p.z + 246 + 260) / 26 + rnd() * 1.4, a = ribbon === 1 ? [-8.7, -10.9] : ribbon === 2 ? [7.7, -11.6] : [-1.0, -7.6];      // its ribbon's way, m/s: R1 banks left across the route, R2 away south, R3 along the ridge's foot
    flockAttr.push(t0, a[0], a[1], stay ? 1 : 0);
  };
  {
    const Fl = P.flock, dens = (s, d) => kit.fbm(s * 0.045 + 3, d * 0.045 + 7, 3, 5), R = P.ridge;
    let stay = 0;
    for (let n = 0, tries = 0; n < Fl.right.n && tries < 60000; tries++) { const s = lerp(Fl.right.s[0], Fl.right.s[1], rnd()), d = lerp(Fl.right.d[0], Fl.right.d[1], Math.pow(rnd(), 1.25)); if (s > 232 && d < 57) continue; if (rnd() > smooth(0.36, 0.62, dens(s, d))) continue; const st = stay < 170 && rnd() < 0.1; if (st) stay++; place(s, d, st, d < 85 && s > 215 && n % 5 === 0 ? 1 : 2); n++; }
    for (let n = 0, tries = 0; n < Fl.left.pans && tries < 60000; tries++) { const s = lerp(Fl.left.s[0], 231, rnd()), d = lerp(Fl.left.d[1], Fl.left.d[0], Math.pow(rnd(), 1.2)); if (Math.hypot(s - P.hut.at[0], d - P.hut.at[1]) < 4) continue; if (rnd() > smooth(0.36, 0.62, dens(s, d))) continue; const st = stay < 300 && rnd() < 0.1; if (st) stay++; place(s, d, st, 3); n++; }
    for (let n = 0, tries = 0; n < Fl.left.foot && tries < 60000; tries++) { const s = lerp(R.s[0] + 2, R.s[1] - 4, rnd()), d = lerp(-27, R.d[1] + R.skirt + 1, Math.pow(rnd(), 0.8)); if (rnd() > smooth(0.3, 0.6, dens(s * 1.7, d * 1.7))) continue; const st = stay < 300 && rnd() < 0.12; if (st) stay++; place(s, d, st, 3); n++; }      // along the ridge's foot, on the crust terraces
    const geo = asleep(6, 4, 3), mesh = kit.instances(geo, birdPaint('far'), flockList);
    geo.setAttribute('aBird', new THREE.InstancedBufferAttribute(new Float32Array(flockAttr), 4));
    mesh.name = 'standin:the flock (3,000 flamingos asleep)'; shared.flock = { mesh, count: flockList.length, triangles: geo.index.count / 3 };
  }
  {
    // STAND-IN for the 36 sleepers: A (four in the channel 8 to 12 m from the line, ten in the pan mouth), B and C
    const Sl = P.sleepers, list = [], attr = [], put = (s, d, stay) => { const p = kit.at(s, d, 0); list.push({ position: [p.x, -0.02, p.z], rotation: (rnd() - 0.5) * 2.4, scale: 1.2 + 0.12 * rnd() }); attr.push(22 + (p.z + 506) / 26 + 3 + rnd() * 2, 6.5, -11.2, stay ? 1 : 0); return p; };
    for (const [s, d] of Sl.A.channel) { const p = put(s, d, true); ctx.addCollider({ x: p.x, z: p.z, r: Sl.soft, soft: true }); }      // they do not step aside: the hull is eased round them
    let stay = 4;
    for (const g of [Sl.A.pan, Sl.B, Sl.C]) for (let i = 0; i < g.n; i++) { const st = stay < 12 && i % 4 === 0; if (st) stay++; put(lerp(g.s[0], g.s[1], rnd()), lerp(g.d[0], g.d[1], rnd()), st); }
    const geo = asleep(40, 28, 8), mesh = kit.instances(geo, birdPaint('near'), list);
    geo.setAttribute('aBird', new THREE.InstancedBufferAttribute(new Float32Array(attr), 4));
    mesh.name = 'standin:the sleepers (36 flamingos)'; shared.sleepers = { mesh, count: list.length, triangles: geo.index.count / 3 };
  }
  {
    // STAND-IN for the six terns asleep on stakes: a teardrop on the stake head (900 triangles)
    const geo = new THREE.SphereGeometry(1, 30, 16); geo.scale(0.075, 0.07, 0.17); geo.translate(0, 0.06, 0);
    const list = (shared.stakes || []).filter((st) => st.tern).map((st) => ({ position: [st.x, st.top - 0.01, st.z], rotation: rnd() * 6.28, scale: 1 }));
    if (list.length) { const m = kit.instances(geo, sky.paint({ color: '#cfd2e2', brush: 0.4 }), list); m.name = 'standin:terns (6)'; }
  }

  // &counts=1: what stands, as grown, to .shots/sky_counts.json (every instanced multitude, the stand-ins, the colliders)
  if (new URLSearchParams(location.search).has('counts')) {
    const out = { instanced: {}, standIns: 0, separateObjects: 0 };
    ctx.group.traverse((o) => { if (!o.isMesh && !o.isPoints) return; out.separateObjects++; if (o.name && o.name.startsWith('standin:')) out.standIns++;
      const n = o.isInstancedMesh ? o.count : o.geometry && o.geometry.isInstancedBufferGeometry ? o.geometry.instanceCount : o.isPoints ? o.geometry.attributes.position.count : 0; if (n > 1) out.instanced[o.name || '(unnamed)'] = n; });
    out.fallenStars = shared.fallen.length; out.flock = shared.flock.count; out.sleepers = shared.sleepers.count; out.nearCones = shared.cones.near.length; out.farCones = shared.cones.far; out.sedgeTufts = shared.sedge;
    setTimeout(() => { out.colliders = ctx.engine.realms.current ? ctx.engine.realms.current.colliders.length : null; fetch('/__shot/sky_counts.json', { method: 'POST', body: JSON.stringify(out, null, 1) }).catch(() => {}); }, 1200);
  }

  return {
    update(dt, c) { uShow.value = sky.T; lights.update(dt, c); },      // (uShow: the bird stand-ins' first-look lift still reads it)
  };
}
