# 0008 — Single bot level (no difficulty choice)

Date: 2026-06-10
Status: Accepted
Decision: Removed the bot difficulty feature entirely. There is now one bot strategy (the former "hard"/"medium" smart play: cheapest winning card, else weakest discard). Dropped the `Difficulty` type, `chooseCard`/`advanceBots` difficulty params, the `easy` random branch, `GameSettings.botDifficulty`, the setup-screen selectors and `difficultyLabel`.
Context: User wants a single bot level equivalent to the current hardest, with no way to choose the level.
Rationale: `medium` and `hard` were already identical in code; only `easy` differed (random). One level keeps the engine/UI simpler and matches the product directive.
Consequences: `GameSettings` no longer carries `botDifficulty` (existing game rows keep a harmless stale key in their `settings` jsonb). The home link and local URL no longer pass a difficulty param.
Alternatives_Rejected: Hardcoding difficulty to "hard" while keeping the type/UI (leaves dead `easy` branch and a constant setting).
