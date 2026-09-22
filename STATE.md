# STATE

Replace on every update. Max 40 lines. History lives in git and `docs/decisions/`.

Status: Bootstrap v10.1 alignment applied 2026-09-22 (root + `apps/coinchapp` + `apps/tranquil`, all in one pass on `main`). `docs/DECISIONS.md` split into `docs/decisions/*.md` + `INDEX.md` (36 decisions, verbatim). New `docs/ARCHITECTURE.md` (merged from `docs/TECH.md`), `docs/SECURITY.md`, `docs/DEBUGGING.md`. `docs/TECH.md`/`docs/DECISIONS.md`/`CLAUDE.md`/`.cursor/rules/000-router.mdc` kept on disk, superseded, pending user confirmation to delete. Product-wise: active project on Vercel + Supabase, GameBoy Web hub tile, Yatzy Giphy reactions, Google Sign-In on `/profile`, wins/losses stat client-side across Yatzy/coinchapp/tranquil.
Focus: Get explicit user confirmation to (a) delete the superseded `docs/TECH.md`, `docs/DECISIONS.md`, `CLAUDE.md`, `.cursor/rules/000-router.mdc` (root + same set in `apps/coinchapp`/`apps/tranquil`), and (b) update `docs/PRODUCT.md` (+ `apps/coinchapp/docs/PRODUCT.md`) Out_Of_Scope wording now that Yatzy/coinchapp/tranquil each have a wins/losses stat.
Level: L2

Context:
- Working_On: `AGENTS.md`, `STATE.md`, `docs/ARCHITECTURE.md`, `docs/SECURITY.md`, `docs/DEBUGGING.md`, `docs/decisions/`, `docs/BACKLOG.md` (root + both apps)
- Relevant_Files: `docs/decisions/INDEX.md`, `docs/GAMES_MAP.md`, `docs/NEW_GAME.md` (kept as-is, still wired into `AGENTS.md`)
- Do_Not_Touch: no source code was touched by this alignment pass (docs/context-architecture only)
- Relevant_Decisions: `docs/decisions/INDEX.md` 0001 (original bootstrap), 0037 (this v10.1 alignment)

Next:
- Ask the user to confirm deletion of the 4 superseded router/flat-doc files (root + both apps — see Focus).
- Ask the user to confirm the `docs/PRODUCT.md` Out_Of_Scope wording edit (see Focus).
- Resume the large pre-existing device-verification/user-action backlog — see `docs/BACKLOG.md` Now (Vercel token rotation, `tranquil` repoint, admin password rotation, etc.) — none of it was touched by this alignment pass.

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
