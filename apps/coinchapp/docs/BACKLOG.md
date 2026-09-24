# BACKLOG

Status: Living document. Always reflects current state.
`Done` section dropped and `Later` merged into `Next` on 2026-09-22 (bootstrap v10.1 upgrade — see `docs/decisions/INDEX.md`).

---

## Now
- [ ] Provision Supabase project, run `supabase/migrations/0001_init.sql`, enable anonymous sign-ins. (Skip if already done in this environment — verify via `docs/RUNBOOK.md` Troubleshooting first.)
- [ ] Push to GitHub and deploy on Vercel with the 4 env vars; verify a full game in prod. (Already deployed per `STATE.md` — re-verify only if this item looks stale.)
- [ ] Ask the user to try the new duel mode (la Bataille Corse, face-to-face) on a real phone (2 people, one on each side) — confirm the rotated corner is comfortable to read and the top/bottom slap zones feel natural.
- [ ] Ask the user to confirm the `docs/PRODUCT.md` Out_Of_Scope wording edit before touching it (see `STATE.md` Focus).
- [ ] Ask the user to sanity-check the wins/losses stat live: play a full match to completion in each of the 4 games, confirm the counter increments in `HomeTopBar`'s settings panel on `/`, `/coinche`, `/bouilla`, `/president`, `/bataillecorse`.
- [ ] Fix the unrelated pre-existing `lib/client/useMatchStats.ts:220` `react-hooks/set-state-in-effect` lint error (flagged, not fixed — out of scope) if a future pass touches that file.
- [ ] Real-device test (2 phones, actual network) of la Bataille Corse online + ad-hoc: confirm the pile-fly sweep reaches each deck at the slower pace, both reaction readouts sit correctly for 5s, the winner's deck fire glow reads well, and the tribute banner is clear.
- [ ] Real-device test of Président (solo, online, ad-hoc): closing a square should play-enter the last combo then fly the pile toward that seat; winning the pile by passes should fly the cards toward the leader — not vanish.
- [ ] Real 2-device test of Président online — confirm the instant combo-play feedback feels right with real network latency, now that online bots actually work.

## Next
- [ ] Manual Belote/Rebelote announcement during play (currently auto-detected).
- [ ] Smarter bot bidding/play (currently a greedy heuristic).
- [ ] Ad-hoc P2P: real-device pairing test (Chrome mDNS `.local` risk), client reconnection, emoji/GIF over the data channel.
- [ ] Generalize `useP2PHost.ts`/`useP2PBouillaHost.ts`/`useP2PPresidentHost.ts`/`useP2PBataillecorseHost.ts` (now 4 parallel host files, never generalized even at N=3 — accepted trade-off, see `docs/decisions/INDEX.md`).
- [ ] La Bataille Corse: real 2-device online/ad-hoc reflex-race test (only smoke-tested solo via one browser so far).
- [ ] Optional accounts + stats/leaderboard.
- [ ] Rule variants and table chat.
- [ ] Add a single combined `check` script to `package.json` (test + typecheck + lint + build) — see `docs/DEBUGGING.md`.
- [ ] No secret-scanning tool or dependency-audit step configured — see `docs/SECURITY.md`.

## Blocked
- [ ] Prod verification blocked on user's Supabase + Vercel + GitHub setup (re-verify whether still true — much of this shipped since the item was written).
