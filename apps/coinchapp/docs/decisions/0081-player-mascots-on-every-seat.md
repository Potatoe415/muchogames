# 0081 — Player mascots on every seat; bots keep the last-trick winner

Date: 2026-11-21
Status: Accepted
Decision: Each human seat shows the player's mascot (`lib/mascots.ts`, `public/mascots/`), from the hub's `?mascot=` or, failing that, a random one kept in localStorage (`coinchapp-mascot`). Online the id is stored per seat in `games.settings.playerMascots` (set by createGame/joinGame/joinBotSeat); ad-hoc P2P sends it in `hello`; local games use it for seat 0. All four tables show it on opponent badges (Coinche/Belote: bot profile art for bots) and in the "me" chip above the hand, in every mode. Separately, the Coinche bot search now scores a rollout as contract result + 0.15 x the team's share of card points, and the engine bot keeps a master trump for the last trick.
Context: Owner asked for the hub mascot to show in the card games for everyone, and noticed bots sometimes wasted their winning card instead of taking the dix de der.
Rationale: `settings` already carries per-seat data (`botProfiles`) and the join path already does a versioned write on the game row, so the mascot rides on it with no schema change (the coinchapp Supabase project was not reachable to add a column). A points tiebreak fixes the root cause (a decided contract made every move score the same) for every card, not just trumps.
Consequences: Replaces decision 0044's online-only hub photo chip. Rows created before this have no mascot (badge without art). A concurrent version conflict on join can drop that seat's mascot, same as the existing join conflict.
Alternatives_Rejected: A `game_players.mascot` column (needs a migration on a project not reachable here; cleaner if the owner wants it later). Hard-coding "keep the trump" only in the search (would not cover other last-trick winners).
