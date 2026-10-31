# Memory — notes for agents

Twin cards. Vanilla ES modules. Read this before the sources.

## Files

| File | Role |
|---|---|
| `main.js` | Header, FR/EN/ES, setup / wait / play views, "Reprendre" buttons, preload, `MuchogamesMatch.start/finish/resume`, mute, save + away notice on `visibilitychange` / `pagehide`. |
| `online.js` | Online mode on `window.MuchogamesRoom` (`shared/CONTRACT.md`): create / join / resume, waiting screen, coin per room, board sync, away / back notices. |
| `online-seat.js` | Seat storage `muchogames_memory_online`, room error → copy key, idle online state, own name. |
| `prefs.js` | Language (`bergamots-lang`) and mute (`muchogames_memory_mute`) storage. |
| `wire.js` | Online board payload: `packWire`, `readWire` (validates the opponent's board, derives the phase), `sameBoard`. |
| `viewport.js` | CSS variables for the fixed header and the obstructed bottom strip (page bottom past `visualViewport` bottom; never `innerHeight`, which iOS 26 Safari counts under its floating toolbar). |
| `screen.js` | Bars, language, setup marks, wait screen, end copy, `finish` payload. |
| `chips.js` | Setup text buttons (mode, level, grid). |
| `pickers.js` | Setup thumbnails: theme (`card_01`) and card back. |
| `game.js` | Turn loop: reducer, 1200 ms miss, bot delays, save at creation and after every flip / close, timer cleanup. Solo clock (`elapsed()`, `setVisible()`), stamped into `state.elapsedMs`. |
| `points.js` | Solo points and `m:ss` clock text. |
| `reducer.js` | Pure state. `TURN` / `BOT` / `EVALUATING` / `GAME_OVER`. |
| `bot.js` | Memory bot. Reads `known` only, except the forced miss which skips the twin. |
| `deck.js` | Random N pairs from the theme, then Fisher-Yates, then `instanceId`. |
| `decks.js` | **Generated** by `scripts/memory_slice.py`: theme ids + card counts, back ids. |
| `faces.js` | Face ids (`"01"`…) and image URLs, built from `decks.js`. |
| `preload.js` | `new Image()` + `decode()` for the back and the match fronts. Never rejects; capped at `PRELOAD_MS`. |
| `persist.js` | `localStorage` key `muchogames_memory_state`, `v: 2`: `config` (mode, difficulty, grid, theme, back), `cards` (id, pair, face, status, mirrored), `scores`, `misses`, `forgotten` and `elapsedMs` (solo; 0 when absent), `active`, `known` (robot memory), `openIds`, `phase`. Drops a finished, broken, or v1 save. Open cards come back open (two = the miss closes 1200 ms after resuming); a save without `openIds` (older) reopens face-down. The phase is derived, not trusted. |
| `sound.js` | Web Audio beeps. `unlock()` on the first pointer. |
| `view.js` | DOM grid. Front `<img>` exists only while `FLIPPED` or `MATCHED`. |
| `i18n.js` | FR/EN/ES copy, theme names, rules. |
| `debug.js` | Options > Debug toggle (or `?debug=1`), kept in `localStorage` `muchogames_memory_debug`. Live overlay (copy / fold / move / close), cyan and red lines at the visible top and bottom, dashed outlines on nav, app, panel, stage and bars, event log (viewport resize/scroll, orientation, focus). |
| `debug-report.js` | The report text: every key element's box with `CUT n below/above` flags against `visualViewport`, viewport numbers, `vh/svh/lvh/dvh` and safe-area insets in px, computed paddings, media queries, game state, device. |

## Assets

- `cards/<theme>/card_NN.webp`, `backs/back_NN.webp`: 400×400 WebP q85, full-bleed (5 % inset crop).
- Regenerate: drop the `gemini-*.jpg` sheets in `tmp-resources/` (git-ignored), run `python scripts/memory_slice.py` (Pillow). Sheets and theme ids are listed at the top of the script.

## Rules in code

- Themes: `miraculous`, `objets`, `ghibli`, `pat-patrouille`, `dinosaures`, `nature` (18 faces each), `cuba`, `harry-potter` (36), `camions` (35: `SKIP` in the script drops a duplicate drill rig). Backs `01`–`08` from `gemini-verso1.jpg` and `gemini-verso2.jpg`.
- `assets/fond.webp` covers the whole page. Each player's name and score sit on a pill: white and gray when waiting, solid blue (player 1) or pink (player 2) with white text on their turn. The board frame uses the same color. The body is `100dvh` tall. On a touch screen the page keeps an empty 48px strip at the bottom (more if the OS reports a larger inset, or the measured covered strip + 8px), so the player 1 row, the cards and the buttons stay above the phone navigation.
- During a match the header back arrow is `memory-quit-button` (`data-match-quit`): confirming returns to this game's setup. On the setup screen the same corner is the hub link. New game is the icon beside it. The header is fixed, so choosing Continuer cannot scroll it off the screen.
- Setup screen fits without scrolling from 360×560 up. The panel shrinks into the space below the header (`flex: 0 1 auto`, never a percentage `max-height`: Safari ignores it and the panel overflowed top and bottom). Only the theme tiles give up height (natural 3:2, down to 24px); the theme list stays a direct child of the constrained column (`display: contents` wrappers) so its minimum holds. Landscape from 640px wide: themes and backs left, the rest right. Under 640px tall: tighter padding, smaller backs and chips. The panel scrolls only as a last resort: at 360×560 with the "Reprendre" row shown and Robot (≈38px) or En ligne (≈48px) selected.
- Modes: `solo`, `pass` (two humans, one device), `bot` (`easy` 0.25, `medium` 0.5, `hard` 1), `online` (two devices).
- Online: the creator's grid, theme and back are used; the creator deals the deck when the second seat fills. Each device publishes the whole board after its own move (published before it is painted, so a final move is written before the room is left). The reducer refuses a flip from the seat that is not `active`. Only the player whose miss it is closes the cards after 1200 ms. The local player is always the bottom blue bar. No `localStorage` board save online (the room holds the board); the seat is kept under `muchogames_memory_online`. A finished room is left without deleting it, so the other player keeps the end screen. Rematch opens a new room.
- Online leaving: quitting (✖, or Annuler once the room is playing), a reload or a hidden tab keeps the room and the seat; the device stops listening (`leaveGame()` without `deleteCurrent`) and broadcasts `sendNotice({ kind: "away", seat })`. The other player keeps the board and sees `memory-away-banner`; their turn logic just waits. Resuming (or the tab visible again) sends `kind: "back"`; an opponent's move also clears the banner. Notices are ephemeral: a player who reloads while the other is away no longer sees the banner. Annuler while nobody joined yet deletes the room and forgets the seat; so does creating a new room. A `?game=` link to the stored room waits for "Reprendre" instead of rejoining.
- Grids: `4x4`, `4x6`, `6x6`. Each match draws its pairs at random from the theme.
- Mirror: always on. Half the pairs (random) get `mirrored: true` on both cards; the front `<img>` is flipped with `scaleX(-1)`. Saved and sent online; a board whose twins disagree is refused. Old saves without the flag read as not mirrored.
- Play waits for the preload, then calls `MuchogamesMatch.start` (no coin spent on a load).
- A found pair fades out after 0.6 s (`data-status="matched"`, CSS only); its grid cell stays empty.
- Solo score: +100 per pair, −20 per miss, −30 more per forgotten miss (the first card's twin was already in `known`), −1 per whole second, never below 0 (`points.js`). The clock starts on the first flip, pauses while the page is hidden or the match is left, stops at game over, and is saved; a resumed match with time on it restarts the clock at once. Top bar: "Solo" + pairs left on the left pill, the time on its own pill on the right (`memory-clock`, solo only); bottom pill: live points. End card: points, then pairs · misses (forgotten) · time. `finish({ won: true, score })` sends the points.
- A pair scores 1 and the same player stays. A miss waits 1200 ms, closes, then switches (not in solo).
- Clicks die in `EVALUATING`, `BOT`, and `GAME_OVER`. The open card cannot be clicked again.
- `finish({ won })` for solo, vs bot and online (from the local seat). Pass-and-play and a tie omit `won`.
- Leaving never loses the match (decision 0054). The save is written at match creation, after every flip and close, and on `visibilitychange` / `pagehide`; it is deleted only at game over, and overwritten when a new match starts (Jouer, new-game icon, Rejouer). Setup choices and the ✖ (`data-match-quit`, no `finish()`) keep it. The setup screen shows `memory-resume-button` (local save) and `memory-resume-online-button` (stored seat, with the code) above the choices; nothing reopens by itself. Resuming calls `MuchogamesMatch.resume` (no second coin); online, one coin per room code (`MuchogamesRoom.chargeOnce`). `<body data-match-saved>`.
