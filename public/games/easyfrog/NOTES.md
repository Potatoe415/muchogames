# Easy Frog — notes for agents

The owner's road-and-pond crossing game ("EasyFrog by Falcon"), ported on 2026-11-05 from its own repo (`easyfrog`, Vite, deployed at easyfrog.web.app) into a `custom` game here. Rules, balance, sprites and sounds are the original's; the page shell (Game Dashboard, shared header, coins, best, resume, FR/EN/ES, TV) is new. Vanilla ES modules, canvas 720×880 logical (9 × 11 cells of 80), Web Audio, no dependency. Read this before opening the sources.

## Files

| File | Role |
|---|---|
| `main.js` | Page shell: i18n, options (language, 4 toggles, collapsed rules), dashboard (best per difficulty, Resume, Facile / Normal), pause / end overlays, `MuchogamesMatch.start/resume/finish`, save, best. |
| `game.js` | `createGame({ canvas, board, images, audio, settings, difficulty, saved, onHud, onSave, onEnd })` → `{ move, pause, resume, cheat, snapshot, destroy }`. Level setup, per-frame update, rAF loop (dt capped at 0.1 s), zone sounds, timer. |
| `rules.js` | Collisions: flies, home slots / level up / victory, cars + train, riding the river, death (`die`), car-gap keeping. |
| `entities.js`, `flies.js`, `player.js` | Cars, train, logs / lily pads / turtles / crocodile, diving turtle; fly + chaos fly; the frog (crouch → jump → squash, buffered input). |
| `levels.js`, `lanes.js`, `balance.js`, `balance-easy.js`, `difficulty.js` | Road lanes per level; every tunable value (Normal 7 levels with timer, Easy 5 slower levels without). |
| `renderer.js`, `view.js`, `assets.js`, `audio.js` | Board drawing; canvas fit + backing store at screen pixels (auto-lowered under ~45 fps); images (`_mod1` = "Look moderne"); sounds. |
| `input.js`, `hud.js` | Keys (arrows / WASD, Escape or P pause, F8 god mode, F9 skip level), swipes on the board, D-pad; HUD. |
| `snapshot.js`, `save.js`, `prefs.js`, `i18n.js` | Match JSON + validation; save key; settings / language / best; copy + rules. |
| `style.css`, `stage.css` | Frame, dashboard, cards, overlays; play screen (HUD, fitted board, D-pad under it in portrait, beside it in landscape, hidden with a fine pointer or on TV). |

## Rules in code

- Win: fill enough of the 4 top slots (`requiredWins` per level) to reach the next level; clearing the last level is a victory. Slot +200, fly +500 and +1 life (max 5, once per level), death −10,000 Normal / −5,000 Easy (floored at 0). Normal levels have a time limit; each slot adds 5 s.
- Chaos fly (inverted-colour fly) from level 4 Normal / 5 Easy: touching it flips the screen for 4 s. Train on the middle verge from level 5.
- `finish({ won, score })`: `won: true` on victory, `false` on game over. Best per difficulty: `muchogames_easyfrog_best` (Normal), `muchogames_easyfrog_best_easy`.
- F8 / F9 are the original owner test cheats, kept as-is.

## Saved match (decision 0054)

- Key `muchogames_easyfrog_save`, `v: 1`: difficulty, level, score, lives, slots, dead-frog marks, timer, chaos-flip time, frog cell, fly + chaos fly, every car (sprite, row, speed, x) and river object (x, dive phase). Every field is checked on load (`isValidSnapshot`).
- Written at match start, after every slot / fly / death / level, at least once a second, on pause and on `pagehide`; deleted when the end card shows, before `finish()`.
- Resume comes back paused; the respawn blink is not saved.

## Settings

`muchogames_easyfrog_settings`: `soundEnabled`, `animationEnabled`, `objectsMovementEnabled`, `modernLook`. The original's "Plein écran" toggle was dropped: on a TV, `MuchogamesTv.play()` goes fullscreen.
