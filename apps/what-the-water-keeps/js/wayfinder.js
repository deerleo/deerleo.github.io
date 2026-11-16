// The lights that show the way on: a lane of paper lotus lanterns afloat, set on the water by whoever went ahead, and
// at the far end of every area an arch of hanging lanterns over the way out.
//
//   engine.guide = makeWayfinder(engine);      // src/main.js; the engine calls engine.guide.update(dt) every frame
//
// The client, 9 November, of the first version (a single thread of small box lanterns on chips of wood, close by the
// centre line): "improve the look of the lanterns in the game. make them more beautiful and make them feel more
// obvious that they're guiding the player to the next world". So:
//
//   THE LANE. Two rows, one to port and one to starboard of the route's centre line, 3 m either side, a pair every
//   8 m from 9 m to 105 m ahead of the boat: the boat travels down a road of lights, and the two rows run
//   together in the distance where the road goes. (A single thread by the centre line sat behind the bow lantern's
//   crook and read as "a few lanterns ahead".) They drift downstream at the water's own speed: a boat that only
//   drifts keeps its distance to them, one that paddles passes between pair after pair (a pair it has passed closes
//   astern and opens again at the far end), and a boat that stands, or heads back up the route, is passed by them.
//
//   THE LANTERN. A lotus of paper, a metre across, on a dark pad: a ring of petals lying open, a ring half open, and at
//   its heart a tall closed bud that the flame lights from within (pale gold where the flame stands, amber, a
//   rose-orange at the tips), a soft halo, a pool of its light on the water, and its own picture in the water's
//   mirror. It opens as it is lit and closes as it goes out.
//
//   THE WAY OUT. Where the area's mist begins, thirteen round paper lanterns hang in the air in an arch over the
//   route, 8 m wide and 5 m high; the still water under them makes the arch a ring. The lane runs to it, and the boat
//   goes under it into the mist. It is seen from far off (a light carries through mist further than a thing does).
//   An area whose way out is hidden says where its arch stands (the theatre's is on its stage, before the backcloth
//   the boat leaves through; the lane goes on behind). The ride's last area ends at its kept lamp and has no arch.
//
//   THE BREATH. Every five seconds a slow brightening runs down the lane from the boat to the arch, each pair in turn,
//   as a breath of wind would run down a row of flames: it says which way. (Not with reduced motion.)
//
// Value is still the whole design (the client: "light on light is hard to see"): the water behind a light is black in
// one place and a mirrored sunset in the next. Every lantern carries both a dark body (the pad; the caps of the round
// ones) and a light, and its paper is a colour, not a white. In a dark place the flame, the halo and the pool do the
// rest. In a pale place (gold water, snow light, the dawn) they would be light on light: there the halo and the pool
// are left out and the paper is a deep vermilion standing on its dark pad. How pale a place is, is read from its own
// look every frame (the fog's brightness); PLACES holds the exceptions, and an area may say it itself:
//   guide: { color: '#ffb45e', float: 0..1 (0 = the light carries it, 1 = the dark body and the deep paper do), strength: 1 }
//
// Cost: three draw calls (the lotuses, the round lanterns, the lights), 478 triangles a lotus, 34 of them; nothing
// allocated in update(). Measured in the reach, real time, with and without: 17 to 19 ms a frame either way. The bodies are solid and are drawn after the water (`userData.afterWater`: the engine keeps
// them out of its picture of what lies beneath and out of the painter's filter, so that a far lantern stays crisp).
// Developer's switches (address): &wfneed=0..1 holds the strength's need, &wfpale=0..1 the paleness, &wfgate=0 no
// arch, &wfpulse=0 no breath, &wfdebug=<seconds> logs the lane's numbers once (tools/shot.py prints them under PAGE
// ERRORS), &wfsteer=1 keeps a picture's boat on the heading it was given.
import * as THREE from 'three';
import { FOG_PARS } from './kit.js';
import { gouacheShared } from './gouache.js';

const STATIONS = 17, AHEAD = 13;           // pairs: thirteen lie ahead of the boat; four wait, closed, up the route behind it
const LN = STATIONS * 2;                   // lanterns on the water
const GATE = 13;                           // round lanterns in the arch over the way out
const NEAR = 9, FAR = 105;                 // metres ahead of the boat along the route: the lane's two ends (it thins out over the last 30 m)
const PASSED = 6;                          // a pair this far behind the boat goes out
const ASTERN = 34;                         // the lane goes on, dark, this far up the route behind the boat
const GAP = [7.6, 8.6];                    // metres between one pair and the next (even: a road, not a scatter)
const LANE = 3.0, WANDER = 0.1;            // each row keeps this far from the centre line, and each lantern wanders this much about its place
// The boat parts the lanterns as a bow parts floating things: each is moved aside, square to the boat, out of a shape
// that is the hull's own width along the hull, comes to a point some way ahead of the stem (further ahead the faster
// the boat goes, so that a lantern is never moved fast), and closes behind the stern. On the starboard side the shape
// is wider where the rower's oar works. (The first version eased a lantern out of two circles, one round the hull and
// one round the bow: weaving through the lane at speed, a lantern met dead ahead was pushed from one circle into the
// other and rode the stem: 0.54 m from the boat's middle, measured.)
const PART = { half: 1.55, body: [-2.0, 1.4], stem: 2.4, lead: 3.0, leadPerSpeed: 0.4, astern: 1.2, oar: 3.25, oarAt: [-1.8, -0.2], oarEase: 1.0 };
const WICK = 0.09, MID = 0.30;             // the wick's and the light's middle's height in the lotus (the middle of its bud), metres
const ARCH = { half: 4.0, foot: 0.6, rise: 4.4, before: 2 };      // the arch: half its width, its lowest lanterns' height, how far its top is above them; metres before the mist begins
const PULSE = { every: 5.0, sweep: 3.2, width: 15, gain: 0.7 };   // the breath: seconds between two, seconds it takes to run the lane, metres wide, how much brighter
// colours: in a dark place (the kept lamp's amber and its pale heart), and in a pale one (paint, not light)
const HEART = '#fff0c4', MIDC = '#ffb45e', TIP = '#f0703a';
const DEEP_HEART = '#ffc878', DEEP_MID = '#f0702a', DEEP_TIP = '#b8321a';
const AMBER = '#ffb45e', CORE = '#ffe2a8', DEEP_FLAME = '#ff9a3a', DEEP_CORE = '#ffd890';
const PAD = '#141c14', CAP = '#1c110b', TASSEL = '#a52e1c';

// Exceptions by area: `float` fixes how far the dark body carries it there (0..1) whatever the look says; `gain`
// scales the light. The snow's fog is pale but its water is a black road in the ice, mirroring a dusk: the light
// carries it there, and burns half as bright again, because the area's own ice mist lies over the road. The town is
// dark, but its bloom is the strongest of the ride and its own lights are this same amber: at full glow the lanterns
// stood in a haze of their own making; the theatre's house the same, more mildly.
const PLACES = {
  snow: { float: 0.2, gain: 1.5 },
  town: { float: 0.45 },
  theatre: { float: 0.3, gate: 117 },        // (its way out is through the backcloth at s 120, and the fly tower behind it is hidden from the house: the arch stands on the stage, before the cloth)
};

const TAU = Math.PI * 2;
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const lum = (c) => 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;

// ------------------------------------------------------------------------------------------------ the forms
// Local metres, y up. aPart: 0 dark (the pad, the caps), 1 2 3 a petal of the outer, middle, inner ring, 4 the tassel,
// 5 the round lantern's paper. aUv: across and along a petal (0..1, 0 at its foot), round and up the round lantern.
function builder() {
  const P = [], Nn = [], A = [], U = [];
  const tri = (a, b, c, part, ua, ub, uc) => {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz);
    if (l < 1e-9) return;                                             // (a petal's tip: nothing to draw)
    nx /= l; ny /= l; nz /= l;
    P.push(...a, ...b, ...c); Nn.push(nx, ny, nz, nx, ny, nz, nx, ny, nz); A.push(part, part, part); U.push(...ua, ...ub, ...uc);
  };
  const done = () => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(Nn, 3));
    g.setAttribute('aPart', new THREE.Float32BufferAttribute(A, 1)); g.setAttribute('aUv', new THREE.Float32BufferAttribute(U, 2));
    return g;
  };
  return { tri, done };
}

/** The lotus: a dark pad on the water and three rings of paper petals round a flame. Origin on the water under its middle. */
function lotusGeometry() {
  const { tri, done } = builder();
  // the pad: a dark leaf, a little dished, wider than the flower (the dark the light stands on, on bright water)
  const R = 0.47, seg = 14;
  for (let i = 0; i < seg; i++) {
    const a0 = i / seg * TAU, a1 = (i + 1) / seg * TAU;
    tri([0, 0.016, 0], [R * Math.cos(a1), 0.01, R * Math.sin(a1)], [R * Math.cos(a0), 0.01, R * Math.sin(a0)], 0, [0.5, 0], [1, 1], [0, 1]);
  }
  // a petal: five rows from its foot to its tip, three points a row (its edges are curled up a little, as paper is)
  const petal = (part, ang, r0, y0, rt, yt, w, powR, powY, cup) => {
    const ca = Math.cos(ang), sa = Math.sin(ang), rows = 5, row = [];
    for (let k = 0; k <= rows; k++) {
      const t = k / rows, r = r0 + (rt - r0) * Math.pow(t, powR), y = y0 + (yt - y0) * Math.pow(t, powY);
      const half = w * (0.3 * (1 - t) + 1.9 * t * (1 - t)) / 0.64;
      const at = (u) => [ca * r - sa * u * half, y + cup * half * Math.abs(u), sa * r + ca * u * half];
      row.push([at(-1), at(0), at(1), t]);
    }
    for (let k = 0; k < rows; k++) {
      const [l0, c0, r0_, t0] = row[k], [l1, c1, r1, t1] = row[k + 1];
      tri(l0, c0, l1, part, [0, t0], [0.5, t0], [0, t1]); tri(c0, c1, l1, part, [0.5, t0], [0.5, t1], [0, t1]);
      tri(c0, r0_, c1, part, [0.5, t0], [1, t0], [0.5, t1]); tri(r0_, r1, c1, part, [1, t0], [1, t1], [0.5, t1]);
    }
  };
  for (let i = 0; i < 8; i++) petal(1, i / 8 * TAU, 0.09, 0.03, 0.45, 0.15, 0.16, 0.85, 1.8, 0.25);             // the outer ring: lying open on the pad
  for (let i = 0; i < 8; i++) petal(2, (i + 0.5) / 8 * TAU, 0.08, 0.04, 0.30, 0.36, 0.14, 0.9, 1.25, 0.3);      // the middle ring: half open
  // the bud: six petals closed to a point over the flame. It is the lantern: tall enough to stand up from the water
  // for an eye a metre above it, and it is what the flame lights from within
  const bud = (ang, w) => {
    const ca = Math.cos(ang), sa = Math.sin(ang), rows = 6, row = [];
    for (let k = 0; k <= rows; k++) {
      const t = k / rows, r = 0.05 + 0.135 * Math.sin(Math.PI * Math.pow(t, 0.72)) * (1 - 0.25 * t), y = 0.05 + 0.60 * t;
      const half = w * Math.sin(Math.PI * Math.pow(t, 0.8)) + 0.012 * (1 - t);
      const at = (u) => { const rr = r - 0.018 * Math.abs(u); return [ca * rr - sa * u * half, y, sa * rr + ca * u * half]; };      // (its edges tuck under its neighbours')
      row.push([at(-1), at(0), at(1), t]);
    }
    for (let k = 0; k < rows; k++) {
      const [l0, c0, r0_, t0] = row[k], [l1, c1, r1, t1] = row[k + 1];
      tri(l0, c0, l1, 3, [0, t0], [0.5, t0], [0, t1]); tri(c0, c1, l1, 3, [0.5, t0], [0.5, t1], [0, t1]);
      tri(c0, r0_, c1, 3, [0.5, t0], [1, t0], [0.5, t1]); tri(r0_, r1, c1, 3, [1, t0], [1, t1], [0.5, t1]);
    }
  };
  for (let i = 0; i < 6; i++) bud((i + 0.25) / 6 * TAU, 0.095);
  return done();
}

/** The round lantern: a paper globe with dark caps and a tassel. Origin at its middle. */
function globeGeometry() {
  const { tri, done } = builder();
  const R = 0.27, SY = 0.92, segs = 12, rings = 7, lat = 62 * Math.PI / 180;
  const at = (i, j) => { const th = i / segs * TAU, ph = -lat + (j / rings) * 2 * lat; return [R * Math.cos(ph) * Math.cos(th), R * SY * Math.sin(ph), R * Math.cos(ph) * Math.sin(th)]; };
  for (let j = 0; j < rings; j++) for (let i = 0; i < segs; i++) {
    const a = at(i, j), b = at(i + 1, j), c = at(i + 1, j + 1), d = at(i, j + 1), u0 = i / segs, u1 = (i + 1) / segs, v0 = j / rings, v1 = (j + 1) / rings;
    tri(a, c, b, 5, [u0, v0], [u1, v1], [u1, v0]); tri(a, d, c, 5, [u0, v0], [u0, v1], [u1, v1]);
  }
  const rc = R * Math.cos(lat) + 0.012, yc = R * SY * Math.sin(lat), h = 0.05;
  for (const sgn of [1, -1]) for (let i = 0; i < segs; i++) {                 // the caps
    const a0 = i / segs * TAU, a1 = (i + 1) / segs * TAU, y0 = sgn * (yc - 0.01), y1 = sgn * (yc + h);
    const p0 = [rc * Math.cos(a0), y0, rc * Math.sin(a0)], p1 = [rc * Math.cos(a1), y0, rc * Math.sin(a1)], q0 = [rc * 0.8 * Math.cos(a0), y1, rc * 0.8 * Math.sin(a0)], q1 = [rc * 0.8 * Math.cos(a1), y1, rc * 0.8 * Math.sin(a1)];
    const uv = [0.5, 0.5];
    tri(p0, q1, p1, 0, uv, uv, uv); tri(p0, q0, q1, 0, uv, uv, uv); tri([0, y1, 0], q1, q0, 0, uv, uv, uv);
  }
  const ty = -(yc + h), tl = 0.3, tw = 0.02;                                  // the tassel: two thin crossed strips
  for (const [ax, az] of [[1, 0], [0, 1]]) {
    const a = [-ax * tw, ty, -az * tw], b = [ax * tw, ty, az * tw], c = [ax * tw * 0.5, ty - tl, az * tw * 0.5], d = [-ax * tw * 0.5, ty - tl, -az * tw * 0.5];
    tri(a, c, b, 4, [0, 0], [1, 1], [1, 0]); tri(a, d, c, 4, [0, 0], [0, 1], [1, 1]);
  }
  return done();
}

// Far off a lantern would be a few pixels and its flame less than one: beyond 14 m both shrink more slowly than
// distance asks (the same rule in both shaders, so the flame stays in its lantern). At 100 m it is drawn three times
// its size.
const GROW_GLSL = /* glsl */`
  float wfGrow(float dist) { return pow(max(1.0, dist / 14.0), 0.55); }`;

const BODY_VERT = /* glsl */`
  ${FOG_PARS} ${GROW_GLSL}
  attribute float aPart; attribute vec2 aUv; attribute vec4 iAux;       // iAux: how far it is open (0..1), the breath on it (0..1), its phase
  varying vec3 vLocal; varying vec3 vN; varying vec3 vWorld; varying vec2 vUv; varying float vPart; varying float vBreath; varying float vFogDist;
  void main() {
    vec3 o = instanceMatrix[3].xyz;
    mat3 turn = mat3(instanceMatrix);
    float open = iAux.x;
    vec3 p = position;
    if (aPart > 0.5 && aPart < 3.5) {
      // a flower that is not lit is closed: its petals stand up round its heart; it opens as it is lit
      float fold = 1.0 - smoothstep(0.15, 1.0, open);
      float r = length(p.xz), keep = 0.07 + 0.22 * max(r - 0.07, 0.0);
      float r1 = mix(r, min(r, keep), fold);
      p = vec3(p.xz * (r > 1e-4 ? r1 / r : 1.0), p.y + fold * (r - r1) * 0.85).xzy;
    }
    p *= smoothstep(0.0, 0.5, open);                                    // and it is small before it is there at all
    vec3 wp = o + turn * p * wfGrow(length(cameraPosition - o));
    vLocal = position; vN = turn * normal; vUv = aUv; vPart = aPart; vBreath = iAux.y; vWorld = wp;
    vec4 mvPosition = viewMatrix * vec4(wp, 1.0);
    vFogDist = fogDistance(mvPosition);
    gl_Position = projectionMatrix * mvPosition;
  }`;
const BODY_FRAG = /* glsl */`
  ${FOG_PARS}
  uniform vec3 uDark, uCap, uTassel, uHeart, uMid, uTip, uSkyLight, uRampLight, uKeyColor, uKeyDir;
  uniform float uLit, uPaint, uFogScale;
  varying vec3 vLocal; varying vec3 vN; varying vec3 vWorld; varying vec2 vUv; varying float vPart; varying float vBreath; varying float vFogDist;
  void main() {
    vec3 N = normalize(vN); if (!gl_FrontFacing) N = -N;
    // the area's own light on a matte thing, plainly: its sky everywhere, its key on what faces it. Never more than a
    // dull day's: the dark body is what carries the lantern against bright water
    vec3 amb = min(uSkyLight + uRampLight * uKeyColor * (0.3 + 0.6 * (dot(N, -uKeyDir) * 0.5 + 0.5)), vec3(0.85));
    float lit = uLit * (1.0 + vBreath);
    vec3 c;
    if (vPart < 0.5) {
      // the pad (its leaf lit round the flower's foot) or a cap
      float r = length(vLocal.xz);
      vec3 dark = vLocal.y < 0.05 && r > 0.001 ? uDark : uCap;
      c = dark * amb + uMid * lit * 0.55 * exp(-r * r / 0.05) * step(vLocal.y, 0.05) * step(-0.001, vLocal.y);
    } else if (vPart < 3.5) {
      // a petal: paper lit from the flame at the flower's heart. Pale gold at its foot, amber, a rose-orange at its tip;
      // a darker edge and a paler rib say that it is a petal
      float t = vUv.y, x = abs(vUv.x * 2.0 - 1.0);
      vec3 paper = mix(uHeart, uMid, smoothstep(0.0, 0.5, t)); paper = mix(paper, uTip, smoothstep(0.45, 1.0, t));
      paper *= 1.0 - 0.38 * smoothstep(0.5, 1.0, x) * (0.35 + 0.65 * t);
      paper *= 1.0 + 0.12 * (1.0 - smoothstep(0.0, 0.16, x));
      float through;
      if (vPart > 2.5) {
        // the bud: the flame stands inside it, a third of the way up: the paper is palest there and deepens to its point
        float glow = exp(-(t - 0.3) * (t - 0.3) / 0.09);
        paper = mix(mix(uMid, uTip, smoothstep(0.35, 1.0, t)), uHeart, glow * 0.85);
        paper *= 1.0 - 0.42 * smoothstep(0.55, 1.0, x);                  // the seam between two petals
        through = 0.46 + 0.58 * glow;
      } else {
        through = (vPart < 1.5 ? 0.5 : 0.72) * (1.0 - 0.5 * t);          // the open petals take the bud's light, less the further out they lie
      }
      c = paper * (lit * through + uPaint * 0.55) + paper * amb * 0.3;
    } else if (vPart < 4.5) {
      c = uTassel * (amb + 0.25 * lit * (1.0 - vUv.y));
    } else {
      // the round lantern's paper: brightest where the eye looks through to the flame, deeper at its rim; thin ribs
      vec3 V = normalize(cameraPosition - vWorld);
      float f = abs(dot(N, V));
      vec3 paper = mix(uTip, uMid, smoothstep(0.1, 0.75, f)); paper = mix(paper, uHeart, smoothstep(0.72, 1.0, f) * 0.8);
      float rib = smoothstep(0.38, 0.5, abs(fract(vUv.y * 7.0) - 0.5));
      paper *= 1.0 - 0.3 * rib;
      paper *= 0.82 + 0.18 * smoothstep(0.0, 0.5, vUv.y);                // (a little deeper below: the flame stands low in it)
      c = paper * (lit * (0.45 + 0.75 * f * f) + uPaint * 0.6) + paper * amb * 0.3;
    }
    gl_FragColor = vec4(applyFog(c, vFogDist * uFogScale), 1.0);
  }`;

// The lights: for every lantern a halo, a flame and a pool of light on the water, each a small sheet. The halo and
// the flame stand upright and turn to the eye (about the vertical only, so that the water's mirror shows them the
// right way up). position.xy = the corner (-1..1), position.z = 0 the halo, 1 the flame, 2 the pool.
const LIGHT_VERT = /* glsl */`
  ${FOG_PARS} ${GROW_GLSL}
  attribute vec4 iPos;                                   // the lantern's origin in the world, and its own size
  attribute vec4 iAux;                                   // its phase, how much of it is there (0..1), 0 a lantern that hangs, 1 one on the water (it has a pool), 2 one with a bare flame as well, the breath on it
  attribute vec3 iH;                                     // the wick's and the light's middle's height above the origin (the lantern's own metres), how much of the fog it feels
  uniform float uTime, uMirror, uGlowSize, uFlicker, uPoolSize;
  varying vec2 vQ; varying float vKind; varying float vA; varying float vDist; varying float vBoost;
  void main() {
    vec3 o = iPos.xyz;
    vec3 toEye = cameraPosition - o;
    float grow = wfGrow(length(toEye)) * iPos.w;
    vec3 right = normalize(vec3(toEye.z, 0.0, -toEye.x) + vec3(1e-5, 0.0, 0.0));
    vec2 q = position.xy; float ph = iAux.x;
    vec3 p;
    if (position.z < 0.5) {
      float r = uGlowSize * sqrt(grow * iPos.w);                // (the halo grows less with distance than the lantern does: a row of far lights must not run into one blot)
      // it is light in the air round the lantern: drawn a little toward the eye, so that the lantern's own petals do not cut it
      p = o + vec3(0.0, iH.y * grow, 0.0) + right * (q.x * r) + vec3(0.0, q.y * r, 0.0) + normalize(toEye) * (0.5 * grow);
    } else if (position.z < 1.5) {
      float tip = q.y * 0.5 + 0.5, big = 1.0 + 0.7 * uMirror;      // (in the water its shine is drawn a little larger: the water draws it out into the stroke)
      float h = 0.17 * big * (1.0 + uFlicker * (0.07 * sin(uTime * 11.0 + ph * 3.0) + 0.04 * sin(uTime * 17.3 + ph)));
      float lean = uFlicker * tip * tip * (0.010 * sin(uTime * 7.3 + ph * 5.0) + 0.005 * sin(uTime * 13.1 + ph * 2.0));
      p = o + (vec3(0.0, iH.x, 0.0) + right * (q.x * 0.052 * big + lean) + vec3(0.0, tip * h, 0.0)) * grow;
      if (iAux.z < 1.5) p = vec3(0.0, -9999.0, 0.0);              // (the flame is inside the paper, of the bud and of the round lantern alike: it is drawn only for a lantern that says so)
    } else {
      float r = uPoolSize * sqrt(grow * iPos.w);
      p = o + vec3(q.x * r, 0.03, q.y * r);
      if (iAux.z < 0.5 || uMirror > 0.5) p = vec3(0.0, -9999.0, 0.0);      // (it lies on the water: nothing of it in the mirror, and none under a lantern that hangs)
    }
    vQ = q; vKind = position.z; vA = iAux.y; vBoost = 1.0 + iAux.w;
    vec4 mvPosition = viewMatrix * vec4(p, 1.0);
    vDist = fogDistance(mvPosition) * iH.z;
    gl_Position = projectionMatrix * mvPosition;
  }`;
const LIGHT_FRAG = /* glsl */`
  ${FOG_PARS}
  uniform vec3 uFlame, uCore, uGlow;
  uniform float uFlameGain, uGlowGain, uPoolGain, uCover, uMirror;
  varying vec2 vQ; varying float vKind; varying float vA; varying float vDist; varying float vBoost;
  void main() {
    if (vA < 0.004) discard;
    vec3 col; float cover = 0.0;
    if (vKind < 0.5) {
      // light in the air round the flame: a heart and a breath
      float r = length(vQ);
      if (r >= 1.0) discard;
      float a = 0.5 * exp(-r * r * 9.0) + 0.16 * (1.0 - r) * (1.0 - r);
      a *= 0.35 + 0.65 * smoothstep(1.5, 7.0, vDist);          // (one that drifts by at arm's length must not fog the view)
      col = uGlow * (a * uGlowGain * vBoost);
    } else if (vKind < 1.5) {
      // the flame's body: a drop standing on its wick, paler at its heart
      float y = vQ.y * 0.5 + 0.5, x = abs(vQ.x);
      float bw = 2.2 * pow(max(y, 1e-4), 0.6) * (1.0 - y);
      float soft = max(fwidth(vQ.x) * 1.5, 0.1);
      float body = smoothstep(0.0, soft + 0.16, bw - x);
      if (body < 0.004) discard;
      float heart = smoothstep(0.0, 0.42, bw * 0.62 - x) * (1.0 - smoothstep(0.35, 0.92, y));
      col = mix(uFlame, uCore, heart) * (body * uFlameGain * (1.0 + 1.2 * uMirror) * (0.75 + 0.25 * vBoost));
      cover = body * uCover;
    } else {
      // its light lying on the water round it
      float r = length(vQ);
      if (r >= 1.0) discard;
      float a = exp(-r * r * 4.0) * (1.0 - r) ;
      col = uGlow * (a * uPoolGain * vBoost);
    }
    float k = vA * (1.0 - fogAmount(vDist));              // light fades to nothing in fog and in the veil
    gl_FragColor = vec4(col * k, cover * k);
  }`;

/**
 * The lane of lights and the arch over the way out. Returns { update(dt), group, state } (state: the numbers it runs on, to read).
 * @param engine the Engine (src/engine/engine.js)
 */
export function makeWayfinder(engine) {
  const S = gouacheShared(engine), sh = engine.shared;
  const params = new URLSearchParams(typeof location !== 'undefined' ? location.search : '');
  const num = (k) => (params.has(k) && params.get(k) !== '' && Number.isFinite(+params.get(k)) ? +params.get(k) : null);
  const holdNeed = num('wfneed'), holdPale = num('wfpale'), debugAt = params.has('wfdebug') ? (num('wfdebug') ?? 3) : null, steered = params.get('wfsteer') === '1';
  const gateOn = params.get('wfgate') !== '0', pulseOn = params.get('wfpulse') !== '0', gateAt = num('wfgateat');

  // ---- what is drawn
  const group = new THREE.Group(); group.name = 'wayfinder';
  const fogU = { uFogColor: sh.uFogColor, uFogDensity: sh.uFogDensity, uVeil: sh.uVeil, uVeilColor: sh.uVeilColor };
  const bodyUniforms = (fogScale) => ({ ...fogU, uDark: { value: new THREE.Color(PAD) }, uCap: { value: new THREE.Color(CAP) }, uTassel: { value: new THREE.Color(TASSEL) },
    uHeart: { value: new THREE.Color(HEART) }, uMid: { value: new THREE.Color(MIDC) }, uTip: { value: new THREE.Color(TIP) }, uLit: { value: 1 }, uPaint: { value: 0 }, uFogScale: { value: fogScale },
    uSkyLight: S.uSkyLight, uRampLight: S.uRampLight, uKeyColor: S.uKeyColor, uKeyDir: S.uKeyDir });
  const makeBody = (geo, count, name, fogScale) => {
    const u = bodyUniforms(fogScale);
    // (solid: it writes depth, so its petals hide one another rightly from every side. `transparent` only puts it in the
    // list that is drawn after the water; see userData.afterWater)
    const mat = new THREE.ShaderMaterial({ uniforms: u, vertexShader: BODY_VERT, fragmentShader: BODY_FRAG, transparent: true, depthWrite: true, side: THREE.DoubleSide, fog: false });
    const aux = new THREE.InstancedBufferAttribute(new Float32Array(count * 4), 4); aux.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('iAux', aux);
    const mesh = new THREE.InstancedMesh(geo, mat, count);
    mesh.name = name; mesh.frustumCulled = false; mesh.renderOrder = 1; mesh.userData.afterWater = true; mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    return { mesh, u, aux };
  };
  const lotus = makeBody(lotusGeometry(), LN, 'wayfinder lotuses', 1.0);
  const globes = makeBody(globeGeometry(), GATE, 'wayfinder arch', 0.6);

  const LIGHTS = LN + GATE;
  const gu = { ...fogU, uTime: sh.uTime, uMirror: { value: 0 }, uGlowSize: { value: 1.25 }, uPoolSize: { value: 1.9 }, uFlicker: { value: 1 },
    uFlame: { value: new THREE.Color(AMBER) }, uCore: { value: new THREE.Color(CORE) }, uGlow: { value: new THREE.Color(AMBER) },
    uFlameGain: { value: 2.4 }, uGlowGain: { value: 1 }, uPoolGain: { value: 0.3 }, uCover: { value: 0.3 } };
  const lightMat = new THREE.ShaderMaterial({ uniforms: gu, vertexShader: LIGHT_VERT, fragmentShader: LIGHT_FRAG, transparent: true, depthWrite: false, fog: false,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor });
  const lightGeo = new THREE.InstancedBufferGeometry();
  // (the pool first: it lies under the halo and the flame)
  lightGeo.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 2, 1, -1, 2, 1, 1, 2, -1, 1, 2, -1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0, -1, -1, 1, 1, -1, 1, 1, 1, 1, -1, 1, 1], 3));
  lightGeo.setIndex([0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11]);
  const iPos = new THREE.InstancedBufferAttribute(new Float32Array(LIGHTS * 4), 4), iAux = new THREE.InstancedBufferAttribute(new Float32Array(LIGHTS * 4), 4), iH = new THREE.InstancedBufferAttribute(new Float32Array(LIGHTS * 3), 3);
  iPos.setUsage(THREE.DynamicDrawUsage); iAux.setUsage(THREE.DynamicDrawUsage);
  lightGeo.setAttribute('iPos', iPos); lightGeo.setAttribute('iAux', iAux); lightGeo.setAttribute('iH', iH); lightGeo.instanceCount = LIGHTS;
  for (let i = 0; i < LIGHTS; i++) { const g = i >= LN; iH.array[i * 3] = g ? 0 : WICK; iH.array[i * 3 + 1] = g ? 0 : MID; iH.array[i * 3 + 2] = g ? 0.6 : 0.9; iAux.array[i * 4 + 2] = g ? 0 : 1; }
  const lights = new THREE.Mesh(lightGeo, lightMat);
  lights.name = 'wayfinder lights'; lights.frustumCulled = false; lights.renderOrder = 3;
  // in the water's mirror the flame is drawn as its plain shine, which the water draws out into the stroke under it
  lights.onBeforeRender = () => { const m = engine.reflecting ? 1 : 0; if (gu.uMirror.value !== m) { gu.uMirror.value = m; lightMat.uniformsNeedUpdate = true; } };
  group.add(lotus.mesh, globes.mesh, lights);
  group.visible = false;
  engine.scene.add(group);

  // ---- the lane: every pair's and every lantern's own numbers (typed arrays: nothing is made in update)
  const s = new Float32Array(STATIONS), gap = new Float32Array(STATIONS), there = new Float32Array(STATIONS);
  const phase = new Float32Array(LN), size = new Float32Array(LN), off = new Float32Array(LN), rate = new Float32Array(LN), px = new Float32Array(LN), pz = new Float32Array(LN), ring = new Float32Array(LN), spin = new Float32Array(LN);
  const gph = new Float32Array(GATE), gsz = new Float32Array(GATE);
  let seed = 20261109;
  const rnd = () => { seed = (Math.imul(seed, 48271) >>> 0) % 2147483647; return seed / 2147483647; };
  for (let i = 0; i < STATIONS; i++) gap[i] = GAP[0] + (GAP[1] - GAP[0]) * rnd();
  for (let i = 0; i < LN; i++) { phase[i] = rnd() * TAU; size[i] = 1.18 + 0.16 * rnd(); off[i] = (rnd() - 0.5) * 0.24; rate[i] = 0.05 + 0.05 * rnd(); ring[i] = 3 + 6 * rnd(); spin[i] = (rnd() - 0.5) * 0.16; }
  for (let i = 0; i < GATE; i++) { gph[i] = rnd() * TAU; gsz[i] = 1.0 + 0.22 * rnd(); }
  const gate = { on: false, s: 0, end: 0, x: 0, z: 0, rx: 1, rz: 0, heading: 0, half: ARCH.half, there: 0 };
  const state = { strength: 1, need: 1, pale: 0, gain: 1, shown: 0, area: null, slow: 0, drift: 0, nearest: { hull: Infinity, bow: Infinity, eye: Infinity }, relaid: 0, moved: 0, gate };
  let current = null, time = 0, pale = -1, wantGain = 1, logged = false, bob = engine.reducedMotion ? 0 : 1, passing = false, breathAt = 1.5;
  const _p = {}, _loc = {}, _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(0, 0, 0, 'YXZ'), _v = new THREE.Vector3(), _sc = new THREE.Vector3();
  const C = (hex) => new THREE.Color(hex);
  const heart = C(HEART), midc = C(MIDC), tip = C(TIP), deepHeart = C(DEEP_HEART), deepMid = C(DEEP_MID), deepTip = C(DEEP_TIP);
  const flame = new THREE.Color(), core = new THREE.Color(), amber = C(AMBER), coreLit = C(CORE), deepFlame = C(DEEP_FLAME), deepCore = C(DEEP_CORE);

  /** Lay the lane anew (a new area, or the boat set down somewhere else): eleven pairs ahead of the boat, three closed behind it; and the arch. */
  const lay = (inst, boatS) => {
    let at = boatS + NEAR + 1.5, back = boatS - NEAR - 1;
    for (let i = 0; i < STATIONS; i++) {
      if (i < AHEAD) { s[i] = at; at += gap[i]; } else { s[i] = back; back -= gap[i]; }
      there[i] = 0; px[i * 2] = 0; pz[i * 2] = 0; px[i * 2 + 1] = 0; pz[i * 2 + 1] = 0;
    }
    // the arch stands where the area's mist begins (the ride's last area ends at its lamp: no way out, no arch)
    const path = inst.path, L = path.length, look = inst.look || {};
    const out = Math.min(look.veilOut ?? look.veilLength ?? 26, L * 0.3);
    gate.on = gateOn && !path.endStop && out > 4 && L > 60;
    gate.end = L - out - ARCH.before;                                // where the lane ends: at the mist
    if (gate.on) {
      // (an area whose way out is hidden from most of it says where its arch stands: `guide: { gate: <metres along> }`,
      // or PLACES below. The lane goes on under it to the mist.)
      const g = inst.def && inst.def.guide, t = PLACES[inst.id];
      gate.s = gateAt !== null ? gateAt : g && typeof g.gate === 'number' ? g.gate : t && typeof t.gate === 'number' ? t.gate : gate.end;
      const a = path.at(gate.s, _p);
      gate.x = a.x; gate.z = a.z; gate.rx = a.rx; gate.rz = a.rz; gate.heading = a.heading;
      gate.half = Math.max(2.4, Math.min(ARCH.half, a.halfWidth - 1.2));
    }
    gate.there = 0;
  };

  /** How far the dark body must carry it here (0 = the light does), from the area's own look, live. */
  const paleness = (inst, realms) => {
    const g = inst.def && inst.def.guide, t = PLACES[inst.id];
    if (holdPale !== null) return holdPale;
    if (g && typeof g.float === 'number') return Math.min(1, Math.max(0, g.float));
    if (t && typeof t.float === 'number') return t.float;
    const L = inst.lookEnd && realms.lookNow && realms.lookNow.fog ? realms.lookNow : inst.look;
    const fog = L && L.fog && L.fog.color;
    if (!fog || !fog.isColor) return 0;
    return smooth(0.09, 0.24, lum(fog) * (typeof L.exposure === 'number' ? L.exposure : 1));
  };

  /** How far to either side of the boat's own line a lantern must keep, at `ahead` metres ahead of the boat's middle (see PART). */
  const partHalf = (ahead, starboard, lead, oared) => {
    let w = 0;
    if (ahead >= PART.body[0] && ahead <= PART.body[1]) w = PART.half;
    else if (ahead > PART.body[1]) { const u = (ahead - PART.body[1]) / (PART.stem - PART.body[1] + lead); w = u < 1 ? PART.half * Math.pow(1 - u, 0.7) : 0; }
    else { const u = (PART.body[0] - ahead) / PART.astern; w = u < 1 ? PART.half * (1 - u) : 0; }
    if (starboard && oared) {
      const k = ahead < PART.oarAt[0] ? 1 - (PART.oarAt[0] - ahead) / PART.oarEase : ahead > PART.oarAt[1] ? 1 - (ahead - PART.oarAt[1]) / PART.oarEase : 1;
      if (k > 0) w = Math.max(w, PART.half + (PART.oar - PART.half) * Math.min(1, k));
    }
    return w;
  };

  function update(dt) {
    const realms = engine.realms, inst = realms && realms.current;
    if (!inst || !inst.path) { group.visible = false; return; }
    const boat = engine.boat, path = inst.path, L = path.length;
    const calm = !!engine.reducedMotion;                           // (the rider's setting: it can change while the ride runs)
    bob += ((calm ? 0 : 1) - bob) * (1 - Math.exp(-dt / 1.5)); gu.uFlicker.value = 0.35 + 0.65 * bob;
    time += dt;
    if (steered) boat.idle = 0;                                     // (a developer's picture of a boat that is being steered: the current does not swing its bow downstream)
    if (inst !== current || Math.abs(boat.s - state.lastS) > 30) { current = inst; state.area = inst.id; lay(inst, boat.s); state.slow = 0; state.drift = 0; passing = false; state.relaid++; }      // (30 m in one frame: the boat was set down elsewhere)
    state.lastS = boat.s;
    const here = path.at(boat.s, _p), tx = here.tx, tz = here.tz;
    const fx = -Math.sin(boat.heading), fz = -Math.cos(boat.heading), rx = -fz, rz = fx;      // the boat's forward and its right
    const held = !!(engine.frozen || realms.holding);
    const flow = held ? 0 : (engine.current || 0);

    // ---- how much the rider needs it (the lane is always plain to see; it is at its brightest when the rider is lost)
    const along = boat.vx * tx + boat.vz * tz, pull = Math.max(0.8, engine.current || 2);
    state.slow = along < 0.55 * pull ? Math.min(12, state.slow + dt) : Math.max(0, state.slow - dt * 2);
    const need = holdNeed !== null ? holdNeed : Math.max(
      smooth(2.5, 7, state.slow),                                   // slow, or standing, for a while
      smooth(8, 16, boat.idle),                                     // hands off for a while
      1 - smooth(-0.1, 0.55, fx * tx + fz * tz),                    // heading away from the route
      smooth(7, 16, Math.abs(boat.d)));                             // far off the centre line
    const g = inst.def && inst.def.guide, own1 = g && typeof g.strength === 'number' ? Math.max(0, g.strength) : 1;
    const want = 0.5 + 0.5 * need;
    state.need = need;
    state.strength += (want - state.strength) * (1 - Math.exp(-dt / ((want > state.strength ? 2 : 5) * (calm ? 1.6 : 1))));
    const k = Math.min(1, Math.max(0, state.strength * 2 - 1));     // 0 travelling well .. 1 needed
    // how fast the lane gains on the boat, eased: about 0 for a boat that drifts, below it for one that paddles on
    // (it passes the pairs), above it for one that stands or is backed (the pairs pass it)
    state.drift += (flow - along - state.drift) * (1 - Math.exp(-dt / 1.2));
    const overtaken = smooth(0.05, 0.4, state.drift);
    if (overtaken > 0.6) passing = true; else if (overtaken < 0.35) passing = false;      // (two thresholds: a boat that is nearly keeping up does not flicker between the two rules)

    // ---- the place: pale or dark (eased; a new area is taken as it is, inside the veil)
    const wantPale = paleness(inst, realms);
    pale = pale < 0 ? wantPale : pale + (wantPale - pale) * (1 - Math.exp(-dt / 3));
    wantGain += (((PLACES[inst.id] && PLACES[inst.id].gain) || 1) * own1 - wantGain) * (1 - Math.exp(-dt / 3));
    state.pale = pale; state.gain = wantGain;
    const dark = 1 - pale, level = 0.86 + 0.14 * k;
    flame.copy(amber).lerp(deepFlame, pale); core.copy(coreLit).lerp(deepCore, pale);
    if (g && g.color) { flame.set(g.color); core.copy(flame).lerp(coreLit, 0.5 * dark); }
    gu.uFlame.value.copy(flame); gu.uCore.value.copy(core); gu.uGlow.value.copy(amber);
    gu.uFlameGain.value = (1.0 + 1.25 * dark) * level * wantGain;         // in the dark it is light (above 1 it blooms); in a pale place it is paint
    gu.uGlowGain.value = dark * dark * 0.62 * level * wantGain;
    gu.uPoolGain.value = dark * dark * 0.24 * level * wantGain;
    gu.uCover.value = 0.25 + 0.72 * pale;
    for (const b of [lotus, globes]) {
      b.u.uHeart.value.copy(heart).lerp(deepHeart, pale); b.u.uMid.value.copy(midc).lerp(deepMid, pale); b.u.uTip.value.copy(tip).lerp(deepTip, pale);
      if (g && g.color) b.u.uMid.value.set(g.color);
      // the paper: lit from within in the dark; in a pale place a colour. (The round lanterns a little less: at the
      // lotus's level thirteen of them side by side in mist ran together into one white arch)
      b.u.uLit.value = (0.42 + 0.78 * dark) * level * wantGain * (b === globes ? 0.72 : 1);
      b.u.uPaint.value = pale;
    }
    const veil = 1 - smooth(0.6, 0.97, realms.veil || 0);           // (the fog thickens with the veil and takes them by itself; this is the last of it)

    // ---- the breath that runs down the lane, from the boat to the arch
    let crest = -1e9;
    if (pulseOn && !calm) {
      breathAt += dt; if (breathAt > PULSE.every) breathAt -= PULSE.every;
      if (breathAt < PULSE.sweep) { const u = breathAt / PULSE.sweep; crest = boat.s + NEAR - PULSE.width + u * (FAR + 2.5 * PULSE.width); }
    }
    const breath = (at) => { const x = (at - crest) / PULSE.width; return PULSE.gain * Math.exp(-x * x); };

    // ---- the lane
    let sMin = Infinity, sMax = -Infinity;
    for (let i = 0; i < STATIONS; i++) { s[i] += flow * dt; if (s[i] < sMin) sMin = s[i]; if (s[i] > sMax) sMax = s[i]; }
    const fade = dt / (calm ? 3.2 : 1.6), cols = inst.colliders, bowX = boat.x + fx * 2.0, bowZ = boat.z + fz * 2.0;
    const water = engine.water, laneEnd = gate.on ? gate.end - 1.5 : L - 3;
    const big = engine.quality && /phone|low/.test(String(engine.quality.level || '')) ? 1.3 : 1;      // (a small picture: the lanterns a third larger, or they are a few pixels)
    const oared = !!(boat.model && boat.model.rower), lead = PART.lead + PART.leadPerSpeed * Math.min(9, Math.max(0, boat.speed || 0));
    let shown = 0;
    for (let i = 0; i < STATIONS; i++) {
      let rel = s[i] - boat.s;
      // The lane is one chain, from ASTERN behind the boat to FAR ahead of it. A pair that the boat has passed goes out,
      // waits closed behind it, and when it has fallen ASTERN behind opens again at the far end. A boat that stands, or
      // is backed, or heads back up the route, is passed by the pairs that wait behind it (they open as they come, are
      // eased round the hull, and go on ahead, as anything on the current passes a boat that is held), and one that has
      // run on beyond the far end joins the end of that line. Either way it is first lit where it is not seen.
      const behind = passing ? ASTERN + 0.5 : PASSED;
      if (!passing && rel < -ASTERN && there[i] <= 0) { s[i] = Math.max(sMax + gap[i], boat.s + FAR); sMax = s[i]; px[i * 2] = pz[i * 2] = px[i * 2 + 1] = pz[i * 2 + 1] = 0; rel = s[i] - boat.s; state.moved++; }
      else if (passing && rel > FAR + 1) { s[i] = Math.min(sMin - gap[i], boat.s - ASTERN); sMin = s[i]; there[i] = 0; px[i * 2] = pz[i * 2] = px[i * 2 + 1] = pz[i * 2 + 1] = 0; rel = s[i] - boat.s; state.moved++; }
      const on = rel > -behind && rel < FAR + 1 && s[i] > 1.5 && s[i] < laneEnd;
      there[i] = Math.min(1, Math.max(0, there[i] + (on ? fade : -fade)));
      const sc = Math.min(L - 2.5, Math.max(1.5, s[i])), at = path.at(sc, _p);
      const lane = Math.max(1.1, Math.min(LANE, at.halfWidth - 1.6));
      // how much of it is there: lit and put out over a second or more, thinning with distance and toward the lane's end
      const a0 = there[i] * (1 - smooth(FAR - 30, FAR, rel)) * (1 - smooth(laneEnd - 7, laneEnd, s[i])) * smooth(1.5, 8, s[i])
        * (1 - overtaken * (1 - smooth(-ASTERN + 0.5, -ASTERN + 12, rel)));       // (one that comes down the route toward the boat is lit as it nears)
      const br = breath(s[i]);
      for (let side = 0; side < 2; side++) {
        const j = i * 2 + side, sgn = side ? 1 : -1;
        const d = sgn * lane + off[j] + WANDER * (0.7 * Math.sin(time * rate[j] + phase[j]) + 0.3 * Math.sin(time * rate[j] * 2.7 + phase[j] * 2));
        let x = at.x + at.rx * d + px[j], z = at.z + at.rz * d + pz[j], pushed = false;
        if (there[i] > 0) {
          const part = () => {
            const dx = x - boat.x, dz = z - boat.z, ahead = dx * fx + dz * fz, lat = dx * rx + dz * rz;
            if (ahead < -4 || ahead > 16 || Math.abs(lat) > 4) return;
            const side = Math.abs(lat) > 0.02 ? Math.sign(lat) : sgn, w = partHalf(ahead, side > 0, lead, oared);
            if (Math.abs(lat) < w) { const move = side * w - lat; px[j] += rx * move; pz[j] += rz * move; x += rx * move; z += rz * move; pushed = true; }
          };
          part();
          if (cols) for (let c = 0; c < cols.length; c++) {
            const o = cols[c]; if (o.soft) continue;
            const dx = x - o.x, dz = z - o.z, dist = Math.hypot(dx, dz), min = o.r + 0.6;
            if (dist < min) { const out = (min - dist) / Math.max(dist, 1e-3), ox = dist > 1e-3 ? dx * out : min, oz = dist > 1e-3 ? dz * out : 0; px[j] += ox; pz[j] += oz; x += ox; z += oz; pushed = true; }
          }
          const far = Math.hypot(px[j], pz[j]);
          if (far > 6) { px[j] *= 6 / far; pz[j] *= 6 / far; }
          if (!path.softEdges) {                                      // still inside the channel
            x = at.x + at.rx * d + px[j]; z = at.z + at.rz * d + pz[j];
            const q = path.locate(x, z, sc, _loc), lim = Math.max(0.5, q.halfWidth - 0.9);
            if (Math.abs(q.d) > lim) { const over = (Math.abs(q.d) - lim) * Math.sign(q.d); px[j] -= q.rx * over; pz[j] -= q.rz * over; }
          }
          x = at.x + at.rx * d + px[j]; z = at.z + at.rz * d + pz[j];
          part();                                                     // (the boat has the last word: a lantern between the hull and a bank goes with the hull)
        }
        if (!pushed) { const back = Math.exp(-dt * 0.3); px[j] *= back; pz[j] *= back; }      // and it finds its way back to its row
        const a = a0;
        if (a > 0.01) {
          shown++;
          if (debugAt !== null) { const n = state.nearest; n.hull = Math.min(n.hull, Math.hypot(x - boat.x, z - boat.z)); n.bow = Math.min(n.bow, Math.hypot(x - bowX, z - bowZ)); n.eye = Math.min(n.eye, Math.hypot(x - (boat.x - fx * 0.45), z - (boat.z - fz * 0.45))); }
        }
        const h = water && water.heightAt ? water.heightAt(x, z) : 0, t = time + phase[j] * 3;
        const y = (Number.isFinite(h) ? h : 0) + bob * (0.008 * Math.sin(t * 1.15) + 0.005 * Math.sin(t * 1.9 + 1.3));
        _e.set(bob * 0.03 * Math.sin(t * 0.9 + 0.7), phase[j] + time * spin[j], bob * 0.026 * Math.sin(t * 1.3));      // (it turns slowly on the water, as a floating flower does)
        _m.compose(_v.set(x, y, z), _q.setFromEuler(_e), _sc.setScalar(size[j] * big));
        lotus.mesh.setMatrixAt(j, _m);
        const A = lotus.aux.array; A[j * 4] = a * veil; A[j * 4 + 1] = br; A[j * 4 + 2] = phase[j];
        iPos.array[j * 4] = x; iPos.array[j * 4 + 1] = y; iPos.array[j * 4 + 2] = z; iPos.array[j * 4 + 3] = size[j] * big;
        iAux.array[j * 4] = phase[j]; iAux.array[j * 4 + 1] = a * veil; iAux.array[j * 4 + 3] = br;
        // it sits in the water: now and then a pin ring leaves it
        if (a > 0.3 && !calm && water && typeof water.ripple === 'function') { ring[j] -= dt; if (ring[j] <= 0) { ring[j] = 5 + 5 * ((j * 7 + Math.floor(time)) % 5) / 5; if (Math.abs(rel) < 30) water.ripple(x, z, 0.035, 0.1); } }
      }
    }

    // ---- the arch over the way out
    const gRel = gate.on ? gate.s - boat.s : 0;
    const gWant = gate.on && gRel > -4 ? 1 : 0;
    gate.there = Math.min(1, Math.max(0, gate.there + (gWant ? fade * 0.6 : -fade)));
    const gA = gate.there * veil, gBr = gate.on ? breath(gate.s) + (calm ? 0 : 0.1 * Math.sin(time * 0.8)) : 0;
    for (let i = 0; i < GATE; i++) {
      const j = LN + i, th = Math.PI * (i + 0.5) / GATE, t = time + gph[i] * 3;
      const d = Math.cos(th) * gate.half + bob * 0.05 * Math.sin(t * 0.5), y = ARCH.foot + Math.sin(th) * ARCH.rise + bob * 0.06 * Math.sin(t * 0.7 + 1.0);
      const x = gate.x + gate.rx * d, z = gate.z + gate.rz * d;
      _e.set(bob * 0.05 * Math.sin(t * 0.6), gate.heading + gph[i], bob * 0.05 * Math.sin(t * 0.8 + 2.0));
      _m.compose(_v.set(x, y, z), _q.setFromEuler(_e), _sc.setScalar(gsz[i] * big));
      globes.mesh.setMatrixAt(i, _m);
      const A = globes.aux.array; A[i * 4] = gA; A[i * 4 + 1] = gBr; A[i * 4 + 2] = gph[i];
      iPos.array[j * 4] = x; iPos.array[j * 4 + 1] = y; iPos.array[j * 4 + 2] = z; iPos.array[j * 4 + 3] = gsz[i] * big;
      iAux.array[j * 4] = gph[i]; iAux.array[j * 4 + 1] = gA; iAux.array[j * 4 + 3] = gBr - 0.45;        // (and their halos less, for the same reason)
      if (gA > 0.01) shown++;
    }
    state.shown = shown;
    lotus.mesh.instanceMatrix.needsUpdate = true; lotus.aux.needsUpdate = true; globes.mesh.instanceMatrix.needsUpdate = true; globes.aux.needsUpdate = true;
    iPos.needsUpdate = true; iAux.needsUpdate = true;
    globes.mesh.visible = gA > 0.004;
    group.visible = shown > 0;
    if (debugAt !== null && !logged && time >= debugAt) {
      logged = true;
      const L0 = inst.lookEnd && realms.lookNow && realms.lookNow.fog ? realms.lookNow : inst.look;
      console.error('wf ' + JSON.stringify({ area: inst.id, s: +boat.s.toFixed(1), nearest: [+state.nearest.hull.toFixed(2), +state.nearest.bow.toFixed(2), +state.nearest.eye.toFixed(2)], moved: state.moved, relaid: state.relaid, length: +L.toFixed(1), shown, need: +need.toFixed(2), drift: +state.drift.toFixed(2), strength: +state.strength.toFixed(2), pale: +pale.toFixed(2),
        fogLum: +(lum(L0.fog.color) * (L0.exposure || 1)).toFixed(3), flow: +flow.toFixed(2), veil: +(realms.veil || 0).toFixed(2), gate: gate.on ? { s: +gate.s.toFixed(1), half: +gate.half.toFixed(1), there: +gate.there.toFixed(2) } : null,
        colliders: cols ? cols.length : 0, rel: Array.from(s, (v) => +(v - boat.s).toFixed(0)), there: Array.from(there, (v) => +v.toFixed(1)),
        aside: Array.from(px, (v, i) => +Math.hypot(v, pz[i]).toFixed(1)), d: +boat.d.toFixed(1), off: +(Math.acos(Math.max(-1, Math.min(1, fx * tx + fz * tz))) * 57.3).toFixed(0) }));
    }
  }

  return { update, group, state };
}
