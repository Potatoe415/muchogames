# 0049 — Space Cadet uses alula's prebuilt Emscripten binaries

Date: 2026-10-25
Status: Accepted
Decision: Ship 3D Pinball: Space Cadet from the unmodified prebuilt
`SpaceCadetPinball.js` / `.wasm` / `.data` published at
https://alula.github.io/SpaceCadetPinball/, vendored in
`public/games/spacecadet/vendor/`.
Context: The owner asked to drop the table into the hub with no rebuild.
Rationale: alula's GitHub Pages already hosts a working SDL2/Emscripten
build. Recompiling would add a C++/Emscripten toolchain for no player-facing
gain. The same pattern as Chip's Challenge (decision 0048): vendor the
engine, wrap our chrome and touch controls around it.
Consequences: The table binary is not built in this repo. Refreshing it
means replacing the three vendor files together. Original Windows table
data inside `.data` is copyrighted Microsoft material, same fan-remake
stance as SkiFree / Chip's Challenge.
Alternatives_Rejected: Compile k4zmu2a/SpaceCadetPinball with Emscripten
in CI (toolchain, long builds). iframe the alula site (third-party
origin, no coins/header, CSP). Rewrite the table (out of scope).
