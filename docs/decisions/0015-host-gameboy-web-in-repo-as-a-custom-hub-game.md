# 0015 — Host GameBoy Web in-repo as a custom hub game

Date: 2026-09-01
Status: Accepted
Decision: Ship the GameBoy Web player inside Bergamots (`kind: custom`, `/games/gameboy-web/index.html`) instead of linking the GitHub repo, and let the player open local `.gb` / `.gbc` files in the browser.
Context: The hub tile first launched `https://github.com/Potatoe415/gameboy-web`. The user asked for the tile to launch the application. The sibling project has no public host, GitHub Pages 404s, and its ROM folder listing depends on `python -m http.server`. Copyrighted ROMs in the sibling `ROM/` folder must not be committed or deployed.
Rationale: Bergamots already hosts custom games on the same Vercel project the user clicks from. Vendoring the binjgb web player (`public/games/gameboy-web/vendor/`, eslint-ignored like other vendor trees) plus a file picker makes the tile playable on `npm run dev` and in production without a second host and without uploading ROMs. Files chosen in the picker stay in memory on the device.
Consequences: Bergamots now contains a copy of the binjgb web player (~88 KB wasm). The sibling `gameboy-web` repo remains the place to develop the local `run.bat` player; this copy can drift. Nintendo ROMs stay out of git. `docs/PRODUCT.md` / `docs/TECH.md` still describe a vanilla hub; WASM is confined to this one custom game.
Alternatives_Rejected: Keep the GitHub URL - that is a source listing, not the player. Deploy gameboy-web as its own Vercel app - would invent a host for a project whose PRODUCT still says hosting is unchosen, and GitHub currently stores `binjgb` as a gitlink so a git-linked deploy would miss the emulator files. Point at `localhost:8080` - works only when `run.bat` is already running, and fails on the live hub.
