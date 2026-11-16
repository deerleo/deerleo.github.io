// The orchard in snow: the cast, group "Lights" (plan: docs/build/snow/3-cast-plan.md; log: docs/build/snow/3-cast-lights.md).
// The small lights and breaths: the only warm things in the water, and the only vapour above it.
//
//   RIVER STEAM (row 12, WINTER)  48 wisps 1.5 to 3 m tall over open water, thickest under the bridge (s 46), at the outlier
//                         (s 84) and in the thaw (s 224 to 264): soft quads that face the eye, frost blue on the black
//                         road, rising 0.25 m/s, leaning, curling, nine seconds each; they lean away from the hull within
//                         4 m, turn gold inside the bow lantern's globe, run at half speed with reduced motion. No family
//                         gives steam: it is made here (one instanced mesh, one draw call), direct view only.
//   FIREFLIES (row 5, MEMORY)  the flood orchard's (docs/life/lights.md: makeFireflies), only in the water's mirror, strewn
//                         under the remembered trees and in the skirts of the reflected crown; none within 7 m of the
//                         kept lamp, dark round the stag and the egrets. Before the showstopper only the sixty scouts
//                         pulse, from page s 100 on (by distance, no cue). The whole set is a control for the staging.
//   THE HIVES (row 8)     a thread of vapour at each of the six entrances (winter; the steam's own mesh), and in the water
//                         the orchard's bees coming home (MEMORY: makeBees, mirror only); a hum level by distance.
//   MOTHS (row 6, WINTER) two pale winter moths that come to the boat's lantern when the boat has been still for six
//                         seconds and leave when it makes way (makeMoths, species winter). The lit lamp's four moths are
//                         the engine's (heroes.js) and are not touched.
//
// shared.cast (for the stager; the log says what each does):
//   flies   { set, object, tick(T), scouts(level, seconds), wave(opts), level(v, seconds), litNear(x, y, z, radius), avoid }
//   steam   { object, level(v) }
//   hives   { hum, bees, entrances }
//   moths   { set }
//
// CRITIQUE, 8 November (docs/build/snow/5-critique.md): the hives' THREADS and the BEES in the water are off (neither
// could be found in a picture from the boat): STEAM.vapour.on and BEES_ON below; &threads=1 and &bees=1 draw them. The
// hum stays. The steam is narrower and fainter than it was built, and its thick is eased toward a ceiling (&steamtop=).
// Developer switches: &lskip=steam,flies,hives,bees,moths leaves kinds out; &flies=all lights every firefly again and again
//   (to see where they were strewn); &steamk=<opacity> another strength for the steam.
import * as THREE from 'three';
import { makeFireflies } from '../../engine/life/lights.js';
import { makeBees, makeMoths } from '../../engine/life/insects.js';
import { FOG_PARS, NOISE_GLSL } from '../../engine/kit.js';

const Q = new URLSearchParams(location.search);
const num = (k, d) => { const v = parseFloat(Q.get(k)); return Number.isFinite(v) ? v : d; };
const SKIP = new Set((Q.get('lskip') || '').split(',').filter(Boolean));
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// ---- the numbers (the plan's; what is mine is said)
const STEAM = {
  count: 48, tall: [1.5, 3], wide: [0.7, 1.2], life: 9, opacity: num('steamk', 0.95),      // (critique: narrower and fainter than they were, 0.9 to 1.5 m at 1.3: beside the hull, against the black water, the wide ones were balls of cotton wool)
  // where it stands, as stretches of the page's s and how many wisps each has (the page: thickest under the bridge, at the
  // outlier and in the thaw; the rest strewn down the river and the road)
  stretches: [[43, 49, 10], [80, 88, 9], [226, 262, 14], [28, 40, 3], [52, 78, 5], [90, 99, 2], [120, 165, 4], [205, 222, 1]],
  // the thread at a hive's melt notch. THE ONE LINE (critique, 8 November): `on`. At the page's 0.4 m, in the steam's own
  // frost blue, it was pale on white hives under snow and nobody found it in a picture; made the wash (a step darker than
  // the snow), nearly twice as tall and set a hand's breadth out from the hive's face it still could not be found from the
  // water's edge, 8 m off, enlarged three times. Off until someone can make it read. &threads=1 (developer) draws them.
  vapour: { tall: num('threadtall', 0.75), wide: num('threadwide', 0.13), life: 4, on: Q.get('threads') === '1', out: num('threadout', 0.14) },
  // (Critique: seen from beside the boat a wisp at its fullest was a white ball. Its strength is now eased toward a ceiling,
  // so that the thick of a wisp is a veil the far bank shows through, and its thin parts are as they were.)
  ceiling: num('steamtop', 0.58),
};
// THE ONE LINE (critique, 8 November): the bees in the water. A bee is smaller than the brush that paints the water's
// picture; nobody has found one in any picture from the boat. They are second on the page's own list of cuts. The hum stays.
const BEES_ON = Q.get('bees') === '1';
const FLY = {
  count: 2500, intensity: 7.4, scouts: 60, scoutEvery: [5, 9], from: 100, until: 240,      // the page's; `from`: the boat's page s from which the scouts pulse
  lamp: 7, stag: 4, egret: 2,                                // metres no firefly lights within
  size: [0.07, 0.11], minPixels: 3.4, mirrorSize: 2.2,       // NOT the family's (0.04 to 0.07, 2.2, 1.7): what stands behind a firefly in this water is mostly pale blossom, and at the family's size the near ones were points of two pixels, lost on it
  under: { share: 0.76, radius: 4.2, y: [0.4, 3.4] },        // under each remembered tree of the avenues
  skirts: { radius: [15, 28], y: [0.6, 6.5] },               // in the skirts of the reflected crown
};
const HIVE = { hum: 0.25, near: 8, far: 12, homing: 14, every: 1.5 };

export async function build(ctx, plan, shared) {
  const { kit } = ctx, F = shared.frame, here = shared.here || { s: 0, d: 0 }, memory = shared.memory || { amount: 1 }, ES = ctx.engine.shared;
  const cast = shared.cast = shared.cast || {};
  const seen = shared.seen || ((h) => new THREE.Color(h)), inWater = shared.inWater || seen;
  const calm = !!ctx.reducedMotion, updates = [];
  const attempt = async (name, fn) => {
    if (SKIP.has(name)) return;
    try { await fn(); } catch (err) { console.error(`INVALID_CAST snow/cast_lights: ${name} could not be built and is left out (${(err && err.message) || err})`); }
  };
  const tree = shared.tree || {}, T = plan.tree, treeAt = tree.at || F.at(T.at[0], T.at[1], 0);
  // THE BOW LANTERN'S PLACE, in the realm's own coordinates. Not the light's world position: while a picture's seconds are
  // run before it is taken the boat's model has not been placed, and that position is the lantern's place in the boat.
  // So: where the lantern hangs in the boat, once, and the boat's own place and heading every time it is asked.
  const boatModel = ctx.engine.boat && ctx.engine.boat.model, boatLight = boatModel && boatModel.light;
  const hang = boatLight && boatModel.group ? boatModel.group.worldToLocal(boatLight.getWorldPosition(new THREE.Vector3())) : new THREE.Vector3(0.3, 0.8, -2.3);
  const lanternAt = (out) => { const bt = ctx.boat, c = Math.cos(bt.heading), sn = Math.sin(bt.heading); return out.set(bt.x + c * hang.x + sn * hang.z, hang.y, bt.z - sn * hang.x + c * hang.z); };
  const entrances = (shared.left && shared.left.entrances && shared.left.entrances.every(Boolean)) ? shared.left.entrances
    : Array.from({ length: plan.left.hives.count }, (_, i) => F.at(plan.left.hives.at[0] + (i - 2.5) * 0.62, plan.left.hives.at[1] - 0.28, plan.left.hives.deck + 0.12));

  // ================================================================================================ river steam, and the hives' threads
  await attempt('steam', async () => {
    const rnd = ctx.rng(6121), want = kit.count(STEAM.count), all = STEAM.stretches.reduce((a, s) => a + s[2], 0);
    const base = [], shape = [];
    const openAt = (s, d) => {                               // only over open water
      if (s < plan.straight) return Math.abs(d) < plan.openHalf(s) - 2;
      const P = plan.pondOpen, r = Math.hypot(s - P.at[0], d - P.at[1]);
      if (r < P.r - 1.5) return r > 10;                      // (in the pond: clear of the islet)
      return Math.abs(d) < plan.openHalf(s) - 1.2;
    };
    for (const [s0, s1, k] of STEAM.stretches) {
      const n = Math.max(1, Math.round(k * want / all));
      for (let i = 0, tries = 0; i < n && tries < 200; tries++) {
        const s = s0 + (s1 - s0) * rnd(), d = (rnd() * 2 - 1) * 8;
        if (!openAt(s, d)) continue;
        const p = F.at(s, d, 0);
        base.push(p.x, 0.02, p.z, rnd());
        shape.push(STEAM.tall[0] + (STEAM.tall[1] - STEAM.tall[0]) * rnd(), STEAM.wide[0] + (STEAM.wide[1] - STEAM.wide[0]) * rnd(), STEAM.life * (0.85 + 0.3 * rnd()), rnd() * 6.28);
        i++;
      }
    }
    const wisps = base.length / 4;
    if (STEAM.vapour.on && !SKIP.has('hives')) for (const e of entrances) {       // a thread of vapour from each hive's melt notch
      base.push(e.x - STEAM.vapour.out, e.y, e.z, rnd());      // (a hand's breadth out from the hive's face, toward the channel: at the notch itself the hive's own front hid it)
      shape.push(STEAM.vapour.tall, STEAM.vapour.wide, STEAM.vapour.life * (0.8 + 0.4 * rnd()), rnd() * 6.28);
    }
    const quad = new THREE.PlaneGeometry(1, 1, 1, 6); quad.translate(0, 0.5, 0);
    const geo = new THREE.InstancedBufferGeometry(); geo.index = quad.index; geo.setAttribute('position', quad.attributes.position);
    geo.setAttribute('aBase', new THREE.InstancedBufferAttribute(new Float32Array(base), 4));
    geo.setAttribute('aShape', new THREE.InstancedBufferAttribute(new Float32Array(shape), 4));
    geo.instanceCount = base.length / 4;
    const uniforms = {
      uTime: ES.uTime, uCameraPos: ES.uCameraPos, uFogColor: ES.uFogColor, uFogDensity: ES.uFogDensity, uVeil: ES.uVeil, uVeilColor: ES.uVeilColor,
      uLantern: { value: new THREE.Vector3(0, -100, 0) }, uHull: { value: new THREE.Vector2(0, 1e5) }, uFwd: { value: new THREE.Vector2(0, -1) }, uWind: { value: new THREE.Vector2(0.5, -0.25) },
      uSpeed: { value: calm ? 0.5 : 1 }, uOpacity: { value: STEAM.opacity },
      uColor: { value: seen(plan.chip.frost) }, uGold: { value: seen(plan.chip.globe) }, uThread: { value: seen(plan.chip.wash) }, uTop: { value: STEAM.ceiling },
    };
    const mat = new THREE.ShaderMaterial({
      uniforms, transparent: true, depthWrite: false, side: THREE.DoubleSide,
      vertexShader: /* glsl */`
        attribute vec4 aBase, aShape;
        uniform float uTime, uSpeed; uniform vec3 uCameraPos; uniform vec2 uHull, uFwd, uWind;
        varying vec2 vUv; varying float vLife, vDist, vSeed, vClear, vBig; varying vec3 vW;
        void main() {
          float turn = uTime * uSpeed / aShape.z + aBase.w, life = fract(turn), cyc = floor(turn);
          float h = aShape.x, y = position.y, up = y * h, big = step(1.0, h);
          vec3 c = aBase.xyz;
          // each new wisp stands a little elsewhere (the hives' threads stay at their notches)
          float j = fract(sin((cyc + aBase.w * 91.0) * 12.9898) * 43758.5453);
          c.xz += (vec2(j, fract(j * 7.31)) - 0.5) * 1.4 * big;
          // it leans with the air and curls, more with height; within four metres of the hull it leans away from it
          vec2 lean = uWind * up * 0.22 + vec2(sin(up * 2.1 + uTime * uSpeed * 0.6 + aShape.w), cos(up * 1.7 + uTime * uSpeed * 0.45 + aShape.w * 1.7)) * 0.11 * up;
          vec2 away = c.xz - uHull; float d = length(away);
          // no wisp stands in the boat or against it: one whose foot is within 1.3 m of the hull's own line (from 3 m astern
          // of the rider, where the rower stands, to the stem) is not there, and it is whole from 2.7 m
          float along = clamp(dot(away, uFwd), -3.0, 2.4);
          vClear = mix(1.0, smoothstep(1.3, 2.7, length(away - uFwd * along)), big);
          lean += away / max(d, 0.001) * (1.0 - smoothstep(1.5, 4.0, d)) * 0.45 * up * big;
          c += vec3(lean.x, up, lean.y);
          vec4 wp = modelMatrix * vec4(c, 1.0);
          // a quad that stands upright and faces the eye; it spreads as it rises
          vec2 e = uCameraPos.xz - wp.xz; vec2 side = normalize(vec2(e.y, -e.x) + 1e-5);
          wp.xz += side * position.x * aShape.y * mix(1.0, 1.45, y);
          vW = wp.xyz; vUv = vec2(position.x + 0.5, y); vLife = life; vSeed = aShape.w; vBig = big;
          vec4 mv = viewMatrix * wp; vDist = length(mv.xyz);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */`
        ${FOG_PARS} ${NOISE_GLSL}
        uniform float uTime, uSpeed, uOpacity, uTop; uniform vec3 uColor, uGold, uLantern, uThread;
        varying vec2 vUv; varying float vLife, vDist, vSeed, vClear, vBig; varying vec3 vW;
        void main() {
          float x = abs(vUv.x - 0.5) * 2.0, rise = vUv.y;
          // breath off the water: nothing at the surface, fullest a quarter of the way up, thinning to nothing at its top;
          // the part that is rising now is a little denser; its edges are torn
          float column = smoothstep(0.0, 0.42, rise) * (1.0 - smoothstep(0.42, 1.0, rise));
          float win = 1.0 - smoothstep(0.1, 0.6, abs(rise - (0.1 + 0.75 * vLife)));
          // torn by two noises that climb with it, so that no two wisps are one shape and none has an edge
          vec2 q = vec2(vUv.x * 2.2 + vSeed + 0.35 * sin(rise * 4.0 + uTime * uSpeed * 0.5 + vSeed), rise * 2.6 - uTime * uSpeed * 0.3 + vSeed * 3.0);
          float n = fbm(q), n2 = fbm(q * 2.3 + 11.0);
          float edge = 1.0 - smoothstep(0.02 + 0.5 * n2, 0.45 + 0.55 * n, x);      // (its sides torn by the finer noise as well: with the coarse one alone they were straight, and a wisp was a pane)
          float a = column * mix(0.45, 1.0, win) * edge * sin(3.14159 * vLife) * smoothstep(0.25, 0.75, 0.6 * n + 0.6 * n2) * uOpacity;
          a *= (1.0 - smoothstep(34.0, 46.0, vDist)) * smoothstep(0.7, 1.6, vDist);      // seen to forty metres; never in the lens
          a *= vClear * mix(0.4, 1.0, smoothstep(2.0, 10.0, vDist));                     // not in the boat; a veil, not a wall, at arm's length
          // (a wisp's thick is a veil, never a white ball: its strength eases toward a ceiling; a hive's thread is small and is given more)
          a = uTop * (1.0 - exp(-a * mix(3.2, 1.0, vBig) / uTop));
          vec3 col = mix(mix(uThread, uColor, vBig), uGold, (1.0 - smoothstep(1.2, 3.5, distance(vW, uLantern))) * 0.8 * vBig);      // gold inside the lantern's globe; a hive's thread is the wash, dark on its white hive
          col = applyFog(col, vDist);
          gl_FragColor = vec4(col, a * (1.0 - uVeil));
        }`,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = `river steam x${wisps} and the hives' threads x${base.length / 4 - wisps} (winter)`;
    mesh.frustumCulled = false; mesh.renderOrder = 6;
    ctx.add(mesh); ctx.only(mesh, 'direct');                  // winter: no steam in the water
    const lp = new THREE.Vector3();
    cast.steam = { object: mesh, wisps, level(v) { uniforms.uOpacity.value = STEAM.opacity * Math.max(0, v); return cast.steam; } };
    updates.push(() => {
      uniforms.uHull.value.set(ctx.boat.x, ctx.boat.z);
      uniforms.uFwd.value.set(-Math.sin(ctx.boat.heading), -Math.cos(ctx.boat.heading));
      ctx.group.localToWorld(lanternAt(uniforms.uLantern.value));      // (the shader measures in the world)
    });
  });

  // ================================================================================================ fireflies in the water
  await attempt('flies', async () => {
    const rnd = ctx.rng(3140), pts = [];
    const lamp = shared.lamp && shared.lamp.position ? shared.lamp.position : F.at(plan.lamp.flame[0], plan.lamp.flame[1], plan.lamp.flame[2]);
    const clear = (x, z) => Math.hypot(x - lamp.x, z - lamp.z) > FLY.lamp + 0.5;
    const trees = plan.trees.trees.filter((t) => t.memory && t.s > 100 && t.s < 262 && Math.abs(t.d) < 30);
    const nUnder = Math.round(FLY.count * FLY.under.share), each = Math.max(1, Math.round(nUnder / Math.max(1, trees.length)));
    for (const t of trees) for (let i = 0; i < each; i++) {
      const a = rnd() * 6.2832, r = Math.sqrt(rnd()) * FLY.under.radius, x = t.x + Math.cos(a) * r, z = t.z + Math.sin(a) * r;
      if (clear(x, z)) pts.push(x, FLY.under.y[0] + (FLY.under.y[1] - FLY.under.y[0]) * rnd() * rnd(), z);
    }
    for (let i = 0, tries = 0; pts.length / 3 < FLY.count && tries < 4000; tries++) {
      const a = rnd() * 6.2832, r = FLY.skirts.radius[0] + (FLY.skirts.radius[1] - FLY.skirts.radius[0]) * rnd(), x = treeAt.x + Math.cos(a) * r, z = treeAt.z + Math.sin(a) * r;
      if (clear(x, z)) { pts.push(x, FLY.skirts.y[0] + (FLY.skirts.y[1] - FLY.skirts.y[0]) * rnd(), z); i++; }
    }
    // no firefly lights within 7 m of the kept lamp, 4 m of the stag, 2 m of an egret
    const stagAt = { position: new THREE.Vector3(0, -1000, 0), radius: FLY.stag };
    const avoid = [{ position: lamp, radius: FLY.lamp }, stagAt];
    for (const r of (tree.roosts || [])) if (r) avoid.push({ position: r, radius: FLY.egret });
    const flies = makeFireflies(ctx, {
      points: new Float32Array(pts), only: 'mirror', hull: false, color: inWater(plan.chip.firefly), intensity: FLY.intensity,
      scouts: FLY.scouts, scoutEvery: FLY.scoutEvery, avoid, seed: 3140, size: FLY.size, minPixels: FLY.minPixels, mirrorSize: FLY.mirrorSize,
    });
    flies.object.name = `fireflies in the water x${flies.count} (MEMORY)`;
    flies.scouts(0, 0.1);
    let hand = false, scoutsOn = -1, lvl = -1;                 // (hand: the staging has taken the scouts and the level over)
    cast.flies = {
      set: flies, object: flies.object, avoid, front: flies.front,
      tick: (clock) => { flies.tick(clock); return cast.flies; },
      scouts: (level = 1, seconds = 1.5) => { hand = true; flies.scouts(level, seconds); return cast.flies; },
      level: (v = 1, seconds = 2) => { hand = true; flies.level(v, seconds); return cast.flies; },
      /** One front: by default the orchard's tide, from far down the second avenue eastward (toward the cave) at full strength. */
      wave: (o = {}) => flies.wave({ origin: F.at(262, 0, 0).toArray(), dir: [0, 0, 1], strength: 1, ...o }),
      litNear: (x, y, z, radius = 6) => flies.litNear(x, y, z, radius),
      /** Give the scouts and the level back to the distance rule (the scouts from s 100, all of it faded with the memory). */
      release() { hand = false; scoutsOn = -1; lvl = -1; return cast.flies; },
    };
    if (Q.get('flies') === 'all') { cast.flies.level(1, 0.1); flies.scouts(1, 0.1); ctx.stage.every(1.6, () => flies.wave({ origin: F.at(262, 0, 0).toArray(), dir: [0, 0, 1], strength: 1 })); let clock = 0; updates.push((dt) => { clock += dt; flies.tick(clock); }); }
    updates.push(() => {
      const d = cast.stag && cast.stag.dark;
      if (d && d.w > 0) stagAt.position.set(d.x, d.y, d.z); else stagAt.position.set(0, -1000, 0);
      flies.object.visible = here.s > FLY.from - 30 && memory.amount > 0.02;
      if (hand) return;
      const on = here.s >= FLY.from && here.s < FLY.until ? 1 : 0, m = Math.round(memory.amount * 20) / 20;
      if (on !== scoutsOn) { scoutsOn = on; flies.scouts(on, 2); }
      if (m !== lvl) { lvl = m; flies.level(m, 0.5); }       // faded with the memory through the thaw
    });
  });

  // ================================================================================================ the hives: the bees in the water, the hum
  await attempt('hives', async () => {
    const mid = entrances.reduce((a, e) => a.add(e), new THREE.Vector3()).multiplyScalar(1 / entrances.length);
    const api = cast.hives = { hum: 0, entrances, bees: null, at: mid };
    if (BEES_ON && !SKIP.has('bees')) {
      const from = F.at(208, 2, 5);                           // they come home from the oldest tree's blossom
      const bees = makeBees(ctx, {
        hives: entrances.map((e) => ({ entrance: [e.x, e.y, e.z], face: [-1, 0], board: [0.4, 0.12] })),      // entrances to the channel
        homing: HIVE.homing, every: HIVE.every, from: [from.x, from.y, from.z], far: 45, seed: 1520,
      });
      bees.object.name = 'bees coming home, in the water (MEMORY)';
      ctx.only(bees.object, 'mirror');                        // never a bee in the air
      api.bees = bees;
      updates.push(() => { bees.object.visible = here.s > 200 && memory.amount > 0.3; });
    }
    updates.push(() => {
      const d = Math.hypot(ctx.boat.x - mid.x, ctx.boat.z - mid.z);
      api.hum = HIVE.hum * (1 - smooth(HIVE.near, HIVE.far, d)) * memory.amount;      // for the staging's drone: never above 0.25, gone past 12 m
    });
  });

  // ================================================================================================ the two winter moths
  await attempt('moths', async () => {
    if (!boatLight) throw new Error('the boat has no lantern to come to');
    const lp = new THREE.Vector3();
    const moths = await makeMoths(ctx, { species: 'winter', lamps: [{ at: () => lanternAt(lp), still: 6, visitors: 2 }], spare: 2 });
    if (moths.object) { moths.object.name = 'two winter moths at the boat\'s lantern (winter)'; ctx.only(moths.object, 'direct'); }
    cast.moths = { set: moths };
  });

  return { update(dt) { for (const u of updates) u(dt); } };
}
