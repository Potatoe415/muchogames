# Fusion de fruits — notes for agents

Solo merge puzzle in the spirit of Suika / Watermelon Game: drop fruits into a crate, two identical fruits that touch merge into the next one, up to the watermelon. Vanilla ES modules, Canvas 2D, Web Audio, own circle physics, no dependency and no image asset besides the hand-made SVG hub tile. `loop.js` is a verbatim copy of Fruit Slash's / JezzBall's; `audio.js` follows Fruit Slash's pattern. TV remote through the shared `/shared/js/tv-remote.js`. Read this before opening the sources.

## Files

| File | Role |
|---|---|
| `main.js` | Page shell: i18n, options panel (language, sound, collapsed rules), start screen (resume, play, how-to, record), pause/end overlays, `MuchogamesMatch.start/resume/finish`, pause (options open, how-to open, tab hidden, ⏸, `P`), save + destroy on `pagehide`. |
| `game.js` | `createGame({ canvas, host, saved, muted, onHud, onEnd })` → `{ setPaused, setMuted, sweep, undo, snapshot, destroy }`. Owns the loop, ResizeObserver (canvas fitted to the board, ≤ 3× pixel ratio), input, audio, effects. |
| `world.js` | Pure match state: queue (held + next 3), `drop`, `undo`, `sweep`, merges, danger timer and loss. |
| `physics.js` | Circles in the box: gravity, impulse collisions with position correction, friction, walls/floor. 8 substeps × 2 iterations, O(n²). |
| `fruits.js` | The 11 fruits (radius, colours, decoration), drop weights, points. |
| `fruit-art.js`, `sprites.js` | Procedural kawaii fruit (shaded body, skin pattern, leaves/stem/crown, face); sprite cache per level and pixel size; `paintIcon` for HUD canvases. |
| `render.js`, `effects.js` | Box (cached layer), danger line, aim guide, held fruit, fruits; juice drops, ring, floating "+N". |
| `hud.js`, `howto.js` | Score, next 3, broom/undo counts, danger banner, fruit-order bar; the 8-page "how to play" dialog. |
| `input.js` | Touch/pen press-slide-release, mouse follow + click, ←/→ + Enter/Space/↓ on the focused board. |
| `i18n.js`, `copy.js`, `prefs.js`, `save.js`, `audio.js`, `loop.js` | UI copy; fruit names, tips, rules; settings + record; match save; sounds; fixed 60 Hz loop. |
| `styles.css`, `start.css`, `stage.css` | Frame/cards/buttons/overlays/TV focus ring, start screen + how-to, play stage. |

## Rules in code

- Units: box 1 wide × 1.55 tall, y down. Danger line at y 0.2, held fruit at y 0.1. Only levels 0–4 drop (weights 30/25/20/15/10). 0.45 s between drops.
- Merge: same level touching → one fruit of the next level at the midpoint (`pointsFor(level)` = level·(level+1)/2). Two watermelons both vanish, +100.
- Loss: any fruit at least 1 s old (merged fruits count at once) above the line for 3 s in a row. No `won` sent to `finish()` (score attack); record in `fruitmerge-best`.
- 🧹 Broom: 2 per match, removes every blueberry and strawberry (levels 0–1); it also drops the undo step. ↶ Undo: 3 per match, restores the state just before the last drop (one step).
- How-to opens before the very first match (`fruitmerge-howto-seen`), and from the start screen / pause.
- Layout: portrait = tools / board / fruit bar; landscape = tools left, board centre, fruit bar right (2 columns). Root font 2.4vmin (16px min). Start screen, stage and overlays pad with rule 6.2 (`--fm-pad-*` on `.fm-app`: bottom ≥ 40px, sides ≥ 24px, safe areas included); ≥ 960×500 the header grows (boilerplate block) and the sides go to 3vw, bottom max(40px, 4dvh).
- Dashboard ids predate the spec names and are kept: `fruitmerge-play-button` (new game), `fruitmerge-start-best` (best), `fruitmerge-score-value` (live score), `fruitmerge-end-best` (end-screen best).
- TV (`?tv=1` or TV user agent, `tv-remote.js`): focus lands on Reprendre/Jouer, the board, or the overlay's main button. On the board ←/→ aim, OK or ↓ drops, ↑ leaves the board. Back = pause on the stage, continue on pause, menu on the end card, OK on the how-to.

## Saved match (decision 0054)

- Key `fruitmerge-current`, JSON `v: 1`: score, merges, top, danger, queue, bodies (`level x y vx vy angle age`), aim, cooldown, sweeps, undos, undo (same step fields or `null`). Not saved: effects, merge-grow animation.
- Written at match start, on every HUD change (drop, merge, tool), every 1 s, on `visibilitychange` hidden and `pagehide`. `snapshot()` returns `null` once lost.
- `decodeMatch` drops the save unless every number is finite and in range, levels are known, the queue only holds droppable levels and counts stay within their per-match limits.
- Start screen `fruitmerge-resume-button` restores it paused (`fruitmerge-continue-button` is the pause overlay's) and calls `MuchogamesMatch.resume()`. Deleted at the loss, before `finish()`.
