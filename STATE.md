# STATE

Replace on every update. Max 40 lines. History lives in git and `docs/decisions/`.

Status: Roadmap `docs/tasks/platform-admin-profile-roadmap.md` is fully shipped in code (6 phases): admin by Google allowlist, feedback inbox, per-game results, hub shelf/favorites/tags, admin-edited catalog + announcement, data export / account deletion + admin players. Every feature degrades cleanly until the owner runs the SQL.
Focus: Owner setup, then live checks (`docs/BACKLOG.md` Now).
Level: L2 (blocked on owner actions).

Context:
- Working_On: n/a (waiting on owner)
- Relevant_Files: `api/admin/index.js` (+ `_stats`, `_feedback`, `_hubSettings`, `_players`), `api/profile/index.js` (+ `_gameStats`, `_account`), `api/feedback.js`, `api/hub-settings.js`, `hub-*.js`, `public/admin/admin-*.js`, `public/profile/profile-*.js`
- Do_Not_Touch: game engines; hub launch URLs in `public/hub-config.json`
- Relevant_Decisions: 0040–0044 (coinchapp 0070)

Next:
- Owner: set `ADMIN_USER_IDS` (Production + Preview), redeploy, delete `ADMIN_PASSWORD`.
- Owner: run in order in the Supabase SQL editor of `multigames-db`: `0004_feedback.sql`, `0005_game_stats.sql`, `0006_hub_settings.sql` (the connector cannot see that project).
- Then live-check each phase (BACKLOG Now), and delete the roadmap task file.
- Owner to confirm proposed `docs/PRODUCT.md` / `ARCHITECTURE.md` / `SECURITY.md` wording (admin by Google, public feedback + hub-settings endpoints, account deletion).
- Owner to provide `players` / `duration` for the untagged games.
- Still open: domain rewrite for `muchogames.win/<jeu>`; Tranquil Vercel repoint.

Open_Questions:
- Should GameBoy and Easy Frog also live under `muchogames.win/<jeu>`, or only the games in this repo?

Blockers:
- Live verification of phases 1–6 needs `ADMIN_USER_IDS` and migrations 0004–0006.
- Domain masking is blocked on a hosting choice (rewrites vs custom domains on each app).

Recent_Changes:
- 2026-10-02 "Report a problem" everywhere: wordplayer reports carry `?game=`; coinchapp + Tranquil settings link to the hub's `?feedback=<gameId>`.
- 2026-10-02 Data export + account deletion on `/profile`, admin Players card (decision 0044).
- 2026-10-02 Hub catalog + announcement editable from `/admin` (decision 0043, 11/12 functions).
- 2026-10-02 Hub "My games" shelf, favorites, player tags/filter.
- 2026-10-02 Per-game results (decision 0042, coinchapp 0070).
- 2026-10-02 Feedback inbox (decision 0041); admin by Google account (decision 0040).
