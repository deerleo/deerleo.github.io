// The dyers' reach: everything alive and moving (stage 3). EMPTY at stage 1: this lists what the page puts here
// (docs/art/reach.md, section 5, twenty-one kinds across three scales), and what already stands in for each.
//
// Small and near
//   drips            about 900 alive: hems, skeins, spouts, the launder, the wheel. Stateless particles; the landings of
//                    the 60 nearest emitters are found on the CPU: a ring, a grain of dye in the film, a `drop`
//   falling dye      26 spouts, 5 gutters, the slipway's 3 lips, the pit's 2 arches: ropes and sheets of liquid
//                    (engine: makePours). Their places: shared.spouts (kit.js) = [{ x, y, z, fall, dye, side }]
//   steam            30 of the 46 vats and the 7 pans: 8 soft sprites to a column, leaning west; shared.vats (kit.js)
//   lint and dust    1,500 motes, seen only in the ten shafts
//   swallows         44: 16 skimmers, 22 perchers, 6 nesters (engine: life/birds.js). Perches: the side-aisle racks at
//                    (44, -13) and (58, 13), the boom's posts, the west front's lines; nests under the indigo house's
//                    eaves and on the loft's first beam
//   moths            4 at the kept lamp: the engine's (stage.js places the lamp)
//   floating things  the boom's baulks (kit.js stands them in, still), 30 clumps of dye foam, 3 lost hanks, 12 foam rafts
// Middle
//   hanging cloth    206 bolts and 12 swags: BUILT (kit.js, the engine's makeCloth and makeSwags; shared.cloth)
//   flying silks     26, tethered to the mast heads: a STAND-IN in kit.js ('standin:flying silks', the engine's
//                    makeRibbons with kind 'silk'); ties in shared.silkTies. Make your own here and take it out with
//                    removeStandIn(ctx, 'flying silks'). They slip their mast heads in the unpegging
//   strays           4 before the showstopper, 60 during it (makeRibbons, kind 'stray')
//   wringing wheels  9, each on its own phase: STAND-INS, still (kit.js); (66, 15.5), (78, -15.5), five in the gallery, (214, 12), (236, 12)
//   dipping beams    6: four at the indigo house, two on the right terrace: STAND-INS, still (kit.js)
//   small wheels     the lifting wheel (heroes_b.js), two undershot wheels, five far wheels: STAND-INS, still (kit.js)
//   the copper       tips every 48 s: STAND-IN, still (heroes_b.js)
//   underwater cloth 6 streaming bolts from the two rinsing-post clusters, 4 lost bolts on the bed (makeRibbons, kind 'cloth')
//   light shafts     10 additive bars along the sun's direction, 2 to 14 m up, each starting at a gap between named bolts;
//                    they take the dyed light: shared.sun.light and shared.sun.strength (light.js)
// Vast
//   the great wheel  TURNS (heroes.js: shared.wheel.angle), with its ten gores (makeGores), dyed by progress alone.
//                    Still to come: the dip-dye stepping as each gore goes through the pit, the rain from its rim
//   the sun          BUILT (light.js: shared.sun)
//   the wind         the breeze is there (set.js: shared.wind, the engine's makeWind); the two fronts are staging's
//   high tails       5, 60 to 120 m up over the tenter grounds (makeRibbons, kind 'tail'). The first thing to cut
//   far plume, far steam   the chimney's plume and six wisps over the tenter grounds
//
// What writes on the water (section 7) comes with each kind: spouts inject pigment every frame ('a' indigo from the left
// bank, 'b' madder from the right), the red pour is one large madder fan every 48 s, wringers and drips ring and stain,
// swallows dip, strays draw a line, the gusts a line of cat's-paws. The wheel's rain zones are already down (set.js).
//
// ---- GROUP "PRESENCES" (stage 3; docs/build/reach/3-cast-plan.md; log: docs/build/reach/3-cast-presences.md) -----------
// This file is now the group of the three vast things: the great wheel's cloth and water, and the wind's two fronts.
// (The other groups are cast_machines.js, cast_falls.js, cast_silks.js, cast_air.js, cast_birds.js.) Nothing here reacts
// to the boat; the showstopper is staged in stage.js with the handles below.
//
//   THE DIP-DYE   the river dyes the wheel's cloth: this module takes the gores' dyes over (shared.wheel.dyer = 'cast').
//                 Each time a gore's long end goes down through the pit (shared.wheel.dips) its hem takes the place the
//                 evening has reached on the dyer's scale (plan.wheel.place: e, 0.6 ahead or 0.6 behind by its lag), while
//                 it is under water; over the following half turn its top eases toward what its hem was. A gore never goes
//                 back up the scale. So that the wheel never wears more than three neighbouring dyes (the page's rule), a
//                 hem the evening has left more than 0.9 of a place behind is drawn after it, slowly, in the air.
//                 Dyes go through shared.wheel.setDye, so the sun's cover test still agrees with the picture; the dye
//                 last dipped is published as shared.wheel.last = { k, place, color, at } (the Falls group's two arches).
//   THE RAIN      one draw call of drops, worked out in the shader from the wheel's angle: from the rising rim between
//                 4 and 2 o'clock, from each gore's hem for 20 s after it leaves the pit (in that gore's dye), and a fine
//                 drift over the left of the pass (set.js has laid the rings there: rainZone). Each float board going in
//                 rings the pit and a ripple leaves each of the pit's two arches.
//   THE WIND      the breeze is set.js's. Here: a front's mark on the water (a moving line of cat's-paws where its leading
//                 edge is; behind the great gust the film is combed into streaks that point at the sun), and the two fronts
//                 as one call each.
//
// shared.cast.presences = {
//   on(kind, fn)            fn(x, z, o): 'float' ({ index, into, gone }: a float board at the water, one every 2.5 s each
//                           way; the knock is `into`, pitch 0.4), 'dip' ({ gore, place }: a gore's long end is in the pit)
//   wheel: { gore(k) -> { hem, top } (places on the scale now), last() (shared.wheel.last), across() ({ gore, v }: the gore
//            across the sun from the rider's eye now and how far down it, as makeGores.covers gives it; null when none, or
//            while a front holds the cloth out), nudge(radians, seconds) (bring
//            the wheel on by so much, eased, never more than a fifth of its pace: returns what it gave),
//            rain: { object, level() 0..1 at the boat (1 inside the drift), amount: 1 (set it: the whole rain thinner) } }
//   wind: { breath() (the first breath: plan.gusts.breath, it passes), gust() (the great gust: held until release()),
//           release(), marks: true (cat's-paws under any front), combing: true (streaks behind a front of strength 0.9 or more) }
// }
// Developer switches: &wrain=0 no rain; &wdye=0 the gores left to heroes.js (by progress alone); &front=breath|great sends
// that front as the picture begins (to look at its mark on the water); &wcomb=<strength> the comb's streaks (0.6; 0 none);
// &wdbg=<seconds> says each gore's place on the scale at that time (as a page error, so that the picture tool prints it).
import * as THREE from 'three';

const TAU = Math.PI * 2;
const QS = new URLSearchParams(typeof location !== 'undefined' ? location.search : '');
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };

export async function build(ctx, plan, shared) {
  shared.cast = shared.cast || {};
  const { kit } = ctx, W = plan.wheel, wheel = shared.wheel, sun = shared.sun, wind = shared.wind;
  const hooks = {}, ticks = [];
  const fire = (kind, x, z, o) => { const l = hooks[kind]; if (!l) return; for (const fn of l) { try { fn(x, z, o || {}); } catch (e) { console.error(`reach/cast: a '${kind}' hook threw: ` + (e && e.message || e)); } } };
  const out = (shared.cast.presences = { on(kind, fn) { (hooks[kind] = hooks[kind] || []).push(fn); return out; }, wheel: { rain: { object: null, amount: 1, level: () => 0 } }, wind: { marks: true, combing: true } });
  const part = (name, fn) => { try { fn(); } catch (e) { console.error(`reach/cast: ${name} was left out: ` + (e && e.stack || e)); } };
  const ring = (x, z, strength, radius) => { if (ctx.water && ctx.water.ripple) ctx.water.ripple(x, z, strength, radius); };
  const dyes = plan.dyes.map((d) => new THREE.Color(d.color)), backs = plan.dyes.map((d) => new THREE.Color(d.back));
  const scale = (place, c, from = dyes) => { const p = Math.min(5, Math.max(0, place)), i = Math.floor(p), f = p - i; return c.copy(from[i]).lerp(from[Math.min(5, i + 1)], f); };
  const hub = wheel ? wheel.hub : new THREE.Vector3(W.hub[0], W.hub[1], W.hub[2]), om = TAU / W.period;

  // ================================================================================================ the dip-dye
  const G = [];
  part('the dip-dye', () => {
    if (!wheel || !wheel.setDye || !wheel.dips || !wheel.arms) throw new Error('shared.wheel has no setDye / dips / arms (heroes.js)');
    if (QS.get('wdye') === '0') return;
    const P = W.place, far = () => (sun && sun.far != null ? sun.far : ctx.s || 0), e0 = wheel.place(far());
    const place = (e, k) => Math.min(5, Math.max(0, e + (1 - P.lags[k]) * P.lag));
    wheel.arms.forEach((_, k) => { const h = place(e0, k), t = Math.max(0, h - P.top); G.push({ hem: h, hemTo: h, top: t, topFrom: t, topTo: t, since: 1e3, dips: wheel.dips(k) }); });
    wheel.dyer = 'cast';                                                          // heroes.js leaves the gores' dyes alone from here on
    const cTop = new THREE.Color(), cHem = new THREE.Color(), half = W.period / 2;
    const paint = (k) => wheel.setDye(k, scale(G[k].top, cTop), scale(G[k].hem, cHem));
    for (let k = 0; k < G.length; k++) paint(k);
    // the gore that was last in the pit when the realm begins: the one whose arm is least past straight down
    { let best = 0, least = 1e9;
      wheel.arms.forEach((arm, k) => { const a = (((arm / W.arms.pairs) * TAU + wheel.angle - 1.5 * Math.PI) % TAU + TAU) % TAU; if (a < least) { least = a; best = k; } });
      wheel.last = { k: best, place: G[best].hem, color: scale(G[best].hem, new THREE.Color()), at: ctx.time }; }
    out.wheel.gore = (k) => (G[k] ? { hem: G[k].hem, top: G[k].top } : null);
    if (QS.has('wdbg')) { let said = false; ticks.push({ name: 'wdbg', fn() { if (said || ctx.time < +QS.get('wdbg')) return; said = true; console.error(`reach/cast (asked with &wdbg): t ${ctx.time.toFixed(1)} far ${far().toFixed(1)} e ${wheel.place(far()).toFixed(2)} last ${wheel.last ? wheel.last.k + '@' + wheel.last.place.toFixed(2) : '-'} across ${out.wheel.across ? JSON.stringify(out.wheel.across()) : '?'} rain ${out.wheel.rain.level().toFixed(2)} | ` + G.map((g, k) => `${k}: hem ${g.hem.toFixed(2)} top ${g.top.toFixed(2)} dips ${g.dips} since ${Math.min(999, g.since).toFixed(0)}`).join(' | ')); } }); }
    out.wheel.last = () => wheel.last;
    let farWas = -1;
    ticks.push({ name: 'the dip-dye', fn(dt) {
      const f = far(), e = wheel.place(f), low = e - 0.9;
      // entered part-way (a rider coming back in, a picture taken at &s=190: the furthest progress is not known while the
      // modules are built): the wheel is as far along as the evening is, laid out as layout had it; nothing is eased
      if (farWas < 0 || f - farWas > 8) {
        for (let k = 0; k < G.length; k++) { const g = G[k], h = place(e, k), t = Math.max(0, h - P.top); g.hem = g.hemTo = h; g.top = g.topFrom = g.topTo = t; g.since = 1e3; g.dips = wheel.dips(k); paint(k); }
        if (wheel.last) { wheel.last.place = G[wheel.last.k].hem; scale(wheel.last.place, wheel.last.color); }
      }
      farWas = f;
      for (let k = 0; k < G.length; k++) {
        const g = G[k], d = wheel.dips(k), hem0 = g.hem, top0 = g.top;
        if (d !== g.dips) {                                                       // its long end is in the pit now
          g.dips = d;
          const was = g.hem;
          g.hemTo = Math.max(g.hem, place(e, k)); g.topFrom = g.top; g.topTo = Math.max(g.top, was); g.since = 0;
          wheel.last = { k, place: g.hemTo, color: scale(g.hemTo, new THREE.Color()), at: ctx.time };
          fire('dip', hub.x, hub.z, { gore: k, place: g.hemTo });
        }
        g.since += dt;
        if (g.hemTo < low) g.hemTo = low;                                         // never more than three neighbouring dyes on the wheel
        if (g.hem < g.hemTo) g.hem = Math.min(g.hemTo, g.hem + dt * (g.since < 7 ? 0.3 : 0.08));      // in the pit it takes the dye; in the air it is only drawn after the evening (0.08 of a place a second: a rider on the current moves the evening on by 0.07)
        g.top = Math.max(g.topFrom + (g.topTo - g.topFrom) * smooth(0, half, g.since), g.hem - 1);
        if (Math.abs(g.hem - hem0) > 1e-4 || Math.abs(g.top - top0) > 1e-4) paint(k);
      }
    } });
  });

  // ================================================================================================ the rain
  part('the rain', () => {
    if (QS.get('wrain') === '0' || !wheel) return;
    const R = W.floats.reach, lanes = W.gores.lanes, arms = wheel.arms || [], rnd = ctx.rng(9100);
    const zone = kit.at(202, -3);                                                 // the drift over the left of the pass (set.js rings the water there)
    const nRim = kit.count(300), nGore = Math.max(1, Math.round(kit.count(22))), nDrift = kit.count(60), n = nRim + arms.length * nGore + nDrift;
    const A = new Float32Array(n * 4), B = new Float32Array(n * 4); let i = 0;
    for (let j = 0; j < nRim; j++, i++) {                                         // the rising rim, 4 to 2 o'clock, most of it low
      const th = -0.6 + 1.15 * Math.pow(rnd(), 1.5), far = rnd() < 0.3, sgn = rnd() < 0.5 ? -1 : 1;
      A.set([0, th, sgn * (far ? 3 + 2.8 * rnd() : 1.6 + 0.5 * (rnd() - 0.5)), rnd()], i * 4); B.set([1.6 + 1.6 * rnd(), rnd(), 0.016 + 0.01 * rnd(), 0], i * 4);
    }
    arms.forEach((arm, k) => {                                                    // each gore's hem, for 20 s after it leaves the pit
      const lane = lanes[Math.floor(arm / 2) % 3] * (arm % 2 ? -1 : 1);
      for (let j = 0; j < nGore; j++, i++) {
        const r = W.gores.rail[0] + (W.gores.rail[1] - W.gores.rail[0]) * Math.sqrt(rnd());
        A.set([1 + k, r, lane + (rnd() - 0.5) * 0.2, rnd()], i * 4); B.set([0.8 + 1.2 * rnd(), rnd(), 0.016 + 0.01 * rnd(), (arm / W.arms.pairs) * TAU], i * 4);
      }
    });
    for (let j = 0; j < nDrift; j++, i++) {                                       // fine rain on the breeze
      const a = rnd() * TAU, q = 8 * Math.sqrt(rnd()), h = 8 + 5 * rnd();
      A.set([20, Math.cos(a) * q, Math.sin(a) * q, rnd()], i * 4); B.set([h / 5 + 0.3 + 0.8 * rnd(), rnd(), 0.009 + 0.004 * rnd(), h], i * 4);
    }
    const bead = new THREE.OctahedronGeometry(1, 0).toNonIndexed(); bead.computeVertexNormals();
    const geo = new THREE.InstancedBufferGeometry(); geo.setAttribute('position', bead.attributes.position); geo.setAttribute('normal', bead.attributes.normal);
    geo.setAttribute('aRainA', new THREE.InstancedBufferAttribute(A, 4)); geo.setAttribute('aRainB', new THREE.InstancedBufferAttribute(B, 4)); geo.instanceCount = n;
    const U = {
      uRain: { value: new THREE.Vector4(hub.x, hub.y, hub.z, R) }, uRainB: { value: new THREE.Vector4(0, 0, om, 1) },
      uRainC: { value: new THREE.Vector4(W.gores.rail[0], W.gores.rail[1], W.gores.length[0], W.gores.length[1]) },
      uRainZone: { value: new THREE.Vector4(zone.x, zone.z, 0, 0) }, uRainRim: { value: new THREE.Color('#c8848c') },
      uGoreDye: { value: Array.from({ length: 10 }, () => new THREE.Color('#c8848c')) },
    };
    const RAIN = {
      uniforms: U,
      vertexPars: /* glsl */`attribute vec4 aRainA; attribute vec4 aRainB; uniform vec4 uRain, uRainB, uRainC, uRainZone; uniform vec3 uRainRim; uniform vec3 uGoreDye[10]; varying vec3 vRainC;`,
      vertexWorld: /* glsl */`{
        float per = aRainB.x, tau = fract(uRainB.x / per + aRainB.y) * per, grav = 9.81, om = uRainB.z, on = 1.0, low = 0.5;
        vec3 hub = uRain.xyz, p0, v0, tint = uRainRim;
        if (aRainA.x < 0.5) {
          // the rising rim: it lets go where it is, with the rim's own pace
          float th = aRainA.y;
          p0 = hub + vec3(uRain.w * cos(th), uRain.w * sin(th), aRainA.z);
          v0 = om * uRain.w * vec3(-sin(th), cos(th), 0.0) + vec3(0.0, 0.0, -0.5);
        } else if (aRainA.x < 15.0) {
          // a gore's hem: every thread hangs plumb from its peg on the arm, the longer the further out
          float al = aRainB.w + uRainB.y - om * tau, r = aRainA.y;
          float len = mix(uRainC.z, uRainC.w, clamp((r - uRainC.x) / (uRainC.y - uRainC.x), 0.0, 1.0));
          p0 = hub + vec3(r * cos(al), r * sin(al) - len, aRainA.z);
          v0 = om * r * vec3(-sin(al), cos(al), 0.0);
          float since = mod(al + 1.5707963, 6.2831853) / om;                    // seconds since its arm stood straight down
          on *= step(2.0, since) * (1.0 - step(2.0 + 20.0 * (1.0 - 0.85 * aRainA.w), since)) * step(0.4, p0.y);
          tint = uGoreDye[int(aRainA.x - 0.5)];
        } else {
          // the drift: fine rain that has reached its speed, carried west
          p0 = vec3(uRainZone.x + aRainA.y, aRainB.w, uRainZone.y + aRainA.z);
          v0 = vec3(0.0, -5.0, -1.2); grav = 0.5; low = 0.03;
        }
        float tl = (v0.y + sqrt(v0.y * v0.y + 2.0 * grav * max(p0.y - low, 0.0))) / grav;
        on *= (1.0 - step(tl, tau)) * smoothstep(0.0, 0.08, tau) * step(aRainA.w, uRainB.w);
        vec3 c = p0 + v0 * tau - vec3(0.0, 0.5 * grav * tau * tau, 0.0);
        vec3 vel = v0 - vec3(0.0, grav * tau, 0.0); float sp = length(vel); vec3 dir = vel / max(sp, 0.001);
        float dist = length(c - cameraPosition);
        on *= smoothstep(1.2, 2.2, dist);                                         // nothing in the rider's face
        float fine = aRainA.x > 15.0 ? 0.6 : 1.0;
        float wide = max(aRainB.z, dist * 0.0021 * fine), al2 = dot(position, dir), len2 = wide + (0.04 + 0.016 * sp) * fine;
        vec3 p = ((position - dir * al2) * wide + dir * (al2 * len2 * (al2 < 0.0 ? 1.5 : 0.6))) * on;
        wp.xyz = c + p; wn = normalize(position - dir * al2 * 0.8);
        vRainC = tint;
      }`,
      fragmentPars: /* glsl */`varying vec3 vRainC;`,
      albedo: /* glsl */`albedo = vRainC;`,
    };
    // (lit against the sun in its DYE's colour: with the family's pale back-light the drops were white sparks on the door's indigo)
    const mat = kit.gouache({ color: '#ffffff', brush: 0, shade: 0.6, backlight: 0.3, backColor: '#ffffff', crisp: true, extend: [RAIN, sun ? sun.extend : null].filter(Boolean) });
    const mesh = new THREE.Mesh(geo, mat); mesh.name = 'wheel-rain'; mesh.frustumCulled = false;
    ctx.add(mesh);
    if (sun && sun.solid) sun.solid(mesh, false);
    const rain = out.wheel.rain; rain.object = mesh;
    // for sound: how much of it is round the boat: 1 inside the drift, less with the distance from the pier
    rain.level = () => {
      const b = ctx.boat; if (!b) return 0;
      const inDrift = 1 - smooth(6, 12, Math.hypot(b.x - zone.x, b.z - zone.z));
      const dx = Math.max(W.pier.x[0] - b.x, 0, b.x - W.pier.x[1]), dz = Math.max(W.pier.z[1] - b.z, 0, b.z - W.pier.z[0]);
      return rain.amount * Math.max(inDrift, 0.6 * (1 - smooth(3, 40, Math.hypot(dx, dz))));
    };
    const lit = new THREE.Color(), tmp = new THREE.Color();
    ticks.push({ name: 'the rain', fn(dt) {
      U.uRainB.value.set(ctx.time, wheel.angle, om, clamp01(rain.amount));
      // the drops are the dye that is running off: each gore's own, and at the rim the dye last dipped (lit against the sun)
      for (let k = 0; k < 10; k++) { const g = G[k]; if (g) scale(g.hem, tmp, dyes).lerp(scale(g.hem, lit, backs), 0.5); else tmp.set('#c8848c'); U.uGoreDye.value[k].lerp(tmp, 1 - Math.exp(-dt * 2)); }
      if (wheel.last && wheel.last.place != null) { scale(wheel.last.place, tmp, dyes).lerp(scale(wheel.last.place, lit, backs), 0.5); U.uRainRim.value.lerp(tmp, 1 - Math.exp(-dt * 0.5)); }
    } });
  });

  // ================================================================================================ the floats and the pit
  part('the floats', () => {
    if (!wheel || !wheel.onFloat) return;
    const later = [], pier = wheel.points && wheel.points.pier;
    const mouth = (name, x) => { let v = null; try { v = pier && pier.point ? pier.point(name) : null; } catch (e) { v = null; } return v && Number.isFinite(v.x) && Math.abs(v.x - x) < 6 ? [v.x + Math.sign(x - hub.x) * 1.4, v.z] : [x + Math.sign(x - hub.x) * 1.4, hub.z]; };
    const north = mouth('arch_north', W.pier.x[1]), south = mouth('arch_south', W.pier.x[0]);
    wheel.onFloat((i, into, p, gone) => {
      const x = p.x, z = p.z;
      if (!gone) {
        ring(x, z + (i % 2 ? 0.9 : -0.9), into ? 0.7 : 0.4, into ? 0.8 : 0.5);
        // the pit breathes out through its two arches: a ripple leaves each, the north one first
        if (into) { later.push({ t: ctx.time + 0.5, at: north }); later.push({ t: ctx.time + 1.1, at: south }); }
      }
      fire('float', x, z, { index: i, into, gone, pitch: 0.4, gain: gone ? 0 : into ? 0.7 : 0.3 });
    });
    out.wheel.arches = { north, south };
    ticks.push({ name: 'the arches', fn() { for (let j = later.length - 1; j >= 0; j--) if (ctx.time >= later[j].t) { const a = later[j].at; later.splice(j, 1); ring(a[0], a[1], 0.6, 0.9); } } });
  });

  // ================================================================================================ the wheel, for staging
  part('the wheel\'s controls', () => {
    if (!wheel) return;
    const eye = new THREE.Vector3();
    out.wheel.across = () => { if (!wheel.gores || !wheel.gores.covers || !sun || !sun.dir || !ctx.boat) return -1; eye.set(ctx.boat.x, 1.3, ctx.boat.z); return wheel.gores.covers(eye, sun.dir); };
    // a nudge: the wheel's angle is a plain clock in heroes.js; its getter is given an eased offset here, never more than
    // a fifth of its pace (the page: "the wheel does not change its pace at all": this is for bringing a gore across the
    // sun during the showstopper's first ten seconds, and it cannot be seen)
    const d = Object.getOwnPropertyDescriptor(wheel, 'angle'), nudges = [];
    const extra = (t) => { let a = 0; for (const q of nudges) a += q.by * smooth(q.t0, q.t0 + q.dur, t); return a; };
    if (d && d.get && d.configurable) {
      Object.defineProperty(wheel, 'angle', { get() { return d.get.call(wheel) + extra(ctx.time); }, configurable: true, enumerable: true });
      out.wheel.nudge = (radians, seconds) => { const dur = Math.max(1, seconds), most = 0.2 * om * dur / 1.5, by = Math.max(-most, Math.min(most, radians)); if (Math.abs(by) > 1e-6) nudges.push({ by, t0: ctx.time, dur }); return by; };      // (a smooth step's steepest pace is 1.5 times its mean)
    } else out.wheel.nudge = () => 0;
  });

  // ================================================================================================ the wind's fronts
  part('the wind', () => {
    if (!wind || !wind.front || !wind.state) throw new Error('shared.wind is not the toolkit\'s wind (set.js)');
    const GU = plan.gusts, F = wind.state, rnd = ctx.rng(9300), wo = out.wind;
    wo.breath = () => wind.front({ from: { s: GU.breath.from }, speed: GU.breath.speed, depth: GU.breath.depth, strength: GU.breath.strength, hold: GU.breath.seconds ?? 9 });
    wo.gust = () => wind.front({ from: { s: GU.great.from }, speed: GU.great.speed, depth: GU.great.depth, strength: GU.great.strength });      // held: until release()
    wo.release = (o) => wind.release(o);
    /** Where the front's leading line is, as metres along the way it runs past the boat (negative: it has not reached the boat). */
    wo.past = () => (F.speed > 0 && ctx.boat ? F.q0 + F.speed * (ctx.time - F.t0) - (F.nx * ctx.boat.x + F.nz * ctx.boat.z) : F.q0 > 0 ? 1e6 : -1e6);
    const sx = sun && sun.dir ? sun.dir.x : 0, sz = sun && sun.dir ? sun.dir.z : -1, sl = Math.hypot(sx, sz) || 1;
    ticks.push({ name: 'the wind\'s mark', fn(dt) {
      if (!(F.speed > 0) || !(F.strength > 0) || !ctx.boat) return;
      const b = ctx.boat, lead = F.q0 + F.speed * (ctx.time - F.t0), ahead = lead - (F.nx * b.x + F.nz * b.z);
      if (ahead < -50 || ahead > 60) return;                                      // its line is beyond the water that can ring
      const u0 = -F.nz * b.x + F.nx * b.z;
      // cat's-paws: a line of small ripples at its leading edge, thicker for a harder wind
      if (wo.marks) for (let k = 0, n = 10 + Math.round(14 * F.strength); k < n; k++) {
        const u = u0 + (rnd() - 0.5) * 70, q = lead - rnd() * rnd() * 1.5;
        ring(F.nx * q - F.nz * u, F.nz * q + F.nx * u, 0.3 + 0.3 * F.strength * rnd(), 0.25 + 0.25 * rnd());
      }
      // the comb: behind a hard front the film is drawn out in streaks that point at the sun
      const t = ctx.water && ctx.water.trace;
      // (many, fine and faint: a few bold ones lay on the water like leaves)
      if (wo.combing && F.strength >= 0.9 && t && t.line) for (let k = 0; k < 7; k++) {
        const u = u0 + (rnd() - 0.5) * 56, q = lead - 1 - rnd() * 6, x = F.nx * q - F.nz * u, z = F.nz * q + F.nx * u, len = 3 + 2.5 * rnd();
        t.line(x, z, x + (sx / sl) * len, z + (sz / sl) * len, { channel: rnd() < 0.5 ? 'a' : 'b', radius: 0.09 + 0.06 * rnd(), strength: +(QS.get('wcomb') || 0.6) });
      }
    } });
    const want = QS.get('front');
    if (want === 'breath') wo.breath(); else if (want === 'great') wo.gust();
  });

  return {
    update(dtRaw) {
      const dt = Math.min(0.05, Math.max(0, dtRaw || 0));
      if (!(dt > 0)) return;
      for (const t of ticks) { if (t.dead) continue; try { t.fn(dt); } catch (e) { t.dead = true; console.error(`reach/cast: ${t.name} stopped: ` + (e && e.stack || e)); } }
    },
  };
}
