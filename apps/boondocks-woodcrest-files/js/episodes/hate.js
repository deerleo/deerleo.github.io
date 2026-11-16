/* hate.js: "The Hateocracy". The finale, and part three of the Stinkmeaner saga (after fight.js and strikes.js). */
(() => {
  'use strict';
  const BD = window.BD, U = BD.U, FX = BD.FX, L = BD.Lib, cam = BD.cam, E = L.E;
  const A = () => BD.Audio;
  const AUTO = () => !!BD.AUTOPLAY;
  const FULL = { block: 4200, lot: 2400, hell: 2000, diner: 1800 };
  let K = 1;
  /** positions are written for the final backdrops; X() squeezes them onto a narrower stand-in */
  const X = (x) => Math.round(x * K);
  const once = (w, k) => { const s = w.def.seen || (w.def.seen = {}); if (s[k]) return false; s[k] = 1; return true; };
  /** every phase is a checkpoint: clear the stage and dress it again */
  function* open(w, bg, st, track, level, x, face) {
    if (w.fade < 0.9) yield* w.fadeOut(0.3);
    for (const f of w.fighters) if (f !== w.player) f.gone = true;
    w.subs.length = 0; w.noFight = false; w.alert = 0; w.beams.length = 0; w.zoom = 1.35; w.look(null); w.objective(null);
    w.player.hidden = false;
    w.setBg(bg, st); w.music(track, level);
    K = FULL[bg] && w.bg.width < FULL[bg] ? w.bg.width / FULL[bg] : 1;
    w.place(X(x), face);
  }
  /** a speech bubble and a pause: jokes that do not stop play */
  function* beat(w, f, s, t) { if (!f.gone) w.bubble(f, s); yield w.skip ? 0 : t || 1.5; }
  /** commentary from the porch while a fight is on: [[fighter, 'line'], ...] */
  const heckle = (w, boss, calls) => w.also((function* () {
    for (let i = 0; ; i++) { yield U.rand(4.5, 7); if (!boss.dead && !w.cineOn) w.bubble(calls[i % calls.length][0], calls[i % calls.length][1]); }
  })());

  /* Bushido Brown, sparring: holds back, telegraphs everything, stops to admire himself */
  const B_PALM = E({ poses: ['jabW', 'jab'], wind: 0.5, rec: 0.5, dmg: 5, reach: 120, lunge: 180 });
  const B_KICK = E({ poses: ['kickW', 'sideKick'], wind: 0.6, rec: 0.7, dmg: 8, reach: 130, lunge: 220, down: true, sfx: 'whoosh_heavy' });
  const B_SPIN = E({ poses: ['spinW', 'spinKick'], wind: 0.72, rec: 0.9, dmg: 10, reach: 140, lunge: 240, unblock: true, down: true, sfx: 'whoosh_heavy' });
  const BRAGS = ['OBSERVE: PERFECT FORM.', 'I AM NOT EVEN TRYING. NOTE THAT.', 'THAT WAS MY WEAK HAND.', 'YOU MAY TELL PEOPLE I TOUCHED YOU.', 'AUTOGRAPHS ARE EXTRA.', 'THIS ROUND IS BILLABLE.'];
  function* bushidoAI(f) {
    yield* f.idleFor(f.hp < f.max * 0.4 ? 0.5 : 0.9);
    const r = Math.random();
    if (r < 0.28) { L.bark(f, U.pick(BRAGS), '#ffe36e'); f.pose('armsCrossed', 12, 'smirk'); yield 1.1; f.set('idle'); return; }
    if (f.dist() > 200) yield* f.approach(150, 1.4, 230);
    if (f.dist() < 200) { yield* f.strike(B_PALM); if (r > 0.6) yield* f.strike(r > 0.86 ? B_SPIN : B_KICK); }
  }

  /* the three bosses: each one a checkpoint, each with its own exchange and its own hecklers on the porch */
  const BOSS = [{
    pre: function* (w) {
      yield* w.say('crab', `Forty years haulin' traps out of a cold sea, boy. Everything I ever caught, I hated. You gon' fit right in the bucket.`, 'scowl');
      yield* w.say('huey', `You came all this way to avenge a man who died over a parking space.`, 'deadpan');
      yield* w.say('crab', `Avenge? Sure. That. Whatever you said. Hold still.`, 'grin');
    },
    open: `Huey! Get the trap! We can SELL it!`,
    calls: (gd, ri) => [[gd, `Watch the chain! That trap got TETANUS!`], [ri, `He fight like a seafood restaurant!`], [gd, `Hit him in the hip! We all got a bad one!`], [ri, `Crab Man slow! Get behind him!`]],
    after: [`One down! I helped! I pointed!`, `Dibs on the trap.`],
    last: ['crab', `Ohh, my back. Esmeralda! He hit an old man! ...It was wonderful. Do him next.`, 'pain'],
  }, {
    pre: function* (w) {
      yield* w.say('gripe', `Lady Esmeralda Gripenasty. I have kicked dukes, deacons and one sitting judge. Do not expect mercy because you are short.`, 'scowl');
      yield* w.say('huey', `I don't want to fight you.`, 'deadpan');
      yield* w.say('gripe', `Nobody ever does, child. That has never once stopped it from happening.`, 'smirk');
    },
    open: `Don't you hold back, boy! SHE ain't!`,
    calls: (gd, ri) => [[ri, `She kick like the rent due!`], [gd, `I dated a woman like that. Twice. Same woman.`], [ri, `Granddad, she lookin' at you.`], [gd, `Tell her I moved!`], [ri, `Block HIGH, Huey! High!`]],
    after: [`Is she finished? Ask her. From over there.`, `She almost had you, though.`],
    last: ['gripe', `Hmph. Adequate. In 1949 you would have been the third-best child I ever fought. George. Finish this.`, 'scowl'],
  }, {
    pre: function* (w) {
      yield* w.say('pist', `Pistofferson.`, 'deadpan');
      yield* w.say('huey', `Do you have a speech?`, 'deadpan');
      yield* w.say('pist', `Had one. Hit it.`, 'deadpan');
      yield* w.say('huey', `Why are you even doing this?`, 'scowl');
      yield* w.say('pist', `Tuesday was boring.`, 'deadpan');
    },
    open: `He the size of my MORTGAGE!`,
    calls: (gd, ri) => [[ri, `Stick and move! Mostly MOVE!`], [gd, `Not the house! It's load-bearin'!`], [ri, `Yo, he punched the RAIN!`], [gd, `Go for the knees! He ninety percent knees!`]],
    after: [`They ALL down! I did it! We did it! I did it!`, `YOU did it?!`],
    last: ['pist', `Good hit.`, 'pain'],
  }];
  const bossPhase = (i) => function* (w) {
    const c = L.CREW[i], S = BOSS[i];
    yield* open(w, 'street', { flash: 0 }, 'finale', 0.6 + i * 0.15, 720, 1);
    w.maxX = 1560;                       // the ones waiting their turn watch from under the far street lamp
    for (let j = i + 1; j < 3; j++) w.npc(L.CREW[j].id, 1640 + j * 110, { face: -1, prop: 'umbrella', pose: 'hold', z: -1 });
    const gd = w.npc('granddad', 120, { face: 1, pose: 'cower', expr: 'worry', z: -1 }), ri = w.npc('riley', 210, { face: 1, pose: 'aim', z: -1 });
    const bu = w.npc('bushido', 400, { face: 1, pose: 'down', expr: 'closed', z: -1 });
    w.chatter(bu, [`...billable...`, `Did I win? Tell them I won.`, `This is overtime.`], 380);
    yield* w.fadeIn(0.3);
    if (once(w, 'boss' + i)) {
      const b0 = w.npc(c.id, 1260, { face: -1 });
      w.cine(true); w.look(1000, 1.25);
      yield* S.pre(w);
      w.cine(false); b0.gone = true;
    }
    const b = w.foe(c.id, 1260, Object.assign({ boss: true, ai: c.ai, hp: c.hp }, c.o));
    heckle(w, b, S.calls(gd, ri));
    w.bubble(i === 0 ? ri : gd, S.open);
    yield* w.duel(b, { banner: c.banner, ko: c.ko });
    w.cine(true); w.look(b.x, 1.3);
    yield* beat(w, gd, S.after[0], 1.4);
    yield* beat(w, ri, S.after[1], 1.4);
    yield* w.say(S.last[0], S.last[1], S.last[2]);
    w.cine(false);
    yield* w.fadeOut(0.3);
  };

  BD.episode({
    id: 'hate', title: 'THE HATEOCRACY', src: 'inspired by Season 3, Episode 13', bg: 'street',
    blurb: 'Stinkmeaner had friends. Three of them, all over seventy, all furious, all on the 9:15 bus. Granddad hires a bodyguard. The bodyguard bills by the second.',
    loss: 'Gripenasty: "Stay down, child. It is the only sensible thing anyone has done all evening."',
    *intro(w) {
      w.def.seen = {};
      yield* open(w, 'ink', {}, 'ink', 0.2, 200, 1);
      w.player.hidden = true;
      const s = w.npc('stink', 820, { face: 1 }), g = w.npc('gripe', 1140, { face: -1, pose: 'armsCrossed' });
      w.npc('crab', 1010, { face: -1 }); w.npc('pist', 1280, { face: -1 });
      w.look(1040, 1.25);
      yield* w.narr(`This is the last file. It begins thirty years ago, in a place I have only seen in a brochure: the Bitter Oaks Home for the Aged.`);
      yield* w.narr(`Colonel Stinkmeaner had been thrown out of four churches and a bowling alley. Bitter Oaks is where he met the only three people who could stand him.`);
      yield* w.say('crab', `Lord Rufus Crabmiser. Forty years a fisherman. I hate the sea, I hate the fish, and I hate every {n} who ever said "nice day for it".`, 'scowl');
      g.rig.setPose('handsHips', 12);
      yield* w.say('gripe', `Lady Esmeralda Gripenasty. The ballet let me go in 1949 for kicking. They never said kicking WHOM. It was everyone.`, 'scowl');
      yield* w.say('pist', `George Pistofferson. I hit a jukebox once. It apologised.`, 'deadpan');
      yield* w.say('stink', `Well, shit. Three miserable old {ns} with nothin' to live for. Pull up a chair. Not that one. That one's for somebody I like. Been empty since 1962.`, 'grin');
      yield* w.narr(`They tripped nurses. They unplugged the bingo machine mid-number. They told a woman her hundredth birthday was cancelled.`);
      yield* w.narr(`They called it the Hateocracy. Government of the hateful, by the hateful, for nobody.`);
      s.rig.setPose('point', 12);
      yield* w.say('stink', `If anything ever happen to me, I want y'all to do one thing.`, 'scowl');
      yield* w.say('crab', `Avenge you?`, 'scowl');
      yield* w.say('stink', `Hell no. Enjoy it.`, 'grin');
      yield* w.fadeOut(0.6);
      yield* open(w, 'block', {}, 'finale', 0.1, 300, 1);
      w.player.hidden = true;
      const c = w.npc('crab', X(2300), { face: -1, prop: 'umbrella', pose: 'hold' }), pi = w.npc('pist', X(2560), { face: -1, prop: 'umbrella', pose: 'hold' });
      w.npc('gripe', X(2430), { face: -1, prop: 'umbrella', pose: 'hold' });
      w.look(X(2420), 1.3);
      yield* w.fadeIn(0.6);
      yield* w.narr(`Last month the news finally reached Bitter Oaks. The Colonel was dead. Twice, technically. And there was a name attached: Freeman.`);
      yield* w.narr(`They took the 9:15 bus. Senior fare. They complained to the driver the entire way, about the driver.`);
      yield* w.say('crab', `Woodcrest. Smells like fresh mulch and people who say "we should do lunch".`, 'scowl');
      yield* w.say('gripe', `Find the Freeman house. And find me something to kick on the way.`, 'scowl');
      yield* w.say('pist', `Mailbox.`, 'deadpan');
      pi.rig.setPose('cross', 40); A().sfx('thud'); cam.shake(0.6); FX.text(pi.x - 90, -160, 'WHAM!', '#ffe36e');
      yield* w.wait(0.6); pi.rig.setPose('hold', 12); c.face = 1;
      yield* w.say('crab', `George. We agreed you would wait.`, 'scowl');
      yield* w.say('pist', `It looked at me.`, 'deadpan');
      yield* w.fadeOut(0.4);
      w.player.hidden = false;
    },
    phases: [function* (w) {
      /* 1: petty threats. Collect the evidence; meet the witnesses. */
      yield* open(w, 'block', {}, 'stealth', 0.3, 760, 1);
      const p = w.player, gd = w.npc('granddad', X(640), { face: 1, pose: 'cower', expr: 'worry' }), ri = w.npc('riley', X(880), { face: -1, pose: 'lean' });
      const tom = w.npc('tom', X(1560), { face: -1, expr: 'worry' }), brad = w.npc('guest', X(2400), { face: -1 }), ru = w.npc('ruckus', X(2850), { face: -1, expr: 'grin' }), tx = w.npc('tux', X(3300), { face: -1 });
      w.noFight = true;
      yield* w.fadeIn(0.3);
      if (once(w, 'fish')) {
        w.cine(true); w.look(X(720), 1.45); p.face = -1;
        yield* w.narr(`The threats started on a Thursday. They were not good threats. They were the threats of people with a great deal of free time and a fixed income.`);
        yield* w.say('granddad', `Huey! Somebody left a dead fish on my porch! With a NOTE! "YOU NEXT." And under that: "The fish was already dead. We are not monsters."`, 'shock');
        yield* w.say('riley', `That's weak. Real {ns} don't explain the fish.`, 'scowl');
        yield* w.say('granddad', `There's more of this mess down the street. Go see what else they left. I'll stay here and guard the fish.`, 'worry');
        w.cine(false);
      }
      w.chatter(gd, [`Who threatens a man with SEAFOOD?`, `It's evidence. It's also lunch.`], 300);
      w.chatter(ri, [`Weak-ass threats.`, `Old people beef is the pettiest beef.`], 300);
      /** pick up one piece of evidence, then hear from whoever was standing next to it */
      const clue = function* (x, name, label, who, gen) {
        yield* w.collect([{ x, name }], label);
        if (AUTO()) p.x = x;
        w.cine(true); w.look((x + who.x) / 2, 1.45); p.face = who.x > p.x ? 1 : -1; who.face = -p.face;
        yield* gen;
        w.cine(false);
      };
      yield* clue(X(1450), 'CRAB TRAP', 'SOMETHING IS ON TOM\'S LAWN', tom, (function* () {
        yield* w.say('tom', `Huey! There's a crab trap on my lawn! The tag says "FOR FREEMAN. WRONG HOUSE? WE DO NOT CARE." Am I a target? I have a family! I have a hedge!`, 'shock');
        yield* w.say('huey', `They got the address wrong, Tom.`, 'deadpan');
        yield* w.say('tom', `That is EXACTLY how innocent men end up in prison!`, 'worry');
      })());
      yield* beat(w, tom, `I'm keeping the trap. As proof of my innocence.`, 1.4);
      yield* clue(X(2300), 'EXPIRED COUPON', 'CHECK THE BUS STOP', brad, (function* () {
        yield* w.say('huey', `A coupon. "Good for one free whooping." It expired in March.`, 'deadpan');
        yield* w.say('guest', `Oh! Huey. Some seniors asked me where the Freemans live. They used a word. I did NOT repeat the word. I just pointed. Is pointing okay?`, 'worry');
        yield* w.say('huey', `You pointed three assassins at my house.`, 'scowl');
        yield* w.say('guest', `They were ELDERLY. I assumed it was a church thing! You people have such wonderful... I am going to stop talking.`, 'worry');
      })());
      yield* beat(w, brad, `Tell your grandfather hi! From over here!`, 1.4);
      yield* clue(X(2750), 'HALF A BENCH', 'SOMEBODY KICKED A BENCH IN TWO', ru, (function* () {
        yield* w.say('ruckus', `Don't touch that! Historic site. A lady of quality kicked that bench clean in half right in front of me. Never even set down her purse.`, 'grin');
        yield* w.say('ruckus', `That's the Hateocracy, boy. The Colonel's old outfit. I asked for an application. They said I was "too eager". Finest rejection of my life.`, 'grin');
        yield* w.say('huey', `What do they want?`, 'deadpan');
        yield* w.say('ruckus', `Your whole family on a plate, with the crusts cut off. They got bad teeth.`, 'smirk');
      })());
      yield* beat(w, ru, `Finest kick I ever saw. I saluted.`, 1.4);
      yield* clue(X(3200), 'CASSETTE TAPE', 'THE WUNCLER GATE HAS BEEN PUNCHED', tx, (function* () {
        yield* w.say('tux', `Young man. A very large gentleman struck our gatepost and left this cassette. The gatepost is Italian. Who manages your people's disputes?`, 'scowl');
        yield* w.say('huey', `The police. You could have called them.`, 'deadpan');
        yield* w.say('tux', `And have squad cars on the lane? In front of the Hendersons? I would rather be murdered.`, 'shock');
        yield* w.say('huey', `"Threats, Side A." Nobody alive owns a cassette player.`, 'deadpan');
      })());
      yield* beat(w, tx, `Italian, I said!`, 1.2);
      yield* w.goTo(X(740), 'TAKE THE EVIDENCE HOME');
      w.cine(true); w.look(X(720), 1.45); p.face = -1; gd.rig.setPose('handsHips', 12);
      yield* w.say('granddad', `A trap, a coupon, half a bench and a mixtape? These old {ns} tryin' to kill me with a YARD SALE!`, 'shout');
      yield* w.say('huey', `We should call the police.`, 'deadpan');
      yield* w.say('granddad', `And say WHAT? "Officer, three old people bein' rude at my house"? In THIS neighbourhood? They'd arrest me for bein' home.`, 'scowl');
      yield* w.say('huey', `I am saying it now so that later I can say I said it. Call. The. Police.`, 'scowl');
      yield* w.say('granddad', `No! I'ma do what rich folks do. I'ma pay somebody to have my problem FOR me.`, 'grin');
      yield* w.say('riley', `A bodyguard?! Get Bushido Brown! From the movies! He kicked a helicopter!`, 'grin');
      w.cine(false);
      yield* w.fadeOut(0.4);
    },
    function* (w) {
      /* 2: hiring Bushido Brown. Every answer costs more. */
      yield* open(w, 'house', { dark: 0, ghost: 0 }, 'house', 0.3, 760, 1);
      const bu = w.npc('bushido', 960, { face: -1, pose: 'armsCrossed', idle: 'armsCrossed' }), gd = w.npc('granddad', 620, { face: 1, pose: 'handsHips' }), ri = w.npc('riley', 500, { face: 1, pose: 'cheer', expr: 'grin' });
      let tab = 0;
      const bill = (n, why) => { tab += n; A().sfx('unlock'); FX.text(bu.x, -250, '+$' + n + ' ' + why, '#ffe36e'); w.toast('BUSHIDO BROWN, RUNNING INVOICE: $' + tab, 5); };
      yield* w.fadeIn(0.4);
      w.cine(true); w.look(790, 1.35);
      yield* w.narr(`Bushido Brown. Star of "Fist of the Tax Bracket" and "Fist of the Tax Bracket 2: Itemised". Eight-time champion of a tournament he also owns.`);
      yield* w.say('bushido', `Nobody touch me. Nobody look directly at me. Nobody say "hi-yah". Which one of you is the invoice addressed to?`, 'scowl');
      yield* w.say('granddad', `That'd be me. Robert Freeman. Big fan. I seen all your...`, 'grin');
      bill(11, 'GREETING');
      yield* w.say('bushido', `That was a greeting. Greetings are eleven dollars.`, 'deadpan');
      yield* w.say('riley', `Bushido Brown in MY house! Do the kick! Do the helicopter kick!`, 'grin');
      bill(60, 'COUCH');
      yield* w.say('bushido', `Demonstrations are extra. Enthusiasm from children is extra. That couch is extra, because I have to look at it.`, 'scowl');
      let i = yield* w.choice('huey', 'NEGOTIATE', [`What is the day rate?`, `Is there a family discount?`, `What do we get for free?`]);
      if (i === 0) {
        yield* w.say('huey', `What is the day rate?`, 'deadpan'); bill(900, 'TUESDAY');
        yield* w.say('bushido', `Nine hundred. A day begins when I think about your house. I thought about it on Tuesday.`, 'smirk');
      } else if (i === 1) {
        yield* w.say('huey', `Is there a family discount?`, 'deadpan'); bill(300, 'FAMILY');
        yield* w.say('bushido', `There is a family SURCHARGE. More of you to not care about.`, 'smirk');
      } else {
        yield* w.say('huey', `What do we get for free?`, 'deadpan'); bill(75, 'OVERAGE');
        yield* w.say('bushido', `My contempt. And you are already over the limit.`, 'smirk');
      }
      yield* w.say('granddad', `For that money you better stop a bullet AND cut the grass!`, 'shout');
      bill(40, 'OPENING');
      yield* w.say('bushido', `Lawn care is a separate division. Is that your refrigerator? I am going to open it. Opening is forty.`, 'deadpan');
      yield* w.walk(bu, 1120, 170, 'walk'); bu.face = -1;
      w.cine(false);
      w.bubble(bu, `Boy. Napkin. Plate. Hot sauce. Meter's running.`);
      yield* w.collect([
        { x: 300, name: 'NAPKIN', on() { bill(15, 'HANDLING'); w.bubble(bu, `Paper? I bill extra for paper.`); } },
        { x: 1500, y: -210, name: 'HOT SAUCE', on() { bill(25, 'ALTITUDE'); w.bubble(bu, `Top shelf. Altitude fee.`); } },
        { x: 1330, name: 'GOOD PLATE', on() { bill(30, 'PLATE RENTAL'); w.bubble(bu, `I am renting this plate to you.`); } },
      ], 'FETCH WHAT BUSHIDO WANTS. THE METER IS RUNNING.');
      yield* beat(w, gd, `That's the Easter ham! It ain't even EASTER!`, 1.5);
      yield* beat(w, bu, `It is now a catering fee.`, 1.4);
      yield* beat(w, ri, `He ate the WHOLE ham? ...Respect.`, 1.4);
      w.cine(true); w.look(900, 1.35);
      yield* w.say('granddad', `He ate my ham. He ate my ham and CHARGED me for the chewin'.`, 'shock');
      yield* w.say('bushido', `Also, this house is ugly. That one is free. I am not a monster.`, 'smirk');
      i = yield* w.choice('huey', 'READ THE CONTRACT', [`What happens if you lose?`, `What exactly do you guard?`, `Is there a refund?`]);
      if (i === 0) {
        yield* w.say('huey', `What happens if you lose?`, 'deadpan'); bill(200, 'CLAUSE NINE');
        yield* w.say('bushido', `I have never lost. If I lose, clause nine: you pay for my surprise.`, 'smirk');
      } else if (i === 1) {
        yield* w.say('huey', `What exactly do you guard?`, 'deadpan'); bill(120, 'PROXIMITY');
        yield* w.say('bushido', `Me. I guard me. You may stand near me while I do it.`, 'smirk');
      } else {
        yield* w.say('huey', `Is there a refund?`, 'deadpan'); bill(60, 'LAUGH');
        yield* w.say('bushido', `The refund policy is that I laugh. Laughing is sixty.`, 'grin');
      }
      yield* w.say('granddad', `All that money AND a ham, and all he's done is insult my couch. Is this {n} even any GOOD?`, 'scowl');
      yield* w.say('bushido', `Any GOOD? Old man, I once kicked a man so hard his credit score dropped. Pick your best fighter. I'll use one hand, and bill you for both.`, 'scowl');
      yield* w.say('riley', `Huey! Whoop him! If you win, we don't gotta pay!`, 'grin');
      yield* w.say('bushido', `If he wins, you pay DOUBLE. For my emotional distress.`, 'deadpan');
      yield* w.say('huey', `Every option costs more.`, 'deadpan');
      yield* w.say('bushido', `Now you understand the martial arts.`, 'smirk');
      w.cine(false);
      yield* w.fadeOut(0.4);
    }, function* (w) {
      /* 3: the audition. He holds back ninety percent and narrates the other ten. */
      yield* open(w, 'house', { dark: 0, ghost: 0 }, 'duel', 0.4, 520, 1);
      const p = w.player, gd = w.npc('granddad', 1420, { y: -210, face: -1, pose: 'handsHips' }), ri = w.npc('riley', 1520, { y: -210, face: -1, pose: 'cheer', expr: 'grin' });
      yield* w.fadeIn(0.3);
      if (once(w, 'spar')) {
        const b0 = w.npc('bushido', 1000, { face: -1, pose: 'armsCrossed' });
        w.cine(true); w.look(760, 1.3);
        yield* w.say('bushido', `Rules. I will hold back ninety percent. You will be honoured by the remaining ten. Begin whenever you are done being afraid.`, 'smirk');
        yield* w.say('granddad', `Not in the living room! ...Why do I bother. Riley, move the TV.`, 'scowl');
        w.cine(false); b0.gone = true;
      }
      const b = w.foe('bushido', 1000, { hp: 200, boss: true, ai: bushidoAI, title: 'ONE HAND. BILLING FOR TWO.', speed: 230, idle: 'stance', block: 0.3 });
      heckle(w, b, [[gd, `Nine hundred a day to fight a CHILD?`], [ri, `He ain't even LOOKIN' at you, Huey!`], [gd, `Mind the ham! ...What's left of it.`], [ri, `Do the helicopter one! DO IT!`], [gd, `Every dent comin' out his cheque!`]]);
      w.bubble(b, `Admire the stance. No charge. Yet.`);
      yield* w.duel(b, { banner: 'AUDITION!', ko: 'INVOICED.' });
      b.gone = true;
      const bu = w.npc('bushido', b.x, { face: b.face, pose: 'down', expr: 'pain' });
      w.cine(true); w.look(bu.x, 1.4); p.face = bu.x > p.x ? 1 : -1;
      yield* beat(w, ri, `Huey dropped a MOVIE STAR!`, 1.3);
      bu.rig.setPose('armsCrossed', 8); bu.rig.expr = 'smirk';
      yield* w.say('bushido', `I LET that happen. Letting is two hundred. Your stance is mediocre and your hair is a distraction. You're welcome.`, 'smirk');
      yield* w.say('huey', `You lost.`, 'deadpan');
      yield* w.say('bushido', `I conducted a demonstration of losing. Very advanced. You would not understand.`, 'scowl');
      yield* w.say('granddad', `So we don't gotta pay?`, 'grin');
      yield* w.say('bushido', `You pay double. We discussed this.`, 'deadpan');
      yield* w.narr(`I told Granddad again to call the police. He said he had already spent the police money on Bushido Brown.`);
      yield* w.narr(`There is no police money. The police are free. He would not hear it.`);
      w.cine(false);
      yield* w.fadeOut(0.4);
    },
    function* (w) {
      /* 4: the night attack. Bushido Brown's finest nine seconds. */
      yield* open(w, 'street', { flash: 0 }, 'finale', 0.3, 520, 1);
      const gd = w.npc('granddad', 380, { face: 1, pose: 'cower', expr: 'worry' }), ri = w.npc('riley', 290, { face: 1, pose: 'aim' });
      const bu = w.npc('bushido', 860, { face: 1, pose: 'armsCrossed' });
      const c = w.npc('crab', 1500, { face: -1, prop: 'umbrella', pose: 'hold' }), g = w.npc('gripe', 1620, { face: -1, prop: 'umbrella', pose: 'hold' }), pi = w.npc('pist', 1740, { face: -1, prop: 'umbrella', pose: 'hold' });
      const pow = (f, txt, sfx) => { A().sfx(sfx || 'hit_heavy'); cam.shake(0.45); FX.text(f.x, -230, txt, '#ffe36e'); FX.ring(f.x, -110, '#ffffff', 80); };
      w.noFight = true;
      yield* w.fadeIn(0.4);
      w.cine(true); w.look(1100, 1.15);
      if (once(w, 'night')) {
        yield* w.narr(`They came that night, in the rain, at a quarter past seven. They would have come later, but none of them drives after dark.`);
        yield* w.say('crab', `Freeman! Robert Freeman! Come out and get what's comin'! And hurry up. George got to take his pill with food.`, 'shout');
        yield* w.say('gripe', `We are the Hateocracy. You killed our colleague. We have come to be extremely unpleasant about it.`, 'scowl');
        yield* w.say('granddad', `I got a BODYGUARD! Two thousand dollars and a ham! Go on, Bushido! Earn that ham!`, 'shout');
        yield* w.say('bushido', `Three geriatrics. I am insulted. Insult pay is time and a half. Watch closely, child. This is the part they put on the poster.`, 'smirk');
      }
      /* the stand: spectacular, briefly */
      w.look(1380, 1.3);
      yield* w.walk(bu, 1390, 480, 'run');
      bu.rig.setPose('spinKick', 40); pow(c, 'CRANE!', 'whoosh_heavy'); c.rig.setPose('stagger', 20);
      yield* beat(w, ri, `OHHH! Right in the BEARD!`, 1.0);
      bu.rig.setPose('riseKick', 40); pow(g, 'TIGER!', 'whoosh_heavy'); g.rig.setPose('guard', 30);
      yield* beat(w, gd, `That's my money WORKIN'!`, 1.0);
      bu.rig.setPose('sideKick', 40); pow(pi, 'AUDITOR!'); pi.rig.setPose('hurt', 30);
      yield* beat(w, bu, `Crane. Tiger. Auditor. Hold your applause.`, 1.5);
      bu.face = -1; bu.rig.setPose('cheer', 12); bu.rig.expr = 'grin'; c.rig.setPose('hold', 10); g.rig.setPose('hold', 10); pi.rig.setPose('hold', 10);
      yield* beat(w, bu, `And now, my signature mo...`, 1.2);
      /* the defeat: sudden, total */
      c.rig.setPose('throwR', 40); pow(bu, 'CLAMP!', 'chain'); bu.rig.setPose('hurt', 40); bu.rig.expr = 'shock'; yield* w.wait(0.3);
      g.rig.setPose('sideKick', 40); pow(bu, 'KICK!'); yield* w.wait(0.3);
      pi.rig.setPose('cross', 40); pow(bu, 'WHAM!', 'thud'); cam.shake(1); FX.flash(0.6);
      bu.rig.setPose('launch', 30); bu.rig.expr = 'pain';
      yield () => { bu.x -= 1100 * w.dt; return bu.x <= 760 || w.skip; };
      bu.x = 760; bu.rig.setPose('down', 24); A().sfx('thud'); cam.shake(0.5);
      c.rig.setPose('hold', 10); g.rig.setPose('hold', 10); pi.rig.setPose('hold', 10);
      w.look(760, 1.35);
      yield* beat(w, gd, `...That's my money on the ground.`, 1.6);
      yield* beat(w, ri, `This {n} folded faster than YOU, Granddad!`, 1.5);
      yield* beat(w, gd, `HEY!`, 1.0);
      w.cine(false);
      yield* w.collect([
        { x: 960, name: 'PAGE 1 OF 9', on() { w.bubble(bu, `Don't... crease those.`); } },
        { x: 1100, name: 'PAGE 4 OF 9', on() { w.bubble(bu, `That one is... the rain surcharge.`); } },
        { x: 1240, name: 'PAGE 9 OF 9', on() { w.bubble(bu, `Sign... at the bottom.`); } },
      ], 'HIS INVOICE FELL OUT OF HIS GI. PICK IT UP.');
      yield* w.talk(bu, 'CHECK ON BUSHIDO BROWN', (function* () {
        yield* w.say('bushido', `Do not touch me. Lying down is a technique. The lying-down rate applies.`, 'pain');
        yield* w.say('huey', `You lost in nine seconds.`, 'deadpan');
        yield* w.say('bushido', `Nine BILLABLE seconds. Carry the hazard... forty-one hundred dollars. I take cheques. Lean the cheque against my face.`, 'pain');
        yield* w.say('granddad', `I ain't payin' for THAT! This {n} ain't guard nothin' but the pavement!`, 'shout');
        yield* w.say('bushido', `The pavement is secure. You're welcome. Somebody call my agent. Tell him I won.`, 'closed');
        yield* w.narr(`For the record: Bushido Brown is fine. He stayed exactly where he landed for the rest of the evening, billing.`);
        w.look(1300, 1.2);
        yield* w.say('crab', `Well. That was the help. Now send out the family. Start with the little bushy one. I got a trap just his size.`, 'grin');
        yield* w.say('granddad', `Huey! You know I'd go myself, but my knee is in the house!`, 'worry');
        yield* w.say('huey', `For the third time: we could call the police.`, 'deadpan');
        yield* w.say('granddad', `AFTER! Call 'em AFTER, so there's somethin' to show 'em!`, 'shout');
      })());
      yield* w.fadeOut(0.4);
    }, bossPhase(0), bossPhase(1), bossPhase(2)],
    *outro(w) {
      yield* open(w, 'street', { flash: 0 }, 'credits', 0.3, 700, 1);
      const gd = w.npc('granddad', 560, { face: 1, pose: 'handsHips' }), ru = w.npc('ruckus', 1400, { face: -1, expr: 'worry' });
      w.npc('riley', 460, { face: 1, pose: 'lean' }); w.npc('tom', 340, { face: 1, expr: 'worry' }); w.npc('bushido', 200, { face: 1, pose: 'down', expr: 'closed' });
      w.npc('crab', 1000, { face: -1, pose: 'sit' }); w.npc('gripe', 1110, { face: -1, pose: 'armsCrossed' }); w.npc('pist', 1230, { face: -1, pose: 'sit' });
      w.also((function* () { for (let i = 0; i < 10; i++) { FX.flash(0.3, i % 2 ? '#ff3b3b' : '#3b6cff'); yield 0.45; } })());   // police lights
      A().sfx('alert');
      w.look(820, 1.2);
      yield* w.fadeIn(0.6);
      yield* w.narr(`The police arrived at 7:52. Somebody had finally called them. It was not us.`);
      yield* w.say('tom', `I called! I called on Thursday! I said "seniors are leaving seafood on lawns" and they sent a pamphlet. Tonight I said "property values". Six cars.`, 'shock');
      yield* w.say('granddad', `Officers! Arrest these people! They came to avenge that blind fool I... who passed away. Near me.`, 'shout');
      yield* w.say('crab', `Avenge him? STINKMEANER? Hell, we couldn't stand that {n}.`, 'grin');
      yield* w.say('gripe', `He cheated at dominoes, he chewed with his whole face, and he has owed me nine dollars since 1987.`, 'scowl');
      yield* w.say('huey', `Then why did you come?`, 'scowl');
      yield* w.say('crab', `Somethin' to do, boy. You know how hard it is to find a reason to whoop somebody at our age? Folks keep forgivin' us.`, 'smirk');
      yield* w.say('gripe', `His funeral was an excuse to travel. You were an excuse to stay.`, 'smirk');
      yield* w.say('pist', `I liked the bus.`, 'deadpan');
      ru.rig.setPose('cheer', 12);
      yield* w.say('ruckus', `Take me too, officers! I'm an accessory! I held a purse! ...They won't even arrest me. Story of Uncle Ruckus, no relation.`, 'worry');
      yield* w.narr(`They were charged with assault, trespassing, and what the report calls "a concerning amount of seafood".`);
      yield* w.narr(`Crabmiser asked if the jail had bingo. It does. He was furious. He was thrilled.`);
      gd.rig.setPose('shrug', 12);
      yield* w.say('granddad', `So I ain't have to fight nobody. I ain't have to hire nobody. I coulda just CALLED?`, 'shock');
      yield* w.say('huey', `I said so four times.`, 'deadpan');
      yield* w.say('granddad', `Then you shoulda said it like you MEANT it!`, 'shout');
      yield* w.say('riley', `Bushido left his headband. That's forty on resale. Fifty if I say he died in it.`, 'grin');
      yield* w.narr(`Bushido Brown was collected by a car service he billed to us. He is fine. His invoice got home before he did.`);
      yield* w.fadeOut(0.8);
      /* the hill: Huey closes the file */
      yield* open(w, 'hill', {}, 'credits', 0.3, 800, 1);
      w.player.pose('armsCrossed', 10, 'deadpan'); w.look(800, 1.3);
      yield* w.fadeIn(0.8);
      yield* w.narr(`Here is what I know about hatred after a year in Woodcrest. It is not strong. It is not clever. It did not train on a mountain. I checked.`);
      yield* w.narr(`It is bored. It is four old people at a card table with nothing to build, so they break things, and call it a cause when anyone asks.`);
      yield* w.narr(`Stinkmeaner never wanted a parking space. The Hateocracy never wanted revenge. They wanted an excuse.`);
      yield* w.narr(`An excuse is the cheapest thing in the world, and people will die to get one.`);
      yield* w.narr(`So. The year in review, for the file.`);
      yield* w.narr(`I told the truth at a garden party. They applauded my diction.`);
      yield* w.narr(`Granddad fell for a woman half his age, and it took A Pimp Named Slickback to explain her to him. You say the whole name.`);
      yield* w.narr(`Granddad fought a blind man over a parking space. Twice. He won the second one too hard.`);
      yield* w.narr(`Tom was arrested for a murder he is far too nervous to commit. The only help on offer was Ed Wuncler the Third and Gin Rummy. They brought guns.`);
      yield* w.narr(`Granddad opened a soul food restaurant. The food was so good the neighbourhood stopped moving. We closed it for public health. The public objected.`);
      yield* w.narr(`We snuck into a movie, got thrown out by an usher who is no relation to anybody, and never saw one minute of it. The reviews say we won.`);
      yield* w.narr(`Stinkmeaner came back from Hell wearing Tom, and was defeated by making a friend. I still do not care for that one.`);
      yield* w.narr(`Granddad left me in charge for a day. Riley declared independence with four thousand airsoft pellets. Democracy was restored by belt.`);
      yield* w.narr(`And three senior citizens tried to end us out of boredom, in the rain, on a fixed income.`);
      yield* w.narr(`Nothing was learned. Granddad owes Bushido Brown forty-one hundred dollars. Riley is selling the headband.`);
      yield* w.narr(`Uncle Ruckus has re-applied to the Hateocracy, in writing. They have not replied. He is honoured.`);
      yield* w.narr(`Woodcrest is quiet again.`);
      yield* w.narr(`I give it a week.`);
      yield* w.fadeOut(1.2);
      const lines = ['THE WOODCREST FILES', '', 'an unofficial, non-commercial fan game', 'made out of love for The Boondocks,', 'created by Aaron McGruder', '', 'nine episodes, one cul-de-sac', '',
        'every sprite, backdrop, beat and line of dialogue', 'in this game was made from scratch', '', 'no senior citizens were harmed', 'Bushido Brown has not been paid', '', 'thank you for playing', '', '"I give it a week."'];
      let t = 0;
      w.overlay = (g) => {
        g.fillStyle = '#07060a'; g.fillRect(0, 0, BD.FBW, BD.FBH);
        lines.forEach((l, i) => { const y = BD.FBH + 10 - t * 16 + i * 16; if (y > -10 && y < BD.FBH) BD.Text.draw(g, l, BD.FBW / 2, y, { align: 'center', color: i === 0 ? '#ffe36e' : '#f1e6d2', scale: i === 0 ? 2 : 1 }); });
      };
      yield (dt) => (t += dt) > 36 || (t > 2 && BD.Input.take('confirm'));
    },
  });
})();
