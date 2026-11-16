/* Simulation: time, money, people, phases, decisions, permadeath. */
LC.Sim = (() => {
  const D = LC.DATA, START = Date.UTC(1993, 1, 1), KEY = LC.DATA.saveKey;
  const SEC_PER_DAY = 1.5;            // real seconds per in-game day while roaming
  const SALARY = 3000, FOUNDER = 1500, RENT = 5000, HIRE_FEE = 8000;
  let S = null, acc = 0;

  const PHASES = {
    idea: '1993 · The idea', raise: '1993 · Raising money', nv1: '1993–95 · Building NV1',
    crisis: '1996 · Thirty days', riva: '1997 · RIVA 128', launch2: '1997 · Launch', won: 'Era complete'
  };
  function fresh() {
    return { v: 1, day: 0, phase: 'idea', cash: 40000, team: 0, alloc: .6, morale: 65, energy: 100, prog: 0, bugs: 0, reqMod: 0,
      arch: null, flags: {}, pitched: {}, raised: 0, notes: [], hints: [], deadline: null, lastAllHands: -99, lastLori: -99,
      restDays: 0, events: [], queue: [], dead: null, stats: { puzzles: 0, pitches: 0, workWeeks: 0, collapses: 0, tapeouts: 0, layoffs: 0 } };
  }
  const get = () => S;
  function newRun() { S = fresh(); save(); }
  function load() { try { const j = localStorage.getItem(KEY); if (j) { S = Object.assign(fresh(), JSON.parse(j)); return true; } } catch (e) {} return false; }
  function hasSave() { try { return !!localStorage.getItem(KEY); } catch (e) { return false; } }
  function save() { try { if (S && !S.dead) localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  function wipe() { try { localStorage.removeItem(KEY); } catch (e) {} }

  const money = n => { const a = Math.abs(n), s = n < 0 ? '-' : ''; return a >= 1e6 ? s + '$' + (a / 1e6).toFixed(2) + 'M' : a >= 1e3 ? s + '$' + Math.round(a / 1e3) + 'K' : s + '$' + Math.round(a); };
  function dateStr(day) { const d = new Date(START + (day == null ? S.day : day) * 864e5); return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }); }
  const building = () => S.phase === 'nv1' || S.phase === 'riva';
  const company = () => !['idea', 'raise'].includes(S.phase);
  function req() { return S.phase === 'nv1' ? (S.arch === "quad" ? 2200 : 1800) : S.phase === "riva" ? 1500 + S.reqMod : 1; }
  function burnWeek() { return company() ? S.team * SALARY + 3 * FOUNDER + RENT : 1050; }
  function runway() { return S.cash / burnWeek(); }
  function moraleF() { return .4 + S.morale / 100; }
  function rates() {
    const designers = S.team * S.alloc, verifiers = S.team * (1 - S.alloc);
    const prog = building() && S.restDays <= 0 ? (designers + 3 * 1.2) * moraleF() : 0;
    return { prog, gen: prog * .06, fix: building() ? verifiers * .1 * moraleF() * (S.flags.emulator ? 3 : 1) : 0 };
  }
  function bugRisk() { const b = S.bugs; return b < 3 ? 'Low' : b < 9 ? 'Medium' : b < 18 ? 'High' : 'Severe'; }
  function bugText() { return S.flags.emulator ? Math.round(S.bugs) + ' known' : bugRisk() + ' (est.)'; }
  const toast = (msg, kind) => S.queue.push({ toast: msg, kind });

  /* ---------- time ---------- */
  function tickDay(opts) {
    if (S.dead) return;
    opts = opts || {};
    S.day++;
    S.cash -= burnWeek() / 7;
    const r = rates();
    if (building()) {
      S.prog += r.prog / 7 + (opts.work ? 1.5 : 0);
      S.bugs = Math.max(0, S.bugs + (r.gen + (opts.work ? .8 : 0)) / 7 - r.fix / 7);
    }
    if (S.restDays > 0) S.restDays--;
    S.energy = Math.max(0, Math.min(100, S.energy + (opts.rest ? 40 : opts.work ? -4.5 : -1.2)));
    S.morale += (60 - S.morale) * .01;
    if (company() && runway() < 8) S.morale -= .35;
    S.morale = Math.max(0, Math.min(100, S.morale));
    if (S.day % 7 === 0) {
      if (S.morale < 25 && S.team > 0) { const q = Math.max(1, Math.ceil(S.team * .05)); S.team -= q; toast(`${q} engineer${q > 1 ? 's' : ''} quit. Morale is dangerously low.`, 'bad'); }
      maybeEvent();
      save();
    }
    if (S.cash < 0 && !(S.graceUntil && S.day <= S.graceUntil)) return die('broke');
    if (S.cash < 0 && S.graceUntil && (S.graceUntil - S.day) % 7 === 0) toast(`Payroll bounces in ${S.graceUntil - S.day} days.`, 'bad');
    if (company() && S.morale <= 0) return die('morale');
    if (S.deadline && S.day > S.deadline && S.phase === 'riva') return die('window');
    if (S.deadline && S.day > S.deadline && S.phase === 'launch2') return die('window');
    if (S.energy <= 0 && !opts.collapse) collapse();
  }
  function collapse() {
    S.stats.collapses++;
    S.queue.push({ modal: () => LC.UI.menu({ title: 'You collapsed', sub: 'Exhaustion', closable: false,
      text: 'You pushed past your limit and woke up a week later. The company kept burning money while you were out.',
      actions: [{ label: 'Get back to work', fn: () => {} }] }), teleportHome: true });
    for (let i = 0; i < 7 && !S.dead; i++) tickDay({ collapse: true, rest: false });
    S.energy = 55; S.morale = Math.max(0, S.morale - 6);
  }
  function advance(days, opts) { for (let i = 0; i < days && !S.dead; i++) tickDay(opts); save(); }
  function realtime(dt) { acc += dt; while (acc >= SEC_PER_DAY && !S.dead) { acc -= SEC_PER_DAY; tickDay(); } }
  function die(reason) { if (S.dead) return; S.dead = reason; wipe(); }

  /* ---------- random events ---------- */
  function maybeEvent() {
    if (S.queue.some(q => q.event)) return;
    const pool = Object.keys(D.events).filter(id => !S.events.includes(id) && D.events[id].phases.includes(S.phase) && (!D.events[id].need || D.events[id].need(S)));
    if (!pool.length || Math.random() > .14) return;
    const id = pool[Math.floor(Math.random() * pool.length)]; S.events.push(id); S.queue.push({ event: id });
  }
  function eventActions(id) {
    const E = {
      poach: [
        { label: 'Match the offer', desc: '-$60K. Keeps your best person.', fn: () => { S.cash -= 60000; S.morale += 2; } },
        { label: 'Talk about the mission', desc: '-15 energy. Maybe they stay.', disabled: S.energy < 15, fn: () => { S.energy -= 15; if (Math.random() < .65) { S.morale += 3; toast('They stayed. "Let\'s build it."', 'good'); } else { S.team = Math.max(0, S.team - 1); S.morale -= 3; toast('They left anyway.', 'bad'); } } },
        { label: 'Let them go', desc: '-1 engineer, -morale, more bugs slip through.', fn: () => { S.team = Math.max(0, S.team - 1); S.morale -= 4; S.bugs += 2; } }],
      sample: [
        { label: 'Take the deal', desc: '+$250K cash, but -40 chip progress.', fn: () => { S.cash += 250000; S.prog = Math.max(0, S.prog - 40); } },
        { label: 'Decline, stay focused', desc: 'No money, no distraction.', fn: () => {} }],
      burnout: [
        { label: 'Give everyone a week off', desc: 'No progress for 7 days, morale +15.', fn: () => { S.restDays = 7; S.morale += 15; } },
        { label: 'Push through', desc: '+20 progress now, morale -12, more bugs.', fn: () => { S.prog += 20; S.morale -= 12; S.bugs += 3; } }],
      lori: [
        { label: 'Go home tonight', desc: 'Lose a day. +25 energy.', fn: () => { advance(1); S.energy = Math.min(100, S.energy + 25); } },
        { label: 'Stay and work', desc: '+6 progress, -10 energy.', fn: () => { S.prog += 6; S.energy -= 10; } }],
      directx: [
        { label: 'Stay the course', desc: 'Curved surfaces are better. Trust the design.', fn: () => {} },
        { label: 'Fund a small triangle side project', desc: '-$300K now. Your next chip will be easier to build.', fn: () => { S.cash -= 300000; S.flags.triSide = true; } }],
      rival: [
        { label: 'Cut features to ship sooner', desc: 'Chip needs 250 less work, but it will be less impressive.', fn: () => { S.reqMod -= 250; S.flags.cutFeatures = true; } },
        { label: 'Rally the team', desc: 'All-hands: morale +10, -12 energy.', fn: () => { S.morale += 10; S.energy -= 12; } }]
    };
    return E[id];
  }

  /* ---------- objective ---------- */
  function objective() {
    const f = S.flags;
    switch (S.phase) {
      case 'idea': return !f.met ? { text: "Meet Chris and Curtis at Denny's", target: 'dennys' } : { text: 'Resign from LSI Logic', target: 'lsi' };
      case 'raise': return S.raised >= 5e6 ? { text: `Raised ${money(S.raised)}. Pitch more, or open the NVIDIA office to close the round`, target: 'nvidia' } : { text: `Raise at least $5M on Sand Hill Road (${money(S.raised)} so far)`, target: 'sequoia' };
      case 'nv1': return !S.arch ? { text: 'Go to the office and decide how NV1 draws 3D', target: 'nvidia' } : S.prog >= req() ? { text: 'NV1 is ready. Tape it out at the office', target: 'nvidia' } : { text: `Build NV1 · ${Math.floor(S.prog / req() * 100)}%. Keep the money from running out`, target: 'nvidia' };
      case 'crisis': return !f.laidOff ? { text: 'Go to the office. Decide who stays', target: 'nvidia' } : f.sega && !f.segaDone ? { text: 'Fly to Tokyo and face Sega', target: 'airport' } : { text: 'Ask Sand Hill for a bridge round', target: 'sequoia' };
      case 'riva': return S.prog >= req() ? { text: 'RIVA 128 is ready. Tape it out at the office', target: 'nvidia' } : { text: `Build RIVA 128 · ${Math.floor(S.prog / req() * 100)}% · ${Math.max(0, Math.ceil((S.deadline - S.day) / 7))} weeks left`, target: 'nvidia' };
      case 'launch2': return { text: 'Launch RIVA 128 at the Expo Hall', target: 'expo' };
      default: return { text: 'Era complete', target: null };
    }
  }

  /* ---------- story beats ---------- */
  function setPhase(p) { S.phase = p; LC.World.setMood(p); LC.World.syncNPCs(S); save(); }

  function foundersTalk() {
    const UI = LC.UI;
    if (S.phase === 'idea' && !S.flags.met) {
      UI.dialog([
        { who: 'Chris Malachowsky', text: "Jensen. Curtis and I have been at Sun long enough. 3D graphics is about to explode, and nobody's building the right chip for PCs." },
        { who: 'Curtis Priem', text: "Video games. That's the killer app. Millions of people, not a few thousand workstation buyers." },
        { who: 'Jensen', text: "There are already dozens of graphics companies. Most of them will die." },
        { who: 'Chris Malachowsky', text: "Which is why we need you. You know how to run chip design and how to run a business. Are you in?" }
      ], { choices: [
        { label: "\"I'm in. Let's build it.\"", fn: () => { S.flags.met = true; toast('Next: resign from LSI Logic.', 'good'); save(); } },
        { label: "\"Let me think about it.\"", fn: () => toast('Chris and Curtis will wait here at the diner.') }
      ] });
      return;
    }
    const r = rates(), left = req() - S.prog, eta = r.prog > 0 ? Math.ceil(left / r.prog) : null;
    const lines = [];
    if (building()) {
      lines.push({ who: 'Chris Malachowsky', text: eta ? `At this pace the chip needs about ${eta} more weeks. We have about ${Math.floor(runway())} weeks of money.` : 'Nobody is designing right now. The chip isn\'t moving.' });
      lines.push({ who: 'Curtis Priem', text: S.flags.emulator ? `The emulator shows ${Math.round(S.bugs)} bugs right now.` : `Verification thinks bug risk is ${bugRisk().toLowerCase()}. Without an emulator we're guessing.` });
      if (eta && eta > runway()) lines.push({ who: 'Chris Malachowsky', text: "Jensen, those two numbers don't work. Something has to change." });
    } else if (S.phase === 'crisis') {
      lines.push({ who: 'Curtis Priem', text: "We bet on the wrong way to draw 3D. That's the truth." });
      lines.push({ who: 'Chris Malachowsky', text: "We can survive this, but only if we cut deep and get money from somewhere." });
    } else lines.push({ who: 'Chris Malachowsky', text: "Let's keep moving." });
    UI.dialog(lines);
  }

  function resignLSI() {
    LC.UI.dialog([
      { who: 'Wilf Corrigan', text: "Jensen. You look like a man with news." },
      { who: 'Jensen', text: "I'm leaving LSI to start a graphics chip company with two engineers from Sun." },
      { who: 'Wilf Corrigan', text: "Graphics. Crowded field. I'd hate to lose you, but I'm not surprised." }
    ], { choices: [
      { label: 'Thank him sincerely, and ask if he would vouch for you with investors', fn: () => {
        S.flags.ref = true; LC.UI.dialog([{ who: 'Wilf Corrigan', text: "I'll call Don Valentine at Sequoia myself. Don't make me look bad." }], { onEnd: found });
      } },
      { label: 'Hand in your notice and leave', fn: found }
    ] });
  }
  function found() {
    S.flags.resigned = true; if (S.day < 63) S.day = 63; // ~April 1993
    setPhase('raise');
    LC.UI.menu({ title: 'NVIDIA is founded', sub: dateStr(), closable: false,
      text: 'Three founders, a few laptops, and about $40,000 of savings. You need millions to build a chip. Raise it on Sand Hill Road, or the dream ends here.',
      actions: [{ label: 'Go raise money', fn: () => {} }] });
  }

  function vcActions(id) {
    const iv = D.investors[id], L = D.locations[id], acts = [];
    if (S.phase === 'raise') {
      const p = S.pitched[id];
      if (p && p.ok) acts.push({ label: `Invested ${money(p.amt)}`, desc: 'They are in. Thank them and move on.', disabled: true });
      else if (p && S.day < p.day + 28) acts.push({ label: 'Pitch again', desc: `They won't see you for ${p.day + 28 - S.day} more days.`, disabled: true });
      else acts.push({ label: `Pitch the ${iv.name} (1 day, -10 energy)`, desc: 'Answer tough questions under time pressure. Interest must reach 70.', disabled: S.energy < 10, fn: () => pitch(id) });
    } else if (S.phase === 'crisis' && S.flags.laidOff && !S.flags.sega && id !== 'angel') {
      if (S.flags['bridge_' + id]) acts.push({ label: 'Already asked', desc: 'They gave their answer.', disabled: true });
      else acts.push({ label: 'Ask for a bridge round', desc: 'One chance. Convince them NVIDIA deserves to live.', fn: () => bridge(id) });
    }
    return { title: L.name, sub: L.sub, text: S.phase === 'raise' ? (S.flags.ref && id === 'sequoia' ? 'The receptionist smiles: "Mr Valentine mentioned you. Wilf Corrigan called."' : 'Partners in pressed shirts. Every week dozens of founders walk through this door. Most walk out with nothing.') : 'Quiet offices on Sand Hill Road.', actions: acts };
  }
  function pitch(id) {
    const iv = D.investors[id], qs = shuffle(D.pitchQs.slice()).slice(0, 5);
    const rounds = qs.map(q => ({ q: q.q, a: q.a.map(a => ({ t: a.t, d: Math.round(8 * (a.v * iv.w.v + a.p * iv.w.p + a.tm * iv.w.tm)) })) }));
    const start = 40 + (id === 'sequoia' && S.flags.ref ? 20 : 0);
    S.energy -= 10; S.stats.pitches++;
    LC.Games.battle({ title: 'Pitch · ' + D.locations[id].name, who: iv.name, meter: 'Interest', start, pass: 70, rounds, time: 14 }, (ok, m) => {
      advance(1);
      if (ok) {
        const amt = Math.round(iv.max * Math.min(1, Math.max(.3, (m - 60) / 40)) / 1e5) * 1e5;
        S.cash += amt; S.raised += amt; S.pitched[id] = { ok: true, amt, day: S.day }; S.morale += 6;
        LC.UI.menu({ title: `${D.locations[id].name} invests ${money(amt)}`, sub: 'Pitch won', closable: false, text: `Interest finished at ${m}. ${amt >= iv.max * .9 ? 'They want in big.' : 'They are in, cautiously.'}`, actions: [{ label: 'Continue', fn: () => {} }] });
      } else {
        S.pitched[id] = { ok: false, day: S.day };
        LC.UI.menu({ title: 'They passed', sub: 'Pitch lost', closable: false, text: `Interest finished at ${m}. "Come back when you have more." You can try again in 28 days, but the money keeps burning.`, actions: [{ label: 'Continue', fn: () => {} }] });
      }
      save();
    });
  }
  function bridge(id) {
    const rounds = D.bridgeQs.map(q => ({ q: q.q, a: q.a.map(a => ({ t: a.t, d: a.needCut && S.stats.layoffs < 40 ? -10 : a.d })) }));
    S.flags['bridge_' + id] = true;
    LC.Games.battle({ title: 'Bridge round · ' + D.locations[id].name, who: D.investors[id].name, meter: 'Confidence', start: 35, pass: 70, rounds, time: 14 }, (ok, m) => {
      advance(1);
      if (ok) { S.cash += 3e6; S.flags.bridged = true; LC.UI.menu({ title: 'A lifeline: $3M', sub: 'Bridge round', closable: false, text: 'Harsh terms, but NVIDIA lives. Now build the chip that matters.', actions: [{ label: 'Start RIVA 128', fn: startRiva }] }); }
      else {
        const other = id === 'sequoia' ? 'sutter' : 'sequoia';
        const canRetry = !S.flags['bridge_' + other];
        LC.UI.menu({ title: 'No.', sub: 'Bridge round', closable: false, text: canRetry ? `Confidence finished at ${m}. Try ${D.locations[other].name}. It's your last chance for outside money.` : 'Nobody will fund you. You will have to build the next chip with what is left.', actions: [{ label: canRetry ? 'Continue' : 'Start RIVA 128 anyway', fn: canRetry ? () => {} : startRiva }] });
      }
    });
  }

  function archChoice() {
    LC.UI.menu({ title: 'How should NV1 draw 3D?', sub: 'A decision that shapes the company', closable: false,
      text: 'The first chip defines everything. Curtis likes curved surfaces: elegant, and a big console maker is interested. Others say triangles are where the industry is heading.',
      actions: [
        { label: 'Curved surfaces (quadratic)', desc: 'Harder to build (2,200 work). A console partner may sign on. Risky if the industry picks triangles. This is what NVIDIA really did.', fn: () => { S.arch = 'quad'; toast('NV1 will use quadratic surfaces.'); save(); } },
        { label: 'Triangles', desc: 'Simpler (1,800 work). No console partner. Safer if standards go that way.', fn: () => { S.arch = 'tri'; toast('NV1 will use triangles.'); save(); } }
      ] });
  }

  function officeActions() {
    const acts = [], L = D.locations.nvidia;
    if (S.phase === 'idea') return { title: L.name, sub: 'For lease', text: 'An empty office with a FOR LEASE sign. Maybe one day.', actions: [] };
    if (S.phase === 'raise') {
      acts.push({ label: 'Close the round and open the office', desc: S.raised >= 5e6 ? `Start building with ${money(S.cash)}. Investors close; no more pitching.` : `Raise at least $5M first (${money(S.raised)} so far).`, disabled: S.raised < 5e6, fn: () => { setPhase('nv1'); S.team = 4; toast('The office is open. Hire a team and decide how NV1 draws 3D.', 'good'); setTimeout(archChoice, 50); } });
      return { title: L.name, sub: L.sub, text: 'Empty desks and a whiteboard.', actions: acts };
    }
    if (S.phase === 'nv1' && !S.arch) { archChoice(); return null; }
    if (S.phase === 'crisis' && !S.flags.laidOff) { layoffs(); return null; }
    if (building()) {
      acts.push({ label: 'Manage the team', desc: 'Hire, fire, and split engineers between design and verification.', fn: manage });
      acts.push({ label: 'Work alongside the team (7 days)', desc: '+10 progress, -32 energy, and you add bugs when tired.', disabled: S.energy < 25, fn: () => { S.stats.workWeeks++; advance(7, { work: true }); toast('A week in the trenches.'); } });
      const pzWait = 14 - (S.day - (S.lastPuzzle == null ? -99 : S.lastPuzzle));
      acts.push({ label: 'Solve a design block (chip routing puzzle)', desc: pzWait > 0 ? `The next block isn't ready. ${pzWait} more days.` : 'Skill challenge. Win: +20 progress, -3 bugs. Costs 3 days and 15 energy either way.', disabled: S.energy < 15 || pzWait > 0, fn: puzzle });
      const ahReady = S.day - S.lastAllHands >= 14;
      acts.push({ label: 'Hold an all-hands meeting', desc: ahReady ? 'Morale +12, -10 energy, 1 day.' : `Too soon. Again in ${14 - (S.day - S.lastAllHands)} days.`, disabled: !ahReady || S.energy < 10, fn: () => { S.lastAllHands = S.day; S.morale = Math.min(100, S.morale + 12); S.energy -= 10; advance(1); toast('The room believes again. For now.', 'good'); } });
      if (S.prog >= req()) acts.push({ label: `Tape out ${S.phase === 'nv1' ? 'NV1' : 'RIVA 128'}`, desc: 'Send the design to manufacturing. If bugs slip through, the silicon fails.', fn: tapeout });
    } else if (S.phase === 'crisis') {
      acts.push({ label: 'Manage the team', desc: 'Adjust headcount. Hiring is frozen.', fn: manage });
    } else if (S.phase === 'launch2') acts.push({ label: 'Head to the Expo Hall', desc: 'Your silicon works. Show the world.', disabled: true });
    return { title: L.name, sub: PHASES[S.phase], text: `${S.team} engineers + 3 founders. Burning ${money(burnWeek())} a week, ${Math.floor(runway())} weeks of cash left.`, actions: acts };
  }

  function manage() {
    const UI = LC.UI;
    const render = () => {
      const r = rates(), left = Math.max(0, req() - S.prog), eta = r.prog > 0 ? Math.ceil(left / r.prog) : '∞';
      const frozen = S.phase === 'crisis';
      UI.show(`<div class="yr">MANAGE THE TEAM</div><h2>${S.team} engineers <span class="mut">+ 3 founders</span></h2>
        <div class="grid2">
          <div><small>Burn / week</small><b>${money(burnWeek())}</b></div><div><small>Runway</small><b class="${runway() < 8 ? 'bad' : ''}">${Math.floor(runway())} weeks</b></div>
          <div><small>Progress / week</small><b>${r.prog.toFixed(1)}</b></div><div><small>Weeks to finish</small><b>${building() ? eta : '—'}</b></div>
          <div><small>Bugs / week</small><b>+${r.gen.toFixed(1)} / −${r.fix.toFixed(1)}</b></div><div><small>Bugs</small><b>${bugText()}</b></div>
        </div>
        <div class="row"><button data-h="1" ${frozen ? 'disabled' : ''}>Hire 1</button><button data-h="5" ${frozen ? 'disabled' : ''}>Hire 5</button><button data-h="-1">Let 1 go</button><button data-h="-5">Let 5 go</button></div>
        <p class="mut small">Hiring costs ${money(HIRE_FEE)} each up front, then ${money(SALARY)}/week. Letting people go hurts morale.</p>
        <label class="lbl">Design ${Math.round(S.alloc * 100)}% · Verification ${Math.round((1 - S.alloc) * 100)}%</label>
        <input type="range" id="alloc" min="10" max="95" step="5" value="${Math.round(S.alloc * 100)}">
        <p class="mut small">Designers move the chip forward. Verifiers find bugs before tape-out${S.flags.emulator ? ' (3× faster with the emulator)' : ''}.</p>
        ${(S.staff || []).length ? `<p class="names"><b>Your people:</b> ${S.staff.slice(0, 14).map(p => p.n).join(', ')}${S.staff.length > 14 ? ` and ${S.staff.length - 14} more` : ''}</p>` : ''}
        <button class="ghost" data-x>Done (Esc)</button>`, { closable: true });
      LC.Heart.syncStaff(S);
      document.querySelectorAll('[data-h]').forEach(b => b.onclick = () => {
        const n = +b.dataset.h;
        if (n > 0) { if (S.team + n > 150) return; S.cash -= HIRE_FEE * n; S.team += n; }
        else { const k = Math.min(S.team, -n); S.team -= k; S.morale = Math.max(0, S.morale - 1.5 * k); }
        render();
      });
      document.getElementById('alloc').oninput = e => { S.alloc = +e.target.value / 100; render(); };
      document.querySelector('[data-x]').onclick = () => { save(); UI.close(); };
    };
    render();
  }

  function puzzle() {
    const sz = S.phase === 'nv1' ? { n: 6, k: 6, time: 100 } : { n: 7, k: 7, time: 120 };
    S.energy -= 15; S.lastPuzzle = S.day;
    LC.Games.routing({ ...sz, title: 'Design block · route the signals' }, ok => {
      advance(3);
      if (ok) { S.prog += 20; S.bugs = Math.max(0, S.bugs - 3); S.stats.puzzles++; toast('Block routed cleanly. +20 progress.', 'good'); }
      else toast('The block is still a mess. Three days gone.', 'bad');
    });
  }

  function tapeout() {
    const nv = S.phase === 'nv1', p = Math.exp(-S.bugs / (nv ? 10 : 8));
    LC.UI.menu({ title: 'Tape out?', sub: nv ? 'NV1' : 'RIVA 128', text: `${S.flags.emulator ? `The emulator shows ${Math.round(S.bugs)} bugs. Chance the silicon works: ${Math.round(p * 100)}%.` : `Verification estimates bug risk as ${bugRisk().toLowerCase()}. You can't know for sure.`} A failed chip costs ${nv ? '$500K and 6 weeks' : '$1M and 8 weeks'}.${nv ? ` If it works, building the first NV1 inventory costs $3M up front (you have ${money(S.cash)}).` : ''}`,
      actions: [
        { label: 'Tape out now', fn: () => {
          S.stats.tapeouts++;
          if (Math.random() < p) nv ? nv1Ships() : rivaWorks();
          else {
            S.cash -= nv ? 5e5 : 1e6; S.bugs *= .45; advance(nv ? 42 : 56); S.morale -= 10;
            LC.UI.menu({ title: 'The silicon is dead', sub: 'Tape-out failed', closable: false, text: 'First chips back from the fab don\'t work. Bugs you never found. You pay for another run and wait.', actions: [{ label: 'Fix it and try again', fn: () => {} }] });
          }
        } },
        { label: 'Not yet', desc: 'Keep verifying.', fn: () => {} }
      ] });
  }
  function nv1Ships() {
    S.cash -= 3e6; S.day = Math.max(S.day, 819); // NV1 historically shipped in 1995
    const quad = S.arch === "quad", rev = quad ? 5e5 : 2.5e6; S.cash += rev;
    LC.UI.menu({ title: 'NV1 ships', sub: dateStr(), closable: false,
      text: quad ? 'NV1 lands on graphics boards in stores. Then Microsoft\'s DirectX arrives, built entirely on triangles. Game developers ignore NV1\'s curved surfaces. Boards come back unsold. Revenue: $0.5M against $3M of inventory.'
        : 'NV1 works with the new triangle-based DirectX. But it\'s an expensive all-in-one chip in a field of dozens of rivals, and it sells modestly. Revenue: $2.5M against $3M of inventory.',
      actions: [{ label: 'Continue', fn: () => {
        S.day = Math.max(S.day, 1064); // the crisis lands in early 1996, as it did historically
        S.prog = 0; S.bugs = 0; setPhase('crisis'); S.graceUntil = S.day + 30;
        LC.UI.menu({ title: 'Thirty days', sub: '1996', closable: false,
          text: `${S.cash < 0 ? `You are ${money(-S.cash)} in the red. Payroll bounces in 30 days unless you find money.` : `You have ${money(S.cash)} and burn ${money(burnWeek())} a week. ${Math.floor(runway())} weeks to live.`} ${quad ? 'Sega is still waiting for NV2, a chip you now know is built on the wrong idea.' : 'There is no partner to save you.'} You have to decide who stays.`,
          actions: [{ label: 'Go to the office', fn: () => {} }] });
      } }] });
  }
  function layoffs() {
    let pct = 50;
    const render = () => {
      const keep = Math.round(S.team * (1 - pct / 100)), burn = keep * SALARY + 3 * FOUNDER + RENT;
      LC.UI.show(`<div class="yr">THE HARDEST DAY</div><h2>How many people do you let go?</h2>
        <p>${S.team} engineers believed in you. The money can't pay all of them.</p>
        <label class="lbl">Let go: <b>${pct}%</b> (${S.team - keep} people) · ${keep} stay</label>
        <input type="range" id="lp" min="0" max="85" step="5" value="${pct}">
        <div class="grid2"><div><small>New burn / week</small><b>${money(burn)}</b></div><div><small>New runway</small><b class="${S.cash < 0 ? 'bad' : ''}">${S.cash < 0 ? 'In the red' : Math.floor(S.cash / burn) + ' weeks'}</b></div>
        <div><small>Morale hit</small><b class="bad">−${Math.round(pct * .45)}</b></div><div><small>Team left to build the next chip</small><b>${keep}</b></div></div>
        ${S.team - keep > 0 ? `<p class="names"><b>Leaving:</b> ${LC.Heart.leaving(S, S.team - keep).slice(-12).map(p => p.n).join(', ')}${S.team - keep > 12 ? ` and ${S.team - keep - 12} more` : ''}</p>` : ''}
        <p class="mut small">Historically, Jensen laid off more than half the company.</p>
        <button id="lgo" class="big">Tell them</button>`, { closable: false });
      document.getElementById('lp').oninput = e => { pct = +e.target.value; render(); };
      document.getElementById('lgo').onclick = () => {
        const keep2 = Math.round(S.team * (1 - pct / 100));
        S.stats.layoffs = pct; S.team = keep2; S.morale = Math.max(1, S.morale - pct * .45); S.flags.laidOff = true;
        S.flags.sega = S.arch === 'quad' && S.flags.segaDeal;
        advance(2); LC.UI.close(); save();
        toast(S.flags.sega ? 'Next: fly to Tokyo and tell Sega the truth about NV2.' : 'Next: ask Sand Hill Road for a bridge round.');
      };
    };
    render();
  }
  function segaTrip() {
    S.cash -= 8000; advance(4);
    if (S.dead) return;
    LC.Games.battle({ title: 'Sega headquarters · Tokyo', who: 'Shoichiro Irimajiri, Sega CEO', meter: 'Trust', start: 45, pass: 75, rounds: D.sega, time: 18 }, (ok, m, picks) => {
      advance(4); S.flags.segaDone = true;
      const nothing = picks.some(p => p.noMoney);
      if (ok && !nothing) { S.cash += 5e6; S.flags.segaPaid = true; LC.UI.menu({ title: 'Sega invests $5M', sub: 'Tokyo', closable: false, text: 'Irimajiri agrees to pay. NVIDIA has months to live instead of weeks. Historically, this is exactly what happened.', actions: [{ label: 'Start RIVA 128', fn: startRiva }] }); }
      else LC.UI.menu({ title: nothing ? 'You asked for nothing' : 'Sega declines', sub: 'Tokyo', closable: false, text: nothing ? 'Your pride is intact. Your bank account is not.' : 'You fly home with nothing. NVIDIA must build its next chip on what little is left.', actions: [{ label: 'Start RIVA 128', fn: startRiva }] });
    });
  }
  function startRiva() {
    S.prog = 0; S.bugs = 0; S.reqMod = S.flags.triSide || S.arch === "tri" ? -300 : 0;
    const regroup = S.day < 1392; S.day = Math.max(S.day, 1392); // late Nov 1996: full-speed RIVA 128 development
    // the window closes Aug 31, 1997, when RIVA 128 historically reached the market
    S.deadline = S.day + 280;
 setPhase('riva'); S.morale = Math.min(100, S.morale + 8);
    LC.UI.menu({ title: 'RIVA 128', sub: 'The last chance', closable: false,
      text: `${regroup ? 'Most of 1996 passes in a blur. The small team that survived sketches the new chip on whiteboards while the company scrapes by. Now it is time to build it. ' : ''}A fast triangle chip built for DirectX. The market window closes on ${dateStr(S.deadline)}, 40 weeks from now. Miss it, run out of money, or ship a broken chip, and NVIDIA is gone. ${S.reqMod ? 'Your triangle experience gives you a head start.' : ''}`,
      actions: [{ label: 'Build it', fn: () => {} }] });
  }
  function rivaWorks() {
    S.morale = Math.min(100, S.morale + 15); setPhase('launch2');
    LC.Heart.play('silicon', () => LC.UI.menu({ title: 'First silicon works', sub: dateStr(), closable: false, text: 'The chips come back from the fab and boot on the first try. The whole office is cheering. Now take it to the Expo Hall and show the world.', actions: [{ label: 'Go to the Expo Hall', fn: () => {} }] }));
  }

  function locationActions(id) {
    const L = D.locations[id], f = S.flags;
    if (id === 'nvidia') return officeActions();
    if (D.investors[id]) return vcActions(id);
    if (id === 'home') return { title: L.name, sub: L.sub, text: 'A small house. Lori is still up.', actions: [
      { label: 'Sleep (2 days)', desc: 'Restore energy. The company keeps burning money.', fn: () => { advance(2, { rest: true }); toast('Rested.', 'good'); } },
      { label: 'Dinner with Lori (1 day)', desc: S.day - S.lastLori >= 21 ? '+30 energy, +5 morale. She keeps you human.' : `You saw her properly ${S.day - S.lastLori} days ago.`, disabled: S.day - S.lastLori < 21, fn: () => { S.lastLori = S.day; advance(1, { rest: true }); S.energy = Math.min(100, S.energy + 10); S.morale = Math.min(100, S.morale + 5); LC.UI.dialog([{ who: 'Lori Huang', text: S.phase === 'crisis' ? "Whatever happens with the company, we'll be fine. You know that, right?" : "You're doing what you were meant to do. Just come home sometimes." }]); } }
    ] };
    if (id === 'dennys') {
      if (S.phase === 'idea' && !f.met) return { title: L.name, sub: L.sub, text: 'Coffee, pancakes, and two engineers from Sun waiting in a booth.', actions: [{ label: 'Sit down with Chris and Curtis', fn: foundersTalk }] };
      return { title: L.name, sub: L.sub, text: 'The booth where it started.', actions: [{ label: 'Coffee and pie ($12)', desc: '+8 energy.', fn: () => { S.cash -= 12; S.energy = Math.min(100, S.energy + 8); toast('Still the best coffee for thinking.'); } }] };
    }
    if (id === 'lsi') {
      if (S.phase === 'idea' && f.met && !f.resigned) return { title: L.name, sub: L.sub, text: 'Your office. Your boss Wilf Corrigan is in.', actions: [{ label: 'Tell Wilf you are leaving', fn: resignLSI }] };
      if (S.phase === 'idea') return { title: L.name, sub: L.sub, text: 'You run chip design here. It is a good job.', actions: [] };
      if (building() && !f.recruited) return { title: L.name, sub: 'Your old employer', text: 'Your old colleagues still eat lunch at noon.', actions: [{ label: 'Recruit former colleagues (1 day)', desc: '+4 experienced engineers with no hiring fee. Only once.', fn: () => { f.recruited = true; S.team += 4; S.morale += 3; advance(1); toast('Four LSI veterans join NVIDIA.', 'good'); } }] };
      return { title: L.name, sub: 'Your old employer', text: 'Familiar faces in the lobby.', actions: [] };
    }
    if (id === 'ikos') {
      if (S.phase === 'riva' && !f.emulator) return { title: L.name, sub: L.sub, text: 'A hardware emulator can run your whole chip design before it exists, catching bugs a simulator would miss.', actions: [{ label: 'Buy an emulator ($1,000,000)', desc: 'Bug fixing ×3 and you see the real bug count. A huge share of your cash.', disabled: S.cash < 1e6, fn: () => { S.cash -= 1e6; f.emulator = true; toast('The emulator is installed at the office.', 'good'); save(); } }] };
      return { title: L.name, sub: L.sub, text: f.emulator ? 'Your emulator is humming away at the office.' : 'Emulators: too expensive to think about yet.', actions: [] };
    }
    if (id === 'airport') {
      if (S.phase === 'crisis' && f.sega && f.laidOff && !f.segaDone) return { title: L.name, sub: L.sub, text: 'A red-eye to Tokyo. The most important meeting of your life is at the other end.', actions: [{ label: 'Fly to Tokyo (4 days, $8,000)', fn: segaTrip }] };
      return { title: L.name, sub: L.sub, text: 'No trips planned.', actions: [] };
    }
    if (id === 'expo') {
      if (S.phase === 'launch2') return { title: L.name, sub: 'Launch day', text: 'Press, board makers, rivals. One live demo. If it stumbles, they will remember.', actions: [{ label: 'Run the live demo', desc: 'Hardest routing challenge. Fail and you lose a week before trying again.', fn: finalDemo }] };
      return { title: L.name, sub: L.sub, text: 'Empty between shows.', actions: [] };
    }
    return { title: L.name, sub: L.sub, text: '', actions: [] };
  }
  function finalDemo() {
    LC.Games.routing({ n: 8, k: 8, time: 150, title: 'Live demo · route it in front of everyone' }, ok => {
      if (!ok) { advance(7); toast('The demo crashed on stage. A week to regroup.', 'bad'); return; }
      S.phase = 'won'; wipe(); LC.Main.win();
    });
  }

  function npcTalk(id) {
    if (id === 'chris' || id === 'curtis') return foundersTalk();
    if (id === 'wilf') return S.phase === 'idea' && S.flags.met ? resignLSI() : LC.UI.dialog([{ who: 'Wilf Corrigan', text: "Busy day, Jensen. Chips don't design themselves." }]);
    if (id === 'lori') return LC.UI.dialog([{ who: 'Lori Huang', text: ['Did you eat today?', 'Go get them. Then come home.', "I've never seen you this tired. Rest when you can."][S.day % 3] }]);
    const n = D.npcs.find(q => q.id === id);
    LC.UI.dialog(n.lines.map(t => ({ who: n.name, text: t })), { onEnd: () => { if (!S.hints.includes(n.hint)) { S.hints.push(n.hint); toast('Journal updated: new hint.', 'good'); save(); } } });
  }
  function pickNote(i) { if (!S.notes.includes(i)) { S.notes.push(i); S.morale = Math.min(100, S.morale + 1); toast('Memory found: ' + D.notes[i].t, 'note'); save(); } }

  /* Sega offer happens mid-NV1 if the player chose curved surfaces */
  function checkStory() {
    if (S.phase === 'nv1' && S.arch === 'quad' && !S.flags.segaOffer && S.prog >= req() * .4) {
      S.flags.segaOffer = true;
      S.queue.push({ modal: () => LC.UI.menu({ title: 'Sega calls', sub: 'A console deal', closable: false,
        text: 'Sega wants NVIDIA to design the graphics chip for its next game console, based on NV1\'s curved surfaces. They will pay $2M up front.',
        actions: [
          { label: 'Sign with Sega (+$2M)', desc: 'Money now. A big promise to keep later.', fn: () => { S.cash += 2e6; S.flags.segaDeal = true; } },
          { label: 'Decline', desc: 'Stay focused on PCs.', fn: () => {} }] }) });
    }
  }

  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  /* ---------- era hooks used by the shared engine ---------- */
  function npcPlacement(S) {
    const founders = S.phase === 'idea' ? 'dennys' : 'nvidia', o = S.phase === 'idea' ? 3 : 3.5;
    return { chris: { loc: founders, dx: -o, dz: 2 }, curtis: { loc: founders, dx: o, dz: 2 }, lori: { loc: 'home', dx: 3, dz: 1.5 },
      wilf: S.flags.resigned ? null : { loc: 'lsi', dx: -4, dz: 1.5 } };
  }
  function hudHTML(S, bar) {
    const rw = runway();
      let h = `<div class="st"><small>Cash</small><b class="${company() && rw < 8 ? 'bad' : ''}">${money(S.cash)}</b></div>`;
      if (S.cash < 0 && S.graceUntil && S.day <= S.graceUntil) h += `<div class="st"><small>Payroll bounces</small><b class="bad">${S.graceUntil - S.day} days</b></div>`;
      else if (company()) h += `<div class="st"><small>Runway</small><b class="${rw < 8 ? 'bad' : ''}">${rw > 520 ? '10+ yrs' : Math.floor(rw) + ' wks'}</b></div><div class="st"><small>Team</small><b>${S.team}+3</b></div>`;
      h += `<div class="st w"><small>Energy</small>${bar(S.energy, S.energy < 25 ? 'red' : '')}</div>`;
      if (company()) h += `<div class="st w"><small>Morale</small>${bar(S.morale, S.morale < 30 ? 'red' : 'blue')}</div>`;
      if (building()) h += `<div class="st w"><small>Chip ${Math.floor(S.prog / req() * 100)}%</small>${bar(S.prog / req() * 100, 'green')}</div><div class="st"><small>Bugs</small><b>${bugText()}</b></div>`;
      if (S.deadline && (S.phase === 'riva' || S.phase === 'launch2')) { const wl = Math.ceil((S.deadline - S.day) / 7); h += `<div class="st"><small>Window</small><b class="${wl < 8 ? 'bad' : ''}">${wl} wks</b></div>`; }
    return h;
  }
  function summaryHTML(S) {
    return `<div class="yr">ERA 1 COMPLETE · ${dateStr()}</div><h2>RIVA 128 saves NVIDIA</h2>
      <p>The live demo runs flawlessly. Board makers line up. ${S.flags.cutFeatures ? 'It isn\'t the most impressive chip on the floor, but it ships on time and it works.' : 'It is the fastest 3D chip on the floor.'} In real life RIVA 128 sold about a million units in four months, and NVIDIA went public two years later.</p>
      <div class="grid2"><div><small>Days</small><b>${S.day}</b></div><div><small>Cash left</small><b>${money(S.cash)}</b></div>
      <div><small>Team</small><b>${S.team} + 3</b></div><div><small>Tape-outs</small><b>${S.stats.tapeouts}</b></div>
      <div><small>Blocks routed by hand</small><b>${S.stats.puzzles}</b></div><div><small>Times you collapsed</small><b>${S.stats.collapses}</b></div>
      <div><small>Laid off in 1996</small><b>${S.stats.layoffs}%</b></div><div><small>Memories found</small><b>${S.notes.length}/${D.notes.length}</b></div></div>
      <p class="mut small">Era 2 (1998–2008: GeForce, rivals, and the CUDA bet) is next.</p>`;
  }
  function deathStatsHTML(S) {
    return `<div><small>Days survived</small><b>${S.day}</b></div><div><small>Phase reached</small><b>${PHASES[S.phase]}</b></div>
      <div><small>Pitches given</small><b>${S.stats.pitches}</b></div><div><small>Weeks in the trenches</small><b>${S.stats.workWeeks}</b></div>`;
  }

  return { get, newRun, load, hasSave, save, wipe, money, dateStr, req, burnWeek, runway, rates, bugText, objective, realtime, advance,
    locationActions, npcTalk, pickNote, checkStory, eventActions, PHASES, building, company, setPhase, shuffle,
    npcPlacement, hudHTML, summaryHTML, deathStatsHTML };
})();
