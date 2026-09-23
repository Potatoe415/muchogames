# STATE

Replace on every update. Max 40 lines. History lives in git and `docs/decisions/`.

Status: La Bataille Corse tribute prompt sits under the opponent's deck when they must answer a figure; your own "Jouez N carte" stays in the centre. Splash shows `v0.7`. Deployed on Vercel (project `coinchapp`, team `remiinsf-3156s-projects`).
Focus: Get explicit user confirmation to (a) delete the superseded `docs/TECH.md`, `docs/DECISIONS.md`, `CLAUDE.md`, `.cursor/rules/000-router.mdc`, and (b) update `docs/PRODUCT.md` Out_Of_Scope wording now that a wins/losses stat exists.
Level: L1

Context:
- Working_On: `components/BataillecorseTable.tsx`, `components/BataillecorseDuelTable.tsx`
- Relevant_Files: `components/BataillecorseDuelCenter.tsx`, `lib/client/i18n.tsx`
- Do_Not_Touch: `run.bat` (local Windows launcher, left untracked)
- Relevant_Decisions: `docs/decisions/INDEX.md` 0058 (reaction times above own deck)

Next:
- Ask the user to confirm deletion of the 4 superseded router/flat-doc files (see Focus).
- Ask the user to confirm the `docs/PRODUCT.md` Out_Of_Scope wording edit (see Focus).
- Resume verification backlog — see `docs/BACKLOG.md` Now.

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
- 2026-09-23 la Bataille Corse: opponent tribute prompt ("Jouez N carte") is under their deck; yours stays centred (`v0.7`).
- 2026-09-23 la Bataille Corse: white "Jouez N carte" when you answer a figure (`v0.6`); reaction times 2x above turn-circle (`v0.5`).
- 2026-09-22 la Bataille Corse: very-fast reflex 400ms; duel player 2 stock under header; pile-flying slap guard.
- 2026-09-22 Bootstrap v10.1 alignment (docs/context-architecture only).
