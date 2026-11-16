// Theme templates: palette + prop pool + vocabulary. The puzzle logic is theme-independent;
// the template decides which furniture carries it and how the room is dressed.
export const THEMES = {
  detective: {
    name: "The Gumshoe's Office", year: 1947, tagline: 'Rain on the glass. A case gone cold.',
    intro: 'You came to the private eye\'s office for answers. The door clicked shut behind you, and the detective is nowhere to be seen. Everything you need to get out is in this room.',
    outro: 'The lock gives. You step out into the wet neon night, case closed.',
    pal: { wall: 0x5d7065, wallLow: 0x5a4030, floor: 0x7a5234, floorB: 0x6b452a, ceil: 0xd9d2c0, trim: 0x3b2a1e, wood: 0x6e4a2c, woodDark: 0x432c1a, metal: 0x6f7a78, fabric: 0x7a3b2e, accent: 0xc79a3a, rug: [0x7a2e2a, 0xd6b36a, 0x2f3e46], light: 0xffe2b0 },
    wallStyle: 'stripes', floorStyle: 'wood', view: 'city',
    must: ['desk', 'chair', 'rug', 'window', 'floor_lamp'],
    props: ['desk', 'chair', 'filing_cabinet', 'safe', 'coat_rack', 'waste_bin', 'plant', 'painting', 'armchair', 'rug', 'wall_clock', 'bookshelf', 'radio', 'noticeboard', 'typewriter', 'ledger', 'wall_cabinet', 'lockbox', 'crate', 'vent', 'curio', 'window', 'floor_lamp', 'calendar', 'side_table', 'desk_lamp', 'telephone', 'wardrobe', 'trunk'],
    words: ['CLUE', 'ALIBI', 'CRIME', 'BADGE', 'TRAIL', 'CASE', 'HEIST', 'SNOOP', 'FRAME', 'GUILT', 'PROOF', 'BRIBE', 'VAULT', 'SHADY', 'SMOKE', 'ALLEY', 'FORGE', 'STING', 'NOIR', 'TAIL', 'COPS', 'LEAD', 'DAME', 'FILE'],
    titles: [['Cold', 'Crooked', 'Midnight', 'Silent', 'Double'], ['Case', 'Alibi', 'Stakeout', 'Tail', 'Cross']],
  },
  study: {
    name: "The Professor's Study", year: 1953, tagline: 'Pipe smoke, old paper and one last riddle.',
    intro: 'The professor always said the best lessons are locked away. Tonight the study door has locked itself behind you, and the old man has left a trail of clues to see if you were listening.',
    outro: 'The door swings wide. Somewhere, the professor is smiling.',
    pal: { wall: 0x7a3f3a, wallLow: 0x4b3020, floor: 0x5c3d24, floorB: 0x4e331d, ceil: 0xe2d8c3, trim: 0x33221a, wood: 0x5e3b22, woodDark: 0x3a2415, metal: 0x8a7a55, fabric: 0x2f5548, accent: 0xc9a227, rug: [0x23463f, 0xc9a227, 0x7a3f3a], light: 0xffdca8 },
    wallStyle: 'diamond', floorStyle: 'wood', view: 'hills',
    must: ['desk', 'chair', 'rug', 'bookshelf', 'armchair', 'window'],
    props: ['desk', 'chair', 'bookshelf', 'armchair', 'floor_globe', 'blackboard', 'grandfather_clock', 'gramophone', 'plant', 'painting', 'trunk', 'rug', 'safe', 'wall_cabinet', 'ledger', 'typewriter', 'lockbox', 'curio', 'crate', 'vent', 'window', 'floor_lamp', 'side_table', 'desk_lamp', 'desk_globe', 'wall_clock', 'waste_bin', 'wardrobe', 'filing_cabinet', 'radio', 'noticeboard'],
    words: ['ATLAS', 'TOME', 'QUILL', 'LATIN', 'PROSE', 'GLOBE', 'CHALK', 'NOVEL', 'INDEX', 'ESSAY', 'MYTH', 'FABLE', 'VERSE', 'STUDY', 'PAGE', 'RELIC', 'LOGIC', 'OPUS', 'SAGE', 'LORE', 'TUTOR', 'MAXIM', 'PROOF', 'IDEA'],
    titles: [['Last', 'Hidden', 'Final', 'Curious', 'Forgotten'], ['Lecture', 'Thesis', 'Lesson', 'Folio', 'Riddle']],
  },
  radio: {
    name: 'Station WFBL', year: 1956, tagline: 'Dead air at midnight.',
    intro: 'The ON AIR light went dark an hour ago and the night engineer has vanished, leaving the studio door bolted. The show must go on, but first you need to get out.',
    outro: 'The bolt slides back. Out in the corridor, a transmitter hums back to life.',
    pal: { wall: 0x3f7f86, wallLow: 0xe6dcc4, floor: 0xd8cfb8, floorB: 0x39494d, ceil: 0xece6d6, trim: 0x2d3b3e, wood: 0x9a6b3c, woodDark: 0x5a3b20, metal: 0x8d9698, fabric: 0xd2691e, accent: 0xd94f30, rug: [0xd2691e, 0xf0e2c0, 0x2d6a70], light: 0xfff0d0 },
    wallStyle: 'panels', floorStyle: 'checker', view: 'city',
    must: ['radio_console', 'mic_stand', 'desk', 'chair', 'sofa'],
    props: ['radio_console', 'mic_stand', 'desk', 'chair', 'sofa', 'gramophone', 'locker', 'wall_clock', 'noticeboard', 'plant', 'painting', 'rug', 'filing_cabinet', 'safe', 'wall_cabinet', 'lockbox', 'curio', 'crate', 'vent', 'floor_lamp', 'side_table', 'microphone', 'telephone', 'typewriter', 'stool', 'calendar', 'waste_bin', 'coat_rack', 'trunk', 'window', 'ledger', 'bookshelf'],
    words: ['RADIO', 'TUNER', 'WAVE', 'DIAL', 'VALVE', 'MORSE', 'BAND', 'VOICE', 'MUSIC', 'JAZZ', 'SWING', 'TUBE', 'RELAY', 'AUDIO', 'TEMPO', 'CHORD', 'BLUES', 'VINYL', 'NEWS', 'LIVE', 'ECHO', 'TONE', 'SOLO', 'HOST'],
    titles: [['Dead', 'Late', 'Static', 'Midnight', 'Lost'], ['Air', 'Broadcast', 'Signal', 'Frequency', 'Serenade']],
  },
  lab: {
    name: 'Atomic Research Lab 7', year: 1958, tagline: 'Authorised personnel only.',
    intro: 'A drill, they said. But the blast door of Lab 7 has sealed with you inside and the intercom is silent. The scientists here trusted logic above all. Use it.',
    outro: 'The seal hisses open. Daylight never looked so good.',
    pal: { wall: 0xb9cfc4, wallLow: 0x8fb0a3, floor: 0xe3e0d4, floorB: 0x7fa095, ceil: 0xf2f0e8, trim: 0x54605c, wood: 0xb08a5a, woodDark: 0x6c5232, metal: 0x9aa5a6, fabric: 0x2f8f9c, accent: 0xe0a526, rug: [0x2f8f9c, 0xe3e0d4, 0xe0a526], light: 0xf4fbff },
    wallStyle: 'tiles', floorStyle: 'checker', view: 'none',
    must: ['lab_bench', 'stool', 'blackboard', 'locker'],
    props: ['lab_bench', 'stool', 'blackboard', 'locker', 'safe', 'crate', 'vent', 'wall_cabinet', 'filing_cabinet', 'wall_clock', 'noticeboard', 'plant', 'waste_bin', 'curio', 'lockbox', 'microscope', 'flasks', 'desk', 'chair', 'radio', 'ledger', 'coat_rack', 'calendar', 'floor_lamp', 'bookshelf', 'painting', 'side_table', 'typewriter', 'trunk'],
    words: ['ATOM', 'ORBIT', 'FLASK', 'GAMMA', 'BETA', 'ALPHA', 'IONS', 'VOLT', 'WATT', 'OHMS', 'COIL', 'PRISM', 'LENS', 'ACID', 'BASE', 'SALT', 'ZINC', 'NEON', 'ARGON', 'RADON', 'BORON', 'CORE', 'HELIX', 'MASS'],
    titles: [['Critical', 'Sealed', 'Unstable', 'Classified', 'Chain'], ['Reaction', 'Experiment', 'Formula', 'Isotope', 'Protocol']],
  },
  liner: {
    name: 'Cabin 12, S.S. Fable', year: 1952, tagline: 'Three days out of Southampton.',
    intro: 'You woke to the throb of engines and a cabin door that will not budge. The purser\'s idea of a joke, perhaps. The previous passenger left in a hurry, and left plenty behind.',
    outro: 'The cabin door opens onto salt air and a wide Atlantic morning.',
    pal: { wall: 0xe8dfc8, wallLow: 0x2c4a63, floor: 0x8a5a36, floorB: 0x7b4e2e, ceil: 0xf2ecdc, trim: 0x8a6a3a, wood: 0x8b5a33, woodDark: 0x553621, metal: 0xb59a52, fabric: 0x2c4a63, accent: 0xc8473c, rug: [0x2c4a63, 0xe8dfc8, 0xc8473c], light: 0xfff2d6 },
    wallStyle: 'rivets', floorStyle: 'wood', view: 'sea',
    must: ['bed', 'trunk', 'window', 'side_table', 'wardrobe'],
    props: ['bed', 'trunk', 'window', 'side_table', 'wardrobe', 'armchair', 'floor_globe', 'crate', 'coat_rack', 'painting', 'rug', 'wall_clock', 'safe', 'wall_cabinet', 'lockbox', 'curio', 'vent', 'desk', 'chair', 'radio', 'ledger', 'plant', 'floor_lamp', 'desk_lamp', 'desk_globe', 'noticeboard', 'waste_bin', 'calendar', 'bookshelf', 'typewriter'],
    words: ['OCEAN', 'STERN', 'PORT', 'KNOT', 'HELM', 'DECK', 'MAST', 'SAIL', 'TIDE', 'CABIN', 'BERTH', 'CARGO', 'WHARF', 'BUOY', 'KEEL', 'CREW', 'FERRY', 'PIER', 'REEF', 'GULL', 'STEAM', 'WAKE', 'ROPE', 'HULL'],
    titles: [['Midnight', 'Stowaway', 'Atlantic', 'Starboard', 'Captain\'s'], ['Crossing', 'Passage', 'Secret', 'Voyage', 'Log']],
  },
};
for (const id in THEMES) THEMES[id].id = id;
export const THEME_IDS = Object.keys(THEMES);

export const DIFFICULTY = {
  easy: { name: 'Easy', locks: [3, 3], digits: [3, 3], cands: 4, cons: 2, merge: 0, sockets: [1, 1], torn: 0.15, split: 0.15, photo: 0.4 },
  medium: { name: 'Medium', locks: [4, 5], digits: [3, 4], cands: 5, cons: 2, merge: 1, sockets: [1, 2], torn: 0.35, split: 0.4, photo: 0.75 },
  hard: { name: 'Hard', locks: [6, 7], digits: [4, 4], cands: 6, cons: 3, merge: 2, sockets: [2, 3], torn: 0.5, split: 0.6, photo: 0.9 },
};
