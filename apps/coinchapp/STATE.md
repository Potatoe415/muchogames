# STATE

Replace on every update. Max 40 lines. History lives in git and `docs/decisions/`.

Status: Wins/losses now record correctly across repeated local/ad-hoc matches in the same browser tab.
Focus: None open - last fix (below) was reported live by the user and verified end-to-end.
Level: L1

Context:
- Working_On: n/a (task complete)
- Relevant_Files: `lib/client/useLocal*Game.ts` (4 games), `lib/client/useP2P*Host.ts` (4 games), `lib/client/p2p/protocol.ts`
- Do_Not_Touch: `run.bat` (local Windows launcher, left untracked)
- Relevant_Decisions: none for this fix (L1, mechanical)

Next:
- Play one finished match launched from the hub and confirm `/profile` moves, now that the `gameId` fix is live.
- Confirm `docs/PRODUCT.md` / `docs/ARCHITECTURE.md` / `docs/SECURITY.md` wording before editing them.

Open_Questions:
- La Bataille Corse's slap resolution trusts each client's self-reported `reactionMs` — accepted trade-off, no fix planned.
- Trusted-runner: host can see opponent-bot hands in mixed games — accepted trade-off, no fix planned.
- Should a permanently-bot-converted seat ever be reclaimable by its original human?
- A player who taps the screen every few seconds without ever playing can indefinitely dodge auto-play and bot conversion — accepted trade-off.
- Is a full endgame minimax solver for Bouilla worth building later?
- Duel mode never records match stats (no single "you" to attribute a win/loss to) — accepted trade-off.

Blockers: none currently known — user confirmed (2026-09-25) `0003_profiles.sql` is applied and Google Auth is enabled on `multigames-db`.

Recent_Changes:
- 2026-09-25 Fixed a cross-game stats bug: every local/ad-hoc match used a hardcoded `gameId` ("local"/"adhoc"), so `useRecordMatchResult`'s once-per-match `sessionStorage` dedup guard silently blocked recording every match after the first one in a browser tab (win or loss, any of the 4 games). `gameId` is now derived from the match's own `seed` (local) or `` `adhoc-${seed}` `` (ad-hoc host hooks) - genuinely unique per match. Found while investigating a user report that finishing last in Président wasn't counted as a loss.
- 2026-09-25 Président: removed the hand sort-order toggle button; hand always sorts by rank.
- 2026-09-25 Back controls return to the games hub. They no longer open this app's root.
- 2026-09-24 Wins/losses from all 4 games also increment `muchogames_profiles` after a hub launch code.
