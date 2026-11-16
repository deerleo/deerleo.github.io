/* 《潮汐战线》像素美术：空军单位（棋子尺度版）
 * cop 武装直升机 / tcp 运输直升机 / atk 攻击机 / bmb 轰炸机 / ftr 战斗机
 * 接口见 tools/ART-SPEC.md：AWArtUnits[type](c, info)，朝右画，可画范围 x 0–32、y −4–32。
 * 直升机画侧面；固定翼画 3/4 俯视：远侧机翼（上）短而暗，近侧机翼（下）长而亮。外轮廓统一 1 像素阵营 o 色。 */
(function () {
  'use strict';
  var U = window.AWArtUnits = window.AWArtUnits || {};

  /* ───────── 棋子尺度的公共小工具（四个单位模块各带一份，互不依赖） ─────────
   * 每个单位先画到 32×36 的离屏小画布（y −4 到 32），按 兵种+帧+行进+阵营色 缓存；
   * 画完自动描一圈 1 像素的阵营 o 色外轮廓。中性色只用 ART-SPEC 定稿调色板里的金属、玻璃、木、火几组，整体偏亮。 */
  var W = 32, H = 36, TOP = 4;
  var SHADOW = 'rgba(50,60,110,.2)';
  var N = {
    '0': '#5c5c6a', '1': '#6e6e7a', '2': '#8c8c96', '3': '#b4b4be', '4': '#c4c4cc', '5': '#f4f4f8', 'x': '#ffffff',   // 金属、轮胎、履带
    's': '#ffd9b3', 'S': '#eeb080',                                   // 皮肤
    'g': '#52ccea', 'G': '#7adcf0', 'q': '#b0eef8',                   // 玻璃
    'r': '#d43a2a', 'f': '#ff7a2e', 'y': '#ffc24a', 'Y': '#f6e9a0',   // 火、灯、警示
    'k': '#6e4a34', 'w': '#b98250', 'W': '#e0b070',                   // 木、皮具
    'c': '#ecd8a8', 'C': '#f4e4b0'                                    // 帆布
  };
  var g = null, K = null, maps = {}, cache = {};
  function mkmap(p) {
    var key = p.o + p.d + p.m + p.l + p.h, m = maps[key], k;
    if (m) return m;
    m = {}; for (k in N) m[k] = N[k];
    m.o = p.o; m.d = p.d; m.m = p.m; m.l = p.l; m.h = p.h;
    return (maps[key] = m);
  }
  // 填一块：col 是调色板里的一个字符，或直接给颜色
  function R(col, x, y, w, h) {
    g.fillStyle = K[col] || col;
    g.fillRect(x, y, w === undefined ? 1 : w, h === undefined ? 1 : h);
  }
  function row(col, y, x0, x1) { R(col, x0, y, x1 - x0 + 1, 1); }
  // 字符画
  function S(rows, x, y) {
    for (var j = 0; j < rows.length; j++) {
      var r = rows[j];
      for (var i = 0; i < r.length; i++) {
        var ch = r.charAt(i);
        if (ch === '.' || ch === ' ') continue;
        g.fillStyle = K[ch]; g.fillRect(x + i, y + j, 1, 1);
      }
    }
  }
  // 粗斜线：沿长轴逐像素走，cols 是垂直于长轴方向叠起来的几层颜色
  function bar(x0, y0, x1, y1, cols) {
    var dx = x1 - x0, dy = y1 - y0, n = Math.max(Math.abs(dx), Math.abs(dy)), i, k, x, y;
    var steep = Math.abs(dy) > Math.abs(dx);
    for (i = 0; i <= n; i++) {
      x = Math.round(x0 + dx * i / n); y = Math.round(y0 + dy * i / n);
      for (k = 0; k < cols.length; k++) if (cols[k]) R(cols[k], steep ? x + k : x, steep ? y : y + k);
    }
  }
  // 给当前离屏画布上的不透明像素描一圈（四邻域）
  function ring(col) {
    var d = g.getImageData(0, 0, W, H).data, out = [], x, y;
    function op(xx, yy) { return xx >= 0 && yy >= 0 && xx < W && yy < H && d[(yy * W + xx) * 4 + 3] > 0; }
    for (y = 0; y < H; y++) for (x = 0; x < W; x++) {
      if (op(x, y)) continue;
      if (op(x, y - 1) || op(x - 1, y) || op(x, y + 1) || op(x + 1, y)) out.push(x, y);
    }
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = col;
    for (x = 0; x < out.length; x += 2) g.fillRect(out[x], out[x + 1], 1, 1);
    g.restore();
  }
  function Q(c, col, x, y, w, h) { c.fillStyle = N[col] || col; c.fillRect(x, y, w === undefined ? 1 : w, h === undefined ? 1 : h); }

  /* def: draw(f, mv, p) 描边前的实体；thin(f, mv, p) 描边后再画的小东西（不带轮廓）；
   *      sh: [x0, x1] 落地投影的左右范围；under(c, f, mv, p) / over(c, f, mv, p) 直接画在格子上、不进缓存的部分；
   *      lift: [4] 每帧整体上下浮动的像素数（飞机、船） */
  function reg(type, def) {
    U[type] = function (c, info) {
      var p = info.pal, f = (info.frame | 0) & 3, mv = !!info.moving;
      var k = type + '|' + f + '|' + (mv ? 1 : 0) + '|' + p.o + p.d + p.m + p.l + p.h;
      var cv = cache[k];
      if (!cv) {
        cv = document.createElement('canvas'); cv.width = W; cv.height = H;
        g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
        K = mkmap(p);
        g.translate(0, TOP);
        def.draw(f, mv, p);
        ring(p.o);
        if (def.thin) def.thin(f, mv, p);
        if (HALO) ring(HALO);
        cache[k] = cv; g = null;
      }
      if (def.under) def.under(c, f, mv, p);
      if (def.sh) {
        var a = def.sh[0], b = Math.min(31, def.sh[1] + 2);
        c.fillStyle = SHADOW;
        c.fillRect(a + 2, 27, b - a - 1, 3);
        c.fillRect(a + 3, 30, b - a - 3, 1);
      }
      c.drawImage(cv, 0, -TOP + (def.lift ? def.lift[f] : 0));
      if (def.over) def.over(c, f, mv, p);
    };
  }
  // 外光边：试过给所有单位加一圈半透明白边，草地上的绿方、水面上的蓝方靠深色 o 轮廓已经够清楚，加了反而发虚，默认关
  var HALO = null;

  // 行进扬尘：贴着车尾地面的几团沙色
  function dust(c, x, f) {
    var a = c.globalAlpha, y = 28;
    c.globalAlpha = a * 0.85;
    if (f === 0) { Q(c, 'c', x, y - 1, 3, 2); }
    else if (f === 1) { Q(c, 'c', x - 1, y - 2, 3, 3); Q(c, 'C', x - 1, y - 2, 2, 1); }
    else if (f === 2) { Q(c, 'C', x - 2, y - 4, 3, 2); Q(c, 'c', x, y - 1, 2, 2); }
    else { c.globalAlpha = a * 0.5; Q(c, 'C', x - 2, y - 5, 2, 2); Q(c, 'c', x, y - 1, 2, 1); }
    c.globalAlpha = a;
  }
  // 排气小烟：2×2 的浅灰团往左上飘
  function puff(c, x, y, f) {
    var a = c.globalAlpha;
    if (f === 0) Q(c, '5', x, y, 2, 2);
    else if (f === 1) { Q(c, '5', x - 1, y - 2, 2, 2); }
    else if (f === 2) { c.globalAlpha = a * 0.7; Q(c, '5', x - 2, y - 4, 3, 2); }
    else { c.globalAlpha = a * 0.4; Q(c, '5', x - 3, y - 6, 2, 2); }
    c.globalAlpha = a;
  }
  // 负重轮（6）、卡车轮（7）、吉普和摩托的大轮（8）；B 是行进时交替的另一相位
  var WHEEL6 = ['.3333.', '333333', '335533', '335523', '333322', '.3222.'];
  var WHEEL6B = ['.3333.', '333333', '332533', '335533', '333322', '.3222.'];
  var TIRE7 = ['.11111.', '1111111', '1133311', '1135311', '1133211', '1111111', '.11111.'];
  var TIRE7B = ['.11111.', '1111111', '1133311', '1153311', '1133211', '1111111', '.11111.'];
  var TIRE8 = ['..1111..', '.111111.', '11133111', '11355311', '11355211', '11132111', '.111111.', '..1111..'];
  var TIRE8B = ['..1111..', '.111111.', '11133111', '11535311', '11353211', '11132111', '.111111.', '..1111..'];
  // 履带：8 像素高的圆头长条，里面 n 个 6 像素负重轮；行进时履带板的刻痕按帧滚动
  function track(x, y, w, n, f, mv) {
    var i, k;
    row('1', y, x + 2, x + w - 3); row('1', y + 1, x + 1, x + w - 2);
    R('1', x, y + 2, w, 4);
    row('1', y + 6, x + 1, x + w - 2); row('1', y + 7, x + 2, x + w - 3);
    row('2', y, x + 2, x + w - 3);
    if (mv) for (i = x + 2; i <= x + w - 3; i++) { if ((i + f) % 3 === 0) { R('0', i, y); R('0', i - f % 2, y + 7); } }
    for (k = 0; k < n; k++) S(mv && (f & 1) ? WHEEL6B : WHEEL6, x + 1 + Math.round((w - 8) * k / (n - 1)), y + 1);
  }

  var LIFT = [0, 1, 1, 0];
  // 地面上的小投影：一小块椭圆，在格子底部偏右
  function airShadow(c, x, w) {
    c.fillStyle = SHADOW;
    c.fillRect(x + 2, 27, w - 4, 1); c.fillRect(x, 28, w, 2); c.fillRect(x + 2, 30, w - 4, 1);
  }
  // 旋翼：一圈半透明桨盘，加一根按帧伸缩的 2 像素桨叶
  function rotor(cx, y, half, f) {
    var a = [half, half - 4, 2, half - 4][f];
    R('rgba(255,255,255,.4)', cx - half, y, half * 2, 2);
    R('5', cx - a, y, a * 2, 1); R('2', cx - a, y + 1, a * 2, 1);
    R('1', cx - 1, y, 2, 2);
  }

  /* ───────────── 武装直升机 cop：单旋翼，细尾梁，大玻璃座舱，机腹挂火箭巢 ───────────── */
  var COP = [
    '...............22...............',
    '...............22...............',
    '.............lllllllll..........',
    '.ll.........llhhllllqqGG........',
    '.lml.......llllllllqGGGGg.......',
    '.lmmllllllllmmmmmmmqGGGGGg......',
    '.lmmmmmmmmmmmmmmmmmGGGGGGgm.....',
    '..dmmmmmmmmmmmmmmmmmggggmmmm....',
    '...ddddddmmmmmmmmmmmmmmmmmmmm...',
    '.........mmmmmmmmmmmmmmmmmmd....',
    '..........dmmmmmmmmmmmmmddd.....',
    '...........ddddddddddddd........',
    '............3333333.............',
    '............2222222r............',
    '.............22.....22..........',
    '...........22222222222222.......'
  ];
  reg('cop', {
    lift: LIFT,
    under: function (c) { airShadow(c, 9, 16); },
    draw: function (f) { S(COP, 0, 5); },
    thin: function (f) {
      rotor(15, 3, 13, f);
      if (f & 1) R('5', 0, 9, 4, 2); else R('5', 1, 7, 2, 6);    // 尾桨
    }
  });

  /* ───────────── 运输直升机 tcp：又长又胖的机身，前后两副旋翼，一排大舷窗 ───────────── */
  var TCP = [
    '....22...................22.....',
    '...llll.................llll....',
    '..llmmml...............llmmm....',
    '..lmmmmmlllllllllllllllmmmmmm...',
    '.llhhhllllllllllllllllllqqGGg...',
    '.lmmmmmmmmmmmmmmmmmmmmmqGGGGGg..',
    '.lmmGGGmmmGGGmmmGGGmmmmGGGGGGg..',
    '.lmmGGgmmmGGgmmmGGgmmmmmggggmm..',
    '.lmmgggmmmgggmmmgggmmmmmmmmmmm..',
    '.lmmmmmmmmmmmmmmmmmmmmmmmmmmmd..',
    '.mhhhhhhhhhhhhhhhhhhhhhmmmmmdd..',
    '.mmmmmmmmmmmmmmmmmmmmmmmmmmdd...',
    '..dddddddddddddddddddddddddd....',
    '.....22...............22........',
    '....1111.............1111.......',
    '....1111.............1111.......'
  ];
  reg('tcp', {
    lift: LIFT,
    under: function (c) { airShadow(c, 7, 20); },
    draw: function (f) { S(TCP, 0, 5); },
    thin: function (f) { rotor(7, 3, 7, f); rotor(24, 3, 7, (f + 2) & 3); }
  });

  /* ───────────── 攻击机 atk：短直机翼，机身背上两台灰色发动机，机头一门机炮 ───────────── */
  var ATK = [
    '................................',
    '............dddd................',
    '............dmmmd...............',
    '............dmmmd...............',
    '.ddd........dmmmmd..............',
    '.dmmd.3333..mmmmmm..............',
    '.dmmm.2222lllllllllllqqG........',
    '.llmmmlllllllllllllllqGGgll.....',
    '.lmmmmmmmmmmmmmmmmmmmmGGgmmm444.',
    '.lmmmmmmmmmmmmmmmmmmmmmmmmmm222.',
    '..mmmmmmmmmmmmmmmmmmmmmmmmmd....',
    '...ddddddddddddddddddddddd......',
    '......3333.hllllll..............',
    '......2222.hllllll..............',
    '...........hllllll..............',
    '...........hllllll..............',
    '...........hllllll..............',
    '...........hlllllm..............',
    '...........hlllllm..............',
    '............llllm...............',
    '............llll................'
  ];
  reg('atk', {
    lift: LIFT,
    under: function (c) { airShadow(c, 10, 14); },
    draw: function (f) { S(ATK, 0, 1); },
    thin: function (f) { R(f & 1 ? 'y' : 'f', 4, 6, 2, 2); R(f & 1 ? 'y' : 'f', 4, 13, 2, 2); }
  });

  /* ───────────── 轰炸机 bmb：最大，后掠长翼，两翼各挂一台大发动机 ───────────── */
  var BMB = [
    '...........dddd.................',
    '...........dmmmd................',
    '...........dmmmmd...............',
    '...........dmmmm33333...........',
    '............dmmm22222...........',
    '.dd.........dmmmmmd.............',
    '.dmd........dmmmmmmd............',
    '.dmmd.......mmmmmmmmm...........',
    '.lmmmllllllllllllllllllllqqGG...',
    '.lmmmmmllllllllllllllllllqGGGg..',
    '.lmmmmmmmmmmmmmmmmmmmmmmmGGGGgm.',
    '.lmmmmmmmmmmmmmmmmmmmmmmmmmmmmm.',
    '.lmmmmmmmmmmmmmmmmmmmmmmmmmmmd..',
    '..mmmmmmmmmmmmmmmmmmmmmmmmmdd...',
    '...dddddddddddddddddddddddd.....',
    '..hll......hlllllllll...........',
    '..hl.......hllllllll............',
    '..........hlllllll33333.........',
    '..........hlllllll22222.........',
    '.........hlllllll...............',
    '.........hllllll................',
    '........hllllll.................',
    '........hlllll..................',
    '.......hllll....................',
    '.......lll......................'
  ];
  reg('bmb', {
    lift: [0, 0, 1, 1],
    under: function (c) { airShadow(c, 9, 18); },
    draw: function (f) { S(BMB, 0, -2); }
  });

  /* ───────────── 战斗机 ftr：尖机头，三角翼，机尾一团喷焰 ───────────── */
  var FTR = [
    '..........ddd...................',
    '..........dmmd..................',
    '..........dmmmd.................',
    '...dd.....dmmmmd................',
    '...dmd....dmmmmmd...............',
    '...dmmd...mmmmmmmm..............',
    '...lmmlllllllllllllllqqGGl......',
    '...lmmmmmmmmmmmmmmmmmqGGGgmmhh..',
    '...lmmmmmmmmmmmmmmmmmmmmmmmmmmh.',
    '....ddddddddddddddddddddddd.....',
    '......hlllllllllllll............',
    '......hllllllllllll.............',
    '.......hllllllllll..............',
    '.......hlllllllll...............',
    '........hlllllll................',
    '........hllllll.................',
    '.........hllll..................',
    '.........hlll...................',
    '..........ll....................'
  ];
  reg('ftr', {
    lift: LIFT,
    under: function (c) { airShadow(c, 10, 14); },
    draw: function (f) { S(FTR, 0, 3); },
    thin: function (f) {
      R('f', 1, 10, 2, 3); R('y', 2, 11, 1, 1);
      if (f & 1) R('y', 0, 11, 1, 1);
    }
  });
})();
