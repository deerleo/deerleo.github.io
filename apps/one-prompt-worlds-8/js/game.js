/*
 * ひつじが いっぴき — 画面・操作・進行
 */
(function () {
  'use strict';
  var C = Sim.C, cv = document.getElementById('c'), ctx = cv.getContext('2d');
  var FONT = "'Zen Maru Gothic','Hiragino Maru Gothic ProN','BIZ UDPGothic','Yu Gothic UI','Meiryo',sans-serif";
  var TAU = Math.PI * 2;

  var TIMES = {
    morning: { g1: '#bfe096', g2: '#a8d283', tuft: '#8dbd6c', frame: '#5d8c56', over: 'rgba(255,240,190,0.10)', label: 'あさ' },
    noon: { g1: '#a9da80', g2: '#92cc6c', tuft: '#78b658', frame: '#4b8a4e', over: null, label: 'ひる' },
    evening: { g1: '#dcd884', g2: '#c6cb70', tuft: '#a3ad58', frame: '#8a6f3c', over: 'rgba(255,130,40,0.10)', label: 'ゆうがた' },
    dusk: { g1: '#c9b98a', g2: '#b0a478', tuft: '#938a62', frame: '#5c4d63', over: 'rgba(180,70,130,0.17)', label: 'ひぐれ' },
    night: { g1: '#7fb08a', g2: '#6ea07b', tuft: '#5b8c69', frame: '#1f2c47', over: null, dark: 0.58, label: 'よる' }
  };

  // ---------- 保存 ----------
  var SAVE_KEY = 'hitsuji_ga_ippiki_v1';
  var save = { best: [], stars: [], seenEnding: false };
  try { var raw = localStorage.getItem(SAVE_KEY); if (raw) { var o = JSON.parse(raw); if (o && o.best) save = o; } } catch (e) { }
  function store() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { } }
  function cleared() { var n = 0; for (var i = 0; i < LEVELS.length; i++) if (save.stars[i]) n++; return n; }
  function unlocked() { var n = 0; while (n < LEVELS.length && save.stars[n]) n++; return Math.min(LEVELS.length - 1, n); }
  function totalStars() { var n = 0; for (var i = 0; i < LEVELS.length; i++) n += save.stars[i] || 0; return n; }

  // ---------- 状態 ----------
  var scene = 'title', S = null, LV = 0, bg = null, pieces = [], parts = [], T = 0;
  var mouse = { x: 640, y: 520, down: false, moved: false }, keys = {}, buttons = [];
  var clearT = -1, clearStars = 0, newBest = false, hintT = 0, countPop = 0, fade = 1, fadeDir = -1, fadeFn = null;
  var endT = 0, endCount = 0, dustT = 0, light = null, hold = false, hover = -1, hintY = 96, panicN = 0, tipT = 0;
  var TITLE_LEVEL = {
    name: '', time: 'morning', dog: [640, 560],
    sheep: [[420, 430], [470, 400], [520, 450], [455, 470], [800, 420], [850, 455], [790, 470], [880, 410]],
    grass: [{ x: 1090, y: 560, r: 58 }], ponds: [{ x: 190, y: 560, rx: 90, ry: 52 }], pens: []
  };

  function hiki(n) { var d = n % 10; return n + ((d === 0 || d === 1 || d === 6 || d === 8) ? 'ぴき' : d === 3 ? 'びき' : 'ひき'); }
  function fmt(t) { var s = Math.floor(t); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }

  // ---------- 描画の小道具 ----------
  function rr(c, x, y, w, h, r) {
    c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }
  function ell(c, x, y, rx, ry) { c.beginPath(); c.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, TAU); }
  function txt(s, x, y, size, color, align, weight, c) {
    c = c || ctx; c.font = (weight || 700) + ' ' + size + 'px ' + FONT; c.textAlign = align || 'left'; c.textBaseline = 'middle';
    c.fillStyle = color; c.fillText(s, x, y);
  }
  function txtO(s, x, y, size, color, out, align, lw) {
    ctx.font = '800 ' + size + 'px ' + FONT; ctx.textAlign = align || 'center'; ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round'; ctx.lineWidth = lw || 5; ctx.strokeStyle = out; ctx.strokeText(s, x, y);
    ctx.fillStyle = color; ctx.fillText(s, x, y);
  }
  function starPath(c, x, y, r) {
    c.beginPath();
    for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r * 0.46 : r; c.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q); }
    c.closePath();
  }

  // ---------- 背景 ----------
  function buildBackground(level, s) {
    var b = document.createElement('canvas'); b.width = C.W; b.height = C.H;
    var c = b.getContext('2d'), tm = TIMES[level.time], rnd = Sim.mulberry(level.name.length * 977 + level.dog[0]);
    c.fillStyle = tm.frame; c.fillRect(0, 0, C.W, C.H);
    var fx = C.BX0 - 8, fy = C.BY0 - 8, fw = C.BX1 - C.BX0 + 16, fh = C.BY1 - C.BY0 + 16;
    c.save(); rr(c, fx, fy, fw, fh, 22); c.clip();
    var gr = c.createLinearGradient(0, fy, 0, fy + fh); gr.addColorStop(0, tm.g1); gr.addColorStop(1, tm.g2);
    c.fillStyle = gr; c.fillRect(fx, fy, fw, fh);
    var i, x, y, r;
    for (i = 0; i < 46; i++) {     // 色むら
      x = fx + rnd() * fw; y = fy + rnd() * fh; r = 40 + rnd() * 90;
      c.fillStyle = rnd() < 0.5 ? 'rgba(255,255,220,0.045)' : 'rgba(30,90,40,0.035)';
      ell(c, x, y, r * 1.5, r * 0.7); c.fill();
    }
    // クローバー
    (level.grass || []).forEach(function (g) {
      c.fillStyle = 'rgba(40,120,60,0.20)'; ell(c, g.x, g.y + 3, g.r + 4, g.r + 4); c.fill();
      c.fillStyle = '#5fae5c'; ell(c, g.x, g.y, g.r, g.r); c.fill();
      c.fillStyle = '#6fbd66'; ell(c, g.x - g.r * 0.1, g.y - g.r * 0.1, g.r * 0.8, g.r * 0.8); c.fill();
      for (var k = 0; k < g.r * 1.6; k++) {
        var a = rnd() * TAU, q = Math.sqrt(rnd()) * (g.r - 7), cx = g.x + Math.cos(a) * q, cy = g.y + Math.sin(a) * q;
        if (rnd() < 0.22) {
          c.fillStyle = '#fffdf4'; ell(c, cx, cy, 3, 3); c.fill(); c.fillStyle = '#f3e7c8'; ell(c, cx, cy + 1, 1.5, 1.2); c.fill();
        } else {
          c.fillStyle = rnd() < 0.5 ? '#3f9450' : '#4ea257';
          for (var m = 0; m < 3; m++) { var aa = m * TAU / 3 + a; ell(c, cx + Math.cos(aa) * 2.6, cy + Math.sin(aa) * 2.6, 2.4, 2.4); c.fill(); }
        }
      }
    });
    // 草むらと花
    for (i = 0; i < 300; i++) {
      x = fx + 14 + rnd() * (fw - 28); y = fy + 14 + rnd() * (fh - 28);
      if (Sim.inPond(s, x, y, 8) || Sim.grassAt(s, x, y, 4)) continue;
      var kind = rnd();
      if (kind < 0.8) {
        c.strokeStyle = tm.tuft; c.lineWidth = 1.6; c.lineCap = 'round'; c.beginPath();
        c.moveTo(x - 3, y); c.lineTo(x - 4.5, y - 5); c.moveTo(x, y); c.lineTo(x, y - 7); c.moveTo(x + 3, y); c.lineTo(x + 4.5, y - 5); c.stroke();
      } else {
        var col = ['#fff6d8', '#ffe07a', '#ffc6d9', '#fff'][Math.floor(rnd() * 4)];
        c.fillStyle = col; for (var p = 0; p < 5; p++) { ell(c, x + Math.cos(p * TAU / 5) * 2.4, y + Math.sin(p * TAU / 5) * 2.4, 1.7, 1.7); c.fill(); }
        c.fillStyle = '#f0a83a'; ell(c, x, y, 1.3, 1.3); c.fill();
      }
    }
    // 池
    (level.ponds || []).forEach(function (p) {
      c.fillStyle = 'rgba(70,110,70,0.35)'; ell(c, p.x, p.y + 2, p.rx + 9, p.ry + 9); c.fill();
      c.fillStyle = '#d9cf9c'; ell(c, p.x, p.y, p.rx + 5, p.ry + 5); c.fill();
      var pg = c.createRadialGradient(p.x, p.y - p.ry * 0.3, 10, p.x, p.y, p.rx);
      pg.addColorStop(0, '#9fdcea'); pg.addColorStop(1, '#5fb2d2');
      c.fillStyle = pg; ell(c, p.x, p.y, p.rx, p.ry); c.fill();
      c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 2; ell(c, p.x, p.y, p.rx - 5, p.ry - 5); c.stroke();
      for (var k = 0; k < 5; k++) {
        var a = rnd() * TAU, lx = p.x + Math.cos(a) * p.rx * 0.6, ly = p.y + Math.sin(a) * p.ry * 0.6;
        c.fillStyle = '#58a868'; c.beginPath(); c.moveTo(lx, ly); c.arc(lx, ly, 8, 0.4, TAU - 0.2); c.closePath(); c.fill();
      }
    });
    // 小屋の床
    s.pens.forEach(function (p) {
      c.fillStyle = 'rgba(90,70,30,0.15)'; rr(c, p.x - 3, p.y - 1, p.w + 6, p.h + 7, 8); c.fill();
      c.fillStyle = '#ecd898'; rr(c, p.x, p.y, p.w, p.h, 6); c.fill();
      c.strokeStyle = 'rgba(190,150,70,0.5)'; c.lineWidth = 1.5;
      for (var k = 0; k < p.w * p.h / 260; k++) {
        var hx = p.x + 8 + rnd() * (p.w - 16), hy = p.y + 8 + rnd() * (p.h - 16), ha = rnd() * Math.PI;
        c.beginPath(); c.moveTo(hx, hy); c.lineTo(hx + Math.cos(ha) * 8, hy + Math.sin(ha) * 4); c.stroke();
      }
      // 門へのふみあと
      var g = p.gate, ox = p.gateSide === 'L' ? -1 : p.gateSide === 'R' ? 1 : 0, oy = p.gateSide === 'T' ? -1 : p.gateSide === 'B' ? 1 : 0;
      c.fillStyle = 'rgba(236,216,152,0.75)';
      for (var q = 0; q < 4; q++) { ell(c, g.x + ox * (10 + q * 15), g.y + oy * (10 + q * 15), 30 - q * 6 + Math.abs(oy) * 6, 30 - q * 6 + Math.abs(ox) * 6); c.fill(); }
    });
    c.restore();
    // 生け垣
    var per = [];
    for (x = fx; x <= fx + fw; x += 19) { per.push([x, fy]); per.push([x, fy + fh]); }
    for (y = fy; y <= fy + fh; y += 19) { per.push([fx, y]); per.push([fx + fw, y]); }
    per.sort(function (a, b) { return a[1] - b[1]; });
    var hed = level.time === 'night' ? ['#2c5a48', '#2a5244', '#346650'] : ['#3f7d49', '#4a8a50', '#377243'];
    per.forEach(function (q) {
      var rad = 10 + rnd() * 5;
      c.fillStyle = 'rgba(0,0,0,0.16)'; ell(c, q[0], q[1] + 5, rad, rad * 0.7); c.fill();
      c.fillStyle = hed[Math.floor(rnd() * 3)]; ell(c, q[0], q[1], rad, rad); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.10)'; ell(c, q[0] - 3, q[1] - 4, rad * 0.45, rad * 0.4); c.fill();
    });
    return b;
  }

  function buildPieces(s) {
    pieces = [];
    s.walls.forEach(function (w) {
      var len = Math.hypot(w[2] - w[0], w[3] - w[1]), n = Math.max(1, Math.round(len / 27));
      for (var i = 0; i < n; i++) {
        var a = i / n, b = (i + 1) / n;
        pieces.push({
          x0: w[0] + (w[2] - w[0]) * a, y0: w[1] + (w[3] - w[1]) * a, x1: w[0] + (w[2] - w[0]) * b, y1: w[1] + (w[3] - w[1]) * b,
          last: i === n - 1, y: Math.max(w[1] + (w[3] - w[1]) * a, w[1] + (w[3] - w[1]) * b), type: 'fence'
        });
      }
    });
    s.pens.forEach(function (p, i) { pieces.push({ type: 'sign', pen: i, y: p.y + 1 }); });
  }
  function drawPost(x, y) {
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ell(ctx, x + 2, y + 2, 5, 2.5); ctx.fill();
    ctx.fillStyle = '#8f6238'; ctx.fillRect(x - 3, y - 19, 6, 20);
    ctx.fillStyle = '#b98652'; ctx.fillRect(x - 3, y - 19, 2.5, 20);
    ctx.fillStyle = '#d2a56d'; ctx.fillRect(x - 3.5, y - 21, 7, 3);
  }
  function drawFence(p) {
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(0,0,0,0.13)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(p.x0 + 2, p.y0 + 2); ctx.lineTo(p.x1 + 2, p.y1 + 2); ctx.stroke();
    var steep = Math.abs(p.y1 - p.y0) > Math.abs(p.x1 - p.x0);
    for (var k = 0; k < 2; k++) {
      var oy = -7 - k * 8;
      ctx.strokeStyle = '#a87644'; ctx.lineWidth = steep ? 6 : 4; ctx.beginPath(); ctx.moveTo(p.x0, p.y0 + oy); ctx.lineTo(p.x1, p.y1 + oy); ctx.stroke();
      ctx.strokeStyle = '#d0a26a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(p.x0, p.y0 + oy - 1); ctx.lineTo(p.x1, p.y1 + oy - 1); ctx.stroke();
    }
    drawPost(p.x0, p.y0); if (p.last) drawPost(p.x1, p.y1);
  }
  function iconSheep(x, y, s) {
    ctx.fillStyle = '#fbf6ea'; ell(ctx, x, y, 7 * s, 6 * s); ctx.fill(); ell(ctx, x - 5 * s, y - 2 * s, 4 * s, 4 * s); ctx.fill(); ell(ctx, x + 5 * s, y - 2 * s, 4 * s, 4 * s); ctx.fill(); ell(ctx, x, y - 5 * s, 4.5 * s, 4 * s); ctx.fill();
    ctx.fillStyle = '#4b3f3a'; ell(ctx, x, y + 1.5 * s, 3.6 * s, 4 * s); ctx.fill();
  }
  function iconGoat(x, y, s) {
    ctx.strokeStyle = '#6b5a48'; ctx.lineWidth = 2 * s; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - 2.5 * s, y - 4 * s); ctx.quadraticCurveTo(x - 6 * s, y - 9 * s, x - 8 * s, y - 5 * s); ctx.moveTo(x + 2.5 * s, y - 4 * s); ctx.quadraticCurveTo(x + 6 * s, y - 9 * s, x + 8 * s, y - 5 * s); ctx.stroke();
    ctx.fillStyle = '#d9b47e'; ell(ctx, x, y, 5 * s, 5.6 * s); ctx.fill();
    ctx.fillStyle = '#f0dcb8'; ell(ctx, x, y + 2.5 * s, 3 * s, 3 * s); ctx.fill();
    ctx.fillStyle = '#6b5a48'; ctx.beginPath(); ctx.moveTo(x - 1.5 * s, y + 5 * s); ctx.lineTo(x + 1.5 * s, y + 5 * s); ctx.lineTo(x, y + 9 * s); ctx.fill();
  }
  function drawSign(pc) {
    var p = S.pens[pc.pen], x = p.x + p.w / 2, y = p.y - 10, w = p.accept === 'any' && hasGoats() ? 92 : 74;
    ctx.fillStyle = '#8f6238'; ctx.fillRect(x - w / 2 + 6, y - 6, 4, 16); ctx.fillRect(x + w / 2 - 10, y - 6, 4, 16);
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; rr(ctx, x - w / 2 + 1, y - 17, w, 28, 5); ctx.fill();
    ctx.fillStyle = p.count >= p.need ? '#fff3c4' : '#f4e3bd'; rr(ctx, x - w / 2, y - 19, w, 28, 5); ctx.fill();
    ctx.strokeStyle = '#a87644'; ctx.lineWidth = 2; ctx.stroke();
    var ix = x - w / 2 + 14;
    if (p.accept !== 'goat') { iconSheep(ix, y - 5, 0.85); ix += 18; }
    if (p.accept === 'goat' || (p.accept === 'any' && hasGoats())) { iconGoat(ix, y - 5, 0.85); ix += 18; }
    txt(p.count + '/' + p.need, x + w / 2 - 8, y - 4, 15, '#6a4a25', 'right', 800);
  }
  function hasGoats() { return S.level.goats && S.level.goats.length > 0; }

  // ---------- どうぶつ ----------
  function drawSheep(a, lit) {
    var x = a.x, y = a.y, moving = a.speed > 9 ? 1 : 0, lie = a.lie || 0;
    var hop = a.hop > 0 ? Math.sin((1 - a.hop / 0.25) * Math.PI) * 7 : 0;
    var bob = moving ? Math.abs(Math.sin(a.phase)) * 1.6 : 0;
    var by = y - 7 - bob - hop + lie * 3 + (a.z || 0);
    ctx.fillStyle = 'rgba(0,0,0,0.17)'; ell(ctx, x, y + 5, 12 - hop * 0.3, 4.5); ctx.fill();
    if (lie < 0.5) {
      ctx.strokeStyle = '#4b3f3a'; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
      for (var i = 0; i < 4; i++) {
        var lx = x + (i < 2 ? -5.5 : 4.5) + (i % 2) * 2, sw = moving ? Math.sin(a.phase + i * 1.9) * 3 : 0;
        ctx.beginPath(); ctx.moveTo(lx, by + 5); ctx.lineTo(lx + sw, y + 5 - hop + (a.z || 0)); ctx.stroke();
      }
    }
    var hx = a.hx, hy = a.hy, drop = a.graze ? 5 + Math.sin(T * 9 + a.id) * 1.2 : lie * 3;
    var headX = x + hx * 11, headY = by + hy * 6 - 1 + drop;
    function head() {
      ctx.fillStyle = '#4b3f3a';
      ell(ctx, headX, headY, 5.2, 4.8); ctx.fill();
      ell(ctx, headX - 5 - hx, headY - 2.5, 3, 1.8); ctx.fill(); ell(ctx, headX + 5 - hx, headY - 2.5, 3, 1.8); ctx.fill();
      ctx.fillStyle = '#fbf6ea'; ell(ctx, headX - hx * 1.5, headY - 4, 3.6, 2.8); ctx.fill();
      if (hy > -0.45) {
        if (lie > 0.6) {
          ctx.strokeStyle = '#fbf6ea'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(headX - 3 + hx * 2, headY); ctx.lineTo(headX - 1 + hx * 2, headY); ctx.moveTo(headX + 1 + hx * 2, headY); ctx.lineTo(headX + 3 + hx * 2, headY); ctx.stroke();
        } else {
          ctx.fillStyle = '#fff'; var er = a.panic > 0 ? 1.7 : 1.1;
          ell(ctx, headX - 2 + hx * 2.2, headY - 0.5, er, er); ctx.fill(); ell(ctx, headX + 2 + hx * 2.2, headY - 0.5, er, er); ctx.fill();
        }
      }
    }
    if (hy < -0.2) head();
    var sy = 1 - lie * 0.14;
    var blobs = [[0, 0, 9.5], [-7, 1.5, 6.8], [7, 1.5, 6.8], [-3.5, -5, 6.4], [4, -5, 6.4], [0, 4, 6.8]];
    ctx.fillStyle = '#dcd3c0';
    for (var k = 0; k < blobs.length; k++) { ell(ctx, x + blobs[k][0], by + blobs[k][1] * sy + 1.8, blobs[k][2], blobs[k][2] * sy); ctx.fill(); }
    ctx.fillStyle = lit === false ? '#e9e4da' : '#fbf6ea';
    for (k = 0; k < blobs.length; k++) { ell(ctx, x + blobs[k][0], by + blobs[k][1] * sy, blobs[k][2], blobs[k][2] * sy); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,255,255,0.9)'; ell(ctx, x - 3, by - 5 * sy, 4, 2.6); ctx.fill();
    if (hy >= -0.2) head();
  }
  function drawGoat(a) {
    var x = a.x, y = a.y, moving = a.speed > 9 ? 1 : 0, lie = a.lie || 0;
    var hop = a.hop > 0 ? Math.sin((1 - a.hop / 0.25) * Math.PI) * 8 : 0;
    var bob = moving ? Math.abs(Math.sin(a.phase)) * 1.6 : 0;
    var by = y - 9 - bob - hop + lie * 5;
    ctx.fillStyle = 'rgba(0,0,0,0.17)'; ell(ctx, x, y + 5, 12, 4.5); ctx.fill();
    if (lie < 0.5) {
      ctx.strokeStyle = '#6b5a48'; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
      for (var i = 0; i < 4; i++) {
        var lx = x + (i < 2 ? -6.5 : 5) + (i % 2) * 2, sw = moving ? Math.sin(a.phase + i * 1.9) * 3.5 : 0;
        ctx.beginPath(); ctx.moveTo(lx, by + 4); ctx.lineTo(lx + sw, y + 5 - hop); ctx.stroke();
      }
    }
    var hx = a.hx, hy = a.hy, drop = a.graze ? 6 + Math.sin(T * 9 + a.id) * 1.2 : lie * 2;
    var headX = x + hx * 12.5, headY = by + hy * 6 - 4 + drop;
    function head() {
      ctx.strokeStyle = '#5d4d3d'; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(headX - 2, headY - 3); ctx.quadraticCurveTo(headX - 4 - hx * 5, headY - 10, headX - 6 - hx * 6, headY - 6);
      ctx.moveTo(headX + 2, headY - 3); ctx.quadraticCurveTo(headX + 4 - hx * 5, headY - 10, headX + 6 - hx * 6, headY - 6); ctx.stroke();
      ctx.fillStyle = '#e6c998'; ell(ctx, headX, headY, 4.6, 4.8); ctx.fill();
      ctx.fillStyle = '#f5e6c8'; ell(ctx, headX + hx * 2, headY + 2, 2.8, 2.6); ctx.fill();
      ctx.fillStyle = '#6b5a48'; ctx.beginPath(); ctx.moveTo(headX + hx * 2 - 1.5, headY + 4); ctx.lineTo(headX + hx * 2 + 1.5, headY + 4); ctx.lineTo(headX + hx * 2, headY + 8); ctx.fill();
      if (hy > -0.45) {
        ctx.fillStyle = '#3a2f28';
        if (lie > 0.6) { ctx.fillRect(headX - 3 + hx * 2, headY - 1.2, 2, 1); ctx.fillRect(headX + 1 + hx * 2, headY - 1.2, 2, 1); }
        else { ell(ctx, headX - 2 + hx * 2, headY - 1, 1.1, 1.1); ctx.fill(); ell(ctx, headX + 2 + hx * 2, headY - 1, 1.1, 1.1); ctx.fill(); }
      }
    }
    if (hy < -0.2) head();
    ctx.fillStyle = '#b8935d'; ell(ctx, x, by + 1.6, 11.5, 7.6 - lie); ctx.fill();
    ctx.fillStyle = '#d9b47e'; ell(ctx, x, by, 11.5, 7.4 - lie); ctx.fill();
    ctx.fillStyle = '#ecd2a4'; ell(ctx, x - 2, by - 3, 6, 2.6); ctx.fill();
    ctx.fillStyle = '#8a6b45'; ell(ctx, x - hx * 6, by - 1, 4, 3.4); ctx.fill();
    ctx.strokeStyle = '#d9b47e'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x - hx * 11, by - 2); ctx.lineTo(x - hx * 14, by - 7); ctx.stroke();
    if (hy >= -0.2) head();
  }
  function drawDog(d, sleeping) {
    var x = d.x, y = d.y, sp = d.speed, moving = sp > 14, dash = d.gait === 2;
    var ph = T * (dash ? 26 : 15), hx = d.hx, hy = d.hy;
    if (d.swim) {
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1.6;
      var rp = (T * 1.6) % 1; ell(ctx, x, y + 2, 9 + rp * 12, 4 + rp * 5); ctx.globalAlpha = 1 - rp; ctx.stroke(); ctx.globalAlpha = 1;
      ell(ctx, x, y + 2, 10, 4.5); ctx.stroke();
      dogHead(x + hx * 3, y - 3 + Math.sin(T * 8) * 1, hx, hy, false);
      return;
    }
    var bob = moving ? Math.abs(Math.sin(ph)) * (dash ? 2.6 : 1.4) : 0, by = y - 8 - bob + (sleeping ? 5 : 0);
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ell(ctx, x, y + 5, 13, 4.5); ctx.fill();
    if (!sleeping) {
      ctx.strokeStyle = '#26252a'; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
      for (var i = 0; i < 4; i++) {
        var lx = x + (i < 2 ? -6.5 : 5.5) + (i % 2) * 2.2, sw = moving ? Math.sin(ph + i * 1.7) * (dash ? 6 : 3.4) : 0;
        ctx.beginPath(); ctx.moveTo(lx, by + 4); ctx.lineTo(lx + sw, y + 5); ctx.stroke();
        ctx.strokeStyle = '#f7f3ea'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(lx + sw * 0.8, y + 3.5); ctx.lineTo(lx + sw, y + 5); ctx.stroke();
        ctx.strokeStyle = '#26252a'; ctx.lineWidth = 2.6;
      }
    }
    // しっぽ
    var wag = Math.sin(T * (moving ? 16 : 6)) * (moving ? 3 : 5), tx0 = x - hx * 10, ty0 = by - 1, tx1 = x - hx * 18 + wag * Math.abs(hy), ty1 = by - 7 + wag * Math.abs(hx) * 0.6 - (dash ? -4 : 0);
    function tail() {
      ctx.strokeStyle = '#26252a'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(tx0, ty0); ctx.lineTo(tx1, ty1); ctx.stroke();
      ctx.strokeStyle = '#f7f3ea'; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(tx0 + (tx1 - tx0) * 0.7, ty0 + (ty1 - ty0) * 0.7); ctx.lineTo(tx1, ty1); ctx.stroke();
    }
    var headX = x + hx * 11.5, headY = by + hy * 6 - 5 + (sleeping ? 6 : 0);
    if (hy < -0.2) dogHead(headX, headY, hx, hy, sleeping); else tail();
    var rxb = dash ? 13 : 11.5;
    ctx.fillStyle = '#131317'; ell(ctx, x, by + 1.5, rxb, 7.2); ctx.fill();
    ctx.fillStyle = '#2b2a31'; ell(ctx, x, by, rxb, 7); ctx.fill();
    ctx.fillStyle = '#f7f3ea'; ell(ctx, x + hx * 6.5, by + 1 + hy * 2, 5.2, 5.6); ctx.fill();
    ctx.fillStyle = '#e25544'; ell(ctx, x + hx * 8, by - 1.5 + hy * 3, 3.6, 4.4); ctx.fill();
    if (hy < -0.2) tail(); else dogHead(headX, headY, hx, hy, sleeping);
  }
  function dogHead(x, y, hx, hy, sleeping) {
    ctx.fillStyle = '#2b2a31';
    ctx.beginPath(); ctx.moveTo(x - 5.5, y - 2); ctx.lineTo(x - 6.5 - hx, y - 8.5); ctx.lineTo(x - 1.5, y - 4.5); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x + 5.5, y - 2); ctx.lineTo(x + 6.5 - hx, y - 8.5); ctx.lineTo(x + 1.5, y - 4.5); ctx.fill();
    ell(ctx, x, y, 6, 5.6); ctx.fill();
    if (hy > -0.5) {
      ctx.fillStyle = '#f7f3ea'; ell(ctx, x + hx * 2.6, y + 1.6, 3.4, 3.5); ctx.fill();
      ctx.fillRect(x + hx * 1.2 - 0.9, y - 4.5, 1.8, 5);
      ctx.fillStyle = '#1a1a1e'; ell(ctx, x + hx * 4.6, y + 1.2, 1.5, 1.2); ctx.fill();
      if (sleeping) { ctx.fillRect(x - 3.4 + hx * 1.5, y - 1.2, 2.2, 1); ctx.fillRect(x + 1.2 + hx * 1.5, y - 1.2, 2.2, 1); }
      else { ctx.fillStyle = '#fff'; ell(ctx, x - 2.4 + hx * 1.8, y - 1.3, 1.25, 1.25); ctx.fill(); ell(ctx, x + 2.4 + hx * 1.8, y - 1.3, 1.25, 1.25); ctx.fill(); }
    }
  }

  var BIG = 1.28;
  function big(o, fn, arg) { ctx.save(); ctx.translate(o.x, o.y + 4); ctx.scale(BIG, BIG); ctx.translate(-o.x, -o.y - 4); fn(o, arg); ctx.restore(); }

  // ---------- つぶ ----------
  function spawn(p) { p.max = p.life; parts.push(p); }
  function updateParts(dt) {
    for (var i = parts.length - 1; i >= 0; i--) {
      var p = parts[i]; p.life -= dt;
      if (p.life <= 0) { parts.splice(i, 1); continue; }
      p.x += (p.vx || 0) * dt; p.y += (p.vy || 0) * dt;
      if (p.g) p.vy += p.g * dt;
    }
  }
  function drawParts(layer) {
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i]; if ((p.layer || 1) !== layer) continue;
      var k = p.life / p.max;
      ctx.globalAlpha = Math.min(1, k * 2);
      if (p.type === 'dust') { ctx.fillStyle = p.color || 'rgba(255,250,225,0.8)'; ell(ctx, p.x, p.y, p.size * (1.6 - k), p.size * (1.6 - k) * 0.7); ctx.fill(); }
      else if (p.type === 'text') { txtO(p.text, p.x, p.y, p.size, p.color || '#fff', p.out || 'rgba(60,45,25,0.85)', 'center', 4); }
      else if (p.type === 'star') { ctx.fillStyle = p.color || '#ffe27a'; starPath(ctx, p.x, p.y, p.size * (0.5 + k * 0.5)); ctx.fill(); }
      else if (p.type === 'ring') { ctx.strokeStyle = p.color || '#fff'; ctx.lineWidth = 3 * k; ell(ctx, p.x, p.y, p.size * (1 - k) + 6, (p.size * (1 - k) + 6) * (p.flat || 1)); ctx.stroke(); }
      else if (p.type === 'leaf') { ctx.fillStyle = '#4ea257'; ell(ctx, p.x, p.y, 2.4, 1.6); ctx.fill(); }
      ctx.globalAlpha = 1;
    }
  }

  // ---------- 進行 ----------
  function startLevel(i, seed) {
    LV = i; scene = 'play';
    S = Sim.create(LEVELS[i], seed != null ? seed : 1000 + i * 77 + Math.floor(Math.random() * 1000));
    bg = buildBackground(LEVELS[i], S); buildPieces(S);
    parts = []; clearT = -1; hintT = 0; countPop = 0; panicN = 0; tipT = 0;
    // ヒント札は どうぶつや小屋に重ならない段へ
    var cand = [96, 596, 340], bestY = 96, bestN = 1e9;
    cand.forEach(function (y) {
      var n = 0;
      S.animals.forEach(function (a) { if (a.x > 270 && a.x < 1010 && a.y > y - 30 && a.y < y + 110) n++; });
      S.pens.forEach(function (p) { if (p.x < 990 && p.x + p.w > 290 && p.y < y + 78 && p.y + p.h > y) n += 5; });
      if (Math.abs(S.dog.y - (y + 39)) < 70 && S.dog.x > 270 && S.dog.x < 1010) n += 2;
      if (n < bestN) { bestN = n; bestY = y; }
    });
    hintY = bestY;
    Snd.setMode(LEVELS[i].time);
  }
  function startTitle() {
    scene = 'title'; S = Sim.create(TITLE_LEVEL, 7); bg = buildBackground(TITLE_LEVEL, S); buildPieces(S); parts = [];
    Snd.setMode('title');
  }
  function go(fn) { if (fadeFn) return; fadeFn = fn; fadeDir = 1; }
  function toSelect() { go(function () { scene = 'select'; S = null; Snd.setMode('noon'); }); }
  function toEnding() { go(function () { scene = 'ending'; S = null; endT = 0; endCount = 0; parts = []; Snd.setMode('ending'); save.seenEnding = true; store(); }); }

  function handleEvents() {
    var ev = S.events;
    for (var i = 0; i < ev.length; i++) {
      var e = ev[i];
      if (e.type === 'settle') {
        Snd.settle(e.n); countPop = 1;
        var kindN = 0; S.animals.forEach(function (a) { if (a.settled && a.kind === e.kind) kindN++; });
        for (var q = parts.length - 1; q >= 0; q--) if (parts[q].tag === 'count' + e.pen) parts.splice(q, 1);
        spawn({ type: 'text', text: (e.kind === 'goat' ? 'やぎが ' : 'ひつじが ') + hiki(kindN), x: S.pens[e.pen].x + S.pens[e.pen].w / 2, y: S.pens[e.pen].y + S.pens[e.pen].h / 2 - 10, tag: 'count' + e.pen, vy: -26, life: 1.5, size: 24, color: '#fffbe8' });
        spawn({ type: 'ring', x: e.x, y: e.y, size: 30, life: 0.5, color: '#fff6c8', flat: 0.6, layer: 0 });
        for (var k = 0; k < 4; k++) spawn({ type: 'star', x: e.x, y: e.y - 12, vx: (Math.random() - 0.5) * 90, vy: -40 - Math.random() * 60, g: 160, life: 0.7, size: 5 });
      } else if (e.type === 'panic') {
        Snd.baa(e.kind);
        // はじめの3牧場で 走りすぎて群れが散りつづけたら、ひとこと そえる
        if (e.kind === 'sheep' && scene === 'play' && LV < 3 && ++panicN === 12) tipT = 7;
        spawn({ type: 'text', text: '！', x: e.x + 6, y: e.y - 28, vy: -30, life: 0.5, size: 18, color: '#ff8a5c', out: 'rgba(255,255,255,0.9)' });
      } else if (e.type === 'dash') {
        Snd.bark();
        spawn({ type: 'ring', x: S.dog.x, y: S.dog.y, size: 60, life: 0.35, color: 'rgba(255,220,150,0.9)', flat: 0.6, layer: 0 });
      } else if (e.type === 'graze') {
        Snd.graze();
      } else if (e.type === 'clear') {
        if (scene === 'play') {
          clearT = 0; var par = S.level.par;
          clearStars = e.time <= par[0] ? 3 : e.time <= par[1] ? 2 : 1;
          newBest = !save.best[LV] || e.time < save.best[LV];
          if (newBest) save.best[LV] = e.time;
          save.stars[LV] = Math.max(save.stars[LV] || 0, clearStars); store();
          Snd.clear();
        }
      }
    }
    ev.length = 0;
  }

  function simTick(dt) {
    var inp = { tx: Math.max(C.BX0, Math.min(C.BX1, mouse.x)), ty: Math.max(C.BY0, Math.min(C.BY1, mouse.y)), dash: mouse.down || keys.Shift || keys[' '] };
    if (!mouse.moved) { inp.tx = S.dog.x; inp.ty = S.dog.y; inp.dash = false; }
    if (clearT >= 0) { inp.dash = false; }
    var wasSwim = S.dog.swim;
    Sim.step(S, inp, dt);
    if (S.dog.swim !== wasSwim) { Snd.splash(); spawn({ type: 'ring', x: S.dog.x, y: S.dog.y, size: 26, life: 0.5, color: 'rgba(255,255,255,0.9)', flat: 0.5, layer: 0 }); }
    handleEvents();
    var d = S.dog;
    dustT -= dt;
    if (d.gait === 2 && dustT <= 0 && !d.swim) { dustT = 0.045; spawn({ type: 'dust', x: d.x - d.hx * 10 + (Math.random() - 0.5) * 6, y: d.y + 4, vx: -d.vx * 0.1, vy: -8, life: 0.45, size: 5, layer: 0 }); }
    for (var i = 0; i < S.animals.length; i++) {
      var a = S.animals[i];
      if (a.panic > 0 && Math.random() < 0.25) spawn({ type: 'dust', x: a.x, y: a.y + 5, vy: -6, life: 0.35, size: 3.5, layer: 0 });
      if (a.graze && Math.random() < 0.02) spawn({ type: 'leaf', x: a.x + a.hx * 11, y: a.y + 2, vx: (Math.random() - 0.5) * 30, vy: -30, g: 120, life: 0.5 });
      if (a.settled && a.lie >= 1 && Math.random() < 0.004) spawn({ type: 'text', text: 'z', x: a.x + 8, y: a.y - 18, vx: 5, vy: -14, life: 1.4, size: 13, color: '#fffbe8', out: 'rgba(60,60,110,0.6)' });
      // がんこな相手に歩いて近づいたときの「…」
      if (!a.settled && a.panic <= 0 && (a.kind === 'goat' || a.graze) && d.gait === 1 && Math.hypot(a.x - d.x, a.y - d.y) < 80) {
        a.huffT = (a.huffT || 0) - dt;
        if (a.huffT <= 0) { a.huffT = 1.3; spawn({ type: 'text', text: a.kind === 'goat' ? 'フン' : 'もぐ', x: a.x, y: a.y - 30, vy: -14, life: 0.9, size: 14, color: '#fffbe8' }); }
      }
    }
    // 絵のちがう小屋の門で はね返されたら、看板のところで知らせる
    for (var pi = 0; pi < S.pens.length; pi++) {
      var pn = S.pens[pi]; if (pn.accept === 'any') continue;
      pn.noT = (pn.noT || 0) - dt;
      if (pn.noT > 0) continue;
      for (i = 0; i < S.animals.length; i++) {
        a = S.animals[i];
        if (!a.settled && a.kind !== pn.accept && (a.resp || a.panic > 0) && Math.hypot(a.x - pn.gate.x, a.y - pn.gate.y) < 44) {
          pn.noT = 2.2;
          spawn({ type: 'text', text: (a.kind === 'goat' ? 'やぎは' : 'ひつじは') + ' 入れない', x: pn.gate.x, y: pn.gate.y - 34, vy: -12, life: 1.6, size: 16, color: '#fff3d6', out: 'rgba(120,50,30,0.9)' });
          break;
        }
      }
    }
    if (scene === 'play') {
      hintT += dt;
      if (tipT > 0) tipT -= dt;
      if (clearT >= 0) clearT += dt;
    }
    if (countPop > 0) countPop = Math.max(0, countPop - dt * 2.5);
  }

  // ---------- 画面：牧場 ----------
  function drawWorld() {
    var tm = TIMES[S.level.time], d = S.dog, i;
    ctx.drawImage(bg, 0, 0);
    // 池のさざなみ
    S.ponds.forEach(function (p, k) {
      for (var j = 0; j < 3; j++) {
        var ph = (T * 0.25 + j / 3 + k * 0.3) % 1;
        ctx.strokeStyle = 'rgba(255,255,255,' + (0.35 * (1 - ph)) + ')'; ctx.lineWidth = 1.5;
        ell(ctx, p.x + Math.sin(j * 2.1 + k) * p.rx * 0.3, p.y + Math.cos(j * 1.7) * p.ry * 0.25, 10 + ph * 46, 4 + ph * 17); ctx.stroke();
      }
    });
    // 門がしまる
    if (S.done) S.pens.forEach(function (p) {
      var g = p.gate, k = Math.min(1, (clearT < 0 ? 1 : clearT) * 2.5);
      ctx.strokeStyle = '#a87644'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      for (var q = 0; q < 2; q++) { ctx.beginPath(); ctx.moveTo(g.ax, g.ay - 7 - q * 8); ctx.lineTo(g.ax + (g.bx - g.ax) * k, g.ay + (g.by - g.ay) * k - 7 - q * 8); ctx.stroke(); }
    });
    // コロの気配（おどろかす範囲）
    if (clearT < 0) {
      var dash = d.gait === 2;
      ctx.save();
      ctx.setLineDash(dash ? [10, 7] : [3, 9]); ctx.lineDashOffset = -T * (dash ? 60 : 12);
      ctx.strokeStyle = dash ? 'rgba(255,170,90,0.75)' : 'rgba(255,255,255,' + (d.gait === 1 ? 0.5 : 0.28) + ')'; ctx.lineWidth = dash ? 3 : 2;
      ell(ctx, d.x, d.y + 2, d.R, d.R * 0.94); ctx.stroke();
      if (dash) { ctx.fillStyle = 'rgba(255,170,90,0.07)'; ctx.fill(); }
      ctx.restore();
      // めざす場所
      if (mouse.moved) {
        ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 2;
        var cr = 7 + Math.sin(T * 5) * 1.2 + (mouse.down ? 3 : 0);
        ell(ctx, mouse.x, mouse.y, cr, cr * 0.8); ctx.stroke();
        ctx.fillStyle = mouse.down ? '#ffb46a' : '#fff'; ell(ctx, mouse.x, mouse.y, 2.2, 2); ctx.fill();
      }
    }
    drawParts(0);
    // 奥から手前へ
    var list = pieces.slice();
    for (i = 0; i < S.animals.length; i++) list.push({ type: 'animal', a: S.animals[i], y: S.animals[i].y });
    list.push({ type: 'dog', y: d.y });
    list.sort(function (p, q) { return p.y - q.y; });
    for (i = 0; i < list.length; i++) {
      var it = list[i];
      if (it.type === 'fence') drawFence(it);
      else if (it.type === 'sign') drawSign(it);
      else if (it.type === 'dog') big(d, drawDog);
      else if (it.a.kind === 'goat') big(it.a, drawGoat); else big(it.a, drawSheep);
    }
    drawParts(1);
    if (tm.over) { ctx.fillStyle = tm.over; ctx.fillRect(0, 0, C.W, C.H); }
    if (tm.dark) {
      if (!light) { light = document.createElement('canvas'); light.width = C.W; light.height = C.H; }
      var lc = light.getContext('2d');
      lc.globalCompositeOperation = 'source-over'; lc.clearRect(0, 0, C.W, C.H);
      lc.fillStyle = 'rgba(16,22,58,' + tm.dark + ')'; lc.fillRect(0, 0, C.W, C.H);
      lc.globalCompositeOperation = 'destination-out';
      var hole = function (x, y, r, a) { var g = lc.createRadialGradient(x, y, r * 0.15, x, y, r); g.addColorStop(0, 'rgba(0,0,0,' + a + ')'); g.addColorStop(1, 'rgba(0,0,0,0)'); lc.fillStyle = g; lc.fillRect(x - r, y - r, r * 2, r * 2); };
      hole(d.x, d.y, 235 + Math.sin(T * 3) * 4, 0.95);
      S.pens.forEach(function (p) { hole(p.x + p.w / 2, p.y + p.h / 2, 210, 0.9); });
      S.animals.forEach(function (a) { hole(a.x, a.y - 4, 38, 0.45); });
      ctx.drawImage(light, 0, 0);
      // ほたる
      for (i = 0; i < 14; i++) {
        var fx = 80 + ((i * 197 + T * (6 + i % 5)) % 1120), fy = 120 + ((i * 131) % 520) + Math.sin(T * 0.8 + i) * 16, fa = 0.4 + 0.4 * Math.sin(T * 2 + i * 1.7);
        ctx.fillStyle = 'rgba(230,255,150,' + Math.max(0, fa) + ')'; ell(ctx, fx, fy, 2, 2); ctx.fill();
      }
    }
  }

  function button(label, x, y, w, h, fn, primary) {
    var over = mouse.x >= x && mouse.x <= x + w && mouse.y >= y && mouse.y <= y + h;
    ctx.fillStyle = 'rgba(40,30,15,0.25)'; rr(ctx, x, y + 3, w, h, h / 2); ctx.fill();
    ctx.fillStyle = primary ? (over ? '#ffd27a' : '#ffc45a') : (over ? '#fffaf0' : '#f6ecd6'); rr(ctx, x, y - (over ? 1 : 0), w, h, h / 2); ctx.fill();
    txt(label, x + w / 2, y + h / 2 - (over ? 1 : 0) + 1, Math.min(20, h * 0.42), '#5a4022', 'center', 800);
    buttons.push({ x: x, y: y, w: w, h: h, fn: fn });
  }

  function drawHud() {
    var lv = S.level;
    txt('牧場 ' + (LV + 1) + ' / ' + LEVELS.length, 44, 26, 15, 'rgba(255,248,230,0.75)', 'left', 700);
    txt(TIMES[lv.time].label + '　' + lv.name, 44, 50, 22, '#fff8e6', 'left', 800);
    var sc = 1 + countPop * 0.35;
    ctx.save(); ctx.translate(640, 38); ctx.scale(sc, sc);
    txt('おかえり', -78, 3, 17, 'rgba(255,248,230,0.8)', 'right', 700);
    txt(S.settled + ' / ' + S.total, 0, 0, 34, countPop > 0 ? '#ffe9a0' : '#fff8e6', 'center', 800);
    ctx.restore();
    var par = lv.par, t = S.clock, st = t <= par[0] ? 3 : t <= par[1] ? 2 : 1;
    txt(fmt(t), 1236, 30, 26, '#fff8e6', 'right', 800);
    for (var i = 0; i < 3; i++) { ctx.fillStyle = i < st ? '#ffd95e' : 'rgba(255,255,255,0.22)'; starPath(ctx, 1146 - (2 - i) * 22 - 60, 30, 9); ctx.fill(); }
    var nextPar = st === 3 ? par[0] : st === 2 ? par[1] : null;
    txt(nextPar ? '★' + st + 'つは ' + fmt(nextPar) + ' まで' : 'ゆっくりで だいじょうぶ', 1236, 56, 14, 'rgba(255,248,230,0.7)', 'right', 700);
    // 下の帯
    txt(lv.hint.join('　'), 44, 706, 15, 'rgba(255,248,230,0.92)', 'left', 700);
    txt('R やりなおし　Esc 牧場えらび　M 音' + (Snd.isMuted() ? '（消音中）' : ''), 1236, 706, 13, 'rgba(255,248,230,0.6)', 'right', 700);
    if (tipT > 0 && clearT < 0) {
      ctx.globalAlpha = Math.min(1, tipT * 2, (7 - tipT) * 3) * 0.95;
      ctx.fillStyle = 'rgba(60,45,25,0.25)'; rr(ctx, 330, 633, 620, 44, 22); ctx.fill();
      ctx.fillStyle = '#fff3d6'; rr(ctx, 330, 630, 620, 44, 22); ctx.fill();
      txt('あわてた ひつじは ちらばる。クリックを はなして、歩いて 近づこう。', 640, 653, 17, '#8a4a22', 'center', 800);
      ctx.globalAlpha = 1;
    }
    // はじめのヒント札
    var ha = hintT < 0.4 ? hintT / 0.4 : (S.clock > 3.5 ? Math.max(0, 1 - (S.clock - 3.5) / 0.8) : 1);
    if (ha > 0 && clearT < 0) {
      ctx.globalAlpha = ha * 0.94;
      var hy = hintY;
      ctx.fillStyle = 'rgba(60,45,25,0.25)'; rr(ctx, 290, hy + 3, 700, 78, 18); ctx.fill();
      ctx.fillStyle = '#fffaf0'; rr(ctx, 290, hy, 700, 78, 18); ctx.fill();
      txt(lv.hint[0], 640, hy + 26, 19, '#5a4022', 'center', 800);
      txt(lv.hint[1], 640, hy + 54, 19, '#5a4022', 'center', 800);
      ctx.globalAlpha = 1;
    }
  }

  function drawClearPanel() {
    var k = Math.min(1, (clearT - 0.9) / 0.35); if (k <= 0) return;
    var e = 1 - Math.pow(1 - k, 3);
    ctx.fillStyle = 'rgba(30,25,15,' + 0.28 * e + ')'; ctx.fillRect(0, 0, C.W, C.H);
    var w = 520, h = 330, x = 640 - w / 2, y = 190 + (1 - e) * 30;
    ctx.globalAlpha = e;
    ctx.fillStyle = 'rgba(40,30,15,0.3)'; rr(ctx, x, y + 6, w, h, 28); ctx.fill();
    ctx.fillStyle = '#fffaf0'; rr(ctx, x, y, w, h, 28); ctx.fill();
    var last = LV === LEVELS.length - 1;
    txt(last ? 'みんな、おかえり。' : 'ぜんぶ おかえり！', 640, y + 50, 30, '#5a4022', 'center', 800);
    txt('ひつじ' + (hasGoats() ? 'と やぎ' : '') + 'が ' + hiki(S.total) + '、小屋で ねむった。', 640, y + 88, 17, '#8a6f4c', 'center', 700);
    for (var i = 0; i < 3; i++) {
      var sk = Math.max(0, Math.min(1, (clearT - 1.3 - i * 0.28) / 0.25)), onStar = i < clearStars;
      ctx.fillStyle = '#eadfc8'; starPath(ctx, 640 + (i - 1) * 74, y + 150, 30); ctx.fill();
      if (onStar && sk > 0) { ctx.fillStyle = '#ffcf4a'; starPath(ctx, 640 + (i - 1) * 74, y + 150, 30 * (1 + (1 - sk) * 0.6)); ctx.fill(); }
    }
    txt('じかん  ' + fmt(S.clock) + (newBest ? '　（いちばん はやい）' : '　／　これまで ' + fmt(save.best[LV] || S.clock)), 640, y + 208, 18, '#5a4022', 'center', 700);
    txt('★3 は ' + fmt(S.level.par[0]) + ' まで　★2 は ' + fmt(S.level.par[1]) + ' まで', 640, y + 234, 14, '#a08a6a', 'center', 700);
    ctx.globalAlpha = 1;
    if (k >= 1) {
      button('もういちど (R)', x + 40, y + h - 70, 190, 48, function () { startLevel(LV); });
      button(last ? '夜空を 見あげる' : 'つぎの 牧場へ', x + w - 250, y + h - 70, 210, 48, function () { nextAfterClear(); }, true);
    }
  }
  function nextAfterClear() { if (LV === LEVELS.length - 1) toEnding(); else { var n = LV + 1; go(function () { startLevel(n); }); } }

  // ---------- 画面：表紙 ----------
  function drawTitle() {
    drawWorld();
    var bob = Math.sin(T * 1.3) * 3;
    txtO('ひつじが いっぴき', 640, 190 + bob, 84, '#fffbee', '#4f7d48', 'center', 16);
    txtO('牧羊犬コロの 一日', 640, 262 + bob, 26, '#fffbee', '#4f7d48', 'center', 7);
    txt('ONE PROMPT WORLDS  08', 44, 40, 15, 'rgba(255,248,230,0.75)', 'left', 700);
    txt('マウスを うごかすと、コロが ついてくる。ひつじを おいかけてみよう。', 640, 706, 15, 'rgba(255,248,230,0.92)', 'center', 700);
    var has = cleared() > 0;
    button(has ? 'つづきから' : 'はじめる', 640 - 120, 610, 240, 58, function () { Snd.click(); if (has) toSelect(); else go(function () { startLevel(0); }); }, true);
  }

  // ---------- 画面：牧場えらび ----------
  function nodePos(i) { var k = i / (LEVELS.length - 1); return { x: 150 + k * 980, y: 430 - Math.sin(k * Math.PI) * 150 }; }
  function drawSelect() {
    var g = ctx.createLinearGradient(0, 0, C.W, 0);
    g.addColorStop(0, '#ffe9b8'); g.addColorStop(0.35, '#bfe6f5'); g.addColorStop(0.62, '#ffc98a'); g.addColorStop(0.8, '#c98aa8'); g.addColorStop(1, '#2a3560');
    ctx.fillStyle = g; ctx.fillRect(0, 0, C.W, C.H);
    // 丘
    ctx.fillStyle = 'rgba(80,140,80,0.55)'; ctx.beginPath(); ctx.moveTo(0, 560);
    for (var x = 0; x <= C.W; x += 40) ctx.lineTo(x, 560 + Math.sin(x * 0.006 + 1) * 28 + Math.sin(x * 0.017) * 10); ctx.lineTo(C.W, C.H); ctx.lineTo(0, C.H); ctx.fill();
    ctx.fillStyle = '#5d9a5a'; ctx.beginPath(); ctx.moveTo(0, 620);
    for (x = 0; x <= C.W; x += 40) ctx.lineTo(x, 615 + Math.sin(x * 0.008 + 3) * 22); ctx.lineTo(C.W, C.H); ctx.lineTo(0, C.H); ctx.fill();
    ctx.fillStyle = 'rgba(20,25,60,0.35)'; var ng = ctx.createLinearGradient(700, 0, C.W, 0); ng.addColorStop(0, 'rgba(20,25,60,0)'); ng.addColorStop(1, 'rgba(20,25,60,0.55)'); ctx.fillStyle = ng; ctx.fillRect(0, 0, C.W, C.H);
    txtO('牧場えらび', 640, 70, 40, '#fffbee', '#5a7d52', 'center', 9);
    txt('朝から 夜まで、コロの一日。', 640, 116, 17, '#5a5236', 'center', 700);
    var un = unlocked(), i, p;
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 4; ctx.setLineDash([2, 12]); ctx.lineCap = 'round'; ctx.beginPath();
    for (i = 0; i < LEVELS.length; i++) { p = nodePos(i); if (i) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y); }
    ctx.stroke(); ctx.setLineDash([]);
    hover = -1;
    for (i = 0; i < LEVELS.length; i++) {
      p = nodePos(i); var open = i <= un, tm = TIMES[LEVELS[i].time];
      var over = open && Math.hypot(mouse.x - p.x, mouse.y - p.y) < 56; if (over) hover = i;
      var r = over ? 54 : 48;
      ctx.fillStyle = 'rgba(30,30,40,0.22)'; ell(ctx, p.x, p.y + 5, r, r); ctx.fill();
      ctx.fillStyle = '#fffaf0'; ell(ctx, p.x, p.y, r, r); ctx.fill();
      ctx.fillStyle = open ? tm.g2 : '#c9c6bd'; ell(ctx, p.x, p.y, r - 6, r - 6); ctx.fill();
      if (tm.dark && open) { ctx.fillStyle = 'rgba(20,30,70,0.45)'; ell(ctx, p.x, p.y, r - 6, r - 6); ctx.fill(); }
      if (open) {
        iconSheep(p.x - (LEVELS[i].goats ? 11 : 0), p.y - 6, 1.5);
        if (LEVELS[i].goats) iconGoat(p.x + 14, p.y - 4, 1.4);
        txt(String(i + 1), p.x, p.y + 26, 17, '#fffbee', 'center', 800);
      } else txt(String(i + 1), p.x, p.y + 2, 30, '#fffaf0', 'center', 800);
      var dark = i >= LEVELS.length - 2;
      txt(open ? LEVELS[i].name : '？', p.x, p.y + r + 22, 16, dark ? '#fff8e6' : '#4a4032', 'center', 800);
      for (var s = 0; s < 3; s++) { ctx.fillStyle = s < (save.stars[i] || 0) ? '#ffcf4a' : (dark ? 'rgba(255,255,255,0.25)' : 'rgba(90,80,50,0.22)'); starPath(ctx, p.x + (s - 1) * 19, p.y + r + 46, 8); ctx.fill(); }
      if (save.best[i]) txt(fmt(save.best[i]), p.x, p.y + r + 68, 13, dark ? 'rgba(255,248,230,0.8)' : 'rgba(74,64,50,0.8)', 'center', 700);
      if (open) (function (idx) { buttons.push({ x: p.x - 56, y: p.y - 56, w: 112, h: 112, fn: function () { Snd.click(); go(function () { startLevel(idx); }); } }); })(i);
    }
    // いまの場所にコロ
    p = nodePos(un); ctx.save(); ctx.translate(p.x - 76, p.y + 36); ctx.scale(1.5, 1.5); drawDog({ x: 0, y: 0, hx: 1, hy: 0, speed: 0, gait: 0, swim: false }); ctx.restore();
    txt('★ ' + totalStars() + ' / ' + LEVELS.length * 3, 44, 690, 20, '#fff8e6', 'left', 800);
    txt('Esc 表紙へ　M 音', 1236, 692, 13, 'rgba(255,248,230,0.7)', 'right', 700);
    if (cleared() === LEVELS.length) button('夜空を 見あげる', 640 - 110, 640, 220, 50, function () { Snd.click(); toEnding(); }, true);
  }

  // ---------- 画面：結末 ----------
  var NSTAR = LEVELS.length * 3;
  var SKY = []; (function () { var r = Sim.mulberry(88); for (var i = 0; i < NSTAR; i++) SKY.push({ x: 90 + r() * 1100, y: 50 + r() * 300, s: 5 + r() * 4 }); for (i = 0; i < 90; i++) SKY.push({ x: r() * 1280, y: r() * 420, s: 0 }); })();
  var END_N = 12;
  function drawEnding(dt) {
    endT += dt;
    var g = ctx.createLinearGradient(0, 0, 0, C.H); g.addColorStop(0, '#141b3c'); g.addColorStop(0.7, '#2a3766'); g.addColorStop(1, '#3d4a78');
    ctx.fillStyle = g; ctx.fillRect(0, 0, C.W, C.H);
    var ts = totalStars(), i;
    for (i = NSTAR; i < SKY.length; i++) { ctx.fillStyle = 'rgba(255,255,255,' + (0.25 + 0.2 * Math.sin(T * 1.5 + i)) + ')'; ctx.fillRect(SKY[i].x, SKY[i].y, 1.6, 1.6); }
    for (i = 0; i < NSTAR; i++) {
      var lit = i < ts, ap = Math.max(0, Math.min(1, (endT - 0.6 - i * 0.12) / 0.4));
      if (lit) {
        ctx.globalAlpha = ap * (0.8 + 0.2 * Math.sin(T * 2 + i));
        var hg = ctx.createRadialGradient(SKY[i].x, SKY[i].y, 0, SKY[i].x, SKY[i].y, SKY[i].s * 3); hg.addColorStop(0, 'rgba(255,225,130,0.35)'); hg.addColorStop(1, 'rgba(255,225,130,0)');
        ctx.fillStyle = hg; ell(ctx, SKY[i].x, SKY[i].y, SKY[i].s * 3, SKY[i].s * 3); ctx.fill();
        ctx.fillStyle = '#ffe38a'; starPath(ctx, SKY[i].x, SKY[i].y, SKY[i].s * (1 + (1 - ap))); ctx.fill();
      } else { ctx.globalAlpha = 0.35; ctx.strokeStyle = '#aab4e0'; ctx.lineWidth = 1; starPath(ctx, SKY[i].x, SKY[i].y, SKY[i].s * 0.8); ctx.stroke(); }
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = '#fff3c9'; ell(ctx, 1080, 130, 44, 44); ctx.fill(); ctx.fillStyle = '#1b2348'; ell(ctx, 1062, 120, 40, 40); ctx.fill();
    ctx.fillStyle = '#243a48'; ctx.beginPath(); ctx.moveTo(0, 520);
    for (var x = 0; x <= C.W; x += 40) ctx.lineTo(x, 520 + Math.sin(x * 0.005 + 2) * 30); ctx.lineTo(C.W, C.H); ctx.lineTo(0, C.H); ctx.fill();
    ctx.fillStyle = '#2f5a4c'; ctx.beginPath(); ctx.moveTo(0, 590);
    for (x = 0; x <= C.W; x += 40) ctx.lineTo(x, 585 + Math.sin(x * 0.004) * 16); ctx.lineTo(C.W, C.H); ctx.lineTo(0, C.H); ctx.fill();
    // 柵
    var gy = 600;
    var r2 = Sim.mulberry(5);
    ctx.strokeStyle = '#3f7560'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    for (i = 0; i < 70; i++) { var tx = r2() * C.W, ty = 600 + r2() * 110; ctx.beginPath(); ctx.moveTo(tx - 3, ty); ctx.lineTo(tx - 5, ty - 6); ctx.moveTo(tx, ty); ctx.lineTo(tx, ty - 8); ctx.moveTo(tx + 3, ty); ctx.lineTo(tx + 5, ty - 6); ctx.stroke(); }
    ctx.save(); ctx.translate(640, gy); ctx.scale(1.5, 1.5);
    for (i = -2; i < 2; i++) drawFence({ x0: i * 27, y0: 0, x1: (i + 1) * 27, y1: 0, last: i === 1 });
    ctx.restore();
    // とびこえるひつじ
    var per = 1.25, t0 = 2.2, count = 0;
    for (i = 0; i < END_N; i++) {
      var k = (endT - t0 - i * per) / 2.4;
      if (k < 0) continue;
      if (k > 0.5) count = i + 1;
      if (k > 1.25) continue;
      var sx = 330 + k * 620, jump = k > 0.3 && k < 0.7 ? Math.sin((k - 0.3) / 0.4 * Math.PI) * 52 : 0;
      ctx.globalAlpha = Math.min(1, k * 6, (1.25 - k) * 5);
      var fake = { x: sx, y: gy + 6, z: -jump, hx: 1, hy: 0, speed: jump > 0 ? 0 : 40, phase: endT * 14 + i, hop: 0, lie: 0, id: i, panic: 0 };
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.save(); ctx.translate(fake.x, fake.y); ctx.scale(1.7, 1.7); ctx.translate(-fake.x, -fake.y); drawSheep(fake); ctx.restore();
      ctx.globalAlpha = 1;
    }
    if (count > endCount) { endCount = count; Snd.settle(count); }
    ctx.save(); ctx.translate(250, 640); ctx.scale(1.6, 1.6); drawDog({ x: 0, y: 0, hx: 1, hy: 0.2, speed: 0, gait: 0, swim: false }, true); ctx.restore();
    if (Math.sin(T * 1.2) > 0.2) txtO('z', 282 + Math.sin(T) * 3, 610 - ((T * 12) % 24), 16, '#fffbe8', 'rgba(30,40,90,0.6)', 'center', 3);
    var doneT = t0 + END_N * per + 1.4;
    if (endCount > 0 && endT < doneT) txtO('ひつじが ' + hiki(endCount) + '……', 640, 440, 34, '#fffbee', 'rgba(20,28,70,0.8)', 'center', 8);
    if (endT >= doneT) {
      var a = Math.min(1, (endT - doneT) / 1.2); ctx.globalAlpha = a;
      txtO('おやすみ、コロ。', 640, 400, 46, '#fffbee', 'rgba(20,28,70,0.8)', 'center', 9);
      var tt = 0; for (i = 0; i < LEVELS.length; i++) tt += save.best[i] || 0;
      txtO('きょう あつめた星　★ ' + ts + ' / ' + NSTAR + '　　　いちばん はやい一日　' + fmt(tt), 640, 458, 19, '#fffbee', 'rgba(20,28,70,0.8)', 'center', 6);
      if (ts < NSTAR) txtO('星のない場所は、もっと はやく おくりとどけると ともる。', 640, 492, 15, '#cfd6f5', 'rgba(20,28,70,0.8)', 'center', 5);
      ctx.globalAlpha = 1;
      if (a >= 1) button('牧場えらびへ', 640 - 110, 650, 220, 48, function () { Snd.click(); toSelect(); }, true);
    } else txt('クリックで とばす', 1236, 700, 13, 'rgba(255,248,230,0.5)', 'right', 700);
  }

  // ---------- ループ ----------
  var acc = 0, lastT = 0;
  function update(dt) {
    T += dt;
    if (S && (scene === 'play' || scene === 'title')) {
      acc += dt; var n = 0;
      while (acc >= 1 / 60 && n < 5) { simTick(1 / 60); acc -= 1 / 60; n++; }
      if (n === 5) acc = 0;
    }
    updateParts(dt);
    if (fadeDir) {
      fade += fadeDir * dt * 3.2;
      if (fade >= 1 && fadeDir > 0) { fade = 1; fadeDir = -1; var f = fadeFn; fadeFn = null; if (f) f(); }
      else if (fade <= 0 && fadeDir < 0) { fade = 0; fadeDir = 0; }
    }
    Snd.tick();
  }
  function render(dt) {
    buttons = [];
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (scene === 'play') { drawWorld(); drawHud(); if (clearT >= 0) drawClearPanel(); }
    else if (scene === 'title') drawTitle();
    else if (scene === 'select') drawSelect();
    else if (scene === 'ending') drawEnding(dt);
    if (fade > 0) { ctx.fillStyle = 'rgba(28,36,30,' + fade + ')'; ctx.fillRect(0, 0, C.W, C.H); }
    var useHand = false;
    for (var i = 0; i < buttons.length; i++) { var b = buttons[i]; if (mouse.x >= b.x && mouse.x <= b.x + b.w && mouse.y >= b.y && mouse.y <= b.y + b.h) useHand = true; }
    cv.style.cursor = useHand ? 'pointer' : ((scene === 'play' && clearT < 0) || scene === 'title') ? 'none' : 'default';
  }
  function frame(ts) {
    var dt = Math.min(0.1, (ts - lastT) / 1000 || 0); lastT = ts;
    if (!hold) { update(dt); render(dt); }
    requestAnimationFrame(frame);
  }

  // ---------- 入力 ----------
  function fit() {
    var k = Math.min(window.innerWidth / C.W, window.innerHeight / C.H);
    cv.style.width = Math.floor(C.W * k) + 'px'; cv.style.height = Math.floor(C.H * k) + 'px';
  }
  function pos(e) { var r = cv.getBoundingClientRect(); mouse.x = (e.clientX - r.left) * C.W / r.width; mouse.y = (e.clientY - r.top) * C.H / r.height; mouse.moved = true; }
  cv.addEventListener('pointermove', pos);
  cv.addEventListener('pointerdown', function (e) {
    pos(e); Snd.init();
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    for (var i = buttons.length - 1; i >= 0; i--) { var b = buttons[i]; if (mouse.x >= b.x && mouse.x <= b.x + b.w && mouse.y >= b.y && mouse.y <= b.y + b.h) { Snd.click(); b.fn(); return; } }
    if (scene === 'ending') { var doneT = 2.2 + END_N * 1.25 + 1.4; if (endT < doneT) endT = doneT; return; }
    mouse.down = true;
    try { cv.setPointerCapture(e.pointerId); } catch (err) { }
  });
  window.addEventListener('pointerup', function () { mouse.down = false; });
  window.addEventListener('blur', function () { mouse.down = false; keys = {}; });
  cv.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  window.addEventListener('keydown', function (e) {
    Snd.init();
    if (e.key === ' ' || e.key === 'Shift') { keys[e.key] = true; e.preventDefault(); }
    if (e.repeat) return;
    var k = e.key.toLowerCase();
    if (k === 'm') Snd.toggleMute();
    if (scene === 'play') {
      if (k === 'r') startLevel(LV);
      else if (k === 'escape') toSelect();
      else if (k === 'enter' && clearT > 1.3) nextAfterClear();
    } else if (scene === 'select') {
      if (k === 'escape') go(startTitle);
    } else if (scene === 'title') {
      if (k === 'enter') { if (cleared() > 0) toSelect(); else go(function () { startLevel(0); }); }
    } else if (scene === 'ending') {
      if (k === 'escape' || k === 'enter') toSelect();
    }
  });
  window.addEventListener('keyup', function (e) { keys[e.key] = false; });
  window.addEventListener('resize', fit);

  // ---------- 検証用 ----------
  window.__hitsuji = {
    get S() { return S; }, get scene() { return scene; }, get save() { return save; }, get clearT() { return clearT; },
    goto: function (i, seed) { fade = 0; fadeDir = 0; fadeFn = null; startLevel(i, seed); },
    tick: function (tx, ty, dash) { mouse.x = tx; mouse.y = ty; mouse.down = !!dash; mouse.moved = true; simTick(1 / 60); T += 1 / 60; updateParts(1 / 60); },
    draw: function () { render(1 / 60); },
    select: function () { scene = 'select'; S = null; fade = 0; fadeDir = 0; },
    ending: function (t) { scene = 'ending'; S = null; endT = t || 0; endCount = 0; fade = 0; fadeDir = 0; },
    title: function () { startTitle(); fade = 0; fadeDir = 0; },
    hold: function (v) { hold = v; },
    mouse: function (x, y, down) { mouse.x = x; mouse.y = y; mouse.down = !!down; mouse.moved = true; },
    step: function (n, dt) { for (var i = 0; i < n; i++) { update(dt || 1 / 60); } render(1 / 60); },
    buttons: function () { return buttons.map(function (b) { return [b.x, b.y, b.w, b.h]; }); },
    reset: function () { save = { best: [], stars: [], seenEnding: false }; store(); }
  };

  fit(); startTitle();
  requestAnimationFrame(frame);
})();
