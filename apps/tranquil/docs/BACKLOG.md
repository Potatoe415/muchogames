# BACKLOG

Status: Living document. Always reflects current state.
`Done` section dropped and `Later` merged into `Next` on 2026-09-22 (bootstrap v10.1 upgrade — see `docs/decisions/INDEX.md`).

---

## Now
- [ ] Fill in real Supabase env vars (`.env.local`, `client/.env.local`, Vercel dashboard) — see `docs/RUNBOOK.md`. (Skip if already done in this environment.)
- [ ] Play-test online mode end-to-end on the Supabase/Vercel backend (two browser windows: create/join room, play, reload mid-game, seat-takeover after 30s idle).
- [ ] Play-test "Play vs Bot" mode end-to-end.
- [ ] Play-test local pass-and-play end-to-end.
- [ ] Ask the user to sanity-check the win/loss counter: play a local game to a win and to a loss, confirm both increment in `SettingsPanel` (from `Lobby` and from in-game).
- [ ] Play a full local game to a Finish-card win to sanity-check win-flourish timing/position on a real board (only checked in isolation so far).
- [ ] Carried over, pending post-deploy verification: invite-link `?room=` only + partner not inheriting host name/avatar; Bergamots-hub avatar next to own name; friend re-test of the mobile hand on a real iPhone.

## Next
- [ ] Fill `docs/PRODUCT.md` with confirmed scope (currently all "TBD").
- [ ] Mobile layout polish (card sizes on small screens).
- [ ] Add score/stats summary on game-over screen.
- [ ] Stormy Seas expansion (Section 6 of `docs/RULES.md`) — Jagged Rocks, Sea Monsters, Storm & Compass.
- [ ] Idle-turn timer / bot-takeover for online mode (coinchapp already has this pattern) — only if disconnections prove to be a real problem.
- [ ] Competitive variant (`docs/RULES.md` Section 7.5).
- [ ] Persistent high scores / session history.
- [ ] Card artwork assets (replace CSS gradients).
- [ ] Add a single combined `check` script (test + typecheck + build) — see `docs/DEBUGGING.md`.
- [ ] Confirm/add a formatter and linter config — none is currently enforced (see `docs/ARCHITECTURE.md` Conventions).
- [ ] No secret-scanning tool or dependency-audit step configured — see `docs/SECURITY.md`.
- [ ] `api/join.ts`'s create-then-insert-seat race under simultaneous requests for the same room code (see `docs/SECURITY.md`) — revisit if it causes real issues.

## Blocked
- None.
