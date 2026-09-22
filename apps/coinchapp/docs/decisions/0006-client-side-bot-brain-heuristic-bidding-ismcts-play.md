# 0006 — Client-side bot brain (heuristic bidding + ISMCTS play)

Date: 2026-06-09
Status: Accepted
Decision: Add a browser-side bot brain in `lib/client/bot.ts` (+ `lib/client/botSim.ts`) that decides moves from the redacted `PlayerView` and is submitted through the normal Server Action path; bidding uses fast heuristics, play uses time-boxed determinized ISMCTS (800 ms / 2000 iterations).
Context: User wants bot AI to run 100% client-side to keep the serverless backend free of heavy computation, while the server stays authoritative (it still validates every move).
Rationale: ISMCTS on the client offloads CPU from Vercel functions; running from the redacted view (no opponent hands) keeps the determinization honest and the server the single authority.
Consequences: `PlayerView` now exposes completed `tricks` (public info) so the client can determinize correctly. Two bot paths now exist: the server-side `lib/coinche/bot.ts` (used by `advanceBots`) and the new client brain. TECH.md still states "Bots run server-side" - needs user confirmation to reconcile.
Alternatives_Rejected: Server-side ISMCTS (heavy CPU in serverless, slower turns); replacing the server bot outright (out of scope, would break the offline `useLocalGame` flow).
