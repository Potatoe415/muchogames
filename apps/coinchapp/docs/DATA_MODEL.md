# DATA MODEL

Status: Living document. Update whenever persisted data structure changes.

---

## Source of Truth

Technical_Source: `supabase/migrations/0001_init.sql`
Type-level shapes: `lib/supabase/types.ts` (rows) and `lib/coinche/types.ts` (GameState).

Rule:
- The SQL migration is the executable source of truth.
- This document is the human/agent-readable map and must not contradict it.

---

## Storage Overview

Database_Type: Supabase Postgres
Persistence_Model: One `games` row holds the full authoritative `state` (jsonb).
`game_players` holds seat assignments. `game_events` is an append-only realtime tick.

---

## Entities

### Entity: games

Purpose: A single game/table with its authoritative state.
Storage: table `public.games`

Fields:
| Field | Type | Required | Notes |
|---|---|---|---|
| id | uuid | Yes | Primary key |
| room_code | text | Yes | Unique join code |
| game_type | text | Yes | `"coinche" \| "bouilla" \| "president" \| "bataillecorse"` (default `'coinche'`); lets one project host several games, and picks which rules engine (`lib/coinche`, `lib/bouilla`, `lib/president`, or `lib/bataillecorse`) `actions-lobby.ts`/`actions-game.ts`/`view.ts` dispatch to. Also picks the seat count via `seatCountFor` (2 for `bataillecorse`, 4 for every other game) - see below. Indexed. |
| status | text | Yes | lobby / playing / finished |
| settings | jsonb | Yes | `GameSettings`, all fields optional so one shape fits all four games. Coinche: targetPoints, countContractOnlyIfMade, failedContractDefensePoints, zeroPointsForNonContractingTeamWhenContractMade, capotMadePoints, capotFailedDefensePoints, allowToutAtoutSansAtout, requireMorePointsToWin, botPunch ("low"\|"med"\|"high", default "med"; bot bidding aggressiveness, not part of GameState). Président: presidentRoundsToPlay (default 4, one of 1/2/3/4/5 - `DEFAULT_PRESIDENT_ROUNDS_TO_PLAY`/`PRESIDENT_ROUNDS_OPTIONS`). Shared by all four: stillThereTimeoutSec (default 15; see idle-turn timer below), botThinkMs (800-4000ms, default 800; how long a bot "thinks" - the Coinche ISMCTS search's wall-clock budget, a pure pacing delay for Bouilla's/Président's instant heuristic bots, or (la Bataille Corse) both the bot's flip pacing and the range its simulated slap reaction is drawn from; read by whichever client runs the bots, same as botPunch) — Bouilla's 6 rounds/point values, Président's exchange mechanics, and la Bataille Corse's rules are otherwise fixed, so these are their only per-game settings. |
| state | jsonb | No | Full `GameState` for the row's `game_type` (`AnyGameState` = Coinche \| Bouilla \| Président \| Bataille Corse `GameState`, hidden hands/stocks). Server-only. Bouilla's and Président's states additionally carry an optional `readySeats: Seat[]`, present only during the "scoring" phase - see the end-of-round readiness gate below. |
| version | integer | Yes | Incremented on each change (realtime tick) |
| host_user_id | uuid | No | User id of the client that runs the bots. Set to creator on create; reassigned by `becomeHost`. |
| turn_started_at | timestamptz | Yes | When `state.turn` last changed; stamped by `persistGame` (`lib/server/repo.ts`) whenever the new state's turn differs from the previous one. Anchors the idle-turn timer below. |
| created_at | timestamptz | Yes | |

Access_Rules:
- RLS enabled, no policies -> only service_role (Server Actions) can read/write.

Sensitive_Data:
- `state.hands` contains every player's cards. Human hands are never exposed; the redacted view sent to the host additionally includes the bot seats' hands (`botViews`) so the host can run them.

### Entity: game_players

Purpose: Who sits at each seat (human or bot).
Storage: table `public.game_players`

Fields:
| Field | Type | Required | Notes |
|---|---|---|---|
| id | uuid | Yes | Primary key |
| game_id | uuid | Yes | FK -> games(id), cascade delete |
| seat | smallint | Yes | 0..3, unique per game (checked at the DB level; `bataillecorse` only ever uses 0/1 - `seatCountFor` in `lib/supabase/types.ts` is the single source of truth for how many seats a given `game_type` needs, threaded through `pickJoinSeat`/`fillWithBots`/`startGame` in `lib/server/actions-lobby.ts` and the lobby/bot-seat-picker UI) |
| user_id | uuid | No | null for bots |
| display_name | text | Yes | |
| is_bot | boolean | Yes | |
| team | text | Yes | A = seats {0,2}, B = seats {1,3} |
| last_seen_at | timestamptz | Yes | Presence heartbeat, refreshed by `getView` for the caller's own seat. Drives the `connected` flag in the redacted view (computed on read, not stored) and the stale-turn auto-play fallback (`lib/server/actions-game.ts` `advanceStaleTurns`). A bot seat's liveness is judged by the host's own row instead (`isSeatLive` in `lib/server/repo.ts`), since bots have no client of their own. |
| missed_turns_in_row | integer | Yes | Consecutive turns this seat has failed to act on in time (idle-turn timer, see below). Reset to 0 by any successful self-play (`playCard`/`placeBid`), and whenever a human takes over a seat (`joinGame`'s replace path). |
| created_at | timestamptz | Yes | |

Access_Rules:
- RLS enabled, no policies -> service_role only.

### Entity: game_events

Purpose: Lightweight realtime "something changed" tick.
Storage: table `public.game_events`

Fields:
| Field | Type | Required | Notes |
|---|---|---|---|
| id | bigint identity | Yes | Primary key |
| game_id | uuid | Yes | FK -> games(id), cascade delete |
| version | integer | Yes | Matches games.version |
| created_at | timestamptz | Yes | |

Access_Rules:
- SELECT allowed to any authenticated (incl. anonymous) user. No secret data.
- In `supabase_realtime` publication so clients can subscribe to inserts.

---

## Idle-turn timer ("are you still there?")

Online-only (not ad-hoc/local): each human turn is measured against `games.turn_started_at`.
- 1st consecutive miss: after `settings.stillThereTimeoutSec` (default 15) total silence, the server auto-plays a random legal card (or, during Coinche bidding, the same heuristic bid the 45s browser-gone safety net uses) and sets `missed_turns_in_row = 1`.
- 2nd consecutive miss: the same seat gets only a 5s window before the seat permanently becomes a bot (`is_bot = true`, `user_id = null`) - the stuck turn is played once with the heuristic bot, and every turn after that is driven by the host's bot runner like any other bot seat.
- Any successful self-play resets `missed_turns_in_row` to 0.
- A tap anywhere on screen while the banner is showing also counts as presence: `markStillHere` resets `missed_turns_in_row` to 0 and restarts `turn_started_at`, dismissing the banner without requiring an actual play.

Implemented in `lib/server/idle-timer.ts` (`decideIdleAction` is pure/unit-tested; `advanceIdleTurns` does the DB side effects; `markSeatPresent` backs the tap-to-dismiss action), called from `getView` right before the coarser 45s `advanceStaleTurns` safety net. Client side: `lib/client/useStillThereTimer.ts` shows a non-blocking countdown banner, proactively refetches at the deadline, and attaches a one-shot `pointerdown` listener on `document` while the banner shows to call `markStillHere`; the `useGameView` 15s poll still enforces it even if that tab is fully closed.

---

## Bouilla/Président end-of-round readiness gate ("Partie suivante" / "Manche suivante")

Online + ad-hoc only (not local solo): the end-of-round score table only disappears once every real (non-bot) player has pressed the "next round" button, or `ROUND_AUTO_ADVANCE_MS` (6s; `lib/bouilla/types.ts` for Bouilla, `lib/president/types.ts` for Président) has elapsed since the round ended - whichever comes first. Never applies to the finished-match screen ("Nouvelle partie" rematch), which stays unforced.

- Online: `games.state.readySeats` (Bouilla and Président) accumulates seats via each engine's own `markReadyForNextRound`; the `readyForNextRound` Server Action (`lib/server/actions-game.ts`) advances the round immediately once every human seat is in it. `advanceScoringTimeout` (`lib/server/round-gate.ts` - generalized from the Bouilla-only `bouilla-round-gate.ts` once Président needed the identical mechanism) force-advances past `games.turn_started_at + ROUND_AUTO_ADVANCE_MS` regardless, run opportunistically from `getView` like the idle-turn timer above. `GameView.nextDealGate` (computed in `lib/server/view.ts`) exposes `{ readyCount, humanCount, iAmReady }` to the client, same shape the ad-hoc host already used.
- Ad-hoc: `useP2PBouillaHost.ts`/`useP2PPresidentHost.ts` each keep their own in-memory `ready: Set<number>` (unrelated to the `readySeats` jsonb field, which ad-hoc mode never touches) plus a `setTimeout(forceAdvance, ROUND_AUTO_ADVANCE_MS)` effect keyed on `state.phase === "scoring"`.
- Local solo: unchanged/untimed - the sole real player advances whenever they choose.

---

## Président rounds and forced exchange

Président ("Trou du cul") plays a fixed number of rounds (`presidentRoundsToPlay` setting, default 4) rather than to a target score. Each round after the first opens in an `"exchange"` phase before play starts:

- The previous round's Trou du Cul (last place) gives their 2 highest cards to the President (first place), who returns any 2 cards of their choice; the Vice-Trou-du-Cul gives their 1 highest card to the Vice-President, who returns any 1 card. Round 1 has no exchange (no titles exist yet) - the seat holding the 3 of clubs leads instead.
- `state.forcedTransfers: [ForcedTransfer, ForcedTransfer] | null` is a display-only, face-up record of that forced half (`{ from, to, cards }` per leg, computed by `computeForcedTransfers`) - lets the Trou du Cul/Vice-Trou du Cul see which of their own best cards just left, even though they have no choice in it (they're never in `pendingExchange.awaiting`). Set when the "exchange" phase opens, cleared back to `null` once both returns are done (`nextExchangeStep`) or on round 1 (no exchange at all).
- Modeled as two sequential turns on the single `state.turn` field (President returns first, then Vice-President), not concurrent, so the exchange fits the same turn model every shared subsystem (idle-timer, stale-turn takeover) already assumes for every other game.
- Finishing rank per round (1=President..4=Trou du Cul) accumulates into `totalScores` like Bouilla's penalties - lowest total wins at the end of `presidentRoundsToPlay` rounds.
- A quad (4-of-a-kind) play triggers a "revolution": rank order inverts for the rest of that round (toggles again on a second quad, always resets at the start of the next round). Tracked as `state.revolution: boolean`, not persisted separately.
- A "2" (single, pair, or triple - a quad still only revolutions) instantly burns the pile: `state.pile` is cleared and the same seat leads again. `state.lastBurn: { seat, combo } | null` is a display cue for the collect-and-fly animation (redacted through to `PlayerView.lastBurn`); rules never read it. Cleared at deal / next round / end of exchange. Playing a "2" that empties the hand does not burn (normal finish flow).
- House rule: finishing your hand on a losing 2 (single, pair, or triple - a quad still only revolutions, same scope as the burn rule above) does not change how the round plays out - it is recorded in `state.losingFinishSeats: Seat[]` (`applyPlay`/`losesOnFinish`, reset to `[]` at deal / next round). Only once the round actually ends does `computeRoundResult` demote every seat in that list behind every seat not in it (each group's own relative order kept) before assigning titles/points, so that seat becomes Trou du Cul (or the worst rank still available) regardless of when it actually emptied its hand. Passed through on `PlayerView.losingFinishSeats` so the table can show a peach on that seat for the rest of the round (see `docs/decisions/INDEX.md` 0064).
- The "double" rule: replaying the pile's exact rank (same card count) is legal alongside beating it (`isLegalCombo`/`applyPlay` in `lib/president/play.ts`) and skips the very next active seat's turn entirely, unless it also completes all 4 cards of that rank - which instead burns the pile exactly like a "2" (same seat leads again). `Pile.stackCount` (optional, defaults to `combo?.cards.length ?? 0` when absent) tracks how many cards of the pile's rank are down so far; `state.lastSkip: { seat, skippedSeat, combo } | null` is the matching display cue for a "turn skipped" animation, same never-read-by-rules/diff-by-clients contract as `lastBurn`. Finishing your hand always takes priority over either effect (same precedent as a hand-emptying "2" never burning).

---

## La Bataille Corse (2 players, reflex game)

The only 2-player game (`seatCountFor` returns 2 for `"bataillecorse"`, 4 for every
other game - see `game_players.seat` above). No teams, no rounds/scoring table:
a single continuous match, `state.phase` is just `"playing" | "finished"`.

- `state.stocks: [Card[], Card[]]` - each seat's own face-down draw pile (last
  element = top, next to flip). `state.pile: Card[]` is the shared, fully
  face-up center pile (last element = top/most recent). Redaction
  (`lib/bataillecorse/redact.ts`) hides each stock's remaining *order* from
  the opponent. The acting seat's view also includes `myTopCard` (that
  stock's top card only) so their own flip can paint on the same frame;
  it is never rendered on the stock itself. Pile and stock counts stay
  visible to both seats, same as the physical game.
- `state.turn: Seat` (0 | 1) - whose turn it is to flip next, either a plain
  lead or paying the tribute they currently owe (`state.tribute`). Not the
  same thing as who may attempt a slap (see below).
- `state.tribute: { seat, attemptsLeft, fromRank } | null` - a figure/ace
  challenge in progress. Attempts allowed: Jack=1, Queen=2, King=3, Ace=4
  (`attemptsFor` in `lib/bataillecorse/cards.ts`). Resolved a card at a time
  by `resolveTributeEffect` (`lib/bataillecorse/tribute.ts`): another
  figure/ace flips the obligation onto the other seat; running out of
  attempts hands the whole `pile` to the challenger.
- `state.slapWindow: { id, pattern, openedAtMs } | null` - open the instant a
  "double" (top 2 cards same rank) or "sandwich" (top and 2-below same rank)
  appears (`detectSlapPattern`), superseding whatever tribute/turn is
  pending. Blocks `submitFlip` until it resolves.
- `state.slapClaims: SlapClaim[]` (`{ seat, reactionMs }`) - each seat's own
  **locally measured** reaction time (elapsed ms on that seat's own client,
  from when it rendered the open window to when it tapped), never a network
  arrival order. `attemptSlap` (`lib/bataillecorse/engine.ts`) awards the
  pile to the lower `reactionMs` once both seats have claimed; a lone claim
  (or none) auto-resolves after `SLAP_GRACE_MS` (3000ms, comfortably above a
  real round-trip) via `resolveStaleSlapWindow`, run opportunistically from
  `getView` like every other timer below (`lib/server/slap-timer.ts`
  `advanceStaleSlapWindow`) - online only; local/ad-hoc schedule it with a
  plain `setTimeout` instead, since there is no polled `getView` there.
  Tapping when no window is open (or one just closed and the tap's
  `observedWindowId` doesn't match `state.lastClosedSlapWindowId`) is a false
  slap: the whole center `pile` is awarded to the other seat (`lastPileWin.reason`
  `"falseSlap"`), same tuck-under as a real slap/tribute win, and
  `lastFalseSlap` flags who fouled so the table can flash the WRONG mark.
  An empty pile has nothing to award - the foul is still flagged.
- Either seat's stock reaching 0 cards ends the match immediately - the
  other seat wins (`checkElimination`). No "capot"/sweep scoring: this is a
  single win/lose outcome (`state.winner: Seat | null`).
- Server actions: `flipCard(gameId)` (no payload - the top card is
  random/hidden, nothing to choose) and `attemptSlap(gameId, reactionMs,
  observedWindowId)`, both `bataillecorse`-only in `lib/server/actions-game.ts`.
  A bot seat's flip/slap go through the existing `submitBotMove` with new
  `BotMove` variants `{ kind: "flip" }` / `{ kind: "slap", reactionMs,
  observedWindowId }` (`lib/server/game-dispatch.ts`), driven client-side by
  the host's dedicated `lib/client/useBataillecorseBotRunner.ts` (not the
  generic Coinche/Bouilla `useBotRunner.ts`, which only knows bid/play moves).
- Settings: shared `stillThereTimeoutSec`/`botThinkMs` (`botThinkMs` also
  scales the bot's simulated slap reaction range, `simulateBotReactionMs` -
  its own settings-panel control reframes it as 4 discrete "reflex quality"
  levels, slow/normal/fast/very fast, rather than the other games' continuous
  thinking-time slider; slow never reacts under 1s, normal never under 0.5s)
  plus its own `bataillecorseDeckSize: 32 | 52`
  (`DEFAULT_BATAILLECORSE_DECK_SIZE`/`BATAILLECORSE_DECK_SIZE_OPTIONS`) - 32 is
  a piquet-style pack (7 and up), 52 is the full pack. No jokers either way
  (briefly added, then explicitly reverted - see docs/DECISIONS.md).

---

## Relationships

- games 1 - N game_players (by game_id)
- games 1 - N game_events (by game_id)

---

## Access Model

Roles: anonymous user (authenticated, is_anonymous), service_role (server authority).
Rules:
- Clients never read games/game_players directly; all reads go through the
  `getView` Server Action which returns a redacted per-seat view.
- Clients subscribe to `game_events` and refetch the redacted view on each tick.

---

## Migration Notes

## 2026-06-09 - Initial schema

Change: Added games (incl. `host_user_id`), game_players, game_events with RLS and realtime publication.
Reason: Authoritative server-side Coinche state with leak-proof realtime sync; `host_user_id` records which member runs the client-side bots.
Impact: Authoritative state stored as jsonb in games.state; clients get redacted views only (host also gets bot seats' hands via `botViews`).

## 2026-06-10 - Online game TTL (48h)

Change: Added a `pg_cron` job (`cleanup-expired-games`) that deletes `games` rows older than 48 hours.
Reason: Automatically remove stale online rooms from Supabase without manual cleanup.
Impact: Expired games disappear from persistence; cascading FK deletion removes linked `game_players` and `game_events`.

## 2026-06-12 - game_type discriminator

Change: Added `games.game_type text not null default 'coinche'` (indexed). Mirrored as `GameType` in `lib/supabase/types.ts`; `createGame` sets it explicitly.
Reason: Let a single Supabase project host several games and separate them logically (filter/route by `game_type`), instead of duplicating tables or schemas per game.
Impact: Additive, non-breaking — existing rows default to `coinche`. The shared `games`/`game_players`/`game_events` plumbing (RLS, realtime, TTL cron) is reused across games. Per-game specifics stay in the `settings`/`state` jsonb and in the per-game rules engine.

## 2026-06-12 - Consolidated into a single re-runnable script

Change: Merged the schema, the `game_type` column and the 48h TTL cron into one `supabase/migrations/0001_init.sql` with a full reset (unschedule cron + `drop table ... cascade`) at the top. Deleted `0002_games_ttl_48h.sql` and `0003_games_game_type.sql`.
Reason: User wants one script to wipe the (sandbox) DB and rebuild from zero.
Impact: `0001_init.sql` is now the single executable source of truth; run it alone to recreate everything. Destructive by design — do not run against production data.

## 2026-07-16 - `connected` boolean replaced by `last_seen_at` heartbeat

Change: Removed `game_players.connected` (a boolean that was always `true`, never updated) and added `game_players.last_seen_at timestamptz not null default now()`, refreshed by `getView` for the caller's own seat on every call.
Reason: Detect an absent host or player so the table stops freezing forever; the old column was dead weight (nothing ever wrote to it besides the default).
Impact: `LobbyPlayer.connected` in `GameView` is now computed on read (`isSeatLive` in `lib/server/repo.ts`) instead of stored. `getView` also opportunistically auto-plays a turn whose responsible party has gone silent too long (`advanceStaleTurns` in `lib/server/actions-game.ts`), using the simple heuristic bot.

## 2026-07-16 - `game_type` actually used: second game "la Bouilla"

Change: No SQL change (the `game_type` column and its `'coinche'` default already existed since 2026-06-12). `createGame` now accepts and persists `game_type: "bouilla"`; `GameSettings` fields all became optional (Bouilla rows store `settings = {}`); `GameRow.state`/`GameView.view`/`botViews` are now discriminated unions (`AnyGameState`/`AnyPlayerView`) over both games' `GameState`/`PlayerView` shapes.
Reason: First real consumer of the `game_type` discriminator that was added ahead of need.
Impact: Existing Coinche rows/behavior unchanged (still default `'coinche'`, same settings shape). Every read of `game.state`/`game.settings` that is specific to one engine narrows via `game.game_type` first (see `lib/server/view.ts` `redactForSeat`, `lib/server/actions-game.ts`, `lib/server/actions-lobby.ts` `startInitialState`/`sanitizeSettings`).

## 2026-07-17 - Idle-turn timer ("are you still there?") + `stillThereTimeoutSec`

Change: Added `games.turn_started_at timestamptz not null default now()` (stamped by `persistGame` whenever `state.turn` changes) and `game_players.missed_turns_in_row integer not null default 0`. `GameSettings` gained `stillThereTimeoutSec` (default 15), now sanitized for both game types - Bouilla's `settings` is no longer unconditionally `{}`.
Reason: Online-only feature: a human whose turn has been silent too long gets a countdown-and-auto-play nudge, then a permanent bot takeover on a second consecutive miss, so idle players never freeze the table for the rest of the group.
Impact: New `lib/server/idle-timer.ts` module (`decideIdleAction` pure/unit-tested, `advanceIdleTurns` DB side effects), called from `getView` ahead of the existing 45s `advanceStaleTurns` safety net (unrelated and unchanged - that one is for a genuinely gone browser, this one for a present-but-unresponsive one). `lib/server/game-dispatch.ts` was extracted from `lib/server/actions-game.ts` so both the "use server" actions file and the new idle-timer module (a plain module, since "use server" files may only export async functions) share the same game-dispatch helpers. Client: new `lib/client/useStillThereTimer.ts` + `components/StillThereModal.tsx`, wired into `components/GameRoom.tsx`. Settings UI: `components/GameSettingsPanel.tsx` now also renders for Bouilla's online setup (previously hidden entirely), gated by new `coincheFields`/`showStillThereTimeout` props.

## 2026-09-10 - `game_type` extended again: third game "Président"

Change: No SQL change (`games.game_type` is plain `text` with no CHECK constraint, per the 2026-06-12 entry). `createGame` now also accepts `game_type: "president"`; `GameSettings` gained `presidentRoundsToPlay` (default 4, one of 3/4/5/6/8); `GameRow.state`/`GameView.view`/`botViews` widened to a 3-way discriminated union (`AnyGameState`/`AnyPlayerView`) over Coinche/Bouilla/Président. Président's `state` also carries the same optional `readySeats: Seat[]` field Bouilla introduced for its end-of-round gate (see above), reused verbatim.
Reason: Second real consumer of the `game_type` discriminator beyond Bouilla, confirming the pattern generalizes to a third game with no schema change at all.
Impact: Existing Coinche/Bouilla rows/behavior unchanged. Every read of `game.state`/`game.settings` specific to one engine narrows via `game.game_type` first, same dispatch points Bouilla already established (`lib/server/view.ts` `redactForSeat`, `lib/server/actions-game.ts`, `lib/server/actions-lobby.ts` `startInitialState`/`sanitizeSettings`, `lib/server/game-dispatch.ts`).

## 2026-09-16 - Fourth game "la Bataille Corse" (2 players, reflex) + seat count generalized

Change: No SQL change (the `seat between 0 and 3` check already accommodates a 2-seat game; `game_type` is plain `text`). `createGame` now also accepts `game_type: "bataillecorse"`. New `seatCountFor(gameType)` in `lib/supabase/types.ts` (2 for `bataillecorse`, 4 otherwise) replaces every hardcoded `[0,1,2,3]`/`length === 4`/`length < 4` in `lib/server/actions-lobby.ts` (`pickJoinSeat`, `fillWithBots`, `startGame` - error code renamed `need_four_players` -> `not_enough_players`), `components/Lobby.tsx`, and `components/BotSeatPicker.tsx` (previously hardcoded 4 seats independently of the actual roster passed in - a latent bug for any non-4-seat game, fixed by deriving seats from the roster itself instead of a fixed range). `GameRow.state`/`GameView.view`/`botViews` widened to a 4-way discriminated union.
Reason: la Bataille Corse is a 2-player-only reflex game (first to slap a double/sandwich takes the pile; figures/aces open a tribute) - the first game that isn't 4 seats, so the seat-count assumption baked into the lobby/bot-fill/start-game plumbing had to become a per-game-type lookup instead of a literal.
Impact: Existing Coinche/Bouilla/Président rows/behavior unchanged (still 4 seats). `state.slapWindow`/`state.tribute`/`state.slapClaims` etc. are new, `bataillecorse`-only fields with no shared-shape equivalent in any other game (see the dedicated section above) - unlike Bouilla/Président's `readySeats`, nothing here is reused verbatim by another game. Also fixed a real bug found while wiring this in: the generic online bot runner (`lib/client/useBotRunner.ts`) defaulted any non-`"bouilla"` game type to the Coinche ISMCTS brain on whatever `PlayerView` shape it was given - harmless-looking until `bataillecorse`'s view shape actually crashed it at runtime. Now explicitly excludes `bataillecorse` (which has its own `useBataillecorseBotRunner.ts`); Président likely has the same latent issue and was left alone (out of scope here, flagged in `docs/BACKLOG.md`).

## 2026-09-18 - La Bataille Corse false slap awards the pile (`lastPileWin.reason` `"falseSlap"`)

Change: No SQL change (`games.state` is opaque jsonb). `PileWinEvent.reason` gained `"falseSlap"`. A false slap now awards the whole center pile to the other seat (same tuck-under as a real slap/tribute win) and still sets `lastFalseSlap` for the UI stamp. Empty pile: foul is flagged, nothing awarded.
Reason: User reversed the 2026-09-16 1-card-under-the-pile penalty: tapping when no pattern is live must show a WRONG mark and give every center card to the opponent.
Impact: In-progress `bataillecorse` rows with an open pile are interpreted under the new rule on the next `attemptSlap`. No migration. Engine tests covering the old 1-card penalty were replaced.

## 2026-09-24 - Shared hub profile wins and losses

Change: No change to `games` / `game_players` / `game_events`. When the hub appends `?profileCode=`, a Server Action consumes `muchogames_launch_codes` (same Supabase project, service role) and stores the resolved profile id in an httpOnly session cookie. Finishing a match in any of the four games also increments `muchogames_profiles.wins` or `losses`. The local `coinchapp-match-results` counter is unchanged.
Reason: The hub `/profile` page cannot read this app's `localStorage`.
Impact: A visit with no launch code does not write the shared row. Duel mode still does not record a personal result.
