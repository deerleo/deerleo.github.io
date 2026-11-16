/* pixel.js — the 16-bit look: bitmap font, panels, dither pass, sprite quantiser */
(() => {
  'use strict';
  const BD = window.BD, U = BD.U;
  BD.FBW = 480; BD.FBH = 270;

  /* --------------------------------------------------------- 5x7 bitmap font */
  // classic column-encoded 5x7 glyphs, ASCII 0x20..0x7E, bit 0 = top row
  const HEX =
    '0000000000' + '00005F0000' + '0007000700' + '147F147F14' + '242A7F2A12' + '2313086462' + '3649552250' + '0005030000' +
    '001C224100' + '0041221C00' + '14083E0814' + '08083E0808' + '0050300000' + '0808080808' + '0060600000' + '2010080402' +
    '3E5149453E' + '00427F4000' + '4261514946' + '2141454B31' + '1814127F10' + '2745454539' + '3C4A494930' + '0171090503' +
    '3649494936' + '064949291E' + '0036360000' + '0056360000' + '0814224100' + '1414141414' + '0041221408' + '0201510906' +
    '324979413E' + '7E1111117E' + '7F49494936' + '3E41414122' + '7F4141221C' + '7F49494941' + '7F09090901' + '3E4149497A' +
    '7F0808087F' + '00417F4100' + '2040413F01' + '7F08142241' + '7F40404040' + '7F020C027F' + '7F0408107F' + '3E4141413E' +
    '7F09090906' + '3E4151215E' + '7F09192946' + '4649494931' + '01017F0101' + '3F4040403F' + '1F2040201F' + '3F4038403F' +
    '6314081463' + '0708700807' + '6151494543' + '007F414100' + '0204081020' + '0041417F00' + '0402010204' + '4040404040' +
    '0001020400' + '2054545478' + '7F48444438' + '3844444420' + '384444487F' + '3854545418' + '087E090102' + '0C5252523E' +
    '7F08040478' + '00447D4000' + '2040443D00' + '7F10284400' + '00417F4000' + '7C04180478' + '7C08040478' + '3844444438' +
    '7C14141408' + '081414187C' + '7C08040408' + '4854545420' + '043F444020' + '3C4040207C' + '1C2040201C' + '3C4030403C' +
    '4428102844' + '0C5050503C' + '4464544C44' + '0008364100' + '00007F0000' + '0041360800' + '0804081008' +
    // extras: ▼ ▶ • ★ ♥ ◀ ▲
    '040C1C0C04' + '7F3E1C0800' + '0018180000' + '2C1C0E1C2C' + '0C1E3C1E0C' + '00081C3E7F' + '1018381810';
  const EXTRA = { '▼': 95, '▶': 96, '•': 97, '★': 98, '♥': 99, '◀': 100, '▲': 101, '’': 7, '‘': 7, '“': 2, '”': 2, '—': 13, '–': 13, '…': 14 };
  const NG = HEX.length / 10;
  let atlasW = null;
  const atlases = new Map();
  function baseAtlas() {
    if (atlasW) return atlasW;
    const [c, g] = U.canvas(NG * 6, 8);
    g.fillStyle = '#fff';
    for (let i = 0; i < NG; i++) for (let col = 0; col < 5; col++) {
      const bits = parseInt(HEX.substr(i * 10 + col * 2, 2), 16);
      for (let r = 0; r < 7; r++) if (bits & (1 << r)) g.fillRect(i * 6 + col, r, 1, 1);
    }
    return (atlasW = c);
  }
  function atlas(color) {
    let a = atlases.get(color);
    if (a) return a;
    const [c, g] = U.canvas(NG * 6, 8);
    g.drawImage(baseAtlas(), 0, 0);
    g.globalCompositeOperation = 'source-in';
    g.fillStyle = color; g.fillRect(0, 0, NG * 6, 8);
    atlases.set(color, c);
    return c;
  }
  const idx = (ch) => {
    const e = EXTRA[ch];
    if (e !== undefined) return e;
    const k = ch.charCodeAt(0) - 32;
    return k >= 0 && k < 95 ? k : 31;
  };
  function blit(g, a, str, x, y, sc) {
    for (let i = 0; i < str.length; i++) {
      const ch = str[i];
      if (ch !== ' ') g.drawImage(a, idx(ch) * 6, 0, 5, 7, x + i * 6 * sc, y, 5 * sc, 7 * sc);
    }
  }
  const Text = (BD.Text = {
    width: (str, sc = 1) => str.length * 6 * sc - sc,
    /** o: { color, scale, shadow, outline, align: 'left'|'center'|'right' } — pixel coordinates */
    draw(g, str, x, y, o) {
      o = o || {};
      const sc = o.scale || 1;
      str = String(str);
      const w = this.width(str, sc);
      if (o.align === 'center') x -= w / 2; else if (o.align === 'right') x -= w;
      x = Math.round(x); y = Math.round(y);
      if (o.outline) {
        const a = atlas(o.outline);
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (dx || dy) blit(g, a, str, x + dx * sc, y + dy * sc, sc);
        if (o.shadow) blit(g, a, str, x + sc, y + 2 * sc, sc);
      } else if (o.shadow) blit(g, atlas(o.shadow), str, x + sc, y + sc, sc);
      blit(g, atlas(o.color || '#ffffff'), str, x, y, sc);
      return w;
    },
    wrap(str, maxChars) {
      const out = [];
      for (const para of String(str).split('\n')) {
        let line = '';
        for (const word of para.split(' ')) {
          if (line.length + word.length + (line ? 1 : 0) > maxChars) { out.push(line); line = word; }
          else line += (line ? ' ' : '') + word;
        }
        out.push(line);
      }
      return out;
    },
    /** big display lettering: vertical gradient fill + dark outline + drop shadow, cached */
    banner(str, sc, top, bottom, outline, shear) {
      const key = [str, sc, top, bottom, outline, shear].join('|');
      let c = this._b.get(key);
      if (c) return c;
      const bw = sc >= 3 ? Math.ceil(sc * 0.45) : 0;             // extra stroke weight for big lettering
      const w = this.width(str, sc) + bw, h = 7 * sc, pad = sc + 3, sh = shear ? Math.ceil(h * shear) : 0;
      const [m, mg] = U.canvas(w + sh, h);
      mg.imageSmoothingEnabled = false;
      for (let r = 0; r < 7; r++) { // draw row by row so we can shear into italics
        mg.save(); mg.beginPath(); mg.rect(0, r * sc, w + sh, sc); mg.clip();
        blit(mg, baseAtlas(), str, Math.round(sh * (1 - r / 6)), 0, sc);
        if (bw) blit(mg, baseAtlas(), str, Math.round(sh * (1 - r / 6)) + bw, 0, sc);
        mg.restore();
      }
      const [f, fg] = U.canvas(w + sh, h);
      fg.drawImage(m, 0, 0);
      fg.globalCompositeOperation = 'source-in';
      const gr = fg.createLinearGradient(0, 0, 0, h);
      gr.addColorStop(0, top); gr.addColorStop(0.48, U.mix(top, bottom, 0.35)); gr.addColorStop(0.5, bottom); gr.addColorStop(1, U.mix(bottom, '#000000', 0.25));
      fg.fillStyle = gr; fg.fillRect(0, 0, w + sh, h);
      fg.globalCompositeOperation = 'source-atop'; // top bevel highlight
      fg.fillStyle = 'rgba(255,255,255,0.55)'; for (let r = 0; r < 7; r++) fg.fillRect(0, r * sc, w + sh, Math.max(1, Math.floor(sc / 4)));
      const [o, og] = U.canvas(w + sh, h);
      og.drawImage(m, 0, 0); og.globalCompositeOperation = 'source-in'; og.fillStyle = outline; og.fillRect(0, 0, w + sh, h);
      [c] = U.canvas(w + sh + pad * 2, h + pad * 2 + sc);
      const cg = c.getContext('2d');
      const t = Math.max(1, Math.round(sc / 3));
      for (let dy = -t; dy <= t; dy++) for (let dx = -t; dx <= t; dx++) cg.drawImage(o, pad + dx, pad + dy);
      for (let i = 1; i <= sc; i++) cg.drawImage(o, pad + Math.round(i * 0.5), pad + t + i); // extruded shadow
      cg.drawImage(f, pad, pad);
      this._b.set(key, c);
      return c;
    },
    _b: new Map(),
  });

  /* -------------------------------------------------------------- pixel ui */
  const Px = (BD.Px = {
    /** chunky bevelled panel with notched corners */
    panel(g, x, y, w, h, fill, edge, hi) {
      x |= 0; y |= 0; w |= 0; h |= 0;
      g.fillStyle = edge; g.fillRect(x + 2, y, w - 4, h); g.fillRect(x, y + 2, w, h - 4); g.fillRect(x + 1, y + 1, w - 2, h - 2);
      g.fillStyle = fill; g.fillRect(x + 3, y + 2, w - 6, h - 4); g.fillRect(x + 2, y + 3, w - 4, h - 6);
      if (hi) { g.fillStyle = hi; g.fillRect(x + 3, y + 2, w - 6, 1); g.fillRect(x + 2, y + 3, 1, h - 6); }
    },
    /** slanted arcade meter. dir = 1 fills left→right, -1 right→left */
    bar(g, x, y, w, h, frac, ghost, col, colHi, dir) {
      g.fillStyle = '#0d0b10'; g.fillRect(x - 1, y - 1, w + 2, h + 2);
      g.fillStyle = '#3a1418'; g.fillRect(x, y, w, h);
      const fw = Math.round(w * U.clamp(frac, 0, 1)), gw = Math.round(w * U.clamp(ghost, 0, 1));
      const fx = dir > 0 ? x : x + w - fw, gx = dir > 0 ? x : x + w - gw;
      g.fillStyle = '#f6efe0'; g.fillRect(gx, y, gw, h);
      g.fillStyle = col; g.fillRect(fx, y, fw, h);
      g.fillStyle = colHi; g.fillRect(fx, y, fw, Math.max(1, (h / 3) | 0));
      g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(fx, y + h - 1, fw, 1);
    },
  });

  /* ------------------------------------------------- ordered dither (15-bit) */
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  let dl = null, dlLevels = 0;
  Px.dither = (g, levels) => {
    if (!dl || dlLevels !== levels) {
      dlLevels = levels; dl = new Uint8Array(16 * 256);
      const step = 255 / (levels - 1);
      for (let b = 0; b < 16; b++) for (let v = 0; v < 256; v++) {
        dl[b * 256 + v] = U.clamp(Math.round(Math.floor((v + ((b + 0.5) / 16) * step) / step) * step), 0, 255);
      }
    }
    const W = BD.FBW, H = BD.FBH, img = g.getImageData(0, 0, W, H), d = img.data;
    let i = 0;
    for (let y = 0; y < H; y++) {
      const row = (y & 3) * 4;
      for (let x = 0; x < W; x++, i += 4) {
        const o = BAYER[row + (x & 3)] * 256;
        d[i] = dl[o + d[i]]; d[i + 1] = dl[o + d[i + 1]]; d[i + 2] = dl[o + d[i + 2]];
      }
    }
    g.putImageData(img, 0, 0);
  };

  /* --------------------------------------------------- sprite quantisation */
  const u32 = (c) => { const v = U.rgb(c); return ((255 << 24) | (v[2] << 16) | (v[1] << 8) | v[0]) >>> 0; };
  Px.u32 = u32;
  Px.palette = (colors) => {
    const uniq = Array.from(new Set(colors));
    const n = uniq.length, P = { n, r: new Uint8Array(n), g: new Uint8Array(n), b: new Uint8Array(n), u: new Uint32Array(n), lut: new Uint32Array(32768) };
    uniq.forEach((c, i) => { const v = U.rgb(c); P.r[i] = v[0]; P.g[i] = v[1]; P.b[i] = v[2]; P.u[i] = u32(c); });
    return P;
  };
  function nearest(P, r, g, b) {
    let best = 0, bd = 1e12;
    for (let i = 0; i < P.n; i++) {
      const dr = P.r[i] - r, dg = P.g[i] - g, db = P.b[i] - b, d = dr * dr * 3 + dg * dg * 6 + db * db;
      if (d < bd) { bd = d; best = i; }
    }
    return P.u[best];
  }
  /**
   * Turns an anti-aliased vector render into a hard-edged sprite: alpha threshold,
   * snap every pixel to the character palette, then draw a 1px outline around the silhouette.
   * o: { out: u32, flat: u32, flash: 0..1, tint: [u32, amount], rim: u32, rimDir: ±1 }
   */
  Px.post = (img, P, o) => {
    const W = img.width, H = img.height, d = new Uint32Array(img.data.buffer), n = W * H, lut = P.lut, out = o.out;
    let x0 = W, x1 = 0, y0 = H, y1 = 0;
    for (let i = 0; i < n; i++) {
      const p = d[i];
      if (p === 0) continue;
      if ((p >>> 24) < 128) { d[i] = 0; continue; }
      const x = i % W, y = (i / W) | 0;
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      if (o.flat) { d[i] = o.flat; continue; }
      const r = p & 255, g = (p >> 8) & 255, b = (p >> 16) & 255, key = (r >> 3) | ((g >> 3) << 5) | ((b >> 3) << 10);
      let q = lut[key];
      if (!q) q = lut[key] = nearest(P, r, g, b);
      d[i] = q;
    }
    if (x1 < x0) return;
    x0 = Math.max(1, x0 - 1); y0 = Math.max(1, y0 - 1); x1 = Math.min(W - 2, x1 + 1); y1 = Math.min(H - 2, y1 + 1);
    const MARK = 0x01000000;
    if (!o.flat) {
      for (let y = y0; y <= y1; y++) for (let x = x0, i = y * W + x0; x <= x1; x++, i++) {
        if (d[i] !== 0) continue;
        const a = d[i - 1], b = d[i + 1], c = d[i - W], e = d[i + W];
        if ((a > MARK && a !== out) || (b > MARK && b !== out) || (c > MARK && c !== out) || (e > MARK && e !== out)) d[i] = MARK;
      }
      const rim = o.rim, dir = o.rimDir || -1;
      const rr = rim ? rim & 255 : 0, rg = rim ? (rim >> 8) & 255 : 0, rb = rim ? (rim >> 16) & 255 : 0;
      const fl = o.flash || 0, tint = o.tint, ta = tint ? tint[1] : 0, tc = tint ? tint[0] : 0;
      for (let y = y0; y <= y1; y++) for (let x = x0, i = y * W + x0; x <= x1; x++, i++) {
        let p = d[i];
        if (p === MARK) { d[i] = fl > 0.5 ? 0xffffffff : out; continue; }
        if (p === 0) continue;
        if (fl > 0.5) { d[i] = 0xffffffff; continue; }
        if (p === out) continue;
        let r = p & 255, g = (p >> 8) & 255, b = (p >> 16) & 255, ch = false;
        if (ta) { r += ((tc & 255) - r) * ta; g += (((tc >> 8) & 255) - g) * ta; b += (((tc >> 16) & 255) - b) * ta; ch = true; }
        if (rim) {
          const s1 = d[i + dir], s2 = d[i + 2 * dir], up = d[i - W];
          if (s1 <= MARK || ((s1 === out) && s2 <= MARK) || up <= MARK) { r = (r + rr * 3) >> 2; g = (g + rg * 3) >> 2; b = (b + rb * 3) >> 2; ch = true; }
        }
        if (fl > 0) { r += (255 - r) * fl * 1.6; g += (255 - g) * fl * 1.6; b += (255 - b) * fl * 1.6; ch = true; }
        if (ch) d[i] = ((255 << 24) | (Math.min(255, b) << 16) | (Math.min(255, g) << 8) | Math.min(255, r | 0)) >>> 0;
      }
    }
  };
})();
