# 0059 — La Bataille Corse: own flip paints the real face on the same frame

Date: 2026-09-21
Status: Accepted
Decision: The acting seat's redacted view includes `myTopCard` (their stock top only). Online/ad-hoc flip uses that card to land face-up on the center pile on the same tap frame, then reconciles with the server. `useInstantPending` commits via `flushSync` and queues the Server Action on a microtask — React 19 otherwise holds any `useState` in that click until the action returns, which is why a face-down placeholder still looked like lag.
Context: User asked again that an online Bataille Corse flip feel immediate, like local play. A previous optimistic flip showed only a card-back and still waited on the Server Action before painting.
Rationale: Coinche/Bouilla already paint a known card immediately. The owner knowing their own next card is enough to do the same here; the opponent's stock order stays hidden, and `myTopCard` is never rendered on the stock. Confirming the pending flip by pile/stock/`lastPileWin` (not by `view.turn`) is required because tribute keeps the same seat.
Consequences: `PlayerView.myTopCard` is a new per-seat view field (not persisted). Opponents never receive it. A determined client can read their own next card from the payload — same class of self-peek as looking at React state, not a leak to the other player.
Alternatives_Rejected: Face-down placeholder until `getView` (rejected - the face wait is still the server round trip the user feels). `useOptimistic` inside `startTransition` around the Server Action (rejected - did not paint on tap). Showing the whole own stock (rejected - more information than the tap needs).
