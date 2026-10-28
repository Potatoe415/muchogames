# Space Cadet — notes for agents

Solo 3D Pinball: Space Cadet in the browser. Prebuilt Emscripten binaries
from https://alula.github.io/SpaceCadetPinball/ (decision 0049). Do not
recompile. Read this before opening the sources.

## Files

| File | Role |
|---|---|
| `index.html` | Shared header/options chrome, Win95 touch bars, `#canvas.emscripten`. |
| `boot.js` | Classic script: `window.Module` + `locateFile` → `vendor/` + download status, before the glue. |
| `main.js` | i18n, options panel, `MuchogamesMatch.start` on F2 / first plunge. |
| `overlay.js` | Pointer pads and PC mouse buttons → `keydown`/`keyup`; unlocks SDL2 audio. |
| `score.js` | Copies the scoreboard row into the phone header line (needs `preserveDrawingBuffer`, forced in `boot.js`). |
| `sound.js` | Mute toggle (suspends the SDL2 AudioContext, `spacecadet-muted` in localStorage). |
| `keys.js` | SDL2 key map (`z`, Space, `/`, F2, F3, `x`). |
| `i18n.js` | FR/EN/ES copy + rules HTML. |
| `styles.css` | Desktop table + scoreboard. Phone: table only, one score line. |
| `vendor/SpaceCadetPinball.{js,wasm,data}` | Unmodified prebuilt runtime. |
| `assets/thumbnail.jpg` | Hub tile (upstream screenshot). |

## Controls

- Left flipper: `z`, the left touch half, or the left mouse button.
- Right flipper: `/`, the right touch half, or the right mouse button.
- Plunger: hold Space, the Launch button, or the bottom-right of the table on a phone.
- F2 new game (1 coin), F3 pause, `x` tilt.
- WASM does not report game over: F2 while a match is running `finish()` then `start()`; leaving via back confirms.

## Layout

- The WASM draws a 19 px ImGui menu bar (Game/Options/Help) with no hide option. Once a match starts, `body.sc-playing` crops it off (canvas `margin-top: -19px`) and a `resize` event makes SDL resize its buffer.
- The table + scoreboard are stretched to the canvas below that bar, so `score.js` reads the score row by fractions of that area.

## Do not

- Edit `vendor/`. Replace the three files together from alula's GitHub Pages if they must be refreshed.
