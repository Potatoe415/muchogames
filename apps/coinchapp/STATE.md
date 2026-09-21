# STATE

Rule: Replace content on every update. Never append history here. Max 60 lines.
History lives in `docs/DECISIONS.md` (decisions) and `docs/BACKLOG.md` (tasks).

---

Status: Fourth game "la Bataille Corse" shipped end-to-end alongside Coinche, la Bouilla, and Président. All four tables now share a full-viewport `TableShell` (no 460×720 phone column): cards keep a 2:3 ratio and grow with `svmin` from phone floor (64px `lg`) up to a 7rem cap. Deployed on Vercel (project `coinchapp`, team `remiinsf-3156s-projects`).
Current_Goal: Done - fixed three la Bataille Corse bugs in this session: the played card missing when a tribute failure sweeps the pile in the very same update, the landing bounce on a plain flip, and false slaps silently stopping being penalized after the first slap window of the match ever closed.
Last_Action: (1) `PileWinEvent` gained a `cards: Card[]` field (`engine.ts`'s `awardPile` now captures the full swept pile at award time) so `useDisplayPile` freezes on that instead of the client's own previously-seen `pile` prop - fixes the just-played card vanishing instead of appearing before the pile-win sweep. (2) Added a Bataille-Corse-only `.bataillecorse-card-enter` animation (`app/globals.css`, no landing overshoot) used by `PileCurrentCard` instead of the shared `.played-card-enter` (kept as-is for Coinche/Bouilla/Président) - removes the bounce on a plain flip that opens nothing. (3) `tapSlap` in `BataillecorseTable.tsx`/`BataillecorseDuelTable.tsx` no longer falls back to `view.lastClosedSlapWindowId` when computing `observedWindowId` - that fallback made every later bogus tap (nothing open) match `attemptSlap`'s "too late, not a foul" check forever after the match's first slap window ever closed, silently disabling the false-slap penalty (no red cross, no card loss). Verified live via browser (state inspection + screenshots): false slap now correctly fires again after a prior window has closed, still shows the big red WRONG cross, and awards the whole pile to the opponent. `npx tsc --noEmit` clean, `npm test` 248/248 (engine.test.ts and useOptimisticFlip.test.ts updated for the new `cards` field).
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
- 2026-09-21 la Bataille Corse: fixed 3 bugs - missing played card on an immediate tribute-failure sweep (`PileWinEvent.cards`), the plain-flip landing bounce (`.bataillecorse-card-enter`), and false slaps never being penalized again after the match's first slap window closed (`observedWindowId` fallback removed from `tapSlap`).
- 2026-09-21 la Bataille Corse: added a discreet `V0.0.1` version label at the very bottom of its own splash screen, hardcoded, unrelated to the app-wide version shown on `/`.
- 2026-09-21 la Bataille Corse: face-to-face mode got its own home-screen button ("Jouer face à face", first, orange) after the user changed their mind on the toggle-only entry point; `/local`'s existing toggle now just defaults to "duel" when reached via `?mode=duel`.
- 2026-09-21 la Bataille Corse: new face-to-face 1v1 duel mode (same device, 2 real humans) via a toggle in the local setup screen - seat 1's corner rotated 180deg, shared pile split into top/bottom slap zones for correct per-seat attribution.
- 2026-09-21 la Bataille Corse: own online flip paints the real face immediately (`PlayerView.myTopCard` + `flushSync`); no longer waits for the Server Action.
- 2026-09-18 la Bataille Corse: both reaction times always sit above the phone-holder's deck (`{mine}s | {opponent}s`), solo and online; the shorter time glows yellow.
- 2026-09-18 la Bataille Corse: false slap awards the whole pile to the opponent and flashes a red WRONG cross the size of the slap circle (replaces the 1-card-under-the-pile penalty).
