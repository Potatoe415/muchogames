# STATE

Replace on every update. Max 40 lines. History lives in git and `docs/decisions/`.

Status: New game 4 en ligne (Connect Four, `connectfour`): two players on one device, 7×6 grid, in the hub. Before: Scrabble hint scoring, Simon Normal without ☰ pause, Hub Home "Les plus joués" (decision 0062), Easy Frog, game rules rewrite (decision 0061), Piou, Simon Easy, Tetris, TTMC.
Focus: Owner play-tests of 4 en ligne, Easy Frog, Piou, Simon, Tetris, then 2048 and Fusion de fruits; owner phone check of the hub.
Level: L1 (one game)

Context:
- Working_On: none
- Relevant_Files: `public/games/connectfour/NOTES.md`, `public/games/scrabble/NOTES.md`, `public/games/simon/NOTES.md`, `public/hub-config.json`, `docs/PLATFORM_RULES.md`, `docs/NEW_GAME.md`
- Do_Not_Touch: GameBoy Web; Space Cadet engine (`"resumable": false`); existing games' `localStorage` keys; the old `easyfrog` repo and its Firebase deploy (left as they were).
- Relevant_Decisions: 0062, 0061, 0060, 0059, 0054, 0053

Next:
- Owner: play 4 en ligne (`/games/connectfour/`) on a phone (portrait + landscape), desktop and the TV (`?tv=1` once); say if a solo mode vs a bot is wanted — see `docs/BACKLOG.md` Now.
- Owner: play Easy Frog on a phone (portrait + landscape), desktop and the TV (`/games/easyfrog/index.html?tv=1` once) — see `docs/BACKLOG.md` Now.
- Bring existing games to the *(new games)* rules one by one (`docs/BACKLOG.md` Next): dashboard, score + best, 40px bottom margin.
- Owner: play Piou, Simon, Tetris, 2048, Fusion de fruits on phone / desktop / TV (`?tv=1` once); skim TTMC cards; 7 TTMC cards await a photo.
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
- 2026-11-05 4 en ligne (`connectfour`, Connect Four): hot-seat Red vs Yellow, 7×6, full columns refused, win (4+ in any direction, line highlighted) / draw, Rejouer / Menu, save = move list, `finish({})`; hub entry (Réflexion, 2 players, 5 min). Node rule checks + headless Chromium (CDP) from 320×568 to 3840×2160 and `?tv=1`: hub tile, play, reject, resume, quit, all wins, draw, keyboard, FR/EN/ES, no scroll, margins. `npm run check` OK.
- 2026-11-05 Scrabble hint display: the laid-out word shows its real score (board bubble + guide, e.g. "GRENU · 16 pts · indice utilisé"); Jouer stays +0 and the played score stays 0. Browser: hint 16 on the word, +0 on Jouer, player score 0 after play, computer then scored 10. `npm run check` OK.
- 2026-11-05 Scrabble hints: 5 per turn; a hinted turn scores 0 when played (bingo too); the count is saved (`hintsUsed`).
- 2026-11-05 Simon: ☰ hidden in a Normal match (`mountGame`), TV Back there falls to the header Back; rules TV line updated FR/EN/ES. Headless Chromium at 360×640 and 640×360: Normal start / play / lose / replay / resume with no ☰ and the status filling the row, options still pause; Easy ☰ pause / Continue unchanged. `npm run check` OK.
- 2026-11-05 Hub Home (0062): first row "Les plus joués" (site-wide counts, else local, else "Nouveautés"); "Cartes & dés" → "Jeux de cartes", Yams moved to Réflexion. Checked in the browser (both modes). `npm run check` OK except `.claude/settings.local.json` formatting (local file, not tracked).
