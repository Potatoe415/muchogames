# 0024 — Profile launch count and top-five favorites stay client-only

Date: 2026-09-06
Status: Accepted
Decision: `/profile` shows how many games this browser has launched from the hub, plus the five most launched titles. Counts live in `localStorage` (`bergamots-launch-counts`), incremented in the existing hub-tile click (`shared/js/analytics.js` `trackGameLaunch`) and read by `PlayerProfile.getLaunchTotal()` / `getFavoriteLaunches()`. Nothing extra is sent to `/api/track` or `muchogames_events`.
Context: User asked to display launch volume and five favorite games on the profile page. Server-side per-player counters would need a visitor id, which PRODUCT already declined for analytics.
Rationale: The profile is already a client-only localStorage page (name + avatar). Reusing the single hub-tile instrumentation point keeps TECH's "analytics in one place" rule. Favorites are "most launched here", not a manual pin list and not the admin site-wide ranking.
Consequences: Stats start at zero on a new browser / after clearing site data. Direct URLs that skip the hub tile are not counted. `docs/DATA_MODEL.md` is unchanged (same client-only category as `bergamots-player-name`). PRODUCT/TECH were not edited autonomously; confirm with the user if the profile feature list should mention these stats.
Alternatives_Rejected: Reading the admin `/api/admin/stats` ranking on the profile — rejected, that is site-wide and password-gated, not personal. Adding a player id column to `muchogames_events` — rejected, contradicts the 2026-08-30 no-visitor-analytics decision.
