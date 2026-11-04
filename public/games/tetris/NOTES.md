# Tetris — notes for agents

Solo Tetris on the Guideline rules. Vanilla ES modules, canvas drawing, Web Audio, no dependency, hand-made SVG hub tile. TV remote through the shared `/shared/js/tv-remote.js`. Read this before opening the sources.

## Files

| File | Role |
|---|---|
| `main.js` | Page shell: i18n, options (language, sound, start level 1-10, collapsed rules), start screen (resume, play, best), pause/end overlays, `MuchogamesMatch.start/resume/finish`, save on every HUD report + `visibilitychange` + `pagehide`. |
| `game.js` | `createGame({ host, canvases, saved, startLevel, muted, canPlay, onHud, onLock, onEnd, onPause })` → `{ snapshot, setMuted, releaseKeys, destroy }`. Wires engine, view, input, gestures, loop, audio; sizes the canvases (`--cell`). |
| `engine.js` | Pure rules (no DOM): `createEngine({ startLevel, rng, saved })` → `{ state, move, rotate, hardDrop, hold, tick(dt, soft), drain, snapshot }`. Events from `drain()`: move, rotate, hold, hard, lock `{lines, spin, combo, points, b2b}`, level, over. |
| `flow.js`, `motion.js` | Spawn / lock / score / game over; move, rotate with SRS kicks, lock-delay bookkeeping. |
| `pieces.js`, `grid.js`, `bag.js`, `tspin.js`, `scoring.js` | Shapes + kick tables; 10×(20+2 hidden) grid; 7-bag; 3-corner T-spin; scores + gravity curve. |
| `loop.js`, `input.js`, `repeater.js`, `keys.js`, `gesture.js` | rAF loop; keyboard / remote / pads; DAS/ARR; key map; touch gestures on the well. |
| `view.js`, `hud.js`, `audio.js`, `synth.js` | Canvas drawing (well, ghost, hold, next 5); stats + toast; sounds. |
| `i18n.js`, `prefs.js`, `save.js` | FR/EN/ES copy + rules; language, sound, start level, best; match save. |
| `styles.css`, `screens.css`, `stage.css` | Frame/cards/overlays/TV ring; start screen; play stage + pads. |

## Rules in code

- Spawn at columns 4-6 (I 3-6, O 4-5) in the hidden rows, drops one row at once. Gravity `(0.8-(L-1)*0.007)^(L-1)` s/row (curve capped at level 20), soft drop 20×. Lock delay 0.5 s, max 15 resets (reset count refills when the piece reaches a new lowest row).
- Score: 100/300/500/800 × level; soft 1/cell, hard 2/cell; T-spin full 400/800/1200/1600, mini 100/200/400; B2B ×1.5 on Tetris and line-clearing T-spins (zero-line T-spins keep the state); combo 50 × combo × level. Level = start level + lines/10.
- Game over: block out (spawn overlaps) or lock out (piece locked fully above the visible field without clearing).
- `won` for `finish()` = reached 40 lines. One best score (`tetris-best`).
- Controls: arrows, Space/Enter hard drop, Up/X cw, Z/Ctrl ccw, C/Shift hold, P/Esc pause. Touch: pads, drag/flick/tap on the well. TV: arrows + OK, red = hold, green = ccw, Back = pause.
- Layout: portrait = play area on top, pads below; short landscape = pads left/right; ≥ 900×500 pads hidden. `--cell` is measured from the play area.

## Saved match (decision 0054)

Key `tetris-current`, JSON `v: 1`: the whole engine state (grid, bag, queue, piece, hold, score, timers…). `decodeMatch` validates every field and checks the piece does not overlap the grid. A resumed match comes back paused.
