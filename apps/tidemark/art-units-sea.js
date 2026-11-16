/* 《潮汐战线》海军单位像素画（棋子尺度版）：gbt 炮艇、dst 驱逐舰、sub 潜艇、bsh 战列舰、lnd 登陆艇。
   接口见 tools/ART-SPEC.md：AWArtUnits[type](c, info)，朝右画，可画范围 x 0–32、y −4–32。
   每艘船是一个大船体加两三个大块的上层建筑和明显的主炮；外轮廓统一 1 像素阵营 o 色；
   水线的白浪直接画在格子上，不随船浮动。 */
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

  var LIFT = [0, 0, 1, 1];
  // 船体：顶上一行亮色甲板沿，中间主色，底下两行暗色。sr / br 是船尾、船头往水线收进去的像素数
  function hull(x0, x1, yd, yw, sr, br) {
    var n = yw - yd, y, t, xl, xr;
    for (y = yd; y <= yw; y++) {
      t = (y - yd) / n;
      xl = x0 + Math.round(sr * t * t); xr = x1 - Math.round(br * t);
      row(y === yd ? 'l' : y >= yw - 1 ? 'd' : 'm', y, xl, xr);
      if (y === yd) R('h', xl, y, 4, 1);
      else if (y < yw - 1) R('l', xl, y);
    }
  }
  // 一个方块：顶行亮、左列亮、右列暗
  function block(x, y, w, h) {
    R('m', x, y, w, h); R('l', x, y, w, 1); R('l', x, y, 1, h); R('d', x + w - 1, y + 1, 1, h - 1);
  }
  function glass(x, y, w, h) { R('G', x, y, w, h); R('q', x, y, w - 1, 1); R('g', x, y + h - 1, w, 1); }
  // 3 像素粗的炮管，dir 1 朝右、−1 朝左
  function gun(x, y, len, dir) {
    if (dir < 0) x -= len - 1;
    R('4', x, y, len, 1); R('3', x, y + 1, len, 1); R('2', x, y + 2, len, 1);
    R('1', dir < 0 ? x : x + len - 1, y, 1, 3);
  }
  function funnel(x, y, w, h) {
    R('3', x, y, w, h); R('4', x, y, 1, h); R('2', x + w - 1, y, 1, h);
    R('1', x, y, w, 2); R('m', x, y + 3, w, 2);
  }
  // 水线：一条白浪压住船底，船头翻起一小团，船尾拖两点
  function foam(c, f, xa, xb, bow) {
    var x, k;
    c.fillStyle = SHADOW; c.fillRect(xa + 2, 29, xb - xa, 2);
    for (x = xa; x <= xb; x++) {
      k = (x + f * 3) % 7;
      Q(c, k === 0 ? 'q' : 'x', x, 28);
      if (k === 2 || k === 3) Q(c, 'x', x, 29);
    }
    if (bow) { Q(c, 'x', xb - 1, 27 - (f & 1), 3, 1 + (f & 1)); Q(c, 'q', xb - 3, 27, 2, 1); }
    Q(c, f & 1 ? 'x' : 'q', Math.max(0, xa - 2 - (f & 1)), 28, 2, 1);
  }
  function smoke(c, f, x, y) {
    var a = c.globalAlpha;
    c.globalAlpha = a * [1, 0.85, 0.6, 0.35][f];
    Q(c, '5', x - f, y - f * 2, 2 + (f > 0 ? 1 : 0), 2);
    c.globalAlpha = a;
  }

  /* ───────────── 炮艇 gbt：小艇，一间大驾驶舱，船头一门大炮 ───────────── */
  reg('gbt', {
    lift: LIFT,
    draw: function () {
      hull(3, 28, 19, 27, 2, 5);
      block(7, 9, 10, 10);
      glass(11, 11, 6, 4);
      R('2', 9, 4, 2, 5); R('5', 9, 3, 2, 1);                    // 桅杆
      block(18, 14, 6, 5); R('h', 19, 15, 2, 1);                 // 炮塔
      gun(24, 15, 6, 1);
    },
    over: function (c, f) { foam(c, f, 4, 27, 1); }
  });

  /* ───────────── 驱逐舰 dst：又长又矮，一根烟囱、一座舰桥、船头一门炮，桅顶雷达在转 ───────────── */
  reg('dst', {
    lift: LIFT,
    draw: function (f) {
      hull(1, 30, 20, 27, 2, 6);
      funnel(6, 11, 4, 9);
      block(11, 15, 12, 5);                                      // 舰桥下层
      block(13, 9, 7, 6); glass(15, 11, 5, 2);                   // 舰桥上层
      R('2', 15, 3, 2, 6);                                       // 桅杆
      var w = [8, 4, 2, 4][f];
      R(f === 2 ? '3' : '5', 16 - (w >> 1), 2, w, 2);            // 雷达
      block(23, 16, 4, 4); gun(27, 16, 3, 1);                    // 前主炮
      block(2, 17, 3, 3);                                        // 尾部深弹架
    },
    over: function (c, f) { smoke(c, f, 7, 8 + LIFT[f]); foam(c, f, 2, 28, 1); }
  });

  /* ───────────── 潜艇 sub：圆滚滚的艇身半露水面，中间一座指挥塔，潜望镜 ───────────── */
  var SUB = [
    '.......hhhhhhhhhhhhhhhhh......',
    '....llhhhllllllllllllllllll...',
    '..llllllllllllllllllllllllllm.',
    '.llmmmmmmmmmmmmmmmmmmmmmmmmmmm',
    'lmmmmmmmmmmmmmmmmmmmmmmmmmmmmm',
    'lmmmmmmmmmmmmmmmmmmmmmmmmmmmmd',
    '.mmmmmmmmmmmmmmmmmmmmmmmmmmmdd',
    '..dddddddddddddddddddddddddd..'
  ];
  reg('sub', {
    lift: LIFT,
    draw: function () {
      R('m', 2, 16, 3, 5); R('l', 2, 16, 1, 5); R('l', 2, 16, 3, 1);   // 尾舵
      S(SUB, 1, 20);
      block(12, 9, 9, 11); R('l', 12, 9, 9, 1); R('h', 13, 9, 3, 1);
      glass(15, 11, 6, 3);
      R('2', 15, 2, 2, 7); R('2', 15, 2, 4, 2); R('q', 18, 2, 1, 2);   // 潜望镜
    },
    over: function (c, f) { foam(c, f, 2, 30, 0); }
  });

  /* ───────────── 战列舰 bsh：高船体，中间三层塔楼，前面一高一低两座主炮、后面一座，粗长炮管 ───────────── */
  reg('bsh', {
    lift: LIFT,
    draw: function (f) {
      hull(1, 30, 18, 27, 2, 4);
      R('h', 4, 23, 22, 1);                                      // 腰线
      block(4, 14, 5, 4); gun(3, 14, 3, -1);                     // 后主炮
      funnel(10, 9, 3, 9);
      block(13, 13, 7, 5);                                       // 塔楼三层
      block(13, 8, 6, 5); glass(15, 9, 4, 2);
      block(14, 3, 4, 5); R('q', 15, 5, 3, 1);
      block(20, 13, 3, 5);                                        // 炮座
      block(20, 9, 5, 4); gun(25, 9, 5, 1);                      // 前主炮（高）
      block(22, 14, 5, 4); gun(27, 14, 3, 1);                    // 前主炮（低）
    },
    over: function (c, f) { smoke(c, f, 10, 6 + LIFT[f]); foam(c, f, 2, 29, 1); }
  });

  /* ───────────── 登陆艇 lnd：又宽又方的平底船，船尾驾驶楼，船头一块竖起的灰色跳板，舱里一只货箱 ───────────── */
  reg('lnd', {
    lift: LIFT,
    draw: function () {
      R('d', 9, 14, 16, 3);                                      // 远侧舷墙
      R('c', 13, 9, 8, 7); R('C', 13, 9, 8, 1); R('W', 13, 12, 8, 1); R('W', 16, 9, 2, 7);   // 货箱
      R('m', 1, 17, 24, 11); R('l', 1, 17, 24, 1); R('h', 2, 17, 4, 1); R('l', 1, 18, 1, 8);
      R('d', 1, 26, 24, 2); R('h', 4, 21, 18, 2);                // 舷侧识别带
      block(2, 7, 8, 10); glass(5, 9, 5, 3);                     // 驾驶楼
      // 跳板
      bar(24, 27, 27, 9, ['5', '4', '4', '2']);
    },
    over: function (c, f) { foam(c, f, 1, 30, 0); }
  });
})();
