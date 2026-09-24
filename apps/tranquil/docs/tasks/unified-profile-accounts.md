# Task: unified-profile-accounts

Level: L2
Status: In progress
Goal: When a player arrives from the hub with a signed-in (Google-linked) identity, adopt that same Supabase `auth.uid()` instead of a fresh anonymous session, and write this game's wins/losses into the shared `muchogames_profiles` row instead of (only) the local `matchResultStats` counter.
Scope: a new server-side route to resolve `?profileCode=` against `muchogames_launch_codes`, `client/src/lib/matchResultStats` (wins/losses write path), `docs/DATA_MODEL.md`, `docs/ARCHITECTURE.md`.
Do_Not_Touch: `shared/src` pure game engine; `games`/`game_players`/`game_events` schema (owned by `coinchapp`, only reused here); existing anonymous-only flow for visitors who arrive without a hub launch code.
Assumptions:
- **Revised 2026-09-24**: no cross-app HTTP call to the hub. Same shared Supabase project (`multigames-db`) and same `muchogames_profiles`/`muchogames_launch_codes` tables as `coinchapp` — this app's own `SUPABASE_SERVICE_ROLE_KEY` already has full access; it reads the launch code directly server-side.
- This app keeps its own `ensureAnonAuth()`/anonymous session for `game_players` purposes unchanged; it only additionally links that session to a `profile_id` (resolved from the launch code) for writing shared wins/losses.
- Players who never pass through the hub keep today's anonymous-only behavior.
- `matchResultStats` (`tranquil-match-results` in `localStorage`) keeps working as the anonymous fallback; `muchogames_profiles` gets an additional write once a `profile_id` was resolved this session.
Plan:
1. Wait for root migration `0003_profiles.sql` and the hub's launch-code endpoint (`api/profile/launch-code.js`) to exist → verify: root task's step 1/7 marked done.
2. On load, if the URL carries `?profileCode=`, call a new `api/*.ts` route that reads `muchogames_launch_codes` (own service-role client via `api/_lib/supabaseAdmin.ts`), checks `expires_at`/`used_at`, marks it used, and keeps the resolved `profile_id` for this session → verify: a valid code resolves once; a reused or expired code is rejected.
3. Wire `matchResultStats` writes to also increment `muchogames_profiles.wins/losses` when a `profile_id` was resolved this session → verify: finish one match, confirm the shared row increments exactly once; anonymous-only sessions (no code) see zero change.
4. Update `docs/DATA_MODEL.md`/`docs/ARCHITECTURE.md` to note the reused `muchogames_profiles`/`muchogames_launch_codes` tables.
Acceptance_Criteria:
- [ ] Anonymous-only visitors (no hub code) see zero behavior change.
- [ ] A hub-signed-in player launching Tranquility resolves the same `profile_id` this app sees as the hub's `muchogames_profiles.id`.
- [ ] Wins/losses for that player accumulate in `muchogames_profiles`, visible back on the hub `/profile`.
- [ ] `npm test`, `npx tsc --noEmit -p tsconfig.json`, `npm run build -w client` pass.
Security_Checklist:
- [ ] Who can resolve a launch code? Anyone presenting a valid, unexpired, unused code from the hub — single-use, checked server-side against `muchogames_launch_codes`.
- [ ] Which resources can they reach? Only the one `profile_id` the code was minted for, resolved server-side — never a client-supplied id.
- [ ] What happens if they tamper with the request (replay, guess a code)? Code is rejected after first use (`used_at` set) or after `expires_at`.
- [ ] Input validated? Code format/length checked before any DB call.
- [ ] No secret/personal data logged? Reuse `logApp`/`logServer` conventions, no raw tokens logged.
- [ ] Authorization covered by a test? No automated tests exist for this flow yet — verify manually, note results here.
Related_Decisions: (none yet — logged once Done)
Notes:
- 2026-09-24: launch-code claim + shared increment are wired (`api/profile-link.ts`, `client/src/lib/profileSync.ts`). Live check still needs `0003_profiles.sql` applied on `multigames-db`.
