# STATE

Replace on every update. Max 40 lines. History lives in git and `docs/decisions/`.

Status: TTMC deck now has 795 cards (524 classic + 271 special: Challenge, Gagner, Débuter, Superbe; stored, not yet playable). Tetris on Game Boy rules: scoring, speeds, start level 0-9 slider, ghost checkbox (off by default), rocket at 100k+; browser-checked at 390×844. 2048 and Fusion de fruits before it.
Focus: Owner play-test of Tetris (phone, desktop, TV), then 2048 and Fusion de fruits; owner phone check of the hub and the estimated `players` / `duration`.
Level: L1 (new game Tetris)

Context:
- Working_On: none
- Relevant_Files: `hub.css`, `public/shared/css/base.css`, game stylesheets, `docs/PLATFORM_RULES.md`, `scripts/check-games.mjs`
- Do_Not_Touch: Easy Frog, GameBoy Web; Space Cadet engine (`"resumable": false`).
- Relevant_Decisions: 0060, 0059, 0053

Next:
- Owner: skim a few new TTMC cards for transcription typos; 7 cards await a photo of their answer side. Decide how the 271 special cards (`level: null`) should play in `ttmc.js`.
- Owner: play Tetris on a real phone (portrait + landscape: tap left / right / below the well, swipe up to rotate, double tap or flick down to drop, the pads), desktop (keyboard) and the TV (`/games/tetris/index.html?tv=1` once); judge zone sizes, soft-drop speed, pastel palette, Game Boy speeds per start level, the rocket (needs a 100 000+ match), "Reprendre" (comes back paused).
- Owner: play 2048 on a phone (portrait + landscape), desktop and the TV (`/games/2048/index.html?tv=1` once): swipe and tap-near-an-edge, animation speed, palette and sounds, Facile (3 undos) vs Normal (no undo), 2048 win card, "Reprendre".
- Owner: play Fusion de fruits on a phone, desktop and the TV (`/games/fruitmerge/index.html?tv=1` once).
- Owner: on a phone, try the hub: rows, "Tout voir", pills, search, ★, Back, a shared `?view=all&type=cartes&players=duo` link. Fix my estimates in `public/hub-config.json` (every `duration`, party-game `players`) and judge each thumbnail's square crop.
- Owner: play Trivial Quizz and Scrabble on a phone and desktop (see `docs/BACKLOG.md` Now).
- Owner: on the TV browser open `https://www.muchogames.win/games/millionaire/index.html?tv=1` once; whole screen, remote keys, fullscreen, no screen saver.
- Owner phone check of resume in every game, then Memory and Yatzy online on two phones — see `docs/BACKLOG.md` Now.
- Platform leftovers: `0007_coins.sql` then `0008_match_coins.sql`; `ADMIN_USER_IDS` on coinchapp; Tranquil match start after its Vercel repoint (must pass `p_daily` 20).

Open_Questions:
- Scrabble: French ODS 9 list is Larousse/FISF copyright and "Scrabble" a Mattel/Hasbro trademark. Keep, or switch French to a free list and another title.
- TV Back key: Android TV browsers may navigate back instead of sending a key to the page; then Back leaves to the hub (the match stays saved).
- Git stash `wip-memory-aside` (another session, 2026-10-29) is still there; owner to keep or drop.
- SkiFree, Chip's Challenge and Space Cadet assets are copyrighted; Memory's licensed-character themes and the "Sorciers" back are AI art.

Blockers:
- Tranquil step: production still runs the old Vercel project.

Recent_Changes:
- 2026-11-04 TTMC: 271 special cards (photos 091-142) appended with `level: null` and one q/a each: Challenge 115 (fronts matched to their untitled answer cards by content), Gagner 128, Débuter 18, Superbe 10.
- 2026-11-04 Tetris: hold piece removed (box, C/Shift, red remote key, engine, save, sound); a single tap on the well no longer rotates (double tap = hard drop, swipe up / ↻ / ↑ rotate).
- 2026-11-04 TTMC: 417 cards transcribed from photos into public/data/ttmc/ttmc_data.json (107 -> 524); Challenge / Hésite pas cards not modelled.
- 2026-11-04 Tetris Game Boy rules: levels 0-9 (slider on the start screen), Game Boy speeds (frames per row) and scoring 40/100/300/1200 × (level + 1), 1 point per dropped cell; T-spin / B2B / combo removed (`tspin.js` deleted); ghost checkbox, off by default, saved with the match; rocket layer before the end card at 100k / 150k / 200k / 250k (4 sizes). Difficulty slider removed.
- 2026-11-04 Tetris gestures: left / right zones reach 2 columns into the well; on the middle of the well, swipe up = rotate, double tap = hard drop (undoes the first tap's turn). Pads under the well (◀, bar = hard drop, ▶, ↻; touch screens only).
