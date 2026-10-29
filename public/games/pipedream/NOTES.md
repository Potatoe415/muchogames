# Pipe Dream — notes for agents

Solo arcade (Microsoft Entertainment Pack remake). Vanilla ES modules, Canvas 2D,
Web Audio, no dependency. Read this before opening the sources.

## Files

| File | Role |
|---|---|
| `main.js` | Page shell: i18n, options panel (language, rules, sound), start screen ("Reprendre" + "Jouer"), overlays, `MuchogamesMatch.start/resume/finish`, pause (options open / tab hidden), save + destroy on `pagehide`. |
| `game.js` | `createGame({ stage, canvas, host, muted, saved, onLevelCleared, onGameOver, onMove })` → `{ nextLevel, current, summary, setPaused, setMuted, destroy }`. Owns loop, ResizeObserver, listeners, AudioContext. |
| `save.js` | Match in progress in `localStorage` (`encodeMatch` / `decodeMatch` / `loadMatch` / `storeMatch` / `clearMatch`), validated on load. |
| `rules.js` | Placement (`tryPlace`), fast-forward, phase machine `countdown → flow → leak → sweep → cleared/over`, scoring. |
| `board.js` | Grid cells, start tile + rock placement (rocks keep the quota reachable), `placementFor`, `openChannel`. |
| `flow.js` | Flooz propagation, edge to edge, `enter` / `leak` events. |
| `pieces.js` | Directions N/E/S/W, 7 pieces (`links` = channels), weighted FIFO queue. |
| `levels.js` | Points, timings, difficulty curve (`levelConfig(level)`). |
| `layout.js` | Queue/grid geometry (queue left in landscape, on top in portrait) + DPR-aware canvas surface. |
| `render.js`, `draw-pipe.js`, `effects.js` | Frame drawing, tile/pipe/flooz/rock drawing, particles and score labels. |
| `hud.js`, `input.js`, `audio.js`, `loop.js`, `i18n.js` | DOM HUD, pointer/keyboard, synthesized sounds, fixed 60 Hz loop, FR/EN/ES copy + rules. |

## Rules in code

- Cell kinds: `empty`, `pipe` (`type`, `fills[]` one per channel, `lock` seconds), `start` (`dir`), `rock`.
- Grid 10x7 landscape, 7x10 when the stage is portrait at level start.
- Tap empty cell = place; tap unused, unlocked pipe = replace (−50, 0.6 s lock, flooz treats it as a wall).
- Tile entered = +50; second axis of a cross = +500. Unused pipes after a cleared level = −100 each. Score never below 0.
- No `won` is sent to `finish()`: the run always ends on an overflow, only the score matters. Best score: `pipedream-best-score`; sound: `pipedream-sound`.

## Save (decision 0054)

- Key `pipedream-current`, JSON `v: 1`: level, phase (`countdown`/`flow`/`leak`/`sweep`/`cleared`), timer, fast mode, score, filled, crosses, removed, sweep queue, piece queue (5 types, in order), board (cols, rows, start, every cell with its fills/progress/lock/prevType/rock seed) and the flooz head (x, y, channel, exit, leak). `config` is rebuilt from `levelConfig(level)`; particles and score labels are dropped.
- Saved at match start (after `MuchogamesMatch.start` resolves true), after every placement/replacement and fast toggle (`onMove`), after "Niveau suivant", every 1 s while mounted, and on `pagehide` / tab hidden. A corrupt save is removed on load.
- "Reprendre" (`pipedream-continue-button`; `pipedream-resume-button` is the pause overlay's) shows only when a valid save exists. It calls `MuchogamesMatch.resume()` (no coin) and the match comes back paused, or on the level-cleared card if saved in `cleared`.
- Leaving (back button, reload, closed tab, bfcache `pageshow`) never calls `finish()` and keeps the save. The save is deleted at game over (where `finish()` runs) and overwritten by a new match.
