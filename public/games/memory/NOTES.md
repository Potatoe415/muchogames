# Memory — notes for agents

Twin cards. Vanilla ES modules. Read this before the sources.

## Files

| File | Role |
|---|---|
| `main.js` | Header, FR/EN/ES, setup, preload, `MuchogamesMatch.start/finish/resume`, mute, rotate. |
| `screen.js` | Bars, language, setup marks, end copy, `finish` payload. |
| `chips.js` | Setup text buttons (mode, level, grid). |
| `pickers.js` | Setup thumbnails: theme (`card_01`) and card back. |
| `game.js` | Turn loop: reducer, 1200 ms miss, bot delays, save at end of turn, timer cleanup. |
| `reducer.js` | Pure state. `TURN` / `BOT` / `EVALUATING` / `GAME_OVER`. |
| `bot.js` | Memory bot. Reads `known` only, except the forced miss which skips the twin. |
| `deck.js` | Random N pairs from the theme, then Fisher-Yates, then `instanceId`. |
| `decks.js` | **Generated** by `scripts/memory_slice.py`: theme ids + card counts, back ids. |
| `faces.js` | Face ids (`"01"`…) and image URLs, built from `decks.js`. |
| `preload.js` | `new Image()` + `decode()` for the back and the match fronts. Never rejects; capped at `PRELOAD_MS`. |
| `persist.js` | `localStorage` key `muchogames_memory_state`, `v: 2` (adds `theme`, `back`). Drops a finished, broken, or v1 save. A mid-turn save (one flip or `EVALUATING`) reopens as face-down. |
| `sound.js` | Web Audio beeps. `unlock()` on the first pointer. |
| `view.js` | DOM grid. Front `<img>` exists only while `FLIPPED` or `MATCHED`. |
| `i18n.js` | FR/EN/ES copy, theme names, rules. |

## Assets

- `cards/<theme>/card_NN.webp`, `backs/back_NN.webp`: 400×400 WebP q85, full-bleed (5 % inset crop).
- Regenerate: drop the `gemini-*.jpg` sheets in `tmp-resources/` (git-ignored), run `python scripts/memory_slice.py` (Pillow). Sheets and theme ids are listed at the top of the script.

## Rules in code

- Themes: `miraculous`, `objets`, `ghibli`, `pat-patrouille`, `dinosaures`, `nature` (18 faces each), `cuba` (36). Backs `01`–`08` from `gemini-verso1.jpg` and `gemini-verso2.jpg`.
- `assets/fond.webp` covers the whole page. Each player's name and score sit on a white pill. On a touch screen the page keeps an empty 48px strip at the bottom (more if the OS reports a larger inset or the browser covers the page), so the player 1 row, the cards and the buttons stay above the phone navigation.
- During a match the header back arrow is `memory-quit-button` (`data-match-quit`): confirming returns to this game's setup. On the setup screen the same corner is the hub link. New game is the icon beside it.
- Modes: `solo`, `pass` (two humans, one device), `bot` (`easy` 0.25, `medium` 0.5, `hard` 1).
- Grids: `4x4`, `4x6`, `6x6`. Each match draws its pairs at random from the theme.
- Play waits for the preload, then calls `MuchogamesMatch.start` (no coin spent on a load).
- A found pair fades out after 0.6 s (`data-status="matched"`, CSS only); its grid cell stays empty.
- A pair scores 1 and the same player stays. A miss waits 1200 ms, closes, then switches (not in solo).
- Clicks die in `EVALUATING`, `BOT`, and `GAME_OVER`. The open card cannot be clicked again.
- `finish({ won })` for solo and vs bot. Pass-and-play and a bot tie omit `won`.
- New game and any setup change delete the save. Reload of an unfinished game calls `resume` (no second coin).
