# STATE

Replace on every update. Max 40 lines. History lives in git and `docs/decisions/`.

Status: Roadmap phase 1 shipped in code: `/admin` is now Google sign-in + `ADMIN_USER_IDS` allowlist (shared password removed); the hub account menu shows "Admin" to allowlisted users. Live use waits on the owner setting `ADMIN_USER_IDS` on Vercel.
Focus: Roadmap `docs/tasks/platform-admin-profile-roadmap.md` — next is phase 2 (feedback inbox).
Level: L2.

Context:
- Working_On: `docs/tasks/platform-admin-profile-roadmap.md` (6 phases, approved 2026-10-02)
- Relevant_Files: `api/admin/index.js`, `api/admin/_stats.js`, `api/_lib/adminAuth.js`, `public/admin/admin-auth.js`, `auth-admin.js`, `vercel.json` (`/admin` CSP)
- Do_Not_Touch: game engines; hub launch URLs in `public/hub-config.json`
- Relevant_Decisions: 0040 (admin by Google account), 0039 (one function per API area)

Next:
- Owner: set `ADMIN_USER_IDS` (Production + Preview), redeploy, delete `ADMIN_PASSWORD`; sign in on live `/admin`.
- Phase 2: show the `muchogames_feedback` migration SQL to the owner, apply via the Supabase connector after approval, then `api/feedback.js` + report button + admin inbox.
- Owner to confirm the proposed `docs/PRODUCT.md` / `ARCHITECTURE.md` / `SECURITY.md` wording for the admin change.
- Still open from before: domain rewrite for `muchogames.win/<jeu>`; live checks of `/profile` wins/losses.

Open_Questions:
- Should GameBoy and Easy Frog also live under `muchogames.win/<jeu>`, or only the games in this repo?

Blockers:
- Domain masking is blocked on a hosting choice (rewrites vs custom domains on each app).

Recent_Changes:
- 2026-10-02 Admin by allowlisted Google account; `api/admin/{login,stats}.js` merged into `api/admin/index.js` (9/12 functions).
- 2026-09-25 Yams: in-game title "Yams"; settings gear moved to the right of the scores.
