/* The Long Climb · Era 2 "The Bet" (1998–2008) — all story data lives here.
   Dramatized from public accounts; dialogue is invented. Game numbers are simplified. Verify facts before publishing. */
window.LC = window.LC || {};
LC.DATA = {
  era: 2, saveKey: 'lc_era2_save', namedStaff: false,
  locations: {
    home:      {name:"Home", sub:"Jensen & Lori's house", x:-115, z:105, w:14, d:12, h:6, col:0xd8c7a3, kind:'house'},
    dennys:    {name:"Denny's", sub:"Where it started", x:35, z:100, w:18, d:12, h:5, col:0xeeeeee, kind:'diner'},
    nvidia:    {name:"NVIDIA HQ", sub:"Santa Clara", x:-35, z:-40, w:34, d:24, h:16, col:0x2f3a40, kind:'nvidia'},
    threedfx:  {name:"3dfx Interactive", sub:"Your biggest rival", x:115, z:35, w:28, d:18, h:12, col:0x5a4f7a, kind:'office'},
    stanford:  {name:"Stanford University", sub:"Computer science labs", x:-120, z:-110, w:26, d:16, h:10, col:0xc9b18a, kind:'campus'},
    studio:    {name:"Game studio", sub:"Developers who make or break a chip (fictional)", x:-45, z:-120, w:16, d:12, h:7, col:0x6a7a5a, kind:'office'},
    store:     {name:"Electronics store", sub:"Where gamers vote with their wallets", x:-125, z:-40, w:20, d:14, h:7, col:0xd9d2c0, kind:'store'},
    airport:   {name:"San Jose Airport", sub:"Taiwan · New York · Redmond", x:120, z:125, w:36, d:20, h:10, col:0xcfd6dc, kind:'airport'},
    expo:      {name:"Launch Hall", sub:"Where new chips meet the press", x:115, z:-115, w:34, d:24, h:12, col:0x4a3f6b, kind:'expo'}
  },

  npcs: [
    {id:'fabvet', name:"Fab veteran", x:108, z:140, shirt:0x6b6b6b, hint:'tsmc',
     lines:["Morris Chang built TSMC to make chips for companies that design but don't manufacture. Companies like yours.","He thinks in decades. Show him a partner for twenty years, not a customer for one chip."]},
    {id:'gamedev', name:"Game developer", x:-36, z:-104, shirt:0x2e8b57, hint:'tl',
     lines:["Our engine spends half its time on geometry: transforming and lighting every vertex on the CPU.","Put transform and lighting on the graphics chip and we could build worlds ten times bigger."]},
    {id:'analyst', name:"Wall Street analyst", x:-20, z:-22, shirt:0x24344f, hint:'street',
     lines:["The Street forgives a miss you own. It never forgives a promise you break.","Hype buys you one quarter. Then the bar is higher."]},
    {id:'fxeng', name:"3dfx engineer", x:128, z:50, shirt:0x7a3fa0, hint:'threedfx',
     lines:["Off the record? We're bleeding cash. The good engineers are polishing their résumés.","Whoever picks up this team gets a year of talent overnight."]},
    {id:'clerk', name:"Store clerk", x:-114, z:-26, shirt:0xc0392b, hint:'cadence',
     lines:["Gamers buy whatever wins the benchmarks this month.","Ship something new every six months, or watch your shelf space go to someone who does."]},
    {id:'student', name:"Grad student", x:-108, z:-96, shirt:0x8e6b3a, hint:'cuda',
     lines:["We trick graphics cards into doing physics by pretending our data is textures. It's painful.","If someone let us write normal C code for the GPU... every lab in the world would buy one."]}
  ],
  hints: {
    tsmc:"With Morris Chang: talk partnership and decades, not price.",
    tl:"Developers want transform & lighting on the chip. It makes GeForce 256 harder to build, but far better.",
    street:"On earnings calls, owning a miss costs less over time than hype. Hype raises the next quarter's bar.",
    threedfx:"3dfx is collapsing. Its engineers are a prize, if you move.",
    cadence:"Gamers reward whoever ships most often. Falling behind rivals drains market share every day.",
    cuda:"Researchers want to program GPUs in plain C. Put it in every GPU and they'll come, slowly."
  },

  notes: [
    {x:-100, z:120, t:"NVIDIA went public on January 22, 1999, at $12 a share."},
    {x:-60,  z:30,  t:"GeForce 256 (August 1999) was marketed as the world's first GPU, with transform and lighting on the chip."},
    {x:20,   z:120, t:"NVIDIA designed the graphics chip for Microsoft's original Xbox (2001)."},
    {x:140,  z:10,  t:"In December 2000 NVIDIA acquired the assets of its old rival 3dfx."},
    {x:-10,  z:-70, t:"As Jensen has told it, he wrote to TSMC founder Morris Chang asking to work together, and Chang called him back. The partnership lasted decades."},
    {x:-150, z:-130,t:"GeForce FX (2003) was widely criticised as late, hot and loud, while ATI's Radeon 9700 took the lead."},
    {x:60,   z:-140,t:"GeForce 6800 (2004) put NVIDIA back on top."},
    {x:150,  z:-80, t:"GeForce 8800 (G80, November 2006) was the first GPU built for CUDA, letting programmers use it for general computing in C."},
    {x:150,  z:150, t:"Ian Buck created the Brook GPU language at Stanford, then joined NVIDIA and led the creation of CUDA."},
    {x:-150, z:60,  t:"In 2008 NVIDIA took a charge of roughly $150–200 million for faulty laptop chips, and its stock fell sharply in the financial crisis."}
  ],

  /* timed dialogue battles: d = how much the answer moves the meter */
  battles: {
    tsmc: { title:'TSMC · Hsinchu, Taiwan', who:'Morris Chang, TSMC founder', meter:'Trust', start:40, pass:70, time:16, rounds:[
      {q:"\"NVIDIA is small. Why should TSMC give you our best capacity?\"", a:[
        {t:"\"Because we'll grow into one of your biggest customers, and we'll still be here in twenty years.\"", d:20},
        {t:"\"Because we'll pay a premium this year.\"", d:-5},
        {t:"\"Because our chips are the best in the world.\"", d:-10}]},
      {q:"\"And if your next chip fails?\"", a:[
        {t:"\"Then we'll be designing the one after it, on your process.\"", d:15},
        {t:"\"It won't.\"", d:-15},
        {t:"\"Then we'd need flexible terms.\"", d:-5}]},
      {q:"\"How do you see this relationship?\"", a:[
        {t:"\"As partners. You master manufacturing, we master design. It's one bet.\"", d:20},
        {t:"\"As a supplier we can switch if prices change.\"", d:-25},
        {t:"\"As a quick way to get capacity.\"", d:-5}]}]},
    roadshow: { title:'IPO roadshow · New York', who:'Fund managers', meter:'Demand', start:40, pass:65, time:14, rounds:[
      {q:"\"3dfx owns PC gaming. Why buy NVIDIA?\"", a:[
        {t:"\"We ship a new generation faster than anyone. In two years this market will look different.\"", d:15},
        {t:"\"3dfx is overrated.\"", d:-10},
        {t:"\"Our marketing is better.\"", d:-10}]},
      {q:"\"What's your margin story?\"", a:[
        {t:"\"Fabless, high volume, premium products. Margins grow as we lead.\"", d:15},
        {t:"\"We'll cut prices to win share.\"", d:-10},
        {t:"\"Margins don't matter yet.\"", d:-15}]},
      {q:"\"Isn't 3D graphics a fad?\"", a:[
        {t:"\"It's the beginning. Every computer and every game will need it.\"", d:15},
        {t:"\"Maybe. That's why we're diversifying.\"", d:-5},
        {t:"\"Who knows?\"", d:-15}]},
      {q:"\"Why should we trust management?\"", a:[
        {t:"\"In 1996 we nearly died. We cut deep, told the truth, and came back with RIVA 128. We know how to survive.\"", d:20},
        {t:"\"We've never made a mistake.\"", d:-20},
        {t:"\"The founders own a lot of stock.\"", d:0}]}]},
    xbox: { title:'Microsoft · Redmond', who:'Xbox team', meter:'Confidence', start:40, pass:65, time:14, rounds:[
      {q:"\"We need the graphics chip for a brand-new console, fast. Can you do it?\"", a:[
        {t:"\"Yes. A dedicated team, and our PC roadmap doesn't slip.\"", d:15},
        {t:"\"Yes. We'll pull everyone onto it.\"", d:-5, divert:true},
        {t:"\"Probably.\"", d:-15}]},
      {q:"\"We need certainty on cost.\"", a:[
        {t:"\"We'll commit to a price, and we'll need an advance to fund the work.\"", d:15},
        {t:"\"Whatever you need.\"", d:-10},
        {t:"\"Show us volume first.\"", d:-5}]},
      {q:"\"Why not 3dfx or ATI?\"", a:[
        {t:"\"Because we ship on time, every time. Look at our cadence.\"", d:15},
        {t:"\"Because they're weaker.\"", d:-5},
        {t:"\"Because we want it more.\"", d:-5}]}]},
    board: { title:'Board meeting · Santa Clara', who:'The board', meter:'Support', start:40, pass:70, time:16, rounds:[
      {q:"\"The stock has collapsed. Why are we still spending on CUDA?\"", a:[
        {t:"\"Because it's the most important thing we're building. Every GPU we ship becomes a computer for scientists.\"", d:20},
        {t:"\"We'll cut it back until things recover.\"", d:-20},
        {t:"\"It's too late to stop now.\"", d:-5}]},
      {q:"\"The laptop chip failures. What happened?\"", a:[
        {t:"\"We made a mistake. We're paying to fix it and we've changed how we test.\"", d:15, honest:true},
        {t:"\"It was a supplier problem.\"", d:-10},
        {t:"\"It's overblown.\"", d:-20}]},
      {q:"\"Should we lay people off?\"", a:[
        {t:"\"We cut costs everywhere except the future. Engineering stays.\"", d:15},
        {t:"\"Yes. Twenty percent.\"", d:-5},
        {t:"\"Let's wait and see.\"", d:-10}]},
      {q:"\"Why should we trust you through this?\"", a:[
        {t:"\"Because I've been thirty days from the end before. I know how to get through this.\"", d:20},
        {t:"\"Because I founded this company.\"", d:-5},
        {t:"\"Because there's no one else.\"", d:-15}]}]}
  },
  analystQs: [
    {q:"\"Your gross margin is falling. Why?\"", cuda:true, a:[
      {t:"\"We're building a new computing platform into every GPU. Here's the roadmap.\"", d:10},
      {t:"\"It's temporary.\"", d:-5},
      {t:"\"Margins aren't our focus.\"", d:-15}]},
    {q:"\"A rival is ahead on benchmarks. What's your answer?\"", a:[
      {t:"\"Our next chip ships on schedule, and we've owned our mistakes.\"", d:12},
      {t:"\"Benchmarks are misleading.\"", d:-10},
      {t:"\"We'll cut prices.\"", d:-5}]},
    {q:"\"What is NVIDIA in ten years?\"", a:[
      {t:"\"A computing company. GPUs will do far more than games.\"", d:12},
      {t:"\"The biggest graphics company in the world.\"", d:3},
      {t:"\"Hard to say.\"", d:-10}]},
    {q:"\"Will you hit next quarter?\"", a:[
      {t:"\"We'll tell you the truth either way.\"", d:8},
      {t:"\"Absolutely. Guaranteed.\"", d:-5, hype:true},
      {t:"\"No comment.\"", d:-8}]}
  ],

  events: {
    poach:{title:"Talent war", text:"A rival offers your best architect double the salary.", phases:['geforce','fx','cuda']},
    burnout:{title:"Running on empty", text:"The chip team has worked every weekend for two months.", phases:['geforce','fx','cuda']},
    lori:{title:"A phone call from home", text:"Lori calls. You missed dinner again, and it's your anniversary.", phases:['geforce','rivals','fx','cuda','crash']},
    leak:{title:"A rival strikes first", text:"A rival unveils its next chip months early. The press is already calling it the winner.", phases:['geforce','fx','cuda']},
    pricewar:{title:"Price war", text:"A rival slashes prices by 30%. Retailers want you to match.", phases:['rivals','fx','cuda']},
    cadence:{title:"Three teams, one rhythm", text:"Your architects propose three leapfrogging teams so NVIDIA ships a new generation every six months.", phases:['rivals']}
  },

  deaths: {
    board:"Wall Street's confidence collapsed and the board lost faith in the plan. In real life the board stood by the plan through 2008, and the bet survived.",
    market:"Rivals took the market. Gamers moved on, and so did the retailers.",
    broke:"NVIDIA ran out of money. Even a public company can run dry."
  },
  deathTitles: { board: 'The board lost faith', market: 'The market moved on', broke: 'NVIDIA is out of cash' },

  title: {
    kicker: 'ERA 2 OF THE LONG CLIMB · 1998–2008', h1: 'The Bet',
    paras: ['NVIDIA survived. Now it has to win. You are <b>Jensen Huang</b>, CEO of a small chip company in a field of giants.',
      'Win TSMC. Take NVIDIA public. Out-ship 3dfx and ATI. Then make the bet nobody understands: turning every graphics card into a computer, and keeping it alive while Wall Street punishes you for it.'],
    warn: '<b>Permadeath.</b> If market share collapses, Wall Street\'s confidence hits zero, or the cash runs out, the run ends and the save is erased.'
  },
  intro: { title: 'January 1998', sub: 'Santa Clara, California',
    text: "RIVA 128 saved the company. Now demand is outrunning supply, and NVIDIA needs a manufacturing partner big enough for its ambitions. The best one is in Taiwan. Follow the compass to the airport." },
  storyNPCs: [
    { id: 'chris', name: 'Chris Malachowsky', look: { shirt: 0x5b7a99, hair: 0x6b5a4a } },
    { id: 'curtis', name: 'Curtis Priem', look: { shirt: 0x996b3d, hair: 0x2a2a2a, glasses: true } },
    { id: 'lori', name: 'Lori Huang', look: { shirt: 0xb85c7a, hair: 0x3a2a1a } },
    { id: 'ian', name: 'Ian Buck', look: { shirt: 0x3b6e4f, hair: 0x3a2a1a, glasses: true } }
  ],
  moods: { foundry: [0x9ccbe8, .9, .75], ipo: [0xa9d3ee, .95, .8], geforce: [0x8fbfe0, .9, .75], rivals: [0xb0dcff, 1, .85],
    fx: [0x5a5268, .6, .4], cuda: [0x9fb8c8, .85, .7], crash: [0x3e3848, .5, .3] },
  musicMood: { foundry: 'hope', ipo: 'hope', geforce: 'tense', rivals: 'bright', fx: 'dark', cuda: 'tense', crash: 'dark', won: 'bright' },

  memoryCheck(S) {
    const m = S.mem || {};
    if (S.flags.ipoDone && !m.bell) return 'bell';
    if (S.flags.fxDecided && !m.loud) return 'loud';
    if (S.flags.cudaDecided && S.cuda === 'all' && !m.everywhere) return 'everywhere';
    if (S.phase === 'crash' && S.conf < 30 && !m.chart) return 'chart';
    return null;
  },
  memories: {
    bell: S => ({ label: 'A moment · dramatized', when: 'January 22, 1999 · Nasdaq', mood: 'bright', paras: [
      'Six years ago you were planning a company over coffee at Denny\'s. Three years ago payroll was thirty days from bouncing.',
      'Today, NVIDIA\'s stock starts trading. People are clapping. You think of the people who packed their desks in 1996.',
      '<em>This one is for them too.</em>'] }),
    loud: S => ({ label: 'Inner thoughts · dramatized', when: LC.Sim.dateStr(), mood: 'dark', paras: [
      'The reviews are brutal. Your new chip is late, hot and loud, and ATI is winning.',
      'You have been wrong before. NV1 was wrong. You survived it by saying so out loud, and then fixing it.',
      '<em>Say it out loud. Then fix it.</em>'] }),
    everywhere: S => ({ label: 'Inner thoughts · dramatized', when: LC.Sim.dateStr(), paras: [
      'Every analyst asks the same question: why put a supercomputer inside a gaming card nobody asked for?',
      'You can see something they can\'t yet. Scientists. Students in labs like the ones at Stanford. Problems nobody has been able to compute.',
      '<em>Put it everywhere. Then wait for them, however long it takes.</em>'] }),
    chart: S => ({ label: 'Inner thoughts · dramatized', when: LC.Sim.dateStr(), mood: 'dark', paras: [
      'The stock chart looks like the bank balance in 1996. A straight line down.',
      'Everyone wants you to cut the one thing that isn\'t paying off yet. The thing you believe in most.',
      'You think of the dish pit again. <em>The next plate. Just the next plate.</em>'] })
  },
  epilogue: {
    cards: [
      { when: '2012', t: 'Researchers in Toronto train AlexNet using CUDA on two NVIDIA graphics cards. The bet everyone questioned becomes the foundation of modern AI.' },
      { when: '2016', t: 'Jensen hand-delivers NVIDIA\'s first AI supercomputer, the DGX-1, to a small team at OpenAI.' },
      { when: '2022 – 2025', t: 'ChatGPT arrives and the world runs on NVIDIA GPUs. In October 2025 NVIDIA becomes the first company worth $5 trillion.' },
      { when: 'Looking back', t: 'The CUDA years, when almost no one believed, turned out to be the most important bet of his 33 years leading NVIDIA.' }
    ],
    tribute: { label: 'A tribute', when: 'Jensen Huang', paras: [
      'For years CUDA looked like a mistake on every earnings call. He kept paying for a future only he could see.',
      'Persistence is not only surviving the crisis. It is believing in something long after everyone else stopped.',
      '<em>Thank you for playing. Era 3, the AI years, is next.</em>'] }
  }
};
