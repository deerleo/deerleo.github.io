// reach: the cast, group "Airs" (stage 3; docs/build/reach/3-cast-plan.md, log: docs/build/reach/3-cast-airs.md).
// The air made visible, in a realm where everything is seen against the sun. This is a BRIGHT realm: nothing here is a
// light. Steam is paint (alpha), not light: dark mauve where it stands between the eye and the sun, pale and warm where
// the sun is behind the eye, with only a thin lit edge added (a third of a dusk value).
//
//   steam          ONE draw of soft billboards for every column: 30 of the 40 vats and the 7 pans (shared.vats: `steam` is
//                  the middle of the liquor), the gallery's two roof vents and the indigo house's ridge vent, eight puffs
//                  to a column, each on a period of its own (nothing puffs in rhythm), rising 3 to 6 m, broadening,
//                  carried west by the reach's wind (shared.wind: its breeze sways them, and a FRONT lays every column
//                  over flat as it passes: the same front as the cloth, lifeFront). The two columns nearest the boat lean
//                  toward its track for three seconds as it passes.
//   far plume      the same draw: the chimney's plume (shared.chimney.top), leaning and scrolling west, and six wisps
//                  over the tenter grounds, beyond 150 m, taking the haze.
//   lint           the toolkit's makeMotes (docs/life/insects.md), kind 'lint': 800 motes that exist only in the ten
//                  shafts of the nave (plan.air.shafts, the same ten set.js draws) and in two beams of the last light in
//                  the loft; they drift west at 0.3 m/s, take the dyed light (shared.sun.light), are swirled by the hull
//                  and streak in a gust. (set.js already keeps 700 motes of dust round the rider: with these, the page's 1,500.)
//   light shafts   BUILT by set.js at the second look ('light shafts': ten bars from the hems that explain them, taking the
//                  dyed light, drifting a hand sideways). Nothing is added: this module only gives staging their level.
//
// shared.cast.airs (for staging; the log says what each does): steam, level, lint, gust(), front(), shafts, loft, plume.
// Developer switches: &airsoff=steam,far,lint leaves kinds out; &steamlevel=<0..2>; &shaftlevel=<0..1>;
//   &airsdebug=1 writes where every column stands and the lint's shafts to .shots/reach_airs_debug.json.
import * as THREE from 'three';
import { lifeClock } from '../../engine/life/ribbons.js';
import { makeMotes } from '../../engine/life/insects.js';

const QS = new URLSearchParams(typeof location !== 'undefined' ? location.search : '');
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const col = (c) => new THREE.Color(c);

export async function build(ctx, plan, shared) {
  const { kit, path } = ctx, D = plan.dye, DYES = plan.dyes, sh = ctx.engine.shared;
  const cast = (shared.cast = shared.cast || {});
  const OFF = (QS.get('airsoff') || '').split(','), off = (name) => OFF.includes(name);
  const rnd = ctx.rng(9241), wind = shared.wind, sun = shared.sun;
  const airs = (cast.airs = { steam: null, level: QS.has('steamlevel') ? +QS.get('steamlevel') : 1, plume: QS.has('plumelevel') ? +QS.get('plumelevel') : 1, lint: null, shafts: { level: QS.has('shaftlevel') ? +QS.get('shaftlevel') : 1 }, loft: 1, columns: [] });
  const L0 = {}, A0 = {};

  // ================================================================================================ steam, and the far plume
  // A column: { x, y, z, rise, from, to (metres across at the liquor and at the top), seconds, puffs, carry (how far the wind
  // takes it, in rises), alpha, tint, far }.
  const columns = airs.columns;
  const body = col('#D2AEA8');                                          // steam with the light on it: pale, warm, a little rose
  const tintOf = (dye) => body.clone().lerp(col(DYES[dye ?? D.MADDER].back), 0.2);
  if (!off('steam')) {
    const V = shared.vats || [], vats = V.filter((v) => !v.pan && v.steam), pans = V.filter((v) => v.pan && v.steam);
    vats.filter((_, i) => i % 4 !== 3).slice(0, 30).forEach((v) => columns.push({ x: v.steam[0], y: v.steam[1], z: v.steam[2], rise: 3 + 3 * rnd(), from: 0.55 * v.across, to: 0.9 * v.across + 1.2 + 0.8 * rnd(), seconds: 11 + 5 * rnd(), puffs: 8, carry: 0.5 + 0.2 * rnd(), alpha: 0.44, tint: tintOf(v.dye) }));
    pans.forEach((v) => columns.push({ x: v.steam[0], y: v.steam[1], z: v.steam[2], rise: 2.8 + 1.2 * rnd(), from: 1.2, to: 2.6 + 0.6 * rnd(), seconds: 12 + 5 * rnd(), puffs: 8, carry: 0.6, alpha: 0.42, tint: tintOf(v.dye) }));      // (first look: broader and fainter they were a formless haze over the apron)
    const g = shared.machines && shared.machines.gallery;
    for (const q of (g && g.vents) || []) if (q) columns.push({ x: q.x, y: q.y, z: q.z, rise: 4 + rnd(), from: 0.7, to: 2.8, seconds: 12 + 3 * rnd(), puffs: 8, carry: 0.7, alpha: 0.38, tint: tintOf(D.MADDER) });
    const hv = shared.indigoHouse && shared.indigoHouse.vent;
    if (hv) columns.push({ x: hv.x, y: hv.y, z: hv.z, rise: 5, from: 0.9, to: 3.4, seconds: 14, puffs: 8, carry: 0.7, alpha: 0.38, tint: tintOf(D.INDIGO) });
  }
  const nearCount = columns.length;
  if (!off('far')) {
    const ch = shared.chimney && shared.chimney.top ? shared.chimney.top : { x: plan.chimney.at[0], y: plan.chimney.height, z: plan.chimney.at[1] };
    const farTint = col('#C2A0AC');
    columns.push({ x: ch.x, y: ch.y, z: ch.z, rise: 20, from: 4, to: 24, seconds: 52, puffs: 12, carry: 3.2, alpha: 0.5, tint: farTint, far: true });
    for (const [x, z] of [[-34, -252], [31, -272], [-45, -300], [39, -318], [-29, -338], [45, -356]])
      columns.push({ x, y: 1.6, z, rise: 8 + 4 * rnd(), from: 2.5, to: 9 + 3 * rnd(), seconds: 30 + 10 * rnd(), puffs: 5, carry: 1.6, alpha: 0.3, tint: farTint, far: true });
  }
  // where each near column stands on the route, and the way to the boat's track from it
  for (const c of columns) { path.locate(c.x, c.z, null, L0); path.at(L0.s, A0); c.s = L0.s; c.d = L0.d; const sg = L0.d > 0 ? -1 : 1; c.inx = A0.rx * sg; c.inz = A0.rz * sg; c.leanAt = -100; }

  let steam = null;
  if (columns.length) {
    const scale = Math.max(0.5, kit.count(8) / 8);
    let N = 0; for (const c of columns) { c.n = Math.max(4, Math.round(c.puffs * scale)); N += c.n; }
    const aBase = new Float32Array(N * 3), aPar = new Float32Array(N * 4), aSeed = new Float32Array(N * 4), aTint = new Float32Array(N * 3), aMore = new Float32Array(N * 4);
    let j = 0;
    columns.forEach((c, ci) => {
      for (let k = 0; k < c.n; k++, j++) {
        aBase.set([c.x, c.y, c.z], j * 3);
        // (FIRST LOOK: with a period of its own for every puff they bunched and parted, and a column was one round ball
        // let go every few seconds: puffing. A column's puffs share its period and follow one another evenly, so it stands
        // as one slow billow; no two COLUMNS share a period.)
        aPar.set([c.rise * (0.9 + 0.2 * rnd()), c.from * (0.85 + 0.3 * rnd()), c.to * (0.85 + 0.3 * rnd()), c.seconds], j * 4);
        aSeed.set([(k + 0.35 * rnd()) / c.n, rnd(), rnd(), c.carry], j * 4);
        aTint.set([c.tint.r, c.tint.g, c.tint.b], j * 3);
        aMore.set([ci, c.alpha, c.far ? 1 : 0, 0], j * 4);
      }
    });
    const geo = new THREE.InstancedBufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]), 3)); geo.setIndex([0, 1, 2, 0, 2, 3]);
    geo.setAttribute('aBase', new THREE.InstancedBufferAttribute(aBase, 3)); geo.setAttribute('aPar', new THREE.InstancedBufferAttribute(aPar, 4));
    geo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(aSeed, 4)); geo.setAttribute('aTint', new THREE.InstancedBufferAttribute(aTint, 3));
    geo.setAttribute('aMore', new THREE.InstancedBufferAttribute(aMore, 4)); geo.instanceCount = N;
    const U = {
      ...(wind ? wind.uniforms : {}), uLifeTime: lifeClock(ctx).uLifeTime, uLevel: { value: new THREE.Vector2(1, 1) },
      uLeanA: { value: new THREE.Vector4(-1, 0, 0, 0) }, uLeanB: { value: new THREE.Vector4(-1, 0, 0, 0) },
      uSunDir: { value: sun ? sun.dir : new THREE.Vector3(0, 0.05, -1) }, uSunLight: { value: new THREE.Color(1, 0.7, 0.4) }, uShade: { value: col('#7C5E78') },
      uKey: sh.uKeyColor || { value: new THREE.Color(1, 1, 1) }, uFogColor: sh.uFogColor, uFogDensity: sh.uFogDensity, uVeil: sh.uVeil,
    };
    const windGLSL = wind ? wind.glsl : /* glsl */`uniform vec4 uLifeWind, uLifeFront; float lifeBreeze(vec2 xz) { return 1.0; } float lifeFront(vec2 xz) { return 0.0; }`;
    if (!wind) { U.uLifeWind = { value: new THREE.Vector4(0, -1, 1, 0) }; U.uLifeFront = { value: new THREE.Vector4(0, -1, -1e6, 0) }; }
    const mat = new THREE.ShaderMaterial({
      uniforms: U, transparent: true, depthWrite: false, depthTest: true, fog: false,
      blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,      // (premultiplied: its body covers, its lit edge is added)
      vertexShader: /* glsl */`${windGLSL}
        attribute vec3 aBase, aTint; attribute vec4 aPar, aSeed, aMore;
        uniform float uLifeTime; uniform vec2 uLevel; uniform vec4 uLeanA, uLeanB; uniform vec3 uSunDir;
        varying vec2 vQ; varying vec4 vCol; varying vec3 vSeed; varying float vDist, vSun;
        void main() {
          float u = fract(uLifeTime / aPar.w + aSeed.x);
          float rise = aPar.x * (1.0 - (1.0 - u) * (1.0 - 0.45 * u)), size = mix(aPar.y, aPar.z, pow(u, 0.7));      // quick at the liquor, slowing as it spreads
          float front = clamp(lifeFront(aBase.xz), 0.0, 1.0), breeze = lifeBreeze(aBase.xz);
          // the wind carries it west, more the higher it has come; it wanders a little by itself
          vec2 lean = uLifeWind.xy * (aSeed.w * (0.35 + 0.65 * breeze) * u * u * aPar.x);
          lean += vec2(sin(uLifeTime * 0.13 + aSeed.y * 40.0), cos(uLifeTime * 0.11 + aSeed.z * 40.0)) * (0.18 * u * size);
          // a front lays the column over flat, down the way the front runs
          rise *= 1.0 - 0.86 * front; lean += uLifeFront.xy * (aPar.x * u * 2.6 * front);
          // the boat going by: this column leans toward its track
          if (abs(aMore.x - uLeanA.x) < 0.5) lean += uLeanA.yz * (u * u);
          if (abs(aMore.x - uLeanB.x) < 0.5) lean += uLeanB.yz * (u * u);
          vec3 c = aBase + vec3(lean.x, rise + 0.3 * size, lean.y);
          vec3 right = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]), up = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
          float turn = aSeed.y * 6.2831853 + (aSeed.z - 0.5) * 0.5 * u;                 // each puff lies its own way round, and turns a little
          vec2 q = vec2(position.x * cos(turn) - position.y * sin(turn), position.x * sin(turn) + position.y * cos(turn));
          vec3 P = c + (right * q.x + up * q.y) * (0.5 * size);
          vec3 toC = c - cameraPosition; vDist = length(toC);
          vSun = pow(max(dot(toC / max(vDist, 1e-3), normalize(uSunDir)), 0.0), 1.5);    // 1 where it stands between the eye and the sun
          float level = mix(uLevel.x, uLevel.y, aMore.z);
          float a = aMore.y * level * smoothstep(0.0, 0.14, u) * pow(1.0 - u, mix(1.25, 0.7, aMore.z)) * smoothstep(1.4, 3.2, vDist) * (1.0 - 0.5 * front);      // (a far plume is long: it thins late)
          vQ = position.xy; vCol = vec4(aTint, a); vSeed = vec3(aSeed.y, aSeed.z, aMore.z);
          gl_Position = projectionMatrix * viewMatrix * vec4(P, 1.0);
        }`,
      fragmentShader: /* glsl */`
        uniform vec3 uSunLight, uShade, uKey, uFogColor; uniform float uFogDensity, uVeil;
        varying vec2 vQ; varying vec4 vCol; varying vec3 vSeed; varying float vDist, vSun;
        void main() {
          float r2 = dot(vQ, vQ); if (r2 > 1.0) discard;
          float lump = sin(vQ.x * 3.3 + vSeed.x * 21.0) * sin(vQ.y * 2.9 + vSeed.y * 17.0) + 0.5 * sin((vQ.x + vQ.y) * 5.7 + vSeed.x * 9.0);
          float bodyA = exp(-r2 * 2.6) * (0.86 + 0.22 * lump) * (1.0 - smoothstep(0.62, 1.0, r2));
          float a = vCol.a * bodyA * (1.0 - uVeil);
          if (a < 0.003) discard;
          // with the sun behind the eye it is pale and warm; between the eye and the sun it is a mauve shade. Far steam is
          // always seen against the bright west: a shade
          // (the director's rule of 22:35, by VALUE: a far plume as pale as the west behind it is not there. It is darker than its sky.)
          vec3 c = mix(vCol.rgb * (0.55 + 0.45 * uKey), mix(uShade, uShade * 0.6, vSeed.z), max(0.78 * vSun, 0.88 * vSeed.z));
          // its edges are lit (1.1): the thin rim of each puff is a little lighter than its heart, in the light's colour.
          // (FIRST LOOK: that light was ADDED as a band round each puff, and every puff was a pale ring: a soap bubble.
          // Now it is paint, and the puff's alpha falls evenly to its edge.)
          float edge = smoothstep(0.1, 0.75, r2);
          c = mix(c, c * 1.1 + 0.1 * uSunLight, edge * (0.35 + 0.65 * vSun) * (1.0 - vSeed.z));
          float fog = 1.0 - exp(-uFogDensity * uFogDensity * vDist * vDist);
          c = mix(c, uFogColor, mix(0.7, 0.3, vSeed.z) * fog);                      // (a far plume given wholly to the haze is the haze: it keeps most of its shade)
          gl_FragColor = vec4(c * a, a);
        }`,
    });
    steam = new THREE.Mesh(geo, mat); steam.name = 'steam'; steam.frustumCulled = false; steam.renderOrder = 5;
    ctx.add(steam); ctx.only(steam, 'direct');
    airs.steam = steam;
  }

  // ================================================================================================ lint in the shafts
  // The ten shafts as set.js draws them (plan.air.shafts: [s of the rank, d, height under its hem, metres long, half width]):
  // each runs from the hem that explains it the way the light travels. And two beams of the last light in the loft.
  let lint = null, shaftList = null;
  const way = new THREE.Vector3(), lightNow = new THREE.Color(1, 0.75, 0.45), lightSet = new THREE.Color(-1, -1, -1);
  const LINT_GAIN = 0.5;
  const makeShafts = () => {
    way.copy(sun ? sun.dir : new THREE.Vector3(0, 0.05, -1)).multiplyScalar(-1).normalize();
    const hexOf = (k) => '#' + lightNow.clone().multiplyScalar(k).getHexString();
    const list = ((plan.air.shafts && plan.air.shafts.at) || []).slice(0, 10).map(([sAt, d, y, len, wide]) => {
      const p = kit.at(sAt, d, y);
      return { from: [p.x, p.y, p.z], to: [p.x + way.x * len * 0.72, p.y + way.y * len * 0.72, p.z + way.z * len * 0.72], radius: wide * 0.7, radiusTo: wide * 1.05, color: hexOf(LINT_GAIN * airs.shafts.level), gain: 1 };
    });
    // the loft: the last light comes level down the rider's own way (the sun's coin stands in the indigo straight ahead).
    // Two broad low beams at the eye's height, either side of the line. (FIRST LOOK: laid 2.6 and 3.4 m up they were
    // above the picture and behind the first rank of cloth: nothing was seen.)
    for (const [s, d, y] of [[248, -0.9, 1.5], [252, 1.1, 1.9]]) {
      const p = kit.at(s, d, y);
      list.push({ from: [p.x - way.x * 10, p.y - way.y * 10, p.z - way.z * 10], to: [p.x + way.x * 10, p.y + way.y * 10, p.z + way.z * 10], radius: 2.0, radiusTo: 2.2, color: hexOf(LINT_GAIN * airs.loft), gain: 1 });
    }
    return list;
  };
  if (!off('lint')) {
    if (sun && sun.light) lightNow.copy(sun.light);
    shaftList = makeShafts();
    lint = makeMotes(ctx, { kind: 'lint', count: 800, wind: [0, -0.012, -0.3], seed: 57, lit: { rule: 'shafts', shafts: shaftList } });
    if (lint.object) lint.object.name = 'lint in the shafts';
    lightSet.copy(lightNow);
    airs.lint = lint;
  }
  /** The lint's answer to a front: it streaks by, the wind k times as fast for `seconds` (the family eases it in and out). */
  airs.gust = (k = 6, seconds = 4) => { if (lint) lint.gust(k, seconds); };
  /** What a cue calls as a front passes the boat: the lint streaks (the steam needs nothing: it reads shared.wind's front itself). */
  airs.front = (strength = 1) => airs.gust(2 + 5 * strength, 3 + 2 * strength);

  // ================================================================================================ every frame
  const shaftBars = () => ctx.group.getObjectByName('light shafts');
  let bars = null, looked = 0, since = 0, levelSet = [1, 1], lean = [null, null];
  ctx.onUpdate((dt) => {
    const t = ctx.time;
    if (steam) {
      const u = steam.material.uniforms;
      u.uLevel.value.set(airs.level, airs.plume);
      if (sun && sun.light) u.uSunLight.value.copy(sun.light);
      // the two columns nearest the boat lean toward its track for three seconds as it passes (once each, eased in and out)
      const bx = ctx.boat.x, bz = ctx.boat.z, amp = ctx.reducedMotion ? 0.45 : 0.9;
      for (let i = 0; i < 2; i++) if (lean[i] && t - lean[i].leanAt > 3) lean[i] = null;
      for (let ci = 0; ci < nearCount; ci++) {
        const c = columns[ci];
        if (t - c.leanAt < 25 || Math.abs(c.x - bx) > 13 || Math.abs(c.z - bz) > 13) continue;
        if ((c.x - bx) * (c.x - bx) + (c.z - bz) * (c.z - bz) > 150) continue;
        const slot = !lean[0] ? 0 : !lean[1] ? 1 : -1; if (slot < 0) break;
        c.leanAt = t; c.ci = ci; lean[slot] = c;
      }
      [u.uLeanA.value, u.uLeanB.value].forEach((v, i) => {
        const c = lean[i]; if (!c) { v.set(-1, 0, 0, 0); return; }
        const e = Math.sin(Math.PI * clamp01((t - c.leanAt) / 3)) ** 2 * amp;
        v.set(c.ci, c.inx * e, c.inz * e, 0);
      });
    }
    // the shafts' level (set.js sets their colour every frame, before this: it is scaled here), and the lint's light
    if (!bars && looked++ < 600) bars = shaftBars();
    if (bars && airs.shafts.level !== 1) bars.material.uniforms.uColor.value.multiplyScalar(Math.max(0, airs.shafts.level));
    if (lint && (since += dt) > 0.5) {
      since = 0;
      if (sun && sun.light) lightNow.copy(sun.light).multiplyScalar(0.35 + 0.65 * (sun.strength ?? 1));
      const moved = Math.abs(lightNow.r - lightSet.r) + Math.abs(lightNow.g - lightSet.g) + Math.abs(lightNow.b - lightSet.b);
      const sank = sun ? Math.abs(-sun.dir.y / (sun.dir.length() || 1) - way.y) : 0;      // (the beams sink with the sun: set.js lays its bars along -sun.dir every frame)
      if (moved > 0.03 || sank > 0.002 || levelSet[0] !== airs.shafts.level || levelSet[1] !== airs.loft) { shaftList = makeShafts(); lint.rule.setShafts(shaftList); lightSet.copy(lightNow); levelSet = [airs.shafts.level, airs.loft]; }
    }
  });
  // &airstest=1: the handles as staging will call them (a front at 3 s, the shafts and the loft to a half at 5 s)
  if (QS.has('airstest')) {
    let step = 0, err = null;
    ctx.onUpdate(() => {
      try {
        if (step === 0 && ctx.time > 3) { step = 1; airs.front(1); }
        if (step === 1 && ctx.time > 5) { step = 2; airs.shafts.level = 0.5; airs.loft = 0.5; airs.level = 0.6; airs.plume = 0.8; }
      } catch (e) { err = String(e && e.stack || e); }
      if (step === 2 && ctx.time > 9) { step = 3; fetch('/__shot/reach_airs_test.json', { method: 'POST', body: JSON.stringify({ err, level: airs.level, lean: lean.map((c) => (c ? c.ci : -1)), leant: columns.filter((c) => c.leanAt > -50).length }) }).catch(() => {}); }
    });
  }
  if (QS.has('airsdebug')) fetch('/__shot/reach_airs_debug.json', { method: 'POST', body: JSON.stringify({ columns: columns.map((c) => [+c.x.toFixed(1), +c.y.toFixed(1), +c.z.toFixed(1), Math.round(c.s), Math.round(c.d), c.far ? 1 : 0]), near: nearCount, lint: lint ? lint.count : 0, shafts: shaftList }) }).catch(() => {});
  return {};
}
