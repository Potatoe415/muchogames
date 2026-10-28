# STATE

Replace on every update. Max 40 lines. History lives in git and `docs/decisions/`.

Status: Bridge added (`/games/bridge/`): solo, South vs robots, SEF Majeure 5e, Chicago of 4 deals, 4 robot levels.
Focus: Bridge v1.
Level: L1

Context:
- Working_On: none
- Relevant_Files: `public/games/bridge/` (read its `NOTES.md` first), `public/hub-config.json`
- Do_Not_Touch: other games' folders; Easy Frog and GameBoy Web.
- Relevant_Decisions: 0052

Next:
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
- 2026-10-28 Bridge added (`bridge`, custom, `cartesdes`, solo, Chicago, SEF bidding, double-dummy endings).
- 2026-10-28 Hub opens on Tous, newest first. "Moins récents" removed.
- 2026-10-28 Sudoku added (`sudoku`, custom, `autres`, solo, 4 levels).
- 2026-10-28 Jeu de dames: Hint button only when the "Bouton Indice" option is on (off by default).
- 2026-10-28 Memory online (decision 0051): `api/rooms/*` + `game_id`, shared `online-room.js`, Yatzy wired to it.
