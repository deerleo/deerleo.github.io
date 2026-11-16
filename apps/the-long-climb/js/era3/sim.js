/* Era 3 simulation (Oct 2012 – Nov 2026): the AI pivot, product races, crashes, the supply race after ChatGPT. */
LC.Sim = (() => {
  const D = LC.DATA, START = Date.UTC(2012, 9, 1), KEY = D.saveKey;
  const SEC_PER_DAY = 1.5, SALARY = 200000, HIRE_FEE = 50000, OVERHEAD = 3e8, SGA = .1;
  /* historical anchors (days since Oct 1, 2012) */
  const DAY = { pascalStart: 973, gtc2016: 1282, delivery: 1400, crypto: 2236, mellanox: 2352, arm: 2904, armEnd: 3417, export: 3658, chatgpt: 3712, trillion: 3893, chatgptEnd: 4108, blackwellStart: 4186, flaw: 4336, blackwellShip: 4474, deepseek: 4501, h20: 4579, rubinStart: 4615, fourT: 4664, fiveT: 4776, rubinSamples: 4895, gtc2026: 4915, resign: 5155 };
  const TAM = { 2012: 7, 2013: 8, 2014: 9, 2015: 10, 2016: 12, 2017: 16, 2018: 20, 2019: 18, 2020: 25, 2021: 35, 2022: 40, 2023: 80, 2024: 170, 2025: 280, 2026: 380, 2027: 420 }; // $B, game estimates
  const PROGRAMS = {
    pascal: { name: 'Pascal & DGX-1', base: 18, deadline: DAY.gtc2016, req: 2200 },
    blackwell: { name: 'Blackwell', base: 20, deadline: DAY.blackwellShip, req: 5800 },
    rubin: { name: 'Vera Rubin', base: 20, deadline: DAY.rubinSamples, req: 6800 }
  };
  const PHASES = { alexnet: '2012 · The spark', pascal: '2015–16 · All in on AI', crypto: '2018 · The crypto crash', deals: '2019–22 · Big deals',
    chatgpt: '2023 · The ChatGPT moment', blackwell: '2024–25 · Blackwell', rubin: '2025–26 · Vera Rubin', won: 'Era complete' };
  let S = null, acc = 0;

  function fresh() {
    return { v: 1, day: 0, phase: 'alexnet', cash: 3.5e9, team: 7000, alloc: .6, morale: 65, energy: 100,
      share: 60, lead: 25, rivalRate: .04, conf: 44, prog: 0, bugs: 0, program: null, taped: false, deadline: null, reqAdd: 0,
      ai: null, supply: null, qDays: 0, qRev: 0, lastQ: null, hype: false, lastAllHands: -99, lastPuzzle: -99, lastInvestor: -999, lastCapacity: -99,
      teamCost: 1, priceCut: 0, restDays: 0, flags: {}, notes: [], hints: [], events: [], queue: [], mem: {}, dead: null,
      stats: { puzzles: 0, workWeeks: 0, collapses: 0, tapeouts: 0, launches: 0, quartersBeat: 0, quartersMissed: 0 } };
  }
  const get = () => S;
  function newRun() { S = fresh(); save(); }
  function load() { try { const j = localStorage.getItem(KEY); if (j) { S = Object.assign(fresh(), JSON.parse(j)); return true; } } catch (e) {} return false; }
  function hasSave() { try { return !!localStorage.getItem(KEY); } catch (e) { return false; } }
  function save() { try { if (S && !S.dead) localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  function wipe() { try { localStorage.removeItem(KEY); } catch (e) {} }

  const money = n => { const a = Math.abs(n), s = n < 0 ? '-' : ''; return a >= 1e12 ? s + '$' + (a / 1e12).toFixed(2) + 'T' : a >= 1e9 ? s + '$' + (a / 1e9).toFixed(1) + 'B' : a >= 1e6 ? s + '$' + Math.round(a / 1e6) + 'M' : s + '$' + Math.round(a / 1e3) + 'K'; };
  function dateStr(day) { const d = new Date(START + (day == null ? S.day : day) * 864e5); return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }); }
  const toast = (msg, kind) => S.queue.push({ toast: msg, kind });
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  /* scripted historical blows can push confidence low, but only your own play can push it to zero */
  const hit = n => { S.conf = Math.max(Math.min(S.conf, 5), S.conf - n); };
  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  /* ---------- economics ---------- */
  function tam(day) { const y = 2012.75 + day / 365.25, i = Math.floor(y), f = y - i, a = TAM[i] || 420, b = TAM[i + 1] || a; return (a + (b - a) * f) * 1e9; }
  function margin() { return clamp(.54 + (S.ai === 'all' ? .03 : 0) + (S.day >= DAY.chatgpt ? .17 : 0) - S.priceCut, .3, .8); }
  const supplyF = () => S.phase === 'chatgpt' && S.supply != null ? clamp(S.supply / 100, .3, 1) : 1;
  function revDay() { return S.share / 100 * tam(S.day) / 365 * supplyF(); }
  function opexDay() { return (S.team * SALARY * S.teamCost + OVERHEAD) / 365 + revDay() * SGA; }
  const building = () => !!S.program && !S.taped;
  const company = () => true;
  function req() { return S.program ? PROGRAMS[S.program].req + S.reqAdd : 1; }
  const moraleF = () => .4 + S.morale / 100;
  function rates() {
    const u = S.team / 100, prog = building() && S.restDays <= 0 ? u * S.alloc * moraleF() : 0;
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
    const rev = revDay(), profit = rev * margin() - opexDay(); S.cash += profit > 0 ? profit * .3 : profit; // most profit returns to shareholders
    if (!o.quiet) S.lead -= S.rivalRate + (S.phase === 'chatgpt' && S.supply < 60 ? .05 : 0);
    const target = clamp(35 + S.lead * .9, 5, 88); S.share += (target - S.share) * .01;
    if (S.phase === 'chatgpt' && S.supply != null) S.supply = Math.min(100, S.supply + .05);
    if (building()) {
      const r = rates();
      S.prog += r.prog / 7 + (o.work ? req() * .02 / 7 : 0);
      S.bugs = Math.max(0, S.bugs + (r.gen + (o.work ? req() * .002 : 0)) / 7 - r.fix / 7);
    }
    milestones();
    if (o.quiet) return;
    if (S.restDays > 0) S.restDays--;
    S.energy = clamp(S.energy + (o.rest ? 40 : o.work ? -4.5 : -1.2), 0, 100);
    S.morale = clamp(S.morale + (60 - S.morale) * .01, 0, 100);
    S.qDays++; S.qRev += rev; if (S.qDays >= 91) quarter();
    if (S.day % 7 === 0) { if (S.morale < 25) { const q = Math.ceil(S.team * .02); S.team -= q; toast(`${q.toLocaleString()} engineers left. Morale is low.`, 'bad'); } maybeEvent(); save(); }
    if (S.cash < 0) return die('broke');
    if (S.conf <= 0) return die('board');
    if (S.share < 15) return die('market');
    if (S.energy <= 0 && !o.collapse) collapse();
  }
  function quiet(toDay) { while (S.day < toDay && !S.dead) tickDay({ quiet: true }); S.qDays = 0; S.qRev = 0; S.lastQ = null; S.hype = false; }
  function advance(days, o) { for (let i = 0; i < days && !S.dead; i++) tickDay(o); save(); }
  function realtime(dt) { acc += dt; while (acc >= SEC_PER_DAY && !S.dead) { acc -= SEC_PER_DAY; tickDay(); } }
  function die(reason) { if (!S.dead) { S.dead = reason; wipe(); } }
  function collapse() {
    S.stats.collapses++;
    S.queue.push({ modal: () => LC.UI.menu({ title: 'You collapsed', sub: 'Exhaustion', closable: false, text: 'Too many flights, too many nights. You lost a week.', actions: [{ label: 'Get back to work', fn: () => {} }] }), teleportHome: true });
    for (let i = 0; i < 7 && !S.dead; i++) tickDay({ collapse: true });
    S.energy = 55; S.morale = Math.max(0, S.morale - 5);
  }
  /* market-value milestones on their real dates */
  function milestones() {
    const f = S.flags;
    if (S.day >= DAY.trillion && !f.trillion) { f.trillion = true; toast('May 30, 2023: NVIDIA is worth $1 trillion, the first chipmaker ever.', 'good'); S.conf = clamp(S.conf + 8, 0, 100); }
    if (S.day >= DAY.fourT && !f.fourT) { f.fourT = true; toast('July 2025: NVIDIA passes $4 trillion, the first company ever.', 'good'); S.conf = clamp(S.conf + 5, 0, 100); }
    if (S.day >= DAY.fiveT && !f.fiveT) { f.fiveT = true; toast('October 29, 2025: NVIDIA becomes the first $5 trillion company.', 'good'); S.conf = clamp(S.conf + 5, 0, 100); }
  }

  /* ---------- Wall Street ---------- */
  function quarter() {
    const rev = S.qRev, prev = S.lastQ; S.qDays = 0; S.qRev = 0; S.lastQ = rev;
    if (prev == null) return;
    const expected = prev * Math.max(1.02, tam(S.day) / tam(S.day - 91)) * 1.01 * (S.hype ? 1.12 : 1); S.hype = false; // analysts price in the market's own growth
    const diff = (rev / expected - 1) * 100;
    if (diff >= 0) { const g = Math.min(5, 2 + diff * .3); S.conf = clamp(S.conf + g, 0, 100); S.stats.quartersBeat++; toast(`Quarter beat expectations by ${diff.toFixed(1)}%. Confidence +${Math.round(g)}.`, 'good'); return; }
    S.stats.quartersMissed++;
    const pen = Math.min(25, 6 + -diff * .8), apply = f => { S.conf = clamp(S.conf - pen * f, 0, 100); };
    S.queue.push({ modal: () => LC.UI.menu({ title: `Missed the quarter by ${(-diff).toFixed(1)}%`, sub: 'Earnings call · ' + dateStr(), closable: false,
      text: `Revenue came in at ${money(rev)} against ${money(expected)} expected. How do you handle the call?`,
      actions: [
        { label: 'Own the miss and lay out the long-term plan', desc: `Confidence −${Math.round(pen * .6)}.`, fn: () => { apply(.6); S.morale = Math.min(100, S.morale + 2); } },
        { label: 'Promise next quarter will be huge', desc: `Confidence −${Math.round(pen * .25)} now; next quarter's bar is 12% higher.`, fn: () => { apply(.25); S.hype = true; } },
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
        { label: 'Match the offers', desc: '−$500M in retention grants.', fn: () => { S.cash -= 5e8; S.morale += 2; } },
        { label: 'Talk about the mission', desc: '−15 energy. Most will stay.', disabled: S.energy < 15, fn: () => { S.energy -= 15; if (Math.random() < .7) toast('Most of them stayed.', 'good'); else { S.morale -= 3; S.lead -= 3; toast('Several left to build rival chips.', 'bad'); } } },
        { label: 'Let them go', desc: 'Morale −4; a rival gets stronger.', fn: () => { S.morale -= 4; S.lead -= 4; } }],
      burnout: [
        { label: 'Give everyone a week off', desc: 'No chip progress for 7 days, morale +15.', fn: () => { S.restDays = 7; S.morale += 15; } },
        { label: 'Push through', desc: 'Progress now, morale −12, more bugs.', fn: () => { S.prog += req() * .02; S.morale -= 12; S.bugs += bugScale() * .3; } }],
      leak: [
        { label: 'Rally the team', desc: 'All-hands: morale +10, energy −12.', fn: () => { S.morale += 10; S.energy -= 12; } },
        { label: 'Cut features to ship sooner', desc: 'The chip needs 10% less work, but launches weaker.', fn: () => { S.reqAdd -= Math.round(req() * .1); S.flags.cut = true; } }],
      pricewar: [
        { label: 'Lower prices for the biggest customers', desc: 'Keeps them; gross margin −2 points for good.', fn: () => { S.priceCut += .02; S.lead += 4; } },
        { label: 'Hold your prices', desc: 'Margins safe; some customers speed up their own chips.', fn: () => { S.lead -= 6; } }]
    }[id];
  }

  /* ---------- objectives ---------- */
  function objective() {
    const f = S.flags, P = S.program && PROGRAMS[S.program];
    if (P && S.taped) return { text: `Unveil ${P.name} at GTC`, target: 'expo' };
    if (P && building()) return S.prog >= req() ? { text: `${P.name} is ready. Tape it out at HQ`, target: 'nvidia' }
      : { text: `Build ${P.name} · ${Math.floor(S.prog / req() * 100)}% · ${Math.max(0, Math.ceil((S.deadline - S.day) / 7))} weeks to the deadline`, target: 'nvidia' };
    switch (S.phase) {
      case 'alexnet': return !f.toronto ? { text: 'Fly to Toronto and see what the researchers did', target: 'airport' } : { text: 'Convince your executives to bet on AI', target: 'nvidia' };
      case 'pascal': return { text: 'Deliver the first DGX-1 to OpenAI yourself', target: 'openai' };
      case 'crypto': return { text: 'Face the analysts in New York after the crypto crash', target: 'airport' };
      case 'deals': return !f.mellanox ? { text: 'Fly to Israel: win Mellanox', target: 'airport' } : { text: 'Decide at HQ: should NVIDIA buy Arm?', target: 'nvidia' };
      case 'chatgpt': return !f.tsmcTrip ? { text: `Fly to Taiwan: win packaging capacity · supply ${Math.round(S.supply)}% of demand`, target: 'airport' }
        : { text: `Fund new capacity at HQ · supply ${Math.round(S.supply)}% of demand (goal 90% by 2024)`, target: 'nvidia' };
      case 'blackwell': return { text: `Hold steady through early 2025 · ${Math.max(0, DAY.rubinStart - S.day)} days until Vera Rubin work begins`, target: 'home' };
      case 'rubin': return { text: 'Give the GTC 2026 keynote', target: 'expo' };
      default: return { text: 'Era complete', target: null };
    }
  }

  /* ---------- phase transitions ---------- */
  function setPhase(p) { S.phase = p; LC.World.setMood(p); LC.World.syncNPCs(S); save(); }
  function startProgram(key, minTeam) { S.program = key; S.prog = 0; S.bugs = 0; S.taped = false; S.reqAdd = 0; S.flags.cut = false; S.team = Math.max(S.team, minTeam); S.deadline = PROGRAMS[key].deadline; }
  function menu(title, sub, text, label, fn) { LC.UI.menu({ title, sub, text, closable: false, actions: [{ label, fn: fn || (() => {}) }] }); }
  function battle(key, cb, bonus) { const B = D.battles[key]; LC.Games.battle({ title: B.title, who: B.who, meter: B.meter, start: B.start + (bonus || 0), pass: B.pass, rounds: B.rounds, time: B.time }, cb); }

  function toronto() {
    advance(3); S.cash -= 50000; S.flags.toronto = true;
    LC.UI.dialog([
      { who: 'Toronto researcher', text: 'We trained it for about a week on two GTX 580s in a bedroom. It beat every other approach by a mile.' },
      { who: 'Toronto researcher', text: 'The GPUs are the only reason it was possible. Without CUDA we couldn\'t have done it at all.' },
      { who: 'Jensen', text: 'How big could these networks get?' },
      { who: 'Toronto researcher', text: 'As big as the computers let us make them.' }
    ], { onEnd: () => advance(3) });
  }
  function aiChoice(convinced) {
    LC.UI.menu({ title: 'How far do you go?', sub: dateStr(), closable: false,
      text: convinced ? 'Your team is with you. Now decide how big the bet is.' : 'Your executives aren\'t convinced. You can still make the call yourself.',
      actions: [
        { label: 'All in: rebuild NVIDIA around AI', desc: 'New libraries, chips designed for AI, a whole new business. Costs a lot now; pays later. What NVIDIA did.', fn: () => pickAI('all', convinced) },
        { label: 'A serious side project', desc: 'Cheaper and safer. Rivals get time to catch up.', fn: () => pickAI('side', convinced) }] });
  }
  function pickAI(a, convinced) {
    S.ai = a; S.flags.aiDecided = true;
    if (a === 'all') { S.cash -= 1e9; S.lead += 10; S.conf = clamp(S.conf - (convinced ? 3 : 8), 0, 100); } else S.lead += 2;
    quiet(DAY.pascalStart); startProgram('pascal', 9000); if (a !== 'all') S.reqAdd = 300; setPhase('pascal');
    menu('2015', dateStr(), `${a === 'all' ? 'cuDNN is out, and every deep learning framework now runs on NVIDIA GPUs. ' : 'Your AI group is growing, slowly. '}Now build the first chip and system designed for AI from the ground up: Pascal, and a box called DGX-1. Unveil it at GTC on ${dateStr(DAY.gtc2016)}.`, 'Build it');
  }
  function launch() {
    const P = PROGRAMS[S.program], timing = clamp(Math.round((S.deadline - S.day) / 15), -15, 8), key = S.program;
    const q = P.base + timing - (S.flags.cut ? 6 : 0) + (key === 'pascal' && S.ai === 'all' ? 6 : 0);
    S.lead += q; S.morale = Math.min(100, S.morale + 12); S.conf = clamp(S.conf + 4, 0, 100); S.stats.launches++;
    S.program = null; S.taped = false; S.deadline = null;
    const txt = { pascal: 'You walk on stage at GTC with DGX-1: an AI supercomputer in a box. ', blackwell: 'Blackwell ships to the biggest data centers in the world. ', rubin: 'The first Vera Rubin samples go out to customers. ' }[key];
    menu(`${P.name}`, dateStr(), `${txt}${timing >= 0 ? 'On time.' : `${-timing * 15} days late.`} Launch strength ${q}. Your lead is now ${Math.round(S.lead)}.`, 'Continue', () => {
      if (key === 'pascal') { quiet(DAY.delivery); menu('August 2016', dateStr(), 'The first DGX-1 is ready to ship. A small research lab in San Francisco called OpenAI is getting it. You decide to deliver it yourself.', 'Continue'); }
      else if (key === 'blackwell') { setPhase('blackwell'); menu('2025', dateStr(), 'Blackwell is shipping. Now keep the company steady: the next few months will test everyone\'s nerves.', 'Continue'); }
      else if (key === 'rubin') { quiet(DAY.gtc2026); menu('March 2026', dateStr(), 'GTC 2026. The arena in San Jose is full and the whole industry is watching. Go give the keynote.', 'Continue'); }
    });
  }
  function deliver() {
    S.flags.delivered = true; advance(1);
    LC.UI.dialog([
      { who: 'OpenAI researcher', text: 'Is that... the DGX-1? You brought it yourself?' },
      { who: 'Jensen', text: 'The first one. Build something amazing with it.' }
    ], { onEnd: () => LC.Heart.play('delivery', () => { quiet(DAY.crypto); setPhase('crypto'); cryptoChoice(); }) });
  }
  function cryptoChoice() {
    S.lead -= 6; hit(16);
    LC.UI.menu({ title: 'The crypto crash', sub: 'November 2018', closable: false,
      text: 'Crypto prices have collapsed. Miners stopped buying graphics cards and are dumping used ones. Warehouses are full of unsold GPUs and the stock is falling fast. How do you report it?',
      actions: [
        { label: 'Tell investors exactly how much was crypto, and take the inventory hit', desc: '−$1.5B and confidence −6 now. Nothing left to come out later.', fn: () => { S.cash -= 1.5e9; hit(6); S.flags.honestCrypto = true; } },
        { label: 'Push the extra cards to retailers and keep quiet', desc: 'Looks fine this quarter. If it comes out later, it costs much more.', fn: () => { S.flags.hidCrypto = true; } }] });
  }
  function armChoice() {
    LC.UI.menu({ title: 'Should NVIDIA buy Arm?', sub: 'September 2020', closable: false,
      text: 'SoftBank is selling Arm, whose designs are in almost every phone. Owning it would put NVIDIA at the center of all computing, if regulators allow it.',
      actions: [
        { label: 'Bid $40 billion for Arm', desc: 'A huge strategic prize, a long regulatory fight. What NVIDIA did.', fn: () => armResult(true) },
        { label: 'Pass, and stay focused on accelerated computing', desc: 'No distraction.', fn: () => armResult(false) }] });
  }
  function armResult(bid) {
    S.flags.armDone = true; quiet(DAY.armEnd);
    if (bid) { S.cash -= 1.36e9; hit(10); }
    menu(bid ? 'The Arm deal collapses' : 'You stayed focused', 'February 2022', bid ? 'Regulators in the US, UK and Europe pushed back. In February 2022 the deal is abandoned, and the prepayment, about $1.36 billion, is written off. This is what really happened.' : 'Arm stays independent. In real life NVIDIA did bid, and the deal was abandoned in February 2022.', 'Continue', () => {
      quiet(DAY.export); hit(14); S.lead -= 4;
      LC.UI.menu({ title: 'Export controls', sub: 'October 2022', closable: false,
        text: 'The US government restricts sales of NVIDIA\'s most advanced AI chips to China, one of your biggest markets. The chip industry is in a downturn and NVIDIA\'s stock has fallen by about half this year. Confidence −14.',
        actions: [
          { label: 'Design slower chips that meet the rules', desc: 'Keeps some China business. Confidence −3.', fn: () => { hit(3); toChatGPT(); } },
          { label: 'Walk away from China', desc: 'Simpler. Confidence −8, and rivals there grow.', fn: () => { hit(8); S.lead -= 6; toChatGPT(); } }] });
    });
  }
  function toChatGPT() {
    quiet(DAY.chatgpt); S.supply = 30; S.team = Math.max(S.team, 22000); setPhase('chatgpt');
    LC.UI.menu({ title: 'November 30, 2022', sub: 'ChatGPT launches', closable: false,
      text: 'A chatbot from OpenAI reaches a hundred million people in about two months, and it was trained on NVIDIA GPUs. Suddenly every company on earth wants H100s, and you can only build about 30% of what they ask for. Who gets the first ones?',
      actions: [
        { label: 'Spread them: clouds, startups, researchers, countries', desc: 'Grows the whole ecosystem. Lead +4.', fn: () => { S.lead += 4; } },
        { label: 'Give the biggest cloud customers what they ask for', desc: 'Wall Street likes it (confidence +6); startups look elsewhere (lead −2).', fn: () => { S.conf = clamp(S.conf + 6, 0, 100); S.lead -= 2; } },
        { label: 'Sell to whoever pays the most', desc: 'Cash now (+$3B); reputation and morale suffer.', fn: () => { S.cash += 3e9; hit(4); S.morale -= 6; } }] });
  }
  function checkStory() {
    if (!S || S.dead) return;
    const f = S.flags;
    if (f.hidCrypto && S.phase === 'deals' && !f.cryptoOut) { f.cryptoOut = true; hit(15); S.queue.push({ modal: () => menu('It came out', 'Regulators ask questions', 'Investors learn how much of the 2018 gaming slump was really crypto. They feel misled. Confidence −15.', 'Continue') }); }
    if (S.phase === 'chatgpt' && S.day >= DAY.chatgptEnd && !f.chatgptDone) {
      f.chatgptDone = true; const ok = S.supply >= 90; S.conf = clamp(S.conf + (ok ? 6 : -10), 0, 100);
      S.queue.push({ modal: () => menu(ok ? 'Supply caught up' : 'Customers waited too long', 'End of 2023', ok ? 'NVIDIA is shipping close to what the world asks for.' : 'Long waits pushed customers toward rivals and their own chips. Confidence −10.', 'Continue', () => {
        quiet(DAY.blackwellStart); startProgram('blackwell', 26000); setPhase('blackwell');
        menu('Blackwell', 'GTC · March 2024', `Your next platform is the most complex chip NVIDIA has ever built. It has to ship by ${dateStr(DAY.blackwellShip)}.`, 'Build it');
      }) });
    }
    if (S.program === 'blackwell' && S.day >= DAY.flaw && !f.flaw) {
      f.flaw = true;
      S.queue.push({ modal: () => LC.UI.menu({ title: 'A flaw in Blackwell', sub: 'Summer 2024', closable: false,
        text: 'Testing finds a design problem that hurts manufacturing yields. Customers are waiting. How do you fix it?',
        actions: [
          { label: 'Fix the design properly, even if it costs weeks', desc: 'Progress −10%, risk drops. What NVIDIA did.', fn: () => { S.prog = Math.max(0, S.prog - req() * .1); S.bugs *= .5; } },
          { label: 'Ship with a workaround and fix it later', desc: 'Keeps the schedule. Bug risk jumps.', fn: () => { S.bugs += bugScale() * 1.2; } }] }) });
    }
    if (S.day >= DAY.deepseek && !f.deepseek && S.phase === 'blackwell') {
      f.deepseek = true; hit(20);
      S.queue.push({ modal: () => LC.UI.menu({ title: 'DeepSeek', sub: 'January 27, 2025', closable: false,
        text: 'A Chinese lab releases a capable AI model it says was trained cheaply. Investors panic that the world will need fewer GPUs. NVIDIA loses about $590 billion in value in one day. Confidence −20. What do you say?',
        actions: [
          { label: 'Explain that cheaper AI means far more AI', desc: 'Efficiency grows demand for computing. Confidence +10.', fn: () => { S.conf = clamp(S.conf + 10, 0, 100); } },
          { label: 'Dismiss it as hype', desc: 'Confidence −4.', fn: () => { hit(4); } },
          { label: 'Say nothing and let it pass', desc: 'Confidence +2 as markets calm.', fn: () => { S.conf = clamp(S.conf + 2, 0, 100); } }] }) });
    }
    if (S.day >= DAY.h20 && !f.h20 && S.phase === 'blackwell') { f.h20 = true; S.cash -= 4.5e9; hit(5); toast('April 2025: new export rules block the chips designed for China. A $4.5 billion charge.', 'bad'); }
    if (S.phase === 'blackwell' && S.day >= DAY.rubinStart && !S.program) {
      startProgram('rubin', 30000); setPhase('rubin');
      S.queue.push({ modal: () => menu('Vera Rubin', dateStr(), `The next generation. First samples must reach customers by ${dateStr(DAY.rubinSamples)}.`, 'Build it') });
    }
  }

  /* ---------- places ---------- */
  function hqActions() {
    const L = D.locations.nvidia, acts = [], f = S.flags;
    if (S.phase === 'alexnet' && f.toronto && !f.aiDecided) {
      acts.push({ label: 'Hold the leadership offsite', desc: 'Convince your executives to bet NVIDIA on deep learning.', fn: () => battle('retreat', ok => aiChoice(ok)) });
      return { title: L.name, sub: PHASES[S.phase], text: 'The executive team is waiting in the big conference room.', actions: acts };
    }
    if (S.phase === 'deals' && f.mellanox && !f.armDone) { armChoice(); return null; }
    acts.push({ label: 'Manage the team', desc: 'Hire, let go, and split engineers between design and verification.', fn: manage });
    if (building()) {
      acts.push({ label: 'Work in the lab with the chip team (7 days)', desc: '+2% progress, −32 energy.', disabled: S.energy < 25, fn: () => { S.stats.workWeeks++; advance(7, { work: true }); toast('A week in the lab.'); } });
      const wait = 14 - (S.day - S.lastPuzzle);
      acts.push({ label: 'Solve a design block (chip routing puzzle)', desc: wait > 0 ? `Next block ready in ${wait} days.` : 'Win: +3% progress, fewer bugs. Costs 3 days, 15 energy.', disabled: wait > 0 || S.energy < 15, fn: puzzle });
      const ah = S.day - S.lastAllHands >= 14;
      acts.push({ label: 'Hold an all-hands meeting', desc: ah ? 'Morale +12, −10 energy, 1 day.' : `Again in ${14 - (S.day - S.lastAllHands)} days.`, disabled: !ah || S.energy < 10, fn: () => { S.lastAllHands = S.day; S.morale = Math.min(100, S.morale + 12); S.energy -= 10; advance(1); } });
      if (S.prog >= req()) acts.push({ label: `Tape out ${PROGRAMS[S.program].name}`, desc: 'Send it to TSMC. Hidden bugs mean a costly respin.', fn: tapeout });
    }
    if (S.phase === 'chatgpt' && S.supply < 100) {
      const w = 30 - (S.day - S.lastCapacity);
      acts.push({ label: 'Fund new capacity with suppliers ($5B)', desc: w > 0 ? `Next commitment in ${w} days.` : 'Supply +12% of demand.', disabled: w > 0 || S.cash < 5e9, fn: () => { S.lastCapacity = S.day; S.cash -= 5e9; S.supply = Math.min(100, S.supply + 12); advance(2); toast('New capacity is on the way.', 'good'); } });
    }
    return { title: L.name, sub: PHASES[S.phase], text: `${S.team.toLocaleString()} engineers. AI market share ${S.share.toFixed(1)}%. Gross margin ${Math.round(margin() * 100)}%.`, actions: acts };
  }
  function manage() {
    const UI = LC.UI;
    const render = () => {
      const r = rates(), left = Math.max(0, req() - S.prog), eta = r.prog > 0 ? Math.ceil(left / r.prog) : '∞';
      UI.show(`<div class="yr">MANAGE THE TEAM</div><h2>${S.team.toLocaleString()} engineers</h2>
        <div class="grid2">
          <div><small>Engineering cost / year</small><b>${money(S.team * SALARY * S.teamCost)}</b></div><div><small>Cash</small><b>${money(S.cash)}</b></div>
          <div><small>Chip progress / week</small><b>${building() ? r.prog.toFixed(1) : '—'}</b></div><div><small>Weeks to finish</small><b>${building() ? eta : '—'}</b></div>
          <div><small>Weeks to deadline</small><b>${S.deadline ? Math.ceil((S.deadline - S.day) / 7) : '—'}</b></div><div><small>Bug risk</small><b>${building() ? bugText() : '—'}</b></div>
        </div>
        <div class="row"><button data-h="100">Hire 100</button><button data-h="500">Hire 500</button><button data-h="-100">Let 100 go</button><button data-h="-500">Let 500 go</button></div>
        <p class="mut small">Hiring costs ${money(HIRE_FEE)} each up front, then ${money(SALARY)}/year. Letting people go hurts morale.</p>
        <label class="lbl">Design ${Math.round(S.alloc * 100)}% · Verification ${Math.round((1 - S.alloc) * 100)}%</label>
        <input type="range" id="alloc" min="10" max="95" step="5" value="${Math.round(S.alloc * 100)}">
        <button class="ghost" data-x>Done (Esc)</button>`, { closable: true });
      document.querySelectorAll('[data-h]').forEach(b => b.onclick = () => {
        const n = +b.dataset.h;
        if (n > 0) { S.cash -= HIRE_FEE * n; S.team += n; } else { const k = Math.min(S.team - 1000, -n); S.team -= k; S.morale = Math.max(0, S.morale - .02 * k); }
        render();
      });
      document.getElementById('alloc').oninput = e => { S.alloc = +e.target.value / 100; render(); };
      document.querySelector('[data-x]').onclick = () => { save(); UI.close(); };
    };
    render();
  }
  function puzzle() {
    S.energy -= 15; S.lastPuzzle = S.day;
    LC.Games.routing({ n: 8, k: 8, time: 150, title: 'Design block · route the signals' }, ok => {
      advance(3);
      if (ok) { S.prog += req() * .03; S.bugs = Math.max(0, S.bugs - bugScale() * .3); S.stats.puzzles++; toast('Block routed cleanly.', 'good'); }
      else toast('The block is still a mess. Three days gone.', 'bad');
    });
  }
  function tapeout() {
    const p = Math.exp(-S.bugs / bugScale()), P = PROGRAMS[S.program];
    LC.UI.menu({ title: 'Tape out?', sub: P.name, text: `Verification estimates bug risk as ${bugRisk().toLowerCase()}. A failed chip costs ${money(req() * 300000)} and 7 weeks.`,
      actions: [
        { label: 'Tape out now', fn: () => {
          S.stats.tapeouts++;
          if (Math.random() < p) { S.taped = true; S.morale = Math.min(100, S.morale + 8); menu('First silicon works', P.name, 'The chips come back from TSMC and boot. Take it to GTC.', 'Continue'); }
          else { S.cash -= req() * 300000; S.bugs *= .45; advance(49); S.morale -= 8; menu('The silicon is broken', 'Respin', 'Bugs you didn\'t catch. Another run through the fab, seven weeks gone.', 'Fix it'); }
        } },
        { label: 'Not yet', desc: 'Keep verifying.', fn: () => {} }] });
  }
  function investorDay(cb) {
    const qs = shuffle(D.analystQs.slice()).slice(0, 3);
    S.lastInvestor = S.day; advance(3);
    LC.Games.battle({ title: 'Investor meetings · New York', who: 'Analysts', meter: 'Confidence', start: 40, pass: 60, rounds: qs, time: 14 }, (ok, m, picks) => {
      advance(2); if (picks.some(p => p.hype)) S.hype = true;
      const g = ok ? 8 : -6; S.conf = clamp(S.conf + g, 0, 100);
      menu(ok ? 'The Street is listening' : 'A rough day', 'New York', `Confidence ${g > 0 ? '+' : ''}${g}.`, 'Fly home', cb);
    });
  }

  function locationActions(id) {
    const L = D.locations[id], f = S.flags;
    if (id === 'nvidia') return hqActions();
    if (id === 'home') return { title: L.name, sub: L.sub, text: 'The house is quiet.', actions: [
      { label: 'Sleep (2 days)', desc: 'Restore energy.', fn: () => { advance(2, { rest: true }); toast('Rested.', 'good'); } }] };
    if (id === 'dennys') return { title: L.name, sub: L.sub, text: 'Thirty years later, the same booth.', actions: [{ label: 'Coffee and pie ($12)', desc: '+8 energy.', fn: () => { S.cash -= 12; S.energy = Math.min(100, S.energy + 8); } }] };
    if (id === 'airport') {
      const acts = [];
      if (S.phase === 'alexnet' && !f.toronto) acts.push({ label: 'Fly to Toronto (6 days)', fn: toronto });
      if (S.phase === 'crypto' && !f.cryptoCall) acts.push({ label: 'Fly to New York to face the analysts', fn: () => investorDay(() => { f.cryptoCall = true; quiet(DAY.mellanox); setPhase('deals'); menu('March 2019', dateStr(), 'The crash is behind you. To build whole AI data centers you need fast networking, and an Israeli company called Mellanox is the best. Intel wants it too.', 'Continue'); }) });
      if (S.phase === 'deals' && !f.mellanox) acts.push({ label: 'Fly to Israel to meet Mellanox (4 days)', fn: () => { advance(4); battle('mellanox', ok => { f.mellanox = true; if (ok) { S.cash -= 6.9e9; S.lead += 8; } else { S.lead -= 3; hit(4); } quiet(DAY.arm); menu(ok ? 'Mellanox is yours' : 'Mellanox walks away', dateStr(), ok ? 'A $6.9 billion deal. NVIDIA can now build the whole data center: GPUs and networking together. What really happened.' : 'Without Mellanox, building giant AI systems will be harder. In real life NVIDIA won the deal.', 'Continue'); }); } });
      if (S.phase === 'chatgpt' && !f.tsmcTrip) acts.push({ label: 'Fly to Taiwan to meet TSMC (5 days)', fn: () => { advance(5); battle('tsmc', ok => { f.tsmcTrip = true; S.supply = Math.min(100, S.supply + (ok ? 30 : 10)); menu(ok ? 'Capacity doubles' : 'Only a little more', 'Hsinchu', ok ? 'TSMC commits to expanding advanced packaging for NVIDIA. Supply +30%.' : 'TSMC can spare a little. Supply +10%. You\'ll need to fund more capacity yourself.', 'Fly home'); }); } });
      if (!['alexnet', 'crypto'].includes(S.phase)) { const w = 120 - (S.day - S.lastInvestor); acts.push({ label: 'Fly to New York for investor meetings (5 days)', desc: w > 0 ? `Next trip in ${w} days.` : 'Win confidence, or lose it.', disabled: w > 0, fn: () => investorDay() }); }
      return { title: L.name, sub: L.sub, text: acts.length ? 'Where to?' : 'No trips planned.', actions: acts };
    }
    if (id === 'openai') {
      if (S.phase === 'pascal' && !S.program && !f.delivered) return { title: L.name, sub: L.sub, text: 'A few researchers in a borrowed office. A big crate on a hand truck behind you.', actions: [{ label: 'Deliver the first DGX-1', fn: deliver }] };
      return { title: L.name, sub: L.sub, text: S.day >= DAY.chatgpt ? 'The lab that made ChatGPT. The building is much bigger now.' : 'Researchers working on something ambitious.', actions: [] };
    }
    if (id === 'expo') {
      if (S.program && S.taped) return { title: L.name, sub: 'Launch', text: 'The arena fills up.', actions: [{ label: `Unveil ${PROGRAMS[S.program].name}`, fn: launch }] };
      if (S.phase === 'rubin' && !S.program && S.day >= DAY.gtc2026) return { title: L.name, sub: 'GTC 2026', text: 'Twenty thousand people and a live stream watched around the world.', actions: [{ label: 'Give the keynote', fn: () => battle('keynote', ok => { S.conf = clamp(S.conf + (ok ? 8 : -4), 0, 100); S.phase = 'won'; wipe(); menu(ok ? 'A standing ovation' : 'A mixed reception', 'GTC 2026', ok ? 'The arena is on its feet.' : 'The press calls it solid, not spectacular.', 'Continue', () => LC.Main.win()); }) }] };
      return { title: L.name, sub: L.sub, text: 'Between conferences.', actions: [] };
    }
    if (id === 'stanford') return { title: L.name, sub: L.sub, text: 'Every desk has a GPU workstation humming under it.', actions: [{ label: 'Talk with students (1 day)', desc: '+6 energy, +2 morale.', fn: () => { advance(1); S.energy = Math.min(100, S.energy + 6); S.morale = Math.min(100, S.morale + 2); } }] };
    if (id === 'datacenter') return { title: L.name, sub: L.sub, text: `Rows of racks. ${S.day >= DAY.chatgpt ? 'Every one of them is running AI.' : 'More of them run AI every month.'}`, actions: [] };
    if (id === 'store') return { title: L.name, sub: L.sub, text: S.phase === 'crypto' ? 'Used mining cards are piled up at half price.' : 'Gamers still line up for new GeForce cards.', actions: [] };
    return { title: L.name, sub: L.sub, text: '', actions: [] };
  }

  function npcTalk(id) {
    if (id === 'chris' || id === 'ian' || id === 'colette') {
      const who = { chris: 'Chris Malachowsky', ian: 'Ian Buck', colette: 'Colette Kress' }[id], lines = [];
      if (id === 'colette') lines.push({ who, text: `Wall Street confidence is ${Math.round(S.conf)}. Gross margin ${Math.round(margin() * 100)}%. ${S.conf < 30 ? 'We need to rebuild trust.' : 'They believe the story, for now.'}` });
      else if (building()) { const r = rates(), eta = r.prog > 0 ? Math.ceil((req() - S.prog) / r.prog) : null; lines.push({ who, text: eta ? `At this pace the chip needs ${eta} more weeks. The deadline is ${Math.ceil((S.deadline - S.day) / 7)} weeks out.` : 'Nobody is designing. The chip isn\'t moving.' }); }
      else lines.push({ who, text: id === 'ian' ? 'Every AI lab in the world runs on CUDA now. That started with a bet nobody understood.' : (S.lead >= 0 ? 'We\'re ahead. Every day we don\'t ship, that shrinks.' : 'We\'re behind. The next chip has to be great.') });
      return LC.UI.dialog(lines);
    }
    const n = D.npcs.find(q => q.id === id);
    LC.UI.dialog(n.lines.map(t => ({ who: n.name, text: t })), { onEnd: () => { if (!S.hints.includes(n.hint)) { S.hints.push(n.hint); toast('Journal updated: new hint.', 'good'); save(); } } });
  }
  function pickNote(i) { if (!S.notes.includes(i)) { S.notes.push(i); toast('Memory found: ' + D.notes[i].t, 'note'); save(); } }

  /* ---------- engine hooks ---------- */
  function npcPlacement(S) {
    const p = { chris: { loc: 'nvidia', dx: -4, dz: 2 }, ian: { loc: 'nvidia', dx: 5, dz: 3 } };
    if (S.day >= 365) p.colette = { loc: 'nvidia', dx: -8, dz: 3 };
    return p;
  }
  function hudHTML(S, bar) {
    let h = `<div class="st"><small>Cash</small><b class="${S.cash < 2e9 ? 'bad' : ''}">${money(S.cash)}</b></div>`;
    h += `<div class="st"><small>AI share</small><b class="${S.share < 30 ? 'bad' : ''}">${S.share.toFixed(1)}%</b></div>`;
    h += `<div class="st w"><small>Wall Street ${Math.round(S.conf)}</small>${bar(S.conf, S.conf < 25 ? 'red' : 'blue')}</div>`;
    h += `<div class="st"><small>Margin</small><b>${Math.round(margin() * 100)}%</b></div>`;
    if (S.phase === 'chatgpt' && S.supply != null) h += `<div class="st w"><small>Supply ${Math.round(S.supply)}% of demand</small>${bar(S.supply, S.supply < 60 ? 'red' : 'green')}</div>`;
    h += `<div class="st w"><small>Energy</small>${bar(S.energy, S.energy < 25 ? 'red' : '')}</div>`;
    h += `<div class="st w"><small>Morale</small>${bar(S.morale, S.morale < 30 ? 'red' : 'blue')}</div>`;
    if (building()) h += `<div class="st w"><small>${PROGRAMS[S.program].name} ${Math.floor(S.prog / req() * 100)}%</small>${bar(S.prog / req() * 100, 'green')}</div><div class="st"><small>Bugs</small><b>${bugText()}</b></div>`;
    if (S.deadline && S.program) { const wl = Math.ceil((S.deadline - S.day) / 7); h += `<div class="st"><small>Deadline</small><b class="${wl < 6 ? 'bad' : ''}">${wl} wks</b></div>`; }
    return h;
  }
  function summaryHTML(S) {
    return `<div class="yr">ERA 3 COMPLETE · ${dateStr()}</div><h2>From a GPU in a bedroom to the AI factory</h2>
      <p>${S.ai === 'all' ? 'You bet the company on AI in 2012 and never let go.' : 'You treated AI as a side project. History shows the all-in bet is what built the AI era.'}</p>
      <div class="grid2"><div><small>AI market share</small><b>${S.share.toFixed(1)}%</b></div><div><small>Wall Street confidence</small><b>${Math.round(S.conf)}</b></div>
      <div><small>Cash</small><b>${money(S.cash)}</b></div><div><small>Platforms launched</small><b>${S.stats.launches}</b></div>
      <div><small>Quarters beat / missed</small><b>${S.stats.quartersBeat} / ${S.stats.quartersMissed}</b></div><div><small>Blocks routed by hand</small><b>${S.stats.puzzles}</b></div>
      <div><small>Times you collapsed</small><b>${S.stats.collapses}</b></div><div><small>Memories found</small><b>${S.notes.length}/${D.notes.length}</b></div></div>
      <p class="mut small">Thank you for playing all three eras of The Long Climb.</p>`;
  }
  function deathStatsHTML(S) {
    return `<div><small>Reached</small><b>${PHASES[S.phase]}</b></div><div><small>AI market share</small><b>${S.share.toFixed(1)}%</b></div>
      <div><small>Wall Street</small><b>${Math.round(S.conf)}</b></div><div><small>Platforms launched</small><b>${S.stats.launches}</b></div>`;
  }

  return { get, newRun, load, hasSave, save, wipe, money, dateStr, req, rates, bugText, runway, objective, realtime, advance,
    locationActions, npcTalk, pickNote, checkStory, eventActions, PHASES, building, company, setPhase, shuffle,
    npcPlacement, hudHTML, summaryHTML, deathStatsHTML, margin, DAY };
})();
