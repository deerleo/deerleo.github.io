// Post-processing: HDR scene -> bloom -> one final pass that tone-maps, grades, adds grain and vignette,
// and can dissolve the whole picture into a single colour (the "veil" between realms).
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { Pass, FullScreenQuad } from 'three/addons/postprocessing/Pass.js';

const LAYER_LATE = 3;      // (src/engine/engine.js)

// A phone's frame (engine.light; docs/build/phone.md). Every other frame draws the scene twice: once without the water,
// for the water to look into, and once more with it. This pass makes the second drawing unnecessary: it lays the first
// picture down as it is, with its depth, and draws over it only what that picture left out: the water, and whatever is
// drawn after the water (engine.render says which). Nothing is seen that the two drawings would not have shown.
class LatePass extends Pass {
  constructor(engine) {
    super();
    this.engine = engine; this.needsSwap = false;
    this.lay = new THREE.ShaderMaterial({
      uniforms: { tColor: { value: null }, tDepth: { value: null } },
      vertexShader: /* glsl */`varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
      fragmentShader: /* glsl */`uniform sampler2D tColor, tDepth; varying vec2 vUv;
        void main() { gl_FragColor = texture2D(tColor, vUv); gl_FragDepth = texture2D(tDepth, vUv).r; }`,
      depthTest: true, depthFunc: THREE.AlwaysDepth, depthWrite: true, toneMapped: false,
    });
    this.quad = new FullScreenQuad(this.lay);
  }
  render(renderer, writeBuffer, readBuffer) {
    const e = this.engine, cam = e.camera, scene = e.scene, late = e._late || [], lights = e._lights || [];
    const auto = renderer.autoClear, mask = cam.layers.mask, background = scene.background;
    renderer.autoClear = false;
    renderer.setRenderTarget(this.renderToScreen ? null : readBuffer);
    this.lay.uniforms.tColor.value = e.pre.texture; this.lay.uniforms.tDepth.value = e.pre.depthTexture;
    this.quad.render(renderer);
    for (let i = 0; i < late.length; i++) late[i].layers.enable(LAYER_LATE);
    for (let i = 0; i < lights.length; i++) lights[i].layers.enable(LAYER_LATE);
    cam.layers.set(LAYER_LATE); scene.background = null;
    try { if (!e.noLate) renderer.render(scene, cam); }
    finally {
      cam.layers.mask = mask; scene.background = background; renderer.autoClear = auto;
      for (let i = 0; i < late.length; i++) late[i].layers.disable(LAYER_LATE);
      for (let i = 0; i < lights.length; i++) lights[i].layers.disable(LAYER_LATE);
    }
  }
  dispose() { this.lay.dispose(); this.quad.dispose(); }
}

const FinalShader = {
  name: 'FinalShader',
  uniforms: {
    tDiffuse: { value: null },
    uExposure: { value: 1 }, uTint: { value: new THREE.Color(1, 1, 1) }, uSaturation: { value: 1 }, uContrast: { value: 1 },
    uLift: { value: new THREE.Color(0, 0, 0) },
    uVignette: { value: 0.3 }, uGrain: { value: 0.035 }, uTime: { value: 0 }, uToe: { value: 0 },
    uVeil: { value: new THREE.Color(0, 0, 0) }, uVeilAmount: { value: 0 },
    uWash: { value: new THREE.Color(1, 1, 1) }, uWashAmount: { value: 0 },
    uAspect: { value: 1.78 },
    tDepth: { value: null }, uHasDepth: { value: 0 }, uNear: { value: 0.08 }, uFar: { value: 1800 },      // the picture's depth (the boat is told from the mist by it)
    uTexel: { value: new THREE.Vector2(1 / 1600, 1 / 900) }, uSharp: { value: 0.3 },                       // (a phone's picture: one dot of it, and how much it is sharpened)
  },
  vertexShader: /* glsl */`varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse;
    uniform float uExposure, uSaturation, uContrast, uVignette, uGrain, uTime, uVeilAmount, uAspect, uToe;
    uniform vec3 uTint, uLift, uVeil, uWash; uniform float uWashAmount;
    uniform sampler2D tDepth; uniform float uHasDepth, uNear, uFar;
    varying vec2 vUv;
    float hash(vec2 p) { p = fract(p * vec2(443.897, 441.423)); p += dot(p, p.yx + 19.19); return fract((p.x + p.y) * p.x); }
    float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y); }
    // A gentle filmic curve that keeps saturated colours saturated: the curve is applied to luminance-ish
    // (max channel) and to each channel, and the two are blended, so bright lamps roll off to a warm white core
    // without the mid-tones going grey.
    // The curve has a toe: it presses the darkest values down (a dark chip such as #101830 shows as near black, and
    // dark blues gain saturation, because each channel is pressed by its own amount). grade.toe (0..1) takes the toe
    // out below about 0.25, so that with toe = 1 a dark colour is shown as it was typed: for nights that must stay readable.
    vec3 curve(vec3 x) { vec3 t = mix(vec3(0.03), vec3(0.14), uToe * (1.0 - smoothstep(0.0, 0.25, x))); return (x * (2.51 * x + t)) / (x * (2.43 * x + 0.59) + 0.14); }
    vec3 tonemap(vec3 c) {
      float peak = max(max(c.r, c.g), max(c.b, 1e-5));
      vec3 hue = c / peak;
      vec3 a = curve(vec3(peak)) * hue;                 // hue-preserving
      vec3 b = curve(c);                                // per-channel (desaturates highlights)
      return clamp(mix(a, b, 0.55), 0.0, 1.0);
    }
    vec3 toSRGB(vec3 c) { return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
    #ifdef LIGHT
    // A phone's picture is drawn with fewer dots than its screen has and stretched to fit, and its edges are not
    // smoothed as they are drawn (that costs a phone too much). So the last pass smooths them here: where two tones
    // meet, the dot is taken along the edge and not across it (FXAA, the short form: nine looks at the picture); and
    // where nothing meets, the dot is set off a little from the four about it, which gives back some of what the
    // stretching takes. docs/build/phone.md.
    uniform vec2 uTexel; uniform float uSharp;
    vec3 look(vec2 uv) { vec3 c = texture2D(tDiffuse, uv).rgb; return mix(clamp(c, 0.0, 64.0), vec3(0.0), isnan(c)); }
    float tone(vec3 c) { float l = dot(c, vec3(0.299, 0.587, 0.114)) * uExposure; return l / (1.0 + l); }      // how light it will look, near enough
    vec3 clean(vec2 uv) {
      vec3 m = look(uv), nw = look(uv + vec2(-1.0, 1.0) * uTexel), ne = look(uv + vec2(1.0, 1.0) * uTexel), sw = look(uv + vec2(-1.0, -1.0) * uTexel), se = look(uv + vec2(1.0, -1.0) * uTexel);
      float lm = tone(m), lnw = tone(nw), lne = tone(ne), lsw = tone(sw), lse = tone(se);
      float lo = min(lm, min(min(lnw, lne), min(lsw, lse))), hi = max(lm, max(max(lnw, lne), max(lsw, lse)));
      float edge = smoothstep(0.035, 0.11, hi - lo);
      vec3 plain = m + (m - 0.25 * (nw + ne + sw + se)) * uSharp;
      if (edge <= 0.0) return max(plain, 0.0);
      vec2 dir = vec2(-((lnw + lne) - (lsw + lse)), (lnw + lsw) - (lne + lse));
      float least = 1.0 / (min(abs(dir.x), abs(dir.y)) + max((lnw + lne + lsw + lse) * 0.03125, 0.0078125));
      dir = clamp(dir * least, vec2(-8.0), vec2(8.0)) * uTexel;
      vec3 a = 0.5 * (look(uv + dir * (1.0 / 3.0 - 0.5)) + look(uv + dir * (2.0 / 3.0 - 0.5)));
      vec3 b = a * 0.5 + 0.25 * (look(uv - dir * 0.5) + look(uv + dir * 0.5));
      float lb = tone(b);
      return max(mix(plain, (lb < lo || lb > hi) ? a : b, edge), 0.0);
    }
    #endif
    void main() {
      #ifdef LIGHT
      vec3 col = clean(vUv) * uExposure * uTint;
      #else
      vec3 col = texture2D(tDiffuse, vUv).rgb;
      col = mix(clamp(col, 0.0, 64.0), vec3(0.0), isnan(col)) * uExposure * uTint;
      #endif
      col = tonemap(max(col, 0.0));
      float l = dot(col, vec3(0.2126, 0.7152, 0.0722));
      col = mix(vec3(l), col, uSaturation);
      col = (col - 0.5) * uContrast + 0.5;
      col = col + uLift * (1.0 - col);
      vec2 q = (vUv - 0.5) * vec2(uAspect / 1.78, 1.0);
      float v = smoothstep(0.35, 1.05, length(q) * 1.25);
      col *= 1.0 - v * uVignette;
      col = toSRGB(clamp(col, 0.0, 1.0));
      col = mix(col, uWash, uWashAmount);               // a realm's own wash (cloth over the eyes, a moment of blindness)
      // The veil between two areas (uVeil and uWash are already display-referred). It is mist, not a blank: it rolls
      // slowly, and whatever is within arm's reach of the rider (the boat, its lantern, the rower: all nearer than 3 m)
      // stays in the picture, so the rider is carried through it in their boat. (Until 9 November the whole picture
      // went to one flat colour at the thickest point, boat and all: it read as a loading screen.)
      if (uVeilAmount > 0.001) {
        float near = 0.0;
        if (uHasDepth > 0.5) {
          float d = texture2D(tDepth, vUv).r;
          float z = (uNear * uFar) / (uFar - d * (uFar - uNear));
          near = 1.0 - smoothstep(3.0, 4.0, z);
        }
        vec2 m = vUv * vec2(uAspect, 1.0);
        float roll = vn(m * 2.1 + vec2(uTime * 0.045, uTime * 0.012)) * 0.6 + vn(m * 5.3 - vec2(uTime * 0.07, uTime * 0.02)) * 0.4;
        col = mix(col, uVeil * (0.95 + 0.1 * roll), uVeilAmount * (1.0 - 0.92 * near));
      }
      // paper tooth: a still grain (fine tooth plus a soft mottle), so the picture sits on paper and does not fizz like film
      vec2 pp = vUv * vec2(uAspect, 1.0) * 1080.0;
      float n = (hash(floor(pp * 0.75)) - 0.5) * 0.7 + (vn(pp * 0.22) - 0.5) * 0.9 + (vn(pp * 0.035) - 0.5) * 0.6;
      col += n * uGrain * (0.45 + 0.55 * (1.0 - l));
      gl_FragColor = vec4(col, 1.0);
    }`,
};

// A painter's hand over the picture: a generalised Kuwahara filter flattens each small neighbourhood to the calmest
// of eight wedge-shaped samples around it, which turns polygon edges and smooth shading into soft, slightly
// irregular patches of flat colour, like opaque paint. The water is left untouched (it is the one wet thing in a
// matte world): a pixel is water when the ray through it meets the plane y = 0 in front of everything solid.
const PaintShader = {
  name: 'PaintShader',
  uniforms: {
    tDiffuse: { value: null }, tDepth: { value: null }, uTexel: { value: new THREE.Vector2(1 / 1600, 1 / 900) },
    uAmount: { value: 0 }, uRadius: { value: 4 }, uNear: { value: 0.08 }, uFar: { value: 1800 }, uHasDepth: { value: 0 },
    uProjInv: { value: new THREE.Matrix4() }, uCamWorld: { value: new THREE.Matrix4() }, uCamPos: { value: new THREE.Vector3() },
  },
  vertexShader: /* glsl */`varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse, tDepth; uniform vec2 uTexel; uniform float uAmount, uRadius, uNear, uFar, uHasDepth;
    uniform mat4 uProjInv, uCamWorld; uniform vec3 uCamPos;
    varying vec2 vUv;
    vec3 soft(vec3 c) { return c / (1.0 + max(max(c.r, c.g), c.b)); }
    vec3 sane(vec3 c) { return mix(min(c, vec3(64.0)), vec3(0.0), isnan(c)); }      // one bad pixel (not a number, or beyond the half-float range) must not grow to the size of the brush
    float hash(vec2 p) { p = fract(p * vec2(443.897, 441.423)); p += dot(p, p.yx + 19.19); return fract((p.x + p.y) * p.x); }
    #ifdef LITE
    const vec2 WEDGE[8] = vec2[8](vec2(1.0, 0.0), vec2(0.7071068, 0.7071068), vec2(0.0, 1.0), vec2(-0.7071068, 0.7071068), vec2(-1.0, 0.0), vec2(-0.7071068, -0.7071068), vec2(0.0, -1.0), vec2(0.7071068, -0.7071068));
    #endif
    float wet() {
      if (uHasDepth < 0.5) return 0.0;
      vec4 v = uProjInv * vec4(vUv * 2.0 - 1.0, 1.0, 1.0);
      vec3 dv = normalize(v.xyz / v.w);
      vec3 dw = (uCamWorld * vec4(dv, 0.0)).xyz;
      if (dw.y > -1e-4) return 0.0;
      float t = uCamPos.y / -dw.y;
      float zWater = t * -dv.z;
      float d = texture2D(tDepth, vUv).r;
      float zScene = (uNear * uFar) / (uFar - d * (uFar - uNear));          // perspective depth to distance along the view axis
      return smoothstep(0.0, 0.06, zScene - zWater);
    }
    void main() {
      vec4 t0 = texture2D(tDiffuse, vUv);
      vec3 c0 = sane(t0.rgb);
      // Water and lights stay crisp; so does whatever marked itself in the picture's alpha (thin things: lines, twigs,
      // small far creatures; gouache's "crisp" option writes -15 there). The mark is far below anything else that
      // lands in alpha (cut-outs write 0.5 to 1, everything else 1 or more), so the share of a pixel that a thin
      // thing covers can be read back after the samples are averaged: a line covering an eighth of a pixel keeps it.
      float keep = isnan(t0.a) ? 1.0 : 1.0 - clamp(max(0.5 - t0.a, 0.0) / 15.5 * 10.0, 0.0, 1.0);
      float amount = uAmount * (1.0 - wet()) * (1.0 - smoothstep(0.9, 1.8, max(max(c0.r, c0.g), c0.b))) * keep;
      if (amount < 0.01) { gl_FragColor = vec4(c0, 1.0); return; }
      float jitter = hash(vUv * 917.0) * 0.785;
      vec3 acc = vec3(0.0); float wsum = 0.0;
      vec3 s0 = soft(c0);
      #ifdef LITE
      // A phone's brush (docs/build/phone.md): the same eight wedges, each read at three places along its middle and
      // not at nine across it (25 looks at the picture where the full brush takes 73), and the eight directions are
      // one turn of a fixed set, so the sines and cosines of a dot are worked out once and not seventy-two times.
      // On a phone's picture the brush is under three dots across: nine looks to a wedge were falling on top of one another.
      mat2 turn = mat2(cos(jitter), sin(jitter), -sin(jitter), cos(jitter));
      vec2 reach = uRadius * uTexel / 3.0;
      for (int k = 0; k < 8; k++) {
        vec3 mean = c0 * 0.5, ms = s0 * 0.5, sq = s0 * s0 * 0.5; float n = 0.5;
        vec2 d = (turn * WEDGE[k]) * reach;
        for (int r = 1; r <= 3; r++) {
          vec3 c = sane(texture2D(tDiffuse, vUv + d * float(r)).rgb), l = soft(c);
          mean += c; ms += l; sq += l * l; n += 1.0;
        }
        mean /= n; ms /= n; sq /= n;
      #else
      for (int k = 0; k < 8; k++) {
        vec3 mean = c0 * 0.5, ms = s0 * 0.5, sq = s0 * s0 * 0.5; float n = 0.5;
        for (int r = 1; r <= 3; r++) for (int j = 0; j < 3; j++) {
          float ang = (float(k) + (float(j) - 1.0) * 0.34) * 0.7853982 + jitter;
          vec2 o = vec2(cos(ang), sin(ang)) * uRadius * (float(r) / 3.0) * uTexel;
          vec3 c = sane(texture2D(tDiffuse, vUv + o).rgb), l = soft(c);
          mean += c; ms += l; sq += l * l; n += 1.0;
        }
        mean /= n; ms /= n; sq /= n;
      #endif
        float var = dot(max(sq - ms * ms, 0.0), vec3(1.0));
        float w = 1.0 / (1.0 + pow(var * 2200.0, 4.0));
        acc += mean * w; wsum += w;
      }
      acc += c0 * 1e-3; wsum += 1e-3;                 // where every wedge round a pixel is busy all the weights vanish: the pixel keeps itself (it used to go black)
      gl_FragColor = vec4(mix(c0, acc / wsum, amount), 1.0);
    }`,
};

export class Post {
  constructor(renderer, scene, camera, { samples = 4, light = null } = {}) {      // light: the engine, for a phone's frame (LatePass)
    this.renderer = renderer; this.light = !!light;
    const size = renderer.getDrawingBufferSize(new THREE.Vector2());
    const target = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, samples, colorSpace: THREE.LinearSRGBColorSpace });
    this.composer = new EffectComposer(renderer, target);
    this.renderPass = light ? new LatePass(light) : new RenderPass(scene, camera);
    this.bloom = new UnrealBloomPass(new THREE.Vector2(size.x, size.y), 0.6, 0.7, 0.8);
    // one bad pixel (NaN, or beyond the half-float range) must not blank the frame through the blur
    const hp = this.bloom.materialHighPassFilter;
    hp.fragmentShader = hp.fragmentShader.replace('vec4 texel = texture2D( tDiffuse, vUv );',
      'vec4 texel = texture2D( tDiffuse, vUv ); texel.rgb = mix( clamp( texel.rgb, 0.0, 64.0 ), vec3( 0.0 ), isnan( texel.rgb ) ); texel.a = 1.0;');      // (alpha may carry the "crisp" mark when the painter's filter is off)
    hp.needsUpdate = true;
    this.paint = new ShaderPass(light ? { ...PaintShader, defines: { LITE: 1 } } : PaintShader); this.paint.enabled = false;
    this.final = new ShaderPass(light ? { ...FinalShader, defines: { LIGHT: 1 } } : FinalShader);
    this.composer.addPass(this.renderPass); this.composer.addPass(this.paint); this.composer.addPass(this.bloom); this.composer.addPass(this.final);
    this.camera = camera;
    this.u = this.final.uniforms;
  }
  setSize(w, h, pixelRatio) {
    this.composer.setPixelRatio(pixelRatio); this.composer.setSize(w, h);
    this.u.uAspect.value = w / Math.max(1, h);
    this.paint.uniforms.uTexel.value.set(1 / (w * pixelRatio), 1 / (h * pixelRatio));
    this.u.uTexel.value.set(1 / (w * pixelRatio), 1 / (h * pixelRatio));
    this.pixelHeight = h * pixelRatio;
  }
  /** Painterly filter: amount 0..1, radius in pixels at 1080 lines (it scales with the picture). depthTexture marks the water, which stays unfiltered. */
  setPaint(amount, radius = 4.5, depthTexture = null) {
    const u = this.paint.uniforms;
    this.paint.enabled = amount > 0.01;
    u.uAmount.value = amount; u.uRadius.value = radius * (this.pixelHeight || 1080) / 1080;
    u.tDepth.value = depthTexture; u.uHasDepth.value = depthTexture ? 1 : 0;
    this.u.tDepth.value = depthTexture; this.u.uHasDepth.value = depthTexture ? 1 : 0;      // (the veil reads it too)
  }
  /** look: {exposure, bloom:{strength,radius,threshold}, grade:{tint,saturation,contrast,lift,vignette,grain,toe}} — already blended by the realm manager */
  apply(look) {
    const u = this.u, g = look.grade;
    u.uExposure.value = look.exposure;
    u.uTint.value.copy(g.tint); u.uSaturation.value = g.saturation; u.uContrast.value = g.contrast; u.uLift.value.copy(g.lift);
    u.uVignette.value = g.vignette; u.uGrain.value = g.grain; u.uToe.value = Math.min(1, Math.max(0, this.forceToe ?? (g.toe || 0)));
    this.bloom.strength = look.bloom.strength; this.bloom.radius = look.bloom.radius; this.bloom.threshold = look.bloom.threshold;
  }
  setVeil(color, amount) { this.u.uVeil.value.copy(color).convertLinearToSRGB(); this.u.uVeilAmount.value = amount; }
  setWash(color, amount) { this.u.uWash.value.copy(color).convertLinearToSRGB(); this.u.uWashAmount.value = Math.min(1, Math.max(0, amount)); }
  render(time) {
    this.u.uTime.value = time;
    this.u.uNear.value = this.camera.near; this.u.uFar.value = this.camera.far;
    if (this.paint.enabled) {
      const u = this.paint.uniforms, cam = this.camera;
      u.uProjInv.value.copy(cam.projectionMatrixInverse); u.uCamWorld.value.copy(cam.matrixWorld); cam.getWorldPosition(u.uCamPos.value);
      u.uNear.value = cam.near; u.uFar.value = cam.far;
    }
    this.composer.render();
  }
}
