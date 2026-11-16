// REEL DELVE ― 絵柄と冒険者の描画（すべて Canvas のベクター描画）
(function () {
  'use strict';
  var TAU = Math.PI * 2;
  var COL = {
    bg: '#0f1018', stone: '#262a40', stoneHi: '#343a58', stoneLo: '#191c2c',
    lit: '#6a5a44', litHi: '#84705a', litLo: '#4b3f30',
    brass: '#c9a24a', brassHi: '#f0d488', brassLo: '#7d6226',
    gold: '#ffd35a', goldHi: '#fff3b8', goldLo: '#c48a1e',
    K: '#e8594d', T: '#58c77c', M: '#5ea8f5',
    mon: '#a65bd6', monLo: '#6d3597', steel: '#c3ccd9', steelLo: '#6c7688',
    cry: '#6fe9f4', cryLo: '#2b95b5', pot: '#ff6f91', wood: '#9a6534', woodLo: '#62401f',
    text: '#f3ead6', dim: '#9aa0b8', bad: '#ff5a5a', mana: '#7fe3ff'
  };

  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  // ---- 絵柄 ----
  // cx, cy を中心に、高さおよそ s の絵を描く。t は時間（ゆらぎ用）。
  function coin(ctx, cx, cy, s, t) {
    var w = Math.abs(Math.cos(t * 1.6)) * 0.25 + 0.75;
    var r = s * 0.36;
    ctx.fillStyle = COL.goldLo; ctx.beginPath(); ctx.ellipse(cx, cy + 2, r * w, r, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = COL.gold; ctx.beginPath(); ctx.ellipse(cx, cy, r * w, r, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = COL.goldLo; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(cx, cy, r * w * 0.66, r * 0.66, 0, 0, TAU); ctx.stroke();
    ctx.fillStyle = COL.goldHi; ctx.beginPath(); ctx.ellipse(cx - r * 0.3 * w, cy - r * 0.35, r * 0.16 * w, r * 0.26, -0.5, 0, TAU); ctx.fill();
  }
  function monster(ctx, cx, cy, s, t) {
    var b = Math.sin(t * 3) * 0.04;
    var r = s * 0.36;
    ctx.save(); ctx.translate(cx, cy + s * 0.05); ctx.scale(1 + b, 1 - b);
    // つの
    ctx.fillStyle = '#e9dcc3';
    ctx.beginPath(); ctx.moveTo(-r * 0.75, -r * 0.5); ctx.lineTo(-r * 0.95, -r * 1.25); ctx.lineTo(-r * 0.3, -r * 0.8); ctx.fill();
    ctx.beginPath(); ctx.moveTo(r * 0.75, -r * 0.5); ctx.lineTo(r * 0.95, -r * 1.25); ctx.lineTo(r * 0.3, -r * 0.8); ctx.fill();
    // からだ
    ctx.fillStyle = COL.monLo; ctx.beginPath(); ctx.ellipse(0, 3, r * 1.05, r * 0.95, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = COL.mon; ctx.beginPath(); ctx.ellipse(0, 0, r * 1.05, r * 0.95, 0, 0, TAU); ctx.fill();
    // 目
    var blink = (t % 3.7) < 0.12 ? 0.15 : 1;
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.ellipse(-r * 0.38, -r * 0.12, r * 0.24, r * 0.28 * blink, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(r * 0.38, -r * 0.12, r * 0.24, r * 0.28 * blink, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#2a1038';
    ctx.beginPath(); ctx.arc(-r * 0.44, -r * 0.1, r * 0.11 * blink, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(r * 0.32, -r * 0.1, r * 0.11 * blink, 0, TAU); ctx.fill();
    // きば
    ctx.fillStyle = '#2a1038'; ctx.beginPath(); ctx.ellipse(0, r * 0.42, r * 0.42, r * 0.16, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.moveTo(-r * 0.28, r * 0.32); ctx.lineTo(-r * 0.16, r * 0.56); ctx.lineTo(-r * 0.04, r * 0.32); ctx.fill();
    ctx.beginPath(); ctx.moveTo(r * 0.28, r * 0.32); ctx.lineTo(r * 0.16, r * 0.56); ctx.lineTo(r * 0.04, r * 0.32); ctx.fill();
    ctx.restore();
  }
  function trap(ctx, cx, cy, s) {
    var w = s * 0.8, base = cy + s * 0.3;
    ctx.fillStyle = '#3a2a2a'; rr(ctx, cx - w / 2, base - 4, w, 9, 3); ctx.fill();
    for (var i = 0; i < 4; i++) {
      var x = cx - w / 2 + w * (i + 0.5) / 4;
      var h = s * (i % 2 ? 0.52 : 0.62);
      ctx.fillStyle = COL.steelLo; ctx.beginPath(); ctx.moveTo(x - w / 8, base); ctx.lineTo(x, base - h); ctx.lineTo(x + w / 8, base); ctx.fill();
      ctx.fillStyle = COL.steel; ctx.beginPath(); ctx.moveTo(x - w / 8, base); ctx.lineTo(x, base - h); ctx.lineTo(x - w / 40, base); ctx.fill();
      ctx.fillStyle = COL.bad; ctx.beginPath(); ctx.moveTo(x - w / 30, base - h * 0.78); ctx.lineTo(x, base - h); ctx.lineTo(x + w / 30, base - h * 0.78); ctx.fill();
    }
  }
  function chest(ctx, cx, cy, s, t, open) {
    var w = s * 0.78, h = s * 0.56, x = cx - w / 2, y = cy - h / 2 + s * 0.06;
    ctx.fillStyle = COL.woodLo; rr(ctx, x, y + h * 0.4, w, h * 0.62, 4); ctx.fill();
    ctx.fillStyle = COL.wood; rr(ctx, x, y + h * 0.4, w, h * 0.5, 4); ctx.fill();
    ctx.fillStyle = open ? '#3a2410' : COL.wood;
    ctx.beginPath(); ctx.moveTo(x, y + h * 0.42); ctx.quadraticCurveTo(cx, y - h * (open ? 0.5 : 0.22), x + w, y + h * 0.42); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = COL.brass; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x + 1, y + h * 0.42); ctx.lineTo(x + w - 1, y + h * 0.42); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + w * 0.2, y + h * 0.16); ctx.lineTo(x + w * 0.2, y + h); ctx.moveTo(x + w * 0.8, y + h * 0.16); ctx.lineTo(x + w * 0.8, y + h); ctx.stroke();
    ctx.fillStyle = COL.brassHi; rr(ctx, cx - 5, y + h * 0.34, 10, 12, 2); ctx.fill();
    ctx.fillStyle = COL.woodLo; ctx.beginPath(); ctx.arc(cx, y + h * 0.34 + 5, 2, 0, TAU); ctx.fill();
    var g = 0.5 + 0.5 * Math.sin(t * 2.2);
    ctx.fillStyle = 'rgba(255,240,170,' + (0.5 * g) + ')';
    ctx.beginPath(); ctx.arc(x + w * 0.86, y + h * 0.1, 2.4 + g * 1.5, 0, TAU); ctx.fill();
  }
  function crystal(ctx, cx, cy, s, t) {
    var h = s * 0.42, w = s * 0.24, fl = Math.sin(t * 1.8) * 2;
    var g = ctx.createRadialGradient(cx, cy + fl, 2, cx, cy + fl, s * 0.5);
    g.addColorStop(0, 'rgba(111,233,244,0.45)'); g.addColorStop(1, 'rgba(111,233,244,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy + fl, s * 0.5, 0, TAU); ctx.fill();
    ctx.save(); ctx.translate(cx, cy + fl);
    ctx.fillStyle = COL.cryLo; ctx.beginPath(); ctx.moveTo(0, -h); ctx.lineTo(w, -h * 0.25); ctx.lineTo(w, h * 0.3); ctx.lineTo(0, h); ctx.lineTo(-w, h * 0.3); ctx.lineTo(-w, -h * 0.25); ctx.closePath(); ctx.fill();
    ctx.fillStyle = COL.cry; ctx.beginPath(); ctx.moveTo(0, -h); ctx.lineTo(0, h); ctx.lineTo(-w, h * 0.3); ctx.lineTo(-w, -h * 0.25); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e8fdff'; ctx.beginPath(); ctx.moveTo(0, -h); ctx.lineTo(-w * 0.2, -h * 0.2); ctx.lineTo(-w * 0.75, -h * 0.2); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  function potion(ctx, cx, cy, s, t) {
    var r = s * 0.25, y = cy + s * 0.1;
    ctx.fillStyle = '#d9e4ee'; rr(ctx, cx - r * 0.36, y - r * 1.75, r * 0.72, r * 0.9, 2); ctx.fill();
    ctx.fillStyle = COL.wood; rr(ctx, cx - r * 0.46, y - r * 2.0, r * 0.92, r * 0.34, 2); ctx.fill();
    ctx.fillStyle = 'rgba(217,228,238,0.9)'; ctx.beginPath(); ctx.arc(cx, y, r, 0, TAU); ctx.fill();
    ctx.fillStyle = COL.pot; ctx.beginPath(); ctx.arc(cx, y, r * 0.84, -0.15, Math.PI + 0.15); ctx.fill();
    // ハート
    ctx.fillStyle = '#fff'; var hs = r * 0.36, hy = y + r * 0.22 + Math.sin(t * 2.5) * 1;
    ctx.beginPath(); ctx.moveTo(cx, hy + hs); ctx.bezierCurveTo(cx - hs * 1.6, hy - hs * 0.2, cx - hs * 0.6, hy - hs * 1.2, cx, hy - hs * 0.3);
    ctx.bezierCurveTo(cx + hs * 0.6, hy - hs * 1.2, cx + hs * 1.6, hy - hs * 0.2, cx, hy + hs); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.ellipse(cx - r * 0.45, y - r * 0.4, r * 0.14, r * 0.26, 0.6, 0, TAU); ctx.fill();
  }
  function stairs(ctx, cx, cy, s, up, t) {
    var w = s * 0.8, h = s * 0.62, x = cx - w / 2, y = cy + h / 2;
    var n = 4, sw = w / n, sh = h / n;
    for (var i = 0; i < n; i++) {
      var k = up ? i : n - 1 - i;
      ctx.fillStyle = i % 2 ? '#a99b84' : '#c2b49b';
      ctx.fillRect(x + i * sw, y - (k + 1) * sh, sw + 0.5, (k + 1) * sh);
      ctx.fillStyle = '#e6dcc6'; ctx.fillRect(x + i * sw, y - (k + 1) * sh, sw + 0.5, 3);
    }
    // 矢印
    var ay = cy + (up ? -1 : 1) * (s * 0.02) + Math.sin(t * 4) * (up ? -2 : 2);
    var ax = cx + (up ? -w * 0.22 : w * 0.22);
    ctx.fillStyle = up ? '#ffe28a' : '#9fd0ff';
    ctx.strokeStyle = '#1a1420'; ctx.lineWidth = 2.5;
    var d = up ? -1 : 1, as = s * 0.2;
    ctx.beginPath();
    ctx.moveTo(ax, ay + d * as); ctx.lineTo(ax - as * 0.85, ay); ctx.lineTo(ax - as * 0.35, ay);
    ctx.lineTo(ax - as * 0.35, ay - d * as * 0.9); ctx.lineTo(ax + as * 0.35, ay - d * as * 0.9);
    ctx.lineTo(ax + as * 0.35, ay); ctx.lineTo(ax + as * 0.85, ay); ctx.closePath();
    ctx.stroke(); ctx.fill();
  }

  function icon(ctx, tile, cx, cy, s, t) {
    switch (tile) {
      case 'c': coin(ctx, cx, cy, s, t); break;
      case 'm': monster(ctx, cx, cy, s, t); break;
      case 't': trap(ctx, cx, cy, s); break;
      case 'x': chest(ctx, cx, cy, s, t, false); break;
      case 'y': crystal(ctx, cx, cy, s, t); break;
      case 'p': potion(ctx, cx, cy, s, t); break;
      case 'u': stairs(ctx, cx, cy, s, true, t); break;
      case 'd': stairs(ctx, cx, cy, s, false, t); break;
    }
  }

  // 石の板（lit: 窓の中の明るい板）
  function slab(ctx, x, y, w, h, lit, seed) {
    var a = lit ? COL.lit : COL.stone, hi = lit ? COL.litHi : COL.stoneHi, lo = lit ? COL.litLo : COL.stoneLo;
    ctx.fillStyle = lo; rr(ctx, x + 2, y + 2, w - 4, h - 3, 7); ctx.fill();
    ctx.fillStyle = a; rr(ctx, x + 2, y + 2, w - 4, h - 6, 7); ctx.fill();
    ctx.fillStyle = hi; rr(ctx, x + 5, y + 4, w - 10, 3, 1.5); ctx.fill();
    // 石の欠け・ひび（位置は絵柄の番地で決める）
    var s1 = (seed * 37) % 17, s2 = (seed * 53) % 23;
    ctx.fillStyle = lo;
    ctx.fillRect(x + 10 + s1 * 3, y + h - 16, 9, 2);
    ctx.fillRect(x + w - 26 - s2, y + 13 + (s1 % 5), 6, 2);
  }

  // ---- 冒険者 ----
  // (x, y) は足元の中心。s は身長。walk は歩きの位相、mood: 0 通常 / 1 喜び / 2 痛い
  function hero(ctx, id, x, y, s, walk, mood, t) {
    var bob = Math.abs(Math.sin(walk)) * s * 0.06;
    var leg = Math.sin(walk) * s * 0.12;
    var col = COL[id];
    ctx.save(); ctx.translate(x, y - bob);
    if (mood === 2) ctx.rotate(Math.sin(t * 40) * 0.08);
    if (mood === 1) ctx.translate(0, -Math.abs(Math.sin(t * 10)) * s * 0.12);
    // 影
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(0, bob + 1, s * 0.3, s * 0.07, 0, 0, TAU); ctx.fill();
    // 足
    ctx.fillStyle = '#2b2233';
    rr(ctx, -s * 0.16 + leg * 0.5, -s * 0.16, s * 0.13, s * 0.17, 3); ctx.fill();
    rr(ctx, s * 0.04 - leg * 0.5, -s * 0.16, s * 0.13, s * 0.17, 3); ctx.fill();
    // からだ
    if (id === 'M') {
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(-s * 0.26, -s * 0.06); ctx.lineTo(-s * 0.16, -s * 0.55); ctx.lineTo(s * 0.16, -s * 0.55); ctx.lineTo(s * 0.26, -s * 0.06); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffe28a'; ctx.fillRect(-s * 0.25, -s * 0.13, s * 0.5, s * 0.04);
    } else {
      ctx.fillStyle = col; rr(ctx, -s * 0.2, -s * 0.52, s * 0.4, s * 0.42, 6); ctx.fill();
      ctx.fillStyle = '#3a2a22'; ctx.fillRect(-s * 0.2, -s * 0.26, s * 0.4, s * 0.05);
      ctx.fillStyle = COL.brassHi; ctx.fillRect(-s * 0.03, -s * 0.27, s * 0.07, s * 0.07);
    }
    // 顔
    ctx.fillStyle = '#f6d3ae'; ctx.beginPath(); ctx.arc(0, -s * 0.66, s * 0.19, 0, TAU); ctx.fill();
    ctx.fillStyle = '#2a1e2e';
    if (mood === 2) {
      ctx.lineWidth = 2; ctx.strokeStyle = '#2a1e2e';
      ctx.beginPath(); ctx.moveTo(s * 0.0, -s * 0.71); ctx.lineTo(s * 0.07, -s * 0.65); ctx.moveTo(s * 0.07, -s * 0.71); ctx.lineTo(s * 0.0, -s * 0.65); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.arc(s * 0.02, -s * 0.67, s * 0.028, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(s * 0.12, -s * 0.67, s * 0.028, 0, TAU); ctx.fill();
    }
    if (mood === 1) { ctx.strokeStyle = '#2a1e2e'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(s * 0.07, -s * 0.61, s * 0.05, 0.1, Math.PI - 0.1); ctx.stroke(); }
    // かぶりもの・持ち物
    if (id === 'K') {
      ctx.fillStyle = COL.steel; ctx.beginPath(); ctx.arc(0, -s * 0.7, s * 0.2, Math.PI, 0); ctx.lineTo(s * 0.2, -s * 0.64); ctx.lineTo(-s * 0.2, -s * 0.64); ctx.closePath(); ctx.fill();
      ctx.fillStyle = COL.steelLo; ctx.fillRect(-s * 0.2, -s * 0.7, s * 0.4, s * 0.035);
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(-s * 0.02, -s * 0.9); ctx.quadraticCurveTo(-s * 0.26, -s * 1.06, -s * 0.22, -s * 0.8); ctx.quadraticCurveTo(-s * 0.1, -s * 0.9, -s * 0.02, -s * 0.9); ctx.fill();
      // 剣
      ctx.save(); ctx.translate(s * 0.25, -s * 0.36); ctx.rotate(-0.5 + Math.sin(walk) * 0.12);
      ctx.fillStyle = '#e8eef6'; ctx.beginPath(); ctx.moveTo(-s * 0.03, 0); ctx.lineTo(-s * 0.03, -s * 0.36); ctx.lineTo(0, -s * 0.43); ctx.lineTo(s * 0.03, -s * 0.36); ctx.lineTo(s * 0.03, 0); ctx.fill();
      ctx.fillStyle = COL.brass; ctx.fillRect(-s * 0.08, -s * 0.01, s * 0.16, s * 0.04); ctx.fillRect(-s * 0.02, 0, s * 0.04, s * 0.1);
      ctx.restore();
      // 盾
      ctx.fillStyle = COL.steelLo; ctx.beginPath(); ctx.moveTo(-s * 0.3, -s * 0.48); ctx.lineTo(-s * 0.08, -s * 0.48); ctx.lineTo(-s * 0.08, -s * 0.3); ctx.quadraticCurveTo(-s * 0.19, -s * 0.16, -s * 0.3, -s * 0.3); ctx.closePath(); ctx.fill();
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(-s * 0.19, -s * 0.36, s * 0.05, 0, TAU); ctx.fill();
    } else if (id === 'T') {
      ctx.fillStyle = '#2f7a4a'; ctx.beginPath(); ctx.arc(-s * 0.02, -s * 0.68, s * 0.22, Math.PI * 0.75, Math.PI * 2.05); ctx.lineTo(-s * 0.02, -s * 0.5); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-s * 0.2, -s * 0.76); ctx.lineTo(-s * 0.36, -s * 0.62); ctx.lineTo(-s * 0.16, -s * 0.6); ctx.fill();
      ctx.fillStyle = '#f6d3ae'; ctx.beginPath(); ctx.arc(s * 0.03, -s * 0.65, s * 0.15, 0, TAU); ctx.fill();
      ctx.fillStyle = '#2a1e2e';
      if (mood !== 2) { ctx.beginPath(); ctx.arc(s * 0.03, -s * 0.67, s * 0.028, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(s * 0.12, -s * 0.67, s * 0.028, 0, TAU); ctx.fill(); }
      // ふくろ
      ctx.fillStyle = '#c9a87a'; ctx.beginPath(); ctx.arc(-s * 0.26, -s * 0.3, s * 0.11, 0, TAU); ctx.fill();
      ctx.fillStyle = '#8d6f45'; ctx.fillRect(-s * 0.29, -s * 0.43, s * 0.06, s * 0.05);
      // 短剣
      ctx.save(); ctx.translate(s * 0.24, -s * 0.32); ctx.rotate(0.9 + Math.sin(walk) * 0.15);
      ctx.fillStyle = '#e8eef6'; ctx.beginPath(); ctx.moveTo(-s * 0.025, 0); ctx.lineTo(0, -s * 0.2); ctx.lineTo(s * 0.025, 0); ctx.fill();
      ctx.fillStyle = COL.woodLo; ctx.fillRect(-s * 0.02, 0, s * 0.04, s * 0.07);
      ctx.restore();
    } else {
      // とんがり帽子
      ctx.fillStyle = '#2f5fa8'; ctx.beginPath(); ctx.ellipse(0, -s * 0.8, s * 0.3, s * 0.06, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-s * 0.18, -s * 0.8); ctx.quadraticCurveTo(-s * 0.02, -s * 1.05, -s * 0.14 + Math.sin(t * 2) * 2, -s * 1.2); ctx.quadraticCurveTo(s * 0.12, -s * 1.0, s * 0.18, -s * 0.8); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffe28a'; ctx.fillRect(-s * 0.17, -s * 0.86, s * 0.34, s * 0.04);
      // 杖
      ctx.strokeStyle = COL.wood; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(s * 0.28, -s * 0.02); ctx.lineTo(s * 0.28, -s * 0.72); ctx.stroke();
      var gl = 0.6 + 0.4 * Math.sin(t * 3);
      ctx.fillStyle = 'rgba(127,227,255,' + (0.35 * gl) + ')'; ctx.beginPath(); ctx.arc(s * 0.28, -s * 0.8, s * 0.14, 0, TAU); ctx.fill();
      ctx.fillStyle = COL.cry; ctx.beginPath(); ctx.arc(s * 0.28, -s * 0.8, s * 0.07, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }

  function heart(ctx, cx, cy, s, full) {
    ctx.beginPath();
    ctx.moveTo(cx, cy + s * 0.9);
    ctx.bezierCurveTo(cx - s * 1.5, cy - s * 0.1, cx - s * 0.6, cy - s * 1.1, cx, cy - s * 0.3);
    ctx.bezierCurveTo(cx + s * 0.6, cy - s * 1.1, cx + s * 1.5, cy - s * 0.1, cx, cy + s * 0.9);
    ctx.closePath();
    ctx.fillStyle = full ? '#ff5d73' : '#3a2f44'; ctx.fill();
    if (full) { ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.arc(cx - s * 0.4, cy - s * 0.25, s * 0.18, 0, TAU); ctx.fill(); }
  }

  window.RD_ART = { COL: COL, rr: rr, icon: icon, slab: slab, hero: hero, heart: heart, coin: coin, crystal: crystal, chest: chest };
})();
