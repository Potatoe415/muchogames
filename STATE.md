# STATE

Replace on every update. Max 40 lines. History lives in git and `docs/decisions/`.

Status: Memory (`/games/memory/`) now has an online mode (two devices) on the Yatzy room system, shared through `api/rooms/*` and `public/shared/js/online-room.js` (decision 0051). Also solo / pass-and-play / vs-bot, 7 themes, 8 backs. Platform common rules (decision 0047) still live everywhere except Tranquil.
Focus: Memory online.
Level: L2

Context:
- Working_On: none
- Relevant_Files: `api/rooms/`, `api/_lib/rooms.js`, `public/shared/js/online-room.js`, `public/games/memory/online.js`, `public/games/memory/wire.js`, `public/games/yatsy/session.js`
- Do_Not_Touch: other games' folders; Easy Frog and GameBoy Web.
- Relevant_Decisions: 0045, 0047, 0051

Next:
- Owner to play Memory online on two phones: create, share link, join by code, misses, reload mid-match, quit, end, rematch. Also one Yatzy online match (refactored onto the shared client).
- Owner to play Space Cadet on phone: full-screen table, score line, flipper zones below the table, plunger bottom-right, mute.
- Colocated apps (coinchapp, Tranquil): put Rules last in their options panels too, from inside each app.
- Remove the version-badge refill (`POST /api/match` action `refill`) when play-testing no longer needs it.
- Chip's Challenge / SkiFree / Démineur / JezzBall / Pipe Dream / Space Cadet: apply owner feedback.
- Platform rules leftovers: owner runs `0007_coins.sql` then `0008_match_coins.sql`; `ADMIN_USER_IDS` on the `coinchapp` Vercel project; Tranquil `start_muchogames_match` + `data-id`s after its Vercel repoint.
- Proposed (owner to confirm): `docs/ARCHITECTURE.md` and `docs/SECURITY.md` still name `api/yatsy/games/*`; `docs/PRODUCT.md` Memory line lacks the online mode.

Open_Questions:
- `.prettierignore`'s `!public/games/yatsy/**` never re-included yatsy (a parent-dir exclusion needs `!public/games/yatsy/` too). Fixing yatsy would reformat it — owner call.
- SkiFree bitmaps, Chip's Challenge tiles/`CHIPS.DAT`, and Space Cadet table data are copyrighted Microsoft (and Epyx for Chip's): fine for a fan remake per the owner's request, flag if the site ever goes commercial. Same for Memory's Miraculous, Ghibli and Pat' Patrouille themes (AI art of licensed characters).
- Memory Cuba `card_24` (rum) and `card_33` (Guayabita bottle) look alike. Owner to keep or regenerate.
- Chip's Challenge runs Atari Lynx rules (decision 0048), not CHIPS.EXE's exact MS rules. Owner to confirm the feel is close enough.

Blockers:
- Tranquil step: its production still runs the old Vercel project.

Recent_Changes:
- 2026-10-25 Memory online (decision 0051): `api/yatsy/games/*` → `api/rooms/*` + `game_id` (migration 0009), shared `online-room.js`, Yatzy wired to it (sw v43).
- 2026-10-25 Memory: the header stays fixed, so Continuer after Retour does not hide its buttons.
- 2026-10-25 Memory: quitting a match returns to its setup. New game is a header icon. Names sit on white pills.
- 2026-10-25 Options panels: Rules moved last everywhere in-repo (decision 0050). Space Cadet phone layout + mute.
- 2026-10-25 Space Cadet added to the hub from alula's prebuilt Emscripten binaries (`vendor/`, no compile).
