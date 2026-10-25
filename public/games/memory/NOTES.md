# Memory — notes for agents

Twin cards. Vanilla ES modules. Read this before the sources.

## Files

| File | Role |
|---|---|
| `main.js` | Header, FR/EN/ES, setup, `MuchogamesMatch.start/finish/resume`, mute, rotate. |
| `screen.js` | Bars, language, end copy, `finish` payload. |
| `chips.js` | Setup buttons. |
| `game.js` | Turn loop: reducer, 1200 ms miss, bot delays, save at end of turn, timer cleanup. |
| `reducer.js` | Pure state. `TURN` / `BOT` / `EVALUATING` / `GAME_OVER`. |
| `bot.js` | Memory bot. Reads `known` only, except the forced miss which skips the twin. |
| `deck.js` | Fisher-Yates, then `instanceId`. |
| `faces.js` | 18 placeholder faces. `image: null` until real URLs. |
| `persist.js` | `localStorage` key `muchogames_memory_state`. Drops a finished or broken save. A mid-turn save (one flip or `EVALUATING`) reopens as face-down. |
| `sound.js` | Web Audio beeps. `unlock()` on the first pointer. |
| `view.js` | DOM grid. Face markup exists only while `FLIPPED` or `MATCHED`. |
| `i18n.js` | FR/EN/ES copy and rules. |

## Rules in code

- Modes: `solo`, `pass` (two humans, one device), `bot` (`easy` 0.25, `medium` 0.5, `hard` 1).
- Grids: `4x4`, `4x6`, `6x6`.
- A pair scores 1 and the same player stays. A miss waits 1200 ms, closes, then switches (not in solo).
- Clicks die in `EVALUATING`, `BOT`, and `GAME_OVER`. The open card cannot be clicked again.
- `finish({ won })` for solo and vs bot. Pass-and-play and a bot tie omit `won`.
- New game and any setup change delete the save. Reload of an unfinished game calls `resume` (no second coin).
