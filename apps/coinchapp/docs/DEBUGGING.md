# DEBUGGING

How errors, logs, and tests are built today so a bug can be located fast.
This describes the app's actual current conventions (evidence-based); gaps vs. the v10.1 ideal are listed at the end and tracked in `docs/BACKLOG.md`, not silently adopted.

## Error contract (current, as-is)

- Server Actions throw plain `Error` objects with a stable string code as the message (e.g. `"illegal_card"`, `"not_enough_players"` — renamed from `need_four_players` when seat counts became per-game-type). No `E_<SCOPE>_<NNN>` numeric catalog exists yet, and there is no `trace_id`.
- The client (`GameRoom.tsx` and friends) surfaces the thrown code/message directly — there is no separate "safe user message" vs. "internal code" split; the code itself is written to be reasonably user-facing already.
- No error catalog file exists yet (gap — see below).

## Logging (current, as-is)

- No custom logger exists. Server Actions and API-adjacent code rely on the Vercel Runtime Logs for anything uncaught.
- No `trace_id` is generated or propagated.

## Bug workflow

1. Reproduce — locally via `npm run dev` (two browser profiles for multiplayer, or "Remplir avec des bots"), or read Vercel Runtime Logs for a production issue.
2. Locate the game engine (`lib/<game>/`) or the shared layer (`lib/server`, `lib/client`) responsible.
3. Write a failing test in the relevant `*.test.ts` file (the existing pattern: `lib/coinche/*.test.ts`, `lib/bouilla/*.test.ts`, `lib/president/*.test.ts`, `lib/bataillecorse/*.test.ts`, plus `lib/server/idle-timer.test.ts`) — this repo already follows "reproduce with a test first" for its pure engines, unlike the root hub-spoke repo.
4. Fix the root cause, not the symptom.
5. Run `npm test`, then `npx tsc --noEmit`, then `npm run lint` and `npm run build` before declaring done (no single combined `check` script exists yet — see `docs/BACKLOG.md`).
6. Remove temporary diagnostics.

## Tests

- Vitest (`npm test` / `npm run test:watch`) covers the pure rules engines: `lib/coinche`, `lib/bouilla`, `lib/president`, `lib/bataillecorse` (cards, deal, bidding/combos, trick/play, scoring, bot, redact), plus `lib/server/idle-timer.test.ts` and `lib/client/*.test.ts` (e.g. `botSim.test.ts`, `reactions.test.ts`).
- This is the existing regression-test discipline: every engine change is expected to keep its `*.test.ts` file green, and new rules/bug fixes get a new test case in the matching file.
- No end-to-end/UI test suite exists — real-device/browser verification is done manually (see `docs/decisions/INDEX.md` entries referencing live browser/device checks).

## Gaps vs. the v10.1 ideal (tracked in `docs/BACKLOG.md`, not fixed by this alignment pass)

- No stable `E_<SCOPE>_<NNN>` error code catalog (string codes exist but aren't numbered/cataloged).
- No `trace_id` generated or propagated.
- No shared logger module.
- No single `check` command (lint/test/build are separate `package.json` scripts).
- No automated dependency audit.
