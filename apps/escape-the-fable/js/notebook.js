// The notebook: clues with small puzzles to work out, the inventory (with combining), and seen locks.
import * as THREE from 'three';
import { CATALOG } from './catalog.js';
import { SYMBOLS } from './symbols.js';
import { propById, thingsFor, feedback } from './levelops.js';
import { thingInfo, propName, logicLine } from './manifest.js';
import { World } from './world.js';
import { el, closeModal, thingIcon, symbolSVG, sfx, toast } from './ui.js';

const LOCK_WORDS = { key: 'needs a key', tool: 'needs a tool', digits: 'number padlock', dial: 'safe dial', wheel: 'word wheel', merge: 'merge tray' };
const list = (a) => (a.length > 1 ? a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1] : a[0] || '');

// ---------------------------------------------------------------- what still needs the player's attention
export function pending(game) {
  const L = game.level, known = (t) => game.prog.known.has(t.id), open = (pid) => game.prog.opened.has(pid);
  const clues = L.things.filter((t) => known(t) && t.kind === 'clue' && !open(t.for));
  let notes = 0;
  for (const t of clues) {
    if (t.style === 'logic' && !game.worked.has(t.id)) notes++;
    if (t.style === 'tornA' && !game.pieced.has(t.for) && clues.some((o) => o.for === t.for && o.style === 'tornB')) notes++;
  }
  if (L.things.some((t) => t.kind === 'photo' && known(t)) && !game.photoDone) notes++;
  return { notes, items: game.items().filter((i) => i.partner).length };
}

// ---------------------------------------------------------------- photograph
function snap(game, scene, sepia) {
  const r = game.app.renderer, c = game.level.photo.cam;
  const cam = new THREE.PerspectiveCamera(74, 4 / 3, 0.05, 60);
  cam.position.set(c.x, c.y, c.z); cam.lookAt(0, 0.75, 0); cam.updateMatrixWorld();
  r.setSize(640, 480, false);
  r.render(scene, cam);
  const cv = el('canvas', { width: 640, height: 480 }), g = cv.getContext('2d');
  if (sepia) g.filter = 'sepia(0.9) contrast(1.08) brightness(0.96)';
  g.drawImage(r.domElement, 0, 0, 640, 480);
  game.app.resize();
  const at = (x, y, z) => { const v = new THREE.Vector3(x, y, z).project(cam); return [(v.x + 1) / 2, (1 - v.y) / 2]; };
  return { url: cv.toDataURL('image/jpeg', 0.86), at };
}
function photoShots(game) {
  const L = game.level;
  if (!game.thenShot) {
    const old = JSON.parse(JSON.stringify(L));
    for (const d of L.photo.diffs) {
      if (d.gone) old.props = old.props.filter((p) => p.id !== d.prop && p.on !== d.prop);
      else Object.assign(old.props.find((p) => p.id === d.prop), { x: d.x, z: d.z, rot: d.rot });
    }
    old.things = old.things.filter((t) => !t.at || old.props.some((p) => p.id === t.at.prop));
    const w = new World(old);
    game.thenShot = snap(game, w.scene, true).url;
    w.dispose();
  }
  game.world.highlight(null);
  const now = snap(game, game.world.scene, false);
  const pts = L.photo.diffs.map((d) => { const p = propById(L, d.prop), h = CATALOG[p.type].h * 0.5; return { now: now.at(p.x, h, p.z), then: d.gone ? now.at(p.x, h, p.z) : now.at(d.x, h, d.z) }; });
  return { then: game.thenShot, now: now.url, pts };
}
function photoSection(game, redraw) {
  const L = game.level, shots = photoShots(game), n = L.photo.diffs.length;
  const names = L.photo.diffs.map((d) => propName(propById(L, d.prop)));
  const msg = el('p', { class: 'sub' });
  const say = () => { msg.textContent = game.photoDone ? `Worked out: the ${list(names)} ${n > 1 ? 'have' : 'has'} been disturbed since the photograph was taken. Worth a closer look in the room.` : `Click what has changed, on either picture. Found ${game.photoFound.size} of ${n}.`; };
  const pic = (key, title) => {
    const marks = el('div', { class: 'marks' });
    const paint = () => marks.replaceChildren(...[...game.photoFound].map((i) => { const [u, v] = shots.pts[i][key]; return el('i', { style: `left:${u * 100}%;top:${v * 100}%` }); }));
    const box = el('figure', { class: 'shot ' + key, onclick: (e) => {
      if (game.photoDone) return;
      const r = box.querySelector('img').getBoundingClientRect(), u = (e.clientX - r.left) / r.width, v = (e.clientY - r.top) / r.height;
      const i = shots.pts.findIndex((p, idx) => !game.photoFound.has(idx) && [p.now, p.then].some(([a, b]) => Math.hypot(a - u, (b - v) * 0.75) < 0.085));
      if (i < 0) { sfx('wrong'); const x = el('b', { style: `left:${u * 100}%;top:${v * 100}%` }, '×'); marks.append(x); setTimeout(() => x.remove(), 700); return; }
      game.photoFound.add(i); sfx('found');
      if (game.photoFound.size === n) { game.photoDone = true; game.refreshHud(); redraw(); toast(`The ${list(names)} ${n > 1 ? 'have' : 'has'} been disturbed. Go and take a closer look.`, 5000); return; }
      paints.forEach((f) => f()); say();
    } }, el('img', { src: shots[key], alt: title, draggable: 'false' }), marks, el('figcaption', {}, title));
    paints.push(paint); paint();
    return box;
  };
  const paints = [];
  say();
  return el('section', { class: game.photoDone ? 'done' : 'todo' }, el('h3', {}, 'Old photograph', game.photoDone ? el('em', {}, ' worked out ✓') : el('em', { class: 'todo' }, ' something to work out')),
    el('div', { class: 'shots' }, pic('then', 'The photograph (then)'), pic('now', 'The room (now)')), msg);
}

// ---------------------------------------------------------------- clue worksheets
function logicSheet(game, t, lock, redraw) {
  const n = lock.code.length, st = (game.sheet[t.id] = game.sheet[t.id] || { v: Array(n).fill(0), tested: false });
  if (game.worked.has(t.id)) return el('p', { class: 'worked' }, `Worked out: ${lock.code.split('').join(' – ')} ✓`);
  const rows = lock.rows.map((r) => el('div', { class: 'lrow' }, el('code', {}, logicLine(r)), el('span', { class: 'verdict' })));
  const judge = () => {
    const g = st.v.join(''), distinct = new Set(g).size === n;
    let ok = distinct;
    lock.rows.forEach((r, i) => { const f = feedback(g, r.g), fits = f[0] === r.hit && f[1] === r.near; ok = ok && fits; rows[i].lastChild.textContent = st.tested ? (fits ? '✓ fits' : '✗ clashes') : ''; rows[i].lastChild.className = 'verdict ' + (fits ? 'yes' : 'no'); });
    note.textContent = !st.tested ? 'Set a guess and test it against the lines.' : !distinct ? 'Remember: every digit is different.' : ok ? '' : 'Your guess clashes with the marked lines. If this were the code, they would have scored differently.';
    return ok;
  };
  const note = el('p', { class: 'tiny' });
  const cells = st.v.map((_, i) => { const num = el('b', {}, String(st.v[i])); const turn = (d) => { st.v[i] = (st.v[i] + d + 10) % 10; num.textContent = st.v[i]; st.tested = false; judge(); sfx('tick'); }; return el('span', { class: 'mini' }, el('button', { onclick: () => turn(1) }, '▲'), num, el('button', { onclick: () => turn(-1) }, '▼')); });
  const test = () => { st.tested = true; if (judge()) { game.worked.add(t.id); sfx('unlock'); game.refreshHud(); redraw(); } else sfx('wrong'); };
  judge();
  return el('div', { class: 'sheet' }, el('p', { class: 'tiny' }, 'Every digit of the code is different. ● = right digit in the right place, ○ = right digit in the wrong place.'), ...rows, el('div', { class: 'guess' }, el('span', {}, 'My answer:'), ...cells, el('button', { class: 'btn small', onclick: test }, 'Test it')), note);
}
function wordSheet(game, pid, lock) {
  const struck = (game.struck[pid] = game.struck[pid] || new Set());
  const left = el('p', { class: 'tiny' });
  const say = () => { left.textContent = `Click a word to cross it out when a clue rules it out. ${lock.candidates.length - struck.size} still standing.`; };
  say();
  return el('div', { class: 'sheet' }, el('div', { class: 'words' }, lock.candidates.map((w) => el('button', { class: 'word' + (struck.has(w) ? ' out' : ''), onclick: (e) => { struck.has(w) ? struck.delete(w) : struck.add(w); e.currentTarget.classList.toggle('out'); sfx('tick'); say(); } }, w))), left);
}

function cluesTab(game, redraw) {
  const L = game.level, out = [];
  const groups = new Map();
  for (const id of game.notes) { const t = game.thing(id); if (t.kind !== 'clue') continue; if (!groups.has(t.for)) groups.set(t.for, []); groups.get(t.for).push(t); }
  if (L.photo && L.things.some((t) => t.kind === 'photo' && game.prog.known.has(t.id))) out.push(photoSection(game, redraw));
  for (const [pid, things] of groups) {
    const owner = propById(L, pid), lock = owner.lock, solved = game.prog.opened.has(pid), kids = [];
    const where = (t) => (t.at.slot === 'shown' ? ` (${propName(propById(L, t.at.prop))})` : '');
    const a = things.find((t) => t.style === 'tornA'), b = things.find((t) => t.style === 'tornB');
    for (const t of things) {
      const info = thingInfo(L, t);
      if ((t === a || t === b) && a && b) {
        if (t === b) continue;
        if (game.pieced.has(pid)) { const whole = thingInfo(L, { ...t, style: 'plain' }); kids.push(el('div', { class: 'entry' }, el('b', {}, 'Torn note, pieced together'), ...whole.lines.map((l) => el('p', {}, l)))); }
        else kids.push(el('div', { class: 'entry' }, el('b', {}, 'Two halves of a torn note'), el('p', {}, thingInfo(L, a).lines[1]), el('p', {}, thingInfo(L, b).lines[1]), solved ? null : el('button', { class: 'btn small glow', onclick: () => { game.pieced.add(pid); sfx('found'); game.refreshHud(); redraw(); } }, 'Piece the halves together')));
        continue;
      }
      if (t.style === 'logic') { kids.push(el('div', { class: 'entry' }, el('b', {}, info.title + where(t)), solved ? el('p', {}, `Combination: ${lock.code.split('').join(' – ')}`) : logicSheet(game, t, lock, redraw))); continue; }
      kids.push(el('div', { class: 'entry' }, el('b', {}, info.title + where(t)), ...(t.style === 'codebook' ? [el('p', {}, info.lines[0])] : info.lines.map((l) => el('p', {}, l))), t.style === 'codebook' && !solved ? wordSheet(game, pid, lock) : null));
    }
    const todo = !solved && things.some((t) => (t.style === 'logic' && !game.worked.has(t.id)) || (t === a && b && !game.pieced.has(pid)));
    out.push(el('section', { class: solved ? 'solved' : todo ? 'todo' : '' }, el('h3', { html: `${symbolSVG(lock.symbol, 26)} ${SYMBOLS[lock.symbol].name} clues` }, solved ? el('em', {}, ' lock opened ✓') : todo ? el('em', { class: 'todo' }, ' something to work out') : null), ...kids));
  }
  // unsolved first, opened locks sink to the bottom
  out.sort((x, y) => x.classList.contains('solved') - y.classList.contains('solved'));
  return out.length ? out : [el('p', { class: 'sub' }, 'No clues yet. Search the furniture and examine anything unusual.')];
}

function itemsTab(game, redraw) {
  const items = game.items();
  if (!items.length) return [el('p', { class: 'sub' }, 'Your pockets are empty. Keys, tools and carved pieces you pick up appear here.')];
  return [el('p', { class: 'sub' }, 'Some finds are only half of something. When you hold both halves, a glowing button lets you join them.'), el('div', { class: 'items' }, items.map((it) => el('div', { class: 'item' + (it.partner ? ' can' : '') },
    el('span', { class: 'bigicon', html: thingIcon(it.t, it.info, 56) }), el('h4', {}, it.info.symbol ? el('span', { html: symbolSVG(it.info.symbol, 18) + ' ' }) : null, it.info.name), el('p', {}, it.info.lines[0]),
    it.partner ? el('button', { class: 'btn small glow', onclick: () => { game.join(it.t.for); redraw(); } }, `Join with the ${it.partner.name.toLowerCase()}`) : it.t.half ? el('p', { class: 'tiny' }, 'The other half is still out there somewhere.') : it.t.kind === 'shape' ? el('p', { class: 'tiny' }, 'Fits the merge tray carrying the same mark.') : el('p', { class: 'tiny' }, 'Used automatically at the lock or obstacle it fits.'))))];
}

function locksTab(game) {
  const L = game.level, seen = L.props.filter((p) => p.lock && (game.lockState[p.id + '/seen'] || game.prog.opened.has(p.id)));
  if (!seen.length) return [el('p', { class: 'sub' }, 'You have not inspected any locks yet. Walk up to one and press E.')];
  return [el('section', {}, ...seen.map((p) => { const done = game.prog.opened.has(p.id), need = thingsFor(L, p.id).filter((t) => t.kind === 'clue' && game.prog.known.has(t.id)).length; return el('div', { class: 'entry lockline' + (done ? ' solved' : ''), html: `${p.lock.symbol ? symbolSVG(p.lock.symbol, 22) : '🔧'} <b>${CATALOG[p.type].name}</b> <span>${LOCK_WORDS[p.lock.type]}${p.lock.type === 'digits' ? `, ${p.lock.code.length} digits` : ''}</span> <em>${done ? 'opened ✓' : need ? `${need} clue${need > 1 ? 's' : ''} in your notebook` : 'no clues yet'}</em>` }); }))];
}

export function notebookUI(game, tab = 'clues') {
  const root = el('div', { class: 'notebook' });
  const draw = () => {
    const p = pending(game);
    const tabs = [['clues', 'Clues', p.notes], ['items', 'Inventory', p.items], ['locks', 'Locks', 0]];
    const body = tab === 'clues' ? cluesTab(game, draw) : tab === 'items' ? itemsTab(game, draw) : locksTab(game);
    root.replaceChildren(el('div', { class: 'tabs' }, tabs.map(([id, name, n]) => el('button', { class: 'tab' + (id === tab ? ' on' : ''), onclick: () => { tab = id; draw(); } }, name, n ? el('i', {}, String(n)) : null))),
      el('div', { class: 'tabbody' }, body), el('button', { class: 'btn primary', autofocus: true, onclick: () => closeModal() }, 'Close'));
  };
  draw();
  return root;
}
