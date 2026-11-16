// The theatre of leaves: the multitudes, as instanced STAND-INS at the counts the page plans, so that the cost of the
// picture is real from the first day (docs/build/theatre/1-layout.md). One draw call each.
//
//   flames     the 890 candle flames: NO LONGER A STAND-IN (the real thing, by the kit's builder for the tiers: see below)
//   leaves     2,000 in the air (1,400 on the helix round the trunk), 2,600 afloat, 170 sitters of 150 (the page: 50) and a company of 7 of 380:
//              one mesh, one draw; 40 % of them in the mirror
//   rain       6,000 streaks in the column under the tear; never in the mirror
//
// These three are the cast's (docs/art/theatre.md, section 5): whoever builds the cast replaces each with the living thing
// (landings and rings, the fall, leaves parting round the prow, presences that lose hold, drops, the gust), sets its flag in
// plan.standIn to false and deletes it here. They are stateless stand-ins: nothing here lands, answers the boat or makes a sound.
import * as THREE from 'three';
import { FOG_PARS } from '../../engine/kit.js';
import { at, house, passes, dev } from './lib.js';

const targetHeight = (renderer) => { const rt = renderer.getRenderTarget(); return rt ? rt.height : renderer.getDrawingBufferSize(new THREE.Vector2()).y; };

// ------------------------------------------------------------------------------------------------ flames
// THE CANDLE FLAMES (the real thing: stage 2, kit, the tiers; docs/build/theatre/2-kit-tiers.md). 890 of them, from plan.flames():
// one instanced quad each, the teardrop and its halo drawn in the fragment shader; drawn in the water's mirror like everything else.
//   * each catches at its own time on the show clock and takes 0.9 s to rise; once lit its height wanders 12 per cent at 0.7 to 1.3 Hz,
//     never in unison; one that the fall puts out goes in 1.5 s and stays out;
//   * each leans with the draught (5 to 10 degrees toward the stage once the hour has struck, more through the fall) and wavers a little;
//   * never under about two and a half pixels tall, never star-shaped, never amber (the kept lamp's colour): candle gold #FFD27A, core #FFF1C8;
//   * a flame that hangs with something that swings (a lustre, the chandelier in the tree) swings with it: `swing` is the horseshoe's
//     (kit_tiers.js: groups 1..10 the lustres, 11 the chandelier in the tree).
// Returns { mesh, draught } : draught.lean (the tangent of the lean) and draught.dir (Vector2, the way the air moves in the realm's x, z)
// are the staging's to drive; left alone they follow the show clock.
export const SWING_GLSL = /* glsl */`
  uniform vec3 uSwingPivot[12]; uniform vec2 uSwingAngle[12];
  // p carried round its group's pivot: first about the realm's z (across the house), then about its x (along it)
  vec3 swingAbout(vec3 p, float group, vec2 late) {
    int g = int(group + 0.5); if (g < 1) return p;
    vec3 d = p - uSwingPivot[g]; vec2 a = uSwingAngle[g] + late;
    float c1 = cos(a.x), s1 = sin(a.x), c2 = cos(a.y), s2 = sin(a.y);
    d = vec3(d.x * c1 - d.y * s1, d.x * s1 + d.y * c1, d.z);
    d = vec3(d.x, d.y * c2 - d.z * s2, d.y * s2 + d.z * c2);
    return uSwingPivot[g] + d;
  }`;
export function makeFlames(ctx, plan, shared, swing = null) {
  const F = plan.flames(), n = F.length, sh = ctx.engine.shared, U = house(ctx, plan, shared).U;
  const base = new THREE.PlaneGeometry(1, 1), geo = new THREE.InstancedBufferGeometry();
  geo.index = base.index; geo.setAttribute('position', base.attributes.position);
  const pos = new Float32Array(n * 3), aux = new Float32Array(n * 4), grp = new Float32Array(n), rnd = ctx.rng(891);
  F.forEach((fl, i) => {
    const p = at(ctx, fl.s, fl.d, fl.y); pos.set([p.x, p.y, p.z], i * 3);
    aux.set([fl.t, Number.isFinite(fl.out) ? fl.out : 1e6, rnd() * 6.283, 0.85 + rnd() * 0.3], i * 4);
    grp[i] = fl.swing || (fl.where === 'tree' ? 11 : 0);
  });
  geo.setAttribute('aPos', new THREE.InstancedBufferAttribute(pos, 3)); geo.setAttribute('aAux', new THREE.InstancedBufferAttribute(aux, 4)); geo.setAttribute('aGroup', new THREE.InstancedBufferAttribute(grp, 1));
  geo.instanceCount = n;
  const still = { uSwingPivot: { value: Array.from({ length: 12 }, () => new THREE.Vector3()) }, uSwingAngle: { value: Array.from({ length: 12 }, () => new THREE.Vector2()) } };
  const down = ctx.path.at(plan.tear.s), draught = { lean: null, dir: new THREE.Vector2(down.tx, down.tz) };
  const mat = new THREE.ShaderMaterial({
    // (Second look, 2-kit-tiers.md: the director found the far flames "small yellow dots: more amber, each with a little halo".
    // The body is a deeper candle gold, the halo amber; and a flame drawn larger than life is dimmed as it is enlarged: see the fragment shader.
    // uFlameK: x the body, y the core, z the halo, w the whole flame in the water's mirror: the light's builder may tune them.)
    uniforms: { uTime: sh.uTime, uFogColor: sh.uFogColor, uFogDensity: sh.uFogDensity, uVeil: sh.uVeil, uVeilColor: sh.uVeilColor, uShow: U.uShow, uPpm: { value: 780 },
      uGold: { value: new THREE.Color('#FFC66A') }, uCore: { value: new THREE.Color('#FFE8B4') }, uHalo: { value: new THREE.Color('#FFB250') }, uFlameK: { value: new THREE.Vector4(2.0, 3.2, 1.0, 1.0) }, uMirrorNow: { value: 0 },
      uDraught: { value: new THREE.Vector3(down.tx, down.tz, 0) }, ...(swing ? swing.uniforms : still) },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
    vertexShader: /* glsl */`
      attribute vec3 aPos; attribute vec4 aAux; attribute float aGroup; uniform float uShow, uTime, uPpm; uniform vec3 uDraught;
      varying vec2 vQ; varying float vLit, vDist, vTall, vLean, vSeed, vBig;
      ${SWING_GLSL}
      void main() {
        // a flame takes 0.9 s to rise; one that the fall puts out goes in 1.5 s
        vLit = clamp((uShow - aAux.x) / 0.9, 0.0, 1.0) * (1.0 - clamp((uShow - aAux.y) / 1.5, 0.0, 1.0));
        vec3 c = swingAbout((modelMatrix * vec4(aPos, 1.0)).xyz, aGroup, vec2(0.0)), toCam = cameraPosition - c;
        vDist = length(toCam);
        vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), toCam));
        float k = max(1.0, 2.6 * vDist / (0.11 * uPpm));                    // never under about two and a half pixels tall
        vBig = k;                                                            // how many times life size it is drawn
        float ph = aAux.z; vSeed = ph;
        // its height wanders 12 % at 0.7 to 1.3 Hz; never in unison
        vTall = aAux.w * (1.0 + 0.12 * sin(uTime * (4.4 + 3.8 * fract(ph * 0.37)) + ph)) * (0.25 + 0.75 * vLit);
        // it leans with the draught, as much as the draught crosses the picture, and wavers a little of itself
        vLean = dot(uDraught.xy, right.xz) * uDraught.z * (0.75 + 0.5 * fract(ph * 1.7)) + 0.045 * sin(uTime * (1.6 + 1.3 * fract(ph * 0.61)) + ph * 3.1);
        vQ = position.xy * vec2(0.56, 0.66) + vec2(0.0, 0.16);              // metres from the wick: the quad holds the halo
        vec3 p = c + (right * vQ.x + vec3(0.0, 1.0, 0.0) * vQ.y) * k;
        gl_Position = projectionMatrix * viewMatrix * vec4(vLit > 0.001 ? p : c, 1.0);
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uGold, uCore, uHalo; uniform vec4 uFlameK; uniform float uTime, uMirrorNow; ${FOG_PARS}
      varying vec2 vQ; varying float vLit, vDist, vTall, vLean, vSeed, vBig;
      void main() {
        if (vLit < 0.002) discard;
        float tall = 0.11 * vTall, y = vQ.y / tall;                                     // 0 at the wick .. 1 at the tip
        float yy = clamp(y, 0.0, 1.2);
        float x = vQ.x - vLean * tall * (0.35 * yy + 0.65 * yy * yy);                    // the lean grows toward the tip
        // a teardrop: full a third of the way up, drawn to a point; a waist of dark by the wick
        float w = 0.0215 * pow(max(0.0, 1.0 - y), 0.62) * smoothstep(-0.16, 0.3, y);
        float body = (1.0 - smoothstep(w * 0.5, w, abs(x))) * step(-0.16, y) * step(y, 1.0);
        float core = (1.0 - smoothstep(0.0, w * 0.62, abs(x))) * smoothstep(0.9, 0.3, y) * smoothstep(0.02, 0.2, y);
        float foot = smoothstep(0.22, -0.05, y);                                          // by the wick the flame is thin and cool
        vec2 hq = vec2(x, vQ.y - tall * 0.42);
        float hr = dot(hq, hq);
        float halo = exp(-hr / (0.125 * 0.125)) * 0.17 + exp(-hr / (0.04 * 0.04)) * 0.44;
        // A flame kept two and a half pixels tall far off is drawn larger than life, and at full strength it would carry the
        // light of several flames and burn out to a white point. So it is dimmed as it is enlarged, its pale core goes,
        // and what is left is the body's candle gold in a small amber halo: an amber point in the dark, not a white one.
        float far = clamp((vBig - 1.0) / 1.2, 0.0, 1.0), dim = 1.0 / pow(vBig, 1.15);
        vec3 col = (uGold * (uFlameK.x * dim * body * (1.0 - 0.6 * foot)) + uCore * (uFlameK.y * (1.0 - far) * dim * core * body) + uHalo * (uFlameK.z * halo * (1.0 + 0.4 * far))) * vLit;
        col *= mix(1.0, uFlameK.w, uMirrorNow);
        col *= (1.0 - fogAmount(vDist)) * (1.0 - uVeil) * smoothstep(0.5, 1.4, vDist);
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = 'candle flames x ' + n; mesh.frustumCulled = false; mesh.renderOrder = 3;
  mesh.onBeforeRender = (renderer, scene, camera) => { mat.uniforms.uPpm.value = targetHeight(renderer) * 0.5 * camera.projectionMatrix.elements[5]; mat.uniforms.uMirrorNow.value = ctx.engine.reflecting ? 1 : 0; mat.uniformsNeedUpdate = true; };
  ctx.add(mesh);
  const smooth = (a, b2, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b2 - a))); return t * t * (3 - 2 * t); };
  ctx.onUpdate(() => {
    // left alone: no draught before the hour, 7 degrees toward the stage once it has struck, twice that through the fall
    const c = U.uShow.value, fall = plan.show.fall, lean = draught.lean ?? (0.03 + 0.09 * smooth(0, 3, c) + 0.14 * smooth(fall[0], fall[0] + 2, c) * (1 - smooth(fall[0] + 7, fall[1], c)));
    mat.uniforms.uDraught.value.set(draught.dir.x, draught.dir.y, lean * (ctx.reducedMotion ? 0.5 : 1));
  });
  return { mesh, draught };
}

// ------------------------------------------------------------------------------------------------ leaves
const LEAF_COLOURS = ['#B5522A', '#B5522A', '#7A3B22', '#C08A3A', '#5A2630', '#C4622E'];
/** One beech leaf: 85 by 55 mm, six triangles, folded 14 degrees on the midrib. Its stalk is at the origin, its tip toward +Z, its upper face +Y. */
export function leafGeometry(scale = 1) {
  const L = 0.085 * scale, w = 0.0275 * scale, h = w * Math.tan(14 * Math.PI / 180);
  const P = [[0, 0, 0], [0, 0, L * 0.5], [0, 0, L], [-w, h, L * 0.38], [-w * 0.72, h * 0.72, L * 0.74], [w, h, L * 0.38], [w * 0.72, h * 0.72, L * 0.74]];
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P.flat(), 3));
  g.setIndex([0, 3, 1, 1, 3, 4, 1, 4, 2, 0, 1, 5, 1, 6, 5, 1, 2, 6]);
  g.computeVertexNormals();
  g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(14), 2));
  return g;
}

/**
 * STAND-IN for the cast's leaves: one instanced leaf in four ways of being, all in the vertex shader.
 *   0 in the air   falls at 0.9 to 1.3 m/s swinging half a metre, turning over; within 12 m of the tree it rides a helix round the trunk (one turn in 14 s)
 *   1 afloat       lies on the water, rocking; thick by the mound, thin at the walls; never on the mound
 *   2 a sitter     a spindle of 50 turning leaves behind a box rail, formed after its tier kindles, let go in the fall (here: it thins to nothing)
 *   3 the company  a spindle of 380, 2.6 to 3.4 m tall, standing on the stage water from c 20
 */
export function makeLeaves(ctx, plan, shared) {
  const H = house(ctx, plan, shared), rnd = ctx.rng(1400), B = plan.beech, tree = at(ctx, B.s, B.d, 0);
  const home = [], seed = [], col = [], aux = [], c = new THREE.Color();
  const put = (kind, x, y, z, a = 0, b = 0, cc = 0, dd = 0) => { home.push(x, y, z, kind); seed.push(rnd(), rnd(), rnd(), rnd()); aux.push(a, b, cc, dd); c.set(LEAF_COLOURS[Math.floor(rnd() * LEAF_COLOURS.length)]); col.push(c.r, c.g, c.b); };
  const count = (n) => ctx.kit.count(n);
  if (plan.standIn.leaves) {
    // 1,400 on the helix within 12 m of the tree's axis (aux: radius, top), 600 from the tiers and limbs
    for (let i = 0; i < count(1400); i++) put(0, tree.x, 0, tree.z, 1.2 + 10.8 * Math.sqrt(rnd()), 26 + rnd() * 12, 1, 0);
    for (let i = 0; i < count(600); i++) { const s = 33 + rnd() * 55, d = (rnd() * 2 - 1) * (plan.frontD(s) - 1.5), p = at(ctx, s, d, 0); put(0, p.x, 0, p.z, 0.5, 5 + rnd() * 15, 0, 0); }
    // 2,600 afloat: 4 to the square metre by the mound, 0.3 at the walls; none on the mound
    for (let n = 0, tries = 0; n < count(2600) && tries < 400000; tries++) {
      const s = 31 + rnd() * 87, hw = s < 90 ? plan.frontD(s) - 0.6 : 10.4, d = (rnd() * 2 - 1) * hw, r = Math.hypot(s - B.s, d - B.d);
      if (r < B.mound.waterline / 2 + 0.15) continue;
      const dens = 0.3 + 3.7 * Math.exp(-Math.pow(Math.max(0, r - 5) / 6.5, 2));
      if (rnd() * 4 > dens) continue;
      const p = at(ctx, s, d, 0); put(1, p.x, 0.012, p.z); n++;
    }
  }
  // The sitters. As the page has them (50 leaves each, 0.9 to 1.7 m tall with 0.4 m of that below the rail top, 0.75 m behind the
  // rail: &sitters=1) they do not read from the boat: the rider is below every tier, so the rail hides most of what sits behind
  // it, and fifty 85 mm leaves are a dozen specks at 30 m (1-layout.md, with pictures). What stands here by default is what does
  // read: 150 leaves each, 0.3 m behind the rail, showing 0.9 to 1.6 m above it, with the candles' light in them.
  const big = dev.get('sitters') !== '1';
  if (plan.standIn.sitters) for (const q of plan.sitters()) {
    const fwd = big ? 0.45 : 0, p = at(ctx, q.s - Math.cos(q.turn) * fwd, q.d + Math.sin(q.turn) * fwd, q.y), tall = big ? 1.3 + q.seed * 0.7 : 0.9 + q.seed * 0.8, period = 5 + Math.floor(rnd() * 5), gone = 29 + (5 - q.tier) * 0.8 + rnd() * 0.6;
    for (let j = 0; j < (big ? 150 : 50); j++) put(2, p.x, p.y - 0.4, p.z, tall, big ? 0.38 : 0.32, q.t, gone + period * 1000);       // aux: height, radius, forms at; (let go at, under 1000) + 1000 * (seconds a turn, whole)
  }
  if (plan.standIn.company) plan.company.forEach(([s, d], i) => {
    const p = at(ctx, s, d, 0), tall = 2.6 + 0.8 * rnd(), period = 4 + Math.floor(rnd() * 3);
    for (let j = 0; j < 380; j++) put(3, p.x, 0.02, p.z, tall, 0.55, 20 + i * 0.7, 999 + period * 1000);    // (the company does not let go here: 999)
  });
  const n = home.length / 4;
  if (!n) return null;
  // shuffle, so that any share of them drawn (the mirror takes 40 %) is a fair sample
  const order = Array.from({ length: n }, (_, i) => i); for (let i = n - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
  const pick = (src, k) => { const out = new Float32Array(n * k); order.forEach((o, i) => { for (let q = 0; q < k; q++) out[i * k + q] = src[o * k + q]; }); return out; };
  const leaf = leafGeometry(), geo = new THREE.InstancedBufferGeometry();
  geo.index = leaf.index; for (const k of ['position', 'normal', 'uv']) geo.setAttribute(k, leaf.attributes[k]);
  geo.setAttribute('aHome', new THREE.InstancedBufferAttribute(pick(home, 4), 4)); geo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(pick(seed, 4), 4));
  geo.setAttribute('aAux', new THREE.InstancedBufferAttribute(pick(aux, 4), 4)); geo.setAttribute('color', new THREE.InstancedBufferAttribute(pick(col, 3), 3));
  geo.instanceCount = n;
  const mat = H.paint('leaf', { color: '#ffffff', vertexColors: true, side: THREE.DoubleSide, brush: 0.3, extend: {
    uniforms: { uTree: { value: new THREE.Vector2(tree.x, tree.z) }, uPresenceGlow: { value: big ? 0.8 : 0 } },
    fragmentPars: 'varying float vPresence; uniform float uPresenceGlow;',
    light: 'glow += albedo * vec3(1.0, 0.5, 0.22) * (uPresenceGlow * vPresence);',
    vertexPars: /* glsl */`attribute vec4 aHome, aSeed, aAux; uniform float uShow; uniform vec2 uTree; varying float vPresence;
      vec3 leafTurn(vec3 v, vec3 k, float a) { float cs = cos(a), sn = sin(a); return v * cs + cross(k, v) * sn + k * dot(k, v) * (1.0 - cs); }`,
    vertexLocal: /* glsl */`{
      float kind = aHome.w, t = uTime; vPresence = 0.0;
      vec3 centre = aHome.xyz; vec3 axis = normalize(aSeed.xyz * 2.0 - 1.0 + vec3(0.0, 0.2, 0.0)); float turn = 0.0, size = 1.0;
      if (kind < 0.5) {                                                    // in the air
        float top = aAux.y, speed = 0.9 + 0.4 * aSeed.x, age = mod(t * speed + aSeed.y * top, top);
        centre.y = top - age;
        float sw = t * (2.5 + 1.2 * aSeed.z) + aSeed.w * 40.0;             // 0.4 to 0.6 Hz
        if (aAux.z > 0.5) { float ang = aSeed.w * 6.2831853 + t * 0.4488 + age * 0.12; centre.xz += vec2(cos(ang), sin(ang)) * aAux.x; }   // the helix: one turn in 14 s
        else centre.xz += vec2(cos(aSeed.w * 37.0), sin(aSeed.w * 37.0)) * aAux.x * sin(sw * 0.31);
        centre.xz += 0.5 * vec2(sin(sw), cos(sw * 0.83 + 1.3));
        centre.y += 0.12 * sin(sw * 2.0);
        turn = t * (2.1 + 2.1 * aSeed.x) + aSeed.z * 20.0;                // turning over once in 1.5 to 3 s
        size *= smoothstep(0.0, 0.6, age) * smoothstep(0.0, 0.5, top - age - 0.02);
      } else if (kind < 1.5) {                                             // afloat: flat, each at its own angle, rocking
        axis = vec3(0.0, 1.0, 0.0); turn = aSeed.w * 6.2831853 + 0.25 * sin(t * 0.5 + aSeed.x * 30.0);
        centre.y += 0.004 * sin(t * 1.3 + aSeed.y * 40.0);
      } else {                                                             // a presence: a spindle of turning leaves, ragged at the top, a point at the foot
        float tall = aAux.x, R = aAux.y, hh = pow(aSeed.x, 0.75), period = floor(aAux.w / 1000.0), gone = mod(aAux.w, 1000.0);
        float rate = 6.2831853 / max(period, 1.0) * mix(1.4, 0.8, hh);
        float stray = step(0.85, aSeed.y), rr = R * sin(3.14159 * pow(hh, 0.8)) * (0.35 + 0.65 * sqrt(aSeed.z)) * mix(1.0, 2.0, stray);
        float ang = aSeed.w * 6.2831853 + t * rate;
        centre += vec3(cos(ang) * rr, hh * tall + 0.2 * sin(t * 0.2 + aSeed.w * 6.0) * step(kind, 2.5), sin(ang) * rr);
        axis = normalize(vec3(sin(ang), 0.6 * (aSeed.y - 0.5), -cos(ang))); turn = ang * 1.7 + aSeed.z * 9.0;
        float formed = smoothstep(0.0, 4.0, uShow - aAux.z - 1.5 * aSeed.x) * (1.0 - smoothstep(0.0, 2.5, uShow - gone - 2.0 * (1.0 - hh)));
        centre.y -= (1.0 - formed) * hh * tall * step(kind, 2.5);          // before it forms it lies along the rail
        if (kind > 2.5) formed *= smoothstep(7.0, 9.5, distance(aHome.xz, uBoat.xz));      // the company loses hold within 9 m of the boat
        else vPresence = formed;
        size *= formed;
      }
      float far = length(centre - uCameraPos);
      size *= mix(1.0, 1.5, smoothstep(8.0, 12.0, far));                   // drawn one and a half times life size beyond 12 m, so that none is under two pixels
      transformed = centre + leafTurn(position, axis, turn) * size;
      objectNormal = leafTurn(normal, axis, turn);
    }` } });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = `standin:leaves x ${n}`; mesh.frustumCulled = false;
  ctx.add(mesh);
  passes(mesh, ctx, { mirror: 0.4 });
  return mesh;
}

// ------------------------------------------------------------------------------------------------ rain
/** STAND-IN for the cast's rain: 6,000 streaks in a column of radius 9.5 m round the tree, lit only inside the shaft. Never in the mirror. */
export function makeRain(ctx, plan, shared) {
  const S = plan.shaft, n = ctx.kit.count(S.rain.streaks), sh = ctx.engine.shared, U = house(ctx, plan, shared).U, tree = at(ctx, plan.beech.s, plan.beech.d, 0), rnd = ctx.rng(6000);
  const base = new THREE.PlaneGeometry(1, 1), geo = new THREE.InstancedBufferGeometry();
  geo.index = base.index; geo.setAttribute('position', base.attributes.position);
  const seed = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
    let r; do { r = Math.sqrt(rnd()) * S.rain.fadeTo; } while (rnd() > 1 - Math.max(0, (r - S.rain.fadeFrom) / (S.rain.fadeTo - S.rain.fadeFrom)));      // thinning from 8 to 10.5 m
    seed.set([r, rnd() * Math.PI * 2, rnd(), rnd()], i * 4);
  }
  geo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seed, 4)); geo.instanceCount = n;
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: sh.uTime, uFogColor: sh.uFogColor, uFogDensity: sh.uFogDensity, uVeil: sh.uVeil, uVeilColor: sh.uVeilColor, uTree: { value: new THREE.Vector3(tree.x, S.top, tree.z) },
      uShaft: U.uShaft, uShaftLean: U.uShaftLean, uColor: { value: new THREE.Color('#C4D6D0') }, uPpm: { value: 780 }, uDown: { value: new THREE.Vector2(ctx.path.at(0).tx, ctx.path.at(0).tz) } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
    vertexShader: /* glsl */`
      attribute vec4 aSeed; uniform float uTime, uPpm; uniform vec3 uTree; uniform vec4 uShaft; uniform vec2 uShaftLean, uDown; varying float vA, vDist, vAcross;
      void main() {
        float top = uTree.y, len = 0.5 + 0.3 * aSeed.w, y = top - mod(uTime * 7.0 + aSeed.z * top, top);       // 7 m/s
        vec3 c = vec3(uTree.x + cos(aSeed.y) * aSeed.x, y, uTree.z + sin(aSeed.y) * aSeed.x);
        vec3 toCam = cameraPosition - c; vDist = length(toCam);
        vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), toCam));
        float wide = max(0.008, 1.1 * vDist / uPpm);                        // about a pixel across at any distance
        vec3 p = c + right * position.x * wide + vec3(0.0, position.y * len, 0.0);
        // lit only inside the shaft
        vec2 q = c.xz - (uShaft.xy + uShaftLean * c.y);
        float lit = (1.0 - smoothstep(uShaft.z * 0.85, uShaft.z * 1.12, length(q))) * uShaft.w;
        // the light comes toward the arches: the rain is brightest seen against it
        float against = mix(0.5, 1.25, smoothstep(-0.5, 0.7, dot(normalize(c.xz - cameraPosition.xz), uDown)));
        vA = lit * against * min(1.0, 0.008 / wide * 2.2) * smoothstep(0.0, 0.8, y) * smoothstep(1.2, 4.0, vDist);
        vAcross = position.x * 2.0;
        gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uColor; ${FOG_PARS} varying float vA, vDist, vAcross;
      void main() { float a = vA * (1.0 - abs(vAcross)) * (1.0 - fogAmount(vDist)) * (1.0 - uVeil); if (a < 0.003) discard; gl_FragColor = vec4(uColor * 0.42 * a, 1.0); }`,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = `standin:rain streaks x ${n}`; mesh.frustumCulled = false; mesh.renderOrder = 4;
  ctx.add(mesh);
  passes(mesh, ctx, { mirror: 0, pre: 0 });                                // not in the mirror, not in the picture the engine takes without the water
  const count = mesh.onBeforeRender;
  mesh.onBeforeRender = (renderer, scene, camera) => { mat.uniforms.uPpm.value = targetHeight(renderer) * 0.5 * camera.projectionMatrix.elements[5]; mat.uniformsNeedUpdate = true; count(renderer); };
  return mesh;
}
