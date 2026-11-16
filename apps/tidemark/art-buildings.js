/* 《潮汐战线》像素美术 · 建筑模块
 * window.AWArtBuildings[type](c, info)
 * 可画范围 x 0–32，y −16–32。只用整数坐标 fillRect。
 */
(function () {
  'use strict';

  var SH = 'rgba(24,32,40,.26)';
  var MT = ['#23282e', '#3a4048', '#5c5c62', '#a3a199', '#e9e6df'];        /* 金属：深 → 亮 */
  var WD = ['#4c3c32', '#4c3c32', '#a57c58', '#c39a73'];
  var SD = ['#86694c', '#ad8e68', '#c3a374', '#dcb276', '#eec88a'];        /* 沙袋、土 */
  var GL = ['#3a93ad', '#6fb9c6', '#c5e6e6'];                              /* 玻璃：和水面同一套青蓝 */
  var FI = ['#c0392f', '#e8862e', '#f0c64a', '#ecd27a'];
  var NEUTRAL = { o: '#23282e', d: '#716e72', m: '#96908a', l: '#b8afa2', h: '#e9e6df', id: 0 };

  function R(c, x, y, w, h, col) { c.fillStyle = col; c.fillRect(x, y, w, h); }
  function P(c, x, y, col) { c.fillStyle = col; c.fillRect(x, y, 1, 1); }
  function pal(info) { return (info && info.pal) || NEUTRAL; }
  function fr(info) { return ((info && info.frame) | 0) & 3; }
  function owned(info) {
    if (info && info.owner != null) return (info.owner | 0) !== 0;
    return !!(info && info.pal && info.pal.id);
  }
  function nbOf(info, dx, dy) { return info && typeof info.nb === 'function' ? info.nb(dx, dy) : ''; }
  var RD = ['#5c5c62', '#727176', '#96908a', '#a3a199'], LINE = '#ecd27a';       /* 和道路同一套路面色 */
  var PV = ['#716e72', '#96908a', '#b8afa2', '#b8afa2'];                           /* 和建筑铺地同一套街面色 */
  var WATERY = { sea: 1, river: 1, reef: 1, bridge: 1, port: 1, beach: 1 };
  function rndOf(info) { return (info && info.rnd) || function () { return 0.5; }; }
  function K(p) { return { o: p.o, d: p.d, m: p.m, l: p.l }; }

  /* ---- 投影：先记到掩码里再一次性画，避免重叠处加深 ---- */
  var mask = new Uint8Array(32 * 48);
  var S = {
    clear: function () { for (var i = 0; i < mask.length; i++) mask[i] = 0; },
    rect: function (x, y, w, h) {
      for (var j = y; j < y + h; j++) {
        if (j < -16 || j >= 32) continue;
        for (var i = x; i < x + w; i++) if (i >= 0 && i < 32) mask[(j + 16) * 32 + i] = 1;
      }
    },
    /* 底边 x0..x1（不含 x1）、落地线 yb 的立体物朝右下的投影 */
    cast: function (x0, x1, yb, len) {
      /* 全图统一：影子朝右下，侧面那条从墙脚往上是一个斜三角，出格的部分由右邻格的地面接着画 */
      len += 1;
      this.rect(x0 + 2, yb, x1 - x0 + len - 2, 2);
      for (var i = 0; i < len; i++) this.rect(x1 + i, yb - (len - i) * 2, 1, (len - i) * 2);
    },
    flush: function (c) {
      c.fillStyle = SH;
      for (var j = 0; j < 48; j++) {
        var i = 0;
        while (i < 32) {
          if (mask[j * 32 + i]) {
            var s = i;
            while (i < 32 && mask[j * 32 + i]) i++;
            c.fillRect(s, j - 16, i - s, 1);
          } else i++;
        }
      }
    }
  };

  /* 立面：左亮右暗，底、右描深色 */
  function box(c, x, y, w, h, k) {
    R(c, x, y, w, h, k.m);
    R(c, x, y, 1, h, k.l);
    R(c, x + w - 2, y, 2, h, k.d);
    R(c, x + w - 1, y, 1, h, k.o);
    R(c, x, y + h - 1, w, 1, k.o);
  }
  /* 屋顶板：比墙宽一圈 */
  function slab(c, x, y, w, h, p) {
    R(c, x, y, w, h, p.m);
    R(c, x, y, w - 1, 1, p.l);
    R(c, x, y, 1, 1, p.h);
    R(c, x + w - 1, y, 1, h, p.d);
    R(c, x, y + h - 1, w, 1, p.d);
    P(c, x + w - 1, y + h - 1, p.o);
  }
  /* 窗：0 暗（中立）1 亮灯 2 玻璃 */
  function win(c, x, y, w, h, st) {
    if (st === 1) { R(c, x, y, w, h, FI[2]); P(c, x, y, FI[3]); }
    else if (st === 2) { R(c, x, y, w, h, GL[0]); P(c, x, y, GL[1]); }
    else { R(c, x, y, w, h, MT[1]); }
  }
  /* 飘动的旗：每两列一段，四帧循环 */
  function flag(c, x, y, w, h, p, f) {
    var W = [0, 1, 0, -1];
    for (var i = 0; i < w; i++) {
      var dy = i < 1 ? 0 : W[((i >> 1) - f) & 3];
      var col = dy < 0 ? p.l : dy > 0 ? p.d : p.m;
      R(c, x + i, y + dy, 1, h, col);
      P(c, x + i, y + dy, dy > 0 ? p.m : p.l);
      P(c, x + i, y + dy + h - 1, dy < 0 ? p.d : p.o);
    }
    R(c, x + 2, y + (h >> 1) + W[(1 - f) & 3], 2, 1, p.h);
  }
  /* 上升的烟团：两团错开两帧 */
  function smoke(c, x, y, f, dark) {
    var hi = dark ? MT[3] : MT[4], lo = dark ? MT[2] : MT[3];
    for (var k = 0; k < 2; k++) {
      var a = (f + k * 2) & 3;
      var cx = x + (a >> 1), cy = y - 2 - a * 3;
      if (a === 0) { R(c, cx, cy, 2, 2, hi); P(c, cx + 1, cy + 1, lo); }
      else if (a === 1) { R(c, cx - 1, cy, 4, 2, hi); R(c, cx, cy - 1, 2, 1, hi); R(c, cx, cy + 2, 2, 1, lo); P(c, cx + 2, cy + 1, lo); }
      else if (a === 2) { R(c, cx - 1, cy, 4, 3, hi); R(c, cx, cy - 1, 3, 1, hi); R(c, cx + 1, cy + 2, 2, 1, lo); P(c, cx + 2, cy + 1, lo); }
      else { c.globalAlpha = 0.6; R(c, cx - 1, cy, 2, 2, hi); R(c, cx + 2, cy + 1, 2, 1, hi); P(c, cx + 1, cy - 1, hi); c.globalAlpha = 1; }
    }
  }
  /* 闪灯：亮时带十字光晕 */
  function lamp(c, x, y, on, col, glow) {
    if (on) {
      c.globalAlpha = 0.45;
      R(c, x - 1, y, 3, 1, glow || col); R(c, x, y - 1, 1, 3, glow || col);
      c.globalAlpha = 1;
      P(c, x, y, col);
    } else P(c, x, y, MT[0]);
  }
  /* 警示条纹 */
  function hazard(c, x, y, w, h) {
    for (var j = 0; j < h; j++) for (var i = 0; i < w; i++)
      P(c, x + i, y + j, (((x + i + y + j) >> 1) & 1) ? FI[2] : MT[0]);
  }

  /* ====================================================================
   * 第五版（沉稳硬朗，照 concepts/final-style.png）：墙体一律米灰石色；阵营色（砖红、钢蓝、军绿偏青、土金，降了饱和）
   * 只用在屋顶、旗帜、门楣、色带上，约占三成面积；中立的屋顶是深石板灰、不挂旗。轮廓近黑。每种一个独一无二的剪影加一个大标志。
   * 画法：所有形状先落到一张 32×48 的格子里（每个形状自带 1 像素深色轮廓，后画的盖住先画的），
   * 最后一次画出来；烟、灯这些半透明的小东西在那之后直接画。
   * ==================================================================== */
  var W_ = '#ffffff', LT = '#e9e6df', HOLE = '#23282e', OUT = '#23282e';
  var RF = { l: '#5c5c62', m: '#3a4048', d: '#23282e' };                                   /* 屋顶：深石板灰 */
  var STN = { o: OUT, d: '#716e72', m: '#96908a', l: '#b8afa2', h: '#e9e6df' };            /* 混凝土、灰石 */
  var RK = { o: OUT, d: '#474f5c', m: '#716e72', l: '#96908a', h: '#b8afa2' };             /* 矿山的岩石 */
  var WALL = { o: OUT, d: '#b8afa2', m: '#d2c9ba', l: '#e9e6df', h: '#e9e6df' };           /* 墙体：米灰石色，所有阵营一样 */
  var SLATE = { d: '#23282e', m: '#3a4048', l: '#5c5c62', h: '#5c5c62' };                  /* 中立的屋顶 */
  /* 屋顶、旗帜、色带用的阵营色：0 中立 1 砖红 2 钢蓝 3 军绿偏青 4 土金。壳层有 AWArt.BPAL 时以它为准 */
  var FAC = [
    { o: OUT, d: '#96908a', m: '#b8afa2', l: '#d2c9ba', h: '#e9e6df' },
    { o: OUT, d: '#933b3a', m: '#b84a42', l: '#d2604e', h: '#e89078' },
    { o: OUT, d: '#3d6aa8', m: '#4f80c0', l: '#6f9fd6', h: '#a4c8ec' },
    { o: OUT, d: '#2f7a66', m: '#3f9a80', l: '#62b89a', h: '#a0dcc0' },
    { o: OUT, d: '#a07c2c', m: '#c09a38', l: '#dcbc58', h: '#f0dc94' }
  ];
  function tone(info) {
    var p = pal(info), id = owned(info) ? (p.id | 0) : 0;
    if (!id && info && info.owner) id = info.owner | 0;
    id = id <= 0 ? 0 : ((id - 1) % 4) + 1;
    if (!id) return { o: OUT, d: SLATE.d, m: SLATE.m, l: SLATE.l, h: SLATE.h, id: 0 };
    var bp = window.AWArt && window.AWArt.BPAL;
    var t = (bp && bp[id]) || FAC[id];
    return { o: OUT, d: t.d, m: t.m, l: t.l, h: t.h, id: id };
  }
  /* 旗：中立是灰白旗 */
  function flagTone(T) { return T.id ? T : { o: OUT, d: '#96908a', m: '#b8afa2', l: '#e9e6df', h: '#ffffff' }; }
  var GRID = new Array(32 * 48);
  function gclear() { for (var i = 0; i < GRID.length; i++) GRID[i] = null; }
  function gset(x, y, col) { if (x < 0 || x > 31 || y < -16 || y > 31) return; GRID[(y + 16) * 32 + x] = col; }
  /* cells: [x, y, 颜色]…；oc 给了就先在四邻描一圈轮廓 */
  function stamp(cells, oc) {
    var i, q;
    if (oc) for (i = 0; i < cells.length; i++) { q = cells[i]; gset(q[0] - 1, q[1], oc); gset(q[0] + 1, q[1], oc); gset(q[0], q[1] - 1, oc); gset(q[0], q[1] + 1, oc); }
    for (i = 0; i < cells.length; i++) { q = cells[i]; gset(q[0], q[1], q[2]); }
  }
  function gflush(c) {
    for (var j = 0; j < 48; j++) for (var i = 0; i < 32; i++) {
      var col = GRID[j * 32 + i];
      if (!col) continue;
      var n = 1; while (i + n < 32 && GRID[j * 32 + i + n] === col) n++;
      c.fillStyle = col; c.fillRect(i, j - 16, n, 1); i += n - 1;
    }
  }
  function rectCells(x, y, w, h, col) { var a = []; for (var j = 0; j < h; j++) for (var i = 0; i < w; i++) a.push([x + i, y + j, col]); return a; }
  function Rr(x, y, w, h, col) { stamp(rectCells(x, y, w, h, col)); }
  function RO(x, y, w, h, col, oc) { stamp(rectCells(x, y, w, h, col), oc); }
  /* 楼块：左两列亮、右两三列暗、底边暗；r 是顶部两角的圆角半径；rh > 0 时顶上 rh 行是屋顶（色阶 RT；略带俯视，看得到屋面），檐下压一道暗 */
  function B(x, y, w, h, T, r, rh, RT) {
    RT = RT || RF;
    var a = [], dw = w >= 10 ? 3 : 2; r = r || 0; rh = rh || 0;
    for (var j = 0; j < h; j++) {
      var ins = j < r ? Math.max(0, Math.round(r - Math.sqrt(r * r - (r - j - 0.5) * (r - j - 0.5)) - 0.2)) : 0;
      for (var i = ins; i < w - ins; i++) {
        var col = T.m;
        if (j < rh) col = i === w - 1 - ins ? RT.d : j === 0 ? RT.l : RT.m;
        else {
          if (i - ins < 2) col = T.l;
          if (w - ins - 1 - i < dw) col = T.d;
          if (!rh && (j === 0 || (j < r && i - ins === 0))) col = i < w / 2 ? T.h : T.l;
          if (rh && j === rh) col = T.d;
          if (j === h - 1 && h > 3) col = T.d;
        }
        a.push([x + i, y + j, col]);
      }
    }
    stamp(a, OUT);
  }
  /* 石墙 + 阵营色屋顶（T 是屋顶的色阶） */
  function Bk(x, y, w, h, T, rh) { B(x, y, w, h, WALL, 0, rh === undefined ? 3 : rh, T); }
  /* 椭圆体：左上亮、右下暗；只画 y <= clipY 的部分 */
  function E(cx, cy, rx, ry, T, clipY, noOutline, flat) {
    var a = [];
    for (var y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (var x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      if (clipY !== undefined && y > clipY) continue;
      var dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
      if (dx * dx + dy * dy > 1) continue;
      var sh = -dx * 0.75 - dy * 0.7;
      a.push([x, y, flat ? (sh > 0.5 ? T.l : sh > -0.45 ? T.m : T.d) : (sh > 0.62 ? T.h : sh > 0.2 ? T.l : sh > -0.4 ? T.m : T.d)]);
    }
    stamp(a, noOutline ? null : OUT);
  }
  /* 带深色窗框的大窗 */
  function GW(x, y, w, h) {
    Rr(x - 1, y - 1, w + 2, h + 2, OUT);
    Rr(x, y, w, h, GL[1]); Rr(x, y, w, 1, GL[2]); Rr(x + w - 1, y + 1, 1, h - 1, GL[0]);
  }
  /* 小窗：一块玻璃，上沿一道亮、下沿一道深色窗台 */
  function Wn(x, y, w, h) { Rr(x, y, w, h, GL[1]); Rr(x, y, w, 1, GL[2]); Rr(x, y + h, w, 1, OUT); }
  function arch(x, y, w, h, col, oc) {      /* 圆顶门洞 */
    var a = rectCells(x, y + 1, w, h - 1, col);
    for (var i = 1; i < w - 1; i++) a.push([x + i, y, col]);
    stamp(a, oc);
  }
  /* 飘动的旗（落进格子里，带轮廓） */
  function gflag(x, y, w, h, T, f) {
    var F = flagTone(T), Wv = [0, 1, 0, -1], cells = [], i, j;
    for (i = 0; i < w; i++) {
      var dy = i < 1 ? 0 : Wv[((i >> 1) - f) & 3];
      for (j = 0; j < h; j++) cells.push([x + i, y + dy + j, j === 0 ? F.l : j === h - 1 ? F.d : dy < 0 ? F.l : F.m]);
    }
    stamp(cells, OUT);
  }
  function begin(c, x0, x1, len) { S.clear(); S.cast(x0, x1, 30, len || 1); S.flush(c); gclear(); }

  /* =============== 司令部：全图最高，中间高、两翼低的堡垒 + 拱门 + 顶上一面大旗 =============== */
  function hq(c, info) {
    var T = tone(info), f = fr(info);
    begin(c, 2, 30);
    Bk(2, 9, 5, 6, T, 2); Bk(25, 9, 5, 6, T, 2);              /* 两角的角楼 */
    Bk(2, 13, 28, 18, T, 5);                                  /* 两翼 */
    Bk(8, 2, 16, 29, T, 5);                                   /* 主楼 */
    Bk(12, -6, 8, 9, T, 3);                                   /* 顶层 */
    Rr(9, 12, 14, 2, T.m); Rr(21, 12, 2, 2, T.d);             /* 主楼腰上一道色带 */
    arch(13, 21, 6, 10, HOLE, OUT); Rr(13, 22, 1, 9, RF.m);
    Rr(12, 19, 8, 1, T.m);                                    /* 门楣 */
    Wn(10, 8, 3, 3); Wn(19, 8, 3, 3); Wn(14, -2, 4, 2);
    Wn(4, 20, 2, 3); Wn(26, 20, 2, 3); Wn(4, 25, 2, 3); Wn(26, 25, 2, 3);
    Rr(15, 14, 2, 4, FI[2]); Rr(14, 15, 4, 2, FI[2]);         /* 金色徽记 */
    Rr(22, -10, 1, 4, MT[3]); Rr(10, -1, 1, 3, MT[3]);        /* 天线 */
    RO(14, -16, 1, 10, LT, OUT);
    if (T.id) gflag(16, -15, 11, 7, T, f);
    gflush(c);
  }

  /* =============== 城市：三栋高低不一的平顶楼 + 一栋矮裙楼，成排的蓝窗；屋顶是阵营色，最高的楼顶一面小旗 =============== */
  function city(c, info) {
    var T = tone(info), f = fr(info), y;
    begin(c, 2, 30);
    Bk(11, -7, 10, 38, T, 5);
    Bk(2, 2, 10, 29, T, 5);
    Bk(20, 8, 10, 23, T, 5);
    Bk(7, 18, 13, 13, T, 4);
    for (y = 0; y <= 12; y += 4) { Wn(13, y, 2, 2); Wn(17, y, 2, 2); }
    for (y = 9; y <= 13; y += 4) { Wn(4, y, 2, 2); Wn(8, y, 2, 2); }
    for (y = 15; y <= 27; y += 4) { Wn(22, y, 2, 2); Wn(26, y, 2, 2); }
    Wn(4, 17, 2, 2); Wn(4, 21, 2, 2); Wn(4, 25, 2, 2);
    Wn(9, 24, 2, 2); Wn(16, 24, 2, 2);
    Rr(12, 26, 3, 5, HOLE); Rr(11, 25, 5, 1, T.m);
    if (T.id) { RO(15, -13, 1, 6, LT, OUT); gflag(17, -13, 5, 3, T, f); }
    else { RO(13, -9, 3, 2, MT[2], OUT); Rr(18, -10, 1, 3, MT[3]); }                 /* 中立：楼顶只有机房和天线 */
    gflush(c);
  }

  /* =============== 兵工厂：阵营色锯齿屋顶 + 红白条纹烟囱 + 正面一个大齿轮 =============== */
  function factory(c, info) {
    var T = tone(info), f = fr(info), t, i, y, a;
    begin(c, 2, 30);
    B(25, -9, 5, 40, STN);
    Rr(25, -8, 5, 2, FI[0]); Rr(25, -6, 5, 2, LT); Rr(25, -4, 5, 2, FI[0]); Rr(29, -8, 1, 6, STN.d);
    for (t = 0; t < 3; t++) {
      a = [];
      for (i = 0; i < 7; i++) for (y = 12 - i; y <= 13; y++) a.push([2 + t * 7 + i, y, i === 6 ? T.d : y === 12 - i ? T.l : T.m]);
      stamp(a, OUT);
    }
    B(2, 13, 24, 18, WALL); Rr(3, 14, 22, 2, T.m); Rr(23, 14, 2, 2, T.d);          /* 檐下一道色带 */
    /* 齿轮：八个齿、中间一个黑孔；两帧之间齿错开一像素，看着在慢慢转 */
    a = [];
    for (y = -5; y <= 5; y++) for (i = -5; i <= 5; i++) if (i * i + y * y <= 21) a.push([13 + i, 23 + y, i + y > 3 ? STN.d : STN.m]);
    var q = f < 2 ? 0 : 1;
    a = a.concat(rectCells(12 + q, 16, 2, 2, STN.m), rectCells(13 - q, 29, 2, 2, STN.d), rectCells(6, 23 - q, 2, 2, STN.m), rectCells(19, 22 + q, 2, 2, STN.d),
      rectCells(8 + q, 18, 2, 2, STN.m), rectCells(17, 18 + q, 2, 2, STN.m), rectCells(8, 27 - q, 2, 2, STN.d), rectCells(17 - q, 27, 2, 2, STN.d));
    stamp(a, OUT);
    RO(12, 22, 3, 3, HOLE, STN.l);
    Wn(21, 18, 3, 3); Rr(21, 25, 3, 6, HOLE);
    gflush(c);
    smoke(c, 27, -9, f, !owned(info));
  }

  /* =============== 机场：灰塔身顶着玻璃塔台 + 机库 + 停机坪上一架白色小飞机；塔台顶和机库顶是阵营色 =============== */
  function airport(c, info) {
    var T = tone(info), f = fr(info), on = owned(info), i;
    /* 跑道：哪一侧是路（或另一座机场），就朝那一侧铺到格边接上 */
    var lk = function (dx, dy) { var n = nbOf(info, dx, dy); return n === 'road' || n === 'bridge' || n === 'airport'; };
    var wL = lk(-1, 0), wR = lk(1, 0), wD = lk(0, 1);
    var x0 = wL ? 0 : 1, x1 = wR ? 32 : 31;
    R(c, x0, 18, x1 - x0, 13, RD[1]);
    R(c, x0, 18, x1 - x0, 1, RD[3]); R(c, x0, 30, x1 - x0, 1, RD[0]);
    if (wL) R(c, 0, 7, 3, 11, RD[1]);
    if (wR) R(c, 29, 7, 3, 11, RD[1]);
    if (wD) { R(c, 7, 30, 18, 2, RD[1]); }
    for (i = 0; i < 4; i++) R(c, 2 + i * 8, 28, 5, 1, LINE);
    S.clear(); S.cast(5, 11, 20, 1); S.rect(15, 27, 13, 1); S.flush(c); gclear();
    /* 机库：平顶，正面一个大黑门 */
    Bk(14, 3, 17, 16, T, 5);
    Rr(17, 10, 11, 9, HOLE); Rr(17, 10, 11, 1, RF.m);
    /* 塔台：细塔身顶着一间比它宽的玻璃室 */
    B(5, 3, 6, 18, STN);
    Bk(2, -7, 12, 11, T, 3);
    Rr(3, -3, 10, 4, GL[1]); Rr(3, -3, 10, 1, GL[2]); Rr(6, -3, 1, 4, OUT); Rr(9, -3, 1, 4, OUT); Rr(2, -3, 1, 4, OUT); Rr(13, -3, 1, 4, OUT);
    B(6, -10, 4, 3, STN, 1);
    /* 小飞机：停在跑道上（侧面：白机身、阵营色尾翼、灰机翼、一排舷窗） */
    stamp([[13, 13, T.l], [13, 14, T.m], [14, 14, T.m], [13, 15, T.m], [14, 15, T.m], [15, 15, T.m], [13, 16, T.m], [14, 16, T.m], [15, 16, T.d], [16, 16, T.d]], OUT);
    var pl = rectCells(12, 17, 16, 5, LT); pl.push([28, 18, LT], [28, 19, LT], [28, 20, LT], [29, 19, LT], [29, 20, STN.l]);
    stamp(pl, OUT);
    Rr(12, 21, 17, 1, STN.l); Rr(12, 17, 1, 1, STN.l);
    stamp([[17, 22, STN.l], [18, 22, STN.l], [19, 22, STN.l], [20, 22, STN.l], [21, 22, STN.l], [22, 22, STN.l], [17, 23, STN.l], [18, 23, STN.l], [19, 23, STN.l], [20, 23, STN.l], [18, 24, STN.m], [19, 24, STN.m]], OUT);
    Rr(17, 18, 2, 2, GL[0]); Rr(20, 18, 2, 2, GL[0]); Rr(23, 18, 2, 2, GL[0]); Rr(26, 18, 2, 2, HOLE);
    Rr(15, 25, 1, 2, HOLE); Rr(25, 23, 1, 4, HOLE); RO(14, 26, 2, 1, HOLE); RO(24, 26, 2, 1, HOLE);
    gflush(c);
    lamp(c, 8, -12, on && (f === 0 || f === 2), FI[0], FI[1]);
    for (i = 0; i < 4; i++) lamp(c, 1 + i * 10, 30, on && ((i + f) & 1) === 0, FI[2], FI[3]);
  }

  /* =============== 港口：阶梯状仓库（阵营色屋顶）+ 阵营色吊臂和吊钩 + 正面一个大锚；下面是木栈桥 =============== */
  function port(c, info) {
    var T = tone(info), f = fr(info), on = owned(info), i;
    var s0 = nbOf(info, 0, 1), wS = !s0 || !!WATERY[s0];
    if (!wS) R(c, 0, 18, 32, 14, PV[2]);                       /* 南边是陆地：不留水塘，铺成货场 */
    S.clear(); S.rect(3, 31, 28, 1); S.rect(22, 23, 9, 1); S.flush(c); gclear();
    for (i = 0; i < 4; i++) RO(3 + i * 8, 28, 3, 3, WD[2], OUT);
    RO(1, 23, 30, 5, WD[2], OUT); Rr(1, 23, 30, 1, WD[3]);
    for (i = 0; i < 5; i++) Rr(6 + i * 6, 24, 1, 4, WD[0]);
    /* 吊机：灰钢架塔身、阵营色的机房顶和吊臂 */
    B(23, -1, 4, 24, STN); Rr(24, 3, 2, 1, STN.d); Rr(24, 8, 2, 1, STN.d); Rr(24, 13, 2, 1, STN.d); Rr(24, 18, 2, 1, STN.d);
    Bk(21, -5, 8, 6, T, 3);
    B(11, -8, 20, 3, T);
    /* 仓库三层 */
    Bk(2, 13, 19, 10, T, 3); Bk(4, 5, 14, 9, T, 3); Bk(6, -3, 7, 9, T, 3);
    /* 锚：阵营色（中立是深灰） */
    var AC = T.m, A = [].concat(rectCells(10, 8, 4, 1, AC), rectCells(10, 10, 4, 1, AC), [[10, 9, AC], [13, 9, AC]], rectCells(11, 11, 2, 10, AC),
      rectCells(8, 13, 8, 2, AC), rectCells(6, 16, 2, 2, AC), rectCells(16, 16, 2, 2, AC), rectCells(7, 18, 2, 2, AC), rectCells(15, 18, 2, 2, AC), rectCells(8, 20, 8, 2, AC));
    stamp(A, OUT);
    /* 吊索和吊钩：轻轻摆 */
    var sw = [0, 1, 0, -1][f];
    Rr(14, -5, 1, 3, MT[0]); Rr(14 + sw, -2, 1, 2, MT[0]);
    stamp([[13 + sw, 0, MT[3]], [14 + sw, 0, MT[4]], [15 + sw, 0, MT[3]], [15 + sw, 1, MT[3]], [15 + sw, 2, MT[3]], [14 + sw, 3, MT[3]], [13 + sw, 2, MT[3]]], OUT);
    gflush(c);
    lamp(c, 30, -10, on && f < 2, FI[0], FI[1]);
  }

  /* =============== 雷达塔：占大半格的灰白大圆盘天线 + 石色塔座（腰上一道阵营色带） =============== */
  function tower(c, info) {
    var T = tone(info), f = fr(info), on = owned(info), k, right = f < 2;
    begin(c, 8, 24);
    B(8, 19, 16, 12, WALL, 4);
    Rr(9, 22, 14, 2, T.m); Rr(21, 22, 2, 2, T.d);
    arch(14, 25, 4, 6, HOLE, OUT);
    B(13, 9, 6, 11, WALL); Rr(14, 13, 4, 2, T.m);
    /* 斜朝上的大圆盘：先画背面的暗弧，再画浅色盘沿，里面是灰的盘面，中间一根馈源杆 */
    var sg = right ? 1 : -1, ca = Math.cos(0.7), sa = Math.sin(0.7), cx = 15.5 - sg, cy = 3;
    var dish = function (ox, oy, rx, ry, colFn, oc) {
      var a = [];
      for (var y = -9; y <= 14; y++) for (var x = 0; x <= 31; x++) {
        var px = (x + 0.5 - cx - ox) * sg, py = y + 0.5 - cy - oy;
        var u = (px * ca + py * sa) / rx, v = (-px * sa + py * ca) / ry;       /* u 沿盘面长轴，v 沿朝向 */
        if (u * u + v * v <= 1) a.push([x, y, colFn(u, v)]);
      }
      stamp(a, oc);
    };
    dish(-2 * sg, 2, 12, 9, function () { return RF.m; }, OUT);
    dish(0, 0, 12.5, 8.5, function (u, v) { return v > 0.45 ? STN.l : LT; }, OUT);
    dish(sg, -1, 10, 6, function (u, v) { return u < -0.2 ? STN.m : STN.l; });
    for (k = 0; k < 7; k++) Rr(Math.round(cx - 0.5 + sg * (1 + k * 0.75)), Math.round(cy - 1 - k * 0.9), 1, 1, OUT);
    RO(Math.round(cx - 0.5 + sg * 6), -5, 2, 2, T.id ? T.m : FI[0], OUT);
    gflush(c);
    lamp(c, 16, 16, on && (f & 1) === 0, FI[0], FI[1]);
  }

  /* =============== 矿场：深灰山石 + 木框矿洞 + 两侧金矿堆；归属看门楣的漆色和山顶的小旗 =============== */
  function mine(c, info) {
    var T = tone(info), f = fr(info), k, j, a;
    begin(c, 2, 30);
    E(16, 30.5, 14.5, 21, RK, 30, false, true);
    Rr(4, 21, 3, 2, RK.d); Rr(25, 15, 3, 2, RK.d); Rr(7, 13, 3, 2, RK.l); Rr(24, 23, 3, 2, RK.d); Rr(11, 11, 4, 1, RK.h); Rr(18, 12, 3, 1, RK.l);
    /* 矿洞 */
    Rr(12, 22, 8, 9, HOLE);
    RO(9, 19, 14, 3, T.id ? T.m : WD[2], OUT); Rr(9, 19, 14, 1, T.id ? T.l : WD[3]);
    RO(9, 23, 3, 8, WD[2], OUT); RO(20, 23, 3, 8, WD[2], OUT); Rr(9, 23, 1, 8, WD[3]); Rr(20, 23, 1, 8, WD[3]);
    Rr(14, 28, 4, 1, MT[2]); Rr(14, 30, 4, 1, MT[2]);
    Rr(15, 15, 2, 3, FI[2]); Rr(14, 16, 4, 1, FI[2]);                          /* 门楣上一盏矿灯 */
    /* 金矿堆 */
    for (k = 0; k < 2; k++) {
      var cx = k ? 26 : 5; a = [];
      for (j = 0; j < 6; j++) for (var x = cx - 1 - j; x <= cx + 1 + j; x++) if (x >= 1 && x <= 30) a.push([x, 25 + j, x < cx - j + 1 ? LINE : x > cx + (j >> 1) ? FI[1] : FI[2]]);
      stamp(a, OUT);
    }
    /* 山顶的小旗（中立不挂） */
    if (T.id) { RO(16, -1, 1, 10, LT, OUT); gflag(18, 0, 7, 4, T, f); }
    gflush(c);
    var sp = [[4, 27], [27, 26], [6, 29], [25, 29]][f];
    R(c, sp[0] - 1, sp[1], 3, 1, W_); R(c, sp[0], sp[1] - 1, 1, 3, W_);
  }

  /* =============== 医院：中间高、两翼低的楼体 + 正面一块阵营色的牌子，上面一个白色大十字 =============== */
  function hospital(c, info) {
    var T = tone(info), f = fr(info), on = owned(info);
    begin(c, 2, 30);
    Bk(2, 13, 28, 18, T, 5);
    B(13, -8, 6, 5, STN);
    Bk(8, -4, 16, 35, T, 4);
    Rr(10, 1, 12, 13, T.m); Rr(21, 1, 1, 13, T.d); Rr(10, 13, 12, 1, T.d);
    Rr(14, 2, 4, 11, W_); Rr(11, 5, 10, 4, W_);
    arch(13, 22, 6, 9, HOLE, OUT); Rr(14, 24, 4, 7, GL[1]); Rr(14, 24, 2, 7, GL[2]);
    Wn(4, 20, 2, 3); Wn(26, 20, 2, 3); Wn(4, 25, 2, 3); Wn(26, 25, 2, 3);
    Wn(10, 17, 2, 3); Wn(20, 17, 2, 3);
    Rr(11, -6, 1, 2, MT[3]); Rr(21, -7, 1, 3, MT[3]);
    gflush(c);
    lamp(c, 16, -10, on && f < 2, FI[0], FI[1]);
  }

  /* =============== 碉堡：矮扁的混凝土圆顶（顶盖是阵营色）+ 一道深色长射击孔 + 脚下一排沙袋 =============== */
  function fort(c, info) {
    var T = tone(info), f = fr(info), on = owned(info), i;
    begin(c, 1, 31);
    E(16, 29, 14, 21, STN, 24, false, true);
    E(16, 29, 14, 21, T, 12, true, true);
    RO(7, 16, 18, 4, HOLE, OUT);
    Rr(7, 14, 18, 1, STN.l);
    for (i = 0; i < 3; i++) { RO(5 + i * 8, 23, 6, 3, SD[2], OUT); Rr(5 + i * 8, 23, 6, 1, SD[3]); Rr(10 + i * 8, 24, 1, 2, SD[1]); }
    for (i = 0; i < 4; i++) { RO(1 + i * 8, 27, 6, 3, SD[2], OUT); Rr(1 + i * 8, 27, 6, 1, SD[3]); Rr(6 + i * 8, 28, 1, 2, SD[1]); }
    /* 顶上一面小旗（中立不挂） */
    if (T.id) { RO(15, 0, 1, 8, LT, OUT); gflag(17, 1, 6, 4, T, f); }
    gflush(c);
    if (on && f === 2) { R(c, 9, 17, 2, 2, FI[3]); }
  }

  /* =============== 导弹井：混凝土圆形井台（前沿一圈黄黑警示条）+ 张开的阵营色井盖 + 白色导弹红色弹头 =============== */
  function siloBase(T) {
    var a = [], x, y;
    B(9, 6, 4, 11, T, 2); B(19, 6, 4, 11, T, 2);              /* 后面两片井盖 */
    for (y = 15; y <= 30; y++) for (x = 1; x <= 30; x++) {
      var dx = (x + 0.5 - 16) / 14.5;
      if (dx * dx > 1) continue;
      var e = Math.sqrt(1 - dx * dx) * 6;
      if (y + 0.5 < 21 - e || y + 0.5 > 25 + e) continue;
      var top = y + 0.5 <= 21 + e, col = top ? (dx > 0.55 ? STN.m : STN.l) : dx < -0.4 ? STN.l : dx > 0.35 ? STN.d : STN.m;
      if (!top && y + 0.5 > 23.5 + e) col = ((x >> 1) & 1) ? FI[2] : HOLE;          /* 警示条 */
      a.push([x, y, col]);
    }
    stamp(a, OUT);
    a = [];
    for (y = 17; y <= 25; y++) for (x = 6; x <= 26; x++) { var ex = (x + 0.5 - 16) / 8.5, ey = (y + 0.5 - 21) / 3.6; if (ex * ex + ey * ey <= 1) a.push([x, y, ey < -0.35 ? HOLE : MT[1]]); }
    stamp(a, OUT);
  }
  function siloFins(T) {
    var rows = [[8, 2, 4], [9, 2, 5], [10, 2, 6], [11, 2, 6], [12, 2, 6], [13, 3, 7], [14, 3, 7], [15, 3, 7], [16, 3, 7], [17, 4, 8], [18, 4, 8], [19, 4, 8], [20, 5, 8]];
    for (var m = 0; m < 2; m++) {
      var a = [];
      for (var k = 0; k < rows.length; k++) for (var x = rows[k][1]; x <= rows[k][2]; x++) {
        var X = m ? 31 - x : x;
        a.push([X, rows[k][0], x === rows[k][1] ? (m ? T.d : T.l) : x === rows[k][2] ? (m ? T.l : T.d) : T.m]);
      }
      stamp(a, OUT);
    }
  }
  function silo(c, info) {
    var T = tone(info), f = fr(info), a, y;
    begin(c, 2, 30);
    siloBase(T);
    /* 导弹 */
    RO(11, 14, 2, 6, FI[0], OUT); RO(19, 14, 2, 6, FI[0], OUT);
    RO(13, -1, 6, 22, LT, OUT); Rr(17, -1, 2, 22, STN.l);
    Rr(13, 8, 6, 3, T.m); Rr(17, 8, 2, 3, T.d);
    a = [];
    var wd = [2, 2, 4, 4, 6, 6, 6];
    for (y = 0; y < 7; y++) for (var i = 0; i < wd[y]; i++) a.push([16 - wd[y] / 2 + i, -8 + y, i < wd[y] / 2 ? FI[1] : FI[0]]);
    stamp(a, OUT);
    siloFins(T);
    gflush(c);
    lamp(c, 5, 25, f === 0 || f === 2, FI[0], FI[1]);
    lamp(c, 26, 25, f === 1 || f === 3, FI[0], FI[1]);
  }
  function silo_used(c, info) {
    var T = tone(info), f = fr(info);
    begin(c, 2, 30);
    siloBase(T);
    siloFins(T);
    gflush(c);
    R(c, 9, 16, 4, 1, MT[0]); R(c, 20, 26, 3, 1, MT[0]);       /* 焦痕 */
    c.globalAlpha = 0.85; smoke(c, 14, 19, f, true);
    c.globalAlpha = 0.6; smoke(c, 18, 15, (f + 1) & 3, true);
    c.globalAlpha = 1;
  }

  /* 一座建筑的画法只取决于种类、归属、帧，机场和港口再加上邻格：第一次画的时候把 fillRect 记下来，之后照着重放 */
  var recCache = {};
  var REC = {
    _f: '', globalAlpha: 1, list: null,
    get fillStyle() { return this._f; }, set fillStyle(v) { this._f = v; },
    fillRect: function (x, y, w, h) { this.list.push(this._f, this.globalAlpha, x, y, w, h); }
  };
  function cached(type, fn) {
    return function (c, info) {
      var T = tone(info), key = type + '|' + T.id + '|' + fr(info) + '|' + (owned(info) ? 1 : 0), bp = window.AWArt && window.AWArt.BPAL;
      if (bp) key += '|' + bp[T.id].m;
      if (type === 'airport') key += '|' + nbOf(info, -1, 0) + '|' + nbOf(info, 1, 0) + '|' + nbOf(info, 0, 1);
      else if (type === 'port') key += '|' + nbOf(info, 0, 1);
      var rec = recCache[key];
      if (!rec) { REC.list = rec = []; REC.globalAlpha = 1; REC._f = ''; fn(REC, info); recCache[key] = rec; }
      for (var i = 0; i < rec.length; i += 6) { c.fillStyle = rec[i]; c.globalAlpha = rec[i + 1]; c.fillRect(rec[i + 2], rec[i + 3], rec[i + 4], rec[i + 5]); }
      c.globalAlpha = 1;
    };
  }
  window.AWArtBuildings = {
    hq: cached('hq', hq), city: cached('city', city), factory: cached('factory', factory), airport: cached('airport', airport), port: cached('port', port),
    tower: cached('tower', tower), mine: cached('mine', mine), hospital: cached('hospital', hospital), fort: cached('fort', fort),
    silo: cached('silo', silo), silo_used: cached('silo_used', silo_used)
  };
})();

// ═════════════════════════════════════════════════════════════════════════════════════════
// 第二代物件摆放（挂在 window.AWArt2 上）：一格 = 48 逻辑像素。树、山、礁石、废墟、芦苇、城墙、桥、建筑都是 tiles.js 里的素材
// （图像模型画、tools/cut-tiles.js 切），这里只决定每格摆什么、摆在哪。
//   AWArt2.objects(map, tx, ty, frame, out)   把这一格的物件推进 out：{ s: 素材, x, y: 左上角（地图像素）, b: 排序用的落脚线, sh: 投影椭圆 [cx, cy, rx, ry], sway }
// 壳层按 b 从上到下贴，所以连片的森林、山脉自然前后遮挡。位置和变体都由格子坐标的伪随机数决定，同一张图每次画出来一样。
(function (root) {
  'use strict';
  const A2 = root.AWArt2; if (!A2) return;
  const G = 48, hash = A2.hash, rgb = A2.rgb;
  const BUILD = { hq: 1, city: 1, factory: 1, airport: 1, port: 1, tower: 1, mine: 1, hospital: 1, fort: 1, silo: 1, silo_used: 1, lab: 1, gate: 1 };
  // 烟：程序画的小烟团，四帧往上飘
  let SMOKE = null;
  function smoke() {
    if (SMOKE) return SMOKE;
    const L = rgb('#f0f0ec'), Mc = rgb('#c8ccd0'), D = rgb('#8c9098');
    SMOKE = [];
    for (let f = 0; f < 4; f++) {
      const w = 16, h = 22, pix = new Uint32Array(w * h);
      const disc = (cx, cy, r) => { for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) { if (x * x + y * y > r * r + 1) continue; const X = cx + x, Y = cy + y; if (X < 0 || Y < 0 || X >= w || Y >= h) continue; pix[Y * w + X] = (x * x + y * y > (r - 1) * (r - 1)) ? (y > 0 || x > 0 ? D : Mc) : (x + y > 1 ? Mc : L); } };
      for (let k = 0; k < 3; k++) { const t = (k * 4 + f) / 12; disc(4 + Math.round(t * 7 + Math.sin(t * 6) * 1.5), h - 3 - Math.round(t * 17), 2 + Math.round(t * 2.2)); }
      SMOKE.push({ w, h, pix });
    }
    return SMOKE;
  }
  // 建筑上冒烟的位置（相对素材左上角的烟囱口）
  const CHIMNEY = { factory: [[33, 2], [27, 6]], silo_used: [[21, 12]] };
  // 旗子飘动：找出素材顶部那面旗（红方母版上顶部四分之一里的红色像素的外接框），四帧里把各列上下错开一像素
  const FLAGS = { hq: 1, hospital: 1, fort: 1 }, flagRect = {}, flagCache = {};
  function flagged(name, owner, frame) {
    const T = root.AWTiles, base = T.get(name, owner); if (!base || !(frame & 3)) return base;
    const key = name + '|' + owner + '|' + (frame & 3); if (flagCache[key]) return flagCache[key];
    let R = flagRect[name];
    if (R === undefined) {
      const m = T.get(name, 1), lim = Math.round(m.h * 0.24); let x0 = m.w, y0 = m.h, x1 = -1, y1 = -1;
      for (let y = 0; y < lim; y++) for (let x = 0; x < m.w; x++) { const v = m.pix[y * m.w + x]; if (!v) continue; const r = v & 255, g = v >> 8 & 255, b = v >> 16 & 255; if (r > 150 && g < 110 && b < 100) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } }
      R = flagRect[name] = x1 < 0 ? null : [x0 + 1, Math.max(1, y0 - 1), Math.min(m.w - 1, x1 + 1), Math.min(m.h - 2, y1 + 2)];
    }
    if (!R) return base;
    const pix = base.pix.slice(), w = base.w;
    for (let x = R[0]; x <= R[2]; x++) {
      const d = [0, -1, 0, 1][(x - R[0] + frame) & 3]; if (!d) continue;
      for (let y = R[1]; y <= R[3]; y++) { const sy = y - d; pix[y * w + x] = sy >= R[1] - 1 && sy <= R[3] + 1 ? base.pix[sy * w + x] : 0; }
    }
    return (flagCache[key] = { w: base.w, h: base.h, pix });
  }
  // 科研所：圆顶里的镜头和天线顶上的灯。缩到网格后这两处只剩一两个像素，这里按位置补画：前两帧青色，后两帧亮成近白、天线灯多一圈青色光晕
  const blinkCache = {}, LAB_LENS = [[19, 7], [20, 7], [20, 8]], LAB_TIP = [[31, 8], [32, 8], [31, 9], [32, 9]], LAB_HALO = [[30, 8], [33, 8], [30, 9], [33, 9], [31, 7], [32, 7]];
  function blink(name, owner, frame) {
    const T = root.AWTiles, base = T.get(name, owner); if (!base) return base;
    const on = (frame & 3) >= 2, key = name + '|' + owner + '|' + (on ? 1 : 0); if (blinkCache[key]) return blinkCache[key];
    const pix = base.pix.slice(), w = base.w, cy = rgb('#28d8e8'), hi = rgb('#e0ffff'), halo = rgb('#58e4f0');
    for (const p of LAB_LENS.concat(LAB_TIP)) pix[p[1] * w + p[0]] = on ? hi : cy;
    if (on) for (const p of LAB_HALO) pix[p[1] * w + p[0]] = halo;
    return (blinkCache[key] = { w, h: base.h, pix });
  }
  // 潮闸：信号灯（右上角那盏，各阵营都是红灯）前两帧暗、后两帧亮；闸门下的水花四帧里每帧横移一像素
  const gateCache = {};
  function gateAnim(owner, frame) {
    const T = root.AWTiles, base = T.get('gate', owner); if (!base) return base;
    const f = frame & 3, key = owner + '|' + f; if (gateCache[key]) return gateCache[key];
    const m = T.get('gate', 1), w = base.w, h = base.h, pix = base.pix.slice();
    const on = f >= 2, dim = rgb('#9c2018'), lit = rgb('#ff4c3c'), core = rgb('#ffe0d0');
    let lx = 0, ly = 0, ln = 0;
    for (let y = 0; y < Math.round(h * 0.3); y++) for (let x = Math.round(w * 0.6); x < w; x++) { const v = m.pix[y * w + x]; if (!v) continue; const r = v & 255, g = v >> 8 & 255, b = v >> 16 & 255; if (r > 170 && g < 100 && b < 100) { pix[y * w + x] = on ? lit : dim; lx += x; ly += y; ln++; } }
    if (on && ln) pix[Math.round(ly / ln) * w + Math.round(lx / ln)] = core;
    if (f) for (let y = Math.round(h * 0.84); y < h; y++) {
      let x0 = -1, x1 = -1;
      for (let x = 0; x < w; x++) { const v = base.pix[y * w + x]; if (!v) continue; const r = v & 255, g = v >> 8 & 255, b = v >> 16 & 255; if (b > r + 40 && g > r + 20) { if (x0 < 0) x0 = x; x1 = x; } }
      if (x0 < 0 || x1 - x0 < 3) continue;
      const n = x1 - x0 + 1; for (let x = x0; x <= x1; x++) pix[y * w + x] = base.pix[y * w + x0 + ((x - x0 + f * 2) % n)];
    }
    return (gateCache[key] = { w, h, pix });
  }
  // 炽光脉动：素材里橙白、金白的发光像素四帧里 常亮 → 提亮 → 常亮 → 压暗；spark 时提亮那一帧在光的上方迸一粒火星
  const pulseCache = {};
  function pulse(name, owner, frame, spark) {
    const T = root.AWTiles, base = T.get(name, owner); if (!base) return base;
    const f = frame & 3; if (f === 0 || f === 2) return base;
    const key = name + '|' + owner + '|' + f; if (pulseCache[key]) return pulseCache[key];
    const w = base.w, h = base.h, pix = base.pix.slice(), up = f === 1; let top = -1;
    for (let i = 0; i < pix.length; i++) {
      const v = pix[i]; if (!v) continue; const r = v & 255, g = v >> 8 & 255, b = v >> 16 & 255;
      if (!(r > 150 && g > 50 && g < r && b < 170 && r - b > 70 && (name !== 'mine' || i % w >= w * 0.27 || i > w * h * 0.56)) && !(r > 235 && g > 225 && b > 170)) continue;
      if (top < 0 && g > 150) top = i;
      // 提亮往橙白（255,232,170）靠，不到纯白；压暗乘 0.78
      const mixc = (c, t) => Math.max(0, Math.min(255, Math.round(up ? c + (t - c) * 0.2 : c * 0.8)));
      pix[i] = ((255 << 24) | (mixc(b, 170) << 16) | (mixc(g, 232) << 8) | mixc(r, 255)) >>> 0;
    }
    if (spark && up && top >= 3 * w) { pix[top - 3 * w + 1] = rgb('#fff0b0'); pix[top - 2 * w + 1] = rgb('#ffb040'); }
    return (pulseCache[key] = { w, h, pix });
  }
  // 桥的接续段：a / b = 起始端 / 末端接着另一格桥。接着的那一头把 9 像素宽的桥桩换成往里 12 像素处的桥身
  const spanCache = {};
  function span(name, horiz, a, b) {
    const base = root.AWTiles.get(name, 0); if (!base || (!a && !b)) return base;
    const key = name + (a ? 'a' : '') + (b ? 'b' : ''); if (spanCache[key]) return spanCache[key];
    const w = base.w, h = base.h, pix = base.pix.slice(), E = 9, S = 12;
    if (horiz) for (let y = 0; y < h; y++) for (let k = 0; k < E; k++) { if (a) pix[y * w + k] = base.pix[y * w + k + S]; if (b) pix[y * w + w - 1 - k] = base.pix[y * w + w - 1 - k - S]; }
    else for (let x = 0; x < w; x++) for (let k = 0; k < E; k++) { if (a) pix[k * w + x] = base.pix[(k + S) * w + x]; if (b) pix[(h - 1 - k) * w + x] = base.pix[(h - 1 - k - S) * w + x]; }
    return (spanCache[key] = { w, h, pix });
  }
  const PINES = ['pine0', 'pine1', 'pine3', 'pine1', 'pine0', 'pine2'], SHORT = ['pine2', 'pine3', 'oak0', 'oak1'], LEAF = ['oak0', 'oak1', 'pine2', 'oak1'];

  A2.objects = function (m, tx, ty, frame, out) {
    const T = root.AWTiles, w = m.w, h = m.h;
    const type = m.t[ty][tx], ox = tx * G, oy = ty * G;
    const nb = (dx, dy) => { const x = tx + dx, y = ty + dy; return x >= 0 && y >= 0 && x < w && y < h ? m.t[y][x] : type; };
    const r = i => hash(tx, ty, 200 + i);
    const put = (name, cx, by, o) => {
      const s = typeof name === 'string' ? T.get(name, o && o.owner || 0) : name; if (!s) return null;
      const e = { s, x: Math.round(cx - s.w / 2), y: Math.round(by - s.h), b: by + (o && o.z || 0), sh: null, sway: o && o.sway ? 1 + ((r(90) * 4) | 0) : 0 };
      if (!o || o.shadow !== 0) { const k = o && o.shadow || 1; e.sh = [Math.round(cx + s.w * 0.06), by - 1, Math.round(s.w * 0.42 * k), Math.max(2, Math.round(s.w * 0.13 * k))]; }
      out.push(e); return e;
    };
    if (type === 'forest') {
      // 一格一团：后排两棵、前排一棵抱在一起，不越出本格左右，树尖探出格顶不超过三分之一格
      const leafy = A2.vn(tx, ty, 3.1, 301) > 0.56;
      const back = leafy ? ['oak0', 'pine3', 'oak1', 'pine1'] : ['pine1', 'pine3', 'pine1', 'pine2'], front = leafy ? ['oak0', 'oak1', 'oak1', 'pine2'] : ['pine0', 'pine0', 'pine2', 'oak0'];
      const tree = (name, cx, by, z) => { const s = T.get(name, 0); if (!s) return; cx = Math.max(ox + s.w / 2 - 2, Math.min(ox + G - s.w / 2 + 2, cx)); put(name, cx, Math.min(by, oy + 47), { shadow: 0.9, z }); };
      if (r(1) < 0.14) tree(r(2) < 0.5 ? 'grove0' : 'grove1', ox + 24, oy + 46, 0);
      else {
        tree(back[(r(3) * 4) | 0], ox + 13 + r(4) * 3, oy + 31 + r(5) * 3, 0);
        tree(back[(r(6) * 4) | 0], ox + 34 + r(7) * 3, oy + 33 + r(8) * 3, 0);
        tree(front[(r(9) * 4) | 0], ox + 21 + r(10) * 7, oy + 46, 0);
      }
    } else if (type === 'mountain') {
      // 一格一座敦实的山体，不向左右越界
      const set = T.has('peak3') ? ['peak0', 'peak3', 'peak1', 'peak4', 'peak5', 'peak6', 'peak7', 'peak8', 'peak2', 'peak3', 'peak4', 'peak7'] : ['peak0', 'peak1', 'peak0', 'peak1', 'peak2'];
      const name = set[(r(1) * set.length) | 0];
      put(name, ox + 24, oy + 47, { shadow: 1.0 });
      if (name === 'peak2' || r(6) < 0.35) put(r(7) < 0.5 ? 'rocks0' : 'rocks1', ox + 14 + r(8) * 20, oy + 48, { z: 1, shadow: 0 });
    } else if (type === 'ruins') {
      put(['ruin0', 'ruin1', 'ruin2'][(r(1) * 3) | 0], ox + 24 + (r(2) - 0.5) * 6, oy + 43);
      if (r(3) < 0.6) put('debris0', ox + 12 + r(4) * 24, oy + 47, { z: 1, shadow: 0 });
    } else if (type === 'waste') {
      const v = r(1);
      if (v < 0.3) put(r(2) < 0.5 ? 'crater0' : 'crater1', ox + 16 + r(3) * 16, oy + 26 + r(4) * 16, { shadow: 0 });
      else if (v < 0.42) put('debris0', ox + 16 + r(3) * 16, oy + 28 + r(4) * 14, { shadow: 0 });
      else if (v < 0.62) put(['stone0', 'stone1', 'pebble0', 'stump0'][(r(2) * 4) | 0], ox + 10 + r(3) * 28, oy + 18 + r(4) * 26);
    } else if (type === 'swamp') {
      const n = 2 + ((r(1) * 2) | 0);
      for (let k = 0; k < n; k++) put(['reed0', 'reed1', 'reed2'][(r(10 + k) * 3) | 0], ox + 8 + r(20 + k) * 32, oy + 20 + r(30 + k) * 26, { shadow: 0.5, sway: 1 });
    } else if (type === 'reef') {
      put(['reef0', 'reef2', 'reef1'][(r(1) * 3) | 0], ox + 24 + (r(2) - 0.5) * 8, oy + 40 + (r(3) - 0.5) * 6, { shadow: 0 });
      if (r(4) < 0.4) put('reef1', ox + 12 + r(5) * 24, oy + 18, { shadow: 0, z: -30 });
    } else if (type === 'wall') {
      const wl = (dx, dy) => { const x = tx + dx, y = ty + dy; return x >= 0 && y >= 0 && x < w && y < h && m.t[y][x] === 'wall'; };   // 地图外不算城墙
      const L = wl(-1, 0), R = wl(1, 0), U = wl(0, -1), D = wl(0, 1), n = L + R + U + D;
      const hasH = L || R, hasV = U || D;
      if (hasV) { const e = put('wallV', ox + 24, oy + (D ? 48 : 40), { shadow: 0, z: D ? -20 : -2 }); if (e && U) { e.y = oy - 8; } }
      if (hasH) put('wallH', ox + 24, oy + 41, { shadow: 0.6, z: -1 });
      if (n === 0) put('wallH', ox + 24, oy + 41, { shadow: 0.6, z: -1 });            // 孤立的一格：一段墙
      else if (n === 1 || (hasH && hasV)) put('wallT', ox + 24, oy + 45, { shadow: 0.9 });   // 只有端点和拐角（含岔口）立塔楼
    } else if (type === 'bridge') {
      const rd = t => t === 'road' || t === 'bridge' || !!BUILD[t], wt = t => t === 'river' || t === 'sea' || t === 'reef';
      let horiz = rd(nb(-1, 0)) || rd(nb(1, 0));
      if (horiz && (rd(nb(0, -1)) || rd(nb(0, 1))) && !(wt(nb(0, -1)) || wt(nb(0, 1)))) horiz = false;
      if (!horiz && !(rd(nb(0, -1)) || rd(nb(0, 1)))) horiz = wt(nb(0, -1)) || wt(nb(0, 1));
      const sea = [nb(-1, 0), nb(1, 0), nb(0, -1), nb(0, 1)].some(t => t === 'sea' || t === 'reef' || t === 'port') && ![nb(-1, 0), nb(1, 0), nb(0, -1), nb(0, 1)].some(t => t === 'river');
      // 长桥：和相邻桥格接上的那一头不画桥桩（用桥身中段的图案接过去），只有桥的两头有桥桩
      const a = horiz ? nb(-1, 0) === 'bridge' : nb(0, -1) === 'bridge', b = horiz ? nb(1, 0) === 'bridge' : nb(0, 1) === 'bridge';
      put(span((sea ? 'steel' : 'wood') + (horiz ? 'H' : 'V'), horiz, a, b), ox + 24, oy + (horiz ? 41 : 48), { shadow: 0, z: -40 });
    } else if (BUILD[type]) {
      const owner = type === 'silo' || type === 'silo_used' ? 0 : ((m.owner && m.owner[ty] && m.owner[ty][tx]) || 0);
      const name = type === 'city' && hash(tx, ty, 77) < 0.4 ? 'city2' : type;
      const e = put(FLAGS[name] ? flagged(name, owner, frame) : name === 'lab' ? blink(name, owner, frame) : name === 'gate' ? gateAnim(owner, frame) : name === 'mine' ? pulse('mine', owner, frame, true) : name, ox + 24, oy + (type === 'port' ? 47 : 46), { owner, shadow: type === 'port' || type === 'airport' ? 0 : 1.1 });
      const ch = CHIMNEY[type];
      if (e && ch) { const S = smoke(); ch.forEach((p, k) => out.push({ s: S[(frame + k * 2) & 3], x: e.x + p[0] - 5, y: e.y + p[1] - 20, b: e.b + 0.1, sh: null, sway: 0 })); }
    } else if (type === 'shard') {
      // 碎片堆：陨星碎片，裂缝的光四帧脉动，脚下一圈橙色辉光
      const e = put(pulse(r(1) < 0.5 ? 'shard0' : 'shard1', 0, frame + ((r(2) * 4) | 0), false), ox + 24, oy + 42, { shadow: 0 });
      if (e) e.gl = [ox + 24, oy + 36, 19 + [0, 2, 0, -1][(frame + ((r(2) * 4) | 0)) & 3], 10];
    } else if (type === 'shard_used') {
      put('shardpit', ox + 24, oy + 40, { shadow: 0 });
    } else if (type === 'plain') {
      const v = r(1), near = (nb(-1, 0) === 'forest') + (nb(1, 0) === 'forest') + (nb(0, -1) === 'forest') + (nb(0, 1) === 'forest');
      if (v < 0.6) put(['tuft0', 'tuft1', 'tuft2'][(r(2) * 3) | 0], ox + 6 + r(3) * 36, oy + 12 + r(4) * 32, { shadow: 0 });
      if (v < 0.24) put(['tuft1', 'tuft2', 'tuft0'][(r(5) * 3) | 0], ox + 6 + r(6) * 36, oy + 12 + r(7) * 32, { shadow: 0 });
      const u = r(8);
      if (u < 0.09) put(['flower0', 'flower1', 'flower2'][(r(9) * 3) | 0], ox + 8 + r(10) * 32, oy + 14 + r(11) * 30, { shadow: 0 });
      else if (u < 0.13) put(['stone0', 'stone1', 'pebble0'][(r(9) * 3) | 0], ox + 10 + r(10) * 28, oy + 16 + r(11) * 28, { shadow: 0.8 });
      else if (u < 0.13 + 0.05 + near * 0.08) put(r(9) < 0.6 ? 'shrub0' : r(9) < 0.85 ? 'sap0' : 'sap1', ox + 10 + r(10) * 28, oy + 20 + r(11) * 26, { shadow: 0.8 });
    } else if (type === 'beach') {
      if (r(1) < 0.12) put(['pebble0', 'stone0', 'log0'][(r(2) * 3) | 0], ox + 12 + r(3) * 24, oy + 18 + r(4) * 24, { shadow: 0 });
    }
  };
  A2.pokes = t => !!BUILD[t] || t === 'forest' || t === 'mountain' || t === 'ruins' || t === 'wall' || t === 'swamp' || t === 'bridge';
})(window);
