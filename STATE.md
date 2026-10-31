# STATE

Replace on every update. Max 40 lines. History lives in git and `docs/decisions/`.

Status: Échecs (`/games/chess/`) added on the Jeu de dames shell: solo vs computer (4 levels) or two players, full rules (castling, en passant, promotion picker, all draws), save/resume.
Focus: Owner play-test of Échecs on phones; owner phone checks of resume (local + online) and of the Memory solo score.
Level: L1

Context:
- Working_On: none
- Relevant_Files: `public/games/chess/NOTES.md`; `docs/PLATFORM_RULES.md` sections 1, 6–8; `scripts/check-games.baseline.json` (only Tranquil and URL gaps left)
- Do_Not_Touch: `apps/**`; Easy Frog, GameBoy Web; Space Cadet engine (`"resumable": false`).
- Relevant_Decisions: 0054, 0053, 0051

Next:
- Owner: play Échecs on iPhone and Android (glyphs must show as text, not emoji), the 4 levels, castling, promotion, "Reprendre".
- Owner: play Memory solo, judge the points weights (`public/games/memory/points.js`).
- Owner phone check of resume in every game, then Memory and Yatzy online on two phones (away banner, "Reprendre en ligne") — see `docs/BACKLOG.md` Now.
- Owner: options sheet bottom clears the phone navigation bar.
- Owner to play Bridge (bid box, explanations, hint, undo, last trick, claim, open hands, 4-colour, full Chicago) and judge robot bidding.
- Owner to open Memory on the iPhone 17 Pro and the Xiaomi Pad 7, both orientations: setup with Jouer visible and no scroll; player 1 pill above the Safari toolbar.
- Platform leftovers: `0007_coins.sql` then `0008_match_coins.sql`; `ADMIN_USER_IDS` on coinchapp; Tranquil match start after its Vercel repoint.
- Proposed: `docs/ARCHITECTURE.md` still says 7 Hobby functions and omits `GET /api/popular`; `docs/SECURITY.md` does not list that public read.

Open_Questions:
- Yatzy online end-of-game crash (pre-existing, one-line fix in `docs/BACKLOG.md`): fix now?
- Git stash `wip-memory-aside` (another session, 2026-10-29) is still there; owner to keep or drop.
- Bridge and Échecs thumbnails are hand-made SVGs; swap for illustrated images if wanted.
- `.prettierignore` yatsy re-include would reformat it — owner call.
- SkiFree, Chip's Challenge and Space Cadet assets are copyrighted; Memory's Miraculous, Ghibli and Pat' Patrouille themes are AI art of licensed characters.

Blockers:
- Tranquil step: production still runs the old Vercel project.

Recent_Changes:
- 2026-10-31 Échecs: new game, rules verified by perft on 5 reference positions, AI in a worker (expert = 1.5 s iterative deepening).
- 2026-10-31 Memory solo: clock (starts on first flip, pauses when hidden) and points, forgotten-twin penalty.
- 2026-10-31 Resume lot 4: Memory, Yatzy, SkiFree, Space Cadet rules collapsed.
- 2026-10-29 Resume lots 2–3: 13 games + word games save the whole match; Chip's exact input replay.
