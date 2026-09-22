# 0003 — Reuse coinchapp's Supabase project (renamed `multigames-db`) instead of a dedicated one

Date: 2026-08-16
Status: Accepted
Decision: Yatzy uses the same Supabase project as `coinchapp` (renamed `multigames-db` by the user), not a new dedicated Supabase project. Yatzy's tables are namespaced (`yatzy_games`, `yatzy_game_events`) to avoid colliding with coinchapp's `games`/`game_players`/`game_events`.
Context: User explicitly asked to reuse the same DB as `coinchapp` rather than provisioning a separate Supabase project, and provided the project URL + public (`sb_publishable_...`) key.
Rationale: One shared Supabase project across the user's apps is simpler to manage (one dashboard, one bill) than one project per app; RLS + table namespacing fully isolate Yatzy's data from coinchapp's, so sharing the project has no security cost.
Consequences: `public/games/yatsy/supabase-config.js` and the Vercel `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` env vars point at `multigames-db`. Any future schema change must keep checking for name collisions with coinchapp's tables/cron jobs/realtime publications in that same project. Verified end-to-end in production (create/join/delete against `https://bergamots.vercel.app/api/yatsy/games`).
Alternatives_Rejected: Provisioning a fresh, dedicated Supabase project for Yatzy ? rejected per explicit user instruction to reuse the existing one.
