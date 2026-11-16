// The prop catalogue. Every prop is a simple, recognisable piece of mid-century furniture.
// place:  floor | wall | top (sits on a host surface) | rug
// w,d,h:  footprint width, depth and height in metres (front faces +z at rot 0)
// y:      mounting height for wall props
// Roles (at most one "active" role per prop keeps interaction unambiguous):
//   container {locks:[...]}  – can be opened; may carry a lock; things can be placed inside
//   hide "verb"              – a hiding spot the player can search
//   inscribe                 – a writing surface that can display a text clue
//   feature clock|books|radio – displays a code through what it is
//   host                     – flat top that small "top" props can sit on
const C = (locks, extra = {}) => ({ locks, ...extra });

export const CATALOG = {
  // ---- exit
  door: { name: 'Exit door', group: 'Structure', place: 'wall', w: 1.1, d: 0.14, h: 2.1, y: 0, container: C(['key', 'digits', 'wheel', 'dial'], { exit: true, must: true }), desc: 'The only way out.' },
  window: { name: 'Window', group: 'Structure', place: 'wall', w: 1.3, d: 0.1, h: 1.3, y: 0.95, desc: 'Painted shut. The world carries on outside.' },
  // ---- containers
  desk: { name: 'Desk', group: 'Containers', place: 'floor', w: 1.5, d: 0.75, h: 0.78, host: true, container: C(['key', 'digits']), desc: 'A sturdy desk with one deep drawer.' },
  filing_cabinet: { name: 'Filing cabinet', group: 'Containers', place: 'floor', hug: true, w: 0.5, d: 0.62, h: 1.32, container: C(['key', 'digits']), desc: 'Steel filing cabinet.' },
  safe: { name: 'Safe', group: 'Containers', place: 'floor', hug: true, w: 0.75, d: 0.7, h: 0.95, container: C(['dial', 'digits', 'key', 'wheel']), desc: 'A heavy steel safe.' },
  trunk: { name: 'Steamer trunk', group: 'Containers', place: 'floor', hug: true, w: 1.05, d: 0.6, h: 0.6, container: C(['key', 'digits', 'wheel']), desc: 'A travel-worn steamer trunk.' },
  crate: { name: 'Nailed crate', group: 'Containers', place: 'floor', hug: true, w: 0.75, d: 0.75, h: 0.75, container: C(['tool'], { tool: 'crowbar', must: true }), desc: 'A wooden crate, nailed shut.' },
  wardrobe: { name: 'Wardrobe', group: 'Containers', place: 'floor', hug: true, w: 1.15, d: 0.6, h: 1.95, container: C(['key', 'digits']), desc: 'A tall wardrobe.' },
  locker: { name: 'Locker', group: 'Containers', place: 'floor', hug: true, w: 0.5, d: 0.5, h: 1.8, container: C(['digits', 'key']), desc: 'A steel locker.' },
  curio: { name: 'Curio cabinet', group: 'Containers', place: 'floor', hug: true, w: 0.62, d: 0.62, h: 1.15, container: C(['merge', 'wheel'], { must: true }), desc: 'A puzzle cabinet on a pedestal.' },
  wall_cabinet: { name: 'Wall cabinet', group: 'Containers', place: 'wall', w: 0.65, d: 0.28, h: 0.7, y: 1.15, container: C(['key', 'digits']), desc: 'A small cabinet fixed to the wall.' },
  vent: { name: 'Vent grille', group: 'Containers', place: 'wall', w: 0.55, d: 0.05, h: 0.4, y: 0.2, container: C(['tool'], { tool: 'screwdriver', must: true }), desc: 'A ventilation grille held by four screws.' },
  lockbox: { name: 'Lock box', group: 'Containers', place: 'top', w: 0.34, d: 0.24, h: 0.16, container: C(['key', 'digits']), desc: 'A small metal cash box.' },
  // ---- hiding spots
  rug: { name: 'Rug', group: 'Hiding spots', place: 'rug', w: 2.3, d: 1.6, h: 0.02, hide: 'Lift the rug', desc: 'A patterned rug.' },
  painting: { name: 'Painting', group: 'Hiding spots', place: 'wall', w: 0.95, d: 0.06, h: 0.75, y: 1.25, hide: 'Look behind the painting', desc: 'A framed painting.' },
  plant: { name: 'Potted plant', group: 'Hiding spots', place: 'floor', hug: true, w: 0.5, d: 0.5, h: 1.2, hide: 'Dig through the soil', desc: 'A leafy potted plant.' },
  armchair: { name: 'Armchair', group: 'Hiding spots', place: 'floor', w: 0.9, d: 0.85, h: 0.95, hide: 'Feel under the cushion', desc: 'A comfortable armchair.' },
  sofa: { name: 'Sofa', group: 'Hiding spots', place: 'floor', hug: true, w: 1.8, d: 0.85, h: 0.85, hide: 'Check between the cushions', desc: 'A low-slung sofa.' },
  bed: { name: 'Bunk', group: 'Hiding spots', place: 'floor', hug: true, w: 2.0, d: 0.95, h: 0.6, hide: 'Look under the pillow', desc: 'A neatly made bunk.' },
  coat_rack: { name: 'Coat rack', group: 'Hiding spots', place: 'floor', hug: true, w: 0.5, d: 0.5, h: 1.8, hide: 'Search the coat pockets', desc: 'A coat and hat hang here.' },
  waste_bin: { name: 'Waste bin', group: 'Hiding spots', place: 'floor', hug: true, w: 0.34, d: 0.34, h: 0.42, hide: 'Rummage through the bin', desc: 'A bin of crumpled paper.' },
  floor_globe: { name: 'Floor globe', group: 'Hiding spots', place: 'floor', w: 0.6, d: 0.6, h: 1.1, hide: 'Open the globe', desc: 'A globe on a stand. It has a seam along the equator.' },
  gramophone: { name: 'Gramophone', group: 'Hiding spots', place: 'floor', hug: true, w: 0.55, d: 0.55, h: 1.3, hide: 'Lift the record', desc: 'A gramophone with a brass horn.' },
  // ---- clue surfaces
  blackboard: { name: 'Blackboard', group: 'Clue surfaces', place: 'wall', w: 1.7, d: 0.08, h: 1.05, y: 0.95, inscribe: true, desc: 'A chalk-dusted blackboard.' },
  noticeboard: { name: 'Notice board', group: 'Clue surfaces', place: 'wall', w: 0.9, d: 0.06, h: 0.7, y: 1.2, inscribe: true, desc: 'A cork notice board.' },
  typewriter: { name: 'Typewriter', group: 'Clue surfaces', place: 'top', w: 0.42, d: 0.38, h: 0.2, inscribe: true, desc: 'A typewriter with a sheet in the roller.' },
  ledger: { name: 'Open ledger', group: 'Clue surfaces', place: 'top', w: 0.42, d: 0.3, h: 0.04, inscribe: true, desc: 'A ledger lying open.' },
  wall_clock: { name: 'Wall clock', group: 'Clue surfaces', place: 'wall', w: 0.46, d: 0.08, h: 0.46, y: 1.7, feature: 'clock', desc: 'A wall clock. It has stopped.' },
  grandfather_clock: { name: 'Longcase clock', group: 'Clue surfaces', place: 'floor', hug: true, w: 0.55, d: 0.38, h: 2.05, feature: 'clock', desc: 'A longcase clock. The pendulum hangs still.' },
  bookshelf: { name: 'Bookshelf', group: 'Clue surfaces', place: 'floor', hug: true, w: 1.3, d: 0.38, h: 2.0, feature: 'books', desc: 'Shelves of well-thumbed books.' },
  radio: { name: 'Table radio', group: 'Clue surfaces', place: 'top', w: 0.45, d: 0.24, h: 0.3, feature: 'radio', desc: 'A valve radio. It hums faintly.' },
  radio_console: { name: 'Radio console', group: 'Clue surfaces', place: 'floor', hug: true, w: 0.9, d: 0.45, h: 1.05, feature: 'radio', desc: 'A floor-standing radio console.' },
  // ---- furniture & decor
  side_table: { name: 'Side table', group: 'Furniture', place: 'floor', w: 0.55, d: 0.55, h: 0.6, host: true, desc: 'A small side table.' },
  lab_bench: { name: 'Lab bench', group: 'Furniture', place: 'floor', hug: true, w: 1.8, d: 0.7, h: 0.9, host: true, desc: 'A workbench with a scrubbed top.' },
  chair: { name: 'Chair', group: 'Furniture', place: 'floor', w: 0.5, d: 0.5, h: 0.9, desc: 'A plain wooden chair.' },
  stool: { name: 'Stool', group: 'Furniture', place: 'floor', w: 0.38, d: 0.38, h: 0.6, desc: 'A three-legged stool.' },
  floor_lamp: { name: 'Floor lamp', group: 'Furniture', place: 'floor', hug: true, w: 0.4, d: 0.4, h: 1.7, light: 1.45, desc: 'A floor lamp with a warm glow.' },
  mic_stand: { name: 'Microphone stand', group: 'Furniture', place: 'floor', w: 0.4, d: 0.4, h: 1.55, desc: 'A studio microphone. The ON AIR light is off.' },
  calendar: { name: 'Calendar', group: 'Furniture', place: 'wall', w: 0.4, d: 0.03, h: 0.55, y: 1.3, desc: 'A wall calendar.' },
  desk_lamp: { name: 'Desk lamp', group: 'Table-top', place: 'top', w: 0.24, d: 0.24, h: 0.42, light: 0.3, desc: 'A banker\'s lamp.' },
  telephone: { name: 'Telephone', group: 'Table-top', place: 'top', w: 0.26, d: 0.22, h: 0.14, desc: 'A rotary telephone. The line is dead.' },
  desk_globe: { name: 'Desk globe', group: 'Table-top', place: 'top', w: 0.26, d: 0.26, h: 0.36, desc: 'A small desk globe.' },
  microscope: { name: 'Microscope', group: 'Table-top', place: 'top', w: 0.2, d: 0.26, h: 0.36, desc: 'A brass microscope.' },
  flasks: { name: 'Glassware', group: 'Table-top', place: 'top', w: 0.5, d: 0.24, h: 0.3, desc: 'Flasks and beakers. Best left alone.' },
  microphone: { name: 'Desk microphone', group: 'Table-top', place: 'top', w: 0.18, d: 0.18, h: 0.3, desc: 'A ribbon microphone.' },
};
for (const id in CATALOG) CATALOG[id].id = id;

export const LOCK_NAMES = { key: 'Key lock', tool: 'Needs a tool', digits: 'Number padlock', dial: 'Safe dial', wheel: 'Word wheel', merge: 'Merge tray' };
export const TOOLS = { crowbar: 'Crowbar', screwdriver: 'Screwdriver' };

// footprint in room coordinates, taking 90° rotations into account
export function rectOf(p, pad = 0) {
  const c = CATALOG[p.type];
  const sw = p.rot % 2 ? c.d : c.w, sd = p.rot % 2 ? c.w : c.d;
  return { x0: p.x - sw / 2 - pad, x1: p.x + sw / 2 + pad, z0: p.z - sd / 2 - pad, z1: p.z + sd / 2 + pad };
}
export const FRONT = [[0, 1], [1, 0], [0, -1], [-1, 0]];
export const overlap = (a, b) => a.x0 < b.x1 && a.x1 > b.x0 && a.z0 < b.z1 && a.z1 > b.z0;
