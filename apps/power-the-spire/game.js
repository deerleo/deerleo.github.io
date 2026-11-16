// Power the Spire: a small game played on the finished world.
// Drive a glowing orb around the floating island and collect the 8 energy orbs; each one switches on more of
// the city, the last one powers the spire. The simulation runs in fixed 1/60 s steps and depends only on the
// orb layout (made from one seed) and the keys held in each step, so a recorded run replays exactly.
const STEP = 1 / 60, WORLD_T = 34;                 // the world's clock starts after the film has finished building it
const FWD = 1, BACK = 2, LEFT = 4, RIGHT = 8;
const KEYS = { KeyW: FWD, ArrowUp: FWD, KeyS: BACK, ArrowDown: BACK, KeyA: LEFT, ArrowLeft: LEFT, KeyD: RIGHT, ArrowRight: RIGHT };
const MAX_SPEED = 17, TURN = 2.5, REACH = 2.4, ORBS = 8, START = [0, 22];
const RADIUS = 0.24;      // collision radius: buildings stand at least 0.5 apart, so every gap between them can be driven through
const FIXED_SPOTS = [[22, 135], [22, 200], [22, 285], [22, 30], [38, 60], [38, 165], [46, 250], [46, 335]];   // version 1 replays: ring radius, degrees
const MUSIC_LEVEL = 0.07;                           // the ambience sits well below the effects (0.2-0.3) and any voice-over

function mulberry32(seed) {                         // seeded random numbers: one seed, one orb layout
  return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

export async function createGame(world) {
  const { THREE, scene, camera, renderer, stage, terrainHeight, edgeRadius, towers, smooth } = world;
  const $ = id => document.getElementById(id);
  const hud = { score: $('score'), scoreval: $('scoreval'), time: $('time'), win: $('win'), wintime: $('wintime'), hint: $('hint'), music: $('musicbtn'), sfx: $('sfxbtn') };
  const inTower = (x, z, pad) => towers.some(tw => Math.hypot(x - tw.x, z - tw.z) < tw.radius + pad);

  // ---------- things added to the world ----------
  const player = new THREE.Group();
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.7, 2), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.4, 0.85, 1.9), fog: false }));
  const hoop = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.07, 8, 48), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.9, 0.4, 1.9), fog: false }));
  const lamp = new THREE.PointLight(0x7fb4ff, 35, 22, 2); lamp.position.y = 1;
  player.add(core, hoop, lamp); scene.add(player);

  const orbGeo = new THREE.OctahedronGeometry(0.95), orbMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.45, 1.0, 1.6), fog: false });
  const pillarGeo = new THREE.CylinderGeometry(0.1, 0.1, 16, 6, 1, true).translate(0, 8, 0);
  const pillarMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.1, 0.3, 0.55), fog: false, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const orbs = Array.from({ length: ORBS }, () => {
    const gem = new THREE.Mesh(orbGeo, orbMat), pillar = new THREE.Mesh(pillarGeo, pillarMat), group = new THREE.Group();
    group.add(gem, pillar); scene.add(group);
    return { x: 0, z: 0, group, gem, pillar, taken: -1 };
  });

  // Where the 8 orbs go. Every spot is clear of the buildings and the spire, inside the island's edge, away from
  // the start, and well apart from the other orbs; the spacing is relaxed only if a layout cannot be completed.
  function layout(seed) {
    if (seed == null) return FIXED_SPOTS.map(([r, deg]) => {
      while (inTower(Math.cos(deg * Math.PI / 180) * r, Math.sin(deg * Math.PI / 180) * r, REACH)) deg += 4;
      return [Math.cos(deg * Math.PI / 180) * r, Math.sin(deg * Math.PI / 180) * r];
    });
    const rand = mulberry32(seed);
    for (let gap = 16; ; gap--) {
      const spots = [];
      for (let tries = 0; tries < 600 && spots.length < ORBS; tries++) {
        const a = rand() * Math.PI * 2, r = 6 + Math.sqrt(rand()) * (edgeRadius(a) - 10.5), x = Math.cos(a) * r, z = Math.sin(a) * r;
        if (inTower(x, z, 1.5) || Math.hypot(x - START[0], z - START[1]) < 12 || spots.some(p => Math.hypot(p[0] - x, p[1] - z) < gap)) continue;
        spots.push([x, z]);
      }
      if (spots.length === ORBS) return spots;
    }
  }

  // ---------- state and one simulation step ----------
  const s = {};
  const cam = new THREE.Vector3(), look = new THREE.Vector3(), want = new THREE.Vector3();
  function chase(out) {                                     // camera behind and above the player
    const cx = Math.cos(s.camH), cz = Math.sin(s.camH);
    out.set(s.x - cx * 12, 0, s.z - cz * 12);
    out.y = Math.max(s.y + 6, terrainHeight(out.x, out.z) + 3);
    for (const tw of towers) if (Math.hypot(out.x - tw.x, out.z - tw.z) < tw.radius + 1.2) out.y = Math.max(out.y, tw.h + 2);   // never inside a building
    return out;
  }
  // A new game. Without arguments the orbs get a fresh random layout; a replay passes its own seed (and exact spots).
  function reset(seed = Math.random() * 2 ** 32 >>> 0, spots = layout(seed)) {
    Object.assign(s, { seed, x: START[0], z: START[1], h: Math.PI, v: 0, camH: Math.PI, tick: 0, steps: 0, after: 0, score: 0, power: 0, flash: 0,
      started: false, won: false, time: 0, bumps: 0, log: [] });
    s.y = terrainHeight(s.x, s.z) + 1.2;
    orbs.forEach((o, i) => { [o.x, o.z] = spots[i]; o.taken = -1; o.group.position.set(o.x, terrainHeight(o.x, o.z) + 1.6, o.z); });
    chase(cam); shownScore = 0;
  }
  function step(bits) {
    s.tick++;
    if (!s.started) { if (!bits) return; s.started = true; }
    if (s.won) { bits = 0; s.after++; } else { s.log.push(bits); s.steps++; }

    s.h += (!!(bits & RIGHT) - !!(bits & LEFT)) * TURN * STEP;
    s.v += ((!!(bits & FWD) - 0.5 * !!(bits & BACK)) * MAX_SPEED - s.v) * 4 * STEP;
    let x = s.x + Math.cos(s.h) * s.v * STEP, z = s.z + Math.sin(s.h) * s.v * STEP;
    const push = (ox, oz, min) => {                         // slide around round obstacles
      const d = Math.hypot(x - ox, z - oz);
      if (d < min) { x = ox + (x - ox) / d * min; z = oz + (z - oz) / d * min; s.v *= 0.97; s.bumps++; }
    };
    for (let pass = 0; pass < 2; pass++) {
      for (const tw of towers) push(tw.x, tw.z, tw.radius + RADIUS);
      push(0, 0, 3.4 + RADIUS);                             // the spire
    }
    if (inTower(x, z, RADIUS - 0.001)) { x = s.x; z = s.z; s.v = 0; }   // wedged between two buildings: stay put
    const r = Math.hypot(x, z), edge = edgeRadius(Math.atan2(z, x)) - 2.5;
    if (r > edge) { x *= edge / r; z *= edge / r; s.v *= 0.97; }   // the island's edge
    s.x = x; s.z = z;
    s.y += (terrainHeight(x, z) + 1.2 - s.y) * 12 * STEP;

    if (!s.won) for (const o of orbs) if (o.taken < 0 && Math.hypot(o.x - x, o.z - z) < REACH) {
      o.taken = s.steps; s.score++; s.flash = 1;
      if (s.score === ORBS) {
        s.won = true; s.time = s.steps * STEP;
        lastWin = { game: 'power-the-spire', version: 2, stepsPerSecond: 60, seed: s.seed, orbs: orbs.map(o => [o.x, o.z]), taken: orbs.map(o => o.taken),
          steps: s.steps, time: +s.time.toFixed(3), log: s.log.map(b => b.toString(16)).join('') };
      }
    }
    s.power += (s.score / ORBS - s.power) * 3 * STEP;
    s.flash *= 1 - 3 * STEP;

    // camera: chase the player; after the win, pull back and circle the powered city
    s.camH += (s.h - s.camH) * 5 * STEP;
    chase(want);
    if (s.won) {
      const a = Math.atan2(s.z, s.x) + s.after * STEP * 0.22, k = smooth(0, 3, s.after * STEP);
      want.lerp(look.set(Math.cos(a) * 74, 36, Math.sin(a) * 74), k);
    }
    cam.lerp(want, 8 * STEP);
  }

  // ---------- sound: synthesised with Web Audio, and silent until the first key or touch ----------
  const audio = { ctx: null, music: true, sfx: true, pickups: 0, wins: 0, peak: () => 0 };
  let musicGain, sfxGain, nextBell = 0;
  function unlock() {
    if (audio.ctx) { audio.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    const ctx = audio.ctx = new AC(), out = ctx.createDynamicsCompressor(), meter = ctx.createAnalyser(), buf = new Float32Array(meter.fftSize);
    out.connect(meter); meter.connect(ctx.destination);
    audio.peak = () => { meter.getFloatTimeDomainData(buf); return buf.reduce((m, v) => Math.max(m, Math.abs(v)), 0); };
    musicGain = ctx.createGain(); sfxGain = ctx.createGain(); musicGain.connect(out); sfxGain.connect(out);
    musicGain.gain.value = audio.music ? MUSIC_LEVEL : 0; sfxGain.gain.value = audio.sfx ? 1 : 0;
    // ambience: a low, slowly breathing chord (A, A, E, A) behind a lowpass filter that drifts open and shut
    const filter = ctx.createBiquadFilter(), sweep = ctx.createOscillator(), depth = ctx.createGain();
    filter.type = 'lowpass'; filter.frequency.value = 420; filter.connect(musicGain);
    sweep.frequency.value = 0.06; depth.gain.value = 220; sweep.connect(depth); depth.connect(filter.frequency); sweep.start();
    for (const [freq, type, level] of [[55, 'sine', 0.5], [110, 'sawtooth', 0.12], [110.6, 'sawtooth', 0.12], [164.8, 'triangle', 0.2], [220.9, 'triangle', 0.12]]) {
      const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.value = freq; g.gain.value = level; o.connect(g); g.connect(filter); o.start();
    }
  }
  function tone(to, freq, at, length, level, type = 'sine', slideTo = freq) {   // one note with a soft attack and a fading tail
    const o = audio.ctx.createOscillator(), g = audio.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, at); o.frequency.exponentialRampToValueAtTime(slideTo, at + length);
    g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(level, at + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, at + length);
    o.connect(g); g.connect(to); o.start(at); o.stop(at + length + 0.05);
  }
  function collected(score) {
    if (!audio.ctx || !audio.sfx) return;
    const now = audio.ctx.currentTime;
    if (score < ORBS) {                                     // pickup: two quick notes, a step higher with every orb
      const f = 587 * 2 ** ([0, 2, 4, 7, 9, 12, 14][score - 1] / 12);
      tone(sfxGain, f, now, 0.16, 0.22, 'triangle'); tone(sfxGain, f * 1.5, now + 0.07, 0.24, 0.18);
      audio.pickups++;
    } else {                                                // the last orb: a rising chord over a deep swell
      [440, 554.4, 659.3, 880, 1108.7].forEach((f, i) => tone(sfxGain, f, now + i * 0.09, 1.5, 0.2, 'triangle'));
      tone(sfxGain, 110, now, 2.2, 0.3, 'sine', 55); tone(sfxGain, 220, now, 0.5, 0.1, 'sine', 1760);
      audio.wins++;
    }
  }
  function toggle(kind) {
    audio[kind] = !audio[kind];
    if (audio.ctx) (kind === 'music' ? musicGain : sfxGain).gain.setTargetAtTime(audio[kind] ? (kind === 'music' ? MUSIC_LEVEL : 1) : 0, audio.ctx.currentTime, 0.03);
    hud.music.textContent = `M  music ${audio.music ? 'on' : 'off'}`; hud.sfx.textContent = `N  sound ${audio.sfx ? 'on' : 'off'}`;
  }

  // ---------- drawing ----------
  let shownScore = 0, shownTime = '';
  function draw() {
    const t = WORLD_T + s.tick * STEP, afterT = s.after * STEP;
    world.drawWorld(t, s.power, 0.35 * s.flash + (s.won ? Math.exp(-afterT * 0.8) : 0));
    player.position.set(s.x, s.y + 0.15 * Math.sin(t * 3), s.z);
    hoop.rotation.set(Math.PI / 2 + 0.5 * Math.sin(t * 2.1), t * 1.6, 0);
    core.scale.setScalar(1 + 0.5 * s.flash);
    for (const o of orbs) {
      const k = o.taken < 0 ? 0 : (s.steps + s.after - o.taken) * STEP / 0.35;      // collected: burst and vanish
      o.group.visible = k < 1;
      o.gem.rotation.y = t * 1.8; o.gem.position.y = 0.3 * Math.sin(t * 2 + o.x);
      o.gem.scale.setScalar(1 + 2.2 * k); o.pillar.scale.set(1 + 5 * k, 1 - k, 1 + 5 * k);
    }
    const k = s.won ? smooth(0, 3, afterT) : 0;
    look.set(s.x + Math.cos(s.camH) * 5, s.y + 1.2, s.z + Math.sin(s.camH) * 5).lerp(want.set(0, 15, 0), k);
    camera.position.copy(cam); camera.lookAt(look);
    world.render();

    if (s.score === shownScore + 1) collected(s.score);     // exactly one new orb since the last frame
    shownScore = s.score; hud.scoreval.textContent = `${s.score} / ${ORBS}`;
    if (audio.ctx && audio.music && audio.ctx.currentTime > nextBell) {             // ambience: a soft bell now and then
      const now = audio.ctx.currentTime;
      tone(musicGain, 440 * 2 ** ([0, 3, 7, 10, 12, 15, 19][Math.random() * 7 | 0] / 12), now, 3.2, 0.5);
      nextBell = now + 2.5 + Math.random() * 3;
    }
    const time = (s.won ? s.time : s.steps * STEP).toFixed(1) + ' s';
    if (time !== shownTime) { shownTime = time; hud.time.textContent = time; hud.wintime.textContent = time; }
    hud.score.style.opacity = hud.time.style.opacity = 1;
    hud.score.className = 'hud' + (s.flash > 0.4 ? ' pop' : '');
    hud.score.style.transform = `scale(${1 + 0.18 * s.flash})`; hud.score.style.transformOrigin = '0 50%';
    const w = s.won ? smooth(0.3, 1.0, afterT) : 0;
    hud.win.style.opacity = w; hud.win.style.transform = `translateY(${(1 - w) * 30}px)`;
    hud.hint.style.opacity = 1;
    hud.hint.textContent = replay ? 'replay of a recorded run' : s.won ? 'R  play again   ·   P  save replay'
      : s.started ? 'collect all 8 orbs to power the spire' : 'W / ↑ drive   ·   A D / ← → steer   ·   R restart';
  }

  // ---------- input: keyboard, plus hold-to-drive for touch (left / right third of the screen steers) ----------
  let held = 0, touch = 0, lastWin = null;
  const replay = world.replayUrl ? await (await fetch(world.replayUrl)).json() : null;
  const replayBits = replay && [...replay.log].map(c => parseInt(c, 16));
  const query = new URLSearchParams(location.search);
  const fixedSeed = query.has('seed') ? Number(query.get('seed')) >>> 0 : null;        // ?seed=N: always this orb layout
  const capture = query.has('capture');                                                // ?capture: no live loop, frames are drawn with seek()
  const newGame = () => replay ? reset(replay.seed ?? null, replay.orbs)               // a version 1 replay has no seed: the fixed layout
    : fixedSeed == null ? reset() : reset(fixedSeed);
  addEventListener('keydown', e => {
    unlock();
    if (KEYS[e.code]) { held |= KEYS[e.code]; e.preventDefault(); }
    else if (e.repeat) return;
    else if (e.code === 'KeyR') newGame();
    else if (e.code === 'KeyM') toggle('music');
    else if (e.code === 'KeyN') toggle('sfx');
    else if (e.code === 'KeyP' && lastWin) {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([JSON.stringify(lastWin)], { type: 'application/json' })); a.download = 'replay.json'; a.click();
    }
  });
  addEventListener('keyup', e => { if (KEYS[e.code]) held &= ~KEYS[e.code]; });
  addEventListener('blur', () => { held = touch = 0; });
  const steer = e => { unlock(); const box = stage.getBoundingClientRect(), u = (e.clientX - box.left) / box.width; touch = FWD | (u < 0.36 ? LEFT : u > 0.64 ? RIGHT : 0); };
  stage.addEventListener('pointerdown', steer);
  stage.addEventListener('pointermove', e => { if (touch) steer(e); });
  for (const type of ['pointerup', 'pointercancel', 'pointerleave']) stage.addEventListener(type, () => { touch = 0; });
  for (const kind of ['music', 'sfx']) hud[kind].addEventListener('pointerdown', e => { e.stopPropagation(); unlock(); toggle(kind); });

  // ---------- main loop: fixed simulation steps, one drawn frame per display frame ----------
  newGame();
  let last = performance.now(), acc = 0, frames = 0, fpsFrom = last;
  if (!capture) renderer.setAnimationLoop(now => {
    acc += Math.min(0.1, (now - last) / 1000); last = now;
    for (; acc >= STEP; acc -= STEP) step(replay ? (replayBits[s.steps] ?? 0) : held | touch);
    draw();
    if (++frames === 120) { window.liveFps = +(120000 / (now - fpsFrom)).toFixed(1); frames = 0; fpsFrom = now; }
  });

  // Frame-by-frame capture of a replay: run the simulation to exactly `steps` steps (from the start again when going
  // back) and draw that moment. Only the recorded keys are used, never the keyboard. Video frame f at 30 fps is seek(2 * f).
  function seek(steps) {
    if (steps < s.tick) newGame();
    while (s.tick < steps) step(replayBits ? (replayBits[s.steps] ?? 0) : 0);
    draw();
  }

  // Re-run a saved run through the simulation alone (no drawing, no sound); used to check that replays are exact.
  function playLog(run) {
    reset(run.seed ?? null, run.orbs); for (const c of run.log) step(parseInt(c, 16));
    shownScore = s.score;
    return { won: s.won, score: s.score, steps: s.steps, time: +s.time.toFixed(3), taken: orbs.map(o => o.taken) };
  }
  return { state: s, orbs, towers, audio, step, reset, layout, playLog, seek, get lastWin() { return lastWin; }, RADIUS, REACH };
}
