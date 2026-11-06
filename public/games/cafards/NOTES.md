# Salade de Cafards — notes

Local multiplayer (one shared device). Classic scripts, no modules, loaded
in this order: `i18n.js` (`window.CafardsI18n`), `deck.js`
(`window.CafardsDeck`), `setup.js` (`window.CafardsSetup`), `save.js`
(`window.CafardsSave`), `board.js` (`window.CafardsBoard`), then `game.js`.
Skins everything itself (no `base.css`).

## Files

- `game.js` — page shell: screens, start / resume / quit, turns, reveal,
  collect, win check, end card, save triggers, options panel.
- `i18n.js` — FR/EN/ES copy (`data-i18n`, `data-i18n-aria`), shared
  `bergamots-lang` read/write.
- `deck.js` — pure: official 128-card deck, balanced deck for other sizes,
  deal, card pose.
- `setup.js` — dashboard number inputs with − / + steppers, red-light
  toggle (`aria-pressed`), the per-turn red-light countdown.
- `board.js` — renders the two piles (last three cards) and the player
  chips.
- `save.js` — encode/validate/load/store/clear the match in progress.
- `preload.js` — fetches and decodes every image (8 card faces from
  `CafardsBoard.cardUrls`, background, banner) at page load and keeps them
  in memory; `ready()` makes Nouvelle partie / Reprendre / Rejouer wait,
  showing `cafards-loading` and disabling the buttons until done. A failed
  image never blocks the start.
- `styles.css` (frame, header skin, dashboard, dialogs, TV sizes),
  `board.css` (match table).
- `rules-{fr,en,es}.html` — loaded in the options panel iframe when the
  collapsed "Règles" `<details>` is opened.

## Images

All WebP, re-encoded from the original PNG/JPG (2.5 MB -> 258 KB).
`assets/cards/*.webp`: native size (298-325 x 540-555), which is what a
phone shows (card ~185 x 275 CSS px at DPR 2-3); don't upscale.
`assets/background.webp` (dashboard, 960 px wide, `cover`);
`assets/thumbnail.webp` (header banner and the hub tile, 320 px wide).

## Match lifecycle

- `state.phase`: `"setup"` → `"playing"` → `"ended"`.
- Game Dashboard (`cafards-dashboard-screen`): Reprendre (when a save
  exists), four steppers (players 2-8, cards 32-256 step 8, winners
  1-players, seconds 0.5-5), red-light toggle, Nouvelle partie
  (`cafards-start-button`): waits for `CafardsPreload.ready()`, then
  `MuchogamesMatch.start()` (1 coin), then deal.
- Match (`cafards-play-screen`): header ✖ (`cafards-quit-button`,
  `data-match-quit`) replaces the back arrow. Tap the active pile
  (`cafards-pile-a` / `-b`) to reveal; tap a player chip
  (`cafards-player-<n>`) to make that player collect the piles. Portrait:
  piles stacked; landscape: side by side.
- End (enough empty hands for `config.winners`, or revealing with an empty
  hand): `endMatch()` clears the save, `finish()` (no `won`: several
  players share the device), then the end card
  (`cafards-gameover-overlay`: winners, Rejouer, Menu du jeu).
- ✖ (after the shared "leave match?" dialog) → `showDashboard()`: quitting
  is not an end, the save stays and no `finish()`.

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

Resume (`cafards-resume-button`, above the settings): restores the state
(the shared language wins over the saved `lang`), writes the config back
into the inputs, calls `MuchogamesMatch.resume()` (no coin). The red-light
timer just restarts.

## TV

`/shared/js/tv-remote.js`: focus lands on Reprendre / Nouvelle partie, then
the active pile (`data-tv-focus` follows the active pile; a remote press on
a pile follows the switch). Arrow down reaches the player chips. Back = ✖ in
a match, Menu du jeu on the end card, the hub on the dashboard.
