/* garden.js: Episode 1, "The Garden Party". The dream riot (tutorial), Granddad's cheese doctrine, the walk to the
 * Wuncler gate, mingling, Riley and Ed III, and a speech nobody could be bothered to be offended by. */
(() => {
  'use strict';
  const BD = window.BD, U = BD.U, FX = BD.FX, L = BD.Lib;
  const A = () => BD.Audio;
  const AUTO = () => !!BD.AUTOPLAY;
  /** per-phase bookkeeping: side scripts to stop, and a clean stage for whatever comes next */
  const stage = (w) => {
    const cos = [];
    return {
      add(c) { cos.push(c); return c; },
      end() { for (const c of cos) c.stop(); for (const f of w.fighters) if (f !== w.player) f.gone = true; w.bubbles.length = 0; w.objective(null); w.look(null); },
    };
  };
  /** bubbles keyed to how far Huey has walked: [[x, npc, 'line'], ...] */
  const banter = (w, beats, gap) => w.also((function* () {
    for (const [x, f, s] of beats) { yield () => w.player.x >= x && !w.cineOn; w.bubble(f, s); yield gap || 1.7; }
  })());
  /** the headless run teleports Huey, so let the walking banter finish before moving on */
  function* drain(co) { if (AUTO()) yield () => co.done; }
  /** rioters shout while they swing */
  const heckle = (w, lines) => w.also((function* () {
    for (let i = 0; ; i++) {
      if (i) yield U.rand(2.4, 3.8);
      const fs = w.fighters.filter((f) => f.team === 'foe' && !f.dead);
      if (fs.length) w.bubble(U.pick(fs), lines[i % lines.length]);
      else yield 0.3;
    }
  })());

  BD.episode({
    id: 'garden', title: 'THE GARDEN PARTY', src: 'inspired by Season 1, Episode 1', bg: 'garden',
    blurb: 'Granddad finally got invited onto a rich man\'s lawn. Huey has a microphone, the facts, and a recurring dream about how this ends.',
    loss: 'Guest: "Oh, he fainted so ARTICULATELY. Somebody take a picture for the newsletter."',
    *intro(w) {
      w.setBg('garden', { heat: 0 }); w.music('garden', 0); w.place(430, 1);
      const g1 = w.npc('guest', 660, { face: -1 }), g2 = w.npc('tux', 780, { face: -1 }), g3 = w.npc('guest', 900, { face: -1, variant: 1 }), g4 = w.npc('tux', 1020, { face: -1, variant: 1 });
      w.player.rig.prop = 'mic';
      w.look(640, 1.25);
      yield* w.narr('Rich people throw parties on their lawns so everybody can see how much lawn they have.');
      yield* w.narr('This lawn belonged to Ed Wuncler. He owns the bank, the mall, and most of the sky over Woodcrest. I had his microphone.');
      w.player.pose('point', 12, 'deadpan');
      yield* w.say('huey', 'Excuse me. Everyone. Put the shrimp down. I have an announcement.', 'deadpan');
      yield* w.say('guest', 'Oh, how PRECIOUS. The little one is going to do a poem!', 'grin');
      yield* w.say('huey', 'The founding fathers were tax cheats in wigs. Your retirement fund builds landmines. And nobody at this party has ever seasoned a chicken.', 'scowl');
      g1.rig.expr = g2.rig.expr = g3.rig.expr = g4.rig.expr = 'shock'; A().sfx('crowd');
      yield* w.wait(0.6);
      yield* w.say('tux', 'He said it OUT LOUD. In front of the caterers!', 'shock');
      yield* w.say('guest', 'My portfolio! He looked DIRECTLY at my portfolio!', 'shock');
      g2.rig.setPose('point', 14); g4.rig.setPose('point', 14);
      yield* w.say('tux', 'Somebody DO something! Throw a canape! THROW ALL THE CANAPES!', 'angry');
      yield* w.narr('They say the truth will set you free. Mostly it gets you jumped by forty people in boat shoes.');
      yield* w.fadeOut(0.3);
      w.player.rig.prop = null;
      g1.gone = g2.gone = g3.gone = g4.gone = true;
    },
    phases: [function* (w) {                       /* 1. the dream: a riot on the lawn (tutorial), then the slap */
      const S = stage(w);
      w.setBg('garden', { heat: 0.3 }); w.music('garden', 0.9); w.place(430, 1); w.zoom = 1.3; w.noFight = false;
      const H = { hp: 24, ai: L.grunt, data: { atks: [L.PUNCH] } };
      const club = { hp: 30, prop: 'mallet', ai: L.grunt, data: { atks: [L.MALLET], range: 150 } };
      yield* w.fadeIn(0.3);
      w.toast('A/D MOVE   J STRIKE   K KICK   SPACE JUMP', 7);
      let h = S.add(heckle(w, ['HE MENTIONED THE LANDMINES!', 'NOT THE FACE! I CHAIR A CHARITY!', 'I PAY TAXES! SOME! ONCE!']));
      yield* w.wave([Object.assign({ id: 'guest', x: L.near(w, 460) }, H), Object.assign({ id: 'guest', x: L.near(w, -380), variant: 1 }, H)]);
      h.stop();
      w.st.heat = 0.65; w.relight();
      w.toast('L GUARD. TAP IT JUST BEFORE A HIT TO PARRY.', 7);
      h = S.add(heckle(w, ['THIS MALLET IS AN HEIRLOOM!', 'HOLD MY SPRITZER, GREGORY!', 'I KNOW A JUDGE! I KNOW ALL THE JUDGES!', 'HE HAS OPINIONS! GET HIM!']));
      yield* w.wave([
        Object.assign({ id: 'guest', x: L.near(w, 520), variant: 2 }, club),
        { id: 'tux', x: L.near(w, 700), hp: 20, prop: 'bottle', ai: L.shooter },
        Object.assign({ id: 'guest', x: L.near(w, -420) }, H),
      ]);
      h.stop();
      w.st.heat = 1; w.relight();
      w.toast('SHIFT DASH.  A RED "!" CANNOT BE BLOCKED.', 7);
      const b = w.foe('guard', L.near(w, 560), { hp: 110, boss: true, ai: L.guardAI, title: 'WUNCLER ESTATE SECURITY', speed: 150, idle: 'stance', brk: 40 });
      w.foe('tux', L.near(w, -520), { variant: 1, hp: 20, prop: 'bottle', ai: L.shooter });
      w.foe('guest', L.near(w, 760), Object.assign({ variant: 1 }, club));
      w.bubble(b, 'Sir. That is a PRIVATE microphone.');
      S.add(w.also((function* () {
        const lines = ['I have a taser and a pension. Choose.', 'Stop resisting the catering!', 'You are making the swans nervous!'];
        for (let i = 0; ; i++) { yield U.rand(5, 7); if (!b.dead) w.bubble(b, lines[i % lines.length]); }
      })()));
      yield* w.duel(b, { banner: 'SECURITY!', ko: 'ESCORTED OUT.' });
      // ...and then a hand out of nowhere
      yield* w.fadeOut(0.5);
      S.end(); w.cine(true);
      A().sfx('slap'); FX.flash(0.8);
      w.setBg('house', {}); w.music('house', 0); w.place(600, 1);
      w.player.rig.snap('down'); w.player.rig.expr = 'pain';
      w.npc('granddad', 700, { face: -1, pose: 'handsHips' }); w.npc('riley', 470, { face: 1, pose: 'lean' });
      w.look(590, 1.5);
      yield* w.fadeIn(0.5);
      yield* w.say('granddad', 'BOY! Wake your ass up! You drooling on my good couch and hollering about landmines!', 'shout');
      w.player.pose('stand', 6, 'deadpan');
      yield* w.say('huey', 'I was at the garden party. I told them the truth. They rioted.', 'deadpan');
      yield* w.say('granddad', 'What did I tell you about starting riots in your sleep? Rich folks can SMELL a bad attitude. Even a unconscious one!', 'scowl');
      yield* w.say('riley', 'Was I in it? Did I have a chain on? Tell me I had a chain on.', 'grin');
      yield* w.say('huey', 'You hit a senator with a deviled egg.', 'deadpan');
      yield* w.say('riley', 'Hell yeah I did.', 'smirk');
      yield* w.narr('The party was real, and it was that afternoon. The riot, unfortunately, was only a dream.');
      yield* w.fadeOut(0.3);
      S.end(); w.cine(false);
    }, function* (w) {                             /* 2. home: the briefing, the cheese doctrine, the party kit */
      const S = stage(w);
      w.setBg('house', {}); w.music('house', 0.2); w.place(560, 1); w.zoom = 1.35; w.noFight = true;
      const gd = w.npc('granddad', 830, { face: -1, pose: 'handsHips' }), ri = w.npc('riley', 330, { face: 1, pose: 'lean' });
      yield* w.fadeIn(0.3);
      w.bubble(gd, 'Family meeting! Bring your behinds over here!');
      yield* w.talk(gd, 'REPORT TO GRANDDAD FOR THE BRIEFING', (function* () {
        yield* w.say('granddad', 'Ed Wuncler invited us to his garden party. Ed Wuncler OWNS this town. The bank, the mall, and I\'m pretty sure the damn weather.', 'scowl');
        yield* w.say('granddad', 'We the new Black family on the block. So today we ain\'t people. Today we a first impression. Here are the rules.', 'scowl');
        yield* w.say('granddad', 'Rule one. Rich white folks are like bears. No sudden moves, no eye contact, and you never, EVER ask where the honey came from.', 'deadpan');
        yield* w.say('riley', 'What\'s rule two?', 'smirk');
        gd.rig.setPose('pointUp', 12);
        yield* w.say('granddad', 'Rule two is cheese.', 'deadpan');
        yield* w.say('huey', '...Cheese.', 'deadpan');
        yield* w.say('granddad', 'Sixty years I been studying these people. Put a cube of cheese on a toothpick and a rich man will forgive you anything. Calms \'em right down. It\'s science.', 'grin');
        const a = yield* w.choice('huey', 'ASK GRANDDAD:', ['Is the science peer-reviewed?', 'What if they don\'t like cheese?', 'What do we do if we see an actual bear?']);
        if (a === 0) yield* w.say('granddad', 'It\'s reviewed by ME. I handed a man a wedge of brie in 1974 and he co-signed my car loan. Never met him before or since.', 'grin');
        else if (a === 1) yield* w.say('granddad', 'Then they ain\'t really rich, and you can talk to \'em any old kind of way.', 'deadpan');
        else { yield* w.say('granddad', 'The bear is a METAPHOR, boy. ...But if one shows up, trip your brother.', 'scowl'); yield* w.say('riley', 'Why it gotta be me?!', 'shock'); }
        gd.rig.setPose('point', 12);
        yield* w.say('granddad', 'Rule three. Huey. Look at me. You say NOTHING. No facts. No history. No pamphlets. Somebody asks your opinion, you ain\'t got one. You\'re ten.', 'scowl');
        const b = yield* w.choice('huey', 'PROMISE GRANDDAD:', ['I promise not to start a riot.', 'Define "nothing".', 'What if they ask me a direct question?']);
        if (b === 0) { yield* w.say('granddad', 'Why\'d you say it like there\'s a whole list of other stuff?', 'worry'); yield* w.say('huey', 'There\'s a whole list of other stuff.', 'deadpan'); }
        else if (b === 1) yield* w.say('granddad', '"Nothing" is the sound you gon\' make while I whoop your narrow ass in front of a string quartet.', 'angry');
        else yield* w.say('granddad', 'Then you say "I enjoy cheese" and you back away slow. Like the Queen walked in.', 'deadpan');
        yield* w.say('granddad', 'And Huey. Embarrass me in front of that man and I will whoop you so thorough your DREAMS gon\' come out limping.', 'angry');
        yield* w.say('riley', 'What about me, Granddad? What\'s my rule?', 'grin');
        gd.rig.setPose('handsHips', 12);
        yield* w.say('granddad', 'Don\'t steal nothing that won\'t fit in a pocket.', 'deadpan');
        yield* w.say('riley', 'See, that\'s a rule I can work with.', 'smirk');
        yield* w.narr('That was the whole plan. Sixty years of dealing with rich people, and my grandfather had boiled it down to dairy.');
        yield* w.say('granddad', 'Now go get my party kit. Pocket cheese, the good cologne, and my lucky tie. I ain\'t meeting a billionaire smelling like regular.', 'scowl');
      })());
      yield* w.collect([
        { x: 110, name: 'POCKET CHEESE', col: '#ffd23a', on() { w.bubble(ri, 'That cheese been in there since Chicago.'); } },
        { x: 640, name: 'THE LUCKY TIE', col: '#e8452e', on() { w.bubble(gd, 'That tie got me out of two tickets!'); } },
        { x: 1490, y: -210, name: 'LOAN COLOGNE', col: '#9fe8ff', on() { w.bubble(gd, 'Not the church one! The one for LOANS!'); } },
      ], 'PACK GRANDDAD\'S PARTY KIT (JUMP UP TO THE LANDING)');
      yield* w.talk(gd, 'BRING THE KIT TO GRANDDAD', (function* () {
        yield* w.say('granddad', 'Cheese, cologne, tie. That\'s a whole personality right there. Now everybody fix your face. We walking.', 'grin');
        yield* w.say('riley', 'WALKING? {N}, it\'s a mansion. You don\'t WALK to a mansion. You pull up.', 'shock');
        yield* w.say('granddad', 'It\'s two blocks and gas is high. Rich people walk everywhere. They call it "a stroll". Now stroll your ass out that door.', 'scowl');
      })());
      yield* w.fadeOut(0.3);
      S.end();
    },
    function* (w) {                                /* 3. the stroll: from the Freeman door to the Wuncler gate */
      const S = stage(w), NB = { name: 'Neighbor' };
      w.setBg('block'); w.music('house', 0.35); w.zoom = 1.3; w.noFight = true;
      // the block backdrop is 4200 wide; if it has not landed yet the fallback street is narrower, so scale the route to fit
      const wide = w.bg.width, bx = (x) => (wide >= 4000 ? x : Math.round(x * (wide - 120) / 4200));
      w.place(bx(780), 1);
      const gd = w.npc('granddad', bx(700), { face: 1, pose: 'handsHips' }), ri = w.npc('riley', bx(630), { face: 1, pose: 'lean' });
      const nb = w.npc('guest', bx(1580), { face: -1, variant: 2, expr: 'worry' }), ru = w.npc('ruckus', bx(2380), { face: -1 }), sec = w.npc('guard', bx(3280), { face: -1, pose: 'armsCrossed' });
      S.add(w.follow(gd, 120)); S.add(w.follow(ri, 230));
      yield* w.fadeIn(0.3);
      let talk = S.add(banter(w, [
        [bx(860), gd, 'Walk like you got equity.'],
        [bx(1000), ri, 'Why everybody jogging? Who chasing them?'],
        [bx(1140), gd, 'That\'s cardio. Rich folks run for no reason.'],
        [bx(1280), ri, 'This whole street smell like sunscreen and bullshit.'],
      ]));
      yield* w.goTo(bx(1460), 'STROLL TO THE WUNCLER ESTATE');
      yield* drain(talk);
      w.cine(true); w.look(bx(1520), 1.45); w.player.face = 1; nb.face = -1;
      yield* w.say('guest', 'Oh! You\'re THEM. The new family! Hi! I\'m not nervous. Why would I be nervous? I love your... music.', 'worry', NB);
      yield* w.say('granddad', 'We ain\'t playing no music.', 'deadpan');
      yield* w.say('guest', 'But when you DO, I\'m going to love it. I already told the homeowners association. I said, "whatever it turns out to be, I love it."', 'grin', NB);
      const a = yield* w.choice('huey', 'HUEY:', ['You called the police on our moving truck.', 'What music do you think we play?', 'You\'ve locked your car twice since we walked up.']);
      if (a === 0) yield* w.say('guest', 'That was a WELLNESS check! On the truck! It looked... stressed.', 'shock', NB);
      else if (a === 1) yield* w.say('guest', 'The... rhythmic kind? With the feelings? I own a CD of it! It\'s in my car. Which I locked. For unrelated reasons!', 'shock', NB);
      else yield* w.say('guest', 'I lock EVERYTHING! I locked the mailbox! I locked the hose! It\'s not a you thing! Welcome to Woodcrest!', 'shock', NB);
      yield* w.say('granddad', 'See that, Huey? Friendly. That man is THRILLED we here.', 'grin');
      yield* w.say('huey', 'That man is sweating through a sweater he isn\'t even wearing.', 'deadpan');
      yield* w.say('granddad', 'That\'s how you know the charm is working.', 'smirk');
      w.cine(false);
      talk = S.add(banter(w, [
        [bx(1620), ri, 'Granddad, that {n} is terrified of us.'],
        [bx(1780), gd, 'Good. Scared folks don\'t borrow your tools.'],
        [bx(1940), ri, 'Ay, is that a HORSE? Who got a horse?'],
        [bx(2100), gd, 'Don\'t look at it. Horses can smell broke.'],
      ]));
      yield* w.goTo(bx(2280), 'KEEP STROLLING. PAST THE BUS STOP');
      yield* drain(talk);
      w.cine(true); w.look(bx(2330), 1.45); w.player.face = 1; ru.face = -1;
      yield* w.say('ruckus', 'Well, well. The Freemans. Strollin\' down a clean sidewalk in broad daylight like somebody built it for \'em.', 'scowl');
      yield* w.say('granddad', 'Ruckus. Why you standing at a bus stop in a bow tie?', 'deadpan');
      yield* w.say('ruckus', 'Uncle Ruckus, no relation, is WORKIN\' the Wuncler party. Parkin\' cars, pourin\' drinks and apologizin\' for the weather. It\'s my thirty-first job and my favorite.', 'grin');
      yield* w.say('huey', 'The bus doesn\'t go to the Wuncler estate.', 'deadpan');
      yield* w.say('ruckus', 'I ain\'t ridin\' it, I\'m salutin\' it. That bus belongs to the county, and the county belongs to Mister Wuncler.', 'grin');
      yield* w.say('ruckus', 'Now you listen. When Mister Wuncler talks, you look at his shoes. Them shoes went to a better college than you ever will.', 'scowl');
      yield* w.say('riley', 'This {n} got a job kissing ass and he putting in overtime.', 'smirk');
      yield* w.say('ruckus', 'And I\'d do it for FREE! Don\'t tell \'em that. Now I gots to run. That ice ain\'t gon\' carry itself to its betters!', 'grin');
      w.cine(false);
      S.add(w.also((function* () { yield* w.walk(ru, bx(3200) + 1200, 340, 'run'); ru.gone = true; })()));
      talk = S.add(banter(w, [
        [bx(2440), gd, 'Don\'t y\'all ever end up like Ruckus.'],
        [bx(2600), ri, 'What, employed?'],
        [bx(2760), gd, 'Boy, I will leave you on this sidewalk.'],
        [bx(2920), ri, 'Dang. The gate got its own gate.'],
      ]));
      yield* w.goTo(bx(3140), 'WALK UP TO THE WUNCLER GATE');
      yield* drain(talk);
      w.cine(true); w.look(bx(3210), 1.45); w.player.face = 1; sec.face = -1;
      yield* w.say('guard', 'Deliveries go around back.', 'deadpan');
      yield* w.say('granddad', 'Deliveries? We are GUESTS. Robert Jebediah Freeman and grandsons. Check your little list.', 'scowl');
      yield* w.say('guard', 'Freeman... Freeman. Here we go. You\'re under "Diversity, plus two".', 'deadpan');
      yield* w.say('granddad', 'That\'s us! Plus two! You hear that, boys? We on the LIST.', 'grin');
      yield* w.say('huey', 'Granddad. He has us filed as a category.', 'deadpan');
      yield* w.say('granddad', 'And we the only ones in it. That\'s called exclusive.', 'smirk');
      yield* w.say('guard', 'Go on in. Keep your hands where the hedges can see them.', 'deadpan');
      yield* w.narr('The gate opened. It was the size of our old apartment building, and better maintained.');
      yield* w.fadeOut(0.4);
      S.end(); w.cine(false);
    },
    function* (w) {                                /* 4. the party: meet the host, mingle, meet the help, fetch the cheese */
      const S = stage(w), N1 = { name: 'Man in a Sweater' }, N2 = { name: 'Man with a Monocle' }, N3 = { name: 'Man in Salmon Pants' };
      w.setBg('garden', { heat: 0 }); w.music('garden', 0.25); w.place(330, 1); w.zoom = 1.3; w.noFight = true;
      const wu = w.npc('wuncler', 640, { face: -1 }), gd = w.npc('granddad', 480, { face: 1, pose: 'handsHips' }), ri = w.npc('riley', 210, { face: 1, pose: 'lean' });
      const a1 = w.npc('guest', 900, { face: -1 }), a2 = w.npc('tux', 1390, { face: -1 }), ru = w.npc('ruckus', 1640, { face: -1, pose: 'hold' });
      const a3 = w.npc('guest', 1930, { face: -1, variant: 1 }), a4 = w.npc('tux', 2440, { face: -1, variant: 1 });
      yield* w.fadeIn(0.4);
      w.cine(true); w.look(500, 1.4); w.player.face = 1;
      yield* w.say('wuncler', 'Robert Freeman! The fella who bought the old Henderson place. Paid cash, too. I had my bank check. Then I had my other bank check my bank.', 'grin');
      gd.rig.setPose('cheer', 10);
      yield* w.say('granddad', 'Mr. Wuncler, sir, it is an HONOR. I love what you done with the... all of it. Is that marble? I love marble. Can\'t go wrong with a rock.', 'grin');
      yield* w.say('wuncler', 'And these are the grandsons. Wonderful. Do they do anything?', 'smirk');
      gd.rig.setPose('handsHips', 10);
      yield* w.say('granddad', 'Huey. Say the thing.', 'scowl');
      yield* w.say('huey', '...I enjoy cheese.', 'deadpan');
      yield* w.say('wuncler', 'HA! Don\'t we all, son. Robert, come look at my helicopter. I don\'t fly it. I just like to make it wait.', 'grin');
      yield* w.say('granddad', 'Boys, go mingle. And remember: BEARS.', 'scowl');
      w.cine(false);
      w.bubble(ri, 'I\'ma go see what ain\'t locked.');
      S.add(w.also((function* () { yield* w.walk(ri, 3000, 280, 'run'); ri.gone = true; })()));   // Riley goes looking for trouble
      S.add(w.chatter(gd, ['You SO right, Mr. Wuncler!', 'I been saying that for years! ...What was it?', 'Is that a real swan? I love a swan.'], 380));
      S.add(w.chatter(wu, ['I evicted a hospital once. Lovely ribbon-cutting.', 'Money can\'t buy happiness. I checked. I own it.'], 380));
      S.add(w.chatter(a1, ['Is the small one glaring at me? I love it.', 'So much energy! Like a tiny senator.'], 300));
      S.add(w.chatter(a4, ['I don\'t see color. I have people for that.', 'We summer where we winter. It confuses the staff.'], 300));
      S.add(w.chatter(ru, ['Yes sir! Thank you for hollerin\', sir!', 'I ironed this lawn myself.'], 300));
      yield* w.talk(a1, 'MINGLE WITH THE GUESTS', (function* () {
        yield* w.say('guest', 'Oh my GOD, your hair. It\'s so... political. May I? I\'m going to. I\'m touching it. I\'m touching it right now.', 'grin', N1);
        const c = yield* w.choice('huey', 'HUEY:', ['No.', 'It bites.', 'That\'ll be five dollars.']);
        if (c === 0) yield* w.say('guest', 'He said "no"! With such CONFIDENCE! Gregory, come listen to this child refuse me!', 'grin', N1);
        else if (c === 1) yield* w.say('guest', 'It BITES! Oh, that is wonderful. Gregory! The hair bites! He\'s hilarious AND dangerous!', 'grin', N1);
        else yield* w.say('guest', 'An entrepreneur! Gregory, give him a twenty. No, keep the change, dear. I\'m paying for the anecdote.', 'grin', N1);
        yield* w.say('huey', 'I was being hostile.', 'deadpan');
        yield* w.say('guest', 'And you\'re SO good at it. Do you do birthdays?', 'grin', N1);
      })());
      yield* w.talk(a2, 'MINGLE WITH THE GUESTS', (function* () {
        yield* w.say('tux', 'Young man, I want you to know that I marched. Well. I watched a march. On television. But I watched the WHOLE thing.', 'grin', N2);
        yield* w.say('tux', 'And I\'ll have you know that several of my finest caddies have been... you know.', 'smirk', N2);
        yield* w.say('huey', 'Underpaid?', 'deadpan');
        yield* w.say('tux', 'EXACTLY. See, this one gets it! We simply must have you people over more often. In groups of one.', 'grin', N2);
      })());
      yield* w.talk(ru, 'SEE WHAT THE HELP IS UP TO', (function* () {
        yield* w.say('ruckus', 'Shrimp puff, sir? Crab puff, sir? Puff of ANY kind, s... oh. It\'s you. These puffs ain\'t for you. These is trust fund puffs.', 'scowl');
        yield* w.say('huey', 'You live across the street from us, Ruckus.', 'deadpan');
        yield* w.say('ruckus', 'A clerical error I been appealin\' for thirty years! I got a condition, see. Acute Tanosis. Doctor says underneath all this I\'m a Norwegian fisherman.', 'grin');
        yield* w.say('huey', 'What doctor?', 'deadpan');
        yield* w.say('ruckus', 'The one on the back of the oatmeal box. Fine man. Now step aside, I gots to go fan a hedge fund.', 'grin');
      })());
      yield* w.talk(a3, 'MINGLE WITH THE GUESTS', (function* () {
        yield* w.say('guest', 'So YOU\'RE the new family! We are thrilled. We discussed it at the homeowners meeting for six hours, and the vote was: thrilled.', 'grin', N3);
        yield* w.say('guest', 'Quick question for the newsletter. Would you say you\'re the kind of family that plays tennis, or the kind that makes the news?', 'worry', N3);
        yield* w.say('huey', 'My brother is eight and already has a lawyer.', 'deadpan');
        yield* w.say('guest', 'So... the news. Got it. No, that\'s fine! That\'s FINE. I\'ll just go move the car.', 'worry', N3);
      })());
      w.bubble(gd, 'HUEY! Get over here! EMERGENCY!');
      yield* w.talk(gd, 'GRANDDAD IS HOLLERING. GO SEE WHY', (function* () {
        yield* w.say('granddad', 'I\'m losing him! He started talking about yachts and I ain\'t got no yacht material. I told him I had a canoe. I DON\'T have a canoe, Huey!', 'worry');
        yield* w.say('granddad', 'It\'s time for rule two. Get me cheese. The GOOD cheese, off the fancy tables. Go! Before he asks what a canoe costs!', 'shout');
      })());
      yield* w.collect([
        { x: 1310, name: 'BRIE', col: '#fff3c0', on() { w.bubble(a2, 'He\'s taking the brie! How BOLD!'); } },
        { x: 1830, name: 'GOUDA', col: '#ffb347', on() { w.bubble(ru, 'That gouda is for SHAREHOLDERS!'); } },
        { x: 2360, name: 'THE BLUE ONE', col: '#9fb4d0', on() { w.bubble(a4, 'That cheese is older than your house.'); } },
      ], 'GET THE GOOD CHEESE OFF THE TABLES');
      yield* w.talk(gd, 'RUSH THE CHEESE TO GRANDDAD', (function* () {
        yield* w.say('granddad', 'Mr. Wuncler! Cheese?', 'grin');
        yield* w.say('wuncler', 'Don\'t mind if I do. You know, Robert, I like you. You remind me of a butler I had. That is the warmest thing I am capable of saying.', 'grin');
        yield* w.say('granddad', 'And I receive it warmly, sir!', 'grin');
        yield* w.say('huey', 'He just called you a butler.', 'deadpan');
        yield* w.say('granddad', 'A RICH man\'s butler, Huey. That\'s upper management.', 'smirk');
        A().sfx('bb_shot'); A().sfx('glass');
        yield* w.wait(0.5);
        yield* w.say('huey', '...Where\'s Riley?', 'worry');
        yield* w.say('granddad', 'Stealing, probably. Let the boy work.', 'deadpan');
      })());
      yield* w.fadeOut(0.3);
      S.end();
    },
    function* (w) {                                /* 5. Riley, Ed Wuncler III, a pistol and a vest */
      const S = stage(w), p = w.player;
      w.setBg('garden', { heat: 0.15 }); w.music('garden', 0.5); w.place(1500, 1); w.zoom = 1.3; w.noFight = true;
      const ed = w.npc('ed3', 2620, { face: -1 }), ri = w.npc('riley', 2500, { face: -1, prop: 'pistol', pose: 'aim', idle: 'aim' });
      yield* w.fadeIn(0.3);
      const talk = S.add(banter(w, [
        [1560, ed, 'Lil man got a trigger finger! HA!'],
        [1750, ri, 'Ay, this thing don\'t even kick!'],
        [1950, ed, 'Aim for the ice sculpture! It can\'t sue!'],
      ]));
      yield* w.goTo(2200, 'FIND RILEY BEFORE A LAWYER DOES');
      yield* drain(talk);
      w.cine(true); w.look(2420, 1.35); p.face = 1;
      yield* w.say('ed3', 'Yo! This the brother? Lil Reezy been tellin\' me about you. Ed Wuncler the Third. Just got back from the war. Don\'t ask me which one, I didn\'t.', 'grin');
      yield* w.say('riley', 'Huey! Ed got a whole ARSENAL in his granddaddy pool house! This {n} let me hold the nine!', 'grin');
      yield* w.say('huey', 'Why does an eight-year-old have a gun at a garden party?', 'scowl');
      yield* w.say('ed3', 'Relax, it shoots pellets. Mostly. I mixed up the boxes. That\'s what keeps it fun.', 'smirk');
      yield* w.say('ed3', 'Reezy says you know kung fu. So we gon\' run a drill. He shoots, you do the karate-movie thing. That\'s how they trained us. I think. I slept through training.', 'grin');
      yield* w.say('huey', 'No.', 'deadpan');
      yield* w.say('riley', 'Too late, I already aimed!', 'grin');
      w.cine(false);
      // the drill: Riley fires on an uneven beat; parry four pellets back into Ed
      w.noFight = false; w.minX = 1700; w.maxX = 2380;
      w.toast('L GUARD. TAP IT JUST AS THE PELLET ARRIVES TO PARRY IT BACK.', 7);
      w.objective('PARRY RILEY\'S PELLETS BACK AT ED'); w.objN = 4;
      const OUCH = ['OW! Ha! That one was real!', 'My NECK! Do it again!', 'AH! Right in the dog tags!', 'I felt that in my trust fund!'];
      const MISS = ['Young Reezy don\'t miss!', 'You slow, Huey!', 'Dance, {n}! Dance!', 'I\'m a natural! Call the army!'];
      let got = 0;
      for (let n = 0; got < 4; n++) {
        ri.face = p.x < ri.x ? -1 : 1; ri.rig.setPose('aim', 14);
        FX.text(ri.x, ri.y - ri.hh - 30, '!', '#ffe36e', 2); A().sfx('detect', { vol: 0.6, pitch: 1.5 });
        yield 0.7 + (n % 3) * 0.25;                // uneven rhythm: watch the pellet, not the clock
        const before = w.stats.parries;
        L.fireAt(ri, w, 640, 3); ri.rig.setPose('recoil', 30);
        yield 0.9;
        if (AUTO() || w.stats.parries > before) {
          got++; w.objN = 4 - got;
          ed.rig.setPose('stagger', 20); ed.rig.expr = 'pain'; A().sfx('hit_light'); FX.spark(ed.x - 20, -120, 6, '#9fe8ff', 220);
          w.bubble(ed, OUCH[(got - 1) % 4]);
          yield 0.6; ed.rig.setPose('stand', 10); ed.rig.expr = 'grin';
        } else w.bubble(ri, MISS[n % 4]);
        yield 0.5;
      }
      w.objective(null); w.noFight = true;
      w.cine(true); w.look(2480, 1.4); p.face = 1; ri.rig.setPose('stand', 10);
      yield* w.say('ed3', 'Okay, okay, MY turn! Reezy, shoot me. Center mass. It\'s cool, I got the vest on.', 'grin');
      yield* w.say('huey', 'You said some of those are real bullets.', 'deadpan');
      yield* w.say('ed3', 'That\'s WHY I got the vest on. Man, your brother don\'t listen. Come on, Reezy, we doin\' it upstairs by the big window. It\'s more tactical.', 'smirk');
      yield* w.say('riley', 'This the best party I ever been to.', 'grin');
      S.add(w.also(w.walk(ri, 3100, 300, 'run')));
      yield* w.walk(ed, 3100, 300, 'run');
      ed.gone = ri.gone = true;
      const g1 = w.npc('guest', 1880, { face: 1 }), g2 = w.npc('tux', 1760, { face: 1 });
      w.look(2260, 1.2);
      yield* w.narr('I did the math. An idiot, a child, a vest of unknown origin and a second-floor window. I took three steps back.');
      A().sfx('bb_shot'); yield 0.35;
      A().sfx('glass'); FX.flash(0.5); BD.cam.shake(0.6);
      for (let i = 0; i < 4; i++) FX.spark(2420 + U.rand(-70, 70), -640 + U.rand(-40, 40), 6, '#cfefff', 260);
      const ed2 = w.npc('ed3', 2420, { face: -1, y: -760, pose: 'launch', expr: 'shock' });
      yield () => ed2.y >= 0;
      ed2.rig.setPose('down', 24); ed2.rig.expr = 'pain'; A().sfx('thud'); BD.cam.shake(0.5); FX.dust(2420, 0, 10, '#d9cfbb');
      yield* w.wait(0.8);
      g1.rig.setPose('cheer', 10); g2.rig.setPose('cheer', 10); g1.rig.expr = g2.rig.expr = 'grin'; A().sfx('crowd');
      yield* w.say('guest', 'HA! Oh, that Eddie. That\'s the second window this month!', 'grin');
      yield* w.say('tux', 'Marvelous form. A Wuncler always lands on his trust fund.', 'grin');
      yield* w.say('ed3', 'I\'m good! Vest worked! ...Can\'t feel nothin\' below the vest, but the VEST worked!', 'pain');
      const r2 = w.npc('riley', 3000, { face: -1, prop: 'pistol' });
      yield* w.walk(r2, 2580, 320, 'run');
      yield* w.say('riley', 'That was the greatest thing I ever seen! Ed! Can I shoot you again when you can feel stuff?', 'grin');
      yield* w.say('ed3', 'My guy! Any time!', 'grin');
      yield* w.narr('A grown man got shot out of a window and the party applauded. That was when I understood: these people could not be shocked. I decided to try anyway.');
      yield* w.fadeOut(0.4);
      S.end(); w.cine(false);
    },
    function* (w) {                                /* 6. the microphone, for real this time */
      const S = stage(w), p = w.player;
      w.setBg('garden', { heat: 0 }); w.music('garden', 0.15); w.place(1250, -1); w.zoom = 1.3; w.noFight = true;
      const gd = w.npc('granddad', 900, { face: 1, pose: 'handsHips' }), wu = w.npc('wuncler', 720, { face: 1 }), ru = w.npc('ruckus', 1180, { face: -1, pose: 'hold' });
      const crowd = [w.npc('guest', 640, { face: -1 }), w.npc('tux', 800, { face: -1 }), w.npc('guest', 1010, { face: -1, variant: 1 }), w.npc('tux', 1100, { face: -1, variant: 1 })];
      yield* w.fadeIn(0.4);
      const nag = S.add(w.also((function* () {
        yield () => p.x < 1130 && !w.cineOn; w.bubble(gd, 'Huey. Where you going? HUEY.'); yield 1.7;
        yield () => p.x < 860 && !w.cineOn; w.bubble(gd, 'Boy, I see you looking at that microphone!'); yield 1.7;
        yield () => p.x < 620 && !w.cineOn; w.bubble(ru, 'That podium is for DONORS!'); yield 1.7;
      })()));
      yield* w.interact(473, 'TAKE THE MICROPHONE', 'SPEAK');
      yield* drain(nag);
      w.cine(true); w.look(720, 1.2); p.x = 430; p.face = 1; p.rig.prop = 'mic'; p.pose('point', 12, 'deadpan');
      for (const g of crowd) g.face = -1;
      wu.face = gd.face = ru.face = -1;
      yield* w.say('huey', 'Excuse me. Everyone. I have something to say, and you are not going to like it.', 'deadpan');
      gd.rig.setPose('facepalm', 12);
      yield* w.say('granddad', 'Lord, he got the microphone. Sixty years of cheese, straight down the toilet.', 'worry');
      const a = yield* w.choice('huey', 'TELL THEM THE TRUTH:', ['This lawn was paid for with wars.', 'You are all complicit.', 'Your host is a robber baron.']);
      if (a === 0) {
        yield* w.say('huey', 'Every blade of grass on this lawn was paid for by somebody else\'s war. You are standing on a very well-watered crime.', 'scowl');
        yield* w.say('guest', 'He\'s right, this landscaping is CRIMINAL. Ed, who do you use?', 'grin');
      } else if (a === 1) {
        yield* w.say('huey', 'Every one of you is complicit in a system that eats poor people and calls it brunch.', 'scowl');
        yield* w.say('guest', 'Ooh, is there a brunch? Nobody told me there was a brunch.', 'grin');
      } else {
        yield* w.say('huey', 'Your host is a robber baron who would foreclose on an orphanage.', 'scowl');
        yield* w.say('wuncler', 'Two of them, son. Lovely old buildings. They\'re condos now.', 'grin');
      }
      const b = yield* w.choice('huey', 'GO HARDER:', ['Nobody here earned any of this.', 'You are all terrified of my family.', 'Also, the shrimp is bad.']);
      if (b === 0) {
        yield* w.say('huey', 'Not one person here earned what they have. You inherited it, stole it, or married it.', 'scowl');
        yield* w.say('tux', 'All three, actually! How nice of you to notice.', 'grin');
      } else if (b === 1) {
        yield* w.say('huey', 'You\'re terrified of my family. You have been smiling at us for an hour like hostages.', 'scowl');
        yield* w.say('guest', 'We ARE terrified! And we\'re working on it! My therapist says the smiling is real progress.', 'grin');
      } else {
        yield* w.say('huey', 'Also, the shrimp has been in the sun for three hours. Several of you are already dying.', 'deadpan');
        yield* w.say('guest', 'So brave. I\'ve had nine.', 'grin');
      }
      p.pose('pointUp', 12, 'scowl');
      yield* w.say('huey', 'The revolution is coming. And when it gets here, not one of you is on the list of people worth saving.', 'scowl');
      yield* w.wait(1.1);
      A().sfx('crowd');
      for (const g of crowd) { g.rig.setPose('cheer', 10); g.rig.expr = 'grin'; }
      yield* w.say('guest', 'BRAVO! Did you HEAR that vocabulary? And the eye contact! At HIS age!', 'grin');
      yield* w.say('tux', 'Ed, where did you FIND him? Is he with the caterer? Can we book him for the regatta?', 'grin');
      yield* w.say('huey', 'I just called every one of you a thief.', 'deadpan');
      yield* w.say('guest', 'And you did it so WELL. So well-spoken! Isn\'t he adorable? He\'s like an angry little professor.', 'grin');
      yield* w.say('wuncler', 'Robert, your boy is a firecracker. Hates everything I stand for. Reminds me of me, before the money. I love him.', 'grin');
      gd.rig.setPose('cheer', 10);
      yield* w.say('granddad', 'I... yes! Yes sir! I raised him to hate you personally! It was all part of the... have some more cheese.', 'grin');
      yield* w.say('ruckus', 'Don\'t you worry, Mister Wuncler. I\'ll hose down that microphone. Get the opinions off it.', 'scowl');
      p.pose('stand', 8, 'deadpan'); p.rig.prop = null;
      yield* w.narr('I waited for the riot. Somebody refilled my lemonade.');
      yield* w.fadeOut(0.4);
      S.end(); w.cine(false);
    }],
    *outro(w) {
      w.player.rig.prop = null;
      w.setBg('garden', { heat: 0 }); w.music('garden', 0); w.place(520, -1);
      const gd = w.npc('granddad', 380, { face: 1, pose: 'handsHips' }), ri = w.npc('riley', 660, { face: -1, pose: 'lean' });
      w.look(520, 1.45);
      yield* w.fadeIn(0.5);
      yield* w.narr('I told them the truth. All of it. They clapped, called me adorable, and went back to their drinks.');
      yield* w.say('granddad', 'Did you see that? He LIKES us! Sixty years of cheese research, vindicated in one afternoon!', 'grin');
      yield* w.say('riley', 'Ed say I can come shoot him whenever I want. That\'s my {n} now.', 'grin');
      yield* w.say('granddad', 'See, Huey? Your brother made a friend. A rich, stupid, heavily armed friend. That\'s called networking.', 'smirk');
      yield* w.say('huey', 'I insulted every single person at that party.', 'deadpan');
      yield* w.say('granddad', 'And they LOVED it. You doing revolution wrong, boy. Now walk fast, before they sober up and count the silverware.', 'scowl');
      yield* w.say('riley', 'They ain\'t gon\' find it. It all fit in a pocket. Like you said.', 'smirk');
      yield* w.say('granddad', '...That\'s my boy. Walk FASTER.', 'worry');
      yield* w.narr('You can\'t start a riot with people that comfortable. A riot needs somebody with something to lose that isn\'t insured.');
      yield* w.narr('In the dream, they chased me with croquet mallets. I miss the dream.');
      gd.gone = ri.gone = true;
    },
  });
})();
