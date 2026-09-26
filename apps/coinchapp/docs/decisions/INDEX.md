# DECISIONS INDEX

One line per decision. Read this file, then open only the relevant decision.
Decision files are append-only. To change a decision, add a new one that supersedes it.
Template: `docs/_templates/DECISION.md`.

| # | Date | Title | Status |
|---|---|---|---|
| 0001 | 2026-06-09 | Bootstrap | Accepted |
| 0002 | 2026-06-09 | Stack: Next.js + Supabase + Vercel | Accepted |
| 0003 | 2026-06-09 | Server-authoritative state with redacted views | Accepted |
| 0004 | 2026-06-09 | Pure rules engine in lib/coinche | Accepted |
| 0005 | 2026-06-09 | Game table UI component split | Accepted |
| 0006 | 2026-06-09 | Client-side bot brain (heuristic bidding + ISMCTS play) | Accepted |
| 0007 | 2026-06-10 | Bots run client-side in the host browser | Accepted |
| 0008 | 2026-06-10 | Single bot level (no difficulty choice) | Accepted |
| 0009 | 2026-06-10 | Calibrated, shared bot bidding (`decideBid`) | Accepted |
| 0010 | 2026-06-10 | Bot ISMCTS runs in a Web Worker; local solo uses it too | Accepted |
| 0011 | 2026-06-10 | Re-calibrated bot bidding (PARTNER_CONTRIBUTION 12 -> 26) | Accepted |
| 0012 | 2026-06-10 | Bot punch setting (low/med/high) | Accepted |
| 0013 | 2026-06-11 | Bot determinization tracks known suit voids (chicanes) | Accepted |
| 0014 | 2026-06-11 | Bot stops pulling trumps once none remain outside its hand | Accepted |
| 0015 | 2026-06-12 | Multi-game via game_type discriminator (Option A) | Accepted |
| 0016 | 2026-06-16 | Offline ad-hoc mode via WebRTC P2P + QR signaling | Accepted |
| 0017 | 2026-06-16 | Bot play heuristics module (`lib/coinche/play-tactics.ts`) | Accepted |
| 0018 | 2026-06-16 | Rule 4b (don't overtake partner) generalised to any partner + secure-win guard | Accepted |
| 0019 | 2026-07-16 | Realtime resilience + optimistic-concurrency guard (fixes online games stuck on a seat) | Accepted |
| 0020 | 2026-07-16 | Presence heartbeat + stale-turn auto-play fallback (any absent seat, not just a dead host) | Accepted |
| 0021 | 2026-07-16 | Added second game "la Bouilla" via `game_type` dispatch, not a parallel stack | Accepted |
| 0022 | 2026-07-16 | Bouilla "Capot" sweep bonus: rounds 1-3 and 6 reverse the penalty onto the other 3 seats | Accepted |
| 0023 | 2026-07-16 | Bouilla "kingSpades" round ends the instant the king of spades is captured | Accepted |
| 0024 | 2026-07-16 | Bouilla "queens" round also ends early, once all 4 queens have fallen | Accepted |
| 0025 | 2026-07-16 | Bouilla bot: dynamic danger scaling, void-aware leads, and Capot (sweep) awareness | Accepted |
| 0026 | 2026-07-17 | Shared `useOptimisticPlay` hook for instant card-play feedback across games | Accepted |
| 0027 | 2026-07-17 | Bouilla gets Coinche's "pre-select a card while waiting" too, via the same shared hook | Accepted |
| 0028 | 2026-07-17 | Cut sequential Supabase round trips out of the online hot path (play a card / refetch) | Accepted |
| 0029 | 2026-07-17 | `getUserId()` switched from `getUser()` to `getClaims()` | Accepted |
| 0030 | 2026-07-17 | Idle-turn timer ("are you still there?") + permanent bot takeover, online-only, both games | Accepted |
| 0031 | 2026-07-17 | Bouilla bot: fixed a "Capot" vacuous-truth bug + recalibrated danger weights + added a `lastTrick` heuristic | Accepted |
| 0032 | 2026-07-17 | Hotfix: `getUserId()` hardened against `getClaims()` throwing outright | Accepted |
| 0033 | 2026-07-17 | Real root cause of "can't start a game": broken type re-export in a `"use server"` file, fixed via Vercel MCP runtime-error triage | Accepted |
| 0034 | 2026-07-17 | Idle-turn timer: any tap on screen dismisses the "are you still there?" banner, not just playing a card | Accepted |
| 0035 | 2026-07-18 | Idle-turn timer: fixed `turn_started_at` not resetting when the same seat leads the next trick | Accepted |
| 0036 | 2026-07-18 | `stillThereTimeoutSec` setup field changed from a free-text input to a discrete slider (10/15/20/30/60) | Accepted |
| 0037 | 2026-07-19 | Offline PWA support for local (solo) play only, native APK dropped | Accepted |
| 0038 | 2026-07-22 | Bouilla "clubs" round also ends early, once all 13 clubs have fallen | Accepted |
| 0039 | 2026-07-22 | Bot thinking-time setting (800ms-4s), shared by both games and every mode | Accepted |
| 0040 | 2026-08-03 | Bouilla bot: a Capot must be half-done before it is chased, and short suits are played to run dry | Accepted |
| 0041 | 2026-08-17 | Bouilla end-of-round score table waits for every real player, capped at 6s | Accepted |
| 0042 | 2026-09-04 | Giphy GIF reactions next to emojis | Accepted |
| 0043 | 2026-09-06 | Pre-fill the pseudo field from the Bergamots hub's profile name | Accepted |
| 0044 | 2026-09-06 | Hub avatar next to own name, online GameRoom only | Accepted |
| 0045 | 2026-09-10 | Third game "Président" (Trou du cul) via `game_type` dispatch, multi-card actions as new parallel actions | Accepted |
| 0046 | 2026-09-10 | Home screen becomes a game-picker tile list; each game gets its own splash route | Accepted |
| 0047 | 2026-09-11 | Président: a "2" burns the pile; `lastBurn` display cue on GameState | Accepted |
| 0048 | 2026-09-11 | Président: the "double" rule - replaying the pile's rank skips the next seat, completing all 4 burns it | Accepted |
| 0049 | 2026-09-15 | Président: the "double" rule's skip is spared when the target seat also holds that rank | Accepted |
| 0050 | 2026-09-15 | Président bot: strategic prompt implemented as TypeScript heuristics, not a live LLM call | Accepted |
| 0051 | 2026-09-16 | Fourth game "la Bataille Corse": local-reaction-time slap resolution, 2-player seat count generalized | Accepted |
| 0052 | 2026-09-16 | La Bataille Corse table redesign + configurable 32/54-card deck (jokers) | Accepted |
| 0053 | 2026-09-16 | La Bataille Corse: jokers reverted (52 cards, not 54), bot speed reframed as 4 discrete "reflex quality" levels | Accepted |
| 0054 | 2026-09-17 | Full-viewport fluid table (all four games) | Accepted |
| 0055 | 2026-09-17 | Combined win/loss counter across all 4 games, shown in `HomeTopBar`'s settings panel | Accepted |
| 0056 | 2026-09-17 | La Bataille Corse: figure/ace slaps ignore tribute filler, reaction time shown in seconds, online readout merged | Accepted |
| 0057 | 2026-09-18 | La Bataille Corse: false slap awards the pile + WRONG stamp | Accepted |
| 0058 | 2026-09-18 | La Bataille Corse: both reaction times above own deck in every mode, shorter one yellow | Accepted |
| 0059 | 2026-09-21 | La Bataille Corse: own flip paints the real face on the same frame | Accepted |
| 0060 | 2026-09-21 | La Bataille Corse: face-to-face 1v1 duel mode, same device | Accepted |
| 0061 | 2026-09-21 | La Bataille Corse: face-to-face gets its own home-screen button after all | Accepted |
| 0062 | 2026-09-22 | Bootstrap v10.1 context architecture alignment | Accepted |
| 0063 | 2026-09-22 | La Bataille Corse: "very fast" reflex level lowered to 400ms, own botThinkMs floor | Accepted |
| 0064 | 2026-09-23 | Président: finishing on a 2 forces Trou du Cul at round end | Accepted |
| 0065 | 2026-09-23 | Président: pile holds 2s on a quad or a hand-emptying play | Accepted |
| 0066 | 2026-09-26 | La Bataille Corse: figure/ace sandwich no longer ignores tribute filler | Accepted |
| 0067 | 2026-09-26 | La Bataille Corse: figure/ace tribute-filler slap exception removed entirely | Accepted |

## When to log a decision
Any of:
- Locks in a technology, library, or vendor.
- Changes the data model, data ownership, or access model.
- Changes module boundaries or dependency directions.
- Cannot be reversed in under 30 minutes.
- Contradicts or supersedes an earlier decision.

If unsure, add an Open_Question to `STATE.md` instead.
