/* itis.js — "The Itis": Granddad's soul food restaurant, Ed Wuncler's money, and a neighbourhood that never wakes up */
(() => {
  'use strict';
  const BD = window.BD, U = BD.U, FX = BD.FX, L = BD.Lib;
  const A = () => BD.Audio;
  const CUST = { name: 'Customer' };

  /** somebody loses the fight with dinner */
  const nap = (f, quiet) => { f.pose('down', 9, 'closed'); if (!quiet) { A().sfx('thud', { vol: 0.5 }); FX.dust(f.x, 0, 4, '#d9cfbb'); } };
  const rise = (f, pose, expr) => f.pose(pose || f.idlePose, 9, expr || f.expr0);
  /** phases do not clean up after each other: clear the last scene's cast (their chatter stops with them) */
  const clear = (w) => { for (const f of w.fighters) if (f !== w.player) f.gone = true; };

  /* ------------------------------------------------ the riot: sluggish, sweaty, furious */
  const GREASY = L.E({ wind: 0.7, rec: 0.85, dmg: 6, kb: 220, lunge: 150 });
  const BELLY = L.E({ poses: ['stomp', 'flurry'], wind: 0.8, act: 0.26, rec: 0.95, dmg: 9, reach: 110, rush: 430, lunge: 0, down: true, kb: 420, sfx: 'whoosh_heavy' });
  const RIOT = ["I drove here ASLEEP for this!", "One more plate. I can stop anytime.", "My doctor fired me. I'm FREE!", "Check the fryer! Lick the fryer!",
    "I sold my treadmill for this!", "Don't make me stand up twice!", "I can taste my own pulse!", "Hold on... cramp... okay. RAAH!"];
  const sweat = (f) => FX.spark(f.x, f.y - f.hh + 20, 4, '#9fd0ff', 110);
  function* hungry(f, w) {
    if (Math.random() < 0.3) w.bubble(f, U.pick(RIOT));
    yield* L.grunt(f, w);
    if (Math.random() < 0.35) { sweat(f); f.pose('stagger', 10, 'pain'); yield 0.9; f.set('idle'); }   // winded: free hits
  }
  const NINE = ['I ASKED FOR SECONDS!', 'TABLE NINE DONT TIP!', 'I LIVE HERE NOW!', 'WHERE THE GRAVY AT!'];
  function* regularAI(f, w) {
    const d = f.data; d.n = (d.n || 0) + 1;
    if (d.n % 3 === 0) {              // every third move he has to catch his breath
      L.bark(f, 'HOLD ON... HOLD ON...', '#9fd0ff'); sweat(f); f.pose('stagger', 10, 'pain'); yield 1.5; f.set('idle'); return;
    }
    if (Math.random() < 0.4) L.bark(f, U.pick(NINE), '#ffb347');
    yield* L.guardAI(f, w);
  }

  BD.episode({
    id: 'itis', title: 'THE ITIS', src: 'inspired by Season 1, Episode 10', bg: 'house',
    blurb: 'Granddad opens a soul food restaurant with Ed Wuncler\'s money. The food is delicious. The neighborhood never wakes up from it.',
    loss: 'Granddad: "He ain\'t dead, he\'s FULL. ...Huey? Boy, you full?"',

    *intro(w) {
      w.setBg('house', {}); w.music('house', 0.1); w.place(700, 1); w.def.riotSeen = false;
      const gd = w.npc('granddad', 860, { face: -1, pose: 'handsHips' }), ri = w.npc('riley', 560, { face: 1, pose: 'lean' });
      w.look(720, 1.45);
      yield* w.narr('Sunday in Woodcrest. Most families here have brunch. Mine has an event with casualties.');
      yield* w.narr('Soul food was invented by people who were handed the scraps and made them taste like mercy. That was survival. Granddad does it on purpose.');
      yield* w.say('granddad', "Boy, get in that kitchen. Mr. Wuncler's coming by about the mortgage, and a full man don't foreclose.", 'scowl');
      yield* w.say('huey', "You're going to bribe the bank with pork.", 'deadpan');
      yield* w.say('granddad', "Pork, butter, and a third thing the county made me stop sayin' out loud. Ain't a banker alive can read a contract through gravy.", 'grin');
      yield* w.say('riley', "Granddad cookin' the BIG dinner? {N}, I been fastin' since Thursday. I'm tryna black out at the table.", 'grin');
      yield* w.say('huey', "That's not a goal.", 'deadpan');
      yield* w.say('riley', "That's the ONLY goal. You eat till the lights go off. That's how you know you won.", 'smirk');
      gd.rig.setPose('point', 12);
      yield* w.say('granddad', "Huey, carry the food out. And don't sniff it and make that face. That face is why you ain't got no friends.", 'scowl');
      yield* w.fadeOut(0.3);
      gd.gone = ri.gone = true;
    },

    phases: [
      /* 1 ---- the fateful dinner: set the table, count the bodies, meet the investor */
      function* (w) {
        clear(w); w.setBg('house', {}); w.music('house', 0.25); w.place(960, 1); w.zoom = 1.3; w.noFight = true;
        const gd = w.npc('granddad', 1110, { face: -1, pose: 'handsHips' });
        const ri = w.npc('riley', 540, { face: 1, pose: 'lean' }), tom = w.npc('tom', 780, { face: -1 }), jz = w.npc('jazmine', 880, { face: -1 });
        yield* w.fadeIn(0.3);
        w.toast('WALK INTO A DISH TO PICK IT UP', 5);
        w.chatter(ri, ["Hurry UP, {n}. My stomach eatin' itself.", "I can smell the pork from here. It smell like a felony."], 500);
        w.chatter(tom, ["Should I have signed a waiver?", "It smells wonderful. And slightly illegal."], 400);
        yield* w.collect([
          { x: 1040, name: 'PORK CHOP SORROW', col: '#e8a05a', on() { w.bubble(gd, "Fried twice. Once for flavor, once for spite."); } },
          { x: 1210, name: 'BISCUITS IN BUTTER GRAVY', col: '#ffe36e', on() { w.bubble(gd, "The gravy is butter. The butter is ALSO butter."); } },
          { x: 1350, name: 'HAM HOCK SURPRISE', col: '#e87a7a', on() { w.bubble(gd, "The surprise is another ham hock."); } },
          { x: 1490, name: 'SWEET POTATO REGRET', col: '#ff9d3b', on() { w.bubble(gd, "That ain't a side. That's a threat with marshmallows."); } },
        ], 'CARRY THE DISHES OUT OF THE KITCHEN');
        yield* w.goTo(680, 'SET THE TABLE', { r: 90 });
        w.cine(true); w.look(720, 1.4);
        yield* w.walk(gd, 960, 220);
        yield* w.say('granddad', "Bow your heads. Lord, forgive us for what we about to do to ourselves. Amen. EAT.", 'grin');
        A().sfx('crowd', { vol: 0.4 }); ri.rig.setPose('cheer', 12);
        yield* w.say('riley', "Granddad, this pork chop got ANOTHER pork chop inside it! This the greatest day of my whole li...", 'grin');
        nap(ri); w.bubble(ri, 'zzz... Young Reezy... undefeated...');
        yield* w.wait(0.7);
        yield* w.say('tom', "Mr. Freeman, this is incredible. Although as an officer of the court, I should disclose that my cholesterol is technically a pre-exist...", 'worry');
        nap(tom); w.bubble(tom, 'zzz... no further questions...');
        jz.rig.expr = 'shock';
        yield* w.say('jazmine', "DADDY! Daddy's DEAD! The gravy killed my daddy!", 'shock');
        w.player.face = 1;
        yield* w.say('huey', "He's not dead, Jazmine. It's the itis. All the blood leaves the brain to go help the stomach. For your father that's a short trip.", 'deadpan');
        yield* w.say('jazmine', "So his brain is EMPTY?", 'worry');
        yield* w.say('huey', "Professionally, yes.", 'deadpan');
        gd.rig.setPose('handsHips', 12);
        yield* w.say('granddad', "See that? THAT is how you know it's good. Food ain't done its job till somebody's face down in it.", 'grin');
        yield* w.say('huey', "Two people just lost consciousness at your table.", 'scowl');
        yield* w.say('granddad', "And not ONE complaint! ...I'ma rest my eyes. Don't nobody touch my plate. I got that plate memorized.", 'closed');
        nap(gd); w.bubble(gd, 'zzz... I marched... for this gravy...');
        yield* w.narr('The itis. Medically: postprandial somnolence. Historically: the only rest some people were ever allowed. In this house: a tradition and a choking hazard.');
        w.cine(false);
        yield* w.interact(tom, 'CHECK MR. DUBOIS FOR A PULSE', 'CHECK');
        w.bubble(tom, 'zzz... I plead... delicious...');
        yield* w.interact(ri, 'CHECK RILEY FOR A PULSE', 'CHECK');
        w.bubble(ri, "zzz... touch my plate and die, {n}...");
        yield 0.8;
        A().sfx('bell'); w.toast('THE DOORBELL', 3);
        const wu = w.npc('wuncler', 120, { face: 1 });
        yield* w.goTo(330, 'ANSWER THE DOOR', { r: 110 });
        w.cine(true); w.look(480, 1.4); w.player.face = -1;
        yield* w.say('wuncler', "Don't get up, the door was open. Well, it was locked. But I own the lock.", 'grin');
        yield* w.walk(wu, 640, 170);
        w.player.face = 1;
        yield* w.say('wuncler', "Robert! I came about the mortgage and I find a crime scene. Marvelous! What got them?", 'grin');
        yield* w.say('huey', "Dinner.", 'deadpan');
        A().sfx('step');
        yield* w.say('wuncler', "Mmh. Good Lord. My left arm has gone to sleep and my heart is doing something it has never done. I LOVE it.", 'shock');
        const c = yield* w.choice('huey', 'MR. WUNCLER IS STILL CHEWING', ['That plate is a public health crisis.', 'Sit down before you fall down.', 'Whatever you are thinking, do not give him money.']);
        if (c === 0) yield* w.say('wuncler', "A crisis! Young man, every fortune in my family began as somebody else's crisis.", 'grin');
        else if (c === 1) yield* w.say('wuncler', "Nonsense. Wunclers don't faint. We have people who faint for us.", 'smirk');
        else yield* w.say('wuncler', "Son, I've been giving your grandfather money for years. It's called a mortgage. It only flows one way.", 'smirk');
        yield* w.say('wuncler', "I closed a health food store on the corner last week. The Gentle Sprout. Nobody in this town wants to live longer. They want to be TOLD they could.", 'grin');
        yield* w.say('wuncler', "Put THIS in that building, Robert. My money, your recipes. I take ninety percent, you take the credit.", 'grin');
        rise(gd, 'cheer', 'shock'); jz.rig.expr = 'shock';
        yield* w.say('granddad', "Did somebody say MY NAME on a BUILDING?", 'shock');
        yield* w.say('huey', "He said ninety percent.", 'scowl');
        yield* w.say('granddad', "Of WHAT? Ninety percent of nothin' is nothin', and my name in lights is priceless. Hush, boy, grown folks is gettin' rich.", 'grin');
        yield* w.say('wuncler', "Sign here, here and here. Don't read that part. Nobody reads that part. It's considered rude.", 'smirk');
        yield* w.narr('A billionaire watched three people pass out in their plates and saw a business model. I should have asked why he wanted it on that exact corner.');
        yield* w.fadeOut(0.4);
        w.cine(false);
      },

      /* 2 ---- opening day, the kitchen: Granddad dictates the signature dish like a ransom note */
      function* (w) {
        clear(w); w.setBg('diner', {}); w.music('garden', 0.45); w.place(860, 1); w.zoom = 1.35; w.noFight = true;
        const gd = w.npc('granddad', 990, { face: -1, pose: 'handsHips' }), ru = w.npc('ruckus', 250, { face: 1 }), ri = w.npc('riley', 1150, { face: -1, pose: 'lean' });
        yield* w.fadeIn(0.3);
        w.cine(true); w.look(930, 1.5);
        yield* w.narr('Three weeks later. "The Itis. Robert Freeman, Proprietor." His name was on the sign. Ed Wuncler\'s was on the deed.');
        yield* w.narr('Where The Gentle Sprout used to sell wheatgrass, there were now four deep fryers and a defibrillator. The defibrillator was decorative.');
        yield* w.say('granddad', "Opening day. Huey, you on the grill. Today you learn the signature dish. I call it The Eulogy.", 'grin');
        yield* w.say('huey', "Why.", 'deadpan');
        yield* w.say('granddad', "'Cause it says somethin' beautiful and then everybody lays down.", 'grin');
        w.cine(false); w.look(930, 1.5);
        w.toast('PRESS THE BUTTON SHOWN. DO NOT BURN THE EULOGY.', 5);
        const STEPS = [
          { say: "Step one. A full pound of beef. You don't flip it, you turn it over slow. Like evidence.", keys: ['light', 'heavy'] },
          { say: "Step two. Batter that burger and FRY it. Fry it like it owes you money and it just pulled up in a new car.", keys: ['heavy', 'light'], huey: "It was already cooked.", back: "And now it's cooked with CONFIDENCE." },
          { say: "Step three. Ain't no bun. Bread is a vegetable. The bun is two slabs of macaroni and cheese, deep fried till they quit fightin'.", keys: ['guard', 'heavy'] },
          { say: "Step four. Bacon. Wrap it till you can't see the problem no more. That's how I got through two marriages.", keys: ['light', 'light', 'jump'], huey: "This sandwich has no structural reason to exist.", back: "Neither do you, and I STILL feed you." },
          { say: "Step five. Gravy on top. Stick of butter on the side. The butter is the SALAD, Huey. It's the lightest thing on the plate.", keys: ['heavy', 'guard', 'light'] },
        ];
        const GOOD = ["Hear that sizzle? That's RENT.", "THAT'S it! Grease don't lie!", "Now you cookin' like a Freeman!", "Look at that. That's a closed casket right there.",
          "Smell that? That's a second mortgage, PAID.", "Don't drain it! The grease is the personality!", "My arteries just stood up and clapped.", "That's the one. That's the plate that ends careers."];
        const BAD = ["{N}, you fry like a vegan!", "Too slow! I seen funerals move faster, and I CATERED 'em!", "You burnin' my LEGACY!", "My dead mama fry better, and she BEEN dead!", "That's it. Go get the belt. The kitchen belt."];
        let hits = 0, n = 0;
        for (const s of STEPS) {
          yield* w.say('granddad', s.say, 'scowl');
          w.lock = true;
          hits += yield* w.qte(s.keys, { window: 1.0, gap: 0.3,
            onHit() { FX.spark(w.player.x + 50, -90, 6, '#ffd27a', 180); w.bubble(gd, GOOD[n++ % GOOD.length]); },
            onMiss() { FX.dust(w.player.x + 50, -90, 6, '#3a3430'); w.bubble(gd, BAD[n++ % BAD.length]); } });
          if (s.huey) { yield* w.say('huey', s.huey, 'deadpan'); yield* w.say('granddad', s.back, 'angry'); }
        }
        w.lock = false;
        if (hits < 7) { yield* w.fail('You burned The Eulogy. Granddad delivered one for you.'); return; }
        w.cine(true); w.look(900, 1.45);
        FX.flash(0.5, '#ffd27a'); A().sfx('unlock');
        yield* w.say('granddad', "There she is. Nine thousand calories, and every one of 'em got my name on it. I ain't been this proud since... I ain't never been this proud.", 'grin');
        yield* w.say('riley', "Nineteen ninety-nine a plate. We payin' like forty cent for the cow. Granddad, this is basically traffickin'. I'm in.", 'grin');
        yield* w.say('huey', "It should come with a warning label.", 'scowl');
        yield* w.say('granddad', "It comes with a toothpick. Same thing.", 'deadpan');
        w.look(420, 1.4);
        yield* w.walk(ru, 420, 150);
        yield* w.say('ruckus', "Uncle Ruckus, no relation! Head of sanitation and customer adoration! Robert, there's a line of fine Woodcrest folks out there, pink and hungry as the Lord intended!", 'grin');
        yield* w.say('ruckus', "Imagine! Quality people, payin' good money to eat like they lost a war. Only Mr. Wuncler could dream it. I'd kiss his shoe, but I ain't cleared for the left one.", 'grin');
        yield* w.say('granddad', "Open the damn door, Ruckus.", 'scowl');
        A().sfx('bell'); A().sfx('crowd');
        yield* w.fadeOut(0.3);
        w.cine(false);
      },

      /* 3 ---- opening day, the floor: run plates against the clock; every customer drops mid-sentence */
      function* (w) {
        clear(w); w.setBg('diner', {}); w.music('garden', 0.85); w.place(820, 1); w.zoom = 1.25; w.noFight = true;
        const gd = w.npc('granddad', 985, { face: -1, pose: 'handsHips' }), ru = w.npc('ruckus', 215, { face: 1 }), ri = w.npc('riley', 1140, { face: -1, pose: 'lean' });
        const ORD = [
          { id: 'guest', v: 0, x: 520, dish: 'THE EULOGY', wait: "It's so VIBRANT in here! Is it safe?", call: "Table two! One Eulogy, hold the will to live!", last: "Oh my GOD. It's so AUTHENTIC. I finally underst..." },
          { id: 'tux', v: 0, x: 1340, dish: 'CHITLIN ALFREDO', wait: "My trainer can never know about this.", call: "Table five! Chitlin Alfredo! Don't breathe on it!", last: "I told my cardiologist I was at the gy..." },
          { id: 'guest', v: 1, x: 340, dish: 'PORK CHOP SORROW', wait: "I've never had 'soul' before. Does it stain?", call: "Table one! Sorrow, extra sorrow!", last: "Is this gluten free? Never mind, I don't ca..." },
          { id: 'tux', v: 1, x: 1560, dish: 'HAM HOCK SURPRISE', wait: "Is the chef, you know... AUTHENTIC?", call: "Table six! Tell him the surprise is it's two!", last: "We must bring the whole homeowners associa..." },
          { id: 'guest', v: 2, x: 680, dish: 'THE EULOGY', wait: "Do you validate parking? And feelings?", call: "Table three! Run, boy, it's settin' up like concrete!", last: "I'm posting this the second I can feel my ha..." },
        ];
        const cs = ORD.map((o) => w.npc(o.id, o.x, { variant: o.v, face: o.x < 900 ? 1 : -1, pose: 'handsHips' }));
        yield* w.fadeIn(0.3);
        w.chatter(ru, ["Right this way, sir! Mind the grease, it's load-bearin'!", "Don't thank the cook, ma'am. It only encourages him.", "I ain't worthy to mop up after y'all. But I'm GONNA."], 420);
        w.chatter(ri, ["Cash only. And I don't do change.", "Young Reezy, C.F.O. Chief Finessin' Officer.", "Sleepin' folks don't count they change. Beautiful."], 420);
        w.toast('E: GRAB A PLATE AT THE COUNTER, THEN E: SERVE THE TABLE', 6);
        let left = 45, done = false;
        const clock = w.also((function* () { for (;;) { if (!w.dlg) left -= w.dt; w.clock = Math.max(0, left); yield; } })());
        const job = w.also((function* () {
          for (let i = 0; i < ORD.length; i++) {
            const o = ORD[i], c = cs[i];
            w.bubble(c, o.wait);
            yield* w.interact(900, 'PICK UP: ' + o.dish, 'GRAB');
            w.bubble(gd, o.call);
            yield* w.interact(c, 'SERVE ' + o.dish + ' (' + (i + 1) + ' OF ' + ORD.length + ')', 'SERVE');
            c.rig.expr = 'grin'; w.bubble(c, o.last, 1.6);
            w.also((function* () { yield 1.6; nap(c); w.bubble(c, 'zzz...', 1.6); })());   // down before the fork lands
          }
          done = true;
        })());
        yield () => done || left <= 0;
        job.stop(); clock.stop(); w.clock = null; w.mark = null; w.objective(null);
        if (!done) { yield* w.fail('The plates went cold. Granddad does not serve cold. Granddad serves whoopings.'); return; }
        for (const c of cs) nap(c, true);
        w.cine(true); w.look(900, 1.2);
        yield* w.narr('By two o\'clock every customer in the building was unconscious. Granddad called it a full house. I called it a mass casualty event with table service.');
        yield* w.walk(ru, 600, 160);
        yield* w.say('ruckus', "Look at 'em, Robert. Sleepin' like angels. Rich, well-moisturized angels. I ain't seen this many white folks lay down at once since the yoga studio flooded.", 'grin');
        yield* w.say('riley', "We made eleven hundred dollars before LUNCH! Off sleepin' people! I charged Table Four for a jet ski and he signed it with his FACE!", 'grin');
        gd.rig.setPose('cheer', 12);
        yield* w.say('granddad', "Forty years I cooked for ungrateful children. Today strangers PAID me to knock 'em out. THIS is what we marched for.", 'grin');
        yield* w.say('huey', "It is absolutely not.", 'deadpan');
        yield* w.say('granddad', "You wasn't there! ...I wasn't neither. But I seen the pictures, and everybody in 'em looked hungry.", 'scowl');
        rise(cs[0], 'stagger', 'shock'); w.look(620, 1.4);
        yield* w.say('guest', "...Where am I. What year is it. Why can I hear my blood. ...Is there more?", 'shock', CUST);
        rise(cs[4], 'stagger', 'shock'); w.bubble(cs[4], 'More.');
        yield* w.wait(0.6);
        rise(cs[2], 'stagger', 'shock'); w.bubble(cs[2], 'MORE.');
        yield* w.wait(0.6);
        yield* w.say('tux', "MORE. And put it on the card. Any card. Take the wallet.", 'angry', CUST);
        yield* w.narr('They ate, fell asleep where they sat, and woke up wanting more. In any other industry that\'s called a dependency. In food service it\'s called a regular.');
        yield* w.fadeOut(0.4);
        w.cine(false);
      },

      /* 4 ---- Huey's campaign for one salad: three pitches, three rejections, one atrocity */
      function* (w) {
        clear(w); w.setBg('diner', {}); w.music('house', 0.3); w.place(640, 1); w.zoom = 1.3; w.noFight = true;
        const gd = w.npc('granddad', 985, { face: -1, pose: 'armsCrossed' }), ru = w.npc('ruckus', 330, { face: 1 }), ri = w.npc('riley', 1160, { face: -1, pose: 'lean' });
        const z1 = w.npc('guest', 480, { variant: 1, pose: 'down', expr: 'closed' }), z2 = w.npc('tux', 1420, { pose: 'down', expr: 'closed' });
        yield* w.fadeIn(0.3);
        w.cine(true); w.look(700, 1.35);
        yield* w.narr('A month in, The Itis had a two-hour wait and a nap list. I had read the county health numbers. So I made one bowl of salad and went looking for a vote.');
        w.cine(false);
        w.chatter(z1, ["zzz... cancel my... pilates...", "zzz... is brunch... still a thing..."], 300);
        w.chatter(z2, ["zzz... sell the boat... buy gravy...", "zzz... tell my wife... I'm at table six..."], 300);
        w.toast('GET ONE SALAD ON THE MENU. ASK MANAGEMENT.', 5);
        yield* w.talk(ri, 'PITCH THE SALAD TO RILEY', (function* () {
          yield* w.say('riley', "What is THAT. Why it's green. Why it's WET.", 'shock');
          yield* w.say('huey', "It's a salad, {n}. I want it on the menu.", 'deadpan');
          const c = yield* w.choice('huey', 'PITCH THE SALAD TO RILEY', ['One healthy item, for customers who want to live.', 'Dead customers cannot tip.', 'I will give you five dollars.']);
          if (c === 0) yield* w.say('riley', "Live for WHAT? {N}, they came here to give UP. That's the whole brand. 'The Itis: Stop Tryin'.'", 'smirk');
          else if (c === 1) yield* w.say('riley', "They ain't dead, they ASLEEP, and sleep is when I do my best billin'. Table Four bought a second jet ski last night.", 'grin');
          else yield* w.say('riley', "Five dollars? I make five dollars every time somebody pass out on they wallet. Young Reezy a mogul. Get that broke-ass lettuce out my face.", 'smirk');
          yield* w.say('riley', "Salad is what food EATS, Huey. Take that rabbit shit to Granddad and watch him take his belt off.", 'scowl');
        })());
        yield* w.talk(ru, 'PITCH THE SALAD TO UNCLE RUCKUS', (function* () {
          yield* w.say('ruckus', "HALT! What you smugglin' through my dinin' room, boy? Is that a VEGETABLE?", 'shock');
          const c = yield* w.choice('huey', 'PITCH THE SALAD TO UNCLE RUCKUS', ['It is one bowl of lettuce.', 'The customers are getting sick.', 'You eat here every day. How do you feel?']);
          if (c === 0) yield* w.say('ruckus', "Lettuce! In a soul food establishment! That's how it starts. First a leaf, then an opinion, and next thing you know somebody's READIN'.", 'angry');
          else if (c === 1) yield* w.say('ruckus', "Sick? Them fine folks is RESTIN'. Mr. Wuncler says a sleepy customer is a loyal customer, and that man ain't never been wrong about nothin' he owns.", 'grin');
          else yield* w.say('ruckus', "Magnificent! Doctor says I got Spontaneous Gravy Retention. One case in recorded history and it's me. Uncle Ruckus, no relation.", 'grin');
          yield* w.say('huey', "That's not a real condition.", 'deadpan');
          yield* w.say('ruckus', "Neither is 'eatin' right'! Now get. Table Six done slid under the booth again and I gotta fish him out with the mop.", 'scowl');
        })());
        yield* w.talk(gd, 'PITCH THE SALAD TO GRANDDAD', (function* () {
          yield* w.say('granddad', "Whatever that is, it ain't fried. So it ain't finished.", 'scowl');
          const c = yield* w.choice('huey', 'PITCH THE SALAD TO GRANDDAD', ['One salad on the menu. That is all I am asking.', 'This food is hurting the neighborhood.', 'What would the movement say?']);
          if (c === 0) yield* w.say('granddad', "A SALAD. In MY restaurant. Under MY name. Boy, I will whoop you with that head of lettuce till it's coleslaw, then make you eat the evidence.", 'angry');
          else if (c === 1) yield* w.say('granddad', "Hurtin'? Them people got full bellies and a place to lay down. I'm basically a shelter. With a register.", 'scowl');
          else yield* w.say('granddad', "Don't you bring the movement in here! I marched so we could sit at ANY counter and order ANY pork chop! ...I was near the march. I could hear it.", 'angry');
          yield* w.say('granddad', "Your people survived four hundred years on this food. And you wanna hand my customers a LEAF? You a traitor to your own plate, boy.", 'angry');
          yield* w.say('huey', "They survived on it because scraps were all they were given. That was genius. This is you selling a coma for nineteen ninety-nine.", 'scowl');
          yield* w.say('granddad', "And it's a GOOD coma! People drive in from two counties for that coma!", 'shout');
          yield* w.say('riley', "He soundin' like the health inspector, Granddad. And we already paid that {n}.", 'smirk');
          gd.rig.setPose('point', 12);
          yield* w.say('granddad', "FINE. You want your salad on my menu? Give it here.", 'scowl');
          A().sfx('glass', { vol: 0.5 }); FX.spark(gd.x + 30, -100, 12, '#ffd27a', 220); FX.flash(0.4, '#ffd27a');
          yield* w.wait(0.7);
          yield* w.say('granddad', "There. Battered, fried, drowned in ranch gravy. 'Salad Fritters.' Six ninety-nine. You're welcome.", 'grin');
          yield* w.say('huey', "You deep-fried lettuce.", 'deadpan');
          yield* w.say('granddad', "I FIXED lettuce.", 'grin');
          w.bubble(ri, "Ay... that salad kinda smack now.");
          yield* w.narr('That was the only vegetable The Itis ever served. It sold out in an hour. Nobody could prove it had ever been a plant.');
        })());
        yield* w.fadeOut(0.4);
      },

      /* 5 ---- six weeks later: walk the block with a folder and collect what the restaurant did to it */
      function* (w) {
        clear(w); w.setBg('block', {}); w.music('stealth', 0.25); w.zoom = 1.3; w.noFight = true;
        const k = w.bg.width / 4200, X = (x) => Math.round(x * k);   // the stand-in backdrop is narrower than the block
        w.place(X(700), 1);
        const lawn = w.npc('guest', X(1060), { pose: 'down', expr: 'closed' });
        const tom = w.npc('tom', X(1500), { face: -1, pose: 'lean', expr: 'closed' });
        const bus = w.npc('tux', X(2320), { variant: 1, pose: 'down', expr: 'closed' });
        const jz = w.npc('jazmine', X(2700), { face: -1, expr: 'worry' });
        const curb = w.npc('guest', X(3060), { variant: 2, pose: 'down', expr: 'closed' });
        yield* w.fadeIn(0.4);
        w.cine(true); w.look(X(820), 1.3);
        yield* w.narr('Six weeks later. I took the long way to work to see what a nineteen-dollar plate does to a neighborhood. I brought a folder.');
        yield* w.narr('The joggers were gone. The dog walkers were gone. The dogs were walking themselves, and they looked worried.');
        w.cine(false);
        w.chatter(lawn, ["zzz... not my lawn... don't care...", "zzz... gravy... on the gravy..."], 320);
        w.chatter(bus, ["zzz... bus'll come... to me...", "zzz... I used to... run marathons..."], 320);
        w.chatter(curb, ["zzz... five more minutes... or weeks...", "zzz... is it still... Tuesday..."], 320);
        w.chatter(tom, ["zzz... objection... to stairs...", "zzz... the defense... naps..."], 320);
        yield* w.collect([
          { x: X(960), name: 'EVIDENCE: 211 GREASY WRAPPERS', col: '#e8a05a', on() { w.bubble(lawn, "zzz... that one's mine... they ALL mine..."); } },
          { x: X(1300), name: 'EVIDENCE: JOGGING CLUB DISBANDED', col: '#9fd0ff', on() { w.bubble(w.player, "'Meetings cancelled until further notice. Or forever.'"); } },
        ], 'COLLECT EVIDENCE OF THE DAMAGE');
        yield* w.talk(tom, 'WAKE MR. DUBOIS', (function* () {
          yield* w.say('huey', "Mr. DuBois. You're asleep on your own mailbox.", 'deadpan');
          rise(tom, 'cower', 'shock'); A().sfx('alert', { vol: 0.5 });
          yield* w.say('tom', "I'm AWAKE! No further questions, your honor! ...Huey. What day is it?", 'shock');
          yield* w.say('huey', "Thursday.", 'deadpan');
          yield* w.say('tom', "Oh no. I fell asleep in court on Tuesday. During my OWN closing argument. The defendant put his jacket over me. He was so gentle. He got twelve years.", 'worry');
          yield* w.say('tom', "I've gained thirty pounds! My wife says I sweat gravy! If I get any slower I can't run from the police, and running is my ENTIRE plan!", 'worry');
          yield* w.say('huey', "Then stop eating there.", 'deadpan');
          yield* w.say('tom', "I TRIED! I drove past it twice last night and woke up in a booth wearing a bib! Somebody tucked me in, Huey. WHO TUCKED ME IN?!", 'shock');
          rise(tom, 'lean', 'closed'); w.bubble(tom, 'zzz... sorry, mailbox...');
        })());
        yield* w.collect([
          { x: X(1900), name: 'EVIDENCE: MAN MUGGED FOR A BISCUIT', col: '#e87a7a', on() { w.bubble(w.player, "Robbed at fork-point. They left the wallet."); } },
          { x: X(2240), name: 'EVIDENCE: BUS ROUTE CANCELLED', col: '#ffe36e', on() { w.bubble(bus, "zzz... driver's asleep... in the next seat..."); } },
        ], 'COLLECT EVIDENCE OF THE DAMAGE');
        yield* w.talk(jz, 'ASK JAZMINE ABOUT THE PARK', (function* () {
          yield* w.say('jazmine', "Huey, nobody comes to the park anymore. I've been on the seesaw by myself for three weeks. It doesn't work with one person. I just sit at the bottom.", 'worry');
          yield* w.say('huey', "They're all at the restaurant. Or asleep near it.", 'deadpan');
          yield* w.say('jazmine', "A man was sleeping in the sandbox! I thought he was a pirate guarding treasure, so I gave him my juice box. He ate the straw.", 'worry');
          yield* w.say('jazmine', "And the ice cream man QUIT! He said he can't compete with a place that fries the ice cream AND the cone AND the little wooden spoon!", 'shock');
          yield* w.say('huey', "Jazmine. Who's been putting up all these signs?", 'scowl');
          yield* w.say('jazmine', "A nice man in a suit! He gave me a balloon. It says WUNCLER HOLDINGS. I named it Gerald.", 'grin');
          yield* w.say('huey', "...Hold on to Gerald. He's evidence.", 'deadpan');
        })());
        yield* w.collect([
          { x: X(2980), name: 'EVIDENCE: FORECLOSURE NOTICE', col: '#ffffff', on() { w.bubble(curb, "zzz... took the house... I kept the coupon..."); } },
        ], 'COLLECT EVIDENCE OF THE DAMAGE');
        yield* w.goTo(X(3240), 'READ THE SIGNS BY THE WUNCLER GATE', { r: 100 });
        w.cine(true); w.look(X(3200), 1.3);
        yield* w.narr('Fourteen houses around the restaurant had gone up for sale in six weeks. Every sign wore the same sticker. SOLD: WUNCLER HOLDINGS.');
        yield* w.narr('Property values were down forty percent. When something falls that fast, ask who is standing underneath it with a bag.');
        const ri = w.npc('riley', X(3240) - 520, { face: 1 });
        w.player.face = -1;
        yield* w.walk(ri, X(3240) - 110, 400, 'run');
        yield* w.say('riley', "HUEY! Get yo ass back to the restaurant! We OUT! Outta pork, outta butter, Granddad out there tryna fry the napkins!", 'shock');
        yield* w.say('huey', "How long have they been without food?", 'scowl');
        yield* w.say('riley', "Like nine minutes! Somebody bit the menu! It's a grown man cryin' in the fryer, {n}. IN it!", 'shock');
        yield* w.narr('I had the evidence. It would have to wait. You can\'t expose a conspiracy while your grandfather is being eaten.');
        yield* w.fadeOut(0.4);
        w.cine(false);
      },

      /* 6 ---- the kitchen runs dry: a food riot, and the one regular who never left */
      function* (w) {
        clear(w); w.setBg('diner', {}); w.music('finale', 0.55); w.place(780, -1); w.zoom = 1.25; w.noFight = false;
        const gd = w.npc('granddad', 960, { face: -1, pose: 'cower', z: -1 }), ru = w.npc('ruckus', 1100, { face: -1, z: -1 });
        if (!w.def.riotSeen) {
          w.def.riotSeen = true;
          const m1 = w.npc('guest', 540, { face: 1, pose: 'point', expr: 'angry' }), m2 = w.npc('tux', 420, { face: 1, pose: 'handsHips', expr: 'angry' });
          yield* w.fadeIn(0.3);
          w.cine(true); w.look(760, 1.3);
          A().sfx('crowd');
          yield* w.say('granddad', "Folks! FOLKS. The kitchen is experiencin' a temporary... absence of everything.", 'worry');
          yield* w.say('guest', "I drove here in my SLEEP for this! I don't even remember owning a car!", 'angry', CUST);
          yield* w.say('tux', "I have not eaten in ELEVEN MINUTES. Do you know who I am? Because I don't anymore!", 'shout', CUST);
          yield* w.say('ruckus', "Don't you sass these people, Robert! They PAYIN' customers! They wanna tear the place down, you hand 'em a crowbar and say thank you!", 'angry');
          yield* w.say('granddad', "Huey! You know all that kung fu. Go on out there and... customer-service these people.", 'worry');
          yield* w.say('huey', "You did this.", 'scowl');
          yield* w.say('granddad', "And YOU gonna un-do it! That's what family IS!", 'shout');
          m1.gone = m2.gone = true;
          w.cine(false);
        } else yield* w.fadeIn(0.3);
        const H = (id, x, o) => Object.assign({ id, x, hp: 26, ai: hungry, speed: 95, expr: 'angry', data: { atks: [GREASY, BELLY], range: 120 } }, o);
        w.toast('THEY ARE SLOW AND OUT OF BREATH. HIT THEM WHILE THEY WHEEZE.', 6);
        yield* w.wave([H('guest', L.near(w, 420)), H('tux', L.near(w, -400)), H('guest', L.near(w, 640), { variant: 1 })]);
        w.bubble(gd, "Not the stomach, boy! That's INVENTORY!");
        yield* w.wave([
          H('guest', L.near(w, -460), { variant: 2, hp: 32, prop: 'mallet', data: { atks: [L.MALLET], range: 150 } }),
          H('tux', L.near(w, 660), { variant: 1, hp: 20, prop: 'bottle', ai: L.shooter }),
          H('guest', L.near(w, 480)), H('tux', L.near(w, -640)),
        ]);
        w.bubble(ru, "Lord have mercy. Table Nine done WOKE UP.");
        A().sfx('thud'); BD.cam.shake(0.6);
        yield 0.8;
        w.bubble(gd, "That's Wuncler's security man! He ain't guarded nothin' but the fryer!");
        const b = w.foe('guard', L.near(w, 580), { hp: 150, boss: true, ai: regularAI, name: 'Table Nine', title: 'HAS NOT LEFT SINCE OPENING DAY', speed: 105, idle: 'stance', brk: 40, expr: 'angry' });
        w.foe('guest', L.near(w, -540), H('guest', 0, { variant: 1 }));
        w.foe('tux', L.near(w, 800), H('tux', 0, { hp: 20, prop: 'bottle', ai: L.shooter }));
        yield* w.duel(b, { banner: 'TABLE NINE WANTS SECONDS!', ko: 'CHECK, PLEASE.' });
        w.cine(true); w.look((w.player.x + gd.x) / 2, 1.35);
        yield* w.say('guard', "...is there... dessert...", 'pain', { name: 'Table Nine' });
        rise(gd, 'handsHips', 'grin');
        yield* w.say('granddad', "See? He's fine! They ALL fine! This is a family establishment!", 'grin');
        yield* w.say('ruckus', "You laid hands on PAYIN' customers! I'm writin' Mr. Wuncler an apology in my good crayon, and I'm signin' YOUR name to it. No relation.", 'angry');
        yield* w.say('huey', "Good. I'll deliver it. I'm going to see him anyway.", 'scowl');
        yield* w.say('granddad', "Tell him we need more lard! And a second fryer! And an ambulance, but a QUIET one!", 'shout');
        yield* w.fadeOut(0.4);
        w.cine(false);
      },

      /* 7 ---- the Wuncler gate: the whole scheme, explained with total cheer */
      function* (w) {
        clear(w); w.setBg('block', {}); w.music('stealth', 0.4); w.zoom = 1.3; w.noFight = true;
        const k = w.bg.width / 4200, X = (x) => Math.round(x * k);
        w.place(X(2560), 1);
        const gu = w.npc('guard', X(3120), { face: -1, pose: 'armsCrossed' }), zz = w.npc('tux', X(2820), { pose: 'down', expr: 'closed' });
        yield* w.fadeIn(0.4);
        w.cine(true); w.look(X(2760), 1.3);
        yield* w.narr('I walked to the Wuncler estate with a folder of evidence, a balloon named Gerald, and an apology written in crayon.');
        w.cine(false);
        w.chatter(zz, ["zzz... sold the house... for a combo meal...", "zzz... best deal... I ever signed..."], 320);
        let wu = null;
        yield* w.talk(gu, 'GET PAST WUNCLER SECURITY', (function* () {
          yield* w.say('guard', "Estate's closed, kid. Mr. Wuncler's busy buying your street.", 'deadpan');
          const c = yield* w.choice('huey', 'GET PAST THE GATE', ['I have evidence of a conspiracy.', 'I work at the restaurant he owns.', 'Your boss is about to get sued.']);
          if (c === 0) yield* w.say('guard', "Kid, I work for a billionaire. 'Conspiracy' is just what we call the calendar.", 'deadpan');
          else if (c === 1) yield* w.say('guard', "The Itis? My partner went in to guard that place in March. He's still at Table Nine. We send a card.", 'deadpan');
          else yield* w.say('guard', "Sued? He's got lawyers who sue the people suing him. It goes around in a circle. Like a fountain.", 'deadpan');
          wu = w.npc('wuncler', X(3440), { face: -1 });
          yield* w.say('wuncler', "Is that the Freeman boy? The angry one? Let him in, let him in! I LOVE the angry one!", 'grin');
          yield* w.walk(wu, X(3290), 150);
          gu.face = 1; w.bubble(gu, "Your funeral, kid. Catered, probably.");
        })());
        yield* w.talk(wu, 'CONFRONT ED WUNCLER', (function* () {
          yield* w.say('wuncler', "Young man! You look like you've come to accuse me of something. Wonderful. I've had such a dull morning.", 'grin');
          yield* w.say('huey', "First, this is from Uncle Ruckus.", 'deadpan');
          yield* w.say('wuncler', "Crayon! 'Dear Mister Wuncler, Your Majesty, sorry about the boy.' I'll frame it. Next to his paycheck, which is also in crayon.", 'grin');
          w.player.pose('point', 12, 'scowl');
          yield* w.say('huey', "Fourteen houses around the restaurant. Sold in six weeks. All to you.", 'scowl');
          yield* w.say('wuncler', "Seventeen! You missed the three behind the park. And the park.", 'grin');
          yield* w.say('huey', "You closed a health food store, put a grease pit in its place, and waited for the neighborhood to fall apart.", 'scowl');
          yield* w.say('wuncler', "I didn't WAIT, son. Waiting is for people with one house. I invested. Your grandfather did the falling apart. I simply held the bucket.", 'smirk');
          yield* w.say('wuncler', "Oldest play in real estate. You can't buy a nice neighborhood cheap. So first you make it not nice. A liquor store. A check casher. A restaurant with a nap policy.", 'grin');
          yield* w.say('wuncler', "Values drop, worried people sell, I buy. Then I bulldoze it, add a juice bar and call it 'revitalized'. People clap! They actually clap.", 'grin');
          const c = yield* w.choice('huey', 'TELL HIM WHAT HE IS', ['That is predatory.', 'People got sick. People lost their homes.', 'Why not open one next to YOUR house?']);
          if (c === 0) yield* w.say('wuncler', "Thank you! My father called me that on his deathbed. He was SO proud.", 'grin');
          else if (c === 1) yield* w.say('wuncler', "They lost them at a very fair price. I know. I set it.", 'smirk');
          else yield* w.say('wuncler', "Oh, you can't put one of THOSE near my house. There are zoning laws. I wrote them. On this very lawn.", 'smirk');
          w.player.pose('stand', 10, 'scowl');
          yield* w.say('huey', "And the restaurant?", 'scowl');
          yield* w.say('wuncler', "Closed! As of... now. Forty-one lawsuits arrived this morning. One fellow is suing from a coma. Admirable hustle.", 'grin');
          yield* w.say('wuncler', "Fortunately, all the liability is in your grandfather's name. It was in the part nobody reads. I did warn him it was rude.", 'smirk');
          yield* w.say('huey', "You used him. You used the food. You used the fact that it's OURS.", 'angry');
          yield* w.say('wuncler', "I use everyone, young man. It's called an economy. No hard feelings! Tell Robert that pork chop was the finest thing I have ever eaten. I mean that.", 'grin');
          yield* w.narr('He did mean it. That was the worst part. He had a to-go plate on his desk.');
        })());
        yield* w.fadeOut(0.5);
      },
    ],

    *outro(w) {
      yield* w.fadeOut(0.4);
      clear(w); w.setBg('diner', {}); w.music('credits', 0.2); w.place(760, 1);
      const gd = w.npc('granddad', 900, { face: -1, pose: 'facepalm' }), ri = w.npc('riley', 1060, { face: -1, pose: 'lean' }), ru = w.npc('ruckus', 560, { face: 1, pose: 'armsCrossed' });
      w.look(800, 1.3);
      yield* w.fadeIn(0.5);
      yield* w.narr('The Itis closed on a Thursday. The health inspector, the bank and a process server all arrived at once and held the door for each other.');
      gd.rig.setPose('handsHips', 12);
      yield* w.say('granddad', "It was the LOCATION. I said from day one that corner had bad energy.", 'scowl');
      yield* w.say('huey', "You said it was the best corner in Woodcrest.", 'deadpan');
      yield* w.say('granddad', "And it was the CUSTOMERS! Greedy. No self-control. Who eats nine thousand calories and gets mad at the COOK?", 'angry');
      yield* w.say('riley', "Nah, it was Huey. {N} walked around here with a salad and jinxed the whole operation. You can't bring that negative-ass vegetable energy into a business.", 'scowl');
      w.player.face = -1;
      yield* w.say('ruckus', "It was ALL y'all! Mr. Wuncler handed you a golden opportunity and you fed people till they NOTICED! No relation to a single one of you.", 'angry');
      w.player.face = 1;
      yield* w.say('huey', "Nobody's going to say it was the food.", 'deadpan');
      gd.rig.setPose('point', 12);
      yield* w.say('granddad', "The food was PERFECT! Don't you EVER blame the food! That food is the only thing in this family that never let me down!", 'shout');
      yield* w.say('riley', "So we broke again?", 'worry');
      yield* w.say('granddad', "We was never NOT broke, {n}. We was just broke with a sign.", 'scowl');
      w.look(780, 1.5);
      yield* w.narr('Nobody ever opened a place like that next door to Ed Wuncler. They never do.');
      yield* w.narr('Some neighborhoods get a farmers\' market. Others get a fried pound of beef, a liquor store, and a lecture about personal choices.');
      yield* w.narr('The food was never the crime. It carried our people through the worst this country had.');
      yield* w.narr('The crime is deciding who gets sold the slow death, on which corner, and who buys the land afterward.');
      yield* w.narr('A juice bar opened there eight months later. Nine dollars a cup. Granddad says the pork chop was better. He\'s right. That\'s the problem.');
      gd.rig.setPose('armsCrossed', 12);
      yield* w.say('granddad', "...Huey. That salad fritter still in the fridge?", 'worry');
      yield* w.say('huey', "Yes.", 'deadpan');
      yield* w.say('granddad', "Bring it here. And don't you look at me while I eat it.", 'scowl');
      gd.gone = ri.gone = ru.gone = true;
    },
  });
})();
