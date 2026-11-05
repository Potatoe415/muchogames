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
- In a match the back button is replaced by ✕ (`pyramide-quit-button`, `data-match-quit`):
  shared "Leave match?" dialog, then back to the dashboard, save kept, no `finish()`.
  ↻ (`pyramide-restart-button`) and "Rejouer" only show on the game-over screen and start a new match.
- Deleted only at the real end (`nextRound` → `finish()`); a new match
  overwrites it.

## Layout and TV

- The page never scrolls: `.play-screen` is a grid of areas (teams, clue, main, side, cta) built by
  `playScreen()`; portrait stacks them, landscape puts the controls on the right (`style.css`).
  Long text scrolls inside its own area.
- `wordplayer.css` is still loaded for legacy rules; its `.word-card` min-height is overridden here.
- TV: `/shared/js/tv-remote.js`; each screen is a `[data-tv-screen]` with a `[data-tv-focus]` main button,
  re-focused on every phase change (`restoreFocus`). After a bet the focus moves to "Trouvé".
- The answer reveal works by hold (shown while pressed), quick tap (toggle) or Enter (toggle).
