# STATE

Replace on every update. Max 40 lines. History lives in git and `docs/decisions/`.

Status: Easy Frog is now an in-repo `custom` game (`public/games/easyfrog/`), ported from the owner's separate repo (easyfrog.web.app): Game Dashboard (Facile / Normal, best per difficulty, Reprendre), shared header + options, a coin per match through `MuchogamesMatch.start()` (no more `coinPolicy: "launch"`), full save / resume, FR/EN/ES, TV remote. Before: game rules rewrite (decision 0061), Piou, Simon Easy level, Tetris, TTMC.
Focus: Owner play-tests of Easy Frog, Piou, Simon, Tetris, then 2048 and Fusion de fruits; owner phone check of the hub.
Level: L1 (one game)

Context:
- Working_On: none
- Relevant_Files: `public/games/easyfrog/NOTES.md`, `public/hub-config.json`, `docs/PLATFORM_RULES.md`, `docs/NEW_GAME.md`
- Do_Not_Touch: GameBoy Web; Space Cadet engine (`"resumable": false`); existing games' `localStorage` keys; the old `easyfrog` repo and its Firebase deploy (left as they were).
- Relevant_Decisions: 0061, 0060, 0059, 0054, 0053

Next:
- Owner: play Easy Frog on a phone (portrait + landscape), desktop and the TV (`/games/easyfrog/index.html?tv=1` once) — see `docs/BACKLOG.md` Now.
- Owner: confirm the `docs/PRODUCT.md` edit: its coin exception still names Easy Frog (now only GameBoy Web pays at launch).
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
- 2026-11-05 Easy Frog in-repo: 21 modules (game.js / rules.js / snapshot.js…, none >300 lines), original balance, sprites, sounds; checked in the browser at 360×640, 640×360 and 1920×1080 `?tv=1`: start, move, death, pause / Escape / TV Back, reload → Reprendre (paused, same lives / timer), game over (save cleared), victory (record per difficulty). `npm run check` OK.
- 2026-11-05 Game rules rewrite (0061): PLATFORM_RULES, NEW_GAME boilerplate, AGENTS.md replaced from the owner's drafts.
- 2026-11-05 Piou (`public/games/piou/`): one-button flap-between-pipes arcade, save `piou-current`.
