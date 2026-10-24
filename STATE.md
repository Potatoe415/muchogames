# STATE

Replace on every update. Max 40 lines. History lives in git and `docs/decisions/`.

Status: Solo games `pipedream`, `jezzball`, `skifree` (Entertainment Pack remakes 1–3 of 4: Pipe Dream, JezzBall, SkiFree, Chip's Challenge) and `minesweeper` (Démineur, classic Windows) are live in the hub. Platform common rules (decision 0047) still live everywhere except Tranquil.
Focus: Owner play-test of SkiFree (plus Pipe Dream, JezzBall, Démineur) on mobile portrait/landscape and desktop. Chip's Challenge only after the owner's go.
Level: L1 (new game `skifree`); platform rules task stays L2 (approved 2026-10-03).

Context:
- Working_On: SkiFree shipped, waiting on owner play-test.
- Relevant_Files: `public/games/skifree/` (see its `NOTES.md`), `public/hub-config.json` entry `skifree`.
- Do_Not_Touch: other games' folders; Easy Frog and GameBoy Web.
- Relevant_Decisions: 0047, 0007, 0038, 0042

Next:
- SkiFree / Démineur / JezzBall / Pipe Dream: apply owner feedback.
- Chip's Challenge (`public/games/chipschallenge/`) on owner go, same module split. `loop.js` is now copied in 3 games (verbatim): extract to `public/shared/` if one copy has to change.
- Platform rules leftovers: owner runs `0007_coins.sql` then `0008_match_coins.sql`; `ADMIN_USER_IDS` on the `coinchapp` Vercel project; Tranquil `start_muchogames_match` + `data-id`s after its Vercel repoint; `cartes.`/`tranquil.muchogames.win` domains then launch URLs + `PROFILE_HOSTS`.
- Live checks after deploy: a match in each game drops the hub badge; Yatzy online with two devices; coinchapp online rematch charges both.

Open_Questions:
- `.prettierignore`'s `!public/games/yatsy/**` never re-included yatsy (a parent-dir exclusion needs `!public/games/yatsy/` too); `pipedream`, `jezzball`, `minesweeper` and `skifree` use the working form. Fixing yatsy would reformat it — owner call.
- SkiFree bitmaps are Chris Pirih / Microsoft's (extracted SKI.EXE resources, not MIT): fine for a fan remake per the owner's request, flag if the site ever goes commercial.

Blockers:
- Tranquil step: its production still runs the old Vercel project.

Recent_Changes:
- 2026-10-24 New hub game `skifree` (`public/games/skifree/`, category `autres`, solo): the 86 original SKI.EXE bitmaps packed in `assets/sprites.png`, pixel-perfect integer zoom, 7 ski angles, turbo (F), jumps/tricks/style, crash, Slalom / Freestyle / Tree Slalom courses with gates and records, lift chairs, dogs + yellow snow, novices, snowboarders, burning dead trees, yeti at 2000 m (or −125 m uphill) with the eat animation. Win 3.1 status box, dialogs and touch buttons. Mouse/keyboard/touch-drag controls. `npm run check` OK, `tsc --checkJs` clean, live-checked in the browser.
- 2026-10-24 JezzBall hub cover: 4:5 JPEG `public/games/jezzball/assets/thumbnail.jpg` (800×1000). SVG cover removed.
- 2026-10-24 Pipe Dream hub cover: 4:5 JPEG `public/games/pipedream/assets/thumbnail.jpg` (800×1000). SVG cover removed.
- 2026-10-24 New hub game `minesweeper` ("Démineur", `public/games/minesweeper/`, category `autres`, solo). `npm run check` OK.
- 2026-10-24 New hub game `jezzball` (`public/games/jezzball/`, category `autres`, solo). `npm run check` OK.
