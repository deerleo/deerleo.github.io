// =====================================================================
// save.js  -  Saving and loading.
// There are three save slots. Each one is stored by the browser itself
// ("localStorage") as one piece of text. It stays there when you close
// the tab or the browser.
// =====================================================================

const SAVE_SLOTS = 3;
const LAST_SLOT_KEY = 'minirpg-last-slot';          // which slot was saved or loaded last (for CONTINUE on the title screen)
const slotKey = slot => 'minirpg-save-' + slot;       // slot 1 is 'minirpg-save-1', the key older versions used

function saveGame(slot) {
  const data = {
    gold: G.gold,
    items: G.items,
    flags: G.flags,
    bag: G.bag,
    ngPlus: G.ngPlus,
    difficulty: G.difficulty,
    tower: G.tower,
    savedAt: Date.now(),                            // when this save was made
    seen: Array.from(seenTiles()).join(''),         // the explored part of the world map, as a string of 0s and 1s
    // only the things that change; everything else is rebuilt from data.js
    party: G.party.map(h => ({ id: h.id, lvl: h.lvl, exp: h.exp, hp: h.hp, mp: h.mp, weapon: h.weapon, armor: h.armor, picks: h.picks, fav: h.fav, bonus: h.bonus })),
    player: { map: player.map, x: player.x, y: player.y, dir: player.dir, onBoat: player.onBoat },
  };
  try { localStorage.setItem(slotKey(slot), JSON.stringify(data)); G.slot = slot; rememberSlot(slot); return true; }
  catch (e) { return false; }                       // storage blocked or full
}

function rememberSlot(slot) {
  try { localStorage.setItem(LAST_SLOT_KEY, slot); } catch (e) { /* storage blocked: CONTINUE just guesses */ }
}
// The slot CONTINUE loads: the game you saved or loaded last. (0 = there is no saved game.)
// If that was never noted down (saves from older versions), take the newest save.
function lastSlot() {
  let last = 0;
  try { last = Number(localStorage.getItem(LAST_SLOT_KEY)); } catch (e) { }
  if (last >= 1 && last <= SAVE_SLOTS && readSlot(last)) return last;
  let best = 0, bestTime = -1;
  for (let slot = 1; slot <= SAVE_SLOTS; slot++) {
    const data = readSlot(slot);
    if (data && (data.savedAt || 0) > bestTime) { best = slot; bestTime = data.savedAt || 0; }
  }
  return best;
}

// RECORDS: the best Endless Tower results ever reached on this computer. They are kept apart from
// the save slots, so they stay even when a save is overwritten or a new game is started.
const RECORDS_KEY = 'minirpg-records';
function readRecords() {
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(RECORDS_KEY)); } catch (e) { }
  return Object.assign({ best: 0, bosses: 0, mimics: 0 }, saved);
}
function noteRecord(change) {                       // change(records) alters them; then they are stored
  const records = readRecords();
  change(records);
  try { localStorage.setItem(RECORDS_KEY, JSON.stringify(records)); } catch (e) { /* storage blocked: no records */ }
}

function readSlot(slot) {                           // the saved data of a slot, or null if it is empty
  try { return JSON.parse(localStorage.getItem(slotKey(slot))); }
  catch (e) { return null; }
}
function hasSave() {                                // is there a save in any slot?
  for (let slot = 1; slot <= SAVE_SLOTS; slot++) if (readSlot(slot)) return true;
  return false;
}
// A one-line description of a slot for the menus, e.g. "LVL 42  Sunreach  NG+1"
function slotSummary(slot) {
  const data = readSlot(slot);
  if (!data) return 'empty';
  const map = MAPS[data.player.map] || {};
  const place = map.title || (map.place ? map.place.split(' - ')[0] : 'World map');
  return `LVL ${data.party[0].lvl}  ${place}` + (data.ngPlus ? `  NG+${data.ngPlus}` : '') + (data.difficulty && data.difficulty !== 'Normal' ? `  ${data.difficulty}` : '') + (data.tower && data.tower.best ? `  Tower ${data.tower.best}` : '');
}

function loadGame(slot) {
  try {
    const data = readSlot(slot);
    for (const saved of data.party) if (saved.id === 'riael') saved.id = 'sorutra';   // she was renamed; old saves still work
    G.party = data.party.map(saved => Object.assign(makeHero(saved.id), saved));
    for (const h of G.party) h.picks = h.picks || {};
    G.gold = data.gold;
    G.items = Object.assign({}, data.items);
    for (const id in ITEMS) if (!(id in G.items)) G.items[id] = 0;   // items added to the game after this save was made
    G.flags = data.flags || {};                     // older saves have no flags yet
    G.bag = Object.assign(newBag(), data.bag);      // ...and no bag
    trimItems();                                    // more than MAX_ITEMS of something? the extra is left behind (main.js)
    G.ngPlus = data.ngPlus || 0;
    G.difficulty = DIFFICULTIES[data.difficulty] ? data.difficulty : 'Normal';     // older saves: Normal
    G.tower = Object.assign(newTower(), data.tower);
    if (!data.tower && G.flags.bestFloor) G.tower.best = G.flags.bestFloor;       // saves from before the tower kept its own notes
    for (const h of G.party) h.bonus = h.bonus || {};
    const owed = payMimicPoints();                                                // Mimics beaten before they gave stat points
    if (owed) showToast(`Mimics beaten earlier: +${owed} to all stats!`, 4);
    noteRecord(r => { r.best = Math.max(r.best, G.tower.best); });               // the all-time record is never behind a save's own best
    G.run = null;
    G.slot = slot;                                  // remember where we came from, so saving suggests the same slot
    rememberSlot(slot);
    Object.assign(player, { onBoat: false }, data.player, { moving: false, safeSteps: 4, path: null });
    resetFollowers();
    G.seen = data.seen ? Uint8Array.from(data.seen, Number) : guessSeenTiles();   // older saves: make a fair guess
    return true;
  } catch (e) { return false; }
}
