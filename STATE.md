# STATE

Replace on every update. Max 40 lines. History lives in git and `docs/decisions/`.

Status: Solo games `pipedream` and `jezzball` (Entertainment Pack remakes 1 and 2 of 4: Pipe Dream, JezzBall, SkiFree, Chip's Challenge; Canvas 2D + Web Audio, no dependency) are live in the hub. Platform common rules (decision 0047) still live everywhere except Tranquil.
Focus: Owner play-test of Pipe Dream and JezzBall (mobile portrait/landscape, desktop). SkiFree only after the owner's go.
Level: L1 (jezzball); platform rules task stays L2 (approved 2026-10-03).

Context:
- Working_On: JezzBall delivered; waiting for owner feedback.
- Relevant_Files: `public/games/jezzball/` (read its `NOTES.md` first), `public/hub-config.json` entry `jezzball`; `public/games/pipedream/` for the shared split.
- Do_Not_Touch: other games' folders; Easy Frog and GameBoy Web.
- Relevant_Decisions: 0047, 0007, 0038, 0042

Next:
- JezzBall / Pipe Dream: apply owner feedback (curves live in each game's `levels.js`).
- SkiFree (`public/games/skifree/`) on owner go, same module split. `loop.js` / `effects.js` / surface code are now copied in 2 games: extract to `public/shared/` if a third copy changes for the same reason.
- Platform rules leftovers: owner runs `0007_coins.sql` then `0008_match_coins.sql`; `ADMIN_USER_IDS` on the `coinchapp` Vercel project; Tranquil `start_muchogames_match` + `data-id`s after its Vercel repoint; `cartes.`/`tranquil.muchogames.win` domains then launch URLs + `PROFILE_HOSTS`.
- Live checks after deploy: a match in each game drops the hub badge; Yatzy online with two devices; coinchapp online rematch charges both.

Open_Questions:
- `.prettierignore`'s `!public/games/yatsy/**` never re-included yatsy (a parent-dir exclusion needs `!public/games/yatsy/` too); `pipedream` and `jezzball` use the working form. Fixing yatsy would reformat it — owner call.

Blockers:
- Tranquil step: its production still runs the old Vercel project.

Recent_Changes:
- 2026-10-24 New hub game `jezzball` (`public/games/jezzball/`, category `autres`, solo): 32x22 grid (22x32 portrait) + border, dual-ray walls, multi-source BFS capture, 75 % target with % and time bonuses, N+1 balls/lives per level, big axis button + two-finger tap + right click/wheel/Space, axis cursor, best score in `localStorage`. `GAMES_MAP.md` row + `NOTES.md`. `npm run check` OK.
- 2026-10-24 New hub game `pipedream` (`public/games/pipedream/`, category `autres`, solo). `npm run check` OK.
- 2026-10-23 New hub game `solitaire` (Klondike, solo) served by `apps/coinchapp` (its decision 0072).
- 2026-10-03 PRODUCT/ARCHITECTURE/SECURITY updated for coins per match (owner OK); decision 0047.
