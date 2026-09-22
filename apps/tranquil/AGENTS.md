# AGENTS

Canonical instructions for all agents and humans. No other instruction file may duplicate or contradict this one.
Language: English for code, comments, docs, commits. User-facing copy: see `docs/PRODUCT.md`.

Aligned to bootstrap v10.1 on 2026-09-22 (see `docs/decisions/INDEX.md`). This app predates the `src/modules/` convention that bootstrap assumes — see `docs/ARCHITECTURE.md`'s module map for how modularity actually works here (`shared`/`api`/`client` workspaces).

This app is a **self-governing colocated sub-app** inside the `muchogames` repo (see the root `AGENTS.md` and `docs/GAMES_MAP.md`). A task inside `apps/tranquil/` follows *this* file, not the root repo's vanilla-JS rules.

## Commands

Run `check` before declaring any task done. Never claim something was verified if the command was not run.

| Purpose | Command |
|---|---|
| Install | `npm install` (from this app's root — installs all its workspaces) |
| Dev | `npm run dev` (starts `api` on :3001 and `client` on :5173) |
| Test one module | `npm test` (runs `shared`'s Vitest suite — the only tested workspace) |
| Check | No single combined command exists yet — run `npm test && npx tsc --noEmit -p tsconfig.json && npm run build -w client` (see `docs/BACKLOG.md`) |

## Context loading

Start with `STATE.md`. Load only what the task needs. Never scan the whole repository. Skip dependencies, build output, lockfiles, logs, raw data.

| Task touches | Load |
|---|---|
| Scope, users, UX, acceptance criteria | `docs/PRODUCT.md` (currently all "TBD" — confirm scope with the user before treating anything here as settled) |
| Stack, module map, workspaces | `docs/ARCHITECTURE.md` |
| Data model (shared `games`/`game_players`/`game_events` rows, `game_type='tranquillity'`) | `docs/DATA_MODEL.md` |
| Auth, permissions, input, secrets, new dependency | `docs/SECURITY.md` |
| Bug, error, logging, tests | `docs/DEBUGGING.md` |
| Setup, deploy, migrate, rollback, run/test/lint/build/check | `docs/RUNBOOK.md` |
| Planning | `docs/BACKLOG.md` |
| Official game rules (for engine/rules questions) | `docs/RULES.md` |
| A past decision | `docs/decisions/INDEX.md`, then only the relevant decision |
| Creating a doc, module, task, or decision | its template in `docs/_templates/` |
| Resuming after time away (> 1 day) | `docs/decisions/INDEX.md` + Recent_Changes in `STATE.md` |

A file in this table may not exist yet. Create it from its template only when there is real content for it.

## Task levels

Classify every task first. When unsure, go one level up.
- **L0 trivial** (rename, copy, style, obvious local fix): do it, run the relevant check.
- **L1 local** (one module: `shared`, `api`, or `client`): checkpoint, inspect, change, verify, run `check`.
- **L2 structural** (data model, auth, permissions, new dependency, API contract, migration, infra): checkpoint, state non-obvious assumptions and a plan with a verify step per step, wait for approval, create `docs/tasks/<slug>.md`, log a decision.

Checkpoint: the working tree is committed before you start. If it is not, ask.

## Change rules

- Smallest complete change: the whole behaviour, verified, nothing more.
- Touch only what the task needs. Match existing style. Report unrelated issues; do not fix them.
- Search the codebase for existing logic before writing new code. Reuse before creating.
- Files ≤ 300 lines, functions ≤ 30 lines. Split by responsibility, not by size, when a file exceeds the limit.
- No placeholder logic in production paths unless marked `# TEMP` with a reason.
- Several valid interpretations: ask. Never silently choose a stack, framework, database, hosting, auth, or payment provider.
- Keep the system understandable. Avoid premature abstraction. Prefer explicit over implicit.
- The game engine (`shared/`) stays pure and framework-agnostic — local, vs-bot, and online modes must keep calling the same functions.

## Security invariants

See `docs/SECURITY.md` for the full baseline. In short:
- Never read, print, or summarise secrets or `.env` values. Only `.env.example`/`client/.env.example` are committed.
- Validate every `/api/*` input; resolve the caller's seat from their verified Supabase JWT, never a client-supplied id.
- Never log secrets, tokens, hidden hands/grid state, or personal data.
- New dependency: check that an existing one does not suffice, verify the exact name exists and is maintained, then ask the user.
- Destructive operations (delete Supabase rows, force push, production deploy) need explicit user approval.

## Debugging invariants

See `docs/DEBUGGING.md` for the current (as-is) error/logging conventions. Reuse `logApp`/`logServer`/`logDb` (existing step-tagged logging for the connection flow) rather than ad hoc `console.*` calls when touching that flow.
- A bug fix in the engine starts with a failing test in `shared/src/*.test.ts` (existing discipline: `gameEngine.test.ts`, `gridFeasibility.test.ts`).
- Run `npm test`, `npx tsc --noEmit -p tsconfig.json`, `npm run build -w client` before declaring done.

## After each task

- `STATE.md`: replace Focus, Context, Next. Max 40 lines.
- `docs/BACKLOG.md`: move items.
- `docs/DATA_MODEL.md`: update whenever the shared-table usage or `GameState` shape changes.
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
| `docs/RULES.md` | Reference material (official game rules) — not an agent-editable doc. |

## Retired files (kept on disk, pending user confirmation to delete)

- `docs/TECH.md` — superseded by `docs/ARCHITECTURE.md`.
- `docs/DECISIONS.md` — superseded by `docs/decisions/*.md` + `docs/decisions/INDEX.md` (same content, split one-file-per-entry, verbatim).
- `CLAUDE.md`, `GEMINI.md`, `.cursor/rules/000-router.mdc` — thin routers, redundant now that `AGENTS.md` is read natively by current tools. A new `.gemini/settings.json` (config-based, not a router file) replaces `GEMINI.md`'s role for Gemini CLI.
