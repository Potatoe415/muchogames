# 0043 — Hub settings overlay served by a cached function

Date: 2026-10-02
Status: Accepted
Decision: Hidden / pinned / "new" games and the announcement banner live in a single-row `muchogames_hub_settings` table, read by the hub through a public `GET /api/hub-settings` cached 60 s on Vercel's CDN, and written only from `/admin`.
Context: Roadmap phase 5: the owner wants to tweak the catalog and post announcements without a redeploy. The plan first proposed a publicly readable table; at implementation time a function was chosen instead.
Rationale: Keeps every `muchogames_*` table at RLS-with-zero-policies (no anon key or Supabase URL in the hub bundle) and lets the CDN absorb hub traffic. `hub-config.json` stays the source of truth for what a game is; the row only overlays presentation, and any read failure falls back to the static catalog. One function (11 of 12 on Vercel Hobby); phase 6 needs none.
Consequences: Admin edits take up to about a minute to show (CDN `max-age=60`, `stale-while-revalidate=300`). One function slot left. The hub waits at most 1.2 s for settings before rendering.
Alternatives_Rejected: Public `select` policy read with the anon key (opens the table, duplicates Supabase config in the bundle). Editing `hub-config.json` from the admin (needs a commit + redeploy). Vercel Edge Config (new vendor surface for one small row).
