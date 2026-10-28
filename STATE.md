# STATE

Replace on every update. Max 40 lines. History lives in git and `docs/decisions/`.

Status: Sudoku added (`/games/sudoku/`, custom, `autres`, solo): 4 levels, notes, hints, undo, mistakes in red, resume after reload, best time per level, light/dark, portrait and landscape layouts.
Focus: Sudoku.
Level: L1

Context:
- Working_On: none
- Relevant_Files: `public/games/sudoku/*` (see its `NOTES.md`), `public/hub-config.json` (`sudoku` entry)
- Do_Not_Touch: other games' folders; Easy Frog and GameBoy Web.
- Relevant_Decisions: 0050, 0052

Next:
- Owner to play Sudoku on phone, tablet and desktop: 4 levels, notes, hint, undo, pause, reload mid-game then "Reprendre", win screen and record.
- Owner to try the hub sort on a phone: three options, tab bar scrolls, pinned order returns when the active option is tapped again.
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
- 2026-10-28 Sudoku added (`sudoku`, custom, `autres`, solo, 4 levels).
- 2026-10-28 Hub sort: newest / oldest / most played, tab bar scrolls (decision 0052).
- 2026-10-28 Jeu de dames: level picked with a 4-step slider; Jeu de dames added (`checkers`).
- 2026-10-25 Memory online (decision 0051): `api/rooms/*` + `game_id`, shared `online-room.js`, Yatzy wired to it.
