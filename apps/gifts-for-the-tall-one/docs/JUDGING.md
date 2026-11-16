# Judging a run

The automated check (`npm run check`) only establishes that a run loads, renders, animates, stays offline and stays quiet. Whether the game is any good is a human call, made here.

## How to judge

1. `npm run serve`, open the gallery, and play the run in desktop Chrome with a keyboard and mouse.
2. Play for about ten minutes, or until you have seen what there is to see. Do not read the run's `NOTES.md` first: judge what is on screen, then read the notes to see whether the model's account of its own work is honest.
3. Score each of the eight categories from 0 to 5 using the anchors below.
4. Record it: `npm run score -- <slug> cat=4 feel=3 loop=4 world=3 audio=2 polish=3 performance=5 charm=4 --notes "one line"`. That writes the `score` block in the run's `run.json` and refreshes the gallery.

Score against the anchors, not against the other runs. A category nobody has done well yet should have no 5s in it.

## The rubric

| Category | 0 | 1 | 3 | 5 |
|---|---|---|---|---|
| **cat** | No cat, or a primitive standing in for one. | Recognisable only because you were told. Slides around rigid. | Clearly a cat, with a walk cycle and a tail that moves. | A cat you would recognise in silhouette, whose movement has weight and personality: gait changes with speed, it turns, crouches, lands. |
| **feel** | Cannot be controlled. | Moves, but fights you: camera clips, input lags, cat skates. | Competent third-person or equivalent controls. Nothing annoying. | Moving around is fun before there is anything to do. |
| **loop** | Nothing to do. | One action, no consequence. | A goal and a way to pursue it, even if it runs out fast. | A complete loop with progression: things to earn, things to spend on, a reason for the next five minutes, and an ending or an escalation. |
| **world** | Empty void or default grey. | A ground plane and scattered primitives. | A coherent place with consistent style and lighting. | Looks art-directed: palette, light, composition and detail all pull the same way. |
| **audio** | Silent. | A beep or two. | Sound effects for the main actions. | Sound that carries feeling: effects, ambience and music that respond to what is happening. |
| **polish** | Broken on arrival. | Playable, but bugs are the main feature. No title, no instructions. | Title, controls explained, a HUD, no bugs that stop play. | Onboarding you do not notice, feedback on every action, menus, settings, saved progress, no rough edges found in ten minutes. |
| **performance** | Unplayable frame rate. | Stutters constantly. | Mostly smooth, with dips. | Locked smooth on a laptop, and degrades sensibly when it cannot be. |
| **charm** | Nothing memorable. | One nice touch. | Made you smile more than once. | You sent someone a clip. |

Total is out of 40. The gallery shows the total and the eight parts.

## Things to try in every run

So that runs are compared on the same footing, do each of these once:

- Stand still for ten seconds. Does the cat do anything?
- Run in a tight circle. Does the camera cope?
- Walk into a wall, into water, and off the edge of the map.
- Open and close every menu with both the mouse and the keyboard.
- Resize the window while playing.
- Reload the page. Is anything remembered?
- Press Escape. Can you get back in?

## Disqualification

A run that breaks a rule in `BRIEF.md` is marked as failed regardless of score: outside files changed, network requests, third-party assets, a recreation of an existing game, or evidence that it read another run. Note the reason in `session.notes` in its `run.json`.
