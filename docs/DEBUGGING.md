# DEBUGGING

How errors, logs, and tests are built today so a bug can be located fast.
This describes the repo's actual current conventions (evidence-based); gaps vs. the v10.1 ideal are listed at the end and tracked in `docs/BACKLOG.md`, not silently adopted.

## Error contract (current, as-is)

- Serverless (`api/`): every handler is wrapped in `api/_lib/http.js`'s `withErrorHandling`. 4xx errors are returned with their written message as-is (meant for the user, e.g. `"room_full"`, `"not_enough_players"`). 5xx detail (usually a raw Postgres message) is logged server-side and replaced by one generic sentence for the response — no stable `E_<SCOPE>_<NNN>` code system exists yet, and there is no `trace_id` propagation.
- Client-side code (games under `public/games/`) follows per-module style; e.g. `matchmaking.js` throws tagged `Error` objects with a `.code` string, but this is not a repo-wide convention.
- No error catalog file exists yet (gap — see below).

## Logging (current, as-is)

- Serverless: 5xx failures are logged to stderr as one-line JSON (`level`, `code`, `method`, `detail`, `stack`), surfacing in Vercel's Runtime Logs (already tagged with invocation/path/request id by Vercel itself — no separate `trace_id` is generated).
- Browser: console-only, no error reporting service.
- No shared logger module exists; logging is ad hoc per file.

## Bug workflow

1. Reproduce. For a serverless 500, read the real message via `vercel logs <deployment-url>` (`sendError`/`withErrorHandling` log detail server-side even though the response is redacted) — see `docs/RUNBOOK.md` Troubleshooting.
2. Locate the module/game folder (`docs/GAMES_MAP.md` for game-scoped work).
3. No repo-wide rule yet requires a failing test first — there is no test suite (see Tests below). Reproduce manually via `npm run dev` / browser DevTools.
4. Fix the root cause, not the symptom.
5. Run `npm run check` (lint + format-check + build) before declaring done.
6. Remove temporary diagnostics (e.g. `TEMP` build-tag labels used to catch stale service-worker caches — see `docs/decisions/INDEX.md` 2026-09-17 Yatzy entries).

## Tests

- No automated test suite exists in this repo today (root hub-spoke surface). `apps/coinchapp` and `apps/tranquil` each have their own Vitest suites — see their own `docs/DEBUGGING.md`/`AGENTS.md`, not this file.
- `npm run check` = `npm run lint && npm run format:check && npm run build`. This is the closest thing to a gate today; it does not run any tests because none exist.
- CI (`.github/workflows/ci.yml`) runs lint, format-check, build on push/PR to `main`/`master`. It does not deploy and does not run tests.

## Gaps vs. the v10.1 ideal (tracked in `docs/BACKLOG.md`, not fixed by this alignment pass)

- No stable `E_<SCOPE>_<NNN>` error code catalog.
- No `trace_id` generated or propagated (Vercel's own request id partially substitutes for serverless functions only).
- No shared logger module; logging is per-file/ad hoc.
- No automated tests for the hub-spoke surface (`scoring.js`, `shared/js/engine.js` are the highest-value candidates per `docs/TECH.md` Open_Questions, retained).
- No client-side error reporting (browser errors die silently in the console) — a deliberate, previously-made decision (see `docs/decisions/INDEX.md` 2026-08-30 observability entries), not an oversight.
