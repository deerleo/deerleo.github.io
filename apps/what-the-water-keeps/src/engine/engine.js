// The engine: renderer, post-processing, the boat, the water, the realm manager and the frame loop.
import * as THREE from 'three';
import { Post } from './post.js';
import { Boat } from './boat.js';
import { buildBoat } from './boat-hero.js';
import { Input } from './input.js';
import { Water } from './water-final.js';
import { RealmManager } from './realms.js';
import { gouacheShared } from './gouache.js';

export const LAYER_DIRECT = 1, LAYER_MIRROR = 2;
const LAYER_LATE = 3;        // (a phone's frame: what is drawn after the picture of the scene has been laid down: render)

// One fog model everywhere: three.js fogs by depth along the view axis, the kit's shaders by distance. Use distance
// for both, so a wall and a painted flat beside it fade alike whichever way the rider turns their head.
// The distance is taken per pixel (from the interpolated view position): per vertex it would be wrong across large
// triangles such as the water sheet. A shader that sets vFogDepth itself and never writes vFogPos still works.
THREE.ShaderChunk.fog_pars_vertex = '#ifdef USE_FOG\n\tvarying float vFogDepth;\n\tvarying vec3 vFogPos;\n#endif';
THREE.ShaderChunk.fog_vertex = '#ifdef USE_FOG\n\tvFogDepth = - mvPosition.z;\n\tvFogPos = mvPosition.xyz;\n#endif';
THREE.ShaderChunk.fog_pars_fragment = THREE.ShaderChunk.fog_pars_fragment.replace('varying float vFogDepth;', 'varying float vFogDepth;\n\tvarying vec3 vFogPos;');
THREE.ShaderChunk.fog_fragment = THREE.ShaderChunk.fog_fragment
  .replace('#ifdef USE_FOG', '#ifdef USE_FOG\n\tfloat fogDist = dot( vFogPos, vFogPos ) > 0.0 ? length( vFogPos ) : vFogDepth;')
  .replaceAll('vFogDepth * vFogDepth', 'fogDist * fogDist').replace('fogNear, fogFar, vFogDepth', 'fogNear, fogFar, fogDist');

const QUALITY = {
  low: { level: 'low', pixelRatio: 1, maxPixels: 1.5e6, samples: 0, reflection: 0.4, density: 0.5 },
  // a phone or a tablet (src/main.js chooses it where the pointer is a finger and no quality was asked for): the lightest
  // drawing, but not at one dot to a point, which on a phone's fine screen is a blur. The interface calls it 'low'.
  // (9 November, evening: the client's phone was "very laggy and poor graphics". A phone now makes its frame its own
  //  way, `light`: docs/build/phone.md. Its picture starts at about a million dots and is kept between 0.64 and 1.56
  //  million by what a frame is found to cost: govern, below.)
  phone: { level: 'low', light: true, pixelRatio: 2, maxPixels: 1.0e6, samples: 0, reflection: 0.35, density: 0.5 },
  medium: { level: 'medium', pixelRatio: 1.25, maxPixels: 2.6e6, samples: 4, reflection: 0.5, density: 0.75 },
  high: { level: 'high', pixelRatio: 2, maxPixels: 4.4e6, samples: 4, reflection: 0.6, density: 1 },
};

export class Engine {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {{quality?: string, size?: [number, number], WaterClass?: any, reducedMotion?: boolean}} opts
   */
  constructor(canvas, opts = {}) {
    this.canvas = canvas; this.opts = opts;
    this.quality = { ...(QUALITY[opts.quality] || QUALITY.high) };
    this.reducedMotion = opts.reducedMotion ?? (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', alpha: false, stencil: false });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.NoToneMapping;
    this.renderer.autoClear = true;
    this.renderer.info.autoReset = false;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.08, 1800);
    this.camera.rotation.order = 'YXZ';
    // Layers: 0 = everything ordinary. LAYER_DIRECT objects are seen by the rider but are absent from the water's
    // reflection; LAYER_MIRROR objects exist only in the reflection (the water "remembers" them).
    this.camera.layers.enable(LAYER_DIRECT);

    // uniforms shared by every material that needs the time, the fog or the veil
    this.shared = {
      uTime: { value: 0 }, uVeil: { value: 0 }, uVeilColor: { value: new THREE.Color(0, 0, 0) },
      uFogColor: { value: new THREE.Color(0, 0, 0) }, uFogDensity: { value: 0.01 },
      uCameraPos: { value: new THREE.Vector3() }, uBoat: { value: new THREE.Vector3() },
    };
    this.time = 0; this.currentWide = 2.0; this.currentNarrow = 3.0; this.paused = false; this.running = false; this.reflecting = false;
    this.washColor = new THREE.Color(1, 1, 1); this.washAmount = 0;      // a realm can wash the picture toward a colour for a moment (ctx.wash)
    this.paintAmount = 0; this.paintRadius = 4.5; this.paintOverride = null;
    this.textures = new Map();
    this.bitmapLoader = new THREE.ImageBitmapLoader();
    this.bitmapLoader.setOptions({ imageOrientation: 'flipY', premultiplyAlpha: 'none', colorSpaceConversion: 'none' });

    this.boat = new Boat();
    // a different boat model (developer's switch &boat=<file>: see src/main.js); it must offer what boat-model.js does
    if (opts.buildBoat) { const old = this.boat.model, m = opts.buildBoat(undefined, this), parent = old.group.parent; parent.remove(old.group); parent.add(m.group); this.boat.model = m; }
    this._buildBoat = opts.buildBoat || buildBoat;
    this.boat.motion = this.reducedMotion ? 0.25 : 1;
    this.boat.eye.add(this.camera);
    this.scene.add(this.boat.rig);
    this.input = new Input(canvas);
    // A phone's own way of making a frame (QUALITY.phone.light; docs/build/phone.md): the scene is drawn once, not
    // twice, and the finishing is made of fewer and cheaper passes.
    this.light = opts.light ?? !!this.quality.light;      // (&light=0 or 1 in the address: the other way of making a frame, to compare)
    this.post = new Post(this.renderer, this.scene, this.camera, { samples: this.quality.samples, light: this.light ? this : null });
    const WaterClass = opts.WaterClass || Water;
    this.water = new WaterClass(this, { resolution: this.quality.reflection });
    if (this.water.virtualCamera) this.water.virtualCamera.layers.enable(LAYER_MIRROR);
    // The view without the water, with its depth: a water that wants to refract what lies beneath it, or to know how
    // deep it is, sets `needsScene = true` and reads engine.pre.texture / engine.pre.depthTexture.
    this.pre = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, colorSpace: THREE.LinearSRGBColorSpace, depthBuffer: true });
    this.pre.depthTexture = new THREE.DepthTexture(4, 4); this.pre.depthTexture.type = THREE.UnsignedIntType;
    this.pre.texture.minFilter = this.pre.texture.magFilter = THREE.LinearFilter; this.pre.texture.generateMipmaps = false;
    // A phone's frame draws the scene once, into this picture, and that drawing is the picture's own: nothing may
    // take it for the cheap first look that `pre` is everywhere else. Many things in the areas ask "is this being
    // drawn into engine.pre?" and leave themselves out, or draw fewer of themselves, if it is. So on a phone the
    // picture is drawn into a target of its own (sceneTarget), and engine.pre is only a way of reading it: its
    // colour, its depth, its size. Whoever reads the scene without the water still reads engine.pre; whoever asks
    // whether they are in the first look is told no.
    if (this.light) {
      const target = this.sceneTarget = this.pre;
      this.pre = { isSceneRead: true, get texture() { return target.texture; }, get depthTexture() { return target.depthTexture; }, get width() { return target.width; }, get height() { return target.height; },
        setSize: (w, h) => target.setSize(w, h), dispose: () => target.dispose() };
    }
    this.preScale = this.light ? 1 : 0.75;      // (a phone's frame: this picture IS the scene in the frame, so it is drawn at the frame's own size)
    this.heightAt = (x, z) => this.water.heightAt(x, z);
    gouacheShared(this);
    if (this.boat.model.link) this.boat.model.link(this);         // the modelled boat takes the engine's light and paint (boat-hero.js)
    this.lanternColor = new THREE.Color('#ffb45e');
    this.lanternTarget = 1; this.lanternRate = 0.5; this.lanternFlare = 0; this.rides = 0;
    this.realms = null;
    this.audio = null; this.ui = null;
    this.guide = null;                                              // the lights that show the way on (src/engine/wayfinder.js; src/main.js makes it for the ride)
    this.listeners = {};
    this.perf = { t: 0, n: 0, ms: 16 };
    this.last = 0;
    window.addEventListener('resize', () => this.resize());
    this.resize();
  }

  on(name, fn) { (this.listeners[name] || (this.listeners[name] = [])).push(fn); }
  emit(name, ...args) { for (const fn of this.listeners[name] || []) { try { fn(...args); } catch (err) { console.error(`listener for "${name}" failed`, err); } } }

  /** @param registry ordered realms: [{id, name, veil, load}] */
  setRealms(registry) {
    this.realms = new RealmManager(this, registry);
    this.realms.onEnter = (inst) => this.emit('realm', inst);
    return this.realms;
  }

  // ------------------------------------------------------------------------------------------- sizing
  resize() {
    let w, h, pr;
    if (this.opts.size) { [w, h] = this.opts.size; pr = 1; this.canvas.style.width = w + 'px'; this.canvas.style.height = h + 'px'; }
    else {
      w = Math.max(64, window.innerWidth); h = Math.max(64, window.innerHeight);
      const q = this.quality;
      pr = Math.min(window.devicePixelRatio || 1, q.pixelRatio, Math.sqrt(q.maxPixels / (w * h))) * (this.scale || 1);
      pr = Math.max(0.5, pr);
      if (this.light) pr = Math.min(pr, window.devicePixelRatio || 1);      // (a phone's picture may be given more dots than it started with, never more than its screen has)
    }
    this.width = w; this.height = h; this.pixelRatio = pr;
    this.renderer.setPixelRatio(pr); this.renderer.setSize(w, h, false);
    this.post.setSize(w, h, pr);
    if (this.pre) this.pre.setSize(Math.max(4, Math.round(w * pr * this.preScale)), Math.max(4, Math.round(h * pr * this.preScale)));
    this.water.setSize(Math.round(w * pr), Math.round(h * pr), pr);
    const aspect = w / h;
    this.camera.aspect = aspect;
    // keep a generous horizontal view on narrow windows
    const baseV = 60, minH = 84;
    const hfov = 2 * Math.atan(Math.tan(baseV * Math.PI / 360) * aspect) * 180 / Math.PI;
    this.camera.fov = hfov >= minH ? baseV : Math.min(96, 2 * Math.atan(Math.tan(minH * Math.PI / 360) / aspect) * 180 / Math.PI);
    this.camera.updateProjectionMatrix();
  }

  // ------------------------------------------------------------------------------------------- assets
  /** Load a texture under assets/. Cached and reference-counted. opts: {data, repeat, mips, anisotropy, nearest} */
  loadTexture(url, opts = {}) {
    const key = url + (opts.data ? '|data' : '');
    let rec = this.textures.get(key);
    if (!rec) {
      const full = url.startsWith('http') || url.startsWith('/') || url.startsWith('assets/') ? url : 'assets/' + url;
      rec = { refs: 0, key };
      rec.promise = this.bitmapLoader.loadAsync(full).then((bitmap) => {
        const t = new THREE.Texture(bitmap);
        t.flipY = false;                                   // the bitmap is already flipped
        t.colorSpace = opts.data ? THREE.NoColorSpace : THREE.SRGBColorSpace;
        t.generateMipmaps = opts.mips !== false;
        t.minFilter = opts.nearest ? THREE.NearestFilter : (opts.mips !== false ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter);
        t.magFilter = opts.nearest ? THREE.NearestFilter : THREE.LinearFilter;
        t.anisotropy = opts.anisotropy ?? 8;
        if (opts.repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; if (Array.isArray(opts.repeat)) t.repeat.set(opts.repeat[0], opts.repeat[1]); }
        t.userData.key = key; t.userData.aspect = bitmap.width / bitmap.height; t.userData.width = bitmap.width; t.userData.height = bitmap.height;
        t.needsUpdate = true;
        rec.texture = t;
        return t;
      });
      this.textures.set(key, rec);
      rec.promise.catch(() => { if (this.textures.get(key) === rec) this.textures.delete(key); });      // a failed load may be tried again
    }
    rec.refs++;
    return rec.promise;
  }
  releaseTexture(t) {
    const rec = this.textures.get(t.userData.key);
    if (!rec) return;
    if (--rec.refs <= 0) { this.textures.delete(rec.key); if (t.image && t.image.close) t.image.close(); t.dispose(); }
  }

  /** Compile shaders and upload textures for a group now, so showing it later costs nothing. */
  warm(group) {
    const seen = new Set();
    group.traverse((o) => {
      const mats = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
      for (const m of mats) {
        for (const k in m) { const v = m[k]; if (v && v.isTexture && !seen.has(v)) { seen.add(v); this.renderer.initTexture(v); } }
        if (m.uniforms) for (const k in m.uniforms) { const v = m.uniforms[k].value; if (v && v.isTexture && !seen.has(v)) { seen.add(v); this.renderer.initTexture(v); } }
      }
    });
    // compile against the linear HDR target the frame really draws into (the canvas would build sRGB variants nobody uses)
    const r = this.renderer, prev = r.getRenderTarget();
    r.setRenderTarget(this.post.composer.renderTarget1);
    try { r.compile(this.scene, this.camera); } catch (e) { console.warn('warm-up compile failed', e); } finally { r.setRenderTarget(prev); }
  }

  /**
   * Get something ready to be shown, without showing it and without stopping the ride. (Until 9 November an area was
   * made ready in the frame that first showed it: its shaders linked, its textures and every mesh's geometry sent to
   * the graphics card, all in one frame, which stood still for up to four seconds in the middle of the mist between
   * two areas. The client, on his first ride: "make the loading to next area feel more natural".)
   *   const job = engine.rehearse([group, ...], [extra textures]);     then every frame:   job.step(milliseconds)
   * step() does a little and returns true when all of it is done:
   *   1. the textures are sent, one at a time;
   *   2. the shaders are asked for (the browser compiles them in the background where it can) and waited for;
   *   3. every mesh is drawn once, a few each frame, into a small picture nobody sees: that is what sends its geometry.
   * step(ms, true) does not wait for the shaders (what is left is done now: the area is needed this frame).
   * A mesh that is hidden is drawn too (it will be shown one day); its place in the world does not matter here.
   */
  rehearse(roots, extraTextures = []) {
    const r = this.renderer, scene = this.scene, meshes = [], texs = [], mats = [], seenT = new Set(), seenM = new Set();
    const addTex = (v) => { if (v && v.isTexture && !v.isRenderTargetTexture && !seenT.has(v)) { seenT.add(v); texs.push(v); } };
    for (const root of roots) root.traverse((o) => {
      if (!(o.isMesh || o.isPoints || o.isLine || o.isSprite) || !o.material) return;
      meshes.push(o);
      for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
        if (!m || seenM.has(m)) continue;
        seenM.add(m); mats.push(m);
        for (const k in m) addTex(m[k]);
        if (m.uniforms) for (const k in m.uniforms) { const v = m.uniforms[k] && m.uniforms[k].value; if (Array.isArray(v)) v.forEach(addTex); else addTex(v); }
      }
    });
    for (const t of extraTextures) addTex(t);
    const LAYER = 30;                                               // a layer nothing else is on: only what is being rehearsed is drawn
    const cam = this._rehearsalCamera || (this._rehearsalCamera = (() => { const c = new THREE.PerspectiveCamera(60, 1, 0.1, 4000); c.layers.set(LAYER); return c; })());
    const target = this._rehearsalTarget || (this._rehearsalTarget = new THREE.WebGLRenderTarget(16, 16, { type: THREE.HalfFloatType, colorSpace: THREE.LinearSRGBColorSpace, depthBuffer: true }));
    const some = { a: 0, b: 0, traverseVisible() {}, traverse(fn) { for (let k = this.a; k < this.b; k++) fn(meshes[k]); } };      // what three's compile() is given: a few meshes at a time
    // how much there is to send for a mesh (its vertices, and an instanced one's places): a slice is so many of these, not so many meshes
    const weight = (o) => { const g = o.geometry, n = g && g.attributes && g.attributes.position ? g.attributes.position.count : 0; return 400 + n + (o.isInstancedMesh ? o.count * 6 : 0); };
    let phase = 0, i = 0, since = 0, slice = 30000;
    const shown = [], was = [];
    const job = {
      done: false, meshes: meshes.length, textures: texs.length, materials: mats.length, ms: 0, steps: 0, longest: 0, longestIn: '', waitedMs: 0,
      step: (budget = 4, force = false) => {
        if (job.done) return true;
        const t0 = performance.now(), left = () => budget - (performance.now() - t0), began = phase;
        try {
          if (phase === 0) {                                        // ---- textures
            while (i < texs.length && left() > 0) { const t = texs[i++]; if (t.image) r.initTexture(t); }
            if (i >= texs.length) { phase = 1; i = 0; }
          }
          if (phase === 1 && left() > 0) {                          // ---- shaders, asked for against the kind of picture the frame really draws into
            const prev = r.getRenderTarget();
            r.setRenderTarget(this.post.composer.renderTarget1);
            try { while (i < meshes.length && left() > 0) { some.a = i; some.b = i = Math.min(meshes.length, i + 2); r.compile(some, this.camera, scene); } }
            finally { r.setRenderTarget(prev); }
            if (i >= meshes.length) { phase = 2; i = 0; since = performance.now(); }
          }
          if (phase === 2) {                                        // ---- wait for them (never more than eight seconds: then they are waited for where they are used)
            let ready = true;
            if (!force && performance.now() - since < 8000) for (const m of mats) { const pr = r.properties.get(m).currentProgram; if (pr && pr.isReady && !pr.isReady()) { ready = false; break; } }
            if (ready) { phase = 3; i = 0; job.waitedMs = Math.round(performance.now() - since); }
          }
          if (phase === 3 && left() > 0) {                          // ---- geometry: each mesh drawn once into a picture nobody sees
            const attached = [], prev = r.getRenderTarget(), calls = r.info.render.calls, tris = r.info.render.triangles, points = r.info.render.points, lines = r.info.render.lines;
            for (const root of roots) if (!root.parent) { scene.add(root); attached.push(root); }
            r.setRenderTarget(target);
            try {
              while (i < meshes.length && left() > 0) {
                const a = i; let b = i, sum = 0;
                do { sum += weight(meshes[b]); b++; } while (b < meshes.length && sum + weight(meshes[b]) <= slice);
                shown.length = 0; was.length = 0;
                for (let k = a; k < b; k++) {
                  const o = meshes[k];
                  o.layers.enable(LAYER); was.push(o.frustumCulled); o.frustumCulled = false;
                  for (let n = o; n && n !== scene; n = n.parent) if (n.visible === false) { n.visible = true; shown.push(n); }
                }
                const t1 = performance.now();
                r.render(scene, cam);
                const took = performance.now() - t1;
                for (let k = a; k < b; k++) { const o = meshes[k]; o.layers.disable(LAYER); o.frustumCulled = was[k - a]; }
                for (const n of shown) n.visible = false;
                i = b;
                slice = Math.max(4000, Math.min(400000, Math.round(slice * (took > 5 ? 0.6 : took < 1.5 ? 1.5 : 1))));
              }
            } finally {
              r.setRenderTarget(prev);
              for (const root of attached) scene.remove(root);
              r.info.render.calls = calls; r.info.render.triangles = tris; r.info.render.points = points; r.info.render.lines = lines;
            }
            if (i >= meshes.length) job.done = true;
          }
        } catch (err) { console.warn('a rehearsal stopped (what is left is made ready when it is first shown)', err); job.done = true; }
        const took = performance.now() - t0;
        job.ms += took; job.steps++;
        if (took > job.longest) { job.longest = took; job.longestIn = ['textures', 'shaders', 'waiting', 'geometry'][began]; }
        return job.done;
      },
    };
    return job;
  }

  /** The boat as an area will paint it, made before the area is entered (and kept, as setBoatColors keeps it). */
  prepareBoat(colors) {
    const boats = this._boats || (this._boats = new Map([['null', this.boat.model]]));
    const key = colors && colors.follow === true ? 'follow' : JSON.stringify(colors || null);
    let model = boats.get(key);
    if (!model) { model = this._buildBoat(colors || {}, this); boats.set(key, model); }
    return model;
  }

  setBoatColors(colors) {
    // A look whose boat says `follow: true` has its colours read on every look change (a light state may repaint the
    // boat): one boat is kept for such looks and repainted in place, never rebuilt. Every other look is as it was: its
    // colours are read once, when its realm is entered, and the boat for them is kept by what they are.
    if (colors && colors.follow === true) {
      const boats = this._boats || (this._boats = new Map([['null', this.boat.model]]));
      let model = boats.get('follow');
      if (!model) { model = this._buildBoat(colors, this); boats.set('follow', model); }
      else if (typeof model.setColors === 'function') model.setColors(colors);
      if (this.boat.model !== model) {
        const old = this.boat.model, parent = old.group.parent;
        model.lightLevel = old.lightLevel; model.lit = old.lit ?? 1;
        parent.remove(old.group); parent.add(model.group);
        this.boat.model = model;
      }
      this._boatKey = 'follow';
      return;
    }
    const key = JSON.stringify(colors || null);
    if (key === (this._boatKey ?? 'null')) return;
    const boats = this._boats || (this._boats = new Map([['null', this.boat.model]]));     // recoloured boats are kept, not rebuilt
    const old = this.boat.model, parent = old.group.parent;
    let model = boats.get(key);
    if (!model) boats.set(key, model = this._buildBoat(colors || {}, this));
    model.lightLevel = old.lightLevel; model.lit = old.lit ?? 1;
    parent.remove(old.group); parent.add(model.group);
    this.boat.model = model; this._boatKey = key;
  }

  // ------------------------------------------------------------------------------------------- loop
  start() {
    if (this.running) return;
    this.running = true; this.last = performance.now();
    const loop = (now) => {
      if (!this.running) return;
      this.raf = requestAnimationFrame(loop);
      try { this.frame(now); } catch (err) { this.frameErrors = (this.frameErrors || 0) + 1; if (this.frameErrors === 1) console.error('a frame failed (the ride goes on)', err); }
    };
    this.raf = requestAnimationFrame(loop);
  }
  stop() { this.running = false; cancelAnimationFrame(this.raf); }

  frame(now) {
    // A phone's pace (govern): when a frame cannot be made in one turn of the screen, every other turn is let go by,
    // so that the frames come evenly at half the rate and not unevenly at something in between.
    const g = this.gov;
    if (g) {
      // (how long one turn of the screen is: the shortest the gaps between two calls here usually are. A slow frame
      //  makes a gap two turns long, so the gaps' average would say the screen is slower than it is.)
      if (g.lastTick) { const gap = now - g.lastTick; if (gap > 4 && gap < 70) { g.gaps[g.gapAt++ % 90] = gap; if (g.gapAt % 45 === 0) { const v = Array.from(g.gaps).filter((x) => x > 0).sort((a, b) => a - b); g.turn = v[Math.floor(v.length * 0.15)] || g.turn; } } }
      g.lastTick = now;
      if (g.pace > 1 && (g.tick++ % g.pace)) return;
    }
    const began = performance.now();
    const dt = Math.min(g && g.pace > 1 ? 0.1 : 0.05, Math.max(0, (now - this.last) / 1000));
    this.last = now;
    if (!this.paused) this.update(dt);
    else { this.input.update(dt); this.handleActions(); this.input.endFrame(); }
    this.render();
    if (this.light && !this.opts.size) { this.govern(now, began, dt); return; }      // (a phone keeps its own pace: below)
    // Adaptive resolution: if frames stay slow, render fewer pixels. If fewer pixels do not buy a faster frame (the
    // display is simply paced at 30 Hz, or the work is on the CPU), put them back and stop trying.
    if (!this.paused && !this.opts.size && dt > 0) {
      const p = this.perf; p.t += dt; p.n++;
      if (p.t >= 2) {
        const ms = p.t / p.n * 1000;
        if (p.base && ms < p.base.ms * 0.9) p.base = null;
        if (!p.locked && ms > 22) {
          if (this.pixelRatio > 0.75 && !(p.base && p.base.steps >= 3)) {
            if (!p.base) p.base = { ms, scale: this.scale || 1, steps: 0 };
            p.base.steps++; this.scale = (this.scale || 1) * 0.85; this.resize();
          } else if (p.base) { this.scale = p.base.scale; p.base = null; p.locked = true; this.resize(); }
        }
        p.ms = ms; p.t = 0; p.n = 0;
      }
    }
  }

  /**
   * A phone's frame is kept to what the phone can do (docs/build/phone.md). Every twentieth frame the graphics card
   * is waited for, so that what the frame really cost is known (the browser otherwise hides it: all a page sees is
   * whether the screen's turn was caught or missed). From that:
   *   - the frames come at the screen's own rate while a frame fits in one turn of it, and at an even half of it (a
   *     third, a quarter, on a faster screen; never under thirty a second) when it does not: an even thirty is smooth
   *     to look at, an uneven forty is not;
   *   - the picture is drawn with more dots while there is time to spare, and fewer when there is not, between 0.8
   *     and 1.25 of its starting width (the edges are smoothed and the picture sharpened in the last pass, so it does
   *     not go to a blur at the lower end, as it did when the only answer to a slow frame was fewer dots, three times
   *     over);
   *   - while the frames come faster than fifty a second the water's mirror is drawn every other frame;
   *   - and a phone that cannot make thirty a second even with the fewest dots gives up two more things, in the order
   *     they are least missed: the mirror every other frame at any rate, then the painter's filter (`lean` 1, 2).
   * What a device settles on is kept (localStorage) and is where it starts the next time.
   * engine.gov says what it has settled on: { fps, cost, scale, pace, lean, turn }.
   */
  govern(now, began, dt) {
    let g = this.gov;
    if (!g) {
      g = this.gov = { pace: 1, tick: 0, turn: 16.7, gaps: new Float32Array(90), gapAt: 0, lastTick: 0, n: 0, costs: [], cost: 0, scale: 1, lean: 0, over: 0, under: 0, changed: now, fps: 60, quiet: now + 3000 };
      // (what this device settled on the last time is where it starts this time: no need to find it out again, frame by slow frame)
      try { const was = JSON.parse(localStorage.getItem('quiet-current.pace') || 'null'); if (was && was.pace >= 1 && was.pace <= 4 && was.scale >= 0.8 && was.scale <= 1.25) { g.pace = was.pace | 0; g.lean = Math.min(2, Math.max(0, was.lean | 0)); if (was.scale !== 1) { g.scale = this.scale = was.scale; this.resize(); } } } catch (err) { /* nothing kept, or not allowed to keep */ }
    }
    if (this.paused || !(dt > 0)) { g.quiet = now + 1500; return; }
    const building = this.realms && (this.realms.building.size || this.realms.holding);
    if (building) g.quiet = now + 2000;                       // (an area being made ready: its frames say nothing about the ride's)
    this.mirrorEvery = g.pace * g.turn < 20 || g.lean >= 1 ? 2 : 1;
    this.noPaint = g.lean >= 2;
    if (++g.n % 20) return;
    const gl = this.renderer.getContext(), px = this._px || (this._px = new Uint8Array(4));
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
    const cost = performance.now() - began;
    if (now < g.quiet) return;
    g.costs.push(cost); if (g.costs.length > 5) g.costs.shift();
    if (g.costs.length < 3) return;
    const sorted = g.costs.slice().sort((a, b) => a - b), c = g.cost = sorted[sorted.length >> 1];      // (the middle one of the last five: one slow frame is not a slow phone)
    const room = g.pace * g.turn;                              // what a frame may take, at this pace
    g.fps = Math.round(1000 / room);
    const tight = c > room - 2.0, loose = c < room * 0.62;
    g.over = tight ? g.over + 1 : 0; g.under = loose ? g.under + 1 : 0;
    const settle = (scale, pace, lean = g.lean) => {
      // (after giving something up it waits longer before asking for it back: a picture that sharpens and softens
      //  every few seconds is worse than one that stays a little soft)
      const less = scale < g.scale || pace > g.pace || lean > g.lean;
      g.scale = scale; g.pace = pace; g.lean = lean; g.over = g.under = 0; g.costs.length = 0; g.changed = now + (less ? 6000 : 0); g.quiet = now + 1200;
      if (this.scale !== scale) { this.scale = scale; this.resize(); }
      try { localStorage.setItem('quiet-current.pace', JSON.stringify({ pace, scale, lean })); } catch (err) { /* not allowed to keep it: found again next time */ }
    };
    if (now - g.changed < 2500) return;                       // (one change at a time, and time to see what it did)
    if (g.over >= 2) {
      if (g.scale > 0.81) settle(Math.max(0.8, g.scale * 0.9), g.pace);                 // fewer dots first
      else if (room < 30) settle(1, g.pace + 1);                                        // then a slower, even rate (never under thirty a second), and the dots back
      else if (g.lean < 2) settle(g.scale, g.pace, g.lean + 1);                         // and for a phone that still cannot: the mirror every other frame, then no painter's filter
    } else if (g.under >= 4) {
      if (g.lean > 0 && c < room * 0.5) settle(g.scale, g.pace, g.lean - 1);            // time to spare: first what was taken away,
      else if (g.scale < 1.24) settle(Math.min(1.25, g.scale * 1.08), g.pace);          // then more dots,
      else if (g.pace > 1 && c < (g.pace - 1) * g.turn * 0.6) settle(g.scale, g.pace - 1);      // and, with all its dots, a faster rate again
    }
  }

  handleActions() {
    const input = this.input;
    if (input.take('pause')) this.emit('pause-key');
    if (input.take('music')) this.emit('music-key');
  }

  update(dt) {
    this.renderer.info.reset(); this._infoFresh = true;
    const input = this.input, boat = this.boat, realms = this.realms;
    this.time += dt; this.shared.uTime.value = this.time;
    input.update(dt);
    this.handleActions();
    if (input.take('centre')) this.centring = 1.2;
    if (input.dragging || input.lastLook === 0) this.centring = 0;          // a hand on the view wins
    if (this.centring > 0) { this.centring -= dt; input.centre(dt, 5); }
    const inst = realms && realms.current;
    if (inst) {
      const ctl = { throttle: input.throttle, steer: input.steer, hurry: input.keys.has('ShiftLeft') || input.keys.has('ShiftRight') };
      // (a picture's or the film's boat is held at a speed through the water: with the rower aboard it gains with each
      // push of her oar and runs on while she comes back, a twelfth either way, as a boat driven by pushes does: boat.js
      // does the same for the paddle)
      if (this.devSpeed != null) { const rw = boat.model && boat.model.rower; boat.u = this.devSpeed * (1 + (rw && rw.effort > 0.05 ? (rw.push ? 0.085 * rw.run : 0.10 * rw.effort * Math.sin(rw.phase * Math.PI * 4 - 1.0)) : 0)); }
      // the water carries the boat faster where the channel is narrow
      const hw = inst.path.at(boat.s).halfWidth, kw = Math.min(1, Math.max(0, (hw - 10) / 14));
      this.current = this.currentNarrow + (this.currentWide - this.currentNarrow) * kw * kw * (3 - 2 * kw);
      // (wait: the area ahead is still being built or made ready, so the water stills toward the end of this one: boat.js)
      const ahead = realms.prewarm && realms.lookAhead !== false && !inst.path.endStop ? realms.built.get(realms.neighbour(1)) : null;
      const wait = realms.prewarm && realms.lookAhead !== false && !inst.path.endStop && !(ahead && ahead.warmed);
      boat.update(dt, ctl, inst.path, { current: this.frozen ? 0 : this.current, colliders: inst.colliders, frozen: realms.holding || this.frozen, wait, heightAt: this.heightAt });
      realms.update(dt);
      if (this.guide) { try { this.guide.update(dt); } catch (err) { console.error('the wayfinder threw and was switched off', err); this.guide = null; } }
    }
    // the rider's head
    const k = 1 - Math.exp(-dt * 14);
    this.camera.rotation.y += (input.lookYaw - this.camera.rotation.y) * k;
    this.camera.rotation.x += (input.lookPitch - this.camera.rotation.x) * k;
    boat.rig.updateMatrixWorld(true);
    this.camera.getWorldPosition(this.shared.uCameraPos.value);
    this.shared.uBoat.value.set(boat.x, 0, boat.z);
    // the bow lantern: eased toward what the realm asked for (ctx.lantern), flaring for a breath beside a kept lamp
    const m = boat.model; m.lit = (m.lit ?? 1) + Math.sign(this.lanternTarget - (m.lit ?? 1)) * Math.min(Math.abs(this.lanternTarget - (m.lit ?? 1)), dt * this.lanternRate);
    this.lanternFlare = Math.max(0, this.lanternFlare - dt / 3.2);
    m.flare = this.lanternFlare > 0 ? Math.sin((1 - this.lanternFlare) * Math.PI) : 0;
    // the bow lantern is one of the two lights that paint responds to
    boat.model.light.getWorldPosition(this.shared.uLanternPos.value);
    this.shared.uLanternColor.value.copy(this.lanternColor).multiplyScalar(Math.max(0, m.lit) * m.lightLevel * 0.62 * (1 + 0.45 * m.flare));
    this.water.update(dt, this.time, boat);
    if (this.audio) this.audio.update(dt, this);
    this.emit('update', dt);
    input.endFrame();
  }

  render() {
    const r = this.renderer;
    if (!this._infoFresh) r.info.reset();     // the counters were already cleared at the start of update(), so that the water's own simulation passes are counted
    this._infoFresh = false;
    // (A phone's frame, `light`: this picture is always drawn, at the frame's own size, and is then the scene itself:
    //  the frame is finished by laying it down with its depth and drawing over it only the water and what comes after
    //  the water (src/engine/post.js, LatePass). The scene is drawn once where every other frame draws it twice.)
    const late = this._late || (this._late = []), lights = this._lights || (this._lights = []);
    late.length = 0; lights.length = 0;
    if ((this.light || this.water.needsScene || this.paintAmount > 0) && !this.noUnder) {  // the scene without the water: for refraction, depth, and to tell paint from water
      const mesh = this.water.mesh, was = mesh.visible;
      mesh.visible = false;
      // See-through things drawn after the water (glows, halos, mist, anything translucent that writes no depth and has
      // a renderOrder above the water's) stay out of this picture: the water reads it as "what lies beneath", and would
      // show each of them a second time, bent, under its surface. A thing that does lie beneath is made with
      // `underwater: true` (renderOrder -2) and stays in. `userData.inPre = true` keeps anything else in.
      const after = this._after || (this._after = []), masks = this._afterMasks || (this._afterMasks = []), order = mesh.renderOrder;
      after.length = 0; masks.length = 0;
      const light = this.light;
      this.scene.traverseVisible((o) => {
        if (light && o.isLight && o.layers.test(this.camera.layers)) lights.push(o);
        if (o.renderOrder > order && (o.isMesh || o.isPoints || o.isLine || o.isSprite) && !o.userData.inPre) {
          const m = o.material;
          // (`userData.afterWater = true`: a solid thing that is drawn after the water all the same, and so stays out of
          // this picture and out of the painter's filter: the guide lanterns, which must stay crisp far off)
          if (m && ((m.transparent && m.depthWrite === false) || o.userData.afterWater)) { after.push(o); masks.push(o.layers.mask); o.layers.mask = 0; }
        }
      });
      r.setRenderTarget(this.sceneTarget || this.pre); r.clear(); r.render(this.scene, this.camera); r.setRenderTarget(null);
      for (let i = 0; i < after.length; i++) after[i].layers.mask = masks[i];
      // (only what the rider's own eye sees: an area may keep things on layers of its own for a camera of its own)
      if (light) { const seen = this.camera.layers.mask; if (was) late.push(mesh); for (let i = 0; i < after.length; i++) if (masks[i] & seen) late.push(after[i]); }
      after.length = 0;
      mesh.visible = was;
    }
    this.water.renderReflection();
    this.post.setPaint(this.noPaint ? 0 : this.paintAmount || 0, this.paintRadius || 4.5, this.pre.depthTexture);
    this.post.setWash(this.washColor, this.washAmount);
    this.post.render(this.time);
    this.drawn = this.drawn || {}; this.drawn.calls = r.info.render.calls; this.drawn.triangles = r.info.render.triangles;      // (what this frame took: the counters are cleared when the next begins)
  }

  /** Set how brightly the bow lantern burns (0 = cold, 1 = burning), reached over `seconds`. */
  setLantern(level, seconds = 2) { this.lanternTarget = level; this.lanternRate = 1 / Math.max(0.05, seconds); if (seconds <= 0) this.boat.model.lit = level; }

  /** Start the ride over from the first realm (the last realm's "Ride again"). */
  async rideAgain() {
    this.rides += 1;
    await this.realms.enter(0, 0);
    this.emit('ride-again', this.rides);
  }

  /** Step the simulation without waiting for animation frames (tests and screenshots). */
  simulate(seconds, hz = 60) { const n = Math.max(1, Math.round(seconds * hz)); for (let i = 0; i < n; i++) this.update(1 / hz); }

  /** Rough memory held by what is in the scene now (for the perf probe): MB of textures and geometry, and counts. */
  memoryReport() {
    const texs = new Set(), geos = new Set();
    const addTex = (t) => { if (t && t.isTexture) texs.add(t); };
    const addMat = (m) => {
      if (!m) return;
      for (const k in m) addTex(m[k]);
      if (m.uniforms) for (const k in m.uniforms) { const v = m.uniforms[k] && m.uniforms[k].value; if (Array.isArray(v)) v.forEach(addTex); else addTex(v); }
    };
    this.scene.traverse((o) => { if (o.geometry) geos.add(o.geometry); if (Array.isArray(o.material)) o.material.forEach(addMat); else addMat(o.material); });
    let tex = 0, biggest = 0;
    for (const t of texs) {
      const im = t.image; if (!im || !im.width) continue;
      const per = t.type === THREE.FloatType ? 16 : t.type === THREE.HalfFloatType ? 8 : 4;
      const b = im.width * im.height * per * (t.generateMipmaps === false ? 1 : 1.33) * (im.depth || 1);
      tex += b; biggest = Math.max(biggest, Math.max(im.width, im.height));
    }
    let geo = 0, verts = 0;
    for (const g of geos) {
      for (const k in g.attributes) { const a = g.attributes[k]; geo += (a.array && a.array.byteLength) || 0; }
      if (g.index) geo += g.index.array.byteLength;
      verts += g.attributes.position ? g.attributes.position.count : 0;
    }
    const mb = (b) => +(b / 1048576).toFixed(1), info = this.renderer.info;
    return { textureMB: mb(tex), textures: texs.size, largestTexture: biggest, geometryMB: mb(geo), vertices: verts, glTextures: info.memory.textures, glGeometries: info.memory.geometries,
      programs: info.programs ? info.programs.length : 0, heapMB: performance.memory ? mb(performance.memory.usedJSHeapSize) : null };
  }
}
