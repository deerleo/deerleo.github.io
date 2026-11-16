// Boot: read the URL, build the engine, start the ride (or take a screenshot and stop).
//
// Developer parameters:
//   ?realm=<id>        start in this realm            &at=0.4 (fraction of its waterway) or &s=120 (metres)
//   &d=3               metres right of the centreline &heading=20 (degrees off the path direction)
//   &yaw=-30&pitch=5   where the rider looks, degrees (yaw to the left is positive)
//   &t=12              let the realm run this many seconds first (60 at most)
//   &q=low|medium|high quality                        &ui=0 no interface
//   &shot=name.png     render one frame and send it to the dev server (see tools/shot.py); &shotw=1600&shoth=900
//   &frames=6&dt=0.5   in shot mode, send six frames half a second apart (tools/shot.py --frames lays them out as a strip)
//   &drift=1           in shot mode, let the current carry the boat during &t; &speed=3 also paddles at that speed
//   &perf=name.json    time 150 frames and send the numbers to the dev server
//   &play=name[,name]  fire a realm's staged moment at once (see src/engine/stage.js); then &t=8 shows it eight seconds in
//   &water=<file>      use src/engine/<file>.js as the water (the ride's own is water-final.js; &water=water is the first, plain one)
//   &boat=<file>       use src/engine/<file>.js as the rider's boat (the ride's own is boat-hero.js)
//   &paint=0..1        override the realm's painterly filter amount
//   &calm=1            reduced motion, as the rider's setting or system preference would ask for it
//   &toe=0..1          try the realm with look.grade.toe forced to this value (how the darkest values are shown)
//   &cine=<file.json>  film one shot of the cinematic with a free camera, frame by frame (src/cine.js; driven by tools/film.py)
//   &guide=1           show the lights that mark the way on in a developer's picture (the ride itself always has them; &guide=0 leaves them out)
//   &handover=x.json   measure what crossing into each following area costs (frames while it is made ready, and its first frames); &prewarm=0 as it was
import { missed, again, unfetched } from './engine/net.js';      // (first: from here on a file that does not arrive is asked for again)
import { Engine } from './engine/engine.js';
import { Vector2 as THREE_V2 } from 'three';
import { REALMS } from './realms/index.js';

const params = new URLSearchParams(location.search);
// In the developer's modes every console.error (a realm that failed to build, an update function that threw and was
// switched off, a module left out) is repeated with the word PAGE_ERROR in front, which tools/shot.py lists under
// "PAGE ERRORS": a picture can look fine while part of the area is silently missing.
if (params.has('shot') || params.has('perf') || params.has('realm')) {
  const plain = console.error.bind(console);
  const text = (x) => (x && x.stack ? String(x.stack) : typeof x === 'object' ? (() => { try { return JSON.stringify(x); } catch (e) { return String(x); } })() : String(x));
  console.error = (...a) => { const m = a.map(text).join(' '); plain(/INVALID_|PAGE_ERROR/.test(m) ? m : 'PAGE_ERROR ' + m); };
  window.addEventListener('error', (e) => plain('PAGE_ERROR uncaught: ' + (e.message || '') + ' ' + ((e.error && e.error.stack) || '')));
  window.addEventListener('unhandledrejection', (e) => plain('PAGE_ERROR unhandled rejection: ' + text(e.reason)));
}
const num = (k, d) => (params.has(k) && params.get(k) !== '' && !Number.isNaN(+params.get(k)) ? +params.get(k) : d);
const canvas = document.getElementById('view');
const shot = params.has('perf') ? null : params.get('shot');
const dev = params.has('realm') || !!shot;

async function main() {
  // (no quality asked for: a phone or a tablet gets the light one made for it, engine.js QUALITY.phone; &as=touch tries it on a desk)
  const finger = (window.matchMedia && window.matchMedia('(hover: none) and (pointer: coarse)').matches) || params.get('as') === 'touch';
  const opts = { quality: params.get('q') || (finger && !shot && !params.has('perf') && !params.has('cine') ? 'phone' : undefined) };
  if (params.has('calm')) opts.reducedMotion = params.get('calm') !== '0';      // &calm=1: as if the rider had asked for reduced motion
  if (params.has('light')) opts.light = params.get('light') !== '0';            // &light=1: a phone's way of making a frame (docs/build/phone.md); &light=0: the ordinary way, on a phone
  if (shot || params.has('perf') || params.has('cine') || params.has('census')) opts.size = [num('shotw', 1600), num('shoth', 900)];
  const waterFile = params.get('water');
  if (waterFile && /^[\w-]+$/.test(waterFile)) opts.WaterClass = (await import(`./engine/${waterFile}.js`)).Water;
  // &boat=<file>: use src/engine/<file>.js for the rider's boat (same exports as boat-model.js, plus an optional
  // async loadBoat() that is awaited first, for a boat that is a model file)
  if (params.has('boat') && /^[\w-]+$/.test(params.get('boat'))) { const mod = await import(`./engine/${params.get('boat')}.js`); if (mod.loadBoat) await mod.loadBoat(); opts.buildBoat = mod.buildBoat; }
  // the rider's boat and the kept lamp are models: they are fetched before the engine is made (docs/life/boat.md)
  { const { loadBoat } = await import('./engine/boat-hero.js'), { loadLamp } = await import('./engine/lamp-hero.js'); await Promise.all([loadBoat(), loadLamp(['post', 'hook', 'bracket'])]); }
  const engine = new Engine(canvas, opts);
  if (params.has('toe')) engine.post.forceToe = Number(params.get('toe')) || 0;      // &toe=1: try a realm with the tone curve's toe taken out (look.grade.toe)
  window.engine = engine;
  engine.dev = dev; engine.devPlay = dev ? params.get('play') : null;        // &play=name fires a realm's cue at once (src/engine/stage.js)
  if (params.has('paint')) engine.paintOverride = num('paint', 0.8);          // &paint=0 switches the painter's filter off, &paint=1 forces it full on
  // &off=mirror,under,glow,paint,water,sim (a developer's, for finding what a frame's time goes on: docs/build/phone.md):
  // leave a part of the frame out. mirror: the reflection is not drawn again. under: nor the view without the water.
  // glow: no bloom. paint: no painter's filter. water: the water's surface is not drawn. sim: its waves are not stepped.
  if (dev || params.has('perf') || params.has('census')) {
    const off = new Set((params.get('off') || '').split(',').filter(Boolean));
    if (off.has('mirror')) engine.water.renderReflection = () => {};
    if (off.has('glow')) engine.post.bloom.enabled = false;
    if (off.has('paint')) engine.paintOverride = 0;
    if (off.has('water')) engine.on('update', () => { engine.water.mesh.visible = false; });
    if (off.has('sim')) { const step = engine.water.update.bind(engine.water); let n = 0; engine.water.update = (...a) => { if (n++ < 30) step(...a); }; }
    if (off.has('under')) engine.noUnder = true;
    if (off.has('late')) engine.noLate = true;            // (a phone's frame: only the picture of the scene is laid down, nothing drawn over it)
  }
  // &meter=1 (on any address, a visitor's too): a line in the corner saying how the ride is running on this device:
  // frames a second, what a frame costs, the picture's size in dots, and how it is being made. For reading off a real
  // phone, which no tool here can stand in for (docs/build/phone.md).
  if (params.has('meter') && params.get('meter') !== '0') {
    const line = document.createElement('div');
    line.style.cssText = 'position:fixed;left:max(8px,env(safe-area-inset-left));bottom:max(8px,env(safe-area-inset-bottom));z-index:9;pointer-events:none;font:600 12px/1.3 ui-monospace,Menlo,monospace;color:#fff;background:rgba(0,0,0,.62);padding:4px 7px;border-radius:4px;white-space:pre';
    document.body.appendChild(line);
    let n = 0, t0 = performance.now(), worst = 0, last = t0;
    engine.on('update', () => {
      const t = performance.now(); worst = Math.max(worst, t - last); last = t; n++;
      if (t - t0 < 1000) return;
      const g = engine.gov, size = engine.renderer.getDrawingBufferSize(new THREE_V2());
      line.textContent = `${Math.round(n * 1000 / (t - t0))} fps  worst ${Math.round(worst)} ms` + (g ? `  costs ${g.cost.toFixed(1)} ms  aims ${g.fps}` : '') +
        `\n${size.x}x${size.y}  ${engine.light ? 'phone frame' : engine.quality.level}${g ? '  x' + g.scale.toFixed(2) + (engine.mirrorEvery > 1 ? '  mirror/2' : '') + (g.lean ? '  lean ' + g.lean : '') : ''}  ${(engine.drawn || {}).calls || 0} draws  ${(((engine.drawn || {}).triangles || 0) / 1e6).toFixed(2)}M tris`;
      n = 0; t0 = t; worst = 0;
    });
  }
  const realms = engine.setRealms(REALMS);
  // Tools step time themselves, faster than a graphics card compiles: for them an area is made ready in the frame that
  // first shows it, as before. The ride itself makes the area ahead ready a little every frame (realms.prewarm).
  if (shot || params.has('perf') || params.has('journey') || params.has('cine')) realms.prewarm = false;
  // The lights that show the way on (src/engine/wayfinder.js): in the ride itself always (&guide=0 leaves them out); in a
  // developer's picture only when asked for (&guide=1), so that every picture taken before them stays as it was.
  if (params.get('guide') !== '0' && ((!dev && !params.has('perf') && !params.has('cine') && !params.has('journey')) || params.get('guide') === '1')) {
    try { const { makeWayfinder } = await import('./engine/wayfinder.js'); engine.guide = makeWayfinder(engine); } catch (err) { console.info('no wayfinder:', err.message); }
  }

  let index = 0;
  if (params.has('realm')) {
    const r = params.get('realm');
    index = REALMS.findIndex((x) => x.id === r);
    if (index < 0 && /^[\w-]+$/.test(r)) {                 // a realm file that is not in the ride order yet
      REALMS.unshift({ id: r, name: r, load: () => import(`./realms/${r}.js`) });
      index = 0;
    }
    if (index < 0) index = 0;
  }
  const inst = await realms.ensure(index);
  // A visitor's first place with parts of it missing (the connection went, and did not come back in time) is not
  // shown as if it were whole: the opening card says so and offers to try again (index.html; src/engine/net.js).
  if (window.__opening && !window.__opening.over && missed.length) throw new Error(`Failed to load ${missed.length} part${missed.length > 1 ? 's' : ''} of the ride (${missed.slice(0, 3).join(', ')}${missed.length > 3 ? ', ...' : ''})`);
  const L = inst.path.length;
  const s = params.has('s') ? num('s', 0) : num('at', dev ? 0.2 : 0) * L;
  realms.activate(inst, Math.min(L - 0.5, Math.max(dev ? 0.5 : 0, s)), { d: num('d', 0), turn: num('heading', 0) * Math.PI / 180 });
  engine.input.lookYaw = num('yaw', 0) * Math.PI / 180; engine.input.lookPitch = num('pitch', 0) * Math.PI / 180;
  engine.camera.rotation.y = engine.input.lookYaw; engine.camera.rotation.x = engine.input.lookPitch;

  // A picture or a timing taken for judging waits for the shared brush texture. It arrives a moment after the first
  // frame, and the ride shows the brushed state from its first second on: a still taken without it is lighter and flatter.
  if (shot || params.has('perf') || params.has('cine')) { try { const t = await engine.loadTexture('art/shared/drybrush.webp', { repeat: true }); engine.releaseTexture(t); } catch (e) {} }
  // &cine=<a shot's JSON>: film one shot of the cinematic, frame by frame, with a free camera (src/cine.js, film/README.md)
  if (params.has('cine')) { const { film } = await import('./cine.js'); await film(engine, realms, inst, canvas, params); return; }
  // A still does not start building the next area behind the picture (lighter, quicker, and a neighbour's half-edited
  // file cannot put errors into it). A drifting picture does, and waits for it: time is stepped here faster than an area
  // can build, so without the wait a strip that reaches the end of its area would sit in the veil's dark.
  const drifting = params.has('drift');
  if ((shot || params.has('perf') || params.has('census')) && !drifting) realms.lookAhead = false;
  const run = async (seconds, hz) => {
    if (!drifting) { engine.simulate(seconds, hz); return; }
    for (let left = seconds; left > 1e-6; left -= 1) { engine.simulate(Math.min(1, left), hz); if (realms.building.size || realms.holding) await realms.settled(); }
  };
  // &journey=<name>: the whole ride left to the current, from wherever the address starts (the mooring:
  // /?realm=landing&s=14&d=-7&drift=1&play=crossing&journey=ride) to the ending, stepped faster than real time, with no
  // interface. It posts a small picture every &every=30 seconds of the ride (.shots/<name>_NN.jpg) and, at the end,
  // .shots/<name>.json: when each area was entered, how long the ride took, whether the ending came, and where the
  // boat stood still for more than 40 seconds if it did. tools/shot.py waits for the json:
  //   python3 tools/shot.py "/?realm=landing&s=14&d=-7&drift=1&play=crossing&journey=ride&shotw=960&shoth=540" ride.json --timeout 2400
  // &where=<name>.json[&r=14]: what stands round the boat where the address puts it: the channel's half width there and
  // every solid or soft thing within r metres, each with its place along and across the route (for "why is the boat held here").
  if (params.has('where')) {
    const b = engine.boat, path = inst.path, r = num('r', 14), q = {};
    const near = inst.colliders.map((c) => { const l = path.locate(c.x, c.z, null, q); return { s: +l.s.toFixed(1), d: +l.d.toFixed(2), r: +c.r.toFixed(2), soft: c.soft || 0, off: +Math.hypot(c.x - b.x, c.z - b.z).toFixed(2) }; })
      .filter((c) => c.off < r + c.r).sort((a, c) => a.s - c.s);
    const widths = []; for (let k = -10; k <= 20; k += 2) { const a = path.at(Math.max(0, Math.min(path.length, b.s + k))); widths.push([+(b.s + k).toFixed(0), +a.halfWidth.toFixed(1)]); }
    await fetch('/__shot/' + params.get('where'), { method: 'POST', body: JSON.stringify({ area: inst.id, s: +b.s.toFixed(2), d: +b.d.toFixed(2), length: +path.length.toFixed(1), softEdges: !!path.softEdges, endStop: !!path.endStop, halfWidths: widths, colliders: near, all: inst.colliders.length }) });
    document.title = 'shot done';
    return;
  }
  // &census=<name>.json[&t=4]: what one frame of this view is made of (docs/build/phone.md). Every drawing the frame
  // makes (the water's own passes, the view without the water, the mirror, the picture, the filter), with its size, its
  // draw calls and its triangles; the things in the scene that cost most triangles, drawn or not; and how long the
  // frame's parts take in the browser itself (update, render without waiting for the graphics card) and in all.
  if (params.has('census')) {
    engine.frozen = !params.has('drift');
    await run(Math.min(60, num('t', 2)), 30);
    const r = engine.renderer, gl = r.getContext(), info = r.info, px = new Uint8Array(4), now = () => performance.now();
    for (let i = 0; i < 20; i++) { engine.update(1 / 60); engine.render(); }
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
    // ---- every drawing of one frame
    const draws = [], plain = r.render.bind(r);
    r.render = (scene, camera) => {
      const t = r.getRenderTarget(), c0 = info.render.calls, t0 = info.render.triangles, p0 = info.render.points, l0 = info.render.lines;
      plain(scene, camera);
      draws.push({ into: t ? `${t.width}x${t.height}${t.samples ? ' x' + t.samples : ''}${t.texture && t.texture.type === 1016 ? ' half' : t.texture && t.texture.type === 1015 ? ' float' : ''}` : 'the screen',
        calls: info.render.calls - c0, triangles: info.render.triangles - t0, points: info.render.points - p0, lines: info.render.lines - l0, what: scene === engine.scene ? (camera === engine.camera ? 'the scene' : 'the scene, mirrored') : 'a pass' });
    };
    engine.update(1 / 60); const afterUpdate = draws.length; engine.render();
    r.render = plain;
    // ---- what costs most triangles (as the scene stands; an instanced thing counts every one of its places)
    const things = [];
    engine.scene.traverseVisible((o) => {
      if (!(o.isMesh || o.isPoints || o.isLine) || !o.geometry) return;
      const g = o.geometry, n = g.index ? g.index.count : (g.attributes.position ? g.attributes.position.count : 0);
      const range = g.drawRange && Number.isFinite(g.drawRange.count) ? Math.min(n, g.drawRange.count) : n;
      const each = o.isMesh ? range / 3 : 0, many = o.isInstancedMesh ? o.count : (g.isInstancedBufferGeometry && Number.isFinite(g.instanceCount) ? g.instanceCount : 1);
      let name = o.name || (o.material && o.material.name) || o.type, up = o.parent;
      for (let k = 0; k < 3 && up && up !== engine.scene; k++, up = up.parent) if (up.name) name = up.name + ' / ' + name;
      things.push({ name: name.slice(0, 90), triangles: Math.round(each * many), each: Math.round(each), places: many, layer: o.layers.mask, order: o.renderOrder, see: !!(o.material && o.material.transparent) });
    });
    things.sort((a, b) => b.triangles - a.triangles);
    // ---- how long the parts take
    const time = (fn, n = 60) => { const t = []; for (let i = 0; i < n; i++) { const t0 = now(); fn(); t.push(now() - t0); } t.sort((a, b) => a - b); return +t[n >> 1].toFixed(2); };
    const updateMs = time(() => engine.update(1 / 60));
    const renderMs = time(() => { engine.update(1 / 60); engine.render(); }) - updateMs;
    const allMs = time(() => { engine.update(1 / 60); engine.render(); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); });
    const sum = (k) => draws.reduce((a, d) => a + d[k], 0);
    await fetch('/__shot/' + params.get('census'), { method: 'POST', body: JSON.stringify({ area: inst.id, quality: engine.quality, size: [engine.width, engine.height, engine.pixelRatio],
      frame: { updateMs, renderMs: +renderMs.toFixed(2), allMs, calls: sum('calls'), triangles: sum('triangles') }, draws, inUpdate: afterUpdate,
      things: things.slice(0, 40), meshes: things.length, allTriangles: things.reduce((a, t) => a + t.triangles, 0), memory: engine.memoryReport(), waterMemory: engine.water.memoryReport ? engine.water.memoryReport().totalMB : null }, null, 1) });
    document.title = 'shot done';
    return;
  }
  // &handover=<name>.json: what crossing into each area costs, measured (docs/build/engine-open.md, "the hand-over").
  // From the area the address starts in, each following area is built, made ready as the ride makes it ready (a little
  // each frame, while the frames of the area the boat is in go on being drawn and timed), entered, and its first three
  // frames timed to the graphics card's last pixel. &prewarm=0 enters each one cold, as the ride did until 9 November.
  // Posts .shots/<name>.json: per area { build, the frames while it was made ready (their number, the longest, the usual),
  // activate, first, second, third } in milliseconds.
  if (params.has('handover')) {
    const gl = engine.renderer.getContext(), px = new Uint8Array(4), now = () => performance.now();
    const drawn = () => { engine.update(1 / 60); engine.render(); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); };
    const timed = (fn) => { const t = now(); fn(); return +(now() - t).toFixed(1); };
    const frame = () => new Promise((r) => requestAnimationFrame(r));
    const warmAhead = params.get('prewarm') !== '0', rows = [], last = Math.min(REALMS.length - 1, num('to', REALMS.length - 1));
    realms.prewarm = false; realms.lookAhead = false; engine.frozen = true;      // (the test drives the making-ready itself)
    for (let k = 0; k < 20; k++) drawn();
    for (let i = index + 1; i <= last; i++) {
      const row = { id: REALMS[i].id };
      // (the area is built while the frames of the one the boat is in go on: how long does a frame have to wait for the builder?)
      let t = now(), built = null, lastAt = now();
      const gaps = [];
      realms.ensure(i).then((inst) => { built = inst; }, () => { built = false; });
      while (built === null) { drawn(); await frame(); gaps.push(now() - lastAt); lastAt = now(); }
      const next = await realms.ensure(i);
      gaps.sort((a, b) => b - a);
      row.build = Math.round(now() - t); row.buildWaits = gaps.slice(0, 4).map((g) => Math.round(g)); row.buildFrames = gaps.length;
      const usual = []; for (let k = 0; k < 12; k++) usual.push(timed(drawn));
      usual.sort((a, b) => a - b); row.usual = usual[6];
      if (warmAhead) {
        const frames = [];
        t = now();
        while (!realms.rehearse(next, 3) && frames.length < 3000) { frames.push(timed(drawn)); await frame(); }
        row.ready = { frames: frames.length, seconds: +((now() - t) / 1000).toFixed(2), longest: frames.length ? Math.max(...frames) : 0, ...(next.rehearsed || {}) };
      }
      row.activate = timed(() => realms.activate(next, 2));
      row.first = timed(drawn); row.second = timed(drawn); row.third = timed(drawn);
      rows.push(row);
      for (let k = 0; k < 10; k++) { drawn(); await frame(); }
    }
    await fetch('/__shot/' + params.get('handover'), { method: 'POST', body: JSON.stringify(rows, null, 1) });
    document.title = 'shot done';
    return;
  }
  if (params.has('journey')) {
    // (&play= is for the place the address starts in: the landing's 'crossing' lets the boat go from its mooring. The
    //  last place has a moment of the same name, which ends the ride eighteen seconds on: a place built from here on
    //  is not told to play anything at once, or the whole ride's test would stop 56 m into the sky.)
    engine.devPlay = null;
    const name = (params.get('journey') || 'journey').replace(/[^\w-]/g, '') || 'journey';
    const log = { areas: [{ id: inst.def.id, at: 0 }], ended: false, seconds: 0, stood: [], pictures: 0 };
    const limit = num('limit', 1800), every = Math.max(5, num('every', 30));
    let t = 0, ended = false, held = 0, was = null;
    engine.on('ending', () => { ended = true; });
    engine.on('realm', (i) => { if (i && i.def && log.areas[log.areas.length - 1].id !== i.def.id) log.areas.push({ id: i.def.id, at: Math.round(t) }); });
    engine.frozen = false;
    const snap = async () => {
      engine.render(); engine.render();
      const blob = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', 0.85));
      await fetch(`/__shot/${name}_${String(log.pictures++).padStart(2, '0')}.jpg`, { method: 'POST', body: blob });
    };
    await snap();
    while (t < limit && !ended) {
      engine.simulate(1, 30); t += 1;
      if (realms.building.size || realms.holding) await realms.settled();
      const b = engine.boat, cur = realms.current, here = cur ? cur.def.id + ':' + Math.round(b.s / 2) : '';
      if (here === was) { held += 1; if (held === 40) log.stood.push({ id: cur.def.id, s: Math.round(b.s), at: Math.round(t) }); } else { held = 0; was = here; }
      if (t % every === 0) await snap();
    }
    if (ended) { engine.simulate(8, 30); t += 8; await snap(); }
    log.ended = ended; log.seconds = t; log.last = { id: realms.current && realms.current.def.id, s: Math.round(engine.boat.s) };
    await fetch('/__shot/' + name + '.json', { method: 'POST', body: JSON.stringify(log) });
    document.title = 'shot done';
    return;
  }
  if (shot) {
    engine.frozen = !params.has('drift');
    if (params.has('speed')) engine.devSpeed = num('speed', 0);       // hold this speed through the water (with &drift=1)
    await run(Math.min(60, num('t', 2)), 30);
    engine.simulate(0.2, 60);
    engine.render(); engine.render();                    // twice: the reflection target lags a frame behind new textures
    await new Promise((r) => requestAnimationFrame(r));
    const send = async (name) => {
      engine.render();
      const blob = await new Promise((r) => canvas.toBlob(r, name.endsWith('.jpg') ? 'image/jpeg' : 'image/png', 0.92));
      await fetch('/__shot/' + name, { method: 'POST', body: blob });
    };
    const frames = Math.min(24, Math.max(0, Math.round(num('frames', 0))));
    if (frames > 1) {                                     // a strip of frames in time: the only way to look at motion from a still tool
      const dt = Math.min(30, Math.max(0.02, num('dt', 0.5))), ext = shot.endsWith('.jpg') ? 'jpg' : 'png', base = shot.replace(/\.(png|jpg)$/, '');
      for (let i = 0; i < frames; i++) { if (i) await run(dt, 60); await send(`${base}_f${String(i).padStart(2, '0')}.${ext}`); }
      const cam = engine.camera, e = cam.matrixWorld.elements;      // where the horizon falls in the picture (0 = top), for the motion figures
      const fx = -e[8], fz = -e[10], fl = Math.hypot(fx, fz) || 1, ex = e[12] + fx / fl * 5000, ez = e[14] + fz / fl * 5000;
      const v = cam.matrixWorldInverse.elements, pr = cam.projectionMatrix.elements;
      const vy = v[1] * ex + v[9] * ez + v[13], vz = v[2] * ex + v[10] * ez + v[14];
      const horizon = Math.min(1, Math.max(0, (1 - (pr[5] * vy + pr[9] * vz) / -vz) / 2));
      await fetch('/__shot/' + base + '_frames.json', { method: 'POST', body: JSON.stringify({ frames, dt, horizon }) });
    } else await send(shot);
    document.title = 'shot done';
    return;
  }
  if (params.has('perf')) {                             // &perf=name.json : time 150 frames (update + render + gl.finish) and report
    engine.frozen = !params.has('drift');
    if (params.has('speed')) engine.devSpeed = num('speed', 0);
    await run(Math.min(60, num('t', 2)), 30);          // &t=20&play=show times a staged moment twenty seconds in
    const gl = engine.renderer.getContext(), times = [], px = new Uint8Array(4);
    // reading one pixel back is the only call that really waits for the GPU (gl.finish does not, in Chrome)
    for (let i = 0; i < 150; i++) { const t0 = performance.now(); engine.update(1 / 60); engine.render(); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); times.push(performance.now() - t0); }
    times.sort((a, b) => a - b);
    const info = engine.renderer.info;
    const out = { avgMs: +(times.reduce((a, b) => a + b, 0) / times.length).toFixed(2), medianMs: +times[75].toFixed(2), p95Ms: +times[142].toFixed(2), calls: info.render.calls, triangles: info.render.triangles, size: [engine.width, engine.height, engine.pixelRatio], memory: engine.memoryReport ? engine.memoryReport() : null,
      modules: (inst.state && inst.state.modules) || null, lights: inst.lights ? inst.lights.length : 0 };
    await fetch('/__shot/' + params.get('perf'), { method: 'POST', body: JSON.stringify(out) });
    document.title = 'perf done';
    return;
  }
  try {                                                  // sound is optional: the ride runs without it
    const mod = await import('./engine/audio.js');
    engine.audio = new mod.RideAudio(engine);
    engine.on('realm', (i) => engine.audio.setRealm(i.def.audio || {}, { id: i.id }));
    engine.audio.setRealm(inst.def.audio || {}, { id: inst.id, immediate: true });
  } catch (err) { console.info('no audio module:', err.message); }
  // The page's own first picture (index.html, "the opening") is told that everything the first place needs is in.
  // The title card takes its place a moment later (src/ui.js, showTitle); with no interface the ride is simply shown.
  // (And if the interface never says so, the still is not left lying over a ride that is running.)
  const opening = window.__opening && !window.__opening.over ? window.__opening : null;
  const ui = params.get('ui') === '0' ? null : (await again(() => import('./ui.js'), 'src/ui.js', unfetched).catch((err) => {
    if (opening && unfetched(err)) throw err;      // (a visitor without the interface has no way to begin: said on the opening card, not ridden without)
    console.info('no ui module:', err.message); return null;
  }));
  if (opening) opening.loaded();
  if (ui && ui.initUI) {
    ui.initUI(engine, { dev });
    if (opening) { const lift = () => { if (document.hidden) setTimeout(lift, 2000); else opening.done(600); }; setTimeout(lift, 6000); }
  } else { engine.input.enabled = true; engine.start(); if (opening) opening.done(900); }
}

main().catch((err) => {
  console.error(err);
  if (window.__opening && !window.__opening.over) { window.__opening.fail(err); return; }      // (said on the opening card, in words)
  document.title = 'error: ' + err.message;
  const p = document.createElement('p'); p.textContent = 'Could not start the ride: ' + err.message; p.style.cssText = 'position:fixed;left:24px;top:24px;font:16px system-ui;color:#f4efe6';
  document.body.appendChild(p);
});
