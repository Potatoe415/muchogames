# STATE

Replace on every update. Max 40 lines. History lives in git and `docs/decisions/`.

Status: Bootstrap v10.1 alignment applied 2026-09-22 (part of a repo-wide pass covering root `muchogames` + this app + `apps/tranquil`, all in one session on `main`). `docs/DECISIONS.md` split into `docs/decisions/*.md` + `INDEX.md` (61 decisions, verbatim). New `docs/ARCHITECTURE.md` (merged from `docs/TECH.md`), `docs/SECURITY.md`, `docs/DEBUGGING.md`. `docs/TECH.md`/`docs/DECISIONS.md`/`CLAUDE.md`/`.cursor/rules/000-router.mdc` kept on disk, superseded, pending user confirmation to delete. Product-wise: fourth game "la Bataille Corse" shipped end-to-end alongside Coinche, la Bouilla, and Président; all four share a full-viewport `TableShell`. Deployed on Vercel (project `coinchapp`, team `remiinsf-3156s-projects`).
Focus: Get explicit user confirmation to (a) delete the superseded `docs/TECH.md`, `docs/DECISIONS.md`, `CLAUDE.md`, `.cursor/rules/000-router.mdc`, and (b) update `docs/PRODUCT.md` Out_Of_Scope wording now that a wins/losses stat exists.
Level: L2

Context:
- Working_On: `AGENTS.md`, `STATE.md`, `docs/ARCHITECTURE.md`, `docs/SECURITY.md`, `docs/DEBUGGING.md`, `docs/decisions/`, `docs/BACKLOG.md`
- Relevant_Files: `docs/decisions/INDEX.md`
- Do_Not_Touch: no source code was touched by this alignment pass (docs/context-architecture only)
- Relevant_Decisions: `docs/decisions/INDEX.md` 0001 (original bootstrap), 0062 (this v10.1 alignment)

Next:
- Ask the user to confirm deletion of the 4 superseded router/flat-doc files (see Focus).
- Ask the user to confirm the `docs/PRODUCT.md` Out_Of_Scope wording edit (see Focus).
- Resume the pre-existing verification backlog — see `docs/BACKLOG.md` Now (duel mode phone test, wins/losses stat sanity check, Bataille Corse/Président real-device tests) — none of it was touched by this alignment pass.

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
- 2026-09-22 la Bataille Corse duel table: player 2's corner was only `top-6` from the top, inside the absolute `z-30` header's clickable band — taps on their stock sometimes hit the header instead of registering as a flip. Matched the vs-bot table's existing `top-[calc(var(--table-hud-top)+3.5rem)]` clearance.
- 2026-09-22 la Bataille Corse (both vs-bot and duel tables): the pile/slap button is now also disabled while the pile-win sweep animation (`pileFlying`) is in flight, not just when `phase !== "playing"` — stops a tap landing mid-sweep from firing a spurious `onSlap`.
- 2026-09-22 Bootstrap v10.1 alignment (context architecture only, no code touched): split `docs/DECISIONS.md` into `docs/decisions/*.md`+`INDEX.md`; added `docs/ARCHITECTURE.md`/`docs/SECURITY.md`/`docs/DEBUGGING.md`/`docs/_templates/`/`.claude/settings.json`; rewrote `AGENTS.md`/`STATE.md`; condensed `docs/BACKLOG.md`. Same pass applied to root `muchogames` and `apps/tranquil`.
- 2026-09-21 la Bataille Corse: fixed 3 bugs — missing played card on an immediate tribute-failure sweep, the plain-flip landing bounce, and false slaps never being penalized again after the match's first slap window closed.
- 2026-09-21 la Bataille Corse: face-to-face 1v1 duel mode (same device, 2 real humans) via a home-screen button — seat 1's corner rotated 180deg, shared pile split into top/bottom slap zones.
- 2026-09-21 la Bataille Corse: own online flip paints the real face immediately (`PlayerView.myTopCard` + `flushSync`).
- 2026-09-18 la Bataille Corse: false slap awards the whole pile to the opponent and flashes a red WRONG cross.
