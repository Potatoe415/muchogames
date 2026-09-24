# Task: unified-profile-accounts

Level: L2
Status: In progress
Goal: Let a player who signs in with Google on the hub get one name/avatar/wins/losses profile shared across the hub, `coinchapp`, and `tranquil`, and across devices — while anonymous play (no sign-in) keeps working exactly as today.
Scope: `auth.js`, `public/profile/*`, `hub.js` (launch param), new `api/profile/*` and/or `api/auth/*` serverless functions, `supabase/migrations/0003_profiles.sql`, `docs/PRODUCT.md` (Out_Of_Scope wording), `docs/DATA_MODEL.md`, `docs/ARCHITECTURE.md` (Player identity contract), `docs/SECURITY.md`.
Do_Not_Touch: game rules/content of any individual game; Yatzy's existing capability-token access model (room code + resume token) stays as-is — this task only adds an optional identity layer on top.
Assumptions:
- The hub, `coinchapp`, and `tranquil` already share one Supabase project (`multigames-db`) — no new Postgres project needed.
- `@supabase/supabase-js` is already a root dependency (used server-side in `api/_lib/supabase.js`) — no new dependency needed.
- **Revised 2026-09-24**: no Supabase SDK runs in any browser context for this feature. `/profile/profile.js` is deliberately unbundled (no npm-import resolution, and a CDN import would repeat the flagged anti-pattern in `yatsy/matchmaking.js`) — so the browser only ever holds the short-lived Google ID token (already obtained today by `auth.js`'s existing GSI flow) and sends it to hub serverless endpoints. Those endpoints exchange it for the durable `auth.uid()` via Supabase's public REST token endpoint (`POST {SUPABASE_URL}/auth/v1/token?grant_type=id_token`, using the already-public anon key — no new secret), then read/write `muchogames_profiles` with the existing service-role client. Same zero-client-RLS-policy pattern as `yatzy_games`/`muchogames_events`.
- `coinchapp`/`tranquil` keep Supabase anonymous sign-in as the default for players who never connect a Google account; the shared profile only applies to the Google-signed-in session. Since they share the same Supabase project, their own serverless functions can read/write `muchogames_profiles`/`muchogames_launch_codes` directly with their own service-role key — no cross-app HTTP call back to the hub needed.
- Because the cached Google ID token expires (~1h) and `/profile` has no background refresh (the GSI widget only lives on hub pages), a stale token makes `/profile` fall back to local-only silently — same UX as being signed out. Accepted for this pass; a silent-refresh improvement is a `BACKLOG.md` candidate, not part of this task.
- Existing separate localStorage win/loss counters (hub/Yatzy, `coinchapp`, `tranquil`) get migrated into `muchogames_profiles.wins/losses` on first sign-in (summed once), per user confirmation 2026-09-24.
- New manual setup step (like the SQL migration): the user must enable **Google** as a Supabase Auth provider in the `multigames-db` dashboard (Authentication → Providers → Google, with the same public `GOOGLE_CLIENT_ID` already used by GSI) — the REST token exchange 400s otherwise.
- This task does not touch `yatzy_games`/`muchogames_events` access rules, and does not add cross-player avatar visibility (opponents still only ever see the existing tiny `?avatar=` thumb, unchanged).
Plan:
1. Add `supabase/migrations/0003_profiles.sql` (`muchogames_profiles` + `muchogames_launch_codes`, RLS enabled/zero policies) → verify: user runs it against `multigames-db` and enables Google as an Auth provider there; confirm via dashboard. **(drafted, not yet applied — blocking step)**
2. `api/profile/_lib.js` (or similar): `exchangeGoogleIdToken(idToken)` → calls the Supabase REST token endpoint, returns `{ userId, email }` or throws on invalid/expired token.
3. `api/profile/upsert.js`: accepts `{ idToken, name?, avatarDataUrl? }`, exchanges the token, upserts `muchogames_profiles` (validates name length, avatar size cap ~50 KB) → verify: `curl` round-trip creates/updates a row.
4. `api/profile/get.js`: accepts `{ idToken }`, returns that user's `muchogames_profiles` row → verify: matches what step 3 wrote.
5. `auth.js`: on `handleCredentialResponse`, also persist the raw Google ID token (short-lived) in `localStorage` and fire-and-forget POST it to `/api/profile/upsert` with the existing local name/avatar (first-sync); keep current client-only email display unchanged → verify: sign-in still works with zero change when the API call fails (e.g. offline).
6. `/profile/profile.js`: if a non-expired Google ID token is cached, call `/api/profile/get`/`upsert` for reads/writes instead of `PlayerProfile`'s localStorage helpers; otherwise keep exactly today's local-only behavior → verify: signed-in edit round-trips through Supabase; signed-out/expired-token behavior is unchanged.
7. `api/profile/launch-code.js`: mints a row in `muchogames_launch_codes` (short expiry, single-use) for the current profile; `hub.js` requests one and appends `?profileCode=` next to the existing `?name=`/`?avatar=` params when launching `coinchapp`/`tranquil` → verify: code is rejected on a second use or after expiry.
8. Coordinate with `apps/coinchapp` and `apps/tranquil` (see their own task files) to read `muchogames_launch_codes` directly (same DB, their own service-role key) and adopt that `profile_id` for wins/losses writes → verify: cross-app, same profile row updated from both sides.
9. Update `docs/PRODUCT.md` (Out_Of_Scope: reverses "players stay anonymous by default" for the opt-in signed-in case), `docs/DATA_MODEL.md` (new `HubProfile`/`muchogames_profiles`/`LaunchCode` entities), `docs/ARCHITECTURE.md` (Player identity contract), `docs/SECURITY.md` (new endpoints checklist) — propose wording, edit only after user confirms each file.
Acceptance_Criteria:
- [ ] Signed-out visitor: hub, Yatzy, `/profile` behave exactly as before (no regression).
- [ ] Signed-in visitor: same name/avatar/wins/losses shown on hub `/profile`, inside `coinchapp`, and inside `tranquil`.
- [ ] Signing in with the same Google account on a second browser/device shows the same profile.
- [ ] Legacy local win/loss counts were folded into the shared profile exactly once per browser (no double-counting on repeat sign-ins).
- [ ] `npm run check` passes.
Security_Checklist:
- [ ] Who can call the new endpoints? Anyone holding a currently-valid Google ID token for `api/profile/upsert`/`get` — the endpoint verifies it server-side against Supabase/Google on every call, never trusts a client-supplied user id.
- [ ] Which resources can they reach? Only the `muchogames_profiles` row matching the verified token's `auth.uid()` — resolved server-side, RLS has zero client policies (defense in depth, same as `yatzy_games`).
- [ ] Which fields can they modify? `name`, `avatar_url`, `wins`, `losses` on that one resolved row only.
- [ ] What happens if they tamper with the request? An invalid/expired/foreign token fails the Supabase exchange and the request is rejected before touching the DB; the launch code is single-use and short-lived, checked server-side.
- [ ] Input validated? Name length/type, avatar size cap (reuse the existing ~50 KB profile-picture bound), wins/losses as non-negative integers only.
- [ ] No secret or personal data in logs or error responses? Google email/name stay out of server logs, same bar as existing rules.
- [ ] Authorization covered by a test? No automated tests exist yet — verify manually per step above and note results here.
Related_Decisions: (none yet — logged once this task is Done, per `AGENTS.md` "After each task")
Notes:
- User confirmed (2026-09-24): full account reversal accepted, sync scope = name + avatar + wins/losses + cross-device, legacy counters migrated once on first sign-in.
- Design revised same day mid-implementation (see Assumptions): zero browser Supabase SDK; Google ID token verified server-side via Supabase's REST token endpoint. `@supabase/supabase-js` was already a root dependency — no new-dependency approval was actually needed.
- Implemented so far: `api/_lib/googleAuth.js`, `api/profile/{upsert,get,record-result,launch-code,_shared}.js`, `auth.js` (persists+syncs the Google ID token on sign-in/sign-out), `public/profile/profile.js` + `profile-stats.js` (reads/writes the shared profile when a live token exists, falls back to local-only otherwise). `npm run check` passes.
- Not yet done: legacy-counter one-time migration into `muchogames_profiles` (step still needs a concrete "first sign-in" merge point); `hub.js` launch-code request + `?profileCode=` param (step 7); wiring Yatzy's `recordGameResult` call site to also POST `/api/profile/record-result`; `coinchapp`/`tranquil` sides (their own task files, step 2 in each, blocked on the migration below); doc updates (step 9).
- **Blocking, needs the user**: (a) run `supabase/migrations/0003_profiles.sql` against `multigames-db`; (b) enable Google as an Auth provider in that Supabase project's dashboard (Authentication → Providers → Google, same public Client ID already used by GSI). Nothing above can be exercised end-to-end until both are done.
