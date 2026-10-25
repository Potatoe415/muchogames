# 0051 — Online rooms shared by Yatzy and Memory

Date: 2026-10-25
Status: Accepted
Decision: Memory plays online on Yatzy's room system. The room API becomes `api/rooms/*` with a `game_id` column and allowlist, and the browser client moves to `public/shared/js/online-room.js`, used by both games.
Context: Owner asked for two-player online Memory "with the same system as Yatzy", avoiding code duplication. The Yatzy server already stored an opaque JSON state behind two seat tokens, so only the room's owning game was missing.
Rationale: One function, one table, one client. `game_id` filters every read, update and delete, so a code is invisible to the other game. The legacy `/api/yatsy/games/*` URLs are rewritten to the new function, so cached Yatzy clients keep working. The generic parts of `yatsy/session.js` (seat storage, share link, `?game=` link, one coin per room, chained writes) moved into the shared client instead of being copied into Memory. Each device publishes the whole board after its own move, like Yatzy; the receiving side validates it with the same checks as a local save.
Consequences: Migration 0009 must run before the deploy. A new online game needs its id in `ROOM_GAMES` (`api/_lib/rooms.js`) and its own state shape and validation. Codes are unique across games (17,576 codes, 3h TTL). Tables keep their `yatzy_` names. The Yatzy service worker was bumped to v43.
Alternatives_Rejected: A Memory-only copy of the API and client (the duplication the owner ruled out). New `rooms` tables (a coordinated rename for no behavior gain). Replaying moves instead of full-board sync (more ordering cases for a board this small). Keeping a room for a rematch (owner chose a new room, as in Yatzy).
