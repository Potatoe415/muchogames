# 0056 — Each card game lets the player pick its card back

Date: 2026-11-01
Status: Accepted
Decision: Bridge, Coinche, Belote, Bouilla, Président, Bataille corse and Solitaire show a row of five card backs on their home screen: Classique (the game's former back, default), Sorciers, Casino, Étoiles, Jardin. The choice is per game and per device, in `localStorage`. The four pictures live in `public/shared/card-backs/` and are copied to `apps/coinchapp/public/card-backs/` (coinchapp decision 0079). Bridge stores it as `back` in `bridge-settings`.
Context: Owner request (2026-11-01). The pictures were generated from one 2x2 sheet and cut with transparent corners.
Rationale: The back is cosmetic, so it never reaches the server or the other players and needs no schema. Coinchapp runs on another origin than the hub, so one choice cannot be shared with Bridge anyway; the owner picked one choice per game.
Consequences: A new back means one more `.webp` in both folders, one more id in Bridge's `CHOICES.back` and coinchapp's `CARD_BACKS`, and a label in each language. Memory keeps its own square backs.
Alternatives_Rejected: One choice shared by every Coinchapp game (owner chose per game). Serving the pictures to coinchapp from the hub's domain (a cross-site image dependency for a 260 KB asset set).
