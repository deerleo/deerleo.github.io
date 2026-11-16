// Operations on a level manifest shared by the generator and the editor.
// A level is: { props:[{id,type,x,z,rot,lock?,on?,ox?}], things:[{id,kind,for,at:{prop,slot}}] }
// "things" are everything a lock needs: keys, tools, shapes and clues. Clue text is always derived
// from the lock it belongs to, so clues can never drift out of sync with their solution.
import { CATALOG, rectOf, overlap } from './catalog.js';
import { SYMBOL_IDS } from './symbols.js';
import { buildWheel } from './words.js';
import { genMerge } from './mergepuzzle.js';
import { THEMES, DIFFICULTY } from './themes.js';

export const FORMAT = 'escape-the-fable/1';
export const BOOK_COLORS = { red: '#c0392b', blue: '#2b62b8', green: '#2f8f4e', yellow: '#e2b93b' };

export function newLevel(theme = 'detective') {
  return { format: FORMAT, name: 'Untitled room', theme, difficulty: 'medium', room: { w: 7, d: 6, h: 3 }, props: [], things: [], n: 0 };
}
export const propById = (level, id) => level.props.find((p) => p.id === id);
export const thingsFor = (level, pid) => level.things.filter((t) => t.for === pid);
export const thingsAt = (level, pid, slot) => level.things.filter((t) => t.at && t.at.prop === pid && (!slot || t.at.slot === slot));

export function addProp(level, type, o = {}) {
  const p = { id: 'p' + ++level.n, type, x: 0, z: 0, rot: 0, ...o };
  level.props.push(p);
  return p;
}
export function addThing(level, t) {
  t.id = 't' + ++level.n;
  t.at = t.at || null;
  level.things.push(t);
  return t;
}
export function freeSymbol(level, rng) {
  const used = new Set(level.props.map((p) => p.lock && p.lock.symbol).filter(Boolean));
  const free = SYMBOL_IDS.filter((s) => !used.has(s));
  return free.length ? rng.pick(free) : rng.pick(SYMBOL_IDS);
}

const pad2 = (n) => String(n).padStart(2, '0');
export function codeFits(style, code) {
  if (!/^\d{3,4}$/.test(code)) return 'The code must be 3 or 4 digits.';
  if (style === 'clock') {
    const h = +code.slice(0, -2), m = +code.slice(-2);
    if (h < 1 || h > 12 || m > 55 || m % 5) return 'A clock code must read as a time on a 5-minute mark, e.g. 435 for 4:35 or 1120 for 11:20.';
  }
  if (style === 'books' && /[0]/.test(code)) return 'A book-count code cannot contain 0 (each digit is a number of books).';
  if (style === 'radio' && (+code < 540 || +code > 1600)) return 'A radio code must be a frequency between 540 and 1600.';
  if (style === 'logic' && new Set(code).size < code.length) return 'A code-breaker code needs every digit to be different.';
  return null;
}
function genCode(level, rng, n, style, self) {
  const taken = new Set(level.props.filter((p) => p !== self && p.lock && p.lock.code).map((p) => p.lock.code));
  for (let i = 0; i < 200; i++) {
    let code;
    if (style === 'clock') code = (n === 3 ? rng.int(1, 9) : rng.int(10, 12)) + pad2(5 * rng.int(1, 11));
    else if (style === 'books') code = Array.from({ length: n }, () => rng.int(1, 7)).join('');
    else if (style === 'radio') code = String(n === 3 ? rng.int(540, 999) : rng.int(1000, 1600));
    else if (style === 'logic') code = rng.shuffle([...'0123456789']).slice(0, n).join('');
    else code = Array.from({ length: n }, () => rng.int(0, 9)).join('');
    if (new Set(code).size < 2 || taken.has(code)) continue;
    return code;
  }
  return '1234'.slice(0, n);
}
function genCombo(rng) {
  const c = [rng.int(0, 39)];
  while (c.length < 3) { const v = rng.int(0, 39); if (Math.abs(v - c[c.length - 1]) >= 5) c.push(v); }
  return c;
}

const CODE_STYLES = ['plain', 'tornA', 'tornB', 'clock', 'books', 'radio', 'logic'];

// Code-breaker ("mastermind") feedback for codes whose digits are all different:
// [digits in the right place, right digits in the wrong place]
export function feedback(code, guess) {
  let hit = 0, near = 0;
  for (let i = 0; i < guess.length; i++) { if (guess[i] === code[i]) hit++; else if (code.includes(guess[i])) near++; }
  return [hit, near];
}
function distinctCodes(n) {
  const out = [];
  const go = (pre) => { if (pre.length === n) return out.push(pre); for (const d of '0123456789') if (!pre.includes(d)) go(pre + d); };
  go('');
  return out;
}
// Which codes agree with every row? Used to prove the rows single out one answer.
export function logicSolutions(rows, n) {
  return distinctCodes(n).filter((c) => rows.every((r) => { const f = feedback(c, r.g); return f[0] === r.hit && f[1] === r.near; }));
}
// Builds a short list of guesses with feedback that leaves exactly one possible code.
export function makeRows(rng, code) {
  const n = code.length, all = distinctCodes(n);
  let left = all.filter((c) => c !== code);
  const rows = [];
  while (left.length && rows.length < 7) {
    let best = null;
    for (let i = 0; i < 5; i++) {
      const g = rng.pick(all), f = feedback(code, g);
      if (g === code || f[0] >= n - 1 + (n === 3 ? 0 : 1) || rows.some((r) => r.g === g)) continue;
      const rest = left.filter((c) => { const x = feedback(c, g); return x[0] === f[0] && x[1] === f[1]; });
      if (!best || rest.length < best.rest.length) best = { g, f, rest };
    }
    if (!best) continue;
    rows.push({ g: best.g, hit: best.f[0], near: best.f[1] });
    left = best.rest;
  }
  return left.length ? null : rows;
}

// (Re)creates the clue things for a digits/dial lock in the requested style.
// style: plain | torn | clock | books | radio
export function setClueStyle(level, prop, style, rng) {
  const lock = prop.lock;
  if (lock.type === 'dial' && !['plain', 'torn'].includes(style)) style = 'plain';
  const old = level.things.filter((t) => t.for === prop.id && t.kind === 'clue' && CODE_STYLES.includes(t.style));
  const oldAt = old.map((t) => t.at).filter((a) => a && a.slot !== 'shown');
  level.things = level.things.filter((t) => !old.includes(t));
  lock.style = style;
  if (lock.type === 'digits') {
    const n = lock.code ? lock.code.length : lock.n || 3;
    if (!lock.code || codeFits(style, lock.code)) lock.code = genCode(level, rng, n, style, prop);
    delete lock.n;
    if (style === 'books') lock.colors = rng.shuffle(Object.keys(BOOK_COLORS)).slice(0, lock.code.length);
    else delete lock.colors;
    if (style === 'logic') { for (let i = 0; i < 20 && !(lock.rows = makeRows(rng, lock.code)); i++) lock.code = genCode(level, rng, n, style, prop); }
    else delete lock.rows;
  }
  const styles = style === 'torn' ? ['tornA', 'tornB'] : [style];
  return styles.map((s, i) => addThing(level, { kind: 'clue', style: s, for: prop.id, at: oldAt[i] || null }));
}

export function clearLock(level, prop) {
  level.things = level.things.filter((t) => t.for !== prop.id);
  delete prop.lock;
}

// Puts a lock on a container and creates everything needed to open it (initially unplaced).
export function setLock(level, prop, type, rng, o = {}) {
  clearLock(level, prop);
  const cat = CATALOG[prop.type];
  if (!cat.container || !cat.container.locks.includes(type)) return null;
  const D = DIFFICULTY[level.difficulty] || DIFFICULTY.medium;
  const lock = { type };
  if (type !== 'tool') lock.symbol = o.symbol || freeSymbol(level, rng);
  prop.lock = lock;
  if (type === 'key' || type === 'tool') addOpeners(level, prop, !!o.split);
  else if (type === 'digits') { lock.n = o.n || rng.int(D.digits[0], D.digits[1]); setClueStyle(level, prop, o.style || 'plain', rng); }
  else if (type === 'dial') { lock.combo = genCombo(rng); setClueStyle(level, prop, o.style || 'plain', rng); }
  else if (type === 'wheel') {
    const w = buildWheel(rng, THEMES[level.theme].words, o.cands || D.cands, o.cons || D.cons, o.word);
    if (!w) { delete prop.lock; return null; }
    Object.assign(lock, w);
    addThing(level, { kind: 'clue', style: 'codebook', for: prop.id });
    w.constraints.forEach((_, idx) => addThing(level, { kind: 'clue', style: 'constraint', idx, for: prop.id }));
  } else if (type === 'merge') {
    const board = genMerge(rng, o.level ?? D.merge, o.sockets ?? rng.int(D.sockets[0], D.sockets[1]));
    if (!board) { delete prop.lock; return null; }
    lock.board = board;
    board.pieces.forEach((pc, piece) => { if (pc.s) addThing(level, { kind: 'shape', piece, for: prop.id }); });
  }
  return lock;
}

// A key (or tool) is one thing, or two halves that the player has to join in the inventory.
function addOpeners(level, prop, split) {
  const lock = prop.lock, base = lock.type === 'key' ? { kind: 'key' } : { kind: 'tool', tool: CATALOG[prop.type].container.tool };
  if (split) lock.split = true; else delete lock.split;
  return (split ? ['a', 'b'] : [null]).map((half) => addThing(level, { ...base, ...(half ? { half } : {}), for: prop.id }));
}
export function setSplit(level, prop, split) {
  const old = level.things.filter((t) => t.for === prop.id && (t.kind === 'key' || t.kind === 'tool'));
  level.things = level.things.filter((t) => !old.includes(t));
  const made = addOpeners(level, prop, split);
  made[0].at = old[0] ? old[0].at : null;
  return made;
}

// ---- the photograph: a spot-the-difference puzzle. The photo shows the room as it used to be;
// three pieces of furniture have since been disturbed, and a disturbed decor piece can hide something.
export const canSecret = (cat) => cat.place === 'floor' && !cat.container && !cat.hide && !cat.inscribe && !cat.feature;
const MOVABLE = ['chair', 'stool', 'mic_stand', 'floor_globe', 'armchair', 'waste_bin', 'plant', 'floor_lamp', 'coat_rack'];
function inShot(level, cam, p) {
  const c = CATALOG[p.type], ty = c.h * 0.6;
  // within the lens (camera looks at the room centre) and far enough away to be recognisable
  const a = Math.atan2(p.x - cam.x, p.z - cam.z) - Math.atan2(-cam.x, -cam.z), da = Math.abs(Math.atan2(Math.sin(a), Math.cos(a)));
  if (da > 0.62 || Math.hypot(p.x - cam.x, p.z - cam.z) < 1.7) return false;
  for (let i = 1; i < 24; i++) {
    const k = i / 24, x = cam.x + (p.x - cam.x) * k, y = cam.y + (ty - cam.y) * k, z = cam.z + (p.z - cam.z) * k;
    for (const q of level.props) {
      const qc = CATALOG[q.type];
      if (q === p || qc.place !== 'floor') continue;
      const r = rectOf(q, 0.05);
      if (x > r.x0 && x < r.x1 && z > r.z0 && z < r.z1 && y < qc.h + 0.05) return false;
    }
  }
  return true;
}
function makeDiff(level, rng, p) {
  const { w, d } = level.room;
  if (MOVABLE.includes(p.type)) for (let i = 0; i < 40; i++) {
    const a = rng.range(0, 6.28), dist = rng.range(0.55, 1.0);
    const g = { type: p.type, x: +(p.x + Math.cos(a) * dist).toFixed(2), z: +(p.z + Math.sin(a) * dist).toFixed(2), rot: (p.rot + rng.int(1, 3)) % 4 };
    const r = rectOf(g, 0.08);
    if (r.x0 < -w / 2 || r.x1 > w / 2 || r.z0 < -d / 2 || r.z1 > d / 2) continue;
    if (level.props.some((q) => q !== p && CATALOG[q.type].place === 'floor' && overlap(r, rectOf(q)))) continue;
    return { prop: p.id, x: g.x, z: g.z, rot: g.rot };
  }
  return { prop: p.id, gone: true };
}
export function removePhoto(level) {
  for (const t of level.things) if (t.at && t.at.slot === 'secret') t.at = null;
  level.things = level.things.filter((t) => t.kind !== 'photo');
  delete level.photo;
}
// Needs a finished floor plan. Returns the new photo thing (unplaced), or null if no good shot exists.
export function addPhoto(level, rng) {
  removePhoto(level);
  const { w, d } = level.room;
  for (const [sx, sz] of rng.shuffle([[1, 1], [1, -1], [-1, 1], [-1, -1]])) {
    const cam = { x: +(sx * (w / 2 - 0.3)).toFixed(2), y: 2.7, z: +(sz * (d / 2 - 0.3)).toFixed(2) };
    const ok = level.props.filter((p) => CATALOG[p.type].place === 'floor' && !level.props.some((q) => q.on === p.id) && inShot(level, cam, p));
    const secrets = rng.shuffle(ok.filter((p) => canSecret(CATALOG[p.type])));
    if (!secrets.length) continue;
    const others = rng.shuffle(ok.filter((p) => p !== secrets[0])).slice(0, 2);
    if (others.length < 2) continue;
    level.photo = { cam, diffs: rng.shuffle([secrets[0], ...others]).map((p) => makeDiff(level, rng, p)) };
    return addThing(level, { kind: 'photo' });
  }
  return null;
}
export const photoDiff = (level, pid) => (level.photo ? level.photo.diffs.find((x) => x.prop === pid) : null);

export function removeProp(level, id) {
  const p = propById(level, id);
  if (!p) return;
  if (photoDiff(level, id)) removePhoto(level);
  clearLock(level, p);
  for (const t of level.things) if (t.at && t.at.prop === id) t.at = null;
  for (const top of level.props.filter((q) => q.on === id)) removeProp(level, top.id);
  level.props = level.props.filter((q) => q.id !== id);
}

// Which slot kinds a thing may occupy on a given prop.
export function slotFor(thing, prop, level) {
  const cat = CATALOG[prop.type];
  if (thing.for === prop.id) return null; // never inside / on the thing it opens
  if (thing.kind === 'photo') return cat.container && !cat.container.exit ? 'holds' : cat.hide ? 'hidden' : null;
  if (level && canSecret(cat) && photoDiff(level, prop.id)) return thing.kind === 'clue' && ['clock', 'books', 'radio'].includes(thing.style) ? null : 'secret';
  if (thing.kind === 'clue' && ['clock', 'books', 'radio'].includes(thing.style)) return cat.feature === thing.style ? 'shown' : null;
  if (cat.container && !cat.container.exit) return 'holds';
  if (cat.hide) return 'hidden';
  if (cat.inscribe && thing.kind === 'clue' && ['plain', 'logic', 'codebook', 'constraint'].includes(thing.style)) return 'shown';
  return null;
}
export const SLOT_CAP = { holds: 4, hidden: 2, shown: 1, secret: 1 };

// Table-top props follow their host.
export function placeTops(level) {
  for (const p of level.props) {
    if (CATALOG[p.type].place !== 'top') continue;
    const host = propById(level, p.on);
    if (!host) continue;
    const a = (host.rot * Math.PI) / 2, ox = p.ox || 0, oz = p.oz || 0;
    p.x = +(host.x + ox * Math.cos(a) + oz * Math.sin(a)).toFixed(3);
    p.z = +(host.z - ox * Math.sin(a) + oz * Math.cos(a)).toFixed(3);
    p.rot = host.rot;
  }
}
