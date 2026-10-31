# Chess (Échecs) — notes for agents

Chess vs the computer (4 levels) or two players on one device. Built on the
Jeu de dames shell (`public/games/checkers/`): same page/screens/save/stats
layout, same module split. Vanilla ES modules, DOM board of `<button>`
squares under a CSS-positioned piece layer, no dependency. Read this before
opening the sources.

## Files

| File | Role |
|---|---|
| `main.js` | Page shell: i18n, settings, screens, end overlay, stats, save/resume, `MuchogamesMatch.start/resume/finish`, Ctrl+Z / H shortcuts. |
| `play.js` | `createPlay({ host, match, config, bot, t, showMoves, onUpdate, onMoved, onEnd })` → `{ undo, hint, setShowMoves, relabel, destroy }`. Selection (tap or drag), promotion, turn flow, computer turns, undo, hint. |
| `rules.js` | Pure rules: `initialPosition`, `pseudoMoves` (optionally captures only), `legalMoves`, `applyMove`, `attacked`, `inCheck`, `insufficientMaterial`, `positionKey`. Board = `Int8Array(64)`, index 0 = a8, `side * type` (pawn 1 … king 6), white (+1) at the bottom. Verified by perft on 5 reference positions. |
| `notation.js` | `san(pos, move, letters)`: algebraic notation with the language's piece letters (`letters` string in the copy). |
| `match.js` | `createMatch()`: history (`{ pos, move }`), `undo`, `status()` (checkmate, stalemate, dead position, fifty moves, threefold repetition), `keys()`, `serialize()`; `restoreMatch` replays saved moves against the rules. |
| `eval.js`, `ai.js` | Material + piece-square tables, endgame king table and mop-up. Negamax alpha-beta, quiescence, check extension; a root move back into an already seen position scores 0. Levels: easy (depth 1, no quiescence, 30% random), medium (2), hard (4), expert (iterative deepening, 1.5 s), `hint` (4). Returns an index into `legalMoves`. |
| `ai-worker.js`, `bot.js` | Module worker running `ai.js`; `bot.think({ pos, level, seen })` falls back to the main thread if module workers fail. `reset()` terminates a search (undo, quit). |
| `view.js` | Builds the board (`data-id="chess-square-<e4>"`), coordinates, pieces (Unicode glyphs, `paintGlyph`), marks (selected, target, capture, last, hint, check), move animation (rook too when castling), drag rendering, `squareAt`. Flipped 180° when the solo player has black. |
| `promo.js` | Promotion picker overlay (`chess-promotion`, `chess-promote-<piece>`); resolves the piece type or 0 (Cancel, backdrop, Escape). |
| `input.js` | Pointer press = select/play, drag past 8 px = drop to play; keyboard via `click` with `detail === 0`. |
| `hud.js` | Player bars (king glyph, name, pieces taken + material lead, status / last move in notation) and Undo/Hint state. |
| `setup.js` | `[data-setting][data-value]` choice buttons, the level slider (`chess-level-slider`, 0–3) + the selected level's record, resume button, `matchConfig`. |
| `store.js` | localStorage: `chess-settings`, `chess-saved-game` (`{ config, moves }`), `chess-stats` (`{ <level>: { won, drawn, played } }`). All validated on read. |
| `sound.js` | Web Audio blips (move, capture, check, promote, win, lose, invalid). |
| `i18n.js`, `copy-*.js` | FR/EN/ES strings + rules HTML, one file per language. |
| `styles.css`, `slider.css`, `stage.css`, `board.css` | Page, glyphs, start screen, overlays; level slider; stage layout (portrait: bars above/below; aspect ≥ 6/5: side column); board, pieces, themes (`wood`, `classic`, `ocean`). |

`index.html` is ~540 lines: shared header/options boilerplate plus the static
start screen, stage, promotion picker and end card markup.

## Pieces

Unicode chess glyphs with U+FE0E (text presentation, never emoji). White =
outline glyph drawn over the filled glyph in white (`::before` reads
`data-glyph`); black = filled glyph. Font stack prefers Segoe UI Symbol /
Noto Sans Symbols 2 / Apple Symbols.

## Rules in code

- Castling: tap the king, then its landing square (two squares aside). Rights are lost when the king or that rook moves or the rook is taken.
- The en passant square is kept only when an enemy pawn can take there, so repeated positions compare equal.
- A human promotion always opens the picker; the computer's promotion comes from its search.
- Solo undo takes back to the player's previous turn (cancels a computer search in progress). No undo after the end.
- `finish({ won })` in solo when there is a winner; `finish()` for draws and two-player games, only from `onEnd`.
- The Hint button (and H) exists only when the `hints` setting is on (options panel, off by default).

## Save / resume (decision 0054)

- Key `chess-saved-game` = `{ config: { mode, level, side }, moves: [[from, to, promo], …] }` (`match.serialize()`, possibly empty).
- Written right after `MuchogamesMatch.start` resolves true (zero moves), after every move and undo (`onMoved`), and on `pagehide` / `visibilitychange` hidden. Never written once the match is over.
- Restoring replays `moves` through `restoreMatch`: position, castling rights, en passant, fifty-move counter, repetition keys and the full undo history come back. Not saved (transient): the selection, a shown hint, an open promotion picker, a computer search in progress (it restarts on resume).
- A save that fails validation or replay is deleted on load. The start screen shows `chess-resume-button` only when the save replays; it never resumes by itself. Resuming calls `MuchogamesMatch.resume` (no coin).
- The ✖ (`chess-quit-button`, `data-match-quit`) and the hub back button keep the save and never call `finish()`.
