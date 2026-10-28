# STATE

Replace on every update. Max 40 lines. History lives in git and `docs/decisions/`.

Status: Hub category bar sorts the open tab (newest, oldest, most played) and scrolls sideways when the tabs overflow. Jeu de dames (`/games/checkers/`) and Memory online (decision 0051) unchanged.
Focus: Hub sort.
Level: L2

Context:
- Working_On: none
- Relevant_Files: `hub.js`, `hub-sort.js`, `hub-shelf.css`, `index.html`, `public/hub-config.json` (`added`), `api/popular.js`
- Do_Not_Touch: other games' folders; Easy Frog and GameBoy Web.
- Relevant_Decisions: 0052, 0047, 0051

Next:
- Owner to try the sort on a phone: three options, tab bar scrolls, pinned order returns when the active option is tapped again.
- Proposed (owner to confirm): `docs/ARCHITECTURE.md` still says 7 Hobby functions and does not list `GET /api/popular`; `docs/SECURITY.md` does not list that public read.
- Owner to play Jeu de dames on phone, tablet and desktop: 4 levels, two players, both rule sets, drag and tap, undo/hint, reload mid-game then "Reprendre".
- Owner to play Memory online on two phones: create, share link, join by code, misses, reload mid-match, quit, end, rematch. Also one Yatzy online match.
- Platform rules leftovers: owner runs `0007_coins.sql` then `0008_match_coins.sql`; `ADMIN_USER_IDS` on the `coinchapp` Vercel project; Tranquil `start_muchogames_match` + `data-id`s after its Vercel repoint.

Open_Questions:
- Jeu de dames thumbnail is a hand-made SVG; swap for an illustrated image if wanted.
- `.prettierignore`'s `!public/games/yatsy/**` never re-included yatsy (a parent-dir exclusion needs `!public/games/yatsy/` too). Fixing yatsy would reformat it — owner call.
- SkiFree, Chip's Challenge and Space Cadet assets are copyrighted Microsoft/Epyx; Memory's Miraculous, Ghibli and Pat' Patrouille themes are AI art of licensed characters. Fine for a fan site, flag if it goes commercial.

Blockers:
- Tranquil step: its production still runs the old Vercel project.

Recent_Changes:
- 2026-10-28 Hub sort: newest / oldest / most played, tab bar scrolls (decision 0052).
- 2026-10-28 Jeu de dames added (`checkers`, custom, `autres`, 1–2 players).
- 2026-10-25 Memory online (decision 0051): `api/rooms/*` + `game_id`, shared `online-room.js`, Yatzy wired to it.
