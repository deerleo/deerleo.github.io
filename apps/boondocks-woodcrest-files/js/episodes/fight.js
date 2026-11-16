/* fight.js: "Granddad's Fight". Part one of the Stinkmeaner saga (continued in strikes.js and hate.js). */
(() => {
  'use strict';
  const BD = window.BD, U = BD.U, FX = BD.FX, L = BD.Lib, cam = BD.cam;
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
  /** one lick of the cane */
  function* whack(w, s, v, txt) {
    s.rig.setPose('swingW', 20); yield* w.wait(0.2);
    s.rig.setPose('swing', 40); A().sfx('cane'); A().sfx('hit_heavy'); cam.shake(0.3);
    FX.text(v.x, v.y - v.hh - 24, txt || 'WHACK!', '#ffe36e'); FX.spark(v.x, v.y - 120, 6, '#ffffff', 220);
    v.rig.setPose('hurt', 40); v.rig.expr = 'pain';
    yield* w.wait(0.4); s.rig.setPose('caneLean', 12);
  }

  BD.episode({
    id: 'fight', title: 'GRANDDAD\'S FIGHT', src: 'inspired by Season 1, Episode 4', bg: 'lot',
    blurb: 'A blind old man whoops Granddad in a mall parking lot, on camera. Granddad wants a rematch. Huey wants everybody to live. Nobody asked Huey.',
    loss: 'Stinkmeaner: "I ain\'t see that whoopin\'. Heard it, though. Sounded expensive."',
    *intro(w) {
      w.def.seen = {};
      yield* open(w, 'lot', {}, 'house', 0.2, 430, 1);
      const gd = w.npc('granddad', X(580), { face: -1, pose: 'point', expr: 'grin' }), ri = w.npc('riley', X(300), { face: 1, pose: 'lean' });
      w.look(X(450), 1.4);
      yield* w.narr(`Saturday. The Woodcrest Galleria. Granddad had circled the parking lot for forty minutes, because he will not walk more than eleven steps to a store.`);
      yield* w.say('granddad', `There! Right by the door! That space is MINE. I been stalkin' it since the pretzel place opened.`, 'grin');
      yield* w.say('riley', `Granddad, we passed like two hundred spaces. I coulda been inside and banned already.`, 'scowl');
      gd.rig.setPose('handsHips', 12);
      yield* w.say('granddad', `Those were WALKIN' spaces. I marched in the sixties so I would never have to walk again.`, 'scowl');
      yield* w.say('huey', `That is not what the marching was for.`, 'deadpan');
      yield* w.say('granddad', `You wasn't there.`, 'deadpan');
      yield* w.narr(`Neither was he, as far as anyone has been able to confirm.`);
      yield* w.narr(`I mention all this so you understand what a man is willing to die for. In my grandfather's case: a parking space near a pretzel.`);
      yield* w.fadeOut(0.4);
      gd.gone = ri.gone = true;
    },
    phases: [function* (w) {
      /* 1: the parking lot. Huey tries diplomacy; diplomacy loses in eleven seconds. */
      yield* open(w, 'lot', {}, 'house', 0.3, 520, 1);
      const gd = w.npc('granddad', X(1080), { face: 1, pose: 'handsHips' }), ri = w.npc('riley', X(900), { face: 1, pose: 'lean' });
      const s = w.npc('stink', X(1330), { face: -1 });
      const g1 = w.npc('guest', X(1560), { face: -1 }), g2 = w.npc('tux', X(1680), { face: -1 }), g3 = w.npc('guest', X(1800), { face: -1, variant: 2 });
      w.noFight = true;
      yield* w.fadeIn(0.3);
      yield* w.goTo(X(960), 'CATCH UP WITH GRANDDAD AT THE PARKING SPACE');
      w.cine(true); w.look(X(1180), 1.3);
      A().sfx('crash'); cam.shake(0.6); FX.flash(0.5);
      gd.rig.setPose('stagger', 20); gd.rig.expr = 'shock';
      yield* w.narr(`A 1987 sedan the colour of a nicotine stain reversed across three lanes into Granddad's bumper. The driver did not brake. The driver could not see.`);
      gd.rig.setPose('point', 14);
      yield* w.say('granddad', `MY CAR! Hey! HEY! You hit my car, you blind old fool!`, 'shout');
      yield* w.say('stink', `Blind? {N}, I been blind since the doctor slapped me, and I slapped that {n} right back. I park by SOUND.`, 'grin');
      yield* w.say('stink', `Your raggedy car was just sittin' there bein' quiet. Like a bitch. That's on you.`, 'smirk');
      yield* w.say('granddad', `You can't park by SOUND!`, 'shout');
      yield* w.say('stink', `Just did. Heard a space, took it, heard you cryin', enjoyed it. Three good things today and it ain't even noon.`, 'grin');
      let i = yield* w.choice('huey', 'DE-ESCALATE', [`Gentlemen. It is a bumper.`, `Let's exchange insurance details.`, `Granddad. He is blind. Walk away.`]);
      w.player.pose('shrug', 12, 'deadpan');
      if (i === 0) {
        yield* w.say('huey', `Gentlemen. It is a bumper. People fix bumpers every day and nobody has to bleed.`, 'deadpan');
        yield* w.say('stink', `Who that? Sound like a small {n} with a big-ass head. I can hear the wind goin' around it.`, 'grin');
        w.bubble(ri, `He got you, Huey.`);
      } else if (i === 1) {
        yield* w.say('huey', `Let's just exchange insurance details and go home.`, 'deadpan');
        yield* w.say('stink', `Insurance? I ain't had insurance since the insurance company met me. They PAID me to leave.`, 'grin');
      } else {
        yield* w.say('huey', `Granddad. He is blind and he is eighty. There is no version of this you win. Walk away.`, 'deadpan');
        yield* w.say('stink', `Listen to the lil' {n}, Freeman. Walk away. Walk real slow, so I can hear you bein' a coward the whole trip.`, 'grin');
      }
      yield* w.say('stink', `And you, old {n}. You smell like discount aftershave and a man who claps when the plane lands.`, 'smirk');
      yield* w.say('stink', `I can HEAR how ugly you is. Your face makin' a noise. Sound like a wet shoe.`, 'grin');
      yield* w.say('riley', `Granddad, this {n} COOKIN' you! Say somethin'! Say somethin' about his momma!`, 'grin');
      gd.rig.setPose('think', 12);
      yield* w.say('granddad', `Your... your momma's so old...`, 'worry');
      yield* w.say('stink', `My momma's dead, {n}, and she STILL hit harder than you. Next.`, 'grin');
      i = yield* w.choice('huey', 'TRY AGAIN', [`Sir. What do you actually want?`, `Riley. Stop filming.`, `Everyone here is over seventy.`]);
      if (i === 0) {
        yield* w.say('huey', `Sir. What do you actually want out of this?`, 'deadpan');
        yield* w.say('stink', `I want you to have a bad day, lil' {n}. That's it. That's the whole dream, and I'm livin' it.`, 'grin');
      } else if (i === 1) {
        yield* w.say('huey', `Riley. Put the phone down.`, 'scowl');
        yield* w.say('riley', `Hell no. This the best thing that ever happened to me and it ain't even happenin' to me.`, 'grin');
      } else {
        yield* w.say('huey', `Everyone in this argument is over seventy. Somebody is going to break a hip, and nobody here can afford one.`, 'deadpan');
        yield* w.say('stink', `I got hips I ain't even USED yet! I been savin' one for a {n} just like him!`, 'shout');
      }
      gd.rig.setPose('stance', 12);
      yield* w.say('granddad', `That's IT. I don't care if he's blind. I don't care if he's a hundred. Riley, hold my keys. Huey, hold my blood pressure pills.`, 'angry');
      w.player.pose('point', 12, 'scowl');
      yield* w.say('huey', `Granddad, no. This is exactly how proud men die. In public, over nothing, next to a shopping cart.`, 'scowl');
      yield* w.say('granddad', `I ain't gon' die! He can't even SEE me!`, 'shout');
      yield* w.say('stink', `Don't need to see a whoopin' to deliver one. Mailman don't read the letters.`, 'grin');
      /* the beating: eleven seconds, four licks, one camera */
      ri.rig.setPose('aim', 12); w.look(X(1280), 1.45);
      yield* w.walk(gd, s.x - 110, 200, 'walk'); gd.rig.setPose('stance', 12);
      yield* beat(w, gd, `Put 'em up, old man!`, 1.0);
      yield* whack(w, s, gd); yield* beat(w, s, `LEFT! That was your face!`, 1.1);
      yield* whack(w, s, gd, 'CRACK!'); yield* beat(w, s, `RIGHT! Also your face!`, 1.1);
      yield* beat(w, gd, `OW! MY GOOD EYE!`, 1.2);
      yield* beat(w, g1, `He is so vigorous for a blind man.`, 1.4);
      yield* whack(w, s, gd, 'THWACK!'); yield* beat(w, s, `I can do this by SMELL, {n}!`, 1.2);
      yield* beat(w, ri, `Hands UP, Granddad! ...Nah. Too late.`, 1.4);
      yield* beat(w, g2, `Should we call someone? No. Film it.`, 1.4);
      yield* whack(w, s, gd, 'BONK!'); gd.rig.setPose('down', 20); A().sfx('thud'); cam.shake(0.5);
      yield* beat(w, s, `Eleven seconds! New record!`, 1.4);
      g3.rig.expr = 'shock';
      yield* w.say('stink', `And stay down there with the gum and the receipts, you folding-chair-ass {n}! Now somebody point me at a pretzel.`, 'grin');
      yield* w.narr(`It lasted eleven seconds. I have watched it many times since. There is no technique in it. There is barely gravity in it.`);
      yield* w.say('riley', `Got it. All of it. In landscape.`, 'grin');
      yield* w.narr(`By the time we peeled Granddad off the asphalt, the video had a title, a soundtrack and nine thousand views.`);
      w.cine(false);
      yield* w.fadeOut(0.4);
    },
    function* (w) {
      /* 2: the walk of shame. The whole street has seen the video; Riley is selling it. */
      yield* open(w, 'block', {}, 'house', 0.2, 760, 1);
      const gd = w.npc('granddad', X(650), { face: 1, pose: 'facepalm', idle: 'facepalm', expr: 'worry' });
      const brad = w.npc('guest', X(1000), { face: -1 }), ri = w.npc('riley', X(1250), { face: -1, pose: 'lean' }), tom = w.npc('tom', X(1560), { face: -1, expr: 'worry' });
      const tx = w.npc('tux', X(2250), { face: -1 }), nb = w.npc('guest', X(2700), { face: -1, variant: 1 }), ru = w.npc('ruckus', X(3150), { face: -1, expr: 'grin' });
      w.noFight = true;
      yield* w.fadeIn(0.3);
      if (once(w, 'shame')) {
        w.cine(true); w.look(X(720), 1.45);
        yield* w.narr(`By Monday the video had four hundred thousand views. By Tuesday Riley had monetised it.`);
        yield* w.say('granddad', `I need a newspaper, some prune juice, and for nobody to look at me. Walk in front, Huey. Be tall.`, 'worry');
        yield* w.say('huey', `I'm ten.`, 'deadpan');
        yield* w.say('granddad', `Then be WIDE.`, 'scowl');
        w.cine(false);
      }
      w.follow(gd, 120);
      w.chatter(brad, [`"MY GOOD EYE!" Classic.`, `Eleven seconds, Mr. Freeman!`, `We are all rooting for you. Quietly.`], 300);
      w.chatter(tx, [`"Mailman don't read the letters." Marvellous.`, `So raw. So authentic.`], 300);
      w.chatter(nb, [`We don't see colour. We did see the video.`, `My son made it his ringtone!`], 300);
      yield* w.goTo(X(900), 'WALK GRANDDAD TO THE STORE. AVOID EYE CONTACT.');
      yield* beat(w, brad, `Mr. Freeman! LOVED the video!`);
      yield* beat(w, brad, `You fell SO bravely.`);
      yield* beat(w, gd, `Keep joggin', Brad.`, 1.2);
      yield* w.talk(ri, 'RILEY HAS A TABLE. FIND OUT WHY.', (function* () {
        yield* w.say('riley', `Limited edition. "I GOT WHOOPED BY A BLIND MAN AND ALL I GOT WAS THIS SHIRT." Twenty dollars. Family discount is also twenty dollars.`, 'grin');
        yield* w.say('granddad', `You are SELLIN' my ass-whoopin'?!`, 'shout');
        yield* w.say('riley', `Nah. The whoopin' is free, it's online. I'm sellin' the MEMORY.`, 'smirk');
        yield* w.say('huey', `That is your grandfather's humiliation.`, 'scowl');
        yield* w.say('riley', `And it's doin' NUMBERS. You know how hard it is to go viral? {Ns} be settin' theyself on fire for less.`, 'grin');
      })());
      yield* w.talk(tom, 'GET PAST TOM DUBOIS', (function* () {
        yield* w.say('tom', `Robert! I saw the... I mean I did NOT see the... is your neck supposed to bend like that in the thumbnail?`, 'worry');
        yield* w.say('granddad', `Tom, I will pay you to shut up.`, 'scowl');
        yield* w.say('tom', `That was assault! With a cane! Press charges! He'd go to PRISON, Robert. Do you know what happens in prison? I think about it daily.`, 'shock');
        yield* w.say('granddad', `I ain't callin' the police on a blind man who beat me up. I'd have to SAY it. Out loud. To a man with a notepad.`, 'scowl');
      })());
      yield* w.collect([
        { x: X(1850), name: 'FLYER', on() { w.bubble(gd, `"FREEMAN FOLDS"?! Who printed this?!`); } },
        { x: X(2150), name: 'FLYER', on() { w.bubble(gd, `"NOW IN SLOW MOTION"?!`); } },
        { x: X(2450), name: 'FLYER', on() { w.bubble(gd, `He used the COLOUR ink?!`); } },
        { x: X(2800), name: 'FLYER', on() { w.bubble(gd, `I'ma whoop that boy in landscape.`); } },
      ], 'TEAR DOWN RILEY\'S FLYERS BEFORE GRANDDAD READS THEM');
      yield* beat(w, nb, `We don't see colour. We did see the video.`);
      yield* beat(w, tx, `"Wet shoe." I say it at the club now.`);
      yield* beat(w, gd, `I can HEAR you people!`, 1.2);
      yield* w.talk(ru, 'UNCLE RUCKUS IS WAVING. THIS WILL NOT HELP.', (function* () {
        yield* w.say('ruckus', `Well, well. Robert "Eleven Seconds" Freeman. I watched that video forty times. Twice with my eyes open.`, 'grin');
        yield* w.say('ruckus', `Uncle Ruckus, no relation, has put two dollars on the Colonel. A blind man who hates that hard got the Lord's own left hook.`, 'grin');
        yield* w.say('granddad', `What two dollars? There ain't no bet! There ain't no fight!`, 'shout');
        yield* w.say('ruckus', `Sure there is. Rematch. Saturday. Same parkin' lot. I told the church, the pool supply store and the nice officers at the station.`, 'smirk');
        gd.rig.setPose('point', 14);
        yield* w.say('granddad', `...Saturday. Fine. FINE! I want a rematch! I'ma whoop that blind bastard so bad he's gon' SEE it!`, 'shout');
        const i = yield* w.choice('huey', 'TALK HIM OUT OF IT', [`This is how proud people die.`, `He is blind and eighty-one.`, `There is a third option.`]);
        if (i === 0) {
          yield* w.say('huey', `This is how proud people die, Granddad. Not for a cause. For a parking space and a comment section.`, 'scowl');
          yield* w.say('granddad', `Good speech. Put it on a shirt. Riley'll sell it.`, 'scowl');
        } else if (i === 1) {
          yield* w.say('huey', `He is blind and eighty-one. Win, and you beat up a blind man. Lose, and you lost to one twice.`, 'deadpan');
          yield* w.say('ruckus', `Either way it's a fine afternoon for Uncle Ruckus.`, 'grin');
        } else {
          yield* w.say('huey', `There is a third option, where nobody fights anybody.`, 'deadpan');
          yield* w.say('granddad', `I took that option for seventy years, and look where it got me: Woodcrest.`, 'scowl');
        }
        yield* w.narr(`I warned him. I would like that entered into the record. Nobody in this family keeps a record.`);
        yield* w.say('granddad', `Huey. You know all that karate mess. You gon' train me.`, 'scowl');
        yield* w.say('huey', `It isn't karate.`, 'deadpan');
        yield* w.say('granddad', `I don't care if it's ballet. Make me dangerous by Saturday.`, 'angry');
      })());
      yield* w.fadeOut(0.4);
    }, function* (w) {
      /* 3: the training montage. Huey demonstrates; Granddad attempts. */
      yield* open(w, 'hill', {}, 'duel', 0.35, 700, 1);
      const p = w.player, gd = w.npc('granddad', 880, { face: -1, pose: 'handsHips' }), ri = w.npc('riley', 500, { face: 1, pose: 'aim' });
      const POSE = { light: 'jab', heavy: 'sideKick', guard: 'guard', jump: 'jump', dash: 'dash' };
      const scene = function* (g) { w.cine(true); w.look(790, 1.45); yield* g; w.cine(false); w.look(790, 1.45); };
      const copy = function* (k, line) {
        yield 0.3; p.set('idle'); gd.rig.setPose(POSE[k], 16);
        yield 0.3; gd.rig.setPose(k === 'guard' ? 'cower' : 'hurtGut', 14); gd.rig.expr = 'pain'; w.bubble(gd, line); A().sfx('goof');
        yield 0.9; gd.rig.setPose('handsHips', 10); gd.rig.expr = 'scowl';
      };
      const drill = function* (name, keys, lines, heckle) {
        w.toast(name, 4);
        return yield* w.qte(keys, { window: 1.0, gap: 1.4,
          onHit(k, i) { p.pose(POSE[k], 30, 'scowl'); w.also(copy(k, lines[i])); },
          onMiss() { w.bubble(ri, heckle); } });
      };
      yield* w.fadeIn(0.3);
      yield* scene((function* () {
        if (!once(w, 'train')) return;
        yield* w.narr(`Training. I had six days to turn a seventy-year-old man into a weapon. I would have settled for a man who could touch his own knees.`);
        yield* w.say('granddad', `Alright, sensei. Teach me the secret death touch. The one that stops a {n}'s heart.`, 'grin');
        yield* w.say('huey', `There is no death touch. We start with the stance.`, 'deadpan');
        yield* w.say('granddad', `I got a stance. I been standin' my whole life.`, 'scowl');
      })());
      let hits = yield* drill('DRILL ONE: STRIKING. HIT THE PROMPTS; GRANDDAD COPIES.', ['light', 'light', 'heavy'],
        [`Like this? ...OW. My shoulder said no.`, `I punched and my hip went with it!`, `I kicked! Somethin' came loose! Is that mine?`], `Huey, you teachin' him WRONG.`);
      yield* scene((function* () {
        yield* w.say('riley', `Granddad punch like he tryna find a light switch.`, 'grin');
        yield* w.say('granddad', `I will find YOUR light switch, boy.`, 'angry');
      })());
      hits += yield* drill('DRILL TWO: DEFENCE.', ['guard', 'guard', 'dash'],
        [`I blocked it! With my face, but I blocked it!`, `Hold on. Glasses. ...Now I can SEE how bad I am.`, `I dodged! ...That was a cramp. Count it.`], `Even the sensei slippin'!`);
      yield* scene((function* () {
        yield* w.say('granddad', `Water break.`, 'pain');
        yield* w.say('huey', `It has been ninety seconds.`, 'deadpan');
        yield* w.say('granddad', `Then it's a ninety-second water break. And bring me a sandwich. This is a long war.`, 'scowl');
      })());
      hits += yield* drill('DRILL THREE: THE COMBINATION.', ['jump', 'light', 'heavy', 'dash'],
        [`I jumped! Tell me I jumped!`, `HYAH! ...That one felt professional.`, `Got him! ...Was that the mailbox?`, `I'm lightnin'! I'm... I need to sit down.`], `Yo feet ain't leave the ground, Granddad.`);
      if (hits < 5 && !AUTO()) { yield* w.fail('The student learned nothing, because the teacher demonstrated nothing.'); return; }
      yield* scene((function* () {
        yield* w.say('riley', `Day six update for the fans: this {n} still trash. But he trash with CONFIDENCE.`, 'grin');
        gd.rig.setPose('cheer', 12);
        yield* w.say('granddad', `I feel dangerous. I feel like a panther. A panther with a little arthritis.`, 'grin');
        yield* w.say('huey', `You are stronger than he is, you can see, and you are terrified. That is the entire scouting report.`, 'deadpan');
        yield* w.narr(`Something bothered me. A blind man does not beat a sighted man in eleven seconds. Not without training. Not without a master.`);
        yield* w.narr(`So I did what any reasonable person would do. I followed an eighty-one-year-old stranger around for a day.`);
      })());
      yield* w.fadeOut(0.4);
    },
    function* (w) {
      /* 4: tailing a blind man. He cannot see you. He can hear a moth change its mind. */
      yield* open(w, 'block', {}, 'stealth', 0.4, 900, 1);
      const p = w.player, s = w.npc('stink', X(1350), { face: 1 }), brad = w.npc('guest', X(2450), { face: -1, pose: 'sit' });
      w.noFight = true;
      yield* w.fadeIn(0.3);
      if (once(w, 'tail')) {
        w.cine(true); w.look(X(1150), 1.3);
        yield* w.narr(`Colonel H. Stinkmeaner. Eighty-one. Blind since birth. No known family, which I now understand was the family's decision.`);
        yield* w.narr(`Rule one of tailing a blind man: he cannot see you. Rule two: he can hear a moth change its mind. Do not run near him.`);
        w.cine(false);
      }
      w.toast('HOLD S TO CREEP WHEN YOU ARE CLOSE. NEVER RUN NEAR HIM. DO NOT LOSE HIM.', 8);
      w.objective('TAIL STINKMEANER. HE HEARS EVERYTHING.');
      const swat = function* (txt) {
        s.rig.setPose('swingW', 20); yield* w.wait(0.2);
        s.rig.setPose('swing', 40); A().sfx('cane'); cam.shake(0.2); FX.text(s.x + s.face * 90, -150, txt, '#ffe36e');
        yield* w.wait(0.4); s.rig.setPose('caneLean', 12);
      };
      let far = 0;
      /** shuffle him along to x while the player keeps up quietly. Returns 'heard', 'lost' or null. */
      const tail = function* (x) {
        const dir = x > s.x ? 1 : -1;
        s.face = dir; s.rig.setCycle('shuffle', 6);
        while ((x - s.x) * dir > 0) {
          s.x += dir * (AUTO() ? 520 : 84) * w.dt;
          if (AUTO()) p.x = s.x - dir * 360;       // the headless player keeps a polite distance
          else {
            const d = Math.abs(p.x - s.x), loud = d < 90 || (d < 300 && (Math.abs(p.vx) > 190 || !p.onG));
            w.alert = U.clamp(w.alert + (loud ? 1.7 : -0.6) * w.dt, 0, 1);
            far = d > 780 ? far + w.dt : 0;
            if (w.alert >= 1) return 'heard';
            if (far > 3.5) return 'lost';
          }
          yield;
        }
        s.x = x; s.rig.setPose('caneLean', 10);
        return null;
      };
      const stops = [[X(1800), function* () {
        yield* beat(w, s, `Who put a mailbox here?! COWARD!`, 1.3);
        yield* swat('CLANG!');
        yield* beat(w, s, `That's for the bills!`, 1.3);
        yield* w.narr(`He struck a mailbox without hesitation. Precise. Economical. It is possible he knew the mailbox.`);
      }], [X(2330), function* () {
        yield* beat(w, s, `You breathin' loud as hell.`, 1.3);
        yield* beat(w, s, `You breathe like you owe money.`, 1.4);
        yield* beat(w, brad, `I... thank you? Sir?`, 1.2);
        yield* beat(w, s, `I hate yo shoes. I can HEAR they beige.`, 1.5);
        yield* w.narr(`He identified the colour of a man's shoes by ear. That is not hatred. That is echolocation. That is a discipline.`);
      }], [X(2850), function* () {
        yield* beat(w, s, `Shut up, bird! Nobody asked you!`, 1.3);
        yield* beat(w, s, `Go fly into a window!`, 1.2);
        yield* beat(w, s, `...Yeah. Thought so.`, 1.2);
        yield* w.narr(`He threatened a bird and the bird left town. Animals sense a master. I began to suspect mountains were involved. Possibly a blood oath.`);
      }], [X(3300), function* () {
        yield* swat('SWISH!'); yield* swat('SWISH!');
        yield* beat(w, s, `HYAAH! ...Damn fly.`, 1.3);
        yield* beat(w, s, `I'll find you. I got all day and no friends.`, 1.5);
        yield* w.narr(`Then I saw it. A form so advanced it looked exactly like an old man swatting a fly. Forty years of training, hidden in plain sight.`);
        yield* w.narr(`It all made sense, in the way things do when you have not slept. I could see the whole legend.`);
      }]];
      for (const [x, gag] of stops) {
        const r = yield* tail(x);
        if (r) {
          w.cine(true); w.look(s.x, 1.5); s.face = p.x > s.x ? 1 : -1; s.rig.setPose('point', 14); A().sfx('alert');
          if (r === 'heard') yield* w.say('stink', `I hear sneakers. Cheap ones. Come here, lil' big-head {n}, lemme hear what you look like!`, 'shout');
          else yield* w.narr(`I lost him. An eighty-one-year-old blind man, travelling at one mile an hour, and I lost him.`);
          w.cine(false);
          yield* w.fail(r === 'heard' ? 'Never run near a man who can hear your shoelaces.' : 'Outpaced by a senior citizen with a cane.');
          return;
        }
        w.alert = 0; w.cine(true); w.look(s.x + 60, 1.4);
        yield* gag();
        w.cine(false);
      }
      w.objective(null);
      yield* w.fadeOut(0.8);
    }, function* (w) {
      /* 5: the legend of the Blind Fury, as imagined by a ten-year-old who has not slept */
      yield* open(w, 'ink', {}, 'ink', 0.5, 520, 1);
      yield* w.fadeIn(0.6);
      if (once(w, 'legend')) {
        const s = w.npc('stinkInk', 1260, { face: -1, pose: 'caneLean' }), im = { name: 'Stinkmeaner (imagined)' };
        w.cine(true); w.look(900, 1.15);
        yield* w.narr(`A nameless province. A blind orphan, left at the gate of the Temple of the Unpleasant Mountain.`);
        yield* w.narr(`For forty years the monks taught him the Way of the Hateful Palm. He could hear a heartbeat at a hundred paces, and tell you what was wrong with it.`);
        yield* w.say('stinkInk', `You walk loud for a small {n}. I heard your hair comin' from the next valley.`, 'grin', im);
        yield* w.say('huey', `Master Stinkmeaner. I have come to learn how you destroyed my grandfather.`, 'scowl');
        yield* w.say('stinkInk', `He was in my way. EVERYBODY in my way. That's the first teachin', the last teachin', and the gift shop.`, 'grin', im);
        w.cine(false); s.gone = true;
      }
      const b = w.foe('stinkInk', 1260, { hp: 250, boss: true, ai: L.stinkAI, title: 'THE BLIND FURY (ALLEGEDLY)', speed: 200, idle: 'caneLean', walk: 'stride', expr: 'grin', brk: 60 });
      w.toast('RED "!" = UNBLOCKABLE. PARRY IT OR MOVE.', 6);
      w.also((function* () {
        const lines = [`Forty years on a mountain! No cable!`, `My sensei was a rock. I hated him too.`, `I can hear yo blood pressure, boy!`, `Even my shadow don't like me!`];
        for (let i = 0; ; i++) { yield U.rand(6, 9); if (!b.dead && !w.cineOn) w.bubble(b, lines[i % lines.length]); }
      })());
      w.bubble(b, `I see with my HATE, boy!`);
      yield* w.duel(b, { banner: 'DUEL!', ko: 'IMAGINARY WHOOPING.' });
      yield* w.fadeOut(0.6);
    },
    function* (w) {
      /* 6: the truth, then the rematch. Huey coaches from the corner. */
      yield* open(w, 'lot', {}, 'duel', 0.3, 900, 1);
      const p = w.player, gd = w.npc('granddad', X(1120), { face: 1, pose: 'stance', idle: 'stance' }), s = w.npc('stink', X(1330), { face: -1 });
      const ri = w.npc('riley', X(780), { face: 1, pose: 'aim' }), tom = w.npc('tom', X(680), { face: 1, pose: 'cower', expr: 'worry' }), ru = w.npc('ruckus', X(1560), { face: -1, pose: 'cheer', expr: 'grin' });
      w.npc('guest', X(1700), { face: -1 }); w.npc('tux', X(1810), { face: -1 }); w.npc('guest', X(1920), { face: -1, variant: 1 });
      w.noFight = true;
      yield* w.fadeIn(0.4);
      if (once(w, 'truth')) {
        w.cine(true); w.look(X(1100), 1.3);
        yield* w.narr(`Then I woke up on a bus-stop bench and did what I should have done first. I went to the library.`);
        yield* w.narr(`No temple. No monks. No mountain. The public record says: retired, widowed, banned from four churches and a bowling alley.`);
        yield* w.narr(`Neighbours describe his fighting style as "falls forward, swinging". He never trained a day. He hates so hard he is never afraid. And he got lucky.`);
        yield* w.say('huey', `Granddad. Listen. He has no training and no powers. He is just mean, and you got scared.`, 'deadpan');
        yield* w.say('granddad', `So you sayin' I can TAKE this {n}?`, 'grin');
        yield* w.say('huey', `You could have taken him the first time. You could also still go home.`, 'deadpan');
        yield* w.say('granddad', `Too late. Ruckus sold tickets.`, 'scowl');
        yield* w.say('ruckus', `In this corner! A hero, a patriot, a blind man who hates with the pure heart of a customer service line: Colonel H. Stinkmeaner!`, 'shout');
        yield* w.say('ruckus', `And in the other corner, the fella from the video.`, 'deadpan');
        yield* w.say('tom', `This is an illegal gathering! I am going to count to three, and then... keep counting, probably!`, 'worry');
        yield* w.say('stink', `That you, Freeman? I remember that voice. Sound like a man apologisin' to a waiter. Come get the sequel, {n}.`, 'grin');
        const i = yield* w.choice('huey', 'LAST ADVICE', [`Stay calm. He swings at noise.`, `Whatever happens, do not overdo it.`, `Forget everything I taught you.`]);
        if (i === 0) {
          yield* w.say('huey', `Stay calm. He swings where the noise is. So stop screaming.`, 'deadpan');
          yield* w.say('granddad', `I ain't screamin'! I'm BREATHIN' LOUD!`, 'shout');
        } else if (i === 1) {
          yield* w.say('huey', `Whatever happens, do not overdo it. He is eighty-one.`, 'deadpan');
          yield* w.say('granddad', `Overdo it? Boy, I can barely DO it.`, 'worry');
        } else {
          yield* w.say('huey', `Forget everything I taught you.`, 'deadpan');
          yield* w.say('granddad', `Way ahead of you.`, 'grin');
        }
        w.cine(false);
      }
      w.look(X(1220), 1.35);
      w.toast('YOU ARE IN THE CORNER. CALL THE MOVE: HIT EACH PROMPT IN TIME.', 6);
      const CALL = { guard: 'BLOCK!', dash: 'MOVE!', light: 'JAB!', jump: 'JUMP!', heavy: 'NOW! HIT HIM!' };
      const GPOSE = { guard: 'guard', dash: 'dash', light: 'jab', jump: 'jump', heavy: 'cross' };
      const good = [[s, `Hold still so I can miss you properly!`], [gd, `HE MISSED! I'm a ghost!`], [s, `OW! Who hit me?! Was it the fat one?`], [ri, `Granddad got DEFENCE now?!`],
        [ru, `My two dollars! Colonel! My two dollars!`], [s, `That tickle, {n}! ...Do it again.`], [gd, `And THAT'S for my bumper!`]];
      const bad = [`That one was FREE, {n}!`, `Mailman still deliverin'!`, `I HEARD that hurt!`];
      let missed = 0;
      const act = function* (k, i, ok) {
        yield 0.25;
        if (ok && (k === 'light' || k === 'heavy')) {
          gd.rig.setPose(GPOSE[k], 30); A().sfx('hit_heavy'); cam.shake(0.3); s.rig.setPose('hurt', 40); s.rig.expr = 'pain';
          FX.text(s.x, -230, k === 'heavy' ? 'POW!' : 'BAP!', '#ffe36e');
        } else if (ok) {
          gd.rig.setPose(GPOSE[k], 30); s.rig.setPose('swing', 40); A().sfx('whoosh'); FX.text(gd.x, -230, 'MISSED!', '#9fe8ff');
        } else {
          s.rig.setPose('swing', 40); A().sfx('cane'); cam.shake(0.3); gd.rig.setPose('hurt', 40); gd.rig.expr = 'pain'; FX.text(gd.x, -230, 'WHACK!', '#ff3b3b');
        }
        if (ok) w.bubble(good[i % good.length][0], good[i % good.length][1]); else w.bubble(s, bad[missed++ % bad.length]);
        yield 0.7; gd.rig.setPose('stance', 12); gd.rig.expr = 'angry'; s.rig.setPose('caneLean', 12); s.rig.expr = 'grin';
      };
      const hits = yield* w.qte(['guard', 'dash', 'light', 'guard', 'jump', 'light', 'heavy'], { window: 1.0, gap: 1.5,
        onHit(k, i) { w.bubble(p, CALL[k]); w.also(act(k, i, true)); },
        onMiss(k, i) { w.also(act(k, i, false)); } });
      if (hits < 4 && !AUTO()) {
        gd.rig.setPose('down', 20); w.bubble(ri, `AGAIN?! To the SAME blind man?!`);
        yield 1.4; yield* w.fail('Granddad lost to a blind man twice. Riley is printing new shirts.'); return;
      }
      /* he wins. Then he keeps winning. */
      w.cine(true); w.look(X(1240), 1.45);
      tom.rig.expr = 'shock'; ru.rig.setPose('stand', 10); ru.rig.expr = 'worry';
      yield* w.walk(gd, s.x - 100, 220, 'walk');
      s.rig.setPose('down', 20); A().sfx('thud'); cam.shake(0.5);
      yield* beat(w, p, `Granddad. That's enough.`, 1.2);
      for (const line of [`And THAT'S for my good eye!`, `And THAT'S for "wet shoe"!`, `And THAT'S for the pretzel!`]) {
        gd.rig.setPose('overW', 20); yield* w.wait(0.2); gd.rig.setPose('slam', 40); A().sfx('hit_heavy'); cam.shake(0.35); FX.text(s.x, -120, 'POW!', '#ffe36e');
        yield* beat(w, gd, line, 1.1);
      }
      yield* beat(w, p, `GRANDDAD. ENOUGH.`, 1.2);
      yield* beat(w, ri, `Granddad! He ain't even blockin'!`, 1.4);
      gd.rig.setPose('stagger', 12); gd.rig.expr = 'shock';
      yield* beat(w, gd, `...Why ain't he blockin'?`, 1.6);
    }],
    *outro(w) {
      yield* open(w, 'lot', {}, 'house', 0.1, 980, 1);
      w.npc('stink', X(1330), { face: -1, pose: 'down', expr: 'closed' });
      const gd = w.npc('granddad', X(1200), { face: 1, pose: 'stagger', expr: 'shock' }), ri = w.npc('riley', X(860), { face: 1, pose: 'lean' });
      w.npc('tom', X(1480), { face: -1, pose: 'cower', expr: 'shock' }); w.npc('ruckus', X(1600), { face: -1, expr: 'worry' }); w.npc('guest', X(1740), { face: -1, expr: 'shock' });
      w.look(X(1240), 1.35);
      yield* w.fadeIn(0.5);
      yield* w.narr(`It turns out that if you take a frightened man and train him for six days, he does not become brave. He becomes a frightened man who knows how to hit.`);
      yield* w.say('riley', `Granddad. This {n} done been stopped movin'. You been whoopin' a nap.`, 'worry');
      yield* w.say('ruckus', `Get up, Colonel! I got two dollars and a dream ridin' on you! ...Colonel?`, 'worry');
      yield* w.say('tom', `Oh no. Oh no no no. I'm a lawyer, not a doctor, but I know what "no" looks like!`, 'shock');
      yield* w.narr(`Colonel H. Stinkmeaner was pronounced dead in the parking lot of the Woodcrest Galleria, forty feet from the space that started it.`);
      yield* w.say('guest', `Well. That was much less fun than the first video.`, 'worry');
      gd.rig.setPose('shrug', 12);
      yield* w.say('granddad', `I didn't mean to... I just wanted him to say sorry! Huey! Tell these people I just wanted sorry!`, 'worry');
      yield* w.say('huey', `I told you. In public, over nothing, next to a shopping cart.`, 'deadpan');
      yield* w.say('riley', `So... we ain't postin' this one?`, 'worry');
      yield* w.say('huey', `No.`, 'scowl');
      yield* w.say('riley', `...I already did.`, 'smirk');
      yield* w.fadeOut(0.6);
      yield* open(w, 'house', { dark: 0, ghost: 0 }, 'house', 0, 620, 1);
      w.npc('granddad', 800, { face: -1, pose: 'facepalm' });
      w.look(700, 1.45);
      yield* w.fadeIn(0.6);
      yield* w.narr(`There was no trial. The video was eleven minutes of an eighty-one-year-old man starting it. Granddad got his parking space. He has not used it since.`);
      yield* w.narr(`I keep thinking about what the Colonel wanted. Nothing. He wanted nothing. He just hated, the way other people breathe.`);
      yield* w.narr(`A hatred like that has to go somewhere when the body stops. I assumed it went nowhere.`);
      yield* w.narr(`That was my second stupid theory of the week.`);
    },
  });
})();
