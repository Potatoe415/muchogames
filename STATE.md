# STATE

Replace on every update. Max 40 lines. History lives in git and `docs/decisions/`.

Status: New platform rule 6.3 (decision 0064): in portrait the board is 99% of the phone's width; JezzBall and Chip's Challenge done. Before that, the party quiz became "Tu te crois fort ?" (`ttcf`, decision 0063) with a wheel mode, a one-step Débuter card and a category guide in Options; before that, 8 teams, token walk and the meadow art.
Focus: Owner play-tests of TTCF (board and wheel), 4 en ligne, Easy Frog, Piou, Simon, Tetris, then 2048 and Fusion de fruits; owner phone check of the hub.
Level: L1 (one game)

Context:
- Working_On: none
- Relevant_Files: `public/games/ttcf/NOTES.md`, `public/games/connectfour/NOTES.md`, `public/games/scrabble/NOTES.md`, `public/games/simon/NOTES.md`, `public/hub-config.json`, `docs/PLATFORM_RULES.md`, `docs/NEW_GAME.md`
- Do_Not_Touch: GameBoy Web; Space Cadet engine (`"resumable": false`); existing games' `localStorage` keys; the old `easyfrog` repo and its Firebase deploy (left as they were).
- Relevant_Decisions: 0064, 0063, 0062, 0061, 0060, 0059, 0054, 0053

Next:
- Owner: JezzBall and Chip's Challenge on a phone in portrait: board 99% wide; say if a swipe from the board's edge triggers the system back too often, and if Chip's tiles look uneven at the free zoom.
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
- 2026-11-06 TTCF deck +28 cards (830) from the old `aside-ttmc` stash batch, found as a merge conflict on `public/data/ttmc/` (old name); conflict cleared, no `ttmc` folder left. `npm run check` OK.
- 2026-11-06 Rule 6.3 (0064): portrait board 99% of the phone's width, past the 24px side strips (HUD, buttons, cards keep them); `NEW_GAME.md` template + checklist. JezzBall: fractional cell size, cell edges snapped to device px (field cache, glow), dimming as wide as the board. Chip's Challenge: free zoom (owner). Headless Edge: JezzBall 98.8-99% at 320×568 / 360×740 / 412×915 / 600×960 (was 87-88%), Chip's 98% at 360×740 / 412×915 (was 70-80%), 69% at 320×568 (height-bound); landscape / 1920×1080 unchanged; walls and capture draw without seams; no scroll. `npm run check` OK.
- 2026-11-06 TTCF: teams start on D (owner confirmed, matches the video rules the owner sent); a team on D draws a random category, moves back stop on D; rules text says so (FR/EN/ES); hub `players` [2, 16] (teams of several players). Headless Edge: start on D, walk D -> 3, move back to D, saves with pos 0 resume. `npm run check` OK.
