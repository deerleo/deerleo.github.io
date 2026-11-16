// A play session: first-person exploration, interaction, inventory, notebook and hints.
import * as THREE from 'three';
import { CATALOG } from './catalog.js';
import { THEMES } from './themes.js';
import { SYMBOLS } from './symbols.js';
import { propById, thingsFor, thingsAt, photoDiff, canSecret } from './levelops.js';
import { notebookUI, pending } from './notebook.js';
import { thingInfo, propName, lockSummary, newProgress, canUnlock, possibleActions, checkLevel, encodeShare } from './manifest.js';
import { World } from './world.js';
import { Player } from './player.js';
import { el, $, openModal, closeModal, modalOpen, toast, thingIcon, symbolSVG, sfx } from './ui.js';
import { digitsUI, dialUI, wheelUI } from './lockui.js';
import { mergeUI } from './mergeui.js';

const fmtTime = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export class Game {
  constructor(app, level, opts = {}) {
    this.app = app; this.level = level; this.opts = opts;
    this.theme = THEMES[level.theme];
    this.world = new World(level);
    this.camera = new THREE.PerspectiveCamera(68, 1, 0.05, 60);
    this.player = new Player(this.camera, app.canvas);
    this.player.place(checkLevel(level).spawn);
    this.ray = new THREE.Raycaster();
    this.prog = newProgress();
    this.carry = []; this.notes = []; this.lockState = {}; this.hintLevel = {}; this.hints = 0;
    // notebook work: solved code-breakers, pieced notes, joined halves, crossed-out words, photograph
    this.worked = new Set(); this.pieced = new Set(); this.joined = new Set(); this.struck = {}; this.sheet = {}; this.photoFound = new Set(); this.photoDone = false;
    this.time = 0; this.won = false; this.started = false; this.target = null;
    this.totalLocks = level.props.filter((p) => p.lock).length;
    this.handlers = [];
    const on = (t, ev, fn) => { t.addEventListener(ev, fn); this.handlers.push(() => t.removeEventListener(ev, fn)); };
    on(document, 'keydown', (e) => this.key(e));
    on(app.canvas, 'click', () => this.click());
    on(document, 'pointerlockchange', () => this.refreshHud());
    this.buildHud();
    this.showIntro();
  }

  // ---------------------------------------------------------------- HUD
  buildHud() {
    const hud = $('#hud');
    hud.hidden = false;
    this.ui = {
      prompt: el('div', { id: 'prompt' }),
      inv: el('div', { id: 'inv' }),
      timer: el('span', { class: 'timer' }, '0:00'),
      locks: el('span', { class: 'locks' }),
      resume: el('div', { id: 'resume' }, el('div', {}, el('b', {}, 'Click to look around'), el('span', {}, 'WASD move · mouse look · E / click interact · N notebook · I inventory · H hint · Esc release mouse'))),
    };
    hud.replaceChildren(
      el('div', { id: 'topbar' }, el('div', { class: 'title' }, el('b', {}, this.level.name), el('span', {}, `${this.theme.name}, ${this.theme.year}`)), this.ui.locks, this.ui.timer,
        (this.ui.nb = el('button', { class: 'btn small', onclick: () => this.notebook() }, 'Notebook (N)')), (this.ui.ib = el('button', { class: 'btn small', onclick: () => this.notebook('items') }, 'Inventory (I)')), el('button', { class: 'btn small', onclick: () => this.hint() }, 'Hint (H)'), el('button', { class: 'btn small', onclick: () => this.quitPrompt() }, this.opts.fromEditor ? 'Back to workshop' : 'Menu')),
      el('div', { id: 'crosshair' }), this.ui.prompt, this.ui.inv, this.ui.resume);
    this.refreshHud();
  }
  refreshHud() {
    if (!this.ui || this.dead) return;
    const done = this.level.props.filter((p) => p.lock && this.prog.opened.has(p.id)).length;
    this.ui.locks.textContent = `Locks opened ${done}/${this.totalLocks}`;
    const items = this.items(), todo = pending(this);
    this.ui.inv.replaceChildren(...(items.length ? items.map((it) => el('button', { class: 'chip' + (it.partner ? ' can' : ''), title: it.partner ? 'Can be joined with the ' + it.partner.name.toLowerCase() + ' (press I)' : it.info.lines[0], onclick: () => this.notebook('items') }, el('span', { html: thingIcon(it.t, it.info, 30) }), it.info.name, it.partner ? el('i', {}, '⚙') : null)) : [el('span', { class: 'empty' }, 'Pockets empty')]));
    this.ui.nb.classList.toggle('ping', todo.notes > 0);
    this.ui.ib.classList.toggle('ping', todo.items > 0);
    this.ui.resume.hidden = !this.started || this.won || modalOpen() || this.player.locked;
    $('#crosshair').hidden = !this.player.locked;
  }
  thing(id) { return this.level.things.find((t) => t.id === id); }
  // What the player is carrying, as shown: joined halves appear as the whole object.
  items() {
    const out = [];
    for (const id of this.carry) {
      const t = this.thing(id);
      if (t.half && this.joined.has(t.for)) { if (t.half === 'a') { const whole = { ...t, half: undefined }; out.push({ t: whole, info: thingInfo(this.level, whole) }); } continue; }
      const mate = t.half && this.carry.map((x) => this.thing(x)).find((o) => o.for === t.for && o.kind === t.kind && o.half && o.half !== t.half);
      out.push({ t, info: thingInfo(this.level, t), partner: mate ? thingInfo(this.level, mate) : null });
    }
    return out;
  }
  join(pid) {
    this.joined.add(pid);
    sfx('merge');
    const t = thingsFor(this.level, pid).find((x) => x.half === 'a');
    toast(`The two halves click together: you now have the ${thingInfo(this.level, { ...t, half: undefined }).name.toLowerCase()}.`);
    this.refreshHud();
  }
  say(msg) { toast(msg); }

  // ---------------------------------------------------------------- modals
  modal(content, o = {}) {
    this.player.enabled = false;
    this.player.unlock();
    openModal(content, { ...o, onClose: () => { if (o.onClose) o.onClose(); this.resume(); } });
    this.refreshHud();
  }
  resume() {
    if (this.won || modalOpen()) return;
    this.player.enabled = true;
    this.player.lock();
    setTimeout(() => this.refreshHud(), 60);
  }
  showIntro() {
    const ok = () => { this.started = true; closeModal(); };
    this.modal(el('div', { class: 'intro' },
      el('p', { class: 'kicker' }, `${this.theme.name} · ${this.theme.year}`), el('h1', {}, this.level.name), el('p', { class: 'story' }, this.level.intro || this.theme.intro),
      el('ul', { class: 'howto' },
        el('li', { html: '<b>Look closely.</b> Walk up to anything and press <kbd>E</kbd> or click to open, search or examine it.' }),
        el('li', { html: `<b>Follow the symbols.</b> Every lock carries a mark like ${symbolSVG('star', 18)} or ${symbolSVG('moon', 18)}. A clue with the same mark belongs to that lock, and only that lock.` }),
        el('li', { html: '<b>Nothing is a guess.</b> Every code can be worked out from what is in the room. Your <kbd>N</kbd> notebook records each clue you find.' }),
        el('li', { html: 'Stuck? <kbd>H</kbd> gives a gentle nudge first, and spells it out only if you keep asking.' })),
      el('button', { class: 'btn primary big', autofocus: true, onclick: ok }, 'Begin')), { sticky: true, onClose: () => { this.started = true; } });
  }
  paper(t, extra) {
    const info = thingInfo(this.level, t);
    return el('div', { class: 'paper' + (t.kind === 'clue' && t.at.slot !== 'shown' ? ' note' : '') + (t.style === 'logic' ? ' mono' : '') }, info.symbol ? el('span', { class: 'stamp', html: symbolSVG(info.symbol, 44), title: `Marked with a ${SYMBOLS[info.symbol].name.toLowerCase()}` }) : null,
      t.kind !== 'clue' ? el('span', { class: 'bigicon', html: thingIcon(t, info, 64) }) : null, el('h3', {}, info.title), ...info.lines.map((l) => el('p', {}, l)), extra || null);
  }
  showThing(t) { this.modal(el('div', {}, this.paper(t), el('button', { class: 'btn primary', autofocus: true, onclick: () => closeModal() }, 'OK'))); }
  found(things, heading) {
    sfx('found');
    this.modal(el('div', { class: 'found' }, el('p', { class: 'kicker' }, heading), el('h2', {}, things.length > 1 ? 'You found a few things' : 'You found something'), el('div', { class: 'papers' }, things.map((t) => this.paper(t))),
      el('p', { class: 'sub' }, things.some((t) => t.kind === 'photo') ? 'The photograph is tucked into your notebook (N). Study it there.' : things.some((t) => t.style === 'logic') ? 'Copied into your notebook (N), where you can work it out.' : things.some((t) => t.kind === 'clue') ? 'Clues are copied into your notebook (N).' : things.some((t) => t.half) ? 'It goes into your pocket. It looks like half of something (I).' : 'It goes into your pocket (I).'), el('button', { class: 'btn primary', autofocus: true, onclick: () => closeModal() }, 'Take it')));
  }
  notebook(tab = 'clues') {
    if (!this.started || this.won) return;
    this.modal(notebookUI(this, tab), { wide: true });
  }

  // ---------------------------------------------------------------- interaction
  key(e) {
    if (this.won) return;
    if (modalOpen()) {
      if ((e.code === 'KeyN' || e.code === 'KeyI' || e.code === 'Tab') && $('#panel .notebook')) { e.preventDefault(); return closeModal(); }
      if (e.code === 'Escape' || ((e.code === 'KeyE' || e.code === 'Enter') && !e.target.closest('.lockui') && !$('#panel .notebook'))) { if ($('#modal').dataset.sticky && e.code === 'Escape') return; e.preventDefault(); if (e.code !== 'Escape') { const b = $('#panel .btn.primary'); if (b) return b.click(); } closeModal(); }
      return;
    }
    if (!this.started) return;
    if (e.code === 'KeyE' || e.code === 'Space') { e.preventDefault(); this.interact(); }
    else if (e.code === 'KeyN' || e.code === 'Tab') { e.preventDefault(); this.notebook(); }
    else if (e.code === 'KeyI') this.notebook('items');
    else if (e.code === 'KeyH') this.hint();
  }
  click() {
    if (!this.started || this.won || modalOpen()) return;
    if (!this.player.locked) { this.player.enabled = true; this.player.lock(); setTimeout(() => this.refreshHud(), 60); return; }
    this.interact();
  }
  promptFor(p) {
    const { def, cat } = p;
    if (cat.container) return this.prog.opened.has(def.id) ? null : def.lock ? `Inspect the lock on the ${propName(def)}` : `Open the ${propName(def)}`;
    if (cat.hide) return this.prog.searched.has(def.id) ? null : cat.hide;
    if (this.disturbed(def)) return `Search the ${propName(def)}`;
    if (thingsAt(this.level, def.id, 'shown').length) return `Examine the ${propName(def)}`;
    return `Look at the ${propName(def)}`;
  }
  // furniture the photograph has given away, not yet searched
  disturbed(def) { return this.photoDone && canSecret(CATALOG[def.type]) && photoDiff(this.level, def.id) && !this.prog.searched.has(def.id); }
  interact() {
    const p = this.target;
    if (!p) return;
    const { def, cat } = p, level = this.level;
    sfx('click');
    if (this.disturbed(def)) {
      this.prog.searched.add(def.id);
      const got = thingsAt(level, def.id, 'secret');
      return got.length ? this.collect(got, `You search the ${propName(def)}…`) : this.say(`The ${propName(def)} has been moved, but nothing is hidden here.`);
    }
    if (cat.container) {
      if (this.prog.opened.has(def.id)) return this.say(`The ${propName(def)} is open and empty now.`);
      return def.lock ? this.tryLock(def) : this.open(def);
    }
    if (cat.hide) {
      if (this.prog.searched.has(def.id)) return this.say('Nothing else here.');
      this.prog.searched.add(def.id);
      this.world.animate(def.id, 'search');
      const got = thingsAt(level, def.id, 'hidden');
      return got.length ? this.collect(got, cat.hide + '…') : this.say(`${cat.hide}… nothing but dust.`);
    }
    const shown = thingsAt(level, def.id, 'shown')[0];
    if (shown) {
      const fresh = !this.prog.known.has(shown.id);
      if (fresh) { this.prog.known.add(shown.id); this.notes.push(shown.id); }
      return this.modal(el('div', {}, el('p', { class: 'kicker' }, CATALOG[def.type].name), this.paper(shown), fresh ? el('p', { class: 'sub' }, 'Copied into your notebook (N).') : null, el('button', { class: 'btn primary', autofocus: true, onclick: () => closeModal() }, 'OK')));
    }
    this.say(cat.desc);
  }
  collect(things, heading) {
    for (const t of things) { this.prog.known.add(t.id); (t.kind === 'clue' || t.kind === 'photo' ? this.notes : this.carry).push(t.id); }
    this.refreshHud();
    if (things.some((t) => t.half) && this.items().some((i) => i.partner)) setTimeout(() => toast('Two of the pieces in your pocket look as if they belong together. Press I.', 5000), 400);
    this.found(things, heading);
  }
  tryLock(def) {
    const lock = def.lock, level = this.level, st = (this.lockState[def.id] = this.lockState[def.id] || {});
    this.lockState[def.id + '/seen'] = true;
    const solved = () => { closeModal(); this.open(def); };
    if (lock.type === 'key' || lock.type === 'tool') {
      const r = canUnlock(level, def, this.prog.known);
      if (!r.ok) { sfx('wrong'); return this.say(lock.type === 'key' ? `Locked. The keyhole plate is stamped with a ${SYMBOLS[lock.symbol].name.toLowerCase()}: you need the key with the same mark.` : def.type === 'crate' ? 'Nailed shut. You need something to pry it open.' : 'Four screws hold the grille. You need something to undo them.'); }
      if (lock.split && !this.joined.has(def.id)) { sfx('wrong'); return this.say('You hold both broken halves, but they are no use apart. Join them in your inventory first (press I).'); }
      const used = { ...thingsFor(level, def.id).find((t) => t.kind === lock.type), half: undefined };
      this.carry = this.carry.filter((id) => { const t = this.thing(id); return !(t.for === def.id && t.kind === lock.type); });
      sfx('unlock');
      this.say(lock.type === 'key' ? `The ${SYMBOLS[lock.symbol].name.toLowerCase()} key turns with a clunk.` : `The ${thingInfo(level, used).name.toLowerCase()} does the job.`);
      return this.open(def);
    }
    if (lock.type === 'digits') return this.modal(digitsUI(lock, st, solved));
    if (lock.type === 'dial') return this.modal(dialUI(lock, st, solved));
    if (lock.type === 'wheel') return this.modal(wheelUI(lock, st, solved));
    if (lock.type === 'merge') {
      const owned = new Set(thingsFor(level, def.id).filter((t) => t.kind === 'shape' && this.prog.known.has(t.id)).map((t) => t.piece));
      return this.modal(mergeUI(lock, st, owned, () => { this.carry = this.carry.filter((id) => this.thing(id).for !== def.id); solved(); }), { wide: true });
    }
  }
  open(def) {
    this.prog.opened.add(def.id);
    this.world.animate(def.id, 'open');
    this.refreshHud();
    if (CATALOG[def.type].container.exit) return this.win();
    const got = thingsAt(this.level, def.id, 'holds');
    if (got.length) setTimeout(() => this.collect(got, `Inside the ${propName(def)}`), def.lock ? 650 : 450);
    else this.say(`The ${propName(def)} is empty.`);
  }

  // ---------------------------------------------------------------- hints
  hint() {
    if (!this.started || this.won) return;
    const acts = possibleActions(this.level, this.prog);
    const a = acts.find((x) => x.type === 'open' && x.prop.lock) || acts.find((x) => x.type !== 'open') || acts[0];
    const names = this.level.photo ? this.level.photo.diffs.map((d) => propName(propById(this.level, d.prop))) : [];
    let text = 'You have done everything there is to do here.', lvl = 1;
    if (a) {
      const k = a.type + a.prop.id;
      lvl = this.hintLevel[k] = Math.min(3, (this.hintLevel[k] || 0) + 1);
      const name = propName(a.prop), lock = a.prop.lock, cat = CATALOG[a.prop.type];
      if (a.type === 'open' && lock) {
        const sym = lock.symbol ? SYMBOLS[lock.symbol].name.toLowerCase() : null;
        const halves = lock.split && !this.joined.has(a.prop.id) ? 'Join the two broken halves in your inventory first (I). Then: ' : '';
        const how = halves + { key: 'Use the key with the matching mark.', tool: 'Use the tool you are carrying.', digits: { logic: 'Work through the code-breaker lines in your notebook. Start with a line that scores "none": those digits are out.', clock: 'Read the stopped clock as digits: hour, then minutes.', books: 'Count the books of each colour, in the order shown on the plaque.', radio: 'The radio frequency is the combination.', plain: 'The combination is written in your notebook.', torn: 'Put the two halves of the torn note together.' }[lock.style], dial: lock.style === 'torn' ? 'Put the two halves of the torn note together.' : 'The three turns are written in your notebook.', wheel: 'Go through the code words one at a time and cross out every word that breaks one of the clues. Only one survives.', merge: 'Place the carved pieces, then fuse identical solids until one remains. The tray has its own hint button.' }[lock.type];
        text = [sym ? `You already hold everything needed for the lock marked with the ${sym}.` : 'Something you are carrying can open one of the obstacles in this room.', `It is the ${name}. ${how}`, `Open the ${name}: ${lockSummary(this.level, a.prop)}.`][lvl - 1];
      } else if (a.type === 'open') text = ['Not everything in this room is locked.', `Have you opened the ${name}?`, `Open the ${name}.`][lvl - 1];
      else if (a.type === 'secret') text = this.photoDone ? ['The photograph showed you which furniture was disturbed. Have you searched all of it?', `Take a closer look at the ${name}.`, `Search the ${name}.`][lvl - 1] : ['Something in your notebook deserves a closer look.', 'Study the old photograph in your notebook and compare it with the room as it is now.', `In the photograph, the ${names.join(', the ')} are not where they are now. Click them, then search the ${name}.`][lvl - 1];
      else if (a.type === 'search') text = ['Something is still hidden in the room. Search the furniture.', `Take a closer look at the ${name}.`, `${cat.hide}.`][lvl - 1];
      else text = ['A clue is sitting in plain sight that you have not examined yet.', `Take a closer look at the ${name}.`, `Examine the ${name}.`][lvl - 1];
    }
    this.hints++;
    this.modal(el('div', { class: 'hint' }, el('p', { class: 'kicker' }, `Hint · strength ${lvl} of 3`), el('h2', {}, text), el('p', { class: 'sub' }, lvl < 3 ? 'Ask again for a stronger hint about the same step.' : 'That is as plain as it gets.'), el('button', { class: 'btn primary', autofocus: true, onclick: () => closeModal() }, 'Thanks')));
  }

  // ---------------------------------------------------------------- end
  win() {
    this.won = true;
    this.player.enabled = false;
    sfx('win');
    setTimeout(async () => {
      this.player.unlock();
      const link = location.origin + location.pathname + '#' + (await encodeShare(this.level));
      openModal(el('div', { class: 'intro win' }, el('p', { class: 'kicker' }, 'Escaped!'), el('h1', {}, this.level.name), el('p', { class: 'story' }, this.theme.outro),
        el('div', { class: 'stats' }, el('div', {}, el('b', {}, fmtTime(this.time)), 'time'), el('div', {}, el('b', {}, String(this.totalLocks)), 'locks opened'), el('div', {}, el('b', {}, String(this.hints)), 'hints used')),
        el('div', { class: 'row' }, this.opts.fromEditor ? null : el('button', { class: 'btn primary big', autofocus: true, onclick: () => { closeModal(); this.app.surprise(); } }, 'Another room'),
          el('button', { class: 'btn big', onclick: () => { navigator.clipboard && navigator.clipboard.writeText(link); toast('Link copied. Send it to a friend!'); } }, 'Copy share link'),
          el('button', { class: 'btn big', onclick: () => { closeModal(); this.opts.onExit(); } }, this.opts.fromEditor ? 'Back to workshop' : 'Menu'))), { sticky: true });
    }, 1300);
  }
  quitPrompt() {
    this.modal(el('div', {}, el('h2', {}, 'Leave this room?'), el('p', { class: 'sub' }, 'Your progress in this room will be lost.'), el('div', { class: 'row' }, el('button', { class: 'btn', autofocus: true, onclick: () => closeModal() }, 'Keep playing'), el('button', { class: 'btn primary', onclick: () => { closeModal(); this.opts.onExit(); } }, 'Leave'))));
  }

  frame(dt) {
    const { w, h } = this.app.size;
    if (this.camera.aspect !== w / h) { this.camera.aspect = w / h; this.camera.updateProjectionMatrix(); }
    if (this.started && !this.won && !modalOpen()) this.time += dt;
    this.player.update(dt, this.level.room, this.world.colliders);
    this.world.update(dt);
    let target = null;
    if (this.started && !this.won && !modalOpen()) {
      this.ray.setFromCamera(new THREE.Vector2(0, 0), this.camera);
      target = this.world.pick(this.ray);
    }
    const label = target && this.promptFor(target);
    this.target = target;
    this.world.highlight(target && label ? target.def.id : null);
    this.ui.prompt.textContent = label || '';
    this.ui.prompt.hidden = !label;
    this.ui.timer.textContent = fmtTime(this.time);
    this.app.renderer.render(this.world.scene, this.camera);
  }
  dispose() {
    this.dead = true;
    this.handlers.forEach((off) => off());
    this.player.dispose();
    this.world.dispose();
    closeModal();
    $('#hud').hidden = true;
    $('#hud').replaceChildren();
  }
}
