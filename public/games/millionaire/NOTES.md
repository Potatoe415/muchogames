# Millionaire (Qui veut gagner des millions) — notes

Solo quiz: 15 rounds, 4 lifelines, optional 30 s timer. `app.js` holds the
config, FR/EN/ES copy, game flow and audio; `save.js` holds the match save.
Question banks: `assets/data/<lang>_millionaire.json` (read-only data).

## Storage

| Key | Content |
|---|---|
| `millionaire_used_questions_v1:<lang>` | ids already drawn, per language (a question is never drawn twice) |
| `millionaire-current` | the match in progress (decision 0054), JSON below |

`millionaire-current` (`v: 1`):

- `language`, `timerEnabled`, `timeRemaining` (seconds), `round` (0-based).
- `lifelines`: `{ fiftyFifty, audience, phone, swap }`, `true` = still available.
- `question`: the question on screen as shown — `id`, `difficulty`, `prompt`,
  shuffled `answers` (`text`, `isCorrect`, `hidden` for 50:50), `correctIndex`,
  `audience` (vote percents per answer or `null`), `phoneText` (or `null`).
- `lock`: `null`, the locked answer index, or `-1` (timer ran out).
- `modal`: `"audience"`, `"phone"` or `null` — the lifeline dialog left open.

Validated on load (`decodeMatch`); an invalid save is deleted.

## When it is written / deleted

- Written when a question is shown (match start, next round, swap), on each
  lifeline, the moment an answer is locked (before the reveal waits), every
  timer second, when a lifeline dialog is closed, on `pagehide` and on
  `visibilitychange` hidden, and when the match is left.
- Deleted by `finishGame` (win / wrong / timeout) just before `finish()`;
  replaced when a new match starts.

## Leaving and resuming

- Back button, ↻ mid-match (`data-match-quit`) and a language change
  mid-match all return to the start screen without `finish()`; the save stays.
  On the result screen ↻ starts a new match.
- The start screen shows "Reprendre" (`millionaire-resume-button`) when a
  valid save exists. Resume loads the saved language's question bank, calls
  `MuchogamesMatch.resume()` (no coin), restores the saved question (no new
  draw), restarts the timer from the saved seconds, reopens the lifeline
  dialog, and replays the reveal of a locked answer.
- `state.matchId` stops the pending reveal waits of a match that was left.

## Layout (phone, desktop)

- `.app-shell` is a 100dvh flex column with the platform margins (40px bottom, 24px sides); the
  `html:not(.tv)` block at the end of `style.css` fits each screen without page scroll (portrait,
  landscape two-column answers, landscape-phone compact result). Screens and dialogs only fade.
- Header: home + "i" (prize ladder toggle) left, ↻ + options right. Music and TV toggles live in
  the options panel. The dashboard card holds Resume, the timer choice, then Start.

## TV mode (`html.tv`)

Couch layout for a TV browser, played with the remote. Same questions, flow and save.

- `/shared/js/tv-remote.js` (in `<head>`): turns the mode on from `?tv=1` / `?tv=0` (remembered in
  `millionaire-tv`, same key as before) or a TV user agent; arrows, OK, Back, focus, fullscreen and wake
  lock (`MuchogamesTv.play()` in `startGame` / `resumeMatch`). Driven by `data-tv-screen` on the three
  screens (kept in sync with `.active` through `hidden`), `data-tv-overlay` on `#modalBackdrop`,
  `data-tv-focus` (start/resume, the question card, replay, a dialog close button) and `data-tv-back`
  (home, in-match ↻, result "Home", dialog close).
- `tv.js`: only the 1920x1080 canvas zoomed to the viewport (`--tv-zoom`, `--tv-w`, `--tv-h`), the
  options toggle `millionaire-tv-mode-button`, and the question card refocus on each new question.
  `tv-nav.js` is gone (replaced by the shared script).
- `tv.css` (canvas, top bar, ladder always shown on the right, start/result, dialogs) and `tv-game.css`
  (game grid, lifelines, lozenge question/answers). Only px, no viewport units.
