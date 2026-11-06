# STATE

Replace on every update. Max 40 lines. History lives in git and `docs/decisions/`.

Status: TTCF's card turns over on Voir la réponse, and a ↺ button top left on the answer side turns it back to the question (timer stays stopped). Before that, 4 en ligne gets a bot (ticket #11): dashboard mode selector Joueur contre joueur / Bot facile / Bot normal, random first colour in every mode, mode locked during a match. TTCF no longer flashes its 8 acorns on the dashboard at first open with a saved match, and a new match shows its own board under the Débuter card. Before that, Salade de Cafards preloads its images (new `preload.js`), all WebP now (2.5 MB -> 258 KB); platform rule 6.3 (decision 0064, portrait board 99% wide); the party quiz "Tu te crois fort ?" (`ttcf`, decision 0063).
Focus: Owner phone check of TTCF's first open (no acorn flash) and of Salade de Cafards' images; play-tests of 4 en ligne (bots), TTCF (board and wheel), Easy Frog, Piou, Simon, Tetris, then 2048 and Fusion de fruits; owner phone check of the hub.
Level: L1 (one game)

Context:
- Working_On: none
- Relevant_Files: `public/games/cafards/NOTES.md`, `public/games/ttcf/NOTES.md`, `public/games/connectfour/NOTES.md`, `public/games/scrabble/NOTES.md`, `public/games/simon/NOTES.md`, `public/hub-config.json`, `docs/PLATFORM_RULES.md`, `docs/NEW_GAME.md`
- Do_Not_Touch: GameBoy Web; Space Cadet engine (`"resumable": false`); existing games' `localStorage` keys; the old `easyfrog` repo and its Firebase deploy (left as they were).
- Relevant_Decisions: 0064, 0063, 0062, 0061, 0060, 0059, 0054, 0053

Next:
- Owner: TTCF on a phone: Voir la réponse turns the card, ↺ top left of the answer turns it back and forth; untested in a browser (owner asked for no test), only `npm run check`.
- Owner: TTCF on a phone, first open with a match saved: no acorn row flash, Resume greyed for a moment then usable; start a match: all acorns on D under the Débuter card.
- Owner: Salade de Cafards on a phone: cards, background and banner sharp enough after the WebP shrink; "Chargement des cartes…" only flashes on a slow first load.
- Owner: JezzBall and Chip's Challenge on a phone in portrait: board 99% wide; say if a swipe from the board's edge triggers the system back too often, and if Chip's tiles look uneven at the free zoom.
- Owner: look at TTCF's new look on a phone (portrait + landscape) and the TV; say if the hub thumbnail should use the new art too (still the old 3.6 MB `thumbnail.jpg`).
- Owner: play 4 en ligne (`/games/connectfour/`) vs Bot facile and Bot normal, and player vs player, on a phone (portrait + landscape), desktop and the TV (`?tv=1` once): bot pause, Normal's strength, mode buttons; Easy Frog the same (`/games/easyfrog/index.html?tv=1` once) — see `docs/BACKLOG.md` Now.
- Bring existing games to the *(new games)* rules one by one (`docs/BACKLOG.md` Next): dashboard, score + best, 40px bottom margin.
- Owner: play Piou, Simon, Tetris, 2048, Fusion de fruits on phone / desktop / TV (`?tv=1` once); skim TTCF cards; 7 TTCF cards await a photo.
- Owner: Trivial Quizz, Scrabble, resume in every game, Memory / Yatzy online on two phones; on a phone, try the hub (rows, "Tout voir", pills, search, ★, Back, shared links); fix `duration` / `players` estimates; judge thumbnail crops.
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
- 2026-11-06 TTCF card flip: Voir la réponse turns the card over (rotateY, 400 ms, none with reduced motion); ↺ `ttcf-card-flip` top left of the answer side shows the question again (display only, timer stays stopped). Not run in a browser at the owner's request. `npm run check` OK.
- 2026-11-06 TTCF first-open flash: the dashboard's acorn row (all 8 team pieces) showed until the deck loaded, then vanished when Resume appeared; now Resume is decided from the save at once (`store.js` `hasMatch`, disabled until the deck is in) and the row is hidden in the HTML until that. A new match renders its board before the Débuter card (it showed an empty board, or the last match's tokens). Headless Chromium (CDP, 390x844, throttled, per-frame sampling): fresh, saved and quit-then-restart launches show no stray pieces. `npm run check` OK.
- 2026-11-06 4 en ligne bot: `bot.js` (easy = win else random; normal = win, block, avoid giving a win on top, centre), mode selector on the dashboard (remembered), random first colour, save v2 `{ mode, first, moves }` (v1 read as pvp), vs bot `finish({ won })`, hub `players` [1, 2]. Node: 1 000 bot games legal, normal beat random 493/500 and easy 485/500. Headless Chromium 360×740: 4 full games per bot level, pvp, input locked on the bot's turn, resume, v1 save. `npm run check` OK.
- 2026-11-06 Salade de Cafards: 8 card faces, background and banner re-encoded as WebP (cards at their native ~310x550, which a phone shows at ~185x275 CSS px x DPR 3; background 960 px; banner + hub tile 320 px), old PNG/JPG removed; `preload.js` loads and decodes all 10 at page load, Nouvelle partie / Reprendre / Rejouer wait behind "Chargement des cartes…". Headless Chromium (CDP, 390x844 DPR 3): 10 image requests before the match, 0 requests during 120 reveals showing all 8 faces; throttled run shows the loading line and disabled button, then starts. `npm run check` OK.
