# Simon — notes for agents

Solo memory game: the game lights and sounds a growing sequence of four colours, the player repeats it, one mistake ends the match. Score = rounds completed. Night-arcade skin, DOM pads (no canvas), Web Audio tones (no files), no dependency, hand-made SVG hub tile. TV remote through the shared `/shared/js/tv-remote.js`. Read this before opening the sources.

## Files

| File | Role |
|---|---|
| `main.js` | Page shell: i18n, options panel (language, sound, collapsed rules), start screen (resume, Easy / Normal toggle, play, best of the chosen level), pause / end overlays, `MuchogamesMatch.start/resume/finish`, save, owns the one `createAudio()` (unlocked on the Play click). |
| `game.js` | `createGame({ board, audio, saved, canPlay, onHud, onEnd })` → `{ snapshot, destroy }`. One match: phases `show` → `input` → (`show` of the next round) or `over`; all timers cleared on `destroy`. |
| `rules.js` | Pure: `PADS`, `DIFFICULTIES`, `extend(sequence)`, `timing(length, difficulty)` → `{ on, gap }` ms, `slowed(ms, difficulty)`, `check(sequence, step, pad)` → `wrong` / `next` / `done`, `isValidSequence`. Runs in Node. |
| `board.js` | Pad buttons: `light(pad, ms)`, `darken`, `setWaiting`. Presses: `pointerdown` (touch / mouse, no click delay), keyboard / remote click (`detail === 0`), digits 1-4; arrows move the focus between pads. |
| `audio.js` | Tones of the original Simon (green 415 Hz, red 310, yellow 252, blue 209), triangle + octave; low buzz on a mistake. |
| `i18n.js`, `prefs.js`, `save.js` | FR/EN/ES copy + rules (`translateCount` picks the singular `…One` key); language, sound (`simon-sound`), last level (`simon-difficulty`), best per level (`simon-best` = Normal, `simon-best-easy`); match save. |
| `styles.css`, `start.css`, `stage.css`, `pads.css` | Frame, cards, buttons, overlays, TV ring; start screen; HUD + board layout (largest square in the area, container units); pad colours (`[data-color]` → `--pad-dim` / `--pad-lit` / `--pad-glow`, also used by the start logo). |

## Rules in code

- Round = the sequence plus one random colour (the first round has one). Playback starts 0.8 s after the round begins; speeds (lit / gap ms): 600/220 for 1-5 colours, 500/180 for 6-9, 410/150 for 10-13, 330/120 from 14.
- Levels (picked on the start screen, Normal by default, last choice remembered): Normal = the speeds above, untouched. Easy = lead-in and every lit / gap time × 1.5 (`slowed`). Same rules, one mistake still ends. No answer time limit exists on either level. The HUD shows the level under the Record it belongs to; the end card names it.
- Presses only count in phase `input`, with no overlay and the options panel closed. A wrong pad: buzz, the wrong and the expected pads light for 1.3 s, then the end card; `finish({ score })` without `won` (no win in Simon).
- Pause: ☰ (Easy only: `simon-menu-button` is hidden in a Normal match, set in `mountGame`), opening the options, or the page going hidden. It stops playback; Continue replays the current round from its first colour. Not allowed during the 1.3 s mistake animation.
- Layout: portrait = HUD row on top, board below; landscape = HUD column left. Root font 2.4vmin (16 px min).
- Margins (PLATFORM_RULES 6.2): start screen, stage and overlays pad 40 px at the bottom and 24 px at the sides (or the safe areas, if larger). Desktop / TV (`min-width: 960px` and `min-height: 500px`): header buttons `max(36px, 6dvh)`, everything 3vw / 2dvh / `max(40px, 4dvh)` from the edges. Short landscape (`max-height: 500px`): start card and overlay cards in two columns (text left, buttons right) so they fit 640×360. Start screen order: best, Resume, levels, Play. Overlays only fade (a slide would scroll the page).
- TV (`?tv=1` or TV user agent): focus lands on Reprendre / Jouer, then the green pad; arrows move between pads (spatial focus), OK presses. Back = pause on the Easy stage (the ☰), leave to the hub on the Normal stage (header Back, with the match-leave confirmation; the save stays), Continue in the pause, Quit on the end card.

## Saved match (decision 0054)

- Key `simon-current`, JSON `v: 1`, `sequence` (1-999 ints 0-3), `difficulty` (`normal` / `easy`; missing = `normal`, for saves made before Easy). That is the whole state: a resumed match replays its current round from the start (so the player sees the sequence again), same as Continue after a pause.
- Written at match start and on every HUD change (each press, each new round); deleted at the moment of the mistake, before the end card and `finish()`.
- Start screen `simon-resume-button` restores it and calls `MuchogamesMatch.resume()`.
