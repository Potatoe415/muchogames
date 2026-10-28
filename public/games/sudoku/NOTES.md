# Sudoku — notes for agents

Solo classic 9×9 Sudoku. Vanilla ES modules, DOM grid of `<button>` cells,
no dependency. Grids are generated in the browser (< 50 ms), always with a
single solution. Read this before opening the sources.

## Files

| File | Role |
|---|---|
| `main.js` | Page shell: i18n, options panel (language, show-errors and show-hint switches, fill notes, change level, rules), level picker + resume button, end overlay, `MuchogamesMatch.start/resume/finish`, hold while options open / tab hidden. |
| `play.js` | `createPlay({ els, state, prefs, t, onWin })` → `{ setHold, setPrefs, fillNotes, relabel, destroy }`. One grid on screen: model + view + input + timer, saves after every move. |
| `model.js` | `newState(level, { puzzle, solution })` (plain JSON) and `createModel(state)`: `setValue` (same digit again clears), `toggleNote`, `erase`, `hint`, `fillNotes`, `undo` (300 steps), mistakes count. |
| `generator.js` | Bitmask backtracking solver, `countSolutions`, `solvableWithSingles`, `generate(level)`: random full grid, then clues removed in symmetric pairs while the grid stays unique / matches the level. |
| `levels.js` | Clue floor + technique per level: easy 40 and medium 32 (singles only), hard 28 and expert minimal (needs more than singles, up to 40 tries). |
| `grid.js` | Index helpers (`rowOf`, `colOf`, `boxOf`), `UNITS`, `PEERS`, digit masks (bits 1..9), `shuffle`. |
| `view.js` | Builds nine `.sd-box` with cells (`data-id="sudoku-cell-<row>-<col>"`, 1-based, DOM order is box by box — use `data-index`) and the pad (`sudoku-pad-<d>`); paints selection, peers, same digit, errors, hints, notes, remaining counts; flashes completed units. |
| `input.js` | Click delegation on board / pad, tool buttons, keyboard (digits by `code` so AZERTY works, arrows, Backspace/Delete/0, N, Z / Ctrl+Z, H, P). |
| `store.js` | localStorage: `sudoku-current` (grid in progress, validated on read), `sudoku-best-times` (seconds per level, 0 = none), `sudoku-prefs` (`showErrors`, `showHint`, both off by default). |
| `i18n.js`, `rules.js` | FR/EN/ES copy + `formatTime`; rules HTML. |
| `styles.css`, `board.css` | Theme variables (light + `prefers-color-scheme: dark`), start / end cards; play stage. Grid side = `min(100cqw, 100cqh)` of `.sd-board-area`; landscape (`min-aspect-ratio: 6/5`) moves tools + 3×3 pad to the right. |

## Rules in code

- A level button starts a match (1 coin). "Reprendre" resumes the saved grid with `resume()` (no coin). "Changer de niveau" calls `finish()` without `won` but keeps the grid saved.
- Win = every value equals the solution → `finish({ won: true })`, saved grid cleared, best time kept if lower (hints allowed).
- Mistakes are counted against the solution whether or not they are shown in red.
- The Hint button (and the H key) only exists while the `showHint` option is on.
- Timer pauses with the pause button (grid hidden), while the options panel is open and while the tab is hidden.
