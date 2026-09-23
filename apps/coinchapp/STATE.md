# STATE

Replace on every update. Max 40 lines. History lives in git and `docs/decisions/`.

Status: La Bataille Corse splash now shows `v0.2` next to the mode buttons plus a "Forcer le refresh" control that drops the service-worker cache and reloads from the network. Fourth game shipped end-to-end alongside Coinche, la Bouilla, and Président. Deployed on Vercel (project `coinchapp`, team `remiinsf-3156s-projects`).
Focus: Get explicit user confirmation to (a) delete the superseded `docs/TECH.md`, `docs/DECISIONS.md`, `CLAUDE.md`, `.cursor/rules/000-router.mdc`, and (b) update `docs/PRODUCT.md` Out_Of_Scope wording now that a wins/losses stat exists.
Level: L1

Context:
- Working_On: `app/bataillecorse/page.tsx`, `lib/client/forceUpdate.ts`
- Relevant_Files: `app/page.tsx`, `lib/client/i18n.tsx`
- Do_Not_Touch: `run.bat` (local Windows launcher, left untracked)
- Relevant_Decisions: `docs/decisions/INDEX.md` 0061 (face-to-face home button), 0063 (very-fast reflex)

Next:
- Ask the user to confirm deletion of the 4 superseded router/flat-doc files (see Focus).
- Ask the user to confirm the `docs/PRODUCT.md` Out_Of_Scope wording edit (see Focus).
- Resume verification backlog — see `docs/BACKLOG.md` Now (duel mode phone test, wins/losses stat, Bataille Corse/Président real-device tests).

Open_Questions:
- La Bataille Corse's slap resolution trusts each client's self-reported `reactionMs` — accepted trade-off, no fix planned.
- Trusted-runner: host can see opponent-bot hands in mixed games — accepted trade-off, no fix planned.
- Should a permanently-bot-converted seat ever be reclaimable by its original human?
- A player who taps the screen every few seconds without ever playing can indefinitely dodge auto-play and bot conversion — accepted trade-off.
- Is a full endgame minimax solver for Bouilla worth building later?
- Duel mode never records match stats (no single "you" to attribute a win/loss to) — accepted trade-off.

Blockers:
- None.

Recent_Changes:
- 2026-09-23 la Bataille Corse splash: bumped the on-screen version to `v0.2` (next to the mode buttons, readable) and added "Forcer le refresh" (`forceUpdate`) which clears Cache Storage, unregisters the service worker, and reloads with a cache-bust query. Shared helper also used by the app home "Actualiser" button.
- 2026-09-22 la Bataille Corse: "very fast" reflex level lowered from 800ms to 400ms; dedicated `MIN_BATAILLECORSE_BOT_THINK_MS` floor (400ms).
- 2026-09-22 la Bataille Corse duel table: player 2 stock clearance under the header; pile-flying slap guard.
- 2026-09-22 Bootstrap v10.1 alignment (docs/context-architecture only).
