// Realms: the separate worlds the waterway passes through. Only one exists in the scene at a time. Each is
// authored in its own local coordinates; the boat enters at arc length 0 of the realm's waterway and leaves at
// its end. The last stretch of every realm thickens into a "veil" of mist or darkness, and at its thickest the
// manager swaps one realm for the next, so the change is never seen.
import * as THREE from 'three';
import { Waterway } from './path.js';
import { WATER_LOOK } from './water-final.js';
import { makeKit } from './kit.js';
import { makeStage } from './stage.js';
import { applyGouacheLight, applyGouacheLights, gouacheShared } from './gouache.js';
import { setRowerLook } from './rower.js';
import { again, unfetched } from './net.js';

/** Atmosphere of a realm. A realm's `look` overrides any of these; `lookEnd` gives the values to reach by the end. */
// With no sound engine (screenshot mode, or audio failed to load) realms still call ctx.audio.play(...) freely: every method does nothing.
const NO_AUDIO = new Proxy({}, { get: (t, k) => (k === 'silent' ? true : () => undefined) });

export const LOOK = {
  background: '#0b0f1e',                      // clear colour (a sky dome usually covers it)
  fog: { color: '#141a2e', density: 0.010 },  // exponential-squared fog; 0.010 hides things at about 150 m
  veil: '#0a0c16',                            // the mist or darkness this realm is entered through
  veilLength: 26,                             // metres at each end over which the realm dissolves (veilIn / veilOut override one end)
  exposure: 1.0,
  bloom: { strength: 0.55, radius: 0.7, threshold: 0.82 },
  grade: { tint: '#ffffff', saturation: 1.0, contrast: 1.0, lift: '#000000', vignette: 0.32, grain: 0.035, toe: 0 },   // toe 0: the tone curve presses the darkest values toward black (rich darks by day); toe 1: dark colours are shown as typed (a night that stays readable)
  paint: 0.75,                                // strength of the painter's filter over everything but the water and the lights
  paintRadius: 4.5,                           // its brush size, in pixels at 1080 lines
  current: 2.0,                               // how fast the water carries the boat where the channel is wide, m/s
  currentNarrow: 3.0,                         // and where it is narrow (half width 10 m or less)
  lantern: 2.6,                               // brightness of the lantern on the boat's bow
  lanternLit: 1,                              // how much of that it burns with on arrival: 1 burning, 0.25 guttering in the wet, 0 cold (change it later with ctx.lantern)
  // Light for everything built with the gouache material (kit.gouache): one key light and a painted ramp.
  light: {
    key: [-0.3, -0.5, -0.8],                  // the direction the key light travels (it need not match anything in the sky)
    keyColor: '#ffffff',                      // tint of the lit side
    shadow: '#3a3358',                        // colour the unlit side sinks to: the realm's coloured dark, never grey
    lit: '#fff0dc', gain: 1.2,                // tint and strength of the fully lit step
    sky: '#27304f', ground: '#141018',        // soft light from above and from below, added to everything
    lanternRadius: 7,                         // how far the bow lantern reaches, metres
    heightFog: 0, heightFogOver: 6,           // extra mist lying on the water: amount 0..1, and the height it fades out over
  },
  mirrorScale: 1,                             // resolution of the water's mirror relative to the quality setting (0.5 in very dark realms)
  rower: null,                                // optional: the area's word on the rower (own, tone, rim, rimStrength: see src/engine/rower.js). Read when the realm is entered
  boat: null,                                 // optional colour overrides for the boat: see BOAT_COLORS in boat-hero.js (and `tone`, one colour over all of it). Read once, when the realm is entered; with `follow: true` among them, on every look change (light states may repaint the boat)
  blend: [0.12, 0.88],                        // the part of the realm (0..1 of its length) over which `look` turns into `lookEnd`
};

// How thick the mist is at its thickest. At 0.36 the rider's own bow, under three metres off, was two thirds gone at the
// moment of the swap; at 0.24 it is a third gone and everything beyond twelve metres wholly. What the swap must hide
// between those is hidden by the veil's own wash (src/engine/post.js), which leaves the boat in the picture.
const VEIL_DENSITY = 0.24;
const smooth = (a, b, x) => { if (!(b > a)) return x >= b ? 1 : 0; const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const isColorString = (v) => typeof v === 'string' && /^(#|rgb|hsl)/i.test(v.trim());

/** Turn a plain look object into one whose colours are THREE.Color (recursively, one level of nesting). */
function resolve(base, over = {}) {
  const out = {};
  const keys = new Set([...Object.keys(base || {}), ...Object.keys(over || {})]);
  for (const k of keys) {
    const b = base ? base[k] : undefined, o = over ? over[k] : undefined, v = o !== undefined ? o : b;
    if (v && typeof v === 'object' && !Array.isArray(v) && !v.isColor && !v.isTexture && !v.isVector2 && !v.isVector3) out[k] = resolve(b && typeof b === 'object' ? b : {}, o && typeof o === 'object' ? o : {});
    else if (isColorString(v)) out[k] = new THREE.Color(v);
    else if (v && v.isColor) out[k] = v.clone();
    else if (Array.isArray(v)) out[k] = [...v];
    else out[k] = v;
  }
  return out;
}
/** out = a + (b - a) * t for every number and colour that both have; anything else is taken from a. */
function mix(out, a, b, t) {
  for (const k in a) {
    const x = a[k], y = b ? b[k] : undefined;
    if (x && x.isColor) { (out[k] && out[k].isColor ? out[k] : (out[k] = new THREE.Color())).copy(x); if (y && y.isColor) out[k].lerp(y, t); }
    else if (typeof x === 'number') out[k] = typeof y === 'number' ? x + (y - x) * t : x;
    else if (Array.isArray(x)) out[k] = Array.isArray(y) && y.length === x.length && typeof x[0] === 'number' ? x.map((v, i) => v + (y[i] - v) * t) : x;
    else if (x && typeof x === 'object' && !x.isTexture) out[k] = mix(out[k] && typeof out[k] === 'object' ? out[k] : {}, x, y, t);
    else out[k] = x;
  }
  return out;
}

export class RealmManager {
  /**
   * @param engine
   * @param {Array<{id:string, name?:string, veil?:string, load:() => Promise<{default: object}>}>} registry  realms in ride order (the ride loops)
   */
  constructor(engine, registry) {
    this.engine = engine; this.registry = registry;
    this.built = new Map();                    // index -> instance
    this.building = new Map();                 // index -> promise
    this.failed = new Set();                   // realms that could not be built; the ride skips them
    this.index = -1; this.current = null;
    this.veil = 1; this.veilColor = new THREE.Color(LOOK.veil);
    this.holding = false;                      // waiting at a veil for the next realm to finish loading
    // An area is made ready to be shown before the boat reaches it, a little every frame (engine.rehearse): crossing
    // into it then stops nothing. Tools that step time themselves (pictures, the film, the perf probe) switch this off
    // (src/main.js): for them the area is made ready in the frame that first shows it, as it always was.
    this.prewarm = true;
    this.lookNow = {}; this.waterNow = {};
    this.onEnter = null;                       // (instance) => void, when a realm becomes the current one
    this.fog = new THREE.FogExp2(0x000000, 0.01);
    engine.scene.fog = this.fog;
    engine.scene.background = new THREE.Color(0x000000);
  }

  get count() { return this.registry.length; }
  wrap(i) { const n = this.count; return ((i % n) + n) % n; }
  /** The next realm in direction dir (+1 or -1) that can be built. */
  neighbour(dir) { for (let k = 1; k <= this.count; k++) { const j = this.wrap(this.index + dir * k); if (!this.failed.has(j)) return j; } return this.index; }

  /** Load and build realm i (idempotent). Resolves to its instance. */
  ensure(i) {
    i = this.wrap(i);
    if (this.built.has(i)) return Promise.resolve(this.built.get(i));
    if (this.building.has(i)) return this.building.get(i);
    if (this.failed.has(i)) return Promise.reject(new Error(`realm ${this.registry[i].id} could not be built`));
    const p = (async () => {
      const entry = this.registry[i];
      const def = (await again(() => entry.load(), `src/realms/${entry.id}.js`, unfetched)).default;      // (asked for again if it was not fetched: src/engine/net.js)
      const waterDefaults = this.engine.water.constructor.LOOK || WATER_LOOK;
      const inst = {
        index: i, id: entry.id, def, group: new THREE.Group(), path: new Waterway(def.path.points, def.path),
        look: resolve(LOOK, { ...(def.look || {}), ...(entry.veil ? { veil: entry.veil } : {}) }), lookEnd: def.lookEnd ? resolve({}, def.lookEnd) : null,
        water: resolve(waterDefaults, def.water || {}), waterEnd: def.waterEnd ? resolve({}, def.waterEnd) : null,
        colliders: [], updaters: [], disposers: [], textures: [], lights: [], state: {}, warmed: false, time: 0,
      };
      inst.group.name = 'realm:' + entry.id;
      inst.ctx = this.makeContext(inst);
      await def.build(inst.ctx);
      this.built.set(i, inst); this.building.delete(i);
      return inst;
    })();
    p.catch((err) => { this.building.delete(i); this.failed.add(i); console.error(`realm ${this.registry[i].id} failed to build`, err); });
    this.building.set(i, p);
    return p;
  }

  makeContext(inst) {
    const engine = this.engine;
    const ctx = {
      THREE, engine, id: inst.id, group: inst.group, path: inst.path, water: engine.water, boat: engine.boat, audio: engine.audio || NO_AUDIO, state: inst.state,
      quality: engine.quality, reducedMotion: engine.reducedMotion,
      /** The realm's atmosphere and water as resolved objects (colours are THREE.Color). Change them in update() to drive light and weather yourself. */
      look: inst.look, waterLook: inst.water,
      s: 0, progress: 0, time: 0, veil: 1, active: false,
      /** Add an object to the realm (same as ctx.group.add). */
      add: (...objs) => { inst.group.add(...objs); return objs[0]; },
      /** Run fn(dt, ctx) every frame while the realm is on screen. */
      onUpdate: (fn) => { inst.updaters.push(fn); return fn; },
      /** Something solid in the channel the boat must steer around: a circle of radius r at local (x, z). */
      addCollider: (c) => { inst.colliders.push(c); return c; },
      /** Run fn() when the realm is thrown away (free anything the engine cannot find by walking the realm's objects). */
      onDispose: (fn) => inst.disposers.push(fn),
      /** Load a texture from assets/ (e.g. 'art/orchard/sky.webp'). Colour images are sRGB unless {data: true}. */
      tex: (url, opts = {}) => engine.loadTexture(url, opts).then((t) => { inst.textures.push(t); return t; }),
      /**
       * Show an object (and its children) only in the water's reflection ('mirror') or only in the direct view ('direct').
       * With a bare tree in the direct view and a blossoming one in the mirror, the water remembers what is gone.
       */
      only: (obj, where) => { const layer = where === 'mirror' ? 2 : where === 'direct' ? 1 : 0; obj.traverse((o) => o.layers.set(layer)); return obj; },
      /**
       * A local light that falls on everything built with the gouache material (it does not light the water; give a
       * light its own glow and reflection with kit.glow). Returns the light: change its position (a Vector3), color
       * (a Color), radius (metres), intensity or `on` at any time.
       *   const l = ctx.light({ position: [x, y, z], color: '#ffd27a', radius: 14, intensity: 1.2 });
       * Make as many as the place needs (a light for every chandelier, window group or glowing creature): each frame
       * the eight that matter most from where the rider is are used, and one about to drop out fades first.
       */
      light: (o = {}) => {
        const p = o.position, l = { position: p && p.isVector3 ? p.clone() : new THREE.Vector3(...(p || [0, 0, 0])), color: new THREE.Color(o.color ?? '#ffffff'),
          radius: o.radius ?? 10, intensity: o.intensity ?? 1, on: o.on !== false };
        inst.lights.push(l); return l;
      },
      /** Set how brightly the boat's bow lantern burns: 0 cold .. 1 burning, reached over `seconds`. */
      lantern: (level, seconds = 2) => engine.setLantern(level, seconds),
      /** Tell the interface something happened: 'ending' (the ride is over: offer to ride again), or your own name. */
      emit: (name, ...args) => engine.emit(name, ...args),
      /** Wash the whole picture toward a colour for this frame (0..1): a cloth sweeping over the view, a moment of blindness. Call it every frame you want it. */
      wash: (color, amount) => { engine.washColor.set(color); engine.washAmount = Math.max(engine.washAmount, amount); },
      /** Deterministic random numbers: const rnd = ctx.rng(42); rnd() -> 0..1 */
      rng: (seed = 1) => { let s = (Math.imul(Math.floor(seed) ^ 0x9e3779b9, 0x85ebca6b) >>> 0) % 2147483646 + 1; const next = () => (s = (s * 48271) % 2147483647) / 2147483647; next(); next(); return next; },
    };
    ctx.kit = makeKit(engine, inst, ctx);
    /** The route of moments: cues that fire as the boat arrives, timers and tweens on the realm's clock (src/engine/stage.js). */
    ctx.stage = makeStage(ctx);
    inst.updaters.push((dt) => ctx.stage.update(dt));
    /**
     * More than two states of light and water. Name each state and give only what it changes; then set the weights
     * every frame (from a show clock, a cue, the boat's position), or ease to one state:
     *   const L = ctx.lookStates({
     *     dark:    {},
     *     kindled: { look: { exposure: 1.15, light: { sky: '#3a2a1a', lit: '#ffd27a' } }, water: { glow: '#ffd27a' } },
     *     after:   { look: { fog: { color: '#20160f' } } },
     *   });
     *   L.set({ dark: 1 - k, kindled: k });      // weights; they need not add up to 1
     *   L.to('after', 20);                       // or ease to one state over 20 s on the realm's clock (returns the tween)
     * Each state is the realm's own `look` and `water` with its changes on top. Numbers and colours are mixed; anything
     * else (a texture, a flag) comes from the heaviest state. A realm that uses this does not use `lookEnd`/`waterEnd`.
     */
    ctx.lookStates = (states) => {
      const names = Object.keys(states);
      if (!names.length) throw new Error('lookStates: give at least one state');
      const S = {}, w = {};
      for (const n of names) { S[n] = { look: resolve(inst.look, states[n].look || {}), water: resolve(inst.water, states[n].water || {}) }; w[n] = 0; }
      w[names[0]] = 1;
      inst.lookEnd = null; inst.waterEnd = null;
      let dirty = true, tween = null;
      const order = [];
      const apply = () => {
        dirty = false;
        order.length = 0;
        for (const n of names) if (w[n] > 1e-5) order.push(n);
        if (!order.length) order.push(names[0]);
        order.sort((a, b) => w[b] - w[a]);
        mix(inst.look, S[order[0]].look, null, 0); mix(inst.water, S[order[0]].water, null, 0);
        let acc = Math.max(w[order[0]], 1e-5);
        for (let i = 1; i < order.length; i++) {
          const wi = w[order[i]]; acc += wi;
          mix(inst.look, inst.look, S[order[i]].look, wi / acc); mix(inst.water, inst.water, S[order[i]].water, wi / acc);
        }
      };
      const api = {
        names, weights: w,
        /** Set the weights of some or all states now (the others keep theirs unless `only` is true, which zeroes them). */
        set(weights, only = true) {
          if (tween) { tween.cancel(); tween = null; }
          if (only) for (const n of names) w[n] = 0;
          for (const n in weights) if (n in w) w[n] = Math.max(0, weights[n] || 0);
          apply(); return api;
        },
        /** Ease from whatever the mixture is now to one state. */
        to(name, seconds = 4, curve) {
          if (!(name in w)) throw new Error(`lookStates: no state called '${name}'`);
          if (tween) tween.cancel();
          const from = { ...w };
          tween = ctx.stage.tween((k) => { for (const n of names) w[n] = from[n] + ((n === name ? 1 : 0) - from[n]) * k; dirty = true; }, 0, 1, seconds, curve);
          return tween;
        },
        /** The resolved look and water of one state, to read or adjust (call apply() after changing it). */
        state: (name) => S[name],
        apply,
      };
      inst.updaters.push(() => { if (dirty) apply(); });
      apply();
      return api;
    };
    return ctx;
  }

  /**
   * Make a built realm ready to be shown, a little at a time (engine.rehearse: its textures, its shaders, its geometry,
   * and the boat as it paints it). Call it every frame with the milliseconds it may take; true when it is ready.
   * With now = true whatever is left is done at once.
   */
  rehearse(inst, ms = 3, now = false) {
    if (!inst || inst.warmed) return true;
    const engine = this.engine;
    if (!inst.rehearsal) {
      const roots = [inst.group];
      try { const model = engine.prepareBoat(inst.look.boat); if (model && model.group && model !== engine.boat.model) roots.push(model.group); } catch (err) { console.warn(err); }
      inst.rehearsal = engine.rehearse(roots, inst.textures);
    }
    const job = inst.rehearsal;
    if (now) { for (let k = 0; k < 4 && !job.done; k++) job.step(1e9, true); job.done = true; }
    else job.step(ms);
    if (job.done) { inst.warmed = true; inst.rehearsed = { ms: Math.round(job.ms), steps: job.steps, longest: +job.longest.toFixed(1), longestIn: job.longestIn, waited: job.waitedMs, meshes: job.meshes, textures: job.textures, materials: job.materials }; inst.rehearsal = null; }
    return inst.warmed;
  }

  /** Resolves when every realm now being built has finished (or failed). For tools that step time themselves. */
  async settled() { while (this.building.size) await Promise.allSettled([...this.building.values()]); }

  /** Make realm i the current one, with the boat at arc length s (loads it first if needed). */
  async enter(i, s = 0, opts = {}) {
    const inst = await this.ensure(i);
    this.activate(inst, s, opts);
    return inst;
  }

  /** Swap to an already built realm, immediately. */
  activate(inst, s = 0, { d = 0, turn = 0, keepSpeed = 0 } = {}) {
    const engine = this.engine;
    if (inst !== this.current) this.failed.clear();                  // a realm that failed gets another chance next time round
    if (this.current && this.current !== inst) { engine.scene.remove(this.current.group); this.current.ctx.active = false; }
    this.current = inst; this.index = inst.index;
    engine.scene.add(inst.group); inst.ctx.active = true; inst.ctx.audio = engine.audio || NO_AUDIO;
    engine.setBoatColors(inst.look.boat);                            // before the warm-up, so the boat is compiled once
    setRowerLook(inst.look.rower);                                   // the area's word on the rower (src/engine/rower.js)
    gouacheShared(engine).uLampColor.value.setRGB(0, 0, 0);          // the kept lamp of the realm just left no longer lights anything
    if (!inst.warmed) {                                              // not made ready ahead (the first area; a tool; a rider faster than the rehearsal): now
      if (inst.rehearsal) this.rehearse(inst, 0, true);
      else { engine.warm(inst.group); inst.warmed = true; }
    }
    const boat = engine.boat;
    boat.place(inst.path, s, d, turn); boat.u = keepSpeed;
    // the boat keeps its way through a swap: set down dead in the water, the current carried it straight back over the end it had just crossed
    boat.wx = -Math.sin(boat.heading) * keepSpeed; boat.wz = -Math.cos(boat.heading) * keepSpeed;
    engine.setLantern(inst.look.lanternLit ?? 1, this.entered ? 3 : 0);      // eased when the boat passes from one area into the next; at once in the first area entered (a ride that begins with a cold lantern must not show it going out)
    this.entered = true;
    inst.ctx.s = Math.min(inst.path.length, Math.max(0, s)); inst.ctx.progress = inst.ctx.s / inst.path.length;
    engine.water.teleport && engine.water.teleport(boat);
    engine.water.bind && engine.water.bind(inst.path);            // the realm's waterway: the water lays its realm-anchored trace over it
    this.applyLook(inst, this.veilAt(inst, s));
    if (this.onEnter) { try { this.onEnter(inst); } catch (err) { console.error(err); } }
    // free realms that are no longer neighbours
    const i = inst.index, keep = new Set([i, this.neighbour(1), this.neighbour(-1)]);
    for (const k of [...this.built.keys()]) if (!keep.has(k)) this.dispose(k);
  }

  dispose(i) {
    const inst = this.built.get(i);
    if (!inst || inst === this.current) return;
    this.built.delete(i);
    for (const fn of inst.disposers) { try { fn(); } catch (e) { console.warn(e); } }
    if (inst.def.dispose) { try { inst.def.dispose(inst.ctx); } catch (e) { console.warn(e); } }
    this.engine.scene.remove(inst.group);
    const mats = new Set(), own = new Set();
    inst.group.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.isInstancedMesh) o.dispose();
      if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => mats.add(m));
    });
    for (const m of mats) {
      for (const k in m) { const v = m[k]; if (v && v.isTexture) own.add(v); }
      if (m.uniforms) for (const k in m.uniforms) { const v = m.uniforms[k] && m.uniforms[k].value; if (v && v.isTexture) own.add(v); }
      m.dispose();
    }
    // textures the realm made itself (canvas and data textures); loaded ones are reference-counted by the engine
    for (const t of own) if (!t.userData.key && !t.userData.shared && !t.isRenderTargetTexture) t.dispose();
    for (const t of inst.textures) this.engine.releaseTexture(t);
  }

  veilAt(inst, s) {
    const L = inst.path.length, a = Math.min(inst.look.veilIn ?? inst.look.veilLength, L * 0.3), b = Math.min(inst.look.veilOut ?? inst.look.veilLength, L * 0.3);
    return Math.max(1 - smooth(0, a, s), smooth(L - b, L, s));
  }

  guard(inst, fn, dt, ctx) {
    if (fn.broken) return;
    try { fn(dt, ctx); } catch (err) { fn.broken = true; console.error(`realm ${inst.id}: an update function threw and has been switched off`, err); }
  }

  update(dt) {
    const engine = this.engine, boat = engine.boat, inst = this.current;
    if (!inst) return;
    const L = inst.path.length;
    // --- crossing an end: swap to the neighbouring realm at the thickest point of the veil
    let dir = boat.s > L ? 1 : boat.s < 0 ? -1 : 0;
    // open water (soft edges): an area is left only through its mouth. Past an end but out at the side, there is no
    // swap: the water leans the boat back along the route instead
    if (dir !== 0 && inst.path.softEdges) {
      const end = inst.path.at(dir > 0 ? L : 0);
      if (Math.abs(boat.d) > end.halfWidth + 1) {
        const over = dir > 0 ? boat.s - L : -boat.s, push = Math.min(6, 1 + over * 0.8) * 2.2 * dt;
        boat.slipX -= end.tx * dir * push; boat.slipZ -= end.tz * dir * push;
        dir = 0;
      }
    }
    if (dir !== 0) {
      const ni = this.neighbour(dir), next = this.built.get(ni);
      if (!next) { this.holding = true; this.ensure(ni).catch(() => {}); }
      // built, but not yet ready to be shown: a few more moving frames in the mist, not one long stop
      else if (this.prewarm && !next.warmed && !this.rehearse(next, 14)) this.holding = true;
      else {
        this.holding = false;
        const over = dir > 0 ? boat.s - L : boat.s;                      // how far past the end
        const end = inst.path.at(dir > 0 ? L : 0);
        const frac = boat.d / Math.max(1, end.halfWidth), turn = boat.heading - end.heading;
        const s2 = dir > 0 ? Math.min(over, 2) : next.path.length + Math.max(over, -2);
        this.activate(next, s2, { d: frac * next.path.at(s2).halfWidth, turn, keepSpeed: boat.u });
        return;
      }
    } else this.holding = false;
    // --- start building the neighbour the boat is heading for
    const pa = inst.path.at(boat.s), along = boat.vx * pa.tx + boat.vz * pa.tz;
    // (the one ahead from the area's third second on: a rider who paddles hard is through the landing in a quarter of a
    // minute, and the area ahead needs that long to be built and made ready; the one behind only for a boat going back)
    const ahead = boat.s < L * 0.1 && along < -0.2 ? -1 : (this.prewarm ? inst.time > 2 : boat.s > L * 0.25) ? 1 : 0;
    if (ahead && this.lookAhead !== false) { const want = this.neighbour(ahead); if (!this.built.has(want) && !this.building.has(want)) this.ensure(want).catch(() => {}); }
    // --- and make it ready to be shown, a little every frame
    if (this.prewarm && this.lookAhead !== false) { const soon = this.built.get(this.neighbour(1)); if (soon && soon !== inst && !soon.warmed) this.rehearse(soon, 3); }

    inst.time += dt;
    const ctx = inst.ctx;
    ctx.s = Math.min(L, Math.max(0, boat.s)); ctx.progress = ctx.s / L; ctx.time = inst.time;
    const v = this.veilAt(inst, ctx.s);
    ctx.veil = v;
    engine.washAmount = 0;
    if (inst.def.update) this.guard(inst, inst.def.update, dt, ctx);
    for (const fn of inst.updaters) this.guard(inst, fn, dt, ctx);
    this.applyLook(inst, v);
  }

  /** Push the realm's atmosphere, thickened by the veil amount v (0 clear .. 1 fully veiled), into the engine. */
  applyLook(inst, v) {
    const engine = this.engine, boat = engine.boat;
    const t = smooth(inst.look.blend[0], inst.look.blend[1], inst.ctx.progress);
    const L = inst.lookEnd ? mix(this.lookNow, inst.look, inst.lookEnd, t) : inst.look;
    // the colour of a passage belongs to the realm it leads into
    const leaving = boat.s > inst.path.length * 0.5, ni = this.neighbour(1);
    const nextInst = leaving ? this.built.get(ni) : null;
    const veilColor = this.veilColor.copy(leaving && nextInst ? nextInst.look.veil : leaving ? this.peekVeil(ni, L.veil) : L.veil);
    this.veil = v;
    const k = smooth(0, 0.7, v);
    this.fog.color.copy(L.fog.color).lerp(veilColor, k);
    const d0 = Math.max(1e-4, L.fog.density);
    this.fog.density = d0 * Math.pow(VEIL_DENSITY / d0, Math.pow(v, 1.25));
    engine.scene.background.copy(L.background).lerp(veilColor, k);
    engine.shared.uVeilColor.value.copy(veilColor); engine.shared.uVeil.value = k;
    engine.shared.uFogColor.value.copy(this.fog.color); engine.shared.uFogDensity.value = this.fog.density;
    engine.post.apply(L);
    engine.post.u.uExposure.value *= engine.brightness || 1;          // the rider's own brightness setting
    engine.post.setVeil(veilColor, smooth(0.86, 1, v));
    engine.paintAmount = engine.paintOverride ?? L.paint; engine.paintRadius = L.paintRadius;
    engine.currentWide = L.current; engine.currentNarrow = L.currentNarrow;
    if (L.boat && L.boat.follow === true) engine.setBoatColors(L.boat);      // (a look whose boat follows it: repainted in place, every look change)
    if (L.rower && L.rower.follow === true) setRowerLook(L.rower);           // (and the same for its word on the rower)
    engine.boat.model.lightLevel = L.lantern * (1 - 0.35 * k);
    applyGouacheLight(engine, L.light);
    applyGouacheLights(engine, inst.lights);
    engine.shared.uRampLight.value.multiplyScalar(L.light.gain ?? 1);
    if (engine.water.setMirrorScale) engine.water.setMirrorScale(L.mirrorScale);
    // water
    const W = mix(this.waterNow, inst.water, inst.waterEnd, inst.waterEnd ? t : 0);
    if (engine.water.veilLook) engine.water.veilLook(W, veilColor, k);          // the water knows best how to dissolve itself
    else if (k > 0) {
      if (W.deep) W.deep.lerp(veilColor, k * 0.85); if (W.shallow) W.shallow.lerp(veilColor, k * 0.85);
      if (W.glow) W.glow.multiplyScalar(1 - k); if (W.rippleGlow) W.rippleGlow.multiplyScalar(1 - k * 0.6);
      if (typeof W.sparkle === 'number') W.sparkle *= 1 - k; if (typeof W.reflectivity === 'number') W.reflectivity *= 1 - k * 0.55;
    }
    engine.water.setLook(W);
  }

  /** The veil colour declared by a realm that has not been built yet (falls back to `fallback`). */
  peekVeil(i, fallback) {
    const e = this.registry[this.wrap(i)];
    return e.veil ? _c.set(e.veil) : fallback;
  }
}
const _c = new THREE.Color();
