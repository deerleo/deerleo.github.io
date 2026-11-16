/* dinner.js — GUESS HOE'S COMING TO DINNER: errands, a billed dinner, a tail, a failed intervention, a phone tree, collections, an exit interview */
(() => {
  'use strict';
  const BD = window.BD, U = BD.U, FX = BD.FX, L = BD.Lib;
  const A = () => BD.Audio;

  /** a charge floats up off whoever is paying */
  const fee = (f, s, col) => { FX.text(f.x, f.y - f.hh - 56, s, col || '#8fe07a'); A().sfx('stamp'); };
  /** a choice where Huey says the line and every option gets its own reaction: opts = [[option, [[who, line, expr], ...]], ...] */
  function* pick(w, prompt, opts) {
    const i = yield* w.choice('huey', prompt, opts.map((o) => o[0]));
    yield* w.say('huey', opts[i][0], 'deadpan');
    for (const r of opts[i][1]) yield* w.say(r[0], r[1], r[2]);
    return i;
  }

  /* ------------------------------------------------ the tail (phase 3) */
  function* stroll(w, gd, cr, x, fl) {
    gd.face = cr.face = 1; gd.state = cr.state = 'act';
    gd.rig.setCycle('walk', 7); cr.rig.setCycle('walk', 7);
    yield () => { if (fl.caught) return false; gd.x += 105 * w.dt; cr.x = gd.x + 74; return gd.x >= x; };
    gd.rig.setPose(gd.idlePose, 10); cr.rig.setPose(cr.idlePose, 10);
  }
  /** the happy couple shops its way across the lot; Granddad turns right round once per leg */
  function* couple(w, gd, cr, S, exit, fl) {
    yield 1.5;
    for (let i = 0; i < S.length; i++) {
      const s = S[i];
      yield* stroll(w, gd, cr, (gd.x + s.x) / 2, fl);
      gd.rig.setPose('think', 12); w.bubble(gd, s.look); A().sfx('detect');   // the warning beat
      yield 0.9;
      gd.face = -1; gd.rig.setPose('handsHips', 12); gd.rig.expr = 'scowl'; fl.look = true;
      yield 1.7;
      fl.look = false; gd.face = 1; gd.rig.expr = 'grin';
      yield* stroll(w, gd, cr, s.x, fl);
      cr.rig.setPose('point', 12); w.bubble(cr, s.cr);
      yield 2.6;
      gd.rig.setPose('cheer', 12); w.bubble(gd, s.gd); fee(gd, s.tag, '#ff7a6a');
      yield 2.4;
      fl.left = i + 1;
    }
    yield* stroll(w, gd, cr, exit, fl);
    fl.done = true;
  }
  /** detection: too close at any time, or standing in the open when he looks back. Ducking (S) hides you. */
  function* watch(w, gd, fl) {
    const p = w.player;
    for (;;) {
      const dx = gd.x - p.x, hid = p.state === 'crouch';
      let s = 0;
      if (!BD.AUTOPLAY && !fl.done && !w.cineOn) { if (fl.look && dx > 0 && dx < 420 && !hid) s = 1.2; else if (Math.abs(dx) < 150) s = 1; }
      w.beams.length = 0;
      if (fl.look) w.beams.push({ x: gd.x - 46, y: gd.y - 118, dir: -1, len: 420, hot: s > 0 });
      w.alert = U.clamp(w.alert + (s > 0 ? s * 1.5 : -0.7) * w.dt, 0, 1);
      if (w.alert >= 1) break;
      yield;
    }
    fl.caught = true; w.beams.length = 0;
    gd.face = p.x < gd.x ? -1 : 1; gd.rig.setPose('point', 14); gd.rig.expr = 'shout';
    w.bubble(gd, `HUEY?! You FOLLOWED me?!`); A().sfx('alert');
    yield 1.3;
    yield* w.fail(`Granddad: "You tailed me to the MALL? I'm whooping you in the food court. Publicly. By the pretzels."`);
  }

  /* ------------------------------------------ the associates (phase 6) */
  const WRITEUP = L.E({ poses: ['overW', 'over'], wind: 0.6, rec: 0.6, dmg: 11, reach: 150, down: true, sfx: 'whoosh_heavy', arc: [-2.2, 0.4, 62], arcY: 0.7 });
  const HR_BARKS = ['THIS IS GOING IN YOUR FILE!', 'SIR, YOU ARE IN ARREARS!', 'PER MY LAST PUNCH!', 'I HAVE A DEGREE IN THIS!'];
  function* hrAI(f) {
    yield* f.idleFor(U.rand(0.4, 0.8));
    if (Math.random() < 0.3) L.bark(f, U.pick(HR_BARKS), '#e8c33a');
    yield* f.approach(132, 2.5, 160);
    if (f.dist() > 176) return;
    const r = Math.random();
    if (r < 0.35) yield* f.strike(L.SLAM);
    else { yield* f.strike(L.SHOVE); if (r > 0.65) yield* f.strike(WRITEUP); }
    yield* f.idleFor(0.6);
  }

  BD.episode({
    id: 'dinner', title: 'GUESS HOE\'S COMING TO DINNER', src: 'inspired by Season 1, Episode 3', bg: 'house',
    blurb: 'Granddad has a new girlfriend a third of his age, and she itemises. Huey gathers evidence, loses the argument, and calls her manager: A Pimp Named Slickback.',
    loss: 'A Pimp Named Slickback: "Somebody get this child an ice pack and a form. Bill the grandfather."',
    *intro(w) {
      w.def.lot = w.def.hr = false;
      w.setBg('house', { dark: 0, ghost: 0, flash: 0 }); w.music('house', 0.2); w.place(620, 1);
      const gd = w.npc('granddad', 800, { face: -1, pose: 'handsHips', expr: 'grin' }), ri = w.npc('riley', 470, { face: 1, pose: 'lean' });
      w.look(640, 1.4);
      yield* w.narr(`Granddad discovered online dating this spring. The internet has not known peace since.`);
      yield* w.narr(`His profile says he is fifty-one, six foot two, and marched at Selma. One of those is a typo. The other two are lies.`);
      gd.rig.setPose('cheer', 12);
      yield* w.say('granddad', `Boys! Clear your schedules and hide your ugly. Tonight your granddaddy has a DATE. Her name is Cristal.`, 'grin');
      gd.rig.setPose('handsHips', 12);
      yield* w.say('granddad', `Like the champagne. She told me that herself. Twice. Then she told me what a bottle costs.`, 'grin');
      yield* w.say('riley', `Lemme see the picture. ...DAMN, Granddad. She like twenty-five. You got SOCKS older than her.`, 'shock');
      yield* w.say('granddad', `Age ain't nothing but a number, and my number gets a senior discount. She loves me for my personality.`, 'smirk');
      w.player.pose('armsCrossed', 12, 'deadpan');
      yield* w.say('huey', `Her profile lists her interests as "generous gentlemen, direct deposit and no questions". That is not a personality. That is a rate card.`, 'deadpan');
      yield* w.say('granddad', `That's hater shit, Huey. I can smell it on you. Smells like jealousy and library books.`, 'scowl');
      yield* w.say('riley', `I ain't hatin'. I'm takin' NOTES. Shorty got a whole business model, and Granddad the pilot programme.`, 'grin');
      yield* w.say('huey', `She is going to rob you. Politely, with a smile. And you are going to thank her.`, 'deadpan');
      gd.rig.setPose('point', 14);
      yield* w.say('granddad', `{N}, I been robbed by the government for seventy years and it never ONCE wore a dress like that. Now get your little asses ready.`, 'scowl');
      yield* w.narr(`I saw a professional. Riley saw a mentor. Granddad saw his soulmate. Only one of us was wrong, and he was the one holding the credit card.`);
      yield* w.fadeOut(0.3);
      gd.gone = ri.gone = true;
    },
    phases: [function* (w) {
      /* 1. THE PREP: three errands for one old man's vanity */
      w.setBg('house', { dark: 0 }); w.music('house', 0.4); w.place(300, 1); w.noFight = true;
      const gd = w.npc('granddad', 760, { face: 1, pose: 'handsHips', expr: 'grin' }), ri = w.npc('riley', 190, { face: 1 });
      w.follow(ri, 110);
      w.chatter(gd, [`That ain't grey. That's PLATINUM.`, `Fifty-one. I could pass for fifty-one.`, `Suck it in, Robert. Hold it. HOLD it.`, `"Kind eyes and a strong credit score." She SAID that.`], 700);
      yield* w.fadeIn(0.3);
      yield* w.talk(gd, 'SEE WHAT GRANDDAD WANTS', (function* () {
        yield* w.say('granddad', `Huey! Make yourself useful. I need my cologne off the shelf, my GOOD teeth out the kitchen, and the coffee can from under my bed.`, 'grin');
        yield* w.say('huey', `You have a bad set of teeth?`, 'deadpan');
        yield* w.say('granddad', `I got everyday teeth and I got OCCASION teeth. The occasion teeth got a gold one in the back. Don't you touch the gold one.`, 'scowl');
        yield* w.say('riley', `What's in the coffee can?`, 'smirk');
        yield* w.say('granddad', `My funeral fund. Fourteen hundred dollars. I ain't dying this week, so tonight it's a romance fund. Now move your ass, before I get old.`, 'grin');
      })());
      w.toast('SPACE TO JUMP. THE COFFEE CAN IS UP ON THE LANDING.', 6);
      yield* w.collect([
        { x: 330, name: 'COLOGNE', col: '#9fe8ff', on() { w.bubble(ri, `"Stallion Musk." Expired 1987. It got a HORSE on it.`); } },
        { x: 1060, name: 'THE GOOD TEETH', col: '#f2f0ea', on() { w.bubble(ri, `They in a jar, SMILIN' at me. Hell no.`); } },
        { x: 1450, y: -210, name: 'FUNERAL FUND', col: '#8fe07a', on() { w.bubble(ri, `Can light as hell. Ain't no fourteen hundred in here.`); } },
      ], 'FETCH THE COLOGNE, THE GOOD TEETH AND THE COFFEE CAN');
      yield* w.talk(gd, 'BRING IT ALL BACK TO GRANDDAD', (function* () {
        A().sfx('whoosh'); gd.rig.setPose('cheer', 12);
        yield* w.say('granddad', `Three sprays. Neck, wrists, and one in the air to walk through like a gentleman. Whoo! That's got a KICK.`, 'grin');
        yield* w.say('huey', `That bottle predates the Voting Rights Act.`, 'deadpan');
        gd.rig.setPose('hold', 12); fee(gd, 'FUNERAL FUND: $900', '#ff7a6a');
        yield* w.say('granddad', `So do I, and I still work. Give me the can. ...NINE hundred? There was fourteen hundred in here!`, 'shock');
        gd.rig.setPose('think', 12);
        yield* w.say('granddad', `Oh. Right. The flowers. The teeth whitening. And her deposit.`, 'neutral');
        yield* w.say('huey', `Her deposit.`, 'deadpan');
        gd.rig.setPose('handsHips', 12);
        yield* w.say('granddad', `For the DATE, Huey. She requires a deposit. That's how you know a woman is serious about commitment.`, 'grin');
        yield* pick(w, 'TELL GRANDDAD THE TRUTH', [
          [`Soulmates don't take deposits.`, [['granddad', `Everything worth having takes a deposit, boy. Apartments. Tuxedos. Bail.`, 'smirk']]],
          [`She's a professional. You are the job.`, [['granddad', `A professional WHAT? Model? I know. She told me modelling don't pay like it used to, bless her heart.`, 'grin']]],
          [`You could just set the can on fire.`, [['granddad', `Fire don't call me "Big Daddy Robert". Fire is FREE, and you get what you pay for.`, 'scowl']]],
        ]);
        yield* w.say('riley', `A deposit AND a cancellation fee? Granddad, that ain't a girlfriend, {n}. That's a franchise. I'm inspired.`, 'grin');
        gd.rig.setPose('point', 14);
        yield* w.say('granddad', `Out my mirror, both of you. Embarrass me tonight and I'll whoop your asses in courses. Appetiser, entree, and a little something sweet at the end.`, 'scowl');
        A().sfx('bell');
        yield* w.narr(`The doorbell rang at seven o'clock exactly. Professionals are punctual.`);
      })());
      yield* w.fadeOut(0.4);
    }, function* (w) {
      /* 2. DINNER: everything is billable, and every objection is overruled */
      w.setBg('house', { dark: 0 }); w.music('house', 0.5); w.place(640, 1); w.noFight = true;
      const p = w.player;
      const gd = w.npc('granddad', 860, { face: -1, pose: 'handsHips', expr: 'grin' }), ri = w.npc('riley', 520, { face: 1, pose: 'lean' });
      const cr = w.npc('cristal', -60, { face: 1 });
      yield* w.fadeIn(0.3);
      w.cine(true); w.look(700, 1.35); p.face = -1;
      yield* w.walk(cr, 740, 150, 'walk');
      gd.rig.setPose('cheer', 12); p.face = 1;
      yield* w.say('cristal', `Robert! Look at you. You look like money. I mean that as a compliment and as an estimate.`, 'smirk');
      yield* w.say('granddad', `Cristal, baby! These are my grandsons. Ignore them. I do.`, 'grin');
      cr.face = -1;
      yield* w.say('cristal', `Hi, babies. Auntie Cristal don't do children. Children are a separate package, and he can't afford it.`, 'smirk');
      cr.face = 1; fee(gd, 'ARRIVAL  -$150');
      yield* w.say('cristal', `That's one-fifty for arrival, Robert. Door to door. I walked your whole driveway in these heels.`, 'neutral');
      gd.rig.setPose('handsHips', 12);
      yield* w.say('granddad', `So honest! You hear that, boys? Communication. That's what a relationship is built on.`, 'grin');
      w.bubble(ri, `Note: charge for WALKIN'.`);
      yield* w.say('huey', `She invoiced you for walking.`, 'deadpan');
      yield* w.say('granddad', `I cooked, baby. Slaved all day. Old family recipe.`, 'grin');
      yield* w.say('huey', `The bag from Wings & Regrets is still in the trash.`, 'deadpan');
      gd.rig.setPose('point', 14);
      yield* w.say('granddad', `And YOU gon' be in there with it. I will beat your narrow ass with the ladle AND the bag.`, 'scowl');
      cr.rig.setPose('cheer', 12); fee(gd, 'LAUGH  -$20');
      yield* w.say('cristal', `HA! Oh, Robert. You are too much.`, 'grin');
      cr.rig.setPose('handsHips', 12);
      yield* w.say('cristal', `That one's twenty. The real laugh, with my hand on your arm, is forty. I'll tell you when you've earned it.`, 'smirk');
      gd.rig.setPose('cheer', 12); w.bubble(ri, `She got a PRICE LIST for laughin'.`);
      yield* w.say('granddad', `She got LEVELS! I'm getting the forty. Watch me. Cristal, did I ever tell you how I integrated a lunch counter?`, 'grin');
      fee(gd, 'LISTENING  -$150');
      yield* w.say('cristal', `Ooh, a story. Listening is seventy-five an hour, two-hour minimum, eye contact included. Go on, baby. I'm riveted.`, 'smirk');
      gd.rig.setPose('pointUp', 12);
      yield* w.say('granddad', `So it's 1960. I walk in. I sit down. I order the meatloaf. And I look that man dead in his eye, and I say...`, 'neutral');
      yield* w.say('huey', `Last time it was 1957 and you ordered pie.`, 'deadpan');
      yield* w.say('granddad', `{N}, it was a LONG protest! A man gets hungry twice!`, 'shout');
      yield* pick(w, 'SAY SOMETHING', [
        [`Cristal. What exactly do you do for a living?`, [
          ['cristal', `Consulting, sweetie. I consult with lonely gentlemen about their finances. Then there's less of them. The finances.`, 'smirk'],
          ['granddad', `A CONSULTANT. Beautiful and employed. Huey, when's the last time YOU had a job?`, 'grin']]],
        [`Granddad. She has a card reader in her purse.`, [
          ['cristal', `Chip, swipe or tap, baby. I don't take cheques. I learned that from a deacon.`, 'smirk'],
          ['granddad', `See? Prepared! Your grandmother never once took a card. Cash only, that woman. Suspicious.`, 'grin']]],
        [`How did you two meet? Was there a checkout page?`, [
          ['cristal', `He clicked "premium". A man who clicks premium knows what he wants and what it costs.`, 'smirk'],
          ['granddad', `I got the GOLD tier. It came with a tote bag.`, 'grin']]],
      ]);
      gd.rig.setPose('think', 12);
      yield* w.say('granddad', `Uh. Huey. My wallet's upstairs on the landing. Run and get it. Quick, now.`, 'worry');
      yield* w.say('cristal', `No rush. The meter rolls over to the next hour in... ooh. Twenty-five seconds.`, 'sly');
      w.cine(false);
      w.objective('GET THE WALLET FROM THE LANDING BEFORE THE METER ROLLS OVER'); w.mark = { x: 1440, y: -250 };
      w.bubble(gd, `RUN, boy! That's MY money ticking!`);
      const ok = yield* w.timed(25, () => Math.abs(p.x - 1440) < 70 && p.y < -150);
      w.mark = null; w.objective(null);
      yield* w.fadeOut(0.2); w.place(640, 1); yield* w.fadeIn(0.2);
      w.cine(true); w.look(700, 1.35);
      if (ok) {
        fee(gd, 'ON TIME. NO LATE FEE.');
        yield* w.say('cristal', `Twenty-three seconds. Your grandson hustles, Robert. I respect a child who understands a deadline.`, 'smirk');
      } else {
        fee(gd, 'LATE FEE  -$75', '#ff7a6a');
        yield* w.say('cristal', `Aww. So close. That's the next hour, a late fee, and a small charge for making me watch a child jog.`, 'smirk');
      }
      yield* w.say('riley', `A LATE fee. On LISTENIN'. Cristal, you a damn genius. Lemme get a business card. I'm buildin' somethin'.`, 'grin');
      fee(ri, 'CARD  -$5');
      yield* w.say('cristal', `The card is five dollars, baby.`, 'smirk');
      yield* w.say('riley', `...Worth it.`, 'grin');
      yield* pick(w, 'TRY AGAIN', [
        [`Granddad. Add up what tonight has cost so far.`, [
          ['granddad', `You can't put a price on love.`, 'grin'],
          ['cristal', `You can, actually. It's four hundred and ninety-five so far. I itemise.`, 'smirk']]],
        [`Cristal. Do you even know his last name?`, [
          ['cristal', `Freeman. Robert Jebediah. It's on the card he gave me, right above the expiration date.`, 'smirk'],
          ['granddad', `She memorised my expiration date! Nobody ever cared when I expire!`, 'grin']]],
        [`This is a transaction wearing perfume.`, [
          ['cristal', `The perfume is extra. He picked the scent off a menu.`, 'smirk'],
          ['granddad', `I picked "Sunday Peach". It's seasonal.`, 'grin']]],
      ]);
      cr.rig.setPose('point', 12);
      yield* w.say('cristal', `Well! This was lovely. Tomorrow you're taking me shopping, Robert. I already picked the stores. And the items. And which card.`, 'smirk');
      gd.rig.setPose('cheer', 12);
      yield* w.say('granddad', `Shopping! You hear that? She wants to be seen with me. In public. In DAYLIGHT.`, 'grin');
      yield* w.say('huey', `She wants to be seen with your wallet. You're just how it gets to the mall.`, 'deadpan');
      gd.rig.setPose('point', 14);
      yield* w.say('granddad', `One more word and the belt comes off slow, so your ass can think about it. Loop. By. Loop.`, 'scowl');
      yield* w.narr(`Dinner lasted fifty-one minutes and cost five hundred dollars. The wings were extra. The wings were ours.`);
      w.cine(false);
      yield* w.fadeOut(0.4);
    }, function* (w) {
      /* 3. THE TAIL: surveillance at the mall, with neighbours. Works on the `lot` plate or the street it falls back to. */
      w.setBg('lot'); w.music('stealth', 0.4); w.place(220, 1); w.noFight = true; w.alert = 0; w.zoom = 1.25;
      const p = w.player, exit = Math.min(w.bg.width - 140, 2060), first = !w.def.lot;
      const gd = w.npc('granddad', 560, { face: 1, expr: 'grin' }), cr = w.npc('cristal', 634, { face: 1 });
      const ri = w.npc('riley', 130, { face: 1 });
      const tom = w.npc('tom', first ? 420 : 1020, { face: -1, expr: 'worry' }), ru = w.npc('ruckus', first ? -70 : 1480, { face: 1, expr: 'grin' });
      const tag = w.follow(ri, 100);
      yield* w.fadeIn(0.3);
      if (first) {
        w.def.lot = true; w.cine(true); w.look(330, 1.4);
        yield* w.narr(`The next day Granddad took Cristal shopping. Riley and I followed. I called it surveillance. Riley called it an internship.`);
        yield* w.say('tom', `Boys! I am not one to gossip. But your grandfather is holding hands with a woman who could be his... his dental hygienist.`, 'worry');
        tom.rig.setPose('cower', 12);
        yield* w.say('tom', `Not that I looked! I looked once. For legal reasons. Please don't tell Sarah I was at the mall looking. Is looking a crime? It feels like one.`, 'shock');
        yield* w.say('riley', `Tom, you sweatin' through your tie. She ain't even glance at your scary ass and you already confessin'.`, 'smirk');
        tom.rig.setPose('stand', 12); p.face = -1;
        yield* w.walk(ru, 70, 190, 'walk');
        yield* w.say('ruckus', `Uncle Ruckus, lot attendant, no relation. I seen it all from the cart return. Robert Freeman, spendin' money on romance like he a man of MEANS.`, 'grin');
        yield* w.say('ruckus', `A fella like Robert got no business buyin' handbags. The handbag was invented in 1642 by a Dutchman, for Dutchmen. I read it on a napkin.`, 'grin');
        yield* w.say('ruckus', `Me, I know my place. The cart return. I got Chronic Epidermal Misfortune. Doctors named it after one look at me. Then they left.`, 'grin');
        yield* w.say('tom', `That is not a real condition. And please stop telling people we're neighbours.`, 'worry');
        yield* w.say('huey', `Nobody asked, Ruckus.`, 'deadpan');
        yield* w.say('ruckus', `Nobody ever does! That's what makes it a public service!`, 'grin');
        p.face = 1;
        yield* w.say('huey', `We need proof he can't argue with. He signs whatever she points at and leaves the receipt behind. Stay back, and get down when he turns round.`, 'deadpan');
        yield* w.say('riley', `Get down? {N}, I'm three foot nine. I LIVE down.`, 'smirk');
        w.cine(false);
        w.also(w.walk(tom, 1020, 190, 'walk')); w.also(w.walk(ru, 1480, 210, 'walk'));
      }
      w.chatter(tom, [`I'm not looking. I'm NOT looking.`, `Is that a SECOND handbag?`, `I should call Sarah. I should NOT call Sarah.`, `None of my business. ...Which store was that?`], 380);
      w.chatter(ru, [`Lord, the man TIPPED. With paper money!`, `In my day we courted with a ham.`, `I'm writin' the mall a letter. Another one.`], 380);
      const S = [
        { x: 800, look: `I feel hater eyes on my neck.`, cr: `Those shoes, Robert. Both pairs. One per foot.`, gd: `A queen can't walk in ONE pair! Charge it!`, tag: 'SHOES  $640', ri: `Six-forty. She wore 'em OUT the store.` },
        { x: 1250, look: `Some {n} back there breathin' jealous.`, cr: `The bag is for carrying your generosity.`, gd: `Emergency card! This IS an emergency!`, tag: 'HANDBAG  $1,150', ri: `He swore the emergency card was a MYTH.` },
        { x: 1700, look: `Smells like library books out here...`, cr: `Plus a convenience fee. For my convenience.`, gd: `Paperwork! I love a woman with paperwork!`, tag: 'CONVENIENCE FEE  $200', ri: `She charged him for bein' charged. I'm in love.` },
      ];
      const fl = { left: 0, look: false, done: false, caught: false };
      w.toast('STAY BACK. HOLD S TO DUCK WHEN GRANDDAD LOOKS ROUND.', 7);
      w.objective('TAIL THEM. DO NOT GET SEEN.');
      w.also(couple(w, gd, cr, S, exit, fl));
      w.also(watch(w, gd, fl));
      for (let i = 0; i < S.length; i++) {
        yield () => fl.left > i;
        yield* w.collect([{ x: S[i].x, name: 'RECEIPT', col: '#f2f0ea', on() { w.bubble(ri, S[i].ri); } }], 'GRAB THE RECEIPT HE LEFT BEHIND. STAY LOW.');
        w.objective('KEEP TAILING THEM. DO NOT GET SEEN.');
      }
      yield () => fl.done;
      tag.stop(); w.objective(null); w.alert = 0; w.beams.length = 0;
      yield* w.fadeOut(0.3);
      gd.gone = cr.gone = true;
      w.place(1600, 1); ri.x = 1500; ri.face = 1; ri.rig.setPose(ri.idlePose, 10); tom.x = 1770; tom.face = -1; tom.rig.setPose('stand', 10);
      yield* w.fadeIn(0.3);
      w.cine(true); w.look(1630, 1.4);
      p.pose('hold', 12, 'deadpan');
      yield* w.say('huey', `One thousand nine hundred and ninety dollars in forty minutes. Signed, dated and scented.`, 'deadpan');
      yield* w.say('riley', `Read the bottom of this one. "Thank you for your business. Ask about our loyalty programme." She got a LOYALTY PROGRAMME, Huey.`, 'grin');
      tom.rig.setPose('cower', 12);
      yield* w.say('tom', `Is that a RECEIPT? For a... oh my God. I have SEEN it now. Am I a witness? An accessory? I can't go to prison, Huey. I'm so soft.`, 'shock');
      yield* w.say('huey', `Go home, Tom.`, 'deadpan');
      yield* w.say('tom', `I'm going home. I was never here. Sorry. Sorry, receipt.`, 'worry');
      yield* w.narr(`We had evidence. Itemised, signed and scented. All that was left was to show it to a man who did not want to see it.`);
      w.cine(false);
      yield* w.fadeOut(0.4);
    }, function* (w) {
      /* 4. THE INTERVENTION: three exhibits, zero convictions */
      w.setBg('house', { dark: 0 }); w.music('house', 0.3); w.place(300, 1); w.noFight = true; w.zoom = 1.35;
      const p = w.player;
      const gd = w.npc('granddad', 700, { face: 1, pose: 'handsHips', expr: 'grin' }), ri = w.npc('riley', 1520, { y: -210, face: -1, pose: 'lean' });
      w.chatter(gd, [`Big Daddy Robert. Mm. Still got it.`, `She said "see you soon". SOON. That's commitment.`, `Maybe I get the gold tooth a friend.`], 700);
      yield* w.fadeIn(0.3);
      yield* w.talk(gd, 'SHOW GRANDDAD THE EVIDENCE', (function* () {
        yield* w.say('huey', `Granddad. We need to talk about Cristal. I brought documentation.`, 'deadpan');
        yield* w.say('granddad', `Here it comes. The hater parade. Go on, {n}. Hate at me. I'm moisturised, I can take it.`, 'smirk');
        yield* pick(w, 'EXHIBIT A: THE RECEIPTS', [
          [`Nineteen hundred and ninety dollars. One afternoon.`, [['granddad', `And she let me carry EVERY bag. You know what that's called? Trust.`, 'grin']]],
          [`She charged a convenience fee. For HER convenience.`, [['granddad', `A woman who values her convenience! Your grandmother never did. Stayed with me thirty years. Tragic.`, 'smirk']]],
          [`It says "ask about our loyalty programme".`, [['granddad', `LOYALTY, Huey. Printed right there. In ink. You can't fake ink.`, 'grin']]],
        ]);
        yield* pick(w, 'EXHIBIT B: HER PROFILE', [
          [`"Serious enquiries only. Rates on request."`, [['granddad', `Because she's tired of games! I'm serious. I enquired. I requested the rates. That's called pursuit.`, 'grin']]],
          [`She has forty-one reviews. From other men.`, [['granddad', `Forty-one FRIENDS. Popular and modest. Four and a half stars! You ain't got four and a half stars in ANYTHING.`, 'scowl']]],
          [`Your profile says fifty-one. Your grandson is ten.`, [['granddad', `I started young. In my day all we had was time and bad judgment.`, 'smirk']]],
        ]);
        fee(gd, 'FUNERAL FUND: $11', '#ff7a6a');
        yield* pick(w, 'EXHIBIT C: THE COFFEE CAN', [
          [`The funeral fund has eleven dollars in it.`, [['granddad', `Then I guess I can't afford to die. That's called motivation.`, 'grin']]],
          [`Name one thing she knows about you.`, [['granddad', `She knows my billing address by HEART. Recited it over dinner. I got goosebumps.`, 'grin']]],
          [`What happens when the money runs out?`, [['granddad', `Then she'll love me for my... for the... I got a nice car. She'll love the car.`, 'worry']]],
        ]);
        gd.rig.setPose('point', 14);
        yield* w.say('granddad', `You know what this is? Jealousy. Two broke little bitch-ass haters in my house, eating my cereal, mad that somebody finally SEES me.`, 'scowl');
        yield* w.say('huey', `She sees you fine. She sees a pension with a car.`, 'deadpan');
        gd.rig.prop = 'belt'; gd.rig.setPose('beltHold', 12); A().sfx('slap');
        yield* w.say('granddad', `That's it. Belt. First I fold it. Then I snap it, so you can hear what's coming. Then I whoop whichever one of you is slowest.`, 'angry');
        yield* w.say('riley', `That's you, Huey! I'm already upstairs!`, 'grin');
      })());
      w.bubble(gd, `I'm FOLDING it! Hear that leather?!`);
      yield* w.goTo(1400, 'GET UP TO THE LANDING BEFORE THE BELT IS FOLDED', { y: -210 });
      w.cine(true); w.look(1440, 1.45, -94); p.face = 1;
      w.bubble(gd, `Stairs. Damn stairs. You got LUCKY!`);
      yield* w.say('riley', `Told you. You can't out-talk a {n} in love. You brought FACTS. Facts ain't never beat a pretty girl with a card reader.`, 'smirk');
      yield* w.say('huey', `Then we go over his head.`, 'deadpan');
      yield* w.say('riley', `Way ahead of you. That five-dollar business card? Flip it over.`, 'grin');
      p.pose('hold', 12, 'deadpan');
      yield* w.say('huey', `"Talent represented exclusively by A Pimp Named Slickback. Bookings, complaints and philosophy. Operators standing by."`, 'deadpan');
      yield* w.say('riley', `She got MANAGEMENT. Management means a boss. And a boss got a complaints department.`, 'grin');
      yield* w.say('huey', `We are about to report our grandfather's girlfriend to her supervisor.`, 'deadpan');
      yield* w.say('riley', `Snitchin' on Granddad's girl to her manager. This the most gangsta shit you ever did, and you doin' it like a librarian.`, 'grin');
      yield* w.narr(`I was going to settle a family matter by calling a customer service line. America.`);
      w.cine(false);
      yield* w.fadeOut(0.4);
    }, function* (w) {
      /* 5. THE PHONE TREE: you say the whole name, every time */
      w.setBg('house', { dark: 0.35 }); w.music('stealth', 0.2); w.place(560, -1); w.noFight = true; w.zoom = 1.35;
      const p = w.player, ri = w.npc('riley', 660, { face: -1 });
      const REC = { name: 'Recorded Message' };
      const MISDIAL = [`That ain't the button!`, `You pressed the HATER line!`, `Gimme the phone, man!`];
      function* dial(keys, win, busy) {
        for (;;) {
          w.toast('HIT EACH BUTTON AS IT COMES UP', 3); A().sfx('type');
          yield 0.6;
          const hits = yield* w.qte(keys, { window: win, gap: 0.35, onHit() { A().sfx('type'); }, onMiss() { w.bubble(ri, U.pick(MISDIAL)); } });
          if (hits >= keys.length - 1) return;
          yield* w.say('slick', busy, 'smirk', REC);
        }
      }
      const tag = w.follow(ri, 90);
      w.chatter(ri, [`Dial it. DIAL it.`, `Put it on speaker. I wanna hear a professional.`], 600);
      yield* w.fadeIn(0.3);
      yield* w.interact(300, 'CALL THE NUMBER ON THE BUSINESS CARD', 'DIAL');
      tag.stop(); ri.x = p.x + 90; ri.face = -1; ri.rig.setPose(ri.idlePose, 10);
      w.cine(true); w.look(p.x + 40, 1.5); p.face = -1; p.pose('hold', 12, 'deadpan');
      A().sfx('bell');
      yield* w.say('slick', `You have reached the offices of A Pimp Named Slickback. Your call is important to a pimp. Listen carefully, as these options are final.`, 'smirk', REC);
      yield* w.say('slick', `For bookings, press J. For grievances, press K. If you are calling as a hater, press L, and reflect on your choices.`, 'smirk', REC);
      yield* dial(['light', 'heavy', 'guard'], 1.3, `You have selected: "wasting a pimp's time". Returning to the main menu. This call is still being billed.`);
      A().sfx('unlock');
      yield* w.say('slick', `You got him. Who is this, and how did a child get this number?`, 'smirk');
      yield* w.say('huey', `My name is Huey Freeman. I'm trying to reach Mr. Slickback.`, 'deadpan');
      yield* w.say('slick', `Ain't no Mr. Slickback. My daddy wasn't Mr. Slickback. It's A Pimp Named Slickback. All of it. Every time. Goodbye.`, 'scowl');
      A().sfx('ui_locked'); w.bubble(ri, `You messed up the NAME! Gimme that.`);
      yield 0.8;
      yield* w.say('slick', `Welcome back. To hear these options again, hang up and think about what you did. To continue, enter your shame, then the pound key.`, 'smirk', REC);
      yield* dial(['light', 'light', 'heavy', 'guard'], 1.1, `That was not the pound key. That was not any key. Returning to the main menu, slowly, so you learn.`);
      ri.rig.setPose('hold', 12);
      yield* w.say('riley', `Yo, Slick! It's Young Reezy. I got a business proposition for...`, 'grin');
      yield* w.say('slick', `"Slick" is what a floor is after you mop it. I am A Pimp Named Slickback. You wouldn't call the Lord "Lo". Goodbye, little {n}.`, 'scowl');
      A().sfx('ui_locked'); ri.rig.setPose(ri.idlePose, 12); w.bubble(ri, `He called me LITTLE.`);
      yield 0.8;
      yield* w.say('huey', `Give it back. It's a name, not a password. I'll just say it correctly.`, 'deadpan');
      yield* w.say('slick', `Due to a high volume of callers who cannot say a name, your wait time is: however long a pimp feels like.`, 'smirk', REC);
      yield* dial(['heavy', 'light', 'jump', 'guard', 'light'], 0.95, `Your call has been forwarded to the hold music. The hold music is also A Pimp Named Slickback, humming.`);
      yield* w.say('huey', `Hello again. May I please speak to A Pimp Called Slickback.`, 'deadpan');
      yield* w.say('slick', `NAMED. A Pimp NAMED Slickback. "Called" is what happens to a taxi. I was NAMED. There was a ceremony. People cried.`, 'shout');
      yield* w.say('slick', `One more try, because my time is billable and somebody is paying for this damn call. Say it. Whole thing. With your chest.`, 'scowl');
      yield* pick(w, 'SAY THE NAME', [
        [`A Pimp Named Slickback.`, [['slick', `There it is. Was that hard? Five syllables of respect. Now. How can A Pimp Named Slickback help you this evening?`, 'grin']]],
        [`APNS.`, [['slick', `An ACRONYM? Do I look like a government agency? ...I'll allow it once, because a pimp is curious. How can I help you?`, 'scowl']]],
        [`...Sir.`, [['slick', `"Sir." Hm. Still wrong. But raised right. A Pimp Named Slickback is listening.`, 'smirk']]],
      ]);
      yield* w.say('huey', `One of your employees is seeing my grandfather. Cristal. Privately. He thinks it's love.`, 'deadpan');
      yield* w.say('slick', `Cristal. Like the champagne. My top earner. ...Privately? As in off the books? As in unreported?`, 'shock');
      yield* w.say('riley', `She been billin' him direct. We got receipts. She charged a convenience fee.`, 'grin');
      yield* w.say('slick', `A convenience fee I ain't seen a percentage of. Little {n}, that ain't romance. That is a compliance issue.`, 'scowl');
      yield* w.say('slick', `Tell your granddaddy to put on a clean shirt. A Pimp Named Slickback is coming to conduct a performance review.`, 'smirk');
      yield* w.say('slick', `Text me the address. Do not abbreviate "Lane". I don't pull up to abbreviations.`, 'smirk');
      A().sfx('ui_locked');
      yield* w.say('riley', `He comin' HERE? To our house? ...Shit. I gotta change my shirt too.`, 'shock');
      yield* w.narr(`I had expected a criminal. I got middle management. I honestly could not tell you which is worse.`);
      w.cine(false);
      yield* w.fadeOut(0.4);
    }, function* (w) {
      /* 6. COLLECTIONS: A Pimp Named Slickback does not fight. He supervises. */
      const seen = !!w.def.hr;
      w.setBg('block'); w.music('duel', 0.5); w.place(700, 1); w.noFight = false; w.alert = 0; w.zoom = 1.2;
      const gd = w.npc('granddad', seen ? 420 : 820, { face: 1, pose: 'handsHips' }), ri = w.npc('riley', 340, { face: 1, pose: 'lean' });
      const cr = w.npc('cristal', seen ? 1670 : 930, { face: seen ? -1 : 1 });
      const sl = w.npc('slick', seen ? 1590 : 1950, { face: -1, prop: 'cane' });
      yield* w.fadeIn(0.3);
      if (!seen) {
        w.def.hr = true; w.cine(true); w.look(960, 1.2);
        const a1 = w.npc('guard', 2060, { face: -1 }), a2 = w.npc('tux', 2150, { face: -1 });
        A().sfx('thud');
        yield* w.narr(`At nine o'clock a car turned onto our street. It took eleven seconds to finish arriving.`);
        w.also(w.walk(a1, 1300, 170, 'walk')); w.also(w.walk(a2, 1400, 170, 'walk'));
        yield* w.walk(sl, 1160, 160, 'walk');
        yield* w.say('slick', `Good evening, Woodcrest. I am A Pimp Named Slickback. These are my associates, Accounts Receivable and Human Resources.`, 'smirk');
        gd.rig.setPose('point', 14);
        yield* w.say('granddad', `Who the hell is this? Cristal, baby, who is this {n} in the Easter suit?`, 'scowl');
        yield* w.say('cristal', `That's my manager, Robert. You'll want to stand up straight.`, 'smirk');
        gd.rig.setPose('shrug', 12);
        yield* w.say('granddad', `Your MANAGER? Now hold on, Mr. Slickback, I think there's been a...`, 'shock');
        sl.rig.setPose('point', 14);
        yield* w.say('slick', `A Pimp Named Slickback. Every word, old man, every time. It's on the paperwork, it's on the car, and it's on my heart.`, 'scowl');
        sl.rig.setPose('caneLean', 12);
        yield* w.say('slick', `This is not a confrontation. This is an audit. Cristal, you been seeing this client off the books. Three weeks. No filings.`, 'neutral');
        cr.rig.setPose('hold', 12);
        yield* w.say('cristal', `I kept my own books. Colour-coded. Your cut is in the envelope, rounded up, with a note explaining why you don't deserve it.`, 'smirk');
        yield* w.say('slick', `...Well, damn. That's the cleanest ledger I seen all quarter. Then the only outstanding matter is the client's balance.`, 'shock');
        yield* w.say('granddad', `Balance? I don't have a balance! I have a RELATIONSHIP! Cristal, tell this man what we have!`, 'shout');
        cr.rig.setPose('handsHips', 12);
        yield* w.say('cristal', `We have an open invoice, Robert. The emergency card bounced this morning. I smiled at you anyway. That was a courtesy.`, 'neutral');
        gd.rig.setPose('point', 14);
        yield* w.say('granddad', `She LOVES me! I ain't paying another damn dime, and she ain't going nowhere! You want her, purple man, you come through a FREEMAN!`, 'shout');
        yield* w.walk(gd, 420, 260, 'run');
        gd.face = 1; gd.rig.setPose('cower', 12);
        yield* w.say('granddad', `...Huey. You're a Freeman. Go on.`, 'worry');
        yield* w.say('slick', `Client is non-compliant. Gentlemen: collections. Start with the television. Leave the child conscious. He's the one who called.`, 'smirk');
        yield* w.say('granddad', `You CALLED him?! I'm whooping your ass right after he's done whooping your ass!`, 'shout');
        yield* w.say('huey', `I regret everything about today.`, 'deadpan');
        yield* w.say('cristal', `I'll be by the car. Nobody bleed on the shoes, they're new, and they're his.`, 'smirk');
        w.cine(false);
        a1.gone = a2.gone = true;
        w.also(w.walk(cr, 1670, 220, 'walk')); w.also(w.walk(sl, 1590, 200, 'walk'));
      }
      w.minX = 480; w.maxX = 1500;
      w.chatter(sl, [`Good form. Bad attitude. Like his granddaddy.`, `That's a workplace injury. I ain't covering that.`, `Bend your KNEES, Accounts Receivable!`,
        `A Pimp Named Slickback does not fight. He SUPERVISES.`, `Somebody is filling out a form about this.`, `He is TEN, gentlemen. I'm docking everybody.`, `Y'all {ns} losing to a library card!`], 4000);
      w.chatter(gd, [`Protect my LOVE, boy! And the TV!`, `Hit him in his benefits!`, `I'd jump in, but I just got these teeth!`], 4000);
      w.chatter(cr, [`Mm. Kid's got footwork.`, `Still on the clock, by the way.`, `Robert, this is all billable.`], 4000);
      w.toast('THE ASSOCIATES ARE HERE FOR THE FURNITURE. DISCOURAGE THEM.', 6);
      w.bubble(sl, `Jabs only, gentlemen. This is a nice street.`);
      const G1 = { hp: 28, ai: L.grunt, data: { atks: [L.PUNCH] } };
      yield* w.wave([Object.assign({ id: 'tux', x: 1200 }, G1), Object.assign({ id: 'tux', x: 1380, variant: 1 }, G1)]);
      w.bubble(gd, `That's my grandson! I taught him NONE of that!`);
      yield 1.2;
      w.bubble(sl, `Fine. Send in Human Resources.`);
      yield* w.wave([
        { id: 'guard', x: 1320, hp: 70, ai: L.guardAI, speed: 150, idle: 'stance' },
        { id: 'tux', x: 1460, hp: 22, prop: 'bottle', ai: L.shooter },
        Object.assign({ id: 'tux', x: 540, variant: 1 }, G1),
      ]);
      w.bubble(cr, `That's overtime, Robert. Time and a half.`);
      yield 1.2;
      w.bubble(sl, `Accounts Receivable. Go and receive.`);
      const b = w.foe('guard', L.near(w, 520), { hp: 190, boss: true, ai: hrAI, name: 'Accounts Receivable', title: 'SENIOR ASSOCIATE, COLLECTIONS', speed: 160, idle: 'stance', brk: 45 });
      w.foe('tux', L.near(w, -460), { variant: 1, hp: 24, prop: 'bottle', ai: L.shooter });
      yield* w.duel(b, { banner: 'COLLECTIONS!', ko: 'WRITTEN OFF.' });
      w.bubble(sl, `...That was my whole payroll department.`);
      yield 1.6;
      yield* w.fadeOut(0.4);
    }, function* (w) {
      /* 7. EXIT INTERVIEW: the lecture, the final invoice, and the other can */
      w.setBg('block'); w.music('house', 0.2); w.place(760, 1); w.noFight = true; w.zoom = 1.3;
      const gd = w.npc('granddad', 520, { face: 1, pose: 'facepalm', expr: 'worry' }), ri = w.npc('riley', 650, { face: 1 });
      const sl = w.npc('slick', 1200, { face: -1, prop: 'cane' }), cr = w.npc('cristal', 1300, { face: -1 });
      const a1 = w.npc('guard', 1440, { face: -1, pose: 'down', expr: 'pain' }), a2 = w.npc('tux', 1540, { face: -1, pose: 'sit', expr: 'pain' });
      w.follow(ri, 110);
      w.chatter(a2, [`I have a master's degree...`, `Is the child still here?`, `I'm putting in for a transfer.`], 520);
      w.chatter(gd, [`She laughed. I HEARD her laugh.`, `Purple. A grown man. In purple.`], 420);
      yield* w.fadeIn(0.3);
      yield* w.talk(sl, 'HEAR OUT A PIMP NAMED SLICKBACK', (function* () {
        w.look(1130, 1.3);
        yield* w.say('slick', `Impressive, young man. You just hospitalised my payroll department. A Pimp Named Slickback respects initiative.`, 'smirk');
        yield* w.say('slick', `Old man. Come here. I'm gonna tell you something for free, and it's the last free thing on this street tonight.`, 'neutral');
        yield* w.walk(gd, 940, 140, 'walk');
        gd.face = 1; sl.rig.setPose('point', 12);
        yield* w.say('slick', `You didn't have a girlfriend. You had a subscription. And you fell in love with the subscription. That's like proposing to the cable company.`, 'scowl');
        yield* w.say('granddad', `But she laughed at my jokes...`, 'worry');
        yield* w.say('slick', `Twenty dollars a laugh, playa. I read the ledger. She UNDERCHARGED. I heard the lunch counter story from the car. That's a sixty-dollar listen.`, 'smirk');
        sl.rig.setPose('pointUp', 12);
        yield* w.say('slick', `A working professional's time is the only honest thing in this country. Everybody else lies to you for free. She told you the price up front.`, 'neutral');
        yield* w.say('slick', `That ain't a hustle, {n}. That's the only transparent pricing you gon' see in your natural life. Respect the clock. The clock respected you.`, 'neutral');
        yield* pick(w, 'RESPOND TO THE PHILOSOPHY', [
          [`That's cynical. It's also the truest thing said all week.`, [['slick', `The boy gets it. Ten years old and already disappointed. You'd make a hell of an accountant.`, 'grin']]],
          [`You take a cut of her work for owning a hat.`, [['slick', `I take a cut for the BRAND. The hat is overhead. ...She been asking me that same question, to be honest.`, 'scowl']]],
          [`You sound like a landlord.`, [['slick', `Thank you. I own six buildings. Every one of them got my whole name on the lease.`, 'grin']]],
        ]);
        sl.rig.setPose('caneLean', 12);
        yield* w.say('cristal', `Robert. You were a sweet client. Top ten. ...Top fifteen. You tip like a man who's lived through things.`, 'smirk');
        cr.rig.setPose('hold', 12); fee(gd, 'FINAL INVOICE  $3,899.99', '#ff7a6a');
        yield* w.say('cristal', `Final invoice. Dinner, shopping, the lunch counter, two voicemails I listened to all the way through, and tonight. Tonight is overtime.`, 'neutral');
        gd.rig.setPose('shrug', 12);
        yield* w.say('granddad', `Thirty-eight hundred and ninety-nine dollars... and ninety-nine CENTS? What the hell is the ninety-nine cents?!`, 'shock');
        yield* w.say('cristal', `The goodbye. I usually charge more. But I mean this one a little.`, 'smirk');
        gd.rig.setPose('stand', 12);
        yield* w.say('granddad', `Cristal... was any of it real?`, 'worry');
        cr.rig.setPose('handsHips', 12);
        yield* w.say('cristal', `The second laugh at dinner. That one was real, so I didn't bill it. Don't tell my manager.`, 'grin');
        yield* w.say('slick', `I heard that. That's going in your review.`, 'scowl');
        yield* w.say('cristal', `Put it in the review. Then read clause nine of my new contract. I wrote it on the ride over. You're down to fifteen percent.`, 'smirk');
        w.bubble(ri, `Clause NINE. I'm writin' that down.`);
        yield* w.say('slick', `...A Pimp Named Slickback has just been managed.`, 'shock');
        gd.rig.setPose('facepalm', 12);
        yield* w.say('granddad', `Huey. Go in the house. Look in the freezer, behind the peas. Bring me the OTHER can.`, 'worry');
        yield* w.say('huey', `There's another can.`, 'deadpan');
        yield* w.say('granddad', `There is ALWAYS another can. That's the difference between a broke {n} and a man with dignity.`, 'scowl');
      })());
      w.bubble(cr, `Take your time. It's all billable.`);
      yield* w.interact(700, 'FETCH THE OTHER CAN FROM THE FREEZER', 'GO IN');
      A().sfx('unlock'); FX.text(700, -90, 'THE OTHER CAN: $3,900', '#8fe07a');
      w.bubble(ri, `He had FOUR GRAND in the peas?!`);
      yield* w.talk(cr, 'PAY CRISTAL', (function* () {
        w.look(1130, 1.3);
        fee(gd, 'PAID IN FULL');
        yield* w.say('cristal', `Exact, with a penny over. Keep the penny, Robert. Start a new fund.`, 'smirk');
        yield* w.say('riley', `Yo, A Pimp Named Slickback! You hirin'? I got a notebook FULL of fees.`, 'grin');
        yield* w.say('slick', `Stay in school, little {n}. I got enough muscle. What I need is accountants.`, 'smirk');
        a1.rig.setPose('stagger', 8); a2.rig.setPose('stagger', 8);
        yield* w.say('slick', `Gentlemen, get your asses up. You got beat by a fourth-grader, and it's coming out of your dental.`, 'scowl');
        w.also(w.walk(a1, 2400, 150, 'walk')); w.also(w.walk(a2, 2400, 140, 'walk'));
        yield* w.say('cristal', `Bye, babies. Huey, you were right about everything, and it didn't matter. It never does. Take care of him.`, 'smirk');
        w.also(w.walk(sl, 2400, 170, 'walk')); w.also(w.walk(cr, 2400, 180, 'walk'));
        yield* w.narr(`And then they were gone. The car took another eleven seconds to leave.`);
        gd.rig.setPose('handsHips', 12);
        yield* w.say('granddad', `You hear that? "Take care of him." She still cares, boys.`, 'grin');
        yield* w.say('huey', `That's what people say when they return a rental.`, 'deadpan');
      })());
      yield* w.fadeOut(0.5);
    }],
    *outro(w) {
      yield* w.fadeOut(0.5);
      w.def.lot = w.def.hr = false;
      w.setBg('house', { dark: 0 }); w.music('house', 0.1); w.place(620, 1);
      const gd = w.npc('granddad', 800, { face: -1, pose: 'sit', expr: 'worry' }), ri = w.npc('riley', 480, { face: 1, pose: 'lean' });
      w.look(680, 1.45);
      yield* w.fadeIn(0.5);
      yield* w.narr(`Granddad grieved. He played slow records. He ate cereal standing up. He swore he would never love again. This lasted nineteen hours.`);
      yield* w.say('granddad', `It hurt, boys. Right here. In the wallet. And also the heart, which is behind the wallet.`, 'worry');
      yield* w.say('huey', `So what did you learn?`, 'deadpan');
      gd.rig.setPose('pointUp', 12);
      yield* w.say('granddad', `I learned you can't trust these young professional types. Next time I'm going for a mature woman. Thirty. Thirty-two.`, 'scowl');
      yield* w.say('riley', `Granddad. You back on the site ALREADY?`, 'shock');
      gd.rig.setPose('cheer', 12);
      yield* w.say('granddad', `I upgraded to PLATINUM. It comes with a duffel bag. Ooh. "Chardonnay, 24. Loves long walks and wire transfers." She seems down to earth.`, 'grin');
      yield* w.say('huey', `Chardonnay.`, 'deadpan');
      yield* w.say('granddad', `Like the wine. She told me that herself.`, 'grin');
      w.player.pose('facepalm', 12, 'closed');
      yield* w.say('riley', `{N}, you owe me twenty dollars. I laughed at somethin' you said in March.`, 'smirk');
      yield* w.say('huey', `I have never said anything funny.`, 'deadpan');
      yield* w.say('riley', `That's why it's premium.`, 'grin');
      yield* w.narr(`Cristal renegotiated her contract and, I'm told, opened a consultancy. A Pimp Named Slickback sent Granddad a customer satisfaction survey.`);
      yield* w.narr(`He gave it five stars.`);
      gd.gone = ri.gone = true;
    },
  });
})();
