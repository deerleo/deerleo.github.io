# Red Clay Chase

A GTA-style police chase in the browser, built entirely by **Claude Fable 5.2** from plain chat messages. No code was written by hand.

**Play it:** https://noclipepe.com/chase/

## How it was made

- 28 messages in chat over 3 days: one detailed starting prompt, then rounds of feedback.
- About 9.5 hours of work and about $208 in API-equivalent cost.
- No game engine and no physics library: driving, crashes and collisions are written from scratch on top of three.js.
- Zero assets: every texture is drawn by code at load time, every car, person and tree is built from geometry, every sound is synthesized with the Web Audio API.
- ~5,400 lines of JavaScript, 1.1 MB in total including three.js.

## What is in it

- Police with roles: one rams your bumper, two box you in, one gets ahead and brake-checks you.
- 5 wanted levels. At 5 stars a timer starts: survive it and the cops give up.
- Damage: the hood flips up and rips off, doors swing open and fly off on side hits.
- Real-time car reflections, adaptive resolution to hold 60 fps, settings menu on Esc, touch controls on phones.

## Run locally

Open `index.html` from a local static server, for example:

```
python -m http.server
```

then go to http://localhost:8000.

## Files

- `js/main.js` renderer, sky, post-processing, driving physics, camera, HUD, sound, main loop
- `js/game.js` traffic and police as physical bodies, damage, the pursuit, game over
- `js/world.js` road spline and terrain with red clay road cuts
- `js/car.js`, `js/people.js` the convertible, traffic cars, driver and passenger
- `js/veg.js`, `js/props.js`, `js/textures.js` procedural trees, roadside props and textures
- `js/three.min.js` three.js (MIT)

Made by [@noclipepe](https://x.com/noclipepe). More games: https://noclipepe.com
