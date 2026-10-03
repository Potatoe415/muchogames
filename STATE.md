# STATE

Replace on every update. Max 40 lines. History lives in git and `docs/decisions/`.

Status: Platform common rules (`docs/tasks/platform-common-rules.md`), steps 1–3 of 6 shipped: rules doc + `check:games`, migration `0008_match_coins.sql` (owner to run), `public/shared/js/game-session.js` + `POST /api/match`.
Focus: Step 5 — coinchapp + Tranquil spend per match server-side (baseline 20: coinchapp/Tranquil 15, URLs 5). Every in-repo game is wired.
Level: L2 (approved 2026-10-03).

Context:
- Working_On: coins per match instead of per hub launch, shared back/options chrome, matches started/won/lost.
- Relevant_Files: `docs/PLATFORM_RULES.md`, `scripts/check-games.mjs`, `scripts/check-games.baseline.json`, `public/shared/js/game-session.js`, `api/match.js`, `supabase/migrations/0008_match_coins.sql`, `public/hub-config.json` (`coinPolicy`, `source`), `hub-coins.js`
- Do_Not_Touch: game rules engines beyond match start/finish hooks; Easy Frog and GameBoy Web.
- Relevant_Decisions: 0007, 0038, 0042, 0046 (to be superseded)

Next:
- Domains chosen: `cartes.muchogames.win` (coinchapp), `tranquil.muchogames.win` (Tranquil, after its repoint) — add on Vercel with owner approval, then switch launch URLs + `PROFILE_HOSTS`.
- Owner: run `0007_coins.sql` then `0008_match_coins.sql` on `multigames-db` (until then matches start for free — fail open).
- Step 4 wire each in-repo game, step 5 coinchapp/Tranquil, step 6 hub/profile/admin.
- Still pending from the roadmap: owner runs `0007_coins.sql`, signs in on `/admin`, deletes `ADMIN_PASSWORD`; live checks (BACKLOG Now).

Open_Questions:
- None.

Blockers:
- None for steps 2–4. Tranquil's subdomain waits for its Vercel repoint (BACKLOG Now).

Recent_Changes:
- 2026-10-03 `game-session.js` + `POST /api/match` (functions: 8/12); migration 0008 written.
- 2026-10-03 `docs/PLATFORM_RULES.md` + `check:games`; hub links from coinchapp/Tranquil moved to `https://www.muchogames.win/`.
- 2026-10-02 Daily play coins: 10/day, one per hub launch (decision 0046) — being replaced by one per match.
- 2026-10-02 Yatzy room routes merged into one function (decision 0045).
- 2026-10-02 Data export + account deletion, hub catalog editing, "My games" shelf, per-game results, feedback inbox, admin by Google (0040–0044).
