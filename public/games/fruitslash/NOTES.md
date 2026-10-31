# Fruit Slash — notes for agents

Solo arcade for kids, in the spirit of Fruit Ninja: swipe to slice what flies. Vanilla ES modules, Canvas 2D, Web Audio, emoji as sprites, no dependency and no image asset besides the hand-made SVG hub tile. `loop.js` is a verbatim copy of JezzBall's; `audio.js` follows the same pattern. Read this before opening the sources.

## Files

| File | Role |
|---|---|
| `main.js` | Page shell: i18n, options panel (language, sound, collapsed rules), start screen (resume, theme tiles, two level buttons, records), HUD, pause/end overlays, `MuchogamesMatch.start/resume/finish`, pause (options open, tab hidden, ⏸, `P`), save + destroy on `pagehide`. |
| `game.js` | `createGame({ canvas, host, saved, mode, theme, muted, t, onHud, onEnd })` → `{ setPaused, setMuted, snapshot, destroy }`. Owns the loop, ResizeObserver, input, AudioContext. |
| `world.js` | Pure simulation: `createWorld`, wave spawner, gravity, `cutItem` (two halves), `itemsOnSegment` hit test. |
| `scoring.js` | What a blade segment does: points, bonus star, bombs, stroke combos, matching effects and sounds. |
| `rules.js` | Modes (`kids`, `ninja`), match length, penalties/bonuses, combo rule, end stars. |
| `themes.js` | The 5 emoji sets + `mix`, bomb, bonus star, juice colours. |
| `save.js` | `fruitslash-current` match save: `encodeMatch`, validating `decodeMatch`, `loadMatch / storeMatch / clearMatch`. |
| `blade.js`, `input.js` | Blade trail points (CSS px); pointer (one finger, press-drag) and arrow-key cursor feeding it. |
| `render.js`, `sprites.js`, `effects.js` | Night sky + light bubbles, halves clipped along the cut, emoji pre-rendered with baked glow, rainbow trail, juice/splash/sparkle/floating text/bomb flash. |
| `prefs.js`, `i18n.js`, `audio.js`, `loop.js` | Settings + best per mode, FR/EN/ES copy + rules, synthesized sounds, fixed 60 Hz loop. |
| `styles.css`, `start.css`, `stage.css` | Frame/cards/buttons/overlays, start screen, play stage + HUD. |

## Rules in code

- 60 s per match. 1 point per item, 🌟 bonus = +5 points and +2 s (clock capped at 120 s). Falling items cost nothing.
- Combo: ≥ 3 items in one stroke (stroke = pointer down→up, or a pause of 0.35 s without a cut) earns +N for N items; best combo shown at the end.
- `kids` (Petit ninja): bigger (9.5 % of the short side), slower, 1–3 items per wave, no bombs. `ninja` (Grand ninja): 7.5 %, faster, 2–5 items, 30 % of waves carry a 💣 (−5 s, combo reset, flash + shake + vibrate). Waves speed up by 25 % over the match.
- Positions are fractions of the play area (x of width, y of height); size and hit radius come from the shorter side, so any screen and orientation plays the same.
- End: 1 to 3 stars (`MODES[mode].stars` thresholds), record per mode (`fruitslash-best-kids` / `-ninja`). No `won` sent to `finish()` (score attack).
- Prefs: `fruitslash-sound`, `fruitslash-theme`, `fruitslash-mode`, language in `bergamots-lang`.

## Saved match (decision 0054)

- Key `fruitslash-current`, JSON `v: 1`: mode, theme, score, sliced, bestCombo, timeLeft, elapsed, spawnClock, items (`e x y vx vy rot spin`), halves (same + `cut side`). Not saved: particles, splashes, texts, trail (cosmetic).
- Written at match start, every 1 s, on `visibilitychange` hidden and `pagehide`. `snapshot()` returns `null` once the clock hits 0.
- `decodeMatch` drops the save unless mode/theme are known, every emoji belongs to the theme (bombs only in `ninja`), and numbers are finite and in range.
- Start screen `fruitslash-resume-button` restores it paused (`fruitslash-continue-button` is the pause overlay's) and calls `MuchogamesMatch.resume()`. Deleted only at the end, before `finish()`.
