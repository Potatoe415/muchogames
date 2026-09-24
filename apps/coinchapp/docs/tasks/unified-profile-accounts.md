# Task: unified-profile-accounts

Level: L2
Status: In progress
Goal: When a player arrives from the hub with a signed-in (Google-linked) identity, adopt that same Supabase `auth.uid()` instead of a fresh anonymous session, and write this game's wins/losses into the shared `muchogames_profiles` row instead of (only) the local per-app counter.
Scope: a new server-side route/action to resolve `?profileCode=` against `muchogames_launch_codes`, `lib/client/useMatchStats.ts` (wins/losses write path), `docs/DATA_MODEL.md`, `docs/ARCHITECTURE.md`, `docs/SECURITY.md`.
Do_Not_Touch: `lib/coinche`, `lib/bouilla`, `lib/president`, `lib/bataillecorse` rules engines; `games`/`game_players`/`game_events` schema and RLS; existing anonymous-only flow for visitors who arrive without a hub launch code (must keep working unchanged).
Assumptions:
- **Revised 2026-09-24**: no cross-app HTTP call to the hub. `muchogames_profiles`/`muchogames_launch_codes` (root `supabase/migrations/0003_profiles.sql`) live in the same Supabase project (`multigames-db`) this app already connects to — reused, not owned, same relationship `tranquil` already has to this app's `games` tables. This app's own `SUPABASE_SERVICE_ROLE_KEY` already has full access to those tables; it reads `muchogames_launch_codes` directly server-side (own service-role client), never talks to the hub over the network.
- The hub still keeps each player's Supabase Auth identity (`auth.uid()`) entirely to itself — this app never adopts it as its own session. It stays on its existing anonymous `signInAnonymously()` session for RLS/`game_players` purposes; it only additionally *links* that anonymous session to a `profile_id` (resolved from the launch code) for the purpose of writing shared wins/losses.
- Players who never pass through the hub (direct URL, bookmark) keep today's anonymous-only behavior untouched.
- Combined win/loss stat (decision 0055, `HomeTopBar`) starts also writing `muchogames_profiles.wins/losses` (in addition to, not instead of, the existing local counter) once a `profile_id` was resolved from a launch code this session.
Plan:
1. Wait for root migration `0003_profiles.sql` to be applied and for the hub's launch-code endpoint (`api/profile/launch-code.js`) to exist → verify: root task's step 1/7 marked done.
2. On page load, if the URL carries `?profileCode=`, call a new Server Action/route that reads `muchogames_launch_codes` (own service-role client), checks `expires_at`/`used_at`, marks it used, and caches the resolved `profile_id` for this browser session (e.g. a short-lived cookie or in-memory context, not `localStorage`, since the code is single-use) → verify: a valid code resolves once; a reused or expired code is rejected.
3. Wire wins/losses writes (`useMatchStats.ts`) to also increment `muchogames_profiles.wins/losses` (via the service-role client) when a `profile_id` was resolved this session → verify: finish one match, confirm the shared row increments exactly once; anonymous-only sessions (no code) see zero change.
4. Update `docs/DATA_MODEL.md`/`docs/ARCHITECTURE.md` to note the reused `muchogames_profiles`/`muchogames_launch_codes` tables; update `docs/SECURITY.md`'s auth section.
Acceptance_Criteria:
- [ ] Anonymous-only visitors (no hub code) see zero behavior change.
- [ ] A hub-signed-in player launching Coinche/Bouilla/Président/la Bataille Corse resolves the same `profile_id` this app sees as the hub's `muchogames_profiles.id`.
- [ ] Wins/losses for that player accumulate in `muchogames_profiles`, visible back on the hub `/profile`.
- [ ] `npm test && npx tsc --noEmit && npm run lint && npm run build` pass.
Security_Checklist:
- [ ] Who can resolve a launch code? Anyone presenting a valid, unexpired, unused code from the hub — single-use, checked server-side against `muchogames_launch_codes`.
- [ ] Which resources can they reach? Only the one `profile_id` the code was minted for, resolved server-side with this app's own service-role client — never a client-supplied id.
- [ ] What happens if they tamper with the request (replay, guess a code)? Code is rejected after first use (`used_at` set) or after `expires_at`; codes are server-generated, not guessable.
- [ ] Input validated? Code format/length checked before any DB call.
- [ ] No secret/personal data logged? Same bar as existing `lib/server` logging (none custom).
- [ ] Authorization covered by a test? No automated tests exist for this flow yet — verify manually, note results here.
Related_Decisions: (none yet — logged once Done)
Notes:
- 2026-09-24: launch-code claim + shared increment are wired (`lib/server/profileLink.ts`, `lib/client/profileSync.ts`). Live check still needs `0003_profiles.sql` applied on `multigames-db`.
