# STATE

Replace on every update. Max 40 lines. History lives in git and `docs/decisions/`.

Status: Tetris: touch pads under the well (◀, bar = drop, ▶, ↻) and a Facile / Moyen / Difficile slider on the start screen (levels 1 / 4 / 7, ghost only in Facile); browser-checked at 390×844 and 844×390. 2048 and Fusion de fruits before it.
Focus: Owner play-test of Tetris (phone, desktop, TV), then 2048 and Fusion de fruits; owner phone check of the hub and the estimated `players` / `duration`.
Level: L1 (new game Tetris)

Context:
- Working_On: none
- Relevant_Files: `hub.css`, `public/shared/css/base.css`, game stylesheets, `docs/PLATFORM_RULES.md`, `scripts/check-games.mjs`
- Do_Not_Touch: Easy Frog, GameBoy Web; Space Cadet engine (`"resumable": false`).
- Relevant_Decisions: 0060, 0059, 0053

Next:
- Owner: play Tetris on a real phone (portrait + landscape: tap left / right / below the well, tap the well to rotate, flick down to drop, tap the hold box), desktop (keyboard) and the TV (`/games/tetris/index.html?tv=1` once); judge zone sizes, soft-drop speed, pastel palette, "Reprendre" (comes back paused).
- Owner: play 2048 on a phone (portrait + landscape), desktop and the TV (`/games/2048/index.html?tv=1` once): swipe and tap-near-an-edge, animation speed, palette and sounds, Facile (3 undos) vs Normal (no undo), 2048 win card, "Reprendre".
- Owner: play Fusion de fruits on a phone, desktop and the TV (`/games/fruitmerge/index.html?tv=1` once).
- Owner: on a phone, try the hub: rows, "Tout voir", pills, search, ★, Back, a shared `?view=all&type=cartes&players=duo` link. Fix my estimates in `public/hub-config.json` (every `duration`, party-game `players`) and judge each thumbnail's square crop.
- Owner: play Trivial Quizz and Scrabble on a phone and desktop (see `docs/BACKLOG.md` Now).
- Owner: on the TV browser open `https://www.muchogames.win/games/millionaire/index.html?tv=1` once; whole screen, remote keys, fullscreen, no screen saver.
- Owner phone check of resume in every game, then Memory and Yatzy online on two phones — see `docs/BACKLOG.md` Now.
- Platform leftovers: `0007_coins.sql` then `0008_match_coins.sql`; `ADMIN_USER_IDS` on coinchapp; Tranquil match start after its Vercel repoint (must pass `p_daily` 20).
- Proposed: `docs/PRODUCT.md` "Hub conveniences" still describes the "My games" tab and tile badges and a "🪙 n/20" badge; `docs/ARCHITECTURE.md` hub row still names `hub-tags.js`, says 7 Hobby functions, omits `GET /api/popular` and the shared `tv-remote.js`; `docs/SECURITY.md` does not list that public read, nor Scrabble's browser calls to Wiktionary.

Open_Questions:
- Scrabble: French ODS 9 list is Larousse/FISF copyright and "Scrabble" a Mattel/Hasbro trademark. Keep, or switch French to a free list and another title.
- TV Back key: Android TV browsers may navigate back instead of sending a key to the page; then Back leaves to the hub (the match stays saved).
- Git stash `wip-memory-aside` (another session, 2026-10-29) is still there; owner to keep or drop.
- SkiFree, Chip's Challenge and Space Cadet assets are copyrighted; Memory's licensed-character themes and the "Sorciers" back are AI art.

Blockers:
- Tranquil step: production still runs the old Vercel project.

Recent_Changes:
- 2026-11-04 Tetris: pads under the well replace the ▼ hint (◀, bar = hard drop, ▶, ↻; touch screens only); start-screen difficulty slider Facile / Moyen / Difficile = start level 1 / 4 / 7, ghost only in Facile; the options' start level 1-10 chips are gone; difficulty saved with the match (older saves = Facile).
- 2026-11-04 Tetris touch rework: on-screen pads removed; whole stage is the touch surface (left / right of the well move, below soft drops, well = rotate / drag / flick, hold box = hold); HUD row on top in portrait, columns in landscape, well up to 280×560 on a 390×844 phone; pieces spawn whole on the top visible row; one next piece; pastel piece colours.
- 2026-11-04 Tetris (`public/games/tetris/`): 10×20 + 2 hidden rows, 7-bag, SRS + I kicks, hold, ghost, next 5, lock delay 0.5 s / 15 resets, DAS/ARR, T-spin (3-corner), B2B, combo, levels (start 1-10), 40 lines = won, best score, full resume (paused). Keyboard, touch pads + gestures, TV remote. Engine checked in Node; `npm run check` passes; no browser check.
- 2026-11-03 2048: two levels on the start screen, "Facile" (3 undos) and "Normal" (no undo, ↶ hidden); level saved with the match (old saves = Facile), one record per level, "Rejouer" keeps the level. Browser-checked at 320×568, 390×800, 740×360.
- 2026-11-03 2048 (`public/games/2048/`): 4×4 slide-and-merge, win at 2048 with "Continuer" / "Terminer la partie", end when no move is left, undo (3/match), record, full resume. Calm misty-sage skin, pastel tiles, soft pentatonic sounds, no timer. Swipe, tap near an edge, arrows / WASD / ZQSD, TV remote (board owns the arrows, Back = menu). Browser-checked at 320×568, 390×800, 740×360, 960×540, 1920×1080 (`?tv=1`), 3840×2160: moves, merges, win, end, undo, menu, quit + resume, language.