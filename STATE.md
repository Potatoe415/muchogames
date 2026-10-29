# STATE

Replace on every update. Max 40 lines. History lives in git and `docs/decisions/`.

Status: New platform rules (decision 0053): mobile first, portrait + landscape, no horizontal scroll, system bars, touch/mouse/keyboard, resume after reload, rules collapsed.
Focus: Platform rules for every new game.
Level: L2

Context:
- Working_On: none
- Relevant_Files: `docs/PLATFORM_RULES.md` (sections 1, 6–8), `scripts/check-games.mjs`, `public/shared/css/game-header.css`
- Do_Not_Touch: other games' folders; Easy Frog and GameBoy Web.
- Relevant_Decisions: 0053, 0050, 0047

Next:
- Owner: open any game's options panel on a phone, check the sheet's bottom clears the navigation bar (shared `game-header.css` now pads with the safe area).
- Existing games' gaps to 0053 are in the check baseline; fixing them is a `docs/BACKLOG.md` item (owner call).
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
- 2026-10-29 Platform rules 0053 + 3 new checks (viewport meta, collapsed rules, `dvh`); 39 existing gaps baselined.
- 2026-10-28 Bridge added (`bridge`, custom, `cartesdes`, solo, Chicago, SEF bidding, double-dummy endings).
- 2026-10-28 Hub opens on Tous, newest first. "Moins récents" removed.
- 2026-10-28 Sudoku added (`sudoku`, custom, `autres`, solo, 4 levels).
- 2026-10-28 Jeu de dames: Hint button only when the "Bouton Indice" option is on (off by default).
- 2026-10-28 Memory online (decision 0051): `api/rooms/*` + `game_id`, shared `online-room.js`, Yatzy wired to it.
