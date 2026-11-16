/* inspector.js: "A Date with the Health Inspector". Tom fits the description. Ed and Rummy fit no description of competence. */
(() => {
  'use strict';
  const BD = window.BD, U = BD.U, FX = BD.FX, L = BD.Lib, cam = BD.cam;
  const A = () => BD.Audio;
  const E = L.E;
  /* positions are written for the full-size backdrops; squeeze them when a narrower stand-in is loaded */
  const at = (w, x, full) => (w.bg.width >= full ? x : Math.round(x * (w.bg.width - 140) / full) + 60);
  const B = (w, x) => at(w, x, 4200);   // the Woodcrest block
  const P = (w, x) => at(w, x, 2400);   // the Pump-N-Munch lot
  const as = (w, id, name, text, expr) => w.say(id, text, expr, { name });
  const cop = (w, text, expr) => as(w, 'guard', 'Officer', text, expr);
  const clerk = (w, text, expr) => as(w, 'guest', 'Clerk', text, expr);
  const wipe = (w, cos) => { for (const c of cos || []) c.stop(); for (const f of w.fighters) if (f !== w.player) f.gone = true; };
  function* flee(w, f, x, speed, cycle) { yield* w.walk(f, x, speed || 330, cycle || 'run'); f.gone = true; }

  /* ------------------------------------------------- Gin Rummy: the brains */
  const RM_JAB = E({ poses: ['jabW', 'jab'], wind: 0.34, rec: 0.2, dmg: 6, reach: 128, lunge: 200 });
  const RM_CROSS = E({ poses: ['crossW', 'cross'], wind: 0.18, rec: 0.5, dmg: 8, reach: 132, lunge: 220, tell: false, windRate: 20, down: true });
  const RM_BOOT = E({ poses: ['kickW', 'sideKick'], wind: 0.55, act: 0.22, rec: 0.6, dmg: 11, reach: 120, rush: 820, lunge: 0, down: true, sfx: 'whoosh_heavy' });
  const RM_SLAM = E({ poses: ['overW', 'slam'], wind: 0.72, rec: 0.75, dmg: 13, reach: 144, unblock: true, down: true, armor: true, sfx: 'whoosh_heavy', fire(f) { FX.ring(f.x + f.face * 90, 0, '#ffffff', 90); cam.shake(0.4); A().sfx('thud'); } });
  const RUMMY_BARKS = [
    "This isn't assault. It's enhanced babysitting.",
    "You can't PROVE I'm losing!",
    "I never said he did it. I said we'd act like it.",
    'Every punch you land proves my point!',
    "We don't keep count. Of bodies or receipts.",
    "Standoffs get messy. That's how you know it's working.",
  ];
  function* rummyAI(f, w) {
    const rage = f.hp < f.max * 0.45;
    yield* f.idleFor(rage ? 0.35 : 0.7);
    if (Math.random() < 0.3) w.bubble(f, U.pick(RUMMY_BARKS));
    const d = f.dist(), r = Math.random();
    if (d > 340) { if (r < 0.6) yield* f.strike(RM_BOOT); else yield* f.approach(150, 1.2, 230); }
    else if (d < 200) {
      if (r < 0.5) { yield* f.strike(RM_JAB); yield* f.strike(RM_CROSS); if (rage) yield* f.strike(RM_SLAM); }
      else if (r < 0.78) yield* f.strike(RM_SLAM);
      else { w.bubble(f, 'Hold on. Let me explain why I am winning.'); f.pose('pointUp', 14, 'smirk'); yield 1.1; f.set('idle'); }
    } else yield* f.approach(160, 1.0, 220);
  }

  /* --------------------------------------- Ed Wuncler III: the money and the shooting */
  const ED_SHOT = E({ poses: ['aim', 'recoil'], wind: 0.5, act: 0.05, rec: 0.24, dmg: 0, lunge: 0, sfx: null, laser: true, tell: false, windRate: 18, fire(f, w) { L.fireAt(f, w, 760, 6); } });
  const ED_QUICK = Object.assign({}, ED_SHOT, { wind: 0.2 });
  const ED_SPRAY = E({ poses: ['aim', 'recoil'], wind: 0.75, act: 0.05, rec: 0.6, dmg: 0, lunge: 0, sfx: null, laser: true, windRate: 14, fire(f, w) { for (const s of [-0.15, 0, 0.15]) L.fireAt(f, w, 700, 5, s); } });
  const ED_WHIP = E({ poses: ['swingW', 'swing'], wind: 0.36, rec: 0.45, dmg: 7, reach: 122, kb: 540, down: true, lunge: 150 });
  const ED_FLAIL = E({ poses: ['jabW', 'flurry'], wind: 0.4, rec: 0.6, dmg: 6, reach: 120, lunge: 200 });
  const ED_BARKS = [
    'I did a TOUR! Tour-ish!',
    'Grandpa OWNS the judge! Like, there is paperwork!',
    "Quit parrying! That's cheating!",
    'These are WARNING shots! Mostly!',
    "I'm the good guy! I checked!",
  ];
  function* edRetreat(f, w) {
    const l = w.minX + 90, r = w.maxX - 90, p = w.player;
    yield* f.runTo(Math.abs(p.x - l) > Math.abs(p.x - r) ? l : r, 400); f.faceT();
  }
  function* edAI(f, w) {
    const d = f.data, k = f.hp / f.max;
    if (k < 0.5 && !d.mad) { d.mad = true; w.bubble(f, "Okay, NOW it's a war! I'm calling it a war!"); f.pose('cheer', 14, 'shout'); yield 0.9; f.set('idle'); }
    if (k < 0.2 && !d.empty) { d.empty = true; f.rig.prop = null; f.idlePose = 'stance'; w.bubble(f, 'Click? ...Rummy! Throw me a gun! ANY gun!'); f.pose('shrug', 14, 'shock'); yield 1.1; f.set('idle'); }
    if (d.empty) { yield* f.idleFor(0.4); yield* f.approach(110, 1.6, 280); if (f.dist() < 150) yield* f.strike(ED_FLAIL); yield* f.idleFor(0.8); return; }
    if (f.dist() < 180) { yield* f.strike(ED_WHIP); yield* edRetreat(f, w); return; }
    yield* f.idleFor(d.mad ? 0.4 : 0.7);
    const r = Math.random();
    if (r < 0.38) yield* f.strike(ED_SHOT);
    else if (r < 0.68) { yield* f.strike(ED_SHOT); yield* f.strike(ED_QUICK); if (d.mad) yield* f.strike(ED_QUICK); }
    else if (r < 0.86) yield* f.strike(ED_SPRAY);
    else { w.bubble(f, U.pick(ED_BARKS)); f.pose('cheer', 14, 'grin'); yield 1.0; f.set('idle'); }
  }

  BD.episode({
    id: 'inspector', title: 'A DATE WITH THE HEALTH INSPECTOR', src: 'inspired by Season 1, Episode 5', bg: 'block',
    blurb: 'Tom is arrested for a murder he is far too nervous to commit. Ed Wuncler III and Gin Rummy offer to investigate. They bring guns instead of evidence.',
    loss: 'Rummy: "The kid going down was always part of the plan. I just had not told the plan yet."',
    *intro(w) {
      w.setBg('block'); w.music('garden', 0); w.place(B(w, 1180), 1);
      const jaz = w.npc('jazmine', B(w, 1440), { face: 1 });
      const tom = w.npc('tom', B(w, 2050), { face: -1 }), po = w.npc('guard', B(w, 2500), { face: -1 });
      w.look(B(w, 1500), 1.3);
      yield* w.narr('Woodcrest. The safest neighborhood in America, according to the people it was built to keep safe.');
      yield* w.narr('All week on the news: the Leaf Blower Killer. A man murdered on his own lawn at 7 a.m. The suspect: a Black male. That was the whole description.');
      yield* w.walk(tom, B(w, 1640), 150, 'walk');
      yield* w.say('tom', 'Evening, Huey! Lovely night. I just apologized to a parking meter for being late. We worked it out.', 'grin');
      A().sfx('alert');
      yield* w.walk(po, B(w, 1800), 320, 'run');
      tom.face = 1; tom.rig.setPose('cower', 14); tom.rig.expr = 'shock';
      yield* cop(w, "Sir! SIR! Freeze! Hands where I can see them! Slowly! ...Slower! No, that was TOO slow, that's suspicious!", 'shout');
      yield* w.say('tom', "Officer! Hello! Tom DuBois, district attorney's office! We've met! I brought lemon bars to the precinct picnic!", 'worry');
      yield* cop(w, "We got a report of a Black male in this area. You're a Black male. In this area. I don't like how that lines up, sir.", 'scowl');
      yield* w.say('tom', "I LIVE in this area! That's my house! That's my daughter! Those are my hydrangeas!", 'shout');
      jaz.rig.expr = 'worry';
      yield* w.say('jazmine', 'Daddy? Why is the policeman holding you like the men on the news?', 'worry');
      w.player.pose('point', 12, 'scowl');
      yield* w.say('huey', "What's the description? Height? Weight? Anything a detective would call a detail?", 'scowl');
      yield* cop(w, "Black. Male. Between a hundred and four hundred pounds. Possibly in clothes. Kid, it's him or it's nobody, and my sergeant hates nobody.", 'deadpan');
      yield* w.say('tom', "I've put two hundred men in that jail! They know my face! They know my SIGNATURE!", 'shock');
      yield* cop(w, "Then you won't be lonely. Watch your head, sir.", 'neutral');
      A().sfx('chain');
      yield* w.say('tom', 'THAT IS THE PROBLEM! THAT IS THE ENTIRE PROBLEM!', 'shout');
      w.also(w.walk(po, B(w, 2700), 150, 'walk'));
      w.bubble(tom, "I'm sorry! Whatever he did, I'm SORRY!");
      yield* w.walk(tom, B(w, 2560), 150, 'shuffle');
      w.bubble(jaz, 'Daddy?! DADDY!');
      yield 0.8;
      w.player.pose('armsCrossed', 10, 'deadpan');
      yield* w.narr('Tom DuBois. Prosecutor. A man who signals before changing lanes in an empty parking lot. Arrested forty feet from his own welcome mat.');
      yield* w.fadeOut(0.4);
      wipe(w);
    },
    phases: [function* (w) {
      /* 1: the aftermath on the street, then Tom's one phone call */
      w.setBg('block'); w.music('garden', 0.1); w.place(B(w, 1240), 1); w.noFight = true;
      const jaz = w.npc('jazmine', B(w, 1460), { face: -1, pose: 'cower', expr: 'worry' });
      const po = w.npc('guard', B(w, 1780), { face: -1, pose: 'think' });
      const ri = w.npc('riley', B(w, 1100), { face: 1, pose: 'lean' });
      yield* w.fadeIn(0.3);
      w.toast('E  TALK', 5);
      w.bubble(ri, 'They got Mr. DuBois for MURDER? ...Respect.');
      yield* w.talk(jaz, 'TALK TO JAZMINE', (function* () {
        yield* w.say('jazmine', "They took my daddy! He didn't do anything! He doesn't even jaywalk! He says sorry to the crosswalk!", 'worry');
        const i = yield* w.choice('huey', 'TELL JAZMINE:', ['The system will sort it out.', 'The system is working as designed.', "He'll be fine. Probably."]);
        if (i === 0) {
          yield* w.say('huey', 'The justice system will sort it out, Jazmine.', 'deadpan');
          yield* w.say('jazmine', '...Really?', 'worry');
          yield* w.say('huey', "No. But it's what people say while they wait.", 'deadpan');
        } else if (i === 1) {
          yield* w.say('huey', "The system isn't broken, Jazmine. It's doing exactly what it was built to do.", 'scowl');
          yield* w.say('jazmine', "So... it's working?", 'worry');
          yield* w.say('huey', "That's the bad news.", 'deadpan');
        } else {
          yield* w.say('huey', "He'll be fine. Probably. Statistically.", 'deadpan');
          yield* w.say('jazmine', "What's statistically?", 'worry');
          yield* w.say('huey', "It's a word for when you stop promising things.", 'deadpan');
        }
        jaz.rig.setPose('cower', 14);
        yield* w.say('jazmine', "WAAAAAH! I'll tell the judge he's nice! He cuts the crusts off! He irons his SOCKS!", 'shout');
      })());
      w.bubble(jaz, 'WAAAAAAAH!');
      yield* w.talk(po, 'QUESTION THE OFFICER', (function* () {
        po.rig.setPose('cower', 16);
        yield* cop(w, 'WHOA! Back up, son! Hands! ...Is that a book? Put the book down. Slowly.', 'shock');
        yield* w.say('huey', "It's a library book.", 'deadpan');
        po.rig.setPose('handsHips', 10);
        yield* cop(w, "That's how it starts. First a book. Then questions.", 'scowl');
        yield* w.say('huey', "Here's one. Who is your witness?", 'scowl');
        yield* cop(w, "Lady across the street. Saw a dark figure by her hedge. Could've been a man. Could've been more hedge. She was real shaken up either way.", 'neutral');
        yield* w.say('huey', 'So you arrested a district attorney on the word of a woman who is afraid of landscaping.', 'deadpan');
        yield* cop(w, "We questioned the hedge too. It had no alibi. Look, he gets a phone call and a judge on Monday. It's one weekend in county.", 'deadpan');
        yield* w.narr('One weekend in county. For a man like Tom, that was a life sentence with a head start.');
      })());
      const tag = w.follow(ri, 110);
      w.bubble(po, 'Keep that book where I can see it!');
      w.also((function* () { yield 2.5; if (!ri.gone) w.bubble(ri, "You was TALKIN' to the police? On PURPOSE?!"); })());
      yield* w.goTo(B(w, 700), 'THE PHONE IS RINGING AT HOME. GO ANSWER IT.');
      w.bubble(ri, "Granddad! Huey out here snitchin'!");
      yield 0.9;
      yield* w.fadeOut(0.4);
      wipe(w, [tag]);

      w.setBg('house', {}); w.music('house', 0.2); w.place(620, 1);
      w.npc('granddad', 800, { face: -1, pose: 'handsHips' }); w.npc('riley', 470, { face: 1, pose: 'lean' });
      w.cine(true); w.look(640, 1.45);
      yield* w.fadeIn(0.4);
      yield* w.narr('They gave Tom one phone call. His wife was at hot yoga with her phone off. So the district attorney called a ten-year-old.');
      A().sfx('bell');
      yield* w.say('tom', "Huey?! Oh, thank God. Huey, I'm in JAIL. Real jail! There's a bench and a toilet and they're in the SAME ROOM!", 'shock');
      yield* w.say('tom', "I can't do a weekend in here! You know what happens to men like me in here! I'm SOFT, Huey! I moisturize! I have a welcoming face!", 'worry');
      let i = yield* w.choice('huey', 'COMFORT TOM:', ['Most inmates are non-violent.', "Don't make eye contact.", 'Stay near the biggest guy.']);
      if (i === 0) {
        yield* w.say('huey', 'Calm down. Statistically, most people in county jail are there for non-violent offenses.', 'deadpan');
        yield* w.say('tom', "MOST?! What's the number on the rest, Huey?! Is the rest IN HERE?! One of them is doing push-ups AT me!", 'shout');
      } else if (i === 1) {
        yield* w.say('huey', "Don't make eye contact with anybody.", 'deadpan');
        yield* w.say('tom', "Too late! I made eye contact with EVERYBODY! I said 'good evening, gentlemen'! I WAVED, Huey! Why did I wave?!", 'shout');
      } else {
        yield* w.say('huey', 'Find the biggest man in the cell and stay close to him.', 'deadpan');
        yield* w.say('tom', "He found ME! He's right next to me! He patted the bench, Huey! He PATTED it! Like you'd call a cat!", 'shout');
      }
      yield* w.say('tom', 'And my cellmate keeps SMILING. He offered me half his sandwich! Nobody gives away half a sandwich! What does he want FOR the sandwich?!', 'worry');
      yield* w.say('riley', "Ay, Mr. DuBois. Real talk. Whatever you do in them showers, do NOT drop nothin'. Not the soap. Not your guard. Nothin'.", 'grin');
      yield* w.say('tom', "THE SHOWERS! Oh God, I forgot there were showers! Fine. I just won't shower. Three days. I did it once at a jazz festival!", 'shock');
      i = yield* w.choice('huey', 'TRY AGAIN:', ['You know your rights.', 'Those men know you. Apologize.', "It's only until Monday."]);
      if (i === 0) {
        yield* w.say('huey', "You're a prosecutor. You know your rights better than anybody in there.", 'deadpan');
        yield* w.say('tom', "I know EVERYBODY'S rights! I've spent fifteen years explaining why they don't count! Oh no. Oh, I'm really GOOD at it.", 'shock');
      } else if (i === 1) {
        yield* w.say('huey', 'Half that cell is in there because of you. Maybe open with an apology.', 'deadpan');
        yield* w.say('tom', "One of them just said 'DuBois?' from across the room. He said it the way you'd read a menu, Huey.", 'worry');
      } else {
        yield* w.say('huey', "It's only until Monday.", 'deadpan');
        yield* w.say('tom', "Monday is three showers away! THREE! I did the math! I did it on the wall, like a real prisoner!", 'shout');
      }
      yield* w.say('granddad', "Is that Tom? Tell him I can't be no character witness, I got a thing. And get off my damn phone! I'm expecting a call from a woman named Destiny!", 'scowl');
      yield* w.say('tom', "They say my time's up. Tell Sarah I love her. Tell Jazmine I love her. Tell the big fella I'm not hungry... no, sir, the sandwich is LOVELY, I...", 'worry');
      A().sfx('ui_back');
      yield* w.narr('The line went dead. Somewhere in county, a grown man was eating half a sandwich out of pure fear.');
      w.player.pose('think', 10, 'scowl');
      yield* w.say('huey', "The police have their suspect, so they've stopped looking. Tom only walks if somebody finds the real killer.", 'scowl');
      yield* w.say('riley', "That's SNITCHIN'! You tryna do the police job for they bitch-ass? {N}, THAT'S the real crime. Killer ain't did nothin' to us.", 'angry');
      yield* w.say('huey', '{N}, he murdered a man.', 'deadpan');
      yield* w.say('riley', "{N}, over a leaf blower at seven in the mornin'? I heard the facts. I got questions for the victim.", 'smirk');
      yield* w.say('granddad', "Ain't no {n} in this house solving nothin'. I don't talk to police. I learned that marching in Selma.", 'scowl');
      yield* w.say('huey', 'You told me you left that march before it started.', 'deadpan');
      yield* w.say('granddad', "Because I saw POLICE! That's the lesson, boy! Now go play detective outside, before I go detect my belt.", 'shout');
      yield* w.narr('I needed witnesses, evidence and a ride. What I had was a little brother with a moral objection to justice.');
      yield* w.fadeOut(0.4);
      w.cine(false); wipe(w);
    }, function* (w) {
      /* 2: canvass the block. Every clue is useless and the one real lead comes from the worst possible source */
      w.setBg('block'); w.music('stealth', 0.2); w.place(B(w, 760), 1); w.noFight = true;
      const ri = w.npc('riley', B(w, 660), { face: 1 });
      const nb = w.npc('guest', B(w, 1150), { face: -1, variant: 0, pose: 'handsHips' });
      const jaz = w.npc('jazmine', B(w, 1560), { face: -1 });
      const wit = w.npc('guest', B(w, 1980), { face: -1, variant: 1, prop: 'purse', pose: 'armsCrossed' });
      const ru = w.npc('ruckus', B(w, 2380), { face: -1, pose: 'lean' });
      const side = [w.follow(ri, 110), w.chatter(jaz, ["I'm raising bail! I have four dollars and a button!", 'Is jail like time-out? Daddy HATES time-out.', 'Do they have nightlights in jail?'], 300)];
      side.push(w.also((function* () {
        for (const s of ['Detectives is just snitches with a pension.', "If I see somethin', I ain't seen nothin'.", 'You know who solves murders? The FEDS, {n}.', "Mr. DuBois in there makin' friends by now."]) {
          yield U.rand(10, 15);
          if (!w.cineOn && !w.dlg) w.bubble(ri, s);
        }
      })()));
      yield* w.fadeIn(0.3);
      yield* w.narr('Step one of any investigation: canvass the neighborhood. In Woodcrest, that means asking frightened people to describe a Black man from memory.');
      yield* w.talk(nb, 'ASK THE NEIGHBOR WHAT HE SAW', (function* () {
        yield* as(w, 'guest', 'Neighbor', "Huey! Hey! My man! What is... crackalackin'? Is that current? I'm asking sincerely. I want to get it right.", 'grin');
        yield* w.say('huey', 'The morning of the murder. Did you see anything?', 'deadpan');
        yield* as(w, 'guest', 'Neighbor', "I saw a Black gentleman. Not that I see color! I don't! I noticed it, respectfully, and then I un-noticed it.", 'worry');
        yield* w.say('huey', 'What did he look like?', 'deadpan');
        yield* as(w, 'guest', 'Neighbor', 'Honestly? Like Tom. Or like you, but taller. Or the man who does the weather. I am SO sorry. I own a jazz record. Please tell people that.', 'shock');
      })());
      w.bubble(ri, "He scared of us AND he snitchin'. Pick one!");
      yield* w.collect([
        { x: B(w, 1290), name: 'A LEAF', on() { w.bubble(ri, "That's a leaf, {n}. From a TREE."); } },
        { x: B(w, 1420), name: 'A RECEIPT', on() { w.bubble(w.player, "Receipt. One leaf blower. Marked 'RETURNED'."); } },
        { x: B(w, 1700), name: 'A FOOTPRINT', on() { w.bubble(ri, 'A footprint. Size: foot. Crack that case.'); } },
        { x: B(w, 1830), name: 'A FLYER', on() { w.bubble(w.player, "'HAVE YOU SEEN THIS MAN?' There is no photo."); } },
      ], 'COLLECT THE EVIDENCE');
      yield* w.narr('A leaf. A receipt. A footprint. A flyer with no face on it. The police had arrested a man on less. That was the problem.');
      yield* w.talk(wit, 'QUESTION THE EYEWITNESS', (function* () {
        yield* as(w, 'guest', 'Eyewitness', 'I told the police everything. He was dark, he was by my hedge, and he had a look. A going-somewhere look.', 'scowl');
        yield* w.say('huey', 'A man. Walking. In a neighborhood. That is your entire testimony.', 'deadpan');
        yield* as(w, 'guest', 'Eyewitness', 'With INTENT, sweetie. Nine years on this street and I have never once seen anybody walk on purpose.', 'worry');
        yield* w.say('huey', 'Would you recognize him again?', 'scowl');
        yield* as(w, 'guest', 'Eyewitness', "Of course! It was the one they arrested. I know because they arrested him. That's how you can tell.", 'grin');
      })());
      w.bubble(wit, 'I feel SO much safer now.');
      yield* w.talk(ru, 'HEAR UNCLE RUCKUS OUT. YOU WILL REGRET IT.', (function* () {
        yield* w.say('ruckus', 'Uncle Ruckus, no relation. And put the notepad away, boy. I solved your little mystery before the body hit the begonias.', 'grin');
        yield* w.say('ruckus', "DuBois done it. He got a condition: Prosecutorial Relapse. Jail your own kind for twenty years, one day the jail comes home to collect. It's medical.", 'sly');
        yield* w.say('huey', 'Tom has never returned a library book late. He calls the library to apologize in ADVANCE.', 'deadpan');
        yield* w.say('ruckus', "And if he AIN'T done it, he still the right man, 'cause the police picked him. Them fine officers ain't never been wrong. I read their own reports.", 'grin');
        yield* w.say('ruckus', "I turn MYSELF in every Tuesday, as a courtesy. They keep sending me home. Say I ain't done nothing. I say give it time, officer. Look at me.", 'worry');
        yield* w.say('riley', 'This {n} got a loyalty card at the police station.', 'smirk');
        yield* w.say('huey', 'Did you actually SEE anything that morning?', 'scowl');
        yield* w.say('ruckus', "Just a white fella in khakis and a golf visor, sprintin' past with a leaf blower, hollerin' 'I did it, I finally did it.' Nothin' suspicious.", 'neutral');
        yield* w.say('huey', '...Which way did he go?', 'shock');
        yield* w.say('ruckus', "Toward the Pump-N-Munch out on Route 9. I waved. Didn't look at his face, that'd be forward. Fine posture, though. Man was raised right.", 'grin');
        yield* w.narr('A white man in khakis and a golf visor. In Woodcrest. That narrowed it down to the entire membership of the country club.');
        yield* w.say('riley', "Hold up. 'Black dude' gets Mr. DuBois locked up in a hour. 'White dude in a visor', and now y'all need more information?", 'scowl');
        yield* w.say('huey', 'Yes. That is exactly how it works.', 'deadpan');
        yield* w.say('riley', "...Damn. I still ain't snitchin', though.", 'smirk');
      })());
      w.bubble(ru, 'Tell DuBois orange is a FINE color on him!');
      yield 1.4;
      yield* w.fadeOut(0.4);
      wipe(w, side);
    }, function* (w) {
      /* 3: a ride. Granddad declines, so the only adults left are the two worst ones */
      w.setBg('block'); w.music('garden', 0.3); w.place(B(w, 800), -1); w.noFight = true;
      const gd = w.npc('granddad', B(w, 690), { face: 1, pose: 'armsCrossed' });
      const ri = w.npc('riley', B(w, 900), { face: -1 });
      const nb = w.npc('guest', B(w, 1500), { face: -1, variant: 0 }), ru = w.npc('ruckus', B(w, 2380), { face: -1, pose: 'lean' });
      const ed = w.npc('ed3', B(w, 3230), { face: -1, prop: 'pistol', pose: 'lean' }), rm = w.npc('rummy', B(w, 3340), { face: -1, pose: 'armsCrossed' });
      const side = [
        w.chatter(nb, ['Still not seeing color! Going great!', "Tell Tom we're thinking of him! From over here!"], 300),
        w.chatter(ru, ['Justice is SERVED! Praise the department!', 'I sent them officers a fruit basket and a apology!'], 300),
      ];
      yield* w.fadeIn(0.3);
      yield* w.talk(gd, 'ASK GRANDDAD FOR A RIDE', (function* () {
        yield* w.say('huey', "Granddad. I need a ride to the Pump-N-Munch on Route 9. It's about the murder.", 'deadpan');
        yield* w.say('granddad', "{N}, I am not driving you TO a murder, FROM a murder or AROUND a murder. That's how you end up in the documentary.", 'scowl');
        yield* w.say('granddad', 'And gas is four dollars a gallon. If justice wants a ride, justice can put twenty in the tank.', 'deadpan');
        yield* w.say('riley', "Ed and Rummy got a truck. And guns. And they don't ask no questions.", 'grin');
        yield* w.say('huey', 'Those are three reasons NOT to call them.', 'scowl');
        yield* w.say('riley', "Too late. I texted 'em 'murder'. They sent back a thumbs up and a explosion.", 'smirk');
        yield* w.say('granddad', "The Wuncler boy? Good. Rich folks' grandkids can't get arrested. It's in the Constitution. Near the back.", 'grin');
      })());
      side.push(w.follow(ri, 110));
      w.bubble(gd, "And don't put my name on NOTHIN'!");
      side.push(w.also((function* () { yield 3; if (!ri.gone) w.bubble(ri, 'Ed keep a gun in the CUP HOLDER, {n}!'); })()));
      yield* w.goTo(B(w, 3100), 'WALK TO THE WUNCLER ESTATE. AGAINST YOUR BETTER JUDGMENT.');
      w.cine(true); w.look(B(w, 3210), 1.4); w.player.face = 1;
      yield* w.narr('Ed Wuncler the Third. His grandfather owns Woodcrest. The army sent him home early and asked him to stop calling it a promotion.');
      yield* w.narr("And Gin Rummy. Ed's best friend. A man who has never once been right, and never once been unsure.");
      ed.rig.setPose('cheer', 12);
      yield* w.say('ed3', 'Little Freeman! Reezy says somebody got MURDERED! That is awesome. I mean tragic. We had nothing to shoot today.', 'grin');
      ed.rig.setPose('lean', 10);
      yield* w.say('rummy', "We're in. Don't brief us. Briefings slow a man down. Just point at who did it.", 'smirk');
      yield* w.say('huey', 'Nobody knows who did it. There might be a witness at a convenience store. I need a ride. That is ALL I need.', 'scowl');
      let i = yield* w.choice('huey', 'OBJECT:', ['You have no evidence.', "You don't know who did it.", 'The guns stay here.']);
      rm.rig.setPose('pointUp', 12);
      if (i === 0) {
        yield* w.say('huey', 'You have no evidence against anybody.', 'deadpan');
        yield* w.say('rummy', "Exactly. Know who leaves no evidence? Professionals. The less we find, the better this guy is. Frankly, I'm alarmed by how little we have.", 'sly');
      } else if (i === 1) {
        yield* w.say('huey', "You don't even know who you're looking for.", 'deadpan');
        yield* w.say('rummy', "Kid, you don't chase the suspect you wish you had. You chase the one who's closest to the truck.", 'sly');
      } else {
        yield* w.say('huey', 'The guns stay here.', 'scowl');
        yield* w.say('rummy', "The guns ARE the investigation. A bullet is just a question that doesn't wait around for an answer.", 'sly');
      }
      yield* w.say('ed3', "See, that's why Rummy's the brains. I'm the money and the shooting. It's a system.", 'grin');
      i = yield* w.choice('huey', 'OBJECT AGAIN:', ["What's the exit strategy?", "What if you're wrong?", 'This is how wars start.']);
      if (i === 0) {
        yield* w.say('huey', 'What is your exit strategy?', 'deadpan');
        yield* w.say('rummy', "The exit. It's a door. There's a lit sign over it. Somebody already did the strategy.", 'smirk');
      } else if (i === 1) {
        yield* w.say('huey', "And what happens when you're wrong?", 'deadpan');
        yield* w.say('rummy', "'Wrong' is a word people use afterward. We don't stick around for afterward. Ed's grandfather has a guy for afterward.", 'smirk');
      } else {
        yield* w.say('huey', 'This is exactly how wars start.', 'scowl');
        yield* w.say('rummy', 'And how many wars have YOU started, kid? None? Then let the experienced people work. Ed was right next to one.', 'smirk');
      }
      rm.rig.setPose('armsCrossed', 10);
      yield* w.say('rummy', "Here's the timeline. We roll up. We're greeted as customers. The guy confesses. Home in six minutes. I'd go ahead and print the banner.", 'grin');
      yield* w.narr('I had asked for a ride. I had accidentally assembled a coalition.');
      yield* w.say('ed3', "Truck's rolling in ten seconds! Shotgun's taken! By a shotgun!", 'shout');
      w.cine(false);
      const truck = B(w, 4080);
      w.also(flee(w, ed, truck + 260)); w.also(flee(w, rm, truck + 300));
      w.bubble(ri, "I call the seat by the grenades!");
      w.objective('GET TO THE TRUCK BEFORE THEY LEAVE WITHOUT A CHAPERONE'); w.mark = { x: truck, y: -40 };
      if (BD.AUTOPLAY) w.place(truck, 1);
      const ok = yield* w.timed(5.5, () => w.player.x > truck - 70);
      w.mark = null; w.objective(null);
      if (!ok) yield* w.fail('They left without a chaperone. Three counties are on fire and the truck is, somehow, in a lake.');
      A().sfx('horn');
      yield* w.fadeOut(0.4);
      wipe(w, side);
    }, function* (w) {
      /* 4: the stakeout. Every button prompt is Huey preventing a shooting */
      w.setBg('street', {}); w.music('stealth', 0.5); w.place(900, 1); w.noFight = true;
      const ri = w.npc('riley', 800, { face: 1, pose: 'sit', idle: 'sit' });
      const ed = w.npc('ed3', 1010, { face: 1, prop: 'pistol', pose: 'sit', idle: 'sit', expr: 'smirk' });
      w.npc('rummy', 1120, { face: 1, pose: 'sit', idle: 'sit' });
      const side = [];
      let miss = 0;
      w.lock = true; w.look(1090, 1.3);
      const press = function* (key, label) {
        w.objective(label); A().sfx('alert');
        yield 0.4;                                          // a beat, so mashing through dialogue is not read as the answer
        const h = yield* w.qte([key], { window: 1.5, gap: 0.3 });
        w.lock = true; w.objective(null);
        if (!h) { miss++; A().sfx('bb_shot'); FX.flash(0.5, '#ffd27a'); cam.shake(0.5); }
        return h;
      };
      const huey = (pose, expr) => w.player.pose(pose, 30, expr || 'scowl');
      const rest = () => { w.player.set('idle'); ed.rig.setPose('sit', 10); ed.rig.expr = 'smirk'; };
      const walker = (variant, prop) => { const g = w.npc('guest', 1690, { face: -1, variant, prop }); side.push(w.also(flee(w, g, 380, 115, 'walk'))); return g; };
      yield* w.fadeIn(0.4);
      w.bubble(ri, 'This curb WET. These jeans is designer!');
      yield* w.narr('Ed drove. He treats a red light as a suggestion made by poorer people.');
      yield* w.narr('We parked across from the Pump-N-Munch. On the curb. Entirely on it. Rummy called that "the high ground".');
      yield* w.say('rummy', 'Textbook stakeout. We watch. We wait. We decide in advance. What do we know so far?', 'smirk');
      yield* w.say('huey', 'Nothing. A man in a golf visor ran in this direction two days ago.', 'deadpan');
      yield* w.say('rummy', "So the store's involved.", 'sly');
      yield* w.say('huey', 'That is not what I said.', 'scowl');
      yield* w.say('rummy', "It's what I heard. And I'm the one with the truck.", 'smirk');
      w.toast('WHEN A KEY APPEARS, HIT IT FAST', 4);

      let g = walker(0, 'umbrella');                        // 1: a man with an umbrella
      yield 1.3;
      ed.rig.setPose('aim', 16); ed.rig.expr = 'shout';
      yield* w.say('ed3', "CONTACT! Twelve o'clock! Long dark object! That's a rifle! That is DEFINITELY a rifle!", 'shout');
      if (yield* press('light', 'SLAP THE BARREL DOWN')) { huey('jab'); A().sfx('slap'); w.bubble(g, 'Evening, fellas! Wet one, huh?'); }
      else w.bubble(g, 'MY UMBRELLA! WHY?!');
      yield 0.6; rest();
      yield* w.say('huey', "It's an umbrella. It is raining.", 'deadpan');
      yield* w.say('rummy', "Which is exactly when I'd disguise a rifle as an umbrella. Stay sharp.", 'sly');

      g = walker(1, 'purse');                               // 2: a grandmother with a handbag
      yield 1.3;
      yield* w.say('rummy', "Female. Sixties. Oversized handbag. Ask yourself what's IN the handbag.", 'sly');
      ed.rig.setPose('stance', 16); ed.rig.expr = 'shout';
      yield* w.say('ed3', "The body. No, wait. The LEAF BLOWER. No. A smaller body! I'm going in!", 'shout');
      if (yield* press('guard', 'BLOCK ED BEFORE HE GETS UP')) { huey('guard'); A().sfx('block'); w.bubble(g, 'So nice to see young men out in the community!'); }
      else w.bubble(g, 'I have a WHISTLE and a NEPHEW, sonny!');
      yield 0.6; rest();
      yield* w.say('huey', 'She is carrying yarn. I can see the yarn. It is sticking out.', 'deadpan');
      yield* w.say('rummy', "Then that's what she WANTS you to see.", 'smirk');

      ri.rig.setPose('point', 12);                          // 3: Riley asks nicely
      yield* w.say('riley', "Ay, Ed. Lemme hold the strap. I won't shoot nobody important.", 'grin');
      yield* w.say('ed3', "Sure thing, little man! Safety's off, so it's ready to go!", 'grin');
      if (yield* press('dash', 'INTERCEPT THE HANDOFF')) { huey('dash'); A().sfx('dash'); w.bubble(ri, "You a hatin'-ass {n}, Huey!"); }
      else w.bubble(ri, 'YOUNG REEZY! BLAOW! ...My bad, sky.');
      yield 0.6; rest(); ri.rig.setPose('sit', 10);
      yield* w.say('huey', 'He is EIGHT.', 'scowl');
      yield* w.say('ed3', 'I had a gun at eight. And a boat. And a lawyer. I turned out fine.', 'smirk');

      yield* w.say('ed3', 'Man, stakeouts are BORING. Watch this. I can spin it on my finger like a cowboy.', 'grin');
      ed.rig.setPose('pointUp', 16);                        // 4: the cowboy spin
      if (yield* press('jump', 'GET YOUR FEET OFF THE GROUND')) huey('jump'); else huey('hurt', 'pain');
      A().sfx('bb_shot'); FX.spark(w.player.x + 10, 0, 6, '#ffd27a', 220); cam.shake(0.3);
      w.bubble(ed, 'My bad! It does that!');
      yield 0.7; rest();
      yield* w.say('rummy', "'Accidental discharge' is such a negative phrase. I prefer 'unscheduled results'.", 'smirk');

      const ck = w.npc('guest', 1700, { face: -1, variant: 2 });   // 5: the clerk takes out the trash
      side.push(w.also((function* () { yield* w.walk(ck, 1480, 110, 'walk'); yield 7; yield* flee(w, ck, 1760, 110, 'walk'); })()));
      yield 1.4;
      yield* w.say('rummy', 'There. Front door. Male. Carrying a bag. Disposing of evidence in broad streetlight.', 'sly');
      ed.rig.setPose('aim', 16); ed.rig.expr = 'grin';
      yield* w.say('ed3', "That's our guy. I can feel it in my trigger finger. It's, like, tingling.", 'grin');
      if (yield* press('heavy', 'KICK THE GUN AT THE SKY')) { huey('riseKick'); A().sfx('bb_shot'); A().sfx('thunder'); FX.flash(0.5); w.bubble(ck, 'The hell was that? ...I hate this shift.'); }
      else w.bubble(ck, 'NOT THE SIGN! I just changed them bulbs!');
      yield 0.7; rest();
      yield* w.say('huey', 'He WORKS there. He is taking out the trash. That is the job.', 'scowl');
      yield* w.say('rummy', "He stands behind a counter eight hours a day. What's a man hiding, that he needs a whole counter?", 'sly');
      yield* w.say('ed3', "And he's got a mop in there. That's basically a spear.", 'shock');
      yield* w.say('rummy', 'Gentlemen, we have our suspect.', 'grin');
      yield* w.say('huey', 'You have a CASHIER. The man we want wears a golf visor. This one is wearing a name tag.', 'scowl');
      yield* w.say('rummy', "A name tag. So he's using an alias. Kid, you walk into the store with the suspect you've got.", 'smirk');
      if (miss >= 3) yield* w.fail('Ed opened fire on an umbrella, a grandmother and the moon. Rummy called it "shaping the battlefield".');
      yield* w.say('riley', "Can a {n} get some snacks first? I ain't doin' no standoff on a empty stomach.", 'smirk');
      yield* w.say('ed3', 'SNACK RUN! Then justice. Rummy, you want the jerky or the other jerky?', 'grin');
      yield* w.narr('That is how a snack run became a military operation. Nobody voted on it. Nobody ever does.');
      yield* w.fadeOut(0.4);
      w.lock = false; wipe(w, side);
    }, function* (w) {
      /* 5: the snack run. The clerk has the killer's name; the coalition arrives before he can fetch it */
      w.setBg('lot'); w.music('stealth', 0.3); w.noFight = true;
      const X = P(w, 1800), step = w.def.raidStep || 0;
      w.place(X - 700, 1);
      const ck = w.npc('guest', X, { face: -1, variant: 2, pose: 'lean' });
      const crowd = step > 1 ? [] : [w.npc('guest', X - 560, { face: 1, variant: 0, prop: 'purse' }), w.npc('guest', X - 390, { face: 1, variant: 1 }), w.npc('guest', X + 380, { face: -1, variant: 1, prop: 'umbrella' })];
      let ed, rm;
      const raid = () => {
        ed = w.npc('ed3', X + 170, { face: -1, prop: 'pistol', pose: 'aim', idle: 'aim', expr: 'grin' });
        rm = w.npc('rummy', X - 230, { face: 1, pose: 'point', expr: 'smirk' });
        ck.rig.setPose('cower', 14); ck.rig.expr = 'shock';
        for (const b of crowd) { b.rig.setPose('cower', 14); b.rig.expr = 'shock'; }
      };
      yield* w.fadeIn(0.3);
      if (step < 1) {
        w.bubble(crowd[1], "It's the Freeman boy. Act normal. ACT NORMAL.");
        yield* w.narr('I got to the counter first. I had about two minutes before the coalition finished arguing over who got to carry the big gun.');
        yield* w.talk(ck, 'QUESTION THE CLERK BEFORE THE COALITION ARRIVES', (function* () {
          yield* clerk(w, "Welcome to Pump-N-Munch. Slush machine's broke. Bathroom's for customers. And if you're selling candy for your school, so is my nephew.", 'deadpan');
          yield* w.say('huey', 'Two mornings ago. A man in khakis and a golf visor, carrying a leaf blower. Did he come in here?', 'deadpan');
          yield* clerk(w, "Kid, that's every customer I've got. They buy a sports drink, call me 'chief' and ask if we validate parking. It's a gas station.", 'scowl');
          yield* clerk(w, "...There WAS one. Shaking. Bought bleach, a tarp and a 'World's Okayest Neighbor' mug. Used a rewards card. His name's on the register tape.", 'neutral');
          yield* w.say('huey', 'You have his NAME?', 'shock');
          yield* clerk(w, 'In the back. Give me one minute.', 'neutral');
          A().sfx('crash'); cam.shake(0.7); FX.flash(0.6);
          raid();
          yield* w.say('ed3', "NOBODY MOVE! This is a snack run AND a citizen's arrest!", 'shout');
          yield* w.say('rummy', 'Hands off the counter! Step away from the mop! The mop stays where I can see it!', 'shout');
          yield* clerk(w, 'Oh, come ON. AGAIN?! Take the jerky, man! Everybody always wants the damn jerky!', 'shout');
          yield* w.say('huey', "He was about to hand me the killer's NAME!", 'shout');
          yield* w.say('rummy', 'Of course he was. Textbook misdirection. Guilty men love paperwork.', 'sly');
          yield* w.say('ed3', "He's reaching for something!", 'shout');
          yield* clerk(w, "I'm reaching for the SKY! This is the sky! I am doing the thing you people ask for!", 'shock');
          yield* w.say('rummy', "And he's suspiciously good at it. He has done this before.", 'sly');
          yield* w.say('ed3', "Everybody's got till I count to three to confess! Then I start... you know. Investigating.", 'grin');
        })());
        w.def.raidStep = 1;
      } else raid();
      if (step < 2) {
        /* timed scramble: walk up to each bystander to shoo them out of the line of fire */
        const cries = ['I only came in for gum!', "I'm leaving a one-star review!", 'Is this a hate crime or a regular one?!'];
        let out = 0;
        const shoo = (b, i) => { b.fled = true; out++; w.bubble(b, cries[i]); A().sfx('ui_select', { vol: 0.5 }); w.also(flee(w, b, b.x < X ? w.minX - 300 : w.maxX + 300)); };
        const count = w.also((function* () {
          const seq = [[ed, 'ONE!'], [ed, 'TWO!'], [ed, '...Rummy, what comes after two?'], [rm, 'Three is a mindset, Ed. Commit to it.'], [ck, 'I make nine dollars an hour!'], [ed, 'TWO AND A HALF!'], [rm, 'No rush. Deadlines are for the unsure.'], [ed, 'TWO AND THREE QUARTERS!']];
          for (const [f, s] of seq) { yield 1.4; w.bubble(f, s); }
        })());
        w.objective('GET THE BYSTANDERS OUT BEFORE ED FINISHES COUNTING'); w.toast('RUN UP TO EACH BYSTANDER TO SHOO THEM OUT', 5);
        const ok = yield* w.timed(12, () => {
          crowd.forEach((b, i) => { if (!b.fled && Math.abs(w.player.x - b.x) < 80) shoo(b, i); });
          const nx = crowd.find((b) => !b.fled);
          w.objN = crowd.length - out; w.mark = nx ? { x: nx.x, y: -nx.hh - 34 } : null;
          return out >= crowd.length;
        });
        if (BD.AUTOPLAY) crowd.forEach((b, i) => { if (!b.fled) shoo(b, i); });
        count.stop(); w.mark = null; w.objective(null);
        if (!ok) yield* w.fail('Ed got to three. Nobody was more surprised than Ed.');
        w.def.raidStep = 2;
      }
      if (step < 3) {
        rm.face = w.player.x > rm.x ? 1 : -1; w.player.face = -rm.face;
        w.cine(true); w.look((rm.x + w.player.x) / 2, 1.4);
        w.player.pose('point', 12, 'scowl');
        yield* w.say('huey', 'Put the guns down. Both of you. He sells beef jerky. He is not the Leaf Blower Killer.', 'scowl');
        rm.rig.setPose('pointUp', 12);
        yield* w.say('rummy', "Can you prove he isn't? No? Then until somebody shows me proof he didn't, the smart money says he did.", 'sly');
        yield* w.say('huey', 'That is not how proof works. That is bullshit in a blazer.', 'shout');
        yield* w.say('rummy', "Kid, I respect dissent. It's healthy. I'm just going to overrule it. Physically.", 'smirk');
        w.cine(false);
        w.def.raidStep = 3;
      }
      rm.gone = true; w.noFight = false; w.music('duel', 0.8);
      const boss = w.foe('rummy', rm.x, { hp: 180, boss: true, ai: rummyAI, title: 'NEVER RIGHT. NEVER UNSURE.', speed: 220, idle: 'stance', expr: 'smirk', block: 0.2 });
      const cheer = w.chatter(ed, ["Get him, Rummy! I'm covering the mop!", 'Nobody touch the nachos! Evidence!', 'This is going GREAT!', 'Rummy took a seminar on this!', 'Should I shoot? I feel like I should shoot!'], 3000);
      w.toast('A RED "!" CANNOT BE BLOCKED. DASH OUT OF IT.', 6);
      yield* w.duel(boss, { banner: 'OVERRULED!', ko: 'OUT-ARGUED.' });
      cheer.stop();
      w.bubble(boss, 'I meant to do that. Write that down.');
      yield 1.4;
      w.def.raidStep = 0;
      yield* w.fadeOut(0.4);
      wipe(w);
    }, function* (w) {
      /* 6: the money and the shooting. Parry the pellets back at him */
      w.setBg('lot'); w.music('duel', 0.9); w.noFight = false;
      const X = P(w, 1800);
      w.place(X - 560, 1);
      const ck = w.npc('guest', X + 150, { face: -1, variant: 2, pose: 'cower', expr: 'shock' });
      const rm = w.npc('rummy', X - 960, { face: 1, pose: 'sit', expr: 'pain' });
      const edN = w.npc('ed3', X - 90, { face: -1, prop: 'pistol', pose: 'aim', expr: 'shock' });
      w.minX = X - 870; w.maxX = X + 40;
      yield* w.fadeIn(0.3);
      if (!w.def.edTalk) {
        w.def.edTalk = true;
        w.cine(true); w.look(X - 330, 1.35);
        yield* w.say('ed3', 'Holy shit! You hit Rummy! He is a civilian contractor!', 'shock');
        yield* w.say('rummy', "I'm fine, Ed. This is a tactical lie-down. Stay the course. We are turning a corner.", 'pain');
        w.player.pose('point', 12, 'scowl');
        yield* w.say('huey', 'Give me the gun, Ed.', 'scowl');
        yield* w.say('ed3', "No way! I'm LIBERATING this store! These people are gonna thank me! There's gonna be, like, a parade, with the little flags!", 'grin');
        yield* clerk(w, "Nobody's gonna thank you, jackass! That slush machine was already broke and you STILL shot it!", 'shout');
        yield* w.say('ed3', "See? He's already talking. It's working.", 'smirk');
        w.cine(false);
      }
      edN.gone = true;
      const boss = w.foe('ed3', edN.x, { hp: 230, boss: true, ai: edAI, prop: 'pistol', title: 'THE MONEY AND THE SHOOTING', speed: 300, idle: 'aim', expr: 'grin', downT: 0.5 });
      const banter = w.also((function* () {
        const seq = [[rm, "We're winning, Ed! We'll define winning later!"], [ck, 'Not the nachos! NOT THE NACHOS!'], [rm, 'Nobody could have predicted the kid would hit back!'], [ck, 'I am calling corporate! They will not care!'],
          [rm, "That's not a retreat, Ed! It's a redeployment!"], [ck, 'Nine dollars an hour, man!'], [rm, "History will say we were right! I'll write it myself!"]];
        for (let i = 0; ; i++) { yield U.rand(5, 8); const [f, s] = seq[i % seq.length]; if (!w.cineOn && !w.dlg) w.bubble(f, s); }
      })());
      w.bubble(ck, 'Take it OUTSIDE! ...Take it FURTHER outside!');
      w.toast('L JUST BEFORE A PELLET LANDS: PARRY IT BACK AT HIM', 7);
      yield* w.duel(boss, { banner: 'DISARM ED III!', ko: 'MISSION ACCOMPLISHED.' });
      banter.stop(); w.def.edTalk = false;
    }],
    *outro(w) {
      /* the real killer walks in for more bleach; the police arrive and thank the wrong people */
      yield* w.fadeOut(0.3);
      wipe(w);
      w.setBg('lot'); w.music('stealth', 0.1);
      const X = P(w, 1800);
      w.place(X - 260, 1);
      const ck = w.npc('guest', X + 150, { face: -1, variant: 2, pose: 'facepalm' });
      const ed = w.npc('ed3', X - 110, { face: -1, pose: 'sit', expr: 'pain' }), rm = w.npc('rummy', X - 700, { face: 1, pose: 'sit', expr: 'pain' });
      const kl = w.npc('guest', X - 1150, { face: 1, variant: 0 }), po = w.npc('guard', X - 1500, { face: 1 });
      w.look(X - 330, 1.3);
      w.player.pose('armsCrossed', 10, 'scowl');
      yield* w.fadeIn(0.4);
      A().sfx('bb_shot'); A().sfx('glass'); cam.shake(0.5);
      yield* w.narr('The pistol hit the floor and went off one last time. It took out the WET FLOOR sign. Nobody had used a safety on anything all night.');
      yield* w.walk(kl, X - 480, 170, 'walk');
      yield* as(w, 'guest', 'Neighbor', 'Evening! Just need more bleach, and maybe a second tarp, and... oh. Oh no. Guns.', 'shock');
      kl.rig.setPose('cower', 14); kl.rig.expr = 'shock';
      yield* as(w, 'guest', 'Neighbor', 'Okay. OKAY! You got me! I did it! I killed Gary! Tell them I came quietly!', 'shout');
      w.player.face = -1; w.player.pose('point', 12, 'shock');
      yield* w.say('huey', '...You. You told me the man you saw looked like Tom.', 'shock');
      yield* as(w, 'guest', 'Neighbor', "I PANICKED! It's the first thing anybody says! And it WORKED! It worked in, like, an hour!", 'shout');
      yield* as(w, 'guest', 'Neighbor', 'He ran that leaf blower at seven a.m. EVERY Saturday! I left notes! LAMINATED notes! Any jury on my cul-de-sac would have done the same!', 'angry');
      ck.rig.setPose('point', 12);
      yield* clerk(w, "That's him. That's rewards card guy. He still owes me for the mug.", 'deadpan');
      yield* w.narr('The Leaf Blower Killer. Khakis. Golf visor. He had walked past eleven police officers that week. One of them helped him carry the tarp to his car.');
      A().sfx('alert');
      w.bubble(kl, 'I have a lawyer! He golfs with the judge!');
      yield* w.walk(po, X - 640, 340, 'run');
      yield* cop(w, "POLICE! Nobody mo... oh. Mr. Wuncler. Sir. Is this your crime scene? It's lovely. Very thorough.", 'shock');
      ed.rig.setPose('cheer', 12); ed.rig.expr = 'grin';
      yield* w.say('ed3', "We totally caught the guy. He's right there. He said it and everything.", 'grin');
      rm.rig.setPose('pointUp', 12); rm.rig.expr = 'smirk';
      yield* w.say('rummy', "Intelligence-led operation, officer. In and out. Surgical. You'll want to write down 'surgical'.", 'smirk');
      w.player.face = -1; w.player.pose('point', 12, 'angry');
      yield* w.say('huey', 'They held up a store! They held a cashier at gunpoint for owning a mop! The killer wandered in for bleach and confessed to a slush machine!', 'shout');
      yield* cop(w, "Son, I'm gonna need you to lower your voice. And I'm gonna need the cashier to come downtown. He fits a description.", 'scowl');
      yield* clerk(w, 'A description of WHAT?!', 'shout');
      yield* cop(w, "We'll have one by Monday.", 'deadpan');
      yield* w.fadeOut(0.5);
      wipe(w);

      w.setBg('block'); w.music('garden', 0.2); w.place(B(w, 1300), 1);
      const tom = w.npc('tom', B(w, 1900), { face: -1 }), jaz = w.npc('jazmine', B(w, 1440), { face: 1, pose: 'cheer' });
      w.look(B(w, 1420), 1.4);
      w.player.pose('stand', 10, 'deadpan');
      yield* w.fadeIn(0.5);
      yield* w.narr('They released Tom that night. He had served five hours of a weekend.');
      w.bubble(jaz, 'DADDY! You smell like a bench!');
      yield* w.walk(tom, B(w, 1560), 260, 'run');
      tom.rig.setPose('cheer', 12);
      yield* w.say('tom', "I'm out! I'm FREE! Five hours inside and I never had to shower once! I'm a survivor, Huey!", 'grin');
      yield* w.say('huey', 'What happened with your cellmate?', 'deadpan');
      tom.rig.setPose('shrug', 12);
      yield* w.say('tom', 'Dennis? Dental hygienist. Unpaid parking tickets. He just wanted somebody to split a sandwich with. I screamed at him for five hours.', 'worry');
      yield* w.say('tom', 'I owe that man an apology. And the bench. I said some things to the bench.', 'worry');
      yield* w.say('jazmine', 'Daddy, are you still going to put people in the bad place?', 'worry');
      tom.rig.setPose('handsHips', 12);
      yield* w.say('tom', "Of course, sweetie. Monday morning, nine sharp. Daddy's very good at it.", 'grin');
      yield* w.narr('Tom learned nothing. In fairness, nobody had asked him to.');
      yield* w.fadeOut(0.5);
      wipe(w);

      w.setBg('block'); w.music('credits', 0.3); w.place(B(w, 2900), 1);
      w.npc('ed3', B(w, 3230), { face: -1, pose: 'cheer', expr: 'grin' });
      const rm2 = w.npc('rummy', B(w, 3340), { face: -1, pose: 'armsCrossed', expr: 'smirk' });
      w.npc('guest', B(w, 3110), { face: 1, variant: 1, prop: 'mic', pose: 'hold' });
      const ru = w.npc('ruckus', B(w, 3460), { face: -1, pose: 'cheer' });
      w.npc('guest', B(w, 3560), { face: -1, variant: 2, pose: 'cheer' }); w.npc('tux', B(w, 3650), { face: -1, pose: 'cheer' });
      const ri = w.npc('riley', B(w, 2790), { face: 1, pose: 'lean' }); w.npc('granddad', B(w, 2680), { face: 1, pose: 'handsHips' });
      w.look(B(w, 3170), 1.25);
      w.player.pose('armsCrossed', 10, 'scowl');
      yield* w.fadeIn(0.5);
      A().sfx('crowd');
      yield* as(w, 'guest', 'News Anchor', 'Tonight, Woodcrest salutes two local heroes who, acting on instinct alone, cracked the Leaf Blower murder. Gentlemen, how did you do it?', 'grin');
      rm2.rig.setPose('pointUp', 12);
      yield* w.say('rummy', "People ask if we had a plan. Plans are for men who aren't sure. We were sure the whole time. We just weren't sure of what.", 'smirk');
      yield* w.say('ed3', "I'd like to thank my grandfather, my gun, and that store, for being where the guy was.", 'grin');
      w.bubble(ru, 'HIP HIP! ...Y\'all supposed to say hooray!');
      yield* w.say('ruckus', "Three cheers for young Mister Wuncler! A HERO! I'd salute, but I ain't earned the right to lift my arm that high!", 'grin');
      A().sfx('clap');
      yield* w.say('riley', "Low key, that shit was gangsta. They got a parade AND they ain't snitch. Killer told on hisself.", 'grin');
      yield* w.say('granddad', "See? Everything worked out. And I didn't spend one dime on gas.", 'grin');
      w.player.face = -1;
      yield* w.say('huey', 'They were wrong about everything. Every single thing. They were wrong the entire time.', 'scowl');
      ri.rig.setPose('shrug', 12);
      yield* w.say('riley', 'And they got a PARADE, {n}. So who really wrong?', 'smirk');
      w.player.face = 1; w.player.pose('armsCrossed', 10, 'deadpan');
      yield* w.narr('Ed and Rummy got a plaque, a parade and a segment on the morning show. The clerk got six hours in a cell and a bill for the slush machine.');
      yield* w.narr('Nobody asked how they found the killer. When it works, nobody ever asks. That is the most dangerous thing about it working.');
    },
  });
})();
