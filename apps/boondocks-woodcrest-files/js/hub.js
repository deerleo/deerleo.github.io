/* hub.js — free roam on Timid Deer Lane: neighbours to bother, cases to start at their doors */
(() => {
  'use strict';
  const BD = window.BD, U = BD.U;
  const A = () => BD.Audio;
  const cleared = (id) => BD.Save.data.cleared[id];
  const open = (m) => BD.cheat || m.needs.every((n) => !!cleared(n));

  // [speaker, line, expression]. Each neighbour cycles through their conversations.
  const TALK = {
    granddad: [
      [['granddad', 'Boy, why you always walking around with that face? Smile. You in the suburbs now. They can sense tension.', 'scowl'], ['huey', 'I\'m not tense. I\'m aware.', 'deadpan'], ['granddad', 'Well, be aware somewhere I can\'t see it.', 'deadpan']],
      [['granddad', 'You see my car? Wash it. And don\'t use the good water.', 'scowl'], ['huey', 'There\'s only one kind of water.', 'deadpan'], ['granddad', 'That\'s what the water company WANTS you to think. Use the hose around back.', 'sly']],
      [['granddad', 'I been on that dating website again. Fourteen women. Every one of \'em lying about her age.', 'grin'], ['huey', 'How can you tell?', 'deadpan'], ['granddad', 'Because I\'M lying about mine. I put down thirty-nine. Game recognize game.', 'sly']],
      [['granddad', 'When I was your age we didn\'t have video games. We had chores, church, and one ball for the whole neighborhood.', 'scowl'], ['huey', 'That sounds terrible.', 'deadpan'], ['granddad', 'It WAS terrible. That\'s why I\'m so well adjusted. Now go inside, you letting the air out.', 'shout']],
    ],
    riley: [
      [['riley', 'Yo, Huey. If I rob you, but I\'m your brother, is that a crime? Or is that just family business?', 'smirk'], ['huey', 'It\'s a crime.', 'deadpan'], ['riley', 'See, that\'s why nobody invites you nowhere.', 'scowl']],
      [['riley', 'I\'m bout to drop a mixtape. "Timid Deer Lane Massacre." No features. Aight, one feature. Me again, but angrier.', 'grin']],
      [['riley', 'Granddad said I can\'t have a chain till I pay bills. What bills? I\'m eight! My whole life is free. That\'s the BEST time for a chain.', 'shout'], ['huey', 'That\'s the most financially coherent thing you\'ve ever said.', 'deadpan'], ['riley', 'Thank you. ...Wait, was that a diss?', 'worry']],
      [['riley', 'You ever think about how we the only real ones on this whole block?', 'smirk'], ['huey', 'You sleep with a night light.', 'deadpan'], ['riley', 'It\'s a SECURITY light. For security.', 'shout']],
    ],
    tom: [
      [['tom', 'Huey! Lovely day. I prosecuted a jaywalker this morning. Looked him right in the eye. ...Okay, I looked at his shoes. But FIRMLY.', 'grin']],
      [['tom', 'Do you ever worry about prison, Huey?', 'worry'], ['huey', 'I worry about the prison system.', 'deadpan'], ['tom', 'Right. Right, the system. I mostly worry about the showers.', 'worry']],
      [['tom', 'My wife says I should be more assertive. So today I told the coffee man my name was Tom. With a hard T.', 'grin'], ['huey', 'Your name is already Tom.', 'deadpan'], ['tom', 'And now he KNOWS it.', 'smirk']],
    ],
    jazmine: [
      [['jazmine', 'Huey! My lemonade stand made four dollars! Mr. Wuncler says after his management fee I owe him nine.', 'grin'], ['huey', 'That\'s capitalism, Jazmine.', 'deadpan'], ['jazmine', 'Capitalism is MEAN.', 'worry']],
      [['jazmine', 'Huey, is the Tooth Fairy real?', 'neutral'], ['huey', 'No. She\'s a story adults tell so you\'ll accept cash for body parts.', 'deadpan'], ['jazmine', '...I\'m telling my daddy you said body parts.', 'worry']],
      [['jazmine', 'Daddy says if I\'m good, nothing bad will ever happen to me.', 'grin'], ['huey', 'Your father is a prosecutor. He knows for a fact that isn\'t true.', 'deadpan'], ['jazmine', 'Why do I keep talking to you?', 'worry']],
    ],
    ruckus: [
      [['ruckus', 'Afternoon! Uncle Ruckus, no relation. I work thirty-two jobs in this town, and I thank the fine people of Woodcrest for every single one they underpay me for.', 'grin']],
      [['ruckus', 'You know I ain\'t really from your side of things. Doctor says I got a rare skin condition. Runs in nobody\'s family. He never even heard of it, which PROVES how rare it is.', 'grin'], ['huey', 'What\'s it called?', 'deadpan'], ['ruckus', 'Don\'t you worry what it\'s called. It\'s got a "re" in it and it\'s very serious.', 'scowl']],
      [['ruckus', 'I been watchin\' you, Huey Freeman. Readin\' books. Askin\' questions. That\'s how trouble starts. First it\'s a question. Next thing you know, you got an OPINION.', 'scowl'], ['huey', 'I have several.', 'deadpan'], ['ruckus', 'Lord, he\'s got SEVERAL.', 'shock']],
    ],
    slick: [
      [['huey', 'Slickback.', 'deadpan'], ['slick', 'Nah, nah. It\'s "A Pimp Named Slickback". All four words. You don\'t call your granddaddy "Grand".', 'sly'], ['huey', 'That\'s a lot to say.', 'deadpan'], ['slick', 'Excellence takes time, lil\' man.', 'sly']],
      [['slick', 'Free advice, and my advice is never free: a man who chases two rabbits needs a second job.', 'sly'], ['huey', 'That doesn\'t mean anything.', 'deadpan'], ['slick', 'And yet you gon\' think about it all day. That\'ll be twenty dollars.', 'grin']],
      [['slick', 'I\'m a businessman. A motivational speaker. A life coach with a hat.', 'sly'], ['huey', 'You\'re a criminal.', 'deadpan'], ['slick', 'En-tre-pre-neur. Say the whole thing.', 'grin']],
    ],
    wuncler: [
      [['wuncler', 'Young Freeman! I just bought your school. And the one next to it. Going to merge them into a parking structure. For the children.', 'grin']],
      [['wuncler', 'People say money can\'t buy happiness. I looked into it. It can. I own the patent.', 'smirk']],
      [['huey', 'You\'re the reason this town is the way it is.', 'scowl'], ['wuncler', 'Why, thank you, son! Tell your grandfather his mortgage says hello.', 'grin']],
    ],
  };
  const MUTTER = {
    granddad: ['Somebody been in my good chair.', 'These property taxes are a hate crime.', 'I ain\'t old. I\'m vintage.'],
    riley: ['Young Reezy. Remember the name.', 'This block soft.', 'I should be on TV.'],
    tom: ['Is that a police car? ...No. Okay. Okay.', 'Lovely. Everything is lovely.'],
    jazmine: ['Lemonade! Fifty cents! Hope included!', 'I hope a pony is real.'],
    ruckus: ['No relation.', 'Fine neighborhood. FINE neighborhood.', 'I love my jobs. All of \'em.'],
    slick: ['Say the whole thing.', 'This hat got its own zip code.'],
    wuncler: ['I own that. And that. And you.', 'Marvelous day to foreclose.'],
  };
  const seen = {};

  BD.HUB = {
    id: 'hub', hub: true, noCard: true, bg: 'block', title: 'WOODCREST', needs: [],
    phases: [function* (w) {
      const bg = BD.Backgrounds.block, S = (bg && bg.spots) || { freeman: 700, dubois: 1500, bus: 2300, wuncler: 3200, hill: 3900 };
      const at = { garden: S.wuncler, dinner: S.freeman, fight: S.freeman + 430, inspector: S.dubois, itis: S.bus + 420, theater: S.bus, strikes: S.dubois + 300, home: S.freeman - 380, hate: S.hill };
      w.setBg('block'); w.music('board', 0.5); w.noFight = true; w.zoom = 1.3;
      w.place(U.clamp(BD.hubX || S.freeman + 100, 120, w.bg.width - 120), 1);
      const folks = [
        w.npc('granddad', S.freeman - 170, { face: 1, pose: 'handsHips' }),
        w.npc('riley', S.freeman + 250, { face: -1, pose: 'lean' }),
        w.npc('jazmine', S.dubois - 190, { face: 1 }),
        w.npc('tom', S.dubois + 170, { face: -1 }),
        w.npc('ruckus', S.bus + 190, { face: -1, expr: 'grin' }),
        w.npc('slick', S.bus + 520, { face: -1, prop: 'cane', pose: 'caneLean', idle: 'caneLean', expr: 'sly' }),
        w.npc('wuncler', S.wuncler + 200, { face: -1, pose: 'handsHips' }),
      ];
      for (const f of folks) w.chatter(f, MUTTER[f.id], 300);
      w.pins = BD.MISSIONS.filter(open).map((m) => ({ x: at[m.id], m, done: !!cleared(m.id), label: cleared(m.id) ? cleared(m.id).rank : m.ep.replace('EPISODE ', '') }));
      yield* w.fadeIn(0.4);
      if (!BD.hubSeen) { BD.hubSeen = true; w.toast('E: TALK OR START A CASE     TAB: CASE BOARD', 8); }
      const p = w.player;
      let tick = 0;
      for (;;) {
        if (BD.AUTOPLAY) p.x = folks[(tick++ >> 7) % folks.length].x - 70;
        let pin = null, who = null, bd = 130;
        if (!BD.AUTOPLAY) for (const q of w.pins) { const d = Math.abs(p.x - q.x); if (d < bd) { bd = d; pin = q; } }
        if (!pin) for (const f of folks) { const d = Math.abs(p.x - f.x); if (d < bd) { bd = d; who = f; } }
        w.mark = pin ? { x: pin.x, y: -250, prompt: 'START "' + pin.m.title + '"' } : who ? { x: who.x, y: who.y - who.hh - 34, prompt: 'TALK' } : null;
        if ((pin || who) && p.onG && BD.Input.take('talk')) {
          if (pin) {
            A().sfx('ui_select'); BD.hubX = p.x;
            yield* w.fadeOut(0.3);
            BD.setScene(BD.Scenes.mission, pin.m);
            yield () => false;
          }
          const list = TALK[who.id], n = (seen[who.id] = (seen[who.id] || 0) + 1) - 1;
          p.face = who.x >= p.x ? 1 : -1; who.face = -p.face;
          w.cine(true); w.look((p.x + who.x) / 2, 1.5);
          for (const l of list[n % list.length]) yield* w.say(l[0], l[1], l[2]);
          w.cine(false);
        }
        yield;
      }
    }],
  };
})();
