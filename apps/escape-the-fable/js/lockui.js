// Close-up interfaces for the mechanical locks: number padlock, safe dial and the word wheel.
import { el, sfx, symbolSVG } from './ui.js';
import { SYMBOLS } from './symbols.js';

const header = (lock, title, sub) => el('div', { class: 'lock-head' }, el('span', { html: symbolSVG(lock.symbol, 38) }), el('div', {}, el('h2', {}, title), el('p', { class: 'sub' }, sub)));
const shake = (node) => { node.classList.remove('shake'); void node.offsetWidth; node.classList.add('shake'); };

// state objects persist on the game session so reopening a lock keeps what was entered
export function digitsUI(lock, st, onSolve) {
  const n = lock.code.length;
  st.v = st.v || Array(n).fill(0);
  let cur = 0;
  const cells = [];
  const root = el('div', { class: 'lockui', tabindex: 0, autofocus: true });
  const msg = el('p', { class: 'msg' }, 'Set the wheels, then pull the shackle.');
  const paint = () => cells.forEach((c, i) => { c.num.textContent = st.v[i]; c.box.classList.toggle('cur', i === cur); });
  const turn = (i, d) => { st.v[i] = (st.v[i] + d + 10) % 10; cur = i; sfx('tick'); paint(); };
  const row = el('div', { class: 'wheels' });
  for (let i = 0; i < n; i++) {
    const num = el('div', { class: 'num' });
    const box = el('div', { class: 'wheelbox', onclick: () => { cur = i; paint(); } }, el('button', { onclick: () => turn(i, 1), 'aria-label': 'up' }, '▲'), num, el('button', { onclick: () => turn(i, -1), 'aria-label': 'down' }, '▼'));
    cells.push({ num, box }); row.append(box);
  }
  const tryIt = () => {
    if (st.v.join('') === lock.code) { sfx('unlock'); onSolve(); } else { sfx('wrong'); shake(row); msg.textContent = 'The shackle holds firm. That is not the combination.'; }
  };
  root.addEventListener('keydown', (e) => {
    if (/^\d$/.test(e.key)) { st.v[cur] = +e.key; cur = Math.min(n - 1, cur + 1); sfx('tick'); paint(); }
    else if (e.key === 'ArrowLeft') { cur = Math.max(0, cur - 1); paint(); }
    else if (e.key === 'ArrowRight') { cur = Math.min(n - 1, cur + 1); paint(); }
    else if (e.key === 'ArrowUp') turn(cur, 1);
    else if (e.key === 'ArrowDown') turn(cur, -1);
    else if (e.key === 'Enter') tryIt();
    else return;
    e.preventDefault(); e.stopPropagation();
  });
  root.append(header(lock, 'Number padlock', `Engraved with a ${SYMBOLS[lock.symbol].name.toLowerCase()}. Clues carrying the same mark belong to this lock.`), row, el('button', { class: 'btn primary', onclick: tryIt }, 'Pull the shackle'), msg, el('p', { class: 'keys' }, 'Type digits · arrow keys · Enter'));
  paint();
  return root;
}

export function dialUI(lock, st, onSolve) {
  st.v = st.v ?? 0; st.segs = st.segs || [];
  const root = el('div', { class: 'lockui', tabindex: 0, autofocus: true });
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '-120 -128 240 248'); svg.setAttribute('class', 'dial');
  let face = '<circle r="112" fill="#23282a" stroke="#0e1011" stroke-width="5"/><g id="rot">';
  // numbers increase anticlockwise so that turning right (clockwise) counts up
  for (let i = 0; i < 40; i++) {
    const a = -i * 9;
    face += `<g transform="rotate(${a})"><rect x="-${i % 5 ? 0.8 : 1.6}" y="-108" width="${i % 5 ? 1.6 : 3.2}" height="${i % 5 ? 9 : 15}" fill="#efe6cf"/>${i % 5 ? '' : `<text y="-76" text-anchor="middle" font-size="17" font-family="Georgia,serif" font-weight="bold" fill="#efe6cf">${i}</text>`}</g>`;
  }
  face += '<circle r="48" fill="#8d9698" stroke="#3a4144" stroke-width="3"/><rect x="-5" y="-46" width="10" height="92" rx="4" fill="#5d6669"/></g><path d="M0 -112L-9 -127H9Z" fill="#c8473c" stroke="#5a1f1a"/>';
  svg.innerHTML = face;
  const rot = svg.querySelector('#rot');
  const read = el('div', { class: 'readout' });
  const log = el('div', { class: 'seglog' });
  const msg = el('p', { class: 'msg' }, 'Turn right, then left, then right. Pull the handle to try.');
  let angle = st.v * 9;
  const paint = () => {
    rot.setAttribute('transform', `rotate(${angle})`);
    read.textContent = st.v;
    log.replaceChildren(...(st.segs.length ? st.segs.slice(-4).map((s) => el('span', { class: 'seg ' + s.d }, `${s.d === 'R' ? 'Right' : 'Left'} to ${s.v}`)) : [el('span', { class: 'seg none' }, 'No turns yet')]));
  };
  const step = (d) => {
    st.v = (st.v + (d === 'R' ? 1 : -1) + 40) % 40; angle += d === 'R' ? 9 : -9;
    const last = st.segs[st.segs.length - 1];
    if (last && last.d === d) last.v = st.v; else st.segs.push({ d, v: st.v });
    sfx('tick'); paint();
  };
  let timer = null;
  const hold = (d) => ({ onpointerdown: (e) => { e.preventDefault(); step(d); clearInterval(timer); let wait = 4; timer = setInterval(() => { if (wait-- <= 0) step(d); }, 70); }, onpointerup: () => clearInterval(timer), onpointerleave: () => clearInterval(timer) });
  const clear = () => { st.segs = []; msg.textContent = 'You spin the dial to clear it. Start again.'; paint(); };
  const tryIt = () => {
    const s = st.segs.slice(-3), c = lock.combo;
    if (s.length === 3 && st.segs.length === 3 && s[0].d === 'R' && s[1].d === 'L' && s[2].d === 'R' && s[0].v === c[0] && s[1].v === c[1] && s[2].v === c[2]) { sfx('unlock'); clearInterval(timer); onSolve(); }
    else { sfx('wrong'); shake(svg); st.segs = []; msg.textContent = 'The handle will not move. The dial resets: enter all three turns again.'; paint(); }
  };
  root.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'd') step('R'); else if (e.key === 'ArrowLeft' || e.key === 'a') step('L'); else if (e.key === 'Enter') tryIt(); else if (e.key === 'Backspace') clear(); else return;
    e.preventDefault(); e.stopPropagation();
  });
  root.append(header(lock, 'Safe dial', `Marked with a ${SYMBOLS[lock.symbol].name.toLowerCase()}. Three turns: right, left, right.`),
    el('div', { class: 'dialrow' }, el('button', { class: 'btn turn', ...hold('L') }, '⟲ Left'), el('div', { class: 'dialwrap' }, svg, read), el('button', { class: 'btn turn', ...hold('R') }, 'Right ⟳')),
    log, el('div', { class: 'row' }, el('button', { class: 'btn', onclick: clear }, 'Clear'), el('button', { class: 'btn primary', onclick: tryIt }, 'Pull the handle')), msg, el('p', { class: 'keys' }, '← → turn (hold to spin) · Enter pull · Backspace clear'));
  paint();
  return root;
}

// Word wheel: letters sit on a brass wheel. Pick a letter and the wheel spins it up to the pointer
// and stamps it; each tile can be used once, and a line connects the letters in order.
export function wheelUI(lock, st, onSolve) {
  st.used = st.used || []; st.jam = st.jam || 0; st.spin = st.spin || 0;
  const L = [...lock.letters], n = L.length, NS = 'http://www.w3.org/2000/svg';
  const root = el('div', { class: 'lockui', tabindex: 0, autofocus: true });
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '-150 -160 300 310'); svg.setAttribute('class', 'wheel');
  const pos = (i) => { const a = (i / n) * Math.PI * 2; return [Math.sin(a) * 104, -Math.cos(a) * 104]; };
  svg.innerHTML = `<circle r="142" fill="#b8923a" stroke="#5a431a" stroke-width="5"/><circle r="132" fill="#d9b860"/><g id="spin" style="transition:transform .45s cubic-bezier(.3,1.3,.5,1)"><circle r="70" fill="#b8923a" stroke="#5a431a" stroke-width="2"/><polyline id="trail" fill="none" stroke="#c8473c" stroke-width="5" stroke-linejoin="round" stroke-linecap="round" opacity=".85"/>${L.map((ch, i) => { const [x, y] = pos(i); return `<g class="tile" data-i="${i}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)})"><circle r="24" fill="#f6efd8" stroke="#5a431a" stroke-width="2.5"/><text class="lt" text-anchor="middle" dominant-baseline="central" font-size="27" font-weight="bold" font-family="Georgia,serif" fill="#2b2118">${ch}</text></g>`; }).join('')}</g><path d="M0 -128L-12 -158H12Z" fill="#c8473c" stroke="#5a1f1a" stroke-width="2"/><g transform="translate(-19 -19) scale(1.6)"><path fill="${SYMBOLS[lock.symbol].color}" fill-rule="evenodd" d="${SYMBOLS[lock.symbol].path}"/></g>`;
  const spin = svg.querySelector('#spin'), trail = svg.querySelector('#trail');
  const slots = el('div', { class: 'slots' });
  const msg = el('p', { class: 'msg' }, 'Pick letters to spell the password, then pull the lever.');
  const paint = () => {
    spin.style.transform = `rotate(${st.spin}deg)`;
    svg.querySelectorAll('.tile').forEach((t) => { t.classList.toggle('used', st.used.includes(+t.dataset.i)); t.querySelector('.lt').setAttribute('transform', `rotate(${-st.spin})`); });
    trail.setAttribute('points', st.used.map((i) => pos(i).map((v) => v.toFixed(1)).join(',')).join(' '));
    slots.replaceChildren(...(st.used.length ? st.used.map((i) => el('span', { class: 'slot' }, L[i])) : [el('span', { class: 'slot empty' }, '?')]));
  };
  const jammed = () => Date.now() < st.jam;
  const pickTile = (i) => {
    if (jammed() || st.used.includes(i) || st.used.length >= 7) return;
    // spin the shortest way so tile i sits under the pointer
    const target = -(i / n) * 360;
    st.spin += ((target - st.spin) % 360 + 540) % 360 - 180;
    st.used.push(i); sfx('tick'); paint();
  };
  const back = () => { if (!jammed()) { st.used.pop(); paint(); } };
  let jamTimer = null;
  const jamTick = () => {
    clearTimeout(jamTimer);
    if (!jammed()) { msg.textContent = 'Pick letters to spell the password, then pull the lever.'; root.classList.remove('jam'); return; }
    root.classList.add('jam');
    msg.textContent = `Wrong word. The mechanism has jammed for ${Math.ceil((st.jam - Date.now()) / 1000)}s. Use the clues to rule words out.`;
    if (root.isConnected) jamTimer = setTimeout(jamTick, 500);
  };
  const tryIt = () => {
    if (jammed() || !st.used.length) return;
    if (st.used.map((i) => L[i]).join('') === lock.word) { sfx('unlock'); onSolve(); return; }
    sfx('wrong'); shake(svg); st.used = []; st.jam = Date.now() + 12000; paint(); setTimeout(jamTick, 0);
  };
  svg.addEventListener('click', (e) => { const t = e.target.closest('.tile'); if (t) pickTile(+t.dataset.i); });
  root.addEventListener('keydown', (e) => {
    const k = e.key.toUpperCase();
    if (/^[A-Z]$/.test(k)) { const i = L.findIndex((ch, idx) => ch === k && !st.used.includes(idx)); if (i >= 0) pickTile(i); }
    else if (e.key === 'Backspace') back(); else if (e.key === 'Enter') tryIt(); else return;
    e.preventDefault(); e.stopPropagation();
  });
  root.append(header(lock, 'Word wheel', `Marked with a ${SYMBOLS[lock.symbol].name.toLowerCase()}. Each letter tile can be used once.`), svg, slots,
    el('div', { class: 'row' }, el('button', { class: 'btn', onclick: back }, '⌫ Undo letter'), el('button', { class: 'btn primary', onclick: tryIt }, 'Pull the lever')), msg, el('p', { class: 'keys' }, 'Click or type letters · Backspace · Enter'));
  paint(); setTimeout(jamTick, 0);
  return root;
}
