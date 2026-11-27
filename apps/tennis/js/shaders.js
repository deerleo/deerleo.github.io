// Every shader. They're kept small on purpose: Windows compiles big ones slowly.
//
// The picture is drawn into a buffer whose alpha isn't see-through: it's how much that pixel glows, and the
// bloom is made from it.

const HEAD = `#version 300 es
precision highp float;
`;

// The four skies, and the floor as a mirror ball sees it.
const SKY = `
uniform float uTime;
uniform vec4 uSky;          // how much of each: night, tunnel, plasma, trip
uniform vec4 uTripA;        // the Julia set's c, then the point we're falling into
uniform vec4 uTripB;        // how far in and how far round (one complex number), where the colours have got to, how bright
uniform float uBass;
uniform vec4 uFloor;        // its height, how much of it there is, how far it has scrolled, the size of a square
uniform vec3 uFloorA;
uniform vec3 uFloorB;
uniform vec3 uFog;

float hash1(float n) { return fract(sin(n) * 43758.5453); }
float hash2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

// A dusk in hard bands, like an Amiga's copper list, with a huge moon over the far end.
vec3 skyNight(vec3 d) {
    float t = clamp(d.y * 1.5 + 0.02, 0.0, 1.0);
    float band = floor(t * 30.0 + 0.5) / 30.0;
    vec3 c = mix(vec3(1.0, 0.42, 0.2), vec3(0.62, 0.08, 0.5), smoothstep(0.0, 0.16, band));
    c = mix(c, vec3(0.12, 0.03, 0.3), smoothstep(0.1, 0.42, band));
    c = mix(c, vec3(0.01, 0.01, 0.06), smoothstep(0.35, 1.0, band));
    float md = dot(d, normalize(vec3(1.0, 0.3, 0.0)));
    float disc = smoothstep(0.9735, 0.975, md);
    vec3 moon = mix(vec3(1.0, 0.55, 0.5), vec3(1.0, 0.97, 0.85), smoothstep(0.12, 0.42, d.y));
    c += vec3(0.6, 0.2, 0.45) * pow(max(md, 0.0), 20.0) * 0.6;
    vec2 g = vec2(atan(d.z, d.x), asin(clamp(d.y, -1.0, 1.0))) * 46.0;
    float h = hash2(floor(g));
    float star = step(0.975, h) * smoothstep(0.3, 0.0, length(fract(g) - 0.5)) * (0.6 + 0.4 * sin(uTime * 3.0 + h * 90.0));
    c += star * smoothstep(0.08, 0.45, d.y);
    return mix(c, moon, disc);
}

// Flat out down a tunnel: black, with the light at the end and streaks flying out of it.
vec3 skyTunnel(vec3 d) {
    float f = max(d.x, 0.0);
    vec3 c = vec3(0.0, 0.012, 0.035);
    c += vec3(0.3, 0.9, 1.0) * pow(f, 60.0) * 1.4 + vec3(1.0) * pow(f, 500.0);
    float a = atan(d.z, d.y);
    float streak = pow(0.5 + 0.5 * sin(a * 38.0 + hash1(floor(a * 6.37)) * 6.0 + uTime * 2.0), 10.0);
    c += vec3(1.0, 0.45, 0.1) * streak * pow(f, 5.0) * 0.6;
    return c;
}

// A plasma folded into a kaleidoscope round the way we're facing.
vec3 skyPlasma(vec3 d) {
    float a = atan(d.z, d.y) + uTime * 0.17;
    float r = acos(clamp(d.x, -1.0, 1.0));
    float seg = 3.14159265 / 5.0;
    a = abs(mod(a, 2.0 * seg) - seg);
    vec2 p = vec2(cos(a), sin(a)) * r * 2.4;
    float v = sin(p.x * 4.0 + uTime * 1.3) + sin(p.y * 5.0 - uTime * 1.9) + sin((p.x + p.y) * 3.0 + uTime) + sin(length(p) * 7.0 - uTime * 4.0);
    // Yellow, magenta and cyan, with black between.
    vec3 c = 0.5 + 0.5 * cos(6.2832 * (vec3(1.0, 1.0, 0.5) * (v * 0.2 + uTime * 0.11) + vec3(0.8, 0.9, 0.3)));
    c *= c * smoothstep(-0.2, 0.9, sin(v * 2.6 + uTime * 1.5));
    return c * (0.3 + 0.7 * uBass);
}

// A Julia set, fallen into at the point where its arms meet. It's the same shape all the way down there, so the
// fall never ends. One flat colour for each step a point takes to get away, the set itself in black ink, and
// every band sliding on to the next colour: colour cycling, as paint programs did it.
const vec3 INK[8] = vec3[8](
    vec3(1.0, 0.84, 0.0), vec3(1.0, 0.45, 0.02), vec3(1.0, 0.16, 0.42), vec3(0.62, 0.14, 0.8),
    vec3(0.14, 0.28, 0.95), vec3(0.0, 0.76, 0.8), vec3(0.4, 0.85, 0.14), vec3(1.0, 0.95, 0.82));
vec3 ink(float n) { return INK[int(mod(n, 8.0))]; }

vec3 skyTrip(vec3 d) {
    float r = acos(clamp(d.x, -1.0, 1.0));
    vec2 p = d.zy / max(length(d.zy), 1e-5) * r;
    vec2 z = uTripA.zw + vec2(p.x * uTripB.x - p.y * uTripB.y, p.x * uTripB.y + p.y * uTripB.x);
    float n = 0.0;
    for (int i = 0; i < 44; i++) {
        if (dot(z, z) < 256.0) {
            z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + uTripA.xy;
            n += 1.0;
        }
    }
    float m = dot(z, z);
    if (m < 256.0) return vec3(0.02);
    float s = n - log2(log2(m) * 0.5) + floor(uTripB.z);
    float band = floor(s), f = s - band, w = fwidth(s);
    float turn = fract(uTripB.z);
    vec3 a = mix(ink(band), ink(band + 1.0), turn);
    vec3 b = mix(ink(band + 1.0), ink(band + 2.0), turn);
    vec3 c = mix(a, b, smoothstep(1.0 - clamp(w * 1.5, 0.0, 0.5), 1.0, f));
    // Where the steps come too thick to tell apart, that's the set: ink.
    c = mix(c, vec3(0.02), smoothstep(0.6, 1.6, w));
    return c * uTripB.w;
}

vec3 sky(vec3 d) {
    vec3 c = vec3(0.0);
    if (uSky.w > 0.0) c += uSky.w * skyTrip(d);
    if (uSky.x > 0.0) c += uSky.x * skyNight(d);
    if (uSky.y > 0.0) c += uSky.y * skyTunnel(d);
    if (uSky.z > 0.0) c += uSky.z * skyPlasma(d);
    return c;
}

// What a shiny thing at p sees along r: the sky, or the chequered floor where r comes down on it.
vec3 world(vec3 p, vec3 r) {
    vec3 c = sky(r);
    if (uFloor.y > 0.0 && r.y < -0.001) {
        float t = (uFloor.x - p.y) / r.y;
        vec2 q = (p.xz + r.xz * t + vec2(uFloor.z, 0.0)) / uFloor.w;
        float k = mod(floor(q.x) + floor(q.y), 2.0);
        vec3 f = mix(mix(uFloorA, uFloorB, k), uFog, 1.0 - exp(-t * 0.05));
        c = mix(c, f, uFloor.y);
    }
    return c;
}
`;

// One triangle over the whole picture.
const FULL_VS = HEAD + `
out vec2 vUv;
void main() {
    vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
    vUv = p;
    gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

export const sky = {
    vs: HEAD + `
uniform mat4 uInvVP;
uniform vec3 uEye;
out vec3 vDir;
void main() {
    vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2) * 2.0 - 1.0;
    vec4 w = uInvVP * vec4(p, 1.0, 1.0);
    vDir = w.xyz / w.w - uEye;
    gl_Position = vec4(p, 1.0, 1.0);
}`,
    fs: HEAD + SKY + `
in vec3 vDir;
out vec4 o;
void main() {
    vec3 d = normalize(vDir);
    // Below the horizon it's the sky upside down, for the floor to mirror.
    if (uFloor.y > 0.0) d.y = abs(d.y);
    vec3 c = sky(d);
    // The trip is flat colour: it barely glows.
    o = vec4(c, dot(c, vec3(0.3, 0.5, 0.2)) * 0.35 * (1.0 - 0.75 * uSky.w));
}`
};

// A television channel behind everything: a video, fitted to cover. Changing channel is a burst of snow and a
// picture that rolls.
export const video = {
    vs: FULL_VS,
    fs: HEAD + `
uniform sampler2D uTex;
uniform vec2 uFit;
uniform float uSnow;
uniform float uRoll;
uniform float uTime;
uniform float uGain;
in vec2 vUv;
out vec4 o;
float hash2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main() {
    vec2 uv = (vUv - 0.5) * uFit + 0.5;
    uv.y = fract(uv.y + uRoll);
    uv.x += (hash2(vec2(floor(vUv.y * 90.0), floor(uTime * 60.0))) - 0.5) * uSnow * 0.25;
    vec3 c = texture(uTex, vec2(uv.x, 1.0 - uv.y)).rgb * uGain;
    float n = hash2(floor(vUv * vec2(320.0, 240.0)) + floor(uTime * 60.0) * 7.31);
    c = mix(c, vec3(n), uSnow);
    o = vec4(c, 0.12);
}`
};

// Boxes: the bats, the ball when it's square, the net, the numbers, the wreckage. Unlit they're plain white.
export const box = {
    vs: HEAD + `
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aNormal;
layout(location = 2) in vec4 aM0;
layout(location = 3) in vec4 aM1;
layout(location = 4) in vec4 aM2;
layout(location = 5) in vec4 aM3;
layout(location = 6) in vec4 aColor;
uniform mat4 uVP;
uniform float uMirror;
uniform float uFloorY;
out vec3 vW;
out vec3 vN;
out vec4 vColor;
void main() {
    mat4 m = mat4(aM0, aM1, aM2, aM3);
    vec4 w = m * vec4(aPos, 1.0);
    vec3 n = normalize(mat3(m) * aNormal);
    if (uMirror > 0.5) { w.y = 2.0 * uFloorY - w.y; n.y = -n.y; }
    vW = w.xyz;
    vN = n;
    vColor = aColor;
    gl_Position = uVP * w;
}`,
    fs: HEAD + `
uniform float uLit;
uniform float uGlow;
uniform vec3 uEye;
uniform vec3 uFog;
uniform float uFogK;
in vec3 vW;
in vec3 vN;
in vec4 vColor;
out vec4 o;
void main() {
    // Colour.a is how much it shines by itself. Below zero it's ink: black whatever the light.
    float ink = step(vColor.a, -0.5);
    float e = max(vColor.a, 0.0);
    vec3 n = normalize(vN);
    vec3 v = normalize(uEye - vW);
    float d = max(dot(n, normalize(vec3(-0.35, 0.8, 0.45))), 0.0) * 0.75 + 0.25;
    float rim = pow(1.0 - max(dot(n, v), 0.0), 2.0);
    vec3 lit = vColor.rgb * mix(d, 1.25, min(e, 1.0)) + vColor.rgb * rim * 0.3;
    lit = mix(lit, uFog, 1.0 - exp(-length(uEye - vW) * uFogK));
    vec3 c = mix(vec3(1.0), lit, uLit) * (1.0 - ink);
    o = vec4(c, mix(uGlow, e, uLit) * (1.0 - ink));
}`
};

// The ball, once it's round: a mirror. As a ghost it's a soft blob, added on, for trails. With a tint below zero
// it's a cartoon: two flat tones, a white spot and an ink line round it. Below minus one, a striped one.
export const ball = {
    vs: HEAD + `
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec4 aAt;
layout(location = 2) in vec4 aTint;
uniform mat4 uVP;
uniform float uMirror;
uniform float uFloorY;
out vec3 vW;
out vec3 vN;
out vec4 vTint;
void main() {
    vec3 w = aAt.xyz + aPos * aAt.w;
    vec3 n = aPos;
    if (uMirror > 0.5) { w.y = 2.0 * uFloorY - w.y; n.y = -n.y; }
    vW = w;
    vN = n;
    vTint = aTint;
    gl_Position = uVP * vec4(w, 1.0);
}`,
    fs: HEAD + SKY + `
uniform vec3 uEye;
uniform float uGhost;
in vec3 vW;
in vec3 vN;
in vec4 vTint;
out vec4 o;
void main() {
    vec3 n = normalize(vN);
    vec3 v = normalize(uEye - vW);
    float f = max(dot(n, v), 0.0);
    if (uGhost > 0.5) {
        float k = f * f * vTint.a;
        o = vec4(vTint.rgb * k, k * 0.6);
        return;
    }
    if (vTint.a < -0.5) {
        vec3 l = normalize(vec3(-0.35, 0.8, 0.45));
        vec3 base = vTint.rgb;
        if (vTint.a < -1.5) {
            // A gobstopper: the trip's colours wound round it in bands, and turning.
            float s = atan(n.z, -n.x) * 1.2732 + n.y * 3.0 + uTime * 4.0;
            float w = min(fwidth(s), 0.4);
            base = mix(ink(floor(s)), ink(floor(s) + 1.0), smoothstep(1.0 - w * 1.5, 1.0, fract(s)));
        }
        vec3 c = base * mix(0.62, 1.0, step(-0.15, dot(n, l)));
        c = mix(c, vec3(1.0), step(0.955, dot(n, normalize(l + v))));
        float line = smoothstep(0.4, 0.46, f);
        o = vec4(c * line, 0.3 * line);
        return;
    }
    vec3 r = reflect(-v, n);
    vec3 c = world(vW, r) * mix(vTint.rgb, vec3(1.0), pow(1.0 - f, 3.0));
    float spec = pow(max(dot(r, normalize(vec3(-0.35, 0.8, 0.45))), 0.0), 60.0);
    c += spec * 1.5 + vTint.rgb * vTint.a * 0.35;
    o = vec4(c, spec + vTint.a * 0.5);
}`
};

// The fist: chrome, the colour of the badge.
export const mesh = {
    vs: HEAD + `
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aNormal;
uniform mat4 uVP;
uniform mat4 uModel;
uniform float uMirror;
uniform float uFloorY;
out vec3 vW;
out vec3 vN;
void main() {
    vec4 w = uModel * vec4(aPos, 1.0);
    vec3 n = mat3(uModel) * aNormal;
    if (uMirror > 0.5) { w.y = 2.0 * uFloorY - w.y; n.y = -n.y; }
    vW = w.xyz;
    vN = n;
    gl_Position = uVP * w;
}`,
    fs: HEAD + SKY + `
uniform vec3 uEye;
uniform vec3 uTint;
uniform float uHot;
in vec3 vW;
in vec3 vN;
out vec4 o;
void main() {
    vec3 n = normalize(vN);
    vec3 v = normalize(uEye - vW);
    float f = max(dot(n, v), 0.0);
    vec3 r = reflect(-v, n);
    vec3 l = normalize(vec3(-0.5, 0.7, 0.3));
    float d = max(dot(n, l), 0.0);
    vec3 c = uTint * (0.32 + 0.68 * d) + world(vW, r) * pow(1.0 - f, 2.0) * 0.6;
    float spec = pow(max(dot(r, l), 0.0), 40.0);
    // Ink in the creases, as the badge is drawn.
    c *= smoothstep(0.0, 0.35, f);
    c *= 1.0 - 0.85 * smoothstep(0.1, 0.35, length(fwidth(n)) * 5.0);
    c += spec + uHot;
    o = vec4(c, spec * 0.8 + uHot);
}`
};

// A flat sheet: the chequered floor, or a tunnel wall of signs rushing by.
export const sheet = {
    vs: HEAD + `
uniform mat4 uVP;
uniform vec3 uO;
uniform vec3 uU;
uniform vec3 uV;
out vec3 vW;
out vec2 vP;
out vec2 vQ;
void main() {
    vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2) * 0.5;
    if (gl_VertexID == 3) p = vec2(1.0, 1.0);
    vQ = p;
    vW = uO + uU * p.x + uV * p.y;
    vP = p * vec2(length(uU), length(uV));
    gl_Position = uVP * vec4(vW, 1.0);
}`,
    fs: HEAD + `
uniform sampler2D uTex;
uniform float uStyle;       // 0 chequers, 1 signs
uniform float uAlpha;
uniform float uBlend;
uniform vec2 uSlide;
uniform float uEdge;         // 0: the strip lights run along the sheet's top and bottom; 1: along its sides
uniform float uCell;
uniform float uFogK;
uniform float uPulse;
uniform vec2 uTexScale;
uniform vec3 uA;
uniform vec3 uB;
uniform vec3 uFog;
uniform vec3 uEye;
in vec3 vW;
in vec2 vP;
in vec2 vQ;
out vec4 o;
float chequer(vec2 q) {
    vec2 w = fwidth(q) + 1e-4;
    vec2 i = 2.0 * (abs(fract((q - 0.5 * w) * 0.5) - 0.5) - abs(fract((q + 0.5 * w) * 0.5) - 0.5)) / w;
    return 0.5 - 0.5 * i.x * i.y;
}
void main() {
    vec2 p = vP + uSlide;
    vec3 c;
    float glow = 0.0;
    if (uStyle < 0.5) {
        c = mix(uA, uB, chequer(p / uCell));
    } else {
        c = texture(uTex, p * uTexScale).rgb;
        // A strip light down each edge.
        float strip = smoothstep(0.93, 0.96, abs(mix(vQ.y, vQ.x, uEdge) * 2.0 - 1.0));
        c = c * (0.3 + 0.3 * uPulse) + uA * strip * 1.5;
        glow = strip + dot(c, vec3(0.33)) * 0.1;
    }
    float fog = 1.0 - exp(-length(uEye - vW) * uFogK);
    c = mix(c, uFog, fog);
    o = vec4(c, mix(glow * (1.0 - fog), uAlpha, uBlend));
}`
};

// The glow: the picture times its alpha, at half size.
export const bright = {
    vs: FULL_VS,
    fs: HEAD + `
uniform sampler2D uTex;
in vec2 vUv;
out vec4 o;
void main() {
    vec4 c = texture(uTex, vUv);
    o = vec4(c.rgb * min(c.a, 1.0), 1.0);
}`
};

export const blur = {
    vs: FULL_VS,
    fs: HEAD + `
uniform sampler2D uTex;
uniform vec2 uStep;
in vec2 vUv;
out vec4 o;
void main() {
    vec3 c = texture(uTex, vUv).rgb * 0.227;
    c += (texture(uTex, vUv + uStep * 1.385).rgb + texture(uTex, vUv - uStep * 1.385).rgb) * 0.316;
    c += (texture(uTex, vUv + uStep * 3.231).rgb + texture(uTex, vUv - uStep * 3.231).rgb) * 0.0703;
    o = vec4(c, 1.0);
}`
};

// The picture with its glow, torn sideways when it glitches, its colours pulled apart, and the last frame
// swirled back in underneath for trails.
export const mixdown = {
    vs: FULL_VS,
    fs: HEAD + `
uniform sampler2D uScene;
uniform sampler2D uBloom;
uniform sampler2D uLast;
uniform float uTime;
uniform float uBloomK;
uniform float uGlitch;
uniform float uSplit;
uniform vec4 uTrail;        // how much stays, zoom, turn, how far its colours shift
in vec2 vUv;
out vec4 o;
float hash1(float n) { return fract(sin(n) * 43758.5453); }
void main() {
    vec2 uv = vUv;
    if (uGlitch > 0.0) {
        float row = floor(uv.y * 18.0 + hash1(floor(uTime * 20.0)) * 9.0);
        float on = step(0.55, hash1(row * 1.7 + floor(uTime * 15.0)));
        uv.x += (hash1(row + floor(uTime * 24.0)) - 0.5) * uGlitch * on;
    }
    vec2 off = (uv - 0.5) * uSplit;
    vec3 c = vec3(texture(uScene, uv + off).r, texture(uScene, uv).g, texture(uScene, uv - off).b);
    c += texture(uBloom, uv).rgb * uBloomK;
    if (uTrail.x > 0.0) {
        float s = sin(uTrail.z), k = cos(uTrail.z);
        vec2 q = (vUv - 0.5) * mat2(k, -s, s, k) * uTrail.y + 0.5;
        vec3 last = texture(uLast, q).rgb;
        last = mix(last, last.gbr, uTrail.w);
        c = max(c, last * uTrail.x);
    }
    o = vec4(c, 1.0);
}`
};

// Onto the screen: shaken, flashed, dimmed, and inside the old 4:3 picture while there still is one.
export const screen = {
    vs: FULL_VS,
    fs: HEAD + `
uniform sampler2D uTex;
uniform vec2 uShake;
uniform vec4 uBox;          // the picture's half size in the window, 0 to 1 each way; how much it masks; its corners' radius
uniform vec3 uBack;
uniform float uFlash;
uniform float uInvert;
uniform float uDim;
uniform float uAspect;
uniform float uLift;
in vec2 vUv;
out vec4 o;
void main() {
    vec3 c = texture(uTex, clamp(vUv + uShake, 0.0, 1.0)).rgb;
    c = mix(c, 1.0 - c, uInvert);
    c = mix(c * (1.0 - uDim), vec3(1.0), uFlash);
    c = mix(c, vec3(1.0), uLift);
    vec2 q = (abs(vUv - 0.5) * 2.0 - uBox.xy) * vec2(uAspect, 1.0) + uBox.w;
    float outside = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - uBox.w;
    float edge = fwidth(outside) + 1e-5;
    c = mix(c, uBack, smoothstep(-edge, edge, outside) * uBox.z);
    o = vec4(c, 1.0);
}`
};

// The cut-in: a slanted band across the picture with a pair of eyes in it, as anime does before the big one.
export const cutin = {
    vs: FULL_VS,
    fs: HEAD + `
uniform sampler2D uTex;
uniform float uAspect;
uniform float uIn;          // 0 to 1: wiping in from the right
uniform float uOpen;        // how tall the band has opened
uniform float uTime;
uniform float uPan;
uniform vec2 uJolt;
in vec2 vUv;
out vec4 o;
float hash1(float n) { return fract(sin(n) * 43758.5453); }
void main() {
    vec2 p = (vUv - 0.5) * vec2(uAspect, 1.0) + uJolt;
    float s = sin(0.14), k = cos(0.14);
    vec2 q = vec2(p.x * k + p.y * s, -p.x * s + p.y * k);
    float hh = 0.2 * uOpen;
    float d = abs(q.y) - hh;
    float wipe = step(mix(uAspect * 0.6, -uAspect * 0.6, uIn), q.x);
    if (wipe < 0.5 || d > 0.03) { o = vec4(0.0); return; }
    vec3 c;
    if (d > 0.018) c = vec3(0.0);
    else if (d > 0.0) c = vec3(1.0, 0.988, 0.0);
    else {
        // The middle band of the picture, drifting.
        vec2 uv = vec2(q.x / 1.72 + 0.5 + uPan, 0.45 - q.y * 0.9);
        c = texture(uTex, uv).rgb;
        float line = hash1(floor(q.y * 140.0));
        float streak = step(0.9, line) * step(0.6, fract(q.x * (0.4 + line) - uTime * (6.0 + line * 9.0)));
        c += streak * 0.16;
        c *= smoothstep(0.0, -0.012, d) * 0.3 + 0.7;
    }
    o = vec4(c, 1.0);
}`
};

// A picture thrown over the whole screen, fitted to cover: the impact frame.
export const splash = {
    vs: FULL_VS,
    fs: HEAD + `
uniform sampler2D uTex;
uniform vec2 uFit;
uniform float uZoom;
uniform float uInvert;
uniform float uWhite;
uniform float uAlpha;
uniform vec2 uJolt;
in vec2 vUv;
out vec4 o;
void main() {
    vec2 uv = (vUv - 0.5) * uFit / uZoom + 0.5 + uJolt;
    vec3 c = texture(uTex, vec2(uv.x, 1.0 - uv.y)).rgb;
    c = mix(c, 1.0 - c, uInvert);
    c = mix(c, vec3(1.0), uWhite);
    o = vec4(c, uAlpha);
}`
};
