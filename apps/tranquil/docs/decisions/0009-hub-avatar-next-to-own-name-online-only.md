# 0009 — Hub avatar next to own name, online only

Date: 2026-09-06
Status: Accepted
Decision: Online `GameBoard` shows the Bergamots hub `?avatar=` thumb (if present) as a small circle next to `{me.name} (you)`. Local pass-and-play and bot games do not receive the prop. The image is session-only (`sessionStorage`) and is not shown next to the opponent's name.
Context: Bergamots now forwards a tiny JPEG as `?avatar=` so the player can see their profile photo next to their name in online multiplayer. See bergamots `docs/DECISIONS.md` 2026-09-06 (tiny avatar thumb).
Rationale: Same launch-URL channel as `?name=`. Passing `selfAvatar` only on the `mode === 'online'` `GameBoard` is the smallest gate. No schema/API change.
Consequences: A direct visit with no `?avatar=` looks exactly as before. `docs/PRODUCT.md` / `docs/TECH.md` were not edited autonomously.
Alternatives_Rejected: Showing the photo in local/bot modes too — rejected, user asked for online only. Syncing avatars through game state so the opponent can see them — rejected, not asked for.
