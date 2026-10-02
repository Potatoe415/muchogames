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
- Owner: run `0007_coins.sql`; sign in on `/admin` to confirm access; delete `ADMIN_PASSWORD` from Vercel.
- Then live-check each phase (BACKLOG Now), and delete the roadmap task file.
- Owner to provide `players` / `duration` for the untagged games.
- Still open: domain rewrite for `muchogames.win/<jeu>`; Tranquil Vercel repoint.

Open_Questions:
- Should GameBoy and Easy Frog also live under `muchogames.win/<jeu>`, or only the games in this repo?

Blockers:
- None for the roadmap: migrations 0004–0006 applied, `ADMIN_USER_IDS` set (Production + Preview) and production redeployed on 2026-10-02. Only live checks remain.
- Domain masking is blocked on a hosting choice (rewrites vs custom domains on each app).

Recent_Changes:
- 2026-10-02 Daily play coins: 10/day, one per hub launch, midnight Paris reset, admin unlimited (decision 0046). Needs `0007_coins.sql` for signed-in players.
- 2026-10-02 Yatzy room routes merged into one function via `vercel.json` rewrites (decision 0045): 7/12 functions.
- 2026-10-02 `docs/PRODUCT.md`, `ARCHITECTURE.md`, `SECURITY.md` aligned with the roadmap (owner confirmed).
- 2026-10-02 "Report a problem" everywhere: wordplayer reports carry `?game=`; coinchapp + Tranquil settings link to the hub's `?feedback=<gameId>`.
- 2026-10-02 Data export + account deletion on `/profile`, admin Players card (decision 0044).
- 2026-10-02 Hub catalog + announcement editable from `/admin` (decision 0043, 11/12 functions).
- 2026-10-02 Hub "My games" shelf, favorites, player tags/filter.
- 2026-10-02 Per-game results (decision 0042, coinchapp 0070).
- 2026-10-02 Feedback inbox (decision 0041); admin by Google account (decision 0040).
