// =====================================================================
// data.js  -  All the numbers and rules of the game live in this file.
// Want to rebalance something? This is the place to tweak.
// =====================================================================

// ---- small helpers used everywhere ----
const rnd = (a, b) => a + Math.random() * (b - a);            // random number between a and b
const pick = arr => arr[Math.floor(Math.random() * arr.length)]; // random element
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// ---------------------------------------------------------------------
// HEROES
// "base" = stats at LVL 1, "max" = stats at LVL 99 (never above 255).
// In New Game+ the limits go up (see levelCap and statCap): the same straight line simply keeps climbing.
// Stats grow in a straight line between the two, a little every level.
//   STR = physical attack      DEF = physical defence
//   MAG = spell power          INT = resistance to enemy spells
// "spells"  = [level learned, spell id]
// "choices" = levels where the player picks one of two abilities (this is how you make a "build")
// ---------------------------------------------------------------------
const HERO_DEFS = {
  arturos: {
    name: 'ARTUROS', weapon: 'sword',
    base: { hp: 40, mp: 6,  str: 12, def: 10, int: 4,  mag: 4 },
    max:  { hp: 255, mp: 120, str: 255, def: 230, int: 110, mag: 110 },
    spells: [[3, 'spark'], [6, 'firstaid'], [10, 'flameedge'], [14, 'powerslash'], [16, 'guardup'], [20, 'powerup'],
             [24, 'whirlwind'], [30, 'thunderblade'], [40, 'dragonslayer'], [48, 'bladestorm']],
    // at these levels you pick ONE of two abilities: [level, option A, option B]
    choices: [[8, 'cleave', 'taunt'], [18, 'venomblade', 'bulwark'], [28, 'frostedge', 'galeslash'], [36, 'berserk', 'secondwind']],
  },
  sorutra: {
    name: 'SORUTRA', weapon: 'bow',
    base: { hp: 32, mp: 12, str: 9,  def: 7,  int: 8,  mag: 7 },
    max:  { hp: 230, mp: 190, str: 200, def: 180, int: 180, mag: 170 },
    spells: [[2, 'guardup'], [4, 'powerup'], [5, 'windshot'], [8, 'mend'], [12, 'gale'], [16, 'healall'],
             [22, 'cyclone'], [27, 'mendmore'], [32, 'barrier'], [38, 'tempest'], [45, 'massheal'], [55, 'arrowstorm'], [70, 'renewal']],
    choices: [[6, 'lullaby', 'venomshot'], [14, 'hush', 'icearrow'], [24, 'masslullaby', 'boltarrow'], [34, 'weaken', 'expose']],
  },
  rayen: {
    name: 'RAYEN', weapon: 'staff',
    base: { hp: 26, mp: 20, str: 5,  def: 5,  int: 12, mag: 12 },
    max:  { hp: 200, mp: 255, str: 120, def: 140, int: 255, mag: 255 },
    spells: [[1, 'heal'], [2, 'fire'], [4, 'blaze'], [5, 'frost'], [6, 'healall'], [8, 'purify'], [9, 'healmore'],
             [13, 'thunder'], [24, 'meteor'], [28, 'massheal'], //[18, 'fullheal']
             [32, 'raise'], [38, 'nova'], [55, 'singularity'], [10, 'warp']],
    choices: [[7, 'bolt', 'regen'], [15, 'blizzard', 'purifyall'], [26, 'fireball', 'osmose'], [36, 'icestorm', 'massraise']],
  },
};

// ---------------------------------------------------------------------
// SPELLS
// kind:   'damage' | 'heal' | 'buff' | 'revive' | 'warp' (travel spell; in battle it is a sure escape)
// element: 'fire' | 'ice' | 'bolt' | 'wind'. Monsters weak to it take +50%, monsters that resist it take half.
// More kinds: 'status' (sleep / silence), 'cure', 'regen', 'debuff' (enemy STR or DEF -30%), 'selfbuff',
//             'taunt', 'osmose' (steal MP), 'healself'.   inflict: 'poison' = a hit that may also poison.
// uses:   'str' = a weapon skill: its strength comes from the caster's attack power instead
//         of MAG, and the target's DEF (not INT) protects against it.
// target: 'enemy' | 'allEnemies' | 'ally' | 'party'
// amount = power + caster MAG * scale   (see spellAmount below)
// ---------------------------------------------------------------------
const SPELLS = {
  // RAYEN - the best spells
  heal:     { name: 'Heal',      mp: 3,  kind: 'heal',   target: 'ally',       power: 15,  scale: 0.6 },
  fire:     { name: 'Fire',      mp: 3,  kind: 'damage', target: 'enemy',      power: 8,   scale: 0.5, element: 'fire' },
  blaze:    { name: 'Blaze',     mp: 6,  kind: 'damage', target: 'allEnemies', power: 6,   scale: 0.4, element: 'fire' },
  healall:  { name: 'Heal All',  mp: 9,  kind: 'heal',   target: 'party',      power: 12,  scale: 0.5 },
  healmore: { name: 'Mid Heal', mp: 7,  kind: 'heal',   target: 'ally',       power: 40,  scale: 1.0 },
  thunder:  { name: 'Thunder',   mp: 12, kind: 'damage', target: 'allEnemies', power: 20,  scale: 0.7, element: 'bolt' },
  fullheal: { name: 'Full Heal', mp: 14, kind: 'heal',   target: 'ally',       power: 255, scale: 1.0 },
  warp:     { name: 'Warp',      mp: 8,  kind: 'warp',   target: 'none' },
  massheal: { name: 'Full Heal', mp: 18, kind: 'heal',   target: 'party',      power: 40,  scale: 1.0 },
  raise:    { name: 'Raise',     mp: 14, kind: 'revive', target: 'ally' },
  nova:     { name: 'Nova',      mp: 30, kind: 'damage', target: 'allEnemies', power: 70,  scale: 1.3 },
  // RAYEN's strongest attack: one enemy, no element (so nothing resists it), harder than Nova hits each of its targets
  singularity: { name: 'Singularity', mp: 40, kind: 'damage', target: 'enemy', power: 85, scale: 1.8 },
  meteor:   { name: 'Meteor',    mp: 22, kind: 'damage', target: 'allEnemies', power: 45,  scale: 1.0 },
  // SORUTRA - buffs and average spells
  guardup:  { name: 'Guard Up',  mp: 3,  kind: 'buff',   target: 'party', stat: 'def' },
  powerup:  { name: 'Power Up',  mp: 3,  kind: 'buff',   target: 'party', stat: 'str' },
  windshot: { name: 'Wind Shot', mp: 3,  kind: 'damage', target: 'enemy',      power: 6,   scale: 0.5, element: 'wind' },
  mend:     { name: 'Mend',      mp: 4,  kind: 'heal',   target: 'ally',       power: 12,  scale: 0.5 },
  gale:     { name: 'Gale',      mp: 8,  kind: 'damage', target: 'allEnemies', power: 8,   scale: 0.5, element: 'wind' },
  cyclone:  { name: 'Cyclone',   mp: 12, kind: 'damage', target: 'allEnemies', power: 20,  scale: 0.7, element: 'wind' },
  mendmore: { name: 'Mend More', mp: 8,  kind: 'heal',   target: 'ally',       power: 40,  scale: 1.0 },
  barrier:  { name: 'Barrier',   mp: 4,  kind: 'buff',   target: 'party', stat: 'int' },
  tempest:  { name: 'Tempest',   mp: 20, kind: 'damage', target: 'allEnemies', power: 40,  scale: 0.9, element: 'wind' },
  // Regen on the whole party. rounds: how long it lasts (plain Regen uses REGEN_ROUNDS)
  renewal:  { name: 'Renewal',   mp: 50, kind: 'regen',  target: 'party', rounds: 3 },
  // hits: 4 = four separate arrows, each at a random enemy (all four at a lone boss). An Ability, so Silence cannot stop it.
  arrowstorm: { name: 'Arrow Storm', mp: 40, kind: 'damage', target: 'allEnemies', uses: 'str', power: 8, scale: 0.7, hits: 4 },
  // ARTUROS - the weakest spells, but strong sword skills later on
  spark:    { name: 'Spark',     mp: 2,  kind: 'damage', target: 'enemy',      power: 20,   scale: 0.4, element: 'bolt' },
  firstaid: { name: 'First Aid', mp: 3,  kind: 'heal',   target: 'ally',       power: 10,  scale: 0.6 },
  flameedge:{ name: 'Flame Edge',mp: 5,  kind: 'damage', target: 'enemy',      power: 30,  scale: 0.6, element: 'fire' },
  powerslash:   { name: 'Power Slash',   mp: 4,  kind: 'damage', target: 'enemy',      uses: 'str', power: 5,  scale: 0.65 },
  whirlwind:    { name: 'Whirlwind',     mp: 8,  kind: 'damage', target: 'allEnemies', uses: 'str', power: 0,  scale: 0.5 },
  thunderblade: { name: 'Thunder Blade', mp: 10, kind: 'damage', target: 'enemy',      uses: 'str', power: 20, scale: 1.0, element: 'bolt' },
  dragonslayer: { name: 'Dragon Slayer', mp: 16, kind: 'damage', target: 'enemy',      uses: 'str', power: 40, scale: 1.4 },
  bladestorm:   { name: 'Blade Storm',   mp: 20, kind: 'damage', target: 'allEnemies', uses: 'str', power: 20, scale: 0.8 },
  // ---- elements, status effects and the abilities you get by CHOOSING at a level-up (see "choices" above) ----
  // RAYEN
  frost:      { name: 'Frost',       mp: 3,  kind: 'damage', target: 'enemy',      power: 8,  scale: 0.5,  element: 'ice' },
  purify:     { name: 'Purify',      mp: 4,  kind: 'cure',   target: 'ally' },
  bolt:       { name: 'Bolt',        mp: 4,  kind: 'damage', target: 'enemy',      power: 12, scale: 0.6,  element: 'bolt' },
  regen:      { name: 'Regen',       mp: 6,  kind: 'regen',  target: 'ally' },
  blizzard:   { name: 'Blizzard',    mp: 10, kind: 'damage', target: 'allEnemies', power: 16, scale: 0.65, element: 'ice' },
  purifyall:  { name: 'Purify All',  mp: 10, kind: 'cure',   target: 'party' },
  fireball:   { name: 'Fireball',    mp: 16, kind: 'damage', target: 'enemy',      power: 40, scale: 1.3,  element: 'fire' },
  osmose:     { name: 'Osmose',      mp: 0,  kind: 'osmose', target: 'enemy' },
  icestorm:   { name: 'Ice Storm',   mp: 26, kind: 'damage', target: 'allEnemies', power: 60, scale: 1.2,  element: 'ice' },
  massraise:  { name: 'Mass Raise',  mp: 30, kind: 'revive', target: 'party' },
  // SORUTRA
  lullaby:    { name: 'Lullaby',     mp: 4,  kind: 'status', target: 'enemy',      status: 'sleep',   chance: 0.75 },
  venomshot:  { name: 'Venom Shot',  mp: 4,  kind: 'damage', target: 'enemy',      uses: 'str', power: 4,  scale: 0.6, inflict: 'poison' },
  hush:       { name: 'Hush',        mp: 4,  kind: 'status', target: 'enemy',      status: 'silence', chance: 0.8 },
  icearrow:   { name: 'Ice Arrow',   mp: 5,  kind: 'damage', target: 'enemy',      power: 14, scale: 0.7,  element: 'ice' },
  masslullaby:{ name: 'Slumber Song',mp: 12, kind: 'status', target: 'allEnemies', status: 'sleep',   chance: 0.5 },
  boltarrow:  { name: 'Bolt Arrow',  mp: 9,  kind: 'damage', target: 'enemy',      power: 30, scale: 1.0,  element: 'bolt' },
  weaken:     { name: 'Weaken',      mp: 6,  kind: 'debuff', target: 'enemy',      stat: 'str' },
  expose:     { name: 'Expose',      mp: 6,  kind: 'debuff', target: 'enemy',      stat: 'def' },
  // ARTUROS
  cleave:     { name: 'Cleave',      mp: 5,  kind: 'damage', target: 'allEnemies', uses: 'str', power: 0,  scale: 0.4 },
  taunt:      { name: 'Taunt',       mp: 3,  kind: 'taunt',  target: 'none' },
  venomblade: { name: 'Venom Blade', mp: 6,  kind: 'damage', target: 'enemy',      uses: 'str', power: 10, scale: 0.9, inflict: 'poison' },
  bulwark:    { name: 'Bulwark',     mp: 6,  kind: 'selfbuff', target: 'none', stat: 'def' },
  frostedge:  { name: 'Frost Edge',  mp: 9,  kind: 'damage', target: 'enemy',      uses: 'str', power: 20, scale: 1.0, element: 'ice' },
  galeslash:  { name: 'Gale Slash',  mp: 10, kind: 'damage', target: 'allEnemies', uses: 'str', power: 10, scale: 0.6, element: 'wind' },
  berserk:    { name: 'Berserk',     mp: 8,  kind: 'selfbuff', target: 'none', stat: 'str' },
  secondwind: { name: 'Second Wind', mp: 8,  kind: 'healself', target: 'none' },
  // enemy-only
  ember:    { name: 'Ember',     mp: 3,  kind: 'damage', target: 'enemy',      power: 4,   scale: 0.4, element: 'fire' },
  chill:    { name: 'Chill',     mp: 3,  kind: 'damage', target: 'enemy',      power: 6,   scale: 0.45, element: 'ice' },
  darkwave: { name: 'Dark Wave', mp: 5,  kind: 'damage', target: 'allEnemies', power: 6,   scale: 0.35 },
  firebreath:{ name: 'Fire Breath', mp: 6, kind: 'damage', target: 'allEnemies', power: 10, scale: 0.32, element: 'fire' },
  // attacks that hurt AND may leave an ailment behind:  inflict = which one,  chance = how often (0.5 = half the time)
  venomspit:  { name: 'Venom Spit',  mp: 4, kind: 'damage', target: 'enemy',      power: 6, scale: 0.45, inflict: 'poison',  chance: 0.7 },
  toxiccloud: { name: 'Toxic Cloud', mp: 7, kind: 'damage', target: 'allEnemies', power: 4, scale: 0.3,  inflict: 'poison',  chance: 0.5 },
  shriek:     { name: 'Shriek',      mp: 6, kind: 'damage', target: 'allEnemies', power: 5, scale: 0.3,  inflict: 'silence', chance: 0.4, element: 'wind' },
  mindspike:  { name: 'Mind Spike',  mp: 5, kind: 'damage', target: 'enemy',      power: 8, scale: 0.5,  inflict: 'silence', chance: 0.6 },
  nightmare:  { name: 'Nightmare',   mp: 6, kind: 'damage', target: 'enemy',      power: 8, scale: 0.5,  inflict: 'sleep',   chance: 0.5 },
};
// STATUS EFFECTS (they wear off when the battle ends)
//   poison  - lose some HP at the end of every round          cure: Antidote, Remedy, Purify
//   sleep   - cannot act for a few rounds; a physical hit wakes you   cure: Smelling Salts, Remedy, Purify
//   silence - cannot cast Spells for a few rounds (Abilities still work)             cure: Echo Herb, Remedy, Purify
const POISON_DAMAGE = 0.08;        // share of max HP lost per round (bosses: a third of that)
const SLEEP_ROUNDS = 2, SILENCE_ROUNDS = 3, REGEN_ROUNDS = 4, REGEN_AMOUNT = 0.12, DEBUFF_AMOUNT = 0.7;
const ELEMENT_WEAK = 1.5, ELEMENT_RESIST = 0.5;

// Guard Up (DEF), Power Up (STR) and Barrier (INT) add +50% each time they are cast,
// up to 3 times (+150%), until the battle ends.
const BUFF_STEP = 0.5, BUFF_MAX = 3;

// ---------------------------------------------------------------------
// EQUIPMENT  (index 0 is what you start with; swords > bows > staves)
// Greenvale sells tiers 1-3, Sunreach 3-5, Starfall 5-7, Port Coral 7-9 (see main.js).
// Tier 8 only comes from the chest at the top of the tower, tier 10 from the volcano's last chest,
// tiers 11-14 only from chests in New Game+.
// ---------------------------------------------------------------------
const WEAPONS = {
  sword: [{ name: 'Wooden Sword', atk: 3 },  { name: 'Iron Sword', atk: 8, price: 60 },
          { name: 'Steel Sword', atk: 16, price: 250 }, { name: 'Knight Sword', atk: 28, price: 900 },
          { name: 'Mythril Sword', atk: 42, price: 2200 }, { name: 'Dragon Blade', atk: 60, price: 5000 },
          { name: 'Rune Blade', atk: 80, price: 6000 },    { name: "Hero's Sword", atk: 100, price: 10000 },
          { name: 'Excalibur', atk: 125, price: 20000 },
          { name: 'Orichalcum Blade', atk: 150, price: 30000 }, { name: 'Ragnarok', atk: 185, price: 60000 },
          // tiers 11-14: only in New Game+ chests (see NG_PLUS_CHEST_GEAR)
          { name: 'Sunsteel Blade', atk: 220, price: 100000 },  { name: 'Starforged Blade', atk: 260, price: 150000 },
          { name: 'Eclipse Blade', atk: 305, price: 250000 },   { name: 'Blade of Legend', atk: 360, price: 400000 }],
  bow:   [{ name: 'Short Bow', atk: 2 },     { name: 'Hunter Bow', atk: 6, price: 50 },
          { name: 'Long Bow', atk: 12, price: 220 },    { name: 'Elven Bow', atk: 22, price: 800 },
          { name: 'Mythril Bow', atk: 33, price: 2000 },   { name: 'Storm Bow', atk: 48, price: 4500 },
          { name: 'Rune Bow', atk: 64, price: 5500 },      { name: 'Gale Bow', atk: 82, price: 9500 },
          { name: 'Artemis Bow', atk: 104, price: 20000 },
          { name: 'Orichalcum Bow', atk: 126, price: 28000 },   { name: 'Sunstrike', atk: 156, price: 60000 },
          { name: 'Sunsteel Bow', atk: 186, price: 100000 },    { name: 'Starforged Bow', atk: 220, price: 150000 },
          { name: 'Eclipse Bow', atk: 258, price: 250000 },     { name: 'Bow of Legend', atk: 305, price: 400000 }],
  staff: [{ name: 'Oak Staff', atk: 1 },     { name: 'Ash Staff', atk: 4, price: 40 },
          { name: 'Mage Staff', atk: 8, price: 200 },   { name: 'Sage Staff', atk: 15, price: 700 },
          { name: 'Mythril Rod', atk: 23, price: 1800 },   { name: 'Archmage Staff', atk: 34, price: 4000 },
          { name: 'Rune Staff', atk: 46, price: 5000 },    { name: 'Star Staff', atk: 60, price: 9000 },
          { name: 'Staff of Ages', atk: 78, price: 20000 },
          { name: 'Orichalcum Rod', atk: 96, price: 26000 },    { name: 'Worldtree Staff', atk: 120, price: 60000 },
          { name: 'Sunsteel Rod', atk: 144, price: 100000 },    { name: 'Starforged Rod', atk: 170, price: 150000 },
          { name: 'Eclipse Rod', atk: 200, price: 250000 },     { name: 'Staff of Legend', atk: 236, price: 400000 }],
};
const ARMORS = [
  { name: 'Clothes', def: 0 },
  { name: 'Leather Armor', def: 4, price: 40 },
  { name: 'Chain Mail', def: 10, price: 180 },
  { name: 'Plate Armor', def: 18, price: 600 },
  { name: 'Mythril Mail', def: 28, price: 1500 },
  { name: 'Dragon Plate', def: 40, price: 3500 },
  { name: 'Rune Mail', def: 54, price: 4500 },
  { name: "Hero's Armor", def: 70, price: 8500 },
  { name: 'Aegis Plate', def: 90, price: 20000 },
  { name: 'Orichalcum Mail', def: 112, price: 26000 },
  { name: 'Celestial Armor', def: 140, price: 60000 },
  // tiers 11-14: only in New Game+ chests (see NG_PLUS_CHEST_GEAR)
  { name: 'Sunsteel Mail', def: 168, price: 100000 },
  { name: 'Starforged Mail', def: 200, price: 150000 },
  { name: 'Eclipse Mail', def: 236, price: 250000 },
  { name: 'Armor of Legend', def: 280, price: 400000 },
];
const ITEMS = {
  potion:   { name: 'Potion',       price: 20,  desc: 'HP +40',  hp: 40 },
  hipotion: { name: 'Hi-Potion',    price: 120,  desc: 'HP +120', hp: 120 },
  ether:    { name: 'Ether',        price: 60,  desc: 'MP +20',  mp: 20 },
  hiether:  { name: 'Hi-Ether',     price: 300, desc: 'MP +60',  mp: 60 },
  elixir:   { name: 'Elixir',       price: 1200, desc: 'Full HP and MP', hp: 9999, mp: 9999 },   // (9999: tower points can lift HP past 999)
  revive:   { name: 'Phoenix Leaf', price: 100,  desc: 'Revives', revive: true },
  // cures for status effects (only useful in battle, because effects end with the battle)
  // antidote: { name: 'Antidote',       price: 30,  desc: 'Cures poison',     cure: ['poison'] },
 //  salts:    { name: 'Smelling Salts', price: 50,  desc: 'Wakes a sleeper',  cure: ['sleep'] },
 //  echoherb: { name: 'Echo Herb',      price: 50,  desc: 'Cures silence',    cure: ['silence'] },
  remedy:   { name: 'Remedy',         price: 200, desc: 'Cures everything', cure: ['poison', 'sleep', 'silence'] },
  // not used on a hero and not usable in battle: for the next "ward" steps, far fewer monsters attack
  ward:     { name: 'Ward Charm',   price: 80,  desc: 'Fewer battles', ward: 100 },
};

// ---------------------------------------------------------------------
// ENEMIES
// Every enemy uses the same LVL 1 -> LVL 99 curve below (it keeps climbing past 99 in New Game+), multiplied by its
// own numbers (a Slime has 0.6x the HP of the curve, and so on).
// Enemy level follows the party's average level.
// ---------------------------------------------------------------------
const ENEMY_BASE = { hp: 14, mp: 10, str: 12, def: 4, int: 4, mag: 8 };
const ENEMY_MAX  = { hp: 255, mp: 120, str: 230, def: 200, int: 200, mag: 220 };
const ENEMIES = {
  slime:  { name: 'Slime',  sprite: 'slime',  hp: 0.6, str: 0.7, def: 0.6, int: 0.5, mag: 0.5, exp: 4,  gold: 3 },
  bat:    { name: 'Bat',    sprite: 'bat',    hp: 0.5, str: 0.9, def: 0.4, int: 0.6, mag: 0.5, exp: 5,  gold: 4 },
  wolf:   { name: 'Wolf',   sprite: 'wolf',   hp: 0.9, str: 1.1, def: 0.7, int: 0.5, mag: 0.5, exp: 7,  gold: 5 },
  goblin: { name: 'Goblin', sprite: 'goblin', hp: 1.0, str: 1.0, def: 1.0, int: 0.8, mag: 0.5, exp: 8,  gold: 8 },
  imp:    { name: 'Imp',    sprite: 'imp',    hp: 0.7, str: 0.6, def: 0.8, int: 1.2, mag: 1.1, exp: 10, gold: 10, spell: 'ember' },
  // --- the cave ---
  skeleton: { name: 'Skeleton',    sprite: 'skeleton', hp: 1.1, str: 1.2, def: 1.0, int: 0.6, mag: 0.5, exp: 13, gold: 12 },
  spider:   { name: 'Cave Spider', sprite: 'spider',   hp: 0.9, str: 1.3, def: 0.8, int: 0.5, mag: 0.5, exp: 12, gold: 9 },
  ghost:    { name: 'Ghost',       sprite: 'ghost',    hp: 0.8, str: 0.7, def: 1.3, int: 1.4, mag: 1.2, exp: 15, gold: 14, spell: 'chill' },
  vampbat:  { name: 'Vampire Bat', sprite: 'vampbat',  hp: 0.8, str: 1.2, def: 0.7, int: 0.7, mag: 0.5, exp: 11, gold: 10 },
  ooze:     { name: 'Ooze',        sprite: 'ooze',     hp: 1.4, str: 0.9, def: 1.2, int: 0.8, mag: 0.5, exp: 13, gold: 11 },
  // --- the boss (big: true draws him larger) ---
  cavelord: { name: 'Cave Lord',   sprite: 'boss', big: true, hp: 8, mp: 5, str: 1.6, def: 1.2, int: 1.2, mag: 1.3, exp: 80, gold: 150, spell: 'darkwave' },
  // --- the southern land ---
  direwolf: { name: 'Dire Wolf',   sprite: 'direwolf', hp: 1.2, str: 1.4, def: 0.9, int: 0.6, mag: 0.5, exp: 14, gold: 12 },
  orc:      { name: 'Orc',         sprite: 'orc',      hp: 1.4, str: 1.3, def: 1.2, int: 0.7, mag: 0.5, exp: 16, gold: 16 },
  wisp:     { name: 'Wisp',        sprite: 'wisp',     hp: 0.8, str: 0.6, def: 1.0, int: 1.3, mag: 1.3, exp: 15, gold: 15, spell: 'ember' },
  // --- the desert ---
  scorpion:  { name: 'Scorpion',   sprite: 'scorpion',  hp: 1.3, str: 1.5, def: 1.2, int: 0.6, mag: 0.5, exp: 18, gold: 16 },
  vulture:   { name: 'Vulture',    sprite: 'vulture',   hp: 1.0, str: 1.4, def: 0.8, int: 0.7, mag: 0.5, exp: 16, gold: 14 },
  sandslime: { name: 'Sand Slime', sprite: 'sandslime', hp: 1.6, str: 1.1, def: 1.3, int: 0.8, mag: 0.5, exp: 17, gold: 15 },
  mummy:     { name: 'Mummy',      sprite: 'mummy',     hp: 1.5, str: 1.4, def: 1.1, int: 0.8, mag: 0.5, exp: 19, gold: 18 },
  // --- the crypt ---
  wraith:      { name: 'Wraith',       sprite: 'wraith',      hp: 1.1, str: 0.9, def: 1.4, int: 1.5, mag: 1.4, exp: 22, gold: 20, spell: 'chill' },
  scarab:      { name: 'Scarab',       sprite: 'scarab',      hp: 1.2, str: 1.6, def: 1.4, int: 0.7, mag: 0.5, exp: 20, gold: 18 },
  boneknight:  { name: 'Bone Knight',  sprite: 'boneknight',  hp: 1.6, str: 1.6, def: 1.5, int: 0.8, mag: 0.5, exp: 24, gold: 22 },
  cursedflame: { name: 'Cursed Flame', sprite: 'cursedflame', hp: 0.9, str: 0.7, def: 1.1, int: 1.4, mag: 1.6, exp: 21, gold: 20, spell: 'ember' },
  tombking:    { name: 'Tomb King',    sprite: 'tombking', big: true, hp: 10, mp: 6, str: 1.7, def: 1.3, int: 1.4, mag: 1.5, exp: 150, gold: 400, spell: 'darkwave' },
  // --- the far south ---
  ogre:       { name: 'Ogre',        sprite: 'ogre',       hp: 1.8, str: 1.7, def: 1.3, int: 0.6, mag: 0.5, exp: 24, gold: 24 },
  wyvern:     { name: 'Wyvern',      sprite: 'wyvern',     hp: 1.3, str: 1.6, def: 1.1, int: 0.9, mag: 0.5, exp: 22, gold: 20 },
  darkknight: { name: 'Dark Knight', sprite: 'darkknight', hp: 1.6, str: 1.8, def: 1.6, int: 0.9, mag: 0.5, exp: 26, gold: 26 },
  // --- the tower ---
  gargoyle:  { name: 'Gargoyle',   sprite: 'gargoyle',  hp: 1.3, str: 1.5, def: 1.5, int: 0.9, mag: 0.5, exp: 22, gold: 20 },
  golem:     { name: 'Golem',      sprite: 'golem',     hp: 2.0, str: 1.6, def: 1.8, int: 0.6, mag: 0.5, exp: 26, gold: 24 },
  specter:   { name: 'Specter',    sprite: 'specter',   hp: 1.2, str: 1.0, def: 1.5, int: 1.6, mag: 1.5, exp: 24, gold: 22, spell: 'chill' },
  fiend:     { name: 'Fiend',      sprite: 'fiend',     hp: 1.5, str: 1.5, def: 1.3, int: 1.1, mag: 1.4, exp: 25, gold: 24, spell: 'ember' },
  archfiend: { name: 'Archfiend',  sprite: 'archfiend', hp: 1.9, str: 1.8, def: 1.5, int: 1.3, mag: 1.6, exp: 32, gold: 32, spell: 'darkwave' },
  drake:     { name: 'Drake',      sprite: 'drake',     hp: 2.0, str: 1.9, def: 1.6, int: 1.0, mag: 0.5, exp: 34, gold: 34 },
  // --- the sea (only met while sailing) ---
  seaserpent: { name: 'Sea Serpent', sprite: 'seaserpent', hp: 1.8, str: 1.7, def: 1.4, int: 1.2, mag: 1.3, exp: 30, gold: 30, spell: 'chill' },
  jellyfish:  { name: 'Jellyfish',   sprite: 'jellyfish',  hp: 1.2, str: 1.2, def: 1.2, int: 1.5, mag: 1.5, exp: 26, gold: 24, spell: 'chill' },
  kraken:     { name: 'Kraken',      sprite: 'kraken',     hp: 2.2, str: 1.9, def: 1.5, int: 1.0, mag: 0.5, exp: 34, gold: 36 },
  seahawk:    { name: 'Sea Hawk',    sprite: 'seahawk',    hp: 1.3, str: 1.7, def: 1.1, int: 0.9, mag: 0.5, exp: 26, gold: 24 },
  // --- Coral Isle ---
  treant:    { name: 'Treant',     sprite: 'treant',    hp: 2.2, str: 1.7, def: 1.8, int: 0.8, mag: 0.5, exp: 32, gold: 30 },
  harpy:     { name: 'Harpy',      sprite: 'harpy',     hp: 1.4, str: 1.8, def: 1.2, int: 1.0, mag: 0.5, exp: 28, gold: 28 },
  lizardman: { name: 'Lizardman',  sprite: 'lizardman', hp: 1.8, str: 1.9, def: 1.6, int: 0.9, mag: 0.5, exp: 32, gold: 32 },
  // --- Frost Isle ---
  icewolf:   { name: 'Ice Wolf',   sprite: 'icewolf',   hp: 1.6, str: 2.0, def: 1.3, int: 0.9, mag: 0.5, exp: 32, gold: 30 },
  yeti:      { name: 'Yeti',       sprite: 'yeti',      hp: 2.4, str: 2.0, def: 1.6, int: 0.8, mag: 0.5, exp: 36, gold: 34 },
  frostwisp: { name: 'Frost Wisp', sprite: 'frostwisp', hp: 1.1, str: 0.8, def: 1.3, int: 1.6, mag: 1.7, exp: 32, gold: 32, spell: 'chill' },
  // --- the volcano ---
  firebat:     { name: 'Fire Bat',     sprite: 'firebat',     hp: 1.4, str: 1.9, def: 1.2, int: 1.0, mag: 0.5, exp: 30, gold: 30 },
  salamander:  { name: 'Salamander',   sprite: 'salamander',  hp: 2.0, str: 2.0, def: 1.6, int: 1.1, mag: 0.5, exp: 36, gold: 36 },
  magmaslime:  { name: 'Magma Slime',  sprite: 'magmaslime',  hp: 2.0, str: 1.5, def: 1.8, int: 1.0, mag: 0.5, exp: 32, gold: 32 },
  lavagolem:   { name: 'Lava Golem',   sprite: 'lavagolem',   hp: 2.6, str: 2.1, def: 2.2, int: 0.8, mag: 0.5, exp: 40, gold: 40 },
  flamespirit: { name: 'Flame Spirit', sprite: 'flamespirit', hp: 1.2, str: 0.9, def: 1.4, int: 1.6, mag: 1.8, exp: 36, gold: 36, spell: 'ember' },
  hellhound:   { name: 'Hellhound',    sprite: 'hellhound',   hp: 1.7, str: 2.2, def: 1.4, int: 0.9, mag: 0.5, exp: 36, gold: 34 },
  magmalord:   { name: 'Magma Lord',   sprite: 'magmalord', big: true, hp: 26, mp: 14, str: 2.0, def: 1.7, int: 1.6, mag: 1.9, exp: 450, gold: 3000, spell: 'firebreath' },
  // --- the Endless Tower only (see js/tower.js). Special talents:
  //   heals: true    mends a wounded monster ("Heal > Golem")        rally: true  a war cry that raises every monster's STR
  //   charge: true   gathers power for a round, then hits everyone  shifting: true  its weakness changes every round
  //   twin: true     when its twin falls, it grows stronger          boss: true   immune to sleep and silence, no running away
  mender:    { name: 'Mender',     sprite: 'mender',    hp: 1.6, str: 1.0, def: 1.4, int: 1.8, mag: 1.8, exp: 40, gold: 40, heals: true },
  warcaller: { name: 'War Caller', sprite: 'warcaller', hp: 2.2, str: 2.0, def: 1.5, int: 0.9, mag: 0.5, exp: 42, gold: 40, rally: true },
  hexer:     { name: 'Hexer',      sprite: 'hexer',     hp: 1.5, str: 1.2, def: 1.3, int: 1.7, mag: 1.8, exp: 42, gold: 44 },
  sentinel:  { name: 'Sentinel',   sprite: 'sentinel',  hp: 3.0, str: 2.2, def: 2.6, int: 1.2, mag: 0.5, exp: 46, gold: 46 },
  mimic:     { name: 'Mimic',      sprite: 'mimic',     hp: 14, mp: 6, str: 2.3, def: 1.9, int: 1.6, mag: 1.7, exp: 300, gold: 0, boss: true, spell: 'darkwave' },
  titan:     { name: 'Storm Titan', sprite: 'titan', big: true, hp: 30, mp: 10, str: 2.1, def: 1.8, int: 1.6, mag: 1.7, exp: 500, gold: 4000, boss: true, charge: true },
  prism:     { name: 'Prism Golem', sprite: 'prism', big: true, hp: 32, mp: 14, str: 2.0, def: 2.0, int: 1.9, mag: 1.9, exp: 600, gold: 5000, boss: true, shifting: true, spell: 'darkwave' },
  suntwin:   { name: 'Sol',  sprite: 'suntwin',  hp: 18, mp: 8,  str: 2.3, def: 1.7, int: 1.4, mag: 1.2, exp: 350, gold: 3000, boss: true, twin: true },
  moontwin:  { name: 'Luna', sprite: 'moontwin', hp: 16, mp: 14, str: 1.5, def: 1.5, int: 1.9, mag: 2.0, exp: 350, gold: 3000, boss: true, twin: true },
  skydragon: { name: 'Sky Dragon', sprite: 'dragon', big: true, hp: 20, mp: 12, str: 1.8, def: 1.5, int: 1.5, mag: 1.7, exp: 300, gold: 1000, spell: 'firebreath' },
};
// WEAKNESSES and tricks: [weak to, resists, spells it can cast, chance that its attack poisons]
// (anything left out is simply "none")
const ENEMY_TRAITS = {
  slime: ['bolt'], bat: ['wind'], wolf: ['fire'], goblin: ['fire'], imp: ['ice', 'fire'],
  skeleton: ['fire'], spider: ['fire', null, ['venomspit'], 0.3], ghost: ['bolt', 'ice', ['chill', 'lullaby']], vampbat: ['wind', null, ['shriek']], ooze: ['ice', null, ['toxiccloud']],
  cavelord: ['ice', 'fire', ['darkwave', 'venomspit']],
  direwolf: ['fire'], orc: ['bolt'], wisp: ['ice', 'fire'],
  scorpion: ['ice', null, ['venomspit'], 0.35], vulture: ['wind', null, ['shriek']], sandslime: ['ice', null, ['toxiccloud']], mummy: ['fire', null, ['nightmare']],
  wraith: ['fire', 'ice', ['chill', 'mindspike']], scarab: ['wind', null, ['venomspit'], 0.25], boneknight: ['bolt'], cursedflame: ['ice', 'fire'],
  tombking: ['fire', 'ice', ['darkwave', 'nightmare', 'toxiccloud']],
  ogre: ['bolt'], wyvern: ['ice'], darkknight: ['bolt'],
  gargoyle: ['wind'], golem: ['bolt'], specter: ['fire', 'ice', ['chill', 'nightmare']], fiend: ['ice', 'fire'],
  archfiend: ['ice', 'fire', ['darkwave', 'mindspike']], drake: ['ice'], skydragon: ['ice', 'wind', ['firebreath', 'shriek']],
  seaserpent: ['bolt', 'ice'], jellyfish: ['bolt', null, ['venomspit'], 0.35], kraken: ['bolt', null, ['toxiccloud'], 0.25], seahawk: ['wind', null, ['shriek']],
  treant: ['fire', null, ['toxiccloud']], harpy: ['wind', null, ['lullaby', 'shriek']], lizardman: ['ice'],
  icewolf: ['fire', 'ice'], yeti: ['fire', 'ice'], frostwisp: ['fire', 'ice', ['chill', 'hush']],
  firebat: ['ice', 'fire', ['shriek']], salamander: ['ice', 'fire'], magmaslime: ['ice', 'fire', ['toxiccloud']], lavagolem: ['ice', 'fire'],
  flamespirit: ['ice', 'fire', ['ember', 'hush']], hellhound: ['ice', 'fire'], magmalord: ['ice', 'fire', ['firebreath', 'toxiccloud', 'mindspike']],
  mender: ['fire'], warcaller: ['bolt'], hexer: ['wind', 'ice', ['hush', 'lullaby', 'chill'], 0.3], sentinel: ['bolt'],
  mimic: ['fire', null, null, 0.3], titan: ['wind', 'bolt'], prism: [null], suntwin: ['ice', 'fire'], moontwin: ['fire', 'ice', ['chill', 'darkwave']],
};
for (const kind in ENEMY_TRAITS) {
  const [weak, resist, spells, poison] = ENEMY_TRAITS[kind];
  Object.assign(ENEMIES[kind], { weak, resist, poison });
  if (spells) ENEMIES[kind].spells = spells;
}

// which monsters appear on which terrain
const ZONES = {
  grass:  ['slime', 'slime', 'bat', 'wolf'],
  forest: ['wolf', 'goblin', 'goblin', 'imp', 'bat'],
  dungeon: ['skeleton', 'spider', 'ghost', 'vampbat', 'ooze'],
  grass2:  ['direwolf', 'direwolf', 'orc', 'wisp'],
  forest2: ['orc', 'orc', 'wisp', 'direwolf', 'spider'],
  desert:  ['scorpion', 'vulture', 'sandslime', 'mummy'],
  crypt:   ['mummy', 'wraith', 'scarab', 'boneknight', 'cursedflame'],
  grass3:  ['ogre', 'wyvern', 'darkknight', 'wyvern'],
  forest3: ['ogre', 'ogre', 'darkknight', 'wisp'],
  sea:     ['seaserpent', 'jellyfish', 'kraken', 'seahawk'],
  grass4:  ['treant', 'harpy', 'lizardman', 'harpy'],
  forest4: ['treant', 'treant', 'lizardman', 'harpy'],
  snow:    ['icewolf', 'yeti', 'frostwisp', 'icewolf'],
  volcano: ['firebat', 'salamander', 'magmaslime'],
  magma:   ['salamander', 'lavagolem', 'flamespirit', 'hellhound', 'magmaslime'],
};
// monsters in these zones are this many levels above the party
const ZONE_LEVEL_BONUS = { dungeon: 2, grass2: 1, forest2: 1, desert: 2, crypt: 3, grass3: 3, forest3: 3,
                           sea: 4, grass4: 4, forest4: 4, snow: 5, volcano: 5, magma: 6 };

// The tower has one zone per floor (tower1 ... tower10). Higher floors get
// tougher monsters and a bigger level bonus: +2 on floor 1 up to +6 on floor 10.
const TOWER_FLOORS = 10;
for (let n = 1; n <= TOWER_FLOORS; n++) {
  ZONES['tower' + n] = n <= 5 ? ['gargoyle', 'golem', 'specter', 'fiend']
                              : ['golem', 'specter', 'archfiend', 'drake', 'gargoyle'];
  ZONE_LEVEL_BONUS['tower' + n] = 1 + Math.ceil(n / 2);
}

// BOSSES: flag = what gets remembered when he is beaten, zone = battle background,
// level = at least minLvl, otherwise party level + bonus.
const BOSSES = {
  cavelord: { flag: 'boss1', zone: 'dungeon', minLvl: 8, bonus: 2,
    intro: ['CAVE LORD: Who dares walk into my hall?', 'CAVE LORD: Nobody crosses these mountains while I live!'],
    win: ['The Cave Lord crumbles to dust.', 'The rock wall to the south collapses! Daylight shines through a new passage...'] },
  tombking: { flag: 'boss2', zone: 'crypt', minLvl: 16, bonus: 3,
    intro: ['TOMB KING: A thousand years I have slept...', 'TOMB KING: ...and you wake me with your muddy boots?'],
    win: ['The Tomb King falls apart into sand.', 'The sealed door behind his throne grinds open. A warm wind blows in from the south...',
          'Somewhere near Starfall, an old boat is waiting for someone brave enough to sail it.'] },
  magmalord: { flag: 'boss4', zone: 'magma', minLvl: 40, bonus: 6,
    intro: ['The lava parts, and the MAGMA LORD rises from it.', 'MAGMA LORD: You sailed all this way to burn? So be it.'],
    win: ['The Magma Lord hardens into black stone and crumbles.', 'Behind him, a chest glows in the heat. The greatest treasure in the world is yours!'] },
  skydragon: { flag: 'boss3', zone: 'tower10', minLvl: 30, bonus: 5,
    intro: ['The SKY DRAGON uncoils and fixes its golden eyes on you.', 'SKY DRAGON: The treasure of the tower is not for the weak.'],
    win: ['The Sky Dragon bows its head and fades into the clouds.', 'The great chest it was guarding is yours!'] },
};
// Extra monster strength per round of New Game+. 0 = none: monsters already grow with your level,
// and you find no better gear the second time around. (0.5 would mean +50% HP, STR, DEF, INT, MAG.)
const ENDLESS_BOOST = 0.02;      // Endless Tower: monsters get this much stronger per floor (on top of gaining levels)
const NG_PLUS_BOOST = 0.15;
// Item shops in New Game+: every item costs its normal price (the "price" in ITEMS) times this.
// 10 = ten times dearer, 1 = same as a normal game. Weapons and armor are not affected.
const NG_PLUS_ITEM_PRICE = 10;
// What an item costs in the shops right now. Change "price" in ITEMS and New Game+ follows by itself.
const itemPrice = id => Math.round(ITEMS[id].price * (G.ngPlus > 0 ? NG_PLUS_ITEM_PRICE : 1));
// ---------------------------------------------------------------------
// CHESTS IN NEW GAME+ hold better treasure. Each chest keeps its normal contents (in maps.js)
// and these numbers upgrade them, so changing a chest in maps.js changes its New Game+ version too.
// (The Endless Tower is not affected: its chests are already made for New Game+.)
// ---------------------------------------------------------------------
const NG_PLUS_CHEST_GOLD = 10;         // gold in a chest is multiplied by this
const NG_PLUS_CHEST_ITEMS = 2;         // ...and so is the number of items
const NG_PLUS_CHEST_UPGRADE = {        // ...and the item itself becomes a better one
  potion: 'hipotion', hipotion: 'elixir', ether: 'hiether', hiether: 'elixir',
  antidote: 'remedy', salts: 'remedy', echoherb: 'remedy',
};
// Gear: a chest that held tier 5 or 6 gear now holds tier 11 of the same kind, and so on.
// Tiers 11-14 are the "Sunsteel", "Starforged", "Eclipse" and "Legend" sets at the end of WEAPONS and ARMORS.
const NG_PLUS_CHEST_GEAR = { 5: 11, 6: 11, 7: 12, 8: 12, 9: 13, 10: 14 };
// What a piece of chest treasure turns into right now (unchanged in a normal game).
function chestLoot(loot) {
  if (!(G.ngPlus > 0)) return loot;
  if (loot.gold) return { gold: Math.round(loot.gold * NG_PLUS_CHEST_GOLD) };
  if (loot.item) return { item: NG_PLUS_CHEST_UPGRADE[loot.item] || loot.item, n: Math.round(loot.n * NG_PLUS_CHEST_ITEMS) };
  if (loot.weapon) return { weapon: loot.weapon, tier: NG_PLUS_CHEST_GEAR[loot.tier] || loot.tier };
  return { armor: NG_PLUS_CHEST_GEAR[loot.armor] || loot.armor };
}
// Does this map have the upgraded chests at the moment?
const richChests = map => G.ngPlus > 0 && map.name !== 'endless';

// ---------------------------------------------------------------------
// THE ENDLESS TOWER: numbers to tune. (How it all works is in js/tower.js.)
// ---------------------------------------------------------------------
const ELEMENTS = ['fire', 'ice', 'bolt', 'wind'];
const TOWER_STAT_POINTS = floor => floor / 10;     // beating the boss of floor 10, 20, 30... adds this to EVERY stat of every hero, for ever
const TOWER_START_BOONS = start => Math.floor(start / 5);   // boons handed out when a run starts higher up (floor 11 -> 2, floor 21 -> 4)
const TOWER_TWIST_CHANCE = 0.3;        // how often an ordinary floor has a twist (a special rule)
const TOWER_MIMIC_CHANCE = 0.2;        // how often the chest of an ordinary floor is a Mimic
const TOWER_MIMIC_FROM = 4;            // no Mimics below this floor
const TOWER_MIMIC_POINTS = 1;          // every Mimic beaten adds this to EVERY stat of every hero, for ever
const TOWER_MERCHANT_EVERY = 5, TOWER_MERCHANT_AT = 3;      // a trader on floors 3, 8, 13, 18...
const TOWER_REST_PRICE = 300;          // x floor: the trader's full rest
const TOWER_BOON_PRICE = 1500;         // x floor: the trader's boon
const TITAN_BLAST = 3;                 // the Storm Titan's charged attack: this many times a normal hit, on everyone
const TITAN_BLAST_GUARD = 0.5;         // ...and a hero who Defends takes only this share of it (on top of the usual halving)
const TWIN_RAGE = 1.5;                 // when one twin falls the other's STR and MAG are multiplied by this
const RALLY_STEP = 1.25, RALLY_MAX = 1.6;   // a War Caller's cry: STR x1.25 each time, up to x1.6
const MENDER_HEAL = 0.3;               // a Mender restores this share of a monster's HP
const RICH_FLOOR = 1.25;               // "Rich pickings" twist: monsters this much stronger (EXP and gold are doubled)
// RELICS: each unique tower boss drops one the first time it falls. They work everywhere, for ever.
const RELICS = {
  titan: { name: "Titan's Heart", desc: 'Every hero starts each battle with Regen.' },
  prism: { name: 'Prism Shard',   desc: 'Hitting a weakness does double damage instead of +50%.' },
  twins: { name: 'Twin Crest',    desc: 'Once per battle, a hero who would fall holds on with 1 HP.' },
};
const hasRelic = id => !!G.tower.relics[id];
const newTower = () => ({ best: 0, checkpoint: 0, relics: {}, kills: {}, mimics: 0, mimicsPaid: 0, points: 0 });   // this save's tower progress

const WARD_FACTOR = 0.25;      // while a Ward Charm is active, battles are this much as likely (a quarter)
const ENCOUNTER_CHANCE = { '.': 0.10, 'T': 0.18, '_': 0.09, ':': 0.10, ';': 0.09, '-': 0.09,
                           '~': 0.05, '*': 0.10, 'P': 0.18, '%': 0.12, 'a': 0.09 };   // chance per step on each tile

// ---------------------------------------------------------------------
// FORMULAS
// ---------------------------------------------------------------------
// A stat at a given level: a straight line from "base" at LVL 1 to "max" at LVL 99.
// Past LVL 99 (New Game+ only) it climbs faster, so that a stat of 255 at LVL 99 reaches 999 at LVL 255.
// Heroes and monsters use the same curve, so fights stay fair at any level.
function curve(base, max, lvl) {
  if (lvl <= 99) return base + (max - base) * (lvl - 1) / 98;
  return max + max * (999 / 255 - 1) * (lvl - 99) / (255 - 99);
}

// EXP needed to go from lvl to lvl+1. Grows faster and faster.
function expToNext(lvl) { return Math.floor(18 * Math.pow(lvl, 1.9)); }

// The limits: LVL 99 and stats of 255 the first time through; LVL 255 and stats of 999 in New Game+.
const levelCap = () => G.ngPlus ? 255 : 99;
const statCap  = () => G.ngPlus ? 999 : 255;

function maxStat(hero, key) {
  const boon = G.run ? G.run.mult[key] || 1 : 1;       // Endless Tower boons raise stats for that run only
  // Levels and boons stop at the cap (255, or 999 in New Game+). The permanent points won in the
  // Endless Tower (hero.bonus) are added AFTER that, so they are the one way to go past it.
  return Math.min(statCap(), Math.round(curve(hero.cls.base[key], hero.cls.max[key], hero.lvl) * boon)) + (hero.bonus[key] || 0);
}

function makeHero(id) {
  const h = { id, cls: HERO_DEFS[id], name: HERO_DEFS[id].name, isHero: true,
              lvl: 1, exp: 0, weapon: 0, armor: 0, defending: false,
              bonus: {},                                 // permanent stat points from the Endless Tower: { str: 3, hp: 1 }
              fav: null,                                 // favorite spell or ability (the F key in battle)
              picks: {},                                 // abilities chosen at level-ups: { level: spell id }
              status: {},                                // poison / sleep / silence / regen (battle only)
              buff: { str: 0, def: 0, int: 0 } };        // how many times each stat is boosted (battle only)
  h.hp = maxStat(h, 'hp');
  h.mp = maxStat(h, 'mp');
  return h;
}

// =====================================================================
// ITEM DROPS: after a battle is won, the monsters may leave an item behind.
//   1. One roll per battle: DROP_CHANCE (0.2 = one battle in five). Bosses use BOSS_DROP_CHANCE.
//   2. If the roll succeeds, WHICH item is picked by weight: an item with weight 10 turns up ten
//      times as often as one with weight 1. Weight 0 (or leaving the item out) = never drops.
//      The weights do not have to add up to anything.
// If the party cannot carry any more of the item that was picked (MAX_ITEMS), it is simply lost:
// keeping full stacks of the common items does NOT make the rare ones turn up more often.
// =====================================================================
const DROP_CHANCE = 0.2;
const BOSS_DROP_CHANCE = 1;            // 1 = bosses always leave something
const DROP_WEIGHTS = {
  potion: 10,
  ether: 5,
  hipotion: 3,
  hiether: 2,
  revive: 2,
  remedy: 2,
  elixir: 0.2,                         // super rare: about 1 drop in 120
  ward: 0,
};
// Roll for a drop. Returns the id of the item ('potion'), or null for nothing.
function rollDrop(boss) {
  if (Math.random() >= (boss ? BOSS_DROP_CHANCE : DROP_CHANCE)) return null;
  const ids = Object.keys(DROP_WEIGHTS).filter(id => ITEMS[id] && DROP_WEIGHTS[id] > 0);
  let ticket = Math.random() * ids.reduce((sum, id) => sum + DROP_WEIGHTS[id], 0);   // draw a ticket...
  for (const id of ids) { ticket -= DROP_WEIGHTS[id]; if (ticket < 0) return id; }   // ...and see whose it is
  return null;
}

// =====================================================================
// DIFFICULTY KNOBS: change how strong EVERY monster is without touching the monsters one by one.
// 1 = as designed, 1.5 = half as much again, 0.8 = a fifth less.
//   hp       how much damage a monster can take
//   attack   its physical hits (STR)            magic    its spells (MAG)
//   defense  how well it shrugs off YOUR hits and spells (DEF and INT)
//   exp      EXP it gives (lower = slower levelling)          gold     gold it gives
// There is one set for each way of playing:
//   first  the first playthrough        plus   New Game+ (on top of NG_PLUS_BOOST per cycle)
//   tower  the Endless Tower (on top of its growth per floor)
// =====================================================================
const SCALING = {
  first: { hp: 1.5, attack: 1.2, magic: 1.2, defense: 1, exp: .8, gold: .8 },
  plus:  { hp: 1.5, attack: 1.2, magic: 1.2, defense: 1, exp: .8, gold: .8 },
  tower: { hp: 1.5, attack: 1.2, magic: 1.2, defense: 1, exp: .8, gold: .8 },
};
// DIFFICULTY: chosen when a new game starts and kept with the save. It multiplies the set above.
// (Add a line to offer another choice, e.g.  Brutal: { hp: 2, attack: 1.5, ... })
const DIFFICULTIES = {
  Normal: { hp: 1,   attack: 1,    magic: 1,    defense: 1, exp: 1, gold: 1, desc: 'The game as designed.' },
  Hard:   { hp: 1.4, attack: 1.25, magic: 1.25, defense: 1, exp: 1, gold: 1, desc: 'Monsters have 40% more HP and hit 25% harder.' },
};
// which knob belongs to which monster stat
const KNOB_OF = { hp: 'hp', str: 'attack', mag: 'magic', def: 'defense', int: 'defense' };
// the multiplier for one knob right now, e.g. scaling('hp')
function scaling(knob) {
  const set = G.run ? SCALING.tower : G.ngPlus ? SCALING.plus : SCALING.first;
  return set[knob] * (DIFFICULTIES[G.difficulty] || DIFFICULTIES.Normal)[knob];
}

function makeEnemy(kind, lvl) {
  const t = ENEMIES[kind];
  // New Game+ and the Endless Tower can make everything tougher (and pay better)
  // (the Endless Tower has its own growth per floor instead, so NG_PLUS_BOOST does not apply inside it)
  const boost = G.run ? 1 + G.run.floor * ENDLESS_BOOST : 1 + NG_PLUS_BOOST * G.ngPlus;
  const stat = k => Math.max(1, Math.round(curve(ENEMY_BASE[k], ENEMY_MAX[k], lvl) * (t[k] || 1) * (k === 'mp' ? 1 : boost * scaling(KNOB_OF[k]))));   // (see DIFFICULTY KNOBS above)
  const e = { kind, name: t.name, sprite: t.sprite, big: t.big, lvl, flash: 0,
              spells: t.spells || (t.spell ? [t.spell] : []),          // what it can cast
              status: {}, debuff: { str: 1, def: 1 },                  // battle effects on it
              weak: t.weak, resist: t.resist, turn: 0,                 // (a copy, because some tower monsters change theirs)
              hp: stat('hp'), mp: stat('mp'), str: stat('str'), def: stat('def'), int: stat('int'), mag: stat('mag'),
              exp: Math.round(t.exp * Math.pow(lvl, 1.3) * boost * scaling('exp')),
              gold: Math.round(t.gold * (1 + (lvl - 1) * 0.25) * boost * scaling('gold')) };
  e.maxhp = e.hp;
  return e;
}

// Battle stats. These work for heroes AND enemies.
const weaponOf = h => WEAPONS[h.cls.weapon][h.weapon];
const boosted = (h, key) => Math.min(statCap() + (h.bonus[key] || 0), Math.round(maxStat(h, key) * (1 + h.buff[key] * BUFF_STEP)));   // stat with buffs (same cap, plus tower points)
const atkOf = u => u.isHero ? boosted(u, 'str') + weaponOf(u).atk : Math.round(u.str * u.debuff.str);
const defOf = u => u.isHero ? boosted(u, 'def') + ARMORS[u.armor].def : Math.round(u.def * u.debuff.def);
const magOf = u => u.isHero ? maxStat(u, 'mag') : u.mag;
const intOf = u => u.isHero ? boosted(u, 'int') : u.int;
const maxHpOf = u => u.isHero ? maxStat(u, 'hp') : u.maxhp;

function physDamage(attacker, target) {
  let dmg = (atkOf(attacker) / 2 - defOf(target) / 4) * rnd(0.85, 1.15);
  if (target.defending) dmg /= 2;
  return Math.max(1, Math.round(dmg));
}
// the strength of a spell before luck and before the target's resistance
function spellBase(spell, caster) {
  const stat = spell.uses === 'str' ? atkOf(caster) : magOf(caster);    // sword skills use attack power
  return spell.power + stat * spell.scale;
}
function spellAmount(spell, caster) {
  return Math.round(spellBase(spell, caster) * rnd(0.9, 1.1));
}
function spellDamage(spell, caster, target) {
  const resist = spell.uses === 'str' ? defOf(target) : intOf(target);  // DEF blocks skills, INT blocks magic
  const guard = target.defending ? 0.5 : 1;                             // Defend halves spells and skills, like plain attacks
  return Math.max(1, Math.round((spellAmount(spell, caster) - Math.floor(resist / 4)) * elementFactor(spell, target) * guard));
}
// 1.5 if the target is weak to the spell's element, 0.5 if it resists it, otherwise 1
function elementFactor(spell, target) {
  if (!spell.element || target.isHero) return 1;
  if (target.weak === spell.element) return hasRelic('prism') ? 2 : ELEMENT_WEAK;
  return target.resist === spell.element || target.resist === 'all' ? ELEMENT_RESIST : 1;   // 'all' = everything but its weakness
}
// Is this fighter a boss? (bosses shrug off sleep and silence)
const isBoss = u => !u.isHero && (!!BOSSES[u.kind] || !!ENEMIES[u.kind].boss);
function healUnit(u, amount) {            // returns how much was really healed
  const before = u.hp;
  u.hp = Math.min(maxHpOf(u), u.hp + amount);
  return u.hp - before;
}

// Half the shop price back when old gear is traded in (starting gear is worth nothing).
const sellValue = gear => Math.floor((gear.price || 0) / 2);

// THE BAG: spare weapons and armor. It has four pockets: sword, bow, staff and armor.
// G.bag.sword[5] = 2 means "two tier-5 swords".
const newBag = () => ({ sword: {}, bow: {}, staff: {}, armor: {} });
const gearList = pocket => pocket === 'armor' ? ARMORS : WEAPONS[pocket];
function addToBag(pocket, tier) {
  if (tier > 0) G.bag[pocket][tier] = (G.bag[pocket][tier] || 0) + 1;     // starting gear (tier 0) is not worth keeping
}
function takeFromBag(pocket, tier) {
  if (--G.bag[pocket][tier] <= 0) delete G.bag[pocket][tier];
}
// Put a weapon or armor on a hero (kind = 'weapon' or 'armor'). What they had before goes into the bag.
function equipGear(hero, kind, tier) {
  addToBag(kind === 'weapon' ? hero.cls.weapon : 'armor', hero[kind]);
  hero[kind] = tier;
}

// One line of help text for a spell, shown at the bottom of the screen.
// The number is what THIS caster would do before the target's resistance.
const BUFF_LABEL = { str: 'attack (STR)', def: 'defence (DEF)', int: 'magic defence (INT)' };
function describeSpell(spell, caster) {
  const amount = Math.min(999, Math.round(spellBase(spell, caster)));
  const who = spell.target === 'allEnemies' ? 'ALL enemies' : 'one enemy';
  if (spell.hits) return `${spell.hits} arrows at random enemies, about ${amount} damage each.`;
  if (spell.kind === 'damage') return `About ${amount} ${spell.element ? spell.element + ' ' : ''}damage to ${who}.` + (spell.inflict ? ' May poison.' : '');
  if (spell.kind === 'status') return `${spell.status === 'sleep' ? 'Puts' : 'Silences'} ${who}${spell.status === 'sleep' ? ' to sleep' : ''} (${Math.round(spell.chance * 100)}% chance).`;
  if (spell.kind === 'cure') return `Cures poison, sleep and silence for ${spell.target === 'party' ? 'the whole party' : 'one ally'}.`;
  if (spell.kind === 'regen') return `${spell.target === 'party' ? 'The whole party' : 'One ally'} recovers HP every round for ${spell.rounds || REGEN_ROUNDS} rounds.`;
  if (spell.kind === 'debuff') return `Lowers one enemy's ${spell.stat.toUpperCase()} by 30% for the whole battle.`;
  if (spell.kind === 'selfbuff') return `Raises ${caster.name}'s own ${BUFF_LABEL[spell.stat]} to the maximum.`;
  if (spell.kind === 'taunt') return `Enemies aim at ${caster.name} this round and the next.`;
  if (spell.kind === 'osmose') return 'Steals MP from one enemy. Costs nothing.';
  if (spell.kind === 'healself') return `${caster.name} recovers half of his own HP.`;
  if (spell.kind === 'revive' && spell.target === 'party') return 'Brings every fallen ally back with half their HP.';
  if (spell.kind === 'heal') return `Restores about ${Math.min(statCap(), amount)} HP to ${spell.target === 'party' ? 'the whole party' : 'one ally'}.`;
  if (spell.kind === 'buff') return `Party ${BUFF_LABEL[spell.stat]} +50% per cast, max ${BUFF_MAX} casts.`;
  if (spell.kind === 'revive') return 'Brings a fallen ally back with half their HP.';
  if (spell.kind === 'warp') return 'Battle: escape. Dungeon: leave it. Outside: travel to a town.';
  return '';
}

// One line of help text for an item (shown at the bottom of the screen, like spells).
function describeItem(id) {
  const it = ITEMS[id];
  if (it.ward) return `${it.desc} for the next ${it.ward} steps. Not usable in battle.`;
  if (it.revive) return 'Brings a fallen ally back with a quarter of their HP.';
  if (it.cure) return `${it.desc} for one ally. Only needed in battle.`;
  if (it.hp && it.mp) return 'Restores all HP and MP to one ally.';
  if (it.hp) return `Restores ${it.hp} HP to one ally.`;
  return `Restores ${it.mp} MP to one ally.`;
}

const SORT_BY_MP = true;        // false = list spells and abilities in the order they were learned
function knownSpells(hero) {
  const list = hero.cls.spells.filter(([lvl]) => lvl <= hero.lvl).map(([, id]) => id);
  list.push(...Object.values(hero.picks));             // plus the abilities chosen at level-ups
  // cheapest first, most expensive last - whenever it was learned (same cost: the one learned first comes first)
  if (SORT_BY_MP) list.sort((a, b) => SPELLS[a].mp - SPELLS[b].mp);
  if (list.includes('warp')) { list.splice(list.indexOf('warp'), 1); list.push('warp'); }   // Warp always sits at the bottom
  return list;
}
// SPELLS or ABILITIES?  Everything lives in the SPELLS table, but the menus show two lists:
//   Spells    - magic: attack spells, healing, cures, Warp (Silence blocks these)
//   Abilities - weapon skills, boosts, songs and tricks  (Silence does NOT block these)
// To move one across, add  ability: true  or  ability: false  to its line in SPELLS.
const ABILITY_KINDS = ['buff', 'selfbuff', 'taunt', 'healself', 'debuff', 'status'];
function isAbility(spell) {
  if (spell.ability !== undefined) return spell.ability;
  if (spell.kind === 'damage') return spell.uses === 'str';      // sword and bow skills hit with STR
  return ABILITY_KINDS.includes(spell.kind);
}
const knownAbilities = hero => knownSpells(hero).filter(id => isAbility(SPELLS[id]));
const knownMagic = hero => knownSpells(hero).filter(id => !isAbility(SPELLS[id]));

// Level-up choices this hero has reached but not made yet: [[level, optionA, optionB], ...]
function pendingChoices(hero) {
  return hero.cls.choices.filter(([lvl]) => lvl <= hero.lvl && !hero.picks[lvl]);
}

// Give EXP to a hero. Returns a list of messages (level ups, new spells).
function gainExp(hero, amount) {
  const msgs = [];
  if (hero.lvl >= levelCap()) return msgs;
  hero.exp += amount;
  while (hero.lvl < levelCap() && hero.exp >= expToNext(hero.lvl)) {
    hero.exp -= expToNext(hero.lvl);
    const oldHp = maxStat(hero, 'hp'), oldMp = maxStat(hero, 'mp');
    hero.lvl++;
    hero.hp += maxStat(hero, 'hp') - oldHp;
    hero.mp += maxStat(hero, 'mp') - oldMp;
    let m = `${hero.name} reached LVL ${hero.lvl}!`;
    for (const [lvl, id] of hero.cls.spells) if (lvl === hero.lvl) m += ` Learned ${SPELLS[id].name}!`;
    msgs.push(m);
  }
  if (hero.lvl >= levelCap()) hero.exp = 0;
  return msgs;
}

// ---------------------------------------------------------------------
// GAME STATE  (everything that would go in a save file)
// ---------------------------------------------------------------------
const G = {};
function resetGame() {                 // a brand new game starts with this
  G.party = [makeHero('arturos'), makeHero('sorutra'), makeHero('rayen')];
  G.gold = 50;
  G.items = {};
  for (const id in ITEMS) G.items[id] = 0;
  G.items.potion = 3; G.items.ether = 1;
  G.bag = newBag();      // spare weapons and armor
  G.ngPlus = 0;          // how many times the game has been finished and started over (New Game+)
  G.difficulty = 'Normal';   // chosen at NEW GAME (see DIFFICULTIES)
  G.run = null;          // the Endless Tower run in progress, if any (see tower.js)
  G.tower = newTower();  // Endless Tower progress that is kept: best floor, checkpoint, relics, bosses beaten
  G.slot = null;         // which save slot this game was last saved to or loaded from
  G.seen = null;         // which world-map tiles we have laid eyes on (for the Tab map); made in main.js
  G.flags = {};          // things that happened: boss beaten, chests opened, last town visited
}
resetGame();
const aliveHeroes = () => G.party.filter(h => h.hp > 0);
const avgLevel = () => Math.round(G.party.reduce((s, h) => s + h.lvl, 0) / G.party.length);
function fullHeal() { for (const h of G.party) { h.hp = maxStat(h, 'hp'); h.mp = maxStat(h, 'mp'); } }

// GETTING ITEMS (chests, battle drops, tower rewards): put n of an item into the pack.
// What does not fit (MAX_ITEMS) is not thrown away at once: each spare one is used on the spot
// on the hero who needs it most. Only if nobody needs it is it left behind.
// Returns { kept: how many went into the pack, used: [messages], lost: how many were left behind }.
function gainItem(id, n = 1) {
  const kept = Math.min(n, Math.max(0, MAX_ITEMS - G.items[id]));
  G.items[id] += kept;
  const used = [];
  let lost = 0;
  for (let i = kept; i < n; i++) {
    const hero = neediestHero(id);
    G.items[id]++;                                    // (useItem takes it out of the pack again when it works)
    const msg = hero ? useItem(id, hero) : null;
    if (msg) used.push(msg); else { G.items[id]--; lost++; }
  }
  return { kept, used, lost };
}
// Who should get a spare item? A fallen hero for a Phoenix Leaf; otherwise the living hero who is
// missing the biggest share of what the item restores. null = nobody needs it (or it is not that kind of item).
function neediestHero(id) {
  const it = ITEMS[id];
  if (it.revive) return G.party.find(h => h.hp <= 0) || null;
  if (!it.hp && !it.mp) return null;                  // Remedies and Ward Charms are never used this way
  const missing = h => (it.hp ? 1 - h.hp / maxStat(h, 'hp') : 0) + (it.mp ? 1 - h.mp / maxStat(h, 'mp') : 0);
  const needy = aliveHeroes().filter(h => missing(h) > 0).sort((a, b) => missing(b) - missing(a));
  return needy[0] || null;
}
// The sentence that tells the player what happened to the spare ones ('' when everything fitted).
function spareItemText(got) {
  let text = '';
  if (got.used.length) text += ` There's no room, so ${got.used.length === 1 ? 'it is' : 'they are'} used at once: ${got.used.join(' ')}`;
//  if (got.lost) text += ` ${got.lost === 1 ? 'One' : got.lost} had to be left behind (you can only carry ${MAX_ITEMS}).`;
  return text;
}

// Use an item on a hero. Returns a message, or null if it would do nothing
// (in that case the item is NOT used up).
function useItem(id, hero) {
  let msg = null;
  const it = ITEMS[id];
  const needsHp = it.hp && hero.hp < maxStat(hero, 'hp'), needsMp = it.mp && hero.mp < maxStat(hero, 'mp');
  if (hero.hp > 0 && (needsHp || needsMp)) {
    const parts = [];                                 // an Elixir restores both
    if (needsHp) parts.push(`${healUnit(hero, it.hp)} HP`);
    if (needsMp) {
      const before = hero.mp;
      hero.mp = Math.min(maxStat(hero, 'mp'), hero.mp + it.mp);
      parts.push(`${hero.mp - before} MP`);
    }
    msg = `${hero.name} recovers ${parts.join(' and ')}.`;
  } else if (it.revive && hero.hp <= 0) {
    hero.hp = Math.ceil(maxStat(hero, 'hp') / 4);
    msg = `${hero.name} is back on their feet!`;
  } else if (it.cure && hero.hp > 0 && it.cure.some(effect => hero.status[effect])) {
    for (const effect of it.cure) delete hero.status[effect];
    msg = `${hero.name} is cured.`;
  }
  if (msg) G.items[id]--;
  return msg;
}

// Cast a healing spell on a list of heroes (used in battle and from the menu).
function castHeal(caster, spell, targets) {
  caster.mp -= spell.mp;
  let out = '';
  if (spell.kind === 'revive' && spell.target === 'party') {      // Mass Raise: everyone who has fallen
    targets = G.party.filter(h => h.hp <= 0);
    if (!targets.length) return 'But nobody has fallen.';
  }
  for (const t of targets) {
    if (spell.kind === 'revive') {                    // Raise: only works on the fallen
      if (t.hp > 0) out += ` No effect on ${t.name}.`;
      else { t.hp = Math.ceil(maxStat(t, 'hp') / 2); out += ` ${t.name} is back on their feet!`; }
    }
    else if (t.hp <= 0) out += ` No effect on ${t.name}.`;
    else out += ` ${t.name} recovers ${healUnit(t, spellAmount(spell, caster))} HP.`;
  }
  return out.trim();
}
