# STATE

Replace on every update. Max 40 lines. History lives in git and `docs/decisions/`.

Status: Bootstrap v10.1 alignment applied 2026-09-22 (root + `apps/coinchapp` + `apps/tranquil`, all in one pass on `main`). `docs/DECISIONS.md` split into `docs/decisions/*.md` + `INDEX.md` (36 decisions, verbatim). New `docs/ARCHITECTURE.md` (merged from `docs/TECH.md`), `docs/SECURITY.md`, `docs/DEBUGGING.md`. `docs/TECH.md`/`docs/DECISIONS.md`/`CLAUDE.md`/`.cursor/rules/000-router.mdc` kept on disk, superseded, pending user confirmation to delete. Product-wise: active project on Vercel + Supabase, GameBoy Web hub tile, Yatzy Giphy reactions, Google Sign-In on `/profile`, wins/losses stat client-side across Yatzy/coinchapp/tranquil.
Focus: Building a unified player profile (real Google-linked Supabase Auth account) shared across the hub, `coinchapp`, and `tranquil` — name/avatar/wins/losses synced cross-app and cross-device, anonymous play unchanged for non-signed-in visitors. See `docs/tasks/unified-profile-accounts.md` (+ matching task files in `apps/coinchapp`/`apps/tranquil`).
Level: L2

Context:
- Working_On: `docs/tasks/unified-profile-accounts.md` (design revised mid-implementation: zero browser Supabase SDK, Google ID token verified server-side). Landed: `api/_lib/googleAuth.js`, `api/profile/*.js`, `auth.js`, `public/profile/profile.js`/`profile-stats.js`. `npm run check` passes.
- Relevant_Files: `supabase/migrations/0003_profiles.sql` (drafted, not applied), `apps/coinchapp/docs/tasks/unified-profile-accounts.md`, `apps/tranquil/docs/tasks/unified-profile-accounts.md`, `shared/CONTRACT.md`, `docs/ARCHITECTURE.md`
- Do_Not_Touch: game rules/content of any individual game; Yatzy's room-code/resume-token access model
- Relevant_Decisions: `docs/decisions/INDEX.md` 0001 (original bootstrap), 0037 (v10.1 alignment); none yet for this task (logged once Done)

Next:
- Blocking, needs the user: (a) run `supabase/migrations/0003_profiles.sql` against `multigames-db`, (b) enable Google as a Supabase Auth provider on that project (see `docs/RUNBOOK.md`). Nothing above is testable end-to-end until both are done.
- Remaining task steps (see task file): legacy-counter one-time migration, `hub.js` launch-code param, Yatzy calling `record-result`, `coinchapp`/`tranquil` sides, doc updates.
- Still open from the prior pass: confirm deletion of the 4 superseded router/flat-doc files (root + both apps), and the `docs/PRODUCT.md` Out_Of_Scope wording edit for the existing per-app wins/losses stat.
- Resume the large pre-existing device-verification/user-action backlog — see `docs/BACKLOG.md` Now.

Open_Questions:
- Whether to eventually rename `data-id` to `data-testid` repo-wide (bootstrap v10.1 default; kept `data-id` for now — see `docs/BACKLOG.md`).
- `GET /api/yatsy/games/[code]` is still unauthenticated.
- Retention: `muchogames_events` is append-only with no purge job.
- GitHub branch-protection rule on `main` requires a PR; user currently bypasses it on every push.

Blockers:
- None.

Recent_Changes:
- 2026-09-22 Bootstrap v10.1 alignment (context architecture only, no code touched): split `docs/DECISIONS.md` into `docs/decisions/*.md`+`INDEX.md`; added `docs/ARCHITECTURE.md`/`docs/SECURITY.md`/`docs/DEBUGGING.md`/`docs/_templates/`/`.claude/settings.json`; rewrote `AGENTS.md`/`STATE.md`; condensed `docs/BACKLOG.md` (dropped Done, merged Later into Next). Same pass applied to `apps/coinchapp` and `apps/tranquil`.
- 2026-09-17 `player-profile.js` gained a wins/losses counter, wired into Yatzy (robot/online modes only) and shown on `/profile`; `apps/coinchapp`/`apps/tranquil` got their own separate app-local counters.
- 2026-09-17 Yatzy: `.player-cell` square fix + `.icon-tile`/`.face-die` narrow-breakpoint fix; `sw.js` v37→v39.
- 2026-09-17 Yatzy: two-row in-game header + settings gear panel (language + per-player dice-selection reversal toggle).
- 2026-09-17 Yatzy: added local-game resume-on-refresh, mirroring existing online session persistence.
