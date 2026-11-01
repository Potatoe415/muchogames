# Scrabble — notes for agents

French Scrabble vs the computer (4 levels, slider on the start screen) or two players on one device.
Words are always French (ODS 9); the interface is FR/EN/ES. Vanilla ES
modules, DOM board of `<button>` cells, no dependency, no worker (a move
search takes ≤ ~120 ms on a desktop, runs during the 750 ms "thinking" pause).
Read this before opening the sources.

## Files

| File | Role |
|---|---|
| `main.js` | Page shell: i18n, settings, dictionary loading (Start/Resume stay disabled until it is ready), screens, save/resume, `MuchogamesMatch.start/resume/finish`, stats. |
| `play.js` | `createPlay(opts)` → `{ actions, relabel, refresh, destroy, snapshot }`. Live preview, play / swap-or-pass / hint / bag, computer turns, "pass the device" between two players. |
| `edit.js` | The draft: tap tile then cell, tap a cell for the typing cursor (tap again = turn ↓) then tap/type letters, drag rack ↔ board, reorder the rack, take back, shuffle, `layOut` for hints. |
| `draft.js` | Pure helpers for the draft `[{ k: rack slot, i: cell, l: letter }]`, `slotFor` (a typed letter uses a blank if missing), `draftFits` (save check). |
| `rules.js` | Pure rules: `analyzeMove(board, tiles)` → `{ error }` (`line`, `gap`, `center`, `short`, `detached`) or `{ words, score, bingo }`; `invalidWords(analysis, dict)`. |
| `movegen.js` | Appel & Jacobson move generator (anchors, left parts, cross-checks, prefix cache). Every move scored with `analyzeMove`. |
| `ai.js` | Levels: easy (aims at 30 % of the best score, words ≤ 6 letters), medium (55 %), hard (80 %), expert (best score + leave value). No move: swap (bag ≥ 7) or pass. `bestMove` = hint. |
| `game.js` | Match state and transitions (`playTiles`, `swapTiles`, `passTurn`), end + rack adjustments, `restoreGame` (shape + every one of the 102 tiles accounted for). |
| `dict.js` | Loads `/data/scrabble/ods9.txt` once, sorted array + binary search (`has`, `hasPrefix`). |
| `tiles.js` | French set (102 tiles, values), premium layout, constants. Board cell: `""`, uppercase letter, or lowercase = blank played as that letter. Rack: `"?"` = blank. |
| `board-view.js`, `rack-view.js` | DOM painting: cells `data-id="scrabble-cell-h8"` (column letter + row), rack `scrabble-rack-tile-<n>`, score bubble, cursor, last move. |
| `input.js`, `keys.js` | Pointer tap/drag (ghost lifted above the finger on touch), keyboard (letters, Backspace, arrows, Enter, Escape). |
| `dialogs.js`, `hud.js`, `end.js` | Sheets (blank picker, swap/pass, letters left, handoff), score cards + guide line + buttons, end card. |
| `i18n.js`, `copy-*.js` | FR/EN/ES strings + rules HTML. |
| `setup.js` | Start-screen choices, level slider (`scrabble-level-slider`, 0–3, labels below are `data-setting` buttons) + the level's record, names, resume button. |
| `styles.css`, `slider.css`, `scores.css`, `stage.css`, `board.css`, `sheets.css` | Page + start screen; level slider; score cards; stage layout (portrait column, aspect ≥ 6/5 side column); board/tiles/rack; sheets. |

## Rules in code

- First word covers the centre and has ≥ 2 letters. Every word formed must be in ODS 9; the game refuses unknown words before playing (no challenge, no penalty) and says which word.
- Bingo +50 for 7 tiles. Swap only with ≥ 7 tiles in the bag (new tiles drawn before the old go back). Swaps and passes are scoreless turns.
- End: bag empty and a rack emptied (that player gains the other rack's value, the other loses it), or 4 scoreless turns in a row (each loses their own rack value).
- Human always plays first (player 1 in duo, "Vous" in solo).
- `finish({ won, score })` in solo when there is a winner; `finish()` for a solo draw and for two-player games.

## Save / resume (decision 0054)

- Key `scrabble-saved-game` = `{ config: { mode, level, names }, game, draft }`. Written at match start, after every change (draft edits included) and on `pagehide` / `visibilitychange`. Cleared in `onEnd`.
- A computer turn in progress restarts on resume; two-player resume always shows the handoff sheet first (racks stay hidden).
- Other keys: `scrabble-settings-v2` (mode, level, sound, hints — the Hint button, off by default, switched on in the options panel — names), `scrabble-stats` (`{ <level>: { won, played } }`).

## Dictionary

`public/data/scrabble/ods9.txt` is built by `node scripts/scrabble_dict.mjs <list.txt>` (front-coded, ~1.6 MB, ~250 KB gzip, 407 128 words of 2–15 letters). Source list: github.com/clementjosse/dico-scrabble `liste_mots.txt` (ODS 9, Larousse/FISF — copyrighted word list, see `STATE.md` open questions).
