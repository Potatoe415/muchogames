# Checkers (Jeu de dames) — notes for agents

Draughts vs the computer (4 levels) or two players on one device. Two rule
sets: international 10×10 (default) and English 8×8. Vanilla ES modules, DOM
board of `<button>` squares under a CSS-positioned piece layer, no dependency.
Read this before opening the sources.

## Files

| File | Role |
|---|---|
| `main.js` | Page shell: i18n, settings, screens, end overlay, stats, save/resume, `MuchogamesMatch.start/resume/finish`, Ctrl+Z / H shortcuts. |
| `play.js` | `createPlay({ host, match, config, bot, t, showMoves, onUpdate, onMoved, onEnd })` → `{ undo, hint, setShowMoves, relabel, destroy }`. Selection (tap, multi-hop routes, drag), turn flow, computer turns, undo, hint. |
| `rules.js` | Pure rules: `VARIANTS`, `initialBoard`, `legalMoves` (mandatory + maximal captures, flying kings), `applyMove`, `crowns`, `squareNumber` (1-based notation). Board = `Int8Array`, `side * (1 man / 2 king)`, light (+1) at the bottom. |
| `match.js` | `createMatch(variantId)`: history, `undo`, `status()` (blocked = loss, draws by threefold repetition or `drawPlies` king-only moves), `serialize()`; `restoreMatch` replays saved moves against the rules. |
| `ai.js` | Negamax alpha-beta + capture extension. Levels: easy (depth 1, 45% random), medium (3), hard (5), expert (iterative deepening, 1.4 s), `hint` (5). Returns an index into `legalMoves`. |
| `ai-worker.js`, `bot.js` | Module worker running `ai.js`; `bot.think()` falls back to the main thread if module workers fail. `reset()` terminates a search (undo, quit). |
| `view.js` | Builds the board (`data-id="checkers-square-<sq>"`), pieces, marks (selected, target, step, movable, last, hint), hop-by-hop animation, drag rendering, `squareAt`. Flipped 180° when the solo player has the dark pieces. |
| `input.js` | Pointer press = select/play, drag past 8 px = drop to play; keyboard via `click` with `detail === 0`. |
| `hud.js` | Player bars (name, pieces left, status / last move) and Undo/Hint state. |
| `setup.js` | `[data-setting][data-value]` choice buttons (start screen + options panel), the level slider (`data-id="checkers-level-slider"`, 0–3, labels below are `data-setting` buttons) + the selected level's record, resume button, `matchConfig`. |
| `store.js` | localStorage: `checkers-settings`, `checkers-saved-game` (`{ config, moves }`), `checkers-stats` (`{ <level>: { won, played } }`). All validated on read. |
| `sound.js` | Web Audio blips (move, capture, crown, win, lose, invalid). |
| `i18n.js`, `copy-*.js` | FR/EN/ES strings + rules HTML, one file per language. |
| `styles.css`, `slider.css`, `stage.css`, `board.css` | Page + start screen + end card; level slider; stage layout (portrait: bars above/below; aspect ≥ 6/5: side column); board, pieces, themes (`wood`, `classic`, `ocean`). |

`index.html` is ~460 lines: shared header/options boilerplate plus the static
start screen, stage and end card markup.

## Rules in code

- International: white first, men capture backwards, flying kings, the capture taking the most pieces is mandatory, a man crowns only if it ends on the far row. English: black first, men forward only, short kings, any complete capture, crowning ends the move.
- Taken pieces stay on the board until the move ends (no double jump over one piece). Same destination + same taken set = one move (deduped).
- Tap a destination to play; when two routes share a destination with different captures, tap the intermediate landing squares (`is-step` marks).
- Solo undo takes back to the player's previous turn (cancels a computer search in progress). No undo after the end.
- `finish({ won })` in solo when there is a winner; `finish()` for draws and two-player games. Quitting mid-match ends it without a result and drops the save.
- The Hint button (and the H shortcut) exists only when the `hints` setting is on (options panel, off by default).
- A game in progress is saved after every move; the start screen offers "Reprendre" (no coin, `MuchogamesMatch.resume`).
