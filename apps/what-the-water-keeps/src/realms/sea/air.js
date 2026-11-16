// The answering sea: the air, and two small things that have to run after every other module.
//
//   rain          20,000 streaks in a 40 m box round the eye, behind the rain front: slanted 12 degrees from the left,
//                 9 m/s, 0.5 to 0.9 m long. Rain here is seen only by the light of the sea below it: each streak is
//                 brightest at its foot and just above the water, violet and faint higher up; slate, never white
//   curtains      five veils of far rain hanging over the open sea to the left (220 to 480 m), grey-violet, slanted,
//                 falling, lit at the foot when the sea under them is lit; and the wall of the front itself, from sea
//                 to cloud, which crosses the strait with the front's line and thins away as it reaches the eye
//   the hull's own light    a boat carried slowly (1.2 m/s in the sound) hardly churns the water, and wrote almost
//                 nothing: the hull now writes its own lane into the water's trace whenever it moves, more where the
//                 bow comes down on a crest. A boat that lies still writes nothing
//   the lamp's stroke       the kept lamp's reflection is made in heroes.js from a halo given to the mirror alone; with
//                 the tone curve's toe out its old brightness clips to white. It is held here to a value that stays
//                 amber (this module's update runs after heroes')
//
// Everything is driven by what set.js keeps in shared.sea: the front's line, L, the rain's share, the show clock.
import { SEA_GLSL, SEA_CORE } from './light.js';
import { FOG_PARS } from '../../engine/kit.js';
import { WATER_GLSL, waterUniforms } from '../../engine/water-final.js';
import { smooth, lerp } from './plan.js';

export async function build(ctx, plan, shared) {
  const { THREE, kit, stage } = ctx, sh = ctx.engine.shared, P = plan, sea = shared.sea, engine = ctx.engine;
  if (!sea || !sea.front) return {};                       // (the light did not build: nothing to stand in)
  const C = P.colors, U = sea.uniforms, fn = { x: sea.front.nx, z: sea.front.nz };
  const col = (c) => new THREE.Color(c);
  const fogU = { uFogColor: sh.uFogColor, uFogDensity: sh.uFogDensity, uVeil: sh.uVeil, uVeilColor: sh.uVeilColor };
  const seaU = { uSwell: U.uSwell, uSeaOmega: U.uSeaOmega, uSeaFront: U.uSeaFront, uSeaL: U.uSeaL, uSeaLee: U.uSeaLee };

  // ------------------------------------------------------------------------------------------ rain in the air
  const R = P.rainAir, n = kit.count(R.count), rnd = ctx.rng(31);
  const slant = Math.sin(R.slant * Math.PI / 180) * R.speed, fall = Math.cos(R.slant * Math.PI / 180) * R.speed;
  const rainGeo = new THREE.InstancedBufferGeometry();
  rainGeo.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, 0, 0.5, 0, 0, 0.5, 1, 0, -0.5, 1, 0], 3)); rainGeo.setIndex([0, 1, 2, 0, 2, 3]);
  const seeds = new Float32Array(n * 4); for (let i = 0; i < n * 4; i++) seeds[i] = rnd();
  rainGeo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seeds, 4)); rainGeo.instanceCount = 0;
  const rainU = {
    ...fogU, ...seaU, uTime: sh.uTime, uBox: { value: new THREE.Vector3(...R.box) }, uVel: { value: new THREE.Vector3(fn.x * slant, -fall, fn.z * slant) },
    uLen: { value: new THREE.Vector2(...R.len) }, uPixel: { value: 0.0012 }, uOpacity: { value: 0 }, uReach: { value: R.reach },
    uSlate: { value: col(C.slate) }, uAqua: { value: col(C.aqua) }, uViolet: { value: col(C.violet) }, uCore: { value: col(C.core) },
  };
  const rainMat = new THREE.ShaderMaterial({
    uniforms: rainU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, side: THREE.DoubleSide,
    vertexShader: /* glsl */`${SEA_GLSL} ${FOG_PARS}
      attribute vec4 aSeed; uniform vec3 uBox, uVel; uniform vec2 uLen; uniform float uTime, uPixel;
      varying float vAlong, vAcross, vLit, vFade, vY, vFogDist;
      void main() {
        float sp = 0.85 + 0.3 * aSeed.w;
        vec3 pos = aSeed.xyz * uBox + uVel * (uTime * sp);
        pos.xz = mod(pos.xz - cameraPosition.xz + 0.5 * uBox.xz, uBox.xz) - 0.5 * uBox.xz + cameraPosition.xz;      // the box follows the eye
        pos.y = mod(pos.y, uBox.y);
        vec3 dir = -normalize(uVel);                                                // up the streak, from its foot
        float len = mix(uLen.x, uLen.y, fract(aSeed.w * 7.31)) * (0.75 + 0.5 * sp);
        vec3 toEye = cameraPosition - pos; float dist = length(toEye);
        vec3 side = normalize(cross(dir, toEye));
        float w = max(0.011, 1.25 * dist * uPixel);                                  // never thinner than the screen can draw; fainter instead
        vec3 wp = pos + dir * (len * position.y) + side * (position.x * w);
        vAlong = position.y; vAcross = position.x * 2.0; vY = wp.y;
        vFade = (0.011 / w) * smoothstep(1.6, 5.0, dist) * (1.0 - smoothstep(uBox.x * 0.36, uBox.x * 0.5, length(toEye.xz)));
        vLit = seaFront(pos.xz) * uSeaL.x * mix(1.0, seaLee(pos.xz), 0.6);              // the sea under this streak: lit, or not yet
        vec4 mv = viewMatrix * vec4(wp, 1.0); vFogDist = fogDistance(mv);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`${FOG_PARS}
      uniform vec3 uSlate, uAqua, uViolet, uCore; uniform float uOpacity, uReach;
      varying float vAlong, vAcross, vLit, vFade, vY, vFogDist;
      void main() {
        float foot = 1.0 - vAlong;                                                   // 1 at its lower end
        float body = (1.0 - smoothstep(0.35, 1.0, abs(vAcross))) * smoothstep(0.0, 0.06, vAlong) * (0.22 + 0.78 * foot * foot) * smoothstep(-0.05, 0.12, vY);
        float low = exp(-max(vY, 0.0) / uReach);                                      // lit from below: strongest just over the water
        vec3 c = uSlate * 0.5 + mix(uViolet * 0.5, uAqua, low) * (vLit * (0.1 + 0.24 * low)) + uCore * (vLit * 0.05 * low * low * foot * foot);      // (stronger, the streaks over the lit sea stood in the lower half of the frame as rods of light)
        gl_FragColor = vec4(c * (body * vFade * uOpacity * (1.0 - fogAmount(vFogDist)) * (1.0 - uVeil)), 1.0);
      }`,
  });
  const rain = new THREE.Mesh(rainGeo, rainMat);
  rain.name = 'sea-rain'; rain.frustumCulled = false; rain.renderOrder = 5; rain.visible = false;
  const size2 = new THREE.Vector2();
  rain.onBeforeRender = (renderer, scene, camera) => { const rt = renderer.getRenderTarget(), h = rt ? rt.height : renderer.getDrawingBufferSize(size2).y; rainU.uPixel.value = 2 / (camera.projectionMatrix.elements[5] * Math.max(1, h)); rainMat.uniformsNeedUpdate = true; };
  ctx.add(rain); ctx.only(rain, 'direct');

  // ------------------------------------------------------------------------------------------ splash crowns
  // Where a drop strikes near the boat it throws up a crown: a tick of white-hot water a hand tall, standing at the centre
  // of its ring for a quarter of a second. They are the water's own drops: the same cells, seeds and clock as its rings
  // (rainRings in water-final.js, seaRings in light.js), worked out again here for the cells round the eye, so that each
  // crown stands in its own ring, on the surface as the water has it (swell, lift, the well round the hull). One draw call.
  const WU = (engine.water && engine.water.material && engine.water.material.uniforms) || {};
  let crownU = null;
  if (P.crowns && WU.uRain && WU.uFront && WU.uWell && WU.uWellB && WU.uSwellOn) {
    // the three families of rings the sheet draws: cell (m), seed, offset, the clock's pace and start, its share of the rain's rate (negative: of the front alone), cells across the patch round the eye, how bold
    const fams = [[0.5, 3.1, 0, 1, 0, 0.14, 26, 1.0], [0.72, 9.7, 7.3, 0.83, 0.4, 0.18, 18, 1.3], [0.95, 21.3, 3.7, 0.42, 0.7, -0.4, 14, 1.8]];
    const cells = [], fam = [], clock = [];
    for (const [cell, seed, off, pace, start, share, across, bold] of fams) for (let j = 0; j < across; j++) for (let i = 0; i < across; i++) {
      cells.push(i - across / 2, j - across / 2); fam.push(cell, seed, off, bold); clock.push(pace, start, share);
    }
    const geo = new THREE.InstancedBufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, 0, 0.5, 0, 0, 0.5, 1, 0, -0.5, 1, 0], 3)); geo.setIndex([0, 1, 2, 0, 2, 3]);
    geo.setAttribute('aCell', new THREE.InstancedBufferAttribute(new Float32Array(cells), 2)); geo.setAttribute('aFam', new THREE.InstancedBufferAttribute(new Float32Array(fam), 4));
    geo.setAttribute('aClock', new THREE.InstancedBufferAttribute(new Float32Array(clock), 3)); geo.instanceCount = cells.length / 2;
    crownU = {
      ...fogU, ...waterUniforms(engine), uSeaOmega: U.uSeaOmega, uSeaFront: U.uSeaFront, uSeaL: U.uSeaL, uSeaLee: U.uSeaLee,
      uRainW: WU.uRain, uFrontW: WU.uFront, uSwellOn: WU.uSwellOn, uWell: WU.uWell, uWellB: WU.uWellB,
      uShare: { value: 0 }, uPixel: { value: 0.0012 }, uCrown: { value: new THREE.Vector4(P.crowns.tall, P.crowns.life, P.crowns.gain, P.crowns.reach) },
      uCore: { value: col(C.core) }, uAqua: { value: col(C.aqua) },
    };
    const crownMat = new THREE.ShaderMaterial({
      uniforms: crownU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, side: THREE.DoubleSide,
      vertexShader: /* glsl */`${WATER_GLSL} ${SEA_CORE} ${FOG_PARS}
        attribute vec2 aCell; attribute vec4 aFam; attribute vec3 aClock;
        uniform vec4 uRainW, uFrontW, uSwellOn, uWell, uWellB, uCrown; uniform float uShare, uPixel;
        varying vec2 vUv; varying float vA, vFogDist;
        void main() {
          float cell = aFam.x, seed = aFam.y, off = aFam.z;
          vec2 cid = floor((cameraPosition.xz + off) / cell) + aCell;                 // this crown's cell, in its family's own space
          vec3 h = seaHash3(cid + seed);
          float cyc = uRainW.y * aClock.x + aClock.y + h.z, n = floor(cyc), ph = cyc - n;
          vec3 k = seaHash3(cid + seed + n * 17.37);
          vec2 c = (cid + 0.25 + 0.5 * k.xy) * cell - off;                             // where its drop lands
          float fw = clamp((uFrontW.z - dot(uFrontW.xy, c)) * uFrontW.w + 0.5, 0.0, 1.0); fw = fw * fw * (3.0 - 2.0 * fw);
          float prob = aClock.z > 0.0 ? uRainW.x * mix(1.0, fw, uRainW.w) * aClock.z : -aClock.z * fw * uShare;
          float heavy = fract(k.z * 91.7); heavy = 0.2 + 0.8 * heavy * heavy;
          float up = ph < uCrown.y ? sin(3.14159 * ph / uCrown.y) : 0.0;                 // it rises and falls back in the first part of its ring's life
          float show = step(k.z, prob) * step(0.02, up) * uSeaL.y;
          float y = 0.0;                                                              // the water there, as the water's own sheet has it
          if (uSwellOn.x > 0.5) {
            float hh = waterSwell(c) * (1.0 - smoothstep(uSwellOn.y, uSwellOn.z, distance(c, cameraPosition.xz)));
            vec2 q = c - uWell.xy; float ahead = dot(q, uWell.zw), side = dot(q, vec2(-uWell.w, uWell.z));
            float dw = length(vec2(side, ahead - clamp(ahead, -1.7, 2.0)));
            y = mix(hh, uWellB.x + ahead * uWellB.y + side * uWellB.z, 1.0 - smoothstep(0.9, 3.4, dw));
          }
          vec3 base = vec3(c.x, y, c.y), toEye = cameraPosition - base; float dist = length(toEye);
          vec3 right = normalize(vec3(toEye.z, 0.0, -toEye.x) + vec3(1e-5, 0.0, 0.0));
          float w = max(0.011 * aFam.w, 1.1 * dist * uPixel);                          // never thinner than the screen can draw: fainter instead
          vec3 wp = base + right * (position.x * w * 2.0) + vec3(0.0, position.y * uCrown.x * (0.35 + 0.65 * heavy) * aFam.w * up, 0.0);
          vUv = vec2(position.x * 2.0, position.y);
          vA = show * (0.45 + 0.55 * heavy) * (1.0 - smoothstep(0.6 * uCrown.w, uCrown.w, dist)) * smoothstep(0.9, 2.2, dist) * min(1.0, 0.011 * aFam.w / w + 0.25);
          vec4 mv = viewMatrix * vec4(wp, 1.0); vFogDist = fogDistance(mv);
          gl_Position = show < 0.5 ? vec4(2.0, 2.0, 2.0, 1.0) : projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */`${FOG_PARS}
        uniform vec3 uCore, uAqua; uniform vec4 uCrown;
        varying vec2 vUv; varying float vA, vFogDist;
        void main() {
          // a tick of thrown water: broad at its foot and drawn to a point (no bead at its tip: with one it was a pin stuck in the sea)
          float body = (1.0 - smoothstep(0.2, 1.0, abs(vUv.x) * (1.0 + 4.0 * vUv.y))) * (1.0 - smoothstep(0.75, 1.0, vUv.y));
          vec3 c = mix(uCore * 2.2, uAqua * 1.9, smoothstep(0.15, 0.85, vUv.y)) * body;
          gl_FragColor = vec4(c * (vA * uCrown.z * (1.0 - fogAmount(vFogDist)) * (1.0 - uVeil)), 1.0);
        }`,
    });
    const crowns = new THREE.Mesh(geo, crownMat);
    crowns.name = 'sea-crowns'; crowns.frustumCulled = false; crowns.renderOrder = 4;
    const sizeC = new THREE.Vector2();
    crowns.onBeforeRender = (renderer, scene, camera) => { const rt = renderer.getRenderTarget(), hgt = rt ? rt.height : renderer.getDrawingBufferSize(sizeC).y; crownU.uPixel.value = 2 / (camera.projectionMatrix.elements[5] * Math.max(1, hgt)); crownMat.uniformsNeedUpdate = true; };
    ctx.add(crowns); ctx.only(crowns, 'direct');
  }

  // ------------------------------------------------------------------------------------------ far rain: curtains, and the wall of the front
  // One shader for all of them: a veil whose streaks slant and fall, grey-violet, thinning to nothing at its ends and
  // into the cloud at its top, lit from below where the sea under it is lit. Never green, never folded like drapery.
  const Cn = P.curtains, perp = { x: -fn.z, z: fn.x };                              // along the front's line
  const trig = kit.at(P.front.trigger[0], P.front.trigger[1]), off0 = fn.x * trig.x + fn.z * trig.z, lat0 = perp.x * trig.x + perp.z * trig.z;
  const veilMat = (opacity, wall) => new THREE.ShaderMaterial({
    uniforms: { ...fogU, ...seaU, uTime: sh.uTime, uOpacity: { value: opacity }, uNear: { value: wall ? 1 : 0 }, uSize: { value: new THREE.Vector2(1, 1) },
      uVeilCol: { value: col(Cn.color) }, uAqua: { value: col(C.aqua) }, uViolet: { value: col(C.violet) }, uCore: { value: col(C.core) }, uFogShare: { value: Cn.fog }, uShow: { value: 0 } },
    transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    vertexShader: /* glsl */`${FOG_PARS} varying vec2 vUv; varying vec3 vW; varying float vFogDist;
      void main() { vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vec4 mv = viewMatrix * w; vFogDist = fogDistance(mv); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: /* glsl */`${SEA_GLSL} ${FOG_PARS}
      uniform vec3 uVeilCol, uAqua, uViolet, uCore; uniform float uTime, uOpacity, uNear, uFogShare, uShow; uniform vec2 uSize;
      varying vec2 vUv; varying vec3 vW; varying float vFogDist;
      void main() {
        float along = vUv.x * uSize.x, y = vUv.y * uSize.y;                          // metres along the veil, and up it
        // shafts of heavier and lighter rain, leaning as the rain leans, falling
        float lean = along + y * 0.21;
        float shafts = 0.45 + 0.55 * seaNoise(vec2(lean * 0.035, 3.0)) * (0.6 + 0.8 * seaNoise(vec2(lean * 0.11, y * 0.012 + uTime * 0.09)));
        float fine = 0.7 + 0.6 * seaNoise(vec2(lean * 0.9, y * 0.05 + uTime * 0.45));
        float ends = smoothstep(0.0, 0.22, vUv.x) * (1.0 - smoothstep(0.78, 1.0, vUv.x));
        float top = 1.0 - smoothstep(0.45, 1.0, vUv.y);                               // it comes out of the cloud
        float a = uOpacity * shafts * fine * ends * top * smoothstep(0.0, 0.03, vUv.y);
        // lit from below where the sea under it is lit: aqua at the foot, violet a little way up, gone by twenty metres
        float lf = seaFront(vW.xz) * uSeaL.x * uSeaL.y;
        float low = exp(-y / 7.0), mid = exp(-y / 26.0);
        vec3 light = (uAqua * (0.55 * low) + uCore * (0.25 * low * low) + uViolet * (0.42 * (mid - 0.6 * low) + 0.16 * exp(-y / 60.0))) * (lf * shafts * fine * ends);
        float fog = fogAmount(vFogDist) * uFogShare;
        // the wall of the front thins away as it reaches the eye (the rain round the eye takes over) and is not there before the show
        float near = mix(1.0, smoothstep(14.0, 60.0, vFogDist) * uShow, uNear);
        vec3 c = mix(uVeilCol, uFogColor, fog) * a + light * (1.0 - fog) * min(1.0, a * 4.0 + 0.4 * uOpacity);
        gl_FragColor = vec4(c, a) * (near * (1.0 - uVeil));
      }`,
  });
  const veils = [];
  const makeVeil = (len, high, mat) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(len, high, 1, 1), mat); mat.uniforms.uSize.value.set(len, high); m.rotation.y = Math.atan2(fn.x, fn.z); m.frustumCulled = false; m.renderOrder = 3; ctx.add(m); ctx.only(m, 'direct'); return m; };
  // (a veil's plane stands along the front's line: its normal is the front's direction of travel)
  for (const [i, c] of Cn.list.entries()) {
    const mat = veilMat(c.opacity, false), m = makeVeil(c.len, Cn.high, mat);
    m.name = 'sea-rain-curtain-' + i; veils.push({ m, out: c.out, side: c.side });
  }
  const wallMat = veilMat(Cn.wall.opacity, true), wall = makeVeil(Cn.wall.len, Cn.wall.high, wallMat); wall.name = 'sea-rain-front';
  const place = (m, offset, side, high) => m.position.set(fn.x * offset + perp.x * (lat0 + side), high / 2 - 1, fn.z * offset + perp.z * (lat0 + side));

  // ------------------------------------------------------------------------------------------ the hull's own light
  const H = P.hullLight;
  let bowWas = 0, bowLight = 0;

  const stroke = { cap: P.lamp.strokeCap || [1.6, 2.4], deep: P.lamp.strokeDeep || [1, 1] };
  const lampAt = kit.at(P.lamp.at[0], P.lamp.at[1]);
  let t = 0;
  return {
    update(dt, c) {
      const s = c.s, boat = c.boat, calm = stage.calm, T = sea.T;
      t += dt;
      // ---- rain round the eye: behind the front, by the rain's share along the route (set.js keeps sea.rain)
      const falling = sea.rain || 0;
      rain.visible = falling > 0.002 && !params.has('norain');
      rainGeo.instanceCount = Math.round(n * Math.min(1, falling * 1.25) * (calm ? 0.5 : 1));      // (reduced motion: half the streaks at two thirds of the speed)
      rainU.uOpacity.value = R.opacity * Math.min(1, falling * 3);
      rainU.uVel.value.set(fn.x * slant, -fall, fn.z * slant).multiplyScalar(calm ? 0.667 : 1);
      if (crownU) crownU.uShare.value = P.rainBy(s);                               // (the heavy drops go by the rain's share along the route, as the sheet's do)
      // ---- far rain. The curtains hang where they are and drift with the weather; the wall goes with the front's line
      const drift = Math.min(t, 300) * Cn.drift;
      for (const v of veils) place(v.m, off0 - v.out + drift, v.side, Cn.high);
      place(wall, sea.front.offset, Cn.wall.side, Cn.wall.high);
      // (the wall is seen coming from afar and is gone before it reaches the eye: from 90 m short of the boat it thins, by 25 m it is nothing, and behind
      // the front there is none. It is one plane 900 m long: crossing the eye it veiled half the view and the boat for a third of a second, behind a ruled
      // upright edge. What tells the front's last 25 m is its foot on the water and the rain itself)
      const gap = sea.front.behind(boat.x, boat.z);
      wallMat.uniforms.uShow.value = (T < 0 ? smooth(144, 150, s) * 0.6 : 0.6 + 0.4 * smooth(0, 4, T)) * (1 - smooth(-90, -25, gap));
      wall.visible = wallMat.uniforms.uShow.value > 0.001 && !params.has('rest');
      // ---- the hull's own light: a lane written into the water's trace while the boat moves, and a dab at the bow as it comes down
      const tr = c.water.trace;
      if (tr && U.uSeaL.value.y > 0.01 && boat.speed > H.from) {
        const k = smooth(H.from, H.full, boat.speed), fx = -Math.sin(boat.heading), fz = -Math.cos(boat.heading);
        tr.line(boat.x - fx * 1.3, boat.z - fz * 1.3, boat.x + fx * 2.0, boat.z + fz * 2.0, { channel: 'glow', radius: H.radius, strength: H.strength * k, soft: 0.75 });
        const bx = boat.x + fx * 2.3, bz = boat.z + fz * 2.3, bow = c.water.heightAt(bx, bz), rise = (bow - bowWas) / Math.max(dt, 1e-3);
        bowLight += ((rise > 0.12 ? 1 : 0) - bowLight) * (1 - Math.exp(-dt / 0.25));      // the bow meeting a crest
        if (bowLight > 0.05) tr.inject(bx, bz, { channel: 'glow', radius: 1.3, strength: Math.min(0.6, H.strength * (0.6 + 0.8 * bowLight)) * k, soft: 0.8 });
        bowWas = bow;
      }
      // ---- the lamp's stroke stays amber (heroes.js sets its brightness every frame, before this runs)
      const hs = shared.heroes && shared.heroes.stroke;
      if (hs && hs.material && hs.material.color) {
        // (on the lit sea the cap stands higher the further off the eye is: near, a stroke that bright is a pale yellow sheet; from the middle of the sound it must still be seen)
        const far = smooth(15, 45, Math.hypot(boat.x - lampAt.x, boat.z - lampAt.z));
        const col2 = hs.material.color, peak = Math.max(col2.r, col2.g, col2.b), cap = lerp(stroke.cap[0], lerp(stroke.cap[1], stroke.cap[2] ?? stroke.cap[1], far), sea.L || 0) * (1 - c.veil);
        if (peak > cap && peak > 0) col2.multiplyScalar(cap / peak);
        // behind the front the mirror leans to teal (plan.waterLit.reflectionTint), which would turn the one warm stroke olive:
        // the halo, which exists only in the mirror, is given beforehand what the tint will take away
        const tint = c.waterLook.reflectionTint;
        if (tint && tint.isColor) { col2.r /= Math.max(tint.r, 0.12); col2.g /= Math.max(tint.g, 0.12); col2.b /= Math.max(tint.b, 0.12); }
        // (and it lies under the sea's own aqua, which is added to it: amber and aqua make a pale yellow. On the lit sea the stroke is given deeper, toward orange)
        const deep = stroke.deep, L2 = sea.L || 0; col2.g *= 1 - (1 - deep[0]) * L2; col2.b *= 1 - (1 - deep[1]) * L2;
      }
    },
  };
}
const params = new URLSearchParams(typeof location !== 'undefined' ? location.search : '');
