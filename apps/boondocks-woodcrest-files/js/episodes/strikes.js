/* strikes.js: "Stinkmeaner Strikes Back". Part two of the Stinkmeaner saga (after fight.js, before hate.js). */
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
  const SM = { name: 'Stinkmeaner' }, TQ = { name: 'Tom?' };
  const thunder = (w) => w.also((function* () { for (;;) { yield U.rand(5, 9); A().sfx('thunder', { vol: 0.7 }); w.st.flash = 1; w.relight(); yield 0.12; w.st.flash = 0; w.relight(); } })());

  BD.episode({
    id: 'strikes', title: 'STINKMEANER STRIKES BACK', src: 'inspired by Season 2, Episode 4', bg: 'hell',
    blurb: 'Hell could not stand him either. Colonel Stinkmeaner comes back for the Freemans, wearing the softest man in Woodcrest.',
    loss: 'Stinkmeaner: "Tell the Devil I said he still owe me a towel."',
    *intro(w) {
      w.def.seen = {};
      yield* open(w, 'hell', {}, 'possessed', 0.3, 200, 1);
      w.player.hidden = true;
      const s = w.npc('stink', 1000, { face: 1, expr: 'grin' });
      w.look(1030, 1.35);
      yield* w.narr(`Colonel H. Stinkmeaner died in a parking lot and went directly to Hell. No queue. No paperwork. They had been holding his table.`);
      yield* w.narr(`I was not there. I have pieced this together from what he screamed at us later. I believe every word.`);
      yield* w.say('stink', `Is that sulphur? And screamin'? And a whole lake of somebody else's problems? Shiiit. Y'all been HIDIN' this from me?`, 'grin');
      s.face = -1; s.rig.setPose('point', 14);
      yield* w.say('stink', `Hey! You! On the rack! Stop hollerin' off-beat! Some of us tryin' to enjoy the torment!`, 'shout');
      yield* w.narr(`Hell is built on one idea: that people will hate being there. Stinkmeaner loved it. He left reviews.`);
      s.face = 1; s.rig.setPose('caneLean', 12);
      yield* beat(w, s, `Ooh, a pitchfork. Lemme hold it.`, 1.4);
      yield* w.say('stink', `Five stars. Would burn again. The demon with the pitchfork got weak wrists, and I told that {n} so to his face.`, 'grin');
      yield* w.narr(`Within a year the damned were filing complaints. About him. Hell had never needed a complaints department. It had to build one.`);
      yield* w.narr(`So the Devil called him in. By all accounts the Devil is a tired man in a short-sleeved shirt who has been middle management since time began.`);
      yield* w.narr(`He said, and I am paraphrasing a scream: "Colonel, you are bad for morale. The torment only works if I am the worst thing in the room."`);
      s.rig.setPose('point', 14);
      yield* w.say('stink', `Then get a bigger room, you red, pointy, clipboard-havin' bitch-ass {n}.`, 'grin');
      yield* w.narr(`So the Devil made him an offer. Go back up. Take your revenge on the family that sent you here. Stay as long as you like. Please.`);
      s.rig.setPose('think', 12);
      yield* w.say('stink', `Freeman. Robert Freeman. Voice like a man apologisin' to a waiter. Ohhh, I remember. Point me at a body, Lucifer. A soft one.`, 'grin');
      yield* w.narr(`He needed a vessel. Somebody with no hatred in him at all, so there would be plenty of room.`);
      yield* w.narr(`He found the softest man in Woodcrest.`);
      A().sfx('ghost'); FX.flash(0.8, '#b6ff8a');
      yield* w.fadeOut(0.5);
      s.gone = true; w.player.hidden = false;
    },
    phases: [function* (w) {
      /* 1: an ordinary afternoon. Return a casserole dish; watch a man get repossessed. */
      yield* open(w, 'block', {}, 'house', 0.2, 760, 1);
      const gd = w.npc('granddad', X(640), { face: 1, pose: 'handsHips' }), ri = w.npc('riley', X(1000), { face: -1, pose: 'lean' });
      const jz = w.npc('jazmine', X(1300), { face: -1 }), tom = w.npc('tom', X(1580), { face: -1, pose: 'hold' });
      w.noFight = true;
      yield* w.fadeIn(0.3);
      if (once(w, 'tuesday')) {
        w.cine(true); w.look(X(700), 1.45); w.player.face = -1;
        yield* w.narr(`One year later. A Tuesday. Nothing was on fire. In this family that is a warning sign.`);
        yield* w.say('granddad', `Huey! Take this casserole dish back to Tom. He keeps askin' for it with his eyes.`, 'scowl');
        yield* w.say('huey', `You have had it for a year.`, 'deadpan');
        yield* w.say('granddad', `I been GRIEVIN'! I killed a man! ...By accident. In self-defence. At a rematch I scheduled.`, 'shout');
        w.cine(false);
      }
      w.chatter(gd, [`It was a GOOD parkin' space.`, `I sent a fruit basket. To the funeral. Hm.`, `Eleven seconds my ass. I won the sequel.`], 300);
      yield* w.talk(ri, 'RILEY HAS A NEW TABLE. OF COURSE HE DOES.', (function* () {
        yield* w.say('riley', `Anniversary merch. "R.I.P. COLONEL: HE AIN'T SEE IT COMIN'." Thirty dollars. Inflation.`, 'grin');
        yield* w.say('huey', `You are profiting from a dead man.`, 'scowl');
        yield* w.say('riley', `He hated everybody. I'm chargin' everybody. That's tribute, {n}.`, 'smirk');
      })());
      yield* w.talk(jz, 'JAZMINE HAS A QUESTION', (function* () {
        yield* w.say('jazmine', `Hi Huey! Daddy says the mean old man from the video is in a better place now.`, 'grin');
        yield* w.say('huey', `He is not in a better place.`, 'deadpan');
        yield* w.say('jazmine', `Then where is he?`, 'worry');
        yield* w.say('huey', `Statistically? Directly below us.`, 'deadpan');
        yield* w.say('jazmine', `...Under my LEMONADE STAND?!`, 'shock');
      })());
      yield* w.talk(tom, 'RETURN THE CASSEROLE DISH TO TOM', (function* () {
        yield* w.say('tom', `Huey! Oh, the dish! You didn't have to... well, it HAS been a year, but I'd never say that. Did I just say that? I'm so sorry.`, 'worry');
        tom.face = 1;
        yield* w.say('tom', `Sorry, hedge. Did I cut too much? I always cut too much.`, 'worry');
        tom.face = -1;
        yield* w.say('huey', `Tom. Has anyone ever made you angry? Even once?`, 'deadpan');
        yield* w.say('tom', `Angry? No! Well. In 1998 a man took my space at the courthouse. I wrote him a firm note. Then I threw it away. Then I apologised to the bin.`, 'grin');
        yield* w.narr(`I have thought about that answer many times. A man with no hatred in him at all. A house with every door open and nobody home.`);
        A().sfx('thunder'); FX.flash(0.6); cam.shake(0.3); tom.rig.setPose('cower', 12);
        yield* w.say('tom', `Huh. Did it just get cold? I feel a draught in my... soul. Is that a thing? Huey, I feel like somebody is standing in my...`, 'worry');
        A().sfx('thunder'); A().sfx('ghost'); FX.flash(1, '#b6ff8a'); cam.shake(0.7); w.music('possessed', 0.5);
        tom.gone = true;
        const tp = w.npc('tomP', tom.x, { face: -1, pose: 'cheer', expr: 'shout' });
        yield* w.wait(0.4);
        yield* w.say('tomP', `AAAH, that's the stuff! Knees that WORK! Eyes! Is THIS what y'all been lookin' at? It's ugly as hell out here!`, 'shout', TQ);
        jz.face = 1;
        yield* w.say('jazmine', `Daddy?`, 'worry');
        tp.rig.setPose('handsHips', 12);
        yield* w.say('tomP', `Daddy's out, lil' girl. Under new management. Now move, I got a whole street to disappoint.`, 'grin', TQ);
        yield* w.say('huey', `That voice. No. You died. I watched you die next to a shopping cart.`, 'shock');
        yield* w.say('tomP', `And I LOVED it, lil' big-head {n}! Hell got a lake of fire and no rules! But first I got some neighbours to meet.`, 'shout', SM);
        yield* w.walk(tp, tp.x + X(700), 430, 'run');
      })());
      yield* w.fadeOut(0.3);
    },
    function* (w) {
      /* 2: the rampage. Tom's body, Stinkmeaner's mouth, the whole street's problem. */
      yield* open(w, 'block', {}, 'possessed', 0.5, 1500, 1);
      const p = w.player, jz = w.npc('jazmine', X(1380), { face: 1, expr: 'worry' }), tp = w.npc('tomP', X(2100), { face: 1, pose: 'cheer', expr: 'shout' });
      const brad = w.npc('guest', X(2420), { face: -1 }), tx = w.npc('tux', X(3320), { face: -1 });
      const gd = w.npc('granddad', X(640), { face: 1, pose: 'sit' }), ri = w.npc('riley', X(560), { face: 1, pose: 'lean' });
      w.noFight = true;
      yield* w.fadeIn(0.3);
      w.follow(jz, 130);
      w.chatter(jz, [`Huey, what's a "bitch-ass"?`, `Daddy never runs. He says running is for emergencies.`, `Why is Daddy using the words from Riley's music?`, `He said "ass" to a mailbox!`], 420);
      w.also((function* () {
        const taunts = [`Catch me, big-head!`, `These legs is BRAND NEW!`, `I can SEE! Everything's ugly!`, `Woodcrest! I hate ALL y'all!`];
        for (let i = 0; ; i++) { yield U.rand(3, 5); if (!w.cineOn) w.bubble(tp, taunts[i % taunts.length]); }
      })());
      /** he bolts to x; catch up before the clock runs out. He is faster than you. He is louder than everyone. */
      const bolt = function* (x, label, secs) {
        let there = false;
        const side = x > tp.x ? -1 : 1;
        w.also((function* () { yield* w.walk(tp, x, 430, 'run'); tp.face = side; tp.rig.setPose('handsHips', 12); there = true; })());
        w.objective(label);
        const ok = yield* w.timed(secs, () => there && Math.abs(p.x - tp.x) < 200);
        yield () => there || !AUTO();
        w.objective(null);
        if (AUTO()) p.x = tp.x + side * 150;
        if (!ok) { yield* w.fail('Outrun by a prosecutor. In loafers.'); return false; }
        w.cine(true); w.look(tp.x, 1.4); p.face = -side;
        return true;
      };
      if (!(yield* bolt(X(2280), 'CHASE TOM. THAT IS NOT TOM.', 9))) return;
      yield* w.say('tomP', `You! Khaki man! You look like the "before" picture in every advertisement ever made!`, 'shout', SM);
      yield* w.say('guest', `Tom? It's Brad. From the homeowners' association? We carpool?`, 'worry');
      yield* w.say('tomP', `I KNOW who you is, Brad. I been in this body four minutes and I already got fifteen years of wantin' to slap you.`, 'grin', SM);
      yield* beat(w, brad, `Is this about the hedge height?`, 1.3);
      yield* w.say('jazmine', `Daddy said a swear! Daddy said FOUR swears!`, 'shock');
      yield* w.say('huey', `Stinkmeaner! Get out of him. That {n} has a mortgage and a nervous stomach.`, 'scowl');
      yield* w.say('tomP', `Catch me, then! This {n} got a GYM membership! Never used it! The legs is brand new!`, 'grin', SM);
      w.cine(false);
      if (!(yield* bolt(X(3200), 'HE IS HEADING FOR THE WUNCLER GATE', 10))) return;
      yield* w.say('tomP', `And YOU. Standin' at a gate like you invented land. I can finally SEE a rich man, and I gotta say: disappointin'.`, 'smirk', SM);
      yield* w.say('tux', `Mr. DuBois, this is most irregular. I shall be writing a letter.`, 'shock');
      yield* w.say('tomP', `Write it on your forehead, so I can read it while I slap it!`, 'shout', SM);
      yield* beat(w, tx, `Security! ...Oh. I AM security.`, 1.3);
      yield* w.say('jazmine', `Huey, why is Daddy using those words? He told ME those words make your tongue fall off.`, 'worry');
      const i = yield* w.choice('huey', 'TELL JAZMINE SOMETHING', [`The truth.`, `It is a confidence seminar.`, `Cover your ears. Forever.`]);
      if (i === 0) {
        yield* w.say('huey', `Your father is possessed by the ghost of a blind man my grandfather beat to death in a parking lot.`, 'deadpan');
        yield* w.say('jazmine', `...I liked it better before I asked.`, 'worry');
      } else if (i === 1) {
        yield* w.say('huey', `It is a confidence seminar.`, 'deadpan');
        yield* w.say('jazmine', `It's WORKING!`, 'grin');
      } else {
        yield* w.say('huey', `Cover your ears. Both of them. Possibly forever.`, 'deadpan');
        yield* w.say('jazmine', `I can still hear him! He said the A-word about the mailman!`, 'shock');
      }
      yield* w.say('tomP', `Now where that old {n} Freeman stay at? I can smell the discount aftershave from here. Still clappin' when the plane lands!`, 'grin', SM);
      w.cine(false);
      if (!(yield* bolt(X(800), 'HE IS GOING FOR GRANDDAD. RUN.', 15))) return;
      tp.face = -1; gd.rig.setPose('handsHips', 12); w.look(X(720), 1.4);
      yield* w.say('granddad', `Tom? What you runnin' for? You owe somebody? ...Why you lookin' at me like that?`, 'worry');
      yield* w.say('tomP', `Robert. Freeman. I'd know that voice in the dark, and the dark is all I ever had. Still sound like a man apologisin' to a waiter.`, 'grin', SM);
      gd.rig.setPose('stagger', 14);
      yield* w.say('granddad', `...No. Nuh-uh. I buried that {n}. I sent a fruit basket!`, 'shock');
      yield* beat(w, ri, `Granddad look like he seen a ghost.`, 1.3);
      yield* beat(w, gd, `I HAVE, boy!`, 1.2);
      yield* w.say('riley', `Mr. DuBois finna fight Granddad? In OUR yard? Hold on, lemme get my phone. Don't nobody start.`, 'grin');
      yield* w.say('tomP', `Tell these people what you did, {n}! Tell 'em you beat a blind old man to death over a PARKIN' space!`, 'shout', SM);
      yield* w.say('granddad', `It was a GOOD space! ...Boys. In the house. NOW.`, 'shout');
      yield* w.say('huey', `Jazmine. Go home. Tell your mother your father will be late, and possibly dented.`, 'deadpan');
      yield* w.say('jazmine', `Okay. Bye, Daddy! I hope you feel like yourself soon!`, 'worry');
      yield* w.say('tomP', `I feel BETTER than him! Tell your momma she married a doormat!`, 'shout', SM);
      w.cine(false);
      yield* w.fadeOut(0.3);
    }, function* (w) {
      /* 3: three on one in the living room. Two of the three are supervising. */
      yield* open(w, 'house', { dark: 1, ghost: 1 }, 'possessed', 0.8, 760, -1);
      const gd = w.npc('granddad', 1400, { y: -210, face: -1, pose: 'cower' }), ri = w.npc('riley', 1500, { y: -210, face: -1, pose: 'aim' });
      thunder(w);
      yield* w.fadeIn(0.3);
      if (once(w, 'door')) {
        const t0 = w.npc('tomP', 360, { face: 1, pose: 'stance' });
        w.cine(true); w.look(700, 1.2);
        yield* w.narr(`He came through the front door without opening it. That was Tom's shoulder. Tom is going to feel that in the morning.`);
        yield* w.say('granddad', `Huey! You the one that knows kung fu! I'll supervise from up here. Riley, supervise with me!`, 'shout');
        yield* w.say('riley', `It's three on one, Granddad! Them the best odds we ever had!`, 'grin');
        yield* w.say('granddad', `Then why you up here?`, 'scowl');
        yield* w.say('riley', `I'm the cameraman.`, 'smirk');
        yield* w.say('tomP', `I trained in HELL for this, {n}. One whole year. No water breaks. My sparrin' partner was on fire.`, 'grin', SM);
        yield* w.say('huey', `Remember, it is still Tom's body. We need him back in one piece.`, 'deadpan');
        yield* w.say('granddad', `A piece. He said A piece. Hit him, Huey!`, 'shout');
        w.cine(false); t0.gone = true;
      }
      const b = w.foe('tomP', 360, { hp: 340, boss: true, ai: L.tomAI, name: 'Stinkmeaner', title: 'RENTING TOM DUBOIS', speed: 230, idle: 'stance', brk: 70 });
      const calls = [[gd, `Not the lamp! NOT THE... damn.`], [ri, `Mr. DuBois got HANDS?!`], [gd, `That couch is leather-ADJACENT, boy!`], [ri, `He behind you! Other behind!`],
        [gd, `I'm helpin'! I'm prayin' AT him!`], [ri, `This goin' straight on WhoopTube.`], [gd, `Hit him in the lawyer!`], [ri, `Throw yo shoe, Granddad! ...BOTH missed.`]];
      w.also((function* () { for (let i = 0; ; i++) { yield U.rand(4.5, 7); if (!b.dead && !w.cineOn) w.bubble(calls[i % calls.length][0], calls[i % calls.length][1]); } })());
      w.bubble(gd, `Mind the furniture! It's on layaway!`);
      yield* w.duel(b, { banner: 'EVICT HIM!', ko: 'SUBDUED. BARELY.' });
      w.st.flash = 0; w.relight();
      yield* beat(w, ri, `Huey beat up a LAWYER! Is that legal?`, 1.5);
      yield* beat(w, gd, `My lamp. My GOOD lamp.`, 1.4);
      yield* w.fadeOut(0.5);
    },
    function* (w) {
      /* 4: tie him up, with whatever a suburban living room has to offer */
      yield* open(w, 'house', { dark: 0.5, ghost: 0.6 }, 'possessed', 0.3, 720, -1);
      const p = w.player, tp = w.npc('tomP', 600, { face: 1, pose: 'down', expr: 'angry' });
      const gd = w.npc('granddad', 840, { face: -1, pose: 'handsHips' }), ri = w.npc('riley', 440, { face: 1, pose: 'lean' });
      yield* w.fadeIn(0.4);
      if (once(w, 'rope')) {
        w.cine(true); w.look(640, 1.45);
        yield* w.narr(`Forty minutes. One lamp, a coffee table and Granddad's good ottoman. He went down. He did not go OUT.`);
        yield* w.say('granddad', `Tie him up before he gets his second wind! Use the good extension cords. No. The BAD ones. He ain't worth the good ones.`, 'shout');
        w.cine(false);
      }
      w.look(640, 1.45);
      w.toast('HIT THE PROMPTS TO TIE HIM DOWN BEFORE HE WRIGGLES LOOSE.', 6);
      tp.rig.setPose('sit', 10);
      const good = [[tp, `That a knot? My dead momma tie better!`], [ri, `Use the Christmas lights! Make him festive!`], [tp, `I been tied up by DEMONS. They had a union!`],
        [gd, `Not my belt! That belt's for WHOOPIN'!`], [tp, `Loosen the left! This {n} got lawyer wrists!`], [ri, `He look like a angry burrito.`]];
      const hits = yield* w.qte(['light', 'guard', 'heavy', 'dash', 'light', 'jump'], { window: 0.9, gap: 1.3,
        onHit(k, i) { p.pose('hold', 20, 'scowl'); A().sfx('chain'); FX.text(tp.x, -200, 'KNOT!', '#ffe36e'); tp.rig.setPose('sit', 10); w.bubble(good[i][0], good[i][1]); },
        onMiss() { tp.rig.setPose('cheer', 20); cam.shake(0.3); FX.text(tp.x, -200, 'SLIPPED!', '#ff3b3b'); w.bubble(tp, `HA! Y'all tie like y'all fight!`); } });
      p.set('idle');
      if (hits < 4 && !AUTO()) { yield* w.fail('He chewed through the extension cord. With Tom\'s dental plan.'); return; }
      yield* beat(w, ri, `Double knot it. He slippery.`, 1.3);
      w.cine(true); w.look(640, 1.45); tp.rig.setPose('sit', 10);
      yield* w.say('tomP', `Y'all can tie the body. Can't tie the HATE. I'll be here all night, doin' everybody's momma in alphabetical order.`, 'grin', SM);
      yield* w.say('riley', `Do Granddad's!`, 'grin');
      yield* w.say('tomP', `Too easy. She raised THAT.`, 'smirk', SM);
      yield* w.say('granddad', `You leave Mother Freeman out of this! She would've whooped you AND me!`, 'angry');
      yield* w.say('granddad', `We can't keep Tom tied up in my living room. His wife gon' notice. Eventually.`, 'worry');
      yield* w.say('huey', `We need an exorcist.`, 'deadpan');
      yield* w.say('granddad', `A what? We don't have those. We got ushers.`, 'scowl');
      yield* w.say('riley', `I know a {n} who hate everything AND love church.`, 'smirk');
      yield* w.say('huey', `No.`, 'scowl');
      yield* w.say('riley', `Uncle Ruckus.`, 'grin');
      yield* w.say('huey', `I said no.`, 'scowl');
      yield* w.say('granddad', `Go get him.`, 'deadpan');
      w.cine(false);
      yield* w.fadeOut(0.4);
    }, function* (w) {
      /* 5: fetch the exorcist and his instruments */
      yield* open(w, 'block', {}, 'stealth', 0.2, 760, 1);
      const ru = w.npc('ruckus', X(3150), { face: 1, pose: 'hold', expr: 'grin' }), brad = w.npc('guest', X(2400), { face: -1, expr: 'worry' });
      w.noFight = true;
      yield* w.fadeIn(0.3);
      if (once(w, 'gate')) {
        w.cine(true);
        yield* w.narr(`Uncle Ruckus, no relation, has thirty-two jobs in Woodcrest. That morning he was polishing the Wuncler gate with his own shirt. Unpaid. He asked to.`);
        w.cine(false);
      }
      w.chatter(brad, [`Tom called me a "before" picture.`, `Fifteen YEARS he wanted to slap me?`, `The carpool is over. Tell him.`], 320);
      yield* w.talk(ru, 'FIND UNCLE RUCKUS. REGRET IT LATER.', (function* () {
        yield* w.say('ruckus', `Well, if it ain't the little revolutionary. Whatever you sellin', I already reported it.`, 'scowl');
        yield* w.say('huey', `Tom DuBois is possessed by the ghost of Colonel Stinkmeaner. We need... help.`, 'deadpan');
        yield* w.say('ruckus', `The COLONEL? Back from the grave? Finally, some good news in this neighbourhood!`, 'grin');
        yield* w.say('ruckus', `Lucky for you, Uncle Ruckus, no relation, is a certified exorcist. Correspondence course. Out of a state that don't exist no more.`, 'grin');
        yield* w.say('huey', `What is your method?`, 'deadpan');
        yield* w.say('ruckus', `Scripture and a stick. Mostly the stick. You holler at the patient, you whack the patient, and the Lord sorts out who was in there.`, 'smirk');
        yield* w.say('ruckus', `But I need my instruments. I left 'em around the neighbourhood, on account of I work everywhere and get thrown out of most of it.`, 'scowl');
      })());
      w.follow(ru, 140);
      yield* w.collect([
        { x: X(2750), name: 'WHOOPIN\' STICK', on() { w.bubble(ru, `Old Reliable! Blessed by a deacon. Or a dentist.`); } },
        { x: X(2300), name: 'HOLY WATER', on() { w.bubble(ru, `Holy water! Straight from Mr. Wuncler's pool.`); } },
        { x: X(1800), name: 'HYMNAL', on() { w.bubble(ru, `My hymnal! Every song about obedience.`); } },
        { x: X(1250), name: 'CERTIFICATE', on() { w.bubble(ru, `Careful! That certificate's laminated. Almost.`); } },
      ], 'COLLECT THE EXORCIST\'S INSTRUMENTS');
      yield* beat(w, ru, `I once exorcised a vending machine.`);
      yield* beat(w, w.player, `Was it possessed?`, 1.2);
      yield* beat(w, ru, `Gave my dollar back, didn't it?`);
      yield* w.goTo(X(740), 'BRING RUCKUS TO THE FREEMAN HOUSE');
      yield* beat(w, ru, `Smells like debt in here. Let us begin.`, 1.4);
      yield* w.fadeOut(0.4);
    },
    function* (w) {
      /* 6: the exorcism. Three bad ideas, then the only one that works. */
      yield* open(w, 'house', { dark: 0.5, ghost: 0.6 }, 'possessed', 0.3, 760, -1);
      const tp = w.npc('tomP', 600, { face: -1, pose: 'sit', expr: 'angry' }), ru = w.npc('ruckus', 430, { face: 1, pose: 'pointUp', idle: 'handsHips', expr: 'shout' });
      const gd = w.npc('granddad', 900, { face: -1, pose: 'armsCrossed', idle: 'armsCrossed' }), ri = w.npc('riley', 1000, { face: -1, pose: 'lean' });
      const hit = function* (who, txt) {
        who.rig.setPose('overW', 20); yield* w.wait(0.2);
        who.rig.setPose('slam', 40); A().sfx('cane'); cam.shake(0.3); FX.text(tp.x, -210, txt || 'WHACK!', '#ffe36e'); tp.rig.setPose('hurt', 40);
        yield* w.wait(0.45); who.rig.setPose(who.idlePose, 12); tp.rig.setPose('sit', 12);
      };
      yield* w.fadeIn(0.4);
      w.cine(true); w.look(640, 1.4);
      yield* w.say('ruckus', `Stand back, Freemans. You are about to witness a professional. DEMON! By the power of whoever is in charge: OUT!`, 'shout');
      yield* hit(ru);
      yield* beat(w, gd, `Mind the chair! That's a DININ' chair!`, 1.3);
      yield* w.say('tomP', `OW! ...That all? I been hit harder by a hymn.`, 'grin', SM);
      yield* w.say('ruckus', `OUT, I say! Out of this poor, confused, upwardly mobile man!`, 'shout');
      yield* hit(ru, 'THWACK!');
      yield* beat(w, ru, `I felt somethin' move! Might be my back.`, 1.4);
      yield* w.say('tomP', `Ow! Why does... who is hitting me? Uncle Ruckus? Is this about the hedge?`, 'worry', TQ);
      yield* w.say('tomP', `Not now, soft boy! Grown folks is talkin'!`, 'shout', SM);
      yield* w.say('granddad', `It ain't workin'. All he's doin' is tenderisin' Tom.`, 'scowl');
      yield* beat(w, ri, `Hit him again anyway.`, 1.2);
      const ideas = [[`Hit him harder.`, function* () {
        yield* w.say('huey', `Granddad. Your turn.`, 'deadpan');
        yield* w.say('granddad', `Gladly. This is for my LAMP.`, 'angry');
        gd.face = -1; yield* w.walk(gd, 720, 200, 'walk'); yield* hit(gd, 'LAMP!'); yield* w.walk(gd, 900, 200, 'walk'); gd.face = -1;
        yield* w.say('tomP', `Harder! I LIKE it! Every lick you give me, the lawyer gets the bill! He gon' wake up lookin' like a dropped pie!`, 'grin', SM);
        yield* w.narr(`You cannot beat hatred out of a man. It enjoys the attention.`);
      }], [`Reason with him.`, function* () {
        yield* w.say('huey', `Colonel. You scared an old man and broke a lamp. You have your revenge. What else is there?`, 'deadpan');
        yield* w.say('tomP', `What ELSE? Lil' {n}, there's ALWAYS else. I ain't here for a reason. Reasons is for people who plan on stoppin'.`, 'grin', SM);
        yield* w.say('riley', `That's kinda hard, though.`, 'smirk');
        yield* w.say('huey', `Do not write that down.`, 'scowl');
      }], [`Give him what he wants.`, function* () {
        yield* w.say('huey', `Fine. What do you want? Name it.`, 'deadpan');
        yield* w.say('tomP', `I want Freeman to say it. "Colonel, you whooped me fair and square in that parkin' lot."`, 'smirk', SM);
        yield* w.say('granddad', `I'd rather keep the ghost.`, 'deadpan');
        yield* w.say('tomP', `SEE? He gets it! That's hate, baby! That's the good stuff!`, 'grin', SM);
      }], [`Let the two of them talk.`, function* () {
        yield* w.say('huey', `Everybody stop. Uncle Ruckus. Tell the Colonel what you think of this neighbourhood.`, 'deadpan');
        yield* w.say('ruckus', `Woodcrest? Went downhill the day they let the Freemans in. And me. I wrote the board a letter opposin' myself.`, 'scowl');
        yield* w.say('tomP', `...Go on.`, 'neutral', SM);
        yield* w.say('ruckus', `I hate jazz. I hate potlucks. I hate when a man says "happy holidays" like he ain't got the nerve to pick one.`, 'scowl');
        yield* w.say('tomP', `I hate birds. Little flyin' rats with opinions.`, 'scowl', SM);
        yield* w.say('ruckus', `I once reported a pigeon to the police!`, 'grin');
        yield* w.say('tomP', `What for?`, 'neutral', SM);
        yield* w.say('ruckus', `Loiterin'!`, 'shout');
        tp.rig.setPose('cheer', 12);
        yield* w.say('tomP', `HA! Well, I'll be damned. Again. You alright, fat man. First {n} I met, up here or down there, who hates it ALL.`, 'grin', SM);
        yield* w.say('ruckus', `Sir, I been waitin' fifty years for somebody to dislike things with. It gets lonesome, despisin' alone.`, 'worry');
        yield* w.say('riley', `Is these {ns}... becomin' friends? That's nasty.`, 'shock');
        yield* w.narr(`And there it was. A spirit made of pure hatred had just enjoyed somebody's company. It is hard to haunt a man while you are busy liking another.`);
        tp.rig.setPose('cower', 14); A().sfx('ghost');
        yield* w.say('tomP', `Hold on. What's this feelin'? Warm. In the chest. Like heartburn, but STUPID. Ruckus! What did you DO to me?!`, 'shock', SM);
        yield* w.say('ruckus', `I believe that is fellowship, Colonel.`, 'grin');
        yield* w.say('tomP', `AW, HELL NAW! Not FELLOWSHIP! I'm slippin'! I can't hold on to this soft-ass {n}! Somebody insult me! QUICK!`, 'shout', SM);
        yield* w.say('granddad', `Lovely to have you, Colonel. Come back anytime.`, 'grin');
        yield* w.say('tomP', `YOU PETTY SON OF A...`, 'shout', SM);
        return true;
      }]];
      while (ideas.length) {
        const i = yield* w.choice('huey', 'HOW DO YOU GET HATE OUT OF A MAN?', ideas.map((o) => o[0]));
        if (yield* ideas.splice(i, 1)[0][1]()) break;
      }
      A().sfx('ghost'); A().sfx('thunder'); FX.flash(1, '#b6ff8a'); cam.shake(0.7);
      w.st.ghost = 0; w.st.dark = 0; w.relight();
      tp.gone = true;
      w.npc('tom', 600, { face: -1, pose: 'sit', expr: 'closed' });
      yield* beat(w, ri, `He gone? ...Aw. He was funny.`, 1.6);
      w.cine(false);
      yield* w.fadeOut(0.4);
    }],
    *outro(w) {
      yield* open(w, 'house', { dark: 0, ghost: 0 }, 'house', 0.1, 760, -1);
      const tom = w.npc('tom', 600, { face: 1, pose: 'sit', expr: 'worry' }), ru = w.npc('ruckus', 430, { face: 1, expr: 'worry' });
      w.npc('granddad', 900, { face: -1, pose: 'handsHips' }); w.npc('riley', 1000, { face: -1, pose: 'lean' });
      w.look(680, 1.4);
      yield* w.fadeIn(0.5);
      yield* w.say('tom', `...Hello? Why am I tied to a chair with Christmas lights? Why does my everything hurt? Why do I taste... cussing?`, 'worry');
      yield* w.say('granddad', `You fell.`, 'deadpan');
      yield* w.say('tom', `Onto what?`, 'worry');
      yield* w.say('granddad', `Huey. Mostly.`, 'deadpan');
      yield* w.say('tom', `Did I say anything? I have a feeling I said things. To Brad. Oh no. Did I say things to BRAD?`, 'shock');
      yield* w.say('riley', `You told a rich man you'd read his forehead while you slapped it. Best you ever been.`, 'grin');
      tom.rig.setPose('facepalm', 12);
      yield* w.say('tom', `I have to apologise to everyone. I'll make a list. I'll bring pie. Does a pie cover "I ran through your yard screaming"?`, 'worry');
      ru.rig.setPose('pointUp', 12);
      yield* w.say('ruckus', `Farewell, Colonel. Finest man I ever met inside another man.`, 'worry');
      yield* w.say('huey', `You helped, Ruckus. I want it on record that I find that disturbing.`, 'deadpan');
      yield* w.say('ruckus', `Don't thank me. I'd rather you didn't speak to me at all.`, 'scowl');
      yield* w.narr(`Tom went home. He remembers none of it. Brad remembers all of it. The carpool is over.`);
      yield* w.narr(`What I learned: you cannot beat hatred out of anyone. You can only wait for it to make a friend by accident.`);
      yield* w.narr(`That is not a strategy. That is luck with a moral.`);
      yield* w.narr(`One thing stayed with me. Stinkmeaner called Ruckus the first one he ever met who hated it all.`);
      yield* w.narr(`But nobody gets that good at hating alone. Somebody practised with him. Somewhere out there, the Colonel had friends.`);
    },
  });
})();
