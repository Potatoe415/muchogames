# STATE

Replace on every update. Max 40 lines. History lives in git and `docs/decisions/`.

Status: Every match now spends one hub coin (decision 0071, root `docs/PLATFORM_RULES.md`): `TableShell` → `MatchGate` → Server Action `startMatchCoin`. Back/options use the platform `data-id`s; back during a match asks "Quitter la partie ?".
Focus: n/a (task complete on this side)
Level: L2 (cross-app, part of the root task `docs/tasks/platform-common-rules.md`)

Context:
- Working_On: n/a
- Relevant_Files: `components/MatchGate.tsx`, `components/TableShell.tsx`, `lib/client/matchCoin.ts`, `lib/server/actions-match.ts`, `lib/server/profileLink.ts`
- Do_Not_Touch: `run.bat` (local Windows launcher, left untracked)
- Relevant_Decisions: 0071 (this), 0070 (per-game results), 0055 (combined counter)

Next:
- Owner: set `ADMIN_USER_IDS` on the `coinchapp` Vercel project (Production + Preview), same value as the hub, then redeploy — otherwise the admin pays like everyone.
- After the hub's `0008_match_coins.sql` runs: launch a game from the hub, play a match, check the hub badge drops; finish an online match and rematch, both players should pay again.
- Move to `cartes.muchogames.win` once the owner approves adding the domain (root BACKLOG).

Open_Questions:
- La Bataille Corse's slap resolution trusts each client's self-reported `reactionMs` — accepted trade-off, no fix planned.
- Trusted-runner: host can see opponent-bot hands in mixed games — accepted trade-off, no fix planned.
- Should a permanently-bot-converted seat ever be reclaimable by its original human?
- A player who taps the screen every few seconds without ever playing can indefinitely dodge auto-play and bot conversion — accepted trade-off.
- Is a full endgame minimax solver for Bouilla worth building later?
- Duel mode never records match stats (no single "you" to attribute a win/loss to) — accepted trade-off.

Blockers: none.

Recent_Changes:
- 2026-10-03 Per-match hub coins + platform chrome `data-id`s (decision 0071). `npm test` 321/321, `tsc --noEmit` clean, changed files lint clean, `npm run build` clean. Verified locally: hub `?mgDevice=` captured, local match marked paid (fail-open, no env), back → "Quitter la partie ?" → Continuer stays.
- 2026-10-02 `HomeTopBar` settings panel: "Signaler un problème" link (`home-settings-feedback-link`).
- 2026-10-02 Per-game hub profile sync (decision 0070).
- 2026-09-27 La Bataille Corse (decision 0069): online tribute flips no longer wait on the server between cards.
