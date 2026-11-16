// =====================================================================
// sprites.js  -  All the pixel art. There are no image files: every
// sprite and tile is drawn by code onto a tiny 16x16 canvas, once, and
// then reused.
// =====================================================================

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let SCALE = 3;              // the game is 320x240 "big pixels"; each one is drawn SCALE screen pixels wide
                            // (main.js changes SCALE to fit the window or the chosen screen size)
const SCREEN_W = 320, SCREEN_H = 240, TILE = 16;
const FONT = '8px "Courier New", monospace';

// ---- the shapes: each letter is one pixel, looked up in a palette ('.' = see-through) ----
const HUMAN = [
  '....kkkkkkkk....',
  '...khhhhhhhhk...',
  '...khhhhhhhhk...',
  '...khsssssshk...',
  '...ksessssesk...',
  '...kssssssssk...',
  '....kssssssk....',
  '...kcccccccck...',
  '..kcccccccccck..',
  '..ksccccccccsk..',
  '..kscddddddcsk..',
  '...kcccccccck...',
  '...kcccccccck...',
  '...kddk..kddk...',
  '...kbbk..kbbk...',
  '...kkkk..kkkk...',
];
const SLIME = [
  '................',
  '................',
  '................',
  '.......kk.......',
  '......kaak......',
  '.....kaaaak.....',
  '....kaawaaak....',
  '...kaaaaaaaak...',
  '..kaaaaaaaaaak..',
  '.kaaekaaaakeaak.',
  '.kaaekaaaakeaak.',
  'kaaaaaaaaaaaaaak',
  'kaaaakkkkkkaaaak',
  'kaaaaaaaaaaaaaak',
  '.kaaaaaaaaaaaak.',
  '..kkkkkkkkkkkk..',
];
const BAT = [
  '................',
  '................',
  'k..............k',
  'kk....k..k....kk',
  'kpk...kkkk...kpk',
  'kppk.kppppk.kppk',
  'kpppkkeppekkpppk',
  'kppppppppppppppk',
  'kpppppwppwpppppk',
  'kppkkppppppkkppk',
  'kpk..kppppk..kpk',
  'kk....kppk....kk',
  'k......kk......k',
  '................',
  '................',
  '................',
];
const WOLF = [
  '..k..........k..',
  '.kgk........kgk.',
  '.kggk......kggk.',
  '.kgggkkkkkkgggk.',
  '.kggggggggggggk.',
  '.kggggggggggggk.',
  '.kgrkggggggkrgk.',
  '.kggggggggggggk.',
  '..kggggwwggggk..',
  '..kgggwwwwgggk..',
  '...kggwkkwggk...',
  '...kgwwwwwwgk...',
  '....kwkwwkwk....',
  '....kwwwwwwk....',
  '.....kkkkkk.....',
  '................',
];
const SPIDER = [
  '................',
  '................',
  'k..k........k..k',
  '.k..k......k..k.',
  '..k..kkkkkk..k..',
  '...kkmmmmmmkk...',
  'kkkkmmmmmmmmkkkk',
  '...kmrmmmmrmk...',
  'kkkkmmmmmmmmkkkk',
  '...kmmwmmwmmk...',
  '..k.kmmmmmmk.k..',
  '.k...kkkkkk...k.',
  'k..............k',
  '................',
  '................',
  '................',
];
const GHOST = [
  '................',
  '.....kkkkkk.....',
  '....kwwwwwwk....',
  '...kwwwwwwwwk...',
  '..kwwwwwwwwwwk..',
  '..kwwkkwwkkwwk..',
  '..kwwkkwwkkwwk..',
  '..kwwwwwwwwwwk..',
  '..kwwwwkkwwwwk..',
  '..kwwwwkkwwwwk..',
  '..kwwwwwwwwwwk..',
  '..kwwwwwwwwwwk..',
  '..kwwwwwwwwwwk..',
  '..kwkwwkkwwkwk..',
  '..kk.kk..kk.kk..',
  '................',
];
const BOSS = [
  'y..............y',
  'yy............yy',
  '.yy..kkkkkk..yy.',
  '..yykrrrrrrkyy..',
  '...krrrrrrrrk...',
  '..krrrrrrrrrrk..',
  '..kreekrrkeerk..',
  '..krrrrrrrrrrk..',
  '..krrrkrrkrrrk..',
  '..krkkkkkkkkrk..',
  '..krkwkwwkwkrk..',
  '...krkkkkkkrk...',
  '.kkkkrrrrrrkkkk.',
  'kddddkkkkkkddddk',
  'kddddddddddddddk',
  'kddddddddddddddk',
];
const SKULLKING = [
  '...y...yy...y...',
  '...yy.yyyy.yy...',
  '...yyyyyyyyyy...',
  '...yjyyjjyyjy...',
  '..kkkkkkkkkkkk..',
  '..kwwwwwwwwwwk..',
  '..kwkkwwwwkkwk..',
  '..kwkrwwwwrkwk..',
  '..kwwwwkkwwwwk..',
  '...kwwwwwwwwk...',
  '...kwkwkkwkwk...',
  '....kkkkkkkk....',
  '.kkkkppppppkkkk.',
  'kppppkkkkkkppppk',
  'kppppppppppppppk',
  'kppppppppppppppk',
];
const MIMIC = [            // a treasure chest with teeth (Endless Tower)
  '................',
  '................',
  '..kkkkkkkkkkkk..',
  '.kbbbbbbbbbbbbk.',
  '.kbggbbbbbbggbk.',
  '.kbbrrbbbbrrbbk.',
  '.kbbrrbbbbrrbbk.',
  '.kkkkkkkkkkkkkk.',
  '.kwkwkwkwkwkwkk.',
  '.krrrrrrrrrrrrk.',
  '.kkwkwkwkwkwkwk.',
  '.kkkkkkkkkkkkkk.',
  '.kbbbbbggbbbbbk.',
  '.kbbbbbggbbbbbk.',
  '.kkkkkkkkkkkkkk.',
  '................',
];
const DRAGON = [
  'k..............k',
  'kk............kk',
  'kgk..........kgk',
  'kggk..kkkk..kggk',
  '.kggkkggggkkggk.',
  '..kggggggggggk..',
  '..kgyykggkyygk..',
  '..kggggggggggk..',
  '...kggggggggk...',
  '...kgkggggkgk...',
  '...kggggggggk...',
  '..kkkkkkkkkkkk..',
  '..kwkwkwwkwkwk..',
  '..krrrrrrrrrrk..',
  '...kwkwkkwkwk...',
  '....kkkkkkkk....',
];
const SWORD = [
  'kkk.............',
  'kwwk............',
  'kwswk...........',
  '.kwswk..........',
  '..kwswk.........',
  '...kwswk........',
  '....kwswk.......',
  '.....kwswk..k...',
  '......kwswkgk...',
  '.......kwsggk...',
  '........kgggk...',
  '.......kggbbk...',
  '......kgkkbbbk..',
  '.......k..kbbbk.',
  '...........kbgbk',
  '............kkk.',
];
const BRUTE = [
  '..h..........h..',
  '..hh.kkkkkk.hh..',
  '...hkssssssskh..',
  '...kssssssssk...',
  '...kseksskesk...',
  '...kssssssssk...',
  '..kkswkwwkwskk..',
  '.kssksssssskssk.',
  'kssskccccccksssk',
  'kssskccccccksssk',
  'kssskcddddcksssk',
  'kssk.kcccck.kssk',
  '.kk..kcccck..kk.',
  '.....kskksk.....',
  '...kssk..kssk...',
  '...kkkk..kkkk...',
];
const KNIGHT = [
  '......kyyk......',
  '....kkhhhhkk....',
  '...khhhhhhhhk...',
  '...khhhhhhhhk...',
  '...khekkkkehk...',
  '...khhhhhhhhk...',
  '....khhhhhhk....',
  '..kkcccccccckk..',
  '.kcccccccccccck.',
  '.kckcccccccckck.',
  '.kckccddddcckck.',
  '.kk.kcccccck.kk.',
  '....kcccccck....',
  '...kddk..kddk...',
  '...kbbk..kbbk...',
  '...kkkk..kkkk...',
];
const BOAT = [
  '........k.......',
  '........kw......',
  '........kww.....',
  '........kwww....',
  '........kwwww...',
  '........kwwwww..',
  '........kwwwwww.',
  '........k.......',
  '........k.......',
  'kkkkkkkkkkkkkkkk',
  'kbbbbbbbbbbbbbbk',
  '.kbdbbbbbbbbdbk.',
  '..kbbbbbbbbbbk..',
  '...kkkkkkkkkk...',
  '................',
  '................',
];

// =====================================================================
// MAKING SPRITES
// A sprite starts as a "grid": 16 rows of 16 colours (null = see-through).
// =====================================================================
const OUTLINE = '#111';

function makeGrid(rows, palette) {
  return rows.map(row => [...row].map(ch => ch === '.' ? null : (palette[ch] || '#f0f')));
}
function gridToCanvas(grid) {
  const c = document.createElement('canvas');
  c.width = grid[0].length; c.height = grid.length;
  const g = c.getContext('2d');
  grid.forEach((row, y) => row.forEach((color, x) => { if (color) { g.fillStyle = color; g.fillRect(x, y, 1, 1); } }));
  return c;
}
function makeSprite(rows, palette) { return gridToCanvas(makeGrid(rows, palette)); }

// make a colour lighter (amount > 1) or darker (amount < 1)
function tint(color, amount) {
  const hex = color.length === 4 ? color.replace(/[0-9a-f]/gi, '$&$&') : color;        // #abc -> #aabbcc
  const part = i => Math.max(0, Math.min(255, Math.round(parseInt(hex.slice(i, i + 2), 16) * amount)));
  return '#' + [1, 3, 5].map(i => part(i).toString(16).padStart(2, '0')).join('');
}

// =====================================================================
// HIGH-DETAIL BATTLE ART
// In battle a monster is 48x48 pixels (a boss 64x64): nine times the pixels of its little
// 16x16 map sprite. That is too many to type out as letters, so these are DRAWN by code
// from ovals, polygons and thick lines, then cleaned up into crisp pixel art:
//   1. the painter draws the shape (48x48 coordinates, in the monster's own colours)
//   2. crisp() makes every pixel fully solid or fully empty (no blurry edges)
//   3. and adds a one-pixel dark outline around the whole figure
// Each painter gets a pen "p" and the colour palette "c" from MONSTER_ART below.
// =====================================================================
function makePen(g) {
  return {
    // el = filled oval,  poly = filled polygon,  line = thick line through several points
    el(cx, cy, rx, ry, color) { g.fillStyle = color; g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); g.fill(); },
    poly(color, ...xy) { g.fillStyle = color; g.beginPath(); for (let i = 0; i < xy.length; i += 2) g.lineTo(xy[i], xy[i + 1]); g.closePath(); g.fill(); },
    line(color, width, ...xy) {
      g.strokeStyle = color; g.lineWidth = width; g.lineCap = g.lineJoin = 'round';
      g.beginPath(); for (let i = 0; i < xy.length; i += 2) g.lineTo(xy[i], xy[i + 1]); g.stroke();
    },
  };
}

function crisp(canvas) {
  const g = canvas.getContext('2d'), w = canvas.width, h = canvas.height;
  const img = g.getImageData(0, 0, w, h), d = img.data;
  for (let i = 3; i < d.length; i += 4) d[i] = d[i] >= 128 ? 255 : 0;          // solid or empty, nothing in between
  const solid = (x, y) => x >= 0 && y >= 0 && x < w && y < h && d[(y * w + x) * 4 + 3] === 255;
  const edge = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (!solid(x, y) && (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1))) edge.push((y * w + x) * 4);
  }
  for (const i of edge) { d[i] = d[i + 1] = d[i + 2] = 17; d[i + 3] = 255; }   // the outline
  g.putImageData(img, 0, 0);
  return canvas;
}

// handy for things that come in pairs (eyes, ears, legs): side(s) mirrors x around the middle
const side = s => x => 24 + s * x;

const HI_ART = {
  slime(p, c) {
    const dark = tint(c.a, 0.66), light = tint(c.a, 1.25);
    p.el(24, 34, 20, 11, dark); p.poly(dark, 24, 5, 9, 30, 39, 30); p.el(24, 26, 15, 13, dark);
    p.el(23, 33, 18, 9.5, c.a); p.poly(c.a, 24, 8, 11, 29, 36, 29); p.el(23, 25, 13, 12, c.a);
    p.el(17, 20, 4, 6, light); p.el(15.5, 17, 1.6, 2.4, c.w);                                  // shine
    p.el(17, 31, 4, 5, '#fff'); p.el(31, 31, 4, 5, '#fff'); p.el(18, 32, 2, 3, '#111'); p.el(30, 32, 2, 3, '#111');
    p.line('#111', 1.6, 18, 39, 24, 41, 30, 39);                                               // smile
  },
  bat(p, c) {
    const dark = tint(c.p, 0.58), light = tint(c.p, 1.3);
    for (const s of [1, -1]) { const X = side(s);
      p.poly(dark, X(4), 22, X(22), 6, X(19), 20, X(23), 28, X(15), 27, X(14), 37, X(8), 30, X(3), 33);     // wing
      p.poly(c.p, X(5), 22, X(20), 9, X(16.5), 21, X(19.5), 26, X(13), 25, X(12), 33, X(8), 28, X(4), 30);
      p.line(dark, 1.2, X(5), 22, X(20), 9); p.line(dark, 1.2, X(5), 23, X(13), 25);
      p.poly(dark, X(3), 13, X(8), 3, X(9.5), 15); p.poly(light, X(4.6), 12.5, X(7.6), 6.5, X(8.3), 14);    // ear
    }
    p.el(24, 25, 9, 11, dark); p.el(23.5, 24, 8, 10, c.p); p.el(21, 19, 3, 3.5, light);
    for (const s of [1, -1]) { const X = side(s); p.el(X(4), 23, 2.7, 2.3, c.e); p.el(X(4), 23, 1, 1.2, '#111'); p.poly(c.w, X(1), 29, X(3.2), 29, X(2.1), 33.5); }
    p.line('#111', 1.2, 20, 28.5, 28, 28.5);
  },
  wolf(p, c) {
    const dark = tint(c.g, 0.6), light = tint(c.g, 1.25);
    for (const s of [1, -1]) { const X = side(s);
      p.poly(dark, X(6), 16, X(17), 2, X(19), 22); p.poly('#d08a8a', X(10), 15, X(16), 7, X(16.5), 19);      // ear
      p.poly(dark, X(13), 22, X(22), 26, X(16), 31, X(21), 35, X(12), 38);                                    // cheek fur
    }
    p.el(24, 25, 16, 15, dark); p.el(23.5, 24, 15, 14, c.g); p.el(18, 15, 6, 3.5, light);
    p.el(24, 34, 9, 9, c.w); p.el(24, 29, 5, 4, c.w);                                           // muzzle
    p.el(24, 30, 3.2, 2.4, '#111'); p.line('#111', 1.2, 24, 32, 24, 36); p.line('#111', 1.2, 18, 37, 24, 36, 30, 37);
    for (const s of [1, -1]) { const X = side(s);
      p.poly(c.r, X(4), 23, X(12), 19, X(11), 24); p.el(X(8), 22.3, 1, 1.3, '#111');             // slanted eye
      p.line('#111', 1.4, X(3), 21, X(13), 17);                                                  // brow
      p.poly('#fff', X(3), 37.5, X(6), 37.5, X(4.5), 41.5);                                     // fang
    }
  },
  spider(p, c) {
    const dark = tint(c.m, 0.55), light = tint(c.m, 1.3);
    for (const s of [1, -1]) { const X = side(s);                                                // four legs a side, each with a knee
      p.line(dark, 2.8, X(6), 20, X(14), 8, X(21), 14);  p.line(dark, 2.8, X(8), 24, X(18), 18, X(22), 28);
      p.line(dark, 2.8, X(8), 28, X(18), 30, X(22), 40); p.line(dark, 2.8, X(6), 32, X(13), 38, X(15), 45);
    }
    p.el(24, 31, 12, 11, dark); p.el(23.5, 30, 11, 10, c.m); p.el(20, 24.5, 4, 2.6, light);     // abdomen
    p.poly(light, 24, 27, 27, 31, 24, 35, 21, 31);                                              // marking
    p.el(24, 17, 8, 7, dark); p.el(23.7, 16.5, 7, 6, c.m);                                      // head
    for (const s of [1, -1]) { const X = side(s); p.el(X(3.5), 16, 2, 2, c.r); p.el(X(1.5), 12.5, 1.2, 1.2, c.r); p.poly(c.w, X(1), 21, X(3), 21, X(2), 25.5); }
  },
  ghost(p, c) {
    const dark = tint(c.w, 0.7), light = tint(c.w, 1.2);
    p.el(24, 20, 15, 15, dark); p.poly(dark, 9, 20, 39, 20, 39, 40, 9, 40);
    for (const x of [12.75, 20.25, 27.75, 35.25]) p.el(x, 40, 3.75, 5, dark);                   // wavy hem
    p.el(23, 19, 13.5, 13.5, c.w); p.poly(c.w, 9.5, 19, 36.5, 19, 36.5, 39, 9.5, 39);
    for (const x of [12.75, 20.25, 27.75]) p.el(x, 39.5, 3.3, 4.5, c.w);
    p.el(34.5, 39.5, 2.4, 4.5, c.w);
    p.el(16, 11, 4, 4.5, light);
    p.el(7.5, 28, 3, 4.5, c.w); p.el(40.5, 28, 3, 4.5, dark);                                    // little arms
    for (const s of [1, -1]) { const X = side(s); p.el(X(6), 20, 3.2, 4.5, '#111'); p.el(X(6) + 1, 18.5, 1, 1.4, '#fff'); }
    p.el(24, 30, 3.5, 4.5, '#111');                                                             // mouth
  },
  brute(p, c) {
    const sd = tint(c.s, 0.62), sl = tint(c.s, 1.22);
    p.line('#5a3a1a', 4, 40.5, 35, 44, 14); p.el(44, 12, 3.6, 5, '#6b4423');                    // club
    for (const s of [1, -1]) { const X = side(s);
      p.el(X(6), 40, 4.5, 6, sd); p.el(X(6), 39.5, 3.6, 5.2, c.s); p.el(X(7), 45, 5, 2, sd);    // leg and foot
      p.el(X(15), 27, 5.5, 9, sd); p.el(X(14.6), 26.5, 4.6, 8, c.s);                            // arm
      p.el(X(16), 36, 4.5, 4.5, sd); p.el(X(15.6), 35.6, 3.6, 3.6, c.s);                        // fist
      p.poly(tint(c.h, 0.7), X(6.5), 9, X(13.5), 0.5, X(11.5), 11.5); p.poly(c.h, X(7.5), 8.6, X(12.8), 2.5, X(11), 10.5);   // horn
    }
    p.el(24, 28, 12, 11, sd); p.el(23.5, 27.5, 11, 10, c.s); p.el(19, 22.5, 4, 2.6, sl);        // chest
    p.poly(c.d, 14, 32, 34, 32, 32, 41, 24, 38, 16, 41); p.poly(c.c, 15, 32, 33, 32, 31, 39, 24, 36.5, 17, 39);   // loincloth
    p.poly(c.d, 13, 31, 35, 31, 35, 33.5, 13, 33.5);                                            // belt
    p.el(24, 13, 9.5, 9, sd); p.el(23.6, 12.6, 8.6, 8.1, c.s); p.el(20, 8, 3.5, 2, sl);         // head
    for (const s of [1, -1]) { const X = side(s);
      p.poly(c.e, X(2), 12, X(7), 10.5, X(6.5), 14); p.el(X(4.6), 12.3, 0.9, 1, '#111');        // angry eye
      p.line('#111', 1.4, X(1.5), 10.5, X(8), 8.5);
      p.poly(c.w, X(2.5), 16.5, X(4.5), 16.5, X(3.5), 13.8);                                    // tusk
    }
    p.poly('#111', 18, 16.5, 30, 16.5, 28, 20.5, 20, 20.5);                                     // mouth
  },
  knight(p, c) {
    const hd = tint(c.h, 0.62), hl = tint(c.h, 1.25), cd = tint(c.c, 0.65), cl = tint(c.c, 1.25);
    p.poly('#dfe6ee', 39, 30, 41, 4, 43, 30); p.line('#9fb0c8', 1, 41, 7, 41, 30);              // sword blade
    p.poly('#c9a227', 36, 30, 46, 30, 46, 32.5, 36, 32.5); p.poly('#6b4423', 40, 32.5, 42, 32.5, 42, 37, 40, 37);
    for (const s of [1, -1]) { const X = side(s);                                                // legs and boots
      p.poly(cd, X(2.5), 34, X(9), 34, X(9.5), 45, X(2), 45); p.poly(c.c, X(3.3), 34, X(8.2), 34, X(8.6), 43.5, X(3), 43.5);
      p.el(X(6), 45, 5, 2, c.d);
    }
    p.poly(cd, 13, 19, 35, 19, 33, 36, 15, 36); p.poly(c.c, 14, 19.5, 33.5, 19.5, 32, 35, 16, 35);   // breastplate
    p.poly(cl, 16, 21, 22, 21, 21, 27, 17, 27); p.line(cd, 1.2, 24, 20, 24, 35); p.poly(c.d, 15, 33, 33, 33, 33, 36, 15, 36);
    for (const s of [1, -1]) { const X = side(s);
      p.el(X(13.5), 29, 3.4, 6.5, cd); p.el(X(13.3), 28.6, 2.6, 5.7, c.c); p.el(X(14), 36, 3, 3, hd);   // arm and gauntlet
      p.el(X(12), 21, 5.5, 4.5, hd); p.el(X(11.8), 20.6, 4.6, 3.7, c.h);                                // shoulder plate
    }
    p.poly(hd, 2, 24, 16, 24, 16, 35, 9, 43, 2, 35); p.poly(c.h, 3.2, 25, 14.8, 25, 14.8, 34.5, 9, 41, 3.2, 34.5);   // shield
    p.poly(c.y, 8, 27, 10, 27, 10, 38, 8, 38); p.poly(c.y, 4.5, 30.5, 13.5, 30.5, 13.5, 32.5, 4.5, 32.5);
    p.el(24, 11.5, 9, 9.5, hd); p.el(23.6, 11, 8.1, 8.6, c.h); p.el(20, 6, 3, 2, hl);           // helmet
    p.poly('#111', 17, 10.5, 31, 10.5, 31, 14, 17, 14);                                         // visor
    p.el(20.5, 12.2, 1.6, 1.2, c.e); p.el(27.5, 12.2, 1.6, 1.2, c.e);
    p.line(hd, 1.2, 24, 14, 24, 20);
    p.poly(c.y, 22, 4, 24, 1, 30, 2.5, 26, 5.5);                                                // plume
  },
  human(p, c) {                                            // used for the Mummy: arms out, wrapped in bandages
    const cd = tint(c.c, 0.68);
    for (const s of [1, -1]) { const X = side(s);
      p.poly(cd, X(1.5), 32, X(8), 32, X(8), 45, X(1.5), 45); p.poly(c.c, X(2.3), 32, X(7.2), 32, X(7.2), 44, X(2.3), 44);
      p.el(X(5), 45.3, 4.5, 1.8, cd);
    }
    p.poly(cd, 14, 17, 34, 17, 33, 34, 15, 34); p.poly(c.c, 15, 17.5, 32.5, 17.5, 32, 33, 16, 33);
    for (const s of [1, -1]) { const X = side(s);
      p.line(cd, 5.5, X(10), 19.5, X(17), 24, X(19), 31); p.line(c.c, 3.8, X(10), 19.5, X(17), 24, X(19), 30.5);
      p.el(X(19.3), 33, 2.8, 2.8, c.s);
    }
    p.el(24, 10.5, 8.5, 8.5, cd); p.el(23.6, 10.1, 7.6, 7.6, c.s);
    for (const y of [21, 25, 29, 37, 41]) p.line(c.d, 1, 16, y, 32, y + 1.5);                   // bandages
    p.line(c.d, 1, 17, 5.5, 31, 7); p.line(c.d, 1, 17, 15, 31, 16);
    p.poly('#111', 18, 9, 30, 9, 30, 12.5, 18, 12.5);
    p.el(21, 10.8, 1.5, 1.2, c.e); p.el(27, 10.8, 1.5, 1.2, c.e);
  },
  boss(p, c) {                                             // the horned lords
    const rd = tint(c.r, 0.6), rl = tint(c.r, 1.25);
    p.el(24, 44, 23, 10, tint(c.d, 0.7)); p.el(24, 43, 21.5, 8.5, c.d); p.poly(tint(c.d, 1.4), 6, 41, 14, 37, 12, 44);   // cloak
    for (const s of [1, -1]) { const X = side(s);
      p.poly(tint(c.y, 0.7), X(9), 16, X(15), 12, X(22.5), 2, X(21), 12, X(13), 21);            // horn
      p.poly(c.y, X(10), 16, X(15.5), 12.6, X(21.5), 4.5, X(20), 12, X(12.5), 19.5);
    }
    p.el(24, 23, 15, 16, rd); p.el(23.5, 22.5, 14, 15, c.r); p.el(17, 12.5, 5, 3, rl);          // head
    for (const s of [1, -1]) { const X = side(s);
      p.poly('#111', X(2), 18, X(12), 13.5, X(12), 16.5, X(2.5), 20.5);                         // brow
      p.poly(c.e, X(3), 20, X(11), 17.5, X(10), 22.5, X(4), 22.5); p.el(X(6.5), 20.8, 1.2, 1.6, '#111');
      p.el(X(1.6), 26.4, 0.9, 0.9, '#111');                                                     // nostril
    }
    p.poly(rd, 22, 22, 26, 22, 27, 25.5, 21, 25.5);
    p.poly('#111', 13, 29.5, 35, 29.5, 32, 37, 16, 37);                                         // mouth
    for (let x = 14.5; x < 33; x += 4) p.poly(c.w, x, 29.5, x + 3, 29.5, x + 1.5, 33);          // teeth
    for (let x = 17.5; x < 30; x += 4) p.poly(c.w, x, 37, x + 3, 37, x + 1.5, 33.8);
  },
  skullking(p, c) {
    const wd = tint(c.w, 0.7);
    p.el(24, 45, 22, 9, tint(c.p, 0.65)); p.el(24, 44, 20.5, 7.6, c.p); p.poly(c.y, 21, 38, 27, 38, 26, 47, 22, 47);   // robe and clasp
    p.el(24, 22, 13, 12.5, wd); p.el(23.6, 21.5, 12, 11.5, c.w);                                // skull
    p.poly(wd, 16, 28, 32, 28, 30.5, 37.5, 17.5, 37.5); p.poly(c.w, 16.8, 28, 31.2, 28, 29.8, 36.6, 18.2, 36.6);     // jaw
    for (const s of [1, -1]) { const X = side(s); p.el(X(5.5), 22, 3.8, 4.2, '#111'); p.el(X(5.5), 22.5, 1.5, 1.7, c.r); }   // glowing sockets
    p.poly('#111', 24, 25, 26, 29, 22, 29);
    for (let x = 18.5; x <= 29.5; x += 2.2) p.line('#111', 0.9, x, 31, x, 36);                  // teeth
    p.line('#111', 1, 17.5, 33.3, 30.5, 33.3);
    p.poly(tint(c.y, 0.7), 11, 13, 11, 3, 16, 8, 20, 1.5, 24, 8, 28, 1.5, 32, 8, 37, 3, 37, 13);   // crown
    p.poly(c.y, 12, 12.5, 12, 5, 16, 9.5, 20, 3.5, 24, 9.5, 28, 3.5, 32, 9.5, 36, 5, 36, 12.5);
    for (const x of [16, 24, 32]) p.el(x, 11, 1.6, 1.6, c.j);
  },
  dragon(p, c) {
    const gd = tint(c.g, 0.58), gl = tint(c.g, 1.28), belly = tint(c.g, 1.5);
    for (const s of [1, -1]) { const X = side(s);                                                // wings
      p.poly(gd, X(8), 26, X(22.5), 6, X(20), 20, X(23), 30, X(17), 29, X(15), 38, X(9), 33);
      p.poly(c.g, X(9), 26, X(21), 9.5, X(18.5), 21, X(20.5), 28, X(16), 27.5, X(14), 34.5, X(10), 31);
      p.line(gd, 1, X(9), 26, X(21), 9.5);
    }
    p.el(24, 38, 11, 9, gd); p.el(23.6, 37.5, 10, 8, c.g);                                      // body
    for (const y of [34, 37.5, 41, 44.5]) p.line(belly, 1.6, 19.5 + (y - 34) * 0.2, y, 28.5 - (y - 34) * 0.2, y);   // belly plates
    for (const s of [1, -1]) { const X = side(s); p.poly(tint(c.w, 0.75), X(5), 9, X(11), 0.5, X(10), 11); p.poly(c.w, X(5.8), 9, X(10.4), 2.5, X(9.3), 10.5); }   // horns
    p.el(24, 16, 11, 10, gd); p.el(23.6, 15.6, 10, 9, c.g); p.el(19, 9.5, 3.5, 2.2, gl);        // head
    p.el(24, 25, 8.5, 7, gd); p.el(23.7, 24.6, 7.6, 6.2, c.g);                                  // snout
    for (const s of [1, -1]) { const X = side(s);
      p.el(X(2.8), 22.6, 1, 1.2, '#111');
      p.poly(c.y, X(3), 15.5, X(9.5), 12.5, X(9), 17.5); p.el(X(6.5), 15.4, 0.8, 1.8, '#111');  // eye
      p.line('#111', 1.3, X(2.5), 13.5, X(10), 10.8);
    }
    p.poly(c.r, 17.5, 27, 30.5, 27, 28.5, 31.5, 19.5, 31.5);                                    // mouth
    for (let x = 18; x < 30; x += 3) p.poly('#fff', x, 27, x + 2.4, 27, x + 1.2, 29.8);
  },
};

// The battle picture of a monster (made once, then remembered). Bosses are drawn bigger.
const bigSpriteCache = {};
function bigSprite(name, boss) {
  const key = name + (boss ? ':boss' : '');
  if (!bigSpriteCache[key]) {
    const [shape, palette] = MONSTER_ART[name];
    const painter = HI_PAINTERS.get(shape);
    const size = boss ? 64 : 48;
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const g = c.getContext('2d');
    g.scale(size / 48, size / 48);                       // painters always think in 48x48
    painter(makePen(g), palette);
    bigSpriteCache[key] = crisp(c);
  }
  return bigSpriteCache[key];
}

// ---- people ----
// One person = 4 directions x 2 walking frames, all made from the HUMAN shape.
const person = (hair, clothes, dark, skin = '#f2c79a', eye = '#111') =>
  ({ k: OUTLINE, h: hair, s: skin, e: eye, c: clothes, d: dark, b: '#4a3222' });

function makePerson(palette, robe = false, rows = null) {
  const flip = rows => rows.map(r => [...r].reverse().join(''));
  const front = HUMAN.slice();
  if (rows) for (const y in rows) front[y] = rows[y];  // an armor's own rows (see ARMOR_LOOKS)
  if (robe) {                                          // a long robe instead of legs
    front[13] = '...kcccccccck...'; front[14] = '...kddddddddk...'; front[15] = '...kkkkkkkkkk...';
  }
  const back = front.map((row, y) => (y >= 3 && y <= 5) ? row.replace(/[se]/g, 'h') : row);
  const left = front.slice();                          // side view: one eye, hair at the back of the head
  left[3] = '...khsssshhhk...'; left[4] = '...kessssshhk...'; left[5] = '...kssssshhhk...';
  const step = rows => {                               // second walking frame: feet together
    if (robe) { const r = rows.slice(); r[14] = '....kddddddk....'; r[15] = '....kkkkkkkk....'; return r; }
    const r = rows.slice(); r[13] = '....kddkkddk....'; r[14] = '....kbbkkbbk....'; r[15] = '....kkkkkkkk....'; return r;
  };
  const both = rows => [makeSprite(rows, palette), makeSprite(step(rows), palette)];
  return { down: both(front), up: both(back), left: both(left), right: both(flip(left)) };
}

// the three heroes as they walk around (ARTUROS leads, the others follow)
const HERO_SPRITES = [
  makePerson(person('#8b4513', '#2e6fd0', '#1b458a')),             // ARTUROS: blue tunic
  makePerson(person('#e0b040', '#3d9142', '#28602c')),             // SORUTRA: green tunic
  makePerson(person('#6a3fa0', '#8e4fc0', '#5b2f8a'), true),       // RAYEN: purple hood and robe
];

// ---------------------------------------------------------------------
// HOW THE HEROES LOOK IN EACH ARMOR. The number is the armor's place in ARMORS (data.js):
// 0 = Clothes (the plain look above), 1 = Leather Armor ... 14 = Armor of Legend.
// Every armor has its own colours and its own rows of the 16x16 HUMAN shape:
//   c = the armor, d = its darker shade, m = bright metal or trim, x = a second colour (scales, runes, emblems)
//   g = the hero's OWN colour (blue, green, purple), so you can still tell the three apart
//   boots: the colour of the feet
// "rows" replaces rows of the HUMAN shape: row 0 is the top of the head, rows 7-12 are the body.
// To restyle an armor, change its colours or redraw its rows (keep every row 16 letters wide).
// ---------------------------------------------------------------------
const BOOTS = '#4a3222';
const ARMOR_LOOKS = {
  1: { c: '#9a6a3a', d: '#6b4423', m: '#e8c870', boots: BOOTS, rows: {             // Leather Armor: a vest over the tunic
        7: '...kgccccccgk...', 8: '..kggccccccggk..', 9: '..ksccccccccsk..',
       10: '..ksdddmmdddsk..', 11: '...kcccccccck...', 12: '...kggggggggk...' } },
  2: { c: '#b4bcc6', d: '#7c848e', m: '#e0e6ee', boots: BOOTS, rows: {             // Chain Mail: woven rings
        7: '...kdcdcdcdck...', 8: '..kcdcdcdcdcdk..', 9: '..ksdcdcdcdcsk..',
       10: '..ksggggggggsk..', 11: '...kdcdcdcdck...', 12: '...kcdcdcdcdk...' } },
  3: { c: '#8a94a4', d: '#5a6474', m: '#ccd4e0', boots: '#ccd4e0', rows: {          // Plate Armor: plain steel, shoulder plates
        7: '..kmmccccccmmk..', 8: '..kmccccccccmk..', 9: '..ksccccccccsk..',
       10: '..ksddddddddsk..', 11: '...kcccccccck...', 12: '...kcmccccmck...' } },
  4: { c: '#8fdcd2', d: '#559c94', m: '#effffb', boots: '#effffb', rows: {          // Mythril Mail: pale green, a bright seam
        7: '..kmmccmmccmmk..', 8: '..kmcccmmcccmk..', 9: '..kscccmmcccsk..',
       10: '..ksggggggggsk..', 11: '...kcccmmccck...', 12: '...kcccccccck...' } },
  5: { c: '#c8402c', d: '#7a2018', m: '#f4d898', x: '#7e1810', boots: '#7a2018', rows: {   // Dragon Plate: red scales, horned shoulders
        6: '..m.kssssssk.m..',
        7: '..kmccxccxccmk..', 8: '..kcxccxccxcck..', 9: '..ksccxccxccsk..',
       10: '..ksddddddddsk..', 11: '...kcxccxccxk...', 12: '...kccxccxcck...' } },
  6: { c: '#2c3676', d: '#1a2048', m: '#7482cc', x: '#60e8ff', boots: '#1a2048', rows: {   // Rune Mail: dark blue, glowing runes, high collar
        6: '...kcssssssck...',
        7: '...kccxccxcck...', 8: '..kccccxxcccck..', 9: '..kscxccccxcsk..',
       10: '..ksccxxxxccsk..', 11: '...kccxccxcck...', 12: '...kddddddddk...' } },
  7: { c: '#3a66d8', d: '#2444a0', m: '#f0f4ff', x: '#d83030', boots: '#f0f4ff', rows: {   // Hero's Armor: royal blue, a red scarf
        7: '...kxxxxxxxxk...', 8: '..kmccccccccmk..', 9: '..kscccmmcccsk..',
       10: '..ksggggggggsk..', 11: '...kcccccccck...', 12: '...kcccccccck...' } },
  8: { c: '#dce0ea', d: '#949cac', m: '#f0c040', x: '#3058c0', boots: '#f0c040', rows: {   // Aegis Plate: silver, wide gold shoulders, a blue cross
        7: '.kmmmccccccmmmk.', 8: '..kmmccxxccmmk..', 9: '..kscxxxxxxcsk..',
       10: '..kscccxxcccsk..', 11: '...kcccxxccck...', 12: '...kddddddddk...' } },
  9: { c: '#d07a30', d: '#8a4a18', m: '#ffc070', boots: '#ffc070', rows: {          // Orichalcum Mail: bronze bands
        7: '..kmmccccccmmk..', 8: '..kcmmmmmmmmck..', 9: '..ksccccccccsk..',
       10: '..ksmmmmmmmmsk..', 11: '...kcccccccck...', 12: '...kmmmmmmmmk...' } },
 10: { c: '#a8d8ff', d: '#6aa0d8', m: '#ffffff', x: '#fff0a0', boots: '#ffffff', rows: {   // Celestial Armor: sky blue, white wings at the shoulders
        2: '...khmmmmmmhk...', 6: '.mm.kssssssk.mm.',
        7: '..kmmccccccmmk..', 8: '..kcccxxxxccck..', 9: '..ksccxxxxccsk..',
       10: '..ksggggggggsk..', 11: '...kcccccccck...', 12: '...kcccccccck...' } },
 11: { c: '#e0a030', d: '#a06a18', m: '#fff0a0', x: '#e04818', boots: '#fff0a0', rows: {   // Sunsteel Mail: gold, a blazing sun on the chest
        2: '...khgggggghk...',
        7: '..kmmccccccmmk..', 8: '..kmccxmmxccmk..', 9: '..kscxmmmmxcsk..',
       10: '..ksccxmmxccsk..', 11: '...kcccccccck...', 12: '...kggggggggk...' } },
 12: { c: '#5464b0', d: '#36427c', m: '#e4ecff', x: '#ffffff', boots: '#e4ecff', rows: {   // Starforged Mail: night blue scattered with stars
        2: '...khgggggghk...',
        7: '..kmmcxccccmmk..', 8: '..kmccccccxcmk..', 9: '..ksccxcccccsk..',
       10: '..ksggggggggsk..', 11: '...kcccccxcck...', 12: '...kcxcccccck...' } },
 13: { c: '#3c2c60', d: '#22183a', m: '#d868f8', boots: '#d868f8', rows: {          // Eclipse Mail: black-violet, horned helm, a glowing ring
        0: '..m.kkkkkkkk.m..', 1: '...mhhhhhhhhm...',
        7: '..kmmccccccmmk..', 8: '..kmcccmmcccmk..', 9: '..ksccmccmccsk..',
       10: '..kscccmmcccsk..', 11: '...kcccccccck...', 12: '...kmmmmmmmmk...' } },
 14: { c: '#f6f6fc', d: '#b4b4cc', m: '#ffc820', boots: '#ffc820', rows: {          // Armor of Legend: white and gold, a crown, a cape in the hero's colour
        0: '....mkmkkmkm....', 1: '...kmmmmmmmmk...',
        7: '..kmmccccccmmk..', 8: '..kmccccccccmk..', 9: '..kscccggcccsk..',
       10: '..ksmmmmmmmmsk..', 11: '...kgccccccgk...', 12: '...kgccccccgk...' } },
};
const HERO_LOOK = [                                    // [hair, the hero's own colour, wears a robe?]
  ['#8b4513', '#2e6fd0', false], ['#e0b040', '#3d9142', false], ['#6a3fa0', '#b070e0', true],
];
const heroLookCache = {};
// The walking sprites of hero number i (0-2) wearing armor of this tier.
function heroLook(i, armorTier) {
  const look = ARMOR_LOOKS[armorTier];
  if (!look) return HERO_SPRITES[i];                   // Clothes (or an armor without a look): the plain look
  const key = i + ':' + armorTier;
  if (!heroLookCache[key]) {
    const [hair, own, robe] = HERO_LOOK[i];
    const palette = Object.assign(person(hair, look.c, look.d), { m: look.m, x: look.x || look.m, g: own, b: look.boots });
    heroLookCache[key] = makePerson(palette, robe, look.rows);
  }
  return heroLookCache[key];
}

const SPRITES = {
  hero:     HERO_SPRITES[0].down[0],
  npcElder: makeSprite(HUMAN, person('#dddddd', '#7d5ba6', '#553d73')),
  npcGirl:  makeSprite(HUMAN, person('#e0b040', '#d0508a', '#8f3560')),
  npcGuard: makeSprite(KNIGHT, { k: OUTLINE, y: '#d03030', h: '#9aa3ad', e: '#f2c79a', c: '#7d8590', d: '#565c66', b: '#4a3222' }),
  npcBoy:   makeSprite(HUMAN, person('#3a2a1a', '#3d9142', '#28602c')),
  boat:     makeSprite(BOAT, { k: OUTLINE, w: '#f4f7ff', b: '#8b5a2b', d: '#6b4423' }),
  sword:    makeSprite(SWORD, { k: OUTLINE, w: '#f4f7ff', s: '#9fb0c8', g: '#f1c40f', b: '#8b5a2b' }),
};

// ---- monsters: nine shapes, many colours ----
const brute  = (skin, cloth, dark, horn = '#e8dcb0', eye = '#ffee00') => ({ k: OUTLINE, s: skin, c: cloth, d: dark, h: horn, e: eye, w: '#fff' });
const knight = (steel, armor, dark, eye = '#ff3030', plume = '#d03030') => ({ k: OUTLINE, h: steel, c: armor, d: dark, e: eye, y: plume, b: dark });
const MONSTER_ART = {
  // name: [shape, palette]
  slime:    [SLIME,  { k: OUTLINE, a: '#3fa7f0', w: '#d6f0ff', e: '#fff' }],
  bat:      [BAT,    { k: OUTLINE, p: '#8e4fc0', e: '#ff3030', w: '#fff' }],
  wolf:     [WOLF,   { k: OUTLINE, g: '#8d9299', r: '#ff3030', w: '#e8e8e8' }],
  goblin:   [BRUTE,  brute('#6fbf4a', '#8b5a2b', '#5a3a1a')],
  imp:      [BRUTE,  brute('#d0453a', '#5b1f6e', '#3a1247', '#111111')],
  // cave
  spider:   [SPIDER, { k: OUTLINE, m: '#5a3d7a', r: '#ff3030', w: '#fff' }],
  ghost:    [GHOST,  { k: '#2a3355', w: '#dfe8ff' }],
  skeleton: [KNIGHT, knight('#e8e8e8', '#d8d8d0', '#9a9a90', '#ff3030', '#e8e8e8')],
  vampbat:  [BAT,    { k: OUTLINE, p: '#b02030', e: '#ffee00', w: '#fff' }],
  ooze:     [SLIME,  { k: OUTLINE, a: '#7fbf3f', w: '#e0ffc0', e: '#fff' }],
  boss:     [BOSS,   { k: OUTLINE, r: '#b5302a', d: '#5b1f6e', y: '#e8dcb0', e: '#ffee00', w: '#fff' }],
  // --- the Endless Tower ---
  mender:    [GHOST,  { k: '#4a0a3a', w: '#ffa8d8' }],
  warcaller: [BRUTE,  brute('#c88a3a', '#8a2020', '#501010', '#f4f4f4', '#ff4040')],
  hexer:     [BRUTE,  brute('#7a55c8', '#20203c', '#101020', '#111111', '#ff50ff')],
  sentinel:  [KNIGHT, knight('#e0c060', '#b08a30', '#705818', '#40e0ff', '#3058c0')],
  mimic:     [MIMIC,  { k: OUTLINE, b: '#a0661f', g: '#f1c40f', w: '#f4f4f4', r: '#d02848' }],
  titan:     [BOSS,   { k: OUTLINE, r: '#d8a820', d: '#2a4aa0', y: '#ffffff', e: '#60e8ff', w: '#fff' }],
  prism:     [KNIGHT, knight('#d8f6ff', '#86c8f4', '#4484c4', '#ff60ff', '#ffffff')],
  suntwin:   [DRAGON, { k: OUTLINE, g: '#e0a020', y: '#fff0a0', w: '#fff', r: '#d03020' }],
  moontwin:  [DRAGON, { k: OUTLINE, g: '#7c8cd4', y: '#e4ecff', w: '#fff', r: '#6040c0' }],
  // southern land
  direwolf: [WOLF,   { k: OUTLINE, g: '#4a4f66', r: '#ffee00', w: '#e8e8e8' }],
  orc:      [BRUTE,  brute('#4f8f3a', '#7a2222', '#4d1515')],
  wisp:     [GHOST,  { k: '#a86a00', w: '#ffd75e' }],
  // desert
  scorpion:  [SPIDER, { k: OUTLINE, m: '#d9822b', r: '#111', w: '#fff' }],
  vulture:   [BAT,    { k: OUTLINE, p: '#8a6a4a', e: '#ffee00', w: '#fff' }],
  sandslime: [SLIME,  { k: OUTLINE, a: '#e0b84a', w: '#fff3c0', e: '#fff' }],
  mummy:     [HUMAN,  person('#d8cfae', '#d8cfae', '#a89f7e', '#bfb58f', '#ff3030')],
  // crypt
  wraith:      [GHOST,  { k: OUTLINE, w: '#6a4a9a' }],
  scarab:      [SPIDER, { k: OUTLINE, m: '#2f9a8a', r: '#ffee00', w: '#fff' }],
  boneknight:  [KNIGHT, knight('#e8e8e8', '#8090b0', '#566080')],
  cursedflame: [GHOST,  { k: '#7a1500', w: '#ff7040' }],
  tombking:    [SKULLKING, { k: OUTLINE, w: '#e8e2c8', y: '#f1c40f', j: '#d03030', r: '#ff3030', p: '#3050a0' }],
  // far south
  ogre:       [BRUTE,  brute('#c98a4a', '#6b4a2a', '#4a321c')],
  wyvern:     [BAT,    { k: OUTLINE, p: '#3f9a4a', e: '#ff3030', w: '#fff' }],
  darkknight: [KNIGHT, knight('#3a3a4a', '#2a2a36', '#15151c')],
  // tower
  gargoyle:  [BAT,    { k: OUTLINE, p: '#7d8590', e: '#ff3030', w: '#fff' }],
  golem:     [KNIGHT, knight('#a5aab3', '#8a8f99', '#62666e', '#40e0ff', '#8a8f99')],
  specter:   [GHOST,  { k: '#0a3a3a', w: '#7fe0d0' }],
  fiend:     [BRUTE,  brute('#c03030', '#7a1010', '#4a0808', '#222222')],
  archfiend: [BRUTE,  brute('#8a1020', '#3a0a4a', '#22062c', '#f1c40f')],
  drake:     [DRAGON, { k: OUTLINE, g: '#3f9a4a', y: '#ffee00', w: '#fff', r: '#b02020' }],
  dragon:    [DRAGON, { k: OUTLINE, g: '#3a6fd0', y: '#ffee00', w: '#fff', r: '#b02020' }],
  // the sea
  seaserpent: [DRAGON, { k: OUTLINE, g: '#2f9a8a', y: '#ffee00', w: '#fff', r: '#b02020' }],
  jellyfish:  [GHOST,  { k: '#8a2a6a', w: '#ff9ad0' }],
  kraken:     [SPIDER, { k: OUTLINE, m: '#8a3fa0', r: '#ffee00', w: '#fff' }],
  seahawk:    [BAT,    { k: OUTLINE, p: '#dfe8f4', e: '#ff3030', w: '#fff' }],
  // Coral Isle
  treant:    [BRUTE,  brute('#8b5a2b', '#3d9142', '#28602c', '#3d9142', '#ff3030')],
  harpy:     [BAT,    { k: OUTLINE, p: '#e070a0', e: '#ffee00', w: '#fff' }],
  lizardman: [KNIGHT, knight('#4f9a4a', '#8b5a2b', '#5a3a1a', '#ffee00', '#d03030')],
  // Frost Isle
  icewolf:   [WOLF,   { k: OUTLINE, g: '#bfe0f4', r: '#3080ff', w: '#fff' }],
  yeti:      [BRUTE,  brute('#eef4fa', '#bcd0e4', '#8aa4c0', '#8aa4c0', '#3080ff')],
  frostwisp: [GHOST,  { k: '#2a6a9a', w: '#aee8ff' }],
  // the volcano
  firebat:     [BAT,    { k: OUTLINE, p: '#f08030', e: '#ffee00', w: '#fff' }],
  salamander:  [DRAGON, { k: OUTLINE, g: '#e06020', y: '#ffee00', w: '#fff', r: '#701010' }],
  magmaslime:  [SLIME,  { k: OUTLINE, a: '#f06020', w: '#ffd75e', e: '#fff' }],
  lavagolem:   [KNIGHT, knight('#7a2a1a', '#5a1a10', '#30100a', '#ffb020', '#ff6020')],
  flamespirit: [GHOST,  { k: '#8a2000', w: '#ffb020' }],
  hellhound:   [WOLF,   { k: OUTLINE, g: '#7a2020', r: '#ffb020', w: '#e8e8e8' }],
  magmalord:   [BOSS,   { k: OUTLINE, r: '#f06020', d: '#30100a', y: '#30100a', e: '#fff', w: '#ffd75e' }],
};
for (const name in MONSTER_ART) SPRITES[name] = makeSprite(...MONSTER_ART[name]);

// which high-detail painter goes with which little shape
HI_ART.mimic = (p, c) => {                              // a chest that bites: lid thrown open, teeth, a long tongue
  const dark = tint(c.b, 0.6), light = tint(c.b, 1.3);
  p.poly(dark, 5, 44, 43, 44, 43, 27, 5, 27); p.poly(c.b, 7, 42, 41, 42, 41, 29, 7, 29);          // the box
  p.poly(c.g, 7, 34, 41, 34, 41, 37, 7, 37); p.el(24, 36, 3.5, 4, c.g); p.el(24, 36, 1.5, 2, '#111');   // band and lock
  p.poly(dark, 3, 20, 45, 20, 42, 6, 6, 6); p.poly(c.b, 5, 18, 43, 18, 40.5, 8, 7.5, 8);         // the lid, tipped back
  p.poly(light, 8, 10, 40, 10, 39.5, 12, 8.5, 12); p.poly(c.g, 5, 15, 43, 15, 43.4, 18, 4.6, 18);
  p.poly('#2a0810', 6, 20, 42, 20, 41, 29, 7, 29);                                              // the mouth
  for (let i = 0; i < 7; i++) { p.poly(c.w, 7 + i * 5, 20, 12 + i * 5, 20, 9.5 + i * 5, 25); p.poly(c.w, 7 + i * 5, 29, 12 + i * 5, 29, 9.5 + i * 5, 25.5); }   // teeth
  p.line(c.r, 5, 24, 27, 27, 33, 33, 37, 37, 34); p.line(tint(c.r, 1.3), 1.5, 25, 28, 28, 33);   // the tongue
  for (const s of [1, -1]) { const X = side(s); p.el(X(9), 13, 4, 3.4, '#ffe060'); p.el(X(9), 13.4, 1.4, 2.6, '#111'); }   // eyes on the lid
};
const HI_PAINTERS = new Map([
  [SLIME, HI_ART.slime], [BAT, HI_ART.bat], [WOLF, HI_ART.wolf], [SPIDER, HI_ART.spider], [GHOST, HI_ART.ghost],
  [BRUTE, HI_ART.brute], [KNIGHT, HI_ART.knight], [HUMAN, HI_ART.human],
  [BOSS, HI_ART.boss], [SKULLKING, HI_ART.skullking], [DRAGON, HI_ART.dragon], [MIMIC, HI_ART.mimic],
]);

// =====================================================================
// MAP TILES: drawn with a few rectangles each.
// A painter gets "v", a number 0-3 that differs from tile to tile, so it can vary
// the details a little. For water, v is the animation frame instead (0 or 1).
// =====================================================================
function R(g, color, x, y, w, h) { g.fillStyle = color; g.fillRect(x, y, w, h); }

// scatter a few small marks; "v" moves them around so neighbouring tiles differ
const SPECKS = [[2, 3], [9, 1], [13, 6], [5, 10], [11, 12], [1, 13], [7, 6]];
function specks(g, color, v, w = 2, count = 6) {
  for (let i = 0; i < count; i++) { const [x, y] = SPECKS[(i + v * 2) % SPECKS.length]; R(g, color, (x + v * 5) % 15, (y + v * 3) % 15, w, 1); }
}
const ground = (base, dark, light) => (g, v) => { R(g, base, 0, 0, 16, 16); specks(g, dark, v); specks(g, light, v + 1, 1, 3); };
const bricks = (g, base, brick, top) => {                  // a wall made of 4 rows of bricks
  R(g, base, 0, 0, 16, 16);
  for (let row = 0; row < 4; row++)
    for (let x = row % 2 ? -4 : 0; x < 16; x += 8) { R(g, brick, x + 1, row * 4 + 1, 6, 3); R(g, top, x + 1, row * 4 + 1, 6, 1); }
};
const roof = (main, line) => g => { R(g, main, 0, 0, 16, 16); for (const y of [3, 7, 11, 15]) R(g, line, 0, y, 16, 1); for (let i = 0; i < 4; i++) R(g, line, (i * 4 + 2) % 16, i * 4, 1, 3); };
const townIcon = (base, roofColor) => (g, v) => {          // a little house on the world map
  TILE_PAINTERS[base](g, v);
  R(g, '#00000030', 3, 14, 11, 2);
  R(g, '#e8d8b0', 3, 8, 10, 7); R(g, '#c9b78c', 3, 13, 10, 2);
  R(g, roofColor, 2, 5, 12, 3); R(g, roofColor, 4, 3, 8, 2); R(g, tint(roofColor, 0.75), 2, 7, 12, 1);
  R(g, '#6b4423', 7, 11, 2, 4); R(g, '#7fc4ee', 4, 10, 2, 2); R(g, '#7fc4ee', 10, 10, 2, 2);
};
const peak = (g, rock, dark, cap, capDark) => {            // a mountain shape
  for (let y = 2; y < 15; y++) {
    const half = Math.round((y - 2) * 0.55) + 1;
    R(g, y < 5 ? cap : rock, 8 - half, y, half, 1);
    R(g, y < 5 ? capDark : dark, 8, y, half, 1);
  }
  R(g, '#00000030', 1, 15, 14, 1);
};
const mouth = (g, glow) => { R(g, '#111', 5, 9, 6, 6); R(g, '#111', 6, 8, 4, 1); if (glow) { R(g, glow, 6, 12, 4, 3); R(g, '#111', 7, 12, 2, 1); } };

const TILE_PAINTERS = {
  '.': ground('#4caf50', '#3d9142', '#6cc66f'),            // grass
  ':': ground('#e3c887', '#cdb06c', '#f0dca4'),            // desert sand
  '*': ground('#eef4fa', '#cfdcea', '#ffffff'),            // snow
  '%': ground('#5a4a48', '#3e3230', '#7a3a2a'),            // volcanic ash
  ',': ground('#d2b278', '#b8975e', '#dcc08c'),            // dirt path
  '_': ground('#4a4250', '#3c3542', '#544b5c'),            // cave floor
  ';': ground('#a58a5a', '#93794c', '#b39868'),            // crypt floor
  'a': ground('#4a2a24', '#38201c', '#7a3020'),            // volcano cave floor
  '-': g => {                                              // tower floor (stone tiles)
    R(g, '#6f7896', 0, 0, 16, 16);
    R(g, '#5f6885', 0, 7, 16, 1); R(g, '#5f6885', 0, 15, 16, 1); R(g, '#5f6885', 7, 0, 1, 8); R(g, '#5f6885', 15, 8, 1, 8);
    R(g, '#7c86a4', 0, 0, 7, 1); R(g, '#7c86a4', 8, 8, 7, 1);
  },
  'f': (g, v) => {                                         // flowers
    TILE_PAINTERS['.'](g, v);
    for (const [x, y, c] of [[3, 4, '#ff5a5a'], [10, 3, '#ffe04a'], [6, 11, '#ffe04a'], [12, 10, '#ff8ad0']]) { R(g, c, x, y, 2, 2); R(g, '#fff', x, y, 1, 1); }
  },
  'T': (g, v) => {                                         // tree / forest
    TILE_PAINTERS['.'](g, v);
    R(g, '#00000030', 3, 13, 10, 2);
    R(g, '#6b4423', 7, 10, 2, 5); R(g, '#4a3222', 8, 10, 1, 5);
    R(g, '#1f6b2a', 4, 1, 8, 2); R(g, '#1f6b2a', 2, 3, 12, 5); R(g, '#1f6b2a', 3, 8, 10, 2);
    R(g, '#2f8f3c', 4, 2, 5, 3); R(g, '#2f8f3c', 3, 4, 3, 2); R(g, '#3fa84c', 5, 2, 2, 1);
    R(g, '#165220', 9, 7, 4, 2); R(g, '#165220', 11, 5, 2, 2);
  },
  'P': (g, v) => {                                         // snowy pine
    TILE_PAINTERS['*'](g, v);
    R(g, '#00000020', 4, 14, 8, 1);
    R(g, '#6b4423', 7, 12, 2, 3);
    for (let i = 0; i < 4; i++) { R(g, '#1f5a3a', 7 - i, 2 + i * 3, 2 + i * 2, 3); R(g, '#ffffff', 7 - i, 2 + i * 3, 2 + i * 2, 1); }
  },
  '^': (g, v) => { TILE_PAINTERS['.'](g, v); peak(g, '#9a9a9a', '#6e6e6e', '#ffffff', '#dddddd'); },   // mountain
  '~': (g, v) => {                                         // water (two frames of waves)
    R(g, '#2f73d8', 0, 0, 16, 16);
    for (const [x, y, w] of [[2, 4, 4], [9, 7, 5], [3, 11, 4], [11, 13, 3]]) { R(g, '#6ea8f5', (x + v * 3) % 13, y, w, 1); R(g, '#2463c0', (x + v * 3 + 1) % 13, y + 1, w, 1); }
  },
  '=': g => {                                              // bridge
    R(g, '#8b5a2b', 0, 0, 16, 16);
    for (const x of [3, 7, 11, 15]) R(g, '#6b4423', x, 0, 1, 16);
    R(g, '#5a3a1a', 0, 0, 16, 2); R(g, '#5a3a1a', 0, 14, 16, 2); R(g, '#a8733a', 0, 2, 16, 1);
  },
  'H': townIcon('.', '#c0392b'),                           // Greenvale
  'J': townIcon('.', '#2f6fb5'),                           // Sunreach
  'K': townIcon('.', '#3d8f55'),                           // Starfall
  'L': townIcon('.', '#e08a2a'),                           // Port Coral
  '#': g => {                                              // house wall with window
    R(g, '#e8d8b0', 0, 0, 16, 16); R(g, '#d8c69a', 0, 0, 16, 1); R(g, '#c9b78c', 0, 15, 16, 1);
    R(g, '#6b4423', 4, 3, 8, 8); R(g, '#7fc4ee', 5, 4, 6, 6); R(g, '#bfe3ff', 5, 4, 2, 2); R(g, '#6b4423', 7, 4, 1, 6); R(g, '#6b4423', 5, 6, 6, 1);
  },
  'R': roof('#c0392b', '#962d22'), 'r': roof('#2f6fb5', '#235488'), 'e': roof('#3d8f55', '#2c6b3f'), 'y': roof('#e08a2a', '#b06a1a'),
  'D': g => {                                              // door
    R(g, '#e8d8b0', 0, 0, 16, 16);
    R(g, '#4a3222', 2, 1, 12, 15); R(g, '#6b4423', 3, 2, 10, 14); R(g, '#7d5230', 3, 2, 4, 14);
    R(g, '#f1c40f', 10, 9, 2, 2);
  },
  'A': (g, v) => { TILE_PAINTERS['*'](g, v); peak(g, '#aab8c8', '#7d8c9e', '#ffffff', '#dfe8f0'); },   // snowy mountain
  'U': (g, v) => { TILE_PAINTERS['%'](g, v); peak(g, '#5a3a34', '#3a2420', '#7a4a40', '#4a2e28'); },   // ash mountain
  'C': (g, v) => { TILE_PAINTERS['^'](g, v); mouth(g); },  // cave mouth in the mountains
  'O': (g, v) => { TILE_PAINTERS['%'](g, v); peak(g, '#5a3a34', '#3a2420', '#ff6020', '#c03010'); mouth(g, '#ff8030'); },   // volcano
  'I': (g, v) => {                                         // the tower on the world map
    TILE_PAINTERS[':'](g, v);
    R(g, '#00000030', 5, 14, 8, 2);
    R(g, '#3d4870', 5, 3, 6, 12); R(g, '#525e8c', 5, 3, 2, 12);
    for (const x of [4, 7, 10]) R(g, '#3d4870', x, 1, 2, 2);
    R(g, '#111', 7, 11, 2, 4); R(g, '#ffe04a', 7, 6, 2, 2);
  },
  'h': (g, v) => {                                         // the hermit's hut
    TILE_PAINTERS['*'](g, v);
    R(g, '#8b5a2b', 3, 8, 10, 7); R(g, '#6b4423', 3, 12, 10, 1);
    R(g, '#ffffff', 2, 5, 12, 3); R(g, '#ffffff', 4, 3, 8, 2); R(g, '#cfdcea', 2, 7, 12, 1);
    R(g, '#3a2413', 7, 11, 2, 4); R(g, '#ffe04a', 10, 10, 2, 2);
  },
  'W': g => {                                              // cave wall
    R(g, '#241d2b', 0, 0, 16, 16);
    for (const [x, y, w, h] of [[1, 1, 6, 5], [9, 2, 6, 6], [2, 8, 5, 6], [9, 10, 5, 5]]) { R(g, '#3a3044', x, y, w, h); R(g, '#4b4058', x, y, w, 1); R(g, '#2c2434', x, y + h - 1, w, 1); }
  },
  'Q': g => bricks(g, '#4a3a20', '#7a6038', '#927648'),    // crypt wall (sandstone)
  'w': g => bricks(g, '#1d2338', '#3d4870', '#525e8c'),    // tower wall (blue stone)
  'm': g => {                                              // volcano cave wall, with glowing cracks
    R(g, '#1c0c0a', 0, 0, 16, 16);
    for (const [x, y, w, h] of [[1, 1, 6, 5], [9, 2, 6, 6], [2, 8, 5, 6], [9, 10, 5, 5]]) { R(g, '#3a1c16', x, y, w, h); R(g, '#4e261c', x, y, w, 1); }
    R(g, '#ff6020', 7, 4, 1, 4); R(g, '#ff6020', 8, 7, 1, 3); R(g, '#ffb020', 7, 6, 1, 1);
  },
  // ---- things that stand ON the floor (the floor is drawn first, see drawExplore) ----
  '<': g => { for (let i = 0; i < 4; i++) { R(g, i % 2 ? '#d0c8dc' : '#a39bb4', 2, 2 + i * 3, 4 + i * 3, 3); R(g, '#6e667c', 2, 4 + i * 3, 4 + i * 3, 1); } },   // stairs (bright steps)
  '>': g => { R(g, '#111', 2, 2, 12, 12); for (let i = 0; i < 4; i++) R(g, '#6e667c', 2, 2 + i * 3, 12 - i * 3, 2); },                                                 // stairs (dark hole)
  'E': g => { R(g, '#111', 2, 1, 12, 15); R(g, '#cfeaff', 3, 2, 10, 14); R(g, '#ffffff', 5, 5, 6, 11); },                                                              // way out: daylight
  '$': g => {                                              // treasure chest
    R(g, '#00000030', 2, 13, 13, 2);
    R(g, '#3a2413', 2, 4, 12, 10); R(g, '#a0661f', 3, 5, 10, 8); R(g, '#c98a3a', 3, 5, 10, 1);
    R(g, '#3a2413', 3, 8, 10, 1); R(g, '#f1c40f', 7, 7, 2, 3);
  },
  '$+': g => {                                             // New Game+ chest: royal blue with gold bands and a ruby
    R(g, '#00000030', 2, 13, 13, 2);
    R(g, '#1a1040', 2, 3, 12, 11); R(g, '#3a3fc0', 3, 4, 10, 9); R(g, '#6a78f0', 3, 4, 10, 1);
    R(g, '#f1c40f', 3, 8, 10, 1); R(g, '#f1c40f', 4, 4, 1, 9); R(g, '#f1c40f', 11, 4, 1, 9);
    R(g, '#f1c40f', 6, 6, 4, 5); R(g, '#d02040', 7, 7, 2, 3); R(g, '#ff8098', 7, 7, 1, 1);
  },
  'o': g => {                                              // opened chest
    R(g, '#00000030', 2, 13, 13, 2);
    R(g, '#3a2413', 2, 7, 12, 7); R(g, '#a0661f', 3, 8, 10, 5);
    R(g, '#111', 3, 8, 10, 2); R(g, '#3a2413', 2, 3, 12, 3); R(g, '#a0661f', 3, 4, 10, 1);
  },
};
TILE_PAINTERS['X'] = TILE_PAINTERS[','];                   // town exit looks like path
TILE_PAINTERS['c'] = TILE_PAINTERS['V'] = TILE_PAINTERS['v'] = TILE_PAINTERS['C'];
TILE_PAINTERS['S'] = TILE_PAINTERS['E'];
const OBJECT_TILES = '<>ES$o';                             // drawn on top of the map's floor tile

const tileCache = {};
function tileImage(ch, v = 0) {
  const key = ch + v;
  if (!tileCache[key]) {
    const c = document.createElement('canvas');
    c.width = c.height = 16;
    (TILE_PAINTERS[ch] || TILE_PAINTERS['.'])(c.getContext('2d'), v);
    tileCache[key] = c;
  }
  return tileCache[key];
}

// ---- text and window helpers ----
function drawText(str, x, y, color = '#fff', align = 'left') {
  ctx.font = FONT; ctx.textBaseline = 'top'; ctx.textAlign = align;
  ctx.fillStyle = '#000'; ctx.fillText(str, x + 1, y + 1);   // little shadow
  ctx.fillStyle = color;  ctx.fillText(str, x, y);
}
function textWidth(str) { ctx.font = FONT; return ctx.measureText(str).width; }

function drawWindow(x, y, w, h) {
  R(ctx, '#000000', x + 1, y, w - 2, h); R(ctx, '#000000', x, y + 1, w, h - 2);          // dark edge with clipped corners
  R(ctx, '#ffffff', x + 2, y + 1, w - 4, h - 2); R(ctx, '#ffffff', x + 1, y + 2, w - 2, h - 4);
  R(ctx, '#10184a', x + 2, y + 2, w - 4, h - 4);
  R(ctx, '#1b2a7a', x + 3, y + 3, w - 6, h - 6);
  R(ctx, '#2a3c98', x + 3, y + 3, w - 6, 1);                                             // soft shine along the top
}

// break a long string into lines that fit in maxWidth pixels
function wrapText(str, maxWidth) {
  const maxChars = Math.floor(maxWidth / textWidth('M'));
  const lines = [];
  let line = '';
  for (const word of String(str).split(' ')) {
    if (line && (line + ' ' + word).length > maxChars) { lines.push(line); line = word; }
    else line = line ? line + ' ' + word : word;
  }
  lines.push(line);
  return lines;
}

// The game draws the sword pointer itself at the mouse position (see drawPointer in main.js),
// so the normal arrow is switched off while the mouse is over the game.
canvas.style.cursor = 'none';
