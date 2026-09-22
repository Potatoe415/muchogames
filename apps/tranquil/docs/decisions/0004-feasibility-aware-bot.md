# 0004 — Feasibility-aware bot

Date: 2026-06-04
Status: Accepted
Decision: Added `shared/src/gridFeasibility.ts` (segment-slack analysis) and reworked `botAI.ts` to be feasibility-driven and to use Sea Monsters to repair broken grids.
Context: The first greedy bot stalled at ~34/36 because it could create unfillable gaps (e.g. 42 next to 44 with two empty cells between — only 43 fits), which the engine's per-card placement check does not prevent.
Rationale: A run of k empty cells between two placed islands needs k strictly-increasing integers in the open value interval, so segment "slack" = valueSpan − cellSpan; negative slack = unwinnable. The bot now (1) never makes a placement that drives any segment infeasible, (2) prefers roomy placements while still minimising discards, (3) when the grid is already broken, plays a Sea Monster on the card whose removal best restores fillability, and (4) cycles via discard-two when only dead-end plays remain. Weights tuned by 500-game self-play sims (feasibility ≫ card cost ≫ tightness ≫ ideal-fit). Bot-vs-bot win rate rose ~3-4× (std ~7%→26%, monsters ~4%→6-17%). Still reads only its own hand + public grid.
Consequences: Two new shared modules + 5 feasibility tests (51 total). Bot is meaningfully stronger but still greedy (no multi-turn search). A rare engine-level start_discard deadlock (Start drawn when decks are nearly empty) is unchanged and out of scope.
Alternatives_Rejected: Heavier weighting of tight segments — self-play showed it backfires (bot wastes cards avoiding unavoidable endgame tightness). Full look-ahead search — out of scope.
