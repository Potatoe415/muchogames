# STATE

Replace on every update. Max 40 lines. History lives in git and `docs/decisions/`.

Status: Platform common rules (`docs/tasks/platform-common-rules.md`), step 1 of 6 shipped: `docs/PLATFORM_RULES.md` + `npm run check:games` (in `check` and CI) with a 100-gap baseline that only shrinks.
Focus: Step 2 — migration `0008` (anonymous device coins, `started` per game, `start_muchogames_match`).
Level: L2 (approved 2026-10-03).

Context:
- Working_On: coins per match instead of per hub launch, shared back/options chrome, matches started/won/lost.
- Relevant_Files: `docs/PLATFORM_RULES.md`, `scripts/check-games.mjs`, `scripts/check-games.baseline.json`, `public/hub-config.json` (`coinPolicy`, `source`), `hub-coins.js`, `api/profile/_coins.js`, `supabase/migrations/0007_coins.sql`
- Do_Not_Touch: game rules engines beyond match start/finish hooks; Easy Frog and GameBoy Web.
- Relevant_Decisions: 0007, 0038, 0042, 0046 (to be superseded)

Next:
- Owner: pick a non-`vercel.app` domain for coinchapp and Tranquil (launch URLs + `PROFILE_HOSTS`).
- Step 2 migration, then step 3 `public/shared/js/game-session.js`, step 4 wire each in-repo game, step 5 coinchapp/Tranquil, step 6 hub/profile/admin.
- Still pending from the roadmap: owner runs `0007_coins.sql`, signs in on `/admin`, deletes `ADMIN_PASSWORD`; live checks (BACKLOG Now).

Open_Questions:
- Domain for coinchapp/Tranquil: subdomains of `muchogames.win` or `muchogames.win/<jeu>` rewrites?

Blockers:
- None for steps 2–4. Removing the last `*.vercel.app` launch URLs needs the domain choice above.

Recent_Changes:
- 2026-10-03 `docs/PLATFORM_RULES.md` + `check:games`; hub links from coinchapp/Tranquil moved to `https://www.muchogames.win/`.
- 2026-10-02 Daily play coins: 10/day, one per hub launch (decision 0046) — being replaced by one per match.
- 2026-10-02 Yatzy room routes merged into one function (decision 0045).
- 2026-10-02 Data export + account deletion, hub catalog editing, "My games" shelf, per-game results, feedback inbox, admin by Google (0040–0044).
