# STATE

Replace on every update. Max 40 lines. History lives in git and `docs/decisions/`.

Status: New game 2048 (`2048`, calm sliding-tile puzzle) in the catalog, second game built to the TV rule (decision 0059) on the shared `tv-remote.js`. Fusion de fruits added yesterday.
Focus: Owner play-test of 2048 and Fusion de fruits (phone, desktop, TV); owner phone check of the new hub and of the estimated `players` / `duration`; then play-tests of Trivial Quizz, Scrabble, card backs, SkiFree, Millionaire, Fruit Slash, Échecs.
Level: L1 (one new game)

Context:
- Working_On: none
- Relevant_Files: `public/games/2048/` (see its `NOTES.md`), `public/hub-config.json`, `.prettierignore` (2048 opted in)
- Do_Not_Touch: Easy Frog, GameBoy Web; Space Cadet engine (`"resumable": false`).
- Relevant_Decisions: 0059, 0058, 0054, 0053

Next:
- Owner: play 2048 on a phone (portrait + landscape), desktop and the TV (`/games/2048/index.html?tv=1` once): swipe and tap-near-an-edge, animation speed, palette and sounds, Facile (3 undos) vs Normal (no undo), 2048 win card, "Reprendre".
- Owner: play Fusion de fruits on a phone, desktop and the TV (`/games/fruitmerge/index.html?tv=1` once).
- Owner: on a phone, try the hub: rows, "Tout voir", pills, search, ★, Back, a shared `?view=all&type=cartes&players=duo` link. Fix my estimates in `public/hub-config.json` (every `duration`, party-game `players`) and judge each thumbnail's square crop.
- Owner: play Trivial Quizz and Scrabble on a phone and desktop (see `docs/BACKLOG.md` Now).
- Owner: on the TV browser open `https://www.muchogames.win/games/millionaire/index.html?tv=1` once; whole screen, remote keys, fullscreen, no screen saver.
- Millionaire onto the shared `tv-remote.js` (see `docs/BACKLOG.md` Next).
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
- 2026-11-03 2048: two levels on the start screen, "Facile" (3 undos) and "Normal" (no undo, ↶ hidden); level saved with the match (old saves = Facile), one record per level, "Rejouer" keeps the level. Browser-checked at 320×568, 390×800, 740×360.
- 2026-11-03 2048 (`public/games/2048/`): 4×4 slide-and-merge, win at 2048 with "Continuer" / "Terminer la partie", end when no move is left, undo (3/match), record, full resume. Calm misty-sage skin, pastel tiles, soft pentatonic sounds, no timer. Swipe, tap near an edge, arrows / WASD / ZQSD, TV remote (board owns the arrows, Back = menu). Browser-checked at 320×568, 390×800, 740×360, 960×540, 1920×1080 (`?tv=1`), 3840×2160: moves, merges, win, end, undo, menu, quit + resume, language.
- 2026-11-02 Fusion de fruits (`public/games/fruitmerge/`): Suika-style merge puzzle, own circle physics, procedural fruits, first game on the shared `tv-remote.js`.
- 2026-11-02 Platform rule (decision 0059): new games also adapt to a TV browser — fill the screen at 960×540 to 3840×2160 CSS px, couch-readable, 3% overscan margin, remote only, fullscreen + wake lock; `?tv=1` or TV user agent.