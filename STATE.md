# STATE

Replace on every update. Max 40 lines. History lives in git and `docs/decisions/`.

Status: Rules 0053 (screens, system bars, input, collapsed rules) and 0054 (leaving never loses the match) written and checked; games being migrated.
Focus: `docs/tasks/resume-every-match.md` — lot 1 (rules, shared quit copy, checks) done; lots 2–4 = games.
Level: L2

Context:
- Working_On: resume-every-match
- Relevant_Files: `docs/PLATFORM_RULES.md` (sections 1, 6–8), `scripts/check-games.mjs` + baseline, `public/shared/js/game-session.js`, `public/shared/css/game-header.css`
- Do_Not_Touch: `apps/**`; Easy Frog, GameBoy Web; Space Cadet engine (`"resumable": false`).
- Relevant_Decisions: 0054, 0053, 0050, 0047

Next:
- Lots 2–4 per the task file; owner phone check after each lot.
- Owner: open any game's options panel on a phone, check the sheet's bottom clears the navigation bar.
- Owner to play Bridge on phone, tablet and desktop: bid with the box, tap calls for explanations, hint, undo, last trick, claim, open hands, 4-colour deck, reload mid-match then "Reprendre", full Chicago to the end screen.
- Owner (bridge player) to judge the robots' bidding and play; list sequences that feel wrong so the rules in `bid-*.js` can be tuned.
- Owner to open the hub with a fresh browser: Tous is selected, Plus récents is on, Moins récents is gone.
- Owner to play Sudoku on phone, tablet and desktop: 4 levels, notes, hint, undo, pause, reload mid-game then "Reprendre", win screen and record.
- Proposed (owner to confirm): `docs/ARCHITECTURE.md` still says 7 Hobby functions and does not list `GET /api/popular`; `docs/SECURITY.md` does not list that public read.
- Owner to play Jeu de dames on phone, tablet and desktop: 4 levels, two players, both rule sets, drag and tap, undo/hint, reload mid-game then "Reprendre".
- Owner to play Memory online on two phones; also one Yatzy online match.
- Platform rules leftovers: owner runs `0007_coins.sql` then `0008_match_coins.sql`; `ADMIN_USER_IDS` on the `coinchapp` Vercel project; Tranquil `start_muchogames_match` + `data-id`s after its Vercel repoint.

Open_Questions:
- Bridge thumbnail is a hand-made SVG; swap for an illustrated image if wanted.
- `.prettierignore`'s `!public/games/yatsy/**` never re-included yatsy (a parent-dir exclusion needs `!public/games/yatsy/` too). Fixing yatsy would reformat it — owner call.
- SkiFree, Chip's Challenge and Space Cadet assets are copyrighted Microsoft/Epyx; Memory's Miraculous, Ghibli and Pat' Patrouille themes are AI art of licensed characters. Fine for a fan site, flag if it goes commercial.

Blockers:
- Tranquil step: its production still runs the old Vercel project.

Recent_Changes:
- 2026-10-29 Decision 0054: quit keeps the save, "Reprendre" everywhere, `resumes-match` + `marks-match-saved` checks, Space Cadet `resumable: false`.
- 2026-10-29 Platform rules 0053 + 3 new checks (viewport meta, collapsed rules, `dvh`); 39 existing gaps baselined.
- 2026-10-28 Bridge added (`bridge`, custom, `cartesdes`, solo, Chicago, SEF bidding, double-dummy endings).
- 2026-10-28 Hub opens on Tous, newest first. "Moins récents" removed.
- 2026-10-28 Sudoku added (`sudoku`, custom, `autres`, solo, 4 levels).
- 2026-10-28 Jeu de dames: Hint button only when the "Bouton Indice" option is on (off by default).
- 2026-10-28 Memory online (decision 0051): `api/rooms/*` + `game_id`, shared `online-room.js`, Yatzy wired to it.
