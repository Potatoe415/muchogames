# STATE

Replace on every update. Max 40 lines. History lives in git and `docs/decisions/`.

Status: Resume-every-match lot 2 shipped (Dames, Bridge, Sudoku, Démineur, Pyramide, Black Stories resume exactly after any exit).
Focus: `docs/tasks/resume-every-match.md` — lot 3 (medium games) next.
Level: L2

Context:
- Working_On: resume-every-match lots 3–4.
- Relevant_Files: `docs/tasks/resume-every-match.md`, `docs/PLATFORM_RULES.md` section 8, `scripts/check-games.baseline.json`
- Do_Not_Touch: `apps/**`; Easy Frog, GameBoy Web; Space Cadet engine (`"resumable": false`).
- Relevant_Decisions: 0054, 0053, 0051

Next:
- Lots 3–4 per the task file.
- Owner phone check, lot 2: in each of the 6 games start a match, leave by back / ✖ / closing the tab, reopen, "Reprendre" = same state, no coin.
- Owner: options sheet bottom clears the phone navigation bar.
- Owner to play Bridge (bid box, explanations, hint, undo, last trick, claim, open hands, 4-colour, reload then "Reprendre", full Chicago) and judge robot bidding.
- Owner: hub fresh browser — Tous selected, Plus récents on, Moins récents gone.
- Owner to play Sudoku and Jeu de dames on phone, tablet, desktop, then reload mid-game and "Reprendre".
- Owner to open Memory on the iPhone 17 Pro and the Xiaomi Pad 7, both orientations: setup with Jouer visible and no scroll; in a match, the player 1 pill fully above the Safari toolbar. If not, Options > Debug > copy the report and send it.
- Owner to play Memory online on two phones; also one Yatzy online match.
- Platform leftovers: `0007_coins.sql` then `0008_match_coins.sql`; `ADMIN_USER_IDS` on coinchapp; Tranquil match start after its Vercel repoint.
- Proposed: `docs/ARCHITECTURE.md` still says 7 Hobby functions and omits `GET /api/popular`; `docs/SECURITY.md` does not list that public read.

Open_Questions:
- Bridge thumbnail is a hand-made SVG; swap for an illustrated image if wanted.
- `.prettierignore` yatsy re-include would reformat it — owner call.
- SkiFree, Chip's Challenge and Space Cadet assets are copyrighted; Memory's Miraculous, Ghibli and Pat' Patrouille themes are AI art of licensed characters.

Blockers:
- Tranquil step: production still runs the old Vercel project.

Recent_Changes:
- 2026-10-29 Memory: Options > Debug layout overlay (`debug.js`, `debug-report.js`); body `100dvh` + covered strip measured from `visualViewport` (iOS 26 toolbar cropped player 1); setup fits without scroll, pitch removed.
- 2026-10-29 Resume lot 2: 6 games save the whole match, quit keeps it, rules collapsed, mobile viewport + `dvh`.
- 2026-10-29 Decision 0054: quit keeps the save, "Reprendre" everywhere, Space Cadet `resumable: false`.
- 2026-10-29 Platform rules 0053 + viewport, collapsed rules, `dvh` checks.
- 2026-10-28 Bridge, hub sort, Sudoku, dames hint, Memory online (0051).
