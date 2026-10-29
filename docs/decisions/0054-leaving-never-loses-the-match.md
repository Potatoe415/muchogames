# 0054 — Leaving never loses the match

Date: 2026-10-29
Status: Accepted
Decision: Leaving a match by any route (back button, in-match ✖, reload, closed tab) keeps its full save; the start screen offers "Reprendre" (no coin, `MuchogamesMatch.resume()`), quitting is not an end (no `finish()`, no loss), and the save goes only at the real end or when a new match starts. Online, leaving keeps the seat and the room. Space Cadet is exempt (`"resumable": false`).
Context: Owner request: a match left by mistake must come back exactly where it was. Audit 2026-10-29: only Sudoku came close; Checkers, Bridge, Memory and Yatzy deleted the save on quit, most games saved nothing, Chip's Challenge recorded a loss on quit.
Rationale: One rule for every game, with the quit dialog telling the truth: it says "saved" only on pages marked `data-match-saved`, so games not yet migrated keep the plain question. `npm run check` requires `MuchogamesMatch.resume(` and `data-match-saved` (gaps baselined until each game is migrated). Chip's Challenge resumes exactly by replaying recorded inputs (deterministic engine). The `<id>-resume-button` start-screen ids already in use stay (`data-id` stability).
Consequences: Supersedes the "✖ ends the match with `finish()`" line of 0047 and the "deleted when the player quits" line of 0053. Every game owns a `localStorage` save key documented in its `NOTES.md`. Online games need an "opponent away" state. A real-time game resumes paused.
Alternatives_Rejected: Auto-reopening the match at load (Memory/Yatzy today: the player cannot choose a new match first); "Reprendre" for Space Cadet dealing a fresh table (free-coin exploit); rebuilding Space Cadet's WASM (forbidden by its `NOTES.md`); restarting Chip's level instead of exact replay (owner chose exact).
