# Tetris — notes for agents

Solo Tetris: Guideline pieces and SRS rotation with the original Game Boy (1989) scoring, speeds and start levels 0-9. Vanilla ES modules, canvas drawing, Web Audio, no dependency, hand-made SVG hub tile. TV remote through the shared `/shared/js/tv-remote.js`. Read this before opening the sources.

## Files

| File | Role |
|---|---|
| `main.js` | Page shell: i18n, options (language, sound, collapsed rules), start screen (start level slider 0-9, ghost checkbox, resume, play, best), pause/end overlays, rocket before the end card, `MuchogamesMatch.start/resume/finish`, save on every HUD report + `visibilitychange` + `pagehide`. |
| `game.js` | `createGame({ host, canvases, saved, startLevel, ghost, muted, canPlay, onHud, onLock, onEnd, onPause })` → `{ snapshot, setMuted, releaseKeys, destroy }`. Wires engine, view, input, gestures, loop, audio; sizes the canvases (`--cell`). |
| `engine.js` | Pure rules (no DOM): `createEngine({ startLevel, ghost, rng, saved })` → `{ state, move, rotate, hardDrop, tick(dt, soft), drain, snapshot }`. No hold piece. Events from `drain()`: move, rotate, hard, lock `{lines, points}`, level, over. `ghost` is only carried in the state for the save. |
| `flow.js`, `motion.js` | Spawn / lock / score / game over; move, rotate with SRS kicks, lock-delay bookkeeping. |
| `pieces.js`, `grid.js`, `bag.js`, `scoring.js` | Shapes + kick tables; 10×(20+2 hidden) grid; 7-bag; Game Boy points + speeds. |
| `rocket.js` | End-of-match rocket: tier 1-4 at 100k / 150k / 200k / 250k points; 3.8 s, tap to skip. |
| `loop.js`, `input.js`, `repeater.js`, `keys.js`, `gesture.js` | rAF loop; keyboard / remote / pads; DAS/ARR; key map; touch zones + gestures on the stage. |
| `view.js`, `hud.js`, `audio.js`, `synth.js` | Canvas drawing (well, ghost when the match has it, next 1; preview boxes sized by CSS); stats + toast; sounds. |
| `i18n.js`, `prefs.js`, `save.js` | FR/EN/ES copy + rules; language, sound, start level, ghost, best; match save. |
| `styles.css`, `screens.css`, `stage.css` | Frame/cards/overlays/TV ring; start screen + slider + checkbox + rocket; play stage + HUD + zone hints + pads. |

## Rules in code

- Spawn at columns 4-6 (I 3-6, O 4-5), whole on the first visible row (no Guideline one-row drop); the 2 hidden rows only take rotation kicks. Pastel piece colours (`pieces.js`, logo in `screens.css`). Gravity = Game Boy frames per row at 59.73 fps (level 0: 53 … level 9: 11 … level 20+: 3), soft drop 20× (min 0.02 s/row). Lock delay 0.5 s, max 15 resets (reset count refills when the piece reaches a new lowest row).
- Score (Game Boy): 40/100/300/1200 × (level + 1); 1 point per cell for soft and hard drop. No T-spin, back-to-back or combo. Level = start level (0-9) + lines/10.
- Game over: block out (spawn overlaps) or lock out (piece locked fully above the visible field without clearing). At 100 000+ points the rocket plays before the end card.
- `won` for `finish()` = reached 40 lines. One best score (`tetris-best`).
- Controls: arrows, Space/Enter hard drop, Up/X cw, Z/Ctrl ccw, P/Esc pause. Touch/mouse on the whole stage (`gesture.js`): left of the well and its first 2 columns = left, its last 2 columns and right of it = right (held = DAS/ARR), below it = soft drop while held; on the middle 6 columns a single tap does nothing, double tap (< 300 ms, < 1.5 cells apart) = hard drop, swipe up = cw, drag = move / soft drop, flick down = hard drop. Touch pads under the well (`(pointer: coarse)` only): ◀, bar = hard drop, ▶, ↻. TV: arrows + OK, green = ccw, Back = pause.
- Layout: portrait = HUD row on top (score, lines, level | next, best, pause), well below; landscape = HUD columns left and right. HUD and pads sized in rem so they never feed `--cell`. `--cell` is measured from `.tr-play`; on `(pointer: coarse)` it keeps `--tr-zone-cells` (1.6) per side and 1.3 × the pad row height below, and the well sits at the top.

## Saved match (decision 0054)

Key `tetris-current`, JSON `v: 1`: the whole engine state (grid, bag, queue, piece, score, timers, ghost…; older saves' hold fields are ignored). `decodeMatch` validates every field and checks the piece does not overlap the grid; start level must be 0-9; a save without `ghost` plays without it. A resumed match comes back paused.
