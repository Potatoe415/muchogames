# Minesweeper (Démineur) — notes for agents

Solo classic Windows Minesweeper. Vanilla ES modules, DOM grid of `<button>`
cells (no canvas), no dependency. Read this before opening the sources.

## Files

| File | Role |
|---|---|
| `main.js` | Page shell: i18n, options panel (language, rules), level picker, HUD counters, end overlay, flag-mode toggle, `MuchogamesMatch.start/finish`, pause on options open / tab hidden. |
| `game.js` | `createGame({ host, level, portrait, t, onHud, onEnd })` → `{ setPaused, setFlagMode, relabel, destroy }`. One match: wires model, view, input and the timer. |
| `board.js` | Pure model: `Uint8Array` `mine` / `adjacent` / `state` (`HIDDEN / FLAGGED / OPEN`), mines placed on first reveal, iterative flood fill, `chord`, `toggleFlag`, `isWon`. |
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
- Face button and "Rejouer" both start a new match (1 coin). Restarting mid-match calls `finish()` without `won` first.
- `finish({ won })` on win/loss (solo, unambiguous player); no `score` sent (time is lower-is-better). Best time per level: `minesweeper-best-times` (JSON `{ beginner, intermediate, expert }` in seconds).
