# Lexy's Labyrinth — vendored rules engine

- Source: https://github.com/eevee/lexys-labyrinth (MIT, see `LICENSE`),
  commit `c86661cbbbde39beb1d3386cf19f290462693e54` (2024-06-20).
- Copied verbatim, unmodified: `js/game.js`, `js/defs.js`, `js/tiletypes.js`,
  `js/algorithms.js`, `js/format-base.js`, `js/format-dat.js`, `js/util.js`,
  `js/vendor/fflate.js` (fflate 0.6.7, MIT, by 101arrowz).
- Only the game logic and the CHIPS.DAT reader are used; Lexy's UI, editor,
  renderer and assets are not. The `*.d.ts` files are ours (type stubs so
  `tsc --checkJs` does not type-check this third-party code).
- To update: copy the same files from a newer commit, then re-run the
  replay check described in `../../NOTES.md`.
