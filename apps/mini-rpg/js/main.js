// =====================================================================
// main.js  -  Ties everything together: keyboard, walking around,
// shops, the pause menu and the game loop.
// =====================================================================

let mode = 'title';                   // 'title', 'explore', 'battle', 'ending' or 'bye'

const player = { map: 'town', x: MAPS.town.start.x, y: MAPS.town.start.y, dir: 'down',
                 moving: false, t: 0, fromX: 0, fromY: 0, safeSteps: 0,
                 onBoat: false,       // are we sailing?
                 followers: [] };     // where SORUTRA and RAYEN are walking (they trail behind ARTUROS)

// Put the two followers on the leader's tile. They stay hidden there until he walks off.
function resetFollowers() {
  player.followers = [0, 1].map(() => ({ x: player.x, y: player.y, fromX: player.x, fromY: player.y, dir: player.dir }));
}
resetFollowers();
const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const MOVE_TIME = 0.16;               // seconds to walk one tile

// ---------------------------------------------------------------------
// KEYBOARD
// ---------------------------------------------------------------------
const KEYMAP = {
  ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
  KeyZ: 'ok', Enter: 'ok', Space: 'ok', KeyX: 'cancel', Escape: 'cancel',
};
const held = {};                      // which actions are held down right now

let ctrlHeld = false;                 // while Ctrl is down the arrow keys do nothing, so Ctrl+S does not walk you downwards
let bulkKey = false;                  // is Shift or Ctrl held right now? (item shops: buy 10 at once)

// START IN FULL SCREEN: a web page is not allowed to go full screen by itself - the browser only
// permits it as the answer to a key press or a click. So the game does it on the FIRST key or click
// after the page opens (Options > "Start in full screen" turns this off).
let fullScreenAsked = false;
function autoFullScreen() {           // returns true if it asked just now
  if (fullScreenAsked) return false;
  fullScreenAsked = true;
  if (!settings.startFull || document.fullscreenElement) return false;
  document.documentElement.requestFullscreen().catch(() => { fullScreenAsked = false; });   // refused: try again on the next key or click
  return true;
}

addEventListener('keydown', e => {
  Sfx.unlock(); Music.unlock();       // browsers only allow sound after a key press
  const wentFull = !['Escape', 'Tab', 'ControlLeft', 'ControlRight', 'ShiftLeft', 'ShiftRight', 'AltLeft', 'AltRight', 'MetaLeft', 'MetaRight'].includes(e.code) && autoFullScreen();
  bulkKey = e.shiftKey || e.ctrlKey;
  ctrlHeld = e.ctrlKey;
  if (e.ctrlKey && e.code === 'KeyS') { e.preventDefault(); if (!e.repeat) quickSave(); return; }   // Ctrl+S: quick save
  if (e.code === 'KeyM' && !e.repeat) toggleMute();
  if (e.code === 'Tab') { e.preventDefault(); if (!e.repeat) toggleWorldMap(); return; }
  if (!e.repeat && !e.ctrlKey && !e.altKey) {                    // display shortcuts
    if (e.code === 'KeyF') { if (mode === 'battle') Battle.favKey(); else if (!wentFull) toggleFullScreen(); }   // in battle F is the favorite key
    if (e.code === 'KeyC') toggleScanlines();
    if (e.code === 'KeyV') nextScreenSize();
  }
  const action = KEYMAP[e.code];
  if (!action) return;
  e.preventDefault();
  if (e.repeat) return;               // only react to the first press, not auto-repeat
  if (e.ctrlKey && DIRS[action]) return;   // Ctrl + a direction key: ignored
  held[action] = true;
  doAction(action);
});

// One press of a game button. The keyboard and the mouse both end up here.
function doAction(action) {
  if (UI.active) UI.key(action);
  else if (mode === 'battle') Battle.key(action);
  else if (mode === 'bye') { if (action === 'ok') showTitle(); }
  else if (action === 'ok') interact();
  else if (action === 'cancel') { Sfx.play('ok'); openMainMenu(); }
}
addEventListener('keyup', e => {
  bulkKey = e.shiftKey || e.ctrlKey;
  ctrlHeld = e.ctrlKey;
  const a = KEYMAP[e.code]; if (a) held[a] = false;
});

// ---------------------------------------------------------------------
// MOUSE
//   left click  : choose a menu line / continue a message / walk to that spot
//   hold left   : keep walking towards the mouse pointer
//   right click : cancel, or open the menu while walking (same as X)
// ---------------------------------------------------------------------
const camera = { x: 0, y: 0 };        // top-left corner of the view, set by drawExplore
const mouse = { x: 0, y: 0, down: false, heldTime: 0, inside: false };   // "down" = left button held while walking
const HOLD_DELAY = 0.25;              // seconds before a click counts as "holding"
const DIAGONAL_SLOPE = 0.41;           // how far off-axis the pointer must be to walk diagonally (0.41 = 22 degrees)

function mousePos(e) {                // mouse position in game pixels (0..320, 0..240)
  const r = canvas.getBoundingClientRect();
  return { x: (e.clientX - r.left) / r.width * SCREEN_W, y: (e.clientY - r.top) / r.height * SCREEN_H };
}
canvas.addEventListener('mousemove', e => {
  const m = mousePos(e);
  mouse.x = m.x; mouse.y = m.y; mouse.inside = true;
  UI.hover(m.x, m.y);
  if (mode === 'battle') Battle.hover(m.x, m.y);
});
addEventListener('mouseup', () => { mouse.down = false; });               // released anywhere, even off the game
addEventListener('blur', () => { mouse.down = false; ctrlHeld = false; });
canvas.addEventListener('mouseleave', () => { mouse.inside = false; });   // hide our sword pointer outside the game
canvas.addEventListener('wheel', e => {                                   // mouse wheel scrolls long lists
  e.preventDefault();
  UI.wheel(e.deltaY > 0 ? 1 : -1);
}, { passive: false });
canvas.addEventListener('contextmenu', e => e.preventDefault());          // no browser menu on right click
canvas.addEventListener('mousedown', e => {
  e.preventDefault();
  bulkKey = e.shiftKey || e.ctrlKey;
  Sfx.unlock(); Music.unlock();
  autoFullScreen();                   // the first click also takes the game to full screen
  const m = mousePos(e);
  if (e.button === 2) return doAction('cancel');
  if (e.button !== 0) return;
  if (mode === 'battle' && Battle.click(m.x, m.y)) return;                // clicked on a monster
  if (UI.active) UI.click(m.x, m.y);
  else if (mode === 'explore') {
    Object.assign(mouse, { x: m.x, y: m.y, down: true, heldTime: 0 });
    walkTo(Math.floor((m.x + camera.x) / TILE), Math.floor((m.y + camera.y) / TILE));
  }
  else doAction('ok');
});

// Is there something on this tile you would bump into? (wall, water, door, chest, person)
function isObstacle(map, x, y) {
  const tile = tileAt(map, x, y);
  if (player.onBoat && map === MAPS.world && tile === '~') return false;         // aboard the boat, water is the road
  return map.solid.includes(tile) || !!map.doors[x + ',' + y]
      || visibleNpcs(map).some(n => n.x === x && n.y === y);
}
// Tiles a mouse-walk must not pass over: obstacles, and exits (so you never leave a map by accident).
function isBlocked(map, x, y) {
  return isObstacle(map, x, y) || !!map.exits[tileAt(map, x, y)];
}

// How many steps is every tile away from the goal? (flood fill outwards from the goal)
function distancesFrom(map, gx, gy) {
  const dist = { [gx + ',' + gy]: 0 };
  const queue = [[gx, gy]];
  while (queue.length) {
    const [x, y] = queue.shift();
    for (const dir in DIRS) {
      const nx = x + DIRS[dir][0], ny = y + DIRS[dir][1], key = nx + ',' + ny;
      if (nx < 0 || ny < 0 || nx >= map.w || ny >= map.h || key in dist) continue;
      if (isBlocked(map, nx, ny) && !(nx === player.x && ny === player.y)) continue;
      dist[key] = dist[x + ',' + y] + 1;
      queue.push([nx, ny]);
    }
  }
  return dist;
}

// While the button is held, steer towards the pointer, one step at a time.
// Every step we look at the four directions, best-aimed first, and take the first
// one that brings us closer to the tile under the pointer. So the party turns as
// soon as the pointer is more "up" than "sideways" (and so on), zig-zags when the
// pointer is diagonal, yet still walks around walls. Unlike a click, holding never opens doors or talks to people.
function followMouse() {
  const map = MAPS[player.map];
  // pointer position, measured in pixels from the middle of the party's tile
  const dx = mouse.x + camera.x - (player.x * TILE + TILE / 2);
  const dy = mouse.y + camera.y - (player.y * TILE + TILE / 2);
  const tx = Math.floor((mouse.x + camera.x) / TILE), ty = Math.floor((mouse.y + camera.y) / TILE);
  player.path = null;
  if (tx === player.x && ty === player.y) return;      // pointing at ourselves: stand still

  const aim = dir => DIRS[dir][0] * dx + DIRS[dir][1] * dy;          // how well does this direction point at the mouse?
  const ranked = Object.keys(DIRS).sort((a, b) => aim(b) - aim(a));   // best-aimed direction first
  // Pointer roughly diagonal from us (more than ~22 degrees off both axes)? Then zig-zag:
  // put the second-best direction first whenever the best one is the way we just stepped.
  const ax = Math.abs(dx), ay = Math.abs(dy);
  if (Math.min(ax, ay) > DIAGONAL_SLOPE * Math.max(ax, ay) && ranked[0] === player.dir) {
    ranked.unshift(ranked.splice(1, 1)[0]);
  }

  const onMap = tx >= 0 && ty >= 0 && tx < map.w && ty < map.h;
  const dist = onMap ? distancesFrom(map, tx, ty) : {};
  const here = dist[player.x + ',' + player.y];        // undefined = there is no way to that tile
  const goalIsObstacle = onMap && isObstacle(map, tx, ty);

  for (const dir of ranked) {
    const nx = player.x + DIRS[dir][0], ny = player.y + DIRS[dir][1];
    if (nx < 0 || ny < 0 || nx >= map.w || ny >= map.h) continue;
    const isGoal = nx === tx && ny === ty;
    if (isGoal ? goalIsObstacle : isBlocked(map, nx, ny)) continue;  // cannot (or should not) step there
    if (here !== undefined ? dist[nx + ',' + ny] === here - 1       // a real route: only steps that get closer
                           : aim(dir) > 0) {                         // no route (open sea...): just head that way
      player.path = [dir];
      return;
    }
  }
}

// Click-to-move: find the shortest way to the clicked tile, then walk it step by step.
function walkTo(tx, ty) {
  const map = MAPS[player.map];
  if (tx < 0 || ty < 0 || tx >= map.w || ty >= map.h) return;
  player.path = findPath(map, player.x, player.y, tx, ty);
}

// The shortest way from (sx, sy) to (tx, ty) as a list of directions like ['up', 'up', 'left'],
// or null if there is no way. The goal itself may be a door, a person, a chest...
// Of all the shortest routes it picks the one that heads most directly at the goal.
function findPath(map, sx, sy, tx, ty) {
  const dist = distancesFrom(map, tx, ty);
  if (dist[sx + ',' + sy] === undefined) return null;
  const path = [];
  let x = sx, y = sy;
  while (x !== tx || y !== ty) {
    const aim = dir => DIRS[dir][0] * (tx - x) + DIRS[dir][1] * (ty - y);
    const dir = Object.keys(DIRS).sort((a, b) => aim(b) - aim(a))
      .find(d => dist[(x + DIRS[d][0]) + ',' + (y + DIRS[d][1])] === dist[x + ',' + y] - 1);
    path.push(dir);
    x += DIRS[dir][0]; y += DIRS[dir][1];
  }
  return path;
}

// ---------------------------------------------------------------------
// WALKING AROUND
// ---------------------------------------------------------------------
function tryMove(dir) {
  player.dir = dir;
  const map = MAPS[player.map];
  const nx = player.x + DIRS[dir][0], ny = player.y + DIRS[dir][1];
  if (nx < 0 || ny < 0 || nx >= map.w || ny >= map.h) return;

  const tile = tileAt(map, nx, ny), key = nx + ',' + ny;

  // --- the boat (world map only) ---
  const world = map === MAPS.world, boat = G.flags.boat;
  let sailing = false, landing = false;
  if (world && player.onBoat) {
    if (tile === '~') sailing = true;                                        // keep sailing
    else if (map.solid.includes(tile) || map.doors[key]) return;             // cannot land on rocks or houses
    else landing = true;                                                     // step ashore: the boat stays behind
  } else if (world && boat && boat.x === nx && boat.y === ny) {
    sailing = true;                                                          // walk onto the boat
  }

  if (!sailing) {
    const door = map.doors[key];
    if (door) { held[dir] = false; Sfx.play('door'); door(); return; }              // walking into a door opens it
    if (tile === '$') { held[dir] = false; openChest(map, nx, ny); return; }        // walking into a chest opens it
    if (map.solid.includes(tile)) return;                         // wall, tree, water...
    const npc = visibleNpcs(map).find(n => n.x === nx && n.y === ny);
    if (npc) { if (npc.onBump) { held[dir] = false; npc.onBump(); } return; }       // someone is standing there
  }
  if (sailing !== player.onBoat || landing) Sfx.play('door');     // getting on or off
  player.onBoat = sailing;
  if (sailing) G.flags.boat = { x: nx, y: ny };                   // the boat goes where we go

  // the others follow in a line: each steps onto the tile the one in front of them just left
  let ahead = { x: player.x, y: player.y };
  for (const f of player.followers) {
    const old = { x: f.x, y: f.y };
    f.fromX = f.x; f.fromY = f.y; f.x = ahead.x; f.y = ahead.y;
    f.dir = Object.keys(DIRS).find(d => DIRS[d][0] === f.x - f.fromX && DIRS[d][1] === f.y - f.fromY) || f.dir;
    ahead = old;
  }
  if (sailing || landing) for (const f of player.followers) Object.assign(f, { x: nx, y: ny, fromX: nx, fromY: ny });   // everyone is aboard / hops off together

  player.fromX = player.x; player.fromY = player.y;
  player.x = nx; player.y = ny;
  player.moving = true; player.t = 0;
}

// ---------------------------------------------------------------------
// THE BOAT
// G.flags.boat = { x, y } is where the boat is. It appears near Starfall once the Tomb King
// is beaten. Warping to a town (or being carried back after a defeat) brings it along,
// so it can never be stranded where you cannot reach it.
// ---------------------------------------------------------------------
let openSea = null;                   // every water tile the boat can reach (worked out once)
const dockCache = {};

// The water tile nearest to a town where the boat can wait.
function dockFor(townName) {
  if (dockCache[townName]) return dockCache[townName];
  const W = MAPS.world, STEPS = Object.values(DIRS), inside = (x, y) => x >= 0 && y >= 0 && x < W.w && y < W.h;
  if (!openSea) {                                                 // flood fill from the corner of the map across the water
    openSea = new Set(['0,0']);
    const queue = [[0, 0]];
    while (queue.length) {
      const [x, y] = queue.pop();
      for (const [dx, dy] of STEPS) {
        const nx = x + dx, ny = y + dy, key = nx + ',' + ny;
        if (inside(nx, ny) && !openSea.has(key) && W.rows[ny][nx] === '~') { openSea.add(key); queue.push([nx, ny]); }
      }
    }
  }
  // walk outwards from the town over land until we stand next to that water
  const start = findTile(W, Object.keys(W.exits).find(letter => W.exits[letter].to === townName));
  const seen = new Set([start.x + ',' + start.y]), queue = [[start.x, start.y]];
  while (queue.length) {
    const [x, y] = queue.shift();
    for (const [dx, dy] of STEPS) {
      const nx = x + dx, ny = y + dy, key = nx + ',' + ny;
      if (!inside(nx, ny) || seen.has(key)) continue;
      if (openSea.has(key)) return (dockCache[townName] = { x: nx, y: ny });
      seen.add(key);
      if (!W.solid.includes(W.rows[ny][nx]) && !W.exits[W.rows[ny][nx]]) queue.push([nx, ny]);
    }
  }
}
function bringBoatTo(townName) {
  player.onBoat = false;
  if (G.flags.boat) G.flags.boat = dockFor(townName);
}

// called when the player finishes stepping onto a new tile
function arrive() {
  const map = MAPS[player.map];
  const tile = tileAt(map, player.x, player.y);

  // exits: town gates, town and cave icons on the world map, stairs...
  const exit = map.exits[tile];
  if (exit) { travel(exit); return; }

  // random battles (towns have no zoneFor, so they are safe)
  const zone = map.zoneFor ? map.zoneFor(tile, player.x, player.y) : null;
  if (!zone) return;
  let chance = ENCOUNTER_CHANCE[tile] || 0;
  if (G.flags.ward > 0) {                                         // a Ward Charm is active
    chance *= WARD_FACTOR;
    if (--G.flags.ward === 0) { player.path = null; mouse.down = false; UI.say("The Ward Charm's glow fades away."); return; }
  }
  if (player.safeSteps > 0) { player.safeSteps--; return; }      // a few safe steps after each battle
  if (Math.random() < chance) {
    player.safeSteps = 4;
    player.path = null; mouse.down = false;                       // a battle interrupts click-to-move
    Battle.start(zone, zone === 'endless' ? { list: endlessMonsters(G.run.floor), levelBonus: Math.floor(G.run.floor / 2) } : {});
  }
}

// An exit says which map to go to, and either a position (x, y) or a tile
// letter to look for on that map (at: 'H' = "wherever the H tile is").
function travel(exit) {
  if (exit.endless === 'next') return endlessFloorCleared();      // stairs in the Endless Tower
  if (exit.endless === 'leave') return askLeaveEndless();
  const target = MAPS[exit.to];
  const pos = exit.at ? findTile(target, exit.at) : exit;
  if (target.isTown) visitTown(exit.to);
  if (target.isDungeon && player.map === 'world') {               // remember which cave mouth we used (for Warp)
    G.flags.caveEntry = tileAt(MAPS.world, player.x, player.y);
  }
  Sfx.play('door');
  enterMap(exit.to, pos.x, pos.y, exit.dir || player.dir);
}

const visibleNpcs = map => map.npcs.filter(n => !(n.hidden && n.hidden()));

function openChest(map, x, y) {
  if (map.mimic === x + ',' + y) return mimicFight(map, x, y);    // Endless Tower: this chest bites (see tower.js)
  let loot = [].concat(map.chests[x + ',' + y]);                  // one thing, or a list of things
  const rich = richChests(map);                                   // New Game+: better treasure (see chestLoot in data.js)
  if (rich) loot = loot.map(chestLoot);
  G.flags[`chest:${map.name}:${x},${y}`] = true;                  // tileAt() now shows it as opened
  Sfx.play('chest');
  // hand the things out one after another; each one shows a message (armor also asks a question)
  const next = i => {
    if (i < loot.length) giveLoot(loot[i], i === 0 ? (rich ? 'You open the gleaming chest. ' : 'You open the chest. ') : '', () => next(i + 1));
    else if (map.endingChest === x + ',' + y) startEnding();     // the last treasure of all: the story ends
  };
  next(0);
}

// Hand out one piece of treasure, show a message, then call done(). Loot can be:
//   { gold: 500 }   { item: 'potion', n: 3 }   { weapon: 'sword', tier: 6 }   { armor: 6 }
// A weapon goes to the hero who uses that kind (if it is better). For armor you are asked
// who should wear it. Gear nobody needs is sold for half price.
function giveLoot(loot, intro, done) {
  const say = text => UI.say(intro + text, done);
  if (loot.gold) { G.gold += loot.gold; return say(`Found ${loot.gold} gold!`); }
  if (loot.item) {
    const got = gainItem(loot.item, loot.n);            // what does not fit is used on whoever needs it (data.js)
    return say(`Found ${loot.n} x ${ITEMS[loot.item].name}!` + spareItemText(got));
  }

  const toBag = (pocket, tier, gear) => { addToBag(pocket, tier); return `It goes into the bag.`; };
  // put the gear on a hero; what they had before goes into the bag. Returns the message.
  const equip = (hero, kind, tier, gear, old) => {
    const hadStarter = hero[kind] === 0;
    equipGear(hero, kind, tier);
    return `${hero.name} equips the ${gear.name}.` + (hadStarter ? '' : ` The ${old.name} goes into the bag.`);
  };

  if (loot.weapon) {
    const gear = WEAPONS[loot.weapon][loot.tier];
    const hero = G.party.find(h => h.cls.weapon === loot.weapon);           // only one hero can use it
    if (hero.weapon >= loot.tier) return say(`Found ${gear.name}! ${hero.name} already has better. ` + toBag(loot.weapon, loot.tier, gear));
    return say(`Found ${gear.name}! ` + equip(hero, 'weapon', loot.tier, gear, weaponOf(hero)));
  }

  // armor: anyone can wear it, so ask
  const tier = loot.armor, gear = ARMORS[tier];
  if (G.party.every(h => h.armor >= tier)) return say(`Found ${gear.name}! Everyone already wears better. ` + toBag('armor', tier, gear));
  UI.say(intro + `Found ${gear.name} (DEF+${gear.def})!`, () => UI.openMenu({
    x: 60, y: 60, title: `Who should wear the ${gear.name}?`,
    items: [
      ...G.party.map(h => {
        const old = ARMORS[h.armor];
        return { label: h.name, right: `${old.name} (DEF+${old.def})`, disabled: h.armor >= tier,
                 pick: () => { Sfx.play('buy'); UI.pop(); UI.say(equip(h, 'armor', tier, gear, old), done); } };
      }),
      { label: 'Nobody - put it in the bag', pick: () => { UI.pop(); UI.say(toBag('armor', tier, gear), done); } },
    ],
    onCancel: () => {},                                 // you have to decide: the chest is already open
  }));
}

// Start a boss battle. Everything about each boss is in the BOSSES table in data.js.
function bossFight(kind, npc = {}) {
  const boss = BOSSES[kind], guardian = !!npc.bossFlag;           // guardian = a boss met in the Endless Tower
  const lvl = guardian ? avgLevel() + 2 + Math.floor(G.run.floor / 2) : Math.max(boss.minLvl, avgLevel() + boss.bonus);
  UI.say(guardian ? [`A guardian bars the way up: ${ENEMIES[kind].name}!`] : boss.intro, () =>
    Battle.start(guardian ? 'endless' : boss.zone, {
      boss: true,
      enemies: [{ kind, lvl: clamp(lvl, 1, levelCap()) }],
      onWin: () => {
        G.flags[npc.bossFlag || boss.flag] = true;                // hides the boss and opens what he was guarding
        Sfx.play('save');
        UI.say(guardian ? ['The guardian falls, and the way up opens.'] : boss.win);
      },
    }));
}
// every boss standing on a map starts his fight when you walk into him
function wireBosses(map) { for (const npc of map.npcs) if (npc.boss) npc.onBump = () => bossFight(npc.boss, npc); }
Object.values(MAPS).forEach(wireBosses);

function enterMap(name, x, y, dir) {
  mouse.down = false;                                             // let go of the mouse-walk on a new map
  // ...and of the arrow keys: you must press again to keep walking, so holding a key
  // does not carry you straight back out through the door you just came in by
  for (const d in DIRS) held[d] = false;
  Object.assign(player, { map: name, x, y, dir, moving: false, safeSteps: 4, path: null });
  if (name !== 'world') player.onBoat = false;                    // nobody sails indoors
  resetFollowers();
}

// Z / Enter: talk to whoever is in front of you
function interact() {
  const map = MAPS[player.map];
  const tx = player.x + DIRS[player.dir][0], ty = player.y + DIRS[player.dir][1];
  const npc = visibleNpcs(map).find(n => n.x === tx && n.y === ty);
  if (npc && npc.onBump) npc.onBump();
  else if (npc) UI.say(npc.lines.map(line => `${npc.name}: ${line}`));
}

function onPartyDefeated() {
  if (G.run) {                                                    // falling in the Endless Tower only ends the run
    fullHeal();
    return endEndlessRun('The party is carried out of the tower.');
  }
  G.gold = Math.floor(G.gold / 2);
  fullHeal();
  const home = G.flags.home || 'town';                            // the last town we visited
  enterMap(home, MAPS[home].innFront.x, MAPS[home].innFront.y, 'down');
  bringBoatTo(home);
  UI.say(['You wake up at the inn. Someone carried you back...', `Half of your gold is gone. (Gold: ${G.gold})`]);
}

// ---------------------------------------------------------------------
// SHOPS  (each door in town is connected to one of these)
// ---------------------------------------------------------------------
// lo..hi = which weapon tiers this shop sells
// Buying puts the new gear on straight away; the old piece goes into the bag (sell it under "Sell gear").
function weaponShop(lo, hi, cur = 0) {
  const items = [];
  for (const h of G.party) {
    WEAPONS[h.cls.weapon].forEach((w, tier) => {
      if (tier < lo || tier > hi) return;
      const owned = h.weapon >= tier, old = weaponOf(h);
      items.push({
        label: `${w.name} (${h.name}) ATK+${w.atk}`, right: owned ? 'OWNED' : w.price + 'G',
        disabled: owned || G.gold < w.price,
        desc: owned ? '' : `${h.name}: ATK ${atkOf(h)} -> ${atkOf(h) - old.atk + w.atk}. The old weapon goes into the bag.`,
        pick: (it, menu) => {
          G.gold -= w.price; equipGear(h, 'weapon', tier); Sfx.play('buy');
          UI.pop();
          UI.say(`${h.name} equips the ${w.name}!`, () => weaponShop(lo, hi, menu.cur));
        },
      });
    });
  }
  items.push({ label: 'Sell gear', desc: 'Sell spare weapons from the bag for half price.', pick: () => sellMenu(['sword', 'bow', 'staff']) });
  items.push({ label: 'Leave', pick: () => UI.pop() });
  UI.openMenu({ x: 8, y: 8, title: `WEAPON SHOP - Gold: ${G.gold}`, items, cur });
}

function armorShop(lo, hi, cur = 0) {
  const items = ARMORS.slice(lo, hi + 1).map((a, i) => ({
    label: `${a.name} DEF+${a.def}`, right: a.price + 'G', disabled: G.gold < a.price,
    pick: (it, menu) => {
      // armor fits anyone, so ask who should wear it
      const bought = text => { G.gold -= a.price; Sfx.play('buy'); UI.pop(); UI.pop(); UI.say(text, () => armorShop(lo, hi, menu.cur)); };
      UI.openMenu({
        x: 150, y: 60, title: 'For whom?',
        items: [
          ...G.party.map(h => ({
            label: h.name, right: ARMORS[h.armor].name, disabled: h.armor >= lo + i,
            desc: h.armor >= lo + i ? '' : `${h.name}: DEF ${defOf(h)} -> ${defOf(h) - ARMORS[h.armor].def + a.def}. The old armor goes into the bag.`,
            pick: () => { equipGear(h, 'armor', lo + i); bought(`${h.name} puts on the ${a.name}!`); },
          })),
          { label: 'Put it in the bag', pick: () => { addToBag('armor', lo + i); bought(`The ${a.name} goes into the bag.`); } },
        ],
      });
    },
  }));
  items.push({ label: 'Sell gear', desc: 'Sell spare armor from the bag for half price.', pick: () => sellMenu(['armor']) });
  items.push({ label: 'Leave', pick: () => UI.pop() });
  UI.openMenu({ x: 8, y: 8, title: `ARMOR SHOP - Gold: ${G.gold}`, items, cur });
}

// Everything in the given pockets of the bag, best first: [{ pocket, tier, gear, count }]
function bagContents(pockets) {
  const out = [];
  for (const pocket of pockets)
    for (const tier of Object.keys(G.bag[pocket]).map(Number).sort((a, b) => b - a))
      out.push({ pocket, tier, gear: gearList(pocket)[tier], count: G.bag[pocket][tier] });
  return out;
}

function sellMenu(pockets, cur = 0) {
  const items = bagContents(pockets).map(({ pocket, tier, gear, count }) => ({
    label: `${gear.name} x${count}`, right: sellValue(gear) + 'G',
    pick: (it, menu) => { takeFromBag(pocket, tier); G.gold += sellValue(gear); Sfx.play('buy'); UI.pop(); sellMenu(pockets, menu.cur); },
  }));
  if (!items.length) items.push({ label: 'Nothing to sell', disabled: true });
  items.push({ label: 'Back', pick: () => UI.pop() });
  UI.openMenu({ x: 60, y: 30, title: `SELL - Gold: ${G.gold}`, items, cur });
}

// ---------------------------------------------------------------------
// EQUIP PAGE  (pause menu): swap weapons and armor with what is in the bag
// ---------------------------------------------------------------------
function equipMenu(cur = 0) {
  UI.openMenu({
    x: 126, y: 8, title: 'EQUIP - whose gear?', cur,
    items: G.party.map(h => ({ label: h.name, right: `ATK ${atkOf(h)}  DEF ${defOf(h)}`, pick: () => equipSlotMenu(h) })),
  });
}
function equipSlotMenu(h, cur = 0) {
  const w = weaponOf(h), a = ARMORS[h.armor];
  UI.openMenu({
    x: 126, y: 62, title: `${h.name}'s gear`, cur,
    items: [
      { label: `Weapon: ${w.name}`, right: `ATK+${w.atk}`, pick: () => gearPickMenu(h, 'weapon') },
      { label: `Armor:  ${a.name}`, right: `DEF+${a.def}`, pick: () => gearPickMenu(h, 'armor') },
    ],
  });
}
function gearPickMenu(h, kind) {
  const pocket = kind === 'weapon' ? h.cls.weapon : 'armor';
  const stat = kind === 'weapon' ? 'ATK' : 'DEF', key = kind === 'weapon' ? 'atk' : 'def';
  const now = gearList(pocket)[h[kind]], total = kind === 'weapon' ? atkOf(h) : defOf(h);
  const items = bagContents([pocket]).map(({ tier, gear, count }) => ({
    label: `${gear.name} x${count}`, right: `${stat}+${gear[key]}`,
    desc: `${h.name}: ${stat} ${total} -> ${total - now[key] + gear[key]}`,
    pick: () => {
      takeFromBag(pocket, tier); equipGear(h, kind, tier);       // the old piece goes back into the bag
      Sfx.play('buy');
      UI.pop(); UI.pop(); UI.pop();                               // rebuild the three lists with the new gear
      equipMenu(G.party.indexOf(h)); equipSlotMenu(h, kind === 'weapon' ? 0 : 1);
    },
  }));
  if (!items.length) items.push({ label: 'Nothing in the bag fits', disabled: true });
  UI.openMenu({ x: 126, y: 105, maxBottom: 208, title: `In the bag  (now: ${stat}+${now[key]})`, items });
}

const BULK_BUY = 10;                  // how many Shift/Ctrl + click buys
const MAX_ITEMS = 10;                 // the most you can carry of any one item
// If the party carries more of an item than MAX_ITEMS allows (because the limit was lowered after
// the game was saved), the extra ones are thrown away. Called whenever a game is loaded.
// Returns how many items were discarded.
function trimItems() {
  let discarded = 0;
  for (const id in G.items) {
    if (G.items[id] > MAX_ITEMS) { discarded += G.items[id] - MAX_ITEMS; G.items[id] = MAX_ITEMS; }
  }
  if (discarded) showToast(`You can carry ${MAX_ITEMS} of each item: ${discarded} left behind.`, 4);
  return discarded;
}
function itemShop(ids, cur = 0) {
  const items = ids.map(id => ({
    label: ITEMS[id].name,
    right: G.items[id] >= MAX_ITEMS ? 'FULL' : itemPrice(id) + 'G',
    disabled: G.gold < itemPrice(id) || G.items[id] >= MAX_ITEMS,
    desc: G.items[id] >= MAX_ITEMS ? `You cannot carry more than ${MAX_ITEMS} of one item.`
                                   : `${ITEMS[id].desc}. You have ${G.items[id]}. Shift/Ctrl: buy 10.`,
    pick: (it, menu) => {
      // with Shift or Ctrl held: buy 10, or as many as the gold and the bag allow
      const count = bulkKey ? Math.min(BULK_BUY, Math.floor(G.gold / itemPrice(id)), MAX_ITEMS - G.items[id]) : 1;
      G.gold -= itemPrice(id) * count; G.items[id] += count;
      Sfx.play('buy'); UI.pop(); itemShop(ids, menu.cur);
    },
  }));
  items.push({ label: 'Leave', pick: () => UI.pop() });
  UI.openMenu({ x: 8, y: 8, title: `ITEM SHOP - Gold: ${G.gold}`, items, cur });
}

function inn() {
  const cost = 5 + 3 * avgLevel();
  UI.say(`Welcome to the inn. A night's rest costs ${cost} gold.`, () => UI.openMenu({
    x: 100, y: 90, title: `Stay the night? (Gold: ${G.gold})`,
    items: [
      { label: 'Yes', disabled: G.gold < cost, pick: () => {
          G.gold -= cost; fullHeal(); Sfx.play('inn'); UI.pop();
          UI.say('The party sleeps soundly... HP and MP are fully restored!');
        } },
      { label: 'No', pick: () => UI.pop() },
    ],
  }));
}

// Greenvale: basic gear (tiers 1-3)
const town = MAPS.town;
town.doors[town.doorAt.weapons] = () => UI.say('Welcome! Finest blades, bows and staves in Greenvale.', () => weaponShop(1, 3));
town.doors[town.doorAt.armor]   = () => UI.say('Welcome! A good armor is cheaper than a funeral.', () => armorShop(1, 3));
town.doors[town.doorAt.items]   = () => UI.say('Welcome! Potions, ethers, all fresh.', () => itemShop(['potion', 'ether', 'revive', 'ward']));
town.doors[town.doorAt.inn]     = inn;
town.doors[town.doorAt.house1]  = () => UI.say('The door is locked. Nobody seems to be home.');
town.doors[town.doorAt.house2]  = () => UI.say('Old woman: Oh, visitors! Sorry dears, I have nothing to offer but kind words.');

// Sunreach: better gear (tiers 3-5) and stronger items
const town2 = MAPS.town2;
town2.doors[town2.doorAt.weapons] = () => UI.say('Mythril and dragon steel, forged right here in Sunreach.', () => weaponShop(3, 5));
town2.doors[town2.doorAt.armor]   = () => UI.say('Armor fit for heroes. It is not cheap, mind you.', () => armorShop(3, 5));
town2.doors[town2.doorAt.items]   = () => UI.say('Welcome! We carry the strong stuff too.', () => itemShop(['potion', 'hipotion', 'ether', 'hiether', 'revive', 'ward']));
town2.doors[town2.doorAt.inn]     = inn;
town2.doors[town2.doorAt.house1]  = () => UI.say('Fisherman: The sea is calm today. A good day to rest.');
town2.doors[town2.doorAt.house2]  = () => UI.say('The door is locked.');

// Starfall: the best gear money can buy (tiers 5-7) and Elixirs
const town3 = MAPS.town3;
town3.doors[town3.doorAt.weapons] = () => UI.say('Rune-forged arms, the finest on the mainland.', () => weaponShop(5, 7));
town3.doors[town3.doorAt.armor]   = () => UI.say("Hero's Armor, made to order. Well, made to gold.", () => armorShop(5, 7));
town3.doors[town3.doorAt.items]   = () => UI.say('Elixirs! Rare, pricey, worth it.', () => itemShop(Object.keys(ITEMS)));
town3.doors[town3.doorAt.inn]     = inn;
town3.doors[town3.doorAt.house1]  = () => UI.say('Scholar: The tower in the desert? Ten floors, they say, each worse than the last.');
town3.doors[town3.doorAt.house2]  = () => UI.say('Shipwright: My old boat is moored on the shore near town. Beat the Tomb King and she is yours. I am too old to sail.');

// Port Coral: orichalcum gear (tiers 7-9)
const town4 = MAPS.town4;
town4.doors[town4.doorAt.weapons] = () => UI.say('Orichalcum. Mined under the sea, forged in Port Coral.', () => weaponShop(7, 9));
town4.doors[town4.doorAt.armor]   = () => UI.say('Nothing on the mainland comes close to this.', () => armorShop(7, 9));
town4.doors[town4.doorAt.items]   = () => UI.say('Stock up, sailor. The sea is wide.', () => itemShop(Object.keys(ITEMS)));
town4.doors[town4.doorAt.inn]     = inn;
town4.doors[town4.doorAt.house1]  = () => UI.say('Sailor: I once saw a chest on a speck of sand far to the south-east. Never went back for it.');
town4.doors[town4.doorAt.house2]  = () => UI.say('The door is locked.');

// The hermit on Frost Isle: a free rest, and a present the first time
MAPS.world.doors[MAPS.world.hut] = () => UI.say(['HERMIT: Hmph. Visitors.', 'HERMIT: Well, do not just stand there freezing. Sit by the fire.'], () => {
  fullHeal();
  Sfx.play('inn');
  const pages = ['The party warms up by the fire. HP and MP are fully restored!'];
  if (!G.flags.hermitGift) {
    G.flags.hermitGift = true;
    G.items.elixir = Math.min(MAX_ITEMS, G.items.elixir + 3);
    pages.push('HERMIT: Take these too. I never get sick anyway.  (Got 3 x Elixir!)');
  }
  UI.say(pages);
});

// ---------------------------------------------------------------------
// PAUSE MENU  (X or Esc while walking)
// ---------------------------------------------------------------------
function openMainMenu() {
  UI.openMenu({
    x: 8, y: 8, isPause: true,
    items: [
      { label: 'Items',  pick: () => fieldItems() },
      { label: 'Spells', pick: () => fieldMagic() },
      { label: 'Equip',  pick: () => equipMenu() },
      { label: 'Status', pick: () => UI.openCustom(drawStatus) },
      { label: 'Save Game', pick: saveAndContinue, disabled: !!MAPS[player.map].isDungeon,   // no saving inside dungeons
        desc: MAPS[player.map].isDungeon ? 'You cannot save inside a dungeon.' : '' },
      { label: 'Load Game', disabled: !hasSave(), pick: loadFromMenu },
      { label: 'Options', pick: optionsMenu },
      // New Game+ only, and only from a town: a tower with no top
      ...(G.ngPlus && MAPS[player.map].isTown ? [{ label: 'Endless Tower', pick: askEndlessTower,
            desc: `A new tower every time. Best so far: floor ${G.tower.best}.` }] : []),
      // once the ending has been seen, the next round can be started from here
      ...(G.flags.endingSeen ? [{ label: 'New Game+', pick: askNewGamePlus, desc: 'Start over with your levels, gear and gold. Grow to LVL 255.' }] : []),
      { label: 'Quit', pick: quitGame },
    ],
    extra: drawPartyPanel,
  });
}

function drawPartyPanel() {
  const top = 26 + UI.stack[0].items.length * 11;                 // just below the pause menu, however long it is
  drawWindow(8, top, 234, 58);
  G.party.forEach((h, i) => {
    const y = top + 6 + i * 11;
    drawText(h.name, 16, y, h.hp <= 0 ? '#ff6060' : '#fff');
    drawText(`LVL ${h.lvl}`, 64, y);
    drawText(`HP ${h.hp}/${maxStat(h, 'hp')}`, 106, y);
    drawText(`MP ${h.mp}/${maxStat(h, 'mp')}`, 174, y, '#9fd0ff');
  });
  drawText(`Gold: ${G.gold}`, 16, top + 42, '#ffd75e');
  if (G.flags.ward > 0) drawText(`Ward ${G.flags.ward}`, 100, top + 42, '#7dff9a');     // steps left on a Ward Charm
  if (G.ngPlus) drawText(`New Game+ ${G.ngPlus}`, 232, top + 42, '#ff9ad0', 'right');
}

// show = which numbers to list next to each hero: 'hp', 'mp' or 'both'
function chooseHero(cb, cur = 0, show = 'hp') {
  const hp = h => `HP ${h.hp}/${maxStat(h, 'hp')}`, mp = h => `MP ${h.mp}/${maxStat(h, 'mp')}`;
  const numbers = h => show === 'mp' ? mp(h) : show === 'both' ? hp(h) + '  ' + mp(h) : hp(h);
  UI.openMenu({ x: show === 'both' ? 110 : 150, y: 40, title: 'On whom?', cur,
    items: G.party.map(h => ({ label: h.name, right: numbers(h), pick: () => cb(h) })) });
}

// "cur" = which line the cursor starts on. After using an item, the same item stays
// selected with the "On whom?" list open, so you can use several in a row.
function fieldItems(cur = 0) {
  const stock = () => Object.keys(ITEMS).filter(id => G.items[id] > 0);
  const items = stock().map(id => ({
    label: ITEMS[id].name, right: 'x' + G.items[id], desc: describeItem(id),
    pick: (it, menu) => {
      const item = ITEMS[id];
      if (item.ward) {                                      // Ward Charm: no target, just switch it on
        G.items[id]--;
        G.flags.ward = item.ward;
        Sfx.play('buff');
        UI.pop();
        return UI.say(`The charm glows softly. Monsters will mostly leave you alone for the next ${item.ward} steps.`,
                      () => { if (stock().length) fieldItems(menu.cur); });
      }
      const show = item.hp && item.mp ? 'both' : item.mp ? 'mp' : 'hp';   // an Ether shows MP, an Elixir both
      const useOn = who => chooseHero(h => {                // who = which hero the cursor starts on
        const msg = useItem(id, h);
        if (msg) Sfx.play('item');
        UI.pop(); UI.pop();
        UI.say(msg || 'It would have no effect.', () => {
          if (stock().length) fieldItems(menu.cur);         // fresh list (new counts)...
          if (G.items[id] > 0) useOn(G.party.indexOf(h));   // ...and straight back to "On whom?" while some are left
        });
      }, who, show);
      useOn(0);
    },
  }));
  if (!items.length) return UI.say('You have no items.');
  UI.openMenu({ x: 124, y: 8, items, cur });
}

// Outside of battle you can cast healing spells and Warp (not Raise: nobody is ever down outside a battle).
// After a healing spell the same spell stays selected with the "On whom?" list open,
// so you can heal several heroes in a row (until the caster runs out of MP).
function fieldMagic(cur = 0) {
  const items = [];
  for (const h of aliveHeroes()) {
    for (const id of knownSpells(h)) {
      const s = SPELLS[id];
      if (s.kind === 'warp') {
        const inDungeon = MAPS[player.map].isDungeon;       // costs MP in a dungeon, free anywhere else
        items.push({
          label: `${h.name}: ${s.name}`, right: inDungeon ? s.mp + ' MP' : 'FREE', desc: describeSpell(s, h),
          disabled: inDungeon && h.mp < s.mp,
          pick: () => inDungeon ? castWarp(h, s) : warpToTownMenu(h),
        });
        continue;
      }
      if (s.kind !== 'heal') continue;                    // (no Raise here: a fallen hero is always back on their feet after a battle)
      const done = (msg, line) => {
        Sfx.play('heal');
        UI.pop();                                           // close this list...
        UI.say(`${h.name} casts ${s.name}. ${msg}`, () => fieldMagic(line));   // ...and open a fresh one (new MP numbers)
      };
      items.push({
        label: `${h.name}: ${s.name}`, right: s.mp + ' MP', desc: describeSpell(s, h), disabled: h.mp < s.mp,
        pick: (it, menu) => {
          if (s.target === 'party') return done(castHeal(h, s, aliveHeroes()), menu.cur);
          const castOn = who => chooseHero(t => {           // who = which hero the cursor starts on
            const msg = castHeal(h, s, [t]);
            Sfx.play('heal');
            UI.pop(); UI.pop();
            UI.say(`${h.name} casts ${s.name}. ${msg}`, () => {
              fieldMagic(menu.cur);                         // fresh list (new MP numbers)...
              if (h.mp >= s.mp) castOn(G.party.indexOf(t)); // ...and straight back to "On whom?" while MP lasts
            });
          }, who);
          castOn(0);
        },
      });
    }
  }
  if (!items.length) return UI.say('Nobody knows a spell to use here yet.');
  UI.openMenu({ x: 124, y: 8, items, cur });
}

// Remember that we have been to this town (for Warp, and for where we wake up after a defeat).
function visitTown(name) {
  G.flags.home = name;
  G.flags['visited:' + name] = true;
}
// Every town we have been to. Greenvale always counts: the game starts there.
function visitedTowns() {
  return Object.keys(MAPS).filter(name => MAPS[name].isTown
    && (name === 'town' || G.flags['visited:' + name] || G.flags.home === name));
}

// WARP outside a dungeon: pick a town you have visited and appear at its gate. Costs nothing.
function warpToTownMenu(hero) {
  UI.openMenu({
    x: 150, y: 40, title: 'Warp to which town?',
    items: visitedTowns().map(name => ({
      label: MAPS[name].title, right: name === player.map ? 'you are here' : '', disabled: name === player.map,
      pick: () => {
        const gate = Object.values(MAPS.world.exits).find(exit => exit.to === name);   // same spot as walking in
        visitTown(name);
        UI.clear();
        Sfx.play('warp');
        enterMap(name, gate.x, gate.y, gate.dir);
        bringBoatTo(name);                                 // the boat comes along, to the nearest shore
        UI.say(`${hero.name} casts Warp. The party lands in ${MAPS[name].title}!`);
      },
    })),
  });
}

// WARP inside a dungeon: jump back to the cave mouth you came in by. Costs MP.
function castWarp(hero, spell) {
  hero.mp -= spell.mp;
  if (G.run) { UI.clear(); Sfx.play('warp'); return endEndlessRun(`${hero.name} casts Warp and the party leaves the tower.`); }
  const mouth = findTile(MAPS.world, G.flags.caveEntry || 'C');
  UI.clear();
  Sfx.play('warp');
  enterMap('world', mouth.x, mouth.y, 'down');
  UI.say(`${hero.name} casts Warp. The party is whisked out of the cave!`);
}

function drawStatus() {
  drawWindow(8, 8, 304, 224);
  G.party.forEach((h, i) => {
    let y = 15 + i * 72;
    const next = h.lvl >= levelCap() ? 'MAX' : `${h.exp}/${expToNext(h.lvl)}`;
    drawText(h.name, 16, y, '#ffd75e');
    drawText(`LVL ${h.lvl}    EXP ${next}`, 70, y);
    drawText(`HP ${h.hp}/${maxStat(h, 'hp')}   MP ${h.mp}/${maxStat(h, 'mp')}`, 16, y += 10);
    drawText(['str', 'def', 'int', 'mag'].map(k => `${k.toUpperCase()} ${maxStat(h, k)}`).join('   '), 16, y += 10);
    drawText(`${weaponOf(h).name} (ATK+${weaponOf(h).atk})   ${ARMORS[h.armor].name} (DEF+${ARMORS[h.armor].def})`, 16, y += 10, '#b8c4ff');
    const names = list => list.map(id => SPELLS[id].name).join(', ') || 'none yet';
    const lines = [...wrapText(names(knownMagic(h)), 288).map(t => [t, '#9fd0ff']), // 'Spells: ' + 
                   ...(knownAbilities(h).length ? wrapText(names(knownAbilities(h)), 289).map(t => [t, '#ffd9a0']) : [])]; // 'Abilities: ' + 
    lines.slice(0, 3).forEach(([t, color], n) => drawText(n === 2 && lines.length > 3 ? t + ' ...' : t, 16, y += 10, color));
  });
}

// ---------------------------------------------------------------------
// START MENU, SAVING AND QUITTING
// ---------------------------------------------------------------------
function showTitle() {
  UI.clear();
  mode = 'title';
  UI.openMenu({
    x: 116, y: 134, w: 88,
    items: [
      // CONTINUE: straight back into the game you saved or loaded last
      { label: 'CONTINUE', disabled: !lastSlot(), pick: () => {
          if (!loadGame(lastSlot())) return UI.say('That saved game could not be read.');
          UI.clear(); mode = 'explore';
        } },
      { label: 'NEW GAME',  pick: newGame },
      { label: 'LOAD GAME', disabled: !hasSave(), pick: () => chooseSlot('Load which game?', false, slot => {
          if (!loadGame(slot)) return UI.say('That saved game could not be read.');
          UI.clear(); mode = 'explore';
        }) },
      { label: 'OPTIONS', pick: optionsMenu },
      { label: 'EXIT', pick: exitGame },
    ],
    cur: lastSlot() ? 0 : 1,                           // the cursor starts on CONTINUE when there is a game to continue
    onCancel: () => {},                                // X does nothing here
  });
}

// NEW GAME: first choose how hard the monsters are (see DIFFICULTIES in data.js), then begin.
function newGame() {
  UI.openMenu({
    x: 60, y: 90, title: 'How hard should the monsters be?',
    items: Object.keys(DIFFICULTIES).map(name => ({ label: name, desc: DIFFICULTIES[name].desc, pick: () => beginNewGame(name) })),
  });
}
function beginNewGame(difficulty) {
  resetGame();
  G.difficulty = difficulty;
  Object.assign(player, { map: 'town', x: MAPS.town.start.x, y: MAPS.town.start.y, dir: 'down', moving: false, safeSteps: 0, path: null, onBoat: false });
  resetFollowers();
  UI.clear();
  mode = 'explore';
  UI.say(['ARTUROS, SORUTRA and RAYEN arrive in the town of Greenvale.',
          'Arrow keys: move.  Z or Enter: talk / confirm.  X or Esc: menu / cancel.',
          'You can also use the mouse: left click to walk somewhere or choose, right click for the menu.',
          'Walk into a door to enter a shop. Leave through the south gate to find monsters.',
          'In battle, the words above a monster tell you what it will do next. Point at a monster to see its weakness.']);
}

function exitGame() {
  UI.clear();
  mode = 'bye';
  window.close();        // browsers only allow this for some windows; otherwise the goodbye screen stays
}

// The list of the three save slots. emptyOk: may an empty slot be picked? (yes for saving, no for loading)
function chooseSlot(title, emptyOk, onPick) {
  const items = [];
  for (let slot = 1; slot <= SAVE_SLOTS; slot++) {
    const summary = slotSummary(slot);
    items.push({ label: `Slot ${slot}`, right: summary, disabled: !emptyOk && summary === 'empty', pick: () => onPick(slot) });
  }
  UI.openMenu({ x: 50, y: 70, title, items, cur: (G.slot || 1) - 1 });        // the cursor starts on the slot in use
}

function saveAndContinue() {
  chooseSlot('Save to which slot?', true, slot => {
    const write = () => {
      UI.pop();                                                  // close the slot list
      if (!saveGame(slot)) return UI.say('Saving failed! Your browser is blocking storage for this page.');
      Sfx.play('save');
      UI.say(`Game saved to slot ${slot}.`);                     // the menu stays open underneath
    };
    if (!readSlot(slot) || slot === G.slot) return write();
    UI.openMenu({                                                // another game lives in that slot: make sure
      x: 70, y: 100, title: `Overwrite slot ${slot}?  (${slotSummary(slot)})`,
      items: [{ label: 'No', pick: () => UI.pop() }, { label: 'Yes, overwrite it', pick: () => { UI.pop(); write(); } }],
    });
  });
}

// QUICK SAVE (Ctrl+S): saves to the slot this game lives in, without opening any menu.
// A game that has never been saved has no slot yet, so the first time it asks which one.
function quickSave() {
  if (mode !== 'explore' || UI.active) return Sfx.play('buzz');            // only while walking around
  if (MAPS[player.map].isDungeon) { Sfx.play('buzz'); return showToast('You cannot save inside a dungeon.'); }
  if (!G.slot) return saveAndContinue();
  if (!saveGame(G.slot)) { Sfx.play('buzz'); return showToast('Saving failed!'); }
  Sfx.play('save');
  showToast(`Saved to slot ${G.slot}.`);
}
// A short note at the top of the screen that goes away by itself.
let toast = null;
const TOAST_SECONDS = 1.5;
function showToast(text, seconds = TOAST_SECONDS) { toast = { text, until: performance.now() + seconds * 1000 }; }
function drawToast() {
  if (!toast || performance.now() > toast.until) return;
  const w = textWidth(toast.text) + 16;
  drawWindow((SCREEN_W - w) / 2, 6, w, 18);
  drawText(toast.text, SCREEN_W / 2, 11, '#ffd75e', 'center');
}

// Go back to a save (unsaved progress is lost, so the title says so).
function loadFromMenu() {
  chooseSlot('Load which game? Unsaved progress is lost.', false, slot => {
    UI.clear();
    if (!loadGame(slot)) UI.say('That saved game could not be read.');
  });
}

function quitGame() {
  UI.openMenu({
    x: 60, y: 60, title: 'Quit? Progress since your last save is lost.',
    items: [
      { label: 'No, keep playing', pick: () => UI.pop() },
      { label: 'Yes, quit', pick: showTitle },
    ],
  });
}

// ---------------------------------------------------------------------
// TITLE SCREEN PICTURE: dusk over the mountains, the three heroes facing the Sky Dragon.
// Everything is drawn from rectangles and the game's own sprites, a little differently every
// frame (t = seconds), so the stars twinkle, the clouds drift and the dragon hovers.
// ---------------------------------------------------------------------
const TITLE_HORIZON = 146;
const TITLE_SKY = ['#060920', '#090d2c', '#0e1238', '#151646', '#1e1a54', '#2b1e62', '#3c226e', '#522874',
                   '#6e2e76', '#8e3872', '#b04868', '#cf6058', '#e88250', '#f6a858'];   // top of the sky ... horizon
const TITLE_STARS = (() => {            // the same stars every time (a seeded random, like the dungeons)
  const rand = seededRandom(31);
  return Array.from({ length: 80 }, () => ({ x: Math.floor(rand() * SCREEN_W), y: Math.floor(rand() * 96), phase: rand() * 6.28, big: rand() < 0.12 }));
})();
const TITLE_TUFTS = (() => {            // grass tufts on the dark foreground
  const rand = seededRandom(5);
  return Array.from({ length: 60 }, () => [Math.floor(rand() * SCREEN_W), TITLE_HORIZON + 8 + Math.floor(rand() * 84)]);
})();
// the outline of a mountain range: how high the ridge is at column x
const ridge = (x, size, wobble, shift) => size * (0.55 + 0.25 * Math.sin(x * wobble + shift) + 0.2 * Math.sin(x * wobble * 2.7 + shift * 3));

function drawTitle() {
  const t = performance.now() / 1000;

  // sky: bands of colour, night blue at the top down to a glowing horizon
  const band = TITLE_HORIZON / TITLE_SKY.length;
  TITLE_SKY.forEach((color, i) => R(ctx, color, 0, Math.floor(i * band), SCREEN_W, Math.ceil(band) + 1));

  // stars (twinkling) and the moon
  for (const s of TITLE_STARS) {
    const glow = 0.5 + 0.5 * Math.sin(t * 1.7 + s.phase);
    ctx.globalAlpha = (1 - s.y / 110) * (0.35 + 0.65 * glow);          // fainter near the bright horizon
    R(ctx, '#ffffff', s.x, s.y, 1, 1);
    if (s.big && glow > 0.6) { R(ctx, '#ffffff', s.x - 1, s.y, 3, 1); R(ctx, '#ffffff', s.x, s.y - 1, 1, 3); }
  }
  ctx.globalAlpha = 1;
  const moon = (color, r) => { for (let y = -r; y <= r; y++) { const w = Math.round(Math.sqrt(r * r - y * y)); R(ctx, color, 38 - w, 36 + y, w * 2, 1); } };
  ctx.globalAlpha = 0.12; moon('#fff4d0', 26); moon('#fff4d0', 22);    // soft halo
  ctx.globalAlpha = 1; moon('#fff4d0', 17);
  for (const [x, y, w] of [[30, 28, 6], [42, 40, 8], [32, 44, 4], [46, 28, 3]]) { R(ctx, '#e6d6a6', x, y, w, 3); R(ctx, '#e6d6a6', x + 1, y - 1, w - 2, 5); }   // craters

  // clouds drifting past, the far mountains, the lonely tower, the near hills
  for (const [speed, y, w, start] of [[5, 72, 70, 40], [3, 96, 96, 190], [7, 112, 54, 300]]) {
    const x = (start + t * speed) % (SCREEN_W + 120) - 110;
    ctx.globalAlpha = 0.35; R(ctx, '#2a1d52', x, y, w, 5); R(ctx, '#2a1d52', x + 10, y - 4, w - 26, 4); R(ctx, '#2a1d52', x + 6, y + 5, w - 16, 3);
  }
  ctx.globalAlpha = 1;
  for (let x = 0; x < SCREEN_W; x++) { const h = Math.round(ridge(x, 54, 0.045, 1)); R(ctx, '#4a2a6a', x, TITLE_HORIZON - h, 1, h); R(ctx, '#7a4a80', x, TITLE_HORIZON - h, 1, 2); }
  R(ctx, '#1a1236', 52, 82, 14, 64); R(ctx, '#1a1236', 49, 78, 20, 5);          // the tower...
  for (let i = 0; i < 4; i++) R(ctx, '#1a1236', 49 + i * 6, 74, 3, 4);            // ...its battlements...
  for (let i = 0; i < 4; i++) if (Math.sin(t * 0.8 + i * 2.1) > -0.6) R(ctx, '#ffd75e', 57 + (i % 2) * 3, 90 + i * 12, 2, 3);   // ...and lit windows
  for (let x = 0; x < SCREEN_W; x++) { const h = Math.round(ridge(x, 22, 0.03, 4)); R(ctx, '#1c1438', x, TITLE_HORIZON - h, 1, h); }

  // the ground in front
  ['#182c22', '#15261e', '#12201a', '#0f1a16'].forEach((color, i) => R(ctx, color, 0, TITLE_HORIZON + i * 24, SCREEN_W, 24));
  R(ctx, '#2a4a34', 0, TITLE_HORIZON, SCREEN_W, 2);
  for (const [x, y] of TITLE_TUFTS) { R(ctx, '#2a4a34', x, y, 1, 3); R(ctx, '#2a4a34', x + 2, y + 1, 1, 2); }

  // the three heroes on the left, the Sky Dragon hovering on the right
  HERO_SPRITES.forEach((sprite, i) => {
    R(ctx, '#0a120e', 24 + i * 24, 191 - i * 4, 22, 3);                          // shadow on the grass
    ctx.drawImage(sprite.right[0], 19 + i * 24, 160 - i * 4, 32, 32);
  });
  const bob = Math.round(Math.sin(t * 1.6) * 3);
  R(ctx, '#0a120e', 232 + Math.abs(bob), 194, 60 - Math.abs(bob) * 2, 3);
  ctx.drawImage(bigSprite('dragon', true), 222, 118 + bob, 80, 80);

  // the logo: big gold letters with a lighter top half, and a glint that sweeps across now and then
  const logo = (color, x0, x1, y0, y1) => {
    ctx.save();
    ctx.beginPath(); ctx.rect(x0, y0, x1 - x0, y1 - y0); ctx.clip();            // only paint inside this box
    ctx.scale(4, 4);
    ctx.font = FONT; ctx.textBaseline = 'top'; ctx.textAlign = 'center';
    ctx.fillStyle = color; ctx.fillText('MINI RPG', SCREEN_W / 8, 5);
    ctx.restore();
  };
  ctx.save(); ctx.scale(4, 4); drawText('MINI RPG', SCREEN_W / 8, 5, '#e09a20', 'center'); ctx.restore();   // dark gold + shadow
  logo('#ffd75e', 0, SCREEN_W, 0, 39);
  logo('#fff2b0', 0, SCREEN_W, 0, 31);
  const glint = (t % 5) * 160 - 60;                                              // crosses the logo once every 5 seconds
  logo('#ffffff', glint, glint + 10, 0, 60);
  R(ctx, '#e09a20', 70, 58, 180, 1); R(ctx, '#ffd75e', 100, 57, 120, 1);          // a line under it, like a blade
  for (let i = 0; i < 4; i++) R(ctx, '#fff2b0', 160 - 3 + i, 55 + i, 7 - i * 2, 1), R(ctx, '#fff2b0', 160 - 3 + i, 61 - i, 7 - i * 2, 1);   // with a jewel
  drawText('ARTUROS  -  SORUTRA  -  RAYEN', SCREEN_W / 2, 68, '#cfd8ff', 'center');

  const last = lastSlot();                             // what CONTINUE will load
  drawText(last ? `Continue: slot ${last}  -  ${slotSummary(last)}` : 'No saved game yet.', SCREEN_W / 2, 206, '#b8c4ff', 'center');
  drawText('Made by Andrew Van Blair with Fable 5.2', SCREEN_W / 2, 219, '#8a96b8', 'center');
  const rec = readRecords();                           // the best Endless Tower results ever, whatever happened to the saves
  if (rec.best) drawText(`Tower record: floor ${rec.best}   Bosses beaten: ${rec.bosses}`, SCREEN_W / 2, 230, '#ffd75e', 'center');
}

function drawGoodbye() {
  R(ctx, '#0b1030', 0, 0, SCREEN_W, SCREEN_H);
  drawText('Thanks for playing!', SCREEN_W / 2, 96, '#ffd75e', 'center');
  drawText('You can close this browser tab now.', SCREEN_W / 2, 116, '#fff', 'center');
  drawText('Press Z to go back to the start menu.', SCREEN_W / 2, 136, '#8088a8', 'center');
}

// ---------------------------------------------------------------------
// DRAWING THE MAP
// ---------------------------------------------------------------------
const FLOOR_SIGN_TIME = 2;             // seconds the floor name stays up after arriving
const floorSign = { map: null, until: 0 };

function drawExplore() {
  const map = MAPS[player.map];
  // where the player is in pixels (sliding between two tiles while moving)
  const k = player.moving ? player.t : 1;
  const px = (player.fromX + (player.x - player.fromX) * k) * TILE;
  const py = (player.fromY + (player.y - player.fromY) * k) * TILE;
  const drawX = player.moving ? px : player.x * TILE, drawY = player.moving ? py : player.y * TILE;

  // the camera follows the player but stops at the map edges
  // (a map smaller than the screen is simply centred)
  const mapW = map.w * TILE, mapH = map.h * TILE;
  const camX = mapW < SCREEN_W ? (mapW - SCREEN_W) / 2 : Math.round(clamp(drawX + 8 - SCREEN_W / 2, 0, mapW - SCREEN_W));
  const camY = mapH < SCREEN_H ? (mapH - SCREEN_H) / 2 : Math.round(clamp(drawY + 8 - SCREEN_H / 2, 0, mapH - SCREEN_H));
  camera.x = camX; camera.y = camY;                               // the mouse needs to know this
  R(ctx, '#000', 0, 0, SCREEN_W, SCREEN_H);

  const x0 = Math.max(0, Math.floor(camX / TILE)), y0 = Math.max(0, Math.floor(camY / TILE));
  const waterFrame = Math.floor(performance.now() / 500) % 2;     // the sea has two frames of waves
  const isWater = (x, y) => x < 0 || y < 0 || x >= map.w || y >= map.h || map.rows[y][x] === '~';
  for (let y = y0; y <= y0 + 15 && y < map.h; y++) {
    for (let x = x0; x <= x0 + 20 && x < map.w; x++) {
      const tile = tileAt(map, x, y), sx = x * TILE - camX, sy = y * TILE - camY;
      if (map === MAPS.world) seenTiles()[y * map.w + x] = 1;      // everything on screen counts as discovered
      const variant = tile === '~' ? waterFrame : (x * 31 + y * 17) & 3;      // so not every grass tile looks the same
      if (OBJECT_TILES.includes(tile)) ctx.drawImage(tileImage(map.floorTile || ',', variant), sx, sy);   // floor under stairs, chests...
      ctx.drawImage(tileImage(tile === '$' && richChests(map) ? '$+' : tile, variant), sx, sy);   // New Game+ chests look richer
      if (tile === '$' && richChests(map)) {                      // ...and sparkle
        const spark = Math.floor(performance.now() / 180 + x * 3 + y * 5) % 8;
        if (spark < 3) { const [px, py] = [[3, 4], [11, 3], [8, 9]][spark]; R(ctx, '#ffffff', sx + px, sy + py - 1, 1, 3); R(ctx, '#ffffff', sx + px - 1, sy + py, 3, 1); }
      }
      if (tile === '~') {                                         // a line of foam where water meets land
        if (!isWater(x, y - 1)) R(ctx, '#cfe9ff', sx, sy, 16, 2);
        if (!isWater(x, y + 1)) R(ctx, '#cfe9ff', sx, sy + 14, 16, 2);
        if (!isWater(x - 1, y)) R(ctx, '#cfe9ff', sx, sy, 2, 16);
        if (!isWater(x + 1, y)) R(ctx, '#cfe9ff', sx + 14, sy, 2, 16);
      }
    }
  }

  for (const n of visibleNpcs(map)) ctx.drawImage(SPRITES[n.sprite], n.x * TILE - camX, n.y * TILE - camY);
  for (const l of map.labels) drawText(l.text, l.x - camX, l.y - camY, '#fff', 'center');

  const boat = map === MAPS.world && G.flags.boat;
  if (boat && !player.onBoat) ctx.drawImage(SPRITES.boat, boat.x * TILE - camX, boat.y * TILE - camY);

  if (player.onBoat) {                                            // sailing: just the boat, rocking a little
    ctx.drawImage(SPRITES.boat, Math.round(drawX) - camX, Math.round(drawY) - camY - waterFrame);
  } else {
    // the party: followers first (so the leader is drawn on top), each sliding between two tiles
    const frame = player.moving && player.t > 0.5 ? 1 : 0;        // walking animation
    const spot = f => `${f.x},${f.y}`;
    [1, 0].forEach(i => {
      const f = player.followers[i], inFront = i === 0 ? player : player.followers[0];
      if (!f || spot(f) === spot(player) || spot(f) === spot(inFront)) return;     // still stacked behind someone: hidden
      const fx = (f.fromX + (f.x - f.fromX) * k) * TILE, fy = (f.fromY + (f.y - f.fromY) * k) * TILE;
      ctx.drawImage(heroLook(i + 1, G.party[i + 1].armor)[f.dir][frame], Math.round(fx) - camX, Math.round(fy) - camY);
    });
    ctx.drawImage(heroLook(0, G.party[0].armor)[player.dir][frame], Math.round(drawX) - camX, Math.round(drawY) - camY);
  }

  // steps left on an active Ward Charm, top-left
 // if (G.flags.ward > 0) drawText(`Ward ${G.flags.ward}`, 6, 6, '#7dff9a');

  // Which floor are we on? (only dungeon maps have a "place" name)
  // Shown for a moment when you arrive on a floor, and whenever the pause menu is open.
  if (map.name !== floorSign.map) { floorSign.map = map.name; floorSign.until = performance.now() + FLOOR_SIGN_TIME * 1000; }
  const pauseMenuOpen = UI.stack.some(m => m.isPause);
  if (map.place && (pauseMenuOpen || performance.now() < floorSign.until)) {
    const w = Math.ceil(textWidth(map.place)) + 14;
    drawWindow(SCREEN_W - w - 4, 4, w, 18);
    drawText(map.place, SCREEN_W - w + 3, 9, '#ffd75e');
  }
}

// ---------------------------------------------------------------------
// LEVEL-UP CHOICES: at some levels a hero picks one of two abilities (see "choices" in data.js).
// The one not taken is gone for good, which is what makes two play-throughs different.
// ---------------------------------------------------------------------
function askAbilityChoice(hero) {
  const [lvl, ...options] = pendingChoices(hero)[0];
  Sfx.play('levelup');
  UI.openMenu({
    x: 50, y: 60, title: `${hero.name} - LVL ${lvl}: choose ONE new ability`,
    items: options.map(id => ({
      label: SPELLS[id].name, right: SPELLS[id].mp + ' MP', desc: describeSpell(SPELLS[id], hero),
      pick: () => {
        hero.picks[lvl] = id;
        Sfx.play('save');
        UI.pop();
        UI.say(`${hero.name} learned ${SPELLS[id].name}!`);
      },
    })),
    onCancel: () => {},                                 // it has to be one or the other
  });
}

// (The Endless Tower lives in its own file: js/tower.js)

// ---------------------------------------------------------------------
// THE ENDING AND NEW GAME+
// Opening the Magma Lord's chest ends the story. Then something goes wrong, and the heroes
// are thrown back to the beginning with everything they own: New Game+. There the heroes can
// grow past LVL 99 (see levelCap in data.js). Monsters keep pace with the party's level as always.
// ---------------------------------------------------------------------
const ENDING_QUAKE_MUSIC = 'TowerBoss1';     // the track that starts with the earthquake (a place name plus a number = that exact file)
const ending = { stage: 0 };          // 0 = sailing home, 1 = THE END, 2 = the earthquake

function startEnding() {
  G.flags.endingSeen = true;
  UI.clear();
  mode = 'ending';
  ending.stage = 0;
  UI.say(['With the Magma Lord gone, the volcano falls silent for the first time in a thousand years.',
          'ARTUROS, SORUTRA and RAYEN sail home. In every town along the way, people cheer their names.',
          'The monsters have not vanished, but they no longer have a master. The world can breathe again.'], () => {
    ending.stage = 1;
    Sfx.play('victory');
    UI.say(['Thank you for playing!'], () => {
      ending.stage = 2;
      Sfx.play('hurt');
      UI.say(['...', 'Wait. Do you feel that? The ground is shaking!',
              'A voice like grinding stone rolls in from the sea:  "YOU HAVE ONLY WOKEN US."',
              'The sky turns the colour of fire. Everywhere, the monsters are stirring again...'], askNewGamePlus);
    });
  });
}

function askNewGamePlus() {
  UI.openMenu({
    x: 40, y: 70, title: `Begin NEW GAME+ ${G.ngPlus + 1}?`,
    items: [
      { label: 'Yes - back to Greenvale, and do it all again', pick: newGamePlus,
        desc: 'You keep levels, spells, gear, bag, items and gold.' },
      { label: 'Not yet - keep exploring this world', pick: () => {
          UI.clear(); mode = 'explore';
          UI.say('The shaking fades... for now. You can begin New Game+ from the menu whenever you are ready.');
        } },
    ],
    onCancel: () => {},
  });
}

function newGamePlus() {
  G.ngPlus++;
  G.flags = {};          // bosses, chests, the boat, visited towns: everything starts over (tower progress is in G.tower and stays)
  fullHeal();
  UI.clear();
  mode = 'explore';
  enterMap('town', MAPS.town.start.x, MAPS.town.start.y, 'down');
  Sfx.play('warp');
  UI.say([`NEW GAME+ ${G.ngPlus}`,
          'The heroes wake up in Greenvale, as if it had all been a dream. But their packs are full, and their arms are strong.',
          'The monsters are back, and are even stronger than before.',
          'But there is no limit in sight: in New Game+ the heroes can grow to LVL 255, and their stats up to 999.']);
}

function drawEnding() {
  const shake = ending.stage === 2 ? Math.round(Math.sin(performance.now() / 30) * 2) : 0;     // the earthquake
  ctx.translate(shake, 0);
  R(ctx, ending.stage === 2 ? '#3a0c08' : '#0b1030', -4, 0, SCREEN_W + 8, SCREEN_H);
  for (let i = 0; i < 40; i++) R(ctx, '#ffffff', (i * 97) % SCREEN_W, (i * 53) % 110, 1, 1);    // stars
  R(ctx, '#2f6b35', -4, 130, SCREEN_W + 8, 110); R(ctx, '#3d9142', -4, 130, SCREEN_W + 8, 3);
  G.party.forEach((h, i) => ctx.drawImage(heroLook(i, h.armor).down[0], 112 + i * 34, 100, 32, 32));   // the three heroes
  if (ending.stage === 1) {
    ctx.save(); ctx.scale(4, 4);
    drawText('THE END', SCREEN_W / 8, 8, '#ffd75e', 'center');
    ctx.restore();
    drawText(`ARTUROS LVL ${G.party[0].lvl}   SORUTRA LVL ${G.party[1].lvl}   RAYEN LVL ${G.party[2].lvl}`, SCREEN_W / 2, 76, '#9fd0ff', 'center');
  }
  ctx.translate(-shake, 0);
}

// ---------------------------------------------------------------------
// DISPLAY OPTIONS: screen size (V), full screen (F), CRT scan lines (C)
// These are remembered by the browser separately from the saved game.
// ---------------------------------------------------------------------
const SETTINGS_KEY = 'minirpg-settings';
const SCREEN_SIZES = [                 // [name, zoom]  (zoom = screen pixels per game pixel)
  ['Fit window', 0],                   // 0 = the biggest whole-number zoom that fits
  ['320 x 240', 1],                    // the original size: one game pixel = one screen pixel
  ['640 x 480', 2],
  ['960 x 720', 3],
  ['1280 x 960', 4],
];
const settings = { size: 0, scanlines: false, titleMusic: 'Town', startFull: true };
try { Object.assign(settings, JSON.parse(localStorage.getItem(SETTINGS_KEY))); } catch (e) { /* no settings yet */ }
if (!SCREEN_SIZES[settings.size]) settings.size = 0;
Music.titleTrack = settings.titleMusic;
Music.places.forEach(place => Music.countTracks(place));     // count the music files now, so Options can list them

// TITLE MUSIC: the choices are Random, every place ("Town (any)") and every single track ("Town 1").
function titleMusicChoices() {
  const list = ['Random'];
  for (const place of Music.places) {
    const count = Music.counts[place] || 0;
    if (count) list.push(place);
    for (let n = 1; n <= count; n++) list.push(place + n);
  }
  return list;
}
const titleMusicName = t => t === 'Random' ? 'Random' : /\d/.test(t) ? t.replace(/(\d+)/, ' $1') : t + ' (any)';
function nextTitleMusic() {
  const list = titleMusicChoices();
  settings.titleMusic = list[(list.indexOf(settings.titleMusic) + 1) % list.length];
  Music.setTitleTrack(settings.titleMusic);
  applySettings();                                           // (this also saves the settings)
}

// Set the zoom. The picture is only ever enlarged by a WHOLE number (2x, 3x, 4x...), and the canvas
// is given exactly that many real pixels, so pixels and letters stay perfectly sharp.
// In full screen (and "Fit window") we use the biggest zoom that fits, which can leave a dark border.
function applySettings() {
  const dpr = window.devicePixelRatio || 1;            // Windows "display scaling": CSS pixels per real pixel
  const full = !!document.fullscreenElement;
  const roomW = window.innerWidth * dpr, roomH = (window.innerHeight - (full ? 0 : 70)) * dpr;
  const fit = Math.max(1, Math.floor(Math.min(roomW / SCREEN_W, roomH / SCREEN_H)));
  const zoom = full ? fit : (SCREEN_SIZES[settings.size][1] || fit);
  if (canvas.width !== SCREEN_W * zoom) {              // (changing a canvas's size wipes it, so only when needed)
    SCALE = zoom;
    canvas.width = SCREEN_W * zoom; canvas.height = SCREEN_H * zoom;
    crtShade = null;
  }
  canvas.style.width = (SCREEN_W * zoom / dpr) + 'px';
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch (e) { /* storage blocked: not important */ }
}
function nextScreenSize() { settings.size = (settings.size + 1) % SCREEN_SIZES.length; applySettings(); }
function toggleScanlines() { settings.scanlines = !settings.scanlines; applySettings(); }
function toggleFullScreen() {
  if (document.fullscreenElement) document.exitFullscreen();
  else document.documentElement.requestFullscreen().catch(() => {});       // the browser may say no
}
let crtShade = null;                  // the dark-corners picture for the CRT look (remade when the size changes)
document.addEventListener('fullscreenchange', applySettings);
addEventListener('resize', applySettings);
applySettings();

function optionsMenu() {
  UI.openMenu({
    x: 70, y: 70, title: 'OPTIONS',
    items: [
      { label: 'Screen size', right: () => SCREEN_SIZES[settings.size][0], pick: nextScreenSize,
        desc: 'Key: V.  Always a whole-number zoom, so it stays sharp.' },
      { label: 'Full screen', right: () => document.fullscreenElement ? 'ON' : 'OFF', pick: toggleFullScreen,
        desc: 'Key: F.  The biggest sharp zoom your monitor can show.' },
      { label: 'Start in full screen', right: () => settings.startFull ? 'ON' : 'OFF', pick: () => { settings.startFull = !settings.startFull; applySettings(); },
        desc: 'Go full screen at the first key press or click after opening the game.' },
      { label: 'Scan lines', right: () => settings.scanlines ? 'ON' : 'OFF', pick: toggleScanlines,
        desc: 'Key: C.  CRT television screen emulation.' },
      { label: 'Sound and music', right: () => Music.muted ? 'OFF' : 'ON', pick: toggleMute, desc: 'Key: M. Toggle on and off.' },
      { label: 'Title music', right: () => titleMusicName(settings.titleMusic), pick: nextTitleMusic,
        desc: 'Choose which track plays on the title screen.' },
      { label: 'Back', pick: () => UI.pop() },
    ],
  });
}

// The CRT look: a dark line under every row of game pixels, and darker corners.
function drawScanlines() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);                             // real canvas pixels
  ctx.fillStyle = SCALE === 2 ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.32)';   // at 2x half of all rows are lines, so go easier
  if (SCALE > 1) for (let y = SCALE - 1; y < canvas.height; y += SCALE) ctx.fillRect(0, y, canvas.width, 1);
  if (!crtShade) {
    crtShade = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, canvas.height * 0.45,
                                        canvas.width / 2, canvas.height / 2, canvas.height * 0.9);
    crtShade.addColorStop(0, 'rgba(0, 0, 0, 0)');
    crtShade.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
  }
  ctx.fillStyle = crtShade;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// ---------------------------------------------------------------------
// WORLD MAP SCREEN  (Tab)
// The whole world, shrunk so that every tile is a 3x3 square of one colour.
// ---------------------------------------------------------------------
const MAP_COLORS = {
  '~': '#2f73d8', '.': '#4caf50', 'f': '#4caf50', 'T': '#1f6b2a', '^': '#9a9a9a', 'A': '#dfe8f0', 'U': '#3a2420',
  ':': '#e3c887', '*': '#eef4fa', 'P': '#1f5a3a', '%': '#5a4a48', ',': '#d2b278', '=': '#8b5a2b',
};
const MAP_DOT = 3;                    // pixels per tile on the map screen
const MAP_UNSEEN = '#39405e';         // colour of places we have not discovered yet

// One number per world tile: 1 = we have seen it. Saved with the game.
function seenTiles() {
  if (!G.seen) G.seen = new Uint8Array(MAPS.world.w * MAPS.world.h);
  return G.seen;
}
// A save from before the map kept track: assume the lands you must have crossed are known.
function guessSeenTiles() {
  const W = MAPS.world, seen = new Uint8Array(W.w * W.h);
  const lastRow = G.flags.boss2 ? W.h - 1 : G.flags.boss1 ? FAR_SOUTH_Y - 2 : SOUTH_LAND_Y - 2;
  for (let y = 0; y <= lastRow; y++) for (let x = 0; x < MAINLAND_W; x++) seen[y * W.w + x] = 1;
  return seen;
}

function toggleWorldMap() {
  if (UI.top && UI.top.isWorldMap) { Sfx.play('cancel'); return UI.pop(); }    // Tab again closes it
  if (mode !== 'explore' || UI.active) return;                                 // not during battles, menus or messages
  Sfx.play('ok');
  UI.stack.push({ type: 'custom', isWorldMap: true, draw: drawWorldMap });     // any confirm / cancel key closes it too
}

function drawWorldMap() {
  const W = MAPS.world;
  const left = Math.floor((SCREEN_W - W.w * MAP_DOT) / 2), top = 22;
  const at = (x, y) => [left + x * MAP_DOT, top + y * MAP_DOT];                // tile -> screen position
  // a square marker centred on a tile, with a dark outline
  const marker = (x, y, color, size = 5) => {
    const [sx, sy] = at(x, y), o = Math.floor((size - MAP_DOT) / 2);
    R(ctx, '#111', sx - o - 1, sy - o - 1, size + 2, size + 2); R(ctx, color, sx - o, sy - o, size, size);
  };

  drawWindow(2, 2, SCREEN_W - 4, SCREEN_H - 4);
  drawText('WORLD MAP', SCREEN_W / 2, 8, '#ffd75e', 'center');
  R(ctx, '#111', left - 1, top - 1, W.w * MAP_DOT + 2, W.h * MAP_DOT + 2);

  const towns = [], places = [], seen = seenTiles();
  for (let y = 0; y < W.h; y++) for (let x = 0; x < W.w; x++) {
    const tile = tileAt(W, x, y), [sx, sy] = at(x, y);
    if (!seen[y * W.w + x]) { R(ctx, MAP_UNSEEN, sx, sy, MAP_DOT, MAP_DOT); continue; }   // not discovered yet
    const exit = W.exits[tile];
    R(ctx, MAP_COLORS[tile] || (x >= MAINLAND_W && tile !== '$' && tile !== 'o' ? '#eef4fa' : '#4caf50'), sx, sy, MAP_DOT, MAP_DOT);
    if (tile === '$' || tile === 'o') R(ctx, '#e3c887', sx, sy, MAP_DOT, MAP_DOT);
    if (exit && MAPS[exit.to].isTown) towns.push([x, y, exit.to]);
    else if (exit || tile === 'h') places.push([x, y]);
    if (tile === '$') R(ctx, '#ffd75e', sx, sy, MAP_DOT, MAP_DOT);             // a chest nobody has opened yet
  }
  for (const [x, y] of places) marker(x, y, '#e0702a');                       // caves, crypt, tower, volcano, hut
  for (const [x, y, name] of towns) {
    marker(x, y, '#ffffff');
    if (visitedTowns().includes(name)) drawText(MAPS[name].title, at(x, y)[0] + 7, at(x, y)[1] - 3, '#fff');   // names of towns you know
  }
  if (G.flags.boat) marker(G.flags.boat.x, G.flags.boat.y, '#8b5a2b', 3);

  // where are we? on the world map: right here. Otherwise: at the door of the town or dungeon we are in.
  let here = player;
  if (player.map !== 'world') {
    const inside = MAPS[player.map];
    const letter = inside.isTown ? Object.keys(W.exits).find(l => W.exits[l].to === player.map) : (G.flags.caveEntry || 'C');
    here = findTile(W, letter);
  }
  if (Math.floor(performance.now() / 300) % 2) marker(here.x, here.y, '#ff3030');   // blinking red = you

  // legend
  const ly = top + W.h * MAP_DOT + 8;
  R(ctx, '#111', 13, ly, 7, 7); R(ctx, '#ff3030', 14, ly + 1, 5, 5); drawText('you', 24, ly);
  R(ctx, '#111', 59, ly, 7, 7); R(ctx, '#ffffff', 60, ly + 1, 5, 5); drawText('town', 70, ly);
  R(ctx, '#111', 109, ly, 7, 7); R(ctx, '#e0702a', 110, ly + 1, 5, 5); drawText('dungeon', 120, ly);
  R(ctx, '#111', 175, ly + 1, 5, 5); R(ctx, '#8b5a2b', 176, ly + 2, 3, 3); drawText('boat', 184, ly);
  R(ctx, '#ffd75e', 222, ly + 2, 3, 3); drawText('chest', 229, ly);
  R(ctx, MAP_UNSEEN, 14, ly + 14, 5, 5); drawText('not explored yet', 24, ly + 13, '#8088a8');
  drawText('Tab: close', SCREEN_W - 12, ly + 13, '#8088a8', 'right');
}

// ---------------------------------------------------------------------
// GAME LOOP  (runs about 60 times per second)
// ---------------------------------------------------------------------
function update(dt) {
  // pick the music for where we are (Music.want only reacts when this changes)
  Music.want(mode === 'bye' ? null : mode === 'title' ? 'Title'
           : mode === 'ending' && ending.stage === 2 ? ENDING_QUAKE_MUSIC      // "Wait. Do you feel that?"
           : mode === 'battle' ? (Battle.boss ? Battle.opts.music || 'Boss' : 'Battle') : MAPS[player.map].music);
  if (mode === 'title' || mode === 'bye' || mode === 'ending') return;
  if (mode === 'battle') { Battle.update(dt); return; }
  // a save from before the game had an ending: the last chest is already open, so the ending starts now
  if (!UI.active && !G.flags.endingSeen && G.flags['chest:m4:' + MAPS.m4.endingChest]) { startEnding(); return; }
  if (G.flags.boss2 && !G.flags.boat) G.flags.boat = dockFor('town3');     // the Tomb King is beaten: the boat appears near Starfall
  if (UI.active) { mouse.down = false; return; }                  // menus pause the world
  // a hero has reached a level where they choose an ability: ask now
  const chooser = G.party.find(h => pendingChoices(h).length);
  if (chooser) { player.path = null; mouse.down = false; return askAbilityChoice(chooser); }
  if (mouse.down) mouse.heldTime += dt;
  if (player.moving) {
    player.t += dt / MOVE_TIME;
    if (player.t >= 1) { player.moving = false; arrive(); }
  }
  if (!player.moving && mode === 'explore' && !UI.active) {
    const keyDir = ctrlHeld ? null : ['up', 'down', 'left', 'right'].find(dir => held[dir]);   // (Ctrl held: stand still)
    if (keyDir) { player.path = null; tryMove(keyDir); }          // the keyboard always wins over the mouse
    else if (mouse.down && mouse.heldTime >= HOLD_DELAY) followMouse();   // button held: re-aim at the pointer every step
    if (!keyDir && player.path && player.path.length) {           // click-to-move: take the next step
      const last = player.path.length === 1;
      tryMove(player.path.shift());
      if (!player.moving) {                                       // bumped into something
        player.path = null; mouse.down = false;
        if (last && !UI.active && mode === 'explore') interact(); // it was the thing we clicked: talk to it
      }
    }
  }
}

function draw() {
  ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);                     // draw in 320x240 units
  ctx.imageSmoothingEnabled = false;                              // keep the pixels crisp
  if (mode === 'title') drawTitle();
  else if (mode === 'ending') drawEnding();
  else if (mode === 'bye') drawGoodbye();
  else if (mode === 'battle') Battle.draw();
  else drawExplore();
  UI.draw();
  if (mode === 'explore') drawToast();                            // "Saved to slot 1."
  if (mode === 'battle') Battle.drawInfo();                       // the monster info box goes on top of the menus
  if (settings.scanlines) drawScanlines();
  drawPointer();
}

// Our own mouse pointer: the sword, drawn last so it is on top of everything.
function drawPointer() {
  if (!mouse.inside) return;
  ctx.setTransform(1, 0, 0, 1, 0, 0);                             // real canvas pixels, not 320x240 units
  const size = 16 * Math.max(1, Math.round(SCALE * 2 / 3));       // the sword art is 16x16; keep its pixels whole too
  ctx.drawImage(SPRITES.sword, Math.round(mouse.x * SCALE), Math.round(mouse.y * SCALE), size, size);
}

let lastTime = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  update(dt);
  draw();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

showTitle();
