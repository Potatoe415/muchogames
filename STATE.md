# STATE

Replace on every update. Max 40 lines. History lives in git and `docs/decisions/`.

Status: The 4 Entertainment Pack remakes are live in the hub: `pipedream`, `jezzball`, `skifree`, `chipschallenge`, plus `minesweeper` (Démineur, classic Windows). Platform common rules (decision 0047) still live everywhere except Tranquil.
Focus: Owner play-test of Chip's Challenge (plus SkiFree, Pipe Dream, JezzBall, Démineur) on mobile portrait/landscape and desktop.
Level: L1 (new game `chipschallenge`); platform rules task stays L2 (approved 2026-10-03).

Context:
- Working_On: Chip's Challenge shipped, waiting on owner play-test.
- Relevant_Files: `public/games/chipschallenge/` (see its `NOTES.md`), `public/hub-config.json` entry `chipschallenge`.
- Do_Not_Touch: other games' folders; Easy Frog and GameBoy Web.
- Relevant_Decisions: 0047, 0007, 0038, 0042

Next:
- Chip's Challenge / SkiFree / Démineur / JezzBall / Pipe Dream: apply owner feedback.
- `loop.js` + `storage.js` are verbatim copies in 4 games: extract to `public/shared/` if one copy has to change.
- Platform rules leftovers: owner runs `0007_coins.sql` then `0008_match_coins.sql`; `ADMIN_USER_IDS` on the `coinchapp` Vercel project; Tranquil `start_muchogames_match` + `data-id`s after its Vercel repoint; `cartes.`/`tranquil.muchogames.win` domains then launch URLs + `PROFILE_HOSTS`.
- Live checks after deploy: a match in each game drops the hub badge; Yatzy online with two devices; coinchapp online rematch charges both.

Open_Questions:
- `.prettierignore`'s `!public/games/yatsy/**` never re-included yatsy (a parent-dir exclusion needs `!public/games/yatsy/` too); the Entertainment Pack games and `minesweeper` use the working form. Fixing yatsy would reformat it — owner call.
- SkiFree bitmaps (Chris Pirih / Microsoft), Chip's Challenge tiles and the original `CHIPS.DAT` level file (Microsoft / Epyx) are copyrighted: fine for a fan remake per the owner's request, flag if the site ever goes commercial.
- Chip's Challenge: only levels 1–7, 13, 32, 51, 140, 147 are proven winnable on our engine (MS rules approximated); the owner's play-test is the check for the rest.

Blockers:
- Tranquil step: its production still runs the old Vercel project.

Recent_Changes:
- 2026-10-25 Chip's Challenge now plays the 149 original levels from `assets/CHIPS.DAT` (github.com/bgradin/ChipsChallenge), parsed in `datfile.js`: two layers, monster list, trap/clone wiring, chips required, original titles/hints/passwords. CHIPS.EXE behaviours added: frozen until first move, force-floor override, teleports in reverse reading order, blocks on gravel, only fireballs in fire. My 5 custom levels removed. `npm run check` OK, `tsc --checkJs` 0 errors.
- 2026-10-24 New hub game `chipschallenge` (`public/games/chipschallenge/`, category `autres`, solo): original CHIPS.EXE tileset (`assets/tiles.png`, masked creatures), 9x9 window on 32x32 boards, 20 Hz ticks (walk 5/s, slide 10/s), every MS tile handled (keys/doors, 4 boots, thief, ice + curved ice, force floors, blocks/dirt/bombs, hidden/invisible/blue/toggle/pop-up walls, 4 buttons, cloners, traps, teleports, thin walls) and 9 creature brains. 5 levels (LESSON 1–3, SLIDE & SKATE, MONSTER MAZE), each proven solvable by a headless replay. Level select + passwords + best score/time in localStorage. LED counters, 4x2 inventory, hint box, D-pad (tap/hold) + swipes, Win 3.1 chrome, portrait/landscape layouts. `npm run check` OK, `tsc --checkJs` 0 errors, live-checked (render, keyboard, D-pad, hint, password, death dialog).
- 2026-10-24 New hub game `skifree` (`public/games/skifree/`): original SKI.EXE bitmaps, courses, yeti. `npm run check` OK.
- 2026-10-24 JezzBall and Pipe Dream hub covers: 4:5 JPEG thumbnails.
- 2026-10-24 New hub games `minesweeper` ("Démineur") and `jezzball`. `npm run check` OK.
