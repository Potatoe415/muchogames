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
| `overlay.js` | Pointer pads → `keydown`/`keyup` on `window`; unlocks SDL2 audio. |
| `keys.js` | SDL2 key map (`z`, Space, `/`, F2, F3, `x`). |
| `i18n.js` | FR/EN/ES copy + rules HTML. |
| `styles.css` | Full-screen table + Win95 beveled buttons. |
| `vendor/SpaceCadetPinball.{js,wasm,data}` | Unmodified prebuilt runtime. |
| `assets/thumbnail.jpg` | Hub tile (upstream screenshot). |

## Controls

- Left flipper: `z` (button + left half of the canvas).
- Right flipper: `/` (button + right half of the canvas).
- Plunger: hold Space, release to launch.
- F2 new game (1 coin), F3 pause, `x` tilt.
- WASM does not report game over: F2 while a match is running `finish()` then `start()`; leaving via back confirms.

## Do not

- Edit `vendor/`. Replace the three files together from alula's GitHub Pages if they must be refreshed.
