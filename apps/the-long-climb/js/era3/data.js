/* The Long Climb · Era 3 "The AI Era" (2012–2026) — all story data lives here.
   Dramatized from public accounts; dialogue is invented. Game numbers are simplified.
   The ending states only facts confirmed by NVIDIA (Nov 12, 2026 release) and by Huang's own Nov 8 email; no allegations. */
window.LC = window.LC || {};
LC.DATA = {
  era: 3, saveKey: 'lc_era3_save', namedStaff: false,
  locations: {
    home:     {name:"Home", sub:"A quiet evening, rarely", x:-115, z:105, w:14, d:12, h:6, col:0xd8c7a3, kind:'house'},
    dennys:   {name:"Denny's", sub:"Where it started", x:35, z:100, w:18, d:12, h:5, col:0xeeeeee, kind:'diner'},
    nvidia:   {name:"NVIDIA HQ", sub:"Santa Clara", x:-35, z:-40, w:40, d:26, h:18, col:0x2f3a40, kind:'nvidia'},
    datacenter:{name:"Data center", sub:"Where the GPUs actually live", x:115, z:35, w:30, d:20, h:10, col:0x5f6a75, kind:'office'},
    stanford: {name:"AI lab · Stanford", sub:"Researchers training neural networks", x:-120, z:-110, w:26, d:16, h:10, col:0xc9b18a, kind:'campus'},
    openai:   {name:"OpenAI", sub:"A small research lab in San Francisco", x:-45, z:-120, w:16, d:12, h:7, col:0x8a8f96, kind:'office'},
    store:    {name:"Electronics store", sub:"Gamers, miners, and graphics cards", x:-125, z:-40, w:20, d:14, h:7, col:0xd9d2c0, kind:'store'},
    airport:  {name:"San Jose Airport", sub:"Toronto · Taiwan · Israel · New York", x:120, z:125, w:36, d:20, h:10, col:0xcfd6dc, kind:'airport'},
    expo:     {name:"GTC", sub:"San Jose · NVIDIA's own conference", x:115, z:-115, w:34, d:24, h:12, col:0x2f4a1f, kind:'expo'}
  },

  npcs: [
    {id:'researcher', name:"AI researcher", x:-108, z:-96, shirt:0x8e6b3a, hint:'alexnet',
     lines:["A team in Toronto trained a neural network on two gaming GPUs and crushed the ImageNet contest.","Everyone in this lab just ordered GeForce cards. Nobody saw that coming."]},
    {id:'miner', name:"Crypto miner", x:-114, z:-26, shirt:0xc0392b, hint:'crypto',
     lines:["Half the graphics cards in this store end up mining crypto.","When the coin price crashes, all those cards come back on the market at once. Watch your inventory."]},
    {id:'engineer', name:"Network engineer", x:128, z:50, shirt:0x3f6f9f, hint:'mellanox',
     lines:["Connect ten thousand GPUs and the bottleneck isn't the chips. It's the network between them.","Whoever owns the fastest interconnect owns the data center."]},
    {id:'policy', name:"Policy expert", x:-14, z:-20, shirt:0x24344f, hint:'arm',
     lines:["Buying Arm? Regulators in Washington, London and Brussels will all fight it.","Some deals cost you money even when they fail."]},
    {id:'founder', name:"Startup founder", x:-36, z:-104, shirt:0x2e8b57, hint:'supply',
     lines:["Since ChatGPT, everyone needs H100s and nobody can get them.","The bottleneck isn't the chip. It's the advanced packaging in Taiwan."]},
    {id:'analyst', name:"Market analyst", x:104, z:-98, shirt:0xa04060, hint:'efficiency',
     lines:["When AI gets cheaper to run, people don't use less of it. They use far more.","Panics about efficiency come and go. Demand for compute keeps climbing."]}
  ],
  hints: {
    alexnet:"AlexNet ran on NVIDIA gaming GPUs. Deep learning could change everything, if you commit.",
    crypto:"Crypto demand is fragile. A crash leaves inventory piled up. Be honest about it.",
    mellanox:"Networking is the bottleneck between GPUs. Mellanox is the prize.",
    arm:"An Arm acquisition will face regulators on three continents.",
    supply:"After ChatGPT, packaging capacity at TSMC limits everything. Win it in Taiwan.",
    efficiency:"When AI gets more efficient, demand for compute grows. Say so when markets panic."
  },

  notes: [
    {x:-100, z:120, t:"In 2012, AlexNet won the ImageNet challenge after being trained on two NVIDIA GeForce GTX 580 cards."},
    {x:-60,  z:30,  t:"NVIDIA released cuDNN in 2014, a library that made its GPUs the default for deep learning."},
    {x:20,   z:120, t:"In 2016 Jensen personally delivered NVIDIA's first DGX-1 AI supercomputer to OpenAI."},
    {x:140,  z:10,  t:"When crypto mining collapsed in late 2018, NVIDIA was left with excess inventory and its stock fell sharply."},
    {x:-10,  z:-70, t:"NVIDIA agreed to buy Mellanox for $6.9 billion in 2019; the deal closed in 2020."},
    {x:-150, z:-130,t:"NVIDIA's $40 billion bid for Arm (2020) was abandoned in February 2022 after regulatory opposition."},
    {x:60,   z:-140,t:"After ChatGPT launched in November 2022, demand for H100 GPUs far outstripped supply."},
    {x:150,  z:-80, t:"In May 2023 NVIDIA became the first chipmaker worth $1 trillion."},
    {x:150,  z:150, t:"On January 27, 2025, NVIDIA lost about $590 billion in market value in one day after DeepSeek's model release."},
    {x:-150, z:60,  t:"On October 29, 2025, NVIDIA became the first company ever worth $5 trillion."}
  ],

  battles: {
    retreat: { title:'Leadership offsite · Santa Clara', who:'Your executive team', meter:'Conviction', start:40, pass:65, time:16, rounds:[
      {q:"\"Deep learning is a research curiosity. Why bet the company on it?\"", a:[
        {t:"\"It learns from data instead of rules, and it runs best on our GPUs. Every industry will use it.\"", d:20},
        {t:"\"Because it's what everyone is talking about.\"", d:-15},
        {t:"\"Let's start with a small pilot.\"", d:-5}]},
      {q:"\"What would we have to change?\"", a:[
        {t:"\"Everything. Chips, libraries, systems. We become an AI computing company.\"", d:15},
        {t:"\"Mostly the marketing.\"", d:-15},
        {t:"\"Add a few features to GeForce.\"", d:-5}]},
      {q:"\"And if it's a fad?\"", a:[
        {t:"\"Then we've still built the best parallel computers in the world. But it isn't a fad.\"", d:15},
        {t:"\"Then we pivot again.\"", d:-5},
        {t:"\"It can't be.\"", d:-10}]}]},
    mellanox: { title:'Mellanox · Yokneam, Israel', who:'Mellanox leadership', meter:'Interest', start:40, pass:65, time:15, rounds:[
      {q:"\"Intel is bidding too. Why NVIDIA?\"", a:[
        {t:"\"Together we build the data center as one computer: GPUs and networking designed as one.\"", d:20},
        {t:"\"We'll simply pay more.\"", d:-5},
        {t:"\"Intel will just absorb you.\"", d:-10}]},
      {q:"\"What happens to our people in Israel?\"", a:[
        {t:"\"Israel becomes a core NVIDIA site. We invest and we grow it.\"", d:15},
        {t:"\"We'll consolidate.\"", d:-15},
        {t:"\"We'll see.\"", d:-5}]},
      {q:"\"Your offer?\"", a:[
        {t:"\"$6.9 billion in cash, and a long-term commitment.\"", d:15},
        {t:"\"Let's start lower.\"", d:-10},
        {t:"\"All stock.\"", d:-5}]}]},
    tsmc: { title:'TSMC · Hsinchu, Taiwan', who:'TSMC leadership', meter:'Capacity', start:40, pass:65, time:15, rounds:[
      {q:"\"Everyone wants advanced packaging capacity. Why NVIDIA first?\"", a:[
        {t:"\"We've built with you for twenty-five years, and we'll commit to volumes years ahead.\"", d:20},
        {t:"\"We'll pay whatever it costs this quarter.\"", d:-5},
        {t:"\"Because we're the biggest customer now.\"", d:-10}]},
      {q:"\"Will this demand last?\"", a:[
        {t:"\"It's a new kind of computing. We'll sign long-term commitments to prove it.\"", d:15},
        {t:"\"Probably.\"", d:-10},
        {t:"\"Who knows, but we need it now.\"", d:-5}]},
      {q:"\"What exactly do you need?\"", a:[
        {t:"\"Double the capacity within a year, and we'll help fund it.\"", d:15},
        {t:"\"Everything you have.\"", d:-10},
        {t:"\"Whatever you can spare.\"", d:0}]}]},
    keynote: { title:'GTC 2026 · San Jose', who:'The audience', meter:'Excitement', start:45, pass:70, time:16, rounds:[
      {q:"The lights go down. How do you open?", a:[
        {t:"With the story of computing: from graphics, to CUDA, to AI, and why the next decade is bigger.", d:15},
        {t:"With the stock price.", d:-15},
        {t:"With a joke about the leather jacket.", d:5}]},
      {q:"Developers want to know: why build on NVIDIA?", a:[
        {t:"\"One platform, CUDA, from a laptop to a data center, kept compatible for twenty years.\"", d:15},
        {t:"\"Because we're the biggest.\"", d:-10},
        {t:"\"Because we're the fastest.\"", d:3}]},
      {q:"Show them what's next.", a:[
        {t:"Vera Rubin: a full AI factory, built with partners around the world.", d:15},
        {t:"A slide with bigger numbers.", d:0},
        {t:"Hint at a secret project and say nothing more.", d:-5}]},
      {q:"How do you close?", a:[
        {t:"Thank the engineers who built it. Every chip on that stage is their work.", d:20},
        {t:"Announce a stock buyback.", d:-10},
        {t:"Walk off to the music.", d:0}]}]}
  },
  analystQs: [
    {q:"\"Is AI a bubble?\"", a:[
      {t:"\"Computing is being rebuilt around AI. That's a platform shift, not a bubble.\"", d:12},
      {t:"\"Maybe, but we'll be fine.\"", d:-8},
      {t:"\"Our stock says no.\"", d:-10}]},
    {q:"\"Gaming revenue fell. What happened?\"", a:[
      {t:"\"Crypto demand disappeared and we have excess inventory. Here's how we work through it.\"", d:12},
      {t:"\"It's seasonal.\"", d:-10},
      {t:"\"Gaming isn't our focus anymore.\"", d:-8}]},
    {q:"\"Customers are designing their own AI chips. Worried?\"", a:[
      {t:"\"We compete by moving faster and offering the whole platform, not just a chip.\"", d:12},
      {t:"\"They'll fail.\"", d:-10},
      {t:"\"A little.\"", d:-3}]},
    {q:"\"Will you hit next quarter?\"", a:[
      {t:"\"We'll tell you the truth either way.\"", d:8},
      {t:"\"Absolutely. Guaranteed.\"", d:-5, hype:true},
      {t:"\"No comment.\"", d:-8}]}
  ],

  events: {
    burnout:{title:"Running on empty", text:"The chip team has worked through every holiday this year.", phases:['pascal','blackwell','rubin']},
    poach:{title:"Talent war", text:"A tech giant offers your top AI architects double their pay to build its own chips.", phases:['pascal','chatgpt','blackwell','rubin']},
    leak:{title:"A rival strikes", text:"A rival announces an AI accelerator it says beats yours. The press runs with it.", phases:['pascal','blackwell','rubin']},
    pricewar:{title:"Price pressure", text:"Your biggest customers push hard for lower prices, threatening to switch.", phases:['chatgpt','blackwell','rubin']}
  },

  deaths: {
    board:"Wall Street's confidence collapsed and the company lost its nerve. In real life NVIDIA held its course through every crash of this era.",
    market:"Rivals and in-house chips took the AI market. The platform you built became one option among many.",
    broke:"NVIDIA ran out of cash. Even the AI boom can't save a company that spends faster than it earns."
  },
  deathTitles: { board: 'Wall Street gave up', market: 'The AI market moved on', broke: 'NVIDIA is out of cash' },

  title: {
    kicker: 'ERA 3 OF THE LONG CLIMB · 2012–2026', h1: 'The AI Era',
    paras: ['A neural network trained on two of your gaming cards has just shocked the research world. You are <b>Jensen Huang</b>, and you have to decide whether to bet the company on it.',
      'Pivot NVIDIA to AI. Deliver the first AI supercomputer. Survive the crypto crash and the deals that fail. Then ChatGPT arrives, and the whole world wants chips you can\'t make fast enough.'],
    warn: '<b>Permadeath.</b> If Wall Street\'s confidence hits zero, the AI market slips away, or the cash runs out, the run ends and the save is erased.'
  },
  intro: { title: 'October 2012', sub: 'Santa Clara, California',
    text: "A University of Toronto team has won the ImageNet challenge by a huge margin, using a neural network trained on NVIDIA gaming GPUs. Researchers everywhere are buying GeForce cards. Fly to Toronto and see it for yourself." },
  storyNPCs: [
    { id: 'chris', name: 'Chris Malachowsky', look: { shirt: 0x5b7a99, hair: 0x9a8a7a } },
    { id: 'ian', name: 'Ian Buck', look: { shirt: 0x3b6e4f, hair: 0x3a2a1a, glasses: true } },
    { id: 'colette', name: 'Colette Kress · CFO', look: { shirt: 0x6a3b5a, hair: 0xc9a46a } }
  ],
  moods: { alexnet: [0x9ccbe8, .9, .75], pascal: [0x8fbfe0, .9, .75], crypto: [0x4a4258, .55, .35], deals: [0x9fb8c8, .85, .7],
    chatgpt: [0xb0dcff, 1, .85], blackwell: [0x8fbfe0, .9, .75], rubin: [0xa9d3ee, .95, .8] },
  musicMood: { alexnet: 'hope', pascal: 'tense', crypto: 'dark', deals: 'tense', chatgpt: 'bright', blackwell: 'tense', rubin: 'bright', won: 'bright' },

  memoryCheck(S) {
    const m = S.mem || {};
    if (S.flags.toronto && !m.spark) return 'spark';
    if (S.flags.delivered && !m.delivery) return 'delivery';
    if (S.flags.trillion && S.conf >= 25 && !m.trillion) return 'trillion';
    if (S.flags.deepseek && !m.drop) return 'drop';
    return null;
  },
  memories: {
    spark: S => ({ label: 'Inner thoughts · dramatized', when: 'Toronto · late 2012', paras: [
      'A neural network taught itself to see. It learned on two GeForce cards built for video games.',
      'Twenty years of graphics. Six years of CUDA, when every analyst asked why. All of it, and this is what it was for.',
      '<em>Everything has to change now.</em>'], fx: () => { S.energy = Math.min(100, S.energy + 15); } }),
    delivery: S => ({ label: 'A moment · dramatized', when: 'San Francisco · 2016', mood: 'bright', paras: [
      'You carry the first DGX-1 into a small office yourself. A handful of researchers gather around the box.',
      'They want to build something nobody has built before. They will need a great deal of computing to do it.',
      '<em>So do the next thousand teams. Build for them.</em>'] }),
    trillion: S => ({ label: 'A moment · dramatized', when: 'May 30, 2023', mood: 'bright', paras: [
      'NVIDIA is worth a trillion dollars. The first chipmaker ever.',
      'Thirty years ago it was three engineers in a booth at Denny\'s. Twenty-seven years ago payroll was thirty days from bouncing.',
      'You think of the people who packed their desks in 1996. <em>Some of this is theirs.</em>'] }),
    drop: S => ({ label: 'Inner thoughts · dramatized', when: 'January 27, 2025', mood: 'dark', paras: [
      'About $590 billion of NVIDIA\'s value disappears in a single day, the biggest one-day loss in market history.',
      'A new model trained cheaply, and the market decided nobody would need as many GPUs.',
      'You have seen worse than a bad day. <em>Explain it plainly. Then keep building.</em>'] })
  },
  epilogue: {
    cards: [
      { when: 'October 29, 2025', t: 'NVIDIA becomes the first company ever worth $5 trillion.' },
      { when: '2026', t: 'Vera Rubin, the generation after Blackwell, begins reaching customers.' },
      { when: 'November 12, 2026', t: 'Jensen Huang resigns as CEO and from NVIDIA\'s board, effective immediately, days after acknowledging personal misconduct and as an independent board investigation is under way. CFO Colette Kress becomes interim CEO.' }
    ],
    tribute: { label: 'Thirty-three years', when: '1993 – 2026', paras: [
      'From a booth at Denny\'s to the most valuable company in the world. Through NV1, the thirty days, the lonely CUDA years, and the AI boom.',
      'How his time as CEO ended is his to answer for. This game remembers the persistence of those years, and the thousands of people who built NVIDIA with him.',
      '<em>Thank you for playing The Long Climb.</em>'] }
  }
};
