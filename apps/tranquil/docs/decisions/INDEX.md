# DECISIONS INDEX

One line per decision. Read this file, then open only the relevant decision.
Decision files are append-only. To change a decision, add a new one that supersedes it.
Template: `docs/_templates/DECISION.md`.

| # | Date | Title | Status |
|---|---|---|---|
| 0001 | 2026-06-03 | Bootstrap | Accepted |
| 0002 | 2026-06-04 | Co-op bot (Play vs Bot) | Accepted |
| 0003 | 2026-06-06 | Bot defers finish card to human | Accepted |
| 0004 | 2026-06-04 | Feasibility-aware bot | Accepted |
| 0005 | 2026-08-03 | Railway/Socket.IO → Supabase (shared project) + Vercel Functions | Accepted |
| 0006 | 2026-09-06 | Mobile board height: JS-measured `var(--app-height)` on a normal-flow element, never `position: fixed` | Accepted |
| 0007 | 2026-09-06 | Corrected diagnosis: the mobile hand bug is horizontal, not vertical | Accepted |
| 0008 | 2026-09-06 | Pre-fill the pseudo fields from the Bergamots hub's profile name | Accepted |
| 0009 | 2026-09-06 | Hub avatar next to own name, online only | Accepted |
| 0010 | 2026-09-17 | Win/loss counter, client-only, own `SettingsPanel` | Accepted |
| 0011 | 2026-09-22 | Bootstrap v10.1 context architecture alignment | Accepted |

## When to log a decision
Any of:
- Locks in a technology, library, or vendor.
- Changes the data model, data ownership, or access model.
- Changes module boundaries or dependency directions.
- Cannot be reversed in under 30 minutes.
- Contradicts or supersedes an earlier decision.

If unsure, add an Open_Question to `STATE.md` instead.
