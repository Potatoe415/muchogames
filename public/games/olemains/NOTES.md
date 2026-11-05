# Olé Mains (Jeu de mains) — notes

Timed party game: pick a deck, a word appears, "Trouvé" (+1) or "Passer"
(0) until the deck or the timer runs out. Words come from
`public/data/olemains/words.json` (fr/en/es per word), rules from
`public/data/olemains/rules_<lang>.html`. Party game: `finish()` with no
`won` and no score (decision 4.3/4.4 of `docs/PLATFORM_RULES.md`).

## Files

- `main.js` — `OlemainsGame` controller: Game Dashboard, match start /
  resume / pause / continue, turns, timer, end screen, ✖ quit, save triggers.
- `ui.js` — deck choice, timer − / + stepper, resume button, HUD, screens,
  pause overlay, end screen copy.
- `i18n.js` — FR/EN/ES copy (`data-i18n`, `data-i18n-aria`), shared
  `bergamots-lang` read/write.
- `gameState.js` — deck, remaining words, word on screen (`currentWord`),
  score, time left.
- `timer.js` — 1 s countdown; restart with `start(timeLeft)`.
- `save.js` — the match in progress in `localStorage`.
- `dom.js`, `validation.js` — element refs, words.json shape check.
- `style.css` (frame, dashboard, buttons, header/TV sizes), `play.css`
  (HUD, card, controls, pause overlay, end screen).

## Screens

- Game Dashboard (`olemains-dashboard-screen`): title, Reprendre (when a
  save exists), timer stepper (10-300 s, step 10), deck choice (one pressed,
  `olemains-deck-<id>`), Nouvelle partie (`olemains-start-button`).
- Match (`olemains-play-screen`): header ✖ (`olemains-quit-match-button`,
  `data-match-quit`) replaces the back arrow; HUD, word card, Passer /
  Trouvé. Portrait: stacked; any landscape (phone, desktop, TV): card left,
  HUD and buttons right.
- End (`olemains-gameover-screen`): reason (deck empty / time up), score,
  Rejouer (new match, 1 coin), Menu du jeu.

## Pause

The clock stops (and the match is saved) when the ✖ or the gear is
pressed, or the page goes hidden; the pause overlay's Continuer restarts
it. A resumed match always comes back paused.

## Save (`olemains-current`, decision 0054)

JSON `{ v: 1, deck, title, words, current, score, timeLeft }`:
`deck` = index in `decks`, `title` = that deck's title (checked on load),
`words` = indexes into the deck's `words` still to draw (draw order: last
first), `current` = index of the word on screen, `score`, `timeLeft` (s).
Anything that fails validation against the loaded words.json is dropped.

- Written at match start (after `MuchogamesMatch.start` resolves `true`),
  after every Trouvé/Passer, every timer tick (1 s), on pause, on ✖ quit,
  on `pagehide`. Only while a match is in play.
- Deleted in `endGame` (deck or timer ran out), before the end screen and
  `finish()`; overwritten by a new match.
- ✖ quit keeps the save and does not call `finish()`; the dashboard then
  shows Reprendre (`olemains-resume-button`).
- Resume calls `MuchogamesMatch.resume()` (no coin), shows the same word in
  the current language, paused.

## TV

`/shared/js/tv-remote.js`: focus lands on Reprendre / Nouvelle partie, then
on Trouvé in a match, Continuer in the pause, Rejouer at the end. Back =
✖ (shared "leave match?" dialog) in a match, Continuer in the pause, Menu
du jeu at the end, the hub on the dashboard.
