# STATE

Replace on every update. Max 40 lines. History lives in git and `docs/decisions/`.

Status: Jeu de dames (`/games/checkers/`) added: vs computer (easy / medium / hard / expert, AI in a module worker) or two players on one device, international 10×10 or English 8×8, tap or drag, undo, hint, save + resume, per-level records, sound, 3 board themes, FR/EN/ES. Memory online (decision 0051) and platform common rules (decision 0047) unchanged.
Focus: Jeu de dames.
Level: L1

Context:
- Working_On: none
- Relevant_Files: `public/games/checkers/` (read its `NOTES.md` first), `public/hub-config.json`
- Do_Not_Touch: other games' folders; Easy Frog and GameBoy Web.
- Relevant_Decisions: 0047, 0050

Next:
- Owner to play Jeu de dames on phone, tablet and desktop: 4 levels, two players, both rule sets, drag and tap, undo/hint, reload mid-game then "Reprendre".
- Owner to play Memory online on two phones: create, share link, join by code, misses, reload mid-match, quit, end, rematch. Also one Yatzy online match.
- Owner to play Space Cadet on phone: full-screen table, score line, flipper zones, plunger, mute.
- Colocated apps (coinchapp, Tranquil): put Rules last in their options panels too, from inside each app.
- Remove the version-badge refill (`POST /api/match` action `refill`) when play-testing no longer needs it.
- Chip's Challenge / SkiFree / Démineur / JezzBall / Pipe Dream / Space Cadet: apply owner feedback.
- Platform rules leftovers: owner runs `0007_coins.sql` then `0008_match_coins.sql`; `ADMIN_USER_IDS` on the `coinchapp` Vercel project; Tranquil `start_muchogames_match` + `data-id`s after its Vercel repoint.
- Proposed (owner to confirm): `docs/PRODUCT.md` lacks Jeu de dames and Memory's online mode; `docs/ARCHITECTURE.md` and `docs/SECURITY.md` still name `api/yatsy/games/*`.

Open_Questions:
- Jeu de dames thumbnail is a hand-made SVG; swap for an illustrated image if wanted.
- `.prettierignore`'s `!public/games/yatsy/**` never re-included yatsy (a parent-dir exclusion needs `!public/games/yatsy/` too). Fixing yatsy would reformat it — owner call.
- SkiFree, Chip's Challenge and Space Cadet assets are copyrighted Microsoft/Epyx; Memory's Miraculous, Ghibli and Pat' Patrouille themes are AI art of licensed characters. Fine for a fan site, flag if it goes commercial.
- Memory Cuba `card_24` (rum) and `card_33` (Guayabita bottle) look alike. Owner to keep or regenerate.
- Chip's Challenge runs Atari Lynx rules (decision 0048). Owner to confirm the feel is close enough.

Blockers:
- Tranquil step: its production still runs the old Vercel project.

Recent_Changes:
- 2026-10-28 Jeu de dames added (`checkers`, custom, `autres`, 1–2 players).
- 2026-10-25 Memory online (decision 0051): `api/rooms/*` + `game_id`, shared `online-room.js`, Yatzy wired to it.
- 2026-10-25 Memory: fixed header, quit returns to setup, new-game header icon.
- 2026-10-25 Options panels: Rules moved last everywhere in-repo (decision 0050). Space Cadet phone layout + mute.
