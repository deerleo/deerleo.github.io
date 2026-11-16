// The theatre of leaves: THE WEATHER. Stage 3, the cast, group "Weather": the air of the room. What falls from the
// tear (the rain's streaks, the heavy drops under the limbs, the row of drips, the keystones' drops), what burns
// (the steam over the flames that hang in the rain; the flames themselves are the kit's), and the one draught that
// moves both (docs/art/theatre.md, section 5: the rows Rain, Candle flames, The rain column and the shaft, The crown
// and its chandelier, Cloud and moon, The kindling). How it was made, how to see it, what it costs and what is still
// to do: docs/build/theatre/3-cast-weather.md. Its numbers: plan.js, "the cast: weather".
//
//   THE RAIN'S STREAKS are this module's own shader (the toolkit's veils are far curtains the boat never reaches, and
//   nothing gives a column lit only inside a shaft): the first builder's stand-in arithmetic, made rain. Each streak
//   is drawn along its own fall, so the whole column leans with the draught (shared.air.leaning, read every frame);
//   no two are a length, a weight or a pace; denser and thinner sheets sink through the column; it is lit by the
//   moon only inside the shaft, by the fire in the tree beside the chandelier, and goes warm with the lit house as
//   the shaft does. Never in the water's mirror, never outside the column, never across the rider's eye.
//
//   DROPS. One small instanced bead with a tail serves every drop that gathers and falls in this room, each timed in
//   script (the toolkit's `drip` falls to one level and lets go when it likes; these land on what is really under
//   them, and the row lets go in turn): the heavy drops under the limbs (shared.tree.drips, the end of the
//   chandelier's spare chain, the tear's rim), each one's way down ray-cast against the tree's own models when the
//   area is built; the row under the left tier-1 front, which hang from the gilt bead of the parterre boxes' heads
//   and land on the velvet rail (that is what is under them: the page has them fall in the water); the three
//   keystones'. A drop swells where it hangs, lets go, falls as water falls and never faster than nine metres a
//   second. Where it lands it throws up a crown of droplets (the same bead, thrown), writes its ring on the water
//   and calls the staging's hook. None lets go over the rider's boat.
//
//   STEAM. A thread over each of the chandelier's 96 flames, which hang in the rain: it leaves the flame's tip in
//   breaths, each wick in its own time, rises a hand or two, widens, leans further than the flame and is gone. On
//   the chandelier's own frame, so it swings with it.
//
//   THE AIR. shared.cast.air gathers what the set left scattered (the column's lean and the moon's strength in
//   set.js, the crown's gust and the chandelier's swing in tree.js, the lustres' and the flames' in kit_tiers.js,
//   the cloth's in kit_floor.js, heroes_house.js and cast_cloth.js) into one draught and one gust. Left alone it
//   keeps the page's times on the show clock: the column leans four degrees from the hour and six through the fall.
//
// Everything this module draws is light in the room's own light: the shaft's uniforms are the house's (lib.js,
// shared.house.U), so the rain is lit exactly where the shaft lights the trunk; drops also take the bow lantern, the
// fire in the tree and the lit house. It plays no sound and places no cue: what the staging drives and hears is
// listed at the end of build().
//
// Developer switches (with ?realm=theatre): &rain=0 the first builder's stand-in instead;  &wxn=0.5 a share of the streaks;
// &wxmark=0 the streaks left to the painter's filter;  &wxgain=1 their strength;  &wxlean=6 the column held leaning (degrees);
// &wxgust=3 the gust, three seconds in (&wxall=1: for the whole cast);  &wxheavy=6 six times as many heavy drops;  &wxrow=2 a turn of the drip row every two
// seconds;  &wxkey=3 the keystones' turn begun three seconds in;  &wxpins=1 a red pin at every place a drop hangs and a green
// one where it lands;  &wxlog=8 after eight seconds, every hook this module has fired (printed as page errors that are not);
// &wxdrops=0  &wxsteam=0  &wxplanks=0 leave a part out;  &wxsteamk=1 the steam's strength;  &wxdraught=2 the draught held (0 still, 1 the hour's, 2 the fall's);
// &wxdropcap=0.24 the most light a face of a drop gives.
import * as THREE from 'three';
import { FOG_PARS, NOISE_GLSL } from '../../engine/kit.js';
import { lifeTime } from '../../engine/life/falls.js';
import { at, house, dev } from './lib.js';

const TAU = Math.PI * 2, G = 9.81;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const S01 = (x) => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
const smooth = (a, b, x) => S01((x - a) / (b - a));
const targetHeight = (renderer) => { const rt = renderer.getRenderTarget(); return rt ? rt.height : renderer.getDrawingBufferSize(new THREE.Vector2()).y; };
/** Seconds a drop takes to fall h metres, never going faster than vmax (the toolkit's own arithmetic: falls.js). */
const dropTime = (h, vmax) => { const tc = vmax / G, hc = 0.5 * G * tc * tc; return h <= hc ? Math.sqrt(2 * Math.max(h, 0) / G) : tc + (h - hc) / vmax; };
// light added to the picture, with an alpha of its own: where a mark is asked for it carries gouache's CRISP_ALPHA, which
// keeps the painter's filter off that pixel (a streak is a pixel wide: the filter takes two in three of them away)
const ADDED = { transparent: true, depthWrite: false, fog: false, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
  blendEquationAlpha: THREE.AddEquation, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneFactor };

/** A pearl with a hair of a tail: a round head (its foot down, y -1, in radii) and, from its shoulder, a fine thread to a tip; aTail
 *  says how far along the thread a point is: the shader draws the thread out in metres (the way the drop goes in a thirtieth of a
 *  second) and lets its light die toward the tip.
 *  (Second look: the bead was a body that tapered from its full width to its tip, and falling it was a wedge of white: a dart, a tooth.
 *  What the eye gets of a falling drop is a point of light and a hair behind it.) */
function beadGeometry() {
  const rings = [[0.75, -0.6, 0], [1.0, 0.0, 0], [0.8, 0.62, 0], [0.42, 1.08, 0.06], [0.4, 1.3, 0.3], [0.36, 1.45, 0.65]], N = 6, pos = [0, -1, 0], tail = [0], idx = [];
  for (const [r, y, t] of rings) for (let i = 0; i < N; i++) { const a = i / N * TAU; pos.push(Math.cos(a) * r, y, Math.sin(a) * r); tail.push(t); }
  pos.push(0, 1.6, 0); tail.push(1);
  const tip = 1 + rings.length * N;
  for (let i = 0; i < N; i++) { const j = (i + 1) % N; idx.push(0, 1 + i, 1 + j); }
  for (let k = 0; k < rings.length - 1; k++) for (let i = 0; i < N; i++) { const j = (i + 1) % N, a = 1 + k * N + i, b = 1 + k * N + j, c = a + N, d = b + N; idx.push(a, c, b, b, c, d); }
  for (let i = 0; i < N; i++) { const j = (i + 1) % N, a = 1 + (rings.length - 1) * N; idx.push(a + i, tip, a + j); }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aTail', new THREE.Float32BufferAttribute(tail, 1)); g.setIndex(idx);
  return g;
}

export async function build(ctx, plan, shared) {
  shared.cast = shared.cast || {};
  const W = plan.castWeather;
  if (!W || !W.on) return {};                                               // (&rain=0: the first builder's stand-in stands instead)
  const H = house(ctx, plan, shared), U = H.U, sh = ctx.engine.shared, clock = lifeTime(ctx), show = shared.show || { c: -1, k: 0 };
  const num = (k, d) => (dev.has(k) && dev.get(k) !== '' && Number.isFinite(+dev.get(k)) ? +dev.get(k) : d);
  const off = (k) => dev.get(k) === '0';
  const calm = !!ctx.reducedMotion;
  const S = plan.shaft, B = plan.beech, T = shared.tree || null, ahead = ctx.path.at(plan.tear.s);
  const axis = at(ctx, B.s, B.d, 0);
  const pearl = new THREE.Color('#C4D6D0'), warm = new THREE.Color('#F0C590'), gold = new THREE.Color('#FFB964');
  const fireAt = at(ctx, plan.chandelier.s, plan.chandelier.d, 17.6);
  const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
  const _v = V3(), _w = V3();

  // what every part of the weather shares: the realm's clock, the shaft (the house's own uniforms), the column's lean (metres
  // carried for each metre fallen, about the shaft's own top, where set.js leans the shaft), the fire in the tree, the lights
  const UW = {
    uLifeNow: clock.uLifeNow, uShaft: U.uShaft, uShaftLean: U.uShaftLean,
    uFogColor: sh.uFogColor, uFogDensity: sh.uFogDensity, uVeil: sh.uVeil, uVeilColor: sh.uVeilColor,
    uLean: { value: new THREE.Vector4(0, 0, S.top, 0) },
    uFire: { value: new THREE.Vector4(fireAt.x, fireAt.y, fireAt.z, 0) },
    uDown: { value: new THREE.Vector2(ahead.tx, ahead.tz) },
    uPearl: { value: pearl.clone() }, uGold: { value: gold.clone() }, uPpm: { value: 780 },
  };
  const ppm = (mat) => (renderer, scene, camera) => { UW.uPpm.value = targetHeight(renderer) * 0.5 * camera.projectionMatrix.elements[5]; mat.uniformsNeedUpdate = true; };

  // ============================================================================================ the rain's streaks
  const R = W.rain;
  let rain = null;
  {
    const n = Math.max(1, Math.round(ctx.kit.count(R.streaks) * clamp(num('wxn', 1), 0.02, 1))), rnd = ctx.rng(6001);
    const base = new THREE.PlaneGeometry(1, 1); base.translate(0, 0.5, 0);                // y 0: its head, the lower end .. 1: its tail
    const geo = new THREE.InstancedBufferGeometry();
    geo.index = base.index; geo.setAttribute('position', base.attributes.position);
    const seed = new Float32Array(n * 4), kind = new Float32Array(n * 4), fade = S.rain.fadeTo - S.rain.fadeFrom;
    const underTear = (r, a) => { if (!plan.inTear || !ctx.path.locate) return true; const q = ctx.path.locate(axis.x + Math.cos(a) * (r + 0.35), axis.z + Math.sin(a) * (r + 0.35)); return plan.inTear(q.s, q.d); };
    for (let i = 0; i < n; i++) {
      // thinning from 8 to 10.5 m; and none where what is left of the dome is over it (second look: the tear's own ragged outline, plan.inTear,
      // comes inside 10.5 m on two sides, and a streak there fell out of painted plaster)
      let r, a, tries = 0; do { r = Math.sqrt(rnd()) * S.rain.fadeTo; a = rnd() * TAU; } while ((rnd() > 1 - Math.max(0, (r - S.rain.fadeFrom) / fade) || !underTear(r, a)) && tries++ < 40);
      seed.set([r, a, rnd(), rnd()], i * 4);
      // length; weight (most are fine, one in eight is a heavier drop: longer, brighter, a little faster); pace
      const heavy = rnd() < 0.125, w = heavy ? 0.95 + 0.4 * rnd() : 0.42 + 0.5 * rnd() * rnd();
      kind.set([lerp(R.length[0], R.length[1], heavy ? 0.6 + 0.4 * rnd() : rnd() * 0.8), w, R.speed * (1 + R.paces * (heavy ? 0.4 + 0.6 * rnd() : 2 * rnd() - 1.2)), rnd()], i * 4);
    }
    geo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seed, 4)); geo.setAttribute('aKind', new THREE.InstancedBufferAttribute(kind, 4)); geo.instanceCount = n;
    const mat = new THREE.ShaderMaterial({
      uniforms: { ...UW, uCol: { value: new THREE.Vector4(axis.x, R.top, axis.z, R.comesIn) }, uP: { value: new THREE.Vector4(R.near[0], R.near[1], R.veil, num('wxgain', R.gain)) },
        uMark: { value: num('wxmark', 1) }, uFireK: { value: R.fire } },
      ...ADDED, side: THREE.DoubleSide,
      vertexShader: /* glsl */`
        attribute vec4 aSeed, aKind; uniform float uLifeNow, uPpm, uFireK; uniform vec4 uCol, uShaft, uLean, uFire, uP; uniform vec2 uShaftLean, uDown;
        varying float vA, vFire, vAcross, vAlong, vDist, vSoft;
        void main() {
          float top = uCol.y, y = top - mod(uLifeNow * aKind.z + aSeed.z * top, top);
          vec3 c = vec3(uCol.x + cos(aSeed.y) * aSeed.x, y, uCol.z + sin(aSeed.y) * aSeed.x);
          c.xz += uLean.xy * (uLean.z - y);                                   // the draught carries it: the column leans about the tear
          vec3 dir = normalize(vec3(uLean.x, -1.0, uLean.y));                 // the way it falls: a streak lies along it
          vec3 toCam = cameraPosition - c; vDist = length(toCam);
          vec3 sd = cross(toCam, dir); float sl = length(sd);
          vec3 side = sd / max(sl, 1e-5);
          // A FINE THREAD, NEVER A STICK. Its light is laid across a little over two pixels with a soft fall to either side (a line
          // one pixel wide breaks into dashes as it crosses the pixel grid), and it is as much fainter as it is drawn wider than
          // the water itself; within a few metres of the eye it is out of focus: wider still, and faint.
          vSoft = 1.0 - smoothstep(2.5, 11.0, vDist);
          float wide = max(0.009 * (1.0 + 1.6 * vSoft), 2.2 * vDist / uPpm);
          vec3 p = c - dir * (position.y * aKind.x) + side * (position.x * wide);
          // lit only inside the shaft
          vec2 q = c.xz - (uShaft.xy + uShaftLean * c.y);
          float lit = (1.0 - smoothstep(uShaft.z * 0.85, uShaft.z * 1.12, length(q))) * uShaft.w;
          // the light comes toward the arches: the rain is brightest seen against it
          float against = mix(0.5, 1.25, smoothstep(-0.5, 0.7, dot(normalize(c.xz - cameraPosition.xz), uDown)));
          // denser and thinner sheets of it, sinking through the column and crossing it
          float sheet = 0.5 + 0.5 * sin(c.x * 0.52 + c.z * 0.29 + (c.y + uLifeNow * 2.4) * 0.19) * sin(c.z * 0.44 - c.x * 0.21 + (c.y + uLifeNow * 3.1) * 0.12 + 1.7);
          float veil = 1.0 - uP.z * sheet;
          // it comes in out of nothing at the top, ends on the water, never crosses the eye, and seen along its own fall (straight overhead) it is nothing
          float thin = min(1.0, 0.0176 / wide) * mix(0.3, 1.0, smoothstep(3.0, 15.0, vDist));
          float ends = smoothstep(0.0, 0.7, y) * smoothstep(0.0, uCol.w, top - y) * smoothstep(0.03, 0.16, sl / max(vDist, 1e-4));
          float k = aKind.y * thin * ends * smoothstep(uP.x, uP.y, vDist);
          vA = lit * against * veil * k;
          vec3 tf = c - uFire.xyz;
          vFire = uFire.w * uFireK * k / (1.0 + dot(tf, tf) / 20.0);        // the fire in the tree on the rain beside it
          vAcross = position.x * 2.0; vAlong = position.y;
          gl_Position = (vA + vFire) < 0.004 ? vec4(2.0, 2.0, 2.0, 1.0) : projectionMatrix * viewMatrix * vec4(p, 1.0);
        }`,
      fragmentShader: /* glsl */`
        uniform vec3 uPearl, uGold; uniform vec4 uP; uniform float uMark; ${FOG_PARS}
        varying float vA, vFire, vAcross, vAlong, vDist, vSoft;
        void main() {
          // soft across; strongest just behind its head, drawn out thin behind
          float prof = max(1.0 - abs(vAcross), 0.0) * smoothstep(0.0, 0.08, vAlong) * mix(1.0, 0.22, vAlong) * (1.0 - fogAmount(vDist)) * (1.0 - uVeil);
          vec3 col = (uPearl * vA + uGold * vFire) * (uP.w * prof);
          float s = max(col.r, max(col.g, col.b));
          if (s < 0.002) discard;
          gl_FragColor = vec4(col, -15.0 * uMark * (1.0 - 0.8 * vSoft) * smoothstep(0.012, 0.06, s));      // (the mark that keeps the painter's filter off a thread; a soft near one is broad enough to be paint)
        }`,
    });
    rain = new THREE.Mesh(geo, mat);
    rain.name = `rain streaks x ${n}`; rain.frustumCulled = false; rain.renderOrder = 4;
    rain.onBeforeRender = ppm(mat);
    ctx.add(rain); ctx.only(rain, 'direct');                                 // never in the water's mirror (and, being light drawn after the water, never in the picture the water reads as what lies beneath)
  }

  // ============================================================================================ what the staging hears
  // shared.cast.air.on: each null until the staging attaches a function. Nothing is played here.
  const air = shared.cast.air = { on: { drop: null, tick: null, breath: null, bloom: null, sparkle: null } };
  shared.cast.weather = air;                                               // (the same handle under the group's own name, for whoever looks there)
  const logAt = dev.has('wxlog') ? num('wxlog', 8) : null, logged = [];
  if (logAt != null) for (const name of Object.keys(air.on)) air.on[name] = (e) => logged.push(`${name}:${(e.what || '')}${e.on ? '/' + e.on : ''}${e.i != null ? '#' + e.i : ''}${e.tier ? '#' + e.tier : ''}@${ctx.time.toFixed(1)}(s${(-e.z).toFixed(0)},d${e.x.toFixed(0)},y${e.y.toFixed(1)})`);
  const fire = (name, p, info) => { const f = air.on[name]; if (!f) return; try { f({ x: p.x, y: p.y, z: p.z, ...info }); } catch (err) { console.error(`theatre/cast_weather: the hook '${name}' threw: ${(err && err.message) || err}`); } };

  // ============================================================================================ the rider's boat
  // Where it is, where it will be, and whether a place is under it: no drop lets go over the boat, and the rain knocks on its planks.
  const boat = { x: ctx.boat.x, z: ctx.boat.z, vx: 0, vz: 0, was: null };
  const overBoat = (x, z, inSeconds, margin) => {
    const bx = boat.x + boat.vx * inSeconds, bz = boat.z + boat.vz * inSeconds, h = ctx.boat.heading, fx = -Math.sin(h), fz = -Math.cos(h);
    const rx = x - bx, rz = z - bz, along = rx * fx + rz * fz, across = Math.abs(rx * fz - rz * fx);
    return along > -1.7 - margin && along < 2.5 + margin && across < 0.72 + margin;
  };

  // ============================================================================================ drops
  // One instanced bead for every drop and every droplet of a crown. A drop: aFrom = where it hangs and the level it lands on;
  // aGo = when it lets go, 0, its radius, its strength; aVel = how far the draught carries it, seconds it swells, the most it falls at,
  // the lit column's glint in it. A droplet of a crown: aFrom = where it is thrown from and the level it ends on; aGo = when, 1 (and
  // above the 1 its glint), radius, strength; aVel = its velocity and how long it lives. The jet that stands up out of the middle of a
  // crown: the same, with 2 for the 1; only its speed upward counts.
  const DROPS = 64, SPRAY = 256, POOL = DROPS + SPRAY;
  const rs = ctx.rng(6002), rc = ctx.rng(6003);
  let drops = null, aFrom = null, aGo = null, aVel = null, dropHead = 0, sprayHead = 0, dirty = false;
  const wantDrops = !off('wxdrops');
  if (wantDrops) {
    const geo = beadGeometry();
    aFrom = new THREE.InstancedBufferAttribute(new Float32Array(POOL * 4), 4); aGo = new THREE.InstancedBufferAttribute(new Float32Array(POOL * 4), 4); aVel = new THREE.InstancedBufferAttribute(new Float32Array(POOL * 4), 4);
    for (const a of [aFrom, aGo, aVel]) a.setUsage(THREE.DynamicDrawUsage);
    for (let i = 0; i < POOL; i++) aGo.setXYZW(i, -1e6, 1, 0, 0);                         // nothing yet
    geo.setAttribute('aFrom', aFrom); geo.setAttribute('aGo', aGo); geo.setAttribute('aVel', aVel); geo.instanceCount = POOL;
    const mat = new THREE.ShaderMaterial({
      uniforms: { ...UW, uDropK: { value: num('wxdropk', W.dropLight ?? 0.27) }, uDropCap: { value: num('wxdropcap', W.dropCap ?? 0.24) }, uRoom: { value: new THREE.Color(0, 0, 0) }, uLanternPos: sh.uLanternPos || { value: V3(0, -100, 0) }, uLanternColor: sh.uLanternColor || { value: new THREE.Color(0, 0, 0) },
        uDropFar: { value: num('wxfar', W.dropFar ?? 0.9) },
        uDropTail: { value: new THREE.Vector3(num('wxtail', W.tail ? W.tail[0] : 0.04), W.tail ? W.tail[1] : 0.02, W.tail ? W.tail[2] : 0.5) } },      // seconds of its way a drop's thread is, and a thrown droplet's; how much of its head's light a jet's column keeps
      ...ADDED, side: THREE.DoubleSide,                                      // (both faces are drawn and added: a bead is brightest through its middle)
      vertexShader: /* glsl */`
        attribute float aTail; attribute vec4 aFrom, aGo, aVel;
        uniform float uLifeNow, uPpm, uDropK, uDropFar; uniform vec4 uShaft, uLean, uFire; uniform vec2 uShaftLean; uniform vec3 uPearl, uGold, uRoom, uLanternPos, uLanternColor, uDropTail;
        varying vec3 vL, vN, vV; varying float vK, vDist;
        void main() {
          // what it is: 0 a drop, 1 one of a crown, 2 the jet in a crown's middle. Its thread is tailM metres long and lies along up
          float tm = uLifeNow - aGo.x, live = 0.0, r = aGo.z, tailM = 0.0, kind = floor(aGo.y + 0.001), minPx = 1.3, fade = 1.0; vec3 c = aFrom.xyz, up = vec3(0.0, 1.0, 0.0);
          if (kind < 0.5) {
            // a drop: it swells where it hangs, lets go, and falls as water falls, never faster than its most
            float swell = aVel.y, vmax = aVel.z, h0 = max(aFrom.y - aFrom.w, 0.0), tc = vmax / 9.81, hc = 4.905 * tc * tc;
            float Tf = h0 <= hc ? sqrt(2.0 * h0 / 9.81) : tc + (h0 - hc) / vmax;
            float f = clamp(tm, 0.0, Tf), fallen = f < tc ? 4.905 * f * f : hc + vmax * (f - tc), speed = min(9.81 * f, vmax);
            live = step(-swell, tm) * step(tm, Tf);
            float grown = smoothstep(-swell, -0.12 * swell, tm), neck = 1.6 * r;
            r *= tm < 0.0 ? 0.35 + 0.65 * grown : 1.0;
            // hanging, it has a neck of its own length up to its place; falling, its thread is the way it goes in a thirtieth of a second,
            // and the thread's tip starts from the place it hung (second look: a pearl with a hair of a tail, never a body)
            tailM = tm < 0.0 ? neck * grown : neck + speed * uDropTail.x;
            c.y -= fallen + neck + (tm < 0.0 ? neck * grown : neck);
            c.xz += uLean.xy * (fallen * aVel.x);                             // a heavy drop is carried a little by the draught
            up = -normalize(vec3(uLean.x * aVel.x, -1.0, uLean.y * aVel.x));  // its thread lies back along its way
          } else if (kind < 1.5) {
            // one of a crown: thrown up and out, and falling back; a hair along its way, as long as it goes in a fiftieth of a second
            float life = aVel.w, f = clamp(tm, 0.0, life); vec3 v0 = aVel.xyz;
            c += v0 * f; c.y -= 4.905 * f * f;
            vec3 vel = v0 - vec3(0.0, 9.81 * f, 0.0); float sp = length(vel);
            live = step(0.0, tm) * step(tm, life) * step(aFrom.w, c.y);
            tailM = sp * uDropTail.y;
            r *= 1.0 - 0.45 * smoothstep(0.55 * life, life, f);
            fade = 1.0 - 0.55 * smoothstep(0.55 * life, life, f);              // it is seen going up and out; falling back it is all but gone
            up = -vel / max(sp, 1e-4); minPx = 0.95;
          } else {
            // the jet: a thin column stands up out of the middle of the crown with a bead on its top, and sinks back into the water it came from
            float life = aVel.w, f = clamp(tm, 0.0, life);
            c.y += aVel.y * f - 4.905 * f * f;
            live = step(0.0, tm) * step(tm, life) * step(aFrom.w + 0.004, c.y);
            tailM = max(c.y - aFrom.w - 1.6 * r, 0.0);
            fade = 1.0 - 0.8 * smoothstep(0.5 * life, 0.95 * life, f);        // it stands up bright and sinks back dim: never a pin left standing in the water
            up = vec3(0.0, -1.0, 0.0);                                        // its bead up, its column down to the water
          }
          vec3 ax = abs(up.y) < 0.95 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
          vec3 rt = normalize(cross(ax, up)), fw = cross(rt, up);
          vec3 toCam = cameraPosition - c; vDist = length(toCam);
          float grow = max(1.0, minPx * vDist / max(r * uPpm, 1e-4));         // never under two and a half pixels across (a thrown droplet: two): fainter instead
          vec3 p = c + (rt * position.x + fw * position.z) * (r * grow) + up * (position.y * r * mix(1.0, grow, 0.5) + aTail * tailM);
          vN = normalize(rt * position.x + up * (position.y * 0.6) + fw * position.z); vV = toCam;
          // the light it is seen by: the moon in the shaft and what spills from it, the bow lantern, the fire in the tree, the lit house
          vec2 sq = c.xz - (uShaft.xy + uShaftLean * c.y); float sr = length(sq);
          float inS = 1.0 - smoothstep(uShaft.z * 0.85, uShaft.z * 1.15, sr), spill = 1.0 - smoothstep(uShaft.z, uShaft.z * 3.2, sr);
          float glint = kind < 0.5 ? aVel.w : (aGo.y - kind) * 2.0;           // the lit column's own glint in it, wherever in the house it falls (the keystones', the row's)
          vec3 L = uPearl * (uShaft.w * (1.3 * inS + 0.34 * spill + glint));
          vec3 tl = uLanternPos - c; L += uLanternColor * (1.5 / (1.0 + 0.4 * dot(tl, tl)));
          vec3 tf = c - uFire.xyz; L += uGold * (uFire.w * 2.2 / (1.0 + dot(tf, tf) / 20.0));
          L += uRoom;
          vL = L * (uDropK * aGo.w * live * fade / pow(grow, uDropFar)) * smoothstep(0.7, 1.4, vDist);      // (drawn larger than it is, it is fainter: by less than its size, or at ride distance a splash is nothing at all)
          // its light is in its head; along the thread it dies toward the tip (a jet's column keeps more of it)
          vK = kind > 1.5 ? mix(1.0, uDropTail.z, smoothstep(0.0, 0.3, aTail)) : mix(1.0, 0.04, pow(aTail, 0.35));
          gl_Position = live < 0.5 ? vec4(2.0, 2.0, 2.0, 1.0) : projectionMatrix * viewMatrix * vec4(p, 1.0);
        }`,
      fragmentShader: /* glsl */`
        uniform float uDropCap; ${FOG_PARS}
        varying vec3 vL, vN, vV; varying float vK, vDist;
        void main() {
          float facing = abs(dot(normalize(vN), normalize(vV)));
          vec3 col = vL * ((0.3 + 0.7 * facing * facing) * vK * (1.0 - fogAmount(vDist)) * (1.0 - uVeil));
          float s = max(col.r, max(col.g, col.b));
          if (s < 0.004) discard;
          // WATER, NOT WHITE PAINT (third holder). Both faces of a bead are added, and in the shaft a drop came out as bright through its
          // whole body as the brightest pixel of the lit rain (220 of 255, measured): a white dart, and its crown white beads. However much
          // light reaches it, a face now gives no more than uDropCap (its hue kept), so a drop is pearl in the moon, gold by the fire, and
          // never the lightest thing in the picture.
          col *= uDropCap * (1.0 - exp(-s / uDropCap)) / s;
          gl_FragColor = vec4(col, -15.0 * smoothstep(0.012, 0.05, s));      // (the painter's mark from low down, as on the streaks: everything of a drop is a hair or a point, and at ride distance, where it is faint, the filter took the whole of a splash away)
        }`,
    });
    drops = new THREE.Mesh(geo, mat);
    drops.name = `drops and their crowns (a pool of ${POOL})`; drops.frustumCulled = false; drops.renderOrder = 4;
    drops.onBeforeRender = ppm(mat);
    ctx.add(drops); ctx.only(drops, 'direct');
  }
  const leanX = () => UW.uLean.value.x, leanZ = () => UW.uLean.value.y;

  // ---- where drops hang. A source: { p (the realm), ground (the level under it), on (what is under it), kind, moving (a function
  // that puts its place in p now), size, weight (how often it is the one), last (when it last let go) }
  const Hv = W.heavy, sources = { heavy: [], row: [], keys: [] };
  const pins = dev.has('wxpins') ? [] : null;
  let under = () => ({ y: 0, on: 'water' });                                 // the first solid thing under a point (below, once the tree's models are known)
  if (wantDrops && T && T.drips && T.drips.length) {
    // what is solid under the limbs: the tree's own models (never its instanced leaves), the chandelier's frame, the mound and what lies on it
    const solids = [], kinds = new Map();
    const take = (root, on) => { if (!root) return; root.updateWorldMatrix(true, true); root.traverse((o) => { if (o.isMesh && !o.isInstancedMesh && o.geometry && !o.geometry.isInstancedBufferGeometry && o.geometry.attributes.position) { solids.push(o); kinds.set(o, on); } }); };
    take(T.trunk && T.trunk.group, 'wood'); take(T.limbs && T.limbs.group, 'wood'); take(T.mound && T.mound.group, 'leaves'); take(T.fallen && T.fallen.group, 'rubble'); take(T.rubble && T.rubble.group, 'rubble');
    take(T.chandelier && T.chandelier.frame, 'gilt');
    const ray = new THREE.Raycaster(); ray.far = 60;
    const DOWN = V3(0, -1, 0), heaved = (shared.kitFloor && shared.kitFloor.heavedSeats) || [];
    under = (p) => {                                                         // the first solid thing under a point: { y, on }
      ray.set(_v.set(p.x, p.y - 0.2, p.z), DOWN);
      const hit = ray.intersectObjects(solids, false)[0];
      let y = hit ? hit.point.y : -1, on = hit ? kinds.get(hit.object) : 'water';
      const m = T.moundHeight ? T.moundHeight(-p.z, p.x) : -1;               // (the mound's own arithmetic, should its model not have been met)
      if (m > y + 0.02 && m > 0.02) { y = m; on = 'leaves'; }
      for (const q of heaved) { const hp = q.position; if (hp && q.top > 0.03 && q.top > y && Math.hypot(hp.x - p.x, hp.z - p.z) < 0.32) { y = q.top; on = 'velvet'; } }
      if (y <= 0.01) { y = 0; on = 'water'; }
      return { y, on };
    };
    for (const p of T.drips) {
      const u = under(p);
      if (p.y - u.y < 1.2) continue;                                         // (nothing to fall through)
      sources.heavy.push({ p: p.clone(), ground: u.y, on: u.on, kind: 'heavy', sway: true, last: -1e9, weight: u.on === 'water' ? 1.5 : 1 });
    }
    // the chandelier's spare chain: rain runs down the frame and off the chain's free end, which swings (its lowest iron, from the model itself)
    const spare = T.chandelier && T.chandelier.spare;
    if (spare && spare.geometry && spare.geometry.attributes.position) {
      spare.geometry.computeBoundingBox(); const bb = spare.geometry.boundingBox, end = V3((bb.min.x + bb.max.x) / 2, bb.min.y, (bb.min.z + bb.max.z) / 2);
      sources.heavy.push({ p: V3(), ground: 0, on: 'leaves', kind: 'heavy', last: -1e9, weight: 2, chain: true,
        moving(s) { spare.updateWorldMatrix(true, false); s.p.copy(end).applyMatrix4(spare.matrixWorld); const m = T.moundHeight ? T.moundHeight(-s.p.z, s.p.x) : -1; s.ground = Math.max(0, m); s.on = m > 0.02 ? 'leaves' : 'water'; } });
    }
    // the tear's rim: where the house's builder says rain gathers (shared.houseModels.dome: drip_0..2). Only those that fall clear
    // of the fronts into the room, the whole height of the house
    const dome = shared.houseModels && shared.houseModels.dome;
    if (dome && dome.points) for (const name of Object.keys(dome.points)) if (name.startsWith('drip_')) {
      let p = null; try { p = dome.point(name); } catch (err) { p = null; }
      if (!p) continue;
      const s = -p.z, d = p.x;
      if (!(s > 34 && s < 82 && Math.abs(d) < plan.frontD(s) - 1.2)) continue;
      const u = under(p);
      sources.heavy.push({ p: p.clone(), ground: u.y, on: u.on, kind: 'heavy', last: -1e9, weight: 1.2, rim: true });
    }
  }
  // the row under the left tier-1 front: one to each parterre box, on the gilt bead of its head; it lands on the velvet rail
  const Dr = W.drips, bays = (shared.kitFloor && shared.kitFloor.bays) || null;
  const onRails = [];                                                        // what grows or lies on the parterre rails: { x, z, r (metres kept clear of it) }
  { const KFl = shared.kitFloor || {};
    for (const f of KFl.ferns || []) onRails.push({ x: f.at.x, z: f.at.z, r: Dr.clear ? Dr.clear[0] : 0.3 });
    for (const t of KFl.trinkets || []) onRails.push({ x: t.at.x, z: t.at.z, r: Dr.clear ? (t.kind === 'over' ? Dr.clear[1] : Dr.clear[2]) : 0.3 }); }
  const railClear = (q) => onRails.every((o) => Math.hypot(o.x - q.x, o.z - q.z) > o.r);
  const skyOnRails = [];                                                     // the fallen sky's own meshes (kit_floor.js), for the piece that leans on a box front
  // the highest face of some meshes under (x, z) and below `top`, whichever way it faces (a ray cast keeps to the faces a material shows); null if none
  const highestUnder = (meshes, x, z, top) => {
    let best = null; const a = V3(), b = V3(), c = V3();
    for (const m of meshes) { const pos = m.geometry.attributes.position, idx = m.geometry.index, n = idx ? idx.count : pos.count, mw = m.matrixWorld;
      for (let i = 0; i + 2 < n; i += 3) {
        a.fromBufferAttribute(pos, idx ? idx.getX(i) : i).applyMatrix4(mw); b.fromBufferAttribute(pos, idx ? idx.getX(i + 1) : i + 1).applyMatrix4(mw); c.fromBufferAttribute(pos, idx ? idx.getX(i + 2) : i + 2).applyMatrix4(mw);
        if (Math.min(a.x, b.x, c.x) > x || Math.max(a.x, b.x, c.x) < x || Math.min(a.z, b.z, c.z) > z || Math.max(a.z, b.z, c.z) < z) continue;
        const d = (b.z - c.z) * (a.x - c.x) + (c.x - b.x) * (a.z - c.z); if (Math.abs(d) < 1e-10) continue;
        const u = ((b.z - c.z) * (x - c.x) + (c.x - b.x) * (z - c.z)) / d, v = ((c.z - a.z) * (x - c.x) + (a.x - c.x) * (z - c.z)) / d, w = 1 - u - v;
        if (u < 0 || v < 0 || w < 0) continue;
        const y = u * a.y + v * b.y + w * c.y; if (y < top && (best == null || y > best)) best = y;
      } }
    return best;
  };
  { const fs = shared.kitFloor && shared.kitFloor.fallenSky, pl = ctx.group && ctx.group.getObjectByName ? ctx.group.getObjectByName('the fallen sky (plaster)') : null;
    for (const m of [fs, pl]) if (m && m.isMesh && m.geometry && m.geometry.attributes.position) { m.updateWorldMatrix(true, false); skyOnRails.push(m); } }
  if (wantDrops) Dr.boxes.forEach((i, k) => {
    const b = plan.parterreBoxes.find((q) => q.side < 0 && q.i === i); if (!b) return;
    const frame = bays && bays.find((q) => q.side === -1 && q.i === i);
    const o = at(ctx, b.s, b.d, 0), ct = Math.cos(b.turn), st = Math.sin(b.turn);
    const place = (x, y, z, out = V3()) => (frame ? frame.at(x, y, z, out) : out.set(o.x + x * ct + z * st, y, o.z - x * st + z * ct));      // the box's own space: x along its front, y up, z into the room
    // (third holder: WHERE NOTHING IS UNDER IT BUT VELVET. The plan's places were chosen by eye before the floor kit grew every opening of the wet
    // side in with ferns and left a shawl over a rail: box 8's drop fell on the shawl. Each now hangs at the place nearest the plan's that is clear
    // of every fern and every thing left on its rail, by the floor kit's own lists)
    let along = Dr.along[k];
    if (onRails.length) for (let j = 0; j <= 40; j++) { const a = clamp(Dr.along[k] + (j % 2 ? 1 : -1) * Math.ceil(j / 2) * 0.05, -1.05, 1.05); if (railClear(place(a, Dr.land, Dr.out, _v))) { along = a; break; } }
    const p = place(along, Dr.y, Dr.out), into = place(along, 0, Dr.out + 1).sub(place(along, 0, Dr.out)).normalize();
    // (a piece of the painted sky leans on box 10's rail from end to end: the drop there lands on the painting, wherever its face is under the bead)
    let ground = Dr.land, on = 'velvet';
    if (skyOnRails.length) { const y = highestUnder(skyOnRails, p.x, p.z, p.y - 0.05); if (y != null && y > Dr.land + 0.02) { ground = y; on = 'plaster'; } }
    // (and where that piece's laths lie over the water in front of the rail, nothing is thrown into the water and no ring is written there)
    const covered = skyOnRails.length > 0 && (highestUnder(skyOnRails, p.x + into.x * Dr.spray, p.z + into.z * Dr.spray, 2.5) ?? -9) > -0.05;
    sources.row.push({ p, ground, on, kind: 'drip', i: k, s: -p.z, into, last: -1e9, along, covered });
  });
  // the three keystones (the house builder's named points: under the foyer-side keystone of each arch)
  { const M = shared.houseModels || {}, Ks = W.keystones;
    const named = [[M.royal_wall_left, 'drip'], [M.royal_box, 'drip_mid'], [M.royal_wall, 'drip']];
    named.forEach(([model, name], k) => {
      let p = null;
      try { if (model && model.point && (!model.points || model.points[name])) p = model.point(name); } catch (err) { p = null; }
      if (!p || !Number.isFinite(p.y) || p.y < 4) p = at(ctx, plan.archWall.s[0] + 0.25, plan.archWall.arches[k], plan.archWall.archHeight - 0.25);      // (the set's own numbers, if the model names none)
      if (wantDrops) sources.keys.push({ p: p.clone(), ground: 0, on: 'water', kind: 'keystone', i: k, last: -1e9, size: Ks.size });
    }); }
  // (&wxtest=s,d,y[,kind]: one more drop, of a kind and from a place of your choosing, timed to land on every whole second: to look at one close)
  if (wantDrops && dev.has('wxtest')) { const q = (dev.get('wxtest') || '').split(','), p = at(ctx, +q[0] || 50, +q[1] || 0, +q[2] || 6), kind = q[3] === 'drip' || q[3] === 'keystone' ? q[3] : 'heavy', u = under(p);
    sources.test = { p, ground: u.y, on: u.on, kind, i: 0, s: -p.z, into: V3(ahead.rx, 0, ahead.rz), last: -1e9, size: kind === 'keystone' ? W.keystones.size : undefined, test: true }; }
  if (pins) { const red = new THREE.MeshBasicMaterial({ color: '#ff3020', fog: false }), green = new THREE.MeshBasicMaterial({ color: '#30ff60', fog: false }), ball = new THREE.SphereGeometry(0.06, 8, 6);
    for (const s of [...sources.heavy, ...sources.row, ...sources.keys]) { if (s.moving) s.moving(s); const a = new THREE.Mesh(ball, red), b = new THREE.Mesh(ball, green); a.position.copy(s.p); b.position.set(s.p.x, s.ground, s.p.z); ctx.add(a); ctx.add(b); ctx.only(a, 'direct'); ctx.only(b, 'direct'); pins.push(a, b); } }

  // ---- letting go, and landing
  const lands = [];                                                          // what is in the air: { t, x, y, z, src, ... } in order of landing
  const write = (i, from, go, vel) => { aFrom.setXYZW(i, from[0], from[1], from[2], from[3]); aGo.setXYZW(i, go[0], go[1], go[2], go[3]); aVel.setXYZW(i, vel[0], vel[1], vel[2], vel[3]); dirty = true; };
  /** Source `src` lets a drop go at clock time `t0` (it has hung there swelling since t0 - swell). False if it may not (the boat will be under it). */
  const letGo = (src, t0, now) => {
    if (!drops) return false;
    if (src.moving) src.moving(src);
    let px = src.p.x, py = src.p.y, pz = src.p.z;
    if (src.sway && T && T.swayAt) { T.swayAt(src.p, _w); px += _w.x; py += _w.y; pz += _w.z; }
    const size = src.size || (src.kind === 'drip' ? Dr.size : Hv.size), swell = src.kind === 'drip' ? Dr.swell : src.kind === 'keystone' ? W.keystones.swell : Hv.swell;
    const carried = src.kind === 'heavy' ? Hv.carried : 0, h0 = Math.max(py - src.ground, 0), Tf = dropTime(h0, Hv.speed), tLand = t0 + Tf;
    if (tLand < now) return true;                                            // (it fell before the rider came)
    const lx = px + leanX() * h0 * carried, lz = pz + leanZ() * h0 * carried;
    if (src.kind !== 'drip' && overBoat(lx, lz, Math.max(0, tLand - now), Hv.clear - 0.72)) return false;
    write(dropHead, [px, py, pz, src.ground], [t0, 0, 0.5 * size * (0.85 + 0.3 * rs()), 1], [carried, swell, Hv.speed, glintOf(src)]);      // (a drop's size is its width: the bead's radius is half of it)
    dropHead = (dropHead + 1) % DROPS;
    src.last = t0;
    let k = lands.length; lands.push(null);
    while (k > 0 && lands[k - 1].t > tLand) { lands[k] = lands[k - 1]; k--; }
    lands[k] = { t: tLand, x: px, y: src.ground, z: pz, h0, carried, src, on: src.on };
    return true;
  };
  // (a droplet's `go` is [when, 1, radius, strength]; `glint`: the lit column's glint in it, as its drop had: it rides in go[1] above the 1.
  // kind 2: the jet in a crown's middle)
  const spray = (from, go, vel, glint = 0, kind = 1) => { go[1] = kind + clamp(glint * 0.5, 0, 0.95); write(DROPS + sprayHead, from, go, vel); sprayHead = (sprayHead + 1) % SPRAY; };      // (half its glint rides above the whole number: up to 1.9)
  const Sp = W.splash;
  /** Fine droplets thrown up and out from (x, y, z) at `t`: `n` of them, k their reach (1: a quarter of a metre across, as water throws
   *  them); `to`: the level they end on. (Second look: they were beads 11 to 19 mm across at full strength: a clutch of white pebbles
   *  that sat on the water for a quarter of a second. Now each is a speck of two or three millimetres with a hair along its way.) */
  const crown = (x, y, z, t, n, k, strength, to = y, glint = 0) => {
    const a0 = rc() * TAU;
    for (let i = 0; i < n; i++) {
      const a = a0 + (i + 0.6 * rc()) / n * TAU, out = (0.3 + 0.22 * rc()) * k, upv = (1.05 + 0.5 * rc()) * Math.sqrt(k), life = 2 * upv / G + 0.02;
      spray([x + Math.cos(a) * 0.03 * k, y + 0.012, z + Math.sin(a) * 0.03 * k, to], [t, 1, lerp(Sp.speck[0], Sp.speck[1], rc()) * Math.sqrt(k), strength], [Math.cos(a) * out, upv, Math.sin(a) * out, life], glint);
    }
  };
  /** WHAT WATER DOES WHERE A DROP GOES IN (second look). A coronet: a low ring of fine droplets that opens to a hand's breadth and is
   *  gone in a tenth of a second. A few thrown higher and further, to a quarter of a metre across (`k`: 1 is the page's crown). And a
   *  breath later the jet: a thin column that stands up out of the middle with a bead on its top and sinks back. The ring is the
   *  water's own (ripple). */
  const splash = (x, z, t, k, strength, glint = 0) => {
    const rk = Math.sqrt(k), a0 = rc() * TAU, n1 = Sp.coronet, n2 = Sp.thrown;
    for (let i = 0; i < n1; i++) {
      const a = a0 + (i + 0.5 * rc()) / n1 * TAU, out = (0.7 + 0.3 * rc()) * k, upv = (0.55 + 0.25 * rc()) * rk;      // (a hand's breadth across in a twentieth of a second, the page's quarter of a metre when it dies)
      spray([x + Math.cos(a) * 0.02 * k, 0.006, z + Math.sin(a) * 0.02 * k, 0], [t, 1, lerp(Sp.speck[0], Sp.speck[1], rc()) * rk, strength], [Math.cos(a) * out, upv, Math.sin(a) * out, 2 * upv / G + 0.01], glint);
    }
    for (let i = 0; i < n2; i++) {
      const a = a0 + 1.3 + (i + 0.7 * rc()) / n2 * TAU, out = (0.3 + 0.4 * rc()) * k, upv = (1.0 + 0.6 * rc()) * rk;
      spray([x + Math.cos(a) * 0.02 * k, 0.01, z + Math.sin(a) * 0.02 * k, 0], [t + 0.015 * rc(), 1, lerp(Sp.speck[0], Sp.speck[1], rc()) * 1.15 * rk, strength], [Math.cos(a) * out, upv, Math.sin(a) * out, 2 * upv / G + 0.01], glint);
    }
    const jv = Sp.jet[1] * rk * (0.9 + 0.2 * rc());
    spray([x, 0.0, z, 0], [t + Sp.jet[0], 2, Sp.jet[2] * rk, strength], [0, jv, 0, 2 * jv / G], glint, 2);
  };
  const glintOf = (src) => (src.kind === 'keystone' ? W.keystones.glint ?? 0.4 : src.kind === 'drip' ? Dr.glint ?? 0.22 : 0);
  const _land = V3();
  const landed = (e, now) => {
    const src = e.src, x = e.x + leanX() * e.h0 * e.carried, z = e.z + leanZ() * e.h0 * e.carried, y = e.y, late = now - e.t > 0.25;
    _land.set(x, y, z);
    if (src.kind === 'heavy') {
      const wet = e.on === 'water';
      if (wet) { ctx.water.ripple(x, z, Hv.ring[0], Hv.ring[1]); if (!late) splash(x, z, e.t, Hv.crown / 0.25, 1); }      // the coronet, the few thrown further, the jet; the ring is the water's own
      else if (!late) crown(x, y, z, e.t, e.on === 'leaves' ? 5 : 6, e.on === 'leaves' ? 0.45 : 0.6, e.on === 'leaves' ? 0.6 : 0.9);
      fire('drop', _land, { what: 'heavy', on: e.on, pitch: 0.6, gain: wet ? 0.5 : 0.3 });
    } else if (src.kind === 'drip' && e.on !== 'velvet') {
      // on the piece of painted sky that leans on a box front: a pat on the plaster, and nothing reaches the water
      if (!late) crown(x, y, z, e.t, 5, 0.45, 0.6, y - 0.25, glintOf(src));
      fire('drop', _land, { what: 'drip', on: e.on, i: src.i, gain: 0.3 });
    } else if (src.kind === 'drip') {
      // on the velvet rail: a small crown, three of its droplets thrown off the rail into the water, where the ring is written
      if (!late) {
        const gl = glintOf(src);
        crown(x, y, z, e.t, 4, 0.4, 0.7, y, gl);
        if (!src.covered) for (let i = 0; i < 3; i++) { const side = (i - 1) * 0.5 + 0.3 * (rc() - 0.5), out = 1.0 + 0.3 * rc(), tx = -src.into.z, tz = src.into.x;
          spray([x, y + 0.012, z, 0], [e.t, 1, lerp(Sp.speck[0], Sp.speck[1], rc()) * 1.3, 1], [src.into.x * out + tx * side, 0.85 + 0.25 * rc(), src.into.z * out + tz * side, 0.6], gl); }
      }
      if (!src.covered) src.ring = { t: e.t + 0.33, x: x + src.into.x * Dr.spray, z: z + src.into.z * Dr.spray };
      fire('drop', _land, { what: 'drip', on: e.on, i: src.i, gain: 0.3 });
    } else {
      ctx.water.ripple(x, z, W.keystones.ring[0], W.keystones.ring[1]);
      if (!late) splash(x, z, e.t, 0.9, 1, glintOf(src));
      fire('drop', _land, { what: 'keystone', on: 'water', i: src.i, gain: 0.4 });
    }
  };

  // ---- who lets go when. Everything is drawn from one stream of numbers and timed on the realm's clock, so a picture taken twice is the same picture.
  const t00 = ctx.time || 0, heavyK = clamp(num('wxheavy', 1), 0.1, 20);
  const pend = [];                                                           // drops that will let go: { tShow, t0, src } in order of tShow
  const queue = (src, t0, swell) => { const tShow = t0 - swell; let k = pend.length; pend.push(null); while (k > 0 && pend[k - 1].tShow > tShow) { pend[k] = pend[k - 1]; k--; } pend[k] = { tShow, t0, src }; };
  let nextHeavy = t00 - 4.5, nextRow = t00 - 6.5, nextKeys = t00 - 4, lastHeavy = null, nextTest = Math.ceil(t00) + 1;
  const heavyTotal = sources.heavy.reduce((a, s) => a + s.weight, 0);
  const pickHeavy = (t) => {
    for (let tries = 0; tries < 6; tries++) {
      let u = rs() * heavyTotal, s = sources.heavy[0];
      for (const q of sources.heavy) { u -= q.weight; if (u <= 0) { s = q; break; } }
      if (s !== lastHeavy && t - s.last > 1.6) return s;
    }
    return null;
  };
  const rowTurn = (t) => {                                                   // one turn of the row: each point in its turn, the turn travelling toward the stage
    if (!sources.row.length) return;
    const s0 = Math.min(...sources.row.map((q) => q.s));
    for (const q of sources.row) queue(q, t + (q.s - s0) / Dr.speed + 0.14 * (rs() - 0.5), Dr.swell);
  };
  const keysTurn = (t) => { sources.keys.forEach((q, k) => queue(q, t + k * W.keystones.gap + 0.2 * (rs() - 0.5), W.keystones.swell)); };
  const schedule = (now) => {
    if (!drops) return;
    while (sources.heavy.length && nextHeavy < now + 0.1) { const s = pickHeavy(nextHeavy); if (s) { queue(s, nextHeavy + Hv.swell, Hv.swell); s.last = nextHeavy + Hv.swell; lastHeavy = s; } nextHeavy += Hv.every / heavyK * (0.35 + 1.3 * rs()); }
    while (sources.row.length && nextRow < now + 1) { rowTurn(nextRow); nextRow += dev.has('wxrow') ? num('wxrow', 2) : lerp(Dr.every[0], Dr.every[1], rs()); }
    while (sources.keys.length && nextKeys < now + 1) { keysTurn(nextKeys); nextKeys += W.keystones.every; }
    if (sources.test) while (nextTest < now + 4) { const q = sources.test, sw = q.kind === 'drip' ? Dr.swell : q.kind === 'keystone' ? W.keystones.swell : Hv.swell; queue(q, nextTest - dropTime(Math.max(q.p.y - q.ground, 0), Hv.speed), sw); nextTest += 1; }
    while (pend.length && pend[0].tShow <= now + 0.05) { const q = pend.shift(); letGo(q.src, q.t0, now); }
    while (lands.length && lands[0].t <= now) landed(lands.shift(), now);
    for (const q of sources.row) if (q.ring && q.ring.t <= now) { if (now - q.ring.t < 0.5) ctx.water.ripple(q.ring.x, q.ring.z, Dr.ring[0], Dr.ring[1]); q.ring = null; }
  };

  // ============================================================================================ rain on the rider's own boat
  // While the boat is in the column the rain knocks on its planks: the hook `tick` for each, and a few thrown droplets where it
  // strikes the gunwale, a thwart or the bottom boards (the boat's own sheer line, from its model's numbers).
  let sheer = null, nextPlank = t00;
  const wantPlanks = wantDrops && !off('wxplanks'), plankRate = Math.max(0.1, num('wxplanks', W.planks.rate));      // (&wxplanks=40: forty a second, to look at them)
  if (wantPlanks) { try { const r = await fetch('assets/models/life/boat.json'); if (r.ok) { const j = await r.json(); if (Array.isArray(j.sheer) && j.sheer.length > 3) sheer = j.sheer; } } catch (err) { sheer = null; } }
  // (the boat's sheer line at z of its own frame: [half its width, its height] there; the line runs from the stern, z 1.57, to the stem, z -2.38)
  const sheerAt = (z) => { for (let i = 0; i < sheer.length - 1; i++) { const a = sheer[i], b = sheer[i + 1]; if (z <= a[2] && z >= b[2]) { const t = (a[2] - z) / Math.max(1e-6, a[2] - b[2]); return [lerp(a[0], b[0], t), lerp(a[1], b[1], t)]; } } const e = sheer[sheer.length - 1]; return [e[0], e[1]]; };
  /** How much rain falls at a place of the realm at height y: 0 outside the column .. 1 in its heart. */
  const rainAt = (x, z, y = 0) => { const lx = leanX() * (S.top - y), lz = leanZ() * (S.top - y); return 1 - smooth(S.rain.fadeFrom, S.rain.fadeTo, Math.hypot(x - axis.x - lx, z - axis.z - lz)); };
  const planks = (now) => {
    const group = ctx.engine.boat && ctx.engine.boat.model && ctx.engine.boat.model.group;
    const k = rainAt(boat.x, boat.z, 0.4);
    if (!(k > 0.02) || !group) { nextPlank = now + 0.1; return; }
    let guard = 0;
    while (nextPlank <= now && guard++ < 6) {
      // where on the boat (its own frame: x to starboard, y up, z aft): mostly forward of the rider, where it is seen
      const u = rs(), fwd = rs() < 0.75;
      // (third holder: THE FOREDECK. The rider looks over the bow, and nothing struck there: the gunwales, a thwart and the bottom boards are
      // mostly under his chin. Three strikes in ten now fall on the small sunk deck behind the stem, beside the lantern, where they are warm glints)
      if (sheer && u < W.planks.foredeck) { const z = -1.82 - 0.36 * rs(), q = sheerAt(z); _v.set((rs() * 2 - 1) * Math.max(0.03, q[0] - 0.07), q[1] - 0.042, z); }
      else if (sheer && u < 0.62) { const f = (fwd ? 0.42 + 0.56 * rs() : 0.42 * rs()) * (sheer.length - 1), i = Math.min(sheer.length - 2, Math.floor(f)), t = f - i, a = sheer[i], b = sheer[i + 1]; _v.set(lerp(a[0], b[0], t) * (rs() < 0.5 ? -1 : 1), lerp(a[1], b[1], t) + 0.004, lerp(a[2], b[2], t)); }
      else if (u < 0.75) _v.set((rs() * 2 - 1) * 0.4, 0.252, fwd ? -0.99 + 0.2 * rs() : 1.2 + 0.3 * rs());      // a thwart
      else _v.set((rs() * 2 - 1) * 0.3, 0.02, fwd ? -0.7 + 0.9 * rs() : 0.7 + 0.4 * rs());                         // the bottom boards
      const y = _v.y; group.localToWorld(_v);
      // (a speck or three of water thrown up where it strikes: fine and quick. They were 6 to 10 mm and at full strength: white beads hopping on the thwarts)
      // (third holder: four of them, 7 to 12 mm across and a little stronger, now that no bead can be whiter than pearl: at 6 to 10 mm across and half strength nothing of a strike could be seen from the rider's seat)
      // (second look: specks of two or three millimetres with a hair along their way, thrown low and outward as wood throws them, gone in a tenth of a second)
      if (drops) { const a0 = rc() * TAU; for (let i = 0; i < 4; i++) { const a = a0 + i * 1.57 + rc(), out = 0.3 + 0.4 * rc(); spray([_v.x, _v.y, _v.z, _v.y - 0.01], [now, 1, lerp(Sp.speck[0], Sp.speck[1], rc()) * 0.75, 1], [boat.vx + Math.cos(a) * out, 0.3 + 0.4 * rc(), boat.vz + Math.sin(a) * out, 0.07 + 0.06 * rc()]); } }
      fire('tick', _v, { what: 'planks', pitch: 1.2, gain: 0.3 * (0.6 + 0.4 * k), local: y });
      nextPlank += (0.3 + 1.4 * rs()) / (plankRate * k);
    }
    if (nextPlank < now) nextPlank = now;
  };

  // ============================================================================================ rain on the water round the rider's boat
  // (Second look.) In the hem the rider was not rained on: the water's own rings round the hull are in the mirror, and looking down from a
  // boat there is little mirror to see them in; the set's painted disc of rings begins five metres from the eye; and the streaks come up out
  // of nothing within three and a half metres of it. So where the rain falls within a few metres of the boat, the water shows what a drop of
  // rain does to it: a speck or three thrown up and a jet a thumb high, gone in a tenth of a second, some in every frame. They fall where
  // the streaks fall (the same thinning from 8 to 10.5 m, the same lean), never on the boat itself (those are the planks'), and each writes
  // its ring.
  const Hu = W.hull, rh = ctx.rng(6005), wantHull = wantDrops && !off('wxhull') && Hu && Hu.rate > 0;
  const hullK = clamp(num('wxhull', 1), 0, 8);
  let nextHull = t00;
  const mini = (x, z, t, strength) => {
    // (no two alike: three or four specks hopping up a thumb's height and out, each with its hair. A jet in every one made a field of white
    // pins standing in the water; a jet is for a heavy drop)
    const a0 = rc() * TAU, n = 3 + (rc() < 0.5 ? 1 : 0);
    for (let i = 0; i < n; i++) { const a = a0 + i * 1.9 + 0.8 * rc(), out = (i ? 0.14 + 0.24 * rc() : 0.05 * rc()), upv = (i ? 0.4 + 0.4 * rc() : Hu.jet * (0.7 + 0.5 * rc()));
      spray([x, 0.004, z, 0], [t + (i ? 0 : 0.03), 1, lerp(Sp.speck[0], Sp.speck[1], rc()) * (i ? 1.1 : 1.4), strength], [Math.cos(a) * out, upv, Math.sin(a) * out, 2 * upv / G + 0.01]); }
  };
  const hullRain = (now) => {
    // (how far the boat is from the leaning column's foot: nothing of this happens unless the rain can reach the water near it)
    const far = Math.hypot(boat.x - axis.x - leanX() * S.top, boat.z - axis.z - leanZ() * S.top);
    if (far > S.rain.fadeTo + Hu.reach) { nextHull = now; return; }
    const every = 1 / (Hu.rate * hullK * Math.PI * Hu.reach * Hu.reach);     // seconds from one place tried to the next
    let guard = 0;
    while (nextHull <= now && guard++ < 24) {
      const a = rh() * TAU, r = Hu.reach * Math.sqrt(rh()), x = boat.x + Math.cos(a) * r, z = boat.z + Math.sin(a) * r, u = rh(), w = rh();
      nextHull += every * (0.3 + 1.4 * w);
      const k = rainAt(x, z, 0);
      if (u > k || overBoat(x, z, 0, 0.12)) continue;
      mini(x, z, nextHull > now ? now : nextHull, Hu.strength);
      // its ring: every one beyond the water's own rain zone; inside it, where the water already rings the disc as data, one in sixteen
      // (`ringShare`): a ring of its own always opening somewhere round the boat, and no more than that added to water that is already beaten.
      if (Math.hypot(x - axis.x - leanX() * S.top, z - axis.z - leanZ() * S.top) > S.rain.radius - 0.3 || w < Hu.ringShare) ctx.water.ripple(x, z, Hu.ring[0], Hu.ring[1]);
    }
    if (nextHull < now) nextHull = now;
  };

  // ============================================================================================ steam
  // A thread of steam over every flame of the chandelier in the tree, which hangs in the rain: each drop that finds a wick or
  // its pool of wax goes up from the flame's tip as a thread that rises, wavers, widens as it thins, leans further than the flame
  // and is gone within an arm's length. Each wick steams and rests in its own time, and along a thread denser and thinner parts
  // travel up with it, as do its curls. One ribbon to a wick, on the chandelier's own frame (so it goes where the frame swings);
  // it shows only while its candle burns. Lit gold from beneath by its own flame, pearl by the moon higher up.
  // (The first holder's threads were a short piece of ribbon that travelled up: at any strength that could be seen they were white
  // hooks, and every vertex that was dark was thrown off the picture by itself, which drew its triangles out across the frame.)
  const St = W.steam, ch = T && T.chandelier;
  let steam = null, steamMat = null;
  if (ch && ch.frame && ch.wicks && ch.wicks.length && !off('wxsteam')) {
    // one small card to a wick, standing on the flame's tip along the way the vapour goes, turned to the eye: the wisp itself is drawn in it
    const n = ch.wicks.length, rnd = ctx.rng(6004);
    const geo = new THREE.InstancedBufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute([-1, 0, 0, 1, 0, 0, -1, 1, 0, 1, 1, 0], 3)); geo.setIndex([0, 1, 2, 1, 3, 2]);
    const wick = new Float32Array(n * 3), st = new Float32Array(n * 4);
    let tf = []; try { tf = plan.flames().filter((f) => f.where === 'tree'); } catch (err) { tf = []; }
    ch.wicks.forEach((w, i) => {
      wick.set([w.at.x, w.at.y, w.at.z], i * 3);
      // when its candle catches (the plan's own flame, in the plan's order); seconds a breath and its rest take; a number of its own; how long its wisp is (no two alike)
      st.set([tf.length === n ? tf[i].t : plan.kindleTime('chandelier', w.ring || 0, rnd()), lerp(St.every[0], St.every[1], rnd()), rnd() * 97, 0.7 + 0.6 * rnd()], i * 4);
    });
    geo.setAttribute('aWick', new THREE.InstancedBufferAttribute(wick, 3)); geo.setAttribute('aSt', new THREE.InstancedBufferAttribute(st, 4)); geo.instanceCount = n;
    // (SECOND LOOK: BREATH, NOT HAIR. The thread was a ribbon two pixels wide at ten times the light, a little waved, with the painter's mark on
    // it: among hundreds of pale upright streaks of rain it was one more pale upright streak, and at any strength that showed it, white hair
    // standing on the flames. Steam is told from rain by what it does: it goes UP, it curls more the higher it is, it opens into the air, it is
    // soft, and it comes in puffs. So each is a finger of vapour at the flame's tip that meanders wider as it rises, opens to a hand and a half
    // across, is broken into denser and thinner breaths that rise with it, and is gone within an arm's length; its light is low and spread over
    // its width, warm from its own flame at the foot and pearl above; and it is left to the painter's brush, which keeps what is broad and soft.)
    const card = St.width[1] + 1.6 * St.waver + 0.04;                        // half the card's width (m): room for the wisp at its widest and its furthest meander
    steamMat = new THREE.ShaderMaterial({
      uniforms: { ...UW, uShow: U.uShow,
        uSteam: { value: new THREE.Vector4(num('wxsteamlen', St.length), St.rise, St.gain * num('wxsteamk', 1), 0.115) },      // metres long, metres a second it rises, its strength, the flame's own height
        uSteamW: { value: new THREE.Vector4(St.width[0], St.width[1], St.waver, St.curl) },                                   // half its width at its foot and at its top, metres it wavers at its top, metres from one curl to the next
        uSteamC: { value: new THREE.Color(St.warm || '#FFD9A0') }, uSteamRef: { value: St.ref || 0.03 }, uCard: { value: card },      // its colour by its own flame; the half-width at which it has its whole light (wider, it is as much fainter)
        uDraught: { value: new THREE.Vector3(ahead.tx, ahead.tz, 0) } },
      ...ADDED, side: THREE.DoubleSide,
      vertexShader: /* glsl */`
        attribute vec3 aWick; attribute vec4 aSt;
        uniform float uLifeNow, uShow, uCard; uniform vec4 uSteam; uniform vec3 uDraught;
        varying vec2 vUv; varying vec3 vSt; varying float vDist;
        float sn(float x, float k) { float i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f); return mix(fract(sin((i + k) * 12.9898) * 43758.5453), fract(sin((i + 1.0 + k) * 12.9898) * 43758.5453), f); }
        void main() {
          float len = uSteam.x * aSt.w, on = smoothstep(0.9, 2.6, uShow - aSt.x);
          float gate = on * smoothstep(0.42, 0.62, sn(uLifeNow / aSt.y, aSt.z));     // a wick steams for a while and rests, in its own time
          vec3 b = (modelMatrix * vec4(aWick, 1.0)).xyz;
          b.xz += uDraught.xy * (uDraught.z * uSteam.w); b.y += uSteam.w;          // the flame's own tip, where its lean has put it
          vec3 top = b + vec3(0.0, len, 0.0); top.xz += uDraught.xy * (uDraught.z * 2.4 * len);      // it leans further than the flame
          vec4 m0 = viewMatrix * vec4(b, 1.0), m1 = viewMatrix * vec4(top, 1.0), mv = mix(m0, m1, position.y);
          vec2 along = m1.xy / max(-m1.z, 0.01) - m0.xy / max(-m0.z, 0.01); float al = length(along);
          vec2 across = al > 1e-6 ? vec2(-along.y, along.x) / al : vec2(1.0, 0.0);      // square to the way it goes in the picture, from wherever it is seen
          mv.xy += across * (position.x * uCard);
          vDist = length(mv.xyz); vUv = position.xy; vSt = vec3(gate, aSt.z, len);
          gl_Position = gate < 0.004 ? vec4(2.0, 2.0, 2.0, 1.0) : projectionMatrix * mv;      // (the whole wisp or none of it)
        }`,
      fragmentShader: /* glsl */`
        uniform float uLifeNow, uCard, uSteamRef; uniform vec4 uSteam, uSteamW, uShaft; uniform vec3 uPearl, uSteamC; ${FOG_PARS} ${NOISE_GLSL}
        varying vec2 vUv; varying vec3 vSt; varying float vDist;
        void main() {
          float y = clamp(vUv.y, 0.0, 1.0), len = vSt.z, seed = vSt.y, h = y * len, up = h - uLifeNow * uSteam.y;      // (up: its own matter, which rises: curls and breaths are fixed in it. y is kept in 0..1: a power of a number a hair under nought is not a number, and one such pixel is a black dash after the painter)
          float ph = 6.2831853 * up / uSteamW.w + seed;
          float cx = uSteamW.z * pow(y, 1.4) * (sin(ph) + 0.5 * sin(ph * 0.41 + seed * 5.0));        // straight where it leaves the flame, bending further the higher it is (one slow bend to a wisp, no two alike: with a curl every hand's breadth they were white springs)
          float w = mix(uSteamW.x, uSteamW.y, pow(y, 0.55)), px = fwidth(vUv.x) * uCard, we = max(w, 1.5 * px);     // it opens at once and goes on opening; never under three pixels across (fainter instead)
          float d = (vUv.x * uCard - cx) / we, bell = exp(-2.0 * d * d);
          float breath = 0.2 + 0.8 * smoothstep(0.25, 0.75, vnoise(vec2(vUv.x * uCard * 6.0 + seed * 3.0, up * 4.0 + seed)));      // denser and thinner breaths of it, a hand or two long, rising
          float body = vSt.x * breath * smoothstep(0.0, 0.12, y) * pow(1.0 - y, 1.3);
          float light = uSteam.z * body * bell * min(1.0, uSteamRef / we);
          vec3 col = mix(uSteamC, uPearl * (0.5 + 0.5 * uShaft.w), smoothstep(0.05, 0.5, y)) * (light * (1.0 - fogAmount(vDist)) * (1.0 - uVeil));
          if (!(max(col.r, max(col.g, col.b)) >= 0.0015)) discard;
          gl_FragColor = vec4(col, 0.0);                                               // (no painter's mark: vapour is paint)
        }`,
    });
    steam = new THREE.Mesh(geo, steamMat);
    steam.name = `steam over the chandelier's flames x ${n}`; steam.frustumCulled = false; steam.renderOrder = 4;
    steam.onBeforeRender = ppm(steamMat);
    ch.frame.add(steam); ctx.only(steam, 'direct');
  }

  // ============================================================================================ the air
  // One draught and one gust for the room. The column's lean is set.js's (shared.air.lean: the shaft, its light on things, the
  // mist, the disc of rings, the water's rain zone); the streaks above follow it by themselves.
  const A = W.air, Gs = A.gust, rad = Math.PI / 180;
  const hs3 = shared.horseshoe || null, KF = shared.kitFloor || null;
  const state = {
    auto: { lean: !dev.has('wxlean') && !dev.has('lean'), hooks: true },   // what follows the show clock by itself
    lean: dev.has('wxlean') ? num('wxlean', 6) : 0, want: dev.has('wxlean') ? num('wxlean', 6) : 0, leanEase: null,        // degrees toward the stage: as it is drawn (none with reduced motion), and as the staging or the clock wants it
    draught: dev.has('wxdraught') ? num('wxdraught', 2) : null, draughtEase: null,      // the staging's own draught (0 still air .. 1 the hour's .. 2 the fall's), or null: the show clock's
    right: 0, moon: 1, moonEase: null,
    gust: null, gustK: 0,                                                  // the gust under way: { t0, k }; how much of it is in the air now (0..1)
    cloth: 0, hung: 0, wrote: { tree: false, swing: false, lustres: false, flames: false, cloth: false },
    hang0: shared.houseHang ? shared.houseHang.value : 1,
  };
  const leanByClock = (c) => A.hour * S01(c / A.turn) + (A.fall - A.hour) * S01((c - A.from) / A.turn) * (1 - S01((c - A.to) / A.turn));
  // the flames' own lean on the show clock (kit_multitudes.js makeFlames, copied: the gust adds to it and hands it back)
  const flameLean = (c) => 0.03 + 0.09 * smooth(0, 3, c) + 0.14 * smooth(plan.show.fall[0], plan.show.fall[0] + 2, c) * (1 - smooth(plan.show.fall[0] + 7, plan.show.fall[1], c));
  // a part of the gust: 0 before it, 1 while it holds, back to 0: [seconds to come, until, gone by]
  const part = (t, [come, hold, gone]) => (t <= 0 ? 0 : t < come ? S01(t / come) : t < hold ? 1 : 1 - S01((t - hold) / (gone - hold)));
  const ease = (e, now) => lerp(e.from, e.to, S01((now - e.t0) / e.T));
  Object.assign(air, {
    /** The module's own things: the streaks, the drops (and their crowns), the steam. `rain.strength` (0..1) thins the weather's own light. */
    rain: { object: rain, at: rainAt, strength: 1 }, drops: { object: drops, sources }, steam: { object: steam, strength: 1 },
    /** What follows the show clock by itself: set auto.lean false (or call lean()) to drive the column from the staging; auto.hooks false to silence the clock's hooks. */
    auto: state.auto,
    /** The column leans `degrees` toward the stage (and `right` to the right), reached over `seconds`. lean(null) hands it back to the show clock. */
    lean(degrees, seconds = 3, right = 0) {
      state.draught = null; state.draughtEase = null;                      // (the last call rules: a draught() in force is let go, and the flames' lean goes back to the kit's clock)
      if (degrees == null) { state.auto.lean = true; state.leanEase = null; return air; }
      state.auto.lean = false; state.right = right; state.leanEase = { from: state.want, to: degrees, t0: ctx.time, T: Math.max(0.01, seconds) }; return air;
    },
    /** THE DRAUGHT, as one number, for a staging that wants it off the show clock: 0 still air (before the hour), 1 the hour's draught
     *  (the column leans four degrees, the flames seven, what hangs on a chain a sixth of the column's), 2 the fall's (six degrees, the
     *  flames twice as far). Reached over `seconds`; draught(null) hands the column and the flames back to the show clock. It moves what
     *  is the set's and this module's: the column (shaft, mist, disc, rain zone, streaks, drops, steam), the flames' lean, the lustres'.
     *  The leaves' drift and the cloth's stream are their groups' own (shared.cast.leaves.draught, shared.cast.cloth.stream). */
    draught(k, seconds = 3) {
      if (k == null) { state.draught = null; state.draughtEase = null; return air; }
      const from = state.draught != null ? state.draught : state.want <= A.hour ? state.want / A.hour : 1 + (state.want - A.hour) / Math.max(0.01, A.fall - A.hour);
      state.draught = from; state.draughtEase = { from, to: clamp(k, 0, 2), t0: ctx.time, T: Math.max(0.01, seconds) }; return air;
    },
    /** The moon's strength (1: as the light state has it), reached over `seconds`: the shaft, its light on things, the mist, the disc, the rain. */
    moon(gain = 1, seconds = 2) { state.moonEase = { from: state.moon, to: gain, t0: ctx.time, T: Math.max(0.01, seconds) }; return air; },
    /** THE GUST (the page's moment at s 38), as one call: wind crosses the tear. The column leans five degrees for four seconds and
     *  recovers over six; the shaft dims to 0.7 for three seconds and comes back through 1.2; the crown tosses at three times its sway
     *  and the chandelier swings wider; the lustres swing and lean; the flames lean; all the cloth of the house stirs (through the Cloth
     *  group's own gust). k: how much of it (1: the page's).
     *  { everyone: true } also tells the rest of the cast, each through its own handle: the crown lets its 400 leaves go (shared.cast.leaves.
     *  burstCrown), the drifts on the rails lift in their wave (shared.cast.presences.sitters.lift), the moths are thrown (shared.cast.moths.gust).
     *  Without it those three are the staging's own calls (do not make them twice). */
    gust(k = 1, { everyone = false } = {}) {
      state.gust = { t0: ctx.time, k: clamp(k, 0, 2) };
      if (everyone) { const C = shared.cast || {}, tell = (what, f) => { try { f(); } catch (err) { console.error(`theatre/cast_weather: the gust could not reach ${what}: ${(err && err.message) || err}`); } };
        if (C.leaves && C.leaves.burstCrown) tell('the leaves', () => C.leaves.burstCrown({ count: Math.round(400 * Math.min(1.5, k)), over: 4 }));
        if (C.presences && C.presences.sitters && C.presences.sitters.lift) tell('the drifts on the rails', () => C.presences.sitters.lift({ speed: Gs.speed }));
        if (C.moths && C.moths.gust) tell('the moths', () => C.moths.gust(0.5 * Math.min(2, k), 5)); }
      return air;
    },
    /** The gust's front round the horseshoe (the page: "a wave that runs from the tear round the horseshoe at 9 m/s"), for whatever stands along
     *  the fronts: `arc58` is metres along a front from the bracket nearest s 58 (plan.js: every bay's and pier's arc58). gustAt(): 0..1, how
     *  much of the gust is at that place now (it comes in half a second, holds a second, dies over two and a half); gustArrives(): the realm's
     *  time (ctx.time) at which the front reaches it (Infinity when no gust is under way). */
    gustAt(arc58 = 0) { return state.gust ? part(ctx.time - state.gust.t0 - Math.abs(arc58) / Gs.speed, Gs.front) * Math.min(1, state.gust.k) : 0; },
    gustArrives(arc58 = 0) { return state.gust ? state.gust.t0 + Math.abs(arc58) / Gs.speed : Infinity; },
    /** The row of drips: a turn now (each point in its turn, travelling toward the stage at 5 m/s). By itself the row takes a turn every 2.2 to 3.5 s. */
    drips: { turn() { rowTurn(ctx.time + Dr.swell); return air; }, points: sources.row },
    /** The keystones' three drops: a turn now (left, middle, right, two seconds apart). By itself they take a turn every six seconds. */
    keystones: { turn() { nextKeys = ctx.time + W.keystones.every; keysTurn(ctx.time + W.keystones.swell); return air; }, points: sources.keys },
    /** The kindling (the flames and their times are the kit's and the plan's): where the edge of flame on tier `tier` is at show clock c,
     *  as places of the realm: { left: [toward the stage, toward the rear], right: [the same] } (null where the edge has reached the end), or null before it starts. */
    kindle: { edge: kindleEdge, starts: plan.show.tierStart, speed: plan.show.speed },
  });
  // to read: the lean now (degrees), how much of a gust is in the air (0..1), how hard the draught blows toward the stage (0 still .. 1 the fall): for the `wind` layer
  Object.defineProperties(air, {
    leanNow: { get: () => state.lean, enumerable: true }, gustNow: { get: () => state.gustK, enumerable: true }, draughtNow: { get: () => state.draught, enumerable: true },
    windNow: { get: () => clamp(Math.max(state.gustK, (state.want - A.hour) / Math.max(0.01, A.fall - A.hour)), 0, 1), enumerable: true },
    // the page's three layers that follow the weather, as the numbers its section 8 gives, for where the boat is now: rain by distance to the
    // (leaning) column (0.2 heard through the foyer's wall, 0.45 from the arches, 0.6 at the column's edge, 0.7 inside, 0.25 from the stage); wind 0.22 to 0.5 with
    // the gust and the fall; shimmer rising to 0.28 with the share of flames burning. (The staging's to use or not: nothing is played here.)
    layers: { get: () => { const d = Math.hypot(boat.x - axis.x - leanX() * S.top, boat.z - axis.z - leanZ() * S.top), s = ctx.s;
      // (stage 5, 5-critique.md: this gave 0.25 at the arches, 0.75 in the column and faded the rain by place from s 116; the route and the bed as they are staged
      // (stage.js, 4-staging.md) have 0.45 at the first image, 0.7 in the column, 0.25 from the stage, and the rain is shut by the painting's door, which is the
      // staging's. Nobody reads this yet: it now says what is played, so that whoever does is not told two things.)
      const rainL = d <= S.rain.fadeFrom ? 0.7 : d <= S.rain.fadeTo ? lerp(0.7, 0.6, (d - S.rain.fadeFrom) / (S.rain.fadeTo - S.rain.fadeFrom)) : d <= 29 ? lerp(0.6, 0.45, (d - S.rain.fadeTo) / (29 - S.rain.fadeTo)) : lerp(0.45, 0.25, clamp((d - 29) / 21, 0, 1));
      return { rain: (s < 28 ? lerp(0.2, rainL, smooth(18, 28, s)) : rainL), wind: 0.22 + 0.28 * air.windNow, shimmer: 0.28 * (show.k || 0) }; }, enumerable: true },
  });
  function kindleEdge(tier, c = show.c) {
    const a = (c - plan.show.tierStart[tier]) * plan.show.speed;
    if (!(a >= 0) || !(tier >= 1 && tier <= 5)) return null;
    const y = plan.candleRow(tier), ar = plan.arc, out = {};
    for (const [name, sign] of [['left', -1], ['right', 1]]) {
      const fore = ar.at58 + a, back = ar.at58 - a, lim = tier >= 3 ? ar.rearFace : ar.bay0;
      let rear = null;
      if (back >= lim) { const p = plan.sideFront(tier, sign, back); rear = at(ctx, p.s, p.d, y); }
      else if (tier >= 3) { const d = plan.frontD(plan.archWall.face) + 0.25 * tier - (lim - back); if (d > 0) rear = at(ctx, plan.archWall.face, sign * d, y); }
      let stage = null;
      if (fore <= ar.at84) { const p = plan.sideFront(tier, sign, fore); stage = at(ctx, p.s, p.d, y); }
      out[name] = [stage, rear];
    }
    return out;
  }

  // ---- the first frame's world: whatever is already in the air
  schedule(t00);
  let cWas = show.c, said = false;
  const gustAt = dev.has('wxgust') ? num('wxgust', 3) : null, keyAt = dev.has('wxkey') ? num('wxkey', 3) : null;
  let gustDone = false, keyDone = false;

  // shared.cast.air (nothing here plays a sound or places a cue):
  //   .lean(degrees | null, seconds, right), .leanNow     the column: 4 from the hour, 6 through the fall by itself (auto.lean); the gust adds its own
  //   .draught(k | null, seconds), .draughtNow            the draught as one number, off the clock: 0 still, 1 the hour's, 2 the fall's (column, flames' lean, lustres)
  //   .moon(gain, seconds)                                the moon's strength (shared.air.gain)
  //   .gust(k, { everyone }), .gustNow                    the gust as one call (column, shaft, crown, chandelier, lustres, flames, cloth; with everyone: leaves, drifts, moths too)
  //   .gustAt(arc58), .gustArrives(arc58)                 the gust's front round the horseshoe at 9 m/s, for what stands along the fronts
  //   .windNow, .layers { rain, wind, shimmer }           0..1 how hard the air moves; the page's three layers for where the boat is
  //   .rain { object, at(x, z, y), strength }             the streaks; at(): how much rain falls at a place (the `rain` layer by distance: at(boat) is 0 outside, 1 in the column's heart)
  //   .drops { object, sources }, .drips.turn(), .keystones.turn()
  //   .steam { object, strength }
  //   .kindle.edge(tier, c)                               where a tier's edge of flame is (to pan its `breath`)
  //   .auto { lean, hooks }
  //   .on { drop, tick, breath, bloom, sparkle }: each null until the staging attaches fn({ x, y, z, what, ... }):
  //        drop      a drop landing: what 'heavy' (pitch 0.6, gain 0.5 on water, 0.3 on leaves, gilt, wood), 'drip' (gain 0.3; i: which of the row), 'keystone' (i: 0 left, 1 middle, 2 right)
  //        tick      rain on the rider's planks while the boat is in the column (pitch 1.2, gain 0.3), where it struck
  //        breath    what 'draught': the draught turns (show clock 0);  what 'kindle': tier `tier`'s edge of flame sets off (6, 8, 10, 12, 14); pan it with kindle.edge(tier)
  //        bloom     the chandelier in the tree catches (show clock 1.2): note 50 (D3), gain 0.6, once
  //        sparkle   show clock 4: gain 0.35, once
  return {
    update(dt) {
      const now = ctx.time, c = show.c, k = show.k || 0;
      // ---- the boat
      if (boat.was != null && dt > 1e-4) { boat.vx += ((ctx.boat.x - boat.x) / dt - boat.vx) * Math.min(1, dt * 6); boat.vz += ((ctx.boat.z - boat.z) / dt - boat.vz) * Math.min(1, dt * 6); }
      boat.x = ctx.boat.x; boat.z = ctx.boat.z; boat.was = now;

      // ---- the gust under way
      let gLean = 0, gMoon = 1, gCrown = 0, gLustres = 0, gCloth = 0;
      if (gustAt != null && !gustDone && now >= gustAt) { gustDone = true; air.gust(1, { everyone: dev.has('wxall') }); }
      if (state.gust) {
        const t = now - state.gust.t0, gk = state.gust.k * (calm ? 0.4 : 1), m = Gs.moon;
        gLean = calm ? 0 : Gs.lean * gk * part(t, Gs.leans);                 // (reduced motion: the column does not lean, the page says; the gust keeps its dimming and a calmer toss)
        gMoon = t < m[1] ? lerp(1, Gs.dim, S01(t / m[0])) : t < m[2] ? lerp(Gs.dim, Gs.bright, S01((t - m[1]) / (m[2] - m[1]))) : lerp(Gs.bright, 1, S01((t - m[2]) / (m[3] - m[2])));
        gMoon = 1 + (gMoon - 1) * Math.min(1, state.gust.k);
        gCrown = gk * part(t, Gs.crown); gLustres = gk * part(t, Gs.lustres); gCloth = part(t, [Gs.cloth[0], Gs.cloth[1], Gs.cloth[1] + Gs.cloth[2]]) * Math.min(1, state.gust.k);
        state.gustK = Math.max(part(t, Gs.crown), part(t, Gs.leans)) * Math.min(1, state.gust.k);
        if (t > 14.5) { state.gust = null; state.gustK = 0; }
      }
      // ---- the column's lean: the show clock's, or the staging's; and the gust's on top of it
      if (state.draughtEase) { state.draught = ease(state.draughtEase, now); if (now - state.draughtEase.t0 >= state.draughtEase.T) { state.draught = state.draughtEase.to; state.draughtEase = null; } }
      const dr = state.draught;                                              // the staging's own draught (0..2), or null: the clock's
      if (dr != null) state.want = dr <= 1 ? A.hour * dr : A.hour + (A.fall - A.hour) * (dr - 1);
      else if (state.auto.lean) state.want = leanByClock(c);
      else if (state.leanEase) { state.want = ease(state.leanEase, now); if (now - state.leanEase.t0 >= state.leanEase.T) state.leanEase = null; }
      state.lean = calm ? 0 : state.want;                                    // (reduced motion: the column does not lean, whoever asks; `want` still says how hard the air moves, for the `wind` layer)
      const SA = shared.air;
      if (SA && SA.lean && !dev.has('lean')) {
        const tan = Math.tan((state.lean + gLean) * rad), right = Math.tan(state.right * rad);
        if (Math.abs(tan - SA.leaning.x) > 1e-5 || Math.abs(right - SA.leaning.y) > 1e-5) SA.lean(tan, right);
        if (state.moonEase) { state.moon = ease(state.moonEase, now); if (now - state.moonEase.t0 >= state.moonEase.T) state.moonEase = null; }
        SA.gain = state.moon * gMoon;
      }
      const ls = SA ? SA.leaning.x : 0, lr = SA ? SA.leaning.y : 0;
      UW.uLean.value.x = ahead.tx * ls + ahead.rx * lr; UW.uLean.value.y = ahead.tz * ls + ahead.rz * lr;
      // ---- the gust on what others made (each is left alone again when the gust has passed)
      const wrote = state.wrote;
      if (T) {
        if (gCrown > 1e-3 || wrote.tree) { T.gust = gCrown; wrote.tree = gCrown > 1e-3; }
        if (T.chandelier && (gCrown > 1e-3 || wrote.swing)) { T.chandelier.swing = 1 + (Gs.swing - 1) * gCrown; wrote.swing = gCrown > 1e-3; }
      }
      if (hs3 && hs3.swing && (gLustres > 1e-3 || wrote.lustres)) { hs3.swing.gust = gLustres; wrote.lustres = gLustres > 1e-3; }
      // (what hangs on a chain leans a little with the same air: a sixth of the column's lean, toward the stage. swing.lean.y turns about the house's width)
      if (hs3 && hs3.swing && hs3.swing.lean) { const want = A.hang * (state.lean + gLean) * rad * (calm ? 0.4 : 1); if (Math.abs(want - state.hung) > 2e-5) { hs3.swing.lean.y = want; state.hung = want; } }
      // (the flames' lean is the kit's, by the show clock, until a gust or the staging's own draught says otherwise; then it is handed back)
      if (hs3 && hs3.flames && hs3.flames.draught && (gCrown > 1e-3 || dr != null || wrote.flames)) {
        const mine = gCrown > 1e-3 || dr != null;
        hs3.flames.draught.lean = mine ? (dr != null ? 0.03 + 0.09 * Math.min(dr, 1) + 0.14 * Math.max(dr - 1, 0) : flameLean(c)) + 0.14 * gCrown : null; wrote.flames = mine;
      }
      if (gCloth > 1e-3 || wrote.cloth) {
        const cloth = shared.cast.cloth;
        if (cloth && cloth.gust) { if (Math.abs(gCloth - state.cloth) > 0.02 || gCloth <= 1e-3) { cloth.gust(gCloth, 0.25); state.cloth = gCloth; } }      // (the Cloth group's own gust: curtain, tassels, box curtains, swags, borders)
        else { if (KF && KF.gust) KF.gust.value = gCloth; if (shared.houseHang) shared.houseHang.value = state.hang0 * (1 + 2.4 * gCloth); }
        wrote.cloth = gCloth > 1e-3;
      }

      // ---- the light the weather stands in: pearl, going warm with the lit house as the shaft does; the fire in the tree
      const hs = ctx.look.house || {};
      UW.uPearl.value.copy(pearl).lerp(warm, hs.shaftWarm ?? 0).multiplyScalar((1 - (1 - R.kindled) * k) * air.rain.strength);
      UW.uFire.value.w = T && T.uniforms && T.uniforms.uLfFireOn ? T.uniforms.uLfFireOn.value : smooth(1, 6, c);
      if (drops) drops.material.uniforms.uRoom.value.copy(gold).multiplyScalar(0.5 * k * (1 - smooth(88, 96, ctx.s))).addScalar(0.035);
      if (steamMat) {
        const fl = hs3 && hs3.flames && hs3.flames.mesh ? hs3.flames.mesh.material.uniforms.uDraught.value : null;      // the flames' own draught: the way it goes, and its lean
        if (fl) steamMat.uniforms.uDraught.value.set(fl.x, fl.y, fl.z);
        steamMat.uniforms.uSteam.value.z = St.gain * num('wxsteamk', 1) * air.steam.strength;
      }

      // ---- drops: who lets go, who has landed; the rain on the planks
      if (keyAt != null && !keyDone && now >= keyAt) { keyDone = true; air.keystones.turn(); }
      schedule(now);
      if (wantPlanks) planks(now);
      if (wantHull) hullRain(now);
      if (dirty) { aFrom.needsUpdate = aGo.needsUpdate = aVel.needsUpdate = true; dirty = false; }

      // ---- what the staging hears of the clock (each once, as the clock passes it while the rider is there)
      if (state.auto.hooks && c > cWas && c - cWas < 3) {
        const pass = (t) => cWas < t && c >= t;
        if (pass(0)) fire('breath', at(ctx, plan.tear.s, plan.tear.d, 12), { what: 'draught' });
        if (pass(1.2)) fire('bloom', fireAt, { what: 'chandelier', note: 50, gain: 0.6 });
        if (pass(4)) fire('sparkle', fireAt, { what: 'chandelier', gain: 0.35 });
        for (let t = 1; t <= 5; t++) if (pass(plan.show.tierStart[t])) fire('breath', at(ctx, 58, 0, plan.candleRow(t)), { what: 'kindle', tier: t, edge: (cc) => kindleEdge(t, cc) });
      }
      cWas = c;
      if (logAt != null && now >= logAt && !said) { said = true; const all = logged.join(' ') || 'nothing'; for (let i = 0; i < 8; i++) if (all.length > i * 420) console.error(`NOT AN ERROR (&wxlog): cast_weather hooks ${i + 1}: ` + all.slice(i * 420, (i + 1) * 420)); }
      if (pins && !pins.said) { pins.said = true; const f = (v) => v.toFixed(2);
        const fernsAt = ((shared.kitFloor && shared.kitFloor.ferns) || []).map((q) => q.at), nearFern = (s) => fernsAt.reduce((m, q) => Math.min(m, Math.hypot(q.x - s.p.x, q.z - s.p.z)), 99);
        const all = sources.heavy.map((s) => `${f(-s.p.z)},${f(s.p.x)},${f(s.p.y)}>${f(s.ground)}:${s.on}${s.rim ? ':rim' : ''}${s.chain ? ':chain' : ''}${s.on !== 'water' ? ' fern ' + f(nearFern(s)) : ''}`);
        for (let i = 0; i < all.length; i += 8) console.error(`NOT AN ERROR (&wxpins): heavy ${i}.. ` + all.slice(i, i + 8).join(' | '));
        if (steam) { steam.updateWorldMatrix(true, false); const w0 = ch.wicks[0].at.clone().applyMatrix4(steam.matrixWorld), c0 = ch.candleTop(0); console.error(`NOT AN ERROR (&wxpins): steam parent ${steam.parent && steam.parent.name} visible ${steam.visible} layers ${steam.layers.mask} wick0 ${f(-w0.z)},${f(w0.x)},${f(w0.y)} candleTop0 ${f(-c0.z)},${f(c0.x)},${f(c0.y)} show ${steamMat.uniforms.uShow.value} st ${steamMat.uniforms.uSteam.value.toArray().map(f)} dr ${steamMat.uniforms.uDraught.value.toArray().map(f)} n ${steam.geometry.instanceCount} t0 ${f(steam.geometry.attributes.aSt.array[0])} parentVisible ${steam.parent && steam.parent.visible}`); }
        console.error(`NOT AN ERROR (&wxpins): sky meshes ${skyOnRails.length} (${skyOnRails.map((m) => m.name + ' ' + (m.geometry.index ? m.geometry.index.count / 3 : m.geometry.attributes.position.count / 3)).join('; ')}), things on rails ${onRails.length}; row (place, where along its box, what it lands on) ` + sources.row.map((s) => `${f(-s.p.z)},${f(s.p.x)},${f(s.p.y)}@${f(s.along ?? 0)}>${f(s.ground)}:${s.on}${s.covered ? ':covered' : ''}`).join(' | ') + ' keys ' + sources.keys.map((s) => `${f(-s.p.z)},${f(s.p.x)},${f(s.p.y)}`).join(' | ')); }
    },
  };
}
