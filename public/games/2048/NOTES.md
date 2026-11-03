# 2048 — notes for agents

Solo sliding-tile puzzle: slide the 4×4 board, equal tiles merge, reach 2048, keep going if you like. Calm skin (misty sage, pastel tiles, soft pentatonic sounds, no timer). Vanilla ES modules, DOM tiles (no canvas), Web Audio, no dependency, hand-made SVG hub tile. TV remote through the shared `/shared/js/tv-remote.js`. Read this before opening the sources.

## Files

| File | Role |
|---|---|
| `main.js` | Page shell: i18n, options panel (language, sound, collapsed rules), start screen (resume, new game, best), menu/win/end overlays, `MuchogamesMatch.start/resume/finish`, save on every move + `visibilitychange` + `pagehide`. |
| `game.js` | `createGame({ board, host, saved, muted, canPlay, onHud, onWin, onEnd })` → `{ undo, finish, snapshot, setMuted, destroy }`. One match: moves, undo, win/end detection, sounds. `UNDOS` = 3. |
| `board.js` | Pure rules: `move(cells, dir)` → new cells + `moved`, `gained`, `top`, `merged` ids, `absorbed` `{ id, at }`; `spawn` (2, or 4 at 10 %), `canMove`, `maxValue`, `toValues` / `fromValues`. Tiles are immutable `{ id, value }`. |
| `view.js` | Board DOM: 16 cells + one element per tile id, placed with `--r` / `--c`; sized by a ResizeObserver on the board area (`--cell`, `--pad`). Merge = both slide (130 ms), survivor pops with the new value, the other is removed. A new move flushes the previous animation. |
| `input.js` | Arrows / WASD / ZQSD on the document (skipped when `defaultPrevented`, so the TV remote's focus moves win), swipe on the board (≥ 24 px), tap near an edge (outside the central 12 %) as the tap alternative. |
| `hud.js` | Score, best (live max), undo count / disabled state (stage + menu button), floating "+N". |
| `i18n.js`, `prefs.js`, `save.js`, `audio.js` | FR/EN/ES copy + rules; language, sound, best (`2048-best`); match save; sounds. |
| `styles.css`, `start.css`, `stage.css`, `tiles.css` | Frame, cards, buttons, overlays, TV ring; start screen; HUD + board layout; cells, tiles, animations, palette (`[data-value]` → `--tile-bg` / `--tile-ink`, also used by the start logo). |

## Rules in code

- Win: first time a 2048 tile exists → win overlay ("Continuer" or "Terminer la partie"). `won` stays true after an undo.
- End: no empty cell and no equal neighbours → end overlay (fades in after 0.6 s so the final board shows). `finish({ won, score })`, `won` = 2048 reached. "Terminer la partie" ends the same way.
- ↶ Undo: one step back (the state before the last move), 3 per match.
- Turn-based, so a resumed match comes back straight to the board; the ☰ menu is the pause (Continue, Undo, Quit with `data-match-quit`).
- Layout: portrait = HUD row on top, board anchored under it; landscape = HUD column left, board centred. Root font 2.4vmin (16 px min); ≥ 900×500 the header grows and the stage keeps 3 % from the edges.
- TV (`?tv=1` or TV user agent): focus lands on Reprendre / Nouvelle partie, then the board, which owns all four arrows (`data-tv-keys`). Back = menu on the stage, Continue in the menu / win overlay, Quit on the end card.

## Saved match (decision 0054)

- Key `2048-current`, JSON `v: 1`: `cells` (16 values, 0 = empty), `score`, `undos`, `won`, `undo` (`{ cells, score }` or `null`). Tile ids are regenerated on load.
- `decodeMatch` drops the save unless every cell is 0 or a power of two ≤ 2¹⁷, at least one tile exists, counts are within limits.
- Start screen `2048-resume-button` restores it and calls `MuchogamesMatch.resume()`. Deleted at the end, before `finish()`.
