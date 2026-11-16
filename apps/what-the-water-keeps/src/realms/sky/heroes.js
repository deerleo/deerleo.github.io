// The standing sky: THE MONUMENT (docs/art/sky.md, section 3, "Monument 1" and "Monument 2", and cast rows 10 to 12).
// Its log: docs/build/sky/2-monument.md.
//
// THE WHITE RIDGE (monument 2, `ridge.glb`): the salt works' store, 120 by 84 by 34 m of raked salt, modelled in Blender
//   (source-art/models/sky/ridge.py: second sculpt, 8 November: a mountain of FACETS, every barrow tip a many-sided heap)
//   and standing here in place of the layout's stand-in (which is in heroes_b.js and gives way by itself when this module
//   has published shared.ridge). It wears the area's light, the night air as 'far' and the Light group's painted salt
//   (sky.extend({ salt })), in five slots: `paint` (the raked working face the barrow run climbs), `old` (crust of older
//   seasons: the east half, the shoulders), `fresh` (salt that has lately moved), `crust` (the undercut and the skirt's
//   rims), `brine` (the level sheets the rims hold).
//   Its own in the material: BY NIGHT IT HAS NO EDGE (it thins where the eye looks through little of it: its crest,
//   its arrises, its ends); FORM IN THE DAWN'S SHADE (below the sunline a side turned east is lighter and warmer, one
//   turned west darker and cooler, a cut wall darker than a face at rest: plan.monument.ridge.form); and its brine holds
//   the low sky where the eye looks along it.
//   shared.ridge = { faceAt(s, y) -> [d, y] on the near (south) face as sculpted, heightAt(s, d), footAt(s) -> d of the lip
//                    of the undercut, height, crest, points: { name: Vector3 }, point(name), model, run: the ledge's turns }
// THE GREAT WADER AND ITS KIN (monument 1), one system of stars, hairlines and dust on one rig:
//   the great wader (hero, `wader.glb`)   a constellation 72 m tall standing in the lake at s 196, d +14: 22 stars, 22
//                                         hairlines, dust inside the kite of its body only, a ring and a pool of light
//                                         under each foot that is down; 18 more stars for the open wings
//   the ring of standers (cast row 10)    twelve more star-birds asleep on one leg, 30 to 46 m tall, 240 to 420 m out
//   the skein (cast row 11)               nine star-birds in flight along the Milky Way at 260 m
//   The star-birds are drawn the way the page asks (stars as one draw of soft dabs, lines as one draw of camera-facing
//   hairs, dust as soft shells); what still stands in is the ANIMAL, which is the cast's: three held poses (asleep on one
//   leg, awake at full height, bowed across the route) that melt into each other, where the rig's clips will be (sleep,
//   wake, stand, bow, feed, head_up, turn_walk, wings_open, takeoff, fly). Poses and their timings are in plan.wader; the
//   standers are the asleep pose with fourteen of its stars.
// What this module puts in `shared`: shared.ridge (above); shared.wader = { at, stars: world positions of the 22 stars
// now, awake, bowed, there }.
import { removeStandIn } from '../../engine/modules.js';
import { smooth, lerp, clamp01 } from './plan.js';

export async function build(ctx, plan, shared) {
  const { THREE, kit, stage } = ctx, P = plan, C = P.colors, sky = shared.sky, path = ctx.path;
  const frame = (s, d) => { const a = path.at(s), o = kit.at(s, d); return { o, r: new THREE.Vector3(a.rx, 0, a.rz), t: new THREE.Vector3(a.tx, 0, a.tz) }; };

  // ---------------------------------------------------------------------------------------------- the white ridge
  // `ridge.glb` is modelled in the route's own metres about (s 296, d -92): Blender x = d + 92, y = s - 296 (ridge.py).
  let ridge = null;
  try {
    const R = P.ridge, RM = P.monument.ridge, [s0, d0] = RM.origin, o = sky.at(s0, d0, 0), a = path.at(Math.min(s0, path.length));
    const col = (c) => new THREE.Color(c);
    // BY NIGHT IT HAS NO EDGE. The night air makes a far thing faint; a faint polygon is still a polygon. The ridge is
    // drawn, while its air is closed, as thick as the eye's ray is long inside it (1 - exp(-metres / length), the ray cut
    // by the four faces of the plan's own ridge): all there low down, where the ray has forty metres of salt behind the
    // face, and thinning to nothing along its crest, its arrises and its ends, so the stars come through its top and it
    // has no outline. First light closes it up (uRdgNight.x goes to 0 before the 'far' air opens and it is opaque again).
    const uNight = { value: new THREE.Vector4(1, RM.ghost.length, RM.night, 0) };
    const uFrame = { value: new THREE.Vector4(a.rx, a.rz, a.tx, a.tz) }, uOrigin = { value: o.clone() };
    const uHull = { value: new THREE.Vector4(R.height / ((R.d[1] - R.d[0]) / 2), R.height, (R.d[1] - R.d[0]) / 2, (R.s[1] - R.s[0]) / 2) };      // slope, crest, half the foot across, half its length
    // A PALER DARKNESS. The night's depth (light.js) leaves far salt only starlight, which is the sky's own colour: from
    // s 100 to s 190 the ridge was nothing at all. It keeps a breath of its own paleness however far off it is (uRdgPale,
    // light added to the night's, by night only): with its thinning, a paler darkness the stars show through.
    // FORM IN THE DAWN'S SHADE. Below the sunline there is only sky light, and the area's light gives every face the same
    // share of it: the long south face was one flat lilac from its foot to the sunline, whatever was modelled on it. The
    // sky at first light is not even: its east is the brighter, warmer half. A side of a heap that is turned east takes
    // a little more of it and one turned west gives a little back, in the same three flat steps in which first light
    // itself will fall on them (light.js: skyStep, uSunDir, uKeyFrom), so that the sunline comes down over facets that
    // are already there in a minor key. Nothing by night (uRdgForm is nothing until the dawn's progress brings it).
    // And a face sees less of the sky the steeper it stands: a cut wall, a scarp, the side of a rill are darker than a
    // face at rest (39 degrees), a ledge or a terrace lighter (uRdgSteep: how much; the share of it first light takes away).
    const uForm = { value: new THREE.Vector4(0, 0, 0, RM.form.pivot) }, formCol = new THREE.Color(RM.form.tint[0] * RM.form.gain, RM.form.tint[1] * RM.form.gain, RM.form.tint[2] * RM.form.gain), uSteep = { value: new THREE.Vector3(RM.form.steep, RM.form.steepInSun, RM.form.floor) };
    const soft = {
      uniforms: { uRdgNight: uNight, uRdgFrame: uFrame, uRdgO: uOrigin, uRdgHull: uHull, uRdgPale: { value: col(RM.pale) }, uRdgForm: uForm, uRdgSteep: uSteep },
      fragmentPars: 'uniform vec4 uRdgNight, uRdgFrame, uRdgHull, uRdgForm; uniform vec3 uRdgO, uRdgPale, uRdgSteep;',
      light: /* glsl */`c = c * mix(1.0, uRdgNight.z, uRdgNight.x) + albedo * uRdgPale * uRdgNight.x;
        { float fw = skyStep(clamp(dot(N, uSunDir) * 0.5 + 0.5 + stroke * 0.10 * uBrush, 0.0, 1.0)), fl = skySunlit(vWPos.y);
          c *= max(vec3(uRdgSteep.z), 1.0 + uRdgForm.rgb * ((smoothstep(uKeyFrom.y, uKeyFrom.z, fw) - uRdgForm.w) * (1.0 - fl) + (N.y - 0.777) * uRdgSteep.x * (1.0 - uRdgSteep.y * fl))); }`,      // (as a share of the light the face has: taken away as light it left bright blue holes in the ghost at the first of the dawn)
      final: /* glsl */`
        if (uRdgNight.x > 0.001) {
          vec3 q = vWPos - uRdgO, rd = normalize(vWPos - cameraPosition);
          vec3 p = vec3(dot(q.xz, uRdgFrame.xy), q.y, dot(q.xz, uRdgFrame.zw)), d = vec3(dot(rd.xz, uRdgFrame.xy), rd.y, dot(rd.xz, uRdgFrame.zw));
          float k = uRdgHull.x, top = uRdgHull.y, end = k * uRdgHull.w, t = 400.0, nd;
          nd = k * d.x + d.y;  if (nd > 1e-4) t = min(t, max(top - (k * p.x + p.y), 0.0) / nd);
          nd = -k * d.x + d.y; if (nd > 1e-4) t = min(t, max(top + k * p.x - p.y, 0.0) / nd);
          nd = k * d.z + d.y;  if (nd > 1e-4) t = min(t, max(end - (k * p.z + p.y), 0.0) / nd);
          nd = -k * d.z + d.y; if (nd > 1e-4) t = min(t, max(end + k * p.z - p.y, 0.0) / nd);
          if (d.y < -1e-4) t = min(t, max(p.y, 0.0) / -d.y);
          gl_FragColor.a *= mix(1.0, 1.0 - exp(-t / uRdgNight.y), uRdgNight.x);
        }`,
    };
    // the brine: wet. Where the eye looks along it, it holds the low sky (the fog's colour is the low sky's own)
    // (and from first light it is a little lit of itself, evenly: under the dawn's blue shade alone its rose was mauve and
    // dark, a line that could not be told from a shadow. By night it takes only the night's light, as the mirror does.)
    const uBrine = { value: new THREE.Vector2(RM.brine.sheen, 0) };
    const wet = { uniforms: { uRdgBrine: uBrine }, fragmentPars: 'uniform vec2 uRdgBrine;',
      light: 'c += albedo * uRdgBrine.y; c = mix(c, uFogColor, uRdgBrine.x * pow(1.0 - clamp(V.y, 0.0, 1.0), 3.0));' };
    // THE MARKS OF THE RAKE AND OF THE RAIN (third holder; plan.monument.ridge.relief). The boat is never nearer the face
    // than 26 m, and at that distance the painted salt's furrows are under the painter's brush: the long south face was a
    // quiet sheet with a fan of pleats, a snow slope before it was salt. So the ridge has a relief of its own, laid in its
    // material at a size the eye can read from the water: the working face RAKED in rows, level, combed in sweeps that do
    // not quite meet, every fourth row the bench the raker stood on; the old faces FLUTED by the rain, straight down each
    // side of each heap (the way the side's own normal says is down), a rill every pace or two, no two the same depth;
    // and the dust of older seasons as level STRATA that sag with the heap. It is form as well as paint: it turns the
    // face's normal before any light falls on it, so the sunline comes down over ribs that catch it on one side, the
    // dawn's shade tells them in its minor key, and the mirror has them too. Each mark fades out where it would be finer
    // than the picture can draw (fwidth), so nothing shimmers; nothing of it by night.
    const RL = RM.relief, uRelGate = { value: 0 }, chalkC = col(C.chalk), tintOf = (hex) => { const t = col(hex); return new THREE.Vector3(t.r / chalkC.r, t.g / chalkC.g, t.b / chalkC.b); };
    const relShared = { uRdgGate: uRelGate, uRdgRows: { value: new THREE.Vector4(RL.rows.every, RL.rows.depth, RL.rows.panel, RL.rows.tilt) }, uRdgRows2: { value: new THREE.Vector3(RL.rows.lift, RL.rows.liftDepth, RL.rows.bow) },
      uRdgFlute: { value: new THREE.Vector4(RL.flutes.every, RL.flutes.depth, RL.flutes.wander, RL.sag) }, uRdgFoot: { value: new THREE.Vector2(RL.flutes.foot[0], RL.flutes.foot[1]) },
      uRdgStrata: { value: RL.strata.map((s) => new THREE.Vector3(s[0], s[1], s[2])) }, uRdgHollow: { value: tintOf(RL.hollow) }, uRdgStratum: { value: tintOf(RL.stratum) }, uRdgTint: { value: RL.tint } };
    const relief = (k) => ({
      defines: { RDG_STRATA: RL.strata.length },
      uniforms: { ...relShared, uRdgRel: { value: new THREE.Vector3(k.rows, k.flutes, k.strata) } },
      fragmentPars: /* glsl */`uniform float uRdgGate, uRdgTint; uniform vec4 uRdgRows, uRdgFlute; uniform vec3 uRdgRows2, uRdgRel, uRdgHollow, uRdgStratum, uRdgStrata[RDG_STRATA]; uniform vec2 uRdgFoot;
        float rdgHash(float n) { return fract(sin(n * 12.9898 + 4.1414) * 43758.5453); }`,
      // (vUv0 is the model's own word on every face, from ridge.py's marks(): x = how much it is raked, y = how much fluted)
      albedo: /* glsl */`
        if (uRdgGate > 0.002) {
          vec2 rnh = N.xz; float rnl = length(rnh), rny = N.y;
          vec3 rq = vWPos - uRdgO;
          float rHol = 0.0, rTint = 0.0, aR = vUv0.x * uRdgRel.x, aF = vUv0.y * uRdgRel.y;
          if (rnl > 0.14 && (aR > 0.01 || aF > 0.01)) {
            vec2 rdn = rnh / rnl, rac = vec2(-rdn.y, rdn.x);
            float rc = dot(rq.xz, rac), rs = vWPos.y / rnl;            // metres across the face along its contour; metres up it along the slope
            vec3 rA = vec3(rac.x, 0.0, rac.y), rU = cross(rA, N);      // along the contour; up the slope
            vec2 rGrad = vec2(0.0);                                    // the relief's own slope across and up the face
            // ---- the rake's rows: level, combed in sweeps that do not quite meet; they come and go
            if (aR > 0.01) {
              float pw = uRdgRows.z, pc = rc / pw + 0.3 * sin(rs * 0.19 + rc * 0.045), pid = floor(pc), pf = pc - pid;
              float h1 = rdgHash(pid), h2 = rdgHash(pid + 31.7), h3 = rdgHash(pid + 73.3);
              float v = (rs + (h1 - 0.5) * 2.0 * uRdgRows.w * (pf - 0.5) * pw + (h2 - 0.5) * 2.0 * uRdgRows2.z * sin(pf * 3.14159)) / uRdgRows.x + h3 * 9.0;
              float fwv = fwidth(v), seam = smoothstep(0.0, 0.03, pf) * (1.0 - smoothstep(0.97, 1.0, pf));
              float worn = 0.3 + 0.7 * smoothstep(-0.55, 0.3, sin(rc * 0.23 + rs * 0.11 + h3 * 6.28) + 0.6 * sin(rc * 0.071 - rs * 0.29 + 1.9));
              float kr = (1.0 - smoothstep(0.2, 0.42, fwv)) * seam * aR * worn;
              float f = fract(v), wv = 0.5 + 0.5 * sin(6.28318 * f);
              rGrad.y += kr * uRdgRows.y * 3.14159 * cos(6.28318 * f) / uRdgRows.x;
              rHol += kr * (0.5 - wv) * 0.8;
              // the benches the raker stood on: every three to six rows, no two the same, one in four trodden out
              float wb = 0.26 * sin(v * 0.47 + h1 * 6.28), vb = v / uRdgRows2.x + wb, bid = floor(vb), fl = vb - bid, bk = rdgHash(bid * 3.1 + pid * 7.7);
              float kl = (1.0 - smoothstep(0.2, 0.42, fwv / uRdgRows2.x)) * seam * aR * smoothstep(0.22, 0.5, bk) * (0.55 + 0.45 * bk) * (0.5 + 0.5 * worn);
              float tl = clamp(fl / 0.2, 0.0, 1.0);                      // a riser a fifth of it, then the tread falling back
              rGrad.y += kl * uRdgRows2.y * (fl < 0.2 ? 6.0 * tl * (1.0 - tl) / 0.2 : -1.0 / 0.8) / (uRdgRows.x * uRdgRows2.x);
              rHol += kl * ((1.0 - smoothstep(0.0, 0.16, fl)) + smoothstep(0.93, 1.0, fl) - 0.2) * 0.9;
            }
            // ---- the rain's flutes: a narrow rill straight down the side every pace or two, each its own place, width and depth
            if (aF > 0.01) {
              float u = rc / uRdgFlute.x + uRdgFlute.z * sin(rs * 0.23 + rc * 0.09), fwu = fwidth(u), id = floor(u), f = u - id;
              float r1 = rdgHash(id * 1.7 + 0.3), r2 = rdgHash(id * 2.3 + 5.1), r3 = rdgHash(id * 0.7 + 9.4);
              float wid = 0.1 + 0.13 * r3, dx = (f - (0.5 + 0.34 * (r2 - 0.5))) / wid, tr = clamp(1.0 - abs(dx), 0.0, 1.0);      // 1 in the bed, 0 at the brinks and beyond
              float kf = (1.0 - smoothstep(wid * 0.5, wid * 1.3, fwu)) * aF * smoothstep(0.1, 0.45, r1) * (0.45 + 0.55 * r1) * smoothstep(uRdgFoot.x, uRdgFoot.y, vWPos.y);
              rGrad.x += kf * uRdgFlute.y * 1.5 * sqrt(tr) * sign(dx) / (wid * uRdgFlute.x);
              rHol += kf * pow(tr, 1.5) * 1.2;
            }
            N = normalize(N - (rGrad.x * rA + rGrad.y * rU) * uRdgGate);
          }
          // ---- the strata of older seasons: level, sagging with the heap, coming and going along their length
          if (uRdgRel.z > 0.0) {
            float sy = vWPos.y + uRdgFlute.w * (sin(rq.x * 0.043 + 1.0) * sin(rq.z * 0.031 + 2.0) + 0.45 * sin(rq.x * 0.11 + rq.z * 0.07)), fws = fwidth(sy);
            for (int i = 0; i < RDG_STRATA; i++) { vec3 S = uRdgStrata[i]; rTint = max(rTint, S.z * (1.0 - smoothstep(0.3, 1.0, abs(sy - S.x) / S.y)) * (1.0 - smoothstep(0.7, 1.6, fws / S.y))); }
            rTint *= uRdgRel.z * (0.5 + 0.5 * sin(rq.x * 0.19 + rq.z * 0.13 + sy * 0.7) * sin(rq.z * 0.11 - rq.x * 0.07 + 1.1)) * (1.0 - smoothstep(0.84, 0.93, rny));
          }
          albedo *= mix(vec3(1.0), uRdgHollow, clamp(rHol * uRdgTint, -0.25, 1.0) * uRdgGate) * mix(vec3(1.0), uRdgStratum, clamp(rTint, 0.0, 1.0) * uRdgGate);
        }`,
    });
    const dress = (opts, more = [], rel = null) => [...sky.extend({ air: 'far', ...opts }), soft, ...(rel ? [relief(rel)] : []), ...more];
    const model = await kit.model(RM.file, { position: [o.x, 0, o.z], rotation: Math.atan2(-a.tx, -a.tz), brush: RM.brush,
      extend: dress({ salt: RM.salt.work }, [], RL.work),
      materials: { old: { extend: dress({ salt: RM.salt.old }, [], RL.old) }, fresh: { extend: dress({ salt: RM.salt.fresh }, [], RL.fresh) }, crust: { extend: dress({ salt: RM.salt.crust }) }, brine: { extend: dress({}, [wet]), brush: 0.25 } } });
    sky.adopt(model.group, { air: 'far' });
    model.group.traverse((m) => { if (m.isMesh) m.frustumCulled = false; });

    // THE HEAP AS SCULPTED, for whoever stands something on it: its height over a quarter-metre grid of the route's own
    // (s, d), read off the model's triangles themselves (never copied out of the script)
    const G = RM.grid, ns = Math.round((G.s[1] - G.s[0]) / G.cell) + 1, nd = Math.round((G.d[1] - G.d[0]) / G.cell) + 1, high = new Float32Array(ns * nd).fill(-1);
    model.group.updateMatrixWorld(true);
    const inv = new THREE.Matrix4().copy(ctx.group.matrixWorld).invert(), v = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()], loc = {};
    model.group.traverse((m) => {
      if (!m.isMesh) return;
      const pos = m.geometry.attributes.position, idx = m.geometry.index, n = idx ? idx.count : pos.count, M = new THREE.Matrix4().multiplyMatrices(inv, m.matrixWorld);
      for (let i = 0; i < n; i += 3) {
        const q = [0, 1, 2].map((j) => { const p = v[j].fromBufferAttribute(pos, idx ? idx.getX(i + j) : i + j).applyMatrix4(M); return [s0 + (p.x - o.x) * a.tx + (p.z - o.z) * a.tz, d0 + (p.x - o.x) * a.rx + (p.z - o.z) * a.rz, p.y]; });
        const i0 = Math.max(0, Math.ceil((Math.min(q[0][0], q[1][0], q[2][0]) - G.s[0]) / G.cell)), i1 = Math.min(ns - 1, Math.floor((Math.max(q[0][0], q[1][0], q[2][0]) - G.s[0]) / G.cell));
        const j0 = Math.max(0, Math.ceil((Math.min(q[0][1], q[1][1], q[2][1]) - G.d[0]) / G.cell)), j1 = Math.min(nd - 1, Math.floor((Math.max(q[0][1], q[1][1], q[2][1]) - G.d[0]) / G.cell));
        const ax = q[1][0] - q[0][0], ay = q[1][1] - q[0][1], bx = q[2][0] - q[0][0], by = q[2][1] - q[0][1], det = ax * by - ay * bx;
        if (Math.abs(det) < 1e-9) continue;
        for (let ii = i0; ii <= i1; ii++) for (let jj = j0; jj <= j1; jj++) {
          const px = G.s[0] + ii * G.cell - q[0][0], py = G.d[0] + jj * G.cell - q[0][1], u = (px * by - py * bx) / det, w = (ax * py - ay * px) / det;
          if (u < -1e-4 || w < -1e-4 || u + w > 1.0001) continue;
          const h = q[0][2] + u * (q[1][2] - q[0][2]) + w * (q[2][2] - q[0][2]);
          if (h > high[ii * nd + jj]) high[ii * nd + jj] = h;
        }
      }
    });
    /** The height of the ridge (salt, crust or brine) at the route's (s, d); -1 where it is not. */
    const heightAt = (s, d) => {
      const fs = (s - G.s[0]) / G.cell, fd = (d - G.d[0]) / G.cell, i = Math.floor(fs), j = Math.floor(fd);
      if (i < 0 || j < 0 || i >= ns - 1 || j >= nd - 1) return -1;
      const u = fs - i, w = fd - j, h00 = high[i * nd + j], h10 = high[(i + 1) * nd + j], h01 = high[i * nd + j + 1], h11 = high[(i + 1) * nd + j + 1];
      return lerp(lerp(h00, h10, u), lerp(h01, h11, u), w);
    };
    /** Where the near (south) face, as sculpted, stands at height y at the route's s: [d, y]. Above the crest: the crest. */
    const faceAt = (s, y) => {
      let dPrev = G.d[1], hPrev = heightAt(s, dPrev), best = [dPrev, hPrev];
      for (let d = G.d[1] - G.cell; d >= R.d[0] + (R.d[1] - R.d[0]) * 0.45; d -= G.cell) {
        const h = heightAt(s, d);
        if (h >= y) return [hPrev < y && h > hPrev ? lerp(dPrev, d, (y - hPrev) / (h - hPrev)) : d, y];
        if (h > best[1]) best = [d, h];
        dPrev = d; hPrev = h;
      }
      return [best[0], Math.min(y, best[1])];
    };
    /** The lip of the undercut on the lake's side at the route's s: the d where the salt begins. */
    const footAt = (s) => faceAt(s, RM.lip)[0];
    const points = {}; for (const name of Object.keys(model.points)) points[name] = model.point(name);
    ridge = { faceAt, heightAt, footAt, height: R.height, crest: R.crest, model, points, point: (name) => model.point(name), lip: RM.lip,
      run: [0, 1, 2, 3, 4, 5].map((i) => points['run_' + i]), night: uNight, brine: uBrine, form: uForm, formCol, marks: uRelGate };
    shared.ridge = ridge;
    // A FEW GLINTS: here and there on its faces a crystal catches a star. Points of star white lying on the salt (the
    // area's own dabs, so each has its twin in the mirror), in the night air as the ridge is; each comes and goes as the
    // boat moves (a crystal throws its star one way) and scintillates slowly; gone with the stars at first light.
    {
      const Gl = RM.glints, rnd = ctx.rng(Gl.seed), list = [];
      for (let tries = 0; list.length < Gl.count && tries < 4000; tries++) {
        const west = rnd() < 0.3, s = west ? lerp(R.s[0] + 4, R.crest[0][0] - 2, rnd()) : lerp(R.s[0] + 10, R.s[1] - 14, rnd()), d = west ? lerp(R.d[0] + 20, R.d[1] - 6, rnd()) : lerp(R.d[1] - 3, R.crest[0][1] + 3, Math.pow(rnd(), 0.8));
        const y = heightAt(s, d);
        if (y < 2.5) continue;
        const p = sky.at(s, d, y + 0.06);
        list.push({ x: p.x, y: p.y, z: p.z, size: lerp(Gl.size[0], Gl.size[1], rnd()), light: lerp(Gl.light[0], Gl.light[1], rnd() * rnd()), rank: rnd(), rate: 0.04 + 0.1 * rnd(), phase: rnd() });
      }
      const glints = sky.dabs(list, { twinkle: 0.4, fog: 0.5, fade: Gl.fade, seed: Gl.seed + 1, extend: {
        uniforms: { uRdgAir: sky.air.far }, pars: 'uniform vec4 uRdgAir;',
        vertex: /* glsl */`
          { float gd = distance(p, cameraPosition), ph = aDabB.x * 6.2831853;
            light *= 1.0 - smoothstep(uRdgAir.x, uRdgAir.y, gd);
            float turn = 0.5 + 0.5 * sin(dot(cameraPosition.xz, vec2(cos(ph * 5.0), sin(ph * 5.0)) * (0.25 + 0.4 * aDabB.x)) + ph * 3.0);
            light *= 0.12 + 0.88 * turn * turn * turn; }` } });
      glints.points.name = 'white ridge (glints)';
      ridge.glints = glints;
    }
    // the foot of the ridge is land: the hull stops at the skirt's edge (d -44), as it did at the stand-in's
    for (let s = RM.collide.from; s <= RM.collide.to; s += RM.collide.step) { const p = kit.at(s, RM.collide.d); ctx.addCollider({ x: p.x, z: p.z, r: RM.collide.r }); }
  } catch (err) {
    console.error('INVALID_MODEL the white ridge did not load: the layout stand-in stays (' + ((err && err.message) || err) + ')');
  }

  // ---------------------------------------------------------------------------------------------- the great wader
  // The constellation as it STANDS (stage 2): its 22 stars with their magnitudes set one by one against the key painting,
  // its 22 hairlines (the page counts 23: docs/build/sky/2-monument.md says why there are 22), the dust in the kite of its
  // body (three soft shells and a sprinkle of small stars), the ring and the pool under each foot that is down, in three
  // held poses. STAND-IN still: the animal (`wader.glb`: rig, 40 star empties, 10 clips: the cast's).
  // Stars [u, y, w]: u to the right of the route (the bird faces north, -u), y up, w along the route, from the middle of its stance.
  const Wd = P.wader, MW = P.monument.wader, POSE = MW.poses, wf = frame(Wd.at[0], Wd.at[1]), N = POSE.awake.length;
  const world = (p, f = wf, k = 1, out = new THREE.Vector3()) => out.copy(f.o).addScaledVector(f.r, p[0] * k).addScaledVector(f.t, p[2] * k).setY(p[1] * k);
  const starList = [], now = POSE.asleep.map((p) => world(p));
  // THE EMPTY FIRST IMAGE. Until its lines draw, a star-bird must not be a thing in the sky. Twenty-two stars in eight
  // degrees (the wader asleep, 164 m off) or fourteen in three (a stander) are a cluster, however faint: the first image
  // showed five little clusters along the seam and one over the lamp. So before the lines draw only a star-bird's
  // PRINCIPAL stars are there (the wader's: plan.monument.wader.principal; a stander's: magnitude 1.9 and over, four of
  // its fourteen), as ordinary stars at `asleepGain` of their light; the rest kindle as the hairs reach them (uKindle 0..1).
  // The real rig must keep this rule. (t0 of a dab is used here as the flag: 1 = a principal star.)
  const principal = (mag) => (mag >= 1.9 ? 1 : 0);
  const kindle = (asleepGain) => { const u = { value: 0 }; return { u, extend: { uniforms: { uKindle: u }, pars: 'uniform float uKindle;', vertex: `light *= mix(aDabB.z * ${asleepGain.toFixed(3)}, 1.0, uKindle);` } }; };
  // (a constellation first: its stars are the brightest things in it, never above 1.6 where the lamp's flame is 6; every
  // star has a skirt in proportion to its magnitude, as the key painting's have, and a tint of its own within star white)
  const starLight = (i) => MW.light[0] + MW.light[1] * MW.mags[i];
  for (let i = 0; i < N; i++) starList.push({ x: now[i].x, y: now[i].y, z: now[i].z, size: MW.size[0] + MW.size[1] * MW.mags[i], light: starLight(i), halo: clamp01((MW.mags[i] - MW.halo[0]) / MW.halo[1]),
    color: MW.tints[i], rank: 1, rate: 0.12 + 0.05 * (i % 5), phase: i * 0.37, t0: MW.principal.includes(i) ? 1 : 0 });
  // the dust of smaller stars in the body, "suggesting the body between them as the key painting has it": each is a
  // place inside the kite (a share of each of its six stars, and a little to either side of its plane), so it follows the pose
  const KITE = [6, 7, 8, 5, 4, 9], Dm = MW.dust, motes = [];
  { const rnd = ctx.rng(Dm.seed);
    for (let k = 0; k < Dm.motes; k++) {
      // (evenly over the kite: a place in one of the six triangles between its middle and two neighbouring stars)
      let b = rnd(), c = rnd(); if (b + c > 1) { b = 1 - b; c = 1 - c; }
      b *= 0.92; c *= 0.92;
      const j = Math.floor(rnd() * 6), w = KITE.map((_, q) => (1 - b - c) / 6 + (q === j ? b : 0) + (q === (j + 1) % 6 ? c : 0)), sum = 1, side = (rnd() - 0.5) * 2 * Dm.across;
      motes.push({ w: w.map((v) => v / sum), side });
      starList.push({ x: 0, y: 500, z: 0, size: lerp(Dm.moteSize[0], Dm.moteSize[1], rnd()), light: lerp(Dm.moteLight[0], Dm.moteLight[1], rnd() * rnd()), color: rnd() < 0.2 ? C.rose : C.starWhite, rank: 0.15 + 0.3 * rnd(), rate: 0.05 + 0.1 * rnd(), phase: rnd(), t0: 0 });
    } }
  const wKindle = kindle(Wd.asleepGain);
  const wStars = sky.dabs(starList, { twinkle: 0.1, fog: 0.5, fade: [0.25, 0.6], extend: wKindle.extend });
  wStars.points.name = 'great wader (stars)';
  const wLines = sky.hairlines(Wd.lines.map(([a, b]) => ({ a: now[a].toArray(), b: now[b].toArray(), light: MW.line.light, width: MW.line.width })), { fog: 0.5, fade: [0.25, 0.5] });
  wLines.mesh.name = 'great wader (hairlines)';
  // THE DUST: three soft ellipsoid shells inside the kite of the body only, nebula violet with a little rose in the belly,
  // light added to the sky at six to ten parts in a hundred; a shell is brightest where the eye looks through its middle
  // and nothing at its rim (it has no outline), so the sky's stars show through all of it. One draw.
  const lobes = Dm.lobes, dustGeo = new THREE.SphereGeometry(1, 24, 14);
  const tone = new Float32Array(lobes.length * 3), size = new Float32Array(lobes.length * 3), cT = new THREE.Color();
  lobes.forEach((L, i) => { cT.set(L.color).multiplyScalar(L.light); tone.set([cT.r, cT.g, cT.b], i * 3); size.set(L.size, i * 3); });
  dustGeo.setAttribute('aTone', new THREE.InstancedBufferAttribute(tone, 3)); dustGeo.setAttribute('aSize', new THREE.InstancedBufferAttribute(size, 3));
  const dustMat = new THREE.ShaderMaterial({
    uniforms: { uGain: { value: 0 }, uSoft: { value: Dm.soft }, uVeil: ctx.engine.shared.uVeil, uFogDensity: ctx.engine.shared.uFogDensity },
    transparent: true, depthWrite: false, depthTest: true, ...sky.ADD, fog: false,
    vertexShader: /* glsl */`
      attribute vec3 aTone, aSize; uniform float uGain, uVeil, uFogDensity; varying vec3 vN, vV, vTone;
      void main() {
        vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.0);
        vN = normalize(mat3(modelMatrix) * (mat3(instanceMatrix) * (normal / (aSize * aSize))));      // the normal of a sphere drawn out into an ellipsoid
        vV = cameraPosition - wp.xyz; float dist = length(vV);
        vTone = aTone * uGain * (1.0 - uVeil) * (1.0 - 0.5 * (1.0 - exp(-uFogDensity * uFogDensity * dist * dist)));
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: /* glsl */`
      uniform float uSoft; varying vec3 vN, vV, vTone;
      void main() { gl_FragColor = vec4(vTone * pow(max(dot(normalize(vN), normalize(vV)), 0.0), uSoft), 1.0); }`,
  });
  const dust = new THREE.InstancedMesh(dustGeo, dustMat, lobes.length);
  dust.name = 'great wader (dust)'; dust.frustumCulled = false; dust.renderOrder = 3; ctx.add(dust);
  // a ring of star white 3 m across where a foot is down, and a pool of pale light 8 m across under it; the ring trembles
  // a little, steadily, and never dies while the foot stays
  const ringGeo = new THREE.PlaneGeometry(2, 2); ringGeo.rotateX(-Math.PI / 2);
  const ringMat = new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(C.starWhite) }, uGain: { value: 1 }, uVeil: ctx.engine.shared.uVeil, uSize: { value: new THREE.Vector2(Wd.ring * 0.5, Wd.pool * 0.5) }, uTremble: { value: 0 } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, side: THREE.DoubleSide,
    vertexShader: /* glsl */`varying vec2 vP; void main() { vP = position.xz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */`uniform vec3 uColor; uniform float uGain, uVeil, uTremble; uniform vec2 uSize; varying vec2 vP;
      void main() { float r = length(vP) * uSize.y, a = atan(vP.y, vP.x);
        float rr = uSize.x * (1.0 + 0.012 * sin(a * 5.0 + uTremble) + 0.008 * sin(a * 9.0 - uTremble * 1.7));
        float ring = exp(-pow((r - rr) / 0.16, 2.0)), inner = 0.05 * exp(-pow((r - rr * 0.55 - 0.1 * sin(uTremble * 0.6)) / 0.22, 2.0)), pool = 0.16 * exp(-pow(r / (uSize.y * 0.5), 2.0));
        gl_FragColor = vec4(uColor * ((ring * 1.4 + inner) + pool) * uGain * (1.0 - uVeil), 1.0); }`,
  });
  const rings = [0, 1].map(() => { const m = new THREE.Mesh(ringGeo, ringMat.clone()); m.scale.setScalar(Wd.pool * 0.5); m.position.y = 0.02; m.renderOrder = 3; m.name = 'great wader (standing ring)'; ctx.only(m, 'direct'); return ctx.add(m); });
  rings.forEach((m) => { m.material.uniforms.uVeil = ctx.engine.shared.uVeil; });

  stage.cue('wake', { s: Wd.sleepUntil, settle() {} }, () => {});               // moment: the wader wakes (16 s); staging adds the falling star, the footfall, the sounds
  stage.cue('bow', { s: Wd.bowFrom, settle() {} }, () => {});                   // moment: it bows across the route (9 s): the gate
  const mw = sky.milkyway;
  const mtx = new THREE.Matrix4(), tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3(), d0 = new THREE.Vector3(), fwd = new THREE.Vector3(), pa = new THREE.Vector3(), pb = new THREE.Vector3(), pc = new THREE.Vector3(), ez = (t) => t * t * (3 - 2 * t);
  const along = (deg, lat, out) => { const a = deg * Math.PI / 180, l = lat * Math.PI / 180; return out.set(0, 0, 0).addScaledVector(mw.A, Math.cos(a) * Math.cos(l)).addScaledVector(mw.Z, Math.sin(a) * Math.cos(l)).addScaledVector(mw.N, Math.sin(l)); };
  // (for the cast and staging: the 22 stars where they are now; feet: the two standing rings' places; keel: the breast the
  // boat passes under; head: the bill's tip, which sweeps the water; kite: the six stars of the body, in order round it)
  const wader = shared.wader = { at: wf.o.clone(), stars: now, awake: 0, bowed: 0, there: 1, feet: [now[0], now[1]], keel: now[9], head: now[21], crown: now[19], kite: KITE.map((i) => now[i]), lines: Wd.lines, poses: POSE, mags: MW.mags };

  // ---------------------------------------------------------------------------------------------- the ring of standers
  // STAND-IN for cast row 10: the wader's rig with 14 stars, asleep on one leg, profile to the lake's centre. Real places,
  // so that they shift against the far sky as the boat moves; things of the sky, so the lake's fog does not take them.
  const St = P.standers, pick = [0, 2, 4, 3, 6, 7, 8, 9, 10, 12, 14, 16, 18, 20], links = [[0, 1], [1, 2], [2, 3], [4, 5], [5, 6], [6, 2], [2, 7], [7, 4], [4, 8], [8, 9], [9, 10], [10, 11], [11, 12], [12, 13]];
  const centre = kit.at(St.centre[0], St.centre[1]), fc = path.at(St.centre[0]), sStars = [], sLines = [];
  St.birds.forEach(([bearing, dist, high, lean], bi) => {
    const a = bearing * Math.PI / 180, dir = new THREE.Vector3(fc.tx, 0, fc.tz).multiplyScalar(Math.cos(a)).add(new THREE.Vector3(fc.rx, 0, fc.rz).multiplyScalar(Math.sin(a)));
    const o = centre.clone().addScaledVector(dir, dist), side = new THREE.Vector3(-dir.z, 0, dir.x).multiplyScalar(bi % 2 ? 1 : -1);      // its profile lies square to the line from the lake's centre
    const f = { o, r: side, t: dir }, k = high / 50, pts = pick.map((i) => { const p = Wd.poses.asleep[i]; return world([p[0] + lean * p[1], p[1], p[2]], f, k); });
    pts.forEach((p, j) => sStars.push({ x: p.x, y: p.y, z: p.z, size: 2.4 + 0.9 * Wd.mags[pick[j]], light: 0.55 * Wd.mags[pick[j]], rank: 1, rate: 0.1 + 0.04 * (j % 5), phase: (bi * 7 + j) * 0.21, t0: principal(Wd.mags[pick[j]]) }));
    links.forEach(([i, j]) => sLines.push({ a: pts[i].toArray(), b: pts[j].toArray(), light: 0.4, width: 1.5 }));
  });
  const stKindle = kindle(St.asleepGain);
  const stStars = sky.dabs(sStars, { twinkle: 0.1, fog: 0, fade: St.fade, extend: stKindle.extend }); stStars.points.name = 'standin:ring of standers (stars)';
  const stLines = sky.hairlines(sLines, { fog: 0, fade: [St.fade[0], lerp(St.fade[0], St.fade[1], 0.5)] }); stLines.mesh.name = 'standin:ring of standers (hairlines)';

  // ---------------------------------------------------------------------------------------------- the skein
  // STAND-IN for cast row 11: nine star-birds in flight, a slack line 300 m long at 260 m, travelling along the Milky Way
  // from 30 degrees above the west to 20 above the east as the boat goes from s 86 to s 196. Each is a cross: neck and
  // legs in one line, wings set in the middle (14 stars, 13 lines).
  const Sk = P.skein, skStars = [], skLines = [], bird = [[0, -0.56], [0, -0.3], [0, -0.08], [0, 0.14], [0, 0.34], [0, 0.56], [-0.16, 0.02], [-0.32, 0.06], [-0.44, 0.12], [-0.5, 0.2], [0.16, 0.02], [0.32, 0.06], [0.44, 0.12], [0.5, 0.2]];
  const birdLinks = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [2, 6], [6, 7], [7, 8], [8, 9], [2, 10], [10, 11], [11, 12], [12, 13]];
  for (let b = 0; b < Sk.count; b++) { for (let j = 0; j < 14; j++) skStars.push({ x: 0, y: 500, z: 0, size: 2.4 + (j === 0 || j === 5 ? 0.8 : 0), light: 0.5, rank: 1, rate: 0.1, phase: b * 0.3 + j * 0.11 }); for (let j = 0; j < 13; j++) skLines.push({ a: [0, 500, 0], b: [0, 500, 1], light: 0.3, width: 1.4 }); }
  const skS = sky.dabs(skStars, { twinkle: 0.08, fog: 0, fade: St.fade }); skS.points.name = 'standin:skein (stars)';
  const skL = sky.hairlines(skLines, { fog: 0, fade: [St.fade[0], 0.45] }); skL.mesh.name = 'standin:skein (hairlines)';
  const skP = [];
  for (let i = 0; i < Sk.count * 14; i++) skP.push(new THREE.Vector3());

  return {
    update(dt, c) {
      const s = c.s, T = sky.T, e = sky.e;
      // ---- the ridge: a ghost without an edge while it is night; first light closes it up (before its air opens)
      if (ridge) {
        if (!ridge.cleared) { ridge.cleared = true; removeStandIn(ctx, 'white ridge'); }      // (heroes_b.js makes none once shared.ridge is published; this is for the day that changes)
        ridge.night.value.x = 1 - smooth(P.monument.ridge.ghost.until[0], P.monument.ridge.ghost.until[1], e);
        ridge.brine.value.y = P.monument.ridge.brine.lift * smooth(P.monument.ridge.brine.dawn[0], P.monument.ridge.brine.dawn[1], e);
        { const k = smooth(P.monument.ridge.form.dawn[0], P.monument.ridge.form.dawn[1], e), f = ridge.formCol; ridge.form.value.set(f.r * k, f.g * k, f.b * k, P.monument.ridge.form.pivot); }
        ridge.marks.value = smooth(P.monument.ridge.relief.dawn[0], P.monument.ridge.relief.dawn[1], e);      // the marks of the rake and the rain come with first light
      }
      // ---- the wader: asleep to s 100, then awake (16 s), bowed across the route from s 150 (9 s); gone with the stars
      const k1 = wader.awake = ez(clamp01(stage.since('wake') < 0 ? 0 : stage.since('wake') / 16)), k2 = wader.bowed = ez(clamp01(stage.since('bow') < 0 ? 0 : stage.since('bow') / 9));
      const A = POSE.asleep, B = POSE.awake, D = POSE.bowed, time = c.time, Lf = MW.life;
      for (let i = 0; i < N; i++) {
        world(A[i], wf, 1, pa); world(B[i], wf, 1, pb); world(D[i], wf, 1, pc);
        now[i].copy(pa).lerp(pb, k1).lerp(pc, k2);
      }
      // A SLOW LIFE while it stands (never seen dead; the rig's clips will be the real thing). Asleep: the body rises and
      // falls a hand over sixteen seconds. Awake: the head turns a degree and back in two minutes, about the top of the neck.
      { const breath = Lf.breath * Math.sin(time * 2 * Math.PI / Lf.breathEvery) * (1 - k1);
        for (let i = 6; i < N; i++) now[i].y += breath * (i < 10 ? 1 : 1.25);
        const turn = Lf.head * Math.PI / 180 * Math.sin(time * 2 * Math.PI / Lf.headEvery) * k1 * (1 - k2), piv = now[15], cs = Math.cos(turn), sn = Math.sin(turn);
        for (let i = 16; i < N; i++) { tmp.subVectors(now[i], piv); const u = tmp.dot(wf.r), y = tmp.y; now[i].copy(piv).addScaledVector(wf.r, u * cs - y * sn).addScaledVector(wf.t, tmp.dot(wf.t)); now[i].y = piv.y + u * sn + y * cs; } }
      for (let i = 0; i < N; i++) wStars.set(i, now[i].x, now[i].y, now[i].z);
      motes.forEach((m, k) => { tmp.set(0, 0, 0); for (let j = 0; j < 6; j++) tmp.addScaledVector(now[KITE[j]], m.w[j]); tmp.addScaledVector(wf.t, m.side); wStars.set(N + k, tmp.x, tmp.y, tmp.z); });
      Wd.lines.forEach(([a, b], i) => wLines.set(i, [now[a].x, now[a].y, now[a].z], [now[b].x, now[b].y, now[b].z]));
      // one star at a time brightens and settles (a different one every time, in an order set by hand); and a foot that is
      // not down has not its ring's brilliance (asleep, the folded foot is a small star under the belly)
      { const n = Math.floor(time / Lf.every), ph = (time - n * Lf.every) / Lf.swell, star = Lf.order[n % Lf.order.length], bell = ph < 1 ? Math.pow(Math.sin(Math.PI * ph), 2) : 0;
        if (wader.lit !== undefined && wader.lit !== star) wStars.setLight(wader.lit, starLight(wader.lit));
        wader.lit = star;
        wStars.setLight(star, starLight(star) * (1 + Lf.by * bell));
        if (star !== 1) wStars.setLight(1, starLight(1) * lerp(MW.folded, 1, k1));
        const ad = wStars.geometry.attributes.aDab; ad.setX(1, lerp(MW.size[0] + MW.size[1] * 1.3, MW.size[0] + MW.size[1] * MW.mags[1], k1)); ad.setZ(1, clamp01((MW.mags[1] - MW.halo[0]) / MW.halo[1]) * k1); ad.needsUpdate = true; }      // (and it is a small star, with no skirt)
      // in the showstopper it walks, opens its wings and leaves (the rig's, and staging's): here it only goes out
      const there = wader.there = (T < 0 ? 1 : 1 - smooth(P.show.waderGone - 6, P.show.waderGone, T)) * (1 - smooth(0.25, 0.6, e));
      // (until its lines draw, a constellation's stars are ordinary faint stars among the others: the first image is empty)
      const drawn = smooth(84, 92, s);
      wStars.material.uniforms.uGain.value = there; wKindle.u.value = smooth(82, 92, s); wLines.material.uniforms.uGain.value = there;
      stKindle.u.value = smooth(St.drawFrom - 2, St.drawTo, s);
      wLines.material.uniforms.uDraw.value = drawn;                             // the lines draw themselves: the standers first (s 76), the wader last (s 86)
      stLines.material.uniforms.uDraw.value = smooth(St.drawFrom, St.drawTo, s);
      // the dust: in the kite's own frame (its long axis from the shoulder to the tail, its plane upright across the route)
      { const O = tmp.set(0, 0, 0); for (const i of KITE) O.addScaledVector(now[i], 1 / 6);
        const ax = tmp2.subVectors(now[8], now[6]).normalize(), up = d0.crossVectors(wf.t, ax).normalize(); if (up.y < 0) up.negate();
        lobes.forEach((L, i) => {
          pa.copy(O).addScaledVector(ax, L.at[0]).addScaledVector(up, L.at[1]);
          mtx.makeBasis(ax, up, fwd.crossVectors(ax, up)).scale(pb.set(L.size[0], L.size[1], L.size[2])).setPosition(pa);      // (a right-handed frame: a mirrored shell shows its back, which is nothing)
          dust.setMatrixAt(i, mtx);
        });
        dust.instanceMatrix.needsUpdate = true;
        dustMat.uniforms.uGain.value = there * drawn * (1 - smooth(0.25, 0.5, e)) * (1 + Dm.breath * Math.sin(time * 2 * Math.PI / Lf.breathEvery + 1.0));
        dust.visible = dustMat.uniforms.uGain.value > 0.004; }
      const down = k1 > 0.5 ? [0, 1] : [0];
      rings.forEach((m, i) => { const on = down.includes(i) ? (i === 1 ? smooth(0.35, 0.6, k1) : 1) : 0; m.position.set(now[i].x, 0.02, now[i].z); m.material.uniforms.uGain.value = on * there * drawn; m.material.uniforms.uTremble.value = time * 2.1 + i * 1.7; m.visible = m.material.uniforms.uGain.value > 0.01; });
      // ---- the skein: where it is depends on where the boat is (it travels along the Milky Way as the boat advances)
      const k = clamp01((s - Sk.from[0]) / (Sk.to[0] - Sk.from[0])), where = lerp(180 - Sk.from[1], Sk.to[1], k) - (stage.calm ? 0 : 0.5 * Math.sin(c.time * 0.05) * 5);
      along(where, 3, d0); along(where - 90, 3, fwd); const sideV = tmp.crossVectors(d0, fwd).normalize();
      const dist = Sk.height / Math.max(0.2, d0.y), boat = c.boat, show = smooth(Sk.from[0] - 10, Sk.from[0], s) * (1 - smooth(Sk.to[0] + 6, Sk.to[0] + 40, s));
      for (let b = 0; b < Sk.count; b++) {
        // (an echelon, slack: each bird a span to the side of the one ahead, so that seen along its own line, low over
        // the east or the west, no bird lies over another: in one file they were a tangle of hairs)
        // (and nearly two spans to the side: at one span, wing tip touched wing tip and the nine crosses were a fence
        // across the Milky Way. The page's own numbers do that whichever way the line lies: nine birds of 34 m in 300 m.)
        const off = (b - (Sk.count - 1) / 2) * (Sk.length / (Sk.count - 1)), sag = (b - (Sk.count - 1) / 2) * Sk.span * Sk.abreast + 9 * Math.sin(b * 1.9);
        pa.set(boat.x, 0, boat.z).addScaledVector(d0, dist).addScaledVector(fwd, off).addScaledVector(sideV, sag); pa.y = Sk.height + 6 * Math.sin(b * 2.7);
        const flap = 0.12 * Math.sin(c.time * 2 * Math.PI / 5 + b * 0.8);
        for (let j = 0; j < 14; j++) { const q = bird[j], lift = Math.abs(q[0]) * Sk.span * flap * 2.2; skP[b * 14 + j].copy(pa).addScaledVector(fwd, -q[1] * Sk.span * 1.1).addScaledVector(sideV, q[0] * Sk.span); skP[b * 14 + j].y += lift; skS.set(b * 14 + j, skP[b * 14 + j].x, skP[b * 14 + j].y, skP[b * 14 + j].z); }
        birdLinks.forEach(([i, j], n) => { const A2 = skP[b * 14 + i], B2 = skP[b * 14 + j]; skL.set(b * 13 + n, [A2.x, A2.y, A2.z], [B2.x, B2.y, B2.z]); });
      }
      skS.material.uniforms.uGain.value = show; skL.material.uniforms.uGain.value = show;
    },
  };
}
