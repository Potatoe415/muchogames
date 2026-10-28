# STATE

Replace on every update. Max 40 lines. History lives in git and `docs/decisions/`.

Status: Hub opens on Tous, sorted newest first. "Moins récents" is gone. Sudoku (`/games/sudoku/`) unchanged.
Focus: Hub sort default.
Level: L1

Context:
- Working_On: none
- Relevant_Files: `hub.js`, `hub-sort.js`
- Do_Not_Touch: other games' folders; Easy Frog and GameBoy Web.
- Relevant_Decisions: 0052

Next:
- Owner to open the hub with a fresh browser: Tous is selected, Plus récents is on, Moins récents is gone.
- Owner to play Sudoku on phone, tablet and desktop: 4 levels, notes, hint, undo, pause, reload mid-game then "Reprendre", win screen and record.
- Proposed (owner to confirm): `docs/ARCHITECTURE.md` still says 7 Hobby functions and does not list `GET /api/popular`; `docs/SECURITY.md` does not list that public read.
- Owner to play Jeu de dames on phone, tablet and desktop: 4 levels, two players, both rule sets, drag and tap, undo/hint, reload mid-game then "Reprendre".
- Owner to play Memory online on two phones; also one Yatzy online match.
- Platform rules leftovers: owner runs `0007_coins.sql` then `0008_match_coins.sql`; `ADMIN_USER_IDS` on the `coinchapp` Vercel project; Tranquil `start_muchogames_match` + `data-id`s after its Vercel repoint.

Open_Questions:
- Sudoku and Jeu de dames thumbnails are hand-made SVGs; swap for illustrated images if wanted.
- `.prettierignore`'s `!public/games/yatsy/**` never re-included yatsy (a parent-dir exclusion needs `!public/games/yatsy/` too). Fixing yatsy would reformat it — owner call.
- SkiFree, Chip's Challenge and Space Cadet assets are copyrighted Microsoft/Epyx; Memory's Miraculous, Ghibli and Pat' Patrouille themes are AI art of licensed characters. Fine for a fan site, flag if it goes commercial.

Blockers:
- Tranquil step: its production still runs the old Vercel project.

Recent_Changes:
- 2026-10-28 Hub opens on Tous, newest first. "Moins récents" removed.
- 2026-10-28 Sudoku added (`sudoku`, custom, `autres`, solo, 4 levels).
- 2026-10-28 Jeu de dames: level picked with a 4-step slider; Jeu de dames added (`checkers`).
- 2026-10-25 Memory online (decision 0051): `api/rooms/*` + `game_id`, shared `online-room.js`, Yatzy wired to it.
