# STATE

Replace on every update. Max 40 lines. History lives in git and `docs/decisions/`.

Status: Decision 0054 done: every in-repo game (except Space Cadet, exempt) resumes its match exactly after any exit; rules collapsed everywhere.
Focus: Owner phone checks of resume (local + online).
Level: L1

Context:
- Working_On: none
- Relevant_Files: `docs/PLATFORM_RULES.md` sections 1, 6–8; each game's `NOTES.md` (save key + content); `scripts/check-games.baseline.json` (only Tranquil and URL gaps left)
- Do_Not_Touch: `apps/**`; Easy Frog, GameBoy Web; Space Cadet engine (`"resumable": false`).
- Relevant_Decisions: 0054, 0053, 0051

Next:
- Owner phone check of resume in every game, then Memory and Yatzy online on two phones (away banner, "Reprendre en ligne") — see `docs/BACKLOG.md` Now.
- Owner: options sheet bottom clears the phone navigation bar.
- Owner to play Bridge (bid box, explanations, hint, undo, last trick, claim, open hands, 4-colour, full Chicago) and judge robot bidding.
- Owner: hub fresh browser — Tous selected, Plus récents on, Moins récents gone.
- Owner to open Memory on the iPhone 17 Pro and the Xiaomi Pad 7, both orientations: setup with Jouer visible and no scroll; player 1 pill above the Safari toolbar. If not, Options > Debug > copy the report.
- Platform leftovers: `0007_coins.sql` then `0008_match_coins.sql`; `ADMIN_USER_IDS` on coinchapp; Tranquil match start after its Vercel repoint.
- Proposed: `docs/ARCHITECTURE.md` still says 7 Hobby functions and omits `GET /api/popular`; `docs/SECURITY.md` does not list that public read.

Open_Questions:
- Yatzy online end-of-game crash (pre-existing, one-line fix in `docs/BACKLOG.md`): fix now?
- Git stash `wip-memory-aside` (another session, 2026-10-29) is still there; owner to keep or drop.
- Bridge thumbnail is a hand-made SVG; swap for an illustrated image if wanted.
- `.prettierignore` yatsy re-include would reformat it — owner call.
- SkiFree, Chip's Challenge and Space Cadet assets are copyrighted; Memory's Miraculous, Ghibli and Pat' Patrouille themes are AI art of licensed characters.

Blockers:
- Tranquil step: production still runs the old Vercel project.

Recent_Changes:
- 2026-10-31 Resume lot 4: Memory (open cards, online seat kept + away banner), Yatzy (Reprendre local/online, away notices, sw v44), SkiFree (exact run), Space Cadet rules collapsed.
- 2026-10-29 Resume lots 2–3: 13 games + word games save the whole match; Chip's exact input replay.
- 2026-10-29 JezzBall Facile/Normal; Memory debug overlay and iOS toolbar fix.
- 2026-10-29 Decisions 0053 (screens, system bars, collapsed rules) and 0054 (quit keeps the save, Space Cadet exempt).
