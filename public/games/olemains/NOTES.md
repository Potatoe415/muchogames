# Olé Mains — notes

Timed party game: pick a deck, a word appears, "Trouvé" (+1) or "Passer"
(0) until the deck or the timer runs out. Words come from
`public/data/olemains/words.json` (fr/en/es per word), rules from
`public/data/olemains/rules_<lang>.html`.

## Files

- `main.js` — `OlemainsGame` controller: setup screen, match start/resume,
  turns, timer, end, quit, save triggers.
- `gameState.js` — deck, remaining words, word on screen (`currentWord`),
  score, time left.
- `timer.js` — 1 s countdown; restart with `start(timeLeft)`.
- `ui.js` — deck menu, resume button (FR/EN/ES copy), HUD, views.
- `save.js` — the match in progress in `localStorage`.
- `dom.js`, `validation.js` — element refs, words.json shape check.

## Save (`olemains-current`, decision 0054)

JSON `{ v: 1, deck, title, words, current, score, timeLeft }`:
`deck` = index in `decks`, `title` = that deck's title (checked on load),
`words` = indexes into the deck's `words` still to draw (draw order: last
first), `current` = index of the word on screen, `score`, `timeLeft` (s).
Anything that fails validation against the loaded words.json is dropped.

- Written at match start (after `MuchogamesMatch.start` resolves `true`),
  after every Trouvé/Passer, every timer tick (1 s), on ✖ quit, on
  `pagehide` and `visibilitychange` hidden. Only while a match is in play.
- Deleted in `endGame` (deck or timer ran out), before the 3 s game-over
  card; overwritten by a new match.
- ✖ quit (`data-match-quit`) keeps the save and does not call `finish()`;
  the setup screen then shows "Reprendre" (`olemains-resume-button`).
- Resume calls `MuchogamesMatch.resume()` (no coin), shows the same word in
  the current language and restarts the timer from the saved time left (the
  game has no pause).
