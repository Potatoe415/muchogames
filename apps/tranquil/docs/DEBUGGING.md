# DEBUGGING

How errors, logs, and tests are built today so a bug can be located fast.
This describes the app's actual current conventions (evidence-based); gaps vs. the v10.1 ideal are listed at the end and tracked in `docs/BACKLOG.md`, not silently adopted.

## Error contract (current, as-is)

- `/api/*` endpoints return `{ error: string }` with a stable string code (e.g. `"room_full"`, `"not_in_game"`) and the matching HTTP status. No `E_<SCOPE>_<NNN>` numeric catalog exists yet, and there is no `trace_id`.
- The client surfaces `error.message` directly.
- No error catalog file exists yet (gap — see below).

## Logging (current, as-is)

- Lightweight, consistently-tagged `console.log` helpers exist for tracing the auth → create/join room → sync connection flow across layers, using shared step names (`auth`, `create_room`, `join_room`, `sync`) so a request can be followed end-to-end:
  - `client/src/lib/log.ts`'s `logApp(step, message, data?)` — styled browser console output.
  - `api/_lib/log.ts`'s `logServer(step, message, data?)` / `logDb(step, message, data?)` — plain lines, visible in `vercel dev` / the Vercel dashboard's function logs.
- This is a real, if narrow, logging convention — reuse `logApp`/`logServer`/`logDb` with the existing step names for any change to the connection flow, rather than adding ad hoc `console.*` calls. It does not cover the rest of the app (game moves, bot logic).
- No `trace_id` is generated or propagated; the shared step-name tagging above is the closest equivalent today.

## Bug workflow

1. Reproduce — locally via `npm run dev` (starts both `vercel dev` on :3001 and the Vite client on :5173), or read `vercel logs <deployment-url>` for a production issue (see `docs/RUNBOOK.md` Troubleshooting).
2. Locate the responsible layer: `shared/src` (pure engine/bot), `api/_lib`/`api/*.ts` (server), or `client/src` (UI/realtime).
3. Write a failing test in `shared/src/*.test.ts` if the bug is in engine/bot/feasibility logic (the existing pattern: `gameEngine.test.ts`, `gridFeasibility.test.ts`).
4. Fix the root cause, not the symptom.
5. Run `npm test`, then `npx tsc --noEmit -p tsconfig.json`, then `npm run build -w client` before declaring done (no single combined `check` script exists yet — see `docs/BACKLOG.md`).
6. Remove temporary diagnostics.

## Tests

- Vitest (`npm test`, runs `shared`'s test suite) covers the pure game engine and bot/feasibility logic: `gameEngine.test.ts`, `gridFeasibility.test.ts`.
- No test suite exists for `api/*.ts` endpoints or the `client/` UI — real-device/browser verification is done manually (see `docs/decisions/INDEX.md` entries referencing live browser/device checks, e.g. the mobile hand/viewport bugs).

## Gaps vs. the v10.1 ideal (tracked in `docs/BACKLOG.md`, not fixed by this alignment pass)

- No stable `E_<SCOPE>_<NNN>` error code catalog (string codes exist but aren't numbered/cataloged).
- No `trace_id` generated or propagated (the `log.ts`/`_lib/log.ts` step-name tagging only covers the connection flow).
- No single `check` command.
- No automated dependency audit.
- No API-level or UI test coverage (engine-only today).
