# Chip's Challenge — notes for agents

Solo puzzle (Microsoft Entertainment Pack remake 4 of 4). Vanilla ES modules,
Canvas 2D, Web Audio. The game rules come from a vendored engine (Lexy's
Labyrinth, see below and decision 0048); everything else is ours, same split
as `skifree` (`loop.js`, `storage.js` are verbatim copies of SkiFree's). Read
this before opening the sources.

## Rules engine (vendored)

- `vendor/lexy/`: game logic + CHIPS.DAT reader of Lexy's Labyrinth (MIT),
  copied verbatim from a pinned commit, see `vendor/lexy/SOURCE.md`. Never
  edit those files; the `*.d.ts` stubs next to them are ours. Excluded from
  ESLint, Prettier and the platform check.
- Ruleset `lynx` (`engine.js` → `RULESET`). `engine.js` is the only file that
  talks to the engine: `parsePack`, `createLevel` (maps Lexy sound names to
  ours), `status` (counters, inventory, hint, death reason), `DIR_BITS`.
  `game.js` calls `level.advance_tic(bits)` once every 3 frames (20 tics/s)
  and reads `level.player`, `level.state`, `level.can_accept_input()`;
  `render.js` reads `level.linear_cells` (terrain, item, thin wall, actor).
- Replay check (do it after any engine update): in Node, load
  `assets/CHIPS.DAT` with `engine.parsePack`, replay the public Tile World
  Lynx solutions (`testData/tws/public_CHIPS-lynx.dac.tws` in
  github.com/SicklySilverMoon/SuperCC, parsed with Lexy's `format-tws.js`)
  through `createLevel` + `advance_tic`. 2026-10-25: 147/149 won (85 TELENET
  lost to a fireball; 145 is the credits level, its replay does not decode).

## Levels

- `assets/CHIPS.DAT` (108,569 bytes, 149 levels): the original level file,
  from github.com/bgradin/ChipsChallenge (`Chips Challenge/CHIPS.DAT`). Rights
  stay with Microsoft / Epyx, like the tiles. Titles, hints and passwords are
  read from it (English, as in the original). `levels.js` loads it once
  (`loadLevels()`, live `LEVELS`, `levelPack()`).

## Graphics

- `assets/tiles.png` (416x512): the original CHIPS.EXE tile bitmap, from
  github.com/Yrlish/Chips-Challenge-JS (`assets/tileset.gif`, converted to
  PNG, pixels unchanged). Tile code = column x 16 + row; columns 7-9 repeat
  the creatures on white, 10-12 are their masks. `sheet.js` bakes the masked
  creatures into a transparent canvas at load. `tiles.js` maps the engine's
  tile names to these codes (inverse of Lexy's DAT table).
- 9x9 window (288x288 logical px), camera clamped to the board, drawn square
  by square like the original. Integer zoom in device px (`surface.js`),
  smoothing off, `pixelated`. LED counters drawn by `led.js`.
- `assets/thumbnail.png`: 4:5 hub cover composed from the same tiles.

## Files

| File | Role |
|---|---|
| `main.js`, `screens.js`, `copy.js` | Page shell: i18n, options panel, level list + password, "Reprendre", pause/death/win dialogs, progress, `MuchogamesMatch.start/resume/finish`. |
| `game.js` | `createGame(options)` → `{ restart, setPaused, setMuted, progress, snapshot, destroy }`. Owns loop, surface, input, audio; drives the engine. |
| `save.js`, `replay.js` | Match in progress: storage + validation; input log + silent replay. |
| `engine.js`, `levels.js`, `tiles.js` | Engine bridge; level file loading; tile name → original code. |
| `render.js`, `sheet.js`, `surface.js`, `panel.js`, `led.js` | Drawing. |
| `input.js`, `audio.js`, `progress.js`, `i18n.js`, `rules.js`, `storage.js` | Controls (input bits, one queued tap), sounds, saved progress, copy. |
| `win31.css`, `styles.css`, `panel.css` | Windows 3.1 widgets; page + board; side panel, D-pad, responsive layouts. |

`index.html` is ~400 lines: header boilerplate plus every dialog and the
D-pad as static markup (`data-id` on each), kept out of JS on purpose.

## Behaviour in our code

- Nothing moves until Chip's first move. A tap stays queued until the engine
  can accept input (one step); holding keeps walking. "Oof" when a move is
  refused, a dry step sound when Chip moves.
- Death dialog by `engine.deathReason`: water, fire, bomb, block, time, else
  monster. Score: time bonus 10/s left + level bonus 500 x level, -20 % per
  failed attempt (first four). One match = one level; deaths and R stay in
  the match (R / retry: `failures + 1`, fresh attempt). Storage:
  `chipschallenge-progress` (unlocked levels, best score/time),
  `chipschallenge-sound`, `chipschallenge-current` (below).

## Match in progress (exact resume, decision 0054)

- Routes: reaching the exit = `finish({ won: true, score })`, save deleted.
  "Niveaux" (`data-match-quit`, shared confirm), hub back, reload, closed
  tab, bfcache = quit: save kept, no `finish()`. Starting another level
  (list, password, N/B, "Niveau suivant") = new match: `finish()` with no
  `won` (records nothing) if one was in progress, save overwritten.
- `chipschallenge-current` = `{ v: 1, level, failures, seeds: { tw, blob },
  inputs: [[bits, tics], ...], check: { tic, x, y, chips, time, actors } }`.
  `inputs` = engine input bits of every tic since Chip's first move,
  run-length encoded (`replay.logBits`). `check` = `engine.fingerprint`
  (actors = hash of type, cell, direction). `save.readMatch` drops
  anything that does not validate (version, level range, int ranges).
- Written at level start (after `MuchogamesMatch.start` → true), every
  ~1 s while tics run, on death / retry / R, `visibilitychange` hidden and
  `pagehide`.
- Why a replay: a Lexy `Level` is not serializable, but it is
  deterministic apart from `_tw_rng` and `_blob_modifier` (drawn with
  `Math.random()` in its constructor; the Lynx PRNG `_rng1/_rng2` starts
  at 0). Restore = `createLevel` with those seeds and a no-op sound
  handler, `advance_tic` over the log (no rendering), compare
  `fingerprint` with `check`, then plug the real sounds back and show the
  pause overlay. Mismatch or exception: fresh attempt of that level, same
  `failures`, nothing shown to the player.
- Check (2026-10-30, Node, saved through `save.js` then restored):
  levels 1, 2, 5 and blob levels 23, 38, 41 rebuild the same board (every
  actor, cell, counters, PRNG state); wrong seeds on a blob level are
  rejected by `check`. Blob levels: 23, 38, 41, 46, 60, 62, 70, 118,
  127, 133.
