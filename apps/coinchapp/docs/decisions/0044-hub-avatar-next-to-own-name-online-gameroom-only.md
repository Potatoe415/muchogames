# 0044 — Hub avatar next to own name, online GameRoom only

Date: 2026-09-06
Status: Accepted
Decision: Online Coinche and Bouilla (`GameRoom` only) show a compact chip above the local player's hand: the Bergamots hub `?avatar=` thumb (if present) plus that seat's display name. Local solo and ad-hoc P2P do not get the chip. The image is not stored in Postgres and is not shown on opponent badges.
Context: Bergamots now forwards a tiny JPEG as `?avatar=` (alongside the existing `?name=`) so the player can see their profile photo next to their name in online multiplayer. See bergamots `docs/DECISIONS.md` 2026-09-06 (tiny avatar thumb).
Rationale: `hubName.ts` already captured `?name=` into `sessionStorage` because Play Online drops the query string; the avatar uses the same capture/read path with a `data:image/` + length guard. Passing `selfAvatar` only from `GameRoom` (not `LocalGame` / P2P hosts) is the smallest online-only gate. A dedicated `SelfNameChip` avoids stuffing a photo into the opponent `PlayerBadge`.
Consequences: No schema/API change. A player who opens this app without `?avatar=` sees the name chip without a photo. `docs/PRODUCT.md` / `docs/TECH.md` were not edited autonomously.
Alternatives_Rejected: Adding an `avatar` column on `game_players` so opponents could see it too — rejected, user asked only for their own photo, and it would be a data-model change. Putting the 50 KB profile JPEG in the URL — rejected as too large; Bergamots sends a ~48 px thumb.
