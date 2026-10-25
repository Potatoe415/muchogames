# STATE

Replace on every update. Max 40 lines. History lives in git and `docs/decisions/`.

Status: Hub also has Space Cadet (`/games/spacecadet/`), alula's prebuilt WASM (decision 0049), plus the Entertainment Pack remakes and Démineur. Platform common rules (decision 0047) still live everywhere except Tranquil.
Focus: Space Cadet in the hub.
Level: L1

Context:
- Working_On: none
- Relevant_Files: `public/games/spacecadet/`, `public/hub-config.json`
- Do_Not_Touch: other games' folders; Easy Frog and GameBoy Web; `vendor/SpaceCadetPinball.*` (replace the three files together if they must be refreshed).
- Relevant_Decisions: 0047, 0049

Next:
- Owner to play Space Cadet on phone (portrait + landscape) and desktop: F2, hold-to-launch, flippers, tilt, sound.
- Remove the version-badge refill (`POST /api/match` action `refill`) when play-testing no longer needs it.
- Chip's Challenge / SkiFree / Démineur / JezzBall / Pipe Dream: apply owner feedback.
- Platform rules leftovers: owner runs `0007_coins.sql` then `0008_match_coins.sql`; `ADMIN_USER_IDS` on the `coinchapp` Vercel project; Tranquil `start_muchogames_match` + `data-id`s after its Vercel repoint.

Open_Questions:
- `.prettierignore`'s `!public/games/yatsy/**` never re-included yatsy (a parent-dir exclusion needs `!public/games/yatsy/` too). Fixing yatsy would reformat it — owner call.
- SkiFree bitmaps, Chip's Challenge tiles/`CHIPS.DAT`, and Space Cadet table data are copyrighted Microsoft (and Epyx for Chip's): fine for a fan remake per the owner's request, flag if the site ever goes commercial.
- Chip's Challenge runs Atari Lynx rules (decision 0048), not CHIPS.EXE's exact MS rules. Owner to confirm the feel is close enough.

Blockers:
- Tranquil step: its production still runs the old Vercel project.

Recent_Changes:
- 2026-10-25 Space Cadet added to the hub from alula's prebuilt Emscripten binaries (`vendor/`, no compile). Win95 touch bars, 1 coin on F2. `npm run check` OK. Browser: table renders, hub tile in Autres, options FR/EN/ES.
- 2026-10-25 TEMP: seven fast taps on the hub version badge refill today's coins to 10/10.
