# STATE

Replace on every update. Max 40 lines. History lives in git and `docs/decisions/`.

Status: Platform common rules (`docs/tasks/platform-common-rules.md`) live in code for every in-repo game, coinchapp, the hub, `/profile` and `/admin`: one coin per match started (`game-session.js` / `POST /api/match` / coinchapp `MatchGate`), shared back/options chrome with "Quitter la partie ?", matches started/won/lost. `npm run check` enforces `docs/PLATFORM_RULES.md` (baseline 8).
Focus: Remaining: Tranquil (blocked on its Vercel repoint), `*.vercel.app` launch URLs (subdomains), then close the task with a decision.
Level: L2 (approved 2026-10-03).

Context:
- Working_On: closing out the platform rules task.
- Relevant_Files: `docs/PLATFORM_RULES.md`, `scripts/check-games.mjs` + baseline, `public/shared/js/game-session.js`, `api/match.js`, `hub-coins.js`, `supabase/migrations/0008_match_coins.sql`, `apps/coinchapp/components/MatchGate.tsx`
- Do_Not_Touch: game rules engines beyond match start/finish hooks; Easy Frog and GameBoy Web.
- Relevant_Decisions: 0007, 0038, 0042, 0046 (superseded by this task — decision to write at close), coinchapp 0071

Next:
- Owner: run `0007_coins.sql` then `0008_match_coins.sql` (until then every match starts free); add `ADMIN_USER_IDS` to the `coinchapp` Vercel project.
- Owner: approve removing `/api/track` + `analytics.js` (unread now; needs ARCHITECTURE/SECURITY edits) and the PRODUCT/ARCHITECTURE/SECURITY wording for coins per match.
- Tranquil: wire `start_muchogames_match` + platform `data-id`s once its Vercel project is repointed to this repo.
- Domains: add `cartes.muchogames.win` (coinchapp) / `tranquil.muchogames.win` on Vercel (owner approval), Google OAuth origins, then switch launch URLs + `PROFILE_HOSTS`.
- Live checks after deploy: a match in each game drops the hub badge; Yatzy online with two devices (each pays once, reconnect free); coinchapp online rematch charges both.

Open_Questions:
- None.

Blockers:
- Tranquil step: its production still runs the old Vercel project.

Recent_Changes:
- 2026-10-03 `/admin` ranks matches started; `/profile` shows parties lancées and per-game started/won/lost.
- 2026-10-03 Hub charges only `coinPolicy: "launch"` games; badge reads the shared server counter; `api/profile` coin actions removed.
- 2026-10-03 coinchapp: one hub coin per match in every mode (its decision 0071); hub forwards `mgDevice` to `source` games.
- 2026-10-03 Every in-repo game wired to `game-session.js` (Yatzy incl. online, SW v42).
- 2026-10-03 `docs/PLATFORM_RULES.md`, `check:games`, migration 0008, `POST /api/match`.
