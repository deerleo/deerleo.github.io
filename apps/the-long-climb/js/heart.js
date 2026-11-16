/* The tribute layer: memories at the lowest moments, the names of the people, music, and the epilogue.
   Inner thoughts are dramatized and labelled as such. Nothing here is presented as a real quote. */
LC.Heart = (() => {
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------- the people ---------- */
  const FIRST = ['Maria', 'David', 'Priya', 'Kenji', 'Sarah', 'Tom', 'Wei', 'Elena', 'Raj', 'Linda', 'Marcus', 'Anh', 'Paul', 'Grace', 'Sam', 'Yuki', 'Daniel', 'Fatima', 'Brian', 'Mei', 'Carlos', 'Julie', 'Arjun', 'Nora', 'Steve', 'Lin', 'Omar', 'Karen', 'Hiro', 'Rosa', 'Ben', 'Ivy', 'Victor', 'Hannah', 'Jae', 'Laura', 'Mike', 'Sofia', 'Ravi', 'Emma'];
  const LAST = ['Chen', 'Patel', 'Nguyen', 'Garcia', 'Kim', 'Smith', 'Tanaka', 'Lopez', 'Wong', 'Singh', 'Murphy', 'Park', 'Rossi', 'Ali', 'Cohen', 'Lee', 'Okafor', 'Silva', 'Novak', 'Brooks'];
  const ROLES = ['logic designer', 'verification engineer', 'layout engineer', 'driver programmer', 'test engineer', 'architect'];
  function syncStaff(S) {
    if (LC.DATA.namedStaff === false) return;
    S.staff = S.staff || []; S.departed = S.departed || [];
    while (S.staff.length < S.team) {
      const i = S.staff.length + S.departed.length;
      S.staff.push({ n: FIRST[(i * 7) % FIRST.length] + ' ' + LAST[(i * 11 + 3) % LAST.length], r: ROLES[i % ROLES.length], y: LC.Sim.dateStr().slice(-4) });
    }
    while (S.staff.length > S.team) S.departed.push(S.staff.pop());
  }
  const leaving = (S, n) => (S.staff || []).slice(Math.max(0, (S.staff || []).length - n));

  /* ---------- memories ---------- */
  function card(o, after) {
    LC.UI.show(`<div class="memory"><div class="mlab">${esc(o.label)}</div><div class="myr">${esc(o.when)}</div>
      ${o.paras.map((p, i) => `<p style="animation-delay:${.4 + i * 1.6}s">${p}</p>`).join('')}
      <button class="big" id="mk" style="animation-delay:${.4 + o.paras.length * 1.6}s">${esc(o.btn || 'Continue')} (Enter)</button></div>`,
      { closable: false, keys: e => { if (e.key === 'Enter') { go(); return true; } } });
    const go = () => { LC.UI.close(); after && after(); };
    document.getElementById('mk').onclick = go;
  }
  /* Each era's data file supplies: memories {id: S => card}, memoryCheck(S) -> id|null, epilogue {cards, tribute}, musicMood {phase: mood}. */
  function play(id, after) {
    const S = LC.Sim.get(), m = LC.DATA.memories[id](S);
    S.mem = S.mem || {}; S.mem[id] = true; if (m.fx) m.fx();
    music.mood(m.mood || S.phase); card(m, after);
  }
  /* triggered from the main loop when nothing else is on screen */
  function check(S) {
    S.mem = S.mem || {};
    const id = LC.DATA.memoryCheck && LC.DATA.memoryCheck(S);
    if (id && !S.mem[id]) S.queue.push({ modal: () => play(id) });
  }

  /* ---------- epilogue ---------- */
  function epilogue(done) {
    const E = LC.DATA.epilogue; music.mood('bright');
    let i = 0;
    const step = () => {
      if (i < E.cards.length) { const e = E.cards[i++]; card({ label: E.label || 'What came after', when: e.when, paras: [e.t], btn: i < E.cards.length ? 'Next' : 'Continue' }, step); return; }
      card(Object.assign({ btn: 'See your run' }, E.tribute), done);
    };
    step();
  }

  /* ---------- music: a slow generative pad, darker in the crisis ---------- */
  const music = (() => {
    let on = false; try { on = localStorage.getItem('lc_music') === 'on'; } catch (e) {} // muted unless the player turns it on
    let ctx = null, master = null, mode = 'idea', timer = null, step = 0;
    const label = () => { const b = document.getElementById('mute'); if (b) { b.textContent = on ? '♪ Music on' : '♪ Music off'; b.classList.toggle('off', !on); } };
    const PROG = {
      hope: [[48, 55, 64, 71], [45, 52, 60, 67], [41, 48, 57, 64], [43, 50, 59, 62]],
      tense: [[45, 52, 60, 64], [41, 48, 57, 60], [38, 45, 53, 57], [40, 47, 56, 59]],
      dark: [[38, 45, 53, 57], [34, 41, 50, 53], [43, 50, 55, 58], [45, 52, 57, 61]],
      bright: [[48, 55, 64, 67], [43, 50, 59, 62], [45, 52, 60, 64], [41, 48, 57, 65]]
    };
    const moodOf = m => PROG[m] ? m : ((LC.DATA.musicMood || {})[m] || 'hope');
    const hz = m => 440 * Math.pow(2, (m - 69) / 12);
    function start() {
      if (ctx) return; try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
      master = ctx.createGain(); master.gain.value = on ? .05 : 0;
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1400;
      const dl = ctx.createDelay(); dl.delayTime.value = .38; const fb = ctx.createGain(); fb.gain.value = .35;
      master.connect(lp); lp.connect(ctx.destination); lp.connect(dl); dl.connect(fb); fb.connect(dl); dl.connect(ctx.destination);
      tick(); timer = setInterval(tick, 6000);
    }
    function tone(f, t0, dur, vol, type) {
      const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type || 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol, t0 + dur * .35); g.gain.linearRampToValueAtTime(0, t0 + dur);
      o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + dur + .1);
    }
    function tick() {
      if (!ctx || !on) return;
      const ch = PROG[moodOf(mode)][step++ % 4], t = ctx.currentTime + .05;
      ch.forEach((m, i) => { tone(hz(m), t, 7, i ? .18 : .25, i ? 'sine' : 'triangle'); tone(hz(m) * 1.003, t, 7, .08, 'sine'); });
      for (let k = 0; k < 3; k++) if (Math.random() < .6) tone(hz(ch[1 + Math.floor(Math.random() * 3)] + 12), t + 1 + k * 1.6, 2.4, .1, 'sine');
    }
    return {
      start() { label(); if (on) start(); }, mood(m) { mode = m; }, label,
      toggle() {
        on = !on; try { localStorage.setItem('lc_music', on ? 'on' : 'off'); } catch (e) {}
        if (master) master.gain.value = on ? .05 : 0; if (on) { start(); if (ctx && ctx.state === 'suspended') ctx.resume(); }
        label(); LC.UI.toast(on ? 'Music on (M)' : 'Music off (M)');
      }
    };
  })();

  return { syncStaff, leaving, check, play, epilogue, music };
})();
