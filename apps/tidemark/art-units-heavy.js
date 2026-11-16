// 《潮汐战线》陆军重装单位像素画（棋子尺度版）：tnk med hvy art rkt aa sam
// 规范见 tools/ART-SPEC.md。车辆 26–30 像素宽，炮塔、炮管、履带各是一整块；外轮廓统一 1 像素阵营 o 色。
// 单位朝右；偶数阵营的镜像由壳层负责。
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

  function gun(x, y, len) {          // 3 像素粗的平炮管，炮口一截深一级
    R('4', x, y, len, 1); R('3', x, y + 1, len, 1); R('2', x, y + 2, len, 1);
    R('2', x + len - 2, y, 2, 3); R('3', x + len - 2, y, 2, 1);
  }

  /* ───────────── 轻型坦克 tnk：最小，圆顶炮塔，短炮 ───────────── */
  var HULL_S = [
    '..lllllllllllllllllll....',
    '.lhhhllllllllllllllllll..',
    'lmmmmmmmmmmmmmmmmmmmmmmyy',
    'mmmmmmmmmmmmmmmmmmmmmmmyy',
    'mmmmmmmmmmmmmmmmmmmmmmmdd',
    '.ddddddddddddddddddddddd.'
  ];
  var DOME = [
    '...lllllll...',
    '.llhhlllllmm.',
    'llhhllllmmmmm',
    'lllllmmmmmmmm',
    'lmmmmmmmmmmmd',
    'lmmmmmmmmmmdd',
    'mmmmmmmmmmmdd',
    '.ddddddddddd.'
  ];
  reg('tnk', {
    sh: [4, 26],
    draw: function (f, mv) {
      var j = f & 1;
      track(4, 21, 23, 3, f, mv);
      gun(20, 10 + j, 9);
      S(HULL_S, 3, 15 + j);
      S(DOME, 8, 7 + j);
    },
    over: function (c, f, mv) { if (mv) dust(c, 2, f); }
  });

  /* ───────────── 中型坦克 med：棱角炮塔带车长塔，长炮管加炮口制退器 ───────────── */
  var HULL_M = [
    '...llllllllllllllllllllll.....',
    '..lhhhllllllllllllllllllll....',
    '.lmmmmmmmmmmmmmmmmmmmmmmmmmm..',
    'lmmmmmmmmmmmmmmmmmmmmmmmmmmmyy',
    'mmmmmmmmmmmmmmmmmmmmmmmmmmmmyy',
    'mmmmmmmmmmmmmmmmmmmmmmmmmmmmdd',
    '.dddddddddddddddddddddddddddd.'
  ];
  var TUR_M = [
    '....lmmmmd.......',
    '....lmmmmd.......',
    '..lllllllllllll..',
    '.lhhhllllllllllm.',
    'llllllllllllllmmm',
    'lmmmmmmmmmmmmmmmm',
    'lmmmmmmmmmmmmmmmd',
    'lmmmmmmmmmmmmmmdd',
    'lmmmmmmmmmmmmmdd.',
    'mmmmmmmmmmmmmdd..',
    '.dddddddddddd....'
  ];
  reg('med', {
    sh: [2, 29],
    draw: function (f, mv) {
      var j = f & 1;
      track(2, 21, 28, 4, f, mv);
      gun(20, 8 + j, 8);
      R('3', 27, 6 + j, 3, 7); R('4', 27, 6 + j, 3, 1); R('2', 27, 12 + j, 3, 1); R('1', 29, 8 + j, 1, 3);   // 炮口制退器
      S(HULL_M, 1, 14 + j);
      S(TUR_M, 5, 3 + j);
    },
    over: function (c, f, mv) { if (mv) dust(c, 1, f); }
  });

  /* ───────────── 重型坦克 hvy：最大，巨型炮塔，上下两根粗炮，履带外挂阵营色侧裙 ───────────── */
  var TUR_H = [
    '..lllllllllllllll..',
    '.lhhhhllllllllllm..',
    'llhhlllllllllllmmm.',
    'lllllllllllllmmmmmm',
    'lmmmmmmmmmmmmmmmmmm',
    'lmmmmmmmmmmmmmmmmmd',
    'lmmmmmmmmmmmmmmmmmd',
    'lmmmmmmmmmmmmmmmmdd',
    'mmmmmmmmmmmmmmmmmdd',
    '.ddddddddddddddddd.'
  ];
  var HULL_H = [
    '..llllllllllllllllllllllll....',
    '.lhhhlllllllllllllllllllllll..',
    'lmmmmmmmmmmmmmmmmmmmmmmmmmmmyy',
    'mmmmmmmmmmmmmmmmmmmmmmmmmmmmmd',
    'mmmmmmmmmmmmmmmmmmmmmmmmmmmmdd'
  ];
  reg('hvy', {
    sh: [1, 30],
    draw: function (f, mv) {
      var j = [0, 0, 1, 1][f], i, x;
      track(1, 21, 30, 5, f, mv);
      for (i = 0; i < 5; i++) {                                  // 侧裙：五块大板
        x = 1 + i * 6;
        R('m', x, 19, 5, 5); R('l', x, 19, 5, 1); R('d', x, 23, 5, 1);
        if (i < 4) R('o', x + 5, 19, 1, 5);
      }
      gun(21, 4 + j, 9); gun(21, 9 + j, 9);
      S(HULL_H, 1, 14 + j);
      S(TUR_H, 3, 3 + j);
    },
    over: function (c, f, mv) { if (mv) dust(c, 1, f); }
  });

  /* ───────────── 自行火炮 art：车尾一间方战斗室，一根粗长炮管斜指右上 ───────────── */
  var HULL_A = [
    '..lllllllllllllllllllll....',
    '.lhhhllllllllllllllllllll..',
    'lmmmmmmmmmmmmmmmmmmmmmmmmyy',
    'mmmmmmmmmmmmmmmmmmmmmmmmmyy',
    'mmmmmmmmmmmmmmmmmmmmmmmmmdd',
    '.ddddddddddddddddddddddddd.'
  ];
  var CABIN = [
    '.lllllllll.',
    'lhhllllllmm',
    'lmmmmmmmmmd',
    'lmmmmmmmmmd',
    'lmmmmmmmmmd',
    'lmmmmmmmmdd',
    'mmmmmmmmmdd'
  ];
  reg('art', {
    sh: [3, 28],
    draw: function (f, mv) {
      var j = f & 1;
      track(3, 21, 26, 4, f, mv);
      S(HULL_A, 2, 15 + j);
      bar(12, 10 + j, 27, 0 + j, ['4', '3', '3', '2']);          // 炮管
      R('2', 26, -1 + j, 4, 5); R('3', 26, -1 + j, 4, 1); R('1', 29, 0 + j, 1, 3);   // 炮口
      S(CABIN, 3, 8 + j);
      R('2', 11, 10 + j, 4, 5); R('3', 11, 10 + j, 4, 1);        // 炮架
    },
    over: function (c, f, mv) { if (mv) dust(c, 1, f); }
  });

  /* ───────────── 防空车 aa：履带，方盒炮塔，两根浅色细长高射炮斜指天，车尾一面转动的雷达 ───────────── */
  var BOX = [
    'llllllllllll',
    'lhhlllllllmm',
    'lmmmmmmmmmmd',
    'lmmmmmmmmmmd',
    'lmmmmmmmmmdd',
    'mmmmmmmmmmdd'
  ];
  reg('aa', {
    sh: [4, 27],
    draw: function (f, mv) {
      var j = f & 1;
      track(4, 21, 24, 3, f, mv);
      S(HULL_S, 3, 15 + j);
      bar(15, 8 + j, 25, -2 + j, ['5', '5', '3']);
      bar(19, 10 + j, 29, 0 + j, ['5', '5', '3']);
      S(BOX, 9, 9 + j);
      R('2', 15, 10 + j, 5, 4); R('3', 15, 10 + j, 5, 1);        // 炮座
      // 雷达：正面、侧面、背面、侧面
      R('2', 6, 8 + j, 2, 7);
      if (f === 0) { R('5', 4, 2 + j, 6, 1); R('5', 3, 3 + j, 8, 3); R('4', 4, 6 + j, 6, 1); R('3', 6, 3 + j, 2, 2); }
      else if (f === 2) { R('4', 4, 2 + j, 6, 1); R('3', 3, 3 + j, 8, 3); R('2', 4, 6 + j, 6, 1); }
      else { R('5', 5, 2 + j, 3, 5); R('3', 7, 3 + j, 1, 4); }
    },
    over: function (c, f, mv) { if (mv) dust(c, 2, f); }
  });

  /* ───────────── 卡车底盘（火箭炮、防空导弹共用）：三只轮子，车头驾驶室带大车窗 ───────────── */
  var CAB = [
    '.llllllll..',
    'lhhlllllmm.',
    'lmmqqGGGgm.',
    'lmmqGGGGgm.',
    'lmmGGGGGgmm',
    'lmmmmmmmmmm',
    'lmmmmmmmmyy',
    'lmmmmmmmmyy',
    'lmmmmmmmmmd',
    'mmmmmmmmmdd',
    'ddddddddddd'
  ];
  function truck(f, mv, j) {
    var wh = mv && (f & 1) ? TIRE7B : TIRE7;
    R('2', 3, 21, 26, 2);
    S(wh, 2, 22); S(wh, 10, 22); S(wh, 22, 22);
    R('m', 1, 17 + j, 20, 4); R('l', 1, 17 + j, 20, 1); R('h', 2, 17 + j, 3, 1); R('d', 1, 20 + j, 20, 1);
    S(CAB, 20, 10 + j);
  }

  /* ───────────── 火箭炮 rkt：卡车背一只斜架的阵营色发射箱，箱口露出红色弹头 ───────────── */
  reg('rkt', {
    sh: [2, 30],
    draw: function (f, mv) {
      var j = f & 1, x, yb;
      truck(f, mv, j);
      R('2', 12, 12 + j, 4, 5);                                  // 支架
      for (x = 1; x <= 20; x++) {
        yb = 16 - Math.floor((x - 1) * 7 / 19) + j;
        R('l', x, yb - 8, 1, 2); if (x < 8) R('h', x, yb - 8);
        R('m', x, yb - 6, 1, 2); R('d', x, yb - 4); R('m', x, yb - 3, 1, 3); R('d', x, yb);
      }
      // 箱口和弹头
      R('1', 21, 1 + j, 2, 8);
      R('r', 23, 1 + j, 3, 3); R('f', 23, 1 + j, 2, 1); R('r', 23, 5 + j, 3, 3); R('f', 23, 5 + j, 2, 1);
    },
    over: function (c, f, mv) { if (mv) dust(c, 1, f); }
  });

  /* ───────────── 防空导弹 sam：卡车背一枚又粗又长的白色导弹，红弹头，斜指右上 ───────────── */
  reg('sam', {
    sh: [2, 30],
    draw: function (f, mv) {
      var j = f & 1, x, y;
      truck(f, mv, j);
      R('2', 8, 12 + j, 4, 5); R('3', 8, 12 + j, 4, 1);          // 起竖架
      for (x = 1; x <= 29; x++) {
        y = 11 - Math.round((x - 1) * 12 / 28) + j;
        if (x <= 24) { R('x', x, y, 1, 2); R('5', x, y + 2, 1, 2); R('3', x, y + 4); }
        else if (x <= 27) { R('f', x, y, 1, 1); R('r', x, y + 1, 1, 4); }
        else R('r', x, y + 1 + (x - 28), 1, 3 - (x - 28) * 2);
        if (x >= 12 && x <= 14) { R('l', x, y); R('m', x, y + 1, 1, 3); R('d', x, y + 4); }   // 阵营色环
      }
      // 尾翼
      R('m', 1, 7 + j, 4, 3); R('l', 1, 7 + j, 4, 1); R('d', 1, 16 + j, 4, 3); R('m', 1, 16 + j, 4, 1);
      R(f & 1 ? 'y' : 'r', 17, 15 + j, 2, 2);                    // 警示灯
    },
    over: function (c, f, mv) { if (mv) dust(c, 1, f); }
  });
})();
