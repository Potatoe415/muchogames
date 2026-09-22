# ARCHITECTURE

Agents propose changes; the user confirms before any edit.
Every stack choice also gets a decision in `docs/decisions/`.
Merged from the retired `docs/TECH.md` on 2026-09-22 (bootstrap v10.1 upgrade, see `docs/decisions/INDEX.md`).

## Stack

| Layer | Choice |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4 |
| Backend | Next.js Server Actions (authoritative game logic) |
| Database | Supabase Postgres |
| Runtime | Node.js (Vercel serverless) |
| Package manager | npm |
| Hosting | Vercel (project `coinchapp`, team `remiinsf-3156s-projects`) |
| Authentication | Supabase anonymous sign-in (cookie session via `@supabase/ssr`) |
| Validation library | None dedicated — Server Actions throw `Error` with stable string codes |
| Logger | None custom yet |
| Testing | Vitest (pure rules engines in `lib/coinche`, `lib/bouilla`, `lib/president`, `lib/bataillecorse`) |

Authorization: RLS denies direct client access to `games`/`game_players`; only the `service_role` (Server Actions) reads/writes authoritative state.
Security model: Human hands stay redacted per seat. Bots run in the host client, which receives the bot seats' hands (trusted-runner model). The server stays authoritative: it validates every submitted move (human or bot) with the rules engine. La Bataille Corse's slap race extends this same trust model: `attemptSlap`'s `reactionMs` is self-reported by the caller's own client, and the server only compares the two seats' reported values against each other.

## Style: this is not a `src/modules/` monolith — it's per-game rules engines under `lib/`

This app predates the `src/modules/<name>/` convention from the v10.1 template. The real module boundary is one folder per game's pure rules engine under `lib/<game>/`, each with its own `deal`/`bot`/`redact`/`engine`/`types`. Code is untouched by this alignment pass — see the module map below, documented as-is.

## Module map (current structure, as-is)

| Module | Purpose | Owns data | May depend on |
|---|---|---|---|
| `lib/coinche` | Coinche rules engine: cards, deal, bidding, trick, scoring, engine, bot, redact, types | `games.state`/`settings` (game_type='coinche') | none (pure) |
| `lib/bouilla` | La Bouilla (Barbu-style) rules engine: cards, deal, trick, rounds, scoring, engine, bot, redact, types | `games.state`/`settings` (game_type='bouilla') | none (pure) |
| `lib/president` | Président rules engine: cards, deal, combos, play, exchange, scoring, engine, bot, redact, types | `games.state`/`settings` (game_type='president') | none (pure) |
| `lib/bataillecorse` | La Bataille Corse rules engine (2-player reflex game): cards, deal, pattern, tribute, engine, bot, redact, types | `games.state`/`settings` (game_type='bataillecorse') | none (pure) |
| `lib/server` | `repo` (data access), `view` (redaction + host botViews), `actions-lobby`, `actions-game`, `slap-timer`, `idle-timer`, `round-gate`, `game-dispatch` | `games`, `game_players`, `game_events` tables | `lib/coinche`, `lib/bouilla`, `lib/president`, `lib/bataillecorse`, `lib/supabase` |
| `lib/supabase` | `client` (browser), `server` (user + service clients), `types` (row shapes) | none | none |
| `lib/client` | `auth`, `useGameView`, `bot`, `useBotRunner`, per-game bot runners, `useLocalGame`, optimistic-play hooks, P2P host/client | none (browser-side) | `lib/*` engines, `lib/supabase/client` |
| `components/` | UI: `TableShell`, `HomeTopBar`, `GameHud`, `TrickStage`, `PlayingCard`, per-game tables, shared reaction/seat helpers | none | `lib/client`, `lib/*` engines |
| `supabase/migrations/` | SQL source of truth for `games`/`game_players`/`game_events` | schema | none |

Rules:
- Other modules import a game engine's public entry (`lib/<game>/index.ts` where present), not deep internals.
- `lib/server` is the single authority: the browser is a renderer + input.
- A new game needs its own `lib/<game>/` engine + `lib/client` hooks + component(s) — see "Card games" conventions below, reuse the shared base before writing new per-game code.
- Files ≤ 300 lines, functions ≤ 30 lines, one responsibility per file.

## Card games — shared base, differentiate on top

Coinche, la Bouilla, Président, and la Bataille Corse are one family of games sharing one visual/interaction base, not four independent tables. A new per-game behavior is either (a) an instance of something the base already provides — reuse it — or (b) a genuine rule difference for that game — add it on top of the base, never by forking/duplicating a base piece under a new name.

The base today (do not reinvent any of these per game):
- `TableShell.tsx` — the full-viewport table wrapper every game renders into.
- `HomeTopBar.tsx` — every home splash screen's (`/`, `/coinche`, `/bouilla`, `/president`, `/bataillecorse`) back (top-left) and paramètres (top-right) buttons: pixel-identical placement everywhere, one settings panel (language +, when a `game` prop is passed, "Règles" opening `RulesModal`) — never a second/duplicate control for something already in that panel.
- `GameHud.tsx`'s `GameInfoButton` — the equivalent paramètres button once a game is in progress (all 4 tables use it).
- `TrickStage.tsx` — the played-card animation primitives: `playedCardEnterStyle`/`EnterDirection`, `CompletedTrickHold`, `CardBackFanH`/`CardBackStackV`, `seatDirection`.
- `PlayingCard.tsx` — the `PlayingCard`/`CardBack` primitives every card, hand, and pile renders with.
- `EmojiButton.tsx`, `ReactionBubble.tsx`, `SelfNameChip.tsx`, `PlayerBadge.tsx`, `gameTableHelpers.ts` — reactions and seat helpers.
- `HandCardSlot.tsx` — the tap-a-legal-card-to-play-it-immediately fan slot (Coinche, Bouilla). Président's `HandArea` is deliberately its own (select 1-4 same-rank cards, then confirm) — a legitimate per-game difference, not duplication to fix.
- The instant-local-feel hooks below — one per genuinely distinct action shape, not one per game.

Rules access: exactly one entry point per game — inside its paramètres panel. Never a separate floating "Règles" button alongside an already-existing settings button.

Before writing new per-game animation/interaction/chrome code: check whether the base above already covers it, or is a small, obviously-generalizable extension of something it already does.

## Card games — simulate instant/local feel online

Every card game's table (online, ad-hoc/P2P, or any server-round-trip mode) MUST make its own player's move feel as instant as local pass-and-play. A tap must visibly react on the same frame, never wait for the network response before showing anything. Reflect the local player's own action optimistically, then reconcile with the server's real state once it arrives — rolling back only on an actual failure.

Reuse the existing shared hooks — one per genuinely distinct action shape:
- `lib/client/useOptimisticPlay.ts` — any turn-based "play a known card from my hand" action (Coinche's `GameTable`, Bouilla's `BouillaTable`).
- `lib/client/usePresidentOptimisticPlay.ts` — Président's "play a 1-4 card combo, or pass" action.
- `lib/client/useOptimisticFlip.ts` — la Bataille Corse's "flip my own top card" action (`PlayerView.myTopCard` + `flushSync` via `useInstantPending`).

A brand-new action shape that doesn't fit any of the three still needs its own instant local simulation. This does not apply to reflecting an *opponent's* move — that is genuinely unknown until the network/broadcast delivers it.

## Conventions

- Naming: camelCase (TS), kebab-case (`data-id` attributes), snake_case (SQL).
- Formatting: default Next.js ESLint config.
- Error handling: Server Actions throw `Error` with stable codes (e.g. `"illegal_card"`); UI shows the code/message.
- Logging: none custom yet.
- Realtime is a lightweight tick (`game_events`) that triggers a redacted refetch; no secret data flows over realtime.
- Bots run client-side in the host browser: when a bot seat is to move, the host decides from that seat's redacted view and submits the move like a human (`submitBotMove`). Any seated human can take over via "Become host". The local solo game runs bots fully in-browser with no server.

## Retired doc

`docs/TECH.md` is superseded by this file. Kept on disk for now (not deleted) pending user confirmation — see the migration report. Do not add new content there.
