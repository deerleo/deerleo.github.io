// 潮汐战线：像素美术壳层（window.AWArt）
// 只负责分发、缓存、缩放和占位；具体怎么画在 art-ground.js / art-water.js / art-buildings.js / art-units-*.js 里。
// 规范见 tools/ART-SPEC.md。旧的矢量画法备份在 tools/art.vector.bak.js。
(function (root) {
  'use strict';
  const D = root.AWData || {};
  const A = {};
  const TILE = 32, TOP = 16, FRAMES = 4, UNIT_W = 32, UNIT_H = 36, UNIT_TOP = 4;
  A.FRAMES = FRAMES; A.UNIT_H = UNIT_H; A.UNIT_TOP = UNIT_TOP;
  // 第二代画法（tiles.js + AWArt2 都在时启用）：一格 48 逻辑像素、上方留 24；否则是旧的 32 / 16。
  // A.TILE / A.TOP 跟着当前画法走，界面要用它们换算 renderMap 画布上的坐标，不要写死 32。
  const V2G = 48, V2TOP = 24;
  let forceLegacy = false;
  const v2 = () => !forceLegacy && !!root.AWTiles && !!root.AWArt2 && !!root.AWArt2.fields && !!root.AWArt2.shadeWater && !!root.AWArt2.objects;
  A.hd = v2; A.setLegacy = on => { forceLegacy = !!on; A.clearCache(); };
  Object.defineProperty(A, 'TILE', { get: () => v2() ? V2G : TILE, enumerable: true });
  Object.defineProperty(A, 'TOP', { get: () => v2() ? V2TOP : TOP, enumerable: true });

  // 阵营色：o 轮廓 d 暗 m 主 l 亮 h 高光；main/dark/light 是旧字段（ui.js 在用）
  const mkPal = (id, o, d, m, l, h) => ({ id, o, d, m, l, h, main: m, dark: d, light: l, pad: l });
  // 第三次定稿（照 concepts/px-b.png）：正红、正蓝、翠绿、金黄，和 tiles.js 的建筑、sprites.js 的单位换色结果对齐
  const PAL = [
    mkPal(0, '#2c3038', '#5c6470', '#8c94a0', '#c4c8d0', '#eceef0'),
    mkPal(1, '#4c1010', '#a82018', '#e03828', '#f06848', '#fca088'),
    mkPal(2, '#101c50', '#1c4cb0', '#2c70e0', '#58a0f4', '#a4d0fc'),
    mkPal(3, '#0c3418', '#1c7c38', '#2cac4c', '#60d070', '#a8eca8'),
    mkPal(4, '#4c3008', '#b07c10', '#e8b020', '#f8d048', '#fcec98'),
    mkPal(5, '#06080c', '#1c222c', '#343c4c', '#56667c', '#b8f0f8'),   // 玄潮：带蓝的炭黑，高光冷青白
  ];
  // 同阵营的副配色：编码 = 阵营 + 10 × 变体（11–15、21–25、31–35），数值是 tiles.js 的换色函数作用在红方母版四级色上的结果，素材和界面同一套
  const lighten = hex => '#' + [1, 3, 5].map(i => { const v = parseInt(hex.slice(i, i + 2), 16); return Math.round(v + (255 - v) * 0.45).toString(16).padStart(2, '0'); }).join('');
  [[11, '#5e2518', '#c14424', '#fa6137', '#ff8155'], [21, '#330d1a', '#69142e', '#881e3e', '#b04a66'], [31, '#734455', '#d17494', '#ff92b6', '#ffb4cc'],
    [12, '#0f4349', '#168a9a', '#24b4cb', '#5cd4e6'], [22, '#0b0e33', '#0f1369', '#181c88', '#4a52c0'], [32, '#3d5a6c', '#6ca4cd', '#8ccdff', '#b8e0ff'],
    [13, '#3a4911', '#759a1a', '#9acb29', '#bce25c'], [23, '#092919', '#0c5432', '#136d43', '#3c9a6c'], [33, '#3e675a', '#6fc2ab', '#90f4d9', '#bcfaea'],
    [14, '#412806', '#905602', '#c1780b', '#e09a30'], [24, '#332112', '#69421f', '#88592c', '#b88858'], [34, '#696146', '#c5b77e', '#f8e9a3', '#fff4b4'],
    [15, '#26292c', '#535a61', '#707982', '#a0aab4'], [25, '#241633', '#482869', '#603888', '#9470c4'], [35, '#585b5d', '#abb2b6', '#dce3e9', '#f2f6fa'],
  ].forEach(r => { PAL[r[0]] = mkPal(r[0], r[1], r[2], r[3], r[4], lighten(r[4])); });
  const palOf = owner => PAL[owner] || PAL[(owner | 0) % 10] || PAL[0];   // 变体号不认识的退回该阵营主色，个位不在 1–5 的退回中立（和 AWSprites / AWTiles 一致）
  A.palOf = palOf;
  A.PAL = PAL;
  // 界面和旧建筑画法用的阵营色（d 暗 / m 主 / l 亮 / h 高光），和 PAL 同一套颜色；第 0 项是中立的石板灰
  A.BPAL = []; PAL.forEach((p, i) => { A.BPAL[i] = { d: p.d, m: p.m, l: p.l, h: p.h }; });

  const WATER = { sea: 1, river: 1, reef: 1, beach: 1 };
  const BUILD = { hq: 1, city: 1, factory: 1, airport: 1, port: 1, tower: 1, mine: 1, hospital: 1, fort: 1, silo: 1, silo_used: 1, lab: 1, gate: 1 };
  const isBuild = t => !!BUILD[t] || !!(D.TERRAIN && D.TERRAIN[t] && D.TERRAIN[t].prop);
  A.isBuilding = isBuild;

  // ───────── 小工具 ─────────
  function hash(x, y, i) {
    let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul((i | 0) + 1, 1274126177);
    h = Math.imul(h ^ (h >>> 13), 1103515245); h ^= h >>> 16;
    h = Math.imul(h, 2246822519); h ^= h >>> 15;
    return (h >>> 0) / 4294967296;
  }
  function mk(w, h) { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; return cv; }
  function ctxOf(cv) { const c = cv.getContext('2d'); c.imageSmoothingEnabled = false; return c; }

  // 出错只记一次，不打断绘制；预览页会把 A.errors 显示出来
  A.errors = [];
  const noted = {};
  function note(key, e) {
    if (noted[key]) return; noted[key] = 1;
    const msg = key + '：' + (e && e.message || e);
    A.errors.push(msg);
    if (root.console) console.error('[AWArt] ' + msg, e);
  }

  // 3×5 点阵字母，占位块用
  const FONT = {
    A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111',
    F: '111100110100100', G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010',
    K: '101101110101101', L: '100100100100111', M: '101111111101101', N: '110101101101101', O: '010101101101010',
    P: '110101110100100', Q: '010101101110011', R: '110101110101101', S: '011100010001110', T: '111010010010010',
    U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101', Y: '101101010010010',
    Z: '111001010100111',
  };
  function letter(c, ch, x, y, s, col) {
    const g = FONT[String(ch || '?').toUpperCase()] || '111001010000010';
    c.fillStyle = col;
    for (let i = 0; i < 15; i++) if (g[i] === '1') c.fillRect(x + (i % 3) * s, y + ((i / 3) | 0) * s, s, s);
  }
  // 占位块：整格（地形）或一个小方块（建筑、单位），带类型首字母
  function phTile(c, type, bg, fg) {
    c.fillStyle = bg; c.fillRect(0, 0, 32, 32);
    c.fillStyle = 'rgba(30,20,70,.18)';
    for (let y = 0; y < 32; y += 8) for (let x = (y & 8); x < 32; x += 16) c.fillRect(x, y, 8, 8);
    c.fillRect(0, 31, 32, 1); c.fillRect(31, 0, 1, 32);
    if (type) letter(c, type[0], 13, 11, 2, fg);
  }
  function phBlock(c, type, pal, x, y, w, h) {
    c.fillStyle = 'rgba(30,20,70,.35)'; c.fillRect(x + 2, y + h, w, 2);
    c.fillStyle = pal.o; c.fillRect(x, y, w, h);
    c.fillStyle = pal.m; c.fillRect(x + 1, y + 1, w - 2, h - 2);
    c.fillStyle = pal.l; c.fillRect(x + 1, y + 1, w - 2, 2);
    c.fillStyle = pal.d; c.fillRect(x + 1, y + h - 3, w - 2, 2);
    letter(c, type[0], x + ((w - 6) >> 1), y + ((h - 10) >> 1), 2, pal.o);
  }
  const PH_BG = {
    plain: '#abbb64', forest: '#67803f', mountain: '#96908a', road: '#727176', bridge: '#a57c58', ruins: '#b8afa2',
    waste: '#c3a374', swamp: '#4f6b6c', wall: '#716e72', sea: '#237d9a', river: '#237d9a', reef: '#237d9a', beach: '#eec88a',
  };

  // 调模块里的函数；模块或函数缺席、或者抛错，都走 fallback
  function call(mod, key, c, info, fallback) {
    const M = root[mod], f = M && M[key];
    if (typeof f === 'function') {
      c.save();
      try { f(c, info); c.restore(); return true; } catch (e) { c.restore(); note(mod + '.' + key, e); }
    }
    if (fallback) fallback();
    return false;
  }

  function makeInfo(m, x, y, frame) {
    const type = m.t[y][x], own = m.owner;
    const inb = (xx, yy) => xx >= 0 && yy >= 0 && xx < m.w && yy < m.h;
    const owner = (own && own[y] && own[y][x]) || 0;
    return {
      type, x, y, frame, owner, pal: palOf(owner),
      rnd: i => hash(x, y, i),
      nb: (dx, dy) => inb(x + dx, y + dy) ? m.t[y + dy][x + dx] : type,
      nbOwner: (dx, dy) => inb(x + dx, y + dy) ? ((own && own[y + dy] && own[y + dy][x + dx]) || 0) : 0,
    };
  }
  A.tileInfo = (state, x, y, frame) => makeInfo(state.map, x, y, (frame | 0) & 3);

  // ───────── 像素缓冲 ─────────
  // 地形、建筑模块逐像素 fillRect，直接打在大画布上太慢。这里给它们一个假的 context：
  // fillStyle / fillRect / globalAlpha / save / restore / 转置变换都落在一块 32×48 的像素缓冲里，
  // 一格画完再整块贴到真画布上（一次 putImageData + 一次 drawImage）。
  const BW = 32, BH = 48, BTOP = 16;
  let pix = null, pixImg = null, pixCv = null, pixCtx = null;
  const colCache = new Map();
  function parseCol(str) {
    let r = 0, g = 0, b = 0, a = 1;
    if (str[0] === '#') { const n = parseInt(str.slice(1), 16); r = n >> 16 & 255; g = n >> 8 & 255; b = n & 255; }
    else { const m = /rgba?\(([^)]+)\)/.exec(str); if (m) { const q = m[1].split(',').map(Number); r = q[0]; g = q[1]; b = q[2]; a = q.length > 3 ? q[3] : 1; } }
    return { r, g, b, a, c: ((255 << 24) | (b << 16) | (g << 8) | r) >>> 0 };
  }
  const fast = {
    _fs: '', _e: parseCol('#000000'), _t: false, _minY: -16, _st: [], globalAlpha: 1, imageSmoothingEnabled: false,
    get fillStyle() { return this._fs; },
    set fillStyle(v) { if (v === this._fs) return; this._fs = v; let e = colCache.get(v); if (!e) { e = parseCol(String(v)); colCache.set(v, e); } this._e = e; },
    fillRect(x, y, w, h) {
      if (this._t) { let q = x; x = y; y = q; q = w; w = h; h = q; }
      x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
      let x1 = x + w, y1 = y + h;
      if (x < 0) x = 0; if (x1 > BW) x1 = BW; if (y < this._minY) y = this._minY; if (y1 > BH - BTOP) y1 = BH - BTOP;
      if (x >= x1 || y >= y1) return;
      const e = this._e, a = e.a * this.globalAlpha;
      if (a >= 0.999) { for (let j = y; j < y1; j++) { const o = (j + BTOP) * BW; for (let i = x; i < x1; i++) pix[o + i] = e.c; } return; }
      for (let j = y; j < y1; j++) {
        const o = (j + BTOP) * BW;
        for (let i = x; i < x1; i++) {
          const d = pix[o + i], da = d >>> 24;
          if (da === 0) { pix[o + i] = ((Math.round(a * 255) << 24) | (e.b << 16) | (e.g << 8) | e.r) >>> 0; continue; }
          if (da < 255) { pix[o + i] = ((Math.min(255, Math.round(da + a * (255 - da))) << 24) | (e.b << 16) | (e.g << 8) | e.r) >>> 0; continue; }
          const k = 1 - a;
          pix[o + i] = ((255 << 24) | (Math.round((d >> 16 & 255) * k + e.b * a) << 16) | (Math.round((d >> 8 & 255) * k + e.g * a) << 8) | Math.round((d & 255) * k + e.r * a)) >>> 0;
        }
      }
    },
    putPixels(buf) { pix.set(buf, BTOP * BW); },          // 整格 32×32 的不透明底（陆地模块的底层用）
    save() { this._st.push(this.globalAlpha, this._t); },
    restore() { if (this._st.length) { this._t = this._st.pop(); this.globalAlpha = this._st.pop(); } },
    transform(a, b, c, d, e, f) { if (a === 0 && b === 1 && c === 1 && d === 0 && !e && !f) this._t = !this._t; else throw new Error('像素缓冲只支持转置变换'); },
    beginPath() { }, rect() { }, clip() { },
  };
  function begin(minY) {
    if (!pix) { pixCv = mk(BW, BH); pixCtx = pixCv.getContext('2d'); pixImg = pixCtx.createImageData(BW, BH); pix = new Uint32Array(pixImg.data.buffer); }
    pix.fill(0); fast._minY = minY; fast._t = false; fast.globalAlpha = 1; fast._st.length = 0;
    return fast;
  }
  // 把这一格的缓冲交出去。c 是真 context（已平移到该格左上角），或整帧的像素缓冲 { buf, w, h, y0, y1 }（y0–y1 是允许写的行）
  function flush(c, tx, ty) {
    if (!c.buf) { pixCtx.putImageData(pixImg, 0, 0); c.drawImage(pixCv, 0, -BTOP); return; }
    const dst = c.buf, W = c.w, ox = tx * TILE, oy = TOP + ty * TILE - BTOP;
    for (let j = 0; j < BH; j++) {
      const Y = oy + j;
      if (Y < c.y0 || Y >= c.y1) continue;
      const so = j * BW, o = Y * W + ox;
      for (let i = 0; i < BW; i++) {
        const sp = pix[so + i], a = sp >>> 24;
        if (a === 0) continue;
        if (a === 255) { dst[o + i] = sp; continue; }
        const d = dst[o + i], da = d >>> 24;
        if (da === 0) { dst[o + i] = sp; continue; }
        const k = a / 255, q = 1 - k;
        dst[o + i] = ((Math.max(da, a) << 24) | (Math.round((d >> 16 & 255) * q + (sp >> 16 & 255) * k) << 16) | (Math.round((d >> 8 & 255) * q + (sp >> 8 & 255) * k) << 8) | Math.round((d & 255) * q + (sp & 255) * k)) >>> 0;
      }
    }
  }

  // 一格的地面层。c 是真 context（已平移到该格左上角，1 单位 = 1 逻辑像素）或整帧像素缓冲
  function drawGround(c, info) {
    const t = info.type, f = begin(t === 'mountain' ? -16 : -8);   // 山可以探出半格（上面也是山地时才用得到），别的地形 8 像素
    if (WATER[t]) {
      call('AWArtWater', t, f, info, () => phTile(f, t, PH_BG[t], '#eafcff'));
    } else if (t === 'bridge') {
      call('AWArtWater', 'base', f, info, () => phTile(f, '', PH_BG.river, '#eafcff'));
      call('AWArtGround', 'bridge', f, info, () => phBlock(f, t, { o: '#5a3a34', d: '#8a5a3c', m: '#b98250', l: '#e0b070' }, 0, 7, 32, 18));
    } else if (isBuild(t)) {
      if (t === 'port') call('AWArtWater', 'base', f, info, () => phTile(f, '', PH_BG.sea, '#eafcff'));
      else call('AWArtGround', 'pad', f, info, () => call('AWArtGround', 'plain', f, info, () => phTile(f, '', PH_BG.plain, '#173f3a')));
    } else {
      call('AWArtGround', t, f, info, () => phTile(f, t, PH_BG[t] || '#6d6a85', '#f4f4f8'));
    }
    flush(c, info.x, info.y);
  }
  // 一格的建筑层（可往上探 16 像素）
  function drawBuilding(c, info) {
    const t = info.type;
    if (!isBuild(t)) return;
    const f = begin(-16);
    call('AWArtBuildings', t, f, info, () => phBlock(f, t, info.pal, 5, 4, 22, 24));
    const G = root.AWArtGround;
    if (G && typeof G.foot === 'function') call('AWArtGround', 'foot', f, info, null);   // 压在墙脚上的草和碎石
    flush(c, info.x, info.y);
  }

  // ───────── 整张地图 ─────────
  // 每帧一张整图画布，但只有第一张是逐格画出来的：
  //   · 没有动画的地形（STATIC）只画一次，其余几帧从第一张拷过去，再把会动的格子（水、桥、沼泽、废墟、建筑）按该帧重画；
  //   · 归属或地形变了，只重画变化的格子连同它上方探出的 16 像素（四帧都补），不整图重来。
  const STATIC = { plain: 1, forest: 1, mountain: 1, road: 1, waste: 1, wall: 1 };
  A.STATIC = STATIC;                                   // 新加了不动的地形可以往里登记
  const pokes = t => isBuild(t) || t === 'forest' || t === 'mountain' || t === 'ruins';   // 会探到上一格里的东西（废墟是那缕烟）
  let mapCache = new WeakMap();
  const typeIds = {}; let typeN = 0;
  const tid = t => typeIds[t] || (typeIds[t] = ++typeN);
  const modsFlag = () => (root.AWArtGround ? 1 : 0) + (root.AWArtWater ? 2 : 0) + (root.AWArtBuildings ? 4 : 0);
  function drawCell(c, m, x, y, frame) {
    const info = makeInfo(m, x, y, frame);
    if (c.buf) { drawGround(c, info); if (isBuild(info.type)) drawBuilding(c, info); return; }
    c.save(); c.translate(x * TILE, TOP + y * TILE);
    drawGround(c, info);
    if (isBuild(info.type)) drawBuilding(c, info);
    c.restore();
  }
  // 重画一格：tall 时连同上方 16 像素。区域里有上一格的下半截、下一格探上来的树尖屋顶，按从上到下的次序补回去
  function redrawCell(c, m, x, y, frame, tall) {
    const px = x * TILE, py = TOP + y * TILE, up = tall ? TOP : 0;
    if (c.buf) { c.y0 = py - up; c.y1 = py + TILE; }            // 像素缓冲：地面是不透明的整格，不用先清
    else { c.save(); c.beginPath(); c.rect(px, py - up, TILE, TILE + up); c.clip(); c.clearRect(px, py - up, TILE, TILE + up); }
    if (tall && y > 0) drawCell(c, m, x, y - 1, frame);
    drawCell(c, m, x, y, frame);
    if (y + 1 < m.h && pokes(m.t[y + 1][x])) drawCell(c, m, x, y + 1, frame);
    if (c.buf) { c.y0 = 0; c.y1 = c.h; } else c.restore();
  }
  // 整帧先在一块像素缓冲里拼好，最后一次 putImageData 交给画布（逐格往大画布上贴要慢一个量级）
  function newTarget(m, from) {
    const w = m.w * TILE, h = m.h * TILE + TOP;
    return { buf: from ? from.buf.slice() : new Uint32Array(w * h), w, h, y0: 0, y1: h };
  }
  function toCanvas(t) {
    const cv = mk(t.w, t.h), c = ctxOf(cv);
    c.putImageData(new ImageData(new Uint8ClampedArray(t.buf.buffer), t.w, t.h), 0, 0);
    return cv;
  }
  function fullFrame(m, frame) {
    const t = newTarget(m);
    for (let y = 0; y < m.h; y++) {
      const infos = [];
      for (let x = 0; x < m.w; x++) drawGround(t, infos[x] = makeInfo(m, x, y, frame));
      for (let x = 0; x < m.w; x++) if (isBuild(infos[x].type)) drawBuilding(t, infos[x]);
    }
    return t;
  }
  function snapshot(m) {
    const ids = new Uint16Array(m.w * m.h), own = new Uint8Array(m.w * m.h);
    for (let y = 0; y < m.h; y++) {
      const tr = m.t[y], or = m.owner && m.owner[y];
      for (let x = 0; x < m.w; x++) { ids[y * m.w + x] = tid(tr[x]); own[y * m.w + x] = (or && or[x]) || 0; }
    }
    return { ids, own };
  }
  // 和上次的快照比：返回要重画的格子（地形变了的连周围八格，只换归属的只算自己）；变化太多返回 null，整图重来
  function diff(m, e) {
    const w = m.w, h = m.h, dirty = new Set(), mt = tid('mountain');
    let n = 0;
    for (let y = 0; y < h; y++) {
      const tr = m.t[y], or = m.owner && m.owner[y];
      for (let x = 0; x < w; x++) {
        const i = y * w + x, id = tid(tr[x]), o = (or && or[x]) || 0;
        if (id === e.ids[i] && o === e.own[i]) continue;
        if (++n > 64) return null;
        if (id !== e.ids[i]) {
          const rx = (id === mt || e.ids[i] === mt) ? 2 : 1;      // 山峰比格子宽，会伸到左右邻格里：山地增减时同一行多重画一格
          for (let dy = -1; dy <= 1; dy++) for (let dx = -rx; dx <= rx; dx++) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < w && yy < h) dirty.add(yy * w + xx); }
        } else dirty.add(i);
        e.ids[i] = id; e.own[i] = o;
      }
    }
    return dirty;
  }
  // ───────── 第二代整图渲染（一格 48 逻辑像素） ─────────
  // 底层按像素算（AWArt2.fields → shadeLand / shadeWater），物件（tiles.js 的素材）按落脚线从上到下贴。
  // 四帧各渲染一次；地形或归属变了，只把变化格子周围 3×3 格重算一遍，贴回四帧的画布。
  function stamp(buf, bw, bh, e, ox, oy, frame) {
    const s = e.s, sw = s.w, sh = s.h, pix = s.pix, x0 = e.x + ox, y0 = e.y + oy;
    const sway = e.sway && (((frame + e.sway) & 3) < 2) ? 1 : 0, mid = sh >> 1;
    for (let j = 0; j < sh; j++) {
      const Y = y0 + j; if (Y < 0 || Y >= bh) continue;
      const so = j * sw, o = Y * bw + x0 + (sway && j < mid ? 1 : 0);
      for (let i = 0; i < sw; i++) { const v = pix[so + i]; if (!v) continue; const X = x0 + i; if (X < 0 || X >= bw - (sway ? 1 : 0)) continue; buf[o + i] = v; }
    }
  }
  // 投影：落脚线上一个压扁的椭圆，把地面压暗（和 sprites.js 里单位的投影同一个颜色和深浅）
  function shadow(buf, bw, bh, sh, ox, oy) {
    const cx = sh[0] + ox, cy = sh[1] + oy, rx = sh[2], ry = sh[3];
    for (let y = -ry; y <= ry; y++) {
      const Y = cy + y; if (Y < 0 || Y >= bh) continue;
      const half = Math.round(rx * Math.sqrt(1 - (y * y) / ((ry + 0.5) * (ry + 0.5))));
      for (let X = Math.max(0, cx - half); X <= Math.min(bw - 1, cx + half); X++) {
        const d = buf[Y * bw + X]; if ((d >>> 24) !== 255) continue;
        buf[Y * bw + X] = ((255 << 24) | (((d >> 16 & 255) * 0.70 + 16) << 16) | (((d >> 8 & 255) * 0.70 + 8) << 8) | ((d & 255) * 0.70 + 6)) >>> 0;
      }
    }
  }
  // 辉光：地面上一个扁椭圆，往橙色提亮（里圈重、外圈轻，两档）
  function glow(buf, bw, bh, gl, ox, oy) {
    const cx = gl[0] + ox, cy = gl[1] + oy, rx = gl[2], ry = gl[3];
    for (let y = -ry; y <= ry; y++) {
      const Y = cy + y; if (Y < 0 || Y >= bh) continue;
      for (let x = -rx; x <= rx; x++) {
        const X = cx + x; if (X < 0 || X >= bw) continue;
        const q = (x * x) / (rx * rx) + (y * y) / (ry * ry); if (q > 1) continue;
        const d = buf[Y * bw + X]; if ((d >>> 24) !== 255) continue;
        const k = q < 0.45 ? 0.42 : 0.2;
        buf[Y * bw + X] = ((255 << 24) | (Math.round((d >> 16 & 255) * (1 - k) + 40 * k) << 16) | (Math.round((d >> 8 & 255) * (1 - k) + 150 * k) << 8) | Math.round((d & 255) * (1 - k) + 255 * k)) >>> 0;
      }
    }
  }
  // 画一块像素矩形（地图像素坐标；y0 可以是 −V2TOP，表示连最上面探出去的那一条）→ Uint32Array（宽 x1−x0）
  function renderRect(m, frame, x0, y0, x1, y1, F, keepLand) {
    const A2 = root.AWArt2, bw = x1 - x0, bh = y1 - y0, buf = new Uint32Array(bw * bh);
    const gy0 = Math.max(0, y0);
    if (!F) F = A2.fields(m, x0, gy0, x1, y1);
    // 陆地四帧都一样：整图渲染时第一帧画完留一份（F.land），后面几帧直接拷
    if (F.land && F.land.length === buf.length) buf.set(F.land);
    else { A2.shadeLand(F, frame, buf, bw, 0, gy0 - y0); if (keepLand) F.land = buf.slice(); }
    A2.shadeWater(F, frame, buf, bw, 0, gy0 - y0);
    const tx0 = Math.max(0, Math.floor(x0 / V2G) - 1), tx1 = Math.min(m.w - 1, Math.floor((x1 - 1) / V2G) + 1);
    const ty0 = Math.max(0, Math.floor(y0 / V2G) - 1), ty1 = Math.min(m.h - 1, Math.floor((y1 - 1) / V2G) + 2);
    const list = [];
    for (let ty = ty0; ty <= ty1; ty++) {
      list.length = 0;
      for (let tx = tx0; tx <= tx1; tx++) { try { A2.objects(m, tx, ty, frame, list); } catch (e) { note('AWArt2.objects', e); } }
      list.sort((a, b) => a.b - b.b);
      for (const e of list) { if (e.sh) shadow(buf, bw, bh, e.sh, -x0, -y0); if (e.gl) glow(buf, bw, bh, e.gl, -x0, -y0); }
      for (const e of list) stamp(buf, bw, bh, e, -x0, -y0, frame);
    }
    return { buf, F };
  }
  let mapCache2 = new WeakMap();
  function renderMap2(state, frame) {
    const m = state.map, W = m.w * V2G, H = m.h * V2G + V2TOP;
    let e = mapCache2.get(m);
    if (e && (e.w !== m.w || e.h !== m.h)) e = null;
    if (e) {
      const dirty = diff(m, e);
      if (!dirty) e = null;
      else if (dirty.size) {
        e.F = null;
        const done = [];
        dirty.forEach(i => {
          const tx = i % m.w, ty = (i / m.w) | 0;
          const x0 = Math.max(0, (tx - 1) * V2G), x1 = Math.min(W, (tx + 2) * V2G), y0 = ty <= 1 ? -V2TOP : (ty - 1) * V2G, y1 = Math.min(m.h * V2G, (ty + 2) * V2G);
          let F = null;
          for (let f = 0; f < FRAMES; f++) {
            if (!e.cv[f]) continue;
            const r = renderRect(m, f, x0, y0, x1, y1, F); F = r.F;
            ctxOf(e.cv[f]).putImageData(new ImageData(new Uint8ClampedArray(r.buf.buffer), x1 - x0, y1 - y0), x0, y0 + V2TOP);
          }
        });
      }
    }
    if (!e) { const sn = snapshot(m); e = { w: m.w, h: m.h, ids: sn.ids, own: sn.own, cv: [], F: null }; mapCache2.set(m, e); }
    if (e.cv[frame]) return e.cv[frame];
    const r = renderRect(m, frame, 0, -V2TOP, W, m.h * V2G, e.F, true); e.F = r.F;
    const cv = mk(W, H); ctxOf(cv).putImageData(new ImageData(new Uint8ClampedArray(r.buf.buffer), W, H), 0, 0);
    e.cv[frame] = cv;
    let all = true; for (let f = 0; f < FRAMES; f++) if (!e.cv[f]) all = false;
    if (all) e.F = null;                                 // 四帧齐了，整图的类别 / 距离数组就不留了
    return cv;
  }

  A.renderMap = function (state, frame) {
    const m = state.map; frame = (((frame | 0) % FRAMES) + FRAMES) % FRAMES;
    if (v2()) { try { return renderMap2(state, frame); } catch (e) { note('renderMap2', e); } }
    let e = mapCache.get(m);
    const mods = modsFlag();
    if (e && (e.w !== m.w || e.h !== m.h || e.mods !== mods)) e = null;
    if (e) {
      const dirty = diff(m, e);
      if (!dirty) e = null;
      else if (dirty.size) {
        for (let f = 0; f < FRAMES; f++) {
          if (!e.cv[f]) continue;
          const c = ctxOf(e.cv[f]);
          dirty.forEach(i => redrawCell(c, m, i % m.w, (i / m.w) | 0, f, true));
        }
        if (e.img) dirty.forEach(i => redrawCell(e.img, m, i % m.w, (i / m.w) | 0, e.first, true));
      }
    }
    if (!e) { const sn = snapshot(m); e = { w: m.w, h: m.h, mods, ids: sn.ids, own: sn.own, cv: [], first: -1, img: null }; mapCache.set(m, e); }
    if (e.cv[frame]) return e.cv[frame];
    if (e.first < 0) { e.first = frame; e.img = fullFrame(m, frame); return (e.cv[frame] = toCanvas(e.img)); }
    // 其余几帧：拷第一帧的像素，再把会动的格子按这一帧重画
    const t = newTarget(m, e.img);
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
      const tp = m.t[y][x];
      if (!STATIC[tp]) redrawCell(t, m, x, y, frame, pokes(tp));
    }
    e.cv[frame] = toCanvas(t);
    let all = true; for (let f = 0; f < FRAMES; f++) if (!e.cv[f]) all = false;
    if (all) e.img = null;                               // 四帧齐了，第一帧的像素缓冲就不留了
    return e.cv[frame];
  };

  // 旧接口：ctx 已平移缩放到该格（1 单位 = 一格）。探出格子上方的部分照画，调用方按行从上到下画即可。
  let scratch = null;
  A.terrain = function (ctx, state, x, y, frame) {
    if (v2()) {   // 第二代：从整图上裁这一格（连上方探出的半格）。renderMap 自己会增量更新，界面不需要再用它往整图上补画
      const cv = A.renderMap(state, frame), old = ctx.imageSmoothingEnabled;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(cv, x * V2G, y * V2G, V2G, V2G + V2TOP, 0, -0.5, 1, 1.5);
      ctx.imageSmoothingEnabled = old; return;
    }
    if (!scratch) scratch = mk(TILE, TILE + TOP);
    const c = ctxOf(scratch), info = makeInfo(state.map, x, y, (frame | 0) & 3);
    c.clearRect(0, 0, TILE, TILE + TOP);
    c.save(); c.translate(0, TOP); drawGround(c, info); drawBuilding(c, info); c.restore();
    const old = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(scratch, 0, -TOP / TILE, 1, (TILE + TOP) / TILE);
    ctx.imageSmoothingEnabled = old;
  };

  // ───────── 单位 ─────────
  let unitCache = {}, baseCache = {}, icons = {};
  // 单位外描边：只沿不透明的剪影外缘描 1 像素，半透明的投影不算剪影、也不描。
  // 方案（A.setOutline 切换，预览页 ?view=outline 有对比）：none 不描；light 阵营高光色；white 近白；
  // lower 只描下半；dark 阵营最深色；double 先深后亮两圈
  let outlineMode = 'none';   // 方案还没定（单位在返工），先不描；?view=outline 里对比
  A.OUTLINES = ['none', 'light', 'white', 'lower', 'dark', 'double'];
  A.setOutline = function (mode) { outlineMode = A.OUTLINES.indexOf(mode) >= 0 ? mode : 'none'; unitCache = {}; baseCache = {}; icons = {}; };
  A.getOutline = () => outlineMode;
  function rim(c, pal) {
    if (outlineMode === 'none') return;
    const W = UNIT_W, H = UNIT_H, img = c.getImageData(0, 0, W, H), d = img.data;
    const solid = new Uint8Array(W * H);
    let y0 = H, y1 = 0;
    for (let i = 0; i < W * H; i++) if (d[i * 4 + 3] >= 200) { solid[i] = 1; const y = (i / W) | 0; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    const ring = src => {
      const out = [];
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const i = y * W + x;
        if (src[i]) continue;
        if ((x > 0 && src[i - 1] === 1) || (x < W - 1 && src[i + 1] === 1) || (y > 0 && src[i - W] === 1) || (y < H - 1 && src[i + W] === 1)) out.push(i);
      }
      return out;
    };
    const put = (list, hex) => {
      const n = parseInt(hex.slice(1), 16);
      for (const i of list) { d[i * 4] = n >> 16 & 255; d[i * 4 + 1] = n >> 8 & 255; d[i * 4 + 2] = n & 255; d[i * 4 + 3] = 255; }
    };
    const mid = (y0 + y1) >> 1;
    if (outlineMode === 'light') put(ring(solid), pal.h);
    else if (outlineMode === 'white') put(ring(solid), '#f4f8ff');
    else if (outlineMode === 'lower') put(ring(solid).filter(i => ((i / W) | 0) >= mid), pal.h);
    else if (outlineMode === 'dark') put(ring(solid), pal.o);
    else if (outlineMode === 'double') {
      const r1 = ring(solid); put(r1, pal.o);
      for (const i of r1) solid[i] = 2;                 // 第二圈只贴着第一圈长
      const s2 = solid.map(v => v === 2 ? 1 : v === 1 ? 3 : 0);
      put(ring(s2).filter(i => !solid[i]), pal.h);
    }
    c.putImageData(img, 0, 0);
  }
  A.clearCache = () => { unitCache = {}; baseCache = {}; icons = {}; mapCache = new WeakMap(); mapCache2 = new WeakMap(); sprCache.clear(); };

  // 32×36 逻辑像素的原始精灵（上面 4 像素留给天线、旋翼）
  function unitBase(type, owner, dim, frame) {
    const k = type + '|' + owner + '|' + (dim ? 1 : 0) + '|' + frame;
    if (baseCache[k]) return baseCache[k];
    const cv = mk(UNIT_W, UNIT_H), c = ctxOf(cv), pal = palOf(owner);
    c.save();
    if (owner > 0 && owner % 2 === 0) { c.translate(UNIT_W, 0); c.scale(-1, 1); }   // 偶数编号的阵营朝左
    c.translate(0, UNIT_TOP);
    const ok = call('AWArtUnits', type, c, { type, frame, owner, pal }, null);
    c.restore();
    if (!ok) { c.save(); c.translate(0, UNIT_TOP); phBlock(c, type || '?', pal, 7, 8, 18, 18); c.restore(); }
    rim(c, pal);
    if (dim) { c.globalCompositeOperation = 'source-atop'; c.fillStyle = 'rgba(24,18,56,.52)'; c.fillRect(0, 0, UNIT_W, UNIT_H); c.globalCompositeOperation = 'source-over'; }
    return (baseCache[k] = cv);
  }
  // ───────── 逐帧素材（sprites.js → window.AWSprites，可缺席） ─────────
  // 素材就绪且有这个兵种时，unit / drawUnit / icon 都改用它；否则退回上面的代码画法。
  // 状态与建议帧间隔（毫秒）。各状态帧数用 A.unitFrames(type, state) 取（待机 2、移动 4、攻击 3、受击 2）。
  A.unitStates = ['idle', 'move', 'attack', 'hit'];
  A.unitInterval = { idle: 450, move: 110, attack: 90, hit: 80 };
  const FOOT = 0.93;          // 落脚点在格子里的高度（0 顶、1 底）：下沿中点偏上一点
  const FIT = 0.90;           // 旧接口（画布正好一格宽）取素材画布中间这么大一块，单位约为完整尺寸的 95%
  let sprCache = new Map();
  const sprOf = type => { const S = root.AWSprites; return S && S.has && S.has(type) ? S : null; };
  A.hasSprite = type => !!sprOf(type);
  A.unitFrames = (type, state) => { const S = sprOf(type); return S ? S.frames(type, state || 'idle') : FRAMES; };
  // opts：状态名，或 { state, i, flip, shadow }。不给 i 时用 frame：待机按旧的 0–3 四拍走（每帧停两拍），其余状态 frame 就是帧号
  function sprGet(S, type, owner, dim, frame, opts, px, full) {
    const o = typeof opts === 'string' ? { state: opts } : (opts || {});
    const state = o.state || 'idle', n = S.frames(type, state);
    let i = o.i != null ? o.i | 0 : (state === 'idle' ? (frame | 0) >> 1 : frame | 0); i = ((i % n) + n) % n;
    const flip = (owner > 0 && owner % 2 === 0) !== !!o.flip, shadow = o.shadow !== false, ghost = !!o.ghost;   // 偶数编号的阵营朝左；ghost = 隐蔽（半透明加冷青轮廓）
    const k = type + '|' + owner + '|' + (dim ? 1 : 0) + state + i + (flip ? 1 : 0) + (shadow ? 1 : 0) + (ghost ? 'G' : '') + (full ? 'F' : 'f') + px;
    let cv = sprCache.get(k); if (cv) return cv;
    const src = S.frame(type, owner, state, i, { dim: !!dim, flip, shadow, ghost }); if (!src) return null;
    const SZ = S.size;
    if (sprCache.size > 4000) sprCache.clear();
    // 像素素材（S.pixel）：先按整数倍最近邻放大，倍数不是整数时再平滑缩到目标尺寸，像素块保持方正清楚；旧的高清素材直接平滑缩放
    const scaleTo = (sx, sy, sw, sh, w, h) => {
      const out = mk(w, h), c = out.getContext('2d');
      if (!S.pixel) { c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high'; c.drawImage(src, sx, sy, sw, sh, 0, 0, w, h); return out; }
      const n = Math.max(1, Math.ceil(w / sw - 0.001));
      if (sw * n === w) { c.imageSmoothingEnabled = false; c.drawImage(src, sx, sy, sw, sh, 0, 0, w, h); return out; }
      const big = mk(sw * n, sh * n), bc = big.getContext('2d'); bc.imageSmoothingEnabled = false; bc.drawImage(src, sx, sy, sw, sh, 0, 0, sw * n, sh * n);
      c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high'; c.drawImage(big, 0, 0, w, h); return out;
    };
    if (full) {
      const w = Math.max(8, Math.round(px * SZ / S.tile)); cv = scaleTo(0, 0, SZ, SZ, w, w);
      const q = w / SZ; cv.dx = Math.round(px / 2 - S.anchor.x * q); cv.dy = Math.round(px * FOOT - S.anchor.y * q);
    } else {
      const cw = Math.round(SZ * FIT), sx = (SZ - cw) >> 1; cv = scaleTo(sx, 0, cw, cw, px, px);
      cv.unitTop = 0;
    }
    sprCache.set(k, cv); return cv;
  }
  // 完整尺寸的单位（比格子大一圈）。tilePx 是一格的实际像素数；返回画布 cv，画在格子左上角偏移 (cv.dx, cv.dy) 处、不缩放：
  //   const cv = A.unitSprite(type, owner, dim, tilePx, frame, { state: 'move', i: n }); ctx.drawImage(cv, tileX + cv.dx, tileY + cv.dy);
  // 没有素材时返回 null（调用方退回 A.unit）。
  A.unitSprite = function (type, owner, dim, tilePx, frame, opts) {
    const S = sprOf(type); if (!S) return null;
    return sprGet(S, type, owner | 0, !!dim, frame | 0, opts, Math.max(8, Math.round(tilePx || 32)), true);
  };

  // 返回缓存画布，宽 sizePx。旧画法高 sizePx×36/32（cv.unitTop 是顶部留白的像素数）；新素材是 sizePx×sizePx 的正方形（unitTop = 0）。
  // 两种都按“宽 = 一格、下沿对齐格子下沿”画：drawImage(cv, x, y + ts - ts*cv.height/cv.width, ts, ts*cv.height/cv.width)，或者直接用 A.drawUnit。
  // 新素材是平滑的高清图：sizePx 要给实际屏幕像素（格子边长 × dpr），不要给 32 再放大。
  // opts（可选，放最后）：状态名或 { state, i, flip, shadow }，见 sprGet。旧调用只传 frame 0–3，显示待机动画。
  A.unit = function (type, owner, dim, sizePx, frame, opts) {
    sizePx = Math.max(8, Math.round(sizePx || 32)); owner = owner | 0;
    const S = sprOf(type);
    if (S) { const cv = sprGet(S, type, owner, !!dim, frame | 0, opts, sizePx, false); if (cv) return cv; }
    frame = (frame | 0) & 3;
    const k = type + '|' + owner + '|' + (dim ? 1 : 0) + '|' + sizePx + '|' + frame;
    if (unitCache[k]) return unitCache[k];
    const base = unitBase(type, owner, !!dim, frame);
    const n = Math.max(1, Math.ceil(sizePx / UNIT_W));
    let cv = mk(UNIT_W * n, UNIT_H * n), c = ctxOf(cv);
    c.drawImage(base, 0, 0, UNIT_W * n, UNIT_H * n);
    if (UNIT_W * n !== sizePx) {
      const out = mk(sizePx, Math.round(sizePx * UNIT_H / UNIT_W)), oc = out.getContext('2d');
      oc.imageSmoothingEnabled = true; oc.imageSmoothingQuality = 'high';
      oc.drawImage(cv, 0, 0, out.width, out.height);
      cv = out;
    }
    cv.unitTop = Math.round(sizePx * UNIT_TOP / UNIT_W);
    return (unitCache[k] = cv);
  };
  // 在 (x, y) 处按格子边长 ts 画一个单位（ctx 用屏幕坐标，dpr 是 ctx 的像素密度）。有新素材时画完整尺寸（比格子大一圈，按落脚点对齐）
  A.drawUnit = function (ctx, type, owner, dim, frame, x, y, ts, dpr, opts) {
    dpr = dpr || 1;
    const sp = A.unitSprite(type, owner, dim, ts * dpr, frame, opts);
    if (sp) { ctx.drawImage(sp, x + sp.dx / dpr, y + sp.dy / dpr, sp.width / dpr, sp.height / dpr); return; }
    const cv = A.unit(type, owner, dim, ts * dpr, frame);
    ctx.drawImage(cv, x, y - ts * UNIT_TOP / UNIT_W, ts, ts * UNIT_H / UNIT_W);
  };
  // 菜单图标：正方形，精灵居中不变形
  A.icon = function (type, owner) {
    const S = sprOf(type), k = (S ? 's|' : '') + type + '|' + owner;
    if (icons[k]) return icons[k];
    if (S) { const sp = sprGet(S, type, owner | 0, false, 0, null, UNIT_H * 3, false); if (sp) return (icons[k] = sp.toDataURL()); }
    const s = 3, cv = mk(UNIT_H * s, UNIT_H * s), c = ctxOf(cv);
    c.drawImage(unitBase(type, owner | 0, false, 0), ((UNIT_H - UNIT_W) / 2) * s, 0, UNIT_W * s, UNIT_H * s);
    return (icons[k] = cv.toDataURL());
  };

  // 军衔星：界面叠加层用（坐标和半径由调用方给，沿用旧签名）
  A.star = function (c, x, y, r, fill) {
    c.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 5, rad = i % 2 ? r * 0.45 : r;
      if (i) c.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad); else c.moveTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad);
    }
    c.closePath(); c.fillStyle = fill; c.fill();
    c.strokeStyle = '#3a3550'; c.lineWidth = 0.02; c.lineJoin = 'round'; c.stroke();
  };

  root.AWArt = A;
})(window);
