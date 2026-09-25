# STATE

Replace on every update. Max 40 lines. History lives in git and `docs/decisions/`.

Status: Finished matches in all 4 games can increment the hub profile when the player arrived with a hub `?profileCode=`.
Focus: Live-check that a signed-in hub launch records a win or loss on `/profile`. Needs `supabase/migrations/0003_profiles.sql` applied.
Level: L2

Context:
- Working_On: `lib/server/profileLink.ts`, `lib/client/profileSync.ts`, `lib/client/matchResultStats.ts`
- Relevant_Files: `docs/tasks/unified-profile-accounts.md`, root `api/profile/launch-code.js`
- Do_Not_Touch: `run.bat` (local Windows launcher, left untracked)
- Relevant_Decisions: 0055 (local combined win/loss counter)

Next:
- User applies `0003_profiles.sql` if it is not on `multigames-db` yet, and enables Google Auth there.
- Play one finished match launched from the hub and confirm `/profile` moves.
- Confirm `docs/PRODUCT.md` / `docs/ARCHITECTURE.md` / `docs/SECURITY.md` wording before editing them.

Open_Questions:
- La Bataille Corse's slap resolution trusts each client's self-reported `reactionMs` — accepted trade-off, no fix planned.
- Trusted-runner: host can see opponent-bot hands in mixed games — accepted trade-off, no fix planned.
- Should a permanently-bot-converted seat ever be reclaimable by its original human?
- A player who taps the screen every few seconds without ever playing can indefinitely dodge auto-play and bot conversion — accepted trade-off.
- Is a full endgame minimax solver for Bouilla worth building later?
- Duel mode never records match stats (no single "you" to attribute a win/loss to) — accepted trade-off.

Blockers:
- Shared profile writes fail until `0003_profiles.sql` is applied and Google is an Auth provider.

Recent_Changes:
- 2026-09-25 Agents commit and push with `scripts/ship.ps1` after every completed change, without waiting to be asked.
- 2026-09-24 Wins/losses from all 4 games also increment `muchogames_profiles` after a hub launch code.
- 2026-09-24 Président: a losing-2 finish shows a peach; bots spend twos before their last other card and pass rather than finish on them.
- 2026-09-24 Président: your own play slides in from your seat. Splash stamp `v0.6`.
