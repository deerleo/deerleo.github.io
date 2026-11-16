// =====================================================================
// tower.js  -  THE ENDLESS TOWER  (New Game+ only, from the pause menu in any town)
//
// A tower with a brand-new random floor every time you climb a staircase.
//
//   A RUN      After each floor you choose one of three boons. Boons last until the run ends
//              (you fall, Warp out or walk out). Gold, EXP and items you win are yours to keep.
//   FLOORS     5, 15, 25...  an old boss guards the stairs.
//              10, 20, 30... a UNIQUE tower boss (Storm Titan, Prism Golem, the twins Sol and Luna,
//                            then round again, stronger). Beating one gives:
//                              - permanent points on EVERY stat of every hero (+1 on floor 10, +2 on floor 20...),
//                              - a checkpoint: later runs may start on the floor above it,
//                              - the first time only, a RELIC: a permanent power.
//              3, 8, 13...   a trader waits in a dead end.
//              some floors   have a TWIST (a special rule), and some chests are MIMICS.
//   KEPT       G.tower (saved with the game, kept through New Game+): best floor, checkpoint,
//              relics, bosses beaten. The all-time records are stored apart from the saves (save.js).
//
// G.run = { floor, seed, mult: stat multipliers, startBuff, expBonus, twist, from: where we came from }
// The numbers to tune are in data.js ("THE ENDLESS TOWER").
// =====================================================================

const ENDLESS_GUARDIANS = ['cavelord', 'tombking', 'skydragon', 'magmalord'];     // floors 5, 15, 25, 35, then again

// The unique bosses of floors 10, 20, 30 (then the list starts again).
//   enemies: who you fight    relic: what the first victory gives (see RELICS in data.js)
const TOWER_BOSSES = [
  { name: 'Storm Titan', enemies: ['titan'], relic: 'titan',
    intro: ['STORM TITAN: Little sparks. I am the storm.', 'When it gathers its power, DEFEND - or be swept away.'] },
  { name: 'Prism Golem', enemies: ['prism'], relic: 'prism',
    intro: ['The golem turns, and its colours turn with it.', 'Its weakness changes every round. Point at it to see which element hurts it now.'] },
  { name: 'Sol and Luna', enemies: ['suntwin', 'moontwin'], relic: 'twins',
    intro: ['SOL: Sister, they have come far.  LUNA: Then they fall from high, brother.', 'When one twin falls, the other grows stronger.'] },
];
const towerBossOf = floor => TOWER_BOSSES[(floor / 10 - 1) % TOWER_BOSSES.length];

// TWISTS: a special rule for one floor (ordinary battles only, never the bosses).
const TWISTS = [
  { name: 'Ambush',        desc: 'The monsters always act before you.', ambush: true },
  { name: 'Silent halls',  desc: 'Items cannot be used in battle here.', noItems: true },
  { name: 'Rich pickings', desc: 'Monsters are stronger, but give double EXP and gold.', rich: true },
  ...ELEMENTS.map(el => ({ name: `Tide of ${el}`, desc: `Every monster here is weak to ${el}.`, element: el })),
];

// which monsters live on a floor: the set changes every 3 floors, and the tower's own monsters join in higher up
function endlessMonsters(floor) {
  const sets = [ZONES.tower1, ZONES.crypt, ZONES.tower10, ZONES.snow, ZONES.magma];
  const own = [[4, 'mender'], [7, 'warcaller'], [10, 'hexer'], [13, 'sentinel']].filter(([from]) => floor >= from).map(([, kind]) => kind);
  return [...sets[Math.floor((floor - 1) / 3) % sets.length], ...own];
}
// how far above the party the monsters of a floor are
const endlessLevel = floor => Math.floor(floor / 2);

// ---------- starting a run ----------
function askEndlessTower() {
  const items = [{ label: 'Start at Floor 1', pick: () => startEndlessRun(1), desc: 'Monsters get stronger every floor. You cannot save inside.' }];
  for (let c = 10; c <= G.tower.checkpoint; c += 10) {             // one line per checkpoint reached (they are never lost)
    const boons = TOWER_START_BOONS(c);
    items.push({ label: `Start at Floor ${c + 1}`, pick: () => startEndlessRun(c + 1),
                 desc: `Skip the first ${c} floors. You get ${boons} boon${boons === 1 ? '' : 's'} to start with.` });
  }
  items.push({ label: 'Records and Relics', pick: () => UI.openCustom(drawTowerRecords) });
  // items.push({ label: 'Not now', pick: () => UI.pop() });
  UI.openMenu({ x: 40, y: 50, rows: 9, title: `The Endless Tower  (best: floor ${G.tower.best})`, items });
}

function startEndlessRun(startFloor = 1) {
  G.run = { floor: startFloor - 1, seed: Math.floor(Math.random() * 1e9), expBonus: 1, startBuff: {}, twist: null,
            mult: { hp: 1, mp: 1, str: 1, def: 1, int: 1, mag: 1 },
            from: { map: player.map, x: player.x, y: player.y } };
  UI.clear();
  nextEndlessFloor();
  const intro = () => UI.say(['The Endless Tower. No one has ever found the top.',
                              'Climb the stairs to finish a floor and choose a boon. Leave by the door, by Warp... or by falling.'], announceTwist);
  // starting higher up: first hand out the boons you would have collected on the way
  const give = left => left > 0 ? chooseBoon(`A head start: choose a boon (${left} left)`, () => give(left - 1)) : intro();
  give(startFloor > 1 ? TOWER_START_BOONS(startFloor - 1) : 0);
}

// ---------- building a floor ----------
// (the same maze generator as the desert tower)
function nextEndlessFloor() {
  const run = G.run, floor = ++run.floor;
  const unique = floor % 10 === 0 ? towerBossOf(floor) : null;    // every 10th floor: a unique tower boss
  const guardian = floor % 5 === 0;                               // every 5th floor a boss guards the stairs
  const merchant = !guardian && floor % TOWER_MERCHANT_EVERY === TOWER_MERCHANT_AT;
  // Safety net: should a maze ever fail to build, try another one rather than leave you stranded.
  let made = null;
  for (let attempt = 0; !made && attempt < 20; attempt++) {
    try {
      made = generateFloor(run.seed + floor * 7919 + attempt * 104729, 19, 13, {
        wall: 'w', floor: '-', loops: 3, chests: merchant ? 2 : 1, anyStart: true,
        entry: floor === 1 ? 'E' : '-', next: guardian ? null : '<', guard: guardian ? 'exit' : null,
      });
    } catch (e) { made = null; }
  }
  for (const key in G.flags) if (key.startsWith('chest:endless:')) delete G.flags[key];     // new floor, new chest
  delete G.flags.runBoss;
  const stall = merchant && made.chests.length > 1 ? made.chests.pop() : null;              // the trader takes the second chest's dead end
  const lines = made.lines.map(line => [...line]);
  if (stall) lines[stall[1]][stall[0]] = '-';
  const bossKind = unique ? unique.enemies[0] : guardian ? ENDLESS_GUARDIANS[((floor - 5) / 10) % ENDLESS_GUARDIANS.length] : null;
  const map = makeDungeon('endless', lines.map(row => row.join('')), {
    wall: 'w', floor: '-', zone: 'endless',
    exits: { E: { endless: 'leave' }, '<': { endless: 'next' }, S: { endless: 'next' } },
    boss: bossKind, bossFlag: 'runBoss',
  });
  const treasure = [{ gold: 300 * floor }, { item: 'hipotion', n: 3 }, { item: 'hiether', n: 2 }, { item: 'remedy', n: 2 }, { item: 'elixir', n: 1 }];
  made.chests.forEach(c => { map.chests[c[0] + ',' + c[1]] = treasure[floor % treasure.length]; });
  wireBosses(map);                                                // the old bosses fight as usual...
  if (unique) for (const npc of map.npcs) { npc.name = unique.name; npc.onBump = () => towerBossFight(unique); }   // ...the tower's own have their own fight
  if (stall) map.npcs.push({ x: stall[0], y: stall[1], name: 'Trader', sprite: 'npcElder', onBump: () => towerTrader() });

  // a Mimic in the chest? a twist on the floor? (never on boss floors)
  // (plain Math.random: each floor is rolled on its own, so Mimics and twists are spread evenly through a climb)
  const lucky = Math.random;
  map.mimic = !guardian && floor >= TOWER_MIMIC_FROM && made.chests.length && lucky() < TOWER_MIMIC_CHANCE ? made.chests[0].join(',') : null;
  run.twist = !guardian && floor >= 3 && lucky() < TOWER_TWIST_CHANCE ? TWISTS[Math.floor(lucky() * TWISTS.length)] : null;
  run.traded = {};                                                // what has been bought from this floor's trader
  map.place = `Endless Tower - Floor ${floor}` + (run.twist ? ` (${run.twist.name})` : '');
  map.music = 'Tower';                                            // Tower1.mp3, Tower2.mp3... (Dungeon music if there are none)
  MAPS.endless = map;
  floorSign.map = null;                                           // show the floor name again
  // where do we come in? on the door (floor 1), otherwise wherever the maze put its entrance
  let start = findTile(map, 'E');
  if (!start) { const entry = made.entry; start = { x: entry[0], y: entry[1] }; }
  enterMap('endless', start.x, start.y, 'up');
}
function announceTwist() {
  const twist = G.run && G.run.twist;
  if (twist) UI.say(`This floor feels different...  ${twist.name.toUpperCase()}: ${twist.desc}`);
}

// ---------- boons ----------
// Offer three boons; when one is chosen, call then().
function chooseBoon(title, then) {
  const run = G.run;
  const stat = (name, key, pct) => ({ label: `${name} +${pct}%`, desc: `All heroes: ${name} +${pct}% until this run ends.`, apply: () => { run.mult[key] *= 1 + pct / 100; } });
  const floor = Math.max(1, run.floor);
  const pool = [
    stat('STR', 'str', 15), stat('DEF', 'def', 15), stat('MAG', 'mag', 15), stat('INT', 'int', 15), stat('max HP', 'hp', 20), stat('max MP', 'mp', 20),
    { label: 'Rest', desc: 'Restore all HP and MP right now.', apply: fullHeal },
    { label: 'Head start: DEF', desc: 'Begin every battle with one Guard Up already cast.', apply: () => { run.startBuff.def = Math.min(BUFF_MAX, (run.startBuff.def || 0) + 1); } },
    { label: 'Head start: STR', desc: 'Begin every battle with one Power Up already cast.', apply: () => { run.startBuff.str = Math.min(BUFF_MAX, (run.startBuff.str || 0) + 1); } },
    { label: 'Wisdom', desc: '+25% EXP from every battle until this run ends.', apply: () => { run.expBonus += 0.25; } },
    { label: 'Supplies', desc: 'Two Elixirs. Yours to keep.', apply: () => { gainItem('elixir', 2); } },
    { label: `Treasure: ${500 * floor} gold`, desc: 'Gold. Yours to keep.', apply: () => { G.gold += 500 * floor; } },
  ];
  const offers = pool.sort(() => Math.random() - 0.5).slice(0, 3);
  UI.openMenu({
    x: 60, y: 60, title,
    items: offers.map(boon => ({ label: boon.label, desc: boon.desc, pick: () => { boon.apply(); Sfx.play('save'); UI.clear(); then(); } })),
    onCancel: () => {},
  });
}

// Stairs reached: choose one of three boons, then on to the next floor.
function endlessFloorCleared() {
  Sfx.play('victory');
  chooseBoon(`Floor ${G.run.floor} cleared! Choose a boon:`, () => { nextEndlessFloor(); announceTwist(); });
}

// ---------- the unique bosses ----------
function towerBossFight(boss) {
  const floor = G.run.floor, lvl = clamp(avgLevel() + 2 + endlessLevel(floor), 1, levelCap());
  UI.say(boss.intro, () => Battle.start('endless', {
    boss: true, music: 'TowerBoss',                               // TowerBoss1.mp3... (Boss music if there are none)
    enemies: boss.enemies.map(kind => ({ kind, lvl })),
    onWin: () => {
      G.flags.runBoss = true;                                     // the boss is gone and the stairs appear
      Sfx.play('save');
      const t = G.tower, points = TOWER_STAT_POINTS(floor), pages = [`${boss.name} is beaten, and the way up opens.`];
      t.kills[boss.relic] = (t.kills[boss.relic] || 0) + 1;
      t.best = Math.max(t.best, floor);                           // beating the boss counts as clearing the floor
      noteRecord(r => { r.bosses++; r.best = Math.max(r.best, floor); });
      if (floor > t.checkpoint) { t.checkpoint = floor; pages.push(`CHECKPOINT: from now on a run can start at floor ${floor + 1}.`); }
      if (!t.relics[boss.relic]) {                                // the first victory: a relic
        t.relics[boss.relic] = true;
        pages.push(`RELIC FOUND: ${RELICS[boss.relic].name}!  ${RELICS[boss.relic].desc}  It is yours for ever.`);
      }
      // permanent stat points: every stat of every hero goes up (kept for ever in hero.bonus; they can lift a stat past the cap)
      for (const h of G.party) for (const key of TOWER_STATS) h.bonus[key] = (h.bonus[key] || 0) + points;
      t.points += points;
      pages.push(`The tower's power flows into the heroes: +${points} to EVERY stat of every hero, forever.`);
      UI.say(pages, () => Sfx.play('levelup'));
    },
  }));
}

const TOWER_STATS = ['hp', 'mp', 'str', 'def', 'int', 'mag'];        // the stats a tower boss raises

// ---------- the Mimic ----------
// Walking into its chest starts a fight you cannot run from. Winning it pays well.
function mimicFight(map, x, y) {
  const floor = G.run.floor;
  Sfx.play('chest');
  UI.say(['You reach for the chest...', 'It has TEETH! A Mimic! There is no running from this one.'], () => Battle.start('endless', {
    boss: true, music: 'TowerBoss',
    enemies: [{ kind: 'mimic', lvl: clamp(avgLevel() + 1 + endlessLevel(floor), 1, levelCap()) }],
    onWin: () => {
      G.flags[`chest:endless:${x},${y}`] = true;                  // now it is just an open chest
      G.tower.mimics++;
      noteRecord(r => { r.mimics++; });
      payMimicPoints();                                           // permanent: every stat of every hero goes up
      const gold = 1000 * floor;
      G.gold += gold;
      const got = gainItem('elixir', 2);
      Sfx.play('chest');
      UI.say([`Inside the Mimic: ${gold} gold and 2 Elixirs!` + spareItemText(got),
              `Its strength passes to the heroes: +${TOWER_MIMIC_POINTS} to EVERY stat of every hero, forever.`,
              'And something more: its hoard holds a boon.'],
             () => chooseBoon("The Mimic's hoard: choose a boon", () => {}));
    },
  }));
}

// Hand out the permanent stat points for every Mimic beaten that has not been paid for yet.
// (G.tower.mimicsPaid counts the ones already rewarded, so Mimics beaten before this reward
// existed are paid for the next time the game is loaded.) Returns how many points were given.
function payMimicPoints() {
  const t = G.tower, points = (t.mimics - (t.mimicsPaid || 0)) * TOWER_MIMIC_POINTS;
  t.mimicsPaid = t.mimics;
  if (points <= 0) return 0;
  for (const h of G.party) for (const key of TOWER_STATS) h.bonus[key] = (h.bonus[key] || 0) + points;
  t.points += points;
  return points;
}

// ---------- the trader ----------
function towerTrader() {
  const run = G.run, floor = run.floor, restPrice = TOWER_REST_PRICE * floor, boonPrice = TOWER_BOON_PRICE * floor;
  const buy = (price, what) => () => { G.gold -= price; Sfx.play('buy'); UI.pop(); what(); };
  const again = () => towerTrader();
  const item = id => ({ label: ITEMS[id].name, right: G.items[id] >= MAX_ITEMS ? 'FULL' : itemPrice(id) + 'G',
                        disabled: G.gold < itemPrice(id) || G.items[id] >= MAX_ITEMS, desc: `${ITEMS[id].desc}. You have ${G.items[id]}.`,
                        pick: buy(itemPrice(id), () => { G.items[id]++; again(); }) });
  UI.openMenu({
    x: 40, y: 50, title: `TRADER - Gold: ${G.gold}`,
    items: [
      { label: 'A good rest', right: restPrice + 'G', disabled: G.gold < restPrice, desc: 'Restores all HP and MP.',
        pick: buy(restPrice, () => { fullHeal(); Sfx.play('heal'); again(); }) },
      { label: 'A boon', right: run.traded.boon ? 'SOLD' : boonPrice + 'G', disabled: run.traded.boon || G.gold < boonPrice,
        desc: 'Choose one of three boons, like after a floor. One per trader.',
        pick: buy(boonPrice, () => { run.traded.boon = true; chooseBoon('The trader spreads out his wares: choose a boon', () => {}); }) },
      item('elixir'), item('remedy'), item('revive'),
      { label: 'Leave', pick: () => UI.pop() },
    ],
  });
}

// ---------- leaving ----------
function askLeaveEndless() {
  UI.openMenu({
    x: 60, y: 70, title: 'Leave the tower? The run ends and the boons are lost.',
    items: [{ label: 'Stay', pick: () => UI.pop() }, { label: 'Leave', pick: () => { UI.clear(); endEndlessRun('You step back out into the daylight.'); } }],
  });
}

// The run is over: boons vanish, and we are back where we started.
function endEndlessRun(text) {
  const run = G.run, cleared = run.floor - 1;
  G.tower.best = Math.max(G.tower.best, cleared);
  noteRecord(r => { r.best = Math.max(r.best, cleared); });
  G.run = null;
  for (const h of G.party) { h.hp = Math.min(h.hp, maxStat(h, 'hp')); h.mp = Math.min(h.mp, maxStat(h, 'mp')); }   // the HP boon is gone too
  enterMap(run.from.map, run.from.x, run.from.y, 'down');
  UI.say([text, `Floors cleared this run: ${cleared}.  Best ever: ${G.tower.best}.`,
          'The boons fade away, but everything you won is yours to keep: gold, EXP, items, stat points and relics.']);
}

// ---------- the records page ----------
function drawTowerRecords() {
  const t = G.tower, rec = readRecords();
  drawWindow(8, 8, 304, 224);
  let y = 14;
  const line = (text, color = '#fff', x = 16) => { drawText(text, x, y, color); y += 11; };
  line('THE ENDLESS TOWER', '#ffd75e');
  line(`Current Game:  Best Floor ${t.best}         Checkpoint: Floor ${t.checkpoint ? t.checkpoint + 1 : 1}`);
  line(`Permanent Bonus: +${t.points} to all stats    Mimics Beaten: ${t.mimics}`);
  y += 3; line('BOSSES BEATEN', '#ffd75e');
  TOWER_BOSSES.forEach((b, i) => line(`Floor ${(i + 1) * 10}+   ${b.name}`.padEnd(30) + `x ${t.kills[b.relic] || 0}`));
  y += 3; line('RELICS', '#ffd75e');
  for (const b of TOWER_BOSSES) {
    const have = t.relics[b.relic], relic = RELICS[b.relic];
    line(have ? relic.name : '? ? ?', have ? '#7dff9a' : '#8088a8');
    wrapText(have ? relic.desc : `Beat ${b.name} to find out.`, 270).forEach(text => line(text, have ? '#fff' : '#8088a8', 26));
  }
  y += 3; line('ALL-TIME RECORDS', '#ffd75e');
  line(`Best Floor ${rec.best}    Bosses Beaten ${rec.bosses}    Mimics Beaten ${rec.mimics}`);
}
