import * as THREE from 'three';
import { Track } from './track.js';
import { Colliders, Surface } from './collision.js';
import { buildWorld, ROAD_Y } from './world.js';
import { precinctInfo, buildShrine } from './shrine.js';
import { Birds } from './birds.js';
import { buildCar } from './carmodel.js';
import { Vehicle, CAR, collideCars } from './vehicle.js';
import { AIDriver } from './ai.js';
import { Particles, SkidMarks } from './effects.js';
import { GameAudio } from './audio.js';
import { Hud } from './hud.js';
import { clamp, wrapAngle } from './util.js';

const LAPS = 3;
const DRIVERS = [
  { name: 'Rustam', color: 0x1f6fe0, skill: 1.0, lane: -0.5, react: 0.16 },
  { name: 'Laila', color: 0x16a36c, skill: 0.955, lane: 0.6, react: 0.24 },
  { name: 'Timur', color: 0xf2b21a, skill: 0.91, lane: -0.2, react: 0.32 },
  { name: 'You', color: 0xd92b2b, player: true },
];

const canvas = document.getElementById('view');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.92;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(62, 1, 0.5, 5000);

const G = {
  state: 'loading', t: 0, raceTime: 0, countdown: 0, lastCount: 0, camMode: 0, paused: false,
  finishT: 0, autopilot: false, shake: 0, missed: false, missT: 0, wrongT: 0, hintT: 14, resultsT: 0,
  quality: { ratio: Math.min(window.devicePixelRatio || 1, 1), acc: 0, frames: 0, good: 0, shadows: true, tried: null, fails: 0, ceiling: 9, hold: 0 }, fps: 60,
};
let map, track, colliders, surface, world, shrine, birds, particles, skids, hud, env;
const cars = [];
let player = null;
const audio = new GameAudio();
const keys = {};
const cam = { yaw: 0, pos: new THREE.Vector3(), look: new THREE.Vector3(), fov: 62 };
const IDLE = { throttle: 0, brake: 0, steer: 0, handbrake: false };
const playerInput = { throttle: 0, brake: 0, steer: 0, handbrake: false };

function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setPixelRatio(G.quality.ratio);
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  if (particles) particles.uScale.value = (h * G.quality.ratio) / (2 * Math.tan((camera.fov * Math.PI) / 360));
}
window.addEventListener('resize', resize);

async function loadMap() {
  const res = await fetch('data/map.json');
  if (!res.ok) throw new Error(`data/map.json: HTTP ${res.status}`);
  const d = await res.json();
  const dec = (a, from = 0) => {
    const o = new Float32Array(a.length - from);
    for (let i = from; i < a.length; i++) o[i - from] = a[i] / 10;
    return o;
  };
  d.roads.forEach((r) => { r.pts = dec(r.p); });
  d.buildings = d.buildings.map((b) => ({ h: b[0] / 10, pts: dec(b, 1) }));
  d.greens.forEach((g) => { g.pts = dec(g.p); });
  d.shrine.pts = dec(d.shrine.p);
  d.track.center = dec(d.track.center);
  d.track.line = dec(d.track.line);
  return d;
}

const tick = () => new Promise((r) => setTimeout(r, 0));

async function boot() {
  const status = document.getElementById('status');
  const startBtn = document.getElementById('startBtn');
  resize();
  status.textContent = 'Loading the map of Mazar-i-Sharif…';
  map = await loadMap();
  status.textContent = `Building ${map.buildings.length.toLocaleString()} buildings and ${map.roads.length} streets…`;
  await tick();
  track = new Track(map.track);
  colliders = new Colliders(map.bounds);
  surface = new Surface(map.bounds, map.roads);
  const precinct = precinctInfo(map);
  world = buildWorld(scene, map, track, colliders, surface, precinct);
  await tick();
  status.textContent = 'Raising the shrine…';
  shrine = buildShrine(scene, map, colliders, precinct);
  colliders.build();
  birds = new Birds(scene, track, map, precinct);
  particles = new Particles(scene);
  skids = new SkidMarks(scene, ROAD_Y + 0.02);
  env = { colliders, surface, bounds: [map.bounds[0] - 30, map.bounds[1] - 30, map.bounds[2] + 30, map.bounds[3] + 30] };

  // sky reflections for the car paint and the tiled domes
  {
    const pm = new THREE.PMREMGenerator(renderer);
    const s2 = new THREE.Scene();
    s2.add(world.skyProcedural);
    scene.environment = pm.fromScene(s2, 0.03, 0.1, 1000).texture;
    pm.dispose();
    world.bakeSky(renderer);
  }

  DRIVERS.forEach((d, i) => {
    const c = new Vehicle(i, d.name, d.color, !!d.player);
    c.model = buildCar(d.color);
    scene.add(c.model.group);
    c.grid = i;
    c.driver = new AIDriver(c, track, d.player ? { skill: 0.86, lane: 0, react: 0 } : d);
    cars.push(c);
    if (d.player) player = c;
  });
  hud = new Hud(map, track, cars, LAPS);
  placeGrid();
  resize();
  status.textContent = 'Compiling shaders…';
  await tick();
  updateCamera(0.016);
  renderer.compile(scene, camera);
  renderer.render(scene, camera);

  G.state = 'menu';
  status.textContent = `${map.roads.length} real streets · ${map.buildings.length.toLocaleString()} real building footprints · lap ${(track.length / 1000).toFixed(2)} km`;
  startBtn.disabled = false;
  startBtn.textContent = 'START RACE';
  startBtn.addEventListener('click', startRace);
  document.getElementById('restartBtn').addEventListener('click', startRace);
  window.__game = { G, cars, track, player, world, colliders, surface, renderer, scene, camera, fastForward, startRace, audio };
  last = performance.now();
  requestAnimationFrame(frame);
}

// ------------------------------------------------------------------ race
function gridSlot(k) {
  const i = track.wrap(-Math.round((9 + k * 6.5) / track.step));
  const side = (k % 2 ? 1 : -1) * 2.7;
  return { x: track.cx[i] - track.tz[i] * side, z: track.cz[i] + track.tx[i] * side, psi: Math.atan2(track.tz[i], track.tx[i]), i };
}

function placeGrid() {
  const K = track.checkpoints.length;
  for (const c of cars) {
    const s = gridSlot(c.grid);
    c.place(s.x, s.z, s.psi);
    c.resetRace();
    c.ti = s.i;
    c.lastCp = K - 1;
    c.nextCp = 0;
    c.progress = -track.length + s.i * track.step;
    Object.assign(c.driver, { stuckT: 0, troubleT: 0, reverseT: 0, avoid: 0, wantsReset: false });
    c.syncModel(1, ROAD_Y);
  }
}

function startRace() {
  audio.init();
  hud.el.menu.classList.add('hidden');
  hud.hideFinish();
  hud.show(true);
  placeGrid();
  G.state = 'countdown';
  G.countdown = 0; G.lastCount = 0; G.raceTime = 0; G.finishT = 0; G.missed = false; G.wrongT = 0; G.hintT = 14;
  hud.warn('');
  hud.el.hint.classList.remove('hidden');
  cam.yaw = player.psi;
  snapCamera();
}

function resetToTrack(c, useCheckpoint) {
  let x, z, psi, i;
  if (useCheckpoint && c.lapCount === 0) {
    ({ x, z, psi, i } = gridSlot(c.grid));
  } else {
    i = useCheckpoint ? track.checkpoints[c.lastCp].i : c.ti;
    x = track.cx[i]; z = track.cz[i]; psi = Math.atan2(track.tz[i], track.tx[i]);
  }
  for (const o of cars) {
    if (o !== c && Math.hypot(o.x - x, o.z - z) < 4.5) { x += -track.tz[i] * 3; z += track.tx[i] * 3; }
  }
  c.place(x, z, psi);
  c.ti = i;
}

function updateRace(c) {
  const cps = track.checkpoints, K = cps.length, n = track.n;
  const cp = cps[c.nextCp];
  const d0 = (c.prevX - cp.x) * cp.tx + (c.prevZ - cp.z) * cp.tz;
  const d1 = (c.x - cp.x) * cp.tx + (c.z - cp.z) * cp.tz;
  if (d0 < 0 && d1 >= 0 && Math.abs(-(c.x - cp.x) * cp.tz + (c.z - cp.z) * cp.tx) < 21) {
    if (c.nextCp === 0) {
      if (c.lapCount > 0 && !c.finished) {
        c.lapTimes.push(G.raceTime - c.lapStart);
        c.lapStart = G.raceTime;
        if (c.lapTimes.length >= LAPS) {
          c.finished = true;
          c.finishTime = G.raceTime;
          if (c.isPlayer) onPlayerFinish();
        } else if (c.isPlayer) {
          audio.lap();
          hud.message(c.lapTimes.length === LAPS - 1 ? 'FINAL LAP' : `LAP ${c.lapTimes.length + 1}`, 'small', 2.2);
        }
      }
      c.lapCount++;
    } else if (c.isPlayer && !c.finished) audio.checkpoint();
    c.lastCp = c.nextCp;
    c.nextCp = (c.nextCp + 1) % K;
  }
  let ti = track.nearest(c.x, c.z, c.ti, 8, 26);
  const a = cps[c.lastCp].i, b = cps[c.nextCp].i;
  const span = ((b - a + n) % n) || n, rel = (ti - a + n) % n;
  if (rel > span) ti = rel - span < n - rel ? b : a;
  c.ti = ti;
  c.progress = (c.lapCount - 1) * track.length + ti * track.step;
}

function onPlayerFinish() {
  G.state = 'finished';
  G.finishT = 0;
  audio.finish();
  hud.message('FINISH!', 'go', 2.4);
  hud.warn('');
}

function raceOrder() {
  return [...cars].sort((a, b) => {
    if (a.finished && b.finished) return a.finishTime - b.finishTime;
    if (a.finished) return -1;
    if (b.finished) return 1;
    return b.progress - a.progress;
  });
}

function readInput() {
  const up = keys.ArrowUp || keys.KeyW, down = keys.ArrowDown || keys.KeyS;
  const left = keys.ArrowLeft || keys.KeyA, right = keys.ArrowRight || keys.KeyD;
  playerInput.throttle = up ? 1 : 0;
  playerInput.brake = down ? 1 : 0;
  playerInput.steer = (right ? 1 : 0) - (left ? 1 : 0);
  playerInput.handbrake = !!keys.Space;
}

// Game logic for one frame (physics in 120 Hz sub-steps).
function simulate(dt) {
  G.t += dt;
  if (G.state === 'countdown') {
    G.countdown += dt;
    const step = Math.floor(G.countdown - 0.8) + 1;      // 1,2,3 then 4 = go
    if (step !== G.lastCount && step >= 1) {
      G.lastCount = step;
      if (step <= 3) { hud.message(String(4 - step), 'count', 0.8); audio.countdown(false); }
      else { hud.message('GO!', 'go', 1.2); audio.countdown(true); G.state = 'racing'; G.raceTime = 0; }
    }
  }
  const racing = G.state === 'racing' || G.state === 'finished';
  const n = Math.max(1, Math.round(dt * 120)), h = dt / n;
  for (let s = 0; s < n; s++) {
    if (racing) G.raceTime += h;
    for (const c of cars) {
      let inp = IDLE;
      if (racing) {
        if (c === player && !G.autopilot && !c.finished) inp = playerInput;
        else {
          let bias = 0;
          if (c.finished) bias = -0.3;
          else if (c !== player && !player.finished) bias = clamp((player.progress - c.progress) / 260, -0.05, 0.06);
          inp = c.driver.control(h, cars, G.raceTime, bias);
          inp.power = c === player || c.finished ? 1 : 1 + clamp((player.progress - c.progress) / 500, -0.05, 0.1);
          if (c.driver.wantsReset) { resetToTrack(c, false); c.driver.troubleT = 0; c.driver.stuckT = 0; }
        }
      }
      c.step(h, inp, env);
    }
    for (let i = 0; i < cars.length; i++) for (let j = i + 1; j < cars.length; j++) {
      const hit = collideCars(cars[i], cars[j]);
      if (hit > 0) { cars[i].impactPeak = Math.max(cars[i].impactPeak, hit); cars[j].impactPeak = Math.max(cars[j].impactPeak, hit); }
    }
    if (racing) for (const c of cars) updateRace(c);
  }
}

function fastForward(seconds, autopilot = true) {
  const keep = G.autopilot;
  G.autopilot = autopilot;
  const steps = Math.round(seconds * 60);
  for (let i = 0; i < steps; i++) simulate(1 / 60);
  G.autopilot = keep;
  return { state: G.state, raceTime: G.raceTime, cars: cars.map((c) => ({ name: c.name, laps: c.lapTimes.slice(), lap: c.lapCount, cp: c.nextCp, prog: Math.round(c.progress), fin: c.finishTime, v: Math.round(c.speedAbs * 3.6) })) };
}

// ------------------------------------------------------------- presentation
function snapCamera() {
  cam.pos.set(player.x - Math.cos(cam.yaw) * 8, 3, player.z - Math.sin(cam.yaw) * 8);
  camera.position.copy(cam.pos);
}

const tmpV = new THREE.Vector3();
function updateCamera(dt) {
  const k = (r) => 1 - Math.exp(-r * dt);
  if (G.state === 'menu' || G.state === 'loading') {
    const a = G.t * 0.06 + 2.2;
    const c = shrine.center;
    camera.position.set(c.x + Math.cos(a) * 185, 46 + Math.sin(G.t * 0.11) * 8, c.z + Math.sin(a) * 185);
    camera.lookAt(c.x, 16, c.z);
    camera.fov = 50;
    camera.updateProjectionMatrix();
    world.updateShadow(tmpV.set(c.x, 0, c.z));
    return;
  }
  const p = player;
  const cs = Math.cos(p.psi), sn = Math.sin(p.psi);
  let fovT = 60 + 20 * clamp(p.speedAbs / CAR.maxSpeed, 0, 1) ** 1.3;
  if (G.state === 'finished') {
    G.finishT += dt;
    const a = p.psi + Math.PI * 0.75 + G.finishT * 0.3;
    tmpV.set(p.x + Math.cos(a) * 10.5, 3.4, p.z + Math.sin(a) * 10.5);
    cam.pos.lerp(tmpV, k(2.5));
    camera.position.copy(cam.pos);
    camera.lookAt(p.x, 1.0, p.z);
    fovT = 55;
  } else if (G.camMode === 2) {
    camera.position.set(p.x + cs * 0.15, ROAD_Y + 1.14, p.z + sn * 0.15);
    camera.lookAt(p.x + cs * 30, ROAD_Y + 0.75, p.z + sn * 30);
    cam.pos.copy(camera.position);
    cam.yaw = p.psi;
    fovT += 8;
  } else {
    let want = p.psi;
    if (p.speed > 5) want = p.psi + wrapAngle(Math.atan2(p.vz, p.vx) - p.psi) * 0.4;
    cam.yaw += wrapAngle(want - cam.yaw) * k(6);
    const cy = Math.cos(cam.yaw), sy = Math.sin(cam.yaw);
    if (G.camMode === 3) {
      tmpV.set(p.x - cy * 16, 62, p.z - sy * 16);
      cam.pos.lerp(tmpV, k(6));
      camera.position.copy(cam.pos);
      camera.lookAt(p.x + cy * 12, 0, p.z + sy * 12);
      fovT = 55;
    } else {
      let dist = G.camMode === 1 ? 12.5 : 7.8, height = G.camMode === 1 ? 5.0 : 3.0;
      const free = colliders.raycast(p.x, p.z, -cy, -sy, dist + 0.8) - 0.8;
      if (free < dist) { height += (dist - Math.max(free, 2.2)) * 0.3; dist = Math.max(free, 2.2); }
      tmpV.set(p.x - cy * dist, ROAD_Y + height, p.z - sy * dist);
      cam.pos.lerp(tmpV, k(14));
      camera.position.copy(cam.pos);
      if (G.shake > 0.001) {
        camera.position.x += (Math.random() - 0.5) * G.shake;
        camera.position.y += (Math.random() - 0.5) * G.shake * 0.6;
      }
      camera.lookAt(p.x + cs * 5.5, ROAD_Y + 1.25, p.z + sn * 5.5);
    }
  }
  G.shake *= Math.exp(-7 * dt);
  cam.fov += (fovT - cam.fov) * k(3);
  if (Math.abs(camera.fov - cam.fov) > 0.02) { camera.fov = cam.fov; camera.updateProjectionMatrix(); }
  world.updateShadow(tmpV.set(p.x + Math.cos(cam.yaw) * 38, 0, p.z + Math.sin(cam.yaw) * 38));
}

function carEffects(c, dt) {
  const cs = Math.cos(c.psi), sn = Math.sin(c.psi);
  const sliding = !c.offroad && c.speedAbs > 6 && (c.slip > 3 || c.handbrake);
  for (const s of [1, -1]) {
    const wx = c.x - cs * 1.3 - sn * 0.84 * s, wz = c.z - sn * 1.3 + cs * 0.84 * s;
    skids.track(c.index * 2 + (s > 0 ? 0 : 1), sliding, wx, wz);
    if (sliding && Math.random() < dt * 36) {
      particles.emit(wx, 0.35, wz, c.vx * 0.2 + (Math.random() - 0.5) * 2, 0.8 + Math.random(), c.vz * 0.2 + (Math.random() - 0.5) * 2,
        1.6, 0.9 + Math.random() * 0.5, 0.86, 0.84, 0.82, 0.3, 2.4);
    }
    if (c.offroad && c.speedAbs > 4 && Math.random() < dt * 30) {
      particles.emit(wx, 0.3, wz, c.vx * 0.25 + (Math.random() - 0.5) * 3, 1 + Math.random() * 1.5, c.vz * 0.25 + (Math.random() - 0.5) * 3,
        1.8, 1.1 + Math.random() * 0.6, 0.74, 0.62, 0.46, 0.36, 2.6);
    }
  }
  if (c.impactPeak > 3.5) {
    const cnt = Math.min(14, 3 + c.impactPeak);
    for (let i = 0; i < cnt; i++) {
      particles.emit(c.x + cs * 1.6 + (Math.random() - 0.5), 0.5 + Math.random() * 0.5, c.z + sn * 1.6 + (Math.random() - 0.5),
        (Math.random() - 0.5) * 12, 2 + Math.random() * 5, (Math.random() - 0.5) * 12, 0.28, 0.35 + Math.random() * 0.3, 1.0, 0.75, 0.3, 1.0, 0);
    }
  }
}

let crashCooldown = 0;
function present(dt) {
  const racing = G.state === 'racing' || G.state === 'finished';
  for (const c of cars) {
    c.syncModel(dt, ROAD_Y);
    carEffects(c, dt);
  }
  // crash sound + camera shake for the player
  crashCooldown -= dt;
  if (player.impactPeak > 2.2 && crashCooldown <= 0) {
    audio.crash(player.impactPeak);
    G.shake = Math.min(0.5, G.shake + player.impactPeak * 0.025);
    crashCooldown = 0.18;
  }
  for (const c of cars) c.impactPeak = 0;
  if (player.offroad && player.speedAbs > 8) G.shake = Math.max(G.shake, 0.05);
  if (G.state === 'countdown') {       // let the engine be revved on the grid
    const t = playerInput.throttle ? 0.8 : 0.2;
    player.rpm += (t - player.rpm) * Math.min(1, 6 * dt);
    player.throttle = playerInput.throttle;
  }

  updateCamera(dt);
  world.update(G.t, camera);
  birds.update(G.t, dt, cars);
  particles.update(dt);

  if (G.state !== 'menu' && G.state !== 'loading') {
    const order = raceOrder();
    const cps = track.checkpoints;
    const showGates = G.state !== 'finished';
    world.setGate(0, showGates ? cps[player.nextCp] : null);
    world.setGate(1, showGates ? cps[(player.nextCp + 1) % cps.length] : null);
    hud.update(dt, { player, order, raceTime: G.raceTime, nextCp: showGates ? cps[player.nextCp] : null });

    if (G.state === 'racing') {
      // wrong way / missed checkpoint help
      const along = player.vx * track.tx[player.ti] + player.vz * track.tz[player.ti];
      G.wrongT = along < -4 ? G.wrongT + dt : 0;
      G.missT -= dt;
      if (G.missT <= 0) {
        G.missT = 0.4;
        const n = track.n, gi = track.nearestGlobal(player.x, player.z);
        const a = cps[player.lastCp].i, b = cps[player.nextCp].i;
        const span = ((b - a + n) % n) || n, rel = (gi - a + n) % n;
        const near = Math.hypot(player.x - track.cx[gi], player.z - track.cz[gi]) < 22;
        G.missed = near && rel > span + 12 && rel < span + n / 2;
      }
      hud.warn(G.wrongT > 1.2 ? 'WRONG WAY' : G.missed ? 'MISSED CHECKPOINT - PRESS R' : '');
      if (G.hintT > 0) { G.hintT -= dt; if (G.hintT <= 0) hud.el.hint.classList.add('hidden'); }
    }
    if (G.state === 'finished') {
      G.resultsT -= dt;
      if (G.finishT > 2.4 && hud.el.finish.classList.contains('hidden')) hud.showFinish(order, player, LAPS);
      if (G.resultsT <= 0) { G.resultsT = 0.25; hud.updateFinish(order, player); }
    }
  }
  const rivals = cars.filter((c) => c !== player);
  audio.update(player, rivals, { x: camera.position.x, z: camera.position.z, rx: -Math.sin(cam.yaw), rz: Math.cos(cam.yaw) }, racing || G.state === 'countdown');
}

// Keep the frame rate up on slower machines by lowering the render resolution
// (and, as a last resort, switching the shadows off). Each change is checked
// afterwards: if it did not help - e.g. the browser itself caps the frame
// rate - it is undone, so quality is never thrown away for nothing.
function adaptQuality(dt) {
  const q = G.quality;
  q.acc += dt; q.frames++;
  if (q.acc < 1.5) return;
  const fps = q.frames / q.acc;
  G.fps = fps;
  q.acc = 0; q.frames = 0;
  q.hold -= 1;
  const maxRatio = Math.min(window.devicePixelRatio || 1, 1.5);
  const setShadows = (on) => { q.shadows = on; world.sun.castShadow = on; };
  if (q.tried) {
    const t = q.tried;
    q.tried = null;
    if (t.kind === 'down' && fps < t.fps * 1.08) {          // lowering did not help: undo
      q.ratio = t.ratio; setShadows(t.shadows); resize();
      q.fails++; q.hold = q.fails >= 2 ? 1e9 : 14;
    } else if (t.kind === 'up' && fps < 55) {                 // raising cost too much: undo
      q.ratio = t.ratio; resize();
      q.ceiling = t.ratio; q.hold = 6;
    }
  } else if (q.hold <= 0 && G.state !== 'menu') {
    if (fps < 50) {
      const before = { kind: 'down', fps, ratio: q.ratio, shadows: q.shadows };
      if (q.ratio > 0.62) { q.ratio = Math.max(0.6, q.ratio - (fps < 38 ? 0.2 : 0.1)); q.tried = before; resize(); }
      else if (q.shadows && fps < 45) { setShadows(false); q.tried = before; }
      q.good = 0;
    } else if (fps > 58.5) {
      if (++q.good >= 3 && q.ratio < Math.min(maxRatio, q.ceiling) - 0.01) {
        q.tried = { kind: 'up', fps, ratio: q.ratio };
        q.ratio = Math.min(maxRatio, q.ratio + 0.1); q.good = 0; resize();
      }
    } else q.good = 0;
  }
  const f = hud.el.fps;
  if (!f.classList.contains('hidden')) {
    const info = renderer.info.render;
    f.textContent = `${fps.toFixed(0)} fps · ${info.calls} draws · ${(info.triangles / 1000).toFixed(0)}k tris · scale ${q.ratio.toFixed(2)}${q.shadows ? '' : ' · no shadows'}`;
  }
}

let last = 0;
function frame(now) {
  requestAnimationFrame(frame);
  const raw = (now - last) / 1000;
  last = now;
  if (G.paused) return;
  const dt = Math.min(0.05, Math.max(0.001, raw));
  readInput();
  simulate(dt);
  present(dt);
  renderer.render(scene, camera);
  if (raw < 0.2) adaptQuality(raw);
}

// ------------------------------------------------------------------ input
function setPaused(on) {
  if (G.state !== 'racing' && G.state !== 'countdown') on = false;
  G.paused = on;
  hud.el.pause.classList.toggle('hidden', !on);
  if (audio.ctx) { if (on) audio.ctx.suspend(); else audio.ctx.resume(); }
  last = performance.now();
}

window.addEventListener('keydown', (e) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
  if (e.repeat) return;
  keys[e.code] = true;
  if (G.state === 'loading') return;
  switch (e.code) {
    case 'KeyC': G.camMode = (G.camMode + 1) % 4; break;
    case 'KeyR':
      if (G.state === 'racing' && !G.paused) { resetToTrack(player, true); cam.yaw = player.psi; snapCamera(); G.missed = false; }
      break;
    case 'KeyM': hud.message(audio.toggleMute() ? 'SOUND OFF' : 'SOUND ON', 'small', 0.9); break;
    case 'KeyP': case 'Escape': setPaused(!G.paused); break;
    case 'KeyF': hud.el.fps.classList.toggle('hidden'); break;
    case 'Enter':
      if (G.state === 'menu' || (G.state === 'finished' && !hud.el.finish.classList.contains('hidden'))) startRace();
      break;
    default:
  }
});
window.addEventListener('keyup', (e) => { keys[e.code] = false; });
window.addEventListener('blur', () => { for (const k of Object.keys(keys)) keys[k] = false; });
document.addEventListener('visibilitychange', () => { if (document.hidden && G.state === 'racing') setPaused(true); });

boot().catch((err) => {
  console.error(err);
  document.getElementById('status').textContent = `Could not start: ${err.message}. Serve this folder with "python -m http.server" and open http://localhost:8000/`;
});
