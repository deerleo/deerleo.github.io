// Symbols tie every clue to the lock it belongs to. Each is an SVG path in a 24x24 box,
// usable both in DOM (inline SVG) and on canvas textures (Path2D).
function starPath() {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? 4.4 : 10.5, a = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push(`${(12 + r * Math.cos(a)).toFixed(2)} ${(12.6 + r * Math.sin(a)).toFixed(2)}`);
  }
  return 'M' + pts.join('L') + 'Z';
}

export const SYMBOLS = {
  star: { name: 'Star', color: '#d9a21b', path: starPath() },
  moon: { name: 'Moon', color: '#5b7fb8', path: 'M14.5 2.2A10 10 0 1 0 21.8 14.6A8 8 0 0 1 14.5 2.2Z' },
  heart: { name: 'Heart', color: '#c8473c', path: 'M12 21.5C5 15.5 2 11.5 2 7.8A5 5 0 0 1 12 6.2A5 5 0 0 1 22 7.8C22 11.5 19 15.5 12 21.5Z' },
  diamond: { name: 'Diamond', color: '#2f9c8f', path: 'M12 1.8L20.5 12L12 22.2L3.5 12Z' },
  triangle: { name: 'Triangle', color: '#7c58a6', path: 'M12 2.8L22 20.5H2Z' },
  cross: { name: 'Cross', color: '#d2691e', path: 'M8.6 2.5h6.8v6.1h6.1v6.8h-6.1v6.1H8.6v-6.1H2.5V8.6h6.1Z' },
  ring: { name: 'Ring', color: '#4d8a3c', path: 'M12 2a10 10 0 1 0 0 20a10 10 0 1 0 0-20Zm0 5.2a4.8 4.8 0 1 1 0 9.6a4.8 4.8 0 1 1 0-9.6Z' },
  hex: { name: 'Hexagon', color: '#b0486f', path: 'M12 1.8L20.8 6.9V17.1L12 22.2L3.2 17.1V6.9Z' },
};
export const SYMBOL_IDS = Object.keys(SYMBOLS);

export function symbolSVG(id, size = 20) {
  const s = SYMBOLS[id];
  if (!s) return '';
  return `<svg class="sym" width="${size}" height="${size}" viewBox="0 0 24 24" aria-label="${s.name}"><path fill="${s.color}" fill-rule="evenodd" d="${s.path}"/></svg>`;
}
