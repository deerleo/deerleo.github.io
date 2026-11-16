/* 切りもどし — 画面・操作・進行 */
(function () {
  'use strict';
  var K = window.KIRI, DEFS = window.KIRI_LEVELS, LV = DEFS.map(K.parseLevel), AU = window.KIRI_AUDIO;
  var W = 1280, H = 720, TABLE_Y = 632;
  var cv = document.getElementById('c'), ctx = cv.getContext('2d');
  var KANJI = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '自由'];
  var FONT = '"Yu Mincho","YuMincho","Hiragino Mincho ProN","Noto Serif JP","MS PMincho",serif';
  var C = { ink: '#2b2420', bark: '#3b2d24', barkHi: '#7a604c', red: '#c8452f', redD: '#a53422', bud: '#b4d65e', pink: '#f4b3c2', pinkD: '#e58aa2', gold: '#f2c14e', water: '#5aa6c8', cream: '#f3ead6' };
  var LAST = LV.length - 2, FREE = LV.length - 1;   // 最後の鉢と自由鉢の番号
  var POTS = ['#34506b', '#5b6b4a', '#7a4a3a', '#4a4763', '#2f5d5a', '#6b5a3a'];
  // 季節: 0春 1夏 2秋 3冬
  var SEASON = [0, 0, 0, 1, 1, 1, 2, 2, 2, 3, 0, 0];
  var SUNCOL = ['#e58a7a', '#e2a23c', '#d2603a', '#9fb3c4'];
  var LEAFCOL = [['#86b356', '#6f9a4a', '#9cc566'], ['#5f9148', '#4f7a3a', '#74a552'], ['#d9793a', '#c8452f', '#e2b040'], ['#5b7f58', '#4a6b4c', '#6f9a6a']];

  var G = {
    scene: 'title', t: 0, scale: 1, mx: -99, my: -99, li: 0, L: null, S: null, lay: null,
    undo: [], grow: {}, popAt: {}, wv: {}, hover: -1, lockUntil: 0, cleared: false, clearAt: 0, stampAt: 0, result: null,
    falls: [], parts: [], btns: [], snipT: -9, msg: null, startT: 0, slotHover: -1, hero: null, heroLay: null
  };

  // ---------- 保存 ----------
  var SAVE_KEY = 'kirimodoshi_v1', save = { cleared: {}, ended: false, muted: false };
  try { var raw = localStorage.getItem(SAVE_KEY); if (raw) { var o = JSON.parse(raw); if (o && o.cleared) save = o; } } catch (e) { }
  function store() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { } }
  function unlocked(i) {
    if (i === FREE) return !!save.cleared[LAST];
    return i === 0 || !!save.cleared[i - 1] || !!save.cleared[i];
  }
  function packTree(S) { var a = [], k, n; for (k in S.nodes) { n = S.nodes[k]; a.push([n.id, n.x, n.y, n.parent, n.bloom ? 1 : 0]); } return a; }
  function unpackTree(a) {
    var N = {}, i, r;
    for (i = 0; i < a.length; i++) { r = a[i]; N[r[0]] = { id: r[0], x: r[1], y: r[2], parent: r[3], bloom: !!r[4], children: [], buds: [] }; }
    for (i in N) if (N[i].parent >= 0 && N[N[i].parent]) N[N[i].parent].children.push(N[i].id);
    return N;
  }

  // ---------- 小道具 ----------
  function hash(x, y, k) { var s = Math.sin(x * 127.1 + y * 311.7 + (k || 0) * 74.7) * 43758.5453; return s - Math.floor(s); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function ease(p) { p = clamp(p, 0, 1); return 1 - Math.pow(1 - p, 3); }
  function back(p) { p = clamp(p, 0, 1); var c = 1.9; return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2); }
  function font(size, bold) { ctx.font = (bold ? '600 ' : '') + size + 'px ' + FONT; }
  function text(s, x, y, size, col, align, bold) { font(size, bold); ctx.fillStyle = col; ctx.textAlign = align || 'left'; ctx.textBaseline = 'middle'; ctx.fillText(s, x, y); }
  function vtext(s, x, y, size, col, bold) {
    font(size, bold); ctx.fillStyle = col; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (var i = 0; i < s.length; i++) {
      var ch = s[i];
      if (ch === '、' || ch === '。') { ctx.fillText(ch, x + size * 0.62, y - size * 0.62); y += size * 0.45; }
      else if (ch === '　') y += size * 0.6;
      else { ctx.fillText(ch, x, y); y += size * 1.1; }
    }
    return y;
  }
  function rrect(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

  // ---------- 和紙の地 ----------
  var paper = document.createElement('canvas'); paper.width = W; paper.height = H;
  (function () {
    var p = paper.getContext('2d'), i, s = 7;
    function r() { s = (s * 16807) % 2147483647; return s / 2147483647; }
    var g = p.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#f3ebd8'); g.addColorStop(1, '#eadfc6');
    p.fillStyle = g; p.fillRect(0, 0, W, H);
    for (i = 0; i < 2600; i++) {
      var x = r() * W, y = r() * H, a = r() * Math.PI, l = 4 + r() * 22;
      p.strokeStyle = r() < 0.5 ? 'rgba(255,252,240,' + (0.15 + r() * 0.3) + ')' : 'rgba(150,120,80,' + (0.03 + r() * 0.07) + ')';
      p.lineWidth = 0.5 + r() * 0.8; p.beginPath(); p.moveTo(x, y); p.quadraticCurveTo(x + Math.cos(a) * l * 0.5 + r() * 4, y + Math.sin(a) * l * 0.5 + r() * 4, x + Math.cos(a) * l, y + Math.sin(a) * l); p.stroke();
    }
    for (i = 0; i < 900; i++) { p.fillStyle = 'rgba(120,90,60,' + (0.03 + r() * 0.06) + ')'; p.fillRect(r() * W, r() * H, 1 + r() * 1.5, 1 + r() * 1.5); }
    var v = p.createRadialGradient(W / 2, H / 2, 300, W / 2, H / 2, 800); v.addColorStop(0, 'rgba(120,90,50,0)'); v.addColorStop(1, 'rgba(120,90,50,0.16)');
    p.fillStyle = v; p.fillRect(0, 0, W, H);
  })();

  function drawBackground(season) {
    ctx.drawImage(paper, 0, 0, W, H);
    // 淡い日輪
    var sx = 250, sy = 200, g = ctx.createRadialGradient(sx, sy, 20, sx, sy, 150);
    ctx.globalAlpha = 0.34; g.addColorStop(0, SUNCOL[season]); g.addColorStop(0.72, SUNCOL[season]); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(sx, sy, 150, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
    // 遠山のにじみ
    for (var k = 0; k < 2; k++) {
      ctx.fillStyle = k ? 'rgba(70,80,90,0.10)' : 'rgba(70,80,90,0.06)';
      ctx.beginPath(); ctx.moveTo(0, TABLE_Y);
      for (var x = 0; x <= W; x += 20) ctx.lineTo(x, TABLE_Y - 70 - k * -30 - 60 * Math.sin(x * 0.004 + k * 2.1) - 26 * Math.sin(x * 0.011 + k * 5) - (k ? 0 : 60));
      ctx.lineTo(W, TABLE_Y); ctx.closePath(); ctx.fill();
    }
    // 台
    var tg = ctx.createLinearGradient(0, TABLE_Y, 0, H); tg.addColorStop(0, '#5a4131'); tg.addColorStop(0.12, '#49342a'); tg.addColorStop(1, '#2e211b');
    ctx.fillStyle = tg; ctx.fillRect(0, TABLE_Y, W, H - TABLE_Y);
    ctx.fillStyle = 'rgba(255,220,170,0.22)'; ctx.fillRect(0, TABLE_Y, W, 2);
    ctx.strokeStyle = 'rgba(0,0,0,0.13)'; ctx.lineWidth = 1;
    for (var i = 0; i < 9; i++) { var yy = TABLE_Y + 10 + i * 9 + hash(i, 3) * 4; ctx.beginPath(); ctx.moveTo(0, yy); ctx.bezierCurveTo(400, yy + hash(i, 1) * 8 - 4, 800, yy + hash(i, 2) * 8 - 4, W, yy); ctx.stroke(); }
  }

  // ---------- 配置 ----------
  function layoutFor(L) {
    var cs = Math.min(74, 500 / L.h, 720 / L.w), gw = cs * L.w;
    var gx0 = 70 + (790 - gw) / 2, gy1 = 570 + cs * 0.15 + L.root.y * 0;
    return { cs: cs, gx0: gx0, gy1: gy1, px: function (x) { return gx0 + (x + 0.5) * cs; }, py: function (y) { return gy1 - (y + 0.5) * cs; } };
  }
  function miniLay(L, cx, baseY, cs) {
    // 根の位置を (cx, baseY) に合わせた小さな配置
    return { cs: cs, px: function (x) { return cx + (x - L.root.x) * cs; }, py: function (y) { return baseY - (y - L.root.y) * cs; } };
  }

  // ---------- 木を描く ----------
  function weights(nodes) {
    var w = {};
    (function rec(id) { var n = nodes[id], s = 1, i; for (i = 0; i < n.children.length; i++) s += rec(n.children[i]); w[id] = s; return s; })(0);
    return w;
  }
  function segW(wt, cs) { return cs * Math.min(0.33, 0.05 + 0.036 * Math.sqrt(wt)); }
  function ctrl(ax, ay, bx, by, n, cs) {
    var mx = (ax + bx) / 2, my = (ay + by) / 2, dx = bx - ax, dy = by - ay, l = Math.sqrt(dx * dx + dy * dy) || 1;
    var o = (hash(n.x, n.y, 1) - 0.5) * cs * 0.22;
    return { x: mx - dy / l * o, y: my + dx / l * o };
  }
  function leafShape(x, y, rot, len, col) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.fillStyle = col;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(len * 0.5, -len * 0.34, len, 0); ctx.quadraticCurveTo(len * 0.5, len * 0.34, 0, 0); ctx.fill();
    ctx.restore();
  }
  function flowerShape(x, y, r, rot, sc) {
    if (sc <= 0) return;
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(sc, sc);
    for (var i = 0; i < 5; i++) {
      ctx.rotate(Math.PI * 2 / 5);
      ctx.fillStyle = i % 2 ? C.pink : '#f8c4d0';
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(-r * 0.75, -r * 0.5, -r * 0.55, -r * 1.25, 0, -r * 1.05); ctx.bezierCurveTo(r * 0.55, -r * 1.25, r * 0.75, -r * 0.5, 0, 0); ctx.fill();
    }
    ctx.fillStyle = C.pinkD; ctx.beginPath(); ctx.arc(0, 0, r * 0.3, 0, 7); ctx.fill();
    ctx.fillStyle = C.gold; for (i = 0; i < 5; i++) { ctx.rotate(Math.PI * 2 / 5); ctx.beginPath(); ctx.arc(0, -r * 0.3, r * 0.09, 0, 7); ctx.fill(); }
    ctx.restore();
  }
  // o: { prog(id), widths, red{}, season, potTop, mini }
  function drawTree(nodes, lay, o) {
    var cs = lay.cs, wt = weights(nodes), ids = Object.keys(nodes).map(Number).sort(function (a, b) { return a - b; });
    var rootN = nodes[0], rx = lay.px(rootN.x), ry = lay.py(rootN.y), i, n, p, pr, ax, ay, bx, by, c, w;
    var lc = LEAFCOL[o.season || 0];
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // 根もと
    var th = o.thick || 1;
    w = segW(wt[0] + 1, cs) * 1.2 * th;
    if (o.widths) { o.widths[-1] = (o.widths[-1] || w) + (w - (o.widths[-1] || w)) * 0.15; w = o.widths[-1]; }
    ctx.strokeStyle = C.bark; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(rx + cs * 0.03, o.potTop + 2); ctx.quadraticCurveTo(rx - cs * 0.05, (ry + o.potTop) / 2, rx, ry); ctx.stroke();
    for (var pass = 0; pass < 2; pass++) {
      for (i = 0; i < ids.length; i++) {
        n = nodes[ids[i]]; if (n.parent < 0) continue;
        p = nodes[n.parent]; pr = o.prog ? o.prog(n.id) : 1; if (pr <= 0) continue;
        ax = lay.px(p.x); ay = lay.py(p.y); bx = lay.px(n.x); by = lay.py(n.y);
        c = ctrl(ax, ay, bx, by, n, cs);
        if (pr < 1) { bx = ax + (bx - ax) * pr; by = ay + (by - ay) * pr; c = { x: ax + (c.x - ax) * pr, y: ay + (c.y - ay) * pr }; }
        w = segW(wt[n.id], cs) * th;
        if (o.widths) { if (pass === 0) o.widths[n.id] = (o.widths[n.id] || w * 0.6) + (w - (o.widths[n.id] || w * 0.6)) * 0.12; w = o.widths[n.id]; }
        var red = o.red && o.red[n.id];
        if (pass === 0) { ctx.strokeStyle = red ? C.red : C.bark; ctx.lineWidth = w; ctx.globalAlpha = red ? 0.75 : 1; }
        else { if (red || w < 3) continue; ctx.strokeStyle = C.barkHi; ctx.lineWidth = Math.max(0.6, w * 0.22); ctx.globalAlpha = 0.5; ax -= w * 0.2; ay -= w * 0.12; bx -= w * 0.2; by -= w * 0.12; c.x -= w * 0.2; c.y -= w * 0.12; }
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.quadraticCurveTo(c.x, c.y, bx, by); ctx.stroke(); ctx.globalAlpha = 1;
      }
    }
    // 葉と花
    for (i = 0; i < ids.length; i++) {
      n = nodes[ids[i]]; pr = o.prog ? o.prog(n.id) : 1; if (pr < 1 || n.id === 0) continue;
      bx = lay.px(n.x); by = lay.py(n.y);
      var red2 = o.red && o.red[n.id], tip = n.children.length === 0;
      var cnt = n.bloom ? 2 : tip ? 3 : (wt[n.id] < 7 ? 1 + (hash(n.x, n.y, 4) > 0.5 ? 1 : 0) : 0);
      for (var j = 0; j < cnt; j++) {
        var hr = hash(n.x, n.y, 10 + j), rot = hr * 6.28 + Math.sin(G.t * 1.4 + hr * 9 + n.x) * 0.16;
        if (o.season === 3 && j > 1) continue;
        ctx.globalAlpha = red2 ? 0.55 : 1;
        leafShape(bx + Math.cos(rot) * cs * 0.03, by + Math.sin(rot) * cs * 0.03, rot, cs * (0.2 + hr * 0.1), red2 ? C.red : lc[j % 3]);
      }
      ctx.globalAlpha = 1;
      if (n.bloom) {
        var sc = 1;
        if (o.popAt && o.popAt[n.id] !== undefined) sc = back((G.t - o.popAt[n.id]) / 0.45);
        ctx.globalAlpha = red2 ? 0.5 : 1;
        flowerShape(bx, by, cs * 0.2, hash(n.x, n.y, 7) * 2 + Math.sin(G.t * 1.1 + n.x) * 0.08, sc);
        ctx.globalAlpha = 1;
      }
    }
  }
  function drawPot(x, top, s, col, lean) {
    // s=1 のとき 幅 96 高さ 62
    var w = 96 * s, h = 62 * s;
    ctx.fillStyle = 'rgba(30,20,10,0.22)'; ctx.beginPath(); ctx.ellipse(x, top + h + 1, w * 0.56, 5 * s, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#4c5e36'; ctx.beginPath(); ctx.ellipse(x, top + 3 * s, w * 0.44, 9 * s, 0, Math.PI, 0); ctx.fill();   // 苔
    var g = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0); g.addColorStop(0, col); g.addColorStop(0.35, shade(col, 26)); g.addColorStop(1, shade(col, -34));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(x - w * 0.5, top + 2 * s); ctx.lineTo(x + w * 0.5, top + 2 * s); ctx.lineTo(x + w * 0.38, top + h - 7 * s); ctx.quadraticCurveTo(x, top + h - 2 * s, x - w * 0.38, top + h - 7 * s); ctx.closePath(); ctx.fill();
    ctx.fillStyle = shade(col, -40); ctx.fillRect(x - w * 0.34, top + h - 8 * s, w * 0.12, 8 * s); ctx.fillRect(x + w * 0.22, top + h - 8 * s, w * 0.12, 8 * s);
    ctx.fillStyle = shade(col, 34); rrect(x - w * 0.54, top - 3 * s, w * 1.08, 10 * s, 4 * s); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.16)'; ctx.fillRect(x - w * 0.36, top + 12 * s, w * 0.06, h * 0.5);
  }
  function shade(hex, d) {
    var n = parseInt(hex.slice(1), 16), r = clamp((n >> 16) + d, 0, 255), g = clamp(((n >> 8) & 255) + d, 0, 255), b = clamp((n & 255) + d, 0, 255);
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }

  // ---------- 盤の上のもの ----------
  function drawStone(x, y, cs, sx, sy) {
    ctx.save(); ctx.translate(x, y);
    var g = ctx.createLinearGradient(-cs / 2, -cs / 2, cs / 2, cs / 2); g.addColorStop(0, '#8d8a84'); g.addColorStop(1, '#55514d');
    ctx.fillStyle = g; ctx.beginPath();
    for (var i = 0; i < 9; i++) { var a = i / 9 * 6.283, r = cs * (0.43 + hash(sx, sy, i) * 0.11); if (i) ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r * 0.94); else ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r * 0.94); }
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(30,25,20,0.35)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, cs * 0.3, 3.5, 4.9); ctx.stroke();
    ctx.fillStyle = 'rgba(92,122,60,0.75)'; ctx.beginPath(); ctx.ellipse(cs * (hash(sx, sy, 20) - 0.5) * 0.3, -cs * 0.33, cs * 0.24, cs * 0.08, 0, 0, 7); ctx.fill();
    ctx.restore();
  }
  function drawSun(x, y, cs, lit, k) {
    var pul = 0.5 + 0.5 * Math.sin(G.t * 2 + k * 1.7), r = cs * (0.52 + pul * 0.05);
    var g = ctx.createRadialGradient(x, y, 2, x, y, r);
    g.addColorStop(0, lit ? 'rgba(255,214,150,0.5)' : 'rgba(250,196,70,0.85)'); g.addColorStop(0.55, lit ? 'rgba(255,214,150,0.22)' : 'rgba(250,196,70,0.4)'); g.addColorStop(1, 'rgba(250,196,70,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    if (!lit) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(G.t * 0.25 + k);
      ctx.strokeStyle = 'rgba(214,150,40,0.75)'; ctx.lineWidth = 2; ctx.lineCap = 'round';
      for (var i = 0; i < 8; i++) { ctx.rotate(Math.PI / 4); ctx.beginPath(); ctx.moveTo(0, -cs * 0.25); ctx.lineTo(0, -cs * (0.33 + pul * 0.03)); ctx.stroke(); }
      ctx.restore();
      ctx.strokeStyle = 'rgba(214,150,40,0.9)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, cs * 0.14, 0, 7); ctx.stroke();
    }
  }
  function dropShape(x, y, r, fill, stroke) {
    ctx.beginPath(); ctx.moveTo(x, y - r * 1.35); ctx.bezierCurveTo(x + r * 0.2, y - r * 0.6, x + r, y - r * 0.1, x + r, y + r * 0.35); ctx.arc(x, y + r * 0.35, r, 0, Math.PI); ctx.bezierCurveTo(x - r, y - r * 0.1, x - r * 0.2, y - r * 0.6, x, y - r * 1.35); ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1.6; ctx.stroke(); }
  }
  function drawDew(x, y, cs, got, k) {
    var bob = Math.sin(G.t * 2.2 + k) * cs * 0.03;
    if (got) {
      var ph = (G.t * 0.7 + k) % 1;
      ctx.strokeStyle = 'rgba(90,166,200,' + (0.7 * (1 - ph)) + ')'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, cs * (0.15 + ph * 0.3), 0, 7); ctx.stroke();
      return;
    }
    ctx.fillStyle = 'rgba(90,166,200,0.16)'; ctx.beginPath(); ctx.arc(x, y, cs * 0.4, 0, 7); ctx.fill();
    dropShape(x, y + bob, cs * 0.17, C.water, 'rgba(30,80,110,0.5)');
    ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.ellipse(x - cs * 0.06, y + bob + cs * 0.03, cs * 0.03, cs * 0.06, 0.5, 0, 7); ctx.fill();
  }

  // ---------- 粒 ----------
  function spawn(type, x, y, n, o) {
    o = o || {};
    for (var i = 0; i < n; i++) {
      var a = Math.random() * 6.283, sp = (o.speed || 80) * (0.4 + Math.random() * 0.8);
      G.parts.push({ type: type, x: x, y: y, vx: Math.cos(a) * sp + (o.vx || 0), vy: Math.sin(a) * sp + (o.vy || 0) - (o.up || 0), rot: Math.random() * 6, vr: (Math.random() - 0.5) * 6, life: 0, max: (o.life || 1.4) * (0.7 + Math.random() * 0.6), size: (o.size || 6) * (0.7 + Math.random() * 0.6), col: o.col });
    }
  }
  function updateParts(dt) {
    for (var i = G.parts.length - 1; i >= 0; i--) {
      var p = G.parts[i]; p.life += dt;
      if (p.life > p.max || p.y > H + 20) { G.parts.splice(i, 1); continue; }
      if (p.type === 'spark') { p.vx *= 0.94; p.vy *= 0.94; }
      else { p.vy += (p.type === 'chip' ? 700 : 60) * dt; p.vx += Math.sin(G.t * 2 + p.rot) * 20 * dt; p.vx *= 0.985; if (p.type !== 'chip') p.vy = Math.min(p.vy, 70); }
      p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
    }
  }
  function drawParts() {
    for (var i = 0; i < G.parts.length; i++) {
      var p = G.parts[i], a = clamp((p.max - p.life) / 0.5, 0, 1) * clamp(p.life / 0.15, 0, 1);
      ctx.globalAlpha = a;
      if (p.type === 'petal') { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.scale(1, 0.55 + 0.45 * Math.sin(p.rot * 2)); ctx.fillStyle = p.col || C.pink; ctx.beginPath(); ctx.ellipse(0, 0, p.size, p.size * 0.6, 0, 0, 7); ctx.fill(); ctx.restore(); }
      else if (p.type === 'leaf') leafShape(p.x, p.y, p.rot, p.size * 2, p.col || '#6f9a4a');
      else if (p.type === 'chip') { ctx.fillStyle = '#c9a877'; ctx.fillRect(p.x, p.y, p.size * 0.5, p.size * 0.5); }
      else if (p.type === 'snow') { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(p.x, p.y, p.size * 0.4, 0, 7); ctx.fill(); }
      else { ctx.fillStyle = p.col || C.gold; ctx.beginPath(); ctx.arc(p.x, p.y, p.size * 0.35, 0, 7); ctx.fill(); }
    }
    ctx.globalAlpha = 1;
  }
  var ambAcc = 0;
  function ambient(dt, season) {
    ambAcc += dt;
    var rate = [0.9, 0, 0.8, 0.35][season];
    if (season === 1) { if (ambAcc > 0.5) { ambAcc = 0; spawn('spark', Math.random() * 880, 100 + Math.random() * 480, 1, { speed: 12, life: 3, size: 5, col: 'rgba(255,240,170,0.9)' }); } return; }
    if (ambAcc > rate) {
      ambAcc = 0;
      var x = Math.random() * 1000 - 60;
      if (season === 0) spawn('petal', x, -10, 1, { speed: 10, vx: 26, vy: 40, life: 14, size: 5 });
      else if (season === 2) spawn('leaf', x, -10, 1, { speed: 10, vx: 30, vy: 45, life: 14, size: 6, col: LEAFCOL[2][(Math.random() * 3) | 0] });
      else spawn('snow', x, -10, 1, { speed: 6, vx: 8, vy: 36, life: 20, size: 6 });
    }
  }

  // ---------- 落ちる枝 ----------
  function buildFall(S, id) {
    var lay = G.lay, cs = lay.cs, ids = K.subtree(S, id), segs = [], extras = [], i, n, p, ax, ay, bx, by, c;
    var cutN = S.nodes[id], cp = S.nodes[cutN.parent], pvx = lay.px(cp.x), pvy = lay.py(cp.y);
    for (i = 0; i < ids.length; i++) {
      n = S.nodes[ids[i]]; p = S.nodes[n.parent];
      ax = lay.px(p.x); ay = lay.py(p.y); bx = lay.px(n.x); by = lay.py(n.y);
      if (n.id === id) { ax += (bx - ax) * 0.28; ay += (by - ay) * 0.28; }
      c = ctrl(lay.px(p.x), lay.py(p.y), bx, by, n, cs);
      segs.push({ ax: ax, ay: ay, cx: c.x, cy: c.y, bx: bx, by: by, w: G.wv[n.id] || 4 });
      extras.push({ x: bx, y: by, bloom: n.bloom, h: hash(n.x, n.y, 10) });
    }
    var dir = (lay.px(cutN.x) - pvx) >= 0 ? 1 : -1;
    G.falls.push({ segs: segs, extras: extras, px: pvx + (lay.px(cutN.x) - pvx) * 0.28, py: pvy + (lay.py(cutN.y) - pvy) * 0.28, ox: 0, oy: 0, vx: dir * (20 + Math.random() * 30), vy: -90, rot: 0, vr: dir * (0.5 + Math.random() * 0.9), life: 0, season: SEASON[G.li] });
    spawn('chip', G.falls[G.falls.length - 1].px, G.falls[G.falls.length - 1].py, 6, { speed: 130, up: 60, life: 0.6, size: 5 });
    spawn('leaf', lay.px(cutN.x), lay.py(cutN.y), 3 + Math.min(6, ids.length), { speed: 70, up: 30, life: 2.4, size: 5, col: LEAFCOL[SEASON[G.li]][0] });
    for (i = 0; i < extras.length; i++) if (extras[i].bloom) spawn('petal', extras[i].x, extras[i].y, 8, { speed: 80, up: 30, life: 2.5, size: 5 });
  }
  function drawFalls(dt) {
    for (var i = G.falls.length - 1; i >= 0; i--) {
      var f = G.falls[i]; f.life += dt; f.vy += 1100 * dt; f.ox += f.vx * dt; f.oy += f.vy * dt; f.rot += f.vr * dt;
      if (f.py + f.oy > TABLE_Y + 140 || f.life > 2.5) { G.falls.splice(i, 1); continue; }
      ctx.save(); ctx.globalAlpha = clamp(1.25 - f.life * 0.9, 0, 1);
      ctx.translate(f.px + f.ox, f.py + f.oy); ctx.rotate(f.rot); ctx.translate(-f.px, -f.py);
      ctx.strokeStyle = C.bark; ctx.lineCap = 'round';
      for (var j = 0; j < f.segs.length; j++) { var s = f.segs[j]; ctx.lineWidth = s.w; ctx.beginPath(); ctx.moveTo(s.ax, s.ay); ctx.quadraticCurveTo(s.cx, s.cy, s.bx, s.by); ctx.stroke(); }
      for (j = 0; j < f.extras.length; j++) { var e = f.extras[j]; leafShape(e.x, e.y, e.h * 6.28, G.lay.cs * 0.26, LEAFCOL[f.season][j % 3]); if (e.bloom) flowerShape(e.x, e.y, G.lay.cs * 0.2, e.h, 1); }
      ctx.restore();
    }
  }

  // ---------- 進行 ----------
  function startLevel(i) {
    G.scene = 'play'; G.li = i; G.L = LV[i]; G.S = K.newState(G.L); G.lay = layoutFor(G.L);
    G.undo = []; G.grow = {}; G.popAt = {}; G.wv = {}; G.hover = -1; G.lockUntil = G.t + 0.25; G.cleared = false; G.result = null;
    G.falls = []; G.parts = []; G.msg = null; G.startT = G.t;
  }
  function toTitle() { G.scene = 'title'; G.parts = []; G.falls = []; G.startT = G.t; }
  function say(s) { G.msg = { s: s, t: G.t }; }

  function doSpring() {
    if (G.scene !== 'play' || G.cleared || G.t < G.lockUntil) return;
    var before = K.clone(G.S), grown = K.spring(G.S, G.L), lay = G.lay, bi = 0;
    if (!grown.length) { G.S = before; AU.dud(); say('のびられる芽がない。どこかを切ってみよう'); return; }
    G.undo.push(before);
    grown.forEach(function (g, i) {
      var d = i * 0.11, n = G.S.nodes[g.id];
      G.grow[g.id] = { t0: G.t + d, dur: 0.42 };
      AU.grow(i);
      if (g.bloom) { G.popAt[g.id] = G.t + d + 0.4; AU.bloom(bi++, d + 0.4); G.pending.push({ at: G.t + d + 0.42, f: function () { spawn('petal', lay.px(n.x), lay.py(n.y), 14, { speed: 110, up: 40, life: 2.2, size: 6 }); spawn('spark', lay.px(n.x), lay.py(n.y), 10, { speed: 160, life: 0.7, size: 6 }); } }); }
      if (g.dew) { AU.dew(d + 0.4); G.pending.push({ at: G.t + d + 0.42, f: function () { spawn('spark', lay.px(n.x), lay.py(n.y), 12, { speed: 150, life: 0.8, size: 6, col: C.water }); G.dewPulse = G.t; } }); }
    });
    G.lockUntil = G.t + (grown.length - 1) * 0.11 + 0.46; G.yearPulse = G.t;
    if (K.solved(G.S, G.L)) { G.cleared = true; G.clearAt = G.lockUntil + 0.35; G.result = null; }
  }
  function doCut(id) {
    if (G.scene !== 'play' || G.cleared || G.t < G.lockUntil) return;
    var n = G.S.nodes[id]; if (!n || n.parent < 0) return;
    G.undo.push(K.clone(G.S));
    buildFall(G.S, id);
    var r = K.cut(G.S, id);
    AU.snip(r.removed.length > 2); G.snipT = G.t; G.hover = -1;
    if (r.forked) G.forkPulse = { id: r.parent, t: G.t };
  }
  function doUndo() {
    if (G.scene !== 'play' || !G.undo.length || G.t < G.lockUntil) return;
    G.S = G.undo.pop(); G.cleared = false; G.result = null; G.grow = {}; G.popAt = {}; AU.undo();
  }
  function doRestart() {
    if (G.scene !== 'play' || G.t < G.lockUntil) return;
    if (G.S.year === 0 && Object.keys(G.S.nodes).length === 1) return;
    G.undo.push(K.clone(G.S)); G.S = K.newState(G.L); G.cleared = false; G.result = null; G.grow = {}; G.popAt = {}; G.wv = {}; AU.undo();
  }
  function finishClear() {
    var L = G.L, years = G.S.year, mei = years <= L.par, prev = save.cleared[G.li];
    G.result = { years: years, mei: mei, best: !prev || years < prev.years, t: G.t };
    if (!prev || years < prev.years) save.cleared[G.li] = { years: years, nodes: packTree(G.S) };
    store();
    AU.clear(mei); G.stampAt = G.t + 0.9; G.stamped = false;
    for (var k in G.S.nodes) { var n = G.S.nodes[k]; if (n.bloom) spawn('petal', G.lay.px(n.x), G.lay.py(n.y), 16, { speed: 150, up: 80, life: 3, size: 6 }); }
  }
  function displayFree() {   // 自由鉢を棚にかざる
    if (Object.keys(G.S.nodes).length < 2) { say('まだ芽しかない。すこし育ててから'); AU.dud(); return; }
    save.cleared[FREE] = { years: G.S.year, nodes: packTree(G.S) }; store(); AU.clear(true); toTitle();
  }
  function next() {
    if (!G.result || G.t < G.stampAt + 0.3) return;
    AU.click();
    if (G.li === LAST) { save.ended = true; store(); G.scene = 'ending'; G.startT = G.t; G.parts = []; }
    else startLevel(G.li + 1);
  }
  G.pending = [];

  // ---------- 遊びの画面 ----------
  function pickSegment() {
    var S = G.S, lay = G.lay, best = -1, bd = lay.cs * 0.3, k, n, p;
    for (k in S.nodes) {
      n = S.nodes[k]; if (n.parent < 0) continue; p = S.nodes[n.parent];
      var ax = lay.px(p.x), ay = lay.py(p.y), bx = lay.px(n.x), by = lay.py(n.y), dx = bx - ax, dy = by - ay;
      var u = clamp(((G.mx - ax) * dx + (G.my - ay) * dy) / (dx * dx + dy * dy), 0, 1), d = Math.hypot(G.mx - ax - dx * u, G.my - ay - dy * u);
      if (d < bd) { bd = d; best = n.id; }
    }
    return best;
  }
  function drawBuds(S, plan, lay, ghostNew) {
    var cs = lay.cs, i, b, x, y, dx, dy, l, tx, ty;
    for (i = 0; i < plan.length; i++) {
      b = plan[i];
      if (G.grow[b.node] && G.t < G.grow[b.node].t0 + G.grow[b.node].dur) continue;
      x = lay.px(b.x); y = lay.py(b.y); dx = K.DX[b.dir]; dy = -K.DY[b.dir]; l = Math.hypot(dx, dy); dx /= l; dy /= l;
      tx = lay.px(b.tx); ty = lay.py(b.ty);
      var isNew = ghostNew && ghostNew[b.node];
      if (b.status === 'grow') {
        var ph = (G.t * 0.9) % 1;
        ctx.strokeStyle = isNew ? 'rgba(200,69,47,0.85)' : 'rgba(96,140,50,0.8)'; ctx.lineWidth = 2.5; ctx.setLineDash([3, 7]); ctx.lineDashOffset = -ph * 10; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x + dx * cs * 0.24, y + dy * cs * 0.24); ctx.lineTo(tx - dx * cs * 0.12, ty - dy * cs * 0.12); ctx.stroke(); ctx.setLineDash([]);
        ctx.beginPath(); ctx.arc(tx, ty, cs * 0.075, 0, 7); ctx.stroke();
      } else if (b.status === 'block') {
        var mx = x + dx * cs * 0.42 * l, my = y + dy * cs * 0.42 * l;
        ctx.strokeStyle = 'rgba(90,70,55,0.85)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(mx - dy * cs * 0.1, my + dx * cs * 0.1); ctx.lineTo(mx + dy * cs * 0.1, my - dx * cs * 0.1); ctx.stroke();
      }
      // 芽
      var pul = b.status === 'grow' ? 1 + 0.12 * Math.sin(G.t * 5 + i) : 0.82, r = cs * 0.1 * pul, bx = x + dx * cs * 0.17, by = y + dy * cs * 0.17;
      if (G.forkPulse && G.forkPulse.id === b.node) r *= back((G.t - G.forkPulse.t) / 0.3);
      ctx.save(); ctx.translate(bx, by); ctx.rotate(Math.atan2(dy, dx));
      ctx.fillStyle = b.status === 'grow' ? C.bud : '#9a917c'; ctx.strokeStyle = b.status === 'grow' ? '#55782c' : '#6a6252'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(-r, 0); ctx.quadraticCurveTo(0, -r * 1.25, r * 1.9, 0); ctx.quadraticCurveTo(0, r * 1.25, -r, 0); ctx.fill(); ctx.stroke();
      ctx.restore();
      if (b.status === 'grow') dropShape(bx - dy * cs * 0.17 + dx * 2, by + dx * cs * 0.17, cs * 0.055, C.water, 'rgba(30,80,110,0.6)');
      else if (b.status === 'sleep') text('z', bx - dy * cs * 0.16 + 3, by + dx * cs * 0.16 - 4, Math.max(13, cs * 0.2), 'rgba(80,70,60,0.75)', 'center', true);
    }
  }

  function drawPlay(dt) {
    var L = G.L, S = G.S, lay = G.lay, cs = lay.cs, season = SEASON[G.li], k, n, i;
    drawBackground(season);
    ambient(dt, season);
    // 予告用の状態（枝の上にカーソルがあるあいだは、切ったあとの姿を見せる）
    var inField = G.mx < 880 && G.my < TABLE_Y + 10;
    G.hover = (!G.cleared && G.t >= G.lockUntil && inField) ? pickSegment() : -1;
    var T = S, red = null, ghostNew = null;
    if (G.hover >= 0) {
      T = K.clone(S); red = {}; K.subtree(S, G.hover).forEach(function (id) { red[id] = 1; });
      var r = K.cut(T, G.hover); if (r.forked) { ghostNew = {}; ghostNew[r.parent] = 1; }
    }
    var plan = K.plan(T, L), vig = K.vigor(T, L), used = 0;
    for (i = 0; i < plan.length; i++) if (plan[i].status === 'grow') used++;

    // 盤のわく（ここから外へは伸びられない）
    ctx.strokeStyle = 'rgba(60,45,30,0.2)'; ctx.lineWidth = 1.5; rrect(lay.px(0) - cs * 0.5, lay.py(L.h - 1) - cs * 0.5, cs * L.w, cs * L.h, 10); ctx.stroke();
    ctx.fillStyle = 'rgba(255,252,240,0.16)'; ctx.fill();
    // ます目の点
    var occ = {}; for (k in S.nodes) occ[S.nodes[k].x + ',' + S.nodes[k].y] = S.nodes[k];
    for (var y = 0; y < L.h; y++) for (var x = 0; x < L.w; x++) {
      if (L.stones[x + ',' + y]) continue;
      ctx.fillStyle = 'rgba(60,45,30,0.28)'; ctx.beginPath(); ctx.arc(lay.px(x), lay.py(y), 2.4, 0, 7); ctx.fill();
    }
    // 崖（石の下を台までつなぐ）
    for (x = 0; x < L.w; x++) if (L.stones[x + ',0']) { ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, TABLE_Y + 5); ctx.clip(); drawStone(lay.px(x) + 3, lay.py(-1) + cs * 0.08, cs * 1.12, x, -1); ctx.restore(); }
    for (k in L.stones) { var sp = k.split(','); drawStone(lay.px(+sp[0]), lay.py(+sp[1]), cs, +sp[0], +sp[1]); }
    for (i = 0; i < L.suns.length; i++) { n = occ[L.suns[i].x + ',' + L.suns[i].y]; drawSun(lay.px(L.suns[i].x), lay.py(L.suns[i].y), cs, n && n.bloom && progOf(n.id) >= 1, i); }
    for (i = 0; i < L.dews.length; i++) { n = occ[L.dews[i].x + ',' + L.dews[i].y]; drawDew(lay.px(L.dews[i].x), lay.py(L.dews[i].y), cs, n && progOf(n.id) >= 1, i); }

    var potTop = lay.py(L.root.y) + cs * 0.35;
    drawTree(S.nodes, lay, { prog: progOf, widths: G.wv, red: red, season: season, potTop: potTop, popAt: G.popAt });
    drawPot(lay.px(L.root.x), potTop, 1, POTS[G.li % POTS.length]);
    if (!G.cleared) drawBuds(T, plan, lay, ghostNew);
    // 切る場所のしるし
    if (G.hover >= 0) {
      n = S.nodes[G.hover]; var p = S.nodes[n.parent], ax = lay.px(p.x), ay = lay.py(p.y), bx = lay.px(n.x), by = lay.py(n.y);
      var cx = ax + (bx - ax) * 0.28, cy = ay + (by - ay) * 0.28, nx = -(by - ay), ny = bx - ax, nl = Math.hypot(nx, ny);
      ctx.strokeStyle = C.red; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx - nx / nl * 13, cy - ny / nl * 13); ctx.lineTo(cx + nx / nl * 13, cy + ny / nl * 13); ctx.stroke();
    }
    drawFalls(dt);
    drawParts();

    // 一時の言葉
    if (G.msg && G.t - G.msg.t < 2.6) {
      var a = clamp((2.6 - (G.t - G.msg.t)) / 0.5, 0, 1) * clamp((G.t - G.msg.t) / 0.15, 0, 1);
      ctx.globalAlpha = a; font(22); var tw = ctx.measureText(G.msg.s).width + 44;
      ctx.fillStyle = 'rgba(43,36,32,0.88)'; rrect(465 - tw / 2, 20, tw, 44, 8); ctx.fill();
      text(G.msg.s, 465, 43, 22, C.cream, 'center'); ctx.globalAlpha = 1;
    }
    // 手引き
    if (L.hint) text(L.hint, 465, 678, 21, 'rgba(243,234,214,0.92)', 'center');

    drawPanel(vig, used);
    // 印
    if (G.result && G.t >= G.stampAt) {
      if (!G.stamped) { G.stamped = true; AU.stamp(); }
      var sp2 = clamp((G.t - G.stampAt) / 0.14, 0, 1), sc = 1.7 - 0.7 * sp2;
      ctx.save(); ctx.translate(126, 102); ctx.rotate(-0.07); ctx.scale(sc, sc); ctx.globalAlpha = sp2 * (G.result.mei ? 0.92 : 0.8);
      ctx.fillStyle = G.result.mei ? C.red : '#b0705c'; rrect(-46, -46, 92, 92, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(255,240,225,0.9)'; ctx.lineWidth = 2.5; rrect(-38, -38, 76, 76, 4); ctx.stroke();
      var st = G.result.mei ? '名木' : '完成';
      text(st[0], 0, -17, 34, '#fff3e6', 'center', true); text(st[1], 0, 19, 34, '#fff3e6', 'center', true);
      ctx.restore(); ctx.globalAlpha = 1;
    }
    // 鋏
    if (inField) drawScissors(G.mx, G.my);
  }
  function progOf(id) { var g = G.grow[id]; return g ? ease((G.t - g.t0) / g.dur) : 1; }

  function drawScissors(x, y) {
    var s = clamp((G.t - G.snipT) / 0.28, 0, 1), open = s < 0.25 ? 0.42 * (1 - s / 0.25) : 0.42 * ((s - 0.25) / 0.75);
    if (G.hover >= 0) open = Math.min(open, 0.42) * 1 + 0.06 * Math.sin(G.t * 9);
    ctx.save(); ctx.translate(x + 15, y + 19); ctx.rotate(-2.2);
    for (var k = -1; k <= 1; k += 2) {
      ctx.save(); ctx.rotate(k * open);
      ctx.fillStyle = '#3a3532'; ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(-4, 0); ctx.lineTo(30, -k * 1); ctx.lineTo(4, k * 5.5); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = C.red; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(-17, -k * 7, 11, 7, k * 0.5, 0, 7); ctx.stroke();
      ctx.restore();
    }
    ctx.fillStyle = '#d8c9a8'; ctx.beginPath(); ctx.arc(0, 0, 2.5, 0, 7); ctx.fill();
    ctx.restore();
  }

  // ---------- 右の札 ----------
  function button(id, x, y, w, h, label, sub, style, fn, disabled) {
    var hov = !disabled && G.mx >= x && G.mx <= x + w && G.my >= y && G.my <= y + h;
    G.btns.push({ x: x, y: y, w: w, h: h, fn: fn, disabled: disabled });
    ctx.save(); if (disabled) ctx.globalAlpha = 0.35;
    if (style === 'main') {
      ctx.fillStyle = 'rgba(60,20,10,0.25)'; rrect(x + 2, y + 4, w, h, 10); ctx.fill();
      ctx.fillStyle = hov ? '#d9553c' : C.red; rrect(x, y - (hov ? 1 : 0), w, h, 10); ctx.fill();
      ctx.strokeStyle = 'rgba(255,235,215,0.7)'; ctx.lineWidth = 1.5; rrect(x + 5, y + 5 - (hov ? 1 : 0), w - 10, h - 10, 6); ctx.stroke();
      text(label, x + w / 2, y + h / 2 - (sub ? 8 : 0), h > 60 ? 30 : 24, '#fff5ea', 'center', true);
      if (sub) text(sub, x + w / 2, y + h - 17, 14, 'rgba(255,240,225,0.85)', 'center');
    } else {
      ctx.fillStyle = hov ? 'rgba(43,36,32,0.14)' : 'rgba(43,36,32,0.06)'; rrect(x, y, w, h, 8); ctx.fill();
      ctx.strokeStyle = 'rgba(43,36,32,0.55)'; ctx.lineWidth = 1.5; rrect(x, y, w, h, 8); ctx.stroke();
      var lt = style === 'light';
      if (lt) { ctx.strokeStyle = 'rgba(243,234,214,0.6)'; rrect(x, y, w, h, 8); ctx.stroke(); if (hov) { ctx.fillStyle = 'rgba(243,234,214,0.12)'; ctx.fill(); } }
      text(label, x + (sub ? 14 : w / 2), y + h / 2 + 1, lt ? 17 : 20, lt ? C.cream : C.ink, sub ? 'left' : 'center', true);
      if (sub) text(sub, x + w - 12, y + h / 2 + 1, 14, lt ? 'rgba(243,234,214,0.7)' : 'rgba(43,36,32,0.6)', 'right');
    }
    ctx.restore();
    return hov;
  }
  function drawPanel(vig, used) {
    var L = G.L, S = G.S, x0 = 920, i;
    ctx.fillStyle = 'rgba(255,250,235,0.5)'; rrect(x0 - 18, 24, 362, 600, 12); ctx.fill();
    ctx.strokeStyle = 'rgba(43,36,32,0.22)'; ctx.lineWidth = 1; rrect(x0 - 18, 24, 362, 600, 12); ctx.stroke();
    // 鉢の名（縦書き）
    vtext(L.name, 1264 - 40, 70, 38, C.ink, true);
    vtext(L.free ? '自由' : KANJI[G.li] + 'の鉢', 1264 - 86, 62, 21, 'rgba(43,36,32,0.7)');
    // 年
    var yp = clamp((G.t - (G.yearPulse || -9)) / 0.3, 0, 1), ys = 1 + 0.25 * (1 - yp);
    text('春', x0, 66, 19, 'rgba(43,36,32,0.65)');
    ctx.save(); ctx.translate(x0 + 44, 100); ctx.scale(ys, ys); text(String(S.year), 0, 0, 66, C.ink, 'center', true); ctx.restore();
    text('回め', x0 + 86, 112, 22, C.ink);
    if (!L.free) {
      var over = S.year > L.par;
      text('名木のめやす', x0, 152, 16, 'rgba(43,36,32,0.6)');
      text(L.par + '回まで', x0 + 104, 152, 18, over ? 'rgba(43,36,32,0.4)' : C.redD, 'left', true);
    }
    // 水
    text('水', x0, 208, 19, 'rgba(43,36,32,0.65)');
    var dp = clamp((G.t - (G.dewPulse || -9)) / 0.4, 0, 1);
    for (i = 0; i < vig; i++) {
      var r = 13 * (i === vig - 1 ? 1 + 0.5 * (1 - dp) : 1);
      dropShape(x0 + 50 + i * 38, 208, r, i < used ? C.water : null, i < used ? 'rgba(30,80,110,0.7)' : 'rgba(30,80,110,0.45)');
    }
    text(used < vig ? '（' + (vig - used) + 'つ あまり）' : '', x0 + 50 + vig * 38, 210, 15, 'rgba(43,36,32,0.55)');
    // 花
    if (!L.free) {
      text('花', x0, 270, 19, 'rgba(43,36,32,0.65)');
      var bl = K.bloomed(S, L);
      for (i = 0; i < L.suns.length; i++) {
        if (i < bl) flowerShape(x0 + 52 + i * 38, 270, 13, 0.3, 1);
        else { ctx.strokeStyle = 'rgba(214,150,40,0.9)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x0 + 52 + i * 38, 270, 9, 0, 7); ctx.stroke(); }
      }
    }
    // 凡例（芽の見かた）
    var ly = 330;
    ctx.strokeStyle = 'rgba(43,36,32,0.15)'; ctx.beginPath(); ctx.moveTo(x0, ly - 22); ctx.lineTo(x0 + 250, ly - 22); ctx.stroke();
    legendBud(x0 + 10, ly, 'grow'); text('のびる芽', x0 + 30, ly + 1, 15, 'rgba(43,36,32,0.7)');
    legendBud(x0 + 110, ly, 'sleep'); text('眠る芽', x0 + 130, ly + 1, 15, 'rgba(43,36,32,0.7)');
    ctx.strokeStyle = 'rgba(90,70,55,0.85)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x0 + 200, ly - 7); ctx.lineTo(x0 + 200, ly + 7); ctx.stroke();
    text('つかえ', x0 + 210, ly + 1, 15, 'rgba(43,36,32,0.7)');

    if (G.result && G.t >= G.stampAt) {
      var R = G.result;
      text(R.years + '回の春で咲いた', x0, 380, 22, C.ink, 'left', true);
      text(R.mei ? '見事な枝ぶり。名木の印。' : '名木のめやすは ' + L.par + '回。', x0, 410, 16, R.mei ? C.redD : 'rgba(43,36,32,0.65)');
      button('next', x0, 432, 300, 76, G.li === LAST ? 'むすびへ' : 'つぎの鉢へ', 'Space', 'main', next);
      button('undo', x0, 522, 144, 50, 'もどす', 'Z', '', doUndo);
      button('again', x0 + 156, 522, 144, 50, 'もういちど', 'R', '', doRestart);
    } else {
      if (L.free) button('disp', x0, 366, 300, 52, '棚にかざる', '', '', displayFree);
      button('spring', x0, 432, 300, 76, '春を呼ぶ', 'Space', 'main', doSpring, G.cleared);
      button('undo', x0, 522, 144, 50, 'もどす', 'Z', '', doUndo, !G.undo.length);
      button('again', x0 + 156, 522, 144, 50, 'やりなおし', 'R', '', doRestart, G.cleared);
    }
    button('shelf', x0, 584, 144, 44 - 14, '棚へ', 'Esc', '', function () { AU.click(); toTitle(); });
    button('mute', x0 + 156, 584, 144, 44 - 14, AU.isMuted() ? '音 なし' : '音 あり', 'M', '', toggleMute);
  }
  function legendBud(x, y, st) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = st === 'grow' ? C.bud : '#9a917c'; ctx.strokeStyle = st === 'grow' ? '#55782c' : '#6a6252'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-6, 0); ctx.quadraticCurveTo(0, -8, 11, 0); ctx.quadraticCurveTo(0, 8, -6, 0); ctx.fill(); ctx.stroke(); ctx.restore();
  }
  function toggleMute() { save.muted = AU.toggleMute(); store(); AU.click(); }

  // ---------- 表紙と棚 ----------
  function makeHero() {
    var L = K.parseLevel({ vigor: 9, map: ['.........', '.........', '.........', '.........', '.........', '.........', '....R....'] });
    var S = K.newState(L), at = function (x, y) { for (var k in S.nodes) if (S.nodes[k].x === x && S.nodes[k].y === y) return S.nodes[k].id; return -1; };
    var sp = function (n) { while (n--) K.spring(S, L); };
    sp(3); K.cut(S, at(4, 3)); sp(2); K.cut(S, at(2, 4)); K.cut(S, at(6, 4)); sp(2);
    K.cut(S, at(1, 3)); K.cut(S, at(7, 3)); sp(1); K.cut(S, at(3, 5)); K.cut(S, at(5, 5)); sp(1);
    for (var k in S.nodes) if (!S.nodes[k].children.length) { S.nodes[k].bloom = true; S.nodes[k].buds = []; }
    G.hero = S.nodes; G.heroL = L;
  }
  function drawShelf(y, activeHover) {
    // 12の鉢がならぶ棚
    ctx.fillStyle = 'rgba(30,20,10,0.2)'; ctx.fillRect(60, y + 14, 880, 8);
    var g = ctx.createLinearGradient(0, y, 0, y + 14); g.addColorStop(0, '#6a4d39'); g.addColorStop(1, '#3f2d23');
    ctx.fillStyle = g; rrect(52, y, 896, 14, 3); ctx.fill();
    G.slotHover = -1;
    for (var i = 0; i < LV.length; i++) {
      var cx = 100 + i * 73.5, c = save.cleared[i], un = unlocked(i), L = LV[i];
      var hov = activeHover && slotAt(y) === i;
      if (hov) { G.slotHover = i; ctx.fillStyle = 'rgba(200,69,47,0.10)'; rrect(cx - 35, y - 150, 70, 150, 8); ctx.fill(); }
      var ps = 0.42, potTop = y - 62 * ps - 1;
      ctx.globalAlpha = un ? 1 : 0.28;
      if (c) {
        var cs = L.free ? 7 : 9, lay = miniLay(L, cx, potTop - cs * 0.6, cs);
        // かたむいた鉢は左に寄せて置く
        if (L.dir === 2) lay = miniLay(L, cx - 20, potTop - cs * 0.6 - 30, cs);
        drawTree(unpackTree(c.nodes), lay, { season: SEASON[i], potTop: (L.dir === 2 ? potTop - 30 : potTop), thick: 1.9 });
        if (L.dir === 2) { ctx.fillStyle = '#6d6862'; rrect(cx - 34, potTop - 30 + 62 * ps, 28, 30, 3); ctx.fill(); drawPot(cx - 20, potTop - 30, ps, POTS[i % POTS.length]); }
        else drawPot(cx, potTop, ps, POTS[i % POTS.length]);
      } else {
        drawPot(cx, potTop, ps, un ? POTS[i % POTS.length] : '#8a8072');
        if (un) { ctx.strokeStyle = C.bark; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx, potTop); ctx.lineTo(cx, potTop - 9); ctx.stroke(); leafShape(cx, potTop - 9, -0.6 + Math.sin(G.t * 2 + i) * 0.1, 9, C.bud); leafShape(cx, potTop - 9, -2.5 - Math.sin(G.t * 2 + i) * 0.1, 9, C.bud); }
      }
      ctx.globalAlpha = un ? 1 : 0.35;
      text(KANJI[i], cx, y + 32, 17, 'rgba(243,234,214,0.9)', 'center');
      if (c && !L.free && c.years <= L.par) { ctx.fillStyle = C.red; rrect(cx + 14, y + 23, 16, 16, 2); ctx.fill(); text('名', cx + 22, y + 31.5, 11, '#fff', 'center', true); }
      ctx.globalAlpha = 1;
    }
  }
  function drawStand(x, top, w, floor) {   // 花台
    ctx.fillStyle = '#3f2d23'; ctx.fillRect(x - w * 0.4, top + 8, 9, floor - top - 8); ctx.fillRect(x + w * 0.4 - 9, top + 8, 9, floor - top - 8);
    ctx.fillRect(x - w * 0.4, top + 44, w * 0.8, 6);
    var g = ctx.createLinearGradient(0, top, 0, top + 12); g.addColorStop(0, '#6a4d39'); g.addColorStop(1, '#3f2d23');
    ctx.fillStyle = g; rrect(x - w / 2, top, w, 12, 3); ctx.fill();
    ctx.fillStyle = 'rgba(255,220,170,0.25)'; ctx.fillRect(x - w / 2 + 2, top, w - 4, 1.5);
  }
  function slotAt(y) {
    if (G.my <= y - 150 || G.my >= y + 44) return -1;
    for (var i = 0; i < LV.length; i++) if (unlocked(i) && Math.abs(G.mx - (100 + i * 73.5)) < 34) return i;
    return -1;
  }
  function clearedCount() { var c = 0; for (var i = 0; i <= LAST; i++) if (save.cleared[i]) c++; return c; }
  function firstOpen() { for (var i = 0; i <= LAST; i++) if (!save.cleared[i]) return i; return LAST; }

  function drawTitle(dt) {
    drawBackground(0); ambient(dt, 0);
    // 見本の木
    if (!G.hero) makeHero();
    var lay = miniLay(G.heroL, 470, 352, 50);
    drawStand(470, 434, 210, TABLE_Y - 14);
    drawTree(G.hero, lay, { season: 0, potTop: 352 + 17 });
    drawPot(470, 369, 1.05, POTS[0]);
    drawParts();
    // 題字
    vtext('切りもどし', 1150, 96, 82, C.ink, true);
    vtext('鋏と春の小さな鉢', 1066, 104, 24, 'rgba(43,36,32,0.75)');
    ctx.save(); ctx.translate(1066, 356); ctx.rotate(0.04); ctx.fillStyle = C.red; rrect(-21, -21, 42, 42, 4); ctx.fill(); text('盆', 0, 1, 26, '#fff3e6', 'center', true); ctx.restore();
    // 棚（台の上）
    drawShelf(TABLE_Y - 14, true);
    var n = clearedCount();
    if (G.slotHover >= 0) {
      var i = G.slotHover, L = LV[i], c = save.cleared[i];
      var s = (L.free ? '自由鉢' : KANJI[i] + 'の鉢　' + L.name) + (c && !L.free ? '　― ' + c.years + '回の春' + (c.years <= L.par ? '・名木' : '') : c ? '　― かざり中' : '');
      text(s, 500, 694, 20, 'rgba(243,234,214,0.95)', 'center');
    } else text('枝をクリックで切る　／　Space 春を呼ぶ　／　Z もどす', 500, 694, 18, 'rgba(243,234,214,0.75)', 'center');
    button('start', 980, 520, 250, 78, n === 0 ? 'はじめる' : n > LAST ? '自由鉢をひらく' : 'つづきから', n > LAST ? '棚の鉢をえらぶと育てなおせる' : (KANJI[firstOpen()] + 'の鉢'), 'main', function () { AU.click(); startLevel(n > LAST ? FREE : firstOpen()); });
    button('mute', 1086, 678, 144, 30, AU.isMuted() ? '音 なし' : '音 あり', 'M', 'light', toggleMute);
  }

  function drawEnding(dt) {
    drawBackground(0); ambient(dt, 0); ambient(dt, 0);
    var c = save.cleared[LAST], L = LV[LAST], e = G.t - G.startT;
    if (c) { drawStand(470, 478, 220, TABLE_Y - 14); var lay = miniLay(L, 470, 390, 56); drawTree(unpackTree(c.nodes), lay, { season: 0, potTop: 410 }); drawPot(470, 410, 1.1, POTS[LAST % POTS.length]); }
    drawParts();
    ctx.globalAlpha = clamp(e / 1.2, 0, 1); vtext('十一の鉢が、棚にならんだ。', 1170, 80, 34, C.ink, true);
    ctx.globalAlpha = clamp((e - 1.6) / 1.2, 0, 1); vtext('鋏を置いて、つぎの春を待つ。', 1100, 80, 34, C.ink, true);
    ctx.globalAlpha = clamp((e - 3.4) / 1.2, 0, 1); vtext('おしまい', 1010, 80, 26, C.redD, true);
    ctx.globalAlpha = 1;
    drawShelf(TABLE_Y - 14, false);
    if (e > 4.2) {
      text('棚に「自由鉢」がふえた。ひだまりのない鉢で、好きな形に育てられる。', 500, 694, 18, 'rgba(243,234,214,0.9)', 'center');
      button('back', 980, 540, 250, 64, '棚へもどる', '', 'main', function () { AU.click(); toTitle(); });
    }
  }

  // ---------- 入力 ----------
  function pos(e) { var r = cv.getBoundingClientRect(); G.mx = (e.clientX - r.left) / r.width * W; G.my = (e.clientY - r.top) / r.height * H; }
  cv.addEventListener('mousemove', pos);
  cv.addEventListener('mouseleave', function () { G.mx = -99; G.my = -99; });
  cv.addEventListener('mousedown', function (e) {
    pos(e); AU.init(); if (e.button !== 0) return;
    for (var i = G.btns.length - 1; i >= 0; i--) { var b = G.btns[i]; if (!b.disabled && G.mx >= b.x && G.mx <= b.x + b.w && G.my >= b.y && G.my <= b.y + b.h) { b.fn(); return; } }
    if (G.scene === 'play') { var id = (G.mx < 880 && !G.cleared && G.t >= G.lockUntil) ? pickSegment() : -1; if (id >= 0) doCut(id); else if (G.mx < 880 && G.my < TABLE_Y) G.snipT = G.t; }
    else if (G.scene === 'title' && slotAt(TABLE_Y - 14) >= 0) { AU.click(); startLevel(slotAt(TABLE_Y - 14)); }
  });
  cv.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  window.addEventListener('keydown', function (e) {
    if (e.repeat) return;
    var k = e.key; AU.init();
    if (k === ' ' || k === 'Enter') {
      e.preventDefault();
      if (G.scene === 'title') { AU.click(); startLevel(clearedCount() > LAST ? FREE : firstOpen()); }
      else if (G.scene === 'play') { if (G.result) next(); else doSpring(); }
      else if (G.scene === 'ending' && G.t - G.startT > 4.2) toTitle();
    } else if (k === 'z' || k === 'Z') doUndo();
    else if (k === 'r' || k === 'R') doRestart();
    else if (k === 'm' || k === 'M') toggleMute();
    else if (k === 'Escape') { if (G.scene !== 'title') toTitle(); }
  });

  // ---------- まわす ----------
  function resize() {
    var s = Math.min(window.innerWidth / W, window.innerHeight / H), dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.style.width = Math.floor(W * s) + 'px'; cv.style.height = Math.floor(H * s) + 'px';
    cv.width = Math.round(W * s * dpr); cv.height = Math.round(H * s * dpr); G.scale = cv.width / W;
  }
  window.addEventListener('resize', resize); resize();
  AU.setMuted(!!save.muted);

  var last = 0;
  function frame(ts) {
    var dt = Math.min(0.05, (ts - last) / 1000 || 0.016); last = ts;
    step(dt);
    requestAnimationFrame(frame);
  }
  function step(dt) {
    G.t += dt;
    for (var i = G.pending.length - 1; i >= 0; i--) if (G.t >= G.pending[i].at) { var f = G.pending[i].f; G.pending.splice(i, 1); if (G.scene === 'play') f(); }
    if (G.scene === 'play' && G.cleared && !G.result && G.t >= G.clearAt) finishClear();
    updateParts(dt); AU.ambient(dt);
    ctx.setTransform(G.scale, 0, 0, G.scale, 0, 0);
    G.btns = [];
    if (G.scene === 'title') drawTitle(dt); else if (G.scene === 'play') drawPlay(dt); else drawEnding(dt);
    var onBtn = false;
    for (i = 0; i < G.btns.length; i++) { var b = G.btns[i]; if (!b.disabled && G.mx >= b.x && G.mx <= b.x + b.w && G.my >= b.y && G.my <= b.y + b.h) onBtn = true; }
    cv.style.cursor = onBtn || (G.scene === 'title' && G.slotHover >= 0) ? 'pointer' : (G.scene === 'play' && G.mx < 880 && G.my < TABLE_Y + 10 && G.mx > 0) ? 'none' : 'default';
  }
  requestAnimationFrame(frame);

  // 検証用の口（遊びには使わない）
  window.__kiri = {
    G: G, K: K, LV: LV, save: function () { return save; },
    goto: function (i) { startLevel(i); }, spring: doSpring, undo: doUndo, restart: doRestart, next: next,
    at: function (x, y) { for (var k in G.S.nodes) if (G.S.nodes[k].x === x && G.S.nodes[k].y === y) return G.S.nodes[k].id; return -1; },
    cut: function (x, y) { doCut(this.at(x, y)); },
    adv: function (sec) { var n = Math.ceil(sec / 0.05); while (n--) step(0.05); },
    cellPx: function (x, y) { return [G.lay.px(x), G.lay.py(y)]; },
    reset: function () { save = { cleared: {}, ended: false, muted: save.muted }; store(); }
  };
})();
