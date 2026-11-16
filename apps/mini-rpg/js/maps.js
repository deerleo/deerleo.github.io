// =====================================================================
// maps.js  -  Every place in the game: the world map, two towns and
// the three floors of the cave.
// A map is a grid of letters. Each letter is one 16x16 tile:
//   .  grass      f  flowers    T  tree/forest   ^  mountain    :  desert sand
//   ~  water      =  bridge     ,  dirt path     *  snow        P  snowy pine   %  volcanic ash
//   A  snowy mountain            U  ash mountain
//   H  Greenvale  J  Sunreach   K  Starfall      L  Port Coral  I  the tower    h  hermit's hut
//   C c  cave mouths (north / south)   V v  crypt doors (north / south)   O  the volcano
//   #  wall       R r e y  roofs (red, blue, green, orange)   D  door     X  town exit
//   W _  cave wall / floor    Q ;  crypt    w -  tower    m a  volcano cave
//   <  >  stairs              E  way out of a dungeon
//   S  secret exit (solid wall until the boss is beaten)
//   $  treasure chest         B  where the boss stands
//
// Each map also has:
//   solid   - letters you cannot walk on
//   exits   - letters that take you somewhere else when you step on them
//   zoneFor - which group of monsters attacks on which tile (see ZONES)
//   music   - which music plays there
// =====================================================================

// ---- helpers ----
function parseMap(name, lines, fill, props) {
  const w = Math.max(...lines.map(l => l.length));
  const rows = lines.map(l => [...l.padEnd(w, fill)]);     // short rows are filled automatically
  return Object.assign({ name, w, h: rows.length, rows, npcs: [], labels: [], doors: {}, exits: {}, chests: {} }, props);
}
function findTile(map, ch) {                               // where is the first tile with this letter?
  for (let y = 0; y < map.h; y++) for (let x = 0; x < map.w; x++) if (map.rows[y][x] === ch) return { x, y };
}
// Some tiles change during the game (opened chests, the secret exit).
function tileAt(map, x, y) {
  const ch = map.rows[y][x];
  if (ch === '$') return G.flags[`chest:${map.name}:${x},${y}`] ? 'o' : '$';   // o = opened chest
  return map.dynamic ? map.dynamic(ch, x, y) : ch;
}

// ---------------------------------------------------------------------
// WORLD MAP - drawn by hand. Edit the letters to reshape the world!
// The mountain wall near the bottom separates the starting land from
// the southern land. The only way through is the cave (C -> c).
// ---------------------------------------------------------------------
const WORLD_ROWS = [
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~....TTTT.........~~....^^^^^^...~~~~',
  '~~....TTTTTT.........~~...^^^^^^^^...~~~',
  '~....TTTTTTT..........~~...^^^^^^^....~~',
  '~....TTTTTT...........~~....^^^^^.....~~',
  '~.....TTTT............~~.....^^^......~~',
  '~.....................~~..............~~',
  '~..........,,,,,,,,,,,==,,,,,,,.......~~',
  '~..........,..........~~......,..TTT..~~',
  '~.....^^...,..........~~......,.TTTTT.~~',
  '~....^^^^..,.........~~.......,.TTTTT.~~',
  '~.....^^...H.........~~.......,..TTT..~~',
  '~....................~~.......,.......~~',
  '~..TTT..............~~........,,,,....~~',
  '~.TTTTT.............~~...........,....~~',
  '~.TTTTTT...........~~~....TTTT...,....~~',
  '~..TTTTT...........~~....TTTTTT..,....~~',
  '~...TTT...........~~~....TTTTTTT.,....~~',
  '~~................~~......TTTTT.......~~',
  '~~~..............~~~.......TTT.......~~~',
  '~~~~^^^^^^^^^^^^~~~~^^^^^^^^C^^^^^^^~~~~',     // <- cave entrance (north side)
  '~~~~^^^^^^^^^^^^~~~~^^^^^^^^^^^^^^^^~~~~',
  '~~~^^^^^^^^^^^^^~~~~^^^^^^^^c^^^^^^^~~~~',     // <- cave exit (south side)
  '~~~.............~~~.........,........~~~',
  '~~....TTTT......~~~.........,.........~~',
  '~....TTTTTT,,,,,==,,,,,,,,,,,..TTTT...~~',
  '~.....TTTT.,....~~~...........TTTTTT..~~',
  '~..........,....~~~....^^^.....TTTT...~~',
  '~.......J,,,....~~....^^^^^...........~~',
  '~~..............~~.....^^^...........~~~',
  '~~~....TTT.....~~~~.................~~~~',
  '~~~............~~~~..........:::::...~~~',     // the desert begins
  '~~~....::::....~~~~.......::::::::::..~~',
  '~~...::::::::...==....:::::::::::::::.~~',
  '~~..::::::::::..~~..:::::::^^::::::::.~~',
  '~~..:::::I::::..~~..::::::^^^^:::::::.~~',     // <- I = the tower (optional)
  '~~...::::::::...~~...:::::::::::::::..~~',
  '~~~....::::....~~~~....:::::::::::...~~~',
  '~~~~^^^^^^^^^^^~~~~^^^^^^^^^V^^^^^^^~~~~',     // <- crypt door (north side)
  '~~~~^^^^^^^^^^^~~~~^^^^^^^^^^^^^^^^^~~~~',
  '~~~^^^^^^^^^^^^~~~~^^^^^^^^^v^^^^^^^~~~~',     // <- crypt exit (south side)
  '~~~.............~~~.........,........~~~',
  '~~....TTTT......~~~....TT...,.....TT..~~',
  '~....TTTTTT.....~~~...TTTT..,....TTTT.~~',
  '~.....TTTT......==,,,,,,,,,,,.....TT..~~',
  '~.........^^....~~~.....,.............~~',
  '~...............~~~.....,.............~~',
  '~~......TTT.....~~~.....K......^^^....~~',
  '~~~....TTTTT...~~~~..........^^^^^...~~~',
  '~~~~~.........~~~~~~~~............~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
];
const SOUTH_LAND_Y = 22;      // everything below this row is the tougher southern land
const FAR_SOUTH_Y = 40;       // ...and below this one, the far south (tougher again)

// The hand-drawn rows above are the western continent (40 tiles wide). The world is much
// bigger than that: everything east of it is open sea with islands, added by code below.
const WORLD_W = 84, WORLD_H = 56, MAINLAND_W = 40;

function makeWorld() {
  const lines = WORLD_ROWS.map(row => row.padEnd(WORLD_W, '~'));
  while (lines.length < WORLD_H) lines.push('~'.repeat(WORLD_W));
  const map = parseMap('world', lines, '~', {
    solid: '^AU~h$o', music: 'World', floorTile: ':',
    exits: {
      H: { to: 'town',  x: 14, y: 18, dir: 'up' },
      J: { to: 'town2', x: 14, y: 18, dir: 'up' },
      K: { to: 'town3', x: 14, y: 18, dir: 'up' },
      L: { to: 'town4', x: 14, y: 18, dir: 'up' },
      C: { to: 'd1', at: 'E', dir: 'up' },
      c: { to: 'd3', x: 12, y: 9, dir: 'up' },
      V: { to: 'k1', at: 'E' },                      // crypt, front door
      v: { to: 'k5', at: 'B', dir: 'up' },           // crypt, back door (where the boss stood)
      I: { to: 't1', at: 'E' },                      // tower
      O: { to: 'm1', at: 'E' },                      // volcano cave
    },
    // which monsters attack where
    zoneFor: (tile, x, y) => {
      if (tile === '~') return player.onBoat ? 'sea' : null;
      if (x >= MAINLAND_W) {                         // the islands
        return { '.': 'grass4', 'T': 'forest4', '*': 'snow', 'P': 'snow', '%': 'volcano' }[tile] || null;
      }
      if (tile === ':') return 'desert';
      const zone = tile === '.' ? 'grass' : tile === 'T' ? 'forest' : null;
      if (!zone) return null;
      return y > FAR_SOUTH_Y ? zone + '3' : y > SOUTH_LAND_Y ? zone + '2' : zone;
    },
  });
  buildEasternSea(map);
  return map;
}

// THE EASTERN SEA: islands made of rough blobs. (Seeded random again, so they never change.)
function buildEasternSea(map) {
  const rows = map.rows, rand = seededRandom(99);
  // a blob of "tile" around (cx, cy); with "only", it only replaces those tiles
  const blob = (cx, cy, rx, ry, tile, only) => {
    for (let y = cy - ry; y <= cy + ry; y++) for (let x = cx - rx; x <= cx + rx; x++) {
      const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
      if (d <= 1 - rand() * 0.3 && (!only || only.includes(rows[y][x]))) rows[y][x] = tile;
    }
  };
  const put = (tile, list) => { for (const [x, y] of list) rows[y][x] = tile; };

  // CORAL ISLE (north): green and friendly, with the harbour town of Port Coral
  blob(57, 11, 10, 6, '.');
  blob(51, 10, 3, 2, 'T', '.'); blob(63, 13, 3, 2, 'T', '.'); blob(57, 7, 3, 1, '^', '.');
  put('.', [[57, 12], [59, 12], [58, 13], [58, 11]]); put('L', [[58, 12]]);

  // FROST ISLE (east): snow, pines, and a hermit who lives alone
  blob(72, 27, 9, 7, '*');
  blob(67, 24, 3, 2, 'P', '*'); blob(76, 30, 3, 2, 'P', '*'); blob(73, 25, 2, 2, 'A', '*');
  put('*', [[70, 31], [69, 30], [71, 30]]); put('h', [[70, 30]]);
  map.hut = '70,30';                                  // main.js decides what happens at the hut

  // THE VOLCANO (south): ash and fire. The cave mouth is on the south side of the peak.
  blob(54, 40, 9, 6, '%');
  blob(54, 38, 3, 2, 'U', '%');
  put('%', [[54, 41], [53, 41], [55, 41], [54, 42]]); put('O', [[54, 40]]);

  // TREASURE ISLETS: tiny beaches with a chest each
  const islets = [[46, 25], [77, 45], [70, 4], [46, 51]];
  const treasure = [{ gold: 5000 }, { item: 'elixir', n: 3 }, { item: 'ward', n: 10 }, { armor: 8 }];
  islets.forEach(([x, y], i) => {
    blob(x, y, 2, 2, ':');
    put(':', [[x, y + 1], [x - 1, y], [x + 1, y]]); put('$', [[x, y]]);
    map.chests[x + ',' + y] = treasure[i];
  });
}

// ---------------------------------------------------------------------
// TOWNS - built with small helper functions instead of typing every tile.
// ---------------------------------------------------------------------
function townBase(name, worldTile, roof) {
  const w = 30, h = 20;
  const lines = Array.from({ length: h }, () => '.'.repeat(w));
  const map = parseMap(name, lines, '.', {
    solid: 'T#Rrey~D', music: 'Town', isTown: true, doorAt: {},
    exits: { X: { to: 'world', at: worldTile, dir: 'down' } },
    innFront: null,                       // where you wake up after losing a battle
  });
  const rows = map.rows;
  const rect = (ch, x, y, rw, rh) => { for (let j = y; j < y + rh; j++) for (let i = x; i < x + rw; i++) rows[j][i] = ch; };

  // A building: roof on top, one row of wall, a door in the middle, a name above the door.
  const building = (key, label, x, y, bw = 5, bh = 3) => {
    rect(roof, x, y, bw, bh - 1);
    rect('#', x, y + bh - 1, bw, 1);
    const dx = x + Math.floor(bw / 2), dy = y + bh - 1;
    rows[dy][dx] = 'D';
    map.doorAt[key] = dx + ',' + dy;      // main.js decides what each door does
    if (label) map.labels.push({ text: label, x: dx * TILE + 8, y: (dy - 1) * TILE + 4 });
    if (key === 'inn') map.innFront = { x: dx, y: dy + 1 };
  };
  const put = (ch, list) => { for (const [x, y] of list) rows[y][x] = ch; };

  // tree border all around, and the gate at the bottom
  rect('T', 0, 0, w, 1); rect('T', 0, h - 1, w, 1); rect('T', 0, 0, 1, h); rect('T', w - 1, 0, 1, h);
  return { map, rect, building, put };
}

function makeTown() {                     // GREENVALE - the starting town
  const { map, rect, building, put } = townBase('town', 'H', 'R');
  rect(',', 2, 5, 26, 1);                 // street in front of the shops
  rect(',', 14, 5, 2, 14);                // main road down to the gate
  rect(',', 4, 13, 22, 1);                // street in front of the houses
  rect('X', 14, 19, 2, 1);                // the gate: stepping here leaves town

  building('weapons', 'WEAPONS', 2, 2);
  building('armor',   'ARMOR',   8, 2);
  building('items',   'ITEMS',  17, 2);
  building('inn',     'INN',    23, 2);
  building('house1', '', 4, 10);
  building('house2', '', 20, 10);

  rect('~', 6, 15, 4, 3);                 // pond
  put('T', [[11, 8], [18, 8], [3, 8], [26, 8], [11, 16], [19, 16], [24, 16], [25, 17]]);
  put('f', [[12, 9], [17, 9], [3, 15], [21, 17], [22, 7], [7, 8]]);

  map.npcs = [
    { x: 9,  y: 7,  name: 'Elder',  sprite: 'npcElder', lines: ['Welcome to Greenvale, travellers.', 'Far to the south-east, past the bridge, a cave leads under the mountains. They say a monster rules it.'] },
    { x: 17, y: 10, name: 'Mira',   sprite: 'npcGirl',  lines: ['The inn restores all your HP and MP. Worth every coin!'] },
    { x: 13, y: 17, name: 'Guard',  sprite: 'npcGuard', lines: ['The gate is just south of here.', 'I would not enter the cave before LVL 6 or so. The things in there hit hard.'] },
    { x: 10, y: 14, name: 'Tobin',  sprite: 'npcBoy',   lines: ['I heard RAYEN learns new spells faster than anyone.', 'I want to be a hero too someday!'] },
  ];
  map.start = { x: 14, y: 7 };            // where a new game begins
  map.title = 'Greenvale';                // the name shown in the Warp list
  return map;
}

function makeTown2() {                    // SUNREACH - the town beyond the mountains
  const { map, rect, building, put } = townBase('town2', 'J', 'r');
  rect(',', 2, 6, 26, 1);                 // upper street
  rect(',', 2, 13, 26, 1);                // lower street
  rect(',', 14, 6, 2, 13);                // main road down to the gate
  rect('X', 14, 19, 2, 1);

  building('weapons', 'WEAPONS', 3, 3);
  building('house1', '', 9, 3);
  building('inn',     'INN',    21, 3);
  building('armor',   'ARMOR',   3, 10);
  building('house2', '', 9, 10);
  building('items',   'ITEMS',  21, 10);

  rect('~', 18, 8, 3, 3);                 // fountain pond
  put('T', [[2, 8], [26, 8], [12, 16], [17, 16], [4, 16], [25, 16]]);
  put('f', [[17, 9], [21, 9], [6, 8], [10, 15], [20, 15], [24, 8], [7, 16]]);

  map.npcs = [
    { x: 12, y: 7,  name: 'Sailor', sprite: 'npcGuard', lines: ['You came THROUGH the mountain? Nobody has done that in years!', 'Welcome to Sunreach.'] },
    { x: 17, y: 12, name: 'Lena',   sprite: 'npcGirl',  lines: ['Our smiths work with mythril. You will not find gear like this in Greenvale.'] },
    { x: 6,  y: 14, name: 'Old Jo', sprite: 'npcElder', lines: ['The wolves and orcs around here are meaner than the ones up north. Stock up on Hi-Potions.', 'South of here the grass turns to desert. There is an old crypt in the far mountains, and a tower to the west that nobody has ever climbed to the top.'] },
    { x: 13, y: 16, name: 'Pip',    sprite: 'npcBoy',   lines: ['Is it true you beat the Cave Lord? Wow!'] },
  ];
  map.title = 'Sunreach';
  return map;
}

// ---------------------------------------------------------------------
// THE CAVE - three floors, drawn by hand.
// ---------------------------------------------------------------------
const CAVE_1 = [
  'WWWWWWWWWWWWWWWWWWWWWWWW',
  'W__________W_______W$__W',
  'W_WWWWWWWW_W_WWWWW_W_W_W',
  'W_W______W_W_W_______W_W',
  'W_W_WWWW_W___W_W_WWWWW_W',
  'W_W_W$_W_WWWWW_W_______W',
  'W_W_WW_W_______WWWWWWW_W',
  'W_W____WWWWWWW_W_____W_W',
  'W_WWWWWW_____W_W_WWW_W_W',
  'W________WWW_W___W>W___W',
  'WWWWWWWW_W_W_WWWWW_WWWWW',
  'W______W_W_W___________W',
  'W_WW_W_W_W_WWWWWWWWW_W_W',
  'W_W__W___W___________W_W',
  'W_WE_WWWWWWWWWWWWWWWWW_W',
  'WWWWWWWWWWWWWWWWWWWWWWWW',
];
const CAVE_2 = [
  'WWWWWWWWWWWWWWWWWWWWWWWW',
  'W<____W________W_____$_W',
  'W_____W_WWWWWW_W_______W',
  'W_____W_W____W_WWWW_WWWW',
  'WWW_WWW_W____W____W____W',
  'W_______W____WWWW_W____W',
  'W_WWWWWWW______________W',
  'W_W_____WWWW_WWWWWWW___W',
  'W_W_____W______W_______W',
  'W_W_____W______W_WWWWWWW',
  'W_WW_WWWW______W_______W',
  'W__________WWWWWWWWWW__W',
  'WWWWWWW_WWWW________W__W',
  'W$______W_____WWWW_____W',
  'W_______W_____W>_______W',
  'WWWWWWWWWWWWWWWWWWWWWWWW',
];
const CAVE_3 = [
  'WWWWWWWWWWWWWWWWWWWWWWWW',
  'W<___W_____________W_$_W',
  'W____W_WWWWWWWWWWW_W___W',
  'W____W_W_________W_WW_WW',
  'WW_WWW_W_WWWWWWW_W_____W',
  'W______W_W_____W_WWWWW_W',
  'W_WWWWWW_W_____W_______W',
  'W______________WWWWWWWWW',
  'WWWWWWWWWW__B__WWWWWWWWW',     // B = the boss blocks the only way south
  'WWWWWWWWWWWW_WWWWWWWWWWW',
  'WWWWWWWWWWWWSWWWWWWWWWWW',     // S = secret exit, appears when the boss is beaten
  'WWWWWWWWWWWWWWWWWWWWWWWW',
];

function makeTown3() {                    // STARFALL - the town in the far south
  const { map, rect, building, put } = townBase('town3', 'K', 'e');
  rect(',', 2, 9, 26, 1);                 // street in front of the shops
  rect(',', 14, 3, 2, 16);                // long main road
  rect(',', 4, 15, 22, 1);                // street in front of the houses
  rect('X', 14, 19, 2, 1);

  building('weapons', 'WEAPONS', 3, 6);
  building('armor',   'ARMOR',   9, 6);
  building('items',   'ITEMS',  17, 6);
  building('inn',     'INN',    23, 6);
  building('house1', '', 5, 12);
  building('house2', '', 20, 12);

  put('T', [[2, 3], [5, 3], [8, 3], [21, 3], [24, 3], [27, 3], [11, 17], [18, 17]]);
  put('f', [[12, 4], [17, 4], [11, 11], [18, 11], [3, 17], [26, 17], [12, 13], [17, 13]]);

  map.npcs = [
    { x: 16, y: 5,  name: 'Watchman', sprite: 'npcGuard', lines: ['Welcome to Starfall, the last town before the sea.', 'You crossed the crypt? Then the Tomb King is no more. Thank you.'] },
    { x: 12, y: 10, name: 'Smith',    sprite: 'npcBoy',   lines: ['We sell the best gear gold can buy. The only thing better lies at the top of the desert tower.'] },
    { x: 17, y: 11, name: 'Nia',      sprite: 'npcGirl',  lines: ['RAYEN can Warp between towns for free, you know. No need to walk back through the crypt.'] },
    { x: 8,  y: 16, name: 'Sage',     sprite: 'npcElder', lines: ['Every floor of the tower is harder than the one below, and the treasure gets better too.', 'A dragon guards the top. Do not climb it unprepared.'] },
  ];
  map.title = 'Starfall';
  return map;
}

function makeTown4() {                    // PORT CORAL - the harbour town on Coral Isle
  const { map, rect, building, put } = townBase('town4', 'L', 'y');
  rect(',', 2, 7, 26, 1);                 // street in front of the shops
  rect(',', 14, 7, 2, 12);                // main road down to the gate
  rect(',', 3, 14, 12, 1);                // lane to the houses
  rect('X', 14, 19, 2, 1);

  building('weapons', 'WEAPONS', 3, 4);
  building('armor',   'ARMOR',   9, 4);
  building('inn',     'INN',    17, 4);
  building('items',   'ITEMS',  23, 4);
  building('house1', '', 3, 11);
  building('house2', '', 9, 11);

  rect('~', 19, 11, 9, 7);                // the harbour
  rect(',', 18, 10, 10, 1); rect(',', 18, 10, 1, 8);   // the quay around it
  put('T', [[2, 16], [6, 17], [11, 17], [2, 9]]);
  put('f', [[4, 9], [8, 9], [12, 9], [5, 16], [9, 16], [16, 9], [21, 9]]);

  map.npcs = [
    { x: 12, y: 8,  name: 'Harbourmaster', sprite: 'npcGuard', lines: ['Port Coral welcomes anyone who can cross the sea in one piece.', 'Mind the krakens.'] },
    { x: 17, y: 12, name: 'Fisher',  sprite: 'npcBoy',   lines: ['South of here a volcano smokes day and night. Something lives in the cave under it. Something big.', 'They say it sleeps on the finest arms ever forged.'] },
    { x: 10, y: 15, name: 'Coralie', sprite: 'npcGirl',  lines: ['An old hermit lives on the snowy island to the east. He is grumpy, but he will let you warm up by his fire.'] },
    { x: 16, y: 16, name: 'Old Salt', sprite: 'npcElder', lines: ['Keep an eye out for tiny islands with a single chest on them. Pirates, you know.', 'There are four that I know of.'] },
  ];
  map.title = 'Port Coral';
  return map;
}

// ---------------------------------------------------------------------
// DUNGEON MAPS
// makeDungeon turns a grid of letters into a dungeon floor. Options:
//   wall, floor - the two letters this dungeon is built from
//   zone        - which monsters live here (see ZONES in data.js)
//   exits       - stairs and doors
//   treasure    - loot for each '$', in reading order (left to right, top to bottom)
//   boss        - who stands on the 'B' tile (see BOSSES in data.js)
// ---------------------------------------------------------------------
function makeDungeon(name, lines, o) {
  const beaten = () => !o.boss || G.flags[o.bossFlag || BOSSES[o.boss].flag];   // bossFlag: the Endless Tower uses its own
  const map = parseMap(name, lines, o.wall, {
    solid: o.wall + '$o', music: 'Dungeon', isDungeon: true, exits: o.exits, floorTile: o.floor,
    zoneFor: tile => tile === o.floor ? o.zone : null,
    dynamic: (ch, x, y) => {
      if (ch === 'B') return o.floor;
      if (ch === 'S') return beaten() ? 'S' : o.wall;                          // secret exit
      return ch;
    },
  });
  let n = 0;
  if (o.treasure) map.rows.forEach((row, y) => row.forEach((ch, x) => { if (ch === '$') map.chests[x + ',' + y] = o.treasure[n++]; }));

  // The boss stands on the 'B' tile until he is beaten. (main.js starts the fight when you walk into him.)
  const spot = findTile(map, 'B');
  if (spot && o.boss) {
    map.npcs.push({ x: spot.x, y: spot.y, name: ENEMIES[o.boss].name, sprite: ENEMIES[o.boss].sprite,
                    boss: o.boss, bossFlag: o.bossFlag, hidden: beaten });
  }
  return map;
}

// ---------------------------------------------------------------------
// RANDOM FLOORS
// The crypt and the tower are not drawn by hand: a little program digs a
// maze for every floor. It uses a "seeded" random number generator, which
// gives the SAME numbers every time, so the floors never change between
// plays (and saved chests stay where they were). Change a seed and you
// get a whole new dungeon.
// ---------------------------------------------------------------------
function seededRandom(seed) {
  let s = seed >>> 0;
  return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;
}

// Options: wall, floor, entry (tile to arrive on), next (stairs onward, or null),
// chests (how many), loops (extra openings so the maze is less of a tree),
// guard: 'exit'  = the boss guards a secret exit 'S' in the outer wall
//        'chest' = the boss guards a big chest in the outer wall
// w and h must be odd numbers.
function generateFloor(seed, w, h, o) {
  const rand = seededRandom(seed);
  const pickFrom = list => list[Math.floor(rand() * list.length)];
  const STEPS = [[0, -1], [0, 1], [-1, 0], [1, 0]];
  const grid = Array.from({ length: h }, () => Array(w).fill(o.wall));
  const inside = (x, y) => x > 0 && y > 0 && x < w - 1 && y < h - 1;
  const key = c => c[0] + ',' + c[1];

  // 1. Dig the maze. Rooms sit on odd coordinates; we walk from room to room knocking
  //    down the wall in between, and back up whenever we get stuck.
  //    (anyStart: begin digging at a random room; the Endless Tower uses it so its stairs move about)
  const first = o.anyStart ? [1 + 2 * Math.floor(rand() * ((w - 1) / 2)), 1 + 2 * Math.floor(rand() * ((h - 1) / 2))] : [1, 1];
  grid[first[1]][first[0]] = o.floor;
  const trail = [first];
  while (trail.length) {
    const [x, y] = trail[trail.length - 1];
    const options = STEPS.map(([dx, dy]) => [x + dx * 2, y + dy * 2, x + dx, y + dy])
                         .filter(([nx, ny]) => inside(nx, ny) && grid[ny][nx] === o.wall);
    if (!options.length) { trail.pop(); continue; }
    const [nx, ny, wallX, wallY] = pickFrom(options);
    grid[wallY][wallX] = o.floor;
    grid[ny][nx] = o.floor;
    trail.push([nx, ny]);
  }

  // 2. Knock a few extra holes so there is more than one way around.
  for (let i = 0; i < o.loops; i++) {
    const x = 1 + Math.floor(rand() * (w - 2)), y = 1 + Math.floor(rand() * (h - 2));
    if ((x + y) % 2 === 1) grid[y][x] = o.floor;        // only walls BETWEEN two rooms
  }

  // 3. Find the dead ends: good places for doors, stairs and chests.
  const rooms = [];
  for (let y = 1; y < h - 1; y += 2) for (let x = 1; x < w - 1; x += 2) rooms.push([x, y]);
  const ways = ([x, y]) => STEPS.filter(([dx, dy]) => grid[y + dy][x + dx] !== o.wall).length;
  const deadEnds = rooms.filter(c => ways(c) === 1);
  const entry = pickFrom(deadEnds);

  // 4. How far is every tile from the entry? The far end is where the stairs (or the boss) go.
  const dist = { [key(entry)]: 0 };
  const queue = [entry];
  while (queue.length) {
    const [x, y] = queue.shift();
    for (const [dx, dy] of STEPS) {
      const n = [x + dx, y + dy];
      if (grid[n[1]][n[0]] === o.wall || key(n) in dist) continue;
      dist[key(n)] = dist[key([x, y])] + 1;
      queue.push(n);
    }
  }
  const farthest = list => list.reduce((best, c) => dist[key(c)] > dist[key(best)] ? c : best);
  const used = new Set([key(entry)]);
  const result = { chests: [], bossChest: null, entry };

  if (o.guard) {
    // the boss takes the farthest dead end that touches the outer wall,
    // and the thing he guards goes INTO that outer wall, so he is the only way to it
    // (now and then a maze has no dead end at the outer wall: then any room at the outer wall will do)
    const atEdge = list => list.filter(([x, y]) => key([x, y]) !== key(entry) && (x === 1 || y === 1 || x === w - 2 || y === h - 2));
    const [x, y] = farthest(atEdge(deadEnds).length ? atEdge(deadEnds) : atEdge(rooms));
    const gx = x === 1 ? 0 : x === w - 2 ? w - 1 : x;
    const gy = gx !== x ? y : y === 1 ? 0 : h - 1;
    grid[y][x] = 'B';
    grid[gy][gx] = o.guard === 'exit' ? 'S' : '$';
    if (o.guard === 'chest') result.bossChest = [gx, gy];
    used.add(key([x, y]));
  } else if (o.next) {
    const far = farthest(rooms);
    grid[far[1]][far[0]] = o.next;
    used.add(key(far));
  }

  // 5. Chests in some of the remaining dead ends.
  const spots = deadEnds.filter(c => !used.has(key(c)));
  for (let i = 0; i < o.chests && spots.length; i++) {
    const c = spots.splice(Math.floor(rand() * spots.length), 1)[0];
    grid[c[1]][c[0]] = '$';
    result.chests.push(c);
  }
  grid[entry[1]][entry[0]] = o.entry;
  result.lines = grid.map(row => row.join(''));
  return result;
}

// Build a whole dungeon of generated floors and link them with stairs.
// Options: prefix ('k' -> maps k1, k2...), floors, w, h, seed, loops, wall, floor,
//   back / onward - the stairs letters (towards the entrance / deeper in)
//   zone(n)       - monster zone of floor n
//   worldTile     - the letter of its door on the world map
//   treasure      - a list of loot for every floor
//   boss, guard, worldExit, bossTreasure - what waits on the last floor
function buildGeneratedDungeon(maps, o) {
  for (let n = 1; n <= o.floors; n++) {
    const last = n === o.floors, name = o.prefix + n;
    const made = generateFloor(o.seed + n * 101, o.w, o.h, {
      wall: o.wall, floor: o.floor, loops: o.loops, chests: o.treasure[n - 1].length,
      entry: n === 1 ? 'E' : o.back, next: last ? null : o.onward, guard: last ? o.guard : null,
    });
    const exits = {};
    if (n === 1) exits.E = { to: 'world', at: o.worldTile, dir: 'down' };
    else exits[o.back] = { to: o.prefix + (n - 1), at: o.onward };
    if (!last) exits[o.onward] = { to: o.prefix + (n + 1), at: o.back };
    if (last && o.guard === 'exit') exits.S = { to: 'world', at: o.worldExit, dir: 'down' };

    const map = makeDungeon(name, made.lines, { wall: o.wall, floor: o.floor, zone: o.zone(n), exits, boss: last ? o.boss : null });
    made.chests.forEach((c, i) => { map.chests[c[0] + ',' + c[1]] = o.treasure[n - 1][i]; });
    if (made.bossChest) {
      map.chests[made.bossChest[0] + ',' + made.bossChest[1]] = o.bossTreasure;
      if (o.ending) map.endingChest = made.bossChest[0] + ',' + made.bossChest[1];   // opening this one ends the game
    }
    maps[name] = map;
  }
}

// ---------------------------------------------------------------------
// ALL THE MAPS
// ---------------------------------------------------------------------
const CAVE = { wall: 'W', floor: '_', zone: 'dungeon' };
const MAPS = {
  town: makeTown(),
  town2: makeTown2(),
  town3: makeTown3(),
  town4: makeTown4(),
  world: makeWorld(),
  // the cave (hand-drawn)
  d1: makeDungeon('d1', CAVE_1, { ...CAVE, exits: { E: { to: 'world', at: 'C', dir: 'up' }, '>': { to: 'd2', at: '<' } },
                  treasure: [{ gold: 120 }, { item: 'potion', n: 3 }] }),
  d2: makeDungeon('d2', CAVE_2, { ...CAVE, exits: { '<': { to: 'd1', at: '>' }, '>': { to: 'd3', at: '<' } },
                  treasure: [{ item: 'ether', n: 2 }, { item: 'revive', n: 1 }] }),
  d3: makeDungeon('d3', CAVE_3, { ...CAVE, exits: { '<': { to: 'd2', at: '>' }, S: { to: 'world', at: 'c', dir: 'down' } },
                  treasure: [{ item: 'hipotion', n: 2 }], boss: 'cavelord' }),
};

// THE CRYPT: 5 floors (maps k1-k5). The Tomb King guards the way to the far south.
buildGeneratedDungeon(MAPS, {
  prefix: 'k', floors: 5, w: 25, h: 17, seed: 2024, loops: 6,
  wall: 'Q', floor: ';', back: '<', onward: '>', zone: () => 'crypt',
  worldTile: 'V', worldExit: 'v', boss: 'tombking', guard: 'exit',
  treasure: [
    [{ gold: 600 }, { item: 'hipotion', n: 3 }],
    [{ item: 'hiether', n: 2 }, { armor: 5 }],
    [{ gold: 1200 }, { item: 'revive', n: 2 }],
    [{ weapon: 'staff', tier: 6 }, { item: 'elixir', n: 1 }],
    [{ item: 'elixir', n: 1 }],
  ],
});

// THE TOWER: 10 floors (maps t1-t10), optional. Here "onward" is UP, so the stairs
// letters are swapped: '<' (drawn as rising steps) leads up and '>' leads back down.
// The loot gets better every floor; the Sky Dragon guards the best chest of all.
buildGeneratedDungeon(MAPS, {
  prefix: 't', floors: TOWER_FLOORS, w: 19, h: 13, seed: 777, loops: 3,
  wall: 'w', floor: '-', back: '>', onward: '<', zone: n => 'tower' + n,
  worldTile: 'I', boss: 'skydragon', guard: 'chest',
  treasure: [
    [{ gold: 500 }, { item: 'hipotion', n: 3 }],                       // floor 1
    [{ item: 'hiether', n: 2 }, { item: 'revive', n: 2 }],
    [{ weapon: 'staff', tier: 6 }, { gold: 1000 }],
    [{ weapon: 'bow', tier: 6 }, { item: 'hipotion', n: 5 }],
    [{ weapon: 'sword', tier: 6 }, { armor: 6 }],                      // floor 5
    [{ item: 'elixir', n: 2 }, { armor: 6 }],
    [{ weapon: 'sword', tier: 7 }, { armor: 6 }],
    [{ weapon: 'bow', tier: 7 }, { weapon: 'staff', tier: 7 }],
    [{ armor: 7 }, { item: 'elixir', n: 2 }],
    [{ armor: 7 }, { armor: 7 }],                                      // floor 10
  ],
  bossTreasure: [{ weapon: 'sword', tier: 8 }, { weapon: 'bow', tier: 8 }, { weapon: 'staff', tier: 8 }, { armor: 8 }],
});

// THE VOLCANO CAVE: 4 floors (maps m1-m4), reached by boat. The Magma Lord guards the best gear in the game.
buildGeneratedDungeon(MAPS, {
  prefix: 'm', floors: 4, w: 25, h: 17, seed: 4242, loops: 5,
  wall: 'm', floor: 'a', back: '<', onward: '>', zone: () => 'magma',
  worldTile: 'O', boss: 'magmalord', guard: 'chest', ending: true,
  treasure: [
    [{ gold: 3000 }, { item: 'elixir', n: 2 }],
    [{ armor: 9 }, { item: 'hiether', n: 5 }],
    [{ armor: 9 }, { item: 'elixir', n: 3 }],
    [{ gold: 8000 }, { armor: 9 }],
  ],
  bossTreasure: [{ weapon: 'sword', tier: 10 }, { weapon: 'bow', tier: 10 }, { weapon: 'staff', tier: 10 }, { armor: 10 }],
});

// The name shown in the corner of the screen while you are inside a dungeon.
function nameFloors(prefix, title, count) {
  for (let n = 1; n <= count; n++) MAPS[prefix + n].place = `${title} - Floor ${n} of ${count}`;
}
nameFloors('d', 'Cave', 3);
nameFloors('k', 'Crypt', 5);
nameFloors('t', 'Tower', TOWER_FLOORS);
nameFloors('m', 'Volcano', 4);
