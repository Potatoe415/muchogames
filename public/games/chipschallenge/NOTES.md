# Chip's Challenge — notes for agents

Solo puzzle (Microsoft Entertainment Pack remake 4 of 4). Vanilla ES modules,
Canvas 2D, Web Audio, no dependency. Same split as `skifree`; `loop.js` and
`storage.js` are verbatim copies of SkiFree's. Read this before opening the
sources.

## Graphics

- `assets/tiles.png` (416x512): the original CHIPS.EXE tile bitmap, taken
  from github.com/Yrlish/Chips-Challenge-JS (`assets/tileset.gif`, converted
  to PNG, pixels unchanged). Rights stay with their owners (Microsoft / Epyx);
  fine for a fan remake per the owner's request. Tile code = column x 16 +
  row; columns 7-9 repeat the creatures on white, 10-12 are their masks.
  `sheet.js` bakes the masked creatures into a transparent canvas at load.
- 9x9 window (288x288 logical px) on a 32x32 board, camera clamped to the
  board edges, square-by-square moves like the original (no smooth scroll).
  Integer zoom in device px (`surface.js`), smoothing off, `pixelated`.
- LED counters are drawn by `led.js` (7 segments on a 51x28 canvas).
- `assets/thumbnail.png`: 4:5 hub cover composed from the same tiles.

## Files

| File | Role |
|---|---|
| `main.js`, `screens.js` | Page shell: i18n, options panel, level list + password, pause/death/win dialogs, progress, `MuchogamesMatch.start/finish`. |
| `game.js` | `createGame(options)` → `{ restart, setPaused, setMuted, world, refreshText, destroy }`. Owns loop, surface, input, audio. |
| `levels.js`, `level.js` | The 5 levels (ASCII maps, legend in `level.js`), world creation, button→machine wiring. |
| `tiles.js` | Tile codes, directions, tile families, what blocks/creatures may enter. |
| `board.js`, `move.js`, `arrive.js` | Board queries; moving one square (pushes, doors, socket, revealed walls); landing effects (pickups, hazards, buttons, cloners, teleports, slides). |
| `monsters.js`, `step.js` | Creature brains, sliding mobs; the 20 Hz tick (Chip, slides, creatures, clock). |
| `render.js`, `sheet.js`, `surface.js`, `panel.js`, `led.js` | Drawing. |
| `input.js`, `audio.js`, `progress.js`, `i18n.js`, `rules.js`, `storage.js` | Controls, sounds, saved progress, copy. |
| `win31.css`, `styles.css`, `panel.css` | Windows 3.1 widgets; page + board; side panel, D-pad, responsive layouts. |

`index.html` is ~390 lines: header boilerplate plus every dialog and the
D-pad as static markup (`data-id` on each), kept out of JS on purpose.

## Rules in code

- Tick = 20/s (one every 3 frames of the 60 Hz loop). Chip walks every 4
  ticks (5 squares/s) while a direction is held; a tap is answered on the
  next tick. Slides (ice, force floors, teleport exit) every 2 ticks, input
  locked; ice bounces off walls, a blocked force floor hands control back.
  Creatures move every 4 ticks, teeth and blobs every 8. Clock starts on
  Chip's first move.
- Keys: blue/red/yellow used up by their door, green kept. Thief takes all
  boots. Block in water → dirt (Chip walking on dirt → floor); block on
  bomb → both gone. Blocks and creatures never enter dirt, gravel, pickups,
  doors, socket, exit, hint. Water kills creatures but gliders, fire all but
  fireballs (bugs and walkers avoid it). Hidden walls and real blue walls turn
  into plain walls when bumped; fake blue walls turn into floor.
- Teleport → next teleport in reading order (wraps) whose exit is free, same
  direction. Red / brown buttons drive the next clone machine / trap in
  reading order (Lynx wiring). Green flips toggle walls, blue turns tanks.
- Score: time bonus 10/s left + level bonus 500 x level, -20 % per failed
  attempt (first four). One match = one level; deaths and R stay in the
  match; `finish({ won: true, score })` on exit, `{ won: false }` when the
  level is left. Storage: `chipschallenge-progress` (unlocked levels, best
  score/time), `chipschallenge-sound`.
- Every level was checked solvable by replaying a scripted solution against
  the engine headlessly (the engine modules have no DOM dependency).
