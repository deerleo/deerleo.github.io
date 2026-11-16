'use strict';
// ───────── arranque ─────────
const game = { step, tap, press, release,
  async until(f, max = 3000) { let n = 0; while (!f() && n++ < max) await step(1); return n; },
  async menu(max) { return this.until(() => ui.length > 1 && !waits.some(w => w.n), max); },
  async go(dir, n = 1) { const b = ['down', 'up', 'left', 'right'][dir]; for (let i = 0; i < n; i++) { const x = world.pl.x, y = world.pl.y, m = G.map; press(b); await this.until(() => busy || G.map !== m || ((world.pl.x !== x || world.pl.y !== y) && !world.pl.moving), 50); } release(b); await step(2); },
  async auto(n) { for (let i = 0; i < n; i++) { if (dlg.arrow || (ui.length > 1 && i % 24 === 0)) await tap('a'); else await step(1); } },
  async toMenu(max = 5000) { let n = 0; while (ui.length <= 1 && n++ < max) { if (dlg.arrow) await tap('a'); else await step(1); } await step(3); return n; },
  async toWorld(max = 8000) { let n = 0; while ((scene !== world || busy) && n++ < max) { if (dlg.arrow || n % 50 === 49) await tap('a'); else await step(1); } return n; },
  async dlgHas(s, max) { return this.until(() => dlg.on && dlg.lines.join(' ').includes(s), max); },
  get state() { return { scene: scene === world ? 'world' : scene === B ? 'battle' : scene === title ? 'title' : 'other', busy, map: G && G.map, x: world.pl.x, y: world.pl.y, dlg: dlg.on ? dlg.lines.join(' | ') : '', ui: ui.length, party: G && G.party.map(m => `${m.sp} nv${m.lv} ${m.hp}/${m.max}`), bag: G && G.bag, flags: G && G.flags, en: B.en && `${B.en.sp} nv${B.en.lv} ${B.en.hp}/${B.en.max}` }; },
  // atajo de pruebas: empezar ya en el mundo
  warp(o = {}) { G = fixSave(newGame()); G.name = 'NIA'; if (o.starter) { G.party.push(makeMon(o.starter, o.lv || 5)); G.flags.starter = o.starter; G.flags.rivalSp = STARTERS[(STARTERS.indexOf(o.starter) + 1) % 3]; G.flags.rival1 = 1; G.seen[o.starter] = G.got[o.starter] = 1; G.bag = { celda: 5, aceite: 2 }; } Object.assign(G.flags, o.flags || {}); waits.length = 0; uiClear(); dlgOff(); busy = 0; scr.fade = 0; scene = world; world.load(o.map || 'pueblo', o.x ?? 5, o.y ?? 34, o.dir || 0); },
  battle(sp, lv) { return runBattle({ wild: makeMon(sp, lv) }); },
  // pruebas: avanza diálogos hasta entrar en combate y lo gana dejando al rival a 1 PS
  async win(max = 200) { for (let i = 0; i < max && scene !== B; i++) await this.auto(20); for (let i = 0; i < 300 && scene === B; i++) { if (B.en && B.en.hp > 1) { B.en.hp = 1; B.dhp.en = 1; } for (const m of G.party) if (m.hp < 5) m.hp = m.max; await this.auto(30); } },
  async talkTo(dir) { world.pl.dir = dir; await this.tap('a'); },
};
window.game = game;
if (window.OPT && OPT.mute) muted = true;
const im = new Image();
im.onload = () => {
  MONIMG = im; cutMons(); makeTiles(); for (const k in STYLES) CHARS[k] = makeChar(STYLES[k]);
  scene = title; title.start();
  if (!TEST) requestAnimationFrame(t => { lastT = t; loop(t); }); else draw();
  window.ready = true;
};
im.src = 'assets/mons.png?v=' + (window.V || 0);
