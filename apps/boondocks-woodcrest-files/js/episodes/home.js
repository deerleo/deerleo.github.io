/* home.js: Episode "Home Alone". Granddad escapes, Camp Ruckus, a forged letter, Huey's balanced budget,
 * Riley's jailbreak, the airsoft civil war, and the belt that restores order. */
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
      end() { for (const c of cos) c.stop(); for (const f of w.fighters) if (f !== w.player) f.gone = true; w.bubbles.length = 0; w.objective(null); w.mark = null; w.lock = false; w.look(null); },
    };
  };
  /** the block backdrop is 4200 wide; if it has not landed yet the fallback street is narrower, so scale positions to fit */
  const BX = (w) => { const wide = w.bg.width; return (x) => (wide >= 4000 ? x : Math.round(x * (wide - 120) / 4200)); };
  /** bubbles keyed to where Huey is: [[x or test(), npc, 'line'], ...] (a number means "has walked past x, heading right") */
  const banter = (w, beats, gap) => w.also((function* () {
    for (const [c, f, s] of beats) { yield () => (typeof c === 'number' ? w.player.x >= c : c()) && !w.cineOn; w.bubble(f, s); yield gap || 1.7; }
  })());
  /** the headless run teleports Huey, so let the walking banter finish before moving on */
  function* drain(co) { if (AUTO()) yield () => co.done; }

  /* Camp Ruckus work detail: [key, objective, what the warden hollers] */
  const CHORES = [
    ['light', 'SCRUB THE FLOOR', 'Scrub in circles! Circles was invented in Norway!'],
    ['light', 'SCRUB IT AGAIN', 'Again! That floor still got your attitude on it!'],
    ['heavy', 'BEAT THE RUG', 'Beat that rug like it owe Mister Wuncler money!'],
    ['jump', 'DUST THE CEILING FAN', 'Hop to it! Idle feet is how jazz got started!'],
    ['guard', 'HOLD THE BUCKET', 'Hold that bucket HIGH! That\'s my church bucket!'],
    ['dash', 'RUN THE TRASH OUT', 'Faster! That trash got places to be, unlike you!'],
    ['heavy', 'FLUFF THE CHAIR', 'Fluff my chair! A warden needs lumbar support!'],
    ['light', 'POLISH THE WHISTLE', 'Now shine my whistle. Don\'t look at it direct!'],
  ];
  const DO = { light: 'jab', heavy: 'slam', jump: 'cheer', guard: 'hold', dash: 'dash' };
  const GRIPE = ['This is child labor!', 'My hands is for counting money!', 'I\'m telling Granddad! When he pick up!', 'I got a cramp in my whole body!'];

  BD.episode({
    id: 'home', title: 'HOME ALONE', src: 'inspired by Season 2, Episode 12', bg: 'house',
    blurb: 'Granddad takes a vacation from his grandsons. First Uncle Ruckus runs the house, then Huey does. Riley has two airsoft pistols and a grievance.',
    loss: 'Riley: "Say it. Say Young Reezy run this house. I got four thousand pellets and all day."',
    *intro(w) {
      w.setBg('house', { dark: 0 }); w.music('house', 0.25); w.place(600, -1);
      const gd = w.npc('granddad', 330, { face: 1, pose: 'cheer', expr: 'grin' }), ri = w.npc('riley', 790, { face: -1, pose: 'lean' });
      w.look(540, 1.4);
      yield* w.narr('My grandfather loves us. He says so every time he is leaving.');
      yield* w.say('granddad', 'Three days! No kids! No cooking! No "Granddad, Riley set the mailbox on fire"! Just me, a buffet, and whoever\'s standing at the buffet!', 'grin');
      yield* w.say('riley', 'Where you even going?', 'scowl');
      yield* w.say('granddad', 'AWAY from you. That\'s the whole itinerary.', 'grin');
      yield* w.say('huey', 'What are the rules while you\'re gone?', 'deadpan');
      gd.rig.setPose('think', 12);
      yield* w.say('granddad', 'Rules. Right. I got rules. Rule one: don\'t touch my stuff. Rule two: don\'t touch each other. Rule three... no soup.', 'worry');
      yield* w.say('huey', 'No soup?', 'deadpan');
      gd.rig.setPose('handsHips', 12);
      yield* w.say('granddad', 'I\'m making these up as I go, Huey, work with me. Rule four: whatever happens in this house, I do NOT want to know. That\'s the main one.', 'scowl');
      yield* w.say('riley', 'So we home alone? For real? No grown-ups?', 'grin');
      yield* w.say('granddad', 'Hell no. I ain\'t crazy. I got you a babysitter. He\'s free, and he hates fun. He\'s perfect.', 'smirk');
      const ru = w.npc('ruckus', -90, { face: 1 });
      A().sfx('bell');
      yield* w.walk(ru, 170, 200, 'walk');
      yield* w.say('ruckus', 'Uncle Ruckus, no relation, reportin\' for duty! I brought my own whistle and my own disappointment.', 'grin');
      yield* w.say('huey', 'You\'re leaving us with RUCKUS?', 'shock');
      gd.rig.setPose('cheer', 12);
      yield* w.say('granddad', 'He works for free and he brought a whistle! Love y\'all! Don\'t call!', 'grin');
      w.bubble(gd, 'I\'M FREE! THANK YOU, JESUS!');
      yield* w.walk(gd, -160, 440, 'run');
      yield* w.say('ruckus', 'Now then. Let us discuss the word "chore". It\'s from the Latin. Means "what you was put here for".', 'scowl');
      yield* w.fadeOut(0.3);
      gd.gone = ri.gone = ru.gone = true;
    },
    phases: [function* (w) {                       /* 1. Camp Ruckus: work detail, with lectures */
      const S = stage(w), p = w.player;
      w.setBg('house', { dark: 0 }); w.music('house', 0.5); w.place(520, 1); w.zoom = 1.35; w.noFight = true;
      const ru = w.npc('ruckus', 760, { face: -1, pose: 'handsHips' }), ri = w.npc('riley', 330, { face: 1, pose: 'crouch', idle: 'crouch', expr: 'scowl' });
      yield* w.fadeIn(0.3);
      yield* w.talk(ru, 'REPORT TO THE WARDEN FOR WORK DETAIL', (function* () {
        yield* w.say('ruckus', 'Welcome to Camp Ruckus. Wake-up is four in the mornin\'. Lights out is whenever I get tired of lookin\' at you.', 'grin');
        yield* w.say('ruckus', 'Your granddaddy been raisin\' you soft. Television. Opinions. SOCKS. When I was your age I had one sock, and I shared it with a mule.', 'scowl');
        yield* w.say('riley', 'Man, we ain\'t doing no chores. You ain\'t our daddy.', 'scowl');
        yield* w.say('ruckus', 'And I thank the Lord for that every single night. Now grab a toothbrush. This floor ain\'t gon\' scrub itself.', 'grin');
      })());
      w.toast('WORK DETAIL: PRESS THE KEY SHOWN WHEN IT APPEARS.', 6);
      w.lock = true;
      let good = 0;
      for (let i = 0; i < CHORES.length; i++) {
        const [key, name, line] = CHORES[i];
        w.objective('WORK DETAIL: ' + name); p.pose('crouch', 14, 'deadpan'); ru.rig.setPose('point', 14);
        A().sfx('detect', { pitch: 2 }); w.bubble(ru, line);
        yield 1.4;
        const hit = yield* w.qte([key], { window: 1.2, gap: 0.2 });
        w.lock = true;
        if (hit) { good++; p.pose(DO[key], 22, 'scowl'); FX.dust(p.x + 40, 0, 4, '#d9cfbb'); }
        else { p.pose('shrug', 14, 'deadpan'); w.bubble(ru, 'WRONG! You scrub like a man with opinions!'); }
        yield 0.6;
        if (i % 2) { w.bubble(ri, GRIPE[i >> 1]); yield 0.9; }
        ru.rig.setPose('handsHips', 12);
      }
      w.lock = false; w.objective(null);
      w.cine(true); w.look(600, 1.4); p.face = 1;
      if (good >= 6) yield* w.say('ruckus', 'Hm. Adequate. Tomorrow we do the roof. Then the neighbors\' roof. Then we apologize to both roofs.', 'scowl');
      else yield* w.say('ruckus', 'Pitiful. I seen a possum do better work, and he was deceased. Tomorrow we start over. At THREE.', 'scowl');
      yield* w.say('ruckus', 'I\'ll be in your granddaddy\'s chair, eatin\' your granddaddy\'s ham. Wake me if somebody important calls.', 'grin');
      yield* w.walk(ru, 640, 150, 'walk');
      ru.rig.setPose('sit', 10); p.face = -1;
      yield* w.say('riley', 'Huey. I can\'t do three days of this. I got soft hands. I\'m a artist.', 'worry');
      yield* w.say('huey', 'He just told us how to get rid of him.', 'deadpan');
      yield* w.say('riley', 'He did?', 'shock');
      yield* w.say('huey', '"If somebody important calls." Ruckus will do anything for anyone he thinks is above him. We just need someone above him.', 'deadpan');
      yield* w.say('riley', 'That\'s EVERYBODY. He told us that hisself. Twice.', 'smirk');
      yield* w.say('huey', 'Exactly. Keep him busy. I need stationery.', 'sly');
      yield* w.fadeOut(0.3);
      S.end(); w.cine(false);
    }, function* (w) {                             /* 2. the scheme: official stationery, an innocent courier */
      const S = stage(w), p = w.player;
      w.setBg('block'); w.music('stealth', 0.3); w.zoom = 1.3; w.noFight = true;
      const bx = BX(w);
      w.place(bx(780), 1);
      const vr = w.npc('ruckus', bx(690), {}), vy = w.npc('riley', bx(660), {});   // voices from inside the house
      vr.hidden = vy.hidden = true;
      const tom = w.npc('tom', bx(1590), { face: -1 }), jz = w.npc('jazmine', bx(1500), { face: -1 });
      yield* w.fadeIn(0.3);
      const talk = S.add(banter(w, [
        [bx(840), vr, 'I HEAR SOMEBODY NOT SCRUBBIN\'!'],
        [bx(980), vy, 'It\'s me! I\'m not scrubbing over here!'],
        [bx(1120), vr, 'Where the bushy-headed one at?!'],
        [bx(1260), vy, 'Bathroom! Reading! It take him HOURS!'],
      ]));
      yield* w.goTo(bx(1400), 'SLIP OUT TO THE DUBOIS HOUSE');
      yield* drain(talk);
      let letter = 0;
      yield* w.talk(tom, 'ASK TOM DUBOIS FOR A FAVOR', (function* () {
        yield* w.say('tom', 'Huey! Hi! Is everything alright over there? I heard a whistle. And crying. I assumed it was a... a sports thing.', 'worry');
        yield* w.say('huey', 'Mr. DuBois, I need a sheet of your office letterhead and your official stamp.', 'deadpan');
        yield* w.say('tom', 'My letterhead? For what? No! Don\'t tell me! If you tell me and it\'s a crime, I\'m an accessory! Do you know what happens to accessories in prison?!', 'shock');
        const a = yield* w.choice('huey', 'TELL TOM:', ['It\'s for a school project.', 'It\'s to forge a letter from a billionaire.', 'You don\'t want to know.']);
        if (a === 0) yield* w.say('tom', 'A school project. Good. That is what I\'ll say under oath. "He told me it was a school project." Oh God, I\'m already rehearsing testimony.', 'worry');
        else if (a === 1) yield* w.say('tom', 'LA LA LA LA! I didn\'t hear "forge"! I heard "forage"! He\'s going foraging! That\'s legal in most counties!', 'shock');
        else yield* w.say('tom', 'You\'re right. I don\'t. Thank you for respecting my deniability. Nobody ever respects my deniability.', 'worry');
        yield* w.say('tom', 'Here. Take it. I never saw you. ...I\'m sorry, stamp. I\'m so sorry. You deserved better.', 'worry');
        yield* w.say('jazmine', 'Ooh, are you writing a letter? Can I help? I have glitter pens!', 'grin');
        yield* w.say('huey', 'I need you to deliver it, Jazmine. Ruckus trusts you.', 'deadpan');
        yield* w.say('jazmine', 'He does! He says I have "the good posture"!', 'grin');
        letter = yield* w.choice('huey', 'THE LETTER FROM "MISTER WUNCLER" SAYS:', ['Come wash my golf balls. All nine thousand.', 'My yacht is upset. Come apologize to it.', 'Report at once to be thanked in person.']);
        yield* w.narr('I wrote it in my best billionaire. Short sentences. No "please". Jazmine added a sticker.');
      })());
      S.add(w.follow(jz, 110));
      const back = S.add(banter(w, [
        [() => p.x < bx(1300), jz, 'Mr. Wuncler writes to Mr. Ruckus? That\'s so NICE!'],
        [() => p.x < bx(1080), jz, 'Official mail needs a sticker. It\'s a unicorn.'],
        [() => p.x < bx(900), vr, 'WHO TOLD YOU YOU COULD BLINK?!'],
      ]));
      yield* w.goTo(bx(760), 'WALK JAZMINE AND THE LETTER BACK HOME');
      yield* drain(back);
      yield* w.fadeOut(0.3);
      S.end();
      w.setBg('house', { dark: 0 }); w.music('house', 0.2); w.place(430, 1);
      const ru = w.npc('ruckus', 640, { face: -1, pose: 'sit', idle: 'sit' }), ri = w.npc('riley', 920, { face: -1, pose: 'crouch', idle: 'crouch' }), j2 = w.npc('jazmine', 300, { face: 1 });
      w.cine(true); w.look(520, 1.4);
      yield* w.fadeIn(0.3);
      yield* w.say('jazmine', 'Mr. Ruckus! A letter came for you! It\'s from Mr. Wuncler! It has a stamp AND a sticker!', 'grin');
      ru.rig.setPose('cheer', 14);
      yield* w.say('ruckus', 'For ME? From HIM? In WRITIN\'?! Sweet merciful heavens. Read it, child. My eyes ain\'t worthy.', 'shock');
      if (letter === 0) {
        yield* w.say('jazmine', '"Ruckus. Come wash my golf balls. All nine thousand. Bring your own water."', 'grin');
        yield* w.say('ruckus', 'NINE THOUSAND! And he trusts me to pick the WATER! This is the happiest day of my natural life!', 'grin');
      } else if (letter === 1) {
        yield* w.say('jazmine', '"Ruckus. My yacht is upset. Come apologize to it. Use its full name."', 'grin');
        yield* w.say('ruckus', 'I been WAITIN\' on that boat to forgive me! I know its full name AND its maiden name!', 'grin');
      } else {
        yield* w.say('jazmine', '"Ruckus. Report at once to be thanked in person. Wear shoes."', 'grin');
        yield* w.say('ruckus', 'THANKED? In PERSON? I\'ll wear BOTH shoes!', 'grin');
      }
      yield* w.say('ruckus', 'Y\'all on your own! Camp Ruckus is closed on account of DESTINY!', 'shout');
      yield* w.walk(ru, -140, 420, 'run');
      ri.rig.setPose('cheer', 12);
      yield* w.say('riley', 'It WORKED? That {n} ain\'t even check the handwriting!', 'grin');
      yield* w.say('jazmine', 'Wait. The letter wasn\'t real? Did I LIE? Am I a liar now?!', 'worry');
      yield* w.say('huey', 'You\'re a courier. Couriers aren\'t liable.', 'deadpan');
      yield* w.say('jazmine', 'Oh, okay! ...What\'s "liable"?', 'grin');
      yield* w.say('riley', 'We FREE! No Ruckus! No rules! I\'m about to eat cereal out the BOX in Granddad chair!', 'grin');
      yield* w.say('huey', 'No. Somebody has to run this house. Somebody responsible.', 'scowl');
      yield* w.say('riley', 'Aw, hell.', 'worry');
      yield* w.fadeOut(0.3);
      S.end(); w.cine(false);
    },
    function* (w) {                                /* 3. the Huey administration: four spending requests */
      const S = stage(w);
      w.setBg('house', { dark: 0 }); w.music('house', 0.3); w.place(420, 1); w.zoom = 1.35; w.noFight = true;
      const ri = w.npc('riley', 900, { face: -1, pose: 'lean' });
      yield* w.fadeIn(0.3);
      yield* w.interact(640, 'POST THE NEW HOUSEHOLD BUDGET', 'POST');
      w.cine(true); w.look(660, 1.45);
      yield* w.narr('Granddad left an emergency fund: two hundred and six dollars in an envelope marked "DO NOT". I drafted a seventy-two hour budget.');
      yield* w.say('huey', 'New rules. Bedtime at nine. Lentils at six. All spending requests come through me, in person, with a justification.', 'deadpan');
      yield* w.say('riley', 'You sound like Ruckus with a library card.', 'scowl');
      w.cine(false);
      const REQ = [function* () {
        yield* w.say('riley', 'I need forty dollars for a chain. It\'s a investment. Chains go UP.', 'smirk');
        const a = yield* w.choice('huey', 'RULING ON: ONE CHAIN, $40', ['Denied. Jewelry is not a food group.', 'Approved, if you can define "investment".', 'What is the chain made of?']);
        if (a === 0) yield* w.say('riley', 'You can\'t eat RENT neither, {n}, and Granddad pay that every month!', 'scowl');
        else if (a === 1) { yield* w.say('riley', 'It\'s when you buy something and then you look rich. Boom. Defined.', 'grin'); yield* w.say('huey', 'Denied.', 'deadpan'); }
        else { yield* w.say('riley', 'Gold. Colored. Metal.', 'smirk'); yield* w.say('huey', 'Denied.', 'deadpan'); }
      }, function* () {
        yield* w.say('riley', 'Sixty dollars. Spinning rims.', 'smirk');
        yield* w.say('huey', 'You don\'t own a car.', 'deadpan');
        yield* w.say('riley', 'For my BIKE.', 'grin');
        const a = yield* w.choice('huey', 'RULING ON: SPINNING BIKE RIMS, $60', ['Your bike has training wheels.', 'The fund is for emergencies.', 'Tabled, pending review.']);
        if (a === 0) yield* w.say('riley', 'So that\'s FOUR rims. See, you don\'t even know the math on this.', 'smirk');
        else if (a === 1) yield* w.say('riley', 'My bike looking broke IS a emergency! People SEE me on that!', 'shock');
        else yield* w.say('riley', 'Tabled? We ain\'t even AT a table. You just making up government words.', 'scowl');
      }, function* () {
        yield* w.say('riley', 'Two hundred dollars. They selling exotic pets on the late-night channel. I want a tiger. A small one.', 'grin');
        const a = yield* w.choice('huey', 'RULING ON: ONE TIGER (SMALL), $200', ['Where would it sleep?', 'What does a tiger eat, Riley?', 'Denied on moral, legal and financial grounds.']);
        if (a === 0) yield* w.say('riley', 'Your room. You don\'t use it for nothing but books and being mad.', 'smirk');
        else if (a === 1) yield* w.say('riley', 'The mailman. He come every day. It\'s like a subscription.', 'smirk');
        else yield* w.say('riley', 'That\'s only three grounds! A tiger got FOUR legs!', 'shock');
        yield* w.say('huey', 'Denied.', 'deadpan');
      }, function* () {
        yield* w.say('riley', 'Five dollars. One pizza. I\'m hungry for REAL, Huey.', 'worry');
        const a = yield* w.choice('huey', 'RULING ON: ONE PIZZA, $5', ['There are lentils in the pantry.', 'Pizza is budgeted for Thursday.', 'Fill out a hunger form.']);
        if (a === 0) yield* w.say('riley', 'LENTILS? I asked for food, {n}, not gravel!', 'shock');
        else if (a === 1) yield* w.say('riley', 'It\'s MONDAY! Thursday is like a year from now!', 'shock');
        else yield* w.say('riley', 'A hunger FORM? This ain\'t a house no more. This a government office with a couch!', 'shock');
        ri.rig.setPose('point', 14);
        yield* w.say('riley', 'You know what this is? Some bullshit. A dictatorship. You WORSE than Ruckus. At least Ruckus let us look at the ham.', 'angry');
        yield* w.say('huey', 'It\'s called fiscal discipline.', 'deadpan');
        yield* w.say('riley', 'I\'m calling Granddad.', 'scowl');
        yield* w.say('huey', 'Phone privileges are suspended. Go to your room.', 'deadpan');
        yield* w.say('riley', 'You can\'t ground me! You TEN!', 'shout');
        yield* w.narr('I could, and I did. In hindsight, locking the door from the outside is where my administration lost the public.');
      }];
      const SPOT = [900, 260, 1040, 700];
      const CALL = ['Ay, Mr. President! I got a request!', 'Aight, new request! Hear me out!', 'Okay okay okay. Think BIGGER.', 'Fine! FINE. A small one.'];
      for (let i = 0; i < REQ.length; i++) {
        if (i) yield* w.walk(ri, SPOT[i], 280, 'walk');
        w.bubble(ri, CALL[i]);
        yield* w.talk(ri, 'HEAR RILEY\'S SPENDING REQUEST (' + (i + 1) + ' OF 4)', REQ[i]());
      }
      yield* w.fadeOut(0.3);
      S.end();
    }, function* (w) {                             /* 4. the jailbreak: chase Riley and the emergency fund through the house */
      const S = stage(w), p = w.player;
      w.setBg('house', { dark: 0 }); w.music('stealth', 0.5); w.place(600, 1); w.zoom = 1.3; w.noFight = true;
      const cell = w.npc('riley', 1490, { y: -210, face: -1 });   // a voice behind the bedroom door
      cell.hidden = true;
      yield* w.fadeIn(0.3);
      w.cine(true); w.look(900, 1.15, -70);
      yield* w.narr('Day two of my administration. The budget was balanced and the prisoner was secure. I allowed myself a moment of satisfaction. That was the mistake.');
      w.cine(false);
      w.objective('ENJOY YOUR BALANCED BUDGET');
      w.bubble(cell, 'AY! I know my rights! I get a phone call!'); yield 2;
      w.bubble(p, 'You get lentils at six.'); yield 1.8;
      w.bubble(cell, 'I\'ma remember this when I\'m rich!'); yield 1.8;
      A().sfx('glass'); BD.cam.shake(0.3);
      yield 0.7;
      cell.gone = true;
      yield* w.goTo(1470, 'CHECK ON THE PRISONER (JUMP UP TO THE LANDING)', { y: -210 });
      const ri = w.npc('riley', 640, { face: 1, pose: 'cheer', idle: 'cheer', expr: 'grin' });
      w.cine(true); w.look(1300, 1.2, -90);
      yield* w.narr('Bedsheets, knotted, out the window. An eight-year-old had beaten my security. I should have seen it coming. I taught him that knot.');
      w.look(760, 1.2, -60); p.face = -1;
      yield* w.say('riley', 'Looking for THIS? Two hundred and six dollars, {n}! I\'m about to buy a tiger AND a pizza for the tiger!', 'grin');
      yield* w.say('huey', 'Riley. Put the emergency fund down.', 'scowl');
      yield* w.say('riley', 'This IS the emergency! Come catch me! ...You can\'t. I\'m built low to the ground!', 'grin');
      w.cine(false);
      const SPOTS = [200, 1040, 520];
      const TAUNT = ['Too slow! Little legs, BIG dreams!', 'Can\'t tax what you can\'t catch!', 'I\'m spending it in my MIND right now!'];
      const pin = () => { w.mark = { x: ri.x, y: ri.y - ri.hh - 34 }; };
      for (let i = 0; i < SPOTS.length; i++) {
        w.objective('CATCH RILEY');
        const run = S.add(w.also(w.walk(ri, SPOTS[i], 430, 'run')));
        yield () => { pin(); return run.done; };
        ri.face = p.x > ri.x ? 1 : -1; ri.rig.setPose('cheer', 14); w.bubble(ri, TAUNT[i]);
        yield () => { pin(); return AUTO() || (Math.abs(p.x - ri.x) < 90 && p.y > -80); };
        A().sfx('dash'); FX.dust(ri.x, 0, 5, '#d9cfbb'); FX.text(ri.x, -150, 'JUKED!', '#ffe36e');
        yield 0.25;
      }
      w.mark = null; w.objective(null);
      w.bubble(ri, 'Upstairs! My room got a ARMORY!');
      yield* w.walk(ri, 1090, 430, 'run');
      yield* ri.hop(340, -1160);                   // up onto the landing
      yield* w.walk(ri, 1500, 380, 'run');
      ri.gone = true;
      const r2 = w.npc('riley', 1500, { y: -210, face: -1, prop: 'pistol', pose: 'aim', idle: 'aim', vars: { goggles: true }, expr: 'smirk' });
      yield* w.goTo(1330, 'CHASE HIM UP TO THE LANDING (JUMP)', { y: -210 });
      w.cine(true); w.look(1400, 1.4, -95); p.face = 1; r2.face = -1;
      yield* w.say('riley', 'You wanna run this house like a prison? Then congratulations, warden. You got a RIOT.', 'smirk');
      yield* w.say('huey', 'Give me the envelope, Riley.', 'scowl');
      yield* w.say('riley', 'Come get it. I got two pistols, four thousand pellets, and nothing to live for till Thursday.', 'grin');
      yield* w.say('huey', 'Those are toys.', 'deadpan');
      r2.rig.setPose('recoil', 30); A().sfx('bb_shot'); A().sfx('glass'); FX.spark(843, -292, 10, '#ffdf9a', 260); BD.cam.shake(0.3);
      yield* w.wait(0.5);
      r2.rig.setPose('aim', 14);
      yield* w.say('riley', 'Tell that to Granddad\'s lamp.', 'smirk');
      yield* w.narr('And that is how the Freeman Civil War began. Like most civil wars: over money, between brothers, in the living room.');
      yield* w.fadeOut(0.3);
      S.end(); w.cine(false);
    },
    function* (w) {                                /* 5. the Freeman Civil War */
      const S = stage(w), p = w.player;
      w.setBg('house', { dark: 0 }); w.music('house', 0.7); w.place(420, 1); w.zoom = 1.3; w.noFight = false;
      const b = w.foe('riley', 1100, { hp: 220, boss: true, ai: L.rileyAI, prop: 'pistol', vars: { goggles: true }, name: 'Young Reezy', title: '4,000 PELLETS AND A GRIEVANCE', speed: 300, idle: 'aim', expr: 'smirk', downT: 0.5 });
      yield* w.fadeIn(0.3);
      w.toast('PARRY (L) A PELLET TO SEND IT RIGHT BACK.', 7);
      w.bubble(b, 'Welcome to the revolution, warden!');
      const TALK = [
        [p, 'You are fighting a war over pizza.'], [b, 'This for the tiger I never got!'],
        [p, 'Lentils are a complete protein.'], [b, 'You fed me GRAVEL, {n}!'],
        [p, 'You were grounded for forty minutes.'], [b, 'I was a political prisoner!'],
        [p, 'Every pellet comes out of your allowance.'], [b, 'Young Reezy don\'t negotiate with bitch-ass budgets!'],
        [p, 'I kept minutes. Granddad gets a full report.'], [b, 'Snitching on your own WAR? That\'s cold!'],
      ];
      S.add(w.also((function* () {
        yield 2.4;
        for (let i = 0; ; i++) { const [f, s] = TALK[i % TALK.length]; if (!b.dead) w.bubble(f, s); yield f === p ? 2.3 : U.rand(3.2, 4.6); }
      })()));
      S.add(w.also((function* () {
        yield () => w.st.dark > 0; yield 0.9;
        if (!b.dead) w.bubble(p, 'You shot out the lights. Granddad will end us both.');
        yield () => !!b.data.fists; yield 1.3;
        if (!b.dead) w.bubble(p, 'Four thousand pellets. You hit the house with all of them.');
      })()));
      yield* w.duel(b, { banner: 'CIVIL WAR!', ko: 'BUDGET ENFORCED.' });
      w.cine(true); w.look((p.x + b.x) / 2, 1.4);
      yield* w.say('riley', 'Okay! OKAY! I surrender! ...Can we still get the pizza?', 'pain');
      yield* w.say('huey', 'The emergency fund has eleven pellet holes in it.', 'deadpan');
      yield* w.say('riley', 'So it\'s like... coins now?', 'worry');
      A().sfx('thud');
      yield* w.wait(0.6);
      yield* w.say('huey', '...That was a car door.', 'shock');
      yield* w.say('riley', 'We could run. Change our names. I always wanted to be a "Dante".', 'worry');
      yield* w.fadeOut(0.4);
      S.end(); w.cine(false);
    }, function* (w) {                             /* 6. Granddad returns: the belt */
      const S = stage(w), p = w.player;
      w.setBg('house', { dark: 0.55 }); w.music('house', 0.1); w.place(700, -1); w.zoom = 1.35; w.noFight = true;
      const ri = w.npc('riley', 830, { face: -1, pose: 'cower', idle: 'cower', expr: 'worry' });
      const gd = w.npc('granddad', -110, { face: 1, expr: 'grin' });
      yield* w.fadeIn(0.4);
      w.cine(true); w.look(560, 1.35);
      yield* w.walk(gd, 330, 200, 'walk');
      gd.rig.setPose('cheer', 12);
      yield* w.say('granddad', 'I\'m HOME! Three days, two buffets, and a widow named Dolores who thinks I own a boat! Best trip of my...', 'grin');
      gd.rig.setPose('stand', 8); gd.rig.expr = 'shock';
      yield* w.wait(0.8);
      yield* w.say('granddad', 'Why is there a hole in my lamp? Why is there a hole in my TV? Why is there a hole in the picture of ME?', 'shock');
      yield* w.say('riley', 'Huey locked me in my room and fed me gravel!', 'worry');
      yield* w.say('huey', 'Riley stole the emergency fund and shot the house.', 'deadpan');
      yield* w.say('riley', 'Ruckus made us scrub the floor with a toothbrush!', 'worry');
      yield* w.say('granddad', 'And where is Ruckus?', 'scowl');
      yield* w.say('huey', 'On an errand for a billionaire who doesn\'t know about it. It\'s a long story.', 'deadpan');
      gd.rig.prop = 'belt'; gd.rig.setPose('beltHold', 12); A().sfx('whoosh');
      yield* w.say('granddad', 'I don\'t want the long story. Rule four! I said whatever happens, I do NOT want to know. And now I KNOW.', 'angry');
      yield* w.say('granddad', 'So here\'s what\'s about to happen. I start with the belt. When this arm gets tired, I switch arms. When THAT arm gets tired, I take a nap, wake up refreshed, and finish.', 'scowl');
      const a = yield* w.choice('huey', 'LAST WORDS:', ['For the record, I ran a surplus.', 'Riley started it.', 'How was the vacation?']);
      if (a === 0) { yield* w.say('huey', 'For the record, I ran a surplus.', 'deadpan'); yield* w.say('granddad', 'A surplus? Good. That pays for the lamp. The whooping is complimentary.', 'smirk'); }
      else if (a === 1) { yield* w.say('riley', 'SNITCH!', 'shock'); yield* w.say('granddad', 'Relax. I brought enough belt for the whole class.', 'smirk'); }
      else { yield* w.say('huey', 'How was the vacation?', 'deadpan'); yield* w.say('granddad', 'It was BEAUTIFUL. They had a tower made of shrimp. Now hold still, you ruining the memory.', 'grin'); }
      yield* w.walk(gd, p.x - 150, 240, 'walk');
      w.cine(false);
      const SWING = ['jump', 'dash', 'jump', 'guard', 'dash', 'jump'];
      const HOLLER = ['This one\'s for my LAMP!', 'Hold STILL! I\'m on a schedule!', 'This one\'s for the TV!', 'Don\'t you block me, boy!', 'Come back here! I got corns!', 'And THIS one is for the picture of ME!'];
      const MOVE = { jump: 'jump', dash: 'dash', guard: 'guard' };
      w.toast('DODGE THE BELT: PRESS THE KEY SHOWN.', 5);
      w.lock = true;
      let dodged = 0;
      for (let i = 0; i < SWING.length; i++) {
        w.objective('SURVIVE THE BELT'); w.objN = SWING.length - i;
        p.pose('stand', 12, 'deadpan'); p.face = -1; gd.face = 1; gd.rig.setPose('overW', 14); w.bubble(gd, HOLLER[i]);
        yield 1.2;
        const hit = yield* w.qte([SWING[i]], { window: 0.9, gap: 0.1 });
        w.lock = true;
        gd.rig.setPose('over', 40); A().sfx('whoosh_heavy');
        if (hit) { dodged++; p.pose(MOVE[SWING[i]], 30, 'deadpan'); FX.text(p.x, -170, 'MISSED!', '#9fe8ff'); }
        else { p.pose('hurt', 30, 'pain'); A().sfx('slap'); FX.flash(0.3, '#ff2a2a'); FX.text(p.x, -170, 'OW', '#ff6a4a'); BD.cam.shake(0.3); }
        yield 0.7;
        if (i === 2) { w.bubble(ri, 'Get him, Granddad! I mean... stay strong, Huey!'); yield 1; }
        gd.rig.setPose('beltHold', 12);
      }
      w.lock = false; w.objective(null);
      w.cine(true); w.look(640, 1.4);
      if (dodged >= 5) yield* w.say('granddad', 'Hold on. Hold on. I\'m winded. ...Riley. Come here. You slower.', 'worry');
      else yield* w.say('granddad', 'Whew. That\'s the good stuff. Riley! You next. I\'m all warmed up.', 'grin');
      yield* w.say('riley', 'I SURRENDERED! There\'s rules about that!', 'shock');
      yield* w.say('granddad', 'Rule one was don\'t touch my stuff. You touched ALL of it. With bullets.', 'angry');
      yield* w.fadeOut(0.4);
      S.end(); w.cine(false);
    }],
    *outro(w) {
      w.setBg('house', { dark: 0 }); w.music('house', 0); w.place(580, 1);
      const gd = w.npc('granddad', 860, { face: -1, pose: 'handsHips' }), ri = w.npc('riley', 690, { face: 1, pose: 'sit', expr: 'pain' });
      w.player.pose('sit', 12, 'deadpan');
      w.look(700, 1.4);
      yield* w.fadeIn(0.5);
      yield* w.narr('Order was restored that evening. By belt. It turns out every government this house has ever had answers to the same thing.');
      yield* w.say('huey', 'Was it worth it? The trip.', 'deadpan');
      yield* w.say('granddad', 'Boy, I ate crab legs for three days and nobody asked me for NOTHING. I\'d let y\'all burn this house to the dirt for one more night of that.', 'grin');
      yield* w.say('riley', 'So... you ain\'t mad?', 'worry');
      yield* w.say('granddad', 'Oh, I\'m furious. I\'m just also relaxed. That\'s what a vacation DOES.', 'smirk');
      yield* w.say('granddad', 'Matter of fact, I already booked the next one. Ruckus said he\'d watch y\'all again. For free.', 'grin');
      yield* w.say('riley', 'Aw, HELL naw!', 'shock');
      yield* w.say('huey', 'I would like to formally request the belt instead.', 'deadpan');
      yield* w.narr('Granddad regrets nothing. He left again the following month. He took the lamp with him.');
      gd.gone = ri.gone = true;
    },
  });
})();
