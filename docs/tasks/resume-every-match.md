# Task: resume-every-match

Level: L2
Status: In progress
Goal: Every in-repo game brings a match back exactly where it was after any exit, and meets decision 0053 (collapsed rules, mobile viewport, `dvh`).
Scope: `public/games/<id>/` of the games listed below, the wordpack shell (`wordplayer.html`, `wordplayer.js`, `public/shared/css/wordplayer.css`), `public/shared/js/online-room.js` + `api/rooms/*` only if the online "away" state needs it, `scripts/check-games.baseline.json`.
Do_Not_Touch: `apps/**` (own rules), Easy Frog, GameBoy Web, Space Cadet's engine (`"resumable": false`), dead `public/games/pictionary/*.js` (backlog item).
Assumptions:
- Resume restores from `localStorage` only; no server copy of local matches.
- A match left before its first move is still saved (the coin is already spent).
- Online: leaving keeps seat and room; the room's 48 h TTL still applies.
Plan:
1. Rules (`docs/PLATFORM_RULES.md` sections 1, 8), quit copy + `data-match-saved` in `game-session.js`, `resumable` flag, `resumes-match` / `marks-match-saved` checks → verify: `npm run check`.
2. Small: checkers, bridge, sudoku, minesweeper, pyramide, blackstories → verify per game: check + browser (start, play, back to hub, reopen, "Reprendre", same state; ✖ then "Reprendre"; reload mid-match; finish clears the save).
3. Medium: pipedream, jezzball, chipschallenge (exact, input replay), olemains, millionaire, cafards, wordpack shell → same verify; real-time games come back paused.
4. Large: memory, yatsy (online: away state, seat kept), skifree → same verify + two browsers for online.
Per game, always: remove its lines from the baseline; rules as closed `<details>`; viewport `width=device-width, initial-scale=1, viewport-fit=cover`; `dvh` next to every `vh`; `data-match-saved` on `<body>`; save key + what is saved in its `NOTES.md`.
Acceptance_Criteria:
- [ ] `scripts/check-games.baseline.json` has no line for any game in scope.
- [ ] Owner confirms on a phone, per lot: leave by back/✖/closed tab, reopen, "Reprendre" restores the exact state.
Security_Checklist: no endpoint change expected; if `api/rooms/*` changes, re-read `docs/SECURITY.md` (seat tokens).
Related_Decisions: 0053, 0054
Notes:
- Lot 1 done 2026-10-29.
- Lot 2 done 2026-10-29 (one commit per game), browser-checked: back/✖/reload then "Reprendre" restores the exact state. Keys: `checkers-saved-game`, `bridge-saved-match`, `sudoku-current`, `minesweeper-current`, `pyramide-current`, `blackstories-current`.
- Lot 3 done 2026-10-29: shipped by another session as one commit (af926c9, "on owner request"), then fixes c6eaf95 (Pipe Dream cleared save), 0c70454 (JezzBall capture points), f7a06c1 (Chip's notes). Each agent browser-tested its game. Keys: `pipedream-current`, `jezzball-current`, `chipschallenge-current` (input replay, checksum, fallback = fresh attempt), `olemains-current`, `millionaire-current` (locked answer saved before the reveal), `cafards-current`, `wordplayer-current-<gameId>` (cards by index: ids are not unique in Pictionary/Esquisse).
- Fixed on the way: Olé Mains timer never ended the match; wordplayer had no "ended" phase.
- Open: Millionaire and Pyramide back button returns to the game's start screen mid-match, not the hub (pre-existing). Olé Mains, wordplayer timers restart on "Reprendre" instead of coming back paused (no pause UI).
- Lot 4 left: Memory (another session is editing it), Yatzy, SkiFree, Space Cadet rules `<details>`.
- Pyramide's back button still returns to its splash mid-match (pre-existing, not the hub); ↻ mid-match now quits with the save kept.
