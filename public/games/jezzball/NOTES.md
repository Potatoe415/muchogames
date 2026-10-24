# JezzBall — notes for agents

Solo arcade (Microsoft Entertainment Pack remake). Vanilla ES modules, Canvas 2D,
Web Audio, no dependency. Same split as `pipedream`; `loop.js` and `effects.js`
are verbatim copies of Pipe Dream's. Read this before opening the sources.

## Files

| File | Role |
|---|---|
| `main.js` | Page shell: i18n, options panel (language, rules, sound), start screen, overlays, `MuchogamesMatch.start/finish`, pause (options open / tab hidden), destroy on `pagehide`. |
| `game.js` | `createGame({ stage, canvas, host, muted, best, onLevelCleared, onGameOver })` → `{ nextLevel, setPaused, setMuted, destroy }`. Owns loop, ResizeObserver, listeners, AudioContext, field cache. |
| `rules.js` | Wall launch, axis toggle, two-finger cancel, ray/ball hits, capture + scoring, lives, timer, level end. |
| `grid.js` | `Uint8Array` cells `EMPTY / SOLID / GROW_1 / GROW_2`, border ring, `solidify`, multi-source BFS `unreachedCells`, capture glow. |
| `walls.js` | Dual-ray wall: `pivot` grid line, ray 1 left/up, ray 2 right/down, `growWall`, `rayRect`, `breakRay`. |
| `balls.js` | Spawn, sub-stepped motion (≤ 0.2 cell), per-axis square-box collision against `SOLID`, ball/ball swap, `touchesRect`. |
| `levels.js` | Grid size, speeds, points, `levelConfig(level)`. |
| `layout.js` | Integer cell size, centered grid, DPR-aware canvas surface. |
| `render.js`, `draw-field.js`, `draw-ball.js` | Frame drawing; static field cached off-screen (repainted on `grid.version` / size change); red/white atoms. |
| `hud.js`, `input.js`, `audio.js`, `loop.js`, `effects.js`, `i18n.js` | DOM HUD + axis button, pointer/wheel/keyboard, synthesized sounds, fixed 60 Hz loop, particles, FR/EN/ES copy + rules. |

## Rules in code

- Grid 32x22 inside a 1-cell border; 22x32 when the stage is portrait at level start.
- One wall at a time. Each ray solidifies on its own when it meets `SOLID`; a ball box touching a live ray breaks that ray only (−1 life).
- A finished ray is hit-tested at full length before solidifying, so a ball never ends up inside a solid cell.
- After each solidified ray: BFS from every ball cell through non-solid cells; unreached `EMPTY` cells become `SOLID`.
- Level N: N+1 balls, N+1 lives, `60 + 20N` s. Timer at 0 = −1 life and the timer restarts.
- Points ×N: 1 per new solid cell; at ≥ 75 %: 50 per whole % above 75 and 10 per second left.
- Two-finger tap: cancels a wall launched < 0.15 s earlier by the first finger (if nothing solidified) and flips the axis.
- Double-tap option (off by default): a tap builds a vertical wall after 0.26 s; a second tap inside that window builds a horizontal wall on the first tap's cell. Axis button, hover preview and two-finger toggle are off in that mode.
- No `won` is sent to `finish()`: the run always ends on game over. Best score: `jezzball-best-score`; sound: `jezzball-sound`; double tap: `jezzball-double-tap`.
