// 潮汐战线：水域像素美术（sea / river / reef / beach，以及给桥、港口垫的水面 base）
// 画法：每格按世界坐标逐像素算“离陆地多远”，再按距离分层上色，所以相邻格天然对得上。
// 每格每帧渲染一次后缓存成 32×32 小画布，之后只 drawImage。
(function (root) {
  'use strict';
  const S = 32, FW = 34, INF = 99, TAU = Math.PI * 2;
  const WATER = { sea: 1, river: 1, reef: 1, bridge: 1, port: 1 };
  const SEALIKE = { sea: 1, reef: 1, port: 1 };
  const NOGRASS = { road: 1, bridge: 1, wall: 1, waste: 1, ruins: 1, beach: 1 };

  // ---------- 颜色 ----------
  function col(hex) {
    const n = parseInt(hex.slice(1), 16);
    return ((255 << 24) | ((n & 255) << 16) | (n & 0xff00) | (n >> 16 & 255)) >>> 0;
  }
  // 水色阶：0 暗斑 1 主色（深青蓝）2 波纹 / 岸边浅水带 3 贴岸浅水 4 水膜 5 浪花
  const LAD = ['#1e7592', '#237d9a', '#3a93ad', '#6fb9c6', '#c5e6e6', '#ffffff'].map(col);
  const FOAM = LAD[5], FILM = LAD[4];
  const SAND_L = col('#f4d9a2'), SAND_LO = col('#e4bd7f'), SAND = col('#eec88a'), SAND_M = col('#dcb276'), SAND_D = col('#dcb276'), SAND_X = col('#ad8e68');
  // 岸坎：草沿、土崖立面（受光 / 背光 / 崖脚）
  const LIP = col('#7f9248'), CL_L = col('#dcb276'), CL_M = col('#ad8e68'), CL_S = col('#ad8e68'), CL_D = col('#86694c');
  const G_D = col('#7f9248'), G_M = col('#7f9248'), G_B = col('#abbb64'), G_L = col('#c8c25c');
  // 草色、沙草交界、海岸咬合都向陆地模块借同一套函数（它不在时退回固定色），两边才对得上
  const GND = () => root.AWArtGround || {};
  const grassAt = (wx, wy) => { const g = GND()._grass32; return g ? g(wx, wy) : G_B; };
  const shoreN = (wx, wy) => { const g = GND()._shoreN; return g ? g(wx, wy) : 0.5; };
  const sandEdge = (wx, wy) => { const g = GND()._sandEdge; return g ? g(wx, wy) : (vn(wx / 4, wy / 4, 131) - 0.5) * 4 - 2.6; };
  const ROCK = { o: col('#474f5c'), d: col('#716e72'), m: col('#96908a'), l: col('#b8afa2'), h: col('#e9e6df') };
  const DECO = {
    s: col('#e9e6df'), w: col('#ffffff'), c: col('#dcb276'), x: col('#ad8e68'), y: SAND_D,
    o: col('#e8862e'), a: col('#f0c64a'), r: col('#c0392f'),
    k: col('#4c3c32'), n: col('#4c3c32'), b: col('#a57c58'), e: col('#c39a73'),
    p: col('#96908a'), q: col('#b8afa2'), z: col('#716e72'), g: G_B, G: G_M,
  };


  // ---------- 噪声（按世界坐标固定，不随帧变） ----------
  function h2(x, y, s) {
    let n = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(s | 0, 1440662683);
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    n ^= n >>> 16;
    return (n >>> 0) / 4294967296;
  }
  function vn(x, y, s) {
    const ix = Math.floor(x), iy = Math.floor(y);
    let fx = x - ix, fy = y - iy;
    fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
    const a = h2(ix, iy, s), b = h2(ix + 1, iy, s), c = h2(ix, iy + 1, s), d = h2(ix + 1, iy + 1, s);
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
  }
  const clamp01 = v => v < 0 ? 0 : v > 1 ? 1 : v;
  const hyp = (a, b) => Math.sqrt(a * a + b * b);
  // 平滑噪声先按 step 像素的粗网格取样，再双线性插到每个像素（和陆地模块同一个算法，跨格连续）
  function coarse(X0, Y0, step, fn, out) {
    const n = S / step + 1, g = new Float32Array(n * n);
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) g[j * n + i] = fn(X0 + i * step, Y0 + j * step);
    for (let y = 0; y < S; y++) {
      const gj = (y / step) | 0, fy = (y - gj * step) / step;
      for (let x = 0; x < S; x++) {
        const gi = (x / step) | 0, fx = (x - gi * step) / step, k = gj * n + gi;
        const a = g[k], b = g[k + 1], c2 = g[k + n], d = g[k + n + 1];
        out[y * S + x] = a + (b - a) * fx + (c2 - a) * fy + (a - b - c2 + d) * fx * fy;
      }
    }
    return out;
  }
  const MOT = new Float32Array(S * S), WOB = new Float32Array(S * S), PH = new Float32Array(S * S), SE = new Float32Array(S * S), GT = new Uint32Array(S * S), GLM = new Uint8Array(S * S), RWB = new Float32Array(S * S);
  const wobFn = (wx, wy) => (vn(wx / 13, wy / 13, 13) - 0.5) * 4.5, phFn = (wx, wy) => vn(wx / 26, wy / 26, 31) * 1.5;
  // 沙地的大尺度明暗（两三级沙色的大块面）；白浪线的进退（让浪线带弧度、断续不等长）
  const sandFn = (wx, wy) => vn(wx / 30, wy / 22, 161) * 0.7 + vn(wx / 9, wy / 7, 163) * 0.3;
  const foamFn = (wx, wy) => (vn(wx / 6, wy / 6, 43) - 0.5) * 2.6;
  const foamGap = (wx, wy) => vn(wx / 10, wy / 10, 41) * 0.6 + vn(wx / 3, wy / 3, 45) * 0.4 > 0.5;
  const motFn = (wx, wy) => vn(wx / 8, wy / 4, 151);
  // 不随帧变的平滑噪声（浪线进退、沙地明暗）：每格算一次存下来，后面三帧直接用
  const tileCache = new Map();
  function tileF(tag, X0, Y0, step, fn) {
    const key = tag + X0 * 4096 + Y0 / 32;
    let a = tileCache.get(key);
    if (!a) { if (tileCache.size > 6000) tileCache.clear(); a = coarse(X0, Y0, step, fn, new Float32Array(S * S)); tileCache.set(key, a); }
    return a;
  }
  // 暗斑不随帧变：每格算一次存下来，后面三帧直接用
  const motCache = new Map();
  function motOf(X0, Y0) {
    const key = X0 * 4096 + Y0 / 32;
    let m = motCache.get(key);
    if (!m) {
      coarse(X0, Y0, 4, motFn, MOT); m = new Uint8Array(S * S);
      for (let i = 0; i < S * S; i++) m[i] = MOT[i] > 0.66 ? 1 : 0;
      if (motCache.size > 6000) motCache.clear();
      motCache.set(key, m);
    }
    return m;
  }
  function grassTile(X0, Y0) { const g = GND()._grassTile; if (g) g(X0, Y0, GT); else GT.fill(G_B); }
  // 波光：按世界坐标的小格子摆短横线，四帧一个生灭周期。整格一次盖到 GLM 里
  function glintMap(X0, Y0, frame) {
    GLM.fill(0);
    const put = (wx, wy, v) => { const x = wx - X0, y = wy - Y0; if (x >= 0 && y >= 0 && x < S && y < S) GLM[y * S + x] = v; };
    for (let cy = Math.floor(Y0 / 9); cy * 9 < Y0 + S; cy++) {
      const sh = (cy & 1) * 7;
      for (let cx = Math.floor((X0 + sh) / 14); cx * 14 - sh < X0 + S; cx++) {
        const h = h2(cx, cy, 101);
        if (h > 0.4) continue;
        let cl = vn((cx * 14 + 7) / 46, (cy * 9 + 4) / 30, 103);
        cl = clamp01((cl - 0.3) / 0.3);
        if (h > 0.1 + 0.3 * cl) continue;
        const L = 4 + ((h2(cx, cy, 105) * 4) | 0);
        const ox = (h2(cx, cy, 107) * (14 - L)) | 0, oy = (h2(cx, cy, 109) * 6) | 0;
        const st = (frame + ((h2(cx, cy, 111) * 4) | 0)) & 3;
        if (st === 0) continue;
        const bx = cx * 14 + ox - sh, by = cy * 9 + oy;
        if (st === 1) for (let lx = 1; lx <= L - 3; lx++) put(bx + lx, by, 1);
        else if (st === 2) { for (let lx = 1; lx <= L - 2; lx++) put(bx + lx, by, lx <= 2 ? 2 : 1); put(bx, by + 1, 1); put(bx + L - 1, by + 1, 1); }
        else for (let lx = 2; lx <= L - 1; lx++) put(bx + lx, by, 1);
      }
    }
  }
  const mod = (a, n) => ((a % n) + n) % n;

  // ---------- 距离场：本格每个像素到“满足 pred 的相邻格”的距离 ----------
  // 外角（陆地凸角）用到矩形的欧氏距离自然变圆；内角（海湾角）用半径 R 的圆角公式。
  function field(nbT, pred, round) {
    const f = new Float32Array(FW * FW);
    const P = [];
    for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) P.push(i === 1 && j === 1 ? false : !!pred(nbT[j * 3 + i]));
    const pNW = P[0], pN = P[1], pNE = P[2], pW = P[3], pE = P[5], pSW = P[6], pS = P[7], pSE = P[8];
    const any = pNW || pN || pNE || pW || pE || pSW || pS || pSE;
    const R = 16;      // 内角半径取半格：单格的湖是圆的，两格的湖是药丸形，不再是方块
    for (let py = -1; py <= S; py++) {
      for (let px = -1; px <= S; px++) {
        const i = (py + 1) * FW + px + 1;
        if (!any) { f[i] = INF; continue; }
        const cx = px + 0.5, cy = py + 0.5, ex = S - cx, ey = S - cy;
        const dN = pN ? cy : INF, dS = pS ? ey : INF, dW = pW ? cx : INF, dE = pE ? ex : INF;
        let d = Math.min(dN, dS, dW, dE);
        const mx = Math.max(cx, 0), my = Math.max(cy, 0), nx = Math.max(ex, 0), ny = Math.max(ey, 0);
        if (pNW) d = Math.min(d, hyp(mx, my));
        if (pNE) d = Math.min(d, hyp(nx, my));
        if (pSW) d = Math.min(d, hyp(mx, ny));
        if (pSE) d = Math.min(d, hyp(nx, ny));
        if (round) {
          if (pN && pW && dN < R && dW < R) d = Math.min(d, R - hyp(R - dN, R - dW));
          if (pN && pE && dN < R && dE < R) d = Math.min(d, R - hyp(R - dN, R - dE));
          if (pS && pW && dS < R && dW < R) d = Math.min(d, R - hyp(R - dS, R - dW));
          if (pS && pE && dS < R && dE < R) d = Math.min(d, R - hyp(R - dS, R - dE));
        }
        f[i] = d;
      }
    }
    return f;
  }

  // ---------- 开阔水面的波纹簇：按世界坐标的格子摆小波峰，四帧一个生灭周期 ----------
  function glint(wx, wy, frame) {
    const cy = Math.floor(wy / 9);
    const xx = wx + (cy & 1) * 7;
    const cx = Math.floor(xx / 14);
    const h = h2(cx, cy, 101);
    let cl = vn((cx * 14 + 7) / 46, (cy * 9 + 4) / 30, 103);
    cl = clamp01((cl - 0.3) / 0.3);
    if (h > 0.1 + 0.3 * cl) return 0;
    const L = 4 + ((h2(cx, cy, 105) * 4) | 0);
    const ox = (h2(cx, cy, 107) * (14 - L)) | 0, oy = (h2(cx, cy, 109) * 6) | 0;
    const st = (frame + ((h2(cx, cy, 111) * 4) | 0)) & 3;
    const lx = xx - cx * 14 - ox, ly = wy - cy * 9 - oy;
    if (st === 0) return 0;
    if (st === 1) return (ly === 0 && lx >= 1 && lx <= L - 3) ? 1 : 0;
    if (st === 2) {
      if (ly === 0 && lx >= 1 && lx <= L - 2) return lx <= 2 ? 2 : 1;
      if (ly === 1 && (lx === 0 || lx === L - 1)) return 1;
      return 0;
    }
    return (ly === 0 && lx >= 2 && lx <= L - 1) ? 1 : 0;
  }
  // 静态小图案：按格子摆，返回格内相对坐标（没有则 null）
  function stamp(wx, wy, cw, ch, sw, sh, prob, seed, out) {
    const cy = Math.floor(wy / ch);
    const xx = wx + (cy & 1) * (cw >> 1);
    const cx = Math.floor(xx / cw);
    if (h2(cx, cy, seed) > prob) return false;
    const ox = (h2(cx, cy, seed + 1) * (cw - sw + 1)) | 0, oy = (h2(cx, cy, seed + 2) * (ch - sh + 1)) | 0;
    out.x = xx - cx * cw - ox; out.y = wy - cy * ch - oy; out.v = h2(cx, cy, seed + 3);
    return out.x >= 0 && out.x < sw && out.y >= 0 && out.y < sh;
  }
  const ST = { x: 0, y: 0, v: 0 };

  // ---------- 小画布与缓存 ----------
  const cache = new Map();           // 每格每帧的像素（Uint32Array，4KB 一份）
  let scr = null, scrCtx = null, scrImg = null, scrBuf = null;
  function makeCanvas() {
    if (typeof document !== 'undefined') { const cv = document.createElement('canvas'); cv.width = S; cv.height = S; return cv; }
    return new OffscreenCanvas(S, S);
  }
  function nbTypes(info) {
    const a = [];
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) a.push((dx || dy) ? (info.nb(dx, dy) || info.type) : info.type);
    return a;
  }
  function rndOf(info) {
    return typeof info.rnd === 'function' ? info.rnd : (i => h2(info.x, info.y, 900 + i));
  }
  function draw(c, info, mode) {
    const nbT = nbTypes(info);
    const frame = (info.frame | 0) & 3;
    const key = mode + '|' + info.x + '|' + info.y + '|' + frame + '|' + nbT.join(',');
    let buf = cache.get(key);
    if (!buf) {
      if (cache.size > 8000) cache.clear();      // 最多约 32MB；整图画完后壳层有自己的帧缓存
      buf = new Uint32Array(S * S);
      if (mode === 'beach') renderBeach(buf, info, nbT, frame); else renderWater(buf, info, nbT, frame, mode);
      cache.set(key, buf);
    }
    if (c.putPixels) { c.putPixels(buf); return; }        // 壳层的像素缓冲：直接拷
    if (!scr) { scr = makeCanvas(); scrCtx = scr.getContext('2d'); scrImg = scrCtx.createImageData(S, S); scrBuf = new Uint32Array(scrImg.data.buffer); }
    scrBuf.set(buf); scrCtx.putImageData(scrImg, 0, 0);
    c.drawImage(scr, 0, 0);
  }

  // ---------- 礁石字符画 ----------
  const ROCKS = [
    ['....dddo....', '...dllhmo...', '..dllhmmdo..', '.dllmmmmddo.', '.dlmmmmdddo.', 'dlmmmdmddddo', 'ommmddddddoo', '.oddddddooo.', '..oooooooo..'],
    ['..dddo..', '.dlhlmo.', 'dllmmmdo', 'dlmmmddo', 'ommmdddo', '.oddddo.', '..oooo..'],
    ['.dlo.', 'dhmdo', 'ommdo', '.ooo.'],
    ['..ddo..', '.dlhmdo', 'dlmmmdo', 'ommdddo', '.ooooo.'],
    ['..dl..', '.dlho.', '.dhmo.', '.dlmdo', 'dllmdo', 'dlmmdo', 'dlmmdo', 'ommddo', '.oooo.'],
    ['.dd.', 'dhmo', 'omdo', '.oo.'],
  ];
  function reefLayout(info, dL) {
    const rnd = rndOf(info);
    // 候选位置：一块大的、一根尖的、几块小的；按格子随机挑选和微移
    const v = (rnd(1) * 3) | 0;
    const plans = [
      [[0, 5, 6], [4, 21, 3], [3, 17, 19], [2, 6, 22], [5, 26, 15]],
      [[1, 3, 4], [0, 15, 14], [2, 24, 6], [5, 5, 21], [3, 22, 25]],
      [[4, 6, 3], [1, 18, 7], [0, 4, 17], [2, 22, 21], [5, 14, 3]],
    ][v];
    const list = [];
    plans.forEach((p, k) => {
      if (k >= 3 && rnd(10 + k) < 0.3) return;
      const sp = ROCKS[p[0]];
      const w = sp[0].length, h = sp.length;
      let x = p[1] + ((rnd(20 + k) * 3) | 0) - 1, y = p[2] + ((rnd(30 + k) * 3) | 0) - 1;
      x = Math.max(3, Math.min(S - w - 4, x)); y = Math.max(3, Math.min(S - h - 4, y));
      const cx = x + (w >> 1), cy = y + (h >> 1);
      if (dL[(cy + 1) * FW + cx + 1] < 11) return; // 离岸太近就不放
      list.push({ sp, x, y, w, h, cx, cy, ph: (rnd(40 + k) * 4) | 0 });
    });
    list.sort((a, b) => (a.y + a.h) - (b.y + b.h));
    return list;
  }
  function drawRocks(buf, rocks, frame, info) {
    rocks.forEach((rk, ri) => {
      const { sp, x, y, w, h } = rk;
      const wl = y + Math.floor(h * 0.45); // 水线以上不起浪
      const inMask = (ax, ay) => { const lx = ax - x, ly = ay - y; return lx >= 0 && ly >= 0 && lx < w && ly < h && sp[ly][lx] !== '.'; };
      const st = (frame + rk.ph) & 3;
      // 投影和浪花
      for (let ay = y - 3; ay < y + h + 4; ay++) {
        for (let ax = x - 4; ax < x + w + 4; ax++) {
          if (ax < 0 || ay < 0 || ax >= S || ay >= S || inMask(ax, ay)) continue;
          const i = ay * S + ax;
          if (ay >= wl && (inMask(ax - 1, ay - 1) || inMask(ax - 2, ay - 1) || inMask(ax - 1, ay))) buf[i] = LAD[0];
          if (ay < wl) continue;
          let dm = 9;
          for (let oy = -3; oy <= 3; oy++) for (let ox = -3; ox <= 3; ox++) if (inMask(ax + ox, ay + oy)) dm = Math.min(dm, hyp(ox, oy));
          const hh = h2(info.x * S + ax, info.y * S + ay, 200 + ri);
          if (st === 0) { if (dm <= 1.5 && ax < x + 3) buf[i] = FOAM; }
          else if (st === 1) { if (dm <= 1.5 && hh > 0.12) buf[i] = FOAM; }
          else if (st === 2) { if (dm <= 1.5) { if (hh > 0.3) buf[i] = FILM; } else if (dm <= 2.7 && hh > 0.45) buf[i] = FOAM; }
          else { if (dm > 1.5 && dm <= 2.9 && hh > 0.68) buf[i] = FILM; else if (dm <= 1.1 && hh > 0.75) buf[i] = FILM; }
        }
      }
      // 石头本体
      for (let ly = 0; ly < h; ly++) for (let lx = 0; lx < w; lx++) {
        const ch = sp[ly][lx];
        if (ch !== '.') buf[(y + ly) * S + x + lx] = ROCK[ch];
      }
      // 迎浪面（左侧）溅起的水花
      const put = (ax, ay, c32) => { if (ax >= 0 && ay >= 0 && ax < S && ay < S) buf[ay * S + ax] = c32; };
      if (h >= 5) {
        if (st === 0) { put(x - 1, wl - 1, FOAM); put(x, wl - 2, FOAM); }
        else if (st === 1) { put(x - 2, wl - 2, FOAM); put(x, wl - 3, FOAM); put(x - 1, wl - 4, FILM); }
        else if (st === 2) { put(x - 2, wl - 1, FILM); }
      }
    });
  }

  // ---------- 水格（sea / river / reef / port / bridge） ----------
  // mode: 'sea' | 'river' | 'reef' | 'port' | 'bridge-sea-h' ... 由调用方决定
  function renderWater(buf, info, nbT, frame, mode) {
    const river = mode.indexOf('river') >= 0;
    const X0 = info.x * S, Y0 = info.y * S;
    glintMap(X0, Y0, frame); const DM = motOf(X0, Y0);
    const deep = k => GLM[k] ? LAD[1 + GLM[k]] : DM[k] ? LAD[0] : LAD[1];
    if (mode === 'sea') {          // 四周都是水：一整块深水色加波光，不用逐像素算岸
      let open = true; for (let k = 0; k < 9; k++) if (!WATER[nbT[k]]) open = false;
      if (open) { for (let k = 0; k < S * S; k++) buf[k] = deep(k); return; }
    }
    coarse(X0, Y0, 4, wobFn, WOB); coarse(X0, Y0, 8, phFn, PH); const FJ = tileF('f', X0, Y0, 4, foamFn); grassTile(X0, Y0);
    if (river) coarse(X0, Y0, 4, (wx, wy) => (vn(wx / 21, wy / 21, 17) - 0.5) * 5, RWB);
    const isLand = t => !WATER[t];
    const dL = field(nbT, isLand, true);
    const dB = field(nbT, t => t === 'beach', false);
    const dH = field(nbT, t => !WATER[t] && t !== 'beach', false);
    const dSea = river ? field(nbT, t => !!SEALIKE[t], false) : null;
    const vertFallback = WATER[nbT[1]] && nbT[1] !== 'sea' || WATER[nbT[7]] && nbT[7] !== 'sea';
    const rocks = mode === 'reef' ? reefLayout(info, dL) : null;
    const drift = [0, 1, 0, -1][frame];
    let grassy = true;
    for (const k of [1, 3, 5, 7]) if (!WATER[nbT[k]] && NOGRASS[nbT[k]]) grassy = false;

    for (let py = 0; py < S; py++) {
      for (let px = 0; px < S; px++) {
        const i = (py + 1) * FW + px + 1;
        const wx = X0 + px, wy = Y0 + py;
        const d = dL[i];
        const kk = py * S + px, wob = WOB[kk];   // 只留一层慢弯：岸线圆润，不带细碎抖动
        let b = 0;
        if (dB[i] < 90) b = dH[i] >= 90 ? 1 : clamp01((dH[i] - dB[i] + 3) / 6);
        // 岸坎朝哪边：陆地在北（立面朝南）最厚，陆地在西（朝东）次之，其余只有一道草沿
        const gx0 = dL[i + 1] - dL[i - 1], gy0 = dL[i + FW] - dL[i - FW], gl = hyp(gx0, gy0) || 1;
        const fs = d >= 90 ? 0 : Math.max(0, gy0 / gl), fe = d >= 90 ? 0 : Math.max(0, gx0 / gl);
        const CH = (0.9 + 2.8 * fs + 1.3 * fe) * (1 - b);
        let r = 0, rs = false, dp = d >= 90 ? INF : d + wob - 2.5 * (1 - b);   // 陆地（草）平均往水格里伸 2.5 像素，岸线不贴着格边
        if (river) {
          r = dSea[i] >= 90 ? 1 : clamp01(dSea[i] / 18);
          if (d < 90) dp += r * RWB[kk];
          rs = r > 0.4 + 0.3 * (vn(wx / 4, wy / 4, 23) - 0.5);
        }
        const Wsea = 3.6 * (1 - b) + CH + 1.5 * b;
        const CHr = 0.9 + 1.9 * fs + 0.9 * fe;
        const W = Wsea + ((4.5 - 2 * b) - Wsea) * r;
        const th = TAU * (frame / 4 + PH[kk]);
        const sn = Math.sin(th);
        let out;

        if (dp < W && rs && b < 0.5) {
          // 河岸：草 → 深色岸沿
          const q = W - dp;                                   // 离水边还有多远
          if (q > CHr + 1) out = GT[kk];
          else if (q > CHr) out = LIP;
          else out = q < 0.9 ? CL_D : fe > fs ? CL_L : CL_M;
        } else {
          const fpos = (W + 1 + 1.2 * sn) * (1 - b) + (0.5 + 2.5 * sn) * b + FJ[kk];
          const foamOK = !rs && dp >= fpos && dp < fpos + 1.4 && (b > 0.5 || dp >= W) && foamGap(wx, wy);
          if (d + wob * 0.4 < -0.7) {
            // 内角圆角里多出来的那块：按陆地材质填
            if (b > 0.5) out = stamp(wx, wy, 12, 7, 4, 1, 0.42, 141, ST) ? SAND_L : SAND;
            else if (grassy) out = GT[kk];
            else out = SAND;
          } else if (foamOK) out = FOAM;
          else if (dp < W) {
            // 沙边
            if (!rs && b > 0.5 && dp > fpos) out = LAD[3];
            else if (b > 0.5) out = SAND_D;
            else if (dp < 0) out = GT[kk];
            else if (dp < 1) out = LIP;
            else if (dp < 1 + CH) out = dp > CH ? CL_D : fe > fs + 0.15 ? CL_L : CL_M;
            else if (dp > W - 0.9) out = SAND_M;
            else out = stamp(wx, wy, 5, 4, 1, 1, 0.3, 61, ST) ? SAND_L : SAND;
          } else if (rs) {
            // 河水
            const e = dp - W;
            const upLeft = dL[i - FW - 1] < d - 0.3;
            let idx;
            if (e < 1) idx = upLeft ? 0 : 3;
            else {
              idx = e < 2.2 ? 2 : (DM[kk] ? 0 : 1);
              let q, a, side = 0, vertical;
              if (d >= 30) {
                vertical = vertFallback;
                q = Math.floor(vertical ? wx : wy) + 40;
                a = vertical ? wy : wx;
              } else {
                const gx = dL[i + 1] - dL[i - 1], gy = dL[i + FW] - dL[i - FW];
                vertical = Math.abs(gx) > Math.abs(gy);
                a = vertical ? wy : wx;
                side = (vertical ? gx : gy) > 0 ? 1 : 0;
                q = Math.floor(d - W - 1.5); // 流线跟着不带抖动的等距线走，保持成段
              }
              if (q >= 0 && q % 4 === 1) {
                const lane = (q >> 2);
                const len = (lane + side) & 1 ? 3 : 5;
                const off = (h2(lane, side + (vertical ? 2 : 0), 71) * 12) | 0;
                const m = mod(a - 3 * frame + off, 12);
                if (m < len) idx = m === len - 1 ? 3 : 2;
              }
            }
            out = LAD[idx];
          } else if (dp < fpos) out = LAD[3];
          else {
            // 海水：按离岸距离分层
            let idx;
            let big = 0;
            if (dp >= 90) idx = -1;
            else {
              const e = dp - W;
              const sh = 0.5 * Math.sin(th + 1.3);
              idx = e < 4.2 - sh ? 2 : -1;
              const f2 = 4.2 - 1.1 * sn;
              
            }
            if (idx < 0) out = deep(kk);
            else out = LAD[GLM[kk] ? Math.min(4, idx + 1) : idx];
          }
        }
        buf[py * S + px] = out;
      }
    }

    if (rocks && rocks.length) {
      // 礁盘：石头周围一圈浅水，边缘随帧轻微呼吸；贴格边处归零，保证和邻格接得上
      for (let py = 0; py < S; py++) for (let px = 0; px < S; px++) {
        const k = py * S + px, cur = buf[k];
        const li = LAD.indexOf(cur);
        if (li < 0 || li > 1) continue;
        let hv = 0;
        for (const rk of rocks) {
          const rad = 4.5 + rk.w * 0.75;
          const dd = hyp((px - rk.cx) / 1.15, (py - rk.cy - 1) / 0.85);
          hv = Math.max(hv, 1 - dd / rad);
        }
        hv *= clamp01(Math.min(px, py, S - 1 - px, S - 1 - py) / 4);
        hv += (vn((X0 + px) / 3.2, (Y0 + py) / 3.2, 121) - 0.5) * 0.22 + [0, 0.03, 0.05, 0.03][frame];
        if (hv > 0.45) buf[k] = LAD[Math.max(li, 2)];
      }
      drawRocks(buf, rocks, frame, info);
    }

    // 桥在水面上的投影（桥面由别的模块画）：横桥投在下沿，竖桥投在右沿
    if (mode.indexOf('bridge') === 0) {
      const horiz = mode.slice(-1) === 'h';
      for (let py = 0; py < S; py++) for (let px = 0; px < S; px++) {
        const t = horiz ? py : px;
        if (t >= 28 && t < 31 && false) buf[py * S + px] = shade(buf[py * S + px]);
      }
    }
  }

  // ---------- 沙滩格 ----------
  const SPR = {
    shell: ['.s.', 'sws', '.cx'],
    shell2: ['ww.', 'wsx', '.x.'],
    star: ['..o..', 'oaaoo', '.oao.', '.o.ox', '.x..x'],
    wood: ['.bbebbbb..', 'nnnnnbnnnk', '.kknnkkkk.', '..yyyyyyy.'],
    wood2: ['..bb.', '.bnnk', 'bnnk.', 'nnky.', 'kky..'],
    peb: ['.q..', 'qpz.', '.zyq', '..yp'],
    crab: ['r.r', 'rrr', 'y.y'],
  };
  function renderBeach(buf, info, nbT, frame) {
    const X0 = info.x * S, Y0 = info.y * S;
    const rnd = rndOf(info);
    // 到水边的距离：邻格的海岸在内角处是圆的，这里跟着它往外让，湿沙带才贴着真正的水边走
    const wN = !!WATER[nbT[1]], wS = !!WATER[nbT[7]], wW = !!WATER[nbT[3]], wE = !!WATER[nbT[5]];
    const lNW = !WATER[nbT[0]], lNE = !WATER[nbT[2]], lSW = !WATER[nbT[6]], lSE = !WATER[nbT[8]];
    const RR = 16, bend = t => t < RR ? hyp(RR, RR - t) - RR : 0;
    const dW = new Float32Array(FW * FW);
    for (let py = -1; py <= S; py++) for (let px = -1; px <= S; px++) {
      const cx = px + 0.5, cy = py + 0.5, ex = S - cx, ey = S - cy;
      let d = INF;
      if (wN) d = Math.min(d, cy + (lNW ? bend(cx) : 0) + (lNE ? bend(ex) : 0));
      if (wS) d = Math.min(d, ey + (lSW ? bend(cx) : 0) + (lSE ? bend(ex) : 0));
      if (wW) d = Math.min(d, cx + (lNW ? bend(cy) : 0) + (lSW ? bend(ey) : 0));
      if (wE) d = Math.min(d, ex + (lNE ? bend(cy) : 0) + (lSE ? bend(ey) : 0));
      dW[(py + 1) * FW + px + 1] = d;
    }
    const dG = field(nbT, t => !WATER[t] && t !== 'beach', true);
    coarse(X0, Y0, 4, wobFn, WOB); coarse(X0, Y0, 8, phFn, PH); coarse(X0, Y0, 4, sandEdge, SE); const SV = tileF('s', X0, Y0, 8, sandFn), FJ = tileF('f', X0, Y0, 4, foamFn); grassTile(X0, Y0);
    const dry = new Uint8Array(S * S);
    for (let py = 0; py < S; py++) {
      for (let px = 0; px < S; px++) {
        const i = (py + 1) * FW + px + 1;
        const wx = X0 + px, wy = Y0 + py;
        const kk = py * S + px, wob = WOB[kk];
        const s = dW[i] >= 90 ? -INF : -dW[i] + wob;
        const gv = dG[i] >= 90 ? INF : dG[i] + SE[kk], gp = gv + 3.4;
        const th = TAU * (frame / 4 + PH[kk]);
        const fpos = 0.5 + 2.5 * Math.sin(th) + FJ[kk];
        let out;
        const bgx = dG[i + 1] - dG[i - 1], bgy = dG[i + FW] - dG[i - FW], bgl = hyp(bgx, bgy) || 1;
        const bfs = Math.max(0, bgy / bgl), bfe = Math.max(0, bgx / bgl), CHb = 0.9 + 2.6 * bfs + 1.3 * bfe;
        if (gv <= 0) out = GT[kk];
        else if (gv < 1) out = LIP;
        else if (gv < 1 + CHb) out = gv > CHb ? CL_D : bfe > bfs + 0.15 ? CL_L : CL_M;
        else if (gv < 2 + CHb && bfs + bfe > 0.5) out = SAND_D;
        else if (s >= fpos && s < fpos + 1.4 && foamGap(wx, wy)) out = FOAM;
        else if (s >= fpos + 1.4) out = LAD[3];
        else if (s > -3.4) out = SAND_D;
        else if (s > -4.6) out = SAND_M;
        else {
          const sv = SV[kk];
          out = sv > 0.6 ? SAND_L : sv < 0.42 ? SAND_LO : SAND;          // 大块面的明暗起伏
          // 风吹出的沙纹：稀疏的短弧，上沿亮、下沿暗
          if (stamp(wx, wy, 16, 9, 6, 2, 0.3, 141, ST)) {
            const len = 3 + ((ST.v * 4) | 0);
            if (ST.x < len) out = ST.y === 0 ? (ST.x === 0 || ST.x === len - 1 ? out : SAND_L) : (ST.x > 0 && ST.x < len - 1 ? SAND_M : out);
          }
          if (stamp(wx, wy, 23, 19, 2, 2, 0.22, 171, ST)) out = ST.y === 0 ? (ST.x === 0 ? ROCK.l : ROCK.m) : (ST.x === 0 ? ROCK.m : ROCK.d);   // 小石块
          if (gp < 11 && stamp(wx, wy, 6, 6, 3, 2, 0.34, 151, ST)) {
            // 靠草地一侧零星的草芽
            if (ST.y === 0 && ST.x !== 1) out = G_B; else if (ST.y === 1 && ST.x === 1) out = G_M;
          } else if (gp >= 11) dry[py * S + px] = (s < -7 && out !== SAND_L) ? 1 : 0;
          if (gp >= 11 && s < -7) dry[py * S + px] = 1;
        }
        buf[py * S + px] = out;
      }
    }
    // 小物件：只放在干沙上，放不下就换位置，再放不下就不放
    function place(sp, k) {
      const w = sp[0].length, h = sp.length;
      for (let tr = 0; tr < 5; tr++) {
        const x = 2 + ((rnd(60 + k * 7 + tr) * (S - w - 4)) | 0), y = 2 + ((rnd(61 + k * 7 + tr * 3) * (S - h - 4)) | 0);
        let ok = true;
        for (let ly = -1; ly <= h && ok; ly++) for (let lx = -1; lx <= w && ok; lx++) if (!dry[(y + ly) * S + x + lx]) ok = false;
        if (!ok) continue;
        for (let ly = 0; ly < h; ly++) for (let lx = 0; lx < w; lx++) {
          const ch = sp[ly][lx];
          if (ch !== '.') { buf[(y + ly) * S + x + lx] = DECO[ch]; }
        }
        for (let ly = -1; ly <= h; ly++) for (let lx = -1; lx <= w; lx++) dry[(y + ly) * S + x + lx] = 0;
        return true;
      }
      return false;
    }
    function footprints() {
      // 一串斜着走的脚印，左右脚交替
      const up = rnd(71) > 0.5 ? -1 : 1;
      const sx = 3 + ((rnd(72) * 8) | 0), sy = up < 0 ? 22 + ((rnd(73) * 6) | 0) : 4 + ((rnd(73) * 6) | 0);
      for (let k = 0; k < 6; k++) {
        const x = sx + k * 4, y = sy + up * k * 3 + (k & 1 ? 2 : 0);
        if (x < 1 || y < 1 || x > S - 3 || y > S - 3) continue;
        if (!dry[y * S + x] || !dry[y * S + x + 1] || !dry[(y + 1) * S + x]) continue;
        buf[y * S + x] = SAND_X; buf[y * S + x + 1] = SAND_D; buf[(y + 1) * S + x + 1] = SAND_L;
      }
    }
    const v = (rnd(1) * 8) | 0;
    if (v === 0) { place(SPR.shell, 0); place(SPR.shell2, 1); }
    else if (v === 1) footprints();
    else if (v === 2) { place(SPR.wood, 0); place(SPR.shell2, 1); }
    else if (v === 3) { place(SPR.star, 0); place(SPR.shell, 1); }
    else if (v === 4) { place(SPR.peb, 0); place(SPR.peb, 1); }
    else if (v === 5) { place(SPR.wood2, 0); footprints(); }
    else if (v === 6) { place(SPR.crab, 0); place(SPR.shell, 1); }
    // v === 7：只有沙纹
  }

  // ---------- 对外接口 ----------
  function baseMode(info) {
    if (info.type === 'port') return 'port';
    // 桥：周围八格里河比海多就垫河，否则垫海；都没有按河算
    let nr = 0, ns = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      const t = info.nb(dx, dy), w = (dx && dy) ? 1 : 3;
      if (t === 'river') nr += w; else if (SEALIKE[t]) ns += w;
    }
    const style = (nr > ns || (!nr && !ns)) ? 'river' : 'sea';
    // 桥朝向：左右是陆地或桥就是横桥
    const solid = t => t === 'bridge' || !WATER[t];
    const hsc = (solid(info.nb(-1, 0)) ? 1 : 0) + (solid(info.nb(1, 0)) ? 1 : 0);
    const vsc = (solid(info.nb(0, -1)) ? 1 : 0) + (solid(info.nb(0, 1)) ? 1 : 0);
    const lh = (!WATER[info.nb(-1, 0)] ? 1 : 0) + (!WATER[info.nb(1, 0)] ? 1 : 0);
    const lv = (!WATER[info.nb(0, -1)] ? 1 : 0) + (!WATER[info.nb(0, 1)] ? 1 : 0);
    const horiz = hsc !== vsc ? hsc > vsc : lh >= lv;
    return 'bridge-' + style + '-' + (horiz ? 'h' : 'v');
  }
  const W = {
    sea(c, info) { draw(c, info, 'sea'); },
    river(c, info) { draw(c, info, 'river'); },
    reef(c, info) { draw(c, info, 'reef'); },
    beach(c, info) { draw(c, info, 'beach'); },
    base(c, info) {
      if (info.type === 'bridge' || info.type === 'port') draw(c, info, baseMode(info));
      else if (info.type === 'river') draw(c, info, 'river');
      else draw(c, info, 'sea');
    },
  };
  root.AWArtWater = W;
  if (typeof module !== 'undefined') module.exports = W;
})(typeof window !== 'undefined' ? window : globalThis);

// ═════════════════════════════════════════════════════════════════════════════════════════
// 第二代水面（挂在 window.AWArt2 上，配合 art-ground.js 里的 AWArt2.fields）：一格 = 48 逻辑像素。
//   AWArt2.shadeWater(F, frame, buf, bw, ox, oy)   把水面像素填进 buf
// 按离岸距离分带：白浪线（四帧一进一退）→ 贴岸浅水 → 浅水 → 中水 → 深水；带的边界用噪声错开。
// 深水是一张可平铺纹理：大块暗斑 + 成片的小波纹，波纹四帧里左右晃、明灭。河道窄，自然落在浅水几档里，另加顺流的亮纹。
(function (root) {
  'use strict';
  const A2 = root.AWArt2; if (!A2) return;
  const P = A2.P, rgb = A2.rgb, hash = A2.hash, vn = A2.vn, WT = 4;
  const C = { foam: rgb('#f4fcfc'), foam2: rgb('#b4ecf4'), w1: rgb('#5cd8ec'), w2: rgb('#1cb8dc'), w3: rgb('#049ccc'), w4: rgb('#048cbc'), deep: rgb('#047cac'), deepD: rgb('#0476a6'), wave: rgb('#34a8dc'), waveL: rgb('#7cd0ec'), edge: rgb('#0c5c8c') };
  Object.assign(A2.C, { water: C });
  let DEEP = null;
  function deepTex() {
    if (DEEP) return DEEP;
    DEEP = [];
    const base = new Uint32Array(P * P), per = c => P / c;
    for (let y = 0; y < P; y++) for (let x = 0; x < P; x++) base[y * P + x] = (vn(x, y, 48, 90, per(48)) * 0.6 + vn(x, y, 12, 91, per(12)) * 0.4) < 0.42 ? C.deepD : C.deep;
    for (let f = 0; f < 4; f++) {
      const t = base.slice(), put = (x, y, c) => { t[(((y % P) + P) % P) * P + (((x % P) + P) % P)] = c; };
      // 波纹：一小段拱形的亮线，按错位的格点排，成片出现
      for (let gy = 0; gy < P / 12; gy++) for (let gx = 0; gx < P / 24; gx++) {
        if (hash(gx, gy, 92) > 0.72) continue;
        const ph = (hash(gx, gy, 93) * 4) | 0, st = (f + ph) & 3;
        if (st === 3 && hash(gx, gy, 94) < 0.5) continue;
        const x = gx * 24 + (gy & 1 ? 12 : 0) + ((hash(gx, gy, 95) * 10) | 0) + [0, 1, 2, 1][st], y = gy * 12 + ((hash(gx, gy, 96) * 6) | 0);
        const n = 7 + ((hash(gx, gy, 97) * 4) | 0), c = st === 1 ? C.waveL : C.wave;
        for (let q = 0; q < n; q++) put(x + q, y + (q < 2 || q >= n - 2 ? 1 : 0), c);
      }
      DEEP.push(t);
    }
    return DEEP;
  }
  A2.shadeWater = function (F, frame, buf, bw, ox, oy) {
    const X = A2.tex(), nz = X.nz, deep = deepTex()[frame & 3], W = F.W, cls = F.cls, dist = F.dist;
    const fp = [3, 6, 9, 6][frame & 3];                    // 白浪线离岸的位置（3 倍像素）
    for (let y = F.y0; y < F.y1; y++) {
      const fo = (y - F.ey0) * W - F.ex0, bo = (y - F.y0 + oy) * bw + ox - F.x0, ty = (((y % P) + P) % P) * P;
      for (let x = F.x0; x < F.x1; x++) {
        const i = fo + x; if (cls[i] !== WT) continue;
        const ti = ty + (((x % P) + P) % P), d = dist[i];
        if (d >= 60) { buf[bo + x] = deep[ti]; continue; }
        const n = nz[ti], dd = d + (n - 128) * 0.07;
        let c;
        if (d <= 3 && cls[i - W] !== WT) c = C.edge;                                 // 崖脚的水线
        else if (dd >= fp - 3 && dd < fp + 5 && nz[(ti + 131 + frame * 7) % (P * P)] > 84) c = C.foam;
        else if (dd < fp - 3) c = C.foam2;
        else if (dd < 15) c = C.w1;
        else if (dd < 27) c = C.w2;
        else if (dd < 40) c = C.w3;
        else if (dd < 54) c = C.w4;
        else c = deep[ti];
        // 浅水里的亮纹（借深水纹理里波纹的位置）
        if (c !== C.foam && dd >= 15 && dd < 54) { const t = deep[ti]; if (t === C.wave || t === C.waveL) c = dd < 27 ? C.foam2 : dd < 40 ? C.w2 : C.w3; }
        buf[bo + x] = c;
      }
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
