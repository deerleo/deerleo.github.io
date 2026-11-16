// The merge tray close-up: a small 3D board of polyhedra rendered with its own three.js scene.
import * as THREE from 'three';
import { el, sfx, symbolSVG, shapeSVG } from './ui.js';
import { SYMBOLS } from './symbols.js';
import { TIERS, TIER_COLORS, slide, solveMerge } from './mergepuzzle.js';
import { shapeGeometry } from './props.js';

const KEYDIR = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right' };

// st: persistent { pieces, history }.  owned: indexes of socket pieces the player has found.
export function mergeUI(lock, st, owned, onSolve) {
  const board = lock.board;
  const missing = board.pieces.filter((p, i) => p.s && !owned.has(i));
  const ready = !missing.length;
  if (!st.pieces || !st.ready) { st.pieces = board.pieces.map((p) => ({ x: p.x, y: p.y, t: p.t })); st.history = []; }
  st.ready = ready;
  let sel = -1, busy = false, raf = 0, hintMove = null;

  const root = el('div', { class: 'lockui merge', tabindex: 0, autofocus: true });
  const canvas = el('canvas', { class: 'tray', width: 560, height: 400 });
  const msg = el('p', { class: 'msg' });
  const ladder = el('div', { class: 'ladder', html: TIERS.slice(1).map((n, i) => `<span class="${i + 1 === board.target ? 'goal' : ''}" title="${n}">${shapeSVG(i + 1, 26)}</span>`).join('<i>›</i>') });

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(36, 560 / 430, 0.1, 50);
  cam.aspect = 560 / 400;
  const span = Math.max(board.w, board.h);
  cam.position.set(0, span * 1.5, span * 1.02); cam.lookAt(0, 0, 0.12); cam.updateProjectionMatrix();
  scene.add(new THREE.HemisphereLight(0xfff4e0, 0x54463a, 1.5));
  const sun = new THREE.DirectionalLight(0xffffff, 2.2); sun.position.set(2, 6, 3); scene.add(sun);
  const P = (x, y) => new THREE.Vector3(x - (board.w - 1) / 2, 0, y - (board.h - 1) / 2);
  const felt = new THREE.MeshStandardMaterial({ color: 0x2f5548, roughness: 1 }), feltB = new THREE.MeshStandardMaterial({ color: 0x356052, roughness: 1 });
  const frame = new THREE.Mesh(new THREE.BoxGeometry(board.w + 0.5, 0.3, board.h + 0.5), new THREE.MeshStandardMaterial({ color: 0x5e3b22, roughness: 0.6 })); frame.position.y = -0.2; scene.add(frame);
  const tiles = [];
  for (let y = 0; y < board.h; y++) for (let x = 0; x < board.w; x++) {
    const wall = board.walls.some((w) => w[0] === x && w[1] === y);
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.94, wall ? 0.7 : 0.08, 0.94), wall ? new THREE.MeshStandardMaterial({ color: 0x8a6a3a, roughness: 0.5, metalness: 0.4 }) : (x + y) % 2 ? felt : feltB);
    m.position.copy(P(x, y)); m.position.y = wall ? 0.3 : -0.04; scene.add(m);
    if (!wall) tiles.push(m);
  }
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.035, 8, 32), new THREE.MeshBasicMaterial({ color: 0xffe08a })); ring.rotation.x = Math.PI / 2; ring.visible = false; scene.add(ring);
  const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.4, 12), new THREE.MeshBasicMaterial({ color: 0x7fe0ff })); arrow.visible = false; scene.add(arrow);

  let meshes = [];
  const mat = (t, ghost) => new THREE.MeshStandardMaterial({ color: TIER_COLORS[t], roughness: 0.45, flatShading: t < 6, transparent: ghost, opacity: ghost ? 0.28 : 1 });
  function rebuild() {
    meshes.forEach((m) => { scene.remove(m); m.geometry.dispose(); m.material.dispose(); });
    meshes = st.pieces.map((p, i) => {
      const ghost = !ready && board.pieces[i] && board.pieces[i].s && !owned.has(i);
      const m = new THREE.Mesh(shapeGeometry(p.t, 0.4), mat(p.t, ghost));
      m.position.copy(P(p.x, p.y)); m.position.y = 0.42; m.userData.i = i; m.rotation.set(0.4, i, 0.2);
      scene.add(m); return m;
    });
  }
  function status() {
    if (!ready) { msg.textContent = `The tray is locked: ${missing.length} hollow${missing.length > 1 ? 's are' : ' is'} empty. Still to find: ${missing.map((p) => TIERS[p.t].toLowerCase()).join(', ')}.`; return; }
    msg.textContent = sel < 0 ? `Click a solid, then slide it with the arrows. Two identical solids fuse. Goal: a single ${TIERS[board.target].toLowerCase()}.` : `${TIERS[st.pieces[sel].t]} selected. Slide it with the arrow keys or buttons.`;
  }
  function select(i) { sel = i; hintMove = null; status(); }
  function finish() { busy = true; msg.textContent = `Click! The ${TIERS[board.target].toLowerCase()} drops into place and the cabinet unlocks.`; setTimeout(onSolve, 900); }
  function move(dir) {
    if (!ready || busy || sel < 0) return;
    const r = slide(board, st.pieces, sel, dir);
    if (!r) { sfx('wrong'); return; }
    st.history.push(st.pieces);
    const m = meshes[sel], from = m.position.clone(), to = P(r.to[0], r.to[1]); to.y = 0.42;
    busy = true; hintMove = null;
    const t0 = performance.now(), dur = 90 + 60 * from.distanceTo(to);
    sfx('slide');
    (function anim() {
      const k = Math.min(1, (performance.now() - t0) / dur);
      m.position.lerpVectors(from, to, k * k * (3 - 2 * k));
      if (k < 1) return requestAnimationFrame(anim);
      st.pieces = r.pieces; busy = false;
      // after a slide the moved piece is the same index unless merged (merged piece is last)
      sel = r.merged ? st.pieces.length - 1 : sel > -1 ? st.pieces.findIndex((p) => p.x === r.to[0] && p.y === r.to[1]) : -1;
      rebuild();
      if (r.merged) { sfx('merge'); meshes[sel].scale.setScalar(1.5); }
      status();
      if (st.pieces.length === 1) finish();
    })();
  }
  const undo = () => { if (busy || !st.history.length) return; st.pieces = st.history.pop(); sel = -1; rebuild(); status(); };
  const reset = () => { if (busy) return; st.pieces = board.pieces.map((p) => ({ x: p.x, y: p.y, t: p.t })); st.history = []; sel = -1; rebuild(); status(); };
  const hint = () => {
    if (!ready || busy) return;
    const sol = solveMerge(board, st.pieces, 60000);
    if (!sol) { msg.textContent = 'No way to finish from here. Undo a few moves or reset the tray.'; return; }
    if (!sol.length) return;
    hintMove = sol[0];
    sel = st.pieces.findIndex((p) => p.x === hintMove.x && p.y === hintMove.y);
    st.hinted = true;
    msg.textContent = `Hint: slide the highlighted ${TIERS[st.pieces[sel].t].toLowerCase()} ${hintMove.dir}. (${sol.length} move${sol.length > 1 ? 's' : ''} to go.)`;
  };

  const ray = new THREE.Raycaster();
  canvas.addEventListener('pointerdown', (e) => {
    if (!ready || busy) return;
    const r = canvas.getBoundingClientRect();
    ray.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), cam);
    const hit = ray.intersectObjects(meshes)[0];
    if (hit) { select(hit.object.userData.i); sfx('click'); return; }
    // clicking an empty tile in line with the selection slides towards it
    const tile = ray.intersectObjects(tiles)[0];
    if (tile && sel >= 0) {
      const p = P(st.pieces[sel].x, st.pieces[sel].y), dx = tile.point.x - p.x, dz = tile.point.z - p.z;
      move(Math.abs(dx) > Math.abs(dz) ? (dx > 0 ? 'right' : 'left') : dz > 0 ? 'down' : 'up');
    }
  });
  root.addEventListener('keydown', (e) => {
    const d = KEYDIR[e.key];
    if (d) move(d);
    else if (e.key === 'Tab') { if (ready) select((sel + 1) % st.pieces.length); }
    else if (e.key === 'z' || e.key === 'Backspace') undo();
    else if (e.key === 'r') reset();
    else return;
    e.preventDefault(); e.stopPropagation();
  });

  (function frame(t) {
    if (!root.isConnected && t > 0 && root.dataset.live) { renderer.dispose(); meshes.forEach((m) => { m.geometry.dispose(); m.material.dispose(); }); return; }
    if (root.isConnected) root.dataset.live = '1';
    meshes.forEach((m, i) => { m.rotation.y += 0.008; m.position.y += ((i === sel ? 0.62 : 0.42) - m.position.y) * 0.2; m.scale.lerp(new THREE.Vector3(1, 1, 1), 0.15); });
    ring.visible = sel >= 0 && !!meshes[sel];
    if (ring.visible) { ring.position.set(meshes[sel].position.x, 0.03, meshes[sel].position.z); }
    arrow.visible = !!hintMove && sel >= 0 && !!meshes[sel];
    if (arrow.visible) {
      const d = { up: [0, -1, Math.PI], down: [0, 1, 0], left: [-1, 0, -Math.PI / 2], right: [1, 0, Math.PI / 2] }[hintMove.dir];
      const bobble = 0.75 + Math.sin(t / 160) * 0.08;
      arrow.position.set(meshes[sel].position.x + d[0] * bobble, 0.45, meshes[sel].position.z + d[1] * bobble);
      arrow.rotation.set(Math.PI / 2, 0, 0); arrow.rotation.z = -d[2] + Math.PI; arrow.rotation.order = 'YXZ'; arrow.rotation.set(Math.PI / 2, d[2], 0);
    }
    renderer.render(scene, cam);
    raf = requestAnimationFrame(frame);
  })(0);

  const pad = el('div', { class: 'dpad' }, el('button', { class: 'btn', onclick: () => move('up') }, '▲'), el('div', {}, el('button', { class: 'btn', onclick: () => move('left') }, '◀'), el('button', { class: 'btn', onclick: () => move('down') }, '▼'), el('button', { class: 'btn', onclick: () => move('right') }, '▶')));
  root.append(el('div', { class: 'lock-head' }, el('span', { html: symbolSVG(lock.symbol, 38) }), el('div', {}, el('h2', {}, 'Merge tray'), el('p', { class: 'sub' }, `Marked with a ${SYMBOLS[lock.symbol].name.toLowerCase()}. Slide solids across the felt; identical solids fuse into the next one.`))),
    ladder, canvas, el('div', { class: 'row' }, pad, el('div', { class: 'col' }, el('button', { class: 'btn', onclick: undo }, 'Undo'), el('button', { class: 'btn', onclick: reset }, 'Reset'), el('button', { class: 'btn', onclick: hint }, 'Hint'))), msg, el('p', { class: 'keys' }, 'Click a solid · arrows / WASD slide · Tab next · Z undo · R reset'));
  rebuild(); status();
  root.mergeApi = { move, select, hint, get pieces() { return st.pieces; } };
  void raf;
  return root;
}
