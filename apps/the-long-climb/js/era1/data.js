/* The Long Climb · Era 1 (1993–1997) — all story data lives here. Dramatized; verify facts before publishing. */
window.LC = window.LC || {};
LC.DATA = {
  /* x,z = centre; w,d,h = size. Doors face +z. */
  locations: {
    home:    {name:"Home", sub:"Jensen & Lori's house · San Jose", x:-115, z:105, w:14, d:12, h:6, col:0xd8c7a3, kind:'house'},
    dennys:  {name:"Denny's", sub:"East San Jose", x:35, z:100, w:18, d:12, h:5, col:0xeeeeee, kind:'diner'},
    lsi:     {name:"LSI Logic", sub:"Milpitas · your current employer", x:115, z:35, w:30, d:20, h:14, col:0x6f8fb5, kind:'office'},
    nvidia:  {name:"NVIDIA", sub:"First office · Sunnyvale", x:-35, z:-40, w:24, d:18, h:9, col:0x2f3a40, kind:'nvidia'},
    sequoia: {name:"Sequoia Capital", sub:"Sand Hill Road", x:-120, z:-110, w:18, d:14, h:8, col:0x8a6e4b, kind:'vc'},
    sutter:  {name:"Sutter Hill Ventures", sub:"Sand Hill Road", x:-45, z:-120, w:16, d:12, h:7, col:0x7d6a58, kind:'vc'},
    angel:   {name:"Valley Angels", sub:"Small angel investors (fictional)", x:-125, z:-40, w:12, d:10, h:6, col:0x9a8a70, kind:'vc'},
    ikos:    {name:"IKOS Systems", sub:"Hardware emulators", x:40, z:-120, w:20, d:16, h:8, col:0x7a7f8a, kind:'office'},
    airport: {name:"San Jose Airport", sub:"International departures", x:120, z:125, w:36, d:20, h:10, col:0xcfd6dc, kind:'airport'},
    expo:    {name:"Expo Hall", sub:"Trade show floor", x:115, z:-115, w:34, d:24, h:12, col:0x4a3f6b, kind:'expo'}
  },

  /* Hint NPCs: talking to them unlocks journal hints that matter later. */
  npcs: [
    {id:'regular', name:"Diner regular", x:44, z:111, shirt:0x8a4b2f, hint:'ref',
     lines:["Sand Hill Road money? Those folks bet on people more than plans.","A phone call from someone they already trust is worth more than any slide."]},
    {id:'assistant', name:"Sand Hill assistant", x:-110, z:-98, shirt:0x4b5e8a, hint:'vc',
     lines:["Between us? Sequoia loves a huge, honest vision and a team that has shipped before.","Sutter Hill is different. They want a tight plan: where the money goes, and proof you won't waste it building your own factory."]},
    {id:'gamedev', name:"Game developer", x:-30, z:52, shirt:0x2e8b57, hint:'dx',
     lines:["Everyone's talking about Microsoft's 3D plans for Windows 95.","Word is it'll be built on triangles. If your chip draws something else, good luck getting games."]},
    {id:'salesman', name:"Old salesman", x:108, z:140, shirt:0x6b6b6b, hint:'sega',
     lines:["Twenty years selling to Japanese companies taught me one thing.","Never hide bad news from them. The truth told straight earns respect. A promise you can't keep ends the relationship."]},
    {id:'engineer', name:"LSI engineer", x:128, z:50, shirt:0x3f6f9f, hint:'emu',
     lines:["Can't afford a second run of silicon? Then simulate the whole chip before you build it.","IKOS sells hardware emulators. Expensive, but cheaper than dying."]},
    {id:'reporter', name:"Tech reporter", x:104, z:-98, shirt:0xa04060, hint:'window',
     lines:["The window for PC 3D cards is closing fast.","Whoever ships a fast chip that works with DirectX first takes the market. Everyone else is a footnote."]}
  ],
  hints: {
    ref:"Investors bet on people. A trusted reference (your boss at LSI?) could change a pitch.",
    vc:"Sequoia values vision + a proven team. Sutter Hill values a tight plan and no fab.",
    dx:"Microsoft's Windows 3D standard will be built on triangles.",
    sega:"With Sega: tell the truth, even when it's bad news. Never threaten.",
    emu:"An IKOS emulator finds bugs before tape-out. Expensive but may save the company.",
    window:"The 3D market window is closing. Ship RIVA 128 before the deadline."
  },

  /* Collectible memory notes — real background facts. */
  notes: [
    {x:-100, z:120, t:"Jensen was born in Tainan, Taiwan, on February 17, 1963."},
    {x:-60,  z:30,  t:"Around age 9 he was sent to the US and attended Oneida Baptist Institute in Kentucky."},
    {x:20,   z:120, t:"As a teenager he worked as a dishwasher and busboy at Denny's."},
    {x:140,  z:10,  t:"He earned an EE degree from Oregon State (1984) and a master's from Stanford (1992), studying at night."},
    {x:-10,  z:-60, t:"NVIDIA was founded in April 1993 by Jensen Huang, Chris Malachowsky and Curtis Priem."},
    {x:-150, z:-130,t:"The name comes from 'invidia', Latin for envy."},
    {x:60,   z:-140,t:"NV1 (1995) drew 3D with curved quadratic surfaces. The industry standardised on triangles."},
    {x:150,  z:-80, t:"In 1996 NVIDIA laid off more than half of its staff to survive."},
    {x:150,  z:150, t:"Sega's CEO Shoichiro Irimajiri invested $5 million in NVIDIA even after the console chip deal fell apart."},
    {x:-150, z:60,  t:"RIVA 128 (1997) sold about a million units in its first four months and saved the company."}
  ],

  /* Pitch questions. Each answer scores Vision / Plan / Team; each investor weighs them differently. */
  pitchQs: [
    {q:"So, what does NVIDIA actually make?", a:[
      {t:"Graphics chips that let ordinary PCs render 3D games in real time.", v:1,p:1,tm:0},
      {t:"A multimedia chip: 3D, audio, video and game ports, all in one.", v:1,p:-1,tm:0},
      {t:"We'll pick the product once we've studied the market.", v:-2,p:-2,tm:0}]},
    {q:"How big is this market today?", a:[
      {t:"Nearly zero. But games will become the biggest entertainment there is, and 3D is how they'll look.", v:2,p:-1,tm:0},
      {t:"Workstation graphics is worth billions. We bring it to PCs, where volume is huge.", v:1,p:1,tm:0},
      {t:"Every PC on earth will have one within two years.", v:0,p:-2,tm:-1}]},
    {q:"Why are you three the ones to do this?", a:[
      {t:"Chris and Curtis built graphics systems at Sun. I ran chip design at LSI. We've shipped silicon.", v:0,p:0,tm:2},
      {t:"Because we want it more than anyone else.", v:0,p:0,tm:-1},
      {t:"Honestly? We're smarter than the competition.", v:-1,p:0,tm:-2}]},
    {q:"There are dozens of graphics startups. What's your biggest risk?", a:[
      {t:"Most of them will die, maybe us too. We plan to survive by moving faster.", v:1,p:1,tm:1},
      {t:"Microsoft could set a standard that breaks our design.", v:1,p:1,tm:0},
      {t:"We don't really see one.", v:-2,p:-1,tm:-1}]},
    {q:"What will you spend the money on?", a:[
      {t:"Engineers and one great chip. No fab; we'll use a foundry.", v:0,p:2,tm:1},
      {t:"Our own fab, so we control manufacturing.", v:0,p:-2,tm:0},
      {t:"Marketing. We need to be famous fast.", v:-1,p:-2,tm:0}]},
    {q:"What happens if your first chip fails?", a:[
      {t:"We learn fast, and we keep enough money for a second try.", v:0,p:2,tm:1},
      {t:"It won't fail.", v:-1,p:-1,tm:-2},
      {t:"Then we're done. That's the business.", v:-1,p:0,tm:-1}]}
  ],
  investors: {
    sequoia:{name:"Sequoia partner", max:5e6, w:{v:1.3,p:.6,tm:1.2}},
    sutter: {name:"Sutter Hill partner", max:5e6, w:{v:.6,p:1.4,tm:.8}},
    angel:  {name:"Angel investor", max:5e5, w:{v:1,p:1,tm:1}}
  },

  bridgeQs: [
    {q:"Your chip didn't sell. Why should we put in another dollar?", a:[
      {t:"We misread the market. The next chip is built for DirectX and we'll ship it within a year.", d:20},
      {t:"The market was wrong, not us.", d:-25},
      {t:"If you don't, we close. Simple as that.", d:-15}]},
    {q:"How deep have you cut costs?", a:[
      {t:"Deep. Only the core team is left, and we'll stay lean.", d:15, needCut:true},
      {t:"We don't want to cut anyone. People are our strength.", d:-15},
      {t:"We've cut marketing.", d:-5}]},
    {q:"What is the one thing you will ship?", a:[
      {t:"One fast 3D chip for Windows games. Nothing else.", d:20},
      {t:"A next-generation multimedia platform.", d:-20},
      {t:"Whatever customers ask us for.", d:-5}]},
    {q:"What if the next chip fails too?", a:[
      {t:"We'll simulate the whole chip before we build it, so it can't fail the way NV1 did.", d:15},
      {t:"It won't.", d:-15},
      {t:"Then you were right not to trust us.", d:-5}]}
  ],

  sega: [
    {q:"Irimajiri-san greets you in a quiet meeting room in Tokyo. The NV2 console chip is behind schedule and both sides know it. How do you open?", a:[
      {t:"Bow, thank him for the partnership, and say you've come to speak plainly.", d:10, r:"He nods. \"Please.\""},
      {t:"Jump straight into a demo of NV2's progress.", d:-10, r:"He watches politely. He has seen the schedule."},
      {t:"Explain that Microsoft changed the industry under both of you.", d:-5, r:"\"Microsoft did not sign our contract.\""}]},
    {q:"\"Tell me honestly. Will NV2 succeed?\"", a:[
      {t:"\"No. Our architecture is wrong. You should find another partner for your console.\"", d:30, r:"A long silence. Then, quietly: \"Thank you for your honesty.\""},
      {t:"\"Yes. Give us a little more time and it will be great.\"", d:-25, r:"His expression doesn't change, but the temperature in the room does."},
      {t:"\"It can succeed, but we need more time and more money.\"", d:-5, r:"\"Everyone needs more time.\""}]},
    {q:"\"Then what are you asking of Sega?\"", a:[
      {t:"\"Please honour the remaining contract payment. Without it NVIDIA dies. I will not forget it.\"", d:25, r:"He writes something down."},
      {t:"\"Invest in us, or we'll have to take this to lawyers.\"", d:-40, r:"The meeting effectively ends here."},
      {t:"\"Nothing. We'll manage on our own.\"", d:0, r:"\"I see.\" He seems surprised.", noMoney:true}]},
    {q:"\"Why should Sega help a company that could not deliver?\"", a:[
      {t:"\"Because we will build something great with it, and NVIDIA will remember who believed in us.\"", d:20, r:"For the first time, he smiles."},
      {t:"\"Because Sega chose our design. This is partly your problem.\"", d:-30, r:"\"Then we are finished here.\""},
      {t:"Say nothing and bow.", d:5, r:"He returns the bow."}]}
  ],

  events: {
    poach:{title:"An offer from a giant", text:"Your best verification engineer has an offer from a big company with twice the salary.", phases:['nv1','riva']},
    sample:{title:"A distracting customer", text:"A board maker wants early engineering support. It pays well, but it pulls engineers off the chip.", phases:['nv1','riva']},
    burnout:{title:"Running on empty", text:"The team has worked six weekends straight. People are snapping at each other.", phases:['nv1','riva']},
    lori:{title:"A phone call from home", text:"Lori calls. You've missed dinner every night this week.", phases:['nv1','riva','crisis']},
    directx:{title:"News from Redmond", text:"Microsoft says it will ship a 3D standard for Windows. Insiders say it is built on triangles.", phases:['nv1'], need:s=>s.arch==='quad'},
    rival:{title:"A rival steals the show", text:"A startup called 3dfx shows a stunning 3D demo. The press is ecstatic and your team is rattled.", phases:['riva']}
  },

  deaths: {
    broke:"NVIDIA ran out of money. Payroll bounced and the doors closed. In real life Jensen came within about thirty days of this ending.",
    morale:"The team lost faith and walked out. A company is its people, and they were gone.",
    window:"The market window closed. Rivals shipped first, and RIVA 128 arrived too late to matter."
  }
};

/* ---------- Era presentation: title, intro, story characters, moods, memories, epilogue ---------- */
Object.assign(LC.DATA, {
  era: 1, saveKey: 'lc_era1_save',
  title: {
    kicker: 'ERA 1 OF THE LONG CLIMB · 1993–1997', h1: 'Thirty Days',
    paras: ['You are <b>Jensen Huang</b>, a 30-year-old chip designer at LSI Logic. Two engineers want you to help them start a graphics company. Almost all of them fail.',
      'Explore Silicon Valley. Raise the money. Hire the team. Make the calls that decide whether NVIDIA lives. Every day costs money, and the money runs out.'],
    warn: '<b>Permadeath.</b> If NVIDIA runs out of cash, the team walks out, or you miss the market window, the run ends and the save is erased.'
  },
  intro: { title: 'February 1993', sub: 'San Jose, California',
    text: "Chris Malachowsky and Curtis Priem have asked you to meet them at the Denny's in East San Jose. They have an idea. Follow the yellow marker and the compass." },
  /* story characters; where they stand is decided by Sim.npcPlacement(S) */
  storyNPCs: [
    { id: 'chris', name: 'Chris Malachowsky', look: { shirt: 0x5b7a99, hair: 0x6b5a4a } },
    { id: 'curtis', name: 'Curtis Priem', look: { shirt: 0x996b3d, hair: 0x2a2a2a, glasses: true } },
    { id: 'lori', name: 'Lori Huang', look: { shirt: 0xb85c7a, hair: 0x3a2a1a } },
    { id: 'wilf', name: 'Wilf Corrigan · LSI CEO', look: { shirt: 0x333a44, hair: 0xcccccc } }
  ],
  moods: { idea: [0x9ccbe8, .9, .75], raise: [0xa9d3ee, .95, .8], nv1: [0x8fbfe0, .9, .75], crisis: [0x4a4258, .55, .35], riva: [0xe8b48a, .8, .65], launch2: [0xb0dcff, 1, .85] },
  musicMood: { idea: 'hope', raise: 'hope', nv1: 'tense', crisis: 'dark', riva: 'tense', launch2: 'bright', won: 'bright' },

  memoryCheck(S) {
    const m = S.mem || {}, co = LC.Sim.company();
    if (S.phase === 'raise' && !m.kentucky) return 'kentucky';
    if (co && LC.Sim.runway() < 6 && !m.night) return 'night';
    if (S.flags.laidOff && !m.faces) return 'faces';
    if (S.flags.segaDone && !m.tokyo) return 'tokyo';
    return null;
  },
  memories: {
    kentucky: S => ({ label: 'A memory · dramatized', when: 'Oneida, Kentucky · 1973', paras: [
      'Before the first pitch, you remember a different room.',
      'You were nine, an ocean away from your parents, at a tough school in rural Kentucky. Your job was cleaning the bathrooms. Every day. You did it properly anyway.',
      'Sand Hill Road is just another hard room. <em>You have been in harder ones.</em>'], fx: () => { S.energy = Math.min(100, S.energy + 15); } }),
    night: S => ({ label: 'Inner thoughts · dramatized', when: '2:14 a.m.', mood: 'dark', paras: [
      `The house is quiet. You run the numbers again on a yellow pad. ${S.cash < 0 && S.graceUntil ? `You are ${LC.Sim.money(-S.cash)} in the red. Payroll bounces in ${Math.max(0, S.graceUntil - S.day)} days.` : (w => `${w} week${w === 1 ? '' : 's'} of payroll left.`)(Math.max(1, Math.floor(LC.Sim.runway())))} ${S.team} people and their families are counting on you.`,
      'You think of the dish pit at Denny\'s when you were fifteen. The stack never ended. So you didn\'t look at the stack. You washed the next plate.',
      'You put the pen down. <em>Tomorrow, the next plate.</em>'], fx: () => { S.morale = Math.min(100, S.morale + 5); } }),
    faces: S => {
      const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
      const dep = S.departed || [], names = dep.slice(-Math.min(8, dep.length)).map(p => `${esc(p.n)}, ${esc(p.r)}`);
      return { label: 'The day after · dramatized', when: LC.Sim.dateStr(), mood: 'dark', paras: [
        'You walk the office floor. Half the desks are empty boxes.',
        names.length ? names.join(' · ') + (dep.length > 8 ? ` · and ${dep.length - 8} more` : '') : 'People who believed in NVIDIA when it was nothing.',
        'They believed in this company when it was nothing. Founders rarely talk about this part. <em>You will carry their names.</em>'] };
    },
    tokyo: S => ({ label: 'Inner thoughts · dramatized', when: 'Over the Pacific', paras: S.flags.segaPaid ? [
      'Somewhere over the ocean you notice your hands are shaking.',
      'You told a partner the truth: that your own chip was wrong. And he helped you anyway.',
      '<em>Remember this. Remember who believed in you.</em>'] : [
      'The flight home is long and quiet.',
      'You told the truth and it wasn\'t enough. The company has only what is left in the bank.',
      '<em>Then it will have to be enough.</em>'] }),
    silicon: S => ({ label: 'A moment', when: LC.Sim.dateStr(), mood: 'bright', paras: [
      'The first chips come back from the fab. Someone powers on a board.',
      'A 3D scene fills the screen, fast and clean. For one second nobody says anything.',
      'Then the whole office is shouting. <em>Four years. Two chips. One near-death. And this.</em>'] })
  },
  epilogue: {
    cards: [
      { when: '1999', t: 'NVIDIA goes public. Months later it launches GeForce 256, the first chip it calls a GPU.' },
      { when: '2006', t: 'CUDA: a bet that GPUs could do far more than graphics. Wall Street was unimpressed for years. He kept funding it anyway.' },
      { when: '2012', t: 'Researchers train AlexNet on two NVIDIA graphics cards. The AI era starts on chips first built for games.' },
      { when: '2023 – 2025', t: 'NVIDIA becomes the engine of modern AI. In October 2025 it becomes the first company worth $5 trillion.' },
      { when: '1993 – 2026', t: 'He led the company he co-founded for 33 years, until he resigned in November 2026. What built it was the same habit: <em>the next plate.</em>' }
    ],
    tribute: { label: 'A tribute', when: 'Jensen Huang', paras: [
      'Every number you watched fall toward zero in this game, he watched too. He didn\'t have a restart button.',
      'This game is a tribute to that persistence: to a boy who cleaned bathrooms in Kentucky, washed dishes at Denny\'s, and refused to let a company die.',
      '<em>Thank you for playing.</em>'] }
  }
});
