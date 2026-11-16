// The rider's boat, remodelled as a hero piece: a small clinker-built rowing boat with an iron crook at the stem head
// that carries a storm lantern out to starboard. Same exports as boat-model.js (buildBoat(colors), BOAT_COLORS), plus
// loadBoat(), which fetches the model first. Forward is -Z; the waterline is y = 0. The page is docs/life/boat.md.
//
//   import { buildBoat, loadBoat, BOAT_COLORS } from './boat-hero.js';
//   await loadBoat();                       // once, before the engine is made (src/main.js does it for &boat=boat-hero)
//   const model = buildBoat(colors);        // -> { group, lantern, light, lit, flare, lightLevel, update(t, motion), ... }
//
// The model is assets/models/life/boat.glb with its numbers in boat.json (source-art/models/life/boat.py) and the
// lantern is the kept lamp's (lamp-hero.js). It wears the ride's gouache paint, so it takes each area's light, the
// kept lamp's, its own lantern's, the fog and the veil.
//
// Four things about it that are not obvious:
//   * It is built before the engine exists (the engine makes its boat in its own constructor), so its materials start
//     on stand-in uniforms and are tied to the engine's on the first update (or at once: buildBoat(colors, engine)).
//   * Its floor is where a boat's floor is, just under the waterline, so the water plane passes through the inside of
//     the hull. A lid that writes depth only (drawn after everything in the boat, before the water) keeps the water
//     out of the picture there, and tells the painter's filter that what it sees inside the boat is not water.
//   * It is not drawn in the water's mirror: from the rider's seat the hull hides every reflection of itself and of
//     its lantern (the mirrored boat lies wholly under the real one). BOAT_OPTIONS.mirror = true draws it there again.
//   * Its own lantern's light thins along it with the square of the distance (the ride's lamps, made for banks and
//     trees, do not thin at all within a quarter of their reach): the bow glows and the stern keeps the night.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { makeGouache, gouacheShared } from './gouache.js';
import { buildStormLantern, loadModel, AREA_RAMP } from './lamp-hero.js';
import { loadRower, buildRower } from './rower.js';

/** The boat's colours; a realm overrides any of them with look.boat = { hull: '#...' }. Each names a family of surfaces. */
export const BOAT_COLORS = {
  hull: '#627888',      // the boat's paint: outside above the water, and the band under the gunwale inside
  hullAlt: '#3b4450',   // its second paint: the bottom, below the waterline strake, and the transom outside
  inside: '#544a3f',    // the planking inside, below the painted band
  rib: '#74644e',       // timbers, risers, knees, the hog, the stem
  rim: '#80786c',       // the gunwale, breasthook, quarter knees, rowlock chocks
  floor: '#6c5f4c',     // bottom boards
  thwart: '#766752',    // thwarts, the stern bench, the foredeck
  iron: '#2c2927',      // the crook, straps, ring bolt, bolt heads
  brass: '#8f7645',     // rowlocks, copper roves and oar tips; the lantern's metal
  rope: '#a39474',      // the painter
  oar: '#69645b',       // the oars
  glass: '#ffd9a0',     // the lantern's glass when it burns (the default leaves the kept lamp's own amber)
};
/** One more key a realm may give in look.boat: `tone`, a colour that multiplies the whole boat (its lantern's metal too).
 *  The boat already follows each area's light (see AREA_RAMP in lamp-hero.js); `tone` is the area's last word on it. */
export const BOAT_TONE = '#ffffff';
const FAMILIES = ['hull', 'hullAlt', 'inside', 'rib', 'rim', 'floor', 'thwart', 'iron', 'brass', 'rope', 'oar', 'glass', 'none'];
/** Developer's switches: mirror = draw the boat in the water's reflection too (never seen from the seat; costs a third more). */
export const BOAT_OPTIONS = { mirror: typeof location !== 'undefined' && /[?&]boatmirror=1/.test(location.search) };
// Where the lantern's bail rests on the crook, in the boat's own frame, until the model's numbers arrive (the same
// numbers: boat.json, points.lanternHang). It hangs wholly below the rider's horizon (the eye is at 1.12 m), a third of
// a metre to starboard of the stem: the same place as on the present boat (boat-model.js), so that nothing an area
// composes straight ahead is covered by it. The flame is 0.2 m beneath; the crook's highest iron is at 1.078 m.
const HANG = [0.335, 0.965, -2.30], LANTERN_SWING = 0.19;

let SRC = null, loading = null;
/** Fetch the model (and its numbers, and the lantern) before the first boat is built. Resolves to { data, geometry }. */
export function loadBoat() {
  if (SRC) return Promise.resolve(SRC);
  if (!loading) {
    loading = Promise.all([
      fetch('assets/models/life/boat.json').then((r) => { if (!r.ok) throw new Error('boat.json: ' + r.status); return r.json(); }),
      new GLTFLoader().loadAsync('assets/models/life/boat.glb'),
      loadModel('assets/models/life/lantern.glb'),
      loadRower().catch(() => null),                                  // the rower (rower.js): she comes aboard with the boat
    ]).then(([data, gltf]) => {
      let geometry = null;
      gltf.scene.updateMatrixWorld(true);
      gltf.scene.traverse((o) => { if (o.isMesh && !geometry) { geometry = o.geometry.clone().applyMatrix4(o.matrixWorld); if (o.material && o.material.dispose) o.material.dispose(); } });
      if (!geometry.attributes.uv) console.error('INVALID_MODEL boat.glb has no colour families (uv): it cannot be recoloured');
      for (const k in BOAT_COLORS) if (data.colors[k] && data.colors[k].toLowerCase() !== BOAT_COLORS[k]) console.error(`INVALID_MODEL boat.glb was painted with ${k} = ${data.colors[k]} but BOAT_COLORS says ${BOAT_COLORS[k]}`);
      geometry.computeBoundingSphere();
      SRC = { data, geometry };
      return SRC;
    });
    loading.catch((err) => { console.error('INVALID_MODEL the boat could not be loaded: ' + (err && err.message)); loading = null; });
  }
  return loading;
}

// A stand-in for the engine while there is none (see the note at the top).
const OWN = { shared: { uTime: { value: 0 }, uVeil: { value: 0 }, uVeilColor: { value: new THREE.Color(0, 0, 0) }, uFogColor: { value: new THREE.Color(0.3, 0.3, 0.4) }, uFogDensity: { value: 0 },
  uCameraPos: { value: new THREE.Vector3(0, 1.1, 0.45) }, uBoat: { value: new THREE.Vector3() } }, loadTexture: () => Promise.reject(new Error('no engine yet')) };
gouacheShared(OWN);
const SHARED_NAMES = Object.keys(OWN.shared);
const _p = new THREE.Vector3(), _v = new THREE.Vector3(), _a = new THREE.Vector3(), _q = new THREE.Quaternion(), _own = new THREE.Color();

/**
 * Build a boat. colors: overrides of BOAT_COLORS (hex strings or THREE.Color). engine: optional; given, the boat's
 * paint is tied to the engine's light at once.
 * Returns what the engine uses, as boat-model.js does:
 *   group            add it to the boat's rig
 *   lantern          the lantern's group: its origin is where its bail hangs on the crook; the flame is 0.2 m below
 *   light            a THREE.PointLight at the flame (the engine reads its world position; it lights kit.painted things)
 *   lit, flare, lightLevel   set by the engine: burning 0..1, the breath beside a kept lamp, the realm's look.lantern
 *   update(t, motion)        once a frame: t = the boat's own clock, motion = 1 (0.25 with reduced motion)
 * and more:
 *   lamp             the storm lantern (lamp-hero.js: glassMat, flameMat, halo, setLevel, wind)
 *   wind             a Vector3 in the realm's axes: set it and the flame leans that way (1 = a stiff gust)
 *   points           { lanternHang, flame, crookTop, painterRing, painterEnd, stemHead, seat, rowlocks: [..] } in the boat's frame
 *   worldPoint(name, target)   one of them in the world (a perch for a dragonfly, the end of a mooring rope)
 *   show(family, on)           hide or show one colour family (show('rope', false): the painter is ashore)
 *   setColors(colors)          repaint it in place with other colours (the same keys as buildBoat's): for a look whose
 *                              boat follows its light states (look.boat.follow); nothing is rebuilt
 *   link(engine)               tie its paint to the engine's light at once (else it finds window.engine on its first update)
 *   ready            a promise: the model has arrived and is in the group
 *   rower            the rower, when she is aboard (rower.js: lookAt(point, seconds), effort, group, oar); `way` is set by
 *                    the engine's boat every frame: the boat's speed through the water, which is what she sculls to
 */
export function buildBoat(colors = {}, engine = null) {
  colors = colors || {};
  const C = {}; for (const k in BOAT_COLORS) C[k] = new THREE.Color(colors[k] ?? BOAT_COLORS[k]);
  const group = new THREE.Group(); group.name = 'boat';
  // each family's override as a ratio to the colour the model was painted with (1, 1, 1 = as painted); w = shown
  const tint = FAMILIES.map((k) => { const d = new THREE.Color(BOAT_COLORS[k] ?? '#ffffff'), c = C[k] ?? d; return new THREE.Vector4(c.r / Math.max(d.r, 1e-4), c.g / Math.max(d.g, 1e-4), c.b / Math.max(d.b, 1e-4), 1); });
  const mats = [];
  const tone = new THREE.Color(colors.tone ?? BOAT_TONE);
  // The ride's dry-brush stroke is laid on in WORLD space, which is right for things that stay put. On a boat under
  // way it swam: the strokes slid across the planking as she moved, and where a surface sat on one of the ramp's steps
  // (the transom, in shade) they crawled over it in blotches. So the kit's own stroke is switched off here (brush: 0)
  // and the same tile is laid on in the BOAT's space instead: once over the paint, and once to rag the ramp's steps.
  const BRUSH = 0.55;
  const body = makeGouache(OWN, { vertexColors: true, brush: 0, extend: {
    defines: { AREA_RAMP_INSIDE: '', AREA_RAMP_STROKE: `(boatStroke * ${(0.10 * BRUSH).toFixed(3)})` },
    uniforms: { uFam: { value: tint }, uBoatTone: { value: tone } },
    vertexPars: 'varying vec3 vBoatPos; varying vec3 vBoatN;',
    vertexLocal: 'vBoatPos = transformed; vBoatN = objectNormal;',
    fragmentPars: `uniform vec4 uFam[${FAMILIES.length}]; uniform vec3 uBoatTone; varying vec3 vBoatPos; varying vec3 vBoatN; float boatStroke;`,
    // the model's UVs carry (the family's number, 1 - the share of the paint there that is the family's own pigment):
    // an override repaints the pigment and leaves worn wood, weed and rust as they are
    albedo: `{ vec4 ft = uFam[int(floor(vUv0.x + 0.5))]; if (ft.a < 0.5) discard; albedo *= mix(vec3(1.0), ft.rgb, clamp(1.0 - vUv0.y, 0.0, 1.0)) * uBoatTone;
      boatStroke = clamp((tri(tBrush, vBoatPos * uBrushScale, normalize(vBoatN)).r - 0.52) * 5.0, -1.0, 1.0);
      albedo *= 1.0 + boatStroke * ${(0.16 * BRUSH).toFixed(3)}; }`,
    // First the area's light (AREA_RAMP: in a dim area the boat's paint comes down with it, instead of standing in
    // daylight colours under a black sky). Then its own lantern: the boat lies within four metres of it, where the
    // ride's lamps (made for banks and trees) do not fall away at all: here the light thins with the square of the
    // distance, so that the bow glows and the stern keeps the night (1.26 at half a metre, 0.94 at the bow thwart,
    // 0.38 at the rider's, 0.24 at the transom)
    light: AREA_RAMP + `{ vec3 toL = uLanternPos - vWPos;
      c += albedo * pointLight(uLanternPos, uLanternColor, uLanternRadius, N) * (1.35 / (1.0 + 0.3 * dot(toL, toL)) - 1.0); }`,
  } });
  mats.push(body);
  const direct = (o) => { if (!BOAT_OPTIONS.mirror) o.layers.set(1); return o; };          // layer 1: seen by the rider, absent from the mirror

  // ---- the lantern on its crook
  const lamp = buildStormLantern(OWN, { halo: 0.4, seed: 3 });
  const lantern = lamp.group; lantern.position.fromArray(HANG); group.add(lantern);
  lantern.traverse(direct);
  const glassOwn = lamp.glassMat.uniforms.uGlLit.value.clone();      // (the kept lamp's own amber: what the glass burns with when a look gives it no colour)
  if (colors.glass) lamp.glassMat.uniforms.uGlLit.value.copy(C.glass);
  lamp.materials[0].uniforms.uColor.value.set(tint[8].x, tint[8].y, tint[8].z).multiply(tone);   // the lantern's metal follows `brass` (and the area's `tone`)
  // It hangs turned a little on its hook, so that the rider sees into its frame and not flat onto it; the turn comes
  // first, then the swing (see update)
  lantern.rotation.order = 'XZY';
  const light = new THREE.PointLight(0xffc98a, 2.6, 12, 1.8); light.position.y = -0.2; lantern.add(light);
  mats.push(...lamp.materials);

  const points = { lanternHang: new THREE.Vector3().fromArray(HANG), flame: new THREE.Vector3(HANG[0], HANG[1] - 0.2, HANG[2]) };
  const fill = (src) => {
    const mesh = direct(new THREE.Mesh(src.geometry, body)); mesh.name = 'boat-body'; mesh.frustumCulled = false; group.add(mesh);
    // the lid (see the note at the top): the hull's inside outline a hand above the waterline
    const L = src.data.lid, pts = L.outline, shape = new THREE.Shape();
    pts.forEach(([x, z], i) => (i ? shape.lineTo(x, -z) : shape.moveTo(x, -z)));
    for (let i = pts.length - 1; i >= 0; i--) shape.lineTo(-pts[i][0], -pts[i][1]);
    const lidGeo = new THREE.ShapeGeometry(shape); lidGeo.rotateX(-Math.PI / 2); lidGeo.translate(0, L.y, 0);
    const lid = new THREE.Mesh(lidGeo, new THREE.MeshBasicMaterial({ colorWrite: false, side: THREE.DoubleSide }));
    lid.name = 'boat-lid'; lid.renderOrder = 1; lid.frustumCulled = false; lid.layers.set(1); group.add(lid);
    // The water reads the hull's waterline off the boat's own triangles (water-final-sim.js, measureHull), but skips any
    // mesh of more than 30,000 of them, which the boat's one mesh is. So it is given the waterline by itself: a ribbon
    // round the hull at y = 0, never drawn.
    const W = src.data.waterline.outline, wp = [];
    for (let i = 0; i + 1 < W.length; i++) for (const sx of [1, -1]) {
      const [x0, z0] = W[i], [x1, z1] = W[i + 1];
      wp.push(sx * x0, -0.02, z0, sx * x0, 0.02, z0, sx * x1, 0.02, z1, sx * x0, -0.02, z0, sx * x1, 0.02, z1, sx * x1, -0.02, z1);
    }
    const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute(wp, 3));
    const wm = new THREE.Mesh(wg, new THREE.MeshBasicMaterial()); wm.name = 'boat-waterline'; wm.visible = false; group.add(wm);
    for (const [k, v] of Object.entries(src.data.points)) points[k] = Array.isArray(v) ? (Array.isArray(v[0]) ? v.map((q) => new THREE.Vector3().fromArray(q)) : new THREE.Vector3().fromArray(v)) : v;
    lantern.position.copy(points.lanternHang); points.flame = points.lanternHang.clone(); points.flame.y -= 0.2;
    // the rower stands on the stern bench, behind the rider (rower.js): her paint is tied to the engine's light with the boat's
    const rw = buildRower(OWN);                                       // (there is one of her: the boat on the water adopts her, see update)
    if (rw) { if (!rw.group.parent) rw.adopt(group, body, direct); mats.push(...rw.materials); model.rower = rw; if (tied) tie(tied); }
    return model;
  };

  let linked = false, tied = null;
  const tie = (eng) => {
    tied = eng;
    const S = gouacheShared(eng);
    for (const m of mats) for (const k of SHARED_NAMES) if (m.uniforms[k] && S[k]) m.uniforms[k] = S[k];
    linked = true;
  };
  if (engine) tie(engine);

  // the lantern swings on its hook: a pendulum 0.19 m long (0.87 s a swing), pushed by whatever the bow does
  const sw = { x: 0, z: 0, vx: 0, vz: 0, t: null, p: new THREE.Vector3(), v: new THREE.Vector3(), has: 0 };
  const model = {
    group, lantern, light, lamp, halo: lamp.halo, glassMat: lamp.glassMat, flameMat: lamp.flameMat, colors: C, lightLevel: 2.6, lit: 1, flare: 0,
    wind: lamp.wind, points,
    worldPoint(name, target = new THREE.Vector3()) { const q = points[name]; return q && q.isVector3 ? group.localToWorld(target.copy(q)) : target; },
    show(family, on = true) { const i = FAMILIES.indexOf(family); if (i >= 0) tint[i].w = on ? 1 : 0; return model; },
    /** Repaint the boat in place: the same keys as buildBoat's `colors` (a key left out is the model's own paint). What show() hid stays hidden. */
    setColors(next) {
      next = next || {};
      const take = (target, v, fallback) => { const x = v ?? fallback; if (x && x.isColor) target.copy(x); else target.set(x); return target; };
      for (const k in BOAT_COLORS) take(C[k], next[k], BOAT_COLORS[k]);
      FAMILIES.forEach((k, i) => { const d = _own.set(BOAT_COLORS[k] ?? '#ffffff'), c = C[k] ?? d; tint[i].set(c.r / Math.max(d.r, 1e-4), c.g / Math.max(d.g, 1e-4), c.b / Math.max(d.b, 1e-4), tint[i].w); });
      take(tone, next.tone, BOAT_TONE);
      lamp.glassMat.uniforms.uGlLit.value.copy(next.glass ? C.glass : glassOwn);
      lamp.materials[0].uniforms.uColor.value.set(tint[8].x, tint[8].y, tint[8].z).multiply(tone);
      return model;
    },
    /** Tie the boat's paint to an engine's light, fog and time (once). The engine calls it for the boat it made before it had any. */
    link(eng) { if (eng && !linked) tie(eng); return model; },
    /** Brightness of the lantern follows `lightLevel` (set by the realm) times `lit` (0 = out, 1 = burning). */
    update(t, motion = 1) {
      if (!linked && typeof window !== 'undefined' && window.engine) tie(window.engine);
      const flick = 1 + Math.sin(t * 9.1) * 0.035 + Math.sin(t * 13.7 + 2) * 0.025 + Math.sin(t * 2.3) * 0.03;
      const on = Math.max(0, model.lit), level = Math.min(1, model.lightLevel / 2.6), flare = 1 + 0.45 * (model.flare || 0);      // both lamps brighten for a breath when a kept lamp is passed
      light.intensity = model.lightLevel * flick * on * flare;
      lamp.haloGain = 0.2 + 0.55 * level;                              // by day the flame is there but the air round it does not glow
      lamp.setLevel(on * (0.6 + 0.4 * level) * flare, flick);
      // ---- the swing. What moves the lantern is the acceleration of its hook, in the boat's own axes.
      const dt = sw.t == null ? 0 : Math.min(0.05, t - sw.t); sw.t = t;
      group.updateWorldMatrix(true, false);
      _p.copy(points.lanternHang); group.localToWorld(_p);
      if (dt > 1e-4 && sw.has > 0 && _p.distanceToSquared(sw.p) < 4) {
        _v.subVectors(_p, sw.p).divideScalar(dt);
        _a.set(0, 0, 0);
        if (sw.has > 1) { _a.subVectors(_v, sw.v).divideScalar(dt); if (_a.lengthSq() > 36) _a.setLength(6); _a.applyQuaternion(group.getWorldQuaternion(_q).invert()); }
        sw.v.copy(_v); sw.has = 2;
        const w2 = 9.81 / LANTERN_SWING, damp = 1.1, k = motion;
        // a breath of its own, so that it is never wholly still; then gravity, the air, and the hook's push
        const ax = -_a.x * k + 0.05 * Math.sin(t * 0.83) * k, az = _a.z * k + 0.04 * Math.sin(t * 0.61 + 1.7) * k;
        sw.vz += (-w2 * sw.z - damp * sw.vz + ax / LANTERN_SWING) * dt; sw.z += sw.vz * dt;
        sw.vx += (-w2 * sw.x - damp * sw.vx + az / LANTERN_SWING) * dt; sw.x += sw.vx * dt;
        sw.x = Math.max(-0.4, Math.min(0.4, sw.x)); sw.z = Math.max(-0.4, Math.min(0.4, sw.z));
      } else if (dt > 1e-4) { sw.has = 1; sw.v.set(0, 0, 0); }
      sw.p.copy(_p);
      lantern.rotation.z = sw.z; lantern.rotation.x = sw.x;
      // and it turns a little on its hook, slowly, as a hanging thing does (never a full turn: the rider keeps its face)
      lantern.rotation.y = 0.30 + (0.11 * Math.sin(t * 0.37 + 0.7) + 0.05 * Math.sin(t * 0.151 + 2.0)) * motion;
      // the rower: `way` is how fast the boat is being driven through the water (src/engine/boat.js sets it)
      if (model.rower) { if (model.rower.group.parent !== group) model.rower.adopt(group, body, direct); model.rower.update(dt, { u: model.way || 0, motion, engine: tied }); }
    },
  };
  model.ready = SRC ? Promise.resolve(fill(SRC)) : loadBoat().then(fill, () => model);
  return model;
}
