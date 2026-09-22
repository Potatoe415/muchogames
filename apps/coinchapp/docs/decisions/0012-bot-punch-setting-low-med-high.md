# 0012 — Bot punch setting (low/med/high)

Date: 2026-06-10
Status: Accepted
Decision: Added a pre-game "bot level" (punch) setting with three levels exposed as a slider in GameSettingsPanel. It maps to the bid heuristic''s partner-contribution: low=20, med=26 (default), high=32 (PUNCH_CONTRIBUTION in lib/coinche/bot.ts). decideBid takes an optional partnerContribution; the client bot reads BotOptions.punch; useBotWorker(punch) applies it on the main-thread bidding path (bidding never uses the worker). Local threads it via URL param -> LocalGame -> useLocalGame; online stores it in games.settings.botPunch and the host reads it from GameView.settings in useBotRunner. botPunch is bot config, not a scoring rule, so it is NOT passed to createInitialState/GameState.
Context: User wanted to choose bot aggressiveness before starting; the single PARTNER_CONTRIBUTION constant only allowed one fixed level.
Rationale: Punch only affects bidding, which runs on the main thread, so no worker/protocol change was needed. Storing it in settings (not GameState) keeps the pure engine unchanged and reuses the existing settings plumbing (sanitizeSettings validates against BOT_PUNCH_LEVELS, defaults "med"). Values come from the earlier 4000-deal sweep (contractRate/avgValue): 20->91%/88, 26->99%/92.5, 32->100%/98.
Consequences: games.settings jsonb gains an optional botPunch key (no migration; absent = "med"). The setting is read by whichever client runs the bots (host online, the single client locally).
Alternatives_Rejected: A numeric slider over raw contribution (leaks an internal constant, harder to label); adding botPunch to GameState (pollutes the pure engine and every state-build path for a pure UI/bot knob).
