// The trace: a slow-fading texture anchored to the realm, not to the boat, so that a lane, a trail of light or a
// figure drawn in dye is still there when the rider looks back from a hundred metres. It is laid over the bounds of
// the realm's waterway (12.5 cm cells at high quality, never more than 2048 on a side) only when the realm's water
// asks for it, and freed when the realm is left.
//
// Four channels, read by the surface shader in water-final.js and by any realm material (WATER_GLSL there):
//   r, g   the two pigments of the dye film      (look.film)   carried, curled by the hull, relaxing to where they rest
//          (without a film g is standing open water: what a realm writes once as 'bare' stays, and the skin stands open there)
//   b      light that lingers where it was touched (look.touch)   or, under a dye film, the swirl that stirs the dye
//   a      how open the skin is: 1 = open water    (look.skin)    closing again from its edges
//
// Written by: the hull (a lane, a pair of vortices), the ripple field (light from touch), trace.inject / trace.line
// from the realm, any number a frame, batched into one draw, and trace.stamp: a whole picture in one draw.
//
// Without a dye film the trace is one 8-bit texture, faded in place by blending (no twin). With a dye film it is one
// half-float texture; only a small patch round the hull is advected each frame, through a small scratch target.
import * as THREE from 'three';

const MAX_INJECT = 512;                    // segments per frame, per kind of blending ...
const OWN_INJECT = 8;                      // ... and a few more places kept for what the hull itself writes, so that a flood from a realm cannot crowd it out
const ADD_BUDGET = 12000;                  // all that one frame may add to the dye film (pigment and swirl, as stored), so that the film can never grow past what its texture holds
const CAP = [128, 128, 4096, 128];         // and the most any cell of it may hold (pigments, swirl, lane): put right every time the film relaxes
const fin = (x) => typeof x === 'number' && Number.isFinite(x);
const PATCH = 256;                         // cells across the patch of dye that the hull stirs
const SIDE = { high: 2048, medium: 1536, low: 1024 };          // cells on the longer side of an 8-bit trace, at most
const SIDE_FLOAT = { high: 1536, medium: 1024, low: 768 };    // and of a half-float one (a dye film)
const CELL = { high: 0.125, medium: 0.1875, low: 0.25 };
const CHANNEL = { a: 0, b: 1, swirl: 2, glow: 2, lane: 3, bare: 1 };
// trace.stamp: which channels of the trace a picture is written into, and which kind of trace has them
const STAMP = { bare: { mask: [0, 1, 0, 0], float: false }, glow: { mask: [0, 0, 1, 0], float: false }, lane: { mask: [0, 0, 0, 1] }, film: { mask: [1, 1, 0, 0], float: true } };

// Where the dye film rests when nobody has stirred it: marbling in the river's own coordinates (stretched along the flow,
// drifting down it), each pigment keeping to its own side of the centre line. Shared by the trace and by the surface
// shader, which draws the same thing beyond the trace.
export const FILM_GLSL = /* glsl */`
  float filmHash(vec2 p) { p = fract(p * vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.y); }
  float filmNoise(vec2 p) {
    vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(filmHash(i), filmHash(i + vec2(1.0, 0.0)), f.x), mix(filmHash(i + vec2(0.0, 1.0)), filmHash(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  float filmFbm(vec2 p) { return 0.55 * filmNoise(p) + 0.3 * filmNoise(p * 2.07 + 11.3) + 0.15 * filmNoise(p * 4.3 + 5.1); }
  // film: amount, cover, split, 1 / scale.  sd: metres along the waterway, metres right of its centre line, half width
  vec2 filmRest(vec3 sd, vec4 film, float flow) {
    vec2 q = vec2(sd.y, (sd.x - flow) * 0.42) * film.w;                    // the river's own coordinates, stretched along the flow
    // folded twice, as marbling is: a slow wide fold, then a finer curl
    vec2 w1 = vec2(filmNoise(q * 0.45 + 1.7), filmNoise(q * 0.45 + vec2(9.2, 4.1))) - 0.5;
    vec2 qa = q + w1 * 2.4;
    vec2 w2 = vec2(filmNoise(qa * 1.6 + 3.3), filmNoise(qa * 1.6 + vec2(5.2, 1.3))) - 0.5;
    qa += w2 * 0.8;
    float a = filmFbm(qa), b = filmFbm(qa * 1.17 + vec2(13.7, 7.9));
    // threads (where the folded field crosses a level) and pools (where it stands high)
    float pool = mix(0.74, 0.4, film.y);
    float ta = 1.0 - smoothstep(0.0, 0.035 + 0.05 * film.y, abs(a - 0.36)), tb = 1.0 - smoothstep(0.0, 0.035 + 0.05 * film.y, abs(b - 0.36));
    float da = max(0.6 * ta, smoothstep(pool, pool + 0.13, a)), db = max(0.6 * tb, smoothstep(pool, pool + 0.13, b));
    // each pigment keeps to its own side of the centre line; the boundary wanders
    float side = sd.y / max(sd.z, 1.0) + (filmNoise(q * 0.3 + 21.0) - 0.5) * 0.9;
    float mineA = mix(1.0, smoothstep(0.22, -0.22, side), film.z), mineB = mix(1.0, smoothstep(-0.22, 0.22, side), film.z);
    return vec2(da * mineA, db * mineB);
  }
`;

const FULL_VERT = /* glsl */`
  precision highp float;
  in vec3 position;
  uniform vec4 uRect;                      // the trace in the world: centre x, z, size x, size z
  out vec2 vWorld;
  void main() { vWorld = uRect.xy + position.xy * 0.5 * uRect.zw; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;
const FADE_FRAG = /* glsl */`
  precision highp float;
  uniform vec4 uTake;                      // what to take away from every channel
  out vec4 oColor;
  void main() { oColor = uTake; }
`;
// the dye film relaxes toward where it rests (drawn with dst * constant + src)
const RELAX_FRAG = /* glsl */`
  precision highp float; precision highp sampler2D;
  uniform sampler2D tField; uniform vec4 uFieldRect, uFilm; uniform float uFlow, uGive;
  in vec2 vWorld; out vec4 oColor;
  ${FILM_GLSL}
  void main() {
    vec3 sd = textureLod(tField, clamp((vWorld - uFieldRect.xy) * uFieldRect.zw + 0.5, 0.0, 1.0), 0.0).rgb;
    oColor = vec4(filmRest(sd, uFilm, uFlow) * uGive, 0.0, 0.0);
  }
`;
// light from touch: the liveliness of the ripple field, laid into the trace wherever it is greater than what is there
const FEED_VERT = /* glsl */`
  precision highp float;
  in vec3 position;
  uniform vec4 uRect, uWin;                // uWin: the wide ripple window: centre x, z, size
  out vec2 vWorld;
  void main() { vWorld = uWin.xy + position.xy * 0.5 * uWin.z; gl_Position = vec4((vWorld - uRect.xy) / uRect.zw * 2.0, 0.0, 1.0); }
`;
const FEED_FRAG = /* glsl */`
  precision highp float; precision highp sampler2D;
  uniform sampler2D tWide, tFine; uniform vec4 uWin, uFineWin; uniform float uGain;
  in vec2 vWorld; out vec4 oColor;
  void main() {
    vec2 uv = (vWorld - uWin.xy) / uWin.z + 0.5, e = min(uv, 1.0 - uv);
    vec4 a = textureLod(tWide, uv, 0.0) * smoothstep(0.0, 0.08, min(e.x, e.y));
    // what counts as touched: churned water, and steep waves (squared, so that a shower of small rings does not flood the trace)
    float lively = a.w * a.w * 1.3 + 0.8 * a.z;
    vec2 fu = (vWorld - uFineWin.xy) / uFineWin.z + 0.5, fe = min(fu, 1.0 - fu);
    if (min(fe.x, fe.y) > 0.0) { vec4 f = textureLod(tFine, fu, 0.0) * smoothstep(0.0, 0.12, min(fe.x, fe.y)); lively = max(lively, f.w * f.w * 1.3 + 0.8 * f.z); }
    oColor = vec4(0.0, 0.0, clamp(lively * uGain, 0.0, 1.0), 0.0);
  }
`;
// trace.inject / trace.line: capsules, each writing one channel
const INJECT_VERT = /* glsl */`
  precision highp float;
  in vec3 position;
  in vec4 aSeg;                            // from x, z to x, z
  in vec4 aPar;                            // radius, soft share of it, strength, channel
  uniform vec4 uRect;
  out vec2 vWorld; out vec4 vSeg, vPar;
  void main() {
    vec2 d = aSeg.zw - aSeg.xy; float len = length(d);
    vec2 t = len > 1e-5 ? d / len : vec2(1.0, 0.0), n = vec2(-t.y, t.x);
    vWorld = mix(aSeg.xy, aSeg.zw, position.x * 0.5 + 0.5) + (t * position.x + n * position.y) * aPar.x;
    vSeg = aSeg; vPar = aPar;
    gl_Position = vec4((vWorld - uRect.xy) / uRect.zw * 2.0, 0.0, 1.0);
  }
`;
const INJECT_FRAG = /* glsl */`
  precision highp float;
  in vec2 vWorld; in vec4 vSeg, vPar; out vec4 oColor;
  void main() {
    vec2 ab = vSeg.zw - vSeg.xy, ap = vWorld - vSeg.xy;
    float d = length(ap - ab * clamp(dot(ap, ab) / max(dot(ab, ab), 1e-8), 0.0, 1.0));
    float v = vPar.z * (1.0 - smoothstep(vPar.x * (1.0 - vPar.y), vPar.x, d));
    int ch = int(vPar.w + 0.5);
    oColor = vec4(ch == 0 ? v : 0.0, ch == 1 ? v : 0.0, ch == 2 ? v : 0.0, ch == 3 ? v : 0.0);
  }
`;
// The dye is carried by the swirl the hull (or a creature) leaves: velocity = curl of the b channel. One patch round the
// boat, read with a 4 x 4 Catmull-Rom so that marbling stays crisp instead of blurring away.
const ADVECT_FRAG = /* glsl */`
  precision highp float; precision highp sampler2D;
  uniform sampler2D tTrace; uniform vec2 uOrigin, uMax; uniform vec4 uStep;     // uStep: seconds per cell, swirl kept, -, -
  out vec4 oColor;
  vec4 at(ivec2 i) { return texelFetch(tTrace, clamp(i, ivec2(0), ivec2(uMax)), 0); }
  vec4 w4(float f) { float f2 = f * f, f3 = f2 * f; return vec4(-0.5 * f3 + f2 - 0.5 * f, 1.5 * f3 - 2.5 * f2 + 1.0, -1.5 * f3 + 2.0 * f2 + 0.5 * f, 0.5 * f3 - 0.5 * f2); }
  void main() {
    ivec2 ti = ivec2(gl_FragCoord.xy) + ivec2(uOrigin);
    float pl = at(ti - ivec2(1, 0)).b, pr = at(ti + ivec2(1, 0)).b, pd = at(ti - ivec2(0, 1)).b, pu = at(ti + ivec2(0, 1)).b;
    vec2 vel = vec2(pu - pd, pl - pr) * 0.5;                    // cells of swirl per cell: (d/dz, -d/dx)
    vec2 src = vec2(ti) - clamp(vel * uStep.x, vec2(-3.0), vec2(3.0));
    vec2 base = floor(src), f = src - base; ivec2 b = ivec2(base);
    vec4 wx = w4(f.x), wy = w4(f.y), sum = vec4(0.0);
    for (int j = 0; j < 4; j++) for (int i = 0; i < 4; i++) sum += at(b + ivec2(i - 1, j - 1)) * (wx[i] * wy[j]);
    vec4 c00 = at(b), c10 = at(b + ivec2(1, 0)), c01 = at(b + ivec2(0, 1)), c11 = at(b + ivec2(1, 1));
    sum = clamp(sum, min(min(c00, c10), min(c01, c11)), max(max(c00, c10), max(c01, c11)));     // never more or less than what was there
    oColor = vec4(sum.rg, sum.b * uStep.y, sum.a);
  }
`;
// trace.stamp: a picture laid over part of the trace (drawn with dst * constant + src, so that it replaces what is there
// or brings it part of the way)
const STAMP_VERT = /* glsl */`
  precision highp float;
  in vec3 position;
  uniform vec4 uRect, uPic;                // the trace, and the picture, in the world: centre x, z, size x, size z
  out vec2 vUv;
  void main() { vUv = position.xy * 0.5 + 0.5; vec2 world = uPic.xy + position.xy * 0.5 * uPic.zw; gl_Position = vec4((world - uRect.xy) / uRect.zw * 2.0, 0.0, 1.0); }
`;
const STAMP_FRAG = /* glsl */`
  precision highp float; precision highp sampler2D;
  uniform sampler2D tPic; uniform vec4 uOut; uniform float uFlat, uTwo;      // uOut: what each channel of the trace takes of the picture (0 = that channel is left alone); uFlat: one value everywhere (below 0: read the picture); uTwo: 1 = the picture's green is a second value (a film's other pigment)
  in vec2 vUv; out vec4 oColor;
  void main() {
    vec4 pic = uFlat >= 0.0 ? vec4(uFlat) : texture(tPic, vUv);
    oColor = vec4(pic.r, uTwo > 0.5 ? pic.g : pic.r, pic.r, pic.r) * uOut;      // (one value, the picture's red, for a lane, light or standing water; red and green for the two pigments)
  }
`;
const COPY_FRAG = /* glsl */`
  precision highp float; precision highp sampler2D;
  uniform sampler2D tPatch; uniform vec2 uOrigin;
  out vec4 oColor;
  void main() { oColor = texelFetch(tPatch, ivec2(gl_FragCoord.xy) - ivec2(uOrigin), 0); }
`;

/** Flecks of paint for light from touch: each dab has its own threshold (r) and a soft shape (g). Tiles. */
export function makeFleckTexture(size = 512) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0, 0, size, size);
  let seed = 90217; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 1150; i++) {
    const x = rnd() * size, y = rnd() * size, big = Math.pow(rnd(), 2.4), r = 1.8 + big * 6.5, long = 1 + rnd() * 1.9, rot = (rnd() - 0.5) * 1.5 + (rnd() < 0.25 ? 1.2 : 0);
    const v = Math.round(255 * (0.1 + 0.9 * rnd()));
    for (let ox = -size; ox <= size; ox += size) for (let oy = -size; oy <= size; oy += size) {
      if (x + ox < -24 || x + ox > size + 24 || y + oy < -24 || y + oy > size + 24) continue;
      g.save(); g.translate(x + ox, y + oy); g.rotate(rot); g.scale(long, 1);
      const grad = g.createRadialGradient(0, 0, r * 0.45, 0, 0, r);
      grad.addColorStop(0, `rgba(${v},255,0,1)`); grad.addColorStop(1, `rgba(${v},255,0,0)`);
      g.fillStyle = grad; g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.fill(); g.restore();
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.NoColorSpace; t.anisotropy = 4;
  t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter; t.generateMipmaps = true;
  return t;
}

/** A stand-in picture for a skin whose realm supplies none: 'petal' = a crust of fallen petals, 'ice' = frosted skin ice. Tiles. */
export function makeSkinTexture(kind = 'petal', size = 512) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d');
  let seed = kind === 'ice' ? 4711 : 1213; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const wrap = (x, y, reach, draw) => { for (let ox = -size; ox <= size; ox += size) for (let oy = -size; oy <= size; oy += size) { if (x + ox < -reach || x + ox > size + reach || y + oy < -reach || y + oy > size + reach) continue; g.save(); g.translate(x + ox, y + oy); draw(); g.restore(); } };
  if (kind === 'ice') {
    g.fillStyle = '#d9dcec'; g.fillRect(0, 0, size, size);
    for (let i = 0; i < 260; i++) {                      // clouds of frost
      const x = rnd() * size, y = rnd() * size, r = 18 + rnd() * 60, tone = rnd() < 0.5 ? '255,255,255' : '176,182,214', a = 0.05 + rnd() * 0.12;
      wrap(x, y, r, () => { const gr = g.createRadialGradient(0, 0, 0, 0, 0, r); gr.addColorStop(0, `rgba(${tone},${a})`); gr.addColorStop(1, `rgba(${tone},0)`); g.fillStyle = gr; g.fillRect(-r, -r, 2 * r, 2 * r); });
    }
    g.lineCap = 'round';
    for (let i = 0; i < 900; i++) {                      // feathers
      const x = rnd() * size, y = rnd() * size, len = 5 + rnd() * 22, a = rnd() * Math.PI, w = 0.6 + rnd() * 1.2;
      wrap(x, y, len, () => { g.rotate(a); g.strokeStyle = `rgba(255,255,255,${0.1 + rnd() * 0.25})`; g.lineWidth = w; g.beginPath(); g.moveTo(-len / 2, 0); g.quadraticCurveTo(0, (rnd() - 0.5) * 6, len / 2, 0); g.stroke(); });
    }
  } else {
    g.clearRect(0, 0, size, size);
    const tones = ['#f6e9ee', '#efd6df', '#fff7f4', '#e2c3d0', '#f3dde6', '#ecd0dc'];
    for (let i = 0; i < 3400; i++) {
      const x = rnd() * size, y = rnd() * size, rx = 4.2 + rnd() * 3.6, ry = rx * (0.55 + rnd() * 0.25), a = rnd() * Math.PI, tone = tones[Math.floor(rnd() * tones.length)];
      wrap(x, y, 10, () => {
        g.rotate(a);
        g.fillStyle = 'rgba(60,40,70,0.35)'; g.beginPath(); g.ellipse(0.8, 0.9, rx, ry, 0, 0, Math.PI * 2); g.fill();       // the petal beneath, in shadow
        g.fillStyle = tone; g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); g.fill();
        g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.ellipse(-rx * 0.2, -ry * 0.2, rx * 0.5, ry * 0.45, 0, 0, Math.PI * 2); g.fill();
      });
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter; t.generateMipmaps = true;
  return t;
}

export class Trace {
  constructor(renderer, { level = 'high', aniso = 8 } = {}) {
    this.renderer = renderer; this.aniso = aniso;
    this.maxSide = SIDE[level] || 2048; this.maxSideFloat = SIDE_FLOAT[level] || 1536; this.minCell = CELL[level] || 0.125;
    this.active = false; this.float = false; this.path = null; this.target = null; this.width = 0; this.height = 0; this.cell = 0.125;
    this.rect = new THREE.Vector4(0, 0, 1, 1);          // centre x, z, size x, size z
    this.fieldRect = new THREE.Vector4(0, 0, 1, 1);     // centre x, z, 1 / size x, 1 / size z
    this.field = null; this.flowOffset = 0; this.film = null;
    this.line0 = new THREE.Vector4(0, 0, 0, -1); this.halfWidth = 16;      // the waterway as one straight line, for the film beyond the trace: a point on it, its direction
    this.debt = [0, 0, 0, 0]; this.sinceRelax = 0; this.frame = 0; this.shedRun = 0; this.shedSide = 1;
    this.gpu = null; this.addSum = 0;
    this.addData = new Float32Array((MAX_INJECT + OWN_INJECT) * 8); this.maxData = new Float32Array((MAX_INJECT + OWN_INJECT) * 8); this.addCount = 0; this.maxCount = 0;
  }

  get texture() { return this.target ? this.target.texture : null; }

  /** Everything that needs the GPU, made the first time a trace is laid. */
  init() {
    if (this.gpu) return this.gpu;
    const raw = { glslVersion: THREE.GLSL3, depthTest: false, depthWrite: false, transparent: true };
    const tri = new THREE.BufferGeometry();
    tri.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
    const quadPos = new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]);
    const quad = new THREE.BufferGeometry(); quad.setAttribute('position', new THREE.BufferAttribute(quadPos, 3)); quad.setIndex([0, 1, 2, 0, 2, 3]);
    const inst = (data) => {
      const geo = new THREE.InstancedBufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(quadPos, 3)); geo.setIndex([0, 1, 2, 0, 2, 3]);
      const ib = new THREE.InstancedInterleavedBuffer(data, 8); ib.setUsage(THREE.DynamicDrawUsage);
      geo.setAttribute('aSeg', new THREE.InterleavedBufferAttribute(ib, 4, 0)); geo.setAttribute('aPar', new THREE.InterleavedBufferAttribute(ib, 4, 4));
      geo.instanceCount = 0;
      return { geo, ib };
    };
    const rect = { value: this.rect };
    const custom = (eq, src, dst, more = {}) => ({ blending: THREE.CustomBlending, blendEquation: eq, blendSrc: src, blendDst: dst, blendEquationAlpha: eq, blendSrcAlpha: src, blendDstAlpha: dst, ...more });
    const one = THREE.OneFactor;
    const fade = new THREE.RawShaderMaterial({ ...raw, vertexShader: FULL_VERT, fragmentShader: FADE_FRAG, uniforms: { uRect: rect, uTake: { value: new THREE.Vector4() } }, ...custom(THREE.ReverseSubtractEquation, one, one) });
    const relax = new THREE.RawShaderMaterial({
      ...raw, vertexShader: FULL_VERT, fragmentShader: RELAX_FRAG,
      uniforms: { uRect: rect, tField: { value: null }, uFieldRect: { value: this.fieldRect }, uFilm: { value: new THREE.Vector4(1, 0.75, 1, 1 / 7) }, uFlow: { value: 0 }, uGive: { value: 1 } },
      blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: one, blendDst: THREE.ConstantColorFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: one,
    });
    const feed = new THREE.RawShaderMaterial({
      ...raw, vertexShader: FEED_VERT, fragmentShader: FEED_FRAG,
      uniforms: { uRect: rect, uWin: { value: new THREE.Vector4(0, 0, 64, 0) }, uFineWin: { value: new THREE.Vector4(0, 0, 16, 0) }, tWide: { value: null }, tFine: { value: null }, uGain: { value: 1 } },
      ...custom(THREE.MaxEquation, one, one),
    });
    // (the dye film, a half-float texture that things add to, is held within bounds by two passes that only compare: least and greatest)
    const capHi = new THREE.RawShaderMaterial({ ...raw, vertexShader: FULL_VERT, fragmentShader: FADE_FRAG, uniforms: { uRect: rect, uTake: { value: new THREE.Vector4(...CAP) } }, ...custom(THREE.MinEquation, one, one) });
    const capLo = new THREE.RawShaderMaterial({ ...raw, vertexShader: FULL_VERT, fragmentShader: FADE_FRAG, uniforms: { uRect: rect, uTake: { value: new THREE.Vector4(...CAP).multiplyScalar(-1) } }, ...custom(THREE.MaxEquation, one, one) });
    const injectMax = new THREE.RawShaderMaterial({ ...raw, vertexShader: INJECT_VERT, fragmentShader: INJECT_FRAG, uniforms: { uRect: rect }, ...custom(THREE.MaxEquation, one, one) });
    const injectAdd = new THREE.RawShaderMaterial({ ...raw, vertexShader: INJECT_VERT, fragmentShader: INJECT_FRAG, uniforms: { uRect: rect }, ...custom(THREE.AddEquation, one, one) });
    const advect = new THREE.RawShaderMaterial({ ...raw, transparent: false, blending: THREE.NoBlending, vertexShader: FULL_VERT, fragmentShader: ADVECT_FRAG, uniforms: { uRect: rect, tTrace: { value: null }, uOrigin: { value: new THREE.Vector2() }, uMax: { value: new THREE.Vector2() }, uStep: { value: new THREE.Vector4() } } });
    const copy = new THREE.RawShaderMaterial({ ...raw, transparent: false, blending: THREE.NoBlending, vertexShader: FULL_VERT, fragmentShader: COPY_FRAG, uniforms: { uRect: rect, tPatch: { value: null }, uOrigin: { value: new THREE.Vector2() } } });
    const stamp = new THREE.RawShaderMaterial({
      ...raw, vertexShader: STAMP_VERT, fragmentShader: STAMP_FRAG, uniforms: { uRect: rect, uPic: { value: new THREE.Vector4(0, 0, 1, 1) }, tPic: { value: null }, uOut: { value: new THREE.Vector4() }, uFlat: { value: -1 }, uTwo: { value: 0 } },
      blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: one, blendDst: THREE.ConstantColorFactor, blendEquationAlpha: THREE.AddEquation, blendSrcAlpha: one, blendDstAlpha: THREE.ConstantAlphaFactor,
    });
    const mesh = (geo, mat, order) => { const m = new THREE.Mesh(geo, mat); m.frustumCulled = false; m.renderOrder = order; return m; };
    const scene = new THREE.Scene(), pass = new THREE.Scene(), stampScene = new THREE.Scene();
    const add = inst(this.addData), max = inst(this.maxData);
    const g = this.gpu = {
      tri, quad, fade, relax, feed, injectMax, injectAdd, advect, copy, capHi, capLo, stamp, scene, pass, stampScene, camera: new THREE.Camera(), add, max,
      fadeMesh: mesh(tri, fade, 0), feedMesh: mesh(quad, feed, 1), maxMesh: mesh(max.geo, injectMax, 2), addMesh: mesh(add.geo, injectAdd, 3), capLoMesh: mesh(tri, capLo, 4), capHiMesh: mesh(tri, capHi, 5), passMesh: mesh(tri, advect, 0),
      patch: null,
    };
    g.capLoMesh.visible = g.capHiMesh.visible = false;
    scene.add(g.fadeMesh, g.feedMesh, g.maxMesh, g.addMesh, g.capLoMesh, g.capHiMesh); pass.add(g.passMesh); stampScene.add(mesh(quad, stamp, 0));
    return g;
  }

  /**
   * Lay the trace over a waterway: its bounds plus `margin` metres, `texel` metres to a cell (no finer than the quality
   * allows, and never more than the quality's limit of cells on a side). float: a dye film lives here (half float).
   */
  lay(path, { texel = 0.125, margin = 14, float = false, film = null } = {}) {
    if (!path) return;
    if (float && !(this.renderer.extensions.has('EXT_color_buffer_float') || this.renderer.extensions.has('EXT_color_buffer_half_float'))) return;      // no float targets: no dye film
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
    const grow = (x, z, r) => { x0 = Math.min(x0, x - r); x1 = Math.max(x1, x + r); z0 = Math.min(z0, z - r); z1 = Math.max(z1, z + r); };
    if (path.count && path.x && path.hw) for (let i = 0; i < path.count; i += 2) grow(path.x[i], path.z[i], path.hw[i] + margin);
    else for (let s = 0; s <= path.length; s += 2) { const p = path.at(s); grow(p.x, p.z, p.halfWidth + margin); }
    if (!(x1 > x0) || !(z1 > z0)) return;
    const side = float ? this.maxSideFloat : this.maxSide;
    const cell = Math.max(this.minCell, texel, (x1 - x0) / side, (z1 - z0) / side);
    const w = Math.max(8, Math.ceil((x1 - x0) / cell / 4) * 4), h = Math.max(8, Math.ceil((z1 - z0) / cell / 4) * 4);
    const g = this.init();
    if (!this.target || this.width !== w || this.height !== h || this.float !== float) {
      if (this.target) this.target.dispose();
      this.target = new THREE.WebGLRenderTarget(w, h, {
        type: float ? THREE.HalfFloatType : THREE.UnsignedByteType, format: THREE.RGBAFormat, colorSpace: THREE.NoColorSpace, depthBuffer: false, stencilBuffer: false,
        generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter,
      });
      this.target.texture.anisotropy = Math.min(8, this.aniso);
      this.target.texture.mipmapsAutoUpdate = false;
    }
    this.width = w; this.height = h; this.float = float; this.cell = cell; this.path = path;
    {
      const a = path.at(0), b = path.at(path.length), m = path.at(path.length / 2), dx = b.x - a.x, dz = b.z - a.z, l = Math.hypot(dx, dz) || 1;
      this.line0.set(a.x, a.z, dx / l, dz / l); this.halfWidth = m.halfWidth;
    }
    this.rect.set((x0 + x1) / 2, (z0 + z1) / 2, w * cell, h * cell);
    if (float && !g.patch) g.patch = new THREE.WebGLRenderTarget(PATCH, PATCH, { type: THREE.HalfFloatType, format: THREE.RGBAFormat, colorSpace: THREE.NoColorSpace, depthBuffer: false, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, generateMipmaps: false });
    if (float) this.layField(path); else if (this.field) { this.field.dispose(); this.field = null; }      // (the waterway's own coordinates: only the dye film reads them)
    this.active = true; this.film = film;
    this.clear();
  }

  /** The waterway's own coordinates over the trace, for the dye film: metres along it, metres right of its centre line, half width. */
  layField(path) {
    if (this.field) { this.field.dispose(); this.field = null; }
    if (!path.locate) return;
    const step = Math.max(2, this.rect.z / 200, this.rect.w / 200), nx = Math.max(2, Math.ceil(this.rect.z / step) + 1), nz = Math.max(2, Math.ceil(this.rect.w / step) + 1);
    const data = new Uint16Array(nx * nz * 4), half = THREE.DataUtils.toHalfFloat, out = {};
    const xa = this.rect.x - (nx - 1) * step / 2, za = this.rect.y - (nz - 1) * step / 2;
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      path.locate(xa + i * step, za + j * step, null, out);
      const o = (j * nx + i) * 4;
      data[o] = half(out.s); data[o + 1] = half(out.d); data[o + 2] = half(out.halfWidth); data[o + 3] = half(1);
    }
    const t = this.field = new THREE.DataTexture(data, nx, nz, THREE.RGBAFormat, THREE.HalfFloatType);
    t.minFilter = t.magFilter = THREE.LinearFilter; t.generateMipmaps = false; t.colorSpace = THREE.NoColorSpace; t.needsUpdate = true;
    this.fieldRect.set(this.rect.x, this.rect.y, 1 / (nx * step), 1 / (nz * step));        // cell centres at the nodes
  }

  /** Nothing has happened here yet: empty (or, under a dye film, the film at rest). */
  clear() {
    if (!this.active) return;
    const r = this.renderer, g = this.gpu, prev = r.getRenderTarget(), auto = r.autoClear, cc = r.getClearColor(new THREE.Color()), ca = r.getClearAlpha();
    this.target.texture.mipmapsAutoUpdate = true;
    r.setRenderTarget(this.target); r.setClearColor(0x000000, 0); r.clear(true, false, false); r.setClearColor(cc, ca);
    r.autoClear = false;
    if (this.float && this.film) {
      this.setFilm(this.film);
      g.relax.blendColor.setRGB(0, 0, 0); g.relax.uniforms.uGive.value = 1;
      g.fadeMesh.material = g.relax; g.fadeMesh.visible = true; g.feedMesh.visible = g.maxMesh.visible = g.addMesh.visible = g.capLoMesh.visible = g.capHiMesh.visible = false;
      r.render(g.scene, g.camera);
    } else { g.fadeMesh.visible = g.feedMesh.visible = g.maxMesh.visible = g.addMesh.visible = g.capLoMesh.visible = g.capHiMesh.visible = false; r.render(g.scene, g.camera); }      // (nothing is drawn: the pass is there to rebuild the mipmaps of the emptied texture)
    this.target.texture.mipmapsAutoUpdate = false;
    r.setRenderTarget(prev); r.autoClear = auto;
    this.debt.fill(0); this.sinceRelax = 0; this.addCount = this.maxCount = 0; this.addSum = 0;
  }

  setFilm(film) {
    const u = this.gpu.relax.uniforms;
    u.tField.value = this.field; u.uFlow.value = this.flowOffset;
    u.uFilm.value.set(1, Math.min(1, Math.max(0, film.cover ?? 0.75)), Math.min(1, Math.max(0, film.split ?? 1)), 1 / Math.max(0.5, film.scale ?? 7));
  }

  /** Free the texture: this realm has no trace. */
  release() {
    if (this.target) { this.target.dispose(); this.target = null; }
    if (this.field) { this.field.dispose(); this.field = null; }
    this.active = false; this.path = null; this.width = this.height = 0; this.addCount = this.maxCount = 0;
  }

  /**
   * Write into the trace at a world position. channel: 'lane' (opens the skin), 'glow' (light from touch), 'a' / 'b' (the
   * two pigments of the dye film), 'swirl' (stirs the dye: positive turns it one way, negative the other), 'bare'
   * (water a skin leaves open for good: it reads as a lane that never closes; nothing under a dye film).
   * radius in metres, strength 0..1 (lane, glow and bare keep the greater of what is there and what you write; pigments
   * and swirl add up), soft: the share of the radius that is soft edge.
   */
  inject(x, z, opts) { this.line(x, z, x, z, opts); }

  /**
   * The same along a line from (x0, z0) to (x1, z1): a lane, a trail, a thread of dye.
   * (own: written by the water itself, which has places kept for it however many lines a realm has asked for.)
   */
  line(x0, z0, x1, z1, opts, own = false) {
    if (!this.active) return;
    const { channel = 'lane', radius = 0.5, strength = 1, soft = 0.6 } = opts || {};
    const ch = CHANNEL[channel];
    if (ch === undefined || !(radius > 0) || !fin(x0 + z0 + x1 + z1 + strength)) return;
    const bare = channel === 'bare';
    if (bare && this.float) return;                           // (under a dye film the second channel is a pigment: stamp the film itself instead)
    const adds = !bare && (ch < 2 || channel === 'swirl');
    if (adds && channel === 'swirl' && !this.float) return;
    const n = adds ? this.addCount : this.maxCount;
    if (n >= (own ? MAX_INJECT + OWN_INJECT : MAX_INJECT)) return;
    const d = adds ? this.addData : this.maxData, o = n * 8;
    // (the swirl is kept in cells, so that the patch which carries the dye needs no division)
    const v = Math.max(-1000, Math.min(1000, channel === 'swirl' ? strength / (this.cell * this.cell) : strength));
    if (adds && (this.addSum += Math.abs(v)) > ADD_BUDGET && !own) return;      // (a runaway caller: see ADD_BUDGET)
    d[o] = x0; d[o + 1] = z0; d[o + 2] = x1; d[o + 3] = z1; d[o + 4] = Math.min(radius, 1000); d[o + 5] = soft >= 0.02 ? Math.min(1, soft) : soft < 0.02 ? 0.02 : 0.6;
    d[o + 6] = v; d[o + 7] = ch;
    if (adds) this.addCount++; else this.maxCount++;
  }

  /**
   * Lay a whole picture into the trace in one draw: the standing map of a skin's open water, a film's figures, lanes or
   * light that were there before the rider came. picture: a THREE.Texture, or a number (that value everywhere).
   * channel: 'bare' (standing open water in a skin), 'lane', 'glow' (each takes the picture's red), or 'film' (its red
   * and green are the two pigments). x, z, width, depth: where the picture lies in the realm, centre and size in metres
   * (left out: over the whole trace); u runs along x and v along z. give: 1 = the picture replaces what is there, less =
   * what is there is brought that far toward it (a film coming back to its figure). blend: 'max' keeps the greater of
   * what is there and the picture instead (several pictures, or pictures and lines, of one standing water; not under a
   * dye film). gain multiplies the picture. Returns false if nothing was written (no trace, or a channel this kind of
   * trace does not have). Call it from water.onBind or from update, like every other writing; what trace.line wrote in
   * the same frame is laid after it.
   */
  stamp(picture, opts) {
    if (!this.active || !this.target) return false;
    const { channel = 'bare', x = this.rect.x, z = this.rect.y, width = this.rect.z, depth = this.rect.w, give = 1, gain = 1, blend = 'mix' } = opts || {};
    const S = STAMP[channel], tex = picture && picture.isTexture ? picture : null;
    if (!S || (S.float !== undefined && S.float !== this.float) || !(tex || fin(picture)) || !fin(x + z + width + depth + give + gain) || !(width > 0) || !(depth > 0)) return false;
    const greater = blend === 'max' && !this.float;            // (every channel of an 8-bit trace is nought or more, so a channel that is left alone may be compared with nought)
    const k = greater ? 1 : Math.min(1, Math.max(0, give)), amount = Math.min(1000, Math.max(-1000, gain)) * k, m = S.mask;
    const r = this.renderer, g = this.init(), M = g.stamp, u = M.uniforms, prev = r.getRenderTarget(), auto = r.autoClear, xr = r.xr.enabled;
    u.tPic.value = tex; u.uFlat.value = tex ? -1 : Math.min(1000, Math.max(0, picture)); u.uTwo.value = channel === 'film' ? 1 : 0;
    u.uPic.value.set(x, z, width, depth); u.uOut.value.set(m[0] * amount, m[1] * amount, m[2] * amount, m[3] * amount);
    M.blendEquation = M.blendEquationAlpha = greater ? THREE.MaxEquation : THREE.AddEquation;
    M.blendDst = greater ? THREE.OneFactor : THREE.ConstantColorFactor; M.blendDstAlpha = greater ? THREE.OneFactor : THREE.ConstantAlphaFactor;
    M.blendColor.setRGB(1 - m[0] * k, 1 - m[1] * k, 1 - m[2] * k); M.blendAlpha = 1 - m[3] * k;
    r.autoClear = false; r.xr.enabled = false;
    r.setRenderTarget(this.target); r.render(g.stampScene, g.camera);
    r.setRenderTarget(prev); r.autoClear = auto; r.xr.enabled = xr;
    u.tPic.value = null;                                      // (the picture is the realm's: nothing here keeps hold of it)
    return true;
  }

  /**
   * Once a frame. o: { boat, sim (the ripple field), hull: { bow, stern, half }, film, skin, touch, feed, time }.
   * (feed: the trace keeps the lingering light of the living water even though the look draws none: look.trace.lay.)
   */
  update(dt, o) {
    if (!this.active || !(dt > 0) || !o.boat || !fin(o.boat.x) || !fin(o.boat.z) || !fin(o.boat.heading)) return;
    const r = this.renderer, g = this.gpu, boat = o.boat, hull = o.hull;
    const film = o.film, skin = o.skin, touch = o.touch;
    const filmOn = this.float && film && film.amount > 0, skinOn = skin && skin.amount > 0, touchOn = touch && (touch.amount > 0 || o.feed === true) && !this.float;
    const fx = -Math.sin(boat.heading), fz = -Math.cos(boat.heading), rx = Math.cos(boat.heading), rz = -Math.sin(boat.heading);
    const speed = fin(boat.speed) ? boat.speed : 0;
    this.frame++;

    // --- what the hull writes
    if (skinOn) {
      const half = hull.half + 0.12 + Math.max(0, skin.width || 0), lead = Math.max(0, skin.lead || 0);
      const sx = boat.x + fx * (hull.stern + half * 0.4), sz = boat.z + fz * (hull.stern + half * 0.4), bx = boat.x + fx * (hull.bow - half * 0.5), bz = boat.z + fz * (hull.bow - half * 0.5);
      this.line(sx, sz, bx, bz, { channel: 'lane', radius: half + 0.25, strength: 1, soft: 0.55 }, true);
      if (lead > 0) this.line(boat.x + fx * hull.bow, boat.z + fz * hull.bow, boat.x + fx * (hull.bow + lead), boat.z + fz * (hull.bow + lead), { channel: 'lane', radius: 0.9 + 0.5 * lead, strength: 0.42, soft: 0.95 }, true);
    }
    if (filmOn && speed > 0.05) {
      // A pair of vortices trails from the stern (between them the water is drawn along after the hull), and every metre
      // or so one of them is shed, left and right in turn: a street of eddies that folds the dye into marbled figures.
      const amount = Math.max(0, film.stir ?? 1), stir = amount * Math.min(speed, 5) * 0.3 * dt;
      const ax = boat.x + fx * (hull.stern + 0.25), az = boat.z + fz * (hull.stern + 0.25), off = hull.half + 0.08;
      this.line(ax + rx * off, az + rz * off, ax + rx * off, az + rz * off, { channel: 'swirl', radius: 0.62, strength: stir, soft: 1 }, true);
      this.line(ax - rx * off, az - rz * off, ax - rx * off, az - rz * off, { channel: 'swirl', radius: 0.62, strength: -stir, soft: 1 }, true);
      this.shedRun += speed * dt;
      if (this.shedRun > 1.7) {
        this.shedRun = 0; this.shedSide = -this.shedSide;
        const s = this.shedSide, ex = ax - fx * 0.4 + rx * s * 0.55, ez = az - fz * 0.4 + rz * s * 0.55;
        this.line(ex, ez, ex, ez, { channel: 'swirl', radius: 1.3, strength: s * amount * 1.5 * Math.min(1, speed / 2.5), soft: 1 }, true);
      }
    }

    const prev = r.getRenderTarget(), auto = r.autoClear, tex = this.target.texture;
    r.autoClear = false;
    tex.mipmapsAutoUpdate = false;

    // --- the dye is carried by its swirl, in a patch round the hull
    if (filmOn) {
      this.flowOffset += dt * (film.flow ?? 0.08);
      const pw = Math.min(PATCH, this.width), ph = Math.min(PATCH, this.height);
      const cx = (boat.x - (this.rect.x - this.rect.z / 2)) / this.cell, cz = (boat.z - (this.rect.y - this.rect.w / 2)) / this.cell;
      const ox = Math.min(this.width - pw, Math.max(0, Math.round(cx - pw / 2))), oz = Math.min(this.height - ph, Math.max(0, Math.round(cz - ph / 2)));
      if (cx > -pw && cx < this.width + pw && cz > -ph && cz < this.height + ph) {
        const au = g.advect.uniforms;
        au.tTrace.value = tex; au.uOrigin.value.set(ox, oz); au.uMax.value.set(this.width - 1, this.height - 1); au.uStep.value.set(dt, Math.exp(-dt / 3.0), 0, 0);
        g.passMesh.material = g.advect;
        g.patch.viewport.set(0, 0, pw, ph); g.patch.scissor.set(0, 0, pw, ph); g.patch.scissorTest = true;
        r.setRenderTarget(g.patch); r.render(g.pass, g.camera);
        g.copy.uniforms.tPatch.value = g.patch.texture; g.copy.uniforms.uOrigin.value.set(ox, oz);
        g.passMesh.material = g.copy;
        this.target.viewport.set(ox, oz, pw, ph); this.target.scissor.set(ox, oz, pw, ph); this.target.scissorTest = true;
        r.setRenderTarget(this.target); r.render(g.pass, g.camera);
        this.target.viewport.set(0, 0, this.width, this.height); this.target.scissor.set(0, 0, this.width, this.height); this.target.scissorTest = false;
      }
    }

    // --- fading, feeding and writing, in one draw of the whole trace
    let fadeNow = false;
    if (this.float) {
      this.sinceRelax += dt;
      if (filmOn && this.frame % 4 === 0) {
        const k = Math.exp(-this.sinceRelax / Math.max(2, film.life ?? 60));
        this.setFilm(film);
        g.relax.blendColor.setRGB(k, k, Math.exp(-this.sinceRelax / 6)); g.relax.uniforms.uGive.value = 1 - k;
        g.fadeMesh.material = g.relax; fadeNow = true; this.sinceRelax = 0;
      }
    } else {
      // linear fading, a whole number of 8-bit steps at a time: a lane narrows from its edges and closes, light goes out fleck by fleck
      const rate = [0, 0, touchOn ? 1 / Math.max(0.2, touch.hold ?? 4) : 0.5, skinOn ? 0.65 / Math.max(0.5, skin.close ?? 25) : 0.2];
      const take = g.fade.uniforms.uTake.value; let any = false;
      for (let i = 0; i < 4; i++) { this.debt[i] += rate[i] * dt * 255; const n = Math.floor(this.debt[i]); this.debt[i] -= n; take.setComponent(i, n / 255); if (n > 0) any = true; }
      if (any) { g.fadeMesh.material = g.fade; fadeNow = true; }
    }
    g.fadeMesh.visible = fadeNow;
    g.capLoMesh.visible = g.capHiMesh.visible = this.float && fadeNow;
    g.feedMesh.visible = !!touchOn;
    if (touchOn) {
      const fu = g.feed.uniforms, sim = o.sim;
      fu.uWin.value.set(sim.wide.win.x, sim.wide.win.y, sim.wide.size, 0); fu.uFineWin.value.set(sim.fine.win.x, sim.fine.win.y, sim.fine.size, 0);
      fu.tWide.value = sim.auxWide; fu.tFine.value = sim.auxFine; fu.uGain.value = touch.wake ?? 1;
    }
    for (const [mesh, set, count] of [[g.maxMesh, g.max, this.maxCount], [g.addMesh, g.add, this.addCount]]) {
      mesh.visible = count > 0;
      if (count > 0) { set.ib.clearUpdateRanges(); set.ib.addUpdateRange(0, count * 8); set.ib.needsUpdate = true; set.geo.instanceCount = count; }
    }
    tex.mipmapsAutoUpdate = true;
    r.setRenderTarget(this.target); r.render(g.scene, g.camera);
    tex.mipmapsAutoUpdate = false;
    this.addCount = this.maxCount = 0; this.addSum = 0;
    r.setRenderTarget(prev); r.autoClear = auto;
  }

  memory() { return this.width * this.height * (this.float ? 8 : 4) * 1.34 + (this.float ? PATCH * PATCH * 8 : 0); }

  dispose() {
    this.release();
    const g = this.gpu; if (!g) return;
    for (const m of [g.fade, g.relax, g.feed, g.injectMax, g.injectAdd, g.advect, g.copy, g.capHi, g.capLo, g.stamp]) m.dispose();
    g.tri.dispose(); g.quad.dispose(); g.add.geo.dispose(); g.max.geo.dispose();
    if (g.patch) g.patch.dispose();
    this.gpu = null;
  }
}
