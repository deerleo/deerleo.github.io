/* Era 2 simulation (1998–2008): market share vs rivals, Wall Street confidence, product races, the CUDA bet. */
LC.Sim = (() => {
  const D = LC.DATA, START = Date.UTC(1998, 0, 1), KEY = D.saveKey;
  const SEC_PER_DAY = 1.5, SALARY = 250000, HIRE_FEE = 30000, OVERHEAD = 40e6, SGA = .16;
  /* historical anchors (days since Jan 1, 1998) */
  const DAY = { ipo: 386, gfDeadline: 607, rivals: 790, threedfx: 1079, fx: 1673, nv40Start: 1977, nv40Deadline: 2295,
    cuda: 2953, g80Deadline: 3233, adopt: 3468, adoptEnd: 3651, crash: 3834, lehman: 3910, end: 4017 };
  const TAM = [1.2, 1.6, 2.2, 2.6, 3.0, 3.4, 4.0, 4.6, 5.4, 6.4, 7.2, 7.6]; // $B per year from 1998, game estimates
  const PROGRAMS = {
    geforce: { name: 'GeForce 256', base: 16, deadline: DAY.gfDeadline },
    nv40: { name: 'GeForce 6800', base: 18, deadline: DAY.nv40Deadline },
    g80: { name: 'GeForce 8800', base: 22, deadline: DAY.g80Deadline }
  };
  const PHASES = { foundry: '1998 · A foundry partner', ipo: '1999 · Going public', geforce: '1999 · The first GPU', rivals: '2000 · Rivals',
    fx: '2002–04 · The stumble', cuda: '2006–07 · The CUDA bet', crash: '2008 · The crash', won: 'Era complete' };
  let S = null, acc = 0;

  function fresh() {
    return { v: 1, day: 0, phase: 'foundry', cash: 60e6, team: 200, alloc: .6, morale: 65, energy: 100,
      share: 15, lead: -15, rivalRate: .035, conf: null, prog: 0, bugs: 0, program: null, taped: false, deadline: null, reqAdd: 0,
      cuda: null, devs: 0, qDays: 0, qRev: 0, lastQ: null, hype: false, lastAllHands: -99, lastLori: -99, lastPuzzle: -99, lastInvestor: -999, lastFund: -99,
      teamCost: 1, priceCut: 0, restDays: 0, flags: {}, notes: [], hints: [], events: [], queue: [], mem: {}, dead: null,
      stats: { puzzles: 0, workWeeks: 0, collapses: 0, tapeouts: 0, launches: 0, quartersBeat: 0, quartersMissed: 0 } };
  }
  const get = () => S;
  function newRun() { S = fresh(); save(); }
  function load() { try { const j = localStorage.getItem(KEY); if (j) { S = Object.assign(fresh(), JSON.parse(j)); return true; } } catch (e) {} return false; }
  function hasSave() { try { return !!localStorage.getItem(KEY); } catch (e) { return false; } }
  function save() { try { if (S && !S.dead) localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  function wipe() { try { localStorage.removeItem(KEY); } catch (e) {} }

  const money = n => { const a = Math.abs(n), s = n < 0 ? '-' : ''; return a >= 1e9 ? s + '$' + (a / 1e9).toFixed(2) + 'B' : a >= 1e6 ? s + '$' + (a / 1e6).toFixed(1) + 'M' : a >= 1e3 ? s + '$' + Math.round(a / 1e3) + 'K' : s + '$' + Math.round(a); };
  function dateStr(day) { const d = new Date(START + (day == null ? S.day : day) * 864e5); return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }); }
  const toast = (msg, kind) => S.queue.push({ toast: msg, kind });
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  /* ---------- economics ---------- */
  function tam(day) { const y = day / 365.25, i = Math.min(TAM.length - 2, Math.floor(y)), f = clamp(y - i, 0, 1); return (TAM[i] + (TAM[i + 1] - TAM[i]) * f) * 1e9 * (day >= DAY.lehman ? .62 : 1); }
  function margin() { return clamp(.38 + (S.flags.tsmc ? .04 : 0) - (S.cuda === 'all' ? .045 : S.cuda === 'pro' ? .015 : 0) - S.priceCut, .2, .6); }
  function revDay() { return S.share / 100 * tam(S.day) / 365 + (S.flags.xbox && S.day >= 1096 && S.day < 2191 ? 3e8 / 365 : 0); }
  function opexDay() { return (S.team * SALARY * S.teamCost + OVERHEAD) / 365 + revDay() * SGA; }
  const building = () => !!S.program && !S.taped;
  const company = () => true;
  function req() { if (!S.program) return 1; const base = { geforce: S.flags.tl ? 480 : 360, nv40: 2100, g80: 3300 }[S.program]; return base + S.reqAdd; }
  const moraleF = () => .4 + S.morale / 100;
  function rates() {
    const u = S.team / 10, prog = building() && S.restDays <= 0 ? u * S.alloc * moraleF() : 0;
    return { prog, gen: prog * .06, fix: building() ? u * (1 - S.alloc) * .1 * moraleF() : 0 };
  }
  const bugScale = () => req() / 150;
  function bugRisk() { const b = S.bugs / bugScale(); return b < .4 ? 'Low' : b < 1.2 ? 'Medium' : b < 2.4 ? 'High' : 'Severe'; }
  const bugText = () => bugRisk() + ' (est.)';
  function runway() { const net = (revDay() * margin() - opexDay()) * 7; return net >= 0 ? 999 : S.cash / -net; }

  /* ---------- time ---------- */
  function tickDay(o) {
    if (S.dead) return; o = o || {};
    S.day++;
    const rev = revDay(); S.cash += rev * margin() - opexDay();
    if (!o.quiet) S.lead -= S.rivalRate;
    const target = clamp(35 + S.lead * .9, 3, 62); S.share += (target - S.share) * .01;
    if (building()) {
      const r = rates();
      S.prog += r.prog / 7 + (o.work ? req() * .02 / 7 : 0);
      S.bugs = Math.max(0, S.bugs + (r.gen + (o.work ? req() * .002 : 0)) / 7 - r.fix / 7);
    }
    if (S.cuda && S.cuda !== 'none' && S.day >= DAY.cuda) S.devs += S.cuda === 'all' ? 12 : 3;
    if (o.quiet) return;
    if (S.restDays > 0) S.restDays--;
    S.energy = clamp(S.energy + (o.rest ? 40 : o.work ? -4.5 : -1.2), 0, 100);
    S.morale = clamp(S.morale + (60 - S.morale) * .01, 0, 100);
    if (S.flags.ipoDone) { S.qDays++; S.qRev += rev; if (S.qDays >= 91) quarter(); }
    if (S.day % 7 === 0) { if (S.morale < 25 && S.team > 20) { const q = Math.ceil(S.team * .03); S.team -= q; toast(`${q} engineers quit. Morale is low.`, 'bad'); } maybeEvent(); save(); }
    if (S.cash < 0) return die('broke');
    if (S.flags.ipoDone && S.conf <= 0) return die('board');
    if (S.share < 5) return die('market');
    if (S.energy <= 0 && !o.collapse) collapse();
  }
  function quiet(toDay) { while (S.day < toDay) tickDay({ quiet: true }); S.qDays = 0; S.qRev = 0; S.lastQ = null; S.hype = false; }
  function advance(days, o) { for (let i = 0; i < days && !S.dead; i++) tickDay(o); save(); }
  function realtime(dt) { acc += dt; while (acc >= SEC_PER_DAY && !S.dead) { acc -= SEC_PER_DAY; tickDay(); } }
  function die(reason) { if (!S.dead) { S.dead = reason; wipe(); } }
  function collapse() {
    S.stats.collapses++;
    S.queue.push({ modal: () => LC.UI.menu({ title: 'You collapsed', sub: 'Exhaustion', closable: false, text: 'You worked through one too many nights and woke up a week later. The company kept moving without you.', actions: [{ label: 'Get back to work', fn: () => {} }] }), teleportHome: true });
    for (let i = 0; i < 7 && !S.dead; i++) tickDay({ collapse: true });
    S.energy = 55; S.morale = Math.max(0, S.morale - 5);
  }

  /* ---------- Wall Street ---------- */
  function quarter() {
    const rev = S.qRev, prev = S.lastQ; S.qDays = 0; S.qRev = 0; S.lastQ = rev;
    if (prev == null) return;
    const expected = prev * 1.03 * (S.hype ? 1.12 : 1); S.hype = false;
    const diff = (rev / expected - 1) * 100;
    if (margin() < .40) { S.conf = Math.max(0, S.conf - 3); toast(`Analysts question your ${Math.round(margin() * 100)}% gross margin.`, 'bad'); }
    if (diff >= 0) { const g = Math.min(12, 4 + diff * .5); S.conf = clamp(S.conf + g, 0, 100); S.stats.quartersBeat++; toast(`Quarter beat expectations by ${diff.toFixed(1)}%. Confidence +${Math.round(g)}.`, 'good'); return; }
    S.stats.quartersMissed++;
    const pen = Math.min(25, 6 + -diff * .8), apply = f => { S.conf = clamp(S.conf - pen * f, 0, 100); };
    S.queue.push({ modal: () => LC.UI.menu({ title: `Missed the quarter by ${(-diff).toFixed(1)}%`, sub: 'Earnings call · ' + dateStr(), closable: false,
      text: `Revenue came in at ${money(rev)} against ${money(expected)} expected. Analysts are waiting. How do you handle the call?`,
      actions: [
        { label: 'Own the miss and lay out the long-term plan', desc: `Confidence −${Math.round(pen * .6)}. Honest; no promises you can't keep.`, fn: () => { apply(.6); S.morale = Math.min(100, S.morale + 2); } },
        { label: 'Promise next quarter will be huge', desc: `Confidence −${Math.round(pen * .25)} now, but next quarter's bar is 12% higher.`, fn: () => { apply(.25); S.hype = true; } },
        { label: 'Announce cost cuts', desc: `Confidence −${Math.round(pen * .5)}. Cuts 10% of engineers; morale −10.`, fn: () => { apply(.5); S.team = Math.round(S.team * .9); S.morale = Math.max(0, S.morale - 10); } }] }) });
  }

  /* ---------- events ---------- */
  function maybeEvent() {
    if (S.queue.some(q => q.event)) return;
    const pool = Object.keys(D.events).filter(id => !S.events.includes(id) && D.events[id].phases.includes(S.phase));
    if (!pool.length || Math.random() > .12) return;
    const id = pool[Math.floor(Math.random() * pool.length)]; S.events.push(id); S.queue.push({ event: id });
  }
  function eventActions(id) {
    return {
      poach: [
        { label: 'Match the offer', desc: '−$2M. Keeps them.', fn: () => { S.cash -= 2e6; S.morale += 2; } },
        { label: 'Talk about the mission', desc: '−15 energy. Maybe they stay.', disabled: S.energy < 15, fn: () => { S.energy -= 15; if (Math.random() < .65) toast('They stayed.', 'good'); else { S.morale -= 3; S.reqAdd += 20; toast('They left. The chip just got harder.', 'bad'); } } },
        { label: 'Let them go', desc: 'Morale −4; the chip needs more work.', fn: () => { S.morale -= 4; S.reqAdd += 30; } }],
      burnout: [
        { label: 'Give everyone a week off', desc: 'No chip progress for 7 days, morale +15.', fn: () => { S.restDays = 7; S.morale += 15; } },
        { label: 'Push through', desc: 'Progress now, morale −12, more bugs.', fn: () => { S.prog += req() * .02; S.morale -= 12; S.bugs += bugScale() * .3; } }],
      lori: [
        { label: 'Go home tonight', desc: 'Lose a day. +25 energy.', fn: () => { advance(1); S.energy = Math.min(100, S.energy + 25); } },
        { label: 'Stay at the office', desc: 'Energy −10.', fn: () => { S.energy -= 10; } }],
      leak: [
        { label: 'Rally the team', desc: 'All-hands: morale +10, energy −12.', fn: () => { S.morale += 10; S.energy -= 12; } },
        { label: 'Cut features to ship sooner', desc: 'The chip needs 10% less work, but launches weaker.', fn: () => { S.reqAdd -= Math.round(req() * .1); S.flags.cut = true; } }],
      pricewar: [
        { label: 'Match the price cut', desc: 'Protects share; gross margin −2 points for good.', fn: () => { S.priceCut += .02; S.lead += 4; } },
        { label: 'Hold your price', desc: 'Margins safe; you lose ground to the rival.', fn: () => { S.lead -= 6; } }],
      cadence: [
        { label: 'Adopt the six-month cadence', desc: 'Engineering costs +10%, but rivals gain on you a third more slowly.', fn: () => { S.teamCost *= 1.1; S.rivalRate = .024; S.flags.cadence = true; } },
        { label: 'Keep one big team', desc: 'Cheaper. Rivals keep their pace.', fn: () => {} }]
    }[id];
  }

  /* ---------- objectives ---------- */
  function objective() {
    const f = S.flags, P = S.program && PROGRAMS[S.program];
    if (P && S.taped) return { text: `Launch ${P.name} at the Launch Hall`, target: 'expo' };
    if (P && building()) return S.prog >= req() ? { text: `${P.name} is ready. Tape it out at HQ`, target: 'nvidia' }
      : { text: `Build ${P.name} · ${Math.floor(S.prog / req() * 100)}% · ${Math.max(0, Math.ceil((S.deadline - S.day) / 7))} weeks to the launch window`, target: 'nvidia' };
    switch (S.phase) {
      case 'foundry': return { text: 'Fly to Taiwan and win TSMC as a partner', target: 'airport' };
      case 'ipo': return { text: 'Fly to New York for the IPO roadshow', target: 'airport' };
      case 'geforce': return { text: 'Go to HQ: decide what GeForce 256 will be', target: 'nvidia' };
      case 'rivals': return !f.xbox && !f.xboxTried ? { text: 'Fly to Redmond: win the Xbox graphics chip', target: 'airport' } : { text: '3dfx is collapsing. Decide its fate', target: 'threedfx' };
      case 'fx': return { text: 'Go to HQ: GeForce FX is in trouble. Decide what to do', target: 'nvidia' };
      case 'cuda': return !S.cuda ? { text: 'Hear Ian Buck\'s idea outside HQ', target: 'nvidia' }
        : { text: `Grow CUDA until 2008 · ${Math.round(S.devs).toLocaleString()} developers (goal 10,000)`, target: 'stanford' };
      case 'crash': return S.day < DAY.lehman ? { text: 'Hold the company together through 2008', target: 'nvidia' }
        : !f.boardDone ? { text: 'Face the board at HQ', target: 'nvidia' } : { text: `Survive to the end of 2008 · ${Math.max(0, DAY.end - S.day)} days`, target: 'home' };
      default: return { text: 'Era complete', target: null };
    }
  }

  /* ---------- phase transitions ---------- */
  function setPhase(p) { S.phase = p; LC.World.setMood(p); LC.World.syncNPCs(S); save(); }
  function startProgram(key, minTeam) {
    S.program = key; S.prog = 0; S.bugs = 0; S.taped = false; S.reqAdd = 0; S.flags.cut = false;
    S.team = Math.max(S.team, minTeam); S.deadline = PROGRAMS[key].deadline;
  }
  function menu(title, sub, text, label, fn) { LC.UI.menu({ title, sub, text, closable: false, actions: [{ label, fn: fn || (() => {}) }] }); }

  function afterTSMC(ok) {
    S.flags.tsmc = ok; S.flags.tsmcDone = true;
    quiet(365); S.share = Math.max(S.share, 20); S.lead = -12; setPhase('ipo');
    menu(ok ? 'A partnership for decades' : 'No deal, for now', dateStr(), (ok ? 'TSMC commits capacity to NVIDIA. Better yields mean better margins on every chip. ' : 'You leave Taiwan without the capacity you wanted. Margins will be thinner. ')
      + '1998 passes: RIVA TNT ships and sells. Now it is time to take NVIDIA public.', 'Continue');
  }
  function afterIPO(m) {
    quiet(DAY.ipo); S.flags.ipoDone = true; S.cash += 42e6; S.conf = clamp(Math.round(30 + (m - 40) * .55), 20, 70);
    startProgram('geforce', 250); setPhase('geforce');
    menu('NVIDIA goes public', dateStr(), `The IPO prices at $12 a share and raises about $42 million. Wall Street confidence starts at ${S.conf}. From now on, every quarter is a test. Next: a chip that changes what graphics cards are.`, 'Go to work');
  }
  function launch() {
    const P = PROGRAMS[S.program], timing = clamp(Math.round((S.deadline - S.day) / 15), -15, 8);
    const q = P.base + (S.program === 'geforce' && S.flags.tl ? 12 : 0) + (S.program === 'geforce' && S.flags.devRel ? 3 : 0) + (S.program === 'g80' && S.cuda === 'all' ? 4 : 0) + timing - (S.flags.cut ? 6 : 0);
    S.lead += q; S.morale = Math.min(100, S.morale + 12); S.conf = clamp(S.conf + 4, 0, 100); S.stats.launches++;
    const name = P.name, key = S.program; S.program = null; S.taped = false; S.deadline = null;
    const txt = { geforce: 'You call it something new: the world\'s first GPU. ', nv40: 'GeForce 6800 is fast, and it works. Reviewers say NVIDIA is back. ', g80: 'GeForce 8800 is a monster, and inside every one is CUDA. ' }[key];
    menu(`${name} launches`, dateStr(), `${txt}${timing >= 0 ? 'On time.' : `${-timing * 15} days late, and rivals noticed.`} Launch strength ${q}. Your lead over rivals is now ${Math.round(S.lead)}.`, 'Continue', () => {
      if (key === 'geforce') { quiet(DAY.rivals); setPhase('rivals'); menu('2000', dateStr(), 'GeForce made NVIDIA the company to beat. Microsoft is building a game console. And 3dfx, your old rival, is in trouble.', 'Continue'); }
      else if (key === 'nv40') { quiet(DAY.cuda); S.team = Math.max(S.team, 1500); setPhase('cuda'); menu('2006', dateStr(), 'NVIDIA is back on top. A Stanford researcher who joined you, Ian Buck, has an idea he wants to show you. He\'s waiting outside HQ.', 'Continue'); }
      else if (key === 'g80') { quiet(DAY.adopt); menu('2007', dateStr(), 'CUDA is out in the world. Almost nobody uses it yet, and the cost shows up in every quarter\'s margin. Grow it: teach it, fund it, and keep Wall Street from losing patience.', 'Continue'); }
    });
  }
  function toCrash() {
    S.conf = clamp(S.conf + (S.devs >= 10000 ? 8 : -6), 0, 100); S.flags.momentum = S.devs >= 10000;
    quiet(DAY.crash); setPhase('crash');
    LC.UI.menu({ title: 'Faulty chips', sub: dateStr(), closable: false,
      text: `${S.flags.momentum ? 'CUDA has real momentum going into 2008. ' : 'CUDA adoption is slower than you hoped. '}Then bad news: some NVIDIA laptop chips are failing in the field because of a materials problem. Customers are angry.`,
      actions: [
        { label: 'Take the charge and fix every affected laptop', desc: '−$200M and confidence −8 now. The honest way.', fn: () => { S.cash -= 2e8; S.conf = clamp(S.conf - 8, 0, 100); S.flags.honestDefect = true; } },
        { label: 'Blame the materials supplier and fight the claims', desc: '−$50M now. If it comes out later, it will cost more.', fn: () => { S.cash -= 5e7; S.conf = clamp(S.conf - 2, 0, 100); S.flags.dodged = true; } }] });
  }
  function checkStory() {
    if (!S || S.dead) return;
    if (S.phase === 'cuda' && S.cuda && !S.program && S.day >= DAY.adoptEnd && !S.flags.toCrash) { S.flags.toCrash = true; S.queue.push({ modal: toCrash }); }
    if (S.phase === 'crash' && S.day >= DAY.lehman && !S.flags.lehman) {
      S.flags.lehman = true;
      if (S.flags.dodged) S.conf = clamp(S.conf - 15, 0, 100);
      S.queue.push({ modal: () => menu('September 15, 2008', 'Lehman Brothers collapses', `The financial system seizes up. PC sales fall off a cliff and so does NVIDIA's stock.${S.flags.dodged ? ' Worse: reporters now say NVIDIA hid the laptop chip problem. Confidence −15.' : ''} The board wants to meet.`, 'Continue') });
    }
    if (S.phase === 'crash' && S.day >= DAY.end && S.flags.boardDone && !S.flags.won) { S.flags.won = true; S.phase = 'won'; wipe(); S.queue.push({ modal: () => LC.Main.win() }); }
  }

  /* ---------- decisions ---------- */
  function tlChoice() {
    LC.UI.menu({ title: 'What is GeForce 256?', sub: 'The defining decision', closable: false,
      text: 'Today the CPU does the transform and lighting math for every 3D vertex. Your architects want to move it onto the graphics chip. It would be the first chip that does the whole 3D pipeline: a "GPU".',
      actions: [
        { label: 'Put transform & lighting on the chip', desc: 'Much harder (480 work). Far stronger launch. What NVIDIA really did.', fn: () => { S.flags.tl = true; S.flags.tlDecided = true; save(); } },
        { label: 'Keep it a faster version of today\'s chip', desc: 'Easier (360 work). A weaker launch.', fn: () => { S.flags.tl = false; S.flags.tlDecided = true; save(); } }] });
  }
  function fxChoice() {
    S.lead -= 25;
    LC.UI.menu({ title: 'GeForce FX is in trouble', sub: dateStr(), closable: false,
      text: 'ATI\'s Radeon 9700 is out and it is excellent. Your answer, GeForce FX, is late, runs hot, and its cooling fan is so loud reviewers mock it. What do you do?',
      actions: [
        { label: 'Ship it, and admit its flaws publicly', desc: 'Some ground back now; confidence −4; the team respects it (morale +4).', fn: () => { S.lead += 6; S.conf = clamp(S.conf - 4, 0, 100); S.morale += 4; S.flags.fxHonest = true; fxNext(); } },
        { label: 'Ship it and insist it\'s the fastest', desc: 'Some ground back; reviewers contradict you (confidence −8, morale −4).', fn: () => { S.lead += 6; S.conf = clamp(S.conf - 8, 0, 100); S.morale -= 4; fxNext(); } },
        { label: 'Cancel it and pour everything into the next chip', desc: 'No product for a year (confidence −10), but the next chip is 15% easier.', fn: () => { S.conf = clamp(S.conf - 10, 0, 100); S.flags.fxCancel = true; fxNext(); } }] });
  }
  function fxNext() {
    S.flags.fxDecided = true;
    quiet(DAY.nv40Start); startProgram('nv40', 900); if (S.flags.fxCancel) S.reqAdd = -315;
    menu('The comeback chip', dateStr(), `Your next chip, GeForce 6800, has to win back the market. It must launch by ${dateStr(DAY.nv40Deadline)}. Every day without it, rivals pull further ahead.`, 'Build it');
  }
  function ianTalk() {
    if (S.cuda) return LC.UI.dialog([{ who: 'Ian Buck', text: S.cuda === 'none' ? 'Maybe someday.' : `${Math.round(S.devs).toLocaleString()} developers so far. Every one of them is a scientist who couldn't do this before.` }]);
    LC.UI.dialog([
      { who: 'Ian Buck', text: 'At Stanford we made graphics cards do physics and math by pretending our data was textures. It was miserable, but it was fast. Ridiculously fast.' },
      { who: 'Ian Buck', text: 'What if programmers could just write C for the GPU? Every GeForce in every gamer\'s PC becomes a parallel computer.' },
      { who: 'Jensen', text: 'It would make every chip bigger and more expensive, for software nobody uses yet.' },
      { who: 'Ian Buck', text: 'Yes. For years, probably. Do we do it?' }
    ], { choices: [
      { label: 'Put CUDA in every GeForce we ship', fn: () => cudaPick('all') },
      { label: 'Only in professional cards, to protect margins', fn: () => cudaPick('pro') },
      { label: 'Not now. Gaming pays the bills', fn: () => cudaPick('none') }] });
  }
  function cudaPick(c) {
    S.cuda = c; S.flags.cudaDecided = true; startProgram('g80', 1500);
    S.reqAdd = c === 'all' ? 300 : c === 'pro' ? 100 : 0;
    menu(c === 'all' ? 'Every GPU becomes a computer' : c === 'pro' ? 'A careful bet' : 'Shelved', dateStr(),
      (c === 'all' ? 'Gross margin drops 4.5 points for years, and analysts will ask about it every quarter. Historically, this is the bet NVIDIA made. '
        : c === 'pro' ? 'Margins take a small hit. Fewer developers will ever see CUDA. '
        : 'Wall Street will be pleased. History went the other way. ')
      + `Now build GeForce 8800 by ${dateStr(DAY.g80Deadline)}.`, 'Build it');
  }
  function threedfxChoice() {
    LC.UI.menu({ title: '3dfx is collapsing', sub: 'December 2000', closable: false,
      text: 'The company that once owned PC gaming is out of money. Its patents, brands and engineers are up for grabs. If you don\'t move, someone else will.',
      actions: [
        { label: 'Buy 3dfx\'s assets (about $70M)', desc: 'Its engineers join you (+100). A real edge. What NVIDIA really did.', disabled: S.cash < 7e7, fn: () => { S.cash -= 7e7; S.team += 100; S.lead += 6; fxGo(true); } },
        { label: 'Let it fall', desc: 'Save the money. Rivals hire its best people.', fn: () => { S.lead -= 6; fxGo(false); } }] });
  }
  function fxGo(bought) {
    S.flags.threedfxDone = true; quiet(Math.max(S.day, DAY.threedfx));
    quiet(DAY.fx); S.team = Math.max(S.team, 900); setPhase('fx');
    menu(bought ? 'The rival comes home' : 'The rival is gone', dateStr(), `${bought ? 'Former 3dfx engineers walk into NVIDIA. ' : ''}2001 and 2002 go well: Xbox ships, GeForce sells. Then a new rival, ATI, gets ready to strike. Go to HQ.`, 'Continue');
  }

  /* ---------- battles ---------- */
  function battle(key, cb) {
    const B = D.battles[key];
    const rounds = B.rounds.map(r => ({ q: r.q, a: r.a.map(a => ({ ...a, d: a.honest ? (S.flags.honestDefect ? a.d : -5) : a.d })) }));
    LC.Games.battle({ title: B.title, who: B.who, meter: B.meter, start: B.start + (key === 'board' && S.flags.momentum ? 10 : 0), pass: B.pass, rounds, time: B.time }, cb);
  }
  function investorDay() {
    const pool = D.analystQs.filter(q => !q.cuda || S.cuda), qs = shuffle(pool.slice()).slice(0, 3);
    S.lastInvestor = S.day; S.cash -= 30000; advance(3);
    LC.Games.battle({ title: 'Investor day · New York', who: 'Analysts', meter: 'Confidence', start: 40, pass: 60, rounds: qs, time: 14 }, (ok, m, picks) => {
      advance(2); if (picks.some(p => p.hype)) S.hype = true;
      const g = ok ? 8 : -6; S.conf = clamp(S.conf + g, 0, 100);
      menu(ok ? 'The Street is listening' : 'A rough day', 'Investor day', `Confidence ${g > 0 ? '+' : ''}${g}.`, 'Fly home');
    });
  }

  /* ---------- places ---------- */
  function hqActions() {
    const L = D.locations.nvidia, acts = [];
    if (S.phase === 'geforce' && !S.flags.tlDecided) { tlChoice(); return null; }
    if (S.phase === 'fx' && !S.flags.fxDecided) { fxChoice(); return null; }
    acts.push({ label: 'Manage the team', desc: 'Hire, let go, and split engineers between design and verification.', fn: manage });
    if (building()) {
      acts.push({ label: 'Work in the lab with the chip team (7 days)', desc: '+2% progress, −32 energy. You add bugs when tired.', disabled: S.energy < 25, fn: () => { S.stats.workWeeks++; advance(7, { work: true }); toast('A week in the lab.'); } });
      const wait = 14 - (S.day - S.lastPuzzle);
      acts.push({ label: 'Solve a design block (chip routing puzzle)', desc: wait > 0 ? `Next block ready in ${wait} days.` : 'Win: +3% progress, fewer bugs. Costs 3 days, 15 energy.', disabled: wait > 0 || S.energy < 15, fn: puzzle });
      const ah = S.day - S.lastAllHands >= 14;
      acts.push({ label: 'Hold an all-hands meeting', desc: ah ? 'Morale +12, −10 energy, 1 day.' : `Again in ${14 - (S.day - S.lastAllHands)} days.`, disabled: !ah || S.energy < 10, fn: () => { S.lastAllHands = S.day; S.morale = Math.min(100, S.morale + 12); S.energy -= 10; advance(1); } });
      if (S.prog >= req()) acts.push({ label: `Tape out ${PROGRAMS[S.program].name}`, desc: 'Send it to TSMC. Hidden bugs mean a costly respin.', fn: tapeout });
    }
    if (S.phase === 'cuda' && S.cuda && S.cuda !== 'none' && !S.program) {
      const w = 30 - (S.day - S.lastFund);
      acts.push({ label: 'Fund a university CUDA program ($25M)', desc: w > 0 ? `Next round in ${w} days.` : `+${S.cuda === 'all' ? 1500 : 500} developers. Margins notice.`, disabled: w > 0 || S.cash < 25e6, fn: () => { S.lastFund = S.day; S.cash -= 25e6; S.devs += S.cuda === 'all' ? 1500 : 500; advance(1); toast('Grants go out to labs worldwide.', 'good'); } });
    }
    if (S.phase === 'crash' && S.day >= DAY.lehman && !S.flags.boardDone)
      acts.push({ label: 'Face the board', desc: 'They want to cut CUDA. Convince them not to.', fn: () => battle('board', ok => { S.flags.boardDone = true; S.conf = clamp(S.conf + (ok ? 10 : -15), 0, 100); menu(ok ? 'The board holds' : 'The board is shaken', dateStr(), ok ? 'They stay with the plan. CUDA lives. Now get the company to the end of the year.' : 'You keep CUDA, barely, but confidence takes a hit. Hold on until year end.', 'Continue'); }) });
    return { title: L.name, sub: PHASES[S.phase], text: `${S.team.toLocaleString()} engineers. Market share ${S.share.toFixed(1)}%. Gross margin ${Math.round(margin() * 100)}%.`, actions: acts };
  }
  function manage() {
    const UI = LC.UI;
    const render = () => {
      const r = rates(), left = Math.max(0, req() - S.prog), eta = r.prog > 0 ? Math.ceil(left / r.prog) : '∞';
      UI.show(`<div class="yr">MANAGE THE TEAM</div><h2>${S.team.toLocaleString()} engineers</h2>
        <div class="grid2">
          <div><small>Engineering cost / year</small><b>${money(S.team * SALARY * S.teamCost)}</b></div><div><small>Cash</small><b>${money(S.cash)}</b></div>
          <div><small>Chip progress / week</small><b>${building() ? r.prog.toFixed(1) : '—'}</b></div><div><small>Weeks to finish</small><b>${building() ? eta : '—'}</b></div>
          <div><small>Weeks to launch window</small><b>${S.deadline ? Math.ceil((S.deadline - S.day) / 7) : '—'}</b></div><div><small>Bug risk</small><b>${building() ? bugText() : '—'}</b></div>
        </div>
        <div class="row"><button data-h="10">Hire 10</button><button data-h="50">Hire 50</button><button data-h="-10">Let 10 go</button><button data-h="-50">Let 50 go</button></div>
        <p class="mut small">Hiring costs ${money(HIRE_FEE)} each up front, then ${money(SALARY)}/year. Letting people go hurts morale.</p>
        <label class="lbl">Design ${Math.round(S.alloc * 100)}% · Verification ${Math.round((1 - S.alloc) * 100)}%</label>
        <input type="range" id="alloc" min="10" max="95" step="5" value="${Math.round(S.alloc * 100)}">
        <button class="ghost" data-x>Done (Esc)</button>`, { closable: true });
      document.querySelectorAll('[data-h]').forEach(b => b.onclick = () => {
        const n = +b.dataset.h;
        if (n > 0) { S.cash -= HIRE_FEE * n; S.team += n; } else { const k = Math.min(S.team - 20, -n); S.team -= k; S.morale = Math.max(0, S.morale - .15 * k); }
        render();
      });
      document.getElementById('alloc').oninput = e => { S.alloc = +e.target.value / 100; render(); };
      document.querySelector('[data-x]').onclick = () => { save(); UI.close(); };
    };
    render();
  }
  function puzzle() {
    S.energy -= 15; S.lastPuzzle = S.day;
    LC.Games.routing({ n: 7, k: 7, time: 120, title: 'Design block · route the signals' }, ok => {
      advance(3);
      if (ok) { S.prog += req() * .03; S.bugs = Math.max(0, S.bugs - bugScale() * .3); S.stats.puzzles++; toast('Block routed cleanly.', 'good'); }
      else toast('The block is still a mess. Three days gone.', 'bad');
    });
  }
  function tapeout() {
    const p = Math.exp(-S.bugs / bugScale()), P = PROGRAMS[S.program];
    LC.UI.menu({ title: 'Tape out?', sub: P.name, text: `Verification estimates bug risk as ${bugRisk().toLowerCase()}. A failed chip costs ${money(req() * 20000)} and 7 weeks.`,
      actions: [
        { label: 'Tape out now', fn: () => {
          S.stats.tapeouts++;
          if (Math.random() < p) { S.taped = true; S.morale = Math.min(100, S.morale + 8); menu('First silicon works', P.name, 'The chips come back from TSMC and boot. Take it to the Launch Hall.', 'Continue'); }
          else { S.cash -= req() * 20000; S.bugs *= .45; advance(49); S.morale -= 8; menu('The silicon is broken', 'Respin', 'Bugs you didn\'t catch. Another run through the fab, seven weeks gone, and rivals keep shipping.', 'Fix it'); }
        } },
        { label: 'Not yet', desc: 'Keep verifying.', fn: () => {} }] });
  }

  function locationActions(id) {
    const L = D.locations[id], f = S.flags;
    if (id === 'nvidia') return hqActions();
    if (id === 'home') return { title: L.name, sub: L.sub, text: 'Lori is still up.', actions: [
      { label: 'Sleep (2 days)', desc: 'Restore energy.', fn: () => { advance(2, { rest: true }); toast('Rested.', 'good'); } },
      { label: 'Dinner with Lori (1 day)', desc: S.day - S.lastLori >= 21 ? '+energy, +morale.' : `You had dinner together ${S.day - S.lastLori} days ago.`, disabled: S.day - S.lastLori < 21, fn: () => { S.lastLori = S.day; advance(1, { rest: true }); S.morale = Math.min(100, S.morale + 5); LC.UI.dialog([{ who: 'Lori Huang', text: S.phase === 'crash' ? 'We\'ve been through worse. Remember 1996?' : 'Look at what you built. Now come home sometimes.' }]); } }] };
    if (id === 'dennys') return { title: L.name, sub: L.sub, text: 'The same booth. Bigger company.', actions: [{ label: 'Coffee and pie ($12)', desc: '+8 energy.', fn: () => { S.cash -= 12; S.energy = Math.min(100, S.energy + 8); } }] };
    if (id === 'airport') {
      const acts = [];
      if (S.phase === 'foundry') acts.push({ label: 'Fly to Taiwan to meet Morris Chang (5 days)', fn: () => { advance(5); battle('tsmc', ok => afterTSMC(ok)); } });
      if (S.phase === 'ipo') acts.push({ label: 'Fly to New York for the IPO roadshow', fn: () => { advance(3); battle('roadshow', (ok, m) => afterIPO(m)); } });
      if (S.phase === 'rivals' && !f.xbox && !f.xboxTried) acts.push({ label: 'Fly to Redmond to pitch Microsoft (2 days)', fn: () => { advance(2); battle('xbox', (ok, m, picks) => {
        f.xboxTried = true; f.xbox = ok;
        if (ok) { S.cash += 1.5e8; S.conf = clamp(S.conf + 8, 0, 100); if (picks.some(p => p.divert)) S.lead -= 5; }
        else S.conf = clamp(S.conf - 5, 0, 100);
        menu(ok ? 'NVIDIA will power the Xbox' : 'Microsoft goes another way', dateStr(), ok ? 'A large advance and years of console revenue. Confidence +8.' : 'You fly home without the deal. In real life NVIDIA won it.', 'Continue'); }); } });
      if (f.ipoDone && !['foundry', 'ipo'].includes(S.phase)) {
        const w = 120 - (S.day - S.lastInvestor);
        acts.push({ label: 'Fly to New York for an investor day (5 days)', desc: w > 0 ? `Next one in ${w} days.` : 'Face the analysts. Win confidence, or lose it.', disabled: w > 0, fn: investorDay });
      }
      return { title: L.name, sub: L.sub, text: acts.length ? 'Where to?' : 'No trips planned.', actions: acts };
    }
    if (id === 'expo') {
      if (S.program && S.taped) return { title: L.name, sub: 'Launch day', text: 'Press, retailers, rivals. One shot.', actions: [{ label: `Launch ${PROGRAMS[S.program].name}`, fn: launch }] };
      return { title: L.name, sub: L.sub, text: 'Empty between launches.', actions: [] };
    }
    if (id === 'threedfx') {
      if (S.phase === 'rivals' && f.xboxTried && !f.threedfxDone) return { title: L.name, sub: 'Late 2000', text: 'The lobby still has Voodoo trophies. Half the offices are empty.', actions: [{ label: 'Decide 3dfx\'s fate', fn: threedfxChoice }] };
      return { title: L.name, sub: L.sub, text: f.threedfxDone ? 'The sign is coming down.' : 'The company that owns PC gaming. For now.', actions: [] };
    }
    if (id === 'studio') {
      if (S.phase === 'geforce' && S.flags.tl && !f.devRel && building()) return { title: L.name, sub: L.sub, text: 'Developers crowd around a prototype.', actions: [{ label: 'Show them hardware transform & lighting (2 days)', desc: 'Games that use it make GeForce 256 launch stronger.', fn: () => { f.devRel = true; advance(2); toast('Developers are excited. Launch strength +3.', 'good'); } }] };
      return { title: L.name, sub: L.sub, text: 'Someone is playing your chip\'s demo on loop.', actions: [] };
    }
    if (id === 'store') return { title: L.name, sub: L.sub, text: `NVIDIA cards hold about ${Math.round(S.share)}% of the shelf. ${S.lead >= 0 ? 'Gamers are asking for them by name.' : 'Gamers keep picking up a rival\'s box.'}`, actions: [{ label: 'Watch gamers in the aisle (1 day)', desc: '+8 energy, +2 morale.', fn: () => { advance(1); S.energy = Math.min(100, S.energy + 8); S.morale = Math.min(100, S.morale + 2); } }] };
    if (id === 'stanford') {
      if (S.phase === 'cuda' && S.cuda && S.cuda !== 'none' && !S.program) return { title: L.name, sub: L.sub, text: 'A lecture hall, a projector, and fifty skeptical grad students.', actions: [{ label: 'Teach a CUDA workshop (3 days)', desc: `+${S.cuda === 'all' ? 600 : 200} developers. −12 energy.`, disabled: S.energy < 12, fn: () => { S.energy -= 12; advance(3); S.devs += S.cuda === 'all' ? 600 : 200; toast('A room full of new CUDA programmers.', 'good'); } }] };
      return { title: L.name, sub: L.sub, text: 'Students hacking graphics cards to do science.', actions: [] };
    }
    return { title: L.name, sub: L.sub, text: '', actions: [] };
  }

  function npcTalk(id) {
    if (id === 'ian') return ianTalk();
    if (id === 'lori') return LC.UI.dialog([{ who: 'Lori Huang', text: ['Did you eat today?', 'You look tired. Proud of you, though.', 'The kids asked when you\'re coming home.'][S.day % 3] }]);
    if (id === 'chris' || id === 'curtis') {
      const who = id === 'chris' ? 'Chris Malachowsky' : 'Curtis Priem';
      const lines = [];
      if (building()) { const r = rates(), eta = r.prog > 0 ? Math.ceil((req() - S.prog) / r.prog) : null; lines.push({ who, text: eta ? `At this pace the chip needs ${eta} more weeks. The launch window closes in ${Math.ceil((S.deadline - S.day) / 7)}.` : 'Nobody is designing. The chip isn\'t moving.' }); lines.push({ who, text: `Verification says bug risk is ${bugRisk().toLowerCase()}.` }); }
      else lines.push({ who, text: S.lead >= 0 ? 'We\'re ahead. Every day we don\'t ship, that shrinks.' : 'We\'re behind. The next chip has to be great.' });
      if (S.conf != null) lines.push({ who, text: `Wall Street confidence is ${Math.round(S.conf)}. ${S.conf < 30 ? 'That\'s dangerously low.' : ''}` });
      return LC.UI.dialog(lines);
    }
    const n = D.npcs.find(q => q.id === id);
    LC.UI.dialog(n.lines.map(t => ({ who: n.name, text: t })), { onEnd: () => { if (!S.hints.includes(n.hint)) { S.hints.push(n.hint); toast('Journal updated: new hint.', 'good'); save(); } } });
  }
  function pickNote(i) { if (!S.notes.includes(i)) { S.notes.push(i); toast('Memory found: ' + D.notes[i].t, 'note'); save(); } }

  /* ---------- engine hooks ---------- */
  function npcPlacement(S) {
    const p = { chris: { loc: 'nvidia', dx: -4, dz: 2 }, lori: { loc: 'home', dx: 3, dz: 1.5 } };
    if (['foundry', 'ipo', 'geforce', 'rivals'].includes(S.phase)) p.curtis = { loc: 'nvidia', dx: 4, dz: 2 };
    if (['cuda', 'crash', 'won'].includes(S.phase)) p.ian = { loc: 'nvidia', dx: 5, dz: 3 };
    return p;
  }
  function hudHTML(S, bar) {
    let h = `<div class="st"><small>Cash</small><b class="${S.cash < 5e7 ? 'bad' : ''}">${money(S.cash)}</b></div>`;
    h += `<div class="st"><small>Market share</small><b class="${S.share < 12 ? 'bad' : ''}">${S.share.toFixed(1)}%</b></div>`;
    if (S.conf != null) h += `<div class="st w"><small>Wall Street ${Math.round(S.conf)}</small>${bar(S.conf, S.conf < 25 ? 'red' : 'blue')}</div>`;
    h += `<div class="st"><small>Margin</small><b class="${margin() < .4 ? 'bad' : ''}">${Math.round(margin() * 100)}%</b></div>`;
    h += `<div class="st w"><small>Energy</small>${bar(S.energy, S.energy < 25 ? 'red' : '')}</div>`;
    h += `<div class="st w"><small>Morale</small>${bar(S.morale, S.morale < 30 ? 'red' : 'blue')}</div>`;
    if (building()) h += `<div class="st w"><small>${PROGRAMS[S.program].name} ${Math.floor(S.prog / req() * 100)}%</small>${bar(S.prog / req() * 100, 'green')}</div><div class="st"><small>Bugs</small><b>${bugText()}</b></div>`;
    if (S.deadline && S.program) { const wl = Math.ceil((S.deadline - S.day) / 7); h += `<div class="st"><small>Window</small><b class="${wl < 6 ? 'bad' : ''}">${wl} wks</b></div>`; }
    if (S.cuda && S.cuda !== 'none') h += `<div class="st"><small>CUDA devs</small><b>${Math.round(S.devs).toLocaleString()}</b></div>`;
    return h;
  }
  function summaryHTML(S) {
    const bet = S.cuda === 'all' ? 'You put CUDA in every GPU and kept it alive through the crash, exactly the bet that history rewarded.' : S.cuda === 'pro' ? 'You kept CUDA alive, carefully. History shows the bigger bet paid off.' : 'You shelved CUDA. NVIDIA survived, but history went the other way: the bet you skipped became the foundation of modern AI.';
    return `<div class="yr">ERA 2 COMPLETE · ${dateStr()}</div><h2>NVIDIA survives 2008</h2><p>${bet}</p>
      <div class="grid2"><div><small>Market share</small><b>${S.share.toFixed(1)}%</b></div><div><small>Wall Street confidence</small><b>${Math.round(S.conf)}</b></div>
      <div><small>CUDA developers</small><b>${Math.round(S.devs).toLocaleString()}</b></div><div><small>Cash</small><b>${money(S.cash)}</b></div>
      <div><small>Chips launched</small><b>${S.stats.launches}</b></div><div><small>Quarters beat / missed</small><b>${S.stats.quartersBeat} / ${S.stats.quartersMissed}</b></div>
      <div><small>Blocks routed by hand</small><b>${S.stats.puzzles}</b></div><div><small>Memories found</small><b>${S.notes.length}/${D.notes.length}</b></div></div>`;
  }
  function deathStatsHTML(S) {
    return `<div><small>Reached</small><b>${PHASES[S.phase]}</b></div><div><small>Market share</small><b>${S.share.toFixed(1)}%</b></div>
      <div><small>Wall Street</small><b>${S.conf == null ? '—' : Math.round(S.conf)}</b></div><div><small>Chips launched</small><b>${S.stats.launches}</b></div>`;
  }

  return { get, newRun, load, hasSave, save, wipe, money, dateStr, req, rates, bugText, runway, objective, realtime, advance,
    locationActions, npcTalk, pickNote, checkStory, eventActions, PHASES, building, company, setPhase, shuffle,
    npcPlacement, hudHTML, summaryHTML, deathStatsHTML, margin, DAY, _debug: { quiet, launch, startProgram } };
})();
