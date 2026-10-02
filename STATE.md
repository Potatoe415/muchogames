# STATE

Replace on every update. Max 40 lines. History lives in git and `docs/decisions/`.

Status: Roadmap phases 1–4 shipped in code: admin by Google, feedback inbox, per-game results, hub "My games" shelf + favorites + player tags/filter. Owner runs all SQL at the end (0004, 0005, …); every feature degrades cleanly until then.
Focus: Roadmap `docs/tasks/platform-admin-profile-roadmap.md` — next is phase 5 (catalog + announcements from admin).
Level: L2.

Context:
- Working_On: `docs/tasks/platform-admin-profile-roadmap.md` (6 phases, approved 2026-10-02)
- Relevant_Files: `api/admin/index.js` (+ `_stats.js`, `_feedback.js`), `api/feedback.js`, `public/shared/js/feedback.js`, `public/shared/js/game-header.js`, `public/admin/admin-feedback.js`
- Do_Not_Touch: game engines; hub launch URLs in `public/hub-config.json`
- Relevant_Decisions: 0040 (admin by Google), 0041 (feedback inbox), 0039 (one function per API area)

Next:
- Owner: set `ADMIN_USER_IDS` (Production + Preview), redeploy, delete `ADMIN_PASSWORD`; at the end, run migrations 0004+ in order in the Supabase SQL editor (connector cannot see `multigames-db`).
- Phase 5: `muchogames_hub_settings` (public read), admin edits hidden/pinned/order/"new" badge + announcement banner; hub overlays it on `hub-config.json` with a static fallback.
- Owner to confirm proposed `docs/PRODUCT.md` / `ARCHITECTURE.md` / `SECURITY.md` wording (admin by Google, public feedback endpoint).
- Still open: domain rewrite for `muchogames.win/<jeu>`; live checks of `/profile` wins/losses.

Open_Questions:
- Should GameBoy and Easy Frog also live under `muchogames.win/<jeu>`, or only the games in this repo?

Blockers:
- Domain masking is blocked on a hosting choice (rewrites vs custom domains on each app).

Recent_Changes:
- 2026-10-02 Hub: "My games" shelf (favorites + recents), tile stars, `players`/`duration` tags, player-count filter (`hub-shelf.js`, `hub-tags.js`).
- 2026-10-02 Per-game results (decision 0042, coinchapp 0070); Yatzy offline cache v41.
- 2026-10-02 Feedback inbox: `api/feedback.js`, shared report dialog, `/admin` Feedback card; Yatzy offline cache v40 (10/12 functions).
- 2026-10-02 Admin by allowlisted Google account; `api/admin/{login,stats}.js` merged into `api/admin/index.js`.
