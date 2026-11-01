# 0077 — Solitaire: a double tap sends a card to its foundation

Date: 2026-11-01
Status: Accepted
Decision: Two taps (or clicks) on the same card within 400 ms send it onto its own foundation when that move is legal, even when it could also go on a column.
Context: Owner request: a card that can climb to the top-right foundations should get there with one double click instead of tap, then tap the foundation.
Rationale: An explicit player gesture, so the "no auto-move" rule of 0073 still holds. Detected in `useLocalSolitaireGame` from two `onTap` calls rather than the `dblclick` event, so mouse, touch and TV pointer behave the same. The first tap still lights the card as usual.
Consequences: `lib/solitaire` exports `moveToFoundation` (also used by the Ace rule of 0074) and `samePileRef`. A double tap only counts when the first tap moved nothing.
Alternatives_Rejected: The native `dblclick` event: unreliable on touch screens. Sending every legal card up on a single tap: rejected by 0073.
