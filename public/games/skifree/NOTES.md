# SkiFree — notes for agents

Solo arcade (Microsoft Entertainment Pack remake 3 of 4). Vanilla ES modules,
Canvas 2D, Web Audio, no dependency. Same split as `jezzball`; `loop.js` is a
verbatim copy of JezzBall's. Read this before opening the sources.

## Graphics

- `assets/sprites.png` (256x411): the 86 original SKI.EXE bitmaps (Chris
  Pirih, 1991), packed from the per-resource BMPs extracted in
  github.com/aryribeiro/skifree (`public/assets/bitmaps/bitmap_N_N.bmp`,
  4 bpp). White was turned transparent (Win16 mask colour). Bitmap rights stay
  with their owners. `sprites.js` holds the exact `[sx, sy, w, h]` rect per
  resource id and the named groups (`SKIER`, `SPRITE`). Never draw a game
  object with canvas primitives; only the white background is a `fillRect`.
- Integer zoom (device px per original px, `surface.js`), smoothing off,
  `image-rendering: pixelated`. Sprites are anchored bottom-centre (feet).
- `assets/thumbnail.png`: 4:5 hub cover composed from the same bitmaps.

## Files

| File | Role |
|---|---|
| `main.js` | Page shell: i18n, options panel, start screen + records, pause/game-over overlays, course toast, `MuchogamesMatch.start/finish`, restart = finish + new match. |
| `game.js` | `createGame(options)` → `{ setPaused, setMuted, summary, destroy }`. Owns loop, surface, input, audio. |
| `step.js` | One 60 Hz step + camera (skier at 50 % x, 30 % y). |
| `skier.js`, `air.js`, `controls.js` | Skier modes `ski / air / crash / eaten`, 7 angles, speed/turbo, tricks + landing, commands. |
| `world.js` | Seeded 256 px cells around the camera, culled one screen above / far away; spawn tables per zone. |
| `course.js` | Start signs, Slalom / Freestyle / Tree Slalom lanes, gates, timed run, results. |
| `npcs.js`, `lift.js`, `yeti.js`, `collide.js` | Dogs, novices, snowboarders, fires; clock-driven lift chairs; the yeti; hit reactions. |
| `entities.js`, `config.js` | Object footprints/heights; all tuning numbers. |
| `render.js`, `hud.js`, `input.js`, `audio.js`, `records.js`, `i18n.js`, `rules.js`, `storage.js`, `surface.js` | Drawing, status box, controls, sounds, bests, copy. |
| `win31.css`, `styles.css` | Windows 3.1 widgets; page layout. |

## Rules in code

- 10 px = 1 m. Top speed 280 px/s (28 m/s), turbo ×1.4; 2000 m in ~75 s straight.
- Yeti at 2000 m (or above −125 m uphill), speed 364 px/s: catches a normal skier, not a turbo one. Gives up 1.3 screens behind; the next comes 500 m later.
- Landing: OK if not flipped and not facing backwards; style = 10/spin step, 20/flip step, +30 per 360, +50 per full flip, +5 per ramp. Dead tree touched while airborne burns (+50).
- Courses start at y = 600 (60 m). Slalom x −680…−420 (500 m, gate every 32 m, 5 s per miss), Freestyle −220…220 (900 m, style), Tree Slalom 420…720 (900 m). Red ← flag: pass on its left; blue → flag: on its right.
- `finish({ score })` sends the distance in m, no `won` (a run always ends eaten). Storage: `skifree-best-distance`, `skifree-best-slalom`, `skifree-best-tree`, `skifree-best-freestyle`, `skifree-sound`.
