# 0047 — Président: a "2" burns the pile; `lastBurn` display cue on GameState

Date: 2026-09-11
Status: Accepted
Decision: Playing a "2" as a single, pair, or triple immediately burns the pile (`pile` cleared, same seat leads again). A new `GameState.lastBurn: { seat, combo } | null` field (also on `PlayerView`) is a display-only cue so the table can play the shared collect-and-fly animation toward that seat. A quad "2" still only toggles revolution. Burning your last card does not re-trigger a lead (normal finish flow).
Context: User asked for the common house rule that a 2 (or several 2s) cannot be beaten, so the pile should vanish and the same player lead again, with the existing trick-collect animation reused toward the burning seat.
Rationale: Encoding the burn in `applyPlay` keeps the rule in the pure engine (tested) rather than a client-only shortcut. `lastBurn` is never read by rules; clients detect a *new* burn by diffing seat + card identity against the previous view, so it does not need to be cleared on the next unrelated action.
Consequences: Président `games.state` jsonb now includes `lastBurn` (null after deal / next round / end of exchange). Pile-burn pacing uses the same `didCollectTrick` / 1500ms collect delay as emptying a hand. No SQL migration (`state` is opaque jsonb).
Alternatives_Rejected: Treating a 2 as an unbeatable pile combo that still waits for three passes (would match the existing pass-streak model but not the requested "instant burn, same seat leads"); a client-only animation with no engine change (bots and online peers would not share the rule).
