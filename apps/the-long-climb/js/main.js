/* Glue: title screen, input, game loop, game over and win. */
LC.Main = (() => {
  const W = LC.World, Sim = LC.Sim, UI = LC.UI, D = LC.DATA;
  const $ = id => document.getElementById(id);
  let mode = 'title', last = performance.now(), hudT = 0, syncT = 0, lastObj = null;
  const input = { fwd: 0, back: 0, left: 0, right: 0, run: 0, turn: 0, jx: 0, jy: 0, active: false };
  const isTouch = () => document.body.classList.contains('touch');
  if (matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0 && !matchMedia('(pointer: fine)').matches) document.body.classList.add('touch');
  addEventListener('pointerdown', e => { if (e.pointerType === 'touch' && !isTouch()) { document.body.classList.add('touch'); } }, true);
  const mini = $('mini').getContext('2d');

  const ERAS = [{ n: 1, years: '1993–1997', name: 'Thirty Days', note: 'Start here' }, { n: 2, years: '1998–2008', name: 'The Bet', note: 'GeForce, rivals, CUDA' }, { n: 3, years: '2012–2026', name: 'The AI Era', note: 'AlexNet to today' }];
  function titleScreen() {
    mode = 'title'; $('hud').classList.add('hidden');
    const can = Sim.hasSave(), T = D.title;
    $('tbox').innerHTML = `<div class="eras">${ERAS.map(e => `<a class="era ${e.n === D.era ? 'on' : ''}" href="?era=${e.n}"><b>Era ${e.n}</b><span>${e.years}</span><small>${e.name} · ${e.note}</small></a>`).join('')}</div>
      <div class="yr">${T.kicker}</div><h1>${T.h1}</h1>
      ${T.paras.map(p => `<p>${p}</p>`).join('')}
      <p class="warn">${T.warn}</p>
      <p class="mut small">${isTouch() ? 'Left stick to move (push all the way to run) · drag anywhere else to turn the camera · pinch to zoom · tap the yellow prompt to talk or enter · ☰ journal' : 'WASD move · Shift run · drag the mouse or use Q/R to turn the camera · scroll to zoom · E interact · J journal · M music · Esc close'}</p>
      <div class="row">${can ? '<button id="tc" class="big">Continue run</button>' : ''}<button id="tn" class="big ${can ? 'ghost2' : ''}">New run</button></div>
      <p class="fine">Dramatized from public accounts and interviews. Dialogue is invented, not quoted. Game numbers are simplified. Not affiliated with or endorsed by NVIDIA or Jensen Huang.</p>`;
    $('title').classList.remove('hidden');
    if (can) $('tc').onclick = () => start(false);
    $('tn').onclick = () => start(true);
  }
  function start(fresh) {
    if (fresh || !Sim.load()) Sim.newRun();
    const S = Sim.get();
    $('title').classList.add('hidden'); $('hud').classList.remove('hidden');
    LC.Heart.music.start(); LC.Heart.music.mood(S.phase); LC.Heart.syncStaff(S);
    const h = D.locations.home.door; W.teleport(h.x + 4, h.z + 4);
    W.setMood(S.phase); W.syncNPCs(S); mode = 'play';
    if (fresh) UI.menu({ title: D.intro.title, sub: D.intro.sub, closable: false, text: D.intro.text, actions: [{ label: 'Head out', fn: () => {} }] });
  }

  function interact() {
    const n = W.nearby(); if (!n) return;
    if (n.type === 'npc') return Sim.npcTalk(n.id);
    const m = Sim.locationActions(n.id); if (m) UI.menu(m);
  }

  function processQueue() {
    const S = Sim.get(); if (!S.queue.length) return;
    while (S.queue.length && !UI.isOpen()) {
      const q = S.queue.shift();
      if (q.toast) UI.toast(q.toast, q.kind);
      else if (q.event) { const E = D.events[q.event]; UI.menu({ title: E.title, sub: Sim.dateStr(), text: E.text, closable: false, actions: Sim.eventActions(q.event) }); }
      else if (q.modal) { if (q.teleportHome) { const h = D.locations.home.door; W.teleport(h.x, h.z + 3); } q.modal(); }
    }
  }

  function gameOver(reason) {
    mode = 'over'; UI.close(); const S = Sim.get();
    UI.show(`<div class="yr">GAME OVER · ${Sim.dateStr()}</div><h2>${(D.deathTitles || {})[reason] || 'NVIDIA is gone'}</h2><p>${D.deaths[reason]}</p>
      <div class="grid2">${Sim.deathStatsHTML(S)}</div>
      <p><em style="color:#ffd24a;font-style:normal">In real life there was no restart button. He found a way through.</em></p>
      <p class="mut small">The save has been erased. Every founder gets one company.</p>
      <button class="big" id="go">Start the era again</button>`, { closable: false, force: true, keys: e => { if (e.key === 'Enter') { again(); return true; } } });
    const again = () => { UI.close(); start(true); };
    $('go').onclick = again;
  }
  function win() { mode = 'over'; LC.Heart.epilogue(summary); }
  function summary() {
    const S = Sim.get();
    UI.show(Sim.summaryHTML(S) + `<div class="row"><button class="big" id="go">Play again</button>${D.era < ERAS.length ? `<button class="big ghost2" id="nx">Play Era ${D.era + 1}</button>` : ''}</div>`, { closable: false });
    $('go').onclick = () => { UI.close(); start(true); };
    if ($('nx')) $('nx').onclick = () => { location.search = '?era=' + (D.era + 1); };
  }

  /* input */
  const map = { w: 'fwd', arrowup: 'fwd', s: 'back', arrowdown: 'back', a: 'left', arrowleft: 'left', d: 'right', arrowright: 'right', shift: 'run' };
  addEventListener('keydown', e => {
    const k = e.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
    if (UI.isOpen()) { if (!e.repeat) UI.key(e); return; }
    if (map[k]) input[map[k]] = 1;
    if (k === 'q') input.turn = 1; if (k === 'e' && mode !== 'play') return;
    if (mode !== 'play' || e.repeat) return;
    if (k === 'e') interact();
    if (k === 'j') UI.journal(Sim.get());
    if (k === 'm') LC.Heart.music.toggle();
  });
  addEventListener('keyup', e => { const k = e.key.toLowerCase(); if (map[k]) input[map[k]] = 0; if (k === 'q') input.turn = 0; });
  addEventListener('blur', () => { for (const k in input) if (k !== 'active') input[k] = 0; joyEnd(); });
  /* camera: one pointer drags to orbit, two touch pointers pinch to zoom. Tracked by pointerId so the joystick finger never moves the camera. */
  const cv = $('c'), ptrs = new Map(); let pinch = 0;
  const spread = () => { const [a, b] = [...ptrs.values()]; return Math.hypot(a.x - b.x, a.y - b.y); };
  cv.addEventListener('pointerdown', e => { ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (ptrs.size === 2) pinch = spread(); });
  const ptrUp = e => { ptrs.delete(e.pointerId); pinch = ptrs.size === 2 ? spread() : 0; };
  addEventListener('pointerup', ptrUp); addEventListener('pointercancel', ptrUp);
  addEventListener('pointermove', e => {
    const p = ptrs.get(e.pointerId); if (!p) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
    if (ptrs.size >= 2) { const d = spread(); if (pinch) W.zoom((pinch - d) * 3); pinch = d; }
    else W.rotate(dx * (e.pointerType === 'touch' ? 1.3 : 1), dy * (e.pointerType === 'touch' ? 1.3 : 1));
  });
  cv.addEventListener('wheel', e => { e.preventDefault(); W.zoom(e.deltaY); }, { passive: false });
  cv.addEventListener('contextmenu', e => e.preventDefault());

  /* touch joystick: analog movement, pushed to the rim = run */
  const joy = $('joy'), knob = joy.firstElementChild; let joyId = null;
  function joyMove(e) {
    const r = joy.getBoundingClientRect(), R = r.width / 2;
    let x = (e.clientX - r.left - R) / R, y = (e.clientY - r.top - R) / R; const m = Math.hypot(x, y);
    if (m > 1) { x /= m; y /= m; }
    const dead = m < .15; input.jx = dead ? 0 : x; input.jy = dead ? 0 : y; input.run = m > .92 ? 1 : 0;
    knob.style.transform = `translate(${x * R * .62}px,${y * R * .62}px)`; joy.classList.toggle('run', !!input.run);
  }
  function joyEnd() { joyId = null; input.jx = input.jy = 0; input.run = 0; knob.style.transform = ''; joy.classList.remove('on', 'run'); }
  joy.addEventListener('pointerdown', e => { e.preventDefault(); joyId = e.pointerId; joy.setPointerCapture(e.pointerId); joy.classList.add('on'); joyMove(e); });
  joy.addEventListener('pointermove', e => { if (e.pointerId === joyId) joyMove(e); });
  joy.addEventListener('pointerup', e => { if (e.pointerId === joyId) joyEnd(); });
  joy.addEventListener('pointercancel', e => { if (e.pointerId === joyId) joyEnd(); });
  joy.addEventListener('lostpointercapture', () => joyEnd());
  $('prompt').addEventListener('click', () => { if (mode === 'play' && !UI.isOpen()) interact(); });
  $('tjournal').onclick = e => { e.currentTarget.blur(); if (mode === 'play' && !UI.isOpen()) UI.journal(Sim.get()); };
  // Q turns left, R turns right (E is interact)
  addEventListener('keydown', e => { if (e.key.toLowerCase() === 'r' && !UI.isOpen()) input.turn = -1; });
  addEventListener('keyup', e => { if (e.key.toLowerCase() === 'r') input.turn = 0; });

  function frame(now) { step(now); requestAnimationFrame(frame); }
  function step(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    const S = Sim.get(), playing = mode === 'play' && !UI.isOpen();
    input.active = playing; if (!playing && joyId !== null) joyEnd();
    if (mode === 'play' && S) {
      if (playing) {
        Sim.realtime(dt);
        for (const i of W.pickNotes(S)) Sim.pickNote(i);
        const n = W.nearby(); UI.prompt(n ? `${isTouch() ? 'Tap' : 'E'} · ${n.type === 'npc' ? 'Talk to ' + n.name : 'Enter ' + n.name}` : null);
      } else UI.prompt(null);
      Sim.checkStory();
      if (S.dead) gameOver(S.dead);
      else processQueue();
      hudT -= dt; if (hudT <= 0) { hudT = .2; UI.hud(S, Sim.objective()); }
      syncT -= dt; if (syncT <= 0) {
        syncT = 1; W.syncNPCs(S); LC.Heart.syncStaff(S);
        LC.Heart.music.mood(S.phase);
      }
      if (!UI.isOpen() && !S.queue.length && !S.dead) LC.Heart.check(S);
    }
    if (mode === 'play' && S) {
      const obj = Sim.objective();
      W.setTarget(obj.target);
      if (obj.text !== lastObj) { if (lastObj !== null) { $('obj').classList.remove('flash'); void $('obj').offsetWidth; $('obj').classList.add('flash'); UI.toast('New objective: ' + obj.text, 'good'); } lastObj = obj.text; }
      const c = W.compass(), cp = $('compass');
      if (c && c.dist > 6) { cp.classList.remove('hidden'); $('carrow').style.transform = `rotate(${c.deg}deg)`; $('cdist').textContent = Math.round(c.dist) + ' m'; }
      else cp.classList.add('hidden');
    } else { W.setTarget(null); $('compass').classList.add('hidden'); }
    W.update(dt, input);
    if (mode === 'play' && S) W.minimap(mini, Sim.objective().target);
  }

  $('mute').onclick = e => { e.currentTarget.blur(); LC.Heart.music.toggle(); };
  W.init(cv);
  titleScreen();
  requestAnimationFrame(frame);
  // test hook: keep the loop running on a timer when the page is hidden (requestAnimationFrame pauses there)
  /* test hook: drive the loop without requestAnimationFrame (which pauses in hidden tabs).
     MessageChannel callbacks aren't throttled like timers, so automated playtests run at full speed. */
  function _fastLoop() {
    const ch = new MessageChannel(); let lastT = 0;
    ch.port1.onmessage = () => { const n = performance.now(); if (n - lastT >= 16) { lastT = n; step(n); } ch.port2.postMessage(0); };
    ch.port2.postMessage(0);
  }
  return { win, gameOver, start, input, interact, mode: () => mode, _fastLoop };
})();
