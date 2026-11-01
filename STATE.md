# STATE

Replace on every update. Max 40 lines. History lives in git and `docs/decisions/`.

Status: New game Scrabble (words in French, English, Spanish, or FR + ES: each player in their own language): solo vs computer (4 levels on a slider) or two players on one device. Bridge and the six Coinchapp card games let the player pick a card back (decision 0056). Millionaire has a TV mode. Daily play coins are 20 per Paris day (decision 0055).
Focus: Owner play-test of Scrabble on a phone; card backs, SkiFree, Millionaire, Fruit Slash, Ã‰checs.
Level: L1 (new game, one folder + one hub entry)

Context:
- Working_On: none
- Relevant_Files: `public/games/scrabble/` (read its `NOTES.md`), `public/data/scrabble/{ods9,enable,es}.txt`, `scripts/scrabble_dict.mjs`
- Do_Not_Touch: Easy Frog, GameBoy Web; Space Cadet engine (`"resumable": false`).
- Relevant_Decisions: 0056, 0055, 0054, 0053

Next:
- Owner: play Scrabble on a phone (portrait + landscape) and desktop: FR/EN/ES and FR + ES words, 4 levels, two players (handoff screen), tap / drag / tap a cell then letters / keyboard, joker, swap or pass, reload then "Reprendre". Judge the levels (`TARGET` in `public/games/scrabble/ai.js`).
- Owner: on a phone, pick a back in Bridge and in each Coinchapp game, start a match, check the hidden hands and the Solitaire stock show it.
- Owner: on the TV browser open `https://www.muchogames.win/games/millionaire/index.html?tv=1` once. Check: whole screen, remote arrows/OK/Back, fullscreen on "Commencer", no screen saver mid-match.
- Owner: play Fruit Slash with a kid (phone + tablet), Ã‰checs on iPhone and Android, Memory solo points, Bridge robot bidding.
- Owner phone check of resume in every game, then Memory and Yatzy online on two phones â€” see `docs/BACKLOG.md` Now.
- Platform leftovers: `0007_coins.sql` then `0008_match_coins.sql`; `ADMIN_USER_IDS` on coinchapp; Tranquil match start after its Vercel repoint (must pass `p_daily` 20).
- Proposed: `docs/ARCHITECTURE.md` still says 7 Hobby functions and omits `GET /api/popular`; `docs/SECURITY.md` does not list that public read, nor Scrabble's browser calls to Wiktionary (the tapped word is sent to Wikimedia, no personal data).

Open_Questions:
- Scrabble: the French ODS 9 list is Larousse/FISF copyright (English ENABLE is public domain, Spanish list MIT) and "Scrabble" a Mattel/Hasbro trademark. Keep, or switch French to a free list and another title. Spanish list is not the official FISE one (common words fine, some rare ones missing).
- TV Back key: Android TV browsers may navigate back instead of sending a key to the page; then Back leaves to the hub (the match stays saved).
- Git stash `wip-memory-aside` (another session, 2026-10-29) is still there; owner to keep or drop.
- SkiFree, Chip's Challenge and Space Cadet assets are copyrighted; Memory's licensed-character themes and the "Sorciers" back are AI art.

Blockers:
- Tranquil step: production still runs the old Vercel project.

Recent_Changes:
- 2026-11-01 Scrabble: in-match âœ– Quit replaced by "DÃ©finir" (book): tap a board word â†’ short Wiktionary definition (base word for plurals/conjugations), FR/EN/ES. Browser-checked (ETALENT â†’ Ã©taler).
- 2026-11-01 Scrabble FR + ES: each player's words checked in their own language, shared 102-tile bag with Ã‘, FR/ES tags. Node sims of full mixed games; browser duo start checked.
- 2026-11-01 Scrabble: word language FR/EN/ES on the start screen, each with its own tile set and list (EN ENABLE, ES 635k words, Ã‘ tile, no CH/LL/RR tiles). Node sims of full games in all 3; browser: Spanish match + old French save resumed.
- 2026-11-01 Scrabble: 4 levels on a slider (Facile ~177, Moyen ~303, Difficile ~388, Expert ~542 pts in Node sims); Hint button off by default (Options).
- 2026-11-01 Scrabble: board, rack, live score preview, word check before playing, hint, letters-left sheet, joker picker, handoff between two players, save/resume. Browser-tested at 390Ã—760 and 800Ã—370; 12 computer-vs-computer games in Node (all moves valid, every save restores).
- 2026-11-01 Millionaire TV: on TV only the remote focus highlights an answer.
- 2026-11-01 Card back choice (0056): Bridge start screen + six Coinchapp home screens.
