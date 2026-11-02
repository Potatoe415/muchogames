# STATE

Replace on every update. Max 40 lines. History lives in git and `docs/decisions/`.

Status: New game Fusion de fruits (`fruitmerge`, Suika-style merge puzzle) in the catalog, first game built to the TV rule (decision 0059) with the new shared `public/shared/js/tv-remote.js`. Hub reorganised earlier today (decision 0058).
Focus: Owner play-test of Fusion de fruits (phone, desktop, TV); owner phone check of the new hub and of the estimated `players` / `duration`; then play-tests of Trivial Quizz, Scrabble, card backs, SkiFree, Millionaire, Fruit Slash, Échecs.
Level: L1 (one new game + one shared module used only by it)

Context:
- Working_On: none
- Relevant_Files: `public/games/fruitmerge/` (see its `NOTES.md`), `public/shared/js/tv-remote.js`, `public/hub-config.json`
- Do_Not_Touch: Easy Frog, GameBoy Web; Space Cadet engine (`"resumable": false`).
- Relevant_Decisions: 0059, 0058, 0054, 0053

Next:
- Owner: play Fusion de fruits on a phone (portrait + landscape), desktop and the TV (`/games/fruitmerge/index.html?tv=1` once): drop feel, broom/undo counts, loss rule, how-to pages, "Reprendre".
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
- 2026-11-02 Fusion de fruits (`public/games/fruitmerge/`): drop and merge 11 fruits up to the watermelon (two watermelons vanish, +100), next-3 preview, fruit-order bar, broom (2/match) and undo (3/match), loss after 3 s above the red line, 8-page how-to, record, full resume. Own circle physics, procedural kawaii fruits, no asset. Browser-checked at 320×568, 390×800, 740×360, 960×540, 1920×1080, 3840×2160: merges, pair, broom, undo, loss + end card, resume, keyboard aim, TV focus / Back.
- 2026-11-02 Shared `public/shared/js/tv-remote.js` (`window.MuchogamesTv`, `data-tv-*` markup), generic version of Millionaire's `tv-nav.js` (decision 0059: second TV game moves it to shared); Millionaire not switched yet.
- 2026-11-02 Platform rule (decision 0059): new games also adapt to a TV browser — fill the screen at 960×540 to 3840×2160 CSS px, couch-readable, 3% overscan margin, remote only, fullscreen + wake lock; `?tv=1` or TV user agent.
- 2026-11-02 Trivial Quizz: × cancels the question; third mode "Roue de la fortune"; FR/EN/ES pots; EN and ES banks; quick mode.
- 2026-11-02 Hub Home rows + library (decision 0058); hub coin pie in the banner.
