# Yatzy (`yatsy`) — notes

Local 2-player, solo vs robot, and online duel (`/shared/js/online-room.js`).
Classic scripts sharing one global scope, loaded in `index.html` order.
Excluded from Prettier on purpose: do not reformat files wholesale.

## Files

| File | Role |
|---|---|
| `app.js` | `state` (single source of truth), local/robot/defeat-mode gameplay, scoring flow, wiring |
| `render.js` | DOM projection of `state` (`createRenderer`), the options sheet, the end-of-match card |
| `styles.css` | Portrait phone base skin |
| `screens.css` | Landscape phones + wide screens: board left, dice/roll right; end-of-match buttons |
| `tv.css` | Desktop/TV sizing (dvh-based root size, 3% overscan), `html.tv :focus` ring |
| `session.js` | Online: create/join/resume a room, remote state sync, seat storage |
| `resume.js` | Local match save, splash "Reprendre" buttons, online away/back notices |
| `robot.js`, `scoring.js`, `random.js` | Robot decisions, category scores, dice RNG |
| `config.js`, `i18n.js` | Categories/players/robot timings, FR/EN/ES copy |
| `storage.js` | Raw `localStorage` helpers |
| `emoji.js`, `gif-picker.js` | Reactions |
| `sw.js` | Offline cache — bump `CACHE_NAME` (`yatzy-offline-vNN`) when shipping file changes |

## Storage keys

- `yatzy-local-game-session` — local match save (below).
- `muchogames_yatsy_best` — solo (vs robot) best total, integer. Written at game over in robot mode only; never in the save.
- `yatzy-online-session` — online seat `{ gameCode, role, resumeToken, localPlayerIndex }`.
- `yatzy-charged-match` — room code already paid (`MuchogamesRoom.chargeOnce`).
- `yatzy-rule-settings`, `yatzy-reverse-selection`, `yatzy-extra-roll-easter-egg`,
  `yatzy-defeat-mode-enabled` — preferences, not match state.

## Local save (`version: 2`)

Written after every render while a local match is on screen, and on
`pagehide` / `visibilitychange`. Holds mode, dice theme, the match's rules,
per-player reverse selection, dice (values + kept), rolls left, turn phase,
scores, current player, defeat-mode flags, pending selection, the score-undo
window (`lastCommittedTurn` + remaining ms), and the secret-roll counters.
Not saved: animations, toasts, robot queued move (recomputed from the board).

- Home button (`yatsy-home-button`, `data-match-quit`): keeps the save, no `finish()`.
- Splash shows `yatsy-resume-button` when a valid save exists; it never reopens by itself.
  Click → restore + `MuchogamesMatch.resume()`.
- Deleted at game over (render with `gameOver`). Replaced by a new match
  (mode buttons, restart button).

## Options, end screen, TV

- One options sheet (`#settings-panel`, `game-options-panel`): the splash gear owns it
  (`initOptionsPanel`), the in-game gear (`yatsy-game-settings-button`) toggles the same sheet.
  Splash shows the rule settings; in a match only the current player's reverse-dice toggle
  (rules reset the scorecard). Rules `<details>` is always present and closed.
- Mode names are swapped in code: mode `solo` = local 2-player (`yatsy-solo-game-button`),
  mode `robot` = real solo vs bot (`yatsy-robot-game-button`). finish(): robot `{ won, score }`
  (tie: `{ score }`), online `{ won, score }` for the local seat, local 2-player `finish()`.
- End card (`yatsy-gameover-overlay`, `data-tv-overlay`): `yatsy-replay-button` (local only, new coin)
  and `yatsy-menu-button` (local: splash; online: leaves the room).
- TV: `tv-remote.js`; screens toggle `hidden` (`yatsy-splash-screen`, `yatsy-game-card`).
  `render()` rebuilds dice/cells, so app.js `restoreFocus()` puts the focus back on the same data-id.

## Online

- Home button: sends notice `{ type: "presence", seat, away: true }`, flushes
  pending writes, stops listening; room and stored seat are kept.
- `pagehide` / tab hidden also sends `away: true` (best effort); tab visible sends `away: false`.
- Splash shows `yatsy-resume-online-button` for the stored seat; click →
  `resumeGame` (no coin: `chargeOnce` sees the paid code) then `away: false`.
- The opponent shows `yatsy-opponent-away-banner` until `away: false` arrives.
  Presence is ephemeral: an opponent who reloads does not know the other is away.
- Restart button online ("Quitter"): deletes the room while the match is
  unfinished, so the opponent gets "room closed" (within one poll, ≤ 15 s).
- Game over clears the stored seat. Cancel while waiting deletes the room.
