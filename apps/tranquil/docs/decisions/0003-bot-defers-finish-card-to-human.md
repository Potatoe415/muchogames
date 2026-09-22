# 0003 — Bot defers finish card to human

Date: 2026-06-06
Status: Accepted
Decision: `chooseBotAction` now skips playing the finish card if the human player holds one and the bot can discard-two instead.
Context: When the grid became complete on the bot's turn, the bot immediately played its finish card (and monsters in finish_pending), ending the game with zero human interaction. The user experienced the "last few cards" being auto-played.
Rationale: The finish card is the climactic win moment. If the human holds one it's fair to let them trigger it; the bot yields by discarding-two. If the human has no finish card the bot still plays its own (necessary to make progress).
Consequences: In rare cases where the human never plays their finish card the bot will keep deferring, but the finish card is highlighted as playable so the human will naturally click it. Deadlock is not possible.
Alternatives_Rejected: Always block the bot from finishing — would deadlock when the human also has no finish card. Confirmation dialog before human plays finish card — heavier UX change, fix lives in the wrong layer.
