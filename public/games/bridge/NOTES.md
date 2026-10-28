# Bridge — notes for agents

Solo bridge: the human is South, North (partner) and East-West are robots. A
match is a Chicago of 4 deals, each scored duplicate style; won when
North-South outscores East-West. Bidding system: French standard (SEF),
five-card majors, fixed (no convention toggles). 4 robot levels. Vanilla ES
modules, no dependency. Read this before opening the sources.

## Files

| File | Role |
|---|---|
| `main.js` | Page shell: i18n, settings, screens, overlays (result, 4 hands, score sheet, match end), stats, save/resume, `MuchogamesMatch.start/resume/finish`, Ctrl+Z / H shortcuts. |
| `flow.js` | `createFlow(ctx)`: drives the deal on screen — robot turns with delays (speed setting), trick pauses, human calls/cards, undo, hint, claim, last trick, auction toggle during play, end of deal → `ctx.onDealEnd`, `next()` closes the deal. Every timer checks an `epoch` so undo/quit cancel pending robot moves. |
| `flow-view.js` | Builds the view model and renders table, auction, bidding box, action buttons, prompt line. |
| `assist.js` | Hint (robot choice in South's place, level `hint`) and claim check (double dummy on the cards left). |
| `cards.js` | Card = int 0–51 (`suit = card / 13`, ♣♦♥♠; `rank = card % 13`, 12 = ace). Seats 0 N, 1 E, 2 S, 3 W. Deal, display order (alternating colours, trumps first), `evaluateHand` (HCP, lengths, points, balanced, stoppers, dummy points, key cards). |
| `auction.js` | Calls are strings `"P"`, `"X"`, `"XX"`, `"1H"`, `"3N"`. Legal calls, auction state, final contract/declarer. |
| `deal.js` | A deal `{ dealer, vul, hands, calls, plays, claim }`; `dealState` replays it (phase, tricks, remaining hands, turn). `humanControls` (South in the auction, both N-S hands when N-S declare). `undoDeal`. |
| `chicago.js` | Match `{ level, deals, results }`: dealer N/E/S/W, vulnerability none / dealer's side ×2 / all; passed-out deals are redealt; `restoreMatch` replays a save against the rules. |
| `scoring.js` | Duplicate score of one contract. |
| `bid-*.js` | The bidding system (see below). |
| `play-ai.js` | Robot card: rules of thumb (`play-lead.js`, `play-follow.js`, `play-declarer.js`, helpers in `play-util.js`); levels `hard`/`expert`/`hint` search the last 5/7 tricks double dummy over sampled hidden hands (`sampler.js`, `dds.js`). `easy` plays a random card 20% of the time. |
| `dds.js` | Double-dummy solver (alpha-beta, transposition table per trick, touching cards merged, node budget). Too slow for a full 13-trick deal; used for endings only. |
| `robot.js`, `robot-worker.js`, `robot-view.js` | Module worker for robot cards and claim checks (main-thread fallback). `playView` gives a robot only what its seat sees. |
| `table-view.js`, `hand-view.js`, `auction-view.js`, `bidbox.js`, `panels.js` | Rendering. Cards: `data-id="bridge-card-<suit><rank>"` (`bridge-card-sa`); auction calls `bridge-auction-call-<n>`; bidding box `bridge-bid-level-<n>`, `bridge-bid-strain-<name>`, `bridge-bid-pass/double/redouble`. |
| `setup.js`, `store.js` | Options panel sections (built in JS between Language and Rules), level slider, localStorage: `bridge-settings`, `bridge-saved-match`, `bridge-stats` (`{ <level>: { won, played } }`). |
| `i18n.js`, `copy-*.js` | FR/EN/ES strings, bid-explanation tags, rules HTML. |
| `styles.css`, `slider.css`, `table.css`, `cards.css`, `bidding.css`, `panels.css` | Page/start screen; level slider; table layout (card size from viewport); card faces; auction + bidding box; overlays. |

## Bidding engine

- `bid-system.js` is the entry point: `bidFor(cards, dealer, vul, calls)` → `{ call, meta }`; `analyzeAuction` → what every call showed (`know[seat]`: HCP range, length ranges) by explaining each call in turn.
- A situation returns an ordered list of entries `{ call, test(h), shows, tag, conv, forcing, gf, signoff, nt, target, trump }`. Choosing = first legal entry whose `test` passes; explaining = first entry with that call (same rules for robots and the human). No entry fits → `bid-place.js` places the contract from combined points (slam via Blackwood, game, invitation, part score, competition by total tricks, penalty doubles) and `naturalMeaning` explains it.
- Situations: `bid-open.js` (openings), `bid-respond.js` (responses to 1 of a suit), `bid-rebid.js` (opener's rebid), `bid-nt.js` (Stayman, Texas, invitations, quantitative), `bid-strong.js` (2♣/2♦ relays, weak twos, preempts, RKCB 41-30), `bid-compete.js` (overcalls, takeout double, advances), `bid-interfere.js` (responses over interference, negative double). `bid-context.js` builds the context; `bid-eval.js` fit and combined points.
- Explanations shown to the player come from `tag` + `shows` (`i18n.explainText`).

## Rules in code

- The human plays the contract (both hands) whenever North-South win it; defends as South otherwise.
- Undo takes back to the human's previous decision (calls or cards) in the current deal; not after the deal ends.
- Claim (≤ 7 tricks left, N-S declaring, human to play) is accepted only if the declaring side takes every remaining trick double dummy.
- `finish({ won, score })` after the 4th deal; a tie calls `finish()`. Quitting mid-match ends it without a result and drops the save. A match in progress is saved after every call/card; "Reprendre" costs no coin.
