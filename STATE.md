# STATE

Replace on every update. Max 40 lines. History lives in git and `docs/decisions/`.

Status: The party quiz is now "Tu te crois fort ?" (`ttcf`, decision 0063) with a wheel mode, a one-step Débuter card and a category guide in Options; before that, 8 teams, token walk and the meadow art.
Focus: Owner play-tests of TTCF (board and wheel), 4 en ligne, Easy Frog, Piou, Simon, Tetris, then 2048 and Fusion de fruits; owner phone check of the hub.
Level: L1 (one game)

Context:
- Working_On: none
- Relevant_Files: `public/games/ttcf/NOTES.md`, `public/games/connectfour/NOTES.md`, `public/games/scrabble/NOTES.md`, `public/games/simon/NOTES.md`, `public/hub-config.json`, `docs/PLATFORM_RULES.md`, `docs/NEW_GAME.md`
- Do_Not_Touch: GameBoy Web; Space Cadet engine (`"resumable": false`); existing games' `localStorage` keys; the old `easyfrog` repo and its Firebase deploy (left as they were).
- Relevant_Decisions: 0063, 0062, 0061, 0060, 0059, 0054, 0053

Next:
- Owner: look at TTCF's new look on a phone (portrait + landscape) and the TV; say if the hub thumbnail should use the new art too (still the old 3.6 MB `thumbnail.jpg`).
- Owner: play 4 en ligne (`/games/connectfour/`) on a phone (portrait + landscape), desktop and the TV (`?tv=1` once); say if a solo mode vs a bot is wanted — see `docs/BACKLOG.md` Now.
- Owner: play Easy Frog on a phone (portrait + landscape), desktop and the TV (`/games/easyfrog/index.html?tv=1` once) — see `docs/BACKLOG.md` Now.
- Bring existing games to the *(new games)* rules one by one (`docs/BACKLOG.md` Next): dashboard, score + best, 40px bottom margin.
- Owner: play Piou, Simon, Tetris, 2048, Fusion de fruits on phone / desktop / TV (`?tv=1` once); skim TTCF cards; 7 TTCF cards await a photo.
- Owner: on a phone, try the hub (rows, "Tout voir", pills, search, ★, Back, shared links); fix `duration` / `players` estimates; judge thumbnail crops.
- Owner: Trivial Quizz and Scrabble on phone and desktop; phone check of resume in every game, then Memory and Yatzy online on two phones.
- Platform leftovers: `0007_coins.sql` then `0008_match_coins.sql`; `ADMIN_USER_IDS` on coinchapp; Tranquil match start after its Vercel repoint (must pass `p_daily` 20).

Open_Questions:
- Easy Frog's victory picture (`images/screen_victory*.png`) shows Bart Simpson (Fox copyright), taken over from the original game as-is; keep or replace.
- `finish({ score })` without `won` reaches no shared profile: should high-score games report their score (L2)?
- Scrabble: French ODS 9 list is Larousse/FISF copyright and "Scrabble" a Mattel/Hasbro trademark. Keep, or switch.
- TV Back key: Android TV browsers may navigate back instead of sending a key to the page; then Back leaves to the hub (the match stays saved).
- Git stash `wip-memory-aside` (another session, 2026-10-29) is still there; owner to keep or drop.
- SkiFree, Chip's Challenge and Space Cadet assets are copyrighted; Memory's licensed-character themes and the "Sorciers" back are AI art (no platform rule since 0061).

Blockers:
- Tranquil step: production still runs the old Vercel project.

Recent_Changes:
- 2026-11-06 Party quiz renamed TTCF "Tu te crois fort ?" (0063, old id not carried over): id, folders, files, storage, hub entry, card text. Wheel mode "Roue de la fortune" (dashboard choice, 10-segment wheel, progress bars, Gagner card at 42). Débuter card shows instruction + italic answer + "Aller au plateau". Options: "Catégories" guide (FR/EN/ES). `ttcf.js` split (`board.js`, `wheel.js`). Headless Edge at 320×568 up to 3840×2160: Débuter card, board turn and walk, wheel spin / card / move / resume / win, 8 teams, categories FR/EN, old save without mode resumes on the board; no page scroll. `npm run check` OK.
- 2026-11-06 TTCF up to 8 teams (hub `players` [2, 8]): 4 extra acorns (orange, green, pink, brown) cut from `tmp-resources/ttcf/`, dashboard in two columns past 4 teams, 5-8 tokens on one space in two rows. Headless Edge at 320×568, 360×740, 740×360, 960×540, 1920×1080: 8-team dashboard fits (no scroll, no clipped panel), 8 tokens on one space, walk of team 5, team 8 wins with its acorn, remote Down through the 8 names to Start. `npm run check` OK.
- 2026-11-06 TTCF token walk: after a right answer or a Challenge / Superbe move, the team's acorn hops space by space to its new space (about 1.8 s, backwards too), banner on the moving team, draw button hidden until it lands; arrival saved first. Headless Edge: 1 -> 8 step by step, draw ignored mid-walk, reload mid-walk resumes on the arrival space, reduced motion jumps at once. `npm run check` OK.
- 2026-11-05 4 en ligne (`connectfour`, Connect Four): hot-seat Red vs Yellow, 7×6, full columns refused, win (4+ in any direction, line highlighted) / draw, Rejouer / Menu, save = move list, `finish({})`; hub entry (Réflexion, 2 players, 5 min). Node rule checks + headless Chromium (CDP) from 320×568 to 3840×2160 and `?tv=1`: hub tile, play, reject, resume, quit, all wins, draw, keyboard, FR/EN/ES, no scroll, margins. `npm run check` OK.
