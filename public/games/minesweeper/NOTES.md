# Minesweeper (Démineur) — notes for agents

Solo classic Windows Minesweeper. Vanilla ES modules, DOM grid of `<button>`
cells (no canvas), no dependency. Read this before opening the sources.

## Files

| File | Role |
|---|---|
| `main.js` | Page shell: i18n, options panel (language, rules), level picker + resume button, HUD counters, end overlay, flag-mode toggle, `MuchogamesMatch.start/resume/finish`, pause on options open / tab hidden, save triggers. |
| `game.js` | `createGame({ host, level, portrait, saved, t, onHud, onEnd, onMove })` → `{ snapshot, setPaused, setFlagMode, relabel, destroy }`. One match: wires model, view, input and the timer; `saved` resumes a stored match, `onMove` fires after every reveal/flag/chord. |
| `board.js` | Pure model: `Uint8Array` `mine` / `adjacent` / `state` (`HIDDEN / FLAGGED / OPEN`), mines placed on first reveal, iterative flood fill, `chord`, `toggleFlag`, `isWon`, `restoreBoard` (saved field, recomputes `adjacent` / `opened` / `flags`). |
| `save.js` | Match in progress in `localStorage`: `encodeMatch` / `decodeMatch` (validated, corrupt saves dropped), `loadMatch` / `storeMatch` / `clearMatch`. |
| `view.js` | Builds the cell buttons (`data-id="minesweeper-cell-<row>-<col>"`), fits `--cell` to the board host (14–44 px, `ResizeObserver`), paints cells, end-of-match reveal. |
| `input.js` | Pointer delegation on the board: tap/left click = primary, long press 380 ms / right click / F key = flag; keyboard Enter/Space via `click` with `detail === 0`. |
| `levels.js` | Beginner 9×9/10, Intermediate 16×16/40, Expert 30×16/99; `levelLayout` swaps rows/cols on a portrait stage. |
| `i18n.js` | FR/EN/ES copy + rules HTML. |
| `styles.css`, `play.css` | Page, start screen, cards / play stage, HUD, grid and cells (`play.css` loads second). |

## Rules in code

- First reveal is always safe: the clicked cell and its 8 neighbours are excluded when the field allows it, so the first click opens an area.
- Primary action on an open number = chord (opens the other neighbours when the flag count matches, wrong flags can lose).
- Flag mode (HUD toggle) turns the primary tap into a flag toggle; long press still flags in both modes.
- Timer starts on the first reveal, caps at 999, pauses while the options panel is open or the tab is hidden.
- Face button, "Rejouer" and the level buttons start a new match (1 coin) and overwrite the save. Restarting mid-match calls `finish()` without `won` first (records nothing).
- Save `minesweeper-current` (JSON `{ v, level, flagMode, elapsed (ms), rows, cols, mines, placed, mine: "0/1" per cell, state: "0/1/2" per cell }`): written at match start, after every reveal/flag/chord, on flag-mode toggle, every 1 s, on tab hidden and on `pagehide`. The board keeps its saved size/orientation (portrait swaps rows/cols); before the first reveal `placed` is false and no mine is stored.
- "Reprendre" (`minesweeper-resume-button`) shows only when a valid save exists and calls `resume()` (no coin); the timer goes on from `elapsed` when mines are placed. Quitting (back button, reload, closed tab) keeps the save and records nothing; the save is deleted only on win/loss, with `finish({ won })`.
- `finish({ won })` on win/loss (solo, unambiguous player); no `score` sent (time is lower-is-better). Best time per level: `minesweeper-best-times` (JSON `{ beginner, intermediate, expert }` in seconds).
