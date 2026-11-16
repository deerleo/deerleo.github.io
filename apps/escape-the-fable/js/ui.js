// DOM helpers, modal, toasts, item icons and tiny synthesised sound effects.
import { SYMBOLS, symbolSVG } from './symbols.js';
import { TIER_COLORS } from './mergepuzzle.js';

export function el(tag, attrs = {}, ...kids) {
  const e = document.createElement(tag);
  for (const k in attrs) {
    const v = attrs[k];
    if (v === false || v == null) continue;
    if (k === 'class') e.className = v;
    else if (k === 'html') e.innerHTML = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat()) if (kid != null && kid !== false) e.append(kid.nodeType ? kid : document.createTextNode(kid));
  return e;
}
export const $ = (sel) => document.querySelector(sel);

let modalClose = null;
export function openModal(content, { onClose, wide, sticky } = {}) {
  closeModal();
  const m = $('#modal'), panel = $('#panel');
  panel.className = 'panel' + (wide ? ' wide' : '');
  panel.replaceChildren(content);
  if (!sticky) panel.append(el('button', { class: 'close', title: 'Close (Esc)', onclick: () => closeModal() }, '×'));
  m.hidden = false;
  m.dataset.sticky = sticky ? '1' : '';
  modalClose = onClose || null;
  const f = panel.querySelector('[autofocus]'); if (f) f.focus();
}
export function closeModal() {
  const m = $('#modal');
  if (m.hidden) return false;
  m.hidden = true;
  $('#panel').replaceChildren();
  const fn = modalClose; modalClose = null;
  if (fn) fn();
  return true;
}
export const modalOpen = () => !$('#modal').hidden;

export function toast(msg, ms = 3200) {
  const t = el('div', { class: 'toast' }, msg);
  $('#toasts').append(t);
  setTimeout(() => t.classList.add('out'), ms);
  setTimeout(() => t.remove(), ms + 400);
}

const SHAPE_SVG = [null,
  '<path d="M12 3L22 20H2Z"/><path d="M12 3L13.5 20" fill="none" stroke="#0005"/>',
  '<path d="M12 2L21 7V17L12 22L3 17V7Z"/><path d="M3 7L12 12L21 7M12 12V22" fill="none" stroke="#0005"/>',
  '<path d="M12 2L21 12L12 22L3 12Z"/><path d="M3 12H21M12 2L9 12L12 22" fill="none" stroke="#0005"/>',
  '<path d="M12 2L21.5 9L18 20.5H6L2.5 9Z"/><path d="M12 7L16.5 10.3L14.8 15.6H9.2L7.5 10.3ZM12 2V7M21.5 9L16.5 10.3M18 20.5L14.8 15.6M6 20.5L9.2 15.6M2.5 9L7.5 10.3" fill="none" stroke="#0005"/>',
  '<path d="M12 2L21 7V17L12 22L3 17V7Z"/><path d="M12 2L7 14H17ZM3 7L7 14L3 17M21 7L17 14L21 17M7 14L12 22L17 14" fill="none" stroke="#0005"/>',
  '<circle cx="12" cy="12" r="10"/><ellipse cx="8.5" cy="8" rx="3" ry="2" fill="#fff8"/>'];
export const shapeSVG = (tier, size = 28) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${TIER_COLORS[tier]}" stroke="#2b2118" stroke-width="1" stroke-linejoin="round">${SHAPE_SVG[tier]}</svg>`;

export function thingIcon(t, info, size = 30) {
  if (t.kind === 'shape') return shapeSVG(info.tier, size);
  if (t.kind === 'photo') return `<svg width="${size}" height="${size}" viewBox="0 0 24 24"><rect x="2.5" y="4" width="19" height="16" fill="#f3ecd8" stroke="#5a431a"/><rect x="4.5" y="6" width="15" height="10.5" fill="#b89a6a"/><path d="M4.5 16.5L9.5 11L13 14.5L15.5 12L19.5 16.5Z" fill="#6e5636"/><circle cx="16" cy="9" r="1.4" fill="#f3ecd8"/></svg>`;
  if (t.half) {
    const col = t.kind === 'key' ? '#b8923a' : '#8d9698';
    const whole = t.kind === 'key' ? '<circle cx="7" cy="12" r="5.6"/><path d="M12 10.8H22.5V13.2H20.5V16H18.4V13.2H16.6V15H14.6V13.2H12Z"/>' : t.tool === 'crowbar' ? '<path d="M3 21.5L5 23L18 8C19 6.5 20.5 6.5 20.5 8.5H22.5C22.5 3.5 18 3 16 6Z"/>' : '<path d="M2.5 20L4 21.5L12 13.5L10.5 12ZM10 13L13 10L20 3C22 1.5 23.5 4.5 21.5 6L14 13.5Z"/>';
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24"><defs><clipPath id="h${t.id}"><path d="${t.half === 'a' ? 'M0 0H13L11 6L14 11L10.5 16L13 24H0Z' : 'M24 0H13L11 6L14 11L10.5 16L13 24H24Z'}"/></clipPath></defs><g fill="${col}" opacity=".22">${whole}</g><g fill="${col}" stroke="#3a2d1c" stroke-width=".8" clip-path="url(#h${t.id})">${whole}</g><path d="M13 0L11 6L14 11L10.5 16L13 24" fill="none" stroke="#c8473c" stroke-width="1" stroke-dasharray="2 1.5"/></svg>`;
  }
  if (t.kind === 'key') return `<svg width="${size}" height="${size}" viewBox="0 0 24 24"><g fill="#b8923a" stroke="#5a431a" stroke-width=".8"><circle cx="7" cy="12" r="5.6"/><path d="M12 10.8H22.5V13.2H20.5V16H18.4V13.2H16.6V15H14.6V13.2H12Z"/></g><g transform="translate(3.4 8.4) scale(.3)"><path fill="${SYMBOLS[info.symbol].color}" stroke="#fff" stroke-width="1.5" fill-rule="evenodd" d="${SYMBOLS[info.symbol].path}"/></g></svg>`;
  if (t.kind === 'tool') return t.tool === 'crowbar'
    ? `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="#4a5154" stroke-width="2.6" stroke-linecap="round"><path d="M4 21L17 6C18.5 4 21 4 21 7"/><path d="M4 21L2.5 18.5" /></svg>`
    : `<svg width="${size}" height="${size}" viewBox="0 0 24 24"><path d="M3 21L11 13" stroke="#8d9698" stroke-width="2.4" stroke-linecap="round"/><path d="M10 14L13 11L20 4C21.5 2.5 23 5 21 6.5L14 13Z" fill="#c8473c" stroke="#5a1f1a"/></svg>`;
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24"><path d="M5 2.5H16L20 6.5V21.5H5Z" fill="#f3ecd8" stroke="#5a431a"/><path d="M8 9H17M8 12.5H17M8 16H14" stroke="#5a431a" stroke-width="1.2"/></svg>`;
}
export { symbolSVG };

// ---- sound
let ac = null;
export let muted = false;
export const setMuted = (v) => { muted = v; };
function tone(freq, t0, dur, type = 'sine', vol = 0.12) {
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(0, ac.currentTime + t0); g.gain.linearRampToValueAtTime(vol, ac.currentTime + t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + t0 + dur);
  o.connect(g).connect(ac.destination); o.start(ac.currentTime + t0); o.stop(ac.currentTime + t0 + dur + 0.05);
}
const SFX = {
  click: () => tone(520, 0, 0.05, 'square', 0.04),
  tick: () => tone(900, 0, 0.03, 'square', 0.03),
  wrong: () => { tone(160, 0, 0.18, 'sawtooth', 0.07); tone(120, 0.12, 0.22, 'sawtooth', 0.07); },
  unlock: () => { tone(330, 0, 0.09, 'square', 0.06); tone(660, 0.1, 0.25, 'triangle', 0.12); },
  found: () => { tone(660, 0, 0.12, 'triangle'); tone(880, 0.1, 0.2, 'triangle'); },
  merge: () => { tone(440, 0, 0.1, 'triangle'); tone(587, 0.07, 0.1, 'triangle'); tone(784, 0.14, 0.2, 'triangle'); },
  slide: () => tone(220, 0, 0.08, 'sine', 0.08),
  win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.14, 0.4, 'triangle', 0.13)),
};
export function sfx(name) {
  if (muted) return;
  try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === 'suspended') ac.resume(); SFX[name](); } catch (e) { /* no audio */ }
}
