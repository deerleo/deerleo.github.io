// The interface shell: the title card, the few things on screen during the ride (the name of each realm on
// arrival, first-minute hints, a pause button and a music toggle), the panel (pause, options, controls) and the
// ending. How it looks, and why its lettering can always be read: src/style.css.
//
//   initUI(engine, { dev })    called once by main.js when the first realm is ready. With dev = true (the URL
//                              names a realm) the title card is skipped and the ride starts at once.
//
// What it touches in the engine: start(), paused, frozen (the boat is held still while the title card is up, and
// let go by the interface itself only if the first area has not done so 45 seconds after 'Push off'),
// input.enabled, input.sensitivity, boat.motion and reducedMotion, and, for the title card only, the boat's place
// on the waterway (see TITLE_OVER_SCENE) and one extra render() to look at the picture behind the card (the card
// is lettered in ink over a bright picture and in pale paper over a dark one: readTitleTone). During the ride the
// picture is looked at once as each name or hint appears, straight after the engine has drawn it (chooseInk). It talks to
// engine.audio only through unlock / setMusicOn / setMusicVolume / setSfxVolume / setPaused, each call guarded
// and none of them made before the rider begins. It also gives the canvas role="application" and a description,
// and keeps it out of reach while the title card is up. And it stands between the keyboard and the engine in one
// case: a letter key of the ride pressed while a button has focus goes no further (LETTER_KEYS).
// The controls are shown without being asked for (LEGEND): one line under 'Push off', and the same line across the foot
// of the picture for the first quarter minute of each ride. On a touch screen the thumb's stick rests in sight at the
// lower left (updateStick), and a mark at the picture's edge points the way on for a rider turned from it (updateWay).
// Buttons for steering and looking (an option, off unless asked for: WCAG 2.5.7, nothing in the ride may need a
// drag): nine small buttons at the foot of the picture during the ride, which reach the boat through
// input.hold({ throttle, steer }) and input.lookStep(yaw, pitch) and nothing else. How a press is read: "the pad",
// below. Their log, with the runs and the measurements: docs/build/interface-dragging.md.
// The accessibility audit (WCAG 2.2 A and AA, 8 November 2026), state by state, with how to repeat every
// measurement: docs/build/interface-audit.md.
// One thing it puts in the page outside #ui: a layer between the picture and the interface (.grounds), which holds
// what the lettering over the picture stands on (syncGrounds; src/style.css, "the grounds").
//
// A realm may choose the view behind the title card:   titleView: { s, d, heading, yaw, pitch }   (metres, degrees)
// Saved options live in localStorage under 'quiet-current:options:v1' (music, volumes, motion, sensitivity,
// realm names, the buttons for steering and looking, picture quality, and which hints the rider no longer needs).
//
// Test switches (a development host only). tools/pageshot.py photographs the page as soon as this file says that
// everything in the picture has arrived (index.html holds the headless browser's clock until then), so every state
// that needs a click or some time is reached at once from the URL:
//   &uitest=a,b,c  any of:
//       still      no fades: every state is simply there. A headless browser gets this by itself; fades puts them back
//                  (and then pageshot's --wait is the time the page runs, at one frame a frame)
//       title      show the title card even when the URL names a realm        begin   press 'Push off'
//       options    open the options (from the title card if it is up, else in the pause panel)
//       controls   open the controls (likewise)                               pause   open the pause panel      resume  then resume again
//       name       show the realm name and keep it       hints   show one hint and keep it (&hint=steer|paddle|look|drift)
//       hold       show the dots that mean "loading the next waters"            stick   show the touch stick
//       awake      keep the corner buttons awake         idle    show them as they are at rest
//       quality    choose another picture quality (shows the Apply and reload button)
//       ending     the end of the ride: the pale veil and its two choices      moored   'Push off' again, as after 'Ride again'
//       ghost      every letter and mark invisible, every ground left: what the lettering really stands on
//       spacing    a reader's own text spacing (WCAG 1.4.12: line height 1.5, letters .12em, words .16em, paragraphs 2em)
//       buttons    show the buttons for steering and looking, whatever is saved      pressed   two of them held on
//       debug      a line of state in the corner         fresh   ignore saved options
//   &as=keys|touch|gamepad  as if the rider held that: the wording of the hints, and where the words go (on a touch screen
//                           the name stands top left and the hint clear of the thumbs: src/style.css, data-hands)
//   &tone=day|night         letter the title card in ink, or in pale paper, whatever the picture
//   &ink=day|night          the same for the words during the ride (the name of a place, a hint, the waiting dots)
//   &flat=white|black|8a7   put one flat colour in place of the picture (the worst pictures there are, for measuring contrast)
//   &boxes=x.json           post where every piece of lettering and every control is, and its colours, to the dev server
//                           (.shots/x.json): with the photograph, that is all a contrast measurement needs. The same file
//                           lists every control Tab can reach, in order, with its role, name, description, state and size
//                           (`reach`), and what a screen reader is given of the picture, the panel and the headings (`heard`)
//   &sim=8                  run the ride for 8 seconds (after 'Push off', if asked)   &keys=KeyA,KeyW   with these keys held down
//   &focus=begin|options|controls|music|pause|resume|restart|menuoptions|menucontrols|back|switch|slider|choice|apply|list|again|stay|pushoff|view
//                           put keyboard focus there (and steerleft|paddle|steerright|backwater|lookleft|lookup|lookahead|lookdown|lookright)
//   &box=390                draw the interface and the picture in a column 390px wide, or &box=320 (headless Chrome's window is never
//                           narrower than 500px; the column may be as narrow as 240)
//   &zoom=2                 text at 200%
//   &seed={"music":false}   start from these saved options (JSON, URL-encoded)
//   &run=...&out=x.json     play a script in real time and post what happened to the dev server (see runScript):
//                           python3 tools/shot.py "/?run=wait:3000,snap,click:begin,wait:4000,snap&out=ui_x.json" ui_x.json

import { makeLogo } from './logo.js';
import { STICK_RADIUS } from './engine/input.js';

/** The name of the ride. Everything the interface shows takes it from here (index.html repeats it in <title>). */
export const RIDE_NAME = 'What the water keeps';
// (not on the title card: the card shows the name and nothing under it. It is only what a screen reader says of
//  'Push off' when focus comes to it.)
const RIDE_LINE = 'One night on one river, from sunset to first light.';
// What assistive technology is told of the picture (the canvas is described by it, and it is the first thing on the page).
const RIDE_DESCRIPTION = 'A slow first-person boat ride. You sit low in a small boat with a lantern at its bow; '
  + 'a young woman stands at the stern behind you and sculls the boat with one long oar. '
  + 'The river passes in one night through eight very different places, from a landing at sunset to a sky of stars at first light, '
  + 'and in each of them someone has left a lamp burning. '
  + 'There is nothing to win and nothing to lose: steer and paddle if you wish, or let the current carry you.';
const PAUSE_LINE = 'The water will wait.';

/** Show the first scene behind the title card (the ride itself starts in the mist before it). */
const TITLE_OVER_SCENE = true;
const TITLE_PITCH = 5;                                   // degrees the rider looks up while the title card is shown

const STORE_KEY = 'quiet-current:options:v1';
const QUALITIES = ['low', 'medium', 'high'];
const HINT_ORDER = ['way', 'steer', 'paddle', 'look', 'drift'];
// The buttons for steering and looking. A press shorter than this is a click, and a click leaves a button on until
// it is pressed again (what a pointer that cannot hold sends: a dwell, a switch); a longer one is a hold, and ends
// with it. Each press of a look button turns the head this many degrees to the side, or tilts it this many.
const PAD_TAP_MS = 350, PAD_LOOK_STEP = 25, PAD_TILT_STEP = 15;
const RIDE_KEYS = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyQ', 'KeyE', 'KeyR', 'KeyF', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'ShiftLeft', 'ShiftRight']);
// The ride's keys that are single letters. They belong to the picture: they act while it has focus (or nothing
// has), and not while another control does (WCAG 2.1.4: someone who speaks to their computer, with focus on a
// button, must not set the boat going or stop the music with a word). Arrows, Shift, Space and Esc are not letters.
const LETTER_KEYS = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyQ', 'KeyE', 'KeyR', 'KeyF', 'KeyM', 'KeyP']);

// The controls, in four small groups. [[W]] is a key cap; [[↑|up arrow]] is a key cap that is read aloud as
// "up arrow"; a row without a cap is told in words. 'hands' marks the group that comes first on a touch screen.
const CONTROLS = [
  ['The boat', [
    ['Paddle forward and back', '[[W]] [[S]] or [[↑|up arrow]] [[↓|down arrow]]'],
    ['Steer', '[[A]] [[D]] or [[←|left arrow]] [[→|right arrow]]'],
    ['Paddle harder', 'Hold [[Shift]]'],
  ]],
  ['Looking', [
    ['Look around', 'Drag with the mouse, or [[Q]] [[E]]'],
    ['Look up and down', '[[R]] [[F]]'],
    ['Face forward again', '[[Space]]'],
  ]],
  ['The ride', [
    ['Pause', '[[Esc]] or [[P]]'],
    ['Music on and off', '[[M]]'],
  ]],
  ['Without a keyboard', [
    ['Touch', 'Left thumb to steer and paddle, right thumb to look'],
    ['Gamepad', 'Left stick to steer and paddle, right stick to look, Start to pause'],
    ['Buttons on the picture', 'To steer, paddle and look with presses alone, switch them on in Options'],
  ], 'hands'],
];

// One hint per thing the rider can do, worded for whatever they are holding. `say` is the spoken version.
const HINTS = {
  // (9 November, the client: the lanterns should "feel more obvious that they're guiding the player to the next world".
  // Said once, in words, after the line of controls: src/engine/wayfinder.js is what it speaks of.)
  way: {
    keys: ['Follow the lanterns to the arch of lights', 'The lanterns on the water show the way on. Follow them to the arch of lights.'],
  },
  steer: {
    keys: ['Steer with [[A]] [[D]] or [[←|left arrow]] [[→|right arrow]]', 'Steer with A and D, or the left and right arrow keys.'],
    touch: ['Slide your left thumb sideways to steer', 'Slide your left thumb sideways to steer.'],
    gamepad: ['Steer with the left stick', 'Steer with the left stick.'],
    buttons: ['Steer with the two turning arrows, lower left', 'Steer with the two turning arrow buttons at the lower left.'],
  },
  paddle: {
    keys: ['Paddle with [[W]] [[S]] or [[↑|up arrow]] [[↓|down arrow]]', 'Paddle forward and back with W and S, or the up and down arrow keys.'],
    touch: ['Slide your left thumb up to paddle', 'Slide your left thumb up to paddle forward, down to paddle back.'],
    gamepad: ['Push the left stick forward to paddle', 'Push the left stick forward to paddle.'],
    buttons: ['Paddle with the up arrow, lower left', 'Paddle with the up arrow button at the lower left. The down arrow backs water.'],
  },
  look: {
    keys: ['Drag to look around, or press [[Q]] [[E]]', 'Drag with the mouse to look around, or press Q and E.'],
    touch: ['Drag with your right thumb to look around', 'Drag with your right thumb to look around.'],
    gamepad: ['Look around with the right stick', 'Look around with the right stick.'],
    buttons: ['Look around with the buttons at the lower right', 'Look around with the buttons at the lower right.'],
  },
  drift: {
    keys: ['Let go whenever you like. The current will carry you.', 'Let go whenever you like. The current will carry you.'],
  },
};

// The controls in one line, there without being asked for: on the title card under 'Push off', and across the foot of
// the picture for the first quarter minute of every ride. (The client, 9 November, after his first ride: "the player
// should see the controls without clicking 'controls'".) Two halves, worded for whatever the rider is holding, and
// the same said aloud. The Controls panel still has the whole list.
const LEGEND = {
  keys: [['Paddle and steer with [[W]] [[A]] [[S]] [[D]] or the arrow keys', 'Drag to look around'], 'Paddle and steer with W, A, S and D, or the arrow keys. Drag with the mouse to look around.'],
  touch: [['Left thumb to steer and paddle', 'Right thumb to look around'], 'Slide your left thumb to steer and paddle. Drag with your right thumb to look around.'],
  gamepad: [['Left stick to steer and paddle', 'Right stick to look around'], 'Steer and paddle with the left stick. Look around with the right stick.'],
  buttons: [['Steer and paddle with the arrows, lower left', 'Look with the buttons, lower right'], 'Steer and paddle with the arrow buttons at the lower left. Look around with the buttons at the lower right.'],
};

const ICONS = {
  // (music off: the note stays at full strength and one stroke crosses it, with a little air cut out of the note on
  //  either side of the stroke; a note at half strength could not be made out on its plate over a bright sky)
  music: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><mask id="music-off-gap" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24"><path d="M0 0h24v24H0z" fill="#fff" stroke="none"/><path d="M4.5 4.5l15 15" fill="none" stroke="#000" stroke-width="5"/></mask>'
    + '<g class="note"><path d="M9.6 17.4V6.3l8-1.8v10.7"/><ellipse cx="7.5" cy="17.4" rx="2.1" ry="1.65"/><ellipse cx="15.5" cy="15.2" rx="2.1" ry="1.65"/></g><path class="off" d="M4.5 4.5l15 15"/></svg>',
  pause: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9 6.5v11M15 6.5v11"/></svg>',
  wave: '<svg viewBox="0 0 68 12" aria-hidden="true" focusable="false"><path d="M2 6c5.5-4.6 10.5-4.6 16 0s10.5 4.6 16 0 10.5-4.6 16 0 10.5 4.6 16 0"/></svg>',
  // the buttons for steering and looking: arrows for the boat (one that bends, for the helm), a chevron or an eye for the view
  steerLeft: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M17.5 19v-5.6a4.9 4.9 0 0 0-4.9-4.9H6.2M10.2 4.5l-4 4 4 4"/></svg>',
  paddle: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 18.7V5.6M6.8 10.6 12 5.4l5.2 5.2"/></svg>',
  steerRight: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6.5 19v-5.6a4.9 4.9 0 0 1 4.9-4.9h6.4M13.8 4.5l4 4-4 4"/></svg>',
  backWater: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 5.3v13.1M6.8 13.4l5.2 5.2 5.2-5.2"/></svg>',
  lookLeft: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M14.6 6.2 8.8 12l5.8 5.8"/></svg>',
  lookAhead: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M2.8 12c2.6-3.7 5.7-5.5 9.2-5.5s6.6 1.8 9.2 5.5c-2.6 3.7-5.7 5.5-9.2 5.5S5.4 15.7 2.8 12z"/><circle cx="12" cy="12" r="2.6"/></svg>',
  lookRight: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9.4 6.2l5.8 5.8-5.8 5.8"/></svg>',
  lookUp: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6.2 14.6 12 8.8l5.8 5.8"/></svg>',
  lookDown: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6.2 9.4l5.8 5.8 5.8-5.8"/></svg>',
};

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const rad = (deg) => deg * Math.PI / 180;

/** Build an element. props: class, text, html (static markup only), on<event>, anything else as a property or attribute. */
function el(tag, props, ...kids) {
  const node = document.createElement(tag);
  if (props) for (const key in props) {
    const v = props[key];
    if (v == null || v === false) continue;
    if (key === 'class') node.className = v;
    else if (key === 'text') node.textContent = v;
    else if (key === 'html') node.innerHTML = v;
    else if (key.startsWith('on')) node.addEventListener(key.slice(2), v);
    else if (typeof v !== 'string' && key in node) node[key] = v;
    else node.setAttribute(key, v === true ? '' : String(v));
  }
  for (const kid of kids.flat()) if (kid != null) node.append(kid);
  return node;
}

/** Turn 'Steer with [[A]] [[D]] or [[←|left arrow]]' into words and key caps. Caps that belong together stay on one line. */
function phrase(template) {
  const tokens = template.split(/(\[\[.+?\]\])/).map((t) => t.trim()).filter(Boolean);
  const out = [];
  let group = null;
  tokens.forEach((token, i) => {
    const isKey = token.startsWith('[[');
    const joins = token === 'or' && group && i + 1 < tokens.length && tokens[i + 1].startsWith('[[');
    if (!isKey && !joins) { group = null; out.push(el('span', { class: 'words', text: token })); return; }
    if (!group) { group = el('span', { class: 'keys' }); out.push(group); } else group.append(' ');
    if (joins) { group.append(el('span', { class: 'or', text: 'or' })); return; }
    const [cap, spoken] = token.slice(2, -2).split('|');
    group.append(spoken ? el('kbd', null, el('span', { 'aria-hidden': 'true', text: cap }), el('span', { class: 'vh', text: spoken })) : el('kbd', { text: cap }));
  });
  return out;
}

function loadStore(skip, seed) {
  const s = { music: true, musicVolume: 0.8, soundVolume: 0.8, reduceMotion: null, sensitivity: 1, brightness: 1, captions: true, buttons: false, quality: null, learned: {} };
  if (skip) return s;
  try {
    const raw = seed ? JSON.parse(seed) : JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
    if (raw && typeof raw === 'object') {
      if (typeof raw.music === 'boolean') s.music = raw.music;
      if (Number.isFinite(raw.musicVolume)) s.musicVolume = clamp(raw.musicVolume, 0, 1);
      if (Number.isFinite(raw.soundVolume)) s.soundVolume = clamp(raw.soundVolume, 0, 1);
      if (typeof raw.reduceMotion === 'boolean') s.reduceMotion = raw.reduceMotion;
      if (Number.isFinite(raw.sensitivity)) s.sensitivity = clamp(raw.sensitivity, 0.4, 2);
      if (Number.isFinite(raw.brightness)) s.brightness = clamp(raw.brightness, 0.7, 1.5);
      if (typeof raw.captions === 'boolean') s.captions = raw.captions;
      if (typeof raw.buttons === 'boolean') s.buttons = raw.buttons;
      if (QUALITIES.includes(raw.quality)) s.quality = raw.quality;
      if (raw.learned && typeof raw.learned === 'object') for (const id of HINT_ORDER) if (raw.learned[id] === true) s.learned[id] = true;
    }
  } catch { /* storage is blocked, private or damaged: the defaults will do */ }
  return s;
}

/**
 * Development only (index.html, ?uistub=1): something for the interface to stand on that is not the ride. A still
 * picture of the ride (&bg=.shots/x.png, as tools/shot.py takes them) or a flat colour fills the canvas, and the few
 * things the interface asks of the engine are answered plainly. A photograph of the interface then needs no WebGL
 * and no area to be built: it is quick, it is the same every time, and the picture behind is one that was chosen.
 *   /?uistub=1&bg=.shots/ui_bg_snow_1440x900.png&name=The orchard in snow&uitest=name,hints,awake
 *   /?uistub=1&bg=.shots/ui_bg_title_1440x900.png&uitest=title           (the title card; &tone= to force its ink)
 */
export async function stubEngine(canvas, q) {
  const listeners = {}, picture = new Image(), g = canvas.getContext('2d');
  const veil = { getHexString: () => 'f3ddb0' };
  const inst = { def: { name: q.get('name') || 'The landing', departure: true }, path: { length: 100, at: () => ({ heading: 0, halfWidth: 10 }) }, look: { veil, veilLength: 10 }, ctx: null, time: 0 };
  const engine = {
    canvas, opts: {}, audio: null, ui: null, paused: false, frozen: false, brightness: 1, reducedMotion: false, running: false,
    quality: { level: ['low', 'medium', 'high'].includes(q.get('q')) ? q.get('q') : 'high' },
    camera: { rotation: { x: 0, y: 0 } },
    boat: { motion: 1, s: 20, d: 0, heading: 0, idle: 0, place() {} },
    input: { enabled: false, sensitivity: 1, lookYaw: 0, lookPitch: 0, steer: 0, throttle: 0, lastLook: 1, keys: new Set(), touch: { id: null, x0: 0, y0: 0, steer: 0, throttle: 0 },
      actions: new Set(), held: { throttle: 0, steer: 0 }, hold(v) { Object.assign(this.held, v); }, lookStep(yaw = 0, pitch = 0) { this.lookYaw += yaw * Math.PI / 180; this.lookPitch += pitch * Math.PI / 180; } },
    realms: { current: inst, built: new Map([[0, inst]]), veil: 0, veilColor: null, holding: false, lookAhead: false, veilAt: () => 0 },
    on(name, fn) { (listeners[name] || (listeners[name] = [])).push(fn); },
    emit(name, ...args) { for (const fn of listeners[name] || []) fn(...args); },
    render() {},
    resize() {                             // the picture covers the canvas, as a photograph covers its mount
      const w = engine.opts.size ? engine.opts.size[0] : window.innerWidth, h = engine.opts.size ? engine.opts.size[1] : window.innerHeight;
      canvas.width = w; canvas.height = h;
      if (engine.opts.size) { canvas.style.width = w + 'px'; canvas.style.height = h + 'px'; }
      g.fillStyle = '#23252e'; g.fillRect(0, 0, w, h);
      if (picture.naturalWidth) { const k = Math.max(w / picture.naturalWidth, h / picture.naturalHeight); g.drawImage(picture, (w - picture.naturalWidth * k) / 2, (h - picture.naturalHeight * k) / 2, picture.naturalWidth * k, picture.naturalHeight * k); }
    },
    simulate(seconds, hz = 60) { for (let i = 0, n = Math.max(1, Math.round(seconds * hz)); i < n; i++) engine.emit('update', 1 / hz); },
    start() {
      if (engine.running) return;
      engine.running = true;
      let last = performance.now();
      const loop = (now) => { requestAnimationFrame(loop); const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now; if (!engine.paused) engine.emit('update', dt); };
      requestAnimationFrame(loop);
    },
    loadTexture: () => Promise.resolve({}), releaseTexture() {},
    rideAgain: () => Promise.resolve(),
  };
  // (the load event, not decode(): a headless browser's virtual clock runs out while a page sits waiting for a decode)
  if (q.get('bg')) await new Promise((done) => { picture.onload = picture.onerror = done; picture.src = q.get('bg'); });      // no such picture: the flat grey will do
  window.addEventListener('resize', () => engine.resize());
  window.addEventListener('keydown', (e) => engine.input.keys.add(e.code));      // (where the engine listens: what reaches here would have reached the boat)
  engine.resize();
  window.engine = engine;
  return engine;
}

/**
 * Build the interface and start the ride (or the title card before it).
 * @param engine  the Engine from src/engine/engine.js
 * @param {{dev?: boolean}} opts
 */
export function initUI(engine, opts = {}) {
  try { return mount(engine, opts); } catch (err) {
    console.error('The interface could not start; the ride runs without it.', err);
    const root = document.getElementById('ui');
    if (root) root.textContent = '';
    for (const g of document.querySelectorAll('.grounds')) g.remove();
    if (window.__opening) window.__opening.done(0);      // (the page's first picture, if it is still up: the ride is behind it)
    engine.frozen = false; engine.paused = false; engine.input.enabled = true; engine.start();
    if (window.__clockHeld) window.__clockHeld.release();
    return null;
  }
}

function mount(engine, { dev = false } = {}) {
  const root = document.getElementById('ui');
  const canvas = engine.canvas || document.getElementById('view');
  const params = new URLSearchParams(location.search);
  // the test switches only work on a development host
  const local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || location.hostname.endsWith('.localhost');
  const test = (name) => (local && params.has(name) ? params.get(name) : null);
  const tests = new Set((test('uitest') || '').split(',').map((t) => t.trim()).filter(Boolean));
  const store = loadStore(tests.has('fresh'), test('seed'));
  const save = () => { if (tests.has('fresh')) return; try { localStorage.setItem(STORE_KEY, JSON.stringify(store)); } catch { /* not allowed: the choice lasts for this visit */ } };
  if (test('seed')) save();
  if (tests.has('buttons')) store.buttons = true;      // (for photographs and runs: as if the option had been switched on)

  // A saved picture quality is applied by loading the page with it (the engine reads ?q= when it is built).
  if (!dev && !params.has('q') && store.quality && store.quality !== engine.quality.level) {
    const url = new URL(location.href);
    url.searchParams.set('q', store.quality); url.searchParams.delete('seed');
    location.replace(url);
    return null;
  }

  // Sound: nothing is sent to the audio engine until the rider has begun (or, without a title card, made a first gesture).
  let soundOpen = false;
  const audio = (method, ...args) => {
    try {
      const a = engine.audio;
      if (!a || typeof a[method] !== 'function' || (!soundOpen && method !== 'unlock')) return;
      const result = a[method](...args);
      if (result && typeof result.catch === 'function') result.catch((err) => console.info(`audio.${method}:`, err && err.message));
    } catch (err) { console.info(`audio.${method}:`, err && err.message); }
  };

  const systemMotion = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  // (&calm=1 asks for reduced motion as the system's own setting would, src/main.js: the rider's saved choice still comes first)
  const urlMotion = params.has('calm') ? params.get('calm') !== '0' : null;
  const reduceMotion = () => store.reduceMotion ?? urlMotion ?? (systemMotion ? systemMotion.matches : !!engine.reducedMotion);
  // No fades when the page is being photographed (asked for with &uitest=still, and assumed for a headless browser
  // on a development host unless a real-time script is running or &uitest=fades says otherwise).
  const headless = local && /HeadlessChrome/.test(navigator.userAgent);
  const still = tests.has('still') || (headless && !test('run') && !tests.has('fades'));
  const calm = () => still || reduceMotion();

  let mode = 'boot';                       // 'title' | 'leaving' | 'ride' | 'paused'
  let lastToggle = 0;                      // when the ride was last paused or resumed (ms)
  let returnFocus = null;                  // where focus goes when the panel closes
  const setMode = (m) => { mode = m; root.dataset.state = m; syncPad(); };

  // =================================================================================================== the parts
  // The page's own first picture may still be up, with the name on it (index.html, "the opening"). Its card stays
  // where it is until the title card takes its place (showTitle); everything else in here is ours to clear.
  const opening = window.__opening && !window.__opening.over ? window.__opening : null;
  for (const node of [...root.childNodes]) if (!(opening && node.id === 'loading')) node.remove();
  const live = el('p', { class: 'vh', role: 'status', 'aria-live': 'polite' });
  const say = (text) => { live.textContent = ''; setTimeout(() => { live.textContent = text; }, 60); };
  const description = el('p', { class: 'vh', id: 'ride-description', text: RIDE_DESCRIPTION });
  // ---- the ride's name as a drawn mark (src/logo.js): the words standing on a waterline, the last of them going under,
  //      the water keeping them, and one kept lamp at the end of the line. It is a logotype, so a picture of its words
  //      is allowed (WCAG 1.4.5); the name itself stays in the page as text, out of sight, for whoever cannot see it.
  //      Its ink is the lettering's (the element's own colour, which follows the tone); its flame is --mark-lamp.
  const marks = [];
  function mark(cls) {
    const canvas = el('canvas', { class: 'mark ' + cls, 'aria-hidden': 'true' });
    canvas.width = 8; canvas.height = 3;
    const m = { canvas, key: '', time: 0, draw() {
      const w = canvas.clientWidth;
      if (w < 8) return;                                   // (not laid out yet, or out of sight: drawn when it shows)
      const cs = getComputedStyle(canvas), px = Math.min(2600, Math.round(w * Math.min(2, window.devicePixelRatio || 1)));
      const ink = cs.color, lamp = cs.getPropertyValue('--mark-lamp').trim() || '#ffb45e';
      const key = [px, ink, lamp, m.time.toFixed(2)].join('|');
      if (key === m.key) return;
      m.key = key;
      try { makeLogo({ canvas, width: px, ink, lamp, time: m.time }); } catch (err) { console.warn(err); }
    } };
    marks.push(m);
    return m;
  }
  const drawMarks = () => { for (const m of marks) m.draw(); };
  const titleMark = mark('title__mark'), endMark = mark('ending__mark');
  const heading = el('h1', { id: 'ride-name', class: 'title__name' }, el('span', { class: 'vh', text: RIDE_NAME }), titleMark.canvas);
  document.title = RIDE_NAME;
  canvas.setAttribute('role', 'application');            // the picture takes the keys itself; a screen reader should pass them on
  canvas.setAttribute('aria-describedby', 'ride-description');

  // ---- controls: four small groups (they live in the panel; the title card and the pause menu both open it)
  const controlsList = el('div', { class: 'controls' }, CONTROLS.map(([name, rows, kind], i) => el('section', { class: 'controls__group' + (kind ? ' controls__group--' + kind : ''), 'aria-labelledby': 'controls-group-' + i },
    el('h3', { class: 'controls__head', id: 'controls-group-' + i }, el('span', { text: name })),
    el('dl', { class: 'controls__list' }, rows.map(([what, how]) => el('div', { class: 'control' + (how.includes('[[') ? '' : ' control--words') }, el('dt', { text: what }), el('dd', null, phrase(how))))))));

  // ---- options
  const optionRow = (stack, ...kids) => el('div', { class: 'option' + (stack ? ' option--stack' : '') }, ...kids);
  const optionText = (id, label, note) => el('div', { class: 'option__text' },
    el('label', { class: 'option__label', for: id, id: id + '-label', text: label }),
    note ? el('span', { class: 'option__note', id: id + '-note', text: note }) : null);
  const makeSwitch = (id, label, note, onChange) => {
    const input = el('input', { type: 'checkbox', role: 'switch', class: 'switch', id, 'aria-describedby': note ? id + '-note' : null });
    input.addEventListener('change', () => onChange(input.checked));
    const row = optionRow(false, optionText(id, label, note), input);
    row.addEventListener('click', (e) => { if (e.target === row || e.target.classList.contains('option__text') || e.target.classList.contains('option__note')) input.click(); });
    return { row, input };
  };
  const makeSlider = (id, label, note, { min, max, step, valueText }, onInput) => {
    const input = el('input', { type: 'range', class: 'slider', id, min: String(min), max: String(max), step: String(step), 'aria-describedby': note ? id + '-note' : null });
    const paint = () => {
      const v = +input.value;
      input.style.setProperty('--fill', ((v - min) / (max - min) * 100).toFixed(1) + '%');
      input.setAttribute('aria-valuetext', valueText(v));
    };
    input.addEventListener('input', () => { paint(); onInput(+input.value); });
    input.addEventListener('change', save);
    return { row: optionRow(true, optionText(id, label, note), input), input, set: (v) => { input.value = String(v); paint(); } };
  };
  const percent = (v) => `${Math.round(v)} percent`;

  const musicSwitch = makeSwitch('opt-music', 'Music', null, (on) => setMusic(on));
  const musicVolume = makeSlider('opt-music-volume', 'Music volume', null, { min: 0, max: 100, step: 5, valueText: percent }, (v) => { store.musicVolume = v / 100; audio('setMusicVolume', store.musicVolume); });
  const soundVolume = makeSlider('opt-sound-volume', 'Sound volume', 'Everything that is not music', { min: 0, max: 100, step: 5, valueText: percent }, (v) => { store.soundVolume = v / 100; audio('setSfxVolume', store.soundVolume); });
  const motionSwitch = makeSwitch('opt-motion', 'Reduce motion', 'Steadies the boat and stills the interface', (on) => { store.reduceMotion = on; save(); applyMotion(); });
  const lookSlider = makeSlider('opt-look', 'Look sensitivity', 'How far a drag turns the view', { min: 0.4, max: 2, step: 0.1, valueText: (v) => `${v.toFixed(1)} times` }, (v) => { store.sensitivity = v; engine.input.sensitivity = v; });
  const brightSlider = makeSlider('opt-bright', 'Brightness', 'Raise it if the dark places are too dark on your screen', { min: 0.7, max: 1.5, step: 0.05, valueText: (v) => `${Math.round(v * 100)} percent` }, (v) => { store.brightness = v; engine.brightness = v; });
  const buttonsSwitch = makeSwitch('opt-buttons', 'Buttons for steering and looking', 'For a pointer that cannot drag: hold one down, or press it once to keep it on', (on) => { store.buttons = on; save(); syncPad(); });
  const captionSwitch = makeSwitch('opt-captions', 'Place names', 'Show the name of each place as you arrive', (on) => { store.captions = on; save(); if (!on) hideRealmName(); });

  const qualityNow = QUALITIES.includes(engine.quality.level) ? engine.quality.level : 'high';
  const qualityApply = el('button', { type: 'button', class: 'quiet-btn', text: 'Apply and reload' });
  const qualityExtra = el('div', { class: 'option__extra', hidden: true }, qualityApply);
  const qualityInputs = QUALITIES.map((q) => el('input', { type: 'radio', name: 'opt-quality', value: q, checked: q === qualityNow }));
  const qualityChosen = () => (qualityInputs.find((i) => i.checked) || {}).value || qualityNow;
  const qualityRow = el('div', { class: 'option option--stack' },
    el('div', { class: 'option__text' },
      el('span', { class: 'option__label', id: 'opt-quality-label', text: 'Picture quality' }),
      el('span', { class: 'option__note', id: 'opt-quality-note', text: 'Reloads the ride from the start' })),
    el('div', { class: 'choice', role: 'radiogroup', 'aria-labelledby': 'opt-quality-label', 'aria-describedby': 'opt-quality-note' },
      qualityInputs.map((input) => el('label', { class: 'choice__item' }, input, el('span', { text: input.value[0].toUpperCase() + input.value.slice(1) })))),
    qualityExtra);
  // choosing a quality changes nothing by itself: a button appears, and the page only reloads when it is pressed
  for (const input of qualityInputs) input.addEventListener('change', () => {
    const changed = qualityChosen() !== qualityNow;
    qualityExtra.hidden = !changed;
    if (changed) say('Press Apply and reload to use this picture quality. The ride will start again.');
  });
  qualityApply.addEventListener('click', () => {
    store.quality = qualityChosen(); save();
    const url = new URL(location.href); url.searchParams.set('q', store.quality);
    for (const key of ['uitest', 'hint', 'as', 'sim', 'keys', 'focus', 'run', 'out', 'seed', 'tone', 'flat', 'boxes']) url.searchParams.delete(key);
    location.assign(url);
  });
  const optionsList = el('div', { class: 'options' }, musicSwitch.row, musicVolume.row, soundVolume.row, brightSlider.row, motionSwitch.row, lookSlider.row, buttonsSwitch.row, captionSwitch.row, qualityRow);

  // ---- title card: the name, one button, and two quiet words that open the controls and the options. Nothing is
  //      written under the name. (One line is kept out of sight for a screen reader, as what 'Push off' leads to:
  //      it is in no one's picture and in no one's reading order, only in the button's description.)
  const beginButton = el('button', { type: 'button', class: 'begin', 'aria-describedby': 'ride-line', text: 'Push off' });
  const titleControls = el('button', { type: 'button', class: 'quiet-link', 'aria-haspopup': 'dialog', text: 'Controls' });
  const titleOptions = el('button', { type: 'button', class: 'quiet-link', 'aria-haspopup': 'dialog', text: 'Options' });
  const titleLine = el('p', { id: 'ride-line', hidden: true, text: RIDE_LINE });
  const titleMore = el('div', { class: 'title__more' }, titleControls, el('i', { 'aria-hidden': 'true' }), titleOptions);
  // the controls in one line, under the button (LEGEND): worded for what the rider holds, and worded again if that changes
  const titleKeys = el('p', { class: 'title__keys' });
  const legendKind = () => { const forced = test('as'); return forced && LEGEND[forced] ? forced : (store.buttons ? 'buttons' : (LEGEND[modality] ? modality : 'keys')); };
  let titleKeysKind = null;
  function fillTitleKeys() {
    const kind = legendKind();
    if (kind === titleKeysKind) return;
    titleKeysKind = kind;
    const [[a, b]] = LEGEND[kind];
    // (two halves with air between them, no mark: where the line is too long for its window it breaks between the halves)
    titleKeys.replaceChildren(el('span', { class: 'legend__half' }, phrase(a)), el('span', { class: 'legend__half' }, phrase(b)),
      el('span', { class: 'legend__turn', text: 'Turn your phone on its side for a wider view' }));      // (shown only on a phone held upright: src/style.css)
  }
  const titleCard = el('div', { class: 'title__card' },
    heading,
    titleLine,
    beginButton,
    titleKeys,
    titleMore);
  const title = el('section', { class: 'title', 'data-tone': 'night', 'aria-labelledby': 'ride-name' }, titleCard);

  // ---- during the ride
  const musicButton = el('button', { type: 'button', class: 'hud__btn', 'aria-pressed': 'true', 'aria-keyshortcuts': 'M', title: 'Music (M)', html: ICONS.music + '<span class="vh">Music</span>' });
  const pauseButton = el('button', { type: 'button', class: 'hud__btn', 'aria-haspopup': 'dialog', 'aria-keyshortcuts': 'Escape P', title: 'Pause (Esc or P)', html: ICONS.pause + '<span class="vh">Pause</span>' });
  const hud = el('div', { class: 'hud', role: 'group', 'aria-label': 'Ride controls', hidden: true }, musicButton, pauseButton);
  // ---- buttons for steering and looking ("the pad": an option, off unless asked for). Four for the boat at the lower
  //      left, five for the view at the lower right, each in the manner of the corner buttons: a small mark on a plate
  //      of smoked glass, a name for assistive technology, a tooltip. [name, axis, value, mark] and [name, tooltip, mark].
  //      (Up and down are there because a drag tilts the view as well as turning it: without them a pointer that
  //      cannot drag could never look up at the sky.)
  const padButton = (name, tip, icon, more) => el('button', { type: 'button', class: 'hud__btn pad__btn', title: tip, html: icon + '<span class="vh">' + name + '</span>', ...more });
  const boatButtons = [['Steer left', 'steer', -1, ICONS.steerLeft], ['Paddle', 'throttle', 1, ICONS.paddle], ['Steer right', 'steer', 1, ICONS.steerRight], ['Back water', 'throttle', -1, ICONS.backWater]]
    .map(([name, axis, value, icon]) => ({ name, axis, value, down: null, pointer: null, since: 0, was: false, latched: false, readAt: -1e9,
      node: padButton(name, name + ' (hold, or press once to keep it on)', icon, { 'aria-pressed': 'false' }) }));
  const lookLeftButton = padButton('Look left', 'Look left (a step each press)', ICONS.lookLeft);
  const lookAheadButton = padButton('Look ahead', 'Look ahead (Space)', ICONS.lookAhead, { 'aria-keyshortcuts': 'Space' });
  const lookRightButton = padButton('Look right', 'Look right (a step each press)', ICONS.lookRight);
  const lookUpButton = padButton('Look up', 'Look up (a step each press)', ICONS.lookUp);
  const lookDownButton = padButton('Look down', 'Look down (a step each press)', ICONS.lookDown);
  const pad = el('div', { class: 'pad', hidden: true },
    el('div', { class: 'pad__group', role: 'group', 'aria-label': 'Steer and paddle' }, boatButtons.map((b) => b.node)),
    el('div', { class: 'pad__group', role: 'group', 'aria-label': 'Look' }, lookLeftButton, lookUpButton, lookAheadButton, lookDownButton, lookRightButton));
  // (the words stand in a span of their own: the span and the ground under it fade, each for itself)
  const realmText = el('span');
  const realmName = el('p', { class: 'realm', 'aria-hidden': 'true' }, realmText);
  const hintText = el('span');
  const hint = el('p', { class: 'hint', 'aria-hidden': 'true' }, hintText);
  const holding = el('div', { class: 'holding', 'aria-hidden': 'true' }, el('span', null, el('i'), el('i'), el('i')));
  const captions = el('div', { class: 'captions' }, realmName, hint, holding);
  const focusFrame = el('div', { class: 'focus-frame', 'aria-hidden': 'true' }, el('i'), el('i'), el('i'), el('i'));
  const stickKnob = el('i');
  const stick = el('div', { class: 'stick', 'aria-hidden': 'true' }, stickKnob);      // where the left thumb rests on a touch screen
  const wayMark = el('div', { class: 'way', 'aria-hidden': 'true', html: ICONS.lookRight });      // the way on, when the rider has turned from it (updateWay)
  const dissolve = el('div', { class: 'dissolve', 'aria-hidden': 'true' });
  // ---- the grounds under the lettering that stands on the picture itself: the title card, the name of a place, a
  //      hint, the waiting dots. A ground works on the picture dot by dot (src/style.css, .ground): it darkens only
  //      what is too bright for pale lettering, or lifts only what is too dark for ink, and leaves the rest of the
  //      picture as it was painted. It can only reach the picture from outside the interface's own layer, so the
  //      grounds lie in a layer of their own, between the picture and the interface, and are laid where the words
  //      are (syncGrounds).
  for (const old of document.querySelectorAll('.grounds')) old.remove();
  const groundsLayer = el('div', { class: 'grounds', 'aria-hidden': 'true' });
  // (a ground is two leaves: one softens the picture behind ink, so that a twig is not taken for a stroke; one sets the limit)
  const ground = (kind) => groundsLayer.appendChild(el('i', { class: 'ground ground--' + kind }, el('b', { class: 'ground__soft' }), el('b', { class: 'ground__cap' })));
  const titleGround = ground('title'), moreGround = ground('more'), keysGround = ground('keys'), nameGround = ground('name'), hintGround = ground('hint'), holdGround = ground('hold');

  // ---- the panel: a short pause menu, and two further views (options, controls) that take its place.
  //      The title card opens those two views by themselves.
  const resumeButton = el('button', { type: 'button', class: 'menu__item menu__item--primary', autofocus: true, text: 'Resume' });
  const optionsButton = el('button', { type: 'button', class: 'menu__item', text: 'Options' });
  const controlsButton = el('button', { type: 'button', class: 'menu__item', text: 'Controls' });
  const restartButton = el('button', { type: 'button', class: 'menu__item menu__item--wide', text: 'Back to the start' });
  const whereName = el('span');
  const where = el('p', { class: 'pause__where', hidden: true }, el('span', { class: 'vh', text: 'You are in: ' }), whereName);
  const menuView = el('div', { class: 'pause__view pause__view--menu' },
    el('h2', { class: 'pause__title', id: 'pause-title', text: 'Paused' }),
    el('p', { class: 'pause__line', id: 'pause-line', text: PAUSE_LINE }),
    el('div', { class: 'menu' }, resumeButton, optionsButton, controlsButton, restartButton),
    where);
  let panelFrom = 'ride';                  // 'ride': the pause panel. 'title': one of its views, opened from the title card
  const subView = (name, body) => {
    const id = 'pause-' + name.toLowerCase();
    const head = el('h2', { class: 'pause__title pause__title--sub', id, tabindex: '-1', text: name });
    const back = el('button', { type: 'button', class: 'menu__item menu__item--out menu__item--back', text: 'Back' });
    back.addEventListener('click', () => { if (panelFrom === 'title') closePanel(); else showView('menu'); });
    const list = el('div', { class: 'pause__body' }, body);        // (it scrolls by itself when the list is longer than the window: fitViews)
    return { node: el('section', { class: 'pause__view pause__view--sub', 'aria-labelledby': id, hidden: true }, head, list, el('div', { class: 'menu' }, back)), head, back, list };
  };
  const optionsView = subView('Options', optionsList), controlsView = subView('Controls', controlsList);
  const panel = el('div', { class: 'pause__panel', 'data-view': 'menu' }, menuView, optionsView.node, controlsView.node);
  const dialog = el('dialog', { class: 'pause', 'aria-modal': 'true', 'aria-labelledby': 'pause-title', 'aria-describedby': 'pause-line' }, panel);
  let viewOpener = null;                   // the menu button that opened the view that is showing
  function showView(name, focus = true) {
    menuView.hidden = name !== 'menu'; optionsView.node.hidden = name !== 'options'; controlsView.node.hidden = name !== 'controls';
    panel.dataset.view = name;
    dialog.setAttribute('aria-labelledby', name === 'menu' ? 'pause-title' : 'pause-' + name);
    if (name === 'menu') dialog.setAttribute('aria-describedby', 'pause-line'); else dialog.removeAttribute('aria-describedby');
    dialog.scrollTop = 0; optionsView.list.scrollTop = 0; controlsView.list.scrollTop = 0;
    fitViews();
    if (!focus) return;
    const target = name === 'menu' ? (viewOpener || resumeButton) : (name === 'options' ? optionsView : controlsView).head;
    target.focus({ preventScroll: true });
  }
  /** A list that scrolls and has nothing in it to tab to (the controls) can be tabbed to itself, so the arrow keys can scroll it. */
  function fitViews() {
    for (const view of [optionsView, controlsView]) {
      const list = view.list, scrolls = dialog.open && !view.node.hidden && list.scrollHeight > list.clientHeight + 1 && !list.querySelector('button, input');
      if (scrolls) { list.tabIndex = 0; list.setAttribute('role', 'group'); list.setAttribute('aria-labelledby', view.head.id); }
      else { list.removeAttribute('tabindex'); list.removeAttribute('role'); list.removeAttribute('aria-labelledby'); }
    }
  }
  window.addEventListener('resize', fitViews);
  function setPanelFrom(from) {            // from the title card the way out of a view is 'Done'; from the pause menu it is 'Back'
    panelFrom = from;
    for (const view of [optionsView, controlsView]) { view.back.textContent = from === 'title' ? 'Done' : 'Back'; view.back.classList.toggle('menu__item--back', from !== 'title'); }
  }
  const openDialog = () => { if (typeof dialog.showModal === 'function') dialog.showModal(); else dialog.setAttribute('open', ''); fitViews(); };
  const shutDialog = () => { if (dialog.open) { if (typeof dialog.close === 'function') dialog.close(); else dialog.removeAttribute('open'); } };
  optionsButton.addEventListener('click', () => { viewOpener = optionsButton; showView('options'); });
  controlsButton.addEventListener('click', () => { viewOpener = controlsButton; showView('controls'); });
  /** From the title card: show the controls or the options, by themselves. */
  function openPanel(view, opener) {
    if (mode !== 'title' || dialog.open) return;
    setPanelFrom('title'); viewOpener = null; returnFocus = opener || beginButton;
    showView(view, false);
    title.classList.add('is-under');       // the card steps back: its letters would show round the panel's edges
    openDialog();
    (view === 'options' ? optionsView : controlsView).head.focus({ preventScroll: true });
  }
  function closePanel() {
    if (!dialog.open) return;
    shutDialog();
    title.classList.remove('is-under');
    const target = returnFocus && returnFocus.isConnected ? returnFocus : beginButton;
    target.focus({ preventScroll: true });
    returnFocus = null;
    readTitleTone();                       // the brightness may have been changed in there
  }
  titleControls.addEventListener('click', () => openPanel('controls', titleControls));
  titleOptions.addEventListener('click', () => openPanel('options', titleOptions));

  const withTitle = !dev || tests.has('title');
  if (withTitle) root.append(description, title);
  else { heading.className = 'vh'; root.append(heading, description); }
  root.append(hud, pad, captions, stick, wayMark, focusFrame, dialog, dissolve, live);
  root.before(groundsLayer);

  // ================================================================================================== options
  function syncOptions() {
    musicSwitch.input.checked = store.music;
    musicVolume.set(Math.round(store.musicVolume * 100));
    soundVolume.set(Math.round(store.soundVolume * 100));
    motionSwitch.input.checked = reduceMotion();
    lookSlider.set(store.sensitivity);
    brightSlider.set(store.brightness);
    captionSwitch.input.checked = store.captions;
    buttonsSwitch.input.checked = store.buttons;
    musicButton.setAttribute('aria-pressed', String(store.music));
  }
  function applySound() {
    audio('setMusicOn', store.music); audio('setMusicVolume', store.musicVolume); audio('setSfxVolume', store.soundVolume);
  }
  function setMusic(on, announce = false) {
    store.music = !!on; save();
    audio('setMusicOn', store.music);
    musicSwitch.input.checked = store.music;
    musicButton.setAttribute('aria-pressed', String(store.music));
    if (announce) { say(store.music ? 'Music on' : 'Music off'); wake(); }
  }
  function applyMotion() {
    const reduce = reduceMotion();
    engine.boat.motion = reduce ? 0.25 : 1;
    engine.reducedMotion = reduce;
    const built = engine.realms && engine.realms.built;
    if (built) for (const inst of built.values()) if (inst.ctx) inst.ctx.reducedMotion = reduce;
    document.documentElement.classList.toggle('motion-reduce', reduce || still);
    document.documentElement.classList.toggle('motion-on', !(reduce || still));
    motionSwitch.input.checked = reduce;
    if (mode === 'title') engine.paused = reduce;          // with less motion, the picture behind the title card is a still
  }
  if (systemMotion && systemMotion.addEventListener) systemMotion.addEventListener('change', () => { if (store.reduceMotion === null) applyMotion(); });

  // ============================================================================================== the corner
  // The two corner buttons are always there and always readable; at rest their marks are quieter. Any pointer
  // movement, touch, key that is not a ride key, or keyboard focus brings them to full strength for a moment.
  let awakeTimer = 0;
  function wake(ms = 3200) {
    hud.classList.add('is-awake');
    clearTimeout(awakeTimer);
    if (!tests.has('awake')) awakeTimer = setTimeout(() => hud.classList.remove('is-awake'), ms);
  }
  let modality = window.matchMedia && window.matchMedia('(hover: none) and (pointer: coarse)').matches ? 'touch' : 'keys';
  // What the rider is holding decides where the words go: on a touch screen the lower corners are under the thumbs
  // (src/style.css, data-hands). It is never changed while words are showing: they would jump.
  function syncHands(now = false) {
    const forced = test('as'), want = forced === 'touch' || forced === 'keys' || forced === 'gamepad' ? forced : modality;
    if (title.isConnected) fillTitleKeys();      // (the title card's line of controls is worded for it too)
    if (root.dataset.hands === want) return;
    if (!now && (realmName.classList.contains('is-on') || hint.classList.contains('is-on') || holding.classList.contains('is-on'))) return;
    root.dataset.hands = want;
    fitCaptions();
  }
  /** Where the words of a caption really are (its lines, not its column); null if it has none. */
  function wordsBox(node) {
    let left = Infinity, right = -Infinity, top = Infinity, bottom = -Infinity;
    const range = document.createRange(), walk = document.createTreeWalker(node, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    for (let n = walk.nextNode(); n; n = walk.nextNode()) {
      let rects = null;
      if (n.nodeType === 3) { if (n.nodeValue.trim() && !n.parentElement.closest('.vh')) { range.selectNodeContents(n); rects = range.getClientRects(); } }
      else if (n.tagName === 'KBD' || n.tagName === 'I' || n.tagName === 'CANVAS') rects = n.getClientRects();      // (a key, a dot, the drawn name)
      if (rects) for (const r of rects) if (r.width > 0) { left = Math.min(left, r.left); right = Math.max(right, r.right); top = Math.min(top, r.top); bottom = Math.max(bottom, r.bottom); }
    }
    return right > left ? { left, right, top, bottom, width: right - left } : null;
  }
  /** The title card's words: the name and the button. (The two quiet words under them have a ground of their own: on an upright screen they stand at the foot of the picture.) */
  function cardBox() {
    const parts = [heading, beginButton].map(wordsBox).filter(Boolean);
    if (!parts.length) return null;
    return { left: Math.min(...parts.map((r) => r.left)), right: Math.max(...parts.map((r) => r.right)), top: Math.min(...parts.map((r) => r.top)), bottom: Math.max(...parts.map((r) => r.bottom)) };
  }
  /** Lay a ground under its words (a box in the window), and show it while they show. */
  function layGround(g, at, on, tone) {
    if (at && at.right > at.left) {
      const o = groundsLayer.getBoundingClientRect();
      g.style.setProperty('--x', (at.left - o.left).toFixed(1) + 'px'); g.style.setProperty('--y', (at.top - o.top).toFixed(1) + 'px');
      g.style.setProperty('--w', (at.right - at.left).toFixed(1) + 'px'); g.style.setProperty('--h', (at.bottom - at.top).toFixed(1) + 'px');
    }
    g.classList.toggle('is-on', !!on && !!at);
    g.dataset.tone = tone === 'day' ? 'day' : 'night';
  }
  /** Every ground where its words are now, and showing if they are. Whatever changes in the interface ends here. */
  function syncGrounds() {
    layGround(nameGround, realmText.firstChild ? wordsBox(realmText) : null, realmName.classList.contains('is-on'), realmName.dataset.tone);
    layGround(hintGround, hintText.firstChild ? wordsBox(hintText) : null, hint.classList.contains('is-on'), hint.dataset.tone);
    layGround(holdGround, wordsBox(holding), holding.classList.contains('is-on'), holding.dataset.tone);
    const up = title.isConnected && !title.classList.contains('is-under') && !title.classList.contains('is-leaving') && !title.classList.contains('is-waiting');
    layGround(titleGround, title.isConnected ? cardBox() : null, up, title.dataset.tone);
    layGround(moreGround, title.isConnected ? wordsBox(titleMore) : null, up, titleMore.dataset.tone);
    layGround(keysGround, title.isConnected && titleKeys.firstChild ? wordsBox(titleKeys) : null, up, titleKeys.dataset.tone);
    drawMarks();                           // (a new tone is a new ink; a new width is a new drawing: nothing is done if neither changed)
  }
  const fitCaptions = syncGrounds;         // (the words have changed, or the window has)
  // (a class, a tone or a hidden part changed anywhere in the interface, or the title card came or went: lay the grounds again)
  new MutationObserver(syncGrounds).observe(root, { subtree: true, attributes: true, attributeFilter: ['class', 'hidden', 'data-tone', 'data-hands'] });
  new MutationObserver(syncGrounds).observe(root, { childList: true });
  title.addEventListener('scroll', syncGrounds, { passive: true });        // (a window too low for the card: it scrolls, and its ground with it)
  if (typeof ResizeObserver === 'function') { const fit = new ResizeObserver(syncGrounds); for (const node of [realmName, hint, holding, titleCard]) fit.observe(node); }   // (a late face, a longer line)
  // the marks are lettered in the ride's own face: drawn again when it has arrived
  if (document.fonts && document.fonts.load) document.fonts.load('500 48px "Cormorant Garamond"').then(() => { for (const m of marks) m.key = ''; drawMarks(); syncGrounds(); }).catch(() => {});

  // The words during the ride take their ink from the picture, once, as they appear: tea-brown ink where the picture
  // behind them is pale (the landing's sky, the snow's: on a touch screen the name and the hint stand up there) and
  // next to nothing in it would have to be lifted for ink to be read (a few bare twigs, not a beam); pale lettering,
  // the ride's own voice, everywhere else. Either way the ground under the words holds whatever drifts behind them afterwards
  // (src/style.css, .ground), so the picture is not looked at again while they show.
  const inkSuits = (seen) => seen.light > CAP_DAY + 0.03 && seen.toLift < 0.02;
  const groundOf = new Map([[realmName, nameGround], [hint, hintGround], [holding, holdGround]]);
  const inkWanted = new Map();
  let inFrame = false;                     // inside the engine's own frame: the picture is looked at when the frame has been drawn
  function chooseInk(fresh) {
    const forced = test('ink');            // &ink=day|night: for photographs
    let looked = false;
    for (const [box, words] of inkWanted) {
      const at = wordsBox(words), seen = at ? readPicture(at, fresh, looked) : null;
      looked = looked || !!seen;
      setCaps(groundOf.get(box), seen);
      if (local) box.dataset.seen = seen ? [seen.light, seen.low, seen.high, seen.toLift, seen.toDim].map((v) => v.toFixed(3)).join(' ') : 'unseen';      // (for the photographs' notes)
      box.dataset.tone = forced === 'day' || forced === 'night' ? forced : (seen && inkSuits(seen) ? 'day' : 'night');
    }
    inkWanted.clear();
    syncGrounds();
  }
  function wantInk(box, words) { inkWanted.set(box, words); if (!inFrame) chooseInk(false); }
  /** Look again for the words that are showing (a photograph: they were put up before the picture had arrived). */
  function reInk() {
    for (const [box, words] of [[realmName, realmText], [hint, hintText], [holding, holding]]) if (box.classList.contains('is-on')) inkWanted.set(box, words);
    chooseInk(false);
  }
  window.addEventListener('resize', fitCaptions);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitCaptions).catch(() => {});
  syncHands(true);
  let lastTab = -1e9;
  window.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse' && e.buttons === 0) wake(); }, { passive: true });
  window.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'touch') { modality = 'touch'; wake(); } else if (e.pointerType === 'mouse') modality = 'keys';
    syncHands();
    unlockOnce();
  }, { passive: true, capture: true });
  window.addEventListener('keydown', (e) => {
    modality = 'keys'; syncHands();
    // a letter key of the ride, pressed while a control other than the picture has focus: it goes no further (LETTER_KEYS).
    // (this listener hears a key on its way down to its target; the engine's hears it on the way back up, and so not at all)
    if (mode === 'ride' && LETTER_KEYS.has(e.code) && !e.metaKey && !e.ctrlKey && !e.altKey && e.target !== canvas && e.target instanceof Element && e.target.closest('button, input, [tabindex]')) { e.stopPropagation(); return; }
    if (e.key === 'Tab') lastTab = performance.now();
    if (!RIDE_KEYS.has(e.code)) wake();
    if (e.key !== 'Tab' && e.key !== 'Shift') unlockOnce();
    if (mode === 'title' && e.key === 'Enter' && (e.target === document.body || e.target === title)) begin();
  }, true);
  hud.addEventListener('focusin', (e) => { if (e.target.matches(':focus-visible')) hud.classList.add('has-focus'); });
  hud.addEventListener('focusout', () => hud.classList.remove('has-focus'));
  // keyboard focus on the picture shows as four small corners, but only when it was reached with Tab
  canvas.addEventListener('focus', () => { if (performance.now() - lastTab < 400) root.classList.add('view-focus'); });
  canvas.addEventListener('blur', () => root.classList.remove('view-focus'));

  // sound may only start from a gesture: 'Push off' unlocks it; without a title card, the first key or click does
  let unlocked = false;
  function unlockOnce() {
    if (unlocked || mode === 'title' || mode === 'boot') return;
    if (navigator.userActivation && !navigator.userActivation.isActive) return;   // not a gesture a browser accepts (Esc, a gamepad): wait for the next
    unlocked = true; openSound();
  }
  function openSound() {                   // the saved choices first, so the sound starts as the rider left it
    soundOpen = true; applySound(); audio('unlock'); applySound();
  }

  musicButton.addEventListener('click', (e) => { setMusic(!store.music, true); if (e.detail > 0) canvas.focus({ preventScroll: true }); });
  pauseButton.addEventListener('click', (e) => pause(e.detail > 0 ? 'pointer' : 'key'));
  beginButton.addEventListener('click', () => begin());
  resumeButton.addEventListener('click', () => resume());
  restartButton.addEventListener('click', () => {
    const q = params.get('q');
    location.assign(location.pathname + (QUALITIES.includes(q) ? '?q=' + q : ''));
  });

  // ==================================================================================================== the pad
  // Buttons for steering and looking, for a pointer that cannot drag (WCAG 2.5.7). They work by press alone.
  // A boat button (steer left, paddle, steer right, back water) acts from the moment it is pressed, by a pointer or
  // by Space or Enter. A press that lasts is a hold: the button acts until it is let go. A press shorter than
  // PAD_TAP_MS is a click, which is all that a pointer that cannot hold can send (a dwell, a switch, a head pointer):
  // it leaves the button on, until it is pressed again or the other button of its pair is (left and right are one
  // pair, paddle and back water the other; one of each pair can be on together, as two keys can be down together).
  // A click that no press came before (assistive technology pressing the button for someone) does the same.
  // A look button turns or tilts the head one step for each press; 'Look ahead' is the ride's own 'centre' (Space).
  // What they hold goes to the engine through input.hold and input.lookStep, where it is added to keys, touch and
  // gamepad; aria-pressed says which are on.
  function padSync() {
    const sum = { throttle: 0, steer: 0 };
    for (const b of boatButtons) {
      const on = !!b.down || b.latched;
      if (on) sum[b.axis] += b.value;
      if (b.node.getAttribute('aria-pressed') !== String(on)) b.node.setAttribute('aria-pressed', String(on));
    }
    if (typeof engine.input.hold === 'function') engine.input.hold(sum);
  }
  function padPress(b, by) {
    if (b.down || mode !== 'ride') return;
    b.down = by; b.since = performance.now(); b.was = b.latched;
    for (const other of boatButtons) if (other !== b && other.axis === b.axis) other.latched = false;
    padSync();
  }
  function padRelease(b, kept = true) {      // kept: the press ended as its maker meant it to (it was not cut off by the window or the browser)
    if (!b.down) return;
    const click = kept && performance.now() - b.since < PAD_TAP_MS;
    b.down = null; b.latched = click && !b.was;
    padSync();
  }
  function padLetGo() {                      // everything off: the buttons are going out of sight
    for (const b of boatButtons) { b.down = null; b.latched = false; }
    padSync();
  }
  for (const b of boatButtons) {
    const node = b.node, pressKey = (e) => e.code === 'Space' || e.code === 'Enter' || e.code === 'NumpadEnter';
    node.addEventListener('pointerdown', (e) => {
      if (e.button > 0 || b.down) return;
      b.pointer = e.pointerId;
      try { node.setPointerCapture(e.pointerId); } catch { /* not capturable */ }      // (the press lasts until the pointer is lifted, wherever it has slid to)
      padPress(b, 'pointer');
    });
    const lift = (e) => { if (b.down === 'pointer' && e.pointerId === b.pointer) { padRelease(b, e.type === 'pointerup'); b.readAt = performance.now(); } };
    node.addEventListener('pointerup', lift); node.addEventListener('pointercancel', lift); node.addEventListener('lostpointercapture', lift);
    node.addEventListener('keydown', (e) => {
      if (!pressKey(e) || e.metaKey || e.ctrlKey || e.altKey) return;
      e.preventDefault();                    // (the key's own click is not wanted: the press is read here, from down to up)
      if (!e.repeat) padPress(b, 'key');
    });
    node.addEventListener('keyup', (e) => {
      if (!pressKey(e)) return;
      e.preventDefault();
      if (b.down === 'key') { padRelease(b); b.readAt = performance.now(); }
    });
    node.addEventListener('blur', () => { if (b.down === 'key') padRelease(b, false); });      // (focus left with the key still down: its keyup will not come here)
    node.addEventListener('click', () => {
      // the click that ends a press has been read already, as that press; a click that no press came before is
      // assistive technology pressing the button for someone, and leaves it on or puts it off
      if (b.down || performance.now() - b.readAt < 400 || mode !== 'ride') return;
      const on = !b.latched;
      for (const other of boatButtons) if (other.axis === b.axis) other.latched = false;
      b.latched = on;
      padSync();
    });
  }
  window.addEventListener('blur', () => { for (const b of boatButtons) if (b.down) padRelease(b, false); });
  pad.addEventListener('mousedown', (e) => e.preventDefault());       // a press by pointer leaves keyboard focus where it was (on the picture: its keys go on working)
  pad.addEventListener('contextmenu', (e) => e.preventDefault());     // (a finger held down is a hold, not a request for a menu)
  function padLook(yaw, pitch) {             // degrees: to the left is positive, and up is
    if (mode !== 'ride' || typeof engine.input.lookStep !== 'function') return;
    const eased = !calm();
    engine.input.lookStep(yaw, pitch, eased);
    if (!eased) { engine.camera.rotation.y = engine.input.lookYaw; engine.camera.rotation.x = engine.input.lookPitch; }      // less motion: the view is simply there, with no turn of the head between
  }
  lookLeftButton.addEventListener('click', () => padLook(PAD_LOOK_STEP, 0));
  lookRightButton.addEventListener('click', () => padLook(-PAD_LOOK_STEP, 0));
  lookUpButton.addEventListener('click', () => padLook(0, PAD_TILT_STEP));
  lookDownButton.addEventListener('click', () => padLook(0, -PAD_TILT_STEP));
  lookAheadButton.addEventListener('click', () => {
    if (mode !== 'ride') return;
    if (calm()) look(0, 0);
    if (engine.input.actions) engine.input.actions.add('centre');
  });
  /** The buttons stand at the foot of the picture during the ride, if they were asked for: not on the title card, not under the panel, not at the ending. */
  function syncPad() {
    const show = !!store.buttons && mode === 'ride' && !endingShown;
    if (show === !pad.hidden) return;
    if (!show) padLetGo();
    pad.hidden = !show;
    root.dataset.pad = show ? 'on' : 'off';
  }

  // ================================================================================================ title card
  // The card takes its ink from the picture behind it: tea-brown ink over a bright picture (the landing in its golden
  // evening), pale lettering over a dark one. Its ground is the one the words of the ride have (titleGround): it
  // changes only what in the picture is too dark for ink (or too bright for pale lettering), dot by dot, so the
  // landing's sky and its clouds stay exactly as they were painted, and a dark post that comes behind a word is
  // turned to mist. The picture is looked at again every few seconds and when the window changes, for the ink and
  // for the colour of the ground.
  const probe = document.createElement('canvas');        // (sized to the picture's own shape when it is read: 120 dots along its longer side)
  const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  const unlin = (v) => Math.round(255 * (v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055));
  const luminance = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  // What a ground brings the picture to (relative luminance), and so what the lettering is sure of whatever the
  // picture: pale lettering (#f4efe6) on anything no lighter than CAP_NIGHT stands at 5.4 to 1, ink (#2a1b14) on
  // anything no darker than CAP_DAY at 5.1 to 1 (AA asks 4.5). Where more contrast is asked for: 10 to 1 and more.
  // (src/style.css has the same four numbers as colours, for when the picture cannot be looked at.)
  const CAP_NIGHT = 0.12, CAP_DAY = 0.27, CAP_NIGHT_MORE = 0.035, CAP_DAY_MORE = 0.62;
  const CAP_TINT = 0.55;                                 // how much of the picture's own hue a ground keeps, where the picture gives it no better guide
  const moreContrast = window.matchMedia ? window.matchMedia('(prefers-contrast: more)') : null;
  const capWant = (day) => { const more = !!(moreContrast && moreContrast.matches); return day ? (more ? CAP_DAY_MORE : CAP_DAY) : (more ? CAP_NIGHT_MORE : CAP_NIGHT); };
  // (for measuring, &flat=white|black|8a7: one flat colour stands in place of the picture, and is what is "seen" here)
  const flat = (() => {
    const f = test('flat');
    if (!f) return null;
    const hex = { white: 'ffffff', black: '000000' }[f] || (/^[0-9a-f]{6}$/i.test(f) ? f : /^[0-9a-f]{3}$/i.test(f) ? f.replace(/./g, '$&$&') : '808080');
    return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
  })();
  /**
   * The part of the picture behind a box on the page: its middle brightness (relative luminance, 0 to 1), its usual
   * colour (the mean of its middle half), how much of it a ground would have to change (toLift for ink, toDim for
   * pale lettering: the mean distance, in luminance, to the side of CAP_DAY or CAP_NIGHT that needs nothing), and
   * the colour each ground should have to leave alone what needs nothing (fitDay, fitNight: see capColour).
   * Null if the picture cannot be read.
   */
  function readPicture(box, fresh = false, again = false) {      // again: the picture was looked at a moment ago, for another box
    try {
      if (flat) { const L = luminance(flat); return { light: L, low: L, high: L, colour: flat, toLift: Math.max(0, CAP_DAY - L), toDim: Math.max(0, L - CAP_NIGHT), fitDay: null, fitNight: null }; }
      const view = canvas.getBoundingClientRect();
      if (!(view.width > 0 && view.height > 0)) return null;
      // (a dot is 12px of a laptop's picture and 7px of an upright phone's)
      const k = 120 / Math.max(view.width, view.height), pw = Math.max(16, Math.round(view.width * k)), ph = Math.max(16, Math.round(view.height * k));
      if (probe.width !== pw || probe.height !== ph) { probe.width = pw; probe.height = ph; again = false; }
      const g = probe.getContext('2d', { willReadFrequently: true });
      g.imageSmoothingQuality = 'high';                  // each dot is the mean of its part of the picture, not one grain of it
      if (!again) {
        if (!fresh) engine.render();                     // the picture can only be read straight after it has been drawn (`fresh`: it just has been)
        g.clearRect(0, 0, probe.width, probe.height);
        g.drawImage(canvas, 0, 0, probe.width, probe.height);
        if (fresh && !g.getImageData(probe.width >> 1, probe.height >> 1, 1, 1).data[3]) return readPicture(box, false);   // nothing there after all: draw it
      }
      const fx = (v) => clamp(Math.round((v - view.left) / view.width * probe.width), 0, probe.width);
      const fy = (v) => clamp(Math.round((v - view.top) / view.height * probe.height), 0, probe.height);
      const x0 = clamp(fx(box.left), 0, probe.width - 1), y0 = clamp(fy(box.top), 0, probe.height - 1);
      const x1 = clamp(fx(box.right), x0 + 1, probe.width), y1 = clamp(fy(box.bottom), y0 + 1, probe.height);
      const px = g.getImageData(x0, y0, x1 - x0, y1 - y0).data, dots = [];
      let toLift = 0, toDim = 0;
      for (let i = 0; i < px.length; i += 4) {
        const L = luminance([px[i], px[i + 1], px[i + 2]]);
        dots.push([px[i], px[i + 1], px[i + 2], L]); toLift += Math.max(0, CAP_DAY - L); toDim += Math.max(0, L - CAP_NIGHT);
      }
      if (!dots.length) return null;
      dots.sort((p, q) => p[3] - q[3]);
      const middle = dots.slice(dots.length >> 2, Math.max((dots.length >> 2) + 1, dots.length - (dots.length >> 2))), mean = (k) => middle.reduce((sum, d) => sum + d[k], 0) / middle.length;
      // A ground works on each of red, green and blue by itself. So that it leaves alone every dot that is already on
      // the right side of it, it takes its colour from those dots: under ink, a colour no channel of which is above
      // theirs (a tenth of them excepted); under pale lettering, one no channel of which is below theirs.
      const fit = (day) => {
        const want = capWant(day), pool = dots.filter((d) => (day ? d[3] >= want : d[3] <= want));
        if (pool.length < 4 || pool.length < dots.length * 0.15) return null;      // too little of the picture is on that side to say
        return [0, 1, 2].map((k) => { const v = pool.map((d) => lin(d[k])).sort((a, b) => a - b); return v[Math.round((day ? 0.1 : 0.9) * (v.length - 1))]; });
      };
      const at = (q) => dots[Math.round(q * (dots.length - 1))][3];
      return { light: at(0.5), low: at(0.1), high: at(0.9), colour: [mean(0), mean(1), mean(2)], toLift: toLift / dots.length, toDim: toDim / dots.length, fitDay: fit(true), fitNight: fit(false) };
    } catch { return null; }
  }
  /**
   * The colour of a ground. Its luminance is what the lettering needs, exactly: that is all the contrast depends
   * on. Its hue is chosen so that the ground is not seen where it is not needed: fitted to the part of the picture
   * that needs nothing (`fitted`, from readPicture), or else the picture's own colour behind the words, part of the
   * way to grey. Tea-brown over the golden landing, plum over the dyers' sunset, slate over snow.
   */
  function capColour(colour, fitted, tone) {
    const day = tone === 'day', want = capWant(day);
    const L = (c) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    const fit = (c) => { const k = want / Math.max(L(c), 1e-4); return c.map((v) => Math.min(1, v * k)); };
    let c = fitted ? fit(fitted.map((v) => Math.max(v, 0.002))) : fit(fit(colour.map((v) => lin(clamp(v, 0, 255)))).map((v) => v * CAP_TINT + want * (1 - CAP_TINT)));
    let out = c.map(unlin);
    // (rounding, or a colour too pure to reach the luminance in its own hue: step until it is on the safe side of it)
    for (let i = 0; i < 255 && (day ? luminance(out) < want : luminance(out) > want); i++) out = out.map((v) => clamp(v + (day ? 1 : -1), 0, 255));
    return out;
  }
  /**
   * Give a ground its two colours from the picture behind its words, and how far the picture is first dimmed under
   * pale lettering: far enough to bring all but its lightest tenth down to the ground's limit, in its own hues and
   * with its own detail (a shadow, where the limit alone would be a flat stain); not at all where the picture is
   * dark already. If the picture could not be looked at, the ground keeps the stylesheet's own colours.
   */
  function setCaps(g, seen) {
    if (!seen) { for (const v of ['--cap-n', '--cap-d', '--dim']) g.style.removeProperty(v); g.dataset.dim = 'off'; return; }
    g.style.setProperty('--cap-n', capColour(seen.colour, seen.fitNight, 'night').join(' ')); g.style.setProperty('--cap-d', capColour(seen.colour, seen.fitDay, 'day').join(' '));
    const limit = capWant(false) * 1.3, dim = seen.high > limit ? clamp((limit / seen.high) ** (1 / 2.2), 0.42, 1) : 1;
    g.style.setProperty('--dim', dim.toFixed(3)); g.dataset.dim = dim < 0.985 ? 'on' : 'off';
  }
  function readTitleTone() {
    if (!title.isConnected || mode !== 'title') return;
    const forced = test('tone'), was = title.dataset.tone, at = cardBox(), below = wordsBox(titleMore);
    const seen = at ? readPicture(at) : null, under = below ? readPicture(below, false, !!seen) : null;
    setCaps(titleGround, seen); setCaps(moreGround, under);
    if (forced === 'day' || forced === 'night') title.dataset.tone = forced;
    else if (seen) title.dataset.tone = seen.light > (was === 'day' ? 0.15 : 0.24) ? 'day' : 'night';      // (a little reluctant to change its mind)
    // could not look: stay as we are (either ink reads over anything on its ground)
    // The two quiet words: the card's ink while they stand with it in the same light, their own where they stand
    // apart (at the foot of an upright screen, over the boat's dark boards).
    const same = title.dataset.tone === 'day' ? 'day' : 'night', dark = under && under.light <= CAP_NIGHT * 1.5, light = under && under.light > CAP_DAY + 0.03;
    titleMore.dataset.tone = forced === 'day' || forced === 'night' ? forced : (same === 'day' && dark ? 'night' : same === 'night' && light && under.toLift < 0.02 ? 'day' : same);
    // the line of controls between them takes its ink from the picture behind it in the same way
    const keysAt = titleKeys.firstChild ? wordsBox(titleKeys) : null, amid = keysAt ? readPicture(keysAt, false, !!(seen || under)) : null;
    setCaps(keysGround, amid);
    titleKeys.dataset.tone = forced === 'day' || forced === 'night' ? forced
      : (same === 'day' && amid && amid.light <= CAP_NIGHT * 1.5 ? 'night' : same === 'night' && amid && amid.light > CAP_DAY + 0.03 && amid.toLift < 0.02 ? 'day' : same);
    syncGrounds();
  }
  window.addEventListener('resize', () => { if (mode === 'title') readTitleTone(); });   // (the engine's own listener came first: the picture is already the new shape)

  let home = null, moved = false;          // where the ride really starts, and whether the boat was moved for the title
  let moored = false;                      // the first realm is a departure: the boat waits at its mooring until 'Push off', and the realm lets it go
  function showTitle() {
    setMode('title');
    engine.input.enabled = false;
    engine.frozen = true;                  // the current does not carry the boat while the card is up
    canvas.inert = true;
    const inst = engine.realms && engine.realms.current, boat = engine.boat;
    if (inst) {
      home = { inst, s: boat.s, d: boat.d, turn: boat.heading - inst.path.at(boat.s).heading, yaw: engine.input.lookYaw, pitch: engine.input.lookPitch };
      const view = inst.def.titleView;
      const veiled = engine.realms.veilAt(inst, boat.s) > 0.35;
      if (TITLE_OVER_SCENE && !dev && (veiled || view)) {
        const L = inst.path.length, veilLength = Math.min(inst.look.veilLength, L * 0.3), v = view || {};
        boat.place(inst.path, clamp(v.s ?? veilLength + 12, 0.5, L - 0.5), v.d ?? 0, rad(v.heading ?? 0));
        look(rad(v.yaw ?? 0), rad(v.pitch ?? TITLE_PITCH));
        moved = true;
        if (inst.def.departure) { moved = false; moored = true; }             // the mooring is where the ride begins: nothing to dissolve
      }
    }
    engine.start();
    try { engine.simulate(0.3, 30); } catch (err) { console.warn(err); }      // let the scene settle before a still is taken of it
    applyMotion();
    beginButton.focus({ preventScroll: true });
    readTitleTone();
    // look again as the picture settles (late textures, the first frames of light), and then every few seconds:
    // the clouds drift behind the words
    let frame = 0;
    const again = () => { if (mode !== 'title') return; frame++; if (frame === 12 || frame === 45 || frame === 150) readTitleTone(); if (frame < 150) requestAnimationFrame(again); };
    requestAnimationFrame(again);
    const watch = setInterval(() => { if (mode !== 'title') clearInterval(watch); else if (!engine.paused && !dialog.open && !document.hidden) readTitleTone(); }, 3000);
    const fonts = document.fonts && document.fonts.load
      ? Promise.all([document.fonts.load('300 1em "Cormorant Garamond"'), document.fonts.load('italic 500 1em "Cormorant Garamond"'), document.fonts.load('500 48px "Cormorant Garamond"')]).catch(() => {})
      : Promise.resolve();
    const lettered = () => Promise.race([fonts, new Promise((r) => setTimeout(r, 1500))]).then(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    if (opening) {
      // The page opened on a still of this very view with the name already on it (index.html, "the opening"). The
      // card waits out of sight until its own name is drawn; then, in one frame, it stands where the opening's card
      // stood (the name does not move, and does not arrive: it is there), its other pieces arrive, and the still
      // lets the living picture through.
      title.classList.add('is-waiting');
      lettered().then(() => {
        const up = mode === 'title';
        if (up) readTitleTone();                                             // (the name is drawn here, in the card's ink)
        title.classList.remove('is-waiting');
        if (up) {
          title.classList.add('is-handed'); setTimeout(() => title.classList.remove('is-handed'), 4000);
          if (!calm()) { title.classList.add('is-arriving'); setTimeout(() => title.classList.remove('is-arriving'), 4000); }
          syncGrounds();
        }
        opening.done(calm() ? 0 : 1600);
      });
      return;
    }
    if (calm()) return;                                                      // no fades: the card is simply there
    dissolve.style.transition = 'none'; dissolve.style.opacity = '1';        // otherwise it comes out of the dark
    const reveal = () => {
      if (mode !== 'title') return;
      readTitleTone();
      title.classList.add('is-arriving'); setTimeout(() => title.classList.remove('is-arriving'), 6000);
      fade(dissolve, '#05060c', 0, 2400);
    };
    lettered().then(reveal);
  }
  function look(yaw, pitch) {
    engine.input.lookYaw = yaw; engine.input.lookPitch = pitch;
    engine.camera.rotation.y = yaw; engine.camera.rotation.x = pitch;
  }
  /** Fade a flat layer to an opacity over ms, then call done. */
  function fade(layer, color, opacity, ms, done) {
    if (calm()) ms = 0;
    layer.style.backgroundColor = color;
    layer.style.transition = ms > 0 ? `opacity ${ms}ms cubic-bezier(.33, 0, .2, 1), background-color ${ms}ms linear` : 'none';
    void layer.offsetWidth;
    layer.style.opacity = String(opacity);
    if (done) { if (ms > 0) setTimeout(done, ms + 40); else done(); }
  }

  /** On a phone the ride takes the whole screen and, where the browser lets a page ask, turns it on its side (a press is needed for either: this is called from 'Push off'). */
  function goWide() {
    if (modality !== 'touch' || !window.screen || Math.min(screen.width, screen.height) > 620 || test('uitest') !== null) return;
    const page = document.documentElement, ask = page.requestFullscreen || page.webkitRequestFullscreen;
    if (!ask || document.fullscreenElement || document.webkitFullscreenElement) return;
    try {
      Promise.resolve(ask.call(page, { navigationUI: 'hide' }))
        .then(() => { const o = screen.orientation; if (o && typeof o.lock === 'function') return o.lock('landscape'); return null; })
        .catch(() => { /* not allowed, or not a phone that can: the ride is the same without it */ });
    } catch { /* an old browser */ }
  }
  function begin() {
    if (mode !== 'title' || dialog.open) return;
    goWide();
    setMode('leaving');
    openSound();                                                               // this is the gesture that lets sound start
    unlocked = !navigator.userActivation || navigator.userActivation.isActive; // (a gamepad button is not one: then the next key or click unlocks it)
    title.classList.add('is-leaving'); title.inert = true;
    const finish = () => {
      heading.className = 'vh'; root.prepend(heading);
      title.remove();
      dissolve.style.opacity = '0';
    };
    engine.paused = false;
    if (moored) {
      // the card fades from over the scene; the realm sends the flame across, slips the rope and lets the boat go
      startRide(true);
      pushedOff = true;
      engine.emit('begin');
      if (calm()) finish(); else setTimeout(finish, 1700);
    } else if (moved && home) {
      // the card and the scene dissolve into the mist the ride begins in; the boat goes back to the start behind it
      const mist = '#' + home.inst.look.veil.getHexString();
      fade(dissolve, mist, 1, 1800, () => {
        engine.boat.place(home.inst.path, home.s, home.d, home.turn);
        look(home.yaw, home.pitch);
        if (typeof home.inst.time === 'number') home.inst.time = 0;            // the realm's own clock starts with the ride, not with the title card
        engine.frozen = false;
        startRide();
        // two frames, so the picture under the layer is already the mist when the layer starts to thin
        if (calm()) finish(); else requestAnimationFrame(() => requestAnimationFrame(() => fade(dissolve, mist, 0, 700, finish)));
      });
    } else {
      engine.frozen = false;
      startRide();
      if (calm()) finish(); else setTimeout(finish, 1700);
    }
  }

  // ================================================================================================== the ride
  // A ride is watched as much as it is steered: a phone left alone would dim and lock in the middle of it. While the
  // ride runs the screen is asked to stay awake (where the browser lets a page ask); paused or hidden, it is let go.
  let screenLock = null;
  async function keepAwake(on) {
    try {
      if (on) {
        if (screenLock || !navigator.wakeLock || document.visibilityState !== 'visible') return;
        const lock = await navigator.wakeLock.request('screen');
        if (mode !== 'ride') { lock.release().catch(() => {}); return; }
        screenLock = lock;
        lock.addEventListener('release', () => { if (screenLock === lock) screenLock = null; });
      } else if (screenLock) { const lock = screenLock; screenLock = null; await lock.release(); }
    } catch { /* not allowed just now (a low battery, a browser that will not): the ride is the same */ }
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden && mode === 'ride') keepAwake(true); });
  const clock = { t: 0 };                  // seconds of ride (it stops while paused)
  function startRide(keepMoored = false) {
    setMode('ride');
    engine.paused = false; if (!keepMoored) engine.frozen = false;
    engine.input.enabled = true;
    canvas.inert = false;
    hud.hidden = false;
    clock.t = 0;
    const active = document.activeElement;
    if (!active || active === document.body || title.contains(active)) canvas.focus({ preventScroll: true });
    queueRealmName(engine.realms && engine.realms.current);
    if (!tests.has('idle')) wake(5200);     // the corner buttons show themselves for a moment, then go quiet
    showLegend();
    keepAwake(true);
  }

  // ---- realm names
  let nameWaiting = null, nameUntil = 0, lastName = '', lastNameAt = -1e9;
  function queueRealmName(inst) {
    const name = inst && inst.def && inst.def.name;
    if (!name || !store.captions) return;
    if (name === lastName && clock.t - lastNameAt < 45) return;               // wandering back and forth across a threshold
    nameWaiting = { name, since: clock.t };
  }
  function showRealmName(name) {
    nameWaiting = null; lastName = name; lastNameAt = clock.t;
    realmText.textContent = name; realmName.classList.add('is-on');
    fitCaptions(); wantInk(realmName, realmText);
    nameUntil = clock.t + 6.5;
    say(name);
  }
  function hideRealmName() { nameWaiting = null; nameUntil = 0; realmName.classList.remove('is-on'); }
  engine.on('realm', (inst) => { if (mode === 'ride' || mode === 'paused') queueRealmName(inst); });

  // ---- hints, for the first minute
  const hintState = { current: null, since: 0, hideAt: 0, leaving: false, forever: false, nextAt: 7, until: 62, shown: new Set(), over: false, steer: 0, paddle: 0, look: 0, yaw: 0, pitch: 0 };
  function learn(id) { if (store.learned[id]) return; store.learned[id] = true; save(); }
  function showHint(id, forever = false) {
    const forced = test('as');
    // (with the buttons for steering and looking switched on, the hints speak of them: whoever switched them on cannot drag)
    const kind = forced && HINTS[id][forced] ? forced : (store.buttons && HINTS[id].buttons ? 'buttons' : (HINTS[id][modality] ? modality : 'keys'));
    const [template, spoken] = HINTS[id][kind];
    hintText.replaceChildren(...phrase(template));
    hint.classList.remove('is-legend'); hint.classList.add('is-on');
    fitCaptions(); wantInk(hint, hintText);
    Object.assign(hintState, { current: id, since: clock.t, hideAt: clock.t + (id === 'drift' ? 9 : 10.5), leaving: false, forever });
    hintState.shown.add(id);
    say(spoken);
  }
  function hideHint() {
    hint.classList.remove('is-on');
    hintState.current = null; hintState.nextAt = clock.t + (store.learned.way ? 3.6 : 1.2);
  }
  /** The whole of the controls in one line (LEGEND), from the moment the ride begins: no one has to ask for them. */
  function showLegend() {
    if (tests.has('hints')) return;
    const kind = legendKind(), [[a, b], spoken] = LEGEND[kind];
    hintText.replaceChildren(el('span', { class: 'legend__half' }, phrase(a)), el('span', { class: 'legend__half' }, phrase(b)));
    hint.classList.add('is-on', 'is-legend');
    fitCaptions(); wantInk(hint, hintText);
    // (a quarter of a minute; nine seconds on a first ride, so that the word about the lanterns comes while the first
    // arch is still ahead: a rider who paddles is under it twenty seconds after pushing off. The same line of controls
    // stands on the title card.)
    Object.assign(hintState, { current: 'controls', since: clock.t, hideAt: clock.t + (store.learned.way ? 15 : 9), leaving: false, forever: false });
    say(spoken);
  }
  function updateHints(dt) {
    const h = hintState, input = engine.input, boat = engine.boat;
    if (h.over && !h.current) return;
    // has the rider done the thing?
    if (Math.abs(input.steer) > 0.25) h.steer += dt;
    if (Math.abs(input.throttle) > 0.25) h.paddle += dt;
    if (input.lastLook < 0.05) h.look += Math.abs(input.lookYaw - h.yaw) + Math.abs(input.lookPitch - h.pitch);
    h.yaw = input.lookYaw; h.pitch = input.lookPitch;
    if (h.steer > 0.5) learn('steer');
    if (h.paddle > 0.5) learn('paddle');
    if (h.look > 0.3) learn('look');
    if (h.current === 'drift' && clock.t - h.since > 4 && boat.idle > 4) learn('drift');
    if (h.current === 'way' && clock.t - h.since > 6.5) learn('way');             // (nothing to do: it has been read)
    if (h.current === 'controls') {
      // the line of controls stays a quarter of a minute, or goes a few seconds after the rider has paddled, steered and looked
      if (clock.t >= h.hideAt || (h.steer > 0.5 && h.paddle > 0.5 && h.look > 0.3 && clock.t - h.since > 5)) hideHint();
      return;
    }
    if (h.current) {
      if (h.forever) return;
      if (store.learned[h.current] && !h.leaving && clock.t - h.since > 1.5) { h.leaving = true; h.hideAt = Math.min(h.hideAt, clock.t + 0.9); }   // a beat, then go
      if (clock.t >= h.hideAt) hideHint();
      return;
    }
    if (clock.t < h.nextAt || engine.realms.veil > 0.9 || endingShown) return;
    if (clock.t > h.until) { h.over = true; return; }
    if (navigator.getGamepads) for (const pad of navigator.getGamepads()) if (pad && pad.connected && pad.axes.some((a) => Math.abs(a) > 0.4)) modality = 'gamepad';
    const next = HINT_ORDER.find((id) => !store.learned[id] && !h.shown.has(id));
    if (!next) { h.over = true; return; }
    showHint(next);
  }

  // ---- waiting in the mist for the next realm: three small lights where a hint would be. Only for a wait that has
  //      become long (four seconds): the area ahead is made ready while the boat is still in this one, the water
  //      stills toward the end if it is not, and the mist itself moves, so a short wait needs no sign. (The client,
  //      9 November: "make the loading to next area feel more natural".)
  let holdFor = 0, holdShown = false;
  function updateHolding(dt) {
    const waiting = !!(engine.realms && engine.realms.holding);
    holdFor = waiting ? holdFor + dt : 0;
    const show = holdFor > 4 || tests.has('hold');
    if (show === holdShown) return;
    holdShown = show;
    if (show) { say('Loading the next waters'); wantInk(holding, holding); }
    holding.classList.toggle('is-on', show);
  }

  // ---- the left thumb's stick on a touch screen: a ring with its knob. While no thumb is down it rests at the lower
  //      left, where a thumb falls, so that the way to move the boat is seen before it is found (the client, 9 November:
  //      "mobile friendly in the best practice way (like joystick mobile)"); it goes to wherever the thumb comes down,
  //      and follows a thumb that slides past its rim (src/engine/input.js).
  let stickOn = false, stickRest = null;
  function updateStick() {
    const t = engine.input.touch, on = !!t && t.id !== null && t.id !== undefined;
    const rest = !on && root.dataset.hands === 'touch' && mode === 'ride' && !endingShown && pad.hidden;
    if (rest !== stickRest) { stickRest = rest; stick.classList.toggle('is-rest', rest); if (rest) { stick.style.transform = ''; stickKnob.style.transform = ''; } }
    if (on !== stickOn) { stickOn = on; stick.classList.toggle('is-on', on); }
    if (!on) return;
    stick.style.transform = `translate(${t.x0}px, ${t.y0}px)`;
    stickKnob.style.transform = `translate(${((t.kx ?? t.steer) * STICK_RADIUS).toFixed(1)}px, ${((t.ky ?? -t.throttle) * STICK_RADIUS).toFixed(1)}px)`;
  }

  // ---- the way on: one small mark at the edge of the picture, on the side the route lies, when the boat AND the
  //      rider's eyes have both been turned from it for a few seconds, or the boat is being taken back the way it came.
  //      (The client, 9 November: "Make it indicate where the user should go better (to move to next area)". The lights
  //      on the water lead the way, src/engine/wayfinder.js; this is for a rider who has their back to them.) It is
  //      never there for a rider who only looks about, or who has stopped to watch.
  const way = { off: 0, back: 0, calm: 0, on: false, side: '', saidAt: -1e9 };
  const wrapAngle = (a) => { a = (a + Math.PI) % (Math.PI * 2); if (a < 0) a += Math.PI * 2; return a - Math.PI; };
  function updateWay(dt) {
    const realms = engine.realms, inst = realms && realms.current, boat = engine.boat;
    let lost = false, found = true, side = way.side;
    if (inst && inst.path && typeof inst.path.at === 'function' && !engine.frozen && !realms.holding && !endingShown && realms.veil < 0.8) {
      const p = inst.path.at(clamp(boat.s, 0, inst.path.length));
      if (p && Number.isFinite(p.tx)) {
        const target = Math.atan2(-p.tx, -p.tz), boatOff = wrapAngle(target - boat.heading), viewOff = wrapAngle(boatOff - (engine.input.lookYaw || 0));
        const along = (boat.vx || 0) * p.tx + (boat.vz || 0) * p.tz;
        way.off = Math.abs(boatOff) > rad(60) && Math.abs(viewOff) > rad(50) ? way.off + dt : Math.max(0, way.off - dt * 2);
        way.back = along < -0.25 ? way.back + dt : Math.max(0, way.back - dt * 2);
        lost = way.off > 3 || way.back > 3.5;
        found = Math.abs(boatOff) < rad(35) && along > -0.05;
        side = Math.abs(viewOff) > rad(140) ? 'behind' : viewOff > 0 ? 'left' : 'right';
      }
    } else { way.off = 0; way.back = 0; }
    way.calm = found ? way.calm + dt : 0;
    // it comes when the rider is lost, and stays until the boat has been pointing along the route again for a moment
    const blocked = !inst || !!engine.frozen || !!realms.holding || endingShown || realms.veil >= 0.8;
    const on = !blocked && (way.on ? way.calm <= 0.6 : lost);
    if (on) { if (wayMark.dataset.side !== side) wayMark.dataset.side = side; way.side = side; }
    if (on === way.on) return;
    way.on = on;
    wayMark.classList.toggle('is-on', on);
    if (on && clock.t - way.saidAt > 20) { way.saidAt = clock.t; say(side === 'behind' ? 'The way on is behind you.' : `The way on is to your ${side}.`); }
    if (!on) { way.off = 0; way.back = 0; }
  }

  // Still held at the mooring after 'Push off' (the flame is crossing to the bow lantern, src/realms/landing/stage.js):
  // no words over that. The name of the place comes when the boat is let go, and the first hint a few seconds later.
  // Should the place never let the boat go (a scene that failed to build), the rider is not left there for good.
  let pushedOff = false, heldFor = 0;
  function updateMooring(dt) {
    if (!engine.frozen) { pushedOff = false; heldFor = 0; return; }
    if (nameWaiting) nameWaiting.since = clock.t;
    hintState.nextAt = Math.max(hintState.nextAt, clock.t + 4.5); hintState.until = clock.t + 62;
    if (!pushedOff) return;
    heldFor += dt;
    if (heldFor > 45) { engine.frozen = false; console.warn('The boat was still held 45 seconds after pushing off: the interface let it go.'); }
  }

  engine.on('update', (dt) => {
    if (mode !== 'ride') return;
    inFrame = true;
    clock.t += dt;
    updateStick();
    syncHands();
    updateMooring(dt);
    if (nameWaiting && !endingShown && ((clock.t - nameWaiting.since > (still ? 0 : 1.2) && engine.realms.veil < 0.9) || clock.t - nameWaiting.since > 12)) showRealmName(nameWaiting.name);
    if (nameUntil && clock.t > nameUntil && !tests.has('name')) { nameUntil = 0; realmName.classList.remove('is-on'); }
    updateHints(dt);
    updateHolding(dt);
    updateWay(dt);
    inFrame = false;
    if (inkWanted.size) queueMicrotask(() => chooseInk(true));      // (after the engine's frame, which draws the picture straight after this)
  });

  // ================================================================================================== the ending
  // The last realm says when the ride is over (ctx.emit('ending')). The picture lifts slowly to pale paper and two
  // quiet choices appear. 'Stay a while' gives the water back; 'Ride again' returns to the mooring at sunset.
  // Nothing else is left on the paper: the name, the hint and the corner buttons go (Esc still works from anywhere,
  // P and M while the picture has focus: its four corners are drawn over the paper then, src/style.css, .focus-frame).
  const againButton = el('button', { type: 'button', class: 'ending__btn', text: 'Ride again' });
  const stayButton = el('button', { type: 'button', class: 'ending__btn', text: 'Stay a while' });
  // (the name is there for the eye, as on the last page of a book: the live region has already said the ride is over)
  const ending = el('section', { class: 'ending', 'aria-label': 'The ride is over', hidden: true }, el('div', { class: 'ending__card' },
    endMark.canvas,
    el('div', { class: 'ending__choices' }, againButton, stayButton)));
  const pushOffAgain = el('button', { type: 'button', class: 'begin moored__btn', text: 'Push off' });
  const mooredBar = el('div', { class: 'moored', hidden: true }, pushOffAgain);
  root.append(ending, mooredBar);
  let endingShown = false;
  // the marks' water moves, slowly, while one of them is on the picture (never with reduced motion, never for a photograph)
  setInterval(() => {
    if (calm() || document.hidden) return;
    const m = mode === 'title' && !title.classList.contains('is-under') ? titleMark : (endingShown && !ending.hidden ? endMark : null);
    if (m) { m.time += 0.08; m.draw(); }
  }, 80);
  engine.on('ending', () => {
    if (endingShown || mode === 'title') return;
    endingShown = true;
    hideRealmName(); if (hintState.current) hideHint(); hud.hidden = true; syncPad();
    ending.hidden = false; ending.classList.remove('is-off', 'is-full');
    if (calm()) ending.classList.add('is-still'); else ending.classList.remove('is-still');
    void ending.offsetWidth; ending.classList.add('is-on');
    endMark.key = ''; endMark.draw();
    say('The ride is over. Ride again, or stay a while.');
    setTimeout(() => { if (endingShown && mode === 'ride') againButton.focus({ preventScroll: true }); }, calm() ? 0 : 8000);
  });
  stayButton.addEventListener('click', () => {
    endingShown = false;
    ending.classList.remove('is-on'); ending.classList.add('is-off');
    setTimeout(() => { ending.hidden = true; }, calm() ? 0 : 2500);
    hud.hidden = false; syncPad(); wake();
    canvas.focus({ preventScroll: true });
    say('Stay as long as you like.');
  });
  againButton.addEventListener('click', () => {
    ending.classList.add('is-full');
    setTimeout(async () => {
      try { await engine.rideAgain(); } catch (err) { console.error(err); location.reload(); return; }
      const inst = engine.realms.current, v = (inst && inst.def.titleView) || {};
      if (inst && inst.def.departure) {                                        // back at the mooring, held until 'Push off'
        engine.frozen = true;
        engine.boat.place(inst.path, clamp(v.s ?? 14, 0.5, inst.path.length - 0.5), v.d ?? 0, rad(v.heading ?? 0));
        look(rad(v.yaw ?? 0), rad(v.pitch ?? 2));
        mooredBar.hidden = false;
      }
      endingShown = false;
      hud.hidden = false; syncPad();
      ending.classList.remove('is-on', 'is-full'); ending.classList.add('is-off');
      setTimeout(() => { ending.hidden = true; if (!mooredBar.hidden) pushOffAgain.focus({ preventScroll: true }); }, calm() ? 0 : 2500);
      say(inst && inst.def.name ? inst.def.name : 'The landing');
    }, calm() ? 0 : 1700);
  });
  pushOffAgain.addEventListener('click', () => { mooredBar.hidden = true; pushedOff = true; engine.emit('begin'); canvas.focus({ preventScroll: true }); showLegend(); });

  // the ride pauses by itself when its tab is hidden
  document.addEventListener('visibilitychange', () => { if (document.hidden && mode === 'ride' && !tests.has('nohide')) pause('hidden'); });

  // ================================================================================================= pausing
  function pause(by = 'key') {
    if (mode !== 'ride') return;
    setMode('paused'); lastToggle = performance.now();
    const active = document.activeElement;
    returnFocus = by === 'pointer' || !active || active === document.body ? canvas : active;
    engine.paused = true; engine.input.enabled = false;
    keepAwake(false);
    audio('setPaused', true);
    hud.classList.remove('is-awake');
    setPanelFrom('ride'); viewOpener = null;
    showView('menu', false);
    const here = engine.realms && engine.realms.current && engine.realms.current.def.name;
    whereName.textContent = here || ''; where.hidden = !here;
    if (typeof dialog.showModal === 'function') dialog.showModal(); else { dialog.setAttribute('open', ''); resumeButton.focus(); }
    startPadWatch();
  }
  function resume() {
    if (mode !== 'paused') return;
    setMode('ride'); lastToggle = performance.now();
    engine.paused = false; engine.input.enabled = true;
    keepAwake(true);
    audio('setPaused', false);
    shutDialog();
    const target = returnFocus && returnFocus.isConnected && !returnFocus.closest('[hidden]') ? returnFocus : canvas;
    target.focus({ preventScroll: true });
    returnFocus = null;
  }
  const leavePanel = () => { if (mode === 'paused') resume(); else closePanel(); };
  engine.on('pause-key', () => {
    if (performance.now() - lastToggle < 250) return;
    if (mode === 'ride') pause('key'); else if (mode === 'paused') resume();
  });
  engine.on('music-key', () => { if (mode === 'ride') setMusic(!store.music, true); });
  dialog.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.code === 'Escape' || e.code === 'KeyP') {                           // handled here, so the engine never sees the same press
      e.preventDefault(); e.stopPropagation();
      if (!e.repeat) leavePanel();
    } else if (e.key === 'Tab') wrapTab(e);
  });
  dialog.addEventListener('cancel', (e) => { e.preventDefault(); leavePanel(); });   // a close request from the browser itself (the back gesture)
  dialog.addEventListener('close', () => { if (mode === 'paused') resume(); });
  dialog.addEventListener('click', (e) => { if (e.target === dialog) leavePanel(); });   // a click on the dimmed picture
  function wrapTab(e) {                    // Tab goes round inside the panel: from the last control back to the first
    const items = [...dialog.querySelectorAll('button, input, summary, [tabindex="0"]')].filter((n) => n.getClientRects().length && !n.disabled);
    if (!items.length) { e.preventDefault(); return; }
    const first = items[0], last = items[items.length - 1], at = document.activeElement;
    if (e.shiftKey && (at === first || !items.includes(at))) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && at === last) { e.preventDefault(); first.focus(); }
  }

  // a gamepad can begin and resume too (the engine reads it during the ride and pauses on Start)
  let padWatching = false;
  function startPadWatch() {
    if (padWatching || !navigator.getGamepads) return;
    padWatching = true;
    let was = null;
    const tick = () => {
      if (mode !== 'title' && mode !== 'paused') { padWatching = false; return; }
      const closing = mode === 'paused' || dialog.open;     // a panel is up: B or Start closes it. No panel (the title card): A or Start begins
      let down = false;
      for (const pad of navigator.getGamepads()) {
        if (!pad || !pad.connected) continue;
        const pressed = (i) => !!(pad.buttons[i] && pad.buttons[i].pressed);
        down = down || pressed(9) || (closing ? pressed(1) : pressed(0));
      }
      if (down && was === false) {
        if (mode === 'title') { if (dialog.open) closePanel(); else begin(); }
        else if (performance.now() - lastToggle > 250) resume();
      }
      was = down;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  // ==================================================================================================== start
  engine.input.sensitivity = store.sensitivity;
  engine.brightness = store.brightness;
  syncOptions();
  if (withTitle) { showTitle(); startPadWatch(); }
  else { applyMotion(); engine.start(); startRide(); if (opening) opening.done(calm() ? 0 : 900); }

  // ---- test switches (see the top of this file)
  if (test('box')) {                         // try the interface in a column this wide
    const w = clamp(+test('box') || 390, 240, window.innerWidth);
    const fit = () => { engine.opts.size = [w, window.innerHeight]; engine.resize(); };
    fit(); window.addEventListener('resize', fit);         // (a headless window settles on its height a moment after the page starts)
    for (const node of [root, dialog, groundsLayer]) { node.style.width = w + 'px'; node.style.right = 'auto'; }
    syncGrounds();
  }
  if (test('zoom')) document.documentElement.style.fontSize = clamp(+test('zoom') || 1, 0.5, 4) * 100 + '%';
  if (tests.has('spacing')) {                // a reader's own text spacing (WCAG 1.4.12): nothing may be cut off or lost under it
    document.head.append(el('style', { text: '#ui *, .noscript * { line-height: 1.5 !important; letter-spacing: .12em !important; word-spacing: .16em !important; } #ui p { margin-bottom: 2em !important; }' }));
    syncGrounds();
  }
  if (flat) {                                // one flat colour in place of the picture
    canvas.style.opacity = '0'; document.documentElement.style.background = document.body.style.background = `rgb(${flat.join(' ')})`;
  }
  if (tests.has('ghost')) root.classList.add('ghost');
  if (tests.size) {
    if (tests.has('begin') && mode === 'title') begin();
    for (const code of (test('keys') || '').split(',')) if (code) engine.input.keys.add(code);
    if (test('sim')) { try { engine.simulate(clamp(+test('sim') || 0, 0, 120), 30); } catch (err) { console.warn(err); } }
    if (tests.has('awake')) wake();
    if (tests.has('quality')) qualityInputs[qualityNow === 'low' ? 1 : 0].click();
    if (mode === 'title') {
      if (tests.has('options')) openPanel('options', titleOptions);
      else if (tests.has('controls')) openPanel('controls', titleControls);
    }
    if (mode === 'ride') {
      if (tests.has('name')) { const inst = engine.realms && engine.realms.current; if (inst && inst.def.name) showRealmName(inst.def.name); }
      if (tests.has('hints')) showHint(HINT_ORDER.includes(test('hint')) ? test('hint') : 'steer', true);
      if (tests.has('hold')) updateHolding(0);
      if (tests.has('stick')) { Object.assign(engine.input.touch, { id: -1, x0: 96, y0: window.innerHeight - 190, steer: 0.55, throttle: 0.8 }); updateStick(); }
      if (tests.has('pressed')) { boatButtons[0].latched = true; boatButtons[1].latched = true; padSync(); }      // 'Steer left' and 'Paddle' held on
      if (tests.has('ending')) engine.emit('ending');
      if (tests.has('moored')) mooredBar.hidden = false;
      if (tests.has('pause') || tests.has('options') || tests.has('controls')) {
        pause('key');
        if (tests.has('options')) optionsButton.click();
        if (tests.has('controls')) controlsButton.click();
        if (tests.has('resume')) resume();
      }
    }
    if (tests.has('debug')) {                // a line of state in the corner, for reading photographs
      const pre = el('pre', { style: 'position:absolute;left:8px;top:8px;margin:0;padding:4px 8px;font:12px/1.4 ui-monospace,monospace;color:#fff;background:rgba(0,0,0,.85);white-space:pre-wrap;max-width:80vw' });
      const errors = [];
      window.addEventListener('error', (e) => errors.push('error: ' + e.message));
      window.addEventListener('unhandledrejection', (e) => errors.push('rejection: ' + ((e.reason && e.reason.message) || e.reason)));
      const paintDebug = () => {
        const a = document.activeElement;
        pre.textContent = `mode ${mode}  ride clock ${clock.t.toFixed(1)}  s ${engine.boat.s.toFixed(1)}  veil ${engine.realms.veil.toFixed(2)}  paused ${engine.paused}  frozen ${!!engine.frozen}  input ${engine.input.enabled}`
          + `  focus ${a ? a.tagName.toLowerCase() + (a.className ? '.' + String(a.className).split(' ')[0] : '') + (a.matches(':focus-visible') ? ' (visible)' : '') : 'none'}`
          + `  motion ${engine.boat.motion}  tone ${title.isConnected ? title.dataset.tone : '-'}  live "${live.textContent}"` + (errors.length ? '\n' + errors.join('\n') : '');
        requestAnimationFrame(paintDebug);
      };
      (dialog.open ? dialog : root).append(pre);
      paintDebug();
    }
  }
  {
    const focusOn = { begin: beginButton, options: titleOptions, controls: titleControls, music: musicButton, pause: pauseButton, resume: resumeButton, restart: restartButton,
      back: dialog.querySelector('.pause__view:not([hidden]) .menu__item:last-child'), switch: motionSwitch.input, slider: musicVolume.input, choice: qualityInputs[0], view: canvas,
      menuoptions: optionsButton, menucontrols: controlsButton, apply: qualityApply, again: againButton, stay: stayButton, pushoff: pushOffAgain,
      steerleft: boatButtons[0].node, paddle: boatButtons[1].node, steerright: boatButtons[2].node, backwater: boatButtons[3].node, lookleft: lookLeftButton, lookahead: lookAheadButton, lookright: lookRightButton, lookup: lookUpButton, lookdown: lookDownButton,
      list: dialog.querySelector('.pause__view:not([hidden]) .pause__body[tabindex]') }[test('focus')];      // (the list of controls, where the window is too low for it and it scrolls)
    const put = () => { focusOn.focus(); if (focusOn === canvas) root.classList.add('view-focus'); if (hud.contains(focusOn)) hud.classList.add('has-focus'); };
    if (focusOn) { if (tests.has('ending')) setTimeout(put, 30); else put(); }      // (the ending puts focus on 'Ride again' a moment after it appears: after that)
  }
  if (test('run') && test('out')) runScript(test('run'), test('out'));

  /**
   * Where every piece of lettering and every control on the page is, with its colours: with a photograph of the
   * same page that is all a contrast measurement needs. Posted to the dev server as .shots/<name>.
   */
  function postBoxes(name) {
    // (a ghost photograph has no lettering to read colours from: the ghost is lifted while the boxes are read and put
    //  back before anything is painted, so one photograph gives both the grounds and what stands on them)
    const ghost = root.classList.contains('ghost');
    if (ghost) root.classList.remove('ghost');
    try { return sendBoxes(name); } finally { if (ghost) root.classList.add('ghost'); }
  }
  function sendBoxes(name) {
    // in the picture: not display:none, not hidden, and not scrolled out of sight inside a list that scrolls
    const inSight = (n) => {
      const r = n.getBoundingClientRect ? n.getBoundingClientRect() : null;
      if (!r) return true;
      for (let p = n.parentElement; p && p !== document.body; p = p.parentElement) {
        const cs = getComputedStyle(p);
        if (!/auto|scroll|hidden|clip/.test(cs.overflowY + cs.overflowX)) continue;
        const c = p.getBoundingClientRect(), thins = (cs.maskImage || cs.webkitMaskImage || 'none') !== 'none';      // (a list that thins away at its two edges: what is passing through the thinning is not counted)
        if (r.bottom - 4 < c.top || r.top + 4 > c.bottom || r.right - 4 < c.left || r.left + 4 > c.right) return false;
        if (thins && (r.top < c.top + 12 || r.bottom > c.bottom - 20)) return false;
      }
      return true;
    };
    const shown = (n) => { for (let p = n; p && p.nodeType === 1; p = p.parentElement) { const cs = getComputedStyle(p); if (cs.display === 'none' || cs.visibility === 'hidden') return false; } return inSight(n); };
    const alpha = (n) => { let a = 1; for (let p = n; p && p.nodeType === 1; p = p.parentElement) a *= +getComputedStyle(p).opacity; return +a.toFixed(3); };
    const path = (n) => { const out = []; for (let p = n; p && p !== root && out.length < 4; p = p.parentElement) out.unshift(p.tagName.toLowerCase() + (p.className && typeof p.className === 'string' ? '.' + p.className.trim().split(/\s+/).join('.') : '')); return out.join(' > '); };
    const rect = (r) => ({ x: +r.left.toFixed(1), y: +r.top.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1) });
    const boxes = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let t = walker.nextNode(); t; t = walker.nextNode()) {
      const p = t.parentElement;
      if (!t.nodeValue.trim() || !p || p.closest('.vh, pre, noscript') || !shown(p)) continue;
      const range = document.createRange(); range.selectNodeContents(t);
      const cs = getComputedStyle(p);
      for (const r of range.getClientRects()) if (r.width > 1 && r.height > 1) boxes.push({ kind: 'text', text: t.nodeValue.trim().slice(0, 60), where: path(p), ...rect(r), color: cs.color, size: parseFloat(cs.fontSize), weight: +cs.fontWeight || 400, italic: cs.fontStyle === 'italic', alpha: alpha(p) });
    }
    for (const n of root.querySelectorAll('button, input, kbd, svg, .choice__item span, .holding i, .title__more i')) {
      if (!shown(n) || n.closest('pre')) continue;
      const cs = getComputedStyle(n), r = n.getBoundingClientRect();
      if (!(r.width > 0 && r.height > 0)) continue;
      boxes.push({ kind: n.matches('svg, i') ? 'mark' : 'control', what: n.tagName.toLowerCase() + (n.type ? '.' + n.type : ''), label: (n.getAttribute('aria-label') || n.textContent || n.id || '').trim().slice(0, 40), where: path(n), ...rect(r),
        color: cs.color, border: cs.borderTopColor, borderWidth: parseFloat(cs.borderTopWidth) || 0, background: cs.backgroundColor, stroke: cs.stroke, alpha: alpha(n), focused: n === document.activeElement || undefined });
    }
    const seen = { name: realmName.dataset.tone + ' ' + realmName.dataset.seen, hint: hint.dataset.tone + ' ' + hint.dataset.seen, hold: holding.dataset.tone + ' ' + holding.dataset.seen };
    // What a keyboard and a screen reader are given: every control Tab can reach, in the order it reaches them (no
    // tabindex on the page is above 0, so that is the order of the page; while the panel is open, only what is in
    // it), each with its role, its name, its description and its state; then the picture, the panel, the headings
    // and what was last said aloud. (The names are worked out here by the rules that apply to these controls:
    // aria-labelledby, aria-label, a label, the contents. No screen reader has been listened to.)
    const drawn = (n) => { for (let p = n; p && p.nodeType === 1; p = p.parentElement) { const cs = getComputedStyle(p); if (cs.display === 'none' || cs.visibility === 'hidden') return false; } return true; };
    const words = (ids) => (ids || '').split(/\s+/).map((id) => { const n = id && document.getElementById(id); return n ? n.textContent.trim().replace(/\s+/g, ' ') : ''; }).filter(Boolean).join(' ');
    const nameOf = (n) => words(n.getAttribute('aria-labelledby')) || n.getAttribute('aria-label') || (n.labels && n.labels.length ? [...n.labels].map((l) => l.textContent.trim()).join(' ') : '') || n.textContent.trim().replace(/\s+/g, ' ');
    const roleOf = (n) => n.getAttribute('role') || (n.tagName === 'INPUT' ? ({ checkbox: 'checkbox', radio: 'radio', range: 'slider' }[n.type] || n.type) : n.tagName.toLowerCase());
    const told = (n) => {
      const r = n.getBoundingClientRect(), state = {};
      for (const a of ['aria-pressed', 'aria-haspopup', 'aria-keyshortcuts', 'aria-valuetext', 'aria-modal']) if (n.hasAttribute(a)) state[a.slice(5)] = n.getAttribute(a);
      if (n.tagName === 'INPUT' && n.type !== 'range') state.checked = n.checked;
      if (n.tagName === 'INPUT' && n.type === 'range') state.value = n.value;
      return { role: roleOf(n), name: nameOf(n), description: words(n.getAttribute('aria-describedby')) || n.getAttribute('title') || undefined, state, size: [Math.round(r.width), Math.round(r.height)], focused: n === document.activeElement || undefined };
    };
    const reach = [...document.querySelectorAll('canvas, button, input, [tabindex]')].filter((n) => n.tabIndex >= 0 && !n.disabled && !n.closest('[inert]') && drawn(n) && (!dialog.open || dialog.contains(n))).map(told);
    const heard = {
      lang: document.documentElement.lang, title: document.title, picture: { ...told(canvas), inert: !!canvas.inert }, panel: dialog.open ? told(dialog) : null,
      headings: [...document.querySelectorAll('h1, h2, h3')].filter((h) => drawn(h) && !h.closest('noscript')).map((h) => h.tagName.toLowerCase() + ' ' + h.textContent.trim()),
      regions: [...document.querySelectorAll('section, [role="group"], [role="radiogroup"], [role="status"]')].filter(drawn).map((n) => roleOf(n) + ' "' + nameOf(n).slice(0, 60) + '"'),
      said: live.textContent, focus: document.activeElement ? roleOf(document.activeElement) + ' "' + nameOf(document.activeElement).slice(0, 40) + '"' : null,
    };
    const body = JSON.stringify({ seen, url: location.search, size: [root.clientWidth, root.clientHeight], window: [window.innerWidth, window.innerHeight], mode, tone: title.isConnected ? title.dataset.tone : null, reach, heard, boxes }, null, 1);
    return fetch('/__shot/' + name, { method: 'POST', body, keepalive: true }).catch(() => {});
  }
  // (a headless window takes its last size only as the photograph is taken: the boxes are posted again then)
  if (test('boxes')) window.addEventListener('resize', () => { readTitleTone(); reInk(); postBoxes(test('boxes')); });

  // A photograph (tools/pageshot.py): index.html holds the headless browser's clock while the area is being built.
  // When the faces, the shared brush texture and a few frames of the picture have arrived, let it run out: the
  // photograph is taken then. (&uitest=fades keeps the clock in step with the frames for the whole of --wait.)
  if (still) {
    const held = window.__clockHeld;                          // (the stub needs no holding: nothing in it waits for anything but the network)
    if (engine.realms) engine.realms.lookAhead = false;      // a still does not build the next area behind the picture (as in tools/shot.py)
    const frames = (n) => (held ? new Promise((done) => { const tick = () => (--n > 0 ? requestAnimationFrame(tick) : done()); requestAnimationFrame(tick); }) : null);
    Promise.all([
      document.fonts ? document.fonts.ready : null,
      held ? engine.loadTexture('art/shared/drybrush.webp', { repeat: true }).then((t) => engine.releaseTexture(t)) : null,
    ]).catch(() => {}).then(() => frames(10)).then(() => { readTitleTone(); reInk(); return frames(3); })
      .then(() => (test('boxes') ? postBoxes(test('boxes')) : null)).catch(() => {})
      .then(() => { if (held) held.release(); });
  } else if (test('boxes')) setTimeout(() => postBoxes(test('boxes')), 2500);

  /**
   * Play a little script in real time and send what happened to the dev server, so fades and key handling can be
   * checked without a person:   python3 tools/shot.py "/?run=wait:3000,snap,click:begin,wait:4000,snap&out=x.json" x.json
   * Steps: wait:<ms>, snap[:label], click:<begin|music|pause|resume|options|controls|back|motion|titleoptions|titlecontrols|again|stay|pushoff>,
   * focus:<view or any of those>, key:<code>[@view] (a key press on the picture, or on whatever has focus), call:<pause|resume|ending>.
   * (`keys` in a snap: the keys that have reached the engine so far. The stub notes them where the engine listens.)
   * For the buttons for steering and looking: click:<buttons (the option's switch)|steerleft|paddle|steerright|backwater|lookleft|lookup|lookahead|lookdown|lookright>
   * (a click that no press came before, as assistive technology sends it); down:<button> and up:<button> (a pointer pressed
   * and lifted: a hold, with a wait between them); tap:<button> (down, up and click at once: a dwell click); keydown:<code>[@view]
   * and keyup:<code>[@view] (a key held); ptr:<mouse|touch>.<down|move|up>.<x>.<y> (a pointer on the picture itself: a drag, a thumb);
   * place:<s> (the boat on the centre line there, facing along it, looking ahead); sim:<seconds> (the ride run that long at 60
   * steps a second, at once: steps with no wait between them are played inside one frame, so the numbers are the same every time).
   * A snap also says where the boat points and how fast it goes, where the rider looks, what the input holds, which buttons
   * show and are on, and what Tab reaches, in order.
   */
  async function runScript(script, out) {
    const t0 = performance.now(), log = [];
    // (the longest wait between two frames since the last snap: what a rider would feel as a stutter or a stop)
    let lastFrame = performance.now(), worstGap = 0;
    const eachFrame = (t) => { worstGap = Math.max(worstGap, t - lastFrame); lastFrame = t; requestAnimationFrame(eachFrame); };
    requestAnimationFrame(eachFrame);
    const targets = { begin: beginButton, music: musicButton, pause: pauseButton, resume: resumeButton, options: optionsButton, controls: controlsButton, motion: motionSwitch.input,
      titleoptions: titleOptions, titlecontrols: titleControls, summary: titleOptions, again: againButton, stay: stayButton, pushoff: pushOffAgain,
      buttons: buttonsSwitch.input, steerleft: boatButtons[0].node, paddle: boatButtons[1].node, steerright: boatButtons[2].node, backwater: boatButtons[3].node,
      lookleft: lookLeftButton, lookahead: lookAheadButton, lookright: lookRightButton, lookup: lookUpButton, lookdown: lookDownButton };
    const name = (n) => (n ? n.tagName.toLowerCase() + (n.className ? '.' + String(n.className).split(' ')[0] : '') : null);
    const seen = (n) => +(+getComputedStyle(n).opacity).toFixed(2);
    const deg = (r) => +((+r || 0) * 180 / Math.PI).toFixed(2), fix = (v, n = 3) => +(+v || 0).toFixed(n);
    // what Tab reaches, in the order it reaches it (the order of the page: no tabindex here is above 0)
    const tabOrder = () => [...document.querySelectorAll('canvas, button, input, [tabindex]')]
      .filter((n) => n.tabIndex >= 0 && !n.disabled && !n.closest('[inert]') && n.getClientRects().length && getComputedStyle(n).visibility !== 'hidden' && (!dialog.open || dialog.contains(n)))
      .map((n) => (n === canvas ? 'the picture' : (n.getAttribute('aria-label') || (n.labels && n.labels[0] ? n.labels[0].textContent : n.textContent) || n.tagName).trim().replace(/\s+/g, ' '))).join(' | ');
    const pointer = (type, more) => new PointerEvent(type, { pointerId: 7, pointerType: 'mouse', isPrimary: true, button: 0, buttons: type === 'pointerup' ? 0 : 1, bubbles: true, cancelable: true, ...more });
    const snap = (label) => log.push({
      label, ms: Math.round(performance.now() - t0), mode, clock: +clock.t.toFixed(2), s: +engine.boat.s.toFixed(1), veil: +engine.realms.veil.toFixed(2),
      paused: engine.paused, frozen: !!engine.frozen, input: engine.input.enabled, motion: engine.boat.motion, focus: name(document.activeElement),
      title: title.isConnected ? seen(beginButton) : 'gone', name1: title.isConnected ? seen(heading) : null, tone: title.isConnected ? title.dataset.tone : null,
      dissolve: seen(dissolve), hud: hud.hidden ? 'hidden' : seen(musicButton.querySelector('svg')),
      realm: realmName.classList.contains('is-on') ? realmText.textContent : '', realmOpacity: seen(realmText),
      hint: hint.classList.contains('is-on') ? hintText.textContent : '', dialog: dialog.open, view: panel.dataset.view, panelFrom, panelOpacity: seen(panel),
      ending: ending.hidden ? 'hidden' : seen(ending), moored: !mooredBar.hidden,
      area: engine.realms.current ? engine.realms.current.id : '', ahead: (() => { const r = engine.realms, n = r.built && r.neighbour ? r.built.get(r.neighbour(1)) : null; return n ? (n.warmed ? 'ready' : 'built') : (r.building && r.building.size ? 'building' : 'none'); })(),
      holding: !!engine.realms.holding, speed: fix(engine.boat.speed, 2), frame: fix(engine.perf ? engine.perf.ms : 0, 1), worstGap: (() => { const w = Math.round(worstGap); worstGap = 0; return w; })(),
      going: fix(engine.boat.going ?? -1, 2), stuckFor: fix(engine.boat.stuck || 0, 1), helped: !!engine.boat.helped, bumped: fix(engine.boat.bumped || 0, 2),
      way: wayMark.classList.contains('is-on') ? wayMark.dataset.side : '', stick: stick.classList.contains('is-on') ? 'thumb' : stick.classList.contains('is-rest') ? 'rest' : '',
      hold: holding.classList.contains('is-on'),
      music: store.music, live: live.textContent, h1: document.querySelectorAll('h1').length, canvasInert: !!canvas.inert,
      keys: [...engine.input.keys].join(' '),
      fired: (() => { const g = engine.audio && engine.audio.graph, f = g && g.fired; return f ? Object.entries(f).map(([k, v]) => `${k} ${v[0]} (${(v[1] / v[0]).toFixed(2)})`).join(', ') : ''; })(),
      layers: (() => { try { const d = engine.audio && engine.audio.debug ? engine.audio.debug() : null; return d && d.layers ? Object.entries(d.layers).filter(([, v]) => v > 0.001).map(([k, v]) => `${k} ${(+v).toFixed(2)}`).join(', ') : ''; } catch (e) { return ''; } })(),
      quality: engine.quality.level, query: location.search, learned: Object.keys(store.learned).join(' '), captions: store.captions,
      animations: document.getAnimations ? document.getAnimations().length : -1,
      heading: deg(engine.boat.heading), u: fix(engine.boat.u), d: fix(engine.boat.d, 2), sFine: fix(engine.boat.s),
      yaw: deg(engine.input.lookYaw), pitch: deg(engine.input.lookPitch), cam: deg(engine.camera.rotation.y),
      throttle: fix(engine.input.throttle, 2), steer: fix(engine.input.steer, 2), held: engine.input.held ? `${engine.input.held.throttle} ${engine.input.held.steer}` : 'none',
      pad: pad.hidden ? 'hidden' : pad.querySelectorAll('button').length + ' buttons',
      // (how many of them a pointer at their middle really meets: nothing lies over them)
      padMet: pad.hidden ? null : [...pad.querySelectorAll('button')].filter((n) => { const r = n.getBoundingClientRect(), at = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return at && n.contains(at); }).length,
      pressed: boatButtons.filter((b) => b.node.getAttribute('aria-pressed') === 'true').map((b) => b.name).join(' + '),
      buttonsOption: store.buttons, buttonsSaved: (() => { try { return JSON.parse(localStorage.getItem(STORE_KEY) || '{}').buttons; } catch { return 'unreadable'; } })(), tab: tabOrder(),
      audio: engine.audio ? `${engine.audio.unlocked ? (engine.audio.running ? 'running' : 'unlocked') : 'locked'} music ${engine.audio.musicOn} ${engine.audio.musicVolume} sfx ${engine.audio.sfxVolume} paused ${engine.audio.paused}` : 'none',
    });
    try {
      for (const step of script.split(',')) {
        const [op, arg = ''] = step.split(':');
        if (op === 'wait') await new Promise((r) => setTimeout(r, +arg || 0));
        else if (op === 'snap') snap(arg || String(log.length));
        else if (op === 'click') (arg === 'back' ? dialog.querySelector('.pause__view:not([hidden]) .menu__item:last-child') : targets[arg]).click();
        else if (op === 'call') ({ pause, resume, ending: () => engine.emit('ending') })[arg]();
        else if (op === 'focus') (arg === 'view' ? canvas : targets[arg]).focus();
        else if (op === 'key') {
          const [code, at] = arg.split('@'), target = at === 'view' ? canvas : (document.activeElement || document.body);
          const key = code.startsWith('Key') ? code.slice(3).toLowerCase() : code;
          for (const type of ['keydown', 'keyup']) target.dispatchEvent(new KeyboardEvent(type, { code, key, bubbles: true, cancelable: true }));
        }
        else if (op === 'keydown' || op === 'keyup') {
          const [code, at] = arg.split('@'), target = at === 'view' ? canvas : (document.activeElement || document.body);
          target.dispatchEvent(new KeyboardEvent(op, { code, key: code === 'Space' ? ' ' : code.startsWith('Key') ? code.slice(3).toLowerCase() : code, bubbles: true, cancelable: true }));
        }
        else if (op === 'down') targets[arg].dispatchEvent(pointer('pointerdown'));
        else if (op === 'up') targets[arg].dispatchEvent(pointer('pointerup'));
        else if (op === 'tap') { for (const type of ['pointerdown', 'pointerup']) targets[arg].dispatchEvent(pointer(type)); targets[arg].dispatchEvent(new MouseEvent('click', { detail: 1, bubbles: true, cancelable: true })); }
        else if (op === 'ptr') {
          const [type, phase, x, y] = arg.split('.');
          canvas.dispatchEvent(pointer('pointer' + phase, { pointerId: type === 'touch' ? 21 : 1, pointerType: type, clientX: +x, clientY: +y }));
        }
        else if (op === 'pic') {               // the picture as it is now, to .shots/<arg>.jpg (the frame is drawn and read in one go)
          engine.render();
          const blob = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', 0.9));
          if (blob) await fetch('/__shot/' + (arg || 'run') + '.jpg', { method: 'POST', body: blob });
        }
        else if (op === 'place') { const inst = engine.realms.current; engine.boat.place(inst.path, clamp(+arg || 20, 0.5, inst.path.length - 0.5), 0, 0); look(0, 0); }
        else if (op === 'sim') engine.simulate(clamp(+arg || 0, 0, 30), 60);
      }
    } catch (err) { log.push({ error: String(err && err.stack || err) }); }
    await fetch('/__shot/' + out, { method: 'POST', body: JSON.stringify(log, null, 1) });
  }

  const api = { begin, pause, resume, setMusic, get mode() { return mode; }, options: store };
  engine.ui = api;
  return api;
}
