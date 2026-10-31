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

## TV mode (`html.tv`)

Couch layout for a TV browser (Sony Bravia / Google TV, Android TV, Fire TV,
Tizen, webOS), played with the remote. `app.js` is untouched: same questions,
same flow, same save.

- `tv.js` (classic script in `<head>`): turns the mode on from `?tv=1` / `?tv=0`
  (remembered in `localStorage` `millionaire-tv`), else the stored choice, else
  a TV user agent. Options panel button `millionaire-tv-mode-button` toggles it.
  Lays the page on a 1920x1080 canvas zoomed to the viewport (`--tv-zoom`,
  `--tv-w`, `--tv-h`), moves the music button into the top bar, places the
  focus (start/resume button, the question card on each new question, a
  dialog's close button), asks for fullscreen and a screen wake lock on start.
- `tv-nav.js`: arrows move the focus to the nearest control (spatial
  navigation), OK is the native Enter click, Back/Escape closes the open
  dialog or panel, else leaves the screen (in-match ✖, result → home, start → hub).
- `tv.css` (canvas, top bar, ladder always shown on the right, start/result,
  dialogs) and `tv-game.css` (game grid, lifelines, lozenge question/answers
  coloured through `--tv-edge` / `--tv-fill`). Only px, no viewport units.
