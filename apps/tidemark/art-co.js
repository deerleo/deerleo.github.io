/* 《潮汐战线》像素美术：8 位指挥官头像
 * 接口：AWArtCO.draw(ctx, id, sizePx, frame, opts) / AWArtCO.icon(id, sizePx, pal) / AWArtCO.ids
 * 每张头像按 48×48 逻辑像素画进一个颜色数组（分层：背景 → 身体 → 头 → 帽子），
 * 每层画完自动描一圈 1 像素的阵营 o 色轮廓，再合成；结果按 id+帧+表情+色阶缓存。
 * 光从左上来：亮边在左上、暗边在右下。只用整数坐标填色，不用图片。 */
(function () {
  'use strict';
  var W = 48;
  var IDS = ['blitz', 'wall', 'gold', 'storm', 'tide', 'sky', 'iron', 'militia'];
  function mk(o, d, m, l, h) { return { o: o, d: d, m: m, l: l, h: h }; }
  var PALS = {
    neutral: mk('#3a3550', '#6d6a85', '#a5a3b8', '#d3d2de', '#f4f4f8'),
    red: mk('#4a1530', '#a3263c', '#e0453a', '#ff8a5c', '#ffd0a0'),
    blue: mk('#1a1f5c', '#2a4bb0', '#3b82f0', '#6fc3ff', '#c9f0ff'),
    green: mk('#143a2e', '#1f7a4a', '#35b55a', '#86e07a', '#d6f7a8'),
    yellow: mk('#4a3312', '#b0741c', '#eeb42a', '#ffe066', '#fff6c0'),
    violet: mk('#33204f', '#6b3fa0', '#9a64d6', '#c9a0f2', '#eedcff'),
    teal: mk('#123a4a', '#1c7a8c', '#2fb5c0', '#86e2e0', '#d4f8f0'),
    orange: mk('#4a2212', '#b0521c', '#ee8a2a', '#ffbe66', '#ffe8c0')
  };
  var DEF = { blitz: 'red', wall: 'neutral', gold: 'yellow', storm: 'violet', tide: 'teal', sky: 'blue', iron: 'orange', militia: 'green' };

  // 中性色：定稿调色板里的金属、玻璃、木、布、火几组
  var N = {
    x: '#ffffff', e: '#3a3550',
    '0': '#5c5c6a', '1': '#6e6e7a', '2': '#8c8c96', '3': '#b4b4be', '4': '#c4c4cc', '5': '#f4f4f8',
    g: '#52ccea', G: '#7adcf0', q: '#b0eef8',
    r: '#d43a2a', f: '#ff7a2e', y: '#ffc24a', Y: '#f6e9a0', B: '#b0741c',
    k: '#6e4a34', w: '#b98250', W: '#e0b070',
    C: '#fbf6e6', c: '#efe6d0', v: '#d4c8ae', V: '#8a7c74',
    z: '#ecd8a8', Z: '#f4e4b0', j: '#dcc28e', J: '#c8a878',
    p: '#ff9e8a', n: '#a3263c'
  };
  var FAIR = { S: '#ffe9d2', s: '#ffd9b3', t: '#eeb080', u: '#b8684a' };
  var TAN = { S: '#ffd9b3', s: '#f2c296', t: '#d99a6c', u: '#9c5a3c' };

  var B = null, K = null;
  var SW = [0, 1, 0, -1];

  function col(c) { return c === 0 ? 0 : (K[c] || c); }
  function P(c, x, y) { if (x < 0 || y < 0 || x >= W || y >= W) return; B[y * W + x] = col(c); }
  function R(c, x, y, w, h) {
    var i, j; if (w === undefined) w = 1; if (h === undefined) h = 1;
    for (j = 0; j < h; j++) for (i = 0; i < w; i++) P(c, x + i, y + j);
  }
  // 左右对称各画一块（对称轴在 x=24）
  function M(c, x, y, w, h) { if (w === undefined) w = 1; R(c, x, y, w, h); R(c, W - x - w, y, w, h); }
  function get(x, y) { return (x < 0 || y < 0 || x >= W || y >= W) ? 0 : B[y * W + x]; }
  // 实心椭圆，可用 y0/y1 裁掉上下
  function E(c, cx, cy, rx, ry, y0, y1) {
    var x, y, dx, dy;
    for (y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      if (y0 !== undefined && y < y0) continue;
      if (y1 !== undefined && y > y1) continue;
      for (x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        dx = (x + 0.5 - cx) / rx; dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy <= 1) P(c, x, y);
      }
    }
  }
  function S(rows, x, y) {
    for (var j = 0; j < rows.length; j++) for (var i = 0; i < rows[j].length; i++) {
      var ch = rows[j].charAt(i);
      if (ch !== '.' && ch !== ' ') P(ch, x + i, y + j);
    }
  }
  // 把颜色 src 里、朝 (dx,dy) 方向紧挨着空白的像素改成 c：dx>0,dy>0 是右下暗边，负的是左上亮边
  function edge(c, dx, dy, src) {
    var s = col(src), out = [], x, y;
    for (y = 0; y < W; y++) for (x = 0; x < W; x++) {
      if (B[y * W + x] !== s) continue;
      if (!get(x + dx, y + dy) || (dx && dy && (!get(x + dx, y) && !get(x, y + dy)))) out.push(x, y);
    }
    for (x = 0; x < out.length; x += 2) P(c, out[x], out[x + 1]);
  }
  // 按条件换色
  function remap(from, to, fn) {
    var s = col(from), x, y;
    for (y = 0; y < W; y++) for (x = 0; x < W; x++) if (B[y * W + x] === s && (!fn || fn(x, y))) B[y * W + x] = col(to);
  }
  function ring(c) {
    var out = [], x, y, cc = col(c);
    for (y = 0; y < W; y++) for (x = 0; x < W; x++) {
      if (B[y * W + x]) continue;
      if (get(x, y - 1) || get(x - 1, y) || get(x, y + 1) || get(x + 1, y)) out.push(y * W + x);
    }
    for (x = 0; x < out.length; x++) B[out[x]] = cc;
  }
  // 一层：单独画、可描边，再盖到下面一层上
  function layer(fn, ol) {
    var prev = B, i; B = new Array(W * W);
    fn();
    if (ol) ring(ol);
    for (i = 0; i < W * W; i++) if (B[i]) prev[i] = B[i];
    B = prev;
  }
  // 细斜线
  function line(c, x0, y0, x1, y1, th) {
    var dx = x1 - x0, dy = y1 - y0, n = Math.max(Math.abs(dx), Math.abs(dy)) || 1, i;
    for (i = 0; i <= n; i++) R(c, Math.round(x0 + dx * i / n), Math.round(y0 + dy * i / n), 1, th || 1);
  }

  /* ───────── 公共部件 ───────── */
  function neck(x, w, y) {
    layer(function () { R('s', x, y || 30, w, 9); R('t', x, 33, w, 3); }, 'o');
  }
  // 肩膀：一个大椭圆的上半截，右下压暗、左上提亮
  function bust(rx, top, c, cd, cl) {
    E(c, 24, top + 13, rx, 13);
    edge(cd, 2, 1, c); edge(cl, -1, -1, c);
  }
  function faceShape(cx, cy, rx, ry) {
    E('s', cx, cy, rx, ry);
    edge('t', 2, 1, 's'); edge('S', -1, -1, 's');
  }
  // 睁开的眼睛：2 宽 3 高，左上一粒高光，最下一行是虹膜色
  function eye(x, y, iris) {
    R('e', x, y, 2, 2); P('x', x, y); R(iris || 'e', x, y + 2, 2, 1);
  }
  function eyes(x, y, iris) { eye(x, y, iris); eye(W - x - 2, y, iris); }
  // 笑眯的眼：^ 形
  function arcEye(x, y, w) {
    P('e', x, y + 1); R('e', x + 1, y, w - 2, 1); P('e', x + w - 1, y + 1);
  }
  function arcEyes(x, y, w) { arcEye(x, y, w); arcEye(W - x - w, y, w); }
  // 落败：八字眉、闭眼、嘴角向下、一滴汗
  function loseFace(x, y, my, brow) {
    M('e', x, y + 1, 3, 1); P('e', x - 1, y + 2); P('e', W - x, y + 2);
    line(brow || 'a', x - 1, y - 1, x + 2, y - 3); line(brow || 'a', W - x, y - 1, W - x - 3, y - 3);
    R('u', 22, my, 4, 1); P('u', 21, my + 1); P('u', 26, my + 1);
    S(['.G.', 'GqG', 'GGG', '.G.'], 31, y - 5);
  }
  function sparkle(c, x, y, big) {
    P(c, x, y); P(c, x - 1, y); P(c, x + 1, y); P(c, x, y - 1); P(c, x, y + 1);
    if (big) { P(c, x - 2, y); P(c, x + 2, y); P(c, x, y - 2); P(c, x, y + 2); }
  }

  /* ───────── 背景 ───────── */
  function bgBase(mood) {
    R('l', 0, 0, W, W);
    if (mood !== 'power') return 'h';
    // 发动技能：头后面一圈放射光
    var x, y, a;
    for (y = 0; y < W; y++) for (x = 0; x < W; x++) {
      a = Math.atan2(y + 0.5 - 26, x + 0.5 - 24) / Math.PI * 8 + 8.5;
      if ((Math.floor(a) & 1) === 0) P('h', x, y);
    }
    return 'x';
  }
  var BG = {
    blitz: function (c) {
      var L = [[1, 9, 12], [30, 5, 16], [0, 21, 9], [38, 17, 10], [1, 33, 8], [39, 29, 9], [10, 4, 8]], i, k;
      for (i = 0; i < L.length; i++) for (k = 0; k < L[i][2]; k++) R(c, L[i][0] + k, L[i][1] - (k >> 1), 1, 2);
    },
    wall: function (c) {
      var y, r, x;
      for (r = 0, y = 4; y < W; y += 9, r++) {
        R(c, 0, y, W, 1);
        for (x = (r & 1) ? 6 : 16; x < W; x += 20) R(c, x, y + 1, 1, 8);
      }
    },
    gold: function (c, f) {
      var Cn = [[6, 8], [42, 7], [5, 25], [43, 24], [14, 3], [35, 3]], i;
      for (i = 0; i < Cn.length; i++) {
        E(c, Cn[i][0], Cn[i][1], 3.5, 3.5);
        R('l', Cn[i][0] - 1, Cn[i][1] - 2, 1, 4); R('l', Cn[i][0], Cn[i][1] - 2, 1, 1);
      }
      sparkle('x', Cn[f][0] + 2, Cn[f][1] - 2);
    },
    storm: function (c) {
      var x;
      for (x = 2; x <= 40; x += 4) R(c, x, 4 + Math.round((x - 22) * (x - 22) * 26 / 400), 2, 2);
      R(c, 39, 31, 7, 1); R(c, 42, 28, 1, 7); P(c, 40, 29); P(c, 44, 29); P(c, 40, 33); P(c, 44, 33);
      R('x', 42, 31, 1, 1);
    },
    tide: function (c, f) {
      var Wv = [0, -1, -1, 0, 1, 1, 1, 0], x, k;
      for (k = 0; k < 4; k++) for (x = 0; x < W; x++) R(c, x, 14 + k * 8 + Wv[(x + k * 3 + f * 2) & 7], 1, 2);
    },
    sky: function (c) {
      function cloud(x, y) { E(c, x, y, 7, 3, undefined, y); E(c, x - 3, y - 2, 3, 3, undefined, y); E(c, x + 2, y - 3, 4, 4, undefined, y); }
      cloud(7, 13); cloud(42, 22); cloud(4, 34);
    },
    iron: function (c) {
      function gear(cx, cy, r) {
        var i, a;
        for (i = 0; i < 8; i++) { a = i * Math.PI / 4; R(c, Math.round(cx + Math.cos(a) * r - 1.5), Math.round(cy + Math.sin(a) * r - 1.5), 3, 3); }
        E(c, cx, cy, r, r); E('l', cx, cy, r * 0.4, r * 0.4);
      }
      gear(41, 11, 7); gear(5, 29, 6);
    },
    militia: function (c, f) {
      function wheat(x, top, s) {
        var k;
        R(c, x, top + 3, 1, 44 - top);
        for (k = 0; k < 5; k++) {
          var sx = k < 3 ? s : 0;
          R(c, x - 3 + sx, top + 2 + k * 3, 2, 2); R(c, x + 2 + sx, top + 3 + k * 3, 2, 2);
        }
        R(c, x + s, top, 1, 3);
      }
      wheat(5, 16, SW[f]); wheat(43, 14, SW[(f + 1) & 3]);
    }
  };

  /* ───────── 8 位指挥官 ───────── */
  var CO = {};

  // 岚 · 闪击：短发被风吹向右侧，护目镜推在额头，毛领飞行夹克，带笑
  CO.blitz = function (f, mood) {
    var k; for (k in FAIR) K[k] = FAIR[k];
    K.a = '#2e2a4a'; K.b = '#4a4470'; K.i = '#7a74a8';
    var s = SW[f];
    neck(21, 6);
    layer(function () {
      bust(18, 36, 'm', 'd', 'l');
      R('3', 24, 41, 1, 7);
      // 毛领
      E('c', 17, 38, 7, 4); E('c', 31, 38, 7, 4);
      edge('v', 1, 1, 'c'); edge('C', -1, -1, 'c');
      R('h', 9, 43, 4, 1); R('h', 9, 45, 4, 1);
    }, 'o');
    layer(function () {
      // 后发和被风吹起的发梢
      layer(function () {
        E('b', 24, 16, 12.5, 12, undefined, 26);
        function spike(x, y, len, h, sl) { for (var i = 0; i < len; i++) R('b', x + i, y + Math.round(i * sl), 1, Math.max(1, Math.round(h * (1 - i / len)))); }
        spike(35, 7, 7 + s, 5, -0.45); spike(36, 13, 8 - s, 5, -0.2); spike(35, 19, 6 + s, 5, 0.1);
        edge('a', 1, 1, 'b'); edge('i', -1, -1, 'b');
      });
      M('s', 12, 22, 2, 4);
      layer(function () { faceShape(24, 23.5, 10, 10); });
      // 斜刘海：左高右低
      var x, hgt;
      for (x = 14; x <= 33; x++) { hgt = 14 + Math.floor((x - 14) / 4) + ((x % 5) === 3 ? 1 : 0); R('b', x, 12, 1, hgt - 12 + 1); P('t', x, hgt + 1); }
      R('i', 17, 14, 5, 1); R('i', 24, 15, 4, 1);
      R('b', 32, 17, 2, 8); R('a', 33, 19, 1, 6);
      R('b', 14, 16, 1, 5);
      // 五官
      if (mood === 'lose') loseFace(17, 22, 30, 'a');
      else {
        M('e', 17, 21, 3, 1); P('e', 16, 22); P('e', 31, 22);
        eye(18, 22, '#b0521c'); eye(28, 22, '#b0521c');
        line('a', 16, 19, 19, 20); line('a', 31, 19, 28, 20);
        if (mood === 'power') { R('u', 20, 28, 8, 1); R('x', 21, 29, 6, 2); R('n', 22, 31, 4, 1); P('u', 20, 29); P('u', 27, 29); P('u', 21, 30); P('u', 26, 30); P('u', 28, 27); }
        else { R('u', 22, 29, 4, 1); P('u', 26, 28); P('u', 27, 27); }
      }
      R('t', 24, 25, 1, 2);
      M('p', 15, 26, 2, 1);
    }, 'o');
    // 护目镜
    layer(function () {
      R('k', 12, 9, 24, 2);
      M('3', 15, 7, 7, 6);
      M('g', 16, 8, 5, 4); M('q', 16, 8, 2, 1); P('q', 16, 9); P('q', 27, 9); P('q', 28, 8);
      R('3', 22, 9, 4, 2);
      P(0, 15, 7); P(0, 21, 7); P(0, 15, 12); P(0, 21, 12); P(0, 26, 7); P(0, 32, 7); P(0, 26, 12); P(0, 32, 12);
      if (mood === 'power') { P('x', 19, 9); P('x', 30, 9); }
    }, 'o');
  };

  // 石磊 · 铁壁：方下巴、胡茬，钢盔压低，厚立领大衣
  CO.wall = function (f, mood) {
    var k; for (k in TAN) K[k] = TAN[k];
    K.a = '#4a3a3a'; K.b = '#c9a08a';
    neck(19, 10);
    layer(function () { bust(21, 35, 'm', 'd', 'l'); R('d', 24, 40, 1, 8); M('y', 20, 43, 2, 2); }, 'o');
    layer(function () {
      M('s', 12, 21, 2, 5);
      layer(function () {
        R('s', 14, 14, 20, 18); R('s', 15, 32, 18, 2); R('s', 17, 34, 14, 1);
        edge('t', 2, 1, 's'); edge('S', -1, -1, 's');
      });
      // 胡茬
      remap('s', 'b', function (x, y) { return y >= 28 || (y >= 25 && (x <= 15 || x >= 31)); });
      R('s', 22, 31, 4, 1);
      R('t', 14, 18, 20, 1);
      // 眉眼
      if (mood === 'lose') loseFace(17, 22, 30, 'a');
      else {
        M('a', 16, 20, 5, 1); M('a', 18, 21, 4, 1);
        if (mood === 'power') { M('a', 20, 22, 2, 1); }
        M('e', 17, 23, 3, 2); P('x', 17, 23); P('x', 28, 23); P('s', 19, 24); P('s', 30, 24);
        M('t', 17, 25, 3, 1);
        R('u', 21, 30, 6, 1);
        if (mood === 'power') { P('u', 27, 29); P('u', 28, 28); R('x', 22, 31, 4, 1); }
      }
      R('t', 25, 24, 1, 3); R('t', 23, 27, 3, 1); P('S', 23, 25);
      P('u', 20, 28); P('u', 27, 28); P('u', 17, 31); P('u', 30, 32); P('u', 19, 33); P('u', 28, 30);
      // 钢盔带
      M('k', 14, 19, 1, 12); R('k', 15, 31, 1, 2); R('k', 32, 31, 1, 2);
    }, 'o');
    // 立领
    layer(function () {
      S(['lmm.........', 'lmmmm.......', 'lmmmmmm.....', 'lmmmmmmmm...', '.lmmmmmmmmd.', '..mmmmmmmmdd', '...mmmmmmddd'], 11, 31);
      S(['.........mmd', '.......mmmmd', '.....lmmmmmd', '...lmmmmmmmd', '.lmmmmmmmmd.', 'lmmmmmmmdd..', 'mmmmmmddd...'], 25, 31);
    }, 'o');
    // 钢盔
    layer(function () {
      E('m', 24, 15, 12, 11, undefined, 15);
      R('m', 9, 15, 30, 4); P(0, 9, 15); P(0, 38, 15); P(0, 9, 18); P(0, 38, 18);
      edge('d', 2, 1, 'm'); edge('l', -1, -1, 'm');
      R('l', 11, 15, 24, 1); R('d', 10, 18, 28, 1); R('d', 30, 16, 8, 2);
      R('h', 16 + f, 7, 3, 1); R('h', 15 + f, 8, 2, 2);
      M('d', 15, 13, 1, 1);
      if (mood === 'power') sparkle('x', 17, 8, true);
    }, 'o');
  };

  // 钱多多 · 军费：圆脸、小圆眼镜、贝雷帽、金币别针，笑眯眯
  CO.gold = function (f, mood) {
    var k; for (k in FAIR) K[k] = FAIR[k];
    K.a = '#6e4a34'; K.b = '#b98250';
    neck(20, 8);
    layer(function () {
      bust(21, 37, 'm', 'd', 'l');
      // 白衬衫和领结
      S(['CCCCCCCC', '.CCCCCC.', '.cCCCCc.', '..CCCC..', '..cCCc..', '...CC...', '...CC...'], 20, 37);
      S(['dd.dd', 'ddddd', 'dd.dd'], 22, 38); P('o', 24, 39);
      line('d', 19, 38, 23, 46); line('d', 28, 38, 24, 46);
      // 金币别针
      E('y', 34, 43, 3, 3); R('Y', 32, 41, 2, 1); P('Y', 32, 42); R('B', 34, 42, 1, 3);
      if (f === 1 || f === 2) sparkle('x', 32 + f, 41);
    }, 'o');
    layer(function () {
      M('s', 10, 22, 2, 4);
      M('b', 11, 17, 2, 5);
      layer(function () { E('s', 24, 24, 12, 10.5); edge('t', 2, 1, 's'); edge('S', -1, -1, 's'); });
      R('t', 21, 33, 6, 1);
      M('p', 14, 27, 3, 2);
      // 圆眼镜
      M('B', 15, 20, 7, 7); M('S', 16, 21, 5, 5);
      P('s', 15, 20); P('s', 21, 20); P('s', 15, 26); P('s', 21, 26); P('s', 26, 20); P('s', 32, 20); P('s', 26, 26); P('s', 32, 26);
      R('B', 22, 22, 4, 1);
      M('x', 16, 21, 2, 1);
      if (mood === 'lose') { loseFace(17, 22, 31, 'a'); }
      else if (mood === 'power') {
        // 眼里冒金币
        arcEyes(17, 23, 3); M('a', 17, 17, 3, 1); sparkle('x', 16, 21); sparkle('x', 27, 21);
        R('n', 21, 29, 6, 3); R('x', 22, 29, 4, 1); P('s', 21, 31); P('s', 26, 31);
      } else {
        arcEyes(17, 23, 3); M('a', 17, 18, 3, 1);
        R('u', 22, 31, 4, 1); P('u', 21, 30); P('u', 26, 30);
      }
      R('t', 23, 26, 2, 2); P('S', 23, 26);
      R('a', 21, 28, 6, 1); P('a', 20, 29); P('a', 27, 29);
    }, 'o');
    // 贝雷帽：往右边塌
    layer(function () {
      E('m', 26, 10, 14, 6.5); R('m', 13, 13, 12, 3);
      R('m', 25, 2, 2, 2);
      edge('d', 2, 1, 'm'); edge('l', -1, -1, 'm');
      R('d', 13, 15, 22, 2);
      R('l', 17, 6, 6, 1);
    }, 'o');
  };

  // 雷鸣 · 炮火：花白短须，一只眼戴测距目镜，大檐帽上炮兵徽
  CO.storm = function (f, mood) {
    var k; for (k in FAIR) K[k] = FAIR[k];
    K.s = '#f6cfa8'; K.t = '#dba27a';
    K.a = '#8a86a6'; K.b = '#c6c3d8'; K.i = '#eceaf4';
    neck(21, 6);
    layer(function () {
      bust(18, 36, 'm', 'd', 'l');
      R('d', 19, 35, 10, 3); R('y', 19, 37, 10, 1); M('r', 19, 35, 3, 2);
      R('d', 24, 38, 1, 10);
      M('y', 8, 39, 7, 2); M('B', 8, 41, 7, 1);
      R('r', 29, 42, 2, 2); R('y', 31, 42, 2, 2); R('g', 33, 42, 2, 2);
    }, 'o');
    layer(function () {
      M('s', 13, 22, 2, 4);
      M('b', 14, 16, 2, 6);
      layer(function () { E('s', 24, 23.5, 9.5, 10.5); edge('t', 2, 1, 's'); edge('S', -1, -1, 's'); });
      // 络腮短须
      remap('s', 'b', function (x, y) { return y >= 28 || (y >= 24 && (x <= 16 || x >= 31)); });
      remap('t', 'a', function (x, y) { return y >= 24; });
      R('i', 20, 27, 8, 2); P('i', 19, 28); P('i', 28, 28);
      R('t', 24, 24, 1, 3); P('t', 23, 26);
      if (mood === 'lose') { M('e', 17, 23, 3, 1); line('a', 16, 21, 19, 19); R('u', 22, 30, 4, 1); S(['.G.', 'GqG', 'GGG', '.G.'], 12, 17); }
      else {
        // 左眼：压低的眉和窄眼
        line('#6d6a85', 16, 19, 20, 21); line('#6d6a85', 16, 20, 18, 21);
        R('e', 17, 22, 3, 1); R('e', 18, 23, 2, 1); P('x', 17, 23);
        R('t', 17, 25, 3, 1);
        if (mood === 'power') { R('n', 22, 29, 4, 3); R('x', 22, 29, 4, 1); }
        else R('u', 22, 29, 4, 1);
      }
      // 测距目镜
      R('1', 26, 19, 7, 7); R('g', 27, 20, 5, 5);
      P(0, 26, 19); P(0, 32, 19); P(0, 26, 25); P(0, 32, 25);
      P('s', 26, 19); P('s', 26, 25);
      R('2', 33, 21, 2, 3); R('1', 29, 16, 1, 3);
      R('G', 29, 20, 1, 5); R('G', 27, 22, 5, 1);
      var gx = [27, 28, 30, 31][f], gy = [20, 21, 23, 24][f];
      P('x', gx, gy); P('q', gx + 1, gy); P('q', gx, gy + 1);
      if (mood === 'power') { R('Y', 27, 20, 5, 5); R('x', 28, 21, 3, 3); sparkle('x', 29, 22, true); }
    }, 'o');
    // 大檐帽
    layer(function () {
      E('m', 24, 9, 14, 6.5);
      edge('d', 2, 1, 'm'); edge('l', -1, -1, 'm');
      R('d', 13, 12, 22, 3);
      R('e', 14, 15, 20, 1); R('e', 15, 16, 18, 1); R('1', 16, 15, 6, 1);
      S(['y..y', '.yy.', '.Yy.', 'y..y'], 22, 8); R('y', 21, 13, 6, 1);
      if (f === 2 && mood !== 'lose') P('x', 23, 10);
    }, 'o');
  };

  // 海澜 · 怒潮：白顶海军帽，长发束在脑后，深色双排扣制服和肩章
  CO.tide = function (f, mood) {
    var k; for (k in FAIR) K[k] = FAIR[k];
    K.a = '#4a2f3a'; K.b = '#7a4a4a'; K.i = '#a86a5a';
    var s = SW[f];
    neck(21, 6);
    layer(function () {
      bust(17, 36, 'd', 'o', 'm');
      S(['CCCCCCCC', '.CCCCCC.', '..cCCc..', '...CC...'], 20, 36);
      S(['mm', 'mm', 'mm', 'll'], 23, 38);
      line('o', 20, 37, 24, 47); line('o', 27, 37, 24, 47);
      M('y', 19, 43, 2, 2); M('y', 18, 46, 2, 2);
      M('y', 9, 38, 7, 2); M('B', 9, 40, 7, 1); M('Y', 9, 38, 2, 1);
    }, 'o');
    // 马尾：搭在右肩
    layer(function () {
      var y, x;
      for (y = 22; y <= 43; y++) {
        x = 34 + Math.round(Math.sin((y - 22) / 4 + s * 0.6) * 1.5) + (y > 34 ? Math.round((y - 34) * s * 0.2) : 0);
        var w = y < 38 ? 5 : (y < 41 ? 4 : 43 - y + 1);
        R('b', x, y, w, 1); P('i', x, y); P('a', x + w - 1, y);
      }
      R('m', 34, 24, 5, 2);
    }, 'o');
    layer(function () {
      layer(function () { E('b', 24, 17, 11.5, 10); edge('a', 1, 1, 'b'); edge('i', -1, -1, 'b'); });
      M('b', 13, 17, 2, 11); R('a', 34, 17, 1, 11); P(0, 13, 27); P(0, 34, 27);
      layer(function () { E('s', 24, 23.5, 9.5, 10); edge('t', 2, 1, 's'); edge('S', -1, -1, 's'); });
      // 中分刘海
      R('b', 15, 14, 18, 3);
      S(['bbbbbb..', 'bbbb....', 'bbb.....', 'bb......', 'b.......'], 15, 17);
      S(['...bbbbb', '....bbbb', '.....bbb', '......ba', '.......a'], 25, 17);
      R('i', 17, 15, 4, 1); R('i', 27, 15, 3, 1);
      P('t', 21, 17); P('t', 22, 17); R('t', 23, 17, 5, 1);
      if (mood === 'lose') loseFace(17, 22, 30, 'a');
      else {
        M('e', 17, 21, 3, 1); P('e', 16, 21); P('e', 31, 21);
        if (mood === 'power') { M('e', 18, 22, 2, 1); P('x', 18, 22); P('x', 28, 22); M('#1c7a8c', 18, 23, 2, 1); line('a', 16, 18, 19, 19); line('a', 31, 18, 28, 19); }
        else { eye(18, 22, '#1c7a8c'); eye(28, 22, '#1c7a8c'); M('a', 17, 19, 3, 1); }
        R('u', 22, 29, 4, 1); R('t', 23, 30, 2, 1);
        if (mood === 'power') { P('u', 26, 28); P('u', 27, 27); }
      }
      R('t', 24, 25, 1, 2);
    }, 'o');
    // 海军帽
    layer(function () {
      E('5', 24, 8, 13, 5.5);
      edge('4', 2, 1, '5'); edge('x', -1, -1, '5');
      R('d', 14, 10, 20, 3);
      R('e', 15, 13, 18, 1); R('e', 17, 14, 14, 1); R('1', 17, 13, 5, 1);
      // 锚徽
      S(['.yy.', 'yyyy', '.yy.', 'yyyy', '.yy.'], 22, 7); P('Y', 23, 7);
      if (f === 1 && mood !== 'lose') P('x', 24, 8);
    }, 'o');
  };

  // 云隼 · 制空：飞行头盔，氧气面罩挂在一侧，围巾，自信地笑
  CO.sky = function (f, mood) {
    var k; for (k in FAIR) K[k] = FAIR[k];
    K.a = '#b0741c'; K.b = '#e0b070'; K.i = '#f6e9a0';
    var s = SW[f];
    // 围巾飘向左边
    layer(function () {
      var i, y;
      for (i = 0; i < 13; i++) { y = 33 + Math.round(Math.sin(i / 2.5 + f * 1.5) * 1.5) - (i >> 2); R('c', 15 - i, y, 1, 5 - (i > 9 ? i - 9 : 0)); P('C', 15 - i, y); P('v', 15 - i, y + 4 - (i > 9 ? i - 9 : 0)); }
    }, 'o');
    neck(21, 6);
    layer(function () {
      bust(18, 37, 'm', 'd', 'l');
      M('1', 14, 40, 2, 8); M('3', 14, 43, 2, 1);
      // 翼形徽
      S(['yy..Y..yy', '.yyyyyyy.', '..y.y.y..'], 26, 43);
    }, 'o');
    layer(function () {
      E('c', 24, 36.5, 9, 4); edge('v', 1, 1, 'c'); edge('C', -1, -1, 'c');
      R('v', 20, 37, 1, 2); R('v', 26, 36, 1, 3);
    }, 'o');
    layer(function () {
      layer(function () { E('s', 24, 24, 9.5, 9.5); edge('t', 2, 1, 's'); edge('S', -1, -1, 's'); });
      // 头盔下露出的一撮头发
      S(['bbbbbbbbbb', 'ibbbbbbba.', '.ibb.bba..', '..b...a...'], 17, 15);
      if (mood === 'lose') loseFace(17, 22, 30, 'a');
      else {
        eye(18, 21, '#2a4bb0');
        if (mood === 'power') { arcEye(27, 22, 4); } else eye(28, 21, '#2a4bb0');
        R('a', 17, 19, 3, 1); line('a', 27, 18, 30, 19);
        // 露齿笑，一边嘴角更高
        R('u', 21, 28, 7, 1); R('x', 22, 29, 5, 1); R('u', 22, 30, 5, 1); P('u', 28, 27);
        if (mood === 'power') { R('x', 22, 30, 5, 1); R('u', 23, 31, 3, 1); P('u', 22, 31); P('u', 26, 31); P('u', 20, 27); }
      }
      R('t', 24, 25, 1, 2);
      M('p', 16, 26, 2, 1);
    }, 'o');
    // 头盔
    layer(function () {
      E('m', 24, 17, 14, 14, undefined, 28);
      edge('d', 2, 1, 'm'); edge('l', -1, -1, 'm');
      // 开脸
      R(0, 15, 15, 18, 14); R(0, 14, 17, 20, 12); R(0, 16, 14, 16, 1);
      // 推上去的护目镜片
      R('1', 14, 5, 20, 7); R('g', 15, 6, 18, 5); R('q', 16, 6, 6, 1); R('q', 16, 7, 3, 1); R('G', 24, 9, 8, 1);
      P(0, 14, 5); P(0, 33, 5); P('m', 14, 11); P('m', 33, 11);
      // 耳罩
      M('d', 10, 19, 3, 7); M('3', 11, 21, 1, 2);
      if (mood === 'power') sparkle('x', 18, 7, true);
    }, 'o');
    // 挂在右侧的氧气面罩
    layer(function () {
      R('k', 35, 25, 1, 4);
      S(['.2222.', '322221', '322221', '320021', '322221', '.2221.'], 33, 28 + (s > 0 ? 1 : 0));
      R('1', 35, 34 + (s > 0 ? 1 : 0), 2, 5); R('3', 35, 35 + (s > 0 ? 1 : 0), 2, 1); R('3', 35, 37 + (s > 0 ? 1 : 0), 2, 1);
    }, 'o');
  };

  // 铁牛 · 装甲：坦克帽带耳机，脸上机油印，叼牙签，大笑
  CO.iron = function (f, mood) {
    var k; for (k in TAN) K[k] = TAN[k];
    K.a = '#4a3a3a';
    neck(18, 12);
    layer(function () {
      bust(24, 35, 'm', 'd', 'l');
      S(['dddddddddddd', '.dddddddddd.', '..ssssssss..', '...ssssss...', '....tttt....'], 18, 35);
      line('d', 19, 37, 23, 41); line('d', 28, 37, 24, 41); R('d', 24, 41, 1, 7);
      M('l', 8, 40, 5, 1);
    }, 'o');
    layer(function () {
      layer(function () { E('s', 24, 23, 12, 10.5); R('s', 14, 25, 20, 8); R('s', 16, 33, 16, 1); edge('t', 2, 1, 's'); edge('S', -1, -1, 's'); });
      R('t', 14, 17, 20, 1);
      M('a', 15, 18, 6, 2); P('a', 21, 19); P('a', 26, 19);
      if (mood === 'lose') { loseFace(17, 22, 30, 'a'); }
      else if (mood === 'power') {
        // 仰头大笑
        arcEyes(16, 21, 5); M('e', 17, 22, 3, 0);
        R('n', 18, 26, 12, 6); P('s', 18, 31); P('s', 29, 31); P('s', 18, 30); P('s', 29, 30);
        R('x', 19, 26, 10, 2); R('p', 21, 30, 6, 2); R('u', 18, 25, 12, 1);
      } else {
        M('e', 17, 21, 3, 2); P('x', 17, 21); P('x', 28, 21);
        R('u', 18, 26, 12, 1); R('x', 19, 27, 10, 2); R('u', 19, 29, 10, 1);
        P('v', 22, 27); P('v', 22, 28); P('v', 25, 27); P('v', 25, 28); P('u', 17, 25); P('u', 30, 25);
      }
      R('t', 25, 22, 1, 3); R('t', 23, 24, 3, 1);
      // 机油印
      R('1', 30, 22, 3, 1); R('1', 31, 23, 3, 1); P('1', 22, 23);
      // 牙签
    }, 'o');
    // 坦克帽
    layer(function () {
      E('d', 24, 15, 13, 12, undefined, 16);
      M('d', 10, 14, 4, 13);
      edge('o', 2, 1, 'd');
      E('m', 16, 8, 3, 4.5); E('m', 24, 7, 3, 4.5); E('m', 32, 8, 3, 4.5);
      P('l', 15, 5); P('l', 15, 6); P('l', 23, 4); P('l', 23, 5); P('l', 31, 5); P('l', 31, 6);
      R('m', 13, 13, 22, 3); R('l', 14, 13, 19, 1); R('d', 13, 16, 22, 1);
      // 耳机
      M('2', 8, 18, 5, 8); M('4', 8, 18, 2, 3); M('1', 12, 19, 1, 7);
      P(0, 8, 18); P(0, 39, 18); P(0, 8, 25); P(0, 39, 25);
      // 话筒
      line('1', 10, 26, 13, 30); R('1', 13, 30, 3, 2);
    }, 'o');
    // 牙签
    if (mood !== 'lose') { var ty = (mood === 'power' ? 30 : 28); line('C', 28, ty, 35, ty + 2 + SW[f]); P('v', 35, ty + 2 + SW[f]); }
  };

  // 青禾 · 民兵：草帽、两条短辫、粗布衣、斜挎水壶和干粮袋
  CO.militia = function (f, mood) {
    var k; for (k in FAIR) K[k] = FAIR[k];
    K.s = '#ffd2a6'; K.t = '#eaa878';
    K.a = '#3e3040'; K.b = '#5e4a58'; K.i = '#8a7084';
    var s = SW[f];
    neck(21, 6);
    layer(function () {
      bust(15, 38, 'z', 'j', 'Z');
      line('j', 20, 39, 24, 44); line('j', 27, 39, 24, 44);
      // 斜挎带
      line('w', 11, 40, 26, 47, 2); line('k', 11, 42, 24, 48); line('w', 36, 40, 22, 47, 2);
    }, 'o');
    // 水壶
    layer(function () { E('3', 37, 45, 4, 4.5); edge('2', 1, 1, '3'); R('5', 34, 43, 2, 2); R('m', 33, 45, 8, 2); R('d', 39, 45, 2, 2); R('1', 36, 39, 2, 2); }, 'o');
    // 领巾
    layer(function () { R('m', 19, 35, 10, 3); R('l', 19, 35, 4, 1); S(['mm.', 'mmd', '.md', '.dd'], 23, 38); }, 'o');
    // 辫子
    layer(function () {
      function braid(x, sw) {
        var i, xx;
        for (i = 0; i < 5; i++) { xx = x + (i > 2 ? sw : 0); R('b', xx, 23 + i * 3, 4, 3); P('i', xx, 23 + i * 3); R('a', xx + 1, 25 + i * 3, 3, 1); }
        R('m', x + sw, 36, 4, 2); R('b', x + 1 + sw, 38, 2, 2);
      }
      braid(10, s); braid(34, s);
    }, 'o');
    layer(function () {
      M('b', 13, 15, 3, 9);
      layer(function () { E('s', 24, 24, 9.5, 9.5); edge('t', 2, 1, 's'); edge('S', -1, -1, 's'); });
      // 齐刘海
      R('b', 15, 14, 18, 3);
      S(['bbbb.bbbbb.bbbb.bb', 'b.b...bb.....b...a'], 15, 17);
      R('i', 17, 15, 5, 1); R('i', 26, 15, 3, 1);
      if (mood === 'lose') loseFace(17, 22, 30, 'a');
      else {
        // 大眼睛
        M('e', 17, 21, 3, 3); P('x', 17, 21); P('x', 28, 21); P('x', 18, 22); P('x', 29, 22);
        M('#35b55a', 17, 23, 1, 1); R('#1f7a4a', 19, 23, 1, 1); R('#1f7a4a', 30, 23, 1, 1);
        line('a', 16, 19, 20, 20); line('a', 31, 19, 27, 20);
        if (mood === 'power') { R('n', 22, 28, 4, 3); R('x', 22, 28, 4, 1); P('a', 20, 19); P('a', 27, 19); }
        else R('u', 23, 29, 3, 1);
      }
      P('t', 24, 26);
      M('p', 15, 26, 3, 1);
    }, 'o');
    // 草帽：往后戴
    layer(function () {
      E('W', 24, 11, 21, 5);
      edge('w', 1, 1, 'W'); edge('Y', -1, -1, 'W');
      layer(function () { E('W', 24, 8, 10, 7, undefined, 10); edge('Y', -1, -1, 'W'); edge('w', 2, 1, 'W'); });
      R('m', 15, 9, 18, 2); R('l', 15, 9, 6, 1); R('d', 31, 9, 2, 2);
      R('w', 8, 12, 3, 1); R('w', 36, 13, 3, 1); R('w', 20, 14, 3, 1); R('w', 28, 14, 2, 1);
    }, 'o');
  };

  function unknown() {
    layer(function () { E('d', 24, 49, 18, 13); E('d', 24, 21, 11, 12); R('d', 21, 30, 6, 8); }, 'o');
    S(['.hhhh.', 'hh..hh', '....hh', '...hh.', '..hh..', '..hh..', '......', '..hh..', '..hh..'], 21, 14);
  }

  /* ───────── 渲染与缓存 ───────── */
  var cache = {}, upc = {}, icons = {};
  function resolvePal(id, pal) {
    if (pal && pal.o && pal.d && pal.m && pal.l && pal.h) return pal;
    return PALS[DEF[id]] || PALS.neutral;
  }
  function render(id, f, mood, p) {
    var key = id + '|' + f + '|' + mood + '|' + p.o + p.d + p.m + p.l + p.h;
    var cv = cache[key];
    if (cv) return cv;
    var k, i, g, last = null;
    K = {}; for (k in N) K[k] = N[k];
    K.o = p.o; K.d = p.d; K.m = p.m; K.l = p.l; K.h = p.h;
    B = new Array(W * W);
    var mc = bgBase(mood);
    if (CO[id]) { if (mood !== 'lose') BG[id](mc, f); CO[id](f, mood); }
    else unknown();
    cv = document.createElement('canvas'); cv.width = W; cv.height = W;
    g = cv.getContext('2d');
    for (i = 0; i < W * W; i++) {
      if (!B[i]) continue;
      if (B[i] !== last) { g.fillStyle = B[i]; last = B[i]; }
      g.fillRect(i % W, (i / W) | 0, 1, 1);
    }
    B = null; K = null;
    cv._key = key;
    return (cache[key] = cv);
  }
  function draw(ctx, id, sizePx, frame, opts) {
    opts = opts || {};
    var size = Math.max(1, Math.round(sizePx || W));
    var mood = (opts.mood === 'power' || opts.mood === 'lose') ? opts.mood : 'normal';
    var src = render(String(id), (frame | 0) & 3, mood, resolvePal(id, opts.pal));
    var k = Math.max(1, Math.ceil(size / W));
    var sm = ctx.imageSmoothingEnabled;
    if (size === k * W) {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(src, 0, 0, W, W, 0, 0, size, size);
    } else {
      // 非整数倍：先最近邻放大到整数倍，再平滑缩到目标尺寸
      var uk = src._key + '|' + k, up = upc[uk];
      if (!up) {
        up = document.createElement('canvas'); up.width = up.height = k * W;
        var ug = up.getContext('2d'); ug.imageSmoothingEnabled = false;
        ug.drawImage(src, 0, 0, W, W, 0, 0, k * W, k * W);
        upc[uk] = up;
      }
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(up, 0, 0, k * W, k * W, 0, 0, size, size);
    }
    ctx.imageSmoothingEnabled = sm;
  }
  function icon(id, sizePx, pal) {
    var p = resolvePal(id, pal), size = Math.max(1, Math.round(sizePx || W));
    var key = id + '|' + size + '|' + p.o + p.d + p.m + p.l + p.h;
    var cv = icons[key];
    if (!cv) {
      cv = document.createElement('canvas'); cv.width = cv.height = size;
      draw(cv.getContext('2d'), id, size, 0, { pal: p });
      icons[key] = cv;
    }
    return cv;
  }

  window.AWArtCO = { ids: IDS.slice(), draw: draw, icon: icon, palettes: PALS, defaults: DEF };
})();
