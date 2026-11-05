# 4 en ligne — notes for agents

Connect Four for two players on one device (hot-seat, no bot): 7 columns × 6 rows, Red always starts, first to line up 4 discs (horizontal, vertical or diagonal) wins, a full grid is a draw. DOM grid (no canvas), no sound, no dependency, hand-made SVG hub tile. "Puissance 4" / "Connect Four" are Hasbro trademarks: the title is "4 en ligne" / "Four in a Row" / "4 en línea". Read this before opening the sources.

## Files

| File | Role |
|---|---|
| `main.js` | Page shell: i18n, options panel (language, collapsed rules), Game Dashboard (Resume with the disc count, New game) ↔ play screen, `MuchogamesMatch.start/resume/finish`, save on every move / `pagehide` / `visibilitychange`. |
| `rules.js` | Pure: `newMatch()`, `drop(match, col)` → new match (same object when the drop is refused), `canDrop`, `winningLine`, `replay(moves)` → match or `null`, `isOver`. The board is 7 column arrays listed bottom first (1 = red, 2 = yellow). Runs in Node. |
| `board.js` | `createBoard(root, { onDrop })` → `{ render(match, { animate, label }) }`. One `<button>` per column (`connectfour-column-1..7`), cells `connectfour-cell-<col>-<row>` (row 1 = bottom). Click / tap / Enter / Space drop; Left / Right move between columns; digits 1-7 drop directly. |
| `save.js` | `muchogames_connectfour_save` = `{ v: 1, moves: [col…] }`. Read back by replaying the moves through the rules: an illegal or already-finished list is dropped. |
| `i18n.js` | FR/EN/ES copy; `rulesBody` is an array of paragraphs. |
| `style.css`, `board.css` | Frame, header colours, cards, buttons, TV ring, short-landscape dashboard in two columns; play layout, grid (largest 7:6 box in its area, container units), discs, fall + win animations. |

## Rules in code

- A full column is refused: the status line says so and the turn does not change. After a win or a draw no column takes a disc.
- End: the status line names the winner (or the draw), the 4+ winning discs pulse and the others dim, the end panel (Replay / Menu) shows above the grid (beside it in landscape). The grid stays visible.
- Result model: no individual result (several players on one device, PLATFORM_RULES 4.4): `finish({})`, no `won`, no score, no personal best. Replay is a new match and calls `start()` (1 coin).
- Leaving: the ✕ (`connectfour-quit-button`, `data-match-quit`) asks through `game-session.js`, then shows the dashboard; the save stays. The save is deleted at the end of the match, right before `finish()`.
- Layout: portrait = status (+ end panel) on top, grid below; landscape = status column left (8-14em), grid right. Shell margins 40 px bottom / 24 px sides (PLATFORM_RULES 6.2); desktop / TV (`min-width: 960px` and `min-height: 500px`) 3vw / 2dvh / `max(40px, 4dvh)`. Root font `clamp(16px, 2.4vmin, 64px)`.
- TV (`?tv=1`): focus lands on Reprendre / Nouvelle partie, then column 4; Left / Right move between columns (`data-tv-keys="left right"`), OK drops. The end panel is a `data-tv-screen`, so the focus moves to Rejouer; Back = Menu there, the ✕ (leave dialog) during play.

## Checks

- Browser check used for this game: headless Chromium over CDP (no Playwright package needed: Node's built-in `WebSocket`), stubbing `MuchogamesMatch.start` to `async () => true`.
