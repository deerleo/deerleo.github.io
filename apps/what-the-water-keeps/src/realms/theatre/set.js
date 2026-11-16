// The theatre of leaves: the place and its light.
//
//   the three light states (plan.light2; the page's own table is plan.light, &light=1) and what drives them: the show
//   clock, and distance into the fly tower
//   the house's light (light.js, through lib.js): its uniforms are set here every frame from look.house
//   the air: the lit mist round the mound; the disc of rings on the water under the rain (the glows of the brackets are air.js)
//   the sky seen through the tear (plain night, two layers of moving cloud, the moon's blur) and the far lake behind the foyer
//   the moon's shaft
//   the plain building, built in code at its true size: foyer hall, door wall and portico, the backs and floors of the
//   boxes, cornice, the floors under the water, stage house, fly tower (the cove and its round windows are cove.js; the plain
//   first cove is still here, behind &cove=0)
//   the water's rain (as data, under the tear only) and the kept lamp
//
// What is here is a FIRST PASS of things the page builds in code (it is not a stand-in for a model unless it says
// STAND-IN): whoever builds the kit refines it in place. Hero pieces are in heroes.js, kit pieces and multitudes in kit.js.
import * as THREE from 'three';
import { makeKeptLamp } from '../../engine/lamp.js';
import { FOG_PARS, NOISE_GLSL } from '../../engine/kit.js';
import { at, house, solid, grid, wallAcross, passes, dev } from './lib.js';

const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// The light tables are in plan.js: plan.light2 is the one the area wears (stage 2); plan.light is the page's own (&light=1).

export async function build(ctx, plan, shared) {
  const { kit } = ctx, H = house(ctx, plan, shared), U = H.U;
  const V = (s, d, y) => at(ctx, s, d, y);
  const C = (h) => new THREE.Color(h);
  // the second version of the house's light (light.js) with its own light table (plan.light2); &light=1: the first version and the page's table
  const second = dev.second, L = second ? { ...plan.light, ...plan.light2 } : plan.light;
  const L3 = dev.get('l3') !== '0';                                        // the second look (2-light.md, "Second look"): the rain in the shaft's light, the mirror's share of the veil. &l3=0: the plain veil, as it was
  const L6 = dev.get('l6') !== '0' && !!(plan.light6 && plan.light6.on);      // the fourth look (2-light.md, "Fourth look"; plan.js PLAN.light6). &l6=0: as it was before it
  const HOUSE = second ? plan.light2.house : {
    A: { level: 0.14, shaft: 0.42, moon: 1.0, fill: 0, cloud: 1, wake: '#CFE3DC', wakeBase: 0.2 },
    B: { level: 0.2, shaft: 0.30, moon: 0.9, fill: 1, cloud: 0.9, wake: '#F2DDA6' },
    C: { level: 0.07, shaft: 0, moon: 0, fill: 0, cloud: 0.08, wake: '#77808e' } };

  // ============================================================================================ the light states
  // A: moon and water (the realm's own look).  B: kindled, reached by the share of flames burning.  C: the fly tower, by distance.
  const states = ctx.lookStates({
    A: {},                                                                 // (the realm's own look: theatre.js gives it column A of the table in use)
    B: { look: { background: L.B.background, fog: L.B.fog, exposure: L.B.exposure, bloom: L.B.bloom, light: L.B.light, grade: L.B.grade, lantern: L.B.lantern, house: { ...HOUSE.A, ...HOUSE.B }, rower: { ...plan.rower.B } }, ...(second ? { water: L.water.B } : {}) },
    C: { look: { background: L.C.background, fog: L.C.fog, exposure: L.C.exposure, bloom: L.C.bloom, light: second ? L.C.light : { ...L.C.light, lanternRadius: 16 }, grade: L.C.grade, paint: L.C.paint, paintRadius: L.C.paintRadius, lantern: L.C.lantern, house: { ...HOUSE.A, ...HOUSE.C }, rower: { ...plan.rower.C } },
      water: second ? L.water.C : { deep: '#03050A', shallow: '#0C1A1C', waveHeight: 0.2, mirror: 0.3 } },
  });
  shared.states = states;

  // The show clock (the page, section 6). It belongs to the staging (stage.js), but the light hangs on it, so it is
  // started here: the cue 'hour' at s 54, then c = max(c + dt, f(s)). Read it as shared.show.c (-1 before the hour);
  // &c=27 in the address holds it. shared.show.k is the share of the 890 flames that are burning.
  const show = shared.show = { c: dev.clock ?? -1, k: 0, started: dev.clock != null, held: dev.clock != null };
  ctx.stage.cue('hour', { s: plan.show.cueAt, settle: () => { show.started = true; } }, () => { show.started = true; });

  // ============================================================================================ the sky
  // Seen only through the tear: plain night, and over it two layers of painted cloud at 70 and 110 m scrolling toward
  // the stage, with the moon's blur behind them. One sheet, one draw: the second layer and the moon are worked out
  // along the ray. (Until the painting is packed the cloud is drawn in code.)
  const sky = kit.sky({ top: L.sky, mid: L.sky, horizon: L.sky, below: L.sky });
  let skyTex = null;
  if (plan.art && plan.art.sky) { try { skyTex = await ctx.tex(plan.art.sky); skyTex.wrapS = skyTex.wrapT = THREE.MirroredRepeatWrapping; skyTex.needsUpdate = true; } catch (e) { console.warn('theatre: the sky painting did not load; the cloud is drawn in code'); } }
  const el = L.moon.elevationDeg * Math.PI / 180, az = L.moon.leftDeg * Math.PI / 180, ahead = ctx.path.at(plan.tear.s);
  const moonDir = new THREE.Vector3(ahead.tx * Math.cos(az) - ahead.rx * Math.sin(az), 0, ahead.tz * Math.cos(az) - ahead.rz * Math.sin(az)).multiplyScalar(Math.cos(el)).setY(Math.sin(el)).normalize();
  const sh = ctx.engine.shared, tearAt = V(plan.tear.s, plan.tear.d, 0);
  const cloudMat = new THREE.ShaderMaterial({
    uniforms: { uTime: sh.uTime, uVeil: sh.uVeil, uVeilColor: sh.uVeilColor, tSky: { value: skyTex }, uHasTex: { value: skyTex ? 1 : 0 }, uCloud: { value: 1 }, uBreath: { value: 1 },
      uSkyCol: { value: C(L.sky) }, uSkyFar: { value: C(L.sky) }, uPearl: { value: C('#C4D6D0') }, uMoonDir: { value: moonDir }, uMoonAt: { value: new THREE.Vector4(...at(ctx, plan.tear.s + 7, plan.tear.d, L.clouds[0].y).toArray(), second ? 1 : 0) }, uCentre: { value: new THREE.Vector2(tearAt.x, tearAt.z) }, uDown: { value: new THREE.Vector2(ahead.tx, ahead.tz) },
      uCore: { value: (L.moon.acrossDeg / 2) * Math.PI / 180 }, uHalo: { value: (L.moon.haloDeg / 2) * Math.PI / 180 }, uLift: { value: L.clouds[1].y - L.clouds[0].y },
      uFar: { value: new THREE.Vector2(120, 340) }, uEndSky: { value: 0 },      // (fourth look) metres over which the cloud gives way to the sky's own colour at the horizon; and 0..1, the night over the open water beyond the fly tower's end
      uSpeed: { value: new THREE.Vector2(L.clouds[0].speed, L.clouds[1].speed) } },
    side: THREE.DoubleSide, depthWrite: false, fog: false,
    vertexShader: /* glsl */`varying vec3 vW; void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */`
      uniform sampler2D tSky; uniform float uTime, uVeil, uHasTex, uCloud, uBreath, uCore, uHalo, uLift, uEndSky;
      uniform vec3 uVeilColor, uSkyCol, uSkyFar, uPearl, uMoonDir; uniform vec4 uMoonAt; uniform vec2 uCentre, uDown, uSpeed, uFar;
      varying vec3 vW;
      ${NOISE_GLSL}
      // one layer of cloud: its colour, and in a how much of the night it hides
      vec4 cloudAt(vec2 xz, float speed, float size, float turn) {
        vec2 q = xz - uCentre + uDown * (-uTime * speed);                 // the layer drifts toward the stage
        q = vec2(q.x * cos(turn) - q.y * sin(turn), q.x * sin(turn) + q.y * cos(turn));
        vec3 c;
        if (uHasTex > 0.5) c = texture2D(tSky, q / size + 0.5).rgb;
        else { float n = fbm(q * 0.035) * 0.65 + fbm(q * 0.11 + 7.3) * 0.35; float e = smoothstep(0.42, 0.5, n) - smoothstep(0.5, 0.75, n) * 0.55;
          c = mix(vec3(0.012, 0.024, 0.022), vec3(0.20, 0.27, 0.26), e) * smoothstep(0.3, 0.46, n); }
        float l = dot(c, vec3(0.3, 0.5, 0.2));
        return vec4(c, smoothstep(0.022, 0.11, l));
      }
      void main() {
        vec3 dir = normalize(vW - cameraPosition);
        vec2 hi = vW.xz + dir.xz * (uLift / max(dir.y, 0.08));
        vec4 c1 = cloudAt(vW.xz, uSpeed.x, 180.0, 0.0), c2 = cloudAt(hi, uSpeed.y, 250.0, 2.2);
        // (uMoonAt.w > 0: the moon's blur stands in the cloud over the tear, a little toward the stage, so that from the aisle it is
        // seen THROUGH the tear; at its true 85 degrees the dome hid it from everywhere but straight below, behind the crown)
        vec3 toMoon = uMoonAt.w > 0.5 ? normalize(uMoonAt.xyz - cameraPosition) : uMoonDir;
        float th = acos(clamp(dot(dir, toMoon), -1.0, 1.0));
        float core = exp(-(th * th) / (uCore * uCore)), halo = exp(-(th * th) / (uHalo * uHalo)), wide = uMoonAt.w * exp(-(th * th) / 0.55);
        vec3 moon = uPearl * (1.5 * core + 0.42 * halo) * uBreath;
        vec3 col = uSkyCol + moon;                                                        // the moon's blur on the bare night
        col = mix(col, c2.rgb * (0.16 + (0.55 * halo + 0.5 * wide) * uBreath) + moon * 0.30, c2.a * 0.85);  // cloud is lit from behind where it crosses the moon
        col = mix(col, c1.rgb * (0.24 + (0.5 * halo + 0.6 * wide) * uBreath) + moon * 0.12, c1.a * 0.92);
        // (fourth look: THE NIGHT BEYOND THE FLY TOWER'S END is this same rain cloud, seen from under it out to the horizon. Over open water it is a
        // colder cloud than over the house: half its green goes to slate, and it darkens as it goes down the sky, into the night's own colour)
        float far = length(vW.xz - cameraPosition.xz);
        vec3 slate = vec3(dot(col, vec3(0.3, 0.5, 0.2))) * vec3(0.72, 0.92, 1.34);
        col = mix(col, slate * mix(1.0, 0.62, smoothstep(90.0, 520.0, far)), 0.6 * uEndSky);
        col = mix(uSkyCol, col, uCloud);
        col = mix(col, uSkyFar, smoothstep(uFar.x, uFar.y, far));   // no edge to the cloud: far off it is the sky's own colour at the horizon
        gl_FragColor = vec4(mix(col, uVeilColor, uVeil), 1.0);
      }`,
  });
  const clouds = new THREE.Mesh(new THREE.PlaneGeometry(L6 ? 2200 : 720, L6 ? 2200 : 720), cloudMat);      // (fourth look: it reaches the horizon beyond the fly tower's end: a sheet 720 m across ended twelve degrees up the sky there, over a band of plain navy)
  clouds.name = 'cloud and moon'; clouds.rotation.x = Math.PI / 2; clouds.position.set(tearAt.x, L.clouds[0].y, tearAt.z);
  clouds.renderOrder = -998; clouds.frustumCulled = false;
  ctx.add(clouds);

  // ---- the far lake behind the foyer: the town's glow, 315 m from the back of the stage. Painted in code; seen only looking back.
  {
    const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 192;
    const g = cv.getContext('2d'), w = cv.width, h = cv.height, band = Math.round(h * 2 / plan.foyer.farLake.height);
    g.fillStyle = '#1D1230'; g.fillRect(0, 0, w, h);
    const mist = g.createLinearGradient(0, h - band * 9, 0, h - band); mist.addColorStop(0, 'rgba(142,122,168,0)'); mist.addColorStop(1, 'rgba(142,122,168,0.42)');
    g.fillStyle = mist; g.fillRect(0, h - band * 9, w, band * 8);
    const rose = g.createLinearGradient(0, h - band * 1.6, 0, h); rose.addColorStop(0, 'rgba(199,108,140,0)'); rose.addColorStop(0.35, '#C76C8C'); rose.addColorStop(1, '#F3A77E');
    g.fillStyle = rose; g.fillRect(0, h - band * 1.6, w, band * 1.6);
    const rnd = ctx.rng(315);
    for (let i = 0; i < 6; i++) {                                                           // six brighter blooms: squares and streets of the town
      const x = w * (0.2 + 0.6 * (i + rnd() * 0.6) / 6), r = band * (2.2 + rnd() * 2.4), b = g.createRadialGradient(x, h - band * 0.4, 0, x, h - band * 0.4, r);
      b.addColorStop(0, 'rgba(255,214,170,0.95)'); b.addColorStop(0.4, 'rgba(243,167,126,0.5)'); b.addColorStop(1, 'rgba(243,167,126,0)');
      g.fillStyle = b; g.fillRect(x - r, h - band * 0.4 - r, r * 2, r * 2);
    }
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
    const F = plan.foyer.farLake, far = kit.flat(tex, { width: F.width, height: F.height, position: V(F.s, 0, -0.4).toArray(), face: ctx.path.at(0).heading + Math.PI, fog: 0, emissive: 1.5 });
    far.name = 'far lake';
  }

  // ============================================================================================ the moon's shaft
  // Five nested sleeves of pearl light from the tear to the water, tilted five degrees so that their light travels
  // toward the arches: brightest seen from the arches, dimmer looking back. One draw. It breathes as cloud crosses the moon.
  const S = plan.shaft, tilt = Math.tan(S.tiltDeg * Math.PI / 180);
  const foot = V(plan.tear.s - tilt * S.top, plan.tear.d, 0), lean = new THREE.Vector2(-ahead.tx * -tilt, -ahead.tz * -tilt);     // per metre of height the axis moves down the route
  U.uShaft.value.set(foot.x, foot.z, S.across / 2, U.uShaft.value.w); U.uShaftLean.value.copy(lean);
  if (U.uMoonDir) U.uMoonDir.value.set(-lean.x * 6 + ahead.rx * 0.2, -1, -lean.y * 6 + ahead.rz * 0.2).normalize();      // down the shaft, toward the arches and a little to the right (the moon stands left of the axis)
  let shaft = null;
  {
    const pos = [], nor = [], aux = [], idx = [], seg = 48, rows = 8, layers = [1, 0.82, 0.62, 0.42, 0.22];
    layers.forEach((k, li) => {
      const base = pos.length / 3;
      for (let j = 0; j <= rows; j++) for (let i = 0; i <= seg; i++) {
        const t = j / rows, y = S.top * (1 - t), a = i / seg * Math.PI * 2, r = k * (S.across / 2 + 1.2 * (1 - t)) * (1 + 0.06 * Math.sin(a * 3 + li) + 0.04 * Math.sin(a * 5 + 2 * li));
        pos.push(foot.x + lean.x * y + Math.cos(a) * r, y, foot.z + lean.y * y + Math.sin(a) * r); nor.push(Math.cos(a), 0, Math.sin(a)); aux.push(t, i / seg, li * 1.7 + 0.3, k);
      }
      for (let j = 0; j < rows; j++) for (let i = 0; i < seg; i++) { const a = base + j * (seg + 1) + i, b = a + 1, d = a + seg + 1, e = d + 1; idx.push(a, d, b, b, d, e); }
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('aAux', new THREE.Float32BufferAttribute(aux, 4)); g.setIndex(idx);
    const mat = new THREE.ShaderMaterial({
      uniforms: { uTime: sh.uTime, uFogColor: sh.uFogColor, uFogDensity: sh.uFogDensity, uVeil: sh.uVeil, uVeilColor: sh.uVeilColor, uColor: { value: C('#C4D6D0') }, uInside: { value: 0 }, uNear: { value: second ? 0.4 : 1 }, uDown: { value: new THREE.Vector2(ahead.tx, ahead.tz) },
        uThread: { value: new THREE.Vector4(0, 1, 7, 0) },               // the rain in the light (second look): how bright its threads are, how much of the plain veil is left between them, how fast they fall (m/s), the painter's mark (set each pass)
        uShare: { value: 1 } },                                          // how much of it this pass draws (the water's mirror takes less of it once the house is lit: house.shaftMirror)
      // (added light, as before: ONE, ONE. The alpha is the second look's: where a thread of rain is drawn it carries the mark that keeps the painter's filter off that pixel,
      // gouache's CRISP_ALPHA, so that lines one pixel wide stay lines; everywhere else it adds nothing)
      transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, blendEquationAlpha: THREE.AddEquation, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneFactor,
      side: THREE.DoubleSide, forceSinglePass: true, fog: false,
      vertexShader: /* glsl */`attribute vec4 aAux; varying vec4 vAux; varying vec3 vN, vW;
        void main() { vAux = aAux; vN = normal; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: /* glsl */`
        uniform vec3 uColor; uniform float uTime, uInside, uNear, uShare; uniform vec2 uDown; uniform vec4 uThread; ${FOG_PARS}
        varying vec4 vAux; varying vec3 vN, vW;
        float sh1(float n) { return fract(sin(n * 12.9898) * 43758.5453); }
        float sn1(float x) { float i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f); return mix(sh1(i), sh1(i + 1.0), f); }
        void main() {
          vec3 view = vW - cameraPosition; float dist = length(view); view /= max(dist, 1e-4);
          float facing = abs(dot(normalize(vN), view));                                   // bright through the middle, gone at the silhouette
          float a = pow(facing, 2.4) * smoothstep(0.0, 0.07, vAux.x);                     // soft where it comes in through the tear
          float th = vAux.y * 6.2831853, t = uTime * 0.05;                                // rays inside the light: whole numbers of waves, so they meet round the back
          a *= 0.72 + 0.14 * sin(th * 3.0 + vAux.z + t) + 0.09 * sin(th * 7.0 + vAux.z * 1.7 - t * 1.6) + 0.05 * sin(th * 13.0 + vAux.z * 2.9 + t * 2.3);
          a *= smoothstep(1.5, 9.0, dist) * (1.0 - fogAmount(dist) * 0.7) * (1.0 - uVeil);
          a *= 1.0 - 0.72 * uInside;                                                      // from inside it is a soft brightening, not a white wall
          a *= smoothstep(-0.05, 1.4, vW.y);                                              // it ends softly on the water; the mirror carries it on
          a *= mix(0.55, 1.2, smoothstep(-0.5, 0.7, dot(view.xz, uDown)));                // its light comes toward the arches: bright seen against it, dim looking back
          a *= mix(1.0, uNear, step(dot(vN, view), 0.0));                                 // the near half of each sleeve is thin: the light gathers BEHIND what stands in the shaft, so the trunk keeps its form and colour against lit rain
          // THE RAIN IN THE LIGHT (second look). The column was a plain veil: fog. Lit rain is threads: each sleeve carries fine lines of
          // falling water, every one at its own place, pace and brightness, broken into long drops with gaps between them, so that the
          // light is gathered into the rain and the dark shows between. Five sleeves seen through both their halves are ten curtains of
          // it, which slide over one another as the boat moves. A thread is never drawn thinner than a pixel (it goes fainter instead),
          // and where a pixel would hold several they are the veil again. (The streaks near the eye and the drops are the cast's.)
          float mark = 0.0;
          if (uThread.x > 0.0) {
            float cells = floor(vAux.w * 360.0 + 0.5), cell = vAux.y * cells, id = floor(cell);        // about a hand and a half between threads, a whole number of them round each sleeve
            float h1 = sh1(id + vAux.z * 17.0), h2 = sh1(id * 1.7 + vAux.z * 5.0 + 3.1), h3 = fract(h1 * 7.31 + h2 * 3.17);
            float px = fwidth(cell);                                                               // cells under one pixel
            float off = abs(fract(cell) - 0.5 - (h1 - 0.5) * 0.6), half_ = max(0.035, 0.6 * px);
            float line = (1.0 - smoothstep(half_ * 0.5, half_ * 1.5, off)) * min(1.0, 0.035 / (0.6 * px)) * (1.0 - smoothstep(0.3, 0.62, px));
            float pace = 0.09 + 0.13 * h2;                                                          // long falls of water: five to eleven metres from one to the next
            float fall = sn1(vW.y * pace + uTime * uThread.z * pace * (0.85 + 0.3 * h3) + h1 * 37.0);
            float thr = line * smoothstep(0.30, 0.52, fall) * step(0.28, h3) * (0.35 + 0.65 * h2 * h2);    // (a quarter of the threads are empty; a few are bright)
            a *= uThread.y + uThread.x * thr;
            mark = clamp(thr * 4.0, 0.0, 1.0) * uThread.w * step(0.004, a);
          }
          gl_FragColor = vec4(uColor * (a * uShare), -15.0 * mark);
        }`,
    });
    shaft = new THREE.Mesh(g, mat); shaft.name = 'moon shaft'; shaft.renderOrder = 5; shaft.frustumCulled = false;
    const axis = new THREE.Vector3(lean.x, 1, lean.y).normalize(), cam = new THREE.Vector3();
    shaft.onBeforeRender = (renderer, scene, camera) => {                                // how far inside the light the eye is, for this pass
      cam.setFromMatrixPosition(camera.matrixWorld).sub(foot); const t = Math.max(0, cam.dot(axis)); const off = cam.addScaledVector(axis, -t).length(), r = S.across / 2;
      mat.uniforms.uInside.value = 1 - smooth(r * 0.55, r * 1.25, off);
      mat.uniforms.uThread.value.w = ctx.engine.reflecting ? 0 : (dev.has('mark') ? +dev.get('mark') : 1);      // the painter's mark on the threads: in the picture only, never in the water's mirror
      // (the mirror's share of the veil: before the hour the column stands whole in the still water; kindled, a veil of pearl over the mirrored
      // tiers made the water under them milk where the key painting has green glass with the candles' columns in it)
      mat.uniforms.uShare.value = ctx.engine.reflecting && L3 ? (ctx.look.house.shaftMirror ?? 1) : 1;
      mat.uniformsNeedUpdate = true;
    };
    ctx.add(shaft);
  }

  // ============================================================================================ the air
  // Depth in layers. Round the mound the rain beats a fine mist up off the water, and the moon is in it: a ring of soft
  // lit vapour low over the water, brightest at the hem of the rain and gone fifteen metres out (it is light, so it is
  // added; one draw). (The house's distance fog and the mist lying on the water are in the light table: look.fog, light.heightFog.)
  let rainMist = null;
  if (second && dev.get('air') !== '0') {
    const n = kit.count(30), rnd = ctx.rng(4101), base = new THREE.PlaneGeometry(1, 1), geo = new THREE.InstancedBufferGeometry();
    geo.index = base.index; geo.setAttribute('position', base.attributes.position); geo.setAttribute('uv', base.attributes.uv);
    const off = new Float32Array(n * 4), aux = new Float32Array(n * 4), axisAt = V(plan.beech.s, plan.beech.d, 0);
    for (let i = 0; i < n; i++) {
      const a = rnd() * Math.PI * 2, r = 5 + 12.5 * Math.pow(rnd(), 0.8), y = 0.25 + 2.3 * rnd() * rnd();
      off.set([axisAt.x + Math.cos(a) * r, y, axisAt.z + Math.sin(a) * r, 8 + 9 * rnd()], i * 4);
      // seed, pace, way, how much of the moon it holds (less on the aisle's side: from the arches the mist lay across the lamp's amber line under the curtain, 80 m off)
      aux.set([rnd() * 100, 0.6 + 0.8 * rnd(), rnd() < 0.5 ? -1 : 1, Math.exp(-Math.max(0, r - 9.5) / 4.2) * (0.55 + 0.45 * rnd()) * (axisAt.x + Math.cos(a) * r > -2.5 ? 0.3 : 1)], i * 4);
    }
    geo.setAttribute('aOffset', new THREE.InstancedBufferAttribute(off, 4)); geo.setAttribute('aAux', new THREE.InstancedBufferAttribute(aux, 4)); geo.instanceCount = n;
    const mat = new THREE.ShaderMaterial({
      uniforms: { uTime: sh.uTime, uFogColor: sh.uFogColor, uFogDensity: sh.uFogDensity, uVeil: sh.uVeil, uVeilColor: sh.uVeilColor, uColor: { value: C('#C4D6D0') }, uLit: { value: 0 } },
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, side: THREE.DoubleSide, forceSinglePass: true,
      vertexShader: /* glsl */`
        attribute vec4 aOffset, aAux; uniform float uTime; varying vec2 vUv; varying float vDist, vSeed, vLit;
        void main() {
          vUv = uv; vSeed = aAux.x; vLit = aAux.w;
          vec3 c = (modelMatrix * vec4(aOffset.xyz, 1.0)).xyz;
          c.x += sin(uTime * 0.06 * aAux.y + aAux.x) * 1.4 * aAux.z; c.z += cos(uTime * 0.045 * aAux.y + aAux.x * 1.3) * 1.4;
          vec4 mv = viewMatrix * vec4(c, 1.0);
          mv.xy += position.xy * vec2(aOffset.w, aOffset.w * 0.36);
          vDist = length(mv.xyz);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */`
        uniform vec3 uColor; uniform float uLit, uTime; ${FOG_PARS} ${NOISE_GLSL}
        varying vec2 vUv; varying float vDist, vSeed, vLit;
        void main() {
          vec2 q = vUv - 0.5;
          float shape = smoothstep(0.5, 0.0, length(q * vec2(1.0, 1.3)));
          float a = shape * shape * smoothstep(2.5, 11.0, vDist) * (1.0 - fogAmount(vDist) * 0.8) * (1.0 - uVeil) * vLit * uLit;
          if (a < 0.003) discard;                                                          // (before the noise: most of a card is nothing)
          vec2 np = vUv * vec2(2.4, 1.6) + vSeed + vec2(uTime * 0.014, -uTime * 0.008);
          float n = vnoise(np) * 0.62 + vnoise(np * 2.3 + 5.1) * 0.38;
          a *= smoothstep(0.22, 0.78, n + shape * 0.35);
          gl_FragColor = vec4(uColor * a, 1.0);
        }`,
    });
    rainMist = new THREE.Mesh(geo, mat); rainMist.name = 'rain mist'; rainMist.frustumCulled = false; rainMist.renderOrder = 5;
    ctx.add(rainMist);
    passes(rainMist, ctx, { mirror: 0.5, pre: 0 });                        // half of it in the mirror, none in the picture the engine takes without the water
  }

  // ============================================================================================ the plain building
  const fo = plan.foyer, FL = plan.levels;
  // (the foyer's walls are hung with the house's own damask, the kit's painted swatch: light.js lays it on, DETAIL 4)
  if (second && U.tHouseSilk && dev.get('silk') !== '0') { try { const silk = await ctx.tex('art/theatre/gilt_damask.webp', { repeat: true }); silk.wrapS = silk.wrapT = THREE.RepeatWrapping; silk.needsUpdate = true; U.tHouseSilk.value = silk; U.uHouseSilk.value = 1; } catch (err) { console.warn('theatre/set: the damask did not load; the foyer walls are plain plaster'); } }
  // ---- the foyer hall: 20 m wide and 10 m high, flaring to 27 m over its last 10 m; a plain stub before s 12
  {
    const parts = [], flareLen = Math.hypot(fo.flareTo - fo.flareFrom, fo.flareHalfWidth - fo.halfWidth), turn = Math.atan2(fo.flareHalfWidth - fo.halfWidth, fo.flareTo - fo.flareFrom);
    for (const sign of [-1, 1]) {
      parts.push({ box: [0.6, 12.2, fo.flareFrom + 1.6], at: [(fo.flareFrom - 1.6) / 2, sign * (fo.halfWidth + 0.3), -1.6] });
      parts.push({ box: [0.6, 12.2, flareLen + 0.6], at: [(fo.flareFrom + fo.flareTo) / 2, sign * ((fo.halfWidth + fo.flareHalfWidth) / 2 + 0.3), -1.6], turn: -sign * turn });
      for (let s = 14; s <= 26; s += 6) parts.push({ box: [0.5, 9.6, 0.9], at: [s, sign * (fo.wallAt(s) - 0.05), 0] });      // pilasters, where the hall is detailed
      if (second) {                                                        // (stage 2: what the wall of a hall has, so that it is not a plain flat when the boat drifts along it)
        const w = fo.halfWidth, len = fo.flareFrom + 1.2, mid = (fo.flareFrom - 1.2) / 2;
        for (let s = 2; s <= 26; s += 6) {                                 // every pilaster: a base that goes under the water and a capital under the cornice (and two more of them, back into the veil)
          if (s < 14) parts.push({ box: [0.5, 9.6, 0.9], at: [s, sign * (fo.wallAt(s) - 0.05), 0] });
          parts.push({ box: [0.64, 1.5, 1.06], at: [s, sign * (fo.wallAt(s) - 0.05), -1.0] }, { box: [0.6, 0.16, 1.0], at: [s, sign * (fo.wallAt(s) - 0.05), 0.5] });
          parts.push({ box: [0.6, 0.14, 1.0], at: [s, sign * (fo.wallAt(s) - 0.05), 8.55] }, { box: [0.7, 0.34, 1.12], at: [s, sign * (fo.wallAt(s) - 0.05), 8.69] });
        }
        parts.push({ box: [0.34, 0.34, len], at: [mid, sign * (w - 0.17), 9.03] }, { box: [0.6, 0.4, len], at: [mid, sign * (w - 0.3), 9.37] });      // the cornice, in two steps
        parts.push({ box: [0.16, 0.16, len], at: [mid, sign * (w - 0.08), 1.12] }, { box: [0.1, 1.2, len], at: [mid, sign * (w - 0.05), -0.1] });       // the dado rail and the dado, a hand's breadth proud
        for (let s0 = 2; s0 < 20; s0 += 6) {                               // a framed panel in every bay, between the dado and the cornice
          const a0 = s0 + 0.95, a1 = s0 + 5.05, d = sign * (w - 0.035);
          for (const sv of [a0, a1]) parts.push({ box: [0.07, 6.3, 0.11], at: [sv, d, 1.75] });
          for (const yv of [1.75, 7.94]) parts.push({ box: [0.07, 0.11, a1 - a0], at: [(a0 + a1) / 2, d, yv] });
          for (const sv of [a0 + 0.3, a1 - 0.3]) parts.push({ box: [0.04, 5.7, 0.05], at: [sv, d, 2.05] });
          for (const yv of [2.05, 7.7]) parts.push({ box: [0.04, 0.05, a1 - a0 - 0.6], at: [(a0 + a1) / 2, d, yv] });
        }
        // the same along the flared walls of the last ten metres (u metres along the wall from s 20, `out` metres proud of it)
        const ca = Math.cos(turn), sa = Math.sin(turn), on = (u, out, y, box) => ({ box, at: [fo.flareFrom + ca * u + sa * out, sign * (w + sa * u - ca * out), y], turn: -sign * turn });
        parts.push(on(flareLen / 2, 0.17, 9.03, [0.34, 0.34, flareLen]), on(flareLen / 2, 0.3, 9.37, [0.6, 0.4, flareLen]), on(flareLen / 2, 0.08, 1.12, [0.16, 0.16, flareLen]), on(flareLen / 2, 0.05, -0.1, [0.1, 1.2, flareLen]));
        for (const [u0, u1] of [[0.95, 5.35], [7.4, flareLen - 0.5]]) {
          for (const u of [u0, u1]) parts.push(on(u, 0.035, 1.75, [0.07, 6.3, 0.11]));
          for (const yv of [1.75, 7.94]) parts.push(on((u0 + u1) / 2, 0.035, yv, [0.07, 0.11, u1 - u0]));
          for (const u of [u0 + 0.3, u1 - 0.3]) parts.push(on(u, 0.02, 2.05, [0.04, 5.7, 0.05]));
          for (const yv of [2.05, 7.7]) parts.push(on((u0 + u1) / 2, 0.02, yv, [0.04, 0.05, u1 - u0 - 0.6]));
        }
      }
    }
    if (L6) for (const sign of [-1, 1]) {
      // (fourth look: what the lantern finds on these walls as the boat drifts along them, two to eight metres off. Each pilaster's face is fluted (four fillets);
      // under the cornice's upper step a row of modillions, a block every two feet, down the straight walls and the flared ones.)
      for (let s = 2; s <= 26; s += 6) for (const o of [-0.3, -0.1, 0.1, 0.3]) parts.push({ box: [0.05, 7.75, 0.09], at: [s + o, sign * (fo.wallAt(s) - 0.3 - 0.02), 0.72] });
      const w = fo.halfWidth, ca = Math.cos(turn), sa = Math.sin(turn);
      for (let s = 0.2; s < fo.flareFrom; s += 0.62) parts.push({ box: [0.2, 0.2, 0.22], at: [s, sign * (w - 0.44), 9.17] });
      for (let u = 0.4; u < flareLen - 0.2; u += 0.62) parts.push({ box: [0.2, 0.2, 0.22], at: [fo.flareFrom + ca * u + sa * 0.44, sign * (w + sa * u - ca * 0.44), 9.17], turn: -sign * turn });
    }
    solid(ctx, shared, { name: 'foyer hall (walls)', paint: 'plaster', parts, at: [14, -10, 0], high: 10 });
    // the coffered ceiling at 10 m: eighteen coffers, three across and six along. Water-light reaches it (rose failing, pearl growing).
    const ceil = [{ box: [29, 0.5, 33], at: [14.6, 0, fo.height] }];
    for (const d of [-10, -3.33, 3.33, 10]) ceil.push({ box: [0.55, 0.45, 32.6], at: [14.7, d, fo.height - 0.45] });
    for (let i = 0; i <= 6; i++) ceil.push({ box: [28, 0.45, 0.55], at: [-1.2 + i * 5.3, 0, fo.height - 0.45] });
    // (fourth look: THE COFFERS ARE COFFERS. They were flat panels five metres across between plain beams, beside the arch wall's own coffers, which are
    // modelled. Each now steps up into the ceiling in three mouldings (a deep cyma against the beams, a flat fascia, a bead), to a panel that holds the kit's
    // rosette inside a gilt ring; every beam carries a fillet down its soffit, and where two beams cross there is a boss with a turned drop. In code, as the
    // page asks for the hall: it is a grid that only the plan knows. About 6,500 triangles, in the draw that was there and one more for the gilt rings.)
    const rings = [];
    if (L6) {
      const top = fo.height, hs = (5.3 - 0.55) / 2, hd = (6.67 - 0.55) / 2;
      const frame = (cs, cd, a, b, w, drop) => {                          // a rectangular frame under the slab: its half-lengths along and across the route, its width, how far it hangs
        for (const sg of [-1, 1]) { ceil.push({ box: [w, drop, 2 * a], at: [cs, cd + sg * (b - w / 2), top - drop] }); ceil.push({ box: [2 * b - 2 * w, drop, w], at: [cs + sg * (a - w / 2), cd, top - drop] }); }
      };
      for (let i = 0; i < 6; i++) for (let j = -1; j <= 1; j++) {
        const cs = 1.45 + i * 5.3, cd = j * 6.67;
        frame(cs, cd, hs, hd, 0.30, 0.31); frame(cs, cd, hs - 0.30, hd - 0.30, 0.44, 0.15); frame(cs, cd, hs - 0.68, hd - 0.68, 0.10, 0.21);
        const ring = new THREE.TorusGeometry(0.98, 0.062, 6, 30); ring.rotateX(Math.PI / 2); const p = V(cs, cd, top - 0.03); ring.translate(p.x, p.y, p.z); rings.push({ mesh: ring });
      }
      for (const d of [-10, -3.33, 3.33, 10]) ceil.push({ box: [0.2, 0.045, 32.6], at: [14.7, d, top - 0.495] });
      for (let i = 1; i <= 5; i++) {
        const sb = -1.2 + i * 5.3;
        ceil.push({ box: [28, 0.045, 0.2], at: [sb, 0, top - 0.495] });
        for (const db of [-3.33, 3.33]) ceil.push({ box: [0.8, 0.11, 0.8], at: [sb, db, top - 0.56] }, { ball: [0.16, 0.19, 0.16], at: [sb, db, top - 0.66] }, { cone: [0.075, 0.2], at: [sb, db, top - 0.82], tilt: [Math.PI, 0] });
      }
    }
    solid(ctx, shared, { name: 'foyer ceiling: 18 coffers', paint: L6 ? H.paint('ceiling', { take: [0.6, 1, 1, 1] }) : 'ceiling', parts: ceil, at: [14, 0, 9.4], high: 0.5 });      // (0.6 of the water-light: whole, its web lay over the coffers like a hide and their mouldings could not be read)
    if (rings.length) solid(ctx, shared, { name: 'foyer ceiling: the rosettes\' rings', paint: H.paint('gilt', { wakeH: [13, 17] }), parts: rings, at: [14, 0, 9.9], high: 0.2 });
  }
  // ---- STAND-IN, WAITING FOR THE TOWN: the door wall and the portico seen from inside. The town models its theatre front
  // (theatre_front: portico, arcade wall, 12 m of foyer; the column is one model used six times). Do not model a second one:
  // when assets/models/town/ has it, place it here at s -1 (door wall) and s -14 (columns) and delete this.
  {
    const D = fo.doorWall, P = fo.portico;
    const parts = [{ mesh: wallAcross(ctx, { s: D.s - 0.5, thick: 1.0, width: D.width, y0: -1.6, y1: D.top, openings: D.arches.map((a) => ({ d: a.d, w: a.w, h: a.h })) }) }];
    for (const d of P.columns) parts.push({ cyl: [P.base / 2, P.neck / 2, P.height + 1], at: [P.s, d, -1] });
    parts.push({ box: [40, 2.2, 2.6], at: [P.s, 0, P.height] });                       // entablature
    parts.push({ box: [40, 0.5, 13.5], at: [(P.s + D.s) / 2, 0, P.height + 1.7] });    // the soffit the boat came in under
    solid(ctx, shared, { name: 'door wall and portico (the town\'s theatre_front)', paint: 'stone', parts, at: [D.s, 0, 8.5], high: 1 });
  }

  // ---- the auditorium's shell behind the fronts: the backs and floors of the boxes, corner piers, cornice, cove
  const T = plan.tiers, back = (line, m, y) => line.map((p) => V(p.s - p.ns * m, p.d - p.nd * m, y));
  {
    const walls = [], floors = [];
    for (let t = 0; t <= 5; t++) {
      const lines = plan.tierLine(t, 1.1), y0 = t ? T[t].floor - 0.25 : -1.7, y1 = t < 5 ? T[t + 1].floor - 0.2 : plan.cornice + 0.3, depth = t ? plan.boxDepth : plan.parterre.depth;
      for (const line of lines) {
        walls.push(grid([back(line, depth, y0), back(line, depth, y1)]));                           // the back of the boxes
        if (t) floors.push(grid([back(line, 0.02, T[t].floor - 0.2), back(line, depth + 0.3, T[t].floor - 0.2)]));   // the floor of the tier: the soffit of the boxes below
      }
    }
    const top = plan.tierLine(5, 1.1)[0];
    floors.push(grid([back(top, -0.45, plan.cornice), back(top, plan.boxDepth + 0.3, plan.cornice)]));    // the cornice, a hand's breadth proud of the top tier
    floors.push(grid([back(top, -0.45, plan.cornice), back(top, -0.45, plan.cornice - 0.35), back(top, -0.1, plan.cornice - 0.5)]));
    const wall = solid(ctx, shared, { name: 'backs of the boxes', paint: H.paint('damask', { side: THREE.DoubleSide }), parts: walls.map((mesh) => ({ mesh })), at: [50, 24, 1], high: 2 });
    const soffit = solid(ctx, shared, { name: 'tier floors and cornice', paint: H.paint('plaster', { side: THREE.DoubleSide }), parts: floors.map((mesh) => ({ mesh })), at: [50, 23, 3], high: 1 });
    void wall; void soffit;
    // the corners beside the arch wall, where the fronts run in: solid from the floor to the cornice
    const corner = [], a0 = plan.frontAt(0), a1 = plan.frontAt(plan.arc.bay0 + 0.2);
    for (const sign of [-1, 1]) corner.push({ bar: [1.5, 22.4], from: [a0.s - 1.0, sign * (a0.d + 0.55), 9.2], to: [a1.s, sign * (a1.d + 0.75), 9.2] });      // a slab 1.5 m thick from -2 to 20.4 m
    solid(ctx, shared, { name: 'rear corners', paint: 'plaster', parts: corner, at: [30.5, 14.5, 0], high: 2 });
  }
  // ---- the cove, 19.6 to 26 m, from the horseshoe in to the dome's ring; the tear has taken a bite of its left side
  // (the second round's cove is a module of its own, cove.js: the painted sky carried down it, the dome's ribs, framed windows. This is the first round's plain one.)
  if (!(second && dev.get('cove') !== '0')) {
    const D = plan.dome, outline = plan.tierLine(5, 0.55)[0].map((p) => ({ s: p.s + p.ns * 0.45, d: p.d + p.nd * 0.45 }));
    const pr = plan.proscenium.s[0], a = outline.at(-1), b = outline[0];                    // close the loop across the proscenium
    for (let i = 1; i < 48; i++) outline.push({ s: pr, d: a.d + (b.d - a.d) * i / 48 });
    outline.push({ ...b });
    const rows = [];
    for (let j = 0; j <= 16; j++) {
      const u = j / 16, hz = 1 - Math.cos(u * Math.PI / 2), y = plan.cove[0] + (plan.cove[1] - plan.cove[0]) * Math.sin(u * Math.PI / 2);
      rows.push(outline.map((p) => { const l = Math.hypot(p.s - D.s, p.d - D.d) || 1, rs = D.s + (p.s - D.s) / l * D.radius, rd = D.d + (p.d - D.d) / l * D.radius; return V(p.s + (rs - p.s) * hz, p.d + (rd - p.d) * hz, y); }));
    }
    const inv = ctx.path;      // (s, d) of a point of the realm, for the tear
    const cove = grid(rows, (c) => { const q = inv.locate(c.x, c.z); return !plan.inTear(q.s, q.d); });
    solid(ctx, shared, { name: 'cove', paint: H.paint('plaster', { side: THREE.DoubleSide, wake: false, color: '#6b746c', take: [0, 1, 1.6, 3.5] }), parts: [{ mesh: cove }], at: [56, 20, 21], high: 1 });
    // twelve round windows at 22.5 m: pearl-grey glass, faintly alight, rain-streaked (those the tear took are gone)
    const disc = new THREE.CircleGeometry(plan.windows.dia / 2, 20), items = [], uW = Math.asin((plan.windows.y - plan.cove[0]) / (plan.cove[1] - plan.cove[0])) / (Math.PI / 2), hzW = 1 - Math.cos(uW * Math.PI / 2);
    for (let i = 0; i < plan.windows.n; i++) {
      const ang = (i + 0.5) / plan.windows.n * Math.PI * 2, far = 40;
      // where a ray from the dome's centre at this angle meets the outline
      let best = null, bd = 1e9;
      for (const p of outline) { const a2 = Math.atan2(p.d - D.d, p.s - D.s); let da = Math.abs(a2 - ang + Math.PI * 2) % (Math.PI * 2); da = Math.min(da, Math.PI * 2 - da); if (da < bd) { bd = da; best = p; } }
      void far;
      const l = Math.hypot(best.s - D.s, best.d - D.d), rs = D.s + (best.s - D.s) / l * D.radius, rd = D.d + (best.d - D.d) / l * D.radius;
      const ws = best.s + (rs - best.s) * hzW, wd = best.d + (rd - best.d) * hzW;
      if (plan.inTear(ws, wd) || plan.inTear(ws + (D.s - ws) * 0.12, wd + (D.d - wd) * 0.12)) continue;
      const p = V(ws + (D.s - ws) * 0.012, wd + (D.d - wd) * 0.012, plan.windows.y), c = V(D.s, D.d, plan.windows.y - 9);
      const m = new THREE.Matrix4().lookAt(p, c, new THREE.Vector3(0, 1, 0)), e = new THREE.Euler().setFromRotationMatrix(m);
      items.push({ position: p, rotation: [e.x, e.y, e.z] });
    }
    // (each is a painted oculus, not a lit disc: a dark gilt frame, eight leaded bars and a ring, and old glass that holds a
    // little of the night, paler toward its top, with rain running down it)
    const oculus = H.paint({ color: '#8fa0a0', side: THREE.DoubleSide, take: [0, 0.4, 0.4, 0.4], keep: [0.3, 0.7, 0.7, 0.3], brush: 0.5, extend: {
      uniforms: { uOculus: { value: 0.13 } },
      fragmentPars: `uniform float uOculus; ${NOISE_GLSL}`,
      albedo: /* glsl */`
        vec2 ocQ = vUv0 * 2.0 - 1.0; float ocR = length(ocQ), ocA = atan(ocQ.y, ocQ.x);
        float ocFrame = smoothstep(0.80, 0.84, ocR);
        float ocLead = max(smoothstep(0.045, 0.02, abs(sin(ocA * 4.0)) * ocR) * step(0.26, ocR), smoothstep(0.04, 0.015, abs(ocR - 0.27)));
        float ocRain = vnoise(vec2(ocQ.x * 26.0, ocQ.y * 2.2 + uTime * 0.11)) * 0.6 + vnoise(vec2(ocQ.x * 61.0 + 3.0, ocQ.y * 5.0 + uTime * 0.23)) * 0.4;
        float ocGlass = (1.0 - ocFrame) * (1.0 - ocLead) * (0.42 + 0.58 * smoothstep(-0.9, 0.9, ocQ.y)) * (0.62 + 0.55 * ocRain);
        albedo = mix(albedo * (0.35 + 0.3 * ocRain), vec3(0.20, 0.155, 0.07), max(ocFrame, ocLead * 0.8));`,
      light: 'glow += vec3(0.60, 0.72, 0.70) * (ocGlass * uOculus);',
    } });
    const glass = kit.instances(disc, oculus, items);
    glass.name = 'round windows';
  }

  // ---- the floors under the water (never in the mirror)
  {
    const parts = [];
    const rowsF = [34, 76].map((s) => [V(s, -27, plan.stallsFloor(s)), V(s, 27, plan.stallsFloor(s))]);
    parts.push({ mesh: grid([[V(30.4, -27, plan.stallsFloor(34)), V(30.4, 27, plan.stallsFloor(34))], ...rowsF, [V(78, -27, plan.stallsFloor(76)), V(78, 27, plan.stallsFloor(76))]]) });
    parts.push({ box: [34, 0.6, 12.6], at: [84.2, 0, FL.orchestra - 0.6] });                 // the orchestra platform
    parts.push({ box: [29, 0.5, 34], at: [14.6, 0, FL.foyer - 0.5] });                       // the foyer's dark floor, a metre down
    solid(ctx, shared, { name: 'floors under the water', paint: H.paint('floor', { side: THREE.DoubleSide }), parts, at: [60, 6, -1.5], high: 0.5, only: 'direct' });
    solid(ctx, shared, { name: 'stage floor (boards)', paint: 'boards', parts: [{ box: [33.4, 0.5, plan.fly.floorEnds - 90], at: [(90 + plan.fly.floorEnds) / 2, 0, FL.stage - 0.5] }], at: [105, 0, -0.5], high: 0.3, only: 'direct' });
    solid(ctx, shared, { name: 'aisle runner', paint: 'runner', parts: [{ bar: [plan.runner.width, 0.05], from: [plan.runner.s[0], 0, plan.stallsFloor(32) + 0.04], to: [plan.runner.s[1], 0, plan.stallsFloor(77) + 0.04] }], at: [50, 0, -1.4], high: 0.3, only: 'direct' });
  }

  // ---- the stage house (walls at +-16, a fly gallery at 9 m) and the fly tower (walls at +-13, galleries at 9 m, the grid lost at 30 m; its walls end raggedly at s 165)
  {
    const SH = plan.stageHouse, F = plan.fly, brick = [], wood = [];
    for (const sign of [-1, 1]) {
      brick.push({ box: [0.8, 33.2, SH.s[1] - SH.s[0] + 0.8], at: [(SH.s[0] + SH.s[1]) / 2, sign * (SH.wall + 0.4), -1.6] });
      brick.push({ box: [SH.wall - F.wall + 0.8, 33.2, 0.8], at: [F.s[0], sign * (SH.wall + F.wall) / 2, -1.6] });      // the return at the back of the stage
      const flyLen = second ? 37.5 : 40;                                   // (second look, continued: the wall stands whole to s 157.5; its broken end is built below)
      brick.push({ box: [0.8, 33.2, flyLen], at: [F.s[0] + flyLen / 2, sign * (F.wall + 0.4), -1.6] });
      wood.push({ box: [SH.gallery.depth, 0.18, SH.s[1] - SH.s[0]], at: [(SH.s[0] + SH.s[1]) / 2, sign * (SH.wall - SH.gallery.depth / 2), SH.gallery.y] });
      wood.push({ box: [1.2, 0.18, 42], at: [F.s[0] + 21, sign * (F.wall - 0.6), F.gallery] });
      if (!second) {
        // the ragged end: what is left standing of the last five metres
        [[160, 1.8, 27 + sign * 2], [161.8, 1.4, 18.5 - sign * 3], [163.2, 1.1, 11 + sign * 1.5], [164.3, 0.9, 4.5]].forEach(([s, l, h]) => brick.push({ box: [0.8, h + 1.6, l], at: [s + l / 2, sign * (F.wall + 0.4), -1.6] }));
        wood.push({ box: [0.08, 1.0, SH.s[1] - SH.s[0]], at: [(SH.s[0] + SH.s[1]) / 2, sign * (SH.wall - SH.gallery.depth), SH.gallery.y + 0.18] });
        wood.push({ box: [0.08, 1.0, 42], at: [F.s[0] + 21, sign * (F.wall - 1.2), F.gallery + 0.18] });
        continue;
      }
      // (stage 2: a working building, not two flats. Brick piers up both walls with string courses between them; galleries on
      // struts with a rail of posts and two bars; and a ragged end that is broken brickwork, course by course)
      for (const [s0, s1, wall, n] of [[SH.s[0] + 1.7, SH.s[1] - 1.4, SH.wall, 6], [F.s[0] + 2.5, 158.9, F.wall, 8]]) {
        for (let i = 0; i < n; i++) { const sv = s0 + (s1 - s0) * i / (n - 1); brick.push({ box: [0.45, 32.6, 0.9], at: [sv, sign * (wall - 0.225), -1.6] }, { box: [0.62, 2.4, 1.1], at: [sv, sign * (wall - 0.31), -1.6] }); }      // the pier, and its foot spreading under the water
        const mid = (s0 + s1) / 2, len = s1 - s0 + 1.6, gy = wall === SH.wall ? SH.gallery.y : F.gallery, depth = wall === SH.wall ? SH.gallery.depth : 1.2;
        for (const [yv, out] of [[gy - 0.6, 0.28], [gy + 10.2, 0.22], [gy + 10.42, 0.12]]) brick.push({ box: [out, 0.22, len], at: [mid, sign * (wall - out / 2), yv] });      // string courses under the gallery and high up the wall
        for (let sv = s0 + 1.3; sv < s1; sv += 2.6) wood.push({ bar: [0.1, 0.12], from: [sv, sign * (wall - 0.02), gy - 1.25], to: [sv, sign * (wall - depth + 0.12), gy - 0.02] });      // a strut under every joist
        for (let sv = s0 - 0.6; sv <= s1 + 0.61; sv += 1.3) wood.push({ box: [0.07, 1.02, 0.07], at: [sv, sign * (wall - depth + 0.04), gy + 0.18] });                              // the rail: posts,
        for (const [yv, t] of [[gy + 1.16, 0.08], [gy + 0.66, 0.05]]) wood.push({ box: [t + 0.02, t, len], at: [mid, sign * (wall - depth + 0.04), yv] });                              // a top bar and a mid bar
      }
      // THE BROKEN END (second look, continued). The rear wall has fallen away to the night: "the last thing is one hanging rope, then nothing". It was
      // a stair of twenty blocks a side under a roof cut off square. Now each side wall comes down from the roof to the water over its last nine
      // metres along a broken line of its own, in two wythes of brick that tore at different heights, toothed where the courses let go; what fell
      // of it lies awash at its foot (outside the channel); and the gallery ends in its own joists with one plank hanging.
      {
        const line = sign < 0
          ? [[157.5, 31.6], [158.2, 29.8], [159.3, 28.9], [160.3, 24.2], [161.2, 22.9], [162.0, 17.4], [163.1, 15.6], [163.9, 10.4], [164.8, 8.1], [165.5, 3.9], [166.3, 1.7], [166.9, 0.25]]
          : [[157.5, 31.6], [158.6, 30.6], [159.4, 26.3], [160.6, 25.2], [161.3, 19.8], [162.5, 18.1], [163.2, 13.0], [164.2, 11.6], [164.9, 6.2], [165.8, 4.4], [166.4, 1.3], [167.0, 0.2]];
        const hAt = (sv) => { for (let j = 1; j < line.length; j++) if (sv <= line[j][0]) { const a = line[j - 1], b = line[j], t = Math.max(0, (sv - a[0]) / (b[0] - a[0])); return a[1] + (b[1] - a[1]) * t * t * (3 - 2 * t); } return -2; };
        const cw = 0.18, n = Math.round((line[line.length - 1][0] - 157.5) / cw), rr = ctx.rng(sign < 0 ? 1657 : 1658);
        for (let i = 0; i < n; i++) {
          const sv = 157.5 + (i + 0.5) * cw, tooth = (i % 2 ? 0.075 : -0.075) - (i % 5 === 0 ? 0.3 : 0);
          const hin = hAt(sv) + tooth + (rr() - 0.5) * 0.5, hout = hAt(sv + 0.5) + 1.1 * Math.sin(sv * 1.9 + sign) + (rr() - 0.5) * 0.6 - tooth;
          if (hin > -1.2) brick.push({ box: [0.4, Math.min(33.2, hin + 1.6), cw], at: [sv, sign * (F.wall + 0.2), -1.6] });         // the inner wythe
          if (hout > -1.2) brick.push({ box: [0.4, Math.min(33.2, hout + 1.6), cw], at: [sv, sign * (F.wall + 0.6), -1.6] });       // the outer one
        }
        // what fell: lumps of brickwork awash at the wall's foot and beyond it (all outside the channel, whose edge is 10.7 m from the line here)
        for (const [sv, dv, yv, bx, tl, tn] of [[161.6, 14.9, -0.5, [1.5, 0.8, 1.0], [0.22, -0.12], 0.4], [163.4, 13.9, -0.42, [1.1, 0.62, 0.8], [-0.3, 0.18], 1.2], [164.9, 15.6, -0.6, [1.9, 0.9, 1.2], [0.14, 0.26], -0.5],
          [166.2, 13.2, -0.38, [0.9, 0.5, 0.7], [0.35, 0.1], 2.1], [167.6, 14.4, -0.55, [1.4, 0.7, 0.9], [-0.18, -0.3], 0.9], [165.7, 12.3, -0.3, [0.6, 0.36, 0.5], [0.4, -0.2], 1.7], [169.3, 13.3, -0.5, [1.0, 0.55, 0.8], [0.1, 0.33], -1.1]])
          brick.push({ box: bx, at: [sv + (sign > 0 ? 0.7 : 0), sign * dv, yv], tilt: tl, turn: tn * sign });
        // the gallery's end: two joists and the rail's top bar run on past the last plank, and one plank hangs by its last nail
        const gy = F.gallery, gd = F.wall - 0.6;
        wood.push({ bar: [0.12, 0.16], from: [161.6, sign * (gd + 0.42), gy - 0.06], to: [163.5 + sign * 0.3, sign * (gd + 0.42), gy - 0.12] });
        wood.push({ bar: [0.12, 0.16], from: [161.6, sign * (gd - 0.35), gy - 0.06], to: [162.7 - sign * 0.2, sign * (gd - 0.38), gy - 0.2] });
        wood.push({ bar: [0.28, 0.045], from: [161.9, sign * (gd - 0.1), gy + 0.05], to: [162.5, sign * (gd - 0.22), gy - 2.3] });
      }
    }
    if (second) for (const d of [-9, -4.5, 0, 4.5, 9]) wood.push({ box: [0.26, 0.3, 63], at: [127.2, d, F.grid + 0.33] });      // the grid is a grid: long beams over the cross beams
    if (!second) {
      brick.push({ box: [34.4, 0.7, 70.4], at: [SH.s[0] + 35, 0, SH.roof] });                  // the roof over stage and fly tower, to s 161
      brick.push({ box: [22, 0.7, 2.6], at: [162.4, -3, SH.roof] }); brick.push({ box: [11, 0.7, 1.6], at: [164.4, -8, SH.roof] });
    } else {
      // (second look, continued: the roof stood out square three metres past walls that were no longer under it. It ends now where its last truss
      // stands, at s 156, and from there in strips of boarding broken off at their own lengths, with the rafters that carried them running on, a few hanging)
      brick.push({ box: [34.4, 0.7, 65.4], at: [SH.s[0] + 32.5, 0, SH.roof] });
      const rr = ctx.rng(1560);
      for (let k = 0; k < 20; k++) {
        const dv = -16.15 + k * 1.7, edge = Math.abs(dv) / 16.15, len = 0.3 + 3.4 * rr() * (0.35 + 0.65 * edge) + (k % 4 === 1 ? 1.2 : 0);
        brick.push({ box: [1.7, 0.7 - 0.25 * rr(), len], at: [156.2 + len / 2 - 0.2, dv, SH.roof + 0.1] });
        if (k % 2 === 0) wood.push({ box: [0.2, 0.3, len + 0.6 + 2.2 * rr()], at: [156.4 + (len + 0.6) / 2, dv + 0.3, SH.roof - 0.3], turn: 0 });      // a rafter under it, running on
        else if (rr() < 0.6) wood.push({ bar: [0.2, 0.26], from: [156.2 + len - 0.4, dv - 0.2, SH.roof - 0.1], to: [156.2 + len + 1.3 + rr(), dv - 0.2 + 0.3 * (rr() - 0.5), SH.roof - 0.9 - 1.6 * rr()] });      // one broken, hanging by what is left of it
      }
    }
    for (let s = 96; s <= 158; s += 6.2) wood.push({ box: [26, 0.35, 0.3], at: [s, 0, F.grid] });      // the grid
    solid(ctx, shared, { name: 'stage house and fly tower (brick)', paint: 'brick', parts: brick, at: [130, -13, 5], high: 3 });
    solid(ctx, shared, { name: 'fly galleries and grid (timber)', paint: 'timber', parts: wood, at: [130, 12, 9], high: 1 });
  }

  // ============================================================================================ the water's rain, the kept lamp
  // Rain is data, under the tear only: a disc of dense rings where the column stands; the rest of the house is glass.
  const rainAt = V(plan.beech.s, plan.beech.d, 0);
  ctx.water.onBind(ctx.path, (water) => { shared.rainZone = water.rainZone({ x: rainAt.x, z: rainAt.z, radius: S.rain.radius, rate: 9, strength: dev.has('rainstr') ? +dev.get('rainstr') : 0.8 }); });      // (the page: 0.4; at 0.8 the disc of rings reads from the arches)

  // THE DISC OF RINGS. The water draws each drop's ring only near the eye; from the arches, 29 m off, the rain's disc was a
  // ruffled patch. So the disc is also painted on the water where the eye is too far for the water's own rings: slow rings
  // going out from the mound's foot, the small rings of single drops, glints where drops land, and the pale of the moon on
  // beaten water under them, all lit by the shaft and breathing with it. It fades out within about ten metres of the eye,
  // where the water's own rings take over (never two sets of rings at once). One draw, on the water only (not in the mirror).
  let ringDisc = null;
  if (second && dev.get('air') !== '0') {
    const R = S.rain.fadeTo + 2.5, geo = new THREE.CircleGeometry(R, 72); geo.rotateX(-Math.PI / 2);
    const mat = new THREE.ShaderMaterial({
      uniforms: { uTime: sh.uTime, uFogColor: sh.uFogColor, uFogDensity: sh.uFogDensity, uVeil: sh.uVeil, uVeilColor: sh.uVeilColor, uColor: { value: C('#C4D6D0') }, uLit: { value: 0 },
        uAt: { value: new THREE.Vector4(rainAt.x, rainAt.z, plan.beech.mound.waterline / 2 + 0.2, S.rain.fadeTo) } },
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
      vertexShader: /* glsl */`varying vec3 vW; void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: /* glsl */`
        uniform vec3 uColor; uniform vec4 uAt; uniform float uTime, uLit; ${FOG_PARS} ${NOISE_GLSL}
        varying vec3 vW;
        vec3 h3(vec2 p) { vec3 q = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973)); q += dot(q, q.yzx + 33.33); return fract((q.xxy + q.yzz) * q.zyx); }
        // the rings of single drops: every cell of a grid has one drop at a time, each at its own place and pace
        float drops(vec2 p, float cell, float seed, float wd, float gain) {
          vec2 id = floor(p / cell); float acc = 0.0;
          for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
            vec2 cid = id + vec2(float(i), float(j)); vec3 h = h3(cid + seed);
            float cyc = uTime * (0.3 + 0.25 * h.x) + h.z, n = floor(cyc), ph = cyc - n;
            vec3 k = h3(cid + seed + n * 17.37);
            float r = length(p - (cid + 0.2 + 0.6 * k.xy) * cell), rad = (0.04 + 0.8 * ph) * cell * (0.55 + 0.45 * k.z), x = (r - rad) / wd;
            acc += exp(-x * x) * (1.0 - ph) * (1.0 - ph) * smoothstep(0.0, 0.06, ph) * gain          // the ring
              + 2.0 * exp(-r * r / (wd * wd * 3.0)) * (1.0 - smoothstep(0.0, 0.12, ph));              // the splash where it lands
          }
          return acc;
        }
        void main() {
          vec2 p = vW.xz - uAt.xy; float r = length(p), dist = length(vW - cameraPosition);
          float fp = max(length(dFdx(vW.xz)), length(dFdy(vW.xz)));                       // metres of water under one pixel
          float inside = smoothstep(uAt.z - 0.3, uAt.z + 0.6, r) * (1.0 - smoothstep(uAt.w - 2.5, uAt.w + 2.0, r));
          // slow rings going out from the mound's foot, a little uneven, thinning as they go
          float warp = (vnoise(p * 0.5 + 3.0) - 0.5) * 0.7, ph = (r + warp - uAt.z) / 1.15 - uTime * 0.42, f = ph - floor(ph);
          float wdR = max(0.05, fp * 0.7), big = exp(-pow((min(f, 1.0 - f) * 1.15) / wdR, 2.0)) * min(1.0, 0.09 / wdR) * (1.0 - smoothstep(uAt.z, uAt.w + 1.0, r)) * (0.55 + 0.45 * vnoise(p * 1.3 + uTime * 0.2));
          // the small rings of single drops, where a pixel can still hold them
          float wd = max(0.022, fp * 0.8), fine = (1.0 - smoothstep(0.12, 0.45, fp));
          float small = (drops(p, 0.85, 3.1, wd, min(1.0, 0.03 / wd)) + drops(p + 4.7, 1.4, 9.7, wd, min(1.0, 0.03 / wd))) * fine;
          // glints where drops land, at any distance; and the moon on beaten water
          vec2 gid = floor(p / 0.33); float gt = uTime * 1.6 + gh3fix(gid); vec3 gh = h3(gid + floor(gt) * 7.1);
          float glint = step(0.93, gh.x) * (0.5 + 0.5 * gh.y) * sin(3.14159 * fract(gt)) * sin(3.14159 * fract(gt));      // each comes and goes in 0.6 s: never a blink
          float pale = 0.055 + 0.05 * vnoise(p * 2.1 + vec2(uTime * 0.3, -uTime * 0.21));
          float a = (big * 0.5 + small * 0.4 + glint * 0.16 + pale) * inside;
          a *= smoothstep(5.0, 11.0, dist) * (1.0 - fogAmount(dist) * 0.7) * (1.0 - uVeil) * uLit;
          if (a < 0.002) discard;
          gl_FragColor = vec4(uColor * a, 1.0);
        }`.replace('gh3fix(gid)', 'fract(dot(gid, vec2(0.37, 0.61)))'),
    });
    ringDisc = new THREE.Mesh(geo, mat); ringDisc.name = 'disc of rings'; ringDisc.position.set(rainAt.x, 0.015, rainAt.z); ringDisc.renderOrder = 1; ringDisc.frustumCulled = false;
    ctx.only(ringDisc, 'direct'); ctx.add(ringDisc);
  }

  // THE COLUMN LEANS. For whoever stages the gust and the draught (the page, section 6: "the rain column leans 4 degrees toward
  // the stage"): shared.air.lean(toStage, toRight) takes the tangent of the lean (0.07 is four degrees) and leans everything
  // of the column that is the place's, about the tear, which stays where it is: the shaft's light in the air, the light it
  // throws on things (the house's paint), the lit mist, the disc of rings and the water's own rain zone. Ease it yourself
  // (over seconds); call it with nothing to stand the column up again. The rain streaks are the cast's: lean them by the same.
  const lean0 = lean.clone(), foot0 = new THREE.Vector2(foot.x, foot.z), top = S.top;
  shared.air = {
    shaft, mist: rainMist, disc: ringDisc, leaning: new THREE.Vector2(),
    gain: 1,                                                               // the moon's strength as the staging wants it (the gust: 0.7 for three seconds, back through 1.2): the shaft, its light on things, the mist and the disc all follow
    lean(toStage = 0, toRight = 0) {
      const ox = ahead.tx * toStage + ahead.rx * toRight, oz = ahead.tz * toStage + ahead.rz * toRight;      // metres the column is carried, for each metre it has fallen
      this.leaning.set(toStage, toRight);
      shaft.matrixAutoUpdate = false; shaft.matrix.identity(); const e = shaft.matrix.elements; e[4] = -ox; e[6] = -oz; e[12] = ox * top; e[14] = oz * top; shaft.matrixWorldNeedsUpdate = true;
      U.uShaftLean.value.set(lean0.x - ox, lean0.y - oz); U.uShaft.value.x = foot0.x + ox * top; U.uShaft.value.y = foot0.y + oz * top;
      if (rainMist) rainMist.position.set(ox * top, 0, oz * top);
      if (ringDisc) { ringDisc.position.set(rainAt.x + ox * top, 0.015, rainAt.z + oz * top); ringDisc.material.uniforms.uAt.value.x = rainAt.x + ox * top; ringDisc.material.uniforms.uAt.value.y = rainAt.z + oz * top; }
      if (shared.rainZone && shared.rainZone.set) shared.rainZone.set({ x: rainAt.x + ox * top, z: rainAt.z + oz * top });
    },
  };
  if (dev.has('lean')) ctx.onUpdate(() => shared.air.lean(+dev.get('lean') || 0, +(dev.get('leanr') || 0)));      // &lean=0.07 (&leanr=): the column held leaning, to look at it

  // (fourth look: THE PALE STAGE IN THE WATER. Kindled, the mirror keeps a much darker copy of everything that is not a light (plan.js, B water: without
  // that the lit house lay on the water as an olive veil). But the open stage is the pale, cool half of the picture, and the key painting's water is at its
  // palest under it; ours was dim there. So in the water's mirror pass, and there only, the pearl wash on the stage counts for more: the painted orchard
  // stands in the water before it nearly as pale as it stands above. Held under the brightness at which the water would draw columns from it.)
  if (L6 && second && typeof ctx.water.onMirror === 'function') {
    const k = dev.has('stagem') ? +dev.get('stagem') : (plan.light6.stageMirror ?? 1);
    if (k !== 1) ctx.water.onMirror(ctx.path, () => { U.uStageCol.value.multiplyScalar(k); }, () => { U.uStageCol.value.multiplyScalar(1 / k); });
  }

  // The kept lamp: on the flooded stage, among painted blossom, its foot on the stage floor. A4.
  shared.lamp = makeKeptLamp(ctx.engine, ctx, { at: [plan.lamp.s, dev.has('lampd') ? +dev.get('lampd') : plan.lamp.d], note: plan.lamp.note, moths: plan.lamp.moths, reach: plan.lamp.reach });

  // ============================================================================================ every frame
  const skyA = C(L.sky), skyC = C(L.C.background), skyEnd = C(dev.has('skyend') ? '#' + dev.get('skyend') : '#111B2D'), skyEndTop = C('#04060C'), shaftWarmCol = C('#F0C590'), tmp = new THREE.Color();
  // &set=house.level:0.05,grade.contrast:1,fog.color:x12302a  and  &wset=mirror:0.4,streak:2 : the developer's own numbers for the
  // look and the water, laid over every light state each frame (a colour is written x and six hex digits)
  const overrides = [];
  for (const [key, obj] of [['set', 'l'], ['wset', 'w']]) for (const pair of (dev.get(key) || '').split(',')) {
    const i = pair.indexOf(':'); if (i < 1) continue;
    const v = pair.slice(i + 1); overrides.push([obj, pair.slice(0, i).split('.'), /^x[0-9a-fA-F]{6}$/.test(v) ? '#' + v.slice(1) : v]);
  }
  // (&log=name.json&logt=40: where a boat left alone goes. Writes .shots/name.json after `logt` seconds: s, d, the show clock, the current, once a second.)
  const log = dev.has('log') ? { rows: [], next: 0, at: +(dev.get('logt') || 40), sent: false } : null;
  return {
    update(dt) {
      const s = ctx.s, look = ctx.look;
      if (log && !log.sent) {
        if (ctx.time >= log.next) { log.next += 1; const b = ctx.boat; log.rows.push({ t: +ctx.time.toFixed(1), s: +b.s.toFixed(2), d: +b.d.toFixed(2), c: +show.c.toFixed(1), k: +show.k.toFixed(2), current: +look.current.toFixed(2), speed: +(b.speed || 0).toFixed(2) }); }
        if (ctx.time >= log.at) { log.sent = true; fetch('/__shot/' + dev.get('log'), { method: 'POST', body: JSON.stringify(log.rows) }).catch(() => {}); }
      }
      if (!show.held && show.started) show.c = Math.max(Math.max(show.c, 0) + dt, plan.show.f(s));
      show.k = dev.raw ? 0 : plan.shareBurning(show.c);
      const fly = smooth(L.flyFrom, L.flyTo, s);
      states.set({ A: (1 - show.k) * (1 - fly), B: show.k * (1 - fly), C: fly });
      look.exposure *= 1 - (1 - L.foyerExposure / L.A.exposure) * (1 - smooth(L.foyerTo[0], L.foyerTo[1], s));      // the foyer is held under; it opens as the arches are reached
      look.current = look.currentNarrow = plan.currentAt(s);
      if (second) look.lantern *= 1 - 0.45 * smooth(88, 97, s) * (1 - smooth(117, 122, s));      // on the stage the bow lantern is turned down: the kept lamp's amber and the stage moon's pearl are the light there
      look.light.lanternRadius += 9 * smooth(119, 127, s) * (1 - fly);                                              // behind the backcloth the lantern is the only light: it reaches the rope walls (14 m, as in state C)
      // the house's light
      for (const [obj, path, v] of overrides) {                                                   // &set= / &wset= (the developer's own numbers, over every light state)
        let o = obj === 'w' ? ctx.waterLook : look; for (let i = 0; i < path.length - 1 && o; i++) o = o[path[i]];
        if (o && path.at(-1) in o) { const k = path.at(-1); if (o[k] && o[k].isColor) o[k].set(v); else o[k] = +v; }
      }
      const hs = look.house, breath = (1 + 0.25 * Math.sin(ctx.time * (Math.PI * 2 / 24)) * (ctx.reducedMotion ? 0.4 : 1)) * (shared.air ? shared.air.gain : 1);      // cloud crosses the moon (and the staging's own hand on it: shared.air.gain)
      if (!dev.raw) {
        U.uHouse.value = hs.level; U.uShaft.value.w = hs.moon * (0.05 + breath);                    // the page's m: 0.8 to 1.3 with the cloud
        U.uWakeCol.value.copy(hs.wake); U.uWakeP.value.y = dev.has('wakebase') ? +dev.get('wakebase') : hs.wakeBase;
        if (second) {
          U.uDark.value.copy(hs.dark); U.uDarkP.value.set(hs.recess, hs.top, hs.form, hs.darkness);
          U.uMoonP.value.set(hs.grey, hs.falloff, hs.scatter, hs.gleam);
          U.uPoolP.value.set(hs.pool, hs.wrap, hs.glint, hs.lamps);
          U.uCandleCol.value.copy(hs.candle).multiplyScalar(hs.candleGain);
          U.uFillCol.value.copy(hs.bounce).multiplyScalar(hs.fill);
          U.uStageCol.value.set('#C4D6D0').multiplyScalar(hs.stage);
          U.uLampMore.value = hs.lampMore;
          U.uLanternK.value = hs.lanternPool;
          if (U.uCoveP) U.uCoveP.value.set(hs.coveReach ?? 2.6, hs.cove ?? 0, 0, 0);      // the top tier's candles on the cove above them (light.js)
          if (U.uEndP) U.uEndP.value.x = hs.end ?? 0;                                           // the night at the fly tower's open end (light.js)
          if (U.uWarmP) U.uWarmP.value.set(hs.warm ?? 0, hs.warmLamps ?? 0, hs.candleCap ?? 0, hs.poolOver ?? 0);      // warm light on green things (light.js)
          if (U.uHighP) { U.uHighP.value.x = hs.high ?? 0; U.uHighP.value.y = hs.highWarm ?? 1; U.uHighP.value.z = hs.highGilt ?? 1; }      // the high room: the night's own light above the cornice, the warm bounce paint keeps there and gilt takes there (light.js, second look)
          U.uWakeP.value.x = hs.wakeGain ?? 0.95; U.uWakeP.value.z = hs.web ?? 0.5;             // water-light: a finer web than the first version's (two metres to a mesh, not three and a half)
        } else U.uFillCol.value.set('#FFD27A').multiplyScalar(0.045 * hs.fill);
      }
      U.uShow.value = show.c;
      H.wake.update(dt, ctx.time);
      // (kindled, the lit rain takes the candles' light as well as the moon's: the shaft and its mist go from pearl toward a warm pearl, house.shaftWarm)
      shaft.material.uniforms.uColor.value.set('#C4D6D0').lerp(shaftWarmCol, hs.shaftWarm ?? 0).multiplyScalar(0.2 * hs.shaft * breath * (dev.raw ? 0 : 1));
      shaft.visible = hs.shaft > 0.004;
      // the rain in the light (second look; behind &l3=1 while it is being worked on): how bright its threads are, the veil left between them, their fall
      { const th = shaft.material.uniforms.uThread.value; if (L3 && second) { th.x = hs.thread ?? 0; th.y = hs.threadVeil ?? 1; } else { th.x = 0; th.y = 1; } }
      // (second look, continued: from inside the hem of the rain the thirty cards of lit vapour lay one behind another over everything and the picture was
      // one pale grey; `&air=0` there showed the leaves on the mound copper again. An eye that stands in the vapour sees through it: within twelve metres of
      // the tree's axis it holds three tenths of its light, and all of it from twenty-four on, so the first image and the key painting's view are as they were)
      const eyeR = Math.hypot(ctx.boat.x - rainAt.x, ctx.boat.z - rainAt.z), amid = plan.light4 && plan.light4.on ? 0.3 + 0.7 * smooth(10, 24, eyeR) : 1;
      if (rainMist) { rainMist.material.uniforms.uLit.value = 0.19 * hs.shaft / 0.34 * breath * (hs.mist ?? 1) * amid; rainMist.material.uniforms.uColor.value.set('#C4D6D0').lerp(shaftWarmCol, hs.shaftWarm ?? 0); rainMist.visible = hs.shaft > 0.004; }
      if (ringDisc) { ringDisc.material.uniforms.uLit.value = hs.moon * breath * (L6 ? plan.light6.disc ?? 1 : 1); ringDisc.visible = hs.moon > 0.01; }      // (fourth look: the water's own sheen gives the pale disc now, plan.js; this keeps its rings and glints)
      cloudMat.uniforms.uCloud.value = hs.cloud; cloudMat.uniforms.uBreath.value = 2 - breath;
      tmp.copy(skyA).lerp(skyC, fly);
      for (const k of ['uTop', 'uMid', 'uHorizon', 'uBelow']) sky.material.uniforms[k].value.copy(tmp);
      // (the fly tower is open at its far end: the night there is a shade lighter and bluer at the horizon than the plum-black of the tower,
      // so that the broken walls and the last rope stand against it. It is the sea's night, the next area's.)
      if (second) {
        // (second look, continued: THE WAY OUT. The night beyond the broken end was a flat navy sheet over flat dark water with a ruled line between
        // them. The far water takes the fog's colour and the sky does not, so toward the end the fog itself goes to the night's colour at the horizon:
        // sea and sky are one darkness there, lightest where they meet and going up into blue-black, and the broken walls stand against it.)
        const open = fly * smooth(134, 156, s), U_ = sky.material.uniforms;
        U_.uHorizon.value.lerp(skyEnd, fly); U_.uBelow.value.lerp(skyEnd, open);
        U_.uMid.value.lerp(skyEnd, fly * 0.42); U_.uTop.value.lerp(skyEndTop, fly);
        look.fog.color.lerp(skyEnd, 0.9 * open);
      }
      cloudMat.uniforms.uSkyFar.value.copy(sky.material.uniforms.uHorizon.value);
      cloudMat.uniforms.uSkyCol.value.copy(tmp);
      if (L6) { cloudMat.uniforms.uFar.value.set(120 + 240 * fly, 340 + 660 * fly); cloudMat.uniforms.uEndSky.value = fly; }      // (fourth look: beyond the fly tower's end the cloud goes on down the sky to the horizon)
    },
  };
}
