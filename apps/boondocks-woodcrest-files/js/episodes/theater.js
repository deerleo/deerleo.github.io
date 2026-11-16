/* theater.js: Episode "...Or Die Trying". A boycott nobody hears, a backpack full of dinner, a lobby full of flashlights,
 * a butter run against the clock, the Night Manager, and a refund for tickets nobody bought. */
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
      end() { for (const c of cos) c.stop(); for (const f of w.fighters) if (f !== w.player) f.gone = true; w.bubbles.length = 0; w.beams.length = 0; w.alert = 0; w.objective(null); w.look(null); },
    };
  };
  /** the block backdrop is 4200 wide; if it has not landed yet the fallback street is narrower, so scale positions to fit */
  const BX = (w) => { const wide = w.bg.width; return (x) => (wide >= 4000 ? x : Math.round(x * (wide - 120) / 4200)); };
  /** bubbles keyed to how far Huey has walked: [[x, npc, 'line'], ...] */
  const banter = (w, beats, gap) => w.also((function* () {
    for (const [x, f, s] of beats) { yield () => w.player.x >= x && !w.cineOn; w.bubble(f, s); yield gap || 1.7; }
  })());
  /** queued bubbles, one at a time, so reactions to pick-ups do not talk over each other */
  const voiceQ = (w) => {
    const q = [];
    const co = w.also((function* () { for (;;) { yield () => q.length > 0 && !w.cineOn; const [f, s] = q.shift(); w.bubble(f, s); yield 1.7; } })());
    return { co, say(f, s) { q.push([f, s]); }, idle: () => q.length === 0 };
  };
  /** the headless run teleports Huey, so let the walking banter finish before moving on */
  function* drain(co) { if (AUTO()) yield () => co.done; }
  const LINE = { name: 'Man in Line' }, CUP = { name: 'Man with a Collector Cup' };

  BD.episode({
    id: 'theater', title: '...OR DIE TRYING', src: 'inspired by Season 2, Episode 1', bg: 'lobby',
    blurb: 'Granddad will not pay thirteen dollars to see "Soul Jet 2: Still Delayed". He calls sneaking in a protest. Uncle Ruckus has a flashlight and a calling.',
    loss: 'Ruckus: "One freeloader, down in front! Somebody come mop up his principles."',
    *intro(w) {
      w.setBg('block'); w.music('house', 0.15);
      const bx = BX(w);
      w.place(bx(2300), 1);
      const gd = w.npc('granddad', bx(2440), { face: -1, pose: 'handsHips' }), ri = w.npc('riley', bx(2170), { face: 1, pose: 'cheer', expr: 'grin' }), jz = w.npc('jazmine', bx(2060), { face: 1, expr: 'worry' });
      w.look(bx(2300), 1.3);
      yield* w.narr('Every few years Hollywood makes a movie so insulting that buying a ticket should count as a hate crime against yourself.');
      yield* w.narr('This year it was "Soul Jet 2: Still Delayed". The first one set us back ten years. The sequel had a bigger budget.');
      yield* w.say('riley', 'OPENING NIGHT! Soul Jet 2, {n}! They got a scene where the pilot is a pimp AND a grandma. Same dude! That\'s RANGE!', 'grin');
      w.player.face = -1;
      yield* w.say('huey', 'We should be boycotting that movie. Not taking a bus to it.', 'scowl');
      w.player.face = 1;
      yield* w.say('granddad', 'Boycott? Boy, I was boycotting before you were a itch. I sat-in at a lunch counter for six weeks. Lost eleven pounds. Looked GOOD.', 'grin');
      yield* w.say('huey', 'Which lunch counter?', 'deadpan');
      yield* w.say('granddad', 'The one with the... counter. Don\'t you cross-examine a veteran of the movement.', 'scowl');
      yield* w.say('jazmine', 'My daddy gave me thirteen dollars for my ticket! He said to keep the receipt for his taxes!', 'grin');
      yield* w.say('granddad', 'THIRTEEN DOLLARS? To watch {ns} fall down on a airplane? I can see that shit for free at the family reunion.', 'shock');
      gd.rig.setPose('pointUp', 12);
      yield* w.say('granddad', 'No sir. We ain\'t paying. We going in the way my generation went in everywhere: without asking.', 'scowl');
      yield* w.say('huey', 'That\'s called theft.', 'deadpan');
      yield* w.say('granddad', 'It\'s called a SIT-IN. You go in, and you sit. It\'s right there in the name.', 'smirk');
      jz.rig.setPose('cower', 12);
      yield* w.say('jazmine', 'But that\'s against the LAW! They\'ll put us in jail! I\'m too little for jail! I still use safety scissors!', 'worry');
      ri.rig.setPose('lean', 12);
      yield* w.say('riley', 'Ain\'t no jail. It\'s a heist. I seen like nine heist movies. Somebody always get caught, but it\'s usually the nervous one.', 'smirk');
      yield* w.say('jazmine', 'I\'M the nervous one!', 'shock');
      yield* w.fadeOut(0.3);
      gd.gone = ri.gone = jz.gone = true;
    },
    phases: [function* (w) {                       /* 1. the box office line: a boycott of one */
      const S = stage(w), p = w.player;
      w.setBg('block'); w.music('house', 0.3); w.zoom = 1.3; w.noFight = true;
      const bx = BX(w);
      w.place(bx(2320), 1);
      const gd = w.npc('granddad', bx(2240), { face: 1, pose: 'handsHips' }), ri = w.npc('riley', bx(2160), { face: 1, pose: 'lean' }), jz = w.npc('jazmine', bx(2080), { face: 1, expr: 'worry' });
      const q1 = w.npc('guest', bx(3020), { face: 1 }), q2 = w.npc('tux', bx(3110), { face: 1, variant: 1 }), q3 = w.npc('guest', bx(3200), { face: 1, variant: 2 });
      S.add(w.follow(gd, 110)); S.add(w.follow(ri, 200)); S.add(w.follow(jz, 290));
      yield* w.fadeIn(0.3);
      const talk = S.add(banter(w, [
        [bx(2400), ri, 'Soul Jet 2! Soul Jet 2! Soul Jet 2!'],
        [bx(2520), gd, 'Stop chanting. You sound like a ringtone.'],
        [bx(2640), jz, 'Is it scary? Are there clowns in it?'],
        [bx(2760), ri, 'It got a fat suit AND a wig. It got everything.'],
        [bx(2860), gd, 'Look at that line. Sheep. PAYING sheep.'],
      ]));
      yield* w.goTo(bx(2900), 'WALK UP TO THE BOX OFFICE LINE');
      yield* drain(talk);
      yield* w.interact(q1, 'ADDRESS THE PEOPLE IN LINE', 'SPEAK');
      w.cine(true); w.look(bx(3000), 1.4); p.face = 1; p.pose('point', 12, 'deadpan');
      q1.face = q2.face = q3.face = 1;             // nobody even turns around
      yield* w.say('huey', 'Excuse me. People of Woodcrest. Before you hand over your money, ask yourself what this movie says about you.', 'deadpan');
      const a = yield* w.choice('huey', 'THE BOYCOTT SPEECH:', ['This is a minstrel show with a jet.', 'Your thirteen dollars is a weapon.', 'The director has never met us.']);
      if (a === 0) {
        yield* w.say('huey', 'This is a minstrel show with a bigger budget and a jet. Every ticket you buy is a vote for part three.', 'scowl');
        yield* w.say('guest', 'Shh! I\'m watching the trailer for the movie I\'m in line for.', 'scowl', LINE);
      } else if (a === 1) {
        yield* w.say('huey', 'Your thirteen dollars is a weapon. Right now it is pointed at your own foot.', 'scowl');
        yield* w.say('tux', 'Thirteen? I got the collector cup combo. I\'m in for forty.', 'grin', CUP);
      } else {
        yield* w.say('huey', 'The man who directed this has never met a Black person he didn\'t pay to fall down.', 'scowl');
        yield* w.say('tux', 'Is he here? Would he sign my collector cup?', 'grin', CUP);
      }
      const b = yield* w.choice('huey', 'CLOSE STRONG:', ['Walk away with me. Right now.', 'History will judge this line.', 'If you must see it, steal it.']);
      if (b === 0) {
        yield* w.say('huey', 'So walk away with me. Right now. Turn around, go home, and read a book.', 'deadpan');
        yield* w.say('guest', 'Kid, the line moves THAT way.', 'deadpan', LINE);
      } else if (b === 1) {
        yield* w.say('huey', 'History is going to judge every person standing in this line.', 'scowl');
        yield* w.say('tux', 'Then history can wait behind me like everybody else.', 'smirk', CUP);
      } else {
        yield* w.say('huey', 'If you absolutely must see it, at least steal it. Starve the machine.', 'deadpan');
        yield* w.say('granddad', 'SEE? The boy gets it! That is all I been saying!', 'grin');
        yield* w.say('huey', 'That is not what you\'ve been saying.', 'deadpan');
      }
      p.pose('stand', 8, 'deadpan');
      yield* w.narr('Nobody turned around. One man asked me to hold his place while he went for nachos.');
      yield* w.say('granddad', 'You done? Good speech. Lot of words. Now here go the REAL plan.', 'smirk');
      yield* w.say('granddad', 'We ain\'t buying no ticket, and we DAMN sure ain\'t paying nine dollars for popcorn. We bringing dinner. Jazmine, open up that backpack.', 'scowl');
      yield* w.say('jazmine', 'It\'s for my homework!', 'worry');
      yield* w.say('granddad', 'Tonight it\'s for hot wings.', 'deadpan');
      yield* w.say('riley', 'NOW we talking. I\'m the mastermind. Granddad the muscle. Huey the one who complain. Jazmine the mule.', 'grin');
      yield* w.say('jazmine', 'I don\'t want to be the mule!', 'shock');
      yield* w.fadeOut(0.3);
      S.end(); w.cine(false);
    }, function* (w) {                             /* 2. dinner and a movie: fill Jazmine's backpack */
      const S = stage(w), Q = voiceQ(w);
      S.add(Q.co);
      w.setBg('block'); w.music('house', 0.45); w.zoom = 1.3; w.noFight = true;
      const bx = BX(w);
      w.place(bx(2760), 1);
      const gd = w.npc('granddad', bx(2880), { face: -1, pose: 'handsHips' }), jz = w.npc('jazmine', bx(2670), { face: 1, expr: 'worry' });
      w.npc('riley', bx(2970), { face: -1, pose: 'lean' });
      yield* w.fadeIn(0.3);
      yield* w.talk(gd, 'GET THE SNACK LIST FROM GRANDDAD', (function* () {
        yield* w.say('granddad', 'There\'s a rotisserie chicken on our porch. A two-liter of grape in the trunk of my car. And a pound cake hid at the DuBois house.', 'scowl');
        yield* w.say('jazmine', 'You keep a cake at MY house?', 'shock');
        yield* w.say('granddad', 'Behind your daddy\'s law books. Nobody ever opens them things, least of all him. It\'s for emergencies. This is the emergency.', 'deadpan');
        yield* w.say('granddad', 'Huey, go get it all. Jazmine, you carry. You got a honest face and a big backpack. That\'s the two things a smuggler needs.', 'smirk');
      })());
      S.add(w.follow(jz, 110));
      yield* w.collect([
        { x: bx(1500), name: 'EMERGENCY POUND CAKE', col: '#ffd98a', on() { Q.say(jz, 'It WAS behind the tax law! Daddy never looks there!'); } },
        { x: bx(1040), name: 'TWO-LITER OF GRAPE', col: '#a070e0', on() { Q.say(jz, 'Is soda a misdemeanor or a felony?'); } },
        { x: bx(700), name: 'WHOLE ROTISSERIE CHICKEN', col: '#e8a04a', on() { Q.say(jz, 'It\'s WARM! It\'s touching my spelling test!'); } },
      ], 'COLLECT GRANDDAD\'S SNACKS. JAZMINE CARRIES');
      Q.say(jz, 'It\'s sloshing. Everybody can hear it sloshing!');
      if (AUTO()) yield () => Q.idle();
      yield* w.talk(gd, 'HAUL THE CONTRABAND BACK TO GRANDDAD', (function* () {
        yield* w.say('granddad', 'Chicken, soda, cake. Beautiful. Now we add the hot sauce, the paper plates, and my foot bath.', 'grin');
        yield* w.say('huey', 'Why do you need a foot bath at the movies?', 'deadpan');
        yield* w.say('granddad', 'It\'s a two-hour movie and I got corns. I ain\'t a animal.', 'scowl');
        yield* w.say('jazmine', 'It\'s so heavy. And it\'s leaking! Mr. Freeman, the chicken is leaking on my homework!', 'worry');
        yield* w.say('granddad', 'That\'s flavor. Your teacher gon\' thank me. Now everybody act natural.', 'deadpan');
        yield* w.say('jazmine', 'I CAN\'T act natural! I\'m a criminal now! I can feel it changing me!', 'shock');
        yield* w.say('riley', 'Welcome to the life, Jazmine. First one always the hardest.', 'smirk');
        yield* w.narr('For the record, I objected to all of it. Nobody keeps a record.');
      })());
      yield* w.fadeOut(0.3);
      S.end();
    },
    function* (w) {                                /* 3. the lobby: two flashlights and one ticketless revolutionary */
      const S = stage(w), p = w.player;
      w.setBg('lobby'); w.music('stealth', 0.5); w.place(170, 1); w.noFight = true; w.zoom = 1.3; w.alert = 0;
      const ru = w.npc('ruckus', 470, { variant: 1, face: -1, prop: 'flashlight', pose: 'flashlight', idle: 'flashlight', expr: 'grin', data: { a: 640, b: 1500, speed: 105 } });
      const us = w.npc('manager', 2300, { variant: 1, face: -1, prop: 'flashlight', pose: 'flashlight', idle: 'flashlight', data: { a: 1760, b: 2860, speed: 135 } });
      yield* w.fadeIn(0.3);
      if (!w.flags.lobby) {
        w.flags.lobby = true;
        const gd = w.npc('granddad', 300, { face: 1, pose: 'handsHips' }), ri = w.npc('riley', 240, { face: 1, pose: 'lean' }), jz = w.npc('jazmine', 370, { face: 1, expr: 'worry' });
        w.cine(true); w.look(380, 1.35);
        yield* w.say('ruckus', 'Welcome to the Woodcrest Twelve! Uncle Ruckus, head usher, no relation. Tickets! Lemme see them tickets! I can smell a unpaid seat from the parking lot!', 'grin');
        yield* w.say('granddad', 'Everybody be cool. Walk like you belong. That\'s how I got into the Army, a wedding, and two funerals.', 'smirk');
        yield* w.say('ruckus', 'Well, hello there, little miss! Now THIS is what a paying customer look like. Look at that posture. Go right on in, sugar. You and your... luggage.', 'grin');
        yield* w.say('jazmine', 'Thank you! I mean, I\'m sorry! I mean, there\'s a CHICKEN in...', 'worry');
        yield* w.say('riley', 'She got a condition. Keep walking, mule.', 'smirk');
        S.add(w.also(w.walk(gd, 1300, 230, 'walk'))); S.add(w.also(w.walk(ri, 1240, 250, 'sneak'))); S.add(w.also(w.walk(jz, 1360, 220, 'walk')));
        yield* w.narr('Granddad strolled in like he held the mortgage. Riley went under the rope. Jazmine got waved through with eleven pounds of contraband. That left me.');
        yield* w.say('ruckus', 'But YOU. I know that hair. That is the hair of a boy who ain\'t never paid for nothin\'. Go on. Try me. Me and this flashlight been deputized.', 'scowl');
        yield* w.say('huey', 'By who?', 'deadpan');
        yield* w.say('ruckus', 'By ME.', 'grin');
        gd.gone = ri.gone = jz.gone = true;
        w.cine(false);
      }
      S.add(w.also(L.patrol(ru, w))); S.add(w.also(L.patrol(us, w)));
      S.add(banter(w, [
        [420, ru, 'I smell a matinee price at a evening show!'],
        [1150, ru, 'Come on out, freeloader! I don\'t bite. Hard.'],
        [1800, us, 'I make seven dollars an hour. Please be nobody.'],
        [2450, us, 'Hello? I\'m supposed to say "halt". ...Halt?'],
        [3050, ru, 'I got your scent, boy! It\'s INTEGRITY! It stinks!'],
      ], 1.2));
      w.toast('HOLD S BEHIND A PROP TO HIDE. STAY OUT OF THE LIGHT.', 8);
      w.objective('SNEAK PAST THE USHERS TO SCREEN 4');
      const guards = [ru, us];
      let tick = 0, caught = ru;
      yield () => {
        if (AUTO()) { p.x = Math.min(3300, p.x + 520 * w.dt); w.alert = 0; return p.x > 3250; }   // the headless run just walks through
        const hidden = p.state === 'crouch' && w.bg.hideSpots.some((h) => Math.abs(p.x - h.x) < h.w / 2 + 12);
        let seen = 0;
        w.beams.length = 0;
        for (const g of guards) {
          const len = 340, dx = (p.x - g.x) * g.face;
          let s = 0;
          if (!hidden && p.y > -150) { if (dx > 0 && dx < len + 20) s = 1.3 - dx / len; else if (Math.abs(p.x - g.x) < 64) s = 1.3; }
          w.beams.push({ x: g.x + g.face * 46, y: g.y - 118, dir: g.face, len, hot: s > 0 });
          if (s > seen) { seen = s; caught = g; }
        }
        w.alert = U.clamp(w.alert + (seen > 0 ? seen * 2.1 : -0.9) * w.dt, 0, 1);
        if (seen > 0) { tick -= w.dt; if (tick <= 0) { tick = 0.16; A().sfx('detect', { pitch: 0.8 + w.alert }); } }
        return w.alert >= 1 || p.x > 3250;
      };
      w.beams.length = 0; w.objective(null);
      if (w.alert >= 1) {
        A().sfx('alert'); p.pose('stagger', 20, 'shock');
        L.bark(caught, caught.id === 'ruckus' ? 'I KNEW I SMELLED A FREELOADER!' : 'UM. SIR? HALT? PLEASE?', '#ffe36e');
        yield 1.1;
        yield* w.fail(caught.id === 'ruckus' ? 'Ruckus: "Got him! I\'m havin\' this flashlight bronzed."' : 'Usher: "I caught one? Oh no. Now there\'s paperwork."');
        return;
      }
      w.alert = 0;
      yield* w.fadeOut(0.4);
      S.end();
    }, function* (w) {                             /* 4. the butter run: fifteen seconds of free condiments */
      const S = stage(w), p = w.player, Q = voiceQ(w);
      S.add(Q.co);
      w.setBg('lobby'); w.music('stealth', 0.75); w.place(3060, 1); w.noFight = true; w.zoom = 1.3; w.alert = 0;
      const gd = w.npc('granddad', 3200, { face: -1, pose: 'handsHips' }), jz = w.npc('jazmine', 3285, { face: -1, expr: 'worry' }), ri = w.npc('riley', 3350, { face: -1, pose: 'lean' });
      const ca = w.npc('manager', 1730, { variant: 1, face: 1 });
      yield* w.fadeIn(0.3);
      if (!w.flags.butter) {
        w.flags.butter = true;
        w.cine(true); w.look(3180, 1.4); p.face = 1;
        yield* w.say('granddad', 'There you are. What took you so long? We been standing by this door like people with tickets.', 'scowl');
        yield* w.say('huey', 'Two grown men with flashlights were hunting me like a fugitive.', 'deadpan');
        yield* w.say('granddad', 'And yet here you stand. That\'s the Freeman way. Now. Emergency. I popped a whole trash bag of popcorn at the house, but it\'s dry as a sermon.', 'worry');
        yield* w.say('jazmine', 'It\'s in my backpack too. Under the chicken. Everything in there is the same temperature now.', 'worry');
        yield* w.say('granddad', 'They got a butter pump at that concession. The pump is FREE. The napkins is FREE. The salt is FREE.', 'scowl');
        yield* w.say('granddad', 'I won\'t pay these people one dime. But I will be DAMNED if I leave free butter on the table. Fill my thermos.', 'scowl');
        yield* w.say('huey', 'You want me to go back. Past Ruckus. For condiments.', 'deadpan');
        yield* w.say('granddad', 'Previews almost over! You got fifteen seconds before the part where the plane don\'t take off. GO!', 'shout');
        w.cine(false);
      }
      w.bubble(ri, 'Get me a straw! I ain\'t got a drink, I just want it!');
      let done = false, ok = true;
      const errand = S.add(w.also((function* () {
        yield* w.collect([
          { x: 2940, name: 'FREE SALT', col: '#ffffff', on() { Q.say(ri, 'Clock is ticking! Heist rules!'); } },
          { x: 1830, name: 'FORTY FREE NAPKINS', col: '#f6edd0', on() { Q.say(ca, 'Sir, that is... a lot of napkins.'); } },
          { x: 1640, name: 'THERMOS OF FREE BUTTER', col: '#ffd23a', on() { Q.say(ca, 'That pump is for POPCORN. Sir. SIR.'); } },
        ], 'FILL THE THERMOS AT THE CONCESSION');
        yield* w.goTo(3120, 'RUN THE BUTTER BACK TO SCREEN 4');
        done = true;
      })()));
      if (AUTO()) yield () => done && Q.idle(); else ok = yield* w.timed(15, () => done);
      errand.stop();
      if (!ok) { yield* w.fail('The previews ended. Granddad ate the popcorn dry and blamed you for the next forty years.'); return; }
      w.cine(true); w.look(3180, 1.4); p.face = 1;
      yield* w.say('granddad', 'Mmm. You taste that? That\'s the taste of not paying. Everybody inside. Walk like you bought something.', 'grin');
      yield* w.say('riley', 'Where my straw at?', 'scowl');
      yield* w.say('huey', 'I want it understood that I am going in there to get my family OUT. I am not watching this movie.', 'scowl');
      yield* w.say('granddad', 'Sure you ain\'t. Hold the foot bath.', 'smirk');
      yield* w.fadeOut(0.4);
      S.end(); w.cine(false);
    },
    function* (w) {                                /* 5. screen four: the Night Manager, with an audience */
      const S = stage(w), p = w.player;
      w.setBg('theater'); w.music('duel', 0.4); w.place(450, 1); w.noFight = false; w.alert = 0; w.zoom = 1.3;
      w.minX = 250; w.maxX = 1250;
      const ri = w.npc('riley', 70, { face: 1, pose: 'cheer', idle: 'cheer', expr: 'grin', z: -1 }), jz = w.npc('jazmine', 135, { face: 1, pose: 'cower', idle: 'cower', expr: 'worry', z: -1 });
      const gd = w.npc('granddad', 200, { face: 1, pose: 'armsCrossed', idle: 'armsCrossed', z: -1 });
      const c1 = w.npc('guest', 1310, { face: -1, pose: 'armsCrossed', z: -1 }), c2 = w.npc('tux', 1400, { face: -1, variant: 1, z: -1 });
      yield* w.fadeIn(0.4);
      if (!w.flags.met) {
        w.flags.met = true;
        const m0 = w.npc('manager', 1620, { face: -1, prop: 'nunchaku', pose: 'stance', idle: 'stance' });
        w.cine(true); w.look(620, 1.25); p.face = -1;
        yield* w.narr('"Soul Jet 2" opens with a man in a dress falling down the stairs of an airplane for nine minutes. The audience wept. So did I, for different reasons.');
        yield* w.say('riley', 'HA! He fell AGAIN! Same stairs! This is CINEMA!', 'grin');
        yield* w.say('granddad', 'Pass the chicken. And scoot over, my feet soaking.', 'grin');
        yield* w.say('huey', 'We\'re leaving. All of us. Right now. This movie is a crime scene.', 'scowl');
        A().sfx('alert'); p.face = 1; w.look(820, 1.3);
        yield* w.walk(m0, 1050, 320, 'run');
        yield* w.say('manager', 'Screen four. Row F. Four seats nobody paid for, one whole chicken, and a foot bath. Do you know how long I have waited for this? I have a laminated plan.', 'angry');
        yield* w.say('manager', 'I am the Night Manager. I was a stuntman once. I fell down stairs for a living. Then they gave my part to a man in a dress.', 'scowl');
        yield* w.say('granddad', 'Huey! Handle that! And keep it down, I\'m at a good part!', 'scowl');
        yield* w.say('huey', 'There are no good parts.', 'deadpan');
        yield* w.say('manager', 'Our policy on outside food... is VIOLENCE.', 'shout');
        m0.gone = true;
        w.cine(false);
      }
      const b = w.foe('manager', 1050, { hp: 230, boss: true, ai: L.managerAI, prop: 'nunchaku', title: 'FELL DOWN STAIRS FOR A LIVING', speed: 230, idle: 'stance', block: 0.4 });
      const crowd = [
        [c1, 'DOWN IN FRONT!'], [gd, 'Fight QUIETER! I can\'t hear the plane!'], [ri, 'Hit him with his own chucks!'],
        [c2, 'Is this part of the movie? It\'s better than the movie.'], [jz, 'We\'re sorry! We\'re so sorry! Have a wing!'],
        [b, 'I did my own stunts in "Fist Airport"!'], [c1, 'Kick him on the LEFT, kid! I can\'t see!'],
        [gd, 'Jazmine, pass the hot sauce. The emergency one.'], [ri, 'Somebody film this! That\'s my brother! Kinda!'],
        [b, 'This beating has a two-drink minimum!'], [jz, 'Is this jail? Is this what jail is like?'],
      ];
      S.add(w.also((function* () {
        for (let i = 0; ; i++) { const [f, s] = crowd[i % crowd.length]; if (!f.dead && !f.gone) w.bubble(f, s); yield U.rand(2.6, 3.6); }
      })()));
      yield* w.duel(b, { banner: 'SHOWTIME!', ko: 'NO REFUNDS.' });
      w.bubble(c2, 'Two thumbs up for the small angry one!');
      yield 1.4;
      yield* w.fadeOut(0.4);
      S.end();
    }, function* (w) {                             /* 6. thrown out: a refund for tickets nobody bought */
      const S = stage(w), p = w.player;
      w.setBg('lobby'); w.music('stealth', 0.15); w.place(1250, -1); w.noFight = true; w.zoom = 1.3; w.alert = 0;
      const gd = w.npc('granddad', 1130, { face: -1, pose: 'handsHips' }), ri = w.npc('riley', 1050, { face: -1, pose: 'lean' }), jz = w.npc('jazmine', 970, { face: -1, expr: 'worry' });
      const ru = w.npc('ruckus', 1400, { variant: 1, face: -1, prop: 'flashlight', pose: 'flashlight', idle: 'flashlight', expr: 'grin' });
      const mg = w.npc('manager', 350, { face: 1, pose: 'stagger', expr: 'pain' });
      yield* w.fadeIn(0.4);
      S.add(w.follow(ru, 130));
      const walks = [S.add(w.also(w.walk(gd, 520, 210, 'walk'))), S.add(w.also(w.walk(ri, 450, 230, 'walk'))), S.add(w.also(w.walk(jz, 590, 200, 'walk')))];
      const nag = S.add(w.also((function* () {
        yield () => p.x < 1180 && !w.cineOn; w.bubble(ru, 'Keep it movin\'! Left, right, left, FREELOADERS!'); yield 1.7;
        yield () => p.x < 960 && !w.cineOn; w.bubble(gd, 'Get that flashlight out my back!'); yield 1.7;
        yield () => p.x < 780 && !w.cineOn; w.bubble(ru, 'Banned! All y\'all! Banned for LIFE!'); yield 1.7;
      })()));
      yield* w.goTo(660, 'GET THROWN OUT WITH DIGNITY');
      if (AUTO()) yield () => nag.done;
      for (const c of walks) c.stop();
      w.cine(true); w.look(520, 1.35); p.face = -1;
      gd.x = 520; ri.x = 450; jz.x = 590; gd.face = ri.face = jz.face = -1;
      gd.rig.setPose('point', 12); ri.rig.setPose('lean', 12); jz.rig.setPose('stand', 12);
      yield* w.say('ruckus', 'And STAY out! I\'m puttin\' all four of your pictures up by the register. Right next to the fella who brought a live fish.', 'grin');
      yield* w.say('granddad', 'Fine by me! That movie was some bullshit. I want my money back.', 'scowl');
      yield* w.say('manager', 'Sir. You did not buy tickets.', 'pain');
      yield* w.say('granddad', 'I paid with my TIME. I paid with my DIGNITY. That man fell down them stairs nine times and not once did I feel represented!', 'shout');
      yield* w.say('manager', 'I cannot refund a ticket that does not exist.', 'pain');
      yield* w.say('granddad', 'And whose fault is that? Thirteen dollars! You PRICED me into a life of crime!', 'angry');
      const a = yield* w.choice('huey', 'BACK GRANDDAD UP?', ['He has a point about the price.', 'I\'d like to return the movie. Barely used.', 'Refund us for the first Soul Jet too.']);
      if (a === 0) {
        yield* w.say('huey', 'He does have a point about the price.', 'deadpan');
        yield* w.say('manager', 'It is thirteen dollars BECAUSE of people who sneak in!', 'angry');
        yield* w.say('granddad', 'So I been holding your prices up all these years? Then I want a commission!', 'grin');
      } else if (a === 1) {
        yield* w.say('huey', 'I would like to return the movie. It\'s barely used. I only watched it under protest.', 'deadpan');
        yield* w.say('manager', 'You watched forty minutes!', 'angry');
        yield* w.say('huey', 'I want those back as well.', 'deadpan');
      } else {
        yield* w.say('huey', 'While we\'re here, refund us for the first Soul Jet too.', 'deadpan');
        yield* w.say('ruckus', 'Soul Jet One was a MASTERPIECE! Taught me never to board no airplane, bus or elevator run by anybody who look like me!', 'grin');
        yield* w.say('huey', 'You drive the school bus, Ruckus.', 'deadpan');
        yield* w.say('ruckus', 'And I don\'t trust myself one bit!', 'grin');
      }
      jz.rig.setPose('cheer', 12);
      yield* w.say('jazmine', 'I\'ll pay! I have thirteen dollars! Take it! I just want to stop being a criminal!', 'worry');
      yield* w.say('granddad', 'Jazmine, NO! That\'s how they get you!', 'shock');
      yield* w.say('manager', 'Thank you, young lady. ONE of you is forgiven.', 'grin');
      gd.rig.setPose('pointUp', 12);
      yield* w.say('granddad', 'Hold on now. She paid. That means we got a ticket. That means somebody in this building owes ME a seat.', 'smirk');
      yield* w.say('ruckus', 'OUT!', 'shout');
      yield* w.say('riley', 'Ay, can we at least get the chicken back?', 'smirk');
      yield* w.say('ruckus', 'That chicken is EVIDENCE. Delicious, delicious evidence.', 'grin');
      yield* w.fadeOut(0.4);
      S.end(); w.cine(false);
    }],
    *outro(w) {
      w.setBg('block'); w.music('house', 0);
      const bx = BX(w);
      w.place(bx(2300), 1);
      const gd = w.npc('granddad', bx(2430), { face: -1, pose: 'armsCrossed' }), ri = w.npc('riley', bx(2180), { face: 1, pose: 'lean' }), jz = w.npc('jazmine', bx(2070), { face: 1, expr: 'worry' });
      w.look(bx(2300), 1.35);
      yield* w.fadeIn(0.5);
      yield* w.narr('We were banned for life from the Woodcrest Twelve. Granddad says it doesn\'t count, because officially we were never there.');
      yield* w.say('granddad', 'Thirteen dollars. And they wonder why people steal.', 'scowl');
      w.player.face = -1;
      yield* w.say('riley', 'So how it end? Do the plane ever take off?', 'smirk');
      yield* w.say('huey', 'No. That\'s the whole movie. It\'s called "Still Delayed".', 'deadpan');
      yield* w.say('riley', '...Dang. That\'s deep.', 'shock');
      yield* w.say('huey', 'It is not deep.', 'deadpan');
      yield* w.say('jazmine', 'I\'m telling my daddy everything. And the police. And my teacher.', 'worry');
      yield* w.say('granddad', 'Snitches don\'t get pound cake.', 'deadpan');
      yield* w.say('jazmine', '...I didn\'t see anything.', 'worry');
      yield* w.narr('I never got one person to boycott that movie. It made two hundred million dollars. Part three is in production. Granddad can\'t wait. He refuses to pay.');
      gd.gone = ri.gone = jz.gone = true;
    },
  });
})();
