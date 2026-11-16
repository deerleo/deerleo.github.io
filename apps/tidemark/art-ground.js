// 潮汐战线：陆地地形像素画（window.AWArtGround）
// 每个函数签名 (c, info)：c 已平移到该格左上角，1 单位 = 1 逻辑像素，可画 x 0–32、y −8–32。
// 规范见 tools/ART-SPEC.md。只用整数坐标 fillRect。
(function (root) {
  'use strict';
  const G = {};
  const SH = 'rgba(24,32,40,.26)';                    // 投影：整块像素，短
  const GR = ['#7f9248', '#7f9248', '#abbb64', '#c9bf52', '#c9bf52'];   // 草簇、草沿（深橄榄）→ 干草黄
  const DRY = '#c9bf52';
  const TR = { o: '#2e4232', d: '#45603a', m: '#5f7c3c', l: '#a0b048', h: '#a0b048', t: '#4c3c32', T: '#a57c58' };   // 松树
  const SAND = ['#86694c', '#ad8e68', '#dcb276', '#eec88a', '#eec88a'];   // 崖脚 / 土褐暗 / 沙暗 / 沙
  const EARTH = '#c3a374';                                                 // 荒地主色
  const ROCK = ['#474f5c', '#716e72', '#96908a', '#b8afa2'];             // 灰褐岩石：暗面偏蓝灰，亮面偏暖
  const SNOW = ['#b8afa2', '#e9e6df'];
  const ROAD = ['#5c5c62', '#727176', '#96908a', '#a3a199'], LINE = '#ecd27a', ZEBRA = '#e9e6df';   // 深暖灰柏油，细浅色路缘，黄虚线
  const GB = ['#a3b45e', '#a3b45e', '#abbb64', '#b3c26a', '#b3c26a'];   // 草地三级：低洼 / 主色 / 向阳（橄榄绿到黄绿）
  const MET = ['#23282e', '#3a4048', '#5c5c62', '#a3a199', '#e9e6df'];
  const WOOD = ['#4c3c32', '#4c3c32', '#a57c58', '#c39a73'];
  const FOAM = '#ffffff', FILM = '#c5e6e6';
  const BUILD = { hq: 1, city: 1, factory: 1, airport: 1, port: 1, tower: 1, mine: 1, hospital: 1, fort: 1, silo: 1, silo_used: 1, lab: 1, gate: 1 };
  const WATER = { sea: 1, river: 1, reef: 1 };

  // ───────── 工具 ─────────
  function R(c, x, y, w, h, col) { c.fillStyle = col; c.fillRect(x, y, w, h); }
  function P(c, x, y, col) { c.fillStyle = col; c.fillRect(x, y, 1, 1); }
  function hash(x, y, i) {
    let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul((i | 0) + 7, 1274126177);
    h = Math.imul(h ^ (h >>> 13), 1103515245); h ^= h >>> 16;
    h = Math.imul(h, 2246822519); h ^= h >>> 15;
    return (h >>> 0) / 4294967296;
  }
  function vnoise(x, y, s) {
    const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi;
    const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    const a = hash(xi, yi, s), b = hash(xi + 1, yi, s), d = hash(xi, yi + 1, s), e = hash(xi + 1, yi + 1, s);
    return a + (b - a) * sx + (d - a) * sy + (a - b - d + e) * sx * sy;
  }
  // 字符画：rows 是字符串数组，map 把字符映射到颜色，'.' 和空格透明
  function spr(c, rows, map, x, y) {
    let q = rows._runs;                       // 第一次用时把字符画编成 [dx, dy, 长度, 颜色] 的横条，之后直接画
    if (!q || rows._map !== map) {
      q = [];
      for (let j = 0; j < rows.length; j++) {
        const row = rows[j];
        for (let i = 0; i < row.length; i++) {
          const col = map[row[i]];
          if (!col) continue;
          let n = 1; while (i + n < row.length && row[i + n] === row[i]) n++;
          q.push(i, j, n, col); i += n - 1;
        }
      }
      rows._runs = q; rows._map = map;
    }
    for (let k = 0; k < q.length; k += 4) { c.fillStyle = q[k + 3]; c.fillRect(x + q[k], y + q[k + 1], q[k + 2], 1); }
  }
  // 32×32 的布尔蒙版
  const newMask = () => new Uint8Array(1024);
  const at = (m, x, y) => m[(y < 0 ? 0 : y > 31 ? 31 : y) * 32 + (x < 0 ? 0 : x > 31 ? 31 : x)];   // 出界按边缘延伸
  const at0 = (m, x, y) => (x < 0 || y < 0 || x > 31 || y > 31) ? 0 : m[y * 32 + x];              // 出界算空
  function fillM(m, x, y, w, h, v) {
    for (let j = Math.max(0, y); j < Math.min(32, y + h); j++) for (let i = Math.max(0, x); i < Math.min(32, x + w); i++) m[j * 32 + i] = v === undefined ? 1 : v;
  }
  function ellM(m, cx, cy, rx, ry) {
    for (let j = cy - ry; j <= cy + ry; j++) for (let i = cx - rx; i <= cx + rx; i++) {
      if (i < 0 || j < 0 || i > 31 || j > 31) continue;
      const dx = (i - cx) / (rx + 0.5), dy = (j - cy) / (ry + 0.5);
      if (dx * dx + dy * dy <= 1) m[j * 32 + i] = 1;
    }
  }
  const sides = (info, same) => [same(info.nb(0, -1)), same(info.nb(1, 0)), same(info.nb(0, 1)), same(info.nb(-1, 0))];   // 上 右 下 左
  // 一片不规则的区域：和同类相邻的边铺满，其余的边缩进并带毛边
  function areaMask(info, same, inset, seed, rag) {
    const m = newMask(), s = sides(info, same), gx = info.x, gy = info.y;
    rag = rag === undefined ? 3 : rag;
    const off = (side, p) => s[side] ? 0 : inset + ((hash(gx * 4 + side, gy * 16 + ((p + 1) / 3 | 0), seed) * rag) | 0);
    const dg = [same(info.nb(-1, -1)), same(info.nb(1, -1)), same(info.nb(1, 1)), same(info.nb(-1, 1))];   // 左上 右上 右下 左下
    for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
      const t = off(0, x), r = off(1, y), b = off(2, x), l = off(3, y);
      if (y < t || x > 31 - r || y > 31 - b || x < l) continue;
      const ax = x - l, bx = 31 - r - x, ay = y - t, by = 31 - b - y;
      if (!s[0] && !s[3] && ax + ay < 4) continue;
      if (!s[0] && !s[1] && bx + ay < 4) continue;
      if (!s[2] && !s[1] && bx + by < 4) continue;
      if (!s[2] && !s[3] && ax + by < 4) continue;
      if (s[0] && s[3] && !dg[0] && x + y < 3) continue;
      if (s[0] && s[1] && !dg[1] && (31 - x) + y < 3) continue;
      if (s[2] && s[1] && !dg[2] && (31 - x) + (31 - y) < 3) continue;
      if (s[2] && s[3] && !dg[3] && x + (31 - y) < 3) continue;
      m[y * 32 + x] = 1;
    }
    return m;
  }
  function paintM(c, m, col) {
    c.fillStyle = col;
    for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
      if (!m[y * 32 + x]) continue;
      let n = 1; while (x + n < 32 && m[y * 32 + x + n]) n++;
      c.fillRect(x, y, n, 1); x += n - 1;
    }
  }

  // ───────── 底层地表 ─────────
  // 每格逐像素算：草地（跨格连续的大尺度明暗）+ 各种地面材质（沙、山脚碎石、林下、沼泽、荒地、废墟地坪、建筑铺地）。
  // 材质的边界 = 到“同类格子连成的区域”的带符号距离 + 按世界坐标的噪声，所以交界线是圆角、参差的，
  // 而且两侧的格子算的是同一条线：草会伸进荒地，荒地也会伸进草地，看不出格子。
  const FW = 34, INF = 99;
  const hyp = (a, b) => Math.sqrt(a * a + b * b);
  const c32 = hex => { const n = parseInt(hex.slice(1), 16); return ((255 << 24) | ((n & 255) << 16) | (n & 0xff00) | (n >> 16 & 255)) >>> 0; };
  const GB32 = GB.map(c32);
  const grassT = (wx, wy) => vnoise(wx / 80, wy / 80, 3) * 0.72 + vnoise(wx / 28, wy / 28, 9) * 0.28;
  const bandOf = t => t < 0.4 ? 0 : t < 0.6 ? 2 : 4;
  function grassBand(wx, wy) { return bandOf(grassT(wx, wy)); }
  const wob = (wx, wy, seed, amp) => (vnoise(wx / 10, wy / 10, seed) - 0.5) * amp * 1.8;
  // 平滑噪声在一格里先按 step 像素的粗网格取样，再双线性插到每个像素：比逐像素算快一个量级，跨格仍然连续
  function coarse(X0, Y0, step, fn, out) {
    const n = 32 / step + 1, g = new Float32Array(n * n);
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) g[j * n + i] = fn(X0 + i * step, Y0 + j * step);
    out = out || new Float32Array(1024);
    for (let y = 0; y < 32; y++) {
      const gj = (y / step) | 0, fy = (y - gj * step) / step;
      for (let x = 0; x < 32; x++) {
        const gi = (x / step) | 0, fx = (x - gi * step) / step, k = gj * n + gi;
        const a = g[k], b = g[k + 1], c2 = g[k + n], d = g[k + n + 1];
        out[y * 32 + x] = a + (b - a) * fx + (c2 - a) * fy + (a - b - c2 + d) * fx * fy;
      }
    }
    return out;
  }
  const tmpT = new Float32Array(1024), tmpW = new Float32Array(1024);
  const clus = (wx, wy, seed) => vnoise(wx / 2.3, wy / 2.3, seed);
  // 本格每个像素到“满足 pred 的相邻格”的距离；外角自然变圆，内角按半径 R 倒圆
  function field(nbT, pred) {
    const f = new Float32Array(FW * FW), Pn = [];
    for (let k = 0; k < 9; k++) Pn.push(k === 4 ? false : !!pred(nbT[k]));
    const pNW = Pn[0], pN = Pn[1], pNE = Pn[2], pW = Pn[3], pE = Pn[5], pSW = Pn[6], pS = Pn[7], pSE = Pn[8];
    if (!(pNW || pN || pNE || pW || pE || pSW || pS || pSE)) { f.fill(INF); return f; }
    const Rr = 12;
    for (let py = -1; py <= 32; py++) for (let px = -1; px <= 32; px++) {
      const cx = px + 0.5, cy = py + 0.5, ex = 32 - cx, ey = 32 - cy;
      const dN = pN ? cy : INF, dS = pS ? ey : INF, dW = pW ? cx : INF, dE = pE ? ex : INF;
      let d = Math.min(dN, dS, dW, dE);
      const mx = Math.max(cx, 0), my = Math.max(cy, 0), nx = Math.max(ex, 0), ny = Math.max(ey, 0);
      if (pNW) d = Math.min(d, hyp(mx, my)); if (pNE) d = Math.min(d, hyp(nx, my));
      if (pSW) d = Math.min(d, hyp(mx, ny)); if (pSE) d = Math.min(d, hyp(nx, ny));
      if (pN && pW && dN < Rr && dW < Rr) d = Math.min(d, Rr - hyp(Rr - dN, Rr - dW));
      if (pN && pE && dN < Rr && dE < Rr) d = Math.min(d, Rr - hyp(Rr - dN, Rr - dE));
      if (pS && pW && dS < Rr && dW < Rr) d = Math.min(d, Rr - hyp(Rr - dS, Rr - dW));
      if (pS && pE && dS < Rr && dE < Rr) d = Math.min(d, Rr - hyp(Rr - dS, Rr - dE));
      f[(py + 1) * FW + px + 1] = d;
    }
    return f;
  }
  const K = {
    sand: c32(SAND[3]), sandD: c32(SAND[2]),
    fl1: c32(GB[0]), fl2: c32(GB[0]),
    d0: c32(SAND[1]), d1: c32(EARTH), d2: c32(EARTH), dA: c32('#b8996e'), lip: c32(GR[0]),
    pv: c32(ROCK[3]), pvHi: c32(ROCK[3]), pvD: c32(ROCK[2]),
  };

  // 每种材质：[名字, 哪些格子算这种材质, 噪声种子, 边界抖动幅度, 往里收多少, 上色函数(v, lit, wx, wy, band) → 颜色或 0]
  const MATS = [
    ['sand', t => t === 'beach', 61, 6, 0.5, (v, lit, wx, wy) => v > 0 ? (v < 1.2 ? K.sandD : K.sand) : 0],
    ['shore', t => false, 0, 0, 0, (v, lit, wx, wy) => {
      if (v < -7) return 0;
      const n = G._shoreN(wx, wy), reach = (n - 0.55) * 14;
      return -v < reach ? (-v > reach - 1.1 ? K.sandD : K.sand) : 0;
    }],
    // 山地：整片是一块抬起来的岩体。北、西两侧是一道亮沿，南、东两侧露出山脚的立面（像海岸土崖那样）
    ['rock', t => t === 'mountain', 75, 3.5, 2, () => 0],
    ['forest', t => t === 'forest', 73, 3.5, 2.5, (v, lit, wx, wy, band) => {
      return 0;                 // 林下不另铺地色：松树直接长在草地上
    }],
    ['swamp', t => t === 'swamp', 69, 3.5, 1, () => 0],          // 沼泽的水洼由 G.swamp 按这张距离图画
    ['waste', t => t === 'waste', 63, 3.5, 1.5, (v, lit, wx, wy, band) => {
      if (v > 0) {
        if (lit) { if (v < 1) return K.lip; if (v < 2.4) return K.d0; }      // 荒地比草地低一截：北、西两侧露出土坎
        else if (v < 1.1) return K.d2;
        return vnoise(wx / 20, wy / 15, 33) * 0.6 + vnoise(wx / 5, wy / 3.5, 31) * 0.4 > 0.58 ? K.dA : K.d1;      // 深一点的土斑，小块、横向
      }
      return 0;
    }],
    ['ruins', t => t === 'ruins', 67, 3.5, 2.5, (v, lit, wx, wy, band) => {
      return 0;                 // 废墟不铺地坪：整格的灰底衬在断墙后面会读成屋顶；瓦砾由废墟自己画在墙脚
    }],
    ['pave', t => !!BUILD[t] && t !== 'port', 77, 2, 5.5, (v, lit, wx, wy) => {
      if (v > 0) {
        return v < 1.2 ? (lit ? K.pvHi : K.pvD) : K.pv;
      }
      return 0;
    }],
  ];
  function buildBase(info, nbT) {
    const img = new ImageData(32, 32), buf = new Uint32Array(img.data.buffer);
    const X0 = info.x * 32, Y0 = info.y * 32, sd = {}, band = new Uint8Array(1024);
    coarse(X0, Y0, 8, grassT, tmpT);
    for (let i = 0; i < 1024; i++) { const b = bandOf(tmpT[i]); band[i] = b; buf[i] = GB32[b]; }
    for (const [name, pred, seed, amp, bias, paint] of MATS) {
      let any = false; for (let k = 0; k < 9; k++) if (pred(nbT[k])) any = true;
      if (!any) continue;
      const inside = !!pred(nbT[4]);
      const f = field(nbT, inside ? t => !pred(t) : pred), s = new Float32Array(1024);
      if (amp) coarse(X0, Y0, 4, (wx, wy) => wob(wx, wy, seed, amp), tmpW); else tmpW.fill(0);
      for (let py = 0; py < 32; py++) for (let px = 0; px < 32; px++) {
        const fi = (py + 1) * FW + px + 1, k = py * 32 + px, d = f[fi];
        let v = inside ? d : -d;
        if (d < 16) v += tmpW[k];
        v -= bias; s[k] = v;
        if (v < -8) continue;
        const col = paint(v, f[fi - FW - 1] < d - 0.3, X0 + px, Y0 + py, band[k]);
        if (col) buf[k] = col;
      }
      sd[name] = s;
    }
    return { img, buf, sd, band };
  }
  const baseCache = new Map();
  let bScr = null, bCtx = null;
  const WIDE = { hq: 1, city: 1, factory: 1, hospital: 1, fort: 1 };
  // 画底层并返回 { sd: 各材质的带符号距离（>0 在材质里面）, band: 草地明暗级 }
  function grassBase(c, info) {
    const nbT = [];
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) nbT.push((dx || dy) ? (info.nb(dx, dy) || info.type) : info.type);
    const key = info.x + '|' + info.y + '|' + nbT.join(',');
    let B = baseCache.get(key);
    if (!B) { if (baseCache.size > 4500) baseCache.clear(); B = buildBase(info, nbT); baseCache.set(key, B); }
    if (!bScr) { bScr = document.createElement('canvas'); bScr.width = bScr.height = 32; bCtx = bScr.getContext('2d'); }
    if (c.putPixels) c.putPixels(B.buf);                 // 壳层的像素缓冲：直接拷过去
    else { bCtx.putImageData(B.img, 0, 0); c.drawImage(bScr, 0, 0); }
    // 左邻的高东西（建筑、山）投到本格的影子：全图一个方向，朝右下
    const l = nbT[3], me = nbT[4];
    if (info.x > 0 && l !== me) {
      const hs = null;   // 投影收短了，不再拖到右邻格
      if (hs) hs.forEach((h, i) => R(c, i, 31 - h, 1, h, SH));
    }
    return B;
  }
  // 给水域模块用：同一套草色和沙草交界，河岸、沙滩才能和陆地对上
  G._grass32 = (wx, wy) => GB32[grassBand(wx, wy)];
  G._grassTile = (X0, Y0, out) => { coarse(X0, Y0, 8, grassT, tmpT); for (let i = 0; i < 1024; i++) out[i] = GB32[bandOf(tmpT[i])]; return out; };   // 整格的草色（水域模块画岸上的草用）
  G._coarse = coarse;
  G._sandEdge = (wx, wy) => wob(wx, wy, 61, 6) - 0.5;
  G._shoreN = (wx, wy) => vnoise(wx / 6, wy / 6, 81) * 0.7 + vnoise(wx / 2.5, wy / 2.5, 82) * 0.3;   // 海岸线上：大于 0.55 沙伸进草地，小于 0.45 草压到沙上
  function tuft(c, x, y, tall) {
    P(c, x, y, GR[0]); P(c, x + 2, y, GR[0]); P(c, x + 1, y + 1, GR[0]);
    if (tall) { P(c, x + 1, y - 1, GR[0]); P(c, x + 3, y + 1, GR[0]); }
  }
  // 撒 n 簇草；ok(x, y) 返回 false 的位置跳过
  function tufts(c, info, n, seed, ok) {
    for (let i = 0; i < n; i++) {
      const x = 1 + ((info.rnd(seed + i * 3) * 27) | 0), y = 2 + ((info.rnd(seed + i * 3 + 1) * 26) | 0);
      if (hash(info.x * 5 + i, info.y, 88) > 0.34) continue;                    // 点缀减到三分之一
      if (ok && !(ok(x, y) && ok(x + 2, y + 1))) continue;
      tuft(c, x, y, info.rnd(seed + i * 3 + 2) > 0.7);
    }
  }
  // 一小片干草：几道浅黄的短划，成簇
  const DRY_PTS = [[0, 2], [3, 0], [4, 3], [7, 1], [8, 4], [2, 5], [6, 6], [10, 3]];
  function dry(c, x, y, seed, n) {
    for (let i = 0; i < (n || 8); i++) {
      if (hash(x + i * 3, y, seed) < 0.25) continue;
      const p = DRY_PTS[i]; R(c, x + p[0], y + p[1], 2, 1, DRY);
      if (i & 1) P(c, x + p[0] + 2, y + p[1] - 1, DRY);
    }
  }
  const ROCK_BIG = ['..lll...', '.llhhdd.', 'llhhdddo', 'lhhddddo', '.oddddoo', '..ooooo.'];
  const ROCK_MID = ['.lhd..', 'lhhddo', 'lhdddo', '.oooo.'], ROCK_SM = ['lhd', 'ddo'];
  const ROCK_MAP = { h: ROCK[3], l: ROCK[2], d: ROCK[1], o: ROCK[0] };
  // big: true / 2 大石、1 中石、false 小石
  function rock(c, x, y, big) {
    if (big === true || big === 2) { R(c, x + 2, y + 5, 7, 1, SH); R(c, x + 7, y + 3, 2, 2, SH); spr(c, ROCK_BIG, ROCK_MAP, x, y); }
    else if (big === 1) { R(c, x + 1, y + 4, 6, 1, SH); spr(c, ROCK_MID, ROCK_MAP, x, y); }
    else { R(c, x + 1, y + 2, 3, 1, SH); spr(c, ROCK_SM, ROCK_MAP, x, y); }
  }
  // 一堆石头：一大一中一小挤在一起
  function rocks(c, x, y, n) {
    if (n >= 3) rock(c, x + 6, y - 2, 1);
    rock(c, x, y, true);
    if (n >= 2) rock(c, x + 8, y + 3, false);
  }
  G.plain = function (c, info) {
    grassBase(c, info);
    const r = info.rnd, v = (r(40) * 12) | 0;
    // 挨着森林、山的一侧：小松树、碎石零星地散过来，把两种地形串起来
    [[0, -1], [1, 0], [0, 1], [-1, 0]].forEach((d, i) => {
      const n = info.nb(d[0], d[1]);
      if (n !== 'forest' && n !== 'mountain') return;
      if (r(150 + i) < 0.62) return;
      const a = 5 + ((r(154 + i * 4) * 22) | 0), b = 3 + ((r(170 + i * 4) * 4) | 0);
      const x = i === 1 ? 28 - b : i === 3 ? b + 1 : a, y = i === 0 ? b + 5 : i === 2 ? 31 - b : a + 2;
      if (n === 'forest') tree(c, 3, x, y); else rock(c, x - 2, y - 3, r(186 + i * 4) > 0.5 ? 1 : false);
    });
    const px = 4 + ((r(42) * 17) | 0), py = 6 + ((r(43) * 17) | 0);
    if (v <= 3) dry(c, px, py, 3);                                   // 干草斑
    else if (v === 4) { dry(c, px, py, 3, 5); dry(c, (px + 14) % 20 + 2, (py + 12) % 20 + 4, 5, 5); }
    else if (v === 5) rocks(c, Math.min(px, 16), py, 2 + ((r(44) * 2) | 0));     // 石堆
    else if (v === 6) { rock(c, px, py, 1); tuft(c, px + 8, py + 4, false); }
    else if (v === 7) { tuft(c, px, py, true); tuft(c, px + 6, py + 3, false); if (r(49) > 0.5) tuft(c, px + 2, py + 7, false); }
    else if (v === 8 && r(44) > 0.45) { tree(c, 3, px + 3, py + 6); if (r(45) > 0.6) tree(c, 3, px + 9, py + 9); }   // 一两棵小树苗
  };

  // ───────── 森林 ─────────
  // 松树是算出来的：一层层往下变宽的三角，每层底边压暗，左侧受光、右侧背光，深色轮廓，底下一截树干
  function pine(prof) {
    let mw = 0; for (const p of prof) mw = Math.max(mw, Math.abs(p));
    const W = mw * 2 + 1, rows = [];
    prof.forEach((p, j) => {
      const hw = Math.abs(p), bot = p < 0 || Object.is(p, -0);
      let row = '';
      for (let x = 0; x < W; x++) {
        const dx = x - mw, a = Math.abs(dx);
        if (a > hw) { row += '.'; continue; }
        let ch;
        if (a === hw) ch = j === 0 ? 'l' : dx < 0 && !bot ? 'd' : 'o';
        else if (bot) ch = dx < -1 ? 'm' : dx < hw - 2 ? 'd' : 'o';
        else if (dx < 0) ch = 'l'; else if (dx <= hw * 0.35) ch = 'm'; else ch = 'd';
        row += ch;
      }
      rows.push(row);
    });
    const pad = '.'.repeat(mw - 1);
    rows.push(pad + 'otT' + pad.slice(1), pad + 'otT' + pad.slice(1));
    rows.hw = mw;
    return rows;
  }
  // 负数 = 这一层的底边
  const PINES = [
    pine([0, 1, 1, 2, 3, -4, 2, 3, 4, 5, -6, 3, 4, 5, 6, 7, -8, 6, 7, -8]),                 // 0 大（约 22 高）
    pine([0, 1, 2, 3, -4, 2, 3, 4, 5, -6, 4, 5, 6, -7]),                                    // 1 中（约 16 高）
    pine([0, 1, 2, -3, 1, 3, -4, 2, 4, 5, -5]),                                             // 2 小
    pine([0, 1, -2, 1, 2, -3]),                                                             // 3 小树苗
    pine([0, 1, 2, 3, -4, 2, 3, 4, 5, -6, 3, 5, 6, 7, -8, 5, 6, 7, 8, 9, -10, 7, 8, 9, -10]),   // 4 最大（约 26 高，接近一格）
  ];
  // kind: 0/1 大松 2 中松 3 小树苗 4 最大；(bx, by) 是树根位置
  function tree(c, kind, bx, by) {
    const rows = PINES[kind] || PINES[0], hw = rows.hw;
    R(c, bx - hw + 2, by - 1, hw * 2 + 1, 2, SH); R(c, bx - hw + 4, by + 1, hw * 2 - 2, 1, SH);
    spr(c, rows, TR, bx - hw, by - rows.length + 1);
  }
  G.forest = function (c, info) {
    const F = t => t === 'forest', s = sides(info, F), r = info.rnd;
    const B = grassBase(c, info), fs = B.sd.forest;
    tufts(c, info, 3, 80, (x, y) => fs[y * 32 + x] < -1);
    // 一格三到五棵：后排两棵、前排一两棵，大小三档；贴着非森林一侧的往里收，角上的可能不种
    const slots = [[8, 17], [24, 15], [15, 30], [28, 31], [3, 28]];
    const list = [];
    slots.forEach((p, i) => {
      let x = p[0], y = p[1], k = 0;
      if (x <= 8 && !s[3]) { x += 3; k++; } if (x >= 24 && !s[1]) { x -= 4; k++; }
      if (y <= 17 && !s[0]) { y += 3; k++; } if (y >= 28 && !s[2]) { y -= 2; k++; }
      if (i >= 3 && (k >= 1 || r(100 + i) < 0.45)) return;          // 第四、五棵只在林子里面偶尔有
      if (k >= 2 && r(100 + i) < 0.4) return;
      x += ((r(110 + i) * 5) | 0) - 2; y += ((r(120 + i) * 3) | 0) - 1;
      const q = r(130 + i);
      let kind = i === 2 ? (q < 0.55 ? 4 : 0) : i < 2 ? (q < 0.5 ? 0 : q < 0.8 ? 1 : 4) : (q < 0.5 ? 1 : 2);
      if (kind === 4 && !s[0] && y < 24) kind = 0;                   // 上面不是森林：别探出去太多
      if (k >= 1 && kind === 4) kind = 0;
      list.push([x, y, kind]);
    });
    if (!s[2] && r(140) > 0.5) list.push([4 + ((r(141) * 24) | 0), 31, 3]);
    if (!s[3] && r(142) > 0.6) list.push([3, 20 + ((r(143) * 6) | 0), 3]);
    list.sort((a, b) => a[1] - b[1]);
    for (const t of list) tree(c, t[2], t[0], t[1]);
  };

  // ───────── 山地 ─────────
  const ZIG = [0, 1, 1, 2, 1, 0], SNOW_Z = [0, 2, 1, 3, 1, 2, 0, 1];
  // 一座山峰：(cx, base) 是山脚中点，hw 半宽，h 高（可以探出格子，画的时候按格子裁）。
  // 主棱线从山顶往右下折着走，左亮右暗；左、右各有一道支棱，把两面再各分成两块：一共四个棱面、三级灰褐加最深的轮廓。snow：顶上一截雪
  function mount(c, cx, base, hw, h, snow, seed, dark, foot) {
    const peakY = base - h, snowH = Math.round(h * 0.27), s1 = Math.round(h * 0.42), s2 = Math.round(h * 0.34);
    const L = dark ? ROCK[2] : ROCK[3], M2 = dark ? ROCK[1] : ROCK[2], D = ROCK[1], O = ROCK[0];
    for (let x = Math.max(0, cx - hw); x <= Math.min(31, cx + hw); x++) {
      const ax = Math.abs(x - cx), t = ax / (hw + 0.5);
      const top = Math.round(base - h * (1 - Math.pow(t, 1.08)));
      let run = '', ry = 0;                                    // 同色的竖条合成一次 fillRect
      const y1 = Math.min(base, 32);
      for (let y = Math.max(top, -16); y < y1; y++) {
        const dy = y - peakY, rx = x - cx;
        const ridge = Math.round(dy * 0.12) + ZIG[(dy >> 1) % 6];
        const lit = rx < ridge;
        let col;
        if (lit) col = (dy > s1 && rx < ridge - 2 - (dy - s1) * 0.7) ? M2 : L;                  // 左面：支棱外侧是中灰
        else { const e = rx - ridge - 3 - (dy - s2) * 0.55; col = (dy > s2 && e >= 0 && e < 3 + (dy - s2) * 0.18) ? M2 : D; }   // 右面：一道受光的支棱
        if (snow && dy < snowH + SNOW_Z[(x + seed) & 7]) col = lit ? SNOW[1] : SNOW[0];
        if (y === top || (foot && y === base - 1)) col = O;
        if (col !== run) { if (run) R(c, x, ry, 1, y - ry, run); run = col; ry = y; }
      }
      if (run) R(c, x, ry, 1, y1 - ry, run);
    }
  }
  // 一格一座大峰为主：比格子宽一圈（左右是山地时伸到邻格里，两格各画落在自己范围里的那部分）、探出格顶；三成的格子是一大一小。
  // 相邻山地格的交界上还有一座靠后的“后排峰”，把两座大峰之间的豁口填上；山脚都落在格底，朝外的一侧连成一条山脚线加碎石带；
  // 下面还是山地时不画山脚线，下一排的大峰探上来挡住这一排的山脚。大片山地内部在豁口最上面垫一条暗岩，不露草地。
  const hsh = (x, y, i) => hash(x * 3 + i, y * 5 - i, 90 + i);
  // 某一格的山峰（坐标相对那一格的左上角）。lm / rm：那一格的左、右是不是山地
  function peaksOf(gx, gy, lm, rm, um) {
    const out = [], two = hsh(gx, gy, 2) < 0.3, flip = hsh(gx, gy, 3) < 0.5, low = hsh(gx, gy, 7) < 0.3;
    const lo = lm ? -5 : 1, hi = rm ? 36 : 30;
    const h = (low ? 28 : um ? 37 : 33) + ((hsh(gx, gy, 4) * (um && !low ? 10 : 7)) | 0), z = 1 + hsh(gx, gy, 9);   // 上面也是山地：可以探出半格，前后排咬在一起
    let hw = Math.min(two ? 14 : 16 + ((hsh(gx, gy, 8) * 4) | 0), (hi - lo) >> 1);
    let cx = two ? (flip ? 20 : 11) : lo + hw + ((hsh(gx, gy, 6) * (hi - lo - 2 * hw + 1)) | 0);
    cx = Math.max(lo + hw, Math.min(hi - hw, cx));
    out.push([z, cx, hw, two ? h - 2 : h, h >= 30, gx & 7, false]);
    if (two) out.push([3 + hsh(gx, gy, 10), flip ? 6 : 25, 7, 14 + ((hsh(gx, gy, 5) * 6) | 0), false, (gx + 3) & 7, false]);   // 小的在前面偏一侧
    return out;
  }
  G.mountain = function (c, info) {
    const gx = info.x, gy = info.y, M = (dx, dy) => info.nb(dx, dy) === 'mountain';
    grassBase(c, info);
    const L0 = M(-1, 0), R0 = M(1, 0), U0 = M(0, -1), D0 = M(0, 1);
    if (U0 && L0 && M(-1, -1)) R(c, 0, 0, 16, 10, ROCK[1]);
    if (U0 && R0 && M(1, -1)) R(c, 16, 0, 16, 10, ROCK[1]);
    if (!D0) R(c, 3, 31, 28, 1, SH);
    const list = [];
    // 后排峰：格子左、右两条边上各一座，按边的位置取随机数，两格画出来的是同一座
    const back = (bx, wx, foot, um) => { const q = hsh(wx, gy, 1); list.push([0, bx + ((q * 53) | 0) % 5 - 2, 14 + ((q * 7) | 0) % 3, (um ? 34 : 28) + ((q * 13) | 0) % (um ? 13 : 9), q > 0.5, wx & 7, true, foot]); };
    if (L0) back(0, gx, !D0 || !M(-1, 1), U0 && M(-1, -1));
    if (R0) back(32, gx + 1, !D0 || !M(1, 1), U0 && M(1, -1));
    for (let dx = -1; dx <= 1; dx++) {
      if (dx && !M(dx, 0)) continue;
      for (const p of peaksOf(gx + dx, gy, M(dx - 1, 0), M(dx + 1, 0), M(dx, -1))) list.push([p[0], p[1] + dx * 32, p[2], p[3], p[4], p[5], p[6], !M(dx, 1)]);
    }
    list.sort((a, b) => a[0] - b[0]);
    for (const p of list) mount(c, p[1], p[7] ? 31 : 32, p[2], p[3], p[4], p[5], p[6], p[7]);
    // 山脚的碎石带：只放在朝外（下面不是山）的一侧
    if (!D0) {
      const r = info.rnd;
      rock(c, 1 + ((r(21) * 8) | 0), 29, r(23) > 0.5 ? 1 : false);
      rock(c, 14 + ((r(22) * 6) | 0), 30, false);
      if (r(20) > 0.4) rock(c, 23 + ((r(24) * 5) | 0), 29, r(25) > 0.6 ? 1 : false);
    }
  };

  // ───────── 道路 ─────────
  // 桥的走向：沿两个方向各走到头，看两端接的是路（3）、陆地（1）还是水（0）
  function endScore(nb, ox, oy, dx, dy) {
    for (let i = 1; i < 14; i++) {
      const n = nb(ox + dx * i, oy + dy * i);
      if (n === 'bridge') continue;
      if (n === 'road' || BUILD[n]) return 3;
      return WATER[n] ? 0 : 1;
    }
    return 0;
  }
  function bridgeHoriz(nb, ox, oy) {
    const h = endScore(nb, ox, oy, -1, 0) + endScore(nb, ox, oy, 1, 0), v = endScore(nb, ox, oy, 0, -1) + endScore(nb, ox, oy, 0, 1);
    return h >= v;
  }
  function link(info, dx, dy) {
    const n = info.nb(dx, dy);
    if (n === 'road' || BUILD[n]) return true;
    if (n === 'bridge') return bridgeHoriz(info.nb, dx, dy) === (dx !== 0);
    return false;
  }
  function asphalt(c, info, x, y) {
    const h = hash(info.x * 32 + (x >> 1), info.y * 32 + y, 14);
    P(c, x, y, ROAD[1]);
  }
  // 把蒙版 m 画成柏油路：路缘不是一条死线——上左受光、下右压暗，间或被土和草咬掉一口；路外侧有宽窄不一的土路肩
  function paintRoad(c, info, m, skip) {
    const gx = info.x * 32, gy = info.y * 32;
    for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
      const wx = gx + x, wy = gy + y;
      if (!m[y * 32 + x]) {
        if (skip && skip[y * 32 + x] > 0) continue;
        const d1 = at(m, x - 1, y) || at(m, x + 1, y) || at(m, x, y - 1) || at(m, x, y + 1);
        const d2 = d1 || at(m, x - 2, y) || at(m, x + 2, y) || at(m, x, y - 2) || at(m, x, y + 2) || at(m, x - 1, y - 1) || at(m, x + 1, y - 1) || at(m, x - 1, y + 1) || at(m, x + 1, y + 1);
        if (!d2 && !(at(m, x - 3, y) || at(m, x + 3, y) || at(m, x, y - 3) || at(m, x, y + 3))) continue;
        const n = vnoise(wx / 5, wy / 5, 15);
        continue;
      }
      const e1 = !at(m, x - 1, y) || !at(m, x + 1, y) || !at(m, x, y - 1) || !at(m, x, y + 1) ||
        !at(m, x - 1, y - 1) || !at(m, x + 1, y - 1) || !at(m, x - 1, y + 1) || !at(m, x + 1, y + 1);
      if (e1) {
        const n = vnoise(wx / 3.5, wy / 3.5, 17);
        P(c, x, y, (!at(m, x, y + 1) || !at(m, x + 1, y)) && at(m, x, y - 1) && at(m, x - 1, y) ? ROAD[2] : ROAD[3]);
        continue;                                   // n < 0.2：留着底下的草
      }
      const litE = !at(m, x, y - 2) || !at(m, x - 2, y) || !at(m, x - 2, y - 2) || !at(m, x - 1, y - 2) || !at(m, x - 2, y - 1);
      const drkE = !at(m, x, y + 2) || !at(m, x + 2, y) || !at(m, x + 2, y + 2) || !at(m, x + 1, y + 2) || !at(m, x + 2, y + 1) || !at(m, x + 2, y - 2) || !at(m, x - 2, y + 2);
      asphalt(c, info, x, y);
    }
  }
  G.road = function (c, info) {
    const aU = link(info, 0, -1), aR = link(info, 1, 0), aD = link(info, 0, 1), aL = link(info, -1, 0), r = info.rnd;
    // 通到建筑的一侧只铺车道；标线和路口按真正的路来算
    const U = aU && !BUILD[info.nb(0, -1)], Rt = aR && !BUILD[info.nb(1, 0)], Dn = aD && !BUILD[info.nb(0, 1)], L = aL && !BUILD[info.nb(-1, 0)];
    const n = U + Rt + Dn + L;
    const B = grassBase(c, info);
    const m = newMask();
    // 拐弯画成四分之一圆环（圆心在两条路夹着的那个格角），连续拐弯就是一条 S 形的弯路，不是直角折线
    const curve = (aU + aR + aD + aL) === 2 && !(aU && aD) && !(aL && aR);
    const ccx = aL ? 0 : 32, ccy = aU ? 0 : 32;
    if (curve) {
      for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) { const rr = hyp(x + 0.5 - ccx, y + 0.5 - ccy); if (rr >= 7 && rr < 25) m[y * 32 + x] = 1; }
    } else {
      fillM(m, 7, 7, 18, 18);
      if (aU) fillM(m, 7, 0, 18, 7); if (aR) fillM(m, 25, 7, 7, 18); if (aD) fillM(m, 7, 25, 18, 7); if (aL) fillM(m, 0, 7, 7, 18);
      const cut = (cx, cy, sx, sy) => { for (let a = 0; a < 4; a++) for (let b = 0; a + b < 4; b++) if (!(a + b === 3 && a && b)) m[(cy + b * sy) * 32 + cx + a * sx] = 0; };
      if (!aU && !aL) cut(7, 7, 1, 1); if (!aU && !aR) cut(24, 7, -1, 1); if (!aD && !aR) cut(24, 24, -1, -1); if (!aD && !aL) cut(7, 24, 1, -1);
      // 丁字、十字的内角倒一个小圆角
      const fillet = (ox, oy) => { for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) if (hyp(x + 0.5 - (ox ? 4 : 0), y + 0.5 - (oy ? 4 : 0)) >= 4) m[((oy ? 25 : 3) + y) * 32 + (ox ? 25 : 3) + x] = 1; };
      if (aU && aL) fillet(0, 0); if (aU && aR) fillet(1, 0); if (aD && aL) fillet(0, 1); if (aD && aR) fillet(1, 1);
    }
    tufts(c, info, 4, 80, (x, y) => !at(m, x - 2, y - 2) && !at(m, x + 4, y + 3) && !at(m, x + 4, y - 2) && !at(m, x - 2, y + 3));
    paintRoad(c, info, m, null);
    // 标线
    const dashH = x0 => R(c, x0, 16, 4, 1, LINE), dashV = y0 => R(c, 16, y0, 1, 4, LINE);
    if (curve) {    // 弯道：中线沿着圆弧走，虚线的节奏和直路接得上
      for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
        const dx = Math.abs(x + 0.5 - ccx), dy = Math.abs(y + 0.5 - ccy), rr = hyp(dx, dy);
        if (rr < 16 || rr >= 17.1) continue;
        const sl = Math.atan2(dy, dx) * 16;
        if ((((sl - 2.3) % 8.2) + 8.2) % 8.2 < 4.2) P(c, x, y, LINE);
      }
    } else if (n >= 3) {   // 丁字、十字：路口留空，四边画斑马线
      const zeb = (x, y, w, h) => R(c, x, y, w, h, ZEBRA);
      if (L) for (let y = 10; y <= 22; y += 3) zeb(3, y, 4, 1);
      if (Rt) for (let y = 10; y <= 22; y += 3) zeb(25, y, 4, 1);
      if (U) for (let x = 10; x <= 22; x += 3) zeb(x, 3, 1, 4);
      if (Dn) for (let x = 10; x <= 22; x += 3) zeb(x, 25, 1, 4);
    } else {
      if (L) { dashH(2); if (Rt || n === 1) dashH(10); }
      if (Rt) { dashH(26); if (L || n === 1) dashH(18); }
      if (U) { dashV(2); if (Dn || n === 1) dashV(10); }
      if (Dn) { dashV(26); if (U || n === 1) dashV(18); }
    }
    // 偶尔的裂缝、井盖、补丁（只放在直路和断头上，避开标线）
    const q = r(30);
    if (!curve && n <= 2 && ((L && Rt) || (U && Dn) || n === 1)) {
      const vert = (U || Dn) && !(L || Rt);
      const pt = (a, b, col) => vert ? P(c, b, a, col) : P(c, a, b, col);
      const a0 = 6 + ((r(31) * 16) | 0), side = r(32) > 0.5 ? 10 : 18;
      if (q < 0.16) {          // 井盖
        const rc = (a, b, w, h, col) => vert ? R(c, b, a, h, w, col) : R(c, a, b, w, h, col);
        rc(a0 + 1, side, 2, 4, ROAD[0]); rc(a0, side + 1, 4, 2, ROAD[0]);
        rc(a0 + 1, side + 1, 2, 2, ROAD[2]); pt(a0 + 1, side + 1, ROAD[3]);
      } else if (q < 0.4) {    // 裂缝
        let b = side + 1;
        for (let i = 0; i < 6; i++) { pt(a0 + i, b, ROAD[0]); if (hash(info.x + i, info.y, 33) > 0.5) b += hash(info.x, info.y + i, 34) > 0.5 ? 1 : -1; b = Math.max(side - 1, Math.min(side + 3, b)); }
      } else if (q < 0.5) {    // 补过的路面
        const rc = (a, b, w, h, col) => vert ? R(c, b, a, h, w, col) : R(c, a, b, w, h, col);
        rc(a0, side, 5, 3, ROAD[2]); rc(a0, side + 3, 5, 1, ROAD[0]);
      }
    }
  };

  // ───────── 桥（只画桥面；水由 AWArtWater.base 垫好）─────────
  // 按横向画，竖向的整体转置。endA / endB：左（上）端、右（下）端是不是桥头
  function bridgeSteel(c, info, endA, endB) {
    const f = info.frame;
    R(c, 0, 28, 32, 3, SH);
    // 桥墩
    for (const x of [5, 21]) {
      R(c, x, 26, 6, 4, ROCK[2]); R(c, x, 26, 6, 1, ROCK[3]); R(c, x + 5, 26, 1, 4, ROCK[1]); R(c, x, 29, 6, 1, ROCK[1]);
      P(c, x - 1, 29, (f & 1) ? FOAM : FILM); P(c, x + 6, 29, (f & 1) ? FILM : FOAM);
      if (f >= 2) P(c, x + 2, 30, FOAM);
    }
    // 钢梁侧面
    R(c, 0, 26, 32, 2, MET[1]); R(c, 0, 27, 32, 1, MET[0]);
    for (let x = 3; x < 32; x += 4) P(c, x, 26, MET[3]);
    // 桥面
    R(c, 0, 9, 32, 14, ROAD[1]);
    for (let y = 9; y < 23; y++) for (let x = 0; x < 32; x++) { const h = hash(info.x * 32 + (x >> 1), info.y * 32 + y, 14); if (h < 0.05) P(c, x, y, ROAD[2]); }
    R(c, 0, 9, 1, 14, ROAD[0]); R(c, 16, 9, 1, 14, ROAD[0]);          // 伸缩缝
    for (const x of [2, 10, 18, 26]) R(c, x, 16, 4, 1, LINE);
    // 护栏：上面一道、下面一道，立柱隔 8 像素
    R(c, 0, 5, 32, 1, MET[4]); R(c, 0, 6, 32, 1, MET[3]); R(c, 0, 7, 32, 1, MET[1]); R(c, 0, 8, 32, 1, MET[0]);
    R(c, 0, 22, 32, 1, MET[4]); R(c, 0, 23, 32, 1, MET[3]); R(c, 0, 24, 32, 1, MET[2]); R(c, 0, 25, 32, 1, MET[0]);
    for (let x = 3; x < 32; x += 8) {
      R(c, x, 3, 2, 3, MET[3]); P(c, x, 3, MET[4]); P(c, x + 1, 5, MET[1]); R(c, x, 7, 2, 1, MET[0]);
      R(c, x, 20, 2, 3, MET[3]); P(c, x, 20, MET[4]); P(c, x + 1, 22, MET[2]); R(c, x + 2, 21, 1, 2, SH);
    }
    // 斜拉的钢桁：护栏立柱之间交叉
    for (let x = 0; x < 32; x++) { if ((x & 7) === 5 || (x & 7) === 1) P(c, x, 4, MET[2]); }
    // 桥头：水泥墩台
    const abut = x => { R(c, x, 4, 3, 23, ROCK[2]); R(c, x, 4, 3, 1, ROCK[3]); R(c, x, 4, 1, 23, ROCK[3]); R(c, x + 2, 5, 1, 22, ROCK[1]); R(c, x, 26, 3, 1, ROCK[0]); R(c, x, 15, 3, 2, ROCK[1]); };
    if (endA) abut(0); if (endB) abut(29);
  }
  function bridgeWood(c, info, endA, endB) {
    const f = info.frame;
    R(c, 0, 28, 32, 3, SH);
    // 木桩
    for (const x of [3, 14, 25]) {
      R(c, x, 26, 3, 4, WOOD[0]); R(c, x, 26, 1, 3, WOOD[1]);
      P(c, x - 1, 29, (f & 1) ? FOAM : FILM); P(c, x + 3, 29, (f & 1) ? FILM : FOAM);
    }
    R(c, 0, 26, 32, 1, WOOD[0]);
    // 桥面木板：4 像素一块，深浅交替，偶尔有一块旧的
    for (let x = 0; x < 32; x += 4) {
      const h = hash(info.x * 8 + (x >> 2), info.y, 16);
      const col = h < 0.14 ? SAND[0] : ((x >> 2) & 1) ? WOOD[2] : WOOD[3];
      R(c, x, 8, 3, 16, col); R(c, x + 3, 8, 1, 16, WOOD[1]);
      R(c, x, 8, 3, 1, h < 0.18 ? WOOD[2] : WOOD[3]);
      P(c, x + 1, 10, WOOD[0]); P(c, x + 1, 21, WOOD[0]);
      if (h > 0.8) R(c, x + 1, 13 + ((h * 40) | 0) % 5, 1, 3, WOOD[1]);
    }
    // 车辙：两道磨亮的印子
    for (let x = 0; x < 32; x += 4) { P(c, x + 1, 12, WOOD[3]); P(c, x + 2, 19, WOOD[3]); }
    // 护栏
    R(c, 0, 5, 32, 1, WOOD[3]); R(c, 0, 6, 32, 1, WOOD[2]); R(c, 0, 7, 32, 1, WOOD[0]);
    R(c, 0, 22, 32, 1, WOOD[3]); R(c, 0, 23, 32, 1, WOOD[2]); R(c, 0, 24, 32, 2, WOOD[0]);
    for (let x = 3; x < 32; x += 8) {
      R(c, x, 3, 2, 4, WOOD[2]); R(c, x, 3, 2, 1, WOOD[3]); P(c, x + 1, 6, WOOD[1]); R(c, x, 7, 2, 1, WOOD[0]);
      R(c, x, 20, 2, 4, WOOD[2]); R(c, x, 20, 2, 1, WOOD[3]); P(c, x + 1, 23, WOOD[1]); R(c, x + 2, 21, 1, 1, SH);
    }
    const abut = x => { R(c, x, 4, 3, 23, ROCK[2]); R(c, x, 4, 3, 1, ROCK[3]); R(c, x, 4, 1, 23, ROCK[3]); R(c, x + 2, 5, 1, 22, ROCK[1]); R(c, x, 26, 3, 1, ROCK[0]); R(c, x, 12, 3, 1, ROCK[1]); R(c, x, 19, 3, 1, ROCK[1]); };
    if (endA) abut(0); if (endB) abut(29);
  }
  G.bridge = function (c, info) {
    const nb = info.nb, horiz = bridgeHoriz(nb, 0, 0);
    let sea = false;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const n = nb(dx, dy); if (n === 'sea' || n === 'reef' || n === 'beach' || n === 'port') sea = true; }
    if (!sea) {   // 顺着桥看两头，长桥中段四周都是桥，也要认出是跨海
      for (const d of [-1, 1]) for (let i = 1; i < 6; i++) { const a = horiz ? nb(d * i, -1) : nb(-1, d * i), b = horiz ? nb(d * i, 1) : nb(1, d * i); if (a === 'sea' || b === 'sea') sea = true; }
    }
    const endA = (horiz ? nb(-1, 0) : nb(0, -1)) !== 'bridge', endB = (horiz ? nb(1, 0) : nb(0, 1)) !== 'bridge';
    if (!horiz) c.transform(0, 1, 1, 0, 0, 0);
    (sea ? bridgeSteel : bridgeWood)(c, info, endA, endB);
  };

  // ───────── 废墟 ─────────
  // 被炸毁的建筑：高矮参差的断墙（锯齿状断口）、没有屋顶或只剩一根斜梁、黑窗洞、脚下一堆碎砖瓦砾、一缕烟。
  // 三种残骸，按格子位置轮换（左右、上下相邻的都不一样），再随机左右翻转。
  const RU = { o: ROCK[0], d: ROCK[2], m: ROCK[3], l: SNOW[1], k: MET[1] };
  G.ruins = function (c, info) {
    const r = info.rnd, flip = r(4) > 0.5, f = info.frame, v = (info.x + info.y * 2) % 3;
    grassBase(c, info);
    const X = (x, w) => flip ? 32 - x - w : x;
    // 一段断墙：tops 是每一列的墙顶；断口压深色，比右邻高出来的一侧是暗面
    const wall = (x0, tops, base) => tops.forEach((t, i) => {
      const nx = i + 1 < tops.length ? tops[i + 1] : base;
      R(c, X(x0 + i, 1), t, 1, base - t, nx > t + 1 ? RU.d : RU.m);
      P(c, X(x0 + i, 1), t, RU.o); P(c, X(x0 + i, 1), t + 1, RU.l); if (i === 0) R(c, X(x0, 1), t, 1, base - t, RU.o); if (i === tops.length - 1) R(c, X(x0 + i, 1), t, 1, base - t, RU.o);
    });
    const hole = (x, y, w, h) => R(c, X(x, w), y, w, h, RU.k);
    const brick = (x, y, col) => { R(c, X(x, 3), y, 3, 2, col); R(c, X(x, 3), y + 1, 3, 1, RU.o); };
    R(c, 4, 29, 25, 2, SH);
    let sx = 10, sy = 4;
    if (v === 0) {            // 一个高墙角 + 一截矮墙，中间斜着一根梁
      wall(4, [5, 5, 5, 6, 6, 6, 6, 9, 9, 9, 12, 12], 30);
      hole(6, 11, 4, 5); hole(6, 20, 4, 5);
      wall(16, [19, 19, 19, 17, 17, 17, 17, 21, 21, 21, 24, 24, 24], 30);
      hole(19, 23, 4, 4);
      for (let i = 0; i < 6; i++) { R(c, X(16 + i, 1), 11 + i, 1, 2, WOOD[2]); P(c, X(16 + i, 1), 13 + i, WOOD[0]); }
      sx = 7; sy = 2;
    } else if (v === 1) {     // 两头各剩一截墙，中间塌成一堆
      wall(3, [11, 11, 11, 9, 9, 9, 9, 13, 13, 16, 16], 30);
      hole(5, 15, 4, 5);
      wall(19, [20, 20, 17, 17, 14, 14, 14, 11, 11, 11, 13, 13], 30);
      hole(24, 17, 4, 5);
      for (let i = 0; i < 5; i++) { const hgt = 2 + Math.min(i, 4 - i); R(c, X(14 + i, 1), 30 - hgt, 1, hgt, i < 2 ? ROCK[3] : ROCK[2]); }
      sx = 15; sy = 20;
    } else {                  // 一整面后墙，两个窗洞，墙顶两头塌下去
      wall(4, [17, 17, 14, 14, 14, 10, 10, 10, 10, 7, 7, 7, 7, 9, 9, 9, 12, 12, 12, 15, 15, 18, 18, 21], 30);
      hole(9, 16, 4, 5); hole(17, 16, 4, 5);
      sx = 20; sy = 6;
    }
    // 脚下的碎砖瓦砾
    R(c, 3, 30, 26, 1, RU.o);
    const bs = [[2, 28], [9, 30], [15, 29], [22, 30], [27, 28], [12, 27]];
    bs.forEach((b, i) => { if (r(10 + i) < 0.12) return; brick(b[0] + ((r(20 + i) * 2) | 0), b[1], i % 3 === 0 ? RU.l : i % 3 === 1 ? RU.d : RU.m); });
    // 一缕烟：两团错开往上飘
    for (let k = 0; k < 2; k++) {
      const a = (f + k * 2) & 3, x = X(sx + (a >> 1), 2), y = sy - a * 3;
      if (a === 3) { P(c, x, y, ROAD[3]); P(c, x + 2, y + 1, ROAD[3]); } else R(c, x, y, 2 + (a > 0 ? 1 : 0), 2, a === 0 ? ROAD[2] : ROAD[3]);
    }
  };

  // ───────── 荒地 ─────────
  const CRATER = [
    '..hhhhhh....', '.hsssssshr..', 'hsssffffflr.', 'hssfffffllrk', 'hsffffflllrk', '.rfffllllrk.', '..rrllllrkk.', '....kkkkk...',
  ];
  const CRATER_SM = ['.hhhh..', 'hsssflr', 'hsffllk', '.rlllk.', '..kkk..'];
  const CR_MAP = { h: SAND[2], r: SAND[2], s: SAND[0], f: SAND[1], l: SAND[1], k: SAND[0] };
  function dryTuft(c, x, y) {
    P(c, x, y, DRY); P(c, x + 2, y, DRY); P(c, x + 1, y + 1, DRY); P(c, x, y + 1, SAND[0]); P(c, x + 2, y + 1, SAND[0]);
    P(c, x + 1, y - 1, DRY);
  }
  const isBare = t => t === 'waste';
  G.waste = function (c, info) {
    const r = info.rnd, gx = info.x * 32, gy = info.y * 32;
    const B = grassBase(c, info), ws = B.sd.waste, m = newMask();
    for (let i = 0; i < 1024; i++) m[i] = ws[i] > 2.5 ? 1 : 0;
    const inM = (x, y, w, h) => at0(m, x, y) && at0(m, x + w, y) && at0(m, x, y + h) && at0(m, x + w, y + h);
    // 干裂的纹路（干净版不画）
    for (let k = 0; k < 0; k++) {
      let x = 3 + ((r(1 + k) * 20) | 0), y = 4 + ((r(3 + k) * 22) | 0);
      for (let i = 0; i < 6; i++) { if (m[y * 32 + x]) P(c, x, y, SAND[0]); x += 1; if (hash(info.x + i, info.y + k, 21) > 0.45) y += hash(info.x + k, info.y + i, 22) > 0.5 ? 1 : -1; x = Math.min(30, x); y = Math.max(1, Math.min(30, y)); }
    }
    // 弹坑：一大一小，位置随格子变
    const v = r(5);
    const bx = 3 + ((r(6) * 14) | 0), by = 4 + ((r(7) * 8) | 0);
    const crater = hash(info.x * 3 + info.y, info.y * 5 + info.x, 46) < 0.55;      // 约每两格一个弹坑
    if (crater && inM(bx, by, 11, 7)) spr(c, CRATER, CR_MAP, bx, by);
    { const sx = (bx + 15) % 22 + 2, sy = 19 + ((r(8) * 6) | 0); if (crater && v > 0.7 && inM(sx, sy, 6, 4)) spr(c, CRATER_SM, CR_MAP, sx, sy); }
    // 碎石、枯草
    const n = !crater && r(9) > 0.6 ? 1 : 0;
    for (let i = 0; i < n; i++) {
      const x = 2 + ((r(10 + i) * 25) | 0), y = 3 + ((r(15 + i) * 24) | 0);
      if (x >= bx - 3 && x <= bx + 12 && y >= by - 3 && y <= by + 8) continue;
      if (!inM(x, y, 5, 4)) continue;
      rock(c, x, y, r(20 + i) > 0.7);
    }
    for (let i = 0; i < 1; i++) {
      const x = 2 + ((r(25 + i) * 26) | 0), y = 3 + ((r(30 + i) * 25) | 0);
      if (x >= bx - 3 && x <= bx + 12 && y >= by - 2 && y <= by + 8) continue;
      if (!at0(m, x + 1, y)) continue;
      dryTuft(c, x, y);
    }
  };

  // ───────── 沼泽 ─────────
  // 草地里一片灰青色的浑水：连片的沼泽连成一片，中间留几块长草的土墩；水边一圈深橄榄的湿泥，成丛的芦苇
  const SW = { w: '#4f6b6c', l: '#6b8a86', o: '#2e4232', mud: '#7f9248' };
  G.swamp = function (c, info) {
    const r = info.rnd, f = info.frame, gx = info.x * 32, gy = info.y * 32;
    const B = grassBase(c, info), ss = B.sd.swamp;
    const m = newMask();
    for (let i = 0; i < 1024; i++) m[i] = ss[i] > 2.5 ? 1 : 0;
    const hum = [];
    const nh = 2 + ((r(1) * 2) | 0);
    for (let i = 0; i < nh; i++) {
      const hx = 6 + ((r(2 + i) * 20) | 0), hy = 7 + ((r(6 + i) * 18) | 0), rx = 2 + ((r(10 + i) * 3) | 0);
      hum.push([hx, hy]);
      for (let j = hy - 2; j <= hy + 2; j++) for (let k = hx - rx - 1; k <= hx + rx + 1; k++) {
        if (k < 0 || j < 0 || k > 31 || j > 31) continue;
        const dx = (k - hx) / (rx + 0.5), dy = (j - hy) / 2.5;
        if (dx * dx + dy * dy <= 1) m[j * 32 + k] = 0;
      }
    }
    const ax = hum[0][0], ay = hum[0][1], bx = hum[1][0], by = hum[1][1];
    for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
      if (!m[y * 32 + x]) {          // 水边的湿泥：只算本格里看得见的水，跨格的那一圈由距离图接上
        const v = ss[y * 32 + x];
        if ((v > 0.6 && v <= 2.5) || at0(m, x, y - 1) || at0(m, x - 1, y) || at0(m, x + 1, y) || at0(m, x, y + 1)) P(c, x, y, SW.mud);
        continue;
      }
      const topE = !at(m, x, y - 1) || !at(m, x - 1, y);
      P(c, x, y, topE ? SW.o : SW.w);
    }
    // 水面波纹：稀疏的几道横纹，每帧挪一格
    for (let y = 3; y < 30; y += 3) for (let x = 1; x < 28; x++) {
      const h = hash(gx + x - f, gy + y, 23);
      if (h > 0.05) continue;
      let ok = true; for (let k = -1; k <= 4; k++) if (!at0(m, x + k, y) || !at0(m, x + k, y - 1)) ok = false;
      if (!ok) continue;
      R(c, x, y, 4, 1, SW.l);
    }
    // 芦苇：长在水边，穗头随帧左右晃
    const reed = (x, y, hgt, ph) => {
      const sway = ((f + ph) & 3) === 1 ? 1 : ((f + ph) & 3) === 3 ? -1 : 0;
      P(c, x, y + 1, SW.o);
      for (let i = 0; i < hgt; i++) P(c, x + (i >= hgt - 2 ? sway : 0), y - i, i >= hgt - 2 ? DRY : (i & 1) ? TR.l : TR.m);
    };
    const clumps = [[ax - 2, ay + 1], [bx + 1, by + 1], [ax + 3, ay], [3 + ((r(40) * 4) | 0), 27], [26, 6 + ((r(41) * 5) | 0)]];
    clumps.forEach((p, i) => {
      if (i > 1 && r(20 + i) < 0.4) return;
      const x = Math.max(3, Math.min(27, p[0])), y = Math.max(8, Math.min(30, p[1]));
      reed(x, y, 6 + ((r(25 + i) * 2) | 0), i); reed(x + 2, y + 1, 5, i + 1); reed(x - 2, y + 1, 4, i + 2); if (r(30 + i) > 0.4) reed(x + 4, y, 4, i + 3);
    });
  };

  // ───────── 城墙 ─────────
  // 斜俯视：能看到墙顶走道和朝南的墙面。墙顶按相邻城墙连成一片，南侧露 8 像素墙面。
  G.wall = function (c, info) {
    const W = t => t === 'wall', s = sides(info, W), gx = info.x * 32, gy = info.y * 32;
    const U = s[0], Rt = s[1], Dn = s[2], L = s[3];
    grassBase(c, info);
    tufts(c, info, 3, 80, (x, y) => (x < 6 || x > 24) && (y < 2 || y > 28));
    const m = newMask();
    fillM(m, 9, 4, 14, 14);
    if (U) fillM(m, 9, 0, 14, 4); if (Dn) fillM(m, 9, 18, 14, 14); if (L) fillM(m, 0, 4, 9, 14); if (Rt) fillM(m, 23, 4, 9, 14);
    // 没有接墙的角削成圆角：孤立的一段读起来是一座圆墩，不是一块方砖
    const nick = (cx, cy, sx, sy) => { for (let a = 0; a < 3; a++) for (let b = 0; a + b < 3; b++) m[(cy + b * sy) * 32 + cx + a * sx] = 0; };
    if (!U && !L) nick(9, 4, 1, 1); if (!U && !Rt) nick(22, 4, -1, 1); if (!Dn && !L) nick(9, 17, 1, -1); if (!Dn && !Rt) nick(22, 17, -1, -1);
    // 墙面：墙顶下缘往下 8 像素
    const face = new Int8Array(1024).fill(-1);
    for (let x = 0; x < 32; x++) for (let y = 0; y < 32; y++) {
      if (m[y * 32 + x]) continue;
      for (let k = 1; k <= 8; k++) if (y - k >= 0 && m[(y - k) * 32 + x]) { face[y * 32 + x] = k - 1; break; }
    }
    const solid = (x, y) => { x = x < 0 ? 0 : x > 31 ? 31 : x; if (y < 0) y = 0; if (y > 31) return 0; return m[y * 32 + x] || face[y * 32 + x] >= 0; };
    // 投影
    c.fillStyle = SH;
    for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
      if (m[y * 32 + x] || face[y * 32 + x] >= 0) continue;
      if (solid(x - 1, y - 1) || solid(x - 2, y - 2) || solid(x - 3, y - 3) || solid(x - 3, y - 2)) c.fillRect(x, y, 1, 1);
    }
    for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
      const i = y * 32 + x;
      if (face[i] >= 0) {          // 墙面砖
        const k = face[i], X = gx + x;
        let col = ROCK[1];
        if (k === 0) col = ROCK[0];
        else if (k === 4) col = ROCK[0];
        else if ((X + (k > 4 ? 3 : 0)) % 6 === 0) col = ROCK[0];
        else if (k === 1) col = ROCK[1];
        else if (hash((X + (k > 4 ? 3 : 0)) / 6 | 0, gy + (k > 4 ? 1 : 0), 24) > 0.8) col = ROCK[1];
        if (k === 7) col = ROCK[0];
        if (!at(m, x - 1, y - k - 1) && face[y * 32 + x - 1] < 0 && x > 0) col = ROCK[1];   // 左棱受光
        P(c, x, y, col);
        continue;
      }
      if (!m[i]) continue;
      // 墙顶：外圈两像素是垛口，里面是走道
      const n1 = !at(m, x, y - 1), w1 = !at(m, x - 1, y), s1 = !at(m, x, y + 1), e1 = !at(m, x + 1, y);
      const n2 = !at(m, x, y - 2), w2 = !at(m, x - 2, y), s2 = !at(m, x, y + 2), e2 = !at(m, x + 2, y);
      const d1 = !at(m, x - 1, y - 1) || !at(m, x + 1, y - 1) || !at(m, x - 1, y + 1) || !at(m, x + 1, y + 1);
      const ring1 = n1 || w1 || s1 || e1 || d1, ring2 = n2 || w2 || s2 || e2 || !at(m, x - 2, y - 2) || !at(m, x + 2, y - 2) || !at(m, x - 2, y + 2) || !at(m, x + 2, y + 2);
      let col;
      if (ring1 || ring2) {
        const horizEdge = n1 || n2 || s1 || s2, p = horizEdge ? gx + x : gy + y;
        const merlon = (p % 5) < 3 || ((n1 || n2 || s1 || s2) && (w1 || w2 || e1 || e2));
        if (merlon) col = ring1 ? ((n1 || w1) ? ROCK[3] : (s1 || e1) ? ROCK[2] : ROCK[3]) : ((s2 || e2) && !(n2 || w2) ? ROCK[2] : ROCK[3]);
        else col = ring1 ? ROCK[1] : ROCK[0];
      } else {
        col = ROCK[2];
        if (!at(m, x, y - 3) || !at(m, x - 3, y)) col = ROCK[1];                          // 垛口投在走道上的影子
        else if ((gx + x + ((gy + y) >> 2 & 1) * 3) % 6 === 0 || (gy + y) % 4 === 0) col = ROCK[1];   // 石板缝
      }
      P(c, x, y, col);
    }
    // 塔楼：墙头、拐角、岔口各一座，直墙上每三格一座。比墙高一截、宽一圈，顶上一圈垛口，正面一道箭孔
    const straight = (U && Dn && !L && !Rt) || (L && Rt && !U && !Dn);
    if (!straight || (info.x + info.y) % 3 === 0) {
      R(c, 25, 15, 2, 14, SH); R(c, 9, 28, 16, 1, SH);
      R(c, 7, 0, 18, 28, ROCK[0]);
      R(c, 8, 1, 16, 12, ROCK[3]); R(c, 10, 3, 12, 8, ROCK[2]); R(c, 10, 3, 12, 1, ROCK[1]); R(c, 10, 3, 1, 8, ROCK[1]);
      for (let x = 10; x < 23; x += 4) { R(c, x, 1, 2, 1, ROCK[1]); R(c, x, 12, 2, 1, ROCK[1]); }
      for (let y = 4; y < 11; y += 4) { R(c, 8, y, 1, 2, ROCK[1]); R(c, 23, y, 1, 2, ROCK[1]); }
      R(c, 8, 13, 16, 14, ROCK[2]); R(c, 8, 13, 16, 1, ROCK[0]); R(c, 8, 14, 2, 13, ROCK[3]); R(c, 21, 14, 3, 13, ROCK[1]);
      for (let y = 17; y < 27; y += 4) { R(c, 10, y, 11, 1, ROCK[1]); for (let x = 12 + ((y >> 2) & 1) * 3; x < 21; x += 6) R(c, x, y - 3, 1, 3, ROCK[1]); }
      R(c, 15, 17, 2, 6, ROCK[0]);
    }
  };

  // ───────── 建筑脚下的地面 ─────────
  G.pad = function (c, info) {
    const B = grassBase(c, info), m = newMask();
    // 朝着路、桥的一侧接一段车道，通到门口
    let any = false;
    [[0, -1], [1, 0], [0, 1], [-1, 0]].forEach((d, i) => {
      const n = info.nb(d[0], d[1]);
      if (!(n === 'road' || (n === 'bridge' && bridgeHoriz(info.nb, d[0], d[1]) === (d[0] !== 0)))) return;
      any = true;
      if (i === 0) fillM(m, 7, 0, 18, 9); else if (i === 1) fillM(m, 23, 7, 9, 18); else if (i === 2) fillM(m, 7, 23, 18, 9); else fillM(m, 0, 7, 9, 18);
    });
    if (any) paintRoad(c, info, m, B.sd.pave);
  };
  // 建筑画完之后压在墙脚上的草簇、碎石：让建筑长在地里（壳层在建筑层之后调用）
  G.foot = function (c, info) {
    const r = info.rnd, isB = t => !!BUILD[t] || t === 'road' || t === 'bridge';
    if (info.type === 'port' || info.type === 'airport' || info.type === 'silo' || info.type === 'silo_used') return;
    const l = !isB(info.nb(-1, 0)), rt = !isB(info.nb(1, 0)), dn = !isB(info.nb(0, 1));
    if (l) { tuft(c, 0 + ((r(90) * 3) | 0), 27 + ((r(91) * 3) | 0), r(92) > 0.5); if (r(93) > 0.5) tuft(c, 1, 20 + ((r(94) * 4) | 0), false); }
    if (rt) { if (r(95) > 0.35) rock(c, 27 + ((r(96) * 2) | 0), 29, false); else tuft(c, 28, 28, false); }
    if (dn) { const n = 1 + ((r(97) * 3) | 0); for (let i = 0; i < n; i++) tuft(c, 3 + ((r(98 + i) * 24) | 0), 29 + ((r(102 + i) * 2) | 0), false); }
  };

  root.AWArtGround = G;
})(window);

// ═════════════════════════════════════════════════════════════════════════════════════════
// 第二代底层（window.AWArt2）：一格 = 48 逻辑像素，整图按像素算，不再一格一格画。
// 上面的 AWArtGround 是 32 像素的旧画法，tiles.js 缺席时壳层退回用它。
//   AWArt2.fields(map, x0, y0, x1, y1) → 这块像素矩形（地图坐标，自动外扩一圈）里每个像素的类别、离水岸的距离、路面信息
//   AWArt2.shadeLand(F, frame, buf, bw, ox, oy)   把陆地像素填进 buf（Uint32，小端 ABGR）；水面由 art-water.js 的 AWArt2.shadeWater 填
// 做法：地块类别（草、沙、荒土、泥沼、水）在格子中心之间做双线性加权，加低频噪声后取最大者 → 圆角、带起伏的交界；
//       河是沿格子中心连线的一条窄水道；路是沿连线的一条带子（拐弯走圆弧）；水岸距离用两遍倒角距离变换；
//       各种地面是预先生成的可平铺纹理（384 像素一个周期），着色时只查表。
(function (root) {
  'use strict';
  const G = 48, HG = 24, P = 384, M = 18;
  const GR = 0, SA = 1, WA = 2, SW = 3, WT = 4, RD = 6, RIVT = 5;
  const BUILD = { hq: 1, city: 1, factory: 1, airport: 1, port: 1, tower: 1, mine: 1, hospital: 1, fort: 1, silo: 1, silo_used: 1, lab: 1, gate: 1 };
  const rgb = h => { const n = parseInt(h.slice(1), 16); return ((255 << 24) | ((n & 255) << 16) | (n & 0xff00) | (n >> 16 & 255)) >>> 0; };
  function hash(x, y, s) {
    let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul((s | 0) + 1, 1274126177);
    h = Math.imul(h ^ (h >>> 13), 1103515245); h ^= h >>> 16; h = Math.imul(h, 2246822519); h ^= h >>> 15;
    return (h >>> 0) / 4294967296;
  }
  // 值噪声。per > 0 时晶格按 per 回绕（做可平铺纹理用）
  function vn(x, y, cell, seed, per) {
    const gx = x / cell, gy = y / cell; let xi = Math.floor(gx), yi = Math.floor(gy);
    let fx = gx - xi, fy = gy - yi; fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
    let x1 = xi + 1, y1 = yi + 1;
    if (per) { xi = ((xi % per) + per) % per; yi = ((yi % per) + per) % per; x1 %= per; y1 %= per; if (x1 < 0) x1 += per; if (y1 < 0) y1 += per; }
    const a = hash(xi, yi, seed), b = hash(x1, yi, seed), c = hash(xi, y1, seed), d = hash(x1, y1, seed);
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
  }

  // ───────── 调色板（照 concepts/px-b.png 取色） ─────────
  const C = {
    g0: rgb('#8fb332'), g1: rgb('#9cbc34'), g2: rgb('#a8c83c'), gBlade: rgb('#74a22c'), gTip: rgb('#bcd84c'), gEdge: rgb('#6c9a2c'),
    s0: rgb('#e0c078'), s1: rgb('#ecd08c'), s2: rgb('#f6e0a4'), sDot: rgb('#c8a460'), sWet: rgb('#cfae6c'),
    w0: rgb('#a47c4c'), w1: rgb('#b88e5a'), w2: rgb('#c89e68'), wCrack: rgb('#84603c'), wPeb: rgb('#d8b888'),
    m0: rgb('#5c7840'), m1: rgb('#6c8846'), m2: rgb('#7c9850'), mPud: rgb('#2f7f8c'), mPudL: rgb('#55a8b0'), mRim: rgb('#465f38'),
    a0: rgb('#626268'), a1: rgb('#6c6c70'), a2: rgb('#76767c'), aCurb: rgb('#a8a8a4'), aEdge: rgb('#3e3e46'), aDash: rgb('#f4c430'),
    cDark: rgb('#4c3220'), cBrown: rgb('#9a6a36'), cBrownD: rgb('#7e5429'), cBrownL: rgb('#b07e42'), cLip: rgb('#e8b84c'),
  };
  // ───────── 可平铺纹理 ─────────
  let TEX = null;
  function tex() {
    if (TEX) return TEX;
    const N = P * P, per = c => P / c;
    const grass = new Uint32Array(N), sand = new Uint32Array(N), waste = new Uint32Array(N), mud = new Uint32Array(N), asph = new Uint32Array(N), nz = new Uint8Array(N);
    for (let y = 0; y < P; y++) for (let x = 0; x < P; x++) {
      const i = y * P + x;
      nz[i] = (vn(x, y, 8, 21, per(8)) * 0.65 + vn(x, y, 3, 22, per(3)) * 0.35) * 255;
      // 草：大尺度的明暗斑块（边缘是硬的像素边）
      const a = vn(x, y, 48, 1, per(48)) * 0.6 + vn(x, y, 16, 2, per(16)) * 0.3 + vn(x, y, 6, 3, per(6)) * 0.1;
      grass[i] = a < 0.4 ? C.g0 : a > 0.6 ? C.g2 : C.g1;
      const b = vn(x, y, 32, 4, per(32)) * 0.6 + vn(x, y, 8, 5, per(8)) * 0.4;
      sand[i] = b < 0.38 ? C.s0 : b > 0.63 ? C.s2 : C.s1;
      const d = vn(x, y, 24, 6, per(24)) * 0.55 + vn(x, y, 6, 7, per(6)) * 0.45;
      waste[i] = d < 0.4 ? C.w0 : d > 0.62 ? C.w2 : C.w1;
      const e = vn(x, y, 24, 8, per(24)) * 0.6 + vn(x, y, 8, 9, per(8)) * 0.4, pd = vn(x, y, 16, 10, per(16)) * 0.7 + vn(x, y, 6, 11, per(6)) * 0.3;
      mud[i] = pd > 0.64 ? (pd > 0.7 ? C.mPud : C.mRim) : e < 0.4 ? C.m0 : e > 0.62 ? C.m2 : C.m1;
      const f = hash(x >> 1, y, 12);
      asph[i] = f < 0.07 ? C.a0 : f > 0.93 ? C.a2 : C.a1;
    }
    const put = (t, x, y, c) => { t[(((y % P) + P) % P) * P + (((x % P) + P) % P)] = c; };
    // 草丛：三根短草叶，成簇出现
    for (let k = 0; k < 520; k++) {
      const cx = (hash(k, 1, 31) * P) | 0, cy = (hash(k, 2, 31) * P) | 0;
      if (vn(cx, cy, 40, 32, per(40)) < 0.42) continue;
      const hs = [2, 3, 2];
      for (let j = 0; j < 3; j++) { const bx = cx + j * 2 - (j === 1 ? 0 : 0), h = hs[j] + (hash(k, j, 33) < 0.3 ? 1 : 0); for (let q = 0; q < h; q++) put(grass, bx + (j === 0 && q === h - 1 ? -1 : j === 2 && q === h - 1 ? 1 : 0), cy - q, q === h - 1 ? C.gTip : C.gBlade); }
    }
    // 草：零星的深色小点（两像素一组）
    for (let k = 0; k < 900; k++) { const x = (hash(k, 3, 34) * P) | 0, y = (hash(k, 4, 34) * P) | 0; put(grass, x, y, C.gBlade); put(grass, x + 1, y, C.gBlade); }
    // 沙：成簇的小石子点、浅色风纹
    for (let k = 0; k < 700; k++) { const x = (hash(k, 5, 35) * P) | 0, y = (hash(k, 6, 35) * P) | 0; put(sand, x, y, C.sDot); if (hash(k, 7, 35) < 0.5) put(sand, x + 1, y, C.sDot); }
    for (let k = 0; k < 260; k++) { const x = (hash(k, 8, 36) * P) | 0, y = (hash(k, 9, 36) * P) | 0, n = 4 + ((hash(k, 10, 36) * 5) | 0); for (let q = 0; q < n; q++) put(sand, x + q, y + (q > n / 2 ? 1 : 0), C.s2); }
    // 荒土：裂纹和碎石
    for (let k = 0; k < 420; k++) {
      const x = (hash(k, 11, 37) * P) | 0, y = (hash(k, 12, 37) * P) | 0, n = 3 + ((hash(k, 13, 37) * 5) | 0), dir = hash(k, 14, 37) < 0.5 ? 1 : -1;
      for (let q = 0; q < n; q++) put(waste, x + q, y + ((q >> 1) * dir), C.wCrack);
    }
    for (let k = 0; k < 500; k++) { const x = (hash(k, 15, 38) * P) | 0, y = (hash(k, 16, 38) * P) | 0; put(waste, x, y, C.wPeb); put(waste, x + 1, y, C.wPeb); put(waste, x, y + 1, C.wCrack); put(waste, x + 1, y + 1, C.wCrack); }
    // 泥沼：水洼里的亮纹
    for (let k = 0; k < 900; k++) { const x = (hash(k, 17, 39) * P) | 0, y = (hash(k, 18, 39) * P) | 0; if (mud[y * P + x] === C.mPud && mud[y * P + ((x + 2) % P)] === C.mPud) { put(mud, x, y, C.mPudL); put(mud, x + 1, y, C.mPudL); put(mud, x + 2, y, C.mPudL); } }
    // 柏油：短裂纹
    for (let k = 0; k < 160; k++) { const x = (hash(k, 19, 40) * P) | 0, y = (hash(k, 20, 40) * P) | 0, n = 3 + ((hash(k, 21, 40) * 4) | 0); for (let q = 0; q < n; q++) put(asph, x + q, y + (q >> 1), C.a0); }
    return (TEX = { grass, sand, waste, mud, asph, nz, land: [grass, sand, waste, mud] });
  }

  // ───────── 地块 ─────────
  const waterish = t => t === 'sea' || t === 'reef' || t === 'port' || t === 'river' || t === 'bridge';
  const seaish = t => t === 'sea' || t === 'reef' || t === 'port';
  function tileGrid(m) {
    const w = m.w, h = m.h, tc = new Uint8Array(w * h), bank = new Uint8Array(w * h);
    const T = (x, y) => m.t[y < 0 ? 0 : y >= h ? h - 1 : y][x < 0 ? 0 : x >= w ? w - 1 : x];
    const base = t => seaish(t) ? WT : t === 'river' ? RIVT : t === 'beach' ? SA : (t === 'waste' || t === 'ruins') ? WA : t === 'swamp' ? SW : GR;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const t = m.t[y][x]; let c = base(t);
      if (t === 'bridge') { const nb = [T(x - 1, y), T(x + 1, y), T(x, y - 1), T(x, y + 1)]; c = nb.some(seaish) && !nb.some(n => n === 'river') ? WT : RIVT; }
      tc[y * w + x] = c;
    }
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (tc[y * w + x] !== RIVT) continue;
      const cnt = [0, 0, 0, 0];
      for (const d of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]]) { const xx = x + d[0], yy = y + d[1]; if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue; const c = tc[yy * w + xx]; if (c < 4) cnt[c] += d[0] && d[1] ? 1 : 2; }
      let b = GR; for (let c = 1; c < 4; c++) if (cnt[c] > cnt[b]) b = c;
      bank[y * w + x] = b;
    }
    // 路、城墙、建筑没有自己的地面：跟着周围的地面走（沙地上的路是沙色路肩）。先看不是这几类的邻格，再看已经定下来的同类邻格，两轮
    const adapt = t => t === 'road' || t === 'wall' || t === 'shard' || t === 'shard_used' || (!!BUILD[t] && t !== 'port');
    const done = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) done[i] = adapt(m.t[(i / w) | 0][i % w]) ? 0 : 1;
    for (let pass = 0; pass < 3; pass++) {
      const set = [];
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        if (done[y * w + x]) continue;
        const cnt = [0, 0, 0, 0]; let n = 0;
        for (const d of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]]) { const xx = x + d[0], yy = y + d[1]; if (xx < 0 || yy < 0 || xx >= w || yy >= h || !done[yy * w + xx]) continue; let c = tc[yy * w + xx]; if (c === RIVT) c = bank[yy * w + xx]; if (c < 4) { cnt[c] += d[0] && d[1] ? 1 : 2; n++; } }
        if (!n) continue;
        let b = GR; for (let c = 1; c < 4; c++) if (cnt[c] > cnt[b]) b = c;
        set.push(y * w + x, b);
      }
      for (let k = 0; k < set.length; k += 2) { tc[set[k]] = set[k + 1]; done[set[k]] = 1; }
    }
    return { w, h, tc, bank, T };
  }

  function fields(m, x0, y0, x1, y1) {
    const TG = tileGrid(m), mw = TG.w, mh = TG.h, tc = TG.tc, bank = TG.bank, T = TG.T;
    const ex0 = x0 - M, ey0 = y0 - M, W = x1 - x0 + 2 * M, H = y1 - y0 + 2 * M, N = W * H;
    const cls = new Uint8Array(N), dist = new Uint8Array(N), aux = new Uint8Array(N);
    const cl = (v, n) => v < 0 ? 0 : v >= n ? n - 1 : v;
    const tcAt = (tx, ty) => tc[cl(ty, mh) * mw + cl(tx, mw)], bankAt = (tx, ty) => bank[cl(ty, mh) * mw + cl(tx, mw)];
    const tx0 = Math.floor(ex0 / G), tx1 = Math.floor((ex0 + W - 1) / G), ty0 = Math.floor(ey0 / G), ty1 = Math.floor((ey0 + H - 1) / G);
    const sc = new Float32Array(5), nz = tex().nz;
    // 1. 类别：按四分之一格处理（每块 24×24 像素落在同一格里，四个角是本格、横邻、竖邻、斜邻的中心）
    for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
      const own = tcAt(tx, ty), ownSea = own === WT;
      const eff = (xx, yy) => { const c = tcAt(xx, yy); return c === RIVT ? (ownSea ? WT : bankAt(xx, yy)) : c; };
      const c0 = own === RIVT ? bankAt(tx, ty) : own;
      for (let qy = 0; qy < 2; qy++) for (let qx = 0; qx < 2; qx++) {
        const dx = qx ? 1 : -1, dy = qy ? 1 : -1;
        const ch = eff(tx + dx, ty), cv = eff(tx, ty + dy), cd = eff(tx + dx, ty + dy);
        let px0 = tx * G + qx * HG, py0 = ty * G + qy * HG, px1 = px0 + HG, py1 = py0 + HG;
        if (px0 < ex0) px0 = ex0; if (py0 < ey0) py0 = ey0; if (px1 > ex0 + W) px1 = ex0 + W; if (py1 > ey0 + H) py1 = ey0 + H;
        if (px0 >= px1 || py0 >= py1) continue;
        if (ch === c0 && cv === c0 && cd === c0) { for (let y = py0; y < py1; y++) cls.fill(c0, (y - ey0) * W + px0 - ex0, (y - ey0) * W + px1 - ex0); continue; }
        const cxm = tx * G + 23.5, cym = ty * G + 23.5;
        // 这一块里出现的类别（最多四种）和四个角各属于哪一种
        const us = [c0]; const ix = [0, 0, 0, 0];
        [ch, cv, cd].forEach((c, k) => { let j = us.indexOf(c); if (j < 0) { j = us.length; us.push(c); } ix[k + 1] = j; });
        const nu = us.length, i1 = ix[1], i2 = ix[2], i3 = ix[3];
        const offx = us.map(c => c * 37 + 3840), offy = us.map(c => c * 91 + 3840), bias = us.map(c => c === WT ? -0.035 : 0);
        for (let y = py0; y < py1; y++) {
          const b = Math.abs(y - cym) / G, o = (y - ey0) * W - ex0;
          for (let x = px0; x < px1; x++) {
            const a = Math.abs(x - cxm) / G;
            sc[0] = (1 - a) * (1 - b); sc[1] = sc[2] = sc[3] = 0;
            sc[i1] += a * (1 - b); sc[i2] += (1 - a) * b; sc[i3] += a * b;
            let best = 0, bv = -9;
            for (let j = 0; j < nu; j++) {
              const v = sc[j] + (nz[((y + offy[j]) % P) * P + (x + offx[j]) % P] - 128) * 0.0015 + bias[j];
              if (v > bv) { bv = v; best = j; }
            }
            cls[o + x] = us[best];
          }
        }
      }
    }
    // 2. 河道：河、河上的桥。沿“格子中心 → 通水的那几条边的中点”画一条窄水道，两个方向拐弯时走圆弧；2×2 都是水的那个角填满
    for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
      if (tcAt(tx, ty) !== RIVT) continue;
      const wa = (dx, dy) => tcAt(tx + dx, ty + dy) >= WT;
      const cn = [wa(0, -1), wa(1, 0), wa(0, 1), wa(-1, 0)];           // 上 右 下 左
      const sea = [tcAt(tx, ty - 1) === WT, tcAt(tx + 1, ty) === WT, tcAt(tx, ty + 1) === WT, tcAt(tx - 1, ty) === WT];
      const nc = cn[0] + cn[1] + cn[2] + cn[3];
      const bend = nc === 2 && !(cn[0] && cn[2]) && !(cn[1] && cn[3]);
      const bcx = cn[1] ? G : 0, bcy = cn[2] ? G : 0;
      const quad = [wa(-1, 0) && wa(0, -1) && wa(-1, -1), wa(1, 0) && wa(0, -1) && wa(1, -1), wa(-1, 0) && wa(0, 1) && wa(-1, 1), wa(1, 0) && wa(0, 1) && wa(1, 1)];
      let px0 = tx * G, py0 = ty * G, px1 = px0 + G, py1 = py0 + G;
      if (px0 < ex0) px0 = ex0; if (py0 < ey0) py0 = ey0; if (px1 > ex0 + W) px1 = ex0 + W; if (py1 > ey0 + H) py1 = ey0 + H;
      for (let y = py0; y < py1; y++) for (let x = px0; x < px1; x++) {
        const i = (y - ey0) * W + x - ex0; if (cls[i] === WT) continue;
        const rx = x - tx * G, ry = y - ty * G;
        if (quad[(ry >= HG ? 2 : 0) + (rx >= HG ? 1 : 0)]) { cls[i] = WT; continue; }
        const lx = rx + 0.5 + (vn(x, y, 16, 71) - 0.5) * 11, ly = ry + 0.5 + (vn(x, y, 16, 72) - 0.5) * 11;
        let d = 99, hw = 10.5 + (nz[((y + 3840) % P) * P + (x + 3877) % P] - 128) * 0.02;
        if (bend) d = Math.abs(Math.hypot(lx - bcx, ly - bcy) - HG);
        else if (nc === 0) d = Math.hypot(lx - HG, ly - HG) - 5;
        else {
          if (cn[0] && ly <= HG) d = Math.min(d, Math.abs(lx - HG)); if (cn[2] && ly >= HG) d = Math.min(d, Math.abs(lx - HG));
          if (cn[1] && lx >= HG) d = Math.min(d, Math.abs(ly - HG)); if (cn[3] && lx <= HG) d = Math.min(d, Math.abs(ly - HG));
          d = Math.min(d, Math.hypot(lx - HG, ly - HG));
        }
        // 入海口放宽
        if (sea[0] && ry < 14) hw += (14 - ry) * 0.7; if (sea[2] && ry > 33) hw += (ry - 33) * 0.7; if (sea[1] && rx > 33) hw += (rx - 33) * 0.7; if (sea[3] && rx < 14) hw += (14 - rx) * 0.7;
        if (d < hw) cls[i] = WT;
      }
    }
    // 3. 路：沿连线的一条带子。aux：1 柏油 2 路缘 3 深色外沿 4 黄虚线
    const roadLink = t => t === 'road' || t === 'bridge' || !!BUILD[t];
    for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
      if (tx < 0 || ty < 0 || tx >= mw || ty >= mh) { if (T(tx, ty) !== 'road') continue; }
      if (T(tx, ty) !== 'road') continue;
      // 先连路和桥；只有断头路（不到两个方向）才往旁边的建筑接一截，免得路边每座建筑都伸出一个岔口
      const nbT = [T(tx, ty - 1), T(tx + 1, ty), T(tx, ty + 1), T(tx - 1, ty)];
      const cn = nbT.map(t => t === 'road' || t === 'bridge');
      let nc = cn[0] + cn[1] + cn[2] + cn[3];
      if (nc < 2) for (let k = 0; k < 4 && nc < 2; k++) { const j = nc === 1 ? (cn.indexOf(true) + 2 + k) % 4 : k; if (!cn[j] && BUILD[nbT[j]]) { cn[j] = true; nc++; } }
      if (nc === 0) { cn[1] = cn[3] = true; nc = 2; }
      // 并排两格宽的路合成一条宽路：2×2 都是路的那个角整块铺柏油，各格自己的中线不画，只在两格的接缝上画一条虚线
      const isR = (dx, dy) => { const x = tx + dx, y = ty + dy; return x >= 0 && y >= 0 && x < mw && y < mh && m.t[y][x] === 'road'; };
      // 接缝只在正好两格宽的那个方向上画：左右的缝要求再往外一格不是路，上下同理
      const sL = !isR(-2, 0) && !isR(1, 0), sR = !isR(-1, 0) && !isR(2, 0), sU = !isR(0, -2) && !isR(0, 1), sD = !isR(0, -1) && !isR(0, 2);
      const quad = [isR(-1, 0) && isR(0, -1) && isR(-1, -1), isR(1, 0) && isR(0, -1) && isR(1, -1), isR(-1, 0) && isR(0, 1) && isR(-1, 1), isR(1, 0) && isR(0, 1) && isR(1, 1)];
      const wide = quad[0] || quad[1] || quad[2] || quad[3];
      const bend = !wide && nc === 2 && !(cn[0] && cn[2]) && !(cn[1] && cn[3]);
      const bcx = cn[1] ? G : 0, bcy = cn[2] ? G : 0;
      let px0 = tx * G, py0 = ty * G, px1 = px0 + G, py1 = py0 + G;
      if (px0 < ex0) px0 = ex0; if (py0 < ey0) py0 = ey0; if (px1 > ex0 + W) px1 = ex0 + W; if (py1 > ey0 + H) py1 = ey0 + H;
      for (let y = py0; y < py1; y++) for (let x = px0; x < px1; x++) {
        const lx = x - tx * G + 0.5, ly = y - ty * G + 0.5;
        if (wide) {
          const qi = (ly >= HG ? 2 : 0) + (lx >= HG ? 1 : 0);
          if (quad[qi]) {
            // 接缝虚线：竖缝（左右两格都整列是宽路）或横缝，靠缝 1 像素
            const vSeam = (lx < 1 && sL && (quad[0] || quad[2])) || (lx > G - 1 && sR && (quad[1] || quad[3])), hSeam = (ly < 1 && sU && (quad[0] || quad[1])) || (ly > G - 1 && sD && (quad[2] || quad[3]));
            const dsh = vSeam && !hSeam ? ((y + 3) % 12 + 12) % 12 < 6 : hSeam && !vSeam ? ((x + 3) % 12 + 12) % 12 < 6 : false;
            const i = (y - ey0) * W + x - ex0; cls[i] = RD; aux[i] = dsh ? 4 : 1; continue;
          }
        }
        let d = 99, dash = false;
        if (bend) {
          const rr = Math.hypot(lx - bcx, ly - bcy); d = Math.abs(rr - HG);
          if (d < 1.2) { const ang = Math.atan2(Math.abs(ly - bcy), Math.abs(lx - bcx)); dash = ((ang * HG / 6 + 0.5) | 0) % 2 === 0; }
        } else {
          const vx = Math.abs(lx - HG), vy = Math.abs(ly - HG);
          const onV = (cn[0] && ly <= HG) || (cn[2] && ly >= HG), onH = (cn[1] && lx >= HG) || (cn[3] && lx <= HG);
          if (onV) d = Math.min(d, vx); if (onH) d = Math.min(d, vy);
          d = Math.min(d, Math.hypot(vx, vy));
          const mid = nc >= 3 && vx < 13 && vy < 13;
          if (!mid) {
            if (onV && vx < 1.1 && (cn[0] && cn[2] || vy > 2)) dash = ((y + 3) % 12 + 12) % 12 < 6;
            else if (onH && vy < 1.1 && (cn[1] && cn[3] || vx > 2)) dash = ((x + 3) % 12 + 12) % 12 < 6;
          }
        }
        if (d >= 12.6) continue;
        if (wide) dash = false;
        const i = (y - ey0) * W + x - ex0;
        cls[i] = RD; aux[i] = dash ? 4 : d < 9.6 ? 1 : d < 11.2 ? 2 : 3;
      }
    }
    // 4. 离水岸的距离（倒角 3-4，存 3 倍像素距离，封顶 96）
    for (let i = 0; i < N; i++) {
      const w = cls[i] === WT, x = i % W;
      let e = false;
      if (x > 0 && (cls[i - 1] === WT) !== w) e = true; else if (x < W - 1 && (cls[i + 1] === WT) !== w) e = true;
      else if (i >= W && (cls[i - W] === WT) !== w) e = true; else if (i < N - W && (cls[i + W] === WT) !== w) e = true;
      dist[i] = e ? 2 : 96;
    }
    for (let y = 1; y < H; y++) { const o = y * W; for (let x = 1; x < W - 1; x++) { const i = o + x; let d = dist[i]; if (d <= 3) continue; let v = dist[i - 1] + 3; if (v < d) d = v; v = dist[i - W] + 3; if (v < d) d = v; v = dist[i - W - 1] + 4; if (v < d) d = v; v = dist[i - W + 1] + 4; if (v < d) d = v; dist[i] = d; } }
    for (let y = H - 2; y >= 0; y--) { const o = y * W; for (let x = W - 2; x >= 1; x--) { const i = o + x; let d = dist[i]; if (d <= 3) continue; let v = dist[i + 1] + 3; if (v < d) d = v; v = dist[i + W] + 3; if (v < d) d = v; v = dist[i + W + 1] + 4; if (v < d) d = v; v = dist[i + W - 1] + 4; if (v < d) d = v; dist[i] = d; } }
    return { ex0, ey0, W, H, cls, dist, aux, x0, y0, x1, y1 };
  }

  // 陆地着色。buf 的 (ox, oy) 处对应地图像素 (F.x0, F.y0)
  function shadeLand(F, frame, buf, bw, ox, oy) {
    const X = tex(), W = F.W, cls = F.cls, dist = F.dist, aux = F.aux, land = X.land, asph = X.asph;
    for (let y = F.y0; y < F.y1; y++) {
      const fo = (y - F.ey0) * W - F.ex0, bo = (y - F.y0 + oy) * bw + ox - F.x0, ty = (((y % P) + P) % P) * P;
      for (let x = F.x0; x < F.x1; x++) {
        const i = fo + x, c = cls[i];
        if (c === WT) continue;
        const ti = ty + (((x % P) + P) % P);
        if (c === RD) { const a = aux[i]; buf[bo + x] = a === 1 ? asph[ti] : a === 2 ? C.aCurb : a === 3 ? C.aEdge : C.aDash; continue; }
        const d = dist[i];
        if (d < 34) {
          if (c === GR || c === WA) {
            // 土崖：朝南（下方是水）的立面厚，其余方向薄；最上面一道亮色的崖沿
            let k = 0; for (let q = 1; q <= 9; q++) { if (cls[i + q * W] === WT) { k = q; break; } }
            const dd = d / 3;
            if (k && k <= 7 || dd <= 3.2) {
              const dark = k === 1 || dd <= 1.1, s = hash(x >> 1, 0, 80), s2 = hash(x, y >> 1, 81);
              buf[bo + x] = dark ? C.cDark : s < 0.22 ? C.cBrownD : s2 > 0.86 ? C.cBrownL : C.cBrown; continue;
            }
            if (k && k <= 9 || dd <= 4.6) { buf[bo + x] = c === GR ? C.cLip : C.w2; continue; }
            if (c === GR && (k === 10 || dd <= 5.4) && hash(x >> 1, y, 82) < 0.7) { buf[bo + x] = C.gEdge; continue; }
          } else if (c === SA) {
            if (d <= 7) { buf[bo + x] = C.sWet; continue; }
            if (d <= 13 && hash(x >> 1, y, 83) < 0.6) { buf[bo + x] = C.s0; continue; }
          } else if (c === SW) { if (d <= 6) { buf[bo + x] = C.mRim; continue; } }
        }
        // 草压在别的地面上：交界处草这一侧描一道深绿边
        if (c === GR) { const e = cls[i + 1], s = cls[i + W]; if ((e !== GR && e < WT) || (s !== GR && s < WT)) { buf[bo + x] = C.gEdge; continue; } }
        buf[bo + x] = land[c][ti];
      }
    }
  }
  root.AWArt2 = Object.assign(root.AWArt2 || {}, { G, TOP: HG, P, fields, shadeLand, tex, hash, vn, rgb, C });
})(window);
