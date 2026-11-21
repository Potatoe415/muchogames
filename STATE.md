# STATE

Replace on every update. Max 40 lines. History lives in git and `docs/decisions/`.

Status: Signed-out players get a Profil link in the hub account popover (above Google sign-in), so they can change their name and mascot without signing in. Before that, mascot avatars (decision 0067): every player, signed out included, gets a random mascot (126, `public/mascots/`) as profile icon, changed on `/profile` (photo upload removed); games get `?mascot=`. Before that, SEO (decision 0066): every game has a French `description` in `hub-config.json`; `scripts/seo.mjs` (Vite plugin) builds JSON-LD, a crawlable footer of game links, `sitemap.xml`, `llms.txt` and per-game title/description/canonical/OG; `public/robots.txt` lets every crawler in, AI ones included. Before that, TTCF board: the draw / spin button keeps its space while off (card open, token walking), so the tiles no longer resize. Before that, Piou now plays at the original Flappy Bird's difficulty (FlapPyBird values: 100 px gap, 52 px pipes, 128 px/s, ~147 px apart, no deadly ceiling). Before that, TTCF card dialog shows the flags of the other two languages at the bottom of the screen (switch the card language mid-card). Before that, TTCF Superbe cards now explain themselves: the rule and its theme (set or free), then a real card of that theme is played under the rule; the 30 s timer bar sits under the card and keeps running through the answer. Before that, the card turns over on Voir la réponse (↺ turns it back). Before that, 4 en ligne gets a bot (ticket #11): dashboard mode selector Joueur contre joueur / Bot facile / Bot normal, random first colour in every mode, mode locked during a match. TTCF no longer flashes its 8 acorns on the dashboard at first open with a saved match, and a new match shows its own board under the Débuter card. Before that, Salade de Cafards preloads its images (new `preload.js`), all WebP now (2.5 MB -> 258 KB); platform rule 6.3 (decision 0064, portrait board 99% wide); the party quiz "Tu te crois fort ?" (`ttcf`, decision 0063).
Focus: Owner check of the mascots: hub icon, `/profile` picker (signed out and signed in), the mascot in Coinche/Belote/Bouilla/Président/Bataille corse (local, online, ad-hoc). Then SEO accounts done 2026-11-20: `muchogames.vercel.app`, `patate.win`, `www.patate.win` 308 -> www.muchogames.win (Vercel); Search Console domain property `muchogames.win` verified by a Cloudflare TXT record, sitemap sent, home reindex asked; Cloudflare is DNS-only (no AI-bot blocking applies). Left: Bing Webmaster (owner sign-in, import from Search Console). Then Owner phone check of TTCF's first open (no acorn flash) and of Salade de Cafards' images; play-tests of 4 en ligne (bots), TTCF (board and wheel), Easy Frog, Piou, Simon, Tetris, then 2048 and Fusion de fruits; owner phone check of the hub.
Level: L2 (hub-wide identity contract, cross-app)
Context:
- Working_On: none
- Relevant_Files: `public/games/cafards/NOTES.md`, `public/games/ttcf/NOTES.md`, `public/games/connectfour/NOTES.md`, `public/games/scrabble/NOTES.md`, `public/games/simon/NOTES.md`, `public/hub-config.json`, `docs/PLATFORM_RULES.md`, `docs/NEW_GAME.md`
- Do_Not_Touch: GameBoy Web; Space Cadet engine (`"resumable": false`); existing games' `localStorage` keys; the old `easyfrog` repo and its Firebase deploy (left as they were).
- Relevant_Decisions: 0067, 0066, 0064, 0063, 0062, 0061, 0060

Next:
- Tranquil still expects `?avatar=` (shows no picture now): teach it `?mascot=` (proposed as its own task). PRODUCT/SECURITY/PLATFORM_RULES/ARCHITECTURE now describe mascots (owner OK 2026-11-21).
- Owner: share a game link (e.g. `/games/chess/`) in a chat app: the preview shows the game's title, description and thumbnail. Search Console: watch indexing over the coming weeks.
- Owner: TTCF board on a phone: open and close a card, watch a token walk: the tiles keep their size, the button just vanishes and comes back. Not run in a browser, only the checks.
- Owner: play Piou on a phone and desktop: tighter, faster, closer pipes than before (original difficulty); say if it feels right.
- Owner: TTCF on a phone: with FR on, the EN and ES flags at the bottom of the screen switch the card text at once (question, answer, Superbe rule), timer keeps running. Also: a Superbe space (or wheel slice) shows the rule + theme buttons, then a card of that theme with the rule above it; timer bar under the card, still running on the answer side; Voir la réponse turns the card, ↺ turns it back. Not run in a browser, only `npm run check`.
- Owner: TTCF on a phone, first open with a match saved: no acorn row flash, Resume greyed for a moment then usable; start a match: all acorns on D under the Débuter card.
- Owner: play 4 en ligne (`/games/connectfour/`) vs Bot facile and Bot normal, and player vs player, on a phone (portrait + landscape), desktop and the TV (`?tv=1` once): bot pause, Normal's strength, mode buttons; Easy Frog the same (`/games/easyfrog/index.html?tv=1` once) — see `docs/BACKLOG.md` Now.
- Bring existing games to the *(new games)* rules one by one (`docs/BACKLOG.md` Next): dashboard, score + best, 40px bottom margin.
- Owner: play Simon, Tetris, 2048, Fusion de fruits on phone / desktop / TV (`?tv=1` once); skim TTCF cards; 7 TTCF cards await a photo.
- Owner: Trivial Quizz, Scrabble, resume in every game, Memory / Yatzy online on two phones; on a phone, try the hub (rows, "Tout voir", pills, search, ★, Back, shared links); fix `duration` / `players` estimates; judge thumbnail crops.
- Platform leftovers: `0007_coins.sql` then `0008_match_coins.sql`; `ADMIN_USER_IDS` on coinchapp; Tranquil match start after its Vercel repoint (must pass `p_daily` 20).

Open_Questions:
- Git stash `wip-memory-aside` (another session, 2026-10-29) is still there; owner to keep or drop.
- Easy Frog's victory picture (`images/screen_victory*.png`) shows Bart Simpson (Fox copyright), taken over from the original game as-is; keep or replace.
- `finish({ score })` without `won` reaches no shared profile: should high-score games report their score (L2)?
- Scrabble: French ODS 9 list is Larousse/FISF copyright and "Scrabble" a Mattel/Hasbro trademark. Keep, or switch.
- TV Back key: Android TV browsers may navigate back instead of sending a key to the page; then Back leaves to the hub (the match stays saved).
- SkiFree, Chip's Challenge and Space Cadet assets are copyrighted; Memory's licensed-character themes and the "Sorciers" back are AI art (no platform rule since 0061).

Blockers:
- Tranquil step: production still runs the old Vercel project.

Recent_Changes:
- 2026-11-21 `auth.js`: signed-out popover shows the Profil link (`createProfileLink`). Checked in the browser: link shown signed out, `/profile` saves the name locally. lint (0 errors) + `check:games` + build OK; Prettier fails only on `ttcf_french_only.json` (unchanged).
- 2026-11-21 Mascots (0067): `player-profile.js` MASCOTS + getMascot/setMascot, `profile-mascot.js` picker (crop files removed), `api/profile` accepts only `/mascots/<id>.webp`, `hub.js` sends `?mascot=`. lint (0 errors) + `check:games` + build OK; Prettier fails only on `ttcf_french_only.json` (unchanged). Profile picker and hub icon checked in the browser.
