# STATE

Replace on every update. Max 40 lines. History lives in git and `docs/decisions/`.

Status: Rules 0053 and 0054 written; games being migrated to resume-every-match.
Focus: Memory home screen — the pitch line is gone, so the setup panel starts on the themes.
Level: L0

Context:
- Working_On: memory setup (pitch removed). Resume-every-match lots 2–4 still open.
- Relevant_Files: `public/games/memory/index.html`, `i18n.js`, `styles.css`; `docs/tasks/resume-every-match.md`
- Do_Not_Touch: `apps/**`; Easy Frog, GameBoy Web; Space Cadet engine (`"resumable": false`).
- Relevant_Decisions: 0054, 0053, 0051

Next:
- Lots 2–4 per the task file; owner phone check after each lot.
- Owner: options sheet bottom clears the phone navigation bar.
- Owner to play Bridge (bid box, explanations, hint, undo, last trick, claim, open hands, 4-colour, reload then "Reprendre", full Chicago) and judge robot bidding.
- Owner: hub fresh browser — Tous selected, Plus récents on, Moins récents gone.
- Owner to play Sudoku and Jeu de dames on phone, tablet, desktop, then reload mid-game and "Reprendre".
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
- 2026-10-29 Memory setup: removed the pitch line in FR/EN/ES so the home panel starts on the themes.
- 2026-10-29 Decision 0054: quit keeps the save, "Reprendre" everywhere, Space Cadet `resumable: false`.
- 2026-10-29 Platform rules 0053 + viewport, collapsed rules, `dvh` checks.
- 2026-10-28 Bridge, hub sort, Sudoku, dames hint, Memory online (0051).
