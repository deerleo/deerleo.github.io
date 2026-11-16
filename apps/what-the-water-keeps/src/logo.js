// The ride's name as a drawn mark, not a line of type: "What the water keeps" standing on a waterline, the water
// keeping the words (their reflection wavers and thins as it goes down), and at the end of the line one kept lamp on
// its crooked post, with its stroke of light lying on the water as every kept lamp's does in the ride. Drawn in code
// on a 2D canvas: the title card, the ending and the film's last picture all use this.
//
//   import { makeLogo, drawLogo, LOGO } from './logo.js';
//   await document.fonts.load('500 48px "Cormorant Garamond"');
//   drawLogo(ctx, { x, y, width, ink: '#2a1b14', lamp: '#ffb45e', time: 0 });   // x: its left edge; y: the WATERLINE
//   const mark = makeLogo({ width: 1200 });      // or: a canvas of its own (mark.canvas, mark.waterline in pixels)
//
// The letters are the ride's own face (Cormorant Garamond, SIL Open Font License), placed one by one: the last word,
// "keeps", is let down into the water letter by letter, so the water is seen keeping it. Nothing below the waterline
// is type any more: it is rows of the lettering laid back down one by one, each pushed a little to one side.
// `time` (seconds) moves the water; leave it at 0 for a still mark (reduced motion, the film).
export const LOGO = { text: 'What the water keeps', height: 0.37, above: 0.205 };      // the mark's box: height / width, and how much of it stands above the waterline

const TAU = Math.PI * 2;
const FAMILY = '"Cormorant Garamond", "Iowan Old Style", Palatino, Georgia, serif';

function rgba(color, a) {                                    // '#2a1b14', '#abc' or what a page computes: 'rgb(42, 27, 20)'
  const m = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/.exec(color);
  if (m) return `rgba(${Math.round(+m[1])},${Math.round(+m[2])},${Math.round(+m[3])},${a})`;
  const h = color.replace('#', ''), n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

/**
 * Draw the mark into a canvas of its own, `width` pixels wide. Options: text, ink (the lettering), lamp (the flame),
 * weight (500), time (seconds: the water's movement), words: false leaves the lettering out (the water and the lamp alone).
 * Returns { canvas, width, height, waterline } (pixels; the waterline is the row the words stand on).
 */
export function makeLogo(o = {}) {
  const W = Math.round(o.width || 1200), H = Math.round(W * LOGO.height), yw = Math.round(W * LOGO.above);
  const text = o.text || LOGO.text, ink = o.ink || '#2a1b14', lamp = o.lamp || '#ffb45e', t = o.time || 0, weight = o.weight || 500;
  const canvas = o.canvas || document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const c = canvas.getContext('2d');
  c.clearRect(0, 0, W, H);

  // ---- the lettering, in a layer of its own (ink on nothing), with the hand-drawn strokes on it
  const layer = document.createElement('canvas'); layer.width = W; layer.height = H;
  const L = layer.getContext('2d');
  let S = W * 0.105;
  const setFont = () => { L.font = `${weight} ${S}px ${FAMILY}`; if ('letterSpacing' in L) L.letterSpacing = `${(S * 0.018).toFixed(2)}px`; };
  setFont();
  const want = W * 0.80;
  S *= want / L.measureText(text).width; setFont();
  const tw = L.measureText(text).width, x0 = W * 0.045, base = yw - S * 0.012;        // the baseline sits a hair above the water
  L.fillStyle = ink; L.textBaseline = 'alphabetic';
  if (o.words !== false) {
    // Letter by letter, so that the last word can go down: "keeps" is let into the water a little more with each letter
    // (the k stands on the line, the s is a third under it). Each letter's place is the width of what stands before it.
    const last = text.lastIndexOf(' ') + 1, n = text.length - last, xh = S * 0.40;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (ch === ' ') continue;
      const x = x0 + L.measureText(text.slice(0, i)).width;
      const k = i >= last && n > 1 ? (i - last) / (n - 1) : 0;
      const sink = i >= last ? xh * (0.04 + 0.58 * Math.pow(k, 1.25)) : 0;
      L.fillText(ch, x, base + sink);
    }
  }

  // ---- above the water: the lettering as it is
  c.save(); c.beginPath(); c.rect(0, 0, W, yw); c.clip(); c.drawImage(layer, 0, 0); c.restore();
  // ---- just under it: what goes down into the water (the p's stem, the k's foot) is seen through it, paler
  const depth = Math.round(W * 0.125), squeeze = 0.78;
  const push = (j) => (W * 0.0005 + W * 0.0040 * (j / depth)) * Math.sin(j * (TAU / (W * 0.021)) + t * 1.3 + Math.sin(j * 0.11 + t * 0.4) * 1.3);
  for (let j = 0; j < S * 0.5; j++) {                                                   // (row by row, as the reflection is)
    c.globalAlpha = 0.62 * Math.max(0, 1 - j / (S * 0.5)) + 0.12;
    c.drawImage(layer, 0, yw + j, W, 1, push(j) * 0.8, yw + j, W, 1);
  }
  c.globalAlpha = 1;

  // ---- the water keeps the words: what stands above the line laid back down row by row, squeezed, pushed sideways, thinning
  for (let j = 1; j < depth; j++) {
    const sy = yw - j / squeeze;
    if (sy < 0) break;
    const k = j / depth;
    let a = 0.50 * Math.pow(1 - k, 1.05);
    a *= 0.72 + 0.28 * Math.sin(j * (TAU / (W * 0.0135)) + t * 0.9 + 1.0);              // the water's own bands: lighter and darker rows
    if (a < 0.01) continue;
    c.globalAlpha = a;
    c.drawImage(layer, 0, Math.floor(sy), W, 1, push(j), yw + j, W, 1);
  }
  c.globalAlpha = 1;

  // ---- the waterline: one long hairline, not ruled: it rides up and down a little and gives out at both ends
  const line = (y, xa, xb, w, alpha, amp, phase) => {
    const g = c.createLinearGradient(xa, 0, xb, 0);
    g.addColorStop(0, rgba(ink, 0)); g.addColorStop(0.12, rgba(ink, alpha)); g.addColorStop(0.88, rgba(ink, alpha)); g.addColorStop(1, rgba(ink, 0));
    c.strokeStyle = g; c.lineWidth = w; c.lineCap = 'round'; c.beginPath();
    for (let x = xa; x <= xb; x += W * 0.004) { const yy = y + amp * Math.sin(x * (TAU / (W * 0.085)) + phase + t * 0.6); if (x === xa) c.moveTo(x, yy); else c.lineTo(x, yy); }
    c.stroke();
  };
  line(yw + W * 0.0008, W * 0.004, W * 0.996, Math.max(1, W * 0.0016), 0.72, W * 0.0007, 0.3);
  // a few short ripples lying across the reflection, each fainter than the last
  const rnd = (() => { let s = 7; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
  for (let i = 0; i < 9; i++) {
    const k = (i + 1) / 10, y = yw + depth * (0.10 + 0.86 * k * k), len = W * (0.10 + 0.22 * rnd()), xa = W * (0.03 + 0.82 * rnd());
    line(y, xa, Math.min(W * 0.99, xa + len), Math.max(1, W * 0.0011), 0.30 * (1 - k * 0.75), W * 0.0006, rnd() * TAU);
  }

  // ---- the kept lamp at the end of the line: a crooked post, a crook, a lantern, its flame, and its stroke on the water
  if (o.lampOn !== false) {
    const lx = x0 + tw + S * 0.50, u = W * 0.00125, top = yw - 98 * u;
    c.strokeStyle = ink; c.lineCap = 'round'; c.lineJoin = 'round';
    c.lineWidth = Math.max(1, 2.4 * u); c.beginPath();                                   // the post: never straight
    c.moveTo(lx, yw + 4 * u); c.bezierCurveTo(lx - 3 * u, yw - 30 * u, lx + 5 * u, yw - 62 * u, lx + 1.5 * u, top + 6 * u); c.stroke();
    c.lineWidth = Math.max(1, 1.9 * u); c.beginPath();                                   // the crook, out to the left, with a drop hook
    c.moveTo(lx + 1.5 * u, top + 6 * u); c.bezierCurveTo(lx + 1 * u, top - 8 * u, lx - 20 * u, top - 9 * u, lx - 21 * u, top + 4 * u); c.stroke();
    const hx = lx - 21 * u, hy = top + 4 * u;                                            // where the lantern hangs
    // the glow first (so the lantern's own lines stand on it)
    const fx = hx, fy = hy + 16 * u;
    const glow = c.createRadialGradient(fx, fy, 0, fx, fy, 58 * u);
    glow.addColorStop(0, rgba(lamp, 0.62)); glow.addColorStop(0.25, rgba(lamp, 0.26)); glow.addColorStop(1, rgba(lamp, 0));
    c.fillStyle = glow; c.beginPath(); c.arc(fx, fy, 58 * u, 0, TAU); c.fill();
    c.strokeStyle = ink; c.lineWidth = Math.max(1, 1.5 * u);
    c.beginPath(); c.moveTo(hx, hy); c.lineTo(hx, hy + 5 * u); c.stroke();               // the bail
    c.beginPath(); c.moveTo(hx - 5 * u, hy + 7 * u); c.quadraticCurveTo(hx, hy + 3 * u, hx + 5 * u, hy + 7 * u); c.stroke();     // the crown
    c.beginPath(); c.moveTo(hx - 6.5 * u, hy + 24 * u); c.lineTo(hx + 6.5 * u, hy + 24 * u); c.lineTo(hx + 5 * u, hy + 28 * u); c.lineTo(hx - 5 * u, hy + 28 * u); c.closePath(); c.fillStyle = ink; c.fill();   // the fount
    c.beginPath(); c.moveTo(hx - 5.5 * u, hy + 8 * u); c.lineTo(hx - 6.5 * u, hy + 24 * u); c.moveTo(hx + 5.5 * u, hy + 8 * u); c.lineTo(hx + 6.5 * u, hy + 24 * u); c.stroke();           // the two tubes
    c.fillStyle = lamp; c.beginPath(); c.ellipse(fx, fy, 3.3 * u, 6.0 * u, 0, 0, TAU); c.fill();                                  // the flame
    c.fillStyle = rgba('#fff3d8', 0.9); c.beginPath(); c.ellipse(fx, fy + 1.2 * u, 1.3 * u, 2.9 * u, 0, 0, TAU); c.fill();
    // its stroke on the water: broken by the same ripples, widest near the line
    for (let j = 2; j < depth * 1.05; j++) {
      const k = j / (depth * 1.05);
      let a = 0.85 * Math.pow(1 - k, 1.1) * (0.55 + 0.45 * Math.sin(j * (TAU / (W * 0.0135)) + t * 0.9 + 1.0));
      if (a < 0.02) continue;
      const w = (7.0 - 4.0 * k) * u * (0.8 + 0.4 * Math.sin(j * 0.9 + t * 2.0));
      c.fillStyle = rgba(lamp, a); c.fillRect(fx - w / 2 + push(j) * 1.4, yw + j, w, 1);
    }
    // and the post's own reflection, faint
    for (let j = 2; j < depth * 0.7; j++) { const k = j / (depth * 0.7); c.fillStyle = rgba(ink, 0.30 * (1 - k)); c.fillRect(lx - 1.1 * u + push(j) * 1.2, yw + j, 2.2 * u, 1); }
  }
  return { canvas, width: W, height: H, waterline: yw };
}

/** Draw the mark on a 2D context: x = its left edge, y = where its WATERLINE lies, width in the context's own units. */
export function drawLogo(ctx, o = {}) {
  const tr = ctx.getTransform ? ctx.getTransform() : { a: 1 };
  const px = Math.max(64, Math.round((o.width || 600) * Math.abs(tr.a || 1) * (o.oversample || 1)));
  const mark = makeLogo({ ...o, width: px, canvas: o.scratch });
  const k = (o.width || 600) / mark.width;
  ctx.save(); ctx.globalAlpha *= o.alpha ?? 1;
  ctx.drawImage(mark.canvas, o.x || 0, (o.y || 0) - mark.waterline * k, mark.width * k, mark.height * k);
  ctx.restore();
  return mark;
}
