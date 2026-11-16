// LUMEN REEL — 描画の部品（配置の定数、部品アイコン、船、背景）
(function () {
  'use strict';
  const R = window.RD = {};
  R.W = 1280; R.H = 720;
  R.Y0 = 180; R.CELL = 96; R.RX0 = 92; R.RP = 98; R.CW = 94;
  R.SRCX = 62;
  R.cx = c => R.RX0 + c * R.RP + R.CW / 2;
  R.cy = r => R.Y0 + r * R.CELL + R.CELL / 2;
  R.winRight = n => R.RX0 + n * R.RP - 4;
  R.exitX = n => R.winRight(n) + 36;
  R.shipX = d => 566 + (d - 0.5) * 114;
  R.FONT = '"Zen Maru Gothic","Hiragino Maru Gothic ProN","BIZ UDPGothic","Yu Gothic UI","Meiryo",sans-serif';
  R.C = { brass: '#d2a24c', brassD: '#8a6426', glass: '#101a36', glassL: '#1b2a52', light: '#ffe6a0', gold: '#ffc94d', cream: '#f6ecd2', red: '#d9503f', ink: '#0a1024', teal: '#2a7f8f', good: '#8fe3a0', warn: '#ff6b5a' };

  const lerp = (a, b, t) => a + (b - a) * t;
  R.lerp = lerp;
  R.mix = function (c1, c2, t) {
    const p = c => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
    const a = p(c1), b = p(c2);
    return 'rgb(' + [0, 1, 2].map(i => Math.round(lerp(a[i], b[i], t))).join(',') + ')';
  };
  R.rr = function (g, x, y, w, h, r) {
    g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
  };
  R.text = function (g, str, x, y, size, color, align, weight, stroke) {
    g.font = (weight || '700') + ' ' + size + 'px ' + R.FONT;
    g.textAlign = align || 'center'; g.textBaseline = 'middle';
    if (stroke) { g.lineWidth = Math.max(3, size * 0.22); g.strokeStyle = stroke; g.lineJoin = 'round'; g.strokeText(str, x, y); }
    g.fillStyle = color || '#fff'; g.fillText(str, x, y);
  };
  // 折り返しつきの文章
  R.para = function (g, str, x, y, maxW, size, color, lh) {
    g.font = '500 ' + size + 'px ' + R.FONT; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = color;
    let line = '', yy = y;
    for (const ch of str) {
      // 行頭に句読点や閉じ括弧が来ないようにする
      if (ch === '\n' || (g.measureText(line + ch).width > maxW && '。、）」！？・'.indexOf(ch) < 0)) { g.fillText(line, x, yy); yy += lh || size * 1.45; line = ch === '\n' ? '' : ch; }
      else line += ch;
    }
    if (line) g.fillText(line, x, yy);
    return yy;
  };

  // ---------- 部品アイコン（中心 0,0、基準の大きさ s） ----------
  function badge(g, s, str, col) {
    const w = s * 0.42, h = s * 0.3, x = s * 0.5 - w - s * 0.04, y = s * 0.5 - h - s * 0.04;
    R.rr(g, x, y, w, h, h * 0.4); g.fillStyle = 'rgba(8,12,30,0.85)'; g.fill();
    R.text(g, str, x + w / 2, y + h / 2 + 1, s * 0.24, col || R.C.light, 'center', '800');
  }
  function flameShape(g, s, t) {
    const w = 1 + Math.sin(t * 7) * 0.04;
    g.beginPath(); g.moveTo(0, -s * 0.34 * w);
    g.bezierCurveTo(s * 0.26, -s * 0.08, s * 0.24, s * 0.26, 0, s * 0.28);
    g.bezierCurveTo(-s * 0.24, s * 0.26, -s * 0.22, -s * 0.02, -s * 0.06, -s * 0.12);
    g.bezierCurveTo(-s * 0.04, -s * 0.2, -s * 0.02, -s * 0.26, 0, -s * 0.34 * w); g.closePath();
  }
  const ICON = {
    blank(g, s) {
      g.strokeStyle = 'rgba(160,190,255,0.16)'; g.lineWidth = 2;
      g.beginPath(); g.arc(0, 0, s * 0.2, 0, 7); g.stroke();
      g.beginPath(); g.moveTo(-s * 0.3, 0); g.lineTo(s * 0.3, 0); g.stroke();
    },
    flame(g, s, cell, t) {
      g.save(); g.translate(-s * 0.06, -s * 0.03);
      const gr = g.createLinearGradient(0, -s * 0.34, 0, s * 0.28); gr.addColorStop(0, '#ffd75a'); gr.addColorStop(1, '#f2622a');
      g.shadowColor = '#ff9a3c'; g.shadowBlur = s * 0.18;
      flameShape(g, s, t); g.fillStyle = gr; g.fill(); g.shadowBlur = 0;
      g.save(); g.translate(0, s * 0.09); g.scale(0.5, 0.5); flameShape(g, s, t + 1); g.fillStyle = '#fff5c2'; g.fill(); g.restore();
      g.restore();
      badge(g, s, '+' + cell.lv);
    },
    ember(g, s, cell, t) {
      g.save(); g.translate(-s * 0.06, -s * 0.1);
      const k = 0.5 + Math.min(cell.n, 9) * 0.045;
      g.shadowColor = '#7dffb0'; g.shadowBlur = s * 0.16;
      g.save(); g.scale(k, k); flameShape(g, s, t);
      const gr = g.createLinearGradient(0, -s * 0.34, 0, s * 0.28); gr.addColorStop(0, '#d6ffa0'); gr.addColorStop(1, '#2fbf7a');
      g.fillStyle = gr; g.fill(); g.restore(); g.shadowBlur = 0;
      g.restore();
      // 火皿
      g.fillStyle = '#8a6426'; g.beginPath(); g.moveTo(-s * 0.3, s * 0.12); g.quadraticCurveTo(-s * 0.06, s * 0.42, s * 0.18, s * 0.12); g.closePath(); g.fill();
      g.fillStyle = '#d2a24c'; g.fillRect(-s * 0.32, s * 0.09, s * 0.52, s * 0.05);
      badge(g, s, '+' + cell.n, '#b8ffb0');
    },
    lens(g, s, cell) {
      g.save(); g.translate(-s * 0.05, -s * 0.04);
      const gr = g.createRadialGradient(-s * 0.08, -s * 0.1, s * 0.02, 0, 0, s * 0.3);
      gr.addColorStop(0, '#eaffff'); gr.addColorStop(0.5, '#7fd3f2'); gr.addColorStop(1, '#2a6fb5');
      g.beginPath(); g.ellipse(0, 0, s * 0.2, s * 0.3, 0, 0, 7); g.fillStyle = gr; g.fill();
      g.lineWidth = s * 0.035; g.strokeStyle = R.C.brass; g.stroke();
      g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = s * 0.025;
      g.beginPath(); g.ellipse(0, 0, s * 0.12, s * 0.21, 0, 3.5, 4.6); g.stroke();
      g.restore();
      badge(g, s, '×' + (cell.lv + 1), '#aee8ff');
    },
    mirror(g, s, up) {
      // 光が左から来て、斜めへ跳ね返る様子をそのまま描く
      const d = up ? -1 : 1;
      g.save(); g.scale(1, d); g.translate(0, -s * 0.1); g.lineCap = 'round'; g.lineJoin = 'round';
      // 鏡（跳ね返す板）
      g.save(); g.translate(0, -s * 0.06); g.rotate(0.39);
      g.fillStyle = '#5d6e8a'; R.rr(g, -s * 0.3, -s * 0.13, s * 0.6, s * 0.1, s * 0.04); g.fill();
      const gr = g.createLinearGradient(-s * 0.3, 0, s * 0.3, 0); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.5, '#a9c4e2'); gr.addColorStop(1, '#f4fbff');
      g.fillStyle = gr; R.rr(g, -s * 0.3, -s * 0.05, s * 0.6, s * 0.06, s * 0.03); g.fill();
      g.restore();
      // 光の道すじ
      g.strokeStyle = R.C.gold; g.fillStyle = R.C.gold; g.lineWidth = s * 0.055;
      g.beginPath(); g.moveTo(-s * 0.38, -s * 0.0 + s * 0.0); g.lineTo(-s * 0.02, 0); g.lineTo(s * 0.26, s * 0.28); g.stroke();
      g.save(); g.translate(s * 0.3, s * 0.32); g.rotate(Math.PI / 4);
      g.beginPath(); g.moveTo(s * 0.1, 0); g.lineTo(-s * 0.08, -s * 0.11); g.lineTo(-s * 0.08, s * 0.11); g.closePath(); g.fill(); g.restore();
      g.restore();
    },
    up(g, s) { ICON.mirror(g, s, true); },
    down(g, s) { ICON.mirror(g, s, false); },
    prism(g, s) {
      g.save(); g.translate(-s * 0.1, 0);
      const rays = [['#ff8f7a', -1], ['#ffe08a', 0], ['#86e0ff', 1]];
      g.lineCap = 'round'; g.lineWidth = s * 0.05;
      for (const [col, d] of rays) { g.strokeStyle = col; g.beginPath(); g.moveTo(s * 0.08, d * s * 0.05); g.lineTo(s * 0.5, d * s * 0.3); g.stroke(); }
      g.beginPath(); g.moveTo(0, -s * 0.3); g.lineTo(s * 0.26, s * 0.24); g.lineTo(-s * 0.26, s * 0.24); g.closePath();
      const gr = g.createLinearGradient(-s * 0.26, -s * 0.3, s * 0.26, s * 0.24); gr.addColorStop(0, '#f6fdff'); gr.addColorStop(0.5, '#b7c8f5'); gr.addColorStop(1, '#8a7fe0');
      g.fillStyle = gr; g.fill(); g.lineWidth = s * 0.03; g.strokeStyle = '#ffffff'; g.stroke();
      g.restore();
    },
  };
  R.gull = function (g, s, t) {
    g.save(); g.translate(0, s * 0.04 + Math.sin(t * 3) * s * 0.01);
    g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.ellipse(0, s * 0.3, s * 0.26, s * 0.06, 0, 0, 7); g.fill();
    g.fillStyle = '#f7f9ff'; g.beginPath(); g.ellipse(0, s * 0.08, s * 0.25, s * 0.19, 0, 0, 7); g.fill();
    g.beginPath(); g.arc(-s * 0.15, -s * 0.13, s * 0.13, 0, 7); g.fill();
    g.fillStyle = '#9aa7c0'; g.beginPath(); g.ellipse(s * 0.07, s * 0.08, s * 0.19, s * 0.12, -0.2, 0, 7); g.fill();
    g.fillStyle = '#f6a623'; g.beginPath(); g.moveTo(-s * 0.26, -s * 0.13); g.lineTo(-s * 0.42, -s * 0.09); g.lineTo(-s * 0.26, -s * 0.06); g.closePath(); g.fill();
    g.fillStyle = '#1a2038'; g.beginPath(); g.arc(-s * 0.18, -s * 0.16, s * 0.022, 0, 7); g.fill();
    g.restore();
  };
  // セルを描く（x,y は左上、size は一辺）
  R.cell = function (g, cell, x, y, size, t, o) {
    o = o || {};
    R.rr(g, x + 2, y + 2, size - 4, size - 4, size * 0.14);
    const gr = g.createLinearGradient(0, y, 0, y + size); gr.addColorStop(0, R.C.glassL); gr.addColorStop(1, R.C.glass);
    g.fillStyle = gr; g.fill();
    g.lineWidth = 2; g.strokeStyle = o.hl || 'rgba(210,162,76,0.55)'; g.stroke();
    g.save(); g.translate(x + size / 2, y + size / 2);
    (ICON[cell.t] || ICON.blank)(g, size, cell, t || 0);
    if (cell.gull && !o.noGull) R.gull(g, size, t || 0);
    g.restore();
    if (o.flash > 0) { R.rr(g, x + 2, y + 2, size - 4, size - 4, size * 0.14); g.fillStyle = 'rgba(255,240,190,' + (o.flash * 0.6) + ')'; g.fill(); }
  };
  R.icon = function (g, t, x, y, size, time) {
    g.save(); g.translate(x, y); ICON[t](g, size, { t: t, lv: 1, n: 1 }, time || 0); g.restore();
  };

  // ---------- 船 ----------
  function lantern(g, x, y, str, frac, col, danger, t) {
    const r = 19;
    if (danger) { g.strokeStyle = 'rgba(255,90,70,' + (0.55 + 0.45 * Math.sin(t * 10)) + ')'; g.lineWidth = 4; g.beginPath(); g.arc(x, y, r + 6, 0, 7); g.stroke(); }
    g.fillStyle = 'rgba(8,12,30,0.9)'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.25)'; g.lineWidth = 3; g.beginPath(); g.arc(x, y, r, 0, 7); g.stroke();
    if (frac > 0) { g.strokeStyle = col; g.lineWidth = 4; g.beginPath(); g.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac); g.stroke(); }
    R.text(g, str, x, y + 1, str.length > 2 ? 15 : 19, col, 'center', '800');
  }
  R.lantern = lantern;
  function hull(g, w, h, col, deck) {
    g.fillStyle = col; g.beginPath(); g.moveTo(-w / 2 - h * 0.5, -h); g.lineTo(w / 2, -h); g.lineTo(w / 2 - h * 0.3, 0); g.lineTo(-w / 2 + h * 0.2, 0); g.closePath(); g.fill();
    g.fillStyle = deck; g.fillRect(-w / 2 - h * 0.4, -h - 3, w + h * 0.35, 4);
  }
  // v: {type, need, thr, max, parts, danger, glow(0..1), will(導けそう)}
  R.ship = function (g, v, x, y, t, plain) {
    const bob = Math.sin(t * 2 + x * 0.05) * 2.5;
    g.save(); g.translate(x, y + bob + 18); g.rotate(Math.sin(t * 1.6 + x) * 0.03);
    const lit = v.type === 'fog' ? 0 : 1 - (v.need || 0) / (v.max || 1);
    if (v.glow > 0 || v.will) {
      g.save(); g.globalCompositeOperation = 'lighter';
      const a = Math.max(v.glow || 0, v.will ? 0.35 + 0.15 * Math.sin(t * 6) : 0);
      const gr = g.createRadialGradient(0, -10, 4, 0, -10, 70); gr.addColorStop(0, 'rgba(255,230,150,' + a + ')'); gr.addColorStop(1, 'rgba(255,230,150,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(0, -10, 70, 0, 7); g.fill(); g.restore();
    }
    if (v.type === 'boat') {
      hull(g, 54, 14, '#7a4a2a', '#c58a4e');
      g.fillStyle = '#5a3a22'; g.fillRect(2, -52, 3, 40);
      g.fillStyle = R.mix('#8d93a8', '#fff3cf', lit); g.beginPath(); g.moveTo(0, -50); g.lineTo(0, -16); g.lineTo(-26, -16); g.closePath(); g.fill();
    } else if (v.type === 'fast') {
      hull(g, 62, 10, '#2f4f7a', '#8fb7e6');
      g.fillStyle = '#28324d'; g.fillRect(6, -50, 3, 40);
      g.fillStyle = R.mix('#a26a66', '#ff8a70', lit); g.beginPath(); g.moveTo(5, -50); g.lineTo(5, -13); g.lineTo(-30, -13); g.closePath(); g.fill();
      g.fillStyle = '#fff3cf'; g.beginPath(); g.moveTo(5, -38); g.lineTo(5, -30); g.lineTo(-13, -30); g.lineTo(-7, -38); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 2; g.lineCap = 'round';
      for (let i = 0; i < 3; i++) { const o = ((t * 60 + i * 14) % 40); g.globalAlpha = 1 - o / 40; g.beginPath(); g.moveTo(40 + o, -4 - i * 9); g.lineTo(56 + o, -4 - i * 9); g.stroke(); }
      g.globalAlpha = 1;
    } else if (v.type === 'fog') {
      hull(g, 54, 14, '#4a5068', '#8088a0');
      g.fillStyle = '#3a4058'; g.fillRect(2, -50, 3, 38);
      g.fillStyle = '#9aa2ba'; g.beginPath(); g.moveTo(0, -48); g.lineTo(0, -16); g.lineTo(-24, -16); g.closePath(); g.fill();
      for (let i = 0; i < 6; i++) {
        const a = t * 0.7 + i * 1.05, px = Math.cos(a) * 34, py = -18 + Math.sin(a * 1.3) * 14;
        g.fillStyle = 'rgba(205,215,235,0.42)'; g.beginPath(); g.arc(px, py, 19 + Math.sin(a * 2) * 3, 0, 7); g.fill();
      }
    } else if (v.type === 'cargo') {
      hull(g, 84, 18, '#35506a', '#e0a94e');
      g.fillStyle = '#c96f3b'; g.fillRect(-30, -34, 18, 14); g.fillStyle = '#e0a94e'; g.fillRect(-10, -36, 18, 16); g.fillStyle = '#7fb069'; g.fillRect(-22, -48, 18, 13);
      g.fillStyle = '#f6ecd2'; g.fillRect(16, -38, 16, 18); g.fillStyle = '#d9503f'; g.fillRect(20, -52, 8, 14);
      g.fillStyle = R.mix('#555', '#ffe6a0', lit); g.fillRect(19, -33, 4, 4); g.fillRect(26, -33, 4, 4);
    }
    g.restore();
    if (plain) return;
    const danger = v.danger;
    if (v.type === 'fog') lantern(g, x, y - 46 + bob, '≥' + v.thr, 0, '#dfe8ff', danger, t);
    else if (v.type !== 'liner') lantern(g, x, y - 46 + bob, String(Math.ceil(v.shown != null ? v.shown : v.need)), lit, v.type === 'cargo' ? '#ffd18a' : R.C.light, danger, t);
  };
  R.liner = function (g, v, x, t, plain) {
    const y = R.cy(1), bob = Math.sin(t * 1.4) * 2;
    g.save(); g.translate(x + 60, y + bob);
    if (v.glow > 0) { g.save(); g.globalCompositeOperation = 'lighter'; const gr = g.createRadialGradient(0, 0, 10, 0, 0, 220); gr.addColorStop(0, 'rgba(255,230,150,' + v.glow + ')'); gr.addColorStop(1, 'rgba(255,230,150,0)'); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 220, 0, 7); g.fill(); g.restore(); }
    // 船体
    g.fillStyle = '#1d2a4a'; g.beginPath(); g.moveTo(-150, 40); g.lineTo(130, 40); g.lineTo(112, 110); g.lineTo(-104, 110); g.closePath(); g.fill();
    g.fillStyle = '#d9503f'; g.beginPath(); g.moveTo(-110, 96); g.lineTo(116, 96); g.lineTo(112, 110); g.lineTo(-104, 110); g.closePath(); g.fill();
    g.fillStyle = '#f6ecd2'; g.fillRect(-96, -20, 200, 60); g.fillRect(-70, -70, 150, 50);
    const total = v.max * 3, left = v.parts[0] + v.parts[1] + v.parts[2], lit = 1 - left / total;
    for (let j = 0; j < 2; j++) for (let i = 0; i < 8; i++) {
      const on = (i + j * 8) / 16 < lit;
      g.fillStyle = on ? '#ffd86b' : '#51607f'; g.fillRect(-84 + i * 23 + (j ? 16 : 0), j ? -56 : -6, 12, j ? 22 : 30);
    }
    g.fillStyle = '#d9503f'; g.fillRect(-36, -116, 30, 46); g.fillRect(22, -116, 30, 46);
    g.fillStyle = '#1d2a4a'; g.fillRect(-36, -116, 30, 10); g.fillRect(22, -116, 30, 10);
    g.restore();
    if (plain) return;
    for (let l = 0; l < 3; l++) {
      const done = v.parts[l] <= 0;
      lantern(g, x - 60, R.cy(l) + bob, done ? '✓' : String(Math.ceil(v.shownParts ? v.shownParts[l] : v.parts[l])), 1 - v.parts[l] / v.max, done ? R.C.good : R.C.light, v.danger && !done, t);
    }
  };

  // ---------- 背景 ----------
  const STARS = [];
  (function () { let s = 7; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647; for (let i = 0; i < 90; i++) STARS.push([rnd() * 1280, rnd() * 170, rnd() * 1.6 + 0.4, rnd() * 6]); })();
  const SKY = [
    ['#0a1030', '#1c2f66', '#0e3a5c', '#081a38'],
    ['#0b1232', '#213a70', '#0f4460', '#07203c'],
    ['#161d36', '#3a4868', '#2a4a5c', '#101f33'],
    ['#0d1238', '#2b2f70', '#143d63', '#081a3a'],
    ['#07091c', '#1a1f44', '#0c2a44', '#050f24'],
  ];
  const DAWN = ['#3a2a60', '#ff9a6b', '#3a7f96', '#1c4a6e'];
  // night: 1..5、dawn: 0..1（夜明けの進み具合）
  R.background = function (g, night, t, dawn) {
    const p = SKY[Math.max(0, Math.min(4, night - 1))];
    const c = i => dawn > 0 ? R.mix(p[i], DAWN[i], dawn) : p[i];
    let gr = g.createLinearGradient(0, 0, 0, 178); gr.addColorStop(0, c(0)); gr.addColorStop(1, c(1));
    g.fillStyle = gr; g.fillRect(0, 0, 1280, 178);
    // 星と月
    for (const s of STARS) {
      const a = (0.45 + 0.4 * Math.sin(t * 1.3 + s[3])) * (1 - dawn) * (night === 5 ? 0.25 : night === 3 ? 0.5 : 1);
      g.fillStyle = 'rgba(255,250,225,' + a + ')'; g.fillRect(s[0], s[1], s[2], s[2]);
    }
    if (dawn > 0) {
      const sy = 190 - dawn * 70;
      const sg = g.createRadialGradient(1010, sy, 10, 1010, sy, 260); sg.addColorStop(0, 'rgba(255,240,190,' + dawn + ')'); sg.addColorStop(0.25, 'rgba(255,190,120,' + dawn * 0.5 + ')'); sg.addColorStop(1, 'rgba(255,170,110,0)');
      g.fillStyle = sg; g.fillRect(700, 0, 580, 178);
      g.fillStyle = 'rgba(255,246,214,' + dawn + ')'; g.beginPath(); g.arc(1010, sy, 42, 0, 7); g.fill();
    } else if (night !== 5) {
      g.fillStyle = 'rgba(255,246,214,0.9)'; g.beginPath(); g.arc(1120, 104, 26, 0, 7); g.fill();
      g.fillStyle = c(0); g.globalAlpha = 0.92; g.beginPath(); g.arc(1108, 96, 23, 0, 7); g.fill(); g.globalAlpha = 1;
    }
    // 雲（風の夜・嵐の夜）
    if (night >= 4 && dawn < 1) {
      g.fillStyle = night === 5 ? 'rgba(40,46,80,0.75)' : 'rgba(90,100,150,0.3)';
      for (let i = 0; i < 6; i++) {
        const x = ((i * 290 - t * (night === 5 ? 34 : 20)) % 1600 + 1600) % 1600 - 160, y = 78 + (i % 3) * 30;
        g.globalAlpha = 1 - dawn;
        g.beginPath(); g.ellipse(x, y, 150, 22, 0, 0, 7); g.ellipse(x + 70, y - 14, 90, 20, 0, 0, 7); g.fill();
      }
      g.globalAlpha = 1;
    }
    // 海
    gr = g.createLinearGradient(0, 178, 0, 720); gr.addColorStop(0, c(2)); gr.addColorStop(1, c(3));
    g.fillStyle = gr; g.fillRect(0, 178, 1280, 542);
    g.fillStyle = 'rgba(255,255,255,0.035)'; g.fillRect(540, R.Y0 + R.CELL, 740, R.CELL);
    // 波
    g.lineWidth = 2;
    const amp = night === 5 ? 5 : night === 4 ? 4 : 2.5;
    for (let y = 196; y < 720; y += 26) {
      g.strokeStyle = 'rgba(190,230,255,' + (0.05 + 0.05 * Math.sin(y)) + ')';
      g.beginPath();
      for (let x = 480; x <= 1290; x += 30) {
        const yy = y + Math.sin(x * 0.02 + t * 1.2 + y * 0.3) * amp;
        if (x === 480) g.moveTo(x, yy); else g.lineTo(x, yy);
      }
      g.stroke();
    }
    // 海路の境の浮き
    for (let k = 1; k <= 2; k++) for (let x = 640; x < 1280; x += 114) {
      const yy = R.Y0 + k * R.CELL + Math.sin(t * 2 + x) * 2;
      g.fillStyle = 'rgba(255,255,255,0.22)'; g.beginPath(); g.arc(x, yy, 3, 0, 7); g.fill();
    }
  };
  R.weather = function (g, night, t, dawn) {
    if (dawn >= 1) return;
    if (night === 3) {
      for (let i = 0; i < 5; i++) {
        const x = ((i * 330 + t * 14) % 1700) - 200, y = 210 + i * 62;
        const gr = g.createRadialGradient(x, y, 10, x, y, 230); gr.addColorStop(0, 'rgba(200,210,230,' + 0.13 * (1 - dawn) + ')'); gr.addColorStop(1, 'rgba(200,210,230,0)');
        g.fillStyle = gr; g.fillRect(x - 230, y - 120, 460, 240);
      }
    }
    if (night === 5) {
      g.strokeStyle = 'rgba(190,210,255,' + 0.22 * (1 - dawn) + ')'; g.lineWidth = 1.5; g.beginPath();
      for (let i = 0; i < 70; i++) {
        const x = ((i * 97 - t * 420) % 1400 + 1400) % 1400 - 60, y = ((i * 53 + t * 900) % 760);
        g.moveTo(x, y); g.lineTo(x - 9, y + 24);
      }
      g.stroke();
    }
  };
  // 岩礁（ここまで来ると難破する）
  R.reef = function (g, t) {
    for (let l = 0; l < 3; l++) {
      const y = R.cy(l) + 22;
      g.save(); g.translate(24, 0);
      g.fillStyle = 'rgba(255,255,255,' + (0.18 + 0.1 * Math.sin(t * 3 + l)) + ')'; g.beginPath(); g.ellipse(548, y + 8, 30, 7, 0, 0, 7); g.fill();
      g.fillStyle = '#232a44'; g.beginPath(); g.moveTo(524, y + 8); g.lineTo(534, y - 16); g.lineTo(546, y - 4); g.lineTo(556, y - 22); g.lineTo(572, y + 8); g.closePath(); g.fill();
      g.fillStyle = '#39425f'; g.beginPath(); g.moveTo(534, y - 16); g.lineTo(546, y - 4); g.lineTo(540, y + 8); g.lineTo(528, y + 8); g.closePath(); g.fill();
      g.restore();
    }
  };
  // 灯台（灯室の枠・屋根・塔）。n はリール本数。
  R.lighthouse = function (g, n, t) {
    const x0 = R.RX0 - 16, x1 = R.winRight(n) + 16, yT = R.Y0 - 46, yB = R.Y0 + 3 * R.CELL + 46, mid = (x0 + x1) / 2;
    // 塔
    g.save();
    g.beginPath(); g.moveTo(mid - 118, 606); g.lineTo(mid + 118, 606); g.lineTo(mid + 150, 730); g.lineTo(mid - 150, 730); g.closePath(); g.clip();
    g.fillStyle = R.C.cream; g.fillRect(mid - 160, 600, 320, 130);
    g.fillStyle = R.C.red; g.fillRect(mid - 160, 640, 320, 34);
    g.fillStyle = 'rgba(0,0,30,0.22)'; g.fillRect(mid + 40, 600, 120, 130);
    g.restore();
    g.fillStyle = '#1b2440'; R.rr(g, mid - 16, 678, 32, 50, 14); g.fill();
    // 岩
    g.fillStyle = '#1c2238'; g.beginPath(); g.moveTo(0, 720); g.lineTo(0, 690); g.lineTo(60, 672); g.lineTo(mid - 150, 700); g.lineTo(mid + 150, 704); g.lineTo(mid + 230, 688); g.lineTo(mid + 290, 720); g.closePath(); g.fill();
    // 操作盤のデッキ
    R.rr(g, x0 - 12, yB - 4, x1 - x0 + 24, 108, 10); g.fillStyle = '#2a2238'; g.fill(); g.strokeStyle = R.C.brassD; g.lineWidth = 3; g.stroke();
    // 屋根
    g.fillStyle = R.C.red; g.beginPath(); g.moveTo(x0 - 14, yT - 36); g.quadraticCurveTo(mid, yT - 110, x1 + 14, yT - 36); g.closePath(); g.fill();
    g.fillStyle = 'rgba(0,0,30,0.2)'; g.beginPath(); g.moveTo(mid, yT - 73); g.quadraticCurveTo(mid + (x1 - mid) * 0.6, yT - 66, x1 + 14, yT - 36); g.lineTo(mid, yT - 36); g.closePath(); g.fill();
    g.fillStyle = R.C.brass; g.fillRect(mid - 3, yT - 96, 6, 26); g.beginPath(); g.arc(mid, yT - 98, 7, 0, 7); g.fill();
    R.rr(g, x0 - 18, yT - 38, x1 - x0 + 36, 40, 8); g.fillStyle = '#3a2f46'; g.fill(); g.strokeStyle = R.C.brassD; g.lineWidth = 3; g.stroke();
    // 灯室
    R.rr(g, x0 - 44, yT, x1 - x0 + 44, yB - yT, 12); g.fillStyle = '#080d20'; g.fill();
    g.lineWidth = 5; g.strokeStyle = R.C.brass; g.stroke();
    // 光源
    const sx = R.SRCX - 20;
    for (let r = 0; r < 3; r++) {
      const y = R.cy(r), fl = 0.8 + 0.2 * Math.sin(t * 9 + r * 2);
      g.save(); g.globalCompositeOperation = 'lighter';
      const gr = g.createRadialGradient(sx, y, 2, sx, y, 34); gr.addColorStop(0, 'rgba(255,236,170,' + fl + ')'); gr.addColorStop(1, 'rgba(255,200,90,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(sx, y, 34, 0, 7); g.fill(); g.restore();
      g.fillStyle = R.C.brassD; g.fillRect(sx - 12, y + 14, 24, 8);
      g.fillStyle = '#fff6cf'; g.beginPath(); g.ellipse(sx, y, 8, 12, 0, 0, 7); g.fill();
    }
  };
  // 光の線
  R.beamLine = function (g, x1, y1, x2, y2, p, alpha, dashed) {
    const w = Math.min(18, 2 + 2.4 * Math.log2(1 + p));
    g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
    if (dashed) { g.setLineDash([7, 7]); g.lineWidth = Math.max(3, w * 0.5); g.strokeStyle = 'rgba(255,225,150,' + alpha + ')'; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); g.restore(); return; }
    g.strokeStyle = 'rgba(255,190,80,' + alpha * 0.35 + ')'; g.lineWidth = w * 2.6; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
    g.strokeStyle = 'rgba(255,225,150,' + alpha * 0.8 + ')'; g.lineWidth = w; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
    g.strokeStyle = 'rgba(255,255,240,' + alpha + ')'; g.lineWidth = Math.max(1.5, w * 0.4); g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
    g.restore();
  };
  // 小さな絵記号
  R.coin = function (g, x, y, r) {
    g.fillStyle = '#e9b949'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
    g.strokeStyle = '#a8761e'; g.lineWidth = 2; g.stroke();
    g.fillStyle = '#fff1b8'; g.beginPath(); g.arc(x - r * 0.25, y - r * 0.25, r * 0.3, 0, 7); g.fill();
  };
  R.star = function (g, x, y, r, col) {
    g.fillStyle = col || '#fff3a8'; g.beginPath();
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 - Math.PI / 2, rr = i % 2 ? r * 0.38 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    g.closePath(); g.fill();
  };
  R.heart = function (g, x, y, s, on) {
    g.fillStyle = on ? '#ff7a6b' : 'rgba(255,255,255,0.16)';
    g.beginPath(); g.moveTo(x, y + s * 0.35); g.bezierCurveTo(x - s * 0.6, y - s * 0.1, x - s * 0.3, y - s * 0.55, x, y - s * 0.2);
    g.bezierCurveTo(x + s * 0.3, y - s * 0.55, x + s * 0.6, y - s * 0.1, x, y + s * 0.35); g.fill();
  };
  R.spring = function (g, x, y, r, on, frac) {
    g.strokeStyle = on ? R.C.gold : 'rgba(255,255,255,0.18)'; g.lineWidth = 3; g.lineCap = 'round';
    g.beginPath();
    for (let a = 0; a < Math.PI * 3.6 * (frac || 1); a += 0.3) { const rr = r * (0.2 + 0.8 * a / (Math.PI * 3.6)); const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr; if (a === 0) g.moveTo(px, py); else g.lineTo(px, py); }
    g.stroke();
  };
})();
