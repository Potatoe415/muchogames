# Salade de Cafards — notes

Local multiplayer (one shared device). Classic scripts, no modules:
`save.js` (exposes `window.CafardsSave`) then `game.js`.

## Files

- `game.js` — i18n, deck/deal, piles, turn/timer, setup ↔ game screens.
- `save.js` — encode/validate/load/store/clear the match in progress.
- `rules-{fr,en,es}.html` — loaded in the options panel iframe when the
  collapsed "Règles" `<details>` is opened.

## Match lifecycle

- `state.phase`: `"setup"` → `"playing"` → `"ended"` (no end screen: the
  board stays in `mode-game` after the end).
- Start button: `MuchogamesMatch.start()` (1 coin) then deal. Guarded by
  `starting`/`phase` before calling `start()`.
- End (enough empty hands for `config.winners`, or revealing with an
  empty hand): `endMatch()` clears the save, then `finish()` (no `won`:
  several players share the device).
- In-match back button → `restartToSetup()`: quitting is not an end, the
  save stays and no `finish()`; the setup screen then offers "Reprendre".

## Save (`localStorage["cafards-current"]`, decision 0054)

Written at match start, after every reveal/turn change, after every
collect (loss), on language change, on `pagehide` and on
`visibilitychange` hidden. Only while `phase === "playing"`.

Content (`v: 1`): `started: true`, `lang`, `config` (`count`, `deckSize`,
`winners`, `timerOn`, `timerMs`), `players[]` (`hand` of `{type, veg}`,
`losses`, `alreadyWon`), `piles[2]` (cards `{type, veg, pose: {left, top,
angle}}`), `activePile`, `current`.

Validation drops the save if any field is off, if the total card count
differs from the deal, or if the match is already over.

Resume (`data-id="cafards-resume-button"`, shown above start only when a
valid save exists): restores the state, writes the config back into the
setup inputs, calls `MuchogamesMatch.resume()` (no coin). The red-light
timer just restarts.
