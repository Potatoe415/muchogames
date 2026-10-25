# STATE

Replace on every update. Max 40 lines. History lives in git and `docs/decisions/`.

Status: Hub also has Memory (`/games/memory/`), solo / pass-and-play / vs-bot, 7 image themes and 8 card backs on a full-page background, plus Space Cadet and the Entertainment Pack remakes. Platform common rules (decision 0047) still live everywhere except Tranquil.
Focus: Memory play screen.
Level: L1

Context:
- Working_On: none
- Relevant_Files: `public/games/memory/`, `scripts/memory_slice.py`
- Do_Not_Touch: other games' folders; Easy Frog and GameBoy Web.
- Relevant_Decisions: 0047

Next:
- Owner to play Space Cadet on phone: full-screen table, score line, flipper zones below the table, plunger bottom-right, mute.
- Colocated apps (coinchapp, Tranquil): put Rules last in their options panels too, from inside each app.
- Owner to play Memory on phone (portrait + landscape) and desktop: each theme, each back, solo, pass-and-play, bot easy/hard, reload mid-match.
- Remove the version-badge refill (`POST /api/match` action `refill`) when play-testing no longer needs it.
- Chip's Challenge / SkiFree / Démineur / JezzBall / Pipe Dream / Space Cadet: apply owner feedback.
- Platform rules leftovers: owner runs `0007_coins.sql` then `0008_match_coins.sql`; `ADMIN_USER_IDS` on the `coinchapp` Vercel project; Tranquil `start_muchogames_match` + `data-id`s after its Vercel repoint.

Open_Questions:
- `.prettierignore`'s `!public/games/yatsy/**` never re-included yatsy (a parent-dir exclusion needs `!public/games/yatsy/` too). Fixing yatsy would reformat it — owner call.
- SkiFree bitmaps, Chip's Challenge tiles/`CHIPS.DAT`, and Space Cadet table data are copyrighted Microsoft (and Epyx for Chip's): fine for a fan remake per the owner's request, flag if the site ever goes commercial. Same for Memory's Miraculous, Ghibli and Pat' Patrouille themes (AI art of licensed characters).
- Memory Cuba `card_24` (rum) and `card_33` (Guayabita bottle) look alike. Owner to keep or regenerate.
- Chip's Challenge runs Atari Lynx rules (decision 0048), not CHIPS.EXE's exact MS rules. Owner to confirm the feel is close enough.

Blockers:
- Tranquil step: its production still runs the old Vercel project.

Recent_Changes:
- 2026-10-25 Memory: old 8 card backs restored. Full-page `fond.webp`, no color bars. Player 1 row clears the phone navigation.
- 2026-10-25 Options panels: Rules moved last in Chip's, JezzBall, Pipe Dream, SkiFree, Space Cadet, Yatzy (decision 0050). Space Cadet: phone full-screen table + score line, PC left/right click flips, mute toggle.
- 2026-10-25 Memory: nature theme (18 cards) added, card backs replaced by the 9 from `gemini-verso3.jpg`.
- 2026-10-25 Memory themes: 6 universes + 8 backs (WebP from `scripts/memory_slice.py`), random pairs per match, preload before Play.
- 2026-10-25 Space Cadet added to the hub from alula's prebuilt Emscripten binaries (`vendor/`, no compile). Win95 touch bars, 1 coin on F2.
