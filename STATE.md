# STATE

Replace on every update. Max 40 lines. History lives in git and `docs/decisions/`.

Status: Hub also has Memory (`/games/memory/`), solo / pass-and-play / vs-bot, plus Space Cadet and the Entertainment Pack remakes. Platform common rules (decision 0047) still live everywhere except Tranquil.
Focus: Memory in the hub.
Level: L1

Context:
- Working_On: none
- Relevant_Files: `public/games/memory/`, `public/hub-config.json`
- Do_Not_Touch: other games' folders; Easy Frog and GameBoy Web.
- Relevant_Decisions: 0047

Next:
- Owner to play Memory on phone (portrait + landscape) and desktop: solo, pass-and-play, bot easy/hard, reload mid-match, mute, rotate player 2.
- Remove the version-badge refill (`POST /api/match` action `refill`) when play-testing no longer needs it.
- Chip's Challenge / SkiFree / Démineur / JezzBall / Pipe Dream / Space Cadet: apply owner feedback.
- Platform rules leftovers: owner runs `0007_coins.sql` then `0008_match_coins.sql`; `ADMIN_USER_IDS` on the `coinchapp` Vercel project; Tranquil `start_muchogames_match` + `data-id`s after its Vercel repoint.

Open_Questions:
- `.prettierignore`'s `!public/games/yatsy/**` never re-included yatsy (a parent-dir exclusion needs `!public/games/yatsy/` too). Fixing yatsy would reformat it — owner call.
- SkiFree bitmaps, Chip's Challenge tiles/`CHIPS.DAT`, and Space Cadet table data are copyrighted Microsoft (and Epyx for Chip's): fine for a fan remake per the owner's request, flag if the site ever goes commercial.
- Chip's Challenge runs Atari Lynx rules (decision 0048), not CHIPS.EXE's exact MS rules. Owner to confirm the feel is close enough.

Blockers:
- Tranquil step: its production still runs the old Vercel project.

Recent_Changes:
- 2026-10-25 Memory added (`/games/memory/`): solo, pass-and-play, vs bot, local save.
- 2026-10-25 Space Cadet added to the hub from alula's prebuilt Emscripten binaries (`vendor/`, no compile). Win95 touch bars, 1 coin on F2.
