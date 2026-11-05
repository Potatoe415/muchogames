# STATE

Replace on every update. Max 40 lines. History lives in git and `docs/decisions/`.

Status: Game rules rewritten (decision 0061): `docs/PLATFORM_RULES.md`, `docs/NEW_GAME.md` (tested five-file boilerplate) and `AGENTS.md` replaced from the owner's drafts, corrected against the shared code. New games: Game Dashboard, live score + best, 40px bottom margin; existing games (Piou included) one by one. Piou added (`public/games/piou/`, ticket #6): one-button flap-between-pipes arcade, best in `piou-best`, full resume. Before: Simon (Easy level), Tetris on Game Boy rules, TTMC 524 cards, 2048, Fusion de fruits.
Focus: Next new game starts from the `docs/NEW_GAME.md` boilerplate. Owner play-tests of Piou, Simon, Tetris, then 2048 and Fusion de fruits; owner phone check of the hub.
Level: L2 (platform rules rewrite)

Context:
- Working_On: none
- Relevant_Files: `docs/PLATFORM_RULES.md`, `docs/NEW_GAME.md`, `scripts/check-games.mjs`, `public/shared/js/game-session.js`, `public/shared/js/tv-remote.js`
- Do_Not_Touch: Easy Frog, GameBoy Web; Space Cadet engine (`"resumable": false`); existing games' `localStorage` keys.
- Relevant_Decisions: 0061, 0060, 0059, 0054, 0053

Next:
- Bring existing games to the *(new games)* rules one by one (`docs/BACKLOG.md` Next): dashboard, score + best, 40px bottom margin.
- Owner: play Piou on a real phone (portrait + landscape), desktop (click / Space) and the TV (`/games/piou/index.html?tv=1` once); judge tap latency, gravity / flap / pipe speed / gap size, collision fairness, sounds, pause + reload then "Reprendre".
- Owner: play Simon on a real phone, desktop (keyboard 1-4 / arrows + Enter) and the TV (`/games/simon/index.html?tv=1` once); Facile vs Normal speed, separate records, the toggle on the TV.
- Owner: skim a few new TTMC cards for transcription typos; 7 cards await a photo of their answer side.
- Owner: play Tetris on a real phone, desktop and the TV (`/games/tetris/index.html?tv=1` once): zone sizes, soft-drop speed, Game Boy speeds per start level, the rocket, "Reprendre" (comes back paused).
- Owner: play 2048 and Fusion de fruits on a phone, desktop and the TV (`?tv=1` once).
- Owner: on a phone, try the hub (rows, "Tout voir", pills, search, ★, Back, a shared `?view=all&type=cartes&players=duo` link); fix my `duration` / `players` estimates in `public/hub-config.json`; judge each thumbnail's square crop.
- Owner: on the TV browser open `https://www.muchogames.win/games/millionaire/index.html?tv=1` once.
- Owner: play Trivial Quizz and Scrabble on a phone and desktop; phone check of resume in every game, then Memory and Yatzy online on two phones — see `docs/BACKLOG.md` Now.
- Platform leftovers: `0007_coins.sql` then `0008_match_coins.sql`; `ADMIN_USER_IDS` on coinchapp; Tranquil match start after its Vercel repoint (must pass `p_daily` 20).

Open_Questions:
- `finish({ score })` without `won` reaches no shared profile: should high-score games report their score (L2)?
- Scrabble: French ODS 9 list is Larousse/FISF copyright and "Scrabble" a Mattel/Hasbro trademark. Keep, or switch French to a free list and another title.
- TV Back key: Android TV browsers may navigate back instead of sending a key to the page; then Back leaves to the hub (the match stays saved).
- Git stash `wip-memory-aside` (another session, 2026-10-29) is still there; owner to keep or drop.
- SkiFree, Chip's Challenge and Space Cadet assets are copyrighted; Memory's licensed-character themes and the "Sorciers" back are AI art (no platform rule since 0061).

Blockers:
- Tranquil step: production still runs the old Vercel project.

Recent_Changes:
- 2026-11-05 Game rules rewrite (0061): boilerplate extracted from the doc into a scratch game and checked (`check-games` OK, options panel, ✖ → dialog → dashboard + Resume, end + best, invalid save dropped, no scroll 360×640 to 3840×2160, TV Back / arrows / focus ring), then removed. PLATFORM_RULES renumbered (TV 7, resume 5), references updated; thumbnails documented as square; IP rule dropped.
- 2026-11-05 Piou (`public/games/piou/`): pure `engine.js` checked in Node (autopilot passes 37 pipes); canvas view, Web Audio, start / pause / end screens, FR/EN/ES, save `piou-current`; hub card (tag `arcade`, 3 min).
- 2026-11-04 Simon Easy level: Easy = lead-in + lit / gap × 1.5; toggle on the start screen; best per level (`simon-best`, `simon-best-easy`); save carries `difficulty`.
