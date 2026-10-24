# STATE

Replace on every update. Max 40 lines. History lives in git and `docs/decisions/`.

Status: Solo games `pipedream`, `jezzball` (Entertainment Pack remakes 1 and 2 of 4: Pipe Dream, JezzBall, SkiFree, Chip's Challenge) and `minesweeper` (Démineur, classic Windows) are live in the hub. Platform common rules (decision 0047) still live everywhere except Tranquil.
Focus: Owner play-test of Pipe Dream, JezzBall and Démineur (mobile portrait/landscape, desktop). All three hub tiles now use 4:5 illustrations. SkiFree only after the owner's go.
Level: L1 (minesweeper cover).

Context:
- Working_On: Démineur hub cover swapped to watercolor `thumbnail.jpg`. Waiting on owner play-test.
- Relevant_Files: `public/games/minesweeper/assets/thumbnail.jpg`, `public/hub-config.json` entry `minesweeper`.
- Do_Not_Touch: other games' folders; Easy Frog and GameBoy Web.
- Relevant_Decisions: 0047, 0007, 0038, 0042

Next:
- Démineur / JezzBall / Pipe Dream: apply owner feedback. Démineur Expert in portrait gets ~20 px cells on a phone: watch for mis-taps.
- SkiFree (`public/games/skifree/`) on owner go, same module split. `loop.js` / `effects.js` / surface code are now copied in 2 games: extract to `public/shared/` if a third copy changes for the same reason.
- Platform rules leftovers: owner runs `0007_coins.sql` then `0008_match_coins.sql`; `ADMIN_USER_IDS` on the `coinchapp` Vercel project; Tranquil `start_muchogames_match` + `data-id`s after its Vercel repoint; `cartes.`/`tranquil.muchogames.win` domains then launch URLs + `PROFILE_HOSTS`.
- Live checks after deploy: a match in each game drops the hub badge; Yatzy online with two devices; coinchapp online rematch charges both.

Open_Questions:
- `.prettierignore`'s `!public/games/yatsy/**` never re-included yatsy (a parent-dir exclusion needs `!public/games/yatsy/` too); `pipedream`, `jezzball` and `minesweeper` use the working form. Fixing yatsy would reformat it — owner call.

Blockers:
- Tranquil step: its production still runs the old Vercel project.

Recent_Changes:
- 2026-10-24 Démineur hub cover swapped to watercolor 4:5 JPEG `public/games/minesweeper/assets/thumbnail.jpg` (800×1000, smiling mine + flag on mossy stones).
- 2026-10-24 Admin coins: expired Google ID token no longer drops a signed-in admin onto the anonymous 0/10 counter. The hub asks Google for a fresh token before reading the balance.
- 2026-10-24 JezzBall hub cover: 4:5 JPEG `public/games/jezzball/assets/thumbnail.jpg` (800×1000). SVG cover removed.
- 2026-10-24 Pipe Dream hub cover: 4:5 JPEG `public/games/pipedream/assets/thumbnail.jpg` (800×1000). SVG cover removed.
