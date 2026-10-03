# PLATFORM RULES — the common base of every game

Living document. Every game on Muchogames follows these rules: the in-repo
games (`public/games/*`, the wordpack shell), the colocated apps
(`apps/coinchapp`, `apps/tranquil`) and any future game. A game that cannot
follow one of them needs an explicit, documented exception here — never a
silent one.

`npm run check` enforces the rules marked **[checked]** through
`scripts/check-games.mjs`. Known gaps in existing games are listed in
`scripts/check-games.baseline.json`; that list only ever shrinks. A new game
never goes in the baseline.

How to build a game: `docs/NEW_GAME.md`. Shared APIs: `shared/CONTRACT.md`.

---

## 1. Navigation chrome

- **Back button**, top-left, `data-id="game-back-button"` **[checked]**.
  Always returns to the hub. During a match in progress it first asks
  "Quitter la partie ?" (FR/EN/ES) — handled by `game-session.js` for any
  element carrying that `data-id`, so a game writes no code for it.
- An in-match screen may replace the back button with a ✖ that returns to
  the game's own start screen. It carries `data-match-quit` (same
  confirmation) and ends the match with `finish()`.
- **Options button**, top-right gear, always visible, `data-id="game-options-button"`,
  opening one panel `data-id="game-options-panel"` **[checked]**, wired with
  `GameHeader.initOptionsPanel` **[checked]**.
- The options panel always contains, in this order:
  1. Language FR/EN/ES, `data-id="game-options-language"` **[checked]**.
  2. Game rules, `data-id="game-options-rules"` **[checked]**.
  3. Game-specific options, if any.
  4. "Report a problem" — appended automatically by `initOptionsPanel`.
- In-repo games load `/shared/css/game-header.css` and
  `/shared/js/game-header.js` **[checked]**. A game may re-skin the buttons'
  colors, never move or replace them.
- Colocated apps reproduce the same placement, `data-id`s and panel content
  in their own stack **[checked: back/options `data-id`s]**.

## 2. Match lifecycle

A **match** ("partie") is one playthrough with a start and an end: a Yatzy
game, a Millionaire run, a coinche game, a Taboo session started from its
start button. Opening a game, reading its rules or changing settings is not
a match.

- In-repo games load `/shared/js/game-session.js` **[checked]** and call:
  - `MuchogamesMatch.start(gameId)` when the player starts a match,
    including "play again" **[checked]**. It resolves `false` when the match
    must not start (out of coins); the game then stays on its start screen.
  - `MuchogamesMatch.finish({ won, score })` when the match ends
    **[checked]**. Omit `won` when there is no individual result.
  - A game with no end at all (Black Stories: riddles until you leave)
    declares `"endless": true` in its `public/hub-config.json` entry and
    never calls `finish`; its match lasts until the player leaves.
- Colocated apps call the SQL function `start_muchogames_match` from their
  server when a match starts **[checked]**, and report results through
  their existing profile sync.

## 3. Coins

- 10 coins per day, back to 10 at midnight Europe/Paris. Admins are
  unlimited.
- **Opening a game is free. Starting a match costs 1 coin**, every match,
  including "play again". The coin is spent by `MuchogamesMatch.start` (or
  `start_muchogames_match` server-side), never by the hub tile.
- Out of coins: the match does not start and the shared dialog shows
  "Vous n'avez plus de pièces pour aujourd'hui. Revenez demain !".
- One counter per player, shared by every game: signed-in players by
  profile id, anonymous players by a random device id the hub creates and
  forwards to cross-origin apps. Both live server-side.
- A server or network failure lets the match start: a backend incident
  never blocks play.
- Exception: games whose code is not in this repo cannot report a match
  start. Their `public/hub-config.json` entry declares
  `"coinPolicy": "launch"` and the hub charges the coin when the tile is
  opened **[checked: every external game declares either this or a
  colocated `source`]**. Today: `easyfrog`, `gameboy-web`.

## 4. Statistics

- **Matches started**: counted for every match, by `start`.
- **Won / lost**: only when there is one unambiguous local player — solo vs
  a bot, or an online seat. Never for several players sharing one device
  (Yatzy local 2-player, Pyramide teams).
- Party games with no individual winner record "started" only: Taboo,
  Dessiner c'est gagné, Téléphone bizarre, Dictionnaire, Black Stories, Jeu
  de mains, Salade de Cafards, Pyramide.
- `/profile` shows started / won / lost per game; `/admin` ranks games by
  matches started.

## 5. URLs

- **No `*.vercel.app` URL anywhere in code** **[checked]**. In-repo links
  are relative; the hub's absolute URL is `https://www.muchogames.win/`.
- A game is launched only from its `public/hub-config.json` entry
  (`docs/NEW_GAME.md`).

## 6. Also required (see `docs/NEW_GAME.md` and `AGENTS.md`)

FR/EN/ES copy, `data-id` on every meaningful element, shared visual chrome,
file/function size limits, one `docs/GAMES_MAP.md` row.
