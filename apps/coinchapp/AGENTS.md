# AGENTS

Canonical instructions for all agents and humans. No other instruction file may duplicate or contradict this one.
Language: English for code, comments, docs, commits. User-facing copy: French (see `docs/PRODUCT.md`).

Aligned to bootstrap v10.1 on 2026-09-22 (see `docs/decisions/INDEX.md`). This app predates the `src/modules/` convention that bootstrap assumes — see `docs/ARCHITECTURE.md`'s module map for how modularity actually works here (`lib/<game>/` rules engines).

This app is a **self-governing colocated sub-app** inside the `muchogames` repo (see the root `AGENTS.md` and `docs/GAMES_MAP.md`). A task inside `apps/coinchapp/` follows *this* file, not the root repo's vanilla-JS rules. Never run the root repo's `npm run lint`/`format`/`build` expecting it to cover this app.

## Commands

Run `check` before declaring any task done. Never claim something was verified if the command was not run.

| Purpose | Command |
|---|---|
| Install | `npm install` |
| Dev | `npm run dev` |
| Test one module | `npm test -- <path-to-test-file>` (Vitest) |
| Check | No single combined command exists yet — run `npm test && npx tsc --noEmit && npm run lint && npm run build` (see `docs/BACKLOG.md`) |

## Context loading

Start with `STATE.md`. Load only what the task needs. Never scan the whole repository. Skip dependencies, build output, lockfiles, logs, raw data.

| Task touches | Load |
|---|---|
| Scope, users, UX, acceptance criteria | `docs/PRODUCT.md` |
| Stack, module map, per-game engines, shared UI base | `docs/ARCHITECTURE.md` |
| Data model (`games`/`game_players`/`game_events`, settings, state shapes) | `docs/DATA_MODEL.md` |
| Auth, permissions, input, secrets, new dependency | `docs/SECURITY.md` |
| Bug, error, logging, tests | `docs/DEBUGGING.md` |
| Setup, deploy, migrate, rollback, run/test/lint/build/check | `docs/RUNBOOK.md` |
| Planning | `docs/BACKLOG.md` |
| A past decision | `docs/decisions/INDEX.md`, then only the relevant decision |
| Creating a doc, module, task, or decision | its template in `docs/_templates/` |
| Resuming after time away (> 1 day) | `docs/decisions/INDEX.md` + Recent_Changes in `STATE.md` |

A file in this table may not exist yet. Create it from its template only when there is real content for it.

## Task levels

Classify every task first. When unsure, go one level up.
- **L0 trivial** (rename, copy, style, obvious local fix): do it, run the relevant test.
- **L1 local** (one game engine or one component): checkpoint, inspect, change, test, run `check`.
- **L2 structural** (data model, auth, permissions, new dependency, API contract, cross-game change, migration, infra): checkpoint, state non-obvious assumptions and a plan with a verify step per step, wait for approval, create `docs/tasks/<slug>.md`, log a decision.

Checkpoint: the working tree is committed before you start. If it is not, ask.

## Change rules

- Smallest complete change: the whole behaviour, verified, nothing more.
- Touch only what the task needs. Match existing style. Report unrelated issues; do not fix them.
- Remove imports, variables, or functions that YOUR changes made unused. Leave pre-existing dead code unless asked.
- Prefer existing code, platform features, and existing dependencies over new code.
- Duplicate simple code until the shared concept is proven. Extract when copies change for the same reason.
- Files ≤ 300 lines, functions ≤ 30 lines. Split by responsibility, not by size, when a file exceeds the limit.
- No placeholder logic in production paths unless marked `# TEMP` with a reason.
- Several valid interpretations: ask. Never silently choose a stack, framework, database, hosting, auth, or payment provider.

### Frontend — LLM-addressable UI
- Every meaningful UI element must have a stable `data-id` attribute (buttons, forms, inputs, modals, sections, cards, navigation items, error states).
- Use `data-id`, not `id`. Values are kebab-case, descriptive, unique within the page: `data-id="checkout-submit-button"`.
- Do not use positional or generic names (`data-id="button-1"`, `data-id="div-main"`).
- `data-id` values must not change unless the element's purpose changes. Preserve on edit.

### Card games — shared base, differentiate on top
See `docs/ARCHITECTURE.md` "Card games — shared base, differentiate on top" for the full list of reusable primitives (`TableShell`, `HomeTopBar`, `GameHud`'s `GameInfoButton`, `TrickStage`, `PlayingCard`, `HandCardSlot`, reaction/seat helpers). Before writing new per-game animation/interaction/chrome code: check whether the base already covers it, or is a small, obviously-generalizable extension of something it already does. Only write game-specific code when the rule/interaction itself genuinely differs (e.g. Président's select-then-confirm hand).

### Card games — simulate instant/local feel online
Every card game's table (online, ad-hoc/P2P, or any server-round-trip mode) MUST make its own player's move feel as instant as local pass-and-play. See `docs/ARCHITECTURE.md` for the full rule and the three existing shared hooks (`useOptimisticPlay`, `usePresidentOptimisticPlay`, `useOptimisticFlip`) — reuse one of them, or build the equivalent for a genuinely new action shape. Never ship an action that only updates the tapping player's own screen after a server round trip completes. This does not apply to reflecting an opponent's move.

## Security invariants

See `docs/SECURITY.md` for the full baseline. In short:
- Never read, print, or summarise secrets or `.env` values. Only `.env.example` is committed.
- Validate every submitted move against the pure rules engine before persisting. Enforce authorization server-side (RLS + service-role-only writes).
- Never log secrets, tokens, hidden hands, or personal data.
- New dependency: check that an existing one does not suffice, verify the exact name exists and is maintained, then ask the user.
- Destructive operations (delete Supabase rows, force push, production deploy) need explicit user approval.

## Debugging invariants

See `docs/DEBUGGING.md` for the current (as-is) error/logging conventions and their gaps — no stable numeric error-code catalog or `trace_id` exists yet; string error codes from Server Actions are the current convention.
- A bug fix in a rules engine starts with a failing test in the matching `*.test.ts` file (existing discipline for `lib/coinche`, `lib/bouilla`, `lib/president`, `lib/bataillecorse`).
- Run `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build` before declaring done.

## After each task

- `STATE.md`: replace Focus, Context, Next. Max 40 lines.
- `docs/BACKLOG.md`: move items.
- `docs/DATA_MODEL.md`: update whenever the schema or `GameState`/`GameSettings` shapes change.
- L2: add a decision file in `docs/decisions/` and one line in `docs/decisions/INDEX.md`; delete the task file.
- `docs/PRODUCT.md`, `docs/ARCHITECTURE.md`, `docs/SECURITY.md`: propose changes; edit only after the user confirms.
- Propose a conventional commit message.

## File Ownership

| File | Rule |
|---|---|
| `AGENTS.md` | Edit only to improve agent workflow. |
| `STATE.md` | Replace on every update. Never append history here. Max 40 lines. |
| `docs/PRODUCT.md` | Living document. Never edit autonomously — confirm with user first. |
| `docs/ARCHITECTURE.md` | Living document. Never edit autonomously — confirm with user first. |
| `docs/SECURITY.md` | Living document. Never edit autonomously — confirm with user first. |
| `docs/DEBUGGING.md` | Living document. Update when error/logging conventions change. |
| `docs/DATA_MODEL.md` | Living document. Update whenever persisted data structure changes. |
| `docs/BACKLOG.md` | Living document. Always current. |
| `docs/decisions/*.md` | Append-only. Never edit past entries. |
| `docs/decisions/INDEX.md` | One line added per new decision. |
| `docs/RUNBOOK.md` | Update when commands or steps change. |

## Retired files (kept on disk, pending user confirmation to delete)

- `docs/TECH.md` — superseded by `docs/ARCHITECTURE.md`.
- `docs/DECISIONS.md` — superseded by `docs/decisions/*.md` + `docs/decisions/INDEX.md` (same content, split one-file-per-entry, verbatim).
- `CLAUDE.md`, `.cursor/rules/000-router.mdc` — thin routers, redundant now that `AGENTS.md` is read natively by current tools.
