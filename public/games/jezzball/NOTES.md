# JezzBall — notes for agents

Solo arcade (Microsoft Entertainment Pack remake). Vanilla ES modules, Canvas 2D,
Web Audio, no dependency. Same split as `pipedream`; `loop.js` and `effects.js`
are verbatim copies of Pipe Dream's. Read this before opening the sources.

## Files

| File | Role |
|---|---|
| `main.js` | Page shell: i18n, options panel (language, sound, swipe, collapsed rules), start screen with "Reprendre", overlays, `MuchogamesMatch.start/resume/finish`, pause (options open / tab hidden), save + destroy on `pagehide`. |
| `game.js` | `createGame({ stage, canvas, host, muted, best, swipe, saved, onLevelCleared, onGameOver, onChange })` → `{ nextLevel, snapshot, setPaused, setMuted, setSwipe, destroy }`. Owns loop, ResizeObserver, listeners, AudioContext, field cache. |
| `save.js` | `jezzball-current` match save: `encodeMatch(state)`, validating `decodeMatch(text)`, `loadMatch / storeMatch / clearMatch`. |
| `rules.js` | Wall launch, axis toggle, two-finger cancel, ray/ball hits, capture + scoring, lives, timer, level end. |
| `grid.js` | `Uint8Array` cells `EMPTY / SOLID / GROW_1 / GROW_2`, border ring, `solidify`, multi-source BFS `unreachedCells`, capture glow. |
| `walls.js` | Dual-ray or single-ray wall: `pivot` grid line, ray 1 left/up, ray 2 right/down, `growWall`, `rayRect`, `breakRay`, `nearestDirection`, `joinHeadOn`. |
| `balls.js` | Spawn, sub-stepped motion (≤ 0.2 cell), per-axis square-box collision against `SOLID`, ball/ball swap, `touchesRect`. |
| `levels.js` | Difficulty modes (grid, speeds, target, lives, timer, points, head grace), `levelConfig(level, difficulty)`. |
| `prefs.js` | localStorage settings: language, sound, swipe, last difficulty, best score per difficulty, easy help seen. |
| `layout.js` | Integer cell size, centered grid, DPR-aware canvas surface. |
| `render.js`, `draw-field.js`, `draw-ball.js` | Frame drawing; static field cached off-screen (repainted on `grid.version` / size change); red/white atoms. |
| `hud.js`, `input.js`, `audio.js`, `loop.js`, `effects.js`, `i18n.js` | DOM HUD + axis button, pointer/wheel/keyboard, synthesized sounds, fixed 60 Hz loop, particles, FR/EN/ES copy + rules. |

## Rules in code

- Two difficulties, picked on the start screen (`jezzball-start-easy` / `jezzball-start-normal`, last one in `jezzball-difficulty`, reused by "Rejouer"). Normal is the original tuning; the numbers below are Normal's unless stated.
- Easy: grid 22x15, atoms 4.5 cells/s (Normal 7.5), walls 16 cells/s (Normal 11), N balls, N+3 lives, no timer (`config.time === 0`, HUD shows "—"), target 66 %, points ×0.5 (rounded), growing ray heads spared over 0.6 cell (`headGrace`, finished rays still tested full length). First easy match opens the `jezzball-intro` help overlay (paused) until `jezzball-intro-seen`.
- Best score per difficulty: `jezzball-best-score` (normal, unchanged key) and `jezzball-best-score-easy`.
- Both modes: finger preview of the coming wall while a swipe is pending (active axis, then drag direction after 5 px); `navigator.vibrate` on broken wall, captured area and level cleared.
- Grid 32x22 inside a 1-cell border; transposed when the stage is portrait at level start.
- Up to 2 walls at once (`state.walls`). The first has two rays; one launched while another grows has a single ray, like the original (swipe direction, else toward the nearest solid cell). Each ray solidifies on its own when it meets `SOLID`; a ball box touching a live ray breaks that ray only (−1 life).
- A ray reaching another wall's growing ray waits on it (finishes if it turns solid, goes on if it breaks); two rays meeting head-on on the same line both finish (`joinHeadOn`).
- A finished ray is hit-tested at full length before solidifying, so a ball never ends up inside a solid cell.
- After each solidified ray: BFS from every ball cell through non-solid cells; unreached `EMPTY` cells become `SOLID`.
- Level N: N+1 balls, N+1 lives, `60 + 20N` s. Timer at 0 = −1 life and the timer restarts.
- Points ×N: 1 per new solid cell; at ≥ 75 %: 50 per whole % above 75 and 10 per second left.
- Two-finger tap: cancels a wall launched < 0.15 s earlier by the first finger (if nothing solidified) and flips the axis.
- Swipe option (on by default, touch/pen only): the wall starts from the touched cell once the finger has moved 14 px, ← → horizontal, ↑ ↓ vertical; a finger lifted before 14 px is a tap, built on release along the active axis. Off: a tap builds on `pointerdown`. Axis button and two-finger toggle work in both modes. Mouse always uses click + axis toggles.
- No `won` is sent to `finish()`: the run always ends on game over. Sound: `jezzball-sound`; swipe: `jezzball-swipe`.

## Saved match (decision 0054)

- Key `jezzball-current`, JSON `v: 1`: level, `mode` (difficulty; absent in older saves = normal, which sets grid size, ball speed and target used by validation), phase (`play` or `cleared`), score, axis, lives, timer, percent/time bonuses, grid `cols`/`rows` + `cells` as one digit string (`0`–`3`, growing cells included), balls (`x y vx vy spin tilt`), walls (`axis pivot lane age solidified`, rays `dir length cells blockedBy growing finished broken`). Not saved: glow, effects, flash, hover (cosmetic); `percent`, `solid` and ray `kind` are recomputed.
- Written at match start, on `game.onChange` (wall launched, axis toggled, ray solidified (after its points are added), life lost with lives left, level cleared, next level), every 1 s while mounted, on `visibilitychange` hidden and `pagehide`. `snapshot()` returns `null` once `phase === "over"`, so a finished run is never stored.
- `decodeMatch` drops the save unless sizes, border ring, ball count/speed/position, walls and growing cells all agree.
- Start screen: `jezzball-continue-button` (shown only with a valid save, above "Jouer") restores it paused (or on the level-cleared card) and calls `MuchogamesMatch.resume()`. `jezzball-resume-button` is the pause overlay's.
- Deleted only on game over (before `finish()`); overwritten by a new match. Leaving (back button, reload, bfcache `pageshow`) keeps it and calls no `finish()`.
