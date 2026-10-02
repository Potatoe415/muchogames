# Task: platform-admin-profile-roadmap

Level: L2
Status: Blocked — all six phases shipped in code; live verification waits on the owner running migrations 0004–0006 and setting `ADMIN_USER_IDS` (see `docs/BACKLOG.md`). Delete this file once those checks pass.
Goal: Turn `/admin` into an owner-only back-office, give `/profile` per-game stats and privacy controls, and make the hub faster to use.
Scope: hub (`index.html`, `hub.js`, `auth.js`), `public/admin/`, `public/profile/`, `api/admin/`, `api/profile/`, new `supabase/migrations/*`; phase 3 also touches `apps/coinchapp/lib/server/profileLink.ts` and `apps/tranquil/api/_lib/profileLink.ts`.
Do_Not_Touch: game rules/engines; other games' folders unless a phase names them.
Assumptions:
- Admin identity is a Supabase Auth user id (Google sign-in), listed in the `ADMIN_USER_IDS` Vercel env var. Ids, not emails: a signed-in user can request an email change from the browser, never an id change.
- The shared admin password is removed outright (user choice, 2026-10-02).
- Feedback can be sent anonymously, rate-limited (user choice, 2026-10-02).
- SQL migrations are shown to the user, then applied through the Supabase connector after approval (user choice, 2026-10-02).
- Vercel Hobby caps a deployment at 12 functions; 10 are used. New server work fans out on `action` inside existing or merged functions.
Plan:
1. Admin by Google account: merge `api/admin/login.js` + `stats.js` into `api/admin/index.js`; Google sign-in on `/admin`; hub shows an "Admin" link to allowlisted users → verify: allowlisted account sees the dashboard, another Google account gets 403, no token gets 401, `npm run check` passes.
2. Feedback inbox: `muchogames_feedback` table, `api/feedback.js`, "Report a problem" button on hub/profile/shared game header, admin list with statuses → verify: send from Yatzy, see it in admin, mark resolved.
3. Per-game results: `muchogames_results` table + atomic record function; Yatzy, coinchapp, Tranquil call it; per-game stats + history on `/profile`; players/games counts in admin → verify: coinchapp + tranquil Vitest, one finished game per app shows on `/profile`.
4. Hub: recently played, favorites, player-count/duration tags, player-count filter → verify: visual check mobile + desktop.
5. Catalog + announcements from admin: `muchogames_hub_settings` (public read), hub overlays it on `hub-config.json` with a static fallback → verify: hide a game from admin, hub hides it; hub still works when Supabase is unreachable.
6. Privacy + players: export my data / delete my account on `/profile`; admin players list, reset name/avatar, delete account → verify: export then delete a test Google account, all rows gone.
Acceptance_Criteria:
- [x] Phase 1 (code + local verification; live check pending `ADMIN_USER_IDS`)
- [x] Phase 2 (code + local verification; live check pending the owner running `0004_feedback.sql`)
- [x] Phase 3 (code + tests + local verification; live check pending `0005_game_stats.sql`). Scoped to one row per profile and game, no per-match history (decision 0042).
- [x] Phase 4 ("My games" shelf = favorites + recents, star on tiles, `players`/`duration` tags, player-count filter). `players` filled only where code proves it; durations left to the owner.
- [x] Phase 5 (served by cached `GET /api/hub-settings` rather than a public-read table, decision 0043; live check pending `0006_hub_settings.sql`)
- [x] Phase 6 (export + delete on `/profile`, admin Players card; no new table or function, decision 0044)
Security_Checklist: per phase, `docs/SECURITY.md` "Checklist for every new or changed endpoint or action".
Related_Decisions: 0040, 0041, 0042 (coinchapp 0070), 0043, 0044
Notes:
- Phase 1: `/admin` login returns the Supabase access token from the Google exchange (1h); every admin action re-resolves it with `auth.getUser` and re-checks the allowlist. A non-allowlisted sign-in gets a 403 that shows its own user id, which is how the owner finds the value for `ADMIN_USER_IDS`.
- The Supabase connector is signed in to the `nodali` organization and cannot see `multigames-db`: migrations are run by the owner in the Supabase SQL editor unless the connector is re-authenticated.
- Phase 2: the report entry is injected by `game-header.js` into every `.options-panel-body`; wordplayer games, coinchapp and Tranquil have no entry yet.
- `docs/PRODUCT.md`, `docs/ARCHITECTURE.md`, `docs/SECURITY.md` still describe the shared admin password; edits proposed to the user, not applied.
