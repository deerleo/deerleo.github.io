// 《潮汐战线》特效与界面元素（像素风）。规范见 tools/ART-SPEC.md。
// 所有函数：c 已平移到目标格左上角，1 单位 = 1 逻辑像素，一格 32；只用整数坐标 fillRect
// （范围格的底纹是预先生成的 32×32 像素小画布，用 drawImage 贴）。
// t 一律是 0–1 的进度（越界、NaN 都会被夹住）；seed 是任意数字，同一个 seed 画出来的形状固定。
(function (root) {
  'use strict';
  const PI = Math.PI;
  const INK = '#2b2a40';                                  // 通用深色描边（带蓝紫，不是纯黑）
  const SMOKE_D = [INK, '#4b4b68', '#7c7f9c'];            // 黑烟：暗、中、亮
  const SMOKE_L = ['#5d5470', '#b4b9cf', '#e6ebf5'];      // 白烟
  const DUST = ['#b08a5a', '#d9b877', '#f0dc9c'];         // 扬尘
  const GOLD = { o: '#5a3a34', d: '#ff7a2e', m: '#ffc24a', h: '#fff2a8' };
  const NEUTRAL = { o: '#3a3550', d: '#6d6a85', m: '#a5a3b8', l: '#d3d2de', h: '#f4f4f8' };

  // ───────── 小工具 ─────────
  const clamp01 = t => { t = +t; return t > 0 ? (t < 1 ? t : 1) : 0; };       // NaN → 0
  const eo = p => 1 - (1 - p) * (1 - p);
  const lerp = (a, b, p) => a + (b - a) * p;
  const int = v => { v = Math.floor(+v); return v === v && isFinite(v) ? v : 0; };
  // 确定性伪随机：同一 (seed, i) 永远返回同一个 0–1 的数
  function rnd(seed, i) {
    let n = (Math.imul(int((+seed || 0) * 16) ^ 0x9e3779b9, 0x85ebca6b) + Math.imul((i | 0) + 1, 0xc2b2ae35)) | 0;
    n ^= n >>> 15; n = Math.imul(n, 0x2c1b3c6d); n ^= n >>> 12; n = Math.imul(n, 0x297a2d39); n ^= n >>> 15;
    return (n >>> 0) / 4294967296;
  }
  function R(c, x, y, w, h, col) {
    w = Math.round(w); h = Math.round(h); if (!(w > 0) || !(h > 0)) return;
    if (col) c.fillStyle = col;
    c.fillRect(Math.round(x), Math.round(y), w, h);
  }
  // 透明度：在调用方原有 globalAlpha 上再乘，分 10 档
  let baseA = 1;
  function A(c, a) { a = a >= 1 ? 1 : a > 0 ? Math.max(0.1, Math.round(a * 10) / 10) : 0; c.globalAlpha = baseA * a; }
  // 像素圆盘
  function disc(c, cx, cy, r, col) {
    if (!(r > 0)) return;
    cx = Math.round(cx); cy = Math.round(cy); c.fillStyle = col;
    if (r < 0.75) { c.fillRect(cx, cy, 1, 1); return; }
    const ri = Math.floor(r + 0.5), rr = (r + 0.35) * (r + 0.35);
    for (let dy = -ri; dy <= ri; dy++) {
      const k = rr - dy * dy; if (k < 0) continue;
      const w = Math.floor(Math.sqrt(k)); c.fillRect(cx - w, cy + dy, 2 * w + 1, 1);
    }
  }
  // 像素椭圆环，th 为横向线宽
  function ring(c, cx, cy, rx, ry, th, col) {
    if (!(rx >= 1) || !(ry >= 1)) return;
    cx = Math.round(cx); cy = Math.round(cy); c.fillStyle = col;
    const iy = Math.floor(ry + 0.35), irx = rx - th, iry = ry - th * ry / rx;
    for (let dy = -iy; dy <= iy; dy++) {
      const k = 1 - dy * dy / ((ry + 0.35) * (ry + 0.35)); if (k < 0) continue;
      const xo = Math.floor((rx + 0.35) * Math.sqrt(k));
      let xi = -1;
      if (irx > 0 && iry > 0) { const k2 = 1 - dy * dy / ((iry + 0.35) * (iry + 0.35)); if (k2 > 0) xi = Math.floor((irx + 0.35) * Math.sqrt(k2)); }
      if (xi < 0) c.fillRect(cx - xo, cy + dy, 2 * xo + 1, 1);
      else if (xo > xi) { c.fillRect(cx - xo, cy + dy, xo - xi, 1); c.fillRect(cx + xi + 1, cy + dy, xo - xi, 1); }
    }
  }
  // 一团烟：右下留暗边，左上打亮
  function puff(c, x, y, r, cols) {
    if (!(r > 0)) return;
    disc(c, x, y, r, cols[0]);
    if (r >= 1.5) disc(c, x - 1, y - 1, r - 1, cols[1]);
    if (r >= 3) disc(c, x - r * 0.4, y - r * 0.4, r * 0.4, cols[2]);
  }
  // 字符画：'#' 为实心。按行合并成横条
  function stamp(c, rows, x, y, col) {
    x = Math.round(x); y = Math.round(y); c.fillStyle = col;
    for (let j = 0; j < rows.length; j++) {
      const s = rows[j]; let i = 0;
      while (i < s.length) {
        if (s[i] !== '#') { i++; continue; }
        let k = i; while (k < s.length && s[k] === '#') k++;
        c.fillRect(x + i, y + j, k - i, 1); i = k;
      }
    }
  }
  // 带描边的字符画（8 方向描边）
  function stampO(c, rows, x, y, col, ol) {
    if (ol) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (dx || dy) stamp(c, rows, x + dx, y + dy, ol);
    stamp(c, rows, x, y, col);
  }
  function normPal(p) {
    p = p || NEUTRAL;
    return {
      o: p.o || p.outline || p.dark || NEUTRAL.o, d: p.d || p.dark || NEUTRAL.d, m: p.m || p.main || NEUTRAL.m,
      l: p.l || p.light || p.m || p.main || NEUTRAL.l, h: p.h || p.hi || p.light || NEUTRAL.h
    };
  }

  const STAR9 = ['....#....', '....#....', '...###...', '#########', '.#######.', '..#####..', '..#####..', '.###.###.', '.#.....#.'];
  const STAR7 = ['...#...', '...#...', '#######', '.#####.', '..###..', '.##.##.', '.#...#.'];
  const STAR5 = ['..#..', '#####', '.###.', '.#.#.'];
  const SPARK5 = ['..#..', '..#..', '#####', '..#..', '..#..'];
  const SPARK3 = ['.#.', '###', '.#.'];
  function star(c, rows, cx, cy) {                        // 以 (cx, cy) 为中心的金星
    const x = Math.round(cx) - (rows[0].length >> 1), y = Math.round(cy) - (rows.length >> 1);
    stampO(c, rows, x, y, GOLD.m, GOLD.o);
    if (rows.length >= 7) {                               // 右下暗、左上亮
      const n = rows.length;
      stamp(c, rows.slice(n - 3).map(s => s.replace(/#(?=.*#)/g, '.')), x, y + n - 3, GOLD.d);
      R(c, x + (n >> 1), y + 1, 1, 2, GOLD.h); R(c, x + 2, y + (n === 9 ? 3 : 2), 2, 1, GOLD.h);
    } else R(c, x + 2, y, 1, 1, GOLD.h);
  }

  // ───────── 爆炸 ─────────
  // 通用爆炸：闪光 → 火球 → 碎片/火星 → 黑烟。o 决定规模
  function blast(c, t, seed, o) {
    const S = o.S, cx = 16, cy = o.cy;
    let i, p;
    // 地面焦痕
    if (o.scorch && t > 0.08) {
      A(c, 0.4 * (t < 0.7 ? 1 : (1 - t) / 0.3));
      disc(c, cx, cy + 2, o.scorch * Math.min(1, (t - 0.08) / 0.2), '#1e1446'); A(c, 1);
    }
    // 冲击波环
    if (o.rings) for (i = 0; i < o.rings.length; i++) {
      const g = o.rings[i]; p = (t - g.t0) / (g.t1 - g.t0); if (p <= 0 || p >= 1) continue;
      const r = lerp(g.r0, g.r1, eo(p));
      A(c, p > 0.55 ? 1 - (p - 0.55) / 0.45 * 0.85 : 1);
      ring(c, cx, cy, r, r, g.th * (1 - p * 0.6) + 1, p < 0.3 ? '#ff7a2e' : '#d43a2a');
      ring(c, cx, cy, r - 1, r - 1, Math.max(1, g.th * (1 - p * 0.6) - 1), p < 0.3 ? '#fff3c4' : p < 0.6 ? '#ffc24a' : '#ff7a2e');
      A(c, 1);
    }
    // 黑烟（先画，火球盖在上面）
    for (i = 0; i < o.smoke; i++) {
      const t0 = o.smokeT0 + rnd(seed, 100 + i) * 0.22; if (t <= t0) continue;
      p = (t - t0) / (1 - t0);
      const sx = (rnd(seed, 120 + i) - 0.5) * 2 * o.spread, sy = (rnd(seed, 140 + i) - 0.5) * o.spread;
      const x = cx + sx * (0.45 + 0.55 * eo(p)) + p * 3, y = cy + sy * 0.6 - o.rise * p * (0.6 + rnd(seed, 160 + i) * 0.8);
      const grow = p < 0.3 ? 0.45 + p / 0.3 * 0.55 : 1 - (p - 0.3) / 0.7 * 0.8;
      A(c, p > 0.6 ? 1 - (p - 0.6) / 0.4 * 0.7 : 1);
      puff(c, x, y, o.puffR * (0.55 + rnd(seed, 180 + i) * 0.65) * grow, SMOKE_D);
    }
    A(c, 1);
    // 火球：几团圆盘并成不规则外形，一层一层往里亮，亮层往左上偏
    const tf = o.fireEnd;
    if (t < tf) {
      p = t / tf;
      const Rr = S * (4 + 11 * eo(p)), q = p > 0.72 ? 1 - (p - 0.72) / 0.28 : 1, k = Math.sqrt(S);
      const L = [[0, 0, 0.8]];
      for (i = 0; i < o.lumps; i++) {
        const a = (i + rnd(seed, 10 + i) * 0.7) / o.lumps * 2 * PI, d = (0.3 + rnd(seed, 20 + i) * 0.3) * Rr;
        L.push([Math.cos(a) * d, Math.sin(a) * d, 0.45 + rnd(seed, 30 + i) * 0.3]);
      }
      const layers = [['#d43a2a', 0], ['#ff7a2e', 1.5 + p * 2], ['#ffc24a', 3 + p * 4.5], ['#fff2a8', 5 + p * 8]];
      for (let j = 0; j < 4; j++) {
        const inset = layers[j][1] * k * (0.35 + 0.65 * q), sh = inset * 0.3;
        for (i = 0; i < L.length; i++) disc(c, cx + L[i][0] - sh, cy + L[i][1] - sh, Rr * L[i][2] * q - inset, layers[j][0]);
      }
    }
    // 起爆闪光
    if (t < 0.12) {
      p = t / 0.12;
      const fr = S * (5 + 6 * p), ray = S * (12 + 6 * p), w = S >= 2 ? 4 : 2;
      disc(c, cx, cy, fr, '#fff2a8'); disc(c, cx, cy, fr - 2, '#fff3c4');
      R(c, cx - ray, cy - (w >> 1), ray * 2, w, '#fff2a8'); R(c, cx - (w >> 1), cy - ray, w, ray * 2, '#fff2a8');
      for (i = 2; i < ray * 0.6; i += 2) for (let s = 0; s < 4; s++) R(c, cx + (s & 1 ? i : -i - 1), cy + (s & 2 ? i : -i - 1), 1, 1, '#ffc24a');
    }
    // 碎片：抛物线飞出，拖两点余烬
    for (i = 0; i < o.debris; i++) {
      const a = (i + rnd(seed, 40 + i) * 0.8) / o.debris * 2 * PI, v = S * (13 + rnd(seed, 60 + i) * 15);
      p = (t - 0.04) / (0.6 + rnd(seed, 80 + i) * 0.3); if (p <= 0 || p >= 1) continue;
      const pos = q => [cx + Math.cos(a) * v * eo(q), cy + Math.sin(a) * v * 0.7 * eo(q) - S * 36 * q * (1 - q)];
      if (p < 0.6) { let e = pos(Math.max(0, p - 0.1)); R(c, e[0], e[1], 1, 1, '#d43a2a'); e = pos(Math.max(0, p - 0.05)); R(c, e[0], e[1], 1, 1, '#ff7a2e'); }
      const b = pos(p), big = i % 3 === 0 && S >= 1;
      R(c, b[0] - 1, b[1] - 1, big ? 3 : 2, 2, i % 2 ? INK : '#4b4b68'); R(c, b[0] - 1, b[1] - 1, 1, 1, i % 2 ? '#7c7f9c' : '#b4b9cf');
    }
    // 火星
    for (i = 0; i < o.sparks; i++) {
      p = (t - 0.02) / (0.3 + rnd(seed, 200 + i) * 0.25); if (p <= 0 || p >= 1) continue;
      const a = rnd(seed, 220 + i) * 2 * PI, d = S * (8 + rnd(seed, 240 + i) * 20) * eo(p);
      R(c, cx + Math.cos(a) * d, cy + Math.sin(a) * d, 1, 1, p < 0.5 ? '#fff2a8' : '#ffc24a');
    }
  }
  const BLAST_BIG = { S: 1, cy: 17, lumps: 5, debris: 9, sparks: 10, smoke: 6, smokeT0: 0.28, spread: 9, rise: 15, puffR: 6, fireEnd: 0.62 };
  const BLAST_SMALL = { S: 0.6, cy: 19, lumps: 3, debris: 4, sparks: 6, smoke: 3, smokeT0: 0.3, spread: 5, rise: 11, puffR: 4, fireEnd: 0.58 };
  const BLAST_SILO = {
    S: 2.6, cy: 16, lumps: 9, debris: 16, sparks: 26, smoke: 18, smokeT0: 0.3, spread: 40, rise: 22, puffR: 12, fireEnd: 0.6, scorch: 30,
    rings: [{ t0: 0.03, t1: 0.6, r0: 10, r1: 76, th: 5 }, { t0: 0.16, t1: 0.75, r0: 6, r1: 58, th: 3 }]
  };

  function explosion(c, t, seed, kind) { blast(c, t, seed, kind === 'small' ? BLAST_SMALL : BLAST_BIG); }
  function silo(c, t, seed) { blast(c, t, seed, BLAST_SILO); }

  // 中弹火花
  function hit(c, t, seed) {
    const cx = 16 + Math.round((rnd(seed, 1) - 0.5) * 10), cy = 17 + Math.round((rnd(seed, 2) - 0.5) * 8);
    let p, i;
    if (t > 0.28) {
      p = (t - 0.28) / 0.72; A(c, p > 0.5 ? 1 - (p - 0.5) / 0.5 * 0.8 : 1);
      puff(c, cx + 1, cy - 1 - 6 * p, 1.5 + 2 * Math.sin(PI * Math.min(1, p * 1.4)), SMOKE_L); A(c, 1);
    }
    if (t < 0.3) {
      p = t / 0.3;
      const r = p < 0.35 ? 2 + 2.5 * p / 0.35 : 4.5 * (1 - (p - 0.35) / 0.65);
      disc(c, cx, cy, r + 1, '#d43a2a'); disc(c, cx, cy, r, '#ff7a2e'); disc(c, cx, cy, r - 1, '#ffc24a'); disc(c, cx - 1, cy - 1, r - 2.2, '#fff3c4');
      if (p < 0.55) { const L = Math.round(4 + 8 * p); R(c, cx - L, cy, 2 * L + 1, 1, '#fff2a8'); R(c, cx, cy - L, 1, 2 * L + 1, '#fff2a8'); }
    }
    for (i = 0; i < 8; i++) {
      p = t / (0.4 + rnd(seed, 10 + i) * 0.35); if (p >= 1) continue;
      const a = (i + rnd(seed, 20 + i)) / 8 * 2 * PI, v = 8 + rnd(seed, 30 + i) * 7;
      const at = q => [cx + Math.cos(a) * (3 + v * eo(q)), cy + Math.sin(a) * (3 + v * eo(q)) + 5 * q * q];
      const e = at(Math.max(0, p - 0.12)); if (p < 0.75) R(c, e[0], e[1], 1, 1, '#ff7a2e');
      const b = at(p); R(c, b[0], b[1], 1, 1, p < 0.4 ? '#fff2a8' : p < 0.75 ? '#ffc24a' : '#ff7a2e');
    }
  }

  // 炮口闪光。朝右时炮口在 (30, 14)，朝左镜像到 (2, 14)；火焰往格子外喷 14 像素左右
  function muzzle(c, t, dir) {
    const left = dir === 'left', oy = 14;
    const M = (u, v, w, h, col) => R(c, left ? 2 - u - w : 30 + u, oy + v, w, h, col);
    const cone = (L, hw, col) => { for (let v = -hw; v <= hw; v++) M(0, v, Math.max(1, L * (1 - Math.abs(v) / (hw + 1))), 1, col); };
    if (t < 0.45) {
      const k = t < 0.1 ? 0.65 + 0.35 * t / 0.1 : 1 - (t - 0.1) / 0.35;
      const L = 15 * k, hw = Math.round(4 * k);
      // 上下两道侧焰
      if (k > 0.5) { M(1, -hw - 3, 3, 2, '#ff7a2e'); M(1, hw + 2, 3, 2, '#ff7a2e'); M(2, -hw - 4, 1, 1, '#ffc24a'); M(2, hw + 4, 1, 1, '#ffc24a'); }
      cone(L + 1, hw + 1, '#d43a2a'); cone(L, hw, '#ff7a2e'); cone(L * 0.72, hw - 1, '#ffc24a');
      if (hw >= 2) cone(L * 0.42, hw - 2, '#fff3c4');
      if (k > 0.6) { M(L + 2, 0, 2, 1, '#ffc24a'); M(L + 5, -1, 1, 1, '#fff2a8'); }
    }
    if (t > 0.18) {
      const p = (t - 0.18) / 0.82;
      A(c, p > 0.5 ? 1 - (p - 0.5) / 0.5 * 0.8 : 1);
      const g = Math.sin(PI * Math.min(1, p * 1.5));
      const sx = u => (left ? 2 - u : 30 + u);
      puff(c, sx(3 + 7 * p), oy - 1 - 5 * p, 1.2 + 2.3 * g, SMOKE_L);
      puff(c, sx(8 + 6 * p), oy + 1 - 3 * p, 1 + 1.6 * g, SMOKE_L);
      A(c, 1);
    }
  }

  // 水柱：落点在格子中下部 (16, 23)
  function splash(c, t, seed) {
    const cx = 16, by = 23; let p, i;
    for (i = 0; i < 2; i++) {                              // 两圈涟漪
      p = (t - i * 0.22) / (1 - i * 0.22); if (p <= 0 || p >= 1) continue;
      const rx = 3 + 11 * eo(p);
      A(c, p > 0.55 ? 1 - (p - 0.55) / 0.45 * 0.85 : 1);
      ring(c, cx, by, rx, rx * 0.45, 1.3, i ? '#9fe6f7' : '#eafcff');
    }
    A(c, 1);
    if (t < 0.78) {
      p = t / 0.78;
      const h = Math.round(22 * Math.sin(PI * Math.pow(p, 0.65))), w = p < 0.55 ? 3 : Math.max(1, Math.round(3 - 2.4 * (p - 0.55) / 0.45));
      if (h > 1) {
        const h2 = h >> 1;
        R(c, cx - w - 1, by - h2, 2 * w + 3, h2, '#2a5fc0'); R(c, cx - w, by - h, 2 * w + 1, h - h2, '#2a5fc0');     // 右侧暗边
        R(c, cx - w - 1, by - h2, 2 * w + 2, h2, '#5fc0f0'); R(c, cx - w, by - h, 2 * w, h - h2, '#5fc0f0');
        R(c, cx - w, by - h2, Math.max(1, w - 1), h2, '#9fe6f7'); R(c, cx - w + 1, by - h, Math.max(1, w - 1), h - h2, '#9fe6f7');
        R(c, cx - w + 1, by - h + 1, 1, h - 2, '#eafcff');
        // 水柱顶的浪花
        disc(c, cx + w, by - h + 1, w - 0.5, '#5fc0f0'); disc(c, cx - w, by - h + 1, w - 0.5, '#9fe6f7');
        disc(c, cx, by - h - 1, w + 0.5, '#9fe6f7'); disc(c, cx - 1, by - h - 2, w - 0.5, '#eafcff');
      }
      // 根部白沫
      const fw = w + 3;
      R(c, cx - fw, by - 1, fw * 2 + 1, 2, '#eafcff'); R(c, cx - fw - 2, by, 2, 1, '#9fe6f7'); R(c, cx + fw + 1, by, 2, 1, '#9fe6f7');
      R(c, cx - fw + 1, by + 1, fw * 2 - 1, 1, '#9fe6f7');
    }
    for (i = 0; i < 9; i++) {                              // 水珠
      const t0 = 0.12 + rnd(seed, 10 + i) * 0.18; p = (t - t0) / 0.68; if (p <= 0 || p >= 1) continue;
      const vx = (rnd(seed, 20 + i) - 0.5) * 26, vy = 16 + rnd(seed, 30 + i) * 12;
      const x = cx + vx * p, y = by - 9 - vy * p + 36 * p * p, s = i % 3 === 0 && p < 0.7 ? 2 : 1;
      R(c, x, y + s, s, 1, '#5fc0f0'); R(c, x, y, s, s, '#eafcff');
    }
  }

  // 飞行中的炮弹/导弹，弹体中心在 (16, 16)。t 只管尾焰和尾烟的流动（传飞行进度即可）。
  // dx, dy 为飞行方向（可省，默认朝右），尾烟朝反方向拖。
  function shell(c, t, dx, dy) {
    dx = +dx || 0; dy = +dy || 0;
    let n = Math.sqrt(dx * dx + dy * dy); if (!(n > 0)) { dx = 1; dy = 0; n = 1; }
    dx /= n; dy /= n;
    const cx = 16, cy = 16, ph = (t * 6) % 1, fl = Math.floor(t * 24) & 1;
    let i;
    for (i = 4; i >= 0; i--) {                             // 尾烟：离弹体越远越大越淡
      const d = 7 + (i + ph) * 4, r = 1 + (i + ph) * 0.55, wob = ((i * 7 + 3) % 5 - 2) * 0.5;
      A(c, 1 - (i + ph) / 5.2);
      puff(c, cx - dx * d - dy * wob, cy - dy * d + dx * wob, r, SMOKE_L);
    }
    A(c, 1);
    R(c, cx - dx * 6 - 1, cy - dy * 6 - 1, 2, 2, '#d43a2a');                     // 尾焰
    R(c, cx - dx * 5 - 1, cy - dy * 5 - 1, 2, 2, '#ff7a2e');
    R(c, cx - dx * 4 - 1, cy - dy * 4 - 1, 2, 2, fl ? '#fff2a8' : '#ffc24a');
    if (fl) R(c, cx - dx * 8 - 0.5, cy - dy * 8 - 0.5, 1, 1, '#ffc24a');
    for (i = -3; i <= 3; i++) R(c, cx + dx * i - 1.5, cy + dy * i - 1.5, 3, 3, INK);   // 弹体描边
    for (i = -3; i <= 1; i++) R(c, cx + dx * i - 0.5, cy + dy * i - 0.5, 1, 1, i < -1 ? '#7c7f9c' : '#e6ebf5');
    R(c, cx + dx * 2 - 0.5, cy + dy * 2 - 0.5, 1, 1, '#ff7a2e'); R(c, cx + dx * 3 - 0.5, cy + dy * 3 - 0.5, 1, 1, '#d43a2a');
  }

  // 占领成功：立杆 → 升旗 → 星星迸发
  function capture(c, t, pal) {
    pal = normPal(pal);
    const px = 9, by = 30, H = Math.round(27 * Math.min(1, t / 0.12));
    let i, p;
    R(c, px - 3, by - 1, 8, 3, INK); R(c, px - 2, by - 1, 6, 1, '#7c7f9c'); R(c, px - 2, by, 6, 1, '#4b4b68');   // 底座
    R(c, px - 1, by - H - 1, 4, H, INK); R(c, px, by - H, 1, H - 1, '#e6ebf5'); R(c, px + 1, by - H, 1, H - 1, '#7c7f9c');
    R(c, px - 1, by - H - 3, 4, 3, INK); R(c, px, by - H - 2, 2, 2, GOLD.m); R(c, px, by - H - 2, 1, 1, GOLD.h);
    if (t > 0.1) {
      p = eo(Math.min(1, (t - 0.1) / 0.45));
      const fw = 15, fh = 9, fy = Math.round(lerp(by - 11, by - 26, p)), fx = px + 3, ph = Math.floor(t * 20);
      const off = k => (k < 2 ? 0 : [0, 1, 1, 0, 0, -1, -1, 0][(k - ph) & 7]);
      for (i = 0; i < fw; i++) R(c, fx + i, fy + off(i) - 1, i === fw - 1 ? 2 : 1, fh + 2, pal.o);
      for (i = 0; i < fw; i++) {
        const o = off(i), y = fy + o;
        R(c, fx + i, y, 1, fh, o > 0 ? pal.d : pal.m);
        R(c, fx + i, y, 1, o < 0 ? 3 : 2, o > 0 ? pal.m : pal.l);
        R(c, fx + i, y + fh - 2, 1, 2, pal.d);
        if (i >= 5 && i <= 9) R(c, fx + i, y + 3, 1, 3, i === 5 || i === 9 ? pal.l : pal.h);    // 旗面徽记
      }
      R(c, fx + 5, fy + off(5) + 3, 1, 1, pal.m); R(c, fx + 9, fy + off(9) + 5, 1, 1, pal.m);
    }
    if (t > 0.5) {
      p = (t - 0.5) / 0.5;
      const ox = px + 10, oy = by - 21;
      if (p < 0.3) { A(c, 1 - p / 0.3 * 0.6); ring(c, ox, oy, 4 + 14 * p / 0.3, 4 + 14 * p / 0.3, 1.5, '#fff3c4'); A(c, 1); }
      for (i = 0; i < 8; i++) {
        const a = i / 8 * 2 * PI - PI / 2 + 0.2, d = 6 + (i % 2 ? 13 : 17) * eo(p), x = ox + Math.cos(a) * d, y = oy + Math.sin(a) * d * 0.9;
        if (p > 0.75 && ((i + Math.floor(p * 16)) & 1)) continue;                       // 收尾闪烁着消失
        if (i % 2 === 0) star(c, p < 0.6 ? STAR7 : STAR5, x, y);
        else stampO(c, p < 0.5 ? SPARK5 : SPARK3, Math.round(x) - (p < 0.5 ? 2 : 1), Math.round(y) - (p < 0.5 ? 2 : 1), GOLD.h, GOLD.d);
      }
    }
  }

  // 修理/治疗：绿色加号上浮
  function heal(c, t) {
    const items = [[8, 0, 1], [22, 0.14, 0], [15, 0.26, 1], [25, 0.4, 0], [6, 0.46, 0]];
    for (let i = 0; i < items.length; i++) {
      const it = items[i], p = (t - it[1]) / 0.54; if (p <= 0 || p >= 1) continue;
      const x = it[0], y = Math.round(25 - 20 * eo(p));
      A(c, p > 0.7 ? 1 - (p - 0.7) / 0.3 * 0.8 : 1);
      if (it[2]) {                                         // 大加号 9×9（含描边）
        R(c, x - 2, y - 5, 5, 11, '#173f3a'); R(c, x - 5, y - 2, 11, 5, '#173f3a');
        R(c, x - 1, y - 4, 3, 9, '#5bb04a'); R(c, x - 4, y - 1, 9, 3, '#5bb04a');
        R(c, x + 1, y - 4, 1, 9, '#2f7f45'); R(c, x - 4, y + 1, 9, 1, '#2f7f45'); R(c, x + 1, y - 1, 1, 2, '#5bb04a');
        R(c, x - 1, y - 4, 1, 8, '#c4ec7a'); R(c, x - 4, y - 1, 8, 1, '#c4ec7a'); R(c, x - 1, y - 4, 2, 1, '#eef4ff');
      } else {                                             // 小加号 5×5
        R(c, x - 1, y - 3, 3, 7, '#173f3a'); R(c, x - 3, y - 1, 7, 3, '#173f3a');
        R(c, x, y - 2, 1, 5, '#8fd45a'); R(c, x - 2, y, 5, 1, '#8fd45a'); R(c, x, y - 2, 1, 2, '#c4ec7a');
      }
    }
    A(c, 1);
    for (let i = 0; i < 6; i++) {                          // 零星绿色光点
      const p = (t - i * 0.12) / 0.4; if (p <= 0 || p >= 1) continue;
      R(c, 4 + (i * 11) % 25, 27 - 14 * p - (i * 5) % 9, 1, p < 0.5 ? 2 : 1, '#c4ec7a');
    }
  }

  // 升星：金星弹出、上升、迸出光点
  function levelup(c, t) {
    const cx = 16; let i;
    const y = t < 0.2 ? 18 - 4 * eo(t / 0.2) : 14 - 7 * (t - 0.2) / 0.8;
    if (t > 0.1 && t < 0.9) {                              // 两侧上升的光柱
      const p = (t - 0.1) / 0.8;
      for (i = 0; i < 4; i++) {
        const x = [5, 10, 21, 26][i], q = (p * 1.6 + i * 0.23) % 1;
        A(c, 1 - q * 0.7); R(c, x, 28 - 22 * q, 1, 4, i % 2 ? GOLD.m : GOLD.h);
      }
      A(c, 1);
    }
    if (t > 0.15 && t < 0.85) {                            // 一圈迸出的光点
      const p = (t - 0.15) / 0.7, d = 7 + 9 * eo(p);
      for (i = 0; i < 8; i++) {
        const a = i / 8 * 2 * PI + 0.39, x = cx + Math.cos(a) * d, yy = y + Math.sin(a) * d;
        if (p > 0.7 && ((i + Math.floor(p * 14)) & 1)) continue;
        if (i % 2) stampO(c, SPARK3, Math.round(x) - 1, Math.round(yy) - 1, GOLD.h, GOLD.d); else R(c, x, yy, 2, 2, GOLD.m);
      }
    }
    if (t >= 0.9) { if (Math.floor(t * 40) & 1) star(c, STAR5, cx, y + 1); }
    else star(c, t < 0.06 ? STAR5 : t < 0.12 ? STAR7 : STAR9, cx, y);
    if (t > 0.12 && t < 0.3) { R(c, cx - 8, y, 3, 1, GOLD.h); R(c, cx + 6, y, 3, 1, GOLD.h); R(c, cx, y - 8, 1, 3, GOLD.h); }
  }

  function smokePuff(c, t, seed) {
    const cx = 16 + (rnd(seed, 1) - 0.5) * 6, cy = 18;
    A(c, t > 0.55 ? 1 - (t - 0.55) / 0.45 * 0.85 : 1);
    for (let i = 0; i < 3; i++) {
      const g = t < 0.3 ? 0.5 + t / 0.3 * 0.5 : 1 - (t - 0.3) / 0.7 * 0.65;
      puff(c, cx + (i - 1) * (3 + 3 * t) + (rnd(seed, 10 + i) - 0.5) * 3, cy - (7 + rnd(seed, 20 + i) * 9) * t + (i === 1 ? -2 : 1), (2.5 + rnd(seed, 30 + i) * 2 + (i === 1 ? 1 : 0)) * g, SMOKE_L);
    }
    A(c, 1);
  }
  // 移动扬尘：贴在格子底边，往两侧和上方散开
  function dust(c, t, seed) {
    A(c, t > 0.5 ? 1 - (t - 0.5) / 0.5 * 0.85 : 1);
    for (let i = 0; i < 4; i++) {
      const g = t < 0.3 ? 0.5 + t / 0.3 * 0.5 : 1 - (t - 0.3) / 0.7 * 0.7, side = i % 2 ? 1 : -1;
      puff(c, 16 + side * (3 + i * 2 + (6 + rnd(seed, i) * 4) * eo(t)), 28 - (2 + i + rnd(seed, 9 + i) * 2) * t * 2, (1.6 + (i < 2 ? 1.4 : 0.4)) * g, DUST);
    }
    A(c, 1);
    if (t < 0.6) { R(c, 9 - 6 * t, 30, 2, 1, DUST[1]); R(c, 22 + 6 * t, 30, 2, 1, DUST[1]); }
  }

  // ───────── 界面元素 ─────────
  const CUR = {
    normal: ['#f4f4f8', '#ffc24a'], attack: ['#e0453a', '#ffd0a0'], unload: ['#8fd45a', '#eef4ff'], ai: ['#a2a4bd', '#d3d2de']
  };
  // 选格光标：四角括号，frame 0–3 呼吸（往外 0/1/2/1 像素）。画到格外 4 像素以内
  function cursor(c, frame, kind) {
    const f = ((int(frame) % 4) + 4) % 4, g = [0, 1, 2, 1][f], col = CUR[kind] || CUR.normal, L = 9, o = 1 + g;
    for (let pass = 0; pass < 3; pass++) for (let s = 0; s < 4; s++) {
      const sx = s & 1, sy = s >> 1, x = sx ? 31 + o : -o, y = sy ? 31 + o : -o;
      const hx = sx ? x - L + 1 : x, hy = sy ? y - 1 : y, vx = sx ? x - 1 : x, vy = sy ? y - L + 1 : y;
      if (pass === 0) { R(c, hx - 1, hy - 1, L + 2, 4, INK); R(c, vx - 1, vy - 1, 4, L + 2, INK); }
      else if (pass === 1) { R(c, hx, hy, L, 2, col[0]); R(c, vx, vy, 2, L, col[0]); }
      else {                                               // 臂端与拐角点第二色
        R(c, sx ? hx : hx + L - 3, hy, 3, 2, col[1]); R(c, vx, sy ? vy : vy + L - 3, 2, 3, col[1]);
        if (f === 2) R(c, sx ? x - 1 : x, sy ? y - 1 : y, 2, 2, col[1]);
      }
    }
    if (kind === 'attack') {                               // 攻击光标：四边中点加准星短线
      const d = 2 - g;
      for (let s = 0; s < 4; s++) {
        const h = s < 2, a = h ? 14 : (s === 2 ? d : 27 - d);
        const x = h ? (s === 0 ? d : 27 - d) : 14, y = h ? 14 : a;
        R(c, x, y + (h ? 1 : 0), h ? 5 : 4, h ? 4 : 5, INK); R(c, x + 1, y + (h ? 2 : 1), h ? 3 : 2, h ? 2 : 3, col[0]);
      }
    }
  }

  const RANGE = {
    move: { base: '#3b82f0', ba: 0.56, pat: '#9fe6f7', pa: 0.6, e1: '#eafcff', e2: '#6fc3ff', style: 'stripeR' },
    attack: { base: '#e0453a', ba: 0.68, pat: '#a3263c', pa: 0.6, e1: '#fff2a8', e2: '#ff7a2e', style: 'stripeL' },
    unload: { base: '#3f8f45', ba: 0.4, pat: '#c4ec7a', pa: 0.75, e1: '#c4ec7a', e2: '#5bb04a', style: 'dots' },
    threat: { base: '#4a1530', ba: 0.42, pat: '#e0453a', pa: 0.8, e1: '#ff8a5c', e2: '#a3263c', style: 'hatch' }
  };
  // 范围格的底色和流动底纹（32×32），不含边框
  function paintRange(c, kind, f) {
    const k = RANGE[kind] || RANGE.move, a0 = c.globalAlpha;
    let x, y;
    c.globalAlpha = a0 * k.ba; R(c, 0, 0, 32, 32, k.base);
    c.globalAlpha = a0 * k.ba * 0.5; R(c, 31, 0, 1, 32, INK); R(c, 0, 31, 31, 1, INK);          // 右、下各压一条暗线，分出格子
    c.globalAlpha = a0 * k.pa; c.fillStyle = k.pat;
    if (k.style === 'stripeR' || k.style === 'stripeL') {                                     // 斜纹，每帧挪 2 像素，4 帧一循环
      const s = k.style === 'stripeR' ? 1 : -1;
      for (y = 0; y < 31; y++) for (x = ((((s * y - 2 * f) % 8) + 8) % 8) - 8; x < 31; x += 8) {
        const x0 = Math.max(0, x), x1 = Math.min(31, x + 2); if (x1 > x0) c.fillRect(x0, y, x1 - x0, 1);
      }
    } else if (k.style === 'dots') {                                                          // 点阵往上飘
      for (let j = -1; j < 5; j++) for (let i = 0; i < 4; i++) {
        y = j * 8 + 3 - 2 * f + (i % 2) * 4; x = i * 8 + 3;
        if (y >= 0 && y <= 29) c.fillRect(x, y, 2, 2);
      }
    } else {                                                                                  // 威胁：细密暗点交错闪动
      for (y = 1; y < 31; y += 2) for (x = 1 + ((y >> 1) + f) % 2 * 2; x < 31; x += 4) c.fillRect(x, y, 1, 1);
    }
    c.globalAlpha = a0;
  }
  const rangeCache = {};
  function rangeCanvas(kind, f) {
    const key = kind + f;
    if (rangeCache[key] !== undefined) return rangeCache[key];
    let cv = null;
    try {
      if (typeof document !== 'undefined') {
        cv = document.createElement('canvas'); cv.width = cv.height = 32;
        paintRange(cv.getContext('2d'), kind, f);
      }
    } catch (e) { cv = null; }
    return (rangeCache[key] = cv);
  }
  // 范围高亮格。edges = {up,right,down,left}：该侧是范围边界就画亮边；
  // 可选 {ul,ur,dl,dr}：该斜角方向的格子不在范围内（而两条邻边都在），补上内凹拐角的 2×2 亮点
  function rangeTile(c, kind, frame, edges) {
    if (!RANGE[kind]) kind = 'move';
    const f = ((int(frame) % 4) + 4) % 4, k = RANGE[kind], e = edges || {}, a0 = c.globalAlpha;
    const cv = rangeCanvas(kind, f);
    if (cv) c.drawImage(cv, 0, 0); else paintRange(c, kind, f);
    const y0 = e.up ? 2 : 0, y1 = e.down ? 30 : 32;
    c.globalAlpha = a0 * 0.75;                              // 内圈
    if (e.up) R(c, e.left ? 1 : 0, 1, 32 - (e.left ? 1 : 0) - (e.right ? 1 : 0), 1, k.e2);
    if (e.down) R(c, e.left ? 1 : 0, 30, 32 - (e.left ? 1 : 0) - (e.right ? 1 : 0), 1, k.e2);
    if (e.left) R(c, 1, y0, 1, y1 - y0, k.e2);
    if (e.right) R(c, 30, y0, 1, y1 - y0, k.e2);
    c.globalAlpha = a0 * 0.95;                              // 外圈
    if (e.up) R(c, 0, 0, 32, 1, k.e1);
    if (e.down) R(c, 0, 31, 32, 1, k.e1);
    if (e.left) R(c, 0, e.up ? 1 : 0, 1, 32 - (e.up ? 1 : 0) - (e.down ? 1 : 0), k.e1);
    if (e.right) R(c, 31, e.up ? 1 : 0, 1, 32 - (e.up ? 1 : 0) - (e.down ? 1 : 0), k.e1);
    if (e.ul && !e.up && !e.left) { R(c, 0, 0, 2, 2, k.e2); R(c, 0, 0, 1, 1, k.e1); }
    if (e.ur && !e.up && !e.right) { R(c, 30, 0, 2, 2, k.e2); R(c, 31, 0, 1, 1, k.e1); }
    if (e.dl && !e.down && !e.left) { R(c, 0, 30, 2, 2, k.e2); R(c, 0, 31, 1, 1, k.e1); }
    if (e.dr && !e.down && !e.right) { R(c, 30, 30, 2, 2, k.e2); R(c, 31, 31, 1, 1, k.e1); }
    c.globalAlpha = a0;
  }

  // 路径箭头的一格。from = 上一格在本格的哪一侧，to = 下一格在哪一侧（起点 from 为 null，终点 to 为 null）。
  // isEnd 时画箭头头部，指向 from 的反方向。带身 6 像素宽、描边 2 像素，居中，相邻格在格边处无缝相接。
  const OPP = { up: 'down', down: 'up', left: 'right', right: 'left' };
  function oriented(c, dir) {                              // u 沿 dir 方向离开格心，v 垂直
    return dir === 'right' ? (u, v, w, h, col) => R(c, 16 + u, 16 + v, w, h, col)
      : dir === 'left' ? (u, v, w, h, col) => R(c, 16 - u - w, 16 + v, w, h, col)
        : dir === 'down' ? (u, v, w, h, col) => R(c, 16 + v, 16 + u, h, w, col)
          : (u, v, w, h, col) => R(c, 16 + v, 16 - u - w, h, w, col);
  }
  const PATH = { o: INK, m: '#fff3c4', d: '#ffc24a', h: '#ffffff' };
  function pathSeg(c, from, to, isEnd) {
    if (!OPP[from]) from = null; if (!OPP[to]) to = null;
    const head = isEnd && from ? OPP[from] : null;
    if (head) to = null;
    const arms = []; if (from) arms.push(from); if (to) arms.push(to);
    const hw = i => Math.max(1, Math.round(9 - i * 0.75));  // 箭头头部每列的半高
    let i;
    for (let pass = 0; pass < 2; pass++) {
      const ol = pass === 0;
      for (i = 0; i < arms.length; i++) {
        const P = oriented(c, arms[i]);
        if (ol) P(-5, -5, 21, 10, PATH.o); else { P(-3, -3, 19, 6, PATH.m); P(-3, 2, 19, 1, PATH.d); P(-3, -3, 19, 1, PATH.h); }
      }
      if (!ol && arms.length === 2 && arms[0] !== OPP[arms[1]]) {                // 拐角处把明暗线接顺
        R(c, 13, 13, 6, 6, PATH.m);
        const v = arms.indexOf('up') >= 0 ? 'up' : 'down', h = arms.indexOf('left') >= 0 ? 'left' : 'right';
        if (v === 'down') R(c, 13, 13, 6, 1, PATH.h); else R(c, 13, 18, 6, 1, PATH.d);
        if (h === 'right') R(c, 13, 13, 1, 6, PATH.h); else R(c, 18, 13, 1, 6, PATH.d);
        if (v === 'up' && h === 'left') R(c, 18, 18, 1, 1, PATH.d);
        if (v === 'down' && h === 'right') R(c, 13, 13, 1, 1, PATH.h);
      }
      if (!from && !head) {                                // 起点：圆角方块
        if (ol) { R(c, 9, 10, 14, 12, PATH.o); R(c, 10, 9, 12, 14, PATH.o); }
        else { R(c, 11, 12, 10, 8, PATH.m); R(c, 12, 11, 8, 10, PATH.m); R(c, 12, 11, 8, 1, PATH.h); R(c, 11, 12, 1, 7, PATH.h); R(c, 12, 20, 8, 1, PATH.d); R(c, 20, 12, 1, 8, PATH.d); R(c, 14, 14, 4, 4, PATH.d); }
      }
      if (head) {
        const P = oriented(c, head);
        for (i = 0; i < 12; i++) {
          const w = hw(i);
          if (ol) P(-4 + i, -w - 2, 5, 2 * w + 4, PATH.o);
          else { P(-2 + i, -w, 1, 2 * w, PATH.m); P(-2 + i, w - (i < 9 ? 2 : 1), 1, i < 9 ? 2 : 1, PATH.d); P(-2 + i, -w, 1, 1, PATH.h); }
        }
      }
    }
  }

  // 5×7 像素字体
  const FONT = {
    '0': ['.###.', '#...#', '#..##', '#.#.#', '##..#', '#...#', '.###.'],
    '1': ['..#..', '.##..', '..#..', '..#..', '..#..', '..#..', '.###.'],
    '2': ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#####'],
    '3': ['.###.', '#...#', '....#', '..##.', '....#', '#...#', '.###.'],
    '4': ['...#.', '..##.', '.#.#.', '#..#.', '#####', '...#.', '...#.'],
    '5': ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],
    '6': ['..##.', '.#...', '#....', '####.', '#...#', '#...#', '.###.'],
    '7': ['#####', '....#', '...#.', '..#..', '.#...', '.#...', '.#...'],
    '8': ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'],
    '9': ['.###.', '#...#', '#...#', '.####', '....#', '...#.', '.##..'],
    '%': ['##..#', '##..#', '...#.', '..#..', '.#...', '#..##', '#..##'],
    '-': ['.....', '.....', '.....', '#####', '.....', '.....', '.....'],
    '+': ['.....', '..#..', '..#..', '#####', '..#..', '..#..', '.....'],
    '!': ['..#..', '..#..', '..#..', '..#..', '..#..', '.....', '..#..'],
    '/': ['....#', '....#', '...#.', '..#..', '.#...', '#....', '#....'],
    'x': ['.....', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '.....']
  };
  // 从 (0,0) 起画一行字（字高 7，字宽 5，字距 1；深色描边会探到 −1）。返回绘制宽度。
  // 支持 0–9 % - + ! / x 和空格；不认识的字符按空格处理。outline 传 null 可去掉描边。
  function digits(c, text, color, outline) {
    const s = String(text == null ? '' : text), ol = outline === undefined ? INK : outline;
    let x = 0, pass, i;
    for (pass = ol ? 0 : 1; pass < 2; pass++) {
      for (x = 0, i = 0; i < s.length; i++) {
        const g = FONT[s[i]];
        if (!g) { x += 4; continue; }
        if (pass === 0) { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (dx || dy) stamp(c, g, x + dx, dy, ol); }
        else stamp(c, g, x, 0, color || '#f4f4f8');
        x += 6;
      }
    }
    return Math.max(0, x - 1);
  }
  digits.width = function (text) {
    const s = String(text == null ? '' : text); let x = 0;
    for (let i = 0; i < s.length; i++) x += FONT[s[i]] ? 6 : 4;
    return Math.max(0, x - 1);
  };

  // 右下角血量角标（hp 1–9；≥10 或 ≤0 不画）。占 x 23–31、y 21–31
  function hpBadge(c, hp) {
    hp = int(hp); if (hp < 1 || hp > 9) return;
    const low = hp <= 3, mid = hp <= 5;
    R(c, 24, 21, 7, 11, INK); R(c, 23, 22, 9, 9, INK);
    R(c, 24, 22, 7, 9, low ? '#4a1530' : '#3e3d57'); R(c, 24, 22, 7, 1, low ? '#a3263c' : '#5a5a78');
    stamp(c, FONT[hp], 25, 23, low ? '#ff8a5c' : mid ? '#ffc24a' : '#f4f4f8');
  }
  // 左下角载员角标（木箱底色 + 数字；n ≤ 0 不画）。占 x 0–8、y 21–31
  function cargoBadge(c, n) {
    n = int(n); if (n < 1) return; if (n > 9) n = 9;
    R(c, 1, 21, 7, 11, '#5a3a34'); R(c, 0, 22, 9, 9, '#5a3a34');
    R(c, 1, 22, 7, 9, '#e0b070'); R(c, 1, 22, 7, 1, '#fff3c4'); R(c, 1, 30, 7, 1, '#b98250'); R(c, 7, 22, 1, 9, '#b98250');
    stamp(c, FONT[n], 2, 23, '#5a3a34');
  }
  // 左上角 1–3 颗小星
  function stars(c, n) {
    n = Math.min(3, int(n));
    for (let i = 0; i < n; i++) { stampO(c, STAR5, 1 + i * 6, 1, GOLD.m, GOLD.o); R(c, 3 + i * 6, 1, 1, 1, GOLD.h); R(c, 2 + i * 6, 2, 1, 1, GOLD.h); }
  }
  // 格子顶部的占领进度条（progress01 0–1）。占 x 2–29、y 0–5
  function captureBar(c, progress01, pal) {
    pal = normPal(pal);
    const p = clamp01(progress01), w = Math.round(24 * p);
    R(c, 3, 0, 26, 6, INK); R(c, 2, 1, 28, 4, INK);
    R(c, 4, 1, 24, 4, '#3e3d57'); R(c, 4, 1, 24, 1, '#2b2a40');
    if (w > 0) {
      R(c, 4, 1, w, 4, pal.m); R(c, 4, 1, w, 1, pal.h); R(c, 4, 2, w, 1, pal.l); R(c, 4, 4, w, 1, pal.d);
      if (w < 24) R(c, 4 + w - 1, 1, 1, 4, pal.h);         // 进度前沿亮线
    }
    for (let i = 1; i < 4; i++) R(c, 4 + i * 6 - 1, 3, 1, 2, w >= i * 6 ? pal.o : '#5a5a78');   // 四等分刻度
  }

  // 统一包一层：夹住 t、保存并恢复 globalAlpha / fillStyle
  function wrapT(fn) {
    return function (c, t, a, b) {
      if (!c) return;
      const ga = c.globalAlpha, fs = c.fillStyle; baseA = ga === undefined ? 1 : ga;
      try { fn(c, clamp01(t), a, b); } finally { c.globalAlpha = ga; c.fillStyle = fs; baseA = 1; }
    };
  }
  function wrap(fn) {
    return function (c, a, b, d) {
      if (!c) return 0;
      const ga = c.globalAlpha, fs = c.fillStyle; baseA = ga === undefined ? 1 : ga;
      try { return fn(c, a, b, d); } finally { c.globalAlpha = ga; c.fillStyle = fs; baseA = 1; }
    };
  }

  const Fx = {
    explosion: wrapT(explosion), hit: wrapT(hit), muzzle: wrapT(muzzle), splash: wrapT(splash), shell: wrapT(shell), silo: wrapT(silo),
    capture: wrapT(capture), heal: wrapT(heal), levelup: wrapT(levelup), smokePuff: wrapT(smokePuff), dust: wrapT(dust),
    cursor: wrap(cursor), rangeTile: wrap(rangeTile), pathSeg: wrap(pathSeg),
    hpBadge: wrap(hpBadge), cargoBadge: wrap(cargoBadge), stars: wrap(stars), captureBar: wrap(captureBar), digits: wrap(digits),
    rnd: rnd
  };
  Fx.digits.width = digits.width;
  root.AWArtFx = Fx;
})(typeof window !== 'undefined' ? window : globalThis);
