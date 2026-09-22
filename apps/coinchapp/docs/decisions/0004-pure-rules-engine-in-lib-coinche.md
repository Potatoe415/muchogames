# 0004 — Pure rules engine in lib/coinche

Date: 2026-06-09
Status: Accepted
Decision: Implement all Coinche rules as a framework-agnostic, pure TypeScript module under `lib/coinche`, unit-tested with Vitest.
Context: Rules are complex (orders, bidding, cutting, scoring, capot, belote) and must be reliable.
Rationale: Purity makes the rules testable in isolation and reusable by both server and bots.
Consequences: The engine has no Supabase/Next imports; the server adapts it. Bots also live here and are driven server-side.
Alternatives_Rejected: Embedding rules inside Server Actions (untestable, mixed responsibilities).
