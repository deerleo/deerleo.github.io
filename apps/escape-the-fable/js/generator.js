// Level generator. Works backwards from the exit: every lock needs "things" (keys, clue notes,
// carved pieces); each thing is either locked inside another container (a new lock, recursively)
// or left in a free spot. Because the chain is grown backwards as a tree it can never be circular,
// and the result is double-checked by the solver before it is returned.
import { RNG, hashStr, randomSeed } from './rng.js';
import { CATALOG, rectOf, FRONT, overlap } from './catalog.js';
import { THEMES, THEME_IDS, DIFFICULTY } from './themes.js';
import { newLevel, addProp, setLock, setClueStyle, setSplit, clearLock, removeProp, thingsFor, thingsAt, propById, placeTops, slotFor, SLOT_CAP, addPhoto, removePhoto } from './levelops.js';
import { checkLevel, checkLayout, snapToWall } from './manifest.js';

const HOST_CAP = { desk: 3, lab_bench: 4, side_table: 1 };

export function generate(opts = {}) {
  const seed = opts.seed ?? randomSeed();
  const pickRng = new RNG(hashStr('pick' + seed));
  const theme = THEMES[opts.theme] ? opts.theme : pickRng.pick(THEME_IDS);
  const difficulty = DIFFICULTY[opts.difficulty] ? opts.difficulty : pickRng.pick(['easy', 'medium', 'medium', 'hard']);
  for (let attempt = 0; attempt < 60; attempt++) {
    const rng = new RNG(hashStr(`${seed}/${theme}/${difficulty}/${attempt}`));
    const level = build(rng, theme, difficulty);
    if (!level || !layoutLevel(level, rng)) continue;
    if (!checkLevel(level).ok) continue;
    if (rng.chance(DIFFICULTY[difficulty].photo)) hidePhoto(level, rng);
    level.seed = seed;
    level.gen = { seed, theme, difficulty };
    return level;
  }
  throw new Error('Could not generate a level for seed ' + seed);
}

// Adds the spot-the-difference layer: something that sat in an ordinary hiding spot moves into a
// disturbed piece of furniture, and the photograph that gives it away takes its old place.
export function hidePhoto(level, rng) {
  const photo = addPhoto(level, rng);
  if (!photo) return false;
  const spots = level.photo.diffs.map((x) => propById(level, x.prop)).filter((p) => slotFor({ kind: 'key' }, p, level) === 'secret');
  const movable = rng.shuffle(level.things.filter((t) => t.at && t.at.slot === 'hidden' && t.kind !== 'photo'));
  if (!spots.length || !movable.length) { removePhoto(level); return false; }
  const thing = movable[0], was = thing.at;
  thing.at = { prop: rng.pick(spots).id, slot: 'secret' };
  photo.at = was;
  if (checkLevel(level).ok) return true;
  thing.at = was; removePhoto(level);
  return false;
}

// After the floor plan changes the old photograph no longer matches: take a new one and keep
// whatever was hidden behind it in play.
export function refreshPhoto(level, rng) {
  if (!level.photo) return;
  const old = level.things.find((t) => t.kind === 'photo'), at = old && old.at;
  const secrets = level.things.filter((t) => t.at && t.at.slot === 'secret');
  removePhoto(level);
  const photo = addPhoto(level, rng);
  const spots = photo ? level.photo.diffs.map((x) => propById(level, x.prop)).filter((p) => slotFor({ kind: 'key' }, p, level) === 'secret') : [];
  if (photo) photo.at = at;
  secrets.forEach((t, i) => {
    if (spots[i]) { t.at = { prop: spots[i].id, slot: 'secret' }; return; }
    const free = level.props.filter((p) => { const sl = slotFor(t, p); return sl && sl !== 'shown' && thingsAt(level, p.id, sl).length < SLOT_CAP[sl]; });
    const pick = free.find((p) => at && p.id === at.prop && !photo) || free.sort((x, y) => thingsAt(level, x.id).length - thingsAt(level, y.id).length)[0];
    t.at = pick ? { prop: pick.id, slot: slotFor(t, pick) } : null;
  });
  if (photo && !level.things.some((t) => t.at && t.at.slot === 'secret')) removePhoto(level);
}

function build(rng, themeId, difficulty) {
  const T = THEMES[themeId], D = DIFFICULTY[difficulty];
  const level = newLevel(themeId);
  level.difficulty = difficulty;
  level.name = `The ${rng.pick(T.titles[0])} ${rng.pick(T.titles[1])}`;
  const count = (type) => level.props.filter((p) => p.type === type).length;
  const avail = (pred, max = 1) => rng.shuffle(T.props.filter((t) => pred(CATALOG[t]) && count(t) < max));
  const pending = [];
  let inscribed = 0;

  const featureHost = (style) => avail((c) => c.feature === style)[0];
  const inscribeHost = () => (inscribed < 3 ? avail((c) => c.inscribe)[0] : null);
  const show = (thing, hostType) => { thing.at = { prop: addProp(level, hostType).id, slot: 'shown' }; if (CATALOG[hostType].inscribe) inscribed++; };

  function lockUp(prop, type, mustFeed) {
    if (type === 'digits' || type === 'dial') {
      // written-out answers are rare: codes arrive torn in two, or as code-breaker lines to reason out
      let style = rng.chance(type === 'dial' ? Math.max(0.65, D.torn) : D.torn) ? 'torn' : type === 'digits' ? 'logic' : 'plain', host = null;
      if (!mustFeed && rng.chance(0.55)) {
        const leafs = rng.shuffle(type === 'digits' ? ['clock', 'books', 'radio', 'inscribed'] : ['inscribed']);
        for (const s of leafs) { host = s === 'inscribed' ? inscribeHost() : featureHost(s); if (host) { style = s; break; } }
      }
      setLock(level, prop, type, rng, { style: style === 'inscribed' ? (type === 'digits' ? 'logic' : 'plain') : style });
      const made = thingsFor(level, prop.id);
      if (host) show(made[0], host); else pending.push(...made);
      return true;
    }
    if (!setLock(level, prop, type, rng, { split: (type === 'key' || type === 'tool') && rng.chance(D.split) })) return false;
    for (const t of thingsFor(level, prop.id)) {
      const host = t.kind === 'clue' && rng.chance(t.style === 'codebook' ? 0.4 : 0.3) ? inscribeHost() : null;
      if (host) show(t, host); else pending.push(t);
    }
    return true;
  }

  // ---- 1. plan the locks
  const nLocks = rng.int(D.locks[0], D.locks[1]);
  const doorType = rng.pick(['key', 'digits', 'wheel', 'key', 'digits']);
  const bag = (difficulty === 'easy' ? [rng.pick(['merge', 'wheel'])] : ['merge', 'wheel']).filter((t) => t !== doorType);
  const cap = { key: 2, digits: 2, dial: 1, tool: 2 }, used = { [doorType]: 1 };
  for (const f of rng.shuffle(['key', 'digits', 'dial', 'tool', 'key', 'digits', 'tool', 'dial'])) {
    if (bag.length >= nLocks - 1) break;
    if ((used[f] || 0) < cap[f]) { bag.push(f); used[f] = (used[f] || 0) + 1; }
  }
  const order = rng.shuffle(bag);
  const door = addProp(level, 'door');
  if (!lockUp(door, doorType, true)) return null;

  while (order.length && pending.length) {
    const type = order.pop();
    // the curio cabinet is the only home for the merge tray, so keep it free for that
    const types = avail((c) => c.container && !c.container.exit && c.container.locks.includes(type) && !(type === 'wheel' && c.id === 'curio' && order.includes('merge')));
    if (!types.length) continue;
    const thing = pending.splice(rng.int(0, pending.length - 1), 1)[0];
    const box = addProp(level, types[0]);
    thing.at = { prop: box.id, slot: 'holds' };
    if (!lockUp(box, type, order.length > 0 && pending.length === 0)) return null;
  }

  // ---- 2. everything still pending goes to a free spot (hiding places, unlocked furniture)
  for (const thing of rng.shuffle(pending)) {
    let spot = null;
    const hideTypes = avail((c) => c.hide, 1).concat(count('painting') === 1 && T.props.includes('painting') ? ['painting'] : []);
    const openTypes = avail((c) => c.container && !c.container.must && c.place !== 'top');
    if (hideTypes.length && (rng.chance(0.8) || !openTypes.length)) spot = addProp(level, hideTypes[0]);
    else if (openTypes.length) spot = addProp(level, openTypes[0]);
    else {
      const shared = rng.shuffle(level.props.filter((p) => { const s = slotFor(thing, p); return s && s !== 'shown' && !p.lock && thingsAt(level, p.id, s).length < SLOT_CAP[s] && !thingsAt(level, p.id).some((o) => o.for === thing.for); }));
      if (!shared.length) return null;
      spot = shared[0];
    }
    thing.at = { prop: spot.id, slot: slotFor(thing, spot) };
  }

  // ---- 3. dress the room: theme signature pieces, then a little decor
  for (const t of T.must) if (!count(t)) addProp(level, t);
  const decor = rng.shuffle(T.props.filter((t) => { const c = CATALOG[t]; return !count(t) && !c.container && c.place !== 'top'; }));
  const floorCount = () => level.props.filter((p) => CATALOG[p.type].place !== 'top').length;
  const target = { easy: 12, medium: 15, hard: 18 }[difficulty];
  while (floorCount() < target && decor.length) addProp(level, decor.pop());
  if (count('desk') && !count('chair')) addProp(level, 'chair');
  for (const t of rng.shuffle(T.props.filter((t) => { const c = CATALOG[t]; return c.place === 'top' && !count(t) && !c.container && !c.inscribe && !c.feature; })).slice(0, 3)) addProp(level, t);

  // ---- 4. seat table-top props on hosts
  const tops = level.props.filter((p) => CATALOG[p.type].place === 'top');
  const load = new Map();
  for (const top of tops) {
    let hosts = level.props.filter((p) => CATALOG[p.type].host && (load.get(p.id) || []).length < HOST_CAP[p.type]);
    if (!hosts.length) {
      const cat = CATALOG[top.type];
      if (!cat.container && !cat.inscribe && !cat.feature) { removeProp(level, top.id); continue; }
      hosts = [addProp(level, T.props.includes('side_table') ? 'side_table' : 'desk')];
    }
    const host = rng.pick(hosts);
    top.on = host.id;
    load.set(host.id, [...(load.get(host.id) || []), top]);
  }
  for (const [hid, list] of load) {
    const host = propById(level, hid), w = CATALOG[host.type].w, capN = HOST_CAP[host.type];
    const slots = rng.shuffle([...Array(capN).keys()]);
    list.forEach((top, i) => { top.ox = +(((slots[i] + 0.5) / capN - 0.5) * (w - 0.2)).toFixed(2); });
  }
  level.intro = T.intro;
  return level;
}

// ---------------------------------------------------------------- layout
// Furniture that "hugs" goes against the walls facing in; the rest floats in the middle.
// Each interactive prop reserves a clear strip in front of itself so the player can reach it.
export function layoutLevel(level, rng, keepSize = false) {
  const floor = level.props.filter((p) => CATALOG[p.type].place !== 'top');
  const perimeterNeed = floor.reduce((s, p) => { const c = CATALOG[p.type]; return s + (c.place === 'wall' || c.hug ? c.w + 0.45 : 0); }, 0);
  const areaNeed = floor.reduce((s, p) => { const c = CATALOG[p.type]; return s + (c.place === 'floor' ? c.w * c.d : 0); }, 0);
  let side = Math.max(5.6, perimeterNeed / 4 / 0.64, Math.sqrt(areaNeed * 4.2));
  const ratio = rng.range(1, 1.3);
  for (let attempt = 0; attempt < 80; attempt++) {
    if (!keepSize) {
      if (attempt % 12 === 11) side *= 1.06;
      level.room = { w: +Math.min(13, side * ratio).toFixed(1), d: +Math.min(13, side / ratio).toFixed(1), h: 3 };
    }
    if (tryLayout(level, rng) && !checkLayout(level).errors.length) return true;
  }
  return false;
}

function tryLayout(level, rng) {
  const { w, d } = level.room;
  const bodies = [], zones = [];
  const needsAccess = (c) => c.container || c.hide || c.inscribe || c.feature;
  const zoneOf = (p, depth) => {
    const r = rectOf(p), f = FRONT[p.rot];
    return { x0: f[0] < 0 ? r.x0 - depth : f[0] > 0 ? r.x1 : r.x0, x1: f[0] > 0 ? r.x1 + depth : f[0] < 0 ? r.x0 : r.x1, z0: f[1] < 0 ? r.z0 - depth : f[1] > 0 ? r.z1 : r.z0, z1: f[1] > 0 ? r.z1 + depth : f[1] < 0 ? r.z0 : r.z1 };
  };
  const fits = (p, pad, zone) => {
    const r = rectOf(p, pad);
    if (r.x0 < -w / 2 + pad || r.x1 > w / 2 - pad || r.z0 < -d / 2 + pad || r.z1 > d / 2 - pad) return false;
    if (bodies.some((b) => overlap(r, b)) || zones.some((z) => overlap(r, z))) return false;
    return !(zone && bodies.some((b) => overlap(zone, b)));
  };
  const commit = (p, zone) => { bodies.push(rectOf(p, 0.05)); if (zone) zones.push(zone); };

  const all = level.props.filter((p) => CATALOG[p.type].place !== 'top' && CATALOG[p.type].place !== 'rug');
  const walled = all.filter((p) => { const c = CATALOG[p.type]; return c.place === 'wall' || c.hug; });
  const free = all.filter((p) => !walled.includes(p) && p.type !== 'chair');
  const chairs = all.filter((p) => p.type === 'chair');
  // door first, then widest pieces
  const order = rng.shuffle(walled).sort((a, b) => (b.type === 'door') - (a.type === 'door') || CATALOG[b.type].w - CATALOG[a.type].w);
  for (const p of order) {
    const c = CATALOG[p.type];
    let done = false;
    for (let i = 0; i < 90 && !done; i++) {
      const wall = rng.pick(['N', 'S', 'E', 'W']), len = wall === 'N' || wall === 'S' ? w : d;
      const margin = c.w / 2 + (p.type === 'door' ? 0.6 : 0.12);
      if (len < margin * 2) continue;
      const t = rng.range(-len / 2 + margin, len / 2 - margin);
      p.x = wall === 'N' || wall === 'S' ? t : 0; p.z = wall === 'E' || wall === 'W' ? t : 0;
      // position on the wall plane (snapToWall clamps and sets rot)
      if (wall === 'N') p.z = -d / 2; if (wall === 'S') p.z = d / 2; if (wall === 'W') p.x = -w / 2; if (wall === 'E') p.x = w / 2;
      snapToWall(level, p, wall);
      const zone = needsAccess(c) ? zoneOf(p, p.type === 'door' ? 1.5 : 0.85) : zoneOf(p, 0.3);
      if (fits(p, 0, zone)) { commit(p, zone); done = true; }
    }
    if (!done) return false;
  }
  for (const p of rng.shuffle(free).sort((a, b) => CATALOG[b.type].w - CATALOG[a.type].w)) {
    const c = CATALOG[p.type];
    let done = false;
    for (let i = 0; i < 120 && !done; i++) {
      p.rot = rng.int(0, 3);
      const edge = 1.0 + Math.max(c.w, c.d) / 2;
      if (w / 2 - edge < 0 || d / 2 - edge < 0) { p.x = 0; p.z = 0; } else { p.x = rng.range(-w / 2 + edge, w / 2 - edge); p.z = rng.range(-d / 2 + edge, d / 2 - edge); }
      const zone = needsAccess(c) ? zoneOf(p, 0.8) : null;
      if (fits(p, 0.3, zone)) { commit(p, zone); done = true; }
    }
    if (!done) return false;
  }
  // chairs tuck in at desks where they can, otherwise stand free
  const desks = rng.shuffle(level.props.filter((p) => p.type === 'desk'));
  for (const ch of chairs) {
    let done = false;
    const desk = desks.pop();
    if (desk) {
      const a = (desk.rot * Math.PI) / 2, ox = -0.32, oz = 0.6;
      ch.x = desk.x + ox * Math.cos(a) + oz * Math.sin(a); ch.z = desk.z - ox * Math.sin(a) + oz * Math.cos(a); ch.rot = (desk.rot + 2) % 4;
      const r = rectOf(ch);
      if (!bodies.some((b) => overlap(r, b)) && Math.abs(ch.x) < w / 2 - 0.4 && Math.abs(ch.z) < d / 2 - 0.4) { commit(ch, null); done = true; }
    }
    for (let i = 0; i < 80 && !done; i++) {
      ch.rot = rng.int(0, 3); ch.x = rng.range(-w / 2 + 0.8, w / 2 - 0.8); ch.z = rng.range(-d / 2 + 0.8, d / 2 - 0.8);
      if (fits(ch, 0.25, null)) { commit(ch, null); done = true; }
    }
    if (!done) return false;
  }
  for (const rug of level.props.filter((p) => p.type === 'rug')) {
    const c = CATALOG.rug, anchor = level.props.find((p) => p.type === 'desk' || p.type === 'armchair' || p.type === 'sofa');
    rug.rot = w >= d ? 0 : 1;
    const hw = (rug.rot ? c.d : c.w) / 2 + 0.15, hd = (rug.rot ? c.w : c.d) / 2 + 0.15;
    rug.x = Math.max(-w / 2 + hw, Math.min(w / 2 - hw, (anchor ? anchor.x * 0.5 : 0) + rng.range(-0.4, 0.4)));
    rug.z = Math.max(-d / 2 + hd, Math.min(d / 2 - hd, (anchor ? anchor.z * 0.5 : 0) + rng.range(-0.4, 0.4)));
  }
  for (const p of level.props) { p.x = +p.x.toFixed(2); p.z = +p.z.toFixed(2); }
  placeTops(level);
  return true;
}

// ---------------------------------------------------------------- SCAMPER remix
// Each operator takes a solvable level and returns a different, still-solvable variation (or null).
const clone = (l) => JSON.parse(JSON.stringify(l));
const relocate = (level, rng, thing) => {
  const spots = rng.shuffle(level.props.filter((p) => {
    const s = slotFor(thing, p);
    return s && s !== 'shown' && s !== 'secret' && !(thing.at && thing.at.prop === p.id) && thingsAt(level, p.id, s).length < (s === 'hidden' ? 1 : 2);
  }));
  // prefer spots that are not being used yet
  spots.sort((a, b) => thingsAt(level, a.id).length - thingsAt(level, b.id).length);
  if (!spots.length) return false;
  thing.at = { prop: spots[0].id, slot: slotFor(thing, spots[0]) };
  return true;
};

export const SCAMPER = {
  S: { name: 'Substitute', tip: 'Swap furniture for different pieces that do the same job', run(level, rng) {
    const T = THEMES[level.theme];
    const same = (a, b) => { const A = CATALOG[a], B = CATALOG[b]; return a !== b && A.place === B.place && !!A.hide === !!B.hide && !!A.inscribe === !!B.inscribe && A.feature === B.feature && !!A.host === !!B.host && !A.container && !B.container; };
    let swaps = 0;
    for (const p of rng.shuffle(level.props)) {
      if (p.type === 'door' || level.props.some((q) => q.on === p.id)) continue;
      const lockType = p.lock && p.lock.type, cat = CATALOG[p.type];
      const options = T.props.filter((t) => !level.props.some((q) => q.type === t) && (cat.container ? CATALOG[t].container && !CATALOG[t].container.exit && CATALOG[t].place === cat.place && (lockType ? CATALOG[t].container.locks.includes(lockType) : !CATALOG[t].container.must) : same(p.type, t)));
      if (!options.length) continue;
      p.type = rng.pick(options);
      if (++swaps >= 4) break;
    }
    return swaps > 0 && layoutLevel(level, rng);
  } },
  C: { name: 'Combine', tip: 'Break a key or tear a note in two, so two finds must be combined', run(level, rng) {
    const p = rng.shuffle(level.props.filter((q) => q.lock && ((['digits', 'dial'].includes(q.lock.type) && ['plain', 'logic'].includes(q.lock.style) && thingsFor(level, q.id)[0].at.slot !== 'shown') || (['key', 'tool'].includes(q.lock.type) && !q.lock.split))))[0];
    if (!p) return false;
    const [, b] = ['key', 'tool'].includes(p.lock.type) ? setSplit(level, p, true) : setClueStyle(level, p, 'torn', rng);
    return relocate(level, rng, b);
  } },
  A: { name: 'Adapt', tip: 'Adapt a written code into the room itself: a clock, a bookshelf, a radio dial', run(level, rng) {
    const T = THEMES[level.theme];
    for (const p of rng.shuffle(level.props.filter((q) => q.lock && q.lock.type === 'digits' && ['plain', 'torn', 'logic'].includes(q.lock.style) && thingsFor(level, q.id).every((t) => t.at.slot !== 'shown')))) {
      for (const style of rng.shuffle(['clock', 'books', 'radio'])) {
        if (level.things.some((t) => t.style === style)) continue;
        const hostType = rng.shuffle(T.props.filter((t) => CATALOG[t].feature === style))[0];
        if (!hostType) continue;
        let host = level.props.find((q) => q.type === hostType) || addProp(level, hostType);
        if (CATALOG[hostType].place === 'top') {
          const hosts = level.props.filter((q) => CATALOG[q.type].host);
          if (!hosts.length) continue;
          host.on = hosts[0].id; host.ox = 0;
        }
        const [t] = setClueStyle(level, p, style, rng);
        t.at = { prop: host.id, slot: 'shown' };
        return layoutLevel(level, rng);
      }
    }
    return false;
  } },
  M: { name: 'Modify', tip: 'Magnify the challenge: longer codes, harder tray, an extra word clue', run(level, rng) {
    const opts = rng.shuffle(level.props.filter((q) => q.lock && (q.lock.type === 'merge' || q.lock.type === 'wheel' || (q.lock.type === 'digits' && q.lock.code.length === 3 && ['plain', 'torn', 'logic'].includes(q.lock.style)))));
    const p = opts[0];
    if (!p) return false;
    if (p.lock.type === 'digits') { p.lock.code = ''; p.lock.n = 4; const at = thingsFor(level, p.id).map((t) => t.at); setClueStyle(level, p, p.lock.style, rng).forEach((t, i) => (t.at = at[i])); return true; }
    const old = thingsFor(level, p.id), symbol = p.lock.symbol, type = p.lock.type;
    const places = old.map((t) => t.at);
    const ok = type === 'merge' ? setLock(level, p, 'merge', rng, { symbol, level: 2, sockets: Math.min(3, old.length + 1) }) : setLock(level, p, 'wheel', rng, { symbol, cands: 6, cons: 3 });
    if (!ok) return false;
    return thingsFor(level, p.id).every((t, i) => { if (places[i]) { t.at = places[i]; return true; } return relocate(level, rng, t); });
  } },
  P: { name: 'Put to other use', tip: 'Give idle furniture a job: move a hidden thing to a spot nobody is using', run(level, rng) {
    const movable = rng.shuffle(level.things.filter((t) => t.at && t.at.slot === 'hidden'));
    const idle = rng.shuffle(level.props.filter((p) => CATALOG[p.type].hide && !thingsAt(level, p.id).length));
    if (!movable.length) return false;
    if (!idle.length) {
      const T = THEMES[level.theme];
      const type = rng.shuffle(T.props.filter((t) => CATALOG[t].hide && !level.props.some((q) => q.type === t)))[0];
      if (!type) return false;
      idle.push(addProp(level, type));
      movable[0].at = { prop: idle[0].id, slot: 'hidden' };
      return layoutLevel(level, rng);
    }
    movable[0].at = { prop: idle[0].id, slot: 'hidden' };
    return true;
  } },
  E: { name: 'Eliminate', tip: 'Strip it back: remove one lock from the chain and clear out idle decor', run(level, rng) {
    const p = rng.shuffle(level.props.filter((q) => q.lock && q.type !== 'door' && !CATALOG[q.type].container.must))[0];
    if (p) clearLock(level, p);
    const idle = rng.shuffle(level.props.filter((q) => { const c = CATALOG[q.type]; return q.type !== 'door' && !q.lock && !thingsAt(level, q.id).length && !level.props.some((o) => o.on === q.id) && !c.host; })).slice(0, 2);
    idle.forEach((q) => removeProp(level, q.id));
    return !!p || idle.length > 0;
  } },
  R: { name: 'Rearrange', tip: 'Reverse and rearrange: a fresh floor plan for the same puzzle', run(level, rng) {
    return layoutLevel(level, rng);
  } },
};

export function scamper(level, op, seed = randomSeed()) {
  for (let i = 0; i < 12; i++) {
    const copy = clone(level);
    delete copy.gen;
    const rng = new RNG(hashStr(`${op}/${seed}/${i}`));
    try { if (SCAMPER[op].run(copy, rng)) { refreshPhoto(copy, rng); if (checkLevel(copy).ok) return copy; } } catch (e) { /* try another variation */ }
  }
  return null;
}
