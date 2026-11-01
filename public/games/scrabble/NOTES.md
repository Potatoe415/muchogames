# Scrabble — notes for agents

Scrabble vs the computer (5 levels, slider on the start screen) or two players on one device.
Words in French, English or Spanish (start-screen choice `words`, defaults to
the interface language on a first visit), or "FR + ES": each player checked
against their own language (`p1Lang` = player 1's language, chosen on the start screen in two-player
mode only; against the computer it follows the interface language, Spanish if
the app is in Spanish, French otherwise, `matchConfig`; `playerLangs` in `tiles.js`), one shared bag (`fr-es` set: French values + Ñ, 102 tiles),
FR/ES tags on the score cards and in the handoff title. The interface is
FR/EN/ES separately. Vanilla ES
modules, DOM board of `<button>` cells, no dependency, no worker (a move
search takes ≤ ~120 ms on a desktop, runs during the 750 ms "thinking" pause).
Read this before opening the sources.

## Files

| File | Role |
|---|---|
| `main.js` | Page shell: i18n, settings, dictionary loading per word language (Start waits for the selected list, Resume loads the saved match's list), `useTileSet` before restoring or mounting a match, screens, save/resume, `MuchogamesMatch.start/resume/finish`, stats. |
| `play.js` | `createPlay(opts)` (`dicts`/`langs` one per player) → `{ actions, relabel, refresh, destroy, snapshot }`. Live preview, play / swap-or-pass / hint / bag, computer turns, "pass the device" between two players. |
| `edit.js` | The draft: tap tile then cell, tap a cell for the typing cursor (tap again = turn ↓) then tap/type letters, drag rack ↔ board, reorder the rack, take back, shuffle, `layOut` for hints. |
| `draft.js` | Pure helpers for the draft `[{ k: rack slot, i: cell, l: letter }]`, `slotFor` (a typed letter uses a blank if missing), `draftFits` (save check). |
| `rules.js` | Pure rules: `analyzeMove(board, tiles)` → `{ error }` (`line`, `gap`, `center`, `short`, `detached`) or `{ words, score, bingo }`; `invalidWords(analysis, dict)`. |
| `movegen.js` | Appel & Jacobson move generator (anchors, left parts, cross-checks, prefix cache). Every move scored with `analyzeMove`. |
| `ai.js` | Levels: junior (aims at 35 % of the best Junior score, words of 3–4 letters, no rude word), easy (30 %, words ≤ 6 letters), medium (55 %), hard (80 %), expert (best score + leave value). No move: swap (bag ≥ rack size) or pass. `bestMove(board, rack, dict, junior)` = hint (Junior: main word ≤ 5 letters, no rude word). Rare slow case: a rack with two blanks can take 0.3–1.7 s on a desktop. |
| Junior level | Solo only (`isJunior`/`useRules` in `setup.js` → `useJunior` in `tiles.js`): Scrabble Junior side 2. 11×11 board, a 60-tile bag (`juniorCounts` in `tiles.js`: the language's counts scaled down with the 2 blanks, at least one of each letter, spare tiles to common letters only), 5-letter racks, tiles show no value, points only from coloured squares under letters placed this turn (green 1, blue 2, pink 3; `colorPoints`), no bingo, no end-of-game rack adjustment, the computer's rack shows under its name (`data-rack-peek`), one letter can be swapped at the start of a turn and the turn goes on (`swapOne`, once per turn, `s.freeSwapUsed`), several = pass. Hint always shown. The board layout is ours (the real Junior layout is not reproduced). |
| Junior level | Solo only (`isJunior`/`useRules` in `setup.js` → `useJunior` in `tiles.js`): Scrabble Junior side 2. 11×11 board, 5-letter racks, tiles show no value, points only from coloured squares under letters placed this turn (green 1, blue 2, pink 3; `colorPoints`), no bingo, no end-of-game rack adjustment, the computer's rack shows under its name (`data-rack-peek`), one letter can be swapped at the start of a turn and the turn goes on (`swapOne`, once per turn, `s.freeSwapUsed`), several = pass. Hint always shown. The board layout is ours (the real Junior layout is not reproduced). |
| `easy-draw.js` | Junior solo only: `makeJuniorDraw(dict)` → chooser for the child's draws (start, after a play, after a swap): 24 random draws tried, kept the one with ~43 % vowels, no tile worth 8+, few doubles, most 3–5-letter words from the rack alone. Passed to `createGame` / `playTiles` / `swapTiles` / `swapOne`; the computer draws normally. Not saved: a resumed Junior match keeps drawing kindly. |
| `junior-words.js` | Rude words (FR/EN/ES, best effort) the Junior computer never plays and the Junior hint never suggests; still valid if the child plays them. |
| `junior-words.js` | Rude words (FR/EN/ES, best effort) the Junior computer never plays and the Junior hint never suggests; still valid if the child plays them. |
| `game.js` | Match state and transitions (`playTiles`, `swapTiles`, `passTurn`), end + rack adjustments, `restoreGame` (shape + every tile of the active set accounted for). |
| `dict.js` | `loadDictionary(lang)`: `/data/scrabble/ods9.txt` (fr), `enable.txt` (en), `es.txt` (es), each once; sorted array + binary search (`has`, `hasPrefix`). |
| `tiles.js` | Tile sets per word language (fr 102 official; en 100 official; es 100 = official minus the CH/LL/RR tiles, given to C/L/R; Ñ is a letter, no K/W), `useTileSet(lang)` switches the live `LETTERS`/`LETTER_INDEX`/values/bag, premium layout, constants. Board cell: `""`, uppercase letter, or lowercase = blank played as that letter. Rack: `"?"` = blank. |
| `board-view.js`, `rack-view.js` | DOM painting: cells `data-id="scrabble-cell-h8"` (column letter + row), rack `scrabble-rack-tile-<n>`, score bubble, cursor, last move. |
| `input.js`, `keys.js` | Pointer tap/drag (ghost lifted above the finger on touch), keyboard (letters, Backspace, arrows, Enter, Escape). |
| `dialogs.js`, `hud.js`, `end.js` | Sheets (blank picker, swap/pass, letters left, definitions, handoff), score cards + guide line + buttons, end card. |
| `define.js`, `define-view.js` | "Définir" button (replaces the in-match ✖; the header back button stays): arms a tap-a-word mode (`s.lookup` in `play.js`, works any time, even on the computer's turn or after the end), then `define(word, lang)`: French reads our copy first (`/data/scrabble/defs/fr/<first 2 letters>.txt` + `forms.txt`, see Dictionaries; decision 0057), live Wiktionary only for words missing there; English/Spanish always live (fr/en/es editions, CORS `origin=*`, `Api-User-Agent` header): accent-insensitive search → first definition of the language section, first sentence only; inflected forms ("pluriel de", "plural of", "forma del plural de"…) followed once to the base word. Files and answers cached per page. Text is inserted as plain text only. The sheet ends with the CC BY-SA credit (`scrabble-define-license`). The word's language = the current player's if valid there (matters in FR + ES). |
| `i18n.js`, `copy-*.js` | FR/EN/ES strings + rules HTML. |
| `setup.js` | Start-screen choices, level slider (`scrabble-level-slider`, 0–4, labels below are `data-setting` buttons) + the level's record, names, resume button. |
| `styles.css`, `slider.css`, `scores.css`, `stage.css`, `board.css`, `sheets.css` | Page + start screen; level slider; score cards; stage layout (portrait column, aspect ≥ 6/5 side column); board/tiles/rack; sheets. |

## Rules in code

- First word covers the centre and has ≥ 2 letters. Every word formed must be in the word language's list; the game refuses unknown words before playing (no challenge, no penalty) and says which word.
- Bingo +50 for 7 tiles. Swap only with ≥ 7 tiles in the bag (new tiles drawn before the old go back). Swaps and passes are scoreless turns.
- End: bag empty and a rack emptied (that player gains the other rack's value, the other loses it), or 4 scoreless turns in a row (each loses their own rack value).
- Human always plays first (player 1 in duo, "Vous" in solo).
- `finish({ won, score })` in solo when there is a winner; `finish()` for a solo draw and for two-player games.

## Save / resume (decision 0054)

- Key `scrabble-saved-game` = `{ config: { mode, level, words, p1Lang, names }, game, draft }` (a save without `words` is French). Written at match start, after every change (draft edits included) and on `pagehide` / `visibilitychange`. Cleared in `onEnd`.
- A computer turn in progress restarts on resume; two-player resume always shows the handoff sheet first (racks stay hidden).
- Other keys: `scrabble-settings-v2` (mode, level, words, p1Lang, sound, hints — the Hint button, off by default, switched on in the options panel — names), `scrabble-stats` (`{ <level>: { won, played } }`).

## Dictionaries

Built by `node scripts/scrabble_dict.mjs <source> <lang> <out.txt>` (accents dropped except Ñ, words with a letter missing from that set skipped, 2–15 letters, front-coded):

| file | lang | words | gzip | source |
|---|---|---|---|---|
| `ods9.txt` | fr | 407 128 | ~250 KB | github.com/clementjosse/dico-scrabble `liste_mots.txt` (ODS 9, Larousse/FISF copyright, see `STATE.md`) |
| `enable.txt` | en | 168 551 | ~240 KB | github.com/dolph/dictionary `enable1.txt` (ENABLE, public domain) |
| `es.txt` | es | 635 090 | ~300 KB | github.com/words/an-array-of-spanish-words `index.json` (MIT) |

French definitions: `node scripts/scrabble_defs.mjs <raw-wiktextract-data.jsonl.gz>` (kaikki.org French Wiktionary extract, ~700 MB, keep outside the repo; ~1 min) → `defs/fr/`: 321 files by first two letters (one per ODS prefix, possibly empty; biggest `DE.txt` ~530 KB, ~107 KB gzip) + `forms.txt` (282 shared inflection texts, `~` = base word). 396 395 / 407 128 ODS words covered (97.4 %), 8.4 MB, ~2.7 MB gzip. Titles and base words are front-coded; `define.js` keeps a file as a sorted array and binary-searches it (first lookup in `DE` ~20 ms on a desktop). CC BY-SA 4.0: keep `defs/LICENSE.txt` and the sheet credit. Line format in the script header.
