// The theatre of leaves: THE AIR (stage 2, "the place, its light and its water"; docs/build/theatre/2-light.md).
//
// What light does in the air of the room, as the place's own (nothing here is a creature, and nothing here is solid):
//
//   THE GLOW OF EVERY BRACKET   A candle lights the air round it. Each three-armed bracket, each branch of the stage boxes
//                               and the royal box, each bracket round the arch and each lustre carries a soft amber glow,
//                               a metre or so across: at a distance a bracket reads as a warm point with its halo, not as
//                               three yellow dots; in the water it stands as an amber-gold column. It comes with its
//                               bracket's own flames on the show clock (plan.flames(): the same list the flames are made
//                               from) and breathes a little, never in step with its neighbour. One draw; in the mirror.
//                               (The flames themselves are the kit's: kit_multitudes.js makeFlames. The chandelier in the
//                               tree carries its own fire: tree.js.)
//
// Everything is added light: it writes no depth, is hidden by whatever stands in front of it, fades with the fog and the
// veil, and is left out of the engine's picture without the water. shared.glow = { mesh, gain } (gain: the staging's
// hand on all of it, 1).
// Developer switches: &skip=air leaves it out; &glow=0.5 its strength; &set=house.glow:0.4 (the light table's own number).
import * as THREE from 'three';
import { FOG_PARS } from '../../engine/kit.js';
import { at, house, dev } from './lib.js';

const targetHeight = (renderer) => { const rt = renderer.getRenderTarget(); return rt ? rt.height : renderer.getDrawingBufferSize(new THREE.Vector2()).y; };

export async function build(ctx, plan, shared) {
  const sh = ctx.engine.shared, H = house(ctx, plan, shared), U = H.U;
  if (!dev.second) return {};                                              // (the first version of the light, &light=1 and &raw=1, is shown as it was: without this)

  // ---- one glow for each group of flames that burn together: a bracket's three, a branch's five, a lustre's twelve
  const groups = [];
  let cur = null;
  for (const fl of plan.flames()) {
    if (fl.where === 'tree') { cur = null; continue; }                     // (the fire in the tree is the tree's own)
    const key = fl.where === 'lustre' ? 'lustre' + fl.swing : fl.where;
    const reach = fl.where === 'lustre' ? 2.0 : 1.0;
    if (!cur || cur.key !== key || Math.hypot(fl.s - cur.s0, fl.d - cur.d0, fl.y - cur.y0) > reach) { cur = { key, where: fl.where, s0: fl.s, d0: fl.d, y0: fl.y, list: [] }; groups.push(cur); }
    cur.list.push(fl);
  }
  const n = groups.length, pos = new Float32Array(n * 3), aux = new Float32Array(n * 4), aux2 = new Float32Array(n * 4), rnd = ctx.rng(4477);
  groups.forEach((g, i) => {
    const m = g.list.length, mean = (k) => g.list.reduce((a, f) => a + f[k], 0) / m;
    const p = at(ctx, mean('s'), mean('d'), mean('y') + 0.04);
    pos.set([p.x, p.y, p.z], i * 3);
    const outs = g.list.filter((f) => Number.isFinite(f.out));
    // when it catches, when its first flame goes out for good (or never), a number of its own, how many flames it holds
    aux.set([Math.min(...g.list.map((f) => f.t)), outs.length ? Math.min(...outs.map((f) => f.out)) : 1e6, rnd() * 6.2832, m], i * 4);
    // the share of its flames that go out; its width (a lustre is 1.3 m across, a branch of five 0.9 m); -, -
    aux2.set([outs.length / m, g.where === 'lustre' ? 1.9 : m >= 5 ? 1.25 : 1.0, 0, 0], i * 4);
  });
  const base = new THREE.PlaneGeometry(1, 1), geo = new THREE.InstancedBufferGeometry();
  geo.index = base.index; geo.setAttribute('position', base.attributes.position);
  geo.setAttribute('aPos', new THREE.InstancedBufferAttribute(pos, 3)); geo.setAttribute('aAux', new THREE.InstancedBufferAttribute(aux, 4)); geo.setAttribute('aAux2', new THREE.InstancedBufferAttribute(aux2, 4));
  geo.instanceCount = n;
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: sh.uTime, uFogColor: sh.uFogColor, uFogDensity: sh.uFogDensity, uVeil: sh.uVeil, uVeilColor: sh.uVeilColor, uShow: U.uShow, uPpm: { value: 780 },
      uAmber: { value: new THREE.Color('#FF9A40') }, uHeart: { value: new THREE.Color('#FF9A44') },
      uGlowK: { value: new THREE.Vector4(0.24, 0.04, 0, 0) },              // the near glow, the wide breath of warm air round it, (set each pass:) how much it counts in this pass, the mirror's own heart
      // (second look, continued: a far bracket counted for a quarter beyond 55 m. The mirror now keeps a much darker copy of everything that is not a light
      // (plan.js, B water), so the far house can count for more without lying on the water as a slab: 0.55 beyond 60 m, and the horseshoe stands in the middle of the water too)
      uGlowFar: { value: new THREE.Vector4(22, plan.light4 && plan.light4.on ? 60 : 55, plan.light4 && plan.light4.on ? 0.55 : 0.25, 0) },               // in the mirror a far bracket counts for less (from, to in metres; what is left of it; set each pass: 1 in the mirror)
    },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
    vertexShader: /* glsl */`
      attribute vec3 aPos; attribute vec4 aAux, aAux2; uniform float uShow, uTime, uPpm;
      varying vec2 vQ; varying float vLit, vDist, vSeed, vWide, vFar;
      void main() {
        // it comes with its flames (0.9 s to rise) and loses the share of them the fall puts out
        vLit = clamp((uShow - aAux.x) / 0.9, 0.0, 1.0) * (1.0 - aAux2.x * clamp((uShow - aAux.y) / 1.5, 0.0, 1.0));
        vec3 c = (modelMatrix * vec4(aPos, 1.0)).xyz, toCam = cameraPosition - c;
        vDist = length(toCam);
        vec3 fwd = toCam / max(vDist, 1e-3), right = normalize(cross(vec3(0.0, 1.0, 0.0), fwd)), up = cross(fwd, right);
        c += fwd * min(0.55, vDist * 0.3);                                  // it hangs in the air before its wall: never cut by the front it lights
        vWide = aAux2.y; vSeed = aAux.z;
        float half_ = 1.7 * vWide;                                          // metres from its middle to the edge of the card
        vFar = max(1.0, 7.0 * vDist / (half_ * uPpm));                      // never under about seven pixels from middle to edge
        vQ = position.xy * 2.0 * half_;
        vec3 p = c + (right * vQ.x + up * vQ.y) * vFar;
        gl_Position = projectionMatrix * viewMatrix * vec4(vLit > 0.001 ? p : c, 1.0);
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uAmber, uHeart; uniform vec4 uGlowK, uGlowFar; uniform float uTime; ${FOG_PARS}
      varying vec2 vQ; varying float vLit, vDist, vSeed, vWide, vFar;
      void main() {
        if (vLit < 0.002) discard;
        float r2 = dot(vQ, vQ) / (vWide * vWide);
        // a near glow that holds the flames, and a wide breath of warm air round it
        float near = exp(-r2 / (0.30 * 0.30)), wide = exp(-r2 / (0.85 * 0.85));
        // it breathes, slowly, each to its own time (the flames waver; the air evens it out)
        float br = 1.0 + 0.07 * sin(uTime * (0.9 + 0.7 * fract(vSeed * 0.37)) + vSeed) + 0.04 * sin(uTime * (2.3 + 1.1 * fract(vSeed * 0.61)) + vSeed * 2.7);
        vec3 col = (uAmber * (uGlowK.x * near + uGlowK.y * wide) + uHeart * (uGlowK.w * exp(-r2 / (0.16 * 0.16)))) * (vLit * br * uGlowK.z);
        col /= vFar;                                                        // (a glow kept large far off is dimmed as it is enlarged)
        // (in the water a house full of far flames adds up to one slab of light: seen from the stage the mirror was a sheet of
        // lemon. A far bracket counts for less there, so that the near ones stand as long columns and the far ones as a row of dashes)
        col *= mix(1.0, uGlowFar.z, smoothstep(uGlowFar.x, uGlowFar.y, vDist) * uGlowFar.w);
        col *= (1.0 - fogAmount(vDist)) * (1.0 - uVeil) * smoothstep(1.2, 4.5, vDist);      // never a disc of light in the rider's face
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = 'glow of the brackets x ' + n; mesh.frustumCulled = false; mesh.renderOrder = 3;
  // (a coarser mirror runs neighbouring lights together: at medium and low quality what the lights count for in the water is less,
  // or the far house lies on the water as one sheet again)
  const level = (ctx.quality && ctx.quality.level) || 'high', coarse = level === 'low' ? 2 : level === 'medium' ? 1 : 0;
  const glow = shared.glow = { mesh, gain: dev.has('glow') ? +dev.get('glow') : 1, mirror: [1.0, 0.9, 0.7][coarse], heart: [4.4, 3.4, 2.0][coarse] };
  if (dev.has('glowm')) [glow.mirror, glow.heart] = dev.get('glowm').split(',').map(Number);      // &glowm=1.6,2.2: what it counts for in the mirror, and its heart there
  if (dev.has('glowk')) { const k = dev.get('glowk').split(',').map(Number); mat.uniforms.uGlowK.value.x = k[0]; mat.uniforms.uGlowK.value.y = k[1]; }      // &glowk=0.5,0.075: the near glow, the wide one
  if (dev.has('glowc')) mat.uniforms.uAmber.value.set('#' + dev.get('glowc'));      // &glowc=FF9A40
  mesh.onBeforeRender = (renderer, scene, camera) => {
    const u = mat.uniforms, k = (ctx.look.house && ctx.look.house.glow != null ? ctx.look.house.glow : 1) * glow.gain;
    u.uPpm.value = targetHeight(renderer) * 0.5 * camera.projectionMatrix.elements[5];
    // in the water the glow counts for more and has a heart: the water makes its columns out of what is brighter than
    // the picture's white, and the columns take the colour of what they are made of
    u.uGlowK.value.z = k * (ctx.engine.reflecting ? glow.mirror : 1); u.uGlowK.value.w = ctx.engine.reflecting ? glow.heart : 0;
    u.uGlowFar.value.w = ctx.engine.reflecting ? 1 : 0;
    mat.uniformsNeedUpdate = true;
  };
  ctx.add(mesh);
  // The flames in the water. The kit's flames carry a handle for the light (kit_multitudes.js, uFlameK.w: the whole flame in
  // the water's mirror); glow.flames sets it (null leaves it as the kit has it). &flamem=0.5 tries a value.
  glow.flames = dev.has('flamem') ? +dev.get('flamem') : (plan.light4 && plan.light4.on ? [0.6, 0.45, 0.25] : [0.45, 0.35, 0.2])[coarse];      // (0.6 at high quality since the second look, continued: see uGlowFar above)
  if (dev.has('glowfar')) mat.uniforms.uGlowFar.value.fromArray(dev.get('glowfar').split(',').map(Number).concat([0, 0, 0, 0]).slice(0, 4));      // &glowfar=22,60,0.3
  return {
    update() {
      const fk = shared.horseshoe && shared.horseshoe.flames && shared.horseshoe.flames.mesh.material.uniforms.uFlameK;
      if (fk && glow.flames != null) fk.value.w = glow.flames;
    },
  };
}
