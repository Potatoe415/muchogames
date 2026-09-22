# 0002 — Co-op bot (Play vs Bot)

Date: 2026-06-04
Status: Accepted
Decision: Added a client-side heuristic bot (`shared/src/botAI.ts`) that plays the second player co-operatively in a new "Play vs Bot" local mode.
Context: User wanted a single-player option where a bot partners with the human, without touching existing local/online modes.
Rationale: The game is deterministic and the full `GameState` already lives client-side in local mode, so a pure-function `chooseBotAction(state, idx)` in the shared engine reuses `computeLegalMoves`/`canDiscardTwo` with zero server/network changes. Bot turns are driven by a `setTimeout` effect in `App.tsx`; the human always views as player 0, so the existing online-style grid-diff preview shows the bot's move.
Consequences: Bot logic is greedy (minimise discard cost, ideal-value placement, keep Finish cards). It plays legally and fills ~34/36 but is not a strong solver — adequate as a co-op partner, not optimised for high solo win-rate. Adding stronger play would require search/look-ahead.
Alternatives_Rejected: Server-side bot — unnecessary for local mode and adds network/lifecycle complexity. Full search-based AI — out of scope for the request.
