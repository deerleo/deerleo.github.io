# Testing in a headless browser

Everything here runs from the repository root on a machine with no display. It was established on a headless Ubuntu server (Node 24, no usable GPU) and is the recipe to reuse.

## Install (once)

```sh
npm install                      # playwright 1.64.1 and three 0.187.0, both pinned
npx playwright install chromium  # only if ~/.cache/ms-playwright has no chromium-1248
```

Playwright 1.64.1 uses Chromium build 1248. Keep the pin: changing it downloads another browser.

`vendor/three/` is committed, so playing a run needs no install at all. `npm run vendor` regenerates it from `node_modules` and is only for deliberately bumping the three.js version.

## Serve

```sh
npm run serve            # http://127.0.0.1:4173  (gallery at /, runs at /runs/<slug>/)
PORT=0 npm run serve     # any free port; use this when several agents share the machine
```

The check and screenshot scripts start their own server on a free port and stop it when they finish. They never touch a server you started.

## Check a run

```sh
npm run check -- <slug>      # one run
npm run check -- --all       # every run
```

This loads the run in headless Chromium at 1280x720, screenshots the title, presses Enter, clicks the centre, holds W and D, moves the mouse, presses Space, and verifies:

| Check | Meaning |
|---|---|
| `run-json`, `notes`, `entry` | The paperwork and `index.html` exist, with no `TODO` left in `run.json`. |
| `canvas-3d` | The largest canvas has a WebGL or WebGPU context. |
| `renders` | The gameplay frame is not blank (luminance spread and colour count). |
| `animates` | Two gameplay frames 0.9 s apart differ. |
| `offline` | No request left the local server. Any that try are blocked and listed. |
| `no-failed-requests` | No 4xx or 5xx responses. |
| `no-console-errors` | No `console.error` and no uncaught exception. |

Artifacts: `runs/<slug>/check.json`, `runs/<slug>/shots/title.jpg`, `runs/<slug>/shots/play.jpg`. The gallery manifest is refreshed afterwards. Exit status is non-zero if any run failed.

## Look at a run

```sh
npm run shot -- <slug>                                  # runs/<slug>/shots/shot.png after 4 s
npm run shot -- <slug> --enter --keys "w:2000,Space:80" --out /tmp/x.png
npm run shot -- <slug> --query "debug" --script my-playtest.mjs
```

`--script` hands your module the Playwright `page` and a `shot(name)` helper, for scripted playthroughs. Console warnings, errors and failed requests are printed; a clean run prints only the file paths. Open the PNGs with an image viewer or your agent's image-reading tool: a screenshot you have not looked at verifies nothing.

## Things that will otherwise waste your time

- **Software GL is slow.** Chromium here renders with SwiftShader: expect single-digit frames per second for anything with shadows or post-processing. Key holds measured in wall-clock time move a character much less than they would on a GPU. If you need exact, repeatable playtests, give your game a debug hook that advances its simulation by a fixed step and drive that from `page.evaluate` (the `claude-fable-5-2` run does this behind `?debug&manual`, with `window.__game.step(seconds)` and `sim(seconds)`; see its `NOTES.md`).
- **Pointer lock is refused in automation.** Headless Chromium grants pointer lock and then throttles the page to under one frame per second, so both scripts replace `requestPointerLock` with one that rejects and fires `pointerlockerror`. Games must cope with that anyway.
- **Audio is muted** (`--mute-audio`), but an `AudioContext` still works, so audio code paths run and their errors are caught.
- **The frame rate in `check.json` is not a performance result.** It exists to show that frames are being produced.

## Many agents, one machine

Use `PORT=0`, write screenshots to your own directory (`--out`), and stop only the processes you started. The scripts here close their own browser and server in a `finally` block.
