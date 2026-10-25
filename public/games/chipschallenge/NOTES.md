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
| `game.js` | `createGame(options)` → `{ restart, setPaused, setMuted, world, destroy }`. Owns loop, surface, input, audio. |
| `datfile.js`, `levels.js`, `level.js` | CHIPS.DAT reader; `loadLevels()` + live `LEVELS`; world creation from the two layers, monster list, trap/clone wiring. |
| `tiles.js` | Tile codes, directions, tile families, what blocks/creatures may enter. |
| `board.js`, `move.js`, `arrive.js` | Board queries; moving one square (pushes, doors, socket, revealed walls); landing effects (pickups, hazards, buttons, cloners, teleports, slides). |
| `monsters.js`, `step.js` | Creature brains, sliding mobs; the 20 Hz tick (Chip, slides, creatures, clock). |
| `render.js`, `sheet.js`, `surface.js`, `panel.js`, `led.js` | Drawing. |
| `input.js`, `audio.js`, `progress.js`, `i18n.js`, `rules.js`, `storage.js` | Controls, sounds, saved progress, copy. |
| `win31.css`, `styles.css`, `panel.css` | Windows 3.1 widgets; page + board; side panel, D-pad, responsive layouts. |

`index.html` is ~390 lines: header boilerplate plus every dialog and the
D-pad as static markup (`data-id` on each), kept out of JS on purpose.

## Levels

- `assets/CHIPS.DAT` (108,569 bytes, 149 levels): the original level file,
  taken from github.com/bgradin/ChipsChallenge (`Chips Challenge/CHIPS.DAT`).
  Level data rights stay with Microsoft / Epyx, like the tiles. Titles, hints
  and passwords are read from it (English, as in the original).
- Top layer = Chip / creature / block / terrain; the bottom layer goes to
  `world.lower` and is uncovered when the top tile is cleared (pickup, door,
  socket, dirt, fake wall, bomb). A creature or block on a clone machine is
  its template. Only creatures in the level's monster list move, in that
  order (clones join it). Traps and clone machines use the file's wiring.

## Rules in code

- Tick = 20/s (one every 3 frames of the 60 Hz loop). Nothing moves until
  Chip's first move (clock included). Chip walks every 4 ticks (5 squares/s)
  while a direction is held; a tap is answered on the next tick. Slides every
  2 ticks: on ice (no skates) input is locked and walls bounce him back; on
  force floors (no suction boots) he may step off in any direction, as in
  CHIPS.EXE. Creatures move every 4 ticks, teeth and blobs every 8.
- Keys: blue/red/yellow used up by their door, green kept. Thief takes all
  boots. Block in water → dirt (Chip walking on dirt → floor); block on
  bomb → both gone. Blocks never enter dirt, pickups, doors, socket, exit,
  hint; creatures neither, nor gravel. Water kills creatures but gliders;
  only fireballs enter fire. Hidden walls and real blue walls turn into plain
  walls when bumped; fake blue walls turn into floor.
- Teleport → previous teleport in reading order (wraps, CHIPS.EXE order)
  whose exit is free, same direction. Green flips toggle walls, blue turns
  tanks around.
- Score: time bonus 10/s left + level bonus 500 x level, -20 % per failed
  attempt (first four). One match = one level; deaths and R stay in the
  match; `finish({ won: true, score })` on exit, `{ won: false }` when the
  level is left. Storage: `chipschallenge-progress` (unlocked levels, best
  score/time), `chipschallenge-sound`.
- The engine modules have no DOM dependency, so levels can be checked
  headlessly in Node. Checked so far: all 149 levels load and survive long
  idle/random runs; won by scripted routes or a BFS over the engine: 1–7, 13,
  32, 51, 140, 147. The other levels were not proven either way (search space
  too large); MS timing quirks are only approximated.
