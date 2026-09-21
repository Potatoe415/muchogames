# STATE

Rule: Replace content on every update. Never append history here. Max 60 lines.
History lives in `docs/DECISIONS.md` (decisions) and `docs/BACKLOG.md` (tasks).

---

Status: Fourth game "la Bataille Corse" shipped end-to-end alongside Coinche, la Bouilla, and Président. All four tables now share a full-viewport `TableShell` (no 460×720 phone column): cards keep a 2:3 ratio and grow with `svmin` from phone floor (64px `lg`) up to a 7rem cap. Deployed on Vercel (project `coinchapp`, team `remiinsf-3156s-projects`).
Current_Goal: Done - la Bataille Corse now has a face-to-face 1v1 duel mode (2 real humans, same device, seat 1's corner rotated 180deg), with its own home-screen button.
Last_Action: Added the duel mode toggle to `/local`'s setup screen (bataillecorse only), new `useLocalBataillecorseDuelGame`/`BataillecorseDuelTable`/`BataillecorseDuelCenter`, exported reusable pieces from `BataillecorseTable.tsx`; a 4th home-screen button "Jouer face à face" (first, above "Jouer en local") routing to `/local?game=bataillecorse&mode=duel`, presetting the toggle; and a discreet hardcoded `V0.0.1` build label at the very bottom of la Bataille Corse's own splash screen only (`BATAILLECORSE_VERSION` in `app/bataillecorse/page.tsx`, unrelated to the app-wide `NEXT_PUBLIC_APP_VERSION` on `/`). Verified live (browser): both seats' own stock flips correctly attributed, tribute chain across seats, false-slap penalty attributed to the tapping seat with the pile flying to the other, reset/settings panel, vs-bot mode unaffected, new home button correctly presets the duel toggle, version label renders at the true bottom edge. `npm test` 248/248, `npm run build`, `npm run lint` clean (same pre-existing baseline issues only).
Next_Actions:
- Ask the user to try the new duel mode on a real phone (2 people, one on each side) to confirm the rotated corner is actually comfortable to read and the top/bottom slap zones feel natural to reach.
- Ask the user to confirm the `docs/PRODUCT.md` Out_Of_Scope wording edit before touching it.
- Ask the user to sanity-check the new stats live: play a full match to completion in each of the 4 games, confirm the counter increments correctly in `HomeTopBar`'s settings panel on `/`, `/coinche`, `/bouilla`, `/president`, `/bataillecorse`.
- Fix the unrelated pre-existing `useMatchStats.ts` lint error (flagged, not fixed, since it's out of scope for this change) if a future pass touches that file.
- Real-device test (2 phones, actual network) of la Bataille Corse online + ad-hoc: confirm the pile-fly sweep now visibly reaches each deck at the slower pace, both reaction readouts sit correctly for a full 5s, the winner's deck fire glow reads well, and the short tribute banner is still clear.
- Real 2-device test of Président online - confirm the instant combo-play feedback feels right with real network latency, now that online bots actually work.
Open_Questions:
- La Bataille Corse's slap resolution trusts each client's self-reported `reactionMs` - accepted trade-off, no fix planned.
- Trusted-runner: host can see opponent-bot hands in mixed games - accepted trade-off, no fix planned.
- Should a permanently-bot-converted seat ever be reclaimable by its original human?
- Accepted trade-off: a player who taps the screen every few seconds without ever playing can indefinitely dodge both the auto-play and the bot conversion.
- Is a full endgame minimax solver for Bouilla's lastTrick/everything last few tricks worth building later?
- Duel mode never records match stats (no single "you" to attribute a win/loss to, per `docs/DECISIONS.md`) - accepted trade-off, no fix planned.

Recent_Changes:
- 2026-09-21 la Bataille Corse: added a discreet `V0.0.1` version label at the very bottom of its own splash screen, hardcoded, unrelated to the app-wide version shown on `/`.
- 2026-09-21 la Bataille Corse: face-to-face mode got its own home-screen button ("Jouer face à face", first, orange) after the user changed their mind on the toggle-only entry point; `/local`'s existing toggle now just defaults to "duel" when reached via `?mode=duel`.
- 2026-09-21 la Bataille Corse: new face-to-face 1v1 duel mode (same device, 2 real humans) via a toggle in the local setup screen - seat 1's corner rotated 180deg, shared pile split into top/bottom slap zones for correct per-seat attribution.
- 2026-09-21 la Bataille Corse: own online flip paints the real face immediately (`PlayerView.myTopCard` + `flushSync`); no longer waits for the Server Action.
- 2026-09-18 la Bataille Corse: slap now punches the center cards (squash, yellow flash, shockwave) the instant you tap; slap/false-slap wins slam then fly.
- 2026-09-18 la Bataille Corse: both reaction times always sit above the phone-holder's deck (`{mine}s | {opponent}s`), solo and online; the shorter time glows yellow.
- 2026-09-18 la Bataille Corse: false slap awards the whole pile to the opponent and flashes a red WRONG cross the size of the slap circle (replaces the 1-card-under-the-pile penalty).
