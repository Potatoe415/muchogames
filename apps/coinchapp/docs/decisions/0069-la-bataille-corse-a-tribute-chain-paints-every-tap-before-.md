# 0069 — La Bataille Corse: a tribute chain paints every tap before the server answers

Date: 2026-09-27
Status: Accepted
Decision: While a seat owes a tribute, online (and ad-hoc) flips queue on the tapping client. Each tap immediately shows that card's real face, shrinks the stock, and counts down the attempts still owed. The existing `flipCard` calls then run one after another. The chain stops locally at the first card that would pass the turn, open a slap, or fail the tribute.
Context: Paying a jack/queen/king/ace means flipping several cards in a row. `useOptimisticFlip` held a lock until each server round trip finished, so the stock button stayed disabled between cards. Local play never had that wait.
Rationale: The faces have to be known before the first response, or cards 2+ would still appear late. `PlayerView.myNextCards` is that seat's own next cards, capped at the attempts they already owe (at most an ace's 4). They must play them in order, so seeing them does not add a choice. The opponent's stock order stays hidden. Submitting the existing one-card `flipCard` in series keeps the server the authority; a rejected flip drops the optimistic tail.
Consequences: `myTopCard` remains the first of `myNextCards`. A normal turn still queues a single card. Duel/local use the same hook; their flips are already synchronous, so the queue just paints and then reconciles. No schema change.
Alternatives_Rejected: Leaving the button disabled until each response (the lag being fixed). Showing card backs for every tap after the first (still feels like waiting, and decision 0059 already rejected that for the first card). A new multi-card server action (the client can sequence the action that already exists).
