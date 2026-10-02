# STATE

Replace on every update. Max 40 lines. History lives in git and `docs/decisions/`.

Status: Roadmap phases 1–2 shipped in code. `/admin` = Google sign-in + `ADMIN_USER_IDS`. "Report a problem" on the hub, `/profile` and the six in-repo games feeds `muchogames_feedback`, triaged in the `/admin` Feedback card. Live use waits on the owner: `ADMIN_USER_IDS` on Vercel, and running `0004_feedback.sql`.
Focus: Roadmap `docs/tasks/platform-admin-profile-roadmap.md` — next is phase 3 (per-game results).
Level: L2.

Context:
- Working_On: `docs/tasks/platform-admin-profile-roadmap.md` (6 phases, approved 2026-10-02)
- Relevant_Files: `api/admin/index.js` (+ `_stats.js`, `_feedback.js`), `api/feedback.js`, `public/shared/js/feedback.js`, `public/shared/js/game-header.js`, `public/admin/admin-feedback.js`
- Do_Not_Touch: game engines; hub launch URLs in `public/hub-config.json`
- Relevant_Decisions: 0040 (admin by Google), 0041 (feedback inbox), 0039 (one function per API area)

Next:
- Owner: set `ADMIN_USER_IDS` (Production + Preview), redeploy, delete `ADMIN_PASSWORD`; run `0004_feedback.sql` in the Supabase SQL editor.
- Phase 3: `muchogames_results` + atomic record function; touches `apps/coinchapp` and `apps/tranquil` profile links. Show SQL first; the Supabase connector cannot see `multigames-db` (it is on the `nodali` org).
- Owner to confirm proposed `docs/PRODUCT.md` / `ARCHITECTURE.md` / `SECURITY.md` wording (admin by Google, public feedback endpoint).
- Still open: domain rewrite for `muchogames.win/<jeu>`; live checks of `/profile` wins/losses.

Open_Questions:
- Should GameBoy and Easy Frog also live under `muchogames.win/<jeu>`, or only the games in this repo?

Blockers:
- Domain masking is blocked on a hosting choice (rewrites vs custom domains on each app).

Recent_Changes:
- 2026-10-02 Feedback inbox: `api/feedback.js`, shared report dialog, `/admin` Feedback card; Yatzy offline cache v40 (10/12 functions).
- 2026-10-02 Admin by allowlisted Google account; `api/admin/{login,stats}.js` merged into `api/admin/index.js`.
