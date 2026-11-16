// Manifest semantics: describing things, solving a level (the deductive flow), validating layout, sharing.
import { CATALOG, TOOLS, rectOf, FRONT, overlap } from './catalog.js';
import { SYMBOLS } from './symbols.js';
import { textC, remaining } from './words.js';
import { TIERS, solveMerge } from './mergepuzzle.js';
import { THEMES } from './themes.js';
import { FORMAT, propById, thingsFor, thingsAt, codeFits, slotFor, SLOT_CAP, placeTops, logicSolutions, photoDiff } from './levelops.js';

export const propName = (p) => CATALOG[p.type].name.toLowerCase();
const symName = (lock) => (lock && lock.symbol ? SYMBOLS[lock.symbol].name : '');
export const clockText = (code) => `${+code.slice(0, -2)}:${code.slice(-2)}`;
const dialText = (c) => `Right to ${c[0]}  ·  Left to ${c[1]}  ·  Right to ${c[2]}`;

// Human description of any thing: { name, title, lines[], symbol, note }
export const logicLine = (r) => `${r.g.split('').join(' ')}    ${r.hit + r.near ? '●'.repeat(r.hit) + '○'.repeat(r.near) : 'none'}`;
export function thingInfo(level, t) {
  if (t.kind === 'photo') return { name: 'Old photograph', title: 'Old photograph', lines: ['A photograph of this very room, taken some time ago.', 'Three things have been disturbed since. Study it in your notebook.'] };
  const owner = propById(level, t.for);
  const lock = owner && owner.lock;
  const symbol = lock && lock.symbol;
  if (t.half) {
    const whole = t.kind === 'key' ? `${symName(lock).toLowerCase()} key` : TOOLS[t.tool].toLowerCase();
    const part = t.kind === 'key' ? (t.half === 'a' ? 'bow' : 'blade') : t.half === 'a' ? 'handle' : t.tool === 'crowbar' ? 'claw' : 'blade';
    const name = `${whole[0].toUpperCase() + whole.slice(1)} ${part}`;
    return { name, title: name, symbol, lines: [`One half of a broken ${whole}. On its own it is useless, but it would join to the other half.`] };
  }
  if (t.kind === 'key') return { name: `${symName(lock)} key`, title: `${symName(lock)} key`, symbol, lines: [`A key with a ${symName(lock).toLowerCase()} stamped into its bow. It will fit the lock that carries the same mark.`] };
  if (t.kind === 'tool') return { name: TOOLS[t.tool], title: TOOLS[t.tool], lines: [t.tool === 'crowbar' ? 'A short iron crowbar. Good for anything nailed shut.' : 'A flat-bladed screwdriver. Good for anything screwed down.'] };
  if (t.kind === 'shape') {
    const tier = lock.board.pieces[t.piece].t;
    return { name: TIERS[tier], title: `Carved ${TIERS[tier].toLowerCase()}`, symbol, tier, lines: [`A carved wooden ${TIERS[tier].toLowerCase()}. It belongs in a matching hollow of the ${symName(lock).toLowerCase()} tray.`] };
  }
  const shown = t.at && t.at.slot === 'shown';
  const info = { note: !shown, symbol, lines: [] };
  const code = lock.code || '';
  const k = Math.ceil(code.length / 2);
  switch (t.style) {
    case 'plain':
      info.title = shown ? 'Writing' : 'Handwritten note';
      info.lines = lock.type === 'dial' ? ['Combination:', dialText(lock.combo)] : ['Combination:', code.split('').join(' – ')];
      break;
    case 'logic':
      info.title = shown ? 'Code-breaker lines' : 'Code-breaker card';
      info.lines = ['Every digit of the code is different.', ...lock.rows.map(logicLine), '●  right digit, right place', '○  right digit, wrong place'];
      break;
    case 'tornA':
      info.title = 'Torn note (first half)';
      info.lines = lock.type === 'dial' ? ['Combination:', `Right to ${lock.combo[0]}  ·  Left to ${lock.combo[1]}  ·  …`, '(the rest is torn away)'] : ['Combination:', code.slice(0, k).split('').join(' – ') + ' – …', '(the rest is torn away)'];
      break;
    case 'tornB':
      info.title = 'Torn note (second half)';
      info.lines = lock.type === 'dial' ? ['(the start is torn away)', `…  ·  Right to ${lock.combo[2]}`] : ['(the start is torn away)', '… – ' + code.slice(k).split('').join(' – ')];
      break;
    case 'clock':
      info.title = 'Stopped clock';
      info.lines = [`The hands have stopped at ${clockText(code)}.`, 'A small sticker is stuck to the glass.'];
      break;
    case 'books':
      info.title = 'Shelf plaque';
      info.lines = ['A brass plaque is screwed to the shelf:', `"Count them: ${lock.colors.map((c) => c.toUpperCase()).join(', then ')}."`];
      break;
    case 'radio':
      info.title = 'Radio dial';
      info.lines = [`The tuning needle rests at exactly ${code} kc.`, 'A small sticker is stuck beside the dial.'];
      break;
    case 'codebook':
      info.title = shown ? 'List of code words' : 'Code book page';
      info.lines = ['One of these words opens the lock:', lock.candidates.join('   ')];
      break;
    case 'constraint':
      info.title = shown ? 'Writing' : 'Scrap of paper';
      info.lines = [textC(lock.constraints[t.idx])];
      break;
  }
  info.name = info.title;
  return info;
}

export function lockSummary(level, prop) {
  const l = prop.lock;
  if (!l) return 'Unlocked';
  if (l.type === 'key') return `${symName(l)} key`;
  if (l.type === 'tool') return TOOLS[CATALOG[prop.type].container.tool];
  if (l.type === 'digits') return `Code ${l.code}`;
  if (l.type === 'dial') return `R${l.combo[0]} L${l.combo[1]} R${l.combo[2]}`;
  if (l.type === 'wheel') return `Word ${l.word}`;
  if (l.type === 'merge') return `Merge to ${TIERS[l.board.target]} (${l.board.par} moves)`;
  return '';
}

// ---------------------------------------------------------------- solving
export const newProgress = () => ({ opened: new Set(), searched: new Set(), known: new Set() });

// Can this prop's lock be opened with what the player knows/holds? → { ok, missing:[text] }
export function canUnlock(level, prop, known) {
  const lock = prop.lock;
  if (!lock) return { ok: true, missing: [] };
  const mine = thingsFor(level, prop.id);
  const have = (pred) => mine.some((t) => pred(t) && known.has(t.id));
  const all = (kind) => { const k = mine.filter((t) => t.kind === kind); return k.length && k.every((t) => known.has(t.id)); };
  const missing = [];
  if (lock.type === 'key') { if (!all('key')) missing.push(lock.split ? `both halves of the ${symName(lock).toLowerCase()} key` : `the ${symName(lock).toLowerCase()} key`); }
  else if (lock.type === 'tool') { if (!all('tool')) missing.push(lock.split ? `both halves of the ${TOOLS[CATALOG[prop.type].container.tool].toLowerCase()}` : `a ${TOOLS[CATALOG[prop.type].container.tool].toLowerCase()}`); }
  else if (lock.type === 'digits' || lock.type === 'dial') {
    const st = (s) => have((t) => t.style === s);
    if (!(st('plain') || st('logic') || st('clock') || st('books') || st('radio') || (st('tornA') && st('tornB')))) missing.push(mine.some((t) => t.style === 'tornA') ? 'both halves of the torn note' : 'the combination');
  } else if (lock.type === 'wheel') {
    if (!have((t) => t.style === 'codebook')) missing.push('the list of code words');
    const cons = mine.filter((t) => t.style === 'constraint' && known.has(t.id)).map((t) => lock.constraints[t.idx]);
    const left = remaining(lock.candidates, cons);
    if (left.length !== 1 || left[0] !== lock.word) missing.push(`more word clues (${left.length} words still fit)`);
  } else if (lock.type === 'merge') {
    const need = mine.filter((t) => t.kind === 'shape' && !known.has(t.id)).length;
    if (need) missing.push(`${need} more carved piece${need > 1 ? 's' : ''}`);
  }
  return { ok: !missing.length, missing };
}

// Everything the player could usefully do right now.
export function possibleActions(level, prog) {
  const out = [];
  for (const p of level.props) {
    const cat = CATALOG[p.type];
    const shown = thingsAt(level, p.id, 'shown').filter((t) => !prog.known.has(t.id));
    if (shown.length) out.push({ type: 'observe', prop: p, gains: shown });
    if (cat.hide && !prog.searched.has(p.id)) { const g = thingsAt(level, p.id, 'hidden'); if (g.length) out.push({ type: 'search', prop: p, gains: g }); }
    // disturbed furniture can only be searched once the photograph has given it away
    if (photoDiff(level, p.id) && !prog.searched.has(p.id) && level.things.some((t) => t.kind === 'photo' && prog.known.has(t.id))) { const g = thingsAt(level, p.id, 'secret'); if (g.length) out.push({ type: 'secret', prop: p, gains: g }); }
    if (cat.container && !prog.opened.has(p.id) && canUnlock(level, p, prog.known).ok) {
      const g = thingsAt(level, p.id, 'holds');
      if (g.length || cat.container.exit) out.push({ type: 'open', prop: p, gains: g, exit: !!cat.container.exit });
    }
  }
  const rank = (a) => (a.type === 'observe' ? 0 : a.type === 'search' ? 1 : a.exit ? 3 : 2);
  return out.sort((a, b) => rank(a) - rank(b));
}
export function applyAction(prog, a) {
  if (a.type === 'search' || a.type === 'secret') prog.searched.add(a.prop.id);
  if (a.type === 'open') prog.opened.add(a.prop.id);
  for (const t of a.gains) prog.known.add(t.id);
}

function stepText(level, a) {
  const names = a.gains.map((t) => thingInfo(level, t).name.toLowerCase()).join(', ');
  const cat = CATALOG[a.prop.type];
  if (a.type === 'observe') return `Examine the ${propName(a.prop)}: ${thingInfo(level, a.gains[0]).lines.join(' ')}`;
  if (a.type === 'search') return `${cat.hide} → find ${names}.`;
  if (a.type === 'secret') return `Compare the photograph with the room: the ${propName(a.prop)} has been disturbed. Search it → find ${names}.`;
  const how = a.prop.lock ? `Open the ${propName(a.prop)} (${lockSummary(level, a.prop)})` : `Open the ${propName(a.prop)}`;
  return a.exit ? `${how} and escape!` : `${how} → find ${names}.`;
}

export function solve(level) {
  const prog = newProgress(), steps = [];
  let escaped = false;
  for (let guard = 0; guard < 200 && !escaped; guard++) {
    const acts = possibleActions(level, prog);
    if (!acts.length) break;
    const a = acts[0];
    applyAction(prog, a);
    steps.push({ type: a.type, prop: a.prop.id, symbol: a.prop.lock && a.prop.lock.symbol, text: stepText(level, a) });
    escaped = !!a.exit;
  }
  const stuck = [];
  if (!escaped) {
    for (const p of level.props) {
      if (!p.lock || prog.opened.has(p.id)) continue;
      const r = canUnlock(level, p, prog.known);
      if (!r.ok) stuck.push(`The ${propName(p)} can never be opened: the player cannot obtain ${r.missing.join(' and ')}.`);
    }
  }
  return { ok: escaped, steps, stuck, prog };
}

// ---------------------------------------------------------------- layout
export function wallOf(level, p) {
  const { w, d } = level.room, c = CATALOG[p.type], e = 0.03;
  if (p.rot === 0 && Math.abs(p.z - (-d / 2 + c.d / 2)) < e) return 'N';
  if (p.rot === 2 && Math.abs(p.z - (d / 2 - c.d / 2)) < e) return 'S';
  if (p.rot === 1 && Math.abs(p.x - (-w / 2 + c.d / 2)) < e) return 'W';
  if (p.rot === 3 && Math.abs(p.x - (w / 2 - c.d / 2)) < e) return 'E';
  return null;
}
export function snapToWall(level, p, wall) {
  const { w, d } = level.room, c = CATALOG[p.type];
  if (!wall) {
    const dist = { N: p.z + d / 2, S: d / 2 - p.z, W: p.x + w / 2, E: w / 2 - p.x };
    wall = Object.keys(dist).sort((a, b) => dist[a] - dist[b])[0];
  }
  const cl = (v, lim) => Math.max(-lim + c.w / 2 + 0.05, Math.min(lim - c.w / 2 - 0.05, v));
  if (wall === 'N') { p.rot = 0; p.z = -d / 2 + c.d / 2; p.x = cl(p.x, w / 2); }
  if (wall === 'S') { p.rot = 2; p.z = d / 2 - c.d / 2; p.x = cl(p.x, w / 2); }
  if (wall === 'W') { p.rot = 1; p.x = -w / 2 + c.d / 2; p.z = cl(p.z, d / 2); }
  if (wall === 'E') { p.rot = 3; p.x = w / 2 - c.d / 2; p.z = cl(p.z, d / 2); }
  return wall;
}

export function spawnOf(level) {
  const door = level.props.find((p) => p.type === 'door');
  if (!door) return { x: 0, z: 0, rot: 0 };
  const f = FRONT[door.rot];
  return { x: door.x + f[0] * 0.95, z: door.z + f[1] * 0.95, rot: door.rot };
}

const distToRect = (x, z, r) => Math.hypot(Math.max(r.x0 - x, 0, x - r.x1), Math.max(r.z0 - z, 0, z - r.z1));

export function checkLayout(level) {
  placeTops(level);
  const errors = [];
  const { w, d } = level.room;
  const solids = [];
  for (const p of level.props) {
    const c = CATALOG[p.type], r = rectOf(p);
    if (c.place === 'top') {
      const host = propById(level, p.on);
      if (!host || !CATALOG[host.type].host) errors.push(`The ${propName(p)} needs to sit on a desk, table or bench.`);
      continue;
    }
    if (r.x0 < -w / 2 - 0.02 || r.x1 > w / 2 + 0.02 || r.z0 < -d / 2 - 0.02 || r.z1 > d / 2 + 0.02) errors.push(`The ${propName(p)} is outside the room.`);
    if (c.place === 'wall' && !wallOf(level, p)) errors.push(`The ${propName(p)} must be mounted on a wall.`);
    if (c.place !== 'rug') solids.push({ p, c, r });
  }
  for (let i = 0; i < solids.length; i++) for (let j = i + 1; j < solids.length; j++) {
    const a = solids[i], b = solids[j];
    if (!overlap(a.r, b.r)) continue;
    const wallP = a.c.place === 'wall' ? a : b.c.place === 'wall' ? b : null, other = wallP === a ? b : a;
    if (wallP && other.c.place === 'floor' && wallP.c.y >= other.c.h + 0.05) continue; // picture above low furniture
    errors.push(`The ${propName(a.p)} and the ${propName(b.p)} overlap.`);
  }
  // walkability flood fill from the spawn point
  const step = 0.2, nx = Math.ceil(w / step), nz = Math.ceil(d / step);
  const blocked = new Uint8Array(nx * nz);
  const floorSolids = solids.filter((s) => s.c.place === 'floor').map((s) => rectOf(s.p, 0.27));
  for (let iz = 0; iz < nz; iz++) for (let ix = 0; ix < nx; ix++) {
    const x = -w / 2 + (ix + 0.5) * step, z = -d / 2 + (iz + 0.5) * step;
    if (Math.abs(x) > w / 2 - 0.3 || Math.abs(z) > d / 2 - 0.3 || floorSolids.some((r) => x > r.x0 && x < r.x1 && z > r.z0 && z < r.z1)) blocked[iz * nx + ix] = 1;
  }
  const spawn = spawnOf(level);
  const sx = Math.floor((spawn.x + w / 2) / step), sz = Math.floor((spawn.z + d / 2) / step);
  const reach = new Uint8Array(nx * nz);
  if (sx >= 0 && sz >= 0 && sx < nx && sz < nz && !blocked[sz * nx + sx]) {
    const q = [[sx, sz]]; reach[sz * nx + sx] = 1;
    while (q.length) {
      const [cx, cz] = q.pop();
      for (const [dx, dz] of FRONT) {
        const ax = cx + dx, az = cz + dz;
        if (ax < 0 || az < 0 || ax >= nx || az >= nz || blocked[az * nx + ax] || reach[az * nx + ax]) continue;
        reach[az * nx + ax] = 1; q.push([ax, az]);
      }
    }
  } else if (level.props.some((p) => p.type === 'door')) errors.push('The space in front of the exit door is blocked.');
  for (const p of level.props) {
    const c = CATALOG[p.type];
    if (!(c.container || c.hide || c.inscribe || c.feature)) continue;
    const r = rectOf(p);
    let ok = false;
    for (let iz = 0; iz < nz && !ok; iz++) for (let ix = 0; ix < nx && !ok; ix++) {
      if (reach[iz * nx + ix] && distToRect(-w / 2 + (ix + 0.5) * step, -d / 2 + (iz + 0.5) * step, r) <= 1.0) ok = true;
    }
    if (!ok) errors.push(`The player cannot walk up to the ${propName(p)}.`);
  }
  return { errors, spawn };
}

// ---------------------------------------------------------------- full check
export function checkLevel(level) {
  const errors = [], warnings = [];
  if (!THEMES[level.theme]) errors.push('Unknown theme.');
  const doors = level.props.filter((p) => p.type === 'door');
  if (doors.length !== 1) errors.push(doors.length ? 'A room can only have one exit door.' : 'The room needs an exit door.');
  const symbols = new Map(), codes = new Map();
  for (const p of level.props) {
    const cat = CATALOG[p.type];
    if (!cat) { errors.push(`Unknown prop type "${p.type}".`); continue; }
    const l = p.lock;
    if (cat.container && cat.container.must && !l) errors.push(`The ${propName(p)} needs a lock.`);
    if (!l) continue;
    if (!cat.container || !cat.container.locks.includes(l.type)) { errors.push(`The ${propName(p)} cannot carry a ${l.type} lock.`); continue; }
    if (l.symbol) { if (symbols.has(l.symbol)) errors.push(`Two locks share the ${symName(l)} symbol (${propName(symbols.get(l.symbol))} and ${propName(p)}).`); symbols.set(l.symbol, p); }
    if (l.type === 'digits') {
      const bad = codeFits(l.style, l.code || '');
      if (bad) errors.push(`${cat.name}: ${bad}`);
      else if (l.style === 'logic' && logicSolutions(l.rows || [], l.code.length).join() !== l.code) errors.push(`${cat.name}: the code-breaker lines do not single out the code.`);
      if (codes.has(l.code)) warnings.push(`Two padlocks share the code ${l.code}.`);
      codes.set(l.code, p);
    }
    if (l.type === 'dial' && !(Array.isArray(l.combo) && l.combo.length === 3 && l.combo.every((v) => Number.isInteger(v) && v >= 0 && v < 40))) errors.push(`${cat.name}: the dial needs three numbers from 0 to 39.`);
    if (l.type === 'wheel') {
      if (!l.candidates.includes(l.word)) errors.push(`${cat.name}: the password must be one of the code words.`);
      else if (remaining(l.candidates, l.constraints).join() !== l.word) errors.push(`${cat.name}: the word clues do not single out the password.`);
      for (const wd of l.candidates) { const pool = [...l.letters]; for (const ch of wd) { const i = pool.indexOf(ch); if (i < 0) { errors.push(`${cat.name}: the wheel is missing letters for ${wd}.`); break; } pool.splice(i, 1); } }
    }
    if (l.type === 'merge' && !solveMerge(l.board, l.board.pieces)) errors.push(`${cat.name}: the merge tray has no solution.`);
  }
  const load = {};
  if (level.photo && !(level.photo.diffs || []).every((x) => propById(level, x.prop))) errors.push('The photograph shows furniture that no longer exists. Remove the photograph puzzle and add it again.');
  if (!!level.photo !== level.things.some((t) => t.kind === 'photo')) errors.push('The photograph puzzle is incomplete. Remove it and add it again.');
  for (const t of level.things) {
    const owner = propById(level, t.for);
    if (t.kind !== 'photo' && (!owner || !owner.lock)) { errors.push('A clue or item belongs to a lock that no longer exists.'); continue; }
    const name = thingInfo(level, t).name;
    if (!t.at) { errors.push(t.kind === 'photo' ? 'The old photograph has not been placed anywhere.' : `"${name}" for the ${propName(owner)} has not been placed anywhere.`); continue; }
    const host = propById(level, t.at.prop);
    if (!host) { errors.push(`"${name}" is placed on a prop that no longer exists.`); continue; }
    if (slotFor(t, host, level) !== t.at.slot) { errors.push(`"${name}" cannot be placed at the ${propName(host)}.`); continue; }
    const k = t.at.prop + '/' + t.at.slot;
    load[k] = (load[k] || 0) + 1;
    if (load[k] === SLOT_CAP[t.at.slot] + 1) errors.push(`Too many things are placed at the ${propName(host)}.`);
  }
  const layout = checkLayout(level);
  errors.push(...layout.errors);
  const sol = solve(level);
  if (!sol.ok && doors.length === 1) errors.push(...(sol.stuck.length ? sol.stuck : ['The exit cannot be opened.']));
  if (sol.ok) {
    const idle = level.props.filter((p) => p.lock && !sol.prog.opened.has(p.id) && !canUnlock(level, p, sol.prog.known).ok);
    for (const p of idle) errors.push(`The ${propName(p)} can never be opened.`);
    for (const t of level.things) if (t.at && !sol.prog.known.has(t.id) && propById(level, t.at.prop)) errors.push(`"${thingInfo(level, t).name}" can never be found where it is (${propName(propById(level, t.at.prop))}).`);
    if (level.photo && !level.things.some((t) => t.at && t.at.slot === 'secret')) warnings.push('The photograph puzzle hides nothing yet: place something in a disturbed piece of furniture.');
  }
  return { ok: !errors.length, errors, warnings, steps: sol.steps, spawn: layout.spawn };
}

// ---------------------------------------------------------------- import / export / share
export function cleanLevel(level) {
  const out = JSON.parse(JSON.stringify(level));
  out.format = FORMAT;
  for (const p of out.props) { p.x = +(+p.x).toFixed(2); p.z = +(+p.z).toFixed(2); }
  return out;
}

export function parseLevel(text) {
  let level;
  try { level = typeof text === 'string' ? JSON.parse(text) : text; } catch (e) { throw new Error('That is not valid JSON.'); }
  if (!level || level.format !== FORMAT) throw new Error('This file is not an Escape the Fable level (format "' + FORMAT + '" expected).');
  if (!Array.isArray(level.props) || !Array.isArray(level.things) || !level.room) throw new Error('The level file is incomplete.');
  if (!THEMES[level.theme]) level.theme = 'detective';
  level.room = { w: Math.min(14, Math.max(4, +level.room.w || 7)), d: Math.min(14, Math.max(4, +level.room.d || 6)), h: 3 };
  level.props = level.props.filter((p) => p && CATALOG[p.type] && typeof p.id === 'string').map((p) => ({ ...p, x: +p.x || 0, z: +p.z || 0, rot: ((+p.rot || 0) % 4 + 4) % 4 }));
  level.things = level.things.filter((t) => t && typeof t.id === 'string' && ['key', 'tool', 'shape', 'clue', 'photo'].includes(t.kind));
  level.name = String(level.name || 'Untitled room').slice(0, 60);
  level.n = Math.max(level.n || 0, ...[...level.props, ...level.things].map((o) => +String(o.id).slice(1) || 0));
  return level;
}

const b64 = {
  enc: (bytes) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
  dec: (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0)),
};
async function pipe(bytes, stream) {
  const res = new Response(new Blob([bytes]).stream().pipeThrough(stream));
  return new Uint8Array(await res.arrayBuffer());
}
export async function encodeShare(level) {
  if (level.gen) return `seed=${level.gen.seed}&theme=${level.gen.theme}&diff=${level.gen.difficulty}`;
  const bytes = new TextEncoder().encode(JSON.stringify(cleanLevel(level)));
  return 'level=' + b64.enc(await pipe(bytes, new CompressionStream('deflate-raw')));
}
export async function decodeShare(code) {
  const bytes = await pipe(b64.dec(code), new DecompressionStream('deflate-raw'));
  return parseLevel(new TextDecoder().decode(bytes));
}
