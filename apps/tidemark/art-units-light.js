/* 《潮汐战线》像素美术：陆军轻型单位（棋子尺度版）
 * inf 步兵 / mech 破甲兵 / snp 狙击手 / grn 投弹手 / flm 喷火兵 / bik 摩托兵 / rec 侦察车 / apc 运兵车 / rep 维修车
 * 接口见 tools/ART-SPEC.md：AWArtUnits[type](c, info)，朝右画，可画范围 x 0–32、y −4–32。
 * 步兵类 24–26 像素高、头占一半；车辆 28–30 宽；有意义的细节至少 3 像素；外轮廓统一 1 像素阵营 o 色。 */
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

  /* ───────────── 步兵 inf：大钢盔，步枪斜持在身前右侧，胸口整块阵营色 ───────────── */
  var HEAD = [
    '....llllllll.....',
    '..llhhllllllmm...',
    '.llhhlllllmmmmm..',
    '.llhllllmmmmmmm..',
    '.lllmmmmmmmmmmd..',
    '.lmmmmmmmmmmmdd..',
    'ddddddddddddddddd',
    '..SssssssssssS...',
    '..Sssssossosss...',
    '..Sssssossosss...',
    '...SSsssssssS....'
  ];
  var INF_BODY = [
    '...llmmmmmmd.....',
    '..llmmmmmmmmd....',
    '..lmmmmmmmmmd....',
    '..lmmmmmmmmmd....',
    '..lmmmmmmmmmd....',
    '..mmmmmmmmmdd....',
    '..ddddddddddd....'
  ];
  var LEGS = [
    '..mmmm..mmmmd....',
    '..mmmm..mmmdd....',
    '..dmmd...mmmd....',
    '..kkkk...kkkk....',
    '..kkkkk..kkkkk...'
  ];
  var BOB = [0, 1, 1, 0];
  reg('inf', {
    sh: [8, 21],
    draw: function (f) {
      var by = BOB[f], gy = [0, 0, 1, 1][f];
      S(LEGS, 6, 24);
      R('c', 5, 18 + by, 3, 5); R('C', 5, 18 + by, 3, 1); R('W', 5, 22 + by, 3, 1);    // 背包
      S(INF_BODY, 6, 17 + by);
      S(HEAD, 6, 6 + by);
      // 步枪：枪托在腰侧，枪口朝右上
      bar(19, 24 + gy, 26, 10 + gy, ['4', '2']);
      bar(18, 25 + gy, 19, 22 + gy, ['W', 'w', 'w']);
      R('m', 16, 19 + by, 4, 2); R('l', 16, 19 + by, 3, 1);                             // 前臂
      R('s', 20, 19 + gy, 2, 2);                                                        // 手
    }
  });

  /* ───────────── 破甲兵 mech：戴风镜，肩上扛一根粗火箭筒，筒口带橙色弹头 ───────────── */
  var MECH_FACE = [
    '..SssssssssssS...',
    '..Sss1gGGq1sss...',
    '..Sss1gGGG1sss...',
    '...SSsssssssS....'
  ];
  var MECH_BODY = [
    '..lllmmmmmmmd....',
    '.llmmmmmmmmmmd...',
    '.lmmmmmmmmmmmd...',
    '.lmmmmmmmmmmmd...',
    '.lmmmmmmmmmmmd...',
    '.mmmmmmmmmmmdd...',
    '..dddddddddddd...'
  ];
  reg('mech', {
    sh: [5, 20],
    draw: function (f) {
      var by = BOB[f], gy = [0, 0, 1, 1][f];
      S(LEGS, 3, 24);
      // 火箭筒：从肩后伸到身前，头挡住中间一段
      bar(1, 20 + gy, 27, 10 + gy, ['4', '3', '3', '2']);
      R('2', 1, 18 + gy, 2, 7); R('3', 1, 18 + gy, 2, 1);                              // 喇叭形尾喷口
      R('y', 26, 8 + gy, 2, 1); R('f', 26, 9 + gy, 3, 5); R('r', 29, 10 + gy, 1, 3);    // 弹头
      R('y', 26, 9 + gy, 2, 2); R('r', 26, 14 + gy, 2, 1);
      S(MECH_BODY, 3, 17 + by);
      S(HEAD, 3, 6 + by);
      S(MECH_FACE, 3, 13 + by);
      R('m', 15, 18 + by, 4, 3); R('l', 15, 18 + by, 4, 1);                             // 托筒的手臂
      R('s', 19, 16 + gy, 3, 2);
    }
  });

  /* ───────────── 狙击手 snp：尖顶兜帽斗篷，跪姿，长枪带瞄准镜 ───────────── */
  var SNP = [
    '......lll.......',
    '.....llllm......',
    '....llhllmm.....',
    '...llhhllmmm....',
    '...llhllmmmmm...',
    '..lllllmmmmmmd..',
    '..llllmmoooooo..',
    '..lllmmosssssd..',
    '..llmmmosssosd..',
    '..llmmmossssd...',
    '..lmmmmmooodd...',
    '.llmmmmmmmmdd...',
    '.lmmmmmmmmmmdd..',
    '.lmmmmmmmmmmdd..',
    '.lmmmmmmmmmmmd..',
    'llmmmmmmmmmmmdd.',
    'lmmmmmmmmmmmmdd.',
    'lmmmmmmmmmmmmdd.',
    'lmmmmmmmmmmmmmdd',
    'lmmmmmmmmmmmmmdd',
    'lmmmmmmmmmmmmddd',
    '.mmmmmmmmmmmdddd',
    '.dmmmmmmmmdddkkk',
    '..dddddddddd.kkk'
  ];
  reg('snp', {
    sh: [4, 20],
    draw: function (f) {
      var by = BOB[f] ? 1 : 0, gy = [0, 0, 1, 1][f];
      S(SNP.slice(by), 3, 5 + by);
      // 长枪：枪托抵肩，枪管伸到格子右沿
      R('w', 13, 16 + gy, 4, 3); R('W', 13, 16 + gy, 4, 1);
      R('4', 17, 16 + gy, 13, 1); R('2', 17, 17 + gy, 13, 1);
      R('0', 28, 16 + gy, 2, 2);
      R('1', 18, 13 + gy, 6, 2); R('q', 23, 13 + gy, 1, 2); R('1', 20, 15 + gy, 2, 1);  // 瞄准镜
      R('s', 18, 18 + gy, 3, 2);                                                        // 托枪的手
      R('2', 25, 18 + gy, 2, 4);                                                        // 支架
    },
    thin: function (f) { if (f === 2) R('x', 23, 13 + 1); }
  });

  /* ───────────── 投弹手 grn：护耳软帽，身体后仰，一只手把手雷高举过头，胸前斜挎弹带 ───────────── */
  var GRN_HEAD = [
    '....llllllll.....',
    '..llhhllllllmm...',
    '.llhhlllllmmmmm..',
    '.llllllmmmmmmmd..',
    '.lmmmmmmmmmmmdd..',
    '.CCCCCCCCCCCccc..',
    '.CCCCCCCCCCcccc..',
    '.lmSsssssssssmd..',
    '.lmSsssossossmd..',
    '.lmSsssossossmd..',
    '.dd.SSssssSS.dd..'
  ];
  var LEGS_B = [
    '..mmmm..mmmmd....',
    '..mmmm..mmmdd....',
    '..dmmd...kkkk....',
    '..kkkk...kkkkk...',
    '..kkkkk..........'
  ];
  var BOMB = [
    '.111.',
    '13311',
    '13111',
    '11110',
    '.100.'
  ];
  reg('grn', {
    sh: [11, 24],
    draw: function (f, mv) {
      var by = BOB[f], ay = [0, -1, 0, 0][f], ty = [0, -2, -1, 0][f];
      S(mv && (f & 1) ? LEGS_B : LEGS, 10, 24);
      // 举过头的手臂：从肩头向后上方斜伸，和头之间留一道缝
      bar(8, 18 + by, 2, 10 + ay, ['l', 'm', 'd']);
      R('s', 1, 8 + ay, 4, 2); R('S', 4, 9 + ay);
      S(INF_BODY, 9, 17 + by);
      // 弹带：左肩到右腰，挂三颗小手雷
      bar(12, 17 + by, 20, 23 + by, ['w', 'w']);
      R('1', 13, 18 + by, 2, 3); R('4', 13, 18 + by);
      R('1', 16, 20 + by, 2, 3); R('4', 16, 20 + by);
      R('1', 19, 22 + by, 2, 2); R('4', 19, 22 + by);
      S(GRN_HEAD, 8, 6 + by);
      // 手雷：深色圆球，顶上保险和引信火花
      S(BOMB, 1, 3 + ty);
      R('3', 3, 2 + ty, 2, 1);
      R(['y', 'f', 'Y', 'f'][f], 4, 1 + ty); if (f === 0 || f === 2) R(f ? 'y' : 'f', 5, ty);
      // 前伸保持平衡的手
      R('m', 20, 19 + by, 5, 2); R('l', 20, 19 + by, 4, 1);
      R('s', 25, 19 + by, 2, 2);
    },
    thin: function (f) { if (f === 2) R('x', 4, 0); }
  });

  /* ───────────── 喷火兵 flm：全封闭面罩，背两个金属燃料罐，双手平端粗喷管，喷口一团常燃火苗 ───────────── */
  var FLM_FACE = [
    '..mmmmmmmmmmmd...',
    '..mm1gGGGGq1md...',
    '..mm1gGGGGG1md...',
    '...dmmm41114d....'
  ];
  var FLAME = [
    [['.ff.', 'fyyf', 'fYyf', '.ff.'], 19],
    [['..f.', '.fyf', 'fyYf', 'fYyf', '.ff.'], 18],
    [['.f..', 'fyff', 'fYYf', 'fyf.'], 19],
    [['.ff.', 'fyyf', 'fYYf', 'fyyf', '.rf.'], 18]
  ];
  reg('flm', {
    sh: [3, 22],
    draw: function (f, mv) {
      var by = BOB[f], gy = [0, 0, 1, 1][f], t;
      S(mv && (f & 1) ? LEGS_B : LEGS, 6, 24);
      // 燃料罐：两个并排的圆柱，各带一条阵营色环
      for (t = 0; t < 2; t++) {
        var tx = 1 + t * 3;
        var t0 = 11 - t + by;                                                           // 靠身体的一只高一像素
        R('5', tx, t0, 1, 24 + by - t0); R('4', tx + 1, t0, 1, 24 + by - t0); R('2', tx + 2, t0, 1, 24 + by - t0);
        R('5', tx + 1, t0 - 1); R('2', tx, 23 + by, 3, 1);
        R('l', tx, 15 + by, 1, 3); R('m', tx + 1, 15 + by, 1, 3); R('d', tx + 2, 15 + by, 1, 3);
      }
      S(MECH_BODY, 6, 17 + by);
      S(HEAD, 6, 6 + by);
      S(FLM_FACE, 6, 13 + by);
      // 喷管：平端在腰前，喷口加粗
      R('4', 11, 20 + gy, 15, 1); R('3', 11, 21 + gy, 15, 1); R('2', 11, 22 + gy, 15, 1);
      R('1', 25, 19 + gy, 2, 5); R('2', 25, 19 + gy, 2, 1);
      R('1', 10, 21 + gy, 1, 3); R('1', 8, 23 + gy, 3, 1);                              // 接燃料罐的软管
      R('m', 15, 18 + by, 4, 2); R('l', 15, 18 + by, 4, 1);                             // 手臂
      R('w', 13, 20 + gy, 2, 3); R('W', 13, 20 + gy, 2, 1);
      R('w', 19, 20 + gy, 2, 3); R('W', 19, 20 + gy, 2, 1);                             // 手套
      S(FLAME[f][0], 27, FLAME[f][1] + gy);
    }
  });

  /* ───────────── 摩托兵 bik：两只大轮占满格宽，骑手前倾 ───────────── */
  var BIKE = [
    '....................11..........',
    '...................1111.yyy.....',
    '.....................33.yyY.....',
    '..............llll...33.yy......',
    '.......1111..llhhlll..33........',
    '..mmmm.111111lllllmmm.33........',
    '.mllllmm.1111mmmmmmmd..33.mmmm..',
    '.mm...mm...33ddddddd...33mllllm.',
    '...........3322222233...3m....m.',
    '....44444443322222233...........',
    '....33333333333333333...........',
    '.............222222.............'
  ];
  var RIDER = [
    '...llllll.....',
    '..llhhlllmm...',
    '.llhhllmmmmm..',
    '.llllmmgGGqq..',
    '.lmmmmmgGGGq..',
    '.dmmmmmmmmdd..',
    '..dddsssss....',
    '...llmmmm.....',
    '..llmmmmmlll..',
    '..lmmmmmmmmmss',
    '.llmmmmmm.mmss',
    '.lmmmmmmd.....',
    '.lmmmmmmd.....',
    '..mmmmmmmm....',
    '...ddmmmmm....',
    '.....dmmm.....',
    '......mmd.....',
    '......kkk.....',
    '......kkkk....'
  ];
  reg('bik', {
    sh: [2, 28],
    draw: function (f, mv) {
      var j = f & 1, wh = mv && j ? TIRE8B : TIRE8;
      S(wh, 2, 21); S(wh, 22, 21);
      S(BIKE, 0, 12 + j);
      S(RIDER, 8, 2 + j);
    },
    over: function (c, f, mv) { if (f) puff(c, 2, 21, f); if (mv) dust(c, 1, f); }
  });

  /* ───────────── 侦察车 rec：敞篷吉普，两只大轮，驾驶员露头，车顶一挺机枪 ───────────── */
  var REC = [
    '.lllllllllllllllllllllllll....',
    'llhhhllllllllllllllllllllllll.',
    'lmmmmmmmmmmmmmmmmmmmmmmmmmmmyy',
    'lmmmmmmmmmmmmmmmmmmmmmmmmmmmyy',
    'lmmmmmmmmmmmmmmmmmmmmmmmmmmmmd',
    'mmmmmmmmmmmmmmmmmmmmmmmmmmmmdd',
    'mmd........mmmmmmmm........mdd',
    'dd..........dddddd..........d.'
  ];
  var DRIVER = [
    '..llllll..',
    '.lhhllllm.',
    'lhhllmmmmm',
    'llmmmmmmmd',
    'dddddddddd',
    '.Ssssosos.',
    '.Ssssosos.',
    '..SSssss..'
  ];
  reg('rec', {
    sh: [2, 29],
    draw: function (f, mv) {
      var j = f & 1, wh = mv && j ? TIRE8B : TIRE8;
      R('1', 0, 15 + j, 2, 6); R('2', 0, 16 + j, 1, 4);                  // 备胎
      // 机枪：架在车头的枪架上，朝前
      R('1', 19, 11 + j, 2, 3);
      R('1', 17, 7 + j, 4, 4); R('2', 17, 7 + j, 4, 1);
      R('4', 21, 8 + j, 8, 1); R('2', 21, 9 + j, 8, 1); R('0', 28, 8 + j, 2, 2);
      S(DRIVER, 5, 5 + j);
      S(REC, 1, 13 + j);
      S(wh, 4, 21); S(wh, 20, 21);
    },
    over: function (c, f, mv) { if (mv) dust(c, 1, f); }
  });

  /* ───────────── 运兵车 apc：高高的方盒车厢，履带，侧面三个观察窗，没有炮 ───────────── */
  var APC = [
    '.....dmmmmmmmd.................',
    '.....ddddddddd.................',
    '..lllllllllllllllllll..........',
    '.lhhhllllllllllllllllm.........',
    '.lllllllllllllllllllllmm.......',
    '.lmmmmmmmmmmmmmmmmmmqGGgm......',
    '.lmmmmmmmmmmmmmmmmmmqGGGgm.....',
    '.lmmmmmmmmmmmmmmmmmmmqGGGgm....',
    '.lmmooommmooommmooommmmmmmmmm..',
    '.lmmooommmooommmooommmmmmmmmmyy',
    '.lmmooommmooommmooommmmmmmmmmyy',
    '.lmmmmmmmmmmmmmmmmmmmmmmmmmmmmd',
    '.lhhhhhhhhhhhhhhhhhhhhmmmmmmmdd',
    '.mmmmmmmmmmmmmmmmmmmmmmmmmmmmdd',
    '.dddddddddddddddddddddddddddd..'
  ];
  reg('apc', {
    sh: [1, 30],
    draw: function (f, mv) {
      var j = f & 1;
      track(2, 21, 28, 4, f, mv);
      S(APC, 0, 6 + j);
    },
    over: function (c, f, mv) { if (mv) dust(c, 1, f); }
  });

  /* ───────────── 维修车 rep：履带底盘，前面驾驶室，后面平台上一根浅色吊臂挂着橙色吊钩 ───────────── */
  var REP = [
    '................llllllllll.....',
    '...............llhhlllllllm....',
    '...............lmmqqGGGGgmm....',
    '...............lmmqGGGGGgmmm...',
    '...............lmmGGGGGGgmmm...',
    '...............lmmmmmmmmmmmmm..',
    '.lllllllllllllllmmmmmmmmmmmmyy.',
    'llhhhllllllllllmmmmmmmmmmmmmyy.',
    'lmmmmmmmmmmmmmmmmmmmmmmmmmmmmd.',
    'lmmmmmmmmmmmmmmmmmmmmmmmmmmmdd.',
    'mmmmmmmmmmmmmmmmmmmmmmmmmmmmd..',
    'ddddddddddddddddddddddddddddd..'
  ];
  reg('rep', {
    sh: [1, 30],
    draw: function (f, mv) {
      var j = f & 1, hx = [0, 0, 1, 0][f];
      track(2, 21, 28, 4, f, mv);
      S(REP, 1, 9 + j);
      // 吊臂：从平台中部斜向后上方
      R('2', 9, 12 + j, 5, 3); R('3', 9, 12 + j, 5, 1);
      bar(11, 11 + j, 3, 2 + j, ['5', '4', '3']);
      R('2', 2 + hx, 5 + j, 2, 4);                                 // 吊索
      R('f', 1 + hx, 9 + j, 4, 3); R('y', 1 + hx, 9 + j, 4, 1);    // 吊钩
      R(['f', 'y', 'f', 'r'][f], 20, 7 + j, 3, 2);                 // 警示灯
    },
    over: function (c, f, mv) { if (mv) dust(c, 1, f); }
  });
})();
