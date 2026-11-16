// =====================================================================
// battle.js  -  Turn-based battles (Dragon Quest style front view).
//
// How one round works:
//   0. Every monster decides what it will do   (planIntent) - you can SEE this
//   1. You pick a command for each hero        (commandMenu)
//   2. Everyone acts in a random order         (resolve -> act)
//   3. Poison and other effects tick           (endRound -> tickStatuses)
//   4. Check who is left standing              (afterRound)
//
// The battle keeps a "queue" of small functions. Each one does a single
// thing (one attack, one spell...) and returns the message to show.
// Pressing a key runs the next one.
// =====================================================================

const BATTLE_ROWS = 7;             // lines shown at once in the Spells / Abilities / Item lists (longer lists scroll)
const STATUS_TAGS = { poison: ['Psn', '#9be36a'], sleep: ['Slp', '#b8c4ff'], silence: ['Sil', '#c8c8c8'], regen: ['Rgn', '#7dff9a'] };
const short = hero => hero.name.slice(0, 3);
const aOrAn = name => (/^[AEIOU]/i.test(name) ? 'an ' : 'a ') + name;   // "a Potion", "an Ether"            // "ART", "SOR", "RAY"

const Battle = {
  enemies: [], cmds: [], hero: -1, queue: [], msg: null, after: null, auto: false, timer: 0,
  hovered: null,        // the monster under the mouse (for the info box)
  taunt: null,          // { hero, rounds } while Taunt is working

  aliveEnemies() { return this.enemies.filter(e => e.hp > 0); },

  // ---------- starting ----------
  // opts (all optional): enemies: [{kind, lvl}] for a fixed fight, boss: true, onWin: function,
  //                      list: which monsters can appear, levelBonus: extra levels (Endless Tower)
  start(zone, opts = {}) {
    mode = 'battle';
    this.zone = zone;
    this.opts = opts;
    this.boss = !!opts.boss;
    this.fled = false;
    this.queue = []; this.msg = null; this.after = null; this.auto = false;
    this.hovered = null; this.taunt = null;
    this.crestUsed = false;                              // the Twin Crest relic works once per battle

    // enemies scale with the party's average level
    // (some zones add a few extra levels: see ZONE_LEVEL_BONUS in data.js)
    const lvl = avgLevel() + (ZONE_LEVEL_BONUS[zone] || 0) + (opts.levelBonus || 0);
    this.enemies = [];
    if (opts.enemies) {
      for (const e of opts.enemies) this.enemies.push(makeEnemy(e.kind, e.lvl));
    } else {
      const n = 1 + Math.floor(Math.random() * (avgLevel() < 3 ? 2 : 3));
      for (let i = 0; i < n; i++) {
        this.enemies.push(makeEnemy(pick(opts.list || ZONES[zone]), clamp(lvl + Math.floor(rnd(-1, 2)), 1, levelCap())));
      }
    }
    const count = this.enemies.length;
    // two of the same kind become "Slime A" and "Slime B"
    for (const e of this.enemies) {
      const same = this.enemies.filter(o => o.kind === e.kind);
      if (same.length > 1) e.name += ' ' + 'ABC'[same.indexOf(e)];
    }
    for (const h of G.party) {
      h.buff = { str: 0, def: 0, int: 0 }; h.status = {}; h.defending = false;
      if (G.run) for (const k in G.run.startBuff) h.buff[k] = G.run.startBuff[k];     // Endless Tower boons
      if (hasRelic('titan') && h.hp > 0) h.status.regen = REGEN_ROUNDS;               // relic: Titan's Heart
    }
    // Endless Tower: the floor may have a twist (a special rule, see TWISTS in tower.js)
    this.twist = G.run && G.run.twist && !opts.boss ? G.run.twist : null;
    if (this.twist && this.twist.element) for (const e of this.enemies) { e.weak = this.twist.element; if (e.resist === e.weak) e.resist = null; }
    if (this.twist && this.twist.rich) for (const e of this.enemies) {
      for (const k of ['hp', 'maxhp', 'str', 'def', 'int', 'mag']) e[k] = Math.round(e[k] * RICH_FLOOR);
      e.exp *= 2; e.gold *= 2;
    }

    const names = this.enemies.map(e => e.name).join(', ');
    Sfx.play('encounter');
    this.say([`${names} ${count === 1 ? 'appears' : 'appear'}!`], () => this.beginRound());
  },

  // ---------- message queue ----------
  say(msgs, then) {
    for (const m of msgs) this.queue.push(() => m);
    this.after = then;
    this.next();
  },
  next() {
    while (this.queue.length) {
      const m = this.queue.shift()();
      if (m) { this.msg = m; this.timer = 0; return; }   // show it and wait for a key
    }
    this.msg = null;                                     // queue is empty: move on
    const f = this.after; this.after = null;
    if (f) f();
  },
  key(action) {
    if (this.msg && (action === 'ok' || action === 'cancel')) this.next();
  },
  update(dt) {
    for (const e of this.enemies) e.flash = Math.max(0, e.flash - dt);
    if (this.msg && this.auto) {                         // during a round, messages also advance by themselves
      this.timer += dt;
      if (this.timer > 1.8) this.next();
    }
  },

  // ---------- 0. what the monsters are about to do ----------
  // Decided BEFORE you choose your commands and shown above each monster, so you can react:
  // defend the hero who is about to be hit, silence the caster, put the big hitter to sleep...
  planIntent(e) {
    if (e.status.sleep) { e.intent = { type: 'sleep' }; return; }
    const kind = ENEMIES[e.kind], turn = e.turn++;
    // ---- the Endless Tower's special talents ----
    if (kind.shifting) {                                 // Prism Golem: a new weakness every round, and it resists the rest
      e.weak = pick(ELEMENTS.filter(x => x !== e.weak)); e.resist = 'all';
    }
    if (kind.charge && turn % 4 === 2) { e.intent = { type: 'charge' }; return; }      // Storm Titan: gather power...
    if (kind.charge && turn % 4 === 3) { e.intent = { type: 'unleash' }; return; }     // ...then let it go
    if (kind.heals && !e.status.silence) {               // Mender: heal whoever is hurt the most
      const hurt = this.aliveEnemies().filter(x => x.hp < x.maxhp * 0.7).sort((a, b) => a.hp / a.maxhp - b.hp / b.maxhp)[0];
      if (hurt && Math.random() < 0.8) { e.intent = { type: 'heal', ally: hurt }; return; }
    }
    if (kind.rally && Math.random() < 0.35 && this.aliveEnemies().some(x => x.debuff.str < RALLY_MAX)) { e.intent = { type: 'rally' }; return; }
    const heroes = aliveHeroes();
    const taunter = this.taunt && this.taunt.hero.hp > 0 ? this.taunt.hero : null;
    const target = taunter || pick(heroes);
    const castable = e.status.silence ? [] : e.spells.map(id => SPELLS[id]).filter(s => e.mp >= s.mp);
    if (castable.length && Math.random() < 0.4) {
      const spell = pick(castable);
      e.intent = { type: 'spell', spell, target: spell.target === 'allEnemies' ? null : target };
    } else {
      e.intent = { type: 'attack', target };
    }
  },
  // short text shown above the monster, and its colour
  intentLabel(e) {
    const it = e.intent;
    if (!it) return null;
    if (it.type === 'sleep') return ['Zzz', '#b8c4ff'];
    if (it.type === 'charge') return ['Charging!', '#ffe060'];
    if (it.type === 'unleash') return ['CATACLYSM > ALL', '#ff5040'];
    if (it.type === 'heal') return [`Heal > ${it.ally === e ? 'self' : it.ally.name}`, '#7dff9a'];
    if (it.type === 'rally') return ['War Cry', '#ffb060'];
    if (it.type === 'attack') return [`Attack > ${short(it.target)}`, '#ffb4a8'];
    return [`${it.spell.name} > ${it.target ? short(it.target) : 'ALL'}`, '#9fd0ff'];
  },
  // one longer line for the info box, with a rough idea of the damage
  intentDetail(e) {
    const it = e.intent;
    if (!it) return '';
    if (it.type === 'sleep') return `Asleep for ${e.status.sleep} more round${e.status.sleep === 1 ? '' : 's'}.`;
    if (it.type === 'charge') return 'Next: gathers power. The round after, it strikes EVERYONE.';
    if (it.type === 'unleash') return `Next: CATACLYSM on everyone, about ${Math.round(atkOf(e) / 2 * TITAN_BLAST * 0.8)} each. DEFEND!`;
    if (it.type === 'heal') return `Next: heals ${it.ally === e ? 'itself' : it.ally.name} (silence stops it).`;
    if (it.type === 'rally') return 'Next: a war cry. Every monster gets stronger.';
    if (it.type === 'attack') {
      const dmg = Math.max(1, Math.round(atkOf(e) / 2 - defOf(it.target) / 4));
      return `Next: attack ${it.target.name}, about ${dmg} damage` + (ENEMIES[e.kind].poison ? ' (may poison)' : '');
    }
    const s = it.spell, who = it.target ? it.target.name : 'everyone';
    if (s.kind === 'status') return `Next: ${s.name}, may ${s.status === 'sleep' ? 'put ' + who + ' to sleep' : 'silence ' + who}`;
    const targets = it.target ? [it.target] : aliveHeroes();
    const avg = targets.reduce((sum, t) => sum + Math.max(1, spellBase(s, e) - Math.floor(intOf(t) / 4)), 0) / targets.length;
    const side = { poison: ' (may poison)', silence: ' (may silence)', sleep: ' (may cause sleep)' }[s.inflict] || '';
    return `Next: ${s.name} on ${who}, about ${Math.round(avg)}${it.target ? '' : ' each'}${side}`;
  },

  // ---------- 1. choosing commands ----------
  beginRound() {
    for (const e of this.aliveEnemies()) this.planIntent(e);
    this.cmds = []; this.hero = -1;
    this.nextHero();
  },
  canChoose(h) { return h.hp > 0 && !h.status.sleep; }, // knocked out or asleep: no command this round
  nextHero() {
    do { this.hero++; } while (this.hero < G.party.length && !this.canChoose(G.party[this.hero]));
    if (this.hero >= G.party.length) this.resolve();
    else this.commandMenu();
  },
  prevHero() {                                           // X on the command menu = go back one hero
    let j = this.hero - 1;
    while (j >= 0 && !this.canChoose(G.party[j])) j--;
    if (j < 0) return;
    this.hero = j;
    this.commandMenu();
  },
  setCommand(cmd) {
    this.cmds[this.hero] = cmd;
    UI.clear();
    this.nextHero();
  },
  commandMenu() {
    const h = G.party[this.hero];
    UI.clear();
    UI.openMenu({
      x: 8, y: 128, maxBottom: 208, w: 78, line: 10, title: h.name, isCommand: true,
      items: [
        { label: 'Attack', pick: () => this.pickEnemy(t => this.setCommand({ type: 'attack', target: t })) },
        // Abilities = weapon skills, boosts and tricks.  Spells = magic (Silence blocks only these).
        { label: 'Abilities', pick: () => this.spellMenu(h, knownAbilities(h), 'No abilities yet'), disabled: !knownAbilities(h).length },
        { label: 'Spells', pick: () => this.spellMenu(h, knownMagic(h), 'No spells yet'), disabled: !!h.status.silence || !knownMagic(h).length },
        { label: 'Item',   pick: () => this.itemMenu(), disabled: !!(this.twist && this.twist.noItems) },
        { label: 'Defend', pick: () => this.setCommand({ type: 'defend' }) },
        { label: 'Run',    pick: () => this.setCommand({ type: 'run' }) },
      ],
      onCancel: () => this.prevHero(),
      // under the list: this hero's favorite, used with the F key
      extra: () => drawText('F: ' + (this.favorite(h) ? SPELLS[h.fav].name : 'no favorite'), 10, 222, this.favorite(h) ? '#ffd75e' : '#8088a8'),
    });
  },

  // ---------- favorites (the F key) ----------
  // Each hero can mark ONE spell or ability as a favorite: press F on it in the Abilities / Spells list
  // (F again takes the mark off). On the command list, F uses the favorite at once: on the monster the
  // mouse is pointing at, or - for healing, boosts and the like - it asks whom, or needs no target at all.
  favorite(h) { return h.fav && knownSpells(h).includes(h.fav) ? SPELLS[h.fav] : null; },
  favKey() {
    const t = UI.top, h = G.party[this.hero];
    if (!t || t.type !== 'menu' || !h) return;
    if (t.spellIds) {                                    // in the Abilities / Spells list: mark or unmark
      const id = t.spellIds[t.cur];
      if (!id) return;
      h.fav = h.fav === id ? null : id;
      Sfx.play(h.fav ? 'save' : 'cancel');
    } else if (t.isCommand) this.useFavorite(h);
  },
  useFavorite(h) {
    const s = this.favorite(h);
    if (!s || h.mp < s.mp || (h.status.silence && !isAbility(s))) return Sfx.play('buzz');   // none, too little MP, or silenced
    Sfx.play('ok');
    const cast = target => this.setCommand({ type: 'spell', spell: s, target });
    if (s.target === 'enemy') {
      if (this.hovered && this.hovered.hp > 0) cast(this.hovered);      // the monster under the mouse
      else this.pickEnemy(cast);                                       // not pointing at one: ask
    } else if (s.target === 'ally') this.pickAlly(cast);
    else this.setCommand({ type: 'spell', spell: s });
  },

  spellMenu(h, list, nothing) {                           // "list" = the hero's Abilities or Spells
    const items = list.map(id => {
      const s = SPELLS[id];
      return {
        label: s.name, right: () => (h.fav === id ? '* ' : '') + s.mp + ' MP', desc: describeSpell(s, h),   // * = the favorite
        disabled: h.mp < s.mp,
        pick: () => {
          if (s.target === 'enemy') this.pickEnemy(t => this.setCommand({ type: 'spell', spell: s, target: t }));
          else if (s.target === 'ally') this.pickAlly(t => this.setCommand({ type: 'spell', spell: s, target: t }));
          else this.setCommand({ type: 'spell', spell: s });
        },
      };
    });
    if (!items.length) items.push({ label: nothing, disabled: true });
    UI.openMenu({ x: 90, y: 132, maxBottom: 208, w: 126, rows: BATTLE_ROWS, items, spellIds: list,
                  hideWhenTargeting: true });           // steps out of the way while you choose which monster to hit
  },
  itemMenu() {
    const items = Object.keys(ITEMS).filter(id => G.items[id] > 0 && !ITEMS[id].ward).map(id => ({   // no Ward Charms in battle
      label: ITEMS[id].name, right: 'x' + G.items[id], desc: describeItem(id),
      pick: () => this.pickAlly(t => this.setCommand({ type: 'item', id, target: t })),
    }));
    if (!items.length) items.push({ label: 'No items', disabled: true });
    UI.openMenu({ x: 90, y: 132, maxBottom: 208, w: 126, rows: BATTLE_ROWS, items });
  },
  pickEnemy(cb) {
    const list = this.aliveEnemies();
    if (list.length === 1) return cb(list[0]);           // only one enemy: no need to ask
    // enemyList / chooseEnemy let the mouse pick a target by clicking the monster itself
    UI.openMenu({ x: 220, y: 132, maxBottom: 174, w: 92, enemyList: list, chooseEnemy: cb,
                  items: list.map(e => ({ label: e.name, pick: () => cb(e) })) });
  },
  pickAlly(cb) {
    const tags = h => h.hp <= 0 ? 'KO' : Object.keys(h.status).filter(k => STATUS_TAGS[k]).map(k => STATUS_TAGS[k][0]).join(' ');
    UI.openMenu({ x: 204, y: 132, maxBottom: 208, w: 108, items: G.party.map(h => ({ label: h.name, right: tags(h), pick: () => cb(h) })) });
  },

  // ---------- mouse: pointing and clicking on the monsters ----------
  // where each monster is drawn (draw() and the mouse both use this)
  enemyBox(e) {
    const i = this.enemies.indexOf(e), n = this.enemies.length;
    const cx = SCREEN_W / 2 + (i - (n - 1) / 2) * 84;
    const size = e.big ? 64 : 48;                        // bosses are drawn bigger
    return { cx, size, left: cx - size / 2, top: 108 - size, right: cx + size / 2, bottom: 128 };
  },
  enemyAt(x, y) {                                        // which living monster is under the mouse?
    return this.aliveEnemies().find(e => {
      const b = this.enemyBox(e);
      return x >= b.left && x <= b.right && y >= b.top && y <= b.bottom;
    });
  },
  hover(x, y) {                                          // pointing at a monster shows its info and moves the target cursor
    const t = UI.top, e = this.enemyAt(x, y);
    this.hovered = e || null;
    if (t && t.enemyList && e) t.cur = t.enemyList.indexOf(e);
  },
  click(x, y) {                                          // returns true if the click was used
    const t = UI.top, e = this.enemyAt(x, y);
    if (!t || !e) return false;
    if (t.chooseEnemy) { Sfx.play('ok'); t.chooseEnemy(e); return true; }            // choosing a target
    if (t.isCommand) { Sfx.play('ok'); this.setCommand({ type: 'attack', target: e }); return true; }   // shortcut: attack it
    return false;
  },

  // ---------- 2. playing out the round ----------
  resolve() {
    UI.clear();
    this.auto = true;
    let heroes = aliveHeroes();

    if (this.cmds.some(c => c && c.type === 'run')) {
      this.queue.push(() => {
        if (this.boss) { Sfx.play('buzz'); return 'There is no escape!'; }
        if (Math.random() < 0.6) { this.fled = true; Sfx.play('run'); return 'The party ran away!'; }
        Sfx.play('buzz');
        return "Couldn't escape!";
      });
      heroes = [];                                       // trying to run uses up the heroes' turn
    }

    // Defending protects for the WHOLE round, even from a monster that moves before the hero does
    // (otherwise you could never be sure of blocking an attack the monster has announced).
    heroes.forEach(h => { const c = this.cmds[G.party.indexOf(h)]; if (c && c.type === 'defend') h.defending = true; });
    const order = [...heroes, ...this.aliveEnemies()].sort(() => Math.random() - 0.5);
    if (this.twist && this.twist.ambush) order.sort((a, b) => (a.isHero ? 1 : 0) - (b.isHero ? 1 : 0));   // twist: monsters always go first
    for (const u of order) {
      this.queue.push(() => {
        const finished = this.fled || !aliveHeroes().length || !this.aliveEnemies().length;
        return (finished || u.hp <= 0) ? null : this.act(u);
      });
    }
    this.after = () => this.endRound();
    this.next();
  },

  // one fighter takes their action; returns the message to show
  act(u) {
    if (u.status.sleep) {                                // asleep: the turn is lost
      if (--u.status.sleep <= 0) delete u.status.sleep;
      u.intent = null;
      return `${u.name} is fast asleep.`;
    }
    if (!u.isHero) {                                     // --- enemy: does what it announced ---
      const it = u.intent || { type: 'attack' };
      u.intent = null;
      const target = it.target && it.target.hp > 0 ? it.target : pick(aliveHeroes());
      if (it.type === 'charge') { Sfx.play('buff'); return `${u.name} gathers a terrible power! Brace yourselves!`; }
      if (it.type === 'unleash') {                       // everyone is hit; Defend takes most of the sting out
        Sfx.play('hurt');
        return `${u.name} unleashes CATACLYSM! ` + aliveHeroes().map(h =>
          this.hurt(h, Math.max(1, Math.round(physDamage(u, h) * TITAN_BLAST * (h.defending ? TITAN_BLAST_GUARD : 1)))) + this.wake(h)).join(' ');
      }
      if (it.type === 'heal') {
        if (u.status.silence) return `${u.name} tries to heal, but is silenced!`;
        const ally = it.ally.hp > 0 ? it.ally : u;
        Sfx.play('heal');
        return `${u.name} chants a healing verse. ${ally.name} recovers ${healUnit(ally, Math.ceil(ally.maxhp * MENDER_HEAL))} HP.`;
      }
      if (it.type === 'rally') {
        Sfx.play('buff');
        for (const x of this.aliveEnemies()) x.debuff.str = Math.min(RALLY_MAX, Math.max(x.debuff.str, 1) * RALLY_STEP);
        return `${u.name} lets out a war cry! The monsters' STR rises!`;
      }
      if (it.type === 'spell') {
        if (u.status.silence) return `${u.name} tries to cast ${it.spell.name}, but is silenced!`;
        return this.castSpell(u, it.spell, target);
      }
      return this.attack(u, target);
    }
    const cmd = this.cmds[G.party.indexOf(u)];           // --- hero: do what the player chose ---
    if (!cmd) return null;                               // (was asleep when commands were given)
    if (cmd.type === 'attack') return this.attack(u, cmd.target);
    if (cmd.type === 'spell') {
      if (u.status.silence && !isAbility(cmd.spell)) return `${u.name} tries to cast ${cmd.spell.name}, but is silenced!`;
      return this.castSpell(u, cmd.spell, cmd.target);
    }
    if (cmd.type === 'defend') { u.defending = true; return `${u.name} is on guard.`; }
    if (cmd.type === 'item') {
      const name = ITEMS[cmd.id].name;
      if (G.items[cmd.id] <= 0) return `${u.name} has no ${name} left!`;
      Sfx.play('item');
      return `${u.name} uses a ${name}. ` + (useItem(cmd.id, cmd.target) || 'But nothing happens.');
    }
    return null;
  },

  foesOf(u) { return u.isHero ? this.aliveEnemies() : aliveHeroes(); },

  hurt(target, dmg) {                                    // returns the text for one hit
    if (target.isHero && dmg >= target.hp && hasRelic('twins') && !this.crestUsed) {   // relic: Twin Crest
      this.crestUsed = true;
      target.hp = 1; target.flash = 0.35;
      return `${target.name} takes ${dmg} damage, but the Twin Crest flares and ${target.name} holds on with 1 HP!`;
    }
    target.hp = Math.max(0, target.hp - dmg);
    target.flash = 0.35;
    if (target.hp <= 0) { target.status = {}; target.intent = null; }
    return `${target.name} takes ${dmg} damage${target.hp <= 0 ? ' and is defeated!' : '.'}` + this.fallen(target);
  },
  // Sol and Luna: when one twin falls, the other is filled with rage. Returns extra text.
  fallen(target) {
    if (target.hp > 0 || target.isHero || !ENEMIES[target.kind].twin) return '';
    const other = this.aliveEnemies().find(e => ENEMIES[e.kind].twin && !e.enraged);
    if (!other) return '';
    other.enraged = true;
    other.str = Math.round(other.str * TWIN_RAGE); other.mag = Math.round(other.mag * TWIN_RAGE);
    return ` ${other.name} howls with grief and burns with new strength!`;
  },
  // a blow wakes a sleeper; returns extra text
  wake(target) {
    if (target.hp <= 0 || !target.status.sleep) return '';
    delete target.status.sleep;
    if (!target.isHero) this.planIntent(target);
    return ` ${target.name} wakes up!`;
  },
  // an attack that leaves an ailment behind (poison, silence or sleep); returns extra text
  afflict(target, ailment) {
    if (ailment === 'poison') return this.poison(target);
    if (target.hp <= 0 || isBoss(target) || target.status[ailment]) return '';
    if (ailment === 'silence') {
      target.status.silence = SILENCE_ROUNDS;
      if (!target.isHero && target.intent && target.intent.type === 'spell') target.intent = { type: 'attack', target: target.intent.target || pick(aliveHeroes()) };
      return ` ${target.name} is silenced!`;
    }
    target.status.sleep = SLEEP_ROUNDS;
    if (!target.isHero) target.intent = { type: 'sleep' };
    return ` ${target.name} falls asleep!`;
  },
  poison(target) {
    if (target.hp <= 0 || target.status.poison) return '';
    target.status.poison = true;
    return ` ${target.name} is poisoned!`;
  },

  attack(a, t) {
    if (!t || t.hp <= 0) t = this.foesOf(a)[0];          // target already down: hit someone else
    if (!t) return null;
    Sfx.play(a.isHero ? 'hit' : 'hurt');
    let out = `${a.name} attacks! ` + this.hurt(t, physDamage(a, t)) + this.wake(t);
    if (!a.isHero && Math.random() < (ENEMIES[a.kind].poison || 0)) out += this.poison(t);      // venomous monsters
    return out;
  },

  castSpell(a, s, t) {
    let out = `${a.name} ${isAbility(s) ? 'uses' : 'casts'} ${s.name}! `;
    Sfx.play(s.kind === 'damage' ? 'spell' : s.kind === 'warp' ? 'warp' : ['heal', 'revive', 'cure', 'regen', 'healself'].includes(s.kind) ? 'heal' : 'buff');
    if (s.kind === 'warp') {                             // Warp in battle: a sure escape (but not from bosses)
      a.mp -= s.mp;
      if (this.boss) return out + 'But a powerful force holds the party in place!';
      this.fled = true;
      return out + 'The party is whisked away from the fight!';
    }
    if (s.kind === 'heal' || s.kind === 'revive') {
      return out + castHeal(a, s, s.target === 'party' ? aliveHeroes() : [t]);
    }
    a.mp -= s.mp;
    const friends = a.isHero ? aliveHeroes() : this.aliveEnemies(), foes = this.foesOf(a);
    const victims = s.target === 'allEnemies' ? foes : [(t && t.hp > 0) ? t : foes[0]].filter(Boolean);

    if (s.kind === 'buff') {                             // each cast adds one more boost, up to BUFF_MAX
      if (friends.every(h => h.buff[s.stat] >= BUFF_MAX)) return out + `But the party's ${s.stat.toUpperCase()} cannot go any higher.`;
      for (const h of friends) h.buff[s.stat] = Math.min(BUFF_MAX, h.buff[s.stat] + 1);
      return out + `The party's ${s.stat.toUpperCase()} rises!`;
    }
    if (s.kind === 'selfbuff') { a.buff[s.stat] = BUFF_MAX; return out + `${a.name}'s ${s.stat.toUpperCase()} soars to its limit!`; }
    if (s.kind === 'healself') return out + `${a.name} recovers ${healUnit(a, Math.ceil(maxHpOf(a) / 2))} HP.`;
    if (s.kind === 'regen') {                            // one ally, or the whole party (Renewal)
      const targets = s.target === 'party' ? friends : [t].filter(x => x && x.hp > 0);
      if (!targets.length) return out + 'But it has no effect.';
      for (const x of targets) x.status.regen = Math.max(x.status.regen || 0, s.rounds || REGEN_ROUNDS);   // never shortens a longer Regen
      return out + (targets.length > 1 ? 'Everyone' : targets[0].name) + ' will recover HP every round.';
    }
    if (s.kind === 'cure') {
      const targets = s.target === 'party' ? friends : [t].filter(x => x && x.hp > 0);
      for (const x of targets) for (const effect of ['poison', 'sleep', 'silence']) delete x.status[effect];
      return out + (targets.length ? `${targets.map(x => x.name).join(', ')} ${targets.length > 1 ? 'are' : 'is'} cured of all ailments.` : 'But it has no effect.');
    }
    if (s.kind === 'taunt') {                            // every single-target intent swings round to the taunter
      this.taunt = { hero: a, rounds: 2 };
      for (const e of this.aliveEnemies()) if (e.intent && e.intent.target) e.intent.target = a;
      return out + `The monsters turn their eyes on ${a.name}!`;
    }
    if (s.kind === 'osmose') {
      const x = victims[0];
      if (!x) return null;
      const gain = Math.min(x.mp, Math.round(10 + magOf(a) * 0.15));
      x.mp -= gain; a.mp = Math.min(maxStat(a, 'mp'), a.mp + gain);
      return out + (gain ? `Drained ${gain} MP from ${x.name}.` : `${x.name} has no MP left.`);
    }
    if (s.kind === 'debuff') {
      const x = victims[0];
      if (!x) return null;
      x.debuff[s.stat] = isBoss(x) ? (1 + DEBUFF_AMOUNT) / 2 : DEBUFF_AMOUNT;      // bosses only feel half of it
      return out + `${x.name}'s ${s.stat.toUpperCase()} drops!`;
    }
    if (s.kind === 'status') {                           // sleep or silence
      return out + victims.map(x => {
        if (isBoss(x)) return `${x.name} is immune.`;
        if (Math.random() >= s.chance) return `No effect on ${x.name}.`;
        if (s.status === 'sleep') {
          x.status.sleep = SLEEP_ROUNDS + (Math.random() < 0.5 ? 1 : 0);
          if (!x.isHero) x.intent = { type: 'sleep' };
          return `${x.name} falls asleep!`;
        }
        x.status.silence = SILENCE_ROUNDS;
        if (!x.isHero && x.intent && x.intent.type === 'spell') x.intent = { type: 'attack', target: x.intent.target || pick(aliveHeroes()) };
        return `${x.name} is silenced!`;
      }).join(' ');
    }
    // damage (maybe with an element, maybe with poison)
    // "hits" (Arrow Storm): several separate shots, each at a random enemy that is still standing
    const shots = s.hits ? Array.from({ length: s.hits }) : victims;
    return out + shots.map(shot => {
      const x = s.hits ? pick(this.foesOf(a)) : shot;
      if (!x) return '';                                 // (every enemy fell before the last arrow)
      const factor = elementFactor(s, x);
      let text = this.hurt(x, spellDamage(s, a, x));
      if (factor > 1) text += ' A weak point!';
      if (factor < 1) text += ' It resists.';
      if (s.uses === 'str') text += this.wake(x);
      if (s.inflict && Math.random() < (s.chance || 0.6)) text += this.afflict(x, s.inflict);
      return text;
    }).join(' ');
  },

  // ---------- 3. after the round ----------
  endRound() {
    for (const h of G.party) h.defending = false;
    if (this.fled) return this.finish('fled');
    const ticks = this.aliveEnemies().length && aliveHeroes().length ? this.tickStatuses() : [];
    if (ticks.length) this.say(ticks, () => this.afterRound());
    else this.afterRound();
  },
  // poison hurts, Regen heals, silence and Taunt run down. Returns the messages to show.
  tickStatuses() {
    const lines = [];
    for (const u of [...aliveHeroes(), ...this.aliveEnemies()]) {
      if (u.status.poison) {
        const dmg = Math.max(1, Math.round(maxHpOf(u) * POISON_DAMAGE * (isBoss(u) ? 1 / 3 : 1)));
        u.hp = Math.max(0, u.hp - dmg); u.flash = 0.35;
        lines.push(`Poison hurts ${u.name} for ${dmg}${u.hp <= 0 ? ' and finishes them off!' : '.'}` + this.fallen(u));
        if (u.hp <= 0) { u.status = {}; u.intent = null; continue; }
      }
      if (u.status.regen) {
        lines.push(`${u.name} regains ${healUnit(u, Math.ceil(maxHpOf(u) * REGEN_AMOUNT))} HP.`);
        if (--u.status.regen <= 0) delete u.status.regen;
      }
      if (u.status.silence && --u.status.silence <= 0) { delete u.status.silence; lines.push(`${u.name} can cast again.`); }
    }
    if (this.taunt && --this.taunt.rounds <= 0) this.taunt = null;
    // pack the lines into as few message boxes as possible
    const pages = [];
    for (const line of lines) {
      if (pages.length && (pages[pages.length - 1] + ' ' + line).length <= 170) pages[pages.length - 1] += ' ' + line;
      else pages.push(line);
    }
    return pages;
  },
  afterRound() {
    if (!this.aliveEnemies().length) return this.victory();
    if (!aliveHeroes().length) return this.defeat();
    this.beginRound();
  },
  victory() {
    this.auto = false;
    const bonus = G.run ? G.run.expBonus : 1;            // Endless Tower boon
    const exp = Math.round(this.enemies.reduce((s, e) => s + e.exp, 0) * bonus);
    const gold = this.enemies.reduce((s, e) => s + e.gold, 0);
    G.gold += gold;
    Sfx.play('victory');
    this.queue.push(() => `Victory! Everyone gains ${exp} EXP. Found ${gold} gold.`);
    const drop = rollDrop(this.boss);                    // maybe the monsters left an item behind (see ITEM DROPS in data.js)
    if (drop) {                                          // no room for it? it is used at once if somebody needs it, else lost
      const got = gainItem(drop), text = `The monsters dropped ${aOrAn(ITEMS[drop].name)}!` + spareItemText(got);
      this.queue.push(() => { Sfx.play('item'); return text; });
    }
    for (const h of aliveHeroes()) {                     // knocked-out heroes get no EXP
      for (const m of gainExp(h, exp)) this.queue.push(() => { Sfx.play('levelup'); return m; });
    }
    this.say([], () => this.finish('win'));
  },
  defeat() {
    this.auto = false;
    Sfx.play('defeat');
    this.say(['The party has fallen...'], () => this.finish('lose'));
  },
  finish(result) {
    for (const h of G.party) {
      h.buff = { str: 0, def: 0, int: 0 }; h.status = {}; h.defending = false;     // effects end with the battle
      if (h.hp <= 0) h.hp = 1;                           // knocked-out heroes get up with 1 HP
    }
    UI.clear();
    mode = 'explore';
    this.boss = false;
    if (result === 'lose') onPartyDefeated();            // defined in main.js
    if (result === 'win' && this.opts.onWin) this.opts.onWin();
  },

  // ---------- drawing ----------
  draw() {
    // background
    drawBackdrop(this.zone);

    // enemies in a row
    const menu = UI.top;
    const targeted = menu && menu.enemyList ? menu.enemyList[menu.cur] : null;   // the monster the cursor is on
    this.enemies.forEach(e => {
      if (e.hp <= 0) return;
      const { cx, size, top } = this.enemyBox(e);
      const blink = e.flash > 0 && Math.floor(e.flash * 20) % 2 === 0;
      if (!blink) {
        R(ctx, '#00000040', cx - size / 2 + 4, 105, size - 8, 4);                 // shadow on the ground
        ctx.drawImage(bigSprite(e.sprite, e.big), cx - size / 2, top);          // the high-detail picture
      }
      if (e === targeted) for (let r = 0; r < 4; r++) R(ctx, '#ffd75e', cx + 26 + r, top + 4 + r, 8 - r * 2, 1);   // little arrow
      // what it is about to do: above a normal monster, beside a boss
      const label = this.intentLabel(e);
      if (label && e.big) { drawText('NEXT:', cx + 38, top + 14, '#ffd75e'); drawText(label[0], cx + 38, top + 25, label[1]); }
      if (e.big && ENEMIES[e.kind].shifting && e.weak) drawText(`WEAK: ${e.weak}`, cx + 38, top + 40, '#7dff9a');     // the Prism Golem's weakness this round
      else if (label) drawText(label[0], cx, top - 10, label[1], 'center');
      drawText(`${e.name} L${e.lvl}`, cx, 111, '#fff', 'center');
      R(ctx, '#000', cx - 21, 122, 42, 5);
      R(ctx, '#e04040', cx - 20, 123, Math.ceil(40 * e.hp / e.maxhp), 3);
      Object.keys(e.status).filter(k => STATUS_TAGS[k]).forEach((k, i) => drawText(STATUS_TAGS[k][0], cx + 24 + i * 17, 120, STATUS_TAGS[k][1]));
    });

    // party status along the top
    drawWindow(8, 4, 304, 40);
    G.party.forEach((h, i) => {
      const x = 18 + i * 100;
      const choosing = UI.active && i === this.hero;
      drawText(h.name, x, 10, h.hp <= 0 ? '#ff6060' : choosing ? '#ffd75e' : '#fff');
      drawText(`HP ${h.hp}/${maxStat(h, 'hp')}`, x, 20, h.hp <= 0 ? '#ff6060' : '#fff');
      drawText(`MP ${h.mp}/${maxStat(h, 'mp')}`, x, 30, '#9fd0ff');
      // active boosts, e.g. "S2 D3" = STR boosted twice, DEF three times
      const boosts = ['str', 'def', 'int'].filter(k => h.buff[k]).map(k => k[0].toUpperCase() + h.buff[k]).join(' ');
      if (boosts) drawText(boosts, x + 44, 10, '#7dff9a');
      // ailments, e.g. "Psn Slp"
      Object.keys(h.status).filter(k => STATUS_TAGS[k]).forEach((k, n) => drawText(STATUS_TAGS[k][0], x + 54 + n * 17, 30, STATUS_TAGS[k][1]));
    });

    if (this.msg) drawMessage(this.msg);
  },

  // The info box for the monster you point at (or are about to target).
  // main.js calls this after the menus are drawn, so it sits on top of them.
  drawInfo() {
    const menu = UI.top;
    // Only on the main command list or while choosing a target - never over the Spells / Abilities / Item lists,
    // where it would hide the description of the line you are reading.
    if (!menu || this.msg || !(menu.isCommand || menu.enemyList)) return;
    const e = this.hovered && this.hovered.hp > 0 ? this.hovered : (menu.enemyList ? menu.enemyList[menu.cur] : null);
    if (!e) return;
    const t = ENEMIES[e.kind];
    const ailments = Object.keys(e.status).filter(k => STATUS_TAGS[k]).join(', ');
    const down = [e.debuff.str < 1 ? 'STR down' : e.debuff.str > 1 ? 'STR up' : '', e.debuff.def < 1 ? 'DEF down' : '', e.enraged ? 'enraged' : ''].filter(Boolean).join(', ');
    // Every piece of text is wrapped to the width of the box, and the box grows upwards to hold the lines.
    const W = 222, LINE = 10, lines = [];
    const add = (text, color) => { if (text) for (const l of wrapText(text, W - 16)) lines.push([l, color]); };
    add(`${e.name}  LVL ${e.lvl}  HP ${e.hp}/${e.maxhp}`, '#ffd75e');
    add(`Weak: ${e.weak || '-'}   Resists: ${e.resist === 'all' ? 'all else' : e.resist || '-'}`, '#fff');
    add(this.intentDetail(e), '#9fd0ff');
    add([ailments, down].filter(Boolean).join(', '), '#ff9ad0');
    const h = lines.length * LINE + 10, y = 234 - h;
    drawWindow(90, y, W, h);
    lines.forEach(([text, color], i) => drawText(text, 98, y + 6 + i * LINE, color));
  },
};

// ---------------------------------------------------------------------
// BATTLE BACKDROPS: sky, ground and a bit of scenery for every kind of place.
//   [sky colour, ground colour, edge colour, scenery, scenery colour]
// ---------------------------------------------------------------------
const BACKDROPS = {
  grass:   ['#7ec8f0', '#4caf50', '#3d9142', 'hills',   '#5fa8c8'],
  forest:  ['#17301d', '#2f6b35', '#255a2b', 'trees',   '#0f2214'],
  desert:  ['#8fd0f0', '#e3c887', '#cdb06c', 'dunes',   '#d4b574'],
  snow:    ['#b8d8f0', '#eef4fa', '#cfdcea', 'peaks',   '#9ab4d0'],
  sea:     ['#8fd0f0', '#2f73d8', '#6ea8f5', 'waves',   '#6ea8f5'],
  volcano: ['#3a1410', '#5a4a48', '#3e3230', 'lava',    '#2a1a18'],
  dungeon: ['#15101c', '#3a3044', '#2a2233', 'rocks',   '#2a2233'],
  crypt:   ['#1c160c', '#6b5330', '#4a3a20', 'pillars', '#4a3a20'],
  tower:   ['#141a2e', '#4a5578', '#333c5c', 'windows', '#0a0e1c'],
  magma:   ['#1c0c0a', '#4a2a24', '#38201c', 'lava',    '#1c0c0a'],
};

function drawBackdrop(zone) {
  const name = zone.startsWith('tower') || zone === 'endless' ? 'tower' : zone.replace(/\d+$/, '');     // 'grass2' -> 'grass'
  const [sky, groundColor, edge, scenery, color] = BACKDROPS[name] || BACKDROPS.grass;
  const HORIZON = 112;
  const outdoors = ['hills', 'dunes', 'peaks', 'waves'].includes(scenery);

  for (let i = 0; i < 4; i++) R(ctx, tint(sky, 1 + i * 0.07), 0, i * 28, SCREEN_W, 28);       // sky, lighter near the horizon
  if (outdoors) for (const [x, y, w] of [[30, 58, 40], [140, 52, 56], [250, 62, 36]]) {         // clouds
    R(ctx, '#ffffffc0', x, y, w, 6); R(ctx, '#ffffffc0', x + 6, y - 4, w - 14, 4);
  }
  // a mound: wider and wider rows, from the top down
  const mound = (cx, h, slope, c, cap) => { for (let i = 0; i < h; i++) R(ctx, cap && i < 5 ? cap : c, cx - (i + 1) * slope, HORIZON - h + i, (i + 1) * slope * 2, 1); };

  if (scenery === 'hills') { mound(70, 22, 3, color); mound(210, 30, 2.6, color); mound(300, 18, 3, color); }
  if (scenery === 'dunes') { mound(60, 12, 5, color); mound(190, 16, 5, color); mound(300, 10, 5, color); }
  if (scenery === 'peaks') { mound(60, 40, 1.3, color, '#fff'); mound(170, 54, 1.2, color, '#fff'); mound(270, 36, 1.4, color, '#fff'); }
  if (scenery === 'trees') for (let x = 6; x < SCREEN_W; x += 26) {
    R(ctx, color, x + 6, 84, 5, 28); R(ctx, color, x - 4, 60 + (x % 3) * 4, 26, 28); R(ctx, tint(sky, 1.5), x, 64 + (x % 3) * 4, 8, 4);
  }
  if (scenery === 'rocks') for (const x of [20, 70, 130, 200, 250, 300]) {                      // stalactites
    for (let i = 0; i < 12 + (x % 7); i++) R(ctx, color, x - 8 + i / 2, 44 + i * 2, 16 - i, 2);
  }
  if (scenery === 'pillars') for (const x of [40, 120, 200, 280]) {
    R(ctx, color, x - 8, 44, 16, 68); R(ctx, tint(color, 1.4), x - 8, 44, 4, 68); R(ctx, tint(color, 1.4), x - 12, 48, 24, 5);
    R(ctx, '#ff8030', x + 36, 72, 4, 6); R(ctx, '#ffd75e', x + 37, 73, 2, 3);                   // torches between them
  }
  if (scenery === 'windows') for (const x of [70, 160, 250]) {
    R(ctx, color, x - 12, 54, 24, 44); R(ctx, '#2a3a70', x - 9, 60, 18, 36); R(ctx, '#2a3a70', x - 6, 57, 12, 3);
    R(ctx, '#fff', x - 4, 66, 1, 1); R(ctx, '#fff', x + 3, 74, 1, 1); R(ctx, '#fff', x - 1, 84, 1, 1);    // stars
  }
  if (scenery === 'lava') {
    mound(80, 34, 1.6, color); mound(230, 46, 1.4, color);
    R(ctx, '#ff6020', 0, HORIZON - 5, SCREEN_W, 5); R(ctx, '#ffb020', 0, HORIZON - 3, SCREEN_W, 1);
  }

  R(ctx, groundColor, 0, HORIZON, SCREEN_W, SCREEN_H - HORIZON);
  R(ctx, edge, 0, HORIZON, SCREEN_W, 3);
  for (let i = 0; i < 14; i++) R(ctx, edge, (i * 53) % SCREEN_W, 124 + (i * 29) % 100, scenery === 'waves' ? 22 : 12, 1);   // texture
}
