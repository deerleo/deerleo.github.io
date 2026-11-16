// うしろのハニワ ― 絵づくり（壁・床・ハニワなどをすべて手続きで描く。外部素材なし）
(function () {
  'use strict';
  var TS = 128;
  var PAL = {
    stone: '#7b6a57', stoneD: '#4c4036', stoneL: '#96836b', mortar: '#2a221c',
    red: '#b23a1e', redD: '#7c2414', cream: '#ead7a8', black: '#1a1310',
    clay: '#c96a3c', clayD: '#8a3f22', clayL: '#eaa06c',
    sue: '#7f97ad', sueD: '#4d6379', sueL: '#b4c8d8',
    bronze: '#8fa27a', gold: '#e8c66a'
  };

  function rng(seed) {
    var s = seed >>> 0;
    return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }
  function mk(w, h) {
    var c = document.createElement('canvas'); c.width = w || TS; c.height = h || TS;
    c.getContext('2d', { willReadFrequently: true });
    return c;
  }
  function toData(c) {
    var d = c.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, c.width, c.height).data;
    return new Uint32Array(d.buffer.slice(0));
  }
  function speckle(c, amt, seed) {
    var g = c.getContext('2d'), im = g.getImageData(0, 0, c.width, c.height), d = im.data, r = rng(seed);
    for (var i = 0; i < d.length; i += 4) {
      if (d[i + 3] < 10) continue;
      var n = (r() - 0.5) * amt;
      d[i] = Math.max(0, Math.min(255, d[i] + n));
      d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + n));
      d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + n * 0.8));
    }
    g.putImageData(im, 0, 0);
  }

  // ---- 石積みの壁 ----------------------------------------------------
  function stoneBase(g, seed) {
    var r = rng(seed);
    g.fillStyle = PAL.mortar; g.fillRect(0, 0, TS, TS);
    var rowsH = [30, 26, 22, 26, 24], y = 0;
    for (var i = 0; i < rowsH.length; i++) {
      var h = rowsH[i], x = -Math.floor(r() * 30);
      while (x < TS) {
        var w = 30 + Math.floor(r() * 34);
        var t = r();
        var col = t < 0.33 ? PAL.stone : t < 0.66 ? '#72614f' : '#857460';
        g.fillStyle = col;
        rr(g, x + 1, y + 1, w - 2, h - 2, 4); g.fill();
        g.fillStyle = 'rgba(255,235,200,0.10)'; g.fillRect(x + 3, y + 2, w - 6, 2);
        g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(x + 3, y + h - 5, w - 6, 3);
        x += w;
      }
      y += h;
    }
  }
  function rr(g, x, y, w, h, r) {
    g.beginPath();
    g.moveTo(x + r, y); g.lineTo(x + w - r, y); g.quadraticCurveTo(x + w, y, x + w, y + r);
    g.lineTo(x + w, y + h - r); g.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    g.lineTo(x + r, y + h); g.quadraticCurveTo(x, y + h, x, y + h - r);
    g.lineTo(x, y + r); g.quadraticCurveTo(x, y, x + r, y); g.closePath();
  }
  function paintBandTriangles(g, y, h) {
    g.fillStyle = PAL.cream; g.globalAlpha = 0.9; g.fillRect(0, y, TS, h);
    g.globalAlpha = 0.92; g.fillStyle = PAL.red;
    var n = 8, w = TS / n;
    for (var i = 0; i < n; i++) {
      g.beginPath(); g.moveTo(i * w, y + h); g.lineTo(i * w + w / 2, y); g.lineTo(i * w + w, y + h); g.closePath(); g.fill();
    }
    g.fillStyle = PAL.black; g.globalAlpha = 0.75;
    g.fillRect(0, y - 3, TS, 3); g.fillRect(0, y + h, TS, 3);
    g.globalAlpha = 1;
  }
  function wallPlain(seed) {
    var c = mk(), g = c.getContext('2d');
    stoneBase(g, seed);
    // 腰の高さに細い朱の帯
    g.globalAlpha = 0.55; g.fillStyle = PAL.red; g.fillRect(0, 98, TS, 5); g.globalAlpha = 1;
    speckle(c, 26, seed + 7);
    return c;
  }
  function wallBand(seed) {
    var c = mk(), g = c.getContext('2d');
    stoneBase(g, seed);
    paintBandTriangles(g, 44, 22);
    g.globalAlpha = 0.55; g.fillStyle = PAL.red; g.fillRect(0, 98, TS, 5); g.globalAlpha = 1;
    speckle(c, 30, seed + 9);
    return c;
  }
  function wallCircle(seed) {
    var c = mk(), g = c.getContext('2d');
    stoneBase(g, seed);
    var cols = [PAL.red, PAL.cream, PAL.red, PAL.cream, PAL.black];
    for (var i = 0; i < cols.length; i++) {
      g.globalAlpha = 0.88; g.fillStyle = cols[i];
      g.beginPath(); g.arc(64, 54, 30 - i * 6, 0, 7); g.fill();
    }
    g.globalAlpha = 0.55; g.fillStyle = PAL.red; g.fillRect(0, 98, TS, 5); g.globalAlpha = 1;
    speckle(c, 30, seed + 11);
    return c;
  }

  function markPath(g, m, cx, cy, r) {
    g.beginPath();
    if (m === 0) g.arc(cx, cy, r, 0, 7);
    else if (m === 1) { g.moveTo(cx, cy - r * 1.1); g.lineTo(cx + r * 1.05, cy + r * 0.8); g.lineTo(cx - r * 1.05, cy + r * 0.8); g.closePath(); }
    else { g.rect(cx - r * 0.9, cy - r * 0.9, r * 1.8, r * 1.8); }
  }
  function drawMark(g, m, cx, cy, r, col, lw) {
    g.strokeStyle = col; g.lineWidth = lw; g.lineJoin = 'round';
    markPath(g, m, cx, cy, r); g.stroke();
  }

  // ---- 石戸・出口・鏡 -------------------------------------------------
  function doorTex(m) {
    var c = mk(), g = c.getContext('2d');
    g.fillStyle = '#2b231d'; g.fillRect(0, 0, TS, TS);
    g.fillStyle = '#5a4b40'; rr(g, 6, 4, TS - 12, TS - 4, 10); g.fill();
    g.fillStyle = '#665649'; rr(g, 12, 10, TS - 24, TS - 12, 8); g.fill();
    g.strokeStyle = PAL.red; g.lineWidth = 6; rr(g, 16, 14, TS - 32, TS - 22, 6); g.stroke();
    g.fillStyle = 'rgba(20,14,10,0.55)'; g.beginPath(); g.arc(64, 62, 32, 0, 7); g.fill();
    drawMark(g, m, 64, 62, 19, PAL.cream, 7);
    g.fillStyle = PAL.black; g.fillRect(62, 4, 3, TS);
    speckle(c, 22, 300 + m);
    return c;
  }
  function exitTex() {
    var c = mk(), g = c.getContext('2d');
    g.fillStyle = '#2b231d'; g.fillRect(0, 0, TS, TS);
    g.fillStyle = '#4f4338'; rr(g, 6, 4, TS - 12, TS - 4, 10); g.fill();
    g.strokeStyle = PAL.gold; g.lineWidth = 5; rr(g, 15, 13, TS - 30, TS - 20, 6); g.stroke();
    g.fillStyle = PAL.gold;
    for (var i = 0; i < 12; i++) {
      var a = i / 12 * Math.PI * 2;
      g.beginPath();
      g.moveTo(64 + Math.cos(a - 0.14) * 22, 60 + Math.sin(a - 0.14) * 22);
      g.lineTo(64 + Math.cos(a) * 36, 60 + Math.sin(a) * 36);
      g.lineTo(64 + Math.cos(a + 0.14) * 22, 60 + Math.sin(a + 0.14) * 22);
      g.closePath(); g.fill();
    }
    g.beginPath(); g.arc(64, 60, 15, 0, 7); g.fill();
    g.fillStyle = '#4f4338'; g.beginPath(); g.arc(64, 60, 8, 0, 7); g.fill();
    g.fillStyle = PAL.black; g.fillRect(62, 4, 3, TS);
    speckle(c, 22, 401);
    return c;
  }
  var mirrorCanvas = null, mirrorBase = null;
  function mirrorFrame(g) {
    g.fillStyle = '#3d4a36'; g.beginPath(); g.arc(64, 58, 47, 0, 7); g.fill();
    g.fillStyle = PAL.bronze; g.beginPath(); g.arc(64, 58, 44, 0, 7); g.fill();
    g.fillStyle = '#6f8460';
    for (var i = 0; i < 16; i++) {
      var a = i / 16 * Math.PI * 2;
      g.beginPath(); g.arc(64 + Math.cos(a) * 39, 58 + Math.sin(a) * 39, 2.6, 0, 7); g.fill();
    }
    g.fillStyle = '#35402f'; g.beginPath(); g.arc(64, 58, 34, 0, 7); g.fill();
  }
  function mirrorTex() {
    var c = mk(), g = c.getContext('2d');
    stoneBase(g, 55);
    speckle(c, 26, 56);
    mirrorFrame(g);
    var gr = g.createLinearGradient(40, 30, 90, 90);
    gr.addColorStop(0, '#d9cf9a'); gr.addColorStop(0.5, '#a8a070'); gr.addColorStop(1, '#6d6a48');
    g.fillStyle = gr; g.beginPath(); g.arc(64, 58, 32, 0, 7); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 3;
    g.beginPath(); g.arc(64, 58, 25, 3.5, 4.6); g.stroke();
    return c;
  }
  // 鏡に真後ろを映す。behind: [{dist, type, mark, st}]、corridor: 後ろの通路の長さ
  function mirrorActive(behind, corridor, t) {
    if (!mirrorCanvas) { mirrorCanvas = mk(); mirrorBase = mirrorTex(); }
    var g = mirrorCanvas.getContext('2d');
    g.clearRect(0, 0, TS, TS);
    g.drawImage(mirrorBase, 0, 0);
    g.save();
    g.beginPath(); g.arc(64, 58, 32, 0, 7); g.clip();
    var gr = g.createRadialGradient(64, 58, 4, 64, 58, 34);
    gr.addColorStop(0, '#141a22'); gr.addColorStop(1, '#4b5a52');
    g.fillStyle = gr; g.fillRect(30, 24, 70, 70);
    // 奥へ続く通路の線
    g.strokeStyle = 'rgba(210,200,150,0.35)'; g.lineWidth = 1.5;
    var far = Math.max(1, corridor);
    for (var k = 1; k <= Math.min(6, far); k++) {
      var s = 30 / (k * 0.55 + 0.5);
      g.strokeRect(64 - s, 58 - s, s * 2, s * 2);
    }
    behind.slice().sort(function (a, b) { return b.dist - a.dist; }).forEach(function (o) {
      var sc = 0.62 / (o.dist * 0.55 + 0.45);
      var sp = sprite(o.type, o.mark, o.st === 2 ? 'settled' : o.type === 'r' ? (o.st === 0 ? 'sleep' : 'a') : 'a');
      var w = TS * sc;
      g.drawImage(sp.canvas, 64 - w / 2, 58 + 30 / (o.dist * 0.55 + 0.5) - w, w, w);
    });
    // 手前に自分のランタンの灯
    var fl = 0.75 + Math.sin(t * 9) * 0.1;
    var lg = g.createRadialGradient(64, 92, 1, 64, 92, 22);
    lg.addColorStop(0, 'rgba(255,214,130,' + fl + ')'); lg.addColorStop(1, 'rgba(255,180,80,0)');
    g.fillStyle = lg; g.fillRect(30, 60, 70, 40);
    g.restore();
    g.strokeStyle = 'rgba(255,240,190,0.6)'; g.lineWidth = 2;
    g.beginPath(); g.arc(64, 58, 32.5, 0, 7); g.stroke();
    return toData(mirrorCanvas);
  }

  // ---- 床と天井 ------------------------------------------------------
  function floorTex() {
    var c = mk(), g = c.getContext('2d'), r = rng(91);
    g.fillStyle = '#5b4a3a'; g.fillRect(0, 0, TS, TS);
    for (var i = 0; i < 40; i++) {
      g.fillStyle = r() < 0.5 ? 'rgba(255,220,170,0.06)' : 'rgba(0,0,0,0.10)';
      g.beginPath(); g.ellipse(r() * TS, r() * TS, 4 + r() * 10, 3 + r() * 6, r() * 3, 0, 7); g.fill();
    }
    // マスの境目（歩数を数えやすくする）
    g.fillStyle = 'rgba(20,14,10,0.75)';
    g.fillRect(0, 0, TS, 3); g.fillRect(0, 0, 3, TS); g.fillRect(0, TS - 2, TS, 2); g.fillRect(TS - 2, 0, 2, TS);
    g.fillStyle = 'rgba(255,225,180,0.12)'; g.fillRect(3, 3, TS - 5, 2); g.fillRect(3, 3, 2, TS - 5);
    speckle(c, 24, 92);
    return c;
  }
  function ceilTex() {
    var c = mk(), g = c.getContext('2d'), r = rng(93);
    g.fillStyle = '#3b332d'; g.fillRect(0, 0, TS, TS);
    for (var i = 0; i < 26; i++) {
      g.fillStyle = r() < 0.5 ? 'rgba(255,220,170,0.05)' : 'rgba(0,0,0,0.14)';
      g.beginPath(); g.ellipse(r() * TS, r() * TS, 6 + r() * 14, 4 + r() * 8, r() * 3, 0, 7); g.fill();
    }
    g.fillStyle = 'rgba(10,8,6,0.8)'; g.fillRect(0, 0, TS, 4); g.fillRect(0, 62, TS, 3);
    speckle(c, 18, 94);
    return c;
  }

  // ---- ハニワ --------------------------------------------------------
  function bodyGrad(g, x0, x1, base, dark, light) {
    var gr = g.createLinearGradient(x0, 0, x1, 0);
    gr.addColorStop(0, dark); gr.addColorStop(0.28, base); gr.addColorStop(0.5, light);
    gr.addColorStop(0.75, base); gr.addColorStop(1, dark);
    return gr;
  }
  function tube(g, pts, w, col, colD) {
    g.lineCap = 'round'; g.lineJoin = 'round';
    g.strokeStyle = colD; g.lineWidth = w + 3;
    g.beginPath(); g.moveTo(pts[0], pts[1]); g.quadraticCurveTo(pts[2], pts[3], pts[4], pts[5]); g.stroke();
    g.strokeStyle = col; g.lineWidth = w;
    g.beginPath(); g.moveTo(pts[0], pts[1]); g.quadraticCurveTo(pts[2], pts[3], pts[4], pts[5]); g.stroke();
  }
  function hole(g, x, y, rx, ry, glow) {
    g.fillStyle = '#1d0f0a'; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, 7); g.fill();
    if (glow) { g.fillStyle = glow; g.beginPath(); g.arc(x, y + 0.5, Math.min(rx, ry) * 0.55, 0, 7); g.fill(); }
  }
  function arcEye(g, x, y, up) {
    g.strokeStyle = '#1d0f0a'; g.lineWidth = 3; g.lineCap = 'round';
    g.beginPath();
    if (up) g.arc(x, y + 2, 5, Math.PI * 1.1, Math.PI * 1.9); else g.arc(x, y - 3, 5, Math.PI * 0.15, Math.PI * 0.85);
    g.stroke();
  }

  // 赤：背を向けると寄ってくる。poseは sleep / a / b / near / settled
  function drawRed(g, m, pose) {
    var C = PAL.clay, D = PAL.clayD, Lt = PAL.clayL;
    var up = { a: [1, 0], b: [0, 1], near: [1, 1], sleep: [0, 0], settled: [0, 0] }[pose];
    g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.ellipse(64, 123, 30, 5, 0, 0, 7); g.fill();
    // 腕（体の後ろ側）
    if (up[0]) tube(g, [44, 74, 22, 62, 30, 34], 9, C, D); else tube(g, [44, 76, 28, 84, 46, 96], 9, C, D);
    if (up[1]) tube(g, [84, 74, 106, 62, 98, 34], 9, C, D); else tube(g, [84, 76, 100, 84, 82, 96], 9, C, D);
    // 胴（円筒）
    g.fillStyle = bodyGrad(g, 38, 90, C, D, Lt);
    g.beginPath();
    g.moveTo(44, 62); g.lineTo(84, 62); g.quadraticCurveTo(90, 96, 88, 122);
    g.lineTo(40, 122); g.quadraticCurveTo(38, 96, 44, 62); g.closePath(); g.fill();
    g.strokeStyle = D; g.lineWidth = 2; g.stroke();
    g.fillStyle = 'rgba(90,35,15,0.45)'; g.fillRect(40, 108, 48, 3); g.fillRect(43, 66, 42, 3);
    // 頭
    g.fillStyle = bodyGrad(g, 40, 88, C, D, Lt);
    g.beginPath(); g.ellipse(64, 42, 24, 25, 0, 0, 7); g.fill(); g.strokeStyle = D; g.lineWidth = 2; g.stroke();
    // 鉢巻きとまげ
    g.fillStyle = D; g.fillRect(42, 24, 44, 4);
    g.fillStyle = C; g.beginPath(); g.ellipse(64, 15, 9, 6, 0, 0, 7); g.fill(); g.strokeStyle = D; g.stroke();
    // 顔
    if (pose === 'sleep') { arcEye(g, 54, 42, false); arcEye(g, 74, 42, false); hole(g, 64, 54, 3, 2); }
    else if (pose === 'settled') { arcEye(g, 54, 42, true); arcEye(g, 74, 42, true); hole(g, 64, 53, 5, 3); }
    else {
      var gl = 'rgba(255,190,90,0.95)';
      if (pose === 'near') { hole(g, 54, 40, 6.5, 7.5, gl); hole(g, 74, 40, 6.5, 7.5, gl); hole(g, 64, 55, 6, 6); }
      else { hole(g, 54, 41, 5.5, 6.5, gl); hole(g, 74, 41, 5.5, 6.5, gl); hole(g, 64, 54, 4.5, 3.5); }
    }
    // 腹の印
    g.fillStyle = 'rgba(60,20,8,0.35)'; g.beginPath(); g.arc(64, 90, 15, 0, 7); g.fill();
    drawMark(g, m, 64, 90, 9, PAL.cream, 4);
  }

  // 青：見つめるとあとずさる。poseは a / b / stuck / settled
  function drawBlue(g, m, pose) {
    var C = PAL.sue, D = PAL.sueD, Lt = PAL.sueL;
    g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.ellipse(64, 123, 34, 5, 0, 0, 7); g.fill();
    // ずんぐりした胴
    g.fillStyle = bodyGrad(g, 30, 98, C, D, Lt);
    g.beginPath();
    g.moveTo(40, 72); g.lineTo(88, 72); g.quadraticCurveTo(102, 100, 96, 122);
    g.lineTo(32, 122); g.quadraticCurveTo(26, 100, 40, 72); g.closePath(); g.fill();
    g.strokeStyle = D; g.lineWidth = 2; g.stroke();
    g.fillStyle = 'rgba(40,60,80,0.4)'; g.fillRect(32, 110, 64, 3);
    // 頭
    g.fillStyle = bodyGrad(g, 36, 92, C, D, Lt);
    g.beginPath(); g.ellipse(64, 54, 28, 24, 0, 0, 7); g.fill(); g.strokeStyle = D; g.stroke();
    g.fillStyle = C; g.beginPath(); g.moveTo(52, 33); g.lineTo(64, 20); g.lineTo(76, 33); g.closePath(); g.fill(); g.stroke();
    // 顔
    if (pose === 'settled') { arcEye(g, 53, 52, true); arcEye(g, 75, 52, true); hole(g, 64, 62, 4, 2.5); }
    else if (pose === 'stuck') {
      g.strokeStyle = '#1d0f0a'; g.lineWidth = 3; g.lineCap = 'round';
      g.beginPath(); g.moveTo(48, 48); g.lineTo(57, 52); g.lineTo(48, 56); g.stroke();
      g.beginPath(); g.moveTo(80, 48); g.lineTo(71, 52); g.lineTo(80, 56); g.stroke();
      hole(g, 64, 63, 5, 3);
    } else {
      var off = pose === 'a' ? -2 : 2;
      hole(g, 53 + off, 52, 4, 5); hole(g, 75 + off, 52, 4, 5); hole(g, 64, 63, 3, 2.2);
    }
    // ほっぺ
    g.fillStyle = 'rgba(235,120,120,0.75)';
    g.beginPath(); g.ellipse(44, 60, 6, 3.6, 0, 0, 7); g.fill();
    g.beginPath(); g.ellipse(84, 60, 6, 3.6, 0, 0, 7); g.fill();
    // ほおに当てた手
    if (pose !== 'settled') {
      var dy = pose === 'b' ? -3 : 0;
      tube(g, [36, 84, 22, 76, 36, 64 + dy], 9, C, D);
      tube(g, [92, 84, 106, 76, 92, 64 + dy], 9, C, D);
    } else {
      tube(g, [36, 84, 26, 94, 40, 102], 9, C, D);
      tube(g, [92, 84, 102, 94, 88, 102], 9, C, D);
    }
    g.fillStyle = 'rgba(20,40,60,0.35)'; g.beginPath(); g.arc(64, 96, 14, 0, 7); g.fill();
    drawMark(g, m, 64, 96, 8.5, PAL.cream, 4);
  }

  var spriteCache = {};
  function sprite(type, m, pose) {
    var k = type + m + pose, s = spriteCache[k];
    if (s) return s;
    var c = mk(), g = c.getContext('2d');
    if (type === 'r') drawRed(g, m, pose); else drawBlue(g, m, pose);
    speckle(c, 16, 500 + m);
    s = spriteCache[k] = { canvas: c, data: toData(c) };
    return s;
  }

  // 台座：床の石の輪と、その上に浮かぶ印
  function pedSprite(m, lit) {
    var k = 'ped' + m + (lit ? 'L' : ''), s = spriteCache[k];
    if (s) return s;
    var c = mk(), g = c.getContext('2d');
    g.fillStyle = '#2a221c'; g.beginPath(); g.ellipse(64, 116, 46, 10, 0, 0, 7); g.fill();
    g.fillStyle = lit ? '#b9a27a' : '#8b7a64'; g.beginPath(); g.ellipse(64, 113, 44, 9, 0, 0, 7); g.fill();
    g.fillStyle = lit ? '#6a5a3c' : '#3a2f26'; g.beginPath(); g.ellipse(64, 113, 33, 6, 0, 0, 7); g.fill();
    if (!lit) {
      // 印は低い位置に小さく（奥に立つハニワの顔を隠さない）
      var gr = g.createRadialGradient(64, 98, 2, 64, 98, 22);
      gr.addColorStop(0, 'rgba(255,225,150,0.55)'); gr.addColorStop(1, 'rgba(255,200,110,0)');
      g.fillStyle = gr; g.fillRect(40, 74, 48, 44);
      drawMark(g, m, 64, 97, 9.5, 'rgba(60,30,10,0.85)', 7.5);
      drawMark(g, m, 64, 97, 9.5, '#ffe6a6', 4);
    }
    s = spriteCache[k] = { canvas: c, data: toData(c) };
    return s;
  }
  function gemSprite() {
    var s = spriteCache.gem;
    if (s) return s;
    var c = mk(), g = c.getContext('2d');
    var gr = g.createRadialGradient(64, 66, 2, 64, 66, 34);
    gr.addColorStop(0, 'rgba(140,255,210,0.55)'); gr.addColorStop(1, 'rgba(90,230,180,0)');
    g.fillStyle = gr; g.fillRect(24, 26, 80, 80);
    g.lineCap = 'round'; g.strokeStyle = '#0d4a3a'; g.lineWidth = 19;
    g.beginPath(); g.arc(60, 68, 12, -1.2, 2.4); g.stroke();
    g.strokeStyle = '#3fd0a0'; g.lineWidth = 14;
    g.beginPath(); g.arc(60, 68, 12, -1.2, 2.4); g.stroke();
    g.strokeStyle = '#b8ffe2'; g.lineWidth = 4;
    g.beginPath(); g.arc(60, 68, 14, -0.9, 0.6); g.stroke();
    g.fillStyle = '#0d4a3a'; g.beginPath(); g.arc(66, 57, 3, 0, 7); g.fill();
    s = spriteCache.gem = { canvas: c, data: toData(c) };
    return s;
  }
  // 開いた出口：光のさす上り階段
  function stairSprite() {
    var s = spriteCache.stair;
    if (s) return s;
    var c = mk(), g = c.getContext('2d');
    // 石の枠
    g.fillStyle = '#3a2f27'; rr(g, 14, 2, 100, 126, 34); g.fill();
    g.fillStyle = '#6b5a49'; rr(g, 18, 6, 92, 122, 31); g.fill();
    g.fillStyle = PAL.gold; rr(g, 25, 12, 78, 116, 27); g.fill();
    var gr = g.createLinearGradient(0, 14, 0, 128);
    gr.addColorStop(0, '#fffbe8'); gr.addColorStop(0.55, '#ffe9b4'); gr.addColorStop(1, '#f3b866');
    g.fillStyle = gr; rr(g, 29, 16, 70, 112, 24); g.fill();
    // 上り階段
    for (var i = 0; i < 6; i++) {
      var w = 66 - i * 9, y = 116 - i * 13;
      g.fillStyle = 'rgba(172,112,48,' + (0.85 - i * 0.11) + ')'; g.fillRect(64 - w / 2, y, w, 5);
      g.fillStyle = 'rgba(255,246,214,' + (0.5 - i * 0.05) + ')'; g.fillRect(64 - w / 2, y + 5, w, 8);
    }
    s = spriteCache.stair = { canvas: c, data: toData(c) };
    return s;
  }

  function build() {
    var T = {
      TS: TS, PAL: PAL,
      walls: [wallPlain(1), wallPlain(2), wallBand(3), wallPlain(4), wallCircle(5), wallBand(6)].map(toData),
      door: [0, 1, 2].map(function (m) { return toData(doorTex(m)); }),
      exit: toData(exitTex()), mirror: toData(mirrorTex()),
      floor: toData(floorTex()), ceil: toData(ceilTex()),
      sprite: sprite, ped: pedSprite, gem: gemSprite, stair: stairSprite,
      mirrorActive: mirrorActive, drawMark: drawMark
    };
    return T;
  }
  window.HB_TEX = { build: build };
})();
