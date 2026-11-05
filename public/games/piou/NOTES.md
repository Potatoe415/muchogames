# Piou — notes for agents

Solo one-button arcade game (original take on the "flap between pipes" genre — own name, own canvas-drawn bird, own synthesized sounds; nothing taken from Flappy Bird). The bird falls, every press flaps, pipes scroll in with a random gap; 1 point per pipe passed, any touch of a pipe, the ground or the ceiling ends the match. Vanilla ES modules, canvas, Web Audio, no dependency, hand-made SVG hub tile. TV remote through the shared `/shared/js/tv-remote.js`. Read this before opening the sources.

## Files

| File | Role |
|---|---|
| `main.js` | Page shell: i18n, options panel (language, sound, collapsed rules), start screen (resume, play, best), pause / end overlays, "Tape pour jouer" hint, `MuchogamesMatch.start/resume/finish`, save, best score. |
| `game.js` | `createGame({ area, canvas, audio, saved, canPlay, onHud, onEnd })` → `{ hold, snapshot, destroy }`. rAF loop (dt capped at 50 ms), input, resize; HUD report on every event and at least once a second (that report is the ~1 s save throttle). |
| `engine.js` | Pure rules (no DOM, runs in Node): world 100 units tall, ground at 88, width = screen aspect ratio. `createEngine({ width, saved, rng })` → `{ state, flap, hold, setWidth, tick(dt), drain, snapshot }`. Phases `ready` (frozen, waits for a flap) → `play` → `over` (0.9 s fall, then the `end` event). Events: flap, point, hit, end. |
| `view.js`, `art.js` | Canvas drawing in world units (sky, parallax clouds, pipes, scrolling ground, bird tilted by its speed); DPR capped at 3. |
| `audio.js` | Flap chirp, point ding, hit thud (Web Audio, unlocked on the Play / Resume click). |
| `i18n.js`, `prefs.js`, `save.js` | FR/EN/ES copy + rules; language (`bergamots-lang`, shared), sound (`piou-sound`), best (`piou-best`); match save. |
| `styles.css`, `stage.css` | Frame, cards, buttons, overlays, TV ring; start screen + play stage (canvas fills it, score on top, pause button top-right, hint). |

## Rules in code

- Gravity 260 u/s², flap sets vy to −72 u/s, max fall 110 u/s. Pipes 14 u wide scroll at 34 u/s, one every 54 u, first one 24 u after the first flap; gap 27 u, centre random but ≥ 9 u from the sky and the ground. Bird: circle r 3.6 at x 22. A wide screen shows more pipes ahead; the bird's x and the difficulty do not change with the screen.
- Collision = circle vs. the two rectangles of each pipe, plus y − r ≤ 0 (ceiling) or y + r ≥ 88 (ground).
- `finish({ score })` without `won` (no win in an endless runner). Best saved the moment the end card shows.
- Input: `pointerdown` on the play area (touch / mouse; `touch-action: none`, no click delay, no scroll / zoom), Space / ↑ / W anywhere except on another focused control, Enter / OK on the focused play area. TV: the play area takes the focus at match start and declares `data-tv-keys="up"` so ↑ flaps instead of moving the focus; Back = pause.
- Pause: ❚❚, opening the options, or the page going hidden. The bird freezes ("Tape pour repartir"); after Continue the next tap resumes.

## Saved match (decision 0054)

- Key `piou-current`, JSON `v: 1`: `y`, `vy`, `pipes` (`x`, `gap`, `scored`), `nextIn`, `score`, `dist`. Every field is range-checked on load.
- Written at every HUD report (each flap / point, and ≥ once a second), on pause and on `pagehide`; deleted at the moment of the hit, before the end card and `finish()`.
- Start screen `piou-resume-button` restores it (comes back frozen, speed reset to 0) and calls `MuchogamesMatch.resume()`.
