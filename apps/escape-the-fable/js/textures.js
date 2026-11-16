// Procedural canvas textures: floors, wallpaper, paintings, clock faces, written clues, symbol stickers.
import * as THREE from 'three';
import { SYMBOLS } from './symbols.js';

export const css = (hex) => '#' + hex.toString(16).padStart(6, '0');
const shade = (hex, f) => {
  const r = Math.min(255, ((hex >> 16) & 255) * f) | 0, g = Math.min(255, ((hex >> 8) & 255) * f) | 0, b = Math.min(255, (hex & 255) * f) | 0;
  return `rgb(${r},${g},${b})`;
};

export function canvasTex(w, h, draw, repeat) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  return t;
}

export function drawSymbol(g, id, cx, cy, size, color) {
  const s = SYMBOLS[id];
  if (!s) return;
  g.save();
  g.translate(cx - size / 2, cy - size / 2);
  g.scale(size / 24, size / 24);
  g.fillStyle = color || s.color;
  g.fill(new Path2D(s.path), 'evenodd');
  g.restore();
}

// white round sticker carrying a lock's symbol
function sticker(g, id, cx, cy, r) {
  g.fillStyle = '#f6f1e2'; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.fill();
  g.strokeStyle = '#3a2d1c'; g.lineWidth = Math.max(2, r * 0.08); g.stroke();
  drawSymbol(g, id, cx, cy, r * 1.25);
}
export const symbolTex = (id) => canvasTex(128, 128, (g) => sticker(g, id, 64, 64, 58));

export function floorTex(style, pal, w, d, rng) {
  if (style === 'checker') {
    return canvasTex(256, 256, (g) => {
      for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) {
        g.fillStyle = css((x + y) % 2 ? pal.floorB : pal.floor); g.fillRect(x * 128, y * 128, 128, 128);
        g.fillStyle = 'rgba(0,0,0,0.05)';
        for (let i = 0; i < 60; i++) g.fillRect(x * 128 + rng.next() * 128, y * 128 + rng.next() * 128, 2, 2);
      }
      g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 2; g.strokeRect(0, 0, 128, 128); g.strokeRect(128, 128, 128, 128); g.strokeRect(128, 0, 128, 128); g.strokeRect(0, 128, 128, 128);
    }, [w / 1.2, d / 1.2]);
  }
  return canvasTex(512, 512, (g) => {
    const rows = 8, h = 512 / rows;
    for (let r = 0; r < rows; r++) {
      let x = -rng.next() * 200;
      while (x < 512) {
        const len = 160 + rng.next() * 200;
        g.fillStyle = shade(rng.chance(0.5) ? pal.floor : pal.floorB, 0.9 + rng.next() * 0.22);
        g.fillRect(x, r * h, len, h);
        g.strokeStyle = 'rgba(0,0,0,0.07)'; g.lineWidth = 1;
        for (let i = 0; i < 3; i++) { const yy = r * h + 6 + rng.next() * (h - 12); g.beginPath(); g.moveTo(x, yy); g.bezierCurveTo(x + len * 0.3, yy + 5, x + len * 0.6, yy - 5, x + len, yy); g.stroke(); }
        g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(x, r * h, 2, h);
        x += len;
      }
      g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(0, r * h, 512, 2);
    }
  }, [w / 2.4, d / 2.4]);
}

export function wallTex(style, pal, len, rng) {
  const base = css(pal.wall);
  return canvasTex(256, 256, (g) => {
    g.fillStyle = base; g.fillRect(0, 0, 256, 256);
    if (style === 'stripes') { g.fillStyle = shade(pal.wall, 1.12); for (let x = 0; x < 256; x += 64) g.fillRect(x, 0, 30, 256); g.fillStyle = shade(pal.wall, 0.86); for (let x = 30; x < 256; x += 64) g.fillRect(x, 0, 3, 256); }
    else if (style === 'diamond') {
      g.strokeStyle = shade(pal.wall, 1.25); g.lineWidth = 3;
      for (let i = -256; i < 512; i += 64) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 256, 256); g.moveTo(i + 256, 0); g.lineTo(i, 256); g.stroke(); }
      g.fillStyle = css(pal.accent); for (let y = 0; y <= 256; y += 64) for (let x = 0; x <= 256; x += 64) { g.beginPath(); g.arc(x + 32, y, 4, 0, 7); g.fill(); }
    } else if (style === 'panels') {
      g.strokeStyle = shade(pal.wall, 0.75); g.lineWidth = 4; g.strokeRect(0, 0, 256, 256);
      g.fillStyle = shade(pal.wall, 0.82); for (let y = 24; y < 256; y += 29) for (let x = 24; x < 256; x += 29) { g.beginPath(); g.arc(x, y, 3.2, 0, 7); g.fill(); }
    } else if (style === 'tiles') {
      g.strokeStyle = shade(pal.wall, 0.8); g.lineWidth = 3;
      for (let y = 0; y < 256; y += 64) for (let x = 0; x < 256; x += 128) g.strokeRect(x + ((y / 64) % 2 ? 64 : 0) - 128, y, 128, 64), g.strokeRect(x + ((y / 64) % 2 ? 64 : 0), y, 128, 64);
    } else if (style === 'rivets') {
      g.strokeStyle = shade(pal.wall, 0.86); g.lineWidth = 3; g.strokeRect(0, 0, 256, 256);
      g.fillStyle = shade(pal.wall, 0.8); for (let i = 16; i < 256; i += 32) { g.beginPath(); g.arc(i, 10, 4, 0, 7); g.arc(i, 246, 4, 0, 7); g.fill(); g.beginPath(); g.arc(10, i, 4, 0, 7); g.arc(246, i, 4, 0, 7); g.fill(); }
    }
    for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(${rng.chance(0.5) ? '255,255,255' : '0,0,0'},0.03)`; g.fillRect(rng.next() * 256, rng.next() * 256, 3, 3); }
  }, [len / 1.3, 2.3]);
}

export function rugTex(pal, rng) {
  const [a, b, c] = pal.rug.map(css);
  return canvasTex(512, 356, (g, w, h) => {
    g.fillStyle = a; g.fillRect(0, 0, w, h);
    g.strokeStyle = b; g.lineWidth = 10; g.strokeRect(22, 22, w - 44, h - 44);
    g.strokeStyle = c; g.lineWidth = 5; g.strokeRect(40, 40, w - 80, h - 80);
    const kind = rng.int(0, 2);
    g.fillStyle = b;
    for (let i = 0; i < 5; i++) {
      const x = 96 + i * 80, y = h / 2;
      g.beginPath();
      if (kind === 0) { g.moveTo(x, y - 60); g.lineTo(x + 34, y); g.lineTo(x, y + 60); g.lineTo(x - 34, y); }
      else if (kind === 1) g.arc(x, y, 30, 0, 7);
      else g.rect(x - 26, y - 46, 52, 92);
      g.fill();
      g.fillStyle = i % 2 ? b : c;
    }
    g.fillStyle = 'rgba(255,255,255,0.5)'; for (let x = 4; x < w; x += 9) { g.fillRect(x, 0, 3, 12); g.fillRect(x, h - 12, 3, 12); }
  });
}

// Mid-century abstract paintings and simple landscapes.
export function paintingTex(pal, rng) {
  return canvasTex(256, 200, (g, w, h) => {
    const cols = ['#d9792b', '#2f8f9c', '#c9a227', '#c8473c', '#3d5a4a', '#e9e2cf', '#2c3e50', '#7c58a6'];
    const kind = rng.int(0, 2);
    if (kind === 0) { // landscape
      const sky = g.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, '#e8b96a'); sky.addColorStop(1, '#f3e3c0'); g.fillStyle = sky; g.fillRect(0, 0, w, h);
      g.fillStyle = '#f6efd8'; g.beginPath(); g.arc(60 + rng.next() * 130, 60, 22, 0, 7); g.fill();
      ['#5d7a6a', '#3d5a4a', '#2a4034'].forEach((c, i) => { g.fillStyle = c; g.beginPath(); g.moveTo(0, h); for (let x = 0; x <= w; x += 32) g.lineTo(x, 100 + i * 28 + Math.sin(x / 40 + i * 2 + rng.next()) * 16); g.lineTo(w, h); g.fill(); });
    } else if (kind === 1) { // abstract blocks
      g.fillStyle = '#efe6cf'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 7; i++) { g.fillStyle = rng.pick(cols); g.globalAlpha = 0.9; if (rng.chance(0.5)) g.fillRect(rng.next() * 200, rng.next() * 150, 30 + rng.next() * 80, 20 + rng.next() * 70); else { g.beginPath(); g.arc(rng.next() * w, rng.next() * h, 14 + rng.next() * 34, 0, 7); g.fill(); } }
      g.globalAlpha = 1; g.strokeStyle = '#222'; g.lineWidth = 3; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(rng.next() * w, rng.next() * h); g.lineTo(rng.next() * w, rng.next() * h); g.stroke(); }
    } else { // sailing boat
      g.fillStyle = '#bcd6d9'; g.fillRect(0, 0, w, h); g.fillStyle = '#2f6f86'; g.fillRect(0, 130, w, 70);
      g.fillStyle = '#f6efd8'; g.beginPath(); g.moveTo(128, 30); g.lineTo(128, 120); g.lineTo(70, 120); g.fill(); g.beginPath(); g.moveTo(136, 50); g.lineTo(136, 120); g.lineTo(180, 120); g.fill();
      g.fillStyle = '#7a3b2e'; g.beginPath(); g.moveTo(60, 126); g.lineTo(196, 126); g.lineTo(176, 148); g.lineTo(80, 148); g.fill();
    }
  });
}

export function viewTex(view, rng) {
  return canvasTex(256, 256, (g, w, h) => {
    if (view === 'sea') {
      const sky = g.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, '#7fb4d6'); sky.addColorStop(0.55, '#d8ecf2'); g.fillStyle = sky; g.fillRect(0, 0, w, h);
      g.fillStyle = '#2a6f96'; g.fillRect(0, 140, w, 116); g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 2;
      for (let i = 0; i < 14; i++) { const y = 150 + rng.next() * 100, x = rng.next() * w; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 26, y); g.stroke(); }
    } else if (view === 'hills') {
      const sky = g.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, '#27344f'); sky.addColorStop(1, '#c98b5a'); g.fillStyle = sky; g.fillRect(0, 0, w, h);
      ['#34443c', '#232f29'].forEach((c, i) => { g.fillStyle = c; g.beginPath(); g.moveTo(0, h); for (let x = 0; x <= w; x += 16) g.lineTo(x, 150 + i * 36 + Math.sin(x / 36 + i * 3) * 18); g.lineTo(w, h); g.fill(); });
    } else {
      const sky = g.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, '#141a2e'); sky.addColorStop(1, '#3a3f5e'); g.fillStyle = sky; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 9; i++) {
        const bw = 22 + rng.next() * 26, bh = 70 + rng.next() * 130, x = i * 30 - 8;
        g.fillStyle = '#0c0f1a'; g.fillRect(x, h - bh, bw, bh);
        g.fillStyle = '#f2c661'; for (let y = h - bh + 8; y < h - 6; y += 13) for (let xx = x + 4; xx < x + bw - 5; xx += 8) if (rng.chance(0.4)) g.fillRect(xx, y, 4, 6);
      }
    }
  });
}

export function clockTex(time, symbol, rng) {
  // time "h:mm"; random harmless time when the clock is just decoration
  let [h, m] = time ? time.split(':').map(Number) : [rng.int(1, 12), rng.int(0, 11) * 5];
  return canvasTex(256, 256, (g) => {
    g.fillStyle = '#f4eeda'; g.beginPath(); g.arc(128, 128, 126, 0, 7); g.fill();
    g.strokeStyle = '#2b2118'; g.lineWidth = 6; g.beginPath(); g.arc(128, 128, 122, 0, 7); g.stroke();
    g.fillStyle = '#2b2118'; g.font = 'bold 30px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (let i = 1; i <= 12; i++) { const a = (i / 12) * Math.PI * 2; g.fillText(String(i), 128 + Math.sin(a) * 94, 130 - Math.cos(a) * 94); }
    for (let i = 0; i < 60; i++) { const a = (i / 60) * Math.PI * 2, r0 = i % 5 ? 114 : 110; g.lineWidth = i % 5 ? 1.5 : 4; g.beginPath(); g.moveTo(128 + Math.sin(a) * r0, 128 - Math.cos(a) * r0); g.lineTo(128 + Math.sin(a) * 119, 128 - Math.cos(a) * 119); g.stroke(); }
    if (symbol) sticker(g, symbol, 128, 178, 22);
    const hand = (a, len, wid) => { g.lineWidth = wid; g.lineCap = 'round'; g.beginPath(); g.moveTo(128 - Math.sin(a) * 12, 128 + Math.cos(a) * 12); g.lineTo(128 + Math.sin(a) * len, 128 - Math.cos(a) * len); g.stroke(); };
    g.strokeStyle = '#1a1410';
    hand(((h % 12) + m / 60) / 12 * Math.PI * 2, 52, 9);
    hand((m / 60) * Math.PI * 2, 84, 5);
    g.fillStyle = '#b8923a'; g.beginPath(); g.arc(128, 128, 8, 0, 7); g.fill();
  });
}

export function radioTex(freq, symbol, rng) {
  const f = freq || rng.int(55, 150) * 10;
  return canvasTex(384, 128, (g, w, h) => {
    g.fillStyle = '#f1e3b4'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#3a2d1c'; g.lineWidth = 5; g.strokeRect(2, 2, w - 4, h - 4);
    g.fillStyle = '#3a2d1c'; g.font = 'bold 19px Georgia, serif'; g.textAlign = 'center';
    const x = (v) => 30 + ((v - 540) / 1060) * (w - 120);
    for (let v = 600; v <= 1600; v += 200) { g.fillText(String(v), x(v), 34); g.fillRect(x(v) - 1.5, 44, 3, 18); }
    for (let v = 540; v <= 1600; v += 20) g.fillRect(x(v) - 0.5, 50, 1, 10);
    g.fillStyle = '#c8473c'; g.fillRect(x(f) - 2, 40, 4, 76);
    g.fillStyle = '#3a2d1c'; g.font = 'bold 24px Georgia, serif'; g.textAlign = 'left'; g.fillText(f + ' kc', 30, 102);
    if (symbol) sticker(g, symbol, w - 44, 64, 30);
  });
}

function wrap(g, text, maxW) {
  const out = [];
  for (const para of text) {
    let line = '';
    for (const word of String(para).split(' ')) {
      const t = line ? line + ' ' + word : word;
      if (g.measureText(t).width > maxW && line) { out.push(line); line = word; } else line = t;
    }
    out.push(line);
  }
  return out;
}

// A written surface: paper, chalk on a blackboard, typed page. lines = clue text (or filler scribbles).
export function textTex({ w = 512, h = 384, bg = '#f3ecd8', fg = '#2b2118', font = 'Georgia, serif', lines, symbol, size = 34, rng, chalk }) {
  return canvasTex(w, h, (g) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    if (chalk) { for (let i = 0; i < 26; i++) { g.fillStyle = `rgba(255,255,255,${0.02 + rng.next() * 0.03})`; g.beginPath(); g.ellipse(rng.next() * w, rng.next() * h, 60 + rng.next() * 90, 14 + rng.next() * 22, rng.next() * 3, 0, 7); g.fill(); } }
    g.fillStyle = fg; g.textBaseline = 'top';
    if (lines && lines.length) {
      const pad = symbol ? 96 : 30;
      let wrapped;
      // shrink the lettering until everything fits on the surface
      for (;; size -= 3) { g.font = `bold ${size}px ${font}`; wrapped = wrap(g, lines, w - pad - 30); if (wrapped.length * size * 1.3 <= h - 24 || size <= 15) break; }
      const lh = size * 1.3, y0 = Math.max(12, (h - wrapped.length * lh) / 2);
      wrapped.forEach((ln, i) => g.fillText(ln, pad, y0 + i * lh));
      if (symbol) sticker(g, symbol, 50, h / 2, 34);
    } else {
      g.globalAlpha = 0.55; g.lineWidth = 3; g.strokeStyle = fg;
      for (let y = 40; y < h - 30; y += 44) { g.beginPath(); let x = 30; g.moveTo(x, y); const end = w * (0.5 + rng.next() * 0.42); while (x < end) { x += 10 + rng.next() * 18; g.lineTo(x, y + (rng.next() - 0.5) * 12); } g.stroke(); }
      g.globalAlpha = 1;
    }
  });
}

export function plaqueTex(colors, symbol, palette) {
  return canvasTex(384, 96, (g, w, h) => {
    g.fillStyle = '#c9a54a'; g.fillRect(0, 0, w, h); g.strokeStyle = '#5a431a'; g.lineWidth = 6; g.strokeRect(3, 3, w - 6, h - 6);
    sticker(g, symbol, 50, 48, 34);
    colors.forEach((c, i) => { const x = 104 + i * 68; g.fillStyle = palette[c]; g.fillRect(x, 22, 50, 52); g.strokeStyle = '#2b2118'; g.lineWidth = 3; g.strokeRect(x, 22, 50, 52); if (i) { g.fillStyle = '#2b2118'; g.beginPath(); g.moveTo(x - 14, 38); g.lineTo(x - 4, 48); g.lineTo(x - 14, 58); g.fill(); } });
  });
}

export function globeTex(rng) {
  return canvasTex(256, 128, (g, w, h) => {
    g.fillStyle = '#4f8fa8'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#c9b877';
    for (let i = 0; i < 9; i++) { g.beginPath(); g.ellipse(rng.next() * w, 20 + rng.next() * 88, 14 + rng.next() * 30, 8 + rng.next() * 20, rng.next() * 3, 0, 7); g.fill(); }
    g.strokeStyle = 'rgba(255,255,255,0.25)'; g.lineWidth = 1; for (let x = 0; x < w; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } for (let y = 0; y < h; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
  });
}

export function calendarTex(rng) {
  return canvasTex(200, 280, (g, w, h) => {
    g.fillStyle = '#f3ecd8'; g.fillRect(0, 0, w, h); g.fillStyle = '#c8473c'; g.fillRect(0, 0, w, 70);
    g.fillStyle = '#fff'; g.font = 'bold 34px Georgia, serif'; g.textAlign = 'center'; g.fillText(rng.pick(['MARCH', 'JUNE', 'OCTOBER', 'APRIL', 'AUGUST']), w / 2, 48);
    g.fillStyle = '#2b2118'; g.font = '17px Georgia, serif';
    for (let d = 1; d <= 30; d++) g.fillText(String(d), 22 + ((d + 2) % 7) * 26, 104 + Math.floor((d + 2) / 7) * 34);
  });
}

export function wheelPlateTex(letters, symbol) {
  return canvasTex(128, 128, (g) => {
    g.fillStyle = '#c9a54a'; g.beginPath(); g.arc(64, 64, 62, 0, 7); g.fill(); g.strokeStyle = '#5a431a'; g.lineWidth = 4; g.stroke();
    g.fillStyle = '#2b2118'; g.font = 'bold 15px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    [...letters].forEach((ch, i) => { const a = (i / letters.length) * Math.PI * 2; g.fillText(ch, 64 + Math.sin(a) * 48, 64 - Math.cos(a) * 48); });
    sticker(g, symbol, 64, 64, 26);
  });
}
