// The answering sea: the place and its light. The sky (a storm ceiling in two registered panoramas), the far
// headlands, the air, the light states, the water's character, the rain front and the number `L`, and the edge of
// the reachable sea. Everything here is what docs/art/sea.md sections 2, 3 (vista) and 7 ask for.
//
// What this module puts in `shared` for the others:
//   shared.sea            the sea's light (light.js): sea.rock(opts) is the seaRock material, sea.surf(outlines) the
//                         surf light round the feet of things, sea.extend(opts) the same for kit.model
//   shared.sea.L          0..1: the sea's light where the BOAT is (0 until the rain front reaches it), updated every frame
//   shared.sea.T          the showstopper's clock in seconds (-1 before the cue 'answering' at s 150): hang every beat on it
//   shared.sea.front      { nx, nz, offset, behind(x, z) }: the rain front's line; behind() is metres behind it (negative: ahead)
//   shared.sea.rain       0..1: how much rain falls on the boat now
//
// Light states (ctx.lookStates): dark (the first seconds in the veil), rest (L 0), air (the air opens ahead of the
// front: the page ties fog to L, but then the front and the far pipes it lights are hidden until it has arrived),
// lit (L 1). They are driven from update() by the show clock and the boat's distance along, never by a wall clock.
import { makeSeaLight } from './light.js';
import { smooth, lerp, clamp01 } from './plan.js';

export async function build(ctx, plan, shared) {
  const { THREE, kit, stage } = ctx, sh = ctx.engine.shared, P = plan;
  const sea = shared.sea = makeSeaLight(ctx, plan);

  // ------------------------------------------------------------------------------------------ painted art
  // The sky's two panoramas and the far headlands (tools/art.py; docs/art/sea.md section 10). Until they exist the sky
  // is the page's gradient alone and there are no headlands: the area still builds.
  const tryTex = (have, url) => (have ? ctx.tex(url).catch(() => null) : Promise.resolve(null));
  const [texA, texB] = await Promise.all([tryTex(P.art.sky, 'art/sea/sky.webp'), tryTex(P.art.skyglow, 'art/sea/skyglow.webp')]);

  // ------------------------------------------------------------------------------------------ the sky
  // A dome with panoramas A (the storm ceiling, barely there) and B (the same clouds lit from below), and a moving
  // edge between them: a part of the sky is lit when the cloud there hangs over water the rain front has passed.
  const col = (c) => new THREE.Color(c);
  const aspect = texA ? (texA.userData.aspect || 3) : 3;
  const lo = Math.atanh(Math.sin(-4 * Math.PI / 180)), hi = lo + 2 * Math.PI / aspect;      // the picture keeps its shapes (Mercator heights), as kit.sky does
  for (const t of [texA, texB]) if (t) { t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.ClampToEdgeWrapping; t.needsUpdate = true; }
  const skyU = {
    uVeil: sh.uVeil, uVeilColor: sh.uVeilColor, uEye: sh.uCameraPos, uSeaFront: sea.uniforms.uSeaFront, uSeaL: sea.uniforms.uSeaL,
    uTop0: { value: col(P.sky.rest.top) }, uMid0: { value: col(P.sky.rest.mid) }, uHor0: { value: col(P.sky.rest.horizon) },
    uTop1: { value: col(P.sky.lit.top) }, uMid1: { value: col(P.sky.lit.mid) }, uHor1: { value: col(P.sky.lit.horizon) },
    uMidAt: { value: P.sky.midAt }, uBand: { value: new THREE.Vector2(lo, hi) }, uRotation: { value: 0 },
    uGain: { value: new THREE.Vector4(P.sky.rest.a, P.sky.lit.a, P.sky.lit.b, 0) },
    uCeil: { value: new THREE.Vector3(P.sky.ceiling, 1 / 160, Math.sin(P.sky.underlightTop * Math.PI / 180)) }, uGrey: { value: P.sky.grey },
    uHue0: { value: new THREE.Vector3(...P.sky.hueRest) }, uHue1: { value: new THREE.Vector3(...P.sky.hueLit) }, uHueHi: { value: new THREE.Vector3(...(P.sky.hueHigh || P.sky.hueRest)) }, uHueAt: { value: new THREE.Vector2(...(P.sky.hueAt || [0.5, 1])) }, uGlowTint: { value: new THREE.Vector3(...P.sky.glowTint) },
    uFogColor: sh.uFogColor, uHaze: { value: P.sky.haze }, uShape: { value: new THREE.Vector4(P.sky.gamma, Math.sin(P.sky.underlightFrom * Math.PI / 180), P.sky.underlightHigh, P.sky.soften) },
    tA: { value: texA }, tB: { value: texB || texA }, uSoftLit: { value: P.sky.softenLit ?? 1 },
  };
  const skyMat = new THREE.ShaderMaterial({
    uniforms: skyU, side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false,
    defines: texA ? { PANO: '' } : {},
    vertexShader: /* glsl */`varying vec3 vDir; void main() { vDir = normalize(position); vec4 p = projectionMatrix * viewMatrix * vec4(position + cameraPosition, 1.0); gl_Position = p.xyww; }`,
    fragmentShader: /* glsl */`
      uniform vec3 uTop0, uMid0, uHor0, uTop1, uMid1, uHor1, uVeilColor, uEye, uCeil, uHue0, uHue1, uHueHi, uGlowTint, uFogColor; uniform float uMidAt, uVeil, uRotation, uHaze; uniform vec4 uShape;
      uniform vec2 uBand; uniform vec4 uGain, uSeaFront, uSeaL; uniform sampler2D tA, tB; uniform float uGrey, uSoftLit; uniform vec2 uHueAt;
      // the paintings are bluer than this night: pulled toward slate at rest and toward the key painting's indigo when lit (the standing sky owns ultramarine)
      // (and split: the ceiling's darks are slate, its lights lean to violet)
      vec3 slate(vec3 c, vec3 hue) { float l = dot(c, vec3(0.25, 0.5, 0.25)); return mix(c, l * mix(hue, uHueHi, smoothstep(uHueAt.x, uHueAt.y, l)), uGrey); }
      varying vec3 vDir;
      void main() {
        vec3 d = normalize(vDir);
        float e = asin(clamp(d.y, -1.0, 1.0)), t = clamp(e / 1.5708, 0.0, 1.0);
        // is the cloud in this direction over lit water? (the ceiling is taken to hang uCeil.x metres up)
        vec2 over = uEye.xz + d.xz * min(uCeil.x / max(d.y, 0.012), 5000.0);
        float lit = clamp((uSeaFront.z - dot(uSeaFront.xy, over)) * uCeil.y + 0.5, 0.0, 1.0);
        lit = lit * lit * (3.0 - 2.0 * lit) * uSeaL.x * uSeaL.w;
        vec3 top = mix(uTop0, uTop1, lit), mid = mix(uMid0, uMid1, lit), hor = mix(uHor0, uHor1, lit);
        vec3 c = t < uMidAt ? mix(hor, mid, smoothstep(0.0, uMidAt, t)) : mix(mid, top, smoothstep(uMidAt, 1.0, t));
        #ifdef PANO
          float ua = (atan(d.x, -d.z) + uRotation) / 6.2831853, ub = fract(ua);
          float h = 0.5 * log((1.0 + d.y) / max(1e-5, 1.0 - d.y)), v = (h - uBand.x) / (uBand.y - uBand.x);
          vec2 uvA = vec2(ua + 0.5, v), uvB = vec2(ub + 0.5, v);
          vec2 gx = dFdx(uvA), gy = dFdy(uvA), hx = dFdx(uvB), hy = dFdy(uvB);
          if (dot(hx, hx) + dot(hy, hy) < dot(gx, gx) + dot(gy, gy)) { gx = hx; gy = hy; }
          if (v > 0.0 && v < 1.0) {
            float fade = smoothstep(0.0, 0.04, v) * (1.0 - smoothstep(0.72, 1.0, v));
            // (the painting's fine slanting strokes read as rain: at rest, before any rain, they are softened away and only the ceiling's forms are left)
            float soft = mix(uShape.w, uSoftLit, lit);                                // (lit, a little of that softening is kept: sharp, the strokes are white scratches all over the low sky)
            vec3 a = textureGrad(tA, uvA, gx * soft, gy * soft).rgb, b = textureGrad(tB, uvA, gx * uSoftLit, gy * uSoftLit).rgb;
            // A is the ceiling's own shapes; B is the same ceiling lit from below, and only what B adds to A is the light
            vec3 glowB = max(b - a * 0.6, 0.0) * uGlowTint;
            // (the painting is low in contrast, as a night should be painted; its forms are drawn out here so that the ceiling can be read)
            a = slate(pow(a, vec3(uShape.x)), mix(uHue0, uHue1, lit));
            // the underlight: nothing in the air at the horizon itself, full a few degrees up, gone by underlightTop but for a breath
            float under = smoothstep(0.0, uShape.y, d.y) * (1.0 - smoothstep(uShape.y, uCeil.z, d.y) * (1.0 - uShape.z));
            c += (a * mix(uGain.x, uGain.y, lit) + glowB * (uGain.z * lit * under)) * fade;
          }
        #endif
        // the air at the horizon: the sky's lowest degree and a half takes the colour of the far water (the fog's), so that the
        // horizon is a soft line that can be read, never a cut; under it (beyond the water's own sheet) there is only that colour
        c = mix(c, uFogColor, max(uHaze * (1.0 - smoothstep(0.0, 0.028, d.y)), 1.0 - smoothstep(-0.02, 0.0, d.y)));
        gl_FragColor = vec4(mix(c, uVeilColor, uVeil), 1.0);
      }`,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 24), skyMat);
  sky.name = 'sea-sky'; sky.renderOrder = -1000; sky.frustumCulled = false;
  ctx.add(sky);

  // ------------------------------------------------------------------------------------------ far headlands
  // Three painted strips on a curved rail centred on local (0, -180), 300 to 470 m off, from yaw +10 to +125 (to the
  // left of the route): the only painted scenery in the realm. They take the air's colour: at rest dark shapes a step
  // under the low sky, lit the key painting's far blue. A strip whose painting is cut off square at an end comes down
  // to the sea there in steps, as a headland does (plan.far.strips[].ends), so that no strip shows where it stops
  // from anywhere the boat can be.
  const farTex = P.art.far ? await ctx.tex('art/sea/far.webp').catch(() => null) : null;
  if (farTex) {
    const F = P.far, y0 = F.yaw[0] * Math.PI / 180, y1 = F.yaw[1] * Math.PI / 180, N = 48;
    F.strips.forEach((st, i) => {
      const pos = [], uv = [], idx = [];
      for (let k = 0; k <= N; k++) { const u = k / N, a = y0 + (y1 - y0) * u, x = F.centre[0] - Math.sin(a) * st.r, z = F.centre[1] - Math.cos(a) * st.r; pos.push(x, -1.2, z, x, st.high - 1.2, z); uv.push(u, 0, u, 1); }
      for (let k = 0; k < N; k++) { const q = k * 2; idx.push(q, q + 2, q + 1, q + 1, q + 2, q + 3); }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx);
      const ends = st.ends || [0, 0];
      const mat = new THREE.ShaderMaterial({
        uniforms: { map: { value: farTex }, uRow: { value: new THREE.Vector4(...st.uv) }, uEnds: { value: new THREE.Vector3(ends[0], ends[1], i * 7.3 + 1.1) }, uTint: { value: col(F.tint) }, uFogShare: { value: F.fog },
          uFogColor: sh.uFogColor, uFogDensity: sh.uFogDensity, uVeil: sh.uVeil, uVeilColor: sh.uVeilColor },
        side: THREE.DoubleSide, fog: false,
        vertexShader: /* glsl */`varying vec2 vUv; varying float vDist; void main() { vUv = uv; vec4 mv = modelViewMatrix * vec4(position, 1.0); vDist = length(mv.xyz); gl_Position = projectionMatrix * mv; }`,
        fragmentShader: /* glsl */`uniform sampler2D map; uniform vec4 uRow; uniform vec3 uEnds, uTint, uFogColor, uVeilColor; uniform float uFogShare, uFogDensity, uVeil;
          varying vec2 vUv; varying float vDist;
          float h1(float n) { return fract(sin(n * 127.1 + uEnds.z) * 43758.5453); }
          void main() {
            vec4 t = texture2D(map, vec2(mix(uRow.x, uRow.z, vUv.x), mix(uRow.y, uRow.w, vUv.y)));
            // where the painting stops square, the land comes down to the sea in ledges
            float lim = 1.0;
            if (uEnds.x > 0.0) lim = min(lim, smoothstep(0.0, uEnds.x, vUv.x));
            if (uEnds.y > 0.0) lim = min(lim, 1.0 - smoothstep(1.0 - uEnds.y, 1.0, vUv.x));
            if (lim < 1.0) { float st = floor(vUv.x * 90.0); lim = pow(lim, 0.6) * (0.86 + 0.28 * h1(st)) + 0.02; }
            if (t.a < 0.5 || vUv.y > lim) discard;
            float f = (1.0 - exp(-uFogDensity * uFogDensity * vDist * vDist)) * uFogShare;
            gl_FragColor = vec4(mix(mix(t.rgb * uTint, uFogColor, f), uVeilColor, uVeil), 1.0);
          }`,
      });
      const m = new THREE.Mesh(geo, mat); m.name = 'far-headland-' + i; m.frustumCulled = false; ctx.add(m);
    });
  }

  // ------------------------------------------------------------------------------------------ the air at rest: low mist
  // Depth in layers before any rain. A thin mist lies in the gate and in the cleft (the swell's breath, held between
  // walls), a little among the pipes, and a few veils hang low over the sound and the open sea, between the boat and
  // what stands far off. Slate: a step lighter than rock, a step darker than the low sky, so that a near rock stands
  // dark against it and a far one sinks into it. It thins away as the front arrives (the rain takes the air).
  const mists = [];
  if (P.mist) for (const m of P.mist.list) {
    const mesh = kit.mist({ count: m.count, from: m.from, to: m.to, spread: m.spread, y: m.y, size: m.size, color: P.mist.color, opacity: m.opacity, drift: P.mist.drift, seed: m.seed });
    mesh.name = 'sea-mist'; ctx.only(mesh, 'direct');
    mists.push({ u: mesh.material.uniforms.uOpacity, opacity: mesh.material.uniforms.uOpacity.value });
  }

  // ------------------------------------------------------------------------------------------ the rain front's direction
  // (the rain in the air, the far curtains and the wall of the front are in air.js; here only the line they all follow)
  const fn = (() => { const a = ctx.path.at(P.front.trigger[0]), t = P.front.turn * Math.PI / 180; return { x: a.rx * Math.cos(t) - a.tx * Math.sin(t), z: a.rz * Math.cos(t) - a.tz * Math.sin(t) }; })();      // the front's direction of travel: to the right, 15 degrees up the route
  sea.uniforms.uSeaKey.value.set(-fn.x, -fn.z, 0, 0);                                    // rock takes the sky's light most on the side turned to where the front comes from
  { // the low land (the skerry): its waterline, for the rock's light (light.js, uSeaLand): the sea lights a shore, not the whole of a low rock
    const pts = (P.skerry && P.skerry.outline ? P.skerry.outline : []).slice(0, 12).map(([s0, d0]) => kit.at(s0, d0)), U = sea.uniforms;
    if (pts.length >= 3) {
      let cx = 0, cz = 0, r = 0; for (const p of pts) { cx += p.x / pts.length; cz += p.z / pts.length; }
      for (const p of pts) r = Math.max(r, Math.hypot(p.x - cx, p.z - cz));
      pts.forEach((p, i) => U.uSeaLand.value[i].set(p.x, p.z)); U.uSeaLandN.value = pts.length; U.uSeaLandC.value.set(cx, cz, r + 1, (P.rock.inland ?? 3.6));
    }
  }
  { // the cleft and its cave: no sky inside (light.js, uSeaCave): the middle of its mouth, the way in, half its width with its walls, metres over which the sky dies
    const m = ctx.path.at(P.wall.s); sea.uniforms.uSeaCave.value.set(m.x, m.z, m.tx, m.tz); sea.uniforms.uSeaCaveB.value.set(P.wall.cleft.half + 6, 9, P.rock.cave ? P.rock.cave[0] : 0.6, P.rock.cave ? P.rock.cave[1] : 1.0);
  }

  // ------------------------------------------------------------------------------------------ the sea's light on the water
  const sheet = sea.sheet();
  sheet.uniforms.uFleck.value.set(...P.seaLight.fleck);
  { const d = P.water.swellDir, l = Math.hypot(d[0], d[1]) || 1; sheet.uniforms.uSwellDir.value.set(d[0] / l, d[1] / l, 0, 0); }      // streaks of light lie along the crests

  // ------------------------------------------------------------------------------------------ light states
  const LS = ctx.lookStates({ rest: {}, dark: { look: P.look.dark }, air: { look: P.look.air, water: P.waterAir || {} }, lit: { look: P.look.lit, water: P.waterLit || {} } });
  stage.cue('firstlight', { s: P.firstLight, settle() {} }, () => {});            // moment 0/1: the first swell lifts the bow and the water it shoulders aside lights
  stage.cue(P.show.cue, { s: P.show.s, settle() {} }, () => {});                   // moment 9, the answering: staging hangs its beats on shared.sea.T

  const trig = kit.at(P.front.trigger[0], P.front.trigger[1]), off0 = fn.x * trig.x + fn.z * trig.z;
  const front = sea.front = { nx: fn.x, nz: fn.z, offset: -1e5, behind: (x, z) => front.offset - (fn.x * x + fn.z * z) };
  const W0 = P.water, tmp = {}, sheenCol = new THREE.Color(), caveFog = new THREE.Color(P.look.cave.fog);
  sea.rain = 0;
  const params = new URLSearchParams(location.search), restOnly = params.has('rest');      // &rest=1: the sea as it is before the rain, wherever the boat is put (for pictures)
  const gateAt = kit.at(P.gate.s, 0);

  return {
    update(dt, c) {
      const s = c.s, boat = c.boat, calm = stage.calm;
      // ---- the show clock and the rain front. Before the cue the front waits far out; from s 144 (the weather
      // turns) it has come in to 150 m short of the trigger point; then it advances.
      const T = sea.T = restOnly ? -1 : stage.clock(P.show.cue, P.show.by);
      const short = T < 0 ? lerp(P.front.parked, P.front.short, smooth(144, 150, s)) : P.front.short - (calm ? P.front.calmSpeed : P.front.speed) * Math.min(T, 600);
      front.offset = off0 - short;
      const sd = front.behind(boat.x, boat.z);                                     // metres the front has gone past the boat
      // ---- L where the boat is; the air opens ahead of it
      const by = P.lightBy(s);
      const L = sea.L = smooth(-19, 12.5, sd) * by;
      const air = Math.max(L, T < 0 ? 0 : smooth(0, 8, T) * (1 - smooth(238, 252, s)));
      const k1 = stage.ramp('firstlight', calm ? 10 : 8), rest = 1 - air;
      LS.set({ lit: L, air: air - L, rest: rest * k1, dark: rest * (1 - k1) });
      // ---- what the states do not carry (set after LS.set, which writes the whole look)
      const look = c.look, W = c.waterLook;
      // inside the cleft and its cave the air is the cave's: dark (the far water takes the fog's colour, and in the open sea's air the cave had a pale blue floor)
      { const k = smooth(P.look.cave.from, P.look.cave.to, s); if (k > 0) { look.fog.color.lerp(caveFog, k); look.background.lerp(caveFog, k); } }
      // (stage 5: with reduced motion the front takes eight seconds longer and the whale now waits for it (cast_whale.js, calmWait): the water is held back those eight seconds too)
      const cur = P.currentBy(s), showLen = P.show.length + (calm ? 8 : 0), showing = T >= 0 && T < showLen ? smooth(0, 2, T) * (1 - smooth(showLen - 2, showLen, T)) : 0;
      look.current = lerp(cur.wide, P.show.current, showing); look.currentNarrow = lerp(cur.narrow, P.show.current, showing);
      const answer = stage.ramp('firstlight', 1.5) * (1 - smooth(236, 256, s));      // the water answers from s 14; its light dies in the cave
      W.rippleGlowStrength = W0.rippleGlowStrength * answer;
      // a boat carried at 1.2 m/s (the sound) hardly churns the water: there the trace takes its light more readily, so that
      // a rider left to the current still writes a road; at 2.2 m/s and when paddling it takes less, or the road is a carpet
      W.touch.wake = lerp(W0.touch.wakeSlow, W0.touch.wake, smooth(1.0, 2.3, boat.speed));
      W.swell = W0.swell * (1 - smooth(236, 256, s));
      W.front.normal[0] = fn.x; W.front.normal[1] = fn.z; W.front.offset = front.offset; W.front.width = P.front.width; W.front.rain = 1;
      W.rain = W0.rain * P.rainBy(s);
      // ---- the sea's light on rock and surf (light.js), and the sky
      const U = sea.uniforms, w3 = P.swellWaves, om = 2 * Math.PI / (W.swellPeriod || 7);
      U.uSeaOmega.value.set(om / Math.sqrt(w3[0]), om / Math.sqrt(w3[1]), om / Math.sqrt(w3[2]));
      U.uSeaFront.value.set(fn.x, fn.z, front.offset, 1 / 30);
      // inside the gate every crest of the swell floods light up the vault (moment 5; staging makes three of them great)
      const crest = smooth(0.16, 0.7, c.water.heightAt(gateAt.x, gateAt.z) / Math.max(0.05, 0.5 * W.swell)), inGate = smooth(80, 89, s) * (1 - smooth(103, 110, s));
      sea.state.gate = (sea.state.gate || 0) + ((crest * inGate) - (sea.state.gate || 0)) * (1 - Math.exp(-dt / (crest * inGate > (sea.state.gate || 0) ? 0.5 : 1.3)));
      U.uSeaL.value.set(by, answer, sea.state.gate, T < 0 ? 0 : smooth(0, 3, T));
      sheet.uniforms.uSheet.value.set(P.seaLight.wake, P.rainBy(s), P.front.width * 0.5, P.seaLight.rain * by);
      sheet.update(boat, W.swell * (c.reducedMotion ? 0.35 : 1) > 0.001);
      // the short sea that rides the swell (the sheet draws it in light): its clock runs at half pace with reduced motion
      if (P.seaChop) sheet.uniforms.uChop.value.set(c.time * (calm ? 0.5 : 1), P.seaChop.share, P.seaChop.high, P.seaChop.swell ?? 0.45);
      // the ridge lines of the swell and the far dashes (the sheet draws them)
      if (P.seaRidge) sheet.uniforms.uRidge.value.set(P.seaRidge.width, P.seaRidge.rest, P.seaRidge.lit, 0);
      if (P.seaGlint) { const g = sheet.uniforms.uGlint.value; g.y = P.seaGlint.bright; g.z = P.seaGlint.many; g.w = P.seaGlint.band; }
      // the sky on the backs of the swell: full at rest, less behind the front (the sea's own light speaks there), none inside the cleft (no sky)
      if (P.seaSheen) { sheenCol.set(P.seaSheen.color); sheet.uniforms.uSheenB.value.set(P.seaSheen.meet ?? 0.26, P.seaSheen.far ?? 0.7, P.seaSheen.aslant ?? 0.45, P.seaSheen.high ?? 1.0); sheet.uniforms.uSheen.value.set(sheenCol.r, sheenCol.g, sheenCol.b, lerp(P.seaSheen.rest, P.seaSheen.lit, L) * (1 - smooth(234, 246, s))); }
      skyU.uRotation.value = (P.sky.turn + c.time * P.sky.drift * (calm ? 0.5 : 1)) * Math.PI / 180;
      for (const m of mists) m.u.value = m.opacity * (1 - 0.9 * Math.max(L, air)) * (0.35 + 0.65 * k1);      // the mist: thin in the first dark, gone under the rain
      // ---- how much rain falls on the boat now (air.js draws it): behind the front, eased toward the tower, none in the cleft
      sea.rain = smooth(-6, 10, sd) * P.rainBy(s) * (1 - smooth(234, 237, s));

      // ---- the edge of the reachable sea: beyond the half width the water leans the boat back, harder and harder
      const hw = ctx.path.at(boat.s, tmp).halfWidth, lim = P.limits, out = Math.abs(boat.d) - hw;
      if (out > lim.lean) {
        const push = Math.min(9, (out - lim.lean) * (9 / (lim.stop - lim.lean))) * 2.2 * dt, side = Math.sign(boat.d);
        boat.slipX -= tmp.rx * side * push; boat.slipZ -= tmp.rz * side * push;
      }
      // west of the Prow, outside the cave: back up the route (the path may only be left through the cave)
      if (boat.s > lim.endStop && out > 1) {
        const push = Math.min(9, (boat.s - lim.endStop) * 0.9) * 2.2 * dt;
        boat.slipX -= tmp.tx * push; boat.slipZ -= tmp.tz * push;
      }
    },
  };
}
