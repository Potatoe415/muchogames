# STATE

Replace on every update. Max 40 lines. History lives in git and `docs/decisions/`.

Status: New game Trivial Quizz (id `trivialpursuit`): 1 to 6 players on one device, classic board (6 wedges, final question in the middle), 2,321 questions from the owner's card photos (FR), also translated to EN and ES; interface FR/EN/ES. Scrabble (FR/EN/ES words, 5 levels) before it. Daily play coins are 20 per Paris day (decision 0055).
Focus: Owner play-test of Trivial Quizz and Scrabble on a phone (solo has no FR+ES; language buttons are FR/EN/ES); card backs, SkiFree, Millionaire, Fruit Slash, Échecs.
Level: L1 (Scrabble start screen)

Context:
- Working_On: none
- Relevant_Files: `public/games/scrabble/index.html`, `public/games/scrabble/store.js`, `public/games/scrabble/setup.js`
- Do_Not_Touch: Easy Frog, GameBoy Web; Space Cadet engine (`"resumable": false`).
- Relevant_Decisions: 0057, 0056, 0055, 0054

Next:
- Owner: play Trivial Quizz on a phone (portrait + landscape) and desktop with 1, 2 and 4+ players: move picking, wedges, "Rejouez", hub picker, final question, "Autre question", reload then "Reprendre". Judge the length: solo classic ~125 questions, quick ~33 (Node sims, 60 % right).
- Owner: play Scrabble on a phone and desktop: solo is FR/EN/ES only, duo can pick FR+ES, 5 levels, reload then "Reprendre", "Définir".
- Owner: on a phone, pick a back in Bridge and in each Coinchapp game, start a match, check the hidden hands and the Solitaire stock show it.
- Owner: on the TV browser open `https://www.muchogames.win/games/millionaire/index.html?tv=1` once. Check: whole screen, remote arrows/OK/Back, fullscreen on "Commencer", no screen saver mid-match.
- Owner phone check of resume in every game, then Memory and Yatzy online on two phones — see `docs/BACKLOG.md` Now.
- Platform leftovers: `0007_coins.sql` then `0008_match_coins.sql`; `ADMIN_USER_IDS` on coinchapp; Tranquil match start after its Vercel repoint (must pass `p_daily` 20).
- Proposed: `docs/ARCHITECTURE.md` still says 7 Hobby functions and omits `GET /api/popular`; `docs/SECURITY.md` does not list that public read, nor Scrabble's browser calls to Wiktionary.

Open_Questions:
- Scrabble: French ODS 9 list is Larousse/FISF copyright and "Scrabble" a Mattel/Hasbro trademark. Keep, or switch French to a free list and another title.
- TV Back key: Android TV browsers may navigate back instead of sending a key to the page; then Back leaves to the hub (the match stays saved).
- Git stash `wip-memory-aside` (another session, 2026-10-29) is still there; owner to keep or drop.
- SkiFree, Chip's Challenge and Space Cadet assets are copyrighted; Memory's licensed-character themes and the "Sorciers" back are AI art.

Blockers:
- Tranquil step: production still runs the old Vercel project.

Recent_Changes:
- 2026-11-02 Trivial Quizz questions in EN and ES (`questions_en.json`, `questions_es.json`, same indexes as FR; the language switch swaps the bank, saves keep working). "Questions are in French only" note removed.
- 2026-11-02 Scrabble: FR+ES hidden against the computer (a saved solo mixed choice falls back to the interface language); start-screen languages show as FR/EN/ES.
- 2026-11-02 Trivial Quizz quick game ("Rapide" on the start screen): any right answer wins the wedge of its category; final question unchanged. Old saves load as classic. Node sims of both modes; browser-checked.
- 2026-11-02 Trivial Pursuit renamed Trivial Quizz (title only; id, folder and storage keys stay `trivialpursuit`).
- 2026-11-02 Trivial Quizz: SVG board (42-cell ring, 6 spokes, hub), die + exact-count moves (tap / Tab + arrows), self-judged answers, wedges, hub picker, final question, "Autre question", asked questions remembered across matches, save/resume. Bank: per-slot Tesseract OCR of 950 card photos, question/answer sides paired by photo position, every card proofread. 200 Node sims (1–6 players) end and every save restores; browser-checked at 390×760, 800×370, 320×640.
- 2026-11-01 Scrabble French definitions offline (decision 0057): Wiktionary extract (kaikki.org, CC BY-SA) in `public/data/scrabble/defs/fr/`, one ≤ 107 KB gzip file per tap; live Wiktionary only for missing words.
- 2026-11-01 Scrabble Junior: side-2 rules on an 11x11 board, 5-letter face-up racks, kind draws for the child, rude words kept out.