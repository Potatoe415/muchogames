# STATE

Replace on every update. Max 40 lines. History lives in git and `docs/decisions/`.

Status: Hub reorganised (decision 0058): Home view with rows of small square tiles (Récents, Favoris, À la une, Parties rapides, one row per type) and a "Tous les jeux" library (sticky pills, instant search, compact list with ★), view and filters in the URL. `category` replaced by `tags`; every game now has `tags`, `players`, `duration` (checked by `npm run check`).
Focus: Owner phone check of the new hub and of the estimated `players` / `duration`; then play-tests of Trivial Quizz, Scrabble, card backs, SkiFree, Millionaire, Fruit Slash, Échecs.
Level: L2 (hub-wide navigation + catalog fields)

Context:
- Working_On: none
- Relevant_Files: `hub.js`, `hub-taxonomy.js`, `hub-route.js`, `hub-home.js`, `hub-library.js`, `hub-nav.js`, `hub-tiles.js`, `public/hub-config.json`
- Do_Not_Touch: Easy Frog, GameBoy Web; Space Cadet engine (`"resumable": false`).
- Relevant_Decisions: 0058, 0057, 0056, 0055, 0054

Next:
- Owner: on a phone, try the hub: rows scroll sideways, "Tout voir", pills combined (one per axis), search ("echecs", "cards"), ★ in the list, Back button, a shared `?view=all&type=cartes&players=duo` link. Fix my estimates in `public/hub-config.json` (every `duration`; `players` of the party games, Millionaire, Easy Frog, Tranquil, GameBoy Web) and judge each thumbnail's square crop.
- Owner: play Trivial Quizz and Scrabble on a phone and desktop (see `docs/BACKLOG.md` Now).
- Owner: on a phone, pick a back in Bridge and in each Coinchapp game, start a match, check the hidden hands and the Solitaire stock show it.
- Owner: on the TV browser open `https://www.muchogames.win/games/millionaire/index.html?tv=1` once; whole screen, remote keys, fullscreen, no screen saver.
- Owner phone check of resume in every game, then Memory and Yatzy online on two phones — see `docs/BACKLOG.md` Now.
- Platform leftovers: `0007_coins.sql` then `0008_match_coins.sql`; `ADMIN_USER_IDS` on coinchapp; Tranquil match start after its Vercel repoint (must pass `p_daily` 20).
- Proposed: `docs/PRODUCT.md` "Hub conveniences" still describes the "My games" tab and tile badges (now Home rows + library); `docs/ARCHITECTURE.md` still says 7 Hobby functions and omits `GET /api/popular`; `docs/SECURITY.md` does not list that public read, nor Scrabble's browser calls to Wiktionary.

Open_Questions:
- Scrabble: French ODS 9 list is Larousse/FISF copyright and "Scrabble" a Mattel/Hasbro trademark. Keep, or switch French to a free list and another title.
- TV Back key: Android TV browsers may navigate back instead of sending a key to the page; then Back leaves to the hub (the match stays saved).
- Git stash `wip-memory-aside` (another session, 2026-10-29) is still there; owner to keep or drop.
- SkiFree, Chip's Challenge and Space Cadet assets are copyrighted; Memory's licensed-character themes and the "Sorciers" back are AI art.

Blockers:
- Tranquil step: production still runs the old Vercel project.

Recent_Changes:
- 2026-11-02 Trivial Quizz: third mode "Roue de la fortune" (no board; swipe or button spins a 6-colour wheel that picks the category; wedges as in quick; with 6 wedges the wheel picks the final question). Browser-checked at 390×760 and 900×500: button spin, swipe spin, wedge, final question, win; classic unchanged.
- 2026-11-02 Hub Home rows + library (decision 0058): new modules `hub-taxonomy.js` (DOM-free, also used by `check-games.mjs`), `hub-route.js`, `hub-home.js`, `hub-library.js`, `hub-nav.js`, `hub-tiles.js`; `hub-tags.js` and the tab swipe removed. Browser-checked at 390×760 and desktop: rows, pills, search, ★, Back, shared link, FR/EN.
- 2026-11-02 Scrabble: players slider 1–4, FR/EN/ES word buttons tick together; old settings/saves migrate.
- 2026-11-02 Trivial Quizz: FR/EN/ES pots on the question card; EN and ES question banks; quick game mode; renamed from Trivial Pursuit.
- 2026-11-02 Trivial Quizz: SVG board, die, wedges, hub picker, final question, save/resume; 2,321 questions OCR'd from the owner's card photos.