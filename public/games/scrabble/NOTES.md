# Scrabble — notes for agents

Scrabble vs the computer (5 levels, slider on the start screen) or two players on one device.
Words in French, English or Spanish (start-screen choice `words`, defaults to
the interface language on a first visit), or "FR + ES": each player checked
against their own language (`p1Lang` = player 1's / your language; `playerLangs`
in `tiles.js`), one shared bag (`fr-es` set: French values + Ñ, 102 tiles),
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
| `ai.js` | Levels: kid (aims at 12 % of the best score, at most ~10 pts, words of 3–4 letters; in kid solo the Hint button always shows and suggests main words ≤ 5 letters, `KID_HINT_MAX`), easy (30 %, words ≤ 6 letters), medium (55 %), hard (80 %), expert (best score + leave value). No move: swap (bag ≥ 7) or pass. `bestMove` = hint. |
| `game.js` | Match state and transitions (`playTiles`, `swapTiles`, `passTurn`), end + rack adjustments, `restoreGame` (shape + every tile of the active set accounted for). |
| `dict.js` | `loadDictionary(lang)`: `/data/scrabble/ods9.txt` (fr), `enable.txt` (en), `es.txt` (es), each once; sorted array + binary search (`has`, `hasPrefix`). |
| `tiles.js` | Tile sets per word language (fr 102 official; en 100 official; es 100 = official minus the CH/LL/RR tiles, given to C/L/R; Ñ is a letter, no K/W), `useTileSet(lang)` switches the live `LETTERS`/`LETTER_INDEX`/values/bag, premium layout, constants. Board cell: `""`, uppercase letter, or lowercase = blank played as that letter. Rack: `"?"` = blank. |
| `board-view.js`, `rack-view.js` | DOM painting: cells `data-id="scrabble-cell-h8"` (column letter + row), rack `scrabble-rack-tile-<n>`, score bubble, cursor, last move. |
| `input.js`, `keys.js` | Pointer tap/drag (ghost lifted above the finger on touch), keyboard (letters, Backspace, arrows, Enter, Escape). |
| `dialogs.js`, `hud.js`, `end.js` | Sheets (blank picker, swap/pass, letters left, definitions, handoff), score cards + guide line + buttons, end card. |
| `define.js`, `define-view.js` | "Définir" button (replaces the in-match ✖; the header back button stays): arms a tap-a-word mode (`s.lookup` in `play.js`, works any time, even on the computer's turn or after the end), then `define(word, lang)` asks Wiktionary (fr/en/es editions, CORS `origin=*`, `Api-User-Agent` header): accent-insensitive search → first definition of the language section, first sentence only; inflected forms ("pluriel de", "plural of", "forma del plural de"…) followed once to the base word. Cached per page. Text is inserted as plain text only. The word's language = the current player's if valid there (matters in FR + ES). |
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
