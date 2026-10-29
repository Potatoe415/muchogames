# Pyramide — notes

Team word game on one shared device. `app.js` holds state, rules and rendering;
`i18n.js` the FR/EN/ES copy; `save.js` the match save (decision 0054).

## Match save

- Key: `localStorage["pyramide-current"]`, JSON, `version: 1`.
- Saved: `locale`, `deckIds` (shuffled enigma ids, not the texts), `deckIndex`,
  `activeTeamIndex`, both teams (`id`, `name`, `points`), and the round
  (`phase`, `enigmaId`, `bricksRemaining`, `currentWordIndex`, `currentBet`,
  `wordResults`, `finalSolved`, `bonusApplied`).
- Written by every `render()` while a match is on screen (start, bet, word
  result, round change, team switch, language change) and on `pagehide` /
  `visibilitychange` hidden.
- Load validates every field; an invalid save, or one whose enigma ids are no
  longer in the deck data, is deleted. The deck is rebuilt with
  `normalizeDeck(rawData, locale)`.
- Splash shows "Reprendre" (`data-id="pyramide-resume-button"`) when a save
  exists; it calls `MuchogamesMatch.resume()` (no coin).
- Back button and ↻ during a match: back to splash, save kept, no `finish()`.
  ↻ on the game-over screen starts a new match.
- Deleted only at the real end (`nextRound` → `finish()`); a new match
  overwrites it.
