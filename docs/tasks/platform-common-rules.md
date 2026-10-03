# Task: platform-common-rules

Level: L2
Status: In progress
Goal: One written set of platform rules every game follows (back/options chrome, coins per match, matches started/won/lost), enforced by `npm run check`.
Scope: `docs/PLATFORM_RULES.md`, `scripts/check-games.mjs` (+ baseline), `public/shared/js/game-session.js`, every in-repo game (`public/games/*`, `wordplayer.*`), `hub.js`/`hub-coins.js`, `api/profile`, a new migration, `apps/coinchapp`, `apps/tranquil`, `/profile`, `/admin`.
Do_Not_Touch: game rules engines beyond the match start/finish hooks; Easy Frog and GameBoy Web (separate repos).
Assumptions:
- Owner choices (2026-10-03): Easy Frog + GameBoy keep paying at hub launch (`coinPolicy: "launch"`); anonymous coins move server-side behind a random device id shared by every game; "Rejouer" costs a coin; party games record "started" only; back during a match asks for confirmation; rules enforced by an automated check.
- `*.vercel.app` URLs must no longer be referenced. The hub is `https://www.muchogames.win/`. coinchapp/Tranquil have no custom domain yet — owner to pick one.
- Millionaire: won when the top prize is reached, lost otherwise. Pyramide: same-device teams, started only.
- coinchapp/Tranquil servers need `ADMIN_USER_IDS` for unlimited admin coins.
Plan:
1. `docs/PLATFORM_RULES.md` + `scripts/check-games.mjs` in `npm run check`, with a shrinking baseline of known gaps → verify: check passes, removing a baseline line makes it fail.
2. Migration `0008`: device coins, `started` per game, `start_muchogames_match` → verify: owner runs SQL, spend works anonymous + signed in.
3. `public/shared/js/game-session.js` (`MuchogamesMatch.start/finish/isInProgress`, out-of-coins dialog, back confirmation) + API → verify: manual in `npm run dev`.
4. Wire each in-repo game, one commit per game → verify: its baseline lines removed, browser check.
5. coinchapp + Tranquil spend per match server-side, device id via launch URL → verify: each app's check, live test.
6. Hub stops charging at launch (except `coinPolicy: "launch"`), `/profile` + `/admin` show matches started/won/lost → verify: live end-to-end.
Acceptance_Criteria:
- [ ] Opening a game costs nothing; starting a match costs one coin, in every in-repo game and coinchapp/Tranquil.
- [ ] Out of coins, a match does not start and the shared dialog shows.
- [ ] Back during a match asks "Quitter la partie ?".
- [ ] `/profile` shows matches started/won/lost per game.
- [ ] `npm run check` fails for a game that breaks a rule; the baseline is empty.
- [ ] No `*.vercel.app` reference left in code.
Security_Checklist: step 2/3 add an unauthenticated coin path keyed by device id — throttle it, validate the UUID, service-role only, accept that clearing site data resets anonymous coins (as today).
Related_Decisions: 0007, 0038, 0042, 0046
Notes:
- 2026-10-03 Step 1 shipped: rules doc, `check:games` in `npm run check` + CI, baseline of 100 gaps. `hub-config.json` gained `coinPolicy: "launch"` (easyfrog, gameboy-web) and `source` (coinchapp games, tranquil). coinchapp/Tranquil links back to the hub now use `https://www.muchogames.win/`.
- Remaining `*.vercel.app` references (baselined): coinchapp + Tranquil launch URLs and `PROFILE_HOSTS` in `profile-results.js`, GameBoy Web (separate deployment, keeps its address).
- 2026-10-03 Step 2 written: `supabase/migrations/0008_match_coins.sql` (waits for the owner to run 0007 then 0008).
- 2026-10-03 Step 3 shipped: `public/shared/js/game-session.js` + `game-session.css`, public `POST /api/match` (`start` | `coins`). Verified: handler validation paths in Node; in the browser (fetch stubbed) out-of-coins dialog, concurrent starts → one request, fail open on 500/offline, back → "Quitter la partie ?" → Continuer stays / Quitter leaves. Not verified live: needs 0008 + a deploy. Hub still has its own out-of-coins dialog until step 6.
- 2026-10-03 Step 4 shipped for blackstories (`endless: true`), wordplayer (taboo, pictionary, esquisse, pigeonpigeon), olemains (gained a FR/EN/ES switch; gear always visible), cafards, millionaire (won = top prize, score = questions cleared), pyramide (rules now visible on the splash too). In-match quit/restart controls carry `data-match-quit` (same confirmation). Each verified in the browser with `/api/match` stubbed: refused when out of coins, one spend per double tap, back/✖/↻ confirm, end of match closes it. Left: yatsy (two settings panels, online seats — waiting on the owner's choice of when online players pay).
- 2026-10-03 Owner chose subdomains: `cartes.muchogames.win` → Vercel project `coinchapp`, `tranquil.muchogames.win` → Tranquil (after its repoint). Needs: add the domains on Vercel (owner approval at that point), add them as Google OAuth authorized origins, then switch `hub-config.json` launch URLs + `PROFILE_HOSTS` and drop those baseline lines.
