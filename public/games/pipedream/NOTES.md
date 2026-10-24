# Pipe Dream — notes for agents

Solo arcade (Microsoft Entertainment Pack remake). Vanilla ES modules, Canvas 2D,
Web Audio, no dependency. Read this before opening the sources.

## Files

| File | Role |
|---|---|
| `main.js` | Page shell: i18n, options panel (language, rules, sound), start screen, overlays, `MuchogamesMatch.start/finish`, pause (options open / tab hidden), destroy on `pagehide`. |
| `game.js` | `createGame({ stage, canvas, host, muted, onLevelCleared, onGameOver })` → `{ nextLevel, setPaused, setMuted, destroy }`. Owns loop, ResizeObserver, listeners, AudioContext. |
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
