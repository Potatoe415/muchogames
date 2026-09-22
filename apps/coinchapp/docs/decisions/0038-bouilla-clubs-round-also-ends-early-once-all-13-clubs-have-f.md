# 0038 — Bouilla "clubs" round also ends early, once all 13 clubs have fallen

Date: 2026-07-22
Status: Accepted
Decision: Added a `"clubs"` case to `roundDecidedEarly(round, tricks)` in `lib/bouilla/rounds.ts`, alongside the existing `"kingSpades"`/`"queens"` cases: the round ends the instant all 13 clubs have been played across any tricks (regardless of who wins them), not just when all 4 queens or the king of spades fall.
Context: User asked for the same early-stop behavior already in place for "queens" (all 4 fallen) and "kingSpades" (the instant it's captured), now for "clubs".
Rationale: Same reasoning as queens - once every counted card for the round has appeared, the outcome is fixed and further tricks are just busywork. Clubs can fall across several different tricks/seats just like queens, so the check sums `clubCount` across all of `state.tricks` so far, reusing the same helper already used by `trickPenalty`/`sweepWinner`.
Consequences: `state.tricks.length` for a finished "clubs" round can now also be `< 13`. `sweepWinner`'s existing "clubs" (`soleCollector`) still works unchanged on the shorter list. `applyPlay` (`lib/bouilla/trick.ts`) needed no change beyond its doc comment, since it already calls `roundDecidedEarly` generically. 1 new unit test in `rounds.test.ts` (121 total, all green); typecheck/lint/build unaffected (pre-existing unrelated lint issues untouched).
Alternatives_Rejected: None - this is a straight extension of the existing `roundDecidedEarly` pattern to a third round type, per the doc comment's own note that "a third such round... is one more `case` there, not a new inline check."
