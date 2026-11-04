# STATE

Replace on every update. Max 40 lines. History lives in git and `docs/decisions/`.

Status: Simon end card has a Partager button (native share sheet on phones, copy + "Copié !" elsewhere, hidden when neither works). Simon has an Easy level (start-screen Facile / Normal toggle, Easy plays 1.5x slower, separate records; Normal unchanged). Simon added (`public/games/simon/`): 4 pads, growing sequence, one mistake ends, Web Audio tones, best score, full resume; headless-Chrome layout check at 320×568, 390×844, 844×390, 1920×1080. TTMC deck now has 524 cards. Tetris on Game Boy rules: scoring, speeds, start level 0-9 slider, ghost checkbox (off by default), rocket at 100k+; browser-checked at 390×844. 2048 and Fusion de fruits before it.
Focus: Owner play-test of Simon and Tetris (phone, desktop, TV), then 2048 and Fusion de fruits; owner phone check of the hub and the estimated `players` / `duration`.
Level: L1 (Simon share button)

Context:
- Working_On: none
- Relevant_Files: `hub.css`, `public/shared/css/base.css`, game stylesheets, `docs/PLATFORM_RULES.md`, `scripts/check-games.mjs`
- Do_Not_Touch: Easy Frog, GameBoy Web; Space Cadet engine (`"resumable": false`).
- Relevant_Decisions: 0060, 0059, 0053

Next:
- Owner: play Simon on a real phone (portrait + landscape), desktop (keyboard 1-4 / arrows + Enter) and the TV (`/games/simon/index.html?tv=1` once); judge tap latency, tones, speeds, pause / resume replaying the round; Facile vs Normal speed feel, separate records, the toggle on the TV; Partager on the end card (phone share sheet, desktop / TV copy).
- Owner: skim a few new TTMC cards in the game for transcription typos; 7 cards await a photo of their answer side.
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
- 2026-11-04 Simon Share (`share.js`): Partager between Rejouer and Quitter on the end card; text "J'ai réussi N tours au Simon (niveau) sur Muchogames ! Tu fais mieux ?" + game link (FR/EN/ES); `navigator.share` with a coarse pointer, else clipboard + "Copié !" 2 s; hidden with neither API. Headless Edge: 320×568, 390×844, 1920×1080 fit, Tab + TV arrows reach it, copy and share stub checked. `npm run check` passes.
- 2026-11-04 Simon Easy level: `DIFFICULTIES` in `rules.js`, Easy = lead-in + lit / gap × 1.5, Normal timings byte-identical (checked in Node); toggle on the start screen (last choice in `simon-difficulty`, Normal default); best per level (`simon-best` stays Normal, `simon-best-easy`); save carries `difficulty` (old saves = Normal); level shown under Record and on the end card. `npm run check` passes.
- 2026-11-04 Simon (`public/games/simon/`): green / red / yellow / blue pads (2×2 ring), sequence + 1 random colour per round, one mistake = end card; original Simon tones via Web Audio, sound toggle; score = rounds completed, best in `simon-best`; playback faster after 5 / 9 / 13 colours; save = the sequence, resume / pause replay the current round. Touch, mouse, keyboard (1-4, arrows + Enter), TV remote. Loop checked in Node; `npm run check` passes.
