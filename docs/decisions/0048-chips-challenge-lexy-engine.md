# 0048 — Chip's Challenge rules from Lexy's Labyrinth (vendored, Lynx ruleset)

Date: 2026-10-25
Status: Accepted
Decision: `chipschallenge` simulates its 149 original levels (`assets/CHIPS.DAT`) with the game logic of Lexy's Labyrinth (github.com/eevee/lexys-labyrinth, MIT), vendored verbatim under `public/games/chipschallenge/vendor/lexy/` and run with its Lynx ruleset; our own code keeps the Windows 3.1 chrome, the original MS tiles, LED panel, inventory, D-pad, sounds, progress and platform rules.
Context: Owner asked for every level exactly like the original and to reuse a GitHub project that already does it (2026-10-25), and chose "Lexy's engine under our interface" over embedding Lexy's whole UI or keeping the in-house engine.
Rationale: Replaying the public Tile World solutions headlessly, Lexy's Lynx mode wins 147/149 CHIPS.DAT levels (85 TELENET loses, 145 credits level has no usable replay); its "ms" mode only matched 23/149 MS solutions, and the in-house engine was only proven on 12 levels. MIT allows vendoring; plain ES modules, no build step, no DOM in the game logic.
Consequences: ~400 KB of third-party JS served unbundled (excluded from ESLint, Prettier and the platform check; `.d.ts` stubs keep `tsc --checkJs` on our code only). Gameplay follows Atari Lynx rules where they differ from CHIPS.EXE (e.g. monster timing, force floors). Updating means re-copying the same files from a newer commit and re-running the replay check (see the game's `NOTES.md`).
Alternatives_Rejected: Embed Lexy's full UI (loses the requested Windows 3.1 look and our platform chrome). Keep the in-house engine (rules only approximated, mostly unverified). chipdx (Rust/WASM, GPL-3). Lexy's "ms" ruleset (does not reproduce MS timing).
