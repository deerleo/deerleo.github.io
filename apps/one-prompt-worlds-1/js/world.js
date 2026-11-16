/* ぽん、と森は灯る — world layout (pure data) */
(function (root) {
  'use strict';

  function build() {
    var W = 6200, H = 2400;
    var w = {
      W: W, H: H, moss: [], rivers: [], rocks: [], thorns: [], walls: [], bells: [], gates: [],
      wilds: [], fireflies: [], mother: { x: 560, y: 1250 }, rooms: [], arena: null
    };
    var moss = function (x, y, r) { w.moss.push({ x: x, y: y, r: r }); };
    var rock = function (x, y, r) { w.rocks.push({ x: x, y: y, r: r }); };
    var thorn = function (x, y, r) { w.thorns.push({ x: x, y: y, r: r || 30 }); };
    var wall = function (ax, ay, bx, by, r) { w.walls.push({ ax: ax, ay: ay, bx: bx, by: by, r: r || 36 }); };
    var bell = function (x, y, g) { w.bells.push({ x: x, y: y, group: g }); };
    var wild = function (x, y, s, hits) { w.wilds.push({ x: x, y: y, size: s, hits: hits }); };
    var ff = function (x, y) { w.fireflies.push({ x: x, y: y }); };
    var log = function (ax, ay, bx, by) { w.walls.push({ ax: ax, ay: ay, bx: bx, by: by, r: 13, log: true, rest: 0.85 }); };

    // outer bounds
    wall(40, 40, W - 40, 40); wall(40, H - 40, W - 40, H - 40);
    wall(40, 40, 40, H - 40); wall(W - 40, 40, W - 40, H - 40);

    // room dividers with a gated gap
    function divider(x, gy, group) {
      wall(x, 40, x, gy - 96); wall(x, gy + 96, x, H - 40);
      w.gates.push({ group: group, ax: x, ay: gy - 70, bx: x, by: gy + 70, r: 20, x: x, y: gy });
    }

    /* ---- Room 0 : home hollow ---- */
    w.rooms.push({ name: 'home', x0: 40, x1: 1300 });
    moss(560, 1250, 330); moss(860, 1180, 260); moss(1070, 1250, 190); moss(700, 1500, 200);
    rock(905, 1440, 42); rock(330, 1010, 50); rock(1010, 930, 46);
    ff(800, 1090); ff(960, 1370); ff(660, 1570); ff(390, 1120);
    divider(1300, 1250, 1);
    bell(1180, 1010, 1);

    /* ---- Room 1 : stepping stones ---- */
    w.rooms.push({ name: 'stones', x0: 1300, x1: 2500 });
    moss(1500, 1250, 150);
    wild(1612, 1196, 1, 1);
    moss(1850, 980, 100); ff(1850, 940);
    moss(2180, 1180, 110); ff(2200, 1210);
    moss(1900, 1620, 110); ff(1870, 1640); ff(1945, 1600);
    rock(1700, 1330, 44); rock(2030, 1390, 50); rock(1640, 880, 40); rock(2240, 1420, 38);
    thorn(2015, 1080, 34);
    moss(2260, 880, 105);
    divider(2500, 880, 2);
    log(2240, 676, 2440, 676);
    bell(2290, 745, 2); bell(2405, 790, 2);

    /* ---- Room 2 : the stream ---- */
    w.rooms.push({ name: 'stream', x0: 2500, x1: 3750 });
    moss(2680, 900, 140); moss(2720, 1150, 150); moss(2700, 1400, 130);
    wild(2812, 1150, 4);
    w.rivers.push({ pts: [[3060, -60], [3100, 600], [3040, 1250], [3110, 1800], [3090, 2120]], hw: 150 });
    moss(3090, 2150, 125); ff(3050, 2170); ff(3120, 2200); ff(3100, 2110);
    moss(3420, 1900, 115); moss(3500, 1620, 110); ff(3500, 1640);
    moss(3500, 1000, 150); moss(3520, 1300, 150);
    ff(2690, 1420); ff(3480, 900);
    rock(2620, 640, 48); rock(3380, 720, 44); rock(3560, 2080, 50);
    divider(3750, 1150, 3);
    bell(3505, 1100, 3); bell(3580, 1140, 3); bell(3645, 1055, 3);
    wild(3660, 1180, 3);

    /* ---- Room 3 : the far bank ---- */
    w.rooms.push({ name: 'thorns', x0: 3750, x1: 5000 });
    moss(3930, 1150, 140);
    wild(4045, 1140, 2, 4);
    moss(4690, 1060, 115); ff(4690, 1020); ff(4380, 1100);
    w.rivers.push({ pts: [[4930, -60], [4900, 700], [4885, 1250], [4720, 1620], [4660, 1885]], hw: 85 });
    moss(4640, 1950, 150); moss(4830, 1960, 120); moss(4730, 2070, 120);
    // thorn hedge around the hidden garden (open only where the river runs in)
    (function () {
      var cx = 4740, cy = 1950, R = 340;
      for (var a = 40; a <= 320; a += 9) {
        var ang = a * Math.PI / 180;
        var x = cx + Math.cos(ang) * R, y = cy + Math.sin(ang) * R * 0.95;
        if (x > 4950) continue;
        if (PonSimRiver(w, x, y, 34)) continue;
        thorn(x, y, 30);
      }
      thorn(4938, 1690, 30); thorn(4938, 2212, 30);
    })();
    rock(4250, 1500, 52); rock(4420, 760, 46); rock(4120, 1820, 44);
    ff(4250, 1400); ff(4600, 2040);
    divider(5000, 1950, 4);
    bell(4640, 1930, 4); bell(4700, 1930, 4); bell(4760, 1930, 4); bell(4840, 2022, 4);

    /* ---- Room 4 : the great tree ---- */
    w.rooms.push({ name: 'tree', x0: 5000, x1: W - 40 });
    moss(5200, 1950, 130); moss(5370, 1720, 110); ff(5370, 1740);
    // the hollow among the great tree's roots: a springy bowl with five bells
    var P = root.PON_ARENA || {};
    var A = { x: 5640, y: 1290, R: P.R || 215, open: 128, tx: 5640, ty: 0, tr: 200, bellR: P.bellR || 115 };
    A.ty = A.y - A.R - A.tr + 70;
    w.arena = A;
    moss(A.x, A.y, A.R - 22);
    (function () {
      var n = 26, prev = null;
      for (var k = 0; k <= n; k++) {
        var deg = A.open + 22 + (360 - 44) * k / n, ang = deg * Math.PI / 180;
        var p = { x: A.x + Math.cos(ang) * A.R, y: A.y + Math.sin(ang) * A.R };
        if (prev) w.walls.push({ ax: prev.x, ay: prev.y, bx: p.x, by: p.y, r: 26, rest: P.rest || 0.95, root: true });
        prev = p;
      }
    })();
    w.rocks.push({ x: A.tx, y: A.ty, r: A.tr, rest: 0.95, trunk: true });
    w.gates.push({ group: 5, final: true, x: A.tx, y: A.ty });
    (function () {
      for (var k = 0; k < 5; k++) {
        var ang = (-90 + k * 72) * Math.PI / 180;
        bell(A.x + Math.cos(ang) * A.bellR, A.y + Math.sin(ang) * A.bellR, 5);
      }
    })();
    ff(5900, 1700); ff(5380, 1120);
    return w;
  }

  // helper used during layout only: is (x,y) within `pad` of a river?
  function PonSimRiver(w, x, y, pad) {
    for (var r = 0; r < w.rivers.length; r++) {
      var rv = w.rivers[r], p = rv.pts;
      for (var s = 0; s < p.length - 1; s++) {
        var ax = p[s][0], ay = p[s][1], ex = p[s + 1][0] - ax, ey = p[s + 1][1] - ay;
        var t = ((x - ax) * ex + (y - ay) * ey) / (ex * ex + ey * ey);
        t = Math.max(0, Math.min(1, t));
        var dx = x - (ax + ex * t), dy = y - (ay + ey * t);
        if (dx * dx + dy * dy < (rv.hw + pad) * (rv.hw + pad)) return true;
      }
    }
    return false;
  }

  var api = { build: build };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.PonWorld = api;
})(typeof window !== 'undefined' ? window : globalThis);
